import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Heart, MessageCircle, Users, Zap, Check, Trash2, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/hooks/useAuth'

const tabs = [
  { key: 'all',     label: 'All',      icon: Bell },
  { key: 'match',   label: 'Matches',  icon: Heart },
  { key: 'message', label: 'Messages', icon: MessageCircle },
  { key: 'group',   label: 'Groups',   icon: Users },
  { key: 'system',  label: 'System',   icon: Zap },
]

const typeConfig: Record<string, { color: string; bg: string }> = {
  match:   { color: 'text-pink-500',    bg: 'bg-pink-500/10' },
  like:    { color: 'text-rose-500',    bg: 'bg-rose-500/10' },
  message: { color: 'text-purple-500',  bg: 'bg-purple-500/10' },
  group:   { color: 'text-blue-500',    bg: 'bg-blue-500/10' },
  system:  { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  promo:   { color: 'text-amber-500',   bg: 'bg-amber-500/10' },
  spin:    { color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markRead, markAllRead, deleteNotification, refresh } = useNotifications()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const filtered = notifications.filter(n => activeTab === 'all' || n.type === activeTab)

  const handleNotificationClick = (n: typeof notifications[0]) => {
    markRead(n.id)
    if (!n.action_url) return
    try {
      // Handle absolute URLs that point to this same domain (e.g. from push notifications
      // that embed the full domain). Strip the origin and navigate internally so the
      // React Router tree handles the route — avoids a full-page reload to the public site.
      const parsed = new URL(n.action_url)
      if (parsed.hostname === window.location.hostname) {
        navigate(parsed.pathname + parsed.search + parsed.hash)
      } else {
        window.open(n.action_url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      // Relative path (e.g. /app/profile/uuid) — navigate directly
      navigate(n.action_url)
    }
  }

  return (
    <div className="h-full overflow-y-auto dark:bg-[#0A0710] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-5 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Notifications 🔔</h1>
            {unreadCount > 0 && (
              <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh}
              className="w-9 h-9 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-soft border border-pink-500/20 dark:text-pink-300 text-pink-600 text-xs font-semibold hover:bg-pink-500/10 transition-colors">
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 dark:bg-[#130E1E] bg-white border dark:border-white/6 border-gray-200 rounded-2xl p-1 mb-4 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  activeTab === tab.key ? 'bg-love-gradient text-white shadow-sm' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'
                }`}>
                <Icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            )
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-brand-pink/30 border-t-brand-pink animate-spin" />
            <p className="text-sm dark:text-gray-400 text-gray-500">Loading notifications…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-love-soft flex items-center justify-center">
              <Bell className="w-8 h-8 text-brand-pink" />
            </div>
            <div className="text-center">
              <p className="font-bold dark:text-white text-gray-900 mb-1">No notifications yet</p>
              <p className="text-sm dark:text-gray-400 text-gray-500">When you get matches, messages, and updates they'll appear here</p>
            </div>
          </div>
        )}

        {/* Notification list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((n, i) => {
                const cfg = typeConfig[n.type] || typeConfig.system
                const timeLabel = relativeTime(n.created_at)
                return (
                  <motion.div key={n.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      !n.read
                        ? 'dark:bg-[#1A1228] bg-white dark:border-white/10 border-pink-100 shadow-sm'
                        : 'dark:bg-[#130E1E]/50 bg-white/50 dark:border-white/5 border-gray-100'
                    }`}>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${cfg.bg}${n.from_user_id && n.from_user_id !== user?.id ? ' cursor-pointer' : ''}`}
                      onClick={n.from_user_id && n.from_user_id !== user?.id ? (e) => { e.stopPropagation(); navigate(`/app/profile/${n.from_user_id}`) } : undefined}
                    >
                      {n.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold ${!n.read ? 'dark:text-white text-gray-900' : 'dark:text-gray-300 text-gray-700'}`}>
                          {n.title}
                          {!n.read && <span className="inline-block ml-2 w-2 h-2 rounded-full bg-brand-pink" />}
                        </p>
                        <span className="text-[10px] dark:text-gray-600 text-gray-400 flex-shrink-0 mt-0.5">{timeLabel}</span>
                      </div>
                      <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteNotification(n.id) }}
                      className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
