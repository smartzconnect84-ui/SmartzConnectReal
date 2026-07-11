import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Site-wide branding & imagery, driven by the `site_config` table (key/value,
 * managed from Admin → CMS → Site Settings). Lets admins fully control the
 * logo, favicon, and background images used across the public site (home,
 * team, service pages, social page) without a code change or redeploy.
 *
 * Falls back to the existing static defaults if a key isn't set yet, so the
 * site never breaks/blanks out before an admin configures it.
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
} as const

export type SiteImageKey = typeof SITE_IMAGE_KEYS[keyof typeof SITE_IMAGE_KEYS]

interface SiteConfigContextType {
  /** Map of site_config key -> value (only rows of type 'image' or generic strings). */
  values: Record<string, string>
  /** Get a config value, or the given fallback if unset/empty. */
  get: (key: string, fallback?: string) => string
  loading: boolean
  refetch: () => Promise<void>
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  values: {},
  get: (_key, fallback = '') => fallback,
  loading: true,
  refetch: async () => {},
})

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('site_config').select('key, value')
      if (error) throw error
      const map: Record<string, string> = {}
      for (const row of data || []) {
        if (row.value) map[row.key] = row.value
      }
      setValues(map)
    } catch {
      // site_config unreachable — keep previous/default values
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
    return () => { supabase.removeChannel(ch) }
  }, [refetch])

  const get = useCallback((key: string, fallback = '') => {
    const v = values[key]
    return v && v.trim() ? v : fallback
  }, [values])

  return (
    <SiteConfigContext.Provider value={{ values, get, loading, refetch }}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export const useSiteConfig = () => useContext(SiteConfigContext)
