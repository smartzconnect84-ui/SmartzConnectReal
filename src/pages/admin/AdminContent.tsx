import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Search, Eye, Trash2, CheckCircle, Image, Video, FileText, X, ExternalLink, Heart, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface Post {
  id: number
  user_id: number
  content: string | null
  image_url: string | null
  video_url: string | null
  type: string
  likes_count: number
  comments_count: number
  is_deleted: boolean
  created_at: string
}

interface Reactor {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  emoji?: string
}

interface Commenter {
  author_id: string
  content: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

type ListModal = { postId: number; kind: 'likes' | 'comments' } | null

export default function AdminContent() {
  const [posts, setPosts]             = useState<Post[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]   = useState('all')
  const [selected, setSelected]       = useState<Post | null>(null)
  // Map numeric userId → auth UUID for profile links
  const [authorAuthMap, setAuthorAuthMap] = useState<Map<number, string>>(new Map())
  // Reaction / comment list modal
  const [listModal, setListModal]     = useState<ListModal>(null)
  const [listLoading, setListLoading] = useState(false)
  const [reactors, setReactors]       = useState<Reactor[]>([])
  const [commenters, setCommenters]   = useState<Commenter[]>([])

  /* ─── Fetch posts ─── */
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (typeFilter !== 'all') q = q.eq('type', typeFilter)
    const { data } = await q.limit(100)
    const rows = (data || []) as Post[]
    setPosts(rows)

    // Batch-fetch auth_ids so we can link to /app/profile/:authId
    const numericIds = [...new Set(rows.map(p => p.user_id).filter(Boolean))]
    if (numericIds.length) {
      const { data: users } = await supabase
        .from('users')
        .select('id, auth_id')
        .in('id', numericIds)
      const map = new Map<number, string>()
      for (const u of (users || []) as any[]) {
        if (u.auth_id) map.set(u.id, u.auth_id)
      }
      setAuthorAuthMap(map)
    }
    setLoading(false)
  }, [typeFilter])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  /* ─── Open likes list modal ─── */
  const openLikes = async (postId: number) => {
    setListModal({ postId, kind: 'likes' })
    setListLoading(true)
    setReactors([])
    // Try post_reactions first (emoji reactions), then post_likes (binary likes)
    const [{ data: rxn }, { data: lks }] = await Promise.all([
      supabase.from('post_reactions').select('user_id, emoji, profiles!user_id(full_name, avatar_url)').eq('post_id', postId).limit(100),
      supabase.from('post_likes').select('user_id, profiles!user_id(full_name, avatar_url)').eq('post_id', postId).limit(100),
    ])
    const combined: Reactor[] = [
      ...((rxn || []) as any[]).map((r: any) => ({
        user_id: r.user_id,
        emoji: r.emoji || '❤️',
        full_name: r.profiles?.full_name || null,
        avatar_url: r.profiles?.avatar_url || null,
      })),
      ...((lks || []) as any[]).map((r: any) => ({
        user_id: r.user_id,
        emoji: '❤️',
        full_name: r.profiles?.full_name || null,
        avatar_url: r.profiles?.avatar_url || null,
      })),
    ]
    // Deduplicate by user_id
    const seen = new Set<string>()
    setReactors(combined.filter(r => { if (seen.has(r.user_id)) return false; seen.add(r.user_id); return true }))
    setListLoading(false)
  }

  /* ─── Open comments list modal ─── */
  const openComments = async (postId: number) => {
    setListModal({ postId, kind: 'comments' })
    setListLoading(true)
    setCommenters([])
    const { data } = await supabase
      .from('post_comments')
      .select('author_id, content, created_at, profiles!author_id(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(100)
    setCommenters(((data || []) as any[]).map((c: any) => ({
      author_id: c.author_id,
      content: c.content,
      created_at: c.created_at,
      full_name: c.profiles?.full_name || null,
      avatar_url: c.profiles?.avatar_url || null,
    })))
    setListLoading(false)
  }

  /* ─── Delete / restore ─── */
  const deletePost = async (id: number) => {
    await supabase.from('posts').update({ is_deleted: true }).eq('id', id)
    await fetchPosts(); setSelected(null)
  }
  const restorePost = async (id: number) => {
    await supabase.from('posts').update({ is_deleted: false }).eq('id', id)
    await fetchPosts()
  }

  const filtered = posts.filter(p =>
    !search || (p.content || '').toLowerCase().includes(search.toLowerCase()) || String(p.user_id).includes(search)
  )

  const stats = [
    { label: 'Total Posts', value: posts.length,                                   color: 'text-brand-pink' },
    { label: 'Active',      value: posts.filter(p => !p.is_deleted).length,        color: 'text-emerald-500' },
    { label: 'Deleted',     value: posts.filter(p => p.is_deleted).length,         color: 'text-red-500' },
    { label: 'With Media',  value: posts.filter(p => p.image_url || p.video_url).length, color: 'text-blue-500' },
  ]

  /* ─── Small user pill ─── */
  function UserPill({ authId, userId }: { authId?: string; userId: number }) {
    const inner = (
      <span className={`inline-flex items-center gap-1 font-mono text-xs ${authId ? 'text-brand-pink hover:underline cursor-pointer' : 'dark:text-gray-400 text-gray-500'}`}>
        User #{userId}
        {authId && <ExternalLink className="w-3 h-3" />}
      </span>
    )
    if (!authId) return inner
    return (
      <Link to={`/app/profile/${authId}`} target="_blank" rel="noopener noreferrer">
        {inner}
      </Link>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Content Moderation</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-0.5">Review and moderate posts & stories</p>
        </div>
        <button onClick={fetchPosts} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-200">
            <p className={`font-display font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'text', 'image', 'video'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${typeFilter === t ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-brand-pink" /></div>
        ) : (
          <div className="divide-y dark:divide-white/4 divide-gray-100">
            {filtered.map(p => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`flex items-start gap-4 px-4 py-4 hover:dark:bg-white/2 hover:bg-gray-50 transition-colors ${p.is_deleted ? 'opacity-50' : ''}`}>
                <div className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {p.video_url ? <Video className="w-4 h-4 text-blue-500" /> : p.image_url ? <Image className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4 dark:text-gray-400 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <UserPill authId={authorAuthMap.get(p.user_id)} userId={p.user_id} />
                    {p.is_deleted && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Deleted</span>}
                    <span className="text-[10px] dark:text-gray-600 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm dark:text-gray-300 text-gray-700 line-clamp-2">{p.content || '(media post)'}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {/* Clickable likes count */}
                    <button
                      onClick={() => openLikes(p.id)}
                      className="flex items-center gap-1 text-xs dark:text-gray-500 text-gray-400 hover:text-pink-500 transition-colors"
                      title="See who liked this"
                    >
                      <Heart className="w-3.5 h-3.5" /> {p.likes_count}
                    </button>
                    {/* Clickable comments count */}
                    <button
                      onClick={() => openComments(p.id)}
                      className="flex items-center gap-1 text-xs dark:text-gray-500 text-gray-400 hover:text-violet-400 transition-colors"
                      title="See who commented"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> {p.comments_count}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setSelected(p)} className="p-1.5 rounded-lg hover:dark:bg-white/8 hover:bg-gray-100 transition-colors dark:text-gray-400 text-gray-500 hover:text-brand-pink">
                    <Eye className="w-4 h-4" />
                  </button>
                  {p.is_deleted ? (
                    <button onClick={() => restorePost(p.id)} className="p-1.5 rounded-lg hover:dark:bg-white/8 hover:bg-gray-100 transition-colors text-emerald-500">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => deletePost(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 dark:text-gray-500 text-gray-400 text-sm">No posts found</div>}
          </div>
        )}
      </div>

      {/* ── Post detail modal ── */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">
              <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-4">Post #{selected.id}</h3>
              <div className="space-y-3 mb-5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-400 text-gray-500">Author</span>
                  <UserPill authId={authorAuthMap.get(selected.user_id)} userId={selected.user_id} />
                </div>
                <div className="flex justify-between"><span className="dark:text-gray-400 text-gray-500">Type</span><span className="capitalize dark:text-white text-gray-900">{selected.type}</span></div>
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-400 text-gray-500">Likes</span>
                  <button onClick={() => openLikes(selected.id)} className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 transition-colors font-semibold">
                    <Heart className="w-3.5 h-3.5" /> {selected.likes_count} — view names
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-400 text-gray-500">Comments</span>
                  <button onClick={() => openComments(selected.id)} className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors font-semibold">
                    <MessageCircle className="w-3.5 h-3.5" /> {selected.comments_count} — view names
                  </button>
                </div>
                {selected.content && (
                  <div className="p-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs dark:text-gray-300 text-gray-700">{selected.content}</div>
                )}
                {selected.image_url && <img src={selected.image_url} alt="Post" className="w-full rounded-xl object-cover max-h-48" />}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">Close</button>
                {!selected.is_deleted ? (
                  <button onClick={() => deletePost(selected.id)} className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-bold flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Post
                  </button>
                ) : (
                  <button onClick={() => { restorePost(selected.id); setSelected(null) }} className="flex-1 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-sm font-bold flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Restore Post
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Likes / Comments list modal ── */}
      <AnimatePresence>
        {listModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setListModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm dark:bg-[#1A1228] bg-white rounded-3xl border dark:border-white/8 border-gray-200 shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/8 border-gray-100">
                <div className="flex items-center gap-2">
                  {listModal.kind === 'likes'
                    ? <Heart className="w-4 h-4 text-pink-400" />
                    : <MessageCircle className="w-4 h-4 text-violet-400" />}
                  <h3 className="font-display font-bold text-base dark:text-white text-gray-900">
                    {listModal.kind === 'likes' ? 'Likes & Reactions' : 'Comments'} — Post #{listModal.postId}
                  </h3>
                </div>
                <button onClick={() => setListModal(null)} className="w-7 h-7 rounded-lg hover:dark:bg-white/8 hover:bg-gray-100 flex items-center justify-center dark:text-gray-400 text-gray-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-96 overflow-y-auto divide-y dark:divide-white/5 divide-gray-100">
                {listLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-5 h-5 animate-spin text-brand-pink" />
                  </div>
                ) : listModal.kind === 'likes' ? (
                  reactors.length === 0 ? (
                    <p className="text-center text-sm dark:text-gray-500 text-gray-400 py-10">No likes yet</p>
                  ) : reactors.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-love-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                        {r.avatar_url
                          ? <img src={r.avatar_url} alt={r.full_name || ''} className="w-full h-full object-cover" />
                          : (r.full_name || '?')[0]?.toUpperCase()}
                      </div>
                      <Link to={`/app/profile/${r.user_id}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 min-w-0 hover:text-brand-pink transition-colors">
                        <p className="text-sm font-semibold dark:text-white text-gray-900 truncate">{r.full_name || 'Unknown User'}</p>
                      </Link>
                      <span className="text-lg leading-none flex-shrink-0">{r.emoji || '❤️'}</span>
                    </div>
                  ))
                ) : (
                  commenters.length === 0 ? (
                    <p className="text-center text-sm dark:text-gray-500 text-gray-400 py-10">No comments yet</p>
                  ) : commenters.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-love-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden mt-0.5">
                        {c.avatar_url
                          ? <img src={c.avatar_url} alt={c.full_name || ''} className="w-full h-full object-cover" />
                          : (c.full_name || '?')[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/app/profile/${c.author_id}`} target="_blank" rel="noopener noreferrer"
                          className="hover:text-brand-pink transition-colors">
                          <p className="text-xs font-bold dark:text-white text-gray-900 truncate">{c.full_name || 'Unknown User'}</p>
                        </Link>
                        <p className="text-xs dark:text-gray-400 text-gray-600 mt-0.5 leading-relaxed">{c.content}</p>
                        <p className="text-[10px] dark:text-gray-600 text-gray-400 mt-0.5">{new Date(c.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-5 py-3 border-t dark:border-white/8 border-gray-100">
                <button onClick={() => setListModal(null)}
                  className="w-full py-2.5 rounded-xl text-sm dark:text-gray-400 text-gray-500 hover:text-brand-pink transition-colors font-semibold">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
