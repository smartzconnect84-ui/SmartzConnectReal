import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  to: string
  template: 'welcome' | 'reset_password' | 'verify_email' | 'newsletter' | 'order_update' | 'ride_update'
  data?: Record<string, string>
}

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  welcome: (d) => ({
    subject: `Welcome to SmartzConnect, ${d.name || 'Friend'}! 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:40px;text-align:center">
          <h1 style="margin:0;font-size:28px;font-weight:900">SmartzConnect</h1>
          <p style="margin:8px 0 0;opacity:0.9;font-size:14px">Africa's #1 Social Platform</p>
        </div>
        <div style="padding:40px">
          <h2 style="color:#ec4899;margin-top:0">Welcome, ${d.name || 'Friend'}! 🎉</h2>
          <p style="color:#9ca3af;line-height:1.7">Your account has been confirmed and you're all set to start connecting with Africans across the continent.</p>
          <div style="margin:24px 0">
            <a href="${d.dashboardUrl || 'https://smartzconnect.com/app/feed'}"
              style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px">
              Go to Your Feed →
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">If you have any questions, reply to this email or contact support@smartzconnect.com</p>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #1f1f2e;text-align:center">
          <p style="color:#4b5563;font-size:12px;margin:0">© 2026 SmartzConnect. All rights reserved.</p>
          <p style="color:#4b5563;font-size:12px;margin:4px 0 0">
            <a href="${d.unsubscribeUrl || '#'}" style="color:#6b7280">Unsubscribe</a> · 
            <a href="https://smartzconnect.com/privacy" style="color:#6b7280">Privacy Policy</a>
          </p>
        </div>
      </div>
    `,
  }),

  reset_password: (d) => ({
    subject: 'Reset your SmartzConnect password',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:40px;text-align:center">
          <h1 style="margin:0;font-size:28px;font-weight:900">SmartzConnect</h1>
        </div>
        <div style="padding:40px">
          <h2 style="color:#ec4899;margin-top:0">Password Reset Request 🔐</h2>
          <p style="color:#9ca3af;line-height:1.7">We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.</p>
          <div style="margin:24px 0">
            <a href="${d.resetUrl || '#'}"
              style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px">
              Reset My Password →
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #1f1f2e;text-align:center">
          <p style="color:#4b5563;font-size:12px;margin:0">© 2026 SmartzConnect. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  verify_email: (d) => ({
    subject: 'Verify your SmartzConnect email address',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:40px;text-align:center">
          <h1 style="margin:0;font-size:28px;font-weight:900">SmartzConnect</h1>
        </div>
        <div style="padding:40px">
          <h2 style="color:#ec4899;margin-top:0">Confirm your email ✉️</h2>
          <p style="color:#9ca3af;line-height:1.7">Thanks for signing up, ${d.name || 'Friend'}! Please click the button below to verify your email address and activate your account.</p>
          <div style="margin:24px 0">
            <a href="${d.verifyUrl || '#'}"
              style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px">
              Verify My Email →
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #1f1f2e;text-align:center">
          <p style="color:#4b5563;font-size:12px;margin:0">© 2026 SmartzConnect. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  newsletter: (d) => ({
    subject: d.subject || 'SmartzConnect Newsletter',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:40px;text-align:center">
          <h1 style="margin:0;font-size:28px;font-weight:900">SmartzConnect</h1>
          <p style="margin:8px 0 0;opacity:0.9">${d.headline || 'Platform Updates'}</p>
        </div>
        <div style="padding:40px">
          <div style="color:#9ca3af;line-height:1.8">${d.body || ''}</div>
          ${d.ctaUrl ? `<div style="margin:24px 0"><a href="${d.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700">${d.ctaLabel || 'Learn More'} →</a></div>` : ''}
        </div>
        <div style="padding:20px 40px;border-top:1px solid #1f1f2e;text-align:center">
          <p style="color:#4b5563;font-size:12px;margin:0">© 2026 SmartzConnect · <a href="${d.unsubscribeUrl || '#'}" style="color:#6b7280">Unsubscribe</a></p>
        </div>
      </div>
    `,
  }),

  order_update: (d) => ({
    subject: `Order Update: ${d.status || 'Status Changed'} — SmartzConnect`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:32px;text-align:center">
          <h1 style="margin:0;font-size:24px;font-weight:900">Order Update</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#ec4899;margin-top:0">${d.status || 'Update'} 📦</h2>
          <p style="color:#9ca3af">Order #${d.orderId || 'N/A'} — ${d.message || 'Your order has been updated.'}</p>
          ${d.trackUrl ? `<a href="${d.trackUrl}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;margin-top:16px">Track Order →</a>` : ''}
        </div>
      </div>
    `,
  }),

  ride_update: (d) => ({
    subject: `Ride Update: ${d.status || 'Status Changed'} — SmartzConnect`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:32px;text-align:center">
          <h1 style="margin:0;font-size:24px;font-weight:900">Ride Update 🚗</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#9ca3af">${d.message || 'Your ride status has been updated.'}</p>
          <p style="color:#6b7280;font-size:13px">Driver: ${d.driverName || 'N/A'} · Status: <strong style="color:#ec4899">${d.status || 'N/A'}</strong></p>
        </div>
      </div>
    `,
  }),
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Resend not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: EmailPayload = await req.json()
    const { to, template, data = {} } = body

    if (!to || !template) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, template' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const builder = templates[template]
    if (!builder) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { subject, html } = builder(data)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SmartzConnect <noreply@smartzconnect.com>',
        to: [to],
        subject,
        html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
