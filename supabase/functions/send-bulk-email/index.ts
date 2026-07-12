import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * send-bulk-email — admin "Compose Email" campaign sender.
 *
 * Called by src/pages/admin/AdminEmail.tsx. Resolves the target audience
 * server-side (needs the service-role key to read every profile's email),
 * sends one email per recipient through Resend, then records the campaign
 * in `email_campaigns` with the real delivered count.
 *
 * Body: { subject, body, footer, audience, from_email, from_name }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function renderHtml(opts: { subject: string; body: string; footer?: string; name?: string }) {
  const bodyHtml = opts.body
    .replace(/{{name}}/g, opts.name || 'there')
    .split('\n').map(line => line.trim() ? `<p style="margin:0 0 14px">${line}</p>` : '<br/>').join('')
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:36px;text-align:center">
        <h1 style="margin:0;font-size:26px;font-weight:900">SmartzConnect</h1>
      </div>
      <div style="padding:36px">
        <div style="color:#d1d5db;line-height:1.7;font-size:15px">${bodyHtml}</div>
      </div>
      ${opts.footer ? `<div style="padding:18px 36px;border-top:1px solid #1f1f2e;text-align:center"><p style="color:#6b7280;font-size:11px;margin:0">${opts.footer}</p></div>` : ''}
    </div>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ── Auth: admin only ──────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: adminRow } = await admin.from('admin_users').select('id').eq('id', user.id).maybeSingle()
    if (!adminRow) return json({ error: 'Admin only' }, 403)

    const { subject, body, footer = '', audience = 'all', from_email, from_name } = await req.json()
    if (!subject?.trim() || !body?.trim()) return json({ error: 'subject and body are required' }, 400)

    // ── Resolve audience → recipient list ─────────────────────────────────
    // `profiles.email` is frequently null/stale (it's only a mirror column —
    // the source of truth for every account's email is auth.users). Sourcing
    // recipients from profiles alone silently dropped most of the audience,
    // which is why "bulk" sends only ever reached a handful of users. Fix:
    // always source the address list from auth.users (paginated — GoTrue
    // caps a single listUsers() page at 1000), then cross-reference profiles
    // for the segment filter (premium/vip/inactive) and personalization.
    let allAuthUsers: { id: string; email?: string }[] = []
    for (let page = 1; page <= 50; page++) { // hard cap 50k users as a sanity ceiling
      const { data: pageData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (listErr) return json({ error: listErr.message }, 500)
      const users = pageData?.users ?? []
      allAuthUsers.push(...users.map(u => ({ id: u.id, email: u.email })))
      if (users.length < 1000) break
    }
    allAuthUsers = allAuthUsers.filter(u => !!u.email)

    let audienceIds: Set<string> | null = null // null = no extra filter (audience === 'all')
    let newsletterRows: { email: string; name?: string }[] = []
    if (audience === 'newsletter') {
      // Newsletter subscribers aren't necessarily registered members — pull
      // straight from the public signup list instead of auth.users.
      const { data: subRows, error: subErr } = await admin
        .from('newsletter_subscribers').select('email, name').eq('is_active', true)
      if (subErr) return json({ error: subErr.message }, 500)
      newsletterRows = subRows || []
      allAuthUsers = newsletterRows.map(s => ({ id: s.email, email: s.email }))
    } else if (audience !== 'all') {
      let profQuery = admin.from('profiles').select('id')
      if (audience === 'premium') profQuery = profQuery.eq('is_premium', true)
      else if (audience === 'vip') profQuery = profQuery.eq('is_vip', true)
      else if (audience === 'free') profQuery = profQuery.eq('is_premium', false).eq('is_vip', false)
      else if (audience === 'inactive') {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        profQuery = profQuery.lt('last_seen', cutoff)
      }
      const { data: profRows, error: profErr } = await profQuery.limit(50000)
      if (profErr) return json({ error: profErr.message }, 500)
      audienceIds = new Set((profRows || []).map((p: { id: string }) => p.id))
    }

    const filteredUsers = audienceIds ? allAuthUsers.filter(u => audienceIds!.has(u.id)) : allAuthUsers

    // Hydrate names for personalization (best-effort — missing rows just
    // fall back to "there" in renderHtml).
    const nameById: Record<string, { full_name?: string; username?: string }> = {}
    if (audience === 'newsletter') {
      for (const s of newsletterRows) nameById[s.email] = { full_name: s.name }
    } else {
      const idsNeedingNames = filteredUsers.map(u => u.id).filter(Boolean)
      for (let i = 0; i < idsNeedingNames.length; i += 1000) {
        const chunk = idsNeedingNames.slice(i, i + 1000)
        const { data: profRows } = await admin.from('profiles').select('id, full_name, username').in('id', chunk)
        for (const p of profRows || []) nameById[(p as any).id] = p as any
      }
    }

    const recipients = filteredUsers.map(u => ({
      email: u.email as string,
      full_name: nameById[u.id]?.full_name,
      username: nameById[u.id]?.username,
    }))

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      // Still record the campaign as a draft so the UI reflects reality,
      // but make it unambiguous that nothing was actually delivered.
      await admin.from('email_campaigns').insert({
        subject, body, audience, footer, from_email, from_name,
        status: 'failed', sent_count: 0, opened_count: 0, sent_at: new Date().toISOString(),
      })
      return json({ error: 'Email sending is not configured yet. Connect Resend (RESEND_API_KEY) to activate real delivery.' }, 500)
    }

    const fromLine = `${from_name || 'SmartzConnect Team'} <${from_email || 'noreply@smartzconnect.com'}>`
    let sentCount = 0
    const errors: string[] = []

    // Send sequentially in small batches to stay well under Resend's rate limits.
    const BATCH = 8
    const list = recipients || []
    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH)
      const results = await Promise.all(batch.map(async (r: { email: string; full_name?: string; username?: string }) => {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: fromLine,
              to: [r.email],
              subject,
              html: renderHtml({ subject, body, footer, name: r.full_name || r.username }),
            }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err?.message || `Resend error ${res.status}`)
          }
          return true
        } catch (e) {
          errors.push(String(e))
          return false
        }
      }))
      sentCount += results.filter(Boolean).length
    }

    const status = sentCount > 0 ? 'sent' : 'failed'
    await admin.from('email_campaigns').insert({
      subject, body, audience, footer, from_email, from_name,
      status, sent_count: sentCount, opened_count: 0, sent_at: new Date().toISOString(),
    })

    return json({ success: sentCount > 0, sent_count: sentCount, total: list.length, errors: errors.slice(0, 5) })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
