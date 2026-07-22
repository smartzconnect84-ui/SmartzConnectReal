/**
 * CommentModerationPanel — Admin-only panel for moderating SmartzTV live chat.
 * Features: view all comments (including hidden/deleted), pin, delete, hide, mute/block users.
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Pin, Trash2, ShieldAlert, EyeOff, Eye, Search, RefreshCw,
  Loader2, UserX, CheckCircle, Filter, X, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { TVCommentRow } from '@/lib/streaming/types'

interface ModerationProps {
  channelId: string
  broadcastId?: string | null
}

interface CommentMeta extends TVCommentRow {
  report_count?: number
}

interface MutedUser {
  id: string
  user_id: string
  reason: string | null
  created_at: string
  profiles?: { full_name: string; avatar_url: string | null }
}

type FilterType = 'all' | 'pinned' | 'reported' | 'hidden' | 'deleted'

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function CommentModerationPanel({ channelId, broadcastId }: ModerationProps) {
  const [comments, setComments]       = useState<CommentMeta[]>([])
  const [muted, setMuted]             = useState<MutedUser[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState<'comments' | 'muted'>('comments')
  const [filter, setFilter]           = useState<FilterType>('all')
  const [search, setSearch]           = useState('')
  const [processing, setProcessing]   = useState<Set<string>>(new Set())
  const [actionToast, setActionToast] = useState('')

  const toast = (msg: string) => {
    setActionToast(msg)
    setTimeout(() => setActionToast(''), 2500)
  }

  const addProcessing = (id: string) => setProcessing(p => new Set([...p, id]))
  const delProcessing = (id: string) => setProcessing(p => { const n = new Set(p); n.delete(id); return n })

  // ── Load comments ────────────────────────────────────────────────────────────
  const loadComments = useCallback(async () => {
    setLoading(true)
    const q = supabase
      .from('tv_comments')
      .select(`
        id, channel_id, broadcast_id, user_id, parent_id, content,
        is_pinned, is_deleted, is_admin_hidden, created_at,
        profiles (id, full_name, avatar_url, role)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (broadcastId) q.eq('broadcast_id', broadcastId)
    const { data } = await q
    setComments((data || []) as CommentMeta[])
    setLoading(false)
  }, [channelId, broadcastId])

  const loadMuted = useCallback(async () => {
    const { data } = await supabase
      .from('tv_muted_users')
      .select(`id, user_id, reason, created_at, profiles (full_name, avatar_url)`)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
    setMuted((data || []) as MutedUser[])
  }, [channelId])

  useEffect(() => { void loadComments(); void loadMuted() }, [loadComments, loadMuted])

  // ── Actions ──────────────────────────────────────────────────────────────────

  const pin = async (c: CommentMeta) => {
    addProcessing(c.id)
    await supabase.from('tv_comments').update({ is_pinned: !c.is_pinned }).eq('id', c.id)
    toast(c.is_pinned ? 'Comment unpinned' : 'Comment pinned')
    delProcessing(c.id)
    void loadComments()
  }

  const hide = async (c: CommentMeta) => {
    addProcessing(c.id)
    await supabase.from('tv_comments').update({ is_admin_hidden: !c.is_admin_hidden }).eq('id', c.id)
    toast(c.is_admin_hidden ? 'Comment unhidden' : 'Comment hidden from viewers')
    delProcessing(c.id)
    void loadComments()
  }

  const del = async (c: CommentMeta) => {
    if (!confirm('Delete this comment permanently?')) return
    addProcessing(c.id)
    await supabase.from('tv_comments').update({ is_deleted: true }).eq('id', c.id)
    toast('Comment deleted')
    delProcessing(c.id)
    void loadComments()
  }

  const muteUser = async (c: CommentMeta) => {
    const reason = prompt('Reason for muting (optional):') ?? ''
    addProcessing(c.user_id)
    await supabase.from('tv_muted_users').upsert({
      channel_id: channelId, user_id: c.user_id, reason: reason || null,
    }, { onConflict: 'channel_id,user_id' })

    // Also hide all their comments
    await supabase.from('tv_comments')
      .update({ is_admin_hidden: true })
      .eq('channel_id', channelId)
      .eq('user_id', c.user_id)

    toast(`${c.profiles?.full_name || 'User'} muted`)
    delProcessing(c.user_id)
    void loadComments(); void loadMuted()
  }

  const unmute = async (m: MutedUser) => {
    addProcessing(m.id)
    await supabase.from('tv_muted_users').delete().eq('id', m.id)
    toast('User unmuted')
    delProcessing(m.id)
    void loadMuted()
  }

  // ── Filter ───────────────────────────────────────────────────────────────────

  const filtered = comments.filter(c => {
    if (search) {
      const q = search.toLowerCase()
      if (!c.content.toLowerCase().includes(q) &&
          !c.profiles?.full_name?.toLowerCase().includes(q)) return false
    }
    switch (filter) {
      case 'pinned':   return c.is_pinned
      case 'reported': return (c.report_count || 0) > 0
      case 'hidden':   return c.is_admin_hidden
      case 'deleted':  return c.is_deleted
      default:         return true
    }
  })

  const filterCounts: Record<FilterType, number> = {
    all:      comments.length,
    pinned:   comments.filter(c => c.is_pinned).length,
    reported: comments.filter(c => (c.report_count || 0) > 0).length,
    hidden:   comments.filter(c => c.is_admin_hidden).length,
    deleted:  comments.filter(c => c.is_deleted).length,
  }

  return (
    <div className="h-full flex flex-col bg-[#0e0a1e] rounded-2xl overflow-hidden border border-white/8">

      {/* Toast */}
      <AnimatePresence>
        {actionToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-xl">
            <CheckCircle className="w-4 h-4" /> {actionToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white">Comment Moderation</span>
        </div>
        <button onClick={() => { void loadComments(); void loadMuted() }} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/8 flex-shrink-0">
        {(['comments', 'muted'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${activeTab === tab ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-500 hover:text-gray-300'}`}>
            {tab} {tab === 'muted' && muted.length > 0 && `(${muted.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'comments' ? (
        <>
          {/* Search + filters */}
          <div className="px-3 py-2.5 space-y-2 border-b border-white/6 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search comments…"
                className="w-full bg-white/6 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/40" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'pinned', 'reported', 'hidden', 'deleted'] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors ${
                    filter === f
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/6 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}>
                  {f} {filterCounts[f] > 0 && `(${filterCounts[f]})`}
                </button>
              ))}
            </div>
          </div>

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Filter className="w-5 h-5 text-white/20" />
                <p className="text-sm text-white/30">No comments match this filter</p>
              </div>
            ) : (
              filtered.map(c => {
                const isProc = processing.has(c.id) || processing.has(c.user_id)
                return (
                  <div key={c.id}
                    className={`p-3 rounded-xl border transition-all ${
                      c.is_deleted ? 'bg-red-500/5 border-red-500/15 opacity-60'
                      : c.is_admin_hidden ? 'bg-orange-500/5 border-orange-500/15'
                      : c.is_pinned ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-white/4 border-white/6 hover:bg-white/6'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white/90">
                            {c.profiles?.full_name || 'Unknown'}
                          </span>
                          {c.is_pinned && <span className="flex items-center gap-0.5 text-[10px] text-amber-400"><Pin className="w-2.5 h-2.5" /> Pinned</span>}
                          {c.is_admin_hidden && <span className="flex items-center gap-0.5 text-[10px] text-orange-400"><EyeOff className="w-2.5 h-2.5" /> Hidden</span>}
                          {c.is_deleted && <span className="flex items-center gap-0.5 text-[10px] text-red-400"><Trash2 className="w-2.5 h-2.5" /> Deleted</span>}
                          {(c.report_count || 0) > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                              <AlertTriangle className="w-2.5 h-2.5" /> {c.report_count} report{(c.report_count || 0) > 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="text-[10px] text-white/30 ml-auto">{timeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-xs text-white/70 mt-1 break-words leading-relaxed">{c.content}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!c.is_deleted && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <button onClick={() => void pin(c)} disabled={isProc}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                            c.is_pinned ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-white/6 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}>
                          <Pin className="w-3 h-3" /> {c.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button onClick={() => void hide(c)} disabled={isProc}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                            c.is_admin_hidden ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-white/6 text-gray-400 hover:bg-white/10 hover:text-amber-400'
                          }`}>
                          {c.is_admin_hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {c.is_admin_hidden ? 'Unhide' : 'Hide'}
                        </button>
                        <button onClick={() => void del(c)} disabled={isProc}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/6 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                        <button onClick={() => void muteUser(c)} disabled={isProc}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/6 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50">
                          <UserX className="w-3 h-3" /> Mute user
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </>
      ) : (
        /* Muted users list */
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {muted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <ShieldAlert className="w-5 h-5 text-white/20" />
              <p className="text-sm text-white/30">No muted users on this channel</p>
            </div>
          ) : (
            muted.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/4 border border-white/6">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">
                    {m.profiles?.full_name || m.user_id}
                  </p>
                  {m.reason && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">Reason: {m.reason}</p>
                  )}
                  <p className="text-[10px] text-gray-600 mt-0.5">Muted {timeAgo(m.created_at)}</p>
                </div>
                <button onClick={() => void unmute(m)}
                  disabled={processing.has(m.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold transition-colors disabled:opacity-50 flex-shrink-0">
                  {processing.has(m.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Unmute
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
