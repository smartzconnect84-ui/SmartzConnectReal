import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, CreditCard, Flag, BarChart3, Megaphone,
  ShoppingBag, Tv, Car, Shield, Settings, ChevronRight,
  TrendingUp, TrendingDown, UserCheck, AlertTriangle, DollarSign, Eye,
  Smartphone
} from 'lucide-react'
import AdminPaymentsPanel from '@/components/AdminPaymentsPanel'

const sideItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    active: true  },
  { icon: Users,           label: 'Users',         active: false },
  { icon: Smartphone,      label: 'Payments',      active: false },
  { icon: CreditCard,      label: 'Subscriptions', active: false },
  { icon: Flag,            label: 'Reports',       active: false },
  { icon: BarChart3,       label: 'Analytics',     active: false },
  { icon: Megaphone,       label: 'Broadcasts',    active: false },
  { icon: ShoppingBag,     label: 'Marketplace',   active: false },
  { icon: Tv,              label: 'SmartzTV',      active: false },
  { icon: Car,             label: 'Rides',         active: false },
  { icon: Shield,          label: 'Safety',        active: false },
  { icon: Settings,        label: 'Settings',      active: false },
]

const stats = [
  { label: 'Total Users',    value: '2.4M',  change: '+12.4%', up: true,  icon: Users,        color: 'from-pink-500 to-rose-600' },
  { label: 'Revenue (MTD)',  value: '$84.2K', change: '+8.7%',  up: true,  icon: DollarSign,   color: 'from-purple-500 to-violet-600' },
  { label: 'Active Rides',   value: '1,247', change: '+23.1%', up: true,  icon: Car,          color: 'from-fuchsia-500 to-pink-600' },
  { label: 'Open Reports',   value: '34',    change: '-5.2%',  up: false, icon: AlertTriangle, color: 'from-amber-500 to-orange-600' },
]

const recentUsers = [
  { name: 'Amara K.',    email: 'amara@example.com',   country: '🇱🇷', plan: 'Premium', status: 'active',    joined: '2h ago' },
  { name: 'Kofi A.',     email: 'kofi@example.com',    country: '🇬🇭', plan: 'VIP',     status: 'active',    joined: '5h ago' },
  { name: 'Fatima D.',   email: 'fatima@example.com',  country: '🇸🇳', plan: 'Free',    status: 'active',    joined: '1d ago' },
  { name: 'Emmanuel M.', email: 'emm@example.com',     country: '🇳🇬', plan: 'Premium', status: 'suspended', joined: '2d ago' },
  { name: 'Zara M.',     email: 'zara@example.com',    country: '🇳🇬', plan: 'Free',    status: 'active',    joined: '3d ago' },
]

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('Dashboard')

  return (
    <div className="h-full flex dark:bg-[#0D0A14] bg-gray-50">
      {/* Admin sidebar */}
      <aside className="w-56 dark:bg-[#080510] bg-white border-r dark:border-white/6 border-pink-100 flex flex-col flex-shrink-0 hidden md:flex">
        <div className="px-4 py-4 border-b dark:border-white/6 border-pink-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-love-gradient flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold dark:text-white text-gray-900">Admin Panel</p>
              <p className="text-[10px] dark:text-gray-500 text-gray-400">SmartzConnect</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {sideItems.map(item => (
            <button key={item.label} onClick={() => setActiveSection(item.label)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${activeSection === item.label ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20' : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink'}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t dark:border-white/6 border-pink-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center text-sm">👑</div>
            <div>
              <p className="text-xs font-semibold dark:text-white text-gray-900">CEO Panel</p>
              <p className="text-[10px] text-brand-pink">Full Access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mb-6">
          <h1 className="font-display text-xl font-bold dark:text-white text-gray-900 mb-1">{activeSection}</h1>
          <p className="text-xs dark:text-gray-500 text-gray-500">SmartzConnect Admin · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-pink-100">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="font-display text-xl font-bold dark:text-white text-gray-900">{stat.value}</p>
              <p className="text-[10px] dark:text-gray-500 text-gray-400 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Broadcast',    emoji: '📢', color: 'from-pink-500/10 to-rose-500/10 border-pink-500/20' },
            { label: 'Verify Users', emoji: '✅', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20' },
            { label: 'View Reports', emoji: '🚨', color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20' },
            { label: 'Analytics',    emoji: '📊', color: 'from-purple-500/10 to-violet-500/10 border-purple-500/20' },
          ].map(action => (
            <button key={action.label} className={`flex items-center gap-2 p-3 rounded-xl border bg-gradient-to-br ${action.color} hover:scale-[1.02] transition-all`}>
              <span className="text-xl">{action.emoji}</span>
              <span className="text-xs font-semibold dark:text-white text-gray-900">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Recent users table */}
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-pink-100 overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-pink-100">
            <h3 className="text-sm font-semibold dark:text-white text-gray-900">Recent Users</h3>
            <button className="flex items-center gap-1 text-xs text-brand-pink hover:underline">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-white/5 border-gray-100">
                  {['User', 'Country', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/4 divide-gray-50">
                {recentUsers.map((user, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="hover:dark:bg-white/2 hover:bg-pink-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold dark:text-white text-gray-900">{user.name}</p>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{user.country}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.plan === 'VIP' ? 'bg-amber-500/15 text-amber-400' : user.plan === 'Premium' ? 'bg-pink-500/15 text-brand-pink' : 'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-600'}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] dark:text-gray-500 text-gray-400">{user.joined}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="w-6 h-6 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors">
                          <Eye className="w-3 h-3 dark:text-gray-400 text-gray-600" />
                        </button>
                        <button className="w-6 h-6 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/10 transition-colors">
                          <UserCheck className="w-3 h-3 dark:text-gray-400 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Money Payments Panel */}
        {(activeSection === 'Dashboard' || activeSection === 'Payments') && (
          <AdminPaymentsPanel />
        )}
      </div>
    </div>
  )
}
