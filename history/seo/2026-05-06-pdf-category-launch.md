# PDF 카테고리 신설 + 신규 도구 2종 + 기존 PDF 도구 3종 image→pdf 이전 (2026-05-06)

> §9.4 사용자 요청 — "이미 있는 것들은 그냥 놔두고 저 중에 없는 것들 합쳐서 pdf랑 image 나누는게 좋을 거 같은데". 13가지 PDF 도구 후보(merge·split·page-delete·rearrange·rotate·extract·img→pdf·pdf→img·compress·watermark·page-number·metadata·encrypt) 중 ROI 평가 후 신규 2종(pdf-edit 통합·pdf-to-image) + 기존 3종 이전 = pdf 카테고리 5선 출시.

## 결정 배경

`image/` 9선이 이미지 6 + PDF 3로 섞여 있던 구조 분리. 핵심 이유 3가지:

1. **PDF SERP 키워드 분리** — "PDF 합치기"·"PDF 자르기"·"PDF JPG 변환" 한국 검색량 매우 큰데 image hub에 묻혀 카테고리 키워드 약화
2. **image hub 정합성** — 신규 PDF 도구 2~4개 더 추가하면 14~15선까지 부풀어 "이미지" 카테고리 정의 깨짐
3. **차후 PDF 도구 추가 자리 확보** — pdf-watermark·pdf-compress·pdf-page-number 후속 묶음 자연스러운 자리

사용자 의사결정 = "기존 3개 모두 pdf/로 이전(Recommended)" + 신규 도구는 페이지 편집 통합(`pdf-edit`) + PDF→이미지 변환(`pdf-to-image`).

## 도구 ROI 매트릭스 (13 후보 → 2 신규 + 3 이전)

| 도구 | SERP | 광고 | 정적 | 결정 |
|---|---|---|---|---|
| 합치기·자르기·img→PDF | — | — | — | **이전** (image/ → pdf/) |
| **pdf-edit** (페이지 삭제+순서+회전 통합) | ★★★ | ★★ | ✓ pdf-lib + pdf.js | **신규 1순위** — 이력서·계약서. SmallPDF "Organize PDF" 패턴 |
| **pdf-to-image** (PDF→PNG/JPG) | ★★★ | ★★ | ✓ pdf.js | **신규 1순위** — "PDF JPG 변환" 검색량 최대급 |
| pdf-watermark | ★ | ★★★ | ✓ pdf-lib | 후속 (계약서·이력서 단가 ↑) |
| pdf-compress | ★★★ | ★★ | ⚠️ 품질↓ | 후속 (SmallPDF 대비 약하지만 트래픽 큼) |
| pdf-page-number | ★ | ★ | ✓ | 후순위 |
| pdf-extract-images | ★ | ★ | ✓ | 후순위 (개발자·디자이너 좁음) |
| pdf-metadata | ★ | ★ | ✓ | **§0.4 패턴 — 스킵** |
| pdf-encrypt/decrypt | ★★ | ★★ | ❌ pdf-lib 미지원 | **보류** (qpdf-wasm 별도 + 해제는 법적 회색) |

## 카테고리 신설 결정 — 옵션 비교

| 옵션 | 작업량 | SEO 위험 | 채택 |
|---|---|---|---|
| A. image/에 그대로 추가 (image/pdf-edit 등) | 작음 | PDF 키워드 분산, hub 비대 | ✗ |
| B. pdf/ 신설 + 기존 3개 이전 (URL 변경) | 큼 | meta refresh로 soft redirect, equity 일부 이전 | **✓ 채택** |
| C. pdf/ 신설 + 기존 3개는 image/ 그대로 | 중간 | 같은 도구 두 카테고리 분산, 사용자 동선 어색 | ✗ |

**B 채택 이유** = ① PDF 키워드 풀 강화 ② 카테고리 정합성 ③ 기존 image/pdf-* URL이 SC 인덱스 됐다면 손실 일부 있지만 canonical로 새 URL 명시하면 1~2주 내 회복 예상

## 신규 도구 1 — `pdf/pdf-edit/` (페이지 편집 통합)

**vendor**: `pdf-lib` (회전·페이지 복사·저장) + `pdf.js` (썸네일 렌더용)

**상태 모델**:
```js
let pages = [
  { origIndex: 0, rotation: 0, deleted: false, thumb: 'data:image/jpeg;base64,...' },
  ...
]
```
순서 변경 = 배열 splice. 회전 = `(rotation + 90) % 360`. 삭제 = 토글 플래그(↺로 복원). 저장 전까지 모든 변경 메모리 in-place.

**핵심 로직**:
- 썸네일 생성 — 업로드 시 pdf.js `getDocument({data: bytes.slice(0)}).promise` → 페이지마다 `getViewport({scale})` (target width 150px 기준 자동 스케일) → canvas render → `toDataURL('image/jpeg', 0.7)` 캐시
- 저장 — pdf-lib로 원본 reload(`PDFDocument.load(originalBytes, {ignoreEncryption: true})`) + 새 PDFDocument.create + active 페이지의 origIndex 배열로 `copyPages(src, indices)` → 각 페이지에 `setRotation(degrees((원래회전 + 사용자추가) % 360))` → save → Blob → 다운로드
- 원래 회전 보존 = `src.getPage(p.origIndex).getRotation().angle` + `p.rotation` 누적해서 setRotation

**드래그&드롭 UX**:
- HTML5 drag API (`draggable="true"` + `dragstart/over/leave/drop`) 데스크톱
- 모바일 fallback = ↑·↓ 버튼 (drag API 모바일 제한적)
- 시각 피드백 = `.thumb-card.dragging { opacity: .4 }` + `.drag-over { border-color: var(--primary); border-width: 2px }`

**썸네일 회전 시각화** = `img { transform: rotate(${p.rotation}deg) }` CSS transition. 실 처리 결과는 다운로드 후 PDF 뷰어에서 확인.

## 신규 도구 2 — `pdf/pdf-to-image/` (PDF→PNG/JPG)

**vendor**: pdf.js만 (pdf-lib 불필요)

**옵션 매트릭스**:
| 옵션 | 값 | 기본 |
|---|---|---|
| 페이지 범위 | `1-3,5,7-10` 또는 비우면 전체 | 전체 |
| 포맷 | PNG (무손실·선명) / JPG (용량 작음) | PNG |
| DPI | 72 / 150 / 300 / 600 | 150 |
| JPG 품질 | 1~100 | 90 (포맷=JPG일 때만 노출) |

**핵심 로직**:
```js
const scale = dpi / 72;
for (const idx of indices) {
  const page = await currentPdf.getPage(idx + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  const blob = await new Promise(r => canvas.toBlob(r, mime, quality));
  // BlobURL → 결과 그리드에 다운로드 카드 추가 + progress 갱신
}
```

**파싱 재사용** = `parseRange()` 함수는 `image/pdf-split/pdf-split.js`(line 40-66)에서 차용 — 빈 입력 = 전체 페이지로 확장하는 차이만 추가.

**전체 다운로드** = 결과 BlobURL 배열을 200ms 간격으로 anchor.click() 순차 트리거. 브라우저가 5+ 동시 다운로드 차단 시 사용자 권한 필요 안내. ZIP 일괄은 jszip(~95KB) 추가 필요 — 후속 백로그.

**DPI 가이드 표** (page 본문 tool-article):
| 용도 | 권장 DPI | A4 한 페이지 대략 |
|---|---|---|
| 화면·SNS | 72~150 | ~600KB(PNG) / ~150KB(JPG) |
| 일반 인쇄 | 150~300 | ~2MB / ~400KB |
| 고품질 인쇄 | 300~600 | ~8MB / ~1.5MB |

DPI 2배 = 픽셀 면적 4배 = 용량 약 4배.

## 기존 3종 이전 — 메타 갱신 매트릭스

각 도구별 11개 위치 변경:

| # | 위치 | image/ → pdf/ |
|---|---|---|
| 1 | `og:site_name` | "TAYSTUDIO Image" → "TAYSTUDIO PDF" |
| 2 | `og:url` | `/image/<slug>/` → `/pdf/<slug>/` |
| 3 | `<link rel="canonical">` | 동일 |
| 4 | JSON-LD WebApplication `url` | 동일 |
| 5 | JSON-LD BreadcrumbList position 2 | `Image` → `PDF` + `/image/` → `/pdf/` |
| 6 | JSON-LD BreadcrumbList position 3 item URL | `image/<slug>/` → `pdf/<slug>/` |
| 7 | breadcrumb DOM `<a href="../">이미지</a>` | `<a href="../">PDF</a>` |
| 8 | tool-article 관련 도구 cross-cat 링크 | `../compress/` → `/image/compress/` 등 (다른 카테고리 이미지 도구는 절대경로로) |
| 9 | tool-article 같은 카테고리 링크 | `../pdf-edit/`·`../pdf-to-image/` 추가(없던 것) |
| 10 | related-nav 라벨 | "→ 이미지 도구 모두 보기" → "→ PDF 도구 모두 보기" |
| 11 | `<script src="/image/vendor/pdf-lib.min.js">` | `/pdf/vendor/pdf-lib.min.js` |

`.js` 파일 자체는 변경 없음 (pdf-lib는 글로벌 `window.PDFLib` 그대로 사용).

## redirect 정책 — soft refresh stub

GitHub Pages는 응답 헤더 불가 = 301 redirect 못 줌. 해결 = 기존 `image/{pdf-merge,pdf-split,img-to-pdf}/index.html`을 짧은 stub HTML로 덮어쓰기:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>이전됨 — PDF 합치기 | TAYSTUDIO</title>
  <link rel="canonical" href="https://taystudio.github.io/pdf/pdf-merge/">
  <meta http-equiv="refresh" content="0; url=/pdf/pdf-merge/">
  <meta name="robots" content="noindex">
  <script>location.replace('/pdf/pdf-merge/');</script>
</head>
<body>
  <h1>PDF 합치기 도구가 이전되었습니다</h1>
  <p><a href="/pdf/pdf-merge/">새 위치로 이동</a></p>
</body>
</html>
```

**3중 안전장치** = ① `<meta http-equiv="refresh">` (정적 redirect, JS 차단 환경) ② `<script>location.replace()` (즉시) ③ `<link rel="canonical">` (Google 신호 — equity 새 URL로 일부 이전)

`<meta name="robots" content="noindex">` = 같은 콘텐츠 두 URL 노출 방지. 기존 `.js` 파일은 stub HTML이 미참조 → 삭제.

**SEO 회복 예상** = canonical로 새 URL 명시 + sitemap에서 stub 자동 제외(아래) → 1~2주 내 새 URL이 인덱스되며 옛 URL은 자연 deindex (수개월). Search Console에서 신규 5 URL 색인 요청 권장.

## vendor 분리 — `pdf/vendor/` 신설

| 파일 | 크기 | 출처 | 용도 |
|---|---|---|---|
| `pdf-lib.min.js` | 525 KB | `image/vendor/`에서 mv | 모든 PDF 도구 공통 |
| `pdf.min.mjs` | 336 KB | jsdelivr `pdfjs-dist@4.7.76` 신규 vendoring | pdf-edit 썸네일·pdf-to-image 변환 |
| `pdf.worker.min.mjs` | 1.36 MB | 동일 | pdf.js worker (lazy fetch + IndexedDB 캐시) |

**워커 소스 설정**:
```js
import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';
```

`image/vendor/`는 4종(qrcode·jsQR·tesseract·imgly-bg-remove)으로 정리. 분리 이유 = 카테고리 자급(향후 image/pdf 분기 운영 가능) + 사용자 의사결정 ("나중에 image path랑 pdf path 나눌건데 그렇게 알아서 각각 js 파일 넣어줘"). cross-import는 절대경로(`/pdf/...`·`/image/...`).

## build-sitemap.sh 갱신 — 2개 fix 동시

```diff
- CATEGORIES=("tools" "text" "image")
+ CATEGORIES=("tools" "text" "image" "pdf" "video")

+ is_noindex() {
+   grep -qE '<meta[[:space:]]+name="robots"[[:space:]]+content="[^"]*noindex' "$1" 2>/dev/null
+ }

  classify() {
    case "$url" in
      ...
+     "${DOMAIN}/pdf/")                 echo "1.0 weekly" ;;
+     "${DOMAIN}/video/")               echo "1.0 weekly" ;;
-     *"/tools/"*|*"/text/"*|*"/image/"*) echo "0.95 monthly" ;;
+     *"/tools/"*|*"/text/"*|*"/image/"*|*"/pdf/"*|*"/video/"*) echo "0.95 monthly" ;;
    esac
  }

  for dir in "${cat}"/*/; do
    file="${dir}index.html"
    [ -f "$file" ] || continue
+   is_noindex "$file" && continue
    ...
  done
```

**부수 효과**:
1. **video 누락 fix** — 이전엔 배열에 `video` 없었으나 sitemap에는 다른 경로로 video URL 들어가 있었음(이전 plan 기록 60 URL과 일치하지만 스크립트만 보면 누락 상태). 이번에 명시적으로 정리
2. **stub URL 자동 제외** — `image/{pdf-merge,pdf-split,img-to-pdf}/index.html`은 noindex라 sitemap에서 빠짐. 결과 = 60 → **63 URL** (pdf 6 신규 + video 6 정리 + image 7 정리 + 기존 그대로)

## 인프라 일괄 갱신

| 파일 | 변경 |
|---|---|
| `sw.js` | `CACHE_VERSION` 'v2' → **'v3'** + `STATIC_ASSETS`에 `/pdf/` 추가 (5번째 카테고리 hub) |
| `manifest.webmanifest` | description "53가지" → "55가지", shortcuts 4개 중 QR 코드 → PDF 합치기 교체 |
| `index.html` (루트) | og·twitter·title·description·keywords 모두 "이미지 6선·PDF 5선"으로, JSON-LD hasPart 4 → 5 WebSite, hub-card 4 → 5 (PDF 카드 신규 d4 + video d5), Organization "53선 → 55선", quick-list 이미지 행에서 pdf-merge 제거·PDF 행 신규 추가 (pdf-merge·자르기·편집·PDF→이미지 샘플) |
| `image/index.html` | ItemList 9 → 6 (pdf-merge·pdf-split·img-to-pdf 제거, 1-6 재정렬), tool-grid 6 카드, hub-intro·count·og 메타 "도구 6선" 갱신, hub-faq는 그대로(OCR·AI 모델 등 유지), "PDF 도구는 별도 카테고리로 →" cross-link 박스 신설(/pdf/ 가리킴), nav에 → PDF 도구 추가 |
| `common/site-chrome.js` | header nav 4 → **5 메뉴**: 계산기 · 텍스트 · 이미지 · **PDF** · 동영상 |
| `tools/privacy/index.html` | 시행일 갱신 + 카테고리 줄 분리(이미지·PDF·동영상 별도) + footer nav 5 카테고리 |
| `tools/terms/index.html` | 시행일 + 1조 "55종" 명시 + 2조 PDF 도구 정확성 면책 줄 신규 + footer nav 5 카테고리 |

## 검증

| 항목 | 결과 |
|---|---|
| JS syntax (`node --check`) | 5/5 ✓ — pdf-merge·pdf-split·img-to-pdf·pdf-edit·pdf-to-image |
| JSON-LD parse | 8/8 ✓ — pdf hub + 5 도구 + image hub + root |
| FAQ DOM count == JSON-LD | 6/6 ✓ — pdf 5 도구 (각 6Q) + pdf hub (5Q) |
| HTML 태그 밸런스 | 9/9 ✓ — open == close (모든 신규/수정 파일) |
| HTTP 200 (local server) | 17/17 ✓ — root, 5 카테고리 hub, 5 pdf 도구, 3 image stub, 3 vendor 파일, sitemap, sw, manifest |
| stub redirect 메타 | 3/3 ✓ — canonical(새 URL) + meta refresh + noindex 모두 적용 |
| /image/vendor/pdf-lib 잔존 | 0 ✓ |
| /image/index.html 안 PDF 도구 흔적 | 0 ✓ |
| pdf/ 안 "TAYSTUDIO Image" 잔존 | 0 ✓ |
| sitemap URL 수 | 60 → **63** (+3 — pdf 신규 6 - stub 3) |

## 사용자 후속 액션 (배포 후)

1. **Search Console**:
   - 신규 5 URL (`/pdf/`, `/pdf/{pdf-merge,pdf-split,pdf-edit,pdf-to-image,img-to-pdf}/`) "URL 검사 → 색인 생성 요청"
   - sitemap.xml 재제출
   - 기존 image/pdf-* 3개는 자연 deindex 대기 (canonical 명시로 equity 일부 새 URL 이전)
2. **카카오 OG 캐시 flush**: `https://developers.kakao.com/tool/clear/og` — 신규 5 URL + image hub
3. **PWA 캐시**: SW v2→v3 자동 갱신 — 사용자 첫 방문 시 새 자산 fetch
4. **실 PDF로 검토**: 데스크톱 Chrome에서 `/pdf/pdf-edit/`(드래그·회전·삭제)와 `/pdf/pdf-to-image/`(고DPI·범위) 한 번씩 돌려 확인

## 후속 백로그 (§9.4 이동 대상)

- **pdf-watermark** — 계약서·이력서 단가 ↑, 2차 묶음 (pdf-lib만)
- **pdf-compress** — 트래픽 매우 큼, 단 SmallPDF 대비 품질 트레이드오프 큼 (이미지 다운샘플 + JPEG 재인코딩)
- **pdf-page-number** — 후순위 (단발)
- **pdf-extract-images** — §0.4 좁은 SERP, 후순위
- **pdf-encrypt/decrypt** — pdf-lib 미지원, qpdf-wasm 별도 vendoring + 해제는 법적 회색, **보류**
- **ZIP 일괄 다운로드** (pdf-to-image) — jszip ~95KB 추가 vendoring
- **모바일 메모리 한계 보강** — 큰 PDF + 많은 페이지 + 600 DPI 조합에서 OOM 가능. 진단 alert + 권장값 안내
- **PDF 미리보기** (pdf-split) — 현재 범위 입력만 받음. pdf.js 추가됐으니 페이지 미리보기 + 체크박스 입력 가능

## 학습 포인트

1. **`+esm` 빌드 함정 회피** — pdf.js는 ESM .mjs 직접 vendoring으로 worker URL silent fail 위험 우회 (video/ffmpeg-loader.mjs에서 같은 패턴으로 학습한 교훈 재사용)
2. **pdf.js worker는 별도 fetch** — `GlobalWorkerOptions.workerSrc` 명시 필수. 1.36MB라 첫 사용 시만 로드되고 IndexedDB 캐시
3. **arrayBuffer 사본** — pdf.js `getDocument({data: bytes})`는 buffer를 detach시키므로 `bytes.slice(0)` 복사 필요 (저장 시 pdf-lib도 같은 buffer 재사용)
4. **GitHub Pages redirect 한계** — 응답 헤더 불가 = 301/302 못 줌. meta refresh + canonical + noindex 3중이 차선책 (Google soft redirect로 인식)
5. **카테고리 분리 트리거** — 한 hub에 도구 9선 넘어가면 hub 정합성 깨짐. SERP 키워드 풀 분리 + 차후 도구 자리 확보 위한 분리 가치 큼
