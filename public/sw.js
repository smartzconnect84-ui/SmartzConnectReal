/**
 * SmartzConnect Service Worker — silent auto-update
 *
 * Update policy:
 *  • New SW installs in the background while the user is on the page.
 *  • skipWaiting() is called immediately so the new SW activates as soon
 *    as possible without waiting for all tabs to close.
 *  • After claiming clients the SW posts SW_UPDATED to every open window.
 *  • The client-side handler (PWAAutoUpdate) reloads only when the tab is
 *    hidden (user not actively looking at the screen), so the update is
 *    completely invisible. If the tab is visible it waits for the next
 *    visibilitychange → hidden event before reloading.
 *  • First-install is safe: the client checks whether a previous SW was in
 *    control before the message arrives; if not, no reload happens.
 */

const CACHE_NAME = 'smartzconnect-v6'

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',   // 26 KB — only small guaranteed files
]

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] pre-cache miss:', url, err))
        )
      )
    )
  )
  // Activate immediately — don't wait for existing tabs to close.
  // The client-side handler delays its reload until the tab is hidden,
  // so active users are never interrupted.
  self.skipWaiting()
})

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    // 1. Remove stale caches from old versions.
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      // 2. Take control of all open clients.
      .then(() => self.clients.claim())
      // 3. Tell every open window that a fresh version is now active.
      //    The client decides when to reload (immediately if hidden, or on
      //    next hide) — no banner, no user interaction required.
      .then(() =>
        self.clients
          .matchAll({ type: 'window', includeUncontrolled: false })
          .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))
      )
  )
})

// ── Push (App Badging) ───────────────────────────────────────────────────────
// This app's push notifications are actually delivered via the OneSignal SDK,
// which registers its own worker (OneSignalSDKWorker.js) to receive and
// display them — see that file for the matching badge-update logic. This
// handler is kept here too as a defensive fallback in case a 'push' event
// ever reaches this worker directly (e.g. a non-OneSignal push subscription
// registered against this SW's scope), so the badge logic isn't silently
// skipped depending on which worker ends up owning the push subscription.
self.addEventListener('push', event => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // Non-JSON push payload — ignore, nothing to read a badge count from.
  }

  // Accept a few common shapes for where a badge count might be sent from
  // the backend: top-level `badge`/`unreadCount`, or nested in `data`.
  const badgeCount =
    payload.badge ??
    payload.unreadCount ??
    payload.data?.badge ??
    payload.data?.unreadCount

  if ('setAppBadge' in self.navigator) {
    event.waitUntil(
      typeof badgeCount === 'number'
        ? self.navigator.setAppBadge(badgeCount).catch(() => {})
        : self.navigator.setAppBadge().catch(() => {}) // no count given — just flag "something new"
    )
  }
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  const isNavigate   = request.mode === 'navigate'
  const isHashedAsset = /\/assets\//.test(url.pathname)
  const isStaticFile  = /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/.test(url.pathname)

  if (isNavigate) {
    // Network-first: always serve the freshest HTML shell.
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then(r => r ?? new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  if (isHashedAsset) {
    // Cache-first: content-hashed filenames never change.
    event.respondWith(
      caches.match(request).then(cached => cached ?? fetch(request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(request, res.clone()))
        return res
      }))
    )
    return
  }

  if (isStaticFile) {
    // Stale-while-revalidate for non-hashed public assets (icons, logo, etc.)
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request)
        const fresh  = fetch(request).then(res => {
          if (res.ok) cache.put(request, res.clone())
          return res
        }).catch(() => cached)
        return cached ?? fresh
      })
    )
  }
})
