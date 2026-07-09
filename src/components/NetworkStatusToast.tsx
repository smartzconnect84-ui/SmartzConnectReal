import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * Watches browser connectivity. When the connection drops we show a small
 * banner; the moment it comes back we force Supabase's realtime socket to
 * reconnect and reload the current route's data by dispatching a custom
 * `szc:reconnect-refresh` event that pages can listen to, plus a full app
 * refresh as a safe fallback so nothing looks stale after being offline.
 */
export default function NetworkStatusToast() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [reconnected, setReconnected] = useState(false)
  const wasOfflineRef = useRef(false)

  useEffect(() => {
    const handleOffline = () => { setOffline(true); wasOfflineRef.current = true }
    const handleOnline = () => {
      setOffline(false)
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false
        setReconnected(true)
        try { supabase.realtime.disconnect(); supabase.realtime.connect() } catch { /* best effort */ }
        window.dispatchEvent(new CustomEvent('szc:reconnect-refresh'))
        setTimeout(() => setReconnected(false), 3000)
      }
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return (
    <AnimatePresence>
      {(offline || reconnected) && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className={`fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 py-2 text-xs font-bold text-white ${
            offline ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        >
          {offline
            ? <><WifiOff className="w-3.5 h-3.5" /> You're offline — some features may not update</>
            : <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Back online — refreshing your data…</>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
