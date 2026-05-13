---
name: full-test
description: TAYSTUDIO 도구·페이지 풀 매트릭스 테스트 + UX 일관성 점검 + Critical 즉시 fix + audit 작성. 큰 변경 후·release 전·검수 라운드에 사용. 모든 카테고리 (image·pdf·video·text·calculator·meta page) 일괄 검증.
---

# Full Test 실행 절차

이 skill을 호출하면 사이트 전 도구·페이지를 매트릭스 + UX 관점에서 검증하고, Critical 결함은 즉시 fix하고, audit 보고서를 생성한다.

## 언제 호출하나

- 큰 기능 추가·여러 도구 동시 변경 후 회귀 검증
- 외부 push 전 release readiness 점검
- 사용자가 "final test" / "풀 테스트" / "all case" 요청

## 6단계 실행

### 1) 사용자에게 범위 확인 (AskUserQuestion)

```
- 핵심 매트릭스 (~200 케이스, 30분)
- 풀 매트릭스 (~600 케이스, 1시간)
- 극한만 (~100 케이스, 20분)

- UX 평가: 10 핵심 / 전체 25 / skip
```

### 2) 테스트 파일 생성

`.playwright-mcp/test-files/`에 다양한 확장자·사이즈 파일 생성. Python으로 빠르게:

```bash
mkdir -p .playwright-mcp/test-files
cd .playwright-mcp/test-files
# 0-byte
: > zero.png
: > zero.pdf

# 이미지 (Python 자체 생성 — Pillow 없어도 raw PNG/JPG/WebP/GIF/BMP base64)
python3 <<'PY'
import struct, zlib, base64
def make_png(w, h, fname):
    sig = b'\x89PNG\r\n\x1a\n'
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    raw = b''.join(b'\x00' + b'\xff\x00\x00' * w for _ in range(h))
    idat = zlib.compress(raw, 9)
    open(fname, 'wb').write(sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b''))
make_png(1, 1, 'tiny.png')
make_png(2048, 2048, 'large.png')
# base64 tiny.jpg / tiny.webp / tiny.gif / tiny.bmp ...
open('corrupted.png', 'wb').write(b'\x89PNG\r\n\x1a\n' + b'\x00' * 50)
open('not-image.png', 'w').write('text not image')
open('tiny.pdf', 'wb').write(b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n...')
open('corrupted.pdf', 'wb').write(b'%PDF-1.4\n' + b'\x00' * 50)
open('long.txt', 'w').write('Lorem ipsum ' * 1000)
PY

# 동영상·mp3 (ffmpeg 있으면)
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -f lavfi -i "testsrc=duration=1:size=320x240:rate=10" -pix_fmt yuv420p tiny.mp4 -y 2>/dev/null
  ffmpeg -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 1 -c:a libmp3lame tiny.mp3 -y 2>/dev/null
fi
```

### 3) 로컬 서버 실행

```bash
lsof -ti:8089 | xargs kill -9 2>/dev/null
python3 -m http.server 8089 > /tmp/srv.log 2>&1 &
```

### 4) Agent 4-6 병렬 spawn (정적 분석 + UX)

각 agent에 명확한 범위 + 매트릭스 명세 + 보고 format. **Playwright 사용 X** (main이 별도 진행).

**agent A — image 13 도구**: compress·resize·crop·id-photo·qr-scan·qr-gen·ocr·bg-remove·heic-to-jpg·format-convert·watermark·merge·mosaic

**agent B — pdf 6 + video 5**: pdf-{merge,split,edit,stamp,to-image,img-to-pdf} · video/{compress,trim,rotate,to-gif,to-mp3}

**agent C — text 3 + calculator 12+**: counter·sns-format·kbd-convert · salary·year-end·severance·comprehensive·hourly·bmi·cartax·insurance·parental-leave 등

**agent D — meta page**: 홈·About·Privacy·Terms·Hub (image·pdf·video·text·tools) · 404 · navigation

각 agent 보고 format:
```
## <도구>
매트릭스: 정상 ✅ / 한계 ✅ alert / invalid ✅ / 0-byte ⚠️ / corrupted ✅ / multi-file ✅
UX: 일관성 ★★★★☆ · 불편: ...
종합: A
```

마지막에 Critical·Medium·Low 분리 정리.

### 5) Critical 즉시 fix + Playwright spot-check

agent 결과에서 발견된 Critical 5-10건 즉시 main이 직접 fix. 핵심 fix는 Playwright로 spot-check:

```javascript
// Critical 시나리오 sample
mcp__plugin_playwright_playwright__browser_navigate('http://localhost:8089/<tool>/?test=1')
mcp__plugin_playwright_playwright__browser_evaluate(async () => {
  // SW 캐시 해제
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) await r.unregister();
  const keys = await caches.keys();
  for (const k of keys) await caches.delete(k);
})
mcp__plugin_playwright_playwright__browser_navigate('http://localhost:8089/<tool>/?test=2')  // 재로드
// XSS/corrupted/invalid 시뮬 (Object.defineProperty(file, 'size', ...) 가능)
mcp__plugin_playwright_playwright__browser_file_upload([...])
mcp__plugin_playwright_playwright__browser_evaluate(/* 검증 */)
```

Medium·Low는 audit에 plan으로 명시 (선택적으로 사용자 확인 후 다 fix).

### 6) audit 작성 + INDEX 갱신

`history/audit/audit-NN-<slug>.md` + `audit-NN-<slug>.html` 신규.

다음 INDEX.md에 1줄 추가 + 통과율 흐름 갱신.

audit 구조 (tools-test-report.html 형식):
- 종합 평가 (summary-grid + 등급 table)
- 매트릭스 결과 (카테고리별 등급 + 핵심 발견)
- Critical fix 5건 (문제 + fix + 검증)
- Medium·Low plan
- UX 개선 아이디어 3-5건
- 통과율 변화
- 변경 파일 list
- 다음 단계

## 마무리

1. `node --check` 전 변경 JS syntax 검증
2. 서버 종료: `lsof -ti:8089 | xargs kill -9`
3. commit 메시지: `feat: audit-NN — final test 매트릭스 + Critical N건 fix`
4. push origin main
5. 사용자에게 결과 보고 (PASS·발견·통과율·다음 단계)

## 주의

- **Service Worker v18 활성 중에는 새 utility/escape 함수 fallback 동작**. SW 캐시 해제 후 2회 reload 필요 시 사용자에게 알림.
- **agent에게 "Playwright 사용 금지" 명시** — main만 진행 (충돌 방지).
- **사용자 입력 가능 변수는 `escapeHtml`** 적용 (XSS 방어 표준).
- audit-NN 번호는 INDEX.md 마지막 +1.
- 파일명은 `audit-NN-<slug>.{md,html}` 패턴 유지.

## 참고

- `history/audit/INDEX.md` — 시리즈 전체 순서
- `history/audit/audit-03-tools-functional-test.html` — 풍부한 audit 형식 참고
- `history/audit/audit-11-final-test.html` — 직전 final test 예시
- `common/counts.json` — 도구 갯수 source of truth (수치 동기화)
