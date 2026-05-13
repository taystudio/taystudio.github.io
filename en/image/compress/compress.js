/**
 * Image Compress — canvas API based, all processing in the browser.
 * Last verified: 2026-05-09
 *
 * Flow:
 *  1. File input → FileReader → decoded into an Image object
 *  2. Drawn at native size onto a canvas
 *  3. canvas.toBlob(type, quality) → object URL → preview + download link
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
  dropTitle.textContent = 'Drag an image here, or click to choose';
  compressBtn.disabled = true;
  result.hidden = true;
  previewImg.removeAttribute('src');
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 200, 'Image')) return;
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
    // PNG input + JPEG output: transparency becomes black background — left as a quiet UX note.
  };
  currentImage.onerror = () => {
    alert('Could not decode this image. Try a different file.');
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

  // JPEG doesn't support transparency → fill white first (avoid black background).
  if (formatSel.value === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(currentImage, 0, 0);

  const type = formatSel.value;
  const quality = parseFloat(qualityInput.value);

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Compression failed. Your browser may not support this output format.');
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
    downloadBtn.download = baseName + '-compressed.' + ext;

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, type, quality);
}

// File select
fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) loadFile(f);
});

// Drag & drop
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

// Option changes
qualityInput.addEventListener('input', updateQualityUI);
formatSel.addEventListener('change', updateQualityUI);

// Actions
compressBtn.addEventListener('click', compress);
clearBtn.addEventListener('click', clearAll);

updateQualityUI();
