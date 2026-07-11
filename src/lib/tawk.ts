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

export {}
