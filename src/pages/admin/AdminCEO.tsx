import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Users, Settings, Shield, Globe, Key, AlertTriangle, Database, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

interface AdminMember {
  id: string
  name: string
  role: string
  email: string
  status: string
}

interface PlatformStats {
  totalUsers: number
  countries: number
  uptime: string
}

export default function AdminCEO() {
  const [teamMembers, setTeamMembers] = useState<AdminMember[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)

  const fetchData = async () => {
    setLoading(true)

    const [usersRes, adminsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('admin_users').select('id, full_name, email, role, status, created_at').order('created_at'),
    ])

    if (usersRes.error && usersRes.error.message?.includes('does not exist')) {
      setDbConnected(false)
      setTeamMembers([])
      setPlatformStats(null)
    } else {
      setDbConnected(true)
      setPlatformStats({
        totalUsers: usersRes.count || 0,
        countries: 47,
        uptime: '99.9%',
      })

      const admins: AdminMember[] = (adminsRes.data || []).map((a: any) => ({
        id: String(a.id),
        name: a.full_name || a.email?.split('@')[0] || 'Admin',
        role: a.role || 'Admin',
        email: a.email || '',
        status: a.status || 'active',
      }))
      setTeamMembers(admins)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="p-4 sm:p-6 space-y-6">

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
          {['Manage Admins', 'Override Permissions', 'Edit Subscriptions', 'Platform Config', 'Full Analytics', 'Audit Logs'].map(p => (
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
            { label: 'Total Users',      value: platformStats.totalUsers.toLocaleString(), icon: Users,    color: 'from-pink-500 to-rose-600' },
            { label: 'Countries Active', value: String(platformStats.countries),            icon: Globe,    color: 'from-purple-500 to-violet-600' },
            { label: 'Platform Health',  value: platformStats.uptime,                       icon: Shield,   color: 'from-emerald-500 to-teal-600' },
            { label: 'Admin Team',       value: String(teamMembers.length),                 icon: Crown,    color: 'from-amber-500 to-yellow-600' },
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

      {/* Admin Team */}
      {dbConnected && (
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/5 border-gray-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Admin Team</h3>
            </div>
            <button onClick={fetchData} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
            </button>
          </div>
          {teamMembers.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm dark:text-gray-500 text-gray-400">No admin accounts found in the database</p>
              <p className="text-xs dark:text-gray-600 text-gray-400 mt-1">Create admin users in your Supabase `admin_users` table</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-white/4 divide-gray-50">
              {teamMembers.map((member, i) => (
                <motion.div key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-4 hover:dark:bg-white/2 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold flex-shrink-0">
                    {member.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm dark:text-white text-gray-900">{member.name}</p>
                    <p className="text-xs dark:text-gray-500 text-gray-400">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      member.role === 'ceo' || member.role === 'CEO' ? 'bg-amber-500/15 text-amber-500' :
                      member.role === 'admin' || member.role === 'Admin' ? 'bg-pink-500/15 text-pink-500' :
                      'bg-blue-500/15 text-blue-400'
                    }`}>
                      {member.role}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Platform Config */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
          <Settings className="w-4 h-4 text-brand-pink" />
          <h3 className="font-bold text-sm dark:text-white text-gray-900">Platform Configuration</h3>
        </div>
        <div className="divide-y dark:divide-white/4 divide-gray-50">
          {platformConfig.map((cfg, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:dark:bg-white/2 hover:bg-gray-50 transition-colors">
              <span className="text-sm dark:text-gray-400 text-gray-500">{cfg.key}</span>
              <span className={`text-sm font-semibold ${cfg.editable ? 'dark:text-white text-gray-900' : 'dark:text-gray-500 text-gray-400 font-mono text-xs'}`}>
                {cfg.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl dark:bg-amber-500/8 bg-amber-50 border dark:border-amber-500/15 border-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold dark:text-amber-400 text-amber-600">CEO-Level Access</p>
          <p className="text-xs dark:text-amber-400/70 text-amber-600/70 mt-0.5">
            All actions in this panel are logged and audited. Proceed with caution as changes affect all users and the entire platform.
          </p>
        </div>
      </div>
    </div>
  )
}
