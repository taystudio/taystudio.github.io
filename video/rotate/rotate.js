/**
 * 동영상 회전 — ffmpeg.wasm 기반, 브라우저 안에서만 처리.
 * 최종 검증: 2026-05-05
 *
 * 회전 옵션 → ffmpeg -vf 필터:
 *  - cw90  → transpose=1   (90° 시계방향)
 *  - ccw90 → transpose=2   (90° 반시계방향)
 *  - rot180→ transpose=2,transpose=2  (180°)
 *  - hflip → hflip          (좌우 반전, 거울)
 *  - vflip → vflip          (상하 반전)
 *
 * 비디오는 H.264 재인코딩 (CRF 23 고정 = 시각 손실 거의 없음).
 * 오디오는 -c:a copy (무손실, 음질 그대로). MP4 컨테이너 호환 안 되는 경우 자동 AAC fallback.
 */

import { loadFFmpeg, toUint8Array, formatVideoError } from '/video/vendor/ffmpeg-loader.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const sourcePreviewWrap = document.getElementById('sourcePreviewWrap');
const sourceVideo = document.getElementById('sourceVideo');
const previewHint = document.getElementById('previewHint');
const rotateBtn = document.getElementById('rotateBtn');
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

const OP_LABEL = {
  cw90: '90° 시계방향',
  ccw90: '90° 반시계방향',
  rot180: '180° 회전',
  hflip: '좌우 반전',
  vflip: '상하 반전',
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
  let label = p.key || '';
  if (label.startsWith('cache:')) label = '캐시 사용 — ' + label.slice(6);
  else if (label.startsWith('fetch:')) label = '다운로드 — ' + label.slice(6);
  else if (label === 'compute:transcode') label = '회전·인코딩';
  else if (label === 'init') label = '엔진 초기화';
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function applyRotPreview() {
  const op = getRot();
  ROT_CLASSES.forEach((c) => sourcePreviewWrap.classList.remove(c));
  if (op !== 'none') sourcePreviewWrap.classList.add('rot-' + op);
  // "원래대로"면 변환할 게 없으니 처리 버튼 비활성
  rotateBtn.disabled = !currentFile || op === 'none';
}

function loadFile(file) {
  if (!file || !file.type.startsWith('video/')) {
    alert('영상 파일만 선택해주세요.');
    return;
  }
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  rotateBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';

  // source 미리보기 + 회전 transform 즉시 반영
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
  dropTitle.textContent = '영상 파일을 드래그하거나 클릭해서 선택';
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

function buildArgs(inputName, outputName, op, audioMode) {
  const filter = OP_FILTER[op] || OP_FILTER.cw90;
  const audioArgs = audioMode === 'aac'
    ? ['-c:a', 'aac', '-b:a', '128k']
    : ['-c:a', 'copy'];
  return [
    '-i', inputName,
    '-vf', filter,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    ...audioArgs,
    '-movflags', '+faststart',
    outputName,
  ];
}

async function tryExec(ffmpeg, inputName, outputName, op) {
  // 1차: 오디오 무손실 복사
  try {
    await ffmpeg.exec(buildArgs(inputName, outputName, op, 'copy'));
    return 'copy';
  } catch (_) {
    // 2차: AAC 재인코딩 fallback
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
    await ffmpeg.exec(buildArgs(inputName, outputName, op, 'aac'));
    return 'aac';
  }
}

async function run() {
  if (!currentFile) return;
  const op = getRot();

  rotateBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = rotateBtn.textContent;
  rotateBtn.textContent = '처리 중...';
  setProgress({ key: 'init', current: 0, total: 1 });
  const t0 = performance.now();

  try {
    const ffmpeg = await loadFFmpeg(setProgress);

    setProgress({ key: 'compute:transcode', current: 0, total: 1 });
    progressText.textContent = '입력 파일 준비 중...';

    const inputName = 'in' + (currentFile.name.match(/\.[a-z0-9]+$/i)?.[0] || '.mp4');
    const outputName = 'out.mp4';

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}

    const inputData = await toUint8Array(currentFile);
    await ffmpeg.writeFile(inputName, inputData);

    progressText.textContent = '회전·인코딩 중...';
    await tryExec(ffmpeg, inputName, outputName, op);

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
    progressText.textContent = '완료 ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  } catch (e) {
    const { title, body } = formatVideoError(e, { toolName: '동영상 회전' });
    progressText.textContent = '실패: ' + title;
    progressFill.style.width = '0%';
    alert(title + '\n\n' + body);
  } finally {
    rotateBtn.textContent = orig;
    rotateBtn.disabled = !currentFile;
    clearBtn.disabled = false;
  }
}

// 파일 선택
fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) loadFile(f);
});

// 드래그·드롭
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

// 회전 옵션 변경 → 즉시 미리보기 transform 적용
document.querySelectorAll('input[name="rot"]').forEach((r) => {
  r.addEventListener('change', applyRotPreview);
});

// 액션
rotateBtn.addEventListener('click', run);
clearBtn.addEventListener('click', clearAll);
