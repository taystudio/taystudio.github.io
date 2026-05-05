// TAYSTUDIO common chrome — header & footer web components.
// Uses absolute paths under / so depth-agnostic across all pages.

// 도메인 가드 — 비공식 미러 사이트 경고
(function () {
  const ALLOWED = ['taystudio.github.io', 'localhost', '127.0.0.1', ''];
  const host = location.hostname;
  if (ALLOWED.includes(host) || host.endsWith('.local')) return;
  const show = () => {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#dc2626;color:#fff;padding:14px 20px;text-align:center;font-size:14px;line-height:1.5;font-weight:500';
    banner.innerHTML = '⚠️ 비공식 미러 사이트입니다. 정품: <a href="https://taystudio.github.io" style="color:#fff;font-weight:700;text-decoration:underline">taystudio.github.io</a>';
    document.body.insertBefore(banner, document.body.firstChild);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();

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
  // 면책 banner = "모든 계산은 참고용 추정치". 계산기(/tools/)에서만 노출.
  // text/는 변환·카운트라 정확 — banner 부적절. image/test 등은 카테고리별로 별도 결정.
  const path = window.location.pathname;
  return path.includes('/tools/');
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const path = window.location.pathname;
    const isCat = (slug) => path === '/' + slug + '/' || path.startsWith('/' + slug + '/');
    const cls = (slug) => 'nav-link' + (isCat(slug) ? ' active' : '');
    const headerHTML = `
      <header class="site-header">
        <a href="${BASE}/" class="logo">TAYSTUDIO</a>
        <nav class="site-nav">
          <a href="${BASE}/tools/" class="${cls('tools')}">계산기</a>
          <a href="${BASE}/text/" class="${cls('text')}">텍스트</a>
          <a href="${BASE}/image/" class="${cls('image')}">이미지</a>
          <a href="${BASE}/video/" class="${cls('video')}">동영상</a>
        </nav>
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
      <footer style="margin-top:48px;padding:32px 20px;border-top:1px solid var(--border);text-align:center;color:var(--muted)">
        <div style="font-size:13px;margin-bottom:18px">
          <a href="${BASE}/tools/privacy/" style="color:var(--muted);text-decoration:none;margin:0 8px">개인정보처리방침</a>
          ·
          <a href="${BASE}/tools/terms/" style="color:var(--muted);text-decoration:none;margin:0 8px">이용약관</a>
        </div>
        <div style="font-size:13px">입력값은 브라우저 안에서만 처리됩니다</div>
        <div style="font-size:12px;margin-top:10px;opacity:.7">© 2026 TAYSTUDIO. All Rights Reserved.</div>
      </footer>
    `;
  }
}

customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);
