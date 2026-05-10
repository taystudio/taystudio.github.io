# Plan — 카테고리 확장 로드맵

> **작성**: 2026-05-04 / **최종 갱신**: 2026-05-10 (**모니터 PPI·시야거리 도구 + 쿠팡 파트너스 위젯 8개 라이브 + 사이트 일관성 38선/60도구 + 쿠팡 affiliate AdSense 승인 전까지 CSS hide + 헤더 깜박임 완전 해결 + 영어 시장 진입 검토 시작** — 5/9~5/10 6 commit 체인. tools/monitor/ 신규 (PPI·픽셀 피치·시야거리·4K 변별 + 게이밍·사무·영상편집·세컨드 4 추천 카드, JSON-LD WebApp+Breadcrumb+FAQ 7건). 쿠팡 파트너스 가입(회원 ID AF4086854) + Playwright+CDP로 너 Chrome retail 쿠팡 직접 스크래핑(Akamai 봇 차단 우회) → 카테고리별 베스트셀러 1픽업 → 콘솔에서 위젯·추천링크 8개 발급 → 4 카드에 박음. AdSense 리뷰어가 affiliate 비중 오인할 위험 차단 위해 CSS hide 처리(승인 후 단일 블록 삭제로 즉시 unhide). 헤더 깜박임 = site-chrome.js를 70 HTML 파일 모두 `</body>`→`</head>` blocking 이동 + min-height 예약 + install 버튼 eligibility localStorage 캐시 → 매 페이지 navigation 시 헤더 컨텐츠 유지. **앞선 작업 — IndexNow 인프라(2026-05-07) + 저장공간 계산기(2026-05-06, 디지털·기기 카테고리 신설)** + AI 이미지 업스케일링 봉인 + privacy·terms root 이전. **현 시점 도구 수 60선**(계산기 38 + 텍스트 3 + 이미지 9 + PDF 5 + 동영상 5), tools 카테고리 8개(디지털·기기 = 저장공간·모니터 2선), **sitemap 68 URL**. **다음 = AdSense 신청·승인 대기(쿠팡 affiliate hide 풀기 트리거) + 영어 시장 진입 첫 단계** (§10 참고). 다음 세션이 이 문서 보고 이어서 작업.

---

## 0. 작성 의도 (먼저 읽기)

### 0.1 본질 motivation

운영자(TayLee)의 본질 동기는 **광고 수익**. utility 사이트는 그 수단. 모든 도구·기능 결정은 다음 우선순위로 평가:

> **돈 > 트래픽 > 사용자 가치**

순서를 헷갈리지 말 것. "사용자에게 도움 되는" 도구라도 트래픽·수익 기여가 약하면 후순위. 트래픽이 커도 광고 친화가 약하면(개발자 대상·체류 짧음) 후순위.

### 0.2 인프라 전략 — 정적 우선

> **GitHub Pages 정적 사이트로 도달 가능한 한계까지 끌어모은 다음, 거기서 막히는 경우에만 백엔드 도입.**

이유: 운영비 0, 배포 단순. 백엔드는 수익이 검증된 후 투자할 카드. 백엔드 도입 명분이 생기는 신호 = 사용자별 데이터 저장 필수 / 서버사이드 계산 필수 / API 키 보호 필수 / SEO상 SSR 필수.

**도구 후보 평가 시 자동 reject**: "이건 백엔드 필요한데"라는 결론을 시도 전에 내리지 말 것. 정적 JS·WASM·IndexedDB 조합으로 가능성을 먼저 끝까지 본다.

### 0.3 도구 후보 평가 3 질문

새 도구 후보는 다음 3 질문을 통과해야 함:

1. **검색 트래픽이 큰가?** (네이버·구글 자동완성·트렌드 기준 — "감"이 아니라 검색량으로)
2. **광고 친화적인가?** — 일반인 대상이 개발자 대상보다 우선. 체류 시간 긴 게 짧은 것보다 우선. 자소서·이력서·세금처럼 진지한 결정 동반하는 게 광고 단가 높음
3. **정적으로 가능한가?** — 가능 X면 우선순위 떨어뜨리고, 정적으로 가능한 다른 도구를 찾는다

3개 모두 ✓ 인 도구 = 1순위. 1번 ✓ + 2번 ✗ (개발자 도구) = 후순위·스킵 후보.

### 0.4 부적합 후보 패턴 (만들지 말 것)

- 개발자 전용 도구 → 광고 차단률 높고 단가 낮음 (json formatter, base64, regex tester 등)
- 단발 사용 도구 → 체류 짧음, 재방문 약함
- 이미 무료 클론 천지인 도구 → 차별화 불가능하면 피한다
- "있으면 좋은데 수익 약함" 으로 카테고리 채우기용 도구

---

## 1. 사이트 구조 원칙

```
<repo-root: studio>/
├── common/                  ← /common/                       (CSS·site-chrome 공통)
│   ├── css/style.css                                          (2026-05-05 이관)
│   └── site-chrome.js
├── tools/                   ← taystudios.com/tools/     (36개 계산기 — 세금·금융·근로·임신·육아·**건강 5선(BMI·BMR/TDEE·체지방률·표준체중·심박존)**·자동차, ✅ 완료)
├── text/                    ← taystudios.com/text/      (1단계, ✅ 완료 — Tier 1 3선)
├── image/                   ← taystudios.com/image/     (2단계, ✅ 완료 — 9선 + vendor 5종, 2026-05-06 Tier 1 신규 3종 추가)
│   └── vendor/                                                (qrcode·jsQR·tesseract·imgly-bg-remove·heic2any)
├── pdf/                     ← taystudios.com/pdf/       (PDF 카테고리, ✅ 완료 — 5선 + vendor 3종, 2026-05-06 신설)
│   └── vendor/                                                (pdf-lib·pdf.min.mjs·pdf.worker.min.mjs)
├── video/                   ← taystudios.com/video/     (Tier 1 5선 ✅ 완료 — ffmpeg.wasm + IndexedDB 캐시)
│   └── vendor/ffmpeg-loader.mjs                              (자체 작성 ESM wrapper)
├── test/                    ← taystudios.com/test/      (3단계 — 미진입)
└── (이후 ROI 재평가 후) luck/, quiz/, random/, track/
```

**현 시점(2026-05-06) 사이트 도구 수 = 58선** (계산기 36 + 텍스트 3 + 이미지 9 + PDF 5 + 동영상 5), sitemap **66 URL**. **계산기는 `tools/` 단일 카테고리**로 통합. **PDF는 별도 카테고리** (image/와 분리). **이미지 9선** = 압축·리사이즈·HEIC→JPG·자르기·증명사진·QR 생성/인식·OCR·배경 제거. AI 업스케일링은 **봉인 중** (image/upscale/ 페이지 noindex + 점검 안내, vendor·JS는 보존 → 재활성 즉시 가능).

- **로컬 repo 이름**은 `studio` (URL prefix X)
- 카테고리는 **루트 직속 디렉토리** — `taystudios.com/<카테고리>/`
- 도구는 카테고리 안의 디렉토리 — `taystudios.com/<카테고리>/<도구>/index.html`
- `tools/`와 동일 패턴 유지

---

## 2. 진행 순서·ROI 평가

| 순서 | 카테고리 | 트래픽 | 광고 친화 | 정적 가능 | 작업량 | 상태 |
|---|---|---|---|---|---|---|
| 1️⃣ | **text** (글자·문자) | 큼 | 도구별 편차 큼 | ✓ | 작음 | **✅ 완료 (2026-05-04)** — Tier 1 3선 (counter·kbd-convert·sns-format) |
| 2️⃣ | **image** (이미지·PDF) | **매우 큼** | 일반인 ✓ | ✓ (lib 무거움 + AI WASM) | 중간 | **✅ 완료 (2026-05-05)** — 9선 (compress·resize·qr-gen·qr-scan·pdf-merge·pdf-split·**img-to-pdf**·ocr·**bg-remove**) |
| 3️⃣ | **test** (자기 검사) | 중간 (바이럴 burst) | 약함 (단발) | ✓ | 작음 | **다음 진입 후보** — SNS 유입·재방문 |
| 보류 | luck / quiz / random / track | 미평가 | 미평가 | ? | ? | 1~3단계 결과 본 후 재평가 |

> **2026-05-05 회고 — health/ 카테고리 신설 시도 → tools/calorie/ 풍부화로 통합**: 한때 BMR·TDEE 종합 도구를 `health/bmr/`로 분리 시도했으나, 기존 `tools/calorie/`와 90%+ 콘텐츠 겹쳐 SERP 자기-경쟁·duplicate-content 위험 발생. **결정**: `tools/calorie/`를 풍부화(Mifflin + Harris-Benedict 비교 + TDEE + 단백질·물 + 활동량 5표 + 키별 참고표 + FAQ 6 + 출처 5)해 BMR 콘텐츠 흡수, health/ 디렉토리 폐지. 계산기는 모두 `tools/` 하나로. §9.1 결정 기록 참고.

> **2026-05-05 회고**: image/는 plan §0.2 "정적 한계까지" 가장 강력한 검증 사례 — 이미지 압축·QR·PDF·OCR 모두 백엔드 없이 브라우저 WASM/canvas로 해결. Tesseract.js로 OCR까지 정적으로 가능함을 확인. 백엔드 도입 명분(§0.2 신호) 아직 미발견.

각 단계는 **카테고리 허브(index.html) + Tier 1 도구**가 첫 배포 단위. 카테고리 채우기용 ROI 낮은 도구는 끝까지 미루거나 스킵.

---

## 3. 1단계 — `text/` 카테고리 (글자·문자)

### 3.1 도구 리스트 — ROI 재정렬

**Tier 1 (출시 대상, 일반인·트래픽·광고 친화 ✓)**

- [x] **counter** — 글자수 카운터 ✅ 출시 완료 (2026-05-04)
  - 공백 포함·제외, 단어·줄·바이트(UTF-8), 한글/영문/숫자 분리
  - SNS·자소서 한도 11개 progress bar
  - 시즌성 큼 (상·하반기 공채 자소서 시즌 트래픽 burst)
- [x] **kbd-convert** — 한글↔영문 키보드 변환 ✅ 출시 완료 (2026-05-04)
  - "dkssudgktpdy" ↔ "안녕하세요" 양방향
  - 두벌식 표준 매핑 + 자모 합성/분해 상태 머신
  - 복합 종성(ㄳ ㄵ 등)·복합 모음(ㅘ ㅙ 등) 정확 처리
- [x] **sns-format** — SNS 글 정리 ✅ 출시 완료 (2026-05-04)
  - 인스타 줄바꿈(U+3164 채움 문자) 보존
  - 해시태그 추출·중복 제거·정리
  - Unicode fancy 글씨 7종 (Bold·Italic·Script·Fraktur·Double-struck·Mono)

**Tier 2 (후순위·스킵 후보, 개발자 대상)**

다음은 만들지 않는 게 ROI 더 좋을 수 있음. 시간 남거나 수익 검증 후 보강용으로만:

- [ ] markdown — 마크다운 미리보기 (개발자·블로거)
- [ ] json-format — JSON 포맷터·검증 (개발자, 광고 차단 많음)
- [ ] url-encode — URL 인코더·디코더 (개발자)
- [ ] case-convert — snake·camel·kebab (개발자)

> **결정**: text 카테고리는 Tier 1 3개로 마감하고 image/로 이동. Tier 2는 **후속 보강 백로그**로 별도 관리. 카테고리 풍성도(7개)보다 ROI(3개) 우선.

### 3.2 현재 진행 상태

- [x] `plan.md` (본 문서)
- [x] `common/site-chrome.js` 면책 banner 정책 — **계산기(/tools/)에서만 노출**. text는 변환·카운트라 정확 → banner 부적절. image/test 등은 카테고리별 정확도 따라 별도 결정 필요
- [x] `text/index.html` 허브 (7카드: counter 활성 + 6 disabled placeholder)
- [x] `text/counter/index.html` + `text/counter/counter.js` 검증 완료 (FAQ DOM 6 = JSON-LD 6 / 태그 밸런스 / 로직 sanity 5 케이스)
- [x] `tools/sw.js` `CACHE_VERSION` v6 → v7 (site-chrome.js banner 정책 변경 전파용)
- [x] `bash scripts/build-sitemap.sh` 재빌드 — text/ 4 URL 추가, 총 41 URL. 빌드 스크립트도 다중 카테고리 지원하도록 확장(`CATEGORIES` 배열)
- [x] `history/index.html` timeline article 3개 추가 (text 신설 + 루트 hub 갱신 + UX fix 라운드)
- [x] `kbd-convert` 도구 출시
- [x] `sns-format` 도구 출시
- [x] 루트 `index.html` 다중 카테고리 hub로 갱신 ("Tools" → "계산기", 텍스트 카드 추가, preview 섹션 한국어화)
- [x] textarea/input 폰트 16px 통일 (iOS Safari 자동 줌 방지) — 3 도구 모두

### 3.3 적용 패턴 (tools/ 일관)

각 도구 디렉토리 — `text/<slug>/index.html` + `text/<slug>/<slug>.js`.

HTML 골격은 tools/ 컨벤션 (HANDOFF.md §5 참고):
- `<head>`: meta·canonical·JSON-LD WebApplication + BreadcrumbList + FAQPage
- `<body>`:
  - `<site-header></site-header>` (면책 banner 자동 표시 — 0.x에서 site-chrome.js 일반화 완료)
  - `<main class="container">`
    - breadcrumb / h1 / subtitle
    - form / result / breakdown / disclaimer
    - tool-article (펼친 표) / disclosure-group (접힘 details)
    - related-calc (관련 도구 6개 — 카테고리 내·외 mix)
    - FAQ (5+) / sources
  - `<site-footer></site-footer>`
  - `<script src="./<slug>.js" defer></script>`
  - `<script src="/common/site-chrome.js" defer></script>`

CSS는 `common/css/style.css` 재사용 (절대 경로 `/common/css/style.css`로 import — 2026-05-05 이관).

### 3.4 SEO 키워드 매핑 (Tier 1)

| 도구 | 핵심 키워드 |
|---|---|
| counter | "글자수 세기", "글자수 카운터", "자소서 글자수", "SNS 글자수" |
| kbd-convert | "한영 변환", "키보드 잘못 친 거", "한영키 안 누르고" |
| sns-format | "SNS 가운데정렬", "인스타 줄바꿈", "특수문자 글씨" |

각 페이지 `<title>`·`<h1>`·`og:title`에 위 키워드 포함.

### 3.5 허브 페이지 (`text/index.html`) — 완료

**현 상태 (2026-05-05)**: 도구 3카드 모두 활성 (counter·kbd-convert·sns-format). Tier 2 도구는 §3.1 결정에 따라 제거됨 (disabled placeholder 미노출). 카운트 표기 "3".

### 3.6 sitemap·robots — 적용 완료

- [x] `scripts/build-sitemap.sh` `CATEGORIES` 배열에 `"text"` 포함 → text/ 4 URL 추가, 41 URL 도달
- [x] 각 도구 페이지 canonical: `https://taystudios.com/text/<slug>/`
- [x] robots.txt 그대로 (Allow: / 이미 적용)

### 3.7 검증 체크리스트 (각 도구) — 모두 통과

- [x] HTML 태그 밸런스
- [x] JSON-LD WebApplication + BreadcrumbList + FAQPage
- [x] FAQ DOM count == JSON-LD count
- [x] 모바일 반응형 (`<meta viewport>` + `.ref-table { overflow-x: auto }`)
- [x] 다크모드 자동
- [x] 면책 banner 미노출 (text/는 결정론적이라 정책상 X)
- [x] sitemap에 추가 (text/ 4 URL)
- [x] common/css/style.css 재사용 (디자인 일관 — 2026-05-05 이관 완료, 모든 카테고리 공유)

---

## 4. 2단계 — `image/` 카테고리 (이미지·PDF)

### 4.1 ROI 평가 + 출시 기록 (9선)

**모든 도구 Tier 1 — 일반인 + 큰 트래픽 + 광고 친화 ✓**. 라이브러리 가벼운 순 출시:

| 도구 | 검색 트래픽 | 정적 가능 | 라이브러리 | 출시 |
|---|---|---|---|---|
| **compress** — 이미지 압축 | ★★★ | ✓ | canvas API (네이티브) | ✅ 2026-05-05 |
| **resize** — 이미지 리사이즈·포맷 변환 | ★★★ | ✓ | canvas API | ✅ 2026-05-05 |
| **qr-gen** — QR 코드 생성 | ★★★ | ✓ | qrcode-generator (~20KB) | ✅ 2026-05-05 |
| **qr-scan** — QR 코드 스캐너 | ★★ | ✓ | jsQR (~251KB) | ✅ 2026-05-05 |
| **pdf-merge** — PDF 합치기 | ★★★ | ✓ | pdf-lib (~513KB) | ✅ 2026-05-05 |
| **pdf-split** — PDF 자르기 | ★★★ | ✓ | pdf-lib | ✅ 2026-05-05 |
| **img-to-pdf** — 이미지 → PDF | ★★★ | ✓ | pdf-lib | ✅ 2026-05-05 |
| **ocr** — 이미지 OCR | ★★ | ✓ (WASM) | Tesseract.js (~65KB + 학습데이터 lazy) | ✅ 2026-05-05 |
| **bg-remove** — 배경 제거 (누끼) | ★★★ | ✓ (WASM AI) | @imgly/background-removal (~82KB + 모델 lazy) | ✅ 2026-05-05 |

**출시 순서 정책**:
- 1차 (canvas 0KB) = compress · resize → 카테고리 인프라(파일 I/O·Blob·드래그/드롭) 검증
- 2차 (작은 lib) = qr-gen · qr-scan → `image/vendor/` 신설 + vendoring 패턴 검증
- 3차 (무거운 lib + WASM) = pdf-merge · pdf-split · ocr → lazy 모델 + IndexedDB 캐시
- 4차 (확장 도구) = img-to-pdf · bg-remove → pdf-lib 재사용 + **사이트 첫 AI 도입(@imgly)**

### 4.2 차별화 핵심

**모든 처리는 브라우저 안에서** — 파일 업로드 X. 각 페이지 프라이버시 박스에 "**파일이 외부 서버로 전송되지 않습니다**" 강조. 프라이버시 민감한 사용자(이력서·개인 PDF·신분증 등)를 끌어들인다. 이게 클론 도구들 대비 가장 강한 차별점이며 광고 친화도도 높임 (체류 시간↑, 신뢰↑).

### 4.3 라이브러리 메모 (vendored — 2026-05-05)

| 도구 | 라이브러리 | repo 크기 | 라이선스 |
|---|---|---|---|
| compress, resize | canvas API (네이티브) | 0 | — |
| qr-gen | `image/vendor/qrcode.min.js` (qrcode-generator) | 20KB | MIT |
| qr-scan | `image/vendor/jsQR.min.js` | 251KB | Apache-2.0 |
| pdf-merge, pdf-split, img-to-pdf | `image/vendor/pdf-lib.min.js` (공유) | 513KB | MIT |
| ocr | `image/vendor/tesseract.min.js` | 65KB | Apache-2.0 |
| bg-remove | `image/vendor/imgly-bg-remove.mjs` (esm.sh ?bundle) | 82KB | AGPL/Commercial |

**Lazy load (CDN + IndexedDB 캐시)** — repo 비대 방지로 vendoring 안 함:
- OCR 학습 데이터·WASM core·worker JS — jsdelivr CDN (한국어 ~13MB)
- bg-remove 모델·ONNX Runtime WASM — staticimgly.com (small=isnet_quint8 ~43MB)
- 두 패턴 동일 — 첫 사용 시 다운로드, 이후 브라우저 캐시로 offline 가능. **사용자 이미지는 어떤 외부로도 전송 X**.

### 4.4 진행 기록

**1차 — canvas 2종 (2026-05-05)**
- [x] `common/css/style.css` 신규 클래스 — `.privacy-box`, `.file-drop-zone`, `.image-preview`, `.image-meta`, `.image-actions`, `.range-row`
- [x] `image/index.html` 허브 + `compress/` + `resize/`
- [x] 루트 hub 카드 + JSON-LD hasPart, sitemap 41 → 44

**2·3차 — QR 2종 + PDF 2종 + OCR (2026-05-05, 일괄)**
- [x] `image/vendor/` 신설 + 4종 vendoring (qrcode 20KB / jsQR 251KB / pdf-lib 513KB / tesseract 65KB)
- [x] `image/qr-gen/` — 텍스트·URL·Wi-Fi → PNG·SVG, 오류복구 L/M/Q/H 선택
- [x] `image/qr-scan/` — 이미지 + 카메라 실시간 스캔, URL/tel/Wi-Fi 자동 분류
- [x] `image/pdf-merge/` — 다중 PDF 누적·정렬 → 병합
- [x] `image/pdf-split/` — `1-3,5,7-10` 범위 파싱 → 새 PDF
- [x] `image/ocr/` — Tesseract.js 한국어/영어 + progress + 페이지 내 disclaimer
- [x] image hub 7선 완성, 루트 "LIVE · 7선", sitemap 44 → 49

**4차 — 확장 (2026-05-05) ★ 사이트 첫 AI 도구**
- [x] `image/img-to-pdf/` — 다중 이미지 정렬 → 1 PDF (A4·Letter·원본 / 방향 / 여백 / 비율 유지). pdf-lib 재사용
- [x] `image/bg-remove/` — @imgly/background-removal AI 누끼 → 투명 PNG. ONNX Runtime Web(WASM) + small 모델 ~43MB lazy
- [x] esm.sh `?bundle`로 ESM-only 패키지 vendoring (`imgly-bg-remove.mjs` 82KB)
- [x] `<script type="module">` 패턴 도입 (사이트 첫 ESM 사용)
- [x] image hub 9선 완성, 루트 "LIVE · 9선", sitemap 49 → **51 URL**
- [x] 검증: HTML 태그 밸런스 / FAQ DOM 6 = JSON-LD 6 (9개 도구 모두) / JS 문법(node + ESM check) / JSON-LD 파싱 / 로컬 200

---

## 4.5 회고 — health/ 카테고리 신설 시도와 통합 결정 (2026-05-05)

한때 `health/` 카테고리를 신설하고 BMR·TDEE 종합 도구를 1선으로 출시 시도. 그러나 기존 `tools/calorie/`와 콘텐츠 90%+ 겹쳐 SERP 자기-경쟁 + 카테고리 정합성 어색함 발견.

**결정** = 계산기 카테고리는 `tools/` 하나로 단일화. health/ 디렉토리 폐지, BMR 종합 분석 콘텐츠는 `tools/calorie/`로 흡수.

### 흡수된 콘텐츠 (이제 tools/calorie/에 있음)
- Mifflin-St Jeor 1990 (메인) + Harris-Benedict 1984 revised (비교값)
- TDEE 5단계 표 — 실제 입력값 기반 (×1.2 / 1.375 / 1.55 / 1.725 / 1.9)
- 감량 −500 / 린 벌크업 +300 + 단백질 1.6g/kg (Morton 2018) + 수분 33ml/kg (KDRI 2020)
- 키·성별별 BMR 참고치 표 (만 30세 기준 6행) + 다이어트 목표별 권장 칼로리 표 (5행)
- FAQ 6 (DOM·JSON-LD 동기) + 출처 5 (Mifflin·Harris-Benedict·Frankenfield·Morton·KDRI)
- `applicationCategory: "HealthApplication"` JSON-LD 갱신
- title·description·keywords 보강 — "기초대사량 계산기"·"BMR"·"TDEE"·"단백질"·"수분" 키워드 풀 확장

### 후속 — 향후 추가 후보 (tools/ 직접 추가)
운동·체력 도구로 확장하고 싶을 때 `tools/`에 직접 추가. **별도 카테고리 분리 X**.
- body-fat — 체지방률 추정 (해군·BMI 기반)
- heart-rate — 운동 심박존 (Karvonen)
- ideal-weight — 표준 체중 (Devine·Robinson)
- 1rm — 1회 최대 반복 (Epley·Brzycki)

각 도구 추가 시 §0.3 3 질문 통과 + §3.7 검증 체크리스트 적용.

---

## 5. 3단계 — `test/` 카테고리 (자기 검사)

### 5.1 ROI 위치 — 보조

- 광고 친화 약함 (단발 사용·짧은 체류). 단가 낮은 광고 노출
- 단점 보완 = **SNS 바이럴**. 결과 페이지에 공유 버튼·또래 백분위 표시
- 사이트 전체 도메인 권한 강화 + 재방문 유도 효과

### 5.2 도구 후보 (5개)

- [ ] **vision** — 시력 검사 (랜돌트 고리, 화면 거리 보정)
- [ ] **color-blind** — 색맹 검사 (Ishihara plates 정적 이미지)
- [ ] **hearing** — 청력 검사 (Web Audio API, 주파수별 들리는지)
- [ ] **reaction** — 반응속도 측정 (랜덤 지연 후 클릭 → ms)
- [ ] **typing** — 한글·영문 타자 속도 (WPM·정확도)

### 5.3 차별화

- 결과 비교 (또래 평균 대비 백분위)
- LocalStorage로 본인 기록 저장 (정적 가능 — 백엔드 불필요)
- 결과 이미지 generation (canvas → blob → 공유)

---

## 5.5 차세대 카테고리 후보 — 브라우저 한계 끌어올리기 (2026-05-05 평가)

§0.2 "정적 한계까지" 정신의 다음 시그너처. tools/text/image 3 카테고리 외 새 hub-card 후보로 평가 끝낸 3개 — 모두 §0.3 3 질문 통과.

### 5.5.1 ROI 비교

| 후보 | SERP | 체류 | 광고 RPM | 정적 가능 | 라이브러리 | 작업량 |
|---|---|---|---|---|---|---|
| 🎬 **video** | ★★★ | ★★ | ★★★ | ✓ WASM | ffmpeg.wasm ~30MB lazy / WebCodecs API (Safari 16+) | 큼 (image/ 수준) |
| 🔊 **audio** | ★★ | ★★★ (백색소음 1시간+) | ★★★ | ✓ 0KB | WebAudio 네이티브 / lamejs ~150KB MP3 인코딩 | 중간 |
| 🔄 **convert** | ★★★ | ★ (단발) | ★★ | ✓ 0KB | 정적 JS 상수 + 환율은 한국은행/ECB 빌드 시 fetch → 정적 JSON | 작음 |

**한 줄 평**:
- **video**: image/ bg-remove로 한 번 증명한 WASM 패턴을 한 단계 위로. plan §0.2 "정적 한계까지" 시각적 증거. 단 iOS Safari 메모리 ~100MB 한계
- **audio**: 백색소음 도구 1개로 사이트 내 가장 긴 체류 시간 dominance — AdSense 노출량 압도. 작업량은 중간이지만 시그너처 1개로 충분
- **convert**: 트래픽은 큰데 단발 사용. 빠른 카드 채우기용. video·audio 다음 순위

### 5.5.2 video — Tier 1 후보 5선

`video/` 카테고리 신설 — **2026-05-05 5선 / 5선 완료**.

| 도구 | 검색 키워드 | 라이브러리 | 상태 |
|---|---|---|---|
| **video-compress** | "동영상 압축"·"영상 용량 줄이기" | ffmpeg.wasm (H.264 + AAC) | ✅ 2026-05-05 |
| **video-trim** | "동영상 자르기"·"영상 트리밍" | ffmpeg.wasm (`-c copy` 빠른 모드 + 재인코딩 정확 모드) | ✅ 2026-05-05 |
| **video-rotate** | "영상 회전·뒤집기"·"세로 영상 가로로" | ffmpeg.wasm (transpose 5종 + audio copy/AAC fallback) | ✅ 2026-05-05 |
| **video-to-gif** | "동영상 GIF 변환"·"짤 만들기"·"움짤 만들기" | ffmpeg.wasm (palette 단일패스 split, stats_mode=diff + bayer dither) | ✅ 2026-05-05 |
| **video-to-mp3** | "영상 mp3 추출"·"동영상 음원 추출" | ffmpeg.wasm (`-vn -c:a libmp3lame`, 96~320kbps 5단계) — 강한 inline 저작권 disclaimer | ✅ 2026-05-05 |

**Vendoring 패턴** = `video/vendor/ffmpeg-loader.mjs` (자체 작성 wrapper) + jsdelivr CDN의 `@ffmpeg/ffmpeg@0.12.10` ESM 동적 import + `@ffmpeg/core@0.12.6` (`.js` + `.wasm`) IndexedDB Blob 캐시 (`taystudio-video` DB / `wasm-cache` store). 첫 사용 시 ~32MB 다운로드, 이후 즉시 시작. 사용자 영상은 외부 전송 X.

**Single-thread 결정** (2026-05-05): GitHub Pages는 응답 헤더 설정 불가 → `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` 미부여 → SharedArrayBuffer 비활성 → **single-thread `@ffmpeg/core` 사용** (multi-thread `@ffmpeg/core-mt` 불가). 트레이드오프 = 처리 속도 0.3~1× (원본 길이 기준). 회피책 = 사용자에게 "데스크톱 권장 + 720p 이하 다운스케일" 안내.

**한계 disclaimer** (페이지 내부 인라인): 첫 사용 ~32MB 다운로드 / Wi-Fi 권장 / iOS Safari ~500MB 메모리 / single-thread 처리 속도. `.first-time-notice` 박스로 노출.

### 5.5.3 audio — Tier 1 후보 5선

`audio/` 카테고리 신설 시 첫 배포.

| 도구 | 검색 키워드 | 라이브러리 | 시그너처 |
|---|---|---|---|
| **white-noise** ⭐ | "백색소음"·"수면 백색소음"·"공부 백색소음" | WebAudio 0KB | 사이트 dominance — 1시간+ 체류 |
| **metronome** | "메트로놈"·"BPM 카운터" | WebAudio | 음악·운동·달리기 페이스 |
| **audio-trim** | "MP3 자르기"·"벨소리 만들기" | WebAudio + lamejs | 시작·끝 자르기 + MP3 export |
| **decibel** | "데시벨 미터"·"소음 측정" | getUserMedia + AudioAnalyser | 마이크 → 실시간 dB |
| **voice-recorder** | "녹음기"·"음성 녹음" | MediaRecorder API | WAV/WebM/MP3 export |

**확장 후보**:
- **tuner** (악기 튜너) — getUserMedia + FFT (음악인 좁음, 후순위)
- **pitch-shift** (음높이 변환) — SoundTouch.js (~100KB)
- **noise-generator** (브라운/핑크 노이즈) — white-noise와 통합

### 5.5.4 convert — Tier 1 후보 6선

`convert/` 카테고리 신설 시 첫 배포. 모두 0KB.

| 도구 | 검색 키워드 |
|---|---|
| **length** | "인치 cm 변환"·"피트 m" |
| **area** | "평 ㎡ 변환" — 한국 부동산 매우 큼 |
| **temperature** | "섭씨 화씨"·"℃ ℉" |
| **weight** | "lb kg"·"근 g" |
| **timezone** | "세계시간"·"시차 계산기" — 출장·해외 친구 통화 |
| **exchange** | "환율 계산기" — 한국은행 일일 데이터 빌드 시 fetch (실시간 X) |

**확장 후보**: volume(L gal·홉)·color(HEX RGB·디자이너 좁음 §0.4 reject)·encoding(URL Base64·개발자 §0.4 reject)

### 5.5.5 진입 순서 권장

`video → audio → convert` 또는 `audio → video → convert`. 단순 ROI = video. 단 작업량 큼.

**시그너처 1개만 출시**도 옵션:
- audio/ 만 만들고 첫 도구 = **white-noise** 1선만으로 시작 → 트래픽·체류 데이터 본 후 확장
- 카테고리 신설은 부담이지만 도구 1개라 작업량 작음. ROI 검증 단계로 적합

### 5.5.6 카테고리 분리 vs tools/ 흡수 — 결정 기준

§9.1 "카테고리 단일화" 결정과의 정합성 검토:
- **tools/ 흡수 가능** = 입력 1개 → 결과 1개 (계산기 패턴). convert/ 도구 대부분 해당
- **새 카테고리 필요** = 파일 처리·미디어 캡처·체류 긴 도구. video·audio 도구 대부분 해당
- **결론**: video·audio = 새 카테고리(파일/미디어 도메인 X 계산기), convert = tools/ 흡수 가능 (§5.5.6 재검토 후 결정)

---

## 6. 후속 카테고리 (보류 — 1~3단계 결과 본 후 재평가)

- `luck/` — 운세·이름·궁합 (MBTI 호환성, 81수리 작명)
- `quiz/` — 운전면허 필기, 한국사, 영단어
- `random/` — 사다리·룰렛·메뉴 추천
- `track/` — 가계부·운동·메모 (IndexedDB local-first)

각각 트래픽 큰 키워드 포함하지만 콘텐츠 톤이 utility와 약간 달라서 우선순위 낮춤. **수익 검증된 후 진입 결정** — 1~3단계가 AdSense 승인·수익 만들어내면 그 자본으로 다음 카테고리 결정.

---

## 7. 공통 정책 (모든 카테고리)

### 7.1 콘텐츠 깊이 (CONTENT_DEPTH.md 참고)

각 도구 페이지에 GPT 평가 6항목 — E-E-A-T 정책·SEO·사용자 만족 동시 충족:
1. 최종 업데이트 날짜 (`<div class="updated">`)
2. 기준 법령·공식·출처 (text는 위키·표준 문서 인용 가능)
3. 계산식·동작 설명
4. 예시 2~3개
5. FAQ 5개+ (JSON-LD FAQPage 동기화)
6. 관련 도구 내부링크

### 7.2 면책 banner

**정책**: `common/site-chrome.js`의 banner ("모든 계산은 참고용 추정치")는 **계산기(/tools/)에서만 표시**.

- **tools/**: 세율·법령 기반 계산이라 추정치 면책 필수 → 사이트 banner 표시 ✓. 단 `tools/calorie/`(BMR/TDEE)·`tools/bmi/` 등 건강 계산기는 사이트 banner 위에 페이지 내부 `.disclaimer`로 의료 진단 대체 X 추가 명시
- **text/**: 변환·카운트는 결정론적·정확 → 사이트 banner 미표시
- **image/**: 6개 도구(compress·resize·qr-gen·qr-scan·pdf-merge·pdf-split)는 결정론적 → 사이트 banner 미표시. **OCR은 정확도 변수라 페이지 내부 인라인 disclaimer 박스(`.ocr-disclaimer`)로 별도 처리** — 사이트 banner 정책은 안 건드림
- **test/**: 시력·청력 측정은 의료 진단 대체 X → 페이지 내부 별도 disclaimer 권장 (image/ocr 패턴 재사용)

새 카테고리 추가 시 정확도 성격 따라 banner 정책 결정 후 `isToolsPage()` 수정.

### 7.3 SEO

- 각 페이지 canonical
- JSON-LD WebApplication + BreadcrumbList + FAQPage (image 9 도구는 featureList + dateModified + softwareVersion 추가됨)
- 루트 `index.html`에 Organization JSON-LD (브랜드 쿼리·Knowledge Panel 후보)
- 카테고리 허브에서 ItemList JSON-LD (image hub 적용 완료, text·tools에도 검토)
- sitemap.xml 자동 빌드 (`scripts/build-sitemap.sh` — `CATEGORIES=("tools" "text" "image")` 배열 + classify 분기, 새 카테고리 추가 시 두 군데 갱신)
- **og:image / twitter:image** = `/og-image.png` 1200×630 (svg 원본은 `/og-image.svg`). 모든 HTML head에 일관 적용 필수 — 카톡·X·페이스북 공유 시 미리보기. twitter:card는 `summary_large_image`. 새 도구 추가 시 head 템플릿에 og:image 4종(image·width·height·alt) + twitter:image 누락 X
- **SEO 전략·체크리스트**: `history/seo/strategy.md` 참조 (Tier 1·2·3 우선순위, 새 도구 18항목 체크리스트, 한국 시장 채널별 시그널)

### 7.4 SW 캐시

`common/site-chrome.js` 또는 `common/css/style.css` 변경 시 `tools/sw.js`의 `CACHE_VERSION` 한 단계 올림. 현재 v8 (2026-05-05, CSS 이관 시 bump). 새 카테고리(text/·image/)는 sw.js 등록 안 함 — PWA 통합은 후속 백로그(§9.3 A안) 시점에 일괄 처리.

### 7.5 AdSense·쿠팡

- 각 도구 페이지에 `<div class="ad-slot">` placeholder
- 텍스트 도구는 콘텐츠 광고 친화 (큰 광고 X, 작은 inline)
- 이미지 도구는 사이드 광고 가능 + 결과 다운로드 직전 인터스티셜 검토
- 운세·게임은 거슬리는 광고 권장 X (UX 손상)

---

## 8. 작업 흐름 (각 단계)

1. 카테고리 디렉토리 생성 (`test/` 등)
2. 라이브러리 필요 시 `<category>/vendor/`에 vendoring (jsdelivr 다운로드 → commit)
3. `index.html` 허브 작성 (Tier 1 도구만 활성, Tier 2는 disabled 또는 제거) + JSON-LD ItemList
4. Tier 1 도구 페이지 + JS 작성 (1개씩 검증)
5. 면책·정확도 disclaimer 정책 결정 — 결정론적이면 banner X, 정확도 변수면 페이지 내부 `.ocr-disclaimer` 패턴 재사용
6. `scripts/build-sitemap.sh` `CATEGORIES` 배열 + classify 분기 갱신 → 재빌드
7. PWA 캐시 버전 올림 (`common/css/style.css`·`site-chrome.js` 영향 변경 시 — 카테고리 추가 자체로는 v 안 올림)
8. CONTENT_DEPTH.md 패턴 적용 (FAQ 6+·예시·관련 도구·sources)
9. 루트 `index.html` hub-card·hasPart·preview 섹션 추가
10. `tools/privacy/` 카테고리별 데이터 처리 줄 추가 (필요 시)
11. `history/index.html`에 timeline article 추가
12. 검증: HTML 태그 밸런스·JSON-LD 파싱·FAQ DOM=JSON-LD·JS `node --check`·로컬 서버 200

---

## 9. 결정·보류 사항 (현재 시점)

> **§9 유지 룰 (그라운드 룰)** — 다음 세션도 동일하게 유지:
> - **§9.4 (다음 세션 진입 후보) = TODO 큐**. plan 맨 아래 유지. 새 작업·미완료 작업은 여기 추가
> - **§9.1 (결정됨) = 완료 기록**. §9.4 항목 완료 시 그 위(§9.1)로 이동·요약. 즉 **"한 것들은 위로, 할 것들은 아래로"**
> - **§9.2 (보류 — 사용자 결정 필요)** / **§9.3 (후속 백로그)**: 결정 후 §9.1·§9.4 어디로 갈지 분기
> - 시간 역순 X — **의미 단위(완료/TODO/보류/백로그)** 로 분류

### 9.1 결정됨

- **IndexNow 인프라 도입 — 67 URL 일괄 push (2026-05-07)**: Search Console URL 색인 요청 일일 ~10건 한도 + Naver Search Advisor sitemap pull 며칠 lead time 우회 목적. **IndexNow = HTTP POST 1번으로 Bing·Yandex·Naver(2024 합류)·Seznam 4 엔진 동시 push**. 정적 사이트 친화 — 백엔드 0, key 파일 1개 + bash 스크립트 1개. 도구 수·카테고리·sitemap 변동 0.
  - **결정 배경**: ① SC 일일 한도로 67 URL 일괄 색인 X ② Naver sitemap pull 며칠 lead time → 한국 시장 매출 직결인데 색인 지연 ③ Naver 2024년 IndexNow 합류로 한국 시장 ROI 결정적 ④ Google은 IndexNow 미지원이지만 sitemap·SC로 cover 중
  - **구현 결정**:
    - **endpoint** = `https://api.indexnow.org/indexnow` (Bing hub, 단일 POST로 4 엔진 relay)
    - **key 발급** = UUID 32자 lowercase hex(`b762f70e61da4ac199b51566e31748b3`). 충돌 가능성 0, 스펙(8~128자) 준수
    - **key 위치** = 루트 직속 `{key}.txt` (관행 + 일부 엔진 자동 추측)
    - **스크립트 분리** = `indexnow-ping.sh` standalone + `build-sitemap.sh` hook (단일 책임 + 재시도 가능)
    - **default 동작** = hook ON, `INDEXNOW_PING=0` env로 opt-out (까먹음 방지 + commit 전 우회)
    - **dry-run 옵션** = `--dry-run` 플래그로 비가역 작업 사전 검증 (rate limit 한계 상 디버깅 비싼 보안)
    - **fail 처리** = fail-soft (`||` 경고). sitemap 빌드와 ping 책임 분리 — ping 실패가 sitemap 결과 무효화 X
  - **인프라 일괄** ① `b762f70e61da4ac199b51566e31748b3.txt` 신규 (루트, key 1줄) ② `scripts/indexnow-ping.sh` 신규 99줄 (sitemap → JSON payload → POST + HTTP 코드 분기) ③ `scripts/build-sitemap.sh` +7줄 (sitemap 빌드 후 자동 ping hook) ④ `robots.txt` +3줄 (key location 주석, 관행 hint) ⑤ `history/seo/concept-indexnow.html` 신규 312줄 (메커니즘·적용 단계·의미 정리, noindex 운영자 전용)
  - **검증** = shell syntax ✓ / dry-run 67 URL 추출 ✓ / JSON valid ✓ / `image/upscale/`(noindex 봉인) 자동 제외 ✓ / `tools/storage/` 정상 포함 ✓ / Deploy 후 `curl https://taystudios.com/{key}.txt` HTTP 200 + 정확한 key body ✓ / **실 ping 응답 = HTTP 202 Accepted (67 URLs queued)** ✓
  - **향후 자동화 흐름**: 새 도구 출시 시 `bash scripts/build-sitemap.sh` 한 번 = sitemap 갱신 + IndexNow ping 자동. `INDEXNOW_PING=0`으로 끄고 sitemap만 빌드 가능
  - **효과 측정** (사용자 후속, 1~3일 lead time): Bing Webmaster Tools 가입 권장 → "Submitted via IndexNow" 카운터 + 인덱스 수 변화 / Naver Search Advisor(이미 등록) 수집·색인 메뉴 신규 URL 등록 속도 / `site:taystudios.com` Bing·Naver 결과 수 변화. **직접 인덱스 카운트는 IndexNow API 응답에 없음** (큐 진입만 보고, 사후 검색엔진별 도구로 검증)
  - **학습 포인트**:
    - **정적 사이트도 push-protocol cover 가능** — sitemap = pull 모델, IndexNow = push 모델(보통 백엔드 필요)인데 CLI 1회 실행 = "필요할 때 push 한 번" cron-less ping으로 정적 사이트가 push 패턴 cover. **§0.2 정적 한계까지 끌어올린다 정신 구체 사례**
    - **단일 진입점 통합 가치** — sitemap 빌드와 ping을 하나의 명령으로 묶으면 사용자 mental model 단순화 + 까먹음 방지
    - **비가역 작업 = dry-run 필수** — IndexNow ping은 취소 X + rate limit. 첫 실 전송 전 dry-run = 시간·비용 0의 안전망
    - **fail-soft 디자인** — 책임 다른 두 동작(빌드·ping)을 한 명령으로 묶을 때 한 쪽 실패가 다른 쪽 결과 무효화하면 안 됨
    - **개념 문서 = HTML 우선** — markdown(seo/concepts.md)도 좋지만 다이어그램·표·callout 풍부한 문서는 HTML이 가독성 압승
    - **Naver IndexNow 합류(2024)는 한국 시장 결정적** — 그 전 한국 cover 부재로 IndexNow ROI 약했음. 2024 이후 한국 단일 사이트라도 ROI 큼
  - **Bing Webmaster Tools 가입 진행 (2026-05-07)** — IndexNow 효과 가시화 채널 확보. **소유권 검증 = meta 태그 방식**(기존 google-site-verification·naver-site-verification 패턴과 일관) → `index.html` `<head>` 12번 줄에 `<meta name="msvalidate.01" content="064396E810073C47308AEC058EDC3846" />` 추가. 루트 1페이지만 적용(Bing이 도메인 root만 fetch해서 검증 → 도메인 전체 권한 부여). XML 파일 방식(`BingSiteAuth.xml`)은 fallback이라 미적용. **commit/push + Bing 콘솔 "Verify" 클릭으로 검증 완료 예정**(사용자 액션 대기)
  - **후속 백로그**: ~~Bing Webmaster Tools 가입~~(2026-05-07 진행 중, 검증 대기) / 다음 검색 등록(점유 ~5%, 무료) / IndexNow 신규 URL만 ping 변형(URL 100+ 도달 시 git diff 기반 추출) / Naver Search Advisor IndexNow 활성화 상태 콘솔 확인
  - **history 문서** = `history/seo/2026-05-07-indexnow.md` 신규 + `history/seo/concept-indexnow.html` 개념서 (운영자 전용 noindex)

- **저장공간 계산기 출시 — `tools/storage/` + 디지털·기기 카테고리 신설 (2026-05-06)**: 쿠팡 파트너스 친화 도구 톱 1순위(`history/candidate/coupang-affiliate-tools.md`) 채택. 영상·사진 용량 추정 + 외장 SSD/HDD/NAS 권장 카테고리 자동 추천. 사이트 첫 "쿠팡 추천 친화" 도구 = 향후 어필리에이트 카드 자리 확보. 도구 수 58 → **59선**, 계산기 36 → **37선**, sitemap 66 → **67 URL**, tools 카테고리 7 → **8개**.
  - **결정 배경**: ① 톱 2(저장공간·모니터) 중 작업 가장 작음(1~2h) → 사용자 머지 검토 단위 작게 ② video/ 도구 사용자와 자연 연결(영상 압축 → 외장하드) ③ SERP 빅키워드("4K 영상 용량"·"외장하드 추천"·"SSD 1TB 가격") ④ 쿠팡 승인 전이라도 도구 자체 출시 ROI 있음(정보성 권장 카테고리 표시)
  - **추천 카드 결정 — 텍스트 권장만**: A(쿠팡 카드 placeholder hide)·B(정보성 카드+검색 링크)·**C(결과 영역 텍스트 권장만)** 중 C 채택. 출시 단순화 + 어필리에이트 카드 추가는 쿠팡 승인 후 별도 작업으로 명확 분리. AdSense 미승인 hide 패턴과 동일 정신
  - **카테고리 신설 — 🖥️ 디지털·기기**: 저장공간(이번)·모니터(2순위 후보)·기타 IT 가이드는 기존 7 카테고리 어디에도 핏 X. **§0.4 "수익 약함 채우기" 패턴은 ★★★ 단가 + 모니터 묶임 예정으로 미해당** = 카테고리 신설 정당. hub pill·section 모두 건강 다음, 생활 직전. 카테고리 7 → 8개
  - **도구 페이지 구조**: meta·OG·JSON-LD WebApplication(UtilitiesApplication)+BreadcrumbList(3 depth)+FAQPage(6Q) / form 모드 select(영상/사진/직접) + 모드별 동적 필드 / 영상 모드(시간 + 12종 비트레이트 프리셋: 4K H.264~ProRes 422·폰 4K HDR·액션캠 100Mbps) / 사진 모드(장수 + 8종: DSLR RAW~iPhone ProRAW) / result(원본 GB + 권장 GB×1.5 편집 캐시·여유 + 권장 카테고리 텍스트 + 가격대·용도 메모) / 3 tool-article(영상 9행·사진 8행·권장 8단계 표) / FAQ 6 / sources(YouTube 권장 비트레이트·Apple ProRes·DJI/GoPro·Adobe Lightroom·Apple ProRAW) / related-calc cross-cat 6
  - **권장 저장장치 카테고리 (8단계)** = ~64GB SD카드 → 256GB SSD → 512GB SSD → 1TB SSD/HDD → 2TB HDD → 4TB HDD → 8TB HDD/NAS 2-bay → NAS 4-bay 12~16TB+. 가격대 2026 한국 온라인 평균
  - **인프라 일괄** ① `tools/storage/index.html`+`storage.js` 신규 ② `tools/index.html` ItemList 36 → 37, pill·section "🖥️ 디지털·기기" 신설(건강 다음·생활 직전), hub-intro·count·title·og·twitter·description 모두 "37선" ③ root `index.html` og·twitter·title·description·keywords 모두 "계산기 37선·59 도구", JSON-LD WebSite description 37선 + Organization 59선, hub-card "LIVE · 37선" + desc 갱신, quick-list 계산기 row "저장공간" 추가 ④ `manifest.webmanifest` "58가지 → 59가지(저장공간 계산기 신규)" ⑤ `privacy/index.html`·`terms/index.html` 시행일 갱신 + terms 1조 도구 수 "37종(건강 5·디지털 1)·59종" ⑥ `sw.js` `CACHE_VERSION` v10 → **v11** ⑦ sitemap rebuild 66 → **67 URL** ⑧ history `2026-05-06-storage-calculator.md` 신규
  - **검증** = JS syntax ✓ / JSON-LD parse ✓ / FAQ DOM=JSON 6/6 ✓ / HTML 태그 밸런스 ✓ / sitemap 67 URL + /tools/storage/ 등재 ✓
  - **후속 백로그**: 모니터 해상도·인치 변환(2순위 후보, 디지털·기기 2번째 도구) / 쿠팡 파트너스 승인 후 추천 카드 영역 추가 / 영상+사진+직접 동시 합산 모드 / 클라우드 vs 외장 5년 TCO 자동 비교 / 영상 편집 프록시 ×2~3 토글
  - **history 문서** = `history/seo/2026-05-06-storage-calculator.md` 신규
- **AI 이미지 업스케일링 봉인 — image/upscale/ 일시 비공개 (2026-05-06)**: 출시 직후 사용자 검증("맥북에서도 버벅거림·연산량 못 따라감") → 봉인 결정. TF.js + ESRGAN WebGL 추론이 정적 사이트 차원에서 부적합 — 메인 스레드 점령으로 UI freeze. patchSize·padding·model variant·setTimeout yield 등 fix 시도했지만 근본 해결 X.
  - **봉인 처리** ① `image/upscale/index.html` = `<meta robots="noindex">` + 본문을 점검 안내(seal-card)로 교체 — "AI 모델 무거움 → WebGPU·Worker·작은 모델 준비 후 재공개" 명시 + 다른 image 도구 link ② `image/upscale/upscale.js`·`image/vendor/upscale-loader.mjs` **보존** (재활성 시 즉시 부활) ③ `image/index.html` ItemList 10 → 9, tool-grid 카드 제거, hub-intro·count·hub-faq 모두 9선 ④ root `index.html` og·twitter·title·description·keywords 모두 "이미지 9선·58 도구"로 복귀, JSON-LD hasPart 이미지 desc 9선, hub-card "LIVE · 9선" + desc 복원, Organization 58선, quick-list 이미지 row "AI 업스케일" 제거 → "압축" 복귀 ⑤ `manifest.webmanifest` "59가지 → 58가지" ⑥ `privacy/index.html` 시행일 + AI 업스케일 CDN 줄 제거 ⑦ `terms/index.html` 1조 도구 수 "59종 → 58종" + 2조 AI 도구 면책에서 업스케일 제거 ⑧ `sw.js` v9 → **v10** ⑨ sitemap rebuild 67 → **66 URL** (noindex 자동 제외)
  - **재공개 조건** (모두 충족 시):
    - **WebGPU backend 안정화** — TF.js WebGPU adapter 정식 지원 + 모바일 호환성 확인. WebGL 대비 GPU sync 비용 1/5
    - **또는 Web Worker + OffscreenCanvas로 추론 분리** — 메인 스레드 freeze 완전 해소. 단 TF.js WebGL은 worker에서 직접 안 돼 OffscreenCanvas 필요. 작업량 큼
    - **또는 더 작은 모델·다른 라이브러리 검증** — 예: ONNX Runtime Web + tile-based inference, 또는 transformers.js 기반 작은 SR 모델
  - **학습 포인트**:
    - **AI WASM·WebGL 추론 ≠ 정적 사이트의 강점** — bg-remove(@imgly·ONNX runtime·single inference)는 동작하지만, ESRGAN처럼 patch 기반 반복 추론은 메인 스레드 점령. AI 도구도 작업 패턴 따라 적합도 다름
    - **모델 사이즈가 곧 처리 부하 X** — slim 모델(~3MB)도 ESRGAN architecture는 동일하게 patch당 GPU sync 비용. patchSize·padding·yield 모두 시도해도 한계
    - **사용자 검증의 중요성** — 자동 검증(JS·HTML·sitemap) 모두 통과해도 실제 UX는 별개. "대기 중" 표시 = 출시 부적합 신호
    - **봉인 패턴 정착** — 페이지 noindex + 본문 안내 + vendor 보존 = 깔끔한 봉인. 향후 다른 도구도 검증 실패 시 동일 패턴 적용
  - **history 문서** = `history/seo/2026-05-06-image-upscale-sealed.md` 신규
- **AI 이미지 업스케일링 도구 출시 — image/upscale/ (2026-05-06, 같은 일자 봉인)**: 사용자 "기능적·정적·SEO 큰 다음 도구" 요청 → 매트릭스 평가 후 채택. 사이트 두 번째 AI 도구(bg-remove에 이은). image 9 → **10선**, 사이트 58 → **59선**, sitemap 66 → **67 URL**. **단 출시 직후 검증에서 브라우저 freeze 심해 같은 일자 봉인 → 9선·58선·66 URL로 복귀** (위 항목 참조).
  - **결정 배경**: ① 클라우드 클론(Topaz Photo AI 유료·Let's Enhance 클라우드·waifu2x.io 클라우드) 대비 정적·프라이버시 차별화 정확히 적중 ② SERP 빅키워드 ("AI 사진 복원"·"흐린 사진 선명하게"·"사진 해상도 높이기"·"옛날 사진 복원") ③ bg-remove에서 검증한 AI WASM·CDN+캐시 패턴 그대로 재사용 → 작업량·인프라 통일 ④ image/ 카테고리에 자연스럽게 fit (별도 카테고리 신설 부담 X)
  - **구현 결정 — A2 채택** (A1 정통 64MB ONNX 직접 vs **A2 upscaler.js + esrgan-thick 17MB**): 첫 다운 부담 1/3 (66MB → 20MB) + 작업 시간 1/3 (라이브러리 API vs 직접 추론 코드) + 사진 품질 인지 차이 거의 X (~95%). 추후 결과 부족하면 ONNX x4plus 마이그레이션 옵션 (vendor 교체만)
  - **vendor — `image/vendor/upscale-loader.mjs`** (자체 wrapper, video/ffmpeg-loader.mjs 패턴 차용): TF.js + upscaler.js + esrgan-thick 4x 모델을 jsdelivr `+esm` 동적 import + singleton + warmup. `loadUpscaler()`·`upscale4x()`·`getUpscaleLogs()`·`getEnvSnapshot()`·`formatUpscaleError()` 헬퍼 export. 첫 다운 = TF.js ~3MB + upscaler ~50KB + 모델 ~17MB = 합계 ~20MB
  - **도구 페이지 구조** (bg-remove 패턴 재사용): meta·OG·JSON-LD WebApp+BreadcrumbList+FAQ(6Q)+HowTo(4 step) / privacy box / ai-disclaimer (~20MB Wi-Fi 권장 + 입력 1000~1500px 권장) / 출력 옵션(PNG/JPG + 품질) / progress(init→tfjs→upscaler→model→warmup→compute 50~95%) / 원본·결과 좌우 비교 preview / tool-article (잘 복원되는 사진 vs 한계 5행 표) / disclosure (라이브러리·CDN·WebGL·메모리 팁·모델 옵션) / sources (ESRGAN paper ECCV 2018 + upscaler.js MIT + TF.js Apache 2.0)
  - **UX 가드**: 입력 픽셀 > 1500×1500 = confirm 안내 ("결과 ${4w}×${4h} = OOM 위험") + JPG 품질 select은 PNG일 때 disabled
  - **인프라 일괄** ① `image/index.html` ItemList 9 → 10, tool-grid 카드 추가, hub-intro·count·hub-faq·subtitle·meta description 모두 "10선" ② root `index.html` og·twitter·title·description·keywords 모두 "이미지 10선·59 도구", JSON-LD hasPart 이미지 desc, hub-card "LIVE · 10선" + desc, Organization "59선", quick-list 이미지 row에 "AI 업스케일" 첫 자리 추가(트래픽 큰 신규 우선) ③ `manifest.webmanifest` "58가지 → 59가지" + AI 업스케일 명시 ④ `privacy/index.html`(root) 시행일 + CDN 줄에 jsdelivr·TF.js·upscaler.js·ESRGAN 추가 ⑤ `terms/index.html`(root) 시행일 + 1조 도구 수 "58종 → 59종" + 2조 AI 도구 면책에 업스케일 추가 ⑥ `sw.js` `CACHE_VERSION` v6 → **v7** ⑦ sitemap rebuild 66 → **67 URL** ⑧ history `2026-05-06-image-upscale.md` 신규
  - **검증** = JS syntax 2/2 ✓ / JSON-LD parse ✓ / FAQ DOM=JSON 6/6 ✓ / HTML 태그 밸런스 ✓ / sitemap 67 URL + /image/upscale/ 등재 ✓
  - **후속 백로그**: Real-ESRGAN x4plus ONNX 정통 모델(~64MB) 옵션 토글 / GFPGAN 얼굴 복원(~340MB, 인물 특화) / esrgan-slim 5MB(애니/일러스트) / WebGPU backend (TF.js adapter 안정화 후, 처리 속도 2~5배) / IndexedDB 모델 캐시 모바일 검증
  - **history 문서** = `history/seo/2026-05-06-image-upscale.md` 신규
  - **2026-05-06 후속 fix — 가벼운 기본 옵션·다중 모델 토글** (사용자 피드백 "맥북에서도 렉걸림"): ① **모델 토글 — esrgan-slim(빠름·~3-5MB)·esrgan-thick(고품질·~9-17MB)** 둘 다 vendoring, 기본 slim ② **배율 토글 2x·4x**, 기본 2x ③ patchSize 64 → **모바일 128 / 데스크톱 256 자동**(UA 감지) ④ warmup 제거(첫 patch 추론에 합쳐짐 — 속도 우선) ⑤ instance 캐시 = `${variant}-${scale}` 키 Map (옵션 변경 시 재로드 X) ⑥ 기본 첫 다운 = TF.js 3MB + upscaler 50KB + slim 2x 모델 3MB = **~6MB** (기존 ~20MB 대비 1/3) ⑦ 처리 속도 데스크톱 ~30s → **~3~6s** (기본 옵션, ~10배 ↑). thick 4x 선택 시만 ~17MB·~25s 부담. UI = 품질 select + 배율 select 2개 추가, FAQ에 모델·배율별 다운·처리 시간 표 (4 조합), index.html ai-disclaimer "⚡ 빠른 모드 기본" 갱신. SW v7 → **v9** bump (common/* 변경)
- **privacy·terms root 이전 — SEO 위치 정합성 (2026-05-06)**: `/tools/privacy/`·`/tools/terms/` → `/privacy/`·`/terms/`. 사용자가 footer 정책 페이지 위치 SEO 검토 요청 → root 이전 합의 후 실행. 도구 수·카테고리 변동 0.
  - **결정 배경**: ① **URL 의미 충돌** = `/tools/`는 "계산기" 카테고리, privacy/terms는 사이트 전체 정책 → 의미 부조화 ② **AdSense·표준 관행** = 주요 사이트 100% root 직속(`/privacy/`·`/terms/`) ③ **카테고리 권한 분산** = `/tools/` backlink/권한이 정책 페이지로 새는 미세 손실 ④ **breadcrumb·동선** = "도구 → 개인정보처리방침"은 어색, footer→정책 흐름에 `/tools/` 노출도 직관 어긋남. **단 SEO 영향 작음** = 정책 페이지는 검색 트래픽 거의 0, 사이트 신뢰 시그널은 존재 자체가 핵심 → 그래도 "지금부터 깔끔하게" 정리할 가치 있음
  - **신규 위치** `/privacy/index.html`·`/terms/index.html` (이전 본문 그대로 복사) — og:url·canonical → `/privacy/`·`/terms/`, breadcrumb `<a href="/">TAYSTUDIO</a>` (정책은 도구 하위 아님), related-nav 첫 link `../index.html`(root에서 깨짐) → `/tools/` 절대경로
  - **redirect stub — soft refresh 패턴 재사용** (이전 PDF 카테고리 분리·image→pdf 이전과 동일): `tools/{privacy,terms}/index.html`을 짧은 stub HTML로 덮어쓰기 = `<link rel="canonical">` 신규 위치 + `<meta http-equiv="refresh" content="0">` + `<meta name="robots" content="noindex">` + `<script>location.replace('/...')</script>` + body에 안내 문구. GitHub Pages는 301 헤더 불가 → 4계층 안전망. Google이 soft redirect로 인식해 equity 일부 이전 + 자연 deindex(수개월). **Search Console 후속**(사용자 작업) = 신규 URL 색인 요청 + sitemap 재제출
  - **`common/site-chrome.js` 일괄 갱신** ① footer 2 link `tools/privacy/`·`tools/terms/` → `/privacy/`·`/terms/` ② banner "자세히" link `tools/terms/` → `/terms/` ③ `isToolsPage()` 정규식 `/\/tools\/(privacy|terms|404)\b/` exception **유지**(stub은 즉시 redirect하지만 JS-blocked 환경 안전망 + privacy/terms 본문이 root로 가도 stub은 banner 부적절)
  - **`scripts/build-sitemap.sh` 갱신** = `ROOT_PAGES=("privacy" "terms")` 신규 배열 + Root index 처리 직후 walk 블록 추가 (`for slug in "${ROOT_PAGES[@]}"; do file="${slug}/index.html"; ...`). 이유 = 기존 walk는 카테고리(tools/text/image/pdf/video) 하위만 순회해서 root 직속 단일 페이지는 자동 픽업 X → 재실행 시 사라지지 않도록 명시 등록. **재실행 결과 = sitemap 66 URL 그대로** (옛 `/tools/{privacy,terms}/`는 stub의 noindex 메타로 `is_noindex()`가 자동 제외 + 신규 `/privacy/`·`/terms/`는 root walk로 등재)
  - **검증** = canonical/og:url 4파일 일치 ✓ / stub 4계층(refresh + canonical + noindex + JS replace) 모두 적용 ✓ / 잔존 `/tools/{privacy,terms}/` 참조 = site-chrome.js 주석 1건뿐(정상) / `isToolsPage()` 11/11 케이스 PASS — banner 노출 의도대로(`/tools/{privacy,terms}/` stub·`/privacy/`·`/terms/` 모두 false, 36 계산기 도구는 true)
  - **SW** = `CACHE_VERSION` 이전 isToolsPage 수정 시점에 v4→**v5** 이미 bump 완료(common/* 변경 정책). STATIC_ASSETS는 자연 캐싱(privacy/terms는 hub 아니라 등재 X)
  - **history 문서** = `history/seo/2026-05-06-legal-pages-root-move.md` 신규
- **검증 라운드 — image 9선 + pdf 5선 자동 검증 + UX 보강 (2026-05-06)**: 사용자 요청으로 image+pdf 도구 전부 자동 검증·정적 분석 + crop·id-photo UX 피드백 라운드(영역 분리·sticky 제거).
  - **자동 검증 통과**:
    - JS syntax 14/14 ✓ (image 9 + pdf 5)
    - JSON-LD parse 17/17 ✓ (도구 14 + hub 2 + root)
    - canonical·og:url 일관성 17/17 ✓
    - FAQ DOM = JSON-LD count 17/17 ✓
    - HTML 태그 밸런스 17/17 ✓
    - HTTP 200 30/30 ✓ (도구·hub·vendor·sitemap·sw·manifest)
    - redirect stub 3/3 ✓ (canonical + meta refresh + noindex 모두 적용)
    - 잔존 0 (옛 vendor 경로·cross-link·sitemap stub URL 0건)
    - BreadcrumbList·og:image·viewport meta 일관성
  - **정적 분석**:
    - BlobURL revoke 누락 0건 (우리 코드)
    - PointerEvents capture 누수 0 (crop·id-photo set=release=1, pdf-edit는 HTML5 native drag API 사용으로 capture 불필요)
    - pdf.js worker URL 경로 정상
    - async/await catch 패턴 적정 (큰 처리는 try/finally + alert 보호, 작은 await는 unhandledrejection만)
  - **crop·id-photo UX 보강** (사용자 피드백 4 라운드):
    - 1차: 옵션 변경 후 사진 보려고 스크롤하는 문제 → 데스크톱 grid 2열 + 모바일 사진을 옵션 위로 (CSS `order`) → 사진 sticky 시도
    - 2차: "구간 구분 안됨, sticky 정신없음" → sticky 제거 + 옵션 영역에 fieldset 박스(⚙ 옵션 라벨 + border + 다른 배경)
    - 3차: "info·자르기 옆에 빈 공간" → grid-template-areas 변경, info·act를 풀 너비로 (사진 아래 가로로 펼침)
    - 4차: "가로 사진 작아 보임" → column 320px·container 1280px·canvas width 100% 토글 시도 → 세로 사진 비율 깨짐(canvas는 max-width+max-height 동시 적용 시 비율 자동 유지 X) → 원복
    - **최종 상태** = 데스크톱 grid 2열(좌측 옵션 박스 / 우측 사진) + info·act 풀 너비 사진 아래 + sticky 0 + 모바일 사진 위/옵션 아래(CSS order)
  - **자동 검증으로 못 잡는 부분 (사용자 실 파일 검토 필요)**: 실제 HEIC 변환 화질, crop drag rect 정밀도·터치 영역, pdf-edit drag&drop 모바일 동작, pdf-to-image DPI별 화질, id-photo 가이드 라인 자연스러움
  - **history 문서** = `history/seo/2026-05-06-verification-round.md` 신규
- **이미지 카테고리 Tier 1 신규 3종 — heic-to-jpg · crop · id-photo (2026-05-06)**: 사용자 요청(13가지 이미지 도구 후보 검토 후 "SEO 최적화 + 직관적·적당한 선" 위임 결정)으로 image/ 6 → **9선** 확장. 도구 수 55 → **58선**, sitemap 63 → **66 URL**. 카테고리 5개 그대로.
  - **결정 배경 (16개 후보 → 3선 + merge·skip 분류)**:
    - **추가** 선정 = HEIC→JPG (★★★ 한국 iPhone 사용자), crop (★★★ 트래픽), id-photo (★★★ **광고 단가 가장 높음** — 한국 시장 특화)
    - **이미 있음 (그대로)** = 압축·리사이즈·QR 생성/인식·OCR·배경 제거 — 6선 그대로
    - **merge** = 이미지 포맷 변환(JPG/PNG/WebP)은 resize에 이미 있음 / 픽셀 사이즈 확인은 resize에 표시 / EXIF 보기는 향후 EXIF 제거 도구에 통합 / 썸네일 만들기는 resize 사용
    - **2차 묶음 후보 (보류)** = EXIF 제거 (프라이버시 단가) / 모자이크·블러 (개인정보 가리기) / favicon 생성기
    - **스킵 (§0.4 패턴)** = 색상 추출 (디자이너·개발자 좁음, 광고 약함) / app icon (favicon으로 충분)
  - **신규 도구 1 — `image/heic-to-jpg/`** (HEIC → JPG/PNG 일괄 변환): heic2any v0.0.4 (1.35MB UMD, libheif WASM 자체 번들) vendoring. esm.sh `?bundle`은 wrapper만 와서 실패 → jsdelivr에서 직접 다운로드. UX = 다중 파일 누적 + 포맷(JPG/PNG) + JPG 품질 1~100 슬라이더 + 진행률 + 결과 그리드 페이지별 다운로드 + "전체 다운로드" 200ms 간격 anchor click. JSON-LD WebApplication·BreadcrumbList·FAQPage(6Q)·HowTo(4 step)
  - **신규 도구 2 — `image/crop/`** (자유 크롭 + SNS 비율 프리셋 + 회전·반전): canvas 2D API 0KB. **비율 프리셋 7종** = 자유 / 1:1(인스타·프로필) / 4:3(일반 카메라) / 16:9(유튜브·가로) / 9:16(릴스·틱톡·쇼츠) / 3:2(DSLR·필름) / 4:5(인스타 세로). **회전·반전 6종** = ↻90·↺90·180·flipH·flipV·원래대로 — `transformedCanvas` 별도 생성으로 누적 적용. **drag rect** = 8 handles(corner 4 + edge 4) + 안쪽 드래그 이동 + Pointer Events(mouse + touch 통합). 비율 고정 시 corner는 큰 변화 기준, edge는 가운데 대칭 확장. 출력 = JPG/PNG/WebP. SNS·플랫폼별 권장 비율 표 inline (인스타·유튜브·틱톡·트위터·페이스북·DSLR)
  - **신규 도구 3 — `image/id-photo/`** (한국 표준 증명사진): canvas 0KB. **표준 사이즈 6 + 직접 mm 입력** = 여권(35×45) / 증명사진·이력서·반명함(30×40) / 운전면허·민증(35×45) / 미국 비자(51×51) / 중국 비자(33×48). **300 DPI 자동 픽셀 변환** = mm × 300/25.4 ≈ 11.81 (예: 35×45mm = 413×531px). **가이드 라인** = frame 안에 정수리(18%)·눈(42%)·턱(78%) 점선 + 가운데 세로선 + 라벨. **흰 배경 옵션** = canvas fillRect 흰색 후 drawImage(원본 알파 영역만 덮음). frame은 비율 강제(corner 4 핸들만), 출력 시 표준 픽셀로 리샘플링(`imageSmoothingQuality: 'high'`). 출처 = 외교부 여권안내·도로교통공단·정부24 + 사진관 인쇄 표준 300 DPI
  - **인프라 일괄** ① `sw.js` v3 → **v4** ② `manifest.webmanifest` description "55가지 → 58가지" ③ 루트 `index.html` — og·twitter·title·description·keywords 모두 "이미지 9선" 갱신, JSON-LD hasPart 이미지 description 갱신, hub-card 이미지 "LIVE · 6선 → 9선" + desc 신규 도구 명시, Organization "55선 → 58선", quick-list 이미지 행 신규 5개(HEIC·자르기·증명사진·압축·배경 제거 — 새 도구가 트래픽 큰 만큼 우선) ④ `image/index.html` — ItemList 6 → 9, tool-grid 6 → 9 카드(신규 3 카드 = 📷·🖼️·🪪 아이콘), hub-intro·count·og 메타·subtitle 모두 "9선" 갱신 ⑤ `tools/privacy/` + `tools/terms/` 시행일·1조 도구 수 "55종 → 58종" 갱신 ⑥ sitemap rebuild 63 → **66 URL**
  - **검증** = JS syntax 3/3 ✓ / JSON-LD parse 5/5 ✓ / FAQ DOM = JSON-LD 6/6 ✓ (3 도구) / HTML 태그 밸런스 4/4 ✓ / HTTP 200 9/9 ✓
  - **history 문서** = `history/seo/2026-05-06-image-tier1-3.md` 신규
- **PDF 카테고리 신설 + 신규 도구 2종 + 기존 PDF 도구 3종 image→pdf 이전 (2026-05-06)**: image/ 9선 중 PDF 3개(pdf-merge·pdf-split·img-to-pdf)가 이미지 6개와 섞여 있던 구조 분리. 카테고리 = `tools / text / image / pdf / video` **5개**, 도구 수 53 → **55선**, sitemap 60 → **63 URL**.
  - **결정 배경**: ① PDF SERP 키워드("PDF 합치기"·"PDF 자르기"·"PDF 편집"·"PDF JPG 변환")가 image hub에 묻혀있음 = 검색 의도 분리 ② image hub가 14~15선까지 부풀면 정합성 깨짐 ③ 향후 PDF 도구 추가 자리 확보. 사용자 의사결정 = "기존 3개 모두 pdf/로 이전(Recommended)" + 신규 도구 = pdf-edit(편집 통합) + pdf-to-image
  - **신규 도구 2종**:
    - **`pdf/pdf-edit/`** — 페이지 삭제 + 순서 변경(drag&drop + ↑↓) + 회전(↻ 90°/180°/270°/0°) 통합. SmallPDF "Organize PDF" 패턴. pdf.js로 썸네일 canvas 렌더 + pdf-lib로 copyPages·setRotation. 삭제는 토글(↺로 복원) — 저장 전까지 메모리 in-place. JSON-LD WebApplication·BreadcrumbList·FAQPage(6)·HowTo(4)
    - **`pdf/pdf-to-image/`** — PDF 페이지 → PNG/JPG 변환. pdf.js만 사용(pdf-lib 불필요). 페이지 범위(`1-3,5,7-10` parseRange 패턴 — pdf-split.js에서 차용) + 포맷·DPI(72/150/300/600) + JPG 품질. 결과 그리드에 페이지별 다운로드 + "전체 다운로드" 순차 anchor click. ZIP 일괄은 후속 백로그
  - **기존 3종 이전**: `image/{pdf-merge,pdf-split,img-to-pdf}/` → `pdf/...`로 cp 후 메타 갱신 — canonical·og:url·BreadcrumbList(Image→PDF)·og:site_name(TAYSTUDIO Image→TAYSTUDIO PDF)·vendor 경로(`/image/vendor/pdf-lib.min.js` → `/pdf/vendor/pdf-lib.min.js`)·관련 도구 cross-cat 링크(`../compress/` → `/image/compress/` 등)·related-nav 라벨·breadcrumb DOM
  - **redirect 정책 — soft refresh stub**: GitHub Pages는 301 redirect 헤더 불가 → `image/{pdf-merge,pdf-split,img-to-pdf}/index.html`을 짧은 stub HTML로 덮어쓰기 = `<meta http-equiv="refresh">` + `<link rel="canonical" href=새URL>` + `<meta name="robots" content="noindex">` + JS `location.replace`. Google이 soft redirect로 인식해 equity 일부 이전 + 자연 deindex (수개월). 기존 `.js` 3개 삭제. **Search Console 대응** = 사용자가 신규 5 URL 색인 요청 + sitemap 재제출, 카카오 OG 캐시 수동 flush
  - **vendor 분리**: `pdf/vendor/` 신설 = ① `pdf-lib.min.js` 525KB (image/vendor/에서 mv) ② `pdf.min.mjs` 336KB (jsdelivr `pdfjs-dist@4.7.76` 신규 vendoring) ③ `pdf.worker.min.mjs` 1.36MB (pdf.js worker, lazy fetch + IndexedDB 캐시). image/vendor/는 4종(qrcode·jsQR·tesseract·imgly-bg-remove)으로 정리. **분리 이유** = 카테고리 자급 + 사용자가 향후 image와 pdf 분기시 각각 독립 운영. cross-import는 `/pdf/...`·`/image/...` 절대경로
  - **build-sitemap.sh 갱신** ① `CATEGORIES=("tools" "text" "image" "pdf" "video")` — pdf 추가 + **video 누락 버그 같이 fix**(이전엔 배열에 video 없었으나 sitemap 자체엔 다른 경로로 들어갔음. 이번에 명시 정리) ② classify에 `/pdf/`·`/video/` 분기 추가 ③ **`is_noindex()` 함수 신규** = stub HTML(noindex 메타 있는 파일)을 sitemap에서 자동 제외. 결과 = 63 URL (pdf hub 1 + pdf 도구 5 + video hub 1 + video 도구 5 + image hub 1 + image 도구 6 + tools 36 + tools/privacy + tools/terms + text hub 1 + text 도구 3 + root)
  - **인프라 일괄** ① `sw.js` `CACHE_VERSION` v2 → **v3** + STATIC_ASSETS에 `/pdf/` 추가 ② `manifest.webmanifest` description "53가지 → 55가지" + shortcuts 4개 중 QR 코드 → PDF 합치기로 교체 ③ 루트 `index.html` — og·twitter·title·description·keywords 모두 "이미지·PDF 9선" → "이미지 6선·PDF 5선" 갱신, JSON-LD hasPart 4 → 5 WebSite, hub-card 4 → 5(PDF 카드 신규 d4 + video d5), Organization description "53선 → 55선", quick-list 이미지 행에서 pdf-merge 제거·PDF 행 신규 추가 ④ `image/index.html` — ItemList 9 → 6, hub-intro·tool-grid·count·og 메타·hub-faq 모두 "도구 6선"으로 갱신 + "PDF 도구는 별도 카테고리로 →" cross-link 박스 신설 ⑤ `common/site-chrome.js` header nav 4 → 5 메뉴(계산기·텍스트·이미지·**PDF**·동영상) ⑥ `tools/privacy/` 시행일 2026-05-06 + 카테고리 줄 분리(이미지/PDF/동영상 별도) ⑦ `tools/terms/` 동일 패턴 + PDF 도구 정확성 면책 줄 신규
  - **검증** = JS syntax 5/5 ✓ / JSON-LD parse 8/8 ✓ / FAQ DOM=JSON-LD 6/6 ✓ / HTML 태그 밸런스 9/9 ✓ / 17 URL 200 ✓ / stub 3개 redirect 메타(canonical+refresh+noindex) ✓ / image/ 안 PDF 흔적 0 ✓
  - **history 문서** = `history/seo/2026-05-06-pdf-category-launch.md` 신규
- **본질 motivation**: 광고 수익 (0.1)
- **인프라 전략**: 정적 우선, 백엔드는 fallback (0.2)
- **도구 후보 평가**: 3 질문 통과해야 진행 (0.3)
- **text 카테고리**: Tier 1 3개로 마감, Tier 2(개발자 도구) 스킵 (3.1)
- **면책 banner 일반화**: 카테고리 정규식 (7.2)
- **공통 CSS 위치**: `common/css/style.css` (2026-05-05 결정 — `tools/css/`에서 이관). 카테고리는 `<link href="/common/css/style.css">` import. 카테고리·도구별 좁은 override만 인라인 `<style>`. 카테고리별 CSS 복제 X
- **image/ 도구 9선 완성**: 1차 canvas 2 → 2·3차 QR/PDF/OCR 5 → 4차 img-to-pdf + bg-remove 2 (4.1). 사이트 **첫 AI 도구 = bg-remove (@imgly)**
- **라이브러리 vendoring**: `image/vendor/`에 5종 (qrcode·jsQR·pdf-lib·tesseract·imgly-bg-remove) 직접 commit. CDN 의존 없음. 단 OCR 학습 데이터·bg-remove 모델·WASM은 CDN + IndexedDB 캐시 (사용자 이미지는 절대 외부로 안 나감)
- **ESM 도입**: bg-remove 도구가 사이트 첫 ESM 사용 (`<script type="module">` + 동적 import). esm.sh `?bundle` 플래그로 self-contained 번들 생성 후 vendoring
- **AI 도구 disclaimer 정책**: OCR·bg-remove 등 정확도 변수 큰 도구는 사이트 banner 대신 페이지 내 인라인 박스(`.ocr-disclaimer`·`.ai-disclaimer`) + 첫 다운로드 안내 (Wi-Fi 권장)
- **og:image 자산**: 1200×630 PNG `/og-image.png` (svg 원본 `/og-image.svg`) — 사이트 전체 51 파일 head에 일관 적용. twitter:card는 `summary_large_image`로 통일 (2026-05-05 SEO Tier 1.1)
- **SEO 전용 디렉토리 `history/seo/`**: 전략 문서(`strategy.md`)와 작업 rollout 기록 누적. 새 도구 추가 시 `strategy.md`의 18항목 체크리스트로 검증
- **OG 이미지 카피 갱신 (2026-05-05)**: 카테고리 칩 숫자 제거(`계산기 33`→`계산기` 등) + 서브타이틀 일반화(`한국에서 자주 쓰는`→`자주 쓰는`). 의도 = 도구 추가 시 OG 자산 재생성 부담 제거 + 톤 일반화. SVG 폭도 균일 140px로 통일·재배치(`og-image.svg` / `og-image.png` 519KB). 51 파일 head의 `og:image:alt` + `twitter:image:alt` = "TAYSTUDIO — 자주 쓰는 무료 도구 모음"으로 동기화 완료 (2026-05-05)
- **Footer ARR 표기 (2026-05-05)**: `common/site-chrome.js`의 `<site-footer>`에 `© 2026 TAYSTUDIO. All Rights Reserved.` 라인 추가 (기존 "입력값은 브라우저 안에서만 처리됩니다"는 보조 라인으로 분리). 51 페이지 일괄 적용. 의도 = DMCA 근거 강화 + 신뢰감 시그널. SEO 영향 0 (저작권 표기는 Google 랭킹 시그널 아님). SW `CACHE_VERSION` v8 → v9 bump (§7.4 정책). 후속 정리(2026-05-05): 시그니처 `MADE IN SEOUL` 제거 → 4줄→3줄 (링크/메인메시지+ARR), 시각 위계 — 차별화 메시지 13px·100%(메인) / ARR 12px·70%(보조)
- **Header nav 다중 카테고리화 (2026-05-05)**: `<site-header>`를 영어 단일 `Tools` → 한국어 3 카테고리 (`계산기` / `텍스트` / `이미지`) + 현재 카테고리 active 강조 (path 기반 동적). `common/css/style.css`에 `.site-nav` 스타일 + 모바일 미디어 쿼리 추가(<480px / <360px). 의도 = 카테고리 발견성 + 한국어 톤 일관 + 모바일 좁은 화면 대응. SW v9 → v10
- **이용약관·개인정보처리방침 최신화 (2026-05-05)**: ① `tools/privacy/` 시행일 2026-05-05 + 2조 외부 CDN(jsdelivr·staticimgly.com) 모델 다운로드 명시(사용자 이미지 미전송 강조) + 하단 네비 4 카테고리로 일반화 ② `tools/terms/` 시행일 4-30 → 5-5 + 1조 "33가지 계산기" → "계산기 33 / 텍스트 3 / 이미지·PDF 9" 명시 + 2조 image AI 도구(OCR·bg-remove) 정확도 면책 추가 + 하단 네비 동일 갱신. 의도 = text·image 카테고리 신설 후 outdated 정정 + 투명성 보강
- **메인 페이지 인덱스 정리 (2026-05-05)**: ① 카피 일반화 — `title`·`og:title`·`twitter:title`·`meta description`·JSON-LD description ×2·hero tagline에서 "한국에서" 제거 (OG 카피·약관 갱신과 톤 일관) ② **`hub-intro` 박스 신설** — hub-card 그리드 아래에 eyebrow(`— 사이트 소개`) + lead("입력값·이미지·PDF가 외부 서버로 전송되지 않습니다", primary 색 강조) + body 3계층 위계, 좌측 3px primary 보더. 의도 = 첫 인상(즉시성) 보존 + below-the-fold SEO·AdSense 콘텐츠 ③ **preview-section 3개(15 카드) → `quick-list` 1 섹션** 통합 — 인라인 도구 리스트 (카테고리 라벨 primary 색 + 세로 1px 분리선, 이모지 X). 부피 ~50% 감소 ④ 이미지 큐레이션 변경 — bg-remove(화제·일상 빈도 낮음) → 압축·리사이즈·PDF 합치기·QR 코드(일상 빈도 높음, 사용자 요청). ⑤ 디자인 결정 = 사이트 톤(mono·minimal·이모지 노이즈 X)에 부합 — 시각 시그널은 색·굵기·세로선만
- **클론·택갈이 1차 방어 (2026-05-05)**: ① **JS 도메인 가드** — `common/site-chrome.js`에 IIFE 추가, ALLOWED 도메인(`taystudios.com` + 로컬 개발) 외에서 접속 시 빨간 경고 배너 노출 ("⚠️ 비공식 미러 사이트입니다. 정품: taystudios.com"). 도용자가 우회 시 = 그 IIFE만 sed로 빼면 됨, **단 우회 자체가 도용 의도 명백 = DMCA 결정적 증거**. 정품 도메인에선 동작 안 함(보이지 않음 = 정상) ② **HTML watermark 51 파일 일괄** — head 시작점에 정품 시그니처 주석 + `meta generator="TAYSTUDIO 2026"` 추가. 페이지 소스(Cmd+U)로만 보이는 fingerprint. 도용자가 못 알아채고 그대로 두면 출처 추적용. `EXCLUDE = {history/, tools/404.html}` ③ SW v10 → v11 bump (common/* 변경). 한계 = 정적 사이트라 100% 차단 X. 의도 = 도용 비용 ↑ + 발견 시 빠른 입증
- **SEO 개념정리 용어집 신규 (2026-05-05)**: `history/seo/concepts.md` 작성 — SERP 개념(화면 구조 다이어그램·5 영역·"SERP 약함" 표현 의미·SC 측정 지표) + 향후 누적 슬롯(canonical·JSON-LD·OG·E-E-A-T·robots·Naver vs Google·PWA·TWA 등). 의도 = 다음 세션이 같은 개념을 다시 묻지 않도록 + 새 개념 등장 시 같은 파일 누적. plan §10 참고 문서에 link 추가
- **운영자 dashboard 페이지 신규 (2026-05-05)**: `/dash-tay9k3m/index.html` — 운영자 통계·도구를 한 곳에서 보는 secret URL 페이지. 백엔드 도입 X(§0.2 정적 우선 유지). 외부 dashboard(GA Real-time/성능, Search Console, AdSense, 쿠팡 파트너스, 카카오 OG 디버거 등) 링크 모음 + 사이트 자체 링크(메인·각 카테고리). 보안 = ① secret URL(`dash-tay9k3m`은 짐작 어려운 path) ② `meta robots="noindex, nofollow"` ③ `robots.txt`에 `Disallow: /dash-tay9k3m/`. 의도 = 운영자가 즉시 모든 운영 패널에 진입(외부 dashboard는 Google 로그인 상태면 즉시 노출). 사이트 chrome(site-header/footer) 미포함 — 운영자 전용 페이지로 사용자 navigation에서 격리
- **운영자 dashboard — Looker Studio iframe embed 추가 (2026-05-05)**: dash 페이지 최상단에 `dash-embed` 섹션 신설 — Looker Studio 보고서를 iframe으로 실데이터 노출(GA4 연결). 기존 외부 링크 hub 5섹션은 그대로 유지(빠른 진입용). 슬롯은 placeholder(주석 처리된 iframe + "보고서 미설정" empty state) + details에 5단계 설정 가이드 + 보안 경고 박스. 보안 정책 = ① Looker 보고서 공유 = **"제한됨(Restricted) + 본인 Gmail만"** 강제(공개 또는 링크-있는-모든-사용자 절대 X — 공유 잘못 설정 시 GA 데이터 노출) ② iframe `referrerpolicy="no-referrer"`로 secret URL이 Google referer 로그에 안 잡힘 ③ `loading="lazy"` ④ Looker가 iframe 내 로그인 차단 시 새 탭으로 1회 로그인 후 dash 새로고침 fallback 안내 ⑤ B안(GIS + GA Data API client-side)·C안(GitHub Actions cron pull)은 비채택 — A안만 진입(트레이드오프: 코드 0줄·시각화 풍부 vs Looker UI 그대로). 다음 단계 = 사용자가 lookerstudio에서 보고서 만든 후 src URL을 받아 iframe 주석 해제·교체
- **운영자 dashboard — Looker Studio 보고서 실연결 완료 (2026-05-05)**: REPORT_ID `e244e991-a162-413f-a75b-d01c2e91039b` 보고서 src URL 적용. iframe 주석 해제 + "보고서 미설정" empty 박스 제거. Looker가 제공한 `sandbox` 속성(allow-storage-access-by-user-activation·allow-scripts·allow-same-origin·allow-popups·allow-popups-to-escape-sandbox) 보존 — iframe 내 storage/스크립트/팝업 권한 필요. 도메인은 `datastudio.google.com`(구 도메인) 그대로 사용 — Google이 `lookerstudio.google.com`으로 자동 redirect 처리, 동작 동일. 보안 검증 = URL이 노출돼도 권한 없는 Google 계정은 "이 보고서를 볼 권한 없음" 화면, 비로그인은 로그인 화면 = 데이터 노출 X. 단 전제 = Looker 공유 = "제한됨 + 본인 Gmail만"(이 옵션 외엔 데이터 노출 위험)
- **계산기 카테고리 단일화 + tools/calorie/ 풍부화 (2026-05-05)**: 한때 `health/` 카테고리 신설 시도(BMR·TDEE 1선 출시)했으나, 기존 `tools/calorie/`와 콘텐츠 90%+ 겹쳐 SERP 자기-경쟁 위험 발견. **결정** = 계산기는 모두 `tools/` 하나로 단일화, `tools/calorie/`를 풍부화해 BMR 종합 분석 흡수. **변경** ① `tools/calorie/calorie.js` 갱신 — Mifflin + Harris-Benedict 비교 + TDEE 5단계(실제 입력값) + cut −500/bulk +300 + 단백질 1.6g/kg + 수분 33ml/kg ② `tools/calorie/index.html` 갱신 — result 7행 + tool-article 3개(BMR 공식·다이어트 목표 5행·키별 참고표 6행) + FAQ 6(JSON-LD 동기) + sources 5 + applicationCategory "HealthApplication" + title·description "기초대사량 계산기" 톤으로 키워드 풀 확장 ③ `health/` 디렉토리 삭제 ④ `common/site-chrome.js` nav 3선(계산기·텍스트·이미지) 복귀 ⑤ 루트 `index.html` health 흔적 모두 제거(OG/title/hasPart/hub-card/quick-list), description은 calorie 풍부화 반영 — "계산기 33선(연봉·세금·부동산·임신·육아·**건강·BMR/TDEE**)" ⑥ `scripts/build-sitemap.sh` CATEGORIES 3선 + classify 복귀, sitemap 53 → **51 URL** ⑦ `tools/sw.js` v11 → v13 ⑧ privacy "BMR/TDEE 분석 보강" 표기 + 건강 카테고리 줄 제거 + 푸터 nav 정리 / terms는 "건강 계산기(BMI·기초대사량·임신·육아 등)" 일반 표현으로 의료 면책 유지. **이유**: ① duplicate-content 회피 ② 계산기는 본질적으로 한 묶음 ③ §0.4 카테고리 채우기용 회피 ④ URL `/tools/calorie/` 보존으로 SEO equity 유지(인덱스 영향 X) ⑤ 카테고리 늘어나면 PWA·sitemap·hub·약관 모두 반복 갱신 부담
- **heart-rate Zone 2 (Fatmax·체지방 감량) SEO 보강 (2026-05-05)**: 출시 직후 한국 검색자 의도("Zone 2 = 체지방 감량")에 맞춰 키워드 풀·콘텐츠 깊이 확장. **변경** ① title/og/twitter "Zone 2 체지방 감량·Fatmax 심박수" 명시 ② keywords — "Zone 2 다이어트"·"체지방 감량 심박수"·"Fatmax"·"미토콘드리아 트레이닝"·"HIIT 심박수" 추가 ③ subtitle Zone 2 체지방 감량 강조 ④ result 표 Zone 2 행 시각 강조(연한 primary 배경 + bold) + 라벨 "체지방 감량 (Fatmax)" ⑤ tool-article 3개 신설 — "Zone 2 체지방 감량 트레이닝 가이드"(4 이유 표) + "Zone 2 vs HIIT 비교"(6 행 비교표) + "Zone 2 실전 가늠법"(BPM·대화·RPE·코호흡) ⑥ FAQ 6 → 9 (DOM·JSON-LD 동기) — Fatmax 정의·Zone 2 인기 이유·HIIT 비교·"쉬워 보이지만 효과" ⑦ sources 5 → 8 — Achten 2002(Fatmax)·San-Millán 2018(Sports Med)·Foster 2015(J Sports Sci Med) 추가. **출처 정책 준수** = 모두 학술 1차 인용. **사실 왜곡 없음** = "분당 지방 vs 총 칼로리" 균형 유지 (Zone 2 = 분당 지방산화 최대 / HIIT = 총 칼로리·EPOC 최대 / 최선 = 병행). 사이트맵 lastmod 자동 갱신
- **건강 계산기 3선 신규 출시 (2026-05-05)**: SERP·일반인 트래픽 강한 후보 3선을 `tools/`에 직접 추가. 계산기 33선 → **36선**, sitemap 51 → **54 URL**. **출시 도구**:
  - **`tools/body-fat/`** — Navy 줄자 공식(Hodgdon-Beckett 1984) 메인 + CUN-BAE(Gómez-Ambrosi 2012, BMI 기반) 비교 + ACE 분류표(필수·운동선수·건강·평균·비만) + 지방량·제지방량 동시 표시. 입력: 성별·나이·키·체중·목·허리(여성: +엉덩이). cm → 인치 자동 변환. 본인 분류 행 자동 강조
  - **`tools/ideal-weight/`** — BMI 22 한국 표준(대한비만학회·KDRI 2020) 메인 + Devine 1974·Robinson 1983·Miller 1983·Hamwi 1964 4 의료 공식 비교 + 정상 체중 범위(BMI 18.5~22.9) + 본인 체중 입력 시 차이값 표시. 152cm 미만은 4공식 음수 가능 → BMI 22만 표시 처리. 키별 참고표 8행
  - **`tools/heart-rate/`** — Tanaka HRmax 공식(208−0.7×age, JACC 2001) 메인 + Fox-Haskell(220−age) 비교 + 여성 Gulati(206−0.88×age, Circulation 2010) + Karvonen HRR 공식(HRrest 입력 시 자동 전환) + ACSM 5 zone(워밍업·지방연소·유산소·무산소 임계·VO2max). HRrest 미입력 시 단순 %HRmax 자동 전환
  - **통합** ① `tools/index.html` 허브 — 건강 섹션 카드 5개로 확장(BMI·BMR/TDEE·체지방률·표준체중·심박존), pill count 2 → 5, hero "33선 → 36선" ② 루트 `index.html` — hub-card "LIVE · 36선", description "체지방률"·"기초대사량" 키워드 추가, hasPart description "건강(BMI·BMR/TDEE·체지방률·표준체중·심박존)·자동차", quick-list 계산기 row에 체지방률 추가 ③ `tools/HANDOFF.md` "건강 (2)" → "건강 (5)" + 도구 카운트 33 → 36 일괄 ④ `scripts/build-sitemap.sh` 재빌드 51 → 54 URL ⑤ `tools/sw.js` v13 → v14 ⑥ privacy/terms — "33종" → "36종(건강 5종 포함)" + 시행일 "(건강 계산기 5종 확장)". **출처 정책**(memory feedback "수치 출처 정확성") = 모든 공식 학술 논문·공식 가이드라인 1차 출처 인용(Naval Health Research Center 1984·JACC 2001·Circulation 2010·ACSM 11ed·KDRI 2020 등). 면책 = 사이트 banner + 페이지 내부 `.disclaimer`로 의료 진단 대체 X 명시. **나머지 후보** = §9.4 #4의 **1rm**(Epley·Brzycki) 1선만 남음 (운동인 좁은 SERP라 후순위)
- **video 카테고리 신설 + video/compress 1선 출시 (2026-05-05)**: §5.5.2 video Tier 1 5선 중 **첫 도구 출시**. 카테고리 = `tools / text / image / video` 4개. 도구 수 48 → **49선**. sitemap 54 → **56 URL** (video hub + compress).
  - **`video/vendor/ffmpeg-loader.mjs`** — 자체 작성 ESM wrapper. `@ffmpeg/ffmpeg@0.12.10` jsdelivr `+esm` 동적 import + `@ffmpeg/core@0.12.6` (`ffmpeg-core.js` + `.wasm`) IndexedDB Blob 캐시(`taystudio-video` DB). 첫 사용 ~32MB 다운로드, 이후 캐시 hit. `loadFFmpeg(onProgress)` singleton + `toUint8Array(blob)` 헬퍼 export. 캐시 실패(사파리 프라이빗·할당량) → silent fallback, fetch 재시도로 동작 보장
  - **`video/compress/`** — H.264 + AAC 압축. 입력: MP4/MOV/WebM/MKV/AVI. 옵션: 해상도(원본·1080p·720p·480p·360p) + CRF 슬라이더(18~35, 기본 28) + 오디오(AAC 재인코딩·무손실 복사·제거). ffmpeg args = `-c:v libx264 -preset ultrafast -crf N -pix_fmt yuv420p [-vf scale=-2:N] -c:a aac -b:a 128k -movflags +faststart`. 출력 MP4 — 카톡·이메일·SNS 호환. 진행률 표시(다운로드 → 인코딩 → 완료) + 압축 후 video preview + 원본/압축 용량/감소율/처리 시간 표시
  - **Single-thread 제약 명시** = GitHub Pages COOP/COEP 헤더 미지원 → SharedArrayBuffer 불가 → multi-thread `@ffmpeg/core-mt` 사용 X. single-thread `@ffmpeg/core`만 가능. 처리 속도 0.3~1×. 사용자 안내 = `.first-time-notice` 박스 + FAQ
  - **iOS Safari 한계** = 단일 탭 메모리 ~500MB. 1080p·30분 이상 영상은 강제 종료 가능. 안내 = "모바일은 720p 이하 + 5~10분 이내 권장"
  - **CSP / preconnect** = `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>` 추가(video 페이지). SW(`tools/sw.js`)는 same-origin만 캐시하므로 jsdelivr 응답은 SW 통과·브라우저 HTTP 캐시 + IndexedDB 직접 캐시 (이중 캐시 = 안정)
  - **통합** ① `common/site-chrome.js` nav 3 → 4 카테고리(계산기·텍스트·이미지·**동영상**) ② 루트 `index.html` hub-card 4번째 추가(LIVE · 1선) + og·twitter·title·description·keywords·hasPart·alternateName description "48선 → 49선" 갱신 + quick-list "동영상" row 추가 ③ `sitemap.xml` video URL 2개 추가 ④ video/index.html 카테고리 hub(도구 1개부터) ⑤ `tools/sw.js`는 v14 유지(STATIC_ASSETS는 image/ 패턴과 동일하게 카테고리 페이지 미포함, 사용자 방문 시 자동 캐시). PWA 통합(§9.2)은 보류 항목 그대로
  - **저작권 disclaimer** = sources 섹션 note에 "본인 영상에 대해서만 사용 — 영상·음원 저작권 침해 사용 금지" 명시. video-to-mp3 출시 시 더 강한 inline 박스 도입 예정
- **video 카테고리 trim·rotate 2선 추가 (2026-05-05)**: §5.5.2 5선 중 **3선/5선 도달**. 도구 수 49 → **51선**. sitemap 56 → **58 URL**. wrapper 1개 재사용 = 도구당 작업량 작음을 1차 검증 (§0.2 정신 시각적 증거).
  - **`video/trim/`** — 빠른 모드(`-ss <s> -to <e> -i input -c copy`, seek가 -i 앞 = 빠른 키프레임 정렬) + 정확 모드(`-i input -ss -to -c:v libx264 -crf 23` 디코드 후 프레임 단위 재인코딩) 듀얼. 시각 입력 파서 = `HH:MM:SS / MM:SS / 초(.frac)` 3가지 형식. 영상 업로드 시 `<video preload=metadata>`로 duration 자동 표시 + 시작/끝 입력란 자동 채움 + "현재 재생 위치로" 버튼(currentTime → fmtTime). 빠른 모드는 1GB 영상도 수 초로 끝, 모바일에서도 메모리 부담 적음
  - **`video/rotate/`** — transpose 5종(cw90 = `transpose=1` / ccw90 = `transpose=2` / 180 = `transpose=2,transpose=2` / hflip / vflip). UI = 라디오 5개 grid (rotate-grid + `:has(input:checked)` 시각 강조). H.264 재인코딩 + 오디오는 `-c:a copy` 무손실 복사 → MP4 컨테이너 호환 안 될 때만 AAC fallback (`tryExec` 1차/2차 분리). CRF 23 고정(원본 화질 유지) — 압축은 별도 도구로 위임
  - **통합** ① `video/index.html` hub count 1 → 3 + tool-card 2개 + ItemList JSON-LD 갱신 ② 루트 `index.html` hub-card "LIVE · 1선" → "3선" + 카테고리 description + og·twitter·title·description·keywords + hasPart description + 도구 49선 → 51선 + quick-list "동영상" row 확장(자르기·회전 추가) ③ `sitemap.xml` video URL 2개 추가 ④ `video/compress/index.html` related-tools "자르기·GIF·MP3 (준비 중)" → 자르기·회전 라이브 링크로 갱신, FAQ "영상 자르기 도구(준비 중)" → 라이브 링크로 갱신 ⑤ `tools/sw.js` v14 유지 (image/ 패턴 동일)
  - **검색 키워드 차별화** = trim "동영상 자르기·영상 트리밍·MP4 자르기·구간 자르기" / rotate "동영상 회전·세로 영상 가로로·좌우 반전·상하 반전·거꾸로 영상" — 모바일 사용자(아이폰 세로 녹화) 주 타겟
  - **history 문서** = `history/seo/2026-05-05-video-trim-rotate.md` 신규. `history/video/concepts.md`는 §2 컨테이너/코덱 + §3 인프라 범위 추가본 상태 유지(이번 세션 변경 없음 — wrapper 재사용 검증으로 §5 재사용 패턴이 그대로 동작함을 확인)
- **video 카테고리 to-gif·to-mp3 2선 출시 — 5선 완료 (2026-05-05)**: §5.5.2 Tier 1 5선 전부 라이브. 도구 수 51 → **53선**. sitemap 58 → **60 URL**. wrapper 1개로 5도구 검증 완료 — 패턴 안정화.
  - **`video/to-gif/`** — palette 단일패스 split 필터: `-vf "fps=N,scale=W:-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5"`. 2-pass 따로 호출 X(중간 palette.png 파일 불필요), `stats_mode=diff` = 움직이는 부분 색상 우선, `bayer dither` = 그라데이션 거칠기 완화. fps 4단계(10/15/24/30) + 너비 5단계(240/320/480/640/원본). 시각 입력 파서·미리보기·"현재 재생 위치로" 버튼은 trim과 동일 패턴 재사용. 30초 초과 구간은 confirm 안내(GIF 50MB+). `-loop 0` = 무한 반복. trim의 빠른 seek(-ss/-to를 -i 앞) 적용 — 1시간 영상에서 5초 구간 잘라 GIF 생성 시 디코드 양 최소화
  - **`video/to-mp3/`** — `-vn -c:a libmp3lame -b:a Nk`. 비트레이트 5단계(96/128/192/256/320 kbps, 권장 192). 결과 미리보기 = `<audio controls preload=metadata>` (영상이 아닌 오디오). 다른 도구와 차별점 = **강한 inline `.copyright-warning` 박스** (red border + 위법 사례 3가지 bullet 명시) — sources note의 1줄 disclaimer만으로 부족하다고 판단. JSON-LD FAQPage 첫 질문도 "어떤 경우에 합법적으로 사용할 수 있나요?"로 시작
  - **검색 키워드 차별화** = to-gif "동영상 GIF 변환·짤 만들기·움짤 만들기·카톡 움짤·영상 GIF로 변환" / to-mp3 "동영상 mp3 추출·영상 음원 추출·영상에서 음악 추출·MP4 mp3 변환" — to-mp3는 모호한 키워드라 "본인 영상 한정" 명시로 검색 유입자에게도 즉시 안내
  - **통합** ① `video/index.html` hub count 3 → 5 + tool-card 2개 + ItemList JSON-LD 5 + keywords 갱신 ② 루트 `index.html` hub-card "LIVE · 3선" → "5선" + og·twitter·title·description·keywords + WebSite hasPart description + alternateName description "51선 → 53선" + quick-list "동영상" row 확장 ③ `sitemap.xml` video URL 2개 추가 ④ `video/compress/`·`trim/`·`rotate/` related-tools 섹션에 to-gif·to-mp3 라이브 링크 추가 ⑤ `tools/sw.js` v14 유지
  - **저작권 disclaimer 강화 패턴** = inline `.copyright-warning` 박스(red 14px font, ⚠️ 제목 + bullet 3개 + footer 책임 면책). to-mp3에만 적용 — 다른 도구는 sources note 1줄로 충분 (영상 자체 변형은 저작권 이슈 약함, 음원 추출은 즉각적 위험)
  - **palette 필터 학습** = `palettegen=stats_mode=diff` (단순 `single`보다 움직임 가중) + `paletteuse=dither=bayer:bayer_scale=5` (basic dither보다 그라데이션 부드러움). 향후 audio/ 진입 시 lamejs로 to-mp3·voice-recorder 등 동일 LAME 인코더 재사용 가능
  - **history 문서** = `history/seo/2026-05-05-video-gif-mp3.md` 신규. `history/video/concepts.md`는 §10 ffmpeg args 사전 + §11 -ss 위치 + §12 audio fallback 패턴 누적(이번 세션 추가)
- **AdSense 비활성화 — 승인 전 placeholder + 스크립트 모두 hide (2026-05-05)**: 사용자 요청 "빈 광고란 다 없애줘, 승인 후 다시 활성화. 위치 보존 OK". 작은 작업이지만 SEO·UX·페이지 로드 속도 모두 영향.
  - **fix 1 — `.ad-slot { display: none !important; }`** (`common/css/style.css` 끝): 60개 page의 `<div class="ad-slot">` placeholder hide. **위치는 HTML에 보존** = 승인 후 CSS 한 블록 삭제로 즉시 다시 노출
  - **fix 2 — AdSense `<script>` 39개 페이지 주석 처리**: `<script async src="https://pagead2.googlesyndication.com/.../adsbygoogle.js" ...></script>` → `<!-- AdSense 미승인 — 승인 후 주석 해제: (원본 script) -->`. 외부 fetch 39회 절감. perl 일괄
  - **`<link rel="preconnect" href="https://pagead2...">` 60개**는 그대로 유지 — 성능 hint(브라우저 미리 DNS 해결)이라 외부 fetch 없음, 승인 후 활성화 시 재연결 비용 절감
  - **승인 후 활성화 단계** (TODO §9.4):
    1. `common/css/style.css` 끝의 `/* AdSense 미승인 ... */ .ad-slot { display: none !important; }` 블록 삭제
    2. `grep -rl 'AdSense 미승인 — 승인 후 주석 해제' --include='*.html' | xargs perl -i -pe 's|<!-- AdSense 미승인 — 승인 후 주석 해제: (<script[^>]*></script>) -->|$1|g'`
    3. 각 `.ad-slot` 안에 AdSense 콘솔에서 받은 `<ins class="adsbygoogle" ...></ins>` 코드 삽입 (60개 위치별 정책 — 도구 페이지 결과 위·하단·hub 중간/하단)
- **루트 hub-title 그라데이션 — 사이트 색 컨벤션 통합 (2026-05-05)**: 사용자 피드백 "쓸모 있는 것들 hero 'h1'에서 '쓸'자가 너무 진해 보임" → 그라데이션 시작 색이 `var(--text)` (#1a1d23 거의 검정)이라 좌상단 글자가 가장 진하게 표시되던 의도된 디자인. 색 부드럽게 + 사이트 색 컨벤션(favicon blue / PWA violet) 그라데이션으로 통합.
  - **변경 (`index.html`)** = `linear-gradient(135deg, #1e293b 0%, #2563eb 32%, #6366f1 66%, #7c3aed 100%)`. 4-stop = slate-800(부드러운 진남색·"쓸"자 위치) → favicon blue → indigo → PWA violet(마침표(.) 색도 같이). 사이트 정체성(브라우저 favicon · PWA · native) 색 컨벤션을 hero에서 시각적으로 표현
  - **다크 모드 fallback** = `#cbd5e1 → #60a5fa → #818cf8 → #a78bfa`. 라이트 톤 그라데이션으로 다크 배경 가독성 확보
  - **마침표(.) 색** = `var(--primary)` blue → `#7c3aed` PWA violet으로 그라데이션 끝과 일치. 시각 단절 X
- **SEO 최적화 라운드 — Tier 1+2 일괄 적용 (2026-05-05)**: §9.4 후보였던 SEO Tier 1·2 항목 일괄 처리. 현 상태 진단(title 길이·description·og:image·canonical·JSON-LD WebApplication·BreadcrumbList·FAQPage 등 대부분 OK) 후 부족한 부분만 보강.
  - **fix 1 — ItemList JSON-LD 누락 채움**: `tools/index.html`에 36 도구·`text/index.html`에 3 도구 ItemList schema 추가 (image·video는 이미 적용). 카테고리 hub가 SERP에서 "more from this site" 리스트로 노출 가능
  - **fix 2 — 카테고리 hub-intro 박스** (4 카테고리): eyebrow + lead("외부 서버로 전송되지 않습니다" 등 차별점 강조) + body(도구 갯수·차별화) + meta(최종 갱신·도구 수·privacy). 카드 그리드만 있던 thin content 해소
  - **fix 3 — 카테고리 hub FAQ 섹션** (4 카테고리 각 4~5문항): tools/(세율 갱신·신고 가능 여부·의료 진단 대체·정보 보안·모바일) / text/(키보드 변환·인스타 줄바꿈·SNS 한도·텍스트 보안) / image/(파일 보안·OCR 정확도·큰 파일·AI 모델) / video/(외부 전송·모바일 실패 원인·처리 시간·저작권·포맷). DOM `<details>`와 JSON-LD FAQPage 동기화
  - **fix 4 — HowTo JSON-LD 4 도구**: qr-gen(4 step) · pdf-merge(4 step) · img-to-pdf(4 step) · video/compress(6 step). step-by-step 카드 리치 스니펫 후보. bg-remove·trim은 후속 진입
  - **fix 5 — salary description 68자 → 110자 보강**: "2026년 기준 연봉 실수령액(월급 세후)을 즉시 계산..." 권장 80~110자 범위 내로
  - **fix 6 — favicon.ico 285KB → 5.2KB**: 기존 png-to-ico의 default multi-size(16~256) 모두 packing해 큼 → `to-ico` 패키지로 16x16 + 32x32 multi-res만 packing → 54배 감소. 첫 방문 페이지 로드 속도 미세 개선. 임시 npm install·node_modules·package-lock 정리(commit 대상 X)
  - **fix 7 — 공용 `.hub-intro`·`.hub-faq` CSS** (`common/css/style.css`): 4 카테고리 hub 재사용 + 미래 카테고리도 동일 패턴. 모바일 480px 미디어 쿼리 같이
  - **fix 8 — SW `CACHE_VERSION` v1 → v2**: 자산 변경 fresh fetch 강제. activate 시 옛 cache 키 모두 삭제
  - **검증** = (1) Google Rich Results Test로 각 schema 인식 확인 (https://search.google.com/test/rich-results) (2) Lighthouse SEO 점수 (3) Search Console 노출수·CTR 1~2주 후 비교 (4) 카카오 OG 디버거로 미리보기 재검증
  - **history 문서** = `history/seo/2026-05-05-tier1-2-batch.md` 신규
- **rotate·to-gif 모바일 메모리 fix — 다운스케일 옵션 (2026-05-05)**: 사용자 정정 보고 "카톡 in-app 외 일반 모바일 Chrome·삼성 인터넷에서도 rotate·to-gif fail, trim 빠른모드만 성공". 정확한 진단 = file 권한·in-app 제약 X = **재인코딩(libx264) 자체가 모바일 single-thread WASM 메모리 한계 초과**.
  - **도구별 ffmpeg 부하 매트릭스**:
    | 도구 | ffmpeg 동작 | 모바일 부하 |
    |---|---|---|
    | trim 빠른 모드 | `-c copy` stream copy | 매우 적음 (디코드·인코딩 X) |
    | trim 정확 모드 | H.264 재인코딩 | 무거움 |
    | rotate | 항상 H.264 재인코딩 + transpose | **무거움** |
    | to-gif | decode + palettegen + paletteuse + GIF 인코딩 | **무거움** |
    | compress | H.264 재인코딩 | 무거움 |
    | to-mp3 | LAME MP3 인코딩 (영상 디코드 X) | 중간 |
  - **fix 1 — `video/rotate/`에 출력 해상도 옵션 추가**: ① `<select id="scale">` 4단계(원본·1080p·720p default·480p) 추가, "모바일은 720p 이하 권장" 안내 문구 ② `buildVfChain(op, scale)` 함수 — `scale=-2:H,transpose=...` filter chain로 **회전 전 다운스케일 적용** (회전 후보다 메모리 효율) ③ -2 = 짝수 자동 정렬(yuv420p 호환) ④ 1080p → 720p = 픽셀 1/2, 4K → 720p = 픽셀 1/9 = 모바일 메모리 안에 안전하게 들어옴
  - **fix 2 — `video/to-gif/`에 모바일 감지 default 변경**: width `<select>`에 이미 240·320·480·640·원본 옵션 있음. JS IIFE에서 `/Android|iPhone|iPad|iPod/i` UA 감지 시 default 480 → 320 자동 변경. 사용자 의식 X 자동 적용 + 직접 선택은 가능
  - **fix 3 — to-mp3·compress·trim 정확 모드는 그대로**: to-mp3는 영상 디코드만 + 오디오 인코딩(가벼움) → 모바일 OK / compress는 이미 해상도 옵션 있음 / trim 정확 모드는 보조 기능이라 fail 시 빠른 모드 전환 안내
  - **검증** = (1) 휴대폰 외부 Chrome으로 rotate 720p default → 같은 실패 영상 시도 (2) to-gif 모바일 default 320 자동 → 시도 (3) 둘 다 성공하면 메모리 한계 확정 + fix OK. fail이면 다른 원인(HEVC·iCloud 등)
  - **history 문서** = `history/video/2026-05-05-mobile-error-handling.md`에 §추가
- **휴대폰 video 도구 에러 진단 + UX 보강 (2026-05-05)**: 사용자 보고 "휴대폰에서 동영상 처리 시 'requested file could not be read' 에러 다발" 진단·대응. **PWA·SW와 무관** — 모바일 OS·브라우저 자체 제약.
  - **원인 분석** (4개 카테고리):
    | 원인 | 환경 | 비중 |
    |---|---|---|
    | iCloud / Google Photos 클라우드 영상 | iOS Optimize Storage / Android 백업 후 삭제 | 가장 흔함 |
    | file 권한 만료 (handle invalidation) | iOS Safari·Chrome 모바일 — 선택 후 시간 경과 | 흔함 |
    | iOS Safari 메모리 ~500MB 한계 | 1GB+ 영상 | 큰 영상만 |
    | iOS HEVC 자동 트랜스코딩 fail | iOS HEVC(.mov) → H.264 변환 | 가끔 |
    | **카톡·라인·페북·인스타 in-app** 자체 제약 | 메모리 ~수백MB + file 권한 ~수 초 + WASM 제약 | in-app 진입 시 거의 항상 |
  - **3-단 fix** (`video/vendor/ffmpeg-loader.mjs` + 5개 도구 + `common/site-chrome.js`):
    - **fix 1 — `formatVideoError(error, {toolName, toolHint})` helper**: 5개 도구 공통 에러 포맷터. `NotReadableError`/`could not be read`/`not allowed` 정규식 분기 → "iCloud·Google Photos 영상은 폰에 미리 다운로드 / 영상 선택 직후 즉시 처리 / 데스크톱에서 시도" 명확 안내. 일반 에러 = 도구별 hint + 공통 해결 시도. 5개 도구(compress·trim·rotate·to-gif·to-mp3) 모두 catch 블록 갱신
    - **fix 2 — `readVideoFile(file)` helper**: file 선택 직후 즉시 `arrayBuffer()` 호출해 메모리에 캐시 → file 권한 만료 회피. 5개 도구의 `loadFile`을 async 변경 + 즉시 호출 + `currentBuffer` state로 캐시. 처리 시점에 cached buffer 사용. 트레이드오프 = 큰 영상 즉시 메모리 부담 (단 어차피 처리 시 read 필요). **helper만 export 완료, 5개 도구 적용은 별도 진행** — 사용자 검증 후 일괄
    - **fix 3 — `/video/*` 페이지 in-app 진입 자동 안내 배너 (`common/site-chrome.js`)**: `isInAppBrowser()` true + `location.pathname.startsWith('/video/')` → 페이지 상단에 노란 sticky 배너 자동 삽입. "in-app 브라우저는 동영상 처리에 부적합 — Chrome/Safari로 열어주세요" + "외부 브라우저로 열기" 버튼(기존 `showInAppRedirectModal` 재사용 — Android Chrome intent / iOS 메뉴 안내)
  - **환경별 권장 분기**:
    | 환경 | 동영상 처리 | 안내 |
    |---|---|---|
    | 데스크톱 Chrome·Edge·Firefox | ✅ 안정적 | 권장 1순위 |
    | Android Chrome 일반 | ✅ 동작 | 즉시 처리 권장 |
    | iOS Safari 일반 | ⚠️ 큰 영상 fail | 720p 이하·5분 이내 권장 |
    | **카톡·라인 in-app** | ❌ 거의 fail | **자동 배너로 외부 브라우저 강제 안내** |
  - **사용자 검증** = (1) 카톡에서 사이트 링크 → in-app 진입 → 노란 배너 + "외부 브라우저로 열기" 동작 확인 (2) 외부 Chrome·Safari 진입 후 동영상 처리 시도 → 에러 시 새 안내 메시지 노출 (3) `readVideoFile` 5개 도구 적용은 사용자 OK 후 별도
  - **history 문서** = `history/seo/2026-05-05-pwa-icon-and-install-btn.md`에 §10 추가 (또는 별도 노트)
- **PWA UX 마감 — 비활성 토글 + in-app 회수 + 모바일 헤더 컴팩트 (2026-05-05)**: install 버튼 추가 후 사용자 피드백 기반 후속 보강.
  - **자동 숨김 X → 비활성 토글**: 사용자 의견 "한 번 더 클릭하면 dismiss 가능하게" → 더 단순화 = "비활성/활성"만. ① `appinstalled` 이벤트 받으면 `localStorage('ts-installed', '1')` 저장 + 버튼 disabled + 텍스트 "✓ 설치됨" + 회색 ② standalone 모드도 동일 처리 ③ 미설치 환경 재방문 시 localStorage flag로 비활성 유지 ④ `.install-btn:disabled` CSS 회색·`cursor: not-allowed`·hover 무효화. **사용자 control 우선** — 자동 숨김보다 시각 피드백이 자연스러움
  - **PWA 미감지 한계** = 사용자가 OS에서 PWA 직접 삭제하면 우리 감지 X = 영원히 비활성. 단점 인지 + 향후 데이터 보고 "다시 활성화" 옵션 검토
  - **카카오·라인·페북·인스타·네이버 in-app 회수**: 카톡 트래픽 비중 큰 한국 시장 특성 → in-app 사용자도 install 채널로 끌어들임. ① UA 정규식 `/KAKAOTALK|Line\/|FBAN|FBAV|Instagram|NAVER\(inapp/i` 감지 ② in-app 환경에서 install 버튼 = 텍스트 "외부 열기" + 활성 ③ 클릭 시 `showInAppRedirectModal` — "우측 상단 메뉴 → 외부 브라우저로 열기" 안내 + Android는 Chrome intent URL(`intent://...;scheme=https;package=com.android.chrome;end`) 자동 시도 버튼 ④ iOS는 Apple 정책상 Chrome 강제 X — 안내만
  - **모바일 헤더 따닥따닥 fix**: nav 5개 항목(계산기·텍스트·이미지·동영상·웹앱 설치) → 안드로이드 인터넷에서 빽빽. ① 480px = nav-link 12px·padding 5·6 + install-btn 11px·padding 4·7 + gap 1 + logo 15px ② 360px = nav-link 11px·padding 4·5 + install-btn 10.5px·padding 4·6 + gap 0 + logo 14px ③ `.site-header` padding 12·12(480px)·10·8(360px) 축소
  - **install 버튼 분기 정리** (env × state):
    | 환경 | 버튼 | 클릭 시 |
    |---|---|---|
    | 미설치·Chrome·Edge·Android | 활성 보라 "웹앱 설치" | native install prompt |
    | 미설치·iOS Safari | 활성 보라 "웹앱 설치" | "공유 → 홈 화면 추가" 안내 모달 |
    | 미설치·in-app(카톡 등) | 활성 보라 "외부 열기" | 외부 브라우저 안내 + Android Chrome intent |
    | 설치 완료(Android·Desktop) | 비활성 회색 "✓ 설치됨" | no-op |
    | standalone 모드 | 비활성 회색 "✓ 설치됨" | no-op |
    | 기타 미지원 | 숨김 | — |
  - **검증** = (1) 카톡으로 본인에게 링크 보내 in-app 진입 → "외부 열기" 모달 + Chrome intent 동작 (2) 안드로이드 Chrome에서 install → 회색 "✓ 설치됨" 비활성 → 새로고침 후에도 비활성 유지 (3) 모바일 헤더 480px·360px viewport에서 nav 컴팩트 확인
  - **history 문서** = `history/seo/2026-05-05-pwa-icon-and-install-btn.md`에 §추가 (또는 별도 노트)
- **PWA install 버튼 + 아이콘 자산 분리 + TayTools 이름 (2026-05-05)**: PWA 통합 후 후속 UX 보강.
  - **install 버튼** = `common/site-chrome.js` site-header 우측 nav에 `<button id="ts-install-btn" class="install-btn">웹앱 설치</button>` 추가. 흐름 = `beforeinstallprompt` 이벤트 listen → deferredPrompt 보관 → 클릭 시 native install prompt. iOS Safari는 beforeinstallprompt 미지원 → 클릭 시 "공유 → 홈 화면 추가" 안내 모달. standalone 모드(이미 설치)면 자동 hidden. `appinstalled` 이벤트로 설치 완료 후 버튼 정리. 기존 자동 prompt(주소창 install 아이콘)는 그대로 + 명시 채널 추가
  - **자산 분리 — favicon vs pwa-icon vs (향후) native** = 사용자가 "PWA·native 시각 구분" 의도 명확화. `favicon-512.png` 삭제, PWA 전용 `pwa-icon.svg`·`pwa-icon-192.png`·`pwa-icon-512.png` 신규. 향후 native 자산은 `app-icon-*.png` 또는 별도 `native/` 디렉토리 컨벤션
  - **PWA 디자인 — 보라(#7c3aed) + WEB 라벨**: install prompt 작은 사이즈(~80px)에서도 favicon과 명확 구분. 색상 #2563eb(blue, favicon) → #7c3aed(purple, PWA). WEB 라벨 font-size 15px / 100viewbox(=15%) → 80px 사이즈에서도 ~12px로 읽힘. T 글자도 살짝 작게(54→46) 조정해 균형
  - **사이트 색 컨벤션 정착**: ① favicon = #2563eb 파랑 (브라우저 탭) ② PWA = #7c3aed 보라 + "WEB" 라벨 (install prompt·홈 화면·웹앱 설치 버튼) ③ 향후 native = #01875F Play green (Play 스토어 버튼)
  - **TayTools — 홈 화면 직관적 이름**: manifest `name`·`short_name` "TAYSTUDIO" → "**TayTools**". 한국 사용자 홈 화면에 표시될 때 용도 명확(8자 이내). 메인 브랜드는 도메인·헤더 로고·footer "TAYSTUDIO" 그대로 유지(회사명 vs 앱명 분리 패턴)
  - **install 버튼 색 일관**: indigo(#4f46e5) → 보라(#7c3aed)로 manifest theme_color 동기화. 향후 native 추가 시 `.play-btn` 클래스로 Play green 별도 — 사용자가 nav에서 한눈에 PWA·native 구분
  - **librsvg 설치**: `brew install librsvg` → `rsvg-convert -w 192 -h 192 pwa-icon.svg -o pwa-icon-192.png`. SVG → PNG 자동화 도구로 향후 디자인 갱신 시 재사용
  - **검증 단계** = (1) Chrome DevTools → Application → Manifest 새 디자인·이름 인식 확인 (2) Application → Storage → "Clear site data"로 manifest·icon 캐시 강제 갱신 (3) install prompt에서 보라 + WEB 라벨 + "TayTools" 이름 확인 (4) 모바일 폰에서 "홈 화면 추가" 시 TayTools 라벨 표시
  - **history 문서** = `history/seo/2026-05-05-pwa-icon-and-install-btn.md` 신규
- **PWA 통합 A안 완료 — 사이트 전체 manifest + root SW (2026-05-05)**: §9.2 보류 항목 "PWA 통합 정책" A안(루트 manifest, scope `/`) 진입. 기존 = `/tools/`만 PWA. 신규 = 사이트 4 카테고리 전체 통합.
  - **자산 신규** ① `/manifest.webmanifest` — name "TAYSTUDIO — 자주 쓰는 무료 도구" / short_name "TAYSTUDIO" / scope `/` / start_url `/` / display standalone / orientation portrait / categories ["finance","productivity","utilities","multimedia","photo"] / icons 4개(svg any + 192·512 any + 512 maskable) / shortcuts 4개(연봉·만 나이·이미지 압축·QR 코드) ② `/sw.js` — scope `/`, 기존 정책(network-first HTML / SWR JS·CSS / cache-first 그 외) 그대로, STATIC_ASSETS = 루트 + 4 카테고리 hub + common/css·js + favicon 5종 + manifest, addAll 대신 개별 add silent fallback (자산 일부 없어도 install 성공) ③ `/favicon-512.png` 신규 (sips로 192→512 upscale)
  - **HTML 일괄 변경** ① `common/site-chrome.js`에 SW 등록 IIFE 추가 — `ALLOWED` 도메인(taystudios.com·localhost·127.0.0.1) 가드 + 기존 `/tools/sw.js` 등록 자동 unregister + 새 root SW register. 60+ 페이지 인라인 register 제거 후 한 군데로 통합 ② tools/ 38개 인라인 SW register `<script>` 블록 perl 일괄 제거 ③ tools/ 38개 manifest link path를 `./manifest.webmanifest`·`../manifest.webmanifest` → `/manifest.webmanifest`로 갱신 ④ manifest link 없는 23개(text/·image/·video/·root·privacy·terms 등) head에 `<link rel="manifest" href="/manifest.webmanifest">` 일괄 추가 (apple-touch-icon 다음 줄). 운영자 전용 3개(tools/404, history/, dash-tay9k3m/)는 의도적 제외
  - **삭제** = `tools/manifest.webmanifest`, `tools/sw.js` (참조 모두 제거됨, 기존 사용자는 site-chrome.js의 unregister 로직으로 자동 마이그레이션)
  - **마이그레이션 안전성** = 기존 사용자(scope `./tools/`로 SW 등록된 사람)는 다음 방문 시 ① 기존 SW가 fetch 가로챔(network-first → 새 HTML 받음) ② site-chrome.js 로드 → 기존 unregister + 새 root SW register ③ 그 다음 방문부터 root SW가 가로챔. 단계적 자동 마이그레이션
  - **결과** = 60개 페이지 manifest link 적용 / 사용자가 어느 도구 페이지에서든 "홈 화면에 추가" 또는 "앱 설치" 가능 / 모든 카테고리 오프라인 동작 / TWA Play Store 등재의 전제 조건 충족
  - **다음 단계 후보** = (1) 사용자 검증 — Chrome DevTools → Application 탭에서 manifest·SW 정상 인식 확인 (2) Lighthouse PWA 점수 확인 (3) TWA Bubblewrap 등재(plan §10 PWA·TWA 트랙)는 한국 매출 검증 후
- **favicon.ico 추가 — 네이버 수집 제한 해제 (2026-05-05)**: 네이버 서치어드바이저에서 `https://taystudios.com/favicon.ico`가 "수집 제한"으로 표시됐던 원인 = repo에 `favicon.ico` 파일 자체가 없어 네이버봇이 자동 fetch 시 404. robots.txt는 정상(`Allow: /`).
  - **변경** ① `npx png-to-ico`로 16/32/48/64/96px PNG packing → `/favicon.ico` 생성(285KB, multi-resolution). 기존 `/favicon.svg`·`/favicon-96.png`·`/favicon-192.png`·`/apple-touch-icon.png`는 그대로 유지 ② perl 일괄 치환으로 63개 HTML head의 `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` 위에 `<link rel="icon" href="/favicon.ico" sizes="any">` 삽입(legacy 봇 우선 인식 + 모던 브라우저는 svg가 다음에 와도 우선순위 매김)
  - **남은 액션** = 사용자가 commit/push 후 네이버 서치어드바이저 재수집 요청
  - **트레이드오프** = 285KB는 일반 favicon.ico(5~30KB) 대비 큼. png-to-ico default가 16~256 multi-res 모두 만들어서 그럼. 단 favicon은 한 번 fetch + 영구 브라우저 캐시 = 사용자 영향 미미. **후속 백로그 = 16/32만 packing하는 도구로 재생성해 사이즈 절감** (§9.3)
- **video rotate 도구 미리보기 UX 추가 (2026-05-05)**: 라디오 옵션 변경 즉시 CSS `transform`으로 source video에 회전·반전 미리보기 적용. ffmpeg 처리(0.3~1× 영상 길이) 전에 시각 시뮬레이션 — 잘못된 옵션 선택 후 처리 시간 낭비 방지.
  - **변경** ① `video/rotate/index.html` CSS — `.video-preview.rot-{cw90,ccw90,rot180,hflip,vflip} video` 5종 transform + 0.3s ease transition + 90도 회전은 max-height 50vh로 제한(컨테이너 fit) ② drop-zone 아래 `<div id="sourcePreviewWrap">` source 미리보기 박스 + `.preview-hint` 안내 문구 ③ `video/rotate/rotate.js` — `applyRotPreview()` 함수, `loadFile()`에서 source URL 설정·미리보기 노출, `clearAll()`에서 source URL revoke·클래스 정리, 라디오 `change` listener
  - **"원래대로" 6번째 라디오 옵션** (value="none", 아이콘 □) — 회전·반전 미리보기 적용 후 원본으로 되돌리기. 선택 시 `applyRotPreview`가 클래스 모두 제거 + `rotateBtn.disabled = true` (변환할 게 없음). 초기화 버튼과 분리(초기화 = 영상 자체 제거 / 원래대로 = 영상 유지·transform 리셋)
  - **CSS transform 트레이드오프**: 90도 회전 시 video는 같은 크기로 회전돼서 가로 영상은 컨테이너에 잘 들어가지만 세로 영상은 회전 후 가로로 길어짐 → max-height: 50vh로 제한해 잘림 완화. 정확한 결과는 처리 후 resultVideo에서 확인하라는 hint 문구 노출
  - **재사용 패턴 후보**: video/ 다른 도구(compress·to-gif·to-mp3)에도 source preview 추가 가치 (현재 trim에만 source preview 있음). compress는 해상도 다운샘플 미리보기 X(canvas 비용), to-gif는 fps·width 시뮬 어려움, to-mp3는 영상이 아니라 무관. **rotate가 미리보기 ROI 가장 큰 케이스**
- **video wrapper cross-origin worker hang fix (2026-05-05, 부분 검증)**: 로컬 실기기 1라운드에서 hang 2단계 발견 + wrapper fix 적용. **사용자 콘솔에서 `[ffmpeg]` 로그 정상 출력 확인 = worker spawn·load 단계 통과**. 단 끝까지 처리·다운로드 완료 검증은 미완 (다음 세션 후보로 이관). 검증 완료 시 본 항목을 "결정 완료"로 마무리.
  - **원인 A — `+esm` worker URL 오작동**: `@ffmpeg/ffmpeg@0.12.10/+esm`의 `import.meta.url`이 `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm`이라 라이브러리 내부 `new Worker(new URL('./worker.js', import.meta.url))`가 `.../worker.js`(404)로 잘못 resolved + cross-origin Worker 차단(브라우저 보안 정책). 실제 위치는 `dist/esm/worker.js`(200 OK)
  - **원인 B — ESM module worker의 상대 import silent hang**: `dist/esm/worker.js` 첫 줄 `import {...} from "./const.js"`·`./errors.js`. Blob URL로 spawn된 module worker는 base가 `blob:`이라 상대 경로 resolve 실패 → 모듈 로딩 silent fail → `ffmpeg.load()` promise 영원히 pending → 메인 콘솔 `[ffmpeg]` 로그 0개로 hang처럼 보임 (워커 컨텍스트 에러는 메인 콘솔 안 찍힘)
  - **wrapper fix (`video/vendor/ffmpeg-loader.mjs`)**: ① `WORKER_JS_URL` = `dist/esm/worker.js` 추가 + IndexedDB 캐시(`worker-js-${VERSION}` 키) ② worker.js text fetch 후 정규식 `/from\s+(["'])\.\/([^"']+)\1/g`로 상대 import → jsdelivr 절대 URL substitute → Blob URL 생성 (const.js·errors.js 둘 다 자체 import 없는 pure exports라 OK) ③ `ffmpeg.load({ classWorkerURL, coreURL, wasmURL })` 명시 ④ `ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message))` 추가 — stderr → 메인 콘솔, 향후 디버깅 영구 자산
  - **영향 범위** = wrapper 1개 = 5도구(compress·trim·rotate·to-gif·to-mp3) 동시 fix. SW v14 유지(vendor STATIC_ASSETS 미포함, image/ 패턴 동일). 기존 IndexedDB core.js·wasm 캐시 그대로 유지·worker.js 캐시 새로 추가
  - **검증 가설** = 페이지 강제 새로고침 후 콘솔 `[ffmpeg]` 로그 다수 + 정상 처리되면 fix 완성. 로그 0개 그대로면 추가 fix(coreURL jsdelivr 직접 / `dist/esm` 통째 vendoring) 필요
  - **학습 포인트** = ① `+esm` jsdelivr 빌드 + Worker 조합은 위험, `import.meta.url` resolution 가정 X ② ESM module worker를 Blob URL로 spawn할 때 안에 상대 import 있으면 silent hang — 빌드 산출물 import 그래프 사전 확인 필수 ③ ffmpeg `+esm`은 `classWorkerURL`·`coreURL` 명시 전달이 안전 ④ audio 카테고리 진입 시 lamejs 등 encoder lib도 동일 패턴 점검 (WebAudio 0KB 본체는 무관)
  - **history 문서** = `history/video/2026-05-05-ffmpeg-worker-hang.md` 신규

### 9.2 보류 (사용자 결정 필요)

- [x] ~~**PWA(앱) 통합 정책**~~ — **A안 채택·완료 (2026-05-05)**: 사이트 전체 루트 통합. 상세 §9.1 참고. 기존 tools/만 PWA → 4 카테고리 60 페이지 PWA. SW도 root scope로 통합
- [x] ~~sw.js 단일 vs 카테고리별 분리~~ — **단일 root sw.js로 결정·완료 (2026-05-05)**. 자세한 캐시 전략 같이 갱신
- [ ] sitemap.xml 단일 vs 카테고리별 분리 (현재 단일 root, **60 URL** — 80~100 URL 도달 시 분리 검토)

### 9.3 후속 백로그 (수익 검증 후 재진입)

- text Tier 2 도구 (markdown, json-format, url-encode, case-convert)
- 후속 카테고리 (luck/quiz/random/track)
- 백엔드 도입 검토 (정적으로 막히는 use case 발견 시 — image/ 검증으로 OCR까지 정적 가능 확인됨, 명분 약함)
- **favicon.ico 사이즈 최적화** (현 285KB → 5~30KB) — png-to-ico default가 16~256 multi-res 모두 packing해서 큼. 16/32만 packing하는 도구(ImageMagick·sharp 등)로 재생성. 단 사용자 영향 미미(첫 fetch 1회 + 영구 캐시) = 우선순위 낮음

### 9.4 다음 세션 진입 후보

> **2026-05-07 IndexNow 인프라 도입 완료 + Bing Webmaster Tools 가입 진행 중 + 영어 시장 진입 Pilot 시작**: §9.1 결정 기록 참고. Bing·Yandex·Naver·Seznam 4 엔진에 67 URL 일괄 push 성공(HTTP 202). **Bing Webmaster Tools = msvalidate.01 meta 태그 적용 완료** (검증 대기). **영어 진입 = Phase A Pilot(`compound` 영어판 + i18n 인프라 + `/en/` 디렉토리 + hreflang 양방향) 진행** — 자세한 미래 작업 4개(TODO-A 커스텀 도메인 / TODO-B Phase B 잔여 도구 / TODO-C 영어 SEO 채널 / TODO-D i18n 미세 보강)는 §9.4 항목 10번 참고.

> **2026-05-05 카테고리 단일화 결정**: 계산기는 모두 `tools/` 하나로 유지. health/ 신설 시도는 회수됐으며 §4.5 후속 후보 4선(body-fat·heart-rate·ideal-weight·1rm)은 향후 `tools/`에 직접 추가 검토. test/ 진입 전·후 ROI 비교 결정.

> **2026-05-05 video 카테고리 5선 완료**: §5.5.2 Tier 1 5선 전부 라이브(compress·trim·rotate·to-gif·to-mp3). wrapper 1개로 5도구 = §0.2 정신 시각적 증거 완성. 다음 세션 후보 = (1) audio 카테고리 진입 (white-noise 1선 시작 — §5.5.3 검토) (2) PWA 통합 A안 (§9.2) (3) 로컬 실기기 검증 라운드 (4) 트래픽·체류 데이터 본 후 ROI 결정.

> **🚨 1순위 — video wrapper hang fix 끝까지 검증 (2026-05-05 부분 검증)**: 콘솔 `[ffmpeg]` 로그 출력 확인 = worker spawn·load 통과. 남은 검증 = 영상 처리(`ffmpeg.exec`) 완료 → 결과 미리보기 + 다운로드 버튼 정상 동작까지 끝까지 통과. 5도구 모두(compress·trim·rotate·to-gif·to-mp3) 동작 확인. 통과 시 §9.1 worker hang 항목을 "결정 완료"로 마무리. 실패 시 추가 fix 분기 (coreURL을 jsdelivr URL 직접 전달 fallback 또는 `dist/esm` 통째로 vendoring). 상세 = `history/video/2026-05-05-ffmpeg-worker-hang.md`

> **🚨 사용자 액션 1순위 — AdSense 신청 + 승인 시 affiliate hide 풀기 (2026-05-09 진입 가능 — 60 도구·affiliate hide 처리 완료)**: 사이트 콘텐츠 풍부도(60 도구·계산식·FAQ·sources) + AdSense placeholder 60곳 + 쿠팡 affiliate CSS hide → AdSense 리뷰어가 thin/affiliate-heavy 오인할 위험 0. **신청 절차** = ① https://www.google.com/adsense → 사이트 추가(`taystudios.com`) → 광고 코드 발급 (이미 `<script>` 39개 주석 처리 + 60 ad-slot 박혀 있음 — `data-ad-client` 채워넣을 차례) ② AdSense 리뷰 1~7일 대기 ③ 승인 메일 받으면 즉시 §7.5 절차대로: (a) `common/css/style.css` 끝 **두 hide 블록 모두 삭제** (ad-slot + affiliate) (b) `<script>` 39개 일괄 주석 해제 (perl one-liner) (c) 60 `.ad-slot`에 `<ins class="adsbygoogle">` 코드 삽입 (d) SW `CACHE_VERSION` v2→v3 bump (e) AdSense 콘솔 광고 자동 게재 + 쿠팡 위젯 4 + 추천링크 4 즉시 라이브. **현 시점 AdSense 미신청 X 신청 단계 → 즉시 진입 권장** — 신청 클릭 후 1주 안에 매출 2축(AdSense + 쿠팡) 동시 가동 가능

- **video 도구 로컬 실기기 검증** (전체 5도구) — 위 끝까지 검증 통과 후 진행. 첫 사용 ~32MB 다운로드 흐름 / IndexedDB 캐시 hit 확인 / iOS Safari WASM 동작 / 큰 영상 메모리 한계 / single-thread 처리 시간. image/bg-remove 검증 항목과 동일 패턴. 테스트용 샘플 영상은 ffmpeg lavfi 필터로 자체 생성 가능(testsrc·smptebars·sine 등)
- **다른 video 도구에 source preview 패턴 적용 검토** — rotate에 추가한 source 미리보기 박스가 ffmpeg 처리 전 시각 검증 효과 큼. trim은 이미 있음. compress·to-gif·to-mp3는 추가 가치 평가:
  - **compress**: 해상도·CRF 미리보기는 canvas decode·resample 비용 큼 → 현실적 X. 단 source 영상 + 메타(해상도·길이) 표시는 추가 가치
  - **to-gif**: fps·width 미리보기는 어려움. 단 source preview + 시작/끝 시각 입력은 trim 패턴 재사용으로 추가 가치 (구간 잘라서 GIF 만드니 시각 확인 필수)
  - **to-mp3**: 영상이 아닌 오디오 추출 도구 — `<audio>` source preview는 의미 X. 그대로 둠
  - 우선순위 = to-gif > compress > to-mp3
- **PWA 통합 (A안)** — image/ 9선 + video/ 5선으로 진입 후보 시점. SW STATIC_ASSETS에 카테고리·vendor 자산 일괄 추가
- **audio 카테고리 진입 검토** (§5.5.3) — white-noise 1선 시그너처 시작 권장(체류 시간 dominance). WebAudio 0KB 인프라라 작업량 작음. video와 별개 카테고리 (파일 처리 X 미디어 캡처)
- **video to-mp3 저작권 disclaimer 패턴 적용 검토** — 향후 audio/ 카테고리 출시 시 음원 다루는 도구(audio-trim·voice-recorder)에 동일 `.copyright-warning` 박스 패턴 재사용

1. **SEO Tier 1.1 후속 — OG 메타 보강** (2026-05-05 부분 완료) — 51 파일 OG 메타 audit 결과 누락 항목 일괄 보강. 사이즈는 PNG 519KB로 카톡(5MB)·페이스북(8MB)·X(5MB) 한계 전부 통과:
   - ✅ `og:image:type=image/png` 51/51 (2026-05-05) — iMessage·일부 슬랙 봇 미리보기 안정성
   - ✅ `og:image:secure_url` 51/51 (2026-05-05) — iMessage 일부 버전·Outlook 등 까다로운 클라이언트 호환성
   - ✅ `twitter:image:alt` 51/51 (2026-05-05) — 트위터 접근성·SEO 시그널. 텍스트는 기존 `og:image:alt` 재사용
   - 🚫 `history/index.html` OG 메타 추가 — **운영자 전용 페이지로 결정·작업 제외** (2026-05-05). `tools/404.html`도 의도적 제외 유지. 두 파일은 향후에도 OG audit 대상에서 제외
   - ✅ `og:image:alt` + `twitter:image:alt` 텍스트 톤 일치 51/51 (2026-05-05) — "TAYSTUDIO — 한국 실생활 도구 모음" → "TAYSTUDIO — 자주 쓰는 무료 도구 모음" 일괄 갱신. OG 이미지 카피와 일관
   - 🟡 카톡 미리보기 캐시는 사용자가 https://developers.kakao.com/tool/clear/og 로 수동 flush 필요 (자동 처리 불가) — 본 작업의 유일한 잔존 사용자 액션
2. ~~**SEO Tier 1.2 — 카테고리 hub 콘텐츠 깊이**~~ — ✅ 2026-05-05 완료. 4 카테고리 hub 모두 hub-intro 박스 + FAQ + JSON-LD FAQPage + ItemList 적용. 공용 `.hub-intro`·`.hub-faq` CSS는 `common/css/style.css`. §9.1 결정 기록 참고
3. **SEO Tier 2.2 — HowTo JSON-LD 잔여 2 도구** (~30min) — qr-gen·pdf-merge·img-to-pdf·video/compress 4개는 ✅ 완료(2026-05-05). 잔여 = **bg-remove**·**video/trim**. step-by-step 카드 리치 스니펫 후보 → CTR ↑. 트래픽·SC 데이터 보고 우선순위 결정
4. **tools/ 건강 도구 보강 — 1선 잔여** (§4.5 후속) — ✅ body-fat·ideal-weight·heart-rate 3선은 2026-05-05 출시 완료(§9.1 기록). 잔여 = **1rm**(1회 최대 반복, Epley·Brzycki). 단 운동인 좁은 SERP라 우선순위 낮음 — `tools/`에 추가하더라도 트래픽 ROI 약함. test/ 카테고리 진입 전·후 비교 결정
5. **§5.5 차세대 카테고리 후보 — video / audio / convert** (2026-05-05 등재) — 브라우저 한계 끌어올리기. 3 후보 모두 §0.3 3 질문 통과:
   - 🎬 **video** (Tier 1 5선: compress·trim·to-gif·to-mp3·rotate) — ffmpeg.wasm. SERP·광고 ★★★. **단순 ROI 1순위** 단 작업량 image/ 수준
   - 🔊 **audio** (Tier 1 5선: **white-noise**·metronome·audio-trim·decibel·voice-recorder) — WebAudio 0KB + lamejs. 백색소음 1개로 체류 1시간+ → AdSense 노출량 dominance. **시그너처 1개 ROI 검증**으로 적합
   - 🔄 **convert** (Tier 1 6선: length·area·temperature·weight·timezone·exchange) — 0KB. 트래픽 ★★★ 단 단발. tools/ 흡수 vs 별도 카테고리 분리 결정 필요(§5.5.6)
   - 진입 순서 권장: 작업량 작은 순 = convert → audio → video / 시그너처 강한 순 = audio (white-noise만) → video → convert
6. **test/ 카테고리** (3단계, plan §5) — vision·color-blind·hearing·reaction·typing 5종. SNS 바이럴·재방문 도구. 각 도구 페이지 내부 disclaimer (image/ocr·bg-remove 패턴 재사용 — 의료 진단 대체 X). **§5.5와 ROI 비교 후 결정**
5. ~~**PWA 통합 (A안 — 루트 manifest)**~~ — ✅ 2026-05-05 완료. §9.1 결정 기록 참고. **다음 검증 단계** = (1) 사용자 Chrome DevTools → Application 탭에서 manifest·SW 정상 인식 (2) "앱 설치" 또는 "홈 화면 추가" 동작 확인 (3) Lighthouse PWA 점수 / 오프라인 동작 / installability (4) iOS Safari Add to Home Screen UX (5) install prompt 새 보라+WEB 디자인·"TayTools" 이름 확인 (캐시 클리어 필요 시 DevTools → Storage → Clear site data)
- **`readVideoFile` 5개 도구 적용** (compress·trim·rotate·to-gif·to-mp3) — `loadFile`을 async 변경 + 즉시 `readVideoFile(file)` 호출 + `currentBuffer` state로 캐시 → file 권한 만료 회피 (특히 Android Chrome·iOS Safari 일반 모바일). `run()`에서 `toUint8Array(currentFile)` → `currentBuffer` 사용. `clearAll()`에서 `currentBuffer = null`. 5개 도구 일관 변경 = 큰 작업이지만 효과 큼. 사용자 in-app 외부 브라우저 진입 후 fail 사례 보고하면 우선 진행
- **✅ 헤더 깜박임 완전 해결 + index.html PDF 라벨 vertical line 정렬** (2026-05-09 완료, commit 8107584 + e63acec) — **현상**: MPA 정적 사이트라 메뉴 클릭마다(계산기·pdf·이미지·동영상) 헤더 inner content가 사라졌다 다시 등장. 원인 = `<script src="/common/site-chrome.js" defer>`로 늦게 실행되어 첫 paint에 헤더 비어있고 site-chrome.js의 connectedCallback 후에야 inner 채워짐. **해결 3단**: ① **70 HTML 파일 모두 script를 `</body>` 직전 → `</head>` 직전 blocking 이동 + `defer` 제거** (perl one-liner 일괄 처리). custom element 등록이 body parse 전에 완료 → `<site-header>` 즉시 upgrade → 첫 paint부터 컨텐츠 채워짐 ② `common/css/style.css`에 `site-header { display:block; min-height: 64px (mobile 80px); bg+border }` 예약 → JS 늦게 실행되더라도 0px 점프 방지 ③ `common/site-chrome.js`에 `wasInstallEligible()` localStorage 캐시 — beforeinstallprompt 한 번 받으면 다음 페이지부터 install 버튼 즉시 노출. **트레이드오프**: 첫 paint 지연 ~5~15ms (cached) / ~50~150ms (첫 방문) — 사실상 인지 불가. SW `CACHE_VERSION` v13 → v14 bump으로 PWA 사용자 자동 갱신. View Transitions API도 시도했으나 defer 스크립트와 결합 시 NEW 페이지 스냅샷이 빈 헤더로 잡혀 morphing이 오히려 악화 → 제거. **PDF 라벨 정렬** = `index.html` quick-list의 `.ql-label`에 `min-width: 52px` 추가 → 한글 라벨(계산기·텍스트·이미지·동영상) ~50px와 영어 PDF ~30px 차이로 PDF만 border-right가 왼쪽으로 밀린 현상 해결
- **✅ 쿠팡 파트너스 — 가입·도구·위젯 4개·추천링크 4개 라이브 완료 + AdSense 승인 전까지 affiliate 영역 CSS hide 처리** (2026-05-09 완료, 상세 = `history/coupang-partners/index.html` + `widget-howto.html`) — **완료 항목**: ① **쿠팡 파트너스 가입** (회원 ID `AF4086854`, 즉시 "활동 중") ② **모니터 PPI·시야거리 도구** (`tools/monitor/` — index.html + monitor.js, JSON-LD WebApp+Breadcrumb+FAQ 7건, 4 추천 카드 + disclosure) ③ **카테고리별 베스트셀러 자동 추천 — Playwright + CDP로 너 Chrome에 연결해서 retail 쿠팡 직접 스크래핑** (Akamai 봇 차단 우회 — `--remote-debugging-port=9222` 사용, `pkill -9 + open --user-data-dir=/tmp/chrome-debug-coupang` 패턴, 4 카테고리 × 70~80개 unique 상품 추출 후 리뷰수·브랜드 가중치로 1 픽업) ④ **위젯 4개 박음** (한성 TFG27F24V2 게이밍 213,220원 619리뷰 / 삼성 S27F610 사무 500,000원 190리뷰 / ASUS ProArt PA329CV 영상편집 422,200원 / 한성 TFG24F14P2 세컨드 117,200원 2,491리뷰) ⑤ **추천 단축링크 4개 박음** (`https://link.coupang.com/a/eFY*` — "더 보기 →" CTA용) ⑥ commit + push + IndexNow ping. 도구 수 59 → **60선**, sitemap 67 → **68 URL** ⑦ **AdSense 미승인 동안 affiliate 영역 임시 hide** (`common/css/style.css` 끝의 두 번째 hide 블록 — `.purpose-grid` · `.partner-disclosure` · `.affiliate-section-title/intro` 4개 selector. AdSense 리뷰어가 affiliate 비중 오인할 위험 차단. 코드·iframe·단축링크는 그대로 — CSS hide만. **승인 후 단일 블록 삭제로 즉시 unhide**). — **백로그**: 저장공간 도구(`tools/storage/`)에도 추천 카드 영역 추가(5 카드 SD/USB·256GB SSD·1TB SSD·4TB HDD·NAS) — `history/coupang-partners/widget-howto.html` 방법론 그대로 재사용 / baby(분유) · pet(사료) 재구매 단가 도구. 상세 = `history/candidate/coupang-affiliate-tools.md`
- **🔔 AdSense 승인 후 재활성화** (2026-05-05 비활성 처리 완료) — 승인 메일 받으면 즉시 진행:
  1. **CSS hide 풀기 — 두 블록 모두 삭제** = `common/css/style.css` 끝의 ① `/* AdSense 미승인 ... */ .ad-slot { display: none !important; }` 블록(3줄) → 60개 ad-slot 재노출 + ② `/* AdSense 미승인 — 쿠팡 파트너스 추천 카드 영역 임시 숨김 ... */` 블록(7줄) → tools/monitor의 `.purpose-grid · .partner-disclosure · .affiliate-section-title/intro` 재노출 (쿠팡 위젯 4 + 추천링크 4 즉시 라이브 광고 가동)
  2. **`<script>` 39개 일괄 주석 해제** =
     ```bash
     grep -rl 'AdSense 미승인 — 승인 후 주석 해제' --include='*.html' | \
       xargs perl -i -pe 's|<!-- AdSense 미승인 — 승인 후 주석 해제: (<script[^>]*></script>) -->|$1|g'
     ```
     실행 후 `grep -rl 'AdSense 미승인' --include='*.html' | wc -l = 0` 확인
  3. **각 `.ad-slot` 안에 AdSense 코드 삽입** = AdSense 콘솔에서 발급받은 `<ins class="adsbygoogle" data-ad-client="..." data-ad-slot="..." ...></ins>` + `(adsbygoogle = window.adsbygoogle || []).push({});` 코드 60개 위치(도구 페이지 결과 위/하단·hub 중간/하단)에 채우기
  4. **SW `CACHE_VERSION` v2 → v3 bump** = 새 HTML 캐시 갱신
  5. **광고 정책 검증** = `tools/privacy/`에 광고 쿠키 동의·GDPR·KISA 명시 (이미 base 있음, 보강 검토)
  6. **검증** = AdSense 콘솔의 "광고 자동 게재" + 사이트 첫 방문 시 광고 노출 확인. RPM·CTR 데이터 1주 후 `dash-tay9k3m/` 운영자 dashboard에서 비교
- **native 안드로이드 앱 진입 시 nav 버튼 추가** (Play Store 등재 후) — site-header nav에 `<a class="play-btn">Play 스토어</a>` 추가. CSS는 `.install-btn` 패턴 그대로 + `background: #01875F` (Play green). Play 스토어 URL은 등재 후 결정. 사용자 nav에서 PWA(보라 "웹앱 설치") vs native(green "Play 스토어") 한눈에 구분. plan §10 비즈니스 트랙(TWA Bubblewrap 또는 Kotlin native 결정) 진입 시점에 활성화
6. **image/ AI 도구 manual 실기기 검증** — bg-remove의 첫 모델 다운로드 흐름·iOS Safari WASM 동작·메모리, OCR 한국어 모델 다운로드, qr-scan 카메라 권한
7. **bg-remove medium/large 모델 옵션** — 사용자 피드백·트래픽 봐서 선택 토글 추가 (small 43MB / medium 80MB / large 180MB)
8. **SEO 측정** — 1주~1달 후 Search Console CTR 변화·노출수, 카카오톡 미리보기 디버거, Twitter Card Validator, AdSense RPM 비교 (og:image rollout 효과 검증)
9. **LICENSE 추가 — 클론·택갈이 2차 방어** (~2min, 트레이드오프 검토 필요) — 1차 방어(JS 도메인 가드 + HTML watermark, §9.1 기록)에 더해 repo 루트에 `LICENSE` 파일 추가 검토:
   - **AGPL-3.0** 추천 — 수정 후 서비스로 제공해도 소스 공개 의무. 광고 도용자도 자기 사이트의 소스 공개 의무 = 자기 AdSense·쿠팡 ID 노출 = 실질적으로 광고 도용 어렵게 만듦. **DMCA 명분 결정적**. 단점: contributor 받기 어려움 (현 단계 무관)
   - 대안: **CC BY-NC-SA 4.0** (코드보단 콘텐츠 라이선스라 부적합) / **MIT** (광고 도용 허용 = 부적합)
   - 현 상태(LICENSE 부재) = 묵시적 ARR (All Rights Reserved). 명시 안 해도 무단 사용 자체가 침해. 다만 분쟁 시 명시 라이선스가 더 강한 명분
   - 진입 시점 = 사이트 트래픽이 도용자에게 매력적인 규모(월 5000+ 방문)에 도달한 후. 현 단계는 1차 방어(§9.1)면 충분
   - 트레이드오프 = AGPL은 강제력 강하지만 fork·기여 진입 장벽 ↑. 사이트 본질이 contributor 받는 OSS가 아니라 운영자 단독 서비스라 AGPL이 부합
10. **🌐 영어 시장 진입 — `/en/` path Pilot (2026-05-07 초안 → 2026-05-10 stash 복원·도메인 갱신)** — 글로벌 트래픽·AdSense 영어 RPM($3~8, 한국 대비 ~3배) 노림. **권장 시점 조건(한국 5000+ MAU·AdSense 안정 수익) 미충족 상태에서 사용자 결정으로 조기 진입** (Pilot 1선만, 트래픽·SEO 데이터 보고 확장). 사용자 우선순위는 **image/pdf 부터** 추후 대형 커뮤니티로 확장.
    - **Phase A — Pilot scaffold 복원 (2026-05-07 작성 → 2026-05-10 stash pop·`taystudios.com` 도메인 일괄 갱신)**: `compound`(복리 계산기) 영어판 1선 + `/en/` 디렉토리 구조(`en/index.html`·`en/tools/index.html`·`en/tools/compound/`) + hreflang 양방향 alternate. 결과 = 인프라 검증 + 영어 SEO 첫 시드 URL 3개(`/en/`·`/en/tools/`·`/en/tools/compound/`). **i18n 인프라(site-chrome.js 언어 감지·토글)는 미반영** — 현재 헤더는 ko 기준, en/ 페이지에서 한국 사이트 링크만 노출. Phase B 진입 시 토글 추가 검토
    - **구조 결정 = `/en/` path** (서브도메인 vs 별도 도메인 vs path 평가 결과): 단일 repo 인프라 공유, 한국 도메인 권위 일부 흡수, 정적·무비용 정신 → path가 최선. **canonical + hreflang alternate** 양방향 명시
    - **✅ TODO-A: 커스텀 도메인 — DONE (2026-05-09 `taystudios.com` migration 완료)** — 진입 의도와 무관하게 **한국 시장 SEO 신호 본격화 + AdSense 단가 천장 이슈로 영어 출시 전 선제 migration**. 상세 = §9.5. 결과: en/ 시드 URL은 처음부터 `taystudios.com/en/*`로 SEO 누적 가능 (이전 비용 절감). **추후 Phase B·C 진입 시 추가 도메인 작업 불필요**
    - **TODO-B: Phase B — 잔여 universal 도구 ~32선**: Pilot 1선 검증 후 진입. **사용자 우선순위 = Image → PDF 부터 시작** (한국 특화 X·작업 최소·UI 라벨만). 순서 권장 = Image 9선 → PDF 5선 → Video 5선 → text/sns-format → Universal 계산기 5~10선(bmi·calorie·dday·loan·savings·body-fat 등). 한국 특화 20+ 계산기(salary·acqtax·gifttax·inheritance 등)는 ko 전용 유지 — 번역 X. 작업량 = ~30~50시간 (도구당 1~2시간). **번역 전략 = AI 초안 + 사용자 검수**
    - **TODO-C: 영어 SEO·트래픽 채널** (한국 채널과 완전히 별개):
      - **Reddit**: r/InternetIsBeautiful·r/usefulwebsites·r/webdev — 도구 소개 게시 (1~3회 시도)
      - **Hacker News "Show HN"** — 1회 (강한 첫인상 필요)
      - **Product Hunt** 런칭 — 1회 (도구 카테고리)
      - **Indie Hackers·Designer News** — 누적 백링크
      - **백링크 자연 누적** — 시간 들지만 도메인 권위 누적
      - **Search Console international targeting** — 영어판 출시 후 설정 (현재 GSC `taystudios.com` URL prefix property 이미 검증됨)
      - **장기**: 추후 대형 커뮤니티 확장 — 사용자 결정 사항
    - **TODO-D: i18n 미세 보강** (Phase B 진입 시 필요):
      - `manifest.webmanifest` 다국어 지원 (`/en/manifest.webmanifest` 별도) — Phase B 진입 시
      - og-image 영어 변형 검토 — 현재 brand-only(`TAYSTUDIO`)라 재사용 OK, 단 영어 카피 추가 시 별도
      - `<html lang>`·`<og:locale>` 자동 감지 검토 (현재는 `/en/` path 명시 기준)
      - sitemap.xml에 `/en/*` 3개 시드 URL 추가 (Phase A 복원 직후 작업)
      - site-chrome.js 언어 토글 — Phase B 진입 시 검토
    - **차별화 메시지** (모든 영어 페이지 공통): "**Your file never leaves your browser**" — privacy-first. TinyPNG·SmallPDF·remove.bg·waifu2x.io 같은 클라우드 클론 대비 차별. 글로벌 시장에서도 약한 어필이지만 commercial site와 차별 가능
    - **위험·트레이드오프**:
      - 영어 시장 경쟁 매우 심함 (`.com` 글로벌 도구 천지)
      - 이중 유지 비용 (도구 1개 추가 = 2배 작업)
      - 한국 시장 자원 분산 위험
      - SEO 도메인 권위 — `taystudios.com` 한국 시장 5/9 migration 후 누적 진행 중, 영어 SERP에서는 0부터
    - **권장 흐름**: **Phase A 복원 검증(이번 turn) → sitemap에 /en/ 추가 + Pilot 1선 검증(1~2주) → Phase B 진입(image/pdf 우선) → Phase C 외부 채널 병행** 가 ROI·작업량 최적
11. **📚 plan.md 분량 압축 검토** (2026-05-10 등재, 사용자 관찰) — 본 plan.md = 1000+ 줄, 매 세션 진입 시 컨텍스트 부담. 영어판부터 별도 doc(`history/plan/plan_en.md` + `history/index_en.html`)으로 분리한 결정의 일부 동기. **압축 전략 후보**:
    - **A안 (가장 가벼움)**: 완료 항목(`§9.1 결정됨` 일부, `§9.5.1 끝난 작업` 등) → `history/index.html`로 이관 후 plan.md에는 한 줄 요약 + history article link만. plan.md = "현재·향후" 만 다루고 "과거"는 history로
    - **B안 (구조 재편)**: plan.md를 `plan-overview.md`(본질·전략·인프라 §0~§7) + `plan-roadmap.md`(§9 결정·진행·세션 후보)로 분리. cross-reference 비용 ↑
    - **C안 (현 상태 유지)**: 단일 plan.md. 분량 부담 vs 단일 진입점 장점 트레이드오프 수용
    - **트레이드오프**: 압축 = 매 세션 부담 ↓, 단 과거 결정 컨텍스트가 분산되어 후속 의사결정 시 history까지 확인 필요. 현 단계는 부담이 임계점은 안 넘었다고 판단(추가 카테고리 진입 시점에 재평가 권장)
    - **진입 시점**: plan.md 1500줄 도달 시 또는 `§9.1 결정됨` 항목 30개 초과 시
    - **현 단계 권장**: A안. 영어판 분리는 이미 부분 적용된 셈
12. **📌 `plan.md` ↔ `plan_en.md` 동기화 추적** (2026-05-10 등재) — 두 plan 분리 후 한국판 변경 시 영어판도 갱신해야 하는 비용 발생. **현 상태 = 영어판은 한국판 §0 컨텍스트만 요약 흡수, §1~§9는 영어 전용** → 동기화 영역은 §0(컨텍스트), §0.4(migration 상태), monetization 정책 정도로 좁음. 분기 심해질수록 자연스럽게 별도 트랙. **모니터링 트리거**: 한국판 §0 변경 시 영어판 §0 갱신 여부 확인. 진행 후보:
    - 한국 plan.md §0(본질·인프라·monetization) 변경 시 = 같은 PR에서 plan_en.md §0 갱신
    - 한국 §9.5 migration 완료 시(이미 5/9 완료) = 영어판 §0.4 일치 확인 (5/10 정합)
    - 영어판 사용자 결정·우선순위 변경 시 = 한국판 §9.4-10에 한 줄 미러 (양방향 시너지)
    - **분기 임계점**: 영어판이 자체 §1~§9 발전해서 plan_en.md가 500줄 초과하면 한·영 별도 운영 일관 인정. 동기화 영역은 §0뿐
13. **🔗 `history/index.html`에 영어판 history link 추가** (2026-05-10 등재) — 현재 한국 dashboard(`history/index.html`)는 영어판 history(`history/index_en.html`) 존재 인지 X. 영어판은 한국판 link 있음(timeline 5/9 article + 컨텍스트 카드) → **한 방향 link**. 양방향 cross-discoverability 위해 한국 dashboard에도 영어판 진입점 추가 필요:
    - **위치**: `<header class="site-header">` nav 또는 컨텍스트 카드 (legend 위)
    - **표기**: "영어판 진행 이력 (EN) →" 작은 link
    - **작업**: ~5분 (단일 `<a>` 추가)
    - **시점**: 영어판이 첫 article 1개 이상 의미 갖춘 후 (= 5/10 Phase A baseline 이후 = 지금) 진입 가능
    - **현 단계 안 건드린 이유**: 사용자 검토 후 결정 — 한국 dashboard 톤에 맞는 표기·위치 사용자 의견 필요

---

## 9.5 도메인 Migration 진행 상태 (2026-05-09)

> **현 상태 = 검색엔진 3채널(Google SC + Naver SA + Bing WMT) + IndexNow + AdSense 메타·script 100% 커버·검토 요청까지 완료, AdSense 검토 결과 1~7일 대기 (2026-05-09 16:55).** Cloudflare Registrar `taystudios.com` 등록 + DNS·GitHub Pages 연결 + Enforce HTTPS ON + 코드 일괄 sed + sitemap rebuild + SW v13까지 완료(2026-05-09 14:00). **GSC** = URL prefix property 검증 + Change of Address = "이전 중". **Naver SA** = 신규 사이트 검증 + 사용자 인증·sitemap·웹페이지 수집 진행 중. **Bing WMT** = Import from GSC 자동 verified + IndexNow ping 67 URL HTTP 200. **AdSense** = 옛 사이트 "준비 중" 스턱 원인 발견(commented script) → 메타 검증 + script 일괄 활성화 + 메타·script 100% 커버(68 파일) + 검토 요청 진행. 진행 갱신 = §9.5.8, 6개월 후 정리 절차 = §9.5.9, 채널별 상세 = `history/migration/google-search-console/index.html` · `history/migration/naver-search-advisor/index.html` · `history/migration/bing-webmaster-tools/index.html` · `history/migration/adsense/index.html`.

### 9.5.1 끝난 작업 (검수 대상)

| Step | 내용 | 결과물 |
|---|---|---|
| 0 | 진행 dashboard 작성 | `history/migration/index.html` (noindex, 운영자 전용) |
| 1 | 영어 분기 작업 stash | `stash@{0}: english-pilot-wip` (modified 5 + en/ + concept-domain-migration.html) |
| 2 | Tier A — 60+ HTML 일괄 sed | canonical · OG · JSON-LD 호스트 새 도메인 |
| 3 | Tier B — robots·scripts·운영 문서 12개 sed | DOMAIN/HOST 변수 + Sitemap·IndexNow key 위치 |
| 4 | site-chrome.js mirrorWarn(ko/en) + sw.js v12→v13 | ALLOWED 옛 도메인 라인은 의도적 보존 |
| 5 | 시점 분기 entry 작성 | `history/seo/2026-05-09-domain-migration.md` |
| 6 | sitemap rebuild | 67 URL 새 호스트 (IndexNow ping은 push 후) |
| 7 | 로컬 검증 통과 | grep 0건 (보존 정책 외) · sitemap 67건 |
| + | `og-image.svg` 도메인 텍스트 갱신 | OG 이미지 표기 일치 |

총 **88 files modified + 신규 2건** (`history/migration/index.html`, `history/seo/2026-05-09-domain-migration.md`).

### 9.5.2 의도적 잔존 (옛 도메인 라인 — 갱신 X)

| 위치 | 이유 |
|---|---|
| `common/site-chrome.js` ALLOWED 두 곳 (line 121·418) | 전환기 6개월~1년 동안 옛 도메인 GET 시 false positive 미러 경고 방지 |
| `dash-tay9k3m/index.html` GA 속성 안내 + GitHub repo URL 3건 | GA 속성명·실제 repo 경로는 도메인과 무관, 사용자 결정 영역 |
| `history/seo/*` 일자별 entry 다수 | 시점 기록의 정합성 보존 — 시점 분기 entry로 대체 명시 |
| `history/migration/index.html` · `history/seo/2026-05-09-domain-migration.md` | 옛→새 transition 자체를 기록하는 문서 |

### 9.5.3 검수 포인트 (commit 전)

1. **Cloudflare DNS** — apex `A` 4개(185.199.108-111.153) + `AAAA` 4개 + `www` CNAME `<user>.github.io.` 설정 완료?
2. **GitHub Pages** — Settings → Pages → Custom domain `taystudios.com` 입력 + "Enforce HTTPS" 체크 완료?
3. **`https://taystudios.com/` 응답** — 현재 옛 sitemap 캐시 상태일 수 있음 (commit/push 후 새 sitemap 반영)
4. **단일 commit 메시지 확정** — 권장: `domain migration: taystudio.github.io → taystudios.com (Cloudflare Registrar)`
5. **commit 범위 확인** — `git diff --stat`로 88 files 검토 후 진행

### 9.5.4 Post-commit 자동 작업 (push 직후)

- `bash scripts/indexnow-ping.sh` — Bing·Yandex·Naver·Seznam 67 URL 일괄 push (HTTP 202 기대, key 파일 GitHub Pages 배포 후 ~1분)
- curl 검증 — 새 도메인 핵심 path 9곳 200, IndexNow key 본문 일치, 옛→새 301 redirect

### 9.5.5 Post-commit 사용자 액션 (콘솔 UI — 약 1시간)

| 채널 | 핵심 작업 | 메타 코드 |
|---|---|---|
| **Google Search Console** | Domain property 추가 → DNS TXT 검증 → Change of Address(옛→새) → sitemap 제출 → URL Inspection 5건 | DNS TXT (자동 발급) |
| **Naver Search Advisor** | 사이트 추가 → meta 발급 → 검증 → sitemap → 웹페이지 수집 5~10건 | HTML meta — 사용자가 코드 던지면 내가 삽입 |
| **Bing Webmaster Tools** | 사이트 추가 → msvalidate.01 발급 → 검증 → Site Moves(옛→새) → sitemap | HTML meta — 사용자가 코드 던지면 내가 삽입 |
| **카카오 OG flush** | developers.kakao.com/tool/clear/og → 루트·5 hub·인기 도구 5건 flush | — |

GA4·AdSense 도메인 추가도 같은 시점에. 자세한 단계 = `history/migration/index.html` 또는 `history/seo/2026-05-09-domain-migration.md` 참고.

### 9.5.6 남은 작업 (다음 세션 진입 시 "재개해줘")

1. ✅ §9.5.3 검수 → §9.5.4 commit·push·IndexNow ping·curl 검증 (2026-05-09 완료)
2. ✅ §9.5.5 검색엔진 4채널 등록 + AdSense + GA4까지 (2026-05-09 완료)
3. ⏳ 영어 분기 stash pop → en/ 안 옛 도메인 ~40건을 새 도메인으로 갱신 (`stash@{0}: english-pilot-wip` 살아 있음)
4. ✅ memory `project_taystudio.md` 도메인 = `taystudios.com` 갱신 (2026-05-09 완료)

### 9.5.7 도메인 단일 관리 인프라 (2026-05-09 후속)

migration 직후, 다음 도메인 변경 시 수동 sed 부담 제거 위해 도구 3종 도입. HTML 절대 URL은 SEO 안전상 정적 유지(Naver·Bing·카톡 OG·X 봇 일부 JS 미실행 → runtime 주입 X). 빌드 단계 도입 X (현 main 직배포 워크플로 보존).

| 파일 | 역할 |
|---|---|
| `scripts/config.sh` (신규) | `DOMAIN_SCHEME`·`DOMAIN_HOST`·`INDEXNOW_KEY` 단일 source. `DOMAIN`·`HOST`·`KEY`·`KEY_LOCATION` 합성 후 export |
| `scripts/migrate-domain.sh OLD NEW` (신규) | git 추적 파일 중 `*.html`·`*.svg`·`*.xml`·`robots.txt`·`*.txt` 일괄 sed. exclude = `history/`·`dash-tay9k3m/`·`common/site-chrome.js`·`scripts/`. `--dry-run` 옵션 지원 |
| `scripts/verify-domain.sh OLD` (신규) | git 추적 파일 grep. 의도적 잔존(history·dash·site-chrome·plan.md·README·INDEXING_CHECKLIST)은 분류, 의도 외 잔존은 exit 1 |
| `scripts/build-sitemap.sh` (갱신) | 11번 줄 `DOMAIN=` 제거 → `source config.sh` |
| `scripts/indexnow-ping.sh` (갱신) | 16-19번 줄 4개 변수 제거 → `source config.sh` |

**다음 도메인 변경 흐름** (1명령):
1. `bash scripts/migrate-domain.sh --dry-run OLD NEW` — 영향 범위 확인
2. `bash scripts/migrate-domain.sh OLD NEW` — sed 적용
3. `scripts/config.sh`의 `DOMAIN_HOST` 수동 갱신 (단일 source)
4. `common/site-chrome.js` ALLOWED·mirrorWarn 정책 결정 (전환기 false positive 정책)
5. `bash scripts/verify-domain.sh OLD` — 잔존 검증 (exit 0 기대)
6. `bash scripts/build-sitemap.sh` — sitemap 재생성 + IndexNow ping

**검증 통과** = 5 스크립트 syntax ✓ / config.sh source 후 4 변수 정상 / sitemap 67 URL 동일(lastmod 외 구조 동일) / IndexNow dry-run host·key·67 URL 동일 / verify-domain.sh `taystudio.github.io` = 의도적 잔존 21개·의도 외 0개 exit 0 / migrate-domain.sh dry-run 76개 대상 + 2개 exclude 정상 분류

### 9.5.8 진행 갱신 (2026-05-09 15:30 기준)

§9.5.1~§9.5.7 작성 시점(13:55) 이후 push + 검증 + 채널 등록 진행. 채널별 상태:

| # | 채널 | 상태 | commit | 검증 코드 (라이브) | 비고 |
|---|---|---|---|---|---|
| 1 | **GitHub Pages Enforce HTTPS** | ✅ ON | (콘솔 토글) | http→https 301 정상 | `curl -sSI http://taystudios.com/` → `301 Moved Permanently` |
| 2 | **Google Search Console** | ✅ 검증 완료 + 주소 변경 이전 중 | `c2913bd` | `uiMTiQjh9FfPJu7Mx4FxF-hiRG5eq6Pi7qrIYqzR3Nw` | URL prefix property. 옛 property에서 Change of Address 신청 → "이전 중". 옛 코드 `X6nU3Kz5e0V_...`도 head 유지 |
| 3 | **Naver Search Advisor** | 🟡 검증 메타 라이브 / 사용자 사이트 등록 작업 중 | `c170f15` | `4cdee18ea9529c885139c0d5971830541da2b23c` | 옛 코드 `bfe7d4c2ed7faf...`도 head 유지. Change of Address 기능 없음 → 옛 사이트 등록은 별도 삭제 필요(§9.5.9) |
| 4 | **Bing Webmaster Tools** | ✅ Import from GSC 자동 verified + sitemap + URL Submission 10건 + IndexNow ping | (commit 0건 — head meta 추가 불필요) | `064396E810073C47308AEC058EDC3846` (계정당 1개) | **Site Moves UI 제거 발견** → 자동 감지로 대체. URL Submission UI batch 안 됨 → 핵심 10건 수동 + 나머지 IndexNow 위임 |
| 5 | **AdSense 신규 도메인 추가** | ✅ 메타 검증 + script 100% 커버 + 검토 요청 (1~7일 대기) | `b4ad7d0` (메타 검증) + `328ad86` (script 40 활성화) + `5daf2a6` (메타·script 100% 68파일) | `ca-pub-3553250610781349` | **옛 사이트 "준비 중" 스턱 원인 발견** = commented script로 인해 광고 코드 미발견. 메타 검증 통과 후 정공법으로 script 활성화 + 카테고리 26 + root까지 100% 커버 |
| 6 | **IndexNow ping** | ✅ HTTP 200, 67 URLs queued | (외부 API POST — commit 무관) | key `b762f70e61da4ac199b51566e31748b3` 라이브 200 | `bash scripts/indexnow-ping.sh` 실행 → Bing·Yandex·Naver·Seznam 4 엔진 동시 push |
| 7 | **카카오 OG flush** | ⏳ 미진행 | — | — | developers.kakao.com/tool/clear/og — 메인 + 5 hub + 인기 도구 5건 (선택, 5분) |
| 8 | **Google Analytics 4** | ✅ 코드 변경 0건 (사전 통합) — 콘솔 데이터 스트림 URL 갱신 사용자 잔여 | — | `G-79C40NJRYT` (도메인 무관 단일) | `common/site-chrome.js:137-148` IIFE에서 동적 주입. analytics는 client-side만 영향이라 JS 주입 OK. 신규 도메인 같은 ID로 fire 중 — 데이터 수집 작동. 콘솔 라벨 갱신은 인지 정합성 차원 |

**라이브 14항목 검증** (`history/checklist/2026-05-09-domain-migration-live-check.md`) = 13/14 통과, HTTP→HTTPS 강제 1건 ⚠️ → §9.5.8 #1로 해소 완료.

**신규 추가 history 문서 6건**:
- `history/checklist/2026-05-09-domain-migration-live-check.md` (118줄) — push 직후 14항목 curl 검증 결과
- `history/migration/google-search-console/index.html` (654줄) — GSC 작업 6단계 상세 + 타임라인 + 의사결정 메모 + 6개월 후 검증 명령
- `history/migration/naver-search-advisor/index.html` (656줄) — Naver SA 작업 4단계 + Naver vs Google 비교 + 우선순위 13 URL + 인덱싱 가속 체크리스트
- `history/migration/bing-webmaster-tools/index.html` (~720줄) — Bing WMT 작업 7단계 + Site Moves UI deprecation 발견 + IndexNow ping 67 URL HTTP 200 push 결과 + 자동 감지 시그널 5/5 충족 표
- `history/migration/adsense/index.html` (~750줄) — AdSense 작업 6단계 + "준비 중" 스턱 원인 발견 + script 활성화·100% 커버 + 라이브 검증 7 sample + 검토 1~7일 대기
- `history/migration/ga4/index.html` (~640줄) — GA4 작업 3단계 + 사전 통합 발견 + JS 주입 정책 정리 + GA4 vs 4채널 비교 + 콘솔 라벨 갱신 절차

**`history/migration/index.html` dashboard 갱신** = 진행 88% → ~95%, 진행 스냅샷 표 7→4 채널 ✓ 처리, taystudios.com 접속 시퀀스 다이어그램 신규 섹션 추가 (5 lifeline · 11 step · 변형 시나리오 2건).

### 9.5.9 6개월 후 정리 절차 (목표 = 2026-11-09 무렵)

옛 도메인(taystudio.github.io) 인덱스 시그널이 신규로 자연 이전되는 데 약 6개월 소요. 그 시점에 채널별로 다른 정리 절차 필요 — Google은 이전 신청만으로 자동 처리되지만, **Naver는 옛 사이트 등록 직접 삭제**해야 함.

**선결 조건** (정리 전 확인):
1. GSC 옛 property(taystudio.github.io) 노출수·클릭수 트렌드 거의 0 수렴
2. Naver SA 옛 사이트 분석 화면 노출수 거의 0 수렴
3. `site:taystudio.github.io` Google·Naver·Bing 모두 결과 수 거의 0
4. Analytics(GA4) referrer/source의 `taystudio.github.io` 트래픽 0 근사

**채널별 정리 절차**:

| 채널 | 6개월 후 액션 | 자동/수동 | 이유 |
|---|---|---|---|
| **Google SC** | 옛 property 그대로 둬도 됨(Change of Address가 자동 정리). 원하면 **설정 → 속성 삭제** | 수동 (옵션) | 주소 변경으로 시그널 이전 끝, 옛 property는 historical 데이터로 가치 있음 |
| **Naver SA** | 옛 사이트(taystudio.github.io) 등록 **삭제 필수** | 🔴 수동 (필수) | Change of Address 기능 없음 → 옛 사이트 등록 살아 있으면 Naver 봇이 두 사이트를 별개로 계속 추적 |
| **Bing WMT** | Site Moves 신청해뒀다면 옛 사이트 그대로 보존(Bing 자동 정리). 등록 신청 안 했으면 옛 등록 삭제 | 수동 | Site Moves가 GSC Change of Address와 유사 |
| **AdSense** | 옛 사이트(taystudio.github.io) **사이트 → ⋮ → 삭제** | 🔴 수동 (필수) | 신규 도메인 승인 떨어진 후 정리 (즉시 X — 광고 송출 멈출 위험) |
| **IndexNow** | 정리 액션 없음 | — | key 파일은 신규 도메인 root에 호스팅됨, 옛 도메인과 무관 |

**repo 코드 정리** (별도 commit, 6개월 후 1회):

```bash
# index.html 옛 검증 메타 2줄 제거
#   - <meta name="google-site-verification" content="X6nU3Kz5e0V_..."> ← 삭제
#   - <meta name="naver-site-verification" content="bfe7d4c2ed7faf..."> ← 삭제

# common/site-chrome.js ALLOWED 옛 도메인 라인 제거 (line 121·418)
#   - 'taystudio.github.io' 항목 삭제
#   - mirrorWarn 옛 도메인 false positive 차단 정책도 함께 점검

# (선택) sw.js cache version bump → v14
```

**검증 명령** (정리 전·후 비교용):

```bash
# 1. 옛 도메인 검색 결과 잔존 확인 (정리 전 모두 0 근사여야 함)
#    site:taystudio.github.io  ← Google·Naver·Bing 각자 수동 검색

# 2. 신규 도메인 검색 결과 충분 확인
#    site:taystudios.com       ← 67 URL 인덱싱 거의 다 돼야 함

# 3. 옛 → 신규 redirect 정상 동작 (정리 후에도 유지)
curl -sSI https://taystudio.github.io/ | head -3
# 기대: HTTP/2 301 / Location: https://taystudios.com/

# 4. (정리 후) 두 검증 메타가 신규 코드 1개씩으로 줄었는지
curl -sS https://taystudios.com/ | grep -E 'google-site-verification|naver-site-verification'
# 기대: 각각 1줄씩만
```

**캘린더 알림 권장** = 2026-11-09 즈음 plan.md §9.5.9 재방문. 6개월 시점에 트래픽 트렌드 보고 정리 진행 여부 판단.

### 9.5.10 최종 검증 결과 (2026-05-09 17:30 — 11 카테고리)

migration 전체 자가검증 결과. 의도 외 잔존 = 0건, 의도적 잔존만 13개 파일.

| # | 카테고리 | 결과 | 비고 |
|---|---|---|---|
| 1 | DNS · HTTPS · redirect | ✅ | http→https 301 / 옛 도메인→신규 301 / www→apex 301 / https 200 |
| 2 | sitemap · robots · IndexNow key · ads.txt | ✅ | sitemap 67 URL, 옛 도메인 잔존 0 / robots Sitemap 줄 정상 / key 200 + body 일치 / ads.txt 200 |
| 3 | 5 카테고리 hub + 법적 페이지 8건 canonical | ✅ | 모두 신규 도메인 |
| 4 | 검증 메타 6종 (head) | ✅ | google-site (옛+신규) / naver-site (옛+신규) / msvalidate.01 / google-adsense-account |
| 5 | AdSense 100% 커버 | ✅ | meta 68/68 + script 68/68, 옛 commented 패턴 0 (history 문서 내 1건은 의도적) |
| 6 | GA4 라이브 fire | ✅ | site-chrome.js 200 + GA_ID = `G-79C40NJRYT` + 모든 페이지 로드 |
| 7 | 옛 도메인 잔존 (의도 외) | ✅ 0건 | active HTML 0 / sitemap·robots·CNAME 0 / `common/site-chrome.js` 의도적(ALLOWED·mirrorWarn) |
| 8 | CNAME · SW version | ✅ | `taystudios.com` / `taystudio-v13` |
| 9 | 영어 분기 stash | ⏳ | `stash@{0}: english-pilot-wip` 살아 있음 — pop 후 en/ ~40건 sed 갱신 필요 |
| 10 | memory `project_taystudio.md` | ✅ | 신규 도메인·pub ID·measurement ID·IndexNow key·migration 완료 시점 갱신 |
| 11 | history/migration sub-dashboard 5건 | ✅ | google-search-console·naver-search-advisor·bing-webmaster-tools·adsense·ga4 모두 commit |

**의도적 잔존** (정책상 보존 — `verify-domain.sh` 분류와 일치):
- `common/site-chrome.js` ALLOWED·mirrorWarn — 전환기 false positive 차단
- `dash-tay9k3m/index.html` GA·Looker·repo URL 안내 — 운영자 dashboard 인지용 (1건)
- `history/migration/*` 시점 분기 entry + sub-dashboard — migration 자체 기록 (9건)

**남은 단 1건** = §9.5.6 #3 영어 분기 stash. 다음 세션 시작 시 `git stash pop` → en/ 디렉토리에 `bash scripts/migrate-domain.sh taystudio.github.io taystudios.com` 적용 → en/ 영역만 추가 commit.

**전체 진행 = 99% (인프라 완료, en/ 분기만 잔여)**.

---

## 10. 참고 문서

- `tools/HANDOFF.md` — 사이트 전체 인계 (코드 컨벤션·SEO·정책)
- `tools/CONTENT_DEPTH.md` — 콘텐츠 깊이 보강 패턴
- `tools/MONETIZATION.md` — AdSense·쿠팡
- `tools/SEO_SETUP.md` — SEO 초기 설정 (sitemap·robots·기본 메타)
- `history/seo/strategy.md` — **SEO 전략·Tier 우선순위·새 도구 18항목 체크리스트** (2026-05-05 신규)
- `history/seo/concepts.md` — **SEO 개념정리 용어집** (SERP·canonical·JSON-LD·E-E-A-T 등 누적, 2026-05-05 신규)
- `history/seo/2026-05-05-og-image-rollout.md` — og:image 사이트 일괄 적용 + JSON-LD 보강 기록
- `history/candidate/coupang-affiliate-tools.md` — 쿠팡 파트너스 친화 신규 도구 후보 매트릭스 10선 (2026-05-06)
- `history/seo/2026-05-07-indexnow.md` — IndexNow 인프라 도입 기록 (2026-05-07 신규)
- `history/seo/concept-indexnow.html` — **IndexNow 개념정리 — 메커니즘·적용 단계·의미** (2026-05-07 신규, noindex 운영자 전용)
- `history/seo/2026-05-09-domain-migration.md` — **도메인 migration 시점 분기 entry — taystudio.github.io → taystudios.com** (2026-05-09 신규)
- `history/migration/index.html` — **도메인 migration 진행 dashboard** — 끝난 작업·남은 작업·검색엔진 재등록·검증 (2026-05-09 신규, noindex 운영자 전용)
- `history/migration/google-search-console/index.html` — **GSC 작업 상세 기록** — 6단계 진행·Change of Address 검사 결과·6개월 후 검증 명령 (2026-05-09 신규)
- `history/migration/naver-search-advisor/index.html` — **Naver SA 작업 상세 기록** — 4단계 진행·Naver vs Google 차이점·인덱싱 가속 체크리스트·우선순위 13 URL (2026-05-09 신규)
- `history/migration/bing-webmaster-tools/index.html` — **Bing WMT 작업 상세 기록** — 7단계 진행·Site Moves UI deprecation·IndexNow ping 67 URL HTTP 200 결과·자동 감지 시그널 5/5 (2026-05-09 신규)
- `history/migration/adsense/index.html` — **AdSense 신규 도메인 활성화 상세 기록** — 6단계 진행·"준비 중" 스턱 원인 발견·메타 검증·script 100% 커버·검토 요청 (2026-05-09 신규)
- `history/migration/ga4/index.html` — **GA4 도메인 migration 상세 기록** — 사전 통합 발견·measurement ID 단일 유지·JS 주입 정책 정리·콘솔 데이터 스트림 URL 갱신 절차 (2026-05-09 신규)
- `history/coupang-partners/index.html` — **쿠팡 파트너스 진행 기록** — 가입(즉시 "활동 중") + 모니터 PPI·시야거리 도구 신규 + 추천 카드 4개 placeholder + 사용자 쿠팡 링크 4개 대기 (2026-05-09 신규)
- `history/checklist/2026-05-09-domain-migration-live-check.md` — **migration push 직후 라이브 14항목 검증** (13/14 통과, HTTP→HTTPS 1건 후속 해소, 2026-05-09 신규)
- `history/index.html` — 변경 이력
