import { useState } from 'react'
import { motion } from 'framer-motion'
import { Handshake, Building2, User, Mail, Phone, MessageSquare, ChevronDown, CheckCircle, Loader2, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PartnershipSectionProps {
  product: string          // e.g. "SmartzMarket"
  accentFrom: string       // e.g. "from-amber-500"
  accentTo: string         // e.g. "to-orange-600"
  accentText: string       // e.g. "text-amber-400"
  accentBorder: string     // e.g. "border-amber-500/30"
  accentBg: string         // e.g. "bg-amber-500/10"
  partnerTypes: string[]
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function PartnershipSection({
  product,
  accentFrom,
  accentTo,
  accentText,
  accentBorder,
  accentBg,
  partnerTypes,
}: PartnershipSectionProps) {
  const [form, setForm] = useState({
    company: '',
    contact: '',
    email: '',
    phone: '',
    type: '',
    message: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company || !form.contact || !form.email || !form.type || !form.message) {
      setErrorMsg('Please fill in all required fields.')
      return
    }
    setStatus('submitting')
    setErrorMsg('')

    const { error } = await supabase.from('partnership_inquiries').insert({
      product,
      company_name: form.company,
      contact_person: form.contact,
      email: form.email,
      phone: form.phone || null,
      partnership_type: form.type,
      message: form.message,
    })

    if (error) {
      // Graceful fallback — mailto if table doesn't exist yet
      if (error.code === '42P01') {
        const body = encodeURIComponent(
          `Company: ${form.company}\nContact: ${form.contact}\nEmail: ${form.email}\nPhone: ${form.phone}\nType: ${form.type}\n\n${form.message}`
        )
        window.open(`mailto:partnerships@smartzconnect.com?subject=Partnership Inquiry — ${product}&body=${body}`)
        setStatus('success')
      } else {
        setErrorMsg('Something went wrong. Please try again or email us directly.')
        setStatus('error')
      }
    } else {
      setStatus('success')
      setForm({ company: '', contact: '', email: '', phone: '', type: '', message: '' })
    }
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm dark:bg-white/6 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all`

  return (
    <section className="py-20 sm:py-28 dark:bg-[#0A0814] bg-gray-50 border-t dark:border-white/5 border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="text-center mb-14"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${accentBg} border ${accentBorder} mb-5`}>
            <Handshake className={`w-3.5 h-3.5 ${accentText}`} />
            <span className={`text-xs font-black tracking-widest ${accentText} uppercase`}>Partner With Us</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-4 leading-tight">
            Grow Together with{' '}
            <span className={`bg-gradient-to-r ${accentFrom} ${accentTo} bg-clip-text text-transparent`}>{product}</span>
          </h2>
          <p className="text-base sm:text-lg dark:text-gray-400 text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We believe in the power of strategic partnerships. Whether you're a brand, agency, logistics provider,
            or content creator — let's build something remarkable together.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">

          {/* ── Left: Benefits ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-5"
          >
            <h3 className="font-display font-black text-xl dark:text-white text-gray-900">Why Partner With Us?</h3>
            {[
              { emoji: '🌍', title: 'Pan-African Reach', desc: 'Access a fast-growing user base across 195+ countries with deep penetration in African markets.' },
              { emoji: '📊', title: 'Real Analytics', desc: 'Get detailed performance reports on your partnership — impressions, conversions, and ROI in real-time.' },
              { emoji: '🤝', title: 'Dedicated Support', desc: 'A dedicated partnership manager supports you from onboarding through campaign execution.' },
              { emoji: '⚡', title: 'Fast Onboarding', desc: 'Our team responds within 48 hours. Most partnerships are live within 7 business days.' },
            ].map(b => (
              <div key={b.title} className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${accentBg} border ${accentBorder} flex items-center justify-center text-lg flex-shrink-0`}>
                  {b.emoji}
                </div>
                <div>
                  <p className="font-bold text-sm dark:text-white text-gray-900 mb-0.5">{b.title}</p>
                  <p className="text-xs dark:text-gray-400 text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}

            <div className={`mt-6 rounded-2xl p-5 ${accentBg} border ${accentBorder}`}>
              <p className="text-xs dark:text-gray-300 text-gray-700 leading-relaxed">
                <span className="font-bold dark:text-white text-gray-900">Already a partner?</span>{' '}
                Email us at{' '}
                <a href="mailto:partnerships@smartzconnect.com" className={`${accentText} font-semibold underline underline-offset-2`}>
                  partnerships@smartzconnect.com
                </a>{' '}
                for account support.
              </p>
            </div>
          </motion.div>

          {/* ── Right: Form ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-3"
          >
            {status === 'success' ? (
              <div className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-200 p-10 sm:p-14 text-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${accentFrom} ${accentTo} flex items-center justify-center mx-auto mb-5 shadow-xl`}>
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-3">Inquiry Received!</h3>
                <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed max-w-sm mx-auto mb-6">
                  Thank you for your interest in partnering with {product}. Our team will review your inquiry
                  and get back to you within 48 hours.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${accentFrom} ${accentTo} text-white font-bold text-sm hover:opacity-90 transition-opacity`}
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-200 p-6 sm:p-8 shadow-2xl space-y-4"
              >
                <h3 className="font-display font-bold text-lg dark:text-white text-gray-900 mb-1">Partnership Inquiry</h3>
                <p className="text-xs dark:text-gray-500 text-gray-400 mb-4">Fields marked * are required.</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400 pointer-events-none" />
                    <input
                      type="text" value={form.company} onChange={set('company')}
                      placeholder="Company / Brand Name *"
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                  {/* Contact Person */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400 pointer-events-none" />
                    <input
                      type="text" value={form.contact} onChange={set('contact')}
                      placeholder="Your Full Name *"
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400 pointer-events-none" />
                    <input
                      type="email" value={form.email} onChange={set('email')}
                      placeholder="Business Email *"
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                  {/* Phone */}
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400 pointer-events-none" />
                    <input
                      type="tel" value={form.phone} onChange={set('phone')}
                      placeholder="Phone / WhatsApp (optional)"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Partnership Type */}
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400 pointer-events-none" />
                  <select
                    value={form.type} onChange={set('type')}
                    className={`${inputClass} pr-10 appearance-none cursor-pointer`}
                    required
                  >
                    <option value="" disabled>Partnership Type *</option>
                    {partnerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 dark:text-gray-500 text-gray-400 pointer-events-none" />
                  <textarea
                    value={form.message} onChange={set('message')}
                    placeholder="Tell us about your partnership idea, goals, and how we can collaborate *"
                    rows={4}
                    className={`${inputClass} pl-10 resize-none`}
                    required
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-400 font-semibold">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className={`w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r ${accentFrom} ${accentTo} text-white font-bold text-sm shadow-xl hover:opacity-95 hover:scale-[1.02] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {status === 'submitting' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Partnership Inquiry</>
                  )}
                </button>

                <p className="text-center text-[11px] dark:text-gray-600 text-gray-400 pt-1">
                  We respond within 48 hours. Your data is handled securely and never shared.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
