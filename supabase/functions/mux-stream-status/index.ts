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
    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase     = createClient(supabaseUrl, supabaseKey)

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    // Must be admin
    const { data: adminRow } = await supabase
      .from('admin_users').select('id').eq('id', user.id).maybeSingle()
    if (!adminRow) return json({ error: 'Admin only' }, 403)

    // ── Mux credentials ─────────────────────────────────────────────────────
    const muxTokenId     = Deno.env.get('MUX_TOKEN_ID')
    const muxTokenSecret = Deno.env.get('MUX_TOKEN_SECRET')
    if (!muxTokenId || !muxTokenSecret) {
      return json({ error: 'Mux credentials not configured' }, 500)
    }

    const { stream_id, channel_id } = await req.json().catch(() => ({}))
    if (!stream_id) return json({ error: 'stream_id is required' }, 400)

    // ── Fetch from Mux ───────────────────────────────────────────────────────
    const credentials = btoa(`${muxTokenId}:${muxTokenSecret}`)

    const muxRes = await fetch(`https://api.mux.com/video/v1/live-streams/${stream_id}`, {
      headers: { 'Authorization': `Basic ${credentials}` },
    })

    if (!muxRes.ok) {
      if (muxRes.status === 404) return json({ status: 'not_found' })
      return json({ error: `Mux API error: ${muxRes.status}` }, 502)
    }

    const { data } = await muxRes.json()
    const status = data.status  // idle | active | disconnected

    // ── Sync stream_status back to DB ────────────────────────────────────────
    if (channel_id) {
      await supabase
        .from('tv_channels')
        .update({ stream_status: status })
        .eq('id', channel_id)
    }

    return json({
      status,
      active_ingest_session_id: data.active_ingest_session_id ?? null,
      recent_asset_ids: data.recent_asset_ids ?? [],
    })
  } catch (err) {
    console.error('mux-stream-status error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
