import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Package, MapPin, Clock, Shield, Truck, DollarSign, Smartphone, Zap, CheckCircle, BarChart3 } from 'lucide-react'

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

const stats = [
  { value: '500K+', label: 'Deliveries Made',    icon: '📦' },
  { value: '98.5%', label: 'On-Time Rate',        icon: '⏱️' },
  { value: '12K+',  label: 'Delivery Riders',    icon: '🏍️' },
  { value: '6',     label: 'Cities Covered',     icon: '🏙️' },
]

export default function SmartzDeliveryPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-indigo-900/10 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/15 border border-blue-500/25 mb-6">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">SmartzDelivery</span>
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl dark:text-white text-gray-900 leading-tight mb-5">
                Fast, Reliable<br />Delivery Across<br /><span className="text-gradient-love">Africa</span>
              </h1>
              <p className="text-lg dark:text-gray-400 text-gray-600 leading-relaxed mb-8 max-w-lg">
                From your door to theirs — same-day delivery, live tracking, and Mobile Money payments. Built for African businesses and individuals.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-love px-7 py-3.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2">
                  <Package className="w-4 h-4" /> Send a Package
                </Link>
                <Link to="/register" className="px-7 py-3.5 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm font-semibold hover:text-brand-pink transition-all inline-flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Business Solutions
                </Link>
              </div>
            </motion.div>

            {/* Tracking mockup */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="dark:bg-[#130E1E] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-100 shadow-2xl max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold dark:text-white text-gray-900 text-sm">Live Tracking</p>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> On the way
                  </span>
                </div>
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-4 mb-4 text-center">
                  <div className="text-5xl mb-2">🗺️</div>
                  <p className="text-white/70 text-xs">Rider is 1.2km away</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Package picked up', time: '10:30 AM', done: true },
                    { label: 'In transit',         time: '11:15 AM', done: true },
                    { label: 'Out for delivery',   time: '11:45 AM', done: true },
                    { label: 'Delivered',          time: 'Est. 12:10 PM', done: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-emerald-500' : 'dark:bg-white/10 bg-gray-200'}`}>
                        {s.done && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold ${s.done ? 'dark:text-white text-gray-900' : 'dark:text-gray-500 text-gray-400'}`}>{s.label}</p>
                      </div>
                      <p className="text-[10px] dark:text-gray-500 text-gray-400">{s.time}</p>
                    </div>
                  ))}
                </div>
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
              <p className="font-display font-black text-4xl text-blue-500">98.5%</p>
              <p className="dark:text-gray-400 text-gray-600 text-sm">On-time delivery rate</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
