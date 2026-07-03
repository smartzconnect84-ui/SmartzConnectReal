import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Video, Phone, Bell, MessageCircle,
  User, Settings, LogOut, Sun, Moon, ChevronDown,
  Crown, HelpCircle, Bookmark, Menu, X
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useLiveChat } from '@/contexts/LiveChatContext'
import { supabase } from '@/lib/supabase'

const logoImg = '/logo.png'

interface TopNavBarProps {
  unreadMessages: number
  unreadNotifs: number
  onMenuToggle: () => void
  drawerOpen: boolean
}

export default function TopNavBar({ unreadMessages, unreadNotifs, onMenuToggle, drawerOpen }: TopNavBarProps) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { setOpen, setDismissed, setUnreadCount, unreadCount, dismissed } = useLiveChat()
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileData, setProfileData] = useState<{ full_name?: string; avatar_url?: string; subscription_tier?: string } | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('full_name, avatar_url, subscription_tier').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfileData(data) })
  }, [user?.id])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayName = profileData?.full_name || user?.email?.split('@')[0] || 'User'
  const initial = displayName[0]?.toUpperCase() ?? 'U'
  const isPremium = profileData?.subscription_tier === 'premium' || profileData?.subscription_tier === 'vip'

  return (
    <header className="h-14 flex-shrink-0 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100 flex items-center px-3 gap-2 z-40 relative shadow-sm">

      {/* Mobile: hamburger */}
      <button
        onClick={onMenuToggle}
        className="md:hidden w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-pink-500/10"
        aria-label="Toggle menu"
      >
        <AnimatePresence mode="wait" initial={false}>
          {drawerOpen
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
              </motion.span>
            : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Menu className="w-4 h-4 dark:text-gray-400 text-gray-600" />
              </motion.span>
          }
        </AnimatePresence>
      </button>

      {/* Logo */}
      <Link to="/app/feed" className="flex items-center gap-2 flex-shrink-0">
        <img src={logoImg} alt="SmartzConnect" className="w-7 h-7 object-contain" />
        <span className="font-display font-bold text-[0.95rem] hidden sm:block">
          <span className="text-gradient-love">Smartz</span>
          <span className="dark:text-white text-gray-900">Connect</span>
        </span>
      </Link>

      {/* Search */}
      <div className={`flex-1 max-w-xs md:max-w-sm mx-2 md:mx-auto relative transition-all duration-300 ${searchFocused ? 'max-w-md' : ''}`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
          searchFocused
            ? 'dark:bg-[#1C1530] bg-white dark:border-brand-pink/40 border-brand-pink/40 shadow-lg shadow-pink-500/10'
            : 'dark:bg-white/5 bg-gray-100 dark:border-white/0 border-transparent'
        }`}>
          <Search className={`w-4 h-4 flex-shrink-0 transition-colors ${searchFocused ? 'text-brand-pink' : 'dark:text-gray-500 text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search SmartzConnect…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="flex-shrink-0">
              <X className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* Video call — md+ */}
        <Link to="/app/calls/video" title="Video Call"
          className="hidden md:flex w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 items-center justify-center hover:bg-blue-500/10 hover:text-blue-400 dark:text-gray-400 text-gray-600 transition-colors">
          <Video className="w-4 h-4" />
        </Link>

        {/* Audio call — md+ */}
        <Link to="/app/calls/audio" title="Audio Call"
          className="hidden md:flex w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 items-center justify-center hover:bg-green-500/10 hover:text-green-400 dark:text-gray-400 text-gray-600 transition-colors">
          <Phone className="w-4 h-4" />
        </Link>

        {/* Support chat — sm+ */}
        <button
          onClick={() => { setOpen(true); setDismissed(false); setUnreadCount(0) }}
          title="Support Chat"
          className="relative hidden sm:flex w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 items-center justify-center hover:bg-pink-500/10 dark:text-gray-400 text-gray-600 transition-colors">
          <MessageCircle className={`w-4 h-4 ${dismissed && unreadCount > 0 ? 'text-brand-pink' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">{unreadCount}</span>
          )}
        </button>

        {/* Messages */}
        <Link to="/app/chat/1" className="relative w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 dark:text-gray-400 text-gray-600 transition-colors">
          <MessageCircle className="w-4 h-4" />
          {unreadMessages > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <Link to="/app/notifications" className="relative w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 dark:text-gray-400 text-gray-600 transition-colors">
          <Bell className="w-4 h-4" />
          {unreadNotifs > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">
              {unreadNotifs > 9 ? '9+' : unreadNotifs}
            </span>
          )}
        </Link>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative ml-0.5">
          <button
            onClick={() => setProfileOpen(p => !p)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:dark:bg-white/5 hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
              {profileData?.avatar_url
                ? <img src={profileData.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                : initial}
            </div>
            {isPremium && <Crown className="w-3 h-3 text-yellow-400 hidden sm:block" />}
            <ChevronDown className={`w-3 h-3 dark:text-gray-400 text-gray-500 hidden sm:block transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl shadow-black/40 overflow-hidden z-50"
              >
                {/* User info */}
                <div className="p-4 border-b dark:border-white/6 border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-love-gradient flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
                      {profileData?.avatar_url
                        ? <img src={profileData.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        : initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm dark:text-white text-gray-900 truncate">{displayName}</p>
                        {isPremium && <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs dark:text-gray-500 text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  {([
                    { to: '/app/profile',       icon: User,       label: 'View Profile',         color: '' },
                    { to: '/app/subscriptions', icon: Crown,      label: 'Upgrade to Premium',   color: 'text-yellow-500' },
                    { to: '/app/feed',          icon: Bookmark,   label: 'Saved Items',          color: '' },
                    { to: '/app/settings',      icon: Settings,   label: 'Settings',             color: '' },
                    { to: '/app/help',          icon: HelpCircle, label: 'Help & Support',       color: '' },
                  ] as const).map(item => {
                    const Icon = item.icon
                    return (
                      <Link key={item.to} to={item.to} onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 transition-colors group">
                        <Icon className={`w-4 h-4 ${item.color || 'dark:text-gray-400 text-gray-500'} group-hover:text-brand-pink transition-colors`} />
                        <span className="text-sm font-medium dark:text-gray-300 text-gray-700">{item.label}</span>
                      </Link>
                    )
                  })}

                  <div className="h-px dark:bg-white/5 bg-gray-100 my-1" />

                  <button onClick={() => { toggleTheme(); setProfileOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 transition-colors group">
                    {theme === 'dark'
                      ? <Sun className="w-4 h-4 dark:text-gray-400 text-gray-500 group-hover:text-brand-pink transition-colors" />
                      : <Moon className="w-4 h-4 dark:text-gray-400 text-gray-500 group-hover:text-brand-pink transition-colors" />}
                    <span className="text-sm font-medium dark:text-gray-300 text-gray-700">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <button onClick={() => { signOut(); setProfileOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
