// ═══════════════════════════════════════════════════════════════════════════
// Session Service — single shared owner of "token generation for external
// services" (see ARCHITECTURE_RESPONSIBILITY.md, gap #2).
//
// Both the Stream and LiveKit edge functions delegate their JWT construction
// to this module instead of each hand-rolling their own HMAC-SHA256 signing.
// This is the ONLY place in the codebase that builds or signs a JWT for an
// external service.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function unauthorized(message = 'Unauthorized'): Response {
  return jsonResponse({ error: message }, 401)
}

// JWTs require base64url (not standard base64).
function base64url(input: string | Uint8Array): string {
  const b64 = typeof input === 'string'
    ? btoa(input)
    : btoa(String.fromCharCode(...input))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Signs an arbitrary JWT payload with HMAC-SHA256 using the given secret.
 * This is the single signing routine used for every external-service token
 * (Stream, LiveKit, and any future provider).
 */
export async function signJwtHS256(
  payload: Record<string, unknown>,
  secret: string,
  header: Record<string, unknown> = { alg: 'HS256', typ: 'JWT' }
): Promise<string> {
  const encHeader = base64url(JSON.stringify(header))
  const encPayload = base64url(JSON.stringify(payload))
  const sigInput = `${encHeader}.${encPayload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sigInput))
  )
  return `${sigInput}.${base64url(sigBytes)}`
}

/**
 * Validates the caller's Supabase session from the incoming request's
 * Authorization header. Every token-issuing function must call this first —
 * the Session Service never issues a provider token without a verified
 * Supabase identity behind it.
 */
export async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { user: null, error: unauthorized() }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { user: null, error: unauthorized() }
  }

  return { user, error: null, supabaseUrl, supabaseAnonKey }
}

export function nowAndExpiry(ttlSeconds: number) {
  const now = Math.floor(Date.now() / 1000)
  return { now, exp: now + ttlSeconds }
}
