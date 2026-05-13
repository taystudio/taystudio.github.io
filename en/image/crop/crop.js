/**
 * Image Crop — Canvas 2D API + Pointer Events.
 * Last verified: 2026-05-09
 *
 * Flow:
 *  1. Upload one image → keep original Image + build a transformedCanvas with rotation / flip applied
 *  2. Draw transformedCanvas onto srcCanvas + DOM crop-rect overlay shows the rectangle
 *  3. User interaction:
 *     - 7 ratio presets (free, 1:1, 4:3, 16:9, 9:16, 3:2, 4:5)
 *     - 5 rotate/flip actions (↻, ↺, 180°, flipH, flipV) + reset
 *     - Drag inside rect to move; 8 handles (4 corners + 4 edges) to resize
 *  4. Apply crop = output canvas drawImage(transformedCanvas, crop area) → toBlob → blob URL
 *
 * Coordinates: crop = {x, y, w, h} is in transformedCanvas pixel space.
 *              DOM overlay positions are scaled via getBoundingClientRect / canvas.width.
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const optRow = document.getElementById('optRow');
const ratioButtons = document.getElementById('ratioButtons');
const formatSel = document.getElementById('formatSel');
const qualityRow = document.getElementById('qualityRow');
const qualityIn = document.getElementById('qualityIn');
const qualityVal = document.getElementById('qualityVal');
const cropStage = document.getElementById('cropStage');
const srcCanvas = document.getElementById('srcCanvas');
const cropOverlay = document.getElementById('cropOverlay');
const cropRect = document.getElementById('cropRect');
const cropInfo = document.getElementById('cropInfo');
const actionBar = document.getElementById('actionBar');
const cropBtn = document.getElementById('cropBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const newSize = document.getElementById('newSize');
const newBytes = document.getElementById('newBytes');
const downloadBtn = document.getElementById('downloadBtn');
const resultPreview = document.getElementById('resultPreview');

let originalImg = null; // HTMLImageElement
let originalFile = null;
let transformedCanvas = null; // canvas with rotation / flip applied
let rotation = 0; // 0/90/180/270 (cumulative angle baked into transformedCanvas)
let flipH = false;
let flipV = false;
let crop = { x: 0, y: 0, w: 0, h: 0 }; // transformedCanvas pixel space
let aspectRatio = 0; // 0 = free
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

function rebuildTransformedCanvas() {
  if (!originalImg) return;
  const w = originalImg.naturalWidth;
  const h = originalImg.naturalHeight;
  const rotated = rotation === 90 || rotation === 270;
  const c = document.createElement('canvas');
  c.width = rotated ? h : w;
  c.height = rotated ? w : h;
  const ctx = c.getContext('2d');
  ctx.save();
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(originalImg, -w / 2, -h / 2, w, h);
  ctx.restore();
  transformedCanvas = c;
  // Render onto srcCanvas
  srcCanvas.width = c.width;
  srcCanvas.height = c.height;
  srcCanvas.getContext('2d').drawImage(c, 0, 0);
}

function getDisplayScale() {
  const rect = srcCanvas.getBoundingClientRect();
  return {
    sx: rect.width / srcCanvas.width,
    sy: rect.height / srcCanvas.height,
  };
}

function applyCropRectStyle() {
  if (!transformedCanvas) return;
  const { sx, sy } = getDisplayScale();
  cropRect.style.left = (crop.x * sx) + 'px';
  cropRect.style.top = (crop.y * sy) + 'px';
  cropRect.style.width = (crop.w * sx) + 'px';
  cropRect.style.height = (crop.h * sy) + 'px';
  cropInfo.hidden = false;
  cropInfo.textContent =
    `Crop area ${Math.round(crop.w)} × ${Math.round(crop.h)} px` +
    (aspectRatio > 0 ? ` (ratio ${aspectRatio.toFixed(2)}:1)` : ' (free)');
}

function clampCrop() {
  if (!transformedCanvas) return;
  const W = transformedCanvas.width;
  const H = transformedCanvas.height;
  if (crop.w < MIN_SIZE) crop.w = MIN_SIZE;
  if (crop.h < MIN_SIZE) crop.h = MIN_SIZE;
  if (crop.w > W) crop.w = W;
  if (crop.h > H) crop.h = H;
  if (crop.x < 0) crop.x = 0;
  if (crop.y < 0) crop.y = 0;
  if (crop.x + crop.w > W) crop.x = W - crop.w;
  if (crop.y + crop.h > H) crop.y = H - crop.h;
}

function setRatio(ratio) {
  aspectRatio = ratio;
  if (!transformedCanvas) return;
  const W = transformedCanvas.width;
  const H = transformedCanvas.height;
  if (ratio <= 0) {
    // Free — keep current area
  } else {
    // Largest rectangle for this ratio, centered on current crop center
    const cx = crop.x + crop.w / 2;
    const cy = crop.y + crop.h / 2;
    let nw, nh;
    if (W / H > ratio) {
      nh = Math.min(crop.h, H);
      nw = nh * ratio;
      if (nw > W) { nw = W; nh = nw / ratio; }
    } else {
      nw = Math.min(crop.w, W);
      nh = nw / ratio;
      if (nh > H) { nh = H; nw = nh * ratio; }
    }
    crop.w = nw;
    crop.h = nh;
    crop.x = cx - nw / 2;
    crop.y = cy - nh / 2;
    clampCrop();
  }
  applyCropRectStyle();
}

function resetCropToFull() {
  if (!transformedCanvas) return;
  crop = { x: 0, y: 0, w: transformedCanvas.width, h: transformedCanvas.height };
  if (aspectRatio > 0) setRatio(aspectRatio);
  else applyCropRectStyle();
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'Image')) return;
  originalFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    originalImg = img;
    rotation = 0; flipH = false; flipV = false;
    rebuildTransformedCanvas();
    resetCropToFull();
    cropStage.hidden = false;
    optRow.hidden = false;
    actionBar.hidden = false;
    result.hidden = true;
    dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('Could not load this image. The format may not be supported.');
  };
  img.src = url;
}

// ============ Pointer drag interaction ============

let dragMode = null; // 'move' | 'tl'|'tr'|'bl'|'br'|'tm'|'bm'|'lm'|'rm'
let dragStart = null; // { px, py (pointer client xy), crop snapshot }
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
  if (!transformedCanvas) return;
  e.preventDefault();
  const target = e.target.closest('.crop-handle');
  dragMode = target ? target.dataset.handle : 'move';
  const p = pointerToImage(e.clientX, e.clientY);
  dragStart = { px: p.x, py: p.y, crop: { ...crop } };
  dragPointerId = e.pointerId;
  cropRect.setPointerCapture(e.pointerId);
});

cropRect.addEventListener('pointermove', (e) => {
  if (!dragMode || !transformedCanvas) return;
  const p = pointerToImage(e.clientX, e.clientY);
  const dx = p.x - dragStart.px;
  const dy = p.y - dragStart.py;
  const W = transformedCanvas.width;
  const H = transformedCanvas.height;
  const s = dragStart.crop;

  if (dragMode === 'move') {
    crop.x = s.x + dx;
    crop.y = s.y + dy;
    crop.w = s.w; crop.h = s.h;
    clampCrop();
  } else {
    let nx = s.x, ny = s.y, nw = s.w, nh = s.h;

    // Per-handle behavior — free ratio default
    if (dragMode.includes('l')) { nx = s.x + dx; nw = s.w - dx; }
    if (dragMode.includes('r')) { nw = s.w + dx; }
    if (dragMode.includes('t')) { ny = s.y + dy; nh = s.h - dy; }
    if (dragMode.includes('b')) { nh = s.h + dy; }

    if (aspectRatio > 0) {
      // Locked ratio — corners drive both, edges expand symmetrically from center
      if (dragMode.length === 2) {
        // corner: pick larger relative change
        const wRatio = nw / s.w;
        const hRatio = nh / s.h;
        if (Math.abs(wRatio - 1) > Math.abs(hRatio - 1)) {
          nh = nw / aspectRatio;
        } else {
          nw = nh * aspectRatio;
        }
        // Position correction — anchor on opposite side
        if (dragMode.includes('l')) nx = (s.x + s.w) - nw;
        if (dragMode.includes('t')) ny = (s.y + s.h) - nh;
      } else {
        // edge: expand the other side symmetrically about center
        if (dragMode === 'tm' || dragMode === 'bm') {
          nw = nh * aspectRatio;
          nx = s.x + s.w / 2 - nw / 2;
        } else {
          nh = nw / aspectRatio;
          ny = s.y + s.h / 2 - nh / 2;
        }
      }
    }

    // Bounds check — prevent negative dimensions and clamp into canvas
    if (nw < MIN_SIZE) {
      // Too small — ignore
      return;
    }
    if (nh < MIN_SIZE) return;
    if (nx < 0) { nw += nx; nx = 0; }
    if (ny < 0) { nh += ny; ny = 0; }
    if (nx + nw > W) nw = W - nx;
    if (ny + nh > H) nh = H - ny;
    if (aspectRatio > 0) {
      // After clamping, re-apply ratio
      if (nw / aspectRatio > nh) nw = nh * aspectRatio;
      else nh = nw / aspectRatio;
    }
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

// ============ ratio · rotate buttons ============

ratioButtons.addEventListener('click', (e) => {
  const btn = e.target.closest('.ratio-btn');
  if (!btn) return;
  ratioButtons.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  setRatio(parseFloat(btn.dataset.ratio));
});

document.querySelector('.rotate-buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.rotate-btn');
  if (!btn || !originalImg) return;
  const act = btn.dataset.act;
  if (act === 'rotate-cw') rotation = (rotation + 90) % 360;
  else if (act === 'rotate-ccw') rotation = (rotation + 270) % 360;
  else if (act === 'rotate-180') rotation = (rotation + 180) % 360;
  else if (act === 'flip-h') flipH = !flipH;
  else if (act === 'flip-v') flipV = !flipV;
  else if (act === 'reset') { rotation = 0; flipH = false; flipV = false; }
  rebuildTransformedCanvas();
  resetCropToFull();
});

// ============ apply crop ============

async function applyCrop() {
  if (!transformedCanvas) return;
  const out = document.createElement('canvas');
  out.width = Math.round(crop.w);
  out.height = Math.round(crop.h);
  const ctx = out.getContext('2d');
  ctx.drawImage(
    transformedCanvas,
    Math.round(crop.x), Math.round(crop.y), Math.round(crop.w), Math.round(crop.h),
    0, 0, out.width, out.height
  );

  const format = formatSel.value;
  const mime = format === 'png' ? 'image/png' : (format === 'webp' ? 'image/webp' : 'image/jpeg');
  const ext = format === 'png' ? 'png' : (format === 'webp' ? 'webp' : 'jpg');
  const quality = format === 'png' ? undefined : Math.max(1, Math.min(100, parseInt(qualityIn.value, 10) || 90)) / 100;

  cropBtn.disabled = true;
  const orig = cropBtn.textContent;
  cropBtn.textContent = 'Processing...';
  try {
    const blob = await new Promise((resolve, reject) => {
      out.toBlob((b) => b ? resolve(b) : reject(new Error('canvas.toBlob failed')), mime, quality);
    });
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    const stem = (originalFile.name || 'image').replace(/\.[^/.]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = stem + '-cropped.' + ext;
    resultPreview.src = resultUrl;
    newSize.textContent = out.width + ' × ' + out.height + ' px';
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
  transformedCanvas = null;
  rotation = 0; flipH = false; flipV = false;
  fileInput.value = '';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  cropStage.hidden = true;
  optRow.hidden = true;
  actionBar.hidden = true;
  cropInfo.hidden = true;
  result.hidden = true;
  dropTitle.textContent = 'Drag a photo here, or click to choose';
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
