import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Tv, Play, Users, Gift, TrendingUp, Mic, Video, Crown, Zap,
  Signal, Clapperboard, Eye, RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const features = [
  { icon: Video,      title: 'Go Live Instantly',     desc: 'Stream to thousands of viewers across Africa with one tap. No equipment needed — just your phone.',  color: 'from-violet-500 to-purple-600' },
  { icon: Gift,       title: 'Earn from Gifts',        desc: 'Fans send virtual gifts during your streams. Convert them to real cash via Mobile Money.',             color: 'from-pink-500 to-rose-600' },
  { icon: Users,      title: 'Build Your Fanbase',     desc: 'Grow a loyal community of followers who tune in for your content every day.',                         color: 'from-blue-500 to-indigo-600' },
  { icon: TrendingUp, title: 'Trending Discovery',     desc: 'Get featured on the Trending page and reach millions of new viewers organically.',                     color: 'from-amber-500 to-orange-600' },
  { icon: Mic,        title: 'Audio Rooms',            desc: 'Host live audio conversations, debates, and Q&As with your community.',                               color: 'from-emerald-500 to-teal-600' },
  { icon: Crown,      title: 'Creator Monetisation',   desc: 'Subscriptions, tips, brand deals, and exclusive content — multiple income streams in one place.',     color: 'from-yellow-500 to-amber-600' },
]

interface LiveStream {
  id: string
  title: string
  category: string | null
  viewer_count: number
  thumbnail_url: string | null
  creator_id: string
  creator_name?: string
  creator_avatar?: string | null
}

export default function SmartzTVPage() {
  const ref = useRef(null)
  const heroRef = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const heroIn = useInView(heroRef, { once: true })

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([])
  const [loadingStreams, setLoadingStreams] = useState(true)

  // Internal loader — accepts a cancellation token for safe async teardown.
  const loadLiveStreams = useCallback(async (sig: { cancelled: boolean }) => {
    setLoadingStreams(true)
    try {
      const { data: rows, error } = await supabase
        .from('livestreams')
        .select('id, title, category, viewer_count, thumbnail_url, creator_id')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false })
        .limit(6)

      if (sig.cancelled) return

      if (!error && rows && rows.length > 0) {
        // Resolve creator names separately (no FK constraint on livestreams.creator_id)
        const creatorIds = [...new Set((rows as Array<{ creator_id: string }>).map(r => r.creator_id).filter(Boolean))]
        let profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {}
        if (creatorIds.length) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', creatorIds)
          if (!sig.cancelled && profiles) {
            profileMap = Object.fromEntries(
              (profiles as Array<{ id: string; full_name: string; avatar_url: string | null }>)
                .map(p => [p.id, p])
            )
          }
        }
        if (!sig.cancelled) {
          setLiveStreams(
            (rows as Array<{ id: string; title: string; category: string | null; viewer_count: number; thumbnail_url: string | null; creator_id: string }>)
              .map(r => ({
                ...r,
                creator_name: profileMap[r.creator_id]?.full_name ?? 'Creator',
                creator_avatar: profileMap[r.creator_id]?.avatar_url ?? null,
              }))
          )
        }
      } else if (!sig.cancelled) {
        setLiveStreams([])
      }
    } catch {
      if (!sig.cancelled) setLiveStreams([])
    }
    if (!sig.cancelled) setLoadingStreams(false)
  }, [])

  // Click handler for the refresh button — creates its own fresh cancellation token.
  const handleRefresh = useCallback(() => {
    const sig = { cancelled: false }
    void loadLiveStreams(sig)
    // No cleanup needed — the token is local and there's no unmount concern here.
  }, [loadLiveStreams])

  useEffect(() => {
    const sig = { cancelled: false }
    void loadLiveStreams(sig)
    return () => { sig.cancelled = true }
  }, [loadLiveStreams])

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen pt-[72px] sm:pt-20">

      {/* ── Hero ── */}
      <section ref={heroRef}>
        {/* Hero image */}
        <div className="w-full overflow-hidden">
          <motion.img
            src="/smartz-tv-hero.png"
            alt="SmartzTV Live — Live TV. Anytime. Anywhere."
            className="w-full object-cover object-center"
            style={{ maxHeight: '620px' }}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={heroIn ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
          />
        </div>

        {/* CTA buttons */}
        <div className="dark:bg-[#0a0520]/90 bg-violet-50/70 border-t-2 border-violet-500/25 py-6 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Play className="w-4 h-4" fill="white" /> Watch Live
            </Link>
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl dark:bg-violet-900/30 bg-white border dark:border-violet-500/20 border-violet-300/50 dark:text-violet-200 text-violet-800 font-semibold text-sm hover:dark:bg-violet-900/50 hover:bg-violet-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Signal className="w-4 h-4" /> Go Live
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Live Streams or Coming Soon ── */}
      <section className="py-10 dark:bg-[#0D0A14] bg-white border-y dark:border-white/5 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {!loadingStreams && liveStreams.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              <h2 className="font-display font-black text-xl dark:text-white text-gray-900">
                {loadingStreams ? 'Loading streams…' : liveStreams.length > 0 ? `${liveStreams.length} Live Now` : 'Live Streams'}
              </h2>
            </div>
            <button onClick={handleRefresh} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-violet-500 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loadingStreams ? 'animate-spin text-violet-500' : ''}`} />
            </button>
          </div>

          {loadingStreams ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="dark:bg-white/5 bg-gray-100 rounded-2xl h-48 animate-pulse" />
              ))}
            </div>
          ) : liveStreams.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.map((stream, i) => (
                <motion.div key={stream.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link to="/register"
                    className="block group dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden hover:shadow-xl hover:border-violet-500/30 transition-all">
                    {/* Thumbnail */}
                    <div className="relative h-36 dark:bg-violet-900/20 bg-violet-50 flex items-center justify-center overflow-hidden">
                      {stream.thumbnail_url ? (
                        <img src={stream.thumbnail_url} alt={stream.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Tv className="w-10 h-10 text-violet-400/40" />
                      )}
                      {/* LIVE badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </div>
                      {/* Viewer count */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold">
                        <Eye className="w-2.5 h-2.5" /> {(stream.viewer_count || 0).toLocaleString()}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="font-bold text-sm dark:text-white text-gray-900 line-clamp-1 mb-1">{stream.title || 'Live Stream'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs dark:text-gray-400 text-gray-500">{stream.creator_name}</span>
                        {stream.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">{stream.category}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Tv className="w-6 h-6 text-violet-400/50" />
                <span className="font-bold dark:text-white text-gray-900">No streams live right now</span>
              </div>
              <p className="text-sm dark:text-gray-400 text-gray-500 max-w-md mx-auto mb-4">
                SmartzTV is live! Check back soon to catch creators streaming music, comedy, tech talks, and more — or go live yourself.
              </p>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg hover:opacity-90 transition-all">
                <Signal className="w-4 h-4" /> Be the First to Go Live
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={ref} className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-3">
              Everything You Need to <span className="text-gradient-love">Create &amp; Earn</span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 max-w-xl mx-auto">Professional streaming tools built for African creators.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl transition-all group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-base dark:text-white text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#0e0720] via-[#160830] to-[#200a40] border border-violet-500/20">
            {/* Decorative icons */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-6 left-8 opacity-10"><Tv className="w-20 h-20 text-violet-300" /></div>
              <div className="absolute bottom-6 right-8 opacity-10"><Crown className="w-20 h-20 text-pink-300" /></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl" />
            </div>
            <div className="relative p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/40">
                <Clapperboard className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display font-black text-3xl text-white mb-3">Ready to Go Live?</h2>
              <p className="text-white/80 mb-7 max-w-lg mx-auto">Join creators already earning on SmartzTV. It's free to start.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl btn-love font-bold text-sm shadow-xl hover:scale-105 transition-all">
                  <Zap className="w-4 h-4" /> Become a Creator
                </Link>
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/12 backdrop-blur-sm border border-white/25 text-white font-semibold hover:bg-white/22 transition-all text-sm">
                  <Play className="w-4 h-4" fill="white" /> Watch Live Streams
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
