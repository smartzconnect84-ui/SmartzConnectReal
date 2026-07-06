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

export async function linkOneSignalUser(userId: string) {
  if (!appId) return

  const os = (window as any).OneSignal
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
  const os = (window as any).OneSignal
  if (!os) return false
  try {
    await os.Notifications.requestPermission()
    return os.Notifications.permission === true
  } catch {
    return false
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
