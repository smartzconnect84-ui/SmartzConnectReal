import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, MessageCircle, Heart, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface ToastItem {
  id: string
  title: string
  body: string
  type: string
  link?: string | null
}

const ICONS: Record<string, JSX.Element> = {
  message: <MessageCircle className="w-4 h-4 text-white" />,
  match:   <Heart className="w-4 h-4 text-white" />,
}

/**
 * Global real-time toast for the `notifications` table. Lets users see new
 * activity (matches, messages, likes, etc.) pop up live while they are
 * anywhere inside the app, not just on the Notifications page.
 */
export default function NotificationToast() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const ch = supabase
      .channel('shell:notif-toast')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        payload => {
          const row = payload.new as any
          const toast: ToastItem = {
            id: row.id,
            title: row.title || 'New notification',
            body: row.body || row.message || '',
            type: row.type || 'general',
            link: row.action_url || row.link || row.url || null,
          }
          setToasts(prev => [...prev.slice(-2), toast])
          // Play a light chime if available; ignore failures silently (autoplay policies).
          try {
            const audio = new Audio('/sounds/notify.mp3')
            audio.volume = 0.4
            audio.play().catch(() => {})
          } catch { /* no-op */ }
          setTimeout(() => dismiss(toast.id), 6000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user?.id, dismiss])

  const handleClick = (toast: ToastItem) => {
    dismiss(toast.id)
    if (toast.link) navigate(toast.link)
    else navigate('/app/notifications')
  }

  return (
    <div className="fixed top-16 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            className="w-72 pointer-events-auto dark:bg-[#130E1E] bg-white border dark:border-white/10 border-gray-200 rounded-2xl shadow-2xl p-3 flex items-start gap-2.5 cursor-pointer"
            onClick={() => handleClick(toast)}
          >
            <div className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
              {ICONS[toast.type] || <Bell className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{toast.title}</p>
              {toast.body && <p className="text-xs dark:text-gray-400 text-gray-500 line-clamp-2">{toast.body}</p>}
            </div>
            <button
              onClick={e => { e.stopPropagation(); dismiss(toast.id) }}
              className="w-5 h-5 rounded-md dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-3 h-3 dark:text-gray-400 text-gray-500" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
