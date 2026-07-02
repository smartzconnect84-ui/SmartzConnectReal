import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Globe, Trophy, Users, Zap, Calendar, MapPin, Crown, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface WSEvent {
  id: string
  title: string
  category: string
  prize: string
  date_range: string
  location: string
  participants: number
  status: 'open' | 'upcoming' | 'ended'
  emoji: string
  color: string
  description: string
}

interface WSLeader {
  rank: number
  display_name: string
  country: string
  category: string
  points: number
  avatar_emoji: string
}

interface WSSpotlight {
  id: string
  display_name: string
  country: string
  category: string
  followers_label: string
  quote: string
  avatar_emoji: string
  wins: number
}

const categories = ['All', 'Music', 'Live Streaming', 'Fashion', 'Tech', 'Comedy', 'Dance', 'Sports']

export default function WorldStagePage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const [activeCategory, setActiveCategory] = useState('All')
  const [events, setEvents] = useState<WSEvent[]>([])
  const [leaderboard, setLeaderboard] = useState<WSLeader[]>([])
  const [spotlights, setSpotlights] = useState<WSSpotlight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      setError(null)
      try {
        const [evRes, lbRes, spRes] = await Promise.all([
          supabase.from('worldstage_events').select('*').order('created_at', { ascending: false }),
          supabase.from('worldstage_leaderboard').select('*').order('points', { ascending: false }).limit(10),
          supabase.from('worldstage_spotlights').select('*').order('wins', { ascending: false }).limit(3),
        ])
        if (evRes.error) throw evRes.error
        if (lbRes.error) throw lbRes.error
        if (spRes.error) throw spRes.error
        setEvents((evRes.data as WSEvent[]) || [])
        setLeaderboard((lbRes.data as WSLeader[]) || [])
        setSpotlights((spRes.data as WSSpotlight[]) || [])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not load World Stage data')
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  const filtered = activeCategory === 'All'
    ? events
    : events.filter(e => e.category === activeCategory)

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen pt-16 sm:pt-20">

      {/* Hero */}
      <section className="relative py-16 sm:py-24 overflow-hidden dark:bg-[#0D0A14] bg-white border-b dark:border-white/5 border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/8 via-purple-500/5 to-amber-500/5 pointer-events-none" />
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-love-soft border border-pink-500/25 mb-6">
              <Globe className="w-4 h-4 text-brand-pink" />
              <span className="text-sm font-semibold text-brand-pink">Africa's Biggest Stage</span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-7xl dark:text-white text-gray-900 mb-6 leading-tight">
              World <span className="text-gradient-love">Stage</span>
            </h1>
            <p className="text-base sm:text-xl dark:text-gray-400 text-gray-600 max-w-2xl mx-auto mb-8">
              Compete. Create. Conquer. The pan-African platform where talent meets opportunity.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link to="/register" className="px-8 py-4 rounded-2xl bg-love-gradient text-white font-bold text-base shadow-xl shadow-pink-500/30 hover:scale-105 transition-all inline-flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" /> Enter a Competition
              </Link>
              <a href="#leaderboard" className="px-8 py-4 rounded-2xl dark:bg-white/8 bg-gray-100 dark:text-white text-gray-900 font-bold text-base hover:text-brand-pink transition-colors inline-flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" /> View Leaderboard
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-10 h-10 rounded-full border-2 border-brand-pink/30 border-t-brand-pink animate-spin" />
            <p className="text-sm dark:text-gray-400 text-gray-500">Loading World Stage…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <p className="font-bold dark:text-white text-gray-900 mb-1">Database not set up yet</p>
              <p className="text-sm dark:text-gray-400 text-gray-500 max-w-sm">Run the World Stage SQL schema in Supabase to enable live competitions.</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Events */}
            <div ref={ref} className="mb-16 sm:mb-20">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900">Active <span className="text-gradient-love">Competitions</span></h2>
                  <p className="dark:text-gray-400 text-gray-600 mt-1 text-sm">Enter now and compete for cash prizes</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white shadow-md' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-5 py-20 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 border border-pink-500/15 flex items-center justify-center">
                    <Trophy className="w-9 h-9 text-brand-pink/50" />
                  </div>
                  <div>
                    <p className="font-bold text-lg dark:text-white text-gray-900 mb-2">Competitions Coming Soon</p>
                    <p className="text-sm dark:text-gray-400 text-gray-500 max-w-sm">
                      World Stage competitions will be live during our official launch on <strong>June 26, 2026</strong>. Stay tuned!
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl dark:bg-amber-500/10 bg-amber-50 border dark:border-amber-500/20 border-amber-200">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Launching June 26, 2026 · Bash Pool, Marshall Road, Liberia</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((event, i) => (
                    <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.07 }}
                      className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 overflow-hidden hover:shadow-xl hover:border-pink-500/20 transition-all group">
                      <div className={`h-28 sm:h-32 bg-gradient-to-br ${event.color} relative flex items-center justify-center`}>
                        <span className="text-5xl sm:text-6xl">{event.emoji}</span>
                        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${event.status === 'open' ? 'bg-emerald-500 text-white' : event.status === 'upcoming' ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white'}`}>
                          {event.status === 'open' ? '🟢 Open' : event.status === 'upcoming' ? '⏳ Soon' : '✅ Ended'}
                        </div>
                        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-black">🏆 {event.prize}</div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold dark:text-white text-gray-900 text-sm sm:text-base leading-tight">{event.title}</h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-500 flex-shrink-0">{event.category}</span>
                        </div>
                        <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed mb-4">{event.description}</p>
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-xs dark:text-gray-500 text-gray-400"><Calendar className="w-3.5 h-3.5 flex-shrink-0" /> {event.date_range}</div>
                          <div className="flex items-center gap-2 text-xs dark:text-gray-500 text-gray-400"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {event.location}</div>
                          <div className="flex items-center gap-2 text-xs dark:text-gray-500 text-gray-400"><Users className="w-3.5 h-3.5 flex-shrink-0" /> {event.participants > 0 ? `${event.participants.toLocaleString()} entered` : 'Be the first!'}</div>
                        </div>
                        <Link to="/register" className={`w-full py-2.5 rounded-xl text-sm font-bold text-center transition-all block ${event.status === 'open' ? 'bg-love-gradient text-white hover:shadow-lg hover:shadow-pink-500/25' : event.status === 'upcoming' ? 'dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 hover:text-brand-pink' : 'dark:bg-white/3 bg-gray-50 dark:text-gray-600 text-gray-400 cursor-not-allowed'}`}>
                          {event.status === 'open' ? '🚀 Enter Now' : event.status === 'upcoming' ? '🔔 Get Notified' : '📊 View Results'}
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div id="leaderboard" className="mb-16 sm:mb-20">
              <h2 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-8">Global <span className="text-gradient-love">Leaderboard</span></h2>

              {leaderboard.length === 0 ? (
                <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 p-12 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/15 to-yellow-500/10 border border-amber-500/15 flex items-center justify-center">
                    <Crown className="w-8 h-8 text-amber-500/50" />
                  </div>
                  <div>
                    <p className="font-bold dark:text-white text-gray-900 mb-1">No Rankings Yet</p>
                    <p className="text-sm dark:text-gray-400 text-gray-500 max-w-xs">The leaderboard will populate once competitions go live. Be the first to claim your spot!</p>
                  </div>
                </div>
              ) : (
                <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-4 sm:px-6 py-3 border-b dark:border-white/5 border-gray-100 text-[10px] sm:text-xs font-black uppercase tracking-widest dark:text-gray-500 text-gray-400">
                    <div className="col-span-1">#</div>
                    <div className="col-span-7 sm:col-span-5">Creator</div>
                    <div className="col-span-3 hidden sm:block">Category</div>
                    <div className="col-span-4 sm:col-span-3 text-right">Points</div>
                  </div>
                  {leaderboard.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.05 }}
                      className="grid grid-cols-12 gap-2 items-center px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-white/4 border-gray-50 last:border-0 hover:dark:bg-white/3 hover:bg-pink-50/30 transition-colors">
                      <div className="col-span-1 text-lg sm:text-xl">
                        {entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '⭐'}
                      </div>
                      <div className="col-span-7 sm:col-span-5 flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full dark:bg-white/8 bg-pink-50 flex items-center justify-center text-base sm:text-xl flex-shrink-0">{entry.avatar_emoji}</div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold dark:text-white text-gray-900 truncate">{entry.display_name}</p>
                          <p className="text-[10px] dark:text-gray-500 text-gray-400">{entry.country}</p>
                        </div>
                      </div>
                      <div className="col-span-3 hidden sm:block">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600">{entry.category}</span>
                      </div>
                      <div className="col-span-4 sm:col-span-3 text-right">
                        <span className="font-display font-black text-sm sm:text-base text-gradient-love">{entry.points.toLocaleString()}</span>
                        <span className="text-[10px] dark:text-gray-500 text-gray-400 ml-1">pts</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Spotlights */}
            <div className="mb-16 sm:mb-20">
              <h2 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-8">Creator <span className="text-gradient-love">Spotlights</span></h2>

              {spotlights.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 flex flex-col items-center gap-4 text-center py-10">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 flex items-center justify-center">
                        <Users className="w-7 h-7 text-brand-pink/40" />
                      </div>
                      <div>
                        <p className="font-bold dark:text-white text-gray-900 text-sm mb-1">Spotlight #{i}</p>
                        <p className="text-xs dark:text-gray-500 text-gray-400">Coming soon after launch</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {spotlights.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
                      className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-pink-500/20 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-love-gradient flex items-center justify-center text-3xl shadow-lg shadow-pink-500/20">{s.avatar_emoji}</div>
                        <div>
                          <p className="font-bold dark:text-white text-gray-900">{s.display_name}</p>
                          <p className="text-xs text-brand-pink font-semibold">{s.category}</p>
                          <p className="text-[10px] dark:text-gray-500 text-gray-400">{s.country}</p>
                        </div>
                      </div>
                      <blockquote className="text-sm dark:text-gray-300 text-gray-700 italic leading-relaxed mb-4">"{s.quote}"</blockquote>
                      <div className="flex items-center justify-between pt-3 border-t dark:border-white/5 border-gray-100">
                        <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-brand-pink" /><span className="text-xs font-bold dark:text-white text-gray-900">{s.followers_label}</span><span className="text-xs dark:text-gray-500 text-gray-400">followers</span></div>
                        <div className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-500" /><span className="text-xs font-bold dark:text-white text-gray-900">{s.wins}</span><span className="text-xs dark:text-gray-500 text-gray-400">wins</span></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-love-gradient opacity-90" />
          <div className="relative px-8 sm:px-12 py-12 sm:py-16 text-center text-white">
            <Crown className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="font-display font-black text-2xl sm:text-4xl mb-4">Ready to Take the Stage?</h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8 text-sm sm:text-base">Join thousands of African creators competing for cash prizes, global recognition, and life-changing opportunities.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="px-8 py-4 rounded-2xl bg-white text-brand-pink font-black text-base hover:scale-105 transition-transform shadow-xl inline-flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" /> Create Free Account
              </Link>
              <a href="https://wa.me/231776679963" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-2xl bg-white/15 backdrop-blur-sm text-white font-bold text-base hover:bg-white/25 transition-colors inline-flex items-center justify-center gap-2">
                💬 Talk to Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
