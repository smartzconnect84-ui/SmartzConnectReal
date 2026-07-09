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
  setBannerEnabled: (v: boolean) => Promise<void>
  refetch: () => Promise<void>
  // Admin actions
  addAnnouncement: (a: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>
  updateAnnouncement: (id: string, a: Partial<Announcement>) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>
  toggleAnnouncement: (id: string, active: boolean) => Promise<void>
}

const LOCAL_ANN_KEY = 'sc-local-announcements'

const AnnouncementContext = createContext<AnnouncementContextType>({
  announcements: [],
  activeAnnouncement: null,
  bannerEnabled: true,
  setBannerEnabled: async () => {},
  refetch: async () => {},
  addAnnouncement: async () => {},
  updateAnnouncement: async () => {},
  deleteAnnouncement: async () => {},
  toggleAnnouncement: async () => {},
})

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  // Default true; real value loaded from platform_settings on mount
  const [bannerEnabled, setBannerEnabledState] = useState<boolean>(true)
  const [useLocal, setUseLocal] = useState(false)

  // ── Global banner toggle — read/write platform_settings ──────────────────

  const loadBannerSetting = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'banner_enabled')
        .maybeSingle()
      if (!error && data !== null) {
        setBannerEnabledState(data.value === true || data.value === 'true')
      }
    } catch { /* table may not exist yet — leave default true */ }
  }, [])

  const setBannerEnabled = useCallback(async (v: boolean) => {
    setBannerEnabledState(v)
    try {
      await supabase
        .from('platform_settings')
        .upsert({ key: 'banner_enabled', value: v, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    } catch { /* ignore */ }
  }, [])

  // Subscribe to realtime changes so all clients see the toggle immediately
  useEffect(() => {
    loadBannerSetting()

    const ch = supabase
      .channel('platform_settings:banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings', filter: 'key=eq.banner_enabled' }, (payload: any) => {
        if (payload.new?.value !== undefined) {
          setBannerEnabledState(payload.new.value === true || payload.new.value === 'true')
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [loadBannerSetting])

  // ── Announcements ────────────────────────────────────────────────────────

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
      const isTableMissing =
        error.message?.includes('does not exist') ||
        error.message?.includes('relation') ||
        (error as any).code === '42P01' ||
        (error as any).code === 'PGRST116'

      if (isTableMissing) {
        setUseLocal(true)
        setAnnouncements(loadLocalAnnouncements())
      }
      return
    }
    setUseLocal(false)
    setAnnouncements(data || [])
  }, [loadLocalAnnouncements])

  useEffect(() => { refetch() }, [refetch])

  // Realtime subscription for new/updated announcements
  useEffect(() => {
    const ch = supabase
      .channel('system_announcements:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_announcements' }, () => {
        refetch()
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [refetch])

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
