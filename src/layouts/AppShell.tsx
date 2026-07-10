import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, User, Users, MessageCircle, Bell, Video, Phone,
  Heart, Users2, FileText, Calendar, ShoppingBag, Briefcase,
  BookOpen, Tv, Car, Zap, Crown, Settings, HelpCircle,
  Sun, Moon, LogOut, Globe, Bookmark, Trophy, Gift
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/NotificationContext'
import TopNavBar from '@/layouts/TopNavBar'
import LeftSidebar from '@/layouts/LeftSidebar'
import CreateModal from '@/components/CreateModal'
import IncomingCall from '@/components/IncomingCall'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import NotificationToast from '@/components/NotificationToast'

// All nav sections for the mobile drawer
const drawerSections = [
  {
    section: 'Main',
    items: [
      { path: '/app/feed',          icon: Home,          label: 'Home',          badge: null as string | null, color: '', tourId: 'nav-feed' },
      { path: '/app/profile',       icon: User,          label: 'Profile',       badge: null as string | null, color: '', tourId: 'nav-profile' },
      { path: '/app/friends',       icon: Users,         label: 'Friends',       badge: null as string | null,  color: '', tourId: 'nav-friends' },
      { path: '/app/matches',        icon: MessageCircle, label: 'Messages',      badge: null as string | null, color: '', tourId: 'nav-messages' },
      { path: '/app/notifications', icon: Bell,          label: 'Notifications', badge: null as string | null, color: '', tourId: 'nav-notifications' },
    ],
  },
  {
    section: 'Calls',
    items: [
      { path: '/app/calls/video', icon: Video, label: 'Video Calls', badge: null as string | null, color: 'text-blue-400', tourId: 'nav-video-call' },
      { path: '/app/calls/audio', icon: Phone, label: 'Audio Calls', badge: null as string | null, color: 'text-green-400', tourId: 'nav-audio-call' },
    ],
  },
  {
    section: 'Explore',
    items: [
      { path: '/app/worldchat',     icon: Globe,         label: 'World Chat',   badge: null as string | null, color: 'text-cyan-500' },
      { path: '/app/discover',      icon: Heart,         label: 'Dating',       badge: null as string | null, color: 'text-pink-500', tourId: 'nav-discover' },
      { path: '/app/groups',        icon: Users2,        label: 'Groups',       badge: null as string | null, color: 'text-purple-500', tourId: 'nav-groups' },
      { path: '/app/pages',         icon: FileText,      label: 'Pages',        badge: null as string | null, color: 'text-sky-500' },
      { path: '/app/events',        icon: Calendar,      label: 'Events',       badge: null as string | null, color: 'text-orange-500' },
      { path: '/app/marketplace',   icon: ShoppingBag,   label: 'Marketplace',  badge: null as string | null, color: 'text-amber-500', tourId: 'nav-marketplace' },
      { path: '/app/jobs',          icon: Briefcase,     label: 'Jobs',         badge: null as string | null, color: 'text-teal-500' },
      { path: '/app/learning',      icon: BookOpen,      label: 'Learning',     badge: null as string | null, color: 'text-indigo-500' },
      { path: '/app/smartztv',      icon: Tv,            label: 'SmartzTV',     badge: null as string | null, color: 'text-violet-500', tourId: 'nav-smartztv' },
      { path: '/app/ride',          icon: Car,           label: 'Ride',         badge: null as string | null, color: 'text-emerald-500', tourId: 'nav-ride' },
      { path: '/app/spin',          icon: Zap,           label: 'Spin Chat',    badge: null as string | null, color: 'text-fuchsia-500' },
      { path: '/app/worldstage',    icon: Trophy,        label: 'World Stage',  badge: null as string | null, color: 'text-amber-500' },
      { path: '/app/subscriptions', icon: Crown,         label: 'Premium',      badge: null as string | null, color: 'text-yellow-500' },
    ],
  },
  {
    section: 'Account',
    items: [
      { path: '/app/referrals', icon: Gift,       label: 'Invite & Earn', badge: null as string | null, color: '' },
      { path: '/app/saved',    icon: Bookmark,   label: 'Saved Posts',   badge: null as string | null, color: '' },
      { path: '/app/settings', icon: Settings,   label: 'Settings',      badge: null as string | null, color: '', tourId: 'nav-settings' },
      { path: '/app/help',     icon: HelpCircle, label: 'Help & Support', badge: null as string | null, color: '', tourId: 'nav-help' },
    ],
  },
]

// Mobile bottom nav (5 key items)
const mobileBottomNav = [
  { path: '/app/feed',          icon: Home,          label: 'Home' },
  { path: '/app/discover',      icon: Heart,         label: 'Dating' },
  { path: '/app/matches',        icon: MessageCircle, label: 'Chat' },
  { path: '/app/notifications', icon: Bell,          label: 'Alerts' },
  { path: '/app/profile',       icon: User,          label: 'Me' },
]

export default function AppShell() {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount: unreadNotifs } = useNotifications()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)

  const isActive = (path: string) => location.pathname.startsWith(path)

  // Close drawer on navigation
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  // Realtime unread message count (notifications come from NotificationContext)
  useEffect(() => {
    if (!user?.id) return
    let mounted = true

    const fetchMessageCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false)
      if (!mounted) return
      setUnreadMessages(count ?? 0)
    }

    fetchMessageCount()

    const ch = supabase.channel('shell:unread-msgs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, fetchMessageCount)
      .subscribe()

    const handleOnline = () => { if (mounted) fetchMessageCount() }
    window.addEventListener('online', handleOnline)

    return () => {
      mounted = false
      supabase.removeChannel(ch)
      window.removeEventListener('online', handleOnline)
    }
  }, [user?.id])

  return (
    <div className="app-shell h-screen flex flex-col dark:bg-[#0A0710] bg-gray-50 overflow-hidden">

      {/* ── Announcement Banner ── */}
      <AnnouncementBanner />
      <NotificationToast />

      {/* ── Full-width Top Nav ── */}
      <TopNavBar
        unreadMessages={unreadMessages}
        unreadNotifs={unreadNotifs}
        onMenuToggle={() => setDrawerOpen(d => !d)}
        drawerOpen={drawerOpen}
      />

      {/* ── Body row: sidebar + content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Desktop Left Sidebar */}
        <LeftSidebar unreadMessages={unreadMessages} unreadNotifs={unreadNotifs} />

        {/* ── Mobile Drawer ── */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                key="bd"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.aside
                key="drawer"
                initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed left-0 top-14 bottom-0 w-72 dark:bg-[#0D0A14] bg-white z-50 md:hidden flex flex-col border-r dark:border-white/6 border-gray-100 shadow-2xl"
              >
                <nav className="flex-1 px-3 py-2 overflow-y-auto">
                  {drawerSections.map(({ section, items }) => (
                    <div key={section}>
                      <p className="text-[10.5px] font-black uppercase tracking-widest text-brand-pink px-3 pt-4 pb-1.5 first:pt-2">{section}</p>
                      {items.map(item => {
                        const active = isActive(item.path)
                        const Icon = item.icon
                        const liveBadge =
                          item.label === 'Messages'      && unreadMessages > 0 ? String(Math.min(unreadMessages, 99)) :
                          item.label === 'Notifications' && unreadNotifs   > 0 ? String(Math.min(unreadNotifs,   99)) :
                          item.badge
                        return (
                          <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-0.5 ${
                              active
                                ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20'
                                : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink'
                            }`}>
                            <Icon className={`w-4 h-4 flex-shrink-0 ${!active && item.color ? item.color : ''}`} />
                            <span className="text-[1rem] font-semibold">{item.label}</span>
                            {liveBadge && !active && (
                              <span className="ml-auto text-[11.5px] font-black px-1.5 py-0.5 rounded-full bg-brand-pink text-white min-w-[18px] text-center">{liveBadge}</span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  ))}
                </nav>

                <div className="px-3 py-4 border-t dark:border-white/6 border-gray-100 space-y-1">
                  <button onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 hover:text-brand-pink transition-all text-sm font-semibold">
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button onClick={signOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-semibold">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 dark:bg-[#0D0A14]/98 bg-white/98 backdrop-blur-xl border-t dark:border-white/8 border-gray-100 flex items-center px-1">
        {mobileBottomNav.map(item => {
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
              <div className={`relative z-10 w-6 h-6 flex items-center justify-center transition-all ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                <Icon className={`w-5 h-5 transition-colors ${active ? 'text-brand-pink' : 'dark:text-gray-500 text-gray-400'}`} />
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
              </div>
              <span className={`relative z-10 text-[9px] font-bold transition-colors ${active ? 'text-brand-pink' : 'dark:text-gray-500 text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Floating Create Button ── */}
      <CreateModal />

      {/* ── Global Incoming Call overlay ── */}
      <IncomingCall />
    </div>
  )
}
