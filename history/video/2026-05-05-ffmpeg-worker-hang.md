# video/ ffmpeg.wasm cross-origin worker hang 트러블슈팅 (2026-05-05)

> **상태**: wrapper fix 적용 완료, **부분 검증** — 사용자 콘솔에서 `[ffmpeg]` 로그 정상 출력 확인 = worker spawn·load 단계 통과. **남은 검증** = ffmpeg.exec 끝까지 완료 → 결과 미리보기·다운로드 정상 동작. 5도구(compress·trim·rotate·to-gif·to-mp3) 전부 확인 후 §9.1 "결정 완료"로 격상.

## 증상 시퀀스

1. **1차 에러**: `Failed to construct 'Worker': Script at 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/worker.js' cannot be accessed from origin 'http://127.0.0.1:5501'`
2. **wrapper에 worker.js fetch + Blob URL + `classWorkerURL` 옵션 추가 후 → 2차 증상**: 진행률 100% 도달, 버튼 "처리 중..." 그대로, 다운로드 안 됨, 콘솔 `[ffmpeg]` 로그 0개 (= ffmpeg.load() 자체가 promise 안 끝남)

## 근본 원인 — 두 단계

### 원인 A — `+esm` 빌드의 worker URL resolution

`@ffmpeg/ffmpeg@0.12.10/+esm` 빌드의 `import.meta.url`이 `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm`. 라이브러리 내부의 `new Worker(new URL('./worker.js', import.meta.url))`가 `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/worker.js`로 잘못 resolved되는데:
- 이 URL은 **404** (실제 위치는 `dist/esm/worker.js`)
- 추가로 **cross-origin Worker 차단** (브라우저 보안 정책 — same-origin 또는 Blob URL만 Worker 가능)

**fix**: `dist/esm/worker.js`(200 OK) fetch → IndexedDB 캐시 → same-origin Blob URL → `ffmpeg.load({ classWorkerURL })` 명시 전달.

### 원인 B — ESM worker의 상대 경로 import

`dist/esm/worker.js`가 `{ type: 'module' }` worker로 spawn되는데, 첫 줄에:

```js
import { CORE_URL, FFMessageType } from "./const.js";
import { ERROR_UNKNOWN_MESSAGE_TYPE, ... } from "./errors.js";
```

Blob URL로 spawn된 module worker는 base URL이 `blob:http://...`. `./const.js`가 어디로 resolve돼야 하는지 알 수 없음 → 모듈 로딩 silent fail. 워커 컨텍스트 에러는 메인 콘솔에 안 찍히고 promise 그대로 pending → ffmpeg.load() 영원히 hang.

**fix**: worker.js fetch 후 `text()`로 받아 정규식으로 상대 import를 jsdelivr 절대 URL로 substitute:

```js
const workerJsFixed = workerJsText.replace(
  /from\s+(["'])\.\/([^"']+)\1/g,
  (_, q, path) => `from ${q}${FFMPEG_ESM_BASE}${path}${q}`,
);
```

const.js·errors.js 둘 다 자체 import 없는 pure exports라 jsdelivr 절대 URL로 올라가면 그대로 동작 (jsdelivr CORS 응답 OK).

## 적용된 wrapper 변경 (`video/vendor/ffmpeg-loader.mjs`)

1. `WORKER_JS_URL` = `${FFMPEG_ESM_BASE}worker.js` 추가
2. `CACHE_KEY_WORKER` = `worker-js-${FFMPEG_VERSION}` 추가
3. `Promise.all` fetch에 worker.js 포함
4. worker.js text → 정규식 substitute → Blob 생성
5. `ffmpeg.load({ classWorkerURL, coreURL, wasmURL })` — classWorkerURL 명시
6. `ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message))` — 디버깅용 stderr → 메인 콘솔

## 검증 가설 — 다음 세션 1순위

페이지 강제 새로고침 (Cmd+Shift+R) → trim·compress 등 시도 → 콘솔 `[ffmpeg]` 로그 다수 + 정상 처리되면 fix 완성.

만약 **로그 여전히 0개**면 추가 원인 후보:
- 워커 안의 dynamic `import(coreURL)` 단계에서 Blob URL ESM import 실패 가능성. 그 경우 coreURL은 jsdelivr URL 직접 전달로 fallback (캐시 의미 약화 트레이드오프 발생)
- 또는 `dist/esm`을 통째로 vendoring하는 방향으로 전환 (worker.js + const.js + errors.js + ffmpeg-core.js 자산 모두 same-origin)

## 영향 범위

wrapper 1개 = 5개 도구(compress·trim·rotate·to-gif·to-mp3) 전부 동시 fix. plan §0.2 "정적 한계까지" 정신 + wrapper 재사용 검증 패턴 그대로.

## SW·캐시 영향

- `tools/sw.js` 버전 X (vendor 자산은 STATIC_ASSETS 미포함, image/ 패턴 동일)
- 기존 IndexedDB(`taystudio-video`) core.js·wasm 캐시 그대로 유지, worker.js 캐시 새로 추가됨
- 기존 사용자(없지만 가정) = worker.js만 새로 fetch + 즉시 동작

## 학습 포인트 (다음 카테고리 진입 시 활용)

1. `+esm` jsdelivr 빌드 + Worker 조합은 위험 — `import.meta.url` resolution 가정 X
2. ESM module worker를 Blob URL로 spawn할 때 안에 상대 import 있으면 silent hang. 빌드 산출물의 import 그래프를 사전 확인 필수
3. ffmpeg `+esm`은 `classWorkerURL` 옵션으로 명시 전달이 안전. core URL도 같은 패턴
4. audio 카테고리 진입 시 lamejs 등도 비슷한 패턴 점검 — WebAudio 0KB 본체는 무관, encoder lib만 검증

## 관련 plan 항목

- §0.2 GitHub Pages 정적 한계 (백엔드 fallback 신호 미발견 유지)
- §5.5.2 video Tier 1 5선 (구조 그대로, wrapper 1개 수정으로 5도구 전체 수혜)
- §9.1 결정 기록 누적 대상
- §9.4 다음 세션 진입 후보 — "video 도구 로컬 실기기 검증" 실제 진입한 첫 라운드
