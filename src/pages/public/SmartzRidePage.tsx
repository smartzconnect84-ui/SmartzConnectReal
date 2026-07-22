import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Car, MapPin, Shield, Clock, Star, DollarSign,
  Smartphone, Users, Zap, ArrowRight,
  Navigation, Wallet, BarChart3, Globe,
  Route, Bike, Bus,
} from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import { usePublicStats, fmtCount } from '@/hooks/usePublicStats'
import { useAuth } from '@/hooks/useAuth'

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
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.ridePageBg)
  const { session } = useAuth()
  const isSignedIn = !!session
  const rideHref = isSignedIn ? '/app/ride' : '/register'

  // Live counts from real tables
  const liveStats     = usePublicStats()
  const driverCount   = fmtCount(liveStats.registeredDrivers, '—')
  const memberCount   = fmtCount(liveStats.totalUsers, '—')

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen pt-[72px] sm:pt-20">

      {/* ── Hero ── */}
      <section ref={heroRef}>
        {/* Hero image */}
        <div className="w-full overflow-hidden relative">
          {bgUrl && (
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <motion.img
            src="/hero-images/ride-hero.png"
            alt="SmartzRide — Your Ride. Anytime. Anywhere."
            className="w-full h-auto object-contain relative"
            style={{ opacity: bgUrl ? 0.85 : undefined }}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={heroIn ? { opacity: bgUrl ? 0.85 : 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
          />
        </div>

        {/* CTA buttons */}
        <div className="dark:bg-[#021a0e]/90 bg-emerald-50/70 border-t-2 border-emerald-500/25 py-6 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to={rideHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Car className="w-4 h-4" /> Book Ride
            </Link>
            <Link to={rideHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl dark:bg-emerald-900/30 bg-white border dark:border-emerald-500/20 border-emerald-300/50 dark:text-emerald-200 text-emerald-800 font-semibold text-sm hover:dark:bg-emerald-900/50 hover:bg-emerald-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Users className="w-4 h-4" /> Drive With Us
            </Link>
          </motion.div>
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

      {/* ── Live platform stats ── */}
      <section className="py-10 dark:bg-[#0D0A14] bg-white border-b dark:border-white/5 border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Registered Drivers', value: driverCount,  icon: Car },
              { label: 'Platform Members',   value: memberCount,  icon: Users },
              { label: 'Cities Targeted',    value: '6',          icon: Navigation },
              { label: 'Countries',          value: '3+',         icon: Globe },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/20">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-display font-black text-2xl sm:text-3xl bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">{s.value}</p>
                  <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5 font-medium">{s.label}</p>
                </motion.div>
              )
            })}
          </div>
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

                <Link to={rideHref}
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
            <Link to={rideHref}
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
