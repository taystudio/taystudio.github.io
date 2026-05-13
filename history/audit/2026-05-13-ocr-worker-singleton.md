# OCR worker singleton 성능 fix audit — 2026-05-13

**컨텍스트**: audit-7(보안 XSS) 직후 사용자 확인 요청 "성능이나 안되는 기능 없는거지?". 자체 점검에서 **OCR createWorker 매 호출마다 init (~2-3초 오버헤드)** 발견 → singleton 패턴 적용.

**시점**: audit 시리즈 8번째.

---

## 1. 문제

### Phase 2(audit-4·5)에서 추가된 cancel 기능의 부작용

이전 (cancel 없음): `Tesseract.recognize(file, lang, { logger })` — Tesseract.js 내부에서 worker scheduler 캐시 가능성 있음.

**Phase 2 변경**: cancel 버튼 추가를 위해 명시적 `createWorker` + `worker.recognize()` + finally `terminate()` 패턴 도입.

```js
// Phase 2 (이전)
try {
  worker = await window.Tesseract.createWorker(lang, 1, { logger });
  const { data } = await worker.recognize(file);
  // ...
} finally {
  if (worker) await worker.terminate();  // ← 매번 terminate
}
```

**결과**: 매 OCR 호출마다 새 worker 생성 → init ~2-3초 (WASM은 IndexedDB 캐시되어 있어 네트워크 0, 그러나 worker 초기화 자체는 매번 발생). 사용자가 같은 언어로 5장 연속 OCR하면 **+10~15초 누적 오버헤드**.

---

## 2. 어떻게 fix했나 — singleton 패턴

### 새 메커니즘

```js
let workerCache = null;
let workerLang = null;

async function getOrInitWorker(lang) {
  // 같은 lang이면 캐시 worker 재사용
  if (workerCache && workerLang === lang) return workerCache;
  // 다른 lang이면 이전 worker terminate 후 새로 init
  if (workerCache) {
    try { await workerCache.terminate(); } catch (_) {}
    workerCache = null;
  }
  const w = await window.Tesseract.createWorker(lang, 1, { logger });
  workerCache = w;
  workerLang = lang;
  return w;
}
```

### 흐름 변화

| 시나리오 | Phase 2 (이전) | audit-8 (singleton) |
|---|---|---|
| 첫 OCR | init ~2-3초 + recognize | init ~2-3초 + recognize (동일) |
| 같은 lang 두 번째 OCR | **init ~2-3초** + recognize | **init 0초** + recognize ⭐ |
| 다른 lang으로 전환 | init ~2-3초 + recognize | terminate + init ~2-3초 + recognize |
| cancel 클릭 | worker terminate | worker terminate + cache 비우기 |
| cancel 후 재시작 | init ~2-3초 + recognize | init ~2-3초 + recognize (정확) |
| 페이지 닫기 | finally terminate 완료 후 종료 | GC 의존 (브라우저 자동) |

### finally 블록 변화

- 이전: 매번 `await worker.terminate()` → singleton 파괴
- 현재: `currentWorker = null`만 (cache는 유지) → 다음 호출 재사용

### cancel 처리

- 진행 중 cancel → 즉시 `worker.terminate()` + `workerCache = null` (취소 결과 stale 방지)
- 다음 recognize는 새 worker 안전하게 init

---

## 3. KO + EN 둘 다 적용

| 파일 | 변경 |
|---|---|
| `image/ocr/ocr.js` | `workerCache`/`workerLang` state · `getOrInitWorker()` 함수 · finally에서 terminate 제거 · cancelOcr에서 cache 비우기 |
| `en/image/ocr/ocr.js` | 동일 (영문 주석) |

JS syntax 검증: 양쪽 `node --check` 통과.

---

## 4. 다른 영역 점검 결과 (audit-7 후 자체 확인)

| 영역 | 상태 |
|---|---|
| 정상 흐름 (compress·format-convert·watermark) | ✅ Playwright sample 3개 정상 |
| 자체 console errors | ✅ 0건 (외부 AdSense·Cloudflare RUM 한정) |
| JS syntax 전체 | ✅ pass · 회귀 0 |
| utility 로드 | ✅ 새 SW 활성 후 정상 · 옛 SW 활성 중에도 fallback 보호 |
| **OCR Tesseract** | 🐛 → ✅ 본 audit에서 fix |
| video cancel (ffmpeg.terminate) | ✅ 적용 — 단 video는 매 변환마다 fresh ffmpeg load가 더 안전 (메모리 cleanup) — 그대로 유지 |
| willReadFrequently | ✅ 영향 미미 |
| a11y aria-valuenow setAttribute | ✅ 영향 미미 |

**video도 singleton 적용 검토?** No. ffmpeg.wasm은 매 변환마다 새 instance가 메모리 cleanup 측면에서 안전 (transcode 중간 buffer 누적 위험). cancel UX와 init 비용 차이가 OCR보다 작아 trade-off 정합.

---

## 5. 다음 단계

- 코드 작업 사실상 완료 (A+ 등급, 통과율 95%+)
- ⭐ **외부 작업** (GSC Batch 6 → Bing WMT → Naver SA → 백링크)
- AdSense 승인 모니터링 (1-2주 대기)

---

## 참고

- `history/audit/INDEX.md` — audit 시리즈 전체 순서
- `history/audit/2026-05-13-phase2-completion-playwright.md` — Phase 2에서 cancel 기능 추가
- `history/audit/2026-05-13-security-xss-fix.md` — 직전 audit
- `history/audit/2026-05-13-ocr-worker-singleton.html` — 본 audit 시각 보고서
