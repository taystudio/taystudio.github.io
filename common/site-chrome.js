// TAYSTUDIO common chrome — header & footer web components.
// Uses absolute paths under / so depth-agnostic across all pages.

// 테마 토글 — FOUC 방지용 즉시 적용. localStorage 'taystudio.theme' 명시값(light/dark) 있으면 attribute 부여, 없으면 OS prefers-color-scheme 따라감.
(function () {
  try {
    const t = localStorage.getItem('taystudio.theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (_) {}
})();

// dns-prefetch — 외부 도메인 사전 조회. 페이지 head 진입 직후 link 동적 주입.
(function () {
  const hosts = [
    'https://www.googletagmanager.com',
    'https://static.cloudflareinsights.com',
    'https://cdn.staticimgly.com',
    'https://esm.sh',
  ];
  hosts.forEach(host => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = host;
    document.head.appendChild(link);
  });
})();

// 파일 size 사전 체크 — 도구별 권장 한계 초과 시 alert + 거절.
// 사용: if (!window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
//   - sizeMB: 권장 한계 (MB 단위)
//   - label: alert 메시지에 표시될 도구·파일 타입 이름 (예: 'PDF', '이미지', '동영상')
(function () {
  function isEnglish() {
    // html lang 또는 path가 /en/로 시작하면 영문 메시지
    const lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.startsWith('en')) return true;
    if (location.pathname.startsWith('/en/')) return true;
    return false;
  }
  function checkFileSize(file, sizeMB, label) {
    if (!file) return false;
    const maxBytes = sizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const actualMB = (file.size / 1024 / 1024).toFixed(1);
      if (isEnglish()) {
        alert(`${label || 'File'} is ${actualMB}MB — exceeds the ${sizeMB}MB recommended limit. Browser memory limits may make processing unstable. Use a smaller file.`);
      } else {
        alert(`${label || '파일'} 크기 ${actualMB}MB — 권장 한계 ${sizeMB}MB 초과. 브라우저 메모리 한계로 처리 불안정·실패 가능. 더 작은 파일 사용 권장.`);
      }
      return false;
    }
    return true;
  }
  window.TayStudio = window.TayStudio || {};
  window.TayStudio.checkFileSize = checkFileSize;
})();

// HTML escape — innerHTML 컨텍스트에 사용자 입력(파일명 등) 삽입 시 XSS 방어용.
// 사용: `<div>${TayStudio.escapeHtml(file.name)}</div>`
(function () {
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  window.TayStudio = window.TayStudio || {};
  window.TayStudio.escapeHtml = escapeHtml;
})();

// 파일명 sanitize — Windows·macOS·Linux 호환. 도구 다운로드 파일명 안전화.
// 사용: window.TayStudio.sanitizeFilename(rawName)
(function () {
  function sanitizeFilename(name) {
    if (!name || typeof name !== 'string') return 'download';
    let s = name
      .replace(/[\x00-\x1f\x7f]/g, '')   // 제어문자
      .replace(/[<>:"\/\\|?*]/g, '_')    // OS 예약 문자 (Windows critical)
      .replace(/^\.+/, '_')              // dotfile 방지
      .replace(/[\s.]+$/, '')            // 끝 공백·점 (Windows shell 호환)
      .trim();
    if (!s) s = 'download';
    if (s.length > 200) {
      const dot = s.lastIndexOf('.');
      if (dot > 0 && dot > s.length - 12) {
        const ext = s.slice(dot);
        s = s.slice(0, 200 - ext.length) + ext;
      } else {
        s = s.slice(0, 200);
      }
    }
    return s;
  }
  window.TayStudio = window.TayStudio || {};
  window.TayStudio.sanitizeFilename = sanitizeFilename;
})();

// toast — 화면 하단 중앙에 잠시 떴다 사라지는 비파괴적 안내. alert 대안.
// 사용: TayStudio.showToast('메시지', { duration: 3000 })
(function () {
  function showToast(message, opts) {
    opts = opts || {};
    const duration = typeof opts.duration === 'number' ? opts.duration : 3000;
    let toast = document.getElementById('taystudio-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'taystudio-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = [
        'position:fixed', 'left:50%',
        'bottom:max(24px, env(safe-area-inset-bottom, 24px))',
        'transform:translateX(-50%)', 'z-index:99999',
        'background:rgba(20,20,20,0.94)', 'color:#fff',
        'padding:12px 20px', 'border-radius:8px',
        'font-size:14px', 'line-height:1.5', 'max-width:90vw',
        'box-shadow:0 4px 24px rgba(0,0,0,0.3)',
        'opacity:0', 'transition:opacity 0.2s ease',
        'pointer-events:none',
      ].join(';');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    void toast.offsetWidth;
    toast.style.opacity = '1';
    clearTimeout(toast._tsTimer);
    toast._tsTimer = setTimeout(() => { toast.style.opacity = '0'; }, duration);
  }
  window.TayStudio = window.TayStudio || {};
  window.TayStudio.showToast = showToast;
})();

// drop 폴더 감지 — drag-drop으로 폴더가 들어왔는지 검사 + toast 안내.
// 사용: if (TayStudio.rejectFolderDrop(e)) return;
//   - true 반환 시 toast 자동 표시. caller는 즉시 return해서 폴더 처리 시도 차단.
//   - webkitGetAsEntry 우선, file.type=='' && size==0 fallback.
(function () {
  function dropIsFolder(event) {
    const dt = event && event.dataTransfer;
    if (!dt) return false;
    if (dt.items && dt.items.length) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (typeof item.webkitGetAsEntry === 'function') {
          try {
            const entry = item.webkitGetAsEntry();
            if (entry && entry.isDirectory) return true;
          } catch (_) {}
        }
      }
    }
    if (dt.files && dt.files.length) {
      for (let i = 0; i < dt.files.length; i++) {
        const f = dt.files[i];
        if (f && f.type === '' && f.size === 0) return true;
      }
    }
    return false;
  }
  function isEnglishPage() {
    const lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.startsWith('en')) return true;
    if (location.pathname.startsWith('/en/')) return true;
    return false;
  }
  function rejectFolderDrop(event) {
    if (!dropIsFolder(event)) return false;
    const msg = isEnglishPage()
      ? '📁 Folder drop is not supported. Please drop individual files.'
      : '📁 폴더는 지원하지 않아요. 개별 파일을 떨어뜨려 주세요.';
    if (window.TayStudio && window.TayStudio.showToast) {
      window.TayStudio.showToast(msg, { duration: 3500 });
    }
    return true;
  }
  window.TayStudio = window.TayStudio || {};
  window.TayStudio.dropIsFolder = dropIsFolder;
  window.TayStudio.rejectFolderDrop = rejectFolderDrop;
})();

// clipboard paste 이미지 — Ctrl+V로 이미지 붙여넣기 지원. image 카테고리 도구용.
// 사용: TayStudio.bindPasteImage(files => handleFiles(files))
//   - 페이지 전역 paste 이벤트 1회 바인딩. clipboardData에서 image/* 만 추출해 콜백 호출.
//   - 텍스트 입력 중인 input/textarea/contenteditable 안에서의 paste는 무시 (caret 방해 방지).
(function () {
  function isEnglishPage() {
    const lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.startsWith('en')) return true;
    if (location.pathname.startsWith('/en/')) return true;
    return false;
  }
  function inTextInput(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    if (el.isContentEditable) return true;
    return false;
  }
  function bindPasteImage(callback, opts) {
    opts = opts || {};
    const target = opts.target || document;
    function handler(e) {
      if (inTextInput(e.target)) return;
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      if (!items || !items.length) return;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && (item.type || '').indexOf('image/') === 0) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (!files.length) return;
      e.preventDefault();
      const en = isEnglishPage();
      const msg = en
        ? `📋 Pasted ${files.length} image${files.length > 1 ? 's' : ''}`
        : `📋 ${files.length}장 붙여넣음`;
      if (window.TayStudio && window.TayStudio.showToast) {
        window.TayStudio.showToast(msg, { duration: 1500 });
      }
      try { callback(files); } catch (err) { console.error('paste handler:', err); }
    }
    target.addEventListener('paste', handler);
    return () => target.removeEventListener('paste', handler);
  }
  window.TayStudio = window.TayStudio || {};
  window.TayStudio.bindPasteImage = bindPasteImage;
})();

// i18n — /en/ path 또는 <html lang="en">이면 영어 모드.
const LANG = (() => {
  const path = window.location.pathname;
  const htmlLang = (document.documentElement.lang || '').toLowerCase();
  if (path.startsWith('/en/') || path === '/en' || htmlLang.startsWith('en')) return 'en';
  return 'ko';
})();

// 브라우저 우선 언어 — Accept-Language 분석. 페이지 언어와 mismatch 시 lang banner 노출 판단.
const BROWSER_LANG = (() => {
  const langs = navigator.languages || [navigator.language || ''];
  return (langs[0] || '').toLowerCase();
})();

const I18N = {
  ko: {
    mirrorWarn: '⚠️ 비공식 미러 사이트입니다. 정품: <a href="https://taystudios.com" style="color:#fff;font-weight:700;text-decoration:underline">taystudios.com</a>',
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
    about: '운영자 소개',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    footerNote: '입력값은 브라우저 안에서만 처리됩니다',
    langToggleLabel: '🌐 English',
    langToggleTitle: 'View in English',
    // 영어 브라우저 사용자가 한국 페이지에 들어왔을 때 노출 (banner 카피는 영어 — 그 언어 사용자가 읽음)
    langBannerForEnUser: '🌐 This site is also available in <b>English</b>',
    langBannerCTAForEnUser: 'View English version →',
    langBannerDismiss: 'Dismiss',
    // 테마 토글 — 현재 보이는 색 반대로 즉시 전환. 아이콘은 "다음에 갈 모드" (라이트 중이면 🌙, 다크 중이면 ☀️).
    themeLight: '☀️',
    themeDark: '🌙',
    themeTitleToLight: '라이트 모드로 전환',
    themeTitleToDark: '다크 모드로 전환',
    skipToMain: '본문 바로가기',
  },
  en: {
    mirrorWarn: '⚠️ Unofficial mirror site. Official: <a href="https://taystudios.com" style="color:#fff;font-weight:700;text-decoration:underline">taystudios.com</a>',
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
    about: 'About',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    footerNote: 'All inputs are processed only in your browser',
    langToggleLabel: '🌐 한국어',
    langToggleTitle: '한국어로 보기',
    // 한국어 브라우저 사용자가 영어 페이지에 들어왔을 때 노출 (banner 카피는 한국어 — 그 언어 사용자가 읽음)
    langBannerForKoUser: '🌐 이 사이트는 <b>한국어</b>로도 볼 수 있어요',
    langBannerCTAForKoUser: '한국어로 보기 →',
    langBannerDismiss: '닫기',
    // 테마 토글 — 현재 보이는 색 반대로 즉시 전환. 아이콘은 "다음에 갈 모드".
    themeLight: '☀️',
    themeDark: '🌙',
    themeTitleToLight: 'Switch to light mode',
    themeTitleToDark: 'Switch to dark mode',
    skipToMain: 'Skip to main content',
  }
};

const T = I18N[LANG];

// 영어판 존재하는 path whitelist — Phase A(2026-05-10) + Phase B-1~4(2026-05-10).
// 도구 추가 시 여기에 한국 path 추가. en/<path>는 단순 prefix 변환이라 자동 매핑.
const TRANSLATED_PATHS = new Set([
  '/',
  '/about/',
  // Calculators (8 universal — 한국 38선 중 universal subset만)
  '/tools/',
  '/tools/compound/', '/tools/bmi/', '/tools/calorie/', '/tools/body-fat/',
  '/tools/ideal-weight/', '/tools/savings/', '/tools/loan/', '/tools/dday/',
  // Image (9선 전부)
  '/image/',
  '/image/compress/', '/image/resize/', '/image/heic-to-jpg/', '/image/crop/',
  '/image/id-photo/', '/image/qr-gen/', '/image/qr-scan/', '/image/ocr/', '/image/bg-remove/',
  // PDF (5선 전부)
  '/pdf/',
  '/pdf/pdf-merge/', '/pdf/pdf-split/', '/pdf/pdf-edit/', '/pdf/pdf-to-image/', '/pdf/img-to-pdf/',
  // Video (5선 전부)
  '/video/',
  '/video/compress/', '/video/trim/', '/video/rotate/', '/video/to-gif/', '/video/to-mp3/',
  // Text (1선만 universal — counter)
  '/text/',
  '/text/counter/'
]);

// 브라우저 언어가 페이지 언어와 mismatch + 사용자가 명시 dismiss·선택 안 했으면 lang banner 노출.
// SEO 안전 — auto redirect 안 함, 사용자 액션이라 search bot은 한국·영어 페이지 각각 정상 인덱싱.
function shouldShowLangBanner() {
  const isEnBrowser = BROWSER_LANG.startsWith('en');
  const isKoBrowser = BROWSER_LANG.startsWith('ko');
  const mismatch = (LANG === 'ko' && isEnBrowser) || (LANG === 'en' && isKoBrowser);
  if (!mismatch) return false;
  try {
    // 사용자가 토글·CTA로 명시 선택한 언어가 현재 페이지면 banner 안 보임
    if (localStorage.getItem('taystudio.lang-pref') === LANG) return false;
    if (localStorage.getItem('taystudio.lang-banner-dismissed') === '1') return false;
  } catch (_) {}
  return true;
}

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

(function () {
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', '{"token": "412699582bf74c0bbb767378e033c0ce"}');
  document.head.appendChild(s);
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
    // 한 번이라도 install 가능하면 다음 페이지 로드부터 flicker 없이 즉시 노출 (localStorage 캐시).
    try { localStorage.setItem('ts-pwa-eligible', '1'); } catch (_) {}
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
// 이전 페이지에서 beforeinstallprompt 받은 적 있으면 true. 페이지 이동 시 flicker 방지.
function wasInstallEligible() {
  try { return localStorage.getItem('ts-pwa-eligible') === '1'; } catch (_) { return false; }
}

function syncInstallButtons() {
  // 카카오·라인·페북 등 in-app 브라우저 = "외부 열기" 모드 (PWA install 미지원)
  // 미지원 환경(prompt X·iOS X·미설치·이전 eligible 캐시 X) = 숨김 / 설치됨 = 비활성 "✓ 설치됨" / 미설치 = 활성 "웹앱 설치"
  // hero install card markup = <button class="install-cta"><span class="install-icon">⬇</span><span class="install-label">웹앱 설치</span></button>
  // → 라벨 변경은 .install-label만 (icon 보존). legacy 단일 버튼은 .install-label 없으면 btn 자체 textContent fallback.
  const installed = isInstalled();
  const inApp = isInAppBrowser();
  const supported = inApp || deferredPrompt !== null || isIOS() || installed || wasInstallEligible();
  for (const btn of installButtonRefs) {
    btn.hidden = !supported;
    const labelEl = btn.querySelector('.install-label') || btn;
    if (inApp && !installed) {
      btn.disabled = false;
      labelEl.textContent = T.installExternal;
      btn.title = T.installInAppTitle;
    } else {
      btn.disabled = installed;
      labelEl.textContent = installed ? T.installDone : T.installPrompt;
      btn.title = installed ? T.installAlreadyTitle : T.installPromptTitle;
    }
  }
  // hero install container — 안 button이 visible해야 container도 visible (margin·gap 공간 차지 방지)
  for (const container of document.querySelectorAll('.hero-install')) {
    container.hidden = !container.querySelector('.install-cta:not([hidden])');
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
    // 테마 토글 초기 아이콘·타이틀 — 현재 화면이 다크/라이트 중 어느 쪽인지 판단해서 "반대"로 갈 아이콘 표시.
    // data-theme 명시값 우선, 없으면 OS prefers-color-scheme 따라감.
    const darkNow = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.hasAttribute('data-theme') &&
       window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const themeIcon = darkNow ? T.themeLight : T.themeDark;
    const themeTitle = darkNow ? T.themeTitleToLight : T.themeTitleToDark;
    // 키보드 사용자가 헤더 nav 건너뛰고 본문으로 바로 점프. 평소 화면 밖, focus 시에만 표시 (CSS .skip-link).
    const skipLinkHTML = `<a href="#main-content" class="skip-link">${T.skipToMain}</a>`;
    const headerHTML = `
      <header class="site-header">
        <a href="${LANG === 'en' ? BASE + '/en/' : BASE + '/'}" class="logo">TAYSTUDIO</a>
        <nav class="site-nav">
          <a href="${LANG === 'en' ? BASE + '/en/tools/' : BASE + '/tools/'}" class="${cls('tools')}">${T.navTools}</a>
          <a href="${LANG === 'en' ? BASE + '/en/text/' : BASE + '/text/'}" class="${cls('text')}">${T.navText}</a>
          <a href="${LANG === 'en' ? BASE + '/en/image/' : BASE + '/image/'}" class="${cls('image')}">${T.navImage}</a>
          <a href="${LANG === 'en' ? BASE + '/en/pdf/' : BASE + '/pdf/'}" class="${cls('pdf')}">${T.navPdf}</a>
          <a href="${LANG === 'en' ? BASE + '/en/video/' : BASE + '/video/'}" class="${cls('video')}">${T.navVideo}</a>
          <span class="header-actions">
            <a href="${altUrl}" class="lang-toggle" title="${T.langToggleTitle}" rel="alternate" hreflang="${LANG === 'en' ? 'ko' : 'en'}">${T.langToggleLabel}</a>
            <button type="button" class="theme-toggle" title="${themeTitle}" aria-label="${themeTitle}">${themeIcon}</button>
          </span>
        </nav>
      </header>
    `;
    const showLangBanner = shouldShowLangBanner();
    const langBannerCopy = LANG === 'ko' ? T.langBannerForEnUser : T.langBannerForKoUser;
    const langBannerCTA = LANG === 'ko' ? T.langBannerCTAForEnUser : T.langBannerCTAForKoUser;
    const langBannerHTML = !showLangBanner ? '' : `
      <div id="ts-lang-banner" role="note" style="position:relative;background:rgba(37,99,235,0.08);border-bottom:1px solid rgba(37,99,235,0.25);padding:9px 44px 9px 20px;text-align:center;font-size:13px;line-height:1.5;color:var(--text)">
        ${langBannerCopy}
        · <a href="${altUrl}" id="ts-lang-banner-cta" style="color:var(--primary);font-weight:600;text-decoration:none">${langBannerCTA}</a>
        <button id="ts-lang-banner-close" type="button" aria-label="${T.langBannerDismiss}" title="${T.langBannerDismiss}" style="position:absolute;top:50%;right:8px;transform:translateY(-50%);width:auto;padding:2px 8px;font-size:18px;font-weight:400;line-height:1;background:transparent;color:var(--muted);border:none;border-radius:4px;cursor:pointer">×</button>
      </div>
    `;
    const disclaimerHTML = !isToolsPage() ? '' : `
      <div id="ts-disclaimer" role="note" style="position:relative;background:rgba(245,158,11,0.08);border-bottom:1px solid rgba(245,158,11,0.25);padding:8px 44px 8px 20px;text-align:center;font-size:12.5px;line-height:1.5;color:var(--text)">
        ${T.disclaimerHTML}
        <a href="${termsBase}" style="color:var(--primary);text-decoration:none">${T.disclaimerLink}</a>
        <button id="ts-disclaimer-close" type="button" aria-label="${T.closeAriaLabel}" title="${T.closeTitle}" style="position:absolute;top:50%;right:8px;transform:translateY(-50%);width:auto;padding:2px 8px;font-size:18px;font-weight:400;line-height:1;background:transparent;color:var(--muted);border:none;border-radius:4px;cursor:pointer">×</button>
      </div>
    `;
    this.innerHTML = skipLinkHTML + headerHTML + langBannerHTML + disclaimerHTML;
    // lang banner: close (localStorage dismissed), CTA (lang-pref 저장), 헤더 토글 (lang-pref 저장)
    const langClose = this.querySelector('#ts-lang-banner-close');
    if (langClose) {
      langClose.addEventListener('click', () => {
        try { localStorage.setItem('taystudio.lang-banner-dismissed', '1'); } catch (_) {}
        this.querySelector('#ts-lang-banner')?.remove();
      });
    }
    const langCta = this.querySelector('#ts-lang-banner-cta');
    if (langCta) {
      langCta.addEventListener('click', () => {
        try { localStorage.setItem('taystudio.lang-pref', LANG === 'ko' ? 'en' : 'ko'); } catch (_) {}
      });
    }
    const langToggle = this.querySelector('.lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        try { localStorage.setItem('taystudio.lang-pref', LANG === 'ko' ? 'en' : 'ko'); } catch (_) {}
      });
    }
    // 테마 토글 — 현재 보이는 색 반대로 즉시 전환. 첫 클릭부터 항상 시각 변화 발생.
    // data-theme attribute 명시값 우선, 없으면 OS prefers-color-scheme 기준.
    const themeToggle = this.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const darkCur = document.documentElement.getAttribute('data-theme') === 'dark' ||
          (!document.documentElement.hasAttribute('data-theme') &&
           window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        const next = darkCur ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('taystudio.theme', next); } catch (_) {}
        // 아이콘·title 갱신 — 다음 클릭 시 도달할 모드 표시.
        const newDark = next === 'dark';
        themeToggle.textContent = newDark ? T.themeLight : T.themeDark;
        const newTitle = newDark ? T.themeTitleToLight : T.themeTitleToDark;
        themeToggle.title = newTitle;
        themeToggle.setAttribute('aria-label', newTitle);
      });
    }
    const closeBtn = this.querySelector('#ts-disclaimer-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const banner = this.querySelector('#ts-disclaimer');
        if (banner) banner.style.display = 'none';
      });
    }
  }
}

// Hero install card 자동 등록 — `[data-install-cta]` 마크업이 home (/, /en/) hero에 있음.
// site-chrome.js는 `<head>` blocking이라 body parsing 전 실행 → DOMContentLoaded 대기.
// 이전: 헤더에 install 버튼 박혀 layout shift (영/한 토글과 함께 자리 변동) → 5/10 hero로 이전.
(function registerHeroInstallButtons() {
  function init() {
    const buttons = document.querySelectorAll('[data-install-cta]');
    if (!buttons.length) return;
    for (const btn of buttons) {
      installButtonRefs.push(btn);
      btn.addEventListener('click', handleInstallClick);
    }
    syncInstallButtons();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// 도구 검색 필터 — hub 페이지의 #toolSearch 발견 시 자동 활성.
// data-keywords + name + desc 매칭. body 파싱 끝난 뒤 실행되도록 DOMContentLoaded 대기.
(function toolSearchFilter() {
  function init() {
    const search = document.getElementById('toolSearch');
    if (!search) return;
    const cards = Array.from(document.querySelectorAll('.tool-grid .tool-card'));
    if (!cards.length) return;
    const wrap = search.closest('.tool-search');
    const clearBtn = wrap && wrap.querySelector('.ts-clear');
    const noResultEl = document.getElementById('toolNoResult');

    function filter() {
      const q = search.value.trim().toLowerCase();
      let visible = 0;
      for (const c of cards) {
        const text = (c.textContent + ' ' + (c.dataset.keywords || '')).toLowerCase();
        const match = !q || text.includes(q);
        c.style.display = match ? '' : 'none';
        if (match) visible++;
      }
      if (wrap) wrap.classList.toggle('has-value', q.length > 0);
      if (noResultEl) noResultEl.hidden = visible > 0 || q.length === 0;
    }

    search.addEventListener('input', filter);
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        search.value = '';
        filter();
        search.focus();
      });
    }
    // "/" 단축키로 포커스 (입력 중인 다른 필드 제외)
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t === search) return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      e.preventDefault();
      search.focus();
    });
    // Esc로 클리어
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && search.value) {
        search.value = '';
        filter();
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const aboutHref = LANG === 'en' ? `${BASE}/en/about/` : `${BASE}/about/`;
    const privacyHref = LANG === 'en' ? `${BASE}/en/privacy/` : `${BASE}/privacy/`;
    const termsHref = LANG === 'en' ? `${BASE}/en/terms/` : `${BASE}/terms/`;
    const sitemapHref = LANG === 'en' ? `${BASE}/en/sitemap/` : `${BASE}/sitemap/`;
    const sitemapLabel = LANG === 'en' ? 'Site Map' : '사이트맵';
    this.innerHTML = `
      <footer style="margin-top:48px;padding:32px 20px;border-top:1px solid var(--border);text-align:center;color:var(--muted)">
        <div style="font-size:13px;margin-bottom:18px">
          <a href="${aboutHref}" style="color:var(--muted);text-decoration:none;margin:0 8px">${T.about}</a>
          ·
          <a href="${privacyHref}" style="color:var(--muted);text-decoration:none;margin:0 8px">${T.privacy}</a>
          ·
          <a href="${termsHref}" style="color:var(--muted);text-decoration:none;margin:0 8px">${T.terms}</a>
          ·
          <a href="${sitemapHref}" style="color:var(--muted);text-decoration:none;margin:0 8px">${sitemapLabel}</a>
        </div>
        <div style="font-size:13px">${T.footerNote}</div>
        <div style="font-size:12px;margin-top:10px;opacity:.7">© 2026 TAYSTUDIO. All Rights Reserved.</div>
      </footer>
    `;
  }
}

customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);

// a11y skip-link 타겟 — 모든 페이지의 첫 <main>에 id="main-content" 자동 부여.
// 60+ 페이지에 일일이 마크업 박을 필요 없이 site-chrome.js 한 곳에서 처리.
// 이미 id 있는 경우(다른 용도) 덮어쓰지 않음 — 빈 경우만 채움.
(function ensureMainId() {
  function apply() {
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();

// 언어 환영 카드 — root·/en/ home hero에 박힌 <aside.lang-welcome-card data-target-lang="...">.
// shouldShowLangBanner()와 같은 조건(브라우저 mismatch + dismiss·lang-pref 미설정)에서 visible.
// banner와 localStorage 키 공유 → 카드 dismiss 또는 CTA 클릭 시 banner도 함께 사라짐 (UX 일관).
function setupLangWelcomeCard() {
  if (!shouldShowLangBanner()) return;
  const targetLang = LANG === 'ko' ? 'en' : 'ko';
  const card = document.querySelector(`.lang-welcome-card[data-target-lang="${targetLang}"]`);
  if (!card) return;
  card.removeAttribute('hidden');
  const cta = card.querySelector('[data-card-cta]');
  if (cta) {
    cta.addEventListener('click', () => {
      try { localStorage.setItem('taystudio.lang-pref', targetLang); } catch (_) {}
    });
  }
  const dismiss = card.querySelector('[data-card-dismiss]');
  if (dismiss) {
    dismiss.addEventListener('click', () => {
      try { localStorage.setItem('taystudio.lang-banner-dismissed', '1'); } catch (_) {}
      card.setAttribute('hidden', '');
      document.querySelector('#ts-lang-banner')?.remove();
    });
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLangWelcomeCard);
} else {
  setupLangWelcomeCard();
}

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
