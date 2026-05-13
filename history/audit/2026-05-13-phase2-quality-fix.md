# Phase 2 품질 fix audit — 2026-05-13

**컨텍스트**: Critical 15 (audit-3) 직후 사용자 결정 "품질부터 올려야 함" → Phase 2 진입. Critical(크래시·보안·기능 실패) 다음 단계로 **메모리 효율·OOM 사전 차단·UX 안전성** 코드 fix. 적용 후 10 Explore agent 병렬 재검증.

**시점**: audit 시리즈 4번째 — 1) seo-llm-strengthening, 2) tools-functional-test, 3) critical-fix-verification, 4) **phase2-quality-fix (본 문서)**.

---

## 1. Phase 2 적용 작업 (3건 + utility 1건)

### P2-1a · 도구별 file size 사전 체크 + 공용 utility

**utility 추가** (`common/site-chrome.js:31-48`):
```js
window.TayStudio.checkFileSize(file, sizeMB, label) → boolean
```
- false 반환 시 자동 alert ("xx.xMB — 권장 한계 yyMB 초과") + caller가 return으로 중단
- fallback: `window.TayStudio && window.TayStudio.checkFileSize && !...checkFileSize(...)` 가드 패턴

**12 도구 적용** (image 7 + video 5):

| 도구 | 한계 | 근거 |
|---|---|---|
| image/compress | 200MB | 일반 이미지·검토 후 상향 (이전 500MB) |
| image/resize·crop | 100MB | canvas 메모리 안전 마진 |
| image/id-photo·ocr | 50MB | Tesseract worker 부담 |
| image/qr-scan | 20MB | 단일 사진 디코딩 |
| image/bg-remove | 30MB | ONNX 모델 43MB + input |
| video/compress·trim·rotate·to-mp3 | 1000MB | ffmpeg.wasm + 모바일 마진 |
| video/to-gif | 500MB | 디코드 + GIF 인코드 부담 |

**보류 (P2-1b → 후속 작업)**: PDF 5 + multi-file image 6 = 11 도구. PDF는 `file.type === 'application/pdf'` 패턴이 자동화 정규식과 안 맞아 수동 적용 필요. multi-file image는 forEach 안 `continue` 흐름이 단일 파일과 달라 별도 처리.

### P2-3 · canvas willReadFrequently 적용

**효과 명확 (3곳)**: getImageData·putImageData 호출 영역
- `image/mosaic/mosaic.js:177, 190` — tmp canvas (mosaic·blur 처리에서 readback)
- `image/qr-scan/qr-scan.js` — jsQR가 매 프레임 getImageData

**효과 미미 (3곳)**: drawImage만 호출
- `image/crop/crop.js:70, 81` — transformedCanvas·srcCanvas (회전·표시용)
- `image/mosaic/mosaic.js:149` — redraw (drawImage + stroke)

→ 회귀 0. 옛 브라우저 (Chrome <88·Safari <16)에서는 무시.

### P2-7 · image/compress 메모리 상한

- `file.size === 0` (C4 fix) 직후 `checkFileSize(file, 200, '이미지')` 통합
- 이전: 자체 500MB hardcoded `alert`. 현재: utility 일관 + 200MB 마진 (대용량 PNG 사용자 대비)

### Skip 결정 (2건)

| # | 결정 | 사유 |
|---|---|---|
| P2-5 | watermark drawPreview 빈 텍스트 alert 추가 | drawPreview는 슬라이더 input마다 호출 → alert 폭주. 빈 텍스트면 원본만 표시 = 자연스러운 UX. applyBtn alert (C3)만 정합 |
| P2-6 | format-convert downloadAllBtn 후 즉시 revoke | img-grid가 thumbnail에 같은 blob URL 사용 → 즉시 revoke 시 깨짐. **대안 발견** → `setTimeout(revoke, 3000)` 패턴 5분 작업으로 후속 처리 가능 |

---

## 2. 10 Agent 검증 결과 종합

| Agent | 영역 | 결과 |
|---|---|---|
| 1 | checkFileSize utility | 함수 정확 / fallback 안전 / return 흐름 정상. video 1000MB 모바일 안전마진 우려는 ffmpeg 자체 한계로 수용 |
| 2 | P2-3 willReadFrequently | 3/3 적용. mosaic·qr-scan 효과 명확, crop은 효과 미미하지만 회귀 0 |
| 3 | P2-1b 적용 방안 | PDF 5 도구 100MB, img-to-pdf 50MB, multi-file image 6 도구 100MB. 총 2~2.5h 추정 |
| 4 | P2-2 AbortController | bg-remove 불가 (ONNX 중단 X), ocr 가능 (Tesseract.terminate ~2h), video 가능하나 ffmpeg.exit 재로드 비용 (4-5h) |
| 5 | P2-4 watermark PNG/WebP | HTML 10줄 + JS 50줄 ≈ 30-45분 |
| 6 | P2-5·P2-6 skip 정합 | P2-5 정합. P2-6은 setTimeout(3s) revoke로 5분 안에 해결 가능 |
| 7 | Regression | syntax 0 fail / IIFE 격리 OK / fallback 안전 / alert chain 폭주 없음 / 모바일 0 영향 |
| 8 | 새 극한 case | Top 5 발견 (아래) |
| 9 | 통과율 추정 | 78% → 82.5% (+4.5%) |
| 10 | 종합 우선순위 | P2-2 (ocr만 우선) → P2-1b → P2-4 순 |

---

## 3. 새 극한 case (Top 5)

| # | case | 위치 | 심각도 |
|---|---|---|---|
| N8 | `checkFileSize(file, 0, ...)` 호출 시 모든 파일 거절. sizeMB 음수 미검증 | site-chrome.js:35-37 | Low (caller 신뢰) |
| N9 | multi-file 도구 (heic·merge·watermark) checkFileSize 미적용 — 한 파일만 초과해도 전체 동작 정의 안됨 | P2-1b 대상 11 도구 | **Medium** |
| N10 | drag·drop 폴더 → `file.type=''` → 조용히 skip. 사용자 혼동 | merge·heic-to-jpg 등 | Low |
| N11 | Clipboard paste 이미지 (Ctrl+V) → checkFileSize 미적용 (이벤트 핸들러 자체 없음) | 모든 도구 | Low (기능 미지원) |
| N12 | ffmpeg.wasm 32MB + input 1000MB = 1.03GB. video 한계 800MB로 조정 검토 | video 4 도구 | Low (이미 마진 있음) |

→ N9는 P2-1b에서 자연 해소. N8·N10·N11·N12는 Phase 3 (Medium) 검토 대상.

---

## 4. 통과율 변화 추정

| 카테고리 | audit-3 | Phase 2 후 추정 | Δ |
|---|---|---|---|
| 일반 시나리오 | 92% | 92% | 0 |
| Edge | 78% | 78% | 0 |
| **Boundary** | 88% | **92%** | +4 |
| **Error (OOM)** | 78% | **85%** | +7 |
| **메모리 (누수·크래시)** | 58% | **72%** | +14 |
| Multi-file | 75% | 75% | 0 |
| 모바일 | 92% | 92% | 0 |
| a11y | 20% | 20% | 0 |
| **종합** | **78%** | **82.5%** | **+4.5** |

**도구별 등급 변화 추정**:
- Image: B+ → A- (compress·bg-remove·ocr OOM 차단)
- PDF: B → B+ (size 사전 체크 일부)
- Video: A- → A- (이미 좋음, 마진 강화)

---

## 5. 보류 작업 (P2-1b·P2-2·P2-4)

| # | 작업 | 시간 | ROI |
|---|---|---|---|
| P2-1b | PDF 5 + multi-file image 6 size 체크 | 2~2.5h | 중 (N9 해소) |
| P2-2-ocr | ocr Tesseract.terminate 취소 | ~2h | **高 (UX 핵심)** |
| P2-2-bg | bg-remove AbortController | — | **불가** (ONNX 한계, 영구 skip) |
| P2-2-video | video ffmpeg.exit 취소 | 4~5h | 중 (재로드 비용) |
| P2-4 | watermark PNG/WebP | 30~45분 | 낮 (사용자 needs 제한) |
| P2-6-fix | format-convert setTimeout(3s) revoke | 5분 | 낮 (GC 의존 OK) |

**권장 순서**: P2-2-ocr → P2-1b → P2-6-fix → P2-4 → P2-2-video → Phase 3.

---

## 6. 변경 파일 (이번 phase)

```
common/site-chrome.js               (checkFileSize utility 추가)
image/compress/compress.js          (P2-7·P2-1a 통합)
image/resize/resize.js              (P2-1a 100MB)
image/crop/crop.js                  (P2-1a 100MB + P2-3 willReadFrequently)
image/id-photo/id-photo.js          (P2-1a 50MB)
image/qr-scan/qr-scan.js            (P2-1a 20MB)
image/ocr/ocr.js                    (P2-1a 50MB)
image/bg-remove/bg-remove.js        (P2-1a 30MB)
image/mosaic/mosaic.js              (P2-3 willReadFrequently 3곳)
video/compress/compress.js          (P2-1a 1000MB)
video/trim/trim.js                  (P2-1a 1000MB)
video/rotate/rotate.js              (P2-1a 1000MB)
video/to-gif/to-gif.js              (P2-1a 500MB)
video/to-mp3/to-mp3.js              (P2-1a 1000MB)
```

**syntax check**: `node --check` 14 파일 모두 통과. 13개 도구에서 `checkFileSize` 호출 grep 확인.

---

## 7. 다음 단계

1. **즉시**: 본 commit + push
2. **Phase 2 잔여** (선택): P2-2-ocr(2h) → P2-1b(2~2.5h) → P2-6-fix(5분) → P2-4(45분) ≈ 5-6h 총
3. **Phase 3** (Medium 15건): a11y aria-live·focus·tabindex + N8·N10·N11·N12 검토
4. **외부 작업** (GSC Batch 6, Bing WMT, Naver SA, 백링크) — 코드 fix 끝나면 병행

---

## 참고

- `history/audit/2026-05-13-tools-functional-test.md` — 원 250 케이스 audit
- `history/audit/2026-05-13-critical-fix-verification.md` — Critical 15 fix 결과
- `history/audit/2026-05-13-phase2-quality-fix.html` — 본 audit 시각 보고서
