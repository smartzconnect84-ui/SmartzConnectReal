import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Calendar, Clock, Heart, TrendingUp, Tag, BookOpen, Loader2, AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  category: string | null
  tags: string[] | null
  featured: boolean
  author_name: string | null
  author_role: string | null
  read_time: string | null
  views_count: number
  likes_count: number
  published_at: string | null
  created_at: string
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setPost({ ...data, tags: Array.isArray(data.tags) ? data.tags : [] })
        supabase
          .from('blog_posts')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', data.id)
          .then(() => {})
      }
      setLoading(false)
    }
    fetchPost()
  }, [slug])

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-[#080510] bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen dark:bg-[#080510] bg-gray-50 text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">Article not found</h1>
        <p className="dark:text-gray-400 text-gray-600 mb-6">This article may have been removed or unpublished.</p>
        <Link to="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/20 hover:opacity-90 transition-opacity">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    )
  }

  const paragraphs = (post.content || '').split('\n').filter(l => l.trim() !== '')

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* Hero / Cover */}
      {post.image_url ? (
        <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/80" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-3xl mx-auto">
            {post.category && (
              <span className="text-xs font-black uppercase tracking-widest text-brand-pink bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full mb-3 inline-block">
                {post.category}
              </span>
            )}
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white leading-tight drop-shadow-lg">
              {post.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="pt-20 pb-8 dark:bg-[#0D0A14] bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {post.category && (
              <span className="text-xs font-black uppercase tracking-widest text-brand-pink bg-love-soft px-2.5 py-1 rounded-full mb-4 inline-block">
                {post.category}
              </span>
            )}
            <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Back + meta row */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <Link to="/blog"
            className="inline-flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600 hover:text-brand-pink transition-colors font-semibold">
            <ArrowLeft className="w-4 h-4" /> Blog
          </Link>
          <div className="flex items-center gap-3 text-xs dark:text-gray-500 text-gray-400 flex-wrap">
            {post.read_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.read_time}</span>}
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {(post.views_count || 0).toLocaleString()} views</span>
            {post.likes_count > 0 && <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count}</span>}
          </div>
        </div>

        {/* Author + date */}
        {(post.author_name || post.published_at || post.created_at) && (
          <div className="flex items-center gap-3 mb-8 pb-8 border-b dark:border-white/8 border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {post.author_name ? post.author_name[0] : '✍️'}
            </div>
            <div>
              {post.author_name && <p className="font-bold text-sm dark:text-white text-gray-900">{post.author_name}</p>}
              <div className="flex items-center gap-2 text-[11px] dark:text-gray-500 text-gray-400 flex-wrap">
                {post.author_role && <span>{post.author_role}</span>}
                {(post.published_at || post.created_at) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {fmt(post.published_at || post.created_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-base sm:text-lg dark:text-gray-300 text-gray-700 leading-relaxed font-medium mb-8 pl-4 border-l-4 border-brand-pink">
            {post.excerpt}
          </motion.p>
        )}

        {/* Body */}
        {paragraphs.length > 0 && (
          <div className="space-y-5 mb-10">
            {paragraphs.map((para, i) => {
              if (para.startsWith('# '))
                return <h2 key={i} className="font-display font-black text-xl sm:text-2xl dark:text-white text-gray-900 mt-8 mb-2">{para.slice(2)}</h2>
              if (para.startsWith('## '))
                return <h3 key={i} className="font-bold text-lg dark:text-white text-gray-900 mt-6 mb-1">{para.slice(3)}</h3>
              if (para.startsWith('### '))
                return <h4 key={i} className="font-semibold text-base dark:text-white text-gray-900 mt-4">{para.slice(4)}</h4>
              if (para.startsWith('- ') || para.startsWith('* '))
                return <li key={i} className="ml-5 text-sm dark:text-gray-300 text-gray-700 leading-relaxed list-disc">{para.slice(2)}</li>
              return (
                <p key={i} className="text-sm sm:text-base dark:text-gray-300 text-gray-700 leading-relaxed">
                  {para}
                </p>
              )
            })}
          </div>
        )}

        {/* Tags */}
        {(post.tags || []).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-8 pt-6 border-t dark:border-white/8 border-gray-200">
            <Tag className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
            {(post.tags || []).map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-xl text-xs font-semibold dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 border dark:border-white/8 border-gray-200">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t dark:border-white/8 border-gray-200">
          <Link to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/20 hover:opacity-90 transition-opacity">
            <ArrowLeft className="w-4 h-4" /> More Articles
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 dark:text-gray-500 text-gray-400" />
            <span className="text-xs dark:text-gray-500 text-gray-400">SmartzConnect Blog</span>
          </div>
        </div>
      </div>
    </div>
  )
}
