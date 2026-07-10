/**
 * SmartzConnect Service Worker
 * Provides basic offline support and asset caching for PWA installation.
 */

const CACHE_NAME = 'smartzconnect-v1'

// Core shell assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/pwa-logo.png',
  '/icon-192.png',
  '/icon-512.png',
]

// ── Install: pre-cache the app shell ─────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  )
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting()
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

// ── Fetch: network-first for API/dynamic requests, cache-first for assets ────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin and GET requests
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // API-like paths go network-first (fallback to cache)
  const isNavigate = request.mode === 'navigate'
  const isAsset = /\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)$/.test(url.pathname)

  if (isNavigate) {
    // Always try the network for navigation; fall back to cached index.html
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then(r => r ?? new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  if (isAsset) {
    // Cache-first: static assets are immutable after build
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
  }
  // All other requests (XHR, etc.) pass through without interception
})
