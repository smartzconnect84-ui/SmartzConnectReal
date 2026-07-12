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
