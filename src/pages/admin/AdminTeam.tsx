import { useState, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users2, Plus, Crown, Shield, Eye, Edit, Trash2, X,
  RefreshCw, ToggleLeft, ToggleRight, Star, MapPin,
  AlertCircle, Loader2, CheckCircle, Link2, Calendar,
  ChevronUp, ChevronDown,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ImageUploader from '@/components/admin/ImageUploader'

interface TeamMember {
  id: string
  full_name: string
  role: string
  bio: string | null
  photo_url: string | null
  emoji: string | null
  country: string | null
  organization: string | null
  skills: string[] | null
  linkedin_url: string | null
  twitter_url: string | null
  joined_year: string | null
  display_order: number
  is_active: boolean
  is_advisor: boolean
  created_at: string
}

const EMPTY_FORM: Omit<TeamMember, 'id' | 'created_at'> = {
  full_name: '',
  role: '',
  bio: '',
  photo_url: '',
  emoji: '',
  country: '',
  organization: '',
  skills: [],
  linkedin_url: '',
  twitter_url: '',
  joined_year: '',
  display_order: 0,
  is_active: true,
  is_advisor: false,
}

type Filter = 'all' | 'active' | 'inactive' | 'advisor'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold dark:text-gray-300 text-gray-700 mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}


export default function AdminTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<TeamMember | null>(null)
  const [form, setForm] = useState<Omit<TeamMember, 'id' | 'created_at'>>(EMPTY_FORM)
  const [skillsInput, setSkillsInput] = useState('')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchMembers = async () => {
    setLoading(true)
    setDbError(null)
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      setDbError(error.message)
      setMembers([])
    } else {
      // Deduplicate by id to prevent double rows
      const unique = Array.from(new Map((data || []).map((m: any) => [m.id, m])).values())
      setMembers(
        unique.map((m: any) => ({
          ...m,
          skills: Array.isArray(m.skills) ? m.skills : [],
        }))
      )
    }
    setLoading(false)
  }

  const cleanDuplicateMembers = async () => {
    // Keep earliest row per full_name; delete the rest
    const sorted = [...members].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    const seen = new Map<string, string>()
    const toDelete: string[] = []
    for (const m of sorted) {
      const key = (m.full_name || '').toLowerCase().trim()
      if (seen.has(key)) toDelete.push(m.id)
      else seen.set(key, m.id)
    }
    if (toDelete.length === 0) { showToast('No duplicates found.'); return }
    const confirmed = window.confirm(
      `Remove ${toDelete.length} duplicate member${toDelete.length > 1 ? 's' : ''} (same name, older entries kept)? This cannot be undone.`
    )
    if (!confirmed) return
    await Promise.all(toDelete.map(id => supabase.from('team_members').delete().eq('id', id)))
    showToast(`Removed ${toDelete.length} duplicate(s).`)
    fetchMembers()
  }

  useEffect(() => { fetchMembers() }, [])

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setSkillsInput('')
    setShowForm(true)
  }

  const openEdit = (m: TeamMember) => {
    setEditTarget(m)
    setForm({
      full_name:    m.full_name,
      role:         m.role,
      bio:          m.bio || '',
      photo_url:    m.photo_url || '',
      emoji:        m.emoji || '',
      country:      m.country || '',
      organization: m.organization || '',
      skills:       m.skills || [],
      linkedin_url: m.linkedin_url || '',
      twitter_url:  m.twitter_url || '',
      joined_year:  m.joined_year || '',
      display_order:m.display_order,
      is_active:    m.is_active,
      is_advisor:   m.is_advisor,
    })
    setSkillsInput((m.skills || []).join(', '))
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.role.trim()) {
      showToast('Full name and role are required.', false)
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      skills: skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      full_name:    form.full_name.trim(),
      role:         form.role.trim(),
      bio:          form.bio?.trim() || null,
      photo_url:    form.photo_url?.trim() || null,
      emoji:        form.emoji?.trim() || null,
      country:      form.country?.trim() || null,
      organization: form.organization?.trim() || null,
      linkedin_url: form.linkedin_url?.trim() || null,
      twitter_url:  form.twitter_url?.trim() || null,
      joined_year:  form.joined_year?.trim() || null,
    }

    let error
    if (editTarget) {
      ;({ error } = await supabase.from('team_members').update(payload).eq('id', editTarget.id))
    } else {
      ;({ error } = await supabase.from('team_members').insert(payload))
    }

    if (error) {
      showToast(error.message, false)
    } else {
      showToast(editTarget ? 'Member updated.' : 'Member added.')
      setShowForm(false)
      fetchMembers()
    }
    setSaving(false)
  }

  const handleToggleActive = async (m: TeamMember) => {
    const { error } = await supabase
      .from('team_members')
      .update({ is_active: !m.is_active })
      .eq('id', m.id)
    if (error) { showToast(error.message, false) } else {
      showToast(m.is_active ? 'Member deactivated.' : 'Member activated.')
      fetchMembers()
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const { error } = await supabase.from('team_members').delete().eq('id', confirmDelete.id)
    if (error) { showToast(error.message, false) } else {
      showToast('Member removed.')
      setConfirmDelete(null)
      fetchMembers()
    }
  }

  const handleReorder = async (m: TeamMember, dir: 'up' | 'down') => {
    const list = [...members].sort((a, b) => a.display_order - b.display_order)
    const idx = list.findIndex(x => x.id === m.id)
    const swap = dir === 'up' ? list[idx - 1] : list[idx + 1]
    if (!swap) return
    await Promise.all([
      supabase.from('team_members').update({ display_order: swap.display_order }).eq('id', m.id),
      supabase.from('team_members').update({ display_order: m.display_order }).eq('id', swap.id),
    ])
    fetchMembers()
  }

  const filtered = members.filter(m => {
    if (filter === 'active')   return m.is_active && !m.is_advisor
    if (filter === 'inactive') return !m.is_active
    if (filter === 'advisor')  return m.is_advisor
    return true
  })

  const stats = [
    { label: 'Total Members', value: members.length,                          color: 'from-pink-500 to-rose-600' },
    { label: 'Active',        value: members.filter(m => m.is_active).length, color: 'from-emerald-500 to-teal-600' },
    { label: 'Advisors',      value: members.filter(m => m.is_advisor).length,color: 'from-purple-500 to-violet-600' },
    { label: 'Inactive',      value: members.filter(m => !m.is_active).length,color: 'from-gray-500 to-gray-600' },
  ]

  const inp = "w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}
          >
            {toast.ok
              ? <CheckCircle className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />
            }
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Team Members</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">
            Manage the SmartzConnect team shown on the public Team page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMembers} className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:text-brand-pink transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={cleanDuplicateMembers}
            className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-xs font-semibold hover:text-red-500 transition-colors" title="Remove duplicate members with same name">
            <Trash2 className="w-3.5 h-3.5" /> Clean Dupes
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <Users2 className="w-4 h-4 text-white" />
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
            <p className="font-semibold text-amber-400 text-sm mb-0.5">Database not connected</p>
            <p className="text-xs dark:text-gray-400 text-gray-600">{dbError}</p>
            <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">Run <code className="font-mono bg-amber-500/10 px-1 rounded">supabase/RUN_IN_SUPABASE.sql</code> in your Supabase SQL Editor to create the team_members table.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'inactive', 'advisor'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
            {f} {f === 'all' ? `(${members.length})` : f === 'active' ? `(${members.filter(m => m.is_active && !m.is_advisor).length})` : f === 'inactive' ? `(${members.filter(m => !m.is_active).length})` : `(${members.filter(m => m.is_advisor).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-pink" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <Users2 className="w-8 h-8 dark:text-gray-600 text-gray-300 mx-auto mb-3" />
            <p className="text-sm dark:text-gray-500 text-gray-400">No members found</p>
            <button onClick={openAdd} className="mt-3 text-xs text-brand-pink font-semibold hover:underline">+ Add first member</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-white/5 border-gray-100">
                  {['Order', 'Member', 'Role', 'Country / Org', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <motion.tr key={m.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={`border-b dark:border-white/4 border-gray-50 hover:dark:bg-white/2 hover:bg-pink-50/30 transition-colors ${!m.is_active ? 'opacity-50' : ''}`}>

                    {/* Order */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => handleReorder(m, 'up')} className="w-5 h-5 rounded hover:dark:bg-white/8 hover:bg-gray-100 flex items-center justify-center">
                          <ChevronUp className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                        </button>
                        <span className="text-[10px] text-center dark:text-gray-500 text-gray-400 font-mono">{m.display_order}</span>
                        <button onClick={() => handleReorder(m, 'down')} className="w-5 h-5 rounded hover:dark:bg-white/8 hover:bg-gray-100 flex items-center justify-center">
                          <ChevronDown className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                        </button>
                      </div>
                    </td>

                    {/* Member */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-[180px]">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                          {m.photo_url
                            ? <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                            : <span className="text-xl">{m.emoji || '👤'}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold dark:text-white text-gray-900 truncate">{m.full_name}</p>
                            {m.is_advisor && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/25">
                                <Star className="w-2 h-2" /> Advisor
                              </span>
                            )}
                          </div>
                          {m.joined_year && (
                            <p className="text-[10px] dark:text-gray-500 text-gray-400 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> Since {m.joined_year}
                            </p>
                          )}
                          {(m.skills || []).length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {(m.skills || []).slice(0, 2).map(s => (
                                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600">{s}</span>
                              ))}
                              {(m.skills || []).length > 2 && (
                                <span className="text-[9px] dark:text-gray-500 text-gray-400">+{(m.skills || []).length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className="text-xs dark:text-gray-300 text-gray-700 font-medium">{m.role}</span>
                    </td>

                    {/* Country / Org */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {m.country && (
                          <p className="text-xs dark:text-gray-400 text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {m.country}
                          </p>
                        )}
                        {m.organization && (
                          <p className="text-[10px] dark:text-gray-500 text-gray-400">{m.organization}</p>
                        )}
                        {m.linkedin_url && (
                          <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                            <Link2 className="w-2.5 h-2.5" /> LinkedIn
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.is_active
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                          : 'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-500 dark:border-white/10 border-gray-200'
                      }`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(m)} title="Edit"
                          className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                          <Edit className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                        </button>
                        <button onClick={() => handleToggleActive(m)} title={m.is_active ? 'Deactivate' : 'Activate'}
                          className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
                          {m.is_active
                            ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                            : <ToggleLeft className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
                          }
                        </button>
                        <button onClick={() => setConfirmDelete(m)} title="Delete"
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
                    {editTarget ? 'Edit Member' : 'Add Team Member'}
                  </h3>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
                    This will appear on the public Team page
                  </p>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/10 transition-colors">
                  <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
                </button>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4">

                {/* Row 1 */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name *">
                    <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="e.g. Shedrick K. Nungehn" className={inp} />
                  </Field>
                  <Field label="Role / Title *">
                    <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                      placeholder="e.g. Founder & CEO" className={inp} />
                  </Field>
                </div>

                {/* Row 2 */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Country">
                    <input value={form.country || ''} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                      placeholder="e.g. Liberia 🇱🇷" className={inp} />
                  </Field>
                  <Field label="Organization">
                    <input value={form.organization || ''} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))}
                      placeholder="e.g. SmartzConnect Inc." className={inp} />
                  </Field>
                </div>

                {/* Row 3 */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Photo">
                    <ImageUploader
                      value={form.photo_url || null}
                      onChange={url => setForm(p => ({ ...p, photo_url: url || '' }))}
                      folder="photos"
                      label="Photo"
                      assetName={form.full_name || 'team-member'}
                    />
                  </Field>
                  <Field label="Emoji (fallback)">
                    <input value={form.emoji || ''} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))}
                      placeholder="👨🏿‍💼" className={inp} />
                  </Field>
                  <Field label="Joined Year">
                    <input value={form.joined_year || ''} onChange={e => setForm(p => ({ ...p, joined_year: e.target.value }))}
                      placeholder="2024" className={inp} />
                  </Field>
                </div>

                {/* Bio */}
                <Field label="Bio">
                  <textarea value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    rows={3} placeholder="Short biography..."
                    className={`${inp} resize-none`} />
                </Field>

                {/* Skills */}
                <Field label="Skills (comma separated)">
                  <input value={skillsInput} onChange={e => setSkillsInput(e.target.value)}
                    placeholder="Leadership, Product Vision, Strategy" className={inp} />
                </Field>

                {/* Social links */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="LinkedIn URL">
                    <input value={form.linkedin_url || ''} onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/..." className={inp} />
                  </Field>
                  <Field label="Twitter / X URL">
                    <input value={form.twitter_url || ''} onChange={e => setForm(p => ({ ...p, twitter_url: e.target.value }))}
                      placeholder="https://x.com/..." className={inp} />
                  </Field>
                </div>

                {/* Display order */}
                <Field label="Display Order (lower = first)">
                  <input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: Number(e.target.value) }))}
                    className={inp} />
                </Field>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <button type="button" onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                      className={`w-9 h-5 rounded-full transition-colors relative ${form.is_active ? 'bg-emerald-500' : 'dark:bg-white/20 bg-gray-200'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-4.5 translate-x-0' : 'left-0.5'}`} style={{ left: form.is_active ? '18px' : '2px' }} />
                    </button>
                    <span className="text-xs font-semibold dark:text-gray-300 text-gray-700">
                      {form.is_active ? 'Active (shown publicly)' : 'Inactive (hidden)'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <button type="button" onClick={() => setForm(p => ({ ...p, is_advisor: !p.is_advisor }))}
                      className={`w-9 h-5 rounded-full transition-colors relative ${form.is_advisor ? 'bg-purple-500' : 'dark:bg-white/20 bg-gray-200'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all`} style={{ left: form.is_advisor ? '18px' : '2px' }} />
                    </button>
                    <span className="text-xs font-semibold dark:text-gray-300 text-gray-700">
                      {form.is_advisor ? 'Advisor' : 'Core Team'}
                    </span>
                  </label>
                </div>
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
                    : <><CheckCircle className="w-4 h-4" /> {editTarget ? 'Save Changes' : 'Add Member'}</>
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
              className="w-full max-w-sm dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-display font-black text-lg dark:text-white text-gray-900 mb-1">Remove Member?</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-5">
                <span className="font-semibold dark:text-white text-gray-900">{confirmDelete.full_name}</span> will be permanently removed from the team page.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-bold hover:bg-red-500/20 transition-colors">
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs dark:text-gray-500 text-gray-400 pt-2">
        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Members appear on the public <code className="font-mono dark:bg-white/5 bg-gray-100 px-1 rounded">/team</code> page</span>
        <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Only active members are shown publicly</span>
        <span className="flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> CEO card is always pinned first on the public page</span>
      </div>
    </div>
  )
}
