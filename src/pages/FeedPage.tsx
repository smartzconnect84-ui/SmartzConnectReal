import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Video, Send, Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, TrendingUp, RefreshCw, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Post {
  id: string
  author: string
  handle: string
  emoji?: string
  avatar_url?: string
  location?: string
  time: string
  content: string
  likes: number
  comments: number
  shares: number
  liked: boolean
  saved: boolean
  verified?: boolean
  premium?: boolean
}

const trending = ['#AfricaTech', '#SmartzTV', '#Afrobeats', '#NaijaFashion', '#AccraTech', '#MonroviaVibes']
const defaultEmojis = ['👩🏾', '👨🏿', '👩🏽', '👨🏾', '👩🏿', '👨🏽']

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [postText, setPostText] = useState('')
  const [posting, setPosting] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const { user } = useAuth()

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, likes_count, comments_count, shares_count, location,
        profiles:author_id (full_name, avatar_url, is_verified, subscription_tier, username)
      `)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      setError(error.message)
    } else {
      const mapped: Post[] = (data || []).map((p: any, i: number) => ({
        id: String(p.id),
        author: p.profiles?.full_name || 'Anonymous',
        handle: p.profiles?.username ? `@${p.profiles.username}` : '@user',
        avatar_url: p.profiles?.avatar_url,
        emoji: defaultEmojis[i % defaultEmojis.length],
        location: p.location,
        time: new Date(p.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        content: p.content,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        shares: p.shares_count || 0,
        liked: false,
        saved: false,
        verified: p.profiles?.is_verified,
        premium: p.profiles?.subscription_tier === 'vip' || p.profiles?.subscription_tier === 'premium',
      }))
      setPosts(mapped)
    }
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const toggleLike = async (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ))
    const post = posts.find(p => p.id === id)
    if (post) {
      await supabase
        .from('posts')
        .update({ likes_count: post.liked ? post.likes - 1 : post.likes + 1 })
        .eq('id', id)
    }
  }

  const toggleSave = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p))
  }

  const handlePost = async () => {
    if (!postText.trim() || !user?.id) return
    setPosting(true)
    const { error } = await supabase.from('posts').insert({
      content: postText,
      author_id: user.id,
      visibility: 'public',
    })
    if (!error) {
      setPostText('')
      setShowCompose(false)
      fetchPosts()
    }
    setPosting(false)
  }

  return (
    <div className="h-full overflow-y-auto dark:bg-[#0A0710] bg-gray-50 pb-16 md:pb-0">
      <div className="max-w-xl mx-auto px-3 py-4">

        {/* Compose box */}
        <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 mb-4 shadow-sm">
          <AnimatePresence mode="wait">
            {!showCompose ? (
              <motion.button
                key="trigger"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowCompose(true)}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200">
                  <p className="text-sm dark:text-gray-500 text-gray-400">What's on your mind?</p>
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="compose"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user?.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <textarea
                    autoFocus
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                    placeholder="Share something with the community..."
                    rows={3}
                    className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400 resize-none focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t dark:border-white/6 border-gray-100">
                  <div className="flex gap-2">
                    <button className="p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-100 transition-colors">
                      <Image className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    </button>
                    <button className="p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-100 transition-colors">
                      <Video className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    </button>
                    <button className="p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-100 transition-colors">
                      <MapPin className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowCompose(false); setPostText('') }}
                      className="px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 text-xs font-semibold dark:text-gray-400 text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePost}
                      disabled={!postText.trim() || posting}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> {posting ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-brand-pink/30 border-t-brand-pink animate-spin" />
            <p className="text-sm dark:text-gray-400 text-gray-500">Loading posts…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="text-4xl mb-1">⚠️</div>
            <p className="font-bold dark:text-white text-gray-900 mb-1">Could not load feed</p>
            <p className="text-sm dark:text-gray-400 text-gray-500 max-w-xs">{error}</p>
            <button
              onClick={fetchPosts}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Empty feed */}
        {!loading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="text-5xl mb-2">✍️</div>
            <div>
              <p className="font-bold dark:text-white text-gray-900 mb-1">No posts yet</p>
              <p className="text-sm dark:text-gray-400 text-gray-500">Be the first to share something with the community!</p>
            </div>
          </div>
        )}

        {/* Posts */}
        {!loading && !error && posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 mb-3 overflow-hidden shadow-sm"
          >
            {/* Post header */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-full dark:bg-white/8 bg-gray-100 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                {post.avatar_url
                  ? <img src={post.avatar_url} alt={post.author} className="w-full h-full object-cover" />
                  : post.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm dark:text-white text-gray-900">{post.author}</span>
                  {post.verified && <span className="text-blue-400 text-xs">✓</span>}
                  {post.premium && <span className="text-[10px] text-amber-500 font-bold">👑</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] dark:text-gray-500 text-gray-400">{post.handle}</span>
                  {post.location && (
                    <><span className="dark:text-gray-700 text-gray-300">·</span>
                      <span className="text-[11px] dark:text-gray-500 text-gray-400">📍 {post.location}</span></>
                  )}
                  <span className="dark:text-gray-700 text-gray-300">·</span>
                  <span className="text-[11px] dark:text-gray-500 text-gray-400">{post.time}</span>
                </div>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center dark:hover:bg-white/5 hover:bg-gray-100 transition-colors">
                <MoreHorizontal className="w-4 h-4 dark:text-gray-500 text-gray-400" />
              </button>
            </div>

            {/* Post content */}
            <div className="px-4 pb-3">
              <p className="text-sm dark:text-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Engagement */}
            <div className="flex items-center justify-between px-4 py-2 border-t dark:border-white/4 border-gray-50">
              <div className="flex gap-1">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    post.liked
                      ? 'text-brand-pink dark:bg-pink-500/10 bg-pink-50'
                      : 'dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                  {post.likes > 0 && post.likes}
                </motion.button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50 transition-colors text-xs font-semibold">
                  <MessageCircle className="w-4 h-4" />
                  {post.comments > 0 && post.comments}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50 transition-colors text-xs font-semibold">
                  <Share2 className="w-4 h-4" />
                  {post.shares > 0 && post.shares}
                </button>
              </div>
              <button
                onClick={() => toggleSave(post.id)}
                className={`p-1.5 rounded-xl transition-all ${
                  post.saved
                    ? 'text-brand-pink dark:bg-pink-500/10 bg-pink-50'
                    : 'dark:text-gray-400 text-gray-500 dark:hover:bg-white/5 hover:bg-gray-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Trending sidebar */}
        {!loading && (
          <div className="hidden lg:block dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-brand-pink" />
              <span className="font-bold text-sm dark:text-white text-gray-900">Trending</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trending.map(tag => (
                <button key={tag} className="px-2.5 py-1.5 rounded-xl dark:bg-white/5 bg-gray-50 dark:text-gray-300 text-gray-600 text-xs font-semibold hover:text-brand-pink transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
