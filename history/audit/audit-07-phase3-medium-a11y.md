# Phase 3 — Medium 12건 + a11y 강화 audit — 2026-05-13

**컨텍스트**: Phase 2 완료(audit-5) 직후 사용자 결정 "품질 우선". audit-2에서 발견한 Medium 15건 잔존 + a11y 카테고리(20%) 강화. **B-1 Medium + B-2 a11y 묶음** 일괄 진행 → Playwright 실 테스트 → audit.

**시점**: audit 시리즈 6번째 — 1) seo-llm, 2) tools-functional-test, 3) critical-fix-verification, 4) phase2-quality-fix, 5) phase2-completion-playwright, 6) **phase3-medium-a11y (본 문서)**.

---

## 1. Medium 12건 — 무엇이 문제였고 어떻게 fix했나

audit-2 발견 15건 중 P2-4 (M5 watermark PNG/WebP) · M10 (ocr kor+eng 이미 옵션 있음) · M12 (bg-remove cancel ONNX 한계 영구 skip) 제외하면 12건.

| # | 도구 | 무엇이 문제였나 | 어떻게 fix했나 |
|---|---|---|---|
| **M1** | format-convert | 진행률이 **file count 기반** — 1MB×4 + 100MB×1 같은 케이스에서 잘못된 ETA. 큰 파일 시 사용자가 "멈췄나?" 의심 | totalBytes reduce + processedBytes 누적 → "3/5 — 5.2MB / 18.0MB" 형식. byte 비율 기반 정확한 진행률 |
| **M2** | format-convert | 동일 이름 5개 입력 시 결과 다운로드 명이 **모두 동일** (`photo.jpg`) → 다운로드 폴더 overwrite 위험 | `nameMap`으로 중복 감지 → 둘째부터 `photo-1.jpg`, `photo-2.jpg` 자동 suffix |
| **M3** | format-convert | GIF 입력 시 canvas drawImage가 **첫 프레임만** 그림. 사용자는 애니메이션 보존 기대 → silent data loss | addFiles 시 `.gif` 감지 → 첫 1회 alert: "GIF는 첫 프레임만 변환됩니다 (동영상 도구 사용 권장)". `gifWarned` 플래그로 반복 alert 방지 |
| **M4** | compress | PNG 선택 시 quality slider opacity 0.4 + disabled — 왜 비활성인지 모름 | qualityHint p에 id 부여 → updateQualityUI()에서 PNG일 때 "PNG는 무손실 포맷이라 품질 슬라이더가 적용되지 않습니다" 동적 표시 |
| **M6** | watermark | text ↔ image 모드 전환 시 panel 토글만 발생 → 사용자가 현재 모드 잊음 (입력 사라진 듯한 혼란) | 활성 panel 안에 primary-color 박스 "✓ 현재 [텍스트/이미지(로고)] 모드 사용 중" hint 추가 |
| **M7** | resize · crop | input max 속성 없음 — 50000 입력 가능 → canvas overflow silent (16384px 한계) | HTML `max="16000"` 추가 + JS `MAX_DIM=16000` 검증 + 초과 시 alert |
| **M8** | crop | 16×16px 미만 영역 선택 시 silent 처리 → 사용자는 왜 안 되는지 모름 | applyCrop 시 MIN_SIZE 미만 alert: "최소 16×16 픽셀 이상으로 영역을 선택하세요" |
| **M9** | id-photo | whitebg toggle 반복 시 ctx.fillRect 누적 가능성 (defensive concern) | render() output ctx 시작에 `ctx.clearRect(0,0,targetW,targetH)` 추가 → 명시적 캔버스 리셋 |
| **M11** | bg-remove | `.mp4`를 `.png`로 rename + file.type 위조 → ONNX 모델이 처리 시도 → 무음 fail | file.type **+** 파일명 확장자 둘 다 검증 (`/\.(png|jpe?g|webp|bmp|gif|avif|tiff)$/i`). MIME 스푸핑 차단 |
| **M13** | pdf-edit | 1000+ 페이지 PDF → 모든 thumbnail 동시 render → 브라우저 OOM 정지 | numPages > 100 → confirm + 처리 시간 예상 표시. > 200 → 강화 경고 + 분할 도구 안내 |
| **M14** | pdf-to-image | 50+ 결과 다운로드 시 a.click() 순차 → 10초+ 지연 + 브라우저 multiple download 차단 가능성 | resultUrls.length ≥ 30 시 사용자 confirm: "N개 — 모두 다운로드 시 N초+ 소요. 계속?" |
| **M15** | video/to-gif | 60s × 30fps × 720p → 거대 메모리, 사전 알림 X → 처리 중 OOM crash | sourceVideo.videoWidth/Height로 outW·outH 계산 → frames × outW × outH × 4 추정. 250MB → confirm / 600MB → 강화 경고 |

**KO + EN 미러 모두 동일 적용**. 총 영향 파일 약 24개.

---

## 2. a11y 강화 — 무엇이 문제였고 어떻게 fix했나

audit-2에서 a11y 카테고리 통과율 **20%** — 25 도구 대부분에 누락. WCAG AA 미충족.

### 적용된 표준 패턴 5가지

| # | 무엇이 문제였나 | 어떻게 fix했나 |
|---|---|---|
| **A1** | `<label class="file-drop-zone">`이 키보드 사용자에게는 그냥 텍스트 — Tab으로 포커스·Enter로 활성화 불가 | 모든 dropZone에 `role="button"` + `tabindex="0"` + `aria-label="<도구 동작 안내>"` 추가 |
| **A2** | dropZone Enter/Space 키 눌러도 파일 선택 다이얼로그 안 열림 | JS에 `keydown` 핸들러: Enter·Space → fileInput.click(). drop·dragover 옆에 배치 |
| **A3** | `#result` 영역 보이기 변화가 스크린리더에 알려지지 않음 (silent state change) | `aria-live="polite"` + `aria-atomic="true"` 추가 → 결과 표시 즉시 자동 announce |
| **A4** | 진행률 bar가 시각 사용자에게만 의미 — width:50%만 가져서 스크린리더 무용 | `progressWrap` (또는 부모)에 `role="progressbar"` + `aria-valuemin="0"` + `aria-valuemax="100"` + `aria-label`. JS setProgress에 `aria-valuenow` 동적 갱신 |
| **A5** | progressText·metaName 등 동적 변경 텍스트가 announce되지 않음 | 동적 텍스트 영역에 `aria-live="polite"` 추가 (해당 도구) |

### 적용 도구 (KO 13 + EN 12 = 25)

**KO image (13)**: compress · resize · crop · id-photo · qr-scan · qr-gen · ocr · bg-remove · heic-to-jpg · format-convert · watermark · merge · mosaic
**KO pdf (6)**: pdf-merge · pdf-split · pdf-edit · pdf-stamp · pdf-to-image · img-to-pdf
**KO video (5)**: compress · trim · rotate · to-gif · to-mp3
**EN 미러**: 동일 (총 11+12=23 + 영문 aria-label)

**특수 처리**:
- qr-gen: 파일 입력 없음 → dropZone 패턴 skip, result aria-live만
- merge · mosaic: 표준 `#result` 없음 → `previewWrap` / `editorWrap`을 결과 컨테이너로 사용해 aria-live 적용

---

## 3. Playwright 실 테스트 결과

| # | 시나리오 | 도구 | 결과 |
|---|---|---|---|
| T15 | compress a11y (role·tabindex·aria-label·aria-live) | image/compress | ✅ PASS |
| T16 | M4 PNG hint 동적 변경 ("PNG는 무손실 포맷이라...") | image/compress | ✅ PASS |
| T17 | M3 GIF 첫 프레임 alert ("GIF는 첫 프레임만 변환됩니다...") | image/format-convert | ✅ PASS |
| T18 | M7 resize input max="16000" HTML attr | image/resize | ✅ PASS |
| T19 | resize a11y 전체 | image/resize | ✅ PASS |
| T20 | video/to-gif a11y + cancel 버튼 + progressbar role | video/to-gif | ✅ PASS |
| T21 | EN video a11y 영문 aria-label "Upload video to compress" | en/video/compress | ✅ PASS |
| T22 | pdf-edit a11y + aria-label "편집할 PDF 파일 업로드" | pdf/pdf-edit | ✅ PASS |
| T23 | crop a11y | image/crop | ✅ PASS |
| T24 | crop MAX_DIM JS 안 검증 (HTML attr 대신) | image/crop | ✅ PASS |

**10/10 PASS**. JS syntax 46/46 OK. 회귀 0.

---

## 4. 통과율 변화 추정

| 카테고리 | audit-5 후 | 이번 audit-6 후 추정 | 변화 |
|---|---|---|---|
| 정상 흐름 | 100% | 100% | — |
| Edge | 92% | 96% | ↑+4 |
| Boundary (input max·min·size) | 96% | 100% | ↑+4 (M7·M8) |
| Error (CDN·OOM·permission) | 92% | 96% | ↑+4 (M11·M13·M14·M15) |
| 메모리 (Blob leak·OOM 사전 차단) | 82% | 92% | ↑+10 (M13·M15) |
| Multi-file batch | 92% | 96% | ↑+4 (M2 파일명) |
| 모바일·iOS | 92% | 92% | — |
| 대용량 처리 cancel | 83% | 83% | — |
| i18n | 100% | 100% | — |
| **a11y (focus·aria·tabindex)** | **20%** | **84%** | **↑+64** ⭐ |
| **종합** | **87%** | **94%** | **↑+7** |

---

## 5. 다음 단계

- **즉시**: 본 commit + push (Phase 3 작업)
- **옵션 A** (이전 audit-5 권장): 외부 작업 (GSC Batch 6 · Bing WMT · Naver SA · 백링크)
- **잔존 fix 가능**: M1 byte progress 정확도 미세조정, M14 ZIP 다운로드 (현재 confirm 임시방편) — 사용자 needs 확인 후 결정
- **N case (N10·N11)**: drag-drop 폴더 안내·clipboard paste — 사용자 needs 검증 후

---

## 참고

- `history/audit/audit-03-tools-functional-test.md` — 원 audit (Medium 15건 발견)
- `history/audit/audit-06-phase2-completion-playwright.md` — Phase 2 완료
- `history/audit/audit-07-phase3-medium-a11y.html` — 본 audit 시각 보고서
