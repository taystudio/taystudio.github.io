// anchors.js — 같은 페이지 앵커(#id) 클릭 처리.
// 페이지에 <base href> 가 있으면 href="#id" 가 base URL(/blog/)로 가버려서(목차·태그 클라우드 클릭 시
// 홈으로 튐) → 순수 fragment 링크 클릭을 가로채 현재 페이지 안에서 부드럽게 스크롤한다.
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var raw = a.getAttribute('href') || '';
    if (raw.length < 2) return;                 // "#" 단독은 무시
    var id = decodeURIComponent(raw.slice(1));
    var el = document.getElementById(id) ||
             document.querySelector('[name="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    if (!el) return;                            // 대상 없으면 기본 동작
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // ⚠️ replaceState URL 은 <base href> 기준으로 해석됨 → 현재 경로를 명시해야 /blog/ 로 안 튐
    try { history.replaceState(null, '', location.pathname + location.search + '#' + encodeURIComponent(id)); } catch (_) {}
  });

  // 직접 #hash 로 들어온 경우(base href 간섭 대비) 로드 후 한 번 스크롤 보정
  if (location.hash.length > 1) {
    var goto = function () {
      var id = decodeURIComponent(location.hash.slice(1));
      var el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: 'start' });
    };
    if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(goto, 60);
    else document.addEventListener('DOMContentLoaded', function () { setTimeout(goto, 60); });
  }
})();
