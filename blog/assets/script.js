// TAYSTUDIO Blog — 클라이언트 인터랙션 (theme toggle 등)

(function() {
  // Theme: 페이지 로드 시 localStorage 또는 prefers-color-scheme 기준
  try {
    var t = localStorage.getItem('taystudio.theme');
    var d = t ? t === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
    if (d) document.documentElement.classList.add('dark');
  } catch (e) {}

  // Theme toggle 버튼 — 아이콘 표시는 CSS 가 .dark 클래스로 처리 (textContent 변경 없음 → 깜빡 0)
  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.querySelector('.tb-theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var isDark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('taystudio.theme', isDark ? 'dark' : 'light'); } catch (e) {}
    });
  });
})();
