import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cookie, ChevronDown, ArrowUp, Shield, FileText,
  CheckCircle, XCircle, Settings, BarChart2, Megaphone,
  Mail, Clock, ToggleLeft, ToggleRight,
} from 'lucide-react'

/* ── Cookie type data ─────────────────────────────────────────────────── */
const cookieTypes = [
  {
    id: 'strictly-necessary',
    num: '01',
    icon: Shield,
    name: 'Strictly Necessary Cookies',
    always: true,
    accentClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/25',
    examples: ['Session cookie', 'Auth token', 'CSRF protection', 'Load balancer cookie'],
    purpose: 'These cookies are essential for the platform to function correctly. They enable core features such as logging in, navigating between pages, and maintaining account security. The platform cannot work without these cookies, and they cannot be disabled.',
  },
  {
    id: 'functional',
    num: '02',
    icon: Settings,
    name: 'Functional Cookies',
    always: false,
    accentClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/25',
    examples: ['Theme preference (dark/light)', 'Language selection', 'Chat session data', 'Notification settings'],
    purpose: 'These cookies allow us to remember your preferences and provide a more personalised experience. For example, remembering whether you prefer dark mode, your selected language, or keeping your chat session alive between visits.',
  },
  {
    id: 'analytics',
    num: '03',
    icon: BarChart2,
    name: 'Analytics Cookies',
    always: false,
    accentClass: 'text-violet-500',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/25',
    examples: ['Page view tracking', 'Feature usage stats', 'Error reporting', 'Session duration'],
    purpose: 'These cookies help us understand how visitors interact with SmartzConnect by collecting and reporting anonymised usage information. This data helps us identify what\'s working, what needs improving, and how to build better features for our community.',
  },
  {
    id: 'marketing',
    num: '04',
    icon: Megaphone,
    name: 'Marketing Cookies',
    always: false,
    accentClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/25',
    examples: ['Ad personalisation', 'Campaign tracking', 'Retargeting pixels', 'Conversion tracking'],
    purpose: 'These cookies are used to deliver advertisements relevant to your interests and to measure the effectiveness of our SmartzAds campaigns. They may track your activity across different websites to build a profile of your interests.',
  },
]

const additionalSections = [
  {
    id: 'what-are-cookies',
    num: '05',
    icon: Cookie,
    title: 'What Are Cookies?',
    content: `Cookies are small text files that are stored on your device (computer, phone, or tablet) when you visit a website. They were designed to help websites remember information about your visit — like keeping you logged in, remembering your preferences, or measuring site traffic.\n\nThere are two main types: Session cookies, which are deleted as soon as you close your browser; and Persistent cookies, which remain on your device for a set period of time or until you manually delete them. Cookies are not programs and cannot run on their own — they simply store small pieces of text.`,
  },
  {
    id: 'managing-cookies',
    num: '06',
    icon: ToggleLeft,
    title: 'How to Manage Cookies',
    content: `You have several options to manage your cookie preferences:\n\n1. Cookie Banner: Use the consent banner shown on your first visit to accept or reject non-essential cookies. You can revisit these choices at any time via the "Cookie Settings" link in our footer.\n\n2. Browser Settings: All major browsers allow you to control cookies in their settings or preferences. You can block, delete, or restrict cookies. Note that disabling cookies — especially strictly necessary ones — may affect the platform's functionality, including the ability to stay logged in.\n\n3. Opt-out Tools: For analytics and marketing cookies specifically, you can also use third-party opt-out tools such as the Network Advertising Initiative (NAI) opt-out page.`,
  },
  {
    id: 'third-party-cookies',
    num: '07',
    icon: Shield,
    title: 'Third-Party Cookies',
    content: `Some functionality on our platform is provided by trusted third parties who may also set their own cookies. These include:\n\n• Stream (GetStream.io) — for in-app chat and messaging\n• LiveKit — for real-time voice and video calls\n• OneSignal — for push notification delivery\n• Supabase — for authentication and data storage\n• Analytics providers — for anonymised usage data\n\nThese third-party cookies are governed by the privacy policies of those respective providers. We carefully vet our partners and only work with those who meet our privacy and security standards.`,
  },
  {
    id: 'updates',
    num: '08',
    icon: Clock,
    title: 'Updates to This Policy',
    content: `We may update this Cookie Policy from time to time as our technology evolves, legislation changes, or our data practices develop. We will notify you of any significant changes via an in-app banner and, where appropriate, by email. We encourage you to periodically review this page to stay informed about how we use cookies. The "Last updated" date at the top reflects the most recent revision.`,
  },
  {
    id: 'contact',
    num: '09',
    icon: Mail,
    title: 'Contact Us',
    content: `If you have any questions about our use of cookies or this Cookie Policy, please contact us at:\n\nEmail: privacy@smartzconnect.com\nWhatsApp: +231 776 679 963\nAddress: SmartzConnect Privacy Team, Monrovia, Liberia, West Africa.`,
  },
]

const RELATED = [
  { href: '/privacy', label: 'Privacy Policy',    icon: Shield   },
  { href: '/terms',   label: 'Terms of Service',  icon: FileText },
]

/* ── Back-to-top ───────────────────────────────────────────────────────── */
function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-love-gradient shadow-lg shadow-pink-500/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/* ── All TOC entries (cookie types + additional) ─────────────────────── */
const allTocItems = [
  ...cookieTypes.map(c => ({ id: c.id, num: c.num, title: c.name })),
  ...additionalSections.map(s => ({ id: s.id, num: s.num, title: s.title })),
]

/* ── Mobile TOC ────────────────────────────────────────────────────────── */
function MobileTOC() {
  const [open, setOpen] = useState(false)
  return (
    <div className="lg:hidden mb-6 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 min-h-[52px] text-left"
        aria-expanded={open}
      >
        <span className="font-bold text-sm dark:text-white text-gray-900">Table of Contents</span>
        <ChevronDown className={`w-4 h-4 dark:text-gray-400 text-gray-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t dark:border-white/6 border-gray-100">
            <nav className="p-3 space-y-0.5 max-h-72 overflow-y-auto">
              {allTocItems.map(item => (
                <a key={item.id} href={`#${item.id}`} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50 dark:hover:text-white hover:text-gray-900 transition-colors text-sm min-h-[44px]">
                  <span className="text-[10px] font-black text-amber-500 w-5 flex-shrink-0">{item.num}</span>
                  <span className="leading-tight">{item.title}</span>
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Desktop sidebar TOC ───────────────────────────────────────────────── */
function SidebarTOC() {
  const [active, setActive] = useState('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }) },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    allTocItems.forEach(s => { const el = document.getElementById(s.id); if (el) observerRef.current?.observe(el) })
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5 shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto">
        <p className="text-[10px] font-black uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-4 px-2">Contents</p>
        <nav className="space-y-0.5">
          {allTocItems.map(item => {
            const isActive = active === item.id
            return (
              <a key={item.id} href={`#${item.id}`}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-all min-h-[40px] group ${isActive ? 'dark:bg-amber-500/10 bg-amber-50 text-amber-600 dark:text-amber-400 font-bold' : 'dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50 dark:hover:text-white hover:text-gray-900'}`}>
                <span className={`text-[10px] font-black w-5 flex-shrink-0 ${isActive ? 'text-amber-500' : 'dark:text-gray-600 text-gray-400 group-hover:text-amber-400'}`}>{item.num}</span>
                <span className="leading-tight">{item.title}</span>
                {isActive && <div className="ml-auto w-1 h-4 rounded-full bg-amber-500 flex-shrink-0" />}
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function CookiePolicyPage() {
  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">
      <BackToTop />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-[#1a0a2e] via-[#0d0518] to-[#1d0a30]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-amber-500/15 blur-3xl" />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-white/40 mb-5 sm:mb-6">
              <Link to="/" className="hover:text-white/70 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white/60">Cookie Policy</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30 flex-shrink-0">
                <Cookie className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-white mb-2 sm:mb-3 leading-tight">
                  Cookie Policy
                </h1>
                <p className="text-white/65 text-sm sm:text-base max-w-xl leading-relaxed mb-4 sm:mb-5">
                  How SmartzConnect uses cookies and similar tracking technologies — and how you can control them.
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[11px] sm:text-xs font-semibold">
                    <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> Last updated: June 19, 2026
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[11px] sm:text-xs font-semibold">
                    <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> ~4 min read
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] sm:text-xs font-semibold">
                    <Cookie className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> 4 Cookie Types
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Main layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        <div className="lg:grid lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr] lg:gap-10 xl:gap-14">

          <SidebarTOC />

          <main className="min-w-0">
            <MobileTOC />

            {/* Intro */}
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 sm:p-6 lg:p-7 border dark:border-white/8 border-gray-200 mb-5 sm:mb-6 shadow-sm">
              <p className="dark:text-gray-300 text-gray-700 leading-relaxed text-sm sm:text-base">
                SmartzConnect uses cookies and similar tracking technologies on our platform. This Cookie Policy explains what cookies are, how we use them across our eight products, and how you can control your cookie preferences. By continuing to use our platform, you consent to our use of cookies as described in this policy.
              </p>
            </div>

            {/* Cookie type section heading */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px dark:bg-white/8 bg-gray-200" />
              <p className="text-[10px] font-black uppercase tracking-widest dark:text-gray-500 text-gray-400 whitespace-nowrap">Cookie Types We Use</p>
              <div className="flex-1 h-px dark:bg-white/8 bg-gray-200" />
            </div>

            {/* Cookie type cards */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-5 mb-7 sm:mb-8">
              {cookieTypes.map((c, i) => {
                const Icon = c.icon
                return (
                  <motion.div
                    key={c.id}
                    id={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-sm scroll-mt-28"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-7 py-3.5 sm:py-4 lg:py-5 border-b dark:border-white/6 border-gray-100">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${c.bgClass} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${c.accentClass}`} />
                        </div>
                        <h2 className="font-bold text-sm sm:text-base lg:text-lg dark:text-white text-gray-900 leading-snug">{c.name}</h2>
                      </div>
                      {c.always ? (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${c.bgClass} border ${c.borderClass} flex-shrink-0 self-start sm:self-auto`}>
                          <ToggleRight className={`w-3.5 h-3.5 ${c.accentClass}`} />
                          <span className={`text-[11px] font-black ${c.accentClass}`}>Always Active</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full dark:bg-white/6 bg-gray-100 border dark:border-white/8 border-gray-200 flex-shrink-0 self-start sm:self-auto">
                          <ToggleLeft className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
                          <span className="text-[11px] font-black dark:text-gray-400 text-gray-500">Optional</span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="px-4 sm:px-6 lg:px-7 py-4 sm:py-5">
                      <p className="text-sm sm:text-base dark:text-gray-400 text-gray-600 leading-relaxed mb-4 sm:mb-5">{c.purpose}</p>

                      {/* Examples */}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-2.5 sm:mb-3">Examples</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {c.examples.map(ex => (
                            <span
                              key={ex}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs dark:text-gray-300 text-gray-600"
                            >
                              {c.always
                                ? <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                : <XCircle className="w-3 h-3 dark:text-gray-600 text-gray-400 flex-shrink-0" />}
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Additional info sections */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px dark:bg-white/8 bg-gray-200" />
              <p className="text-[10px] font-black uppercase tracking-widest dark:text-gray-500 text-gray-400 whitespace-nowrap">More Information</p>
              <div className="flex-1 h-px dark:bg-white/8 bg-gray-200" />
            </div>

            <div className="space-y-3 sm:space-y-4 lg:space-y-5">
              {additionalSections.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.div
                    key={s.id}
                    id={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-sm scroll-mt-28"
                  >
                    <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-7 py-3.5 sm:py-4 lg:py-5 border-b dark:border-white/6 border-gray-100">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-love-soft flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-pink-500" />
                      </div>
                      <h2 className="font-bold text-sm sm:text-base lg:text-lg dark:text-white text-gray-900 leading-snug flex-1 min-w-0">{s.title}</h2>
                      <span className="text-[10px] sm:text-[11px] font-black text-pink-500/60 flex-shrink-0">{s.num}</span>
                    </div>
                    <div className="px-4 sm:px-6 lg:px-7 py-4 sm:py-5 space-y-3">
                      {s.content.split('\n').filter(Boolean).map((para, pi) => (
                        <p key={pi} className="text-sm sm:text-base dark:text-gray-400 text-gray-600 leading-relaxed">
                          {para}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Related pages */}
            <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t dark:border-white/8 border-gray-200">
              <p className="text-xs font-black uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-3 sm:mb-4">Related policies</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {RELATED.map(r => {
                  const Icon = r.icon
                  return (
                    <Link key={r.href} to={r.href}
                      className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:hover:border-pink-500/30 hover:border-pink-300 dark:hover:bg-pink-500/5 hover:bg-pink-50 transition-all min-h-[52px] sm:min-h-[56px] group">
                      <div className="w-9 h-9 rounded-xl bg-love-soft flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-pink-500" />
                      </div>
                      <span className="font-semibold text-sm dark:text-white text-gray-900 group-hover:text-pink-500 transition-colors">{r.label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Contact CTA */}
              <div className="p-4 sm:p-5 rounded-2xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-white text-gray-900 mb-0.5">Cookie questions?</p>
                      <p className="text-xs dark:text-gray-500 text-gray-500">Get in touch with our Privacy team</p>
                    </div>
                  </div>
                  <a href="mailto:privacy@smartzconnect.com"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-500/20 hover:opacity-90 active:scale-95 transition-all min-h-[44px] w-full sm:w-auto">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">privacy@smartzconnect.com</span>
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
