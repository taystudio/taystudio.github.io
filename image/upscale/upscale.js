/**
 * AI 이미지 업스케일링 — upscaler.js (ESRGAN-thick 4x).
 * 사진 외부 전송 X. 모든 처리 브라우저 내.
 */

import { upscale, formatUpscaleError } from '/image/vendor/upscale-loader.mjs';

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dropTitle = document.getElementById('dropTitle');
const runBtn = document.getElementById('runBtn');
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
const formatSel = document.getElementById('formatSel');
const qualitySel = document.getElementById('qualitySel');
const variantSel = document.getElementById('variantSel');
const scaleSel = document.getElementById('scaleSel');

let currentFile = null;
let currentObjectURL = null;
let resultBlobURL = null;

function setProgress(pct, text) {
  progressWrap.hidden = false;
  progressFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  progressText.textContent = text;
}

function hideProgress() {
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
}

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function revokeAll() {
  if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
  if (resultBlobURL) { URL.revokeObjectURL(resultBlobURL); resultBlobURL = null; }
}

function clearAll() {
  revokeAll();
  currentFile = null;
  fileInput.value = '';
  result.hidden = true;
  hideProgress();
  runBtn.disabled = true;
  origImg.src = '';
  resultImg.src = '';
  dropTitle.textContent = '사진을 드래그하거나 클릭해서 선택';
  downloadBtn.removeAttribute('href');
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('이미지 파일을 선택해주세요 (JPG·PNG·WebP).');
    return;
  }
  revokeAll();
  currentFile = file;
  currentObjectURL = URL.createObjectURL(file);
  origImg.src = currentObjectURL;
  dropTitle.textContent = `선택됨: ${file.name}`;
  runBtn.disabled = false;
  // 이전 결과 제거
  result.hidden = true;
  resultImg.src = '';
  hideProgress();
}

// 드롭존 — <label>이 자식 input을 자동 트리거하므로 별도 click 핸들러 불필요.
// (수동 click() 추가 시 label 자연 동작과 중복돼 picker가 두 번 뜸 = 취소 후 재트리거 버그)
fileInput.addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (f) loadFile(f);
});

['dragenter', 'dragover'].forEach(ev => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
});
['dragleave', 'drop'].forEach(ev => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });
});
dropZone.addEventListener('drop', (e) => {
  if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return;
  const f = e.dataTransfer?.files?.[0];
  if (f) loadFile(f);
});

clearBtn.addEventListener('click', clearAll);

// JPG 품질 select은 PNG일 땐 의미 없음 — 시각 disabled
formatSel.addEventListener('change', () => {
  qualitySel.disabled = formatSel.value !== 'jpg';
});
qualitySel.disabled = formatSel.value !== 'jpg';

runBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  runBtn.disabled = true;
  clearBtn.disabled = true;
  hideProgress();

  const variant = variantSel?.value || 'slim';
  const scale = parseInt(scaleSel?.value || '2', 10);
  const variantLabel = variant === 'slim' ? '빠름' : '고품질';
  const sizeHint = variant === 'slim'
    ? (scale === 2 ? '~3MB' : '~5MB')
    : (scale === 2 ? '~9MB' : '~17MB');

  setProgress(2, `AI 모델 준비 중... (${variantLabel} ${scale}x, 첫 실행 시 ${sizeHint} 다운로드)`);

  const t0 = performance.now();
  try {
    const imgEl = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = currentObjectURL;
    });

    const origW = imgEl.naturalWidth;
    const origH = imgEl.naturalHeight;

    // 큰 입력 가드 — 메모리 OOM 방지 (4x일 때 더 보수적)
    const limitPx = scale === 4 ? 1200 * 1200 : 2000 * 2000;
    if (origW * origH > limitPx) {
      const proceed = confirm(
        `사진이 큽니다 (${origW}×${origH}, 약 ${(origW * origH / 1e6).toFixed(1)}M 픽셀).\n` +
        `${scale}배 업스케일 결과는 ${origW * scale}×${origH * scale}이 됩니다.\n\n` +
        `메모리 부족·실패 위험. 진행하시겠어요? (취소 후 리사이즈 도구로 줄이는 것 권장)`
      );
      if (!proceed) {
        runBtn.disabled = false;
        clearBtn.disabled = false;
        hideProgress();
        return;
      }
    }

    const dataURL = await upscale(imgEl, {
      variant,
      scale,
      onProgress: (p) => {
        if (p.key === 'init') setProgress(5, 'AI 라이브러리 초기화...');
        else if (p.key === 'fetch:tfjs') setProgress(p.current === 1 ? 25 : 10, 'TensorFlow.js 로드... (~3MB)');
        else if (p.key === 'fetch:upscaler') setProgress(p.current === 1 ? 35 : 30, 'upscaler.js 로드...');
        else if (p.key === 'fetch:model') setProgress(p.current === 1 ? 50 : 40, `ESRGAN ${variantLabel} ${scale}x 모델 로드... (${sizeHint})`);
        else if (p.key === 'compute') {
          const pct = 50 + (p.current * 48);
          setProgress(pct, `AI 추론 중... ${Math.round(p.current * 100)}%`);
        }
      },
    });

    // dataURL → Blob 변환 (포맷·품질 적용)
    const format = formatSel.value;
    const quality = parseFloat(qualitySel.value);
    setProgress(96, '결과 인코딩...');

    let blob;
    if (format === 'png') {
      // upscaler 결과는 base64 PNG dataURL — 직접 Blob 변환
      blob = await (await fetch(dataURL)).blob();
    } else {
      // PNG dataURL → canvas → JPG Blob (재인코딩)
      const tmpImg = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('결과 이미지 로드 실패'));
        i.src = dataURL;
      });
      const canvas = document.createElement('canvas');
      canvas.width = tmpImg.naturalWidth;
      canvas.height = tmpImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      // JPG는 알파 X — 흰 배경 채움 (PNG 투명 영역 처리)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tmpImg, 0, 0);
      blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
    }

    setProgress(100, '완료');

    if (resultBlobURL) URL.revokeObjectURL(resultBlobURL);
    resultBlobURL = URL.createObjectURL(blob);
    resultImg.src = resultBlobURL;

    const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
    elapsedTime.textContent = `${elapsed}s`;
    dimText.textContent = `${origW}×${origH} → ${origW * scale}×${origH * scale}`;
    resultSize.textContent = fmtSize(blob.size);

    // 다운로드 파일명
    const stem = (currentFile.name || 'image').replace(/\.[^.]+$/, '');
    const ext = format === 'png' ? 'png' : 'jpg';
    downloadBtn.href = resultBlobURL;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(`${stem}-upscaled-${scale}x.${ext}`) : `${stem}-upscaled-${scale}x.${ext}`);
    downloadBtn.textContent = `⬇ ${ext.toUpperCase()} 다운로드 (${scale}배 업스케일)`;

    result.hidden = false;
    setTimeout(() => hideProgress(), 1200);
  } catch (e) {
    console.error('[upscale]', e);
    const { title, body } = formatUpscaleError(e);
    alert(`${title}\n\n${body}`);
    hideProgress();
  } finally {
    runBtn.disabled = !currentFile;
    clearBtn.disabled = false;
  }
});
