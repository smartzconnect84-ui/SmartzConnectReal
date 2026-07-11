import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle, X } from 'lucide-react'
import { showTawkWidget, hideTawkWidget, openTawkChat } from '@/lib/tawk'

const DISMISS_KEY = 'sc_tawk_dismissed'

/**
 * Drives visibility of the Tawk.to widget:
 * - Only ever shown on the public marketing site (never inside /app or /admin).
 * - Dismissable: Tawk's own bubble has no "hide forever" control, so we render
 *   a small custom "×" chip next to it. Clicking it hides the widget and
 *   collapses down to a small "Live Support" icon in the same bottom-right
 *   spot instead of disappearing — clicking that icon re-opens the widget.
 */
export default function TawkController() {
  const { pathname } = useLocation()
  const isPublic = !pathname.startsWith('/app') && !pathname.startsWith('/admin')
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    if (isPublic && !dismissed) {
      showTawkWidget()
    } else {
      hideTawkWidget()
    }
  }, [isPublic, dismissed])

  if (!isPublic) return null

  const dismiss = () => {
    setDismissed(true)
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  const restore = () => {
    setDismissed(false)
    try { sessionStorage.removeItem(DISMISS_KEY) } catch { /* ignore */ }
    openTawkChat()
  }

  if (dismissed) {
    return (
      <button
        onClick={restore}
        title="Live Support"
        className="fixed bottom-5 right-5 z-[2147483000] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/40 bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <button
      onClick={dismiss}
      title="Hide live support"
      className="fixed bottom-[70px] right-[22px] z-[2147483000] w-6 h-6 rounded-full flex items-center justify-center bg-gray-800/90 text-white/80 hover:text-white hover:bg-gray-700 shadow-md transition-colors"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  )
}
