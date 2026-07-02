import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Crown, Heart, Zap, X, Shield, Star, Gift } from 'lucide-react'
import CurrencyConverter from '@/components/CurrencyConverter'

const plans = [
  {
    id: 'free', name: 'Free', price: 0, period: 'forever', icon: Heart, color: 'from-gray-500 to-slate-600',
    border: 'dark:border-white/8 border-gray-200', badge: null, current: false,
    features: [
      { text: '10 swipes/day',          ok: true  },
      { text: 'Basic profile',          ok: true  },
      { text: 'Social feed & posts',    ok: true  },
      { text: 'Group chat rooms',       ok: true  },
      { text: 'Marketplace browsing',   ok: true  },
      { text: 'Unlimited swipes',       ok: false },
      { text: 'See who liked you',      ok: false },
      { text: 'SmartzTV streaming',     ok: false },
      { text: 'Priority in Discover',   ok: false },
      { text: 'Verified badge',         ok: false },
    ],
  },
  {
    id: 'premium', name: 'Premium', price: 9.99, period: '/month', icon: Zap, color: 'from-pink-500 to-rose-600',
    border: 'border-pink-500/40', badge: '🔥 Most Popular', current: true,
    features: [
      { text: 'Unlimited swipes',       ok: true  },
      { text: 'See who liked you',      ok: true  },
      { text: 'Priority in Discover',   ok: true  },
      { text: 'SmartzTV streaming',     ok: true  },
      { text: 'Marketplace selling',    ok: true  },
      { text: 'Private group chats',    ok: true  },
      { text: 'Read receipts',          ok: true  },
      { text: 'Verified badge',         ok: false },
      { text: 'CEO analytics',          ok: false },
      { text: 'Dedicated support',      ok: false },
    ],
  },
  {
    id: 'vip', name: 'VIP', price: 24.99, period: '/month', icon: Crown, color: 'from-amber-500 to-yellow-600',
    border: 'border-amber-500/40', badge: '👑 Best Value', current: false,
    features: [
      { text: 'Everything in Premium',  ok: true  },
      { text: 'Verified badge ✓',       ok: true  },
      { text: 'Top of Discover feed',   ok: true  },
      { text: 'Dedicated support',      ok: true  },
      { text: 'Advanced analytics',     ok: true  },
      { text: 'Exclusive VIP events',   ok: true  },
      { text: 'Custom profile themes',  ok: true  },
      { text: 'Unlimited Super Likes',  ok: true  },
      { text: 'Revenue share (creators)',ok: true },
      { text: 'Early feature access',   ok: true  },
    ],
  },
]

const momoMethods = [
  { id: 'mtn',    name: 'MTN MoMo',     emoji: '📱', number: '+231 888 061 379',  color: 'border-yellow-500/30 dark:bg-yellow-500/10 bg-yellow-50' },
  { id: 'orange', name: 'Orange Money', emoji: '🟠', number: '+231 776 679 963',  color: 'border-orange-500/30 dark:bg-orange-500/10 bg-orange-50' },
  { id: 'card',   name: 'Card (soon)',  emoji: '💳', number: 'Coming soon',       color: 'border-blue-500/30 dark:bg-blue-500/10 bg-blue-50 opacity-50' },
]

function PaymentModal({ plan, onClose }: { plan: typeof plans[0]; onClose: () => void }) {
  const [method, setMethod] = useState('mtn')
  const [txId, setTxId] = useState('')
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select')
  const selected = momoMethods.find(m => m.id === method)!

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="dark:bg-[#130E1E] bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden">

        <div className="w-10 h-1 rounded-full dark:bg-white/20 bg-gray-300 mx-auto mt-4 mb-2 sm:hidden" />

        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/6 border-gray-100">
          <div>
            <h3 className="font-bold dark:text-white text-gray-900">Upgrade to {plan.name}</h3>
            <p className="text-xs text-brand-pink font-semibold">${plan.price}{plan.period}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {step === 'select' && (
            <>
              <p className="text-sm font-semibold dark:text-white text-gray-900 mb-3">Choose Payment Method</p>
              <div className="space-y-2 mb-5">
                {momoMethods.map(m => (
                  <button key={m.id} onClick={() => m.id !== 'card' && setMethod(m.id)} disabled={m.id === 'card'}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${method === m.id ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50' : m.color} ${m.id === 'card' ? 'cursor-not-allowed' : 'cursor-pointer hover:border-pink-300'}`}>
                    <span className="text-2xl">{m.emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold dark:text-white text-gray-900">{m.name}</p>
                      <p className="text-xs dark:text-gray-400 text-gray-500">{m.number}</p>
                    </div>
                    {method === m.id && <Check className="w-4 h-4 text-brand-pink flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="dark:bg-white/4 bg-gray-50 rounded-2xl p-4 border dark:border-white/6 border-gray-100 mb-5">
                <p className="text-xs font-bold dark:text-white text-gray-900 mb-2">📋 Payment Instructions</p>
                <ol className="space-y-1.5 text-xs dark:text-gray-400 text-gray-600">
                  <li>1. Send <span className="font-bold text-brand-pink">${plan.price}</span> to <span className="font-bold dark:text-white text-gray-900">{selected.number}</span></li>
                  <li>2. Account name: <span className="font-bold dark:text-white text-gray-900">Shedrick K. Nungehn</span></li>
                  <li>3. Enter your Transaction ID below</li>
                  <li>4. Your plan activates within 15 minutes</li>
                </ol>
              </div>

              <input value={txId} onChange={e => setTxId(e.target.value)} placeholder="Enter Transaction ID (e.g. TXN123456)"
                className="w-full px-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors text-sm mb-4" />

              <button onClick={() => txId && setStep('confirm')} disabled={!txId}
                className="w-full py-4 rounded-2xl bg-love-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-90 transition-opacity disabled:opacity-40">
                Submit Payment →
              </button>
            </>
          )}

          {step === 'confirm' && (
            <div className="text-center py-4">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="text-5xl mb-4">⏳</motion.div>
              <h3 className="font-bold dark:text-white text-gray-900 mb-2">Verifying Payment</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-2">Transaction ID: <span className="font-bold text-brand-pink">{txId}</span></p>
              <p className="text-xs dark:text-gray-500 text-gray-400 mb-6">Our team will verify your payment within 15 minutes and activate your {plan.name} plan.</p>
              <button onClick={() => setStep('success')} className="w-full py-3.5 rounded-2xl bg-love-gradient text-white font-bold text-sm shadow-md shadow-pink-500/20">
                I've Sent the Payment ✓
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }} className="text-6xl mb-4">🎉</motion.div>
              <h3 className="font-display font-black text-2xl text-gradient-love mb-2">Payment Submitted!</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-6">Your {plan.name} plan will be activated within 15 minutes. You'll receive a notification when it's ready.</p>
              <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-love-gradient text-white font-bold text-sm shadow-md shadow-pink-500/20">
                Done 💕
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function SubscriptionsPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null)
  const currentPlan = plans.find(p => p.current)!

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 dark:bg-[#130E1E] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <h1 className="font-display text-xl font-black dark:text-white text-gray-900 mb-0.5">Subscriptions 💎</h1>
        <p className="text-xs dark:text-gray-500 text-gray-500">Manage your plan and billing</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

        {/* Current plan banner */}
        <div className="dark:bg-gradient-to-r dark:from-pink-900/30 dark:to-purple-900/30 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border dark:border-pink-500/20 border-pink-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-love-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs dark:text-gray-400 text-gray-500">Current Plan</p>
            <p className="font-display font-black text-lg dark:text-white text-gray-900">{currentPlan.name}</p>
            <p className="text-xs text-brand-pink font-semibold">Active · Renews Jul 17, 2026</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500">Active</span>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl dark:bg-white/5 bg-gray-200">
            {(['monthly', 'yearly'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${billing === b ? 'bg-love-gradient text-white shadow-sm' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                {b} {b === 'yearly' && <span className="text-[10px] text-emerald-400 font-bold ml-1">-20%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {plans.map((plan, i) => {
            const Icon = plan.icon
            const price = billing === 'yearly' && plan.price > 0
              ? (plan.price * 0.8).toFixed(2)
              : plan.price.toFixed(2)
            const isCurrent = plan.current

            return (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`relative dark:bg-[#130E1E] bg-white rounded-2xl p-5 border-2 ${plan.border} transition-all ${isCurrent ? 'shadow-lg shadow-pink-500/10' : 'hover:shadow-md'}`}>

                {plan.badge && (
                  <div className="absolute -top-3 left-5">
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${plan.color} shadow-md`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-black dark:text-white text-gray-900">{plan.name}</p>
                      {isCurrent && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">CURRENT</span>}
                    </div>
                    <p className="text-xs dark:text-gray-400 text-gray-500">{plan.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-black text-2xl dark:text-white text-gray-900">${price}</p>
                    {billing === 'yearly' && plan.price > 0 && (
                      <p className="text-[10px] text-emerald-500 font-semibold">Save 20%</p>
                    )}
                  </div>
                </div>

                {/* Features preview (top 5) */}
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {plan.features.slice(0, 6).map(f => (
                    <div key={f.text} className={`flex items-center gap-1.5 text-[10px] ${f.ok ? 'dark:text-gray-300 text-gray-700' : 'dark:text-gray-600 text-gray-400'}`}>
                      {f.ok ? <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" /> : <X className="w-3 h-3 dark:text-gray-700 text-gray-300 flex-shrink-0" />}
                      <span className={f.ok ? '' : 'line-through'}>{f.text}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <button className="w-full py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-500 text-sm font-semibold cursor-default">
                    ✓ Current Plan
                  </button>
                ) : plan.price === 0 ? (
                  <button className="w-full py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-500 text-sm font-semibold">
                    Downgrade to Free
                  </button>
                ) : (
                  <button onClick={() => setSelectedPlan(plan)}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all bg-gradient-to-r ${plan.color} text-white shadow-md hover:opacity-90 hover:scale-[1.01]`}>
                    Upgrade to {plan.name} →
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Perks */}
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-100">
          <p className="text-sm font-bold dark:text-white text-gray-900 mb-3">Why Upgrade?</p>
          <div className="space-y-2.5">
            {[
              { icon: Heart, text: '3x more matches with Priority Discover', color: 'text-brand-pink' },
              { icon: Star, text: 'See who liked you before they match', color: 'text-amber-500' },
              { icon: Shield, text: 'Verified badge builds trust instantly', color: 'text-blue-500' },
              { icon: Gift, text: 'Earn from SmartzTV virtual gifts (VIP)', color: 'text-purple-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                <span className="text-xs dark:text-gray-300 text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Currency Converter */}
        <CurrencyConverter />

        {/* Payment methods */}
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-100">
          <p className="text-sm font-bold dark:text-white text-gray-900 mb-3">Accepted Payments</p>
          <div className="flex flex-wrap gap-2">
            {momoMethods.map(m => (
              <div key={m.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${m.color}`}>
                <span>{m.emoji}</span>
                <span className="dark:text-gray-300 text-gray-700">{m.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] dark:text-gray-500 text-gray-400 mt-3">🔒 Secure · Cancel anytime · No hidden fees</p>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <PaymentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
