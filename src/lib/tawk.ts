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
  // The widget is fully hidden on load (see hideTawkWidget below) — per
  // Tawk's own API, hideWidget()/showWidget() control visibility of the
  // ENTIRE widget (launcher + chat window), not just the launcher bubble.
  // Calling maximize() while hidden does nothing, so we must un-hide it
  // first or the chat is silently unreachable.
  if (api?.showWidget && api?.maximize) {
    api.showWidget()
    api.maximize()
    return
  }
  // Script loads asynchronously; give it a moment on slow connections/first paint.
  let attempts = 0
  const retry = setInterval(() => {
    attempts += 1
    const a = window.Tawk_API
    if (a?.showWidget && a?.maximize) {
      a.showWidget()
      a.maximize()
      clearInterval(retry)
    } else if (attempts >= 20) {
      clearInterval(retry)
    }
  }, 300)
}

/**
 * Hides Tawk.to's own floating launcher bubble so it doesn't duplicate our
 * custom FloatingSupportWidget. Safe to call before the script has loaded —
 * retries briefly, same pattern as `openTawkChat`.
 */
export function hideTawkWidget() {
  const api = window.Tawk_API
  if (api?.hideWidget) {
    api.hideWidget()
    return
  }
  let attempts = 0
  const retry = setInterval(() => {
    attempts += 1
    if (window.Tawk_API?.hideWidget) {
      window.Tawk_API.hideWidget()
      clearInterval(retry)
    } else if (attempts >= 10) {
      clearInterval(retry)
    }
  }, 300)
}

/** Restores Tawk.to's own launcher bubble (not used by default; kept for parity). */
export function showTawkWidget() {
  window.Tawk_API?.showWidget?.()
}

export {}
