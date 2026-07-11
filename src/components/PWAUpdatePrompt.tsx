import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

/**
 * PWA update prompt.
 *
 * When the service worker activates a new version it posts SW_UPDATED to all
 * open windows. This component:
 *  1. Shows a visible "Update available" banner with a manual Refresh button
 *     (previously this was completely silent — users had no way to see or
 *     trigger an update, which is why the prompt appeared to "not work").
 *  2. Also schedules an automatic reload the next time the tab is hidden, as
 *     a safety net for users who never notice/tap the banner.
 *
 * First-install guard: we snapshot whether a SW was already in control when
 * this component mounted. If not (first ever install), we skip both the
 * banner and the reload — the page already has the latest code.
 */
export default function PWAUpdatePrompt() {
  const [show, setShow] = useState(false)
  const reloadScheduledRef = useRef(false)
  const hadControllerRef = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

    hadControllerRef.current = !!navigator.serviceWorker.controller

    const doReload = () => {
      if (reloadScheduledRef.current) return
      reloadScheduledRef.current = true
      window.location.reload()
    }

    const scheduleAutoReload = () => {
      const onHide = () => {
        if (document.visibilityState === 'hidden') {
          document.removeEventListener('visibilitychange', onHide)
          doReload()
        }
      }
      document.addEventListener('visibilitychange', onHide)
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'SW_UPDATED') return
      if (!hadControllerRef.current) return // first install — nothing to update
      setShow(true)
      scheduleAutoReload()
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[60] flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#130E1E] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm dark:text-white text-gray-900">Update available</p>
              <p className="text-xs dark:text-gray-400 text-gray-500 truncate">A new version of SmartzConnect is ready</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold flex-shrink-0"
            >
              Refresh
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
