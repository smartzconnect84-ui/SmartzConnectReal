// Thin wrapper around the global Tawk.to widget API.
// The widget script itself is loaded directly in index.html (before </body>),
// so it is present on every route without any React mounting/lazy-loading.
// Visibility is driven by <TawkController> (src/components/TawkController.tsx),
// which shows the widget on all public routes and hides it inside /app and /admin.

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
  if (api) { fn(api); return }
  let attempts = 0
  const retry = setInterval(() => {
    attempts += 1
    const a = window.Tawk_API
    if (a) { fn(a); clearInterval(retry) }
    else if (attempts >= 20) { clearInterval(retry) }
  }, 300)
}

/** Un-hides the widget launcher and opens the chat window. */
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

/**
 * Single source of truth for widget visibility:
 * - Public routes (/,  /pricing, /team, etc.) → always show.
 * - App/admin routes (/app/*, /admin/*) → always hide.
 * Called by index.html's Tawk_API.onLoad and by <TawkController> on every
 * route change so whichever runs last lands on the correct state.
 */
export function recomputeTawkVisibility() {
  try {
    const path = window.location.pathname
    const isPublic = !path.startsWith('/app') && !path.startsWith('/admin')
    if (isPublic) {
      showTawkWidget()
    } else {
      hideTawkWidget()
    }
  } catch {
    hideTawkWidget()
  }
}

// Exposed so the inline Tawk_API.onLoad handler in index.html can call the
// same visibility logic React uses.
if (typeof window !== 'undefined') {
  window.__recomputeTawkVisibility = recomputeTawkVisibility
}

declare global {
  interface Window {
    __recomputeTawkVisibility?: () => void
  }
}

export {}
