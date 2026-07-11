// Thin wrapper around the global Tawk.to widget API.
// The widget script itself is loaded directly in index.html (before </body>),
// so it is present on every route without any React mounting/lazy-loading.

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void
      minimize?: () => void
      toggle?: () => void
      showWidget?: () => void
      hideWidget?: () => void
      onLoad?: () => void
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
    } else if (attempts >= 10) {
      clearInterval(retry)
    }
  }, 300)
}

export {}
