import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Rocket, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { usePublicSite } from '@/contexts/PublicSiteContext'
import { useAnnouncement } from '@/contexts/AnnouncementContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'

/**
 * Public-site live-update toast.
 * When an admin hits "Publish live", every open client gets the new version
 * via realtime, refreshes branding + announcements (offline cache stays until
 * then), and shows a small "Updated" notice.
 */
export default function PublicLiveToast() {
  const { updateAvailable, meta, refreshPublicData, dismissUpdate, isOnline } = usePublicSite()
  const { refetch: refetchAnn } = useAnnouncement()
  const { refetch: refetchCfg } = useSiteConfig()
  const [showUpdated, setShowUpdated] = useState(false)
  const [cachedNote, setCachedNote] = useState(false)

  // Refresh data the moment a new version arrives.
  useEffect(() => {
    if (!updateAvailable) return
    let cancelled = false
    ;(async () => {
      try {
        await Promise.allSettled([refreshPublicData(), refetchAnn(), refetchCfg()])
      } finally {
        if (!cancelled) {
          dismissUpdate()
          setShowUpdated(true)
          setTimeout(() => setShowUpdated(false), 4000)
        }
      }
    })()
    return () => { cancelled = true }
  }, [updateAvailable, refreshPublicData, refetchAnn, refetchCfg, dismissUpdate])

  // Tell visitors once when they are seeing the cached copy offline.
  useEffect(() => {
    if (!isOnline) {
      setCachedNote(true)
    } else if (cachedNote) {
      const t = setTimeout(() => setCachedNote(false), 2500)
      return () => clearTimeout(t)
    }
  }, [isOnline, cachedNote])

  return (
    <AnimatePresence>
      {(showUpdated || (!isOnline && cachedNote)) && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold text-white ${
            !isOnline ? 'bg-gray-900' : 'bg-emerald-500'
          }`}
          role="status"
        >
          {!isOnline ? (
            <><WifiOff className="w-3.5 h-3.5" /> Offline — showing last published version</>
          ) : (
            <><Rocket className="w-3.5 h-3.5" /> Public site updated{meta?.version ? ` · v${meta.version}` : ''}</>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
