/**
 * MessagesPage — universal inbox for:
 *   • Direct message conversations (Stream Chat)
 *   • World Chat (pinned)
 *   • Group Rooms (pinned)
 *   • Dating Matches (Supabase)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MessageCircle, Globe, Users2, RefreshCw,
  Zap, Edit, ArrowRight, Heart, ChevronRight,
  Loader2, WifiOff, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { streamClient } from '@/lib/stream'
import { useAuth } from '@/hooks/useAuth'
import { useStream } from '@/contexts/StreamContext'

/* ─────────────────────────────────────────────────────────── */
/* Types                                                        */
/* ─────────────────────────────────────────────────────────── */
interface DmThread {
  channelId:  string
  otherUserId: string
  name:       string
  avatar?:    string
  lastMsg:    string
  lastTime:   string
  unread:     number
  online:     boolean
}

type Tab = 'all' | 'chats' | 'matches' | 'groups'

/* ─────────────────────────────────────────────────────────── */
/* Helpers                                                      */
/* ─────────────────────────────────────────────────────────── */
function timeAgo(date: Date | string | null): string {
  if (!date) return ''
  const d   = typeof date === 'string' ? new Date(date) : date
  const ms  = Date.now() - d.getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1)  return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24)  return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

function Avatar({
  src, name, size = 'md', online, emoji,
}: {
  src?: string | null; name?: string; size?: 'sm' | 'md' | 'lg'; online?: boolean; emoji?: string
}) {
  const sz = { sm: 'w-9 h-9 text-base', md: 'w-11 h-11 text-xl', lg: 'w-14 h-14 text-2xl' }[size]
  const dotSz = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  return (
    <div className={`relative flex-shrink-0 ${sz} rounded-full bg-white/8 flex items-center justify-center overflow-hidden`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : emoji
          ? <span>{emoji}</span>
          : <span className="font-bold text-white/70">{name?.[0] || '?'}</span>
      }
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dotSz} rounded-full border-2 dark:border-[#0D0A14] border-white ${online ? 'bg-emerald-500' : 'bg-gray-500'}`} />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Pinned hub tiles                                             */
/* ─────────────────────────────────────────────────────────── */
const PINNED = [
  {
    id:       'worldchat',
    href:     '/app/worldchat',
    label:    'World Chat',
    sub:      'Global live chat room',
    emoji:    '🌍',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id:       'groups',
    href:     '/app/groups',
    label:    'Group Rooms',
    sub:      'Community topic rooms',
    emoji:    '👥',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id:       'spin',
    href:     '/app/spin',
    label:    'Spin & Chat',
    sub:      'Random instant match',
    emoji:    '⚡',
    gradient: 'from-yellow-500 to-orange-600',
  },
]

/* ─────────────────────────────────────────────────────────── */
/* Component                                                    */
/* ─────────────────────────────────────────────────────────── */
export default function MatchesPage() {
  const { user }         = useAuth()
  const { connected }    = useStream()
  const navigate          = useNavigate()

  const [tab, setTab]               = useState<Tab>('all')
  const [search, setSearch]         = useState('')
  const [threads, setThreads]       = useState<DmThread[]>([])
  const [loading, setLoading]       = useState(true)
  const [streamError, setStreamError] = useState(false)
  const refreshRef = useRef(false)

  /* ── Fetch DM threads from Stream ───────────────────────── */
  const fetchThreads = useCallback(async () => {
    if (!user?.id || !streamClient) {
      setLoading(false)
      return
    }
    if (refreshRef.current) return
    refreshRef.current = true

    try {
      setLoading(true)
      setStreamError(false)

      // Query all 'messaging' channels for this user
      const channels = await streamClient.queryChannels(
        { type: 'messaging', members: { $in: [user.id] } },
        [{ last_message_at: -1 }],
        { watch: false, state: true, limit: 50 }
      )

      // Collect other user IDs from DM channels (non-group)
      const otherIds: string[] = []
      channels.forEach(ch => {
        if (ch.id?.startsWith('group-')) return
        const members = Object.keys(ch.state.members)
        const otherId = members.find(id => id !== user.id)
        if (otherId) otherIds.push(otherId)
      })

      // Batch-fetch profiles from Supabase
      const profileMap: Record<string, { full_name?: string; avatar_url?: string; last_seen?: string }> = {}
      if (otherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, last_seen')
          .in('id', otherIds)
        ;(profiles || []).forEach(p => { profileMap[p.id] = p })
      }

      const now = Date.now()
      const threads: DmThread[] = []

      channels.forEach(ch => {
        if (ch.id?.startsWith('group-')) return // skip group channels (shown in pinned)

        const members  = Object.keys(ch.state.members)
        const otherId  = members.find(id => id !== user.id)
        if (!otherId) return

        const profile  = profileMap[otherId] || {}
        const lastSeen = profile.last_seen ? new Date(profile.last_seen).getTime() : 0
        const online   = lastSeen > 0 && (now - lastSeen) < 300_000

        // Last message
        const msgs     = ch.state.messages
        const lastMsg  = msgs.length > 0 ? msgs[msgs.length - 1] : null
        const lastText = lastMsg?.text || lastMsg?.attachments?.[0]?.title || '💬 Tap to chat'
        const lastMsgDate = lastMsg?.created_at
          ? (lastMsg.created_at instanceof Date ? lastMsg.created_at : new Date(lastMsg.created_at as unknown as string))
          : null
        const lastTime = lastMsgDate
          ? timeAgo(lastMsgDate)
          : ch.data?.last_message_at ? timeAgo(String(ch.data.last_message_at)) : ''

        const unread = ch.countUnread?.() ?? 0

        threads.push({
          channelId:   ch.id || '',
          otherUserId: otherId,
          name:        profile.full_name || otherId.slice(0, 8) + '…',
          avatar:      profile.avatar_url,
          lastMsg:     lastText,
          lastTime,
          unread,
          online,
        })
      })

      setThreads(threads)
    } catch (err) {
      console.error('[Messages] Stream query error:', err)
      setStreamError(true)
    } finally {
      setLoading(false)
      refreshRef.current = false
    }
  }, [user?.id])

  useEffect(() => { fetchThreads() }, [fetchThreads, connected])

  /* ── Real-time: unread badge updates via Stream events ───── */
  useEffect(() => {
    if (!streamClient || !user?.id) return
    const handler = (event: any) => {
      if (
        event.type === 'notification.message_new' ||
        event.type === 'message.new' ||
        event.type === 'notification.mark_read'
      ) {
        // Debounce the re-fetch to avoid spamming
        setTimeout(() => fetchThreads(), 300)
      }
    }
    streamClient.on(handler)
    return () => { streamClient?.off(handler) }
  }, [user?.id, fetchThreads])

  /* ── Filter threads ─────────────────────────────────────── */
  const filtered = threads.filter(t => {
    const q = search.toLowerCase()
    if (q && !t.name.toLowerCase().includes(q)) return false
    if (tab === 'chats') return true
    return true
  })

  /* ── Tabs ───────────────────────────────────────────────── */
  const tabs: { id: Tab; label: string }[] = [
    { id: 'all',     label: 'All' },
    { id: 'chats',   label: 'Chats' },
    { id: 'matches', label: 'Matches' },
    { id: 'groups',  label: 'Channels' },
  ]

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50">

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-3 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Messages 💬</h1>
            <p className="text-xs dark:text-gray-400 text-gray-500">
              {threads.length > 0 ? `${threads.length} conversation${threads.length !== 1 ? 's' : ''}` : 'All your conversations'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => { refreshRef.current = false; fetchThreads() }}
              whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}
              className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </motion.button>
            <Link
              to="/app/discover"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #EC4899, #BE185D)' }}
              title="Find new matches"
            >
              <Edit className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-love-gradient text-white shadow-sm'
                  : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable list ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Pinned hubs ── */}
        {(tab === 'all' || tab === 'groups') && !search && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-black uppercase tracking-widest dark:text-gray-500 text-gray-400 px-1 mb-2">
              Channels & Rooms
            </p>
            <div className="grid grid-cols-3 gap-2 mb-1">
              {PINNED.map(p => (
                <Link
                  key={p.id}
                  to={p.href}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/6 border-gray-100 hover:border-brand-pink/40 transition-all group shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-lg shadow group-hover:scale-110 transition-transform`}>
                    {p.emoji}
                  </div>
                  <span className="text-[11px] font-bold dark:text-white text-gray-900 text-center leading-tight">{p.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Dating matches quick-link ── */}
        {(tab === 'all' || tab === 'matches') && !search && (
          <div className="px-3 pt-2">
            <Link
              to="/app/discover"
              className="flex items-center gap-3 p-3 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/6 border-gray-100 hover:border-brand-pink/40 transition-all group shadow-sm mb-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-xl shadow">
                💕
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold dark:text-white text-gray-900">Dating Matches</p>
                <p className="text-xs dark:text-gray-400 text-gray-500">Swipe, match, and connect</p>
              </div>
              <ChevronRight className="w-4 h-4 dark:text-gray-500 text-gray-400 group-hover:text-brand-pink transition-colors" />
            </Link>
          </div>
        )}

        {/* ── DM threads section header ── */}
        {(tab === 'all' || tab === 'chats') && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-black uppercase tracking-widest dark:text-gray-500 text-gray-400">
              Direct Messages
            </p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (tab === 'all' || tab === 'chats') && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-brand-pink animate-spin" />
            <p className="text-xs dark:text-gray-400 text-gray-500">Loading conversations…</p>
          </div>
        )}

        {/* ── Stream error ── */}
        {streamError && !loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 px-6 text-center">
            <WifiOff className="w-8 h-8 text-gray-400" />
            <p className="text-sm font-bold dark:text-white text-gray-900">Couldn't load messages</p>
            <p className="text-xs dark:text-gray-400 text-gray-500">Check your connection and try again</p>
            <button
              onClick={() => { refreshRef.current = false; fetchThreads() }}
              className="px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── DM thread list ── */}
        {!loading && !streamError && (tab === 'all' || tab === 'chats') && (
          <>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-love-soft flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-brand-pink" />
                </div>
                {search ? (
                  <p className="text-sm dark:text-gray-400 text-gray-500">No conversations match "{search}"</p>
                ) : (
                  <>
                    <p className="text-sm font-bold dark:text-white text-gray-900">No direct messages yet</p>
                    <p className="text-xs dark:text-gray-400 text-gray-500">
                      Message someone from their profile, or meet someone new in World Chat or Spin!
                    </p>
                    <Link to="/app/discover" className="px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold mt-1">
                      Find People
                    </Link>
                  </>
                )}
              </div>
            )}

            <div className="divide-y dark:divide-white/4 divide-gray-50">
              {filtered.map((thread, i) => (
                <motion.div
                  key={thread.channelId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  onClick={() => navigate(`/app/chat/${thread.otherUserId}`)}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:dark:bg-white/3 hover:bg-pink-50/30 transition-colors active:scale-[0.99]"
                >
                  <div
                    onClick={(e) => { e.stopPropagation(); navigate(`/app/profile/${thread.otherUserId}`) }}
                    className="cursor-pointer"
                  >
                    <Avatar
                      src={thread.avatar}
                      name={thread.name}
                      size="md"
                      online={thread.online}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-bold text-sm truncate ${thread.unread > 0 ? 'dark:text-white text-gray-900' : 'dark:text-white/80 text-gray-700'}`}>
                        {thread.name}
                      </span>
                      <span className="text-[10px] dark:text-gray-500 text-gray-400 flex-shrink-0 ml-2">
                        {thread.lastTime}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${thread.unread > 0 ? 'dark:text-gray-300 text-gray-600 font-semibold' : 'dark:text-gray-500 text-gray-400'}`}>
                      {thread.lastMsg}
                    </p>
                  </div>

                  {thread.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-brand-pink text-white text-[9px] font-black flex items-center justify-center flex-shrink-0 shadow">
                      {thread.unread > 9 ? '9+' : thread.unread}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ── Groups tab content ── */}
        {tab === 'groups' && !search && (
          <div className="px-4 pt-2 pb-10">
            <div className="space-y-2">
              {[
                { href: '/app/worldchat', icon: Globe,    emoji: '🌍', label: 'World Chat',   sub: 'Open global chatroom — join the conversation', gradient: 'from-cyan-500 to-blue-600' },
                { href: '/app/groups',    icon: Users2,   emoji: '👥', label: 'Group Rooms',   sub: 'Dating, culture, business & more topic rooms', gradient: 'from-violet-500 to-purple-600' },
                { href: '/app/spin',      icon: Zap,      emoji: '⚡', label: 'Spin & Chat',   sub: 'Get matched instantly with a random user',     gradient: 'from-yellow-500 to-orange-600' },
                { href: '/app/discover',  icon: Heart,    emoji: '💕', label: 'Dating',        sub: 'Swipe and connect with people near you',       gradient: 'from-pink-500 to-rose-600'    },
              ].map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 p-4 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/6 border-gray-100 hover:border-brand-pink/40 transition-all group shadow-sm"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xl shadow group-hover:scale-110 transition-transform`}>
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm dark:text-white text-gray-900">{item.label}</p>
                    <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{item.sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 dark:text-gray-500 text-gray-400 group-hover:text-brand-pink transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Matches tab: redirect note ── */}
        {tab === 'matches' && (
          <div className="px-4 pt-2 pb-10 space-y-3">
            <Link
              to="/app/discover"
              className="flex items-center gap-3 p-4 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/6 border-gray-100 hover:border-brand-pink/40 transition-all group shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-xl shadow group-hover:scale-110 transition-transform">
                💕
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm dark:text-white text-gray-900">Find New Matches</p>
                <p className="text-xs dark:text-gray-400 text-gray-500">Swipe to discover people near you</p>
              </div>
              <ArrowRight className="w-4 h-4 dark:text-gray-500 text-gray-400 group-hover:text-brand-pink transition-colors" />
            </Link>
            <p className="text-xs dark:text-gray-500 text-gray-400 text-center py-2">
              Once you match with someone, they'll appear in your Chats above.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
