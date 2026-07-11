import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LifeBuoy, MessageCircle, HelpCircle, X, ChevronLeft } from 'lucide-react'
import { openTawkChat, hideTawkWidget } from '@/lib/tawk'

const DISMISS_KEY = 'sc_support_widget_dismissed'

/**
 * Global floating "support" launcher shown on every non-admin page.
 * Replaces Tawk.to's own launcher bubble (hidden via hideTawkWidget) with a
 * branded floating action button offering two options — Live Support (opens
 * the Tawk chat window) and Help & Support (the /help page) — and can be
 * fully dismissed, collapsing to a small edge tab that restores it.
 */
export default function FloatingSupportWidget() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    hideTawkWidget()
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Admin pages already have their own live-chat icon in the header — avoid a duplicate.
  if (location.pathname.startsWith('/admin')) return null

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
    setDismissed(true)
    setOpen(false)
  }
  const restore = () => {
    try { sessionStorage.removeItem(DISMISS_KEY) } catch { /* ignore */ }
    setDismissed(false)
  }

  return (
    <div ref={rootRef} className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="w-64 rounded-2xl overflow-hidden shadow-2xl border dark:border-white/10 border-gray-100 dark:bg-[#130E1E] bg-white"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600">
              <p className="text-white text-sm font-bold">Need help?</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={() => { setOpen(false); openTawkChat() }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:dark:bg-white/5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-[18px] h-[18px] text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-white text-gray-900">Live Support</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-500">Chat with our team now</p>
                </div>
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/help') }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:dark:bg-white/5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-[18px] h-[18px] text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-white text-gray-900">Help & Support</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-500">FAQs, guides & contact info</p>
                </div>
              </button>
            </div>
            <button
              onClick={dismiss}
              className="w-full text-center text-[11px] dark:text-gray-500 text-gray-400 py-2 border-t dark:border-white/5 border-gray-100 hover:dark:text-gray-300 hover:text-gray-600 transition-colors"
            >
              Hide this widget
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {dismissed ? (
        <motion.button
          initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
          onClick={restore}
          title="Show support"
          className="w-8 h-9 rounded-l-xl flex items-center justify-center dark:bg-[#130E1E] bg-white shadow-lg border dark:border-white/10 border-gray-100 dark:text-gray-500 text-gray-400 hover:dark:text-white hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
          onClick={() => setOpen(v => !v)}
          title="Support"
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-purple-900/40 bg-gradient-to-br from-purple-600 to-pink-600 text-white"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span key="icon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <LifeBuoy className="w-6 h-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  )
}
