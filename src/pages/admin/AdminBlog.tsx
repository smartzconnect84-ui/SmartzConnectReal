import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Edit, Trash2, X, RefreshCw, Eye, Star, Globe,
  FileText, Archive, CheckCircle, AlertCircle, Loader2, Search,
  Calendar, Clock, Heart, TrendingUp, Tag, ChevronDown, Image,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BlogPost {
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
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_at: string
}

type Filter = 'all' | 'published' | 'draft' | 'archived'
type PostStatus = 'draft' | 'published' | 'archived'

interface FormState {
  title: string
  slug: string
  excerpt: string
  content: string
  image_url: string
  category: string
  tags: string
  featured: boolean
  author_name: string
  author_role: string
  read_time: string
  status: PostStatus
}

const CATEGORIES = ['General', 'Product', 'Dating Tips', 'Tech', 'Culture', 'Business', 'SmartzTV', 'Community']

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image_url: '',
  category: 'General',
  tags: '',
  featured: false,
  author_name: '',
  author_role: '',
  read_time: '5 min read',
  status: 'draft',
}

function toSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<BlogPost | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<BlogPost | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [dbError, setDbError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setDbError(null)
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, image_url, category, tags, featured, author_name, author_role, read_time, views_count, likes_count, status, published_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setDbError(error.message)
      setPosts([])
    } else {
      setPosts((data || []).map((p: any) => ({
        ...p,
        views_count: p.views_count || 0,
        likes_count: p.likes_count || 0,
        tags: Array.isArray(p.tags) ? p.tags : [],
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (p: BlogPost) => {
    setEditTarget(p)
    setForm({
      title:       p.title,
      slug:        p.slug,
      excerpt:     p.excerpt || '',
      content:     p.content || '',
      image_url:   p.image_url || '',
      category:    p.category || 'General',
      tags:        (p.tags || []).join(', '),
      featured:    p.featured,
      author_name: p.author_name || '',
      author_role: p.author_role || '',
      read_time:   p.read_time || '5 min read',
      status:      p.status,
    })
    setShowForm(true)
  }

  const handleTitleChange = (val: string) => {
    setForm(prev => ({
      ...prev,
      title: val,
      slug: prev.slug === '' || prev.slug === toSlug(prev.title) ? toSlug(val) : prev.slug,
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Title is required.', false); return }
    if (!form.slug.trim())  { showToast('Slug is required.', false); return }
    setSaving(true)

    const payload: Record<string, any> = {
      title:       form.title.trim(),
      slug:        form.slug.trim(),
      excerpt:     form.excerpt.trim() || null,
      content:     form.content.trim() || null,
      image_url:   form.image_url.trim() || null,
      category:    form.category,
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      featured:    form.featured,
      author_name: form.author_name.trim() || null,
      author_role: form.author_role.trim() || null,
      read_time:   form.read_time.trim() || '5 min read',
      status:      form.status,
      published_at: form.status === 'published' ? (editTarget?.published_at || new Date().toISOString()) : null,
    }

    let error
    if (editTarget) {
      ;({ error } = await supabase.from('blog_posts').update(payload).eq('id', editTarget.id))
    } else {
      ;({ error } = await supabase.from('blog_posts').insert(payload))
    }

    if (error) {
      showToast(error.message, false)
    } else {
      showToast(editTarget ? 'Post updated.' : 'Post created.')
      setShowForm(false)
      fetchPosts()
    }
    setSaving(false)
  }

  const handleToggleStatus = async (p: BlogPost) => {
    const next = p.status === 'published' ? 'draft' : 'published'
    const { error } = await supabase
      .from('blog_posts')
      .update({
        status: next,
        published_at: next === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', p.id)
    if (error) { showToast(error.message, false) } else {
      showToast(next === 'published' ? 'Post published — live on /blog!' : 'Post moved to draft.')
      fetchPosts()
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', confirmDelete.id)
    if (error) { showToast(error.message, false) } else {
      showToast('Post deleted.')
      setConfirmDelete(null)
      fetchPosts()
    }
  }

  const filtered = posts.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const stats = [
    { label: 'Total Posts',  value: posts.length,                               color: 'from-pink-500 to-rose-600',    icon: BookOpen },
    { label: 'Published',    value: posts.filter(p => p.status === 'published').length, color: 'from-emerald-500 to-teal-600', icon: Globe },
    { label: 'Drafts',       value: posts.filter(p => p.status === 'draft').length,     color: 'from-amber-500 to-orange-600', icon: FileText },
    { label: 'Total Views',  value: posts.reduce((s, p) => s + p.views_count, 0),       color: 'from-purple-500 to-violet-600',icon: TrendingUp },
  ]

  const inp = "w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-xs font-semibold dark:text-gray-300 text-gray-700 mb-1.5 block">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Blog Manager</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">
            Write, publish and manage articles on <span className="dark:text-white text-gray-900 font-semibold">/blog</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPosts} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <a href="/blog" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-100 text-xs font-semibold dark:text-gray-300 text-gray-700 hover:text-brand-pink transition-colors">
            <Eye className="w-3.5 h-3.5" /> View Blog
          </a>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" /> New Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="font-display font-black text-2xl dark:text-white text-gray-900">{s.value.toLocaleString()}</p>
              <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* DB Error */}
      {dbError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-400 text-sm mb-0.5">Database error</p>
            <p className="text-xs dark:text-gray-400 text-gray-600">{dbError}</p>
            <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">Run <code className="font-mono bg-amber-500/10 px-1 rounded">supabase/RUN_IN_SUPABASE.sql</code> to create or fix the blog_posts table.</p>
          </div>
        </div>
      )}

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors" />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft', 'archived'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Post list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-pink" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200">
            <BookOpen className="w-8 h-8 dark:text-gray-600 text-gray-300 mx-auto mb-3" />
            <p className="text-sm dark:text-gray-500 text-gray-400 mb-3">No posts yet</p>
            <button onClick={openAdd} className="text-xs text-brand-pink font-semibold hover:underline">+ Write your first article</button>
          </div>
        ) : (
          filtered.map((post, i) => (
            <motion.div key={post.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 hover:border-pink-500/20 transition-all">
              <div className="flex items-start gap-4">

                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                  {post.image_url
                    ? <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                    : <Image className="w-5 h-5 dark:text-gray-600 text-gray-300" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          post.status === 'published' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                          : post.status === 'draft' ? 'bg-amber-500/15 text-amber-500 border-amber-500/25'
                          : 'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-500 dark:border-white/10 border-gray-200'
                        }`}>
                          {post.status === 'published' ? '● Live' : post.status === 'draft' ? '◐ Draft' : '○ Archived'}
                        </span>
                        {post.featured && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                            <Star className="w-2.5 h-2.5" /> Featured
                          </span>
                        )}
                        {post.category && (
                          <span className="text-[10px] font-bold text-brand-pink bg-love-soft px-2 py-0.5 rounded-full">{post.category}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm dark:text-white text-gray-900 line-clamp-1">{post.title}</h3>
                      {post.excerpt && <p className="text-xs dark:text-gray-400 text-gray-500 line-clamp-2 mt-0.5">{post.excerpt}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[10px] dark:text-gray-500 text-gray-400 flex-wrap">
                        {post.author_name && <span className="font-medium dark:text-gray-400 text-gray-600">{post.author_name}</span>}
                        <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {fmt(post.created_at)}</span>
                        {post.read_time && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {post.read_time}</span>}
                        {post.views_count > 0 && <span className="flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> {post.views_count.toLocaleString()} views</span>}
                        {post.likes_count > 0 && <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" /> {post.likes_count}</span>}
                        <span className="font-mono dark:text-gray-600 text-gray-300">/blog/{post.slug}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(post)} title="Edit"
                        className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                        <Edit className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
                      </button>
                      <button onClick={() => handleToggleStatus(post)} title={post.status === 'published' ? 'Move to Draft' : 'Publish'}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          post.status === 'published'
                            ? 'dark:bg-emerald-500/10 bg-emerald-50 text-emerald-500 hover:bg-amber-500/10 hover:text-amber-500'
                            : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-500 hover:bg-emerald-500/10 hover:text-emerald-500'
                        }`}>
                        {post.status === 'published' ? <Globe className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setConfirmDelete(post)} title="Delete"
                        className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl dark:bg-[#1A1228] bg-white rounded-3xl border dark:border-white/8 border-gray-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b dark:border-white/6 border-gray-200 flex-shrink-0">
                <div>
                  <h3 className="font-display font-black text-lg dark:text-white text-gray-900">
                    {editTarget ? 'Edit Post' : 'New Blog Post'}
                  </h3>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
                    Published posts appear immediately on <span className="font-mono">/blog</span>
                  </p>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">

                <Field label="Title *">
                  <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                    placeholder="e.g. How SmartzConnect is connecting Africa" className={inp} />
                </Field>

                <Field label="URL Slug *">
                  <div className="flex items-center gap-2">
                    <span className="text-xs dark:text-gray-500 text-gray-400 whitespace-nowrap">/blog/</span>
                    <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                      placeholder="auto-generated-from-title" className={`${inp} font-mono`} />
                  </div>
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Category">
                    <div className="relative">
                      <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                        className={`${inp} appearance-none pr-8`}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Read Time">
                    <input value={form.read_time} onChange={e => setForm(p => ({ ...p, read_time: e.target.value }))}
                      placeholder="5 min read" className={inp} />
                  </Field>
                </div>

                <Field label="Excerpt (shown in post cards)">
                  <textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
                    rows={2} placeholder="Brief description of this article…" className={`${inp} resize-none`} />
                </Field>

                <Field label="Content (full article body — supports plain text or Markdown)">
                  <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                    rows={8} placeholder="Write your full article here…" className={`${inp} resize-y font-mono text-[11px]`} />
                </Field>

                <Field label="Cover Image URL">
                  <div className="flex gap-2">
                    <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                      placeholder="https://..." className={inp} />
                    {form.image_url && (
                      <img src={form.image_url} alt="preview" className="w-12 h-10 rounded-lg object-cover flex-shrink-0 border dark:border-white/10 border-gray-200" />
                    )}
                  </div>
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Author Name">
                    <input value={form.author_name} onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))}
                      placeholder="Shedrick K. Nungehn" className={inp} />
                  </Field>
                  <Field label="Author Role">
                    <input value={form.author_role} onChange={e => setForm(p => ({ ...p, author_role: e.target.value }))}
                      placeholder="Founder & CEO" className={inp} />
                  </Field>
                </div>

                <Field label="Tags (comma separated)">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400 flex-shrink-0" />
                    <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                      placeholder="Africa, Dating, Social, Tech" className={inp} />
                  </div>
                </Field>

                {/* Status + Featured toggles */}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div>
                    <label className="text-xs font-semibold dark:text-gray-300 text-gray-700 block mb-2">Status</label>
                    <div className="flex gap-2">
                      {(['draft', 'published', 'archived'] as const).map(s => (
                        <button key={s} type="button" onClick={() => setForm(p => ({ ...p, status: s }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${form.status === s
                            ? s === 'published' ? 'bg-emerald-500 text-white' : s === 'archived' ? 'dark:bg-white/15 bg-gray-200 dark:text-white text-gray-900' : 'bg-amber-500 text-white'
                            : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <button type="button" onClick={() => setForm(p => ({ ...p, featured: !p.featured }))}
                      className={`w-9 h-5 rounded-full transition-colors relative ${form.featured ? 'bg-amber-500' : 'dark:bg-white/20 bg-gray-200'}`}>
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: form.featured ? '18px' : '2px' }} />
                    </button>
                    <span className="text-xs font-semibold dark:text-gray-300 text-gray-700">
                      {form.featured ? '⭐ Featured (shown at top)' : 'Regular post'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t dark:border-white/6 border-gray-200 flex-shrink-0">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><CheckCircle className="w-4 h-4" /> {form.status === 'published' ? 'Publish Post' : 'Save Draft'}</>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-display font-black text-lg dark:text-white text-gray-900 mb-1">Delete Post?</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-5">
                "<span className="font-semibold dark:text-white text-gray-900">{confirmDelete.title}</span>" will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">Cancel</button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-bold hover:bg-red-500/20 transition-colors">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer note */}
      <div className="flex flex-wrap gap-4 text-xs dark:text-gray-500 text-gray-400 pt-2">
        <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Published posts go live instantly at <code className="font-mono dark:bg-white/5 bg-gray-100 px-1 rounded">/blog</code></span>
        <span className="flex items-center gap-1.5"><Archive className="w-3.5 h-3.5" /> Drafts are only visible in this panel</span>
        <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Featured post is shown first, enlarged, on the blog page</span>
      </div>
    </div>
  )
}
