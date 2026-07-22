import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LifeBuoy, MessageCircle, Mail, ChevronDown, Shield, CreditCard,
  Heart, Video, Users, Settings, Search,
} from 'lucide-react'
import { openTawkChat } from '@/lib/tawk'
import { cmsList } from '@/lib/contentSync'

const categories = [
  { icon: Heart,     label: 'Dating & Matching',   desc: 'Discover, likes, Spin & Chat' },
  { icon: Users,     label: 'Social & Feed',       desc: 'Posts, groups, WorldChat'     },
  { icon: CreditCard,label: 'Billing & Plans',     desc: 'Subscriptions, payments'      },
  { icon: Video,     label: 'Calls & SmartzTV',    desc: 'Video/audio calls, live TV'   },
  { icon: Shield,    label: 'Safety & Privacy',    desc: 'Reporting, blocking, data'     },
  { icon: Settings,  label: 'Account & Settings',  desc: 'Profile, notifications, login' },
]

const FALLBACK_FAQS = [
  {
    q: 'How do I reset my password?',
    a: "Go to the login screen and tap \"Forgot password\". Enter the email on your account and we'll send you a reset link. If you don't see it, check your spam folder.",
  },
  {
    q: 'How does Spin & Chat matching work?',
    a: 'Spin & Chat randomly connects you with people who share your interests and, when possible, your country — so conversations start with common ground.',
  },
  {
    q: 'How do I upgrade or cancel my subscription?',
    a: 'Open Settings → Subscriptions to see your current plan, upgrade, or cancel. Changes take effect at the end of your current billing cycle.',
  },
  {
    q: 'How do I report or block someone?',
    a: "Open their profile or chat, tap the ⋯ menu, and choose Report or Block. Our Safety team reviews every report — see our Privacy Policy for details on how reports are handled.",
  },
  {
    q: 'Why am I not receiving notifications?',
    a: 'Check that notifications are enabled both in Settings → Notifications inside the app and in your device/browser permissions. On mobile, make sure background app refresh is on.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings → Account → Delete Account. This permanently removes your profile and data, subject to the retention terms in our Privacy Policy.',
  },
]

interface FaqRow { id: string; question: string; answer: string; is_active: boolean; sort_order: number; page_context: string }

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 min-h-[52px] text-left"
      >
        <span className="font-semibold text-sm sm:text-base dark:text-white text-gray-900">{q}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 dark:text-gray-500 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 -mt-1">
          <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function HelpSupportPage() {
  const [query, setQuery] = useState('')
  const [dbFaqs, setDbFaqs] = useState<FaqRow[]>([])

  useEffect(() => {
    cmsList<FaqRow>('faq_items', { orderBy: 'sort_order' }).then(rows => {
      const helpRows = rows.filter(r => r.is_active && r.page_context === 'help')
      if (helpRows.length > 0) setDbFaqs(helpRows)
    })
  }, [])

  const faqs = dbFaqs.length > 0
    ? dbFaqs.map(r => ({ q: r.question, a: r.answer }))
    : FALLBACK_FAQS

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative py-16 sm:py-20 bg-gradient-to-br from-[#1a0a2e] via-[#0d0518] to-[#1d0a30]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pink-500/20 blur-3xl" />
          </div>
          <div className="relative max-w-2xl mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 backdrop-blur-sm border border-white/20 mb-4">
              <LifeBuoy className="w-4 h-4 text-pink-300" />
              <span className="text-xs sm:text-sm font-semibold text-white">Help & Support</span>
            </motion.div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white mb-3">
              How can we <span className="text-pink-300">help</span>?
            </h1>
            <p className="text-sm sm:text-base text-white/70 mb-6">
              Search our help center or chat live with our team — we usually reply within minutes.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search for help…"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-pink-400/50 focus:bg-white/15 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          <button
            onClick={() => openTawkChat()}
            className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-200 text-left hover:border-pink-500/30 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="font-bold text-sm dark:text-white text-gray-900 mb-1">Live Support</p>
            <p className="text-xs dark:text-gray-500 text-gray-500">Chat with our team now</p>
          </button>

          <a
            href="https://wa.me/231776679963" target="_blank" rel="noopener noreferrer"
            className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-200 text-left hover:border-pink-500/30 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.9-.4-1.9-1.1-2.7-2-.7-.8-1.2-1.7-1.6-2.5-.1-.3 0-.5.1-.6.1-.2.5-.6.6-.8.1-.2.1-.4 0-.6-.1-.2-.6-1.5-.9-2-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1.1-1 2.6s1 3 1.2 3.2c.2.2 2.3 3.5 5.5 4.7 3.3 1.3 3.3.9 3.9.8.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.2L2 22l4.9-1.5C8.4 21.5 10.2 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
            </div>
            <p className="font-bold text-sm dark:text-white text-gray-900 mb-1">WhatsApp Us</p>
            <p className="text-xs dark:text-gray-500 text-gray-500">+231 776 679 963</p>
          </a>

          <a
            href="mailto:support@smartzconnect.com"
            className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-200 text-left hover:border-pink-500/30 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <p className="font-bold text-sm dark:text-white text-gray-900 mb-1">Email Support</p>
            <p className="text-xs dark:text-gray-500 text-gray-500">support@smartzconnect.com</p>
          </a>
        </div>

        {/* Browse by category */}
        <div className="mb-14">
          <h2 className="font-display font-black text-lg sm:text-xl dark:text-white text-gray-900 mb-5">Browse by topic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(c => (
              <div key={c.label}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-200 flex items-center gap-3 hover:border-purple-500/20 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                  <c.icon className="w-[18px] h-[18px] text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm dark:text-white text-gray-900">{c.label}</p>
                  <p className="text-xs dark:text-gray-500 text-gray-500">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-14">
          <h2 className="font-display font-black text-lg sm:text-xl dark:text-white text-gray-900 mb-5">Frequently asked questions</h2>
          <div className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0 && !query} />)
            ) : (
              <p className="text-sm dark:text-gray-500 text-gray-500 text-center py-6">No results for "{query}". Try live chat below.</p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#1f0d38] via-[#2d1060] to-[#1a0a2e] p-6 sm:p-10 text-center">
          <h2 className="font-display font-black text-lg sm:text-2xl text-white mb-2">Still need help?</h2>
          <p className="text-white/70 mb-5 text-sm max-w-md mx-auto">
            Our support team is online and ready to chat. Or check our{' '}
            <Link to="/privacy" className="text-pink-300 underline">Privacy Policy</Link>{' '}and{' '}
            <Link to="/terms" className="text-pink-300 underline">Terms of Service</Link>.
          </p>
          <button
            onClick={() => openTawkChat()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold inline-flex items-center gap-2 text-sm shadow-lg shadow-purple-600/30"
          >
            <MessageCircle className="w-4 h-4" /> Start Live Chat
          </button>
        </div>
      </div>
    </div>
  )
}
