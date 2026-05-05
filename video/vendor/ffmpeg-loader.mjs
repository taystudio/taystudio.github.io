/**
 * ffmpeg.wasm 로더 — IndexedDB 캐시 + jsdelivr CDN.
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. 첫 호출: jsdelivr에서 ffmpeg wrapper(ESM), core.js, core.wasm fetch
 *  2. core.js + core.wasm(~32MB)을 IndexedDB에 Blob으로 캐시 → 다음 방문 즉시 사용
 *  3. ffmpeg 인스턴스를 module-level singleton으로 유지 → 같은 페이지 재사용 시 재로딩 X
 *
 * 제약:
 *  - GitHub Pages는 COOP/COEP 헤더 미지원 → SharedArrayBuffer 불가 → single-thread @ffmpeg/core 사용
 *  - 사용자 영상은 외부 전송 X. 다운로드되는 건 ffmpeg 바이너리 자체뿐.
 */

const FFMPEG_VERSION = '0.12.10';
const CORE_VERSION = '0.12.6';

// jsdelivr CDN — ffmpeg wrapper은 ESM dynamic import, core·worker는 직접 fetch + IndexedDB 캐시
const FFMPEG_ESM_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/+esm`;
const FFMPEG_ESM_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/esm/`;
const WORKER_JS_URL = `${FFMPEG_ESM_BASE}worker.js`;
const CORE_JS_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm/ffmpeg-core.js`;
const CORE_WASM_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm/ffmpeg-core.wasm`;

const DB_NAME = 'taystudio-video';
const STORE = 'wasm-cache';
const CACHE_KEY_WORKER = `worker-js-${FFMPEG_VERSION}`;
const CACHE_KEY_JS = `core-js-${CORE_VERSION}`;
const CACHE_KEY_WASM = `core-wasm-${CORE_VERSION}`;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (_) {
    return undefined;
  }
}

async function dbPut(key, blob) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).put(blob, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (_) {
    // 사파리 프라이빗 모드·할당량 초과 등 → 캐시 실패해도 동작은 계속
  }
}

async function fetchWithCache(url, cacheKey, onProgress, label) {
  const cached = await dbGet(cacheKey);
  if (cached instanceof Blob) {
    onProgress?.({ key: `cache:${label}`, current: 1, total: 1 });
    return cached;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
  const total = +res.headers.get('content-length') || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.({ key: `fetch:${label}`, current: received, total });
  }
  const blob = new Blob(chunks);
  await dbPut(cacheKey, blob);
  return blob;
}

let ffmpegInstance = null;
let loadingPromise = null;

/**
 * ffmpeg 인스턴스 로드 (singleton).
 * @param {(p: {key: string, current: number, total: number}) => void} onProgress
 * @returns {Promise<FFmpeg>}
 */
export async function loadFFmpeg(onProgress) {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    onProgress?.({ key: 'init', current: 0, total: 1 });
    // wrapper는 작아서(~50KB) 브라우저 HTTP 캐시에 맡김 — IndexedDB 오버헤드보다 단순
    const mod = await import(/* @vite-ignore */ FFMPEG_ESM_URL);
    const FFmpeg = mod.FFmpeg;

    // worker.js도 same-origin Blob으로 만들어 cross-origin Worker 차단 회피
    // (ffmpeg `+esm` 빌드는 import.meta.url이 잘못 resolved되어 자체적으로
    //  cross-origin worker URL을 만들기 때문에, 명시적 classWorkerURL 필수)
    const [workerJsBlob, coreJsBlob, coreWasmBlob] = await Promise.all([
      fetchWithCache(WORKER_JS_URL, CACHE_KEY_WORKER, onProgress, 'worker.js'),
      fetchWithCache(CORE_JS_URL, CACHE_KEY_JS, onProgress, 'ffmpeg-core.js'),
      fetchWithCache(CORE_WASM_URL, CACHE_KEY_WASM, onProgress, 'ffmpeg-core.wasm'),
    ]);

    // worker.js는 ESM module이라 안에 `from "./const.js"` 같은 상대 import가 있음.
    // Blob URL로 spawn하면 base가 없어 module resolve 실패 → silent hang.
    // 상대 경로를 jsdelivr 절대 URL로 substitute 후 Blob 생성.
    const workerJsText = await workerJsBlob.text();
    const workerJsFixed = workerJsText.replace(
      /from\s+(["'])\.\/([^"']+)\1/g,
      (_, q, path) => `from ${q}${FFMPEG_ESM_BASE}${path}${q}`,
    );
    const classWorkerURL = URL.createObjectURL(new Blob([workerJsFixed], { type: 'text/javascript' }));
    const coreURL = URL.createObjectURL(new Blob([coreJsBlob], { type: 'text/javascript' }));
    const wasmURL = URL.createObjectURL(new Blob([coreWasmBlob], { type: 'application/wasm' }));

    const ffmpeg = new FFmpeg();
    ffmpeg.on('progress', ({ progress }) => {
      // ffmpeg progress: 0~1 (작업 중일 때만)
      if (progress >= 0 && progress <= 1) {
        onProgress?.({ key: 'compute:transcode', current: progress, total: 1 });
      }
    });
    // ffmpeg stderr → 브라우저 콘솔. hang/실패 진단용.
    ffmpeg.on('log', ({ message }) => {
      console.log('[ffmpeg]', message);
    });
    await ffmpeg.load({ classWorkerURL, coreURL, wasmURL });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

/**
 * File·Blob → Uint8Array (ffmpeg.writeFile 입력용).
 */
export async function toUint8Array(blob) {
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}
