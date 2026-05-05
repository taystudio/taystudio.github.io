# PWA 통합 A안 — 사이트 전체 루트 manifest + SW (2026-05-05)

## 의도

§9.2 PWA 통합 정책 보류 항목 해제. 기존 = `/tools/`만 PWA. 신규 = 사이트 4 카테고리(`tools` / `text` / `image` / `video`) 60 페이지 통합.

장기 목적 = 사용자가 "홈 화면 추가"·"앱 설치"로 utility 사이트를 앱처럼 사용 + 향후 TWA로 Play Store 등재 가능 (plan §10 비즈니스 트랙).

## 자산 신규

### `/manifest.webmanifest`

```json
{
  "name": "TAYSTUDIO — 자주 쓰는 무료 도구",
  "short_name": "TAYSTUDIO",
  "scope": "/",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f1115",
  "theme_color": "#2563eb",
  "categories": ["finance", "productivity", "utilities", "multimedia", "photo"],
  "icons": [
    /* svg any + 192·512 any + 512 maskable */
  ],
  "shortcuts": [
    /* 연봉·만 나이·이미지 압축·QR 코드 */
  ]
}
```

shortcuts 4개 = 안드로이드 홈 화면 길게 누르면 표시. 한국 수요 1순위 + privacy-first 차별점 도구 위주 선정.

### `/sw.js`

scope `/`, 캐시 정책 `tools/sw.js`와 동일:

- HTML(navigate) = network-first → 실패 시 캐시 → 최후 루트 hub
- JS·CSS = stale-while-revalidate
- 그 외 정적 = cache-first
- 외부 도메인(jsdelivr·esm.sh·광고) = 가로채지 않음 (브라우저 기본)

`STATIC_ASSETS` = 루트 + 4 카테고리 hub + common/css·js + favicon 5종 + manifest. 도구별 페이지 60+ · vendor 자산은 install 시 즉시 캐시 X (자연 캐싱).

`addAll` 대신 개별 `cache.add(url).catch(() => {})` 사용 — 자산 일부 없어도 install 성공 (silent fallback).

`CACHE_VERSION` = `taystudio-v1` (이전 `tayleetools-v14`에서 새로 시작 — activate 시 옛 키 모두 삭제).

### `/favicon-512.png`

PWA manifest icon 권장 사이즈. sips로 favicon-192.png → 512px upscale (18KB).

## HTML 일괄 변경

### `common/site-chrome.js` — SW 등록 IIFE 추가

60+ 페이지 인라인 register 코드를 한 군데로 통합:

```js
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
    } catch (_) {}
  });
})();
```

ALLOWED 가드 = 클론·미러 사이트에서는 SW 등록 안 됨 (도메인 가드 정책 일관).
기존 `tools/sw.js` 등록 자동 unregister = 단계적 마이그레이션.

### tools/ 38개 인라인 SW register `<script>` 일괄 제거

perl multi-line 정규식:

```bash
grep -rl 'serviceWorker.register' --include="*.html" tools/ | xargs perl -i -0pe \
  's{\s*<script>\s*if \(.serviceWorker. in navigator\) \{\s*window\.addEventListener\(.load., \(\) => navigator\.serviceWorker\.register\([^)]*sw\.js[^)]*\)\.catch\(\(\) => \{\}\)\);\s*\}\s*</script>}{}g'
```

quote는 정규식에서 `.`로 매칭(any char) — bash quote escape 회피.

### 60개 HTML head에 `<link rel="manifest" href="/manifest.webmanifest">`

- tools/ 38개 = 기존 `./manifest.webmanifest`·`../manifest.webmanifest` → `/manifest.webmanifest` path 갱신
- 나머지 23개(text/·image/·video/·root·privacy·terms) = apple-touch-icon 다음 줄에 신규 삽입
- 운영자 전용 3개(`tools/404.html`, `history/index.html`, `dash-tay9k3m/index.html`) = 의도적 제외

## 삭제

- `tools/manifest.webmanifest` — 모든 link path 갱신 후 참조 0
- `tools/sw.js` — site-chrome.js의 unregister 로직이 기존 사용자 자동 정리 (파일 삭제와 무관하게 unregister는 navigator API 호출)

## 마이그레이션 안전성

기존 사용자(scope `./tools/`로 SW 등록된 사람) 다음 방문 시:

1. `tools/<도구>/index.html` 진입
2. 기존 SW가 fetch 가로챔 (network-first → 새 HTML 받음 — 인라인 register 제거, manifest link 갱신 반영)
3. site-chrome.js 로드 → 기존 `tools/sw.js` unregister + 새 root `/sw.js` register
4. 다음 방문부터 root SW가 가로챔

새 사용자 또는 다른 카테고리 직접 방문 = site-chrome.js 통해 root SW 즉시 등록.

## 검증 단계 (사용자 후속)

1. **Chrome DevTools → Application 탭**:
   - Manifest = "TAYSTUDIO — 자주 쓰는 무료 도구" 표시, icons 4개 인식, shortcuts 4개 표시
   - Service Workers = `/sw.js` 등록·activated, scope `/`
2. **"앱 설치" 또는 "홈 화면 추가"** 옵션 노출 (Chrome address bar의 install 아이콘)
3. **Lighthouse PWA 점수** = installable + offline 가능
4. **iOS Safari** = Add to Home Screen 후 standalone display 확인
5. **오프라인 동작** = DevTools Offline 모드에서 캐시된 페이지 접근 가능

## TWA 진입 전제 조건 충족

PWA = TWA의 전제. 본 작업으로:
- ✅ valid manifest with icons·name·start_url
- ✅ HTTPS (GitHub Pages)
- ✅ Service Worker active
- ✅ display: standalone
- ✅ scope = "/" (앱 전체 범위)

다음 단계(미진입) = `bubblewrap init --manifest=https://taystudio.github.io/manifest.webmanifest` → AAB 빌드 → `assetlinks.json` 도메인 검증 → Play Console $25 등록 → AAB 업로드. plan §10 비즈니스 트랙.

## 관련 plan 항목

- §9.1 결정 기록
- §9.2 보류 → A안 채택·완료
- §9.4 다음 세션 후보 — Lighthouse·DevTools 검증
- §10 영어 시장·TWA Play Store 비즈니스 트랙
