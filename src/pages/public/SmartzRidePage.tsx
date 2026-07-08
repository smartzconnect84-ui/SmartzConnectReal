import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Car, MapPin, Shield, Clock, Star, DollarSign,
  Smartphone, Users, Zap, ArrowRight,
  Navigation, Wallet, BarChart3, Globe,
  Route, Bike, Bus,
} from 'lucide-react'

const features = [
  {
    icon: MapPin, title: 'Real-Time Tracking',
    desc: 'Track your driver live on the map. Know exactly when they arrive and follow your route in real-time.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Shield, title: 'Safety First',
    desc: 'All drivers are verified with ID checks, background screening, and vehicle inspection before going live.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Clock, title: 'Fast Pickup',
    desc: 'Average pickup time under 5 minutes in supported cities. No waiting, just moving.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: DollarSign, title: 'Affordable Fares',
    desc: 'Transparent pricing with no surprise surges. Pay with Mobile Money, card, or cash.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Smartphone, title: 'In-App Chat',
    desc: 'Message your driver directly through the app without sharing your personal phone number.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Star, title: 'Rate & Review',
    desc: 'Rate every ride and help maintain quality standards across the entire platform.',
    color: 'from-yellow-500 to-amber-600',
  },
]

const rideTypes = [
  { name: 'SmartzGo',   desc: 'Affordable everyday rides',  icon: Car,        price: 'From $1.50', eta: '3 min',  color: 'from-emerald-500 to-teal-600' },
  { name: 'SmartzPlus', desc: 'Comfortable premium rides',  icon: Star,       price: 'From $3.00', eta: '5 min',  color: 'from-blue-500 to-indigo-600' },
  { name: 'SmartzXL',   desc: 'Group rides up to 6 people', icon: Bus,        price: 'From $4.50', eta: '7 min',  color: 'from-amber-500 to-orange-600' },
  { name: 'SmartzMoto', desc: 'Fast motorbike rides',       icon: Bike,       price: 'From $0.80', eta: '2 min',  color: 'from-pink-500 to-rose-600' },
]

const driverBenefits = [
  { icon: Wallet,    text: 'Keep 80% of every fare — top driver earnings' },
  { icon: Clock,    text: 'Drive on your own schedule, any time of day' },
  { icon: Zap,      text: 'Weekly payouts via MTN & Orange Mobile Money' },
  { icon: BarChart3, text: 'Earnings dashboard with real-time stats' },
  { icon: Globe,    text: 'Free training, onboarding & dedicated support' },
  { icon: Shield,   text: 'Driver protection & insurance coverage' },
]

export default function SmartzRidePage() {
  const ref    = useRef(null)
  const heroRef = useRef(null)
  const inView  = useInView(ref,    { once: true, margin: '-80px' })
  const heroIn  = useInView(heroRef, { once: true })

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" ref={heroRef}>
        {/* Background */}
        <div className="relative h-[460px] sm:h-[540px] lg:h-[620px] bg-gradient-to-br from-[#021a0e] via-[#032b16] to-[#041f12]">
          {/* Decorative blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-600/20 blur-3xl" />
            <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-emerald-400/10 blur-2xl" />
          </div>

          {/* Floating icon decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-12 left-[8%] opacity-20 rotate-[-15deg]">
              <Car className="w-16 h-16 text-emerald-300" />
            </div>
            <div className="absolute top-20 right-[10%] opacity-15 rotate-[12deg]">
              <MapPin className="w-12 h-12 text-teal-300" />
            </div>
            <div className="absolute bottom-16 left-[15%] opacity-15 rotate-[8deg]">
              <Route className="w-14 h-14 text-emerald-200" />
            </div>
            <div className="absolute bottom-20 right-[8%] opacity-20 rotate-[-10deg]">
              <Navigation className="w-10 h-10 text-teal-200" />
            </div>
            <div className="absolute top-1/2 right-[20%] opacity-10">
              <Shield className="w-20 h-20 text-emerald-300" />
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/25 backdrop-blur-sm border border-emerald-400/40 mb-6">
                <Car className="w-4 h-4 text-emerald-300" />
                <span className="text-sm font-bold text-emerald-200">SmartzRide — Coming to Africa</span>
              </div>

              <h1 className="font-display font-black text-[2.75rem] sm:text-6xl lg:text-7xl text-white leading-[1.05] mb-8 drop-shadow-2xl">
                Ride Smarter<br />
                Across <span className="text-emerald-300">Africa</span>
              </h1>

              {/* Two main CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
                  <Car className="w-4 h-4" /> Book Ride
                </Link>
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold text-sm hover:bg-white/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
                  <Users className="w-4 h-4" /> Drive With Us
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Launch banner ── */}
      <section className="py-6 dark:bg-[#0D0A14] bg-white border-y dark:border-white/5 border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-base dark:text-gray-300 text-gray-700">
            🚗 SmartzRide is launching first in <strong className="text-emerald-500">Monrovia, Liberia</strong> —
            then expanding city by city across Africa. Join the waitlist by signing up today.
          </p>
        </div>
      </section>

      {/* ── Ride types ── */}
      <section ref={ref} className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-[2.75rem] dark:text-white text-gray-900 mb-3">
              Choose Your <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Ride</span>
            </h2>
            <p className="text-lg dark:text-gray-400 text-gray-600 max-w-xl mx-auto">
              Whether solo or with a group, we have a ride for every occasion and budget.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
            {rideTypes.map((r, i) => {
              const RideIcon = r.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-emerald-500/30 transition-all text-center group cursor-pointer">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <RideIcon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-base dark:text-white text-gray-900 mb-1">{r.name}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-500 mb-4">{r.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t dark:border-white/6 border-gray-100">
                    <p className="text-sm font-black text-emerald-500">{r.price}</p>
                    <div className="flex items-center gap-1 text-xs dark:text-gray-400 text-gray-500">
                      <Clock className="w-3.5 h-3.5" /> {r.eta}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Features */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.15 }} className="text-center mb-10">
            <h2 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-2">
              Why Riders Love SmartzRide
            </h2>
            <p className="text-base dark:text-gray-400 text-gray-600">Built from the ground up for African cities.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-emerald-500/20 transition-all group">
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

      {/* ── Driver CTA ── */}
      <section className="py-16 sm:py-24 dark:bg-[#0D0A14] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl dark:bg-[#130E1E] bg-emerald-50 border dark:border-white/8 border-emerald-100 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-radial from-emerald-500/12 via-transparent to-transparent pointer-events-none" />

            <div className="relative grid sm:grid-cols-2 gap-10 p-8 sm:p-12 lg:p-14 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 mb-6">
                  <Car className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Drive with SmartzRide</span>
                </div>

                <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4 leading-tight">
                  Earn on Your<br />Own Schedule
                </h2>

                <p className="text-base dark:text-gray-400 text-gray-600 mb-6 leading-relaxed">
                  Keep more of what you earn. Get paid weekly via Mobile Money.
                  No boss, no fixed hours — just you and the road.
                </p>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="font-display font-black text-4xl text-emerald-500">$800+</span>
                  <span className="text-sm dark:text-gray-400 text-gray-600">average monthly earnings</span>
                </div>

                <Link to="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-500/25 hover:scale-[1.03] transition-all">
                  <Zap className="w-4 h-4" /> Apply as Driver
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {driverBenefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-sm dark:text-gray-300 text-gray-700 font-medium">{b.text}</span>
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30">
            <Navigation className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4">
            Ready to Ride?
          </h2>
          <p className="text-lg dark:text-gray-400 text-gray-600 mb-8 max-w-lg mx-auto">
            Join the waitlist and be first to experience SmartzRide when it launches in your city.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-500/25 hover:scale-105 transition-all">
              <Navigation className="w-4 h-4" /> Join the Waitlist
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl dark:bg-white/6 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 font-semibold text-base hover:dark:bg-white/10 transition-all">
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
