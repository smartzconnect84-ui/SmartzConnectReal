import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse, requireUser, signJwtHS256, nowAndExpiry } from '../_shared/sessionService.ts'

const WORLD_CHANNEL_ID   = 'smartz-worldchat-v2'
const WORLD_CHANNEL_TYPE = 'livestream'
const STREAM_API_BASE    = 'https://chat.stream-io-api.com'

/**
 * Create a server-to-server JWT for Stream's Management API.
 * This is a token signed with the app secret with user_id = "server".
 */
async function serverJwt(apiKey: string, secret: string): Promise<string> {
  const { now, exp } = nowAndExpiry(60) // 1-minute server token
  return signJwtHS256({ user_id: 'server', iat: now, exp }, secret)
}

/**
 * Ensure the authenticated user is a member of the world chat channel.
 * If not, add them. If the channel doesn't exist yet, create it.
 * Non-fatal — if this fails we still return the user token and log the error.
 */
async function ensureWorldChatMember(userId: string, apiKey: string, secret: string) {
  try {
    const jwt = await serverJwt(apiKey, secret)
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
      'Stream-Auth-Type': 'jwt',
    }
    const base = `${STREAM_API_BASE}/channels/${WORLD_CHANNEL_TYPE}/${WORLD_CHANNEL_ID}`

    // Upsert the channel (create if not exists, no-op if it does).
    // Stream returns 201 (created) or 200 (existing channel returned).
    const upsertRes = await fetch(`${base}?api_key=${apiKey}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: { name: 'World Chat', created_by_id: 'server' },
        members: [{ user_id: userId }],
      }),
    })
    if (!upsertRes.ok) {
      const body = await upsertRes.text().catch(() => '(unreadable)')
      console.error(`ensureWorldChatMember: channel upsert ${upsertRes.status} — ${body}`)
      return
    }

    // Add the user as a member (idempotent — Stream ignores duplicates).
    const memberRes = await fetch(`${base}/member?api_key=${apiKey}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ add_members: [{ user_id: userId }] }),
    })
    if (!memberRes.ok) {
      const body = await memberRes.text().catch(() => '(unreadable)')
      console.error(`ensureWorldChatMember: member add ${memberRes.status} — ${body}`)
    }
  } catch (err) {
    console.warn('ensureWorldChatMember failed (non-fatal):', err)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, error, supabaseUrl } = await requireUser(req)
    if (error) return error

    const userId = user!.id

    // ── Resolve stream secret: env var takes priority, then fall back to admin_config ──
    let streamSecret = Deno.env.get('STREAM_API_SECRET') || Deno.env.get('STREAM_SECRET')
    // STREAM_API_KEY must be set in Supabase secrets — no hardcoded fallback.
    const streamApiKey = Deno.env.get('STREAM_API_KEY')
    if (!streamApiKey) {
      console.error('STREAM_API_KEY not configured in edge function secrets')
      return jsonResponse({ error: 'Stream not configured' }, 500)
    }

    if (!streamSecret) {
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const adminClient = createClient(supabaseUrl!, serviceKey)
      const { data: cfgRow } = await adminClient
        .from('admin_config')
        .select('value')
        .eq('key', 'getstream_api_secret')
        .single()

      if (!cfgRow?.value || cfgRow.value.startsWith('REPLACE_')) {
        console.error('Stream secret not configured')
        return jsonResponse({ error: 'Stream not configured' }, 500)
      }
      streamSecret = cfgRow.value
    }

    const { now, exp } = nowAndExpiry(60 * 60 * 24) // 24 hours

    const token = await signJwtHS256({ user_id: userId, iat: now, exp }, streamSecret)

    // Add user to world chat channel (best-effort, non-fatal)
    await ensureWorldChatMember(userId, streamApiKey, streamSecret)

    // Cache token in Supabase (best-effort)
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (serviceKey) {
      const adminClient = createClient(supabaseUrl!, serviceKey)
      await adminClient.from('stream_tokens').upsert({
        user_id: userId,
        token,
        expires_at: new Date(exp * 1000).toISOString(),
      }, { onConflict: 'user_id' }).then(({ error: e }) => {
        if (e) console.error('stream_tokens upsert failed:', e.message)
      })
    }

    return jsonResponse({ token, userId })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
