import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, ChevronDown, ArrowUp, Shield, Cookie,
  Mail, Clock, UserCheck, AlertTriangle, ShoppingBag,
  Car, CreditCard, Lock, Gavel, Scale, Trash2,
  Globe, Phone, MessageCircle,
} from 'lucide-react'

const sections = [
  {
    id: 'acceptance',
    num: '01',
    icon: UserCheck,
    title: 'Acceptance of Terms',
    content: `By accessing or using SmartzConnect — including any of our eight products (SmartzSocial, SmartzDating, SmartzMarket, SmartzRide, SmartzDelivery, SmartzTV, SmartzAds, and SmartzLearning) — you agree to be legally bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use our platform.\n\nWe reserve the right to modify these Terms at any time. We will provide notice of significant changes via email or an in-app banner. Your continued use of the platform after changes take effect constitutes your acceptance of the revised Terms.`,
    bullets: false,
  },
  {
    id: 'eligibility',
    num: '02',
    icon: UserCheck,
    title: 'Eligibility',
    content: `You must be at least 18 years of age to create an account and use SmartzConnect. By registering, you confirm that:`,
    bullets: [
      'You are 18 years of age or older',
      'You have the legal capacity to enter into a binding agreement',
      'You are not prohibited by any applicable law from using our services',
      'You have not previously been banned or suspended from the platform',
    ],
    suffix: `If you are accessing the platform on behalf of a business or organisation, you represent that you have the authority to bind that entity to these Terms.`,
  },
  {
    id: 'account-responsibilities',
    num: '03',
    icon: Lock,
    title: 'Account Responsibilities',
    content: `You are solely responsible for maintaining the confidentiality of your account credentials. Specifically:`,
    bullets: [
      'Do not share your password or allow others to access your account',
      'You are responsible for all activities that occur under your account',
      'Notify us immediately at support@smartzconnect.com if you suspect unauthorised access',
      'Use a strong, unique password and enable any available two-factor authentication',
      'Do not create multiple accounts to circumvent bans, restrictions, or feature limits',
    ],
    suffix: `We are not liable for any loss or damage arising from your failure to maintain account security.`,
  },
  {
    id: 'acceptable-use',
    num: '04',
    icon: AlertTriangle,
    title: 'Acceptable Use',
    content: `You agree not to use SmartzConnect to:`,
    bullets: [
      'Post, share, or transmit illegal, harmful, threatening, abusive, harassing, or defamatory content',
      'Impersonate any person, business, or entity, or falsely claim affiliations',
      'Engage in spam, bulk messaging, or any form of unsolicited communication',
      'Scrape, harvest, or collect data from our platform without written permission',
      'Attempt to gain unauthorised access, disrupt services, or reverse-engineer our systems',
      'Use the platform for any commercial purpose not expressly permitted',
      'Violate any applicable local, national, or international law or regulation',
    ],
    suffix: `Violation of these rules may result in immediate account suspension or termination.`,
  },
  {
    id: 'content-ownership',
    num: '05',
    icon: FileText,
    title: 'Content Ownership',
    content: `You retain full ownership of any content you create and post on SmartzConnect — including posts, photos, videos, messages, and profile information ("User Content").\n\nBy posting User Content, you grant SmartzConnect a worldwide, non-exclusive, royalty-free, sublicensable licence to use, copy, modify, distribute, and display that content in connection with operating and improving the platform. This licence ends when you delete your content or close your account, except where your content has been shared by others.\n\nYou represent and warrant that you own or have the necessary rights to post your User Content, and that it does not infringe any third-party rights.`,
    bullets: false,
  },
  {
    id: 'prohibited-content',
    num: '06',
    icon: AlertTriangle,
    title: 'Prohibited Content',
    content: `The following content is strictly prohibited on SmartzConnect and will result in immediate removal and possible account termination:`,
    bullets: [
      'Nudity, sexually explicit material, or sexual solicitation',
      'Graphic violence, gore, or content glorifying harm',
      'Hate speech targeting race, ethnicity, religion, gender, sexual orientation, disability, or nationality',
      'Content that exploits, endangers, or sexualises minors — we report all such cases to relevant authorities',
      'Coordinated campaigns of harassment, bullying, or threats',
      'Deliberately false information designed to deceive users',
      'Content that promotes illegal drugs, weapons trafficking, or criminal activity',
      'Spam, pyramid schemes, or fraudulent offers',
    ],
  },
  {
    id: 'marketplace-rules',
    num: '07',
    icon: ShoppingBag,
    title: 'Marketplace Rules',
    content: `When using SmartzMarket, you agree to:`,
    bullets: [
      'Provide accurate, honest descriptions of all products and services listed',
      'Honour agreed prices and complete transactions in good faith',
      'Not list counterfeit, stolen, or prohibited goods',
      'Resolve disputes respectfully and in accordance with our Dispute Resolution process',
      'Not use the marketplace for money laundering, fraud, or any illegal financial activity',
    ],
    suffix: `SmartzConnect acts solely as a platform connecting buyers and sellers. We are not a party to any transaction and do not guarantee the quality, safety, legality, or delivery of listed items. Users transact at their own risk.`,
  },
  {
    id: 'ride-services',
    num: '08',
    icon: Car,
    title: 'Ride Services',
    content: `SmartzRide connects riders with independent drivers. By using SmartzRide:`,
    bullets: [
      'Drivers acknowledge they are independent service providers, not employees of SmartzConnect',
      'Riders agree to treat drivers with respect and comply with their reasonable requests',
      'Both parties must comply with all applicable transportation laws and regulations in Liberia and any jurisdiction of use',
      'SmartzConnect is not responsible for the conduct of drivers or riders, accidents, delays, property damage, or any losses arising from ride services',
      'Drivers must maintain valid licences, insurance, and roadworthy vehicles at all times',
    ],
  },
  {
    id: 'subscriptions-payments',
    num: '09',
    icon: CreditCard,
    title: 'Subscriptions & Payments',
    content: `SmartzConnect offers Free, Premium ($5/month), and VIP ($10/month) subscription plans. Regarding payments:`,
    bullets: [
      'Subscription fees are charged in advance on a monthly or yearly basis',
      'Subscriptions auto-renew unless cancelled before the renewal date via App → Settings → Subscriptions',
      'We accept MTN Mobile Money, Orange Money, and other payment methods listed on the Pricing page',
      'Mobile Money payments are verified by our team within 15 minutes (business hours) or 2 hours (after hours)',
      'Refunds are issued at our sole discretion and in accordance with applicable consumer protection laws',
      'Prices may change with 30 days\' notice provided via email and in-app notification',
    ],
  },
  {
    id: 'privacy',
    num: '10',
    icon: Shield,
    title: 'Privacy',
    content: `Your use of SmartzConnect is also governed by our Privacy Policy, which is incorporated by reference into these Terms. By using the platform, you consent to the data practices described in our Privacy Policy, including the collection, use, and sharing of your personal information as described therein.\n\nOur Cookie Policy separately describes how we use cookies and similar technologies. Both policies are available at the links in our website footer.`,
    bullets: false,
  },
  {
    id: 'intellectual-property',
    num: '11',
    icon: Lock,
    title: 'Intellectual Property',
    content: `All platform elements not provided by users — including the SmartzConnect name and logo, product names (SmartzSocial, SmartzDating, SmartzMarket, SmartzRide, SmartzDelivery, SmartzTV, SmartzAds, SmartzLearning), app design, software code, and original content — are owned by SmartzConnect and protected by Liberian and international intellectual property laws.\n\nYou may not copy, reproduce, modify, distribute, or create derivative works from our proprietary content without our express written permission. Unauthorised use may result in legal action.`,
    bullets: false,
  },
  {
    id: 'limitation-of-liability',
    num: '12',
    icon: Scale,
    title: 'Limitation of Liability',
    content: `To the fullest extent permitted by applicable law:`,
    bullets: [
      'SmartzConnect provides the platform on an "as is" and "as available" basis without warranties of any kind',
      'We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform',
      'Our total aggregate liability for any claim arising from your use of the platform shall not exceed the total amount you paid us in the 12 months preceding the claim',
      'We are not responsible for third-party services, websites, or content linked from our platform',
    ],
    suffix: `Some jurisdictions do not allow certain limitations on liability, so these limitations may not fully apply to you.`,
  },
  {
    id: 'termination',
    num: '13',
    icon: Trash2,
    title: 'Termination',
    content: `Either party may terminate this agreement at any time:`,
    bullets: [
      'You may delete your account at any time through App → Settings → Account → Delete Account. Upon deletion, your data will be removed within 30 days, subject to our data retention obligations.',
      'We may suspend or permanently terminate your account at any time, with or without notice, for violations of these Terms, for conduct we determine to be harmful to other users or the platform, or for any other reason at our discretion.',
    ],
    suffix: `Upon termination, your right to use the platform ceases immediately. Provisions of these Terms that by their nature should survive termination will do so, including content licences, liability limitations, and dispute resolution provisions.`,
  },
  {
    id: 'governing-law',
    num: '14',
    icon: Gavel,
    title: 'Governing Law',
    content: `These Terms are governed by and construed in accordance with the laws of the Republic of Liberia, without regard to its conflict of law provisions. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Monrovia, Liberia, except where prohibited by applicable law in your jurisdiction.\n\nIf you are located in a jurisdiction that requires disputes to be resolved locally, we will make reasonable efforts to accommodate applicable mandatory local law requirements.`,
    bullets: false,
  },
  {
    id: 'contact',
    num: '15',
    icon: Phone,
    title: 'Contact',
    content: `For questions, concerns, or reports regarding these Terms of Service, please contact us:\n\nEmail: legal@smartzconnect.com\nSupport: support@smartzconnect.com\nWhatsApp: +231 776 679 963\nAddress: SmartzConnect Legal Team, Monrovia, Liberia, West Africa.\n\nWe aim to respond to all legal enquiries within 5 business days.`,
    bullets: false,
  },
]

const RELATED = [
  { href: '/privacy',       label: 'Privacy Policy', icon: Shield },
  { href: '/cookie-policy', label: 'Cookie Policy',  icon: Cookie },
]

/* ── Back-to-top ─────────────────────────────────────────────────────── */
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

/* ── Mobile TOC ──────────────────────────────────────────────────────── */
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
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50 dark:hover:text-white hover:text-gray-900 transition-colors text-sm min-h-[44px]">
                  <span className="text-[10px] font-black text-blue-500 w-5 flex-shrink-0">{s.num}</span>
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

/* ── Desktop sidebar TOC ─────────────────────────────────────────────── */
function SidebarTOC() {
  const [active, setActive] = useState('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }) },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    sections.forEach(s => { const el = document.getElementById(s.id); if (el) observerRef.current?.observe(el) })
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
              <a key={s.id} href={`#${s.id}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all min-h-[40px] group ${isActive ? 'dark:bg-blue-500/10 bg-blue-50 text-blue-500 font-bold' : 'dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50 dark:hover:text-white hover:text-gray-900'}`}>
                <span className={`text-[10px] font-black w-5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'dark:text-gray-600 text-gray-400 group-hover:text-blue-400'}`}>{s.num}</span>
                <span className="leading-tight">{s.title}</span>
                {isActive && <div className="ml-auto w-1 h-4 rounded-full bg-blue-500 flex-shrink-0" />}
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

/* ── Section body renderer ───────────────────────────────────────────── */
function SectionBody({ s }: { s: typeof sections[number] }) {
  return (
    <div className="px-4 sm:px-6 lg:px-7 py-4 sm:py-5 space-y-3">
      {/* Intro paragraph(s) */}
      {s.content.split('\n').filter(Boolean).map((para, pi) => (
        <p key={pi} className="text-sm sm:text-base dark:text-gray-400 text-gray-600 leading-relaxed">
          {para}
        </p>
      ))}

      {/* Bullet list */}
      {Array.isArray(s.bullets) && s.bullets.length > 0 && (
        <ul className="space-y-2 pl-1">
          {s.bullets.map((item, bi) => (
            <li key={bi} className="flex items-start gap-2.5 text-sm sm:text-base dark:text-gray-400 text-gray-600 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Suffix paragraph */}
      {'suffix' in s && s.suffix && (
        <p className="text-sm sm:text-base dark:text-gray-400 text-gray-600 leading-relaxed">
          {s.suffix as string}
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function TermsPage() {
  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">
      <BackToTop />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-[#1a0a2e] via-[#0d0518] to-[#1d0a30]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-white/40 mb-5 sm:mb-6">
              <Link to="/" className="hover:text-white/70 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white/60">Terms of Service</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 flex-shrink-0">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-white mb-2 sm:mb-3 leading-tight">
                  Terms of Service
                </h1>
                <p className="text-white/65 text-sm sm:text-base max-w-xl leading-relaxed mb-4 sm:mb-5">
                  The legal agreement governing your use of SmartzConnect and all eight of our products. Please read carefully before using our platform.
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[11px] sm:text-xs font-semibold">
                    <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> Last updated: June 19, 2026
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[11px] sm:text-xs font-semibold">
                    <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> ~8 min read · 15 sections
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[11px] sm:text-xs font-semibold">
                    <Gavel className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> Liberia &amp; International Law
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

            {/* Intro card */}
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 sm:p-6 lg:p-7 border dark:border-white/8 border-gray-200 mb-4 sm:mb-5 shadow-sm">
              <p className="dark:text-gray-300 text-gray-700 leading-relaxed text-sm sm:text-base">
                Welcome to SmartzConnect. These Terms of Service ("Terms") constitute a legally binding agreement between you and SmartzConnect governing your use of our platform. By creating an account or using any part of the platform, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, please do not use our services.
              </p>
            </div>

            {/* Important notice */}
            <div className="dark:bg-blue-500/8 bg-blue-50 rounded-2xl p-4 sm:p-5 border dark:border-blue-500/20 border-blue-200 mb-5 sm:mb-6 flex gap-3">
              <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm dark:text-blue-300 text-blue-700 leading-relaxed">
                <span className="font-bold">Important:</span> These Terms apply to all SmartzConnect products including SmartzSocial, SmartzDating, SmartzMarket, SmartzRide, SmartzDelivery, SmartzTV, SmartzAds, and SmartzLearning.
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
                    transition={{ delay: i * 0.025, duration: 0.4 }}
                    className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-sm scroll-mt-28"
                  >
                    <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-7 py-3.5 sm:py-4 lg:py-5 border-b dark:border-white/6 border-gray-100">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-sm sm:text-base lg:text-lg dark:text-white text-gray-900 leading-snug">
                          {s.title}
                        </h2>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-black text-blue-500/60 flex-shrink-0">{s.num}</span>
                    </div>
                    <SectionBody s={s} />
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
                      className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:hover:border-blue-500/30 hover:border-blue-300 dark:hover:bg-blue-500/5 hover:bg-blue-50 transition-all min-h-[52px] sm:min-h-[56px] group">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="font-semibold text-sm dark:text-white text-gray-900 group-hover:text-blue-500 transition-colors">{r.label}</span>
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
                      <p className="font-bold text-sm dark:text-white text-gray-900 mb-0.5">Legal questions?</p>
                      <p className="text-xs dark:text-gray-500 text-gray-500">Contact our Legal team directly</p>
                    </div>
                  </div>
                  <a href="mailto:legal@smartzconnect.com"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:opacity-90 active:scale-95 transition-all min-h-[44px] w-full sm:w-auto">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">legal@smartzconnect.com</span>
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
