/**
 * 동영상 압축 — ffmpeg.wasm 기반, 브라우저 안에서만 처리.
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. 영상 입력 → ffmpeg(load: 첫 사용 시 ~32MB 다운로드 + IndexedDB 캐시)
 *  2. 입력 파일을 ffmpeg FS에 writeFile
 *  3. ffmpeg.exec(['-i', input, '-vf scale=...', '-crf', N, ...]) 로 H.264 인코딩
 *  4. 결과 readFile → Blob → preview + download link
 */

import { loadFFmpeg, toUint8Array, formatVideoError } from '/video/vendor/ffmpeg-loader.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const resolutionSel = document.getElementById('resolution');
const crfInput = document.getElementById('crf');
const crfValue = document.getElementById('crfValue');
const audioSel = document.getElementById('audio');
const compressBtn = document.getElementById('compressBtn');
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
  let label = p.key || '';
  if (label.startsWith('cache:')) label = '캐시 사용 — ' + label.slice(6);
  else if (label.startsWith('fetch:')) label = '다운로드 — ' + label.slice(6);
  else if (label === 'compute:transcode') label = '영상 인코딩';
  else if (label === 'init') label = '엔진 초기화';
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function loadFile(file) {
  if (!file || !file.type.startsWith('video/')) {
    alert('영상 파일만 선택해주세요.');
    return;
  }
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
  dropTitle.textContent = '영상 파일을 드래그하거나 클릭해서 선택';
  compressBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  resultVideo.removeAttribute('src');
  resultVideo.load();
}

function buildArgs(inputName, outputName) {
  const args = ['-i', inputName];
  // 해상도 필터
  const resVal = parseInt(resolutionSel.value, 10);
  if (resVal > 0) {
    args.push('-vf', `scale=-2:${resVal}`);
  }
  // 비디오: H.264 + CRF
  args.push('-c:v', 'libx264');
  args.push('-preset', 'ultrafast'); // single-thread 환경 — preset을 빠르게
  args.push('-crf', crfInput.value);
  args.push('-pix_fmt', 'yuv420p'); // 호환성 (Safari·QuickTime)
  // 오디오
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
  args.push('-movflags', '+faststart'); // 웹 재생 최적화
  args.push(outputName);
  return args;
}

async function run() {
  if (!currentFile) return;
  compressBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = compressBtn.textContent;
  compressBtn.textContent = '처리 중...';
  setProgress({ key: 'init', current: 0, total: 1 });
  const t0 = performance.now();

  try {
    const ffmpeg = await loadFFmpeg(setProgress);

    setProgress({ key: 'compute:transcode', current: 0, total: 1 });
    progressText.textContent = '입력 파일 준비 중...';

    const inputName = 'in' + (currentFile.name.match(/\.[a-z0-9]+$/i)?.[0] || '.mp4');
    const outputName = 'out.mp4';

    // 이전 잔여 파일 정리 (best-effort)
    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}

    const inputData = await toUint8Array(currentFile);
    await ffmpeg.writeFile(inputName, inputData);

    progressText.textContent = '영상 인코딩 시작 — 잠시만요...';
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
    dimText.textContent = resVal > 0 ? resVal + 'p' : '원본';

    const ms = Math.round(performance.now() - t0);
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';

    const baseName = (currentFile.name || 'video').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '-compressed.mp4') : baseName + '-compressed.mp4');

    progressFill.style.width = '100%';
    progressText.textContent = '완료 ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // ffmpeg FS 정리 (다음 작업 위해)
    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  } catch (e) {
    const { title, body } = formatVideoError(e, { toolName: '동영상 압축' });
    progressText.textContent = '실패: ' + title;
    progressFill.style.width = '0%';
    alert(title + '\n\n' + body);
  } finally {
    compressBtn.textContent = orig;
    compressBtn.disabled = !currentFile;
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

// 옵션
crfInput.addEventListener('input', () => {
  crfValue.textContent = crfInput.value;
});

// 액션
compressBtn.addEventListener('click', run);
clearBtn.addEventListener('click', clearAll);
