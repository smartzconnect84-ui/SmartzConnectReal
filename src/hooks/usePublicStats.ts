import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { readCache, writeCache, readMetaLocal } from '@/lib/publicSite'

export interface PublicStats {
  totalUsers: number
  activeRiders: number          // ride_requests with active status
  registeredDrivers: number     // drivers table
  marketplaceListings: number   // marketplace_items
  totalMatches: number          // matches table
  loaded: boolean
  /** True when these numbers came from the offline cache. */
  fromCache?: boolean
}

const EMPTY: PublicStats = {
  totalUsers: 0,
  activeRiders: 0,
  registeredDrivers: 0,
  marketplaceListings: 0,
  totalMatches: 0,
  loaded: false,
}

const STATS_CACHE_KEY = 'public_stats'

let cached: PublicStats | null = null
let fetchPromise: Promise<PublicStats> | null = null

// Hydrate the in-memory copy from the offline cache so every page (even the
// first paint while offline) has numbers until a new update replaces them.
try {
  const disk = readCache<PublicStats>(STATS_CACHE_KEY)
  if (disk?.data) cached = { ...disk.data, loaded: true, fromCache: true }
} catch {
  /* ignore */
}

async function fetchPublicStats(): Promise<PublicStats> {
  try {
    const [usersRes, driversRes, marketRes, matchesRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('drivers').select('id', { count: 'exact', head: true }),
      supabase.from('marketplace_items').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
    ])

    const stats: PublicStats = {
      totalUsers:          usersRes.count    ?? 0,
      registeredDrivers:   driversRes.count  ?? 0,
      marketplaceListings: marketRes.count   ?? 0,
      totalMatches:        matchesRes.count  ?? 0,
      activeRiders:        0,
      loaded:              true,
    }
    // Persist successful snapshot; keep until a newer publish replaces it.
    try {
      const v = readMetaLocal()?.version ?? 0
      writeCache(STATS_CACHE_KEY, stats, v)
    } catch {
      /* ignore */
    }
    return stats
  } catch {
    // Offline: fall back to the last good snapshot if we have one.
    try {
      const disk = readCache<PublicStats>(STATS_CACHE_KEY)
      if (disk?.data) return { ...disk.data, loaded: true, fromCache: true }
    } catch {
      /* ignore */
    }
    return { ...EMPTY, loaded: true }
  }
}

/** Singleton fetch — all pages share one round-trip per session. */
function getStats(): Promise<PublicStats> {
  if (cached && !cached.fromCache) return Promise.resolve(cached)
  if (cached) {
    // Serve cache instantly, then refresh in the background.
    if (!fetchPromise) {
      fetchPromise = fetchPublicStats().then(s => {
        if (!s.fromCache) cached = s
        fetchPromise = null
        return s
      })
    }
    return Promise.resolve(cached)
  }
  if (!fetchPromise) {
    fetchPromise = fetchPublicStats().then(s => {
      cached = s
      fetchPromise = null
      return s
    })
  }
  return fetchPromise
}

/** Force a fresh fetch (used after an admin publish or a reconnect). */
export function refreshPublicStats(): Promise<PublicStats> {
  fetchPromise = null
  cached = null
  return getStats()
}

export function usePublicStats(): PublicStats {
  const [stats, setStats] = useState<PublicStats>(cached ?? EMPTY)

  useEffect(() => {
    let live = true
    if (cached) {
      setStats(cached)
      // Cache served: refresh in background when online.
      if (cached.fromCache && navigator.onLine) {
        fetchPromise = null
        fetchPublicStats().then(s => {
          if (live && !s.fromCache) {
            cached = s
            setStats(s)
          }
          fetchPromise = null
        })
      }
    } else {
      getStats().then(s => { if (live) setStats(s) })
    }
    const onUpdate = () => {
      fetchPromise = null
      fetchPublicStats().then(s => { if (live && !s.fromCache) { cached = s; setStats(s) } })
    }
    window.addEventListener('szc:public-update', onUpdate)
    window.addEventListener('szc:reconnect-refresh', onUpdate)
    return () => {
      live = false
      window.removeEventListener('szc:public-update', onUpdate)
      window.removeEventListener('szc:reconnect-refresh', onUpdate)
    }
  }, [])

  return stats
}

/** Format a raw number for display, falling back to a placeholder string. */
export function fmtCount(n: number, fallback: string): string {
  if (n === 0) return fallback
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K+`
  return `${n}+`
}
