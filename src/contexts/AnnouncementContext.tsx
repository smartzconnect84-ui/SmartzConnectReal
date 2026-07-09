import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type AnnouncementType = 'info' | 'warning' | 'success' | 'error' | 'promo'

export interface Announcement {
  id: string
  message: string
  type: AnnouncementType
  is_active: boolean
  link_text?: string | null
  link_url?: string | null
  created_at?: string
  created_by?: string | null
}

interface AnnouncementContextType {
  announcements: Announcement[]
  activeAnnouncement: Announcement | null
  bannerEnabled: boolean
  setBannerEnabled: (v: boolean) => void
  refetch: () => Promise<void>
  // Admin actions
  addAnnouncement: (a: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>
  updateAnnouncement: (id: string, a: Partial<Announcement>) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>
  toggleAnnouncement: (id: string, active: boolean) => Promise<void>
}

const BANNER_ENABLED_KEY = 'sc-banner-enabled'
const LOCAL_ANN_KEY = 'sc-local-announcements'

const AnnouncementContext = createContext<AnnouncementContextType>({
  announcements: [],
  activeAnnouncement: null,
  bannerEnabled: true,
  setBannerEnabled: () => {},
  refetch: async () => {},
  addAnnouncement: async () => {},
  updateAnnouncement: async () => {},
  deleteAnnouncement: async () => {},
  toggleAnnouncement: async () => {},
})

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [bannerEnabled, setBannerEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(BANNER_ENABLED_KEY)
    return stored === null ? true : stored === 'true'
  })
  const [useLocal, setUseLocal] = useState(false)

  const setBannerEnabled = useCallback((v: boolean) => {
    setBannerEnabledState(v)
    localStorage.setItem(BANNER_ENABLED_KEY, String(v))
  }, [])

  const loadLocalAnnouncements = useCallback((): Announcement[] => {
    try {
      const raw = localStorage.getItem(LOCAL_ANN_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }, [])

  const saveLocalAnnouncements = useCallback((list: Announcement[]) => {
    localStorage.setItem(LOCAL_ANN_KEY, JSON.stringify(list))
  }, [])

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('system_announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Only fall back to localStorage when the table genuinely doesn't exist.
      // Other errors (network, RLS, etc.) are transient — don't silently fork state.
      const isTableMissing =
        error.message?.includes('does not exist') ||
        error.message?.includes('relation') ||
        (error as any).code === '42P01' ||
        (error as any).code === 'PGRST116'

      if (isTableMissing) {
        setUseLocal(true)
        setAnnouncements(loadLocalAnnouncements())
      }
      // For all other errors: leave state unchanged, don't overwrite with stale localStorage
      return
    }
    setUseLocal(false)
    setAnnouncements(data || [])
  }, [loadLocalAnnouncements])

  useEffect(() => { refetch() }, [refetch])

  const addAnnouncement = useCallback(async (a: Omit<Announcement, 'id' | 'created_at'>) => {
    if (useLocal) {
      const newItem: Announcement = {
        ...a,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      const updated = [newItem, ...loadLocalAnnouncements()]
      saveLocalAnnouncements(updated)
      setAnnouncements(updated)
      return
    }
    await supabase.from('system_announcements').insert(a)
    await refetch()
  }, [useLocal, loadLocalAnnouncements, saveLocalAnnouncements, refetch])

  const updateAnnouncement = useCallback(async (id: string, a: Partial<Announcement>) => {
    if (useLocal) {
      const updated = loadLocalAnnouncements().map(x => x.id === id ? { ...x, ...a } : x)
      saveLocalAnnouncements(updated)
      setAnnouncements(updated)
      return
    }
    await supabase.from('system_announcements').update(a).eq('id', id)
    await refetch()
  }, [useLocal, loadLocalAnnouncements, saveLocalAnnouncements, refetch])

  const deleteAnnouncement = useCallback(async (id: string) => {
    if (useLocal) {
      const updated = loadLocalAnnouncements().filter(x => x.id !== id)
      saveLocalAnnouncements(updated)
      setAnnouncements(updated)
      return
    }
    await supabase.from('system_announcements').delete().eq('id', id)
    await refetch()
  }, [useLocal, loadLocalAnnouncements, saveLocalAnnouncements, refetch])

  const toggleAnnouncement = useCallback(async (id: string, active: boolean) => {
    await updateAnnouncement(id, { is_active: active })
  }, [updateAnnouncement])

  const activeAnnouncement = announcements.find(a => a.is_active) ?? null

  return (
    <AnnouncementContext.Provider value={{
      announcements,
      activeAnnouncement,
      bannerEnabled,
      setBannerEnabled,
      refetch,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      toggleAnnouncement,
    }}>
      {children}
    </AnnouncementContext.Provider>
  )
}

export const useAnnouncement = () => useContext(AnnouncementContext)
