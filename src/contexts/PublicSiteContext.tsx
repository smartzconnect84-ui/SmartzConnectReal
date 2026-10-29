import React, { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  PUBLIC_SITE_VERSION_KEY,
  parseVersion,
  readMetaLocal,
  writeMetaLocal,
  type PublicSiteMeta,
} from '@/lib/publicSite'

interface PublishRecord {
  version: number
  updatedAt: string
  message: string
  by: string
}

interface PublicSiteContextType {
  /** Latest published version known to this client. */
  version: number
  /** Last publish info (from cache or live). */
  meta: PublicSiteMeta | null
  /** Last few publishes (newest first). */
  history: PublishRecord[]
  loading: boolean
  publishing: boolean
  isOnline: boolean
  /** True when a newer version arrived while this tab was open. */
  updateAvailable: boolean
  publish: (message?: string) => Promise<PublicSiteMeta | null>
  /** Tell all data hooks to reload from the network (new update). */
  refreshPublicData: () => void
  dismissUpdate: () => void
}

const Ctx = createContext<PublicSiteContextType>({
  version: 0,
  meta: null,
  history: [],
  loading: true,
  publishing: false,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  updateAvailable: false,
  publish: async () => null,
  refreshPublicData: () => {},
  dismissUpdate: () => {},
})

const HISTORY_KEY = 'szc_public:history'

function loadHistory(): PublishRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function PublicSiteProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(() => readMetaLocal()?.version ?? 0)
  const [meta, setMeta] = useState<PublicSiteMeta | null>(() => readMetaLocal())
  const [history, setHistory] = useState<PublishRecord[]>(() => loadHistory())
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  const applyMeta = useCallback((m: PublicSiteMeta, isNewRemote: boolean) => {
    setMeta(m)
    writeMetaLocal(m)
    setVersion(prev => {
      if (m.version > prev && isNewRemote) setUpdateAvailable(true)
      return Math.max(prev, m.version)
    })
  }, [])

  const fetchVersion = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value, updated_at')
        .eq('key', PUBLIC_SITE_VERSION_KEY)
        .maybeSingle()
      if (error || !data) return
      const v = parseVersion((data as { value: unknown }).value)
      const rawVal = (data as { value: unknown }).value as Record<string, unknown> | null
      const m: PublicSiteMeta = {
        version: v,
        updatedAt:
          (data as { updated_at?: string }).updated_at ||
          (rawVal && typeof rawVal.updatedAt === 'string' ? (rawVal.updatedAt as string) : new Date().toISOString()),
        message:
          rawVal && typeof rawVal.message === 'string' ? (rawVal.message as string) : undefined,
        by: rawVal && typeof rawVal.by === 'string' ? (rawVal.by as string) : undefined,
      }
      // Keep locally-known version when offline so cached data survives;
      // only ever move the version forward, never reset to 0 on failure.
      if (v > 0) {
        const known = readMetaLocal()?.version ?? 0
        applyMeta(m, v > known)
      }
    } catch {
      /* offline — keep cached version/data */
    } finally {
      setLoading(false)
    }
  }, [applyMeta])

  useEffect(() => {
    fetchVersion()
    const onOnline = () => {
      setIsOnline(true)
      fetchVersion()
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    const ch = supabase
      .channel('public_site_version:realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'platform_settings', filter: `key=eq.${PUBLIC_SITE_VERSION_KEY}` },
        (payload: { new?: { value?: unknown; updated_at?: string } }) => {
          const v = parseVersion(payload.new?.value)
          if (!v) return
          const rawVal = payload.new?.value as Record<string, unknown> | null
          const m: PublicSiteMeta = {
            version: v,
            updatedAt:
              payload.new?.updated_at ||
              (rawVal && typeof rawVal.updatedAt === 'string' ? (rawVal.updatedAt as string) : new Date().toISOString()),
            message: rawVal && typeof rawVal.message === 'string' ? (rawVal.message as string) : undefined,
            by: rawVal && typeof rawVal.by === 'string' ? (rawVal.by as string) : undefined,
          }
          applyMeta(m, true)
          // Notify every public-data hook to pull the fresh update automatically.
          window.dispatchEvent(new CustomEvent('szc:public-update', { detail: m }))
        },
      )
      .subscribe()

    const onPublicRefresh = () => fetchVersion()
    window.addEventListener('szc:reconnect-refresh', onPublicRefresh)
    return () => {
      supabase.removeChannel(ch)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('szc:reconnect-refresh', onPublicRefresh)
    }
  }, [fetchVersion, applyMeta])

  const refreshPublicData = useCallback(() => {
    setUpdateAvailable(false)
    window.dispatchEvent(new CustomEvent('szc:public-update', { detail: meta }))
    fetchVersion()
  }, [fetchVersion, meta])

  const dismissUpdate = useCallback(() => setUpdateAvailable(false), [])

  const publish = useCallback(
    async (message?: string) => {
      setPublishing(true)
      try {
        // Read current version first so concurrent admins never overwrite each other.
        let next = (readMetaLocal()?.version ?? version) + 1
        try {
          const { data } = await supabase
            .from('platform_settings')
            .select('value')
            .eq('key', PUBLIC_SITE_VERSION_KEY)
            .maybeSingle()
          const remote = parseVersion((data as { value?: unknown } | null)?.value)
          next = Math.max(next, remote + 1, 1)
        } catch {
          /* offline — still bump locally so the admin sees intent */
        }
        const record: PublicSiteMeta = {
          version: next,
          updatedAt: new Date().toISOString(),
          message: message?.trim() || 'Public site updated',
          by: 'Admin',
        }
        try {
          const { error } = await supabase.from('platform_settings').upsert(
            {
              key: PUBLIC_SITE_VERSION_KEY,
              value: { version: next, updatedAt: record.updatedAt, message: record.message, by: record.by },
              updated_at: record.updatedAt,
            },
            { onConflict: 'key' },
          )
          if (error) throw error
        } catch (err) {
          // Offline: persist intent locally; it will be pushed on reconnect.
          try {
            const pending = JSON.parse(localStorage.getItem('szc_public:pending') || '[]')
            pending.push(record)
            localStorage.setItem('szc_public:pending', JSON.stringify(pending))
          } catch {
            /* ignore */
          }
          throw err
        }
        applyMeta(record, false)
        setUpdateAvailable(false)
        setHistory(prev => {
          const entry: PublishRecord = {
            version: record.version,
            updatedAt: record.updatedAt,
            message: record.message || '',
            by: record.by || 'Admin',
          }
          const nextHist = [entry, ...prev].slice(0, 10)
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHist))
          } catch {
            /* ignore */
          }
          return nextHist
        })
        window.dispatchEvent(new CustomEvent('szc:public-update', { detail: record }))
        return record
      } finally {
        setPublishing(false)
      }
    },
    [applyMeta, version],
  )

  // Flush any offline-queued publishes when connectivity returns.
  useEffect(() => {
    if (!isOnline) return
    let cancelled = false
    async function flush() {
      let pending: PublicSiteMeta[] = []
      try {
        pending = JSON.parse(localStorage.getItem('szc_public:pending') || '[]')
      } catch {
        return
      }
      if (!pending.length) return
      for (const p of pending) {
        if (cancelled) return
        try {
          await supabase.from('platform_settings').upsert(
            {
              key: PUBLIC_SITE_VERSION_KEY,
              value: { version: p.version, updatedAt: p.updatedAt, message: p.message, by: p.by },
              updated_at: p.updatedAt,
            },
            { onConflict: 'key' },
          )
        } catch {
          return // still offline — keep the rest queued
        }
      }
      if (!cancelled) localStorage.setItem('szc_public:pending', '[]')
    }
    flush()
    return () => {
      cancelled = true
    }
  }, [isOnline])

  return (
    <Ctx.Provider
      value={{
        version,
        meta,
        history,
        loading,
        publishing,
        isOnline,
        updateAvailable,
        publish,
        refreshPublicData,
        dismissUpdate,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const usePublicSite = () => useContext(Ctx)
