import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse, requireUser, signJwtHS256, nowAndExpiry } from '../_shared/sessionService.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, error } = await requireUser(req)
    if (error) return error

    const apiKey = Deno.env.get('LIVEKIT_API_KEY')
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET')
    if (!apiKey || !apiSecret) {
      return jsonResponse({ error: 'LiveKit not configured' }, 500)
    }

    const { room, name } = await req.json().catch(() => ({ room: null, name: null }))
    if (!room) {
      return jsonResponse({ error: 'room is required' }, 400)
    }

    const { now, exp } = nowAndExpiry(60 * 60 * 6) // 6 hours

    const payload = {
      iss: apiKey,
      sub: user!.id,
      iat: now,
      nbf: now,
      exp,
      name: name || user!.email || 'SmartzConnect User',
      video: {
        room,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
    }

    const token = await signJwtHS256(payload, apiSecret)
    const wsUrl = Deno.env.get('LIVEKIT_WS_URL') || ''

    return jsonResponse({ token, wsUrl, room, identity: user!.id })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
