# 검증 라운드 — image 9선 + pdf 5선 자동 검증 + UX 보강 (2026-05-06)

> 사용자 요청 — "image랑 pdf 다 검증·검토 해보고 잘 되는지 직접 해보고 plan/history 업데이트". 동일 일자 PDF 카테고리 신설 + image Tier 1 3종 추가 직후 종합 검증 라운드.

## 자동 검증 결과 — 모두 통과

### 정적 검사

| 항목 | 결과 | 대상 |
|---|---|---|
| JS syntax (`node --check`) | **14/14 ✓** | image 9 + pdf 5 도구 |
| JSON-LD `JSON.parse` | **17/17 ✓** | 도구 14 + hub 2 (image·pdf) + root |
| canonical·og:url 일관 | **17/17 ✓** | 모든 페이지가 자기 URL 정확히 명시 |
| FAQ DOM count == JSON-LD `mainEntity` | **17/17 ✓** | 도구 6Q / hub 4~5Q / root 0Q |
| HTML 태그 밸런스 (open == close) | **17/17 ✓** | 위 17개 파일 |

### 인프라

| 항목 | 결과 |
|---|---|
| HTTP 200 (local server) | **30/30 ✓** — 도구 14 + hub 5 + redirect stub 3 + vendor 4 + sitemap·sw·manifest |
| vendor 파일 사이즈 | image 5종 1.78MB (heic2any 1.35MB·jsQR 251KB·tesseract 65KB·imgly-bg-remove 82KB·qrcode 20KB) / pdf 3종 2.22MB (pdf-lib 525KB·pdf.min.mjs 336KB·pdf.worker.min.mjs 1.36MB) |
| redirect stub (image/pdf-merge·pdf-split·img-to-pdf) | **3/3 ✓** — 모두 canonical + meta refresh + noindex 3중 안전장치 적용 |
| sitemap에 stub URL 잔존 | **0건** (build-sitemap.sh의 is_noindex 자동 제외 동작) |
| 옛 vendor 경로(`/image/vendor/pdf-lib`) 잔존 | **0건** |
| `TAYSTUDIO Image` 잔존 in pdf/ | **0건** |
| 도구 cross-link이 옛 image/pdf-* 가리키는지 | **0건** (history/index.html의 변경 이력 기록 제외) |
| BreadcrumbList position 2 일관 | ✓ image 도구는 "Image", pdf 도구는 "PDF" |
| og:image·apple-touch-icon·viewport | ✓ 모든 도구 일관 |

## 정적 분석 — 잠재 issue 점검

### BlobURL 메모리 누수

| 도구 | createObjectURL | revokeObjectURL | 평가 |
|---|---|---|---|
| 모든 우리 도구 | 적절 사용 | 적절 사용 | ✓ |
| `vendor/tesseract.min.js` | 1 | 0 | 라이브러리 내부, 우리 책임 X |

우리 도구는 모두 `revokeAll()` 또는 도구별 cleanup에서 BlobURL 해제. 도구 페이지가 SPA가 아니라 리로드 시 GC가 처리.

### Pointer Events capture 누수

| 도구 | setPointerCapture | releasePointerCapture | 평가 |
|---|---|---|---|
| `image/crop/crop.js` | 1 | 1 | ✓ |
| `image/id-photo/id-photo.js` | 1 | 1 | ✓ |
| `pdf/pdf-edit/pdf-edit.js` | 0 | 0 | ✓ — HTML5 native `dragstart/dragover/drop` API 사용. PointerEvents 불필요 |

### async/await catch 패턴

| 도구 | await | catch | 평가 |
|---|---|---|---|
| compress · resize | 0 | 0 | 동기 처리, OK |
| qr-gen | 0 | 1 | OK |
| crop · id-photo · heic-to-jpg | 1 | 1 | OK |
| ocr · qr-scan | 2~3 | 2~3 | OK |
| bg-remove | 2 | 1 | 큰 처리 보호, 작은 await(arrayBuffer)는 unhandledrejection만 |
| pdf-merge · pdf-split | 5~6 | 1~3 | OK — 핵심 처리(merge/split)는 try/finally |
| pdf-edit · pdf-to-image | 5~8 | 3 | OK — 썸네일 렌더 + 변환 모두 try/catch |
| img-to-pdf | 10 | 2 | catch < await 차이 큼. 단 핵심 처리는 try/finally 보호. 일부 작은 await(이미지 디코딩)는 사용자 안내 X (vendor·이미지 decode는 거의 실패 X) |

### pdf.js worker 경로

`pdf/pdf-edit/pdf-edit.js:18` + `pdf/pdf-to-image/pdf-to-image.js:15` 모두 `'/pdf/vendor/pdf.worker.min.mjs'` 절대경로 ✓.

## crop·id-photo UX 보강 — 4 라운드 (사용자 피드백 기반)

### 라운드 1 — 옵션 변경 후 사진 보기 어려움

**피드백**: "비율 변경할 때마다 사진 보려고 아래로 내려야 하는 게 힘들다"

**원인**: 카드 안 DOM 순서 = 옵션(긴 영역) 다음 사진. 옵션 변경 후 사진을 보려면 스크롤 다운.

**적용**:
- 모바일: CSS `order`로 사진을 옵션 앞으로 (DOM은 그대로, 접근성 유지)
- 데스크톱(≥ 900px): grid 2열 — 좌측 옵션 / 우측 사진 sticky
- 사진 max-height 60vh(crop) / 55vh(id-photo)

### 라운드 2 — 구간 구분 + sticky 정신없음

**피드백**: "구간 구분이 너무 안 됨. 사진이 스크롤할 때마다 따라 내려오고 올라가고 정신없다"

**적용**:
- sticky 완전 제거 — 사진은 자기 자리 고정
- 옵션 영역을 fieldset 스타일로: `position: relative` + `border` + `background: rgba(127,127,127,.05)` + `padding: 22px 16px 14px`
- 옵션 라벨 = `::before` pseudo로 "⚙ 옵션" 칩(둥근 border + 카드 배경)
- 사진 영역에도 border 추가
- gap 20px(모바일) / 18px·24px(데스크톱)

### 라운드 3 — 사진 옆 빈 공간

**피드백**: "표준 사이즈·출력 픽셀·현재 frame 옆에 빈 공간 안 쓰는 거면 가로로 까는 게 낫지 않나? 사진 아래도 비어 보임"

**원인**: 그리드 영역이 `info·act가 좌측 column에만 → stage 우측 column이 길게 비어 보임`

**적용**:
- `grid-template-areas` 변경:
  ```
  "drop  drop"
  "opts  stage"
  "info  info"   ← 풀 너비로 사진 아래 가로 펼침
  "act   act"    ← 자르기 버튼도 풀 너비
  ```
- info-row 3 셀(표준·픽셀·frame)이 사진 아래 가로로 자연 정렬

### 라운드 4 — 가로 사진 작게 시작 → 시도 → 원복

**피드백**: "가로로 넓은 사진을 위해서 뭐 어떻게 조치할 수 없나? 너무 작은 상태로 시작"

**시도** (실패):
- column 320px 고정 (좌측 옵션 좁게, 우측 사진 가득)
- `main.container` max-width 1280px (도구 페이지만)
- canvas `width: 100%` inline 토글 (가로 사진만)

**문제 발견**: 사용자 피드백 — "세로 사진이 너무 납작해진다"

**원인**: canvas는 `<img>`와 다르게 max-width + max-height 동시 적용 시 **비율 자동 유지 X**. width auto + max-width 100% 적용 시 width만 줄어들고 height auto는 자연 픽셀 그대로 유지 → 비율 깨짐(stretch). 가로 사진은 OK였지만 세로 사진은 wide stretch.

**원복** (사용자 요청 "원래 가로폭 고려 안 했을 때로"):
- column 비율 = 처음대로 (`1fr : 1.4fr` crop, `1fr : 1.2fr` id-photo)
- container max-width override 제거
- canvas width 토글 JS 제거
- canvas max-height CSS 제거
- 결과 = `max-width: 100%; height: auto`만 (자연 비율 유지, 처음 상태)

**유지된 것** (라운드 1~3 변경): 영역 분리 + grid 레이아웃 + fieldset 옵션 박스 + info·act 풀 너비.

**제시된 차후 옵션** (사용자 결정 보류):
- A. JS로 비율 유지 fit (가로 폭 우선 / 세로 높이 우선 + 비율 정확 계산)
- B. 줌 컨트롤(+/− 버튼)
- C. 사진 비율로 grid column 동적 조정
- D. fullscreen modal 모드

## 자동 검증으로 못 잡는 부분 (사용자 실 파일 검토 필요)

| 도구 | 검토 필요 |
|---|---|
| heic-to-jpg | 실 HEIC 파일 변환 화질·EXIF 보존 + 다중 파일 일괄 |
| crop | drag rect 정밀도 + 모바일 터치 영역 + 회전 후 좌표 정렬 |
| id-photo | 가이드 라인이 다양한 사진 비율에서 자연스러운지 + 흰 배경 옵션 |
| pdf-edit | drag&drop 모바일 동작(HTML5 native API라 모바일 제한적) + 큰 PDF 썸네일 메모리 |
| pdf-to-image | DPI별 실제 화질 + "전체 다운로드" 브라우저 차단 안내 |

## 후속 (§9.4 이동 대상)

- **canvas 비율 유지 fit JS 함수** — 사용자가 옵션 A/B/C/D 결정 후 적용
- **이미지 2차 묶음** = EXIF 제거·모자이크/블러·favicon 생성기
- **PDF 2차 묶음** = pdf-watermark·pdf-compress·pdf-page-number
- **pdf-edit·pdf-to-image 실기기 검증** = 큰 PDF + 모바일 한계
- **video wrapper hang fix 끝까지 검증**

## 학습 포인트

1. **canvas는 img와 다르게 비율 자동 유지 X** — `max-width` + `max-height` 동시 적용 시 두 limit이 따로 잘려서 stretch 발생. 비율 보장하려면 JS로 `width`·`height` 같이 계산하거나 CSS `aspect-ratio` 사용 필요. canvas는 `object-fit`도 안 됨
2. **HTML5 native drag&drop은 모바일 약함** — pdf-edit가 native API 사용해서 모바일 fallback으로 ↑↓ 버튼 제공한 이유. PointerEvents 패턴(crop·id-photo)이 모바일에서 더 안정적
3. **CSS `order`로 시각 순서만 변경** — DOM 순서는 접근성·SEO 관점에서 의미 있는 순서 유지(옵션 → 사진 → 자르기 = screen reader 친화). 시각만 모바일에서 사진 위로
4. **fieldset 스타일 영역 분리** = `::before` pseudo로 칩 라벨 + `border` + 살짝 다른 background. wrapper 추가 없이 영역 명확
5. **자동 검증의 한계** — 코드·구조·라우팅은 검증 가능, 실제 픽셀 인터랙션·라이브러리 동작·사용자 UX는 실 파일 검토 필요
