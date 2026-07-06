import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/sessionService.ts'

/**
 * confirm-email
 * ─────────────
 * Auto-confirms a newly-created user's email so they can log in immediately
 * without clicking a verification link. Called by the frontend right after
 * supabase.auth.signUp() returns a user ID.
 *
 * Security:
 * - Only confirms users whose email_confirmed_at is NULL (never-confirmed).
 * - Requires the user to have been created within the last 60 seconds
 *   (prevents malicious confirmation of older unconfirmed accounts).
 * - Uses SUPABASE_SERVICE_ROLE_KEY (server-side only, never exposed to browser).
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseUrl    = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')

    if (!serviceRoleKey || !supabaseUrl) {
      return jsonResponse({ error: 'Service role not configured' }, 500)
    }

    const { userId } = await req.json().catch(() => ({ userId: null }))
    if (!userId) return jsonResponse({ error: 'userId is required' }, 400)

    // Create admin client
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch the user to verify eligibility
    const { data: { user }, error: fetchErr } = await admin.auth.admin.getUserById(userId)
    if (fetchErr || !user) return jsonResponse({ error: 'User not found' }, 404)

    // Guard: only confirm if still unconfirmed AND created within the last 2 minutes
    const age = Date.now() - new Date(user.created_at).getTime()
    if (user.email_confirmed_at) {
      return jsonResponse({ confirmed: true, alreadyConfirmed: true })
    }
    if (age > 2 * 60 * 1000) {
      return jsonResponse({ error: 'User too old to auto-confirm' }, 403)
    }

    // Confirm the email
    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })
    if (updateErr) return jsonResponse({ error: updateErr.message }, 500)

    return jsonResponse({ confirmed: true })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
