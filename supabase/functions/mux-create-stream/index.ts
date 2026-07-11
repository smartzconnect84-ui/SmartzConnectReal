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

    // Must be an admin
    const { data: adminRow } = await supabase
      .from('admin_users').select('id').eq('id', user.id).maybeSingle()
    if (!adminRow) return json({ error: 'Admin only' }, 403)

    // ── Mux credentials ─────────────────────────────────────────────────────
    const muxTokenId     = Deno.env.get('MUX_TOKEN_ID')
    const muxTokenSecret = Deno.env.get('MUX_TOKEN_SECRET')
    if (!muxTokenId || !muxTokenSecret) {
      return json({ error: 'Mux credentials not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET in Supabase edge function secrets.' }, 500)
    }

    const { channel_id, latency_mode = 'low' } = await req.json().catch(() => ({}))

    // ── Create Mux live stream ───────────────────────────────────────────────
    const credentials = btoa(`${muxTokenId}:${muxTokenSecret}`)

    const muxRes = await fetch('https://api.mux.com/video/v1/live-streams', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playback_policy: ['public'],
        new_asset_settings: { playback_policy: ['public'] },
        latency_mode,
        max_continuous_duration: 43200,  // 12 hours
        reconnect_window: 60,
      }),
    })

    if (!muxRes.ok) {
      const errText = await muxRes.text()
      console.error('Mux API error:', errText)
      return json({ error: `Mux API error: ${muxRes.status}` }, 502)
    }

    const muxData = await muxRes.json()
    const stream = muxData.data

    const streamId    = stream.id
    const streamKey   = stream.stream_key
    const playbackId  = stream.playback_ids?.[0]?.id
    const rtmpUrl     = 'rtmps://global-live.mux.com:443/app'
    const hlsUrl      = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null

    // ── Persist to tv_channels (if channel_id provided) ─────────────────────
    if (channel_id) {
      const { error: updateErr } = await supabase
        .from('tv_channels')
        .update({
          mux_stream_id:   streamId,
          mux_playback_id: playbackId ?? null,
          stream_key:      streamKey,
          rtmp_url:        rtmpUrl,
          playback_url:    hlsUrl,
          stream_status:   'idle',
        })
        .eq('id', channel_id)

      if (updateErr) console.error('DB update error:', updateErr)
    }

    return json({
      stream_id:    streamId,
      stream_key:   streamKey,
      playback_id:  playbackId,
      rtmp_url:     rtmpUrl,
      playback_url: hlsUrl,
    })
  } catch (err) {
    console.error('mux-create-stream error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
