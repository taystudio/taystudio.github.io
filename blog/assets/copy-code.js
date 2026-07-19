// copy-code.js — 코드블록(.tb-prose pre)에 "복사" 버튼 추가.
// 코드블록은 항상 다크 배경(prism-tomorrow)이라 버튼도 light-on-dark 로 통일.
(function () {
  var COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function flash(btn, ok) {
    btn.classList.remove('ok', 'err');
    btn.classList.add(ok ? 'ok' : 'err');
    btn.innerHTML = ok ? CHECK + '<span>복사됨</span>' : '<span>실패</span>';
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.classList.remove('ok', 'err');
      btn.innerHTML = COPY;
    }, 1600);
  }

  function copy(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { flash(btn, true); },
        function () { flash(btn, fallbackCopy(text)); }
      );
    } else {
      flash(btn, fallbackCopy(text));
    }
  }

  function init() {
    var pres = document.querySelectorAll('.tb-prose pre');
    for (var i = 0; i < pres.length; i++) {
      var pre = pres[i];
      var code = pre.querySelector('code');
      if (!code || pre.querySelector('.code-copy')) continue;
      pre.classList.add('has-copy');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy';
      btn.setAttribute('aria-label', '코드 복사');
      btn.innerHTML = COPY;
      (function (b, c) {
        b.addEventListener('click', function () { copy(c.innerText, b); });
      })(btn, code);
      pre.appendChild(btn);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
