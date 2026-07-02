import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Car, Clock, Star, Shield, ChevronRight, Navigation, Phone, Zap, Users, DollarSign, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const rideTypes = [
  { id: 'standard', name: 'Standard', emoji: '🚗', desc: 'Affordable everyday rides',   basePrice: 2.50, perKm: 0.80, eta: '3–5 min',  capacity: 4 },
  { id: 'comfort',  name: 'Comfort',  emoji: '🚙', desc: 'Newer cars, more space',       basePrice: 4.00, perKm: 1.20, eta: '5–8 min',  capacity: 4 },
  { id: 'xl',       name: 'XL',       emoji: '🚐', desc: 'For groups up to 6',           basePrice: 5.50, perKm: 1.50, eta: '8–12 min', capacity: 6 },
  { id: 'moto',     name: 'Moto',     emoji: '🏍️', desc: 'Beat traffic on a motorbike',  basePrice: 1.50, perKm: 0.60, eta: '2–4 min',  capacity: 1 },
]

interface Driver {
  id: string; name: string; avatar_url?: string; emoji: string
  rating: number; trips: number; car: string; distance: string; online: boolean
}

interface Trip {
  id: string; from: string; to: string; date: string; price: string; type: string; status: string
}

export default function RidePage() {
  const { user } = useAuth()
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [selectedType, setSelectedType] = useState('standard')
  const [step, setStep] = useState<'book' | 'searching' | 'matched' | 'riding'>('book')
  const [matchedDriver, setMatchedDriver] = useState<Driver | null>(null)
  const [activeTab, setActiveTab] = useState<'book' | 'history' | 'driver'>('book')
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([])
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(true)
  const [loadingTrips, setLoadingTrips] = useState(true)

  const selected = rideTypes.find(r => r.id === selectedType)!
  const distance = 4.2
  const fare = (selected.basePrice + selected.perKm * distance).toFixed(2)

  const defaultEmojis = ['👨🏿', '👩🏾', '👨🏾', '👩🏽', '👨🏽']

  const fetchDrivers = async () => {
    setLoadingDrivers(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, last_seen')
      .eq('is_driver', true)
      .limit(10)
    setNearbyDrivers((data || []).map((d: any, i: number) => ({
      id: String(d.id),
      name: d.full_name || 'Driver',
      avatar_url: d.avatar_url,
      emoji: defaultEmojis[i % defaultEmojis.length],
      rating: 4.8,
      trips: 0,
      car: 'Vehicle details pending',
      distance: 'Nearby',
      online: d.last_seen ? (Date.now() - new Date(d.last_seen).getTime()) < 300000 : false,
    })))
    setLoadingDrivers(false)
  }

  const fetchTrips = async () => {
    if (!user?.id) { setLoadingTrips(false); return }
    setLoadingTrips(true)
    const { data } = await supabase
      .from('rides')
      .select('id, pickup_location, dropoff_location, created_at, fare, vehicle_type, status')
      .eq('rider_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setRecentTrips((data || []).map((r: any) => ({
      id: String(r.id),
      from: r.pickup_location || 'Unknown',
      to: r.dropoff_location || 'Unknown',
      date: new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      price: r.fare ? `$${r.fare.toFixed(2)}` : 'N/A',
      type: rideTypes.find(rt => rt.id === r.vehicle_type)?.emoji || '🚗',
      status: r.status || 'completed',
    })))
    setLoadingTrips(false)
  }

  useEffect(() => { fetchDrivers(); fetchTrips() }, [user?.id])

  const startRide = () => {
    if (!pickup || !dropoff) return
    setStep('searching')
    setTimeout(() => {
      const online = nearbyDrivers.filter(d => d.online)
      const pick = online.length > 0 ? online[0] : nearbyDrivers[0]
      setMatchedDriver(pick || null)
      setStep(pick ? 'matched' : 'book')
    }, 2500)
  }

  const cancelRide = () => { setStep('book'); setPickup(''); setDropoff('') }

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 dark:bg-[#130E1E] bg-white border-b dark:border-purple-900/20 border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-black dark:text-white text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-brand-pink" /> SmartzRide
            </h1>
            <p className="text-xs dark:text-pink-300/60 text-gray-500">Ride-hailing in Monrovia & beyond</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-500">{nearbyDrivers.filter(d => d.online).length} drivers nearby</span>
          </div>
        </div>
        <div className="flex gap-1 dark:bg-white/5 bg-gray-100 rounded-xl p-1">
          {(['book', 'history', 'driver'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-love-gradient text-white shadow-md' : 'dark:text-purple-300/70 text-gray-600 hover:text-brand-pink'}`}>
              {tab === 'book' ? '🚗 Book' : tab === 'history' ? '📋 History' : '🧑 Driver'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Book tab */}
        {activeTab === 'book' && (
          <div className="p-4 space-y-4">
            <AnimatePresence mode="wait">
              {step === 'book' && (
                <motion.div key="book" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Pickup/dropoff */}
                  <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-purple-900/20 border-gray-100 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b dark:border-purple-900/10 border-gray-50">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Pickup location"
                        className="flex-1 bg-transparent text-sm dark:text-pink-50 text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 focus:outline-none" />
                      <button className="w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-50 flex items-center justify-center">
                        <Navigation className="w-3.5 h-3.5 dark:text-pink-400 text-brand-pink" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <MapPin className="w-4 h-4 text-brand-pink flex-shrink-0" />
                      <input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Where to?"
                        className="flex-1 bg-transparent text-sm dark:text-pink-50 text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 focus:outline-none" />
                    </div>
                  </div>

                  {/* Ride types */}
                  <div className="grid grid-cols-2 gap-2">
                    {rideTypes.map(type => (
                      <button key={type.id} onClick={() => setSelectedType(type.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${selectedType === type.id ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50 shadow-md shadow-pink-500/10' : 'dark:bg-[#130E1E] bg-white dark:border-purple-900/20 border-gray-100 hover:border-brand-pink/50'}`}>
                        <div className="text-2xl mb-1.5">{type.emoji}</div>
                        <div className="font-bold text-sm dark:text-white text-gray-900">{type.name}</div>
                        <div className="text-[11px] dark:text-purple-300/60 text-gray-500">{type.desc}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold dark:text-pink-400 text-brand-pink">${fare}</span>
                          <span className="text-[10px] dark:text-purple-400/60 text-gray-400">{type.eta}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button onClick={startRide} disabled={!pickup || !dropoff}
                    className="w-full py-4 rounded-2xl bg-love-gradient text-white font-bold text-sm shadow-xl shadow-pink-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Book {selected.name} · ${fare}
                  </button>
                </motion.div>
              )}

              {step === 'searching' && (
                <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
                  <p className="font-bold dark:text-white text-gray-900">Finding you a driver…</p>
                  <p className="text-sm dark:text-pink-300/60 text-gray-500">Hang tight, matching you with nearby drivers</p>
                  <button onClick={cancelRide} className="px-6 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-sm font-semibold">Cancel</button>
                </motion.div>
              )}

              {(step === 'matched' || step === 'riding') && matchedDriver && (
                <motion.div key="matched" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-purple-900/20 border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                        {step === 'matched' ? '✅ Driver matched!' : '🚗 En route'}
                      </span>
                      <span className="text-xs dark:text-pink-300/60 text-gray-500">ETA {selected.eta}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full dark:bg-purple-900/20 bg-gray-100 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
                        {matchedDriver.avatar_url ? <img src={matchedDriver.avatar_url} alt={matchedDriver.name} className="w-full h-full object-cover" /> : matchedDriver.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold dark:text-white text-gray-900">{matchedDriver.name}</p>
                        <p className="text-xs dark:text-purple-300/60 text-gray-500">{matchedDriver.car}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold dark:text-white text-gray-900">{matchedDriver.rating}</span>
                          <span className="text-[10px] dark:text-purple-300/60 text-gray-500">· {matchedDriver.distance} away</span>
                        </div>
                      </div>
                      <a href="tel:" className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
                        <Phone className="w-4 h-4 text-emerald-500" />
                      </a>
                    </div>
                  </div>
                  <button onClick={cancelRide} className="w-full py-3 rounded-2xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-sm font-semibold">
                    Cancel Ride
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold dark:text-white text-gray-900">Recent Trips</h2>
              <button onClick={fetchTrips} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
              </button>
            </div>
            {loadingTrips ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
                <p className="text-sm dark:text-pink-300/60 text-gray-500">Loading trips…</p>
              </div>
            ) : recentTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="text-4xl">🚗</div>
                <p className="font-bold dark:text-white text-gray-900">No trips yet</p>
                <p className="text-sm dark:text-pink-300/60 text-gray-500">Book your first SmartzRide!</p>
              </div>
            ) : (
              recentTrips.map((trip) => (
                <div key={trip.id} className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-purple-900/20 border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{trip.type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{trip.status}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="dark:text-pink-50 text-gray-800 font-medium">{trip.from}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-brand-pink flex-shrink-0" />
                          <span className="dark:text-pink-50 text-gray-800 font-medium">{trip.to}</span>
                        </div>
                      </div>
                      <p className="text-[11px] dark:text-purple-400/60 text-gray-400 mt-2">{trip.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black dark:text-pink-400 text-brand-pink text-lg">{trip.price}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Drivers tab */}
        {activeTab === 'driver' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold dark:text-white text-gray-900">Available Drivers</h2>
              <button onClick={fetchDrivers} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
              </button>
            </div>
            {loadingDrivers ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
                <p className="text-sm dark:text-pink-300/60 text-gray-500">Loading drivers…</p>
              </div>
            ) : nearbyDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="text-4xl">🚗</div>
                <p className="font-bold dark:text-white text-gray-900">No drivers online yet</p>
                <p className="text-sm dark:text-pink-300/60 text-gray-500">Drivers will appear here as they register on the platform</p>
              </div>
            ) : (
              nearbyDrivers.map((driver) => (
                <div key={driver.id} className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-purple-900/20 border-gray-100 p-4 flex items-center gap-4 shadow-sm">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full dark:bg-purple-900/20 bg-gray-100 flex items-center justify-center text-2xl overflow-hidden">
                      {driver.avatar_url ? <img src={driver.avatar_url} alt={driver.name} className="w-full h-full object-cover" /> : driver.emoji}
                    </div>
                    {driver.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 dark:border-[#130E1E] border-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold dark:text-white text-gray-900">{driver.name}</p>
                    <p className="text-xs dark:text-purple-300/60 text-gray-500">{driver.car}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold dark:text-white text-gray-900">{driver.rating}</span>
                      <span className="text-[10px] dark:text-purple-400/60 text-gray-400">· {driver.distance}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${driver.online ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-500 text-gray-400 dark:border-white/8 border-gray-200'}`}>
                    {driver.online ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
