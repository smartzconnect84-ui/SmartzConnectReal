---
name: Exchange rates utility
description: Live exchange rate fetching pattern — singleton promise, localStorage cache, fallback chain.
---

# Exchange Rates Utility

## Rule
Use `src/lib/exchangeRates.ts` (exported `fetchRates()` + `FALLBACK_RATES`) for all currency conversion across the app.

**Why:** Both CurrencyConverter.tsx and PricingPage.tsx previously used separate hardcoded `RATES_FROM_USD` objects. The utility centralizes the live-rate fetch, 24h localStorage cache, and fallback so both components stay in sync.

## How to apply
- Import `{ fetchRates, FALLBACK_RATES }` from `@/lib/exchangeRates`
- Initialize component state with `FALLBACK_RATES`, call `fetchRates()` in `useEffect`, update state on resolve
- Always guard against unmount with a `mounted` flag before calling setState
- `_inflight` singleton is cleared on **every** return path including the cache-hit early return (critical — missing this freezes future refreshes)

## Key decisions
- API: `https://open.er-api.com/v6/latest/USD` — free, no key, 160+ currencies
- Cache TTL: 24h in localStorage under key `sc_exchange_rates_v1`
- Fallback chain: fresh cache → live API → stale cache → hardcoded FALLBACK_RATES
- Timeout: manual `AbortController + setTimeout` (not `AbortSignal.timeout` — not universally supported)
- `toLocal(usd, currency, rates = FALLBACK_RATES)` in PricingPage accepts optional rates param — backward compatible with callers that don't pass rates
