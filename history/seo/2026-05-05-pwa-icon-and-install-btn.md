# PWA install 버튼 + 아이콘 자산 분리 + TayTools 이름 (2026-05-05)

> PWA 통합 A안 완료(`history/seo/2026-05-05-pwa-integration.md`)의 **후속 UX 보강**. install 동선 명시 + PWA·native 시각 구분 + 직관적 앱 라벨.

## 1. install 버튼 — 사용자 명시 채널

### 흐름

`common/site-chrome.js` 최상단 IIFE:

```js
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
```

site-header 우측 nav에 button 삽입:

```html
<button type="button" id="ts-install-btn" class="install-btn" hidden
        title="브라우저에서 바로 설치 — 홈 화면·작업표시줄에 앱처럼 추가됩니다">웹앱 설치</button>
```

connectedCallback에서 ref 등록 + click 핸들러 + sync. `handleInstallClick`:
- deferredPrompt 있으면 `prompt()` 호출 → 사용자 응답
- iOS Safari = `showIosInstallModal()` (공유 → 홈 화면 추가 안내)

### 환경 분기

| 환경 | 버튼 노출 | 클릭 시 |
|---|---|---|
| Chrome·Edge desktop | beforeinstallprompt 받은 후 | native install prompt |
| Android Chrome·삼성 인터넷 | 받은 후 | native prompt |
| iOS Safari (browser mode) | 항상 | 안내 모달 |
| standalone (이미 설치) | 숨김 | — |
| 미지원 (Firefox 모바일 등) | 숨김 | — |

## 2. 자산 분리 — favicon vs pwa-icon vs native

사용자 의도 = 본인이 봤을 때 PWA·native 헷갈리지 않게.

| 자산 prefix | 용도 |
|---|---|
| `favicon-*` | 브라우저 탭·북마크 (HTML head link) |
| `pwa-icon-*` | PWA 전용 (manifest icons + shortcuts) |
| (향후) `app-icon-*` 또는 `native/` | iOS App Store / Android Play Store native 자산 |

`favicon-512.png` 삭제 (사용처 없음). `pwa-icon.svg`·`pwa-icon-192.png`·`pwa-icon-512.png` 신규.

## 3. PWA 디자인 — 보라 + 큰 WEB 라벨

### 1차 시도 — indigo + 작은 WEB (실패)

색 = `#4f46e5` (indigo, favicon `#2563eb`와 미세 차이) + WEB 라벨 11px / 100viewbox.

**문제** = Chrome install prompt 아이콘 ~80px → WEB 라벨 실제 ~9px = 사용자 눈에 거의 안 보임. 색도 비슷한 파랑이라 favicon과 구분 약함.

### 2차 — 보라 + 15px WEB (확정)

```svg
<svg viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#7c3aed"/>
  <text x="50" y="58" font-size="46" text-anchor="middle" fill="white" font-weight="700">T</text>
  <text x="50" y="88" font-size="15" letter-spacing="2" font-weight="800"
        text-anchor="middle" fill="white">WEB</text>
</svg>
```

- 색 `#7c3aed` (purple) — favicon blue와 한눈에 구분
- WEB 라벨 15px → 80px 사이즈에서 ~12px = 명확히 읽힘
- T 글자 54→46으로 약간 줄여 균형
- letter-spacing 2 + font-weight 800 = 가독성 ↑

### PNG 변환

`brew install librsvg` 후:

```bash
rsvg-convert -w 192 -h 192 pwa-icon.svg -o pwa-icon-192.png  # 3.9KB
rsvg-convert -w 512 -h 512 pwa-icon.svg -o pwa-icon-512.png  # 10.6KB
```

향후 SVG 갱신 시 같은 명령 재사용 가능.

## 4. 사이트 색 컨벤션 정착

| 영역 | 색 | 사용처 |
|---|---|---|
| favicon | `#2563eb` (blue) | 브라우저 탭, HTML link rel=icon |
| **PWA** | `#7c3aed` (purple) + "WEB" 라벨 | manifest theme_color, install prompt, 홈 화면 아이콘, "웹앱 설치" 버튼 |
| **(향후) native** | `#01875F` (Play green) | Play 스토어 버튼 `.play-btn` |

## 5. TayTools — 직관적 앱 이름

`manifest.webmanifest`:

```json
{
  "name": "TayTools — 자주 쓰는 무료 도구",
  "short_name": "TayTools"
}
```

- 이전 `short_name` = "TAYSTUDIO" (회사명·8자) → 사용자 홈 화면에서 용도 불명확
- `TayTools` = 운영자명 + 용도(Tools) 결합. 한국 사용자도 "tools" 인식 OK
- **메인 브랜드는 "TAYSTUDIO" 그대로 유지** (도메인·헤더 로고·footer ARR). 회사명 vs 앱명 분리 패턴 (트위터·페북 등 대부분 동일)
- `theme_color` `#4f46e5` → `#7c3aed`로 동기화

## 6. install 버튼 CSS 컨벤션

`common/css/style.css`에 `.install-btn` + 코멘트로 native 컨벤션 명시:

```css
/* PWA "웹앱 설치" 버튼 — 보라(#7c3aed)로 favicon blue·향후 native green과 강한 시각 구분.
   manifest theme_color·pwa-icon.svg와 동일 색.
   향후 native 안드로이드 앱 다운 버튼은 Play green(#01875F)으로 별도 색·텍스트(예: ".play-btn"). */
.site-nav .install-btn {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #7c3aed;
  border: none;
  padding: 6px 12px;
  margin-left: 6px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background .15s, transform .1s;
}
.site-nav .install-btn:hover { background: #6d28d9; }
.site-nav .install-btn[hidden] { display: none; }
```

모바일 480px·360px 반응형 미디어 쿼리 같이.

## 7. 검증 단계 (사용자)

1. **Chrome DevTools → Application → Manifest** = "TayTools" + 보라 + WEB 미리보기
2. **Application → Storage → "Clear site data"** = 옛 manifest·icon 캐시 강제 갱신
3. 페이지 hard reload → install prompt에서 새 디자인·이름 확인
4. **Application → Service Workers** = `/sw.js` activated, scope `/`
5. 모바일 폰에서 "홈 화면 추가" → 라벨 = "**TayTools**", 아이콘 = 보라+WEB
6. **Lighthouse → PWA 카테고리** 점수 90+
7. iOS Safari 공유 → 홈 화면 추가 동작 확인

## 8. 향후 native 진입 시 (Play Store 등재 후)

site-header nav에 한 줄 추가:

```html
<a href="https://play.google.com/store/apps/details?id=com.taystudio.taytools"
   class="play-btn" target="_blank" rel="noopener">Play 스토어</a>
```

CSS:

```css
.site-nav .play-btn {
  /* .install-btn과 동일 베이스 */
  background: #01875F;  /* Play green */
}
.site-nav .play-btn:hover { background: #016e4d; }
```

→ 사용자 nav에서 **보라 "웹앱 설치"** vs **green "Play 스토어"** 한눈에 구분.

## 9. UX 마감 보강 (2026-05-05 same-day 후속)

배포 후 사용자 피드백 기반 3개 보강.

### 9.1 자동 숨김 → 비활성 토글

사용자 의견: "한 번 더 클릭하면 dismiss할 수 있게" → 더 단순화 결론 = **"비활성/활성"만**.

```js
function syncInstallButtons() {
  const installed = isInstalled();
  ...
  btn.disabled = installed;
  btn.textContent = installed ? '✓ 설치됨' : '웹앱 설치';
}

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  try { localStorage.setItem('ts-installed', '1'); } catch (_) {}
  syncInstallButtons();
});
```

`isInstalled()` = `isStandalone() || localStorage('ts-installed') === '1'`. 새로고침 후에도 비활성 유지.

CSS:
```css
.site-nav .install-btn:disabled {
  background: var(--muted);
  cursor: not-allowed;
  opacity: 0.85;
}
```

**한계** = 사용자가 OS에서 PWA 직접 삭제 시 감지 X = 영원히 비활성. 향후 "다시 활성화" 옵션 검토.

### 9.2 카카오·라인·페북 등 in-app 회수

카톡 공유 트래픽 큰 한국 시장 특성 → in-app 사용자도 install 채널로 회수.

UA 감지:
```js
function isInAppBrowser() {
  return /KAKAOTALK|Line\/|FBAN|FBAV|Instagram|NAVER\(inapp/i.test(navigator.userAgent);
}
```

5개 in-app 동시 처리 (카톡 + 라인 + 페북 앱 + 인스타 + 네이버 앱).

`syncInstallButtons` 분기:
```js
if (inApp && !installed) {
  btn.textContent = '외부 열기';
  btn.disabled = false;
}
```

`handleInstallClick` 분기 → `showInAppRedirectModal`:
- 안내 = "우측 상단 메뉴 → 외부 브라우저로 열기" + 방법 1·2·3 ol
- **Android만** = "Chrome으로 열기 (시도)" 버튼:
  ```js
  const path = location.href.replace(/^https?:\/\//, '');
  location.href = `intent://${path}#Intent;scheme=https;package=com.android.chrome;end`;
  ```
  Chrome 미설치면 fallback 동작 X — 사용자가 메뉴 안내로 우회
- **iOS** = Apple 정책상 Chrome 강제 X (URL scheme 차단). 메뉴 안내만

### 9.3 모바일 헤더 컴팩트

nav 5항목(계산기·텍스트·이미지·동영상·웹앱 설치) → 안드로이드 모바일에서 따닥따닥. 미디어 쿼리 강화:

```css
@media (max-width: 480px) {
  .site-header { padding: 12px 12px; gap: 6px; }
  .site-header .logo { font-size: 15px; }
  .site-nav { gap: 1px; }
  .site-nav .nav-link { font-size: 12px; padding: 5px 6px; }
  .site-nav .install-btn { font-size: 11px; padding: 4px 7px; margin-left: 3px; }
}
@media (max-width: 360px) {
  .site-header { padding: 10px 8px; gap: 4px; }
  .site-header .logo { font-size: 14px; }
  .site-nav { gap: 0; }
  .site-nav .nav-link { font-size: 11px; padding: 4px 5px; }
  .site-nav .install-btn { font-size: 10.5px; padding: 4px 6px; margin-left: 2px; }
}
```

이전 = `gap: 2px` + 13px 폰트라 5항목이 좁은 화면에 안 맞았음. gap·padding 줄이고 폰트 1~2pt 내림.

### 9.4 검증 시나리오

| 시나리오 | 기대 동작 |
|---|---|
| 카톡으로 링크 → in-app 진입 | "외부 열기" 보라 활성 → 클릭 시 모달 + Chrome intent (Android) |
| iOS Safari 일반 | "웹앱 설치" 활성 → 클릭 시 "공유 → 홈 화면" 안내 모달 |
| Android Chrome install | native prompt → 설치 후 회색 비활성 "✓ 설치됨" |
| 새로고침 후 재방문 | localStorage 유지 = 비활성 그대로 |
| iPhone 360px viewport | nav 5항목 컴팩트 (overflow X) |

## 관련 plan 항목

- §9.1 결정 기록 (PWA UX 마감 + install 버튼 + 아이콘 자산 분리)
- §9.4 다음 세션 — Lighthouse PWA 검증 + native 진입 시 .play-btn 추가 + 카카오 디버거 OG flush
- §10 비즈니스 트랙 — TWA Bubblewrap 또는 Kotlin native 진입 시점 결정
