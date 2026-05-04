/**
 * Service Worker for TAYLEE Tools
 * - 정적 리소스 캐싱 (cache-first)
 * - 오프라인 동작 지원
 */

const CACHE_VERSION = 'tayleetools-v10';
const STATIC_ASSETS = [
  './',
  '/common/css/style.css',
  './favicon.svg',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 광고·외부 도메인은 캐싱 제외
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // HTML: network-first (최신 우선, 실패 시 캐시)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./')))
    );
    return;
  }

  // CSS·JS: stale-while-revalidate (캐시 즉시 + 백그라운드 갱신)
  if (req.destination === 'style' || req.destination === 'script') {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fresh = fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          return res;
        }).catch(() => cached);
        return cached || fresh;
      })
    );
    return;
  }

  // 그 외 정적 리소스: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
      return res;
    }))
  );
});
