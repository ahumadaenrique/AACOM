// Minimal Service Worker for AACOM PWA installability
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Minimal fetch listener to satisfy PWA criteria.
  // Performs a standard network fetch without custom caching to ensure dynamic content freshness.
  event.respondWith(fetch(event.request));
});
