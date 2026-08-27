// Suvidha Tools Service Worker
const CACHE_NAME = 'suvidha-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/js/shared-ui.js',
  './icon-192.png',
  './icon-512.png',
  // PDF tools
  './pages/pdf/pdf-unlock.html',
  './pages/pdf/pdf-merger.html',
  './pages/pdf/pdf-compressor.html',
  // Image tools
  './pages/image/image-to-pdf.html',
  './pages/image/image-compressor.html',
  // Finance tools
  './pages/finance/emi-calculator.html',
  './pages/finance/gst-calculator.html',
  './pages/finance/sip-calculator.html',
  // Career tools
  './pages/resume/resume-builder.html',
  // JSON tools
  './pages/json/json-validator.html',
  './pages/json/json-formatter.html',
  './pages/json/json-to-csv.html',
  // SEO tools
  './pages/seo/meta-tag-generator.html',
  './pages/seo/sitemap-generator.html',
  './pages/seo/keyword-analyzer.html',
  // Lookup tools
  './pages/lookup/email-lookup.html',
  './pages/lookup/money-upi-lookup.html',
  // Utility tools
  './pages/utility/qr-generator.html'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests (like to Google Fonts)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        // Otherwise, fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Optionally cache successful requests
            // We'll cache only GET requests for HTML pages
            if (event.request.method === 'GET') {
              return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // If network fails, try to return a fallback page (e.g., offline.html)
            // For now, we'll just return the cached index.html for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          })
      })
  );
});