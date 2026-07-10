// OneSignal Web Push Service Worker
// This file must be served from the root of your domain.
// It proxies to the OneSignal CDN worker which handles all push logic.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

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
