import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, CreditCard, Flag, BarChart3, Megaphone,
  ShoppingBag, Tv, Car, FileText, Shield, Settings, ChevronLeft,
  ChevronRight, Bell, Search, Moon, Sun, LogOut, Crown,
  Users2, ScrollText, Menu, X, Map, MessageCircle, BookOpen, Layout as LayoutIcon, Zap, Trophy,
  Check, Mail, Grid3X3,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { openTawkChat } from '@/lib/tawk'
import { useNotifications } from '@/contexts/NotificationContext'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { listSwitchableAccounts, switchToAccount, PRIMARY_ADMIN_EMAIL, type SwitchableAccount } from '@/lib/accountSwitcher'
const logoImg = '/logo.png'

// Scroll speed multiplier for the admin panel's main content (+15% faster than default)
const ADMIN_SCROLL_SPEED_MULTIPLIER = 1.15

interface GlobalSearchResult {
  id: string
  label: string
  sublabel: string
  path: string
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/admin',                 end: true },
  { icon: Users,           label: 'Users',           path: '/admin/users' },
  { icon: BarChart3,       label: 'Analytics',       path: '/admin/analytics' },
  { icon: Flag,            label: 'Reports',         path: '/admin/reports' },
  { icon: Shield,          label: 'Safety',          path: '/admin/safety' },
  { icon: FileText,        label: 'Content',         path: '/admin/content' },
  { icon: LayoutIcon,      label: 'Site Content',    path: '/admin/cms' },
  { icon: CreditCard,      label: 'Subscriptions',   path: '/admin/subscriptions' },
  { icon: ShoppingBag,     label: 'Marketplace',     path: '/admin/marketplace' },
  { icon: Tv,              label: 'SmartzTV',        path: '/admin/smartztv' },
  { icon: Car,             label: 'Rides',           path: '/admin/rides' },
  { icon: Megaphone,       label: 'Broadcasts',      path: '/admin/broadcasts' },
  { icon: Mail,            label: 'Email Campaigns', path: '/admin/email' },
  { icon: Zap,             label: 'Advertisements',  path: '/admin/ads' },
  { icon: Grid3X3,         label: 'Services',        path: '/admin/services' },
  { icon: Users2,          label: 'Team',            path: '/admin/team' },
  { icon: BookOpen,        label: 'Blog',            path: '/admin/blog' },
  { icon: Settings,        label: 'Settings',        path: '/admin/settings' },
  { icon: ScrollText,      label: 'Audit Logs',      path: '/admin/audit' },
  { icon: Map,             label: 'Page Tour',       path: '/admin/tour' },
  { icon: Trophy,          label: 'World Stage',     path: '/admin/worldstage' },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount: notifUnread, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [switchingAccount, setSwitchingAccount] = useState<string | null>(null)
  const [switchableAccounts, setSwitchableAccounts] = useState<SwitchableAccount[]>([])
  const [switchAccountError, setSwitchAccountError] = useState<string | null>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setSwitchableAccounts(listSwitchableAccounts()) }, [user?.id])

  const handleQuickSwitchAccount = async (email: string) => {
    if (email.toLowerCase() === user?.email?.toLowerCase()) { setAccountMenuOpen(false); return }
    setSwitchingAccount(email)
    setSwitchAccountError(null)
    try {
      await switchToAccount(email)
      window.location.assign('/admin')
    } catch (err: any) {
      setSwitchableAccounts(listSwitchableAccounts())
      setSwitchAccountError(err?.message || 'Could not switch accounts. Please sign in again.')
    } finally {
      setSwitchingAccount(null)
    }
  }

  // Close bell dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // +15% faster wheel scroll inside the admin main content area
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return
      e.preventDefault()
      el.scrollTop += e.deltaY * ADMIN_SCROLL_SPEED_MULTIPLIER
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Global "search anything" — users, reports, marketplace orders
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) { setSearchResults([]); return }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(async () => {
      const [users, reports, orders] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(4),
        supabase.from('reports').select('id, reason').ilike('reason', `%${q}%`).limit(3),
        supabase.from('marketplace_orders').select('id, status').ilike('status', `%${q}%`).limit(3),
      ])
      if (cancelled) return
      const results: GlobalSearchResult[] = [
        ...(users.data ?? []).map((u: any) => ({ id: `u-${u.id}`, label: u.full_name || u.email || 'User', sublabel: u.email || '', path: `/admin/users?q=${encodeURIComponent(u.id)}` })),
        ...(reports.data ?? []).map((r: any) => ({ id: `r-${r.id}`, label: r.reason || 'Report', sublabel: 'Report', path: '/admin/reports' })),
        ...(orders.data ?? []).map((o: any) => ({ id: `o-${o.id}`, label: `Order #${o.id.slice(0, 8)}`, sublabel: o.status, path: '/admin/marketplace' })),
      ]
      setSearchResults(results)
      setSearching(false)
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [searchQuery])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b dark:border-white/6 border-gray-200 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <img src={logoImg} alt="SmartzConnect" className="w-[40px] h-[40px] object-contain flex-shrink-0 rounded-xl" />
        {!collapsed && (
          <div>
            <p className="font-display font-black text-sm dark:text-white text-gray-900 leading-none">SmartzConnect</p>
            <p className="text-[11px] dark:text-gray-500 text-gray-400 mt-0.5">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                  isActive
                    ? 'bg-love-gradient text-white shadow-lg shadow-pink-500/20'
                    : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-[26px] h-[26px] flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                  {!collapsed && (
                    <span className="text-sm font-semibold truncate">{item.label}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg dark:bg-gray-800 bg-white border dark:border-white/10 border-gray-200 text-sm font-semibold dark:text-white text-gray-900 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* CEO Panel link */}
      <div className="px-2 pb-2">
        <NavLink
          to="/admin/ceo"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isActive
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'dark:bg-amber-500/10 bg-amber-50 dark:text-amber-400 text-amber-600 hover:dark:bg-amber-500/20 hover:bg-amber-100'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          <Crown className="w-[26px] h-[26px] flex-shrink-0" />
          {!collapsed && <span className="text-sm font-bold">CEO Panel</span>}
        </NavLink>
      </div>

      {/* Bottom actions */}
      <div className="px-2 pb-4 border-t dark:border-white/6 border-gray-200 pt-3 space-y-1 flex-shrink-0">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          {theme === 'dark' ? <Sun className="w-[26px] h-[26px] flex-shrink-0" /> : <Moon className="w-[26px] h-[26px] flex-shrink-0" />}
          {!collapsed && <span className="text-sm font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[26px] h-[26px] flex-shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Exit Admin</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen dark:bg-[#0D0A14] bg-gray-50 overflow-hidden">

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col dark:bg-[#080510] bg-white border-r dark:border-white/6 border-gray-200 flex-shrink-0 relative z-20"
      >
        <SidebarContent />
        {/* Collapse toggle — on the right edge */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-16 w-7 h-7 rounded-full dark:bg-[#130E1E] bg-white border dark:border-white/10 border-gray-200 flex items-center justify-center shadow-md hover:border-brand-pink hover:shadow-pink-500/20 transition-all z-30"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-[19px] h-[19px] dark:text-gray-400 text-gray-600" />
            : <ChevronLeft className="w-[19px] h-[19px] dark:text-gray-400 text-gray-600" />
          }
        </button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-[240px] dark:bg-[#080510] bg-white border-r dark:border-white/6 border-gray-200 z-40 md:hidden"
            >
              <SidebarContent />
              {/* Close button on the right edge for mobile */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 -right-4 w-8 h-8 rounded-full dark:bg-[#080510] bg-white border dark:border-white/10 border-gray-200 flex items-center justify-center shadow-lg z-50"
              >
                <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3.5 min-h-[64px] dark:bg-[#080510] bg-white border-b dark:border-white/6 border-gray-200 flex-shrink-0 z-10 shadow-sm dark:shadow-black/20">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button onClick={() => setMobileOpen(true)} className="md:hidden w-9 h-9 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
              <Menu className="w-[21px] h-[21px] dark:text-gray-400 text-gray-600" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] dark:text-gray-500 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                placeholder="Search anything..."
                className="pl-8 pr-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors w-20 sm:w-28 focus:w-56 transition-all"
              />
              {searchOpen && searchQuery.trim().length >= 2 && (
                <div className="absolute top-full mt-1 left-0 w-72 max-h-80 overflow-y-auto rounded-xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 shadow-xl z-50">
                  {searching ? (
                    <p className="text-xs px-3 py-3 dark:text-gray-500 text-gray-400">Searching…</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs px-3 py-3 dark:text-gray-500 text-gray-400">No results for "{searchQuery}"</p>
                  ) : (
                    searchResults.map(r => (
                      <button
                        key={r.id}
                        onClick={() => { navigate(r.path); setSearchOpen(false); setSearchQuery('') }}
                        className="w-full text-left px-3 py-2.5 hover:dark:bg-white/5 hover:bg-gray-50 border-b dark:border-white/5 border-gray-100 last:border-0"
                      >
                        <p className="text-xs font-bold dark:text-white text-gray-900 truncate">{r.label}</p>
                        <p className="text-[11px] dark:text-gray-500 text-gray-400 truncate">{r.sublabel}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {/* Live Chat icon — opens Tawk.to support widget */}
            <button
              onClick={() => openTawkChat()}
              title="Open support chat"
              className="relative w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors"
            >
              <MessageCircle className="w-[21px] h-[21px] dark:text-gray-400 text-gray-600" />
            </button>
            {/* Notification bell — wired to NotificationContext */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setBellOpen(o => !o)}
                title="Notifications"
                className="relative w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors"
              >
                <Bell className="w-[21px] h-[21px] dark:text-gray-400 text-gray-600" />
                {notifUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">
                    {notifUnread > 9 ? '9+' : notifUnread}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl shadow-black/40 overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/6 border-gray-100">
                      <p className="text-sm font-bold dark:text-white text-gray-900">Notifications</p>
                      {notifUnread > 0 && (
                        <button
                          onClick={() => { markAllRead(); }}
                          className="flex items-center gap-1 text-[11px] text-brand-pink hover:text-pink-400 font-semibold transition-colors"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <Bell className="w-7 h-7 dark:text-gray-600 text-gray-400" />
                          <p className="text-xs dark:text-gray-500 text-gray-400">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map(n => (
                          <button
                            key={n.id}
                            onClick={() => {
                              markRead(n.id)
                              if (n.action_url) navigate(n.action_url)
                              setBellOpen(false)
                            }}
                            className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b dark:border-white/5 border-gray-100 last:border-0 transition-colors hover:dark:bg-white/5 hover:bg-gray-50 ${!n.read ? 'dark:bg-[#1A1228]/60' : ''}`}
                          >
                            <span className="text-lg flex-shrink-0 mt-0.5">{n.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-xs font-semibold truncate ${!n.read ? 'dark:text-white text-gray-900' : 'dark:text-gray-300 text-gray-700'}`}>
                                  {n.title}
                                </p>
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-pink flex-shrink-0" />}
                              </div>
                              <p className="text-[11px] dark:text-gray-500 text-gray-400 truncate mt-0.5">{n.body}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t dark:border-white/6 border-gray-100">
                      <button
                        onClick={() => { navigate('/app/notifications'); setBellOpen(false) }}
                        className="text-xs text-brand-pink hover:text-pink-400 font-semibold transition-colors"
                      >
                        View all notifications →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div ref={accountMenuRef} className="relative pl-3 sm:pl-4 ml-1 border-l dark:border-white/8 border-gray-200">
              <button
                onClick={() => setAccountMenuOpen(o => !o)}
                className="flex items-center gap-2.5 rounded-xl px-1 py-1 hover:dark:bg-white/5 hover:bg-gray-50 transition-colors"
              >
                <div className="w-[35px] h-[35px] rounded-xl bg-love-gradient flex items-center justify-center text-sm flex-shrink-0">👑</div>
                <div className="hidden md:block leading-tight text-left">
                  <p className="text-sm font-bold dark:text-white text-gray-900 leading-none">Super Admin</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-400 mt-0.5 truncate max-w-[160px]">{user?.email || 'admin@smartzconnect.com'}</p>
                </div>
              </button>

              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl shadow-black/40 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b dark:border-white/6 border-gray-100">
                      <p className="text-xs font-bold dark:text-white text-gray-900">Switch account</p>
                      <p className="text-[10px] dark:text-gray-500 text-gray-400 mt-0.5">Signed in accounts on this device</p>
                    </div>
                    <div className="py-1.5">
                      {switchAccountError && (
                        <p className="text-[11px] text-red-500 px-4 pb-2">{switchAccountError}</p>
                      )}
                      {switchableAccounts.length === 0 && (
                        <p className="text-[11px] dark:text-gray-500 text-gray-400 px-4 py-3">No other saved accounts yet. Sign in once with a password to enable quick switching.</p>
                      )}
                      {switchableAccounts.map(acc => {
                        const isCurrent = acc.email.toLowerCase() === user?.email?.toLowerCase()
                        return (
                          <button
                            key={acc.email}
                            onClick={() => handleQuickSwitchAccount(acc.email)}
                            disabled={switchingAccount === acc.email}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:dark:bg-white/5 hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
                          >
                            <div className="w-[31px] h-[31px] rounded-lg bg-love-gradient flex items-center justify-center text-xs flex-shrink-0 overflow-hidden">
                              {acc.avatarUrl ? <img src={acc.avatarUrl} className="w-full h-full object-cover" /> : '👤'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold dark:text-white text-gray-900 truncate">
                                {acc.fullName || acc.email}
                                {acc.email.toLowerCase() === PRIMARY_ADMIN_EMAIL && (
                                  <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 align-middle">PRIMARY</span>
                                )}
                              </p>
                              <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate">{acc.email}</p>
                            </div>
                            {isCurrent ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            ) : switchingAccount === acc.email ? (
                              <span className="text-[10px] dark:text-gray-500 text-gray-400 flex-shrink-0">Switching…</span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Announcement Banner — shown above page content */}
        <AnnouncementBanner />

        {/* Page content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
