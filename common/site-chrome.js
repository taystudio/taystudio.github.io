// TAYSTUDIO common chrome — header & footer web components.
// Uses absolute paths under / so depth-agnostic across all pages.

// i18n — /en/ path 또는 <html lang="en">이면 영어 모드.
const LANG = (() => {
  const path = window.location.pathname;
  const htmlLang = (document.documentElement.lang || '').toLowerCase();
  if (path.startsWith('/en/') || path === '/en' || htmlLang.startsWith('en')) return 'en';
  return 'ko';
})();

const I18N = {
  ko: {
    mirrorWarn: '⚠️ 비공식 미러 사이트입니다. 정품: <a href="https://taystudio.github.io" style="color:#fff;font-weight:700;text-decoration:underline">taystudio.github.io</a>',
    installExternal: '외부 열기',
    installDone: '✓ 설치됨',
    installPrompt: '웹앱 설치',
    installInAppTitle: 'in-app 브라우저는 앱 설치 미지원 — Chrome·Safari로 열어주세요',
    installAlreadyTitle: '이미 앱으로 설치됨',
    installPromptTitle: '브라우저에서 바로 설치 — 홈 화면·작업표시줄에 앱처럼 추가됩니다',
    videoInAppTitle: '⚠ in-app 브라우저는 동영상 처리에 부적합합니다',
    videoUnsupportedTitle: '⚠ 이 브라우저는 동영상 처리에 한계가 있을 수 있습니다',
    videoBannerBody: '메모리·WASM 한계로 자주 실패. <b>Chrome / Safari</b> 또는 <b>데스크톱</b>에서 안정적으로 동작합니다.',
    videoBtnExternal: '외부 브라우저로 열기',
    videoBtnChrome: 'Chrome으로 열기',
    inAppModalTitle: '외부 브라우저에서 열기',
    inAppModalBody: '카카오·라인·페북 등 in-app 브라우저는 <b>앱 설치 기능을 지원하지 않습니다</b>. Chrome·Safari로 열면 홈 화면에 앱처럼 추가할 수 있어요.',
    inAppHowto: '방법',
    inAppStep1: '화면 <b>우측 상단 메뉴(⋮ 또는 ⋯)</b> 탭',
    inAppStep2: '<b>"외부 브라우저로 열기"</b> 또는 <b>"다른 브라우저에서 열기"</b> 선택',
    inAppStep3: '또는 아래 <b>"Chrome으로 열기"</b> 시도',
    inAppChromeTry: 'Chrome으로 열기 (시도)',
    closeBtn: '닫기',
    iosInstallTitle: '앱처럼 설치하기 (iOS Safari)',
    iosStep1: '화면 아래(또는 위) <b>공유 버튼</b> (네모+화살표) 탭',
    iosStep2: '목록에서 <b>"홈 화면에 추가"</b> 선택',
    iosStep3: '우측 상단 <b>"추가"</b> 탭',
    confirmBtn: '확인',
    navTools: '계산기',
    navText: '텍스트',
    navImage: '이미지',
    navPdf: 'PDF',
    navVideo: '동영상',
    disclaimerHTML: '⚠️ 본 사이트의 모든 계산은 <b>참고용 추정치</b>입니다. 정확한 결과는 공식 기관·전문가 상담을 권장합니다 ·',
    disclaimerLink: '자세히',
    closeAriaLabel: '공지 닫기',
    closeTitle: '닫기',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    footerNote: '입력값은 브라우저 안에서만 처리됩니다',
    langToggleLabel: 'EN',
    langToggleTitle: 'View in English',
  },
  en: {
    mirrorWarn: '⚠️ Unofficial mirror site. Official: <a href="https://taystudio.github.io" style="color:#fff;font-weight:700;text-decoration:underline">taystudio.github.io</a>',
    installExternal: 'Open Externally',
    installDone: '✓ Installed',
    installPrompt: 'Install Web App',
    installInAppTitle: 'In-app browsers do not support app install — please open in Chrome/Safari',
    installAlreadyTitle: 'Already installed as app',
    installPromptTitle: 'Install instantly from your browser — adds to home screen/taskbar like a native app',
    videoInAppTitle: '⚠ In-app browsers are not suitable for video processing',
    videoUnsupportedTitle: '⚠ This browser may have limitations for video processing',
    videoBannerBody: 'Frequent failures due to memory/WASM limits. Works reliably in <b>Chrome / Safari</b> or on <b>desktop</b>.',
    videoBtnExternal: 'Open in External Browser',
    videoBtnChrome: 'Open in Chrome',
    inAppModalTitle: 'Open in External Browser',
    inAppModalBody: 'In-app browsers (KakaoTalk, Line, Facebook etc.) <b>do not support app install</b>. Open in Chrome/Safari to add this app to your home screen.',
    inAppHowto: 'How to',
    inAppStep1: 'Tap <b>menu (⋮ or ⋯)</b> on the top right',
    inAppStep2: 'Select <b>"Open in external browser"</b> or <b>"Open in other browser"</b>',
    inAppStep3: 'Or try the <b>"Open in Chrome"</b> button below',
    inAppChromeTry: 'Open in Chrome (try)',
    closeBtn: 'Close',
    iosInstallTitle: 'Install as App (iOS Safari)',
    iosStep1: 'Tap the <b>Share button</b> (square with arrow) at the bottom (or top) of the screen',
    iosStep2: 'Select <b>"Add to Home Screen"</b> from the list',
    iosStep3: 'Tap <b>"Add"</b> on the top right',
    confirmBtn: 'OK',
    navTools: 'Calculators',
    navText: 'Text',
    navImage: 'Image',
    navPdf: 'PDF',
    navVideo: 'Video',
    disclaimerHTML: '⚠️ All calculations on this site are <b>estimates for reference</b>. Consult official authorities or professionals for accurate results ·',
    disclaimerLink: 'Learn more',
    closeAriaLabel: 'Close notice',
    closeTitle: 'Close',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    footerNote: 'All inputs are processed only in your browser',
    langToggleLabel: 'KO',
    langToggleTitle: '한국어로 보기',
  }
};

const T = I18N[LANG];

// Phase A whitelist — 영어판 존재하는 path. Phase B에서 도구 추가될 때마다 갱신.
const TRANSLATED_PATHS = new Set([
  '/', '/tools/', '/tools/compound/'
]);

// 현재 path에 대응하는 반대 언어 URL 계산. 없으면 hub fallback.
function getAltLangUrl() {
  const path = window.location.pathname;
  if (LANG === 'en') {
    // 영어 → 한국어: /en/ 제거. 한국어는 source라 항상 존재.
    const koPath = path.replace(/^\/en/, '') || '/';
    return koPath;
  }
  // 한국어 → 영어: whitelist 확인 후 변환, 없으면 /en/ hub fallback.
  if (TRANSLATED_PATHS.has(path)) {
    return '/en' + (path === '/' ? '/' : path);
  }
  return '/en/';
}

// 도메인 가드 — 비공식 미러 사이트 경고
(function () {
  const ALLOWED = ['taystudios.com', 'www.taystudios.com', 'taystudio.github.io', 'localhost', '127.0.0.1', ''];
  const host = location.hostname;
  if (ALLOWED.includes(host) || host.endsWith('.local')) return;
  const show = () => {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#dc2626;color:#fff;padding:14px 20px;text-align:center;font-size:14px;line-height:1.5;font-weight:500';
    banner.innerHTML = T.mirrorWarn;
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
// /video/ 도구는 Chrome 외 모바일 브라우저(삼성 인터넷·Whale·UC 등)에서 메모리·WASM 한계로 실패 빈번.
// in-app + 위 브라우저 자동 안내 대상.
function isVideoUnsupportedBrowser() {
  if (isInAppBrowser()) return true;
  return /SamsungBrowser|UCBrowser|Whale\//i.test(navigator.userAgent);
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
      btn.textContent = T.installExternal;
      btn.title = T.installInAppTitle;
    } else {
      btn.disabled = installed;
      btn.textContent = installed ? T.installDone : T.installPrompt;
      btn.title = installed ? T.installAlreadyTitle : T.installPromptTitle;
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

// /video/ 도구는 Chrome·Safari 외 환경에서 메모리·WASM 한계로 실패 빈번.
// in-app + 삼성 인터넷·Whale 등 감지 시 자동 안내 배너(상단 sticky).
(function autoVideoBrowserWarning() {
  if (!location.pathname.startsWith('/video/')) return;
  if (!isVideoUnsupportedBrowser()) return;
  const inApp = isInAppBrowser();
  function show() {
    if (document.getElementById('ts-video-inapp-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'ts-video-inapp-banner';
    banner.style.cssText = 'background:#fef3c7;border-bottom:1px solid #fbbf24;color:#78350f;padding:14px 20px 14px 20px;font-size:13.5px;line-height:1.55;text-align:center';
    const title = inApp ? T.videoInAppTitle : T.videoUnsupportedTitle;
    const btnLabel = inApp ? T.videoBtnExternal : T.videoBtnChrome;
    banner.innerHTML = `
      <b>${title}</b><br>
      ${T.videoBannerBody}
      <button type="button" id="ts-inapp-open-external" style="margin-left:10px;padding:5px 10px;background:#7c3aed;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12.5px">${btnLabel}</button>
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
      <div style="font-weight:700;font-size:16px;margin-bottom:10px">${T.inAppModalTitle}</div>
      <p style="margin:0 0 14px 0;color:var(--muted,#666);font-size:13.5px">${T.inAppModalBody}</p>
      <div style="font-weight:600;margin-bottom:8px">${T.inAppHowto}</div>
      <ol style="padding-left:18px;margin:0 0 16px 0;font-size:13.5px">
        <li>${T.inAppStep1}</li>
        <li>${T.inAppStep2}</li>
        ${android ? `<li>${T.inAppStep3}</li>` : ''}
      </ol>
      ${android ? `
        <button type="button" id="ts-chrome-intent" style="width:100%;padding:10px;background:var(--primary,#2563eb);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;margin-bottom:8px">${T.inAppChromeTry}</button>
      ` : ''}
      <button type="button" id="ts-install-close" style="width:100%;padding:10px;background:${android || ios ? 'var(--bg,#f3f4f6)' : 'var(--primary,#2563eb)'};color:${android || ios ? 'var(--text,#111)' : '#fff'};border:1px solid var(--border,#e5e7eb);border-radius:8px;font-weight:600;cursor:pointer;font-size:14px">${T.closeBtn}</button>
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
      <div style="font-weight:700;font-size:16px;margin-bottom:12px">${T.iosInstallTitle}</div>
      <ol style="padding-left:18px;margin:0 0 16px 0">
        <li>${T.iosStep1}</li>
        <li>${T.iosStep2}</li>
        <li>${T.iosStep3}</li>
      </ol>
      <button type="button" id="ts-install-close" style="width:100%;padding:10px;background:var(--primary,#2563eb);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px">${T.confirmBtn}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#ts-install-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function isToolsPage() {
  // 면책 banner = "모든 계산은 참고용 추정치". 계산기(/tools/)에서만 노출.
  // text/는 변환·카운트라 정확 — banner 부적절. image/test 등은 카테고리별로 별도 결정.
  // /tools/privacy·/tools/terms 는 root /privacy·/terms 로 이전된 stub 이므로 제외, /tools/404 도 도구 아님.
  const path = window.location.pathname;
  if (!path.includes('/tools/')) return false;
  if (/\/tools\/(privacy|terms|404)\b/.test(path)) return false;
  return true;
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const path = window.location.pathname;
    const isCat = (slug) => path === '/' + slug + '/' || path.startsWith('/' + slug + '/');
    const cls = (slug) => 'nav-link' + (isCat(slug) ? ' active' : '');
    const altUrl = getAltLangUrl();
    const termsBase = LANG === 'en' ? `${BASE}/en/terms/` : `${BASE}/terms/`;
    const headerHTML = `
      <header class="site-header">
        <a href="${LANG === 'en' ? BASE + '/en/' : BASE + '/'}" class="logo">TAYSTUDIO</a>
        <nav class="site-nav">
          <a href="${LANG === 'en' ? BASE + '/en/tools/' : BASE + '/tools/'}" class="${cls('tools')}">${T.navTools}</a>
          <a href="${LANG === 'en' ? BASE + '/en/text/' : BASE + '/text/'}" class="${cls('text')}">${T.navText}</a>
          <a href="${LANG === 'en' ? BASE + '/en/image/' : BASE + '/image/'}" class="${cls('image')}">${T.navImage}</a>
          <a href="${LANG === 'en' ? BASE + '/en/pdf/' : BASE + '/pdf/'}" class="${cls('pdf')}">${T.navPdf}</a>
          <a href="${LANG === 'en' ? BASE + '/en/video/' : BASE + '/video/'}" class="${cls('video')}">${T.navVideo}</a>
          <button type="button" id="ts-install-btn" class="install-btn" hidden title="${T.installPromptTitle}">${T.installPrompt}</button>
          <a href="${altUrl}" class="lang-toggle" title="${T.langToggleTitle}" rel="alternate" hreflang="${LANG === 'en' ? 'ko' : 'en'}">${T.langToggleLabel}</a>
        </nav>
      </header>
    `;
    const disclaimerHTML = !isToolsPage() ? '' : `
      <div id="ts-disclaimer" role="note" style="position:relative;background:rgba(245,158,11,0.08);border-bottom:1px solid rgba(245,158,11,0.25);padding:8px 44px 8px 20px;text-align:center;font-size:12.5px;line-height:1.5;color:var(--text)">
        ${T.disclaimerHTML}
        <a href="${termsBase}" style="color:var(--primary);text-decoration:none">${T.disclaimerLink}</a>
        <button id="ts-disclaimer-close" type="button" aria-label="${T.closeAriaLabel}" title="${T.closeTitle}" style="position:absolute;top:50%;right:8px;transform:translateY(-50%);width:auto;padding:2px 8px;font-size:18px;font-weight:400;line-height:1;background:transparent;color:var(--muted);border:none;border-radius:4px;cursor:pointer">×</button>
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

    // ≤480px = install을 header 직접 자식으로 옮김 → grid 2줄 layout에서 자유 배치.
    // >480px = install을 nav 안 마지막 자식으로 (기존 데스크톱 위치 100% 보존).
    // matchMedia change로 viewport rotation·DevTools resize 시에도 즉시 재배치.
    const headerEl = this.querySelector('.site-header');
    const navEl = this.querySelector('.site-nav');
    if (installBtn && headerEl && navEl) {
      const mq = window.matchMedia('(max-width: 480px)');
      const placeInstall = () => {
        if (mq.matches) {
          if (installBtn.parentElement !== headerEl) headerEl.appendChild(installBtn);
        } else {
          if (installBtn.parentElement !== navEl) navEl.appendChild(installBtn);
        }
      };
      placeInstall();
      try { mq.addEventListener('change', placeInstall); }
      catch (_) { mq.addListener(placeInstall); /* Safari < 14 */ }
    }
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const privacyHref = LANG === 'en' ? `${BASE}/en/privacy/` : `${BASE}/privacy/`;
    const termsHref = LANG === 'en' ? `${BASE}/en/terms/` : `${BASE}/terms/`;
    this.innerHTML = `
      <footer style="margin-top:48px;padding:32px 20px;border-top:1px solid var(--border);text-align:center;color:var(--muted)">
        <div style="font-size:13px;margin-bottom:18px">
          <a href="${privacyHref}" style="color:var(--muted);text-decoration:none;margin:0 8px">${T.privacy}</a>
          ·
          <a href="${termsHref}" style="color:var(--muted);text-decoration:none;margin:0 8px">${T.terms}</a>
        </div>
        <div style="font-size:13px">${T.footerNote}</div>
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
  const ALLOWED = ['taystudios.com', 'www.taystudios.com', 'taystudio.github.io', 'localhost', '127.0.0.1'];
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
