const CACHE_NAME = 'rez-menu-v3';
const MENU_CACHE = 'rez-menu-data-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index-BgIX3x7E.js',
  '/assets/vendor-CNpbazHM.js',
  '/assets/index-DwTWybN3.css',
  '/rez-icon.svg',
  '/manifest.json',
];
const MENU_API_PATTERN = /\/api\/(web-ordering\/menu|stores\/[^/]+\/menu)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== MENU_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests for same-origin navigations
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Stale-while-revalidate for menu data
  if (event.request.method === 'GET' && MENU_API_PATTERN.test(event.request.url)) {
    event.respondWith(
      caches.open(MENU_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached || Response.error());
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first for API calls
  if (event.request.url.includes('/api/')) return;

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
