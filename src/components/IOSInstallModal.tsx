import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Share, X } from 'lucide-react'

/**
 * Shared iOS "Add to Home Screen" instructions modal.
 *
 * Safari never fires `beforeinstallprompt`, so there is no native install
 * dialog on iOS — the only way to install is the manual Share → Add to Home
 * Screen flow. This modal walks the user through those exact steps and is
 * shared by every entry point that can trigger an iOS install (the floating
 * PWAInstallPrompt banner and the DownloadAppButton).
 */
export default function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          onClick={e => e.stopPropagation()}
          className="relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
          style={{ background: 'rgba(19,14,30,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" aria-label="Close">
            <X className="w-4 h-4 text-white/60" />
          </button>
          <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">Install SmartzConnect</h3>
          <p className="text-white/50 text-sm mb-5">Add to your Home Screen for a full-screen, app-like experience.</p>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-white text-sm font-medium">Tap the Share button</p>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                  <Share className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-white/60 text-xs">Share</span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-white text-sm font-medium">Scroll down and tap</p>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-white/60 text-xs font-medium">＋ Add to Home Screen</span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <p className="text-white text-sm font-medium mt-0.5">Tap <strong className="text-white">Add</strong> to confirm</p>
            </li>
          </ol>
          <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            Got it!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
