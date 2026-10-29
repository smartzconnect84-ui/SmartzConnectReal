import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { readCache, writeCache, readMetaLocal } from '@/lib/publicSite'

const SITE_CONFIG_CACHE_KEY = 'site_config'

/**
 * Site-wide branding & imagery, driven by the `site_config` table (key/value,
 * managed from Admin → CMS → Site Settings). Lets admins fully control the
 * logo, favicon, and background images used across the public site (home,
 * team, service pages, social page) without a code change or redeploy.
 *
 * Offline-first: every successful fetch is cached to localStorage and served
 * instantly on next load (even offline). The cache is only replaced when a
 * fetch succeeds — so data is kept "until a new update" arrives.
 */

export const SITE_IMAGE_KEYS = {
  logo: 'brand_logo_url',
  logoDark: 'brand_logo_dark_url',
  favicon: 'brand_favicon_url',
  homepageBg: 'homepage_bg_url',
  teamPageBg: 'team_page_bg_url',
  socialPageBg: 'social_page_bg_url',
  datingPageBg: 'service_dating_bg_url',
  tvPageBg: 'service_tv_bg_url',
  marketPageBg: 'service_market_bg_url',
  ridePageBg: 'service_ride_bg_url',
  deliveryPageBg: 'service_delivery_bg_url',
  adsPageBg: 'service_ads_bg_url',
  learningPageBg: 'service_learning_bg_url',
} as const

export type SiteImageKey = typeof SITE_IMAGE_KEYS[keyof typeof SITE_IMAGE_KEYS]

interface SiteConfigContextType {
  /** Map of site_config key -> value (only rows of type 'image' or generic strings). */
  values: Record<string, string>
  /** Get a config value, or the given fallback if unset/empty. */
  get: (key: string, fallback?: string) => string
  loading: boolean
  /** True when values came from the offline cache (network unavailable). */
  fromCache: boolean
  refetch: () => Promise<void>
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  values: {},
  get: (_key, fallback = '') => fallback,
  loading: true,
  fromCache: false,
  refetch: async () => {},
})

function currentVersion(): number {
  return readMetaLocal()?.version ?? 0
}

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  // Hydrate synchronously from cache so the public site paints instantly offline.
  const [values, setValues] = useState<Record<string, string>>(() => {
    try {
      const cached = readCache<Record<string, string>>(SITE_CONFIG_CACHE_KEY)
      return cached?.data ?? {}
    } catch {
      return {}
    }
  })
  const [loading, setLoading] = useState(() => {
    try {
      return !readCache<Record<string, string>>(SITE_CONFIG_CACHE_KEY)
    } catch {
      return true
    }
  })
  const [fromCache, setFromCache] = useState(false)

  const refetch = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('site_config').select('key, value')
      if (error) throw error
      const map: Record<string, string> = {}
      for (const row of data || []) {
        if (row.value) map[row.key] = row.value
      }
      setValues(map)
      setFromCache(false)
      // Persist: keep this snapshot until a newer update replaces it.
      writeCache(SITE_CONFIG_CACHE_KEY, map, currentVersion())
    } catch {
      // Offline / unreachable — keep showing the cached copy (already in state).
      try {
        const cached = readCache<Record<string, string>>(SITE_CONFIG_CACHE_KEY)
        if (cached) {
          setValues(cached.data)
          setFromCache(true)
        }
      } catch {
        /* keep previous/default values */
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const ch = supabase
      .channel('site_config:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, () => { refetch() })
      .subscribe()
    // Admin "Publish live" bumps the public-site version: refresh immediately so
    // the update lands automatically on every open public page.
    const onPublish = () => { refetch() }
    const onReconnect = () => { refetch() }
    window.addEventListener('szc:public-update', onPublish)
    window.addEventListener('szc:reconnect-refresh', onReconnect)
    return () => {
      supabase.removeChannel(ch)
      window.removeEventListener('szc:public-update', onPublish)
      window.removeEventListener('szc:reconnect-refresh', onReconnect)
    }
  }, [refetch])

  const get = useCallback((key: string, fallback = '') => {
    const v = values[key]
    return v && v.trim() ? v : fallback
  }, [values])

  return (
    <SiteConfigContext.Provider value={{ values, get, loading, fromCache, refetch }}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export const useSiteConfig = () => useContext(SiteConfigContext)
