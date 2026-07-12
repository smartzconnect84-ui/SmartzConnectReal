import { useEffect, useRef, useState } from 'react'
import { Trophy, Plus, Trash2, Pencil, Check, X, Star, Users, Award, Upload, ImageOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToSufy } from '@/lib/sufy'

type Tab = 'events' | 'entries' | 'leaderboard' | 'spotlights'

interface WSEvent {
  id: string; title: string; category: string; description: string | null; prize: string | null
  prize_usd: number; date_range: string | null; location: string | null; emoji: string; color: string
  status: 'open' | 'upcoming' | 'ended'; participants: number; max_participants: number | null; rules: string | null
  image_url: string | null
}

interface WSEntry {
  id: string; event_id: string; user_id: string; title: string | null; entry_url: string | null
  description: string | null; votes_count: number; status: 'pending' | 'approved' | 'disqualified' | 'winner'
  created_at: string
}

interface WSSpotlight {
  id: string; user_id: string | null; display_name: string; country: string | null; category: string | null
  followers_label: string | null; quote: string | null; avatar_emoji: string; avatar_url: string | null
  wins: number; is_active: boolean; sort_order: number
}

const emptyEvent: Omit<WSEvent, 'id'> = {
  title: '', category: '', description: '', prize: '', prize_usd: 0, date_range: '', location: '',
  emoji: '🏆', color: 'from-pink-500 to-rose-600', status: 'upcoming', participants: 0, max_participants: null, rules: '',
  image_url: null,
}

const emptySpotlight: Omit<WSSpotlight, 'id'> = {
  user_id: null, display_name: '', country: '', category: '', followers_label: '', quote: '',
  avatar_emoji: '⭐', avatar_url: null, wins: 0, is_active: true, sort_order: 0,
}

export default function AdminWorldStage() {
  const [tab, setTab] = useState<Tab>('events')
  const [events, setEvents] = useState<WSEvent[]>([])
  const [entries, setEntries] = useState<WSEntry[]>([])
  const [spotlights, setSpotlights] = useState<WSSpotlight[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<WSEvent | (Omit<WSEvent, 'id'> & { id?: string }) | null>(null)
  const [editingSpotlight, setEditingSpotlight] = useState<WSSpotlight | (Omit<WSSpotlight, 'id'> & { id?: string }) | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingEventPhoto, setUploadingEventPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const eventFileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    const [ev, en, sp] = await Promise.all([
      supabase.from('worldstage_events').select('*').order('created_at', { ascending: false }),
      supabase.from('worldstage_entries').select('*').order('votes_count', { ascending: false }),
      supabase.from('worldstage_spotlights').select('*').order('sort_order', { ascending: true }),
    ])
    setEvents((ev.data as WSEvent[]) ?? [])
    setEntries((en.data as WSEntry[]) ?? [])
    setSpotlights((sp.data as WSSpotlight[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveEvent = async () => {
    if (!editingEvent) return
    const { id, ...rest } = editingEvent as WSEvent
    if (id) {
      await supabase.from('worldstage_events').update(rest).eq('id', id)
    } else {
      await supabase.from('worldstage_events').insert(rest)
    }
    setEditingEvent(null)
    load()
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event and all its nominations/votes?')) return
    await supabase.from('worldstage_events').delete().eq('id', id)
    load()
  }

  const setEntryStatus = async (id: string, status: WSEntry['status']) => {
    await supabase.from('worldstage_entries').update({ status }).eq('id', id)
    load()
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Remove this nomination?')) return
    await supabase.from('worldstage_entries').delete().eq('id', id)
    load()
  }

  const saveSpotlight = async () => {
    if (!editingSpotlight) return
    const { id, ...rest } = editingSpotlight as WSSpotlight
    if (id) {
      await supabase.from('worldstage_spotlights').update(rest).eq('id', id)
    } else {
      await supabase.from('worldstage_spotlights').insert(rest)
    }
    setEditingSpotlight(null)
    load()
  }

  const deleteSpotlight = async (id: string) => {
    if (!confirm('Remove this spotlight?')) return
    await supabase.from('worldstage_spotlights').delete().eq('id', id)
    load()
  }

  const toggleSpotlightActive = async (s: WSSpotlight) => {
    await supabase.from('worldstage_spotlights').update({ is_active: !s.is_active }).eq('id', s.id)
    load()
  }

  const handlePhotoUpload = async (file: File) => {
    if (!editingSpotlight) return
    setUploadingPhoto(true)
    try {
      const url = await uploadToSufy(file, 'avatars')
      setEditingSpotlight({ ...editingSpotlight, avatar_url: url })
    } catch (err) {
      alert('Photo upload failed. Please try again.')
      console.error(err)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleEventPhotoUpload = async (file: File) => {
    if (!editingEvent) return
    setUploadingEventPhoto(true)
    try {
      const url = await uploadToSufy(file, 'photos')
      setEditingEvent({ ...editingEvent, image_url: url })
    } catch (err) {
      alert('Event photo upload failed. Please try again.')
      console.error(err)
    } finally {
      setUploadingEventPhoto(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'events', label: 'Events', icon: Trophy },
    { id: 'entries', label: 'Nominations & Votes', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Award },
    { id: 'spotlights', label: 'Spotlights', icon: Star },
  ]

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">World Stage</h1>
        <p className="text-sm dark:text-gray-400 text-gray-500">Manage spotlight events, nominations, live voting and featured members.</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-love-gradient text-white shadow-md' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="text-sm dark:text-gray-500 text-gray-400">Loading…</p>
      ) : tab === 'events' ? (
        <div>
          <button
            onClick={() => setEditingEvent({ ...emptyEvent })}
            className="mb-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>

          {editingEvent && (
            <div className="mb-6 p-5 rounded-2xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Title" value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} className="input-field" />
                <input placeholder="Category" value={editingEvent.category} onChange={e => setEditingEvent({ ...editingEvent, category: e.target.value })} className="input-field" />
                <input placeholder="Prize (e.g. $500 + Trophy)" value={editingEvent.prize ?? ''} onChange={e => setEditingEvent({ ...editingEvent, prize: e.target.value })} className="input-field" />
                <input type="number" placeholder="Prize (USD)" value={editingEvent.prize_usd} onChange={e => setEditingEvent({ ...editingEvent, prize_usd: Number(e.target.value) })} className="input-field" />
                <input placeholder="Date range" value={editingEvent.date_range ?? ''} onChange={e => setEditingEvent({ ...editingEvent, date_range: e.target.value })} className="input-field" />
                <input placeholder="Location" value={editingEvent.location ?? ''} onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })} className="input-field" />
                <input placeholder="Emoji" value={editingEvent.emoji} onChange={e => setEditingEvent({ ...editingEvent, emoji: e.target.value })} className="input-field" />
                <select value={editingEvent.status} onChange={e => setEditingEvent({ ...editingEvent, status: e.target.value as WSEvent['status'] })} className="input-field">
                  <option value="upcoming">Upcoming</option>
                  <option value="open">Open</option>
                  <option value="ended">Ended</option>
                </select>
                <input type="number" placeholder="Max participants" value={editingEvent.max_participants ?? ''} onChange={e => setEditingEvent({ ...editingEvent, max_participants: e.target.value ? Number(e.target.value) : null })} className="input-field" />
              </div>
              <textarea placeholder="Description" value={editingEvent.description ?? ''} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} className="input-field w-full" rows={2} />
              <textarea placeholder="Rules" value={editingEvent.rules ?? ''} onChange={e => setEditingEvent({ ...editingEvent, rules: e.target.value })} className="input-field w-full" rows={2} />
              {/* Event Cover Image */}
              <div>
                <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 mb-2">Event Cover Image (optional)</p>
                <div className="flex items-center gap-3">
                  {editingEvent.image_url && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border dark:border-white/10 border-gray-200">
                      <img src={editingEvent.image_url} alt="Cover" className="w-full h-full object-cover" />
                      <button onClick={() => setEditingEvent({ ...editingEvent, image_url: null })}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => eventFileInputRef.current?.click()}
                    disabled={uploadingEventPhoto}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-300 text-gray-700 hover:text-brand-pink transition-colors border dark:border-white/8 border-gray-200 disabled:opacity-60">
                    {uploadingEventPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingEventPhoto ? 'Uploading…' : editingEvent.image_url ? 'Change Photo' : 'Upload Cover'}
                  </button>
                  <input ref={eventFileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const file = e.target.files?.[0]; if (file) handleEventPhotoUpload(file); e.target.value = '' }} />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={saveEvent} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Save</button>
                <button onClick={() => setEditingEvent(null)} className="px-4 py-2 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-bold flex items-center gap-1.5"><X className="w-4 h-4" /> Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(ev => (
              <div key={ev.id} className="p-4 rounded-2xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{ev.emoji}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    ev.status === 'open' ? 'bg-emerald-500/15 text-emerald-500' : ev.status === 'upcoming' ? 'bg-amber-500/15 text-amber-500' : 'bg-gray-500/15 text-gray-400'
                  }`}>{ev.status}</span>
                </div>
                <p className="font-bold text-sm dark:text-white text-gray-900">{ev.title}</p>
                <p className="text-xs dark:text-gray-400 text-gray-500 mb-2">{ev.category} · {ev.date_range}</p>
                <p className="text-xs dark:text-gray-500 text-gray-400 mb-3">{ev.participants} participants{ev.max_participants ? ` / ${ev.max_participants}` : ''}</p>
                <div className="flex gap-2">
                  <button onClick={() => setEditingEvent(ev)} className="flex-1 px-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-100 text-xs font-bold flex items-center justify-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                  <button onClick={() => deleteEvent(ev.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'entries' ? (
        <div className="space-y-3">
          {entries.length === 0 && <p className="text-sm dark:text-gray-500 text-gray-400">No nominations yet.</p>}
          {entries.map(en => (
            <div key={en.id} className="p-4 rounded-2xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm dark:text-white text-gray-900 truncate">{en.title || 'Untitled nomination'}</p>
                <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{en.description}</p>
                <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">{en.votes_count} votes · {new Date(en.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                  en.status === 'winner' ? 'bg-amber-500/15 text-amber-500' :
                  en.status === 'approved' ? 'bg-emerald-500/15 text-emerald-500' :
                  en.status === 'disqualified' ? 'bg-red-500/15 text-red-500' : 'bg-gray-500/15 text-gray-400'
                }`}>{en.status}</span>
                {en.status !== 'approved' && <button onClick={() => setEntryStatus(en.id, 'approved')} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold">Approve</button>}
                {en.status !== 'winner' && <button onClick={() => setEntryStatus(en.id, 'winner')} className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold">Winner</button>}
                {en.status !== 'disqualified' && <button onClick={() => setEntryStatus(en.id, 'disqualified')} className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold">Disqualify</button>}
                <button onClick={() => deleteEntry(en.id)} className="px-2 py-1 rounded-lg bg-gray-500/10 text-gray-400 text-xs font-bold"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'leaderboard' ? (
        <div className="space-y-2">
          <p className="text-xs dark:text-gray-500 text-gray-400 mb-2">Live vote counts per nomination (read-only — driven automatically by user votes).</p>
          {entries.filter(e => e.status === 'approved' || e.status === 'winner').sort((a, b) => b.votes_count - a.votes_count).map((en, i) => (
            <div key={en.id} className="flex items-center justify-between px-4 py-3 rounded-xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-love-gradient text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                <span className="text-sm font-bold dark:text-white text-gray-900">{en.title || 'Untitled'}</span>
              </div>
              <span className="text-sm font-black text-brand-pink">{en.votes_count} votes</span>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setEditingSpotlight({ ...emptySpotlight })}
            className="mb-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> New Spotlight
          </button>

          {editingSpotlight && (
            <div className="mb-6 p-5 rounded-2xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 space-y-3">

              {/* Photo upload section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Preview */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-500/20 to-violet-500/15 border dark:border-white/10 border-gray-200 flex items-center justify-center">
                  {editingSpotlight.avatar_url ? (
                    <img
                      src={editingSpotlight.avatar_url}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{editingSpotlight.avatar_emoji || '⭐'}</span>
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="text-xs font-bold dark:text-gray-300 text-gray-700">Profile Photo</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-400">Upload an image or keep the emoji fallback.</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-500 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-3 h-3" />
                      {uploadingPhoto ? 'Uploading…' : 'Upload photo'}
                    </button>
                    {editingSpotlight.avatar_url && (
                      <button
                        type="button"
                        onClick={() => setEditingSpotlight({ ...editingSpotlight, avatar_url: null })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold"
                      >
                        <ImageOff className="w-3 h-3" /> Remove photo
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoUpload(file)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Display name" value={editingSpotlight.display_name} onChange={e => setEditingSpotlight({ ...editingSpotlight, display_name: e.target.value })} className="input-field" />
                <input placeholder="Country" value={editingSpotlight.country ?? ''} onChange={e => setEditingSpotlight({ ...editingSpotlight, country: e.target.value })} className="input-field" />
                <input placeholder="Category" value={editingSpotlight.category ?? ''} onChange={e => setEditingSpotlight({ ...editingSpotlight, category: e.target.value })} className="input-field" />
                <input placeholder="Followers label (e.g. 12K)" value={editingSpotlight.followers_label ?? ''} onChange={e => setEditingSpotlight({ ...editingSpotlight, followers_label: e.target.value })} className="input-field" />
                <input placeholder="Avatar emoji (fallback)" value={editingSpotlight.avatar_emoji} onChange={e => setEditingSpotlight({ ...editingSpotlight, avatar_emoji: e.target.value })} className="input-field" />
                <input type="number" placeholder="Wins" value={editingSpotlight.wins} onChange={e => setEditingSpotlight({ ...editingSpotlight, wins: Number(e.target.value) })} className="input-field" />
              </div>
              <textarea placeholder="Quote" value={editingSpotlight.quote ?? ''} onChange={e => setEditingSpotlight({ ...editingSpotlight, quote: e.target.value })} className="input-field w-full" rows={2} />
              <div className="flex gap-2 flex-wrap">
                <button onClick={saveSpotlight} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Save</button>
                <button onClick={() => setEditingSpotlight(null)} className="px-4 py-2 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-bold flex items-center gap-1.5"><X className="w-4 h-4" /> Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spotlights.map(s => (
              <div key={s.id} className="p-4 rounded-2xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  {/* Avatar: real image or emoji fallback */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-md">
                    {s.avatar_url ? (
                      <img
                        src={s.avatar_url}
                        alt={s.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{s.avatar_emoji}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm dark:text-white text-gray-900 truncate">{s.display_name}</p>
                    <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{s.category} · {s.country}</p>
                  </div>
                </div>
                <p className="text-xs italic dark:text-gray-400 text-gray-500 mb-3 line-clamp-2">"{s.quote}"</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => toggleSpotlightActive(s)} className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg text-xs font-bold ${s.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-400'}`}>
                    {s.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => setEditingSpotlight(s)} className="px-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-100 text-xs font-bold"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => deleteSpotlight(s.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
