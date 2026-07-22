/**
 * LiveComments — Real-time comment system for SmartzTV broadcasts.
 * Uses Supabase Realtime — completely independent of YouTube comments.
 * Supports: post, reply, react with emoji, report, pin (admin), delete (admin).
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, MessageSquare, Heart, SmilePlus, ChevronDown, ChevronUp,
  CornerDownRight, Flag, Pin, Trash2, ShieldAlert, Loader2, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { TVCommentRow } from '@/lib/streaming/types'

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👏', '😮', '💯', '🎉', '👍']
const MAX_COMMENT_LENGTH = 300
const COMMENTS_PAGE_SIZE = 40

interface LiveCommentsProps {
  channelId: string
  broadcastId?: string | null
  isAdmin?: boolean
  accentColor?: string
  className?: string
}

interface CommentWithMeta extends TVCommentRow {
  replies?: TVCommentRow[]
  myReactions?: string[]
  reactionCounts?: Record<string, number>
  showReplies?: boolean
}

// ── Relative time ──────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 28 }: { url?: string | null; name?: string; size?: number }) {
  const initials = (name || '?').charAt(0).toUpperCase()
  return url ? (
    <img src={url} alt={name || ''} className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] bg-gradient-to-br from-violet-500 to-purple-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

// ── Emoji Picker ───────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.85, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 6 }} transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-2 left-0 z-50 flex gap-1 p-2 rounded-2xl bg-[#1a1030] border border-white/10 shadow-2xl shadow-black/50">
      {REACTION_EMOJIS.map(emoji => (
        <button key={emoji} onClick={() => { onSelect(emoji); onClose() }}
          className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg transition-colors">
          {emoji}
        </button>
      ))}
    </motion.div>
  )
}

// ── Single comment ─────────────────────────────────────────────────────────────

function Comment({
  comment, currentUserId, isAdmin, onReact, onReply, onPin, onDelete, onHide, onReport, depth = 0,
}: {
  comment: CommentWithMeta
  currentUserId?: string
  isAdmin?: boolean
  onReact: (commentId: string, emoji: string) => void
  onReply: (comment: CommentWithMeta) => void
  onPin: (comment: CommentWithMeta) => void
  onDelete: (commentId: string) => void
  onHide: (commentId: string, hidden: boolean) => void
  onReport: (commentId: string) => void
  depth?: number
}) {
  const [showEmoji, setShowEmoji] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const profile = comment.profiles

  if (comment.is_deleted || comment.is_admin_hidden) {
    if (!isAdmin) return null
    return (
      <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg opacity-40 text-xs text-gray-500 italic ${depth > 0 ? 'ml-8' : ''}`}>
        <ShieldAlert className="w-3 h-3" />
        {comment.is_deleted ? '[Deleted]' : '[Hidden by admin]'}
      </div>
    )
  }

  const myReacted = (emoji: string) => comment.myReactions?.includes(emoji)
  const reactionList = Object.entries(comment.reactionCounts || {}).filter(([, count]) => count > 0)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative ${depth > 0 ? 'ml-8 mt-1' : 'mt-2'}`}
    >
      {/* Pin indicator */}
      {comment.is_pinned && (
        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-amber-400 font-semibold">
          <Pin className="w-3 h-3" /> Pinned comment
        </div>
      )}

      <div className="flex gap-2">
        <Avatar url={profile?.avatar_url} name={profile?.full_name} size={depth > 0 ? 24 : 28} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-white/90 truncate max-w-[120px]">
              {profile?.full_name || 'User'}
            </span>
            {profile?.role === 'admin' || profile?.role === 'superadmin' ? (
              <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[9px] font-black">ADMIN</span>
            ) : null}
            <span className="text-[10px] text-white/30">{timeAgo(comment.created_at)}</span>
          </div>

          <p className="text-sm text-white/80 leading-relaxed mt-0.5 break-words">{comment.content}</p>

          {/* Reactions display */}
          {reactionList.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {reactionList.map(([emoji, count]) => (
                <button key={emoji} onClick={() => onReact(comment.id, emoji)}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                    myReacted(emoji)
                      ? 'bg-violet-500/25 border-violet-500/40 text-violet-200'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}>
                  <span>{emoji}</span>
                  <span className="text-[10px] font-semibold">{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center gap-3 mt-1">
            {/* React */}
            <div className="relative">
              <button onClick={() => setShowEmoji(s => !s)}
                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-violet-400 transition-colors">
                <SmilePlus className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showEmoji && (
                  <EmojiPicker
                    onSelect={emoji => onReact(comment.id, emoji)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Reply (top-level only) */}
            {depth === 0 && (
              <button onClick={() => onReply(comment)}
                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-violet-400 transition-colors">
                <CornerDownRight className="w-3 h-3" /> Reply
                {(comment.reply_count || 0) > 0 && (
                  <span className="ml-0.5">({comment.reply_count})</span>
                )}
              </button>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <>
                <button onClick={() => onPin(comment)}
                  className={`flex items-center gap-1 text-[11px] transition-colors ${comment.is_pinned ? 'text-amber-400' : 'text-white/40 hover:text-amber-400'}`}>
                  <Pin className="w-3 h-3" /> {comment.is_pinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => onHide(comment.id, !comment.is_admin_hidden)}
                  className="flex items-center gap-1 text-[11px] text-white/40 hover:text-orange-400 transition-colors">
                  <ShieldAlert className="w-3 h-3" /> Hide
                </button>
                <button onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-1 text-[11px] text-white/40 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </>
            )}

            {/* Report (non-owner, non-admin) */}
            {!isAdmin && currentUserId && comment.user_id !== currentUserId && (
              <button onClick={() => onReport(comment.id)}
                className="flex items-center gap-1 text-[11px] text-white/30 hover:text-red-400 transition-colors">
                <Flag className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {depth === 0 && comment.showReplies && (comment.replies || []).length > 0 && (
        <div className="mt-1 space-y-0">
          {(comment.replies || []).map(reply => (
            <Comment key={reply.id} comment={reply as CommentWithMeta} currentUserId={currentUserId}
              isAdmin={isAdmin} onReact={onReact} onReply={onReply} onPin={onPin}
              onDelete={onDelete} onHide={onHide} onReport={onReport} depth={1} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── Main LiveComments component ────────────────────────────────────────────────

export default function LiveComments({
  channelId, broadcastId, isAdmin = false, accentColor = '#8b5cf6', className = '',
}: LiveCommentsProps) {
  const { session, adminProfile: profile } = useAuth()
  const [comments, setComments] = useState<CommentWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<CommentWithMeta | null>(null)
  const [showEmojiStream, setShowEmojiStream] = useState(false)
  const [streamEmojis, setStreamEmojis] = useState<{ id: number; emoji: string; x: number }[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const emojiIdRef = useRef(0)

  // ── Load comments ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    const q = supabase
      .from('tv_comments')
      .select(`
        id, channel_id, broadcast_id, user_id, parent_id, content,
        is_pinned, is_deleted, is_admin_hidden, created_at,
        profiles (id, full_name, avatar_url, role)
      `)
      .eq('channel_id', channelId)
      .is('parent_id', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(COMMENTS_PAGE_SIZE)

    if (broadcastId) q.eq('broadcast_id', broadcastId)

    const { data } = await q
    if (!data) return

    // Enrich with reaction counts and my reactions
    const enriched: CommentWithMeta[] = await Promise.all(
      (data as unknown as TVCommentRow[]).map(async c => {
        const { data: rxData } = await supabase
          .from('tv_comment_reactions')
          .select('emoji, user_id')
          .eq('comment_id', c.id)

        const reactionCounts: Record<string, number> = {}
        const myReactions: string[] = []
        for (const r of rxData || []) {
          reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1
          if (r.user_id === session?.user.id) myReactions.push(r.emoji)
        }

        // Reply count
        const { count } = await supabase
          .from('tv_comments')
          .select('id', { count: 'exact', head: true })
          .eq('parent_id', c.id)
          .eq('is_deleted', false)

        return { ...c, reactionCounts, myReactions, reply_count: count || 0, showReplies: false }
      })
    )

    setComments(enriched.reverse())  // chronological order
    setLoading(false)
  }, [channelId, broadcastId, session?.user.id])

  useEffect(() => { void load() }, [load])

  // ── Realtime subscription ────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase.channel(`tv-comments-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tv_comments',
        filter: `channel_id=eq.${channelId}`,
      }, () => { void load() })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'tv_comments',
        filter: `channel_id=eq.${channelId}`,
      }, () => { void load() })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'tv_comments',
        filter: `channel_id=eq.${channelId}`,
      }, () => { void load() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [channelId, load])

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  // ── Load replies ─────────────────────────────────────────────────────────────

  const loadReplies = async (parentComment: CommentWithMeta) => {
    const { data } = await supabase
      .from('tv_comments')
      .select(`id, channel_id, broadcast_id, user_id, parent_id, content,
        is_pinned, is_deleted, is_admin_hidden, created_at,
        profiles (id, full_name, avatar_url, role)`)
      .eq('parent_id', parentComment.id)
      .order('created_at', { ascending: true })

    setComments(prev => prev.map(c =>
      c.id === parentComment.id
        ? { ...c, replies: (data || []) as unknown as TVCommentRow[], showReplies: !c.showReplies }
        : c
    ))
  }

  // ── Send comment ─────────────────────────────────────────────────────────────

  const send = async () => {
    if (!text.trim() || !session || sending) return
    setSending(true)
    const content = text.trim()
    setText('')

    const { error } = await supabase.from('tv_comments').insert({
      channel_id: channelId,
      broadcast_id: broadcastId || null,
      user_id: session.user.id,
      parent_id: replyTo?.id || null,
      content,
    })

    if (error) setText(content)  // restore on failure
    else setReplyTo(null)

    setSending(false)
  }

  // ── React to comment ─────────────────────────────────────────────────────────

  const handleReact = async (commentId: string, emoji: string) => {
    if (!session) return
    const comment = comments.find(c => c.id === commentId)
    const alreadyReacted = comment?.myReactions?.includes(emoji)

    if (alreadyReacted) {
      await supabase.from('tv_comment_reactions').delete()
        .eq('comment_id', commentId).eq('user_id', session.user.id).eq('emoji', emoji)
    } else {
      await supabase.from('tv_comment_reactions').upsert({
        comment_id: commentId, user_id: session.user.id, emoji,
      }, { onConflict: 'comment_id,user_id,emoji' })
    }
    void load()
  }

  // ── Stream reaction (floating emoji on the video) ────────────────────────────

  const sendStreamReaction = async (emoji: string) => {
    // Add floating emoji locally
    const id = ++emojiIdRef.current
    const x = 20 + Math.random() * 60
    setStreamEmojis(prev => [...prev, { id, emoji, x }])
    setTimeout(() => setStreamEmojis(prev => prev.filter(e => e.id !== id)), 2500)

    // Persist to DB
    if (!session) return
    await supabase.from('tv_stream_reactions').insert({
      channel_id: channelId, broadcast_id: broadcastId || null,
      user_id: session.user.id, emoji,
    })
  }

  // ── Admin actions ─────────────────────────────────────────────────────────────

  const handlePin = async (comment: CommentWithMeta) => {
    await supabase.from('tv_comments').update({ is_pinned: !comment.is_pinned }).eq('id', comment.id)
    void load()
  }

  const handleDelete = async (commentId: string) => {
    await supabase.from('tv_comments').update({ is_deleted: true }).eq('id', commentId)
    void load()
  }

  const handleHide = async (commentId: string, hidden: boolean) => {
    await supabase.from('tv_comments').update({ is_admin_hidden: hidden }).eq('id', commentId)
    void load()
  }

  const handleReport = async (commentId: string) => {
    // Insert into a reports table or just notify admin
    await supabase.from('tv_comment_reports').insert({
      comment_id: commentId,
      reporter_id: session?.user.id,
    }).then(() => alert('Reported. Our moderation team will review this.'))
  }

  const handleReply = (comment: CommentWithMeta) => {
    setReplyTo(comment)
    inputRef.current?.focus()
  }

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {/* ── Stream reaction emojis (floating) ── */}
      <div className="relative h-0 overflow-visible pointer-events-none">
        <AnimatePresence>
          {streamEmojis.map(({ id, emoji, x }) => (
            <motion.div key={id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -120, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute bottom-0 text-2xl select-none pointer-events-none z-50"
              style={{ left: `${x}%` }}>
              {emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white/90">Live Chat</span>
          {comments.length > 0 && (
            <span className="text-xs text-white/40">{comments.length}</span>
          )}
        </div>
        {/* Quick stream reactions */}
        <div className="relative flex-shrink-0">
          <button onClick={() => setShowEmojiStream(s => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/8 hover:bg-violet-500/20 text-white/70 hover:text-violet-300 text-xs font-semibold transition-colors border border-white/8">
            <Heart className="w-3.5 h-3.5" /> React
          </button>
          <AnimatePresence>
            {showEmojiStream && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 z-50 flex gap-1 p-2 rounded-2xl bg-[#1a1030] border border-white/10 shadow-2xl">
                {REACTION_EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => { void sendStreamReaction(emoji); setShowEmojiStream(false) }}
                    className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg transition-colors">
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Comment list ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 space-y-0 scrollbar-thin scrollbar-thumb-white/10">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <MessageSquare className="w-6 h-6 text-white/20" />
            <p className="text-sm text-white/30 font-medium">No comments yet</p>
            <p className="text-xs text-white/20">Be the first to say something!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id}>
              <Comment
                comment={comment}
                currentUserId={session?.user.id}
                isAdmin={isAdmin}
                onReact={handleReact}
                onReply={handleReply}
                onPin={handlePin}
                onDelete={handleDelete}
                onHide={handleHide}
                onReport={handleReport}
              />
              {/* Toggle replies */}
              {(comment.reply_count || 0) > 0 && (
                <button
                  onClick={() => void loadReplies(comment)}
                  className="ml-9 mt-1 flex items-center gap-1 text-[11px] text-violet-400/70 hover:text-violet-300 transition-colors"
                >
                  {comment.showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {comment.showReplies ? 'Hide' : 'Show'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      {session ? (
        <div className="flex-shrink-0 border-t border-white/8 p-3 space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
              <span className="flex items-center gap-1.5">
                <CornerDownRight className="w-3 h-3" />
                Replying to <strong>{replyTo.profiles?.full_name || 'user'}</strong>
              </span>
              <button onClick={() => setReplyTo(null)} className="text-white/40 hover:text-white/70 ml-2">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Avatar url={(profile as any)?.avatar_url} name={(profile as any)?.full_name} size={28} />
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
                }}
                placeholder={replyTo ? `Reply to ${replyTo.profiles?.full_name || 'user'}…` : 'Say something…'}
                rows={1}
                className="w-full resize-none bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all scrollbar-none"
                style={{ maxHeight: 80 }}
              />
              {text.length > MAX_COMMENT_LENGTH * 0.8 && (
                <span className="absolute bottom-2 right-2 text-[10px] text-white/30">
                  {text.length}/{MAX_COMMENT_LENGTH}
                </span>
              )}
            </div>
            <button
              onClick={() => void send()}
              disabled={!text.trim() || sending}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #7c3aed)` }}
            >
              {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-white/8 p-3">
          <a href="/login"
            className="block w-full text-center py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/25 text-violet-300 text-sm font-semibold hover:bg-violet-600/30 transition-colors">
            Sign in to comment
          </a>
        </div>
      )}
    </div>
  )
}
