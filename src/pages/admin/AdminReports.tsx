import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Search, Eye, Ban } from 'lucide-react'
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

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  reviewed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  dismissed: 'bg-gray-500/10 dark:text-gray-400 text-gray-500 dark:border-white/8 border-gray-200',
  actioned: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Report | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchReports = async () => {
    setLoading(true)
    let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    const { data } = await q.limit(100)
    setReports(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [statusFilter])

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

  const filtered = reports.filter(r =>
    !search || r.reason.toLowerCase().includes(search.toLowerCase()) || String(r.reporter_id).includes(search) || String(r.reported_user_id).includes(search)
  )

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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..."
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
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold dark:text-white text-gray-900 text-sm capitalize">{r.reason.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor[r.status]}`}>{r.status}</span>
                  </div>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">
                    Reporter: <span className="font-mono">#{r.reporter_id}</span> → Reported: <span className="font-mono">#{r.reported_user_id}</span>
                  </p>
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
              <div className="flex justify-between"><span className="dark:text-gray-400 text-gray-500">Reason</span><span className="font-semibold dark:text-white text-gray-900 capitalize">{selected.reason.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between"><span className="dark:text-gray-400 text-gray-500">Reporter</span><span className="font-mono dark:text-white text-gray-900">#{selected.reporter_id}</span></div>
              <div className="flex justify-between"><span className="dark:text-gray-400 text-gray-500">Reported</span><span className="font-mono dark:text-white text-gray-900">#{selected.reported_user_id}</span></div>
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
