import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CertPayload {
  to: string
  recipientName: string
  courseName: string
  score: number
  certificateCode: string
  issuedDate: string
}

function buildCertHtml(p: CertPayload): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Certificate of Completion</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Georgia,serif;">
  <div style="max-width:700px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.1);">
    <!-- Header gradient -->
    <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:40px 48px;text-align:center;position:relative;">
      <div style="font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;">SmartzConnect Academy</div>
      <h1 style="margin:0;font-size:36px;font-weight:900;color:#fff;letter-spacing:0.02em;">Certificate of Completion</h1>
      <div style="width:80px;height:3px;background:rgba(255,255,255,0.5);margin:16px auto 0;border-radius:2px;"></div>
    </div>

    <!-- Body -->
    <div style="padding:48px;text-align:center;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 12px;letter-spacing:0.08em;text-transform:uppercase;">This is to certify that</p>
      <h2 style="margin:0 0 12px;font-size:32px;font-weight:700;background:linear-gradient(135deg,#ec4899,#a855f7);-webkit-background-clip:text;background-clip:text;color:transparent;">${escHtml(p.recipientName)}</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 28px;">has successfully completed</p>
      
      <div style="background:linear-gradient(135deg,rgba(236,72,153,0.08),rgba(168,85,247,0.08));border:2px solid rgba(168,85,247,0.2);border-radius:12px;padding:20px 32px;display:inline-block;margin-bottom:28px;">
        <div style="font-size:22px;font-weight:700;color:#1f2937;">${escHtml(p.courseName)}</div>
      </div>

      <div style="display:flex;justify-content:center;gap:40px;margin-bottom:36px;flex-wrap:wrap;">
        <div style="text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#ec4899;">${p.score}%</div>
          <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Final Score</div>
        </div>
        <div style="width:1px;background:#e5e7eb;"></div>
        <div style="text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#a855f7;">✓</div>
          <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Passed</div>
        </div>
        <div style="width:1px;background:#e5e7eb;"></div>
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:700;color:#374151;">${escHtml(p.issuedDate)}</div>
          <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Issue Date</div>
        </div>
      </div>

      <!-- Signature line -->
      <div style="border-top:1px solid #e5e7eb;padding-top:24px;display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-style:italic;color:#4b5563;margin-bottom:4px;font-family:cursive;">SmartzConnect</div>
          <div style="width:120px;height:1px;background:#d1d5db;margin:0 auto 4px;"></div>
          <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Platform Director</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-style:italic;color:#4b5563;margin-bottom:4px;font-family:cursive;">Academy</div>
          <div style="width:120px;height:1px;background:#d1d5db;margin:0 auto 4px;"></div>
          <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Education Board</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 48px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Certificate Code: <strong style="color:#6b7280;font-family:monospace;">${escHtml(p.certificateCode)}</strong>
        &nbsp;·&nbsp; Verify at <a href="https://smartzconnect.com/verify/${escHtml(p.certificateCode)}" style="color:#a855f7;text-decoration:none;">smartzconnect.com</a>
      </p>
      <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} SmartzConnect Academy. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Resend not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload: CertPayload = await req.json()
    const { to, recipientName, courseName, score, certificateCode, issuedDate } = payload

    if (!to || !recipientName || !courseName) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, recipientName, courseName' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const html = buildCertHtml(payload)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SmartzConnect Academy <academy@smartzconnect.com>',
        to: [to],
        subject: `🎓 Your Certificate for "${courseName}" — SmartzConnect Academy`,
        html,
      }),
    })

    const result = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
