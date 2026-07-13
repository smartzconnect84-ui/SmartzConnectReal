import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOGO_URL = 'https://smartzconnect.com/logo.png'
const BRAND_NAME = 'SmartzConnect'

/** Reusable branded email header with logo image */
function emailHeader(subtitle = '') {
  return `
    <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:32px 40px;text-align:center">
      <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:56px;width:auto;object-fit:contain;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />
      <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:0.01em;">${BRAND_NAME}</div>
      ${subtitle ? `<p style="margin:6px 0 0;opacity:0.9;font-size:13px;color:#fff;">${subtitle}</p>` : ''}
    </div>
  `
}

/** Reusable branded email footer */
function emailFooter(extra = '') {
  return `
    <div style="padding:20px 40px;border-top:1px solid #1f1f2e;text-align:center">
      <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:28px;width:auto;object-fit:contain;opacity:0.5;margin-bottom:8px;" />
      <p style="color:#4b5563;font-size:12px;margin:0">© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      ${extra}
    </div>
  `
}

interface EmailPayload {
  to: string
  template: 'welcome' | 'reset_password' | 'verify_email' | 'newsletter' | 'order_update' | 'ride_update' | 'application_approved' | 'application_rejected' | 'invoice'
  data?: Record<string, string>
}

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  welcome: (d) => ({
    subject: `Welcome to ${BRAND_NAME}, ${d.name || 'Friend'}! 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        ${emailHeader("Africa's #1 Social Platform")}
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
        ${emailFooter(`<p style="color:#4b5563;font-size:12px;margin:4px 0 0">
          <a href="${d.unsubscribeUrl || '#'}" style="color:#6b7280">Unsubscribe</a> · 
          <a href="https://smartzconnect.com/privacy" style="color:#6b7280">Privacy Policy</a>
        </p>`)}
      </div>
    `,
  }),

  reset_password: (d) => ({
    subject: `Reset your ${BRAND_NAME} password`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        ${emailHeader()}
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
        ${emailFooter()}
      </div>
    `,
  }),

  verify_email: (d) => ({
    subject: `Verify your ${BRAND_NAME} email address`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        ${emailHeader()}
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
        ${emailFooter()}
      </div>
    `,
  }),

  newsletter: (d) => ({
    subject: d.subject || `${BRAND_NAME} Newsletter`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        ${emailHeader(d.headline || 'Platform Updates')}
        <div style="padding:40px">
          <div style="color:#9ca3af;line-height:1.8">${d.body || ''}</div>
          ${d.ctaUrl ? `<div style="margin:24px 0"><a href="${d.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700">${d.ctaLabel || 'Learn More'} →</a></div>` : ''}
        </div>
        ${emailFooter(`<p style="color:#4b5563;font-size:12px;margin:4px 0 0">
          <a href="${d.unsubscribeUrl || '#'}" style="color:#6b7280">Unsubscribe</a>
        </p>`)}
      </div>
    `,
  }),

  order_update: (d) => ({
    subject: `Order Update: ${d.status || 'Status Changed'} — ${BRAND_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        ${emailHeader('Order Update')}
        <div style="padding:32px">
          <h2 style="color:#ec4899;margin-top:0">${d.status || 'Update'} 📦</h2>
          <p style="color:#9ca3af">Order #${d.orderId || 'N/A'} — ${d.message || 'Your order has been updated.'}</p>
          ${d.trackUrl ? `<a href="${d.trackUrl}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;margin-top:16px">Track Order →</a>` : ''}
        </div>
        ${emailFooter()}
      </div>
    `,
  }),

  ride_update: (d) => ({
    subject: `Ride Update: ${d.status || 'Status Changed'} — ${BRAND_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        ${emailHeader('Ride Update 🚗')}
        <div style="padding:32px">
          <p style="color:#9ca3af">${d.message || 'Your ride status has been updated.'}</p>
          <p style="color:#6b7280;font-size:13px">Driver: ${d.driverName || 'N/A'} · Status: <strong style="color:#ec4899">${d.status || 'N/A'}</strong></p>
        </div>
        ${emailFooter()}
      </div>
    `,
  }),

  invoice: (d) => ({
    subject: `Invoice ${d.invoiceNumber || ''} from ${d.fromName || BRAND_NAME} — Total: ${d.total || ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:32px 40px;text-align:center">
          <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:52px;width:auto;object-fit:contain;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />
          <h1 style="margin:0;font-size:26px;font-weight:900;color:#fff;">INVOICE</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${d.invoiceNumber || ''} · Issued ${d.issueDate || ''}${d.dueDate ? ' · Due ' + d.dueDate : ''}</p>
        </div>
        <div style="padding:36px 40px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="vertical-align:top;padding-right:24px;">
                <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#a855f7;margin:0 0 6px;font-weight:700;">From</p>
                <p style="margin:2px 0;font-size:15px;font-weight:700;color:#1f2937;">${d.fromName || '—'}</p>
                <p style="margin:2px 0;font-size:13px;color:#6b7280;">${d.fromEmail || ''}</p>
              </td>
              <td style="vertical-align:top;">
                <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#a855f7;margin:0 0 6px;font-weight:700;">Bill To</p>
                <p style="margin:2px 0;font-size:15px;font-weight:700;color:#1f2937;">${d.toName || '—'}</p>
              </td>
            </tr>
          </table>
          <div style="background:#f9fafb;border-radius:12px;padding:24px;margin-bottom:24px;">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;margin:0 0 12px;font-weight:700;">Invoice Details</p>
            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7;">${(d.notes || '').replace(/\n/g,'<br/>')}</p>
          </div>
          <div style="display:flex;justify-content:flex-end;">
            <div style="background:linear-gradient(135deg,rgba(236,72,153,0.08),rgba(168,85,247,0.08));border:2px solid rgba(168,85,247,0.2);border-radius:12px;padding:16px 24px;text-align:right;">
              <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.06em;">Total Due</p>
              <p style="font-size:28px;font-weight:900;margin:0;background:linear-gradient(135deg,#ec4899,#a855f7);-webkit-background-clip:text;background-clip:text;color:transparent;">${d.total || ''}</p>
              <p style="font-size:12px;color:#9ca3af;margin:4px 0 0;">${d.currency || 'USD'}</p>
            </div>
          </div>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;background:#f9fafb;">
          <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:28px;width:auto;object-fit:contain;opacity:0.5;margin-bottom:6px;" />
          <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${BRAND_NAME}. This is an automated invoice email.</p>
        </div>
      </div>
    `,
  }),

  application_approved: (d) => ({
    subject: `🎉 Application Approved — ${d.courseName || 'Your Course'}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;text-align:center">
          <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:52px;width:auto;object-fit:contain;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />
          <h1 style="margin:0;font-size:24px;font-weight:900;color:#fff;">✅ Application Approved</h1>
          <p style="margin:6px 0 0;opacity:0.85;font-size:13px;color:#fff;">${BRAND_NAME} Academy</p>
        </div>
        <div style="padding:40px">
          <h2 style="color:#10b981;margin-top:0">Congratulations, ${d.name || 'Learner'}!</h2>
          <p style="color:#9ca3af;line-height:1.7">Your application to enrol in <strong style="color:#fff">${d.courseName || 'the course'}</strong> has been <strong style="color:#10b981">approved</strong> by our team.</p>
          ${d.duration ? `<div style="background:#1a2e1a;border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:16px;margin:20px 0"><p style="margin:0;font-size:13px;color:#6ee7b7"><strong>Study Duration:</strong> ${d.duration} Days</p></div>` : ''}
          ${d.adminNotes ? `<div style="background:#1a1f2e;border-left:4px solid #10b981;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0"><p style="margin:0;color:#9ca3af;font-size:13px;font-style:italic">"${d.adminNotes}"</p></div>` : ''}
          <div style="margin:28px 0;text-align:center">
            <a href="${d.loginUrl || 'https://smartzconnect.com/login'}"
              style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px">
              Access Your Course →
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">If you have any questions, contact <a href="mailto:academy@smartzconnect.com" style="color:#10b981">academy@smartzconnect.com</a></p>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #1f2937;text-align:center">
          <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:28px;width:auto;object-fit:contain;opacity:0.5;margin-bottom:6px;" />
          <p style="color:#4b5563;font-size:12px;margin:0">© ${new Date().getFullYear()} ${BRAND_NAME} Academy. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  application_rejected: (d) => ({
    subject: `Application Update — ${d.courseName || 'Your Course'}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#374151,#1f2937);padding:32px 40px;text-align:center">
          <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:52px;width:auto;object-fit:contain;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />
          <h1 style="margin:0;font-size:24px;font-weight:900;color:#fff;">Application Update</h1>
          <p style="margin:6px 0 0;opacity:0.85;font-size:13px;color:#fff;">${BRAND_NAME} Academy</p>
        </div>
        <div style="padding:40px">
          <h2 style="color:#e5e7eb;margin-top:0">Hi ${d.name || 'Learner'},</h2>
          <p style="color:#9ca3af;line-height:1.7">Thank you for your interest in <strong style="color:#fff">${d.courseName || 'the course'}</strong>. After review, we're unable to approve your application at this time.</p>
          ${d.adminNotes ? `<div style="background:#1a1520;border-left:4px solid #ec4899;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0"><p style="margin:0 0 4px;color:#f9a8d4;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Feedback</p><p style="margin:0;color:#9ca3af;font-size:13px">${d.adminNotes}</p></div>` : ''}
          <p style="color:#9ca3af;line-height:1.7;margin-top:20px">We encourage you to explore other available courses on our platform. You're welcome to re-apply in the future.</p>
          <div style="margin:28px 0;text-align:center">
            <a href="${d.coursesUrl || 'https://smartzconnect.com/smartzlearning'}"
              style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px">
              View Other Courses →
            </a>
          </div>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #1f2937;text-align:center">
          <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:28px;width:auto;object-fit:contain;opacity:0.5;margin-bottom:6px;" />
          <p style="color:#4b5563;font-size:12px;margin:0">© ${new Date().getFullYear()} ${BRAND_NAME} Academy. All rights reserved.</p>
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
        from: `${BRAND_NAME} <support@smartzconnect.com>`,
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
