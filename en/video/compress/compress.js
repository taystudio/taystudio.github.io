/**
 * Compress Video — ffmpeg.wasm based, all in browser.
 * Last verified: 2026-05-05
 *
 * Flow:
 *  1. Pick video → ffmpeg.load (first run downloads ~32MB + caches in IndexedDB)
 *  2. writeFile to ffmpeg FS
 *  3. ffmpeg.exec(['-i', input, '-vf scale=...', '-crf', N, ...]) for H.264 encode
 *  4. readFile → Blob → preview + download link
 */

import { loadFFmpeg, toUint8Array, formatVideoError, terminateFFmpeg } from '/en/video/vendor/ffmpeg-loader.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const resolutionSel = document.getElementById('resolution');
const crfInput = document.getElementById('crf');
const crfValue = document.getElementById('crfValue');
const audioSel = document.getElementById('audio');
const compressBtn = document.getElementById('compressBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const resultVideo = document.getElementById('resultVideo');
const origSize = document.getElementById('origSize');
const compSize = document.getElementById('compSize');
const reduceRate = document.getElementById('reduceRate');
const dimText = document.getElementById('dimText');
const elapsedTime = document.getElementById('elapsedTime');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let resultUrl = null;
let runSeq = 0;
let activeRun = 0;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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
  else if (label === 'compute:transcode') label = 'Encoding video';
  else if (label === 'init') label = 'Initializing engine';
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function loadFile(file) {
  if (!file || !file.type.startsWith('video/')) {
    alert('Please select a video file.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 1000, 'Video')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  compressBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
}

function clearAll() {
  currentFile = null;
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = 'Drag a video file here, or click to choose';
  compressBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  resultVideo.removeAttribute('src');
  resultVideo.load();
}

function buildArgs(inputName, outputName) {
  const args = ['-i', inputName];
  // Resolution filter
  const resVal = parseInt(resolutionSel.value, 10);
  if (resVal > 0) {
    args.push('-vf', `scale=-2:${resVal}`);
  }
  // Video: H.264 + CRF
  args.push('-c:v', 'libx264');
  args.push('-preset', 'ultrafast'); // single-thread environment — keep preset fast
  args.push('-crf', crfInput.value);
  args.push('-pix_fmt', 'yuv420p'); // compatibility (Safari, QuickTime)
  // Audio
  switch (audioSel.value) {
    case 'copy':
      args.push('-c:a', 'copy');
      break;
    case 'none':
      args.push('-an');
      break;
    case 'aac':
    default:
      args.push('-c:a', 'aac', '-b:a', '128k');
      break;
  }
  args.push('-movflags', '+faststart'); // optimize for web playback
  args.push(outputName);
  return args;
}

async function run() {
  if (!currentFile) return;
  compressBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = compressBtn.textContent;
  compressBtn.textContent = 'Processing...';
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

    // Best-effort cleanup of leftovers
    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}

    const inputData = await toUint8Array(currentFile);
    await ffmpeg.writeFile(inputName, inputData);

    progressText.textContent = 'Encoding video — please wait...';
    const args = buildArgs(inputName, outputName);
    await ffmpeg.exec(args);

    const out = await ffmpeg.readFile(outputName);
    const blob = new Blob([out.buffer], { type: 'video/mp4' });
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    resultVideo.src = resultUrl;
    origSize.textContent = fmtBytes(currentFile.size);
    compSize.textContent = fmtBytes(blob.size);

    const reduce = ((1 - blob.size / currentFile.size) * 100);
    reduceRate.textContent = (reduce >= 0 ? '−' : '+') + Math.abs(reduce).toFixed(1) + '%';
    reduceRate.style.color = blob.size > currentFile.size ? '#dc2626' : '';

    const resVal = parseInt(resolutionSel.value, 10);
    dimText.textContent = resVal > 0 ? resVal + 'p' : 'Original';

    const ms = Math.round(performance.now() - t0);
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';

    const baseName = (currentFile.name || 'video').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = baseName + '-compressed.mp4';

    progressFill.style.width = '100%';
    progressWrap.setAttribute('aria-valuenow', '100');
    progressText.textContent = 'Done ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // ffmpeg FS cleanup (for the next job)
    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  } catch (e) {
    if (myRun !== activeRun) {
      progressText.textContent = 'Cancelled';
      progressFill.style.width = '0%';
    } else {
      const { title, body } = formatVideoError(e, { toolName: 'Compress Video' });
      progressText.textContent = 'Failed: ' + title;
      progressFill.style.width = '0%';
      alert(title + '\n\n' + body);
    }
  } finally {
    cancelBtn.hidden = true;
    compressBtn.textContent = orig;
    compressBtn.disabled = !currentFile;
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
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
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

// Options
crfInput.addEventListener('input', () => {
  crfValue.textContent = crfInput.value;
});

// Actions
compressBtn.addEventListener('click', run);
cancelBtn.addEventListener('click', cancelRun);
clearBtn.addEventListener('click', clearAll);
