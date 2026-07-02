import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Heart, Eye, Search, Flame, TrendingUp, Radio, Gift, X, Tv, Crown, Zap, Shield, RefreshCw, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const categories = ['All', 'Live', 'Music', 'Comedy', 'Tech', 'Fashion', 'Sports', 'Food', 'Education']

const giftItems = [
  { emoji: '🌹', name: 'Rose',    price: 1,   color: 'text-red-400' },
  { emoji: '💎', name: 'Diamond', price: 50,  color: 'text-blue-400' },
  { emoji: '🚀', name: 'Rocket',  price: 100, color: 'text-purple-400' },
  { emoji: '👑', name: 'Crown',   price: 500, color: 'text-amber-400' },
  { emoji: '🎁', name: 'Gift',    price: 10,  color: 'text-pink-400' },
  { emoji: '⭐', name: 'Star',    price: 25,  color: 'text-yellow-400' },
]

interface Stream {
  id: string; title: string; creator: string; creatorEmoji: string; avatar_url?: string
  views: string; likes: number; duration: string; category: string; emoji: string
  live: boolean; trending: boolean; gifts: number; verified: boolean; vip: boolean
  thumbnail_url?: string
}

function StreamModal({ stream, onClose }: { stream: Stream; onClose: () => void }) {
  const [gifted, setGifted] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<{ user: string; text: string; time: string }[]>([])

  const sendComment = () => {
    if (!comment.trim()) return
    setComments(prev => [...prev, { user: '🧑🏾', text: comment, time: 'now' }])
    setComment('')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="dark:bg-[#0D0A14] bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border dark:border-purple-900/20">

        {/* Stream view */}
        <div className="relative h-56 sm:h-64 bg-gradient-to-br from-pink-900/50 to-purple-900/50 flex items-center justify-center flex-shrink-0">
          {stream.thumbnail_url
            ? <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover absolute inset-0" />
            : <div className="text-8xl">{stream.emoji}</div>}

          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              {stream.live && <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">● LIVE</span>}
              {stream.trending && <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black">🔥 Trending</span>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full dark:bg-purple-900/40 bg-black/40 flex items-center justify-center text-lg overflow-hidden">
                {stream.avatar_url ? <img src={stream.avatar_url} alt={stream.creator} className="w-full h-full object-cover" /> : stream.creatorEmoji}
              </div>
              <div>
                <p className="text-white text-xs font-bold">{stream.creator}</p>
                <p className="text-white/70 text-[10px] flex items-center gap-1"><Eye className="w-3 h-3" /> {stream.views}</p>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-full bg-love-gradient text-white text-[10px] font-black shadow-lg">Follow</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h3 className="font-bold dark:text-white text-gray-100 text-sm leading-snug">{stream.title}</h3>

          {/* Gifts */}
          <div>
            <p className="text-[11px] dark:text-pink-300/60 text-gray-400 font-semibold mb-2">Send a gift</p>
            <div className="grid grid-cols-6 gap-2">
              {giftItems.map(g => (
                <button key={g.name} onClick={() => setGifted(g.name)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${gifted === g.name ? 'dark:bg-purple-800/30 bg-purple-100 ring-1 ring-brand-pink' : 'dark:bg-white/5 bg-gray-100 hover:dark:bg-white/8'}`}>
                  <span className="text-xl">{g.emoji}</span>
                  <span className={`text-[9px] font-bold ${g.color}`}>{g.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <p className="text-[11px] dark:text-pink-300/60 text-gray-400 font-semibold mb-2">Live comments</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs dark:text-purple-400/50 text-gray-400 italic">Be the first to comment!</p>
              ) : (
                comments.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>{c.user}</span>
                    <p className="text-xs dark:text-pink-50 text-gray-900">{c.text}</p>
                    <span className="text-[10px] dark:text-purple-400/40 text-gray-400 ml-auto">{c.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendComment()}
              placeholder="Say something…"
              className="flex-1 px-3 py-2.5 rounded-xl dark:bg-purple-900/10 bg-gray-100 text-sm dark:text-pink-50 text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 focus:outline-none border dark:border-purple-500/15 border-transparent focus:dark:border-pink-500/30" />
            <button onClick={sendComment} disabled={!comment.trim()}
              className="px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-50">Send</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function SmartzTVPage() {
  const { user } = useAuth()
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [showGoLiveModal, setShowGoLiveModal] = useState(false)
  const [liveTitle, setLiveTitle] = useState('')
  const [liveCategory, setLiveCategory] = useState('Music')
  const [goingLive, setGoingLive] = useState(false)

  const fetchStreams = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('livestreams')
      .select('id, title, category, status, view_count, like_count, gift_count, thumbnail_url, created_at, profiles:streamer_id(full_name, avatar_url, is_verified, subscription_tier)')
      .order('view_count', { ascending: false })
      .limit(20)

    setStreams((data || []).map((s: any) => {
      const cat = s.category || 'Music'
      const emojiMap: Record<string, string> = { Music: '🎵', Comedy: '😂', Tech: '💻', Fashion: '👗', Sports: '⚽', Food: '🍛', Education: '📚', Live: '📺' }
      return {
        id: String(s.id),
        title: s.title || 'Untitled Stream',
        creator: s.profiles?.full_name || 'Creator',
        creatorEmoji: '🎬',
        avatar_url: s.profiles?.avatar_url,
        views: s.view_count > 1000 ? `${(s.view_count / 1000).toFixed(1)}K` : String(s.view_count || 0),
        likes: s.like_count || 0,
        duration: s.status === 'live' ? 'LIVE' : '—',
        category: cat,
        emoji: emojiMap[cat] || '📺',
        live: s.status === 'live',
        trending: (s.view_count || 0) > 5000,
        gifts: s.gift_count || 0,
        verified: s.profiles?.is_verified || false,
        vip: s.profiles?.subscription_tier === 'vip',
        thumbnail_url: s.thumbnail_url,
      }
    }))
    setLoading(false)
  }

  useEffect(() => { fetchStreams() }, [])

  const handleGoLive = async () => {
    if (!liveTitle.trim() || !user?.id) return
    setGoingLive(true)
    const { error } = await supabase.from('livestreams').insert({
      title: liveTitle,
      category: liveCategory,
      streamer_id: user.id,
      status: 'live',
      view_count: 0,
      like_count: 0,
    })
    if (!error) { setShowGoLiveModal(false); setLiveTitle(''); fetchStreams() }
    setGoingLive(false)
  }

  const filtered = streams.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.creator.toLowerCase().includes(search.toLowerCase())
    if (activeCategory === 'Live') return matchSearch && s.live
    return matchSearch && (activeCategory === 'All' || s.category === activeCategory)
  })

  const liveCount = streams.filter(s => s.live).length

  return (
    <div className="h-full overflow-y-auto dark:bg-[#0A0710] bg-gray-50 pb-4">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 dark:bg-[#0D0A14] bg-white border-b dark:border-purple-900/20 border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-black dark:text-white text-gray-900 flex items-center gap-2">
              <Tv className="w-5 h-5 text-brand-pink" /> SmartzTV
            </h1>
            <p className="text-xs dark:text-pink-300/60 text-gray-500">Live & on-demand streaming</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchStreams} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
            </button>
            {liveCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-500">{liveCount} live</span>
              </div>
            )}
            <button onClick={() => setShowGoLiveModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold hover:opacity-90 transition-opacity">
              <Radio className="w-3.5 h-3.5" /> Go Live
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search streams, creators…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:border dark:border-purple-500/15 border border-gray-200 text-sm dark:text-white text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 focus:outline-none focus:dark:border-pink-500/30 transition-colors" />
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-purple-300/70 text-gray-600 hover:text-brand-pink'}`}>
              {cat === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block mr-1 animate-pulse" />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
            <p className="text-sm dark:text-pink-300/60 text-gray-500">Loading streams…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="text-5xl">📺</div>
            <p className="font-bold dark:text-white text-gray-900">No streams yet</p>
            <p className="text-sm dark:text-pink-300/60 text-gray-500">Be the first to go live on SmartzTV!</p>
            <button onClick={() => setShowGoLiveModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-love-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/20">
              <Radio className="w-4 h-4" /> Go Live Now
            </button>
          </div>
        ) : (
          <>
            {/* Live streams */}
            {filtered.some(s => s.live) && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="font-bold text-sm dark:text-white text-gray-900">Live Now</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.filter(s => s.live).map((stream, i) => (
                    <StreamCard key={stream.id} stream={stream} i={i} onClick={() => setSelectedStream(stream)} />
                  ))}
                </div>
              </div>
            )}

            {/* All / Trending */}
            {filtered.some(s => !s.live) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-brand-pink" />
                  <h2 className="font-bold text-sm dark:text-white text-gray-900">Trending Videos</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.filter(s => !s.live).map((stream, i) => (
                    <StreamCard key={stream.id} stream={stream} i={i} onClick={() => setSelectedStream(stream)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stream modal */}
      <AnimatePresence>
        {selectedStream && <StreamModal stream={selectedStream} onClose={() => setSelectedStream(null)} />}
      </AnimatePresence>

      {/* Go Live modal */}
      <AnimatePresence>
        {showGoLiveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowGoLiveModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="dark:bg-[#0D0A14] bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden border dark:border-purple-900/20">
              <div className="flex items-center justify-between px-5 py-4 border-b dark:border-purple-900/20 border-gray-100">
                <h2 className="font-display font-black text-lg dark:text-white text-gray-900 flex items-center gap-2"><Radio className="w-5 h-5 text-red-500" /> Go Live</h2>
                <button onClick={() => setShowGoLiveModal(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center"><X className="w-4 h-4 dark:text-gray-400 text-gray-600" /></button>
              </div>
              <div className="p-5 space-y-4">
                <input value={liveTitle} onChange={e => setLiveTitle(e.target.value)} placeholder="Stream title*"
                  className="w-full px-4 py-3 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:text-white text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 border dark:border-purple-500/15 border-gray-200 text-sm focus:outline-none focus:dark:border-pink-500/30" />
                <select value={liveCategory} onChange={e => setLiveCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:text-white text-gray-900 border dark:border-purple-500/15 border-gray-200 text-sm focus:outline-none">
                  {categories.filter(c => c !== 'All' && c !== 'Live').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={handleGoLive} disabled={!liveTitle.trim() || goingLive}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {goingLive ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><Radio className="w-4 h-4" /> Start Streaming</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StreamCard({ stream, i, onClick }: { stream: Stream; i: number; onClick: () => void }) {
  return (
    <motion.div key={stream.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
      onClick={onClick} className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-purple-900/15 border-gray-200 overflow-hidden cursor-pointer hover:dark:border-pink-500/20 hover:border-brand-pink/30 transition-all shadow-sm group">
      <div className="relative h-36 bg-gradient-to-br from-pink-900/40 to-purple-900/40 flex items-center justify-center overflow-hidden">
        {stream.thumbnail_url
          ? <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
          : <span className="text-5xl group-hover:scale-110 transition-transform">{stream.emoji}</span>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          {stream.live && <span className="px-2 py-1 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">● LIVE</span>}
          {stream.trending && <span className="px-2 py-1 rounded-full bg-amber-500 text-white text-[9px] font-black">🔥</span>}
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 dark:bg-black/60 bg-black/60 rounded-full px-2 py-0.5">
          <Eye className="w-3 h-3 text-white/80" />
          <span className="text-[10px] text-white/80 font-semibold">{stream.views}</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-sm dark:text-white text-gray-900 truncate mb-1">{stream.title}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full dark:bg-purple-900/20 bg-gray-100 flex items-center justify-center text-xs overflow-hidden">
              {stream.avatar_url ? <img src={stream.avatar_url} alt={stream.creator} className="w-full h-full object-cover" /> : stream.creatorEmoji}
            </div>
            <span className="text-xs dark:text-pink-300/70 text-gray-500 truncate max-w-[90px]">{stream.creator}</span>
            {stream.verified && <span className="text-blue-400 text-[10px]">✓</span>}
          </div>
          <div className="flex items-center gap-2 text-[10px] dark:text-purple-400/60 text-gray-400">
            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{stream.likes}</span>
            {stream.gifts > 0 && <span className="flex items-center gap-0.5"><Gift className="w-3 h-3 text-amber-400" />{stream.gifts}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
