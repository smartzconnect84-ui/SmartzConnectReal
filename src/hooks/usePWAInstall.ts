import { useState, useEffect } from 'react'

/** Extends the standard Event type to include the PWA install prompt API. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type PWAInstallState =
  | 'unsupported'   // Browser cannot install PWAs at all
  | 'ios'           // iOS Safari — manual "Add to Home Screen" flow
  | 'installed'     // App is already running in standalone mode
  | 'ready'         // beforeinstallprompt fired; native prompt is available
  | 'pending'       // Waiting for beforeinstallprompt; may still arrive

/** Returns true when the page is running as an installed PWA (standalone). */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari specific
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Returns true on iOS/iPadOS (iPhone, iPad, iPod, and iPadOS 13+ which reports as Macintosh). */
function isIOS(): boolean {
  // Classic UA check covers iOS ≤ 12 and all iPhones/iPods
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) return true
  // iPadOS 13+ reports "Macintosh" but still exposes touch points
  if (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return true
  return false
}

/**
 * usePWAInstall
 *
 * Manages PWA installation state across three environments:
 *   - Android / Chrome: native beforeinstallprompt flow
 *   - iOS Safari:       show manual "Add to Home Screen" instructions
 *   - Desktop browsers: open the web app with a friendly message
 */
export function usePWAInstall() {
  const [installState, setInstallState] = useState<PWAInstallState>(() => {
    if (isStandalone()) return 'installed'
    if (isIOS()) return 'ios'
    return 'pending'
  })

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    // Already installed or iOS — no event-based flow needed.
    if (installState === 'installed' || installState === 'ios') return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setInstallState('ready')
    }

    window.addEventListener('beforeinstallprompt', handler)

    // If browser never fires the event it likely doesn't support install at all.
    const timeout = setTimeout(() => {
      setInstallState(prev => prev === 'pending' ? 'unsupported' : prev)
    }, 3000)

    // Detect if the user installs via the browser's own UI.
    const installedHandler = () => setInstallState('installed')
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
      clearTimeout(timeout)
    }
  }, [installState])

  /**
   * Trigger the install flow appropriate for the current platform.
   * Returns 'accepted' | 'dismissed' | 'ios' | 'unsupported'.
   */
  async function triggerInstall(): Promise<'accepted' | 'dismissed' | 'ios' | 'unsupported'> {
    if (installState === 'installed') return 'accepted'

    if (installState === 'ios') {
      setShowIOSModal(true)
      return 'ios'
    }

    if (installState === 'ready' && deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setInstallState('installed')
        setDeferredPrompt(null)
      }
      return outcome
    }

    // Unsupported or still pending — open the web app in a new tab.
    window.open(window.location.href, '_blank', 'noopener,noreferrer')
    return 'unsupported'
  }

  return {
    installState,
    showIOSModal,
    setShowIOSModal,
    triggerInstall,
  }
}
