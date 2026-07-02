import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Heart, Eye, Search, Flame, TrendingUp, Radio, Gift, X, Tv, Crown, Zap, Shield } from 'lucide-react'

const categories = ['All', 'Live', 'Music', 'Comedy', 'Tech', 'Fashion', 'Sports', 'Food', 'Education']

const streams = [
  { id: 1, title: 'Afrobeats Live Session 🎵',        creator: 'Kofi Asante',    creatorEmoji: '👨🏾', views: '12.4K', likes: 2341, duration: 'LIVE', category: 'Music',     emoji: '🎵', live: true,  trending: true,  gifts: 234, verified: true,  vip: true  },
  { id: 2, title: 'Liberian Fashion Week 2026 👗',    creator: 'Amara Kollie',   creatorEmoji: '👩🏾', views: '8.9K',  likes: 1876, duration: '24:15', category: 'Fashion',   emoji: '👗', live: false, trending: true,  gifts: 0,   verified: true,  vip: false },
  { id: 3, title: 'Coding in Africa: Full Stack 💻',  creator: 'Emmanuel M.',   creatorEmoji: '👨🏿', views: '5.2K',  likes: 934,  duration: 'LIVE', category: 'Tech',      emoji: '💻', live: true,  trending: false, gifts: 89,  verified: true,  vip: false },
  { id: 4, title: 'West African Comedy Night 😂',     creator: 'Chukwu Bello',  creatorEmoji: '👨🏾', views: '21.3K', likes: 4521, duration: '45:30', category: 'Comedy',    emoji: '😂', live: false, trending: true,  gifts: 0,   verified: true,  vip: true  },
  { id: 5, title: 'Jollof Wars: Nigeria vs Ghana 🍛', creator: 'Mama Nadia',    creatorEmoji: '👩🏿', views: '34.1K', likes: 7823, duration: '18:42', category: 'Food',      emoji: '🍛', live: false, trending: true,  gifts: 0,   verified: false, vip: false },
  { id: 6, title: 'AFCON 2026 Highlights ⚽',         creator: 'SportzAF',      creatorEmoji: '🏟️',  views: '67.8K', likes: 12400,duration: 'LIVE', category: 'Sports',    emoji: '⚽', live: true,  trending: true,  gifts: 1204,verified: true,  vip: true  },
  { id: 7, title: 'African History Masterclass 📚',   creator: 'Prof. Diallo',  creatorEmoji: '👨🏽', views: '3.1K',  likes: 567,  duration: '1:12:00',category: 'Education', emoji: '📚', live: false, trending: false, gifts: 0,   verified: true,  vip: false },
  { id: 8, title: 'Naija Street Food Tour 🍢',        creator: 'Blessing Osei', creatorEmoji: '👩🏾', views: '9.4K',  likes: 2103, duration: 'LIVE', category: 'Food',      emoji: '🍢', live: true,  trending: false, gifts: 156, verified: true,  vip: false },
]

const giftItems = [
  { emoji: '🌹', name: 'Rose',    price: 1,    color: 'text-red-400' },
  { emoji: '💎', name: 'Diamond', price: 50,   color: 'text-blue-400' },
  { emoji: '🚀', name: 'Rocket',  price: 100,  color: 'text-purple-400' },
  { emoji: '👑', name: 'Crown',   price: 500,  color: 'text-amber-400' },
  { emoji: '🎁', name: 'Gift',    price: 10,   color: 'text-pink-400' },
  { emoji: '⭐', name: 'Star',    price: 25,   color: 'text-yellow-400' },
]

type Stream = typeof streams[0]

function StreamModal({ stream, onClose }: { stream: Stream; onClose: () => void }) {
  const [gifted, setGifted] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([
    { user: '👩🏾', text: 'This is amazing! 🔥', time: '2s' },
    { user: '👨🏿', text: 'Love from Lagos! 💕', time: '5s' },
    { user: '👩🏽', text: 'Keep going! 🎉', time: '8s' },
  ])

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
        className="dark:bg-[#0D0A14] bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Stream view */}
        <div className="relative h-56 sm:h-64 dark:bg-gradient-to-br from-pink-900/50 to-purple-900/50 bg-gradient-to-br from-pink-800/50 to-purple-800/50 flex items-center justify-center flex-shrink-0">
          <div className="text-8xl">{stream.emoji}</div>

          {/* Overlay controls */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              {stream.live && (
                <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">● LIVE</span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-[10px] font-semibold backdrop-blur-sm">
                <Eye className="w-3 h-3 inline mr-1" />{stream.views}
              </span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Creator info */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-love-gradient flex items-center justify-center text-xl">{stream.creatorEmoji}</div>
            <div>
              <p className="text-white font-bold text-sm">{stream.creator}</p>
              <p className="text-white/70 text-[10px]">{stream.category}</p>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {comments.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{c.user}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-white/80 leading-relaxed">{c.text}</span>
                <span className="text-[9px] text-white/40 ml-2">{c.time} ago</span>
              </div>
            </div>
          ))}
        </div>

        {/* Gifts */}
        <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
          <p className="text-[10px] text-white/50 mb-2 font-semibold uppercase tracking-wider">Send a Gift</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {giftItems.map(g => (
              <button key={g.name} onClick={() => setGifted(g.name)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${gifted === g.name ? 'border-brand-pink bg-pink-500/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                <span className="text-xl">{g.emoji}</span>
                <span className={`text-[9px] font-bold ${g.color}`}>{g.price}🪙</span>
              </button>
            ))}
          </div>
        </div>

        {/* Comment input */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendComment()}
              placeholder="Say something..."
              className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-brand-pink transition-colors" />
            <button onClick={sendComment} className="w-9 h-9 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function SmartzTVPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [likedStreams, setLikedStreams] = useState<number[]>([])

  const filtered = streams.filter(v =>
    (activeCategory === 'All' || v.category === activeCategory || (activeCategory === 'Live' && v.live)) &&
    v.title.toLowerCase().includes(search.toLowerCase())
  )

  const featured = streams.find(s => s.live && s.trending) || streams[0]
  const liveCount = streams.filter(s => s.live).length

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 dark:bg-[#130E1E] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-black dark:text-white text-gray-900 flex items-center gap-2">
              <Tv className="w-5 h-5 text-brand-pink" /> SmartzTV
            </h1>
            <p className="text-xs dark:text-gray-500 text-gray-500">Live streams & videos from Africa</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <Radio className="w-3 h-3 text-red-400 animate-pulse" />
              <span className="text-xs font-bold text-red-400">{liveCount} LIVE</span>
            </div>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search streams & creators..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors text-sm" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Featured live stream */}
        {activeCategory === 'All' && !search && (
          <div className="px-4 sm:px-6 pt-4 pb-2">
            <motion.div
              onClick={() => setSelectedStream(featured)}
              className="relative rounded-2xl overflow-hidden dark:bg-gradient-to-br dark:from-pink-900/50 dark:to-purple-900/50 bg-gradient-to-br from-pink-100 to-purple-100 border dark:border-pink-500/20 border-pink-200 p-5 flex items-center gap-4 cursor-pointer hover:shadow-xl hover:shadow-pink-500/10 transition-all group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10" />
              <div className="text-6xl relative z-10">{featured.emoji}</div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">● LIVE</span>
                  <span className="text-xs dark:text-gray-300 text-gray-600 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {featured.views} watching
                  </span>
                  {featured.gifts > 0 && (
                    <span className="text-xs text-amber-500 flex items-center gap-1">
                      <Gift className="w-3 h-3" /> {featured.gifts} gifts
                    </span>
                  )}
                </div>
                <h3 className="font-display text-base font-black dark:text-white text-gray-900 mb-1 leading-tight">{featured.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{featured.creatorEmoji}</span>
                  <p className="text-xs dark:text-gray-300 text-gray-600">{featured.creator}</p>
                  {featured.verified && <Shield className="w-3 h-3 text-blue-400" />}
                  {featured.vip && <Crown className="w-3 h-3 text-amber-400" />}
                </div>
              </div>
              <button className="w-12 h-12 rounded-full bg-love-gradient flex items-center justify-center shadow-xl shadow-pink-500/30 hover:scale-110 transition-all relative z-10 flex-shrink-0">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </button>
            </motion.div>
          </div>
        )}

        {/* Stream grid */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="flex items-center gap-2 mb-3 mt-2">
            <TrendingUp className="w-4 h-4 text-brand-pink" />
            <span className="text-sm font-bold dark:text-white text-gray-900">
              {activeCategory === 'All' ? 'Trending Now' : activeCategory}
            </span>
            <span className="text-xs dark:text-gray-500 text-gray-400">· {filtered.length} streams</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filtered.map((stream, i) => (
              <motion.div key={stream.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedStream(stream)}
                className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 overflow-hidden hover:border-brand-pink/40 hover:shadow-lg transition-all cursor-pointer group">

                {/* Thumbnail */}
                <div className="relative h-28 dark:bg-gradient-to-br dark:from-pink-500/15 dark:to-purple-600/15 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                  <span className="text-4xl group-hover:scale-110 transition-transform">{stream.emoji}</span>

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-t-2xl">
                    <div className="w-10 h-10 rounded-full bg-love-gradient flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2">
                    {stream.live ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">● LIVE</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-medium">{stream.duration}</span>
                    )}
                  </div>
                  {stream.trending && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-love-gradient flex items-center justify-center">
                      <Flame className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  {stream.gifts > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white text-[9px] font-bold">
                      <Gift className="w-2.5 h-2.5" /> {stream.gifts}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-bold dark:text-white text-gray-900 mb-1 line-clamp-2 leading-tight">{stream.title}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">{stream.creatorEmoji}</span>
                    <span className="text-[10px] dark:text-gray-400 text-gray-500 truncate">{stream.creator}</span>
                    {stream.verified && <Shield className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                      <span className="text-[10px] dark:text-gray-500 text-gray-400">{stream.views}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setLikedStreams(prev => prev.includes(stream.id) ? prev.filter(id => id !== stream.id) : [...prev, stream.id]) }}
                      className="flex items-center gap-1">
                      <Heart className={`w-3 h-3 ${likedStreams.includes(stream.id) ? 'text-brand-pink fill-brand-pink' : 'dark:text-gray-500 text-gray-400'}`} />
                      <span className="text-[10px] dark:text-gray-500 text-gray-400">{(stream.likes + (likedStreams.includes(stream.id) ? 1 : 0)).toLocaleString()}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Go Live CTA */}
        <div className="px-4 sm:px-6 pb-6">
          <div className="dark:bg-gradient-to-r dark:from-pink-900/30 dark:to-purple-900/30 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-5 border dark:border-pink-500/20 border-pink-200 flex items-center gap-4">
            <div className="text-4xl">🎬</div>
            <div className="flex-1">
              <p className="font-bold dark:text-white text-gray-900 text-sm">Start Streaming</p>
              <p className="text-xs dark:text-gray-400 text-gray-600">Go live and earn from virtual gifts</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 flex-shrink-0">
              Go Live 🔴
            </button>
          </div>
        </div>
      </div>

      {/* Stream Modal */}
      <AnimatePresence>
        {selectedStream && (
          <StreamModal stream={selectedStream} onClose={() => setSelectedStream(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
