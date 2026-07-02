import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Users, Lock, Globe, Send, Smile, Mic, Crown, Shield, X, Loader2 } from 'lucide-react'

interface Room {
  id: string; name: string; emoji: string; topic: string; members: number
  online: number; lastMsg: string; lastTime: string; unread: number
  type: 'public' | 'private'; category: string; pinned?: boolean
}

const initialRooms: Room[] = [
  { id: '1', name: 'Liberia Connect',      emoji: '🇱🇷', topic: 'Liberians worldwide',          members: 4820, online: 312, lastMsg: 'Anyone in Monrovia tonight?',       lastTime: '1m',  unread: 5,  type: 'public',  category: 'Country',  pinned: true },
  { id: '2', name: 'Africa Dating Tips',   emoji: '💕', topic: 'Relationship advice & tips',    members: 12400, online: 890, lastMsg: 'Communication is key in any…',    lastTime: '3m',  unread: 12, type: 'public',  category: 'Dating',   pinned: true },
  { id: '3', name: 'SmartzTV Creators',    emoji: '📺', topic: 'Live streaming tips & collabs', members: 3200, online: 145, lastMsg: 'My stream hit 1K viewers!!! 🎉',   lastTime: '8m',  unread: 0,  type: 'public',  category: 'Creators' },
  { id: '4', name: 'West Africa Vibes',    emoji: '🌍', topic: 'West African culture & music',  members: 8900, online: 560, lastMsg: 'New Burna Boy track is 🔥🔥🔥',    lastTime: '12m', unread: 3,  type: 'public',  category: 'Culture' },
  { id: '5', name: 'Entrepreneurs Hub',    emoji: '💼', topic: 'Business & startup ideas',      members: 5600, online: 230, lastMsg: 'Looking for co-founder in tech',   lastTime: '25m', unread: 0,  type: 'public',  category: 'Business' },
  { id: '6', name: 'Music Lovers Africa',  emoji: '🎵', topic: 'Afrobeats, Highlife & more',    members: 15000, online: 1200, lastMsg: 'Who is going to Afro Nation?',   lastTime: '30m', unread: 7,  type: 'public',  category: 'Music' },
  { id: '7', name: 'VIP Lounge 👑',        emoji: '💎', topic: 'Exclusive VIP members only',    members: 890,  online: 67,  lastMsg: 'Private event this Saturday!',    lastTime: '1h',  unread: 2,  type: 'private', category: 'VIP' },
  { id: '8', name: 'Foodies of Africa',    emoji: '🍽️', topic: 'African cuisine & recipes',     members: 6700, online: 340, lastMsg: 'Just made jollof rice 😋',         lastTime: '2h',  unread: 0,  type: 'public',  category: 'Food' },
]

const categories = ['All', 'Dating', 'Country', 'Music', 'Culture', 'Business', 'Creators', 'VIP', 'Food']

const roomMessages = [
  { id: '1', author: 'Amara K.',   emoji: '👩🏾', text: 'Anyone in Monrovia tonight? 🇱🇷',                  time: '10:01', mine: false, role: 'member' },
  { id: '2', author: 'James T.',   emoji: '👨🏿', text: 'Yes! Going to the beach 🏖️',                       time: '10:02', mine: false, role: 'member' },
  { id: '3', author: 'You',        emoji: '😊', text: 'I am in Sinkor area, what about you all?',          time: '10:03', mine: true,  role: 'member' },
  { id: '4', author: 'Admin',      emoji: '🛡️', text: '📌 Reminder: Keep conversations respectful!',      time: '10:04', mine: false, role: 'admin' },
  { id: '5', author: 'Fatima D.',  emoji: '👩🏽', text: 'I am in Paynesville! We should meet up 😊',        time: '10:05', mine: false, role: 'member' },
  { id: '6', author: 'You',        emoji: '😊', text: 'That sounds great! 🙌',                             time: '10:06', mine: true,  role: 'member' },
]

const categoryEmojis: Record<string, string> = {
  Dating: '💕', Country: '🌍', Music: '🎵', Culture: '🎭',
  Business: '💼', Creators: '📺', VIP: '💎', Food: '🍽️',
}

interface CreateRoomForm {
  name: string; topic: string; category: string; type: 'public' | 'private'; emoji: string
}

export default function GroupChatPage() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeRoom, setActiveRoom] = useState<Room | null>(rooms[0])
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(roomMessages)
  const [showMembers, setShowMembers] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateRoomForm>({
    name: '', topic: '', category: 'Dating', type: 'public', emoji: '💬'
  })

  const filtered = rooms.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.topic.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (activeCategory === 'All' || r.category === activeCategory)
  })

  const sendMsg = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, { id: Date.now().toString(), author: 'You', emoji: '😊', text: input, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }), mine: true, role: 'member' }])
    setInput('')
  }

  const handleCreateRoom = async () => {
    if (!createForm.name.trim()) return
    setCreating(true)
    // Simulate async creation (replace with supabase insert when table exists)
    await new Promise(r => setTimeout(r, 600))
    const newRoom: Room = {
      id: Date.now().toString(),
      name: createForm.name.trim(),
      emoji: createForm.emoji,
      topic: createForm.topic.trim() || 'New room',
      members: 1,
      online: 1,
      lastMsg: 'Room created!',
      lastTime: 'now',
      unread: 0,
      type: createForm.type,
      category: createForm.category,
    }
    setRooms(prev => [newRoom, ...prev])
    setActiveRoom(newRoom)
    setMessages([{ id: '1', author: 'Admin', emoji: '🛡️', text: `Welcome to ${newRoom.name}! You created this room.`, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }), mine: false, role: 'admin' }])
    setCreating(false)
    setShowCreateModal(false)
    setCreateForm({ name: '', topic: '', category: 'Dating', type: 'public', emoji: '💬' })
  }

  return (
    <div className="h-full flex dark:bg-[#0A0710] bg-gray-50 relative">

      {/* ── Create Room Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !creating && setShowCreateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/10 border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b dark:border-white/8 border-gray-100">
                <div>
                  <h3 className="font-bold dark:text-white text-gray-900">Create Room</h3>
                  <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">Start a new group chat community</p>
                </div>
                <button onClick={() => !creating && setShowCreateModal(false)}
                  className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Emoji + Name */}
                <div className="flex gap-3">
                  <div className="relative">
                    <input
                      value={createForm.emoji}
                      onChange={e => setCreateForm(f => ({ ...f, emoji: e.target.value }))}
                      maxLength={2}
                      className="w-14 h-12 text-center text-2xl rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 focus:outline-none focus:border-brand-pink transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      value={createForm.name}
                      onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Room name (required)"
                      maxLength={40}
                      className="w-full h-12 px-4 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-brand-pink transition-colors"
                    />
                  </div>
                </div>

                {/* Topic */}
                <input
                  value={createForm.topic}
                  onChange={e => setCreateForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Room topic / description"
                  maxLength={80}
                  className="w-full px-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-brand-pink transition-colors"
                />

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(1).map(cat => (
                      <button key={cat} onClick={() => setCreateForm(f => ({ ...f, category: cat }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${createForm.category === cat ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                        {categoryEmojis[cat] || ''} {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div className="flex gap-3">
                  {(['public', 'private'] as const).map(t => (
                    <button key={t} onClick={() => setCreateForm(f => ({ ...f, type: t }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${createForm.type === t ? 'border-brand-pink bg-love-soft text-brand-pink' : 'dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:border-brand-pink/50'}`}>
                      {t === 'public' ? <><Globe className="w-4 h-4" /> Public</> : <><Lock className="w-4 h-4" /> Private</>}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={!createForm.name.trim() || creating}
                  className="w-full py-3 rounded-xl bg-love-gradient text-white font-bold text-sm shadow-md shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                    : <><Plus className="w-4 h-4" /> Create Room</>
                  }
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Room list ── */}
      <div className={`flex flex-col w-full lg:w-80 xl:w-96 flex-shrink-0 dark:bg-[#0D0A14] bg-white border-r dark:border-white/6 border-gray-100 ${activeRoom ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-4 pt-5 pb-3 border-b dark:border-white/6 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Group Chats 💬</h1>
              <p className="text-xs dark:text-gray-400 text-gray-500">{rooms.length} active rooms</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-9 h-9 rounded-xl bg-love-gradient flex items-center justify-center shadow-md shadow-pink-500/20 hover:opacity-90 transition-opacity"
              title="Create room"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white shadow-sm' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="text-4xl">🔍</div>
              <p className="text-sm dark:text-gray-400 text-gray-500">No rooms found</p>
              <button onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20">
                Create one
              </button>
            </div>
          ) : filtered.map((room, i) => (
            <motion.button key={room.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              onClick={() => setActiveRoom(room)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:dark:bg-white/4 hover:bg-pink-50/50 transition-all border-b dark:border-white/4 border-gray-50 text-left ${activeRoom?.id === room.id ? 'dark:bg-white/6 bg-pink-50' : ''}`}>
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl dark:bg-white/8 bg-pink-50 flex items-center justify-center text-2xl">{room.emoji}</div>
                {room.type === 'private' && <Lock className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-amber-500 bg-white dark:bg-[#0D0A14] rounded-full p-0.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-bold dark:text-white text-gray-900 truncate">{room.name}</span>
                  {room.pinned && <span className="text-[9px] text-brand-pink">📌</span>}
                </div>
                <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{room.lastMsg}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] dark:text-gray-500 text-gray-400">{room.lastTime}</span>
                {room.unread > 0 && <span className="w-5 h-5 rounded-full bg-brand-pink text-white text-[9px] font-black flex items-center justify-center">{room.unread}</span>}
                <span className="text-[9px] text-emerald-500 font-semibold">{room.online} online</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Active room ── */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Room header */}
          <div className="flex items-center gap-3 px-4 py-3 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
            <button onClick={() => setActiveRoom(null)} className="lg:hidden w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
              <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
            <div className="w-10 h-10 rounded-2xl dark:bg-white/8 bg-pink-50 flex items-center justify-center text-xl flex-shrink-0">{activeRoom.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm dark:text-white text-gray-900">{activeRoom.name}</p>
                {activeRoom.type === 'private' && <Lock className="w-3 h-3 text-amber-500" />}
              </div>
              <p className="text-xs dark:text-gray-400 text-gray-500">{activeRoom.members.toLocaleString()} members · {activeRoom.online} online</p>
            </div>
            <button onClick={() => setShowMembers(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${showMembers ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              <Users className="w-3.5 h-3.5" /> Members
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.map((msg, i) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={`flex gap-2.5 ${msg.mine ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full dark:bg-white/8 bg-pink-50 flex items-center justify-center text-base flex-shrink-0">{msg.emoji}</div>
                    <div className={`max-w-[70%] ${msg.mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      {!msg.mine && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold dark:text-gray-400 text-gray-500">{msg.author}</span>
                          {msg.role === 'admin' && <Shield className="w-3 h-3 text-brand-pink" />}
                        </div>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.mine ? 'bg-love-gradient text-white rounded-br-sm' :
                        msg.role === 'admin' ? 'dark:bg-pink-500/10 bg-pink-50 text-brand-pink border border-pink-500/20 rounded-bl-sm' :
                        'dark:bg-[#1E1530] bg-white dark:text-gray-100 text-gray-900 border dark:border-white/6 border-gray-100 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] dark:text-gray-600 text-gray-400">{msg.time}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-3 py-3 dark:bg-[#0D0A14] bg-white border-t dark:border-white/6 border-gray-100 flex-shrink-0">
                <button className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors flex-shrink-0">
                  <Smile className="w-4 h-4 dark:text-gray-400 text-gray-600" />
                </button>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), sendMsg())}
                  placeholder={`Message ${activeRoom.name}…`}
                  className="flex-1 px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
                {input.trim() ? (
                  <button onClick={sendMsg} className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center shadow-md shadow-pink-500/25 flex-shrink-0">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                ) : (
                  <button className="w-10 h-10 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors flex-shrink-0">
                    <Mic className="w-4 h-4 dark:text-gray-400 text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Members panel */}
            <AnimatePresence>
              {showMembers && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                  className="flex-shrink-0 dark:bg-[#0D0A14] bg-white border-l dark:border-white/6 border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-brand-pink mb-3">Online · {activeRoom.online}</p>
                    {[
                      { name: 'Amara K.',  emoji: '👩🏾', role: 'admin',  online: true },
                      { name: 'James T.',  emoji: '👨🏿', role: 'member', online: true },
                      { name: 'Fatima D.', emoji: '👩🏽', role: 'vip',    online: true },
                      { name: 'Grace K.',  emoji: '👩🏿', role: 'member', online: false },
                      { name: 'Ibrahim T.',emoji: '👨🏾', role: 'member', online: false },
                    ].map(m => (
                      <div key={m.name} className="flex items-center gap-2 py-2">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full dark:bg-white/8 bg-pink-50 flex items-center justify-center text-sm">{m.emoji}</div>
                          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border dark:border-[#0D0A14] border-white ${m.online ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        </div>
                        <span className="text-xs dark:text-gray-300 text-gray-700 flex-1 truncate">{m.name}</span>
                        {m.role === 'admin' && <Shield className="w-3 h-3 text-brand-pink" />}
                        {m.role === 'vip' && <Crown className="w-3 h-3 text-amber-500" />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex flex-col items-center justify-center text-center p-8">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-2">Select a Room</h3>
          <p className="text-sm dark:text-gray-400 text-gray-500 mb-5">Join a group chat to connect with thousands of people</p>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-md shadow-pink-500/20">
            <Plus className="w-4 h-4" /> Create a Room
          </button>
        </div>
      )}
    </div>
  )
}
