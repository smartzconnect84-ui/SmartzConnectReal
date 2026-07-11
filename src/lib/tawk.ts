// Thin wrapper around the global Tawk.to widget API.
// The widget script itself is loaded directly in index.html (before </body>),
// so it is present on every route without any React mounting/lazy-loading.
// Tawk's own floating launcher bubble is the only support widget in the app
// (pinned to a bottom-right fallback position via Tawk_API.customStyle in
// index.html) — there is no custom app-side FAB to keep in sync with it.

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

/**
 * Opens (maximizes) the Tawk.to chat widget.
 * Safe to call even if the embed script hasn't finished loading yet —
 * it will retry briefly until `window.Tawk_API` becomes available.
 */
export function openTawkChat() {
  const api = window.Tawk_API
  if (api?.maximize) {
    api.maximize()
    return
  }
  // Script loads asynchronously; give it a moment on slow connections/first paint.
  let attempts = 0
  const retry = setInterval(() => {
    attempts += 1
    if (window.Tawk_API?.maximize) {
      window.Tawk_API.maximize()
      clearInterval(retry)
    } else if (attempts >= 20) {
      clearInterval(retry)
    }
  }, 300)
}

export {}
