import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Ban, CheckCircle, Crown, Zap, MoreVertical, RefreshCw,
  Shield, ShieldCheck, ShieldAlert, User, UserX, Star, X, ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface AppUser {
  id: number
  auth_id: string | null
  email: string
  full_name: string | null
  role: string
  email_verified: boolean
  subscription_tier: string | null
  is_banned: boolean
  is_verified: boolean
  created_at: string
  country: string | null
  avatar_url?: string | null
}

const ALL_ROLES = [
  { value: 'user',       label: 'User',       icon: User,        color: 'dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-600 dark:border-white/8 border-gray-200' },
  { value: 'support',    label: 'Support',    icon: ShieldCheck,  color: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
  { value: 'moderator',  label: 'Moderator',  icon: Shield,       color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  { value: 'admin',      label: 'Admin',      icon: ShieldAlert,  color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { value: 'ceo',        label: 'CEO',        icon: Star,         color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'superadmin', label: 'Super Admin',icon: Crown,        color: 'bg-red-500/10 text-red-500 border-red-500/20' },
]

function RoleBadge({ role }: { role: string }) {
  const def = ALL_ROLES.find(r => r.value === role) ?? ALL_ROLES[0]
  const Icon = def.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${def.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {def.label}
    </span>
  )
}

function TierBadge({ tier }: { tier: string | null }) {
  if (tier === 'vip')     return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center gap-1"><Crown className="w-2.5 h-2.5" />VIP</span>
  if (tier === 'premium') return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500/15 text-pink-500 border border-pink-500/25 flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Premium</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-500">Free</span>
}

export default function AdminUsers() {
  const { role: myRole } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'banned' | 'verified' | 'vip' | 'premium' | 'admins' | 'verification_requests'>('all')
  const [verificationRequests, setVerificationRequests] = useState<any[]>([])
  const [verifyReqLoading, setVerifyReqLoading] = useState(false)
  const [selected, setSelected] = useState<AppUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ label: string; action: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const isSuperAdmin = myRole === 'superadmin'

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUsers = async () => {
    setLoading(true)
    let q = supabase.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (search) q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    if (filter === 'banned')  q = q.eq('is_banned', true)
    if (filter === 'verified') q = q.eq('is_verified', true)
    if (filter === 'vip')     q = q.eq('subscription_tier', 'vip')
    if (filter === 'premium') q = q.eq('subscription_tier', 'premium')
    if (filter === 'admins')  q = q.in('role', ['admin', 'superadmin', 'moderator', 'support', 'ceo'])
    const { data, count } = await q.limit(100)

    // Hydrate avatar_url from profiles via auth_id
    let rows = (data || []) as AppUser[]
    const authIds = rows.map(u => u.auth_id).filter(Boolean) as string[]
    if (authIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', authIds)
      const profMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p.avatar_url]))
      rows = rows.map(u => ({ ...u, avatar_url: u.auth_id ? (profMap[u.auth_id] ?? null) : null }))
    }

    setUsers(rows)
    setTotal(count || 0)
    setLoading(false)
  }

  const fetchVerificationRequests = async () => {
    setVerifyReqLoading(true)
    const { data } = await supabase
      .from('verification_requests')
      .select('id, user_id, status, submitted_at, notes, profiles(full_name, avatar_url, email:id)')
      .order('submitted_at', { ascending: false })
      .limit(100)
    setVerificationRequests(data || [])
    setVerifyReqLoading(false)
  }

  useEffect(() => {
    if (filter === 'verification_requests') fetchVerificationRequests()
    else fetchUsers()
  }, [search, filter])

  const doAction = async (action: string, user: AppUser) => {
    setActionLoading(true)
    try {
      const userUpdates: Record<string, Record<string, string | boolean | null>> = {
        ban:           { is_banned: true },
        unban:         { is_banned: false },
        verify:        { is_verified: true, email_verified: true },
        unverify:      { is_verified: false },
        grant_vip:     { subscription_tier: 'vip' },
        grant_premium: { subscription_tier: 'premium' },
        revoke_sub:    { subscription_tier: null },
      }
      if (userUpdates[action]) {
        const { error } = await supabase.from('users').update(userUpdates[action]).eq('id', user.id)
        if (error) throw error
        showToast(`User updated successfully`)
      }
    } catch {
      showToast('Action failed. Please try again.', false)
    }
    await fetchUsers()
    setSelected(null)
    setConfirmAction(null)
    setActionLoading(false)
  }

  const approveVerification = async (requestId: number, userId: string) => {
    try {
      await Promise.all([
        supabase.from('profiles').update({ is_verified: true }).eq('id', userId),
        supabase.from('verification_requests').update({ status: 'approved' }).eq('id', requestId),
      ])
      showToast('User verified successfully')
      fetchVerificationRequests()
    } catch {
      showToast('Action failed.', false)
    }
  }

  const rejectVerification = async (requestId: number) => {
    try {
      await supabase.from('verification_requests').update({ status: 'rejected' }).eq('id', requestId)
      showToast('Request rejected')
      fetchVerificationRequests()
    } catch {
      showToast('Action failed.', false)
    }
  }

  const changeRole = async (newRole: string, user: AppUser) => {
    if (newRole === user.role) { setShowRolePicker(false); return }
    // Prevent non-superadmins from assigning superadmin
    if (newRole === 'superadmin' && !isSuperAdmin) {
      showToast('Only superadmins can assign the superadmin role.', false)
      setShowRolePicker(false)
      return
    }
    setActionLoading(true)
    try {
      const { error: usersErr } = await supabase.from('users').update({ role: newRole }).eq('id', user.id)
      if (usersErr) throw usersErr
      if (user.auth_id) {
        await supabase.from('profiles').update({ role: newRole }).eq('id', user.auth_id)
      }
      showToast(`Role changed to ${newRole}`)
    } catch {
      showToast('Role change failed.', false)
    }
    await fetchUsers()
    setShowRolePicker(false)
    setSelected(null)
    setActionLoading(false)
  }

  const stats = [
    { label: 'Total Users', value: total, color: 'text-brand-pink' },
    { label: 'Admins',   value: users.filter(u => ['admin','superadmin','moderator','support','ceo'].includes(u.role)).length, color: 'text-orange-500' },
    { label: 'Banned',   value: users.filter(u => u.is_banned).length, color: 'text-red-500' },
    { label: 'Verified', value: users.filter(u => u.is_verified).length, color: 'text-emerald-500' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium ${
              toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">User Management</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-0.5">Manage all {total} registered users</p>
        </div>
        <button onClick={fetchUsers} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-200">
            <p className={`font-display font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all','admins','banned','verified','vip','premium','verification_requests'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {f === 'verification_requests' ? '🛡 Verify Requests' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Requests list */}
      {filter === 'verification_requests' ? (
        <div className="space-y-3">
          {verifyReqLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-pink" />
            </div>
          ) : verificationRequests.length === 0 ? (
            <div className="text-center py-12 dark:text-gray-500 text-gray-400 text-sm">No verification requests</div>
          ) : (
            verificationRequests.map((req: any) => {
              const prof = req.profiles as any
              const name = prof?.full_name || 'Unknown'
              const avatar = prof?.avatar_url
              return (
                <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                      {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold dark:text-white text-gray-900 text-sm truncate">{name}</p>
                      <p className="text-xs dark:text-gray-500 text-gray-400">{new Date(req.submitted_at).toLocaleDateString()}</p>
                      {req.notes && <p className="text-xs dark:text-gray-400 text-gray-600 mt-1 italic">"{req.notes}"</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                      req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>{req.status}</span>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => approveVerification(req.id, req.user_id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                        ✅ Approve
                      </button>
                      <button onClick={() => rejectVerification(req.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all">
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })
          )}
        </div>
      ) : (
      /* Table */
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
                        {u.auth_id ? (
                          <Link to={`/app/profile/${u.auth_id}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 group min-w-0">
                            <div className="w-9 h-9 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-brand-pink/40 transition-all">
                              {u.avatar_url
                                ? <img src={u.avatar_url} alt={u.full_name || u.email} className="w-full h-full object-cover" />
                                : (u.full_name || u.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold dark:text-white text-gray-900 truncate text-sm group-hover:text-brand-pink transition-colors flex items-center gap-1">
                                {u.full_name || '—'} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                              </p>
                              <p className="text-xs dark:text-gray-500 text-gray-400 truncate">{u.email}</p>
                            </div>
                          </Link>
                        ) : (
                          <>
                            <div className="w-9 h-9 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                              {u.avatar_url
                                ? <img src={u.avatar_url} alt={u.full_name || u.email} className="w-full h-full object-cover" />
                                : (u.full_name || u.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold dark:text-white text-gray-900 truncate text-sm">{u.full_name || '—'}</p>
                              <p className="text-xs dark:text-gray-500 text-gray-400 truncate">{u.email}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><RoleBadge role={u.role || 'user'} /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><TierBadge tier={u.subscription_tier} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs dark:text-gray-400 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelected(u); setShowRolePicker(false); setConfirmAction(null) }}
                        className="p-1.5 rounded-lg hover:dark:bg-white/8 hover:bg-gray-100 transition-colors dark:text-gray-400 text-gray-500 hover:text-brand-pink">
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
      )}

      {/* Action modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => { setSelected(null); setShowRolePicker(false); setConfirmAction(null) }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">

              {/* User header */}
              <div className="flex items-center gap-3 mb-5">
                {selected.auth_id ? (
                  <Link to={`/app/profile/${selected.auth_id}`} target="_blank" rel="noopener noreferrer" className="group flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-lg overflow-hidden ring-2 ring-transparent group-hover:ring-brand-pink/50 transition-all">
                      {selected.avatar_url
                        ? <img src={selected.avatar_url} alt={selected.full_name || selected.email} className="w-full h-full object-cover" />
                        : (selected.full_name || selected.email || '?')[0].toUpperCase()}
                    </div>
                  </Link>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
                    {selected.avatar_url
                      ? <img src={selected.avatar_url} alt={selected.full_name || selected.email} className="w-full h-full object-cover" />
                      : (selected.full_name || selected.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {selected.auth_id ? (
                    <Link to={`/app/profile/${selected.auth_id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 font-bold dark:text-white text-gray-900 hover:text-brand-pink transition-colors truncate">
                      {selected.full_name || '—'} <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
                    </Link>
                  ) : (
                    <p className="font-bold dark:text-white text-gray-900 truncate">{selected.full_name || '—'}</p>
                  )}
                  <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{selected.email}</p>
                </div>
                <RoleBadge role={selected.role || 'user'} />
              </div>

              {/* Role picker */}
              {showRolePicker ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold dark:text-gray-300 text-gray-700 uppercase tracking-widest">Select Role</p>
                    <button onClick={() => setShowRolePicker(false)} className="dark:text-gray-500 text-gray-400 hover:text-brand-pink">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_ROLES.map(r => {
                      const Icon = r.icon
                      const isCurrent = (selected.role || 'user') === r.value
                      const isDisabled = r.value === 'superadmin' && !isSuperAdmin
                      return (
                        <button key={r.value}
                          disabled={isCurrent || isDisabled || actionLoading}
                          onClick={() => changeRole(r.value, selected)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            isCurrent
                              ? `${r.color} ring-2 ring-offset-1 dark:ring-offset-[#1A1228] ring-current opacity-80 cursor-default`
                              : isDisabled
                              ? 'dark:bg-white/3 bg-gray-50 dark:text-gray-600 text-gray-300 border-transparent cursor-not-allowed'
                              : `${r.color} hover:scale-[1.02] active:scale-[0.98] cursor-pointer`
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{r.label}</span>
                          {isCurrent && <span className="ml-auto text-[9px] opacity-60">current</span>}
                          {isDisabled && <span className="ml-auto text-[9px] opacity-50">locked</span>}
                        </button>
                      )
                    })}
                  </div>
                  {!isSuperAdmin && (
                    <p className="text-[10px] dark:text-gray-600 text-gray-400 text-center">Only superadmins can assign the superadmin role</p>
                  )}
                </div>
              ) : confirmAction ? (
                /* Confirm destructive action */
                <div className="space-y-4">
                  <p className="text-sm dark:text-gray-300 text-gray-700 text-center">
                    Are you sure you want to <strong>{confirmAction.label.replace(/^[^ ]+ /, '')}</strong> this user?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setConfirmAction(null)}
                      className="py-2.5 rounded-xl text-xs font-semibold dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700">
                      Cancel
                    </button>
                    <button disabled={actionLoading} onClick={() => doAction(confirmAction.action, selected)}
                      className="py-2.5 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">
                      {actionLoading ? '…' : 'Confirm'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Main actions grid */
                <div className="space-y-3">
                  {/* Role management — primary action */}
                  <button onClick={() => setShowRolePicker(true)}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-opacity">
                    <Shield className="w-4 h-4" />
                    Manage Role
                    <span className="ml-auto text-xs opacity-70">currently: {selected.role || 'user'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: selected.is_verified ? '❌ Remove Verify' : '✅ Verify User', action: selected.is_verified ? 'unverify' : 'verify', danger: false },
                      { label: '👑 Grant VIP', action: 'grant_vip', danger: false },
                      { label: '💕 Grant Premium', action: 'grant_premium', danger: false },
                      { label: '🔓 Revoke Plan', action: 'revoke_sub', danger: false },
                      { label: selected.is_banned ? '✅ Unban User' : '🚫 Ban User', action: selected.is_banned ? 'unban' : 'ban', danger: !selected.is_banned },
                    ].map(btn => (
                      <button key={btn.action} disabled={actionLoading}
                        onClick={() => btn.danger ? setConfirmAction(btn) : doAction(btn.action, selected)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                          btn.danger
                            ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                            : 'dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 hover:dark:bg-white/10 hover:bg-gray-200 dark:border-white/8 border-gray-200'
                        }`}>
                        {actionLoading ? '…' : btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => { setSelected(null); setShowRolePicker(false); setConfirmAction(null) }}
                className="w-full mt-4 py-2.5 rounded-xl text-sm dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors flex items-center justify-center gap-1">
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
