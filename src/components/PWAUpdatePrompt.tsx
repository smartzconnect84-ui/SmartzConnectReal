import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

/**
 * Watches the registered service worker for a new version and prompts the
 * user to reload once one is waiting to activate. Without this, users can
 * sit on a stale cached build indefinitely since the SW updates silently
 * in the background (skipWaiting() alone doesn't refresh open tabs).
 */
export default function PWAUpdatePrompt() {
  const [show, setShow] = useState(false)
  const waitingWorkerRef = useRef<ServiceWorker | null>(null)
  const reloadingRef = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

    const promptIfWaiting = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller) {
        waitingWorkerRef.current = reg.waiting
        setShow(true)
      }
    }

    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return
      promptIfWaiting(reg)

      // A new SW finished installing while this tab was open.
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorkerRef.current = newWorker
            setShow(true)
          }
        })
      })

      // Periodically check for a new build (covers tabs left open for a
      // long time, since 'updatefound' only fires on navigation/interval).
      const interval = setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)
      return () => clearInterval(interval)
    })

    // Once the new SW takes control, reload exactly once to pick it up.
    const onControllerChange = () => {
      if (reloadingRef.current) return
      reloadingRef.current = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }, [])

  const handleUpdate = () => {
    waitingWorkerRef.current?.postMessage({ type: 'SKIP_WAITING' })
    setShow(false)
  }

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-[60] flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#130E1E] border border-gray-200 dark:border-purple-500/20 rounded-2xl shadow-2xl p-4 flex items-center gap-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm dark:text-white text-gray-900">Update available</p>
              <p className="text-xs dark:text-gray-400 text-gray-500">A new version of SmartzConnect is ready.</p>
            </div>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold flex-shrink-0"
            >
              Reload
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
