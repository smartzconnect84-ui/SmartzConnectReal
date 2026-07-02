import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone, Eye, TrendingUp, DollarSign, Plus, CheckCircle,
  Clock, BarChart3, RefreshCw, X, Loader2, Database, Search
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

const defaultForm = {
  title: '', advertiser: '', type: 'banner' as Ad['type'],
  budget_usd: '', placement: '', start_date: '', end_date: '',
}

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dbConnected, setDbConnected] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [creating, setCreating] = useState(false)

  const fetchAds = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.message.includes('does not exist')) {
        setDbConnected(false)
      }
      setLoading(false)
      return
    }

    setDbConnected(true)
    setAds((data || []) as Ad[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAds() }, [fetchAds])

  const updateStatus = async (id: string, status: Ad['status']) => {
    await supabase.from('ad_campaigns').update({ status }).eq('id', id)
    setAds(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const createCampaign = async () => {
    if (!form.title || !form.advertiser) return
    setCreating(true)
    await supabase.from('ad_campaigns').insert({
      title: form.title,
      advertiser: form.advertiser,
      type: form.type,
      budget_usd: parseFloat(form.budget_usd) || 0,
      spent_usd: 0,
      impressions: 0,
      clicks: 0,
      status: 'pending',
      placement: form.placement || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    })
    await fetchAds()
    setShowCreate(false)
    setForm(defaultForm)
    setCreating(false)
  }

  const filtered = ads
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.advertiser.toLowerCase().includes(search.toLowerCase()))

  const totalRevenue = ads.filter(a => a.status !== 'pending').reduce((s, a) => s + (a.spent_usd || 0), 0)
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0)
  const avgCtr = ads.length > 0
    ? ((ads.reduce((s, a) => s + (a.clicks || 0), 0) / Math.max(totalImpressions, 1)) * 100).toFixed(2)
    : '0.00'

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">SmartzAds</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Manage ad campaigns and track performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAds} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 hover:text-brand-pink transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>
      </div>

      {/* ── Subscription Flyers Preview ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl overflow-hidden border dark:border-white/8 border-gray-200 shadow-lg group hover:shadow-xl transition-all">
          <div className="relative">
            <img src="/flyer-ordinary.png" alt="Ordinary Plan Flyer" className="w-full object-cover scale-80 md:scale-100 transition-transform duration-700" />
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 text-white text-[10px] font-bold">ORD Flyer</div>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-lg shadow-amber-500/10 group hover:shadow-xl transition-all">
          <div className="relative">
            <img src="/flyer-vip.png" alt="VIP Plan Flyer" className="w-full object-cover scale-80 md:scale-100 transition-transform duration-700" />
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-500/80 text-white text-[10px] font-bold">👑 VIP Flyer</div>
          </div>
        </div>
      </div>

      {/* DB warning */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ad Revenue (MTD)', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'from-pink-500 to-rose-600' },
          { label: 'Active Campaigns', value: ads.filter(a => a.status === 'active').length.toString(), icon: Megaphone, color: 'from-purple-500 to-violet-600' },
          { label: 'Total Impressions', value: totalImpressions >= 1000 ? `${(totalImpressions/1000).toFixed(1)}K` : totalImpressions.toString(), icon: Eye, color: 'from-fuchsia-500 to-pink-600' },
          { label: 'Avg CTR', value: `${avgCtr}%`, icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {loading ? (
                <div className="h-7 w-16 dark:bg-white/10 bg-gray-200 rounded animate-pulse mb-1" />
              ) : (
                <p className="font-display font-black text-2xl dark:text-white text-gray-900">{s.value}</p>
              )}
              <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..."
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

      {/* Table */}
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
              <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-brand-pink hover:underline">
                Create your first campaign →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-white/5 border-gray-100">
                  {['Campaign', 'Type', 'Budget', 'Spent', 'Impressions', 'Clicks', 'CTR', 'Status', 'Actions'].map(h => (
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
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold dark:text-white text-gray-900">{a.title}</p>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400">{a.advertiser}{a.placement ? ` · ${a.placement}` : ''}</p>
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
                          <button className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-blue-500/10 transition-colors">
                            <BarChart3 className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                          </button>
                          {a.status === 'pending' && (
                            <button onClick={() => updateStatus(a.id, 'active')} className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                          )}
                          {a.status === 'active' && (
                            <button onClick={() => updateStatus(a.id, 'paused')} className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center hover:bg-amber-500/20 transition-colors">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                          )}
                          {a.status === 'paused' && (
                            <button onClick={() => updateStatus(a.id, 'active')} className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                          )}
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

      {/* Create campaign modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-black text-xl dark:text-white text-gray-900">New Campaign</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Campaign Title', key: 'title', type: 'text', placeholder: 'e.g. MTN MoMo Promo' },
                { label: 'Advertiser', key: 'advertiser', type: 'text', placeholder: 'e.g. MTN Liberia' },
                { label: 'Budget (USD)', key: 'budget_usd', type: 'number', placeholder: '500' },
                { label: 'Placement', key: 'placement', type: 'text', placeholder: 'Feed, Discover, etc.' },
                { label: 'Start Date', key: 'start_date', type: 'date', placeholder: '' },
                { label: 'End Date', key: 'end_date', type: 'date', placeholder: '' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Ad['type'] }))}
                  className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink">
                  <option value="banner">Banner</option>
                  <option value="video">Video</option>
                  <option value="sponsored">Sponsored</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">Cancel</button>
              <button onClick={createCampaign} disabled={creating || !form.title || !form.advertiser}
                className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
