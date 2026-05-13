# SEO·LLM 친화 강화 + 운영자 정보 정리 — 2026-05-13

**컨텍스트**: 도메인 migration 4일차 (2026-05-09 → 5/13). SEO 코드 차원 한국·영어 최적화 + LLM 인용 가능성 강화 + About 페이지 신상 노출 조정. AdSense 승인 대기 + GSC indexing 35/114 진행 중.

---

## 작업 누적 (2026-05-11 ~ 2026-05-13)

### 2026-05-11
- mosaic Pointer Events fix (모바일 터치 동작)
- 테마 토글 (FOUC + 2-state cycle, KO/EN i18n)
- build-sitemap.sh `/en/` 미러 자동 처리
- sitemap rebuild + push + IndexNow ping (114 URL × Bing·Yandex·Naver·Seznam)
- GSC indexing batch 1 (KO 10) + batch 2 (EN 10) + batch 3 (KO 2)

### 2026-05-12
- baby-formula 소수점 둘째자리 입력
- hreflang 32개 KO-only 도구 일괄 추가
- format-convert title hook 강화 (KO·EN)
- description 3 critical 단축 (en/index·body-fat·to-mp3)
- og·twitter title 일관성 fix
- `.gitignore` Playwright cache 무시
- 두 토글 (lang·theme) 시각 크기 통일
- GSC indexing batch 4 (KO functional 10) + batch 5 (KO 계산기 3)

### 2026-05-13

**A. description LLM 친화 강화 (KO 33 + EN 21)**
- 패턴: TL;DR + 구체 수치 + 공식 출처/표준 + 항목 list
- 예: BMI에 "대한비만학회 6단계 분류·WHO 아시아 기준"
- 예: salary에 "국민연금 4.5%·건강보험 3.545%·장기요양 0.4591%·고용보험 0.9%"
- 예: pdf-merge에 "pdf-lib WebAssembly·100MB까지 처리"

**B. HowTo schema 신규 추가 (KO 23 + EN 15)**
- 4단계 process (입력 → 옵션 → 처리 → 다운로드)
- 도구별 unique step text (일반화 없음)
- 누적 적용: KO 33 + EN 25 = **58 도구**

**C. llms.txt 신규 생성** (root)
- llmstxt.org 표준 형식
- 65+ 도구 카테고리별 list + 한 줄 설명 + 수치/출처
- Tech stack (WebAssembly 라이브러리 명시)

**D. robots.txt LLM 정책 명시**
- GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Applebot-Extended 6개 Allow 명시
- anthropic-ai (미문서) 제거 (검증 후)

**E. comprehensive 메타 "5월 신고 시즌" hook** (2026-05 시점 즉시 효과)

**F. site-chrome.js dns-prefetch 동적 주입**
- googletagmanager, cloudflareinsights, esm.sh, staticimgly.com

**G. 접근성 — `:focus-visible` + `--muted` 대비 강화**
- 모든 a/button/[tabindex]에 `:focus-visible { outline: 2px solid var(--primary) }`
- `--muted: #6b7280 → #52525b` (라이트 모드 WCAG AA 통과)
- input :focus에 box-shadow 추가

**H. Cross-link 강화**
- image/compress ↔ video/compress (양방향)
- text/counter → image/ocr
- EN 미러도 동기화

**I. Dataset schema 추가**
- KO `tools/bmi` (대한비만학회 6단계 분류·WHO 아시아 기준)
- KO `tools/salary` (4대보험 요율 + 소득세 누진세율 8 구간)
- EN `en/tools/bmi` (WHO Asia-Pacific 6-stage)

**J. About 페이지 신규** (KO + EN)
- AboutPage + Organization + BreadcrumbList + Person schema
- 신상 노출 조정 series:
  - 실명 (이태혁/Taehyuk Lee) 제거 → "TayLee" alias만
  - 학술 background (DRL 난류·Physical Review Fluids·PM2.5 금상·대한기계공학회) 제거
  - 회사명 (SK Inc. AX) 미명시 (의도)
  - 호스팅 (GitHub Pages)·도메인 migration 표현 제거
  - "정적 사이트 (HTML/CSS/JS)" 표현 제거
  - GitHub Profile link 제거 (Issues link만 유지)
  - "Go 백엔드 10년차" 잘못된 정보 → "Software Developer" 정정
- 한국 특정 표현 제거 (KO·EN 모두 글로벌 친화 톤)
- **KO 추가**: "한국판 계산기 근거·출처" 섹션 (15 카테고리별 공식 법령·기관 명시)
- **EN 추가**: "Calculator References" 섹션 (8 글로벌 도구 공식·논문 출처)

**K. 인프라 정합성 fix**
- `/about/` 페이지 추가에 따른 동기화:
  - sw.js v17→v18 + `/about/` STATIC_ASSETS 추가
  - build-sitemap.sh ROOT_PAGES에 about 추가
  - sitemap rebuild 116 URL (KO + EN about 포함)
  - common/site-chrome.js TRANSLATED_PATHS에 `/about/` 추가 (한↔영 토글 fix)
  - footer Contact link 추가 + i18n
- llms.txt 정합:
  - "60선" → "65+선" 정확 표기
  - Operator 정보 generic화 ("TayLee · Software Developer · 1인 운영")
- About areaServed: `"KR"` → `["KR", "Global"]` (EN과 일관)

**L. 메모리 user_profile.md 정정**
- "Go 십년 차 백엔드" → 정정 (Software Developer, Java/Spring/AWS·기계공학·DRL background 포함)
- 정확한 정보로 갱신, 향후 세션 정확성 보장

---

## 변경 파일 누적

| 일자 | 파일 수 | 카테고리 |
|---|---|---|
| 2026-05-11 | 4 | mosaic·테마·build script·sitemap |
| 2026-05-12 | 37+ | hreflang·title·description·일관성 |
| 2026-05-13 | 80+ | description·HowTo·Dataset·About·접근성·robots·llms·dns·시즌 hook |
| **누적** | **120+** | 인프라 + SEO + LLM + E-E-A-T |

---

## LLM 친화 측면 진단

### ✅ 완료된 강점
- WebApplication schema 99 파일
- BreadcrumbList 110 파일
- FAQPage 108 파일
- HowTo 58 도구 (KO 33 + EN 25)
- Dataset 3 도구 (KO 2 + EN 1)
- AboutPage + Organization + Person schema (KO + EN)
- 정확한 수치·출처 명시 (AAP·근로기준법·WHO 아시아·대한비만학회·Mifflin-St Jeor·U.S. Navy 등)
- llms.txt 표준 형식
- robots.txt LLM 6 crawler Allow
- description LLM 친화 강화 (KO 33 + EN 21)
- canonical·hreflang KO·EN 양방향 + 32 KO-only ko+x-default
- Core Web Vitals 100% Good
- 접근성 WCAG AA (focus-visible + 색상 대비)

### ⏳ 다음 강화 영역 (별도 plan)
- EN 도구 커버리지 확장 (30+ KO 전용 도구 영문화)
- tap target 44×44 모바일 (button·a)
- Dataset schema 추가 (hourly·calorie·heart-rate)
- 본문 long-tail FAQ (5월 종합소득세·비과세 식대)
- 도구별 "마지막 검토일" 배지

---

## GSC Indexing 진행도

| Batch | 일자 | 카테고리 | 처리 |
|---|---|---|---|
| 1 | 5/11 | KO functional | 10 (9 🔄 + 1 ✅) |
| 2 | 5/11 | EN 글로벌 evergreen | 10 |
| 3 | 5/11 | KO image (quota 초과) | 2 |
| 4 | 5/12 | KO functional 마무리 | 10 |
| 5 | 5/12 | KO 계산기 top (quota 초과) | 3 |
| **누적** | | | **35/114 (30.7%)** |

**다음**: Batch 6 (5/14 quota 회복 후) — comprehensive·hourly·bmi·text·video 나머지

---

## migration 종합 평가 (도메인 migration 4일차)

| 항목 | 등급 |
|---|---|
| 새 도메인 인프라 (HTTPS·www·trailing slash·sitemap·robots) | A+ |
| 옛 도메인 redirect (taystudio.github.io 301) | A+ (slug 매핑 자동) |
| 인덱싱 진행 | B+ (4일차 적정) |
| Core Web Vitals | A+ (100% Good) |
| SEO 코드 (hreflang·canonical·schema) | A+ |
| LLM 친화 (HowTo·Dataset·llms.txt·robots.txt) | A+ |
| E-E-A-T (About·Organization·Person schema) | A |
| 접근성 (focus·color·muted) | A (WCAG AA) |
| 운영자 정보 (신상 노출 조정 완료) | A |
| 한국·글로벌 양면 정합 | A (KO 한국 시장 출처 + EN 글로벌 표준) |
| **종합** | **A+** |

---

## 트래픽 현황 (2026-05-11 audit 시점)

GA4 28일 (4/13~5/10):
- 활성 사용자: 46 (봇 제외 ≈35)
- 평균 참여 시간: **4분 33초** (압도적)
- google organic: 6 세션 (indexing 진행 중)
- naver organic + m.search referral: 18 세션 (12% 점유, 살아있음)
- chatgpt referral: 1 (LLM channel 발견 시작)

→ 5/25 (2주 후) 재측정 예정.

---

## 다음 점검 일자

| 일자 | 액션 |
|---|---|
| 2026-05-14 | Batch 6 진행 (남은 KO 계산기·text·video) |
| 2026-05-18 | GSC Coverage 1주 누적 — batch 1~6 indexed 비율 |
| 2026-05-25 | Search performance 2주 — impressions·CTR·position 회수, Batch 7 선정 |
| 2026-06 (예정) | EN 도구 확장 시작 (year-end·comprehensive·bmi·calorie 영문화) |

---

## 참고 문서

- `history/audit/audit-01-traffic-engagement-checkup.md` — GA4·CF 데이터 회수
- `history/checklist/gsc-indexing-status.md` — GSC manual indexing master (live update)
- `history/seo/strategy.md` — SEO 전략·Tier 우선순위 (2026-05-05)
- `history/seo/concept-indexnow.html` — IndexNow 개념정리
- `history/migration/index.html` — 도메인 migration dashboard
- `history/plan/plan.md` — 사이트 전체 마스터 plan
- `tools/HANDOFF.md` — 사이트 전체 인계 (코드 컨벤션·SEO·정책)
- `/about/` · `/en/about/` — 운영자 소개 + 계산기 근거·출처 (신규)
- `/llms.txt` — LLM 친화 markdown site map (신규)
