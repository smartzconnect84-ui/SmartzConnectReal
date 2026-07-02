import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Bell, ShoppingBag, Tv, Car,
  Crown, User, X, LogOut, Zap, Home, Compass, Users
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { useLiveChat } from '@/contexts/LiveChatContext'
import { Sun, Moon, Menu } from 'lucide-react'
const logoImg = '/logo.png'
import { supabase } from '@/lib/supabase'

const primaryNav = [
  { path: '/app/feed',          icon: Home,          label: 'Feed',     badge: null as string | null },
  { path: '/app/discover',      icon: Compass,       label: 'Discover', badge: '🔥' as string | null },
  { path: '/app/chat/1',        icon: MessageCircle, label: 'Chat',     badge: null as string | null },
  { path: '/app/notifications', icon: Bell,          label: 'Alerts',   badge: null as string | null },
  { path: '/app/profile',       icon: User,          label: 'Me',       badge: null as string | null },
]

const secondaryNav = [
  { path: '/app/matches',       icon: Heart,         label: 'Matches',   color: 'text-pink-500' },
  { path: '/app/spin',          icon: Zap,           label: 'Spin',      color: 'text-fuchsia-500' },
  { path: '/app/groups',        icon: Users,         label: 'Groups',    color: 'text-purple-500' },
  { path: '/app/marketplace',   icon: ShoppingBag,   label: 'Market',    color: 'text-amber-500' },
  { path: '/app/smartztv',      icon: Tv,            label: 'SmartzTV',  color: 'text-violet-500' },
  { path: '/app/ride',          icon: Car,           label: 'Ride',      color: 'text-emerald-500' },
  { path: '/app/subscriptions', icon: Crown,         label: 'Premium',   color: 'text-yellow-500' },
]

const allNav = [...primaryNav, ...secondaryNav]

export default function AppShell() {
  const location  = useLocation()
  const { signOut, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { dismissed, setOpen, setDismissed, unreadCount, setUnreadCount } = useLiveChat()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unreadMessages, setUnreadMessages]     = useState(0)
  const [unreadNotifs,   setUnreadNotifs]       = useState(0)

  const isActive = (path: string) => location.pathname.startsWith(path)
  const currentPage = allNav.find(n => isActive(n.path))

  // ── Real unread counts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    let mounted = true

    const fetchCounts = async () => {
      const [msgRes, notifRes] = await Promise.all([
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false),
      ])
      if (!mounted) return
      setUnreadMessages(msgRes.count ?? 0)
      setUnreadNotifs(notifRes.count ?? 0)
    }

    fetchCounts()

    // Refresh counts via realtime
    const ch = supabase
      .channel('shell:unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages',       filter: `receiver_id=eq.${user.id}` }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications',  filter: `user_id=eq.${user.id}`     }, fetchCounts)
      .subscribe()

    return () => { mounted = false; supabase.removeChannel(ch) }
  }, [user?.id])

  return (
    <div className="h-screen flex dark:bg-[#0A0710] bg-gray-50 overflow-hidden">

      {/* ── Compact icon sidebar (md) / Full sidebar (lg+) ── */}
      <aside className="hidden md:flex flex-col dark:bg-[#0D0A14] bg-white border-r dark:border-white/6 border-gray-100 flex-shrink-0
        w-16 lg:w-60 xl:w-64 transition-all duration-200">

        {/* Logo */}
        <div className="px-3 lg:px-5 py-4 lg:py-5 border-b dark:border-white/6 border-gray-100 flex items-center justify-center lg:justify-start">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logoImg} alt="SmartzConnect" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="font-display font-bold text-[1.05rem] hidden lg:block">
              <span className="text-gradient-love">Smartz</span>
              <span className="dark:text-white text-gray-900">Connect</span>
            </span>
          </Link>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-pink px-2 lg:px-3 mb-2 hidden lg:block">Main</p>
          {primaryNav.map(item => {
            const active = isActive(item.path)
            const Icon = item.icon
            const liveBadge =
              item.label === 'Chat'   && unreadMessages > 0 ? String(unreadMessages > 99 ? '99+' : unreadMessages) :
              item.label === 'Alerts' && unreadNotifs   > 0 ? String(unreadNotifs   > 99 ? '99+' : unreadNotifs)   :
              item.badge
            return (
              <Link key={item.path} to={item.path}
                title={item.label}
                className={`flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl transition-all group relative ${
                  active
                    ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20'
                    : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink'
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-semibold hidden lg:block">{item.label}</span>
                {liveBadge && !active && (
                  <span className={`hidden lg:flex ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    liveBadge === '🔥' ? 'text-orange-500' : 'bg-brand-pink text-white min-w-[18px] text-center'
                  }`}>{liveBadge}</span>
                )}
                {liveBadge && liveBadge !== '🔥' && !active && (
                  <span className="lg:hidden absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-pink" />
                )}
              </Link>
            )
          })}

          <div className="h-px dark:bg-white/5 bg-gray-100 my-3 mx-1" />
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-pink px-2 lg:px-3 mb-2 hidden lg:block">Explore</p>

          {secondaryNav.map(item => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link key={item.path} to={item.path}
                title={item.label}
                className={`flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl transition-all group ${
                  active
                    ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20'
                    : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink'
                }`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : item.color}`} />
                <span className="text-sm font-semibold hidden lg:block">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-2 lg:px-3 py-4 border-t dark:border-white/6 border-gray-100 space-y-1">
          {/* User info — lg only */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-love-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold dark:text-white text-gray-900 truncate">{user?.email?.split('@')[0] ?? 'User'}</p>
              <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate">{user?.email ?? ''}</p>
            </div>
          </div>

          <button onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-xl dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-gray-50 hover:text-brand-pink transition-all text-sm font-semibold">
            {theme === 'dark' ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
            <span className="hidden lg:block">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button onClick={signOut}
            title="Sign Out"
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-xl dark:text-gray-400 text-gray-600 hover:dark:bg-red-500/10 hover:bg-red-50 hover:text-red-400 transition-all text-sm font-semibold">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Drawer (< md) ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" />
            <motion.aside key="drawer"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 w-72 dark:bg-[#0D0A14] bg-white z-50 md:hidden flex flex-col border-r dark:border-white/6 border-gray-100 shadow-2xl">

              {/* Flyer banner header */}
              <div className="relative h-36 flex-shrink-0 overflow-hidden">
                <img src="/flyer.png" alt="SmartzConnect" className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />
                <button onClick={() => setDrawerOpen(false)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="absolute bottom-3 left-4">
                  <span className="font-display font-black text-base text-white drop-shadow-lg">
                    <span className="text-pink-300">Smartz</span>Connect
                  </span>
                  <p className="text-[10px] text-white/70 mt-0.5">Connect · Collaborate · Grow</p>
                </div>
              </div>

              <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-pink px-3 mb-2">Main</p>
                {primaryNav.map(item => {
                  const active = isActive(item.path)
                  const Icon = item.icon
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20' : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink'}`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.badge && !active && (
                        <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${item.badge === '🔥' ? 'text-orange-500' : 'bg-brand-pink text-white'}`}>{item.badge}</span>
                      )}
                    </Link>
                  )
                })}
                <div className="h-px dark:bg-white/5 bg-gray-100 my-3 mx-1" />
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-pink px-3 mb-2">Explore</p>
                {secondaryNav.map(item => {
                  const active = isActive(item.path)
                  const Icon = item.icon
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20' : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink'}`}>
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : item.color}`} />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="px-3 py-4 border-t dark:border-white/6 border-gray-100 space-y-1">
                <button onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 hover:text-brand-pink transition-all text-sm font-semibold">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={signOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 hover:text-red-400 transition-all text-sm font-semibold">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar — only on < md */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0 z-10">
          <button onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
            <Menu className="w-4 h-4 dark:text-gray-400 text-gray-600" />
          </button>

          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-love-gradient flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-sm">
              <span className="text-gradient-love">Smartz</span>
              <span className="dark:text-white text-gray-900">Connect</span>
            </span>
            {currentPage && (
              <span className="text-xs dark:text-gray-500 text-gray-400 ml-1">· {currentPage.label}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Support chat icon — always visible in top bar */}
            <button
              onClick={() => { setOpen(true); setDismissed(false); setUnreadCount(0) }}
              title={dismissed ? 'Restore support chat' : 'Open support chat'}
              className="relative w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors">
              <MessageCircle className={`w-4 h-4 transition-colors ${dismissed ? 'text-brand-pink' : 'dark:text-gray-400 text-gray-600'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            <Link to="/app/notifications" className="relative w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
              <Bell className="w-4 h-4 dark:text-gray-400 text-gray-600" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* ── Mobile Bottom Nav — only on < md ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 dark:bg-[#0D0A14]/98 bg-white/98 backdrop-blur-xl border-t dark:border-white/8 border-gray-100 flex items-center px-1">
          {primaryNav.map(item => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link key={item.path} to={item.path}
                className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative group">

                {active && (
                  <motion.div
                    layoutId="bottomNavPill"
                    className="absolute inset-x-1 inset-y-1 rounded-xl bg-love-soft"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <div className={`relative z-10 w-6 h-6 flex items-center justify-center transition-all duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                  <Icon className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-brand-pink' : 'dark:text-gray-500 text-gray-400'}`} />
                  {/* Real unread counts on mobile bottom nav */}
                  {item.label === 'Chat' && unreadMessages > 0 && !active && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                  {item.label === 'Alerts' && unreadNotifs > 0 && !active && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">
                      {unreadNotifs > 9 ? '9+' : unreadNotifs}
                    </span>
                  )}
                  {item.badge === '🔥' && !active && (
                    <span className="absolute -top-1 -right-1 text-[10px]">🔥</span>
                  )}
                </div>

                <span className={`relative z-10 text-[9px] font-bold transition-colors duration-200 ${active ? 'text-brand-pink' : 'dark:text-gray-500 text-gray-400'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
