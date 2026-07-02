import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip,
  Mic, Check, CheckCheck, Play, Flag, X, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { useStream } from '@/contexts/StreamContext'
import { streamClient, getOrCreateDirectChannel } from '@/lib/stream'
import ReportBlockModal from '@/components/ReportBlockModal'
import type { Channel } from 'stream-chat'

interface Message {
  id: string
  text: string
  time: string
  mine: boolean
  status: 'sent' | 'delivered' | 'read'
  type: 'text' | 'voice' | 'image' | 'emoji'
  reaction?: string
  duration?: string
}

interface Participant {
  id: string
  name: string
  emoji: string
  online: boolean
  avatar_url?: string
}

const reactions = ['❤️', '😂', '😮', '😢', '👍', '🔥']
const quickEmojis = ['😊', '😍', '🥰', '😂', '🔥', '💕', '👏', '🙌']

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
  const [input, setInput] = useState('')
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [sending, setSending] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [voiceToast, setVoiceToast] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<Channel | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load participant profile from Supabase (display info only)
  useEffect(() => {
    if (!id) return
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, last_seen')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          const online = data.last_seen
            ? (Date.now() - new Date(data.last_seen).getTime()) < 300000
            : false
          setParticipant({
            id: data.id,
            name: data.full_name || 'User',
            emoji: '👤',
            avatar_url: data.avatar_url,
            online,
          })
        } else {
          setParticipant({ id: id!, name: 'User', emoji: '👤', online: false })
        }
      })
  }, [id])

  // GetStream channel: watch + realtime
  useEffect(() => {
    if (!connected || !user?.id || !id) return

    let cancelled = false
    const channel = getOrCreateDirectChannel(user.id, id)
    channelRef.current = channel

    const init = async () => {
      try {
        const state = await channel.watch()
        if (cancelled) return
        setMessages((state.messages || []).map(m => mapStreamMessage(m, user.id)))
      } catch (err) {
        console.error('Stream channel init:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    const handleNew = (event: any) => {
      if (cancelled || !event.message) return
      const m = event.message
      // Skip own messages already added optimistically
      if (m.user?.id === user.id) {
        setMessages(prev => prev.map(msg =>
          msg.id.startsWith('temp-') && msg.text === m.text
            ? { ...msg, id: m.id, status: 'delivered' }
            : msg
        ))
        return
      }
      setMessages(prev => {
        if (prev.some(msg => msg.id === m.id)) return prev
        return [...prev, mapStreamMessage(m, user.id)]
      })
    }

    const handleReaction = (event: any) => {
      if (cancelled || !event.message) return
      const m = event.message
      const latestReaction = m.latest_reactions?.[0]
      if (latestReaction) {
        setMessages(prev => prev.map(msg =>
          msg.id === m.id ? { ...msg, reaction: latestReaction.type } : msg
        ))
      }
    }

    channel.on('message.new', handleNew)
    channel.on('reaction.new', handleReaction)

    return () => {
      cancelled = true
      channel.off('message.new', handleNew)
      channel.off('reaction.new', handleReaction)
      channelRef.current = null
    }
  }, [connected, user?.id, id])

  const makeRoomId = (type: 'video' | 'audio') => {
    const sorted = [user?.id || 'a', id || 'b'].sort().join('-')
    return `SmartzConnect-${type}-${sorted}`.replace(/[^a-zA-Z0-9-]/g, '')
  }

  const handleCall = (type: 'video' | 'audio') => {
    startCall({
      roomId: makeRoomId(type),
      type,
      participantName: participant?.name || 'User',
      participantEmoji: participant?.emoji,
      participantAvatar: participant?.avatar_url,
    })
  }

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setInput(prev => prev + (prev ? ' ' : '') + `[📎 ${file.name}]`)
    e.target.value = ''
  }

  const showVoiceToast = () => {
    setVoiceToast(true)
    setTimeout(() => setVoiceToast(false), 2500)
  }

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || !channelRef.current || !connected) return

    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
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
      const result = await channelRef.current.sendMessage({ text })
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, id: result.message.id, status: 'delivered' }
          : m
      ))
    } catch (err) {
      console.error('Send error:', err)
      // Mark failed
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'sent' } : m
      ))
    }
    setSending(false)
  }, [input, connected])

  const addReaction = async (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reaction: emoji } : m))
    setShowReactions(null)
    if (channelRef.current) {
      try {
        await channelRef.current.sendReaction(msgId, { type: emoji })
      } catch { /* graceful degradation */ }
    }
  }

  const person = participant

  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50 relative">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <Link
          to="/app/matches"
          className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors"
        >
          <ArrowLeft className="w-4 h-4 dark:text-gray-400 text-gray-600" />
        </Link>

        <div className="relative">
          <div className="w-10 h-10 rounded-full dark:bg-white/8 bg-gray-100 flex items-center justify-center text-xl overflow-hidden">
            {person?.avatar_url
              ? <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
              : (person?.emoji || '👤')}
          </div>
          {person?.online && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 dark:border-[#0D0A14] border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm dark:text-white text-gray-900 truncate">{person?.name || 'Chat'}</p>
          <p className="text-[11px] dark:text-gray-500 text-gray-400">
            {!connected ? 'Connecting…' : person?.online ? 'Active now' : 'Offline'}
          </p>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => handleCall('audio')}
            className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors"
            title="Voice call"
          >
            <Phone className="w-4 h-4 dark:text-gray-400 text-gray-600" />
          </button>
          <button
            onClick={() => handleCall('video')}
            className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-brand-pink/20 hover:text-brand-pink transition-colors"
            title="Video call"
          >
            <Video className="w-4 h-4 dark:text-gray-400 text-gray-600" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(m => !m)}
              className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors"
            >
              <MoreVertical className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  className="absolute top-10 right-0 z-20 dark:bg-[#1A1228] bg-white rounded-2xl shadow-xl border dark:border-white/8 border-gray-100 overflow-hidden min-w-[140px]"
                  onClick={() => setShowMenu(false)}
                >
                  <button
                    onClick={() => setShowReport(true)}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-500 hover:dark:bg-white/5 hover:bg-gray-50 transition-colors"
                  >
                    <Flag className="w-4 h-4" /> Report / Block
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Report modal */}
      {showReport && participant && (
        <ReportBlockModal
          open={showReport}
          onClose={() => setShowReport(false)}
          targetUserId={participant.id}
          targetName={participant.name}
        />
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        onClick={() => { setShowReactions(null); setShowEmoji(false) }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-pink/30 border-t-brand-pink animate-spin" />
            <p className="text-sm dark:text-gray-400 text-gray-500">
              {connected ? 'Loading messages…' : 'Connecting to chat…'}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-full dark:bg-white/5 bg-gray-100 flex items-center justify-center text-3xl overflow-hidden">
              {person?.avatar_url
                ? <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover rounded-full" />
                : (person?.emoji || '💬')}
            </div>
            <div>
              <p className="font-bold dark:text-white text-gray-900 mb-1">
                Start a conversation with {person?.name}
              </p>
              <p className="text-sm dark:text-gray-400 text-gray-500">
                Say hello! You matched — break the ice 💕
              </p>
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
                        : 'dark:bg-[#1A1228] bg-gray-100 dark:text-white text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    {msg.type === 'voice' ? (
                      <div className="flex items-center gap-2">
                        <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex gap-0.5 items-center">
                          {Array.from({ length: 18 }).map((_, j) => (
                            <div
                              key={j}
                              className="w-0.5 rounded-full bg-current opacity-60"
                              style={{ height: `${6 + (j * 7 % 12)}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-xs opacity-70">{msg.duration || '0:12'}</span>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>

                  {/* Reaction */}
                  {msg.reaction && (
                    <div className={`absolute -bottom-2 ${msg.mine ? 'left-2' : 'right-2'} text-lg`}>
                      {msg.reaction}
                    </div>
                  )}

                  {/* Time + status */}
                  <div className={`flex items-center gap-1 mt-1 ${msg.mine ? 'justify-end' : ''}`}>
                    <span className="text-[10px] dark:text-gray-600 text-gray-400">{msg.time}</span>
                    {msg.mine && (
                      msg.status === 'read'
                        ? <CheckCheck className="w-3 h-3 text-blue-400" />
                        : msg.status === 'delivered'
                          ? <CheckCheck className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                          : <Check className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Reaction picker */}
                <AnimatePresence>
                  {showReactions === msg.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      onClick={e => e.stopPropagation()}
                      className={`absolute ${msg.mine ? 'right-0' : 'left-0'} -top-12 z-10 flex gap-1 dark:bg-[#130E1E] bg-white rounded-2xl p-2 shadow-xl border dark:border-white/8 border-gray-100`}
                    >
                      {reactions.map(r => (
                        <button
                          key={r}
                          onClick={() => addReaction(msg.id, r)}
                          className="text-xl hover:scale-125 transition-transform"
                        >
                          {r}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick emoji bar */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="flex gap-2 px-4 py-2 dark:bg-[#0D0A14] bg-white border-t dark:border-white/5 border-gray-100 overflow-hidden"
          >
            {quickEmojis.map(e => (
              <button key={e} onClick={() => setInput(prev => prev + e)} className="text-xl hover:scale-125 transition-transform">
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice note toast */}
      <AnimatePresence>
        {voiceToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 dark:bg-[#1A1228] bg-white rounded-2xl shadow-xl border dark:border-white/8 border-gray-100 whitespace-nowrap"
          >
            <Mic className="w-4 h-4 text-brand-pink" />
            <span className="text-xs font-semibold dark:text-white text-gray-900">Voice messages coming soon</span>
            <button onClick={() => setVoiceToast(false)} className="dark:text-gray-500 text-gray-400 hover:text-brand-pink ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-3 py-3 dark:bg-[#0D0A14] bg-white border-t dark:border-white/6 border-gray-100 flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileAttach}
        />
        <div className="flex items-center gap-2 dark:bg-white/5 bg-gray-100 rounded-2xl px-3 py-2">
          <button onClick={() => setShowEmoji(!showEmoji)} className="text-lg hover:scale-110 transition-transform">
            😊
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={connected ? 'Message…' : 'Connecting…'}
            disabled={!connected}
            className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={showVoiceToast}
              className="dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors"
              title="Voice message (coming soon)"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={send}
              disabled={!input.trim() || sending || !connected}
              className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all ml-1"
            >
              {sending
                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                : <Send className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
