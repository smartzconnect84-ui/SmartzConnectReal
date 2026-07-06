import { useState, useEffect } from 'react'
import { Video, Phone, Search, X, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'

interface Contact {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_online: boolean | null
}

interface CallRecord {
  id: string
  from_id: string
  to_id: string
  room_name: string
  call_type: 'audio' | 'video'
  status: 'pending' | 'accepted' | 'declined' | 'missed' | 'cancelled'
  created_at: string
  otherName: string
  otherAvatar: string | null
  direction: 'outgoing' | 'incoming'
}

type Tab = 'contacts' | 'recent'
type CallMode = 'video' | 'audio'

function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

const statusIcon = (record: CallRecord) => {
  if (record.direction === 'incoming' && record.status === 'accepted') return <PhoneIncoming className="w-4 h-4 text-emerald-400" />
  if (record.direction === 'outgoing' && record.status === 'accepted') return <PhoneOutgoing className="w-4 h-4 text-blue-400" />
  if (record.status === 'missed') return <PhoneMissed className="w-4 h-4 text-red-400" />
  if (record.status === 'declined') return <PhoneOff className="w-4 h-4 text-red-400" />
  if (record.status === 'cancelled') return <PhoneOff className="w-4 h-4 text-gray-400" />
  return <Clock className="w-4 h-4 text-gray-400" />
}

export default function CallsPage({ defaultMode }: { defaultMode?: CallMode }) {
  const { user } = useAuth()
  const { initiateCall } = useLiveKitCall()
  const [tab, setTab] = useState<Tab>('contacts')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [activeMode, setActiveMode] = useState<CallMode>(defaultMode ?? 'video')
  const [missedCount, setMissedCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, is_online')
      .neq('id', user.id)
      .order('is_online', { ascending: false })
      .limit(40)
      .then(({ data }) => {
        setContacts(data ?? [])
        setLoading(false)
      })
  }, [user?.id])

  // Fetch recent calls
  const fetchRecent = async () => {
    if (!user?.id) return
    setLoadingRecent(true)
    const { data: rows } = await supabase
      .from('call_notifications')
      .select('id, from_id, to_id, room_name, call_type, status, created_at')
      .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(40)

    if (!rows) { setLoadingRecent(false); return }

    // Collect unique other-user ids
    const otherIds = [...new Set(rows.map(r => r.from_id === user.id ? r.to_id : r.from_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', otherIds)

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

    const records: CallRecord[] = rows.map(r => {
      const otherId = r.from_id === user.id ? r.to_id : r.from_id
      const p = profileMap[otherId]
      return {
        ...r,
        otherName: p?.full_name || 'Unknown',
        otherAvatar: p?.avatar_url || null,
        direction: r.from_id === user.id ? 'outgoing' : 'incoming',
      }
    })

    setRecentCalls(records)
    setMissedCount(records.filter(r => r.direction === 'incoming' && r.status === 'missed').length)
    setLoadingRecent(false)
  }

  useEffect(() => { fetchRecent() }, [user?.id])

  // Realtime: refresh recent on any call_notification change
  useEffect(() => {
    if (!user?.id) return
    const ch = supabase.channel('calls-page:realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'call_notifications',
        filter: `to_id=eq.${user.id}`,
      }, fetchRecent)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'call_notifications',
        filter: `from_id=eq.${user.id}`,
      }, fetchRecent)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user?.id])

  const filtered = contacts.filter(c =>
    (c.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCall = (contact: Contact, type: CallMode) => {
    initiateCall({
      contactId: contact.id,
      contactName: contact.full_name ?? 'User',
      contactAvatar: contact.avatar_url ?? undefined,
      type,
    })
  }

  const handleCallBack = (record: CallRecord) => {
    initiateCall({
      contactId: record.direction === 'outgoing' ? record.to_id : record.from_id,
      contactName: record.otherName,
      contactAvatar: record.otherAvatar ?? undefined,
      type: record.call_type,
    })
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4 py-6 gap-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold dark:text-white text-gray-900">Calls</h1>
        <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">
          Video and audio calls with your connections
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 dark:bg-white/5 bg-gray-100 p-1 rounded-xl">
        {(['contacts', 'recent'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-love-gradient text-white shadow-md'
                : 'dark:text-gray-400 text-gray-500 hover:dark:text-white hover:text-gray-900'
            }`}
          >
            {t === 'contacts' ? 'Contacts' : (
              <span className="flex items-center gap-1.5">
                Recent
                {missedCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {missedCount > 9 ? '9+' : missedCount}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'contacts' && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-2">
            {(['video', 'audio'] as CallMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeMode === mode
                    ? mode === 'video'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:dark:bg-white/10 hover:bg-gray-200'
                }`}
              >
                {mode === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                {mode === 'video' ? 'Video Call' : 'Audio Call'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/5 border-transparent text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 dark:text-gray-500 text-gray-400" />
              </button>
            )}
          </div>

          {/* Contacts list */}
          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl dark:bg-white/3 bg-gray-50 animate-pulse">
                    <div className="w-11 h-11 rounded-full dark:bg-white/10 bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded dark:bg-white/10 bg-gray-200 w-32" />
                      <div className="h-2.5 rounded dark:bg-white/5 bg-gray-100 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 dark:text-gray-600 text-gray-400" />
                </div>
                <p className="text-sm dark:text-gray-400 text-gray-500">
                  {search ? 'No contacts match your search' : 'No contacts found'}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                <div className="flex flex-col gap-2">
                  {filtered.map((contact, i) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-3 rounded-xl dark:bg-white/3 bg-gray-50 hover:dark:bg-white/6 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="relative flex-shrink-0">
                        {contact.avatar_url ? (
                          <img src={contact.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-love-gradient flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {(contact.full_name ?? 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        {contact.is_online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 dark:border-[#0D0A14] border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium dark:text-white text-gray-900 truncate">
                          {contact.full_name ?? 'Unknown User'}
                        </p>
                        <p className={`text-xs ${contact.is_online ? 'text-green-400' : 'dark:text-gray-500 text-gray-400'}`}>
                          {contact.is_online ? '● Online' : 'Offline'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCall(contact, 'audio')}
                          title="Audio call"
                          className="w-9 h-9 rounded-xl bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white flex items-center justify-center transition-all"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCall(contact, 'video')}
                          title="Video call"
                          className="w-9 h-9 rounded-xl bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white flex items-center justify-center transition-all"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </>
      )}

      {tab === 'recent' && (
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {loadingRecent ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl dark:bg-white/3 bg-gray-50 animate-pulse">
                  <div className="w-10 h-10 rounded-full dark:bg-white/10 bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded dark:bg-white/10 bg-gray-200 w-32" />
                    <div className="h-2.5 rounded dark:bg-white/5 bg-gray-100 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                <Phone className="w-7 h-7 dark:text-gray-600 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold dark:text-white text-gray-900">No calls yet</p>
                <p className="text-sm dark:text-gray-400 text-gray-500 mt-1">
                  Start your first call from the Contacts tab
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentCalls.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="flex items-center gap-3 p-3 rounded-xl dark:bg-white/3 bg-gray-50 hover:dark:bg-white/6 hover:bg-gray-100 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {record.otherAvatar ? (
                      <img src={record.otherAvatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-love-gradient flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {record.otherName[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Call type badge */}
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 dark:border-[#0D0A14] border-white ${
                      record.call_type === 'video' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {record.call_type === 'video'
                        ? <Video className="w-2.5 h-2.5 text-white" />
                        : <Phone className="w-2.5 h-2.5 text-white" />
                      }
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      record.status === 'missed' || record.status === 'declined'
                        ? 'text-red-400'
                        : 'dark:text-white text-gray-900'
                    }`}>
                      {record.otherName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {statusIcon(record)}
                      <p className="text-xs dark:text-gray-400 text-gray-500 capitalize">
                        {record.direction === 'outgoing' ? 'Outgoing' : 'Incoming'} · {record.status}
                      </p>
                      <span className="text-xs dark:text-gray-600 text-gray-300">·</span>
                      <p className="text-xs dark:text-gray-500 text-gray-400">{fmtTime(record.created_at)}</p>
                    </div>
                  </div>

                  {/* Call back */}
                  <button
                    onClick={() => handleCallBack(record)}
                    title={`${record.call_type === 'video' ? 'Video' : 'Audio'} call back`}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
                      record.call_type === 'video'
                        ? 'bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white'
                        : 'bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white'
                    }`}
                  >
                    {record.call_type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
