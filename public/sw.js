/**
 * SmartzConnect Service Worker
 * Provides basic offline support and asset caching for PWA installation.
 */

const CACHE_NAME = 'smartzconnect-v4'

// ── Pre-cache: ONLY the bare minimum needed for an offline shell ─────────────
// IMPORTANT: cache.addAll() is atomic — one failed/slow fetch kills the whole
// SW install and leaves the browser "loading" the manifest forever.
// Rule: only list files that are < 50 KB and guaranteed to exist at deploy time.
// Do NOT include large images (logo.png, pwa-logo.png etc.) here.
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',   // 26 KB — safe
]

// ── Install: pre-cache the app shell ─────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // Cache each URL individually so a single failure doesn't abort install.
      Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Pre-cache failed for', url, err)
          )
        )
      )
    )
  )
  // Do NOT call self.skipWaiting() here automatically.
  // If we did, the SW would take over immediately, fire 'controllerchange',
  // and PWAUpdatePrompt would call window.location.reload() while the page
  // is still downloading chunks — causing the ring to restart every visit.
  // skipWaiting is only sent explicitly by the user clicking "Reload" in
  // the PWAUpdatePrompt banner.
})

// Allow the page to explicitly promote a waiting worker once the user
// confirms the "Update available" prompt.
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// ── Activate: clean up stale caches ──────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first for navigation, cache-first for static assets ────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  const isNavigate = request.mode === 'navigate'
  const isAsset = /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/.test(url.pathname)

  if (isNavigate) {
    // Network-first: always try to get the freshest HTML shell.
    // Fall back to cached '/' for offline support.
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then(r => r ?? new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  if (isAsset) {
    // Cache-first: hashed asset filenames are immutable after build.
    // Un-hashed assets (logo.png, icons) use stale-while-revalidate.
    const isHashedAsset = /\/assets\//.test(url.pathname)
    if (isHashedAsset) {
      event.respondWith(
        caches.match(request).then(cached => {
          if (cached) return cached
          return fetch(request).then(response => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
            }
            return response
          })
        })
      )
    } else {
      // Stale-while-revalidate for non-hashed public assets
      event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
          const cached = await cache.match(request)
          const fetchPromise = fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone())
            return response
          }).catch(() => cached)
          return cached ?? fetchPromise
        })
      )
    }
  }
  // All other requests (XHR/fetch API calls) pass through without interception
})
