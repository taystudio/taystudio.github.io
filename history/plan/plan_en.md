# Plan EN — 영어판 로드맵

> 영어 사이트(`/en/`) 전용 운영 plan. 한국판 [plan.md](./plan.md)와 분리 — 한국판은 한국 시장 60 도구·세금·부동산·노동법 본체, 영어판은 universal subset만 다룸. 본 문서 = 한국판 plan.md 핵심 요약 + 영어 진입 의사결정·로드맵·진행 기록.

**최종 갱신**: 2026-05-10 (Phase B 완료 + SEO audit + HowTo parity + `/en/` home Phase B 반영 + Gap 2 manifest 다국어 + 후속 보강 4 step + 5 카테고리 검수 doc 풀세트 + **lang banner + 헤더 토글 강조 (외국인 root 진입 UX)**)
**현재 상태**: **Phase A + B 완료 + SEO audit 통과 + home 카드 5종 LIVE + 영어 PWA manifest 격리 + 후속 보강 4 step 완료 + 5 카테고리 검수 doc 풀세트 + 양방향 lang banner** — 영어 universal 28선 전부 live + 4 카테고리 hub + Korean source 31파일 hreflang + `TRANSLATED_PATHS` whitelist 33 path + sitemap.xml 71→102 URL + HowTo schema 한·영 9/9 parity + `/en/` home hub-grid 5/5 LIVE + `/en/manifest.webmanifest` 신규(scope=/en/, lang=en-US, shortcuts 4 영어 path) + 5 hub cross-category nav 4 link씩 + 한국 manifest "TayTools" → "TAYSTUDIO" 통일 + `/og-image-en.png` 영어 변형(34 file 갱신) + 검수 doc 5종(87KB) + **smart lang banner (BROWSER_LANG mismatch 감지 · localStorage 기억 · 양방향 ko↔en) + 헤더 lang-toggle 글로브 강조**
**다음 진입 후보**: AI 번역 검수 사용자 review (5 카테고리 doc 준비됨) → IndexNow ping `/en/*` → Phase C 외부 채널

---

## 0. 컨텍스트 — 한국판 plan.md 요약

### 0.1 사이트 본질 (plan.md §0.1)
- **TAYSTUDIO** = "쓸모 있는 것들" — 자주 쓰는 무료 정적 도구 모음. 모든 처리는 사용자 브라우저 안에서 (외부 전송 X)
- 한국 시장 = 60 도구 (계산기 38선·텍스트 3선·이미지 9선·PDF 5선·동영상 5선) 라이브
- 운영자 = 1인 (TayLee, Go 십년 백엔드·프론트 학습 중)
- 우선순위 = **돈 > 트래픽 > 사용성** (memory feedback)

### 0.2 인프라 전략 (plan.md §0.2)
- **정적 우선** — GitHub Pages free tier, 백엔드는 fallback. SharedArrayBuffer X (COOP/COEP 헤더 불가) → ffmpeg-mt·core-mt 사용 금지
- 한 도구 = 한 폴더 (`/<category>/<tool>/`), 한 페이지 단일 진입
- `common/css/style.css` + `common/site-chrome.js` 공용. 도구별 JS는 dedicated 파일

### 0.3 monetization (plan.md §7.5)
- **AdSense** (`ca-pub-3553250610781349`) — 한국 사이트 검토 1~7일 대기 중 (2026-05-09 신청)
- **쿠팡 파트너스** (`AF4086854`) — 한국 retail 가입·위젯 4·추천링크 4 라이브, AdSense 미승인 동안 CSS hide
- 영어판 affiliate 전략 = 추후 Amazon Associates·기타 영어권 affiliate (Phase B 후 별도 트랙)

### 0.4 도메인 migration (plan.md §9.5)
- **2026-05-09** — `taystudio.github.io` → **`taystudios.com`** Cloudflare Registrar 등록 + DNS·HTTPS·301 완료
- GSC URL prefix property 검증 + Change of Address "이전 중"
- Naver SA·Bing WMT·IndexNow·AdSense 메타·script 100% 커버 완료
- **영어판은 처음부터 `taystudios.com/en/*`로 SEO 누적** (별도 migration 작업 없음)

---

## 1. 영어 진입 결정 (2026-05-07 초안 → 2026-05-10 본격)

### 1.1 동기
- 글로벌 트래픽 + AdSense 영어 RPM($3~8, 한국 대비 ~3배) 노림
- 한국 universal 도구(image·PDF·video·일부 계산기) ~28선이 영어권에서도 동작 가능 — 코드 재사용 가능 (~47%)
- 차별화 메시지 = **"Your file never leaves your browser"** — privacy-first

### 1.2 권장 시점 조건 미충족 — 조기 진입 (사용자 결정)
- 권장 = ① 한국 5000+ MAU ② AdSense 안정 수익 ③ 자본·시간 여유
- 현재 ②번 미시작·①번 데이터 미확인 → **조기 Pilot 진입** (사용자 결정, 한국 ROI 우선 정신과 약간 충돌하지만 수용)
- 위험 완화 = Pilot 1선만, 트래픽·SEO 데이터 보고 Phase B 결정

### 1.3 사용자 우선순위
- **image → PDF 부터** Phase B 진입 (한국 특화 X·작업 최소·UI 라벨만)
- 추후 대형 커뮤니티 확장 (사용자 결정 사항)

---

## 2. 인프라 결정

### 2.1 도메인 = `taystudios.com` (5/9 migration 완료) ✅
- 영어판도 같은 도메인이라 한국 권위 일부 흡수 가능 (Google subdirectory 패턴)
- 별도 도메인(예: `taystools.com`) 검토 결과: SEO 권위 0부터 + infra 2배 → 비추
- 추후 영어 트래픽 신호 발견 시 별도 도메인 graduate option은 always open

### 2.2 구조 = `/en/` path
- `/en/` · `/en/tools/` · `/en/tools/compound/` 3 URL 시드 라이브
- canonical = `taystudios.com/en/*` 명시
- hreflang 양방향 — `<link rel="alternate" hreflang="ko|en|x-default">` 모든 페이지에
- og:locale = `en_US`, og:locale:alternate = `ko_KR`

### 2.3 i18n 인프라 — `common/site-chrome.js`
- **자동 언어 감지**: `path.startsWith('/en/')` || `<html lang="en">` → English mode
- **`I18N` 메시지 맵** = ko/en 두 셋 (nav 라벨·banner·modal·toggle 등 ~30 항목)
- **`getAltLangUrl()`** = 현 path 반대 언어 URL 계산 (whitelist `TRANSLATED_PATHS` 기반)
  - whitelist = 33 path (Phase A 3 + Phase B 30 = `/`·`/tools/`·`/tools/compound/`·8 calc·9 image·5 pdf·5 video·1 text·4 hub) — 2026-05-10 갱신
  - **새 영어 도구 추가 시 whitelist 갱신 필수** — 안 하면 hreflang 토글이 `/en/` hub로 fallback
- **헤더 우측 토글** — `/en/`에서 "KO" 표시·클릭 시 한국판으로 이동, 반대도 동일

---

## 3. Phase 로드맵

### 3.1 Phase A — Pilot baseline ✅ (2026-05-10 완료)
- **결과**: `/en/` home + `/en/tools/` calculator hub + `/en/tools/compound/` 1 도구 라이브
- **디자인 = 한국판 1:1 mirror** (hub-bg·hub-hero·hub-grid 5카드·hub-intro·quick-list 시각언어 동일)
- **도구 인벤토리**: 1선 (compound) live, 28선 plan
- **SEO**: hreflang·canonical·schema.org WebSite/BreadcrumbList/Organization/CollectionPage/ItemList/FAQPage
- **monetization**: AdSense script + meta google-adsense-account 양쪽 페이지 박음
- **작업 결과물**: `en/index.html` (460줄) · `en/tools/index.html` (260줄) · `en/tools/compound/index.html` (406줄, stash 도메인 갱신)

### 3.2 Phase B — universal 도구 stack ✅ (2026-05-10 완료, 5 카테고리 병렬 agent 일괄)
- **결과**: 영어 universal 28선 전부 LIVE + 4 카테고리 hub 신설 (`/en/image/`·`/en/pdf/`·`/en/video/`·`/en/text/`) + `/en/tools/` 8 LIVE 갱신
- **사용자 우선순위 = image 9선 → PDF 5선 → video 5선 → 텍스트 1선 → universal 계산기 7선** (실제 진행 = 5 agent 병렬)
- **번역 전략 = AI 초안** — 사용자 검수 후속 예정 (commit 전 review)
- **카테고리별 산출**:
  - **Calculators** (7 신규 + 1 LIVE) — `bmi·calorie·body-fat·ideal-weight·savings·loan·dday` 14 file. WHO BMI 4단계·Mifflin-St Jeor + Harris-Benedict·Navy + CUN-BAE + ACE·Devine/Robinson/Miller/Hamwi medical formula 유지. `savings·loan` = 한국 세금 제거 → FDIC/NCUA + APR·points·PMI·ARM
  - **Image** (9선) — `compress·resize·heic-to-jpg·crop·id-photo·qr-gen·qr-scan·ocr·bg-remove` 19 file. id-photo presets = US Passport·Schengen·UK·China·LinkedIn (한국 여권/주민증/면허 제외). OCR default = `eng` (한국판은 `kor`). vendor lib `/image/vendor/*` 공유 (영어판 별도 복제 X)
  - **PDF** (5선) — `pdf-merge·pdf-split·pdf-edit·pdf-to-image·img-to-pdf` 11 file. vendor `/pdf/vendor/pdf-lib·pdf.min.mjs·pdf.worker.min.mjs` 공유. ESM module 패턴 유지
  - **Video** (5선) — `compress·trim·rotate·to-gif·to-mp3` 12 file 포함 vendor mirror `en/video/vendor/ffmpeg-loader.mjs` (한국 vendor read-only 제약 + alert 메시지 영어화 필요). IndexedDB 캐시 키 동일 → 캐시 재활용. to-mp3 copyright box → 영어 neutral disclaimer + `copyright.gov` link
  - **Text** (1선) — `counter` 3 file. LinkedIn/Twitter/Instagram/Threads/Facebook/SMS GSM-7/UCS-2 영어권 SNS 한도. CJK 통계 한·중·일 통합. EUC-KR 컬럼 제거. kbd-convert/sns-format = ko-only로 영어판 X
- **작업량 실측**: 5 agent 병렬 ~60-90분 wall time (sequential = ~8시간 추정 → 5~10x 단축)

#### 부수 작업 (5/10 같이 끝)
- ✅ **`common/site-chrome.js` `TRANSLATED_PATHS`** = 3 → 33 path 갱신
- ✅ **`sitemap.xml`** = 71 → 100 URL (29개 추가, lastmod 2026-05-10)
- ✅ **한국 source 31파일 hreflang 추가** = 27 도구 + 4 카테고리 hub. canonical 라인 다음에 ko/en/x-default 3줄 일괄 (Python sed)
- ✅ **AdSense compound 활성** = stash 시점 비활성 상태였던 `en/tools/compound/index.html` AdSense script + meta 활성
- ⚠ **잔여**: `/en/<category>/` hub의 cross-category nav (PDF 작성 시점에 다른 hub 미존재라 `/en/tools/`만 link). 다른 4 hub 다 라이브된 지금 `/en/image/`·`/en/pdf/`·`/en/video/`·`/en/text/` 상호 link 보강 필요 — 다음 진입 후보 1순위

### 3.3 Phase C — SEO·트래픽 채널 (외부, Phase B 진행과 병행)
- **Reddit** — r/InternetIsBeautiful · r/usefulwebsites · r/webdev (1~3회 시도)
- **Hacker News "Show HN"** — 1회 (강한 첫인상 필요)
- **Product Hunt** 런칭 — 1회 (도구 카테고리)
- **Indie Hackers · Designer News** — 누적 백링크
- **Search Console international targeting** — 영어판 충분히 차오른 후 설정 (현재 `taystudios.com` URL prefix property 검증 완료 — 영어판은 path별 측정 자동)
- **장기**: 추후 대형 커뮤니티 확장 (사용자 결정)

### 3.4 Phase D — i18n 미세 보강 (Phase B 같이 부분 처리, 잔여만 후속)
- ✅ **sitemap.xml** = `/en/*` 32개 URL 모두 추가 (5/10 완료, 71→102)
- ✅ **`<html lang>`·`<og:locale>` 자동 감지** = 모든 영어 페이지 path 명시 기준 동작
- ✅ **AdSense·GA4** = path별 자동 측정 (코드 변경 X)
- ✅ **HowTo JSON-LD parity** = 한·영 9/9 일치 (5/10 추가 fix). `image/id-photo`·`image/qr-gen` 영어판 누락분 보강 — SERP rich snippet 후보 회복
- ✅ **`manifest.webmanifest` 다국어 (Gap 2)** = `/en/manifest.webmanifest` 신규(scope=/en/, lang=en-US, shortcuts 4 영어 path) + 34파일 link 갱신 (5/10 처리, §9.7). PWA 설치 시 영어 메타·영어 단축키 노출, scope 격리로 한·영 PWA 분리
- ✅ og-image 영어 변형 — `og-image-en.png`(1200×630, "Useful things." + "Your file never leaves your browser" + 5 카테고리 pill) 신규 + 영어 34 file의 `og:image`·`twitter:image`·Organization image 갱신 (5/10 §9.8 step 3)
- ⚠ IndexNow ping `/en/*` URL — Pilot 검증(1~2주) 후 결정. 진입 명령:
  ```bash
  bash scripts/indexnow-ping.sh  # sitemap 갱신됐으니 자동 감지·신규 32 URL 포함 가능
  ```
- ⚠ Search Console international targeting — 영어 트래픽 신호 후 설정 (현재 `taystudios.com` URL prefix property 검증 완료 — path별 자동 측정 가능)
- ✅ cross-category nav 보강 — `/en/image/`·`/en/pdf/`·`/en/video/`·`/en/text/`·`/en/tools/` 5 hub 모두 자기 제외 4 cross-link (5/10 §9.8 step 1, internal linking 권위 분배)

---

## 4. 도구 인벤토리

### 4.1 영어판 universal (~28선)
| 카테고리 | 도구 수 | 영어판 진입 가능성 | 비고 |
|---|---|---|---|
| 계산기 | ~7선 | ✅ | compound·BMI·calorie·body-fat·ideal-weight·savings·loan·dday — 한국 특화 31선은 X |
| 텍스트 | 1선 | ✅ | 글자수 카운터만. 한↔영 키보드·SNS 정리 = ko 전용 |
| 이미지 | 9선 | ✅ | WASM 기반·UI 라벨만 번역. **Phase B 1순위** |
| PDF | 5선 | ✅ | 동일. **Phase B 2순위** |
| 동영상 | 5선 | ✅ | ffmpeg.wasm 기반 동일 |
| **합계** | **~28선** | | 한국 60선의 47% |

### 4.2 ko-only (한국 특화 32선)
- 부동산: 중개수수료·취득세·재산세·종부세·양도소득세·전월세 전환 (6선)
- 금융 세금: 연봉·연말정산·종합소득세·부가세·상속세·증여세·4대보험 (7선)
- 노동법: 시급·주휴수당·연차수당·퇴직금·실업급여·육아휴직 (6선)
- 가족: 출산예정일·배란일·분유량·아기옷·성장백분위 (5선)
- 자동차: 자동차취득세·자동차세 (2선)
- 디지털: 만나이·저장공간·모니터(쿠팡 추천 한국 브랜드 종속) (3선)
- 텍스트: 한↔영 키보드·SNS 정리 (2선)
- 1선 universal로 분류한 만나이는 한국 "만 나이 통일법"(2023) 컨텍스트라 ko-only

→ **법령·세율·가격대 종속이라 번역 X. 한국판 그대로 유지**

---

## 5. 번역 정책

### 5.1 전략 = AI 초안 + 사용자 검수
- 사용자 결정 (2026-05-10)
- 도구 UI 라벨·JSON-LD·meta description·FAQ 답변 = AI 1차 초안
- 도메인 용어(예: 복리·미래가치·BMR)는 표준 영문 용어 사용
- 사용자 검수 = 어색한 표현·tone·잘못된 용어 찾기
- 번역 일관성 = 모든 페이지에 같은 차별화 메시지 ("Your file never leaves your browser")

### 5.2 톤
- **간결·실용** — 한국 사이트 톤(자소서스러운 직설) 유지
- 마케팅 과장 금지 — "Best", "Ultimate", "Free Forever" 같은 SEO 스팸 표현 X
- 영문 모범 표현 = TinyPNG·SmallPDF의 깔끔한 톤 reference

---

## 6. SEO·트래픽 채널

### 6.1 onsite 시그널
- **`<html lang="en">`** + **`og:locale="en_US"`** + **hreflang 양방향**
- canonical absolute URL (`https://taystudios.com/en/...`)
- schema.org WebApplication·CollectionPage·BreadcrumbList·FAQPage·ItemList
- 영어 키워드 — "free online", "no upload", "client-side", "browser-based", "privacy-first"
- 차별화 메시지 모든 페이지에 노출 (description·body·FAQ)

### 6.2 외부 채널 (Phase C 참고)
- 한국 채널(Naver SA·카카오 OG)과 완전 별개
- Reddit·HN·Product Hunt 런칭은 한 번뿐 — 강한 첫인상 필요 → Phase B 80%+ 차오른 후
- 백링크 자연 누적은 시간 ↑ — 적극 마케팅 필요

---

## 7. 위험·트레이드오프

| 위험 | 완화 |
|---|---|
| 영어 시장 경쟁 매우 심함 (`.com` 글로벌 도구 천지) | 차별화 메시지 + privacy-first + WASM 기반 client-side 강조 |
| 이중 유지 비용 (도구 1개 추가 = 한·영 2배) | universal 28선만 영어, 도구당 ~15~30분 라벨 변경만 |
| 한국 시장 자원 분산 위험 | Phase B는 한국 60선 라이브 후 진입, 핵심 한국 ROI 작업(AdSense 승인·SEO Tier 1.2)은 우선순위 유지 |
| 영어 SEO 0부터 시작 | `taystudios.com` 도메인 권위 일부 흡수 + Reddit/HN/PH 1회씩 강한 시그널 |
| `taystudios.com` 영어 인지 약함 (한국 도메인 인상) | 콘텐츠 차별화로 보완 + 추후 별도 도메인 graduate option |

---

## 8. 다음 진입 후보 (우선순위)

1. **Phase A 검증·미세 조정** — descender clearance(완료), 사용자 추가 피드백 반영, mobile 검증
2. **Phase B-1: image/ 9선** — `/en/image/` hub + 9선 (compress·resize·heic-to-jpg·crop·id-photo·qr·qr-scan·ocr·bg-remove)
3. **Phase B-2: PDF 5선** — `/en/pdf/` hub + 5선 (pdf-merge·pdf-split·pdf-edit·pdf-to-image·image-to-pdf)
4. **Phase B-3: video 5선** — `/en/video/` hub + 5선 (compress·trim·rotate·to-gif·to-mp3)
5. **Phase B-4: text + universal 계산기** — `/en/text/counter/` + `/en/tools/<bmi/calorie/body-fat/ideal-weight/savings/loan/dday>/`
6. **Phase D-1: sitemap·`TRANSLATED_PATHS` 갱신 자동화** — Phase B 도구 추가마다 사람 손 안 닿게
7. **Phase C-1: Reddit 시드 게시 1회** — Phase B 60%+ 차오른 후
8. **추후**: HN Show HN, Product Hunt — Phase B 90%+ 차오른 후

### 8.1 운영 doc 메타 TODO (2026-05-10 등재)

> 한국 plan.md §9.4 항목 11·12·13 cross-reference. plan ↔ history doc 자체에 대한 운영 부담 추적.

- **📚 plan.md 분량 압축 검토** — 한국 plan.md = 1000+ 줄, 매 세션 컨텍스트 부담. 영어판 별도 doc 분리 결정의 일부 동기. 진입 시점 = plan.md 1500줄 도달 시 또는 §9.1 결정됨 30개 초과 시. 현 단계 권장 = A안(완료 항목을 history article로 이관 + plan.md엔 한 줄 요약+link). 영어판은 분리 자체로 이미 부분 적용. 상세 = 한국 [plan.md §9.4-11](./plan.md#L855)
- **📌 plan.md ↔ plan_en.md 동기화 추적** — 한·영 분리 후 동기화 비용. 동기화 영역 = §0(본질·인프라·monetization)·§0.4(migration 상태)에 한정. §1~§9는 한·영 독립. 모니터링 트리거: ① 한국 §0 변경 시 같은 PR에서 영어 §0 갱신 ② 한국 §9.5 변경 시 영어 §0.4 일치 확인 ③ 사용자 결정·우선순위 변경 시 한·영 양방향 미러. 분기 임계점 = plan_en.md 500줄 초과 시 별도 운영 일관 인정. 상세 = 한국 [plan.md §9.4-12](./plan.md#L862)
- **🔗 history/index.html에 영어판 link 추가** — 한국 dashboard에서 영어판 history(`history/index_en.html`) 진입점 누락. 영어 → 한국 한 방향만 link. 양방향 cross-discoverability 필요. 위치 = `<header class="site-header">` nav 또는 컨텍스트 카드, 표기 = "영어판 진행 이력 (EN) →". 5/10 Phase A baseline 이후 진입 가능 — 사용자 검토 후 결정. 상세 = 한국 [plan.md §9.4-13](./plan.md#L869)

---

## 9. 진행 기록

### 9.1 2026-05-07 — Pilot scaffold 초안 작성 (stash)
- `english-pilot-wip` stash로 들어감 — 작업 미완료
- 작성: `en/index.html`·`en/tools/index.html`·`en/tools/compound/index.html`·`en/tools/compound/compound.js` 4 파일
- 도메인 = `taystudio.github.io` (당시 도메인) — 5/9 migration 후 stale
- site-chrome.js i18n 인프라 = 작성 안 됨 (당시는 별도 토글 검토 단계)

### 9.2 2026-05-09 — `taystudios.com` migration (한국 plan.md §9.5)
- 영어판 작업과 별개 트랙 — 한국 시장 SEO 신호 본격화 + AdSense 단가 천장 이슈
- 결과: 영어판은 처음부터 `taystudios.com/en/*`로 SEO 누적 가능 (이전 비용 절감)
- 상세: 한국 [plan.md §9.5](./plan.md#L858) 및 [history/migration/](../migration/)

### 9.3 2026-05-10 — Stash 복원 + Phase A baseline ✅
- **Stash pop** — conflict 4건 (index·tools/index·tools/compound·plan.md) resolve
  - upstream(taystudios.com·38선·모니터) 기준선 + stashed(hreflang 3줄·plan §10) 추가만 흡수
  - 도메인 일괄 sed (en/ 4파일 × ~40 stale URL → taystudios.com)
- **Phase A baseline mirror** — 한국판 `index.html`·`tools/index.html` 1:1 mirror
  - en/index.html (460줄) — hub-bg·hub-hero·hub-grid 5카드(1 LIVE 4 coming-soon)·hub-intro·quick-list 5 row
  - en/tools/index.html (260줄) — hero+search·featured(compound)·3 카테고리(Finance·Health·Lifestyle)·FAQ·search JS
- **descender clearance fix** — `.hub-title { padding-bottom: 0.18em }` (line-height<1 + background-clip:text 조합에서 "g·j·p·q·y" 잘림)
- **migration concept doc 이동** — `history/seo/concept-domain-migration.html` → `history/migration/concept/index.html` + index 등록
- **sitemap.xml** — `/en/`·`/en/tools/`·`/en/tools/compound/` 3 URL 추가 (총 71)
- **`history/plan/plan_en.md`(이 파일) + `history/index_en.html` 신설** — 영어판 운영 doc 분리. 사용자 결정으로 `plan.md`·`plan_en.md` 둘 다 `history/plan/` 디렉토리로 이동 (repo 루트 정리)

### 9.4 2026-05-10 — Phase B 일괄 진입 (5 카테고리 병렬 agent) ✅
- **사용자 결정**: "다 만들어줘" — image/PDF/video/text/calculator universal 28선 한 세션에 일괄 출시 (commit은 사용자 검토 후 다음 날)
- **실행 방식**: 5 agent 병렬 dispatch (background) — 각 agent가 한 카테고리 담당
  - Agent 1 (Image): hub + 9 도구 = 19 file, ~22분
  - Agent 2 (PDF): hub + 5 도구 = 11 file, ~12분
  - Agent 3 (Video): hub + 5 도구 + vendor mirror = 12 file, ~14분
  - Agent 4 (Text): hub + 1 도구 = 3 file, ~4분
  - Agent 5 (Calculators): 7 도구 + index 갱신 = 14 file + 1, ~14분
  - **총 wall time** = ~22분 (가장 긴 agent 기준), sequential 추정 = ~8시간 → **20x 단축**
- **번역 가이드**: 글로서리 + 한국 특화 neutralize 규칙 + Korean Society BMI → WHO 4-tier 등 jurisdiction-agnostic 결정 사항 prompt에 명시
- **결과 산출**: 32 file group(63 file 포함 JS·mjs) + 1 update(`en/tools/index.html`)
- **부수 작업**: site-chrome.js TRANSLATED_PATHS 33 path · sitemap 100→102 URL · Korean 31파일 hreflang 추가 · `en/tools/compound/` AdSense 활성
- **검증 통과**: 0 stale URL · 34/34 canonical 정상 · 34/34 lang=en · 34/34 hreflang · 34/34 AdSense (compound 활성 후)

### 9.5 2026-05-10 — Phase B 후 SEO audit + HowTo parity 회복 ✅
- **사용자 질문**: "SEO 최적화도 되어 있나? 영어 버전도"
- **9 영역 audit 실시 + Gap 2건 검출**:
  - ✅ 핵심 시그널 production-ready: 34/34 canonical·hreflang·OG·Twitter·viewport·H1·alt·BreadcrumbList·AdSense·GA4·sitemap·robots
  - ⚠ Gap 1: HowTo JSON-LD 누락 2개 (`image/id-photo`·`image/qr-gen` 영어판) — Image agent가 일부 도구에서 schema 빠뜨림
  - ⚠ Gap 2: `manifest.webmanifest` 다국어 미지원 (영어 페이지 PWA 설치 시 한국어 노출)
- **Gap 1 fix 진행**:
  - 한국 source `image/id-photo`·`image/qr-gen`의 HowTo block 추출 → 영어 번역 → 영어판 JSON-LD에 삽입
  - id-photo 4 step (Upload→Pick a size→Adjust frame→Download · totalTime PT45S)
  - qr-gen 4 step (Enter content→Pick error correction→Generate→Download · totalTime PT30S)
  - 결과: 한·영 HowTo parity 9/9 회복. SERP rich snippet 후보 mirror 일치
  - JSON-LD validity = brace balance 검증 통과(id-photo {25=}25, qr-gen {25=}25), localhost 200 OK
- **Gap 2 처리**: 사용자 결정 — 1번 먼저 처리 후 2번 보기로

### 9.6 2026-05-10 — `/en/` home Phase B 반영 누락분 fix ✅
- **사용자 지적**: "/en/index.html 카드 활성화 안 되어 있는 거 같은데?" — 정확
- **원인**: Phase B(§9.4)에서 image/PDF/video/text 4 카테고리 hub + 28선 LIVE 됐는데 `/en/` home은 Phase A 시점(`coming` class 4 카드 + quick-list "coming soon" 4 row) 그대로 멈춰있음. Phase B 마무리에서 home 갱신을 빠뜨림 — 진입점이 죽은 카드로 표시되어 트래픽 끊김 위험
- **fix 내용**:
  - `en/index.html` hub-grid 5 카드 모두 LIVE 활성 (Calculators 8 / Image 9 / PDF 5 / Video 5 / Text 1) — `<div class="hub-card coming">` → `<a class="hub-card" href="./<category>/">` + LIVE dot + tool count 라벨
  - quick-list 5 row 모두 활성: Calculators 5 hot link(compound·bmi·calorie·loan·savings) + Image 5(heic-to-jpg·crop·id-photo·compress·bg-remove) + PDF 4(merge·split·edit·pdf-to-image) + Video 5(compress·trim·rotate·to-gif·to-mp3) + Text 1(counter) + 각 row "All →"
  - SEO meta 일관성: og:title에 text 추가 / og:description·meta description·twitter:description = "28 tools live" 반영 / JSON-LD WebSite hasPart에 Image·PDF·Video·Text 4 entry 추가 (기존 Calculators 1 entry → 5 entry) / hub-intro body 본문 stale 표현("calculators are live now, image/PDF/video next") 제거 → "28 everyday tools" 단일 메시지로 통일
- **잔여 CSS**: `.hub-card.coming` / `.ql-row.coming` rule은 둠 (향후 새 카테고리 추가 시 재사용 가능, 한국판도 동일 패턴)
- **검증**: `grep coming` markup 0건 (CSS 4 라인만), 카드 5/5 LIVE, quick-list 19 link, hreflang·canonical 변동 없음
- **commit**: `a6a60a8 feat: 영어판 28선 launch — en/ 35 file + 5 hub + home 5/5 LIVE + i18n` (104 file · +19295 -24, 영어판 첫 launch commit으로 5/9~5/10 작업 일괄 + Korean source hreflang + sitemap + history dashboard·plan doc 이동 묶음)

### 9.7 2026-05-10 — Gap 2 `/en/manifest.webmanifest` 다국어 PWA ✅
- **사용자 결정 (이전 turn)**: home Phase B 반영 fix(§9.6) 후 Gap 2 진입
- **문제**: `/en/*` 34 HTML 모두 한국어 `manifest.webmanifest` 참조 중 → 영어 PWA 설치 시 ① name "TayTools — 자주 쓰는 무료 도구" 한국어 ② lang=ko-KR 시그널 mismatch ③ shortcuts 4개 한국 path(`/tools/salary/`·`/tools/age/`) — 영어판에 미존재 → 클릭 시 한국 페이지·404 ④ description "59가지+저장공간" 한국 시장 메시지
- **fix 내용**:
  - **`/en/manifest.webmanifest` 신규** — name=TAYSTUDIO, short_name=TAYSTUDIO, description="28 free everyday tools..." 영어, start_url=`/en/`, **scope=`/en/`** (영어 PWA 격리, PWA spec 다국어 표준 패턴), lang=en-US, dir=ltr, theme_color/background_color 한국과 동일 (브랜드 일관)
  - **icons 4 entry** = 한국 manifest와 동일 (`/pwa-icon.svg`·`/pwa-icon-192.png`·`/pwa-icon-512.png` any/maskable). 절대 경로라 변경 불요
  - **shortcuts 4** = `/en/tools/compound/`(Compound interest)·`/en/tools/bmi/`(BMI)·`/en/image/compress/`(Image compress)·`/en/pdf/pdf-merge/`(Merge PDF). 한국 mirror 패턴(salary→compound, age→BMI 영어권 hot 도구로 대치)
  - **34 `/en/*.html` link 갱신** — `<link rel="manifest" href="/manifest.webmanifest">` → `/en/manifest.webmanifest`. find + sed 일괄
- **scope 격리 효과**: 영어 PWA 설치자가 한국 토글 클릭 시 PWA 밖으로 navigate(일반 브라우저), 한국 사용자는 기존 `/` scope manifest 그대로 사용 → 한·영 PWA 동작 분리
- **검증**: `python3 -m json.tool` JSON validity OK · stale `/manifest.webmanifest` 0건 · 새 `/en/manifest.webmanifest` 34건
- **사이드 fix (같은 commit ea9e3bc)**: `en/index.html` quick-list Image row "Background remove" → "Remove BG" (17→9 char). flex-wrap 발생해 "All →"이 둘째 줄로 떨어지던 문제 해소 — 5 link + All → 한 줄 fit. remove.bg 사이트 관습 라벨 차용
- **commit**: `ea9e3bc feat: 영어판 PWA manifest 다국어 (Gap 2) + Image row 라벨 fix` (36 file · +124 -45)
- **scope 밖 (별도 작업)**: 영어 전용 PWA 아이콘 디자인, `common/site-chrome.js` 자동 swap 로직 추가 (정적 link로 충분)
- **추가 후속 (이번 turn 직후, 같은 commit 묶음 권장)**: ✅ 한국 `manifest.webmanifest` 브랜드 통일 — `name`·`short_name` "TayTools" → "TAYSTUDIO" (사이트 본문·헤더 로고·footer와 일관성 회복). 5/5 PWA 작업 시점에 운영자명+용도 결합으로 "TayTools" 채택했으나 이후 도메인·브랜드 통합으로 stale

### 9.8 2026-05-10 — 영어판 후속 보강 4 step (audit 권장 보강) ✅
- **사용자 결정**: 영어/한국 사이트 audit 후 권장 보강 항목을 "순차적으로 ㄱㄱ"
- **Step 1 — 5 hub cross-category nav 보강** ✅
  - 기존 영어 4 hub(`en/image/`·`en/pdf/`·`en/video/`·`en/text/`)의 related-nav가 `→ Calculators` 1 link만 → 자기 카테고리 제외 4 link로 확장 (`→ Image · → PDF · → Video · → Text · → Calculators` 중 자기 제외)
  - `en/tools/index.html`은 related-nav 자체가 없어 신규 추가
  - 효과: 5 hub 상호 internal linking 권위 분배 (Google PageRank 분산), 사용자 도구 발견성 향상
- **Step 2 — 한국 `manifest.webmanifest` 브랜드 "TayTools" → "TAYSTUDIO" 통일** ✅
  - `name`·`short_name` 필드 sed (1 file). 5/5 PWA 작업 시점에 운영자명+용도 결합으로 "TayTools" 채택했으나 이후 도메인·브랜드 통합으로 stale → 사이트 본문·헤더 로고·footer와 일관성 회복
  - 한국 PWA 설치자가 보는 앱 이름이 사이트 본문과 일치
- **Step 3 — `og-image-en.png` 영어 변형 신규** ✅
  - `og-image-en.svg` 신규 디자인 (한국 SVG 패턴 mirror) — 카피: "Useful things." (영어 home과 일치) + "Your file never leaves your browser" (privacy-first 차별화) + 5 카테고리 pill (Calculators · Image · PDF · Video · Text 컬러 dot accent) + URL footer "taystudios.com/en"
  - `rsvg-convert -w 1200 -h 630 og-image-en.svg -o og-image-en.png`로 PNG 변환 (1200×630 OG 표준)
  - 이모지 제거 — `rsvg-convert`에 컬러 이모지 폰트 없어 박스로 깨지므로 컬러 dot으로 대체 (한국 OG도 동일 깨짐, fallback 일관)
  - 영어 페이지 34 HTML의 `og:image`·`og:image:secure_url`·`twitter:image` 일괄 sed (`og-image.png` → `og-image-en.png`) + `en/index.html` JSON-LD Organization image도 영어판으로 갱신
  - 효과: 영어 SERP·Twitter card·Facebook share 미리보기에서 영어 카피 노출 → CTR 향상 기대
- **Step 4 — 5 카테고리 번역 검수 candidate doc 풀세트** ✅
  - `history/seo/2026-05-10-en-image-translation-review.md` (26KB · image 9 도구 + hub)
  - `history/seo/2026-05-10-en-pdf-translation-review.md` (15KB · pdf 5 도구 + hub)
  - `history/seo/2026-05-10-en-video-translation-review.md` (15KB · video 5 도구 + hub)
  - `history/seo/2026-05-10-en-text-translation-review.md` (5KB · text 1 도구 + hub)
  - `history/seo/2026-05-10-en-calculators-translation-review.md` (26KB · calc 8 도구 + hub)
  - 각 file 추출 항목: SEO meta(title/desc/OG/Twitter) + H1 + subtitle + privacy box + FAQ Q/A + HowTo step
  - 사용자 review 후 어색한 표현·도메인 용어 패치 진입점. Python 추출 script 동일 패턴 (재실행 가능)
- **검증**: 5 hub 모두 4 cross-link 정상 · 한국 manifest JSON validity OK · 영어 OG PNG 1200×630 RGB · stale `og-image.png` in en/ = 0건 / 새 `og-image-en.png` 34 file 103 occurrences · Image hub HowTo·FAQ 추출 정상

### 9.9 2026-05-10 — Smart lang banner + 헤더 토글 강조 (외국인 root UX) ✅
- **사용자 결정**: "맨 앞 페이지 index.html이 한글로 되어 있잖아. 영어 한글 분기점 확실히 치고 외국인 들어왔을 때 좋게" — 4 옵션 중 "Smart banner + 헤더 토글 강조 (Recommended)" 채택
- **문제**: 외국인이 `taystudios.com/` 직접 진입 시 한글 home → 헤더 lang-toggle("EN" 텍스트 link)이 작은 nav 안 마지막이라 발견 어려움 → 이탈 위험
- **fix 내용 (`common/site-chrome.js`)**:
  - **`BROWSER_LANG` 상수** 신규 — `navigator.languages[0]` 분석. Accept-Language 첫 우선 언어
  - **`shouldShowLangBanner()`** 신규 — 페이지 LANG ≠ BROWSER_LANG mismatch 시 banner 노출 (root 한국 페이지에 영어 브라우저 → 영어 banner / `/en/`에 한국어 브라우저 → 한국어 banner). localStorage `lang-pref` (사용자 명시 선택)·`lang-banner-dismissed` (사용자 dismiss) 체크해 재방문 시 반복 노출 방지
  - **I18N 추가**: `langBannerForEnUser`/`langBannerForKoUser`(타겟 언어로 작성 — 그 사용자가 읽을 수 있게) + `langBannerCTAFor*` + `langBannerDismiss`
  - **SiteHeader.connectedCallback** banner markup 추가 — 헤더 위 sticky bar (disclaimer banner 패턴 mirror, 파란 accent `rgba(37,99,235,0.08)`). CTA → `getAltLangUrl()`로 반대 언어 home, dismiss × 버튼
  - **3 event handler**: ① close → `lang-banner-dismissed=1` ② CTA → `lang-pref=altLang` ③ 헤더 lang-toggle → `lang-pref=altLang` (사용자 명시 선택 학습)
- **fix 내용 (`common/css/style.css`)**:
  - `.site-nav .lang-toggle` 강조 — 글로브 emoji prefix(I18N에서) + `padding: 5px 10px` + `background: var(--card)` + `border-radius: 6px` + hover `transform: translateY(-1px)` + `background: var(--primary)` (외국인 자력 발견 가능하게)
  - I18N `langToggleLabel` = `🌐 English`(ko 페이지)·`🌐 한국어`(en 페이지) — W3C 권장 native language name
- **SEO 안전**: auto redirect 안 함 → 정적 HTML에 banner markup 0건(`grep -c ts-lang-banner` root·/en/ 모두 0). DOM 동적 삽입이라 search bot은 한국·영어 페이지 각각 정상 인덱싱. canonical·hreflang 무영향
- **검증**: localhost server 200 OK 4/4 · BROWSER_LANG·shouldShowLangBanner·I18N 코드 정상 · CSS box style 적용 · 정적 HTML에 banner 0건 (SEO 무영향) · 한·영 home lang/canonical 그대로
- **한국 사용자 영향 0**: 한국 브라우저면 mismatch X → banner 안 노출. 헤더 토글만 box 스타일 강조됨 (한국 사용자에게도 시각 개선)
- **scope 밖 (의식적 비채택)**: ① auto redirect — SEO 위험 + 한국 영어 OS 사용자 의도치 않은 redirect ② language picker landing — 한국 시장 SEO 권위 약화 + 한국 사용자 1 클릭 friction ③ 국가 emoji (🇺🇸/🇰🇷) — Taiwan/HK 등 정치 민감 회피, universal `🌐` 채택 ④ 다른 언어 (중국어·일본어 등) — 본 작업은 ko/en 양방향만

### 9.10 다음 세션 진입 후보
- **사용자 검수 — AI 초안 번역 품질 review** (1순위, **5 카테고리 doc 풀세트 준비됨**) — `history/seo/2026-05-10-en-{image,pdf,video,text,calculators}-translation-review.md` 5개 보고 어색한 표현·도메인 용어·FAQ 답변 점검. 우선순위 = image → pdf → video → calculators → text (영어 시장 hot 순). 사용자 결정 시 patch 진행
- **IndexNow ping `/en/*` 신규 32 URL** — sitemap 갱신 직후 가능. `bash scripts/indexnow-ping.sh`
- **Phase C-1: Reddit 시드 게시 1회** — Pilot 검증 1~2주 후 (사용자 결정). r/InternetIsBeautiful·r/usefulwebsites 권장
- **사용자 검토 후속**: kbd-convert·sns-format(text/) ko-only 유지 결정 재확인, `id-photo` preset 변경 검토

---

## 10. 참조

> 본 파일 위치 = `history/plan/plan_en.md`. 아래 경로는 본 파일 기준 상대.

- 한국판 plan: [`plan.md`](./plan.md) — 60 도구·monetization·SEO·migration 본체
- 한국판 history: [`history/index.html`](../index.html) — 시간 역순 변경 이력
- 영어판 history: [`history/index_en.html`](../index_en.html) — 영어판 진행 이력
- 도메인 migration: [`history/migration/`](../migration/) — 5/9 migration 5 채널 + concept doc
- i18n core: [`common/site-chrome.js`](../../common/site-chrome.js) — `LANG`·`I18N`·`TRANSLATED_PATHS`·`getAltLangUrl()`
