/**
 * Image Resize — canvas API based, all processing in the browser.
 * Last verified: 2026-05-09
 *
 * Flow:
 *  1. File input → decoded into Image → record native width/height
 *  2. Apply unit (px / %) and aspect-ratio lock to compute target width/height
 *  3. canvas.drawImage(img, 0, 0, w, h) for interpolated resize → toBlob() → download link
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const widthIn = document.getElementById('widthIn');
const heightIn = document.getElementById('heightIn');
const widthUnit = document.getElementById('widthUnit');
const heightUnit = document.getElementById('heightUnit');
const lockRatio = document.getElementById('lockRatio');
const formatSel = document.getElementById('format');
const qualityField = document.getElementById('qualityField');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const unitPx = document.getElementById('unitPx');
const unitPct = document.getElementById('unitPct');
const resizeBtn = document.getElementById('resizeBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const previewImg = document.getElementById('previewImg');
const origDim = document.getElementById('origDim');
const newDim = document.getElementById('newDim');
const origSize = document.getElementById('origSize');
const newSize = document.getElementById('newSize');
const downloadBtn = document.getElementById('downloadBtn');

let unit = 'px';
let currentFile = null;
let currentImage = null;
let currentObjectURL = null;
let lastEdited = 'w'; // which side drives the auto-fill when ratio is locked

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function detectMime(file) {
  if (file && file.type) return file.type;
  return 'image/jpeg';
}

function effectiveOutputType() {
  if (formatSel.value === 'keep') {
    return detectMime(currentFile);
  }
  return formatSel.value;
}

function updateQualityVisibility() {
  const t = effectiveOutputType();
  const lossy = (t === 'image/jpeg' || t === 'image/webp');
  qualityField.style.display = lossy ? '' : 'none';
}

function setUnit(u) {
  unit = u;
  unitPx.classList.toggle('active', u === 'px');
  unitPct.classList.toggle('active', u === 'pct');
  widthUnit.textContent = u === 'pct' ? '%' : 'px';
  heightUnit.textContent = u === 'pct' ? '%' : 'px';
  if (currentImage) prefillFromImage();
}

function prefillFromImage() {
  if (!currentImage) return;
  if (unit === 'px') {
    widthIn.value = currentImage.naturalWidth;
    heightIn.value = currentImage.naturalHeight;
  } else {
    widthIn.value = 100;
    heightIn.value = 100;
  }
}

function clearAll() {
  currentFile = null;
  if (currentImage && currentImage.src && currentImage.src.startsWith('blob:')) {
    URL.revokeObjectURL(currentImage.src);
  }
  currentImage = null;
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = null;
  }
  fileInput.value = '';
  widthIn.value = '';
  heightIn.value = '';
  dropTitle.textContent = 'Drag an image here, or click to choose';
  resizeBtn.disabled = true;
  result.hidden = true;
  previewImg.removeAttribute('src');
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    return;
  }
  if (file.size === 0) {
    alert('Empty file (0 bytes). Please try a different image.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'Image')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  result.hidden = true;

  if (currentImage && currentImage.src && currentImage.src.startsWith('blob:')) {
    URL.revokeObjectURL(currentImage.src);
  }
  const url = URL.createObjectURL(file);
  currentImage = new Image();
  currentImage.onload = () => {
    prefillFromImage();
    resizeBtn.disabled = false;
    updateQualityVisibility();
  };
  currentImage.onerror = () => {
    alert('Could not decode this image. Try a different file.');
    clearAll();
  };
  currentImage.src = url;
}

function syncRatio() {
  if (!lockRatio.checked || !currentImage) return;
  const ow = currentImage.naturalWidth;
  const oh = currentImage.naturalHeight;
  if (lastEdited === 'w') {
    const wv = parseFloat(widthIn.value);
    if (!isFinite(wv) || wv <= 0) return;
    if (unit === 'px') heightIn.value = Math.max(1, Math.round(wv * (oh / ow)));
    else heightIn.value = wv;
  } else {
    const hv = parseFloat(heightIn.value);
    if (!isFinite(hv) || hv <= 0) return;
    if (unit === 'px') widthIn.value = Math.max(1, Math.round(hv * (ow / oh)));
    else widthIn.value = hv;
  }
}

const MAX_DIM = 16000; // browser canvas safety limit (~16384px)

function targetDims() {
  if (!currentImage) return null;
  const ow = currentImage.naturalWidth;
  const oh = currentImage.naturalHeight;
  let w = parseFloat(widthIn.value);
  let h = parseFloat(heightIn.value);
  if (!isFinite(w) || w <= 0) w = ow;
  if (!isFinite(h) || h <= 0) h = oh;
  if (unit === 'pct') {
    w = Math.max(1, Math.round(ow * w / 100));
    h = Math.max(1, Math.round(oh * h / 100));
  } else {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
  }
  if (lockRatio.checked) {
    // Use whichever side shrinks more to keep the ratio
    const sw = w / ow;
    const sh = h / oh;
    const s = Math.min(sw, sh);
    w = Math.max(1, Math.round(ow * s));
    h = Math.max(1, Math.round(oh * s));
  }
  if (w > MAX_DIM || h > MAX_DIM) {
    alert('Maximum width / height is ' + MAX_DIM + 'px. (browser Canvas limit)');
    return null;
  }
  return { w: w, h: h, ow: ow, oh: oh };
}

function doResize() {
  if (!currentFile || !currentImage) return;
  const dims = targetDims();
  if (!dims) return;

  const canvas = document.createElement('canvas');
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const type = effectiveOutputType();

  if (type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(currentImage, 0, 0, dims.w, dims.h);

  const lossy = (type === 'image/jpeg' || type === 'image/webp');
  const quality = lossy ? parseFloat(qualityInput.value) : undefined;

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Resize failed. Your browser may not support this output format.');
      return;
    }
    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = URL.createObjectURL(blob);

    previewImg.src = currentObjectURL;
    origDim.textContent = dims.ow + '×' + dims.oh;
    newDim.textContent = dims.w + '×' + dims.h;
    origSize.textContent = fmtBytes(currentFile.size);
    newSize.textContent = fmtBytes(blob.size);

    const ext = type === 'image/jpeg' ? 'jpg'
              : type === 'image/webp' ? 'webp'
              : type === 'image/png'  ? 'png'
              : (currentFile.name.match(/\.([^.]+)$/) || [])[1] || 'img';
    const baseName = (currentFile.name || 'image').replace(/\.[^./]+$/, '');
    downloadBtn.href = currentObjectURL;
    downloadBtn.download = baseName + '-resized.' + ext;

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, type, quality);
}

// File input
fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) loadFile(f);
});

// Drag & drop
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
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

// Unit toggle
unitPx.addEventListener('click', () => setUnit('px'));
unitPct.addEventListener('click', () => setUnit('pct'));

// Width / height (with ratio lock)
widthIn.addEventListener('input', () => { lastEdited = 'w'; syncRatio(); });
heightIn.addEventListener('input', () => { lastEdited = 'h'; syncRatio(); });
lockRatio.addEventListener('change', () => { if (lockRatio.checked) syncRatio(); });

// Quality
qualityInput.addEventListener('input', () => {
  qualityValue.textContent = parseFloat(qualityInput.value).toFixed(2);
});
formatSel.addEventListener('change', updateQualityVisibility);

// Actions
resizeBtn.addEventListener('click', doResize);
clearBtn.addEventListener('click', clearAll);

updateQualityVisibility();
