import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Package, MapPin, Clock, Shield, Truck, DollarSign, Smartphone, Zap, CheckCircle, BarChart3, Users, Globe } from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import { usePublicStats, fmtCount } from '@/hooks/usePublicStats'

const features = [
  { icon: Clock,      title: 'Same-Day Delivery',    desc: 'Order before 2PM and receive your package the same day in supported cities.',                        color: 'from-blue-500 to-indigo-600' },
  { icon: MapPin,     title: 'Live Tracking',         desc: 'Track your package in real-time from pickup to your doorstep. Know exactly where it is.',            color: 'from-emerald-500 to-teal-600' },
  { icon: Shield,     title: 'Package Insurance',     desc: 'Every delivery is insured up to $500. Your packages are safe with us.',                             color: 'from-amber-500 to-orange-600' },
  { icon: DollarSign, title: 'Affordable Rates',      desc: 'Starting from just $0.50 for local deliveries. Transparent pricing, no hidden fees.',               color: 'from-pink-500 to-rose-600' },
  { icon: Smartphone, title: 'Easy Scheduling',       desc: 'Schedule pickups and deliveries from the app. Choose your preferred time slot.',                    color: 'from-violet-500 to-purple-600' },
  { icon: BarChart3,  title: 'Business Dashboard',    desc: 'Manage all your deliveries, track performance, and generate reports from one dashboard.',           color: 'from-cyan-500 to-blue-600' },
]

const deliveryTypes = [
  { name: 'Express',    desc: 'Under 2 hours',    emoji: '⚡', price: 'From $2.50', color: 'border-amber-500/30 dark:bg-amber-500/5' },
  { name: 'Same Day',   desc: 'By end of day',    emoji: '🚀', price: 'From $1.50', color: 'border-blue-500/30 dark:bg-blue-500/5' },
  { name: 'Standard',   desc: '1-2 business days', emoji: '📦', price: 'From $0.80', color: 'border-emerald-500/30 dark:bg-emerald-500/5' },
  { name: 'Bulk',       desc: 'Business shipping', emoji: '🏭', price: 'Custom',     color: 'border-violet-500/30 dark:bg-violet-500/5' },
]

const steps = [
  { step: '01', title: 'Schedule Pickup',   desc: 'Enter pickup and delivery addresses in the app. Choose your delivery speed.',  emoji: '📍' },
  { step: '02', title: 'We Collect',        desc: 'Our rider arrives at your location within the scheduled time window.',          emoji: '🏍️' },
  { step: '03', title: 'Track Live',        desc: 'Follow your package on the map in real-time. Get SMS and push notifications.',  emoji: '📱' },
  { step: '04', title: 'Delivered!',        desc: 'Package delivered safely. Rate your experience and pay via Mobile Money.',      emoji: '✅' },
]

export default function SmartzDeliveryPage() {
  const ref = useRef(null)
  const heroRef = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const heroIn = useInView(heroRef, { once: true })
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.deliveryPageBg)

  // Live counts from real tables
  const liveStats   = usePublicStats()
  const driverCount = fmtCount(liveStats.registeredDrivers, '—')
  const memberCount = fmtCount(liveStats.totalUsers, '—')

  const stats = [
    { value: memberCount,  label: 'Platform Members',    icon: '👤' },
    { value: driverCount,  label: 'Registered Riders',   icon: '🏍️' },
    { value: '6',          label: 'Cities Targeted',     icon: '🏙️' },
    { value: '3+',         label: 'Countries',           icon: '🌍' },
  ]

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* Hero */}
      <section ref={heroRef}>
        {/* Hero image */}
        <div className="w-full overflow-hidden relative">
          {bgUrl && (
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <motion.img
            src="/hero-images/delivery-hero.png"
            alt="SmartzDelivery — Delivering More Than Packages"
            className="w-full h-auto object-contain relative"
            style={{ opacity: bgUrl ? 0.85 : undefined }}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={heroIn ? { opacity: bgUrl ? 0.85 : 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
          />
        </div>

        {/* CTA buttons */}
        <div className="dark:bg-[#06031a]/90 bg-indigo-50/70 border-t-2 border-blue-500/25 py-6 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/register" className="btn-love px-7 py-3.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2">
              <Package className="w-4 h-4" /> Send a Package
            </Link>
            <Link to="/register" className="px-7 py-3.5 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm font-semibold hover:text-brand-pink transition-all inline-flex items-center gap-2">
              <Truck className="w-4 h-4" /> Business Solutions
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats — live counts from real tables */}
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

      {/* Delivery types */}
      <section ref={ref} className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-10">
            <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-3">
              Delivery <span className="text-gradient-love">Options</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {deliveryTypes.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                className={`dark:bg-[#130E1E] bg-white rounded-2xl p-6 border-2 ${d.color} hover:shadow-xl transition-all text-center group cursor-pointer`}>
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{d.emoji}</div>
                <h3 className="font-bold dark:text-white text-gray-900 mb-1">{d.name}</h3>
                <p className="text-xs dark:text-gray-400 text-gray-500 mb-3">{d.desc}</p>
                <p className="text-sm font-black text-brand-pink">{d.price}</p>
              </motion.div>
            ))}
          </div>

          {/* How it works */}
          <div className="mb-16">
            <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-8 text-center">
              How It <span className="text-gradient-love">Works</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
                  className="text-center">
                  <div className="text-5xl mb-3">{s.emoji}</div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-love-gradient text-white text-xs font-black mb-3">{s.step}</div>
                  <h3 className="font-bold dark:text-white text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
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

      {/* Business CTA */}
      <section className="py-16 dark:bg-[#0D0A14] bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="dark:bg-[#130E1E] bg-gray-50 rounded-3xl p-10 border dark:border-white/8 border-gray-100 shadow-xl grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display font-black text-3xl dark:text-white text-gray-900 mb-3">Business Solutions</h2>
              <p className="dark:text-gray-400 text-gray-600 mb-5">Scale your e-commerce with bulk delivery rates, API integration, and a dedicated account manager.</p>
              <ul className="space-y-2 mb-6">
                {['Bulk delivery discounts', 'API & webhook integration', 'Branded tracking pages', 'Dedicated account manager', 'Monthly invoicing'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
                <Zap className="w-4 h-4" /> Get Business Account
              </Link>
            </div>
            <div className="text-center">
              <div className="text-8xl mb-4">📦</div>
              <p className="font-display font-black text-4xl text-blue-500">{driverCount}</p>
              <p className="dark:text-gray-400 text-gray-600 text-sm">Registered Delivery Riders</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
