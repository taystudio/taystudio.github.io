// TAYSTUDIO common chrome — header & footer web components.
// Uses absolute paths under / so depth-agnostic across all pages.

(function () {
  const GA_ID = 'G-79C40NJRYT';
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
})();

const BASE = '';

function isToolsPage() {
  // 루트(/)·홈은 면책 banner 비표시. /tools/ 하위(또는 file:// 로컬)에서만 표시.
  return window.location.pathname.includes('/tools/');
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const headerHTML = `
      <header class="site-header">
        <a href="${BASE}/" class="logo">TAYSTUDIO</a>
        <nav><a href="${BASE}/tools/">Tools</a></nav>
      </header>
    `;
    const disclaimerHTML = !isToolsPage() ? '' : `
      <div id="ts-disclaimer" role="note" style="position:relative;background:rgba(245,158,11,0.08);border-bottom:1px solid rgba(245,158,11,0.25);padding:8px 44px 8px 20px;text-align:center;font-size:12.5px;line-height:1.5;color:var(--text)">
        ⚠️ 본 사이트의 모든 계산은 <b>참고용 추정치</b>입니다. 정확한 결과는 공식 기관·전문가 상담을 권장합니다 ·
        <a href="${BASE}/tools/terms/" style="color:var(--primary);text-decoration:none">자세히</a>
        <button id="ts-disclaimer-close" type="button" aria-label="공지 닫기" title="닫기" style="position:absolute;top:50%;right:8px;transform:translateY(-50%);width:auto;padding:2px 8px;font-size:18px;font-weight:400;line-height:1;background:transparent;color:var(--muted);border:none;border-radius:4px;cursor:pointer">×</button>
      </div>
    `;
    this.innerHTML = headerHTML + disclaimerHTML;
    const closeBtn = this.querySelector('#ts-disclaimer-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const banner = this.querySelector('#ts-disclaimer');
        if (banner) banner.style.display = 'none';
      });
    }
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer style="margin-top:48px;padding:24px 20px;border-top:1px solid var(--border);text-align:center;font-size:13px;color:var(--muted)">
        <div style="margin-bottom:12px">
          <a href="${BASE}/tools/privacy/" style="color:var(--muted);text-decoration:none;margin:0 8px">개인정보처리방침</a>
          ·
          <a href="${BASE}/tools/terms/" style="color:var(--muted);text-decoration:none;margin:0 8px">이용약관</a>
        </div>
        <div>© 2026 TAYSTUDIO · 입력값은 브라우저 안에서만 처리됩니다</div>
        <div class="sig" style="margin-top:8px;font-family:var(--mono,ui-monospace,monospace);font-size:11px;letter-spacing:.18em;opacity:.55">MADE IN SEOUL</div>
      </footer>
    `;
  }
}

customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);
