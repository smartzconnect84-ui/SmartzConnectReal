import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Calendar, Clock, ArrowRight, TrendingUp, BookOpen, Heart, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const categories = ['All', 'Product', 'Dating Tips', 'Tech', 'Culture', 'Business', 'SmartzTV', 'Community']

interface Post {
  id: string
  slug?: string
  category?: string
  featured?: boolean
  title: string
  excerpt?: string
  author?: string
  author_emoji?: string
  author_role?: string
  date?: string
  read_time?: string
  tags?: string[]
  views?: string
  likes?: number
  image_url?: string
}

export default function BlogPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const fetchPosts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, excerpt, category, featured, author_name, author_role, created_at, read_time, tags, views_count, likes_count, image_url, slug, status')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      setDbConnected(false)
      setPosts([])
    } else {
      setDbConnected(true)
      const mapped: Post[] = (data || []).map((p: any) => ({
        id: String(p.id),
        slug: p.slug || p.id,
        category: p.category || 'General',
        featured: p.featured,
        title: p.title,
        excerpt: p.excerpt,
        author: p.author_name,
        author_role: p.author_role,
        date: p.created_at ? new Date(p.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
        read_time: p.read_time || '5 min read',
        tags: p.tags || [],
        views: p.views_count ? `${(p.views_count / 1000).toFixed(1)}K` : '0',
        likes: p.likes_count || 0,
        image_url: p.image_url,
      }))
      setPosts(mapped)
    }
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const featured = posts.find(p => p.featured) || posts[0]
  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    return matchSearch && matchCat && p.id !== featured?.id
  })

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden pt-16 sm:pt-20">
        <div className="relative bg-gradient-to-br from-[#100820] via-[#0d0518] to-[#160930] py-16 sm:py-24">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-purple-600/15 blur-3xl" />
            <div className="absolute top-0 right-1/4 w-48 h-48 rounded-full bg-pink-500/10 blur-2xl" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
              <BookOpen className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-semibold text-white">SmartzConnect Blog</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-white mb-4 leading-tight">
              Stories, Tips &amp; Insights
            </h1>
            <p className="text-base text-white/70 mb-7 max-w-xl mx-auto">
              Product updates, dating tips, creator stories, tech deep-dives, and everything happening across the SmartzConnect ecosystem.
            </p>
            <div className="relative max-w-md w-full mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === cat
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-purple-500'
              }`}>
              {cat}
            </button>
          ))}
          <button onClick={fetchPosts}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 hover:text-purple-500 transition-colors">
            <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-500" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
            <p className="text-sm dark:text-gray-400 text-gray-500">Loading articles…</p>
          </div>
        )}

        {/* Not connected */}
        {!loading && !dbConnected && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 flex items-center justify-center">
              <BookOpen className="w-7 h-7 dark:text-gray-500 text-gray-400" />
            </div>
            <div>
              <p className="font-bold text-xl dark:text-white text-gray-900 mb-2">Blog not connected</p>
              <p className="text-sm dark:text-gray-400 text-gray-500 max-w-sm">
                Configure Supabase and create a <code className="text-purple-400">blog_posts</code> table to publish articles here.
              </p>
            </div>
            <button onClick={fetchPosts}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Connected, no posts */}
        {!loading && dbConnected && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 flex items-center justify-center">
              <BookOpen className="w-7 h-7 dark:text-gray-500 text-gray-400" />
            </div>
            <div>
              <p className="font-bold text-xl dark:text-white text-gray-900 mb-2">No articles yet</p>
              <p className="text-sm dark:text-gray-400 text-gray-500">Check back soon — stories are on the way!</p>
            </div>
          </div>
        )}

        {/* Featured post */}
        {!loading && dbConnected && featured && activeCategory === 'All' && !search && (
          <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-100 shadow-xl shadow-purple-500/5 mb-8 overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
            <div className="flex flex-col sm:flex-row">
              <div className="h-48 sm:h-auto sm:w-64 flex-shrink-0 overflow-hidden dark:bg-[#1a1230] bg-purple-50 flex items-center justify-center">
                {featured.image_url ? (
                  <img src={featured.image_url} alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <BookOpen className="w-16 h-16 dark:text-purple-500/30 text-purple-200" />
                )}
              </div>
              <div className="flex-1 p-7 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">⭐ Featured</span>
                  {featured.category && (
                    <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full">{featured.category}</span>
                  )}
                </div>
                <h2 className="font-display font-black text-xl sm:text-2xl dark:text-white text-gray-900 mb-3 leading-tight group-hover:text-purple-400 transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="dark:text-gray-400 text-gray-600 leading-relaxed mb-5 text-sm sm:text-base line-clamp-3">{featured.excerpt}</p>
                )}
                <div className="flex items-center gap-4 mb-5">
                  {featured.author && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {featured.author[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold dark:text-white text-gray-900">{featured.author}</p>
                        {featured.author_role && <p className="text-[10px] dark:text-gray-500 text-gray-400">{featured.author_role}</p>}
                      </div>
                    </div>
                  )}
                  {featured.date && (
                    <span className="text-xs dark:text-gray-500 text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {featured.date}
                    </span>
                  )}
                  {featured.read_time && (
                    <span className="text-xs dark:text-gray-500 text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {featured.read_time}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/blog/${featured.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-90 transition-opacity">
                    Read Article <ArrowRight className="w-4 h-4" />
                  </Link>
                  {featured.views && (
                    <span className="text-xs dark:text-gray-500 text-gray-400">{featured.views} views · {featured.likes} likes</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Post grid */}
        {!loading && dbConnected && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((post, i) => (
              <motion.article key={post.id}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.06 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 overflow-hidden hover:shadow-xl hover:border-purple-500/20 transition-all group cursor-pointer">

                {/* Thumbnail */}
                <div className="h-36 overflow-hidden dark:bg-[#1a1230] bg-purple-50 flex items-center justify-center">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <BookOpen className="w-10 h-10 dark:text-purple-500/30 text-purple-200" />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {post.category && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                        {post.category}
                      </span>
                    )}
                    {post.read_time && (
                      <span className="text-[10px] dark:text-gray-500 text-gray-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {post.read_time}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm dark:text-white text-gray-900 leading-snug mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs dark:text-gray-400 text-gray-600 leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t dark:border-white/5 border-gray-100">
                    <div className="flex items-center gap-2">
                      {post.author && (
                        <>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold">
                            {post.author[0]}
                          </div>
                          <span className="text-xs dark:text-gray-400 text-gray-500">{post.author.split(' ')[0]}</span>
                        </>
                      )}
                      {post.date && (
                        <span className="text-[10px] dark:text-gray-600 text-gray-400">{post.date.split(',')[0]}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] dark:text-gray-500 text-gray-400">
                      {post.views && <span className="flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> {post.views}</span>}
                      {post.likes !== undefined && <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {post.likes}</span>}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {!loading && dbConnected && filtered.length === 0 && search && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📝</p>
            <p className="dark:text-gray-400 text-gray-500">No articles found for &quot;{search}&quot;</p>
          </div>
        )}
      </div>
    </div>
  )
}
