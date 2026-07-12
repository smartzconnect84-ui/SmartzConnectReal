import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, MapPin, Plus, Loader2, Link2, RefreshCw, Database, Search, Users, BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { uploadToSufy } from '@/lib/sufy'
import { useOfflineDraft } from '@/lib/offlineDraft'

const categories = ['All', 'Community', 'Business', 'Brand', 'Nonprofit', 'Public Figure', 'Interest Group']

interface PageRow {
  id: string
  name: string
  category: string | null
  description: string | null
  cover_url: string | null
  location: string | null
  followers_count: number
  is_verified: boolean
  owner_id: string
  following: boolean
}

interface NewPage {
  name: string; category: string; description: string; location: string; cover_url: string
}

const emptyForm: NewPage = { name: '', category: 'Community', description: '', location: '', cover_url: '' }

export default function CommunityPagesPage() {
  const { user } = useAuth()
  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<NewPage>(emptyForm)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useOfflineDraft('community-page-composer', form, setForm, { isEmpty: (d: any) => !d?.name?.trim() })

  const fetchPages = async () => {
    setLoading(true)
    let query = supabase
      .from('community_pages')
      .select('id, name, category, description, cover_url, location, followers_count, is_verified, owner_id')
      .eq('is_active', true)
      .order('followers_count', { ascending: false })

    if (activeCategory !== 'All') query = query.eq('category', activeCategory)

    const { data, error } = await query.limit(50)
    if (error) {
      setDbConnected(!error.message?.includes('does not exist'))
      setPages([])
      setLoading(false)
      return
    }
    setDbConnected(true)

    let followingIds = new Set<string>()
    if (user && data?.length) {
      const { data: follows } = await supabase.from('page_followers').select('page_id').eq('user_id', user.id)
      followingIds = new Set((follows || []).map((f: any) => f.page_id))
    }

    setPages((data || []).map((p: any) => ({ ...p, following: followingIds.has(p.id) })))
    setLoading(false)
  }

  useEffect(() => { fetchPages() }, [activeCategory, user?.id])

  const filtered = pages.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await uploadToSufy(file, 'pages')
      setForm(f => ({ ...f, cover_url: url }))
    } catch { /* ignore */ }
    setUploadingImage(false)
  }

  const submitPage = async () => {
    if (!user || !form.name.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('community_pages').insert({
      owner_id: user.id,
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      cover_url: form.cover_url.trim() || null,
      is_active: true,
    })
    setSubmitting(false)
    if (!error) {
      setForm(emptyForm)
      setShowCreate(false)
      fetchPages()
    }
  }

  const toggleFollow = async (p: PageRow) => {
    if (!user) return
    if (p.following) {
      await supabase.from('page_followers').delete().eq('page_id', p.id).eq('user_id', user.id)
      await supabase.from('community_pages').update({ followers_count: Math.max(0, p.followers_count - 1) }).eq('id', p.id)
    } else {
      await supabase.from('page_followers').insert({ page_id: p.id, user_id: user.id })
      await supabase.from('community_pages').update({ followers_count: p.followers_count + 1 }).eq('id', p.id)
    }
    fetchPages()
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50 overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex-shrink-0 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Pages 📄</h1>
            <p className="text-xs dark:text-gray-400 text-gray-500">{dbConnected ? `${filtered.length} pages` : 'Connect database'}</p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-soft border border-pink-500/20 text-brand-pink text-xs font-bold hover:bg-pink-500/10 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            )}
            <button onClick={fetchPages} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-3 overflow-hidden">
              <div className="dark:bg-white/5 bg-gray-50 rounded-2xl border dark:border-white/8 border-gray-200 p-4">
                <p className="text-sm font-bold dark:text-white text-gray-900 mb-3">Create a Page</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input placeholder="Page name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink">
                    {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input placeholder="Location (optional)" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <textarea placeholder="Description (optional)" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink resize-none" />
                  <div className="col-span-2 flex items-center gap-2">
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {form.cover_url && <img src={form.cover_url} alt="preview" className="w-9 h-9 rounded-lg object-cover border dark:border-white/8 border-gray-200 flex-shrink-0" />}
                    <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-[10px] font-semibold dark:text-gray-300 text-gray-700 hover:border-brand-pink/40 transition-colors disabled:opacity-50 whitespace-nowrap">
                      {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                      {uploadingImage ? 'Uploading…' : 'Upload Cover'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-sm dark:text-gray-400 text-gray-600">Cancel</button>
                  <button onClick={submitPage} disabled={submitting || !form.name.trim()}
                    className="flex-1 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-50">
                    {submitting ? 'Creating…' : 'Create Page'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white shadow-sm' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 animate-pulse h-48" />
            ))}
          </div>
        ) : !dbConnected ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl dark:bg-white/5 bg-gray-100 flex items-center justify-center"><Database className="w-8 h-8 dark:text-gray-600 text-gray-400" /></div>
            <div><p className="font-bold dark:text-white text-gray-900 mb-1">Pages not connected</p><p className="text-sm dark:text-gray-400 text-gray-500">Configure Supabase to display pages</p></div>
            <button onClick={fetchPages} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="text-5xl mb-2">📄</div>
            <div><p className="font-bold dark:text-white text-gray-900 mb-1">{search ? 'No results found' : 'No pages yet'}</p><p className="text-sm dark:text-gray-400 text-gray-500">{search ? 'Try a different search term' : 'Be the first to create a page!'}</p></div>
            {user && !search && <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold"><Plus className="w-4 h-4" /> Create a Page</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 hover:shadow-xl hover:shadow-pink-500/10 transition-all">
                <div className="relative h-24 dark:bg-gradient-to-br dark:from-pink-500/10 dark:to-purple-600/10 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden">
                  {p.cover_url ? <img src={p.cover_url} alt={p.name} className="w-full h-full object-cover" /> : <FileText className="w-8 h-8 dark:text-pink-400/40 text-pink-300" />}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-love-gradient text-white text-[9px] font-bold shadow-md">{p.category}</span>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="font-bold text-sm dark:text-white text-gray-900 line-clamp-1">{p.name}</p>
                    {p.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                  </div>
                  {p.description && <p className="text-xs dark:text-gray-400 text-gray-500 mb-2 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-3 text-[10px] dark:text-gray-500 text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.followers_count}</span>
                    {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</span>}
                  </div>
                  {user ? (
                    <button onClick={() => toggleFollow(p)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${p.following ? 'dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-600' : 'bg-love-gradient text-white'}`}>
                      {p.following ? '✓ Following' : 'Follow'}
                    </button>
                  ) : (
                    <p className="text-[10px] dark:text-gray-500 text-gray-400 text-center">Sign in to follow</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
