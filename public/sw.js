const CACHE_NAME = 'wormhole-racers-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache the root so the app shell is available offline
      return cache.addAll([ './', './index.html' ]).catch(()=>{});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache fetched GET requests on-the-fly (best-effort)
        try {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        } catch (e) {
          // ignore cache failures
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});