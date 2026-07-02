import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ScrollText, Search, Filter, Download, User, Shield, Settings, CreditCard, Flag, Car, ShoppingBag, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AuditLog {
  id: string; action: string; actor: string; actorRole: string; actorAvatar: string
  target: string; details: string; timestamp: string
  category: 'user' | 'payment' | 'content' | 'system' | 'safety' | 'ride' | 'marketplace'
  severity: 'info' | 'warning' | 'critical'
}

const categoryIcons: Record<string, React.ElementType> = {
  user: User, payment: CreditCard, content: Flag, system: Settings, safety: Shield, ride: Car, marketplace: ShoppingBag
}
const severityColors = {
  info:     'bg-blue-500/15 text-blue-400 border-blue-500/25',
  warning:  'bg-amber-500/15 text-amber-500 border-amber-500/25',
  critical: 'bg-red-500/15 text-red-500 border-red-500/25',
}
const categoryColors: Record<string, string> = {
  user:        'bg-pink-500/15 text-brand-pink',
  payment:     'bg-emerald-500/15 text-emerald-500',
  content:     'bg-purple-500/15 text-brand-purple',
  system:      'bg-blue-500/15 text-blue-400',
  safety:      'bg-amber-500/15 text-amber-500',
  ride:        'bg-fuchsia-500/15 text-fuchsia-400',
  marketplace: 'bg-violet-500/15 text-violet-400',
}

function inferCategory(action: string): AuditLog['category'] {
  const a = action.toLowerCase()
  if (a.includes('pay') || a.includes('subscription') || a.includes('momo')) return 'payment'
  if (a.includes('ride') || a.includes('driver')) return 'ride'
  if (a.includes('market') || a.includes('product') || a.includes('listing')) return 'marketplace'
  if (a.includes('report') || a.includes('ban') || a.includes('suspend') || a.includes('safety')) return 'safety'
  if (a.includes('post') || a.includes('content') || a.includes('video') || a.includes('stream')) return 'content'
  if (a.includes('user') || a.includes('profile')) return 'user'
  return 'system'
}
function inferSeverity(action: string): AuditLog['severity'] {
  const a = action.toLowerCase()
  if (a.includes('ban') || a.includes('delete') || a.includes('reject')) return 'critical'
  if (a.includes('suspend') || a.includes('warn') || a.includes('flag')) return 'warning'
  return 'info'
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, target, metadata, created_at, user_id, profiles:user_id(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      const mapped: AuditLog[] = data.map((l: any) => ({
        id: l.id,
        action: l.action,
        actor: l.profiles?.full_name || 'System',
        actorRole: l.metadata?.actor_role || 'admin',
        actorAvatar: l.profiles?.avatar_url || '',
        target: l.target || '—',
        details: l.metadata?.details || '',
        timestamp: new Date(l.created_at).toLocaleString(),
        category: inferCategory(l.action),
        severity: inferSeverity(l.action),
      }))
      setLogs(mapped)
    }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const filtered = logs.filter(l => {
    const matchFilter = filter === 'all' || l.category === filter || l.severity === filter
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase()) || l.target.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const exportCsv = () => {
    const header = ['Action', 'Actor', 'Target', 'Category', 'Severity', 'Timestamp']
    const rows = filtered.map(l => [l.action, l.actor, l.target, l.category, l.severity, l.timestamp])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Audit Logs</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Complete trail of all admin actions on the platform</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all">
          <Download className="w-3.5 h-3.5" /> Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Actions', value: logs.length.toString(),                                    color: 'from-pink-500 to-rose-600' },
          { label: 'Critical',      value: logs.filter(l => l.severity === 'critical').length.toString(), color: 'from-red-500 to-rose-600' },
          { label: 'Warnings',      value: logs.filter(l => l.severity === 'warning').length.toString(),  color: 'from-amber-500 to-orange-600' },
          { label: 'Info',          value: logs.filter(l => l.severity === 'info').length.toString(),     color: 'from-blue-500 to-indigo-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <ScrollText className="w-4 h-4 text-white" />
            </div>
            <p className="font-display font-black text-2xl dark:text-white text-gray-900">{s.value}</p>
            <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, actors, targets..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
          {['all', 'critical', 'warning', 'info', 'user', 'payment', 'system', 'safety'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand-pink animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 dark:text-gray-500 text-gray-400 text-sm">No audit log entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-white/5 border-gray-100">
                  {['Action', 'Actor', 'Target', 'Category', 'Severity', 'Timestamp'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const CatIcon = categoryIcons[l.category]
                  return (
                    <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b dark:border-white/4 border-gray-50 hover:dark:bg-white/2 hover:bg-pink-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold dark:text-white text-gray-900">{l.action}</p>
                        {l.details && <p className="text-[10px] dark:text-gray-500 text-gray-400 max-w-[200px] truncate">{l.details}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold dark:text-white text-gray-900">{l.actor}</p>
                          <p className="text-[9px] dark:text-gray-500 text-gray-400 capitalize">{l.actorRole.replace('_', ' ')}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs dark:text-gray-300 text-gray-700 max-w-[120px] truncate">{l.target}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${categoryColors[l.category]}`}>
                          <CatIcon className="w-2.5 h-2.5" /> {l.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityColors[l.severity]}`}>{l.severity}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] dark:text-gray-400 text-gray-500 whitespace-nowrap">{l.timestamp}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
