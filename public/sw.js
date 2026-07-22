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
 *
 * Background Sync:
 *  • Failed outbound requests (posts, messages, reactions) are retried
 *    automatically when connectivity is restored via the Background Sync API.
 *
 * Periodic Background Sync:
 *  • Registered by the client on first launch; fires every 12 hours to
 *    pre-warm the feed cache and badge the app icon with unread counts.
 */

const CACHE_NAME = 'smartzconnect-v7'

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',   // 26 KB — only small guaranteed files
]

// IndexedDB key used by the background-sync retry queue
const SYNC_STORE = 'szc-sync-queue'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Open (or create) the sync queue IDB database.
 */
function openSyncDB () {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SYNC_STORE, 1)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

/**
 * Drain the sync queue, replaying each stored request.
 * Successfully replayed requests are removed; failures remain for the next
 * sync opportunity.
 */
async function drainSyncQueue () {
  let db
  try {
    db = await openSyncDB()
  } catch (err) {
    console.warn('[SW] sync-queue DB unavailable:', err)
    return
  }

  const tx      = db.transaction('queue', 'readwrite')
  const store   = tx.objectStore('queue')
  const records = await new Promise((res, rej) => {
    const req = store.getAll()
    req.onsuccess = e => res(e.target.result)
    req.onerror   = e => rej(e.target.error)
  })

  await Promise.allSettled(
    records.map(async record => {
      try {
        const response = await fetch(record.url, {
          method:  record.method  ?? 'POST',
          headers: record.headers ?? { 'Content-Type': 'application/json' },
          body:    record.body    ?? null,
        })
        if (response.ok || response.status < 500) {
          // Remove successfully replayed (or definitively rejected) entries
          const delTx    = db.transaction('queue', 'readwrite')
          const delStore = delTx.objectStore('queue')
          delStore.delete(record.id)
        }
      } catch {
        // Network still down — leave in queue for next sync event
      }
    })
  )
}

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

// ── Background Sync ───────────────────────────────────────────────────────────
// Triggered by the browser when connectivity is restored after a failed
// fetch that was registered with navigator.serviceWorker.sync.register().
// The client queues outbound requests (posts, messages, reactions) in
// IndexedDB; this handler replays them in order.
self.addEventListener('sync', event => {
  if (event.tag === 'szc-outbox') {
    console.log('[SW] background-sync: replaying outbox')
    event.waitUntil(drainSyncQueue())
  }
})

// ── Periodic Background Sync ──────────────────────────────────────────────────
// Fires at the interval requested by the client (minimum enforced by the
// browser based on site engagement score; typically every 12 h for engaged
// users).  We pre-warm the offline shell cache and refresh the app badge.
self.addEventListener('periodicsync', event => {
  if (event.tag === 'szc-feed-refresh') {
    console.log('[SW] periodic-sync: refreshing feed cache')
    event.waitUntil(
      (async () => {
        try {
          // Re-fetch and cache the app shell so it's available offline
          const cache = await caches.open(CACHE_NAME)
          await cache.add('/').catch(() => {})

          // Notify open clients to do a soft background refresh
          const clients = await self.clients.matchAll({ type: 'window' })
          clients.forEach(c => c.postMessage({ type: 'PERIODIC_SYNC_REFRESH' }))
        } catch (err) {
          console.warn('[SW] periodic-sync error:', err)
        }
      })()
    )
  }
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

// ── Message (client → SW) ─────────────────────────────────────────────────────
// Allows the client to enqueue a failed request for background-sync replay.
// Usage: navigator.serviceWorker.controller.postMessage({
//   type: 'ENQUEUE_SYNC',
//   payload: { url, method, headers, body }
// })
self.addEventListener('message', event => {
  if (event.data?.type === 'ENQUEUE_SYNC') {
    const { url, method, headers, body } = event.data.payload ?? {}
    if (!url) return

    event.waitUntil(
      openSyncDB().then(db => {
        const tx    = db.transaction('queue', 'readwrite')
        const store = tx.objectStore('queue')
        store.add({ url, method: method ?? 'POST', headers, body, ts: Date.now() })
        return new Promise((res, rej) => {
          tx.oncomplete = res
          tx.onerror    = rej
        })
      }).catch(err => console.warn('[SW] enqueue-sync failed:', err))
    )
  }
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  const isNavigate    = request.mode === 'navigate'
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
        // Clone BEFORE returning res — once res is handed to the browser its
        // body stream starts draining; calling clone() after that point throws
        // "Response body is already used".
        if (res.ok) {
          const toCache = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(request, toCache))
        }
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
