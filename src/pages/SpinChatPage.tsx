import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Zap, RefreshCw, Heart, X, MessageCircle, Shield, Globe, Sparkles, Send, Phone, Video, Database, CheckCircle2, Radio } from 'lucide-react'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { StreamContext } from '@/contexts/StreamContext'
import { getOrCreateDirectChannel } from '@/lib/stream'

const defaultEmojis = ['👩🏾', '👨🏿', '👩🏽', '👨🏾', '👩🏿', '👨🏽']

const segments = ['💕', '🔥', '⭐', '💎', '🎯', '✨', '🌟', '💫', '🎪', '🎭', '🎨', '🎵']
const SEGMENT_COUNT = segments.length
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT

interface SpinProfile {
  id: string
  name: string
  age: number
  emoji: string
  country: string
  flag: string
  interests: string[]
  bio: string
  online: boolean
  lastSeenMs: number   // raw epoch ms — used to recompute online at spin time
  avatar_url: string | null
}
type Phase = 'idle' | 'spinning' | 'matched' | 'chatting' | 'skipped'

/** Score how well a candidate profile matches the current user's interests + country.
 *  Higher = better match. Used to bias the spin pool toward compatible people. */
function scoreMatch(
  candidate: SpinProfile,
  myInterests: string[],
  myCountry: string,
): number {
  let score = 0
  // Shared interests: 10 pts each
  if (myInterests.length > 0) {
    const mine = new Set(myInterests.map(i => i.toLowerCase().trim()))
    for (const interest of candidate.interests) {
      if (mine.has(interest.toLowerCase().trim())) score += 10
    }
  }
  // Same country: 5 pts
  if (myCountry && candidate.country && myCountry.toLowerCase() === candidate.country.toLowerCase()) {
    score += 5
  }
  return score
}

export default function SpinChatPage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('idle')
  const [currentProfile, setCurrentProfile] = useState<SpinProfile | null>(null)
  const [rotation, setRotation] = useState(0)
  const [spinCount, setSpinCount] = useState(0)
  const [messages, setMessages] = useState<{ text: string; mine: boolean; time: string }[]>([])
  const [input, setInput] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [poolProfiles, setPoolProfiles] = useState<SpinProfile[]>([])
  const [dbConnected, setDbConnected] = useState(false)
  const [connectSaving, setConnectSaving] = useState(false)
  const [connectDone, setConnectDone] = useState(false)
  const [chatMode, setChatMode] = useState<'idle' | 'connecting' | 'live'>('idle')
  // Current user's profile data for smart matching
  const [myInterests, setMyInterests] = useState<string[]>([])
  const [myCountry, setMyCountry] = useState('')
  const controls = useAnimation()
  const { startCall } = useLiveKitCall()
  const { connected: streamConnected } = useContext(StreamContext)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // ── Supabase Realtime Presence: who's actively on SpinChat right now ──────
  const [spinActiveIds, setSpinActiveIds] = useState<Set<string>>(new Set())
  const presenceChannelRef = useRef<any>(null)

  const handlePresenceSync = useCallback((channel: any) => {
    const state = channel.presenceState() as Record<string, Array<{ user_id: string }>>
    const ids = new Set(
      Object.values(state)
        .flat()
        .map((p: any) => p.user_id as string)
        .filter(Boolean)
    )
    // Exclude self from the active count
    ids.delete(user?.id ?? '')
    setSpinActiveIds(ids)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase.channel('spin-chat-presence', {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => handlePresenceSync(channel))
      .on('presence', { event: 'join' }, () => handlePresenceSync(channel))
      .on('presence', { event: 'leave' }, () => handlePresenceSync(channel))
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, joined_at: new Date().toISOString() })
        }
      })

    presenceChannelRef.current = channel

    return () => {
      channel.untrack().catch(() => {})
      supabase.removeChannel(channel)
      presenceChannelRef.current = null
    }
  }, [user?.id, handlePresenceSync])

  // Mark current user as present in SpinChat and refresh every 2 min
  useEffect(() => {
    if (!user?.id) return
    const updatePresence = () =>
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id)
    updatePresence()
    const interval = setInterval(updatePresence, 120_000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Fetch current user's interests + country for smart matching
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('interests, country')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return
        const interests = Array.isArray(data.interests)
          ? (data.interests as string[])
          : String(data.interests || '').split(',').map((s: string) => s.trim()).filter(Boolean)
        setMyInterests(interests)
        setMyCountry(data.country || '')
      })
    return () => { cancelled = true }
  }, [user?.id])

  useEffect(() => {
    const fetchPool = async () => {
      let q = supabase
        .from('profiles')
        .select('id, full_name, date_of_birth, avatar_url, country, bio, interests, last_seen')
        .order('last_seen', { ascending: false })
        .limit(50)

      // Exclude current user from the spin pool
      if (user?.id) q = q.neq('id', user.id)

      const { data, error } = await q

      if (!error && data && data.length > 0) {
        setDbConnected(true)
        const now = Date.now()
        const mapped: SpinProfile[] = data.map((p: any, i: number) => {
          const dob = p.date_of_birth ? new Date(p.date_of_birth) : null
          const age = dob ? Math.floor((now - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : 22 + i
          // Online = seen within last 5 minutes
          const online = p.last_seen ? (now - new Date(p.last_seen).getTime()) < 300_000 : false
          return {
            id: p.id,
            name: p.full_name || 'Anonymous',
            age,
            emoji: defaultEmojis[i % defaultEmojis.length],
            country: p.country || 'Africa',
            flag: '🌍',
            interests: p.interests
              ? (Array.isArray(p.interests) ? p.interests.slice(0, 3) : String(p.interests).split(',').map((s: string) => s.trim()).slice(0, 3))
              : ['Connect', 'Chat', 'Meet'],
            bio: p.bio || 'Looking for amazing connections! 💕',
            online,
            lastSeenMs: p.last_seen ? new Date(p.last_seen).getTime() : 0,
            avatar_url: p.avatar_url || null,
          }
        })
        setPoolProfiles(mapped)
      }
    }
    fetchPool()
  }, [user?.id])

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

  // Set up a real Stream Chat channel when a match is made
  useEffect(() => {
    if (phase !== 'matched' || !currentProfile || !user) return
    if (!streamConnected) { return } // chat stays idle/disabled until Stream connects

    let cancelled = false
    // Track the channel created in this effect run so cleanup can target it specifically
    let effectChannel: any = null
    setChatMode('connecting')

    const setup = async () => {
      try {
        const channel = getOrCreateDirectChannel(user.id, currentProfile.id)
        await channel.watch()
        if (cancelled) {
          channel.stopWatching().catch(() => {})
          return
        }
        effectChannel = channel
        channelRef.current = channel

        // Load any existing message history
        const history = channel.state.messages.slice(-30).map((m: any) => ({
          text: m.text || '',
          mine: m.user?.id === user.id,
          time: new Date(m.created_at as string).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        }))
        if (history.length > 0) setMessages(history)

        // Listen for new messages from the other person
        channel.on('message.new', (event: any) => {
          if (!event.message || event.message.user?.id === user.id) return
          setMessages(prev => [...prev, {
            text: event.message!.text || '',
            mine: false,
            time: new Date(event.message!.created_at as string).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
          }])
        })

        if (!cancelled) setChatMode('live')
      } catch {
        if (!cancelled) setChatMode('idle')
      }
    }

    setup()
    return () => {
      cancelled = true
      // Tear down whichever channel this effect created
      if (effectChannel) {
        effectChannel.off()
        effectChannel.stopWatching().catch(() => {})
        if (channelRef.current === effectChannel) channelRef.current = null
      }
    }
  }, [phase, currentProfile?.id, user?.id, streamConnected])

  // Cleanup channel and pending timers on unmount
  useEffect(() => {
    return () => {
      channelRef.current?.stopWatching?.()
      channelRef.current = null
      pendingTimers.current.forEach(clearTimeout)
      pendingTimers.current = []
    }
  }, [])

  const spin = async () => {
    // Clean up previous channel
    channelRef.current?.stopWatching?.()
    channelRef.current = null
    setChatMode('idle')
    setPhase('spinning')
    setConnectDone(false)
    const spins = 5 + Math.random() * 5
    const extraDeg = Math.random() * 360
    const totalDeg = rotation + spins * 360 + extraDeg
    setRotation(totalDeg)
    await controls.start({ rotate: totalDeg, transition: { duration: 3 + Math.random() * 2, ease: [0.17, 0.67, 0.12, 0.99] as any } })
    // Recompute online status from stored lastSeenMs at spin time (fresh check,
    // no extra DB round-trip). Self is always excluded from the pool.
    const now = Date.now()
    const others = poolProfiles.filter(p => p.id !== user?.id)
    // Priority 1: users actively on SpinChat right now (Realtime Presence)
    const presencePool = others.filter(p => spinActiveIds.has(p.id))
    // Priority 2: users seen within 5 minutes
    const onlinePool = others.filter(p => now - p.lastSeenMs < 300_000)
    // Priority 3: anyone in the pool
    const pool = presencePool.length > 0 ? presencePool : onlinePool.length > 0 ? onlinePool : others
    if (pool.length === 0) { setPhase('idle'); return }

    // ── Smart matching: score by shared interests + country, pick from top-3 ──
    // Sorting by score descending; ties preserve original array order (stable sort).
    // We then pick randomly among the top-3 so the wheel feels genuinely random
    // while still preferring the most compatible people.
    const scored = pool
      .map(p => ({ p, score: scoreMatch(p, myInterests, myCountry) }))
      .sort((a, b) => b.score - a.score)
    // Take the top-3 candidates (or all if fewer) and pick randomly among them
    const topCandidates = scored.slice(0, Math.min(3, scored.length))
    const profile = topCandidates[Math.floor(Math.random() * topCandidates.length)].p
    setCurrentProfile(profile)
    setSpinCount(c => c + 1)
    setMessages([])
    setPhase('matched')
  }

  const sendMsg = async () => {
    if (!input.trim() || chatMode === 'connecting') return
    const text = input.trim()
    const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
    setInput('')

    if (chatMode === 'live' && channelRef.current) {
      // Optimistic: add locally, event will handle incoming from other user
      setMessages(prev => [...prev, { text, mine: true, time: now }])
      try { await channelRef.current.sendMessage({ text }) } catch { /* optimistic already shown */ }
    }
  }

  const reset = () => {
    channelRef.current?.stopWatching?.()
    channelRef.current = null
    setChatMode('idle')
    setPhase('idle')
    setCurrentProfile(null)
    setMessages([])
    setConnectDone(false)
  }

  const handleConnect = async () => {
    if (!user || !currentProfile || connectSaving || connectDone) return
    setConnectSaving(true)
    try {
      // Save as a like/swipe in DB so it can become a match
      await supabase.from('swipes').upsert({
        swiper_id: user.id,
        swiped_id: currentProfile.id,
        action: 'like',
        source: 'spin_chat',
      }, { onConflict: 'swiper_id,swiped_id' })
    } catch {
      // Silently continue — connect is a soft action
    }
    setConnectSaving(false)
    setConnectDone(true)
    // Auto-reset after 2.5s
    const t = setTimeout(reset, 2500)
    pendingTimers.current.push(t)
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
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${dbConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-400'}`}>
            <Database className="w-3 h-3" />
            <span className="hidden sm:inline">{dbConnected ? 'Live' : 'Offline'}</span>
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
              className="h-full flex flex-col items-center justify-center px-4 py-6 gap-5 sm:gap-8">

              {!dbConnected && poolProfiles.length === 0 && phase === 'idle' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-xs text-fuchsia-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                  Waiting for live users — connect your Supabase to enable Spin & Chat
                </div>
              )}

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
                  {poolProfiles.length} people ready to connect
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
                  { icon: Heart, label: 'On SpinChat', value: (spinActiveIds.size > 0 ? spinActiveIds.size : poolProfiles.filter(p => p.online).length).toString() || '0', color: 'text-pink-500' },
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

              {/* Call + Follow buttons */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="flex items-center gap-2 w-full max-w-sm">
                <button onClick={() => handleSpinCall('audio')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold text-xs hover:bg-emerald-500/20 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Voice
                </button>
                <button onClick={() => handleSpinCall('video')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 font-semibold text-xs hover:bg-blue-500/20 transition-colors">
                  <Video className="w-3.5 h-3.5" /> Video
                </button>
                <button onClick={async () => {
                  if (!user || !currentProfile) return
                  await supabase.from('follows').insert({ follower_id: user.id, following_id: currentProfile.id })
                  await supabase.from('notifications').insert({ user_id: currentProfile.id, type: 'follow', from_user_id: user.id }).then(() => {})
                }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 font-semibold text-xs hover:bg-fuchsia-500/20 transition-colors">
                  <Zap className="w-3.5 h-3.5" /> Follow
                </button>
              </motion.div>

              {/* Chat section */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="w-full max-w-sm flex-1 flex flex-col dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-100 overflow-hidden min-h-[240px]">
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/5 border-gray-100">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-fuchsia-500" />
                    <span className="text-sm font-semibold dark:text-white text-gray-900">Chat</span>
                  </div>
                  {/* Chat mode badge */}
                  {chatMode === 'live' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                      <Radio className="w-2.5 h-2.5" /> Live
                    </span>
                  )}
                  {chatMode === 'connecting' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400 text-[10px] font-semibold">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Connecting…
                    </span>
                  )}
                  {chatMode === 'idle' && !streamConnected && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold">Connecting…</span>
                  )}
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
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && void sendMsg()}
                    disabled={chatMode !== 'live'}
                    placeholder={chatMode === 'connecting' ? 'Connecting to chat…' : chatMode === 'live' ? 'Say hello...' : 'Chat connecting…'}
                    className="flex-1 bg-transparent text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
                  />
                  <button onClick={() => void sendMsg()} disabled={!input.trim() || chatMode !== 'live'} className="w-7 h-7 rounded-lg bg-love-gradient flex items-center justify-center disabled:opacity-40">
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
