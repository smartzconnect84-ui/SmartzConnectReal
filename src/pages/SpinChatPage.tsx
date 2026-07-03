import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Zap, RefreshCw, Heart, X, MessageCircle, Shield, Globe, Sparkles, Send, Phone, Video, Database, CheckCircle2 } from 'lucide-react'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const fallbackProfiles = [
  { name: 'Amara K.',   age: 24, emoji: '👩🏾', country: 'Sierra Leone', flag: '🇸🇱', interests: ['Music', 'Travel', 'Food'],    bio: 'Love exploring new cultures and meeting amazing people! 🌍', online: true,  avatar_url: null },
  { name: 'Fatima D.',  age: 26, emoji: '👩🏽', country: 'Senegal',      flag: '🇸🇳', interests: ['Art', 'Dance', 'Fashion'],    bio: 'Artist by day, dancer by night 💃 Looking for genuine connections', online: true,  avatar_url: null },
  { name: 'Grace K.',   age: 22, emoji: '👩🏿', country: 'Liberia',      flag: '🇱🇷', interests: ['Movies', 'Cooking', 'Books'], bio: 'Foodie and movie buff 🎬 Let\'s talk about everything!', online: false, avatar_url: null },
  { name: 'Nadia M.',   age: 28, emoji: '👩🏾', country: 'Ghana',        flag: '🇬🇭', interests: ['Music', 'Fitness', 'Tech'],   bio: 'Tech girl who loves Afrobeats 🎵 Always up for a good chat', online: true,  avatar_url: null },
  { name: 'Aisha T.',   age: 23, emoji: '👩🏽', country: 'Guinea',       flag: '🇬🇳', interests: ['Travel', 'Books', 'Nature'],  bio: 'Wanderlust soul 🌿 Reading books and exploring the world', online: true,  avatar_url: null },
]

const defaultEmojis = ['👩🏾', '👨🏿', '👩🏽', '👨🏾', '👩🏿', '👨🏽']
const segments = ['💕', '🔥', '⭐', '💎', '🎯', '✨', '🌟', '💫', '🎪', '🎭', '🎨', '🎵']
const SEGMENT_COUNT = segments.length
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT

type SpinProfile = typeof fallbackProfiles[0]
type Phase = 'idle' | 'spinning' | 'matched' | 'chatting' | 'skipped'

export default function SpinChatPage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('idle')
  const [currentProfile, setCurrentProfile] = useState<SpinProfile | null>(null)
  const [rotation, setRotation] = useState(0)
  const [spinCount, setSpinCount] = useState(0)
  const [messages, setMessages] = useState<{ text: string; mine: boolean; time: string }[]>([])
  const [input, setInput] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [poolProfiles, setPoolProfiles] = useState<SpinProfile[]>(fallbackProfiles)
  const [dbConnected, setDbConnected] = useState(false)
  const [connectSaving, setConnectSaving] = useState(false)
  const [connectDone, setConnectDone] = useState(false)
  const controls = useAnimation()
  const { startCall } = useLiveKitCall()

  useEffect(() => {
    const fetchPool = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, date_of_birth, avatar_url, country, bio, interests, last_seen')
        .order('last_seen', { ascending: false })
        .limit(30)

      if (!error && data && data.length > 0) {
        setDbConnected(true)
        const mapped: SpinProfile[] = data.map((p: any, i: number) => {
          const dob = p.date_of_birth ? new Date(p.date_of_birth) : null
          const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : 22 + i
          return {
            name: p.full_name || 'Anonymous',
            age,
            emoji: defaultEmojis[i % defaultEmojis.length],
            country: p.country || 'Africa',
            flag: '🌍',
            interests: p.interests
              ? (Array.isArray(p.interests) ? p.interests.slice(0, 3) : String(p.interests).split(',').map((s: string) => s.trim()).slice(0, 3))
              : ['Connect', 'Chat', 'Meet'],
            bio: p.bio || 'Looking for amazing connections! 💕',
            online: p.last_seen ? (Date.now() - new Date(p.last_seen).getTime()) < 300000 : false,
            avatar_url: p.avatar_url || null,
          }
        })
        setPoolProfiles(mapped)
      }
    }
    fetchPool()
  }, [])

  const handleSpinCall = (type: 'video' | 'audio') => {
    if (!currentProfile) return
    const roomId = `SmartzConnect-spin-${type}-${Date.now()}`
    startCall({
      roomId,
      type,
      participantName: anonymous ? 'Anonymous Match' : currentProfile.name,
      participantEmoji: anonymous ? '🎭' : currentProfile.emoji,
    })
  }

  const spin = async () => {
    setPhase('spinning')
    setConnectDone(false)
    const spins = 5 + Math.random() * 5
    const extraDeg = Math.random() * 360
    const totalDeg = rotation + spins * 360 + extraDeg
    setRotation(totalDeg)
    await controls.start({ rotate: totalDeg, transition: { duration: 3 + Math.random() * 2, ease: [0.17, 0.67, 0.12, 0.99] as any } })
    const pool = poolProfiles.filter(p => p.online || true)
    const profile = pool[Math.floor(Math.random() * pool.length)]
    setCurrentProfile(profile)
    setSpinCount(c => c + 1)
    setMessages([{ text: `Hey! We just matched on Spin & Chat 🎉 How are you?`, mine: false, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }])
    setPhase('matched')
  }

  const sendMsg = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, { text: input, mine: true, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }])
    setInput('')
    setTimeout(() => {
      const replies = ["That's so interesting! Tell me more 😊", "Haha yes! I totally agree 😂", "Where are you from? 🌍", "You seem really cool! 💕", "I love that! We have so much in common 🔥"]
      setMessages(prev => [...prev, { text: replies[Math.floor(Math.random() * replies.length)], mine: false, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }])
    }, 1500)
  }

  const reset = () => { setPhase('idle'); setCurrentProfile(null); setMessages([]); setConnectDone(false) }

  const handleConnect = async () => {
    if (!user || !currentProfile || connectSaving || connectDone) return
    setConnectSaving(true)
    try {
      // Save as a like/swipe in DB so it can become a match
      await supabase.from('swipes').upsert({
        swiper_id: user.id,
        swiped_id: currentProfile.name, // fallback uses name; real DB profiles have id
        action: 'like',
        source: 'spin_chat',
      }, { onConflict: 'swiper_id,swiped_id' })
    } catch {
      // Silently continue — connect is a soft action
    }
    setConnectSaving(false)
    setConnectDone(true)
    // Auto-reset after 2.5s
    setTimeout(reset, 2500)
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <div>
          <h1 className="font-display font-black text-lg sm:text-xl dark:text-white text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-fuchsia-500" /> Spin & Chat
          </h1>
          <p className="text-xs dark:text-gray-400 text-gray-500">Spin the wheel, meet someone new instantly</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${dbConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-fuchsia-500/10 text-fuchsia-500'}`}>
            <Database className="w-3 h-3" />
            <span className="hidden sm:inline">{dbConnected ? 'Live' : 'Demo'}</span>
          </div>
          <span className="text-xs dark:text-gray-400 text-gray-500 bg-fuchsia-500/10 text-fuchsia-500 px-2.5 py-1 rounded-full font-semibold">{spinCount} spins</span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="text-xs dark:text-gray-400 text-gray-500 hidden sm:inline">Anonymous</span>
            <div onClick={() => setAnonymous(a => !a)}
              className={`w-9 h-5 rounded-full transition-colors relative ${anonymous ? 'bg-fuchsia-500' : 'dark:bg-white/10 bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${anonymous ? 'left-4' : 'left-0.5'}`} />
            </div>
          </label>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── Idle / Spin Phase ── */}
          {(phase === 'idle' || phase === 'spinning' || phase === 'skipped') && (
            <motion.div key="spin-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center px-4 py-6 gap-6 sm:gap-8">

              {/* Spin wheel */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-fuchsia-500/10 blur-2xl" />
                <motion.div animate={controls}
                  className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-fuchsia-500/30 overflow-hidden flex-shrink-0">
                  {segments.map((seg, i) => (
                    <div key={i}
                      className="absolute inset-0 flex items-start justify-center pt-3 text-base sm:text-lg font-bold"
                      style={{
                        transform: `rotate(${i * SEGMENT_ANGLE}deg)`,
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan(Math.PI / SEGMENT_COUNT)}% 0%)`,
                        background: i % 2 === 0
                          ? 'linear-gradient(135deg,rgba(236,72,153,0.3),rgba(168,85,247,0.3))'
                          : 'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(236,72,153,0.2))',
                      }}>
                      {seg}
                    </div>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-love-gradient flex items-center justify-center shadow-lg">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-fuchsia-500 filter drop-shadow-lg" />
              </div>

              <div className="text-center max-w-xs">
                <p className="text-sm sm:text-base dark:text-gray-300 text-gray-600 mb-1">
                  {phase === 'spinning' ? '🎲 Finding your match...' : '🎡 Spin to meet someone amazing!'}
                </p>
                <p className="text-xs dark:text-gray-500 text-gray-400">
                  {poolProfiles.length} people ready to connect {dbConnected ? '· Live' : '· Demo mode'}
                </p>
              </div>

              <motion.button onClick={spin} disabled={phase === 'spinning'}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="relative px-10 py-4 rounded-2xl bg-love-gradient text-white font-black text-base sm:text-lg shadow-2xl shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
                {phase === 'spinning' ? (
                  <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" /> Spinning...</span>
                ) : (
                  <span className="flex items-center gap-2"><Zap className="w-5 h-5" /> Spin & Match!</span>
                )}
              </motion.button>

              <div className="flex items-center gap-4 sm:gap-6 text-center">
                {[
                  { icon: Globe, label: 'Countries', value: '54+', color: 'text-blue-500' },
                  { icon: Heart, label: 'Online Now', value: poolProfiles.filter(p => p.online).length.toString() || '...' , color: 'text-pink-500' },
                  { icon: Shield, label: 'Safe', value: '100%', color: 'text-emerald-500' },
                ].map(stat => (
                  <div key={stat.label} className="flex flex-col items-center gap-1">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <p className="font-black text-sm dark:text-white text-gray-900">{stat.value}</p>
                    <p className="text-[10px] dark:text-gray-500 text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Matched Phase ── */}
          {phase === 'matched' && currentProfile && (
            <motion.div key="matched" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="h-full overflow-y-auto flex flex-col items-center px-4 py-6 gap-4">

              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-fuchsia-500" />
                  <h2 className="font-display font-black text-xl text-fuchsia-500">It's a Match!</h2>
                  <Sparkles className="w-5 h-5 text-fuchsia-500" />
                </div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Say hi and start the conversation 👋</p>
              </motion.div>

              {/* Profile card */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="w-full max-w-sm dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-100 p-4 shadow-lg">
                <div className="flex items-center gap-4">
                  {currentProfile.avatar_url ? (
                    <img src={currentProfile.avatar_url} alt={currentProfile.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-love-gradient flex items-center justify-center text-3xl flex-shrink-0">
                      {currentProfile.emoji}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold dark:text-white text-gray-900">{anonymous ? 'Anonymous' : currentProfile.name}</h3>
                      {currentProfile.online && <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[9px] font-bold">ONLINE</span>}
                    </div>
                    <p className="text-xs dark:text-gray-400 text-gray-500">{currentProfile.age} · {currentProfile.flag} {anonymous ? 'Somewhere' : currentProfile.country}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {currentProfile.interests.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full dark:bg-white/5 bg-gray-100 text-[10px] dark:text-gray-300 text-gray-600">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {!anonymous && <p className="text-xs dark:text-gray-400 text-gray-500 mt-3 leading-relaxed">{currentProfile.bio}</p>}
              </motion.div>

              {/* Call buttons */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="flex items-center gap-3 w-full max-w-sm">
                <button onClick={() => handleSpinCall('audio')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold text-sm hover:bg-emerald-500/20 transition-colors">
                  <Phone className="w-4 h-4" /> Voice
                </button>
                <button onClick={() => handleSpinCall('video')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 font-semibold text-sm hover:bg-blue-500/20 transition-colors">
                  <Video className="w-4 h-4" /> Video
                </button>
              </motion.div>

              {/* Chat section */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="w-full max-w-sm flex-1 flex flex-col dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-100 overflow-hidden min-h-[240px]">
                <div className="flex items-center gap-2 px-4 py-3 border-b dark:border-white/5 border-gray-100">
                  <MessageCircle className="w-4 h-4 text-fuchsia-500" />
                  <span className="text-sm font-semibold dark:text-white text-gray-900">Chat</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${m.mine ? 'bg-love-gradient text-white rounded-tr-sm' : 'dark:bg-white/8 bg-gray-100 dark:text-white text-gray-900 rounded-tl-sm'}`}>
                        {m.text}
                        <div className="text-[9px] opacity-60 mt-0.5 text-right">{m.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2.5 border-t dark:border-white/5 border-gray-100 flex items-center gap-2">
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
                    placeholder="Say hello..." className="flex-1 bg-transparent text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none" />
                  <button onClick={sendMsg} disabled={!input.trim()} className="w-7 h-7 rounded-lg bg-love-gradient flex items-center justify-center disabled:opacity-40">
                    <Send className="w-3 h-3 text-white" />
                  </button>
                </div>
              </motion.div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 w-full max-w-sm pb-2">
                <button onClick={() => { setPhase('skipped'); reset() }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 font-semibold text-sm hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" /> Skip
                </button>
                <button onClick={spin}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-love-gradient text-white font-semibold text-sm hover:opacity-90 transition-opacity">
                  <RefreshCw className="w-4 h-4" /> Spin Again
                </button>
                <button
                  onClick={handleConnect}
                  disabled={connectSaving || connectDone}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all ${
                    connectDone
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                      : 'bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 hover:bg-fuchsia-500/20 disabled:opacity-60'
                  }`}
                >
                  {connectDone
                    ? <><CheckCircle2 className="w-4 h-4" /> Matched!</>
                    : connectSaving
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Heart className="w-4 h-4" /> Connect</>
                  }
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
