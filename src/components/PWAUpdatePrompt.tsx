import { useEffect, useRef } from 'react'

/**
 * Silent PWA auto-updater — no banner, no user interaction required.
 *
 * When the service worker activates a new version it posts SW_UPDATED to all
 * open windows. This component listens for that message and reloads the page
 * as soon as it is safe to do so:
 *
 *  • Tab is hidden  → reload immediately (user isn't looking).
 *  • Tab is visible → wait for the next visibilitychange → hidden, then reload.
 *
 * First-install guard: we snapshot whether a SW was already in control when
 * this component mounted. If not (first ever install), we skip the reload —
 * the page already has the latest code and reloading would interrupt the
 * initial chunk downloads for no benefit.
 *
 * Renders nothing — purely side-effect logic.
 */
export default function PWAUpdatePrompt() {
  const reloadScheduledRef = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

    // First-install guard: if no SW was in control on mount, this is a fresh
    // install — skip the reload so chunk downloads aren't interrupted.
    const hadControllerOnMount = !!navigator.serviceWorker.controller

    const scheduleReload = () => {
      if (reloadScheduledRef.current) return
      reloadScheduledRef.current = true

      if (document.visibilityState === 'hidden') {
        // Tab already in background — reload now, user won't notice.
        window.location.reload()
      } else {
        // Tab is visible — wait until user switches away, then reload silently.
        const onHide = () => {
          if (document.visibilityState === 'hidden') {
            document.removeEventListener('visibilitychange', onHide)
            window.location.reload()
          }
        }
        document.addEventListener('visibilitychange', onHide)
      }
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'SW_UPDATED') return
      if (!hadControllerOnMount) return  // first install — skip
      scheduleReload()
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

  return null
}
