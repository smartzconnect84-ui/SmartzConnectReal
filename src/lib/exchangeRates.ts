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

function readCache(): (CacheEntry & { fresh: boolean }) | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    return { ...entry, fresh: Date.now() - entry.timestamp < CACHE_TTL }
  } catch {
    return null
  }
}

function writeCache(rates: Record<string, number>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }))
  } catch { /* storage full — skip */ }
}

/** fetch with a manual timeout fallback for environments without AbortSignal.timeout */
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

// Singleton in-flight promise so concurrent callers share one request
let _inflight: Promise<Record<string, number>> | null = null

/**
 * Returns exchange rates keyed from USD.
 * Prefers fresh (< 24 h) localStorage cache, then tries the live API,
 * then falls back to stale cache, and finally to hardcoded rates.
 */
export async function fetchRates(): Promise<Record<string, number>> {
  if (_inflight) return _inflight

  _inflight = (async (): Promise<Record<string, number>> => {
    // 1. Serve from fresh localStorage cache
    const cached = readCache()
    if (cached?.fresh) {
      _inflight = null
      return { ...FALLBACK_RATES, ...cached.rates }
    }

    // 2. Fetch live rates
    try {
      const res = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD', 6000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json?.rates || typeof json.rates !== 'object') throw new Error('Unexpected response shape')

      const rates: Record<string, number> = json.rates
      writeCache(rates)
      _inflight = null
      return { ...FALLBACK_RATES, ...rates }
    } catch {
      _inflight = null
      // 3. Fall back to stale cache if any, otherwise hardcoded rates
      if (cached) return { ...FALLBACK_RATES, ...cached.rates }
      return { ...FALLBACK_RATES }
    }
  })()

  return _inflight
}
