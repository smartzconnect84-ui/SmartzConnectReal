import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Check, Zap, Crown, Heart, X } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Heart,
    color: 'from-gray-500 to-slate-600',
    border: 'dark:border-white/8 border-gray-200',
    badge: null,
    features: [
      { text: '10 swipes per day',         included: true },
      { text: 'Basic profile',              included: true },
      { text: 'Public feed & posts',        included: true },
      { text: 'Group chat rooms',           included: true },
      { text: 'Marketplace browsing',       included: true },
      { text: 'Unlimited swipes',           included: false },
      { text: 'See who liked you',          included: false },
      { text: 'SmartzTV streaming',         included: false },
      { text: 'Priority in Discover',       included: false },
      { text: 'Verified badge',             included: false },
    ],
    cta: 'Get Started Free',
    ctaStyle: 'dark:bg-white/8 bg-gray-100 dark:text-white text-gray-900 hover:dark:bg-white/12 hover:bg-gray-200',
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    icon: Zap,
    color: 'from-pink-500 to-rose-600',
    border: 'border-pink-500/40',
    badge: 'Most Popular',
    features: [
      { text: 'Unlimited swipes',           included: true },
      { text: 'See who liked you',          included: true },
      { text: 'Priority in Discover',       included: true },
      { text: 'SmartzTV streaming',         included: true },
      { text: 'Marketplace selling',        included: true },
      { text: 'Private group chats',        included: true },
      { text: 'Read receipts',              included: true },
      { text: 'Verified badge',             included: false },
      { text: 'CEO-level analytics',        included: false },
      { text: 'Dedicated support',          included: false },
    ],
    cta: 'Go Premium 💕',
    ctaStyle: 'bg-love-gradient text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02]',
  },
  {
    name: 'VIP',
    price: '$24.99',
    period: 'per month',
    icon: Crown,
    color: 'from-amber-500 to-yellow-600',
    border: 'border-amber-500/40',
    badge: 'Best Value',
    features: [
      { text: 'Everything in Premium',      included: true },
      { text: 'Verified badge ✓',           included: true },
      { text: 'Top of Discover feed',       included: true },
      { text: 'Dedicated support',          included: true },
      { text: 'Advanced analytics',         included: true },
      { text: 'Exclusive VIP events',       included: true },
      { text: 'Custom profile themes',      included: true },
      { text: 'Unlimited Super Likes',      included: true },
      { text: 'Revenue share (creators)',   included: true },
      { text: 'Early feature access',       included: true },
    ],
    cta: 'Go VIP 👑',
    ctaStyle: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02]',
  },
]

const momoMethods = [
  { name: 'MTN MoMo',     emoji: '📱', color: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/25' },
  { name: 'Orange Money', emoji: '🟠', color: 'bg-orange-500/15 text-orange-600 border-orange-500/25' },
  { name: 'Stripe',       emoji: '💳', color: 'bg-blue-500/15 text-blue-600 border-blue-500/25' },
  { name: 'PayPal',       emoji: '🅿️', color: 'bg-indigo-500/15 text-indigo-600 border-indigo-500/25' },
]

export default function Pricing() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-24 dark:bg-[#080510] bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-500/3 to-purple-500/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }} className="text-center mb-8 sm:mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-love-soft border border-pink-500/25 mb-4 sm:mb-5">
            <Crown className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-brand-pink" />
            <span className="text-xs sm:text-sm font-semibold text-brand-pink">Simple, transparent pricing</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl xl:text-5xl dark:text-white text-gray-900 mb-3 sm:mb-4 leading-tight">
            Choose Your <span className="text-gradient-love">Plan</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg dark:text-gray-400 text-gray-600 max-w-xl mx-auto mb-5 sm:mb-6 px-2">
            Start free, upgrade when you're ready. Cancel anytime. Pay with Mobile Money or card.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-0.5 sm:gap-1 p-1 rounded-xl dark:bg-white/5 bg-gray-200">
            {(['monthly', 'yearly'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold capitalize transition-all ${billing === b ? 'bg-love-gradient text-white shadow-sm' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                {b} {b === 'yearly' && <span className="text-[10px] text-emerald-400 font-bold ml-1">-20%</span>}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plans grid — stacked on mobile, 3-col on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-10 sm:mb-12">
          {plans.map((plan, i) => {
            const Icon = plan.icon
            const price = billing === 'yearly' && plan.price !== '$0'
              ? `$${(parseFloat(plan.price.slice(1)) * 0.8).toFixed(2)}`
              : plan.price

            return (
              <motion.div key={plan.name}
                initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative dark:bg-[#130E1E] bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 border-2 ${plan.border} flex flex-col ${plan.name === 'Premium' ? 'md:-mt-4 md:mb-4 md:shadow-2xl md:shadow-pink-500/15' : ''} transition-all hover:shadow-xl`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black text-white bg-gradient-to-r ${plan.color} shadow-lg whitespace-nowrap`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-display font-black text-base sm:text-lg dark:text-white text-gray-900">{plan.name}</p>
                    <p className="text-[10px] sm:text-xs dark:text-gray-500 text-gray-400">{plan.period}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5 sm:mb-6">
                  <span className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900">{price}</span>
                  {plan.price !== '$0' && <span className="text-xs sm:text-sm dark:text-gray-400 text-gray-500 ml-1">/mo</span>}
                  {billing === 'yearly' && plan.price !== '$0' && (
                    <p className="text-[10px] sm:text-xs text-emerald-500 font-semibold mt-1">Save 20% with annual billing</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-7 flex-1">
                  {plan.features.map(f => (
                    <li key={f.text} className={`flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm ${f.included ? 'dark:text-gray-300 text-gray-700' : 'dark:text-gray-600 text-gray-400 line-through'}`}>
                      {f.included
                        ? <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-500 flex-shrink-0" />
                        : <X className="w-3.5 sm:w-4 h-3.5 sm:h-4 dark:text-gray-700 text-gray-300 flex-shrink-0" />
                      }
                      {f.text}
                    </li>
                  ))}
                </ul>

                <Link to="/register"
                  className={`w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold text-center transition-all ${plan.ctaStyle}`}>
                  {plan.cta}
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Payment methods */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}
          className="text-center">
          <p className="text-xs sm:text-sm dark:text-gray-500 text-gray-400 mb-3 sm:mb-4">Accepted payment methods</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {momoMethods.map(m => (
              <span key={m.name} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border ${m.color}`}>
                <span>{m.emoji}</span> {m.name}
              </span>
            ))}
          </div>
          <p className="text-[10px] sm:text-xs dark:text-gray-600 text-gray-400 mt-3 sm:mt-4">
            🔒 Secure payments · Cancel anytime · No hidden fees
          </p>
        </motion.div>
      </div>
    </section>
  )
}
