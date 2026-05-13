/**
 * Trim Video — ffmpeg.wasm based, all in browser.
 * Last verified: 2026-05-05
 *
 * Two modes:
 *  - copy (Fast): -ss <start> -to <end> -i input -c copy out.mp4
 *      → seek before -i skips input scan + cut at keyframes only
 *  - reencode (Precise): -i input -ss <start> -to <end> -c:v libx264 -preset ultrafast -crf 23 -c:a aac out.mp4
 *      → seek after -i decodes for frame-accurate cut, then re-encodes to H.264
 */

import { loadFFmpeg, toUint8Array, formatVideoError, terminateFFmpeg } from '/en/video/vendor/ffmpeg-loader.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const sourcePreviewWrap = document.getElementById('sourcePreviewWrap');
const sourceVideo = document.getElementById('sourceVideo');
const durationHint = document.getElementById('durationHint');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const pickStartBtn = document.getElementById('pickStart');
const pickEndBtn = document.getElementById('pickEnd');
const modeSel = document.getElementById('mode');
const trimBtn = document.getElementById('trimBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const resultVideo = document.getElementById('resultVideo');
const origSize = document.getElementById('origSize');
const trimSize = document.getElementById('trimSize');
const durText = document.getElementById('durText');
const modeText = document.getElementById('modeText');
const elapsedTime = document.getElementById('elapsedTime');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let sourceUrl = null;
let resultUrl = null;
let videoDuration = 0;
let runSeq = 0;
let activeRun = 0;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec - h * 3600 - m * 60;
  const sStr = s.toFixed(s % 1 ? 2 : 0).padStart(s < 10 ? 4 : 2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${sStr}`;
  return `${m}:${sStr}`;
}

/** "HH:MM:SS" / "MM:SS" / "SS(.frac)" → seconds. NaN if it can't parse. */
function parseTime(str) {
  if (str == null) return NaN;
  const s = String(str).trim();
  if (s === '') return NaN;
  const parts = s.split(':').map((p) => p.trim());
  if (parts.some((p) => p === '' || !/^\d+(\.\d+)?$/.test(p))) return NaN;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return NaN;
  if (nums.length === 1) return nums[0];
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
  return NaN;
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
  else if (label === 'compute:transcode') label = 'Processing video';
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
  trimBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';

  // Preview — auto-show source duration + helper for picking timestamps
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = URL.createObjectURL(file);
  sourceVideo.src = sourceUrl;
  sourcePreviewWrap.hidden = false;
  sourceVideo.addEventListener('loadedmetadata', onMetadata, { once: true });
}

function onMetadata() {
  videoDuration = sourceVideo.duration || 0;
  if (videoDuration > 0) {
    durationHint.hidden = false;
    durationHint.textContent = `Total length: ${fmtTime(videoDuration)}`;
    if (!startTimeInput.value) startTimeInput.value = '0';
    if (!endTimeInput.value) endTimeInput.value = fmtTime(videoDuration);
  }
}

function clearAll() {
  currentFile = null;
  if (sourceUrl) { URL.revokeObjectURL(sourceUrl); sourceUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = 'Drag a video file here, or click to choose';
  trimBtn.disabled = true;
  result.hidden = true;
  sourcePreviewWrap.hidden = true;
  durationHint.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  startTimeInput.value = '';
  endTimeInput.value = '';
  videoDuration = 0;
  sourceVideo.removeAttribute('src'); sourceVideo.load();
  resultVideo.removeAttribute('src'); resultVideo.load();
}

function buildArgs(inputName, outputName, start, end, mode) {
  // start/end are always numeric (seconds). ffmpeg accepts seconds directly.
  if (mode === 'copy') {
    // Putting -ss/-to before -i enables fast seek (skips input scan) + keyframe alignment
    return [
      '-ss', String(start),
      '-to', String(end),
      '-i', inputName,
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-movflags', '+faststart',
      outputName,
    ];
  }
  // Precise mode: -ss after -i decodes and lands on the exact frame
  return [
    '-i', inputName,
    '-ss', String(start),
    '-to', String(end),
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    outputName,
  ];
}

async function run() {
  if (!currentFile) return;

  const start = parseTime(startTimeInput.value);
  const end = parseTime(endTimeInput.value);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    alert('Invalid start or end time format.\nExamples: 0:30 / 1:23:45 / 90');
    return;
  }
  if (end <= start) {
    alert('End time must be greater than start time.');
    return;
  }
  if (videoDuration > 0 && start >= videoDuration) {
    alert(`Start time exceeds the video length (${fmtTime(videoDuration)}).`);
    return;
  }
  const effectiveEnd = videoDuration > 0 ? Math.min(end, videoDuration) : end;
  const mode = modeSel.value;

  trimBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = trimBtn.textContent;
  trimBtn.textContent = 'Processing...';
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

    progressText.textContent = mode === 'copy' ? 'Cutting segment...' : 'Re-encoding...';
    const args = buildArgs(inputName, outputName, start, effectiveEnd, mode);
    await ffmpeg.exec(args);

    const out = await ffmpeg.readFile(outputName);
    const blob = new Blob([out.buffer], { type: 'video/mp4' });
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    resultVideo.src = resultUrl;
    origSize.textContent = fmtBytes(currentFile.size);
    trimSize.textContent = fmtBytes(blob.size);
    durText.textContent = fmtTime(effectiveEnd - start);
    modeText.textContent = mode === 'copy' ? 'Fast' : 'Precise';

    const ms = Math.round(performance.now() - t0);
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';

    const baseName = (currentFile.name || 'video').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = baseName + '-trim.mp4';

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
      const { title, body } = formatVideoError(e, {
        toolName: 'Trim Video',
        toolHint: '• Verify the time inputs (start < end, within total length)\n• Try switching from Fast to Precise mode',
      });
      progressText.textContent = 'Failed: ' + title;
      progressFill.style.width = '0%';
      alert(title + '\n\n' + body);
    }
  } finally {
    cancelBtn.hidden = true;
    trimBtn.textContent = orig;
    trimBtn.disabled = !currentFile;
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

// "Use current playback position" buttons
pickStartBtn.addEventListener('click', () => {
  if (sourceVideo.src) startTimeInput.value = fmtTime(sourceVideo.currentTime);
});
pickEndBtn.addEventListener('click', () => {
  if (sourceVideo.src) endTimeInput.value = fmtTime(sourceVideo.currentTime);
});

// Actions
trimBtn.addEventListener('click', run);
cancelBtn.addEventListener('click', cancelRun);
clearBtn.addEventListener('click', clearAll);
