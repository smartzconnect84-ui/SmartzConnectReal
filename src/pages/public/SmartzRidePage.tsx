import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Car, MapPin, Shield, Clock, Star, DollarSign, Smartphone, Users, Zap, CheckCircle } from 'lucide-react'

const features = [
  { icon: MapPin,     title: 'Real-Time Tracking',  desc: 'Track your driver live on the map. Know exactly when they arrive.',                               color: 'from-emerald-500 to-teal-600' },
  { icon: Shield,     title: 'Safety First',         desc: 'All drivers are verified with ID checks, background screening, and vehicle inspection.',          color: 'from-blue-500 to-indigo-600' },
  { icon: Clock,      title: 'Fast Pickup',          desc: 'Average pickup time under 5 minutes in supported cities. Get moving fast.',                      color: 'from-amber-500 to-orange-600' },
  { icon: DollarSign, title: 'Affordable Fares',     desc: 'Transparent pricing with no surge surprises. Pay with Mobile Money, card, or cash.',             color: 'from-pink-500 to-rose-600' },
  { icon: Smartphone, title: 'In-App Chat',          desc: 'Message your driver directly through the app without sharing your phone number.',                color: 'from-violet-500 to-purple-600' },
  { icon: Star,       title: 'Rate & Review',        desc: 'Rate every ride and help maintain quality standards across the platform.',                       color: 'from-yellow-500 to-amber-600' },
]

const rideTypes = [
  { name: 'SmartzGo',   desc: 'Affordable everyday rides',  emoji: '🚗',  price: 'From $1.50', eta: '3 min' },
  { name: 'SmartzPlus', desc: 'Comfortable premium rides',  emoji: '🚙',  price: 'From $3.00', eta: '5 min' },
  { name: 'SmartzXL',   desc: 'Group rides up to 6 people', emoji: '🚐',  price: 'From $4.50', eta: '7 min' },
  { name: 'SmartzMoto', desc: 'Fast motorbike rides',       emoji: '🏍️', price: 'From $0.80', eta: '2 min' },
]

export default function SmartzRidePage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* Hero with flyer */}
      <section className="relative overflow-hidden">
        <div className="relative h-72 sm:h-96 lg:h-[480px]">
          <img src="/flyer.png" alt="SmartzConnect Ride" className="w-full h-full object-cover object-center scale-80 md:scale-100 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-emerald-900/40 to-black/85" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/25 backdrop-blur-sm border border-emerald-400/40 mb-5">
              <Car className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-semibold text-emerald-200">SmartzRide</span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-4 drop-shadow-2xl">
              Ride Smarter<br />Across <span className="text-emerald-300">Africa</span>
            </h1>
            <p className="text-lg text-white/80 mb-7 max-w-lg">
              Safe, affordable, and reliable rides at your fingertips. Book in seconds, pay with Mobile Money, and get moving.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/register" className="btn-love px-7 py-3.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2">
                <Car className="w-4 h-4" /> Book a Ride
              </Link>
              <Link to="/register" className="px-7 py-3.5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold hover:bg-white/25 transition-all inline-flex items-center gap-2">
                <Users className="w-4 h-4" /> Become a Driver
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="py-8 dark:bg-[#0D0A14] bg-white border-y dark:border-white/5 border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm dark:text-gray-400 text-gray-500">
            🚗 SmartzRide is launching in <strong>Monrovia, Liberia</strong> first — then expanding across Africa city by city.
            Join the waitlist by signing up today.
          </p>
        </div>
      </section>

      {/* Ride types */}
      <section ref={ref} className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-10">
            <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-3">
              Choose Your <span className="text-gradient-love">Ride</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {rideTypes.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-emerald-500/30 transition-all text-center group cursor-pointer">
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{r.emoji}</div>
                <h3 className="font-bold dark:text-white text-gray-900 mb-1">{r.name}</h3>
                <p className="text-xs dark:text-gray-400 text-gray-500 mb-3">{r.desc}</p>
                <p className="text-sm font-black text-emerald-500">{r.price}</p>
                <p className="text-xs dark:text-gray-500 text-gray-400">ETA: {r.eta}</p>
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

      {/* Driver CTA with flyer */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative shadow-2xl">
            <img src="/flyer.png" alt="SmartzConnect" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 to-emerald-900/75" />
            <div className="relative p-8 sm:p-10 grid sm:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-display font-black text-3xl text-white mb-3">Drive with SmartzRide</h2>
                <p className="text-white/80 mb-5">Earn on your schedule. Keep 80% of every fare. Get paid weekly via Mobile Money.</p>
                <ul className="space-y-2 mb-6">
                  {['Flexible hours — drive when you want', 'Weekly payouts via MTN/Orange MoMo', 'Free driver training &amp; support', 'Fuel discount partnerships'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/90">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25">
                  <Zap className="w-4 h-4" /> Apply as Driver
                </Link>
              </div>
              <div className="text-center">
                <div className="text-8xl mb-4">🚗</div>
                <p className="font-display font-black text-4xl text-emerald-400">$800+</p>
                <p className="text-white/70 text-sm">Average monthly earnings</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
