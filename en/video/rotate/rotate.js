/**
 * Rotate Video — ffmpeg.wasm based, all in browser.
 * Last verified: 2026-05-05
 *
 * Rotation option → ffmpeg -vf filter:
 *  - cw90  → transpose=1   (90° clockwise)
 *  - ccw90 → transpose=2   (90° counter-clockwise)
 *  - rot180→ transpose=2,transpose=2  (180°)
 *  - hflip → hflip          (horizontal flip, mirror)
 *  - vflip → vflip          (vertical flip)
 *
 * Video is re-encoded to H.264 (CRF 23 fixed = visually near-lossless).
 * Audio uses -c:a copy (lossless). If incompatible with the MP4 container, it auto-falls back to AAC.
 */

import { loadFFmpeg, toUint8Array, formatVideoError, terminateFFmpeg } from '/en/video/vendor/ffmpeg-loader.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const sourcePreviewWrap = document.getElementById('sourcePreviewWrap');
const sourceVideo = document.getElementById('sourceVideo');
const previewHint = document.getElementById('previewHint');
const rotateBtn = document.getElementById('rotateBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const resultVideo = document.getElementById('resultVideo');
const origSize = document.getElementById('origSize');
const outSize = document.getElementById('outSize');
const opText = document.getElementById('opText');
const elapsedTime = document.getElementById('elapsedTime');
const downloadBtn = document.getElementById('downloadBtn');

const ROT_CLASSES = ['rot-cw90', 'rot-ccw90', 'rot-rot180', 'rot-hflip', 'rot-vflip'];

let currentFile = null;
let sourceUrl = null;
let resultUrl = null;
let runSeq = 0;
let activeRun = 0;

const OP_LABEL = {
  cw90: '90° clockwise',
  ccw90: '90° counter-clockwise',
  rot180: '180° rotation',
  hflip: 'Horizontal flip',
  vflip: 'Vertical flip',
};

const OP_FILTER = {
  cw90: 'transpose=1',
  ccw90: 'transpose=2',
  rot180: 'transpose=2,transpose=2',
  hflip: 'hflip',
  vflip: 'vflip',
};

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function getRot() {
  const r = document.querySelector('input[name="rot"]:checked');
  return r ? r.value : 'cw90';
}

function setProgress(p) {
  progressWrap.hidden = false;
  let pct = 0;
  if (Number.isFinite(p.current) && p.total > 0) {
    pct = Math.round((p.current / p.total) * 100);
  }
  progressFill.style.width = pct + '%';
  progressWrap.setAttribute('aria-valuenow', String(pct));
  let label = p.key || '';
  if (label.startsWith('cache:')) label = 'From cache — ' + label.slice(6);
  else if (label.startsWith('fetch:')) label = 'Downloading — ' + label.slice(6);
  else if (label === 'compute:transcode') label = 'Rotating and encoding';
  else if (label === 'init') label = 'Initializing engine';
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function applyRotPreview() {
  const op = getRot();
  ROT_CLASSES.forEach((c) => sourcePreviewWrap.classList.remove(c));
  if (op !== 'none') sourcePreviewWrap.classList.add('rot-' + op);
  // "No change" leaves nothing to do — disable the action button
  rotateBtn.disabled = !currentFile || op === 'none';
}

function loadFile(file) {
  if (!file || !file.type.startsWith('video/')) {
    alert('Please select a video file.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 1000, 'Video')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  rotateBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';

  // Source preview + apply rotation transform immediately
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = URL.createObjectURL(file);
  sourceVideo.src = sourceUrl;
  sourcePreviewWrap.hidden = false;
  previewHint.hidden = false;
  applyRotPreview();
}

function clearAll() {
  currentFile = null;
  if (sourceUrl) { URL.revokeObjectURL(sourceUrl); sourceUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = 'Drag a video file here, or click to choose';
  rotateBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  sourceVideo.removeAttribute('src'); sourceVideo.load();
  sourcePreviewWrap.hidden = true;
  previewHint.hidden = true;
  ROT_CLASSES.forEach((c) => sourcePreviewWrap.classList.remove(c));
  resultVideo.removeAttribute('src');
  resultVideo.load();
}

function getScale() {
  const sel = document.getElementById('scale');
  return sel ? sel.value : 'orig';
}

function buildVfChain(op, scale) {
  const rot = OP_FILTER[op] || OP_FILTER.cw90;
  // Downscale before rotation = less memory during the rotation step (more efficient than after).
  // -2 = auto-align to even values (yuv420p compatibility); scale by short side.
  if (scale && scale !== 'orig') {
    return `scale=-2:${scale},${rot}`;
  }
  return rot;
}

function buildArgs(inputName, outputName, op, audioMode, scale) {
  const audioArgs = audioMode === 'aac'
    ? ['-c:a', 'aac', '-b:a', '128k']
    : ['-c:a', 'copy'];
  return [
    '-i', inputName,
    '-vf', buildVfChain(op, scale),
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    ...audioArgs,
    '-movflags', '+faststart',
    outputName,
  ];
}

async function tryExec(ffmpeg, inputName, outputName, op, scale) {
  // Force AAC re-encode — a "-c:a copy" first attempt + catch-and-retry pattern doubles mobile memory pressure.
  // Some .mov containers always fail the first attempt (audio codec is MP4-incompatible), so we just simplify
  // for stability. 128k AAC is essentially indistinguishable.
  await ffmpeg.exec(buildArgs(inputName, outputName, op, 'aac', scale));
  return 'aac';
}

async function run() {
  if (!currentFile) return;
  const op = getRot();

  rotateBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = rotateBtn.textContent;
  rotateBtn.textContent = 'Processing...';
  cancelBtn.hidden = false;
  const myRun = ++runSeq;
  activeRun = myRun;
  setProgress({ key: 'init', current: 0, total: 1 });
  const t0 = performance.now();

  try {
    const ffmpeg = await loadFFmpeg(setProgress);

    setProgress({ key: 'compute:transcode', current: 0, total: 1 });
    progressText.textContent = 'Preparing input file...';

    const inputName = 'in' + (currentFile.name.match(/\.[a-z0-9]+$/i)?.[0] || '.mp4');
    const outputName = 'out.mp4';

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}

    const inputData = await toUint8Array(currentFile);
    await ffmpeg.writeFile(inputName, inputData);

    progressText.textContent = 'Rotating and encoding...';
    await tryExec(ffmpeg, inputName, outputName, op, getScale());

    const out = await ffmpeg.readFile(outputName);
    const blob = new Blob([out.buffer], { type: 'video/mp4' });
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    resultVideo.src = resultUrl;
    origSize.textContent = fmtBytes(currentFile.size);
    outSize.textContent = fmtBytes(blob.size);
    opText.textContent = OP_LABEL[op] || op;

    const ms = Math.round(performance.now() - t0);
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';

    const baseName = (currentFile.name || 'video').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = baseName + '-rotated.mp4';

    progressFill.style.width = '100%';
    progressWrap.setAttribute('aria-valuenow', '100');
    progressText.textContent = 'Done ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  } catch (e) {
    if (myRun !== activeRun) {
      progressText.textContent = 'Cancelled';
      progressFill.style.width = '0%';
    } else {
      const { title, body } = formatVideoError(e, { toolName: 'Rotate Video' });
      progressText.textContent = 'Failed: ' + title;
      progressFill.style.width = '0%';
      alert(title + '\n\n' + body);
    }
  } finally {
    cancelBtn.hidden = true;
    rotateBtn.textContent = orig;
    rotateBtn.disabled = !currentFile;
    clearBtn.disabled = false;
  }
}

async function cancelRun() {
  if (!activeRun) return;
  activeRun = 0;
  await terminateFFmpeg();
  progressText.textContent = 'Cancelled';
  cancelBtn.hidden = true;
}

// File picker
fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) loadFile(f);
});

// Drag and drop
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault(); e.stopPropagation();
    dropZone.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault(); e.stopPropagation();
    dropZone.classList.remove('dragover');
  });
});
dropZone.addEventListener('drop', (e) => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadFile(f);
});
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

// Rotation option change → apply preview transform immediately
document.querySelectorAll('input[name="rot"]').forEach((r) => {
  r.addEventListener('change', applyRotPreview);
});

// Actions
rotateBtn.addEventListener('click', run);
cancelBtn.addEventListener('click', cancelRun);
clearBtn.addEventListener('click', clearAll);
