/**
 * Public-site publish + offline-first cache helpers.
 *
 * - PUBLIC_SITE_VERSION_KEY: platform_settings row that acts as the
 *   "publish counter". Every admin "Publish live" bumps it; all public
 *   clients subscribe to it via realtime and refresh on change.
 * - Offline policy: public data (branding, announcements, stats) is cached
 *   in localStorage on every successful fetch. When offline (or when the
 *   network fetch fails) the cached copy is served and kept until a newer
 *   published version arrives.
 */

export const PUBLIC_SITE_VERSION_KEY = 'public_site_version'
export const PUBLIC_SITE_META_KEY = 'public_site_meta'

const CACHE_PREFIX = 'szc_public:'

export interface PublicSiteMeta {
  version: number
  updatedAt: string
  message?: string
  by?: string
}

export function readCache<T>(key: string): { data: T; version: number; savedAt: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, data: T, version: number): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, version, savedAt: new Date().toISOString() }),
    )
  } catch {
    /* storage full — fail silently, memory copy still works */
  }
}

export function readMetaLocal(): PublicSiteMeta | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + 'meta')
    return raw ? (JSON.parse(raw) as PublicSiteMeta) : null
  } catch {
    return null
  }
}

export function writeMetaLocal(meta: PublicSiteMeta): void {
  try {
    localStorage.setItem(CACHE_PREFIX + 'meta', JSON.stringify(meta))
  } catch {
    /* ignore */
  }
}

/** Parse a platform_settings `value` that may be number | string | object. */
export function parseVersion(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = parseInt(value, 10)
    return Number.isFinite(n) ? n : 0
  }
  if (value && typeof value === 'object') {
    const v = (value as Record<string, unknown>).version
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const n = parseInt(v, 10)
      return Number.isFinite(n) ? n : 0
    }
  }
  return 0
}
