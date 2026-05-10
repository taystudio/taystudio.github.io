/**
 * ID / Passport Photo Maker — Canvas 2D API + Pointer Events.
 * Last verified: 2026-05-09
 *
 * Flow:
 *  1. Upload one image → drawn onto srcCanvas
 *  2. Pick a preset (e.g. US Passport 51×51mm) → aspectRatio = w/h, output px = mm × 300/25.4
 *  3. Crop frame is locked to the chosen ratio. User drags + uses 4 corner handles to position/resize
 *  4. Guide lines (top, eyes, chin) shown as overlay
 *  5. Apply crop:
 *     - output canvas = standard pixels (e.g. 602×602 for 51×51mm)
 *     - White-bg option fills white first
 *     - drawImage(srcCanvas, crop area, 0, 0, output px) auto-resamples
 *     - toBlob → blob URL
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const optRow = document.getElementById('optRow');
const presetButtons = document.getElementById('presetButtons');
const customMmRow = document.getElementById('customMmRow');
const customW = document.getElementById('customW');
const customH = document.getElementById('customH');
const formatSel = document.getElementById('formatSel');
const qualityRow = document.getElementById('qualityRow');
const qualityIn = document.getElementById('qualityIn');
const qualityVal = document.getElementById('qualityVal');
const whiteBgChk = document.getElementById('whiteBgChk');
const infoRow = document.getElementById('infoRow');
const mmInfo = document.getElementById('mmInfo');
const pxInfo = document.getElementById('pxInfo');
const frameInfo = document.getElementById('frameInfo');
const cropStage = document.getElementById('cropStage');
const srcCanvas = document.getElementById('srcCanvas');
const cropOverlay = document.getElementById('cropOverlay');
const cropRect = document.getElementById('cropRect');
const actionBar = document.getElementById('actionBar');
const cropBtn = document.getElementById('cropBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const outSize = document.getElementById('outSize');
const newBytes = document.getElementById('newBytes');
const downloadBtn = document.getElementById('downloadBtn');
const resultPreview = document.getElementById('resultPreview');

const MM_PER_INCH = 25.4;
const DPI = 300;
const MM_TO_PX = DPI / MM_PER_INCH; // ≈ 11.811

let originalImg = null;
let originalFile = null;
let crop = { x: 0, y: 0, w: 0, h: 0 }; // srcCanvas pixel space
let widthMm = 51;
let heightMm = 51;
let resultUrl = null;
const MIN_SIZE = 16;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateQualityVisibility() {
  qualityRow.style.display = formatSel.value === 'png' ? 'none' : '';
}

function getDisplayScale() {
  const rect = srcCanvas.getBoundingClientRect();
  return {
    sx: rect.width / srcCanvas.width,
    sy: rect.height / srcCanvas.height,
  };
}

function applyCropRectStyle() {
  if (!originalImg) return;
  const { sx, sy } = getDisplayScale();
  cropRect.style.left = (crop.x * sx) + 'px';
  cropRect.style.top = (crop.y * sy) + 'px';
  cropRect.style.width = (crop.w * sx) + 'px';
  cropRect.style.height = (crop.h * sy) + 'px';
  frameInfo.textContent = `${Math.round(crop.w)} × ${Math.round(crop.h)} px (source area)`;
}

function clampCrop() {
  if (!originalImg) return;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  if (crop.w < MIN_SIZE) crop.w = MIN_SIZE;
  if (crop.h < MIN_SIZE) crop.h = MIN_SIZE;
  if (crop.w > W) crop.w = W;
  if (crop.h > H) crop.h = H;
  if (crop.x < 0) crop.x = 0;
  if (crop.y < 0) crop.y = 0;
  if (crop.x + crop.w > W) crop.x = W - crop.w;
  if (crop.y + crop.h > H) crop.y = H - crop.h;
}

function setSize(wMm, hMm) {
  widthMm = wMm;
  heightMm = hMm;
  const ratio = wMm / hMm;
  mmInfo.textContent = `${wMm} × ${hMm} mm`;
  pxInfo.textContent = `${Math.round(wMm * MM_TO_PX)} × ${Math.round(hMm * MM_TO_PX)} px`;
  if (!originalImg) return;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  // Largest rectangle for ratio, centered on current crop
  const cx = crop.x + crop.w / 2 || W / 2;
  const cy = crop.y + crop.h / 2 || H / 2;
  let nw, nh;
  if (W / H > ratio) {
    nh = Math.min(crop.h || H * 0.8, H);
    nw = nh * ratio;
    if (nw > W) { nw = W; nh = nw / ratio; }
  } else {
    nw = Math.min(crop.w || W * 0.8, W);
    nh = nw / ratio;
    if (nh > H) { nh = H; nw = nh * ratio; }
  }
  crop.w = nw;
  crop.h = nh;
  crop.x = cx - nw / 2;
  crop.y = cy - nh / 2;
  clampCrop();
  applyCropRectStyle();
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    return;
  }
  originalFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    originalImg = img;
    srcCanvas.width = img.naturalWidth;
    srcCanvas.height = img.naturalHeight;
    srcCanvas.getContext('2d').drawImage(img, 0, 0);
    cropStage.hidden = false;
    optRow.hidden = false;
    actionBar.hidden = false;
    infoRow.hidden = false;
    result.hidden = true;
    crop = { x: 0, y: 0, w: 0, h: 0 };
    setSize(widthMm, heightMm); // initial frame
    dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('Could not load this image. The format may not be supported.');
  };
  img.src = url;
}

// ============ Pointer drag ============

let dragMode = null;
let dragStart = null;
let dragPointerId = null;

function pointerToImage(clientX, clientY) {
  const rect = srcCanvas.getBoundingClientRect();
  const { sx, sy } = getDisplayScale();
  return {
    x: (clientX - rect.left) / sx,
    y: (clientY - rect.top) / sy,
  };
}

cropRect.addEventListener('pointerdown', (e) => {
  if (!originalImg) return;
  e.preventDefault();
  const target = e.target.closest('.crop-handle');
  dragMode = target ? target.dataset.handle : 'move';
  const p = pointerToImage(e.clientX, e.clientY);
  dragStart = { px: p.x, py: p.y, crop: { ...crop } };
  dragPointerId = e.pointerId;
  cropRect.setPointerCapture(e.pointerId);
});

cropRect.addEventListener('pointermove', (e) => {
  if (!dragMode || !originalImg) return;
  const p = pointerToImage(e.clientX, e.clientY);
  const dx = p.x - dragStart.px;
  const dy = p.y - dragStart.py;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  const s = dragStart.crop;
  const ratio = widthMm / heightMm;

  if (dragMode === 'move') {
    crop.x = s.x + dx;
    crop.y = s.y + dy;
    crop.w = s.w; crop.h = s.h;
    clampCrop();
  } else {
    let nx = s.x, ny = s.y, nw = s.w, nh = s.h;
    if (dragMode.includes('l')) { nx = s.x + dx; nw = s.w - dx; }
    if (dragMode.includes('r')) { nw = s.w + dx; }
    if (dragMode.includes('t')) { ny = s.y + dy; nh = s.h - dy; }
    if (dragMode.includes('b')) { nh = s.h + dy; }
    // Force ratio — corner: pick larger relative change
    const wRatio = Math.abs(nw - s.w);
    const hRatio = Math.abs(nh - s.h);
    if (wRatio > hRatio) nh = nw / ratio;
    else nw = nh * ratio;
    // Position correction — anchor on opposite side
    if (dragMode.includes('l')) nx = (s.x + s.w) - nw;
    if (dragMode.includes('t')) ny = (s.y + s.h) - nh;
    if (nw < MIN_SIZE || nh < MIN_SIZE) return;
    if (nx < 0) { nw += nx; nh = nw / ratio; nx = 0; }
    if (ny < 0) { nh += ny; nw = nh * ratio; ny = 0; }
    if (nx + nw > W) { nw = W - nx; nh = nw / ratio; }
    if (ny + nh > H) { nh = H - ny; nw = nh * ratio; }
    crop = { x: nx, y: ny, w: nw, h: nh };
    clampCrop();
  }
  applyCropRectStyle();
});

['pointerup', 'pointercancel'].forEach(ev => {
  cropRect.addEventListener(ev, (e) => {
    dragMode = null;
    dragStart = null;
    if (dragPointerId !== null && cropRect.hasPointerCapture(dragPointerId)) {
      cropRect.releasePointerCapture(dragPointerId);
    }
    dragPointerId = null;
  });
});

window.addEventListener('resize', applyCropRectStyle);

// ============ preset buttons ============

presetButtons.addEventListener('click', (e) => {
  const btn = e.target.closest('.preset-btn');
  if (!btn) return;
  presetButtons.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const w = parseFloat(btn.dataset.w);
  const h = parseFloat(btn.dataset.h);
  if (w > 0 && h > 0) {
    customMmRow.classList.remove('show');
    setSize(w, h);
  } else {
    customMmRow.classList.add('show');
    customW.value = widthMm;
    customH.value = heightMm;
  }
});

[customW, customH].forEach(el => {
  el.addEventListener('input', () => {
    const w = parseFloat(customW.value) || 1;
    const h = parseFloat(customH.value) || 1;
    setSize(w, h);
  });
});

// ============ apply crop ============

async function applyCrop() {
  if (!originalImg) return;
  const targetW = Math.round(widthMm * MM_TO_PX);
  const targetH = Math.round(heightMm * MM_TO_PX);
  const out = document.createElement('canvas');
  out.width = targetW;
  out.height = targetH;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (whiteBgChk.checked) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(
    srcCanvas,
    Math.round(crop.x), Math.round(crop.y), Math.round(crop.w), Math.round(crop.h),
    0, 0, targetW, targetH
  );

  const format = formatSel.value;
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  const quality = format === 'png' ? undefined : Math.max(1, Math.min(100, parseInt(qualityIn.value, 10) || 95)) / 100;

  cropBtn.disabled = true;
  const orig = cropBtn.textContent;
  cropBtn.textContent = 'Processing...';
  try {
    const blob = await new Promise((resolve, reject) => {
      out.toBlob((b) => b ? resolve(b) : reject(new Error('canvas.toBlob failed')), mime, quality);
    });
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    const stem = (originalFile.name || 'photo').replace(/\.[^/.]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = `${stem}-${widthMm}x${heightMm}mm.${ext}`;
    resultPreview.src = resultUrl;
    outSize.textContent = `${targetW} × ${targetH} px (${widthMm}×${heightMm}mm)`;
    newBytes.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('Crop failed: ' + (e && e.message ? e.message : 'unknown error'));
  } finally {
    cropBtn.textContent = orig;
    cropBtn.disabled = false;
  }
}

function clearAll() {
  originalImg = null;
  originalFile = null;
  crop = { x: 0, y: 0, w: 0, h: 0 };
  fileInput.value = '';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  cropStage.hidden = true;
  optRow.hidden = true;
  actionBar.hidden = true;
  infoRow.hidden = true;
  result.hidden = true;
  customMmRow.classList.remove('show');
  dropTitle.textContent = 'Drag a photo here, or click to choose';
  // Reset to first preset (US Passport)
  presetButtons.querySelectorAll('.preset-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  widthMm = 51; heightMm = 51;
  mmInfo.textContent = '51 × 51 mm';
  pxInfo.textContent = '602 × 602 px';
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

formatSel.addEventListener('change', updateQualityVisibility);
qualityIn.addEventListener('input', () => { qualityVal.textContent = qualityIn.value; });
cropBtn.addEventListener('click', applyCrop);
clearBtn.addEventListener('click', clearAll);

updateQualityVisibility();
// Initial info display
mmInfo.textContent = '51 × 51 mm';
pxInfo.textContent = '602 × 602 px';
frameInfo.textContent = '—';
