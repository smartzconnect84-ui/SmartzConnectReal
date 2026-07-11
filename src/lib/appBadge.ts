/**
 * App Badging API helpers.
 *
 * Puts a small red count/dot on the installed PWA's home-screen /
 * taskbar icon (Badging API — supported on Chromium-based browsers
 * and installed PWAs on Android/desktop; Safari/iOS has no support
 * as of writing, so these are safely no-ops there).
 *
 * Docs: https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
 */

type NavigatorWithBadge = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

/**
 * Sets the app icon badge to `count`.
 * - Passing 0 clears the badge (per spec, setAppBadge(0) clears it).
 * - No-op (with a console warning) if the Badging API isn't supported.
 */
export async function updateAppBadge(count: number): Promise<void> {
  const nav = navigator as NavigatorWithBadge
  if (!nav.setAppBadge) {
    console.warn('[AppBadge] Badging API not supported in this browser')
    return
  }
  try {
    await nav.setAppBadge(count)
  } catch (err) {
    console.warn('[AppBadge] setAppBadge failed:', err)
  }
}

/** Clears the app icon badge entirely (e.g. when the user opens the app / reads the content). */
export async function clearAppBadge(): Promise<void> {
  const nav = navigator as NavigatorWithBadge
  if (!nav.clearAppBadge) {
    console.warn('[AppBadge] Badging API not supported in this browser')
    return
  }
  try {
    await nav.clearAppBadge()
  } catch (err) {
    console.warn('[AppBadge] clearAppBadge failed:', err)
  }
}
