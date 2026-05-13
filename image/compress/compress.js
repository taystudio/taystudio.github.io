/**
 * 이미지 압축 — canvas API 기반, 브라우저 안에서만 처리.
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. 파일 입력 → FileReader → Image 객체로 디코딩
 *  2. canvas에 원본 크기로 그림
 *  3. canvas.toBlob(type, quality) 로 출력 → object URL 생성 → preview + download link
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const formatSel = document.getElementById('format');
const qualityField = document.getElementById('qualityField');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const compressBtn = document.getElementById('compressBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const previewImg = document.getElementById('previewImg');
const origSize = document.getElementById('origSize');
const compSize = document.getElementById('compSize');
const reduceRate = document.getElementById('reduceRate');
const dimText = document.getElementById('dimText');
const downloadBtn = document.getElementById('downloadBtn');
const qualityHint = document.getElementById('qualityHint');
const QUALITY_HINT_DEFAULT = qualityHint ? qualityHint.textContent : '';
const QUALITY_HINT_PNG = 'PNG는 무손실 포맷이라 품질 슬라이더가 적용되지 않습니다. 용량을 줄이려면 JPEG·WebP로 바꾸세요.';

let currentFile = null;
let currentImage = null;
let currentObjectURL = null;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateQualityUI() {
  qualityValue.textContent = parseFloat(qualityInput.value).toFixed(2);
  const isPng = formatSel.value === 'image/png';
  qualityField.style.opacity = isPng ? '0.4' : '1';
  qualityInput.disabled = isPng;
  if (qualityHint) {
    qualityHint.textContent = isPng ? QUALITY_HINT_PNG : QUALITY_HINT_DEFAULT;
    qualityHint.style.opacity = '1';
  }
}

function clearAll() {
  currentFile = null;
  if (currentImage) {
    if (currentImage.src && currentImage.src.startsWith('blob:')) URL.revokeObjectURL(currentImage.src);
    currentImage = null;
  }
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = null;
  }
  fileInput.value = '';
  dropTitle.textContent = '이미지를 드래그하거나 클릭해서 선택';
  compressBtn.disabled = true;
  result.hidden = true;
  previewImg.removeAttribute('src');
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('이미지 파일만 선택해주세요.');
    return;
  }
  if (file.size === 0) {
    alert('빈 파일입니다. 다른 이미지를 선택해주세요.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 200, '이미지')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  compressBtn.disabled = false;
  result.hidden = true;

  if (currentImage && currentImage.src && currentImage.src.startsWith('blob:')) {
    URL.revokeObjectURL(currentImage.src);
  }
  const url = URL.createObjectURL(file);
  currentImage = new Image();
  currentImage.onload = () => {
    // PNG 입력일 때 디폴트 출력 포맷을 JPEG로 두면 투명이 검은 배경 됨 — 사용자가 알게 안내만.
  };
  currentImage.onerror = () => {
    alert('이미지를 디코딩할 수 없습니다. 다른 파일로 시도해주세요.');
    clearAll();
  };
  currentImage.src = url;
}

function compress() {
  if (!currentFile || !currentImage || !currentImage.complete) return;

  const canvas = document.createElement('canvas');
  canvas.width = currentImage.naturalWidth;
  canvas.height = currentImage.naturalHeight;
  const ctx = canvas.getContext('2d');

  // JPEG는 투명 미지원 → 흰 배경으로 채움 (검은 배경 방지)
  if (formatSel.value === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(currentImage, 0, 0);

  const type = formatSel.value;
  const quality = parseFloat(qualityInput.value);

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('압축 실패. 브라우저가 해당 포맷을 지원하지 않을 수 있습니다.');
      return;
    }
    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = URL.createObjectURL(blob);

    previewImg.src = currentObjectURL;
    origSize.textContent = fmtBytes(currentFile.size);
    compSize.textContent = fmtBytes(blob.size);

    const reduce = ((1 - blob.size / currentFile.size) * 100);
    reduceRate.textContent = (reduce >= 0 ? '−' : '+') + Math.abs(reduce).toFixed(1) + '%';
    if (blob.size > currentFile.size) {
      reduceRate.style.color = '#dc2626';
    } else {
      reduceRate.style.color = '';
    }

    dimText.textContent = canvas.width + '×' + canvas.height;

    const ext = type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png';
    const baseName = (currentFile.name || 'image').replace(/\.[^./]+$/, '');
    downloadBtn.href = currentObjectURL;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '-compressed.' + ext) : baseName + '-compressed.' + ext);

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, type, quality);
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
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

// 옵션 변경
qualityInput.addEventListener('input', updateQualityUI);
formatSel.addEventListener('change', updateQualityUI);

// 액션
compressBtn.addEventListener('click', compress);
clearBtn.addEventListener('click', clearAll);

updateQualityUI();
