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

    const { userId, title, message, url } = await req.json()

    if (!userId || !title || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, title, message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Authorise: caller must have a match with the target ───────────────
    // Users can only push-notify someone they are matched with.
    // Use service role so we can read matches regardless of RLS.
    const adminClient = createClient(supabaseUrl, serviceKey)
    const [a, b] = [user.id, userId].sort()
    const { data: match } = await adminClient
      .from('matches')
      .select('id')
      .eq('user_a', a)
      .eq('user_b', b)
      .maybeSingle()

    // Also allow pushing one's own device (e.g. multi-device notifications)
    const isSelf = user.id === userId
    if (!match && !isSelf) {
      return new Response(JSON.stringify({ error: 'Forbidden: no match with target user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 3. Send via OneSignal ────────────────────────────────────────────────
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalKey   = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!oneSignalAppId || !oneSignalKey) {
      return new Response(JSON.stringify({ error: 'OneSignal not configured on server' }), {
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
    if (url) payload.url = url

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
