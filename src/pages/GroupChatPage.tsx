import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Users, Lock, Globe, Send, Smile, Mic, Crown, Shield, X, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useStream } from '@/contexts/StreamContext'
import { streamClient } from '@/lib/stream'
import type { Channel } from 'stream-chat'

interface Room {
  id: string; name: string; emoji: string; topic: string; members: number
  online: number; lastMsg: string; lastTime: string; unread: number
  type: 'public' | 'private'; category: string; pinned?: boolean
  streamChannelId?: string
}

interface ChatMessage {
  id: string; author: string; emoji: string; text: string; time: string; mine: boolean; role: string
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
  const [createForm, setCreateForm] = useState<CreateRoomForm>({
    name: '', topic: '', category: 'Dating', type: 'public', emoji: '💬'
  })

  const channelRef = useRef<Channel | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Fetch group rooms from Supabase
  const fetchRooms = async () => {
    setLoadingRooms(true)
    const { data } = await supabase
      .from('group_rooms')
      .select('id, name, description, category, type, emoji, member_count, created_at, stream_channel_id')
      .order('member_count', { ascending: false })
      .limit(40)
    setRooms((data || []).map((r: any, i: number) => ({
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

  // Open a group channel in GetStream
  const openRoom = async (room: Room) => {
    setActiveRoom(room)
    setMessages([])
    if (!connected || !user?.id) return

    setLoadingMsgs(true)
    try {
      const chanId = (room.streamChannelId || `group-${room.id}`).slice(0, 60)
      const chan = streamClient.channel('messaging', chanId, {
        name: room.name,
        members: [user.id],
      } as any)
      channelRef.current = chan
      const state = await chan.watch()
      setMessages((state.messages || []).map((m: any) => ({
        id: m.id,
        author: m.user?.name || m.user?.id?.slice(0, 8) || 'User',
        emoji: defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)],
        text: m.text || '',
        time: new Date(m.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        mine: m.user?.id === user.id,
        role: 'member',
      })))

      chan.on('message.new', (event: any) => {
        if (!event.message) return
        const m = event.message
        if (m.user?.id === user.id) return
        setMessages(prev => {
          if (prev.some(msg => msg.id === m.id)) return prev
          return [...prev, {
            id: m.id, author: m.user?.name || 'User',
            emoji: defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)],
            text: m.text || '',
            time: new Date(m.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
            mine: false, role: 'member',
          }]
        })
      })
    } catch (err) {
      console.error('Group channel error:', err)
    }
    setLoadingMsgs(false)
  }

  const sendMsg = async () => {
    if (!input.trim()) return
    const text = input
    const clientId = `${user?.id?.slice(0, 8) || 'u'}-${Date.now()}`

    setMessages(prev => [...prev, {
      id: clientId, author: 'You',
      emoji: '😊', text, mine: true,
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      role: 'member',
    }])
    setInput('')
    setSending(true)

    if (channelRef.current && connected) {
      try { await channelRef.current.sendMessage({ text, id: clientId } as any) } catch {}
    }
    setSending(false)
  }

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
      setRooms(prev => [newRoom, ...prev])
      setShowCreateModal(false)
      setCreateForm({ name: '', topic: '', category: 'Dating', type: 'public', emoji: '💬' })
      openRoom(newRoom)
    }
    setCreating(false)
  }

  const filtered = rooms.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.topic.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (activeCategory === 'All' || r.category === activeCategory)
  })

  return (
    <div className="h-full flex dark:bg-[#0A0710] bg-gray-50">

      {/* Room list */}
      <div className={`flex flex-col w-full lg:w-80 xl:w-96 flex-shrink-0 dark:bg-[#0D0A14] bg-white border-r dark:border-purple-900/20 border-gray-100 ${activeRoom ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-4 pt-5 pb-3 border-b dark:border-purple-900/20 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Groups 💬</h1>
              <p className="text-xs dark:text-pink-300/60 text-gray-500">{rooms.length > 0 ? `${rooms.length} rooms` : 'No rooms yet'}</p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={fetchRooms} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
              </button>
              <button onClick={() => setShowCreateModal(true)} className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-purple-900/10 dark:border dark:border-purple-500/15 bg-gray-50 border border-gray-200 text-sm dark:text-white text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 focus:outline-none focus:dark:border-pink-500/30 transition-colors" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-purple-300/70 text-gray-600 hover:text-brand-pink'}`}>
                {categoryEmojis[cat] || ''} {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
              <p className="text-sm dark:text-pink-300/60 text-gray-500">Loading rooms…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
              <div className="text-4xl">💬</div>
              <div>
                <p className="font-bold dark:text-white text-gray-900 mb-1">No group rooms yet</p>
                <p className="text-sm dark:text-pink-300/60 text-gray-500">Create the first community room!</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold">
                <Plus className="w-4 h-4" /> Create Room
              </button>
            </div>
          ) : (
            <div className="divide-y dark:divide-purple-900/15 divide-gray-50">
              {filtered.map((room, i) => (
                <motion.div key={room.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => openRoom(room)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${activeRoom?.id === room.id ? 'dark:bg-purple-900/20 bg-pink-50' : 'hover:dark:bg-purple-900/10 hover:bg-pink-50/30'}`}>
                  <div className="w-12 h-12 rounded-2xl dark:bg-purple-900/20 bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">{room.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-sm dark:text-white text-gray-900 truncate">{room.name}</span>
                        {room.type === 'private' && <Lock className="w-3 h-3 dark:text-purple-400 text-gray-400 flex-shrink-0" />}
                        {room.pinned && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] dark:text-pink-400/50 text-gray-400 flex-shrink-0 ml-2">{room.lastTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs dark:text-purple-300/60 text-gray-500 truncate">{room.topic || `${room.members} members`}</p>
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
      <div className={`flex-1 flex flex-col dark:bg-[#0A0710] bg-gray-50 ${activeRoom ? 'flex' : 'hidden lg:flex'}`}>
        {activeRoom ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3.5 dark:bg-[#0D0A14] bg-white border-b dark:border-purple-900/20 border-gray-100 flex-shrink-0">
              <button onClick={() => setActiveRoom(null)} className="lg:hidden w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
              </button>
              <div className="w-10 h-10 rounded-2xl dark:bg-purple-900/20 bg-gray-100 flex items-center justify-center text-xl">{activeRoom.emoji}</div>
              <div className="flex-1">
                <p className="font-bold dark:text-white text-gray-900">{activeRoom.name}</p>
                <p className="text-xs dark:text-pink-300/60 text-gray-500">
                  {activeRoom.members > 0 ? `${activeRoom.members.toLocaleString()} members` : activeRoom.topic}
                </p>
              </div>
              <button onClick={() => setShowMembers(!showMembers)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                <Users className="w-4 h-4 dark:text-purple-300/60 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
                  <p className="text-sm dark:text-pink-300/60 text-gray-500">Loading messages…</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                  <div className="text-4xl">{activeRoom.emoji}</div>
                  <p className="font-bold dark:text-white text-gray-900">Start the conversation!</p>
                  <p className="text-sm dark:text-pink-300/60 text-gray-500">Be the first to say something in {activeRoom.name}</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!msg.mine && (
                      <div className="w-8 h-8 rounded-full dark:bg-purple-900/20 bg-gray-100 flex items-center justify-center text-sm flex-shrink-0 mt-1">{msg.emoji}</div>
                    )}
                    <div className={`max-w-[75%] ${msg.mine ? '' : ''}`}>
                      {!msg.mine && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold dark:text-pink-300 text-gray-700">{msg.author}</span>
                          {msg.role === 'admin' && <Shield className="w-3 h-3 text-purple-400" />}
                        </div>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.mine
                          ? 'bg-love-gradient text-white rounded-br-sm'
                          : msg.role === 'admin'
                            ? 'dark:bg-purple-800/30 dark:border dark:border-purple-500/20 bg-purple-50 dark:text-purple-200 text-purple-900 rounded-bl-sm'
                            : 'dark:bg-purple-900/20 dark:border dark:border-purple-500/10 bg-gray-100 dark:text-pink-50 text-gray-900 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <p className={`text-[10px] mt-1 dark:text-pink-400/40 text-gray-400 ${msg.mine ? 'text-right' : ''}`}>{msg.time}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 dark:bg-[#0D0A14] bg-white border-t dark:border-purple-900/20 border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 dark:bg-purple-900/10 dark:border dark:border-purple-500/15 bg-gray-100 border border-transparent rounded-2xl px-3 py-2 focus-within:dark:border-pink-500/30">
                <span className="text-lg cursor-default">😊</span>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  placeholder="Message the group…"
                  className="flex-1 bg-transparent text-sm dark:text-pink-50 text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 focus:outline-none" />
                <button onClick={() => {}} className="dark:text-purple-400/60 text-gray-400 hover:text-brand-pink transition-colors"><Mic className="w-4 h-4" /></button>
                <button onClick={sendMsg} disabled={!input.trim() || sending}
                  className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all">
                  {sending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">💬</div>
            <div className="text-center">
              <p className="font-bold dark:text-white text-gray-900 mb-1">Select a room</p>
              <p className="text-sm dark:text-pink-300/60 text-gray-500">Choose a group from the list to start chatting</p>
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
              className="dark:bg-[#0D0A14] bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b dark:border-purple-900/20 border-gray-100">
                <h2 className="font-display font-black text-lg dark:text-white text-gray-900">Create Room</h2>
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-3 items-center">
                  <input value={createForm.emoji} onChange={e => setCreateForm(f => ({ ...f, emoji: e.target.value }))}
                    className="w-14 h-14 rounded-2xl dark:bg-purple-900/10 bg-gray-50 text-center text-2xl border dark:border-purple-500/15 border-gray-200 focus:outline-none focus:dark:border-pink-500/30" maxLength={2} />
                  <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Room name*" className="flex-1 px-4 py-3 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:text-white text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 border dark:border-purple-500/15 border-gray-200 text-sm focus:outline-none focus:dark:border-pink-500/30" />
                </div>
                <input value={createForm.topic} onChange={e => setCreateForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Room topic / description" className="w-full px-4 py-3 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:text-white text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 border dark:border-purple-500/15 border-gray-200 text-sm focus:outline-none focus:dark:border-pink-500/30" />
                <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:text-white text-gray-900 border dark:border-purple-500/15 border-gray-200 text-sm focus:outline-none focus:dark:border-pink-500/30">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{categoryEmojis[c] || ''} {c}</option>)}
                </select>
                <div className="flex gap-2">
                  {(['public', 'private'] as const).map(t => (
                    <button key={t} onClick={() => setCreateForm(f => ({ ...f, type: t }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${createForm.type === t ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-purple-300/70 text-gray-600'}`}>
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
    </div>
  )
}
