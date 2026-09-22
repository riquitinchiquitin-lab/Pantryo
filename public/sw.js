// Pantryo Progressive Web App Service Worker
const CACHE_NAME = 'pantryo-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/pantryo-logo.svg',
  '/pantryo-logo.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge all old caches immediately to avoid stale React chunk mismatches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Pantryo PWA] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never intercept non-GET requests or API calls
  if (event.request.method !== 'GET' || url.includes('/api/')) {
    return;
  }

  // Never intercept Vite internal modules, source files, or dev requests
  if (
    url.includes('/@') ||
    url.includes('/node_modules/') ||
    url.includes('/src/') ||
    url.includes('?v=') ||
    url.includes('?t=') ||
    url.endsWith('.tsx') ||
    url.endsWith('.ts')
  ) {
    return;
  }

  // Only serve static icons/manifest from cache
  const isStaticAsset = STATIC_ASSETS.some((asset) => url.endsWith(asset));
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});

