import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_ICON = 'https://www.smartzconnect.com/icon-192.png'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Authenticate caller ───────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { userId, title, message, url, type, emoji, actionUrl, persist, imageUrl } = body

    if (!userId || !title || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, title, message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cap payload sizes — a caller with a valid session but no legitimate
    // reason to notify someone could otherwise craft oversized/abusive pushes.
    if (title.length > 120 || message.length > 500) {
      return new Response(JSON.stringify({ error: 'title/message too long' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Authorization guard ─────────────────────────────────────────────────
    // Users can only push to others for allowed social notification types.
    // This prevents spam — a caller cannot craft arbitrary push blasts.
    const ALLOWED_TYPES = new Set([
      'message', 'match', 'like', 'comment', 'follow', 'spin',
      'gift', 'call', 'video', 'award', 'premium', 'system',
      // Extended types
      'missed_call', 'story', 'reel', 'post', 'friend_request',
      'job', 'marketplace', 'worldstage', 'announcement', 'broadcast',
      'smartztv', 'learning', 'dating', 'group_message', 'stream_invite',
    ])
    const notifTypeRaw = (type || 'system').toLowerCase()
    if (!ALLOWED_TYPES.has(notifTypeRaw)) {
      return new Response(JSON.stringify({ error: 'Notification type not allowed' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Broadcast-style types can fan out to arbitrary users and are reserved for
    // admin-triggered actions (go-live, publish, announce). Require the caller
    // to be a recognized admin/staff account to prevent spam/impersonation.
    const ADMIN_ONLY_TYPES = new Set(['announcement', 'broadcast', 'worldstage', 'smartztv', 'learning'])
    if (ADMIN_ONLY_TYPES.has(notifTypeRaw)) {
      const adminCheckClient = createClient(supabaseUrl, serviceKey)
      const { data: adminRow } = await adminCheckClient
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      if (!adminRow) {
        return new Response(JSON.stringify({ error: 'Admin privileges required for this notification type' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }
    // Prevent self-push loops (callers may notify themselves for system types)
    // For social types, sender ≠ recipient is enforced silently — it degrades to persist-only.
    const isSelfPush = user.id === userId

    // Reject pushes to non-existent recipients — a valid session should not be
    // enough to blast arbitrary/random UUIDs; the target must be a real user.
    if (!isSelfPush) {
      const adminCheckClient = createClient(supabaseUrl, serviceKey)
      const { data: recipient } = await adminCheckClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      if (!recipient) {
        return new Response(JSON.stringify({ error: 'Recipient not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ── 2. Persist notification row ─────────────────────────────────────────
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
      }).then(() => {})
    }

    // ── 3. Send via OneSignal ────────────────────────────────────────────────
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalKey   = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!oneSignalAppId || !oneSignalKey) {
      return new Response(JSON.stringify({ error: 'OneSignal not configured', persisted: persist !== false }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pushUrl = url || actionUrl
    const notifType = type || 'system'

    // Build a rich, high-priority push payload
    const payload: Record<string, unknown> = {
      app_id:   oneSignalAppId,
      headings: { en: title },
      contents: { en: message },

      // Target by external_id (set via OneSignal.login(userId) on the client)
      include_aliases: { external_id: [userId] },
      target_channel:  'push',

      // ── High-priority delivery ───────────────────────────────────────────
      priority:             10,       // 10 = high priority; bypasses Doze on Android
      ttl:                  86400,    // 24 h time-to-live
      isIos:                true,
      isAndroid:            true,
      isWP:                 false,
      isChrome:             true,

      // ── Sound ───────────────────────────────────────────────────────────
      // iOS: "default" = system default notification sound
      ios_sound:           'default',
      // Android: "default" = system default sound on the default channel
      android_sound:       'default',
      // Android 8+ notification channel (must be created in OneSignal dashboard)
      android_channel_id:  'smartzconnect_high_priority',

      // ── Icons / Badge ────────────────────────────────────────────────────
      chrome_web_icon:     APP_ICON,
      chrome_web_badge:    APP_ICON,
      firefox_icon:        APP_ICON,
      // iOS large image (optional, requires paid plan)
      ...(imageUrl ? { big_picture: imageUrl, ios_attachments: { image: imageUrl } } : {}),

      // ── Action URL ───────────────────────────────────────────────────────
      ...(pushUrl ? { url: pushUrl } : {}),

      // ── Collapse duplicate pushes of the same type ───────────────────────
      collapse_id:          `${notifType}_${userId}`,
      // Show notification even if app is in foreground (iOS 16+, Chrome)
      apns_alert:           { title, body: message },
    }

    // Skip push delivery if the caller is trying to notify themselves
    // (e.g. test trigger); DB row is still persisted above.
    if (isSelfPush && notifTypeRaw !== 'system') {
      return new Response(JSON.stringify({ success: true, skipped: 'self_push' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${oneSignalKey}`,
        'Content-Type':  'application/json',
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
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
