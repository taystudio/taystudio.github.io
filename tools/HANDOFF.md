# 인계 문서 — 다른 Claude 세션에게

**작성일**: 2026-05-02
**원본 위치**: `Archive/tools/` → 옮긴 위치: **taystudio 레포** (이름은 사용자 확인 필요)
**언어**: 사용자는 한국어 우선 (영어 기술용어 OK)

---

## 0. TL;DR (먼저 이거만 읽어도 됨)

이 디렉토리는 **한국 시장용 utility 계산기 30개를 묶은 정적 사이트**입니다. **AdSense + 쿠팡 파트너스 수익화 목적**. 백엔드 없음, 순수 HTML/CSS/JS. 사용자(TayLee)가 티스토리 블로그에서 자체 사이트로 이전 중인 수익화 프로젝트의 일부입니다.

**가장 중요한 즉시 작업** = **URL 경로 일괄 갱신**. 모든 파일이 `https://taehyuklee.github.io/Archive/tools/` 기준으로 하드코딩돼 있어서, 새 도메인/경로로 옮기면 다 바꿔줘야 합니다 (canonical URL, sitemap, JSON-LD, og:url 등). 마지막 섹션의 일괄 갱신 스크립트 참고.

---

## 1. 사용자 프로필 (Claude를 사용하는 사람 = TayLee)

- **이메일**: thlee991@gmail.com (privacy·terms 페이지에 명시됨)
- **GitHub**: taehyuklee
- **배경**: Go 십년 차 백엔드 개발자, 프론트는 학습 중
- **티스토리 블로그**: taehyuklee.tistory.com (이전 운영)
- **메인 동기**: 구글 애드센스 광고 수익. 현실적 단계별 수익화 설계 선호
- **운영 사이트들** (생각 정리 차원):
  - `Archive/blog/` — 와이프의 육아 블로그 (Next.js, AdSense 메인 타겟)
  - `Archive/tools/` — 본 프로젝트 (30개 계산기)
  - `Archive/portfolio/` — 본인 포트폴리오
- **소통 선호**: 직설적 + 핵심 우선 + 트레이드오프 명시. 환상 심어주는 답변 싫어함. 모든 답변 한국어 OK.

---

## 2. 이 프로젝트가 뭐냐

**TAYLEE Tools — 실생활 계산기 30선**. 한국에서 자주 검색되는 세금·금융·근로·육아·건강 계산기를 한곳에 묶은 정적 사이트. 각 계산기는:

- 100% 클라이언트 사이드 JS (서버 없음, 사용자 입력값 외부 전송 안 함)
- 출처·법령 근거 명시 (E-A-T 평가 + AdSense 승인 친화)
- AdSense·쿠팡 광고 자리 placeholder 깔려 있음

**현재 상태**: 코드 완성 + 로컬 테스트 완료. **아직 어디에도 배포 안 됨.** AdSense·쿠팡도 아직 신청 전.

**수익화 메모는 별도 파일**: `MONETIZATION.md` (광고 통합 전 절차 매뉴얼)
**운영 매뉴얼은 별도 파일**: `README.md` (도구 목록·갱신 체크리스트)

---

## 3. 파일 구조

```
tools/
├── README.md                    ← 운영 매뉴얼 (이거 다음에 보세요)
├── MONETIZATION.md              ← AdSense·쿠팡 통합 가이드
├── HANDOFF.md                   ← 이 문서
├── index.html                   ← 허브 (검색·추천·시즌·카테고리)
├── 404.html
├── favicon.svg
├── manifest.webmanifest         ← PWA
├── sw.js                        ← Service Worker (캐싱 전략 포함)
├── sitemap.xml
├── css/
│   └── style.css                ← 공통 스타일 (다크모드·반응형)
├── privacy/index.html           ← 개인정보처리방침 (AdSense 필수)
├── terms/index.html             ← 이용약관 (AdSense 필수)
└── [30개 도구 디렉토리]
    각각: index.html + <slug>.js
```

**도구 카테고리:**

| 카테고리 | 슬러그 |
|---|---|
| 부동산 (4) | brokerage, property-tax, comp-property, capgain |
| 금융·세금 (9) | salary, year-end, comprehensive, vat, inheritance, insurance, loan, savings, compound |
| 근로·고용 (6) | hourly, weekly-pay, annual-leave, severance, unemployment, parental-leave |
| 임신·육아 (5) | pregnancy, ovulation, baby-formula, baby-clothes, growth |
| 자동차 (2) | cartax, cartax-yearly |
| 건강 (2) | bmi, calorie |
| 생활 (2) | age, dday |

---

## 4. ⚠️ 즉시 갱신해야 할 것 — URL 경로

**모든 파일에 다음 URL이 하드코딩돼 있음:**

```
https://taehyuklee.github.io/Archive/tools/
```

이 URL은 `Archive` 레포에 있을 때 기준. **taystudio로 옮기면 다 바꿔야 함.**

### 영향받는 위치

| 파일 | 어디에 |
|---|---|
| `index.html` (허브) | canonical, og:url, JSON-LD `url` 필드들, breadcrumb |
| 30개 `*/index.html` | canonical, og:url, JSON-LD `url` |
| `privacy/index.html` | canonical |
| `terms/index.html` | canonical |
| `sitemap.xml` | 모든 `<loc>` |
| `robots.txt` (레포 루트) | Sitemap 라인 |
| `README.md` | 예시 URL들 |
| `MONETIZATION.md` | 예시 URL들 |

### 일괄 갱신 스크립트 (가장 우선 작업)

새 베이스 URL 정해지면 (예: `https://tay.studio/tools/`) 다음 명령으로 일괄 교체:

```bash
# tools/ 디렉토리에서 실행
OLD="https://taehyuklee.github.io/Archive/tools"
NEW="https://NEW-DOMAIN.com/tools"  # ← 실제 새 URL로 교체

# HTML/JSON/XML/MD 모두 일괄 교체
find . -type f \( -name "*.html" -o -name "*.xml" -o -name "*.md" -o -name "*.webmanifest" \) -exec sed -i '' "s|$OLD|$NEW|g" {} \;

# robots.txt는 레포 루트에 있을 수 있음 — 별도 처리
sed -i '' "s|$OLD|$NEW|g" /path/to/robots.txt
```

(macOS는 `sed -i ''`, Linux는 `sed -i`)

### 그 외 영향받는 것

- **메인 nav 링크**: 모든 도구 페이지 헤더에 `<a href="../../index.html" class="logo">TAYLEE</a>` 있음. taystudio가 단독 레포면 이 링크 깨짐 → 새 홈으로 변경 필요
- **Service Worker 스코프**: `sw.js`의 등록 경로 (`'../sw.js'` 등) 새 구조에 맞게 조정
- **PWA `start_url`, `scope`**: `manifest.webmanifest`의 `"./"` 그대로 두면 됨 (상대경로)
- **favicon, manifest 링크**: 상대경로 (`../favicon.svg`)라 디렉토리 깊이 안 바뀌면 OK

---

## 5. 코드 컨벤션 — 절대 깨지 말 것

### HTML 페이지 구조 (모든 도구 동일)

```html
<head>
  <meta charset/viewport/theme-color/color-scheme/...>
  <link rel="icon" href="../favicon.svg">
  <link rel="preconnect" href="https://pagead2.googlesyndication.com">
  <meta property="og:..."> <!-- Open Graph -->
  <meta name="twitter:..."> <!-- Twitter card -->
  <title>... 2026 | ...</title>  <!-- 연도 포함, " | "로 구분 -->
  <meta name="description"> <meta name="keywords">
  <link rel="canonical" href="...">
  <link rel="manifest" href="../manifest.webmanifest">
  <script>navigator.serviceWorker.register('../sw.js')...</script>
  <script type="application/ld+json"> ... </script>  <!-- @graph 형태 -->
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <header class="site-header">...</header>
  <main class="container">
    <div class="breadcrumb">도구 · 카테고리 · 도구이름</div>
    <h1>도구 이름 <span class="basis-badge">기준 연도</span></h1>
    <p class="subtitle">한 줄 설명</p>

    <form id="form" class="card">...</form>

    <div class="ad-slot">[ AdSense 광고 자리 ]</div>  <!-- 그대로 둘 것 -->

    <div id="result" class="result" style="display:none">...</div>

    <div class="disclaimer">⚠️ 면책 문구</div>

    <section class="sources">
      <h2>적용된 법령·고시 및 출처</h2>
      <div class="updated">최종 검증: YYYY-MM-DD / 적용 기준: ...</div>
      <ul>...</ul>
      <div class="note">⚠️ 갱신 모니터링 안내</div>
    </section>

    <nav class="related-nav">...30개 계산기 모두 보기 링크</nav>
  </main>

  <footer>... privacy·terms 링크 ...</footer>

  <script src="./<slug>.js" defer></script>
</body>
```

### JS 파일 헤더 (모든 도구 동일)

```javascript
/**
 * 도구 이름
 * 적용 기준: YYYY년 N월 / 최종 검증: YYYY-MM-DD
 *
 * 검증된 수치 출처
 * - 항목명: 법령 조항 + 공식 출처 사이트
 * - ...
 */

const RATES = {
  법령조항명: 0.045,    // 법령 §조문 번호
  ...
};
```

**핵심 원칙**: 수치 변경 시 코드만 보고 출처 찾을 수 있어야 함. 매년 갱신 추적 가능해야 함.

### CSS

- 단일 파일 `tools/css/style.css` 사용. 인라인 스타일 최소화.
- CSS 변수: `--bg --card --text --muted --border --primary --primary-hover --accent`
- 다크모드 자동 (prefers-color-scheme).
- 새 클래스 추가 시 BEM 같은 거 안 씀. 단순 단어 조합 (`.tool-card`, `.season-banner`).

---

## 6. JSON-LD 구조 (SEO 핵심)

각 도구 페이지에 `<script type="application/ld+json">` 안에 `@graph`로 여러 schema:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebApplication", ... },
    { "@type": "BreadcrumbList", ... },
    { "@type": "FAQPage", ... }    // FAQ 있는 페이지만
  ]
}
```

새 도구 추가 시 같은 패턴 유지. `tools/` 루트의 이전 작업에서 사용했던 `optimize2.py`(삭제됨) 같은 파이썬 스크립트로 일괄 적용 가능.

---

## 7. PWA 동작 메모

- **manifest.webmanifest** — 앱 메타정보. 단축아이콘으로 인기 도구 3개 노출.
- **sw.js** — 캐싱 전략:
  - HTML: network-first (최신 우선)
  - CSS/JS: stale-while-revalidate (캐시 즉시 + 백그라운드 갱신)
  - 정적 자산: cache-first
  - `CACHE_VERSION` 변경 시 옛 캐시 자동 폐기. **CSS·JS 수정하면 버전 올리세요** (현재 v3)

**주의**: 사용자가 "CSS 깨졌다" 하면 99% SW 캐시 문제. CACHE_VERSION 올리고 hard refresh 안내.

---

## 8. 출처·법령 정확성 정책 (사용자가 매우 중요시함)

수익화 사이트라 **세율 잘못 적었다 = 신뢰 상실 = 트래픽·수익 손실**입니다. 다음 정책 유지:

1. **각 도구 HTML 하단 `<section class="sources">` 필수** — 적용 법령 조문 + 공식 출처 링크
2. **각 JS 파일 헤더 주석에 출처 명시** — 미래 갱신 시 검증 경로 보전
3. **수치 변경 시 공식 페이지 직접 확인** — 블로그·언론 보도만 보고 수정 금지
4. **`updated` 일자 기록** (HTML `<div class="updated">`)
5. **불확실한 변경(개정안 발의 등)은 `note`에 별도 표기** — 보수적으로 현행법 유지

### 검증된 핵심 수치 (2026-04-29 직접 확인)

직전 세션에서 공식 출처 fetch로 검증한 결과 — 다른 LLM이 기억으로 틀린 값 쓰지 않도록 명시:

- **국민연금: 9.5%** (2026년 시행, 각 4.75%) — 직전까지 9%였음 / 이후 매년 0.5%p씩 8년간 인상 → 2033년 13%
- **국민연금 기준소득월액 상한: 637만원** (2025.7.1~2026.6.30)
- **건강보험: 7.19%** (2026년 시행, 각 3.595%) — 직전 7.09%
- **장기요양보험: 보수월액의 0.9448%** (2026년 시행) — 산정 방식 변경됨 (이전 "건강보험료의 12.95%")
- **상속세 50% 5단계** (1억/5억/10억/30억) — 정부 개정안(40% 인하·자녀공제 5억) 보도됐으나 국세청 공식 페이지 미반영. **현행법 유지**.
- **양도세 1주택 12억 비과세** — 변경 없음 확인

---

## 9. 미완료 작업 (Backlog)

### 즉시 (배포 직전)

- [ ] **URL 경로 일괄 갱신** (§4 스크립트 사용)
- [ ] 사용자 새 도메인 확인 → canonical/sitemap/JSON-LD 다 갱신
- [ ] 메인 nav `<a class="logo">TAYLEE</a>` 링크 새 홈으로 수정 (또는 제거)
- [ ] `git push` → 라이브 배포

### 단기 (배포 직후 ~1주)

- [ ] **Google Search Console** 등록 + sitemap.xml 제출
- [ ] **네이버 Search Advisor** 등록
- [ ] **쿠팡 파트너스** 가입 → 트래킹 코드 받기 → 6개 도구 placeholder 교체 (`MONETIZATION.md` §2 참고)
- [ ] **AdSense** 신청 (3주~3개월 심사)
- [ ] **Google Analytics 4** Property 추가 (`tools/` 전용) → 30개 페이지에 측정 코드 일괄 삽입

### 중기 (AdSense 승인 후)

- [ ] AdSense publisher ID 받으면 30개 페이지 head 주석 풀고 ID 적용
- [ ] AdSense 광고 단위 3~5개 만들기
- [ ] 30개 페이지의 `[ AdSense 광고 자리 ]` placeholder를 광고 코드로 일괄 교체
- [ ] `ads.txt` 파일 레포 루트에 생성

### 매년 갱신 (README.md §4 체크리스트)

- 1월: 4대보험율, 실업급여 상·하한, 최저시급, 육아휴직 급여
- 7월: 국민연금 기준소득월액 상한
- 11월: 다음 연도 건강보험료율 고시 확인
- 정책 모니터링: 상속세 개정안, 양도세 조정대상지역, 친환경차 감면

---

## 10. 흔한 작업 매뉴얼

### 새 계산기 추가

기존 도구 1개 복사해서 변형. 단계:

1. `mkdir tools/<new-slug>`
2. `index.html` 작성 — §5의 표준 구조 따라
3. `<new-slug>.js` 작성 — 헤더 주석에 출처 + 갱신 메모
4. `tools/index.html` 허브 카드 추가 (해당 카테고리 섹션)
5. `tools/sitemap.xml` URL 추가
6. `README.md` 도구 목록에 추가

### 세율 갱신

1. 해당 도구의 JS 파일 열기 (예: `salary/salary.js`)
2. 상단 주석의 출처 페이지 fetch로 직접 확인 (블로그 안 됨)
3. `RATES` 상수 갱신 + 옆 주석에 변경 사유 기록
4. HTML 페이지 본문의 표시 라벨도 갱신 (예: "국민연금 (4.75%)")
5. `<div class="updated">` 일자 갱신
6. `sw.js`의 `CACHE_VERSION` 한 단계 올리기 (사용자가 새 코드 받게)

### 광고 코드 삽입 (publisher ID 받은 후)

1. `MONETIZATION.md` §1.4 참고
2. 30개 페이지의 `<div class="ad-slot">[ AdSense 광고 자리 ]</div>` 일괄 교체
3. `<head>`의 주석 처리된 `<!-- AdSense -->` 풀고 publisher ID 적용
4. `ads.txt` 파일 생성

---

## 11. 사용자와 일할 때 주의

- **트레이드오프 명시 필수** — "A vs B 차이는 X. Y면 A가 유리, Z면 B" 식으로
- **숫자 환상 금지** — "월 100만원 가능!" 보다 "현실적으로 6개월차 0~5만원, 1년차 5~20만원" 식 정직하게
- **불확실한 출처는 검증** — 사용자가 `MONETIZATION.md` 섹션 8처럼 명세 보내면 자동화로 처리. 추측 금지
- **이미 만든 패턴 재사용** — 새 계산기 만들 때 30개 중 비슷한 거 복사. 새 디자인 패턴 만들지 말 것
- **PWA 캐시 인지** — CSS·JS 수정하면 SW 버전 올리고 사용자에게 hard refresh 안내
- **commit·push 함부로 하지 말 것** — 사용자 명시 요청 있을 때만. 부서질 수 있는 큰 변경은 사전 합의

---

## 12. 참고 파일 우선 순위

| 순위 | 파일 | 언제 읽나 |
|---|---|---|
| 1 | `HANDOFF.md` (이 문서) | 처음 들어왔을 때 |
| 2 | `README.md` | 운영·갱신 작업 전 |
| 3 | `MONETIZATION.md` | 광고 통합 작업 전 |
| 4 | `tools/index.html` | 허브 구조 파악 |
| 5 | `tools/salary/salary.js` | JS 컨벤션 본보기 (가장 잘 정리됨) |
| 6 | `tools/css/style.css` | 디자인 토큰·클래스 파악 |

---

## 13. 마지막 — 사용자가 다음에 할 가능성 높은 요청

1. **"새 위치로 옮긴 후 URL 좀 다 바꿔줘"** → §4 스크립트 사용
2. **"GA Property 만들었는데 코드 좀 깔아줘"** → 측정 ID 받아서 30개 페이지 일괄 삽입
3. **"AdSense 통과했어, 광고 코드 박아줘"** → `MONETIZATION.md` §1 따라서
4. **"새 계산기 OO 추가해줘"** → §10 매뉴얼대로
5. **"세율 바뀌었어 갱신해줘"** → §10 + §8의 출처 정책 준수
6. **"카테고리 추가하고 싶어"** → 허브 페이지 카테고리 섹션 추가 + pill 추가 + sitemap 갱신

---

**행운을 빌어요. 모든 컨벤션·검증·정책은 이 문서에 다 있어요.**
**불명확한 점 있으면 사용자에게 직접 물어보세요 — 답을 추측하면 신뢰성 깨집니다.**
