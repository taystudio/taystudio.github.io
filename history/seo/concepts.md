# SEO 개념정리

사이트 운영하면서 plan·history·세션 대화에 자주 등장하는 SEO 용어 누적 정리. 새 개념 등장 시 여기에 추가.

---

## SERP (Search Engine Results Page)

### 한 줄 정의

검색엔진(Google·Naver 등)에 검색어를 치면 나오는 그 **결과 페이지**.

### 화면 구조 (Google 기준)

```
┌──────────────────────────────────────────────┐
│ 검색창: "글자수 세기"                          │
├──────────────────────────────────────────────┤
│ [광고] sponsored ──────────────── 가장 위     │
├──────────────────────────────────────────────┤
│ ⭐ Featured snippet (강조 박스)               │ ← 질문 답을 직접 노출
│   "글자수 세는 방법은 ..."                    │
├──────────────────────────────────────────────┤
│ 1. 글자수 카운터 - taystudio.github.io        │ ← 유기적 결과 (organic)
│    공백 포함·제외, SNS·자소서 한도 ...        │    우리가 노출되는 곳
│                                               │
│ 2. naver.com/...                              │
│ 3. 다른 사이트 ...                            │
├──────────────────────────────────────────────┤
│ "사람들이 함께 찾아본 질문" (PAA)             │
│ ▸ 글자수에 공백이 포함되나요?                 │
├──────────────────────────────────────────────┤
│ 관련 검색어 / 페이지네이션                    │
└──────────────────────────────────────────────┘
```

### 사이트가 신경 쓰는 SERP 영역

| 영역 | 어떻게 노출되나 |
|---|---|
| **유기적 결과 (organic)** ⭐ | `<title>` + `meta description` + canonical + 콘텐츠 깊이 |
| **Featured snippet** | FAQ JSON-LD + 명확한 질문 답 (콘텐츠 구조화) |
| **Rich results (리치 스니펫)** | JSON-LD WebApplication·HowTo·FAQPage 박으면 별점·이미지·번호카드 노출 |
| **PAA (People Also Ask)** | FAQ가 PAA 후보로 채택되기도 함 |
| **Knowledge Panel** | Organization JSON-LD — 브랜드 검색 시 우측 패널 (이미 적용) |

### 사이트가 적용한 SERP 전략

- **각 페이지 `<title>`** — 키워드 정확히 포함 (예: "연봉 실수령액 계산기 | TAYSTUDIO")
- **meta description** — SERP에 그대로 표시되는 1-2 줄. 클릭 유도 카피
- **JSON-LD WebApplication·BreadcrumbList·FAQPage** — 51 페이지 적용 (rich result 후보)
- **canonical** — 미러 사이트가 있어도 원본 인지
- **og:image** — SNS는 OG 사용. SERP는 별개. 다만 Knowledge Panel 후보 자료로 쓰임

### "SERP 약함"이라는 표현의 의미

plan에 자주 등장:

> "카테고리 hub가 카드 그리드만 있어 thin content. 카테고리 키워드 SERP 약함"

= **"이미지 도구 모음" 같은 카테고리 키워드 검색 시 우리 카테고리 hub가 SERP 상위에 안 올라옴.** 콘텐츠 깊이가 약해서. plan §9.4-2 SEO Tier 1.2 작업이 이를 해결 (hub-intro + FAQ + 출처).

### 측정 — Search Console

SC "성능" 탭에서:

| 키워드 | 노출수 | 클릭수 | CTR | 평균 순위 |
|---|---|---|---|---|
| 글자수 세기 | 1234 | 87 | 7.0% | 4.2 |
| 연봉 실수령액 | 5678 | 234 | 4.1% | 6.8 |

이게 = **우리 페이지가 어떤 SERP에서 몇 번째에 노출되는지**의 측정 데이터. SEO 작업 효과 검증의 객관 지표.

### 정리

SERP = "검색 결과 페이지". SEO 작업의 본질 = **"이 SERP에서 우리가 위로 올라가게"** 만드는 것. plan에 자주 나오는 단어.

---

## (앞으로 추가 — 빈 슬롯)

다음 개념이 등장하면 여기에 누적 추가:

- **canonical** — 미러·중복 페이지가 있을 때 "원본은 이 URL"이라고 알려주는 메타. 도용 자동 방어 핵심
- **JSON-LD** — 구조화 데이터. WebApplication·FAQPage·BreadcrumbList·Organization·HowTo 등
- **OG (Open Graph)** — SNS 미리보기 메타. 카톡·페이스북·X·디스코드. `2026-05-05-og-image-rollout.md` 참조
- **E-E-A-T** — Experience·Expertise·Authoritativeness·Trustworthiness, Google 콘텐츠 품질 평가 기준
- **Rich results / Featured snippet / PAA / Knowledge Panel** — SERP 특수 노출 영역들
- **robots.txt / sitemap.xml** — 크롤러에게 알려주는 메타 파일
- **Naver vs Google SERP 차이** — 한국 검색 채널 분리. 네이버 서치어드바이저 별도 등록 필요
- **TWA (Trusted Web Activity)** — PWA를 안드로이드 앱으로 포장 (PWA 작업 시 등장)
- **PWA (Progressive Web App)** — 웹사이트를 앱처럼 설치·실행 (manifest + Service Worker)

---

## 관련 문서

- `history/seo/strategy.md` — SEO 전략·체크리스트·우선순위
- `history/seo/2026-05-05-og-image-rollout.md` — OG 이미지 일괄 적용 기록
- `history/seo/2026-05-05-og-meta-followup.md` — OG 메타 보강 후속 정리
- `plan.md` §7.3 (SEO 정책) · §9.4 (SEO Tier 작업)
