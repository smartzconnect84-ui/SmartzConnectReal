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

    const userId = user!.id
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl!, serviceKey)

    // ── Resolve stream secret: env var takes priority, then fall back to admin_config ──
    let streamSecret = Deno.env.get('STREAM_API_SECRET') || Deno.env.get('STREAM_SECRET')

    if (!streamSecret) {
      // Attempt to read the secret from the admin_config table in the database.
      // This allows the function to work even when the Supabase edge-function secret
      // is not set — the secret is stored securely in the DB row.
      const { data: cfgRow, error: cfgErr } = await adminClient
        .from('admin_config')
        .select('value')
        .eq('key', 'getstream_api_secret')
        .single()

      if (cfgErr || !cfgRow?.value || cfgRow.value.startsWith('REPLACE_')) {
        console.error('Stream secret not configured (env var and admin_config both missing)')
        return jsonResponse({ error: 'Stream not configured' }, 500)
      }
      streamSecret = cfgRow.value
    }

    const { now, exp } = nowAndExpiry(60 * 60 * 24) // 24 hours

    const token = await signJwtHS256({ user_id: userId, iat: now, exp }, streamSecret)

    // Cache token in Supabase (best-effort — non-fatal if it fails)
    const { error: upsertError } = await adminClient.from('stream_tokens').upsert({
      user_id: userId,
      token,
      expires_at: new Date(exp * 1000).toISOString(),
    }, { onConflict: 'user_id' })
    if (upsertError) {
      console.error('stream_tokens upsert failed:', upsertError.message)
    }

    return jsonResponse({ token, userId })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
