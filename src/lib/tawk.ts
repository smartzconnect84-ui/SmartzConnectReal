// Thin wrapper around the global Tawk.to widget API.
// The widget script itself is loaded directly in index.html (before </body>),
// so it is present on every route without any React mounting/lazy-loading.
// It starts hidden (see index.html's Tawk_API.onLoad) — visibility is fully
// driven by <TawkController> (src/components/TawkController.tsx), which only
// shows it on public-site routes and lets the user dismiss it down to a
// small "Live Support" icon.

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void
      minimize?: () => void
      toggle?: () => void
      showWidget?: () => void
      hideWidget?: () => void
      onLoad?: () => void
      onChatMaximized?: () => void
      onChatMinimized?: () => void
      onChatHidden?: () => void
      onChatEnded?: () => void
      customStyle?: unknown
      [key: string]: unknown
    }
    Tawk_LoadStart?: Date
  }
}

/** Runs `fn` against `window.Tawk_API` now, or retries briefly if the async embed script hasn't loaded yet. */
function withTawkApi(fn: (api: NonNullable<Window['Tawk_API']>) => void) {
  const api = window.Tawk_API
  if (api) {
    fn(api)
    return
  }
  let attempts = 0
  const retry = setInterval(() => {
    attempts += 1
    const a = window.Tawk_API
    if (a) {
      fn(a)
      clearInterval(retry)
    } else if (attempts >= 20) {
      clearInterval(retry)
    }
  }, 300)
}

/** Un-hides the widget (launcher bubble) and opens the chat window. */
export function openTawkChat() {
  withTawkApi((api) => {
    api.showWidget?.()
    api.maximize?.()
  })
}

/** Shows Tawk's own floating launcher bubble. */
export function showTawkWidget() {
  withTawkApi((api) => api.showWidget?.())
}

/** Hides the entire widget (launcher + chat window). */
export function hideTawkWidget() {
  withTawkApi((api) => api.hideWidget?.())
}

const CHAT_OPEN_EVENT = 'tawk:chat-open-change'

/**
 * Tracks whether Tawk's own chat WINDOW (not just the launcher bubble) is
 * currently open, and broadcasts changes via a DOM CustomEvent. <TawkController>
 * listens to this so it can hide its small custom "×" dismiss chip while a
 * real conversation is open — the chip sits right next to the launcher's
 * resting spot, and without this it can overlap Tawk's own window controls,
 * so a click meant for Tawk (e.g. minimizing) could accidentally trigger our
 * "hide the whole widget" action and make live chat "disappear totally"
 * mid-conversation.
 */
function dispatchChatOpenChange(open: boolean) {
  try {
    window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: { open } }))
  } catch { /* ignore */ }
}

export function subscribeTawkChatOpen(cb: (open: boolean) => void) {
  const handler = (e: Event) => cb(Boolean((e as CustomEvent).detail?.open))
  window.addEventListener(CHAT_OPEN_EVENT, handler)
  return () => window.removeEventListener(CHAT_OPEN_EVENT, handler)
}

/** Wires Tawk's own lifecycle callbacks to the chat-open tracker above. Call once. */
export function initTawkChatOpenTracking() {
  withTawkApi((api) => {
    const prevMax = api.onChatMaximized
    const prevMin = api.onChatMinimized
    const prevHidden = api.onChatHidden
    const prevEnded = api.onChatEnded
    api.onChatMaximized = () => { prevMax?.(); dispatchChatOpenChange(true) }
    api.onChatMinimized = () => { prevMin?.(); dispatchChatOpenChange(false) }
    api.onChatHidden = () => { prevHidden?.(); dispatchChatOpenChange(false) }
    api.onChatEnded = () => { prevEnded?.(); dispatchChatOpenChange(false) }
  })
}

const DISMISS_KEY = 'sc_tawk_dismissed'

/**
 * Single source of truth for whether the widget should be visible right now:
 * public-site route + not dismissed this session. Both index.html's
 * `Tawk_API.onLoad` and <TawkController>'s mount effect call this same
 * function (instead of each independently calling show/hideWidget), so
 * whichever one runs last always lands on the correct state — no more race
 * between "React says show" and "Tawk's own onLoad says hide" depending on
 * which finishes loading first.
 */
export function recomputeTawkVisibility() {
  try {
    const path = window.location.pathname
    const isPublic = !path.startsWith('/app') && !path.startsWith('/admin')
    const dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'
    if (isPublic && !dismissed) {
      showTawkWidget()
    } else {
      hideTawkWidget()
    }
  } catch {
    hideTawkWidget()
  }
}

// Exposed so the inline Tawk_API.onLoad handler in index.html (which runs
// outside the React module graph) can trigger the exact same visibility
// logic React uses, rather than unconditionally hiding the widget.
if (typeof window !== 'undefined') {
  window.__recomputeTawkVisibility = recomputeTawkVisibility
}

declare global {
  interface Window {
    __recomputeTawkVisibility?: () => void
  }
}

export {}
