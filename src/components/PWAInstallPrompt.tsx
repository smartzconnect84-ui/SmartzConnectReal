import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import IOSInstallModal from '@/components/IOSInstallModal'

/**
 * Floating "Install SmartzConnect" banner — shown app-wide on both Android
 * (native beforeinstallprompt flow) and iOS (manual Share → Add to Home
 * Screen instructions via IOSInstallModal, since Safari never fires
 * beforeinstallprompt). Uses usePWAInstall so both platforms share one
 * source of truth for install state.
 */
export default function PWAInstallPrompt() {
  const { installState, showIOSModal, setShowIOSModal, triggerInstall } = usePWAInstall()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('pwa-install-dismissed')) return
    if (installState !== 'ready' && installState !== 'ios') return

    // Small delay so it doesn't pop up immediately on page load
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [installState])

  const handleInstall = async () => {
    const result = await triggerInstall()
    if (result === 'accepted') {
      setShow(false)
    }
    // 'ios' result opens the IOSInstallModal via showIOSModal — keep the
    // banner visible underneath in case the user dismisses the modal and
    // wants to try again.
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem('pwa-install-dismissed', '1')
  }

  return (
    <>
      <AnimatePresence>
        {show && !dismissed && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none"
          >
            <div className="w-full max-w-sm bg-white dark:bg-[#130E1E] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-3 pointer-events-auto">
              <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm dark:text-white text-gray-900">Install SmartzConnect</p>
                <p className="text-xs dark:text-gray-400 text-gray-500 truncate">Add to home screen for the best experience</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold"
                >
                  <Download className="w-3 h-3" /> Install
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

      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  )
}
