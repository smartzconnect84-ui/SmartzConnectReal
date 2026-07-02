import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, CheckCircle, XCircle, Eye, Search, Filter, Package, TrendingUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string; name: string; seller: string; sellerAvatar: string; category: string
  price: string; images: string; status: 'pending' | 'approved' | 'rejected'
  submitted: string; country: string; description: string
}

const categories = ['All', 'Electronics', 'Fashion', 'Beauty', 'Music', 'Food', 'Art']
const statusColors = {
  pending:  'bg-amber-500/15 text-amber-500 border-amber-500/25',
  approved: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
  rejected: 'bg-red-500/15 text-red-500 border-red-500/25',
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminMarketplace() {
  const [list, setList] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSales, setTotalSales] = useState(0)
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('id, title, description, price, currency, category, image_url, emoji, country, moderation_status, sold_count, created_at, seller_id, profiles:seller_id(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(60)

    if (!error && data) {
      const mapped: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.title,
        seller: p.profiles?.full_name || 'Unknown Seller',
        sellerAvatar: p.profiles?.avatar_url || '',
        category: p.category || 'Other',
        price: `${p.currency || 'USD'} ${Number(p.price).toLocaleString()}`,
        images: p.emoji || '📦',
        status: (p.moderation_status || 'approved') as Product['status'],
        submitted: timeAgo(p.created_at),
        country: p.country || 'Africa',
        description: p.description || '',
      }))
      setList(mapped)
      setTotalSales(data.reduce((sum: number, p: any) => sum + (p.sold_count || 0) * Number(p.price || 0), 0))
    }
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const filtered = list.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter
    const matchCat = category === 'All' || p.category === category
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.seller.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchCat && matchSearch
  })

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setList(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    await supabase.from('marketplace_items').update({ moderation_status: status }).eq('id', id)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Marketplace</h1>
        <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Review and approve product listings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Listings', value: list.length.toString(), icon: ShoppingBag, color: 'from-pink-500 to-rose-600' },
          { label: 'Pending Review', value: list.filter(p => p.status === 'pending').length.toString(), icon: Package, color: 'from-amber-500 to-orange-600' },
          { label: 'Approved',       value: list.filter(p => p.status === 'approved').length.toString(), icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
          { label: 'Total Sales',    value: `$${totalSales.toLocaleString()}`, icon: TrendingUp, color: 'from-purple-500 to-violet-600' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="font-display font-black text-2xl dark:text-white text-gray-900">{s.value}</p>
              <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or sellers..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500 self-center" />
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${category === c ? 'bg-love-gradient text-white' : 'dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-pink animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 dark:text-gray-500 text-gray-400 text-sm">No products found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
              <div className="h-32 dark:bg-white/5 bg-gray-50 flex items-center justify-center text-5xl border-b dark:border-white/5 border-gray-100 overflow-hidden">
                {p.images.startsWith('http') ? <img src={p.images} alt={p.name} className="w-full h-full object-cover" /> : p.images}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold dark:text-white text-gray-900 truncate">{p.name}</h4>
                    <p className="text-[10px] dark:text-gray-400 text-gray-500 mt-0.5">{p.category}</p>
                  </div>
                  <span className="font-black text-sm text-brand-pink ml-2 flex-shrink-0">{p.price}</span>
                </div>
                <p className="text-[11px] dark:text-gray-400 text-gray-500 mb-3 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] dark:text-gray-300 text-gray-700 font-semibold truncate">{p.seller}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${statusColors[p.status]}`}>{p.status}</span>
                </div>
                {p.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(p.id, 'approved')} className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => updateStatus(p.id, 'rejected')} className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {p.status !== 'pending' && (
                  <button className="w-full py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1 hover:text-brand-pink transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
