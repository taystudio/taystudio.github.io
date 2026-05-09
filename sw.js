/**
 * Service Worker for TAYSTUDIO (사이트 전체 PWA)
 * scope = /
 *
 * 캐시 정책:
 *  - HTML(navigate): network-first → 실패 시 캐시 → 최후 루트 hub
 *  - JS·CSS: stale-while-revalidate (캐시 즉시 + 백그라운드 갱신)
 *  - 그 외 정적(이미지·폰트·아이콘 등): cache-first
 *  - 외부 도메인(광고·jsdelivr·esm.sh 등) = 가로채지 않음 (브라우저 기본 동작)
 *
 * 이전 = `/tools/sw.js` (scope `./tools/`)만 동작. 사이트 4 카테고리 확장 후 root scope로 통합.
 */

const CACHE_VERSION = 'taystudio-v13';

// install 시 즉시 캐시 — 루트 + 5 카테고리 hub + 공용 자산. 도구별 페이지·vendor는 navigate 시 자연 캐싱
const STATIC_ASSETS = [
  '/',
  '/tools/',
  '/text/',
  '/image/',
  '/pdf/',
  '/video/',
  '/common/css/style.css',
  '/common/site-chrome.js',
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-96.png',
  '/favicon-192.png',
  '/apple-touch-icon.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll은 하나라도 실패하면 전체 reject — addAll 대신 개별 add로 silent fallback
      .then((cache) => Promise.all(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 외부 도메인은 캐싱 제외 (광고·jsdelivr·esm.sh 등)
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // HTML: network-first
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // CSS·JS: stale-while-revalidate
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
