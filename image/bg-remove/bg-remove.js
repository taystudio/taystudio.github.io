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
const cancelBtn = document.getElementById('cancelBtn');
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
// ONNX Runtime Web 추론은 진짜 중단 불가 — UX cancel로만 처리 (결과 도착 시 무시)
let runSeq = 0;
let activeRun = 0;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function setProgress(key, current, total) {
  // 취소된 run의 진행률 업데이트 무시 (백그라운드 추론은 계속 돌지만 UI에는 반영 안 함)
  if (activeRun === 0) return;
  progressWrap.hidden = false;
  let pct = 0;
  if (total > 0 && Number.isFinite(current)) {
    pct = Math.round((current / total) * 100);
  }
  progressFill.style.width = pct + '%';
  if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', pct);
  // 내부 경로 노출 없이 사용자 친화 메시지로 변환
  let label = key;
  if (typeof key === 'string') {
    if (key.startsWith('fetch:')) label = 'AI 모델 다운로드 중';
    else if (key.startsWith('compute:')) label = '배경 분석 중';
    else if (key === 'starting') label = '준비 중';
  }
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function loadFile(file) {
  // MIME 스푸핑 방어: type + 확장자 둘 다 검증 (.mp4를 .png로 rename + type 위조 차단)
  const imgExtRe = /\.(png|jpe?g|webp|bmp|gif|avif|tiff?)$/i;
  if (!file || !file.type.startsWith('image/') || !imgExtRe.test(file.name || '')) {
    alert('이미지 파일만 선택해주세요. (PNG·JPG·WebP·BMP·GIF·AVIF·TIFF)');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 30, '이미지')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  if (origUrl) URL.revokeObjectURL(origUrl);
  origUrl = URL.createObjectURL(file);
  origImg.src = origUrl;
  removeBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
}

async function run() {
  if (!currentFile) return;
  const myRun = ++runSeq;
  activeRun = myRun;
  removeBtn.disabled = true;
  cancelBtn.hidden = false;
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
      // publicPath — resources.json 및 모델 파일의 base URL.
      // staticimgly.com = @imgly 공식 CDN (model · resources.json 안정 hosting).
      // onnxruntime-web 의존성은 vendor 코드에서 esm.sh 절대 URL로 hardcode (publicPath 무관).
      publicPath: 'https://staticimgly.com/@imgly/background-removal/1.7.0/dist/',
      progress: setProgress
    });

    // 취소된 run의 결과 도착 — 무시 (UX cancel)
    if (myRun !== activeRun) return;

    const ms = Math.round(performance.now() - t0);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    resultImg.src = resultUrl;
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';
    dimText.textContent = origDim;
    resultSize.textContent = fmtBytes(blob.size);

    const baseName = (currentFile.name || 'image').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '-no-bg.png') : baseName + '-no-bg.png');

    progressFill.style.width = '100%';
    if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 100);
    progressText.textContent = '완료 ✓ (' + (ms / 1000).toFixed(1) + 's)';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    // 취소된 run의 예외 — 무시
    if (myRun !== activeRun) return;
    progressText.textContent = '실패: ' + (e && e.message ? e.message : '알 수 없는 오류');
    progressFill.style.width = '0%';
    if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
    const msg = (e && e.message) ? e.message : '';
    alert('배경 제거 실패: ' + msg + '\n\n해결 시도:\n• 페이지 새로고침 후 다시 시도\n• 더 작은 이미지로 시도 (가로 1500px 이하)\n• 다른 브라우저(Chrome·Edge·Firefox 최신) 사용\n• 네트워크 점검 (첫 실행은 모델 다운로드 필요)');
  } finally {
    if (myRun === activeRun) activeRun = 0;
    cancelBtn.hidden = true;
    removeBtn.textContent = orig;
    removeBtn.disabled = !currentFile;
  }
}

function cancelRun() {
  if (activeRun === 0) return;
  activeRun = 0;
  cancelBtn.hidden = true;
  progressText.textContent = '취소됨 — 백그라운드 처리는 끝까지 진행되지만 결과는 무시됩니다. 메모리 누적 시 페이지 새로고침 권장.';
  removeBtn.disabled = !currentFile;
  alert('취소됨 — 백그라운드 처리는 끝까지 진행됩니다. 큰 파일이면 페이지 새로고침을 권장합니다.');
}

function clearAll() {
  currentFile = null;
  if (origUrl) { URL.revokeObjectURL(origUrl); origUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = '이미지를 드래그하거나 클릭해서 선택';
  origImg.removeAttribute('src');
  resultImg.removeAttribute('src');
  removeBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
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
  if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return;
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadFile(f);
});
// Ctrl+V 이미지 붙여넣기
if (window.TayStudio && TayStudio.bindPasteImage) {
  TayStudio.bindPasteImage(files => { loadFile(files[0]); });
}
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

removeBtn.addEventListener('click', run);
cancelBtn.addEventListener('click', cancelRun);
clearBtn.addEventListener('click', clearAll);
