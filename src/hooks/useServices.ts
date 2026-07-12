import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface ServiceRow {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  image_url: string | null
  route: string | null
  category: string | null
  connector: string
  enabled: boolean
  sort_order: number
}

let _cache: ServiceRow[] | null = null
let _promise: Promise<ServiceRow[]> | null = null

async function fetchServices(): Promise<ServiceRow[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id,slug,name,description,icon,image_url,route,category,connector,enabled,sort_order')
    .eq('enabled', true)
    .order('sort_order', { ascending: true })
  if (error || !data || data.length === 0) return []
  _cache = data
  return data
}

/**
 * Invalidates the in-memory services cache so the next `useServices()` mount
 * re-fetches from Supabase. Call this after any admin mutation (create/update/
 * delete/toggle) so changes are reflected immediately on the public site
 * without requiring a full page reload.
 */
export function invalidateServicesCache() {
  _cache = null
  _promise = null
}

/**
 * Fetches enabled services from the `services` table.
 * Falls back gracefully to an empty list if the table doesn't exist yet.
 * The caller is responsible for merging with hardcoded fallback data.
 */
export function useServices() {
  const [services, setServices] = useState<ServiceRow[]>(_cache || [])
  const [loading, setLoading] = useState(!_cache)

  useEffect(() => {
    if (_cache) { setServices(_cache); setLoading(false); return }
    if (!_promise) { _promise = fetchServices() }
    _promise.then(data => {
      setServices(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  return { services, loading }
}
