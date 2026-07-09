import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip,
  Mic, MicOff, Check, CheckCheck, Play, Pause, Flag, X, Loader2, WifiOff, Square
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToSufy } from '@/lib/sufy'
import { useAuth } from '@/hooks/useAuth'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { useStream } from '@/contexts/StreamContext'
import { getOrCreateDirectChannel } from '@/lib/stream'
import ReportBlockModal from '@/components/ReportBlockModal'
import EmojiPicker from '@/components/EmojiPicker'
import TranslateButton from '@/components/TranslateButton'
import type { Channel } from 'stream-chat'

interface Message {
  id: string
  text: string
  time: string
  mine: boolean
  status: 'sent' | 'delivered' | 'read'
  type: 'text' | 'voice' | 'image' | 'file'
  audioUrl?: string
  imageUrl?: string
  fileUrl?: string
  fileName?: string
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
  const attach = m.attachments?.[0]
  const isVoice = attach?.type === 'voice'
  const isImage = !isVoice && attach?.type === 'image'
  const isFile  = !isVoice && !isImage && !!attach
  return {
    id: m.id,
    text: m.text || '',
    time: new Date(m.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    mine: m.user?.id === myId,
    status: 'read',
    type: isVoice ? 'voice' : isImage ? 'image' : isFile ? 'file' : 'text',
    audioUrl:  isVoice ? (attach?.asset_url || attach?.url) : undefined,
    imageUrl:  isImage ? (attach?.image_url || attach?.asset_url) : undefined,
    fileUrl:   isFile  ? attach?.asset_url : undefined,
    fileName:  (isImage || isFile) ? (attach?.title || attach?.fallback) : undefined,
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
  const [uploadingFile, setUploadingFile] = useState(false)
  const [connectTimeout, setConnectTimeout] = useState(false)
  const [input, setInput] = useState('')
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [sending, setSending] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<Channel | null>(null)
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  // Cleanup recording resources on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      Object.values(audioRefs.current).forEach(a => { a.pause(); a.src = '' })
    }
  }, [])

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
      // Null out ref so in-flight sends from a previous mount don't proceed
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
    try { await channelRef.current.stopTyping() } catch {}

    // Use a client-side temp ID only for optimistic UI; Stream will assign its own server ID.
    const clientId = `client-${user.id.replace(/-/g, '').slice(0, 12)}-${Date.now()}`
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
      const response = await channelRef.current.sendMessage({ text } as any)
      // Replace the optimistic message with the server-confirmed message ID
      const serverId = response.message?.id
      setMessages(prev => prev.map(m =>
        m.id === clientId
          ? { ...m, id: serverId ?? m.id, status: 'delivered' }
          : m
      ))
    } catch (err: any) {
      console.error('Send error:', err)
      // Remove the failed optimistic message and surface an error
      setMessages(prev => prev.filter(m => m.id !== clientId))
      setVoiceError(err?.message || 'Failed to send message. Please try again.')
      setTimeout(() => setVoiceError(null), 4000)
      setInput(text) // restore input so user can retry
    } finally {
      setSending(false)
    }
  }, [input, connected, user?.id])

  const addReaction = async (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reaction: emoji } : m))
    setShowReactions(null)
    try { await channelRef.current?.sendReaction(msgId, { type: emoji }) } catch {}
  }

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !channelRef.current || !user?.id) return
    e.target.value = ''
    setUploadingFile(true)
    try {
      const isImage = file.type.startsWith('image/')
      const folder = isImage ? 'photos' : 'documents'
      const url = await uploadToSufy(file, folder as any)
      const clientId = `file-${user.id.slice(0, 8)}-${Date.now()}`
      const optimistic: Message = {
        id: clientId,
        text: isImage ? '' : `📎 ${file.name}`,
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        mine: true,
        status: 'sent',
        type: isImage ? 'image' : 'file',
        imageUrl: isImage ? url : undefined,
        fileUrl: isImage ? undefined : url,
        fileName: file.name,
      }
      setMessages(prev => [...prev, optimistic])
      await channelRef.current!.sendMessage({
        id: clientId,
        text: isImage ? '' : `📎 ${file.name}`,
        attachments: [{
          type: isImage ? 'image' : 'file',
          asset_url: url,
          image_url: isImage ? url : undefined,
          title: file.name,
          mime_type: file.type,
        }],
      } as any)
      setMessages(prev => prev.map(m => m.id === clientId ? { ...m, status: 'delivered' } : m))
    } catch (err: any) {
      console.error('File upload error:', err)
      setVoiceError(err?.message || 'File upload failed. Please try again.')
      setTimeout(() => setVoiceError(null), 4000)
    }
    setUploadingFile(false)
  }

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop()
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      setIsRecording(false)
      setRecordingTime(0)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        if (blob.size < 1000 || !channelRef.current || !user?.id) return

        setUploadingVoice(true)
        try {
          const ext = mimeType === 'audio/webm' ? 'webm' : 'ogg'
          const path = `${user.id}/${Date.now()}.${ext}`
          const { error: upErr } = await supabase.storage.from('voice-messages').upload(path, blob, { contentType: mimeType })
          if (upErr) throw upErr
          const { data: urlData } = supabase.storage.from('voice-messages').getPublicUrl(path)
          const audioUrl = urlData.publicUrl

          const clientId = `voice-${user.id.slice(0, 8)}-${Date.now()}`
          const optimistic: Message = {
            id: clientId, text: '🎙️ Voice message', time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
            mine: true, status: 'sent', type: 'voice', audioUrl,
          }
          setMessages(prev => [...prev, optimistic])

          await channelRef.current!.sendMessage({
            id: clientId,
            text: '🎙️ Voice message',
            attachments: [{ type: 'voice', asset_url: audioUrl, url: audioUrl, mime_type: mimeType }],
          } as any)
          setMessages(prev => prev.map(m => m.id === clientId ? { ...m, status: 'delivered' } : m))
        } catch (err) {
          console.error('Voice upload error:', err)
        }
        setUploadingVoice(false)
      }

      recorder.start(200)
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
      setVoiceError('Microphone access denied. Allow mic access and try again.')
      setTimeout(() => setVoiceError(null), 4000)
    }
  }

  const toggleAudio = (msgId: string, audioUrl: string) => {
    const existing = audioRefs.current[msgId]
    if (existing) {
      if (!existing.paused) { existing.pause(); setPlayingId(null) }
      else { existing.play(); setPlayingId(msgId) }
      return
    }
    const audio = new Audio(audioUrl)
    audioRefs.current[msgId] = audio
    audio.onended = () => setPlayingId(null)
    audio.play()
    setPlayingId(msgId)
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

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
              <p className="font-bold dark:text-gray-900 text-gray-900 mb-2">Connection failed</p>
              <p className="text-sm dark:text-gray-500 text-gray-500 leading-relaxed max-w-xs">
                Could not connect to chat. Check your internet connection and try again.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-90 transition-opacity"
            >
              Retry
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
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <button
                          onClick={e => { e.stopPropagation(); if (msg.audioUrl) toggleAudio(msg.id, msg.audioUrl) }}
                          className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
                        >
                          {playingId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex gap-0.5 items-center">
                          {Array.from({ length: 18 }).map((_, j) => (
                            <div key={j} className="w-0.5 rounded-full bg-current opacity-60" style={{ height: `${6 + (j * 7 % 12)}px` }} />
                          ))}
                        </div>
                      </div>
                    ) : msg.type === 'image' && msg.imageUrl ? (
                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                        <img src={msg.imageUrl} alt={msg.fileName || 'Image'} className="max-w-[220px] max-h-52 rounded-xl object-cover" />
                      </a>
                    ) : msg.type === 'file' && msg.fileUrl ? (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 py-0.5">
                        <Paperclip className="w-4 h-4 flex-shrink-0 opacity-80" />
                        <span className="text-sm underline underline-offset-2 truncate max-w-[180px]">{msg.fileName || 'File'}</span>
                      </a>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        {msg.text && (
                          <TranslateButton
                            text={msg.text}
                            className={msg.mine ? 'opacity-70 hover:opacity-100' : ''}
                          />
                        )}
                      </>
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

      {/* Recording indicator / error */}
      <AnimatePresence>
        {voiceError && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-red-200 border-red-200 whitespace-nowrap max-w-xs">
            <span className="text-xs font-semibold text-red-500">{voiceError}</span>
            <button onClick={() => setVoiceError(null)} className="text-gray-400 hover:text-red-500 ml-1"><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
        {isRecording && !voiceError && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-red-200 border-red-100 whitespace-nowrap">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold dark:text-gray-900 text-gray-900">Recording {fmtTime(recordingTime)}</span>
            <button onClick={toggleRecording} className="text-red-500 hover:text-red-600 ml-1"><Square className="w-3.5 h-3.5 fill-current" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-3 py-3 dark:bg-white bg-white border-t dark:border-pink-200 border-gray-100 flex-shrink-0">
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.zip,.mp4,.mov" className="hidden" onChange={handleFileAttach} />
        <div className="flex items-center gap-2 dark:bg-pink-50 dark:border dark:border-pink-200 bg-gray-100 border border-transparent rounded-2xl px-3 py-2 focus-within:dark:border-pink-400">
          <button onClick={() => setShowEmoji(!showEmoji)} className="text-lg hover:scale-110 transition-transform">😊</button>
          <input value={input} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={connected ? 'Message…' : 'Connecting…'} disabled={!connected || isRecording}
            className="flex-1 bg-transparent text-sm dark:text-gray-900 text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-400 focus:outline-none disabled:opacity-50" />
          <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="dark:text-gray-400 text-gray-400 hover:text-brand-pink transition-colors disabled:opacity-50">
              {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin text-brand-pink" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleRecording}
              disabled={uploadingVoice}
              className={`transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'dark:text-gray-400 text-gray-400 hover:text-brand-pink'}`}
            >
              {uploadingVoice ? <Loader2 className="w-4 h-4 animate-spin text-brand-pink" /> : isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button onClick={send} disabled={!input.trim() || sending || !connected || isRecording || uploadingFile}
              className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all ml-1">
              {sending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
