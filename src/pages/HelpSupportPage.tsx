import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, MessageCircle, Mail, Phone, ChevronDown, ChevronUp,
  ExternalLink, CheckCircle, AlertCircle, Zap, Shield, CreditCard,
  Users, Tv, Car, ShoppingBag, BookOpen, Headphones
} from 'lucide-react'
import { openTawkChat } from '@/lib/tawk'

const SUPPORT_EMAIL = 'support@smartzconnect.com'
const BUSINESS_EMAIL = 'business@smartzconnect.com'
const SUPPORT_PHONE = '+231 776 679 963'

const faqItems = [
  {
    category: 'Account',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    questions: [
      {
        q: 'How do I reset my password?',
        a: 'Go to the Login page and click "Forgot password?" Enter your email and we\'ll send you a reset link. Check your spam folder if you don\'t see it within a few minutes.',
      },
      {
        q: 'How do I verify my account?',
        a: 'Check your inbox for our verification email after signing up. Click the link inside. If you need to resend it, go to Settings → Account → Resend Verification.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Profile → Settings → Account → Delete Account. This permanently removes all your data. You have 30 days to cancel the deletion by signing back in.',
      },
      {
        q: 'Can I change my email address?',
        a: 'Yes — go to Settings → Account and enter your new email. You\'ll need to verify the new address before the change takes effect.',
      },
    ],
  },
  {
    category: 'Payments',
    icon: CreditCard,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    questions: [
      {
        q: 'How do I pay for a subscription?',
        a: 'Send payment via MTN MoMo or Orange Money, then submit your Transaction ID in App → Subscriptions. Our team confirms within 15 minutes (Mon–Sat).',
      },
      {
        q: 'My payment was confirmed but my plan didn\'t activate.',
        a: 'First, wait up to 30 minutes. If still not active, email support@smartzconnect.com with your Transaction ID, amount, phone number, and account email.',
      },
      {
        q: 'How do I cancel my subscription?',
        a: 'Go to App → Subscriptions → Cancel Plan. Your access continues until the end of your paid period. No refunds for partial months.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Refunds are considered on a case-by-case basis. Contact support@smartzconnect.com within 7 days of payment with your transaction details.',
      },
    ],
  },
  {
    category: 'Dating & Matches',
    icon: Zap,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    questions: [
      {
        q: 'Why am I not getting matches?',
        a: 'Try: complete your profile (photo, bio, interests), expand your distance/age filters, and use the Boost feature. Premium users get 10× more visibility.',
      },
      {
        q: 'Someone is harassing me on the platform.',
        a: 'Tap their profile → Block & Report. Our safety team reviews all reports within 24 hours. For urgent issues, email safety@smartzconnect.com.',
      },
      {
        q: 'What\'s Spin & Chat?',
        a: 'Spin & Chat randomly matches you with someone who shares your interests for a live chat session. It\'s a fun way to meet new people without the pressure of swiping.',
      },
    ],
  },
  {
    category: 'SmartzTV',
    icon: Tv,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    questions: [
      {
        q: 'How do I go live on SmartzTV?',
        a: 'Go to App → SmartzTV → Creator Studio → Go Live. Enter a title, select a category, and tap Start. You\'ll need camera/mic permissions. VIP plan required for live streaming.',
      },
      {
        q: 'My stream isn\'t showing for viewers.',
        a: 'Check: your stream status is "Live" in Creator Studio, you haven\'t been muted by the admin, and viewers have refreshed the page. If still an issue, end and restart the stream.',
      },
      {
        q: 'How do gifts work?',
        a: 'Viewers can send virtual gifts (Roses, Stars, Diamonds, etc.) during a stream. Gifts are cosmetic — no cash value. Future updates will include creator monetization.',
      },
    ],
  },
  {
    category: 'Safety & Privacy',
    icon: Shield,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    questions: [
      {
        q: 'How does SmartzConnect protect my data?',
        a: 'Your data is stored on encrypted Supabase servers (PostgreSQL). We never sell your data to third parties. You can export or delete your data at any time from Settings.',
      },
      {
        q: 'How do I report a fake profile?',
        a: 'Tap the user\'s profile → ⋯ menu → Report. Select "Fake Profile" and add details. Our moderation team investigates all reports within 48 hours.',
      },
      {
        q: 'Is my chat private?',
        a: 'Direct messages are private between you and the recipient. Group chats are visible to all group members. Admins can only access messages reported for safety violations.',
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b dark:border-white/5 border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:dark:bg-white/2 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold dark:text-white text-gray-900 leading-relaxed">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 dark:text-gray-500 text-gray-400 flex-shrink-0 mt-0.5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HelpSupportPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const openChat = () => {
    openTawkChat()
  }

  return (
    <div className="h-full overflow-y-auto dark:bg-[#0A0710] bg-gray-50 pb-8">
      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">

        {/* Header */}
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-love-gradient flex items-center justify-center mx-auto mb-4 shadow-xl shadow-pink-500/30">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">Help & Support</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 max-w-xs mx-auto">
            Find answers to common questions or reach our 24/7 support team.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openChat}
            className="flex items-center gap-3 p-4 rounded-2xl bg-love-gradient text-white shadow-lg shadow-pink-500/25 hover:opacity-90 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Live Chat</p>
              <p className="text-[11px] text-white/80">24/7 AI + Human support</p>
            </div>
          </motion.button>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 p-4 rounded-2xl dark:bg-[#0D0A14] bg-white border dark:border-white/6 border-gray-200 hover:border-brand-pink/30 transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm dark:text-white text-gray-900">Email Us</p>
              <p className="text-[11px] dark:text-gray-400 text-gray-500">support@smartzconnect.com</p>
            </div>
          </a>

          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="flex items-center gap-3 p-4 rounded-2xl dark:bg-[#0D0A14] bg-white border dark:border-white/6 border-gray-200 hover:border-brand-pink/30 transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm dark:text-white text-gray-900">Call Us</p>
              <p className="text-[11px] dark:text-gray-400 text-gray-500">{SUPPORT_PHONE}</p>
            </div>
          </a>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 p-4 rounded-2xl dark:bg-emerald-500/8 bg-emerald-50 border dark:border-emerald-500/15 border-emerald-200">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold dark:text-emerald-400 text-emerald-700">All systems operational</p>
            <p className="text-xs dark:text-emerald-400/70 text-emerald-700/70">Platform, chat, streaming, and payments are running normally.</p>
          </div>
          <a
            href="https://status.smartzconnect.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-500 font-semibold hover:underline flex-shrink-0"
          >
            Status <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* FAQ section */}
        <div>
          <h2 className="font-display font-black text-lg dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-pink" />
            Frequently Asked Questions
          </h2>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${!activeCategory ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}
            >
              All
            </button>
            {faqItems.map(cat => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeCategory === cat.category ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* FAQ cards */}
          <div className="space-y-4">
            {faqItems
              .filter(cat => !activeCategory || cat.category === activeCategory)
              .map((cat, i) => {
                const Icon = cat.icon
                return (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden shadow-sm"
                  >
                    <div className="flex items-center gap-3 px-5 py-4 border-b dark:border-white/5 border-gray-100">
                      <div className={`w-8 h-8 rounded-xl ${cat.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                      </div>
                      <h3 className="font-bold text-sm dark:text-white text-gray-900">{cat.category}</h3>
                    </div>
                    {cat.questions.map((item, j) => (
                      <FaqItem key={j} q={item.q} a={item.a} />
                    ))}
                  </motion.div>
                )
              })}
          </div>
        </div>

        {/* Still need help? */}
        <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-love-soft flex items-center justify-center mx-auto mb-4">
            <Headphones className="w-6 h-6 text-brand-pink" />
          </div>
          <h3 className="font-bold dark:text-white text-gray-900 mb-1">Still need help?</h3>
          <p className="text-sm dark:text-gray-400 text-gray-600 mb-4 max-w-xs mx-auto">
            Our support team is available Monday–Saturday, 8am–10pm WAT. AI assistant is 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={openChat}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-md shadow-pink-500/20"
            >
              <MessageCircle className="w-4 h-4" /> Open Chat
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 text-sm font-semibold hover:text-brand-pink transition-colors"
            >
              <Mail className="w-4 h-4" /> Email Support
            </a>
          </div>
          <div className="mt-4 pt-4 border-t dark:border-white/5 border-gray-100">
            <p className="text-xs dark:text-gray-500 text-gray-400">
              Business inquiries: <a href={`mailto:${BUSINESS_EMAIL}`} className="text-brand-pink hover:underline">{BUSINESS_EMAIL}</a>
              {' · '}
              Safety reports: <a href="mailto:safety@smartzconnect.com" className="text-brand-pink hover:underline">safety@smartzconnect.com</a>
            </p>
          </div>
        </div>

        {/* Feature links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: Shield, label: 'Safety Center', href: '/app/settings', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: CreditCard, label: 'Billing & Plans', href: '/app/subscriptions', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Users, label: 'Community Rules', href: '/terms', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: ShoppingBag, label: 'Marketplace Help', href: '/app/marketplace', color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { icon: Tv, label: 'Creator Guide', href: '/app/smartztv', color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { icon: Car, label: 'Ride Support', href: '/app/ride', color: 'text-teal-400', bg: 'bg-teal-500/10' },
          ].map(item => {
            const Icon = item.icon
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-3.5 rounded-2xl dark:bg-[#0D0A14] bg-white border dark:border-white/6 border-gray-200 hover:border-brand-pink/30 transition-all shadow-sm group"
              >
                <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="text-xs font-semibold dark:text-gray-300 text-gray-700 group-hover:text-brand-pink transition-colors">{item.label}</span>
              </a>
            )
          })}
        </div>

        {/* Alert info */}
        <div className="flex items-start gap-3 p-4 rounded-2xl dark:bg-amber-500/8 bg-amber-50 border dark:border-amber-500/15 border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold dark:text-amber-400 text-amber-700 mb-0.5">Urgent Safety Issues</p>
            <p className="text-xs dark:text-amber-400/80 text-amber-700/80">
              For emergencies or serious violations, email <a href="mailto:safety@smartzconnect.com" className="underline">safety@smartzconnect.com</a> — this inbox is monitored 24/7.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
