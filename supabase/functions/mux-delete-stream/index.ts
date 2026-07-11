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

    // ── Delete from Mux ──────────────────────────────────────────────────────
    const credentials = btoa(`${muxTokenId}:${muxTokenSecret}`)

    const muxRes = await fetch(`https://api.mux.com/video/v1/live-streams/${stream_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` },
    })

    // 204 = deleted, 404 = already gone — both are acceptable
    if (!muxRes.ok && muxRes.status !== 404) {
      return json({ error: `Mux API error: ${muxRes.status}` }, 502)
    }

    // ── Clear Mux fields from DB ─────────────────────────────────────────────
    if (channel_id) {
      await supabase
        .from('tv_channels')
        .update({
          mux_stream_id:   null,
          mux_playback_id: null,
          stream_key:      null,
          rtmp_url:        null,
          playback_url:    null,
          stream_status:   'idle',
          is_active:       false,
        })
        .eq('id', channel_id)
    }

    return json({ success: true })
  } catch (err) {
    console.error('mux-delete-stream error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
