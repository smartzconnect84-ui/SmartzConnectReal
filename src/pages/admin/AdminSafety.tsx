import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, RefreshCw, Plus, Trash2, Edit3, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SafetyRule {
  id: number
  title: string
  body: string
  icon: string
  order_num: number
  active: boolean
}

interface FeaturePerm {
  id: number
  feature_key: string
  label: string
  description: string
  free_enabled: boolean
  premium_enabled: boolean
  vip_enabled: boolean
}

export default function AdminSafety() {
  const [rules, setRules] = useState<SafetyRule[]>([])
  const [perms, setPerms] = useState<FeaturePerm[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'rules' | 'permissions'>('rules')
  const [editRule, setEditRule] = useState<SafetyRule | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newRule, setNewRule] = useState({ title: '', body: '', icon: 'Shield', order_num: 1 })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [rulesRes, permsRes] = await Promise.all([
      supabase.from('safety_rules').select('*').order('order_num'),
      supabase.from('feature_permissions').select('*').order('id'),
    ])
    setRules(rulesRes.data || [])
    setPerms(permsRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const toggleRule = async (id: number, active: boolean) => {
    await supabase.from('safety_rules').update({ active: !active }).eq('id', id)
    await fetchData()
  }

  const deleteRule = async (id: number) => {
    await supabase.from('safety_rules').delete().eq('id', id)
    await fetchData()
  }

  const saveRule = async () => {
    setSaving(true)
    if (editRule) {
      await supabase.from('safety_rules').update({ title: editRule.title, body: editRule.body }).eq('id', editRule.id)
    } else {
      await supabase.from('safety_rules').insert({ ...newRule, active: true })
    }
    await fetchData()
    setEditRule(null)
    setShowAdd(false)
    setSaving(false)
  }

  const togglePerm = async (id: number, field: 'free_enabled' | 'premium_enabled' | 'vip_enabled', current: boolean) => {
    await supabase.from('feature_permissions').update({ [field]: !current }).eq('id', id)
    await fetchData()
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Safety & Permissions</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-0.5">Manage safety rules and feature access</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 dark:bg-white/5 bg-gray-100 rounded-xl w-fit">
        {(['rules', 'permissions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-love-gradient text-white shadow-sm' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
            {t === 'rules' ? '🛡️ Safety Rules' : '🔑 Feature Permissions'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-brand-pink" /></div>
      ) : tab === 'rules' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/25">
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>
          {rules.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-love-soft border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-brand-pink" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold dark:text-white text-gray-900 mb-1">{r.title}</p>
                    <p className="text-sm dark:text-gray-400 text-gray-600">{r.body}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleRule(r.id, r.active)} className={`transition-colors ${r.active ? 'text-emerald-500' : 'dark:text-gray-600 text-gray-300'}`}>
                    {r.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button onClick={() => setEditRule(r)} className="p-1.5 rounded-lg hover:dark:bg-white/8 hover:bg-gray-100 transition-colors dark:text-gray-400 text-gray-500 hover:text-brand-pink">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteRule(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:border-white/6 border-gray-100 border-b">
                  <th className="text-left px-4 py-3 text-xs font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wide">Feature</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wide">Free</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-pink-500 uppercase tracking-wide">Premium</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-amber-500 uppercase tracking-wide">VIP</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/4 divide-gray-100">
                {perms.map(p => (
                  <tr key={p.id} className="hover:dark:bg-white/2 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold dark:text-white text-gray-900 text-sm">{p.label}</p>
                      <p className="text-xs dark:text-gray-500 text-gray-400">{p.description}</p>
                    </td>
                    {(['free_enabled', 'premium_enabled', 'vip_enabled'] as const).map(field => (
                      <td key={field} className="px-4 py-3 text-center">
                        <button onClick={() => togglePerm(p.id, field, p[field])}
                          className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${p[field] ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 hover:bg-emerald-500/25' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-600 text-gray-300 border dark:border-white/8 border-gray-200 hover:dark:bg-white/10 hover:bg-gray-200'}`}>
                          {p[field] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Add modal */}
      {(editRule || showAdd) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setEditRule(null); setShowAdd(false) }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">
            <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-5">{editRule ? 'Edit Rule' : 'Add Safety Rule'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Title</label>
                <input value={editRule ? editRule.title : newRule.title}
                  onChange={e => editRule ? setEditRule({ ...editRule, title: e.target.value }) : setNewRule(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink" />
              </div>
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Body</label>
                <textarea value={editRule ? editRule.body : newRule.body}
                  onChange={e => editRule ? setEditRule({ ...editRule, body: e.target.value }) : setNewRule(p => ({ ...p, body: e.target.value }))}
                  rows={4} className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-brand-pink resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEditRule(null); setShowAdd(false) }} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">Cancel</button>
              <button onClick={saveRule} disabled={saving} className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
