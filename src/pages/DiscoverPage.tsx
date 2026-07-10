import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Heart, X, Star, MapPin, Briefcase, ChevronDown, RotateCcw, SlidersHorizontal, Shield, Database, RefreshCw, MessageCircle, UserPlus, Video, Phone } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'

interface Profile {
  id: number | string
  name: string
  age: number
  emoji?: string
  avatar_url?: string
  country?: string
  flag?: string
  job?: string
  occupation?: string
  distance?: string
  bio?: string
  tags?: string[]
  verified?: boolean
  premium?: boolean
  match?: number
  online?: boolean
}

const bgColors = [
  'from-pink-400/20 to-rose-600/15',
  'from-purple-400/20 to-violet-600/15',
  'from-fuchsia-400/20 to-pink-600/15',
  'from-amber-400/20 to-orange-600/15',
  'from-emerald-400/20 to-teal-600/15',
  'from-blue-400/20 to-indigo-600/15',
]

const defaultEmojis = ['👩🏾', '👨🏿', '👩🏽', '👨🏾', '👩🏿', '👨🏽', '👩🏾‍💼', '👨🏿‍💻']

function SwipeCard({ profile, onSwipe, isTop, stackIndex, onMessage, onFollow, onVideoCall, onAudioCall }: {
  profile: Profile
  onSwipe: (dir: 'left' | 'right' | 'super') => void
  isTop: boolean
  stackIndex: number
  onMessage?: () => void
  onFollow?: () => void
  onVideoCall?: () => void
  onAudioCall?: () => void
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-250, 250], [-20, 20])
  const likeOpacity  = useTransform(x, [30, 120],  [0, 1])
  const nopeOpacity  = useTransform(x, [-120, -30], [1, 0])
  const superOpacity = useTransform(y, [-120, -30], [1, 0])
  const [expanded, setExpanded] = useState(false)
  const bg = bgColors[Number(profile.id) % bgColors.length]
  const emoji = profile.emoji || defaultEmojis[Number(profile.id) % defaultEmojis.length]

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number } }) => {
    if (info.offset.y < -100)      onSwipe('super')
    else if (info.offset.x > 100)  onSwipe('right')
    else if (info.offset.x < -100) onSwipe('left')
  }

  const scale = 1 - stackIndex * 0.04
  const translateY = stackIndex * 10

  const tags = Array.isArray(profile.tags) ? profile.tags : []

  return (
    <motion.div
      style={{ x: isTop ? x : 0, y: isTop ? y : translateY, rotate: isTop ? rotate : 0, scale, zIndex: 20 - stackIndex }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      whileDrag={{ scale: 1.03 }}
    >
      <div className={`w-full h-full rounded-3xl overflow-hidden dark:bg-[#1A1228] bg-white shadow-2xl border dark:border-white/8 border-gray-100 flex flex-col bg-gradient-to-br ${bg}`}>
        {/* Photo area */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-[110px] sm:text-[140px] leading-none select-none filter drop-shadow-2xl">{emoji}</div>
          )}

          {/* Swipe overlays */}
          {isTop && (
            <>
              <motion.div style={{ opacity: likeOpacity }}
                className="absolute top-8 left-6 rotate-[-22deg] border-4 border-emerald-400 rounded-2xl px-4 py-2 bg-emerald-400/10 backdrop-blur-sm">
                <span className="text-2xl font-black text-emerald-400 tracking-widest">LIKE 💚</span>
              </motion.div>
              <motion.div style={{ opacity: nopeOpacity }}
                className="absolute top-8 right-6 rotate-[22deg] border-4 border-red-400 rounded-2xl px-4 py-2 bg-red-400/10 backdrop-blur-sm">
                <span className="text-2xl font-black text-red-400 tracking-widest">NOPE ✕</span>
              </motion.div>
              <motion.div style={{ opacity: superOpacity }}
                className="absolute top-8 left-1/2 -translate-x-1/2 border-4 border-blue-400 rounded-2xl px-4 py-2 bg-blue-400/10 backdrop-blur-sm">
                <span className="text-2xl font-black text-blue-400 tracking-widest">SUPER ⭐</span>
              </motion.div>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {profile.verified && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500 text-white text-[10px] font-bold shadow-lg">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}
            {profile.premium && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-lg">👑 VIP</span>
            )}
          </div>

          {/* Match % */}
          {profile.match && (
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30">
              <span className="text-xs font-black text-emerald-300">{profile.match}% Match</span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-display font-black text-xl dark:text-white text-gray-900 truncate">{profile.name}</h2>
              <span className="font-bold dark:text-gray-300 text-gray-600 flex-shrink-0">{profile.age}</span>
            </div>
            <button onClick={() => setExpanded(!expanded)} className="flex-shrink-0">
              <ChevronDown className={`w-5 h-5 dark:text-gray-400 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs dark:text-gray-400 text-gray-500 mb-2">
            {(profile.country || profile.flag) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {profile.flag} {profile.country}
              </span>
            )}
            {(profile.job || profile.occupation) && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {profile.job || profile.occupation}
              </span>
            )}
            {profile.distance && (
              <span>{profile.distance}</span>
            )}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                {profile.bio && <p className="text-xs dark:text-gray-300 text-gray-600 mb-3 leading-relaxed">{profile.bio}</p>}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tags.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full dark:bg-white/8 bg-gray-100 dark:text-gray-300 text-gray-600 text-[10px] font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Secondary action icons — message, follow, video, audio */}
        {isTop && (
          <div className="px-5 pb-1 flex items-center justify-center gap-2 border-t dark:border-white/5 border-gray-100 pt-2">
            <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); onMessage?.() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-100 hover:bg-blue-500/10 hover:border-blue-400/30 hover:text-blue-400 dark:text-gray-400 text-gray-500 transition-all text-[10px] font-semibold"
              title="Message">
              <MessageCircle className="w-3.5 h-3.5" /> Message
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); onFollow?.() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-100 hover:bg-emerald-500/10 hover:border-emerald-400/30 hover:text-emerald-400 dark:text-gray-400 text-gray-500 transition-all text-[10px] font-semibold"
              title="Follow">
              <UserPlus className="w-3.5 h-3.5" /> Follow
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); onVideoCall?.() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-100 hover:bg-violet-500/10 hover:border-violet-400/30 hover:text-violet-400 dark:text-gray-400 text-gray-500 transition-all text-[10px] font-semibold"
              title="Video Call">
              <Video className="w-3.5 h-3.5" /> Video
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); onAudioCall?.() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-100 hover:bg-amber-500/10 hover:border-amber-400/30 hover:text-amber-400 dark:text-gray-400 text-gray-500 transition-all text-[10px] font-semibold"
              title="Audio Call">
              <Phone className="w-3.5 h-3.5" /> Call
            </motion.button>
          </div>
        )}

        {/* Swipe action buttons */}
        <div className="px-5 pb-5 pt-2 flex items-center justify-center gap-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSwipe('left')}
            className="w-14 h-14 rounded-full bg-white dark:bg-white/10 shadow-xl flex items-center justify-center border dark:border-white/10 border-gray-200 hover:border-red-400 hover:shadow-red-500/20 transition-all">
            <X className="w-6 h-6 text-red-400" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSwipe('super')}
            className="w-12 h-12 rounded-full dark:bg-blue-500/15 bg-blue-50 shadow-md flex items-center justify-center border border-blue-400/30 hover:shadow-blue-500/20 transition-all">
            <Star className="w-5 h-5 text-blue-400" fill="currentColor" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSwipe('right')}
            className="w-14 h-14 rounded-full bg-love-gradient shadow-xl flex items-center justify-center shadow-pink-500/30 hover:shadow-pink-500/50 transition-all">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default function DiscoverPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { initiateCall } = useLiveKitCall()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [liked, setLiked] = useState<Set<string | number>>(new Set())
  const [passed, setPassed] = useState<Set<string | number>>(new Set())
  const [superLiked, setSuperLiked] = useState<Set<string | number>>(new Set())
  const [showMatch, setShowMatch] = useState<Profile | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [ageRange, setAgeRange] = useState([18, 40])
  const [distance, setDistance] = useState(50)

  const fetchProfiles = async () => {
    setLoading(true)
    // Fetch profiles excluding the current user
    let query = supabase
      .from('profiles')
      .select('id, full_name, date_of_birth, avatar_url, country, city, occupation, bio, interests, is_verified, subscription_tier, last_seen')
      .limit(50)

    if (user) {
      query = query.neq('id', user.id)

      // Also fetch already-swiped IDs to exclude
      const { data: swiped } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id)

      if (swiped && swiped.length > 0) {
        // Use PostgREST filter format — UUID list without quotes works for uuid columns
        query = query.not('id', 'in', `(${swiped.map((s: any) => s.swiped_id).join(',')})`)
      }
    }

    const { data, error } = await query

    if (error) {
      setDbConnected(false)
      setProfiles([])
    } else {
      setDbConnected(true)
      const now = new Date()
      const mapped: Profile[] = (data || []).map((p: any, i: number) => {
        const dob = p.date_of_birth ? new Date(p.date_of_birth) : null
        const age = dob ? Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : null
        return {
          id: p.id,
          name: p.full_name || 'Anonymous',
          age: age || 0,
          avatar_url: p.avatar_url,
          country: p.country || p.city,
          job: p.occupation,
          bio: p.bio,
          tags: p.interests ? (Array.isArray(p.interests) ? p.interests : p.interests.split(',')) : [],
          verified: p.is_verified,
          premium: p.subscription_tier === 'vip' || p.subscription_tier === 'premium',
          online: p.last_seen ? (Date.now() - new Date(p.last_seen).getTime()) < 300000 : false,
          emoji: defaultEmojis[i % defaultEmojis.length],
        }
      })
      setProfiles(mapped)
    }
    setLoading(false)
  }

  useEffect(() => { fetchProfiles() }, [user])

  const activeProfiles = profiles.filter(p => !liked.has(p.id) && !passed.has(p.id) && !superLiked.has(p.id))

  const handleSwipe = async (profile: Profile, dir: 'left' | 'right' | 'super') => {
    if (!user) return

    if (dir === 'right' || dir === 'super') {
      setLiked(prev => new Set([...prev, profile.id]))

      // Persist swipe to DB (schema uses action: 'like'|'pass'|'super_like')
      await supabase.from('swipes').upsert({
        swiper_id: user.id,
        swiped_id: String(profile.id),
        action: dir === 'super' ? 'super_like' : 'like',
      }, { onConflict: 'swiper_id,swiped_id' })

      // Check if other user already swiped right on us → create match
      const { data: theirSwipe } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', String(profile.id))
        .eq('swiped_id', user.id)
        .in('action', ['like', 'super_like'])
        .maybeSingle()

      if (theirSwipe) {
        // It's a match — insert into matches (avoid duplicates with user_a < user_b ordering)
        const [a, b] = [user.id, String(profile.id)].sort()
        await supabase.from('matches').upsert(
          { user_a: a, user_b: b },
          { onConflict: 'user_a,user_b' }
        )
        setShowMatch(profile)
        setTimeout(() => setShowMatch(null), 4000)
      }

      if (dir === 'super') {
        setSuperLiked(prev => new Set([...prev, profile.id]))
        setLiked(prev => { const n = new Set(prev); n.delete(profile.id); return n })
      }
    } else {
      setPassed(prev => new Set([...prev, profile.id]))
      // Persist pass (schema value is 'pass')
      await supabase.from('swipes').upsert({
        swiper_id: user.id,
        swiped_id: String(profile.id),
        action: 'pass',
      }, { onConflict: 'swiper_id,swiped_id' })
    }
  }

  const resetAll = () => {
    setLiked(new Set())
    setPassed(new Set())
    setSuperLiked(new Set())
  }

  const handleMessage = (profileId: string | number) => {
    navigate(`/app/chat/${profileId}`)
  }

  const handleFollow = async (profileId: string | number) => {
    if (!user) return
    await supabase.from('follows').insert({ follower_id: user.id, following_id: String(profileId) })
    await supabase.from('notifications').insert({ user_id: String(profileId), type: 'follow', from_user_id: user.id }).then(() => {})
  }

  const handleVideoCall = (profile: Profile) => {
    // Use initiateCall so the other user receives an incoming-call notification via Realtime.
    initiateCall({ contactId: String(profile.id), contactName: profile.name, type: 'video' })
  }

  const handleAudioCall = (profile: Profile) => {
    initiateCall({ contactId: String(profile.id), contactName: profile.name, type: 'audio' })
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div>
          <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Discover 🔥</h1>
          <p className="text-xs dark:text-gray-400 text-gray-500">{activeProfiles.length} profiles near you</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProfiles} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 flex items-center justify-center hover:text-brand-pink transition-colors">
            <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
          </button>
          <button onClick={() => setShowFilter(!showFilter)}
            className="w-9 h-9 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 flex items-center justify-center hover:text-brand-pink transition-colors">
            <SlidersHorizontal className="w-4 h-4 dark:text-gray-400 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-3 flex-shrink-0">
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-4 space-y-3">
              <div>
                <p className="text-xs font-bold dark:text-gray-300 text-gray-700 mb-2">Age Range: {ageRange[0]} - {ageRange[1]}</p>
                <input type="range" min={18} max={60} value={ageRange[1]} onChange={e => setAgeRange([ageRange[0], +e.target.value])}
                  className="w-full accent-pink-500" />
              </div>
              <div>
                <p className="text-xs font-bold dark:text-gray-300 text-gray-700 mb-2">Distance: {distance} km</p>
                <input type="range" min={5} max={500} value={distance} onChange={e => setDistance(+e.target.value)}
                  className="w-full accent-pink-500" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-brand-pink/30 border-t-brand-pink animate-spin" />
            <p className="text-sm dark:text-gray-400 text-gray-500">Finding people near you…</p>
          </div>
        ) : !dbConnected ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="w-20 h-20 rounded-3xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
              <Database className="w-10 h-10 dark:text-gray-600 text-gray-400" />
            </div>
            <div>
              <p className="font-black text-xl dark:text-white text-gray-900 mb-2">Not connected</p>
              <p className="text-sm dark:text-gray-400 text-gray-500">Configure Supabase to see real profiles from your community</p>
            </div>
            <button onClick={fetchProfiles} className="px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold">
              Try Again
            </button>
          </div>
        ) : activeProfiles.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="text-6xl mb-2">🌍</div>
            <p className="font-black text-xl dark:text-white text-gray-900">
              {profiles.length === 0 ? 'No profiles yet' : 'You\'ve seen everyone!'}
            </p>
            <p className="text-sm dark:text-gray-400 text-gray-500">
              {profiles.length === 0
                ? 'Be the first in your area — invite friends to join SmartzConnect!'
                : 'Check back later for new people joining near you'}
            </p>
            {profiles.length > 0 && (
              <button onClick={resetAll} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold">
                <RotateCcw className="w-4 h-4" /> Start Over
              </button>
            )}
          </div>
        ) : (
          <div className="relative w-full max-w-sm" style={{ height: 'min(620px, calc(100vh - 180px))' }}>
            {activeProfiles.slice(0, 3).map((profile, i) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipe={dir => handleSwipe(profile, dir)}
                isTop={i === 0}
                stackIndex={i}
                onMessage={() => handleMessage(profile.id)}
                onFollow={() => handleFollow(profile.id)}
                onVideoCall={() => handleVideoCall(profile)}
                onAudioCall={() => handleAudioCall(profile)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Match animation */}
      <AnimatePresence>
        {showMatch && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="dark:bg-[#130E1E] bg-white rounded-3xl p-8 text-center max-w-xs mx-4 border dark:border-white/10 border-gray-100 shadow-2xl">
              <div className="text-6xl mb-4">💕</div>
              <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">It's a Match!</h2>
              <p className="text-sm dark:text-gray-400 text-gray-500 mb-6">You and {showMatch.name} liked each other!</p>
              <div className="flex gap-3">
                <button onClick={() => setShowMatch(null)}
                  className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-300 text-gray-700">
                  Keep Swiping
                </button>
                <button
                  onClick={() => { const id = showMatch.id; setShowMatch(null); navigate(`/app/chat/${id}`) }}
                  className="flex-1 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold text-center"
                >
                  Message 💬
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
