# 외국인 사용자 구별법 — TAYSTUDIO i18n banner·hero card 메커니즘 (2026-05-10)

> 영어/한국어 사용자를 어떻게 판단하는지, 한계는 무엇인지, 자가 검증·시뮬은 어떻게 하는지 정리. `common/site-chrome.js` lang banner + `index.html`·`en/index.html` hero 환영 카드 동작 본체.

---

## 1. 한 줄 답변

브라우저 JavaScript의 **`navigator.languages[0]`** (브라우저가 노출하는 사용자 우선 언어). 페이지 언어와 mismatch 시 banner·카드 노출.

**판단 코드** (`common/site-chrome.js:13-22`):

```js
const BROWSER_LANG = (() => {
  const langs = navigator.languages || [navigator.language || ''];
  return (langs[0] || '').toLowerCase();
})();

function shouldShowLangBanner() {
  const isEnBrowser = BROWSER_LANG.startsWith('en');  // en, en-US, en-GB, en-AU…
  const isKoBrowser = BROWSER_LANG.startsWith('ko');  // ko, ko-KR…
  const mismatch = (LANG === 'ko' && isEnBrowser) || (LANG === 'en' && isKoBrowser);
  if (!mismatch) return false;
  // localStorage 체크 — 사용자 명시 선택 또는 dismiss 후 영구 비표시
  if (localStorage.getItem('taystudio.lang-pref') === LANG) return false;
  if (localStorage.getItem('taystudio.lang-banner-dismissed') === '1') return false;
  return true;
}
```

---

## 2. `navigator.languages[0]`은 어디서 오나

브라우저가 OS 시스템 언어를 따라감. 결정 chain:

| OS | 위치 | 예 |
|---|---|---|
| **macOS** | System Settings → Language & Region → Preferred Languages **첫 번째** | `ko-KR` |
| **Windows** | Settings → Time & Language → Language → Display language | `en-US` |
| **iOS** | 설정 → 일반 → 언어 및 지역 → iPhone 언어 | `ko-KR` |
| **Android** | Settings → System → Languages → 첫 번째 언어 | `en-GB` |

브라우저가 OS 무시하고 직접 설정 가능:

| 브라우저 | 위치 |
|---|---|
| Chrome | `chrome://settings/languages` → "Order languages by preference" |
| Firefox | `about:preferences` → Languages → "Choose your preferred language" |
| Safari | macOS Language & Region 따라감 (브라우저 별도 설정 X) |
| Edge | `edge://settings/languages` → "Preferred languages" |

서버에는 같은 정보가 **`Accept-Language` HTTP 헤더**로 전송 (예: `Accept-Language: en-US,en;q=0.9,ko-KR;q=0.8`). 정적 사이트(GitHub Pages)는 서버 분기 불가라 클라이언트 JS만 사용.

---

## 3. 사용자별 실제 판단 결과

| 사용자 | navigator.languages[0] | 판단 | root(/) | /en/ |
|---|---|---|---|---|
| 한국 사용자 (macOS 한글) | `ko-KR` | 한국어 | banner X | banner ✅ "한국어로 보기" |
| 미국 사용자 (English macOS) | `en-US` | 외국인 | banner ✅ "View English" | banner X |
| 영국 사용자 | `en-GB` | `startsWith('en')` → 외국인 | banner ✅ | banner X |
| 한국 + Chrome 영어 설정 | `en-US` | ⚠ 외국인 (false positive) | banner ✅ | banner X |
| 일본 사용자 | `ja-JP` | startsWith X → mismatch X | banner X | banner X (영어판이 더 친화적이어도 미노출, 한계) |
| 중국 사용자 | `zh-CN` | 동상 | banner X | banner X |

---

## 4. 한계 (의도된 trade-off)

### 4.1 영어/한국어만 양방향
일본어·중국어 등 다른 언어 사용자에게는 banner 안 노출. 영어판이 더 친화적일 수 있어도 미커버.
**개선 가능**: `(LANG === 'ko' && !isKoBrowser)` 식으로 "한국어 사용자가 아닌 모두에게 영어 banner" 노출 가능. 다만 false positive 증가.

### 4.2 False positive — 한국 + 영어 OS
Chrome을 영어로 설정한 한국 개발자, 영어 OS 쓰는 한국 학생 등은 "외국인"으로 판단되어 영어 banner 노출.
**완화**: dismiss × 한 번 → 다음 방문 안 보임 (`taystudio.lang-banner-dismissed=1`). 또는 CTA·헤더 토글로 한국어 명시 선택 → `taystudio.lang-pref=ko` 저장 → 영구 안 보임.

### 4.3 VPN·GeoIP 무관
IP 위치는 안 봄. 한국 거주 외국인·해외 거주 한국인 모두 OS·브라우저 설정 기준으로만 판단. GeoIP 추가는 외부 API 비용 + VPN 사용자에게 부정확.

### 4.4 SW 캐시 영향
PWA Service Worker(`/sw.js` v14)가 옛 `site-chrome.js`를 cache 중이면 새 banner 코드 미반영. SW 갱신 후 표시.

---

## 5. 시뮬·자가 검증 — 5가지 방법

### 5.1 Chrome DevTools Sensors (가장 빠름) ✅
1. Chrome에서 `taystudios.com/` 또는 `taystudios.com/en/` 열기
2. **F12** → DevTools
3. **Cmd+Shift+P** → "Show Sensors" → 클릭
4. 하단 Sensors 패널 → **Locale** = `en-US` 또는 `ko-KR` 선택
5. **Cmd+Shift+R** (hard reload, SW cache 무시)
6. → mismatch 시나리오 시 banner·카드 노출

### 5.2 시크릿 창 (가장 깨끗 — localStorage 비어있음)
- Chrome 시크릿 창 (Cmd+Shift+N) → `taystudios.com/en/` 진입
- localStorage 비어있어 dismiss·lang-pref 영향 X
- SW도 시크릿 창 별도라 cache 영향 X (단 시크릿에서 SW 등록 안 됨, 정상)

### 5.3 DevTools Console로 현재 상태 확인
```js
// 브라우저가 노출하는 우선 언어
navigator.languages
// → ["ko-KR", "en-US", "ko"] 같은 배열

// 사용자가 이전에 명시 선택했는지
localStorage.getItem('taystudio.lang-pref')
// → "ko" 또는 "en" 또는 null

// dismiss 했는지
localStorage.getItem('taystudio.lang-banner-dismissed')
// → "1" 또는 null

// banner 강제 표시 — localStorage 초기화
localStorage.removeItem('taystudio.lang-pref')
localStorage.removeItem('taystudio.lang-banner-dismissed')
location.reload()
```

### 5.4 Service Worker 영향 격리
- DevTools → Application → Service Workers → **Unregister** 클릭
- DevTools → Application → Storage → **Clear site data** 클릭
- Hard reload (Cmd+Shift+R)
- → 옛 SW cache 완전 제거, 새 코드 강제 로드

### 5.5 playwright 자동 시뮬 (개발자용)
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        locale="en-US",                                          # navigator.language[s]
        extra_http_headers={"Accept-Language": "en-US,en;q=0.9"} # 서버 헤더
    )
    page = ctx.new_page()
    page.goto("https://taystudios.com/")
    page.screenshot(path="/tmp/foreign-user-view.png")
```

5/10 검증 시 4 시나리오 (KO+EN browser / EN+KO browser / KO+KO / EN+EN) 모두 의도대로 동작 확인됨. 자세한 결과 = `history/index_en.html` 5/10 article 참고.

---

## 6. dismiss·lang-pref localStorage 키

| 키 | 값 | 설정 시점 | 효과 |
|---|---|---|---|
| `taystudio.lang-pref` | `'ko'` 또는 `'en'` | CTA 클릭 (banner·카드 둘 다) / 헤더 lang-toggle 클릭 | 사용자 명시 선택. 그 언어 페이지에서는 banner·카드 영구 안 보임 |
| `taystudio.lang-banner-dismissed` | `'1'` | × dismiss 버튼 (banner 또는 카드) | 모든 페이지에서 banner·카드 영구 안 보임 |

→ dismiss 한 번에 banner + hero 카드 둘 다 사라짐 (UX 일관). 사용자가 다시 보고 싶으면 DevTools Console에서 `localStorage.removeItem(...)` 실행 후 reload.

---

## 7. 진단 — "안 보이는데?" 자가 체크리스트

영어 브라우저로 root 접속했는데 banner·카드 안 보이는 경우:

1. **시크릿 창**에서 다시 접속 → 보이면 = localStorage 또는 SW 캐시 문제
2. DevTools Console에 `navigator.languages` 입력 → 첫 값이 `en*` 또는 `ko*`인지 확인. 다른 언어면 (한계 4.1 참고) 의도대로 안 노출
3. `localStorage.getItem('taystudio.lang-pref')` → `'ko'`(혹은 `'en'`)면 사용자가 이미 명시 선택한 상태. `removeItem` 후 reload
4. `localStorage.getItem('taystudio.lang-banner-dismissed')` → `'1'`이면 dismiss 한 적 있음. `removeItem` 후 reload
5. SW 캐시 → DevTools Application → Service Workers → Update / Unregister → reload
6. Hard reload (Cmd+Shift+R) — 일반 reload는 SW cache 우회 X

---

## 8. 관련 파일

- `common/site-chrome.js:13-22` — `BROWSER_LANG` 상수 + `shouldShowLangBanner()`
- `common/site-chrome.js:355-414` — `SiteHeader.connectedCallback` banner markup + 3 event handler (close/CTA/toggle)
- `common/site-chrome.js:436-466` — `setupLangWelcomeCard()` hero 카드 visibility 제어
- `common/css/style.css:.site-nav .lang-toggle` — 헤더 토글 글로브+box 강조
- `common/css/style.css:.lang-welcome-card` — hero 카드 스타일
- `index.html:hub-hero` — 영어 환영 카드 markup
- `en/index.html:hub-hero` — 한국어 환영 카드 markup

상세 진행 기록 = `history/plan/plan_en.md` §9.9 (banner) + §9.10 (hero 카드).
