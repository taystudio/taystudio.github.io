# SEO 등록·최적화 진행 기록

`taystudios.com` 를 Google·Naver 검색에 노출시키는 작업. 운영 매뉴얼이 아니라 이번 셋업의 **개념 정리 + 체크리스트 + 실제 진행 로그** 통합 문서.

---

## 0. SEO 가 뭔가 — 전체 그림

### 검색 엔진의 동작 파이프라인

검색엔진(Google, Naver 등)이 user 사이트를 검색 결과에 띄우려면 세 단계가 필요:

```
[1. 발견 (Discovery)]
  └─ 사이트의 URL 목록을 검색엔진이 알아내야 함
  └─ 방법: 외부 링크, sitemap, 직접 제출 등

[2. 크롤링 (Crawling)]
  └─ 봇이 발견한 URL을 실제로 fetch해서 HTML 가져감
  └─ robots.txt로 어디는 보고 어디는 안 봐도 되는지 가이드

[3. 색인 (Indexing)]
  └─ 가져간 HTML을 분석·저장. 키워드·구조 데이터·메타 정보 추출
  └─ 검색 결과에 노출될 후보로 등록

[4. 순위 (Ranking)]
  └─ 사용자가 검색하면 색인된 페이지들 중 어떤 걸 위에 보여줄지 결정
  └─ 키워드 매칭, 사이트 권위, 콘텐츠 품질, UX 시그널 종합
```

**SEO 작업이 노리는 지점**:
- 1·2·3 단계: 우리 페이지를 봇이 빠르고 빠짐없이 발견·이해하게 만들기 → **기술 SEO** (이 문서가 다루는 영역)
- 4 단계: 같은 키워드 검색 시 우리 페이지가 위로 가게 만들기 → **콘텐츠 SEO** (별개 영역)

이 문서는 **기술 SEO** 가 중심. 콘텐츠 SEO는 도구별 텍스트 보강·키워드 리서치·백링크 빌딩 등 별도 작업.

---

## 1. 핵심 개념

### 1-1. sitemap.xml

**한 줄 정의**: "내 사이트에 어떤 페이지들이 있는지" 검색엔진에게 미리 알려주는 URL 목록 파일.

**왜 필요**:

| 상황 | sitemap 없을 때 | sitemap 있을 때 |
|---|---|---|
| 신규 사이트 | 봇이 외부 링크 따라가다 운 좋게 발견. 한 달+ 걸릴 수도 | 등록 직후 며칠 내 색인 시작 |
| 새 도구 페이지 추가 | 다른 페이지에서 링크 안 걸리면 영원히 발견 안 됨 | sitemap에 추가하면 자동 재크롤 |
| 페이지 수 많음 | 깊은 페이지는 누락 가능 | 33개 도구 누락 없이 인식 |
| 업데이트 시점 | 봇이 또 와야 알 수 있음 | `<lastmod>` 로 변경 시점 직접 통지 |

**구조 예시**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://taystudios.com/tools/salary/</loc>
    <lastmod>2026-05-03</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.95</priority>
  </url>
  ...
</urlset>
```

**필드 의미**:

| 필드 | 의미 | 비고 |
|---|---|---|
| `<loc>` | URL | 필수. 절대 URL |
| `<lastmod>` | 마지막 수정일 | 선택. ISO 8601 형식. 빠른 재크롤 트리거 |
| `<changefreq>` | 변경 빈도 힌트 | 선택. `daily` / `weekly` / `monthly` / `yearly` 등. 검색엔진은 힌트로만 참고 |
| `<priority>` | 사이트 내 상대 중요도 | 선택. 0.0~1.0. **검색 순위와 무관**, 단지 사이트 내부 중요도 표시 |

**중요 사실**: `<changefreq>`·`<priority>` 는 강제력 없는 힌트. Google은 사실상 무시하고 자체 알고리즘으로 결정. Naver는 어느 정도 참고. 적어두는 게 관습이지만 정확하지 않아도 페널티 없음.

**검색엔진이 sitemap을 찾는 경로** (셋 다 깔아두는 게 표준):

1. **robots.txt에 명시** — 봇이 robots.txt를 먼저 읽으니까 거기에 sitemap URL 적어두면 자동 발견
2. **수동 제출** — Search Console / Naver Webmaster Tools에서 직접 입력. 가장 확실
3. **관습 위치 자동 탐색** — 일부 봇은 `https://<도메인>/sitemap.xml`을 추측해서 자동 시도

**한계·규약**:
- 파일당 최대 **50,000 URL** 또는 **50MB** (압축 전)
- 더 많으면 **sitemap index** (sitemap들의 sitemap) 만들어서 묶음
- 잘못된 URL (404, 리다이렉트, robots.txt로 막힌 것 등) 포함 시 sitemap 신뢰도 ↓ → 깨끗하게 유지 중요
- canonical URL과 sitemap URL이 일치해야 함

### 1-2. robots.txt

**한 줄 정의**: 봇에게 "어디는 와도 되고 어디는 오지 마라" 가이드하는 텍스트 파일. 사이트 루트 (`/robots.txt`) 에 둠.

**왜 필요**:
- 봇이 사이트 도착하면 **가장 먼저 읽는 파일** — 여기 없거나 제한이 명시 안 돼있으면 봇은 모든 URL을 자유롭게 크롤
- 관리자 페이지·실험적 페이지·중복 콘텐츠 등을 색인에서 제외하고 싶을 때 사용
- sitemap 위치를 명시해서 봇 발견 돕기
- 크롤 부하 제어 (`Crawl-delay` 디렉티브)

**기본 문법**:

```
User-agent: *           # 모든 봇 대상
Allow: /                # 전체 허용 (이건 사실 기본값)
Disallow: /admin/       # /admin/ 이하는 막음

Sitemap: https://taystudios.com/sitemap.xml
```

**우리 사이트가 가져갈 형태** (단순):

```
User-agent: *
Allow: /

Sitemap: https://taystudios.com/sitemap.xml
```

= "모든 봇한테 전체 허용 + sitemap은 여기 있다".

**중요 주의사항**:
- robots.txt는 **봇에 대한 권고**. 악성 봇은 무시함. 정말 비공개 콘텐츠라면 인증·서버측 차단 필요. SEO 봇(Googlebot, Naverbot) 같은 정직한 봇만 따름
- `Disallow`는 "크롤 금지"이지 "색인 금지" 가 아님 — 외부 링크로 발견되면 URL만 색인될 수 있음. 색인까지 막으려면 페이지 자체에 `<meta name="robots" content="noindex">` 넣어야 함
- 잘못 작성해서 `Disallow: /` 박으면 사이트 전체가 검색에서 사라짐. 매우 위험

### 1-3. Canonical URL

**한 줄 정의**: 같은/유사 콘텐츠가 여러 URL로 접근 가능할 때 "이게 진짜 정본 URL이야" 검색엔진에 알려주는 메타 태그.

**왜 필요**:
- 같은 콘텐츠가 다음 같이 여러 URL로 보일 수 있음:
  - `https://example.com/page`
  - `https://example.com/page/`
  - `https://example.com/page?utm_source=xxx`
  - `https://www.example.com/page`
  - `http://example.com/page`
- 검색엔진은 이걸 **중복 콘텐츠**로 인식해서 순위 분산되거나 페널티 가능
- canonical로 정본 하나 지정하면 검색엔진이 모든 변종을 그 정본으로 통합 처리

**형태** (각 페이지 `<head>`):

```html
<link rel="canonical" href="https://taystudios.com/tools/salary/">
```

**우리 상태**: 33개 도구 페이지 전부에 canonical 박혀있음 ✓ (Step 3 코드 변경 시 정리됨)

### 1-4. 메타 태그 (title, description)

**검색 결과 화면(SERP)에 노출되는 텍스트**:

```
연봉 실수령액 계산기 2026 | 4대보험·세금 차감     ← <title>
https://taystudios.com/tools/salary/             ← URL
2026년 기준 연봉 실수령액을 즉시 계산. 국민연금...   ← <meta description>
```

**중요 룰**:
- `<title>`: 50~60자 내 권장. 핵심 키워드 앞쪽에. 사이트명은 뒤에 |로 구분
- `<meta name="description">`: 120~160자. 키워드 자연스럽게 포함. 클릭 유도 문구
- 페이지마다 **고유한** title·description (중복 금지)

**우리 상태**: 모든 도구 페이지에 고유 title/description 있음 ✓ (예: `salary/index.html`)

### 1-5. Open Graph / Twitter Cards

**한 줄 정의**: 카카오톡·페이스북·X(Twitter) 등에 사이트 URL 공유 시 보여줄 미리보기 카드 메타.

**왜 SEO와 관련**:
- 직접 검색 순위에는 영향 거의 없음
- 그러나 SNS 공유 시 미리보기가 잘 뜨면 클릭률·바이럴 효과 ↑ → 간접적 트래픽 + 백링크 효과

**우리 상태**:
```html
<meta property="og:type" content="website">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="TAYSTUDIO 계산기">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
```
모두 있음 ✓. **빠진 것**: `og:image` — 미리보기 이미지 URL. 추가하면 카드 시각적 임팩트 큼.

### 1-6. JSON-LD 구조화 데이터

**한 줄 정의**: 페이지의 의미 정보 (이게 무슨 종류 콘텐츠인가, 누가 만든 건가, 가격은, 리뷰는 등) 를 검색엔진에 기계 판독 가능한 형태로 제공.

**효과**: 검색 결과에 **리치 결과 (rich result)** 로 노출 — 별점, 가격, 단계 표시 등이 일반 결과보다 시각적으로 두드러짐 → 클릭률 ↑

**우리 상태** (각 도구 페이지):
```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebApplication", "name": "...", ... },
    { "@type": "BreadcrumbList", ... }
  ]
}
```
- `WebApplication` 타입 ✓ — 무료 계산기 도구로 인식됨
- `BreadcrumbList` ✓ — 검색결과에 빵부스러기 경로 노출
- 추가 가능: `FAQPage` (도구별 FAQ 추가 시), `HowTo` (사용법 가이드 추가 시) → 리치 결과 더 다양

### 1-7. 검색엔진별 특성

| 엔진 | 점유율 (한국) | 특징 |
|---|---|---|
| **Naver** | 약 60% | 한국 시장 최강. 자체 봇·알고리즘. 외부 사이트 노출에 보수적, 자체 콘텐츠(블로그·카페) 우대 경향 |
| **Google** | 약 30% | 글로벌 표준. 봇·알고리즘 정교. 기술 SEO에 충실하면 잘 보상 |
| **Daum** | 약 5% | Kakao 운영. Naver와 별개 봇·인덱스. 자체 등록 필요 |
| **Bing** | < 5% | Microsoft. DuckDuckGo, Yahoo도 같은 인덱스 사용. 글로벌 트래픽엔 의미 |

**우리 사이트는 한국 시장**: Naver 등록이 가장 임팩트 큼. Google이 두 번째. Daum·Bing은 시간 남을 때 추가.

---

## 2. 우리 사이트 현재 상태 (감사)

### 이미 잘 돼있는 것
- ✅ `sitemap.xml` 33개 URL 등록 (위치: `tools/sitemap.xml`)
- ✅ canonical URL (모든 페이지)
- ✅ JSON-LD 구조화 데이터 (`WebApplication`, `BreadcrumbList`)
- ✅ Open Graph / Twitter 메타 태그
- ✅ title/description 페이지별 고유
- ✅ `manifest.webmanifest` (PWA — 모바일 검색 가산점)
- ✅ Service Worker (오프라인·캐시 — Core Web Vitals 가산점)
- ✅ HTTPS (GitHub Pages 자동)
- ✅ 모바일 친화적 viewport 메타

### 보완 필요
- ❌ `robots.txt` 없음 (필수)
- ⚠️ `sitemap.xml` 위치가 `/tools/sitemap.xml` — 표준 위치 `/sitemap.xml` 이 더 관습적. robots.txt에 명시하면 어디든 무방하지만 깔끔함을 위해 루트로 이동 추천
- ⚠️ `<lastmod>` 필드 sitemap에 없음 — 추가하면 업데이트 시 빠른 재크롤
- ⚠️ `og:image` 없음 — SNS 공유 미리보기 임팩트 약함

### 외부 등록 안 된 것
- ❌ Google Search Console 미등록
- ❌ Naver Search Advisor 미등록
- ❌ (선택) Daum Webmaster Tools 미등록
- ❌ (선택) Bing Webmaster Tools 미등록

---

## 3. 진행 플랜

### Phase 1. 사이트 자체 보강 (코드 작업)
- [ ] `robots.txt` 작성·루트 배치
- [ ] `sitemap.xml` 루트로 이동 (또는 현 위치 유지 + robots.txt에서 명시)
- [ ] sitemap에 `<lastmod>` 추가 (선택)
- [ ] `og:image` 추가 (선택, 이미지 자산 필요)
- [ ] commit + push

### Phase 2. Google Search Console
- [ ] 속성 추가 → `taystudios.com`
- [ ] 소유권 확인 (HTML 메타 태그 권장)
- [ ] sitemap 제출
- [ ] URL 검사로 색인 강제 요청 (메인 페이지 + 주요 도구)
- [ ] 모바일 사용성·Core Web Vitals 보고서 확인

### Phase 3. Naver Search Advisor
- [ ] 사이트 등록 → `https://taystudios.com/`
- [ ] 소유권 확인
- [ ] sitemap 제출
- [ ] robots.txt 등록
- [ ] RSS (있으면)

### Phase 4. (선택) Daum + Bing
- [ ] Daum 검색등록
- [ ] Bing Webmaster Tools (Google Search Console 데이터 import 옵션)

### Phase 5. 검증·모니터링 (장기)
- [ ] Search Console에 색인 카운트 늘어나는지 확인 (1-4주)
- [ ] Naver "사이트 검색"에서 우리 도구 검색해서 노출 확인
- [ ] 검색 키워드 (예: "연봉 계산기") 입력 시 우리 페이지 위치 추적

---

## 진행 기록

- 2026-05-03 (1): 문서 생성. 핵심 개념 정리. 현재 상태 감사 완료. Phase 1 시작 대기.
