import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus, X, FileText, Image, Play, Radio, Users, Calendar,
  ShoppingBag, BookOpen, Send, Upload, Loader2, Globe, Lock,
  MapPin, DollarSign, Tag, ChevronRight, CheckCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToSufy } from '@/lib/sufy'
import { useAuth } from '@/hooks/useAuth'

/* ──────────────── types ──────────────── */
type ActiveModal = null | 'post' | 'group' | 'event' | 'listing'

const CATEGORIES = ['Dating', 'Business', 'Tech', 'Music', 'Sports', 'Art', 'Gaming', 'Study', 'Faith', 'Travel', 'Food', 'Fashion']
const CATEGORY_EMOJIS: Record<string, string> = {
  Dating:'💕', Business:'💼', Tech:'💻', Music:'🎵', Sports:'⚽',
  Art:'🎨', Gaming:'🎮', Study:'📚', Faith:'🙏', Travel:'✈️', Food:'🍜', Fashion:'👗',
}
const LISTING_CATS = ['Fashion', 'Electronics', 'Food', 'Beauty', 'Vehicles', 'Real Estate', 'Services', 'Books', 'Sports', 'Arts', 'Other']

/* ──────────────── helper ──────────────── */
function ModalShell({ title, subtitle, onClose, children }: {
  title: string; subtitle: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full sm:max-w-lg dark:bg-[#130E1E] bg-white rounded-t-3xl sm:rounded-3xl border dark:border-white/8 border-gray-200 shadow-2xl shadow-black/50 flex flex-col max-h-[90dvh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100 flex-shrink-0">
          <div>
            <p className="font-bold dark:text-white text-gray-900">{title}</p>
            <p className="text-[11px] dark:text-gray-500 text-gray-400 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl dark:bg-white/6 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors">
            <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </motion.div>
    </motion.div>
  )
}

function SuccessBadge({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
      </div>
      <p className="font-bold dark:text-white text-gray-900 text-lg">{label}</p>
      <p className="text-sm dark:text-gray-400 text-gray-500">Published successfully!</p>
    </div>
  )
}

/* ──────────────── Post Modal ──────────────── */
function PostModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!text.trim() || !user) return
    setSubmitting(true)
    const { error } = await supabase.from('posts').insert({
      content: text.trim(),
      author_id: user.id,
      visibility,
    })
    setSubmitting(false)
    if (!error) { setDone(true); setTimeout(onClose, 1800) }
  }

  return (
    <ModalShell title="Create Post" subtitle="Share something with your community" onClose={onClose}>
      {done ? <SuccessBadge label="Post Published!" /> : (
        <div className="p-5 space-y-4">
          {/* Textarea */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What's on your mind? Share thoughts, news, ideas… ✨"
            rows={5}
            className="w-full px-4 py-3 rounded-2xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm resize-none focus:outline-none focus:border-brand-pink transition-colors placeholder:dark:text-gray-600 placeholder:text-gray-400"
          />

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <span className="text-xs dark:text-gray-500 text-gray-400 font-semibold">Visible to:</span>
            {(['public', 'friends'] as const).map(v => (
              <button key={v} onClick={() => setVisibility(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${visibility === v ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                {v === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {v === 'public' ? 'Everyone' : 'Friends'}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className={`text-xs font-semibold ${text.length > 900 ? 'text-red-400' : 'dark:text-gray-600 text-gray-400'}`}>{text.length}/1000</span>
            <button
              onClick={submit}
              disabled={!text.trim() || submitting || text.length > 1000}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-all shadow-lg shadow-pink-500/25"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Posting…' : 'Post Now'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

/* ──────────────── Group Modal ──────────────── */
function GroupModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', topic: '', category: 'Dating', type: 'public' as 'public' | 'private', emoji: '💕' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim() || !user) return
    setSubmitting(true); setError('')
    const { error: err } = await supabase.from('group_rooms').insert({
      name: form.name.trim(),
      description: form.topic.trim() || null,
      category: form.category,
      type: form.type,
      emoji: CATEGORY_EMOJIS[form.category] || '💬',
      created_by: user.id,
      member_count: 1,
    })
    setSubmitting(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => { onClose(); navigate('/app/groups') }, 1500)
  }

  return (
    <ModalShell title="Create Group" subtitle="Build a community around shared interests" onClose={onClose}>
      {done ? <SuccessBadge label="Group Created!" /> : (
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Group Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Monrovia Dating Vibes"
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
          </div>
          <div>
            <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Topic / Description</label>
            <input value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="What is this group about?"
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors">
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Privacy</label>
              <div className="flex gap-2 h-[42px]">
                {(['public', 'private'] as const).map(t => (
                  <button key={t} onClick={() => set('type', t)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all ${form.type === t ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600'}`}>
                    {t === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {t === 'public' ? 'Public' : 'Private'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={submit} disabled={!form.name.trim() || submitting}
            className="w-full py-3 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {submitting ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      )}
    </ModalShell>
  )
}

/* ──────────────── Event Modal ──────────────── */
function EventModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', description: '', location: '', date: '', time: '', price: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim() || !form.date || !user) return
    setSubmitting(true); setError('')
    const eventContent = `📅 EVENT: ${form.title}\n📍 ${form.location || 'TBD'}\n🗓️ ${form.date}${form.time ? ' at ' + form.time : ''}\n${form.price ? '💰 ' + form.price : '🎉 Free entry'}\n\n${form.description}`
    const { error: err } = await supabase.from('posts').insert({
      content: eventContent.trim(),
      author_id: user.id,
      visibility: 'public',
      type: 'event',
    })
    setSubmitting(false)
    if (err) { setError(err.message); return }
    setDone(true); setTimeout(onClose, 1800)
  }

  return (
    <ModalShell title="Create Event" subtitle="Organize something amazing for your community" onClose={onClose}>
      {done ? <SuccessBadge label="Event Published!" /> : (
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Event Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Monrovia Tech Meetup 2026"
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
          </div>
          <div>
            <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Tell people what to expect…"
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm resize-none focus:outline-none focus:border-brand-pink transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Time</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5"><MapPin className="w-3 h-3 inline mr-1" />Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Venue or Online"
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5"><DollarSign className="w-3 h-3 inline mr-1" />Ticket Price</label>
              <input value={form.price} onChange={e => set('price', e.target.value)} placeholder="Free or $5"
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={submit} disabled={!form.title.trim() || !form.date || submitting}
            className="w-full py-3 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {submitting ? 'Publishing…' : 'Publish Event'}
          </button>
        </div>
      )}
    </ModalShell>
  )
}

/* ──────────────── Listing Modal ──────────────── */
function ListingModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', price: '', category: 'Fashion', description: '', location: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return
    setUploading(true)
    try {
      const publicUrl = await uploadToSufy(file, 'marketplace')
      setImageUrl(publicUrl)
    } catch (err: any) {
      setError(err?.message || 'Image upload failed. Please try again.')
    }
    setUploading(false)
  }

  const submit = async () => {
    if (!form.name.trim() || !form.price || !user) return
    setSubmitting(true); setError('')
    const { error: err } = await supabase.from('marketplace_items').insert({
      seller_id: user.id,
      title: form.name.trim(),
      price: parseFloat(form.price),
      category: form.category,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      images: imageUrl ? [imageUrl] : [],
      is_active: true,
    })
    setSubmitting(false)
    if (err) { setError(err.message); return }
    setDone(true); setTimeout(onClose, 1800)
  }

  return (
    <ModalShell title="Post a Listing" subtitle="List your product on the SmartzConnect Marketplace" onClose={onClose}>
      {done ? <SuccessBadge label="Listing Published!" /> : (
        <div className="p-5 space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Product Photo</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            {imageUrl
              ? <div className="relative w-full h-32 rounded-xl overflow-hidden">
                  <img src={imageUrl} className="w-full h-full object-cover" />
                  <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white"><X className="w-3 h-3" /></button>
                </div>
              : <button onClick={() => fileRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed dark:border-white/10 border-gray-200 flex flex-col items-center justify-center gap-2 dark:text-gray-500 text-gray-400 hover:border-brand-pink hover:text-brand-pink transition-all">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-xs font-semibold">Upload Photo</span></>}
                </button>
            }
          </div>

          <div>
            <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Product Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. iPhone 14 Pro — Excellent"
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5"><DollarSign className="w-3 h-3 inline mr-0.5" />Price (USD) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" min="0"
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5"><Tag className="w-3 h-3 inline mr-0.5" />Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors">
                {LISTING_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Condition, details, why you're selling…"
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm resize-none focus:outline-none focus:border-brand-pink transition-colors" />
          </div>
          <div>
            <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-1.5"><MapPin className="w-3 h-3 inline mr-1" />Your Location</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Monrovia, Liberia"
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink transition-colors" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={submit} disabled={!form.name.trim() || !form.price || submitting}
            className="w-full py-3 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
            {submitting ? 'Posting…' : 'Post Listing'}
          </button>
        </div>
      )}
    </ModalShell>
  )
}

/* ──────────────── Story Modal (tabbed: Photo/Video + Text Story) ──────────────── */
const TEXT_STORY_BG_OPTIONS = [
  { value: 'from-pink-500 to-rose-600',    label: 'Rose'   },
  { value: 'from-violet-500 to-purple-600', label: 'Violet' },
  { value: 'from-blue-500 to-cyan-600',    label: 'Ocean'  },
  { value: 'from-amber-500 to-orange-600', label: 'Sunset' },
  { value: 'from-emerald-500 to-teal-600', label: 'Forest' },
  { value: 'from-slate-700 to-slate-900',  label: 'Dark'   },
]

interface MentionResult { id: string; full_name: string }

function StoryModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'media' | 'text'>('media')

  // Media tab state
  const [uploading, setUploading] = useState(false)
  const [mediaDone, setMediaDone] = useState(false)
  const [error, setError] = useState('')

  // Text story state
  const [textContent, setTextContent] = useState('')
  const [selectedBg, setSelectedBg] = useState(TEXT_STORY_BG_OPTIONS[0].value)
  const [textDone, setTextDone] = useState(false)
  const [submittingText, setSubmittingText] = useState(false)
  const [textError, setTextError] = useState('')

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([])
  const [mentions, setMentions] = useState<MentionResult[]>([])

  // Fetch mention suggestions whenever mentionQuery changes
  useEffect(() => {
    if (!mentionQuery) { setMentionResults([]); return }
    let cancelled = false
    supabase.from('profiles').select('id,full_name').ilike('full_name', `%${mentionQuery}%`).limit(5)
      .then(({ data }) => { if (!cancelled) setMentionResults((data as MentionResult[]) ?? []) })
    return () => { cancelled = true }
  }, [mentionQuery])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setTextContent(val)
    // Detect @query at cursor
    const words = val.split(/\s/)
    const lastWord = words[words.length - 1]
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1))
    } else {
      setMentionQuery(null)
    }
  }

  const handleMentionSelect = (m: MentionResult) => {
    // Replace trailing @query with @Name
    const words = textContent.split(/(\s)/)
    const idx = words.length - 1
    if (words[idx].startsWith('@')) {
      words[idx] = `@${m.full_name}`
    }
    setTextContent(words.join(''))
    setMentions(prev => [...prev.filter(x => x.id !== m.id), m])
    setMentionQuery(null)
    setMentionResults([])
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return
    setUploading(true); setError('')
    let publicUrl: string
    try {
      publicUrl = await uploadToSufy(file, 'stories')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
      return
    }
    const { error: insertErr } = await supabase.from('stories').insert({
      author_id: user.id,
      user_id: user.id,
      media_url: publicUrl,
      media_type: file.type.startsWith('video/') ? 'video' : 'image',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    setUploading(false)
    if (insertErr) { setError(insertErr.message); return }
    setMediaDone(true); setTimeout(onClose, 1800)
  }

  const handleTextSubmit = async () => {
    if (!textContent.trim() || !user) return
    setSubmittingText(true); setTextError('')
    const { error: err } = await supabase.from('stories').insert({
      author_id: user.id,
      user_id: user.id,
      media_url: '',
      media_type: 'text',
      text_content: textContent.trim(),
      bg_color: selectedBg,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    })
    setSubmittingText(false)
    if (err) { setTextError(err.message); return }
    setTextDone(true); setTimeout(onClose, 1800)
  }

  const done = mediaDone || textDone

  return (
    <ModalShell title="Add Story" subtitle="Share a moment — disappears in 24 hours" onClose={onClose}>
      {done ? <SuccessBadge label="Story Posted!" /> : (
        <div className="p-5 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl dark:bg-white/5 bg-gray-100">
            {(['media', 'text'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? 'bg-love-gradient text-white shadow-sm' : 'dark:text-gray-400 text-gray-500'}`}>
                {t === 'media' ? '📷 Photo / Video' : '✏️ Text Story'}
              </button>
            ))}
          </div>

          {tab === 'media' ? (
            <>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full h-48 rounded-2xl border-2 border-dashed dark:border-white/10 border-gray-200 flex flex-col items-center justify-center gap-3 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all group">
                {uploading
                  ? <><Loader2 className="w-8 h-8 animate-spin text-brand-pink" /><p className="text-sm font-semibold dark:text-white text-gray-900">Uploading your story…</p></>
                  : <>
                      <div className="w-14 h-14 rounded-2xl bg-love-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Image className="w-7 h-7 text-brand-pink" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold dark:text-white text-gray-900">Choose Photo or Video</p>
                        <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">Up to 50MB · Disappears in 24h</p>
                      </div>
                    </>}
              </button>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </>
          ) : (
            <>
              {/* Live preview */}
              <div className={`w-full h-44 rounded-2xl bg-gradient-to-br ${selectedBg} flex items-center justify-center p-6`}>
                <p className="text-white text-center font-bold text-lg leading-snug break-words">
                  {textContent || 'Your story text here…'}
                </p>
              </div>

              {/* Textarea with mention support */}
              <div className="relative">
                <textarea
                  value={textContent}
                  onChange={handleTextChange}
                  placeholder="What's on your mind? Type @ to mention someone…"
                  rows={3}
                  maxLength={200}
                  className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink resize-none transition-colors"
                />
                <span className={`absolute bottom-2 right-3 text-[10px] font-semibold ${textContent.length > 180 ? 'text-red-400' : 'dark:text-gray-600 text-gray-400'}`}>
                  {textContent.length}/200
                </span>

                {/* Mention dropdown */}
                {mentionResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 dark:bg-[#1A1428] bg-white border dark:border-white/10 border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    {mentionResults.map(m => (
                      <button key={m.id} type="button"
                        onMouseDown={e => { e.preventDefault(); handleMentionSelect(m) }}
                        className="w-full text-left px-3 py-2 text-sm dark:text-white text-gray-900 dark:hover:bg-white/8 hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-love-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {m.full_name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                        <span>{m.full_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Background color picker */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider">Background</p>
                <div className="flex gap-2">
                  {TEXT_STORY_BG_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setSelectedBg(opt.value)}
                      title={opt.label}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${opt.value} flex-shrink-0 transition-transform ${selectedBg === opt.value ? 'scale-125 ring-2 ring-white ring-offset-2 dark:ring-offset-[#130E1E] ring-offset-white' : 'hover:scale-110'}`}
                    />
                  ))}
                </div>
              </div>

              {textError && <p className="text-xs text-red-400">{textError}</p>}

              <button onClick={handleTextSubmit} disabled={!textContent.trim() || submittingText}
                className="w-full py-3 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25">
                {submittingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submittingText ? 'Posting…' : 'Share Text Story'}
              </button>
            </>
          )}
        </div>
      )}
    </ModalShell>
  )
}

/* ──────────────── Main CreateModal ──────────────── */
const createOptions = [
  { icon: FileText,    label: 'Post',     description: 'Share thoughts & updates', color: 'text-blue-400',   bg: 'bg-blue-500/10',    action: 'post'    },
  { icon: Image,       label: 'Story',    description: 'Vanishes in 24 hours',     color: 'text-pink-400',   bg: 'bg-pink-500/10',    action: 'story'   },
  { icon: Play,        label: 'Reel',     description: 'Short video content',      color: 'text-purple-400', bg: 'bg-purple-500/10',  action: 'reel'    },
  { icon: Radio,       label: 'Go Live',  description: 'Broadcast live now',       color: 'text-red-400',    bg: 'bg-red-500/10',     action: 'live'    },
  { icon: Users,       label: 'Group',    description: 'New community group',      color: 'text-teal-400',   bg: 'bg-teal-500/10',    action: 'group'   },
  { icon: BookOpen,    label: 'Page',     description: 'Business or creator page', color: 'text-sky-400',    bg: 'bg-sky-500/10',     action: 'page'    },
  { icon: Calendar,    label: 'Event',    description: 'Organize an event',        color: 'text-orange-400', bg: 'bg-orange-500/10',  action: 'event'   },
  { icon: ShoppingBag, label: 'Listing',  description: 'Sell on Marketplace',      color: 'text-amber-400',  bg: 'bg-amber-500/10',   action: 'listing' },
]

export default function CreateModal({ hideFab = false }: { hideFab?: boolean }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [activeStory, setActiveStory] = useState(false)
  const dragY = useMotionValue(0)
  const didDragRef = useRef(false)

  // Restore saved vertical position on mount
  useEffect(() => {
    const saved = parseFloat(localStorage.getItem('fab_y') ?? '0')
    if (!isNaN(saved)) dragY.set(saved)
  }, [])

  // Bottom-nav + button fires this event to open the menu without the FAB
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('szc:open-create', handler)
    return () => window.removeEventListener('szc:open-create', handler)
  }, [])

  const saveDragY = () => {
    localStorage.setItem('fab_y', String(dragY.get()))
    setTimeout(() => { didDragRef.current = false }, 50)
  }

  const handleOption = (action: string) => {
    setOpen(false)
    if (action === 'post')    { setTimeout(() => setActiveModal('post'), 80); return }
    if (action === 'story')   { setTimeout(() => setActiveStory(true), 80); return }
    if (action === 'group')   { setTimeout(() => setActiveModal('group'), 80); return }
    if (action === 'event')   { setTimeout(() => setActiveModal('event'), 80); return }
    if (action === 'listing') { setTimeout(() => setActiveModal('listing'), 80); return }
    if (action === 'reel')    { navigate('/app/smartztv'); return }
    if (action === 'live')    { navigate('/app/smartztv'); return }
    if (action === 'page')    { navigate('/app/profile'); return }
  }

  const closeAll = () => { setActiveModal(null); setActiveStory(false) }

  return (
    <>
      {/* Backdrop — outside draggable group so it stays full-screen */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Draggable group: button + menu move together */}
      <motion.div
        drag="y"
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ top: -(window.innerHeight - 160), bottom: 80 }}
        style={{ y: dragY }}
        onDragStart={() => { didDragRef.current = false }}
        onDrag={() => { didDragRef.current = true }}
        onDragEnd={saveDragY}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 touch-none select-none"
      >
        {/* Create Menu — anchored above the button */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="absolute bottom-full right-0 mb-2 w-72 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl shadow-black/40 overflow-hidden"
              role="dialog" aria-modal="true" aria-label="Create new content"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/6 border-gray-100">
                <div>
                  <p className="font-bold text-sm dark:text-white text-gray-900">Create</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-400">What would you like to share?</p>
                </div>
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors">
                  <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                </button>
              </div>

              <div className="p-2 grid grid-cols-2 gap-1">
                {createOptions.map(option => {
                  const Icon = option.icon
                  const isNav = ['reel', 'live', 'page'].includes(option.action)
                  return (
                    <motion.button
                      key={option.label}
                      onClick={() => handleOption(option.action)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className={`w-8 h-8 rounded-xl ${option.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${option.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold dark:text-white text-gray-900">{option.label}</p>
                          {isNav && <ChevronRight className="w-2.5 h-2.5 dark:text-gray-600 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400 leading-snug mt-0.5">{option.description}</p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <div className="px-4 py-2 border-t dark:border-white/6 border-gray-100">
                <p className="text-[10px] dark:text-gray-600 text-gray-400 text-center">
                  ✨ Posts go live instantly · Listings are reviewed by admins
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB — hidden on mobile when bottom nav owns the + button */}
        {!hideFab && <button
          onClick={() => { if (!didDragRef.current) setOpen(o => !o) }}
          className="w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing md:flex hidden"
          aria-label="Open create menu"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <motion.div
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-8 h-8 rounded-xl bg-love-gradient shadow-lg shadow-pink-500/40 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-white" />
          </motion.div>
        </button>}
      </motion.div>

      {/* Sub-Modals */}
      <AnimatePresence>
        {activeModal === 'post'    && <PostModal    onClose={closeAll} />}
        {activeModal === 'group'   && <GroupModal   onClose={closeAll} />}
        {activeModal === 'event'   && <EventModal   onClose={closeAll} />}
        {activeModal === 'listing' && <ListingModal onClose={closeAll} />}
        {activeStory               && <StoryModal   onClose={closeAll} />}
      </AnimatePresence>
    </>
  )
}
