import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tv, Eye, CheckCircle, XCircle, Play, Users, Search, Loader2,
  Plus, Edit2, Trash2, Share2, UserPlus, Radio, X, Save,
  ExternalLink, Filter, RefreshCw, Crown, Globe
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Stream {
  id: string; title: string; creator: string; creatorId: string; creatorAvatar: string
  category: string; views: string; type: 'live' | 'upload'
  status: 'pending' | 'approved' | 'rejected' | 'live'
  thumbnail: string; submitted: string; description?: string; scheduledAt?: string
  isAdminCreated?: boolean; invitedCreator?: string
  isAdminBroadcast?: boolean
}

interface UserResult {
  id: string; full_name: string; avatar_url?: string; email?: string
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

/* ── Edit Modal ───────────────────────────────────────────────────────── */
function EditStreamModal({ stream, onClose, onSave }: {
  stream: Stream; onClose: () => void; onSave: (id: string, data: any) => void
}) {
  const [title, setTitle] = useState(stream.title)
  const [category, setCategory] = useState(stream.category)
  const [description, setDescription] = useState(stream.description || '')
  const [thumbnail, setThumbnail] = useState(stream.thumbnail)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(stream.id, { title, category, description, thumbnail_url: thumbnail })
    setSaving(false)
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100">
          <h2 className="font-bold dark:text-white text-gray-900 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-brand-pink" /> Edit Stream
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
            <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none">
              {['Music','Comedy','Tech','Fashion','Sports','Food','Education','Live'].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Thumbnail URL</label>
            <input value={thumbnail} onChange={e => setThumbnail(e.target.value)} placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className="w-full py-2.5 rounded-xl bg-love-gradient text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Create Stream Modal ──────────────────────────────────────────────── */
function CreateStreamModal({ onClose, onCreate }: {
  onClose: () => void; onCreate: (data: any) => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Music')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [scheduled, setScheduled] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) return
    setCreating(true)
    await onCreate({ title: title.trim(), category, description, thumbnail_url: thumbnail || null, scheduled_at: scheduled || null })
    setCreating(false)
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100">
          <h2 className="font-bold dark:text-white text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-pink" /> Setup New Stream
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
            <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Stream Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter stream title"
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none">
                {['Music','Comedy','Tech','Fashion','Sports','Food','Education','Live'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Schedule (optional)</label>
              <input type="datetime-local" value={scheduled} onChange={e => setScheduled(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Stream description…"
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Thumbnail URL</label>
            <input value={thumbnail} onChange={e => setThumbnail(e.target.value)} placeholder="https://…"
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <button onClick={handleCreate} disabled={!title.trim() || creating}
            className="w-full py-2.5 rounded-xl bg-love-gradient text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? 'Creating…' : 'Create Stream'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Invite Creator Modal ─────────────────────────────────────────────── */
function InviteModal({ streamId, streamTitle, onClose }: {
  streamId: string; streamTitle: string; onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [invited, setInvited] = useState<string | null>(null)

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const { data } = await supabase.from('profiles').select('id, full_name, avatar_url')
      .ilike('full_name', `%${q}%`).limit(8)
    setResults(data || [])
    setSearching(false)
  }

  const handleInvite = async (user: UserResult) => {
    await supabase.from('livestreams').update({ invited_creator_id: user.id }).eq('id', streamId)
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'stream_invite',
      message: `You've been invited to stream: "${streamTitle}"`,
    }).then(() => {})
    setInvited(user.full_name)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100">
          <h2 className="font-bold dark:text-white text-gray-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand-pink" /> Invite Creator
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
            <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {invited ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-bold dark:text-white text-gray-900">Invited!</p>
              <p className="text-sm dark:text-gray-400 text-gray-500">{invited} has been notified</p>
              <button onClick={onClose} className="mt-3 px-5 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold">Close</button>
            </div>
          ) : (
            <>
              <p className="text-xs dark:text-gray-400 text-gray-500">Invite a creator to go live for: <strong className="dark:text-white text-gray-900">{streamTitle}</strong></p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
                <input value={query} onChange={e => { setQuery(e.target.value); search(e.target.value) }}
                  placeholder="Search users by name…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none" />
              </div>
              {searching && <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-brand-pink" /></div>}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {results.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full dark:bg-white/10 bg-gray-100 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                      {u.avatar_url ? <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" /> : '👤'}
                    </div>
                    <span className="flex-1 text-sm dark:text-white text-gray-900 font-medium">{u.full_name}</span>
                    <button onClick={() => handleInvite(u)}
                      className="px-3 py-1 rounded-lg bg-love-gradient text-white text-xs font-bold">
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Live TV Player Panel ─────────────────────────────────────────────── */
function LiveTVPanel({ streams }: { streams: Stream[] }) {
  const liveStreams = streams.filter(s => s.status === 'live')
  const [selected, setSelected] = useState<Stream | null>(liveStreams[0] || null)

  if (liveStreams.length === 0) {
    return (
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-8 text-center">
        <div className="text-4xl mb-3">📺</div>
        <p className="font-bold dark:text-white text-gray-900 mb-1">No Live Streams</p>
        <p className="text-sm dark:text-gray-400 text-gray-500">No streams are live right now. Setup one above!</p>
      </div>
    )
  }

  return (
    <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b dark:border-white/6 border-gray-100">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <h3 className="font-bold text-sm dark:text-white text-gray-900">Live TV Player</h3>
        <span className="ml-auto text-xs dark:text-gray-400 text-gray-500">{liveStreams.length} live</span>
      </div>
      <div className="grid md:grid-cols-[1fr_200px] gap-0">
        {/* Main player */}
        <div className="relative bg-black min-h-[200px] sm:min-h-[280px] flex items-center justify-center">
          {selected?.thumbnail && selected.thumbnail.startsWith('http') ? (
            <img src={selected.thumbnail} alt={selected.title} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <span className="text-7xl">{selected?.thumbnail || '📺'}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white font-bold text-sm truncate">{selected?.title}</p>
            <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
              <Eye className="w-3 h-3" /> {selected?.views} viewers · {selected?.creator}
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-7 h-7 text-white fill-white" />
            </div>
          </div>
        </div>
        {/* Stream list */}
        <div className="border-l dark:border-white/6 border-gray-100 overflow-y-auto max-h-[280px]">
          {liveStreams.map(s => (
            <button key={s.id} onClick={() => setSelected(s)}
              className={`w-full flex items-center gap-2 p-3 text-left transition-colors border-b dark:border-white/5 border-gray-100 last:border-0 ${selected?.id === s.id ? 'dark:bg-white/8 bg-pink-50' : 'dark:hover:bg-white/5 hover:bg-gray-50'}`}>
              <div className="w-8 h-8 rounded-lg dark:bg-white/10 bg-gray-100 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                {s.thumbnail && s.thumbnail.startsWith('http')
                  ? <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                  : s.thumbnail || '📺'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold dark:text-white text-gray-900 truncate">{s.title}</p>
                <p className="text-[10px] dark:text-gray-400 text-gray-500 flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {s.views}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────────────── */
export default function AdminSmartzTV() {
  const { user } = useAuth()
  const [list, setList] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [totalViews, setTotalViews] = useState(0)
  const [creatorCount, setCreatorCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editStream, setEditStream] = useState<Stream | null>(null)
  const [inviteStream, setInviteStream] = useState<Stream | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [shareToast, setShareToast] = useState<string | null>(null)
  const [view, setView] = useState<'manage' | 'livetv'>('manage')

  const fetchStreams = async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('livestreams')
      .select('id, title, category, description, thumbnail_url, viewer_count, status, moderation_status, created_at, creator_id, is_admin_created, is_admin_broadcast, scheduled_at')
      .order('created_at', { ascending: false })
      .limit(80)

    if (!error && rows) {
      const creatorIds = [...new Set(rows.map((r: any) => r.creator_id).filter(Boolean))]
      let profileMap: Record<string, any> = {}
      if (creatorIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', creatorIds)
        if (profiles) profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]))
      }
      const mapped: Stream[] = rows.map((v: any) => {
        const profile = profileMap[v.creator_id] || null
        const isLive = v.status === 'live'
        const modStatus = isLive ? 'live' : (['pending','approved','rejected'].includes(v.moderation_status) ? v.moderation_status : 'approved') as Stream['status']
        return {
          id: String(v.id),
          title: v.title || 'Untitled Stream',
          creator: profile?.full_name || 'Unknown Creator',
          creatorId: String(v.creator_id || ''),
          creatorAvatar: profile?.avatar_url || '',
          category: v.category || 'General',
          views: (v.viewer_count || 0).toLocaleString(),
          type: isLive ? 'live' : 'upload',
          status: modStatus,
          thumbnail: v.thumbnail_url || '📺',
          submitted: isLive ? 'Live now' : (v.scheduled_at ? `Scheduled: ${new Date(v.scheduled_at).toLocaleDateString()}` : timeAgo(v.created_at)),
          description: v.description,
          isAdminCreated: v.is_admin_created,
          isAdminBroadcast: v.is_admin_broadcast ?? false,
        }
      })
      setList(mapped)
      setTotalViews(rows.reduce((sum: number, v: any) => sum + (v.viewer_count || 0), 0))
      setCreatorCount(new Set(rows.map((v: any) => v.creator_id)).size)
    }
    setLoading(false)
  }

  useEffect(() => { fetchStreams() }, [])

  // Realtime viewer count updates
  useEffect(() => {
    const sub = supabase.channel('admin-smartztv-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'livestreams' }, () => {
        fetchStreams()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'livestreams' }, () => {
        fetchStreams()
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  const filtered = list.filter(v => {
    const matchFilter = filter === 'all' || v.status === filter
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.creator.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setList(prev => prev.map(v => v.id === id ? { ...v, status } : v))
    await supabase.from('livestreams').update({ moderation_status: status }).eq('id', id)
  }

  const handleEdit = async (id: string, data: any) => {
    setList(prev => prev.map(v => v.id === id ? { ...v, title: data.title, category: data.category, description: data.description, thumbnail: data.thumbnail_url || v.thumbnail } : v))
    await supabase.from('livestreams').update(data).eq('id', id)
  }

  const handleCreate = async (data: any) => {
    const { error } = await supabase.from('livestreams').insert({
      ...data,
      creator_id: user?.id,
      status: 'pending',
      moderation_status: 'approved',
      is_admin_created: true,
      viewer_count: 0,
    })
    if (!error) fetchStreams()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('livestreams').delete().eq('id', deleteId)
    setList(prev => prev.filter(v => v.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
  }

  const handleToggleAdminBroadcast = async (stream: Stream) => {
    const next = !stream.isAdminBroadcast
    setList(prev => prev.map(v => v.id === stream.id ? { ...v, isAdminBroadcast: next } : v))
    await supabase.from('livestreams').update({ is_admin_broadcast: next }).eq('id', stream.id)
  }

  const handleShare = (stream: Stream) => {
    const url = `${window.location.origin}/app/smartztv`
    if (navigator.share) {
      navigator.share({ title: stream.title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShareToast(stream.title)
        setTimeout(() => setShareToast(null), 3000)
      })
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 relative">
      {/* Share toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-lg">
            Link copied for "{shareToast}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 flex items-center gap-2">
            <Tv className="w-6 h-6 text-brand-pink" /> SmartzTV
          </h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Manage streams, invite creators, monitor live</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView(v => v === 'manage' ? 'livetv' : 'manage')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${view === 'livetv' ? 'bg-red-500 text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 hover:text-brand-pink'}`}>
            {view === 'livetv' ? <><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live TV</> : <><Radio className="w-3.5 h-3.5" /> Live TV</>}
          </button>
          <button onClick={fetchStreams} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
            <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold">
            <Plus className="w-3.5 h-3.5" /> Setup Stream
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Streams', value: list.length.toString(),                       icon: Tv,    color: 'from-pink-500 to-rose-600' },
          { label: 'Live Now',      value: list.filter(v => v.status === 'live').length.toString(), icon: Play,  color: 'from-red-500 to-rose-600' },
          { label: 'Total Views',   value: totalViews.toLocaleString(),                  icon: Eye,   color: 'from-purple-500 to-violet-600' },
          { label: 'Creators',      value: creatorCount.toLocaleString(),                icon: Users, color: 'from-fuchsia-500 to-pink-600' },
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

      {/* Live TV view */}
      {view === 'livetv' && <LiveTVPanel streams={list} />}

      {/* Manage view */}
      {view === 'manage' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search streams or creators…"
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
            <div className="text-center py-20 dark:text-gray-500 text-gray-400 text-sm">
              No streams found.{' '}
              <button onClick={() => setShowCreate(true)} className="text-brand-pink font-semibold hover:underline">Setup one now →</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden group">
                  {/* Thumbnail */}
                  <div className="relative h-32 dark:bg-white/5 bg-gray-50 flex items-center justify-center text-5xl border-b dark:border-white/5 border-gray-100 overflow-hidden">
                    {v.thumbnail && v.thumbnail.startsWith('http')
                      ? <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                      : <span>{v.thumbnail}</span>}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {v.status === 'live' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                        </span>
                      )}
                      {v.isAdminCreated && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                          <Crown className="w-2.5 h-2.5" /> Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h4 className="text-sm font-bold dark:text-white text-gray-900 mb-1 line-clamp-1">{v.title}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      {v.creatorAvatar ? (
                        <img src={v.creatorAvatar} alt={v.creator} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full dark:bg-white/10 bg-gray-100 flex items-center justify-center text-[10px] flex-shrink-0">👤</div>
                      )}
                      <span className="text-[11px] dark:text-gray-300 text-gray-700 font-semibold truncate">{v.creator}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] dark:text-gray-400 text-gray-500 flex items-center gap-1"><Eye className="w-3 h-3" /> {v.views}</span>
                        <span className="text-[10px] dark:bg-white/5 bg-gray-100 px-1.5 py-0.5 rounded dark:text-gray-400 text-gray-600">{v.category}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[v.status]}`}>{v.status}</span>
                    </div>
                    <p className="text-[10px] dark:text-gray-500 text-gray-400 mb-3">{v.submitted}</p>

                    {/* Admin action buttons */}
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      <button onClick={() => setEditStream(v)} title="Edit"
                        className="flex items-center justify-center py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-blue-500 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setInviteStream(v)} title="Invite Creator"
                        className="flex items-center justify-center py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-purple-500 transition-colors">
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleShare(v)} title="Share"
                        className="flex items-center justify-center py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-emerald-500 transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(v.id)} title="Delete"
                        className="flex items-center justify-center py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Public TV broadcast toggle */}
                    <button
                      onClick={() => handleToggleAdminBroadcast(v)}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mb-2 transition-all border ${
                        v.isAdminBroadcast
                          ? 'bg-violet-500/15 text-violet-400 border-violet-500/30 hover:bg-violet-500/25'
                          : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 border-transparent hover:text-violet-500'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {v.isAdminBroadcast ? '📺 On Public TV' : 'Publish to Public TV'}
                    </button>

                    {v.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(v.id, 'approved')} className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => updateStatus(v.id, 'rejected')} className="flex-1 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => window.open('/app/smartztv', '_blank')}
                        className="w-full py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1 hover:text-brand-pink transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> View on TV
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-xs dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-6 text-center shadow-2xl">
              <div className="text-4xl mb-3">🗑️</div>
              <p className="font-bold dark:text-white text-gray-900 mb-1">Delete Stream?</p>
              <p className="text-sm dark:text-gray-400 text-gray-500 mb-5">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-300 text-gray-700">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-60">
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && <CreateStreamModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
        {editStream && <EditStreamModal stream={editStream} onClose={() => setEditStream(null)} onSave={handleEdit} />}
        {inviteStream && <InviteModal streamId={inviteStream.id} streamTitle={inviteStream.title} onClose={() => setInviteStream(null)} />}
      </AnimatePresence>
    </div>
  )
}
