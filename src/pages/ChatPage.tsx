import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip,
  Mic, MicOff, Check, CheckCheck, Play, Pause, Flag, X, Loader2, WifiOff, Square,
  Reply, Sticker, Search, Palette, Eye, EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToSufy } from '@/lib/sufy'
import { useAuth } from '@/hooks/useAuth'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { useStream } from '@/contexts/StreamContext'
import { getOrCreateDirectChannel } from '@/lib/stream'
import { streamClient } from '@/lib/stream'
import { useTheme, CHAT_THEME_PRESETS } from '@/contexts/ThemeContext'
import type { ChatTheme } from '@/contexts/ThemeContext'
import ReportBlockModal from '@/components/ReportBlockModal'
import EmojiPicker from '@/components/EmojiPicker'
import TranslateButton from '@/components/TranslateButton'
import MessageActionMenu from '@/components/chat/MessageActionMenu'
import type { Channel } from 'stream-chat'

interface ReactionCount {
  emoji: string
  count: number
  iMine: boolean
}

interface QuotedMsg {
  id: string
  text: string
  authorName: string
  type: 'text' | 'voice' | 'image' | 'file'
}

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
  deleted?: boolean
  reactions?: ReactionCount[]
  quotedMsg?: QuotedMsg
  viewOnce?: boolean
  viewedBy?: string[]
}

interface Participant {
  id: string
  name: string
  emoji: string
  online: boolean
  avatar_url?: string
}

interface ForwardContact {
  id: string
  name: string
  avatar?: string
}

// Stickers as large emoji tiles
const STICKERS = [
  '😍','🥰','😘','💕','🔥','✨','🎉','🙈',
  '💯','😂','🤣','😭','👀','🫶','💪','🌸',
  '🥺','😎','🤩','💀',
]

function mapReactions(m: any, myId: string): ReactionCount[] {
  const counts: Record<string, { count: number; iMine: boolean }> = {}
  if (m.reaction_counts) {
    for (const [emoji, count] of Object.entries(m.reaction_counts as Record<string, number>)) {
      counts[emoji] = { count, iMine: false }
    }
  }
  if (m.own_reactions) {
    for (const r of (m.own_reactions as any[])) {
      if (counts[r.type]) counts[r.type].iMine = true
      else counts[r.type] = { count: 1, iMine: true }
    }
  }
  return Object.entries(counts).map(([emoji, v]) => ({ emoji, count: v.count, iMine: v.iMine }))
}

function mapQuotedMsg(m: any): QuotedMsg | undefined {
  const qm = m.quoted_message
  if (!qm) return undefined
  const attach = qm.attachments?.[0]
  const type = attach?.type === 'voice' ? 'voice' : attach?.type === 'image' ? 'image' : attach ? 'file' : 'text'
  return {
    id: qm.id,
    text: qm.text || (type === 'voice' ? '🎙️ Voice message' : type === 'image' ? '🖼️ Image' : type === 'file' ? '📎 File' : ''),
    authorName: qm.user?.name || qm.user?.id?.slice(0, 8) || 'User',
    type,
  }
}

// Detect if a URL points to a video file
function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm)(\?|$)/i.test(url)
}

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
    deleted: m.deleted_at != null || m.type === 'deleted',
    reactions: mapReactions(m, myId),
    quotedMsg: mapQuotedMsg(m),
    viewOnce: m.view_once === true,
    viewedBy: Array.isArray(m.viewed_by) ? m.viewed_by : [],
  }
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { connected } = useStream()
  const { initiateCall } = useLiveKitCall()
  const { chatTheme, setChatTheme } = useTheme()
  const [showThemePicker, setShowThemePicker] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [connectTimeout, setConnectTimeout] = useState(false)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [sending, setSending] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Action menu state
  const [actionMenuMsgId, setActionMenuMsgId] = useState<string | null>(null)

  // Reaction picker state
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null)

  // Reply state
  const [replyingTo, setReplyingTo] = useState<QuotedMsg | null>(null)

  // Forward state
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null)
  const [forwardContacts, setForwardContacts] = useState<ForwardContact[]>([])
  const [forwardSearch, setForwardSearch] = useState('')
  const [forwardLoading, setForwardLoading] = useState(false)
  const [forwarding, setForwarding] = useState(false)

  // View-once state
  const [pendingViewOnce, setPendingViewOnce] = useState(false)
  const [viewOnceOverlay, setViewOnceOverlay] = useState<{ msgId: string; url: string; isVideo: boolean } | null>(null)

  // Long-press support for mobile
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<Channel | null>(null)
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 4000)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      Object.values(audioRefs.current).forEach(a => { a.pause(); a.src = '' })
    }
  }, [])

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

  useEffect(() => {
    if (connected) { setConnectTimeout(false); return }
    const t = setTimeout(() => {
      setConnectTimeout(true)
      setLoading(false)
    }, 10000)
    return () => clearTimeout(t)
  }, [connected])

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
      if (m.user?.id === user.id) return
      setMessages(prev => {
        if (prev.some(msg => msg.id === m.id)) return prev
        return [...prev, mapStreamMessage(m, user.id!)]
      })
      channel.markRead().catch(() => {})
    }

    const handleUpdated = (event: any) => {
      if (cancelled || !event.message) return
      const m = event.message
      setMessages(prev => prev.map(msg =>
        msg.id === m.id ? { ...mapStreamMessage(m, user.id!), mine: msg.mine } : msg
      ))
    }

    const handleDeleted = (event: any) => {
      if (cancelled || !event.message) return
      const m = event.message
      setMessages(prev => prev.map(msg =>
        msg.id === m.id ? { ...msg, deleted: true, text: '' } : msg
      ))
    }

    const handleReaction = (event: any) => {
      if (cancelled || !event.message) return
      const m = event.message
      setMessages(prev => prev.map(msg =>
        msg.id === m.id ? { ...msg, reactions: mapReactions(m, user.id!) } : msg
      ))
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
      setMessages(prev => prev.map(m => m.mine ? { ...m, status: 'read' } : m))
    }

    channel.on('message.new', handleNew)
    channel.on('message.updated', handleUpdated)
    channel.on('message.deleted', handleDeleted)
    channel.on('reaction.new', handleReaction)
    channel.on('reaction.deleted', handleReaction)
    channel.on('typing.start', handleTypingStart)
    channel.on('typing.stop', handleTypingStop)
    channel.on('message.read', handleRead)

    return () => {
      cancelled = true
      channel.off('message.new', handleNew)
      channel.off('message.updated', handleUpdated)
      channel.off('message.deleted', handleDeleted)
      channel.off('reaction.new', handleReaction)
      channel.off('reaction.deleted', handleReaction)
      channel.off('typing.start', handleTypingStart)
      channel.off('typing.stop', handleTypingStop)
      channel.off('message.read', handleRead)
      channelRef.current = null
      setOtherTyping(false)
    }
  }, [connected, user?.id, id])

  const handleCall = (type: 'video' | 'audio') => {
    if (!id) return
    initiateCall({
      contactId: id,
      contactName: participant?.name || 'User',
      contactAvatar: participant?.avatar_url,
      type,
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (channelRef.current && connected) {
      channelRef.current.keystroke().catch(() => {})
      if (typingStopRef.current) clearTimeout(typingStopRef.current)
      typingStopRef.current = setTimeout(() => {
        channelRef.current?.stopTyping().catch(() => {})
      }, 3000)
    }
  }

  const send = useCallback(async (overrideText?: string, extraPayload?: Record<string, any>) => {
    const text = (overrideText ?? input).trim()
    if (!text || !channelRef.current || !connected || !user?.id) return

    if (typingStopRef.current) clearTimeout(typingStopRef.current)
    try { await channelRef.current.stopTyping() } catch {}

    const clientId = `client-${user.id.replace(/-/g, '').slice(0, 12)}-${Date.now()}`
    const optimistic: Message = {
      id: clientId,
      text,
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      mine: true,
      status: 'sent',
      type: 'text',
      quotedMsg: replyingTo ?? undefined,
    }
    setMessages(prev => [...prev, optimistic])
    if (!overrideText) setInput('')
    const replyRef = replyingTo
    setReplyingTo(null)
    setSending(true)

    try {
      const payload: any = { text, ...extraPayload }
      if (replyRef?.id) {
        payload.quoted_message_id = replyRef.id
      }
      const response = await channelRef.current.sendMessage(payload)
      const serverId = response.message?.id
      setMessages(prev => prev.map(m =>
        m.id === clientId
          ? { ...m, id: serverId ?? m.id, status: 'delivered' }
          : m
      ))
    } catch (err: any) {
      console.error('Send error:', err)
      setMessages(prev => prev.filter(m => m.id !== clientId))
      showError(err?.message || 'Failed to send message. Please try again.')
      if (!overrideText) setInput(text)
    } finally {
      setSending(false)
    }
  }, [input, connected, user?.id, replyingTo])

  const addReaction = async (msgId: string, emoji: string) => {
    setReactionPickerMsgId(null)
    const msg = messages.find(m => m.id === msgId)
    const existing = msg?.reactions?.find(r => r.emoji === emoji && r.iMine)
    try {
      if (existing) {
        // Toggle off: remove own reaction
        setMessages(prev => prev.map(m => {
          if (m.id !== msgId) return m
          const updated = (m.reactions || [])
            .map(r => r.emoji === emoji ? { ...r, count: r.count - 1, iMine: false } : r)
            .filter(r => r.count > 0)
          return { ...m, reactions: updated }
        }))
        await channelRef.current?.deleteReaction(msgId, emoji)
      } else {
        setMessages(prev => prev.map(m => {
          if (m.id !== msgId) return m
          const existing2 = (m.reactions || []).find(r => r.emoji === emoji)
          const updated = existing2
            ? (m.reactions || []).map(r => r.emoji === emoji ? { ...r, count: r.count + 1, iMine: true } : r)
            : [...(m.reactions || []), { emoji, count: 1, iMine: true }]
          return { ...m, reactions: updated }
        }))
        await channelRef.current?.sendReaction(msgId, { type: emoji })
      }
    } catch (err) {
      console.error('Reaction error:', err)
    }
  }

  const deleteMessage = async (msgId: string) => {
    // Optimistically mark deleted
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true, text: '' } : m))
    try {
      await streamClient?.deleteMessage(msgId)
    } catch (err: any) {
      console.error('Delete error:', err)
      // Revert
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: false } : m))
      showError(err?.message || 'Could not delete message.')
    }
  }

  // Load contacts for forward picker
  const openForward = async (msg: Message) => {
    setForwardMsg(msg)
    if (forwardContacts.length > 0) return
    setForwardLoading(true)
    try {
      const { data } = await supabase
        .from('follows')
        .select('following_id, profiles:following_id(id, full_name, avatar_url)')
        .eq('follower_id', user?.id)
        .limit(30)
      const list: ForwardContact[] = (data ?? [])
        .map((f: any) => f.profiles)
        .filter(Boolean)
        .map((p: any) => ({ id: p.id, name: p.full_name || 'User', avatar: p.avatar_url }))
      setForwardContacts(list)
    } catch (err) {
      console.error('Forward contacts error:', err)
    }
    setForwardLoading(false)
  }

  const forwardTo = async (contact: ForwardContact) => {
    if (!forwardMsg || !user?.id || !streamClient) return
    setForwarding(true)
    try {
      const targetChan = getOrCreateDirectChannel(user.id, contact.id)
      await targetChan.watch()
      const payload: any = { text: forwardMsg.text || '' }
      if (forwardMsg.type === 'voice' && forwardMsg.audioUrl) {
        payload.attachments = [{ type: 'voice', asset_url: forwardMsg.audioUrl, url: forwardMsg.audioUrl }]
      } else if (forwardMsg.type === 'image' && forwardMsg.imageUrl) {
        payload.attachments = [{ type: 'image', asset_url: forwardMsg.imageUrl, image_url: forwardMsg.imageUrl, title: forwardMsg.fileName }]
      } else if (forwardMsg.type === 'file' && forwardMsg.fileUrl) {
        payload.attachments = [{ type: 'file', asset_url: forwardMsg.fileUrl, title: forwardMsg.fileName }]
      }
      await targetChan.sendMessage(payload)
      setForwardMsg(null)
      setForwardSearch('')
    } catch (err: any) {
      console.error('Forward error:', err)
      showError(err?.message || 'Failed to forward message.')
    }
    setForwarding(false)
  }

  // Mark a view-once message as viewed by the current user
  const markViewOnceViewed = useCallback(async (msgId: string) => {
    if (!user?.id || !streamClient) return
    try {
      const currentMsg = messages.find(m => m.id === msgId)
      const alreadyViewed = currentMsg?.viewedBy?.includes(user.id)
      if (alreadyViewed) return
      const newViewedBy = [...(currentMsg?.viewedBy ?? []), user.id]
      // Optimistically update local state
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, viewedBy: newViewedBy } : m
      ))
      // Persist to Stream via partialUpdateMessage
      await streamClient.partialUpdateMessage(msgId, { set: { viewed_by: newViewedBy } })
    } catch (err) {
      console.error('markViewOnceViewed error:', err)
    }
  }, [user?.id, messages])

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !channelRef.current || !user?.id) return
    e.target.value = ''
    setUploadingFile(true)
    try {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const folder = isImage ? 'photos' : 'documents'
      const url = await uploadToSufy(file, folder as any)
      const clientId = `file-${user.id.slice(0, 8)}-${Date.now()}`
      const mediaType = isImage ? 'image' : 'file'
      const viewOnceFlag = pendingViewOnce && (isImage || isVideo)
      const optimistic: Message = {
        id: clientId,
        text: isImage || isVideo ? '' : `📎 ${file.name}`,
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        mine: true,
        status: 'sent',
        type: mediaType,
        imageUrl: isImage ? url : undefined,
        fileUrl: (isVideo || (!isImage && !isVideo)) ? url : undefined,
        fileName: file.name,
        viewOnce: viewOnceFlag,
        viewedBy: [],
      }
      setMessages(prev => [...prev, optimistic])
      setPendingViewOnce(false)
      const msgPayload: any = {
        id: clientId,
        text: isImage || isVideo ? '' : `📎 ${file.name}`,
        attachments: [{
          type: mediaType,
          asset_url: url,
          image_url: isImage ? url : undefined,
          title: file.name,
          mime_type: file.type,
        }],
      }
      if (viewOnceFlag) {
        msgPayload.view_once = true
        msgPayload.viewed_by = []
      }
      await channelRef.current!.sendMessage(msgPayload)
      setMessages(prev => prev.map(m => m.id === clientId ? { ...m, status: 'delivered' } : m))
    } catch (err: any) {
      console.error('File upload error:', err)
      showError(err?.message || 'File upload failed. Please try again.')
    }
    setUploadingFile(false)
  }

  const toggleRecording = async () => {
    if (isRecording) {
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
      showError('Microphone access denied. Allow mic access and try again.')
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

  const sendSticker = async (emoji: string) => {
    setShowStickers(false)
    await send(emoji)
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleMsgLongPress = (msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      setActionMenuMsgId(msgId)
    }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const person = participant

  const filteredForwardContacts = forwardContacts.filter(c =>
    c.name.toLowerCase().includes(forwardSearch.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col chat-page-bg relative">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 dark:bg-white bg-white border-b dark:border-pink-200 border-gray-100 flex-shrink-0">
        <Link to="/app/matches" className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
          <ArrowLeft className="w-4 h-4 dark:text-gray-700 text-gray-600" />
        </Link>
        <div
          className="relative cursor-pointer"
          onClick={() => { if (id && id !== user?.id) navigate(`/app/user/${id}`) }}
        >
          <div className="w-10 h-10 rounded-full dark:bg-pink-100 bg-gray-100 flex items-center justify-center text-xl overflow-hidden ring-2 ring-purple-500/20">
            {person?.avatar_url ? <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" /> : (person?.emoji || '👤')}
          </div>
          {person?.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 dark:border-white border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-sm dark:text-gray-900 text-gray-900 truncate cursor-pointer hover:text-brand-pink transition-colors"
            onClick={() => { if (id && id !== user?.id) navigate(`/app/user/${id}`) }}
          >{person?.name || 'Chat'}</p>
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
                  className="absolute top-10 right-0 z-20 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-pink-200 border-gray-100 overflow-hidden min-w-[160px]"
                  onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setShowThemePicker(p => !p); setShowMenu(false) }} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm dark:text-gray-700 text-gray-700 hover:bg-gray-50 transition-colors">
                    <Palette className="w-4 h-4 text-purple-400" /> Chat Theme
                  </button>
                  <button onClick={() => { setShowReport(true); setShowMenu(false) }} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors">
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

      {/* Chat Theme Picker Panel */}
      <AnimatePresence>
        {showThemePicker && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 py-3 dark:bg-white bg-white border-b dark:border-pink-100 border-gray-100 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold dark:text-gray-700 text-gray-700">Chat Theme</p>
              <button onClick={() => setShowThemePicker(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(CHAT_THEME_PRESETS) as [ChatTheme, typeof CHAT_THEME_PRESETS[ChatTheme]][]).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setChatTheme(key)}
                  className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all ${chatTheme === key ? 'ring-2 ring-offset-1 dark:ring-offset-white ring-purple-400 scale-105' : 'opacity-70 hover:opacity-100'}`}
                  style={{ background: preset.vars.bubbleMine }}
                >
                  <span className="text-lg leading-none">{preset.emoji}</span>
                  <span className="text-white text-[9px] font-bold drop-shadow">{preset.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        onClick={() => { setActionMenuMsgId(null); setReactionPickerMsgId(null); setShowEmoji(false); setShowStickers(false) }}
      >
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
                  {/* Message bubble */}
                  <div
                    onMouseDown={() => handleMsgLongPress(msg.id)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={() => handleMsgLongPress(msg.id)}
                    onTouchEnd={cancelLongPress}
                    onContextMenu={e => { e.preventDefault(); setActionMenuMsgId(msg.id) }}
                    onClick={e => { e.stopPropagation(); setActionMenuMsgId(actionMenuMsgId === msg.id ? null : msg.id) }}
                    className={`px-4 py-2.5 rounded-2xl cursor-pointer select-none ${
                      msg.mine
                        ? 'chat-bubble-mine rounded-br-sm'
                        : 'chat-bubble-theirs dark:border rounded-bl-sm dark:shadow-sm'
                    }`}
                  >
                    {/* Quoted reply block */}
                    {msg.quotedMsg && !msg.deleted && (
                      <div className={`mb-2 pl-2 border-l-2 ${msg.mine ? 'border-white/50' : 'border-pink-400'} opacity-80`}>
                        <p className={`text-[10px] font-semibold mb-0.5 ${msg.mine ? 'text-white/80' : 'text-pink-500'}`}>
                          {msg.quotedMsg.authorName}
                        </p>
                        <p className="text-xs truncate opacity-90">{msg.quotedMsg.text || '📎 Attachment'}</p>
                      </div>
                    )}

                    {msg.deleted ? (
                      <p className="text-sm italic opacity-60">This message was deleted</p>
                    ) : msg.type === 'voice' ? (
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
                      (() => {
                        if (msg.viewOnce) {
                          const alreadyViewed = msg.viewedBy?.includes(user?.id ?? '')
                          if (msg.mine) {
                            // Sender always sees their own media normally
                            return (
                              <div className="relative">
                                <img src={msg.imageUrl} alt={msg.fileName || 'Image'} className="max-w-[220px] max-h-52 rounded-xl object-cover" />
                                <span className="absolute top-1 right-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Eye className="w-2.5 h-2.5" /> View once
                                </span>
                              </div>
                            )
                          }
                          if (alreadyViewed) {
                            return (
                              <div className="flex items-center gap-2 px-2 py-1 opacity-60">
                                <EyeOff className="w-4 h-4" />
                                <span className="text-xs italic">Photo · Viewed</span>
                              </div>
                            )
                          }
                          return (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                setViewOnceOverlay({ msgId: msg.id, url: msg.imageUrl!, isVideo: false })
                              }}
                              className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-xl bg-black/20"
                            >
                              <Eye className="w-6 h-6" />
                              <span className="text-xs font-semibold">Photo · Tap to view once</span>
                            </button>
                          )
                        }
                        return (
                          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                            <img src={msg.imageUrl} alt={msg.fileName || 'Image'} className="max-w-[220px] max-h-52 rounded-xl object-cover" />
                          </a>
                        )
                      })()
                    ) : msg.type === 'file' && msg.fileUrl ? (
                      (() => {
                        const fileUrl = msg.fileUrl!
                        if (isVideoUrl(fileUrl)) {
                          if (msg.viewOnce) {
                            const alreadyViewed = msg.viewedBy?.includes(user?.id ?? '')
                            if (msg.mine) {
                              return (
                                <div className="relative">
                                  <video src={fileUrl} controls className="max-w-[220px] max-h-52 rounded-xl" />
                                  <span className="absolute top-1 right-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Eye className="w-2.5 h-2.5" /> View once
                                  </span>
                                </div>
                              )
                            }
                            if (alreadyViewed) {
                              return (
                                <div className="flex items-center gap-2 px-2 py-1 opacity-60">
                                  <EyeOff className="w-4 h-4" />
                                  <span className="text-xs italic">Video · Viewed</span>
                                </div>
                              )
                            }
                            return (
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  setViewOnceOverlay({ msgId: msg.id, url: fileUrl, isVideo: true })
                                }}
                                className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-xl bg-black/20"
                              >
                                <Eye className="w-6 h-6" />
                                <span className="text-xs font-semibold">Video · Tap to view once</span>
                              </button>
                            )
                          }
                          return (
                            <video src={fileUrl} controls onClick={e => e.stopPropagation()} className="max-w-[220px] max-h-52 rounded-xl" />
                          )
                        }
                        return (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="flex items-center gap-2 py-0.5">
                            <Paperclip className="w-4 h-4 flex-shrink-0 opacity-80" />
                            <span className="text-sm underline underline-offset-2 truncate max-w-[180px]">{msg.fileName || 'File'}</span>
                          </a>
                        )
                      })()
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

                  {/* Action menu */}
                  <MessageActionMenu
                    open={actionMenuMsgId === msg.id}
                    isMine={msg.mine}
                    onClose={() => setActionMenuMsgId(null)}
                    onDelete={msg.mine && !msg.deleted ? () => deleteMessage(msg.id) : undefined}
                    onForward={() => openForward(msg)}
                    onReply={() => {
                      setReplyingTo({
                        id: msg.id,
                        text: msg.deleted ? 'Deleted message' : (msg.text || (msg.type === 'voice' ? '🎙️ Voice message' : msg.type === 'image' ? '🖼️ Image' : '📎 File')),
                        authorName: msg.mine ? (user?.user_metadata?.full_name || 'You') : (participant?.name || 'User'),
                        type: msg.type,
                      })
                    }}
                    onReact={() => setReactionPickerMsgId(msg.id)}
                    align={msg.mine ? 'right' : 'left'}
                  />

                  {/* Reaction picker */}
                  <AnimatePresence>
                    {reactionPickerMsgId === msg.id && (
                      <div
                        className={`absolute ${msg.mine ? 'right-0' : 'left-0'} -top-14 z-20`}
                        onClick={e => e.stopPropagation()}
                      >
                        <EmojiPicker
                          onSelect={emoji => addReaction(msg.id, emoji)}
                          onClose={() => setReactionPickerMsgId(null)}
                        />
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Aggregated reactions */}
                  {!msg.deleted && msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                      {msg.reactions.map(r => (
                        <button
                          key={r.emoji}
                          onClick={e => { e.stopPropagation(); addReaction(msg.id, r.emoji) }}
                          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                            r.iMine
                              ? 'bg-pink-100 border-pink-300 text-pink-700'
                              : 'bg-white border-gray-200 dark:border-pink-200 dark:bg-white text-gray-700 dark:text-gray-700'
                          }`}
                        >
                          <span>{r.emoji}</span>
                          {r.count > 1 && <span className="font-semibold">{r.count}</span>}
                        </button>
                      ))}
                    </div>
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
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {otherTyping && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              className="flex justify-start">
              <div className="chat-bubble-theirs dark:border rounded-2xl rounded-bl-sm px-4 py-2.5 dark:shadow-sm">
                <div className="flex items-center gap-1">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div key={i} className="w-2 h-2 rounded-full chat-accent-dot"
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

      {/* Sticker Picker */}
      <AnimatePresence>
        {showStickers && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-16 left-3 z-50 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-pink-200 border-gray-100 p-3"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-semibold dark:text-gray-500 text-gray-500 mb-2">Stickers</p>
            <div className="grid grid-cols-5 gap-1">
              {STICKERS.map(s => (
                <button key={s} onClick={() => sendSticker(s)} className="text-4xl w-12 h-12 flex items-center justify-center rounded-xl hover:bg-pink-50 dark:hover:bg-pink-50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-red-200 border-red-200 whitespace-nowrap max-w-xs">
            <span className="text-xs font-semibold text-red-500">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-gray-400 hover:text-red-500 ml-1"><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
        {isRecording && !errorMsg && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-red-200 border-red-100 whitespace-nowrap">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold dark:text-gray-900 text-gray-900">Recording {fmtTime(recordingTime)}</span>
            <button onClick={toggleRecording} className="text-red-500 hover:text-red-600 ml-1"><Square className="w-3.5 h-3.5 fill-current" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply preview strip */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="px-4 py-2 dark:bg-white bg-white border-t dark:border-pink-200 border-gray-100 flex items-center gap-3"
          >
            <Reply className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-pink-500 truncate">{replyingTo.authorName}</p>
              <p className="text-xs dark:text-gray-600 text-gray-600 truncate">{replyingTo.text || '📎 Attachment'}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-3 py-3 dark:bg-white bg-white border-t dark:border-pink-200 border-gray-100 flex-shrink-0">
        <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.mp4,.mov,.webm" className="hidden" onChange={handleFileAttach} />
        {/* View-once toggle strip */}
        <AnimatePresence>
          {pendingViewOnce && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-2 px-1">
              <Eye className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-xs font-semibold text-pink-500">View once enabled — next media will disappear after viewing</span>
              <button onClick={() => setPendingViewOnce(false)} className="ml-auto text-gray-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2 dark:bg-pink-50 dark:border dark:border-pink-200 bg-gray-100 border border-transparent rounded-2xl px-3 py-2 focus-within:dark:border-pink-400">
          <button onClick={() => { setShowEmoji(!showEmoji); setShowStickers(false) }} className="text-lg hover:scale-110 transition-transform">😊</button>
          <button onClick={() => { setShowStickers(!showStickers); setShowEmoji(false) }} className="hover:scale-110 transition-transform">
            <Sticker className="w-4 h-4 dark:text-gray-400 text-gray-400 hover:text-brand-pink transition-colors" />
          </button>
          <input value={input} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={connected ? 'Message…' : 'Connecting…'} disabled={!connected || isRecording}
            className="flex-1 bg-transparent text-sm dark:text-gray-900 text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-400 focus:outline-none disabled:opacity-50" />
          <div className="flex items-center gap-1">
            {/* View-once toggle button */}
            <button
              onClick={() => setPendingViewOnce(v => !v)}
              title="View once"
              className={`transition-colors ${pendingViewOnce ? 'text-pink-500' : 'dark:text-gray-400 text-gray-400 hover:text-brand-pink'}`}
            >
              {pendingViewOnce ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
            <button onClick={() => send()} disabled={!input.trim() || sending || !connected || isRecording || uploadingFile}
              className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all ml-1">
              {sending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Forward Modal */}
      <AnimatePresence>
        {forwardMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setForwardMsg(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="dark:bg-white bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b dark:border-pink-200 border-gray-100">
                <h2 className="font-display font-black text-base dark:text-gray-900 text-gray-900">Forward to…</h2>
                <button onClick={() => setForwardMsg(null)} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 dark:text-gray-700 text-gray-600" />
                </button>
              </div>
              <div className="px-4 py-3 border-b dark:border-pink-100 border-gray-100">
                <div className="flex items-center gap-2 dark:bg-pink-50 bg-gray-100 rounded-xl px-3 py-2">
                  <Search className="w-4 h-4 dark:text-gray-400 text-gray-400" />
                  <input
                    value={forwardSearch}
                    onChange={e => setForwardSearch(e.target.value)}
                    placeholder="Search contacts…"
                    className="flex-1 bg-transparent text-sm dark:text-gray-900 text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {forwardLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
                  </div>
                ) : filteredForwardContacts.length === 0 ? (
                  <p className="text-sm dark:text-gray-500 text-gray-500 text-center py-8">No contacts found</p>
                ) : (
                  filteredForwardContacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => forwardTo(c)}
                      disabled={forwarding}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:dark:bg-pink-50 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="w-9 h-9 rounded-full dark:bg-pink-100 bg-gray-100 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                        {c.avatar ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" /> : '👤'}
                      </div>
                      <span className="text-sm font-medium dark:text-gray-900 text-gray-900 text-left">{c.name}</span>
                      {forwarding && <Loader2 className="w-4 h-4 animate-spin text-pink-400 ml-auto" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View-once full-screen overlay */}
      <AnimatePresence>
        {viewOnceOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
            onClick={() => {
              markViewOnceViewed(viewOnceOverlay.msgId)
              setViewOnceOverlay(null)
            }}
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={e => { e.stopPropagation(); markViewOnceViewed(viewOnceOverlay.msgId); setViewOnceOverlay(null) }}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-white/60 text-xs mb-4 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> View once — tap anywhere to close (cannot view again)
            </p>
            {viewOnceOverlay.isVideo ? (
              <video
                src={viewOnceOverlay.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-xl"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <img
                src={viewOnceOverlay.url}
                alt="View once"
                className="max-w-full max-h-[80vh] rounded-xl object-contain"
                onClick={e => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
