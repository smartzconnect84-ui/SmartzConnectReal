import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: adminRow } = await supabase
      .from('admin_users').select('id').eq('id', user.id).maybeSingle()
    if (!adminRow) return json({ error: 'Admin only' }, 403)

    const muxTokenId     = Deno.env.get('MUX_TOKEN_ID') || Deno.env.get('MUX_ACCESS_TOKEN_ID')
    const muxTokenSecret = Deno.env.get('MUX_TOKEN_SECRET') || Deno.env.get('MUX_SECRET_KEY')
    if (!muxTokenId || !muxTokenSecret) {
      return json({ error: 'Mux credentials not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET in Supabase secrets.' }, 500)
    }

    const { stream_id, channel_id } = await req.json().catch(() => ({}))
    if (!stream_id) return json({ error: 'stream_id required' }, 400)

    const creds = btoa(`${muxTokenId}:${muxTokenSecret}`)

    // ── Fetch stream details from Mux ─────────────────────────────────────────
    const [streamRes, assetRes] = await Promise.all([
      fetch(`https://api.mux.com/video/v1/live-streams/${stream_id}`, {
        headers: { Authorization: `Basic ${creds}` },
      }),
      // Attempt to get active input info (available when encoder is connected)
      fetch(`https://api.mux.com/video/v1/live-streams/${stream_id}/simulcast-targets`, {
        headers: { Authorization: `Basic ${creds}` },
      }).catch(() => null),
    ])

    if (!streamRes.ok) {
      return json({ error: `Mux API error: ${streamRes.status}` }, 502)
    }

    const muxData = await streamRes.json()
    const stream  = muxData.data
    const muxStatus = stream.status as string  // 'active' | 'idle' | 'disconnected'
    const newStatus: 'active' | 'idle' | 'disconnected' =
      muxStatus === 'active' ? 'active'
      : muxStatus === 'disconnected' ? 'disconnected'
      : 'idle'

    // Build health snapshot
    const healthData = {
      status:                  newStatus,
      mux_status:              muxStatus,
      reconnect_window:        stream.reconnect_window  ?? 60,
      max_continuous_duration: stream.max_continuous_duration ?? 43200,
      latency_mode:            stream.latency_mode ?? 'low',
      reduced_latency:         stream.reduced_latency ?? false,
      low_latency:             stream.low_latency ?? false,
      srt_passphrase:          stream.srt_passphrase ?? null,
      checked_at:              new Date().toISOString(),
      active_assets:           (stream.recent_asset_ids ?? []).length,
    }

    // ── Persist health snapshot to DB ─────────────────────────────────────────
    if (channel_id) {
      const update: Record<string, unknown> = {
        stream_status: newStatus,
        health_data:   healthData,
      }
      if (newStatus === 'active') {
        update.last_broadcast_at = new Date().toISOString()
      }
      await supabase.from('tv_channels').update(update).eq('id', channel_id)
    }

    return json({
      status:             newStatus,
      mux_status:         muxStatus,
      reconnect_window:   stream.reconnect_window,
      latency_mode:       stream.latency_mode,
      srt_passphrase:     stream.srt_passphrase,
      health:             healthData,
    })
  } catch (err) {
    console.error('mux-stream-health error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
