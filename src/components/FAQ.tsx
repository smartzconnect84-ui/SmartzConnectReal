import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    q: 'Is SmartzConnect free to use?',
    a: 'Yes! SmartzConnect has a generous free tier with 10 swipes per day, access to the social feed, group chats, and marketplace browsing. Upgrade to Premium ($9.99/mo) or VIP ($24.99/mo) for unlimited access and exclusive features.',
    category: 'Pricing',
  },
  {
    q: 'How do I pay with Mobile Money?',
    a: 'We accept MTN Mobile Money and Orange Money directly in the app. Go to Settings → Subscriptions → Choose your plan → Select MoMo as payment method. You\'ll receive a prompt on your phone to confirm the payment.',
    category: 'Payments',
  },
  {
    q: 'Is my data safe on SmartzConnect?',
    a: 'Absolutely. We use end-to-end encryption for all private messages, SSL/TLS for all data in transit, and AES-256 encryption for stored data. We never sell your personal data to third parties. Read our Privacy Policy for full details.',
    category: 'Safety',
  },
  {
    q: 'How does the matching algorithm work?',
    a: 'Our AI analyses your profile, interests, location, activity patterns, and mutual connections to suggest the most compatible matches. The more you interact, the smarter it gets. Premium users get priority placement in the Discover feed.',
    category: 'Features',
  },
  {
    q: 'Can I use SmartzConnect outside Africa?',
    a: 'Yes! SmartzConnect is available in 47 countries worldwide. While we\'re built for Africa, users from Europe, North America, and Asia can join and connect with our global community. SmartzRide is currently available in select African cities.',
    category: 'General',
  },
  {
    q: 'How do I become a verified creator on SmartzTV?',
    a: 'Apply for creator status in your profile settings. You\'ll need a VIP subscription, at least 100 followers, and a completed profile with ID verification. Once approved, you can go live, receive gifts, and earn from your streams.',
    category: 'SmartzTV',
  },
  {
    q: 'How does SmartzRide work for drivers?',
    a: 'Apply as a driver through the app with your vehicle documents and ID. After verification (usually 24-48 hours), you can start accepting rides. Earnings are paid weekly via Mobile Money. Drivers keep 80% of each fare.',
    category: 'SmartzRide',
  },
  {
    q: 'What happens if I report someone?',
    a: 'Reports are reviewed by our moderation team within 24 hours. Serious violations (harassment, explicit content, fake profiles) result in immediate suspension. We take safety very seriously and have a zero-tolerance policy for abuse.',
    category: 'Safety',
  },
]

const categories = ['All', 'Pricing', 'Payments', 'Safety', 'Features', 'SmartzTV', 'SmartzRide', 'General']

export default function FAQ() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [open, setOpen] = useState<number | null>(0)
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = faqs.filter(f => activeCategory === 'All' || f.category === activeCategory)

  return (
    <section id="faq" className="py-16 sm:py-24 dark:bg-[#0D0A14] bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }} className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-love-soft border border-pink-500/25 mb-5">
            <HelpCircle className="w-4 h-4 text-brand-pink" />
            <span className="text-sm font-semibold text-brand-pink">Got questions?</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-4 leading-tight">
            Frequently Asked <span className="text-gradient-love">Questions</span>
          </h2>
          <p className="text-base sm:text-lg dark:text-gray-400 text-gray-600">
            Everything you need to know about SmartzConnect.
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat); setOpen(null) }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {cat}
            </button>
          ))}
        </motion.div>

        {/* FAQ accordion */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((faq, i) => (
              <motion.div key={faq.q}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.04 }}
                className={`dark:bg-[#130E1E] bg-gray-50 rounded-2xl border transition-all duration-200 overflow-hidden ${open === i ? 'dark:border-pink-500/30 border-pink-300 shadow-lg shadow-pink-500/5' : 'dark:border-white/6 border-gray-200 hover:dark:border-white/12 hover:border-gray-300'}`}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${open === i ? 'bg-love-soft text-brand-pink' : 'dark:bg-white/5 bg-gray-200 dark:text-gray-400 text-gray-500'}`}>
                      {faq.category}
                    </span>
                    <span className={`text-sm sm:text-base font-semibold leading-snug ${open === i ? 'text-brand-pink' : 'dark:text-white text-gray-900'}`}>
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180 text-brand-pink' : 'dark:text-gray-500 text-gray-400'}`} />
                </button>

                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                        <div className="h-px dark:bg-white/5 bg-gray-200 mb-4" />
                        <p className="text-sm sm:text-base dark:text-gray-300 text-gray-700 leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}
          className="text-center mt-10 sm:mt-14 p-6 sm:p-8 rounded-2xl sm:rounded-3xl dark:bg-[#130E1E] bg-gray-50 border dark:border-white/6 border-gray-200">
          <p className="text-base sm:text-lg font-bold dark:text-white text-gray-900 mb-2">Still have questions?</p>
          <p className="text-sm dark:text-gray-400 text-gray-600 mb-5">Our support team is available 24/7 on WhatsApp</p>
          <a href="https://wa.me/231776679963" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25">
            💬 Chat on WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  )
}
