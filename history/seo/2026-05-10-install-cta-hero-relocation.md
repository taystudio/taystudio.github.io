# PWA install 버튼 — header → home hero 이전 + pill CTA 재디자인 (2026-05-10)

> 헤더 install 버튼이 영/한 토글과 함께 layout shift 일으키는 문제 → 홈 hero("쓸모 있는 것들" 태그라인 아래)로 이전. 동시에 button visual을 pill-shape brand CTA로 재설계.
>
> 후속 = `history/seo/2026-05-05-pwa-icon-and-install-btn.md` (헤더 install 1차 도입)·`history/seo/2026-05-05-pwa-integration.md` (PWA 통합 A안).

---

## 1. 왜 옮겼나

`5-09 ~ 5-10` 작업 = 헤더 우측에 영/한 글로브 토글 신규 + install 버튼 기존. 토글 노출 조건은 페이지 lang ≠ 브라우저 lang일 때만 → 같은 헤더 polygon 안에서 element 개수가 1↔2로 달라져 우측 정렬 layout shift 발생.

대안:
- **A**: install 버튼 헤더 유지 + 토글을 다른 위치로 → 토글이 메인 i18n discovery channel이라 visibility 우선
- **B**: install 버튼 헤더에서 제거 + 홈 hero에 큰 카드로 이전 ✓ 채택

**선택 이유**:
1. install은 중복 진입 가능 (lang banner CTA, manifest auto-prompt, footer "✓ 설치됨" 표시 등) → 헤더 1면 양보 가능
2. 홈 hero는 첫 진입자가 "이 사이트가 무엇인가" 파악하는 위치 → install card가 "앱처럼 쓸 수 있다"는 가치 제안 강화
3. 도구 페이지(`/tools/*` 등)에서는 install 버튼 사라져 헤더 깔끔. 도구 사용자는 이미 사이트 가치를 인지한 상태라 install discovery 압력 ↓

## 2. 새 디자인

### 마크업 (`index.html:424-434`, `en/index.html:403-413`)

```html
<div class="hero-install" hidden role="region" aria-label="앱 설치">
  <button type="button" class="install-cta" data-install-cta hidden
          title="브라우저에서 바로 설치 — 홈 화면·작업표시줄에 앱처럼 추가됩니다">
    <span class="install-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <rect width="24" height="24" rx="5" fill="#fff"/>
        <text x="12" y="17.5" font-size="15" text-anchor="middle"
              fill="#7c3aed" font-family="-apple-system, ..." font-weight="800">T</text>
      </svg>
    </span>
    <span class="install-label">웹앱 설치</span>
    <span class="install-action" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
           stroke="currentColor" stroke-width="2.4" ...>
        <path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/>
      </svg>
    </span>
  </button>
</div>
```

레이아웃 = `[T 로고] [라벨] [⬇]`
- **좌**: Taystudio brand mark (흰 배경 + 보라 T) — favicon 톤 매칭
- **중**: 라벨 (`웹앱 설치` / `Install Web App`)
- **우**: 다운로드 화살표 — affordance ("클릭하면 받는다") 신호

`hidden` 속성 = 미지원 환경(Firefox 모바일·미설치 + eligible 캐시 X 등)에서 숨김. `data-install-cta`는 `site-chrome.js` 자동 등록 셀렉터.

### CSS (`common/css/style.css:1437-1530`)

```css
.install-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;                        /* ← 글로벌 button { width: 100% } 무력화 */
  gap: 8px;
  padding: 8px 14px 8px 12px;        /* 우측 살짝 더 = 화살표 호흡 */
  font-size: 13px; font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border-radius: 999px;              /* pill */
  box-shadow: 0 3px 12px rgba(124, 58, 237, 0.26);
}
.install-cta:hover .install-action {
  transform: translateY(1px);        /* 호버 시 ⬇ 살짝 내려가는 micro-affordance */
}
```

브랜드 색 = `#7c3aed` (manifest theme_color·pwa-icon.svg와 동일 보라).

## 3. 핵심 디버그: 글로벌 `button { width: 100% }` 함정

작업 도중 padding·font 다 줄였는데도 가로 길이 줄지 않는 현상 발생. 원인 = `style.css:401`에 사이트 전체 `button { width: 100%; ... }` 규칙. `.install-cta`는 `display: inline-flex`라 길이가 콘텐츠에 맞춰져야 하는데, `width: 100%`가 부모 flex container(`.hero-install`)를 꽉 채워버림.

**해결** = `.install-cta` 룰에 `width: auto` 명시 (specificity 같은 클래스 셀렉터로 글로벌 element 셀렉터 override).

> 교훈: 글로벌 `button` 규칙은 form 도구 페이지에 맞춘 레거시. 새 brand button 추가 시 `width: auto` 항상 명시. 미래에 `button` 글로벌 룰을 `.tool-button` 같은 명시 클래스로 좁히는 게 본질적 fix.

## 4. site-chrome.js 변경

### 4-a. `T.installPrompt` 라벨 (`common/site-chrome.js:23, 68`)

이전: `웹앱 설치` / `Install Web App` (헤더 좁은 공간 고려해 짧게 잡았던 라벨 그대로 유지) — hero 큰 공간이라 짧을 필요 없음.

> 작업 중 `설치` / `Install`까지 줄였다가 다시 복원. 이유 = "웹앱"이 핵심 단서 (브라우저 → 앱처럼) → 한 단어로 줄이면 의미 손실.

### 4-b. 등록 메커니즘 (`common/site-chrome.js:457-475`)

`registerHeroInstallButtons()` IIFE — `[data-install-cta]` 셀렉터로 hero 카드 button 자동 등록. site-chrome.js는 `<head>` blocking이라 DOMContentLoaded 대기.

```js
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
  } else { init(); }
})();
```

기존 `installButtonRefs` 풀과 통합 → `syncInstallButtons()` 로직(설치 완료/in-app 브라우저/미지원 환경 분기) 그대로 재사용.

### 4-c. container 가시성 (`common/site-chrome.js:269-271`)

```js
for (const container of document.querySelectorAll('.hero-install')) {
  container.hidden = !container.querySelector('.install-cta:not([hidden])');
}
```

button 자체가 `hidden`인 상황에서 container까지 숨겨야 hero에 빈 margin gap이 안 남음.

## 5. 환경 분기 (변동 없음 — 헤더에서 hero로 위치만 이전)

| 환경 | 노출 | 클릭 시 |
|---|---|---|
| Chrome·Edge desktop | beforeinstallprompt 받은 후 | native install prompt |
| Android Chrome·삼성 인터넷 | 받은 후 | native prompt |
| iOS Safari (browser mode) | 항상 | 안내 모달 (공유 → 홈 화면 추가) |
| in-app 브라우저 (KAKAO·Line·FB·NAVER inapp 등) | 항상 (`외부 열기` 라벨) | 외부 브라우저 열기 모달 |
| standalone (이미 설치) | hero card는 `✓ 설치됨` 비활성 표시 | — |
| 미지원 (Firefox 모바일 등 + 이전 eligible 캐시 X) | 숨김 | — |

`wasInstallEligible()` localStorage 캐시 = 한 번이라도 다른 페이지에서 `beforeinstallprompt` 받으면 `ts-pwa-eligible=1` 저장 → home 첫 진입자도 다음부터 노출. 처음 root 진입자(다른 페이지 미경유)는 **install card 안 보임** = 알려진 caveat.

## 6. SW 캐시

`sw.js:14` `CACHE_VERSION` `v15` → `v17` (작업 중 v18까지 갔다가 사용자 요청으로 v16 다운, 최종 v17).

```js
const CACHE_VERSION = 'taystudio-v17';
```

이전 캐시(v15) 자동 정리 (`sw.js:51` `keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))`).

## 7. 변경 파일

| 파일 | 변경 |
|---|---|
| `index.html` | `<div class="hero-install">` 카드 추가 (`hub-tagline` 아래) |
| `en/index.html` | EN 버전 동일 카드 |
| `common/css/style.css` | `.hero-install`·`.install-cta`·`.install-icon`·`.install-label`·`.install-action` 룰셋 + 모바일 break + 다크모드 |
| `common/site-chrome.js` | `T.installPrompt` 라벨 변경, `registerHeroInstallButtons` IIFE, container hidden sync |
| `sw.js` | CACHE_VERSION v15 → v17 |

도구 페이지 헤더에서 install 버튼 사라진 것 = `site-chrome.js`의 `SiteHeader` 템플릿에서 install 버튼 마크업 제거(이전 작업 turn). 헤더 button DOM이 더 이상 없으므로 추가 정리 불요.

## 8. 검증 (2026-05-10 — localhost:8000)

- ✅ `/` (KO) hero에 보라 pill CTA 노출 — `[T] 웹앱 설치 [⬇]` 레이아웃
- ✅ `/en/` (EN) — `[T] Install Web App [⬇]`
- ✅ `/tools/loan/` 등 도구 페이지 헤더 깔끔 (install 버튼 X, 영/한 토글 only)
- ✅ 다크모드 토글 시 그라디언트 톤 유지 (`@media (prefers-color-scheme: dark)` 룰)
- ✅ width: auto 동작 — pill이 콘텐츠 폭만큼만 차지

## 9. 알려진 caveat / 향후 개선

1. **첫 root 진입자 + eligible 캐시 X = 카드 미노출** — 처음 한 번은 다른 페이지(예: `/tools/`) 방문해야 캐시되고, 그 후부터 home에 노출. 개선 = 처음 방문자도 보이게 하려면 home 진입 시 silent `beforeinstallprompt` listen 후 일정 시간 대기 → 도착하면 노출하는 패턴 가능. 다만 layout shift 위험 ↑.
2. **글로벌 `button { width: 100% }`** — 새 브랜드 button 추가 시마다 `width: auto` 명시해야 함. 본질적 fix = 글로벌 룰을 `form .tool-input button` 같은 좁은 셀렉터로 한정. 별도 작업.
3. **iOS = beforeinstallprompt 미지원** — `isIOS()` 분기로 카드는 노출하되 클릭 시 안내 모달. 안드로이드·데스크톱 대비 conversion 약함. iOS 전용 안내 카피 강화 여지.
