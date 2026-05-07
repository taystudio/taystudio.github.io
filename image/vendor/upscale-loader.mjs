/**
 * AI 이미지 업스케일러 로더 — TF.js + upscaler.js + esrgan(slim/thick) 동적 모델.
 * 최종 검증: 2026-05-06
 *
 * 동작:
 *  1. 첫 호출: jsdelivr CDN에서 TF.js + upscaler.js + 선택 모델 동적 import
 *  2. 모델·라이브러리는 브라우저 HTTP 캐시 → 두 번째부터 즉시
 *  3. variant × scale 조합별 Upscaler 인스턴스 캐시 (Map) — 사용자 옵션 변경 시 재로드 X
 *  4. 모바일 UA 감지 → patchSize 자동 축소 (메모리 안전)
 *
 * 모델 매트릭스:
 *   slim  + 2x  ≈ ~3MB  + ~3s  (모바일 ~5s)   기본 — 가장 빠름
 *   slim  + 4x  ≈ ~5MB  + ~6s  (모바일 ~12s)
 *   thick + 2x  ≈ ~9MB  + ~12s (모바일 ~25s)  고품질·느림
 *   thick + 4x  ≈ ~17MB + ~25s (모바일 ~60s)  최고 품질·매우 느림
 *
 * 사용자 이미지는 외부 전송 X — 추론은 브라우저 내 WebGL 텐서 연산.
 */

const TFJS_VERSION = '4.11.0';            // upscaler@1.0.0 peerDep ~4.11.0
const UPSCALER_VERSION = '1.0.0';

const TFJS_URL = `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@${TFJS_VERSION}/+esm`;
const UPSCALER_URL = `https://cdn.jsdelivr.net/npm/upscaler@${UPSCALER_VERSION}/+esm`;
const MODEL_URL = (variant, scale) =>
  `https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-${variant}@${UPSCALER_VERSION}/${scale}x/+esm`;

let tfjsLoaded = false;
let UpscalerClass = null;
let libsLoadingPromise = null;
const upscalerCache = new Map();           // `${variant}-${scale}` -> Upscaler instance
const modelLoadingPromises = new Map();    // 동시 로드 방지

const logs = [];
const LOG_MAX = 30;
function pushLog(msg) { logs.push(msg); if (logs.length > LOG_MAX) logs.shift(); }
export function getUpscaleLogs(n = 10) { return logs.slice(-n); }
export function getEnvSnapshot() {
  const lines = [];
  try {
    const m = performance.memory;
    if (m) lines.push(`JS heap: ${(m.usedJSHeapSize/1048576).toFixed(0)}MB / ${(m.jsHeapSizeLimit/1048576).toFixed(0)}MB`);
  } catch (_) {}
  lines.push('UA: ' + navigator.userAgent.slice(0, 120));
  return lines.join('\n');
}

async function ensureLibs(onProgress) {
  if (tfjsLoaded && UpscalerClass) return;
  if (libsLoadingPromise) return libsLoadingPromise;
  libsLoadingPromise = (async () => {
    if (!tfjsLoaded) {
      pushLog('importing tfjs...');
      onProgress?.({ key: 'fetch:tfjs', current: 0, total: 1 });
      await import(/* @vite-ignore */ TFJS_URL);
      onProgress?.({ key: 'fetch:tfjs', current: 1, total: 1 });
      tfjsLoaded = true;
    }
    if (!UpscalerClass) {
      pushLog('importing upscaler...');
      onProgress?.({ key: 'fetch:upscaler', current: 0, total: 1 });
      const mod = await import(/* @vite-ignore */ UPSCALER_URL);
      UpscalerClass = mod.default || mod.Upscaler;
      onProgress?.({ key: 'fetch:upscaler', current: 1, total: 1 });
    }
  })();
  return libsLoadingPromise;
}

/**
 * Upscaler 인스턴스 로드 (variant × scale 조합별 cache).
 * @param {{ variant: 'slim'|'thick', scale: 2|3|4|8 }} opts
 * @param {(p) => void} onProgress
 */
export async function loadUpscaler({ variant = 'slim', scale = 2 } = {}, onProgress) {
  const key = `${variant}-${scale}`;
  if (upscalerCache.has(key)) return upscalerCache.get(key);
  if (modelLoadingPromises.has(key)) return modelLoadingPromises.get(key);

  const promise = (async () => {
    await ensureLibs(onProgress);
    pushLog(`importing model: esrgan-${variant} ${scale}x`);
    onProgress?.({ key: 'fetch:model', current: 0, total: 1 });
    const modelMod = await import(/* @vite-ignore */ MODEL_URL(variant, scale));
    const model = modelMod.default || modelMod;
    onProgress?.({ key: 'fetch:model', current: 1, total: 1 });
    const inst = new UpscalerClass({ model });
    upscalerCache.set(key, inst);
    return inst;
  })();
  modelLoadingPromises.set(key, promise);
  try { return await promise; }
  finally { modelLoadingPromises.delete(key); }
}

/**
 * 이미지 업스케일.
 * @param {HTMLImageElement|HTMLCanvasElement|ImageData|string} input
 * @param {{
 *   variant?: 'slim'|'thick',
 *   scale?: 2|3|4|8,
 *   patchSize?: number,         // 미지정 시 모바일 128 / 데스크톱 256 자동
 *   padding?: number,
 *   onProgress?: (p: {key: string, current: number, total: number}) => void
 * }} options
 * @returns {Promise<string>} base64 dataURL (PNG)
 */
export async function upscale(input, options = {}) {
  const { variant = 'slim', scale = 2, patchSize, padding = 4, onProgress } = options;
  const inst = await loadUpscaler({ variant, scale }, onProgress);
  // patchSize는 작게 = patch 수 ↑ + patch 사이 자연 yield → UI freeze 줄어듦.
  // 큰 값(256+)은 작은 사진을 통째로 처리해 메인 스레드 1~2초 점령 → 브라우저 버벅.
  // upscaler.js 권장값 64. 모바일도 동일 (메모리 안전 + UI 부드러움).
  const ps = patchSize || 64;
  pushLog(`upscale start (model=${variant}-${scale}x, patch=${ps}, pad=${padding})`);
  const result = await inst.upscale(input, {
    patchSize: ps,
    padding,
    progress: (rate) => {
      onProgress?.({ key: 'compute', current: rate, total: 1 });
      // patch 사이 microtask yield — UI 업데이트 + 사용자 입력 처리 기회 보장
      return new Promise((r) => setTimeout(r, 0));
    },
    output: 'base64',
  });
  pushLog('upscale done');
  return result;
}

/** 에러 메시지 분기 — 메모리·네트워크 케이스 분리. */
export function formatUpscaleError(error, { includeDiagnostics = true } = {}) {
  const msg = (error && error.message) ? error.message : String(error);
  const isMemoryError = /out of memory|allocation failed|cannot enlarge memory|memory access out of bounds|texture|webgl/i.test(msg);
  const isNetworkError = /failed to fetch|network|cors|err_/i.test(msg);

  let title, body;
  if (isMemoryError) {
    title = '메모리 한계 — 사진이 너무 큽니다';
    body =
      '브라우저 메모리·WebGL 텍스처 한계 초과.\n\n해결:\n' +
      '• 빠름(slim) + 2x 옵션으로 변경\n' +
      '• 입력 사진을 가로 1500px 이하로 미리 리사이즈\n' +
      '• 데스크톱 Chrome·Edge에서 재시도';
  } else if (isNetworkError) {
    title = '네트워크 오류 — 모델·라이브러리 다운로드 실패';
    body =
      '첫 사용 시 jsdelivr CDN에서 라이브러리·모델 다운로드 필요.\n\n해결:\n' +
      '• Wi-Fi 환경에서 재시도\n' +
      '• 광고 차단·VPN 일시 해제 (CDN 차단 가능)\n' +
      '• 페이지 새로고침';
  } else {
    title = '업스케일 실패: ' + msg;
    body =
      '해결 시도:\n' +
      '• 페이지 새로고침\n' +
      '• 빠름(slim) + 2x 옵션으로 변경\n' +
      '• 더 작은 사진으로 재시도';
  }

  if (includeDiagnostics) {
    const recent = getUpscaleLogs(8);
    if (recent.length > 0) body += '\n\n[upscale 마지막 ' + recent.length + '줄]\n' + recent.join('\n');
    body += '\n\n[환경]\n' + getEnvSnapshot();
  }
  return { title, body };
}
