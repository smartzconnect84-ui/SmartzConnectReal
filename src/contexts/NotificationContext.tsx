/**
 * NotificationContext — single source of truth for in-app notification state.
 *
 * All surfaces (admin bell, user bell, mobile bottom nav, notification page)
 * share one realtime subscription and one unread count rather than each
 * subscribing independently and potentially disagreeing.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface NotificationRow {
  id: string
  type: string
  title: string
  body: string
  emoji: string
  action_url: string | null
  read: boolean
  created_at: string
  from_user_id: string | null
}

interface NotificationContextValue {
  notifications: NotificationRow[]
  unreadCount: number
  loading: boolean
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markRead: async () => {},
  markAllRead: async () => {},
  deleteNotification: async () => {},
  refresh: async () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(false)

  const mapRow = (n: any): NotificationRow => ({
    id: String(n.id),
    type: n.type || 'system',
    title: n.title || 'Notification',
    body: n.body || n.message || '',
    emoji: n.emoji || '🔔',
    action_url: n.action_url || null,
    read: n.read ?? false,
    created_at: n.created_at,
    from_user_id: n.from_user_id || null,
  })

  const refresh = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications((data || []).map(mapRow))
    setLoading(false)
  }, [user?.id])

  // Initial fetch
  useEffect(() => {
    refresh()
  }, [refresh])

  // Realtime subscription — single channel for the whole app
  useEffect(() => {
    if (!user?.id) return

    const ch = supabase
      .channel(`notifications:ctx:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = mapRow(payload.new)
          setNotifications(prev => {
            if (prev.some(n => n.id === row.id)) return prev
            return [row, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = mapRow(payload.new)
          setNotifications(prev => prev.map(n => n.id === row.id ? row : n))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const id = String((payload.old as any).id)
          setNotifications(prev => prev.filter(n => n.id !== id))
        }
      )
      .subscribe()

    // Re-fetch when tab becomes visible (may have missed events while backgrounded)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      supabase.removeChannel(ch)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user?.id, refresh])

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user?.id) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  }, [user?.id])

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markRead,
      markAllRead,
      deleteNotification,
      refresh,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
