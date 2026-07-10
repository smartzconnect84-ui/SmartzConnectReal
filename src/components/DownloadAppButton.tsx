import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Smartphone, ExternalLink, CheckCircle, Share, X } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

interface DownloadAppButtonProps {
  /** Visual variant — 'primary' uses the brand gradient, 'secondary' is glass/outline */
  variant?: 'primary' | 'secondary'
  /** Extra Tailwind classes to apply to the button wrapper */
  className?: string
}

/** iOS "Add to Home Screen" instruction modal */
function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Sheet */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          onClick={e => e.stopPropagation()}
          className="relative z-10 w-full max-w-sm bg-[#130E1E] border border-white/10 rounded-2xl p-6 shadow-2xl"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)' }}>
            <Smartphone className="w-7 h-7 text-white" />
          </div>

          <h3 className="text-white font-bold text-lg mb-1">Install SmartzConnect</h3>
          <p className="text-white/50 text-sm mb-5">
            Add to your Home Screen for a full-screen, app-like experience.
          </p>

          {/* Steps */}
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-white text-sm font-medium">Tap the Share button</p>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                  <Share className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-white/60 text-xs">Share</span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-white text-sm font-medium">Scroll down and tap</p>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-white/60 text-xs font-medium">＋ Add to Home Screen</span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <p className="text-white text-sm font-medium mt-0.5">Tap <strong className="text-white">Add</strong> to confirm</p>
            </li>
          </ol>

          <button
            onClick={onClose}
            className="mt-6 w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)' }}
          >
            Got it!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * DownloadAppButton
 *
 * A self-contained CTA button that handles all PWA install scenarios:
 *   - Android/Chrome  → native beforeinstallprompt
 *   - iOS Safari      → modal with "Share → Add to Home Screen" steps
 *   - Already installed → "Open App" label
 *   - Unsupported     → opens the web app in a new tab
 */
export default function DownloadAppButton({
  variant = 'primary',
  className = '',
}: DownloadAppButtonProps) {
  const { installState, showIOSModal, setShowIOSModal, triggerInstall } = usePWAInstall()
  const [loading, setLoading] = useState(false)
  const [justInstalled, setJustInstalled] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    const result = await triggerInstall()
    setLoading(false)
    if (result === 'accepted') {
      setJustInstalled(true)
      setTimeout(() => setJustInstalled(false), 3000)
    }
  }

  // Label + icon based on current state
  const label = (() => {
    if (justInstalled) return 'Installed!'
    if (installState === 'installed') return 'Open App'
    if (installState === 'ios') return 'Install App'
    if (installState === 'ready') return 'Download App'
    if (installState === 'unsupported') return 'Open App'
    return 'Download App' // pending
  })()

  const Icon = (() => {
    if (justInstalled) return CheckCircle
    if (installState === 'installed') return ExternalLink
    if (installState === 'unsupported') return ExternalLink
    return Download
  })()

  const isPrimary = variant === 'primary'

  return (
    <>
      <motion.button
        onClick={handleClick}
        disabled={loading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={[
          'inline-flex items-center gap-2 font-bold text-sm sm:text-base rounded-xl transition-all',
          'px-6 sm:px-8 py-3 sm:py-3.5',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          isPrimary
            ? 'text-white'
            : 'text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20',
          className,
        ].join(' ')}
        style={isPrimary ? {
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 60%, #DC2626 100%)',
          boxShadow: '0 8px 28px rgba(139,92,246,0.40)',
        } : undefined}
        aria-label={label}
      >
        {loading ? (
          /* Spinner */
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <Icon className="w-4 h-4" />
        )}
        {label}
      </motion.button>

      {/* iOS instruction modal */}
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  )
}
