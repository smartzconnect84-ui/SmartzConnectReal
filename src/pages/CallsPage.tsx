import { useState, useEffect } from 'react'
import { Video, Phone, Search, Clock, X } from 'lucide-react'
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

type CallMode = 'video' | 'audio'

export default function CallsPage({ defaultMode }: { defaultMode?: CallMode }) {
  const { user } = useAuth()
  const { startCall } = useLiveKitCall()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<CallMode>(defaultMode ?? 'video')

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

  const filtered = contacts.filter(c =>
    (c.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCall = (contact: Contact, type: CallMode) => {
    const ids = [user!.id, contact.id].sort()
    const roomId = `call_${ids[0]}_${ids[1]}`
    startCall({
      roomId,
      type,
      participantName: contact.full_name ?? 'User',
      participantAvatar: contact.avatar_url ?? undefined,
    })
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4 py-6 gap-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold dark:text-white text-gray-900">Calls</h1>
        <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Start a video or audio call with your contacts</p>
      </div>

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
                  {/* Avatar */}
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

                  {/* Name & status */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dark:text-white text-gray-900 truncate">
                      {contact.full_name ?? 'Unknown User'}
                    </p>
                    <p className={`text-xs ${contact.is_online ? 'text-green-400' : 'dark:text-gray-500 text-gray-400'}`}>
                      {contact.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>

                  {/* Call buttons */}
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
    </div>
  )
}
