/**
 * notifyUser — unified helper that calls the `send-push` edge function,
 * which both persists a row to public.notifications AND fires a real
 * OneSignal push notification (device sound, works screen on/off).
 *
 * Usage: fire-and-forget — never blocks the calling UI action.
 */
import { supabase } from '@/lib/supabase'

interface NotifyUserParams {
  userId: string
  type: string
  title: string
  message: string
  actionUrl?: string
  emoji?: string
  imageUrl?: string
}

// Note: the `send-push` edge function always attributes the notification's
// `from_user_id` to the authenticated caller (not a client-supplied value) —
// this cannot be spoofed. There is intentionally no `fromUserId` param here.
export async function notifyUser({
  userId,
  type,
  title,
  message,
  actionUrl,
  emoji,
  imageUrl,
}: NotifyUserParams): Promise<void> {
  try {
    await supabase.functions.invoke('send-push', {
      body: {
        userId,
        type,
        title,
        message,
        actionUrl,
        emoji,
        imageUrl,
      },
    })
  } catch (err) {
    // Never throw — notification failure must never block UI actions
    console.warn('[notifyUser] push failed silently:', err)
  }
}
