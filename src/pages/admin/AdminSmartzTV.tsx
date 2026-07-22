import { useState, useEffect, useRef, useCallback } from 'react'
import ImageUploader from '@/components/admin/ImageUploader'
import AdminPersonalStudio from '@/components/admin/AdminPersonalStudio'
import SmartzTVPlayer from '@/components/SmartzTVPlayer'
import StudioBroadcastModal from '@/components/admin/StudioBroadcastModal'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tv, Eye, CheckCircle, XCircle, Play, Users, Search, Loader2,
  Plus, Edit2, Trash2, Share2, UserPlus, Radio, X, Save,
  ExternalLink, Filter, RefreshCw, Crown, Globe, Mic, MicOff,
  Video, VideoOff, PhoneOff, Monitor, MonitorOff, Settings2,
  Copy, ChevronRight, UserX, Wifi, Code2, Info, MessageSquare,
  Layers, Calendar, Star, StarOff, Power, PowerOff, Signal,
  ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle2, Zap,
  BarChart3, ArrowRight, Antenna,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  Room, RoomEvent, Track, type LocalParticipant,
  type RemoteParticipant,
} from 'livekit-client'
import { notifyUser } from '@/lib/notify'

// ══════════════════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface TVChannel {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  cover_url: string | null
  description: string | null
  category: string
  /** YouTube Live video/broadcast ID for iframe embed */
  youtube_video_id: string | null
  /** YouTube channel ID — fallback embed for /live_stream */
  youtube_channel_id: string | null
  stream_key: string | null
  playback_url: string | null
  stream_status: 'idle' | 'active' | 'disconnected'
  is_active: boolean
  is_featured: boolean
  is_admin_broadcast: boolean
  display_order: number
  current_program: string | null
  viewer_count: number
  last_broadcast_at: string | null
  created_at: string
}

interface TVSchedule {
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
}

interface Stream {
  id: string; title: string; creator: string; creatorId: string; creatorAvatar: string
  category: string; views: string; type: 'live' | 'upload'
  status: 'pending' | 'approved' | 'rejected' | 'live'
  thumbnail: string; submitted: string; description?: string; scheduledAt?: string
  isAdminCreated?: boolean; invitedCreator?: string; isAdminBroadcast?: boolean
}

interface UserResult { id: string; full_name: string; avatar_url?: string }
interface BroadcastData { streamId: string; title: string }

const CATEGORIES = ['General', 'News', 'Music', 'Sports', 'Entertainment', 'Education', 'Comedy', 'Tech', 'Fashion', 'Food', 'Kids']

const statusColors: Record<string, string> = {
  pending:  'bg-amber-500/15 text-amber-500 border-amber-500/25',
  approved: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
  rejected: 'bg-red-500/15 text-red-500 border-red-500/25',
  live:     'bg-pink-500/15 text-brand-pink border-pink-500/25',
}

const streamStatusConfig = {
  idle:         { color: 'text-gray-400', bg: 'bg-gray-400/15 border-gray-400/25', dot: 'bg-gray-400', label: 'Idle' },
  active:       { color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/25', dot: 'bg-emerald-400 animate-pulse', label: 'Live' },
  disconnected: { color: 'text-amber-400', bg: 'bg-amber-400/15 border-amber-400/25', dot: 'bg-amber-400', label: 'Disconnected' },
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

// ══════════════════════════════════════════════════════════════════════════════
//  COPY FIELD helper
// ══════════════════════════════════════════════════════════════════════════════

function CopyField({ label, value, mono = true, secret = false }: {
  label: string; value: string; mono?: boolean; secret?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(!secret)

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/50 border border-white/10">
        {secret ? (
          <code className={`flex-1 text-[11px] font-mono text-green-400 truncate select-all`}>
            {show ? value : '••••••••••••••••••••••••••••'}
          </code>
        ) : (
          <code className={`flex-1 text-[11px] ${mono ? 'font-mono text-green-400' : 'text-white'} truncate select-all`}>{value}</code>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {secret && (
            <button onClick={() => setShow(s => !s)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-gray-400 text-[10px] font-bold transition-colors">
              {show ? '🙈' : '👁'}
            </button>
          )}
          <button onClick={copy}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  BROADCAST SETUP WIZARD MODAL (legacy stub — replaced by StudioBroadcastModal)
// ══════════════════════════════════════════════════════════════════════════════

function BroadcastSetupModal({ channel, onClose, onChannelUpdated }: {
  channel: TVChannel; onClose: () => void; onChannelUpdated: (ch: TVChannel) => void
}) {
  const [step, setStep] = useState<'overview' | 'creating' | 'ready'>(() =>
    channel.youtube_video_id ? 'ready' : 'overview'
  )
  // This legacy modal is superseded by StudioBroadcastModal; kept as a passthrough
  const [localChannel, setLocalChannel] = useState(channel)
  const sc = streamStatusConfig[localChannel.stream_status] || streamStatusConfig.idle
  const encoderConnected = localChannel.stream_status === 'active'
  const isPubliclyLive = encoderConnected && localChannel.is_active
  void step; void setStep  // suppress lint warnings on stub

  // Render: show YouTube stream info + quick Go Live / End Live controls
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#0A0714] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-gradient-to-r from-violet-900/30 to-red-900/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center overflow-hidden">
              {localChannel.logo_url
                ? <img src={localChannel.logo_url} alt={localChannel.name} className="w-full h-full object-cover" />
                : <Tv className="w-4 h-4 text-red-400" />}
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">{localChannel.name}</h2>
              <p className="text-[10px] text-gray-400">YouTube Live Broadcast</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status + viewer count */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${sc.bg} ${sc.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {encoderConnected ? 'LIVE' : localChannel.stream_status === 'disconnected' ? 'DISCONNECTED' : 'OFFLINE'}
            </div>
            {isPubliclyLive && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-red-500/15 text-red-400 border-red-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> PUBLIC — ON AIR
              </span>
            )}
            {localChannel.viewer_count > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-gray-300 bg-white/5 border border-white/10">
                <Eye className="w-3 h-3" /> {localChannel.viewer_count.toLocaleString()} watching
              </span>
            )}
          </div>

          {/* YouTube ID display */}
          {localChannel.youtube_video_id ? (
            <CopyField label="YouTube Video ID" value={localChannel.youtube_video_id} />
          ) : (
            <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80">
                No YouTube video ID set. Open <strong className="text-white">Broadcast Setup</strong> (full studio) to configure.
              </p>
            </div>
          )}

          {/* Go Live / End Live */}
          <div className="flex gap-2">
            {!localChannel.is_active ? (
              <button
                onClick={async () => {
                  const { error: dbErr } = await supabase.from('tv_channels').update({ is_active: true }).eq('id', localChannel.id)
                  if (!dbErr) { const u = { ...localChannel, is_active: true }; setLocalChannel(u); onChannelUpdated(u) }
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                <Radio className="w-3.5 h-3.5" /> Go Live
              </button>
            ) : (
              <button
                onClick={async () => {
                  const { error: dbErr } = await supabase.from('tv_channels').update({ is_active: false }).eq('id', localChannel.id)
                  if (!dbErr) { const u = { ...localChannel, is_active: false }; setLocalChannel(u); onChannelUpdated(u) }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-500/25 transition-colors">
                <PhoneOff className="w-3.5 h-3.5" /> End Live
              </button>
            )}
            <button onClick={() => window.open('/smartztv', '_blank')}
              className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-gray-500 text-center">
            Use <strong className="text-violet-400">Full Studio</strong> for encoder guides, scheduling, analytics and moderation.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  CREATE / EDIT CHANNEL MODAL
// ══════════════════════════════════════════════════════════════════════════════

function CreateEditChannelModal({ channel, onClose, onSave }: {
  channel?: TVChannel | null; onClose: () => void; onSave: (ch: TVChannel) => void
}) {
  const { user } = useAuth()
  const [name, setName] = useState(channel?.name || '')
  const [description, setDescription] = useState(channel?.description || '')
  const [category, setCategory] = useState(channel?.category || 'General')
  const [logoUrl, setLogoUrl] = useState(channel?.logo_url || '')
  const [coverUrl, setCoverUrl] = useState(channel?.cover_url || '')
  const [currentProgram, setCurrentProgram] = useState(channel?.current_program || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!channel

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true); setError('')
    try {
      const payload = {
        name: name.trim(),
        description: description || null,
        category,
        logo_url: logoUrl || null,
        cover_url: coverUrl || null,
        current_program: currentProgram || null,
      }

      if (isEdit) {
        const { data, error: err } = await supabase
          .from('tv_channels').update(payload).eq('id', channel!.id).select().single()
        if (err) throw err
        onSave(data as TVChannel)
      } else {
        const { data, error: err } = await supabase
          .from('tv_channels').insert({ ...payload, owner_id: user!.id, is_active: false, is_featured: false, display_order: 0 })
          .select().single()
        if (err) throw err
        onSave(data as TVChannel)
      }
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    }
    setSaving(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100 sticky top-0 dark:bg-[#0D0A14] bg-white z-10">
          <h2 className="font-bold dark:text-white text-gray-900 flex items-center gap-2">
            <Tv className="w-4 h-4 text-violet-400" />
            {isEdit ? 'Edit Channel' : 'Create Channel'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
            <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Channel Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SmartzTV News 24"
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-violet-500" />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Brief description of this channel…"
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none resize-none" />
          </div>

          {/* Current Program */}
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Current Programme (shown on player)</label>
            <input value={currentProgram} onChange={e => setCurrentProgram(e.target.value)}
              placeholder="e.g. Morning News • Sports Highlights…"
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none" />
          </div>

          {/* Logo */}
          <ImageUploader
            value={logoUrl || null}
            onChange={url => setLogoUrl(url || '')}
            folder="covers"
            label="Channel Logo"
            assetName={name || 'channel'}
          />

          {/* Cover */}
          <ImageUploader
            value={coverUrl || null}
            onChange={url => setCoverUrl(url || '')}
            folder="covers"
            label="Cover Image"
            assetName={name || 'channel'}
          />

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button onClick={handleSave} disabled={!name.trim() || saving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Channel'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  SCHEDULE MODAL
// ══════════════════════════════════════════════════════════════════════════════

function ScheduleModal({ channel, onClose }: { channel: TVChannel; onClose: () => void }) {
  const [schedules, setSchedules] = useState<TVSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', starts_at: '', ends_at: '', category: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('tv_schedules')
      .select('*').eq('channel_id', channel.id)
      .order('starts_at', { ascending: true })
    setSchedules((data as TVSchedule[]) || [])
    setLoading(false)
  }, [channel.id])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!form.title.trim() || !form.starts_at) return
    setSaving(true)
    const { error } = await supabase.from('tv_schedules').insert({
      channel_id: channel.id,
      title: form.title.trim(),
      description: form.description || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at || null,
      category: form.category || null,
    })
    if (!error) {
      setForm({ title: '', description: '', starts_at: '', ends_at: '', category: '' })
      setAdding(false)
      load()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('tv_schedules').delete().eq('id', id)
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) }
    catch { return iso }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100 flex-shrink-0">
          <h2 className="font-bold dark:text-white text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" /> Schedule — {channel.name}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setAdding(a => !a)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-500/15 text-violet-400 text-xs font-bold border border-violet-500/25 hover:bg-violet-500/25 transition-colors">
              <Plus className="w-3 h-3" /> Add
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
              <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden flex-shrink-0">
              <div className="p-4 border-b dark:border-white/6 border-gray-100 dark:bg-white/3 bg-gray-50 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Programme title *"
                    className="col-span-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none" />
                  <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                    className="px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 focus:outline-none" />
                  <input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                    placeholder="End time (optional)"
                    className="px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 focus:outline-none" />
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 focus:outline-none">
                    <option value="">Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description (optional)"
                    className="px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 focus:outline-none" />
                </div>
                <button onClick={handleAdd} disabled={!form.title.trim() || !form.starts_at || saving}
                  className="w-full py-2 rounded-xl bg-violet-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add Programme
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin dark:text-gray-400 text-gray-500" /></div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-8 h-8 mx-auto dark:text-gray-600 text-gray-300 mb-2" />
              <p className="text-sm dark:text-gray-400 text-gray-500">No programmes scheduled yet</p>
            </div>
          ) : (
            schedules.map(s => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl dark:bg-white/3 bg-gray-50 border dark:border-white/6 border-gray-200 group">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm dark:text-white text-gray-900 truncate">{s.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                    <span className="text-[11px] dark:text-gray-400 text-gray-500">{fmt(s.starts_at)}</span>
                    {s.ends_at && <><ArrowRight className="w-2.5 h-2.5 dark:text-gray-600 text-gray-300" /><span className="text-[11px] dark:text-gray-400 text-gray-500">{fmt(s.ends_at)}</span></>}
                  </div>
                  {s.category && <span className="text-[10px] dark:text-gray-500 text-gray-400 mt-0.5 block">{s.category}</span>}
                </div>
                <button onClick={() => handleDelete(s.id)}
                  className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-200 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-all hover:bg-red-500/20 dark:hover:bg-red-500/20 flex-shrink-0">
                  <Trash2 className="w-3 h-3 dark:text-gray-400 text-gray-500 hover:text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  CHANNEL CARD
// ══════════════════════════════════════════════════════════════════════════════

function ChannelCard({ channel, onEdit, onDelete, onBroadcast, onSchedule, onToggleActive, onToggleFeatured, onChannelUpdated, i }: {
  channel: TVChannel
  onEdit: () => void
  onDelete: () => void
  onBroadcast: () => void
  onSchedule: () => void
  onToggleActive: () => void
  onToggleFeatured: () => void
  onChannelUpdated: (ch: TVChannel) => void
  i: number
}) {
  const sc = streamStatusConfig[channel.stream_status] || streamStatusConfig.idle

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
      className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden group hover:shadow-xl hover:dark:shadow-violet-900/20 transition-all">

      {/* Cover / Live preview */}
      <div className="relative dark:bg-white/5 bg-gray-50 overflow-hidden">
        {channel.stream_status === 'active' && (channel.youtube_video_id || channel.youtube_channel_id) ? (
          /* ── Real-time YouTube live preview when active ── */
          <div className="w-full">
            <SmartzTVPlayer
              videoId={channel.youtube_video_id}
              channelId={channel.youtube_channel_id}
              poster={channel.cover_url}
              isLive
              title={channel.name}
              viewerCount={channel.viewer_count}
              accentColor="#8b5cf6"
            />
          </div>
        ) : (
          /* ── Static cover thumbnail when not live ── */
          <div className="relative h-28 overflow-hidden">
            {channel.cover_url
              ? <img src={channel.cover_url} alt={channel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tv className="w-10 h-10 dark:text-gray-700 text-gray-300" />
                </div>
              )}
          </div>
        )}

        {/* Badges — overlaid on top of either the player or the static cover */}
        <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap z-10 pointer-events-none">
          {channel.is_featured && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-lg">
              <Star className="w-2.5 h-2.5" /> Featured
            </span>
          )}
          {channel.is_active && channel.stream_status !== 'active' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-lg">
              <Power className="w-2.5 h-2.5" /> Active
            </span>
          )}
        </div>

        {/* Stream status chip — only shown on static cover; player has its own LIVE badge */}
        {channel.stream_status !== 'active' && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          </div>
        )}

        {/* Logo overlay (only on static cover, not on live player) */}
        {channel.logo_url && channel.stream_status !== 'active' && (
          <div className="absolute bottom-2 left-2 w-9 h-9 rounded-lg overflow-hidden border-2 dark:border-white/20 border-white/80 shadow-lg z-10">
            <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h4 className="font-bold text-sm dark:text-white text-gray-900 truncate">{channel.name}</h4>
            <span className="text-[11px] dark:text-gray-400 text-gray-500">{channel.category}</span>
          </div>
          {channel.current_program && (
            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 font-semibold max-w-[100px] truncate">
              {channel.current_program}
            </span>
          )}
        </div>

        {channel.description && (
          <p className="text-[11px] dark:text-gray-400 text-gray-500 mb-3 line-clamp-2">{channel.description}</p>
        )}

        {/* YouTube stream info */}
        {channel.youtube_video_id ? (
          <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg dark:bg-white/3 bg-gray-50 border dark:border-white/6 border-gray-100">
            <Signal className="w-3 h-3 text-red-400 flex-shrink-0" />
            <p className="text-[10px] dark:text-gray-400 text-gray-500 font-mono truncate">
              YouTube: {channel.youtube_video_id}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg dark:bg-amber-500/5 bg-amber-50 border dark:border-amber-500/15 border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <p className="text-[10px] text-amber-500">No YouTube ID set — click Setup</p>
          </div>
        )}

        {/* Action row — 2×2 grid on very narrow screens, 4-col on normal widths */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5 mb-2">
          <button onClick={onEdit} title="Edit channel"
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors text-[11px] font-semibold">
            <Edit2 className="w-3.5 h-3.5 flex-shrink-0" /><span className="xs:hidden">Edit</span>
          </button>
          <button onClick={onSchedule} title="Schedule"
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors text-[11px] font-semibold">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" /><span className="xs:hidden">Sched</span>
          </button>
          <button onClick={onToggleFeatured} title={channel.is_featured ? 'Unfeature' : 'Feature'}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-colors text-[11px] font-semibold ${
              channel.is_featured
                ? 'dark:bg-amber-500/15 bg-amber-50 text-amber-500'
                : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-amber-500'
            }`}>
            {channel.is_featured ? <Star className="w-3.5 h-3.5 fill-current flex-shrink-0" /> : <StarOff className="w-3.5 h-3.5 flex-shrink-0" />}
            <span className="xs:hidden">{channel.is_featured ? 'Unstar' : 'Star'}</span>
          </button>
          <button onClick={onDelete} title="Delete channel"
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors text-[11px] font-semibold">
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" /><span className="xs:hidden">Del</span>
          </button>
        </div>

        {/* Activate + Broadcast */}
        <div className="space-y-1.5">
          <button onClick={onBroadcast}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 hover:opacity-90 transition-opacity">
            <Antenna className="w-3.5 h-3.5" />
            {channel.youtube_video_id ? 'Broadcast Setup' : 'Setup Broadcast'}
          </button>
          <button onClick={onToggleActive}
            className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
              channel.is_active
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 border-transparent hover:text-violet-500 dark:hover:text-violet-400'
            }`}>
            {channel.is_active
              ? <><Power className="w-3 h-3" /> Active — Visible on TV</>
              : <><PowerOff className="w-3 h-3" /> Activate Channel</>}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  CHANNELS TAB
// ══════════════════════════════════════════════════════════════════════════════

function ChannelsTab() {
  const [channels, setChannels] = useState<TVChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editChannel, setEditChannel] = useState<TVChannel | null>(null)
  const [broadcastChannel, setBroadcastChannel] = useState<TVChannel | null>(null)
  const [scheduleChannel, setScheduleChannel] = useState<TVChannel | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('tv_channels')
      .select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false })
    setChannels((data as TVChannel[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime updates
  useEffect(() => {
    const sub = supabase.channel('admin-tv-channels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_channels' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [load])

  const handleChannelSaved = (ch: TVChannel) => {
    setChannels(prev => {
      const exists = prev.find(c => c.id === ch.id)
      return exists ? prev.map(c => c.id === ch.id ? ch : c) : [ch, ...prev]
    })
  }

  const handleToggleActive = async (ch: TVChannel) => {
    const next = !ch.is_active
    setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, is_active: next } : c))
    await supabase.from('tv_channels').update({ is_active: next }).eq('id', ch.id)
  }

  const handleToggleFeatured = async (ch: TVChannel) => {
    const next = !ch.is_featured
    setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, is_featured: next } : c))
    await supabase.from('tv_channels').update({ is_featured: next }).eq('id', ch.id)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('tv_channels').delete().eq('id', deleteId)
    setChannels(prev => prev.filter(c => c.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
  }

  const filtered = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: 'Total Channels', value: channels.length, color: 'from-violet-500 to-purple-600', Icon: Tv },
    { label: 'Active',         value: channels.filter(c => c.is_active).length, color: 'from-emerald-500 to-teal-600', Icon: Power },
    { label: 'Live Now',       value: channels.filter(c => c.stream_status === 'active').length, color: 'from-red-500 to-rose-600', Icon: Radio },
    { label: 'Featured',       value: channels.filter(c => c.is_featured).length, color: 'from-amber-500 to-orange-600', Icon: Star },
  ]

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <s.Icon className="w-4 h-4 text-white" />
            </div>
            <p className="font-display font-black text-2xl dark:text-white text-gray-900">{s.value}</p>
            <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── YouTube Live Monitor — shown when at least one channel is broadcasting ── */}
      {(() => {
        const live = channels.filter(c => c.stream_status === 'active' && (c.youtube_video_id || c.youtube_channel_id))
        if (live.length === 0) return null
        const ch = live[0]
        return (
          <div className="rounded-2xl overflow-hidden border border-red-500/25 dark:bg-[#100818] bg-gray-950 shadow-2xl shadow-red-900/20">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-900/40 to-violet-900/30 border-b border-red-500/20">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black text-red-400 uppercase tracking-widest">ON AIR — YOUTUBE LIVE</span>
                <span className="text-xs dark:text-gray-300 text-gray-200 font-semibold">{ch.name}</span>
                {ch.viewer_count > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px]">
                    <Eye className="w-2.5 h-2.5" /> {ch.viewer_count.toLocaleString()} watching
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {live.length > 1 && (
                  <span className="text-[10px] dark:text-gray-400 text-gray-300">{live.length} channels live</span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                  Control Room
                </span>
              </div>
            </div>

            {/* Player */}
            <div className="p-3 sm:p-4">
              <div className={`grid gap-3 ${live.length > 1 ? 'lg:grid-cols-[1fr_200px]' : ''}`}>
                {/* Main player */}
                <SmartzTVPlayer
                  videoId={ch.youtube_video_id}
                  channelId={ch.youtube_channel_id}
                  poster={ch.cover_url}
                  isLive
                  title={ch.name}
                  viewerCount={ch.viewer_count}
                  accentColor="#8b5cf6"
                />
                {/* Channel switcher when multiple are live */}
                {live.length > 1 && (
                  <div className="space-y-2 overflow-y-auto max-h-[280px]">
                    {live.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setBroadcastChannel(c)}
                        className="w-full text-left p-2 rounded-xl dark:bg-white/5 bg-white/5 hover:dark:bg-violet-500/10 hover:bg-violet-500/10 border border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                          <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{c.category} · {c.viewer_count} viewers</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search channels…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500" />
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-violet-500 transition-colors">
          <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
        </button>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold shadow-lg">
          <Plus className="w-3.5 h-3.5" /> New Channel
        </button>
      </div>

      {/* Channel grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-2xl dark:bg-violet-500/10 bg-violet-50 flex items-center justify-center mx-auto">
            <Tv className="w-7 h-7 dark:text-violet-400 text-violet-500" />
          </div>
          <p className="font-bold dark:text-white text-gray-900">No channels yet</p>
          <p className="text-sm dark:text-gray-400 text-gray-500">Create your first TV channel to get started.</p>
          <button onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold">
            <Plus className="w-4 h-4" /> Create Channel
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ch, i) => (
            <ChannelCard
              key={ch.id}
              channel={ch}
              i={i}
              onEdit={() => setEditChannel(ch)}
              onDelete={() => setDeleteId(ch.id)}
              onBroadcast={() => setBroadcastChannel(ch)}
              onSchedule={() => setScheduleChannel(ch)}
              onToggleActive={() => handleToggleActive(ch)}
              onToggleFeatured={() => handleToggleFeatured(ch)}
              onChannelUpdated={handleChannelSaved}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {createOpen && (
          <CreateEditChannelModal onClose={() => setCreateOpen(false)} onSave={handleChannelSaved} />
        )}
        {editChannel && (
          <CreateEditChannelModal channel={editChannel} onClose={() => setEditChannel(null)} onSave={ch => { handleChannelSaved(ch); setEditChannel(null) }} />
        )}
        {broadcastChannel && (
          <StudioBroadcastModal
            channel={broadcastChannel as any}
            onClose={() => setBroadcastChannel(null)}
            onChannelUpdated={ch => { handleChannelSaved(ch as TVChannel); setBroadcastChannel(ch as TVChannel) }}
          />
        )}
        {scheduleChannel && (
          <ScheduleModal channel={scheduleChannel} onClose={() => setScheduleChannel(null)} />
        )}
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-xs dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-6 text-center shadow-2xl">
              <div className="text-4xl mb-3">📺</div>
              <p className="font-bold dark:text-white text-gray-900 mb-1">Delete Channel?</p>
              <p className="text-sm dark:text-gray-400 text-gray-500 mb-5">This will also delete all schedules for this channel. Cannot be undone.</p>
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
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  EXISTING LIVEKIT SUB-COMPONENTS (unchanged)
// ══════════════════════════════════════════════════════════════════════════════

function attachLKTrack(participant: LocalParticipant, el: HTMLDivElement | null) {
  if (!el) return
  el.innerHTML = ''
  participant.videoTrackPublications.forEach(pub => {
    if (pub.track && pub.kind === Track.Kind.Video) {
      const v = pub.track.attach()
      v.className = 'w-full h-full object-cover'
      el.appendChild(v)
    }
  })
}

function OBSInfoPanel({ wsUrl, token, roomName, onClose }: {
  wsUrl: string; token: string; roomName: string; onClose: () => void
}) {
  const [copied, setCopied] = useState<string | null>(null)
  const httpUrl = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://')
  const whipUrl = `${httpUrl}/rtc/whip?room=${encodeURIComponent(roomName)}`
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000) })
  }
  const Field = ({ label, value, id }: { label: string; value: string; id: string }) => (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 p-2 rounded-lg bg-black/60 border border-white/10 group">
        <code className="text-[11px] text-green-400 flex-1 truncate font-mono select-all">{value}</code>
        <button onClick={() => copy(value, id)} className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
          {copied === id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      </div>
    </div>
  )
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0D0A14] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-gradient-to-r from-violet-900/30 to-blue-900/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center"><Code2 className="w-4 h-4 text-blue-400" /></div>
            <div><h2 className="font-bold text-white text-sm">OBS / vMix Integration</h2><p className="text-[10px] text-gray-400">WHIP protocol (WebRTC)</p></div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"><X className="w-3.5 h-3.5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
            <p className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> OBS Studio Setup</p>
            <ol className="text-[11px] text-gray-400 space-y-1 list-decimal list-inside">
              <li>Open OBS → Settings → Stream</li>
              <li>Service: <strong className="text-white">WHIP</strong> (or Custom)</li>
              <li>Paste the WHIP Endpoint URL below</li>
              <li>Paste the Bearer Token below as the stream key</li>
              <li>Click Apply → Start Streaming</li>
            </ol>
          </div>
          <Field label="WHIP Endpoint URL (OBS Server)" value={whipUrl} id="whip" />
          <Field label="Bearer Token (OBS Stream Key / Password)" value={token} id="token" />
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
            <p className="text-[11px] text-gray-300"><strong className="text-purple-300">vMix:</strong> External Output → RTMP/SRT Custom → paste WHIP URL + set authorization header as <code className="text-green-400 text-[10px]">Bearer {'<token>'}</code></p>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/70">This token is valid for 6 hours. Keep it private — anyone with this token can publish to your room.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function GuestTile({ participant, onKick }: { participant: RemoteParticipant; onKick: (identity: string) => void }) {
  const videoRef = useRef<HTMLDivElement>(null)
  const [hasVideo, setHasVideo] = useState(false)
  const [hasAudio, setHasAudio] = useState(false)
  useEffect(() => {
    const render = () => {
      if (!videoRef.current) return
      videoRef.current.innerHTML = ''
      let v = 0
      participant.videoTrackPublications.forEach(pub => {
        if (pub.track && pub.kind === Track.Kind.Video && !pub.track.isMuted) {
          const el = pub.track.attach(); el.className = 'w-full h-full object-cover'; videoRef.current!.appendChild(el); v++
        }
      })
      setHasVideo(v > 0)
      let a = 0
      participant.audioTrackPublications.forEach(pub => { if (pub.track && pub.kind === Track.Kind.Audio && !pub.track.isMuted) a++ })
      setHasAudio(a > 0)
    }
    render()
    participant.on('trackPublished', render); participant.on('trackUnpublished', render)
    participant.on('trackMuted', render); participant.on('trackUnmuted', render)
    return () => {
      participant.off('trackPublished', render); participant.off('trackUnpublished', render)
      participant.off('trackMuted', render); participant.off('trackUnmuted', render)
    }
  }, [participant])
  return (
    <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/10 aspect-video">
      <div ref={videoRef} className="absolute inset-0" />
      {!hasVideo && (<div className="absolute inset-0 flex items-center justify-center bg-gray-900"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">{participant.name?.[0]?.toUpperCase() || '👤'}</div></div>)}
      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${hasAudio ? 'bg-green-400' : 'bg-red-400'}`} />
          <p className="text-[10px] text-white font-semibold truncate max-w-[80px]">{participant.name || participant.identity.slice(0, 12)}</p>
        </div>
        <button onClick={() => onKick(participant.identity)} className="w-5 h-5 rounded flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 transition-colors">
          <UserX className="w-3 h-3 text-red-400" />
        </button>
      </div>
    </div>
  )
}

function AdminBroadcaster({ data, onEnd }: { data: BroadcastData; onEnd: () => void }) {
  const localVideoRef = useRef<HTMLDivElement>(null)
  const roomRef = useRef<Room | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ctrlChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [connected, setConnected] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [viewers, setViewers] = useState(0)
  const [duration, setDuration] = useState(0)
  const [lkError, setLkError] = useState('')
  const [guests, setGuests] = useState<RemoteParticipant[]>([])
  const [showOBSInfo, setShowOBSInfo] = useState(false)
  const [obsToken, setObsToken] = useState('')
  const [obsWsUrl, setObsWsUrl] = useState('')
  const [showPanel, setShowPanel] = useState<'guests' | null>(null)

  useEffect(() => {
    const ch = supabase.channel(`stream-ctrl-${data.streamId}`)
    ctrlChannelRef.current = ch; ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [data.streamId])

  useEffect(() => {
    let disposed = false
    const room = new Room({ adaptiveStream: true, dynacast: true })
    roomRef.current = room
    const timeoutId = setTimeout(() => { if (!disposed) { room.disconnect(); setLkError('Connection timed out.') } }, 25000)
    const connect = async () => {
      try {
        const { data: tkData, error } = await supabase.functions.invoke('livekit-token', { body: { room: `smartz-tv-${data.streamId}`, name: 'Admin Broadcaster' } })
        if (error || !tkData?.token || !tkData?.wsUrl) throw new Error('LiveKit token unavailable')
        if (disposed) return
        clearTimeout(timeoutId)
        setObsToken(tkData.token); setObsWsUrl(tkData.wsUrl)
        await room.connect(tkData.wsUrl, tkData.token)
        if (disposed) { room.disconnect(); return }
        await room.localParticipant.setCameraEnabled(true)
        await room.localParticipant.setMicrophoneEnabled(true)
        attachLKTrack(room.localParticipant, localVideoRef.current)
        setConnected(true)
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
        const syncP = () => {
          const remotes: RemoteParticipant[] = []; room.remoteParticipants.forEach(p => remotes.push(p))
          setGuests(remotes); const c = remotes.length; setViewers(c)
          supabase.from('livestreams').update({ viewer_count: c }).eq('id', data.streamId).then(() => {})
        }
        syncP()
        room.on(RoomEvent.ParticipantConnected, syncP); room.on(RoomEvent.ParticipantDisconnected, syncP)
        room.on(RoomEvent.LocalTrackPublished, () => attachLKTrack(room.localParticipant, localVideoRef.current))
      } catch (err: any) { clearTimeout(timeoutId); if (!disposed) setLkError(err?.message || 'Could not start broadcast') }
    }
    connect()
    return () => { disposed = true; clearTimeout(timeoutId); if (timerRef.current) clearInterval(timerRef.current); room.disconnect() }
  }, [data.streamId])

  const handleEnd = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    roomRef.current?.disconnect()
    await supabase.from('livestreams').update({ status: 'ended', viewer_count: 0 }).eq('id', data.streamId)
    onEnd()
  }, [data.streamId, onEnd])

  const toggleMic = async () => { const next = !muted; setMuted(next); await roomRef.current?.localParticipant.setMicrophoneEnabled(!next) }
  const toggleCamera = async () => { const next = !cameraOff; setCameraOff(next); await roomRef.current?.localParticipant.setCameraEnabled(!next); attachLKTrack(roomRef.current!.localParticipant, localVideoRef.current) }
  const toggleScreen = async () => {
    const r = roomRef.current; if (!r) return
    try { const next = !screenSharing; await r.localParticipant.setScreenShareEnabled(next); setScreenSharing(next); attachLKTrack(r.localParticipant, localVideoRef.current) } catch { }
  }
  const handleKickGuest = async (identity: string) => {
    ctrlChannelRef.current?.send({ type: 'broadcast', event: 'kick', payload: { identity } })
    setGuests(prev => prev.filter(g => g.identity !== identity))
  }
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const guestCount = guests.filter(g => { let p = 0; g.videoTrackPublications.forEach(() => p++); g.audioTrackPublications.forEach(() => p++); return p > 0 }).length

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-[#050308]">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative bg-black overflow-hidden">
            <div ref={localVideoRef} className="absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />
            {!connected && !lkError && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80"><div className="w-12 h-12 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" /><p className="text-white/60 text-sm">Connecting to broadcast…</p></div>)}
            {lkError && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center"><div className="text-4xl">⚠️</div><p className="text-red-400 font-semibold">{lkError}</p><button onClick={handleEnd} className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm">End Stream</button></div>)}
            {connected && (
              <>
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-black"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE</span>
                    <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-mono backdrop-blur-sm">{fmt(duration)}</span>
                    {screenSharing && <span className="px-2.5 py-1 rounded-full bg-blue-500/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1"><Monitor className="w-3 h-3" /> Sharing screen</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {guestCount > 0 && <span className="px-2.5 py-1 rounded-full bg-violet-500/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1"><Users className="w-3 h-3" /> {guestCount} guest{guestCount > 1 ? 's' : ''}</span>}
                    <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm flex items-center gap-1"><Eye className="w-3 h-3" /> {viewers}</span>
                  </div>
                </div>
                <div className="absolute bottom-[84px] left-3 right-3">
                  <p className="text-white font-bold text-sm truncate drop-shadow-lg">{data.title}</p>
                  <p className="text-white/50 text-[11px]">Admin Broadcast · SmartzTV</p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-[#08050F] border-t border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={toggleMic} disabled={!connected} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-30 ${muted ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
                {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </button>
              <button onClick={toggleCamera} disabled={!connected} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-30 ${cameraOff ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
                {cameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
              </button>
              <button onClick={toggleScreen} disabled={!connected} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-30 ${screenSharing ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
                {screenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
              </button>
            </div>
            <button onClick={handleEnd} className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-all hover:scale-105 active:scale-95"><PhoneOff className="w-6 h-6 text-white" /></button>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPanel(p => p === 'guests' ? null : 'guests')} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all relative ${showPanel === 'guests' ? 'bg-violet-500' : 'bg-white/10 hover:bg-white/20'}`}>
                <Users className="w-5 h-5 text-white" />
                {guestCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 text-[9px] font-black text-white flex items-center justify-center">{guestCount}</span>}
              </button>
              <button onClick={() => { if (obsToken) setShowOBSInfo(true) }} disabled={!connected} className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-30 bg-white/10 hover:bg-white/20">
                <Code2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {showPanel === 'guests' && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex-shrink-0 bg-[#0D0A14] border-l border-white/8 overflow-hidden flex flex-col" style={{ minWidth: 260 }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-violet-400" /><p className="text-sm font-bold text-white">Guests</p><span className="px-1.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-gray-400">{guestCount}</span></div>
                <button onClick={() => setShowPanel(null)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10"><X className="w-3.5 h-3.5 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {guests.length === 0 ? (<div className="flex flex-col items-center justify-center py-10 gap-2 text-center"><UserPlus className="w-5 h-5 text-violet-400/60" /><p className="text-sm font-semibold text-white/50">No guests yet</p></div>)
                  : guests.map(g => <GuestTile key={g.identity} participant={g} onKick={handleKickGuest} />)}
              </div>
              <div className="p-3 border-t border-white/5 flex-shrink-0">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Total viewers</span>
                  <span className="font-bold text-white">{viewers}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {showOBSInfo && obsToken && (
          <OBSInfoPanel wsUrl={obsWsUrl} token={obsToken} roomName={`smartz-tv-${data.streamId}`} onClose={() => setShowOBSInfo(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

function EditStreamModal({ stream, onClose, onSave }: { stream: Stream; onClose: () => void; onSave: (id: string, data: any) => void }) {
  const [title, setTitle] = useState(stream.title)
  const [category, setCategory] = useState(stream.category)
  const [description, setDescription] = useState(stream.description || '')
  const [thumbnail, setThumbnail] = useState(stream.thumbnail)
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave(stream.id, { title, category, description, thumbnail_url: thumbnail }); setSaving(false); onClose() }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-md dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100">
          <h2 className="font-bold dark:text-white text-gray-900 flex items-center gap-2"><Edit2 className="w-4 h-4 text-brand-pink" /> Edit Stream</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center"><X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Title</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" /></div>
          <div><label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none">
              {['Music','Comedy','Tech','Fashion','Sports','Food','Education','Live'].map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none resize-none" /></div>
          <ImageUploader value={thumbnail || null} onChange={url => setThumbnail(url || '')} folder="covers" label="Thumbnail" assetName={title || 'stream'} />
          <button onClick={handleSave} disabled={!title.trim() || saving} className="w-full py-2.5 rounded-xl bg-love-gradient text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function CreateStreamModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Music')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [scheduled, setScheduled] = useState('')
  const [creating, setCreating] = useState(false)
  const handleCreate = async () => {
    if (!title.trim()) return; setCreating(true)
    await onCreate({ title: title.trim(), category, description, thumbnail_url: thumbnail || null, scheduled_at: scheduled || null })
    setCreating(false); onClose()
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-md dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100">
          <h2 className="font-bold dark:text-white text-gray-900 flex items-center gap-2"><Plus className="w-4 h-4 text-brand-pink" /> Setup New Stream</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center"><X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Stream Title *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter stream title" className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none">
                {['Music','Comedy','Tech','Fashion','Sports','Food','Education','Live'].map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Schedule (optional)</label><input type="datetime-local" value={scheduled} onChange={e => setScheduled(e.target.value)} className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 focus:outline-none" /></div>
          </div>
          <div><label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Stream description…" className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none resize-none" /></div>
          <ImageUploader value={thumbnail || null} onChange={url => setThumbnail(url || '')} folder="covers" label="Thumbnail" assetName={title || 'stream'} />
          <button onClick={handleCreate} disabled={!title.trim() || creating} className="w-full py-2.5 rounded-xl bg-love-gradient text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{creating ? 'Creating…' : 'Create Stream'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function InviteModal({ streamId, streamTitle, onClose }: { streamId: string; streamTitle: string; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [invited, setInvited] = useState<string | null>(null)
  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); return }; setSearching(true)
    const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').ilike('full_name', `%${q}%`).limit(8)
    setResults(data || []); setSearching(false)
  }
  const handleInvite = async (u: UserResult) => {
    await supabase.from('livestreams').update({ invited_creator_id: u.id }).eq('id', streamId)
    notifyUser({ userId: u.id, type: 'smartztv', title: '📺 SmartzTV Guest Invite', message: `You've been invited to join "${streamTitle}". Tap to accept!`, actionUrl: '/app/smartztv', emoji: '🎙️' }).catch(() => {})
    setInvited(u.full_name)
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-sm dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100">
          <h2 className="font-bold dark:text-white text-gray-900 flex items-center gap-2"><UserPlus className="w-4 h-4 text-brand-pink" /> Invite Guest</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center"><X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" /></button>
        </div>
        <div className="p-4 space-y-3">
          {invited ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🎙️</div>
              <p className="font-bold dark:text-white text-gray-900">Invite sent!</p>
              <p className="text-sm dark:text-gray-400 text-gray-500 mt-1">{invited} has been notified.</p>
              <button onClick={onClose} className="mt-4 px-5 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold">Done</button>
            </div>
          ) : (
            <>
              <p className="text-xs dark:text-gray-400 text-gray-500">Invite a creator to go live on: <strong className="dark:text-white text-gray-900">{streamTitle}</strong></p>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
                <input value={query} onChange={e => { setQuery(e.target.value); search(e.target.value) }} placeholder="Search users by name…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none" /></div>
              {searching && <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-brand-pink" /></div>}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {results.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full dark:bg-white/10 bg-gray-100 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                      {u.avatar_url ? <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" /> : '👤'}
                    </div>
                    <span className="flex-1 text-sm dark:text-white text-gray-900 font-medium">{u.full_name}</span>
                    <button onClick={() => handleInvite(u)} className="px-3 py-1 rounded-lg bg-love-gradient text-white text-xs font-bold">Invite</button>
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

function LiveTVPanel({ streams }: { streams: Stream[] }) {
  const liveStreams = streams.filter(s => s.status === 'live')
  const [selected, setSelected] = useState<Stream | null>(liveStreams[0] || null)
  if (liveStreams.length === 0) return (
    <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-8 text-center">
      <div className="text-4xl mb-3">📺</div>
      <p className="font-bold dark:text-white text-gray-900 mb-1">No Live Streams</p>
      <p className="text-sm dark:text-gray-400 text-gray-500">No streams are live right now.</p>
    </div>
  )
  return (
    <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b dark:border-white/6 border-gray-100">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <h3 className="font-bold text-sm dark:text-white text-gray-900">Live TV Monitor</h3>
        <span className="ml-auto text-xs dark:text-gray-400 text-gray-500">{liveStreams.length} live</span>
      </div>
      <div className="grid md:grid-cols-[1fr_200px] gap-0">
        <div className="relative bg-black min-h-[200px] sm:min-h-[280px] flex items-center justify-center">
          {selected?.thumbnail && selected.thumbnail.startsWith('http') ? <img src={selected.thumbnail} alt={selected.title} className="w-full h-full object-cover absolute inset-0" /> : <span className="text-7xl">{selected?.thumbnail || '📺'}</span>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-3 left-3"><span className="px-2 py-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE</span></div>
          <div className="absolute bottom-4 left-4 right-4"><p className="text-white font-bold text-sm truncate">{selected?.title}</p><p className="text-white/60 text-xs flex items-center gap-1 mt-0.5"><Eye className="w-3 h-3" /> {selected?.views} viewers · {selected?.creator}</p></div>
        </div>
        <div className="border-l dark:border-white/6 border-gray-100 overflow-y-auto max-h-[280px]">
          {liveStreams.map(s => (
            <button key={s.id} onClick={() => setSelected(s)}
              className={`w-full flex items-center gap-2 p-3 text-left transition-colors border-b dark:border-white/5 border-gray-100 last:border-0 ${selected?.id === s.id ? 'dark:bg-white/8 bg-pink-50' : 'dark:hover:bg-white/5 hover:bg-gray-50'}`}>
              <div className="w-8 h-8 rounded-lg dark:bg-white/10 bg-gray-100 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                {s.thumbnail && s.thumbnail.startsWith('http') ? <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" /> : s.thumbnail || '📺'}
              </div>
              <div className="min-w-0"><p className="text-xs font-semibold dark:text-white text-gray-900 truncate">{s.title}</p><p className="text-[10px] dark:text-gray-400 text-gray-500 flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {s.views}</p></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
//  STUDIO 1 — SmartzTV (YouTube Live + LiveKit public broadcast)
// ══════════════════════════════════════════════════════════════════════════════

function Studio1SmartzTV() {
  const { user } = useAuth()

  // Inner tab within Studio 1
  const [topTab, setTopTab] = useState<'channels' | 'streams'>('channels')

  // Streams state (existing)
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
  const [broadcastData, setBroadcastData] = useState<BroadcastData | null>(null)
  const [goLiveError, setGoLiveError] = useState<string | null>(null)

  const fetchStreams = useCallback(async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('livestreams')
      .select('id, title, category, description, thumbnail_url, viewer_count, status, moderation_status, created_at, creator_id, is_admin_created, is_admin_broadcast, scheduled_at')
      .order('created_at', { ascending: false }).limit(80)
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
          id: String(v.id), title: v.title || 'Untitled Stream', creator: profile?.full_name || 'Unknown',
          creatorId: String(v.creator_id || ''), creatorAvatar: profile?.avatar_url || '',
          category: v.category || 'General', views: (v.viewer_count || 0).toLocaleString(),
          type: isLive ? 'live' : 'upload', status: modStatus, thumbnail: v.thumbnail_url || '📺',
          submitted: isLive ? 'Live now' : (v.scheduled_at ? `Scheduled: ${new Date(v.scheduled_at).toLocaleDateString()}` : timeAgo(v.created_at)),
          description: v.description, isAdminCreated: v.is_admin_created, isAdminBroadcast: v.is_admin_broadcast ?? false,
        }
      })
      setList(mapped)
      setTotalViews(rows.reduce((sum: number, v: any) => sum + (v.viewer_count || 0), 0))
      setCreatorCount(new Set(rows.map((v: any) => v.creator_id)).size)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchStreams() }, [fetchStreams])

  useEffect(() => {
    const sub = supabase.channel('admin-smartztv-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'livestreams' }, () => fetchStreams())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'livestreams' }, () => fetchStreams())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [fetchStreams])

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
    const { error } = await supabase.from('livestreams').insert({ ...data, creator_id: user?.id, status: 'pending', moderation_status: 'approved', is_admin_created: true, is_admin_broadcast: true, viewer_count: 0 })
    if (!error) fetchStreams()
  }
  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true)
    await supabase.from('livestreams').delete().eq('id', deleteId)
    setList(prev => prev.filter(v => v.id !== deleteId)); setDeleteId(null); setDeleting(false)
  }
  const handleToggleAdminBroadcast = async (stream: Stream) => {
    const next = !stream.isAdminBroadcast
    setList(prev => prev.map(v => v.id === stream.id ? { ...v, isAdminBroadcast: next } : v))
    await supabase.from('livestreams').update({ is_admin_broadcast: next }).eq('id', stream.id)
  }
  const handleShare = (stream: Stream) => {
    const url = `${window.location.origin}/smartztv`
    if (navigator.share) { navigator.share({ title: stream.title, url }).catch(() => {}) }
    else { navigator.clipboard.writeText(url).then(() => { setShareToast(stream.title); setTimeout(() => setShareToast(null), 3000) }) }
  }
  const handleGoLive = async (stream: Stream) => {
    setGoLiveError(null)
    const { data: updated, error } = await supabase.from('livestreams').update({ status: 'live', is_admin_broadcast: true }).eq('id', stream.id).select('id')
    if (error || !updated || updated.length === 0) {
      setGoLiveError(error?.code === '42501' ? 'Permission denied. Please re-sign in.' : (error?.message || 'Could not go live — please try again.')); return
    }
    setBroadcastData({ streamId: stream.id, title: stream.title }); fetchStreams()
    if (user?.id) notifyUser({ userId: user.id, type: 'system', title: '📺 Stream is LIVE', message: `"${stream.title}" is now live on SmartzTV!`, actionUrl: '/app/smartztv', emoji: '📺' }).catch(() => {})
  }

  return (
    <div className="space-y-5">
      {/* Studio 1 label */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Tv className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-black text-lg dark:text-white text-gray-900">
            Studio 1 · SmartzTV
          </h2>
          <p className="text-xs dark:text-gray-400 text-gray-500">
            YouTube RTMP/OBS + LiveKit WebRTC · broadcasts to public /smartztv page · <code className="text-[11px]">is_admin_broadcast = true</code>
          </p>
        </div>
      </div>

      {/* LiveKit broadcaster overlay */}
      <AnimatePresence>
        {broadcastData && <AdminBroadcaster data={broadcastData} onEnd={() => { setBroadcastData(null); fetchStreams() }} />}
      </AnimatePresence>

      {/* Toasts */}
      <AnimatePresence>
        {shareToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Link copied for "{shareToast}"
          </motion.div>
        )}
        {goLiveError && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold shadow-lg max-w-md">
            <span className="flex-1">{goLiveError}</span>
            <button onClick={() => setGoLiveError(null)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inner tabs: TV Channels | Livestreams ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 dark:bg-white/3 bg-gray-100 rounded-2xl w-fit">
          {([
            { key: 'channels', label: 'TV Channels', icon: Tv },
            { key: 'streams',  label: 'Livestreams', icon: Radio },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTopTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                topTab === t.key
                  ? 'dark:bg-white/10 bg-white shadow dark:text-white text-gray-900'
                  : 'dark:text-gray-400 text-gray-600 hover:dark:text-white hover:text-gray-900'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
              {t.key === 'streams' && list.filter(v => v.status === 'live').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] font-black text-white flex items-center justify-center">
                  {list.filter(v => v.status === 'live').length}
                </span>
              )}
            </button>
          ))}
        </div>
        {topTab === 'streams' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setView(v => v === 'manage' ? 'livetv' : 'manage')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${view === 'livetv' ? 'bg-red-500 text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 hover:text-brand-pink'}`}>
              {view === 'livetv' ? <><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Monitor</> : <><Radio className="w-3.5 h-3.5" /> Monitor</>}
            </button>
            <button onClick={fetchStreams} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold">
              <Plus className="w-3.5 h-3.5" /> New Stream
            </button>
          </div>
        )}
      </div>

      {/* ── Channels Tab ── */}
      {topTab === 'channels' && <ChannelsTab />}

      {/* ── Streams Tab ── */}
      {topTab === 'streams' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Streams', value: list.length.toString(),                                         icon: Tv,    color: 'from-pink-500 to-rose-600' },
              { label: 'Live Now',      value: list.filter(v => v.status === 'live').length.toString(),         icon: Play,  color: 'from-red-500 to-rose-600' },
              { label: 'Total Views',   value: totalViews.toLocaleString(),                                    icon: Eye,   color: 'from-purple-500 to-violet-600' },
              { label: 'Creators',      value: creatorCount.toLocaleString(),                                  icon: Users, color: 'from-fuchsia-500 to-pink-600' },
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

          {view === 'livetv' && <LiveTVPanel streams={list} />}

          {view === 'manage' && (
            <>
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
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-brand-pink animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 dark:text-gray-500 text-gray-400 text-sm">
                  No streams found. <button onClick={() => setShowCreate(true)} className="text-brand-pink font-semibold hover:underline">Create one →</button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                      className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden group">
                      <div className="relative h-32 dark:bg-white/5 bg-gray-50 flex items-center justify-center text-5xl border-b dark:border-white/5 border-gray-100 overflow-hidden">
                        {v.thumbnail && v.thumbnail.startsWith('http') ? <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" /> : <span>{v.thumbnail}</span>}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {v.status === 'live' && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE</span>}
                          {v.isAdminCreated && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold"><Crown className="w-2.5 h-2.5" /> Admin</span>}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-sm font-bold dark:text-white text-gray-900 mb-1 line-clamp-1">{v.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          {v.creatorAvatar ? <img src={v.creatorAvatar} alt={v.creator} className="w-5 h-5 rounded-full object-cover flex-shrink-0" /> : <div className="w-5 h-5 rounded-full dark:bg-white/10 bg-gray-100 flex items-center justify-center text-[10px] flex-shrink-0">👤</div>}
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
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          <button onClick={() => setEditStream(v)} title="Edit" className="flex items-center justify-center py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-blue-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setInviteStream(v)} title="Invite Guest" className="flex items-center justify-center py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-purple-500 transition-colors"><UserPlus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleShare(v)} title="Share" className="flex items-center justify-center py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-emerald-500 transition-colors"><Share2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteId(v.id)} title="Delete" className="flex items-center justify-center py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <button onClick={() => handleToggleAdminBroadcast(v)}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mb-2 transition-all border ${v.isAdminBroadcast ? 'bg-violet-500/15 text-violet-400 border-violet-500/30 hover:bg-violet-500/25' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 border-transparent hover:text-violet-500'}`}>
                          <Globe className="w-3.5 h-3.5" />{v.isAdminBroadcast ? '📺 On Public TV' : 'Publish to Public TV'}
                        </button>
                        {v.status === 'pending' ? (
                          <div className="space-y-1.5">
                            <div className="flex gap-2">
                              <button onClick={() => updateStatus(v.id, 'approved')} className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Approve</button>
                              <button onClick={() => updateStatus(v.id, 'rejected')} className="flex-1 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Reject</button>
                            </div>
                            {v.isAdminCreated && <button onClick={() => handleGoLive(v)} className="w-full py-2 rounded-xl bg-love-gradient text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 hover:opacity-90 transition-opacity"><Radio className="w-3.5 h-3.5" /> Go Live Now</button>}
                          </div>
                        ) : v.status === 'approved' && v.isAdminCreated ? (
                          <div className="space-y-1.5">
                            <button onClick={() => handleGoLive(v)} className="w-full py-2 rounded-xl bg-love-gradient text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 hover:opacity-90 transition-opacity"><Radio className="w-3.5 h-3.5" /> Go Live</button>
                            <button onClick={() => window.open('/smartztv', '_blank')} className="w-full py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1 hover:text-brand-pink transition-colors"><ExternalLink className="w-3.5 h-3.5" /> View Public TV</button>
                          </div>
                        ) : v.status === 'live' ? (
                          <div className="space-y-1.5">
                            <button onClick={() => setBroadcastData({ streamId: v.id, title: v.title })} className="w-full py-2 rounded-xl bg-red-500/15 text-red-500 text-xs font-bold border border-red-500/30 flex items-center justify-center gap-1.5 hover:bg-red-500/25 transition-colors"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Resume Broadcast</button>
                            <div className="flex gap-1.5">
                              <button onClick={() => setInviteStream(v)} className="flex-1 py-1.5 rounded-xl dark:bg-violet-500/10 bg-violet-50 dark:text-violet-400 text-violet-600 text-xs font-semibold border dark:border-violet-500/20 border-violet-200 flex items-center justify-center gap-1 hover:dark:bg-violet-500/20 transition-colors"><UserPlus className="w-3.5 h-3.5" /> Guest</button>
                              <button onClick={() => window.open('/smartztv', '_blank')} className="flex-1 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1 hover:text-brand-pink transition-colors"><ExternalLink className="w-3.5 h-3.5" /> Public TV</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => window.open('/smartztv', '_blank')} className="w-full py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1 hover:text-brand-pink transition-colors"><ExternalLink className="w-3.5 h-3.5" /> View on TV</button>
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
                    <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete'}</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCreate && <CreateStreamModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
            {editStream && <EditStreamModal stream={editStream} onClose={() => setEditStream(null)} onSave={handleEdit} />}
            {inviteStream && <InviteModal streamId={inviteStream.id} streamTitle={inviteStream.title} onClose={() => setInviteStream(null)} />}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE — AdminSmartzTV (two studio tabs)
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminSmartzTV() {
  // Studio-level tab (the outermost selection on this page)
  const [studio, setStudio] = useState<'studio1' | 'studio2'>('studio1')

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* ── Page header ── */}
      <div>
        <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 flex items-center gap-2">
          <Tv className="w-6 h-6 text-brand-pink" /> SmartzTV Admin
        </h1>
        <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">
          Two broadcast studios — choose your destination below
        </p>
      </div>

      {/* ── Studio selector tabs ── */}
      <div className="flex items-center gap-1 p-1 dark:bg-white/3 bg-gray-100 rounded-2xl w-fit">
        {([
          {
            key: 'studio1',
            label: 'Studio 1 · SmartzTV',
            sub: 'Public broadcast via YouTube Live + LiveKit',
            icon: Tv,
            active: 'bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30',
            dot: 'bg-violet-500',
          },
          {
            key: 'studio2',
            label: 'Studio 2 · Personal Live',
            sub: 'Community stream via LiveKit only',
            icon: Radio,
            active: 'bg-gradient-to-r from-pink-600/20 to-rose-600/20 border border-pink-500/30',
            dot: 'bg-brand-pink',
          },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setStudio(t.key)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              studio === t.key
                ? `${t.active} dark:text-white text-gray-900 shadow`
                : 'dark:text-gray-400 text-gray-600 hover:dark:text-white hover:text-gray-900'
            }`}
          >
            <t.icon className={`w-4 h-4 ${studio === t.key ? `text-${t.dot === 'bg-brand-pink' ? 'brand-pink' : 'violet-400'}` : ''}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Studio panels ── */}
      <AnimatePresence mode="wait">
        {studio === 'studio1' && (
          <motion.div key="studio1" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
            <Studio1SmartzTV />
          </motion.div>
        )}
        {studio === 'studio2' && (
          <motion.div key="studio2" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}>
            <AdminPersonalStudio />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
