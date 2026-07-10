import { supabase } from '@/lib/supabase'

const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string

// OneSignal initialises on any domain as long as the App ID is set.
// Domain restrictions are configured inside the OneSignal dashboard
// (Site URL whitelist), not in client code.
export function initOneSignal() {
  if (!appId) return   // skip silently when not configured
  if (typeof window === 'undefined') return

  const script = document.createElement('script')
  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
  script.defer = true
  script.onload = () => {
    ;(window as any).OneSignalDeferred = (window as any).OneSignalDeferred || []
    ;(window as any).OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.init({
          appId,
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: import.meta.env.DEV,
          serviceWorkerParam: { scope: '/' },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
        })
      } catch (err) {
        // In dev, OneSignal restricts to the production domain — safe to ignore
        if (!import.meta.env.DEV) {
          console.warn('[OneSignal] init error:', err)
        }
      }
    })
  }
  document.head.appendChild(script)
}

/** Wait up to `maxMs` for OneSignal SDK to be available on the window object. */
async function waitForOneSignal(maxMs = 8000): Promise<any | null> {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    const os = (window as any).OneSignal
    // SDK is ready once it exposes Notifications (v16 API)
    if (os?.Notifications) return os
    await new Promise(r => setTimeout(r, 300))
  }
  return null
}

export async function linkOneSignalUser(userId: string) {
  if (!appId) return

  const os = await waitForOneSignal()
  if (!os) return

  try {
    await os.login(userId)
    await os.User.addTag('user_id', userId)
  } catch (err) {
    console.warn('[OneSignal] user link failed:', err)
  }
}

export async function unlinkOneSignalUser() {
  if (!appId) return
  const os = (window as any).OneSignal
  if (!os) return
  try {
    await os.logout()
  } catch { /* ignore */ }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!appId) return false

  const hasNativeApi = typeof window !== 'undefined' && 'Notification' in window
  const nativePerm = () => (hasNativeApi ? (window as any).Notification.permission : 'denied')

  // First try the native browser API directly — it's instant and works regardless of
  // whether OneSignal SDK initialised (e.g. domain not yet whitelisted in OneSignal).
  if (hasNativeApi && nativePerm() === 'default') {
    try {
      const result = await Promise.race<NotificationPermission>([
        (window as any).Notification.requestPermission(),
        new Promise<NotificationPermission>(resolve => setTimeout(() => resolve('default'), 12000)),
      ])
      if (result !== 'default') {
        // Native dialog answered — also nudge OneSignal so it picks up the change
        const os = (window as any).OneSignal
        if (os?.Notifications?.requestPermission) {
          os.Notifications.requestPermission().catch(() => {})
        }
        return result === 'granted'
      }
    } catch {
      // Firefox throws if called outside a user gesture — fall through to OneSignal path
    }
  }

  // Fallback: use the OneSignal SDK wrapper (needed on some browsers)
  const os = await waitForOneSignal()
  if (!os) return nativePerm() === 'granted'
  try {
    await Promise.race([
      os.Notifications.requestPermission(),
      new Promise(resolve => setTimeout(resolve, 12000)),
    ])
    return os.Notifications.permission === true || nativePerm() === 'granted'
  } catch {
    return nativePerm() === 'granted'
  }
}

export async function sendPushNotification({
  userId,
  title,
  message,
  url,
}: {
  userId: string
  title: string
  message: string
  url?: string
}) {
  try {
    await supabase.functions.invoke('send-push', {
      body: { userId, title, message, url },
    })
  } catch (err) {
    console.warn('[OneSignal] push send failed:', err)
  }
}
