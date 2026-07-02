import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Users, DollarSign, TrendingUp, Heart, MessageCircle,
  Tv, ShoppingBag, Car, Zap, RefreshCw, Download, Database
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalUsers: number
  newUsersThisMonth: number
  activeToday: number
  revenue: number
  matches: number
  messages: number
  posts: number
  reports: number
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [period, setPeriod] = useState('30d')

  const fetchStats = async () => {
    setLoading(true)
    const [usersRes, matchesRes, postsRes, reportsRes] = await Promise.all([
      supabase.from('profiles').select('id, created_at, last_seen', { count: 'exact' }),
      supabase.from('matches').select('id', { count: 'exact' }),
      supabase.from('posts').select('id', { count: 'exact' }),
      supabase.from('reports').select('id', { count: 'exact' }),
    ])

    if (usersRes.error && usersRes.error.message.includes('does not exist')) {
      setDbConnected(false)
      setStats(null)
    } else {
      setDbConnected(true)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const users = usersRes.data || []
      const newThisMonth = users.filter(u => new Date(u.created_at) >= monthStart).length
      const activeToday = users.filter(u => {
        if (!u.last_seen) return false
        const diff = Date.now() - new Date(u.last_seen).getTime()
        return diff < 24 * 3600 * 1000
      }).length

      setStats({
        totalUsers: usersRes.count || 0,
        newUsersThisMonth: newThisMonth,
        activeToday,
        revenue: 0,
        matches: matchesRes.count || 0,
        messages: 0,
        posts: postsRes.count || 0,
        reports: reportsRes.count || 0,
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchStats() }, [])

  const statCards = stats ? [
    { label: 'Total Users',       value: stats.totalUsers.toLocaleString(), icon: Users,       color: 'from-pink-500 to-rose-600',    sub: `+${stats.newUsersThisMonth} this month` },
    { label: 'Active Today',      value: stats.activeToday.toLocaleString(), icon: TrendingUp, color: 'from-purple-500 to-violet-600', sub: 'Unique active sessions' },
    { label: 'Total Matches',     value: stats.matches.toLocaleString(),     icon: Heart,      color: 'from-fuchsia-500 to-pink-600',  sub: 'All time matches' },
    { label: 'Total Posts',       value: stats.posts.toLocaleString(),       icon: MessageCircle, color: 'from-blue-500 to-indigo-600', sub: 'Feed posts' },
    { label: 'Open Reports',      value: stats.reports.toLocaleString(),     icon: BarChart3,  color: 'from-amber-500 to-orange-600',  sub: 'Needs attention' },
    { label: 'Platform Revenue',  value: '$0',                               icon: DollarSign, color: 'from-emerald-500 to-teal-600',  sub: 'Connect billing to track' },
  ] : []

  const featureUsage = [
    { icon: Heart,         label: 'Discover / Match', color: 'bg-pink-500' },
    { icon: MessageCircle, label: 'Private Chat',      color: 'bg-purple-500' },
    { icon: Users,         label: 'Social Feed',       color: 'bg-fuchsia-500' },
    { icon: Tv,            label: 'SmartzTV',          color: 'bg-violet-500' },
    { icon: ShoppingBag,   label: 'Marketplace',       color: 'bg-amber-500' },
    { icon: Car,           label: 'SmartzRide',        color: 'bg-emerald-500' },
    { icon: Zap,           label: 'Spin & Chat',       color: 'bg-rose-500' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Analytics</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Real-time platform metrics from your database</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex gap-1 dark:bg-[#130E1E] bg-gray-100 rounded-xl p-1">
            {['7d', '30d', '90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p ? 'bg-love-gradient text-white' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-sm dark:text-gray-300 text-gray-700 hover:text-brand-pink transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-5 animate-pulse">
              <div className="h-4 dark:bg-white/10 bg-gray-200 rounded mb-3 w-1/2" />
              <div className="h-8 dark:bg-white/10 bg-gray-200 rounded mb-2 w-3/4" />
              <div className="h-3 dark:bg-white/10 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* DB not connected */}
      {!loading && !dbConnected && (
        <div className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/6 border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-3xl dark:bg-white/5 bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 dark:text-gray-600 text-gray-400" />
          </div>
          <h3 className="font-bold text-lg dark:text-white text-gray-900 mb-2">Database not connected</h3>
          <p className="text-sm dark:text-gray-400 text-gray-500 max-w-md mx-auto mb-6">
            Configure your Supabase credentials to see real platform analytics. All metrics will populate automatically once connected.
          </p>
          <button onClick={fetchStats} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold mx-auto">
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </button>
        </div>
      )}

      {/* Stats grid */}
      {!loading && dbConnected && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {statCards.map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div key={card.label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-black dark:text-white text-gray-900">{card.value}</p>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{card.label}</p>
                  <p className="text-[10px] dark:text-gray-600 text-gray-400 mt-1">{card.sub}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Feature usage section */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <BarChart3 className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Feature Adoption</h3>
              <p className="ml-auto text-xs dark:text-gray-500 text-gray-400">Live data once connected</p>
            </div>
            <div className="p-5 space-y-4">
              {featureUsage.map(feature => {
                const Icon = feature.icon
                return (
                  <div key={feature.label} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl ${feature.color}/20 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${feature.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm dark:text-gray-300 text-gray-700">{feature.label}</span>
                        <span className="text-xs dark:text-gray-500 text-gray-400">—</span>
                      </div>
                      <div className="h-1.5 dark:bg-white/8 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${feature.color} rounded-full w-0 animate-pulse`} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Users by month */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <TrendingUp className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">User Growth</h3>
            </div>
            <div className="p-5 text-center">
              <p className="dark:text-gray-400 text-gray-500 text-sm">Total Registered Users</p>
              <p className="font-display font-black text-4xl dark:text-white text-gray-900 my-3">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-emerald-500 font-semibold">+{stats.newUsersThisMonth} joined this month</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
