import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Eye, TrendingUp, DollarSign, Plus, CheckCircle,
  Clock, BarChart3, RefreshCw, X, Loader2, Database, Search,
  Upload, ImageIcon, Pencil, Trash2, ExternalLink, ShieldCheck,
  MessageSquareWarning, ClipboardList, Package, XCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToSufy, deleteFromSufy, sufyKeyFromUrl } from '@/lib/sufy'
import { loadConfig, saveConfig, DEFAULT_CONFIG, PLACEMENTS, PACKAGES, STATUS_LABEL, type AdsConfig, type Campaign } from '@/lib/smartzads'

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

  // Module view: legacy campaign table | self-service moderation | inventory | audit
  const [view, setView] = useState<'campaigns' | 'review' | 'inventory' | 'audit'>('campaigns')

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

      {/* ── Module tabs ── */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
          { id: 'review', label: 'Review Queue', icon: ShieldCheck },
          { id: 'inventory', label: 'Inventory & Pricing', icon: Package },
          { id: 'audit', label: 'Audit Log', icon: ClipboardList },
        ] as const).map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setView(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${view === t.id ? 'bg-love-gradient text-white' : 'dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {view === 'campaigns' && (<>

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
      </>)}

      {view === 'review' && <ReviewQueue />}
      {view === 'inventory' && <InventoryPanel />}
      {view === 'audit' && <AuditPanel />}

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

/* ═══════════════════════════════════════════════════════════
   Self-service moderation queue — aggregates customer campaigns
   from every local advertiser bucket + Supabase (when the
   SmartzAds tables are applied). Decisions write back to the
   owner's bucket, notify the owner, and are audit-logged.
   ═══════════════════════════════════════════════════════════ */
interface QItem { c: Campaign; ownerUid: string; cloud: boolean }

function pushOwnerNotif(ownerUid: string, n: { type: string; title: string; body: string }) {
  try {
    const key = `smartzads_${ownerUid}_notifs`
    const list = JSON.parse(localStorage.getItem(key) || '[]') as Record<string, unknown>[]
    list.unshift({ id: `n-${Date.now()}`, createdAt: new Date().toISOString(), read: false, ...n })
    localStorage.setItem(key, JSON.stringify(list.slice(0, 100)))
  } catch { /* storage unavailable */ }
}

function writeAudit(a: { actor: string; action: string; target: string; detail?: string }) {
  try {
    const list = JSON.parse(localStorage.getItem('smartzads_audit') || '[]') as Record<string, unknown>[]
    list.unshift({ id: `a-${Date.now()}`, at: new Date().toISOString(), ...a })
    localStorage.setItem('smartzads_audit', JSON.stringify(list.slice(0, 300)))
  } catch { /* storage unavailable */ }
  try {
    supabase.from('smartzads_audit_log')
      .insert({ actor: a.actor, action: a.action, target: a.target, detail: a.detail || '' })
      .then(() => undefined, () => undefined)
  } catch { /* table may not exist yet */ }
}

function mapRow(r: any): Campaign {
  const t = new Date().toISOString()
  return {
    id: String(r.id || ''), ownerId: String(r.owner_id || r.ownerId || ''),
    name: String(r.name || 'Untitled'), advertiserName: String(r.advertiser_name || r.advertiserName || ''),
    objective: r.objective || 'brand', headline: r.headline || '',
    description: r.description || '', body: r.body || '', cta: r.cta || 'Learn More',
    destinationUrl: r.destination_url || r.destinationUrl || '', leadDestination: '',
    format: r.format || 'image', placements: r.placements || [],
    targeting: { country: 'Liberia', city: '', language: 'English', ageRange: '18+', interests: [], device: 'All' },
    creatives: [], carousel: [], eventTitle: '', eventDate: '', eventLocation: '', jobTitle: '', jobOrg: '',
    startDate: r.start_date || r.startDate || '', endDate: r.end_date || r.endDate || '',
    currency: r.currency || 'USD', pricingModel: r.pricing_model || r.pricingModel || 'fixed',
    budgetTotal: Number(r.budget_total ?? r.budgetTotal ?? 0), dailyCap: 0,
    packageId: r.package_id || r.packageId || '',
    amountSpent: Number(r.amount_spent ?? 0), impressions: Number(r.impressions ?? 0),
    clicks: Number(r.clicks ?? 0), leads: 0, conversions: 0,
    status: r.status || 'submitted', moderationStatus: r.moderation_status || r.moderationStatus || 'pending',
    moderationNote: r.moderation_note || r.moderationNote || '',
    paymentStatus: r.payment_status || r.paymentStatus || 'unpaid',
    txRef: '', invoiceId: '', idempotencyKey: '',
    createdAt: r.created_at || t, updatedAt: r.updated_at || t, history: Array.isArray(r.history) ? r.history : [],
  } as Campaign
}

function ReviewQueue() {
  const [items, setItems] = useState<QItem[]>([])
  const [loading, setLoading] = useState(true)
  const [flt, setFlt] = useState<'queue' | 'approved' | 'rejected' | 'all'>('queue')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [acting, setActing] = useState('')
  const [err, setErr] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    const out: QItem[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || ''
        const m = key.match(/^smartzads_(.+)_campaigns$/)
        if (!m) continue
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]') as Campaign[]
          for (const c of list) out.push({ c, ownerUid: m[1], cloud: false })
        } catch { /* skip corrupt bucket */ }
      }
    } catch { /* storage unavailable */ }
    try {
      const { data, error } = await supabase.from('smartzads_campaigns').select('*').order('created_at', { ascending: false }).limit(200)
      if (!error && Array.isArray(data)) {
        const ids = new Set(out.map(o => o.c.id))
        for (const r of data as any[]) {
          const c = mapRow(r)
          if (!ids.has(c.id)) out.push({ c, ownerUid: c.ownerId, cloud: true })
        }
      }
    } catch { /* table may not exist yet */ }
    out.sort((a, b) => (b.c.updatedAt > a.c.updatedAt ? 1 : -1))
    setItems(out)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const persist = async (item: QItem, updated: Campaign) => {
    try {
      const key = `smartzads_${item.ownerUid}_campaigns`
      const list = JSON.parse(localStorage.getItem(key) || '[]') as Campaign[]
      localStorage.setItem(key, JSON.stringify(list.map(x => x.id === item.c.id ? updated : x)))
    } catch { /* storage unavailable */ }
    try {
      await supabase.from('smartzads_campaigns').update({
        status: updated.status, moderation_status: updated.moderationStatus,
        moderation_note: updated.moderationNote, updated_at: updated.updatedAt,
      }).eq('id', item.c.id)
    } catch { /* best effort */ }
  }

  const decide = async (item: QItem, decision: 'approved' | 'rejected' | 'changes_requested', activate: boolean) => {
    const note = (notes[item.c.id] || '').trim()
    if (decision !== 'approved' && !note) { setErr('Add a moderation note explaining the decision.'); return }
    setErr('')
    setActing(item.c.id)
    const t = new Date().toISOString()
    const status = decision === 'approved' ? (activate ? 'active' : 'approved') : decision === 'rejected' ? 'rejected' : 'changes_requested'
    const updated: Campaign = {
      ...item.c, status: status as Campaign['status'],
      moderationStatus: decision as Campaign['moderationStatus'], moderationNote: note, updatedAt: t,
      history: [...item.c.history, { at: t, actor: 'admin', action: `${status}${note ? ` — ${note}` : ''}` }],
    }
    await persist(item, updated)
    pushOwnerNotif(item.ownerUid, {
      type: 'moderation',
      title: decision === 'approved' ? 'Campaign approved' : decision === 'rejected' ? 'Campaign rejected' : 'Changes requested',
      body: `${item.c.name}${note ? ` — ${note}` : ''}`,
    })
    writeAudit({ actor: 'admin', action: `campaign.${status}`, target: item.c.id, detail: `${item.c.name} · owner ${item.ownerUid}` })
    setNotes(n => ({ ...n, [item.c.id]: '' }))
    await reload()
    setActing('')
  }

  const setStatus = async (item: QItem, status: Campaign['status']) => {
    setActing(item.c.id)
    const t = new Date().toISOString()
    const updated: Campaign = { ...item.c, status, updatedAt: t, history: [...item.c.history, { at: t, actor: 'admin', action: status }] }
    await persist(item, updated)
    pushOwnerNotif(item.ownerUid, { type: 'moderation', title: `Campaign ${status}`, body: item.c.name })
    writeAudit({ actor: 'admin', action: `campaign.${status}`, target: item.c.id, detail: `${item.c.name} · owner ${item.ownerUid}` })
    await reload()
    setActing('')
  }

  const filtered = items.filter(({ c }) =>
    flt === 'all' ? true
    : flt === 'queue' ? ['submitted', 'under_review', 'changes_requested'].includes(c.status)
    : flt === 'approved' ? c.moderationStatus === 'approved'
    : c.moderationStatus === 'rejected')

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap items-center">
        {(['queue', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFlt(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${flt === f ? 'bg-love-gradient text-white' : 'dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
            {f === 'queue' ? `Needs review (${items.filter(({ c }) => ['submitted', 'under_review', 'changes_requested'].includes(c.status)).length})` : f}
          </button>
        ))}
        <button onClick={reload} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 hover:text-brand-pink transition-colors" title="Refresh queue">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {err && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{err}</p>}
      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-brand-pink" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="w-8 h-8 dark:text-gray-600 text-gray-300 mb-3" />
          <p className="text-sm dark:text-gray-500 text-gray-400">Queue is clear — no campaigns awaiting review.</p>
          <p className="text-xs dark:text-gray-600 text-gray-400 mt-1">Customer submissions from the self-service wizard appear here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(({ c, ownerUid, cloud }) => (
            <div key={c.id} className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
              <div className="flex items-start gap-3 flex-wrap">
                {c.creatives[0] ? (
                  <img src={c.creatives[0].url} alt={c.name} className="w-20 h-14 rounded-xl object-cover border dark:border-white/8 border-gray-200" />
                ) : (
                  <div className="w-20 h-14 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 dark:text-gray-600 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-bold dark:text-white text-gray-900">{c.name}</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-400 mt-0.5">
                    {c.advertiserName} · {c.format} · {(c.placements || []).join(', ') || 'no placement'} · {c.budgetTotal} {c.currency}
                  </p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-400">
                    Owner <span className="font-mono">{ownerUid.slice(0, 8)}…</span>{cloud ? ' · cloud' : ' · this device'} · {c.destinationUrl}
                  </p>
                  {c.moderationNote && <p className="text-[11px] text-amber-500 mt-1">Note: {c.moderationNote}</p>}
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[c.status] || 'bg-purple-500/15 text-purple-400 border-purple-500/25'}`}>{STATUS_LABEL[c.status] || c.status}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.paymentStatus === 'verified' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' : 'bg-amber-500/15 text-amber-500 border-amber-500/25'}`}>{c.paymentStatus}</span>
                </div>
              </div>
              <textarea value={notes[c.id] || ''} onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
                placeholder="Moderation note (required to reject or request changes)…"
                rows={2}
                className="mt-3 w-full px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-xs focus:outline-none focus:border-brand-pink resize-none" />
              <div className="mt-2 flex gap-2 flex-wrap">
                <button disabled={acting === c.id} onClick={() => decide({ c, ownerUid, cloud }, 'approved', false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 text-xs font-bold hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button disabled={acting === c.id} onClick={() => decide({ c, ownerUid, cloud }, 'approved', true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve & activate
                </button>
                <button disabled={acting === c.id} onClick={() => decide({ c, ownerUid, cloud }, 'changes_requested', false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25 text-xs font-bold hover:bg-amber-500/25 transition-colors disabled:opacity-50">
                  <MessageSquareWarning className="w-3.5 h-3.5" /> Request changes
                </button>
                <button disabled={acting === c.id} onClick={() => decide({ c, ownerUid, cloud }, 'rejected', false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-bold hover:bg-red-500/25 transition-colors disabled:opacity-50">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                {c.status === 'active' && (
                  <button disabled={acting === c.id} onClick={() => setStatus({ c, ownerUid, cloud }, 'paused')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 text-xs font-bold dark:text-gray-300 text-gray-700 hover:text-brand-pink transition-colors disabled:opacity-50">
                    <Clock className="w-3.5 h-3.5" /> Suspend
                  </button>
                )}
                {c.status === 'paused' && (
                  <button disabled={acting === c.id} onClick={() => setStatus({ c, ownerUid, cloud }, 'active')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 text-xs font-bold dark:text-gray-300 text-gray-700 hover:text-brand-pink transition-colors disabled:opacity-50">
                    <CheckCircle className="w-3.5 h-3.5" /> Resume
                  </button>
                )}
                {acting === c.id && <Loader2 className="w-4 h-4 animate-spin text-brand-pink self-center" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Inventory & pricing — placement enable/disable, CPM / CPC /
   fixed rates, minimums, fees, package prices. Saved to the
   shared config so delivery + quoting pick it up, and
   audit-logged.
   ═══════════════════════════════════════════════════════════ */
function InventoryPanel() {
  const [cfg, setCfg] = useState<AdsConfig>(() => { try { return loadConfig() } catch { return DEFAULT_CONFIG } })
  const [saved, setSaved] = useState('')
  const setRate = (pid: string, k: 'cpm' | 'cpc' | 'fixed' | 'enabled', v: number | boolean) =>
    setCfg(c => ({ ...c, rates: { ...c.rates, [pid]: { ...c.rates[pid], [k]: v } } }))
  const setPkg = (id: string, k: 'price' | 'days', v: number) =>
    setCfg(c => ({
      ...c,
      packages: (c.packages && c.packages.length > 0 ? c.packages : PACKAGES).map(p => p.id === id ? { ...p, [k]: v } : p),
    }))
  const save = async () => {
    saveConfig(cfg)
    try {
      await supabase.from('smartzads_config').upsert({ id: 'default', config: cfg, updated_at: new Date().toISOString() })
    } catch { /* table may not exist yet */ }
    writeAudit({ actor: 'admin', action: 'inventory.update', target: 'rates', detail: `minBudget=${cfg.minBudget} minDays=${cfg.minDays} tax=${cfg.taxRate} fee=${cfg.feeRate}` })
    setSaved('Saved — placements, rates, minimums and packages updated.')
    setTimeout(() => setSaved(''), 3500)
  }
  return (
    <div className="space-y-4">
      {saved && <p className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{saved}</p>}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
        <p className="text-sm font-bold dark:text-white text-gray-900 mb-1">Global rules</p>
        <p className="text-[11px] dark:text-gray-500 text-gray-400 mb-3">Enforced by the wizard's budget step and the quoting engine.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { label: 'Min budget (USD)', key: 'minBudget' },
            { label: 'Min duration (days)', key: 'minDays' },
            { label: 'Tax rate (0–1)', key: 'taxRate' },
            { label: 'Platform fee (0–1)', key: 'feeRate' },
          ] as const).map(f => (
            <div key={f.key}>
              <label className="text-[11px] font-semibold dark:text-gray-400 text-gray-600 mb-1 block">{f.label}</label>
              <input type="number" step="any" min={0} value={cfg[f.key] as number}
                onChange={e => setCfg(c => ({ ...c, [f.key]: Math.max(0, Number(e.target.value)) }))}
                className="w-full px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
            </div>
          ))}
        </div>
      </div>
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
        <p className="text-sm font-bold dark:text-white text-gray-900 mb-1">Placements</p>
        <p className="text-[11px] dark:text-gray-500 text-gray-400 mb-3">Disabling a placement stops delivery there immediately; the wizard hides it from advertisers.</p>
        <div className="grid gap-2">
          {PLACEMENTS.map(p => {
            const r = cfg.rates[p.id] || { cpm: 0, cpc: 0, fixed: 0, enabled: false }
            return (
              <div key={p.id} className="flex items-center gap-3 flex-wrap p-3 rounded-xl dark:bg-white/3 bg-gray-50 border dark:border-white/6 border-gray-100">
                <button onClick={() => setRate(p.id, 'enabled', !r.enabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${r.enabled ? 'bg-emerald-500' : 'dark:bg-white/10 bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${r.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-xs font-bold dark:text-white text-gray-900">{p.label}</p>
                  <p className="text-[10px] dark:text-gray-500 text-gray-400">{p.id}{!p.integrated ? ' · needs integration' : ''}</p>
                </div>
                {(['cpm', 'cpc', 'fixed'] as const).map(k => (
                  <label key={k} className="flex items-center gap-1 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase">
                    {k}
                    <input type="number" step="any" min={0} value={r[k] as number}
                      onChange={e => setRate(p.id, k, Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1.5 rounded-lg dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-xs focus:outline-none focus:border-brand-pink" />
                  </label>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
        <p className="text-sm font-bold dark:text-white text-gray-900 mb-1">Packages</p>
        <p className="text-[11px] dark:text-gray-500 text-gray-400 mb-3">Fixed-price bundles offered in the wizard's budget step.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {(cfg.packages && cfg.packages.length > 0 ? cfg.packages : PACKAGES).map(p => (
            <div key={p.id} className="p-3 rounded-xl dark:bg-white/3 bg-gray-50 border dark:border-white/6 border-gray-100">
              <p className="text-xs font-bold dark:text-white text-gray-900">{p.name}</p>
              <div className="flex gap-2 mt-2">
                <label className="flex items-center gap-1 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase">$<input type="number" step="any" min={0} value={p.price} onChange={e => setPkg(p.id, 'price', Math.max(0, Number(e.target.value)))} className="w-20 px-2 py-1.5 rounded-lg dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-xs focus:outline-none focus:border-brand-pink" /></label>
                <label className="flex items-center gap-1 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase">days<input type="number" min={1} value={p.days} onChange={e => setPkg(p.id, 'days', Math.max(1, Math.round(Number(e.target.value))))} className="w-16 px-2 py-1.5 rounded-lg dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-xs focus:outline-none focus:border-brand-pink" /></label>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={save} className="px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all">
        Save inventory & pricing
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Audit log — every privileged SmartzAds action with actor,
   action, target and timestamp.
   ═══════════════════════════════════════════════════════════ */
function AuditPanel() {
  const [rows, setRows] = useState<{ id: string; at: string; actor: string; action: string; target: string; detail?: string }[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      let local: { id: string; at: string; actor: string; action: string; target: string; detail?: string }[] = []
      try { local = JSON.parse(localStorage.getItem('smartzads_audit') || '[]') } catch { /* ignore */ }
      try {
        const { data, error } = await supabase.from('smartzads_audit_log').select('*').order('created_at', { ascending: false }).limit(100)
        if (!error && Array.isArray(data)) {
          const cloud = (data as any[]).map(r => ({ id: String(r.id), at: String(r.created_at), actor: String(r.actor), action: String(r.action), target: String(r.target), detail: String(r.detail || '') }))
          setRows([...cloud, ...local])
          setLoading(false)
          return
        }
      } catch { /* table may not exist yet */ }
      setRows(local)
      setLoading(false)
    })()
  }, [])
  return (
    <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-brand-pink" /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="w-8 h-8 dark:text-gray-600 text-gray-300 mb-3" />
          <p className="text-sm dark:text-gray-500 text-gray-400">No privileged actions recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-white/5 border-gray-100">
                {['Time', 'Actor', 'Action', 'Target', 'Detail'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b dark:border-white/4 border-gray-50">
                  <td className="px-4 py-2.5 text-[11px] dark:text-gray-400 text-gray-500 whitespace-nowrap">{new Date(r.at).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold dark:text-white text-gray-900">{r.actor}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-brand-pink">{r.action}</td>
                  <td className="px-4 py-2.5 text-[11px] font-mono dark:text-gray-400 text-gray-500">{r.target}</td>
                  <td className="px-4 py-2.5 text-[11px] dark:text-gray-400 text-gray-500">{r.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
