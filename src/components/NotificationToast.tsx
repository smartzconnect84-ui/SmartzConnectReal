import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, MessageCircle, Heart, UserPlus, Zap, Star,
  Gift, Video, Phone, Trophy, X, Volume2,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { streamClient } from '@/lib/stream'

/* ─────────────────────────────────────────────────────────── */
/* Types                                                        */
/* ─────────────────────────────────────────────────────────── */
interface ToastItem {
  id: string
  title: string
  body: string
  type: string
  emoji?: string
  link?: string | null
  fromAvatar?: string | null
  fromName?: string | null
  isStream?: boolean   // came from GetStream event (not DB row)
}

/* ─────────────────────────────────────────────────────────── */
/* Icon map by notification type                               */
/* ─────────────────────────────────────────────────────────── */
const TYPE_ICON: Record<string, { icon: typeof Bell; gradient: string }> = {
  message:   { icon: MessageCircle, gradient: 'from-violet-500 to-purple-600'  },
  match:     { icon: Heart,         gradient: 'from-pink-500 to-rose-600'      },
  like:      { icon: Heart,         gradient: 'from-rose-500 to-pink-600'      },
  follow:    { icon: UserPlus,      gradient: 'from-blue-500 to-violet-600'    },
  spin:      { icon: Zap,           gradient: 'from-yellow-500 to-orange-600'  },
  comment:   { icon: MessageCircle, gradient: 'from-emerald-500 to-teal-600'   },
  gift:      { icon: Gift,          gradient: 'from-amber-500 to-yellow-600'   },
  video:     { icon: Video,         gradient: 'from-cyan-500 to-blue-600'      },
  call:      { icon: Phone,         gradient: 'from-green-500 to-emerald-600'  },
  award:     { icon: Trophy,        gradient: 'from-yellow-400 to-amber-600'   },
  premium:   { icon: Star,          gradient: 'from-amber-400 to-yellow-500'   },
  system:    { icon: Bell,          gradient: 'from-slate-500 to-gray-600'     },
}

/* ─────────────────────────────────────────────────────────── */
/* Web Audio chime — no external file needed                   */
/* ─────────────────────────────────────────────────────────── */
let _audioCtx: AudioContext | null = null
function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return _audioCtx
}

export function playNotificationSound(soft = false) {
  try {
    const ctx   = getAudioCtx()
    const now   = ctx.currentTime
    const vol   = soft ? 0.15 : 0.28
    // Two-tone rising chime (880 Hz → 1318 Hz)
    const freqs = soft ? [660] : [880, 1318.51]
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t0 = now + i * 0.13
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55)
      osc.start(t0)
      osc.stop(t0 + 0.56)
    })
  } catch { /* autoplay policy or non-browser env */ }
}

/* ─────────────────────────────────────────────────────────── */
/* Global in-app toast component (mounted in AppShell)         */
/* ─────────────────────────────────────────────────────────── */
export default function NotificationToast() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [toasts, setToasts]   = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  /* auto-dismiss helper */
  const schedule = useCallback((id: string, ms = 7000) => {
    const t = setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id))
      timersRef.current.delete(id)
    }, ms)
    timersRef.current.set(id, t)
  }, [])

  const dismiss = useCallback((id: string) => {
    clearTimeout(timersRef.current.get(id))
    timersRef.current.delete(id)
    setToasts(prev => prev.filter(x => x.id !== id))
  }, [])

  /* push new toast (dedup by id, cap at 4) */
  const push = useCallback((toast: ToastItem, sound = true) => {
    setToasts(prev => {
      if (prev.some(t => t.id === toast.id)) return prev
      const next = [...prev.slice(-3), toast]
      return next
    })
    if (sound) playNotificationSound()
    schedule(toast.id)
  }, [schedule])

  /* ── 1. Supabase realtime: notifications table INSERT ───── */
  useEffect(() => {
    if (!user?.id) return

    const ch = supabase
      .channel(`notif-toast:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        payload => {
          const row = payload.new as any
          push({
            id:         String(row.id),
            title:      row.title || 'New notification',
            body:       row.body || row.message || '',
            type:       row.type || 'system',
            emoji:      row.emoji || undefined,
            link:       row.action_url || null,
            fromName:   row.from_name || null,
            fromAvatar: row.from_avatar || null,
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user?.id, push])

  /* ── 2. Stream: new messages while app is in foreground ─── */
  // Keep a ref to the current pathname so the handler closure always sees
  // the latest value without needing to be re-registered on every navigation.
  const locationRef = useRef(location.pathname)
  useEffect(() => { locationRef.current = location.pathname }, [location.pathname])

  useEffect(() => {
    if (!user?.id || !streamClient) return

    const handleStreamEvent = (event: any) => {
      // notification.message_new = message in a channel the user is member of
      // message.new = message in a channel currently being watched
      if (
        event.type !== 'notification.message_new' &&
        event.type !== 'message.new'
      ) return

      // Don't toast our own messages
      const senderId = event.message?.user?.id || event.user?.id
      if (!senderId || senderId === user.id) return

      const senderName   = event.message?.user?.name || event.user?.name || 'Someone'
      const senderAvatar = event.message?.user?.image || event.user?.image || null
      const text         = event.message?.text || ''
      const channelId    = event.channel_id || event.cid?.split(':')[1] || ''
      const channelType  = event.channel_type || event.cid?.split(':')[0] || 'messaging'

      // Build deep-link URL
      let link = '/app/matches'
      if (channelType === 'livestream') {
        link = '/app/worldchat'
      } else if (channelId.startsWith('group-')) {
        link = '/app/groups'
      } else {
        link = `/app/chat/${senderId}`
      }

      // ── Suppress toast when the user is already viewing this chat ───────────
      // If the user is on the exact page this message belongs to, they can see
      // the message inline — a toast would be redundant and annoying.
      const currentPath = locationRef.current
      const isOnTargetPage =
        (channelType === 'livestream' && currentPath === '/app/worldchat') ||
        (channelId.startsWith('group-') && currentPath === '/app/groups') ||
        (channelType !== 'livestream' && !channelId.startsWith('group-') &&
          currentPath === `/app/chat/${senderId}`)
      if (isOnTargetPage) return

      push({
        id:         `stream:${event.message?.id || Date.now()}`,
        title:      `💬 ${senderName}`,
        body:       text.length > 120 ? text.slice(0, 117) + '…' : text,
        type:       'message',
        link,
        fromAvatar: senderAvatar,
        fromName:   senderName,
        isStream:   true,
      }, true)
    }

    streamClient.on(handleStreamEvent)
    return () => { streamClient?.off(handleStreamEvent) }
  }, [user?.id, push])

  /* cleanup all timers on unmount */
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  const handleClick = (toast: ToastItem) => {
    dismiss(toast.id)
    navigate(toast.link || '/app/notifications')
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div
      className="fixed top-[68px] right-3 sm:right-4 z-[120] flex flex-col gap-2.5 pointer-events-none"
      style={{ maxWidth: 'min(320px, calc(100vw - 24px))' }}
    >
      <AnimatePresence>
        {toasts.map(toast => {
          const typeKey = toast.type in TYPE_ICON ? toast.type : 'system'
          const { icon: Icon, gradient } = TYPE_ICON[typeKey]
          return (
            <motion.div
              key={toast.id}
              initial={{ x: 80, opacity: 0, scale: 0.95 }}
              animate={{ x: 0,  opacity: 1, scale: 1 }}
              exit={{    x: 80, opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              onClick={() => handleClick(toast)}
              className="w-full pointer-events-auto cursor-pointer rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background:    'rgba(13, 10, 26, 0.93)',
                backdropFilter: 'blur(20px)',
                border:        '1px solid rgba(255,255,255,0.10)',
                boxShadow:     '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
              }}
            >
              {/* Gradient accent bar at top */}
              <div className={`h-0.5 w-full bg-gradient-to-r ${gradient}`} />

              <div className="flex items-start gap-3 p-3 pr-2">
                {/* Avatar or type icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {toast.fromAvatar ? (
                    <div className="relative">
                      <img
                        src={toast.fromAvatar}
                        alt={toast.fromName || ''}
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow`}>
                        <Icon className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                      {toast.emoji
                        ? <span className="text-base">{toast.emoji}</span>
                        : <Icon className="w-4 h-4 text-white" />
                      }
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-bold text-white truncate leading-tight">
                      {toast.title}
                    </p>
                    <Volume2 className="w-2.5 h-2.5 text-white/25 flex-shrink-0" />
                  </div>
                  {toast.body && (
                    <p className="text-xs text-white/55 line-clamp-2 leading-relaxed">
                      {toast.body}
                    </p>
                  )}
                </div>

                {/* Dismiss */}
                <button
                  onClick={e => { e.stopPropagation(); dismiss(toast.id) }}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/12 flex items-center justify-center flex-shrink-0 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-3 h-3 text-white/40" />
                </button>
              </div>

              {/* Tap to view CTA */}
              <div className="px-3 pb-2.5 flex items-center justify-between">
                <span className="text-[10px] text-white/25 font-medium">SmartzConnect</span>
                <span className="text-[10px] text-white/45 font-semibold">Tap to view →</span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
