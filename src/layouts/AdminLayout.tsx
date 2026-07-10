import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, CreditCard, Flag, BarChart3, Megaphone,
  ShoppingBag, Tv, Car, FileText, Shield, Settings, ChevronLeft,
  ChevronRight, Bell, Search, Moon, Sun, LogOut, Crown,
  Users2, ScrollText, Menu, X, Map, MessageCircle, BookOpen, Layout as LayoutIcon, Zap, Trophy
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLiveChat } from '@/contexts/LiveChatContext'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { supabase } from '@/lib/supabase'
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
  { icon: Zap,             label: 'Advertisements',  path: '/admin/ads' },
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
  const { dismissed, setOpen, setDismissed, unreadCount, setUnreadCount } = useLiveChat()
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([])
  const [searching, setSearching] = useState(false)

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
        <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 object-contain flex-shrink-0 rounded-xl" />
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
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
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
          <Crown className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-bold">CEO Panel</span>}
        </NavLink>
      </div>

      {/* Bottom actions */}
      <div className="px-2 pb-4 border-t dark:border-white/6 border-gray-200 pt-3 space-y-1 flex-shrink-0">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          {!collapsed && <span className="text-sm font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
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
            ? <ChevronRight className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
            : <ChevronLeft className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
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
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 dark:bg-[#080510] bg-white border-b dark:border-white/6 border-gray-200 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
              <Menu className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
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
          <div className="flex items-center gap-2">
            {/* Live Chat icon — shown in admin topbar when dismissed */}
            {dismissed && (
              <button
                onClick={() => { setDismissed(false); setOpen(true); setUnreadCount(0) }}
                title="Open support chat"
                className="relative w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors"
              >
                <MessageCircle className="w-4 h-4 dark:text-gray-400 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
            )}
            <button className="relative w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors">
              <Bell className="w-4 h-4 dark:text-gray-400 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-pink" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l dark:border-white/8 border-gray-200">
              <div className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center text-sm">👑</div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold dark:text-white text-gray-900 leading-none">Super Admin</p>
                <p className="text-[11px] dark:text-gray-500 text-gray-400">admin@smartzconnect.com</p>
              </div>
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
