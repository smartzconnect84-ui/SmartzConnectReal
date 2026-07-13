import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, MessageCircle, Trash2, Edit3, Upload, Pin, Send,
  Loader2, CheckCircle, AlertCircle, Paperclip, X, Save,
  RefreshCw, Users, Heart, Briefcase, Search, Lock,
} from 'lucide-react'
import { streamClient } from '@/lib/stream'
import { useStream } from '@/contexts/StreamContext'
import { uploadToSufy } from '@/lib/sufy'
import type { Channel } from 'stream-chat'

// These IDs must match what WorldChatPage.tsx uses
export const WORLD_CHANNELS = [
  { id: 'smartz-worldchat-v2',       label: 'General',         emoji: '🌍', icon: Globe,     color: 'text-cyan-400',   bg: 'from-cyan-500 to-teal-600' },
  { id: 'smartz-worldchat-social',   label: 'Social & Dating', emoji: '💕', icon: Heart,     color: 'text-pink-400',   bg: 'from-pink-500 to-rose-600' },
  { id: 'smartz-worldchat-business', label: 'Business',        emoji: '💼', icon: Briefcase, color: 'text-amber-400',  bg: 'from-amber-500 to-orange-600' },
]

const CHANNEL_TYPE = 'livestream'

interface AdminMsg {
  id: string
  text: string
  userId: string
  userName: string
  userAvatar?: string
  createdAt: Date
  pinned?: boolean
  attachments?: { type: string; url: string; name?: string }[]
}

function toAdminMsg(m: any): AdminMsg {
  return {
    id: m.id,
    text: m.text || '',
    userId: m.user?.id || '',
    userName: m.user?.name || m.user?.id || 'Unknown',
    userAvatar: m.user?.image,
    createdAt: new Date(m.created_at || Date.now()),
    pinned: !!m.pinned,
    attachments: (m.attachments || []).map((a: any) => ({
      type: a.type || 'file',
      url: a.asset_url || a.image_url || a.url || '',
      name: a.title || 'attachment',
    })),
  }
}

export default function AdminWorldChat() {
  const { connected: streamConnected } = useStream()
  const [activeCh, setActiveCh] = useState(0)
  const [channel, setChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<AdminMsg[]>([])
  const [loading, setLoading] = useState(false)
  const [composeText, setComposeText] = useState('')
  const [sending, setSending] = useState(false)
  const [editingMsg, setEditingMsg] = useState<AdminMsg | null>(null)
  const [editText, setEditText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<Channel | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3200)
  }

  const initChannel = useCallback(async () => {
    if (!streamClient || !streamConnected) return
    setLoading(true)
    setMessages([])
    setChannel(null)

    try {
      const ch = streamClient.channel(CHANNEL_TYPE, WORLD_CHANNELS[activeCh].id, {
        name: WORLD_CHANNELS[activeCh].label,
      } as Record<string, unknown>)
      await ch.watch()
      channelRef.current = ch
      setChannel(ch)

      const state = ch.state
      const msgs: AdminMsg[] = Object.values(state.messages || {})
        .filter((m: any) => m.type !== 'deleted')
        .map(toAdminMsg)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      setMessages(msgs)

      // Live updates
      const onNew = (e: any) => {
        if (!e.message || e.message.type === 'deleted') return
        setMessages(prev => {
          if (prev.some(m => m.id === e.message.id)) return prev
          return [...prev, toAdminMsg(e.message)]
        })
      }
      const onDeleted = (e: any) => {
        if (!e.message) return
        setMessages(prev => prev.filter(m => m.id !== e.message.id))
      }
      const onUpdated = (e: any) => {
        if (!e.message) return
        setMessages(prev => prev.map(m => m.id === e.message.id ? toAdminMsg(e.message) : m))
      }
      ch.on('message.new', onNew)
      ch.on('message.deleted', onDeleted)
      ch.on('message.updated', onUpdated)
    } catch (err: any) {
      showToast(err?.message || 'Failed to connect to channel', false)
    } finally {
      setLoading(false)
    }
  }, [activeCh, streamConnected])

  useEffect(() => {
    const prev = channelRef.current
    initChannel()
    return () => {
      if (prev) prev.stopWatching().catch(() => {})
      channelRef.current = null
    }
  }, [activeCh, streamConnected])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const deleteMessage = async (msgId: string) => {
    if (!streamClient) return
    try {
      await streamClient.deleteMessage(msgId, true)
      setMessages(prev => prev.filter(m => m.id !== msgId))
      showToast('Message deleted')
    } catch (err: any) {
      showToast(err?.message || 'Delete failed', false)
    }
  }

  const saveEdit = async () => {
    if (!editingMsg || !editText.trim() || !streamClient) return
    try {
      await streamClient.updateMessage({ id: editingMsg.id, text: editText.trim() })
      setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, text: editText.trim() } : m))
      setEditingMsg(null)
      setEditText('')
      showToast('Message updated')
    } catch (err: any) {
      showToast(err?.message || 'Edit failed', false)
    }
  }

  const togglePin = async (msg: AdminMsg) => {
    if (!streamClient) return
    try {
      if (msg.pinned) {
        await streamClient.unpinMessage(msg.id)
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, pinned: false } : m))
        showToast('Message unpinned')
      } else {
        await streamClient.pinMessage(msg.id)
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, pinned: true } : m))
        showToast('Message pinned / saved')
      }
    } catch (err: any) {
      showToast(err?.message || 'Pin failed', false)
    }
  }

  const sendAnnouncement = async () => {
    if (!channel || !composeText.trim() || sending) return
    setSending(true)
    try {
      await channel.sendMessage({ text: `📢 ${composeText.trim()}` })
      setComposeText('')
      showToast('Announcement sent')
    } catch (err: any) {
      showToast(err?.message || 'Send failed', false)
    } finally {
      setSending(false)
    }
  }

  const uploadFile = async (file: File) => {
    if (!channel || uploading) return
    setUploading(true)
    try {
      const url = await uploadToSufy(file, file.type.startsWith('image/') ? 'photos' : 'documents')
      const isImage = file.type.startsWith('image/')
      await channel.sendMessage({
        text: `📎 Admin upload: ${file.name}`,
        attachments: [{
          type: isImage ? 'image' : 'file',
          asset_url: url,
          image_url: isImage ? url : undefined,
          title: file.name,
        }],
      })
      showToast('File uploaded and shared')
    } catch (err: any) {
      showToast(err?.message || 'Upload failed', false)
    } finally {
      setUploading(false)
    }
  }

  const filtered = searchQ.trim()
    ? messages.filter(m =>
        m.text.toLowerCase().includes(searchQ.toLowerCase()) ||
        m.userName.toLowerCase().includes(searchQ.toLowerCase())
      )
    : messages

  const pinnedMessages = messages.filter(m => m.pinned)

  const chInfo = WORLD_CHANNELS[activeCh]

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">World Chat Manager</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">
            Moderate and manage all 3 public World Chat channels. Changes reflect live on the public site.
          </p>
        </div>
        <button onClick={initChannel}
          className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink text-xs font-semibold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-2 flex-wrap">
        {WORLD_CHANNELS.map((ch, i) => {
          const Icon = ch.icon
          return (
            <button key={ch.id} onClick={() => setActiveCh(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeCh === i
                  ? `bg-gradient-to-r ${ch.bg} text-white shadow-lg`
                  : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'
              }`}>
              <span className="text-lg">{ch.emoji}</span>
              {ch.label}
              {activeCh === i && <span className="w-1.5 h-1.5 rounded-full bg-white/60 ml-1" />}
            </button>
          )
        })}
      </div>

      {/* Status */}
      {!streamConnected && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin" /> Connecting to Stream Chat…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Message list (2/3 width) ── */}
        <div className="lg:col-span-2 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 flex flex-col" style={{ minHeight: '540px', maxHeight: '680px' }}>

          {/* Channel list header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-white/6 border-gray-100 flex-shrink-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${chInfo.bg} flex items-center justify-center text-xl shadow`}>
              {chInfo.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm dark:text-white text-gray-900">{chInfo.label} Channel</p>
              <p className="text-[10px] dark:text-gray-500 text-gray-400">{messages.length} messages · {pinnedMessages.length} pinned</p>
            </div>
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search messages…"
                className="pl-7 pr-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors w-36 focus:w-48"
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-brand-pink" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <MessageCircle className="w-8 h-8 text-gray-300" />
                <p className="text-sm dark:text-gray-400 text-gray-500">
                  {searchQ ? 'No messages match your search' : 'No messages in this channel'}
                </p>
              </div>
            ) : (
              filtered.map(msg => (
                <div
                  key={msg.id}
                  className={`group flex gap-2.5 p-2.5 rounded-xl hover:dark:bg-white/3 hover:bg-gray-50 transition-colors ${
                    msg.pinned ? 'ring-1 ring-amber-400/30 dark:bg-amber-500/5 bg-amber-50/50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center text-sm overflow-hidden flex-shrink-0 self-start mt-0.5">
                    {msg.userAvatar
                      ? <img src={msg.userAvatar} alt="" className="w-full h-full object-cover" />
                      : <span className="text-[10px] text-white font-bold">{msg.userName[0]?.toUpperCase()}</span>}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] font-bold text-brand-pink truncate">{msg.userName}</p>
                      {msg.pinned && (
                        <span className="text-[9px] font-bold bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded-full flex-shrink-0">📌 Pinned</span>
                      )}
                      <p className="text-[10px] dark:text-gray-600 text-gray-400 ml-auto flex-shrink-0">
                        {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {msg.createdAt.toLocaleDateString()}
                      </p>
                    </div>

                    {/* Inline edit mode */}
                    {editingMsg?.id === msg.id ? (
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <input
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingMsg(null) }}
                          autoFocus
                          className="flex-1 min-w-0 text-sm px-2.5 py-1.5 rounded-lg dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900 border dark:border-white/10 border-gray-300 focus:outline-none focus:border-brand-pink"
                        />
                        <button onClick={saveEdit}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 flex-shrink-0">
                          <Save className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => setEditingMsg(null)}
                          className="px-2.5 py-1.5 rounded-lg dark:bg-white/5 bg-gray-200 text-xs font-bold dark:text-gray-400 text-gray-600 flex-shrink-0">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs dark:text-gray-300 text-gray-700 mt-0.5 break-words leading-relaxed">
                        {msg.text || <span className="italic dark:text-gray-600 text-gray-400">[media attachment]</span>}
                      </p>
                    )}

                    {/* Attachments preview */}
                    {msg.attachments?.map((a, ai) => (
                      <div key={ai} className="mt-1">
                        {a.type === 'image' && a.url && (
                          <img src={a.url} alt="" className="max-w-[120px] rounded-lg border dark:border-white/10 border-gray-200" />
                        )}
                        {a.type !== 'image' && a.url && (
                          <a href={a.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-[10px] text-brand-pink hover:underline">
                            <Paperclip className="w-3 h-3" /> {a.name}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action buttons (hover) */}
                  <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => { setEditingMsg(msg); setEditText(msg.text) }}
                      title="Edit message"
                      className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-blue-500/15 hover:text-blue-400 text-gray-400 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => togglePin(msg)}
                      title={msg.pinned ? 'Unpin' : 'Pin/Save'}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        msg.pinned
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'dark:bg-white/5 bg-gray-100 text-gray-400 hover:bg-amber-500/15 hover:text-amber-400'
                      }`}>
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      title="Delete message"
                      className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/15 hover:text-red-400 text-gray-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* ── Right panel (1/3 width) ── */}
        <div className="space-y-4">

          {/* Compose announcement */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Send Announcement</h3>
            </div>
            <p className="text-[10px] dark:text-gray-500 text-gray-400 mb-2">
              Posts to <span className="font-bold text-brand-pink">{chInfo.label}</span> as admin. Visible live on the public site.
            </p>
            <textarea
              value={composeText}
              onChange={e => setComposeText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnnouncement() } }}
              placeholder={`Type announcement for ${chInfo.label}…`}
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || !channel}
                title="Upload file or image"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink text-xs font-semibold transition-colors disabled:opacity-40">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload
              </button>
              <button
                onClick={sendAnnouncement}
                disabled={!composeText.trim() || sending || !channel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50 transition-opacity">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }}
            />
          </div>

          {/* Channel directory */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Channel Directory</h3>
            </div>
            <div className="space-y-2">
              {WORLD_CHANNELS.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveCh(i)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
                    activeCh === i
                      ? 'dark:bg-white/8 bg-gray-100 ring-1 ring-brand-pink/30'
                      : 'hover:dark:bg-white/5 hover:bg-gray-50'
                  }`}>
                  <span className="text-xl">{ch.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold dark:text-white text-gray-900">{ch.label}</p>
                    <p className="text-[10px] dark:text-gray-500 text-gray-400 font-mono truncate">{ch.id}</p>
                  </div>
                  {activeCh === i && <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded-full flex-shrink-0">Active</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Pinned / Saved messages */}
          {pinnedMessages.length > 0 && (
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Pin className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm dark:text-white text-gray-900">Pinned / Saved ({pinnedMessages.length})</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pinnedMessages.map(m => (
                  <div key={m.id} className="flex items-start gap-2 p-2 rounded-xl dark:bg-amber-500/5 bg-amber-50/50 border border-amber-400/20">
                    <Pin className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-amber-500 truncate">{m.userName}</p>
                      <p className="text-xs dark:text-gray-300 text-gray-700 truncate mt-0.5">{m.text}</p>
                    </div>
                    <button
                      onClick={() => togglePin(m)}
                      className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage note */}
          <div className="p-3 rounded-xl dark:bg-white/3 bg-gray-50 border dark:border-white/6 border-gray-200">
            <p className="text-[10px] dark:text-gray-500 text-gray-400 leading-relaxed">
              <span className="font-bold dark:text-gray-400 text-gray-600">Edit</span> — change any message's text.<br />
              <span className="font-bold dark:text-gray-400 text-gray-600">Pin</span> — pin/save to highlighted bar on the public chat.<br />
              <span className="font-bold dark:text-gray-400 text-gray-600">Delete</span> — permanently removes for all users.<br />
              <span className="font-bold dark:text-gray-400 text-gray-600">Upload</span> — share files/images as admin posts.<br />
              All actions reflect live on the public World Chat site.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
