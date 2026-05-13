# 극한 케이스 보안 검사 + XSS fix audit — 2026-05-13

**컨텍스트**: Phase 3(audit-6) 직후 사용자 요청 "또 오류나는 그런거 없음? 극한 케이스에서 안되는거 고쳐야함". 2 agent 병렬 분석 (race·SW·network·메모리·navigation·security·invalid input) → **HIGH XSS 1건 발견** → 즉시 fix → Playwright payload 검증.

**시점**: audit 시리즈 7번째.

---

## 1. 검사 영역 결과

| 영역 | 검사 항목 | 결과 |
|---|---|---|
| Race condition / 재진입성 | 처리 중 다른 파일 선택·빠른 다중 click·state corruption | ✅ 안전 (runSeq·currentWorker·activeRun 패턴) |
| Service Worker / 캐시 stale | 새 deploy 후 옛 utility 캐시 | ✅ 안전 (CACHE_VERSION 무효화) |
| Network failure mid-process | ffmpeg/Tesseract CDN 다운로드 중 끊김 | ✅ 안전 (try-catch + formatVideoError) |
| 메모리 압박 | 50+ 결과 누적·heap 한계 | ✅ 안전 (performance.memory 진단 첨부) |
| Page navigation during processing | 처리 중 뒤로가기·beforeunload | ✅ 부분 안전 (cancel 버튼·qr-scan beforeunload) |
| Background tab throttle | setTimeout 1초 강제 throttle | ✅ 영향 없음 |
| WebView / In-app browser | 카톡·인스타·페북 in-app | ✅ banner 안내 (site-chrome.js) |
| **XSS / DOM injection** | 파일명 innerHTML 직접 삽입 | 🚨 **HIGH 1건 발견** |
| Polyglot / corrupted file | corrupted PNG·MIME 위조 | ✅ 안전 (loadImage onerror·M11 fix) |
| SVG·HTML import | SVG `<script>` 삽입 | ✅ 안전 (canvas만 사용) |
| PDF 악성 콘텐츠 | PDF JavaScript 실행 | ✅ 안전 (pdf-lib·pdf.js sandbox) |
| localStorage / IndexedDB pollution | 사용자 한도 초과 | ✅ 안전 (silent catch) |

**12개 영역 중 11개 PASS · 1개 HIGH 발견 → fix 적용**.

---

## 2. 🚨 XSS HIGH — 무엇이 문제였고 어떻게 fix했나

### 문제 (DOM XSS)

**발견 위치 (KO 4 + EN 4 = 8 파일, 14 위치)**:
- `image/format-convert/format-convert.js:58` `div.innerHTML = ...${f.file.name}...`
- `image/format-convert/format-convert.js:270` `card.innerHTML = ...${r.name}...`
- `image/merge/merge.js:62`
- `image/watermark/watermark.js:129, 339`
- `pdf/pdf-stamp/pdf-stamp.js:89, 283`
- EN 미러 동일 (4 파일)

**재현 시나리오**:
1. macOS/Linux에서 파일명을 `<img src=x onerror="alert('xss')">.png`로 변경
2. format-convert·watermark·merge·pdf-stamp에 업로드
3. `div.innerHTML = \`...${f.file.name}...\`` 시점에 HTML로 해석 → `onerror` 실행

**왜 발생했나**:
- `sanitizeFilename`은 **다운로드 명**만 안전화 — 화면 표시에는 적용 X
- 파일 시스템 제약(`<`·`>` 차단)이 일부 OS에서만. macOS·Linux는 허용
- 14 위치 모두 `innerHTML` + 사용자 입력 변수 직접 삽입

### fix

**1. 공용 utility 추가** (`common/site-chrome.js`):
```js
window.TayStudio.escapeHtml(s) → 5 entity (& < > " ')
```

**2. 8 파일에 esc 함수 선언 + 사용자 입력 변수 escape**:
```js
const esc = (window.TayStudio && window.TayStudio.escapeHtml)
  ? window.TayStudio.escapeHtml
  : (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

// 변경 전: ${f.file.name}
// 변경 후: ${esc(f.file.name)}
```

**3. fallback도 자체 escape**:
- SW v18 옛 캐시 활성 중에도 `(s) => String(s)` 대신 자체 escape 수행
- production deploy 후 SW v18 → v19 transition 중 보호

**4. CACHE_VERSION 강제 무효화** (`sw.js`):
- `v18` → `v19`. 사용자 다음 방문에 자동 새 site-chrome.js 받음

---

## 3. Playwright payload 검증

| 항목 | 검증 | 결과 |
|---|---|---|
| Payload 생성 | 파일명 `<img src=x onerror="window._xssTriggered=true">.png` | ✓ |
| 업로드 (DataTransfer) | format-convert dispatch | ✓ |
| **XSS 실행** | `window._xssTriggered` 값 | **`false`** ✅ |
| DOM escape 확인 | fileListHTML | `&lt;img src=x onerror="..."&gt;.png` ✅ |
| utility 로드 | `typeof TayStudio.escapeHtml` | `function` (새 SW) / fallback 발동 (옛 SW) ✅ |

**1/1 PASS** — XSS payload 차단 확인.

---

## 4. 그 외 영역 검증 요약 (발견 0건 사유)

### Race condition
- `video/compress.js` 등: `runSeq`/`activeRun` 수열번호 + cancel 후 결과 도착 무시
- `image/ocr.js`: `currentWorker` 일치 여부로 stale 결과 차단
- `image/compress.js`: `loadFile()` 시 이전 `currentImage` blob URL 명시 revoke

### SW / 캐시
- `sw.js` `CACHE_VERSION = 'taystudio-v19'` → deploy 자동 무효화
- stale-while-revalidate (CSS/JS) → 캐시 즉시 + 백그라운드 갱신

### Network failure
- ffmpeg-loader.mjs: fetch 실패 → throw → formatVideoError 분기
- Tesseract: worker 생성 실패 → exception → ocr.js 메시지
- IndexedDB quota: dbPut silent catch → 캐시 실패해도 동작 계속

### 메모리
- `performance.memory.usedJSHeapSize` 진단 → alert에 첨부 (모바일 사용자 정보 전달)
- pdf-edit M13 / video/to-gif M15 사전 추정 (Phase 3에서 처리됨)

### Navigation / unload
- qr-scan: `beforeunload` + `pagehide` 카메라 정지
- video/OCR: cancel 버튼으로 worker terminate

### Polyglot / SVG / PDF
- bg-remove M11: 확장자 + MIME 둘 다 검증 (Phase 3 fix)
- 0-byte: createImageBitmap catch (이전 fix)
- SVG: canvas API만 사용, `<script>` 실행 X
- PDF: pdf-lib는 parser 전용 / pdf.js는 sandboxed

---

## 5. 변경 파일

```
common/site-chrome.js                       (escapeHtml utility)
sw.js                                       (CACHE_VERSION v18 → v19)

image/format-convert/format-convert.js      (esc 선언 + 5 ${...} → ${esc(...)})
image/merge/merge.js                        (esc + 1 위치)
image/watermark/watermark.js                (esc + 4 위치)
pdf/pdf-stamp/pdf-stamp.js                  (esc + 3 위치)

en/image/format-convert/format-convert.js
en/image/merge/merge.js
en/image/watermark/watermark.js
en/pdf/pdf-stamp/pdf-stamp.js
```

총 10 파일.

---

## 6. 통과율 변화

| 카테고리 | audit-6 | audit-7 후 | 변화 |
|---|---|---|---|
| **보안 (XSS·polyglot·MIME)** | **B** | **A+** | XSS 차단 + escape utility + fallback |
| 그 외 카테고리 | (변화 없음) | (변화 없음) | — |

종합 통과율: 94% → **95%** 추정 (보안 카테고리 +).

---

## 7. 다음 단계

코드 작업 사실상 완료 (A+ 등급). 다음:

1. ⭐ **외부 작업** (GSC Batch 6 → Bing WMT → Naver SA → 백링크) — ROI 최대
2. AdSense 승인 모니터링 (5/9 migration 5일차, 1-2주 대기)
3. 사용자 needs 데이터 회수 후 N case (N10·N11) 결정

---

## 참고

- `history/audit/2026-05-13-phase3-medium-a11y.md` — Phase 3 (Medium·a11y)
- `history/audit/2026-05-13-security-xss-fix.html` — 본 audit 시각 보고서
