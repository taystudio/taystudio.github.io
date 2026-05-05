# Plan — 카테고리 확장 로드맵

> **작성**: 2026-05-04 / **최종 갱신**: 2026-05-05 (**favicon.ico 추가 — 네이버 수집 제한 해제 + rotate 미리보기 UX + video wrapper hang fix 부분 검증** — `favicon.ico` 부재로 네이버 서치어드바이저에서 `/favicon.ico` 수집 제한 걸려있던 거 해결. png-to-ico로 multi-resolution ICO 생성 후 63개 HTML head에 `<link rel="icon" href="/favicon.ico" sizes="any">` 일괄 추가. wrapper hang fix는 사용자 콘솔에서 `[ffmpeg]` 로그 정상 출력 확인 = worker spawn·load 단계는 통과. 끝까지 처리·다운로드 완료 검증은 미완. 별도로 rotate 도구에 source 미리보기 박스 + 회전 옵션 5종 즉시 CSS transform 미리보기 + "원래대로" 6번째 옵션 추가. 카테고리 = `tools / text / image / video` **4개**. sitemap **60 URL** · 도구 수 **53선**. 다음 세션이 이 문서 보고 이어서 작업.

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
├── tools/                   ← taystudio.github.io/tools/     (36개 계산기 — 세금·금융·근로·임신·육아·**건강 5선(BMI·BMR/TDEE·체지방률·표준체중·심박존)**·자동차, ✅ 완료)
├── text/                    ← taystudio.github.io/text/      (1단계, ✅ 완료 — Tier 1 3선)
├── image/                   ← taystudio.github.io/image/     (2단계, ✅ 완료 — 9선 + vendor 5종)
│   └── vendor/                                                (qrcode·jsQR·pdf-lib·tesseract·imgly-bg-remove)
├── test/                    ← taystudio.github.io/test/      (3단계 — 미진입)
└── (이후 ROI 재평가 후) luck/, quiz/, random/, track/
```

**현 시점(2026-05-05) 사이트 도구 수 = 48선** (계산기 36 + 텍스트 3 + 이미지 9), sitemap 54 URL. **계산기는 `tools/` 단일 카테고리**로 통합 (건강·임신·육아·자동차 등 모든 계산기는 `/tools/` 아래).

- **로컬 repo 이름**은 `studio` (URL prefix X)
- 카테고리는 **루트 직속 디렉토리** — `taystudio.github.io/<카테고리>/`
- 도구는 카테고리 안의 디렉토리 — `taystudio.github.io/<카테고리>/<도구>/index.html`
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
- [x] 각 도구 페이지 canonical: `https://taystudio.github.io/text/<slug>/`
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
- **클론·택갈이 1차 방어 (2026-05-05)**: ① **JS 도메인 가드** — `common/site-chrome.js`에 IIFE 추가, ALLOWED 도메인(`taystudio.github.io` + 로컬 개발) 외에서 접속 시 빨간 경고 배너 노출 ("⚠️ 비공식 미러 사이트입니다. 정품: taystudio.github.io"). 도용자가 우회 시 = 그 IIFE만 sed로 빼면 됨, **단 우회 자체가 도용 의도 명백 = DMCA 결정적 증거**. 정품 도메인에선 동작 안 함(보이지 않음 = 정상) ② **HTML watermark 51 파일 일괄** — head 시작점에 정품 시그니처 주석 + `meta generator="TAYSTUDIO 2026"` 추가. 페이지 소스(Cmd+U)로만 보이는 fingerprint. 도용자가 못 알아채고 그대로 두면 출처 추적용. `EXCLUDE = {history/, tools/404.html}` ③ SW v10 → v11 bump (common/* 변경). 한계 = 정적 사이트라 100% 차단 X. 의도 = 도용 비용 ↑ + 발견 시 빠른 입증
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
- **favicon.ico 추가 — 네이버 수집 제한 해제 (2026-05-05)**: 네이버 서치어드바이저에서 `https://taystudio.github.io/favicon.ico`가 "수집 제한"으로 표시됐던 원인 = repo에 `favicon.ico` 파일 자체가 없어 네이버봇이 자동 fetch 시 404. robots.txt는 정상(`Allow: /`).
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

- [ ] **PWA(앱) 통합 정책** — 현재 `/tools/`만 manifest+SW. 카테고리 늘면 어떻게?
  - **A안**: 루트 통합 manifest (`/manifest.webmanifest`, scope `/`) — 사이트 전체 PWA. 가장 깔끔하지만 기존 `tools/manifest.webmanifest`와 정리·일괄 head 갱신 필요
  - **B안**: 카테고리별 manifest 분리 — 독립적이지만 사용자 가치 X
  - **C안 (현 상태)**: text/·image/는 PWA 미지원, 모바일 웹만
  - **현재 시점 의견**: image/ 7개 완성됨. 이제 **A안 진입 후보 시점 도달**. test/ 진입 전 또는 직후에 처리 권장
- [ ] sitemap.xml 단일 vs 카테고리별 분리 (현재 단일 root, **51 URL** — test/ 추가 후 60+ 예상, 그 시점에 분리 검토)
- [ ] sw.js 단일 vs 카테고리별 분리 (현재 tools/ 전용 — PWA 통합 정책과 함께 결정)

### 9.3 후속 백로그 (수익 검증 후 재진입)

- text Tier 2 도구 (markdown, json-format, url-encode, case-convert)
- 후속 카테고리 (luck/quiz/random/track)
- 백엔드 도입 검토 (정적으로 막히는 use case 발견 시 — image/ 검증으로 OCR까지 정적 가능 확인됨, 명분 약함)
- **favicon.ico 사이즈 최적화** (현 285KB → 5~30KB) — png-to-ico default가 16~256 multi-res 모두 packing해서 큼. 16/32만 packing하는 도구(ImageMagick·sharp 등)로 재생성. 단 사용자 영향 미미(첫 fetch 1회 + 영구 캐시) = 우선순위 낮음

### 9.4 다음 세션 진입 후보

> **2026-05-05 카테고리 단일화 결정**: 계산기는 모두 `tools/` 하나로 유지. health/ 신설 시도는 회수됐으며 §4.5 후속 후보 4선(body-fat·heart-rate·ideal-weight·1rm)은 향후 `tools/`에 직접 추가 검토. test/ 진입 전·후 ROI 비교 결정.

> **2026-05-05 video 카테고리 5선 완료**: §5.5.2 Tier 1 5선 전부 라이브(compress·trim·rotate·to-gif·to-mp3). wrapper 1개로 5도구 = §0.2 정신 시각적 증거 완성. 다음 세션 후보 = (1) audio 카테고리 진입 (white-noise 1선 시작 — §5.5.3 검토) (2) PWA 통합 A안 (§9.2) (3) 로컬 실기기 검증 라운드 (4) 트래픽·체류 데이터 본 후 ROI 결정.

> **🚨 1순위 — video wrapper hang fix 끝까지 검증 (2026-05-05 부분 검증)**: 콘솔 `[ffmpeg]` 로그 출력 확인 = worker spawn·load 통과. 남은 검증 = 영상 처리(`ffmpeg.exec`) 완료 → 결과 미리보기 + 다운로드 버튼 정상 동작까지 끝까지 통과. 5도구 모두(compress·trim·rotate·to-gif·to-mp3) 동작 확인. 통과 시 §9.1 worker hang 항목을 "결정 완료"로 마무리. 실패 시 추가 fix 분기 (coreURL을 jsdelivr URL 직접 전달 fallback 또는 `dist/esm` 통째로 vendoring). 상세 = `history/video/2026-05-05-ffmpeg-worker-hang.md`

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
2. **SEO Tier 1.2 — 카테고리 hub 콘텐츠 깊이** (~2h, **메인 페이지 패턴 검증 완료**) — `image/index.html`·`text/index.html`·`tools/index.html`이 카드 그리드만이라 thin content. 카테고리 키워드 SERP 약함. **메인 페이지에서 검증한 `hub-intro` 패턴 그대로 재사용** (좌측 3px primary 보더 + eyebrow + lead + body 3계층, 이모지 X, 색·굵기·세로선만으로 시각 시그널 — plan §9.1 "메인 페이지 인덱스 정리" 결정 참고).
   - 각 hub 카드 그리드 위 또는 아래에 `hub-intro` 박스 + 카테고리별 FAQ 4~5개(JSON-LD FAQPage 동기화) + `.updated` 최종 갱신일 + `.sources` 외부 권위 출처
   - 카테고리별 lead 메시지 톤 후보:
     - **tools/** — "한국 세율·법령 기반 추정 계산 33선" (정확도 면책은 banner로 이미 처리). 건강 계산기(BMI·BMR/TDEE·임신·육아)도 의료 진단 대체 X 인라인 disclaimer로 추가 명시
     - **text/** — "변환·카운트는 모두 결정론적 — 글자수·해시태그·키보드 변환을 한 곳에서"
     - **image/** — "파일은 브라우저 안에서만 처리 — 이력서·신분증·민감 PDF도 안심"
   - FAQ 후보 (카테고리당):
     - tools: 세율 갱신 주기 / 결과 정확도 / 신고 시 사용 가능한지 / 시즌성 도구 / **건강 계산기 의료 진단 대체 가능 여부**
     - text: 인스타 줄바꿈 우회 / 키보드 변환 정확도 / SNS 한도 11종
     - image: 외부 전송 여부 / OCR 한국어 정확도 / 큰 파일 메모리 / AI 모델 다운로드
   - 카드 그리드 자체는 그대로 — hub의 본체. `hub-intro`는 위·아래 어느 위치인지 결정 필요(메인은 카드 아래·미리보기 위 = 첫 인상 보존). 카테고리 hub는 사용자가 이미 카테고리 진입한 상태라 위(카드 위)도 가능
   - **금지**: 이모지 노이즈, dot 구분자, 카드 mix — 메인 페이지에서 `마음에 안 든다`·`조잡` 피드백으로 검증 완료. 사이트 톤(mono·minimal)에 부합 X
3. **SEO Tier 2.2 — HowTo JSON-LD 4 도구** (~1h, **새로 추가**) — pdf-merge·bg-remove·img-to-pdf·qr-gen에 step-by-step JSON-LD. "How to" 리치 스니펫(번호 카드) 노출 후보 → CTR ↑
4. **tools/ 건강 도구 보강 — 1선 잔여** (§4.5 후속) — ✅ body-fat·ideal-weight·heart-rate 3선은 2026-05-05 출시 완료(§9.1 기록). 잔여 = **1rm**(1회 최대 반복, Epley·Brzycki). 단 운동인 좁은 SERP라 우선순위 낮음 — `tools/`에 추가하더라도 트래픽 ROI 약함. test/ 카테고리 진입 전·후 비교 결정
5. **§5.5 차세대 카테고리 후보 — video / audio / convert** (2026-05-05 등재) — 브라우저 한계 끌어올리기. 3 후보 모두 §0.3 3 질문 통과:
   - 🎬 **video** (Tier 1 5선: compress·trim·to-gif·to-mp3·rotate) — ffmpeg.wasm. SERP·광고 ★★★. **단순 ROI 1순위** 단 작업량 image/ 수준
   - 🔊 **audio** (Tier 1 5선: **white-noise**·metronome·audio-trim·decibel·voice-recorder) — WebAudio 0KB + lamejs. 백색소음 1개로 체류 1시간+ → AdSense 노출량 dominance. **시그너처 1개 ROI 검증**으로 적합
   - 🔄 **convert** (Tier 1 6선: length·area·temperature·weight·timezone·exchange) — 0KB. 트래픽 ★★★ 단 단발. tools/ 흡수 vs 별도 카테고리 분리 결정 필요(§5.5.6)
   - 진입 순서 권장: 작업량 작은 순 = convert → audio → video / 시그너처 강한 순 = audio (white-noise만) → video → convert
6. **test/ 카테고리** (3단계, plan §5) — vision·color-blind·hearing·reaction·typing 5종. SNS 바이럴·재방문 도구. 각 도구 페이지 내부 disclaimer (image/ocr·bg-remove 패턴 재사용 — 의료 진단 대체 X). **§5.5와 ROI 비교 후 결정**
5. **PWA 통합 (A안 — 루트 manifest)** — image/ 9선 완성으로 진입 시점 도달. 작업: ① `/manifest.webmanifest` 생성 (scope `/`, 모든 카테고리 포함) ② 모든 페이지 head에 `<link rel="manifest" href="/manifest.webmanifest">` 일괄 삽입 ③ `tools/manifest.webmanifest` 정리 ④ SW(`sw.js`) 루트로 이동 + scope `/` 재등록 ⑤ 캐시 자산 목록에 모든 카테고리 + `image/vendor/*` 포함
6. **image/ AI 도구 manual 실기기 검증** — bg-remove의 첫 모델 다운로드 흐름·iOS Safari WASM 동작·메모리, OCR 한국어 모델 다운로드, qr-scan 카메라 권한
7. **bg-remove medium/large 모델 옵션** — 사용자 피드백·트래픽 봐서 선택 토글 추가 (small 43MB / medium 80MB / large 180MB)
8. **SEO 측정** — 1주~1달 후 Search Console CTR 변화·노출수, 카카오톡 미리보기 디버거, Twitter Card Validator, AdSense RPM 비교 (og:image rollout 효과 검증)
9. **LICENSE 추가 — 클론·택갈이 2차 방어** (~2min, 트레이드오프 검토 필요) — 1차 방어(JS 도메인 가드 + HTML watermark, §9.1 기록)에 더해 repo 루트에 `LICENSE` 파일 추가 검토:
   - **AGPL-3.0** 추천 — 수정 후 서비스로 제공해도 소스 공개 의무. 광고 도용자도 자기 사이트의 소스 공개 의무 = 자기 AdSense·쿠팡 ID 노출 = 실질적으로 광고 도용 어렵게 만듦. **DMCA 명분 결정적**. 단점: contributor 받기 어려움 (현 단계 무관)
   - 대안: **CC BY-NC-SA 4.0** (코드보단 콘텐츠 라이선스라 부적합) / **MIT** (광고 도용 허용 = 부적합)
   - 현 상태(LICENSE 부재) = 묵시적 ARR (All Rights Reserved). 명시 안 해도 무단 사용 자체가 침해. 다만 분쟁 시 명시 라이선스가 더 강한 명분
   - 진입 시점 = 사이트 트래픽이 도용자에게 매력적인 규모(월 5000+ 방문)에 도달한 후. 현 단계는 1차 방어(§9.1)면 충분
   - 트레이드오프 = AGPL은 강제력 강하지만 fork·기여 진입 장벽 ↑. 사이트 본질이 contributor 받는 OSS가 아니라 운영자 단독 서비스라 AGPL이 부합
10. **영어 시장 진입 — `/en/` path** (~매우 큼, **한국 시장 매출 검증 후 진입**) — 글로벌 트래픽·AdSense 영어 RPM($3-8) 노림. **단순 HTML fork만으론 트래픽 X** — 별도 비즈니스 트랙으로 인식해야 함:
   - **진입 시점 조건 (모두 충족 시)**:
     - ① 한국 사이트 월 5000+ 방문 도달
     - ② AdSense 승인 + 안정 수익 확인 (월 $20~50+)
     - ③ 영어 시장 진입 자본·시간 여유 (한국 운영 안정 후)
   - **구조 = B안 (`/en/` path)**: 같은 repo 안에 `taystudio.github.io/en/`. canonical + `<link rel="alternate" hreflang="en">` 메타로 한↔영 페이지 연결. 정적 우선 전략 일관 + 코드(CSS·라이브러리) 공유
   - **이전 가능 도구 (한국 특화 X만, ~25%)**: 이미지·PDF 9선 전부 + 텍스트 일부(글자수 카운터·SNS 정리) + QR. **계산기 33선은 한국 세금·법령 특화라 X**. 한↔영 키보드 변환도 한국어 전용이라 X
   - **차별화 메시지**: "Your file never leaves your browser" — privacy-first. 글로벌 시장에도 약하지만 어필 가능 (TinyPNG·SmallPDF·remove.bg 같은 클라우드 클론 대비 차별)
   - **영어 SEO 별도 전략 필요** (한국 채널과 무관):
     - Reddit (r/InternetIsBeautiful, r/usefulwebsites, r/webdev)
     - Hacker News "Show HN"
     - Product Hunt 런칭
     - 영어 백링크 자연 누적은 어려움 — 적극 마케팅 필요
   - **헤더 nav에 언어 토글** + Google Analytics path별 분리 측정
   - **위험·트레이드오프**:
     - 영어 시장 경쟁 매우 심함 (글로벌 도구 천지)
     - 이중 유지 비용 (도구 1개 추가 = 2배 작업)
     - 한국 시장 자원 분산 위험
     - SEO 도메인 권위 0부터 시작 (한국 SEO 시작보다 어려움)
   - **권장 = 한국 시장 ROI 큰 작업(SC·AdSense·SEO Tier 1.2·PWA·TWA) 먼저 끝낸 후 진입.** 시점 미정. 현 단계는 plan에 박아두고 트래픽·매출 신호 보고 결정

---

## 10. 참고 문서

- `tools/HANDOFF.md` — 사이트 전체 인계 (코드 컨벤션·SEO·정책)
- `tools/CONTENT_DEPTH.md` — 콘텐츠 깊이 보강 패턴
- `tools/MONETIZATION.md` — AdSense·쿠팡
- `tools/SEO_SETUP.md` — SEO 초기 설정 (sitemap·robots·기본 메타)
- `history/seo/strategy.md` — **SEO 전략·Tier 우선순위·새 도구 18항목 체크리스트** (2026-05-05 신규)
- `history/seo/concepts.md` — **SEO 개념정리 용어집** (SERP·canonical·JSON-LD·E-E-A-T 등 누적, 2026-05-05 신규)
- `history/seo/2026-05-05-og-image-rollout.md` — og:image 사이트 일괄 적용 + JSON-LD 보강 기록
- `history/index.html` — 변경 이력
