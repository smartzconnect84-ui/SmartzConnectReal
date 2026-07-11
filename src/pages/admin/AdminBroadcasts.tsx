import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, RefreshCw, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { notifyUser } from '@/lib/notify'

interface Broadcast {
  id: number
  title: string
  body: string
  target_audience: string
  sent_by_name: string
  recipient_count: number
  sent_at: string
}

export default function AdminBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', target_audience: 'all' })
  const [sending, setSending] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const [segmentCounts, setSegmentCounts] = useState({ premium: 0, vip: 0, free: 0, inactive: 0 })

  // Edit state
  const [editTarget, setEditTarget] = useState<Broadcast | null>(null)
  const [editForm, setEditForm] = useState({ title: '', body: '', target_audience: 'all' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Broadcast | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    const [bRes, uRes, premRes, vipRes, freeRes, inactiveRes] = await Promise.all([
      supabase.from('broadcast_messages').select('*').order('sent_at', { ascending: false }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'vip'),
      supabase.from('users').select('id', { count: 'exact', head: true }).or('subscription_tier.eq.free,subscription_tier.is.null'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).lt('last_seen', sevenDaysAgo),
    ])
    setBroadcasts(bRes.data || [])
    const total = uRes.count || 0
    setUserCount(total)
    setSegmentCounts({
      premium:  premRes.error  ? 0 : (premRes.count || 0),
      vip:      vipRes.error   ? 0 : (vipRes.count || 0),
      free:     freeRes.error  ? 0 : (freeRes.count || 0),
      inactive: inactiveRes.error ? 0 : (inactiveRes.count || 0),
    })
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // Resolve which profile IDs belong to the selected audience segment so the
  // broadcast can actually be pushed to devices, not just logged to a table.
  const resolveAudienceIds = async (segment: string): Promise<{ ids: string[]; resolutionFailed: boolean }> => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    // `users.id` is a separate numeric app-table PK, NOT the profile/auth UUID
    // that `send-push` expects — the actual auth UUID lives in `users.auth_id`.
    // `profiles.id` IS the auth UUID directly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from('profiles').select('id')
    let idField: 'id' | 'auth_id' = 'id'
    if (segment === 'premium') { query = supabase.from('users').select('auth_id').eq('subscription_tier', 'premium'); idField = 'auth_id' }
    else if (segment === 'vip') { query = supabase.from('users').select('auth_id').eq('subscription_tier', 'vip'); idField = 'auth_id' }
    else if (segment === 'free') { query = supabase.from('users').select('auth_id').or('subscription_tier.eq.free,subscription_tier.is.null'); idField = 'auth_id' }
    else if (segment === 'inactive') { query = supabase.from('profiles').select('id').lt('last_seen', sevenDaysAgo); idField = 'id' }
    const { data, error } = await query
    if (error) {
      console.warn('[AdminBroadcasts] failed to resolve audience ids:', error)
      return { ids: [], resolutionFailed: true }
    }
    const ids = (data || [])
      .map((row: Record<string, string | null>) => row[idField])
      .filter((id: string | null): id is string => !!id)
    return { ids, resolutionFailed: false }
  }

  const sendBroadcast = async () => {
    if (!form.title || !form.body) return
    setSending(true)
    try {
      const { ids: recipientIds, resolutionFailed } = await resolveAudienceIds(form.target_audience)

      if (resolutionFailed) {
        // Don't silently fall back to an estimated count when we couldn't even
        // look up recipients — that would record a broadcast as "sent" to
        // thousands of users while zero pushes actually went out.
        alert('Failed to resolve recipients for this audience. Broadcast was not sent — please try again.')
        return
      }

      // Fan out real OS push notifications to every recipient in the segment.
      // Chunked to avoid firing thousands of concurrent requests at once, and
      // counted so the persisted row reflects actual delivery, not just intent.
      let delivered = 0
      const CHUNK_SIZE = 25
      for (let i = 0; i < recipientIds.length; i += CHUNK_SIZE) {
        const chunk = recipientIds.slice(i, i + CHUNK_SIZE)
        const results = await Promise.allSettled(chunk.map(userId => notifyUser({
          userId,
          type: 'announcement',
          title: form.title,
          message: form.body,
          emoji: '📢',
        })))
        delivered += results.filter(r => r.status === 'fulfilled' && r.value === true).length
      }
      if (recipientIds.length > 0 && delivered === 0) {
        console.warn('[AdminBroadcasts] push fan-out delivered to 0 of', recipientIds.length, 'recipients')
      }

      await supabase.from('broadcast_messages').insert({
        title: form.title,
        body: form.body,
        target_audience: form.target_audience,
        sent_by_name: 'Admin',
        recipient_count: delivered,
        sent_at: new Date().toISOString(),
      })

      await fetchData()
      setShowCompose(false)
      setForm({ title: '', body: '', target_audience: 'all' })
    } catch (err) {
      console.error('[AdminBroadcasts] sendBroadcast failed:', err)
      alert('Failed to send broadcast. Please try again.')
    } finally {
      setSending(false)
    }
  }

  /* ── open edit modal ── */
  const openEdit = (b: Broadcast) => {
    setEditForm({ title: b.title, body: b.body, target_audience: b.target_audience })
    setEditError(null)
    setEditTarget(b)
  }

  const closeEdit = () => { setEditTarget(null); setEditError(null) }

  /* ── save edit (UPDATE only — no re-send, no push notification) ── */
  const saveEdit = async () => {
    if (!editTarget || !editForm.title || !editForm.body) return
    setSaving(true)
    setEditError(null)
    try {
      const { error } = await supabase
        .from('broadcast_messages')
        .update({
          title: editForm.title,
          body: editForm.body,
          target_audience: editForm.target_audience,
        })
        .eq('id', editTarget.id)
      if (error) {
        setEditError(error.message)
      } else {
        setBroadcasts(prev => prev.map(b =>
          b.id === editTarget.id
            ? { ...b, title: editForm.title, body: editForm.body, target_audience: editForm.target_audience }
            : b
        ))
        closeEdit()
      }
    } catch (err) {
      setEditError('Failed to save changes. Please try again.')
      console.error('[AdminBroadcasts] saveEdit failed:', err)
    } finally {
      setSaving(false)
    }
  }

  /* ── confirm delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const { error } = await supabase
        .from('broadcast_messages')
        .delete()
        .eq('id', deleteTarget.id)
      if (error) {
        setDeleteError(error.message)
      } else {
        setBroadcasts(prev => prev.filter(b => b.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    } catch (err) {
      setDeleteError('Failed to delete broadcast. Please try again.')
      console.error('[AdminBroadcasts] confirmDelete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  const audienceOptions = [
    { value: 'all',      label: '🌍 All Users',           count: userCount },
    { value: 'premium',  label: '💕 Premium Users',        count: segmentCounts.premium },
    { value: 'vip',      label: '👑 VIP Users',            count: segmentCounts.vip },
    { value: 'free',     label: '🆓 Free Users',           count: segmentCounts.free },
    { value: 'inactive', label: '😴 Inactive (7+ days)',   count: segmentCounts.inactive },
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
              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(b)}
                  className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-blue-500/10 transition-colors"
                  title="Edit broadcast">
                  <Pencil className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                </button>
                <button
                  onClick={() => { setDeleteError(null); setDeleteTarget(b) }}
                  className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  title="Delete broadcast">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
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

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {editTarget && (
          <motion.div
            key="edit-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeEdit}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-black text-xl dark:text-white text-gray-900">Edit Broadcast</h3>
                <button onClick={closeEdit} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Title</label>
                  <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title..."
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
                </div>
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Message</label>
                  <textarea value={editForm.body} onChange={e => setEditForm(p => ({ ...p, body: e.target.value }))} rows={5} placeholder="Write your message..."
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-2 block">Target Audience</label>
                  <div className="grid grid-cols-1 gap-2">
                    {audienceOptions.map(a => (
                      <button key={a.value} onClick={() => setEditForm(p => ({ ...p, target_audience: a.value }))}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${editForm.target_audience === a.value ? 'border-brand-pink bg-love-soft text-brand-pink' : 'dark:border-white/8 border-gray-200 dark:text-white text-gray-900 hover:border-pink-300'}`}>
                        <span className="font-semibold">{a.label}</span>
                        <span className="text-xs dark:text-gray-400 text-gray-500">~{a.count} users</span>
                      </button>
                    ))}
                  </div>
                </div>
                {editError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{editError}</p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={closeEdit} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">Cancel</button>
                <button onClick={saveEdit} disabled={saving || !editForm.title || !editForm.body}
                  className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Pencil className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteTarget(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-display font-black text-lg dark:text-white text-gray-900 text-center mb-2">Delete Broadcast?</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 text-center mb-1">
                <span className="font-semibold dark:text-white text-gray-900">{deleteTarget.title}</span>
              </p>
              <p className="text-xs dark:text-gray-500 text-gray-400 text-center mb-4">
                This will permanently remove the broadcast from the history. This cannot be undone.
              </p>
              {deleteError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-4 text-center">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
