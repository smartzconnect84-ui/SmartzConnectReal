import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Search, Eye, Ban } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface Report {
  id: number
  reporter_id: number
  reported_user_id: number
  reason: string
  description: string | null
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
  admin_note: string | null
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: number
  auth_id: string | null
  full_name: string | null
  email: string
  avatar_url?: string | null
}

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  reviewed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  dismissed: 'bg-gray-500/10 dark:text-gray-400 text-gray-500 dark:border-white/8 border-gray-200',
  actioned: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

function UserCell({ profile, userId }: { profile?: UserProfile; userId: number }) {
  if (!profile) {
    return <span className="font-mono text-xs dark:text-gray-400 text-gray-500">#{userId}</span>
  }
  const inner = (
    <div className="flex items-center gap-2 group">
      <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center text-white text-[10px] font-bold overflow-hidden flex-shrink-0 ring-2 ring-transparent group-hover:ring-brand-pink/40 transition-all">
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          : (profile.full_name || profile.email || '?')[0].toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold dark:text-white text-gray-900 truncate group-hover:text-brand-pink transition-colors">{profile.full_name || '—'}</p>
        <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate">{profile.email}</p>
      </div>
    </div>
  )
  if (!profile.auth_id) return inner
  return (
    <Link to={`/app/profile/${profile.auth_id}`} target="_blank" rel="noopener noreferrer">
      {inner}
    </Link>
  )
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [userMap, setUserMap] = useState<Map<number, UserProfile>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Report | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  /** Batch-fetch user profiles for all unique reporter/reported IDs */
  const hydrateUsers = useCallback(async (reportRows: Report[]) => {
    const ids = [...new Set([
      ...reportRows.map(r => r.reporter_id),
      ...reportRows.map(r => r.reported_user_id),
    ].filter(Boolean))]
    if (!ids.length) return

    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email, auth_id')
      .in('id', ids)

    // Fetch avatar_url from profiles via auth_id
    const authIds = (users || []).map((u: any) => u.auth_id).filter(Boolean)
    let avatarMap: Record<string, string> = {}
    if (authIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', authIds)
      avatarMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p.avatar_url ?? null]))
    }

    const map = new Map<number, UserProfile>()
    for (const u of (users || []) as any[]) {
      map.set(u.id, {
        id: u.id,
        auth_id: u.auth_id ?? null,
        full_name: u.full_name,
        email: u.email,
        avatar_url: u.auth_id ? (avatarMap[u.auth_id] ?? null) : null,
      })
    }
    setUserMap(map)
  }, [])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    const { data } = await q.limit(100)
    const rows = (data || []) as Report[]
    setReports(rows)
    await hydrateUsers(rows)
    setLoading(false)
  }, [statusFilter, hydrateUsers])

  useEffect(() => { fetchReports() }, [fetchReports])

  const updateStatus = async (id: number, status: string, adminNote?: string) => {
    setSaving(true)
    await supabase.from('reports').update({ status, admin_note: adminNote || null, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchReports()
    setSelected(null)
    setSaving(false)
  }

  const banUser = async (userId: number) => {
    await supabase.from('users').update({ is_banned: true }).eq('id', userId)
  }

  const filtered = reports.filter(r => {
    if (!search) return true
    const lower = search.toLowerCase()
    const reporter = userMap.get(r.reporter_id)
    const reported = userMap.get(r.reported_user_id)
    return (
      r.reason.toLowerCase().includes(lower) ||
      String(r.reporter_id).includes(search) ||
      String(r.reported_user_id).includes(search) ||
      reporter?.full_name?.toLowerCase().includes(lower) ||
      reporter?.email?.toLowerCase().includes(lower) ||
      reported?.full_name?.toLowerCase().includes(lower) ||
      reported?.email?.toLowerCase().includes(lower)
    )
  })

  const stats = [
    { label: 'Total', value: reports.length, color: 'text-brand-pink' },
    { label: 'Pending', value: reports.filter(r => r.status === 'pending').length, color: 'text-amber-500' },
    { label: 'Actioned', value: reports.filter(r => r.status === 'actioned').length, color: 'text-emerald-500' },
    { label: 'Dismissed', value: reports.filter(r => r.status === 'dismissed').length, color: 'text-gray-400' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Reports & Safety</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-0.5">Review user reports and take action</p>
        </div>
        <button onClick={fetchReports} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors">
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or reason..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'reviewed', 'actioned', 'dismissed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-brand-pink" /></div>
        ) : (
          <div className="divide-y dark:divide-white/4 divide-gray-100">
            {filtered.map(r => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-start gap-4 px-4 py-4 hover:dark:bg-white/2 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold dark:text-white text-gray-900 text-sm capitalize">{r.reason.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor[r.status]}`}>{r.status}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] dark:text-gray-500 text-gray-400 shrink-0">Reporter:</span>
                      <UserCell profile={userMap.get(r.reporter_id)} userId={r.reporter_id} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] dark:text-gray-500 text-gray-400 shrink-0">Reported:</span>
                      <UserCell profile={userMap.get(r.reported_user_id)} userId={r.reported_user_id} />
                    </div>
                  </div>
                  {r.description && <p className="text-xs dark:text-gray-500 text-gray-400 line-clamp-2">{r.description}</p>}
                  <p className="text-[10px] dark:text-gray-600 text-gray-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => { setSelected(r); setNote(r.admin_note || '') }}
                  className="p-1.5 rounded-lg hover:dark:bg-white/8 hover:bg-gray-100 transition-colors dark:text-gray-400 text-gray-500 hover:text-brand-pink flex-shrink-0">
                  <Eye className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 dark:text-gray-500 text-gray-400 text-sm">No reports found</div>}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">
            <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-4">Review Report #{selected.id}</h3>
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between items-center">
                <span className="dark:text-gray-400 text-gray-500">Reason</span>
                <span className="font-semibold dark:text-white text-gray-900 capitalize">{selected.reason.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="dark:text-gray-400 text-gray-500 shrink-0">Reporter</span>
                <UserCell profile={userMap.get(selected.reporter_id)} userId={selected.reporter_id} />
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="dark:text-gray-400 text-gray-500 shrink-0">Reported</span>
                <UserCell profile={userMap.get(selected.reported_user_id)} userId={selected.reported_user_id} />
              </div>
              {selected.description && (
                <div className="p-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs dark:text-gray-300 text-gray-700">{selected.description}</div>
              )}
            </div>
            <div className="mb-5">
              <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Admin Note</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Add a note about this report..."
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => updateStatus(selected.id, 'actioned', note)} disabled={saving}
                className="py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Action Taken
              </button>
              <button onClick={() => updateStatus(selected.id, 'dismissed', note)} disabled={saving}
                className="py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 border dark:border-white/8 border-gray-200 text-xs font-bold hover:dark:bg-white/10 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Dismiss
              </button>
              <button onClick={async () => { await banUser(selected.reported_user_id); await updateStatus(selected.id, 'actioned', `User #${selected.reported_user_id} banned. ${note}`) }} disabled={saving}
                className="py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1 col-span-2">
                <Ban className="w-3.5 h-3.5" /> Ban Reported User
              </button>
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-3 py-2 text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors">Cancel</button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
