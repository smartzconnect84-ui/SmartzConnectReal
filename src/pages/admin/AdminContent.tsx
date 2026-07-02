import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Search, Eye, Trash2, CheckCircle, Image, Video, FileText } from 'lucide-react'
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

export default function AdminContent() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState<Post | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    let q = supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (typeFilter !== 'all') q = q.eq('type', typeFilter)
    const { data } = await q.limit(100)
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [typeFilter])

  const deletePost = async (id: number) => {
    await supabase.from('posts').update({ is_deleted: true }).eq('id', id)
    await fetchPosts()
    setSelected(null)
  }

  const restorePost = async (id: number) => {
    await supabase.from('posts').update({ is_deleted: false }).eq('id', id)
    await fetchPosts()
  }

  const filtered = posts.filter(p =>
    !search || (p.content || '').toLowerCase().includes(search.toLowerCase()) || String(p.user_id).includes(search)
  )

  const stats = [
    { label: 'Total Posts', value: posts.length, color: 'text-brand-pink' },
    { label: 'Active', value: posts.filter(p => !p.is_deleted).length, color: 'text-emerald-500' },
    { label: 'Deleted', value: posts.filter(p => p.is_deleted).length, color: 'text-red-500' },
    { label: 'With Media', value: posts.filter(p => p.image_url || p.video_url).length, color: 'text-blue-500' },
  ]

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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono dark:text-gray-400 text-gray-500">User #{p.user_id}</span>
                    {p.is_deleted && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Deleted</span>}
                    <span className="text-[10px] dark:text-gray-600 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm dark:text-gray-300 text-gray-700 line-clamp-2">{p.content || '(media post)'}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs dark:text-gray-500 text-gray-400">
                    <span>❤️ {p.likes_count}</span>
                    <span>💬 {p.comments_count}</span>
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

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">
            <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-4">Post #{selected.id}</h3>
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between"><span className="dark:text-gray-400 text-gray-500">Author</span><span className="font-mono dark:text-white text-gray-900">User #{selected.user_id}</span></div>
              <div className="flex justify-between"><span className="dark:text-gray-400 text-gray-500">Type</span><span className="capitalize dark:text-white text-gray-900">{selected.type}</span></div>
              <div className="flex justify-between"><span className="dark:text-gray-400 text-gray-500">Likes</span><span className="dark:text-white text-gray-900">{selected.likes_count}</span></div>
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
    </div>
  )
}
