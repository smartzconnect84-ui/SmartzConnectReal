import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingBag, Star, Shield, TrendingUp, Package, CreditCard, Search, Heart, Zap, CheckCircle, Tag } from 'lucide-react'

const categories = [
  { name: 'Fashion',     emoji: '👗', count: '12.4K', color: 'from-pink-500 to-rose-600' },
  { name: 'Electronics', emoji: '📱', count: '8.7K',  color: 'from-blue-500 to-indigo-600' },
  { name: 'Food & Drinks', emoji: '🍎', count: '5.2K', color: 'from-emerald-500 to-teal-600' },
  { name: 'Beauty',      emoji: '💄', count: '9.1K',  color: 'from-fuchsia-500 to-purple-600' },
  { name: 'Home & Living', emoji: '🏠', count: '6.3K', color: 'from-amber-500 to-orange-600' },
  { name: 'Vehicles',    emoji: '🚗', count: '2.1K',  color: 'from-slate-500 to-gray-600' },
  { name: 'Services',    emoji: '🔧', count: '4.8K',  color: 'from-cyan-500 to-blue-600' },
  { name: 'Art & Crafts', emoji: '🎨', count: '3.4K', color: 'from-violet-500 to-purple-600' },
]

const products = [
  { name: 'Ankara Dress Set',     price: '$45',  seller: 'Amara Fashion', rating: 4.9, reviews: 128, emoji: '👗', badge: 'Hot' },
  { name: 'iPhone 14 Pro',        price: '$680', seller: 'TechHub GH',    rating: 4.8, reviews: 89,  emoji: '📱', badge: 'Verified' },
  { name: 'Shea Butter Cream',    price: '$12',  seller: 'NaturalGlow',   rating: 5.0, reviews: 234, emoji: '🧴', badge: 'Top Seller' },
  { name: 'Handmade Kente Bag',   price: '$28',  seller: 'Kente Crafts',  rating: 4.7, reviews: 67,  emoji: '👜', badge: null },
  { name: 'Jollof Rice Spice Kit', price: '$8',  seller: 'SpiceQueen',    rating: 4.9, reviews: 312, emoji: '🌶️', badge: 'Hot' },
  { name: 'Afrobeats Playlist',   price: '$5',   seller: 'DJ Kofi',       rating: 4.6, reviews: 45,  emoji: '🎵', badge: null },
]

const features = [
  { icon: Shield,     title: 'Buyer Protection',    desc: 'Every purchase is protected. Get a full refund if your item doesn\'t arrive or isn\'t as described.', color: 'from-blue-500 to-indigo-600' },
  { icon: CreditCard, title: 'MoMo Payments',       desc: 'Pay with MTN Mobile Money, Orange Money, Stripe, or PayPal. Fast, secure, and familiar.',             color: 'from-amber-500 to-orange-600' },
  { icon: TrendingUp, title: 'Seller Analytics',    desc: 'Track your sales, views, and revenue with detailed analytics. Grow your business with data.',          color: 'from-emerald-500 to-teal-600' },
  { icon: Search,     title: 'Smart Search',        desc: 'AI-powered search finds exactly what you\'re looking for across millions of listings.',                color: 'from-violet-500 to-purple-600' },
  { icon: Package,    title: 'Delivery Integration', desc: 'Connect with SmartzDelivery for fast, tracked shipping across Africa.',                              color: 'from-pink-500 to-rose-600' },
  { icon: Tag,        title: 'Flash Sales',          desc: 'Daily flash sales with up to 70% off. Set price alerts and never miss a deal.',                      color: 'from-red-500 to-rose-600' },
]

const stats = [
  { value: '180K+', label: 'Active Listings',   icon: '🛍️' },
  { value: '45K+',  label: 'Verified Sellers',  icon: '✅' },
  { value: '$2.4M', label: 'Monthly Sales',     icon: '💰' },
  { value: '4.8★',  label: 'Buyer Satisfaction', icon: '⭐' },
]

export default function SmartzMarketPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-orange-900/10 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/25 mb-6">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">SmartzMarket</span>
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl dark:text-white text-gray-900 leading-tight mb-5">
                Africa's Biggest<br /><span className="text-gradient-love">Social</span><br />Marketplace
              </h1>
              <p className="text-lg dark:text-gray-400 text-gray-600 leading-relaxed mb-8 max-w-lg">
                Buy and sell anything — from Ankara fashion to electronics, food to services. Connect with buyers and sellers across 47 African countries.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-love px-7 py-3.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Start Shopping
                </Link>
                <Link to="/register" className="px-7 py-3.5 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm font-semibold hover:text-brand-pink transition-all inline-flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Sell on SmartzMarket
                </Link>
              </div>
            </motion.div>

            {/* Product grid mockup */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                {products.slice(0, 4).map((p, i) => (
                  <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/8 border-gray-100 shadow-lg">
                    <div className="text-4xl mb-2 text-center">{p.emoji}</div>
                    {p.badge && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-love-soft text-brand-pink mb-1 inline-block">{p.badge}</span>
                    )}
                    <p className="text-xs font-bold dark:text-white text-gray-900 leading-tight mb-1">{p.name}</p>
                    <p className="text-sm font-black text-amber-500">{p.price}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] dark:text-gray-400 text-gray-500">{p.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 dark:bg-[#0D0A14] bg-white border-y dark:border-white/5 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="font-display font-black text-2xl sm:text-3xl text-gradient-love">{s.value}</p>
                <p className="text-sm dark:text-gray-400 text-gray-500">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section ref={ref} className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-10">
            <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-3">
              Shop by <span className="text-gradient-love">Category</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-16">
            {categories.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.05 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 text-center border dark:border-white/6 border-gray-100 hover:shadow-lg hover:border-pink-500/30 transition-all cursor-pointer group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{c.emoji}</div>
                <p className="text-xs font-bold dark:text-white text-gray-900">{c.name}</p>
                <p className="text-[10px] dark:text-gray-500 text-gray-400">{c.count}</p>
              </motion.div>
            ))}
          </div>

          {/* Featured products */}
          <h3 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-6">🔥 Trending Now</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            {products.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.06 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100 hover:shadow-xl transition-all group cursor-pointer">
                <div className="relative">
                  <div className="text-5xl text-center mb-3 group-hover:scale-110 transition-transform">{p.emoji}</div>
                  <button className="absolute top-0 right-0 w-7 h-7 rounded-full dark:bg-white/5 bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-3.5 h-3.5 text-brand-pink" />
                  </button>
                </div>
                {p.badge && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-love-soft text-brand-pink mb-1 inline-block">{p.badge}</span>
                )}
                <p className="text-xs font-bold dark:text-white text-gray-900 leading-tight mb-1">{p.name}</p>
                <p className="text-[10px] dark:text-gray-500 text-gray-400 mb-2">{p.seller}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-amber-500">{p.price}</p>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] dark:text-gray-400 text-gray-500">{p.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl transition-all group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold dark:text-white text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Seller CTA */}
      <section className="py-16 dark:bg-[#0D0A14] bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="dark:bg-[#130E1E] bg-gray-50 rounded-3xl p-10 border dark:border-white/8 border-gray-100 shadow-xl text-center">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="font-display font-black text-3xl dark:text-white text-gray-900 mb-3">Start Selling Today</h2>
            <p className="dark:text-gray-400 text-gray-600 mb-6 max-w-lg mx-auto">List your products for free. Reach millions of buyers across Africa. Get paid instantly via Mobile Money.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {['Free to list', 'No monthly fees', 'Instant MoMo payouts', 'Seller protection'].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-xs font-semibold dark:text-gray-300 text-gray-700">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> {item}
                </span>
              ))}
            </div>
            <div className="mt-6">
              <Link to="/register" className="btn-love px-8 py-4 rounded-2xl font-bold inline-flex items-center gap-2">
                <Zap className="w-4 h-4" /> Open Your Shop Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
