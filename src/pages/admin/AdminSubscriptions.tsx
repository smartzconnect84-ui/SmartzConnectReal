import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Zap, Heart, RefreshCw, Plus, Check, Loader2, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UserSub {
  id: number
  user_id: number
  user_email?: string
  user_name?: string
  plan_id: string
  status: string
  started_at: string
  expires_at: string | null
  payment_ref: string | null
  notes: string | null
}

interface Plan {
  id: string
  name: string
  price_usd: number
  badge: string | null
  is_active: boolean
}

const planIcon = (id: string) => {
  if (id === 'vip') return <Crown className="w-4 h-4 text-amber-500" />
  if (id === 'premium') return <Zap className="w-4 h-4 text-pink-500" />
  return <Heart className="w-4 h-4 text-gray-400" />
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<UserSub[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showGrant, setShowGrant] = useState(false)
  const [grantForm, setGrantForm] = useState({ userId: '', planId: 'premium', days: '30', paymentRef: '', notes: '' })
  const [granting, setGranting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [subsRes, plansRes] = await Promise.all([
      supabase.from('user_subscriptions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('subscription_plans').select('*').order('sort_order'),
    ])
    setSubs(subsRes.data || [])
    setPlans(plansRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const grantPlan = async () => {
    if (!grantForm.userId || !grantForm.planId) return
    setGranting(true)
    const expires = new Date()
    expires.setDate(expires.getDate() + parseInt(grantForm.days))
    await supabase.from('user_subscriptions').insert({
      user_id: parseInt(grantForm.userId),
      plan_id: grantForm.planId,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: expires.toISOString(),
      payment_ref: grantForm.paymentRef || null,
      notes: grantForm.notes || null,
      is_active: true,
    })
    await supabase.from('users').update({ subscription_tier: grantForm.planId }).eq('id', parseInt(grantForm.userId))
    await fetchData()
    setShowGrant(false)
    setGranting(false)
  }

  const revokeSub = async (subId: number, userId: number) => {
    await supabase.from('user_subscriptions').update({ status: 'cancelled', is_active: false }).eq('id', subId)
    await supabase.from('users').update({ subscription_tier: null }).eq('id', userId)
    await fetchData()
  }

  const filtered = subs.filter(s =>
    !search || (s.user_email || '').toLowerCase().includes(search.toLowerCase()) || (s.user_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: 'Total Subs', value: subs.length, color: 'text-brand-pink' },
    { label: 'Active', value: subs.filter(s => s.status === 'active').length, color: 'text-emerald-500' },
    { label: 'VIP', value: subs.filter(s => s.plan_id === 'vip').length, color: 'text-amber-500' },
    { label: 'Premium', value: subs.filter(s => s.plan_id === 'premium').length, color: 'text-pink-500' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Subscriptions</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-0.5">Manage user plans and billing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowGrant(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/25">
            <Plus className="w-4 h-4" /> Grant Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-200">
            <p className={`font-display font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Plans overview with features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            id: 'free',
            name: 'Free',
            price_usd: 0,
            badge: null,
            color: 'text-gray-400',
            border: 'dark:border-white/6 border-gray-200',
            features: [
              '10 swipes per day',
              'Basic profile & bio',
              'World Chat access',
              'View public stories',
              'SmartzTV (watch only)',
              'Basic search & discovery',
              'SmartzMarket browsing',
              'Group chat (join only)',
              'Standard notifications',
            ],
          },
          {
            id: 'premium',
            name: 'Premium',
            price_usd: 9.99,
            badge: 'Popular',
            color: 'text-pink-400',
            border: 'border-pink-500/40',
            features: [
              'Unlimited swipes & matches',
              'See who liked your profile',
              'Profile boost (3× visibility)',
              'Priority message delivery',
              'Advanced match filters',
              'Post stories (photos + text)',
              'Go live on SmartzTV',
              'Create group chat rooms',
              'SmartzRide booking access',
              'Marketplace seller account',
              'Ad-free experience',
              'Voice & video calls',
              'Verified badge eligibility',
              'Priority support',
            ],
          },
          {
            id: 'vip',
            name: 'VIP',
            price_usd: 24.99,
            badge: 'Best Value',
            color: 'text-amber-400',
            border: 'border-amber-500/40',
            features: [
              'Everything in Premium',
              '5× profile boost (max visibility)',
              'Super Likes (10/day)',
              'Instant match notifications',
              'See full visitor list',
              'Custom profile frame & badge',
              'Exclusive VIP dating pool',
              'Priority live stream placement',
              'Spin & Chat unlimited',
              'In-app wallet credits monthly',
              'Promotional ads discount (20%)',
              'WorldStage performer access',
              'Dedicated VIP support channel',
              'Early access to new features',
            ],
          },
        ].map(plan => {
          const dbPlan = plans.find(p => p.id === plan.id)
          const activeSubs = subs.filter(s => s.plan_id === plan.id && s.status === 'active').length
          return (
            <div key={plan.id} className={`dark:bg-[#130E1E] bg-white rounded-2xl p-5 border ${plan.border} dark:border-opacity-100 relative overflow-hidden`}>
              {plan.badge && (
                <span className="absolute top-3 right-3 text-[9px] font-black px-2 py-1 rounded-full bg-love-gradient text-white shadow-md">
                  {plan.badge}
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                {planIcon(plan.id)}
                <span className="font-bold dark:text-white text-gray-900">{dbPlan?.name || plan.name}</span>
              </div>
              <p className="font-display font-black text-3xl dark:text-white text-gray-900">
                {plan.price_usd === 0 ? 'Free' : `$${plan.price_usd}`}
                {plan.price_usd > 0 && <span className="text-sm font-normal dark:text-gray-400 text-gray-500">/mo</span>}
              </p>
              <p className="text-xs dark:text-gray-500 text-gray-400 mt-1 mb-4">
                {activeSubs} active subscriber{activeSubs !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1.5 border-t dark:border-white/5 border-gray-100 pt-3">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className={`w-3 h-3 flex-shrink-0 ${plan.color}`} />
                    <span className="text-[11px] dark:text-gray-300 text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subscriptions..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
      </div>

      {/* Table */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-brand-pink" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:border-white/6 border-gray-100 border-b">
                  {['User ID', 'Plan', 'Status', 'Started', 'Expires', 'Payment Ref', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/4 divide-gray-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:dark:bg-white/2 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs dark:text-gray-300 text-gray-700">#{s.user_id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">{planIcon(s.plan_id)}<span className="font-semibold dark:text-white text-gray-900 capitalize">{s.plan_id}</span></div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-100 dark:bg-white/5 dark:text-gray-400 text-gray-500 dark:border-white/8 border-gray-200'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs dark:text-gray-400 text-gray-500">{new Date(s.started_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs dark:text-gray-400 text-gray-500">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono dark:text-gray-400 text-gray-500">{s.payment_ref || '—'}</td>
                    <td className="px-4 py-3">
                      {s.status === 'active' && (
                        <button onClick={() => revokeSub(s.id, s.user_id)} className="text-xs text-red-500 hover:underline">Revoke</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 dark:text-gray-500 text-gray-400 text-sm">No subscriptions found</div>}
          </div>
        )}
      </div>

      {/* Grant modal */}
      {showGrant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGrant(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">
            <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-6">Grant Subscription Plan</h3>
            <div className="space-y-4">
              {[
                { label: 'User ID', key: 'userId', type: 'number', placeholder: 'e.g. 73' },
                { label: 'Duration (days)', key: 'days', type: 'number', placeholder: '30' },
                { label: 'Payment Reference', key: 'paymentRef', type: 'text', placeholder: 'MoMo TX ID or note' },
                { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Optional admin note' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">{f.label}</label>
                  <input type={f.type} value={(grantForm as any)[f.key]} onChange={e => setGrantForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Plan</label>
                <select value={grantForm.planId} onChange={e => setGrantForm(p => ({ ...p, planId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink">
                  {plans.filter(p => p.id !== 'free').map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ${p.price_usd}/mo</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGrant(false)} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">Cancel</button>
              <button onClick={grantPlan} disabled={granting} className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2">
                {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Grant Plan</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
