import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, User, Users, MessageCircle, Bell, Video, Phone,
  Heart, Users2, FileText, Calendar, ShoppingBag, Briefcase,
  BookOpen, Tv, Car, Zap, Crown, Settings, HelpCircle,
  Sun, Moon, LogOut
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const logoImg = '/logo.png'

interface NavItemDef {
  path: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string | null
  color?: string
}

const mainNav: NavItemDef[] = [
  { path: '/app/feed',          icon: Home,          label: 'Home' },
  { path: '/app/profile',       icon: User,          label: 'Profile' },
  { path: '/app/friends',       icon: Users,         label: 'Friends',       badge: '3' },
  { path: '/app/chat/1',        icon: MessageCircle, label: 'Messages' },
  { path: '/app/notifications', icon: Bell,          label: 'Notifications' },
]

const callsNav: NavItemDef[] = [
  { path: '/app/calls/video',   icon: Video,         label: 'Video Calls',   color: 'text-blue-400' },
  { path: '/app/calls/audio',   icon: Phone,         label: 'Audio Calls',   color: 'text-green-400' },
]

const exploreNav: NavItemDef[] = [
  { path: '/app/discover',      icon: Heart,         label: 'Dating',        color: 'text-pink-500' },
  { path: '/app/groups',        icon: Users2,        label: 'Groups',        color: 'text-purple-500' },
  { path: '/app/pages',         icon: FileText,      label: 'Pages',         color: 'text-sky-500' },
  { path: '/app/events',        icon: Calendar,      label: 'Events',        color: 'text-orange-500' },
  { path: '/app/marketplace',   icon: ShoppingBag,   label: 'Marketplace',   color: 'text-amber-500' },
  { path: '/app/jobs',          icon: Briefcase,     label: 'Jobs',          color: 'text-teal-500' },
  { path: '/app/learning',      icon: BookOpen,      label: 'Learning',      color: 'text-indigo-500' },
  { path: '/app/smartztv',      icon: Tv,            label: 'SmartzTV',      color: 'text-violet-500' },
  { path: '/app/ride',          icon: Car,           label: 'Ride',          color: 'text-emerald-500' },
  { path: '/app/spin',          icon: Zap,           label: 'Spin Chat',     color: 'text-fuchsia-500' },
  { path: '/app/subscriptions', icon: Crown,         label: 'Premium',       color: 'text-yellow-500' },
]

const bottomNav: NavItemDef[] = [
  { path: '/app/settings', icon: Settings,   label: 'Settings' },
  { path: '/app/help',     icon: HelpCircle, label: 'Help' },
]

interface LeftSidebarProps {
  unreadMessages: number
  unreadNotifs: number
}

function NavRow({
  item,
  active,
  liveBadge,
}: {
  item: NavItemDef
  active: boolean
  liveBadge?: string | null
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.path}
      title={item.label}
      className={`flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl transition-all group relative ${
        active
          ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20'
          : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink'
      }`}
    >
      <Icon className={`w-[1.05rem] h-[1.05rem] flex-shrink-0 ${!active && item.color ? item.color : ''}`} />
      <span className="text-sm font-semibold hidden lg:block truncate flex-1">{item.label}</span>
      {liveBadge && !active && (
        <span className="hidden lg:flex ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full bg-brand-pink text-white min-w-[18px] text-center">
          {liveBadge}
        </span>
      )}
      {liveBadge && !active && (
        <span className="lg:hidden absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-pink" />
      )}
    </Link>
  )
}

export default function LeftSidebar({ unreadMessages, unreadNotifs }: LeftSidebarProps) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [profileData, setProfileData] = useState<{ full_name?: string; avatar_url?: string } | null>(null)

  const isActive = (path: string) => location.pathname.startsWith(path)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfileData(data) })
  }, [user?.id])

  const displayName = profileData?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <aside className="hidden md:flex flex-col dark:bg-[#0D0A14] bg-white border-r dark:border-white/6 border-gray-100 flex-shrink-0 w-16 lg:w-64 transition-all duration-200 overflow-hidden">

      {/* Logo — sidebar top */}
      <div className="px-3 py-3.5 border-b dark:border-white/6 border-gray-100 flex items-center justify-center lg:justify-start">
        <Link to="/app/feed" className="flex items-center gap-2.5 group">
          <img src={logoImg} alt="SmartzConnect" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform flex-shrink-0" />
          <span className="font-display font-bold text-[1.05rem] hidden lg:block">
            <span className="text-gradient-love">Smartz</span>
            <span className="dark:text-white text-gray-900">Connect</span>
          </span>
        </Link>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 px-2 lg:px-3 py-4 overflow-y-auto space-y-0.5">

        <p className="text-[9px] font-black uppercase tracking-widest text-brand-pink px-2 lg:px-3 mb-2 hidden lg:block">Main</p>
        {mainNav.map(item => {
          const badge =
            item.label === 'Messages'      && unreadMessages > 0 ? String(Math.min(unreadMessages, 99)) :
            item.label === 'Notifications' && unreadNotifs   > 0 ? String(Math.min(unreadNotifs,   99)) :
            item.badge ?? null
          return <NavRow key={item.path} item={item} active={isActive(item.path)} liveBadge={badge} />
        })}

        <div className="h-px dark:bg-white/5 bg-gray-100 my-3 mx-1" />

        <p className="text-[9px] font-black uppercase tracking-widest text-brand-pink px-2 lg:px-3 mb-2 hidden lg:block">Calls</p>
        {callsNav.map(item => (
          <NavRow key={item.path} item={item} active={isActive(item.path)} />
        ))}

        <div className="h-px dark:bg-white/5 bg-gray-100 my-3 mx-1" />

        <p className="text-[9px] font-black uppercase tracking-widest text-brand-pink px-2 lg:px-3 mb-2 hidden lg:block">Explore</p>
        {exploreNav.map(item => (
          <NavRow key={item.path} item={item} active={isActive(item.path)} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 lg:px-3 py-3 border-t dark:border-white/6 border-gray-100 space-y-0.5">
        {bottomNav.map(item => (
          <NavRow key={item.path} item={item} active={isActive(item.path)} />
        ))}

        <button onClick={toggleTheme}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          className="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-xl dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-gray-50 hover:text-brand-pink transition-all text-sm font-semibold">
          {theme === 'dark'
            ? <Sun className="w-[1.05rem] h-[1.05rem] flex-shrink-0" />
            : <Moon className="w-[1.05rem] h-[1.05rem] flex-shrink-0" />}
          <span className="hidden lg:block">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* User card — lg only */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 transition-colors mt-1">
          <div className="w-8 h-8 rounded-full bg-love-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
            {profileData?.avatar_url
              ? <img src={profileData.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              : displayName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold dark:text-white text-gray-900 truncate">{displayName}</p>
            <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} title="Sign Out"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 dark:text-gray-500 text-gray-400 transition-colors flex-shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sign out icon only — md */}
        <button onClick={signOut} title="Sign Out"
          className="lg:hidden w-full flex items-center justify-center py-2 rounded-xl dark:text-gray-400 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
