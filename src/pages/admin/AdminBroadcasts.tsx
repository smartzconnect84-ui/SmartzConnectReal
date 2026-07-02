import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, RefreshCw, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Ad {
  id: number
  title: string
  body: string
  target_audience: string
  sent_by_name: string
  recipient_count: number
  sent_at: string
}

export default function AdminBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', target_audience: 'all' })
  const [sending, setSending] = useState(false)
  const [userCount, setUserCount] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    const [bRes, uRes] = await Promise.all([
      supabase.from('broadcast_messages').select('*').order('sent_at', { ascending: false }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ])
    setBroadcasts(bRes.data || [])
    setUserCount(uRes.count || 0)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const sendBroadcast = async () => {
    if (!form.title || !form.body) return
    setSending(true)
    await supabase.from('broadcast_messages').insert({
      title: form.title,
      body: form.body,
      target_audience: form.target_audience,
      sent_by_name: 'Admin',
      recipient_count: form.target_audience === 'all' ? userCount : Math.floor(userCount * 0.3),
      sent_at: new Date().toISOString(),
    })
    await fetchData()
    setShowCompose(false)
    setForm({ title: '', body: '', target_audience: 'all' })
    setSending(false)
  }

  const audienceOptions = [
    { value: 'all', label: '🌍 All Users', count: userCount },
    { value: 'premium', label: '💕 Premium Users', count: Math.floor(userCount * 0.3) },
    { value: 'vip', label: '👑 VIP Users', count: Math.floor(userCount * 0.1) },
    { value: 'free', label: '🆓 Free Users', count: Math.floor(userCount * 0.6) },
    { value: 'inactive', label: '😴 Inactive (7+ days)', count: Math.floor(userCount * 0.2) },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Broadcasts</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-0.5">Send announcements to your users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/25">
            <Plus className="w-4 h-4" /> Compose
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-200">
          <p className="font-display font-black text-2xl text-brand-pink">{broadcasts.length}</p>
          <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">Total Broadcasts</p>
        </div>
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-200">
          <p className="font-display font-black text-2xl text-emerald-500">{userCount}</p>
          <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">Total Recipients</p>
        </div>
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-200 col-span-2 sm:col-span-1">
          <p className="font-display font-black text-2xl text-blue-500">{broadcasts.reduce((a, b) => a + (b.recipient_count || 0), 0).toLocaleString()}</p>
          <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">Total Delivered</p>
        </div>
      </div>

      {/* Broadcast history */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-brand-pink" /></div>
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-16 dark:text-gray-500 text-gray-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No broadcasts sent yet</p>
            <button onClick={() => setShowCompose(true)} className="mt-4 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold">Send First Broadcast</button>
          </div>
        ) : broadcasts.map(b => (
          <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-love-soft border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-brand-pink" />
                </div>
                <div className="flex-1">
                  <p className="font-bold dark:text-white text-gray-900 mb-1">{b.title}</p>
                  <p className="text-sm dark:text-gray-400 text-gray-600 line-clamp-2">{b.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs dark:text-gray-500 text-gray-400">
                    <span>👥 {b.recipient_count?.toLocaleString()} recipients</span>
                    <span>🎯 {b.target_audience}</span>
                    <span>{new Date(b.sent_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCompose(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">
            <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-5">Compose Broadcast</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title..."
                  className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
              </div>
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Message</label>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={5} placeholder="Write your message..."
                  className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-2 block">Target Audience</label>
                <div className="grid grid-cols-1 gap-2">
                  {audienceOptions.map(a => (
                    <button key={a.value} onClick={() => setForm(p => ({ ...p, target_audience: a.value }))}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${form.target_audience === a.value ? 'border-brand-pink bg-love-soft text-brand-pink' : 'dark:border-white/8 border-gray-200 dark:text-white text-gray-900 hover:border-pink-300'}`}>
                      <span className="font-semibold">{a.label}</span>
                      <span className="text-xs dark:text-gray-400 text-gray-500">~{a.count} users</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCompose(false)} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">Cancel</button>
              <button onClick={sendBroadcast} disabled={sending || !form.title || !form.body}
                className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Megaphone className="w-4 h-4" /> Send Broadcast</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
