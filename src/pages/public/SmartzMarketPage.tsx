import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Star, Shield, TrendingUp, Package, CreditCard,
  Search, Heart, Zap, CheckCircle, Tag, ArrowRight, Users,
  Globe, Lock, Truck, BarChart3, Shirt, Smartphone, Apple,
  Sparkles, Home, Car, Wrench, Palette,
} from 'lucide-react'

const categories = [
  { name: 'Fashion',       icon: Shirt,       color: 'from-pink-500 to-rose-600',     bg: 'bg-pink-500/10' },
  { name: 'Electronics',   icon: Smartphone,  color: 'from-blue-500 to-indigo-600',   bg: 'bg-blue-500/10' },
  { name: 'Food & Drinks', icon: Apple,       color: 'from-emerald-500 to-teal-600',  bg: 'bg-emerald-500/10' },
  { name: 'Beauty',        icon: Sparkles,    color: 'from-fuchsia-500 to-purple-600',bg: 'bg-fuchsia-500/10' },
  { name: 'Home & Living', icon: Home,        color: 'from-amber-500 to-orange-600',  bg: 'bg-amber-500/10' },
  { name: 'Vehicles',      icon: Car,         color: 'from-slate-500 to-gray-600',    bg: 'bg-slate-500/10' },
  { name: 'Services',      icon: Wrench,      color: 'from-cyan-500 to-blue-600',     bg: 'bg-cyan-500/10' },
  { name: 'Art & Crafts',  icon: Palette,     color: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10' },
]

const features = [
  {
    icon: Shield, title: 'Buyer Protection',
    desc: 'Every purchase is protected. Get a full refund if your item doesn\'t arrive or isn\'t as described.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: CreditCard, title: 'MoMo Payments',
    desc: 'Pay with MTN Mobile Money, Orange Money, Stripe, or PayPal. Fast, secure, and familiar.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: BarChart3, title: 'Seller Analytics',
    desc: 'Track your sales, views, and revenue with a detailed dashboard. Grow your business with real data.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Search, title: 'Smart Search',
    desc: 'AI-powered search finds exactly what you\'re looking for across all listings instantly.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Truck, title: 'SmartzDelivery',
    desc: 'Connect with SmartzDelivery for fast, tracked shipping across Africa.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Tag, title: 'Flash Sales',
    desc: 'Daily flash sales with up to 70% off. Set price alerts and never miss a deal.',
    color: 'from-red-500 to-rose-600',
  },
]

const stats = [
  { value: '180K+', label: 'Active Listings',    icon: Package },
  { value: '45K+',  label: 'Verified Sellers',   icon: CheckCircle },
  { value: '$2.4M', label: 'Monthly Sales',       icon: TrendingUp },
  { value: '4.8★',  label: 'Buyer Satisfaction',  icon: Star },
]

const sellerPerks = [
  { icon: Globe,        text: 'Reach buyers across 47+ African countries' },
  { icon: Lock,         text: 'Secure & instant Mobile Money payouts' },
  { icon: Users,        text: 'Build a following & repeat customer base' },
  { icon: BarChart3,    text: 'Real-time sales & revenue analytics' },
  { icon: Truck,        text: 'Integrated delivery & fulfilment network' },
  { icon: Shield,       text: 'Seller protection & dispute resolution' },
]

export default function SmartzMarketPage() {
  const ref    = useRef(null)
  const heroRef = useRef(null)
  const inView  = useInView(ref,    { once: true, margin: '-80px' })
  const heroIn  = useInView(heroRef, { once: true })

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* ── Hero ── */}
      <section ref={heroRef}>
        {/* Hero image */}
        <div className="w-full overflow-hidden">
          <motion.img
            src="/smartz-market-hero.png"
            alt="SmartzMarket — Shop Smart. Live Better."
            className="w-full object-cover object-center"
            style={{ maxHeight: '620px' }}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={heroIn ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
          />
        </div>

        {/* CTA buttons */}
        <div className="dark:bg-[#0D0A14] bg-white py-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <ShoppingBag className="w-5 h-5" /> Shop Now
            </Link>
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl dark:bg-white/8 bg-gray-100 dark:border dark:border-white/12 border border-gray-200 dark:text-white text-gray-900 font-bold text-lg hover:dark:bg-white/14 hover:bg-gray-200 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <TrendingUp className="w-5 h-5" /> Sell Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-10 dark:bg-[#0D0A14] bg-white border-y dark:border-white/5 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s, i) => {
              const StatIcon = s.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-amber-500/20">
                    <StatIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-display font-black text-2xl sm:text-3xl bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{s.value}</p>
                  <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5 font-medium">{s.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section ref={ref} className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-[2.75rem] dark:text-white text-gray-900 mb-3">
              Shop by <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Category</span>
            </h2>
            <p className="text-lg dark:text-gray-400 text-gray-600 max-w-xl mx-auto">
              From fashion to electronics, food to services — find everything you need.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-20">
            {categories.map((c, i) => {
              const CatIcon = c.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.05 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 text-center border dark:border-white/6 border-gray-100 hover:shadow-lg hover:border-amber-400/30 transition-all cursor-pointer group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mx-auto mb-2.5 shadow-md group-hover:scale-110 transition-transform`}>
                    <CatIcon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-bold dark:text-white text-gray-900">{c.name}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Hero category grid (smaller version, desktop only) */}

          {/* Features grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }} className="text-center mb-10">
            <h2 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-2">
              Built for African Commerce
            </h2>
            <p className="text-base dark:text-gray-400 text-gray-600">Everything you need to buy and sell confidently.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-amber-400/20 transition-all group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-base dark:text-white text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Seller CTA ── */}
      <section className="py-16 sm:py-24 dark:bg-[#0D0A14] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl dark:bg-[#130E1E] bg-gray-50 border dark:border-white/8 border-gray-200 shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-radial from-amber-500/12 via-transparent to-transparent pointer-events-none" />

            <div className="relative grid sm:grid-cols-2 gap-10 p-8 sm:p-12 lg:p-14 items-center">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/30">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4">
                  Start Selling<br />Today — Free
                </h2>
                <p className="text-base dark:text-gray-400 text-gray-600 mb-6 leading-relaxed">
                  List your products in minutes. Reach millions of buyers across Africa.
                  Get paid instantly via Mobile Money.
                </p>
                <Link to="/register"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base shadow-xl shadow-amber-500/30 hover:scale-[1.03] transition-all">
                  <Zap className="w-4 h-4" /> Open Your Shop Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {sellerPerks.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <p.icon className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-sm dark:text-gray-300 text-gray-700 font-medium">{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4">
            Join 45,000+ Active Sellers
          </h2>
          <p className="text-lg dark:text-gray-400 text-gray-600 mb-8">
            SmartzMarket is the fastest-growing marketplace in West Africa. Sign up free and start selling in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base shadow-xl shadow-amber-500/25 hover:scale-105 transition-all">
              <Heart className="w-4 h-4" /> Start Shopping Free
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl dark:bg-white/6 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 font-semibold text-base hover:dark:bg-white/10 transition-all">
              View Plans &amp; Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
