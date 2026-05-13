/**
 * 동영상 자르기 — ffmpeg.wasm 기반, 브라우저 안에서만 처리.
 * 최종 검증: 2026-05-05
 *
 * 두 모드:
 *  - copy(빠른): -ss <start> -to <end> -i input -c copy out.mp4
 *      → seek가 -i 앞에 있어 input scan을 건너뜀 + 키프레임 단위로만 잘림
 *  - reencode(정확): -i input -ss <start> -to <end> -c:v libx264 -preset ultrafast -crf 23 -c:a aac out.mp4
 *      → -i 뒤 seek는 디코드해서 정확한 프레임에서 잘리며 H.264로 재인코딩
 */

import { loadFFmpeg, toUint8Array, formatVideoError } from '/video/vendor/ffmpeg-loader.mjs';

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

/** "HH:MM:SS" / "MM:SS" / "SS(.frac)" → 초. 파싱 실패 시 NaN. */
function parseTime(str) {
  if (str == null) return NaN;
  const s = String(str).trim();
  if (s === '') return NaN;
  const parts = s.split(':').map((p) => p.trim());
  if (parts.some((p) => p === '' || !/^\d+(\.\d+)?$/.test(p))) return NaN;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return NaN;
  // MM:SS·HH:MM:SS에서 분·초는 60 미만이어야. "1:90" 같은 입력 거절.
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
  let label = p.key || '';
  if (label.startsWith('cache:')) label = '캐시 사용 — ' + label.slice(6);
  else if (label.startsWith('fetch:')) label = '다운로드 — ' + label.slice(6);
  else if (label === 'compute:transcode') label = '영상 처리';
  else if (label === 'init') label = '엔진 초기화';
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function loadFile(file) {
  if (!file || !file.type.startsWith('video/')) {
    alert('영상 파일만 선택해주세요.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 1000, '동영상')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  trimBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';

  // 미리보기 — 원본 길이 자동 표시 + 시간 선택 도우미
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
    durationHint.textContent = `전체 길이: ${fmtTime(videoDuration)}`;
    if (!startTimeInput.value) startTimeInput.value = '0';
    if (!endTimeInput.value) endTimeInput.value = fmtTime(videoDuration);
  }
}

function clearAll() {
  currentFile = null;
  if (sourceUrl) { URL.revokeObjectURL(sourceUrl); sourceUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = '영상 파일을 드래그하거나 클릭해서 선택';
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
  // start·end는 항상 숫자(초). ffmpeg는 초 단위 그대로 받음.
  if (mode === 'copy') {
    // -ss/-to를 -i 앞에 두면 빠른 seek (input scan 생략) + 키프레임 정렬
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
  // 정확 모드: -ss를 -i 뒤에 두면 디코드 후 정확한 프레임에서 잘림
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
    alert('시작·끝 시각 형식이 올바르지 않습니다.\n예: 0:30 / 1:23:45 / 90');
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
  const mode = modeSel.value;

  trimBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = trimBtn.textContent;
  trimBtn.textContent = '처리 중...';
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

    progressText.textContent = mode === 'copy' ? '구간 잘라내는 중...' : '재인코딩 중...';
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
    modeText.textContent = mode === 'copy' ? '빠른 모드' : '정확 모드';

    const ms = Math.round(performance.now() - t0);
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';

    const baseName = (currentFile.name || 'video').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '-trim.mp4') : baseName + '-trim.mp4');

    progressFill.style.width = '100%';
    progressText.textContent = '완료 ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  } catch (e) {
    const { title, body } = formatVideoError(e, {
      toolName: '동영상 자르기',
      toolHint: '• 시각 입력값 확인 (시작 < 끝, 영상 길이 이내)\n• 빠른 모드 → 정확 모드로 전환 시도',
    });
    progressText.textContent = '실패: ' + title;
    progressFill.style.width = '0%';
    alert(title + '\n\n' + body);
  } finally {
    trimBtn.textContent = orig;
    trimBtn.disabled = !currentFile;
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
trimBtn.addEventListener('click', run);
clearBtn.addEventListener('click', clearAll);
