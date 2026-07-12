import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid3X3, Plus, Trash2, Edit, X, Save, RefreshCw,
  ToggleLeft, ToggleRight, AlertCircle, Loader2, CheckCircle,
  ChevronUp, ChevronDown, Globe, EyeOff, Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ImageUploader from '@/components/admin/ImageUploader'
import { invalidateServicesCache } from '@/hooks/useServices'

interface Service {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  image_url: string | null
  route: string | null
  category: string | null
  connector: string
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

const EMPTY_FORM: Omit<Service, 'id' | 'created_at' | 'updated_at'> = {
  slug: '',
  name: '',
  description: '',
  icon: '',
  image_url: null,
  route: '',
  category: '',
  connector: 'None',
  enabled: true,
  sort_order: 0,
}

const CONNECTORS = [
  'None',
  'Supabase',
  'LiveKit',
  'Mux',
  'Stripe',
  'Sufy',
  'GetStream',
  'OneSignal',
  'Turnstile',
  'Other',
]
const CATEGORIES = ['Commerce', 'Social', 'Entertainment', 'Learning', 'Utility']

const CONNECTOR_COLORS: Record<string, string> = {
  LiveKit:   'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  Mux:       'bg-pink-500/15 text-pink-400 border-pink-500/25',
  Stripe:    'bg-violet-500/15 text-violet-400 border-violet-500/25',
  Sufy:      'bg-sky-500/15 text-sky-400 border-sky-500/25',
  Supabase:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  GetStream: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  OneSignal: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  Turnstile: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  None:      'bg-gray-500/15 text-gray-400 border-gray-500/25',
  Other:     'bg-amber-500/15 text-amber-400 border-amber-500/25',
}

const CATEGORY_COLORS: Record<string, string> = {
  Commerce:      'bg-amber-500/15 text-amber-400',
  Social:        'bg-blue-500/15 text-blue-400',
  Entertainment: 'bg-purple-500/15 text-purple-400',
  Learning:      'bg-teal-500/15 text-teal-400',
  Utility:       'bg-gray-500/15 text-gray-400',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold dark:text-gray-300 text-gray-700 mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null)
  const [form, setForm] = useState<Omit<Service, 'id' | 'created_at' | 'updated_at'>>(EMPTY_FORM)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const inp = "w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setDbError(null)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      setDbError(error.message)
      setServices([])
    } else {
      setServices(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])

  const openAdd = () => {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, sort_order: services.length + 1 })
    setShowForm(true)
  }

  const openEdit = (s: Service) => {
    setEditTarget(s)
    setForm({
      slug:        s.slug,
      name:        s.name,
      description: s.description || '',
      icon:        s.icon || '',
      image_url:   s.image_url,
      route:       s.route || '',
      category:    s.category || '',
      connector:   s.connector || 'None',
      enabled:     s.enabled,
      sort_order:  s.sort_order,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Service name is required.', false); return }
    if (!form.slug.trim()) { showToast('Slug is required.', false); return }
    setSaving(true)

    const payload = {
      ...form,
      name:        form.name.trim(),
      slug:        form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: form.description?.trim() || null,
      icon:        form.icon?.trim() || null,
      route:       form.route?.trim() || null,
      category:    form.category?.trim() || null,
    }

    let error: any
    if (editTarget) {
      ;({ error } = await supabase.from('services').update(payload).eq('id', editTarget.id))
    } else {
      ;({ error } = await supabase.from('services').insert(payload))
    }

    if (error) {
      showToast(error.message, false)
    } else {
      invalidateServicesCache()
      showToast(editTarget ? 'Service updated.' : 'Service added.')
      setShowForm(false)
      fetchServices()
    }
    setSaving(false)
  }

  const handleToggleEnabled = async (s: Service) => {
    // Optimistic update
    const prev = s.enabled
    setServices(list => list.map(x => x.id === s.id ? { ...x, enabled: !prev } : x))
    setTogglingId(s.id)
    const { error } = await supabase
      .from('services')
      .update({ enabled: !prev })
      .eq('id', s.id)
    setTogglingId(null)
    if (error) {
      // Revert on failure
      setServices(list => list.map(x => x.id === s.id ? { ...x, enabled: prev } : x))
      showToast(error.message, false)
    } else {
      invalidateServicesCache()
      showToast(!prev ? `"${s.name}" enabled.` : `"${s.name}" disabled.`)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const { error } = await supabase.from('services').delete().eq('id', confirmDelete.id)
    if (error) { showToast(error.message, false) } else {
      invalidateServicesCache()
      showToast('Service removed.')
      setConfirmDelete(null)
      fetchServices()
    }
  }

  const handleReorder = async (s: Service, dir: 'up' | 'down') => {
    const list = [...services].sort((a, b) => a.sort_order - b.sort_order)
    const idx = list.findIndex(x => x.id === s.id)
    const swap = dir === 'up' ? list[idx - 1] : list[idx + 1]
    if (!swap) return
    await Promise.all([
      supabase.from('services').update({ sort_order: swap.sort_order }).eq('id', s.id),
      supabase.from('services').update({ sort_order: s.sort_order }).eq('id', swap.id),
    ])
    fetchServices()
  }

  const stats = [
    { label: 'Total',    value: services.length,                          color: 'from-pink-500 to-rose-600' },
    { label: 'Enabled',  value: services.filter(s => s.enabled).length,   color: 'from-emerald-500 to-teal-600' },
    { label: 'Disabled', value: services.filter(s => !s.enabled).length,  color: 'from-gray-500 to-gray-600' },
    { label: 'With Image',value: services.filter(s => s.image_url).length, color: 'from-violet-500 to-purple-600' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}
          >
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Service Management</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">
            Control which services are live on the public site — toggle, edit, reorder, and upload cover images.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchServices} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Service
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <Grid3X3 className="w-4 h-4 text-white" />
            </div>
            <p className="font-display font-black text-2xl dark:text-white text-gray-900">{s.value}</p>
            <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* DB Error */}
      {dbError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-400 text-sm mb-0.5">Database table not found</p>
            <p className="text-xs dark:text-gray-400 text-gray-600">{dbError}</p>
            <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">
              Run <code className="font-mono bg-amber-500/10 px-1 rounded">supabase/schema_v21_services.sql</code> in your Supabase SQL Editor to create the services table.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-pink" />
          </div>
        ) : services.length === 0 && !dbError ? (
          <div className="text-center py-14">
            <Grid3X3 className="w-8 h-8 dark:text-gray-600 text-gray-300 mx-auto mb-3" />
            <p className="text-sm dark:text-gray-500 text-gray-400">No services yet</p>
            <button onClick={openAdd} className="mt-3 text-xs text-brand-pink font-semibold hover:underline">+ Add first service</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-white/5 border-gray-100">
                  {['Order', 'Service', 'Category', 'Connector', 'Route', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((s, i) => (
                  <motion.tr key={s.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={`border-b dark:border-white/4 border-gray-50 hover:dark:bg-white/2 hover:bg-pink-50/30 transition-colors ${!s.enabled ? 'opacity-50' : ''}`}>

                    {/* Order */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => handleReorder(s, 'up')} className="w-5 h-5 rounded hover:dark:bg-white/8 hover:bg-gray-100 flex items-center justify-center">
                          <ChevronUp className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                        </button>
                        <span className="text-[10px] text-center dark:text-gray-500 text-gray-400 font-mono">{s.sort_order}</span>
                        <button onClick={() => handleReorder(s, 'down')} className="w-5 h-5 rounded hover:dark:bg-white/8 hover:bg-gray-100 flex items-center justify-center">
                          <ChevronDown className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                        </button>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-[180px]">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                          {s.image_url
                            ? <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                            : <span className="text-xl">{s.icon || '🔧'}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold dark:text-white text-gray-900 truncate">{s.name}</p>
                          <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate font-mono">{s.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {s.category ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${CATEGORY_COLORS[s.category] || 'bg-gray-500/15 text-gray-400'}`}>
                          {s.category}
                        </span>
                      ) : (
                        <span className="text-xs dark:text-gray-500 text-gray-400">—</span>
                      )}
                    </td>

                    {/* Connector */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CONNECTOR_COLORS[s.connector] || CONNECTOR_COLORS['None']}`}>
                        {s.connector}
                      </span>
                    </td>

                    {/* Route */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] dark:text-gray-400 text-gray-500 font-mono truncate max-w-[120px] block">
                        {s.route || '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        s.enabled
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                          : 'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-500 dark:border-white/10 border-gray-200'
                      }`}>
                        {s.enabled ? 'Live' : 'Hidden'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} title="Edit"
                          className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                          <Edit className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                        </button>
                        <button onClick={() => handleToggleEnabled(s)} title={s.enabled ? 'Disable' : 'Enable'}
                          disabled={togglingId === s.id}
                          className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-amber-500/10 hover:text-amber-500 transition-colors disabled:opacity-50">
                          {togglingId === s.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin dark:text-gray-400 text-gray-600" />
                            : s.enabled
                              ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                              : <ToggleLeft className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
                          }
                        </button>
                        <button onClick={() => setConfirmDelete(s)} title="Delete"
                          className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl dark:bg-[#1A1228] bg-white rounded-3xl border dark:border-white/8 border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b dark:border-white/6 border-gray-200 flex-shrink-0">
                <div>
                  <h3 className="font-display font-black text-lg dark:text-white text-gray-900">
                    {editTarget ? 'Edit Service' : 'Add Service'}
                  </h3>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
                    Changes are reflected on the public site immediately
                  </p>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/10 transition-colors">
                  <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
                </button>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4">

                {/* Row 1: Name + Slug */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Service Name *">
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. SmartzRide" className={inp} />
                  </Field>
                  <Field label="Slug * (URL-safe identifier)">
                    <input value={form.slug}
                      onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                      placeholder="e.g. smartzride" className={inp} />
                  </Field>
                </div>

                {/* Description */}
                <Field label="Description">
                  <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="Short description shown on the public site..."
                    className={`${inp} resize-none`} />
                </Field>

                {/* Row 2: Icon + Route */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Icon (emoji or lucide name)">
                    <input value={form.icon || ''} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                      placeholder="e.g. 🚗 or Car" className={inp} />
                  </Field>
                  <Field label="Public Route">
                    <input value={form.route || ''} onChange={e => setForm(p => ({ ...p, route: e.target.value }))}
                      placeholder="e.g. /smartzride" className={inp} />
                  </Field>
                </div>

                {/* Row 3: Category + Connector */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Category">
                    <select value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className={inp}>
                      <option value="">— Select category —</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Connector / Integration">
                    <select value={form.connector} onChange={e => setForm(p => ({ ...p, connector: e.target.value }))}
                      className={inp}>
                      {CONNECTORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Sort order */}
                <Field label="Sort Order (lower = first)">
                  <input type="number" value={form.sort_order}
                    onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
                    className={inp} />
                </Field>

                {/* Cover image */}
                <Field label="Cover Image">
                  <ImageUploader
                    value={form.image_url}
                    onChange={url => setForm(p => ({ ...p, image_url: url }))}
                    folder="photos"
                    label=""
                    assetName={form.slug || form.name || 'service'}
                  />
                </Field>

                {/* Enabled toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <button type="button" onClick={() => setForm(p => ({ ...p, enabled: !p.enabled }))}
                    className={`w-9 h-5 rounded-full transition-colors relative ${form.enabled ? 'bg-emerald-500' : 'dark:bg-white/20 bg-gray-200'}`}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                      style={{ left: form.enabled ? '18px' : '2px' }} />
                  </button>
                  <span className="text-xs font-semibold dark:text-gray-300 text-gray-700">
                    {form.enabled
                      ? <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-emerald-500" /> Live (visible on public site)</span>
                      : <span className="flex items-center gap-1"><EyeOff className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" /> Hidden (not shown publicly)</span>
                    }
                  </span>
                </label>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 p-5 border-t dark:border-white/6 border-gray-200 flex-shrink-0">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold hover:dark:bg-white/10 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Save className="w-4 h-4" /> {editTarget ? 'Save Changes' : 'Add Service'}</>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm dark:bg-[#1A1228] bg-white rounded-3xl border dark:border-white/8 border-gray-200 shadow-2xl p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-display font-black text-lg dark:text-white text-gray-900 mb-1">Delete Service?</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-5">
                Remove <strong className="dark:text-white text-gray-900">{confirmDelete.name}</strong> permanently? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold hover:dark:bg-white/10 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="rounded-2xl dark:bg-white/3 bg-gray-50 border dark:border-white/6 border-gray-200 p-4">
        <p className="text-xs font-bold dark:text-gray-500 text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Connector Guide
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CONNECTOR_COLORS).map(([key, cls]) => (
            <span key={key} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{key}</span>
          ))}
        </div>
        <p className="text-[11px] dark:text-gray-500 text-gray-400 mt-2">
          The connector indicates which external service or integration this platform feature depends on. Disabling a service here hides it from the public site — it does not affect the underlying integration.
          Store only public/non-secret config here (display name, icon, route, image). Private API secrets (e.g. LiveKit API secret, Stream Chat secret, Mux private token) must stay in Supabase Edge Function secrets — never in this table.
        </p>
      </div>
    </div>
  )
}
