import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Plus, X, Loader2, Link2, RefreshCw, Database, Users, Globe2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { uploadToSufy } from '@/lib/sufy'
import { useOfflineDraft } from '@/lib/offlineDraft'

const categories = ['All', 'Social', 'Music', 'Business', 'Sports', 'Education', 'Charity', 'Tech']

interface EventRow {
  id: string
  title: string
  description: string | null
  category: string | null
  cover_url: string | null
  location: string | null
  is_online: boolean
  starts_at: string
  ends_at: string | null
  attendees_count: number
  host_id: string
  host?: string
  going: boolean
}

interface NewEvent {
  title: string
  description: string
  category: string
  location: string
  is_online: boolean
  starts_at: string
  cover_url: string
}

const emptyForm: NewEvent = { title: '', description: '', category: 'Social', location: '', is_online: false, starts_at: '', cover_url: '' }

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<NewEvent>(emptyForm)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useOfflineDraft('event-composer', form, setForm, { isEmpty: (d: any) => !d?.title?.trim() })

  const fetchEvents = async () => {
    setLoading(true)
    let query = supabase
      .from('events')
      .select('id, title, description, category, cover_url, location, is_online, starts_at, ends_at, attendees_count, host_id, profiles:host_id(full_name)')
      .eq('is_active', true)
      .order('starts_at', { ascending: true })

    if (activeCategory !== 'All') query = query.eq('category', activeCategory)

    const { data, error } = await query.limit(50)

    if (error) {
      setDbConnected(!error.message?.includes('does not exist'))
      setEvents([])
      setLoading(false)
      return
    }
    setDbConnected(true)

    let goingIds = new Set<string>()
    if (user && data?.length) {
      const { data: att } = await supabase.from('event_attendees').select('event_id').eq('user_id', user.id)
      goingIds = new Set((att || []).map((a: any) => a.event_id))
    }

    setEvents((data || []).map((e: any) => ({
      id: e.id, title: e.title, description: e.description, category: e.category,
      cover_url: e.cover_url, location: e.location, is_online: e.is_online,
      starts_at: e.starts_at, ends_at: e.ends_at, attendees_count: e.attendees_count ?? 0,
      host_id: e.host_id, host: e.profiles?.full_name || 'Host', going: goingIds.has(e.id),
    })))
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [activeCategory, user?.id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await uploadToSufy(file, 'events')
      setForm(f => ({ ...f, cover_url: url }))
    } catch { /* ignore */ }
    setUploadingImage(false)
  }

  const submitEvent = async () => {
    if (!user || !form.title.trim() || !form.starts_at) return
    setSubmitting(true)
    const { error } = await supabase.from('events').insert({
      host_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      location: form.location.trim() || null,
      is_online: form.is_online,
      starts_at: new Date(form.starts_at).toISOString(),
      cover_url: form.cover_url.trim() || null,
      is_active: true,
    })
    setSubmitting(false)
    if (!error) {
      setForm(emptyForm)
      setShowCreate(false)
      fetchEvents()
    }
  }

  const toggleGoing = async (ev: EventRow) => {
    if (!user) return
    if (ev.going) {
      await supabase.from('event_attendees').delete().eq('event_id', ev.id).eq('user_id', user.id)
      await supabase.from('events').update({ attendees_count: Math.max(0, ev.attendees_count - 1) }).eq('id', ev.id)
    } else {
      await supabase.from('event_attendees').insert({ event_id: ev.id, user_id: user.id, status: 'going' })
      await supabase.from('events').update({ attendees_count: ev.attendees_count + 1 }).eq('id', ev.id)
    }
    fetchEvents()
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50 overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex-shrink-0 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Events 📅</h1>
            <p className="text-xs dark:text-gray-400 text-gray-500">{dbConnected ? `${events.length} upcoming` : 'Connect database'}</p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-soft border border-pink-500/20 text-brand-pink text-xs font-bold hover:bg-pink-500/10 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            )}
            <button onClick={fetchEvents} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-3 overflow-hidden">
              <div className="dark:bg-white/5 bg-gray-50 rounded-2xl border dark:border-white/8 border-gray-200 p-4">
                <p className="text-sm font-bold dark:text-white text-gray-900 mb-3">Create an Event</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input placeholder="Event title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink">
                    {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input placeholder="Location (optional)" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} disabled={form.is_online}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink disabled:opacity-40" />
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 cursor-pointer">
                    <input type="checkbox" checked={form.is_online} onChange={e => setForm(f => ({ ...f, is_online: e.target.checked }))} className="accent-brand-pink" />
                    <Globe2 className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
                    <span className="dark:text-gray-300 text-gray-700">Online event</span>
                  </label>
                  <textarea placeholder="Description (optional)" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink resize-none" />
                  <div className="col-span-2 space-y-1.5">
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <div className="flex items-center gap-2">
                      {form.cover_url && <img src={form.cover_url} alt="preview" className="w-9 h-9 rounded-lg object-cover border dark:border-white/8 border-gray-200 flex-shrink-0" />}
                      <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-[10px] font-semibold dark:text-gray-300 text-gray-700 hover:border-brand-pink/40 transition-colors disabled:opacity-50 whitespace-nowrap">
                        {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                        {uploadingImage ? 'Uploading…' : 'Upload Cover'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-sm dark:text-gray-400 text-gray-600">Cancel</button>
                  <button onClick={submitEvent} disabled={submitting || !form.title.trim() || !form.starts_at}
                    className="flex-1 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-50">
                    {submitting ? 'Creating…' : 'Create Event'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 animate-pulse">
                <div className="h-32 dark:bg-white/5 bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 dark:bg-white/10 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 dark:bg-white/10 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !dbConnected ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl dark:bg-white/5 bg-gray-100 flex items-center justify-center"><Database className="w-8 h-8 dark:text-gray-600 text-gray-400" /></div>
            <div><p className="font-bold dark:text-white text-gray-900 mb-1">Events not connected</p><p className="text-sm dark:text-gray-400 text-gray-500">Configure Supabase to display events</p></div>
            <button onClick={fetchEvents} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="text-5xl mb-2">📅</div>
            <div><p className="font-bold dark:text-white text-gray-900 mb-1">No events yet</p><p className="text-sm dark:text-gray-400 text-gray-500">Be the first to create one!</p></div>
            {user && <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold"><Plus className="w-4 h-4" /> Create Event</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 hover:shadow-xl hover:shadow-pink-500/10 transition-all">
                <div className="relative h-32 dark:bg-gradient-to-br dark:from-pink-500/10 dark:to-purple-600/10 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden">
                  {ev.cover_url ? <img src={ev.cover_url} alt={ev.title} className="w-full h-full object-cover" /> : <Calendar className="w-10 h-10 dark:text-pink-400/40 text-pink-300" />}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-love-gradient text-white text-[9px] font-bold shadow-md">{ev.category}</span>
                </div>
                <div className="p-3.5">
                  <p className="font-bold text-sm dark:text-white text-gray-900 mb-1 line-clamp-1">{ev.title}</p>
                  <p className="text-xs text-brand-pink font-semibold mb-1.5">{fmtDate(ev.starts_at)}</p>
                  {ev.description && <p className="text-xs dark:text-gray-400 text-gray-500 mb-2 line-clamp-2">{ev.description}</p>}
                  <div className="flex items-center gap-3 text-[10px] dark:text-gray-500 text-gray-400 mb-3">
                    {ev.is_online ? <span className="flex items-center gap-1"><Globe2 className="w-3 h-3" /> Online</span> : ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ev.attendees_count} going</span>
                  </div>
                  {user ? (
                    <button onClick={() => toggleGoing(ev)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${ev.going ? 'dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-600' : 'bg-love-gradient text-white'}`}>
                      {ev.going ? "✓ Going" : "I'm Going"}
                    </button>
                  ) : (
                    <p className="text-[10px] dark:text-gray-500 text-gray-400 text-center">Sign in to RSVP</p>
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
