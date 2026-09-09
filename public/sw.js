// Suvidha PWA Service Worker v2.1
const CACHE_NAME = 'suvidha-pwa-v2.1.1';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon-32.png',
  '/favicon-16.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  // Active 18 production tools
  '/pages/pdf/pdf-compressor.html',
  '/pages/pdf/pdf-merger.html',
  '/pages/pdf/pdf-unlock.html',
  '/pages/image/image-compressor.html',
  '/pages/image/image-to-pdf.html',
  '/pages/utility/qr-generator.html',
  '/pages/utility/password-generator.html',
  '/pages/resume/resume-builder.html',
  '/pages/utility/word-counter.html',
  '/pages/finance/emi-calculator.html',
  '/pages/finance/gst-calculator.html',
  '/pages/finance/sip-calculator.html',
  '/pages/json/json-formatter.html',
  '/pages/json/json-validator.html',
  '/pages/json/json-to-csv.html',
  '/pages/seo/meta-tag-generator.html',
  '/pages/seo/sitemap-generator.html',
  '/pages/seo/keyword-analyzer.html',
  '/pages/privacy.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Use individual caching so missing assets don't fail the entire install
      await Promise.allSettled(
        CORE_ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('[SW] Could not precache:', url, err.message);
        }))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => {
        console.log('[SW] Pruning stale cache:', key);
        return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and cross-origin requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Skip analytics requests if any
  if (url.pathname.includes('/_vercel/insights') || url.pathname.includes('/va/')) {
    return;
  }

  // Navigation requests: Network-first, fallback to cache, fallback to /index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(networkRes => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const home = await caches.match('/index.html') || await caches.match('/');
          if (home) return home;
          return new Response('<h1>Offline</h1><p>Suvidha is offline. Cached tools remain available.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // Static assets (css, js, images, fonts): Cache-first with stale-while-revalidate
  event.respondWith(
    caches.match(req).then(cachedRes => {
      const fetchPromise = fetch(req).then(networkRes => {
        if (networkRes && networkRes.status === 200) {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return networkRes;
      }).catch(() => null);

      return cachedRes || fetchPromise;
    })
  );
});
