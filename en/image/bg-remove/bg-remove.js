/**
 * Background Remover — @imgly/background-removal v1.7 (AGPL / Commercial).
 * Last verified: 2026-05-09
 *
 * Flow:
 *  1. Upload an image → original preview
 *  2. removeBackground(blob, { model: 'small', progress })
 *     → ONNX Runtime Web (WASM) downloads model + runtime from staticimgly.com (cached) and runs inference
 *  3. Result Blob → transparent PNG download link
 *
 * Notes:
 *  - ESM module — needs <script type="module">
 *  - First run: ~43MB+ model + WASM download (cached after)
 */

import { removeBackground } from '/image/vendor/imgly-bg-remove.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const removeBtn = document.getElementById('removeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const origImg = document.getElementById('origImg');
const resultImg = document.getElementById('resultImg');
const elapsedTime = document.getElementById('elapsedTime');
const dimText = document.getElementById('dimText');
const resultSize = document.getElementById('resultSize');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let origUrl = null;
let resultUrl = null;
// ONNX Runtime Web inference can't be truly aborted — UX-only cancel (ignore result on arrival)
let runSeq = 0;
let activeRun = 0;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function setProgress(key, current, total) {
  // Ignore progress updates from cancelled run (background inference keeps running but UI stays idle)
  if (activeRun === 0) return;
  progressWrap.hidden = false;
  let pct = 0;
  if (total > 0 && Number.isFinite(current)) {
    pct = Math.round((current / total) * 100);
  }
  progressFill.style.width = pct + '%';
  progressWrap.setAttribute('aria-valuenow', String(pct));
  // Examples: 'fetch:onnx/onnx_wasm_simd_threaded.jsep.mjs', 'fetch:isnet_quint8.onnx', 'compute:foreground'
  let label = key;
  if (typeof key === 'string') {
    if (key.startsWith('fetch:')) label = 'Downloading — ' + key.slice(6).split('/').pop();
    else if (key.startsWith('compute:')) label = 'Inference — ' + key.slice(8);
  }
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function loadFile(file) {
  // MIME-spoofing guard: check both type + extension (e.g. .mp4 renamed to .png with forged type)
  const imgExtRe = /\.(png|jpe?g|webp|bmp|gif|avif|tiff?)$/i;
  if (!file || !file.type.startsWith('image/') || !imgExtRe.test(file.name || '')) {
    alert('Please choose an image file (PNG, JPG, WebP, BMP, GIF, AVIF, TIFF).');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 30, 'Image')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  if (origUrl) URL.revokeObjectURL(origUrl);
  origUrl = URL.createObjectURL(file);
  origImg.src = origUrl;
  removeBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  progressWrap.setAttribute('aria-valuenow', '0');
}

async function run() {
  if (!currentFile) return;
  const myRun = ++runSeq;
  activeRun = myRun;
  removeBtn.disabled = true;
  cancelBtn.hidden = false;
  const orig = removeBtn.textContent;
  removeBtn.textContent = 'Processing...';
  setProgress('starting', 0, 1);
  const t0 = performance.now();

  // Capture original dimensions
  const tempImg = new Image();
  tempImg.src = origUrl;
  await new Promise((r) => { tempImg.onload = r; tempImg.onerror = r; });
  const origDim = tempImg.naturalWidth + '×' + tempImg.naturalHeight;

  try {
    const blob = await removeBackground(currentFile, {
      model: 'isnet_quint8', // small (~43MB int8 quantized)
      output: { format: 'image/png', quality: 0.9 },
      // publicPath — base URL for resources.json + model files.
      // staticimgly.com = official @imgly CDN (stable hosting for model · resources.json).
      // onnxruntime-web deps are hardcoded to esm.sh absolute URLs in vendor (publicPath-independent).
      publicPath: 'https://staticimgly.com/@imgly/background-removal/1.7.0/dist/',
      progress: setProgress
    });

    // Cancelled run completed — ignore (UX cancel)
    if (myRun !== activeRun) return;

    const ms = Math.round(performance.now() - t0);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    resultImg.src = resultUrl;
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';
    dimText.textContent = origDim;
    resultSize.textContent = fmtBytes(blob.size);

    const baseName = (currentFile.name || 'image').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = baseName + '-no-bg.png';

    progressFill.style.width = '100%';
    progressWrap.setAttribute('aria-valuenow', '100');
    progressText.textContent = 'Done ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    // Cancelled run threw — ignore
    if (myRun !== activeRun) return;
    progressText.textContent = 'Failed: ' + (e && e.message ? e.message : 'unknown error');
    progressFill.style.width = '0%';
    progressWrap.setAttribute('aria-valuenow', '0');
    const msg = (e && e.message) ? e.message : '';
    alert('Background removal failed: ' + msg + '\n\nTry:\n• Refresh and retry\n• Use a smaller image (under 1500px wide)\n• Use a recent browser (Chrome / Edge / Firefox)\n• Check your network (first run downloads the model)');
  } finally {
    if (myRun === activeRun) activeRun = 0;
    cancelBtn.hidden = true;
    removeBtn.textContent = orig;
    removeBtn.disabled = !currentFile;
  }
}

function cancelRun() {
  if (activeRun === 0) return;
  activeRun = 0;
  cancelBtn.hidden = true;
  progressText.textContent = 'Cancelled — background task finishes silently, result ignored. Reload the page if memory builds up.';
  removeBtn.disabled = !currentFile;
  alert('Cancelled — the background task keeps running to completion. Reloading the page is recommended for large files.');
}

function clearAll() {
  currentFile = null;
  if (origUrl) { URL.revokeObjectURL(origUrl); origUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = 'Drag an image here, or click to choose';
  origImg.removeAttribute('src');
  resultImg.removeAttribute('src');
  removeBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  progressWrap.setAttribute('aria-valuenow', '0');
}

fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) loadFile(f);
});
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return;
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadFile(f);
});
// Ctrl+V 이미지 붙여넣기
if (window.TayStudio && TayStudio.bindPasteImage) {
  TayStudio.bindPasteImage(files => { loadFile(files[0]); });
}
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

removeBtn.addEventListener('click', run);
cancelBtn.addEventListener('click', cancelRun);
clearBtn.addEventListener('click', clearAll);
