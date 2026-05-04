# Plan — 카테고리 확장 로드맵

> **작성**: 2026-05-04 / **최종 갱신**: 2026-05-05 (image/ batch 1 + 공통 CSS common/ 이관) / 다음 세션이 이 문서 보고 이어서 작업.

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
├── tools/                   ← taystudio.github.io/tools/    (33개 계산기, 완료)
├── text/                    ← taystudio.github.io/text/     (1단계, 진행 중)
├── image/                   ← taystudio.github.io/image/    (2단계)
├── test/                    ← taystudio.github.io/test/     (3단계)
└── (이후 ROI 재평가 후) luck/, quiz/, random/, track/
```

- **로컬 repo 이름**은 `studio` (URL prefix X)
- 카테고리는 **루트 직속 디렉토리** — `taystudio.github.io/<카테고리>/`
- 도구는 카테고리 안의 디렉토리 — `taystudio.github.io/<카테고리>/<도구>/index.html`
- `tools/`와 동일 패턴 유지

---

## 2. 진행 순서·ROI 평가

| 순서 | 카테고리 | 트래픽 | 광고 친화 | 정적 가능 | 작업량 | 비고 |
|---|---|---|---|---|---|---|
| 1️⃣ | **text** (글자·문자) | 큼 | 도구별 편차 큼 | ✓ | 작음 | **진행 중** — 일반인 도구만 출시 |
| 2️⃣ | **image** (이미지·PDF) | **매우 큼** | 일반인 ✓ | ✓ (lib 무거움) | 중간 | ROI상 1순위 후보. 2단계 유지하되 text 빠르게 마감 후 진입 |
| 3️⃣ | **test** (자기 검사) | 중간 (바이럴 burst) | 약함 (단발) | ✓ | 작음 | 수익 기여보다 SNS 유입·재방문용 |
| 보류 | luck / quiz / random / track | 미평가 | 미평가 | ? | ? | 1~3단계 결과 본 후 재평가 |

> **재고려 포인트**: image가 트래픽·수익 잠재력 가장 큼. 만약 text 출시 후 데이터 분석 시 효과 약하면 image를 더 빨리 진입 시킬 것.

각 단계는 **카테고리 허브(index.html) + Tier 1 도구**가 첫 배포 단위. 카테고리 채우기용 ROI 낮은 도구는 끝까지 미루거나 스킵.

---

## 3. 1단계 — `text/` 카테고리 (글자·문자)

### 3.1 도구 리스트 — ROI 재정렬

**Tier 1 (출시 대상, 일반인·트래픽·광고 친화 ✓)**

- [x] **counter** — 글자수 카운터 ✅ 출시 완료 (2026-05-04)
  - 공백 포함·제외, 단어·줄·바이트(UTF-8), 한글/영문/숫자 분리
  - SNS·자소서 한도 11개 progress bar
  - 시즌성 큼 (상·하반기 공채 자소서 시즌 트래픽 burst)
- [ ] **kbd-convert** — 한글↔영문 키보드 변환
  - "dkssudgktpdy" ↔ "안녕하세요" 양방향
  - 검색량 큼 ("한영 변환", "키보드 잘못 친 거")
  - 정적 매핑 테이블 (자모 단위)
- [ ] **sns-format** — SNS 글 정리 (가운데정렬·줄바꿈·해시태그·특수문자 변환)
  - 인스타·블로그 운영자·일반인 트래픽
  - 차별화 강하면 좋음 (단순 가운데정렬은 클론 많음)

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

CSS는 `tools/css/style.css` 재사용 (절대 경로 `/tools/css/style.css`로 import).

### 3.4 SEO 키워드 매핑 (Tier 1)

| 도구 | 핵심 키워드 |
|---|---|
| counter | "글자수 세기", "글자수 카운터", "자소서 글자수", "SNS 글자수" |
| kbd-convert | "한영 변환", "키보드 잘못 친 거", "한영키 안 누르고" |
| sns-format | "SNS 가운데정렬", "인스타 줄바꿈", "특수문자 글씨" |

각 페이지 `<title>`·`<h1>`·`og:title`에 위 키워드 포함.

### 3.5 허브 페이지 (`text/index.html`) — 완료

현 상태: 도구 7카드 (counter 활성 + 6 disabled). Tier 2 도구를 만들지 않기로 했다면 disabled 카드를 제거할지 결정 필요. 현재는 "준비 중"으로 두면 사용자 기대가 생기므로, **Tier 2 스킵 결정 시 카드도 제거**.

### 3.6 sitemap·robots 갱신

- `sitemap.xml` 빌드 스크립트(`scripts/build-sitemap.sh`)에 `text/` 자동 포함되는지 확인 후 재실행
- 각 도구 페이지 canonical: `https://taystudio.github.io/text/<slug>/`
- robots.txt는 그대로 (Allow: / 이미 적용)

### 3.7 검증 체크리스트 (각 도구)

- [ ] HTML 태그 밸런스
- [ ] JSON-LD WebApplication + BreadcrumbList + FAQPage
- [ ] FAQ DOM count == JSON-LD count
- [ ] 모바일 반응형 (`<meta viewport>` + `.ref-table { overflow-x: auto }`)
- [ ] 다크모드 자동
- [ ] 면책 banner 정상 노출
- [ ] PWA 캐시 (sw.js 버전 올림 — 1단계 완료 시 한 번)
- [ ] sitemap에 추가
- [ ] common/css/style.css 재사용 (디자인 일관 — 2026-05-05 이관 완료, 모든 카테고리 공유)

---

## 4. 2단계 — `image/` 카테고리 (이미지·PDF)

### 4.1 ROI 평가 + Batch 분할 (3-way)

**모든 도구 Tier 1 — 일반인 + 큰 트래픽 + 광고 친화 ✓**. 작업량과 라이브러리 종류 차이로 **3분할 batch**로 출시:

| 도구 | 검색 트래픽 | 정적 가능 | 라이브러리 | Batch | 상태 |
|---|---|---|---|---|---|
| **compress** — 이미지 압축 | ★★★ | ✓ | canvas API (네이티브) | 1 | ✅ 출시 (2026-05-05) |
| **resize** — 이미지 리사이즈·포맷 변환 | ★★★ | ✓ | canvas API | 1 | ✅ 출시 (2026-05-05) |
| **qr-gen** — QR 코드 생성 | ★★★ | ✓ | qrcode.js (~25KB) | 2 | 예정 |
| **qr-scan** — QR 코드 스캐너 | ★★ | ✓ | jsQR (~50KB) | 2 | 예정 |
| **pdf-merge** — PDF 합치기 | ★★★ | ✓ | pdf-lib (~700KB lazy) | 3 | 예정 |
| **pdf-split** — PDF 자르기 | ★★★ | ✓ | pdf-lib | 3 | 예정 |
| **ocr** — 이미지 OCR | ★★ | ✓ (WASM) | Tesseract.js (~5MB lazy) | 3 | 예정 |

**Batch 정책**:
- Batch 1 = 라이브러리 0KB 도구로 image/ 카테고리 패턴(파일 입력·드래그/드롭·Blob·다운로드 URL·드롭존 UI) 검증
- Batch 2 = 작은 라이브러리(qr 2종, ~75KB)로 vendoring 패턴 도입 — `image/vendor/` 디렉토리 신설
- Batch 3 = 무거운 라이브러리(pdf-lib 700KB·Tesseract 5MB) + lazy import + IndexedDB 모델 캐시(OCR 한국어 ~25MB)

### 4.2 차별화 핵심

**모든 처리는 브라우저 안에서** — 파일 업로드 X. 각 페이지 프라이버시 박스에 "**파일이 외부 서버로 전송되지 않습니다**" 강조. 프라이버시 민감한 사용자(이력서·개인 PDF·신분증 등)를 끌어들인다. 이게 클론 도구들 대비 가장 강한 차별점이며 광고 친화도도 높임 (체류 시간↑, 신뢰↑).

### 4.3 라이브러리 메모

| 도구 | 라이브러리 | 크기 |
|---|---|---|
| compress, resize | canvas API (네이티브) | 0 |
| qr-gen | qrcode.js | ~25KB |
| qr-scan | jsQR | ~50KB |
| pdf-merge, pdf-split | pdf-lib | ~700KB (lazy load) |
| ocr | Tesseract.js | ~5MB (lazy load, WASM, 한국어 학습 데이터 ~25MB CDN+IndexedDB 캐시) |

CDN보단 같은 repo에 vendoring 권장 (의존성·캐시 통제). 단 OCR 한국어 모델은 25MB라 repo 비대 방지로 jsdelivr CDN fetch + IndexedDB 캐시 (1회 다운로드 후 offline 가능).

### 4.4 Batch 1 진행 기록 (2026-05-05)

- [x] `common/css/style.css` 신규 클래스 — `.privacy-box`, `.file-drop-zone`, `.image-preview`, `.image-meta`, `.image-actions`, `.range-row`
- [x] `image/index.html` 허브 — 7카드 (compress·resize 활성 + 5 disabled "준비 중")
- [x] `image/compress/index.html` + `compress.js` — 화질 슬라이더 + JPEG/PNG/WebP 출력 + 용량 감소율 표시
- [x] `image/resize/index.html` + `resize.js` — px·% 단위 토글 + 비율 유지 + 포맷 변환
- [x] 루트 `index.html` — hub-grid 3번째 카드 + JSON-LD hasPart + 미리보기 섹션 + meta 갱신
- [x] `scripts/build-sitemap.sh` `CATEGORIES`에 `"image"` 추가 → 41 → 44 URL
- [x] `tools/privacy/index.html` 카테고리별 데이터 처리 명시 (계산기/텍스트/이미지·PDF)
- [x] `history/index.html` timeline article 2개 (image batch 1 + CSS 이관)
- [x] HTML 태그 밸런스 / FAQ DOM 6 = JSON-LD 6 / JS 문법 / 로컬 서버 200 응답 검증

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

- **tools/**: 세율·법령 기반 계산이라 추정치 면책 필수 → 표시 ✓
- **text/**: 변환·카운트는 결정론적·정확 → 표시 ✗
- **image/**: 정확 처리(압축·리사이즈·QR·PDF) vs OCR(정확도 X) — 도구별 분기 필요 시 카테고리별 다른 banner 고려
- **test/**: 시력·청력 측정은 의료 진단 대체 X → 별도 면책 banner 필요할 가능성

새 카테고리 추가 시 정확도 성격 따라 banner 정책 결정 후 `isToolsPage()` 수정.

### 7.3 SEO

- 각 페이지 canonical
- JSON-LD WebApplication + BreadcrumbList + FAQPage
- 카테고리 허브에서 도구 리스트 (ItemList JSON-LD 추가 검토)
- sitemap.xml 자동 빌드 (scripts/build-sitemap.sh — 카테고리 디렉토리 자동 인식 확인 필요)

### 7.4 SW 캐시

`common/site-chrome.js` 또는 `common/css/style.css` 변경 시 `tools/sw.js`의 `CACHE_VERSION` 한 단계 올림. 현재 v8 (2026-05-05, CSS 이관 시 bump). 새 카테고리(text/·image/)는 sw.js 등록 안 함 — PWA 통합은 후속 백로그(§9.3 A안) 시점에 일괄 처리.

### 7.5 AdSense·쿠팡

- 각 도구 페이지에 `<div class="ad-slot">` placeholder
- 텍스트 도구는 콘텐츠 광고 친화 (큰 광고 X, 작은 inline)
- 이미지 도구는 사이드 광고 가능 + 결과 다운로드 직전 인터스티셜 검토
- 운세·게임은 거슬리는 광고 권장 X (UX 손상)

---

## 8. 작업 흐름 (각 단계)

1. 카테고리 디렉토리 생성 (`text/` 등)
2. `index.html` 허브 작성 (Tier 1 도구만 활성, Tier 2는 disabled 또는 제거)
3. Tier 1 도구 페이지 + JS 작성 (1개씩 검증)
4. 면책 banner 노출 조건 확인
5. sitemap.xml 갱신
6. PWA 캐시 버전 올림 (1단계 완료 시 한 번)
7. CONTENT_DEPTH.md 패턴 적용 (FAQ·예시·계산식)
8. history/index.html에 timeline article 추가
9. HANDOFF.md 세션 로그 추가

---

## 9. 결정·보류 사항 (현재 시점)

### 9.1 결정됨

- **본질 motivation**: 광고 수익 (0.1)
- **인프라 전략**: 정적 우선, 백엔드는 fallback (0.2)
- **도구 후보 평가**: 3 질문 통과해야 진행 (0.3)
- **text 카테고리**: Tier 1 3개로 마감, Tier 2(개발자 도구) 스킵 (3.1)
- **면책 banner 일반화**: 카테고리 정규식 (7.2)
- **공통 CSS 위치**: `common/css/style.css` (2026-05-05 결정 — `tools/css/`에서 이관). 카테고리는 `<link href="/common/css/style.css">` import. 카테고리·도구별 좁은 override만 인라인 `<style>`. 카테고리별 CSS 복제 X
- **image/ batch 분할**: 7개를 3-way batch (canvas 2 → QR 2 → PDF 2 + OCR 1)로 출시 (4.1)

### 9.2 보류 (사용자 결정 필요)

- [ ] **PWA(앱) 통합 정책** — 현재 `/tools/`만 manifest+SW. 카테고리 늘면 어떻게?
  - **A안**: 루트 통합 manifest (`/manifest.webmanifest`, scope `/`) — 사이트 전체 PWA. 가장 깔끔하지만 기존 `tools/manifest.webmanifest`와 정리·일괄 head 갱신 필요
  - **B안**: 카테고리별 manifest 분리 — 독립적이지만 사용자 가치 X (text·image 도구는 자주 재방문 X)
  - **C안 (현 상태)**: text/·image/는 PWA 미지원, 모바일 웹만. text·image 도구는 검색→1회 사용 패턴이라 PWA 수익 기여 약함
  - **추천**: 단기 C 유지(ROI). image/ 7개 모두 끝난 후 한 번에 A로 정리하는 게 효율적
- [ ] sitemap.xml 단일 vs 카테고리별 분리 (현재 단일 root, 44 URL — 카테고리 4번째 추가 시점에 분리 검토)
- [ ] sw.js 단일 vs 카테고리별 분리 (현재 tools/ 전용 — PWA 통합 정책과 함께 결정)
- [ ] OCR 한국어 모델 vendoring vs CDN+IndexedDB 캐시 — image batch 3 진입 시 확정 (현재 추천 = CDN+IndexedDB)

### 9.3 후속 백로그 (수익 검증 후 재진입)

- text Tier 2 도구 (markdown, json-format, url-encode, case-convert)
- 후속 카테고리 (luck/quiz/random/track)
- 백엔드 도입 검토 (정적으로 막히는 use case 발견 시)
- **PWA 통합 (A안 — 루트 manifest)** — image/ 출시 후 한 번에 처리. 작업: ① `/manifest.webmanifest` 생성 (scope `/`, 모든 카테고리 포함) ② 모든 페이지 head에 `<link rel="manifest" href="/manifest.webmanifest">` 일괄 삽입 ③ `tools/manifest.webmanifest` 정리 ④ SW(`sw.js`) 루트로 이동 + scope `/` 재등록 ⑤ 캐시 자산 목록에 모든 카테고리 포함

---

## 10. 참고 문서

- `tools/HANDOFF.md` — 사이트 전체 인계 (코드 컨벤션·SEO·정책)
- `tools/CONTENT_DEPTH.md` — 콘텐츠 깊이 보강 패턴
- `tools/MONETIZATION.md` — AdSense·쿠팡
- `tools/SEO_SETUP.md` — SEO 작업
- `history/index.html` — 변경 이력
