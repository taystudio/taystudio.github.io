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

import { loadFFmpeg, toUint8Array, formatVideoError, terminateFFmpeg } from '/video/vendor/ffmpeg-loader.mjs';

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

// 모바일 감지 시 default width 320으로 — single-thread WASM 메모리 한계 회피
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
  // 분·초는 60 미만 (trim 동일 패턴): "1:90" 등 거부
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
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 500, '동영상')) return;
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
    alert('시작·끝 시각 형식이 올바르지 않습니다.\n예: 0:30 / 1:23:45 / 30\n분·초는 60 미만으로 입력하세요.');
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

  // 메모리 사전 추정: duration × fps × (w × h × 4) ≈ 디코더 프레임 누적 메모리
  // 실제 GIF 크기는 압축 후 훨씬 작지만 런타임 메모리 한계가 먼저 터짐 (단일 스레드 WASM)
  const srcW = sourceVideo.videoWidth || 0;
  const srcH = sourceVideo.videoHeight || 0;
  if (srcW > 0 && srcH > 0) {
    const outW = width > 0 ? width : srcW;
    const outH = width > 0 ? Math.round(srcH * (outW / srcW)) : srcH;
    const frames = Math.ceil(segLen * fps);
    const bytes = frames * outW * outH * 4; // RGBA 프레임 누적 추정
    const mb = bytes / (1024 * 1024);
    // 단일 스레드 ffmpeg.wasm 메모리 한계 ~2GB. 600MB 넘으면 강한 경고.
    if (mb > 600) {
      const msg = `예상 처리 메모리 약 ${mb.toFixed(0)} MB — 변환 실패 가능성이 높습니다.\n` +
        `(${segLen.toFixed(1)}초 × ${fps}fps × ${outW}×${outH})\n\n` +
        `해결: 구간을 더 짧게(≤10초), 너비를 320·240으로 낮춰주세요.\n\n계속하시겠습니까?`;
      if (!confirm(msg)) return;
    } else if (mb > 250) {
      const msg = `예상 처리 메모리 약 ${mb.toFixed(0)} MB — 모바일·저사양 기기에서 실패할 수 있습니다.\n` +
        `더 짧은 구간 또는 낮은 해상도를 권장합니다.\n\n계속하시겠습니까?`;
      if (!confirm(msg)) return;
    }
  }

  convertBtn.disabled = true;
  clearBtn.disabled = true;
  const orig = convertBtn.textContent;
  convertBtn.textContent = '처리 중...';
  cancelBtn.hidden = false;
  const myRun = ++runSeq;
  activeRun = myRun;
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
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '.gif') : baseName + '.gif');

    progressFill.style.width = '100%';
    progressText.textContent = '완료 ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try { await ffmpeg.deleteFile(inputName); } catch (_) {}
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  } catch (e) {
    if (myRun !== activeRun) {
      progressText.textContent = '취소됨';
      progressFill.style.width = '0%';
    } else {
      const { title, body } = formatVideoError(e, {
        toolName: 'GIF 변환',
        toolHint: '• 구간을 짧게 (5초 이내) 또는 너비 480px 이하로 시도\n• 시각 입력값 확인 (시작 < 끝, 영상 길이 이내)',
      });
      progressText.textContent = '실패: ' + title;
      progressFill.style.width = '0%';
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
  progressText.textContent = '취소됨';
  cancelBtn.hidden = true;
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
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
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
cancelBtn.addEventListener('click', cancelRun);
clearBtn.addEventListener('click', clearAll);
