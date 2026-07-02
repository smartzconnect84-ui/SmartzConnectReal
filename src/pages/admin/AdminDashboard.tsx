import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users, DollarSign, Car, AlertTriangle,
  Heart, ShoppingBag, Tv, UserCheck, Clock, ArrowRight, RefreshCw,
  Database
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashStats {
  totalUsers: number
  verifiedUsers: number
  activeRides: number
  openReports: number
  newMatches: number
  liveStreams: number
  revenue: number
  marketplaceSales: number
}

interface RecentUser {
  id: string
  email: string
  full_name: string | null
  country: string | null
  subscription_tier: string | null
  is_active: boolean
  created_at: string
}

interface ActivityLog {
  id: string
  action: string
  created_at: string
  user_id: string | null
}

const statusColors: Record<string, string> = {
  active:    'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
  suspended: 'bg-amber-500/15 text-amber-500 border-amber-500/25',
  banned:    'bg-red-500/15 text-red-500 border-red-500/25',
}

const planColors: Record<string, string> = {
  free:    'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-600',
  premium: 'bg-pink-500/15 text-brand-pink',
  vip:     'bg-amber-500/15 text-amber-500',
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 80, H = 32
  const min = Math.min(...data), max = Math.max(...data)
  const xs = (i: number) => (i / (data.length - 1)) * W
  const ys = (v: number) => H - 4 - ((v - min) / (max - min + 1)) * (H - 8)
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)},${ys(v)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-8">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Database className="w-8 h-8 dark:text-gray-600 text-gray-300 mb-3" />
      <p className="text-sm dark:text-gray-500 text-gray-400">{label}</p>
      <p className="text-xs dark:text-gray-600 text-gray-300 mt-1">Connect Supabase to see live data</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats>({
    totalUsers: 0, verifiedUsers: 0, activeRides: 0, openReports: 0,
    newMatches: 0, liveStreams: 0, revenue: 0, marketplaceSales: 0,
  })
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [dbConnected, setDbConnected] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, reportsRes, activityRes] = await Promise.all([
        supabase.from('users').select('id, email, full_name, country, subscription_tier, is_active, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(10),
        supabase.from('reports').select('id', { count: 'exact' }).eq('status', 'open'),
        supabase.from('audit_logs').select('id, action, created_at, user_id').order('created_at', { ascending: false }).limit(8),
      ])

      if (usersRes.error && usersRes.error.message.includes('does not exist')) {
        setDbConnected(false)
        return
      }

      setDbConnected(true)

      const allUsers = usersRes.data || []
      const totalUsers = usersRes.count || 0
      const verifiedUsers = allUsers.filter(u => u.is_active).length

      setStats(prev => ({
        ...prev,
        totalUsers,
        verifiedUsers,
        openReports: reportsRes.count || 0,
      }))

      setRecentUsers(allUsers.slice(0, 6) as RecentUser[])
      setRecentActivity((activityRes.data || []) as ActivityLog[])
    } catch {
      setDbConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setLastUpdated(new Date())
    setRefreshing(false)
  }

  const timeAgo = () => {
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    if (diff < 10) return 'just now'
    if (diff < 60) return `${diff}s ago`
    return `${Math.floor(diff / 60)}m ago`
  }

  const statCards = [
    { label: 'Total Users',       value: stats.totalUsers.toLocaleString(),    change: null, up: true,  icon: Users,         gradient: 'from-pink-500 to-rose-600',     bg: 'dark:bg-pink-500/10 bg-pink-50',      border: 'dark:border-pink-500/20 border-pink-200' },
    { label: 'Verified Users',    value: stats.verifiedUsers.toLocaleString(), change: null, up: true,  icon: UserCheck,     gradient: 'from-emerald-500 to-teal-600',   bg: 'dark:bg-emerald-500/10 bg-emerald-50',border: 'dark:border-emerald-500/20 border-emerald-200' },
    { label: 'Active Rides',      value: stats.activeRides.toLocaleString(),   change: null, up: true,  icon: Car,           gradient: 'from-fuchsia-500 to-pink-600',   bg: 'dark:bg-fuchsia-500/10 bg-fuchsia-50',border: 'dark:border-fuchsia-500/20 border-fuchsia-200' },
    { label: 'Open Reports',      value: stats.openReports.toLocaleString(),   change: null, up: false, icon: AlertTriangle, gradient: 'from-amber-500 to-orange-600',   bg: 'dark:bg-amber-500/10 bg-amber-50',    border: 'dark:border-amber-500/20 border-amber-200' },
    { label: 'New Matches',       value: stats.newMatches.toLocaleString(),    change: null, up: true,  icon: Heart,         gradient: 'from-rose-500 to-pink-600',      bg: 'dark:bg-rose-500/10 bg-rose-50',      border: 'dark:border-rose-500/20 border-rose-200' },
    { label: 'Marketplace Sales', value: `$${stats.marketplaceSales.toFixed(2)}`, change: null, up: true, icon: ShoppingBag, gradient: 'from-violet-500 to-purple-600',  bg: 'dark:bg-violet-500/10 bg-violet-50',  border: 'dark:border-violet-500/20 border-violet-200' },
    { label: 'Live Streams',      value: stats.liveStreams.toLocaleString(),   change: null, up: true,  icon: Tv,            gradient: 'from-indigo-500 to-blue-600',    bg: 'dark:bg-indigo-500/10 bg-indigo-50',  border: 'dark:border-indigo-500/20 border-indigo-200' },
    { label: 'Revenue (MTD)',     value: `$${stats.revenue.toFixed(2)}`,       change: null, up: true,  icon: DollarSign,    gradient: 'from-purple-500 to-violet-600',  bg: 'dark:bg-purple-500/10 bg-purple-50',  border: 'dark:border-purple-500/20 border-purple-200' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Dashboard</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">
            {dbConnected ? 'Live platform data' : 'Connect Supabase to see live data'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-xs dark:text-gray-400 text-gray-500 hover:text-brand-pink transition-all ${refreshing ? 'opacity-60' : ''}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200">
            <Clock className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
            <span className="text-xs dark:text-gray-400 text-gray-500">Updated {timeAgo()}</span>
            <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>
        </div>
      </div>

      {/* DB not connected banner */}
      {!loading && !dbConnected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <Database className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Supabase not connected</p>
            <p className="text-xs dark:text-amber-500/80 text-amber-600/80 mt-0.5">
              Add <code className="font-mono bg-amber-500/10 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono bg-amber-500/10 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to your environment to enable live data.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon
          const sparkData = Array.from({ length: 8 }, (_, j) => j + 1)
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-4 border ${s.bg} ${s.border}`}>
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <Sparkline data={sparkData} color={s.up ? '#10b981' : '#ef4444'} />
              </div>
              {loading ? (
                <div className="h-6 w-16 dark:bg-white/10 bg-gray-200 rounded animate-pulse mb-1" />
              ) : (
                <p className="font-display font-black text-xl dark:text-white text-gray-900">{s.value}</p>
              )}
              <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Users & Activity */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Recent users */}
        <div className="lg:col-span-2 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100">
            <h3 className="font-bold text-sm dark:text-white text-gray-900">Recent Users</h3>
            <a href="/admin/users" className="flex items-center gap-1 text-xs text-brand-pink hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-pink" />
            </div>
          ) : recentUsers.length === 0 ? (
            <EmptyState label="No users yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-white/5 border-gray-100">
                    {['User', 'Country', 'Plan', 'Status', 'Joined'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/4 divide-gray-50">
                  {recentUsers.map((user, i) => (
                    <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="hover:dark:bg-white/2 hover:bg-pink-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold dark:text-white text-gray-900">{user.full_name || 'User'}</p>
                          <p className="text-[10px] dark:text-gray-500 text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.country || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${planColors[user.subscription_tier || 'free'] || planColors['free']}`}>
                          {user.subscription_tier || 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[user.is_active ? 'active' : 'suspended']}`}>
                          {user.is_active ? 'active' : 'suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] dark:text-gray-500 text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b dark:border-white/6 border-gray-100">
            <h3 className="font-bold text-sm dark:text-white text-gray-900">Recent Activity</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-pink" />
            </div>
          ) : recentActivity.length === 0 ? (
            <EmptyState label="No activity yet" />
          ) : (
            <div className="p-4 space-y-3">
              {recentActivity.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-pink mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs dark:text-gray-300 text-gray-700">{item.action}</p>
                    <p className="text-[10px] dark:text-gray-500 text-gray-400 mt-0.5">
                      {new Date(item.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
