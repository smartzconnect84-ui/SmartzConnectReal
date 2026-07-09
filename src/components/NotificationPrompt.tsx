import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, BellOff } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/onesignal'
import { useAuth } from '@/hooks/useAuth'

export default function NotificationPrompt() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (!user) return
    // Only show if permission not yet granted/denied and not dismissed this session
    if (sessionStorage.getItem('notif-prompt-dismissed')) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return

    // Show after 8 seconds to let the user settle in
    const t = setTimeout(() => setShow(true), 8000)
    return () => clearTimeout(t)
  }, [user])

  const handleAllow = async () => {
    setRequesting(true)
    try {
      await requestNotificationPermission()
    } catch { /* ignore */ }
    setRequesting(false)
    setShow(false)
    sessionStorage.setItem('notif-prompt-dismissed', '1')
  }

  const handleDismiss = () => {
    setShow(false)
    sessionStorage.setItem('notif-prompt-dismissed', '1')
  }

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#130E1E] border border-gray-200 dark:border-purple-500/20 rounded-2xl shadow-2xl p-4 flex items-center gap-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm dark:text-white text-gray-900">Stay in the loop</p>
              <p className="text-xs dark:text-gray-400 text-gray-500">Enable notifications for messages & matches</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleAllow}
                disabled={requesting}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold disabled:opacity-60"
              >
                {requesting ? (
                  <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Bell className="w-3 h-3" />
                )}
                Allow
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center"
                title="Not now"
              >
                <BellOff className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
