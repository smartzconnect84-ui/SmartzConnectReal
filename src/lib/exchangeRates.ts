/**
 * Exchange rates utility — fetches live USD-base rates from open.er-api.com (free, no key).
 * Results are cached in localStorage for 24 hours. Falls back to hardcoded rates on error.
 */

const CACHE_KEY = 'sc_exchange_rates_v1'
const CACHE_TTL = 24 * 3600 * 1000 // 24 h

export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  LRD: 193.5,
  NGN: 1610,
  GHS: 15.3,
  KES: 129.5,
  ZAR: 18.6,
  XOF: 613,
  SLL: 22500,
  GMD: 67.4,
  EUR: 0.921,
  GBP: 0.785,
  CAD: 1.365,
  AUD: 1.535,
  INR: 83.5,
  CNY: 7.25,
  JPY: 157.5,
  BRL: 4.97,
  MXN: 17.1,
  EGP: 48.9,
  ETB: 56.4,
  TZS: 2570,
  UGX: 3740,
  RWF: 1330,
  MAD: 9.98,
  XAF: 613,
}

interface CacheEntry {
  rates: Record<string, number>
  timestamp: number
}

// Singleton in-flight promise so concurrent callers share one request
let _inflight: Promise<Record<string, number>> | null = null

/**
 * Returns exchange rates from USD. Prefers fresh API data, falls back to
 * 24-h cached data, then to hardcoded fallback rates.
 */
export async function fetchRates(): Promise<Record<string, number>> {
  if (_inflight) return _inflight

  _inflight = (async (): Promise<Record<string, number>> => {
    try {
      // Serve from localStorage cache if still fresh
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const entry: CacheEntry = JSON.parse(raw)
        if (Date.now() - entry.timestamp < CACHE_TTL) {
          return { ...FALLBACK_RATES, ...entry.rates }
        }
      }
    } catch { /* corrupt cache — ignore */ }

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json?.rates || typeof json.rates !== 'object') throw new Error('Bad response shape')

      const rates: Record<string, number> = json.rates
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() } satisfies CacheEntry))
      } catch { /* storage full — skip caching */ }

      _inflight = null
      // API rates override fallbacks for any currency it returns
      return { ...FALLBACK_RATES, ...rates }
    } catch {
      _inflight = null
      // Network unavailable or rate-limited — return latest cached or fallback
      try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (raw) {
          const entry: CacheEntry = JSON.parse(raw)
          return { ...FALLBACK_RATES, ...entry.rates }
        }
      } catch { /* ignore */ }
      return FALLBACK_RATES
    }
  })()

  return _inflight
}
