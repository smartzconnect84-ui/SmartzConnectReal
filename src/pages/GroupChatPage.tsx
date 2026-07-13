import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Users, Lock, Globe, Send, Smile, Mic, MicOff, Play, Pause, Crown, Shield, X, Loader2, RefreshCw, Square, Paperclip, Image as ImageIcon, FileText, Palette, Phone, Video, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToSufy } from '@/lib/sufy'
import { useAuth } from '@/hooks/useAuth'
import { useStream } from '@/contexts/StreamContext'
import { streamClient } from '@/lib/stream'
import { useTheme, CHAT_THEME_PRESETS } from '@/contexts/ThemeContext'
import type { ChatTheme } from '@/contexts/ThemeContext'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import EmojiPicker from '@/components/EmojiPicker'
import TranslateButton from '@/components/TranslateButton'
import type { Channel } from 'stream-chat'
import { useOfflineDraft } from '@/lib/offlineDraft'
import { useNavigate } from 'react-router-dom'

interface Room {
  id: string; name: string; emoji: string; topic: string; members: number
  online: number; lastMsg: string; lastTime: string; unread: number
  type: 'public' | 'private'; category: string; pinned?: boolean
  streamChannelId?: string
}

interface ChatMessage {
  id: string; author: string; authorId?: string; emoji: string; text: string; time: string; mine: boolean; role: string
  type?: 'text' | 'audio' | 'image' | 'file'
  audioUrl?: string; imageUrl?: string; fileUrl?: string; fileName?: string
  viewOnce?: boolean; viewedBy?: string[]
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm)(\?|$)/i.test(url)
}

const categories = ['All', 'Dating', 'Country', 'Music', 'Culture', 'Business', 'Creators', 'VIP', 'Food']
const categoryEmojis: Record<string, string> = {
  Dating: '💕', Country: '🌍', Music: '🎵', Culture: '🎭',
  Business: '💼', Creators: '📺', VIP: '💎', Food: '🍽️',
}
const defaultEmojis = ['👩🏾', '👨🏿', '👩🏽', '👨🏾', '👩🏿', '👨🏽']

interface CreateRoomForm {
  name: string; topic: string; category: string; type: 'public' | 'private'; emoji: string
}

export default function GroupChatPage() {
  const { user } = useAuth()
  const { connected } = useStream()
  const { chatTheme, setChatTheme } = useTheme()
  const { initiateCall } = useLiveKitCall()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [othersTyping, setOthersTyping] = useState<string[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [createForm, setCreateForm] = useState<CreateRoomForm>({
    name: '', topic: '', category: 'Dating', type: 'public', emoji: '💬'
  })

  useOfflineDraft('group-create-form', createForm, setCreateForm, {
    isEmpty: (d: any) => !d?.name?.trim(),
  })

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [pendingViewOnce, setPendingViewOnce] = useState(false)
  const [viewOnceOverlay, setViewOnceOverlay] = useState<{ msgId: string; url: string; isVideo: boolean } | null>(null)

  const channelRef = useRef<Channel | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, othersTyping])

  // Cleanup recording resources and active Stream channel on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      Object.values(audioRefs.current).forEach(a => { a.pause(); a.src = '' })
      // Unwatch the active Stream channel so event listeners are removed and
      // the channel doesn't stay in a "watched" state after the user leaves.
      if (channelRef.current) {
        channelRef.current.stopWatching().catch(() => {})
        channelRef.current = null
      }
    }
  }, [])

  // Fetch group rooms from Supabase
  const fetchRooms = async () => {
    setLoadingRooms(true)
    const { data } = await supabase
      .from('group_rooms')
      .select('id, name, description, category, type, emoji, member_count, created_at, stream_channel_id')
      .order('member_count', { ascending: false })
      .limit(40)
    setRooms((data || []).map((r: any) => ({
      id: String(r.id),
      name: r.name || 'Group',
      emoji: r.emoji || categoryEmojis[r.category] || '💬',
      topic: r.description || '',
      members: r.member_count || 0,
      online: 0,
      lastMsg: '',
      lastTime: new Date(r.created_at).toLocaleDateString(),
      unread: 0,
      type: r.type === 'private' ? 'private' : 'public',
      category: r.category || 'All',
      streamChannelId: r.stream_channel_id,
    })))
    setLoadingRooms(false)
  }

  useEffect(() => { fetchRooms() }, [])

  // Realtime: new rooms appear instantly in the list
  useEffect(() => {
    const sub = supabase
      .channel('group_rooms:realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_rooms',
      }, (payload) => {
        const r = payload.new as any
        const newRoom: Room = {
          id: String(r.id),
          name: r.name || 'Group',
          emoji: r.emoji || categoryEmojis[r.category] || '💬',
          topic: r.description || '',
          members: r.member_count || 0,
          online: 0,
          lastMsg: '',
          lastTime: new Date(r.created_at).toLocaleDateString(),
          unread: 0,
          type: r.type === 'private' ? 'private' : 'public',
          category: r.category || 'All',
          streamChannelId: r.stream_channel_id,
        }
        setRooms(prev => {
          if (prev.some(room => room.id === newRoom.id)) return prev
          return [newRoom, ...prev]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'group_rooms',
      }, (payload) => {
        const r = payload.new as any
        setRooms(prev => prev.map(room =>
          room.id === String(r.id)
            ? { ...room, members: r.member_count || room.members, name: r.name || room.name }
            : room
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  // Open a group channel in GetStream
  const openRoom = async (room: Room) => {
    // Cleanup previous channel: remove listeners and stop watching so the
    // channel is released from Stream's client-side watched-channels registry.
    if (channelRef.current) {
      // Passing no handler removes all listeners for that event type (correct behaviour here).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channelRef.current.off('message.new' as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channelRef.current.off('typing.start' as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channelRef.current.off('typing.stop' as any)
      channelRef.current.stopWatching().catch(() => {})
      channelRef.current = null
    }
    setOthersTyping([])

    setActiveRoom(room)
    setMessages([])
    if (!connected || !user?.id || !streamClient) return

    setLoadingMsgs(true)
    try {
      const chanId = (room.streamChannelId || `group-${room.id}`).slice(0, 60)
      const chan = streamClient.channel('messaging', chanId, {
        name: room.name,
        members: [user.id],
      } as any)
      channelRef.current = chan
      const state = await chan.watch()

      // Mark as read on open
      chan.markRead().catch(() => {})

      const mapGroupMsg = (m: any, myId: string): ChatMessage => {
        const attach = m.attachments?.[0]
        const isVoice = attach?.type === 'voice'
        const isImage = !isVoice && attach?.type === 'image'
        const isFile  = !isVoice && !isImage && !!attach
        return {
          id: m.id,
          author: m.user?.name || m.user?.id?.slice(0, 8) || 'User',
          authorId: m.user?.id,
          emoji: defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)],
          text: m.text || '',
          time: new Date(m.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
          mine: m.user?.id === myId,
          role: 'member',
          type: isVoice ? 'audio' : isImage ? 'image' : isFile ? 'file' : 'text',
          audioUrl:  isVoice ? (attach?.asset_url || attach?.url) : undefined,
          imageUrl:  isImage ? (attach?.image_url || attach?.asset_url) : undefined,
          fileUrl:   isFile  ? attach?.asset_url : undefined,
          fileName:  (isImage || isFile) ? (attach?.title || attach?.fallback) : undefined,
          viewOnce: m.view_once === true,
          viewedBy: Array.isArray(m.viewed_by) ? m.viewed_by : [],
        }
      }

      setMessages((state.messages || []).map((m: any) => mapGroupMsg(m, user.id!)))

      chan.on('message.new', (event: any) => {
        if (!event.message) return
        const m = event.message
        if (m.user?.id === user.id) return
        setMessages(prev => {
          if (prev.some(msg => msg.id === m.id)) return prev
          return [...prev, mapGroupMsg(m, user.id!)]
        })
        // Mark as read as messages arrive
        chan.markRead().catch(() => {})
        // Update room's unread count in list
        setRooms(prev => prev.map(r =>
          r.id === room.id ? { ...r, lastMsg: m.text || '', lastTime: 'now' } : r
        ))
      })

      chan.on('typing.start', (event: any) => {
        if (event.user?.id === user.id) return
        const name = event.user?.name || 'Someone'
        setOthersTyping(prev => prev.includes(name) ? prev : [...prev, name])
      })

      chan.on('typing.stop', (event: any) => {
        if (event.user?.id === user.id) return
        const name = event.user?.name || 'Someone'
        setOthersTyping(prev => prev.filter(n => n !== name))
      })

    } catch (err) {
      console.error('Group channel error:', err)
    }
    setLoadingMsgs(false)
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

  const sendMsg = async () => {
    const text = input.trim()
    if (!text || !channelRef.current || !connected) return

    const clientId = `client-${user?.id?.replace(/-/g, '').slice(0, 12) || 'u'}-${Date.now()}`

    if (typingStopRef.current) clearTimeout(typingStopRef.current)
    try { await channelRef.current.stopTyping() } catch {}

    setMessages(prev => [...prev, {
      id: clientId, author: 'You',
      emoji: '😊', text, mine: true,
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      role: 'member',
    }])
    setInput('')
    setSending(true)

    try {
      const response = await channelRef.current.sendMessage({ text } as any)
      const serverId = response.message?.id
      setMessages(prev => prev.map(m =>
        m.id === clientId ? { ...m, id: serverId ?? m.id } : m
      ))
    } catch (err: any) {
      console.error('Send error:', err)
      // Remove failed optimistic message and surface error
      setMessages(prev => prev.filter(m => m.id !== clientId))
      setVoiceError(err?.message || 'Failed to send message. Please try again.')
      setTimeout(() => setVoiceError(null), 4000)
      setInput(text) // restore so user can retry
    } finally {
      setSending(false)
    }
  }

  // Mark a view-once message as viewed by the current user
  const markViewOnceViewed = async (msgId: string) => {
    if (!user?.id || !streamClient) return
    try {
      const currentMsg = messages.find(m => m.id === msgId)
      if (currentMsg?.viewedBy?.includes(user.id)) return
      const newViewedBy = [...(currentMsg?.viewedBy ?? []), user.id]
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, viewedBy: newViewedBy } : m
      ))
      await streamClient.partialUpdateMessage(msgId, { set: { viewed_by: newViewedBy } })
    } catch (err) {
      console.error('markViewOnceViewed error:', err)
    }
  }

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !channelRef.current || !user?.id) return
    e.target.value = ''
    setUploadingFile(true)
    const clientId = `gfile-${user.id.slice(0, 8)}-${Date.now()}`
    try {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const folder = isImage ? 'photos' : 'documents'
      const url = await uploadToSufy(file, folder as any)
      const viewOnceFlag = pendingViewOnce && (isImage || isVideo)
      const optimistic: ChatMessage = {
        id: clientId, author: 'You', emoji: '😊',
        text: isImage || isVideo ? '' : `📎 ${file.name}`,
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        mine: true, role: 'member',
        type: isImage ? 'image' : 'file',
        imageUrl: isImage ? url : undefined,
        fileUrl: (isVideo || (!isImage && !isVideo)) ? url : undefined,
        fileName: file.name,
        viewOnce: viewOnceFlag,
        viewedBy: [],
      }
      setMessages(prev => [...prev, optimistic])
      setPendingViewOnce(false)
      const msgPayload: any = {
        text: isImage || isVideo ? '' : `📎 ${file.name}`,
        attachments: [{
          type: isImage ? 'image' : 'file',
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
      const resp = await channelRef.current!.sendMessage(msgPayload)
      const serverId = resp.message?.id
      setMessages(prev => prev.map(m => m.id === clientId ? { ...m, id: serverId ?? m.id } : m))
    } catch (err: any) {
      console.error('File upload error:', err)
      setMessages(prev => prev.filter(m => m.id !== clientId))
      setVoiceError(err?.message || 'File upload failed. Please try again.')
      setTimeout(() => setVoiceError(null), 4000)
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
          const path = `group/${user.id}/${Date.now()}.${ext}`
          const { error: upErr } = await supabase.storage.from('voice-messages').upload(path, blob, { contentType: mimeType })
          if (upErr) throw upErr
          const { data: urlData } = supabase.storage.from('voice-messages').getPublicUrl(path)
          const audioUrl = urlData.publicUrl

          const clientId = `gvoice-${user.id.slice(0, 8)}-${Date.now()}`
          const optimistic: ChatMessage = {
            id: clientId, author: 'You', emoji: '😊', text: '🎙️ Voice message',
            mine: true, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
            role: 'member', type: 'audio', audioUrl,
          }
          setMessages(prev => [...prev, optimistic])

          await channelRef.current!.sendMessage({
            id: clientId,
            text: '🎙️ Voice message',
            attachments: [{ type: 'voice', asset_url: audioUrl, url: audioUrl, mime_type: mimeType }],
          } as any)
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

  const fmtRecTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleCreateRoom = async () => {
    if (!createForm.name.trim() || !user?.id) return
    setCreating(true)
    const { data, error } = await supabase.from('group_rooms').insert({
      name: createForm.name.trim(),
      description: createForm.topic.trim(),
      category: createForm.category,
      type: createForm.type,
      emoji: createForm.emoji,
      created_by: user.id,
      member_count: 1,
    }).select().single()

    if (!error && data) {
      const newRoom: Room = {
        id: String(data.id),
        name: data.name,
        emoji: data.emoji,
        topic: data.description || '',
        members: 1,
        online: 1,
        lastMsg: 'Room created!',
        lastTime: 'now',
        unread: 0,
        type: createForm.type,
        category: createForm.category,
      }
      // Realtime subscription will add to list, but also add immediately
      setRooms(prev => prev.some(r => r.id === newRoom.id) ? prev : [newRoom, ...prev])
      setShowCreateModal(false)
      setCreateForm({ name: '', topic: '', category: 'Dating', type: 'public', emoji: '💬' })
      openRoom(newRoom)
    }
    setCreating(false)
  }

  // ── Group call initiation via LiveKit (audio or video) ─────────────────────
  // For group rooms we initiate a call with the room creator/a representative
  // contact. Since group rooms don't have a single "other user", we use the
  // activeRoom's Stream channel members to find a call target, falling back to
  // a room-level LiveKit room so all members sharing the room can join.
  const handleGroupCall = (type: 'audio' | 'video') => {
    if (!activeRoom || !user?.id) return
    // Use the room's Stream channel ID as a stable room identifier so all
    // members in the group can join the same LiveKit room.
    const roomId = `group_${(activeRoom.streamChannelId || `group-${activeRoom.id}`).slice(0, 40)}`
    // initiateCall wires the outgoing call notification + LiveKit room UI
    // exactly as ChatPage does — no Mux, always LiveKit.
    initiateCall({
      contactId:   roomId,   // synthetic ID for the group room
      contactName: activeRoom.name,
      type,
    }).catch(() => {})
  }

  const typingLabel = othersTyping.length === 0 ? null
    : othersTyping.length === 1 ? `${othersTyping[0]} is typing…`
    : `${othersTyping.slice(0, 2).join(', ')} are typing…`

  const filtered = rooms.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.topic.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (activeCategory === 'All' || r.category === activeCategory)
  })

  return (
    <div className="h-full flex dark:bg-pink-50 bg-gray-50">

      {/* Room list */}
      <div className={`flex flex-col w-full lg:w-80 xl:w-96 flex-shrink-0 dark:bg-white bg-white border-r dark:border-pink-200 border-gray-100 ${activeRoom ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-4 pt-5 pb-3 border-b dark:border-pink-200 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-black text-xl dark:text-gray-900 text-gray-900">Groups 💬</h1>
              <p className="text-xs dark:text-gray-500 text-gray-500">{rooms.length > 0 ? `${rooms.length} rooms` : 'No rooms yet'}</p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={fetchRooms} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                <RefreshCw className="w-3.5 h-3.5 dark:text-gray-600 text-gray-600" />
              </button>
              <button onClick={() => setShowCreateModal(true)} className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-400 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-pink-50 dark:border dark:border-pink-200 bg-gray-50 border border-gray-200 text-sm dark:text-gray-900 text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-400 focus:outline-none focus:dark:border-pink-400 transition-colors" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white' : 'dark:bg-pink-100 bg-gray-100 dark:text-gray-600 text-gray-600 hover:text-brand-pink'}`}>
                {categoryEmojis[cat] || ''} {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
              <p className="text-sm dark:text-gray-500 text-gray-500">Loading rooms…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
              <div className="text-4xl">💬</div>
              <div>
                <p className="font-bold dark:text-gray-900 text-gray-900 mb-1">No group rooms yet</p>
                <p className="text-sm dark:text-gray-500 text-gray-500">Create the first community room!</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold">
                <Plus className="w-4 h-4" /> Create Room
              </button>
            </div>
          ) : (
            <div className="divide-y dark:divide-pink-100 divide-gray-50">
              {filtered.map((room, i) => (
                <motion.div key={room.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => openRoom(room)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${activeRoom?.id === room.id ? 'dark:bg-pink-100 bg-pink-50' : 'hover:dark:bg-pink-50 hover:bg-pink-50/30'}`}>
                  <div className="w-12 h-12 rounded-2xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">{room.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-sm dark:text-gray-900 text-gray-900 truncate">{room.name}</span>
                        {room.type === 'private' && <Lock className="w-3 h-3 dark:text-gray-500 text-gray-400 flex-shrink-0" />}
                        {room.pinned && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] dark:text-gray-400 text-gray-400 flex-shrink-0 ml-2">{room.lastTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs dark:text-gray-500 text-gray-500 truncate">
                        {room.lastMsg || room.topic || `${room.members} members`}
                      </p>
                      {room.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-brand-pink text-white text-[9px] font-black flex items-center justify-center flex-shrink-0 ml-1">{room.unread}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`flex-1 flex flex-col chat-page-bg ${activeRoom ? 'flex' : 'hidden lg:flex'}`}>
        {activeRoom ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3.5 dark:bg-white bg-white border-b dark:border-pink-200 border-gray-100 flex-shrink-0">
              <button onClick={() => { setActiveRoom(null); setOthersTyping([]) }} className="lg:hidden w-8 h-8 rounded-lg dark:bg-pink-100 bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 dark:text-gray-700 text-gray-600" />
              </button>
              <div className="w-10 h-10 rounded-2xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center text-xl">{activeRoom.emoji}</div>
              <div className="flex-1">
                <p className="font-bold dark:text-gray-900 text-gray-900">{activeRoom.name}</p>
                <p className="text-xs dark:text-gray-500 text-gray-500">
                  {typingLabel ?? (activeRoom.members > 0 ? `${activeRoom.members.toLocaleString()} members` : activeRoom.topic)}
                </p>
              </div>
              <button onClick={() => handleGroupCall('audio')} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors" title="Voice call">
                <Phone className="w-4 h-4 dark:text-gray-600 text-gray-600" />
              </button>
              <button onClick={() => handleGroupCall('video')} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:bg-brand-pink/20 hover:text-brand-pink transition-colors" title="Video call">
                <Video className="w-4 h-4 dark:text-gray-600 text-gray-600" />
              </button>
              <button onClick={() => setShowThemePicker(p => !p)} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors" title="Chat Theme">
                <Palette className="w-4 h-4 dark:text-gray-600 text-gray-600" />
              </button>
              <button onClick={() => setShowMembers(!showMembers)} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                <Users className="w-4 h-4 dark:text-gray-600 text-gray-600" />
              </button>
            </div>

            {/* Chat Theme Picker */}
            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden dark:bg-white bg-white border-b dark:border-pink-100 border-gray-100 flex-shrink-0"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold dark:text-gray-700 text-gray-700">Chat Theme</p>
                      <button onClick={() => setShowThemePicker(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
                  <p className="text-sm dark:text-gray-500 text-gray-500">Loading messages…</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                  <div className="text-4xl">{activeRoom.emoji}</div>
                  <p className="font-bold dark:text-gray-900 text-gray-900">Start the conversation!</p>
                  <p className="text-sm dark:text-gray-500 text-gray-500">Be the first to say something in {activeRoom.name}</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!msg.mine && (
                      <button
                        type="button"
                        onClick={() => msg.authorId && msg.authorId !== user?.id && navigate(`/app/user/${msg.authorId}`)}
                        className="w-8 h-8 rounded-full dark:bg-pink-100 bg-gray-100 flex items-center justify-center text-sm flex-shrink-0 mt-1 hover:opacity-80 transition-opacity cursor-pointer"
                        title={msg.author}
                      >{msg.emoji}</button>
                    )}
                    <div className={`max-w-[75%]`}>
                      {!msg.mine && (
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => msg.authorId && msg.authorId !== user?.id && navigate(`/app/user/${msg.authorId}`)}
                            className="text-xs font-bold dark:text-gray-700 text-gray-700 hover:text-brand-pink dark:hover:text-brand-pink transition-colors"
                          >{msg.author}</button>
                          {msg.role === 'admin' && <Shield className="w-3 h-3 text-purple-400" />}
                        </div>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.mine
                          ? 'chat-bubble-mine rounded-br-sm'
                          : msg.role === 'admin'
                            ? 'dark:bg-purple-100 dark:border dark:border-purple-200 bg-purple-50 dark:text-purple-900 text-purple-900 rounded-bl-sm'
                            : 'chat-bubble-theirs dark:border rounded-bl-sm dark:shadow-sm'
                      }`}>
                        {msg.type === 'audio' && msg.audioUrl ? (
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <button
                              onClick={() => toggleAudio(msg.id, msg.audioUrl!)}
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
                                return (
                                  <div className="relative">
                                    <img src={msg.imageUrl} alt={msg.fileName || 'Image'} className="max-w-[200px] max-h-44 rounded-xl object-cover" />
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
                                  onClick={() => setViewOnceOverlay({ msgId: msg.id, url: msg.imageUrl!, isVideo: false })}
                                  className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-xl bg-black/20"
                                >
                                  <Eye className="w-6 h-6" />
                                  <span className="text-xs font-semibold">Photo · Tap to view once</span>
                                </button>
                              )
                            }
                            return (
                              <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                <img src={msg.imageUrl} alt={msg.fileName || 'Image'} className="max-w-[200px] max-h-44 rounded-xl object-cover" />
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
                                      <video src={fileUrl} controls className="max-w-[200px] max-h-44 rounded-xl" />
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
                                    onClick={() => setViewOnceOverlay({ msgId: msg.id, url: fileUrl, isVideo: true })}
                                    className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-xl bg-black/20"
                                  >
                                    <Eye className="w-6 h-6" />
                                    <span className="text-xs font-semibold">Video · Tap to view once</span>
                                  </button>
                                )
                              }
                              return <video src={fileUrl} controls className="max-w-[200px] max-h-44 rounded-xl" />
                            }
                            return (
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                <FileText className="w-4 h-4 flex-shrink-0 opacity-80" />
                                <span className="underline underline-offset-2 truncate max-w-[160px]">{msg.fileName || 'File'}</span>
                              </a>
                            )
                          })()
                        ) : (
                          <>
                            {msg.text}
                            {msg.text && (
                              <TranslateButton
                                text={msg.text}
                                className={`${msg.mine ? 'opacity-70 hover:opacity-100' : ''}`}
                              />
                            )}
                          </>
                        )}
                      </div>
                      <p className={`text-[10px] mt-1 dark:text-gray-400 text-gray-400 ${msg.mine ? 'text-right' : ''}`}>{msg.time}</p>
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              <AnimatePresence>
                {othersTyping.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="flex justify-start gap-2">
                    <div className="w-8 h-8 rounded-full dark:bg-pink-100 bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">✍️</div>
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

            {/* Recording indicator / error */}
            <AnimatePresence>
              {voiceError && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="mx-3 mb-2 flex items-center gap-2 px-4 py-2 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-red-200 border-red-200">
                  <span className="text-xs font-semibold text-red-500 flex-1">{voiceError}</span>
                  <button onClick={() => setVoiceError(null)} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </motion.div>
              )}
              {isRecording && !voiceError && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="mx-3 mb-2 flex items-center gap-2 px-4 py-2 dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-red-200 border-red-100">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-semibold dark:text-gray-900 text-gray-900 flex-1">Recording {fmtRecTime(recordingTime)}</span>
                  <button onClick={toggleRecording} className="text-red-500 hover:text-red-600"><Square className="w-3.5 h-3.5 fill-current" /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
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
              <div className="relative">
                <AnimatePresence>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full mb-1 left-0 z-50">
                      <EmojiPicker
                        onSelect={e => setInput(prev => prev + e)}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    </div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-2 dark:bg-pink-50 dark:border dark:border-pink-200 bg-gray-100 border border-transparent rounded-2xl px-3 py-2 focus-within:dark:border-pink-400">
                  <button onClick={() => setShowEmojiPicker(p => !p)} className="text-lg hover:scale-110 transition-transform flex-shrink-0">😊</button>
                  <input value={input} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && !isRecording && sendMsg()}
                    placeholder={isRecording ? 'Recording…' : 'Message the group…'} disabled={isRecording}
                    className="flex-1 bg-transparent text-sm dark:text-gray-900 text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-400 focus:outline-none disabled:opacity-50" />
                  {/* View-once toggle button */}
                  <button
                    onClick={() => setPendingViewOnce(v => !v)}
                    title="View once"
                    className={`transition-colors ${pendingViewOnce ? 'text-pink-500' : 'dark:text-gray-400 text-gray-400 hover:text-brand-pink'}`}
                  >
                    {pendingViewOnce ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile || isRecording}
                    className="dark:text-gray-400 text-gray-400 hover:text-brand-pink transition-colors disabled:opacity-50">
                    {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin text-brand-pink" /> : <Paperclip className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={toggleRecording}
                    disabled={uploadingVoice}
                    className={`transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'dark:text-gray-400 text-gray-400 hover:text-brand-pink'}`}
                  >
                    {uploadingVoice ? <Loader2 className="w-4 h-4 animate-spin text-brand-pink" /> : isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button onClick={sendMsg} disabled={!input.trim() || sending || isRecording}
                    className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all">
                    {sending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">💬</div>
            <div className="text-center">
              <p className="font-bold dark:text-gray-900 text-gray-900 mb-1">Select a room</p>
              <p className="text-sm dark:text-gray-500 text-gray-500">Choose a group from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="dark:bg-white bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b dark:border-pink-200 border-gray-100">
                <h2 className="font-display font-black text-lg dark:text-gray-900 text-gray-900">Create Room</h2>
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-xl dark:bg-pink-100 bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 dark:text-gray-700 text-gray-600" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-3 items-center">
                  <input value={createForm.emoji} onChange={e => setCreateForm(f => ({ ...f, emoji: e.target.value }))}
                    className="w-14 h-14 rounded-2xl dark:bg-pink-50 bg-gray-50 text-center text-2xl border dark:border-pink-200 border-gray-200 focus:outline-none focus:dark:border-pink-400" maxLength={2} />
                  <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Room name*" className="flex-1 px-4 py-3 rounded-xl dark:bg-pink-50 bg-gray-50 dark:text-gray-900 text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-400 border dark:border-pink-200 border-gray-200 text-sm focus:outline-none focus:dark:border-pink-400" />
                </div>
                <input value={createForm.topic} onChange={e => setCreateForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Room topic / description" className="w-full px-4 py-3 rounded-xl dark:bg-pink-50 bg-gray-50 dark:text-gray-900 text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-400 border dark:border-pink-200 border-gray-200 text-sm focus:outline-none focus:dark:border-pink-400" />
                <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl dark:bg-pink-50 bg-gray-50 dark:text-gray-900 text-gray-900 border dark:border-pink-200 border-gray-200 text-sm focus:outline-none focus:dark:border-pink-400">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{categoryEmojis[c] || ''} {c}</option>)}
                </select>
                <div className="flex gap-2">
                  {(['public', 'private'] as const).map(t => (
                    <button key={t} onClick={() => setCreateForm(f => ({ ...f, type: t }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${createForm.type === t ? 'bg-love-gradient text-white' : 'dark:bg-pink-100 bg-gray-100 dark:text-gray-700 text-gray-600'}`}>
                      {t === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {t === 'public' ? 'Public' : 'Private'}
                    </button>
                  ))}
                </div>
                <button onClick={handleCreateRoom} disabled={!createForm.name.trim() || creating}
                  className="w-full py-3 rounded-2xl bg-love-gradient text-white font-bold disabled:opacity-50">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Room 🚀'}
                </button>
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
