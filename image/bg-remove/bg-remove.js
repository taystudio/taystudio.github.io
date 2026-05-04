/**
 * 배경 제거 (누끼) — @imgly/background-removal v1.7 (AGPL/Commercial).
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. 이미지 업로드 → 원본 미리보기
 *  2. removeBackground(blob, { model: 'small', progress })
 *     → ONNX Runtime Web(WASM)이 staticimgly.com에서 모델·런타임 받아 캐시 + 추론
 *  3. 결과 Blob → 투명 PNG 다운로드 링크
 *
 * 주의:
 *  - ESM module — <script type="module"> 필요
 *  - 첫 실행 시 모델·WASM ~43MB+ 다운로드 (이후 캐시)
 */

import { removeBackground } from '/image/vendor/imgly-bg-remove.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const removeBtn = document.getElementById('removeBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const origImg = document.getElementById('origImg');
const resultImg = document.getElementById('resultImg');
const elapsedTime = document.getElementById('elapsedTime');
const dimText = document.getElementById('dimText');
const resultSize = document.getElementById('resultSize');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let origUrl = null;
let resultUrl = null;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function setProgress(key, current, total) {
  progressWrap.hidden = false;
  let pct = 0;
  if (total > 0 && Number.isFinite(current)) {
    pct = Math.round((current / total) * 100);
  }
  progressFill.style.width = pct + '%';
  // key 예: 'fetch:onnx/onnx_wasm_simd_threaded.jsep.mjs', 'fetch:isnet_quint8.onnx', 'compute:foreground'
  let label = key;
  if (typeof key === 'string') {
    if (key.startsWith('fetch:')) label = '다운로드 — ' + key.slice(6).split('/').pop();
    else if (key.startsWith('compute:')) label = '추론 — ' + key.slice(8);
  }
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('이미지 파일만 선택해주세요.');
    return;
  }
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  if (origUrl) URL.revokeObjectURL(origUrl);
  origUrl = URL.createObjectURL(file);
  origImg.src = origUrl;
  removeBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
}

async function run() {
  if (!currentFile) return;
  removeBtn.disabled = true;
  const orig = removeBtn.textContent;
  removeBtn.textContent = '처리 중...';
  setProgress('starting', 0, 1);
  const t0 = performance.now();

  // 원본 해상도 표시
  const tempImg = new Image();
  tempImg.src = origUrl;
  await new Promise((r) => { tempImg.onload = r; tempImg.onerror = r; });
  const origDim = tempImg.naturalWidth + '×' + tempImg.naturalHeight;

  try {
    const blob = await removeBackground(currentFile, {
      model: 'isnet_quint8', // small (~43MB int8 quantized)
      output: { format: 'image/png', quality: 0.9 },
      progress: setProgress
    });

    const ms = Math.round(performance.now() - t0);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    resultImg.src = resultUrl;
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';
    dimText.textContent = origDim;
    resultSize.textContent = fmtBytes(blob.size);

    const baseName = (currentFile.name || 'image').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = baseName + '-no-bg.png';

    progressFill.style.width = '100%';
    progressText.textContent = '완료 ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    progressText.textContent = '실패: ' + (e && e.message ? e.message : '알 수 없는 오류');
    progressFill.style.width = '0%';
    const msg = (e && e.message) ? e.message : '';
    alert('배경 제거 실패: ' + msg + '\n\n해결 시도:\n• 페이지 새로고침 후 다시 시도\n• 더 작은 이미지로 시도 (가로 1500px 이하)\n• 다른 브라우저(Chrome·Edge·Firefox 최신) 사용\n• 네트워크 점검 (첫 실행은 모델 다운로드 필요)');
  } finally {
    removeBtn.textContent = orig;
    removeBtn.disabled = !currentFile;
  }
}

function clearAll() {
  currentFile = null;
  if (origUrl) { URL.revokeObjectURL(origUrl); origUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = '사진을 드래그하거나 클릭해서 선택';
  origImg.removeAttribute('src');
  resultImg.removeAttribute('src');
  removeBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
}

fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) loadFile(f);
});
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadFile(f);
});

removeBtn.addEventListener('click', run);
clearBtn.addEventListener('click', clearAll);
