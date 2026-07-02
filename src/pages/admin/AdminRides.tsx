import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Car, RefreshCw, MapPin, User, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface RideRequest {
  id: number
  rider_id: number
  driver_id: number | null
  pickup_address: string
  dropoff_address: string
  status: string
  fare_estimate: number | null
  fare_final: number | null
  created_at: string
  completed_at: string | null
}

interface Driver {
  id: number
  user_id: number
  vehicle_type: string
  vehicle_make: string
  vehicle_model: string
  is_available: boolean
  is_verified: boolean
  rating: number | null
  total_rides: number
  created_at: string
}

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  accepted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function AdminRides() {
  const [rides, setRides] = useState<RideRequest[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'rides' | 'drivers'>('rides')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    const [ridesRes, driversRes] = await Promise.all([
      supabase.from('ride_requests').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('drivers').select('*').order('created_at', { ascending: false }),
    ])
    setRides(ridesRes.data || [])
    setDrivers(driversRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const verifyDriver = async (id: number, verified: boolean) => {
    await supabase.from('drivers').update({ is_verified: !verified }).eq('id', id)
    await fetchData()
  }

  const filteredRides = rides.filter(r => statusFilter === 'all' || r.status === statusFilter)

  const stats = [
    { label: 'Total Rides', value: rides.length, color: 'text-brand-pink' },
    { label: 'Completed', value: rides.filter(r => r.status === 'completed').length, color: 'text-emerald-500' },
    { label: 'Active Drivers', value: drivers.filter(d => d.is_available).length, color: 'text-blue-500' },
    { label: 'Pending', value: rides.filter(r => r.status === 'pending').length, color: 'text-amber-500' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">SmartzRide</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-0.5">Manage rides and drivers</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-200">
            <p className={`font-display font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 p-1 dark:bg-white/5 bg-gray-100 rounded-xl w-fit">
        {(['rides', 'drivers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-love-gradient text-white shadow-sm' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
            {t === 'rides' ? '🚗 Rides' : '👤 Drivers'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-brand-pink" /></div>
      ) : tab === 'rides' ? (
        <>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredRides.map(r => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-200">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-brand-pink" />
                    <span className="font-bold dark:text-white text-gray-900 text-sm">Ride #{r.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor[r.status] || ''}`}>{r.status}</span>
                  </div>
                  <span className="text-xs dark:text-gray-400 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 dark:text-gray-300 text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{r.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-2 dark:text-gray-300 text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="truncate">{r.dropoff_address}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs dark:text-gray-400 text-gray-500">
                  <span>Rider: #{r.rider_id}</span>
                  {r.driver_id && <span>Driver: #{r.driver_id}</span>}
                  {r.fare_final && <span className="font-bold text-emerald-500">${r.fare_final}</span>}
                  {!r.fare_final && r.fare_estimate && <span className="text-amber-500">Est. ${r.fare_estimate}</span>}
                </div>
              </motion.div>
            ))}
            {filteredRides.length === 0 && <div className="text-center py-12 dark:text-gray-500 text-gray-400 text-sm">No rides found</div>}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {drivers.map(d => (
            <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold dark:text-white text-gray-900 text-sm">Driver #{d.user_id}</span>
                      {d.is_verified && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">✓ Verified</span>}
                      {d.is_available && <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Online</span>}
                    </div>
                    <p className="text-sm dark:text-gray-400 text-gray-600">{d.vehicle_make} {d.vehicle_model} ({d.vehicle_type})</p>
                    <div className="flex items-center gap-3 mt-1 text-xs dark:text-gray-500 text-gray-400">
                      {d.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{d.rating.toFixed(1)}</span>}
                      <span>{d.total_rides} rides</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => verifyDriver(d.id, d.is_verified)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${d.is_verified ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                  {d.is_verified ? 'Revoke' : 'Verify'}
                </button>
              </div>
            </motion.div>
          ))}
          {drivers.length === 0 && <div className="text-center py-12 dark:text-gray-500 text-gray-400 text-sm">No drivers registered yet</div>}
        </div>
      )}
    </div>
  )
}
