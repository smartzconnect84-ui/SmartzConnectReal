import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, Users, Settings, Shield, Globe, Key, AlertTriangle, Database,
  RefreshCw, Plus, Edit, Trash2, Download, X, Save, CheckCircle,
  AlertCircle, Loader2, Mail, Briefcase, UserCheck, ToggleLeft, ToggleRight,
  Eye, EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ImageUploader from '@/components/admin/ImageUploader'

// ── Types ─────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  department?: string | null
  responsibilities?: string | null
  avatar_url?: string | null
  created_at?: string
}

type RoleKey = 'ceo' | 'super_admin' | 'admin' | 'moderator' | 'support'

const ROLE_META: Record<RoleKey, {
  label: string
  color: string
  bg: string
  badge: string
  responsibilities: string[]
}> = {
  ceo: {
    label: 'CEO',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    badge: 'from-amber-500 to-yellow-600',
    responsibilities: [
      'Strategic platform direction & executive decisions',
      'Override any admin permission on the platform',
      'Full financial control & subscription pricing',
      'Audit log access — all actions by all admins',
      'Emergency platform shutdown or maintenance mode',
      'Hire and revoke admin team access',
    ],
  },
  super_admin: {
    label: 'Super Admin',
    color: 'text-pink-400',
    bg: 'bg-pink-500/15',
    badge: 'from-pink-500 to-rose-600',
    responsibilities: [
      'Full user account management (ban, delete, restore)',
      'Platform settings & feature toggles',
      'Broadcast messages to all users',
      'Analytics & revenue reporting',
      'Content moderation oversight',
      'Admin account creation (below CEO level)',
    ],
  },
  admin: {
    label: 'Admin',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    badge: 'from-blue-500 to-indigo-600',
    responsibilities: [
      'User support and account assistance',
      'Review and action user-submitted reports',
      'Content review and moderation decisions',
      'Marketplace listing management',
      'Blog & CMS content updates',
      'Broadcast messages (with approval)',
    ],
  },
  moderator: {
    label: 'Moderator',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    badge: 'from-purple-500 to-violet-600',
    responsibilities: [
      'Review flagged posts, comments, and profiles',
      'Enforce community guidelines',
      'Temporary content removal pending review',
      'Issue warnings to users violating policy',
      'WorldChat moderation and message removal',
      'Escalate serious violations to admins',
    ],
  },
  support: {
    label: 'Support',
    color: 'text-teal-400',
    bg: 'bg-teal-500/15',
    badge: 'from-teal-500 to-emerald-600',
    responsibilities: [
      'Answer user live chat and support tickets',
      'Guide users through account and billing issues',
      'Verify identity documents for profile badges',
      'Report platform bugs to engineering',
      'Manage subscription upgrade/downgrade requests',
      'Collect and triage user feedback',
    ],
  },
}

const ROLE_OPTIONS = ['ceo', 'super_admin', 'admin', 'moderator', 'support']
const DEPT_OPTIONS = ['Executive', 'Engineering', 'Operations', 'Marketing', 'Customer Support', 'Moderation', 'Finance', 'Legal']

// ── Platform Config ────────────────────────────────────────────────────────────

const platformConfig = [
  { key: 'Platform Name',       value: 'SmartzConnect',              editable: true },
  { key: 'Version',             value: 'v2.4.1',                     editable: false },
  { key: 'Default Currency',    value: 'USD',                        editable: true },
  { key: 'Primary Market',      value: 'Liberia, Africa',            editable: true },
  { key: 'Support Email',       value: 'support@smartzconnect.com',  editable: true },
  { key: 'Business Email',      value: 'business@smartzconnect.com', editable: true },
  { key: 'WhatsApp',            value: '+231 776 679 963',           editable: true },
  { key: 'Max Free Swipes/Day', value: '10',                         editable: true },
  { key: 'Premium Price',       value: '$9.99/mo',                   editable: true },
  { key: 'VIP Price',           value: '$24.99/mo',                  editable: true },
]

interface PlatformStats {
  totalUsers: number
  countries: number
  uptime: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function roleKey(role: string): RoleKey {
  const r = role?.toLowerCase().replace('-', '_') as RoleKey
  return ROLE_META[r] ? r : 'admin'
}

/** Escape a CSV cell: double any internal quotes, wrap in quotes.
 *  Prepend a tab to neutralise spreadsheet formula injection (=, @, +, -). */
function csvCell(value: string): string {
  const safe = (value ?? '').replace(/"/g, '""')
  // Neutralise formula injection
  const neutralised = /^[=@+\-]/.test(safe) ? `\t${safe}` : safe
  return `"${neutralised}"`
}

function exportCSV(staff: StaffMember[]) {
  const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Joined']
  const rows = staff.map(s => [
    csvCell(s.full_name),
    csvCell(s.email),
    csvCell(s.role),
    csvCell(s.department || ''),
    csvCell(s.status),
    csvCell(s.created_at ? new Date(s.created_at).toLocaleDateString() : ''),
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `staff-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const inp = 'w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors'
const sel = inp + ' appearance-none'

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminCEO() {
  const [staff, setStaff]               = useState<StaffMember[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading]           = useState(true)
  const [dbConnected, setDbConnected]   = useState(false)
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null)
  const [showForm, setShowForm]         = useState(false)
  const [editTarget, setEditTarget]     = useState<StaffMember | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<StaffMember | null>(null)
  const [saving, setSaving]             = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleKey>('admin')
  const [configEdit, setConfigEdit]     = useState<Record<string, string>>({})
  const [expandedConfig, setExpandedConfig] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'admin',
    department: '',
    responsibilities: '',
    status: 'active',
    avatar_url: '',
  })

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = async () => {
    setLoading(true)
    const [usersRes, adminsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('admin_users').select('*').order('created_at'),
    ])

    if (usersRes.error && usersRes.error.message?.includes('does not exist')) {
      setDbConnected(false)
      setStaff([])
      setPlatformStats(null)
    } else {
      setDbConnected(true)
      setPlatformStats({ totalUsers: usersRes.count || 0, countries: 47, uptime: '99.9%' })
      setStaff((adminsRes.data || []).map((a: any) => ({
        id: String(a.id),
        full_name: a.full_name || a.email?.split('@')[0] || 'Staff',
        email: a.email || '',
        role: a.role || 'admin',
        status: a.status || 'active',
        department: a.department || null,
        responsibilities: a.responsibilities || null,
        avatar_url: a.avatar_url || null,
        created_at: a.created_at,
      })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // ── Form helpers ─────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditTarget(null)
    setSelectedRole('admin')
    setForm({ full_name: '', email: '', role: 'admin', department: '', responsibilities: '', status: 'active', avatar_url: '' })
    setShowForm(true)
  }

  const openEdit = (s: StaffMember) => {
    setEditTarget(s)
    const rk = roleKey(s.role)
    setSelectedRole(rk)
    setForm({
      full_name: s.full_name,
      email: s.email,
      role: s.role,
      department: s.department || '',
      responsibilities: s.responsibilities || ROLE_META[rk].responsibilities.join('\n'),
      status: s.status,
      avatar_url: s.avatar_url || '',
    })
    setShowForm(true)
  }

  const handleRoleChange = (role: string) => {
    const rk = roleKey(role)
    setSelectedRole(rk)
    setForm(p => ({
      ...p,
      role,
      responsibilities: p.responsibilities || ROLE_META[rk].responsibilities.join('\n'),
    }))
  }

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      showToast('Name and email are required', false)
      return
    }
    setSaving(true)
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      ...(form.department ? { department: form.department } : {}),
      ...(form.responsibilities ? { responsibilities: form.responsibilities } : {}),
      ...(form.avatar_url ? { avatar_url: form.avatar_url } : {}),
    }

    let error: any
    if (editTarget) {
      ;({ error } = await supabase.from('admin_users').update(payload).eq('id', editTarget.id))
    } else {
      ;({ error } = await supabase.from('admin_users').insert(payload))
    }

    if (error) {
      // Retry without extra columns only if the error is a missing-column schema error
      const isMissingColumn =
        error.message?.includes('column') ||
        error.message?.includes('does not exist') ||
        (error as any).code === '42703'  // PostgreSQL undefined_column

      if (!isMissingColumn) {
        showToast(error.message || 'Save failed', false)
        setSaving(false)
        return
      }

      const minimal = { full_name: payload.full_name, email: payload.email, role: payload.role, status: payload.status }
      let retryError: any
      if (editTarget) {
        ;({ error: retryError } = await supabase.from('admin_users').update(minimal).eq('id', editTarget.id))
      } else {
        ;({ error: retryError } = await supabase.from('admin_users').insert(minimal))
      }
      if (retryError) {
        showToast(retryError.message || 'Save failed', false)
        setSaving(false)
        return
      }
    }

    showToast(editTarget ? 'Staff member updated' : 'Staff member added')
    setShowForm(false)
    setSaving(false)
    fetchData()
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const { error } = await supabase.from('admin_users').delete().eq('id', confirmDelete.id)
    if (error) { showToast(error.message, false) }
    else { showToast('Staff member removed'); setConfirmDelete(null); fetchData() }
  }

  const handleToggleStatus = async (s: StaffMember) => {
    const newStatus = s.status === 'active' ? 'inactive' : 'active'
    await supabase.from('admin_users').update({ status: newStatus }).eq('id', s.id)
    fetchData()
  }

  const roleMeta = ROLE_META[selectedRole]

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CEO Header */}
      <div className="dark:bg-gradient-to-r dark:from-amber-500/10 dark:to-yellow-500/5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-3xl border dark:border-amber-500/20 border-amber-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">CEO Panel</h1>
            <p className="text-sm dark:text-amber-400 text-amber-600 font-semibold">Highest permission level · Full platform control</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {['Staff Management', 'Override Permissions', 'Edit Subscriptions', 'Platform Config', 'Full Analytics', 'Audit Logs'].map(p => (
            <span key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full dark:bg-amber-500/15 bg-amber-100 dark:text-amber-400 text-amber-700 text-xs font-semibold border dark:border-amber-500/25 border-amber-200">
              <Key className="w-3 h-3" /> {p}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 animate-pulse">
              <div className="h-8 dark:bg-white/10 bg-gray-200 rounded mb-2 w-1/2" />
              <div className="h-4 dark:bg-white/10 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : !dbConnected ? (
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-8 text-center">
          <Database className="w-10 h-10 dark:text-gray-600 text-gray-400 mx-auto mb-3" />
          <p className="font-bold dark:text-white text-gray-900 mb-1">Database not connected</p>
          <p className="text-sm dark:text-gray-400 text-gray-500 mb-4">Configure Supabase to see real platform metrics</p>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold mx-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : platformStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Users',      value: platformStats.totalUsers.toLocaleString(), icon: Users,      color: 'from-pink-500 to-rose-600' },
            { label: 'Countries Active', value: String(platformStats.countries),            icon: Globe,      color: 'from-purple-500 to-violet-600' },
            { label: 'Platform Health',  value: platformStats.uptime,                       icon: Shield,     color: 'from-emerald-500 to-teal-600' },
            { label: 'Staff Members',    value: String(staff.length),                       icon: UserCheck,  color: 'from-amber-500 to-yellow-600' },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black dark:text-white text-gray-900">{s.value}</p>
                <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
              </motion.div>
            )
          })}
        </div>
      ) : null}

      {/* ── Staff Management ─────────────────────────────────────────────────── */}
      {dbConnected && (
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/5 border-gray-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Staff Management</h3>
              <span className="text-xs dark:text-gray-500 text-gray-400 ml-1">({staff.length} members)</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => exportCSV(staff)} title="Export CSV"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink text-xs font-semibold transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button onClick={fetchData} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
              </button>
              <button onClick={openAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-90 transition-opacity">
                <Plus className="w-3.5 h-3.5" /> Add Staff
              </button>
            </div>
          </div>

          {/* Role Responsibilities Reference */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-3">Role Responsibilities</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.entries(ROLE_META) as [RoleKey, typeof ROLE_META[RoleKey]][]).map(([key, meta]) => (
                <div key={key} className={`p-3 rounded-xl border dark:border-white/5 border-gray-100 ${meta.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-black uppercase tracking-wide ${meta.color}`}>{meta.label}</span>
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${meta.badge}`} />
                  </div>
                  <ul className="space-y-0.5">
                    {meta.responsibilities.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-[10px] dark:text-gray-400 text-gray-600 flex items-start gap-1">
                        <span className={`${meta.color} mt-0.5 flex-shrink-0`}>·</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Table */}
          {staff.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-8 h-8 dark:text-gray-600 text-gray-300 mx-auto mb-3" />
              <p className="text-sm dark:text-gray-500 text-gray-400">No staff members found</p>
              <button onClick={openAdd} className="mt-3 text-xs text-brand-pink font-semibold hover:underline">+ Add first staff member</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b dark:border-white/5 border-gray-100">
                    {['Member', 'Role', 'Department', 'Responsibilities', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member, i) => {
                    const rk = roleKey(member.role)
                    const meta = ROLE_META[rk]
                    return (
                      <motion.tr key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className={`border-b dark:border-white/4 border-gray-50 hover:dark:bg-white/2 hover:bg-pink-50/30 transition-colors ${member.status !== 'active' ? 'opacity-50' : ''}`}>

                        {/* Member */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-love-soft">
                              {member.avatar_url
                                ? <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                : <span className="text-sm font-black text-brand-pink">{member.full_name[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold dark:text-white text-gray-900 truncate">{member.full_name}</p>
                              <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate">{member.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${meta.bg} ${meta.color}`}>
                            {meta.label}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3">
                          <span className="text-xs dark:text-gray-400 text-gray-500">
                            {member.department || <span className="italic opacity-50">—</span>}
                          </span>
                        </td>

                        {/* Responsibilities */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="text-[10px] dark:text-gray-500 text-gray-400 line-clamp-2">
                            {member.responsibilities || meta.responsibilities[0]}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleStatus(member)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                              member.status === 'active' ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-500 text-gray-400 hover:bg-gray-200'
                            }`}>
                            {member.status === 'active'
                              ? <><CheckCircle className="w-2.5 h-2.5" /> Active</>
                              : <><AlertCircle className="w-2.5 h-2.5" /> Inactive</>
                            }
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(member)} title="Edit"
                              className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                              <Edit className="w-3 h-3" />
                            </button>
                            <button onClick={() => setConfirmDelete(member)} title="Delete"
                              className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-red-500 transition-colors">
                              <Trash2 className="w-3 h-3" />
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
      )}

      {/* Platform Config */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        <button onClick={() => setExpandedConfig(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 border-b dark:border-white/5 border-gray-100 hover:dark:bg-white/2 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-pink" />
            <h3 className="font-bold text-sm dark:text-white text-gray-900">Platform Configuration</h3>
          </div>
          <span className="text-xs dark:text-gray-500 text-gray-400">{expandedConfig ? 'Collapse' : 'Expand'}</span>
        </button>
        <AnimatePresence>
          {expandedConfig && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="divide-y dark:divide-white/4 divide-gray-50">
                {platformConfig.map((cfg, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:dark:bg-white/2 hover:bg-gray-50 transition-colors gap-4">
                    <span className="text-sm dark:text-gray-400 text-gray-500 flex-shrink-0">{cfg.key}</span>
                    {cfg.editable ? (
                      <input
                        value={configEdit[cfg.key] ?? cfg.value}
                        onChange={e => setConfigEdit(p => ({ ...p, [cfg.key]: e.target.value }))}
                        className="text-sm font-semibold dark:text-white text-gray-900 bg-transparent border-b dark:border-white/10 border-gray-200 focus:outline-none focus:border-brand-pink text-right transition-colors min-w-0 w-48"
                      />
                    ) : (
                      <span className="text-sm dark:text-gray-500 text-gray-400 font-mono text-xs">{cfg.value}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4">
                <button onClick={() => showToast('Configuration saved locally')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold mt-2">
                  <Save className="w-3.5 h-3.5" /> Save Config
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl dark:bg-amber-500/8 bg-amber-50 border dark:border-amber-500/15 border-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold dark:text-amber-400 text-amber-600">CEO-Level Access</p>
          <p className="text-xs dark:text-amber-400/70 text-amber-600/70 mt-0.5">
            All actions in this panel are logged and audited. Proceed with caution — changes affect all users and the entire platform.
          </p>
        </div>
      </div>

      {/* ── Add/Edit Staff Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl dark:bg-[#1A1228] bg-white rounded-3xl border dark:border-white/8 border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between px-6 py-5 border-b dark:border-white/8 border-gray-100 sticky top-0 dark:bg-[#1A1228] bg-white z-10 rounded-t-3xl">
                <div>
                  <h3 className="font-display font-black text-lg dark:text-white text-gray-900">
                    {editTarget ? 'Edit Staff Member' : 'Add Staff Member'}
                  </h3>
                  <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">Assign role, department and responsibilities</p>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Avatar */}
                <ImageUploader
                  value={form.avatar_url || null}
                  onChange={url => setForm(p => ({ ...p, avatar_url: url || '' }))}
                  folder="avatars"
                  label="Avatar"
                  assetName={form.full_name || 'staff'}
                />

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Full Name *</label>
                    <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Jane Doe" className={inp} />
                  </div>
                  <div>
                    <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="jane@smartzconnect.com" className={inp} />
                  </div>
                </div>

                {/* Role & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Role *</label>
                    <select value={form.role} onChange={e => handleRoleChange(e.target.value)} className={sel}>
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{ROLE_META[roleKey(r)]?.label || r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Department</label>
                    <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className={sel}>
                      <option value="">Select department…</option>
                      {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Role responsibilities preview */}
                <div className={`p-4 rounded-xl border ${roleMeta.bg} dark:border-white/5 border-gray-100`}>
                  <p className={`text-xs font-black uppercase tracking-wide mb-2 ${roleMeta.color}`}>
                    {roleMeta.label} — Default Responsibilities
                  </p>
                  <ul className="space-y-1">
                    {roleMeta.responsibilities.map((r, i) => (
                      <li key={i} className="text-xs dark:text-gray-400 text-gray-600 flex items-start gap-1.5">
                        <span className={`${roleMeta.color} mt-0.5 flex-shrink-0`}>✓</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Custom responsibilities */}
                <div>
                  <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">
                    Custom Responsibilities <span className="font-normal opacity-60">(optional override, one per line)</span>
                  </label>
                  <textarea value={form.responsibilities} onChange={e => setForm(p => ({ ...p, responsibilities: e.target.value }))}
                    rows={4} placeholder="Enter custom responsibilities, one per line…"
                    className={inp + ' resize-none'} />
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Status</label>
                  <div className="flex gap-3">
                    {['active', 'inactive', 'suspended'].map(s => (
                      <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                          form.status === s
                            ? s === 'active' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' : s === 'suspended' ? 'bg-red-500/15 border-red-500/30 text-red-500' : 'dark:bg-white/5 bg-gray-100 dark:border-white/10 border-gray-200 dark:text-white text-gray-900'
                            : 'dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-500 hover:border-gray-300'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold hover:opacity-80 transition-opacity">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !form.full_name.trim() || !form.email.trim()}
                  className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Staff Member'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-display font-black text-lg dark:text-white text-gray-900 mb-1">Remove Staff Member?</h3>
              <p className="text-sm dark:text-gray-400 text-gray-500 mb-6">
                This will permanently remove <strong className="dark:text-white text-gray-900">{confirmDelete.full_name}</strong> and revoke their admin access.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
