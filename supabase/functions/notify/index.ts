/**
 * notify — unified notification edge function
 *
 * Called server-side (from stream-webhook, DB triggers, or internal tools)
 * to both INSERT a notification row and fire a push notification.
 *
 * Authorization: requires either a valid Supabase user JWT (app-level call)
 * or the service-role key (server-side call).
 *
 * Body schema:
 *   to_user_id  string   — recipient's profile UUID
 *   type        string   — notification type (match|like|message|group|system|follow|spin|call|comment|promo)
 *   title       string   — notification title (also push heading)
 *   body        string   — notification body text (also push content)
 *   emoji?      string   — emoji icon (default 🔔)
 *   action_url? string   — deep-link URL opened on notification click
 *   from_user_id? string — sender profile UUID (may be omitted for system events)
 *   push?       boolean  — send push notification (default true)
 *   persist?    boolean  — insert DB row (default true)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-service-key',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Allow service-role callers (e.g. stream-webhook) to bypass user auth
    const serviceHeader = req.headers.get('x-service-key')
    const authHeader    = req.headers.get('Authorization')
    let fromUserId: string | null = null

    if (serviceHeader && serviceHeader === serviceKey) {
      // Trusted server-side call — skip JWT validation
    } else if (authHeader) {
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
      fromUserId = user.id
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      to_user_id,
      type     = 'system',
      title,
      body,
      emoji    = '🔔',
      action_url,
      from_user_id,
      push     = true,
      persist  = true,
    } = await req.json()

    if (!to_user_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to_user_id, title, body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const effectiveFromUser = from_user_id || fromUserId
    const adminClient = createClient(supabaseUrl, serviceKey)

    // ── 1. Persist notification row ──────────────────────────────────────────
    if (persist) {
      await adminClient.from('notifications').insert({
        user_id:      to_user_id,
        from_user_id: effectiveFromUser,
        type,
        title,
        body,
        emoji,
        action_url: action_url || null,
        read:         false,
      })
    }

    // ── 2. Send OneSignal push ───────────────────────────────────────────────
    let pushResult: unknown = null
    if (push) {
      const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
      const oneSignalKey   = Deno.env.get('ONESIGNAL_REST_API_KEY')

      if (oneSignalAppId && oneSignalKey) {
        const payload: Record<string, unknown> = {
          app_id:   oneSignalAppId,
          headings: { en: title },
          contents: { en: body },
          include_aliases: { external_id: [to_user_id] },
          target_channel: 'push',
        }
        if (action_url) payload.url = action_url

        const res = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${oneSignalKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        pushResult = await res.json()
      }
    }

    return new Response(JSON.stringify({ success: true, push: pushResult }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
