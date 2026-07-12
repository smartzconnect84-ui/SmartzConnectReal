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

    // Mux: POST /video/v1/live-streams/{id}/reset-stream-key
    const muxRes = await fetch(
      `https://api.mux.com/video/v1/live-streams/${stream_id}/reset-stream-key`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${creds}` },
      },
    )

    if (!muxRes.ok) {
      const errText = await muxRes.text()
      console.error('Mux rotate key error:', errText)
      return json({ error: `Mux API error: ${muxRes.status}` }, 502)
    }

    const muxData = await muxRes.json()
    const newKey  = muxData.data?.stream_key as string | undefined

    if (!newKey) return json({ error: 'Mux did not return a new stream key' }, 502)

    // Persist new key + derived SRT URL to DB
    if (channel_id) {
      const srtUrl  = `srt://global-live.mux.com:5001?streamid=live_${newKey}`
      const whipUrl = `https://global-live.mux.com:443/app/${newKey}`
      await supabase.from('tv_channels').update({
        stream_key: newKey,
        srt_url:    srtUrl,
        whip_url:   whipUrl,
      }).eq('id', channel_id)
    }

    return json({ stream_key: newKey, success: true })
  } catch (err) {
    console.error('mux-rotate-key error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
