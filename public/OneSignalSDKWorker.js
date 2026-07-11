// OneSignal Web Push Service Worker
// This file must be served from the root of your domain.
// It proxies to the OneSignal CDN worker which handles all push logic.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// ── App Badging ──────────────────────────────────────────────────────────
// OneSignal's own `push` listener (registered by the importScripts above)
// handles showing the notification. We add a *second* listener here (the
// Service Worker spec allows multiple listeners per event) purely to read a
// badge count out of the push payload and reflect it on the app icon via
// the Badging API. Runs alongside, not instead of, OneSignal's handling.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // Non-JSON payload — nothing to read a badge count from.
  }

  // OneSignal typically nests custom fields sent from the dashboard/API
  // under `custom.a` (additionalData) or top-level `data`; check a few
  // likely spots so this works whether the count is sent as a top-level
  // field or as custom data.
  const badgeCount =
    payload.badge ??
    payload.unreadCount ??
    payload.custom?.a?.badge ??
    payload.custom?.a?.unreadCount ??
    payload.data?.badge ??
    payload.data?.unreadCount;

  if ('setAppBadge' in self.navigator) {
    event.waitUntil(
      typeof badgeCount === 'number'
        ? self.navigator.setAppBadge(badgeCount).catch(() => {})
        : self.navigator.setAppBadge().catch(() => {}) // no count given — just flag "something new"
    );
  }
});

// Handle notification click — navigate to the action URL embedded in the push
// payload. This fires in addition to OneSignal's default handling.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // OneSignal stores the launch URL in data.url or additionalData.url
  const data = event.notification.data || {};
  const launchUrl =
    data.url ||
    (data.additionalData && data.additionalData.url) ||
    '/app/notifications';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an already-open tab and navigate it
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) client.navigate(launchUrl);
            return;
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(launchUrl);
        }
      })
  );
});
