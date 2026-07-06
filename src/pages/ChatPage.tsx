import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip,
  Mic, Check, CheckCheck, Play, Flag, X, Loader2, WifiOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { useStream } from '@/contexts/StreamContext'
import { getOrCreateDirectChannel } from '@/lib/stream'
import ReportBlockModal from '@/components/ReportBlockModal'
import EmojiPicker from '@/components/EmojiPicker'
import type { Channel } from 'stream-chat'

interface Message {
  id: string
  text: string
  time: string
  mine: boolean
  status: 'sent' | 'delivered' | 'read'
  type: 'text' | 'voice'
  reaction?: string
}

interface Participant {
  id: string
  name: string
  emoji: string
  online: boolean
  avatar_url?: string
}

const reactions = ['❤️', '😂', '😮', '😢', '👍', '🔥']

function mapStreamMessage(m: any, myId: string): Message {
  return {
    id: m.id,
    text: m.text || '',
    time: new Date(m.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    mine: m.user?.id === myId,
    status: 'read',
    type: 'text',
  }
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { connected } = useStream()
  const { startCall } = useLiveKitCall()

  const [messages, setMessages] = useState<Message[]>([])
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectTimeout, setConnectTimeout] = useState(false)
  const [input, setInput] = useState('')
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [sending, setSending] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [voiceToast, setVoiceToast] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<Channel | null>(null)
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  // Load participant profile — also subscribe to realtime presence updates
  useEffect(() => {
    if (!id) return
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, last_seen')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        const online = data?.last_seen
          ? (Date.now() - new Date(data.last_seen).getTime()) < 300000
          : false
        setParticipant({
          id: id!,
          name: data?.full_name || 'User',
          emoji: '👤',
          avatar_url: data?.avatar_url,
          online,
        })
      })

    // Subscribe to realtime presence updates for this participant
    const presenceSub = supabase
      .channel(`presence:${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${id}`,
      }, (payload) => {
        const d = payload.new as any
        const online = d.last_seen
          ? (Date.now() - new Date(d.last_seen).getTime()) < 300000
          : false
        setParticipant(prev => prev ? { ...prev, online } : prev)
      })
      .subscribe()

    return () => { supabase.removeChannel(presenceSub) }
  }, [id])

  // Connection timeout — if GetStream doesn't connect in 10 s, stop the spinner
  useEffect(() => {
    if (connected) { setConnectTimeout(false); return }
    const t = setTimeout(() => {
      setConnectTimeout(true)
      setLoading(false)
    }, 10000)
    return () => clearTimeout(t)
  }, [connected])

  // GetStream channel: watch + realtime messaging + typing + read receipts
  useEffect(() => {
    if (!connected || !user?.id || !id) return

    let cancelled = false
    const channel = getOrCreateDirectChannel(user.id, id)
    channelRef.current = channel

    ;(async () => {
      try {
        const state = await channel.watch()
        if (cancelled) return
        setMessages((state.messages || []).map(m => mapStreamMessage(m, user.id!)))

        // Mark channel as read immediately on open
        channel.markRead().catch(() => {})
      } catch (err) {
        console.error('Stream channel init:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const handleNew = (event: any) => {
      if (cancelled || !event.message) return
      const m = event.message
      if (m.user?.id === user.id) return // handled optimistically
      setMessages(prev => {
        if (prev.some(msg => msg.id === m.id)) return prev
        return [...prev, mapStreamMessage(m, user.id!)]
      })
      // Mark as read when message arrives and we're in the chat
      channel.markRead().catch(() => {})
    }

    const handleReaction = (event: any) => {
      if (cancelled || !event.message) return
      const m = event.message
      const latest = m.latest_reactions?.[0]
      if (latest) {
        setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, reaction: latest.type } : msg))
      }
    }

    const handleTypingStart = (event: any) => {
      if (cancelled || event.user?.id === user.id) return
      setOtherTyping(true)
    }

    const handleTypingStop = (event: any) => {
      if (cancelled || event.user?.id === user.id) return
      setOtherTyping(false)
    }

    const handleRead = (event: any) => {
      if (cancelled || event.user?.id === user.id) return
      // Other person read our messages — mark all mine as read
      setMessages(prev => prev.map(m => m.mine ? { ...m, status: 'read' } : m))
    }

    channel.on('message.new', handleNew)
    channel.on('reaction.new', handleReaction)
    channel.on('typing.start', handleTypingStart)
    channel.on('typing.stop', handleTypingStop)
    channel.on('message.read', handleRead)

    return () => {
      cancelled = true
      channel.off('message.new', handleNew)
      channel.off('reaction.new', handleReaction)
      channel.off('typing.start', handleTypingStart)
      channel.off('typing.stop', handleTypingStop)
      channel.off('message.read', handleRead)
      channelRef.current = null
      setOtherTyping(false)
    }
  }, [connected, user?.id, id])

  const makeRoomId = (type: 'video' | 'audio') => {
    const sorted = [user?.id || 'a', id || 'b'].sort().join('-')
    return `SmartzConnect-${type}-${sorted}`.replace(/[^a-zA-Z0-9-]/g, '')
  }

  const handleCall = (type: 'video' | 'audio') => {
    startCall({ roomId: makeRoomId(type), type, participantName: participant?.name || 'User', participantEmoji: participant?.emoji, participantAvatar: participant?.avatar_url })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (channelRef.current && connected) {
      channelRef.current.keystroke().catch(() => {})
      // Auto-stop typing after 3 s of inactivity
      if (typingStopRef.current) clearTimeout(typingStopRef.current)
      typingStopRef.current = setTimeout(() => {
        channelRef.current?.stopTyping().catch(() => {})
      }, 3000)
    }
  }

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || !channelRef.current || !connected || !user?.id) return

    // Stop typing indicator
    if (typingStopRef.current) clearTimeout(typingStopRef.current)
    channelRef.current.stopTyping().catch(() => {})

    const clientId = `${user.id.replace(/-/g, '').slice(0, 8)}-${Date.now()}`
    const optimistic: Message = {
      id: clientId,
      text,
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      mine: true,
      status: 'sent',
      type: 'text',
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    setSending(true)

    try {
      await channelRef.current.sendMessage({ text, id: clientId } as any)
      setMessages(prev => prev.map(m => m.id === clientId ? { ...m, status: 'delivered' } : m))
    } catch (err) {
      console.error('Send error:', err)
    }
    setSending(false)
  }, [input, connected, user?.id])

  const addReaction = async (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reaction: emoji } : m))
    setShowReactions(null)
    try { await channelRef.current?.sendReaction(msgId, { type: emoji }) } catch {}
  }

  const showVoiceToast = () => { setVoiceToast(true); setTimeout(() => setVoiceToast(false), 2500) }

  const person = participant

  return (
    <div className="h-full flex flex-col dark:bg-pink-50 bg-gray-50 relative">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 dark:bg-white bg-white border-b dark:border-pink-200 border-gray-100 flex-shrink-0">
        <Link to="/app/matches" className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
          <ArrowLeft className="w-4 h-4 dark:text-gray-700 text-gray-600" />
        </Link>
        <div className="relative">
          <div className="w-10 h-10 rounded-full dark:bg-pink-100 bg-gray-100 flex items-center justify-center text-xl overflow-hidden ring-2 ring-purple-500/20">
            {person?.avatar_url ? <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" /> : (person?.emoji || '👤')}
          </div>
          {person?.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 dark:border-white border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm dark:text-gray-900 text-gray-900 truncate">{person?.name || 'Chat'}</p>
          <p className={`text-[11px] font-medium ${connected ? (person?.online ? 'text-emerald-500' : 'text-pink-500') : 'text-gray-400'}`}>
            {!connected ? (connectTimeout ? 'Offline — check connection' : 'Connecting…') : otherTyping ? '✍️ typing…' : person?.online ? '● Active now' : 'Last seen recently'}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => handleCall('audio')} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors">
            <Phone className="w-4 h-4 dark:text-gray-700 text-gray-600" />
          </button>
          <button onClick={() => handleCall('video')} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:bg-brand-pink/20 hover:text-brand-pink transition-colors">
            <Video className="w-4 h-4 dark:text-gray-700 text-gray-600" />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(m => !m)} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <MoreVertical className="w-4 h-4 dark:text-gray-700 text-gray-600" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-10 right-0 z-20 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-pink-200 border-gray-100 overflow-hidden min-w-[140px]"
                  onClick={() => setShowMenu(false)}>
                  <button onClick={() => setShowReport(true)} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors">
                    <Flag className="w-4 h-4" /> Report / Block
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {showReport && participant && (
        <ReportBlockModal open={showReport} onClose={() => setShowReport(false)} targetUserId={participant.id} targetName={participant.name} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" onClick={() => { setShowReactions(null); setShowEmoji(false) }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
            <p className="text-sm dark:text-gray-600 text-gray-500">
              {connected ? 'Loading messages…' : 'Connecting to chat…'}
            </p>
          </div>
        ) : connectTimeout && !connected ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center">
              <WifiOff className="w-8 h-8 dark:text-pink-400 text-gray-400" />
            </div>
            <div>
              <p className="font-bold dark:text-gray-900 text-gray-900 mb-2">Chat not available</p>
              <p className="text-sm dark:text-gray-500 text-gray-500 leading-relaxed max-w-xs">
                Real-time messaging is not configured yet. Contact support or check back soon.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-90 transition-opacity"
            >
              Retry Connection
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-full dark:bg-pink-100 bg-gray-100 flex items-center justify-center text-3xl overflow-hidden ring-2 ring-pink-500/20">
              {person?.avatar_url ? <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover rounded-full" /> : (person?.emoji || '💬')}
            </div>
            <div>
              <p className="font-bold dark:text-gray-900 text-gray-900 mb-1">Start a conversation</p>
              <p className="text-sm dark:text-gray-500 text-gray-500">Say hello to {person?.name}! You matched — break the ice 💕</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} group relative`}>
                <div className="max-w-[80%] relative">
                  <div
                    onClick={e => { e.stopPropagation(); setShowReactions(showReactions === msg.id ? null : msg.id) }}
                    className={`px-4 py-2.5 rounded-2xl cursor-pointer ${
                      msg.mine
                        ? 'bg-love-gradient text-white rounded-br-sm'
                        : 'dark:bg-white dark:border dark:border-pink-200 bg-gray-100 dark:text-gray-900 text-gray-900 rounded-bl-sm dark:shadow-sm'
                    }`}
                  >
                    {msg.type === 'voice' ? (
                      <div className="flex items-center gap-2">
                        <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><Play className="w-3.5 h-3.5" /></button>
                        <div className="flex gap-0.5 items-center">
                          {Array.from({ length: 18 }).map((_, j) => (
                            <div key={j} className="w-0.5 rounded-full bg-current opacity-60" style={{ height: `${6 + (j * 7 % 12)}px` }} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>

                  {msg.reaction && (
                    <div className={`absolute -bottom-2 ${msg.mine ? 'left-2' : 'right-2'} text-lg`}>{msg.reaction}</div>
                  )}

                  <div className={`flex items-center gap-1 mt-1 ${msg.mine ? 'justify-end' : ''}`}>
                    <span className="text-[10px] dark:text-gray-400 text-gray-400">{msg.time}</span>
                    {msg.mine && (
                      msg.status === 'read'
                        ? <CheckCheck className="w-3 h-3 text-pink-400" />
                        : msg.status === 'delivered'
                          ? <CheckCheck className="w-3 h-3 text-gray-400" />
                          : <Check className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {showReactions === msg.id && (
                    <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                      onClick={e => e.stopPropagation()}
                      className={`absolute ${msg.mine ? 'right-0' : 'left-0'} -top-12 z-10 flex gap-1 dark:bg-white bg-white rounded-2xl p-2 shadow-xl border dark:border-pink-200 border-gray-100`}>
                      {reactions.map(r => (
                        <button key={r} onClick={() => addReaction(msg.id, r)} className="text-xl hover:scale-125 transition-transform">{r}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {otherTyping && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              className="flex justify-start">
              <div className="dark:bg-white dark:border dark:border-pink-200 bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 dark:shadow-sm">
                <div className="flex items-center gap-1">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-pink-400"
                      style={{ animation: `bounce 1s ${delay}s infinite` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Emoji Picker */}
      <div className="relative">
        <AnimatePresence>
          {showEmoji && (
            <div className="absolute bottom-0 left-3 z-50">
              <EmojiPicker
                onSelect={e => setInput(prev => prev + e)}
                onClose={() => setShowEmoji(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice toast */}
      <AnimatePresence>
        {voiceToast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-pink-200 border-gray-100 whitespace-nowrap">
            <Mic className="w-4 h-4 text-brand-pink" />
            <span className="text-xs font-semibold dark:text-gray-900 text-gray-900">Voice messages coming soon</span>
            <button onClick={() => setVoiceToast(false)} className="dark:text-gray-400 text-gray-400 hover:text-brand-pink ml-1"><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-3 py-3 dark:bg-white bg-white border-t dark:border-pink-200 border-gray-100 flex-shrink-0">
        <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={e => {
          const file = e.target.files?.[0]; if (!file) return
          setInput(prev => prev + (prev ? ' ' : '') + `[📎 ${file.name}]`); e.target.value = ''
        }} />
        <div className="flex items-center gap-2 dark:bg-pink-50 dark:border dark:border-pink-200 bg-gray-100 border border-transparent rounded-2xl px-3 py-2 focus-within:dark:border-pink-400">
          <button onClick={() => setShowEmoji(!showEmoji)} className="text-lg hover:scale-110 transition-transform">😊</button>
          <input value={input} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={connected ? 'Message…' : 'Connecting…'} disabled={!connected}
            className="flex-1 bg-transparent text-sm dark:text-gray-900 text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-400 focus:outline-none disabled:opacity-50" />
          <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="dark:text-gray-400 text-gray-400 hover:text-brand-pink transition-colors"><Paperclip className="w-4 h-4" /></button>
            <button onClick={showVoiceToast} className="dark:text-gray-400 text-gray-400 hover:text-brand-pink transition-colors"><Mic className="w-4 h-4" /></button>
            <button onClick={send} disabled={!input.trim() || sending || !connected}
              className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all ml-1">
              {sending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
