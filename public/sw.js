// Minimal Service Worker for AACOMSoft PWA installability - v1.0.3
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Bypass service worker for non-GET requests, HTML/navigation requests (prevents iOS WebKit redirect errors),
  // Next.js RSC/build chunks, API routes, cross-origin requests, and AudioWorklet/audio streams.
  if (
    request.method !== 'GET' ||
    request.mode === 'navigate' ||
    request.headers.get('RSC') === '1' ||
    !request.url.startsWith(self.location.origin) ||
    request.destination === 'audioworklet' ||
    request.destination === 'audio' ||
    request.url.includes('/worklets/') ||
    request.url.includes('libsamplerate') ||
    request.url.includes('/api/') ||
    request.url.includes('/_next/')
  ) {
    return;
  }
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// --- Push Notifications ---
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/icons/manifest-icon-192.maskable.png',
        badge: '/icons/manifest-icon-192.maskable.png',
        vibrate: [100, 50, 100],
        data: {
          url: data.url || '/'
        }
      };
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      console.error('Error parsing push payload', e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow(event.notification.data.url || '/');
    })
  );
});
