# TAYSTUDIO SEO 전략

> 작성일: 2026-05-05 / 정적 GitHub Pages 사이트 기준

## 목표

**돈(AdSense·쿠팡) > 트래픽 > 사용성** 순서. SEO는 "트래픽" 레이어를 키우는 도구.
정적 사이트라 서버 측 최적화는 불가, **HTML head·schema·콘텐츠**가 모든 레버리지.

## 한국 시장 SEO 환경

| 채널 | 비중 | 핵심 시그널 |
|---|---|---|
| Google KR | 검색 트래픽 절반 이상 | title·description·schema·Core Web Vitals·E-E-A-T |
| Naver | 한국어 쿼리 절반 가량 | title 30자 이내, description 80~100자, 출처 표기 |
| 카톡(KakaoTalk) | 입소문 유입 1순위 | **og:image PNG (1200×630)** + og:title/description |
| X / Slack / Discord | 보조 채널 | twitter:card="summary_large_image" + twitter:image |

→ 한국 사이트일수록 **og:image와 사이트 단위 일관성**이 결정타.

## 우리 사이트의 SEO 차별화 포인트

1. **프라이버시 신뢰** — "브라우저 안에서 처리, 외부 전송 없음"을 description·FAQ·schema 전반에 일관되게 노출. 글로벌 SaaS 클론 시장(remove.bg, photoroom, smallpdf, ilovepdf 등)에서 **무료 + 서버 안 거침**이 클릭 동기.
2. **로컬 컨텍스트** — 카톡 5MB, 이메일 25MB, 한국어 OCR, 한국 세율 등 한국 사용자 검색 의도를 description에 직접 반영. 글로벌 도구가 못 노리는 long-tail.
3. **출처 명시(`.sources`)** — 세율·법령 페이지는 공식 출처 링크 + `.updated` 최종 검증일. Google E-E-A-T(Trustworthiness) 시그널.
4. **JSON-LD 깊이** — WebApplication + FAQPage + BreadcrumbList + (root) Organization. 리치 스니펫 후보.

## SEO Tier 우선순위 (영향 ÷ 작업량)

### Tier 1 — 즉시 작업 (큰 영향, 작은 작업)

- **og:image / twitter:image 사이트 전체 적용**
  - 누락 시 카톡·X·페이스북 공유 시 빈 미리보기 → 클릭 직접 손실
  - 1200×630 PNG, 모든 head에 일관 적용
- **카테고리 hub 콘텐츠 깊이**
  - hub(image/, text/, tools/)가 카드 그리드만이면 thin content
  - 카테고리 키워드 직접 진입 SERP에서 약함
  - long-form 소개 + FAQ + .updated + .sources

### Tier 2 — 리치 스니펫 강화 (중간 영향, 중간 작업)

- **JSON-LD WebApplication 필드 보강** — featureList, dateModified, softwareVersion. 리치 스니펫에 기능 노출 가능.
- **Organization JSON-LD (root)** — 브랜드 쿼리·Knowledge Panel 강화.
- **HowTo JSON-LD** — step-by-step 사용법이 명확한 도구(pdf-merge, bg-remove, img-to-pdf, qr-gen). 검색 결과에 번호 매기기 카드 노출 가능.

### Tier 3 — 후순위 (낮은 ROI / 자산 의존)

- 도구별 스크린샷 자산 + screenshot JSON-LD 필드
- 도구별 `<section class="howto">` HTML + JSON-LD 동기화
- 사용자용 HTML 사이트맵 페이지
- WebPage schema (각 도구에 main entity 명시)

## SEO 체크리스트 (도구 페이지 기준)

새 도구 추가할 때마다 이 체크리스트로 검증:

- [ ] `<title>` 60자 이내 (한국어 27~41자 권장)
- [ ] `<meta name="description">` 80~110자
- [ ] `<meta name="keywords">` 한국어 검색 의도 키워드
- [ ] `<link rel="canonical">` 절대 경로
- [ ] og:type/locale/site_name/title/description/url
- [ ] **og:image (1200×630 PNG)** + og:image:width/height/alt
- [ ] twitter:card="summary_large_image" + twitter:title/description/image
- [ ] `<html lang="ko">` + JSON-LD `inLanguage: "ko-KR"`
- [ ] JSON-LD WebApplication (name·description·url·applicationCategory·offers·featureList·dateModified·softwareVersion)
- [ ] JSON-LD BreadcrumbList (3 depth)
- [ ] JSON-LD FAQPage (DOM의 FAQ 섹션과 동기화 — 동일 질문/답)
- [ ] h1 unique + h2/h3 계층 구조
- [ ] `.updated` 최종 검증일 (세율·법령 도구만)
- [ ] `.sources` 출처 링크 (수치 인용 도구만)
- [ ] `.related-calc` cross-category 내부 링크 6개
- [ ] sitemap.xml 등록
- [ ] robots.txt 차단 없음
- [ ] `<img>` alt 텍스트 누락 없음

## 안 하는 것들

- **세율·법령 수치는 블로그·언론 인용 금지** — 공식 페이지(국세청·고용노동부 등) 직접 확인. Google이 "출처 신뢰도" 평가할 때 뉴스/블로그 인용은 약점.
- **AI 생성 thin content 양산** — 도구 자체가 가치(계산기·이미지 처리). 콘텐츠 SEO보단 도구 SEO.
- **유료 도구 추가** — 모든 처리는 클라이언트, 무료 — 차별화 무너지면 안 됨.
- **noindex 남용** — history/만 noindex, 나머지는 모두 index.

## 측정

- Google Search Console: 노출수·클릭률·평균 게재순위 (도구별)
- Naver 웹마스터: 사이트 검색·키워드 분석
- 카카오: og:image 미리보기 도구로 수동 검증
- AdSense: RPM·CTR — SEO 트래픽 품질 지표

## 참고

- [Google Search Central — Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Naver 검색 가이드](https://searchadvisor.naver.com/guide)
