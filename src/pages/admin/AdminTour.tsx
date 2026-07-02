import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Flag, BarChart3, Megaphone,
  ShoppingBag, Tv, Car, FileText, Shield, Megaphone as Ad,
  Settings, Users2, ScrollText, Crown, ChevronRight
} from 'lucide-react'

const pages = [
  {
    num: '01', icon: LayoutDashboard, label: 'Dashboard',       path: '/admin',              color: 'from-pink-500 to-rose-600',
    desc: 'Platform overview — KPI stats, recent users, quick actions, Mobile Money payments panel',
    features: ['Total users, revenue, rides, reports', 'Recent signups table', 'Quick action buttons', 'MoMo payments panel'],
  },
  {
    num: '02', icon: Users,           label: 'Users',            path: '/admin/users',        color: 'from-fuchsia-500 to-pink-600',
    desc: 'Full user management — search, filter, ban, verify, view profiles',
    features: ['Search & filter by country/plan/status', 'Ban / suspend / verify actions', 'User detail drawer', 'Export CSV'],
  },
  {
    num: '03', icon: CreditCard,      label: 'Subscriptions',    path: '/admin/subscriptions',color: 'from-purple-500 to-violet-600',
    desc: 'Subscription plan management and Mobile Money payment approvals',
    features: ['Free / Premium / VIP plan stats', 'Approve or reject MoMo payments', 'Revenue breakdown', 'Plan editor'],
  },
  {
    num: '04', icon: Flag,            label: 'Reports',          path: '/admin/reports',      color: 'from-red-500 to-rose-600',
    desc: 'User-submitted reports — harassment, spam, fake profiles, explicit content',
    features: ['Report queue with severity', 'Resolve / escalate / dismiss', 'Reporter & reported profiles', 'Bulk actions'],
  },
  {
    num: '05', icon: BarChart3,       label: 'Analytics',        path: '/admin/analytics',    color: 'from-amber-500 to-orange-600',
    desc: 'Deep platform analytics — growth, engagement, revenue, geography',
    features: ['User growth chart (30/90/365d)', 'Revenue by plan & country', 'Feature usage heatmap', 'Retention metrics'],
  },
  {
    num: '06', icon: Megaphone,       label: 'Broadcasts',       path: '/admin/broadcasts',   color: 'from-sky-500 to-blue-600',
    desc: 'Send push notifications and in-app announcements to all or targeted users',
    features: ['Compose rich notifications', 'Target by plan / country / segment', 'Schedule broadcasts', 'Delivery stats'],
  },
  {
    num: '07', icon: ShoppingBag,     label: 'Marketplace',      path: '/admin/marketplace',  color: 'from-emerald-500 to-teal-600',
    desc: 'Marketplace moderation — approve listings, manage sellers, handle disputes',
    features: ['Pending listing approvals', 'Seller verification', 'Dispute resolution', 'Category management'],
  },
  {
    num: '08', icon: Tv,              label: 'SmartzTV',         path: '/admin/smartztv',     color: 'from-violet-500 to-purple-600',
    desc: 'Live stream moderation — active streams, reported content, creator management',
    features: ['Active streams monitor', 'End / mute streams', 'Creator applications', 'Content reports'],
  },
  {
    num: '09', icon: Car,             label: 'Rides',            path: '/admin/rides',        color: 'from-indigo-500 to-blue-600',
    desc: 'SmartzRide operations — driver approvals, active trips, earnings, disputes',
    features: ['Driver application queue', 'Active trips map view', 'Earnings & payouts', 'Trip disputes'],
  },
  {
    num: '10', icon: FileText,        label: 'Content',          path: '/admin/content',      color: 'from-pink-500 to-fuchsia-600',
    desc: 'Content moderation — posts, comments, stories flagged for review',
    features: ['Reported posts / comments / stories', 'Approve or remove content', 'Bulk moderation', 'AI-flagged queue'],
  },
  {
    num: '11', icon: Shield,          label: 'Safety',           path: '/admin/safety',       color: 'from-teal-500 to-emerald-600',
    desc: 'User verification queue and community safety rules management',
    features: ['ID verification approvals', 'Selfie + document review', 'Community rules editor', 'Blocked users list'],
  },
  {
    num: '12', icon: Ad,              label: 'Advertisements',   path: '/admin/ads',          color: 'from-orange-500 to-amber-600',
    desc: 'Ad campaign manager — approve ads, track impressions, CTR, revenue',
    features: ['Campaign list with live stats', 'Approve / pause campaigns', 'Impressions & CTR tracking', 'Ad revenue MTD'],
  },
  {
    num: '13', icon: Settings,        label: 'Settings',         path: '/admin/settings',     color: 'from-slate-500 to-gray-600',
    desc: 'Platform feature toggles — enable/disable any feature with one click',
    features: ['16 feature toggles', 'Platform / Features / Payments / Safety', 'Maintenance mode', 'Save & apply changes'],
  },
  {
    num: '14', icon: Users2,          label: 'Team',             path: '/admin/team',         color: 'from-rose-500 to-pink-600',
    desc: 'Admin team management — invite members, assign roles, manage permissions',
    features: ['Team member list with roles', 'Invite via email', 'Role: Admin / Moderator / Support', 'Permission matrix'],
  },
  {
    num: '15', icon: ScrollText,      label: 'Audit Logs',       path: '/admin/audit',        color: 'from-cyan-500 to-sky-600',
    desc: 'Complete audit trail — every admin action logged with actor, IP, timestamp',
    features: ['Filter by severity / category', 'Search by actor or target', 'Export logs CSV', 'Critical action alerts'],
  },
  {
    num: '16', icon: Crown,           label: 'CEO Panel',        path: '/admin/ceo',          color: 'from-amber-500 to-yellow-600',
    desc: 'Highest permission level — admin oversight, platform config, CEO-only actions',
    features: ['Admin team override', 'Edit subscription pricing', 'Platform configuration', 'Emergency controls'],
  },
]

export default function AdminTour() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="dark:bg-gradient-to-r dark:from-pink-500/10 dark:to-purple-500/5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl border dark:border-pink-500/20 border-pink-200 p-6 mb-2">
        <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1">Admin Panel Tour</h1>
        <p className="text-sm dark:text-gray-400 text-gray-500">All 16 pages at a glance — click any card to navigate there</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {pages.map((page, i) => {
          const Icon = page.icon
          return (
            <motion.div
              key={page.path}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <NavLink to={page.path} end={page.path === '/admin'}
                className="block dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-5 hover:border-brand-pink/40 hover:dark:bg-white/4 transition-all group">
                <div className="flex items-start gap-4 mb-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${page.color} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold dark:text-gray-500 text-gray-400">#{page.num}</span>
                      <h3 className="text-sm font-bold dark:text-white text-gray-900">{page.label}</h3>
                    </div>
                    <p className="text-[11px] dark:text-gray-400 text-gray-500 leading-snug">{page.desc}</p>
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {page.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[11px] dark:text-gray-400 text-gray-600">
                      <span className="w-1 h-1 rounded-full bg-brand-pink flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-[11px] text-brand-pink font-semibold group-hover:gap-2 transition-all">
                  Open page <ChevronRight className="w-3 h-3" />
                </div>
              </NavLink>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
