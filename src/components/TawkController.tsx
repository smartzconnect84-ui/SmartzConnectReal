import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle, X } from 'lucide-react'
import { recomputeTawkVisibility, openTawkChat, initTawkChatOpenTracking, subscribeTawkChatOpen } from '@/lib/tawk'

const DISMISS_KEY = 'sc_tawk_dismissed'
const GREETED_KEY = 'sc_tawk_greeted'
const GREETING_DELAY_MS = 3500

/**
 * Drives visibility of the Tawk.to widget:
 * - Only ever shown on the public marketing site (never inside /app or /admin).
 * - Dismissable: Tawk's own bubble has no "hide forever" control, so we render
 *   a small custom "×" chip next to it. Clicking it hides the widget and
 *   collapses down to a small "Live Support" icon in the same bottom-right
 *   spot instead of disappearing — clicking that icon re-opens the widget.
 * - Greets first-time visitors: since Tawk's own dashboard-side auto-triggers
 *   aren't configurable from this codebase, a small speech-bubble greeting is
 *   shown once per browser (localStorage-gated) a few seconds after landing
 *   on a public page, inviting them to chat instead of waiting for a click.
 */
export default function TawkController() {
  const { pathname } = useLocation()
  const isPublic = !pathname.startsWith('/app') && !pathname.startsWith('/admin')
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })
  const [showGreeting, setShowGreeting] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    recomputeTawkVisibility()
  }, [isPublic, dismissed])

  useEffect(() => {
    initTawkChatOpenTracking()
    return subscribeTawkChatOpen(setChatOpen)
  }, [])

  useEffect(() => {
    if (!isPublic || dismissed) return
    let alreadyGreeted = false
    try { alreadyGreeted = localStorage.getItem(GREETED_KEY) === '1' } catch { /* ignore */ }
    if (alreadyGreeted) return

    const timer = setTimeout(() => {
      setShowGreeting(true)
      try { localStorage.setItem(GREETED_KEY, '1') } catch { /* ignore */ }
    }, GREETING_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isPublic, dismissed])

  if (!isPublic) return null

  const dismiss = () => {
    setShowGreeting(false)
    setDismissed(true)
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  const restore = () => {
    setDismissed(false)
    try { sessionStorage.removeItem(DISMISS_KEY) } catch { /* ignore */ }
    openTawkChat()
  }

  const openFromGreeting = () => {
    setShowGreeting(false)
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
    <>
      {showGreeting && (
        <div className="fixed bottom-[92px] right-5 z-[2147483000] max-w-[240px] animate-[fadeIn_0.3s_ease-out]">
          <div className="relative bg-white text-gray-900 rounded-2xl shadow-2xl p-4 pr-8">
            <button
              onClick={() => setShowGreeting(false)}
              title="Dismiss"
              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="text-sm font-semibold mb-1">👋 Need a hand?</p>
            <p className="text-xs text-gray-500 mb-2.5">We're online and happy to help — chat with us anytime.</p>
            <button
              onClick={openFromGreeting}
              className="text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 transition-opacity"
            >
              Start chatting
            </button>
            <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-white rotate-45" />
          </div>
        </div>
      )}
      {/* Hidden while Tawk's own chat window is open — it sits right next to
          the launcher's resting spot and would otherwise overlap the chat
          window's own controls, letting an accidental click here fully hide
          live support mid-conversation. */}
      {!chatOpen && (
        <button
          onClick={dismiss}
          title="Hide live support"
          className="fixed bottom-[70px] right-[22px] z-[2147483000] w-6 h-6 rounded-full flex items-center justify-center bg-gray-800/90 text-white/80 hover:text-white hover:bg-gray-700 shadow-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </>
  )
}
