import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Authenticate caller ───────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { userId, title, message, url, type, emoji, actionUrl, persist } = body

    if (!userId || !title || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, title, message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Optionally persist a notification row ─────────────────────────────
    // No match check — any authenticated user can notify any other user.
    // This covers follows, likes, comments, matches, spin connections, etc.
    if (persist !== false) {
      const adminClient = createClient(supabaseUrl, serviceKey)
      await adminClient.from('notifications').insert({
        user_id:      userId,
        from_user_id: user.id,
        type:         type || 'system',
        title,
        body:         message,
        emoji:        emoji || '🔔',
        action_url:   actionUrl || url || null,
        read:         false,
      }).then(() => {}) // fire-and-forget, don't fail push on DB error
    }

    // ── 3. Send via OneSignal ────────────────────────────────────────────────
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalKey   = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!oneSignalAppId || !oneSignalKey) {
      // DB row may have been persisted — treat push failure as non-fatal
      return new Response(JSON.stringify({ error: 'OneSignal not configured on server', persisted: persist !== false }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload: Record<string, unknown> = {
      app_id:   oneSignalAppId,
      headings: { en: title },
      contents: { en: message },
      // Target by external_id set via OneSignal.login(userId)
      include_aliases:  { external_id: [userId] },
      target_channel: 'push',
    }

    const pushUrl = url || actionUrl
    if (pushUrl) payload.url = pushUrl

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${oneSignalKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await res.json()

    return new Response(JSON.stringify({ success: res.ok, result }), {
      status: res.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
