import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Check, X, Crown, Zap, Heart, ArrowLeftRight, RefreshCw,
  ShieldCheck, Sparkles, Globe, MessageCircle, Users, Play,
  Radio, ShoppingBag, Car, MapPin, Star, Infinity, Smartphone,
  ChevronDown, ChevronUp, CreditCard, Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ─────────────── Currency data ─────────────── */
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar',          symbol: '$',     flag: '🇺🇸', popular: true  },
  { code: 'LRD', name: 'Liberian Dollar',    symbol: 'L$',    flag: '🇱🇷', popular: true  },
  { code: 'NGN', name: 'Nigerian Naira',     symbol: '₦',     flag: '🇳🇬', popular: true  },
  { code: 'GHS', name: 'Ghanaian Cedi',      symbol: 'GH₵',  flag: '🇬🇭', popular: true  },
  { code: 'KES', name: 'Kenyan Shilling',    symbol: 'KSh',   flag: '🇰🇪', popular: true  },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R',     flag: '🇿🇦', popular: false },
  { code: 'XOF', name: 'West African CFA',   symbol: 'CFA',   flag: '🌍',  popular: false },
  { code: 'SLL', name: 'Sierra Leone Leone', symbol: 'Le',    flag: '🇸🇱', popular: false },
  { code: 'GMD', name: 'Gambian Dalasi',     symbol: 'D',     flag: '🇬🇲', popular: false },
  { code: 'EUR', name: 'Euro',               symbol: '€',     flag: '🇪🇺', popular: true  },
  { code: 'GBP', name: 'British Pound',      symbol: '£',     flag: '🇬🇧', popular: true  },
  { code: 'CAD', name: 'Canadian Dollar',    symbol: 'CA$',   flag: '🇨🇦', popular: false },
  { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$',    flag: '🇦🇺', popular: false },
  { code: 'INR', name: 'Indian Rupee',       symbol: '₹',     flag: '🇮🇳', popular: false },
  { code: 'CNY', name: 'Chinese Yuan',       symbol: '¥',     flag: '🇨🇳', popular: false },
  { code: 'JPY', name: 'Japanese Yen',       symbol: '¥',     flag: '🇯🇵', popular: false },
  { code: 'BRL', name: 'Brazilian Real',     symbol: 'R$',    flag: '🇧🇷', popular: false },
  { code: 'MXN', name: 'Mexican Peso',       symbol: 'MX$',   flag: '🇲🇽', popular: false },
  { code: 'EGP', name: 'Egyptian Pound',     symbol: 'E£',    flag: '🇪🇬', popular: false },
  { code: 'ETB', name: 'Ethiopian Birr',     symbol: 'Br',    flag: '🇪🇹', popular: false },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh',   flag: '🇹🇿', popular: false },
  { code: 'UGX', name: 'Ugandan Shilling',   symbol: 'USh',   flag: '🇺🇬', popular: false },
  { code: 'RWF', name: 'Rwandan Franc',      symbol: 'RF',    flag: '🇷🇼', popular: false },
  { code: 'MAD', name: 'Moroccan Dirham',    symbol: 'MAD',   flag: '🇲🇦', popular: false },
  { code: 'XAF', name: 'Central African CFA',symbol: 'CFA',   flag: '🌍',  popular: false },
]

import { fetchRates, FALLBACK_RATES } from '@/lib/exchangeRates'

function toLocal(usd: number, currency: string, rates: Record<string, number> = FALLBACK_RATES) {
  const rate = rates[currency] ?? 1
  const val = usd * rate
  const sym = CURRENCIES.find(c => c.code === currency)?.symbol ?? currency
  if (val >= 1000) return `${sym}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  return `${sym}${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

/* ─────────────── Plans definition ─────────────── */
type Feature = { text: string; included: boolean; highlight?: boolean }
type Plan = {
  name: string; priceUSD: number; icon: typeof Heart
  color: string; border: string; glowClass: string
  badge: string | null; period: string
  tagline: string; emoji: string
  features: Feature[]
  cta: string; ctaStyle: string
}

const plans: Plan[] = [
  {
    name: 'Free', priceUSD: 0, icon: Heart,
    color: 'from-slate-500 to-gray-600',
    border: 'dark:border-white/10 border-gray-200',
    glowClass: '',
    badge: null, period: 'forever', tagline: 'Get the full SmartzConnect ecosystem — forever free to start',
    emoji: '🆓',
    features: [
      { text: 'Access all 7 super-products',         included: true },
      { text: 'SmartzSocial — post & follow',        included: true },
      { text: 'SmartzDating — 10 swipes/day',        included: true },
      { text: 'SmartzRide — book rides',             included: true },
      { text: 'SmartzMarket — browse & buy',         included: true },
      { text: 'Basic GetStream chat',                included: true },
      { text: 'Unlimited swipes',                    included: false },
      { text: 'GetStream voice notes & presence',    included: false },
      { text: 'Voice & video calls (LiveKit)',        included: false },
      { text: 'Go Live — broadcasts & watch parties',included: false },
      { text: 'Verified badge ✓',                    included: false },
      { text: 'Creator analytics',                   included: false },
    ],
    cta: 'Get started →', ctaStyle: 'dark:bg-white/8 bg-gray-100 dark:text-white text-gray-900 hover:dark:bg-white/14 hover:bg-gray-200',
  },
  {
    name: 'Plus', priceUSD: 5, icon: Zap,
    color: 'from-pink-500 to-rose-600',
    border: 'border-pink-500/50',
    glowClass: 'shadow-2xl shadow-pink-500/20',
    badge: 'MOST POPULAR', period: 'per month', tagline: 'For active creators, daters and shoppers who want more',
    emoji: '⚡',
    features: [
      { text: 'All 7 super-products: SmartzSocial, SmartzDating, SmartzRide, SmartzMarket, SmartzDelivery, SmartzTV, SmartzAds', included: true, highlight: true },
      { text: 'Unlimited GetStream chat — DMs, groups, voice notes, typing, presence', included: true, highlight: true },
      { text: 'Voice & video calls + group conferencing (LiveKit Cloud)', included: true },
      { text: 'Go Live — broadcasts, watch parties, creator hub',        included: true },
      { text: 'Unlimited swipes on SmartzDating',                        included: true },
      { text: 'See who liked you',                                        included: true },
      { text: 'SmartzMarket — sell & list products',                      included: true },
      { text: 'Profile Boost (1×/week)',                                  included: true },
      { text: 'Verified badge ✓',                                         included: false },
      { text: 'Advanced analytics dashboard',                             included: false },
      { text: 'Dedicated human support',                                  included: false },
    ],
    cta: 'Start Plus →', ctaStyle: 'bg-love-gradient text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02]',
  },
  {
    name: 'Pro', priceUSD: 10, icon: Crown,
    color: 'from-amber-500 to-yellow-500',
    border: 'border-amber-500/50',
    glowClass: 'shadow-2xl shadow-amber-500/20',
    badge: 'FULLY UNLIMITED', period: 'per month', tagline: 'For vendors, drivers, broadcasters and businesses',
    emoji: '👑',
    features: [
      { text: 'All 7 super-products: SmartzSocial, SmartzDating, SmartzRide, SmartzMarket, SmartzDelivery, SmartzTV, SmartzAds', included: true, highlight: true },
      { text: 'Unlimited GetStream chat — DMs, groups, voice notes, typing, presence', included: true, highlight: true },
      { text: 'Voice & video calls + group conferencing (LiveKit Cloud)', included: true },
      { text: 'Go Live — broadcasts, watch parties, creator hub',        included: true },
      { text: 'Verified badge ✓ on profile',                             included: true, highlight: true },
      { text: 'Top of Discover feed always',                             included: true },
      { text: 'Revenue share for creators',                              included: true },
      { text: 'Unlimited Super Likes',                                   included: true },
      { text: 'Advanced analytics dashboard',                            included: true },
      { text: 'Dedicated human support 24/7',                           included: true },
      { text: 'Priority ride & delivery booking',                        included: true },
      { text: 'Early access to new features',                            included: true },
    ],
    cta: 'Go Pro →', ctaStyle: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02]',
  },
]

/* ─────────────── Feature comparison (icon rows) ─────────────── */
const featureRows = [
  { icon: Heart,        label: 'Daily Swipe Cards',       free: '10/day', connect: <Infinity className="w-4 h-4 text-emerald-400" />, elite: <Infinity className="w-4 h-4 text-emerald-400" /> },
  { icon: Sparkles,     label: 'See Who Liked You',       free: false,    connect: true,  elite: true },
  { icon: Star,         label: 'Discover Priority',       free: false,    connect: true,  elite: '🔝 Top' },
  { icon: Play,         label: 'SmartzTV Streaming',      free: 'Watch',  connect: true,  elite: true },
  { icon: Radio,        label: 'Go Live',                 free: false,    connect: false, elite: true },
  { icon: ShoppingBag,  label: 'Marketplace Seller',      free: false,    connect: true,  elite: true },
  { icon: MessageCircle,label: 'Group Chat Rooms',        free: 'Browse', connect: true,  elite: true },
  { icon: Users,        label: 'Private Groups',          free: false,    connect: true,  elite: true },
  { icon: ShieldCheck,  label: 'Verified Badge ✓',        free: false,    connect: false, elite: true },
  { icon: Globe,        label: 'Creator Revenue Share',   free: false,    connect: false, elite: true },
  { icon: Car,          label: 'SmartzRide Priority',     free: false,    connect: false, elite: true },
  { icon: Smartphone,   label: 'Analytics Dashboard',     free: false,    connect: false, elite: true },
]

/* ─────────────── FAQ ─────────────── */
const faqs = [
  { q: 'How do I pay? I don\'t have a credit card.',
    a: 'No credit card needed! We accept MTN Mobile Money and Orange Money. Just send the amount to our number, enter your transaction ID in the app, and you\'re activated within 15 minutes.' },
  { q: 'Can I cancel or downgrade anytime?',
    a: 'Yes, absolutely. There are no long-term contracts. Cancel from App → Subscriptions anytime. Your access continues until the end of the billing period.' },
  { q: 'What\'s the price in my local currency?',
    a: 'Use our currency converter on this page to see prices in 25+ currencies. Payments are accepted in USD equivalent via Mobile Money.' },
  { q: 'Is the Free plan really free forever?',
    a: 'Yes! Free Forever means no credit card, no trial expiry — you keep your 10 swipes, social feed, and community rooms forever with zero cost.' },
  { q: 'How is Plus different from Pro?',
    a: 'Plus ($5) unlocks unlimited swipes, SmartzTV, voice & video calls, and marketplace selling across all 7 products. Pro ($10) adds everything in Plus — your Verified badge, Go Live, revenue share, advanced analytics, dedicated human support 24/7, and full unlimited access to every feature.' },
  { q: 'How long does payment verification take?',
    a: 'Our admin team verifies Mobile Money payments within 15 minutes during business hours (8 AM–10 PM WAT). After hours it may take up to 2 hours.' },
]

/* ─────────────── Payment methods ─────────────── */
const payMethods = [
  { name: 'MTN MoMo',      emoji: '📱', detail: '+231 888 061 379',   color: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-700 dark:text-yellow-400' },
  { name: 'Orange Money',  emoji: '🟠', detail: '+231 776 679 963',   color: 'bg-orange-500/10 border-orange-500/25 text-orange-700 dark:text-orange-400' },
  { name: 'Stripe/Card',   emoji: '💳', detail: 'Coming soon',        color: 'bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-400' },
  { name: 'PayPal',        emoji: '🅿️', detail: 'Coming soon',        color: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-700 dark:text-indigo-400' },
]

/* ─────────────── Currency Converter Panel ─────────────── */
function CurrencyPanel() {
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('LRD')
  const [amount, setAmount] = useState('5')
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesUpdated, setRatesUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true
    fetchRates().then(r => {
      if (!mounted) return
      setRates(r)
      setRatesUpdated(new Date())
      setRatesLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const fromRate = rates[from] ?? 1
  const toRate   = rates[to] ?? 1
  const converted = (parseFloat(amount) || 0) / fromRate * toRate
  const toCur = CURRENCIES.find(c => c.code === to)!
  const fromCur = CURRENCIES.find(c => c.code === from)!

  const swap = () => { setFrom(to); setTo(from) }

  return (
    <div className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-200 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-5">
        <RefreshCw className="w-4 h-4 text-brand-pink" />
        <h3 className="font-bold dark:text-white text-gray-900">Currency Converter</h3>
        <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full font-bold">
          {ratesLoading ? 'Loading…' : 'Live Rates ✓'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wider block mb-1.5">Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0"
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm font-bold focus:outline-none focus:border-brand-pink transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wider block mb-1.5">From</label>
            <select value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm font-bold focus:outline-none focus:border-brand-pink transition-colors">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button onClick={swap} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-soft text-brand-pink text-xs font-bold hover:bg-pink-500/20 transition-colors">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
          </button>
        </div>

        <div>
          <label className="text-[10px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wider block mb-1.5">To</label>
          <select value={to} onChange={e => setTo(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm font-bold focus:outline-none focus:border-brand-pink transition-colors">
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
          </select>
        </div>

        <div className="dark:bg-white/5 bg-gray-50 rounded-2xl p-4 border dark:border-white/8 border-gray-100 text-center">
          <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">
            {fromCur.flag} {(parseFloat(amount)||0).toLocaleString()} {from} =
          </p>
          <p className="font-display font-black text-3xl text-brand-pink">
            {toCur.symbol}{converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-1 font-semibold">{toCur.flag} {toCur.name}</p>
          <p className="text-[10px] dark:text-gray-600 text-gray-400 mt-2">
            1 {from} = {toCur.symbol}{(toRate / fromRate).toFixed(4)} {to}
          </p>
        </div>

        {/* Plan prices in selected currency */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-bold dark:text-gray-400 text-gray-500 uppercase tracking-wider">Plan prices in {to}</p>
          {plans.filter(p => p.priceUSD > 0).map(p => (
            <div key={p.name} className="flex items-center justify-between py-2 px-3 rounded-xl dark:bg-white/4 bg-gray-50 border dark:border-white/6 border-gray-100">
              <span className="text-xs font-semibold dark:text-gray-300 text-gray-700">{p.emoji} {p.name}</span>
              <span className="text-xs font-black text-brand-pink">{toLocal(p.priceUSD, to, rates)}<span className="font-normal dark:text-gray-500 text-gray-400">/mo</span></span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl dark:bg-white/4 bg-gray-50 border dark:border-white/6 border-gray-100">
            <span className="text-xs font-semibold dark:text-gray-300 text-gray-700">🆓 Free Forever</span>
            <span className="text-xs font-black text-emerald-500">Always Free</span>
          </div>
        </div>

        <p className="text-[10px] dark:text-gray-600 text-gray-400 text-center">
          {ratesLoading ? 'Loading live rates…' : ratesUpdated ? `Live rates · Updated ${ratesUpdated.toLocaleTimeString()} · Cached 24h` : 'Rates cached 24h · Fallback data shown'}
        </p>
      </div>
    </div>
  )
}

/* ─────────────── Main Page ─────────────── */
export default function PricingPage() {
  const heroRef  = useRef(null)
  const plansRef = useRef(null)
  const faqRef   = useRef(null)
  const heroIn   = useInView(heroRef,  { once: true, margin: '-60px' })
  const plansIn  = useInView(plansRef, { once: true, margin: '-60px' })
  const faqIn    = useInView(faqRef,   { once: true, margin: '-60px' })

  const [billing, setBilling]   = useState<'monthly' | 'yearly'>('monthly')
  const [currency, setCurrency] = useState('USD')
  const [openFaq, setOpenFaq]   = useState<number | null>(null)
  const [showAll, setShowAll]   = useState(false)
  const [activePlans, setActivePlans] = useState<Plan[]>(plans)

  useEffect(() => {
    let mounted = true
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return
        if (!error && data && data.length >= 2) {
          const mapped: Plan[] = data.map((row: any) => {
            // Match to hardcoded plan for style/icon/layout defaults
            const base = plans.find(p => p.name.toLowerCase() === (row.name ?? '').toLowerCase()) ?? plans[0]
            const features: Feature[] = Array.isArray(row.features)
              ? row.features.map((f: any) =>
                  typeof f === 'string'
                    ? { text: f, included: true }
                    : { text: f.text ?? '', included: f.included !== false, highlight: f.highlight ?? false }
                )
              : base.features
            return {
              ...base,
              name: row.name ?? base.name,
              priceUSD: typeof row.price_usd === 'number' ? row.price_usd : base.priceUSD,
              badge: row.badge ?? base.badge,
              tagline: row.tagline ?? base.tagline,
              features,
            }
          })
          setActivePlans(mapped)
        }
        // on error or < 2 rows, keep hardcoded fallback
      })
    return () => { mounted = false }
  }, [])

  const displayedCurrencies = showAll ? CURRENCIES : CURRENCIES.filter(c => c.popular)

  const getPrice = (plan: Plan) => {
    if (plan.priceUSD === 0) return toLocal(0, currency) // 'Free'
    const base = billing === 'yearly' ? plan.priceUSD * 0.8 : plan.priceUSD
    return toLocal(base, currency)
  }

  function CellVal({ val }: { val: boolean | string | React.ReactNode }) {
    if (val === true)  return <Check className="w-5 h-5 text-emerald-500 mx-auto" />
    if (val === false) return <X    className="w-4 h-4 text-gray-300 dark:text-gray-700 mx-auto" />
    if (typeof val === 'string') return <span className="text-xs font-semibold dark:text-gray-300 text-gray-600">{val}</span>
    return <>{val}</>
  }

  return (
    <div className="dark:bg-[#080510] bg-white min-h-screen">

      {/* ══ HERO ══ */}
      <section className="pt-20 pb-12 sm:pt-28 sm:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-pink-500/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-purple-500/8 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center" ref={heroRef}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-love-soft border border-pink-500/25 mb-5">
              <Crown className="w-4 h-4 text-brand-pink" />
              <span className="text-sm font-black tracking-widest text-brand-pink uppercase">Subscription</span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl dark:text-white text-gray-900 mb-4 leading-tight">
              One identity.{' '}
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">Seven products.</span>{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">$5 or $10.</span>
            </h1>
            <p className="text-base sm:text-lg dark:text-gray-400 text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              No hidden fees. Cancel anytime. Auto-converted to your local currency.
            </p>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Billing toggle */}
              <div className="inline-flex items-center p-1 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200">
                {(['monthly', 'yearly'] as const).map(b => (
                  <button key={b} onClick={() => setBilling(b)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${billing === b ? 'bg-love-gradient text-white shadow-sm' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                    {b.charAt(0).toUpperCase() + b.slice(1)}
                    {b === 'yearly' && <span className="ml-1.5 text-[10px] font-black text-emerald-400">–20%</span>}
                  </button>
                ))}
              </div>

              {/* Currency selector */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200">
                <Globe className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="bg-transparent dark:text-white text-gray-900 text-sm font-semibold focus:outline-none">
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                {!showAll && (
                  <button onClick={() => setShowAll(true)} className="text-[10px] text-brand-pink font-semibold hover:underline ml-1">All</button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ PLAN CARDS ══ */}
      <section className="pb-16 sm:pb-20" ref={plansRef}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-16">
            {activePlans.map((plan, i) => {
              const Icon = plan.icon
              const price = getPrice(plan)
              const isYearlyDiscount = billing === 'yearly' && plan.priceUSD > 0

              return (
                <motion.div key={plan.name}
                  initial={{ opacity: 0, y: 40 }} animate={plansIn ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className={`relative dark:bg-[#130E1E] bg-white rounded-3xl p-6 lg:p-7 border-2 ${plan.border} flex flex-col ${plan.glowClass} ${plan.name === 'Plus' ? 'md:-mt-5 md:mb-5' : ''} hover:scale-[1.01] transition-all duration-300`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <span className={`px-4 py-1 rounded-full text-xs font-black text-white bg-gradient-to-r ${plan.color} shadow-lg whitespace-nowrap`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-display font-black text-lg dark:text-white text-gray-900">{plan.name}</p>
                      <p className="text-[11px] dark:text-gray-500 text-gray-400 leading-tight">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-black text-4xl lg:text-5xl dark:text-white text-gray-900">
                        {plan.priceUSD === 0 ? 'Free' : price}
                      </span>
                      {plan.priceUSD > 0 && <span className="text-sm dark:text-gray-400 text-gray-500">/mo</span>}
                    </div>
                    {plan.priceUSD === 0
                      ? <p className="text-xs text-emerald-500 font-bold mt-0.5">No credit card · No expiry ✓</p>
                      : isYearlyDiscount
                        ? <p className="text-xs text-emerald-500 font-semibold mt-0.5">Save 20% vs monthly billing</p>
                        : plan.priceUSD > 0 && currency !== 'USD'
                          ? <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">${plan.priceUSD} USD/mo</p>
                          : null
                    }
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map(f => (
                      <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.included ? (f.highlight ? 'dark:text-white text-gray-900 font-medium' : 'dark:text-gray-300 text-gray-700') : 'dark:text-gray-600 text-gray-400 line-through decoration-gray-300 dark:decoration-gray-700'}`}>
                        {f.included
                          ? <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.highlight ? 'text-emerald-400' : 'text-emerald-500/80'}`} />
                          : <X className="w-4 h-4 flex-shrink-0 mt-0.5 dark:text-gray-700 text-gray-300" />
                        }
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.priceUSD === 0 ? '/register' : '/app/subscriptions'}
                    className={`w-full py-3 rounded-2xl text-sm font-bold text-center transition-all block ${plan.ctaStyle}`}>
                    {plan.cta}
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* ── Feature comparison table (desktop) ── */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={plansIn ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}
            className="hidden md:block overflow-hidden rounded-3xl border dark:border-white/8 border-gray-200 dark:bg-[#130E1E] bg-white shadow-xl mb-16">
            <div className="grid grid-cols-4 border-b dark:border-white/6 border-gray-100 bg-gradient-to-r dark:from-white/2 from-gray-50 to-transparent">
              <div className="p-5"><p className="font-bold dark:text-gray-300 text-gray-700 text-sm">Feature comparison</p></div>
              {activePlans.map(p => (
                <div key={p.name} className="p-5 text-center border-l dark:border-white/5 border-gray-100">
                  <p className="font-black text-sm dark:text-white text-gray-900">{p.emoji} {p.name}</p>
                  <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">
                    {p.priceUSD === 0 ? 'Free' : `${toLocal(p.priceUSD, currency)}/mo`}
                  </p>
                </div>
              ))}
            </div>
            {featureRows.map((row, i) => {
              const RowIcon = row.icon
              return (
                <div key={row.label} className={`grid grid-cols-4 ${i < featureRows.length - 1 ? 'border-b dark:border-white/4 border-gray-100' : ''}`}>
                  <div className="p-4 flex items-center gap-2.5">
                    <RowIcon className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400 flex-shrink-0" />
                    <span className="text-xs dark:text-gray-300 text-gray-700">{row.label}</span>
                  </div>
                  {[row.free, row.connect, row.elite].map((val, j) => (
                    <div key={j} className="p-4 border-l dark:border-white/4 border-gray-100 flex items-center justify-center">
                      <CellVal val={val} />
                    </div>
                  ))}
                </div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ══ CURRENCY CONVERTER + PAYMENT ══ */}
      <section className="pb-16 sm:pb-20 dark:bg-[#080510] bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Currency Converter */}
            <CurrencyPanel />

            {/* Payment Methods */}
            <div className="space-y-5">
              <div>
                <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-1">Pay Your Way</h3>
                <p className="text-sm dark:text-gray-400 text-gray-600">No bank card needed — Mobile Money accepted across Africa.</p>
              </div>

              <div className="space-y-3">
                {payMethods.map(m => (
                  <div key={m.name} className={`flex items-center gap-4 p-4 rounded-2xl border ${m.color}`}>
                    <span className="text-2xl">{m.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{m.name}</p>
                      <p className="text-xs opacity-70 font-mono">{m.detail}</p>
                    </div>
                    {m.detail !== 'Coming soon' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Active</span>
                    )}
                  </div>
                ))}
              </div>

              {/* How to pay steps */}
              <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-4 h-4 text-brand-pink" />
                  <p className="font-bold text-sm dark:text-white text-gray-900">How to pay with Mobile Money</p>
                </div>
                {[
                  { step: '1', text: 'Pick a plan below and tap "Start Plus" or "Go Pro"' },
                  { step: '2', text: 'Send the amount to our MTN or Orange Money number' },
                  { step: '3', text: 'Enter your Transaction ID in the app within 15 minutes' },
                  { step: '4', text: 'Admin verifies & your plan activates automatically ✅' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3 mb-3 last:mb-0">
                    <div className="w-6 h-6 rounded-full bg-love-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-white">{s.step}</span>
                    </div>
                    <p className="text-xs dark:text-gray-300 text-gray-700 pt-1 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs dark:text-gray-500 text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Secure payments · No hidden fees · Cancel anytime · 15-min activation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ALL CURRENCIES PRICE TABLE ══ */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-2">Prices in Every Currency</h2>
            <p className="text-sm dark:text-gray-400 text-gray-600">See exactly what you pay in your local currency</p>
          </div>
          <div className="overflow-hidden rounded-2xl border dark:border-white/8 border-gray-200 dark:bg-[#130E1E] bg-white shadow-xl">
            {/* Header */}
            <div className="grid grid-cols-4 bg-gradient-to-r dark:from-white/3 from-gray-50 to-transparent border-b dark:border-white/6 border-gray-100">
              <div className="p-4 text-xs font-bold dark:text-gray-400 text-gray-500 uppercase tracking-wider">Currency</div>
              {activePlans.map(p => (
                <div key={p.name} className="p-4 text-center text-xs font-bold dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                  {p.emoji} {p.name}
                </div>
              ))}
            </div>
            {/* Popular currencies always shown */}
            {CURRENCIES.filter(c => c.popular).map((cur, i, arr) => (
              <div key={cur.code} className={`grid grid-cols-4 ${i < arr.length - 1 ? 'border-b dark:border-white/4 border-gray-100' : ''} hover:dark:bg-white/2 hover:bg-gray-50 transition-colors`}>
                <div className="p-4 flex items-center gap-2">
                  <span className="text-base">{cur.flag}</span>
                  <div>
                    <p className="text-xs font-bold dark:text-white text-gray-900">{cur.code}</p>
                    <p className="text-[10px] dark:text-gray-500 text-gray-400">{cur.name}</p>
                  </div>
                </div>
                {activePlans.map(p => (
                  <div key={p.name} className="p-4 text-center flex items-center justify-center">
                    <span className={`text-xs font-bold ${p.priceUSD === 0 ? 'text-emerald-500' : 'dark:text-white text-gray-900'}`}>
                      {p.priceUSD === 0 ? 'Free' : toLocal(billing === 'yearly' ? p.priceUSD * 0.8 : p.priceUSD, cur.code)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {/* "See more" expand row */}
            <div className="p-4 text-center border-t dark:border-white/6 border-gray-100">
              <button onClick={() => setShowAll(s => !s)}
                className="text-xs font-semibold text-brand-pink hover:underline flex items-center gap-1 mx-auto">
                {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show all {CURRENCIES.length} currencies</>}
              </button>
            </div>
            <AnimatePresence>
              {showAll && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {CURRENCIES.filter(c => !c.popular).map((cur, i, arr) => (
                    <div key={cur.code} className={`grid grid-cols-4 border-t dark:border-white/4 border-gray-100 hover:dark:bg-white/2 hover:bg-gray-50 transition-colors`}>
                      <div className="p-4 flex items-center gap-2">
                        <span className="text-base">{cur.flag}</span>
                        <div>
                          <p className="text-xs font-bold dark:text-white text-gray-900">{cur.code}</p>
                          <p className="text-[10px] dark:text-gray-500 text-gray-400">{cur.name}</p>
                        </div>
                      </div>
                      {activePlans.map(p => (
                        <div key={p.name} className="p-4 text-center flex items-center justify-center">
                          <span className={`text-xs font-bold ${p.priceUSD === 0 ? 'text-emerald-500' : 'dark:text-white text-gray-900'}`}>
                            {p.priceUSD === 0 ? 'Free' : toLocal(billing === 'yearly' ? p.priceUSD * 0.8 : p.priceUSD, cur.code)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="pb-20 dark:bg-[#080510] bg-gray-50" ref={faqRef}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={faqIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
            className="text-center mb-10">
            <h2 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-2">Frequently Asked</h2>
            <p className="text-sm dark:text-gray-400 text-gray-600">Everything you need to know about SmartzConnect plans</p>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={faqIn ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.06 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:dark:bg-white/2 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold dark:text-white text-gray-900 pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-brand-pink flex-shrink-0" /> : <ChevronDown className="w-4 h-4 dark:text-gray-400 text-gray-500 flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-love-gradient p-10 text-center shadow-2xl shadow-pink-500/25">

            <p className="font-display font-black text-3xl sm:text-4xl text-white mb-3">Ready to Connect? 💕</p>
            <p className="text-white/80 text-base mb-7 max-w-lg mx-auto">Join our growing community across Africa — build real connections, businesses, and communities on SmartzConnect.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="px-8 py-3.5 rounded-2xl bg-white text-brand-pink font-black text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                🆓 Join Free Forever
              </Link>
              <Link to="/app/subscriptions" className="px-8 py-3.5 rounded-2xl bg-white/15 text-white font-bold text-base border border-white/30 hover:bg-white/25 transition-all">
                View Plans in App
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6">
              {['No credit card', 'Cancel anytime', '15-min activation'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                  <Check className="w-3.5 h-3.5 text-white/60" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
