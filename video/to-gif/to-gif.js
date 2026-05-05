/**
 * 동영상 → GIF 변환 — ffmpeg.wasm 기반, 브라우저 안에서만 처리.
 * 최종 검증: 2026-05-05
 *
 * palettegen + paletteuse 단일 호출 (split 필터로 한 번에):
 *   -vf "fps=N,scale=W:-2:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"
 *
 *   1. fps 변경 + 리스케일 → split으로 두 갈래 분기
 *   2. 한쪽은 palettegen으로 영상 전체 분석해 최적 256색 색상표 생성
 *   3. 다른쪽은 paletteuse로 그 색상표 적용해 dithering
 *
 * 2-pass 따로 호출하지 않고 한 번에 — 중간 palette.png 파일 불필요.
 */

import { loadFFmpeg, toUint8Array } from '/video/vendor/ffmpeg-loader.mjs';

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
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let sourceUrl = null;
let resultUrl = null;
let videoDuration = 0;

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
  let label = p.key || '';
  if (label.startsWith('cache:')) label = '캐시 사용 — ' + label.slice(6);
  else if (label.startsWith('fetch:')) label = '다운로드 — ' + label.slice(6);
  else if (label === 'compute:transcode') label = 'GIF 생성';
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
    durationHint.textContent = `전체 길이: ${fmtTime(videoDuration)} — GIF는 ≤ 10초 구간을 권장합니다.`;
    if (!startTimeInput.value) startTimeInput.value = '0';
    if (!endTimeInput.value) endTimeInput.value = fmtTime(Math.min(5, videoDuration));
  }
}

function clearAll() {
  currentFile = null;
  if (sourceUrl) { URL.revokeObjectURL(sourceUrl); sourceUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = '영상 파일을 드래그하거나 클릭해서 선택';
  convertBtn.disabled = true;
  result.hidden = true;
  sourcePreviewWrap.hidden = true;
  durationHint.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
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
  // -ss/-to를 -i 앞에 두면 빠른 seek (디코드 양 감소)
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
    alert('시작·끝 시각 형식이 올바르지 않습니다.\n예: 0:30 / 1:23:45 / 30');
    return;
  }
  if (end <= start) {
    alert('끝 시각이 시작 시각보다 커야 합니다.');
    return;
  }
  if (videoDuration > 0 && start >= videoDuration) {
    alert(`시작 시각이 영상 길이(${fmtTime(videoDuration)})를 넘었습니다.`);
    return;
  }
  const effectiveEnd = videoDuration > 0 ? Math.min(end, videoDuration) : end;
  const segLen = effectiveEnd - start;
  if (segLen > 30) {
    if (!confirm(`구간이 ${segLen.toFixed(0)}초로 깁니다. GIF가 매우 커질 수 있어요(50MB+).\n계속할까요?`)) {
      return;
    }
  }

  const fps = parseInt(fpsSel.value, 10);
  const width = parseInt(widthSel.value, 10);

  convertBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = convertBtn.textContent;
  convertBtn.textContent = '처리 중...';
  setProgress({ key: 'init', current: 0, total: 1 });
  const t0 = performance.now();

  try {
    const ffmpeg = await loadFFmpeg(setProgress);

    setProgress({ key: 'compute:transcode', current: 0, total: 1 });
    progressText.textContent = '입력 파일 준비 중...';

    const inputName = 'in' + (currentFile.name.match(/\.[a-z0-9]+$/i)?.[0] || '.mp4');
    const outputName = 'out.gif';

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}

    const inputData = await toUint8Array(currentFile);
    await ffmpeg.writeFile(inputName, inputData);

    progressText.textContent = '색상표 생성 + GIF 인코딩 중...';
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
    optText.textContent = `${width > 0 ? width + 'px' : '원본'} · ${fps}fps`;

    const ms = Math.round(performance.now() - t0);
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';

    const baseName = (currentFile.name || 'video').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = baseName + '.gif';

    progressFill.style.width = '100%';
    progressText.textContent = '완료 ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  } catch (e) {
    const msg = (e && e.message) ? e.message : String(e);
    progressText.textContent = '실패: ' + msg;
    progressFill.style.width = '0%';
    alert(
      'GIF 변환 실패: ' + msg + '\n\n해결 시도:\n' +
      '• 구간을 짧게 (5초 이내) 또는 너비 480px 이하로 시도\n' +
      '• 시각 입력값 확인 (시작 < 끝, 영상 길이 이내)\n' +
      '• 페이지 새로고침 후 재시도\n' +
      '• 데스크톱 Chrome·Edge·Firefox 최신 사용'
    );
  } finally {
    convertBtn.textContent = orig;
    convertBtn.disabled = !currentFile;
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

// "현재 재생 위치로" 버튼
pickStartBtn.addEventListener('click', () => {
  if (sourceVideo.src) startTimeInput.value = fmtTime(sourceVideo.currentTime);
});
pickEndBtn.addEventListener('click', () => {
  if (sourceVideo.src) endTimeInput.value = fmtTime(sourceVideo.currentTime);
});

// 액션
convertBtn.addEventListener('click', run);
clearBtn.addEventListener('click', clearAll);
