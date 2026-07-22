/**
 * ScheduleManager — Admin broadcast scheduling for SmartzTV channels.
 * Allows admins to create, edit, and delete upcoming broadcast slots.
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, Trash2, Edit2, Clock, RefreshCw,
  Loader2, CheckCircle, X, Save, ChevronRight, Radio,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ScheduleEntry {
  id: string
  channel_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  category: string | null
  starts_at: string
  ends_at: string | null
  is_recurring: boolean
  recurrence: string | null
  broadcast_id: string | null
}

interface ScheduleManagerProps {
  channelId: string
  channelName?: string
}

const CATEGORIES = ['General', 'News', 'Music', 'Sports', 'Entertainment', 'Education', 'Comedy', 'Tech', 'Fashion', 'Kids']

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function localIso(iso?: string) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 3600000)
  // format for datetime-local input (no seconds)
  return d.toISOString().slice(0, 16)
}

interface ScheduleFormProps {
  initial?: Partial<ScheduleEntry>
  channelId: string
  onSave: () => void
  onCancel: () => void
}

function ScheduleForm({ initial, channelId, onSave, onCancel }: ScheduleFormProps) {
  const [title, setTitle]           = useState(initial?.title || '')
  const [description, setDesc]      = useState(initial?.description || '')
  const [category, setCategory]     = useState(initial?.category || 'General')
  const [startsAt, setStartsAt]     = useState(localIso(initial?.starts_at))
  const [endsAt, setEndsAt]         = useState(localIso(initial?.ends_at || undefined))
  const [broadcastId, setBroadcast] = useState(initial?.broadcast_id || '')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const save = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!startsAt)     { setError('Start time is required'); return }
    setSaving(true); setError('')

    const payload: any = {
      channel_id:   channelId,
      title:        title.trim(),
      description:  description.trim() || null,
      category:     category || null,
      starts_at:    new Date(startsAt).toISOString(),
      ends_at:      endsAt ? new Date(endsAt).toISOString() : null,
      broadcast_id: broadcastId.trim() || null,
      is_recurring: false,
    }

    let err
    if (initial?.id) {
      ;({ error: err } = await supabase.from('tv_schedules').update(payload).eq('id', initial.id))
    } else {
      ;({ error: err } = await supabase.from('tv_schedules').insert(payload))
    }

    setSaving(false)
    if (err) { setError(err.message); return }
    onSave()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#130e22] border border-violet-500/20 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-bold text-white">{initial?.id ? 'Edit Schedule' : 'New Broadcast Slot'}</p>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1 block">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Morning News Live"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50" />
        </div>

        <div>
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1 block">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full bg-[#1a1030] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1 block">YouTube Video ID</label>
          <input value={broadcastId} onChange={e => setBroadcast(e.target.value)} placeholder="e.g. dQw4w9WgXcQ"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 font-mono" />
        </div>

        <div>
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1 block">Start Time *</label>
          <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)}
            className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50" />
        </div>

        <div>
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1 block">End Time</label>
          <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)}
            className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50" />
        </div>

        <div className="col-span-2">
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1 block">Description</label>
          <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2}
            placeholder="What's happening in this broadcast?"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none" />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => void save()} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initial?.id ? 'Update' : 'Schedule'}
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-gray-400 hover:text-white text-sm font-semibold transition-colors">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </motion.div>
  )
}

export default function ScheduleManager({ channelId, channelName }: ScheduleManagerProps) {
  const [schedule, setSchedule]       = useState<ScheduleEntry[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState<ScheduleEntry | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [toast, setToast]             = useState('')

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 2500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tv_schedules')
      .select('*')
      .eq('channel_id', channelId)
      .gte('starts_at', new Date(Date.now() - 86400000).toISOString())  // last 24h
      .order('starts_at', { ascending: true })
      .limit(50)
    setSchedule((data || []) as ScheduleEntry[])
    setLoading(false)
  }, [channelId])

  useEffect(() => { void load() }, [load])

  const del = async (id: string) => {
    if (!confirm('Delete this scheduled broadcast?')) return
    setDeletingId(id)
    await supabase.from('tv_schedules').delete().eq('id', id)
    setDeletingId(null)
    showToast('Schedule deleted')
    void load()
  }

  const onSave = () => {
    setShowForm(false)
    setEditing(null)
    showToast(editing ? 'Schedule updated' : 'Broadcast scheduled')
    void load()
  }

  const now = Date.now()
  const upcoming = schedule.filter(s => new Date(s.starts_at).getTime() > now)
  const past     = schedule.filter(s => new Date(s.starts_at).getTime() <= now)

  return (
    <div className="space-y-4">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white text-sm font-semibold shadow-2xl">
            <CheckCircle className="w-4 h-4" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white">Broadcast Schedule</span>
          {channelName && <span className="text-xs text-gray-500">— {channelName}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" /> Schedule Broadcast
          </button>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {(showForm || editing) && (
          <ScheduleForm
            initial={editing || undefined}
            channelId={channelId}
            onSave={onSave}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Upcoming</p>
              {upcoming.map(s => (
                <div key={s.id}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Radio className="w-4.5 h-4.5 text-violet-400" style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.title}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {fmt(s.starts_at)}
                      {s.ends_at && <span> → {fmt(s.ends_at)}</span>}
                    </p>
                    {s.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-semibold">
                        {s.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { setEditing(s); setShowForm(false) }}
                      className="w-8 h-8 rounded-xl bg-white/6 hover:bg-white/12 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => void del(s.id)} disabled={deletingId === s.id}
                      className="w-8 h-8 rounded-xl bg-white/6 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50">
                      {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Recent / Past</p>
              {past.slice(-5).reverse().map(s => (
                <div key={s.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/2 border border-white/5 opacity-60">
                  <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 truncate">{s.title}</p>
                    <p className="text-[10px] text-gray-600">{fmt(s.starts_at)}</p>
                  </div>
                  <button onClick={() => void del(s.id)} disabled={deletingId === s.id}
                    className="w-7 h-7 rounded-lg hover:bg-red-500/15 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {schedule.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Calendar className="w-8 h-8 text-white/15" />
              <p className="text-sm text-white/30 font-medium">No broadcasts scheduled</p>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/25 text-violet-400 text-sm font-semibold hover:bg-violet-600/30 transition-colors">
                <Plus className="w-4 h-4" /> Schedule your first broadcast
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
