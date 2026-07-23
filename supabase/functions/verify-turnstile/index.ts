/**
 * verify-turnstile — Server-side Cloudflare Turnstile verification.
 *
 * Called from RegisterPage and LoginPage before auth actions.
 * Prevents bot sign-ups and brute-force login without exposing the
 * Cloudflare secret key to the browser.
 *
 * Environment variable required:
 *   CLOUDFLARE_TURNSTILE_SECRET_KEY — from https://dash.cloudflare.com → Turnstile
 *
 * If the secret key is not configured the call succeeds silently
 * (feature degrades gracefully — client-side only mode).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse } from '../_shared/sessionService.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, remoteip } = await req.json().catch(() => ({}))

    if (!token || typeof token !== 'string') {
      return jsonResponse({ success: false, error: 'Missing token' }, 400)
    }

    const secretKey = Deno.env.get('CLOUDFLARE_TURNSTILE_SECRET_KEY')
    if (!secretKey) {
      // Secret not configured — pass through so the feature can be enabled
      // without a deploy; the site key won't be set either in this state.
      console.warn('verify-turnstile: CLOUDFLARE_TURNSTILE_SECRET_KEY not set — skipping verification')
      return jsonResponse({ success: true, skipped: true })
    }

    const form = new FormData()
    form.append('secret', secretKey)
    form.append('response', token)
    if (remoteip && typeof remoteip === 'string') form.append('remoteip', remoteip)

    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })

    const result: { success: boolean; 'error-codes'?: string[] } = await resp.json()

    if (!result.success) {
      const code = result['error-codes']?.[0] || 'verification-failed'
      console.warn('verify-turnstile: Cloudflare rejected token —', code)
      return jsonResponse({ success: false, error: code }, 400)
    }

    return jsonResponse({ success: true })
  } catch (err) {
    console.error('verify-turnstile error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})
