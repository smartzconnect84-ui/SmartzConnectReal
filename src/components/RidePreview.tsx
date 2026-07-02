import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Car, MapPin, Clock, Star, Shield, ArrowRight } from 'lucide-react'

const rideFeatures = [
  { icon: MapPin, title: 'Live GPS Tracking', desc: 'Track your driver in real-time on an interactive map' },
  { icon: Clock, title: 'Instant Booking', desc: 'Book a ride in under 30 seconds, driver arrives fast' },
  { icon: Star, title: 'Rated Drivers', desc: 'All drivers are verified, rated, and background-checked' },
  { icon: Shield, title: 'Safe Rides', desc: 'Emergency SOS button, trip sharing, and 24/7 support' },
]

export default function RidePreview() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 dark:bg-[#0A0A12] bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Map mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border dark:border-white/8 border-gray-200 shadow-2xl shadow-black/20 aspect-[4/3]">
              {/* Map background */}
              <div className="absolute inset-0 dark:bg-[#111118] bg-gray-100">
                {/* Fake map grid */}
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(245,166,35,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.3) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                  }}
                />
                {/* Roads */}
                <div className="absolute top-1/2 left-0 right-0 h-1 dark:bg-brand-border bg-gray-300 opacity-60" />
                <div className="absolute top-0 bottom-0 left-1/3 w-1 dark:bg-brand-border bg-gray-300 opacity-60" />
                <div className="absolute top-0 bottom-0 left-2/3 w-1 dark:bg-brand-border bg-gray-300 opacity-40" />
                <div className="absolute top-1/3 left-0 right-0 h-0.5 dark:bg-brand-border bg-gray-300 opacity-40" />
                <div className="absolute top-2/3 left-0 right-0 h-0.5 dark:bg-brand-border bg-gray-300 opacity-40" />
              </div>

              {/* Driver marker */}
              <motion.div
                animate={{ x: [0, 20, 40, 20, 0], y: [0, -10, 0, 10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/3 left-1/4 z-10"
              >
                <div className="w-10 h-10 rounded-full bg-brand-pink shadow-lg shadow-pink-500/40 flex items-center justify-center animate-pulse-gold">
                  <Car className="w-5 h-5 text-brand-dark" />
                </div>
              </motion.div>

              {/* Destination marker */}
              <div className="absolute top-1/2 right-1/4 z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white fill-white" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rotate-45" />
              </div>

              {/* Route line */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5 }}>
                <path
                  d="M 100 120 Q 180 80 240 150 T 320 180"
                  stroke="#F5A623"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="8 4"
                  opacity="0.7"
                />
              </svg>

              {/* ETA card */}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="dark:bg-[#1A1A28]/95 bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl border dark:border-white/8 border-gray-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs dark:text-gray-400 text-gray-500">Driver arriving in</p>
                      <p className="text-2xl font-display font-bold text-brand-pink">3 min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs dark:text-gray-400 text-gray-500">Fare estimate</p>
                      <p className="text-lg font-bold dark:text-white text-gray-900">$4.50</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-pink/20 flex items-center justify-center text-sm">👨</div>
                    <div>
                      <p className="text-sm font-semibold dark:text-white text-gray-900">Emmanuel K.</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-brand-pink fill-brand-pink" />
                        <span className="text-xs dark:text-gray-400 text-gray-500">4.9 • Toyota Camry</span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right content */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <Car className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">SmartzRide</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold dark:text-white text-gray-900 mb-6 leading-tight">
              Rides you can{' '}
              <span className="text-gradient-love">trust.</span>{' '}
              Anywhere in Africa.
            </h2>
            <p className="text-lg dark:text-gray-400 text-gray-600 mb-8 leading-relaxed">
              Book safe, affordable rides with verified drivers. Starting in Monrovia and expanding across Africa — your city, your ride.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {rideFeatures.map((feat, i) => {
                const Icon = feat.icon
                return (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-2xl dark:bg-[#111118] bg-gray-50 border dark:border-white/6 border-gray-200"
                  >
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold dark:text-white text-gray-900">{feat.title}</p>
                      <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{feat.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn-love flex items-center justify-center gap-2">
                Book a Ride
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="px-6 py-3 rounded-xl border dark:border-white/6 border-gray-200 dark:text-gray-300 text-gray-700 font-medium hover:border-brand-pink hover:text-brand-pink transition-all text-sm">
                Become a Driver
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
