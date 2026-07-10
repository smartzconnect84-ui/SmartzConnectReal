import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Calendar, Clock, ArrowRight, TrendingUp, BookOpen, Heart, RefreshCw, Sparkles, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const categories = ['All', 'Product', 'Dating Tips', 'Tech', 'Culture', 'Business', 'SmartzTV', 'Community']

interface Post {
  id: string; slug?: string; category?: string; featured?: boolean
  title: string; excerpt?: string; author?: string; author_emoji?: string
  author_role?: string; date?: string; read_time?: string; tags?: string[]
  views?: string; likes?: number; image_url?: string
}

interface ActiveAd {
  id: string
  title: string
  image_url: string | null
  target_url: string | null
  advertiser: string
}

/* ── shared spring ─────────────────────────────────────────────────────── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } as const,
})

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const cardV: Variants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring', stiffness: 200, damping: 22 } },
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeAds, setActiveAds] = useState<ActiveAd[]>([])

  // Fetch active ad campaigns to display in the blog sidebar/banner
  useEffect(() => {
    supabase
      .from('ad_campaigns')
      .select('id, title, image_url, target_url, advertiser')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setActiveAds(data as ActiveAd[])
      })
  }, [])

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
      setPosts((data || []).map((p: any) => ({
        id:          String(p.id),
        slug:        p.slug || p.id,
        category:    p.category || 'General',
        featured:    p.featured,
        title:       p.title,
        excerpt:     p.excerpt,
        author:      p.author_name,
        author_role: p.author_role,
        date:        p.created_at ? new Date(p.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
        read_time:   p.read_time || '5 min read',
        tags:        p.tags || [],
        views:       p.views_count ? `${(p.views_count / 1000).toFixed(1)}K` : '0',
        likes:       p.likes_count || 0,
        image_url:   p.image_url,
      })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const featured  = posts.find(p => p.featured) || posts[0]
  const filtered  = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    return matchSearch && matchCat && p.id !== featured?.id
  })

  return (
    <div className="min-h-screen" style={{ background: '#080510' }}>

      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden pt-16 sm:pt-20">
        {/* Glassmorphic hero bg */}
        <div className="relative py-20 sm:py-28 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f0720 0%, #0d0518 50%, #160930 100%)' }}>
          {/* Glow orbs */}
          <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.22, 0.12] }} transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[320px] rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
          <motion.div animate={{ x: [0, 20, 0], opacity: [0.08, 0.14, 0.08] }} transition={{ duration: 11, repeat: Infinity }}
            className="absolute top-0 right-1/4 w-56 h-56 rounded-full bg-pink-500/12 blur-2xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <motion.div {...up(0)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <BookOpen className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-semibold text-white">SmartzConnect Blog</span>
            </motion.div>

            <motion.h1 {...up(0.08)} className="font-display font-black text-3xl sm:text-5xl text-white mb-4 leading-tight">
              Stories, Tips &amp;{' '}
              <span style={{ background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Insights
              </span>
            </motion.h1>

            <motion.p {...up(0.14)} className="text-base text-white/60 mb-8 max-w-xl mx-auto">
              Product updates, dating tips, creator stories, tech deep-dives, and everything happening across the SmartzConnect ecosystem.
            </motion.p>

            {/* Search — glassmorphic */}
            <motion.div {...up(0.2)} className="relative max-w-md w-full mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white placeholder:text-white/35 focus:outline-none text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}
                onFocus={e => (e.currentTarget.style.border = '1px solid rgba(168,85,247,0.55)')}
                onBlur={e  => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.14)')}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Live Ad Banner (from ad_campaigns table) ── */}
      {activeAds.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className={`grid gap-4 ${activeAds.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {activeAds.slice(0, 2).map(ad => (
              ad.image_url ? (
                <motion.div key={ad.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden border border-white/8 shadow-lg">
                  {ad.target_url ? (
                    <a href={ad.target_url} target="_blank" rel="noreferrer" className="block relative group">
                      <img src={ad.image_url} alt={ad.title} className="w-full object-cover max-h-48 group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-bold">
                        <ExternalLink className="w-2.5 h-2.5" /> Sponsored
                      </div>
                    </a>
                  ) : (
                    <div className="relative">
                      <img src={ad.image_url} alt={ad.title} className="w-full object-cover max-h-48" />
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-bold">Sponsored</div>
                    </div>
                  )}
                </motion.div>
              ) : null
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* Category filter — glassmorphic pills */}
        <motion.div {...up(0)} className="flex gap-2 overflow-x-auto pb-2 mb-10 scrollbar-hide">
          {categories.map((cat, i) => (
            <motion.button key={cat} onClick={() => setActiveCategory(cat)}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeCategory === cat
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              }`}
              style={activeCategory === cat ? {
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              } : {
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {cat}
            </motion.button>
          ))}
          <motion.button onClick={fetchPosts} whileHover={{ scale: 1.1, rotate: 180 }} transition={{ duration: 0.4 }}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500" />
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-sm text-white/40">
              Loading articles…
            </motion.p>
          </div>
        )}

        {/* ── Not connected ── */}
        <AnimatePresence>
          {!loading && !dbConnected && (
            <motion.div {...up()} className="flex flex-col items-center justify-center py-24 gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <BookOpen className="w-7 h-7 text-white/30" />
              </div>
              <div>
                <p className="font-bold text-xl text-white mb-2">Blog not connected</p>
                <p className="text-sm text-white/40 max-w-sm">Configure Supabase and create a <code className="text-purple-400">blog_posts</code> table to publish articles here.</p>
              </div>
              <motion.button onClick={fetchPosts} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}>
                <RefreshCw className="w-4 h-4" /> Retry
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── No posts ── */}
        {!loading && dbConnected && posts.length === 0 && (
          <motion.div {...up()} className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Sparkles className="w-7 h-7 text-purple-400/60" />
            </motion.div>
            <div>
              <p className="font-bold text-xl text-white mb-2">No articles yet</p>
              <p className="text-sm text-white/40">Check back soon — stories are on the way!</p>
            </div>
          </motion.div>
        )}

        {/* ── Featured post ── */}
        <AnimatePresence>
          {!loading && dbConnected && featured && activeCategory === 'All' && !search && (
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: 'spring', stiffness: 160 }}
              className="mb-10 overflow-hidden group cursor-pointer rounded-3xl"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 8px 40px rgba(0,0,0,0.30)' }}
            >
              <Link to={`/blog/${featured.slug}`} className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="h-52 sm:h-auto sm:w-72 flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(168,85,247,0.08)' }}>
                  {featured.image_url ? (
                    <motion.img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover"
                      whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }} />
                  ) : (
                    <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}>
                      <BookOpen className="w-16 h-16 text-purple-500/30" />
                    </motion.div>
                  )}
                </div>

                <div className="flex-1 p-7 sm:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-300 px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}>⭐ Featured</span>
                    {featured.category && (
                      <span className="text-xs font-bold text-pink-300 px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.22)' }}>{featured.category}</span>
                    )}
                  </div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-white mb-3 leading-tight group-hover:text-purple-300 transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-white/50 leading-relaxed mb-5 text-sm sm:text-base line-clamp-3">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 mb-5">
                    {featured.author && (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                          {featured.author[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{featured.author}</p>
                          {featured.author_role && <p className="text-[10px] text-white/40">{featured.author_role}</p>}
                        </div>
                      </div>
                    )}
                    {featured.date && <span className="text-xs text-white/40 flex items-center gap-1"><Calendar className="w-3 h-3" /> {featured.date}</span>}
                    {featured.read_time && <span className="text-xs text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {featured.read_time}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.span whileHover={{ x: 4 }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)', boxShadow: '0 4px 16px rgba(124,58,237,0.30)' }}>
                      Read Article <ArrowRight className="w-4 h-4" />
                    </motion.span>
                    {featured.views && <span className="text-xs text-white/30">{featured.views} views · {featured.likes} likes</span>}
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Post grid ── */}
        {!loading && dbConnected && filtered.length > 0 && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(post => (
              <motion.article key={post.id} variants={cardV}>
                <Link to={`/blog/${post.slug}`} className="block h-full group cursor-pointer rounded-2xl overflow-hidden transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.07)' }}>

                  {/* Thumbnail */}
                  <div className="h-40 overflow-hidden flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.06)' }}>
                    {post.image_url ? (
                      <motion.img src={post.image_url} alt={post.title} className="w-full h-full object-cover"
                        whileHover={{ scale: 1.07 }} transition={{ duration: 0.5 }} />
                    ) : (
                      <BookOpen className="w-10 h-10 text-purple-500/25" />
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {post.category && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.18)' }}>
                          {post.category}
                        </span>
                      )}
                      {post.read_time && (
                        <span className="text-[10px] text-white/35 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {post.read_time}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-white leading-snug mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-xs text-white/40 leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/6">
                      <div className="flex items-center gap-2">
                        {post.author && (
                          <>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                              {post.author[0]}
                            </div>
                            <span className="text-xs text-white/40">{post.author.split(' ')[0]}</span>
                          </>
                        )}
                        {post.date && <span className="text-[10px] text-white/25">{post.date.split(',')[0]}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/30">
                        {post.views && <span className="flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> {post.views}</span>}
                        {post.likes !== undefined && <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {post.likes}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </motion.div>
        )}

        {/* No search results */}
        {!loading && dbConnected && filtered.length === 0 && search && (
          <motion.div {...up()} className="text-center py-20">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-white/40">No articles found for &quot;{search}&quot;</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
