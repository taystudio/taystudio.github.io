// nav.js — prefetch on hover (Firefox 포함 모든 브라우저).
//
// 페이지 전환은 100% 브라우저 표준 navigation (anchor click → 일반 load) → race·404 없음.
// 부드러움은 두 메커니즘으로:
//   1. prefetch on hover/touch — 클릭 전 미리 받아둠 → 클릭 시 캐시 hit → 즉시 paint
//   2. View Transitions API (style.css 의 @view-transition) — Chrome 126+/Safari 18+ 에서 cross-document fade
//
// AJAX(fetch+DOM swap) 방식은 base 교체·inline script 재실행·sidebar reinit race 로
// 간헐 404 가 생겨서 제거. 정적 사이트답게 표준 navigation 유지.

(function() {
  if (!window.fetch || !document.head) return;

  function isInternal(a) {
    if (!a || !a.href) return false;
    if (a.target === '_blank' || a.hasAttribute('download')) return false;
    if (a.dataset && a.dataset.noPrefetch) return false;
    var url;
    try { url = new URL(a.href, location.href); }
    catch (e) { return false; }
    if (url.origin !== location.origin) return false;          // 외부 도메인
    if (!/^\/blog(\/|$)/.test(url.pathname)) return false;      // /blog/ 안만
    if (url.hash && url.pathname === location.pathname) return false; // 같은 페이지 fragment
    if (url.href === location.href) return false;               // 현재 페이지
    return true;
  }

  var prefetched = new Set();
  function prefetch(a) {
    if (!isInternal(a)) return;
    var u = a.href;
    if (prefetched.has(u)) return;
    prefetched.add(u);
    var l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = u;
    document.head.appendChild(l);
  }

  // 데스크탑 — 호버 시 prefetch (클릭 200~300ms 전 미리 받음)
  document.addEventListener('mouseover', function(e) {
    var a = e.target.closest && e.target.closest('a');
    if (a) prefetch(a);
  }, { passive: true });

  // 모바일 — touchstart 시 prefetch (탭 직전)
  document.addEventListener('touchstart', function(e) {
    var a = e.target.closest && e.target.closest('a');
    if (a) prefetch(a);
  }, { passive: true });
})();
