/**
 * Video → MP3 — ffmpeg.wasm based, all in browser.
 * Last verified: 2026-05-05
 *
 * args:
 *   -i input -vn -c:a libmp3lame -b:a <bitrate>k out.mp3
 *
 *   -vn          = drop the video track (audio only)
 *   -c:a         = audio codec = LAME MP3
 *   -b:a Nk      = audio bitrate
 *
 * Copyright policy: see the inline .copyright-warning box on the page — personal use only.
 */

import { loadFFmpeg, toUint8Array, formatVideoError, terminateFFmpeg } from '/en/video/vendor/ffmpeg-loader.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const bitrateSel = document.getElementById('bitrate');
const extractBtn = document.getElementById('extractBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const resultAudio = document.getElementById('resultAudio');
const origSize = document.getElementById('origSize');
const mp3Size = document.getElementById('mp3Size');
const brText = document.getElementById('brText');
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
  else if (label === 'compute:transcode') label = 'Encoding MP3';
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
  extractBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
}

function clearAll() {
  currentFile = null;
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = 'Drag your own video here, or click to choose';
  extractBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  progressWrap.setAttribute('aria-valuenow', '0');
  resultAudio.removeAttribute('src');
  resultAudio.load();
}

function buildArgs(inputName, outputName, bitrate) {
  return [
    '-i', inputName,
    '-vn',
    '-c:a', 'libmp3lame',
    '-b:a', `${bitrate}k`,
    outputName,
  ];
}

async function run() {
  if (!currentFile) return;
  const bitrate = parseInt(bitrateSel.value, 10);

  extractBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = extractBtn.textContent;
  extractBtn.textContent = 'Processing...';
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
    const outputName = 'out.mp3';

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}

    const inputData = await toUint8Array(currentFile);
    await ffmpeg.writeFile(inputName, inputData);

    progressText.textContent = 'Encoding MP3...';
    await ffmpeg.exec(buildArgs(inputName, outputName, bitrate));

    const out = await ffmpeg.readFile(outputName);
    const blob = new Blob([out.buffer], { type: 'audio/mpeg' });
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    resultAudio.src = resultUrl;
    origSize.textContent = fmtBytes(currentFile.size);
    mp3Size.textContent = fmtBytes(blob.size);
    brText.textContent = bitrate + ' kbps';

    const ms = Math.round(performance.now() - t0);
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';

    const baseName = (currentFile.name || 'audio').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '.mp3') : baseName + '.mp3');

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
    progressWrap.setAttribute('aria-valuenow', '0');
    } else {
      const { title, body } = formatVideoError(e, {
        toolName: 'MP3 extraction',
        toolHint: '• Make sure the video has an audio track (silent videos can\'t be extracted)\n• For large videos, use Trim Video to cut a shorter segment first',
      });
      progressText.textContent = 'Failed: ' + title;
      progressFill.style.width = '0%';
      progressWrap.setAttribute('aria-valuenow', '0');
      alert(title + '\n\n' + body);
    }
  } finally {
    cancelBtn.hidden = true;
    extractBtn.textContent = orig;
    extractBtn.disabled = !currentFile;
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
  if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return;
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadFile(f);
});
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

// Actions
extractBtn.addEventListener('click', run);
cancelBtn.addEventListener('click', cancelRun);
clearBtn.addEventListener('click', clearAll);
