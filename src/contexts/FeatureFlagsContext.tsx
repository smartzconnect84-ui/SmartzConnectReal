import React, { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePublicSite } from '@/contexts/PublicSiteContext'

/**
 * Wires the `feature_toggles` platform_settings row (written by Admin →
 * Settings → Features) into the live app.
 *
 * AUDIT FIX: previously the toggles were Save-only — written to
 * platform_settings + localStorage but never read anywhere, so flipping
 * e.g. "Maintenance Mode" did nothing. Now:
 *  - flags load from platform_settings, fall back to cached localStorage,
 *  - realtime subscription keeps every client in sync,
 *  - Maintenance Mode gates the public site (see App.tsx),
 *  - any component can call `useFeatureFlags().isEnabled('Discover / Matching')`.
 */

const TOGGLES_KEY = 'feature_toggles'
const LOCAL_KEY = 'smartz_admin_settings'

interface CtxType {
  /** Raw id -> enabled map. */
  flags: Record<string, boolean>
  /** Look up by toggle id (t4) or label ("Discover / Matching"). */
  isEnabled: (idOrLabel: string) => boolean
  /** True when the Maintenance Mode toggle is on. */
  maintenanceMode: boolean
  loading: boolean
}

const Ctx = createContext<CtxType>({
  flags: {},
  isEnabled: () => true,
  maintenanceMode: false,
  loading: true,
})

function readLocal(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    const toggles = parsed?.toggles
    if (!Array.isArray(toggles)) return {}
    const map: Record<string, boolean> = {}
    for (const t of toggles) {
      if (t?.id) map[t.id] = !!t.enabled
      if (t?.label) map[t.label.toLowerCase()] = !!t.enabled
    }
    return map
  } catch {
    return {}
  }
}

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>(readLocal)
  const [loading, setLoading] = useState(true)
  const { version } = usePublicSite()

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', TOGGLES_KEY)
        .maybeSingle()
      if (error) throw error
      const val = (data as { value?: unknown } | null)?.value
      if (Array.isArray(val)) {
        const map: Record<string, boolean> = {}
        for (const t of val as Array<{ id?: string; label?: string; enabled?: boolean }>) {
          if (t?.id) map[t.id] = !!t.enabled
          if (t?.label) map[t.label.toLowerCase()] = !!t.enabled
        }
        setFlags(map)
      }
    } catch {
      // Offline / table missing — keep cached flags so the app keeps working.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Re-poll flags whenever a new public-site version is published,
  // and subscribe to realtime changes on the toggles row.
  useEffect(() => { load() }, [version, load])
  useEffect(() => {
    const ch = supabase
      .channel('platform_settings:toggles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'platform_settings', filter: `key=eq.${TOGGLES_KEY}` },
        (payload: { new?: { value?: unknown } }) => {
          const val = payload.new?.value
          if (Array.isArray(val)) {
            const map: Record<string, boolean> = {}
            for (const t of val as Array<{ id?: string; label?: string; enabled?: boolean }>) {
              if (t?.id) map[t.id] = !!t.enabled
              if (t?.label) map[t.label.toLowerCase()] = !!t.enabled
            }
            setFlags(map)
          } else {
            load()
          }
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const isEnabled = useCallback(
    (idOrLabel: string) => {
      if (idOrLabel in flags) return flags[idOrLabel]
      const lower = idOrLabel.toLowerCase()
      if (lower in flags) return flags[lower]
      return true // unknown flags default to enabled (fail-open for new code)
    },
    [flags],
  )

  const maintenanceMode =
    flags['t21'] ?? flags['maintenance mode'] ?? false

  return (
    <Ctx.Provider value={{ flags, isEnabled, maintenanceMode, loading }}>
      {children}
    </Ctx.Provider>
  )
}

export const useFeatureFlags = () => useContext(Ctx)
