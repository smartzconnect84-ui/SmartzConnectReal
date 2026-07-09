import { useEffect, useState } from 'react'
import { Trophy, Send, ThumbsUp, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface WSEvent {
  id: string; title: string; category: string; description: string | null
  prize: string | null; emoji: string; status: 'open' | 'upcoming' | 'ended'
}

interface WSEntry {
  id: string; event_id: string; user_id: string; title: string | null
  description: string | null; entry_url: string | null; votes_count: number
  status: 'pending' | 'approved' | 'disqualified' | 'winner'
}

export default function WorldStageVotePage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<WSEvent[]>([])
  const [entries, setEntries] = useState<WSEntry[]>([])
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set())
  const [activeEvent, setActiveEvent] = useState<string | null>(null)
  const [nomTitle, setNomTitle] = useState('')
  const [nomDesc, setNomDesc] = useState('')
  const [nomUrl, setNomUrl] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data: ev } = await supabase.from('worldstage_events').select('*').in('status', ['open', 'upcoming']).order('created_at', { ascending: false })
    const { data: en } = await supabase.from('worldstage_entries').select('*').eq('status', 'approved').order('votes_count', { ascending: false })
    setEvents((ev as WSEvent[]) ?? [])
    setEntries((en as WSEntry[]) ?? [])
    if (ev && ev.length > 0) setActiveEvent(ev[0].id)
    if (user?.id) {
      const { data: votes } = await supabase.from('worldstage_votes').select('entry_id').eq('voter_id', user.id)
      setMyVotes(new Set((votes ?? []).map((v: any) => v.entry_id)))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  const submitNomination = async () => {
    if (!user?.id || !activeEvent || !nomTitle.trim()) return
    await supabase.from('worldstage_entries').insert({
      event_id: activeEvent, user_id: user.id, title: nomTitle.trim(),
      description: nomDesc.trim() || null, entry_url: nomUrl.trim() || null, status: 'pending',
    })
    setSubmitted(true)
    setNomTitle(''); setNomDesc(''); setNomUrl('')
    setTimeout(() => setSubmitted(false), 3000)
  }

  const vote = async (entryId: string) => {
    if (!user?.id || myVotes.has(entryId)) return
    const { error } = await supabase.from('worldstage_votes').insert({ entry_id: entryId, voter_id: user.id })
    if (!error) {
      setMyVotes(prev => new Set(prev).add(entryId))
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, votes_count: e.votes_count + 1 } : e))
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-8 text-center">
        <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h1 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-2">World Stage — Nominate &amp; Vote</h1>
        <p className="text-sm dark:text-gray-400 text-gray-600">Nominate a standout member for the current spotlight event, or cast your vote on live nominations below.</p>
      </div>

      {loading ? (
        <p className="text-sm text-center dark:text-gray-500 text-gray-400">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-center dark:text-gray-500 text-gray-400">No open events right now — check back soon.</p>
      ) : (
        <>
          {/* Nomination form */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5 mb-8">
            <p className="font-bold text-sm dark:text-white text-gray-900 mb-3">Nominate someone</p>
            <select value={activeEvent ?? ''} onChange={e => setActiveEvent(e.target.value)} className="input-field w-full mb-3">
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.emoji} {ev.title} ({ev.category})</option>)}
            </select>
            <input placeholder="Who / what are you nominating?" value={nomTitle} onChange={e => setNomTitle(e.target.value)} className="input-field w-full mb-3" />
            <textarea placeholder="Why do they deserve the spotlight?" value={nomDesc} onChange={e => setNomDesc(e.target.value)} className="input-field w-full mb-3" rows={2} />
            <input placeholder="Link (profile, post, etc. — optional)" value={nomUrl} onChange={e => setNomUrl(e.target.value)} className="input-field w-full mb-3" />
            <button
              onClick={submitNomination}
              disabled={!nomTitle.trim() || submitted}
              className="w-full py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitted ? <><Check className="w-4 h-4" /> Submitted for review</> : <><Send className="w-4 h-4" /> Submit nomination</>}
            </button>
          </div>

          {/* Live voting poll */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5">
            <p className="font-bold text-sm dark:text-white text-gray-900 mb-4">Live voting</p>
            {entries.length === 0 ? (
              <p className="text-sm dark:text-gray-500 text-gray-400">No approved nominations yet — be the first!</p>
            ) : (
              <div className="space-y-2">
                {entries.map(en => {
                  const maxVotes = Math.max(...entries.map(e => e.votes_count), 1)
                  const pct = Math.round((en.votes_count / maxVotes) * 100)
                  const voted = myVotes.has(en.id)
                  return (
                    <div key={en.id} className="relative rounded-xl overflow-hidden dark:bg-white/5 bg-gray-50 border dark:border-white/5 border-gray-100">
                      <div className="absolute inset-y-0 left-0 bg-love-gradient/15" style={{ width: `${pct}%` }} />
                      <div className="relative flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{en.title}</p>
                          <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{en.votes_count} votes</p>
                        </div>
                        <button
                          onClick={() => vote(en.id)}
                          disabled={voted}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                            voted ? 'bg-emerald-500/15 text-emerald-500' : 'bg-love-gradient text-white'
                          }`}
                        >
                          {voted ? <><Check className="w-3.5 h-3.5" /> Voted</> : <><ThumbsUp className="w-3.5 h-3.5" /> Vote</>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
