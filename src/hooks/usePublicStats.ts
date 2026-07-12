import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface PublicStats {
  totalUsers: number
  activeRiders: number          // ride_requests with active status
  registeredDrivers: number     // drivers table
  marketplaceListings: number   // marketplace_items
  totalMatches: number          // matches table
  loaded: boolean
}

const EMPTY: PublicStats = {
  totalUsers: 0,
  activeRiders: 0,
  registeredDrivers: 0,
  marketplaceListings: 0,
  totalMatches: 0,
  loaded: false,
}

let cached: PublicStats | null = null
let fetchPromise: Promise<PublicStats> | null = null

async function fetchPublicStats(): Promise<PublicStats> {
  try {
    const [usersRes, driversRes, marketRes, matchesRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('drivers').select('id', { count: 'exact', head: true }),
      supabase.from('marketplace_items').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
    ])

    return {
      totalUsers:          usersRes.count    ?? 0,
      registeredDrivers:   driversRes.count  ?? 0,
      marketplaceListings: marketRes.count   ?? 0,
      totalMatches:        matchesRes.count  ?? 0,
      activeRiders:        0,
      loaded:              true,
    }
  } catch {
    return { ...EMPTY, loaded: true }
  }
}

/** Singleton fetch — all pages share one round-trip per session. */
function getStats(): Promise<PublicStats> {
  if (cached) return Promise.resolve(cached)
  if (!fetchPromise) {
    fetchPromise = fetchPublicStats().then(s => {
      cached = s
      return s
    })
  }
  return fetchPromise
}

export function usePublicStats(): PublicStats {
  const [stats, setStats] = useState<PublicStats>(cached ?? EMPTY)

  useEffect(() => {
    if (cached) { setStats(cached); return }
    getStats().then(setStats)
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
