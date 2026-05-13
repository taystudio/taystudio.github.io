---
name: full-test
description: TAYSTUDIO 도구·페이지 풀 매트릭스 테스트 + UX 일관성 점검 + Critical 즉시 fix + audit 작성. 큰 변경 후·release 전·검수 라운드에 사용. 모든 카테고리 (image·pdf·video·text·calculator·meta page) 일괄 검증. 디테일 케이스 카탈로그·발견 패턴 누적.
---

# Full Test 실행 절차 + 케이스 카탈로그

이 skill을 호출하면 사이트 전 도구·페이지를 매트릭스 + UX 관점에서 검증하고, Critical 결함은 즉시 fix하고, audit 보고서를 생성한다. 누적된 디테일 케이스를 활용해 다음 회차마다 더 정밀한 검증 가능.

## 언제 호출하나

- 큰 기능 추가·여러 도구 동시 변경 후 회귀 검증
- 외부 push 전 release readiness 점검
- 사용자가 "final test" / "풀 테스트" / "all case" 요청
- 사용자가 "고친 거 검증" 요청

---

## 6단계 실행

### 1) 사용자에게 범위 확인 (AskUserQuestion)

```
- 핵심 매트릭스 (~200 케이스, 30분)
- 풀 매트릭스 (~600 케이스, 1시간)
- 극한만 (~100 케이스, 20분)

- UX 평가: 10 핵심 / 전체 25 / skip
```

### 2) 테스트 파일 생성

`.playwright-mcp/test-files/`에 매트릭스대로 파일 생성. **§A 테스트 파일 매트릭스** 참고.

### 3) 로컬 서버 실행

```bash
lsof -ti:8089 | xargs kill -9 2>/dev/null
python3 -m http.server 8089 > /tmp/srv.log 2>&1 &
```

### 4) Agent 4-6 병렬 spawn (정적 분석 + UX)

각 agent에 명확한 범위 + **§B 도구별 케이스 매트릭스** + **§C 시나리오 카탈로그** + 보고 format. **Playwright 사용 X** (main이 별도 진행).

각 agent 보고 format:
```
## <도구>
매트릭스: 정상 ✅ / 한계 ✅ alert / invalid ✅ / 0-byte ⚠️ / corrupted ✅ / multi-file ✅
UX: 일관성 ★★★★☆ · 불편: ...
종합: A
```

마지막에 Critical·Medium·Low 분리 정리.

### 5) Critical 즉시 fix + Playwright spot-check

agent 결과에서 발견된 Critical 5-10건 즉시 main이 직접 fix. **§D Playwright 패턴** 활용.

Medium·Low는 audit에 plan으로 명시 (선택적으로 사용자 확인 후 다 fix).

### 6) audit 작성 + INDEX 갱신

`history/audit/audit-NN-<slug>.{md,html}` 신규. INDEX.md에 1줄 추가 + 통과율 흐름 갱신. **§E audit 형식 참고**.

---

# §A. 테스트 파일 매트릭스

## 확장자별 핵심 파일

`.playwright-mcp/test-files/`에 생성. Pillow 없어도 raw bytes·base64로 가능.

| 확장자 | 파일명 | 용도 |
|---|---|---|
| **PNG** | `tiny.png` (1×1 60B) · `small.png` (100×100 1KB) · `medium.png` (5KB) · `large.png` (2048×2048 20KB) | 사이즈 boundary |
| **JPG** | `tiny.jpg` (1×1 base64) | format 분기 |
| **WebP** | `tiny.webp` (base64) | 인코더 호환 |
| **GIF** | `tiny.gif` (1×1) | M3 첫 프레임 안내 검증 |
| **BMP** | `tiny.bmp` (2×2) | 비주류 포맷 |
| **AVIF** | (선택) | Safari fallback 검증 |
| **HEIC** | mocked file (`new File([], 'photo.heic', {type:'image/heic'})`) | iOS 시뮬 |
| **PDF** | `tiny.pdf` (minimal 1 page) · `corrupted.pdf` | PDF 처리 |
| **MP4** | `tiny.mp4` (ffmpeg testsrc 1초) · `small.mp4` (5초) | video 도구 |
| **MOV/WebM** | `tiny.webm` (libvpx-vp9) | 포맷 호환 |
| **MP3** | `tiny.mp3` (anullsrc 1초) | audio |
| **TXT** | `tiny.txt` · `long.txt` (12KB) | text 도구 |
| **0-byte** | `zero.png` · `zero.pdf` | 빈 파일 거절 |
| **corrupted** | `corrupted.png` (header만) · `corrupted.pdf` | M11 + try/catch 검증 |
| **type spoofed** | `not-image.png` (text 내용) | MIME 위장 |

## Python 생성 스크립트 (재사용)

```python
import struct, zlib, base64
def make_png(w, h, fname):
    sig = b'\x89PNG\r\n\x1a\n'
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    raw = b''.join(b'\x00' + b'\xff\x00\x00' * w for _ in range(h))
    idat = zlib.compress(raw, 9)
    open(fname, 'wb').write(sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b''))

# tiny.jpg (1×1 빨강 base64)
open('tiny.jpg', 'wb').write(base64.b64decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQBAQAAAAAAAAAAAAAAAAAAAAr/2gAMAwEAAhADEAAAAVMH/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/hAAhFeGlmAABNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAA=='))
# 동일 패턴: tiny.webp / gif / bmp 모두 base64

# PDF
open('tiny.pdf', 'wb').write(b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n152\n%%EOF')

# corrupted (header만)
open('corrupted.png', 'wb').write(b'\x89PNG\r\n\x1a\n' + b'\x00' * 50)
open('corrupted.pdf', 'wb').write(b'%PDF-1.4\n' + b'\x00' * 50)

# ffmpeg 있으면
# ffmpeg -f lavfi -i "testsrc=duration=1:size=320x240:rate=10" -pix_fmt yuv420p tiny.mp4 -y
# ffmpeg -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 1 -c:a libmp3lame tiny.mp3 -y
```

---

# §B. 도구별 케이스 매트릭스

## Image 13 도구

각 도구별로 다음 8 카테고리 시나리오 검증:

| 도구 | 정상 입력 | size 한계 | 0-byte | corrupted | invalid type | multi-file | 도구 특화 |
|---|---|---|---|---|---|---|---|
| compress | PNG·JPG·WebP | 200MB | ✅ alert | onerror | type check | N/A | PNG→JPG 흰 배경 fill |
| resize | 이미지 | 100MB | ⚠️ onerror | onerror | type check | N/A | px·% 모드 / MAX_DIM=16000 |
| crop | 이미지 | 100MB | ⚠️ onerror | onerror | type check | N/A | MIN_SIZE=16 · 회전·반전 |
| id-photo | 사진 | 100MB | ⚠️ onerror | onerror | type check | N/A | 비율 lock · mm×300dpi |
| qr-scan | QR 이미지 | 20MB | ⚠️ onerror | onerror | type check | N/A | 카메라 권한 · jsQR |
| qr-gen | (입력 text) | N/A | 빈 텍스트 alert | N/A | 너무 긴 텍스트 alert | N/A | Wi-Fi escape · EC 레벨 |
| ocr | 이미지 | 50MB | ⚠️ Tesseract catch | catch | type check | N/A | createWorker singleton · cancel |
| bg-remove | 이미지 | 30MB | ⚠️ removeBackground catch | catch | **type+ext 이중 검증** | N/A | ONNX cancel UX only |
| heic-to-jpg | HEIC | 100MB | ⚠️ heic2any catch | catch | extension check | **20+ confirm** | 다중 페이지 자동 분리 |
| format-convert | 이미지 | 100MB | ⚠️ createImageBitmap catch | catch | type+ext check | 정상 | **GIF 첫 프레임 alert** · 파일명 collision suffix · byte progress |
| watermark | 이미지 | 100MB | silent skip | silent skip | silent skip → **alert** | 정상 | 9 위치 · 타일 · JPG/PNG/WebP |
| merge | 이미지 | 100MB | silent skip | silent skip | silent skip → **alert** | 정상 | 3 모드 · MAX_CANVAS_DIM=16000 |
| mosaic | 이미지 | 100MB | **try/catch alert** | **try/catch alert** | type check | N/A | drag rect · 사후 strength |

## PDF 6 도구

| 도구 | 정상 | size | 0-byte | corrupted | invalid | multi-file | 도구 특화 |
|---|---|---|---|---|---|---|---|
| pdf-merge | PDF | 100MB(개별) | load throw catch | catch | type check | 5/30/50 + **total>100MB confirm** | 순서 ↑↓ |
| pdf-split | PDF | 100MB | catch | catch | type check | N/A | 범위 "5-1" 역방향 alert · 초과 alert |
| pdf-edit | PDF | 100MB | catch | catch | type check | N/A | **100쪽+ confirm · 200쪽+ 강화 + cancel** |
| pdf-stamp | PDF | 100MB | catch | catch | type check | 5/30 + total guard | **isEncrypted throw** · `.dragover` 클래스 |
| pdf-to-image | PDF | 100MB | catch | catch | type check | N/A | **DPI 600 + 30+ confirm** · ZIP 다운로드 (JSZip dynamic) |
| img-to-pdf | 이미지 multi | 50MB(개별) | catch | catch | type check | + total guard | embedJpg→PNG fallback |

## Video 5 도구

| 도구 | 정상 | size | invalid | corrupted | 도구 특화 |
|---|---|---|---|---|---|
| compress | mp4 | 1000MB | type check | ffmpeg.exec throw | cancel + runSeq · resolution·CRF |
| trim | mp4 | 1000MB | type check | catch | **parseTime nums[1]<60·end>start·zero 길이 alert** |
| rotate | mp4 | 1000MB | type check | catch | scale 옵션 · AAC 재인코딩 |
| to-gif | mp4 | 500MB | type check | catch | **parseTime 60검증 (trim 동일)** · **memory 추정 250MB/600MB 2단계** |
| to-mp3 | mp4 | 1000MB | type check | 0-byte 출력 가능 | libmp3lame · 저작권 경고 |

## Text 3 도구

| 도구 | 정상 | edge | XSS | 도구 특화 |
|---|---|---|---|---|
| counter | 텍스트 | 100만자 | textContent safe | **debounce 150ms** · 이모지 codePoint · UTF-8 byte |
| sns-format | 텍스트 | 100만자 | value 경로 only | applyStyle · 해시태그 한글 |
| kbd-convert | 텍스트 | 100만자 | value 경로 only | 복합자모 (ㅘㅙㄻㅄ) · 두벌식 |

## Calculator 38 도구 (sample 12 검증 + 나머지 패턴 동일)

| 도구 | 정상 | 음수 | 0 | 빈 | 비숫자 | 1.2.3 | 큰 값 | 도구 특화 |
|---|---|---|---|---|---|---|---|---|
| salary | ✅ | alert | alert | alert | NaN alert | parseFloat=1.2 | OK | **근로소득세액공제 한도 (year-end 패턴)** |
| year-end | ✅ | alert | OK (소득 0) | alert | alert | OK | OK | 8단계 누진세 · 세액공제 한도 적용 |
| severance | ✅ | alert | alert | alert | alert | OK | OK | **입사일>퇴사일 검증** · 1년 미만 alert |
| comprehensive | ✅ | alert | alert | alert | alert | OK | OK | 적용세율 라벨 |
| hourly | ✅ | alert | alert | alert | alert | OK | OK | 209시간 · **2026 최저시급 10,320원** |
| bmi | ✅ | alert | **키 0 차단** | alert | alert | OK | OK | 6단계 분류 |
| cartax | ✅ | alert | alert | alert | alert | OK | OK | EV 감면 2026 연장 · 공채 추정 |
| insurance | ✅ | alert | alert | alert | alert | OK | OK | 4대보험 분리 |
| parental-leave | ✅ | **음수 차단** | alert | alert | alert | OK | months>12 클램프 | 6+6 부모공동 · 월별 detail |
| 그 외 28 도구 | (동일 패턴) | — | — | — | — | — | — | — |

## Meta page

| 페이지 | 검증 |
|---|---|
| 홈 (KO/EN) | hero·5 LIVE 카드·privacy 강조·5필터·카드 수치 정확 (counts.json) |
| About | 미션·운영자·기술·15 출처·FAQ |
| Privacy / Terms | breadcrumb·.card·옵트아웃·외부 링크 nofollow noopener·수치 정확 |
| Hub (image·pdf·video·text·tools) | privacy-box (text 포함)·#toolSearch·related-nav·hub-intro·hub-faq |
| 404 | root /404.html + en/404.html 존재·Top4 도구 카드 |
| Sitemap (HTML) | /sitemap/·/en/sitemap/ 65 도구 카탈로그·footer 링크 |

---

# §C. 시나리오 카탈로그 (8 카테고리)

각 카테고리별 검증 포인트 + 발견 패턴 누적.

## C-1. 정상 흐름 (Normal)
- 핵심 입력 → 처리 → 결과 → 다운로드까지 완주
- preview·meta·진행률·sanitize 다운로드 명

## C-2. Edge (corrupted·0-byte·이상한 확장자)
- 빈 파일 거절
- corrupted 파일 try/catch + 명시 alert (silent fail 차단)
- type 위장 (text를 .png로) 차단
- 확장자만 검증 vs MIME 둘 다 검증

## C-3. Boundary (입력 max·min·size 한계)
- size 한계 ± (-1MB / +1MB)
- input number max/min (resize 16000·crop MIN_SIZE 16)
- 페이지 범위 "5-1" 역방향·"1000" 초과
- parseTime "1:90" (60 초과)·"0-0" 제로 길이

## C-4. Error (CDN·permission·OOM)
- ffmpeg/Tesseract CDN 다운로드 중 끊김 → formatVideoError
- 카메라 권한 거부 → SecurityError swallow + retry 안내
- IndexedDB quota 초과 → silent catch + 동작 계속
- OOM 사전 감지 → 메모리 추정 confirm

## C-5. 메모리 (Blob leak·OOM 사전 차단)
- 50+ 결과 누적 시 메모리 누수
- size 사전 체크로 OOM 회피
- 새 convert 시 이전 blob URL revoke
- performance.memory.usedJSHeapSize 진단

## C-6. Multi-file batch
- N=5·30·50 파일 batch 처리
- 일부 invalid 시 status='err' 명시 (silent skip 차단)
- 총 size 가드 (pdf-merge·pdf-stamp·img-to-pdf 100MB)
- 다운로드 큐 간격 (120ms~200ms)
- ZIP 다운로드 (pdf-to-image)

## C-7. 모바일·iOS
- file 권한 짧음 → readVideoFile 즉시 read
- iCloud·Google Photos 클라우드 → NotReadableError + 안내
- Pointer Events + setPointerCapture (mosaic·id-photo)
- in-app browser banner (카톡·인스타·페북)
- iOS Safari 메모리 ~500MB heap

## C-8. cancel (대용량 처리)
- OCR: Tesseract.terminate + worker singleton
- video: ffmpeg.terminate + runSeq/activeRun
- bg-remove: UX cancel (ONNX 한계, reload 권장)
- catch에서 `/terminat|abort/i` 패턴 감지

## C-9. i18n (KO/EN 일관)
- isEnglish() 헬퍼 (lang·path /en/ 감지)
- checkFileSize 한·영 메시지 분기
- aria-label·alert·label·title 모두 EN 미러

## C-10. a11y (focus·aria·tabindex)
- dropZone role="button" + tabindex="0" + aria-label
- keydown Enter/Space → fileInput.click()
- #result aria-live="polite" + aria-atomic="true"
- progressbar role + aria-valuemin/max/now
- 동적 텍스트 aria-live
- skip-link 글로벌 (site-chrome)

## C-11. 보안 (XSS·polyglot·MIME)
- 파일명 innerHTML → escapeHtml (KO+EN 8 도구 14 위치)
- corrupted 파일 차단
- MIME 위장 + 확장자 이중 검증 (bg-remove M11)
- SVG `<script>` (canvas API만 사용 — 안전)
- PDF JavaScript (pdf-lib·pdf.js sandbox)

## C-12. 성능
- OCR createWorker singleton (lang 캐시)
- video 매번 fresh load (메모리 cleanup)
- willReadFrequently (mosaic·qr-scan canvas)
- text 도구 debounce 150ms
- HTML lazy loading
- Core Web Vitals (LCP·INP·CLS Good 99%+)

## C-13. 데이터 정합성
- counts.json source of truth: tools 38·image 13·pdf 6·video 5·text 3·total 65
- 모든 HTML 수치 동기화 (KO+EN)
- 9선·5선·36개·59종 stale 0건

## C-14. 계산 정확성
- salary·year-end·severance·comprehensive 등 공식 1:1
- 근로소득세액공제 한도 (74만·66만·50만)
- 한계 검증 (날짜 역전·음수·0)
- 공식 출처 명시 (국세청·복지부·근로기준법)

---

# §D. Playwright 패턴

## D-1. 기본 navigate + SW 캐시 해제

```javascript
mcp__plugin_playwright_playwright__browser_navigate('http://localhost:8089/<tool>/?test=1')
mcp__plugin_playwright_playwright__browser_evaluate(`async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) await r.unregister();
  const keys = await caches.keys();
  for (const k of keys) await caches.delete(k);
  return { cleared: true };
}`)
mcp__plugin_playwright_playwright__browser_navigate('http://localhost:8089/<tool>/?test=2')  // 재로드 (캐시 무효 후)
```

## D-2. 파일 업로드 시뮬레이션

```javascript
// 실제 파일 (test-files 사용)
mcp__plugin_playwright_playwright__browser_click({ target: '#fileInput', element: 'fileInput' })
mcp__plugin_playwright_playwright__browser_file_upload({ paths: ['/Users/thlee/Desktop/gitRepo/studio/.playwright-mcp/test-files/large.png'] })

// 가상 size 모킹 (300MB)
mcp__plugin_playwright_playwright__browser_evaluate(`() => {
  const f = new File([new Uint8Array(100)], 'big.png', { type: 'image/png' });
  Object.defineProperty(f, 'size', { value: 300 * 1024 * 1024 });
  const dt = new DataTransfer();
  dt.items.add(f);
  const input = document.getElementById('fileInput');
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return { dispatched: true };
}`)

// XSS payload 파일명
const xssName = '<img src=x onerror="window._xssTriggered=true">.png';
```

## D-3. alert/confirm 처리

```javascript
mcp__plugin_playwright_playwright__browser_handle_dialog({ accept: true })  // confirm: 진행
mcp__plugin_playwright_playwright__browser_handle_dialog({ accept: false }) // confirm: 거절
```

## D-4. 결과 검증

```javascript
mcp__plugin_playwright_playwright__browser_evaluate(`() => ({
  resultHidden: document.getElementById('result')?.hidden,
  downloadName: document.getElementById('downloadBtn')?.download,
  fileListHTML: document.getElementById('fileList')?.innerHTML?.slice(0, 200),
  xssTriggered: window._xssTriggered,
  hasUtility: typeof window.TayStudio?.checkFileSize === 'function',
})`)
```

## D-5. a11y 검증

```javascript
mcp__plugin_playwright_playwright__browser_evaluate(`() => ({
  dropRole: document.getElementById('dropZone')?.getAttribute('role'),
  dropTabindex: document.getElementById('dropZone')?.getAttribute('tabindex'),
  dropLabel: document.getElementById('dropZone')?.getAttribute('aria-label'),
  resultAriaLive: document.getElementById('result')?.getAttribute('aria-live'),
  skipLink: !!document.querySelector('.skip-link'),
  mainId: document.querySelector('main')?.id,
})`)
```

---

# §E. audit 형식

`history/audit/audit-NN-<slug>.{md,html}` 신규. **`audit-03-tools-functional-test.html` 풍부 형식 참고** (250 케이스 + 도구별 등급 표 + 카테고리 progress bar + Critical·Medium·Low 분리).

audit 구조:
1. 컨텍스트 (이전 audit 흐름 + 사용자 결정)
2. 종합 평가 (summary-grid + 등급 table)
3. 매트릭스 결과 (카테고리별 등급 + 핵심 발견)
4. Critical fix N건 (문제 → fix → 검증)
5. Medium·Low plan
6. UX 개선 아이디어 3-5건
7. 통과율 변화 (카테고리별 progress bar)
8. 변경 파일 list
9. 다음 단계

INDEX.md에 1줄 추가 + 통과율 흐름 갱신.

---

# §F. 발견 패턴 카탈로그 (누적)

audit-3 ~ audit-12에서 발견된 주요 패턴. 다음 회차 검증 시 참고.

## F-1. Critical 패턴 (즉시 fix)

| 패턴 | 예시 | 처리 |
|---|---|---|
| try/catch 없는 async load | mosaic loadFile (audit-11) | try/catch + 명시 alert |
| CSS class mismatch | pdf-stamp `.drag-over` vs 표준 `.dragover` (audit-11) | 통일 |
| 날짜·시간 역전 미검증 | severance 입사일>퇴사일 (audit-11) | `if (totalDays < 0)` alert |
| 누락된 핵심 페이지 | root /404.html (audit-11) | tools/404.html 복사 + path 조정 |
| innerHTML 사용자 입력 직접 | format-convert·watermark·merge·pdf-stamp (audit-8) | escapeHtml utility + ${esc(...)} |
| 라이브러리 매번 init | OCR createWorker (audit-9) | singleton 패턴 + cancel terminate |
| 데이터 mismatch | 9선 vs 13선 (audit-11) | counts.json source of truth |

## F-2. Medium 패턴 (plan)

| 패턴 | 예시 | 처리 |
|---|---|---|
| Multi-file 누적 size 가드 부재 | pdf-stamp·img-to-pdf | totalSize > 100MB confirm |
| 메모리 사전 추정 부재 | pdf-to-image DPI 600 · video/to-gif | frames × pixels × 4 추정 |
| parseTime 검증 비대칭 | to-gif vs trim | trim 패턴 통일 (nums >= 60 alert) |
| Multi-file invalid silent skip | watermark·merge | 1회 alert |
| input debounce 부재 | text 3종 | 150ms setTimeout |
| 신뢰 신호 누락 | /text/ privacy-box | 표준 카피 추가 |
| 검색 코드 중복 | /tools/ 인라인 vs site-chrome | #toolSearch 표준화 |

## F-3. Low 패턴 (선택)

| 패턴 | 예시 | 처리 |
|---|---|---|
| 0-byte 명시 분기 부재 | resize | compress·ocr 패턴 복사 |
| size 한계 일관성 | id-photo 50MB vs 다른 crop 100MB | 통일 |
| 출력 포맷 옵션 부재 | mosaic JPG 고정 | watermark 패턴 (JPG/PNG/WebP select) |
| progress bar 부재 | pdf-merge·edit | progressWrap + setProgress |
| 외부 시급·세율 stale | hourly 2025 최저시급 | 매년 갱신 (또는 자동 fetch) |
| 외부 링크 nofollow | privacy 외부 | rel="nofollow noopener" |
| drop title 톤 분산 | image 13 도구 3가지 변형 | 통일 |

---

# §G. 영구 한계 (작업 대상 X)

audit 시리즈에서 명확히 한계로 결정한 항목. **fix 시도 X** (시간 낭비).

| 항목 | 사유 | 대응 |
|---|---|---|
| bg-remove 진짜 cancel | ONNX Runtime Web 추론 중단 불가 | UX cancel (runSeq + 결과 무시) + reload 권장 alert |
| watermark drawPreview 빈 텍스트 alert | 슬라이더 input마다 호출 → alert 폭주 | applyBtn alert만 |
| format-convert downloadAllBtn 즉시 revoke | img-grid가 같은 blob URL thumbnail 참조 → 즉시 revoke 시 깨짐 | GC 의존 (또는 setTimeout 3s 후 revoke) |
| SharedArrayBuffer (ffmpeg-mt·core-mt) | GitHub Pages COOP/COEP 헤더 불가 | single-thread @ffmpeg/core 유지 |
| iOS Safari ~500MB heap | OS·브라우저 한계 | size 사전 체크로 회피 |
| in-app browser (카톡·인스타·페북) | WebView 한계 | site-chrome banner 안내 + 외부 브라우저 권장 |

---

# §H. 마무리

1. `node --check` 전 변경 JS syntax 검증
2. 서버 종료: `lsof -ti:8089 | xargs kill -9`
3. **commit·push은 사용자 명시 요청 시에만** (memory: `feedback_commit_policy.md`)
4. 작업 후 변경 요약 + 다음 단계 사용자 결정 대기

## 주의

- **Service Worker v18 → v19 transition**: 옛 캐시 활성 중 새 utility/escape 미발견. SW 캐시 해제 후 2회 reload 필요 시 사용자에게 알림.
- **agent에게 "Playwright 사용 금지" 명시** — main만 진행 (충돌 방지).
- **사용자 입력 가능 변수는 `escapeHtml`** 적용 (XSS 방어 표준).
- audit-NN 번호는 INDEX.md 마지막 +1.
- 파일명은 `audit-NN-<slug>.{md,html}` 패턴 유지.

---

# §I. 다음 회차 누적 방법

새 audit에서 발견된 패턴은 본 SKILL.md에 추가:

1. **§B 도구별 매트릭스**: 신규 도구·신규 케이스 행 추가
2. **§C 시나리오 카탈로그**: 신규 카테고리 추가
3. **§D Playwright 패턴**: 신규 검증 코드 패턴 추가
4. **§F 발견 패턴**: Critical/Medium/Low에 신규 행 추가
5. **§G 영구 한계**: 새로 결정한 한계 추가

audit 작성 시 본 skill 갱신도 같이. 다음 회차에서 더 빠른 검증 가능.

---

## 참고

- `history/audit/INDEX.md` — audit 시리즈 전체 순서
- `history/audit/audit_history.html` — 시각 history
- `history/audit/audit-03-tools-functional-test.html` — 풍부한 audit 형식 참고
- `history/audit/audit-11-final-test.html` — 직전 final test 예시
- `common/counts.json` — 도구 갯수 source of truth
- `.claude/commands/full-test.md` — slash entry (호환성)
