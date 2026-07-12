import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp,
  Timer, Award, FileText, Video, List, CheckCircle, AlertCircle,
  Loader2, RefreshCw, Eye, EyeOff, GraduationCap, HelpCircle,
  ClipboardList, Settings2, Users, BarChart2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  id: string; title: string; description: string | null; cover_url: string | null
  category: string; level: string; duration_mins: number; pass_score: number
  quiz_timer_secs: number; is_published: boolean; created_at: string
  lesson_count?: number; question_count?: number; attempt_count?: number
}
interface Lesson {
  id: string; course_id: string; title: string; content: string | null
  video_url: string | null; order_index: number; duration_mins: number
}
interface Question {
  id: string; course_id: string; question: string; options: string[]
  correct_index: number; explanation: string | null; order_index: number
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'courses',  label: 'Courses',        icon: BookOpen },
  { id: 'lessons',  label: 'Lessons',        icon: List },
  { id: 'quiz',     label: 'Quiz Builder',   icon: HelpCircle },
  { id: 'timer',    label: 'Timer & Scoring',icon: Timer },
  { id: 'certs',    label: 'Certificates',   icon: Award },
]

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const inp = 'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-pink transition-colors'

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminLearning() {
  const { user } = useAuth()
  const [tab, setTab] = useState('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [certs, setCerts] = useState<any[]>([])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Fetch all courses ──────────────────────────────────────────────────────
  const fetchCourses = async () => {
    setLoading(true)
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
    // Attach counts
    const enriched: Course[] = await Promise.all((data || []).map(async (c: Course) => {
      const [{ count: lc }, { count: qc }, { count: ac }] = await Promise.all([
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', c.id),
        supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('course_id', c.id),
        supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('course_id', c.id),
      ])
      return { ...c, lesson_count: lc ?? 0, question_count: qc ?? 0, attempt_count: ac ?? 0 }
    }))
    setCourses(enriched)
    setLoading(false)
  }

  const fetchLessons = async (courseId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index')
    setLessons(data || [])
  }

  const fetchQuestions = async (courseId: string) => {
    const { data } = await supabase.from('quiz_questions').select('*').eq('course_id', courseId).order('order_index')
    setQuestions(data || [])
  }

  const fetchCerts = async () => {
    const { data } = await supabase
      .from('certificates')
      .select('*, courses(title)')
      .order('issued_at', { ascending: false })
      .limit(100)
    setCerts(data || [])
  }

  useEffect(() => { fetchCourses() }, [])
  useEffect(() => {
    if (selectedCourseId) {
      fetchLessons(selectedCourseId)
      fetchQuestions(selectedCourseId)
    }
  }, [selectedCourseId])
  useEffect(() => { if (tab === 'certs') fetchCerts() }, [tab])

  const selectedCourse = courses.find(c => c.id === selectedCourseId)

  return (
    <div className="p-4 sm:p-6 space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl">Learning Management</h1>
            <p className="text-sm text-white/40">Manage courses, lessons, quizzes & certificates</p>
          </div>
        </div>
        <button onClick={fetchCourses} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <RefreshCw className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${toast.ok ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-2xl p-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${tab === t.id ? 'bg-love-gradient text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── COURSES TAB ────────────────────────────────────────────────────── */}
      {tab === 'courses' && (
        <CoursesPanel
          courses={courses} selectedCourseId={selectedCourseId}
          onSelect={id => { setSelectedCourseId(id); setTab('lessons') }}
          onRefresh={fetchCourses} showToast={showToast} userId={user?.id || ''}
        />
      )}

      {/* ── LESSONS TAB ────────────────────────────────────────────────────── */}
      {tab === 'lessons' && (
        <LessonsPanel
          courses={courses} selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          lessons={lessons} onRefresh={() => selectedCourseId && fetchLessons(selectedCourseId)}
          showToast={showToast}
        />
      )}

      {/* ── QUIZ BUILDER TAB ──────────────────────────────────────────────── */}
      {tab === 'quiz' && (
        <QuizBuilderPanel
          courses={courses} selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          questions={questions} onRefresh={() => selectedCourseId && fetchQuestions(selectedCourseId)}
          showToast={showToast}
        />
      )}

      {/* ── TIMER & SCORING TAB ──────────────────────────────────────────── */}
      {tab === 'timer' && (
        <TimerScoringPanel
          courses={courses} onUpdate={fetchCourses} showToast={showToast}
        />
      )}

      {/* ── CERTIFICATES TAB ─────────────────────────────────────────────── */}
      {tab === 'certs' && (
        <CertificatesPanel certs={certs} onRefresh={fetchCerts} />
      )}
    </div>
  )
}

// ─── Courses panel ────────────────────────────────────────────────────────────
function CoursesPanel({ courses, selectedCourseId, onSelect, onRefresh, showToast, userId }: {
  courses: Course[]; selectedCourseId: string | null
  onSelect: (id: string) => void; onRefresh: () => void
  showToast: (m: string, ok?: boolean) => void; userId: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const empty = { title: '', description: '', category: 'General', level: 'Beginner', duration_mins: 30, pass_score: 70, quiz_timer_secs: 1800, cover_url: '' }
  const [form, setForm] = useState(empty)

  const openCreate = () => { setEditing(null); setForm(empty); setShowForm(true) }
  const openEdit = (c: Course) => {
    setEditing(c)
    setForm({ title: c.title, description: c.description || '', category: c.category, level: c.level, duration_mins: c.duration_mins, pass_score: c.pass_score, quiz_timer_secs: c.quiz_timer_secs, cover_url: c.cover_url || '' })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = { ...form, duration_mins: Number(form.duration_mins), pass_score: Number(form.pass_score), quiz_timer_secs: Number(form.quiz_timer_secs) }
    const { error } = editing
      ? await supabase.from('courses').update(payload).eq('id', editing.id)
      : await supabase.from('courses').insert({ ...payload, created_by: userId })
    setSaving(false)
    if (error) { showToast(error.message, false); return }
    showToast(editing ? 'Course updated!' : 'Course created!')
    setShowForm(false); setEditing(null); onRefresh()
  }

  const togglePublish = async (c: Course) => {
    const { error } = await supabase.from('courses').update({ is_published: !c.is_published }).eq('id', c.id)
    if (!error) { showToast(c.is_published ? 'Course unpublished' : 'Course published!'); onRefresh() }
  }

  const deleteCourse = async (id: string) => {
    if (!confirm('Delete this course and all its lessons/questions?')) return
    await supabase.from('courses').delete().eq('id', id)
    showToast('Course deleted'); onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg">
          <Plus className="w-4 h-4" /> New Course
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{editing ? 'Edit Course' : 'New Course'}</p>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={`${inp} sm:col-span-2`} placeholder="Course title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <textarea className={`${inp} sm:col-span-2`} rows={3} placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <input className={inp} placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              <select className={inp} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input className={inp} placeholder="Cover image URL" value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} />
              <input type="number" className={inp} placeholder="Total duration (mins)" value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: +e.target.value }))} />
              <div>
                <label className="text-xs text-white/40 mb-1 block">Pass score (%)</label>
                <input type="number" min={0} max={100} className={inp} value={form.pass_score} onChange={e => setForm(f => ({ ...f, pass_score: +e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Quiz timer (seconds)</label>
                <input type="number" min={60} className={inp} value={form.quiz_timer_secs} onChange={e => setForm(f => ({ ...f, quiz_timer_secs: +e.target.value }))} />
              </div>
            </div>
            <button onClick={save} disabled={saving || !form.title.trim()}
              className="w-full py-3 rounded-xl bg-love-gradient text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : editing ? 'Update Course' : 'Create Course'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(c => (
          <motion.div key={c.id} layout className="rounded-2xl bg-white/[0.04] border border-white/8 overflow-hidden hover:border-brand-pink/30 transition-all">
            <div className="relative h-28 bg-gradient-to-br from-pink-500/10 to-purple-600/10 flex items-center justify-center overflow-hidden">
              {c.cover_url ? <img src={c.cover_url} alt={c.title} className="w-full h-full object-cover" /> : <BookOpen className="w-10 h-10 text-white/10" />}
              <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.is_published ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/10 text-white/40 border border-white/10'}`}>
                {c.is_published ? 'Live' : 'Draft'}
              </span>
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-bold">{c.level}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white mb-1 line-clamp-1">{c.title}</h3>
              <p className="text-xs text-white/40 mb-3 line-clamp-2">{c.description || 'No description'}</p>
              <div className="flex items-center gap-3 text-[11px] text-white/30 mb-4">
                <span className="flex items-center gap-1"><List className="w-3 h-3" /> {c.lesson_count} lessons</span>
                <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" /> {c.question_count} Qs</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.attempt_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onSelect(c.id)} className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/60 hover:text-white transition-colors text-center">
                  Manage
                </button>
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <Edit3 className="w-3.5 h-3.5 text-white/50" />
                </button>
                <button onClick={() => togglePublish(c)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" title={c.is_published ? 'Unpublish' : 'Publish'}>
                  {c.is_published ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button onClick={() => deleteCourse(c.id)} className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {courses.length === 0 && !false && (
        <div className="text-center py-16 text-white/30">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">No courses yet — create your first one</p>
        </div>
      )}
    </div>
  )
}

// ─── Lessons panel ────────────────────────────────────────────────────────────
function LessonsPanel({ courses, selectedCourseId, setSelectedCourseId, lessons, onRefresh, showToast }: {
  courses: Course[]; selectedCourseId: string | null; setSelectedCourseId: (id: string) => void
  lessons: Lesson[]; onRefresh: () => void; showToast: (m: string, ok?: boolean) => void
}) {
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const empty = { title: '', content: '', video_url: '', duration_mins: 5 }
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)

  const openCreate = () => { setEditId(null); setForm(empty); setShowForm(true) }
  const openEdit = (l: Lesson) => {
    setEditId(l.id); setForm({ title: l.title, content: l.content || '', video_url: l.video_url || '', duration_mins: l.duration_mins }); setShowForm(true)
  }

  const save = async () => {
    if (!selectedCourseId || !form.title.trim()) return
    setSaving(true)
    const payload = { ...form, duration_mins: Number(form.duration_mins), course_id: selectedCourseId, order_index: editId ? undefined : lessons.length }
    const { error } = editId
      ? await supabase.from('lessons').update(payload).eq('id', editId)
      : await supabase.from('lessons').insert(payload)
    setSaving(false)
    if (error) { showToast(error.message, false); return }
    showToast(editId ? 'Lesson updated!' : 'Lesson added!'); setShowForm(false); onRefresh()
  }

  const deleteLesson = async (id: string) => {
    await supabase.from('lessons').delete().eq('id', id)
    showToast('Lesson deleted'); onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select className={`${inp} max-w-xs`} value={selectedCourseId || ''} onChange={e => setSelectedCourseId(e.target.value)}>
          <option value="">Select a course…</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {selectedCourseId && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold">
            <Plus className="w-4 h-4" /> Add Lesson
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && selectedCourseId && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{editId ? 'Edit Lesson' : 'New Lesson'}</p>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-white/40" /></button>
            </div>
            <input className={inp} placeholder="Lesson title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <textarea className={`${inp}`} rows={6} placeholder="Lesson content / text (supports Markdown-like text)" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            <input className={inp} placeholder="Video URL (optional)" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
            <input type="number" className={inp} placeholder="Duration (mins)" min={1} value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: +e.target.value }))} />
            <button onClick={save} disabled={saving || !form.title.trim()}
              className="w-full py-3 rounded-xl bg-love-gradient text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : editId ? 'Update Lesson' : 'Add Lesson'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedCourseId ? (
        <div className="text-center py-12 text-white/30"><List className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>Select a course first</p></div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12 text-white/30"><List className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No lessons yet — add the first one</p></div>
      ) : (
        <div className="space-y-2">
          {lessons.map((l, i) => (
            <div key={l.id} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-brand-pink/20 transition-all">
              <div className="w-7 h-7 rounded-lg bg-love-gradient flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{l.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-white/30 mt-0.5">
                  {l.video_url && <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video</span>}
                  {l.content && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Text</span>}
                  <span>{l.duration_mins}m</span>
                </div>
              </div>
              <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Edit3 className="w-3.5 h-3.5 text-white/40" />
              </button>
              <button onClick={() => deleteLesson(l.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Quiz builder panel ───────────────────────────────────────────────────────
function QuizBuilderPanel({ courses, selectedCourseId, setSelectedCourseId, questions, onRefresh, showToast }: {
  courses: Course[]; selectedCourseId: string | null; setSelectedCourseId: (id: string) => void
  questions: Question[]; onRefresh: () => void; showToast: (m: string, ok?: boolean) => void
}) {
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const emptyQ = { question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' }
  const [form, setForm] = useState(emptyQ)

  const openCreate = () => { setEditId(null); setForm(emptyQ); setShowForm(true) }
  const openEdit = (q: Question) => {
    setEditId(q.id)
    const opts = [...q.options]
    while (opts.length < 4) opts.push('')
    setForm({ question: q.question, options: opts, correct_index: q.correct_index, explanation: q.explanation || '' })
    setShowForm(true)
  }

  const updateOption = (i: number, val: string) => setForm(f => { const o = [...f.options]; o[i] = val; return { ...f, options: o } })

  const save = async () => {
    if (!selectedCourseId || !form.question.trim()) return
    const opts = form.options.filter(o => o.trim())
    if (opts.length < 2) { showToast('Need at least 2 options', false); return }
    setSaving(true)
    const payload = { question: form.question, options: opts, correct_index: form.correct_index, explanation: form.explanation || null, course_id: selectedCourseId, order_index: editId ? undefined : questions.length }
    const { error } = editId
      ? await supabase.from('quiz_questions').update(payload).eq('id', editId)
      : await supabase.from('quiz_questions').insert(payload)
    setSaving(false)
    if (error) { showToast(error.message, false); return }
    showToast(editId ? 'Question updated!' : 'Question added!'); setShowForm(false); onRefresh()
  }

  const deleteQ = async (id: string) => {
    await supabase.from('quiz_questions').delete().eq('id', id)
    showToast('Question deleted'); onRefresh()
  }

  const LETTERS = ['A', 'B', 'C', 'D']

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select className={`${inp} max-w-xs`} value={selectedCourseId || ''} onChange={e => setSelectedCourseId(e.target.value)}>
          <option value="">Select a course…</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {selectedCourseId && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && selectedCourseId && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{editId ? 'Edit Question' : 'New Question'}</p>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-white/40" /></button>
            </div>
            <textarea className={inp} rows={3} placeholder="Question text *" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
            <div className="space-y-2">
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wide">Answer Options</p>
              {form.options.map((o, i) => (
                <div key={i} className="flex items-center gap-3">
                  <button onClick={() => setForm(f => ({ ...f, correct_index: i }))}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 transition-all ${form.correct_index === i ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/10 text-white/30 hover:border-white/30'}`}>
                    {LETTERS[i]}
                  </button>
                  <input className={`${inp} flex-1`} placeholder={`Option ${LETTERS[i]}`} value={o} onChange={e => updateOption(i, e.target.value)} />
                </div>
              ))}
              <p className="text-[11px] text-white/30">Click a letter to mark the correct answer</p>
            </div>
            <input className={inp} placeholder="Explanation (shown after answering, optional)" value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
            <button onClick={save} disabled={saving || !form.question.trim()}
              className="w-full py-3 rounded-xl bg-love-gradient text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : editId ? 'Update Question' : 'Add Question'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedCourseId ? (
        <div className="text-center py-12 text-white/30"><HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>Select a course first</p></div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-white/30"><HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No questions yet — add your first one</p></div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/8 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-love-gradient flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm mb-2">{q.question}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {q.options.map((o, oi) => (
                      <div key={oi} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${oi === q.correct_index ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                        <span className="font-bold">{LETTERS[oi]}.</span> {o}
                      </div>
                    ))}
                  </div>
                  {q.explanation && <p className="text-[11px] text-white/30 mt-2 italic">💡 {q.explanation}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10"><Edit3 className="w-3.5 h-3.5 text-white/40" /></button>
                  <button onClick={() => deleteQ(q.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Timer & Scoring panel ────────────────────────────────────────────────────
function TimerScoringPanel({ courses, onUpdate, showToast }: {
  courses: Course[]; onUpdate: () => void; showToast: (m: string, ok?: boolean) => void
}) {
  const [saving, setSaving] = useState<string | null>(null)
  const [localVals, setLocalVals] = useState<Record<string, { quiz_timer_secs: number; pass_score: number }>>({})

  const getVal = (c: Course) => localVals[c.id] || { quiz_timer_secs: c.quiz_timer_secs, pass_score: c.pass_score }

  const saveSettings = async (c: Course) => {
    setSaving(c.id)
    const vals = getVal(c)
    const { error } = await supabase.from('courses').update({ quiz_timer_secs: vals.quiz_timer_secs, pass_score: vals.pass_score }).eq('id', c.id)
    setSaving(null)
    if (error) { showToast(error.message, false); return }
    showToast(`"${c.title}" settings saved!`); onUpdate()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/40">Configure quiz timer and pass score per course. Timer starts when student begins the quiz.</p>
      {courses.length === 0 ? (
        <div className="text-center py-12 text-white/30"><Settings2 className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>Create a course first</p></div>
      ) : (
        <div className="space-y-3">
          {courses.map(c => {
            const vals = getVal(c)
            const mins = Math.floor(vals.quiz_timer_secs / 60)
            const secs = vals.quiz_timer_secs % 60
            return (
              <div key={c.id} className="p-5 rounded-2xl bg-white/[0.04] border border-white/8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-love-gradient flex items-center justify-center flex-shrink-0">
                    <Timer className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{c.title}</p>
                    <p className="text-xs text-white/30">{c.category} · {c.level}</p>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${c.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/30'}`}>
                    {c.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-semibold">Timer — Minutes</label>
                    <input type="number" min={0} max={300} className={inp} value={mins}
                      onChange={e => setLocalVals(v => ({ ...v, [c.id]: { ...getVal(c), quiz_timer_secs: (+e.target.value * 60) + secs } }))} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-semibold">Timer — Seconds</label>
                    <input type="number" min={0} max={59} className={inp} value={secs}
                      onChange={e => setLocalVals(v => ({ ...v, [c.id]: { ...getVal(c), quiz_timer_secs: (mins * 60) + +e.target.value } }))} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-semibold">Pass Score (%)</label>
                    <input type="number" min={0} max={100} className={inp} value={vals.pass_score}
                      onChange={e => setLocalVals(v => ({ ...v, [c.id]: { ...getVal(c), pass_score: +e.target.value } }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/30">
                    ⏱ <strong className="text-white/50">{Math.floor(vals.quiz_timer_secs / 60)}m {vals.quiz_timer_secs % 60}s</strong> total quiz time &nbsp;·&nbsp;
                    Pass at <strong className="text-white/50">{vals.pass_score}%</strong>
                  </p>
                  <button onClick={() => saveSettings(c)} disabled={saving === c.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-50">
                    {saving === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Certificates panel ───────────────────────────────────────────────────────
function CertificatesPanel({ certs, onRefresh }: { certs: any[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = certs.filter(c =>
    !search || c.recipient_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.certificate_code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{certs.length} certificate{certs.length !== 1 ? 's' : ''} issued</p>
        <button onClick={onRefresh} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <RefreshCw className="w-4 h-4 text-white/40" />
        </button>
      </div>
      <input className={inp} placeholder="Search by name, email, or code…" value={search} onChange={e => setSearch(e.target.value)} />
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30"><Award className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No certificates yet</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8">
              <div className="w-9 h-9 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{c.recipient_name}</p>
                <p className="text-xs text-white/40">{c.email} · {c.courses?.title || 'Unknown course'}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-bold text-emerald-400">{c.score}%</span>
                <span className="px-2 py-0.5 rounded-full bg-white/8 text-[10px] font-mono text-white/40">{c.certificate_code}</span>
                <span className="text-[11px] text-white/20">{new Date(c.issued_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
