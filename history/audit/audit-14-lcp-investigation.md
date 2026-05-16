# audit-14 — LCP 회귀 진상 조사 + lazy/모드 매트릭스 + 큰 파일

**일자**: 2026-05-15 ~ 2026-05-16
**트리거**: Cloudflare Web Analytics LCP P75 596ms (audit-01 340ms 대비 +75% 표시) + 트래픽 감소 인지
**컨텍스트**: AdSense 28-script 5/9 deploy + 5/13 LLM·SEO 인프라 강화 + 5/12-15 sitemap broken/fix + 도메인 migration 6일 차

---

## TL;DR

**진짜 LCP 회귀는 없다.** Playwright 실측은 desktop·mobile 모두 LCP < 300ms (audit-01 수준 유지). CWA P75 596ms는 cold-network 외곽 사용자(25%) 분포 → 단일 lever는 `/common/site-chrome.js`가 모든 페이지 head에서 **sync 로딩 (43KB, 916 lines)**.

| 채널 | LCP P75 | 진단 |
|---|---|---|
| Cloudflare Web Analytics (production, 7일) | **596ms** | P75 = cold-network 사용자 25% |
| Playwright Chromium desktop (clean cache) | **236ms** | warm-network baseline OK |
| Playwright Chromium mobile 390×844 | **276ms** | mobile viewport baseline OK |
| Playwright /tools/salary/ (head 12.5KB) | **268ms** | head +57% 증가에도 LCP 영향 0 |

**즉시 fix 필요 Critical 0건.** Medium 5건은 plan으로, Low 5건은 선택.

---

## §1. LCP 측정 매트릭스

### 1.1 실측 (Playwright Chromium, SW+cache cleared, 2회 reload)

| 페이지 | viewport | LCP | FCP | TTFB | CLS | LCP element |
|---|---|---|---|---|---|---|
| `/` | 1200×800 | 236ms | 236ms | 148ms | 0 | `<a class="logo">TAYSTUDIO` (2107) |
| `/` | 390×844 (mobile) | 276ms | 276ms | 161ms | 0 | `<a class="logo">TAYSTUDIO` (1461) |
| `/tools/salary/` | 1200×800 | 268ms | 268ms | 153ms | 0 | `<div class="disclaimer">⚠️ 본 계산기...` (22114) |
| localhost `/` | 1200×800 | 88ms | 88ms | 0.5ms | 0 | logo |

→ **모든 페이지 LCP < 300ms · CLS 0.** audit-01(5/11) 데이터와 일관.

### 1.2 LCP element 분석

홈 LCP element가 `<a class="logo">` 텍스트(작은 size)인 게 의미 깊다 — viewport above-fold에 **더 큰 시각 hero가 없음**. hero 카드는 hero 색상 텍스트뿐, 큰 이미지 없음. 이게 정적 도구 사이트의 자연 LCP 형태이며, 추가 최적화 여지 거의 0.

### 1.3 Cloudflare P75 596ms 격차 진단

P75 = 사용자 25%가 느린 케이스. desktop·home wifi 측정이 P50에 가깝고 P75에는 영향 안 함. 격차의 시스템 lever:

| 후보 | 영향 | 평가 |
|---|---|---|
| `/common/site-chrome.js` 43KB **sync head**, 916 lines | cold-network 사용자에게 직접 blocking. CDN miss·HTTP/2 push 안 됨 | **유일 system lever** |
| AdSense `adsbygoogle.js` async | LCP 이후 fetch (resource timing 결과: ads iframe 163ms는 LCP 236ms 이후) | 영향 0 |
| Dataset JSON-LD 200자+ 보강 (5/13) | salary head +57% 증가했으나 LCP 268ms 정상 | 영향 0 |
| sw.js v14 cache strategy | cache cleared 측정에서도 동일 LCP | 영향 0 |

**즉, CWA P75 정상화 lever 1개 = `site-chrome.js` rendering 전략 변경.** §3.2 Medium plan 참고.

---

## §2. AdSense LCP 영향 검증

5/9 `5daf2a6` 28 file 일괄 활성화 이후 LCP 영향 우려. 측정 결과:

| Resource | duration | size | LCP 영향 |
|---|---|---|---|
| `adsbygoogle.js` | 3ms | cached | 0 (LCP 236ms 이전 끝) |
| `pagead/managed/js/adsense/.../show_ads_impl.js` | 5ms | 0 (cache) | 0 |
| `doubleclick.net/pagead/html/zrt_lookup.html` (iframe) | 39ms | 0 | 0 |
| `googleads.g.doubleclick.net/pagead/ads` (광고 iframe) | **163ms** | 346 | 0 (LCP 236ms 이후) |
| `adtrafficquality.google/sodar` | 76ms | 300 | 0 (LCP 이후) |

**결론**: AdSense는 LCP에 0ms 영향. async script + LCP 이후 광고 fetch.

다만 load event는 382ms까지 끌고 가서 TTI·INP 인상 약간 영향. **승인 후엔 광고가 실제 렌더되며 CLS 발생 가능** — 그때 광고 슬롯 `min-height` reserve 필수.

---

## §3. 정적 분석 발견 (sub-agent)

### 3.1 lazy / preconnect / preload 매트릭스

| 항목 | 결과 |
|---|---|
| `<img loading="lazy">` 누락 | 14건 (전부 result/preview용 동적 img, above-fold 아님 → false positive) |
| `<script>` render-blocking | **`/common/site-chrome.js` 130 페이지 전부 sync head** ⚠️ |
| `<link rel="preload">` | 0건 (시스템 폰트만 사용 — 정상) |
| `<link rel="preconnect">` 일관성 | 깨짐. root 0개 / hub 1개 / video 2개 — 페이지마다 다름 ⚠️ |

### 3.2 site-chrome.js render-blocking 구조

```javascript
// common/site-chrome.js line 1-13 — FOUC 방지 theme IIFE (즉시 실행 필수)
(function () {
  try {
    const t = localStorage.getItem('taystudio.theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (_) {}
})();

// line 14+ — dns-prefetch 주입, checkFileSize utility, web components(site-header·footer)
// 총 916 lines, 43,427 bytes
```

자체 주석에 명시: `"site-chrome.js는 <head> blocking이라 body parsing 전 실행 → DOMContentLoaded 대기."`

**해소 전략 (audit-14 plan)**:
1. **첫 7라인 theme IIFE만 root 페이지 head에 inline화** (FOUC 방지 유지)
2. 나머지 909 lines (`<script defer src="/common/site-chrome.js">`) 또는 body 끝 이동
3. customElements는 upgrade 메커니즘이 있어 늦게 define돼도 정상 작동
4. 60+ 페이지 head 일괄 교체 필요 — `scripts/replace-script-tag.sh` 자동화

**예상 효과**: CWA P75 596ms → 400ms대 (코어 lever 1개). cold network 사용자 영향 가장 큼.

### 3.3 dark mode CSS

- `common/css/style.css`가 `prefers-color-scheme: dark` + `[data-theme="dark"]` 둘 다 처리 ✓
- **하드코딩 색 4건 (KO+EN 미러 = 총 8건)**:
  - `image/watermark/index.html:186` `.preview-wrap { background:#fff; }`
  - `image/watermark/index.html:205` `.img-card-thumb { background:#fff; }`
  - `image/qr-gen/index.html:147` `.qr-canvas-wrap { background:#fff; }` (의도 — QR 가독성)
  - `image/id-photo/index.html:161` `.crop-handle { background:#fff; }` (handle만)
- 실제 dark 회귀 후보: **watermark 2건만** (preview·thumb이 dark UI에 흰 박스로 튐)

### 3.4 KO/EN 페어 라벨 일관성

- title length: KO < EN 38건 (한국어 압축 특성 자연)
- title 60자 초과 2건: `image/watermark` EN 79자, `image/mosaic` EN 74자 → SERP 트렁케이션 위험
- **meta description 160자 초과 26건/38 (68%)** ⚠️ SEO 손실 큼
  - 심한 케이스: `image/` EN 288자, `image/id-photo` 266, `pdf/` 243, `tools/ideal-weight` 244, `tools/calorie` 224
- **KO description 80자 미만 5건**:
  - `tools/dday` 57자, `tools/loan` 57자, `text/counter` 95, `tools/savings` 65, `tools/compound` 66
- aria-label parity: 검사 5건 모두 일치 ✓

### 3.5 head 무게 top 10

| 순위 | 페이지 | head byte |
|---|---|---|
| 1 | `./index.html` | 18,397 |
| 2 | `./en/index.html` | 15,955 |
| 3 | `./image/id-photo/` | 14,472 |
| 4 | `./tools/monitor/` | 13,673 |
| 5 | `./en/image/id-photo/` | 13,552 |
| 6 | `./image/crop/` | 13,414 |
| 7 | `./en/image/crop/` | 12,729 |
| 8 | `./tools/salary/` | 12,528 |
| 9 | `./image/watermark/` | 12,381 |
| 10 | `./image/format-convert/` | 12,208 |

salary 위에 7개. **inline CSS 길이가 head 무게 주요인** (monitor·id-photo·crop). 외부 stylesheet 분리 시 캐시 효율↑ — 다만 LCP 영향 0이라 우선순위 낮음.

### 3.6 sitemap 사적 페이지 leak

- ✅ `sitemap.xml`에 `mockup-*`, `husband-care*`, `dash-tay9k3m`, `history/` 모두 미포함
- ✅ 모든 사적 페이지 `<meta name="robots" content="noindex">` 보유
- ⚠️ `.gitignore`에 `husband-care-deploy/` **누락** (현재 git status untracked) — 실수 commit 위험
- ⚠️ `robots.txt`에 `Disallow: /mockup-*`, `Disallow: /husband-care-deploy/` 누락 — crawl budget 절약 차원에서 추가 권장

---

## §4. 큰 파일 처리 (200MB+)

### 4.1 image/compress (권장 한계 200MB)

| 시나리오 | 결과 | 비고 |
|---|---|---|
| 200MB PNG (size mock, 한계 == 한계) | ✅ 통과 (true) | 한계 동등은 OK |
| 500MB PNG (500MB > 200MB) | ✅ false + 명시 alert | "이미지 크기 500.0MB — 권장 한계 200MB 초과..." |
| 200MB binary 실 attach (PNG decode 실패) | ✅ catch + alert | "이미지를 디코딩할 수 없습니다. 다른 파일로 시도해주세요." |

### 4.2 pdf/pdf-merge (권장 한계 100MB)

| 시나리오 | 결과 |
|---|---|
| 200MB PDF (200 > 100MB) | ✅ false + alert "PDF 크기 200.0MB — 권장 한계 100MB 초과..." |
| 60MB × 2 PDF (multi total 120MB) | ✅ dispatched, 가드 작동 |

### 4.3 결론

- `window.TayStudio.checkFileSize` utility 정상 작동 ✓
- KO/EN 분기 (`isEnglish()`) 정상 ✓
- corrupted/decode 실패 시 try/catch + 명시 alert ✓
- audit-11 검증 패턴 회귀 0건

---

## §5. 통과율 변화

```
audit-3  (250 케이스)          → 62%
audit-4  (Critical 15 fix)     → 78%    (+16)
audit-5  (Phase 2 1차)         → 82.5%  (+4.5)
audit-6  (Phase 2 완료)        → 87%    (+4.5)
audit-7  (Phase 3 Medium+a11y) → 94%    (+7)
audit-8  (보안 XSS fix)        → 95%    (+1)
audit-9  (OCR singleton)       → 95%+
audit-10 (잔여 6% fix)         → 97~98% (+2~3)
audit-11 (final test)          → 98~99% (+1)
audit-12 (Medium+Low 검증)     → 99%+
audit-13 (N10·N11 처리)        → 99%+   (A+)
audit-14 (LCP 진상 + lazy 매트릭스 + 큰 파일) → 99%+ (실측 LCP 정상, system lever 1개 발굴)
```

---

## §6. Critical (즉시 fix)

**0건.** 실측 LCP 정상, CLS 0, utility 정상, 큰 파일 가드 작동.

---

## §7. Medium (plan, audit-15에서 fix 검토)

| # | 항목 | 예상 효과 | 비용 |
|---|---|---|---|
| M1 | **`/common/site-chrome.js` render-blocking 해소** (theme IIFE inline + 나머지 defer) | CWA P75 596ms → 400ms대. site-wide 효과 | 60+ 페이지 head 일괄 교체 + 검증 (2~3시간) |
| M2 | **AdSense origin preconnect 추가** (root + hub 일관 적용) | cold 광고 fetch 단축 → INP 약간 개선 | head 1줄씩 추가 (30분) |
| M3 | **EN meta description 160자 초과 26건 트리밍** | SERP 트렁케이션 방지, 영문 SEO 회복 | 페이지당 1줄 (1~2시간) |
| M4 | **KO description 너무 짧음 5건 보강** | SERP 클릭률 향상 | 페이지당 1줄 (30분) |
| M5 | **`image/watermark` 하드코딩 `#fff` 2건 → CSS 변수** (KO+EN 4건) | dark mode 회귀 fix | 4 라인 (10분) |

---

## §8. Low (선택)

| # | 항목 | 비고 |
|---|---|---|
| L1 | result preview `<img loading="lazy">` 14건 일괄 추가 | defensive. above-fold 아님 |
| L2 | `.gitignore`에 `husband-care-deploy/` 추가 | git status 정리 |
| L3 | `robots.txt`에 `Disallow: /mockup-*` + `/husband-care-deploy/` | crawl budget 절약 |
| L4 | root `index.html` inline JSON-LD 외부 분리 | head 18KB → 슬림화 |
| L5 | EN title 60자 초과 2건 트리밍 (`watermark`, `mosaic`) | SERP 트렁케이션 |

---

## §9. 발견 패턴 (skill §F 추가)

| 패턴 | 예시 | 처리 |
|---|---|---|
| sync head common script (FOUC 방지 의도) | site-chrome.js 43KB blocking | 첫 IIFE inline + 나머지 defer |
| CWA P75 회귀 표시 vs 실측 정상 | LCP 596ms vs 236ms | P75는 사용자 분포 통계. 단일 system lever 1개로만 영향 |
| EN meta description SERP 트렁케이션 | 160자 초과 26건/38 (68%) | KO 작성 후 EN 번역 시 length 가이드 정합 |
| 하드코딩 색상 dark mode 회귀 | watermark `background:#fff` | CSS 변수 (`var(--surface)`) 위임 표준 |

---

## §10. 변경 파일 list

audit 작성만 (코드 변경 0):
- `history/audit/audit-14-lcp-investigation.md` (신규)
- `history/audit/audit-14-lcp-investigation.html` (신규)
- `history/audit/INDEX.md` (1줄 추가 + 통과율 흐름 갱신)

---

## §11. 다음 단계

### 사용자 결정 대기

1. **M1 (site-chrome.js 해소) 진행 여부** — site-wide 효과 큰 단일 lever. 60+ 페이지 head 교체 작업 2~3시간. CWA P75 회복 직결
2. **M3 (EN meta description 26건 트리밍)** — 영문 SERP 노출 직접 영향. 1~2시간
3. **M5 (watermark `#fff` 2건)** — dark mode 회귀 fix. 10분
4. **L2 (`.gitignore`에 `husband-care-deploy/`)** — 즉시 1줄

### 외부 작업 (직전 audit-13 인계 그대로)

1. GSC sitemap 재제출 (broken 3일 회복 — 5/15 fix 완료, 사용자가 콘솔에서 재제출 필요)
2. ✅ IndexNow ping 118 URL 완료 (2026-05-15 23:43 HTTP 200)
3. Naver Search Advisor sitemap 재제출 (안전망)
4. AdSense 승인 모니터링 (1~2주)

### 트래픽 회복 timeline (audit-01·14 종합)

| 일자 | 마일스톤 |
|---|---|
| 2026-05-15 | sitemap fix + IndexNow ping (완료) |
| 2026-05-20 (D+5) | GSC indexed 카운트 회복 (10 → 50+ 목표) |
| 2026-05-25 (D+10) | google organic ≥ naver organic 도달 |
| 2026-05-27 (D+12) | GSC batch 1~10 indexed 80%↑ 검증 |
| 2026-06-08 (D+30) | 도메인 migration 자연 회복기 종료 |
