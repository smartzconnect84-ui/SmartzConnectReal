import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse, requireUser, signJwtHS256, nowAndExpiry } from '../_shared/sessionService.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, error, supabaseUrl } = await requireUser(req)
    if (error) return error

    const streamSecret = Deno.env.get('STREAM_API_SECRET')
    if (!streamSecret) {
      return jsonResponse({ error: 'Stream not configured' }, 500)
    }

    const userId = user!.id
    const { now, exp } = nowAndExpiry(60 * 60 * 24) // 24 hours

    const token = await signJwtHS256({ user_id: userId, iat: now, exp }, streamSecret)

    // Cache token in Supabase (Supabase remains the data owner of stream_tokens;
    // the Session Service only signs the token, it does not own storage of it)
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl!, serviceKey)
    const { error: upsertError } = await adminClient.from('stream_tokens').upsert({
      user_id: userId,
      token,
      expires_at: new Date(exp * 1000).toISOString(),
    }, { onConflict: 'user_id' })
    if (upsertError) {
      console.error('stream_tokens upsert failed:', upsertError.message)
      // Non-fatal: token is still valid, caching is best-effort
    }

    return jsonResponse({ token, userId })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
