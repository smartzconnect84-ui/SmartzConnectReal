import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Heart, MessageCircle, X, Sparkles, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Match {
  id: string
  name: string
  age?: number
  emoji?: string
  avatar_url?: string
  country?: string
  lastMsg?: string
  lastTime?: string
  unread?: number
  online?: boolean
  verified?: boolean
  premium?: boolean
  matchScore?: number
  mutualInterests?: string[]
}

const tabs = ['All', 'Online', 'Unread', 'New']
const defaultEmojis = ['👩🏾', '👨🏿', '👩🏽', '👨🏾', '👩🏿', '👨🏽']

export default function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [selected, setSelected] = useState<Match | null>(null)

  const fetchMatches = async () => {
    if (!user?.id) return
    setLoading(true)

    // Fetch matches where current user is user_a or user_b
    const { data, error } = await supabase
      .from('matches')
      .select('id, matched_at, user_a, user_b, status')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('matched_at', { ascending: false })
      .limit(50)

    if (error || !data?.length) {
      setMatches([])
      setLoading(false)
      return
    }

    // Resolve the OTHER user's ID for each match
    const otherIds = data.map(m => m.user_a === user.id ? m.user_b : m.user_a).filter(Boolean)
    if (!otherIds.length) { setMatches([]); setLoading(false); return }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, country, city, is_verified, subscription_tier, last_seen, date_of_birth')
      .in('id', otherIds)

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
    const now = new Date()

    const mapped: Match[] = data.map((m, i) => {
      const otherId = m.user_a === user.id ? m.user_b : m.user_a
      const profile = profileMap[otherId]
      const dob = profile?.date_of_birth ? new Date(profile.date_of_birth) : null
      const age = dob ? Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : undefined
      const lastSeen = profile?.last_seen ? new Date(profile.last_seen) : null
      const online = lastSeen ? (Date.now() - lastSeen.getTime()) < 300000 : false
      return {
        id: otherId || String(m.id),
        name: profile?.full_name || 'User',
        age,
        avatar_url: profile?.avatar_url,
        emoji: defaultEmojis[i % defaultEmojis.length],
        country: profile?.country || profile?.city,
        online,
        verified: profile?.is_verified,
        premium: profile?.subscription_tier === 'vip' || profile?.subscription_tier === 'premium',
        matchScore: Math.floor(75 + Math.random() * 20),
        lastTime: m.matched_at ? new Date(m.matched_at).toLocaleDateString() : '',
        unread: 0,
        mutualInterests: [],
      }
    })

    setMatches(mapped)
    setLoading(false)
  }

  useEffect(() => { fetchMatches() }, [user?.id])

  // Realtime: new matches
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`matches:mine:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user_a=eq.${user.id}`,
      }, (payload) => {
        const m = payload.new as any
        const newMatch: Match = {
          id: String(m.user_b || m.id),
          name: 'New Match',
          emoji: '💕',
          online: false,
          unread: 1,
          matchScore: 95,
          lastTime: new Date(m.matched_at || m.created_at).toLocaleDateString(),
          mutualInterests: [],
        }
        setMatches(prev => [newMatch, ...prev])
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user_b=eq.${user.id}`,
      }, (payload) => {
        const m = payload.new as any
        const newMatch: Match = {
          id: String(m.user_a || m.id),
          name: 'New Match',
          emoji: '💕',
          online: false,
          unread: 1,
          matchScore: 95,
          lastTime: new Date(m.matched_at || m.created_at).toLocaleDateString(),
          mutualInterests: [],
        }
        setMatches(prev => [newMatch, ...prev])
      })
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Matches realtime error — will retry on reconnect')
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const filtered = matches.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.country || '').toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'Online') return matchesSearch && m.online
    if (activeTab === 'Unread') return matchesSearch && (m.unread ?? 0) > 0
    return matchesSearch
  })

  const EmptyState = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-3xl bg-love-soft flex items-center justify-center">
        <Icon className="w-8 h-8 text-brand-pink" />
      </div>
      <div>
        <p className="font-bold dark:text-white text-gray-900 mb-1">{title}</p>
        <p className="text-sm dark:text-gray-400 text-gray-500">{desc}</p>
      </div>
    </div>
  )

  return (
    <div className="h-full flex dark:bg-[#0A0710] bg-gray-50">

      {/* Match list panel */}
      <div className={`flex flex-col w-full lg:w-80 xl:w-96 flex-shrink-0 dark:bg-[#0D0A14] bg-white border-r dark:border-white/6 border-gray-100 ${selected ? 'hidden lg:flex' : 'flex'}`}>

        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b dark:border-white/6 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Matches 💕</h1>
              <p className="text-xs dark:text-gray-400 text-gray-500">
                {matches.length > 0 ? `${matches.length} matches` : 'Start swiping to get matches'}
              </p>
            </div>
            <button
              onClick={fetchMatches}
              className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors"
            >
              <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search matches..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-love-gradient text-white'
                    : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Match list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-brand-pink/30 border-t-brand-pink animate-spin" />
              <p className="text-sm dark:text-gray-400 text-gray-500">Loading matches…</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Heart}
              title={matches.length === 0 ? 'No matches yet' : 'No matches found'}
              desc={matches.length === 0
                ? 'Start swiping on Discover to find your first match!'
                : 'Try a different filter or search term'}
            />
          ) : (
            <div className="divide-y dark:divide-white/4 divide-gray-50">
              {filtered.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(match)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:dark:bg-white/3 hover:bg-pink-50/30 transition-colors ${selected?.id === match.id ? 'dark:bg-white/5 bg-pink-50' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full dark:bg-white/8 bg-gray-100 flex items-center justify-center text-2xl overflow-hidden">
                      {match.avatar_url
                        ? <img src={match.avatar_url} alt={match.name} className="w-full h-full object-cover" />
                        : match.emoji}
                    </div>
                    {match.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 dark:border-[#0D0A14] border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold text-sm dark:text-white text-gray-900 truncate">{match.name}</span>
                        {match.verified && <span className="text-blue-400 text-[10px] flex-shrink-0">✓</span>}
                      </div>
                      <span className="text-[10px] dark:text-gray-500 text-gray-400 flex-shrink-0 ml-2">{match.lastTime}</span>
                    </div>
                    <p className="text-xs dark:text-gray-400 text-gray-500 truncate">
                      {match.lastMsg || `Matched ${match.lastTime}`}
                    </p>
                  </div>

                  {(match.unread ?? 0) > 0 && (
                    <span className="w-5 h-5 rounded-full bg-brand-pink text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                      {match.unread}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation panel */}
      <div className={`flex-1 flex flex-col dark:bg-[#0A0710] bg-gray-50 ${selected ? 'flex' : 'hidden lg:flex'}`}>
        {selected ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-4 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100">
              <button onClick={() => setSelected(null)} className="lg:hidden w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full dark:bg-white/8 bg-gray-100 flex items-center justify-center text-xl overflow-hidden">
                  {selected.avatar_url
                    ? <img src={selected.avatar_url} alt={selected.name} className="w-full h-full object-cover" />
                    : selected.emoji}
                </div>
                {selected.online && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 dark:border-[#0D0A14] border-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold dark:text-white text-gray-900">{selected.name}</p>
                <p className="text-xs dark:text-gray-400 text-gray-500">
                  {selected.online ? 'Active now' : 'Offline'} · {selected.matchScore}% match
                </p>
              </div>
              <Link
                to={`/app/chat/${selected.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Open Chat
              </Link>
            </div>

            {/* Match info */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="w-24 h-24 rounded-full dark:bg-white/5 bg-gray-100 flex items-center justify-center text-5xl shadow-2xl overflow-hidden">
                {selected.avatar_url
                  ? <img src={selected.avatar_url} alt={selected.name} className="w-full h-full object-cover rounded-full" />
                  : selected.emoji}
              </div>
              <div>
                <p className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1">{selected.name}</p>
                {selected.age && (
                  <p className="dark:text-gray-400 text-gray-500 text-sm">{selected.age} · {selected.country}</p>
                )}
                {selected.matchScore && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">{selected.matchScore}% compatibility</span>
                  </div>
                )}
              </div>
              {(selected.mutualInterests || []).length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {(selected.mutualInterests || []).map(interest => (
                    <span key={interest} className="px-3 py-1 rounded-full dark:bg-white/8 bg-gray-100 dark:text-gray-300 text-gray-600 text-xs font-semibold">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
              <Link
                to={`/app/chat/${selected.id}`}
                className="px-8 py-3 rounded-2xl bg-love-gradient text-white font-bold text-sm shadow-xl shadow-pink-500/20 hover:opacity-90 transition-opacity"
              >
                Start Conversation 💬
              </Link>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-love-soft flex items-center justify-center">
              <Heart className="w-8 h-8 text-brand-pink" />
            </div>
            <div className="text-center">
              <p className="font-bold dark:text-white text-gray-900 mb-1">Select a match</p>
              <p className="text-sm dark:text-gray-400 text-gray-500">Choose someone from your matches to view their profile</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
