import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Tv, Play, Users, Gift, TrendingUp, Mic, Video, Crown, Zap,
  Signal, Clapperboard, Eye, RefreshCw, Loader2,
  Share2, CheckCircle,
  Calendar, Clock, Antenna, AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import SmartzTVPlayer from '@/components/SmartzTVPlayer'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TVChannel {
  id: string
  name: string
  logo_url: string | null
  cover_url: string | null
  description: string | null
  category: string | null
  mux_playback_id: string | null
  playback_url: string | null
  stream_status: 'idle' | 'active' | 'disconnected'
  is_active: boolean
  is_featured: boolean
  current_program: string | null
  viewer_count: number
}

interface TVScheduleEntry {
  id: string
  title: string
  starts_at: string
  ends_at: string | null
  category: string | null
}


interface TVVideo {
  id: string; title: string; video_url: string; thumbnail_url: string | null; view_count: number
}

const features = [
  { icon: Video,      title: 'Go Live Instantly',     desc: 'Stream to thousands of viewers across Africa with one tap. No equipment needed — just your phone.',  color: 'from-violet-500 to-purple-600' },
  { icon: Gift,       title: 'Earn from Gifts',        desc: 'Fans send virtual gifts during your streams. Convert them to real cash via Mobile Money.',             color: 'from-pink-500 to-rose-600' },
  { icon: Users,      title: 'Build Your Fanbase',     desc: 'Grow a loyal community of followers who tune in for your content every day.',                         color: 'from-blue-500 to-indigo-600' },
  { icon: TrendingUp, title: 'Trending Discovery',     desc: 'Get featured on the Trending page and reach millions of new viewers organically.',                     color: 'from-amber-500 to-orange-600' },
  { icon: Mic,        title: 'Audio Rooms',            desc: 'Host live audio conversations, debates, and Q&As with your community.',                               color: 'from-emerald-500 to-teal-600' },
  { icon: Crown,      title: 'Creator Monetisation',   desc: 'Subscriptions, tips, brand deals, and exclusive content — multiple income streams in one place.',     color: 'from-yellow-500 to-amber-600' },
]

// ── Mux Player (modern click-to-play/pause live playback) ──────────────────────

function LiveStreamPlayer({ channel }: { channel: TVChannel }) {
  return (
    <SmartzTVPlayer
      playbackId={channel.mux_playback_id}
      poster={channel.cover_url}
      isLive
      title={channel.name}
      viewerCount={channel.viewer_count}
      accentColor="#8b5cf6"
    />
  )
}

// ── Replay player (shown when nothing is live but a recent recording exists) ──

function ReplayPlayer({ video }: { video: TVVideo }) {
  return (
    <SmartzTVPlayer
      videoUrl={video.video_url}
      poster={video.thumbnail_url}
      isLive={false}
      title={video.title}
      viewerCount={video.view_count}
      accentColor="#8b5cf6"
    />
  )
}

// ── "Coming Soon" placeholder (shown when nothing is live or recorded) ─────────

function ComingSoonPlayer({ channel }: { channel: TVChannel | null }) {
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-violet-500/20 bg-gradient-to-br from-[#0e0720] via-[#160830] to-[#1a0a35]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-violet-600/15 blur-3xl" />
        {channel?.cover_url && (
          <img src={channel.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        )}
      </div>

      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 sm:px-10">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-4">
          <span className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
          <div className="relative w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-900/50">
            <Antenna className="w-7 h-7 sm:w-8 sm:h-8 text-white/80" />
          </div>
        </motion.div>
        <h3 className="font-display font-black text-lg sm:text-2xl text-white mb-1.5">Live stream coming soon</h3>
        <p className="text-sm text-white/50 max-w-sm">
          {channel ? `${channel.name} isn't broadcasting right now.` : "SmartzTV isn't broadcasting right now."}
          {' '}We'll switch to the live player automatically the moment a stream starts.
        </p>
      </div>

      {/* Muted/offline badge to match the live badge position */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-[11px] font-bold backdrop-blur-sm border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> OFFLINE
        </span>
      </div>
    </div>
  )
}

// ── Now Playing card ─────────────────────────────────────────────────────────────

function NowPlayingCard({ channel, isLive, nextSchedule }: { channel: TVChannel | null; isLive: boolean; nextSchedule: TVScheduleEntry | null }) {
  const [shareToast, setShareToast] = useState(false)

  const handleShare = () => {
    const url = `${window.location.origin}/smartztv`
    const text = channel ? `Watch "${channel.name}" LIVE on SmartzTV!` : 'Watch SmartzTV Live!'
    if (navigator.share) {
      navigator.share({ title: channel?.name || 'SmartzTV', text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShareToast(true); setTimeout(() => setShareToast(false), 2500)
      })
    }
  }

  const fmtSchedule = (iso: string) => {
    try { return new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return '' }
  }

  return (
    <div className="relative mt-4 dark:bg-[#0e0820] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 sm:p-5">
      <AnimatePresence>
        {shareToast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-xl whitespace-nowrap">
            <CheckCircle className="w-3.5 h-3.5" /> Link copied!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl dark:bg-white/10 bg-violet-50 flex items-center justify-center flex-shrink-0 overflow-hidden border dark:border-white/10 border-violet-100">
            {channel?.logo_url
              ? <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
              : <Tv className="w-5 h-5 text-violet-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm sm:text-base dark:text-white text-gray-900 truncate">
                {channel ? channel.name : 'SmartzTV'}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex-shrink-0 ${isLive ? 'bg-red-500/15 text-red-500 border border-red-500/25' : 'dark:bg-white/10 bg-gray-100 dark:text-gray-400 text-gray-500'}`}>
                {isLive ? 'NOW PLAYING' : 'OFF AIR'}
              </span>
            </div>
            <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5 line-clamp-1">
              {isLive
                ? (channel?.current_program || channel?.category || 'Live broadcast')
                : (channel?.description || 'No broadcast in progress')}
              {isLive && channel && channel.viewer_count > 0 && (
                <span> · <Eye className="w-3 h-3 inline -mt-0.5" /> {channel.viewer_count.toLocaleString()} watching</span>
              )}
            </p>
            {!isLive && nextSchedule && (
              <p className="text-xs text-violet-500 dark:text-violet-300 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Next: {nextSchedule.title} · {fmtSchedule(nextSchedule.starts_at)}
              </p>
            )}
          </div>
        </div>
        <button onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-gray-300 text-gray-600 hover:bg-violet-500/20 text-xs font-semibold transition-colors flex-shrink-0">
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>
    </div>
  )
}

// ── Program Schedule section ─────────────────────────────────────────────────────

function ProgramScheduleSection({ schedule }: { schedule: TVScheduleEntry[] }) {
  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) }
    catch { return '' }
  }

  return (
    <div className="mt-4 dark:bg-[#0e0820] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b dark:border-white/5 border-gray-100">
        <Calendar className="w-4 h-4 text-violet-400" />
        <p className="font-bold text-sm dark:text-white text-gray-900">Program Schedule</p>
        {schedule.length > 0 && <span className="ml-auto text-xs dark:text-gray-500 text-gray-400">{schedule.length} upcoming</span>}
      </div>
      {schedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
          <Clock className="w-6 h-6 dark:text-gray-600 text-gray-300" />
          <p className="text-sm dark:text-gray-500 text-gray-400">No scheduled programs yet</p>
          <p className="text-xs dark:text-gray-600 text-gray-400">Check back soon for upcoming broadcasts.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-5">
          {schedule.map(s => (
            <div key={s.id} className="p-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/5 border-gray-100">
              <p className="text-sm font-semibold dark:text-white text-gray-900 line-clamp-1">{s.title}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Clock className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                <span className="text-xs dark:text-gray-400 text-gray-500">{fmt(s.starts_at)}</span>
              </div>
              {s.category && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full dark:bg-violet-500/10 bg-violet-50 dark:text-violet-300 text-violet-600 text-[10px] font-semibold">
                  {s.category}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Watch SmartzTV Live section ──────────────────────────────────────────────────

function MuxTVSection() {
  const [channels, setChannels] = useState<TVChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<TVChannel | null>(null)
  const [nextSchedule, setNextSchedule] = useState<TVScheduleEntry | null>(null)
  const [schedule, setSchedule] = useState<TVScheduleEntry[]>([])
  const [replay, setReplay] = useState<TVVideo | null>(null)

  const load = useCallback(async (sig: { cancelled: boolean }, silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const { data, error: err } = await supabase
        .from('tv_channels')
        .select('id, name, logo_url, cover_url, description, category, mux_playback_id, playback_url, stream_status, is_active, is_featured, current_program, viewer_count')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })
        .limit(12)

      if (sig.cancelled) return
      if (err) throw err

      const list = (data as TVChannel[]) || []
      setChannels(list)
      setSelected(prev => {
        const live = list.find(c => c.stream_status === 'active')
        const stillThere = prev ? list.find(c => c.id === prev.id) : null
        return live || stillThere || list.find(c => c.is_featured) || list[0] || null
      })
    } catch {
      if (!sig.cancelled) { setError(true); setChannels([]); setSelected(null) }
    }
    if (!sig.cancelled) setLoading(false)
  }, [])

  // Initial load + realtime updates (any insert/update/delete flips the on-air state
  // instantly) + a periodic refresh as a safety net if a realtime event is missed.
  useEffect(() => {
    const sig = { cancelled: false }
    void load(sig)

    const sub = supabase.channel('public-tv-channels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_channels' }, () => {
        const innerSig = { cancelled: false }
        void load(innerSig, true)
      })
      .subscribe()

    const interval = setInterval(() => { void load({ cancelled: false }, true) }, 20000)

    return () => { sig.cancelled = true; clearInterval(interval); supabase.removeChannel(sub) }
  }, [load])

  // Program schedule for the currently viewed channel
  useEffect(() => {
    if (!selected) { setSchedule([]); setNextSchedule(null); return }
    let cancelled = false
    supabase.from('tv_schedules').select('id, title, starts_at, ends_at, category')
      .eq('channel_id', selected.id).gte('ends_at', new Date().toISOString())
      .order('starts_at', { ascending: true }).limit(9)
      .then(({ data }) => {
        if (cancelled) return
        const list = (data as TVScheduleEntry[]) || []
        setSchedule(list)
        setNextSchedule(list[0] || null)
      })
    return () => { cancelled = true }
  }, [selected?.id])

  const isLive = !!selected && selected.stream_status === 'active' && !!selected.mux_playback_id

  // Nothing live right now → fall back to the most recent recorded broadcast
  // so visitors can still watch SmartzTV content ("Live … and after").
  useEffect(() => {
    if (isLive) { setReplay(null); return }
    let cancelled = false
    supabase.from('tv_videos').select('id, title, video_url, thumbnail_url, view_count')
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => {
        if (!cancelled) setReplay(((data as TVVideo[]) || [])[0] || null)
      })
    return () => { cancelled = true }
  }, [isLive])

  if (loading) {
    return (
      <section className="py-10 sm:py-14 dark:bg-[#06030f] bg-violet-950/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-display font-black text-xl sm:text-2xl dark:text-white text-gray-900">Watch SmartzTV Live</h2>
          </div>
          <div className="aspect-video dark:bg-white/5 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-20 mt-4 dark:bg-white/5 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-32 mt-4 dark:bg-white/5 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-10 sm:py-14 dark:bg-[#06030f] bg-violet-950/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Tv className="w-5 h-5 text-violet-400" />
            <h2 className="font-display font-black text-xl sm:text-2xl dark:text-white text-gray-900">Watch SmartzTV Live</h2>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 aspect-video rounded-2xl dark:bg-white/5 bg-gray-100 text-center px-6">
            <AlertCircle className="w-8 h-8 text-amber-500/70" />
            <p className="text-sm font-semibold dark:text-white text-gray-800">Couldn't load SmartzTV Live</p>
            <p className="text-xs dark:text-gray-400 text-gray-500">Check your connection and try again.</p>
            <button onClick={() => { const sig = { cancelled: false }; void load(sig) }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-10 sm:py-14 dark:bg-[#06030f] bg-violet-950/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'dark:bg-gray-600 bg-gray-300'}`} />
            <h2 className="font-display font-black text-xl sm:text-2xl dark:text-white text-gray-900">📺 Watch SmartzTV Live</h2>
          </div>
          <button onClick={() => { const sig = { cancelled: false }; void load(sig) }}
            className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-violet-500 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Channel switcher (only shown when multiple official channels exist) */}
        {channels.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
            {channels.map(ch => (
              <button key={ch.id} onClick={() => setSelected(ch)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selected?.id === ch.id
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'dark:bg-white/5 bg-white dark:text-gray-300 text-gray-600 dark:border-white/10 border-gray-200 hover:border-violet-400'
                }`}>
                {ch.stream_status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                {ch.name}
              </button>
            ))}
          </div>
        )}

        {/* Player — full content width, responsive 16:9 */}
        {isLive && selected
          ? <LiveStreamPlayer channel={selected} />
          : replay
            ? <ReplayPlayer video={replay} />
            : <ComingSoonPlayer channel={selected} />}

        {/* Now Playing */}
        <NowPlayingCard channel={selected} isLive={isLive} nextSchedule={nextSchedule} />

        {/* Program Schedule */}
        <ProgramScheduleSection schedule={schedule} />

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl dark:bg-violet-500/5 bg-violet-50/80 border dark:border-violet-500/10 border-violet-200/50">
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-violet-500" />
            <p className="text-sm dark:text-gray-300 text-gray-700 font-medium">
              Want to <strong>go live</strong> or unlock exclusive channels?
            </p>
          </div>
          <Link to="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
            <Zap className="w-3.5 h-3.5" /> Join Free
          </Link>
        </div>
      </div>
    </section>
  )
}

// NOTE: Community LiveKit streams (AdminLiveTVSection) removed intentionally.
// The public SmartzTV page shows only the Mux-powered channel player.

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SmartzTVPage() {
  const ref = useRef(null)
  const heroRef = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const heroIn = useInView(heroRef, { once: true })
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.tvPageBg)

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen pt-[72px] sm:pt-20">

      {/* ── Hero ── */}
      <section ref={heroRef}>
        <div className="w-full overflow-hidden relative">
          {bgUrl && <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <motion.img src="/smartz-tv-hero.png" alt="SmartzTV Live"
            className="w-full object-cover object-center relative"
            style={{ maxHeight: '620px', opacity: bgUrl ? 0.75 : undefined }}
            initial={{ opacity: 0, scale: 1.03 }} animate={heroIn ? { opacity: bgUrl ? 0.75 : 1, scale: 1 } : {}} transition={{ duration: 0.7 }} />
        </div>
        <div className="dark:bg-[#0a0520]/90 bg-violet-50/70 border-t-2 border-violet-500/25 py-6 px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Play className="w-4 h-4" fill="white" /> Watch SmartzTV Live
            </Link>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl dark:bg-violet-900/30 bg-white border dark:border-violet-500/20 border-violet-300/50 dark:text-violet-200 text-violet-800 font-semibold text-sm hover:dark:bg-violet-900/50 hover:bg-violet-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Signal className="w-4 h-4" /> Go Live
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Mux TV Channels (primary) ── */}
      <MuxTVSection />


      {/* ── Features ── */}
      <section ref={ref} className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-3">Everything You Need to <span className="text-gradient-love">Create &amp; Earn</span></h2>
            <p className="dark:text-gray-400 text-gray-600 max-w-xl mx-auto">Professional streaming tools built for African creators.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl transition-all group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}><Icon className="w-5 h-5 text-white" /></div>
                  <h3 className="font-bold text-base dark:text-white text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#0e0720] via-[#160830] to-[#200a40] border border-violet-500/20">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-6 left-8 opacity-10"><Tv className="w-20 h-20 text-violet-300" /></div>
              <div className="absolute bottom-6 right-8 opacity-10"><Crown className="w-20 h-20 text-pink-300" /></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl" />
            </div>
            <div className="relative p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/40"><Clapperboard className="w-8 h-8 text-white" /></div>
              <h2 className="font-display font-black text-3xl text-white mb-3">Ready to Go Live?</h2>
              <p className="text-white/80 mb-7 max-w-lg mx-auto">Join creators already earning on SmartzTV. It's free to start.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl btn-love font-bold text-sm shadow-xl hover:scale-105 transition-all"><Zap className="w-4 h-4" /> Become a Creator</Link>
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/12 backdrop-blur-sm border border-white/25 text-white font-semibold hover:bg-white/22 transition-all text-sm"><Play className="w-4 h-4" fill="white" /> Watch Live Streams</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
