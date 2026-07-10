/**
 * stream-webhook — Stream Chat webhook handler
 *
 * Registered in the Stream dashboard as a webhook URL.
 * Verifies the request signature and handles:
 *   - message.new → push + notification row for recipient (when not in app)
 *   - notification.message_new → same
 *
 * Environment variables required:
 *   STREAM_API_SECRET         — for HMAC signature verification
 *   SUPABASE_URL              — for DB queries
 *   SUPABASE_SERVICE_ROLE_KEY — for service-role DB access
 *   ONESIGNAL_APP_ID          — OneSignal app ID
 *   ONESIGNAL_REST_API_KEY    — OneSignal REST key
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-signature, content-type',
}

async function verifyStreamSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const bodyData = encoder.encode(body)
    const sig = await crypto.subtle.sign('HMAC', key, bodyData)
    const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
    return sigHex === signature
  } catch {
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const bodyText = await req.text()
    const signature = req.headers.get('x-signature') || ''
    const streamSecret = Deno.env.get('STREAM_API_SECRET') || Deno.env.get('STREAM_SECRET') || ''

    // Verify signature if secret is configured
    if (streamSecret && signature) {
      const valid = await verifyStreamSignature(bodyText, signature, streamSecret)
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const event = JSON.parse(bodyText)
    const eventType: string = event.type || ''

    // Only process new message events
    if (!['message.new', 'notification.message_new'].includes(eventType)) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalKey   = Deno.env.get('ONESIGNAL_REST_API_KEY')

    const adminClient = createClient(supabaseUrl, serviceKey)

    // Extract message info
    const message    = event.message || {}
    const senderId   = message.user?.id || ''
    const senderName = message.user?.name || message.user?.id || 'Someone'
    const msgText    = message.text || '📎 Sent an attachment'

    // Determine recipients from channel members (skip the sender)
    const channelType = event.channel_type || event.channel?.type || 'messaging'
    const channelId   = event.channel_id   || event.channel?.id   || ''

    // For DM channels, the recipient is derivable from the channel ID convention:
    // SmartzConnect uses "messaging:sortedId1!sortedId2" format. But Stream also
    // sends member list in some events. Use the members if available, otherwise
    // fall back to querying Supabase profiles.
    const members: string[] = (event.members || [])
      .map((m: any) => m.user_id || m.user?.id || '')
      .filter((id: string) => id && id !== senderId)

    // If no members in payload, skip (WorldChat livestream channels, etc.)
    if (members.length === 0) {
      return new Response(JSON.stringify({ received: true, skipped: 'no_members' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://www.smartzconnect.com'
    const chatUrl   = `${appOrigin}/app/chat/${senderId}`

    const promises = members.map(async (recipientId) => {
      // Insert in-app notification
      await adminClient.from('notifications').insert({
        user_id:      recipientId,
        from_user_id: senderId,
        type:        'message',
        title:       `💬 ${senderName}`,
        body:         msgText.length > 120 ? msgText.slice(0, 117) + '…' : msgText,
        emoji:       '💬',
        action_url:   chatUrl,
        read:         false,
      })

      // Send push via OneSignal
      if (oneSignalAppId && oneSignalKey) {
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${oneSignalKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app_id:   oneSignalAppId,
            headings: { en: `💬 ${senderName}` },
            contents: { en: msgText.length > 120 ? msgText.slice(0, 117) + '…' : msgText },
            include_aliases: { external_id: [recipientId] },
            target_channel: 'push',
            url:  chatUrl,
          }),
        })
      }
    })

    await Promise.allSettled(promises)

    return new Response(JSON.stringify({ received: true, processed: members.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('stream-webhook error:', err)
    // Always return 200 to Stream so it doesn't disable the webhook
    return new Response(JSON.stringify({ received: true, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
