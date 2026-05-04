# AdSense 승인 준비 — 전체 활동 기록

**작성일**: 2026-05-04  
**상태**: 신청 완료 · 심사 대기 중  
**Publisher ID**: `ca-pub-3553250610781349`  
**도메인**: https://taystudio.github.io/

---

## 0. AdSense 심사 봇이 보는 것 (개요)

Google AdSense 심사는 자동 봇 + 일부 사람 검토. 봇이 사이트를 fetch해서 다음 5가지 카테고리를 평가:

1. **콘텐츠 품질** — 충분한 본문, 원본성, 사용자 가치, E-A-T (Expertise · Authoritativeness · Trustworthiness)
2. **법적 페이지** — privacy policy, terms of service
3. **사이트 인프라** — HTTPS, sitemap, robots.txt, ads.txt
4. **광고 정책 준수** — 금지 콘텐츠 없음, 저작권 침해 없음
5. **사용자 경험** — 모바일 반응형, 빠른 로딩, 명확한 네비게이션

이 문서는 위 5가지에 대해 우리 사이트가 한 모든 활동을 정리한 통합 기록이다.

---

## 1. 법적 페이지 — privacy / terms

### Privacy Policy = 개인정보처리방침

**무엇인가**
- 사이트가 사용자의 어떤 데이터를 수집·처리·보관·공유하는지 명시한 법적 문서
- AdSense 정책상 **광고 게재하는 사이트는 반드시 게시 필수** (없으면 거절)
- 한국 개인정보보호법 + GDPR(EU) 양쪽 모두 권장
- 광고가 자동으로 수집하는 정보(쿠키·IP·기기 ID·광고 식별자)에 대한 고지가 핵심

**우리 사이트 적용 상태** ✅
- URL: https://taystudio.github.io/tools/privacy/
- 8개 섹션 구조:
  1. 수집하는 개인정보
  2. 자동 수집 정보 (제3자 도구) — Google AdSense, Google Analytics, 쿠팡 파트너스 명시
  3. 쿠키 사용
  4. 개인정보 제3자 제공
  5. 사용자의 권리
  6. 아동 보호
  7. 정책 변경
  8. 운영 안내 (개인 운영, 별도 고객센터 없음)
- HTTP 200 OK · canonical 정확
- 핵심 키워드: 쿠키 6회 · 광고 5회 · AdSense 2회 · 쿠팡 3회 · GA 1회 · 수집 7회

### Terms of Service = 이용약관

**무엇인가**
- 사이트 이용 시 사용자와 운영자 간의 권리·의무·면책 사항을 정한 약관
- AdSense 정책상 강제는 아니지만 **강력 권장** (특히 어필리에이트·계산 결과 면책 명시 측면)
- 분쟁 발생 시 운영자 보호 장치

**우리 사이트 적용 상태** ✅
- URL: https://taystudio.github.io/tools/terms/
- 8개 섹션 구조:
  1. 서비스의 성격 (계산기 도구임을 명시)
  2. 정확성 면책 (가장 중요 — 세금 계산은 추정치)
  3. 책임의 제한
  4. 광고 및 어필리에이트 (AdSense·쿠팡 명시)
  5. 저작권 및 출처
  6. 금지 행위
  7. 약관 변경
  8. 준거법 및 관할

### ✅ 해결됨 — 푸터 정적 fallback 적용 (2026-05-04)

**원래 문제**: 도구 페이지 푸터의 privacy/terms 링크가 JS 동적 hydrate 구조 (`<site-footer>` 빈 태그 + `site-chrome.js`). AdSense 심사 봇이 JS 실행 안 하면 "privacy 없는 사이트"로 판정 위험 (거절 사유 1순위).

**적용한 해결**: 옵션 A — `<site-footer>` 안에 정적 fallback `<footer>` 박기. JS 실행 전엔 light DOM의 정적 콘텐츠가 봇에 노출되고, JS 실행되면 `site-chrome.js`가 `innerHTML` 교체로 enhance.

- 적용 페이지: **38개** (tools/ 33개 + tools/index.html + tools/404.html + tools/privacy/ + tools/terms/ + index.html)
- 검증 완료: 모든 site-footer에 `개인정보처리방침</a>` 정적 링크 박힘
- 자세한 기록: [`FOOTER_FIX.md`](FOOTER_FIX.md)

---

## 2. 사이트 인프라

| 항목 | 상태 | 비고 |
|---|---|---|
| HTTPS | ✅ | GitHub Pages 자동 (Let's Encrypt) |
| 커스텀 도메인 | ❌ | `taystudio.github.io` 사용 (서브도메인이라 평가 약간 불리) |
| `ads.txt` | ✅ | repo root에 배치, publisher ID 명시 |
| `sitemap.xml` | ✅ | repo root, 37 URL (자동 빌드 `scripts/build-sitemap.sh`) |
| `robots.txt` | ✅ | `Sitemap:` 라인 포함, AI 봇 차단 X (수익 우선) |
| canonical URL | ✅ | 모든 페이지 head에 명시 |
| `og:*` / Twitter Card | ✅ | 모든 페이지 |
| JSON-LD 구조화 데이터 | ✅ | `@graph` (WebApplication + BreadcrumbList + FAQPage) |
| favicon | ✅ | root에 SVG + PNG 96·192 + apple-touch 180 |

---

## 3. 검색엔진 발견 가능성

- ✅ Google Search Console 등록 + sitemap 제출
- ✅ 네이버 Search Advisor 등록 + sitemap 제출
- ⏳ 페이지 단위 Request Indexing 진행 중 (3일 분할, [INDEXING_CHECKLIST.md](../INDEXING_CHECKLIST.md))
- ✅ Google Analytics 4 측정 코드 33개 페이지 삽입

---

## 4. 광고 인프라 셋업 (승인 전 미리)

| 작업 | 상태 | 위치 |
|---|---|---|
| `ads.txt` 파일 생성 | ✅ | repo root |
| AdSense 자동광고 라이브러리 (`adsbygoogle.js`) head 삽입 | ✅ | 33개 도구 페이지 (루트는 콘텐츠 부족 이유로 제외) |
| Publisher ID 일관성 검증 | ✅ | 단일 ID `ca-pub-3553250610781349` |
| 광고 placeholder div (`ad-slot`) | ✅ | 모든 도구 페이지 |
| 광고 단위 코드 활성화 | ⏳ | **승인 후** publisher ID 풀고 적용 예정 |

---

## 5. 콘텐츠 품질 — 출처·법령 정확성 정책

E-A-T 평가에 직결되는 핵심 차별점.

- ✅ 모든 도구 HTML 하단 `<section class="sources">` 출처 섹션 — 적용 법령 조문 + 공식 출처 링크
- ✅ 각 JS 파일 헤더 주석에 출처·갱신일 명시 — 미래 갱신 시 검증 경로 보전
- ✅ 공식 정부·법령 페이지 **직접 확인** (블로그·언론 1차 인용 금지)
- ✅ 매년 갱신 모니터링 체크리스트 (`tools/README.md`)
- ✅ 검증된 핵심 수치 2026-04-29 직접 확인:
  - 국민연금 9.5% (각 4.75%) — 직전 9% / 이후 매년 0.5%p 인상 → 2033년 13%
  - 건강보험 7.19% (각 3.595%)
  - 장기요양보험 보수월액 0.9448% (산정 방식 변경됨)
  - 상속세 50% 5단계 (정부 개정안 미반영, 보수적 현행법 유지)
  - 양도세 1주택 12억 비과세 (변경 없음)
- ✅ 법령 조문 표기 한국화 (`§53` → `제53조`, `§11①8` → `제11조 제1항 제8호`) — 가독성·전문성

---

## 6. 사용자 경험

- ✅ 100% 정적 HTML/CSS/JS, 백엔드 없음 → 빠른 로딩 (Lighthouse 거의 100점 추정)
- ✅ 다크모드 자동 (`prefers-color-scheme`)
- ✅ 반응형 디자인 (모바일 우선)
- ✅ PWA — `manifest.webmanifest` + Service Worker (오프라인 지원)
- ✅ 단일 CSS 파일 `tools/css/style.css` (캐싱 효율)
- ✅ 명확한 카테고리 네비게이션 (`tools/index.html` 허브 페이지에 7개 카테고리)
- ✅ 33개 도구 모두 동일한 UI 패턴 (학습 곡선 0)

---

## 7. 콘텐츠 정책 준수

AdSense 금지 콘텐츠 항목 — 우리 사이트는 모두 해당 없음:

- ❌ 성인·폭력·해킹·약물 — 없음
- ❌ 저작권 침해 — 없음 (모든 코드·콘텐츠 자체 작성)
- ❌ 자동 클릭·인위적 트래픽 — 없음
- ❌ 헤이트 스피치 — 없음
- ❌ 가짜 뉴스·오해 유도 — 없음 (오히려 출처 명시로 정확성 확보)

---

## 8. 위험 요소 · 미진한 부분

심사 결과에 영향 줄 수 있는 약점들 (transparent하게 기록):

| 위험 | 영향도 | 대응 |
|---|---|---|
| **사이트 운영 기간 짧음** (2026-04-30 초기 구축, 약 1주) | ★★★ | AdSense 정책상 명시 룰은 없으나 새 사이트는 까다로움 |
| **트래픽 누적 부족** | ★★★ | Search Console 인덱싱 진행 중. GA4 일일 방문자 50+ 도달 후 더 안전 |
| ~~privacy/terms 링크 JS 의존~~ | ~~★★~~ | ✅ **2026-05-04 해결** — 정적 fallback footer 38 페이지 적용 ([FOOTER_FIX.md](FOOTER_FIX.md)) |
| **`og:image` 공통 이미지 부재** | ★ | SNS 미리보기 약함. 보류 중 |
| **서브도메인 사용** (`taystudio.github.io`) | ★ | 커스텀 도메인 권장이지만 강제 X |

---

## 9. 시간순 작업 로그

| 날짜 | 작업 |
|---|---|
| **2026-04-30** | 사이트 초기 구축 — 30개 계산기 정적 HTML/CSS/JS |
| **2026-05-03** | `taystudio.github.io` 단일 repo 통합 (URL 일괄 갱신) |
| **2026-05-03** | sitemap.xml · robots.txt 표준화 (root 배치) + 자동 빌드 스크립트 |
| **2026-05-03** | Google Search Console 등록 + sitemap 제출 |
| **2026-05-03** | 네이버 Search Advisor 등록 + sitemap 제출 |
| **2026-05-03** | `ads.txt` root 배치 |
| **2026-05-03** | AdSense 자동광고 라이브러리 33개 페이지 head 일괄 삽입 |
| **2026-05-03** | Google Analytics 4 측정 코드 33개 페이지 삽입 |
| **2026-05-04** | 신규 도구 3개 추가 (취득세·증여세·전월세 환산) → 33개 |
| **2026-05-04** | 법령 조문 표기 한국화 (`§` → `제○조`) — 12 파일 |
| **2026-05-04** | favicon root 자산 4종 배치 (SVG + PNG 96·192·180) + 39 페이지 head 갱신 |
| **2026-05-04** | history `<meta name="robots" content="noindex,follow">` 페이지 추가 |
| **2026-05-04** | URL Inspection 진행 (`INDEXING_CHECKLIST.md`) |
| **2026-05-04** | **AdSense 신청** |
| **2026-05-04** | 푸터 정적 fallback 38 페이지 일괄 적용 (privacy/terms 링크 JS 의존 위험 해결) |
| **2026-05-04** | `adsense/` 디렉토리 정리 — `APPROVAL.md` + `FOOTER_FIX.md` 통합 보관 ← 현재 이 단계, 심사 대기 |

---

## 10. 승인 후 즉시 할 일

승인 결과 받은 다음 작업:

1. **광고 코드 활성화**
   - 30개 페이지 head의 주석 처리된 `<!-- AdSense -->` 부분 풀기
   - publisher ID 적용된 `<script async src="...adsbygoogle.js?client=ca-pub-..."></script>` 활성화
2. **광고 단위 만들기** (3~5개)
   - 디스플레이 광고
   - 인피드
   - 콘텐츠 내 광고
3. **placeholder 일괄 교체**
   - 모든 도구 페이지의 `<div class="ad-slot">[ AdSense 광고 자리 ]</div>` → 광고 단위 코드
   - perl/sed 일괄 처리
4. **쿠팡 파트너스 통합**
   - 가입 → 트래킹 코드 발급
   - 6개 추천 도구의 placeholder 교체

---

## 11. 거절 시 대응 플랜

거절 사유에 따른 액션:

| 거절 사유 | 대응 |
|---|---|
| "Insufficient content" (콘텐츠 부족) | 콘텐츠 추가 — 도구별 사용 가이드 본문 보강 |
| "No privacy policy found" | privacy 링크 정적 HTML로 박기 (위 §1 옵션 A·B) |
| "Site does not comply" (정책 위반) | 거절 메시지의 구체 항목 확인 후 개별 수정 |
| "Insufficient traffic" | 1~2개월 더 인덱싱·트래픽 누적 후 재신청 |
| "Domain age too short" | 시간 문제 — 1~2개월 후 재신청 |

재신청 시 거절 사유 모두 해결한 뒤 신청 (해결 안 하고 재신청하면 통과율 더 낮아짐).

---

## 12. 참고 문서

- [`adsense/FOOTER_FIX.md`](FOOTER_FIX.md) — privacy/terms 링크 JS 의존 위험 해결 기록
- [`tools/ADSENSE_SETUP.md`](../tools/ADSENSE_SETUP.md) — AdSense 의사결정·체크리스트 통합 문서
- [`tools/MONETIZATION.md`](../tools/MONETIZATION.md) — 수익화 통합 가이드 (AdSense + 쿠팡)
- [`INDEXING_CHECKLIST.md`](../INDEXING_CHECKLIST.md) — Search Console URL Inspection 진행 추적
- [`tools/HANDOFF.md`](../tools/HANDOFF.md) — 다른 Claude 세션 인계용 종합 문서
- [`history/index.html`](../history/index.html) — 변경 이력 timeline (시각화)
