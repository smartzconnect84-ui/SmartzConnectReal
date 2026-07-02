import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Ban, CheckCircle, Crown, Zap, MoreVertical, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface User {
  id: number
  email: string
  full_name: string | null
  role: string
  email_verified: boolean
  subscription_tier: string | null
  is_banned: boolean
  is_verified: boolean
  created_at: string
  country: string | null
}

const tierBadge = (tier: string | null) => {
  if (tier === 'vip')     return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center gap-1"><Crown className="w-2.5 h-2.5" />VIP</span>
  if (tier === 'premium') return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500/15 text-pink-500 border border-pink-500/25 flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Premium</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-500">Free</span>
}

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    superadmin: 'bg-red-500/15 text-red-500 border-red-500/25',
    admin:      'bg-orange-500/15 text-orange-500 border-orange-500/25',
    user:       'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-500 dark:border-white/8 border-gray-200',
  }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[role] || map.user}`}>{role}</span>
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'banned' | 'verified' | 'vip' | 'premium'>('all')
  const [selected, setSelected] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchUsers = async () => {
    setLoading(true)
    let q = supabase.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (search) q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    if (filter === 'banned')  q = q.eq('is_banned', true)
    if (filter === 'verified') q = q.eq('is_verified', true)
    if (filter === 'vip')     q = q.eq('subscription_tier', 'vip')
    if (filter === 'premium') q = q.eq('subscription_tier', 'premium')
    const { data, count } = await q.limit(100)
    setUsers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [search, filter])

  const doAction = async (action: string, userId: number) => {
    setActionLoading(true)
    const updates: Record<string, Record<string, string | boolean | null>> = {
      ban:          { is_banned: true },
      unban:        { is_banned: false },
      verify:       { is_verified: true, email_verified: true },
      unverify:     { is_verified: false },
      make_admin:   { role: 'admin' },
      make_user:    { role: 'user' },
      grant_vip:    { subscription_tier: 'vip' },
      grant_premium:{ subscription_tier: 'premium' },
      revoke_sub:   { subscription_tier: null },
    }
    if (updates[action]) {
      await supabase.from('users').update(updates[action]).eq('id', userId)
      await fetchUsers()
      setSelected(null)
    }
    setActionLoading(false)
  }

  const stats = [
    { label: 'Total Users', value: total, color: 'text-brand-pink' },
    { label: 'Banned',  value: users.filter(u => u.is_banned).length, color: 'text-red-500' },
    { label: 'VIP',     value: users.filter(u => u.subscription_tier === 'vip').length, color: 'text-amber-500' },
    { label: 'Verified',value: users.filter(u => u.is_verified).length, color: 'text-emerald-500' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">User Management</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-0.5">Manage all {total} registered users</p>
        </div>
        <button onClick={fetchUsers} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors">
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all','banned','verified','vip','premium'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-pink" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:border-white/6 border-gray-100 border-b">
                  <th className="text-left px-4 py-3 text-xs font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wide hidden sm:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wide hidden md:table-cell">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/4 divide-gray-100">
                {users.map(u => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:dark:bg-white/2 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(u.full_name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold dark:text-white text-gray-900 truncate text-sm">{u.full_name || '—'}</p>
                          <p className="text-xs dark:text-gray-500 text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{roleBadge(u.role || 'user')}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{tierBadge(u.subscription_tier)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs dark:text-gray-400 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {u.is_banned ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                            <Ban className="w-2.5 h-2.5" /> Banned
                          </span>
                        ) : u.email_verified ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle className="w-2.5 h-2.5" /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold dark:text-gray-500 text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">Unverified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(u)} className="p-1.5 rounded-lg hover:dark:bg-white/8 hover:bg-gray-100 transition-colors dark:text-gray-400 text-gray-500 hover:text-brand-pink">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 dark:text-gray-500 text-gray-400 text-sm">No users found</div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-lg">
                {(selected.full_name || selected.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold dark:text-white text-gray-900">{selected.full_name || '—'}</p>
                <p className="text-xs dark:text-gray-400 text-gray-500">{selected.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: selected.is_banned ? '✅ Unban User' : '🚫 Ban User', action: selected.is_banned ? 'unban' : 'ban', danger: !selected.is_banned },
                { label: selected.is_verified ? '❌ Remove Verify' : '✅ Verify User', action: selected.is_verified ? 'unverify' : 'verify' },
                { label: '👑 Grant VIP', action: 'grant_vip' },
                { label: '💕 Grant Premium', action: 'grant_premium' },
                { label: '🔓 Revoke Plan', action: 'revoke_sub' },
                { label: (selected.role === 'admin' || selected.role === 'superadmin') ? '👤 Make User' : '🛡️ Make Admin', action: (selected.role === 'admin' || selected.role === 'superadmin') ? 'make_user' : 'make_admin' },
              ].map(btn => (
                <button key={btn.action} disabled={actionLoading}
                  onClick={() => doAction(btn.action, selected.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${btn.danger ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 hover:dark:bg-white/10 hover:bg-gray-200 border dark:border-white/8 border-gray-200'}`}>
                  {actionLoading ? '...' : btn.label}
                </button>
              ))}
            </div>

            <button onClick={() => setSelected(null)} className="w-full mt-4 py-2.5 rounded-xl text-sm dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors">
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
