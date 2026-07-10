import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Eye, TrendingUp, DollarSign, Plus, CheckCircle,
  Clock, BarChart3, RefreshCw, X, Loader2, Database, Search,
  Upload, ImageIcon, Pencil, Trash2, ExternalLink,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToSufy, deleteFromSufy, sufyKeyFromUrl } from '@/lib/sufy'

interface Ad {
  id: string
  title: string
  advertiser: string
  type: 'banner' | 'video' | 'sponsored'
  budget_usd: number
  spent_usd: number
  impressions: number
  clicks: number
  status: 'active' | 'paused' | 'pending' | 'ended'
  placement: string | null
  start_date: string | null
  end_date: string | null
  image_url: string | null
  target_url: string | null
  created_at: string
}

const statusColors: Record<string, string> = {
  active:  'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
  paused:  'bg-amber-500/15 text-amber-500 border-amber-500/25',
  pending: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  ended:   'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-600 dark:border-white/10 border-gray-200',
}
const typeColors: Record<string, string> = {
  banner:    'bg-pink-500/15 text-brand-pink border-pink-500/25',
  video:     'bg-purple-500/15 text-brand-purple border-purple-500/25',
  sponsored: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/25',
}

const emptyForm = () => ({
  title: '', advertiser: '', type: 'banner' as Ad['type'],
  budget_usd: '', placement: '', start_date: '', end_date: '',
  image_url: '', target_url: '',
})

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dbConnected, setDbConnected] = useState(false)

  // Modal state — null = closed, 'create' = creating, Ad = editing
  const [modal, setModal] = useState<null | 'create' | Ad>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null)
  const [deleting, setDeleting] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)

  /* ── open create modal ── */
  const openCreate = () => {
    setForm(emptyForm())
    setModal('create')
  }

  /* ── open edit modal ── */
  const openEdit = (ad: Ad) => {
    setForm({
      title:      ad.title,
      advertiser: ad.advertiser,
      type:       ad.type,
      budget_usd: String(ad.budget_usd ?? ''),
      placement:  ad.placement ?? '',
      start_date: ad.start_date ?? '',
      end_date:   ad.end_date ?? '',
      image_url:  ad.image_url ?? '',
      target_url: ad.target_url ?? '',
    })
    setModal(ad)
  }

  const closeModal = () => { setModal(null); setForm(emptyForm()) }

  /* ── image upload ── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await uploadToSufy(file, 'photos')
      setForm(p => ({ ...p, image_url: url }))
    } catch { /* ignore upload error */ }
    setUploadingImage(false)
    // reset so same file can be re-selected
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  /* ── fetch ── */
  const fetchAds = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.message.includes('does not exist')) setDbConnected(false)
      setLoading(false)
      return
    }
    setDbConnected(true)
    setAds((data || []) as Ad[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAds() }, [fetchAds])

  /* ── update status ── */
  const updateStatus = async (id: string, status: Ad['status']) => {
    await supabase.from('ad_campaigns').update({ status }).eq('id', id)
    setAds(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  /* ── build payload ── */
  const buildPayload = () => ({
    title:      form.title.trim(),
    advertiser: form.advertiser.trim(),
    type:       form.type,
    budget_usd: parseFloat(form.budget_usd) || 0,
    placement:  form.placement.trim() || null,
    start_date: form.start_date || null,
    end_date:   form.end_date || null,
    image_url:  form.image_url.trim() || null,
    target_url: form.target_url.trim() || null,
  })

  /* ── create ── */
  const createCampaign = async () => {
    if (!form.title || !form.advertiser) return
    setSaving(true)
    const payload = { ...buildPayload(), spent_usd: 0, impressions: 0, clicks: 0, status: 'pending' }
    const { error } = await supabase.from('ad_campaigns').insert(payload)
    if (!error) { await fetchAds(); closeModal() }
    setSaving(false)
  }

  /* ── edit / update ── */
  const updateCampaign = async () => {
    if (!form.title || !form.advertiser || typeof modal !== 'object' || modal === null) return
    setSaving(true)
    const ad = modal as Ad
    const payload = buildPayload()

    // If user replaced the image, delete the old one from storage
    if (ad.image_url && ad.image_url !== payload.image_url) {
      const key = sufyKeyFromUrl(ad.image_url)
      if (key) deleteFromSufy(key).catch(() => {/* best effort */})
    }

    const { error } = await supabase.from('ad_campaigns').update(payload).eq('id', ad.id)
    if (!error) {
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, ...payload } : a))
      closeModal()
    }
    setSaving(false)
  }

  /* ── delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    // Delete storage object if present
    if (deleteTarget.image_url) {
      const key = sufyKeyFromUrl(deleteTarget.image_url)
      if (key) deleteFromSufy(key).catch(() => {/* best effort */})
    }
    const { error } = await supabase.from('ad_campaigns').delete().eq('id', deleteTarget.id)
    if (!error) setAds(prev => prev.filter(a => a.id !== deleteTarget.id))
    setDeleteTarget(null)
    setDeleting(false)
  }

  const isEditing = modal !== null && modal !== 'create'

  const filtered = ads
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.advertiser.toLowerCase().includes(search.toLowerCase()))

  const totalRevenue    = ads.filter(a => a.status !== 'pending').reduce((s, a) => s + (a.spent_usd || 0), 0)
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0)
  const avgCtr = ads.length > 0
    ? ((ads.reduce((s, a) => s + (a.clicks || 0), 0) / Math.max(totalImpressions, 1)) * 100).toFixed(2)
    : '0.00'

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">SmartzAds</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Manage ad campaigns and track performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAds} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 hover:text-brand-pink transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>
      </div>

      {/* ── DB warning ── */}
      {!loading && !dbConnected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <Database className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Database table not found</p>
            <p className="text-xs dark:text-amber-500/80 text-amber-600/80 mt-0.5">
              Create the <code className="font-mono bg-amber-500/10 px-1 rounded">ad_campaigns</code> table in Supabase to enable this module.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ad Revenue (MTD)', value: `$${totalRevenue.toFixed(2)}`,      icon: DollarSign, color: 'from-pink-500 to-rose-600' },
          { label: 'Active Campaigns', value: ads.filter(a => a.status === 'active').length.toString(), icon: Megaphone, color: 'from-purple-500 to-violet-600' },
          { label: 'Total Impressions', value: totalImpressions >= 1000 ? `${(totalImpressions/1000).toFixed(1)}K` : totalImpressions.toString(), icon: Eye, color: 'from-fuchsia-500 to-pink-600' },
          { label: 'Avg CTR', value: `${avgCtr}%`,                                icon: TrendingUp,  color: 'from-emerald-500 to-teal-600' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {loading
                ? <div className="h-7 w-16 dark:bg-white/10 bg-gray-200 rounded animate-pulse mb-1" />
                : <p className="font-display font-black text-2xl dark:text-white text-gray-900">{s.value}</p>
              }
              <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* ── Filters + search ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
            className="w-full pl-9 pr-4 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'active', 'pending', 'paused', 'ended'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-pink" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="w-8 h-8 dark:text-gray-600 text-gray-300 mb-3" />
            <p className="text-sm dark:text-gray-500 text-gray-400">
              {dbConnected ? 'No campaigns found' : 'Database not connected'}
            </p>
            {dbConnected && (
              <button onClick={openCreate} className="mt-3 text-xs text-brand-pink hover:underline">
                Create your first campaign →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-white/5 border-gray-100">
                  {['Creative', 'Campaign', 'Type', 'Budget', 'Spent', 'Impressions', 'Clicks', 'CTR', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const ctr = a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) : '0.00'
                  return (
                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b dark:border-white/4 border-gray-50 hover:dark:bg-white/2 hover:bg-pink-50/30 transition-colors">
                      {/* Creative thumbnail */}
                      <td className="px-4 py-3">
                        {a.image_url ? (
                          <img src={a.image_url} alt={a.title}
                            className="w-12 h-9 rounded-lg object-cover border dark:border-white/8 border-gray-200" />
                        ) : (
                          <div className="w-12 h-9 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 dark:text-gray-600 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold dark:text-white text-gray-900">{a.title}</p>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400">{a.advertiser}{a.placement ? ` · ${a.placement}` : ''}</p>
                        {a.target_url && (
                          <a href={a.target_url} target="_blank" rel="noreferrer"
                            className="text-[10px] text-brand-pink hover:underline flex items-center gap-0.5 mt-0.5">
                            <ExternalLink className="w-2.5 h-2.5" /> Link
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeColors[a.type] || ''}`}>{a.type}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold dark:text-white text-gray-900">${a.budget_usd?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-emerald-500">${a.spent_usd?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3 text-xs dark:text-gray-300 text-gray-700">{a.impressions?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-xs dark:text-gray-300 text-gray-700">{a.clicks?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-xs font-bold text-brand-pink">{ctr}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[a.status] || ''}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(a)}
                            className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-blue-500/10 transition-colors"
                            title="Edit campaign">
                            <Pencil className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                          </button>
                          {a.status === 'pending' && (
                            <button onClick={() => updateStatus(a.id, 'active')}
                              className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                              title="Approve">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                          )}
                          {a.status === 'active' && (
                            <button onClick={() => updateStatus(a.id, 'paused')}
                              className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                              title="Pause">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                          )}
                          {a.status === 'paused' && (
                            <button onClick={() => updateStatus(a.id, 'active')}
                              className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                              title="Resume">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget(a)}
                            className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            title="Delete campaign">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                          <button className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-purple-500/10 transition-colors"
                            title="View analytics">
                            <BarChart3 className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <AnimatePresence>
        {modal !== null && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-black text-xl dark:text-white text-gray-900">
                  {isEditing ? 'Edit Campaign' : 'New Campaign'}
                </h3>
                <button onClick={closeModal} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Text fields */}
                {([
                  { label: 'Campaign Title',  key: 'title',      type: 'text',   placeholder: 'e.g. MTN MoMo Promo' },
                  { label: 'Advertiser',      key: 'advertiser', type: 'text',   placeholder: 'e.g. MTN Liberia' },
                  { label: 'Budget (USD)',    key: 'budget_usd', type: 'number', placeholder: '500' },
                  { label: 'Placement',       key: 'placement',  type: 'text',   placeholder: 'Feed, Discover, etc.' },
                  { label: 'Target URL',      key: 'target_url', type: 'url',    placeholder: 'https://example.com' },
                  { label: 'Start Date',      key: 'start_date', type: 'date',   placeholder: '' },
                  { label: 'End Date',        key: 'end_date',   type: 'date',   placeholder: '' },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">{f.label}</label>
                    <input
                      type={f.type}
                      value={(form as Record<string, string>)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
                  </div>
                ))}

                {/* Type select */}
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Ad['type'] }))}
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink">
                    <option value="banner">Banner</option>
                    <option value="video">Video</option>
                    <option value="sponsored">Sponsored</option>
                  </select>
                </div>

                {/* Creative image */}
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Creative Image</label>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

                  {form.image_url ? (
                    <div className="relative rounded-xl overflow-hidden border dark:border-white/8 border-gray-200 mb-2">
                      <img src={form.image_url} alt="creative preview" className="w-full max-h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, image_url: '' }))}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-500/80 transition-colors">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs dark:text-gray-600 text-gray-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> No image
                      </span>
                    </div>
                  )}

                  <button type="button" onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs font-semibold dark:text-gray-300 text-gray-700 hover:border-brand-pink/40 transition-colors disabled:opacity-50">
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploadingImage ? 'Uploading…' : form.image_url ? 'Replace Image' : 'Upload Image'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal}
                  className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  onClick={isEditing ? updateCampaign : createCampaign}
                  disabled={saving || !form.title || !form.advertiser}
                  className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : isEditing
                      ? <><Pencil className="w-4 h-4" /> Save Changes</>
                      : <><Plus className="w-4 h-4" /> Create</>
                  }
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
              <h3 className="font-display font-black text-lg dark:text-white text-gray-900 text-center mb-2">Delete Campaign?</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 text-center mb-1">
                <span className="font-semibold dark:text-white text-gray-900">{deleteTarget.title}</span>
              </p>
              <p className="text-xs dark:text-gray-500 text-gray-400 text-center mb-6">
                This will permanently delete the campaign and its creative image. This cannot be undone.
              </p>
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
