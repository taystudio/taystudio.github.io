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
    try { localStorage.setItem('ts-installed', '1'); } catch (_) {}
    syncInstallButtons();
  });
})();

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}
// 카카오톡·라인·페북·인스타 등 in-app 브라우저는 PWA install 미지원 → 외부 브라우저 안내
function isInAppBrowser() {
  const ua = navigator.userAgent;
  return /KAKAOTALK|Line\/|FBAN|FBAV|Instagram|NAVER\(inapp/i.test(ua);
}
function isInstalled() {
  if (isStandalone()) return true;
  try { return localStorage.getItem('ts-installed') === '1'; } catch (_) { return false; }
}

function syncInstallButtons() {
  // 카카오·라인·페북 등 in-app 브라우저 = "외부 열기" 모드 (PWA install 미지원)
  // 미지원 환경(prompt X·iOS X·미설치) = 숨김 / 설치됨 = 비활성 "✓ 설치됨" / 미설치 = 활성 "웹앱 설치"
  const installed = isInstalled();
  const inApp = isInAppBrowser();
  const supported = inApp || deferredPrompt !== null || isIOS() || installed;
  for (const btn of installButtonRefs) {
    btn.hidden = !supported;
    if (inApp && !installed) {
      btn.disabled = false;
      btn.textContent = '외부 열기';
      btn.title = 'in-app 브라우저는 앱 설치 미지원 — Chrome·Safari로 열어주세요';
    } else {
      btn.disabled = installed;
      btn.textContent = installed ? '✓ 설치됨' : '웹앱 설치';
      btn.title = installed
        ? '이미 앱으로 설치됨'
        : '브라우저에서 바로 설치 — 홈 화면·작업표시줄에 앱처럼 추가됩니다';
    }
  }
}

async function handleInstallClick() {
  if (isInstalled()) return;
  if (isInAppBrowser()) {
    showInAppRedirectModal();
    return;
  }
  if (deferredPrompt) {
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        try { localStorage.setItem('ts-installed', '1'); } catch (_) {}
        syncInstallButtons();
      }
    } catch (_) {}
    return;
  }
  if (isIOS()) showIosInstallModal();
}

// /video/ 도구는 메모리·WASM·file 권한 제약이 커 in-app 브라우저에서 거의 동작 X.
// 페이지 로드 시 in-app 감지되면 자동 안내 박스 노출(상단 sticky).
(function autoVideoInAppWarning() {
  if (!isInAppBrowser()) return;
  if (!location.pathname.startsWith('/video/')) return;
  function show() {
    if (document.getElementById('ts-video-inapp-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'ts-video-inapp-banner';
    banner.style.cssText = 'background:#fef3c7;border-bottom:1px solid #fbbf24;color:#78350f;padding:14px 20px 14px 20px;font-size:13.5px;line-height:1.55;text-align:center';
    banner.innerHTML = `
      <b>⚠ in-app 브라우저는 동영상 처리에 부적합합니다</b><br>
      메모리·file 권한 한계로 자주 실패. <b>Chrome / Safari</b>에서 열면 안정적으로 동작합니다.
      <button type="button" id="ts-inapp-open-external" style="margin-left:10px;padding:5px 10px;background:#7c3aed;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12.5px">외부 브라우저로 열기</button>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    banner.querySelector('#ts-inapp-open-external').addEventListener('click', showInAppRedirectModal);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();

function showInAppRedirectModal() {
  if (document.getElementById('ts-install-overlay')) return;
  const android = isAndroid();
  const ios = isIOS();
  const overlay = document.createElement('div');
  overlay.id = 'ts-install-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:22px;max-width:380px;font-size:14.5px;line-height:1.65;color:var(--text,#111)">
      <div style="font-weight:700;font-size:16px;margin-bottom:10px">외부 브라우저에서 열기</div>
      <p style="margin:0 0 14px 0;color:var(--muted,#666);font-size:13.5px">
        카카오·라인·페북 등 in-app 브라우저는 <b>앱 설치 기능을 지원하지 않습니다</b>.
        Chrome·Safari로 열면 홈 화면에 앱처럼 추가할 수 있어요.
      </p>
      <div style="font-weight:600;margin-bottom:8px">방법</div>
      <ol style="padding-left:18px;margin:0 0 16px 0;font-size:13.5px">
        <li>화면 <b>우측 상단 메뉴(⋮ 또는 ⋯)</b> 탭</li>
        <li><b>"외부 브라우저로 열기"</b> 또는 <b>"다른 브라우저에서 열기"</b> 선택</li>
        ${android ? '<li>또는 아래 <b>"Chrome으로 열기"</b> 시도</li>' : ''}
      </ol>
      ${android ? `
        <button type="button" id="ts-chrome-intent" style="width:100%;padding:10px;background:var(--primary,#2563eb);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;margin-bottom:8px">Chrome으로 열기 (시도)</button>
      ` : ''}
      <button type="button" id="ts-install-close" style="width:100%;padding:10px;background:${android || ios ? 'var(--bg,#f3f4f6)' : 'var(--primary,#2563eb)'};color:${android || ios ? 'var(--text,#111)' : '#fff'};border:1px solid var(--border,#e5e7eb);border-radius:8px;font-weight:600;cursor:pointer;font-size:14px">닫기</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#ts-install-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  const intentBtn = overlay.querySelector('#ts-chrome-intent');
  if (intentBtn) {
    intentBtn.addEventListener('click', () => {
      const path = location.href.replace(/^https?:\/\//, '');
      location.href = `intent://${path}#Intent;scheme=https;package=com.android.chrome;end`;
    });
  }
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
