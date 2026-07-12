import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Loader2, Link2, RefreshCw, Database, Search,
  ExternalLink, Bookmark, Clock, Eye, GraduationCap, Play,
  ChevronRight, Star, Trophy, Filter, FileText, DollarSign
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { uploadToSufy } from '@/lib/sufy'
import { useOfflineDraft } from '@/lib/offlineDraft'
import { useNavigate } from 'react-router-dom'

const resourceTypes = ['All', 'Article', 'Video', 'Course', 'Ebook', 'Podcast']

interface ResourceRow {
  id: string; title: string; description: string | null; category: string | null
  resource_type: string; resource_url: string | null; cover_url: string | null
  duration_mins: number | null; views_count: number; author_id: string; author?: string; saved: boolean
}

interface CourseRow {
  id: string; title: string; description: string | null; cover_url: string | null
  category: string; level: string; duration_mins: number; pass_score: number; quiz_timer_secs: number
  lesson_count?: number; question_count?: number
  application_cost?: number; currency?: string; application_enabled?: boolean
}

interface NewResource {
  title: string; description: string; category: string; resource_type: string
  resource_url: string; cover_url: string; duration_mins: string
}

const emptyForm: NewResource = {
  title: '', description: '', category: 'General', resource_type: 'Article',
  resource_url: '', cover_url: '', duration_mins: '',
}

const LEVEL_COLOR: Record<string, string> = {
  Beginner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Advanced: 'text-red-400 bg-red-500/10 border-red-500/20',
}

type ViewMode = 'courses' | 'resources'

export default function LearningPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('courses')

  // Courses state
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesConnected, setCoursesConnected] = useState(false)

  // Resources state
  const [resources, setResources] = useState<ResourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<NewResource>(emptyForm)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useOfflineDraft('learning-composer', form, setForm, { isEmpty: (d: any) => !d?.title?.trim() })

  // ── Fetch courses ───────────────────────────────────────────────────────────
  const fetchCourses = async () => {
    setCoursesLoading(true)
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, cover_url, category, level, duration_mins, pass_score, quiz_timer_secs, application_cost, currency, application_enabled')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) { setCoursesConnected(false); setCoursesLoading(false); return }
    setCoursesConnected(true)

    // Get lesson/question counts
    const enriched = await Promise.all((data || []).map(async (c: CourseRow) => {
      const [{ count: lc }, { count: qc }] = await Promise.all([
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', c.id),
        supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('course_id', c.id),
      ])
      return { ...c, lesson_count: lc ?? 0, question_count: qc ?? 0 }
    }))
    setCourses(enriched)
    setCoursesLoading(false)
  }

  // ── Fetch resources ─────────────────────────────────────────────────────────
  const fetchResources = async () => {
    setLoading(true)
    let query = supabase
      .from('learning_resources')
      .select('id, title, description, category, resource_type, resource_url, cover_url, duration_mins, views_count, author_id, profiles:author_id(full_name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (activeType !== 'All') query = query.eq('resource_type', activeType)
    const { data, error } = await query.limit(50)
    if (error) { setDbConnected(!error.message?.includes('does not exist')); setResources([]); setLoading(false); return }
    setDbConnected(true)
    let savedIds = new Set<string>()
    if (user && data?.length) {
      const { data: saves } = await supabase.from('learning_saves').select('resource_id').eq('user_id', user.id)
      savedIds = new Set((saves || []).map((s: any) => s.resource_id))
    }
    setResources((data || []).map((r: any) => ({
      id: r.id, title: r.title, description: r.description, category: r.category,
      resource_type: r.resource_type, resource_url: r.resource_url, cover_url: r.cover_url,
      duration_mins: r.duration_mins, views_count: r.views_count ?? 0, author_id: r.author_id,
      author: r.profiles?.full_name || 'Member', saved: savedIds.has(r.id),
    })))
    setLoading(false)
  }

  useEffect(() => { fetchCourses() }, [])
  useEffect(() => { fetchResources() }, [activeType, user?.id])

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try { const url = await uploadToSufy(file, 'learning'); setForm(f => ({ ...f, cover_url: url })) }
    catch { /* ignore */ }
    setUploadingImage(false)
  }

  const submitResource = async () => {
    if (!user || !form.title.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('learning_resources').insert({
      author_id: user.id, title: form.title.trim(), description: form.description.trim() || null,
      category: form.category.trim() || 'General', resource_type: form.resource_type,
      resource_url: form.resource_url.trim() || null, cover_url: form.cover_url.trim() || null,
      duration_mins: form.duration_mins ? parseInt(form.duration_mins, 10) : null, is_active: true,
    })
    setSubmitting(false)
    if (!error) { setForm(emptyForm); setShowCreate(false); fetchResources() }
  }

  const openResource = async (r: ResourceRow) => {
    await supabase.from('learning_resources').update({ views_count: r.views_count + 1 }).eq('id', r.id)
    if (r.resource_url) window.open(r.resource_url, '_blank', 'noopener')
  }

  const toggleSave = async (r: ResourceRow) => {
    if (!user) return
    if (r.saved) await supabase.from('learning_saves').delete().eq('resource_id', r.id).eq('user_id', user.id)
    else await supabase.from('learning_saves').insert({ resource_id: r.id, user_id: user.id })
    fetchResources()
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Learning 📚</h1>
            <p className="text-xs dark:text-gray-400 text-gray-500">
              {viewMode === 'courses' ? `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''}` : `${filtered.length} resources`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user && viewMode === 'resources' && (
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-soft border border-pink-500/20 text-brand-pink text-xs font-bold hover:bg-pink-500/10 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Share
              </button>
            )}
            <button onClick={() => viewMode === 'courses' ? fetchCourses() : fetchResources()}
              className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-3">
          {[
            { id: 'courses' as ViewMode, label: 'Courses', icon: GraduationCap },
            { id: 'resources' as ViewMode, label: 'Resources', icon: BookOpen },
          ].map(v => {
            const Icon = v.icon
            return (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === v.id ? 'bg-love-gradient text-white shadow-sm' : 'dark:text-gray-500 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <Icon className="w-3.5 h-3.5" /> {v.label}
              </button>
            )
          })}
        </div>

        {/* Create resource form */}
        <AnimatePresence>
          {showCreate && viewMode === 'resources' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-3 overflow-hidden">
              <div className="dark:bg-white/5 bg-gray-50 rounded-2xl border dark:border-white/8 border-gray-200 p-4">
                <p className="text-sm font-bold dark:text-white text-gray-900 mb-3">Share a Resource</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <select value={form.resource_type} onChange={e => setForm(f => ({ ...f, resource_type: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink">
                    {resourceTypes.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <input placeholder="Link / URL" value={form.resource_url} onChange={e => setForm(f => ({ ...f, resource_url: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <input placeholder="Duration (mins, optional)" type="number" min="0" value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: e.target.value }))}
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
                  <button onClick={submitResource} disabled={submitting || !form.title.trim()}
                    className="flex-1 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-50">
                    {submitting ? 'Sharing…' : 'Share Resource'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics, categories..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors" />
        </div>

        {viewMode === 'resources' && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {resourceTypes.map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeType === t ? 'bg-love-gradient text-white shadow-sm' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
        {/* ── COURSES VIEW ────────────────────────────────────────────────── */}
        {viewMode === 'courses' && (
          coursesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 animate-pulse h-56" />
              ))}
            </div>
          ) : !coursesConnected || courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 dark:text-gray-600 text-gray-400" />
              </div>
              <div>
                <p className="font-bold dark:text-white text-gray-900 mb-1">
                  {coursesConnected ? 'No courses available yet' : 'Connect database to see courses'}
                </p>
                <p className="text-sm dark:text-gray-400 text-gray-500">
                  {coursesConnected ? 'Check back soon — courses are being added.' : 'Configure Supabase schema to enable courses.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Featured course banner */}
              {filteredCourses[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/app/course/${filteredCourses[0].id}`)}>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-600/20 dark:from-pink-500/30 dark:to-purple-600/30" />
                  {filteredCourses[0].cover_url && (
                    <img src={filteredCourses[0].cover_url} alt={filteredCourses[0].title}
                      className="absolute inset-0 w-full h-full object-cover opacity-30" />
                  )}
                  <div className="relative p-6 dark:bg-[#130E1E]/60 bg-white/60 backdrop-blur-sm border dark:border-white/6 border-pink-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-brand-pink" />
                      <span className="text-xs font-bold text-brand-pink">Featured Course</span>
                    </div>
                    <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-1 group-hover:text-brand-pink transition-colors">
                      {filteredCourses[0].title}
                    </h3>
                    {filteredCourses[0].description && (
                      <p className="text-sm dark:text-gray-400 text-gray-600 mb-3 line-clamp-2">{filteredCourses[0].description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${LEVEL_COLOR[filteredCourses[0].level] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                        {filteredCourses[0].level}
                      </span>
                      {filteredCourses[0].lesson_count ? <span className="text-xs dark:text-gray-400 text-gray-500">{filteredCourses[0].lesson_count} lessons</span> : null}
                      {filteredCourses[0].question_count ? <span className="text-xs dark:text-gray-400 text-gray-500">{filteredCourses[0].question_count} quiz questions</span> : null}
                      {filteredCourses[0].application_enabled && (
                        <button onClick={e => { e.stopPropagation(); navigate(`/learning/apply/${filteredCourses[0].id}`) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors">
                          <FileText className="w-3 h-3" /> Apply
                        </button>
                      )}
                      <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold">
                        <Play className="w-3 h-3" /> Start Course
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Course grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCourses.slice(1).map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/app/course/${c.id}`)}
                    className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 hover:shadow-xl hover:shadow-pink-500/10 transition-all group cursor-pointer">
                    <div className="relative h-28 dark:bg-gradient-to-br dark:from-pink-500/10 dark:to-purple-600/10 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden">
                      {c.cover_url ? <img src={c.cover_url} alt={c.title} className="w-full h-full object-cover" /> : <GraduationCap className="w-8 h-8 dark:text-pink-400/40 text-pink-300" />}
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold border ${LEVEL_COLOR[c.level] || ''}`}>{c.level}</span>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-4 h-4 text-brand-pink ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-sm dark:text-white text-gray-900 mb-1 line-clamp-2 group-hover:text-brand-pink transition-colors">{c.title}</p>
                      <div className="flex items-center gap-2 text-[10px] dark:text-gray-500 text-gray-400 mb-2">
                        {c.category && <span>{c.category}</span>}
                        {c.lesson_count ? <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" /> {c.lesson_count}</span> : null}
                        {c.duration_mins ? <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {c.duration_mins}m</span> : null}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] dark:text-gray-500 text-gray-400">Pass: {c.pass_score}%</span>
                        <div className="flex items-center gap-1">
                          {c.application_enabled && (
                            <button onClick={e => { e.stopPropagation(); navigate(`/learning/apply/${c.id}`) }}
                              className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors px-1.5 py-0.5 rounded-lg bg-amber-500/10">
                              <FileText className="w-2.5 h-2.5" /> Apply
                            </button>
                          )}
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-brand-pink">
                            <ChevronRight className="w-3 h-3" /> Start
                          </div>
                        </div>
                      </div>
                      {c.application_cost != null && c.application_cost > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 mt-1">
                          <DollarSign className="w-2.5 h-2.5" /> {c.application_cost} {c.currency || 'USD'} fee
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        )}

        {/* ── RESOURCES VIEW ──────────────────────────────────────────────── */}
        {viewMode === 'resources' && (
          loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 animate-pulse h-52" />
              ))}
            </div>
          ) : !dbConnected ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl dark:bg-white/5 bg-gray-100 flex items-center justify-center"><Database className="w-8 h-8 dark:text-gray-600 text-gray-400" /></div>
              <div><p className="font-bold dark:text-white text-gray-900 mb-1">Learning not connected</p><p className="text-sm dark:text-gray-400 text-gray-500">Configure Supabase to display resources</p></div>
              <button onClick={fetchResources} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold"><RefreshCw className="w-4 h-4" /> Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="text-5xl mb-2">📚</div>
              <div><p className="font-bold dark:text-white text-gray-900 mb-1">{search ? 'No results found' : 'No resources yet'}</p><p className="text-sm dark:text-gray-400 text-gray-500">{search ? 'Try a different search term' : 'Be the first to share something!'}</p></div>
              {user && !search && <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold"><Plus className="w-4 h-4" /> Share a Resource</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 hover:shadow-xl hover:shadow-pink-500/10 transition-all group">
                  <div onClick={() => openResource(r)} className="relative h-28 dark:bg-gradient-to-br dark:from-pink-500/10 dark:to-purple-600/10 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden cursor-pointer">
                    {r.cover_url ? <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" /> : <BookOpen className="w-8 h-8 dark:text-pink-400/40 text-pink-300" />}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-love-gradient text-white text-[9px] font-bold shadow-md">{r.resource_type}</span>
                    {user && (
                      <button onClick={e => { e.stopPropagation(); toggleSave(r) }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full dark:bg-black/30 bg-white/80 flex items-center justify-center shadow-md">
                        <Bookmark className={`w-3.5 h-3.5 transition-colors ${r.saved ? 'fill-brand-pink text-brand-pink' : 'dark:text-gray-400 text-gray-500'}`} />
                      </button>
                    )}
                  </div>
                  <div className="p-3 cursor-pointer" onClick={() => openResource(r)}>
                    <p className="font-bold text-sm dark:text-white text-gray-900 mb-1 line-clamp-2 group-hover:text-brand-pink transition-colors">{r.title}</p>
                    <div className="flex items-center gap-2 text-[10px] dark:text-gray-500 text-gray-400 mb-1">
                      {r.category && <span>{r.category}</span>}
                      {r.duration_mins && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {r.duration_mins}m</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate">By {r.author}</p>
                      <span className="flex items-center gap-0.5 text-[10px] dark:text-gray-500 text-gray-400"><Eye className="w-3 h-3" /> {r.views_count}</span>
                    </div>
                    {r.resource_url && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-brand-pink"><ExternalLink className="w-3 h-3" /> Open</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
