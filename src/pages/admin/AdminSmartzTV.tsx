import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tv, Eye, CheckCircle, XCircle, Play, Users, Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Video {
  id: string; title: string; creator: string; creatorAvatar: string
  category: string; views: string; type: 'live' | 'upload'
  status: 'pending' | 'approved' | 'rejected' | 'live'; thumbnail: string; submitted: string
}

const statusColors = {
  pending:  'bg-amber-500/15 text-amber-500 border-amber-500/25',
  approved: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
  rejected: 'bg-red-500/15 text-red-500 border-red-500/25',
  live:     'bg-pink-500/15 text-brand-pink border-pink-500/25',
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminSmartzTV() {
  const [list, setList] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [totalViews, setTotalViews] = useState(0)
  const [creatorCount, setCreatorCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchStreams = async () => {
    setLoading(true)
    // Fetch from livestreams (no direct FK on creator_id, so profiles join is done separately)
    const { data: rows, error } = await supabase
      .from('livestreams')
      .select('id, title, category, thumbnail_url, viewer_count, status, moderation_status, created_at, creator_id')
      .order('created_at', { ascending: false })
      .limit(60)

    if (!error && rows) {
      // Resolve creator profiles separately
      const creatorIds = [...new Set(rows.map((r: any) => r.creator_id).filter(Boolean))]
      let profileMap: Record<string, any> = {}
      if (creatorIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', creatorIds)
        if (profiles) profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]))
      }
      const data = rows
      const mapped: Video[] = data.map((v: any) => {
        const profile = profileMap[v.creator_id] || null
        const isLive = v.status === 'live'
        // Use dedicated moderation_status column; default to 'approved' for live streams
        const modStatus = isLive ? 'live' : ((['pending', 'approved', 'rejected'].includes(v.moderation_status) ? v.moderation_status : 'approved') as Video['status'])
        return {
          id: String(v.id),
          title: v.title || 'Untitled Stream',
          creator: profile?.full_name || 'Unknown Creator',
          creatorAvatar: profile?.avatar_url || '',
          category: v.category || 'General',
          views: (v.viewer_count || 0).toLocaleString(),
          type: isLive ? 'live' : 'upload',
          status: modStatus,
          thumbnail: v.thumbnail_url || '📺',
          submitted: isLive ? 'Live now' : timeAgo(v.created_at),
        }
      })
      setList(mapped)
      setTotalViews(data.reduce((sum: number, v: any) => sum + (v.viewer_count || 0), 0))
      setCreatorCount(new Set(data.map((v: any) => v.creator_id)).size)
    }
    setLoading(false)
  }

  useEffect(() => { fetchStreams() }, [])

  const filtered = list.filter(v => {
    const matchFilter = filter === 'all' || v.status === filter
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.creator.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setList(prev => prev.map(v => v.id === id ? { ...v, status } : v))
    // Write to moderation_status, never to the lifecycle status column
    await supabase.from('livestreams').update({ moderation_status: status }).eq('id', id)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">SmartzTV</h1>
        <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Moderate videos, manage creators, and monitor live streams</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Videos',  value: list.length.toString(), icon: Tv,   color: 'from-pink-500 to-rose-600' },
          { label: 'Live Now',      value: list.filter(v => v.status === 'live').length.toString(), icon: Play, color: 'from-red-500 to-rose-600' },
          { label: 'Total Views',   value: totalViews.toLocaleString(), icon: Eye, color: 'from-purple-500 to-violet-600' },
          { label: 'Creators',      value: creatorCount.toLocaleString(), icon: Users, color: 'from-fuchsia-500 to-pink-600' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="font-display font-black text-2xl dark:text-white text-gray-900">{s.value}</p>
              <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos or creators..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'live', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-pink animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 dark:text-gray-500 text-gray-400 text-sm">No videos found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
              <div className="relative h-32 dark:bg-white/5 bg-gray-50 flex items-center justify-center text-5xl border-b dark:border-white/5 border-gray-100">
                {v.thumbnail}
                {v.status === 'live' && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold dark:text-white text-gray-900 mb-1 line-clamp-1">{v.title}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] dark:text-gray-300 text-gray-700 font-semibold">{v.creator}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] dark:text-gray-400 text-gray-500 flex items-center gap-1"><Eye className="w-3 h-3" /> {v.views}</span>
                    <span className="text-[10px] dark:bg-white/5 bg-gray-100 px-1.5 py-0.5 rounded dark:text-gray-400 text-gray-600">{v.category}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[v.status]}`}>{v.status}</span>
                </div>
                {v.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(v.id, 'approved')} className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => updateStatus(v.id, 'rejected')} className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {v.status !== 'pending' && (
                  <button className="w-full py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1 hover:text-brand-pink transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
