/**
 * ffmpeg.wasm loader — IndexedDB cache + jsdelivr CDN.
 * Last verified: 2026-05-05
 *
 * Behavior:
 *  1. First call: fetch ffmpeg wrapper (ESM), core.js, core.wasm from jsdelivr
 *  2. Cache core.js + core.wasm (~32MB) in IndexedDB as Blob → instant startup on next visit
 *  3. Keep ffmpeg instance as module-level singleton → no reload on same page
 *
 * Constraints:
 *  - GitHub Pages cannot set COOP/COEP headers → no SharedArrayBuffer → single-thread @ffmpeg/core
 *  - User videos never leave the browser. Only the ffmpeg binary itself is downloaded.
 */

const FFMPEG_VERSION = '0.12.10';
const CORE_VERSION = '0.12.6';

// jsdelivr CDN — ffmpeg wrapper is ESM dynamic import; core/worker fetched directly + IndexedDB cached
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
    // Safari private mode, quota exceeded, etc — keep going if cache fails
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

// ffmpeg log ring buffer — used to attach the last N lines to alerts on mobile
// where users can't easily see the console. Helps diagnose memory/codec/permission issues.
const ffmpegLogs = [];
const FFMPEG_LOG_MAX = 30;
function pushFfmpegLog(message) {
  ffmpegLogs.push(message);
  if (ffmpegLogs.length > FFMPEG_LOG_MAX) ffmpegLogs.shift();
}
export function getFfmpegLogs(n = 10) {
  return ffmpegLogs.slice(-n);
}
export function clearFfmpegLogs() {
  ffmpegLogs.length = 0;
}
// Environment snapshot (memory/UA) — attached to alerts so mobile users can share accurate diagnostics.
export function getEnvSnapshot() {
  const lines = [];
  try {
    const m = performance.memory;
    if (m) {
      const used = (m.usedJSHeapSize / 1048576).toFixed(0);
      const limit = (m.jsHeapSizeLimit / 1048576).toFixed(0);
      lines.push(`JS heap: ${used}MB / ${limit}MB`);
    }
  } catch (_) {}
  lines.push('UA: ' + navigator.userAgent.slice(0, 120));
  return lines.join('\n');
}

/**
 * Load ffmpeg instance (singleton).
 * @param {(p: {key: string, current: number, total: number}) => void} onProgress
 * @returns {Promise<FFmpeg>}
 */
export async function loadFFmpeg(onProgress) {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    onProgress?.({ key: 'init', current: 0, total: 1 });
    // Wrapper is small (~50KB) — leave it to the browser HTTP cache (simpler than IndexedDB)
    const mod = await import(/* @vite-ignore */ FFMPEG_ESM_URL);
    const FFmpeg = mod.FFmpeg;

    // worker.js is also wrapped as a same-origin Blob to bypass cross-origin Worker blocks.
    // (The ffmpeg `+esm` build resolves import.meta.url incorrectly and constructs a
    //  cross-origin worker URL by itself — explicit classWorkerURL is required.)
    const [workerJsBlob, coreJsBlob, coreWasmBlob] = await Promise.all([
      fetchWithCache(WORKER_JS_URL, CACHE_KEY_WORKER, onProgress, 'worker.js'),
      fetchWithCache(CORE_JS_URL, CACHE_KEY_JS, onProgress, 'ffmpeg-core.js'),
      fetchWithCache(CORE_WASM_URL, CACHE_KEY_WASM, onProgress, 'ffmpeg-core.wasm'),
    ]);

    // worker.js is an ESM module containing relative imports like `from "./const.js"`.
    // Spawning via Blob URL leaves no base, so module resolution fails silently (hang).
    // Substitute relative paths with absolute jsdelivr URLs before creating the Blob.
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
      // ffmpeg progress: 0~1 (only while a job is running)
      if (progress >= 0 && progress <= 1) {
        onProgress?.({ key: 'compute:transcode', current: progress, total: 1 });
      }
    });
    // ffmpeg stderr → browser console + ring buffer (used in mobile alerts)
    ffmpeg.on('log', ({ message }) => {
      console.log('[ffmpeg]', message);
      pushFfmpegLog(message);
    });
    await ffmpeg.load({ classWorkerURL, coreURL, wasmURL });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

/**
 * Terminate ffmpeg worker + reset singleton — for user cancellation.
 * Next loadFFmpeg builds a new instance; core/wasm/worker are still IndexedDB-cached,
 * so no network re-download — only module instantiation + WASM init.
 */
export async function terminateFFmpeg() {
  const inst = ffmpegInstance;
  ffmpegInstance = null;
  loadingPromise = null;
  if (inst && typeof inst.terminate === 'function') {
    try { inst.terminate(); } catch (_) {}
  }
}

/**
 * File/Blob → Uint8Array (for ffmpeg.writeFile).
 */
export async function toUint8Array(blob) {
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Read the selected video into memory immediately on pick.
 *
 * Reason: mobile browsers (Safari, Chrome iOS, Android) have **short-lived file permissions**.
 * If the user waits over a minute between picking and pressing the action button, the file
 * handle becomes invalid → NotReadableError. Calling arrayBuffer() right after pick reads
 * while the permission is still alive. Also forces an immediate download of cloud-only files
 * (iCloud, Google Photos) so the user notices early instead of failing at submit time.
 */
export async function readVideoFile(file) {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Shared error formatter for video tools.
 * Branches on NotReadableError (iCloud/Google Photos/expired file permission) — common on mobile.
 *
 * @param {Error|any} error
 * @param {{toolName?: string, toolHint?: string}} options
 * @returns {{title: string, body: string}}
 */
export function formatVideoError(error, { toolName = 'Video processing', toolHint = '', includeDiagnostics = true } = {}) {
  const msg = (error && error.message) ? error.message : String(error);
  const isReadError = error && (
    error.name === 'NotReadableError' ||
    /could not be read|requested file could not|not allowed|file could not be opened/i.test(msg)
  );
  // Memory limit pattern detection
  const isMemoryError = /out of memory|allocation failed|cannot enlarge memory|memory access out of bounds|RangeError/i.test(msg);

  let title, body;
  if (isReadError) {
    title = 'Could not read the video file';
    body =
      'Most common causes:\n' +
      '• The video lives in iCloud / Google Photos (no real file on the device, cloud only)\n' +
      '• File permission expired after picking\n\n' +
      'Fix:\n' +
      '• Download the video to your device first (in the Photos app)\n' +
      '• Press the action button right after picking the file\n' +
      '• Try a desktop browser (Chrome, Edge, Firefox)';
  } else if (isMemoryError) {
    title = 'Memory limit — the video is too large';
    body =
      'The browser ran out of memory before finishing.\n\n' +
      'Fix:\n' +
      '• Lower the output resolution to 480p or 720p\n' +
      '• Use the Trim tool to cut the video to under 1 minute, then try again\n' +
      '• Try desktop Chrome / Edge';
  } else {
    title = toolName + ' failed: ' + msg;
    body =
      'Try:\n' +
      '• Reload the page and retry\n' +
      '• A smaller video or 720p or below\n' +
      (toolHint ? toolHint + '\n' : '') +
      '• Latest desktop Chrome / Edge / Firefox\n' +
      '• Check your network (the first run downloads ~32MB of ffmpeg)';
  }

  // Attach diagnostics so mobile users (who can't see the console) can share useful info.
  if (includeDiagnostics) {
    const logs = getFfmpegLogs(8);
    if (logs.length > 0) {
      body += '\n\n[ffmpeg last ' + logs.length + ' lines]\n' + logs.join('\n');
    }
    body += '\n\n[Environment]\n' + getEnvSnapshot();
  }

  return { title, body };
}
