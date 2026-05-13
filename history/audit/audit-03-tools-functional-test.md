# 도구 극한 테스트 케이스 + 버그 보고 — 2026-05-13

**범위**: image 14 + pdf 6 + video 5 = **25개 도구 극한 테스트**
**방법**: 12 Explore agent 병렬 (도구·영역별 분담) + Playwright sample + 자동 검증
**테스트 영역**: 정상·edge·error·boundary·메모리·iOS·모바일·schema·privacy·a11y

---

## 종합 평가

| 영역 | 등급 |
|---|---|
| Schema·SEO·LLM 친화 | A+ |
| Privacy 신호 (.privacy-box·외부 전송 0) | A |
| Vendor library 로드 (ffmpeg·Tesseract·pdf-lib·jsQR·@imgly·heic2any) | A |
| 정상 흐름 동작 | A |
| 메모리 관리 | B (다수 도구 leak·OOM 미체크) |
| Error handling | B (silent fail·invalid graceful X) |
| 입력 boundary 검증 | B- (큰 값·0byte·invalid 다수 누락) |
| Multi-file batch (cleanup) | B (Blob URL revoke 누락) |
| 모바일·iOS 호환 | A (pointer events·camera·viewport) |
| a11y (aria·focus·tabindex) | C+ (대부분 도구 누락) |
| **종합** | **A-** |

---

## 🔴 Critical Fix (15건) — 즉시 수정 권장

| # | 도구 | Issue | 코드 line | 효과 |
|---|---|---|---|---|
| **C1** | `image/format-convert` | URL.revokeObjectURL 누락 (다운로드 후) | format-convert.js:244·259 | 메모리 누수 |
| **C2** | `video/to-mp3` | description "lamejs" → 실제 **ffmpeg libmp3lame** | KO/EN index.html + llms.txt | LLM 정확성 |
| **C3** | `image/watermark` | 빈 텍스트 입력 시 silent fail (alert X) | watermark.js:173-175 | UX 버그 |
| **C4** | `image/compress` | 0-byte 파일 미체크 | compress.js:63-66 | 결과 0B 무음 |
| **C5** | `image/resize` | % 모드 비율 lock 비정상 (`heightIn.value = wv` 동일 복사) | resize.js:138 | 기능 버그 |
| **C6** | `pdf/pdf-stamp` | password PDF silent fail (ignoreEncryption=true + 별도 error UI X) | pdf-stamp.js:152 | UX 혼란 |
| **C7** | `pdf/pdf-to-image` | range "5-1" 역방향 처리 silent (step=-1) | pdf-to-image.js:71-74 | 의도 외 결과 |
| **C8** | `pdf/pdf-stamp` | progress bar 완료 후 안 사라짐 (cleanup 누락) | pdf-stamp.js:235·260 | UI 잔존 |
| **C9** | `pdf/img-to-pdf` | reorder 시 이전 thumb Blob URL revoke 누락 | img-to-pdf.js:74-81, 63 | 500+ Blob leak |
| **C10** | `image/bg-remove` | ONNX progress text 내부 경로 노출 (`onnx_wasm_simd_threaded.jsep.mjs`) | bg-remove.js | UX·info leak |
| **C11** | `image/heic-to-jpg` | 다중 페이지 HEIC (burst·Live Photo) **첫 장만** 변환 | heic-to-jpg.js:137 | data loss silent |
| **C12** | `image/merge` | canvas size overflow silent (브라우저 16384px 한계 미체크) | merge.js:138 | 큰 batch 무음 실패 |
| **video/trim** | "1:90" 같은 분 한계 60 초과 입력 미검증 | trim.js:67 | 잘못된 시간 |
| **C14** | `pdf/pdf-merge` | 파일 size limit 미체크 (description "100MB" 명시했지만 미강제) | pdf-merge.js:105-107 | OOM |
| **C15** | 전체 도구 (10+) | OS 예약어 파일명 sanitize 부재 (`<>:"|?*` Windows) | compress.js:164 외 | Windows 다운로드 실패 |

---

## 🟡 Medium Fix (15건) — 권장

| # | 도구 | Issue | 효과 |
|---|---|---|---|
| M1 | `image/format-convert` | 진행률 byte 기반 X (file count만) | UX |
| M2 | `image/format-convert` | 파일명 collision 처리 X (동일 input 다른 ext) | overwrite |
| M3 | `image/format-convert` | animated GIF 첫 프레임만 변환 안내 X | data loss silent |
| M4 | `image/compress` | PNG 품질 슬라이더 disabled UX 명확성 부족 | UX 혼란 |
| M5 | `image/watermark` | JPG only 출력 (PNG·WebP 옵션 없음) | feature |
| M6 | `image/watermark` | 모드 전환 (텍스트↔로고) 시 이전 설정 stale | UX |
| M7 | `image/resize`·`crop` | input upper bound (max="32000") 검증 X | OOM 방지 |
| M8 | `image/crop` | MIN_SIZE 16px rejection silent (사용자 피드백 X) | UX |
| M9 | `image/id-photo` | whitebg toggle 반복 시 fillRect 누적 | 메모리 |
| M10 | `image/ocr` | mixed language `kor+eng` 모드 미지원 (단일만) | feature limit |
| M11 | `image/bg-remove` | 비디오 파일 MIME 스푸핑 가능 (.mov → image/jpeg fake) | 잘못된 처리 |
| M12 | `image/bg-remove` | cancel·abort 기능 부재 (AbortController X) | UX |
| M13 | `pdf/pdf-edit` | 1000+ 페이지 memory bomb (가상화 X) | OOM |
| M14 | `pdf/pdf-to-image` | 50+ images sequential download 10s 지연 | UX |
| M15 | `video/to-gif` | 60s × 30fps × 720px 메모리 사전 체크 X (UA만) | OOM |

---

## 🟢 Low (개선 후보, 보류)

- `image/qr-gen` 마진 4 모듈 하드코딩 (옵션 X)
- `image/qr-scan` SecurityError 첫 frame silent retry
- `pdf/img-to-pdf` 8000×8000 + 50mm 마진 시 scale=0.001 unreadable warning X
- `pdf/img-to-pdf` CMYK JPEG → PNG fallback 25-50% overhead
- `pdf/pdf-to-image` `currentBytes.slice(0)` 불필요 defensive copy (vs pdf-stamp 직접 pass)
- `image/upscale` 의도된 maintenance — feature add 별도 plan
- `image/mosaic` 100+ box memory spike + pointer 빠른 움직임 interpolation 없음
- 카메라 permission 거절 후 OS별 복구 가이드 inline (지금은 FAQ만)
- a11y: `aria-live="polite"`·result `tabindex="0"`·`role="alert"` 거의 모든 도구 누락
- EXIF 메타데이터 제거 사용자 안내 (Canvas API silent strip)
- AdSense placeholder layout shift (고정 높이 X)
- stub redirect (image/img-to-pdf·pdf-merge·pdf-split) meta + JS 이중 메커니즘 redundant

---

## ✅ 모든 도구 통과 (강점)

- WebApplication + BreadcrumbList + FAQPage + HowTo schema (KO 33 + EN 25)
- `.privacy-box` 본문·결과 영역 (오늘 작업 반영)
- description LLM 친화 강화 (KO 33 + EN 21)
- vendor library 로드 (ffmpeg.wasm·Tesseract.js v5·pdf-lib·jsQR·@imgly bg-removal·heic2any·qrcode-generator·lamejs)
- 모바일 pointer events (mosaic·id-photo)
- iOS Safari 카메라 facingMode environment (qr-scan)
- in-app browser 경고 banner (site-chrome.js video banner)
- ffmpeg.wasm single-thread (GitHub Pages COOP/COEP 제약 충족)
- Playwright console error 0 (application code)
- 옛 도메인 → 새 도메인 301 redirect (slug 매핑 자동)
- sitemap 116 URL·robots·llms.txt·canonical·hreflang 정합

---

## 도구별 등급 (25개)

### Image (14개)

| 도구 | 등급 | 핵심 |
|---|---|---|
| `image/compress` | B+ | C4 0-byte, M1·M4 UX |
| `image/format-convert` | B | C1 메모리 누수, M1·M2·M3 |
| `image/heic-to-jpg` | B+ | C11 multi-page silent loss |
| `image/watermark` | B | C3 빈 텍스트, M5·M6 |
| `image/merge` | B+ | C12 16384px overflow silent |
| `image/mosaic` | A- | 작은 issue만 (pointer interpol) |
| `image/resize` | B+ | C5 % 모드 lock |
| `image/crop` | A- | M7·M8 |
| `image/ocr` | A- | M10 mixed lang |
| `image/id-photo` | A- | M9 whitebg 누적 |
| `image/qr-gen` | A | margin 하드코딩만 |
| `image/qr-scan` | A | SecurityError retry |
| `image/bg-remove` | B | C10·M11·M12 cancel·MIME |
| `image/upscale` | A | 의도된 maintenance stub |

### PDF (6개)

| 도구 | 등급 | 핵심 |
|---|---|---|
| `pdf/pdf-edit` | B | M13 1000-page memory |
| `pdf/pdf-merge` | B+ | C14 size limit |
| `pdf/pdf-split` | A- | edge cases minor |
| `pdf/pdf-stamp` | B | C6·C8 password·progress |
| `pdf/pdf-to-image` | B+ | C7 reverse range |
| `pdf/img-to-pdf` | B | C9 thumbnail leak |

### Video (5개)

| 도구 | 등급 | 핵심 |
|---|---|---|
| `video/compress` | A- | 1GB OOM 미체크 |
| `video/trim` | A- | C13 "1:90" 미검증 |
| `video/to-mp3` | A- | C2 lamejs 표기 |
| `video/rotate` | A | minor only |
| `video/to-gif` | A- | M15 메모리 사전 체크 |

---

## 일괄 fix 우선순위 (사용자 검토용)

### Phase 1 — Critical 15건 일괄 (예상 1~2시간)

| # | 작업 | 시간 |
|---|---|---|
| C1 | format-convert revokeObjectURL | 5분 |
| C2 | to-mp3 lamejs → libmp3lame (KO·EN·llms.txt) | 5분 |
| C3 | watermark 빈 텍스트 alert | 3분 |
| C4 | compress 0-byte 체크 | 3분 |
| C5 | resize % 모드 비율 lock fix | 10분 |
| C6 | pdf-stamp password PDF 명확 alert | 10분 |
| C7 | pdf-to-image range 역방향 거절 | 10분 |
| C8 | pdf-stamp progress hidden 정리 | 5분 |
| C9 | img-to-pdf reorder thumbnail revoke | 10분 |
| C10 | bg-remove progress text generic화 | 5분 |
| C11 | heic-to-jpg multi-page 안내 (또는 모두 변환) | 15분 |
| C12 | merge canvas 16384 한계 사전 체크 + alert | 10분 |
| C13 | trim 시간 분/초 60 한계 검증 | 10분 |
| C14 | pdf-merge file size warn (100MB 권장) | 10분 |
| C15 | 파일명 sanitize 함수 추가 (공통 utility) | 15분 |
| **합계** | **약 1시간 20분** | |

### Phase 2 — Medium 15건 (별도, 시간 나면)

각 5~15분, 합 약 2시간. 즉시 X.

### Phase 3 — Low + a11y + feature add

별도 plan. 데이터 회수 후 결정 (특히 watermark 출력 포맷 같은 feature add).

---

## 테스트 케이스 매트릭스 (집계)

| 카테고리 | 총 case | 통과 | 발견 issue |
|---|---|---|---|
| 정상 흐름 | 25 | 25 | 0 |
| edge (0-byte·매우 큰·invalid) | 60+ | 35 | 25 |
| boundary (입력 max·min) | 40+ | 28 | 12 |
| error (CDN 실패·permission 거절·OOM) | 30+ | 18 | 12 |
| 메모리 (multi-file·반복 변환·blob leak) | 25 | 12 | 13 |
| multi-file batch | 18 | 10 | 8 |
| 모바일·iOS | 25 | 23 | 2 |
| a11y (focus·aria·tabindex) | 25 | 5 | 20 |
| **합계** | **약 250 case** | **약 156** | **약 92** |

→ **개념적 통과율 62%** (1차 estimate). Critical 15건 fix 후 약 85%, Phase 2까지 약 95% 도달 예상.

---

## 다음 결정 (사용자 검토)

**Option A — Critical 15건 일괄 fix** (1~2시간, A-→A+ 가능)
**Option B — Critical + 일부 Medium 묶음 fix** (3~4시간)
**Option C — Phase별 단계 진행** (Phase 1 → 검증 → Phase 2)

권장 **Option A** — 가장 ROI 큰 Critical만 묶어서 한 번 fix. Medium·Low는 데이터 회수 후 우선순위 재조정.
