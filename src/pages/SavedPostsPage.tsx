import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Bookmark, Heart, MessageCircle, Share2, RefreshCw,
  Loader2, Trash2, Link2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface SavedPost {
  id: string
  author: string
  avatar_url?: string
  time: string
  content: string
  image_url?: string | null
  video_url?: string | null
  likes: number
  comments: number
  liked: boolean
  postId: string
  savedAt: string
}

const defaultEmojis = ['👩🏾', '👨🏿', '👩🏽', '👨🏾', '👩🏿', '👨🏽']

export default function SavedPostsPage() {
  const { user } = useAuth()
  const [saved, setSaved] = useState<SavedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchSaved = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    const { data: saveRows } = await supabase
      .from('post_saves')
      .select('post_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!saveRows?.length) { setSaved([]); setLoading(false); return }

    const postIds = saveRows.map((s: any) => s.post_id)

    const [postsRes, likesRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, content, image_url, video_url, created_at, likes_count, comments_count, author_id')
        .in('id', postIds)
        .eq('is_deleted', false),
      supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds),
    ])

    const posts = postsRes.data || []
    const authorIds = [...new Set(posts.map((p: any) => p.author_id).filter(Boolean))]
    const likedSet = new Set(((likesRes.data as any[]) || []).map((l: any) => l.post_id))

    const profilesRes = authorIds.length
      ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', authorIds)
      : { data: [] }
    const profileMap = Object.fromEntries(((profilesRes.data as any[]) || []).map((p: any) => [p.id, p]))

    const saveMap = Object.fromEntries(saveRows.map((s: any) => [s.post_id, s.created_at]))

    const mapped: SavedPost[] = posts.map((p: any, i: number) => {
      const profile = profileMap[p.author_id]
      return {
        postId: String(p.id),
        id: String(p.id),
        author: profile?.full_name || 'Anonymous',
        avatar_url: profile?.avatar_url,
        time: new Date(p.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        content: p.content || '',
        image_url: p.image_url,
        video_url: p.video_url,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        liked: likedSet.has(p.id),
        savedAt: saveMap[p.id] || p.created_at,
      }
    })

    // sort by saved time
    mapped.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    setSaved(mapped)
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchSaved() }, [fetchSaved])

  const handleUnsave = async (postId: string) => {
    if (!user?.id) return
    setSaved(prev => prev.filter(p => p.postId !== postId))
    await supabase.from('post_saves').delete().eq('post_id', postId).eq('user_id', user.id)
  }

  const handleLike = async (postId: string) => {
    if (!user?.id) return
    const post = saved.find(p => p.postId === postId)
    if (!post) return
    const nowLiked = !post.liked
    setSaved(prev => prev.map(p => p.postId === postId ? { ...p, liked: nowLiked, likes: nowLiked ? p.likes + 1 : p.likes - 1 } : p))
    if (nowLiked) {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
    } else {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
    }
  }

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/app/feed`
    if (navigator.share) {
      navigator.share({ url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(postId)
        setTimeout(() => setCopied(null), 2000)
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto dark:bg-[#0A0710] bg-gray-50 pb-8">
      <div className="max-w-xl mx-auto px-3 pt-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-black text-xl dark:text-white text-gray-900 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-brand-pink" />
              Saved Posts
            </h1>
            <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{saved.length} saved post{saved.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={fetchSaved}
            className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand-pink animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && saved.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-love-gradient flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30">
              <Bookmark className="w-8 h-8 text-white" />
            </div>
            <p className="font-bold dark:text-white text-gray-900 mb-1">No saved posts yet</p>
            <p className="text-sm dark:text-gray-400 text-gray-500">
              Tap the bookmark icon on any post to save it here for later.
            </p>
          </div>
        )}

        {/* Posts */}
        {!loading && saved.map((post, i) => (
          <motion.div
            key={post.postId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 mb-3 overflow-hidden shadow-sm"
          >
            {/* Author */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-love-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                  {post.avatar_url
                    ? <img src={post.avatar_url} alt={post.author} className="w-full h-full object-cover" />
                    : <span>{defaultEmojis[i % defaultEmojis.length]}</span>
                  }
                </div>
                <div>
                  <p className="text-sm font-bold dark:text-white text-gray-900">{post.author}</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-400">{post.time}</p>
                </div>
              </div>
              <button
                onClick={() => handleUnsave(post.postId)}
                title="Remove from saved"
                className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:bg-red-500/10 hover:text-red-500 dark:text-gray-400 text-gray-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
              <p className="text-sm dark:text-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Media */}
            {(post.image_url || post.video_url) && (
              <div className="dark:bg-black/20 bg-gray-100 max-h-[360px] overflow-hidden">
                {post.video_url
                  ? <video src={post.video_url} className="w-full max-h-[360px] object-cover" controls />
                  : <img src={post.image_url!} alt="" className="w-full max-h-[360px] object-cover" />}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center px-2 py-1.5 border-t dark:border-white/4 border-gray-50 gap-0.5">
              <button
                onClick={() => handleLike(post.postId)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center ${
                  post.liked ? 'text-brand-pink dark:bg-pink-500/10 bg-pink-50' : 'dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                <span>{post.likes > 0 ? post.likes : 'Like'}</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:text-gray-400 text-gray-500 text-xs font-semibold flex-1 justify-center">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments > 0 ? post.comments : 'Comment'}</span>
              </button>
              <button
                onClick={() => handleShare(post.postId)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50 transition-colors text-xs font-semibold flex-1 justify-center"
              >
                {copied === post.postId
                  ? <><Link2 className="w-4 h-4" /> Copied!</>
                  : <><Share2 className="w-4 h-4" /> Share</>
                }
              </button>
              <button
                onClick={() => handleUnsave(post.postId)}
                className="p-2 rounded-xl text-brand-pink dark:bg-pink-500/10 bg-pink-50 transition-all"
                title="Unsave"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
