/**
 * Video → GIF — ffmpeg.wasm based, all in browser.
 * Last verified: 2026-05-05
 *
 * palettegen + paletteuse in a single call (using split):
 *   -vf "fps=N,scale=W:-2:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"
 *
 *   1. Adjust fps + rescale → split into two branches
 *   2. One branch runs palettegen to derive an optimal 256-color palette from the clip
 *   3. The other applies paletteuse with that palette + dithering
 *
 * Done in a single pass — no intermediate palette.png needed.
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
const fpsSel = document.getElementById('fps');
const widthSel = document.getElementById('width');
const convertBtn = document.getElementById('convertBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const resultImg = document.getElementById('resultImg');
const origSize = document.getElementById('origSize');
const gifSize = document.getElementById('gifSize');
const durText = document.getElementById('durText');
const optText = document.getElementById('optText');
const elapsedTime = document.getElementById('elapsedTime');

// On mobile, default width down to 320 — avoid single-thread WASM memory limits
(function applyMobileDefaults() {
  if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
  if (widthSel && widthSel.value === '480') {
    widthSel.value = '320';
  }
})();
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

function parseTime(str) {
  if (str == null) return NaN;
  const s = String(str).trim();
  if (s === '') return NaN;
  const parts = s.split(':').map((p) => p.trim());
  if (parts.some((p) => p === '' || !/^\d+(\.\d+)?$/.test(p))) return NaN;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return NaN;
  // Minutes/seconds must be < 60 (trim pattern): reject e.g. "1:90"
  if (nums.length === 2 && nums[1] >= 60) return NaN;
  if (nums.length === 3 && (nums[1] >= 60 || nums[2] >= 60)) return NaN;
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
  else if (label === 'compute:transcode') label = 'Generating GIF';
  else if (label === 'init') label = 'Initializing engine';
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function loadFile(file) {
  if (!file || !file.type.startsWith('video/')) {
    alert('Please select a video file.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 500, 'Video')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  convertBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';

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
    durationHint.textContent = `Total length: ${fmtTime(videoDuration)} — keep the GIF segment ≤ 10 seconds.`;
    if (!startTimeInput.value) startTimeInput.value = '0';
    if (!endTimeInput.value) endTimeInput.value = fmtTime(Math.min(5, videoDuration));
  }
}

function clearAll() {
  currentFile = null;
  if (sourceUrl) { URL.revokeObjectURL(sourceUrl); sourceUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = 'Drag a video file here, or click to choose';
  convertBtn.disabled = true;
  result.hidden = true;
  sourcePreviewWrap.hidden = true;
  durationHint.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  progressWrap.setAttribute('aria-valuenow', '0');
  startTimeInput.value = '';
  endTimeInput.value = '';
  videoDuration = 0;
  sourceVideo.removeAttribute('src'); sourceVideo.load();
  resultImg.removeAttribute('src');
}

function buildArgs(inputName, outputName, start, end, fps, width) {
  const widthFilter = width > 0 ? `scale=${width}:-2:flags=lanczos,` : '';
  const filter =
    `fps=${fps},` +
    widthFilter +
    `split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5`;
  // -ss/-to before -i = fast seek (less decoding)
  return [
    '-ss', String(start),
    '-to', String(end),
    '-i', inputName,
    '-vf', filter,
    '-loop', '0',
    outputName,
  ];
}

async function run() {
  if (!currentFile) return;

  const start = parseTime(startTimeInput.value);
  const end = parseTime(endTimeInput.value);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    alert('Invalid start or end time format.\nExamples: 0:30 / 1:23:45 / 30\nMinutes and seconds must be less than 60.');
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
  const segLen = effectiveEnd - start;
  if (segLen > 30) {
    if (!confirm(`The selected segment is ${segLen.toFixed(0)} seconds long. The GIF could become very large (50MB+).\nContinue?`)) {
      return;
    }
  }

  const fps = parseInt(fpsSel.value, 10);
  const width = parseInt(widthSel.value, 10);

  // Memory pre-estimate: duration × fps × (w × h × 4) ≈ decoder frame buffer footprint
  // Encoded GIF is smaller, but runtime memory hits the single-thread WASM ceiling first.
  const srcW = sourceVideo.videoWidth || 0;
  const srcH = sourceVideo.videoHeight || 0;
  if (srcW > 0 && srcH > 0) {
    const outW = width > 0 ? width : srcW;
    const outH = width > 0 ? Math.round(srcH * (outW / srcW)) : srcH;
    const frames = Math.ceil(segLen * fps);
    const bytes = frames * outW * outH * 4; // RGBA frame accumulation estimate
    const mb = bytes / (1024 * 1024);
    // Single-thread ffmpeg.wasm memory ceiling ~2GB. Hard-warn above 600MB.
    if (mb > 600) {
      const msg = `Estimated processing memory ~${mb.toFixed(0)} MB — conversion is likely to fail.\n` +
        `(${segLen.toFixed(1)}s × ${fps}fps × ${outW}×${outH})\n\n` +
        `Fix: shorten the segment (≤10s) or lower the width to 320 / 240.\n\nContinue anyway?`;
      if (!confirm(msg)) return;
    } else if (mb > 250) {
      const msg = `Estimated processing memory ~${mb.toFixed(0)} MB — may fail on mobile or low-end devices.\n` +
        `Consider a shorter segment or lower resolution.\n\nContinue?`;
      if (!confirm(msg)) return;
    }
  }

  convertBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = convertBtn.textContent;
  convertBtn.textContent = 'Processing...';
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
    const outputName = 'out.gif';

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}

    const inputData = await toUint8Array(currentFile);
    await ffmpeg.writeFile(inputName, inputData);

    progressText.textContent = 'Generating palette + GIF...';
    const args = buildArgs(inputName, outputName, start, effectiveEnd, fps, width);
    await ffmpeg.exec(args);

    const out = await ffmpeg.readFile(outputName);
    const blob = new Blob([out.buffer], { type: 'image/gif' });
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    resultImg.src = resultUrl;
    origSize.textContent = fmtBytes(currentFile.size);
    gifSize.textContent = fmtBytes(blob.size);
    durText.textContent = fmtTime(segLen);
    optText.textContent = `${width > 0 ? width + 'px' : 'original'} · ${fps}fps`;

    const ms = Math.round(performance.now() - t0);
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';

    const baseName = (currentFile.name || 'video').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = baseName + '.gif';

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
        toolName: 'GIF conversion',
        toolHint: '• Try a shorter segment (≤ 5 seconds) or width 480px or lower\n• Verify the time inputs (start < end, within total length)',
      });
      progressText.textContent = 'Failed: ' + title;
      progressFill.style.width = '0%';
      progressWrap.setAttribute('aria-valuenow', '0');
      alert(title + '\n\n' + body);
    }
  } finally {
    cancelBtn.hidden = true;
    convertBtn.textContent = orig;
    convertBtn.disabled = !currentFile;
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
convertBtn.addEventListener('click', run);
cancelBtn.addEventListener('click', cancelRun);
clearBtn.addEventListener('click', clearAll);
