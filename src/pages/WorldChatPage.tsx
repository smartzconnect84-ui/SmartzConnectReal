import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Smile, Paperclip, Mic, MicOff, X, CornerUpLeft,
  Pin, Trash2, Globe, Users, Volume2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { streamClient } from '@/lib/stream'
import { useStream } from '@/contexts/StreamContext'
import type { Channel } from 'stream-chat'
import EmojiPicker from '@/components/EmojiPicker'
import TranslateButton from '@/components/TranslateButton'
import { uploadToSufy } from '@/lib/sufy'

const WORLD_CHANNEL_ID = 'smartz-worldchat-global'
const QUICK_REACTIONS = [
  { emoji: '❤️', name: 'love' },
  { emoji: '👍', name: 'like' },
  { emoji: '😂', name: 'haha' },
  { emoji: '😮', name: 'wow' },
  { emoji: '😢', name: 'sad' },
  { emoji: '😡', name: 'angry' },
]

interface WCMessage {
  id: string
  text: string
  userId: string
  userName: string
  userAvatar?: string
  createdAt: Date
  attachments?: { type: string; url: string; name?: string }[]
  replyTo?: { id: string; text: string; userName: string }
  reactions?: Record<string, { count: number; me: boolean }>
  pinned?: boolean
  deleted?: boolean
}

export default function WorldChatPage() {
  const { user } = useAuth()
  const { connected: streamConnected } = useStream()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<WCMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [replyTo, setReplyTo] = useState<WCMessage | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [recording, setRecording] = useState(false)
  const [contextMsg, setContextMsg] = useState<WCMessage | null>(null)
  const [pinnedMessages, setPinnedMessages] = useState<WCMessage[]>([])
  const [showPinned, setShowPinned] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [myProfile, setMyProfile] = useState<{ full_name: string; avatar_url?: string } | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [connectFailed, setConnectFailed] = useState(false)

  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  // Load my profile
  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('full_name,avatar_url').eq('id', user.id).single()
      .then(({ data }) => { if (data) setMyProfile(data) })
  }, [user?.id])

  // Connection timeout: if Stream doesn't connect within 15 s, surface an error + retry button
  useEffect(() => {
    if (streamConnected) { setConnectFailed(false); return }
    const t = setTimeout(() => setConnectFailed(true), 15000)
    return () => clearTimeout(t)
  }, [streamConnected])

  // Init channel — wait until the Stream user is authenticated
  useEffect(() => {
    if (!user?.id || !streamClient || !streamConnected) return
    const client = streamClient
    let disposed = false
    let activeChannel: Channel | null = null

    // Keep handler refs so we can remove them precisely on cleanup
    let onNew: ((e: any) => void) | null = null
    let onDeleted: ((e: any) => void) | null = null
    let onUpdated: ((e: any) => void) | null = null
    let onReaction: ((e: any) => void) | null = null

    const init = async () => {
      try {
        const ch = client.channel('messaging', WORLD_CHANNEL_ID, {
          members: user?.id ? [user.id] : [],
        })
        await ch.watch()
        if (disposed) { ch.stopWatching(); return }
        activeChannel = ch
        setChannel(ch)

        // Load existing messages
        const state = ch.state
        const msgs = Object.values(state.messages || {}).map((m: any) => streamMsgToWC(m))
        setMessages(msgs.filter(m => !m.deleted))
        setPinnedMessages(msgs.filter(m => m.pinned && !m.deleted))
        setOnlineCount(Object.keys(state.members || {}).length)

        // Build handlers and store refs for deterministic cleanup
        onNew = (e: any) => {
          if (!e.message) return
          const msg = streamMsgToWC(e.message)
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        }
        onDeleted = (e: any) => {
          if (!e.message) return
          setMessages(prev => prev.filter(m => m.id !== e.message.id))
        }
        onUpdated = (e: any) => {
          if (!e.message) return
          const msg = streamMsgToWC(e.message)
          setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
          if (msg.pinned) {
            setPinnedMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          } else {
            setPinnedMessages(prev => prev.filter(m => m.id !== msg.id))
          }
        }
        onReaction = (e: any) => {
          if (!e.message) return
          const msg = streamMsgToWC(e.message)
          setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
        }

        ch.on('message.new', onNew)
        ch.on('message.deleted', onDeleted)
        ch.on('message.updated', onUpdated)
        ch.on('reaction.new', onReaction)
        ch.on('reaction.deleted', onReaction)
      } catch (err) {
        console.error('WorldChat init error:', err)
      }
    }

    init()
    return () => {
      disposed = true
      setChannel(null)
      if (activeChannel) {
        // Remove handlers before stopping — prevents duplicate subscriptions on re-init
        if (onNew) activeChannel.off('message.new', onNew)
        if (onDeleted) activeChannel.off('message.deleted', onDeleted)
        if (onUpdated) activeChannel.off('message.updated', onUpdated)
        if (onReaction) {
          activeChannel.off('reaction.new', onReaction)
          activeChannel.off('reaction.deleted', onReaction)
        }
        activeChannel.stopWatching().catch(() => {})
      }
    }
  // streamClient is a module-level singleton; exclude it from deps to avoid spurious re-runs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, streamConnected])

  // Auto-scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function streamMsgToWC(m: any): WCMessage {
    const reactions: Record<string, { count: number; me: boolean }> = {}
    const reactionCounts = m.reaction_counts || {}
    const myReactions = new Set((m.own_reactions || []).map((r: any) => r.type))
    for (const [type, count] of Object.entries(reactionCounts)) {
      reactions[type] = { count: count as number, me: myReactions.has(type) }
    }
    return {
      id: m.id,
      text: m.text || '',
      userId: m.user?.id || '',
      userName: m.user?.name || m.user?.id || 'Unknown',
      userAvatar: m.user?.image,
      createdAt: new Date(m.created_at || Date.now()),
      attachments: (m.attachments || []).map((a: any) => ({
        type: a.type || 'file',
        url: a.asset_url || a.image_url || a.url || '',
        name: a.title || a.fallback || 'attachment',
      })),
      replyTo: m.quoted_message ? {
        id: m.quoted_message.id,
        text: m.quoted_message.text || '',
        userName: m.quoted_message.user?.name || 'Unknown',
      } : undefined,
      reactions,
      pinned: !!m.pinned,
      deleted: m.type === 'deleted',
    }
  }

  const sendMessage = async () => {
    if (!channel || !text.trim() || sending) return
    setSending(true)
    const trimmed = text.trim()
    try {
      const payload: any = { text: trimmed }
      if (replyTo) payload.quoted_message_id = replyTo.id
      await channel.sendMessage(payload)
      setText('')
      setReplyTo(null)
      setShowEmoji(false)
    } catch (err: any) {
      console.error('WorldChat send error:', err)
      setVoiceError(err?.message || 'Failed to send message. Please try again.')
      setTimeout(() => setVoiceError(null), 4000)
    } finally {
      setSending(false)
    }
  }

  const sendAttachment = async (file: File) => {
    if (!channel || uploading) return
    setUploading(true)
    try {
      const url = await uploadToSufy(file, file.type.startsWith('image/') ? 'photos' : 'documents')
      const isImage = file.type.startsWith('image/')
      await channel.sendMessage({
        text: '',
        attachments: [{
          type: isImage ? 'image' : 'file',
          asset_url: url,
          image_url: isImage ? url : undefined,
          title: file.name,
        }],
      })
    } catch (err: any) {
      console.error('WorldChat attachment error:', err)
      setVoiceError(err?.message || 'File upload failed. Please try again.')
      setTimeout(() => setVoiceError(null), 4000)
    } finally {
      setUploading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []
      mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data)
      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        if (channel) {
          try {
            const url = await uploadToSufy(file, 'voice-notes')
            await channel.sendMessage({
              text: '🎤 Voice message',
              attachments: [{ type: 'audio', asset_url: url, title: 'Voice message' }],
            })
          } catch (err) {
            console.error('Voice note upload failed:', err)
          }
        }
      }
      mediaRecorder.current.start()
      setRecording(true)
    } catch {
      setVoiceError('Microphone access denied. Please allow mic permissions and try again.')
      setTimeout(() => setVoiceError(null), 4000)
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  const reactToMessage = async (msgId: string, reactionType: string) => {
    if (!channel) return
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return
    try {
      if (msg.reactions?.[reactionType]?.me) {
        await channel.deleteReaction(msgId, reactionType)
      } else {
        await channel.sendReaction(msgId, { type: reactionType })
      }
    } catch (err) { console.error(err) }
    setContextMsg(null)
  }

  const deleteMessage = async (msgId: string) => {
    if (!channel || !streamClient) return
    try { await streamClient.deleteMessage(msgId) } catch (err) { console.error(err) }
    setContextMsg(null)
  }

  const pinMessage = async (msgId: string, pinned: boolean) => {
    if (!channel || !streamClient) return
    try {
      if (pinned) {
        await streamClient.unpinMessage(msgId)
      } else {
        await streamClient.pinMessage(msgId)
      }
    } catch (err) { console.error(err) }
    setContextMsg(null)
  }

  const isMe = (msg: WCMessage) => msg.userId === user?.id

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50">
      {/* Voice / mic error banner */}
      <AnimatePresence>
        {voiceError && (
          <motion.div
            key="voice-error"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mx-4 mt-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm font-semibold text-red-500 flex-shrink-0"
          >
            <MicOff className="w-4 h-4 flex-shrink-0" />
            {voiceError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 py-3 dark:bg-[#130E1E] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-love-gradient flex items-center justify-center text-xl shadow-md shadow-pink-500/20">
              🌍
            </div>
            <div>
              <h1 className="font-display text-base font-black dark:text-white text-gray-900">World Chat</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] dark:text-gray-400 text-gray-500 font-semibold">
                  {onlineCount > 0 ? `${onlineCount} members` : 'Global community'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPinned(s => !s)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${showPinned ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600'}`}
            >
              <Pin className="w-3 h-3" /> Pinned {pinnedMessages.length > 0 && `(${pinnedMessages.length})`}
            </button>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100">
              <Users className="w-3 h-3 text-brand-pink" />
              <span className="text-xs dark:text-gray-400 text-gray-600 font-semibold">{onlineCount}</span>
            </div>
          </div>
        </div>

        {/* Pinned panel */}
        <AnimatePresence>
          {showPinned && pinnedMessages.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden">
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pinnedMessages.map(pm => (
                  <div key={pm.id} className="flex items-start gap-2 p-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/6 border-gray-200">
                    <Pin className="w-3 h-3 text-brand-pink flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-brand-pink">{pm.userName}</p>
                      <p className="text-xs dark:text-gray-300 text-gray-700 truncate">{pm.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" onClick={() => setContextMsg(null)}>
        {!streamConnected && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
            {connectFailed ? (
              <>
                <Globe className="w-10 h-10 text-gray-300" />
                <div className="text-center">
                  <p className="font-bold dark:text-white text-gray-900 mb-1">Connection failed</p>
                  <p className="text-sm dark:text-gray-400 text-gray-500">Check your connection and try again.</p>
                </div>
                <button onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-90 transition-opacity">
                  Retry
                </button>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
                <p className="text-sm dark:text-gray-400 text-gray-500">Connecting to World Chat…</p>
              </>
            )}
          </div>
        )}
        {streamConnected && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <div className="w-16 h-16 rounded-3xl bg-love-gradient flex items-center justify-center text-3xl shadow-lg shadow-pink-500/20">🌍</div>
            <p className="font-display font-black text-lg dark:text-white text-gray-900">World Chat</p>
            <p className="text-sm dark:text-gray-400 text-gray-500 text-center max-w-xs">The global community chat — say hello to everyone on SmartzConnect!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const mine = isMe(msg)
          const showAvatar = !mine && (i === 0 || messages[i - 1].userId !== msg.userId)
          const showName = showAvatar

          return (
            <div key={msg.id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
              {/* Avatar */}
              {!mine && (
                <div className="w-7 h-7 flex-shrink-0 self-end">
                  {showAvatar && (
                    <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center text-sm overflow-hidden">
                      {msg.userAvatar
                        ? <img src={msg.userAvatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[10px] text-white font-bold">{msg.userName[0]?.toUpperCase()}</span>
                      }
                    </div>
                  )}
                </div>
              )}

              <div className={`max-w-[72%] space-y-1 ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {showName && !mine && (
                  <p className="text-[10px] font-bold text-brand-pink px-1">{msg.userName}</p>
                )}

                {/* Reply preview */}
                {msg.replyTo && (
                  <div className={`px-2.5 py-1.5 rounded-xl border-l-2 border-brand-pink text-xs dark:bg-white/5 bg-gray-100 ${mine ? 'self-end' : 'self-start'}`}>
                    <p className="font-bold text-brand-pink text-[10px]">{msg.replyTo.userName}</p>
                    <p className="dark:text-gray-400 text-gray-500 truncate">{msg.replyTo.text}</p>
                  </div>
                )}

                <div
                  className={`relative group ${mine ? 'items-end' : 'items-start'} flex flex-col`}
                  onContextMenu={e => { e.preventDefault(); setContextMsg(msg) }}
                >
                  {/* Bubble */}
                  <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                    mine
                      ? 'bg-love-gradient text-white rounded-br-sm'
                      : 'dark:bg-[#1A1326] bg-white border dark:border-white/6 border-gray-200 dark:text-white text-gray-900 rounded-bl-sm'
                  }`}>
                    {/* Attachments */}
                    {msg.attachments?.map((att, ai) => (
                      <div key={ai} className="mb-1.5">
                        {att.type === 'image' && att.url && (
                          <img src={att.url} alt="" className="max-w-[200px] rounded-xl object-cover" />
                        )}
                        {att.type === 'audio' && att.url && (
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl dark:bg-white/10 bg-black/5">
                            <Volume2 className="w-4 h-4 flex-shrink-0" />
                            <audio controls src={att.url} className="h-7 max-w-[160px]" />
                          </div>
                        )}
                        {att.type === 'file' && att.url && (
                          <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 underline text-xs">
                            <Paperclip className="w-3 h-3" />{att.name || 'file'}
                          </a>
                        )}
                      </div>
                    ))}
                    {msg.text && <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}
                    {msg.text && (
                      <TranslateButton
                        text={msg.text}
                        compact
                        className={mine ? 'opacity-70 hover:opacity-100' : ''}
                      />
                    )}
                  </div>

                  {/* Quick actions on hover */}
                  <div className={`absolute ${mine ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <button onClick={() => setReplyTo(msg)}
                      className="w-6 h-6 rounded-full dark:bg-white/10 bg-gray-200 flex items-center justify-center hover:bg-love-soft transition-colors">
                      <CornerUpLeft className="w-3 h-3 dark:text-white text-gray-700" />
                    </button>
                    <button onClick={() => setContextMsg(msg)}
                      className="w-6 h-6 rounded-full dark:bg-white/10 bg-gray-200 flex items-center justify-center hover:bg-love-soft transition-colors">
                      <Smile className="w-3 h-3 dark:text-white text-gray-700" />
                    </button>
                  </div>

                  {/* Reactions display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-0.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(msg.reactions).map(([type, data]) => (
                        data.count > 0 && (
                          <button key={type}
                            onClick={() => reactToMessage(msg.id, type)}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              data.me
                                ? 'bg-love-gradient text-white shadow-sm'
                                : 'dark:bg-white/10 bg-gray-100 dark:text-gray-300 text-gray-700 hover:bg-love-soft'
                            }`}>
                            {QUICK_REACTIONS.find(r => r.name === type)?.emoji || type} {data.count}
                          </button>
                        )
                      ))}
                    </div>
                  )}
                </div>

                <p className={`text-[9px] dark:text-gray-600 text-gray-400 px-1 ${mine ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.createdAt)}
                  {msg.pinned && <span className="ml-1 text-brand-pink">📌</span>}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMsg && (
          <>
            <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" onClick={() => setContextMsg(null)} />
            <motion.div key="menu" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 bottom-32 z-50 dark:bg-[#1A1326] bg-white rounded-2xl border dark:border-white/10 border-gray-200 shadow-2xl overflow-hidden">
              {/* Reactions row */}
              <div className="flex items-center justify-around p-3 border-b dark:border-white/6 border-gray-100">
                {QUICK_REACTIONS.map(r => (
                  <button key={r.name} onClick={() => reactToMessage(contextMsg.id, r.name)}
                    className={`text-xl p-1.5 rounded-xl transition-all hover:scale-125 active:scale-95 ${
                      contextMsg.reactions?.[r.name]?.me ? 'bg-love-soft' : 'hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}>
                    {r.emoji}
                  </button>
                ))}
              </div>
              {/* Actions */}
              <div className="p-2">
                <button onClick={() => { setReplyTo(contextMsg); setContextMsg(null) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 text-sm dark:text-white text-gray-900 transition-colors">
                  <CornerUpLeft className="w-4 h-4 text-brand-pink" /> Reply
                </button>
                <button onClick={() => pinMessage(contextMsg.id, contextMsg.pinned || false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 text-sm dark:text-white text-gray-900 transition-colors">
                  <Pin className="w-4 h-4 text-amber-400" /> {contextMsg.pinned ? 'Unpin' : 'Pin'} Message
                </button>
                {isMe(contextMsg) && (
                  <button onClick={() => deleteMessage(contextMsg.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-sm text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" /> Unsend / Delete
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reply bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="mx-3 px-3 py-2 rounded-t-xl dark:bg-white/5 bg-gray-100 border dark:border-white/10 border-gray-200 border-b-0 flex items-center gap-2">
            <CornerUpLeft className="w-3.5 h-3.5 text-brand-pink flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-brand-pink">{replyTo.userName}</p>
              <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{replyTo.text}</p>
            </div>
            <button onClick={() => setReplyTo(null)}>
              <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500 hover:text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-3 pb-3 pt-1.5 dark:bg-[#0D0A14] bg-gray-50 flex-shrink-0 relative">
        <div className="flex items-end gap-2">
          <div className={`flex-1 flex items-end gap-2 dark:bg-[#130E1E] bg-white border dark:border-white/10 border-gray-200 rounded-2xl px-3 py-2 ${replyTo ? 'rounded-t-none' : ''}`}>
            {/* Emoji */}
            <button onClick={() => setShowEmoji(s => !s)}
              className="w-7 h-7 flex items-center justify-center dark:text-gray-400 text-gray-500 hover:text-brand-pink transition-colors flex-shrink-0 self-end">
              <Smile className="w-4 h-4" />
            </button>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Say something to the world…"
              rows={1}
              className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-600 placeholder:text-gray-400 focus:outline-none resize-none max-h-24 self-center"
              style={{ minHeight: '24px' }}
            />
            {/* Attachment */}
            <input ref={fileRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) sendAttachment(f); e.target.value = '' }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-7 h-7 flex items-center justify-center dark:text-gray-400 text-gray-500 hover:text-brand-pink transition-colors flex-shrink-0 self-end disabled:opacity-40">
              {uploading ? <div className="w-3.5 h-3.5 border border-brand-pink/40 border-t-brand-pink rounded-full animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
          </div>

          {/* Mic / Send */}
          {text.trim() ? (
            <button onClick={sendMessage} disabled={sending}
              className="w-11 h-11 rounded-2xl bg-love-gradient flex items-center justify-center shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-60 flex-shrink-0">
              {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          ) : (
            <button
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all flex-shrink-0 ${recording ? 'bg-red-500 shadow-red-500/30 scale-110' : 'bg-love-gradient shadow-pink-500/20 hover:scale-105'}`}
            >
              {recording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
            </button>
          )}
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-3 mb-1 z-50">
              <EmojiPicker onSelect={emoji => { setText(t => t + emoji); setShowEmoji(false) }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
