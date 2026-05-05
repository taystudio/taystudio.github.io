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

// PWA install 버튼 — beforeinstallprompt 받아서 deferredPrompt 보관 후 클릭 시 native prompt.
// iOS Safari는 beforeinstallprompt 미지원 → 클릭 시 "공유 → 홈 화면에 추가" 안내 모달.
let deferredPrompt = null;
const installButtonRefs = [];

(function listenInstallEvents() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    syncInstallButtons();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    syncInstallButtons();
  });
})();

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function syncInstallButtons() {
  // 이미 설치(standalone) = 숨김 / Android·Desktop = prompt 받은 후 표시 / iOS Safari = 항상 표시(안내용)
  const visible = !isStandalone() && (deferredPrompt !== null || isIOS());
  for (const btn of installButtonRefs) {
    btn.hidden = !visible;
  }
}

async function handleInstallClick() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        syncInstallButtons();
      }
    } catch (_) {}
    return;
  }
  if (isIOS()) showIosInstallModal();
}

function showIosInstallModal() {
  if (document.getElementById('ts-install-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'ts-install-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:22px;max-width:360px;font-size:14.5px;line-height:1.65;color:var(--text,#111)">
      <div style="font-weight:700;font-size:16px;margin-bottom:12px">앱처럼 설치하기 (iOS Safari)</div>
      <ol style="padding-left:18px;margin:0 0 16px 0">
        <li>화면 아래(또는 위) <b>공유 버튼</b> (네모+화살표) 탭</li>
        <li>목록에서 <b>"홈 화면에 추가"</b> 선택</li>
        <li>우측 상단 <b>"추가"</b> 탭</li>
      </ol>
      <button type="button" id="ts-install-close" style="width:100%;padding:10px;background:var(--primary,#2563eb);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px">확인</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#ts-install-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

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
          <button type="button" id="ts-install-btn" class="install-btn" hidden title="브라우저에서 바로 설치 — 홈 화면·작업표시줄에 앱처럼 추가됩니다">웹앱 설치</button>
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
    const installBtn = this.querySelector('#ts-install-btn');
    if (installBtn) {
      installButtonRefs.push(installBtn);
      installBtn.addEventListener('click', handleInstallClick);
      syncInstallButtons();
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

// PWA Service Worker — 사이트 전체 scope `/`. 60+ 페이지에 인라인 register 두는 대신 한 군데로 통합.
// 기존 `/tools/sw.js`(scope `./tools/`) 등록은 자동 정리 — root SW로 마이그레이션.
(function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const ALLOWED = ['taystudio.github.io', 'localhost', '127.0.0.1'];
  if (!ALLOWED.includes(location.hostname)) return;

  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const url = reg.active?.scriptURL || '';
        if (url.endsWith('/tools/sw.js')) {
          try { await reg.unregister(); } catch (_) {}
        }
      }
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (_) {
      // SW 등록 실패해도 페이지 동작에는 영향 없음
    }
  });
})();
