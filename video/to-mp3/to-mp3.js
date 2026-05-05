/**
 * 동영상 → MP3 추출 — ffmpeg.wasm 기반, 브라우저 안에서만 처리.
 * 최종 검증: 2026-05-05
 *
 * args:
 *   -i input -vn -c:a libmp3lame -b:a <bitrate>k out.mp3
 *
 *   -vn          = 비디오 트랙 제거 (오디오만 추출)
 *   -c:a         = 오디오 코덱 = LAME MP3
 *   -b:a Nk      = 오디오 비트레이트
 *
 * 저작권 정책: 페이지 인라인 .copyright-warning 박스로 본인 영상 한정 안내.
 */

import { loadFFmpeg, toUint8Array, formatVideoError } from '/video/vendor/ffmpeg-loader.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const bitrateSel = document.getElementById('bitrate');
const extractBtn = document.getElementById('extractBtn');
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
  else if (label === 'compute:transcode') label = 'MP3 인코딩';
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
  extractBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
}

function clearAll() {
  currentFile = null;
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = '본인 영상 파일을 드래그하거나 클릭해서 선택';
  extractBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
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
  extractBtn.textContent = '처리 중...';
  setProgress({ key: 'init', current: 0, total: 1 });
  const t0 = performance.now();

  try {
    const ffmpeg = await loadFFmpeg(setProgress);

    setProgress({ key: 'compute:transcode', current: 0, total: 1 });
    progressText.textContent = '입력 파일 준비 중...';

    const inputName = 'in' + (currentFile.name.match(/\.[a-z0-9]+$/i)?.[0] || '.mp4');
    const outputName = 'out.mp3';

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}

    const inputData = await toUint8Array(currentFile);
    await ffmpeg.writeFile(inputName, inputData);

    progressText.textContent = 'MP3 인코딩 중...';
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
    downloadBtn.download = baseName + '.mp3';

    progressFill.style.width = '100%';
    progressText.textContent = '완료 ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  } catch (e) {
    const { title, body } = formatVideoError(e, {
      toolName: 'MP3 추출',
      toolHint: '• 영상에 오디오 트랙이 있는지 확인 (음소거 영상은 추출 불가)\n• 큰 영상은 동영상 자르기로 먼저 짧게 자른 후 추출',
    });
    progressText.textContent = '실패: ' + title;
    progressFill.style.width = '0%';
    alert(title + '\n\n' + body);
  } finally {
    extractBtn.textContent = orig;
    extractBtn.disabled = !currentFile;
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

// 액션
extractBtn.addEventListener('click', run);
clearBtn.addEventListener('click', clearAll);
