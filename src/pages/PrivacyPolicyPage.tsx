import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ChevronDown, ChevronUp, ArrowUp, FileText, Cookie,
  Mail, Database, Eye, Lock, Users, Globe, Clock,
  RefreshCw, Phone, AlertTriangle,
} from 'lucide-react'

/* ── Section data ──────────────────────────────────────────────────────── */
const sections = [
  {
    id: 'information-we-collect',
    num: '01',
    icon: Database,
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, including your name, email address, date of birth, profile information, and content you create on the platform. We also automatically collect usage data (pages visited, features used), device information (device type, OS, browser), location data (only with your permission), and communications metadata (timestamps, read receipts). When you make payments, our payment processors collect financial details — we do not store raw card or mobile money data.`,
  },
  {
    id: 'how-we-use-information',
    num: '02',
    icon: Eye,
    title: 'How We Use Your Information',
    content: `We use your information to: provide, maintain, and continuously improve our platform and eight products; facilitate genuine connections between users; process payments and manage subscriptions; send transactional and promotional notifications (which you can manage in Settings); personalise your discovery feed and match recommendations; enforce our community standards and keep the platform safe; comply with legal obligations in Liberia and internationally; and conduct platform analytics to understand how features are used and to guide product decisions.`,
  },
  {
    id: 'information-sharing',
    num: '03',
    icon: Users,
    title: 'Information Sharing',
    content: `We do not sell your personal data — ever. We share information in the following limited circumstances: with other users as part of the platform's core functionality (your public profile is visible to other logged-in users); with trusted third-party service providers (cloud hosting, payment processing, push notifications, live streaming, analytics) who process data on our behalf under strict confidentiality agreements; with law enforcement or authorities when legally required; and in the event of a business transaction (merger or acquisition), in which case we'll notify you and your rights will be preserved.`,
  },
  {
    id: 'data-retention',
    num: '04',
    icon: Clock,
    title: 'Data Retention',
    content: `We retain your personal data for as long as your account is active or as reasonably needed to provide you services. When you delete your account, we begin the deletion process within 30 days. Some data may be retained for longer periods where required by law (e.g. financial transaction records), for legitimate safety purposes (e.g. flagged content reports), or to prevent fraud. Anonymised, aggregated data may be retained indefinitely for platform analytics and research.`,
  },
  {
    id: 'your-rights',
    num: '05',
    icon: Shield,
    title: 'Your Rights (GDPR & CCPA)',
    content: `Depending on your location, you may have the right to: access a copy of your personal data; correct inaccurate or outdated information; request deletion of your account and data ("right to be forgotten"); object to or restrict certain processing activities; data portability (receive your data in a machine-readable format); and withdraw consent at any time where processing is consent-based. To exercise any of these rights, contact our Data Protection Officer at privacy@smartzconnect.com. We respond to all requests within 30 days.`,
  },
  {
    id: 'cookies',
    num: '06',
    icon: Cookie,
    title: 'Cookies',
    content: `We use cookies and similar tracking technologies (web beacons, local storage) to keep you logged in, remember your preferences, analyse platform usage, and deliver personalised content. You can manage cookie preferences through the cookie banner shown on first visit, or by adjusting your browser's cookie settings at any time. Note that disabling strictly necessary cookies will affect platform functionality. See our Cookie Policy for a full breakdown of the types of cookies we use.`,
  },
  {
    id: 'security',
    num: '07',
    icon: Lock,
    title: 'Security',
    content: `We implement industry-standard technical and organisational security measures including: TLS/HTTPS encryption for all data in transit; encryption of sensitive data at rest; role-based access controls ensuring staff access only the data they need; regular security assessments and penetration testing; and secure coding practices reviewed for OWASP Top 10 vulnerabilities. While we strive to protect your data, no internet transmission or storage system is 100% secure. If you become aware of any security vulnerability, please report it responsibly to security@smartzconnect.com.`,
  },
  {
    id: 'children',
    num: '08',
    icon: AlertTriangle,
    title: 'Children',
    content: `SmartzConnect is strictly intended for users who are 18 years of age or older. We do not knowingly collect personal data from individuals under 18. All registrations require date-of-birth confirmation, and accounts identified as belonging to minors are terminated immediately. If you are a parent or guardian and believe your child has created an account, please contact us at privacy@smartzconnect.com so we can promptly delete the data and close the account.`,
  },
  {
    id: 'international-transfers',
    num: '09',
    icon: Globe,
    title: 'International Transfers',
    content: `SmartzConnect operates globally and your personal data may be transferred to and processed in countries other than your own. Where data is transferred outside of the EEA or other jurisdictions with transfer restrictions, we ensure appropriate safeguards are in place — including standard contractual clauses (SCCs) approved by relevant data protection authorities and adequacy decisions where applicable. By using our platform, you acknowledge these transfers.`,
  },
  {
    id: 'changes-to-policy',
    num: '10',
    icon: RefreshCw,
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or for other operational reasons. We will notify you of any material changes via email (to the address on your account) and via an in-app banner at least 14 days before the changes take effect. Your continued use of the platform after the effective date constitutes your acceptance of the updated policy. The "Last updated" date at the top of this page reflects the most recent revision.`,
  },
  {
    id: 'contact-us',
    num: '11',
    icon: Phone,
    title: 'Contact Us',
    content: `For privacy questions, data access requests, or to exercise any of your rights, please contact our Data Protection Officer:\n\nEmail: privacy@smartzconnect.com\nWhatsApp: +231 776 679 963\nMailing address: SmartzConnect Privacy Team, Monrovia, Liberia, West Africa.\n\nWe are committed to resolving privacy concerns fairly and promptly, typically within 30 days.`,
  },
]

const RELATED = [
  { href: '/terms',         label: 'Terms of Service',  icon: FileText },
  { href: '/cookie-policy', label: 'Cookie Policy',     icon: Cookie   },
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

/* ── Mobile TOC accordion ──────────────────────────────────────────────── */
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
        {open
          ? <ChevronUp className="w-4 h-4 dark:text-gray-400 text-gray-500 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 dark:text-gray-400 text-gray-500 flex-shrink-0" />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t dark:border-white/6 border-gray-100"
          >
            <nav className="p-3 space-y-0.5 max-h-72 overflow-y-auto">
              {sections.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50 dark:hover:text-white hover:text-gray-900 transition-colors text-sm min-h-[44px]"
                >
                  <span className="text-[10px] font-black text-pink-500 w-5 flex-shrink-0">{s.num}</span>
                  <span className="leading-tight">{s.title}</span>
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
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5 shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto">
        <p className="text-[10px] font-black uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-4 px-2">Contents</p>
        <nav className="space-y-0.5">
          {sections.map(s => {
            const isActive = active === s.id
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-all min-h-[44px] group ${
                  isActive
                    ? 'dark:bg-pink-500/10 bg-pink-50 text-pink-500 font-bold'
                    : 'dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50 dark:hover:text-white hover:text-gray-900'
                }`}
              >
                <span className={`text-[10px] font-black w-5 flex-shrink-0 ${isActive ? 'text-pink-500' : 'dark:text-gray-600 text-gray-400 group-hover:text-pink-400'}`}>{s.num}</span>
                <span className="leading-tight">{s.title}</span>
                {isActive && <div className="ml-auto w-1 h-4 rounded-full bg-pink-500 flex-shrink-0" />}
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function PrivacyPolicyPage() {
  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">
      <BackToTop />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-[#1a0a2e] via-[#0d0518] to-[#1d0a30]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-500/12 blur-3xl" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-white/40 mb-5 sm:mb-6">
              <Link to="/" className="hover:text-white/70 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white/60">Privacy Policy</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-love-gradient flex items-center justify-center shadow-xl shadow-pink-500/30 flex-shrink-0">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-white mb-2 sm:mb-3 leading-tight">
                  Privacy Policy
                </h1>
                <p className="text-white/65 text-sm sm:text-base max-w-xl leading-relaxed mb-4 sm:mb-5">
                  How SmartzConnect collects, uses, shares, and protects your personal information across all eight products.
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[11px] sm:text-xs font-semibold">
                    <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> Last updated: June 19, 2026
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[11px] sm:text-xs font-semibold">
                    <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> ~6 min read
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-semibold">
                    <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> GDPR &amp; CCPA Compliant
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

          {/* Sidebar (desktop) */}
          <SidebarTOC />

          {/* Content */}
          <main className="min-w-0">
            {/* Mobile TOC */}
            <MobileTOC />

            {/* Intro card */}
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 sm:p-6 lg:p-7 border dark:border-white/8 border-gray-200 mb-4 sm:mb-5 shadow-sm">
              <p className="dark:text-gray-300 text-gray-700 leading-relaxed text-sm sm:text-base">
                SmartzConnect ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and any of our eight products — SmartzSocial, SmartzDating, SmartzMarket, SmartzRide, SmartzDelivery, SmartzTV, SmartzAds, and SmartzLearning. By using our platform, you agree to this policy.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-5">
              {sections.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.div
                    key={s.id}
                    id={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                    className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-sm scroll-mt-28"
                  >
                    {/* Section header */}
                    <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-7 py-3.5 sm:py-4 lg:py-5 border-b dark:border-white/6 border-gray-100">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-love-soft flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-sm sm:text-base lg:text-lg dark:text-white text-gray-900 leading-snug">
                          {s.title}
                        </h2>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-black text-pink-500/60 flex-shrink-0">{s.num}</span>
                    </div>
                    {/* Section body */}
                    <div className="px-4 sm:px-6 lg:px-7 py-4 sm:py-5">
                      {s.content.split('\n').filter(Boolean).map((para, pi) => (
                        <p key={pi} className="text-sm sm:text-base dark:text-gray-400 text-gray-600 leading-relaxed mb-3 last:mb-0">
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
                    <Link
                      key={r.href}
                      to={r.href}
                      className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:hover:border-pink-500/30 hover:border-pink-300 dark:hover:bg-pink-500/5 hover:bg-pink-50 transition-all min-h-[52px] sm:min-h-[56px] group"
                    >
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
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-white text-gray-900 mb-0.5">Privacy questions?</p>
                      <p className="text-xs dark:text-gray-500 text-gray-500">Contact our Data Protection Officer</p>
                    </div>
                  </div>
                  <a
                    href="mailto:privacy@smartzconnect.com"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-90 active:scale-95 transition-all min-h-[44px] w-full sm:w-auto"
                  >
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
