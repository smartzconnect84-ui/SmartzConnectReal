import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse, signJwtHS256, nowAndExpiry } from '../_shared/sessionService.ts'

/**
 * Public LiveKit viewer token — no user auth required.
 * Enforces server-side: only issues tokens for streams that are:
 *   - is_admin_broadcast = true
 *   - status = 'live'
 * This prevents anonymous users from accessing community/user streams.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('LIVEKIT_API_KEY')
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET')
    if (!apiKey || !apiSecret) {
      return jsonResponse({ error: 'LiveKit not configured' }, 500)
    }

    const { room } = await req.json().catch(() => ({ room: null }))
    if (!room || typeof room !== 'string') {
      return jsonResponse({ error: 'room is required' }, 400)
    }

    // Room format: smartz-tv-{stream_id} — extract the stream ID
    const ROOM_PREFIX = 'smartz-tv-'
    if (!room.startsWith(ROOM_PREFIX)) {
      return jsonResponse({ error: 'Invalid room' }, 403)
    }

    const streamId = room.slice(ROOM_PREFIX.length)
    if (!streamId) {
      return jsonResponse({ error: 'Invalid room' }, 403)
    }

    // Verify this stream is an active admin broadcast in the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server configuration error' }, 500)
    }

    const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const { data: stream, error: dbErr } = await db
      .from('livestreams')
      .select('id, status, is_admin_broadcast')
      .eq('id', streamId)
      .eq('is_admin_broadcast', true)
      .eq('status', 'live')
      .maybeSingle()

    if (dbErr) {
      return jsonResponse({ error: 'Database error' }, 500)
    }

    if (!stream) {
      // Stream not found, not live, or not an admin broadcast — deny
      return jsonResponse({ error: 'Stream is not available for public viewing' }, 403)
    }

    const { now, exp } = nowAndExpiry(60 * 60 * 4) // 4-hour viewer token
    const identity = `public-viewer-${crypto.randomUUID().slice(0, 8)}`

    const payload = {
      iss: apiKey,
      sub: identity,
      iat: now,
      nbf: now,
      exp,
      name: 'Visitor',
      video: {
        room,
        roomJoin: true,
        canPublish: false,       // viewers cannot broadcast
        canSubscribe: true,
        canPublishData: false,
      },
    }

    const token = await signJwtHS256(payload, apiSecret)
    const wsUrl = Deno.env.get('LIVEKIT_WS_URL') || ''

    return jsonResponse({ token, wsUrl, room, identity })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
