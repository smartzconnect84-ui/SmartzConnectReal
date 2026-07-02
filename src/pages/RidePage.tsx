import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Car, Clock, Star, Shield, ChevronRight, Navigation, Phone, Zap, Users, DollarSign } from 'lucide-react'

const rideTypes = [
  { id: 'standard', name: 'Standard',  emoji: '🚗', desc: 'Affordable everyday rides',  basePrice: 2.50, perKm: 0.80, eta: '3–5 min',  capacity: 4 },
  { id: 'comfort',  name: 'Comfort',   emoji: '🚙', desc: 'Newer cars, more space',      basePrice: 4.00, perKm: 1.20, eta: '5–8 min',  capacity: 4 },
  { id: 'xl',       name: 'XL',        emoji: '🚐', desc: 'For groups up to 6',          basePrice: 5.50, perKm: 1.50, eta: '8–12 min', capacity: 6 },
  { id: 'moto',     name: 'Moto',      emoji: '🏍️', desc: 'Beat traffic on a motorbike', basePrice: 1.50, perKm: 0.60, eta: '2–4 min',  capacity: 1 },
]

const nearbyDrivers = [
  { id: 1, name: 'James K.',    emoji: '👨🏿', rating: 4.9, trips: 1243, car: 'Toyota Corolla · LR-2024', distance: '0.8km', online: true  },
  { id: 2, name: 'Mariama S.', emoji: '👩🏾', rating: 4.8, trips: 876,  car: 'Honda Civic · LR-1987',    distance: '1.2km', online: true  },
  { id: 3, name: 'Kofi A.',    emoji: '👨🏾', rating: 4.7, trips: 2104, car: 'Hyundai Elantra · LR-3421', distance: '2.1km', online: false },
]

const recentTrips = [
  { from: 'Sinkor',       to: 'Capitol Hill',    date: 'Today, 9:14 AM',    price: '$4.20', type: '🚗', rating: 5 },
  { from: 'Paynesville',  to: 'Mamba Point',     date: 'Yesterday, 6:30 PM', price: '$7.80', type: '🚙', rating: 5 },
  { from: 'Red Light',    to: 'Monrovia Central', date: 'Jun 14, 2:15 PM',   price: '$3.50', type: '🏍️', rating: 4 },
]

export default function RidePage() {
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [selectedType, setSelectedType] = useState('standard')
  const [step, setStep] = useState<'book' | 'searching' | 'matched' | 'riding'>('book')
  const [matchedDriver, setMatchedDriver] = useState(nearbyDrivers[0])
  const [activeTab, setActiveTab] = useState<'book' | 'history' | 'driver'>('book')

  const selected = rideTypes.find(r => r.id === selectedType)!
  const distance = 4.2
  const fare = (selected.basePrice + selected.perKm * distance).toFixed(2)

  const startRide = () => {
    if (!pickup || !dropoff) return
    setStep('searching')
    setTimeout(() => {
      setMatchedDriver(nearbyDrivers[Math.floor(Math.random() * 2)])
      setStep('matched')
    }, 2500)
  }

  const cancelRide = () => {
    setStep('book')
    setPickup('')
    setDropoff('')
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 dark:bg-[#130E1E] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-black dark:text-white text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-brand-pink" /> SmartzRide
            </h1>
            <p className="text-xs dark:text-gray-500 text-gray-500">Ride-hailing in Monrovia & beyond</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-500">{nearbyDrivers.filter(d => d.online).length} drivers nearby</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 dark:bg-white/5 bg-gray-100 rounded-xl p-1">
          {(['book', 'history', 'driver'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-love-gradient text-white shadow-md' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {tab === 'book' ? '🚗 Book' : tab === 'history' ? '📋 History' : '🧑 Driver'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── BOOK TAB ── */}
        {activeTab === 'book' && (
          <div className="p-4 sm:p-6 space-y-4">

            {/* Map placeholder */}
            <div className="relative h-44 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 overflow-hidden flex items-center justify-center shadow-sm">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #ec4899 0%, transparent 50%), radial-gradient(circle at 70% 60%, #8b5cf6 0%, transparent 50%)' }} />
              <div className="text-center relative z-10">
                <div className="text-5xl mb-2">🗺️</div>
                <p className="text-sm font-bold dark:text-white text-gray-900">Monrovia, Liberia</p>
                <p className="text-xs dark:text-gray-400 text-gray-500">Live map coming soon</p>
              </div>
              {/* Driver dots */}
              {nearbyDrivers.filter(d => d.online).map((d, i) => (
                <div key={d.id} className="absolute text-xl animate-bounce" style={{ top: `${30 + i * 20}%`, left: `${20 + i * 25}%`, animationDelay: `${i * 0.3}s` }}>
                  🚗
                </div>
              ))}
            </div>

            {/* Searching overlay */}
            <AnimatePresence>
              {step === 'searching' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 text-center shadow-xl">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="text-4xl mb-3 inline-block">🔍</motion.div>
                  <p className="font-bold dark:text-white text-gray-900 mb-1">Finding your driver...</p>
                  <p className="text-xs dark:text-gray-400 text-gray-500">Matching you with the nearest driver</p>
                  <button onClick={cancelRide} className="mt-4 text-xs text-red-400 hover:underline">Cancel</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Matched driver */}
            <AnimatePresence>
              {step === 'matched' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-pink-500/30 border-pink-200 shadow-xl shadow-pink-500/10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-500">Driver matched! On the way</span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl dark:bg-white/8 bg-pink-50 flex items-center justify-center text-3xl flex-shrink-0">
                      {matchedDriver.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold dark:text-white text-gray-900">{matchedDriver.name}</p>
                      <p className="text-xs dark:text-gray-400 text-gray-500">{matchedDriver.car}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold dark:text-white text-gray-900">{matchedDriver.rating}</span>
                        <span className="text-xs dark:text-gray-400 text-gray-500">· {matchedDriver.trips.toLocaleString()} trips</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs dark:text-gray-400 text-gray-500">ETA</p>
                      <p className="font-bold text-brand-pink">{selected.eta}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-pink-500/20">
                      <Phone className="w-4 h-4" /> Call Driver
                    </button>
                    <button onClick={cancelRide}
                      className="px-4 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 text-sm font-semibold hover:text-red-400 transition-colors">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Booking form */}
            {step === 'book' && (
              <>
                {/* Pickup / Dropoff */}
                <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b dark:border-white/5 border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Pickup location"
                      className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none" />
                    <Navigation className="w-4 h-4 text-brand-pink flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-pink flex-shrink-0" />
                    <input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Where to?"
                      className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none" />
                    <MapPin className="w-4 h-4 dark:text-gray-500 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Quick destinations */}
                <div>
                  <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-2">Quick Destinations</p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {['Capitol Hill', 'Mamba Point', 'Paynesville', 'Red Light', 'Sinkor'].map(dest => (
                      <button key={dest} onClick={() => setDropoff(dest)}
                        className="flex-shrink-0 px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-xs font-semibold dark:text-gray-300 text-gray-700 hover:border-brand-pink hover:text-brand-pink transition-all">
                        📍 {dest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ride types */}
                <div>
                  <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-2">Choose Ride Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {rideTypes.map(type => (
                      <button key={type.id} onClick={() => setSelectedType(type.id)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${selectedType === type.id ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50 shadow-md shadow-pink-500/10' : 'dark:border-white/6 border-gray-200 dark:bg-[#130E1E] bg-white hover:border-pink-300'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xl">{type.emoji}</span>
                          <span className="text-xs font-black text-brand-pink">${(type.basePrice + type.perKm * distance).toFixed(2)}</span>
                        </div>
                        <p className="text-xs font-bold dark:text-white text-gray-900">{type.name}</p>
                        <p className="text-[10px] dark:text-gray-400 text-gray-500">{type.desc}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] dark:text-gray-500 text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {type.eta}
                          </span>
                          <span className="text-[9px] dark:text-gray-500 text-gray-400 flex items-center gap-0.5">
                            <Users className="w-2.5 h-2.5" /> {type.capacity}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fare estimate */}
                {pickup && dropoff && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold dark:text-white text-gray-900">Fare Estimate</span>
                      <span className="font-display font-black text-xl text-brand-pink">${fare}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs dark:text-gray-400 text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> ~{distance}km</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{selected.eta}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> MoMo / Cash</span>
                    </div>
                  </motion.div>
                )}

                {/* Book button */}
                <button onClick={startRide} disabled={!pickup || !dropoff}
                  className="w-full py-4 rounded-2xl bg-love-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
                  <Car className="w-4 h-4" /> Book {selected.name} · ${fare}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-6 space-y-3">
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider">Recent Trips</p>
            {recentTrips.map((trip, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                  {trip.type}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold dark:text-white text-gray-900 truncate">{trip.from}</span>
                    <ChevronRight className="w-3 h-3 dark:text-gray-500 text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-bold dark:text-white text-gray-900 truncate">{trip.to}</span>
                  </div>
                  <p className="text-[10px] dark:text-gray-500 text-gray-400">{trip.date}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: trip.rating }).map((_, j) => (
                      <Star key={j} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <span className="font-bold text-brand-pink text-sm flex-shrink-0">{trip.price}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── DRIVER TAB ── */}
        {activeTab === 'driver' && (
          <div className="p-4 sm:p-6">
            <div className="dark:bg-gradient-to-br dark:from-pink-900/30 dark:to-purple-900/30 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border dark:border-pink-500/20 border-pink-200 text-center mb-4">
              <div className="text-5xl mb-3">🚗</div>
              <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-2">Become a Driver</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-4">Earn up to $800/month driving with SmartzRide. Keep 80% of every fare.</p>
              <button className="px-6 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-md shadow-pink-500/20">
                Apply Now →
              </button>
            </div>
            <div className="space-y-3">
              {[
                { icon: Shield, title: 'Background Checked', desc: 'All drivers are verified and background checked', color: 'text-blue-500' },
                { icon: DollarSign, title: 'Weekly Payouts', desc: 'Get paid every Friday via MTN MoMo or Orange Money', color: 'text-emerald-500' },
                { icon: Zap, title: 'Flexible Hours', desc: 'Drive whenever you want, no minimum hours required', color: 'text-amber-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100">
                  <div className={`w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white text-gray-900">{item.title}</p>
                    <p className="text-xs dark:text-gray-400 text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
