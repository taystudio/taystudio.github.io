/**
 * 이미지 자르기 — Canvas 2D API + Pointer Events.
 * 최종 검증: 2026-05-06
 *
 * 동작:
 *  1. 이미지 1장 업로드 → 원본 Image 보관 + 회전·반전 적용한 transformedCanvas 생성
 *  2. transformedCanvas를 srcCanvas에 그림 + DOM crop-rect overlay로 사각형 표시
 *  3. 사용자 인터랙션:
 *     - 비율 프리셋 7종 (자유·1:1·4:3·16:9·9:16·3:2·4:5)
 *     - 회전·반전 5종 (↻·↺·180°·flipH·flipV) + 원래대로
 *     - drag rect: 안쪽 = 이동, 핸들 8개(corner 4 + edge 4) = 리사이즈
 *  4. 자르기 적용 = output canvas에 drawImage(transformedCanvas, crop영역) → toBlob → BlobURL
 *
 * 좌표계: crop = {x, y, w, h}는 transformedCanvas 픽셀 좌표 기준.
 *         DOM overlay 표시는 display(CSS) 크기 / scale 비율 변환.
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
let transformedCanvas = null; // 회전·반전 적용된 캔버스
let rotation = 0; // 0/90/180/270 (현재 transformedCanvas에 누적 적용된 각도)
let flipH = false;
let flipV = false;
let crop = { x: 0, y: 0, w: 0, h: 0 }; // transformedCanvas 픽셀 기준
let aspectRatio = 0; // 0 = 자유
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
  // srcCanvas에 그리기
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
    `크롭 영역 ${Math.round(crop.w)} × ${Math.round(crop.h)} px` +
    (aspectRatio > 0 ? ` (비율 ${aspectRatio.toFixed(2)}:1)` : ' (자유)');
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
    // 자유 — 현재 영역 유지
  } else {
    // 가운데 기준으로 비율에 맞게 가장 큰 사각형
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
    alert('이미지 파일만 선택해주세요.');
    return;
  }
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
    alert('이미지 로드 실패. 지원되지 않는 포맷일 수 있습니다.');
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

    // 핸들 별 동작 — 자유 비율 기본
    if (dragMode.includes('l')) { nx = s.x + dx; nw = s.w - dx; }
    if (dragMode.includes('r')) { nw = s.w + dx; }
    if (dragMode.includes('t')) { ny = s.y + dy; nh = s.h - dy; }
    if (dragMode.includes('b')) { nh = s.h + dy; }

    if (aspectRatio > 0) {
      // 비율 고정 — corner는 둘 다, edge는 가운데 기준 대칭 확장
      if (dragMode.length === 2) {
        // corner: w·h 중 큰 변화량 기준으로 결정
        const wRatio = nw / s.w;
        const hRatio = nh / s.h;
        if (Math.abs(wRatio - 1) > Math.abs(hRatio - 1)) {
          nh = nw / aspectRatio;
        } else {
          nw = nh * aspectRatio;
        }
        // 위치 보정 — 핸들 반대편이 고정점
        if (dragMode.includes('l')) nx = (s.x + s.w) - nw;
        if (dragMode.includes('t')) ny = (s.y + s.h) - nh;
      } else {
        // edge: 다른 변을 비율 따라 가운데 기준 대칭
        if (dragMode === 'tm' || dragMode === 'bm') {
          nw = nh * aspectRatio;
          nx = s.x + s.w / 2 - nw / 2;
        } else {
          nh = nw / aspectRatio;
          ny = s.y + s.h / 2 - nh / 2;
        }
      }
    }

    // bounds 제약 — 음수 크기 방지 + 캔버스 안에 끼우기
    if (nw < MIN_SIZE) {
      // 너무 작으면 무시
      return;
    }
    if (nh < MIN_SIZE) return;
    if (nx < 0) { nw += nx; nx = 0; }
    if (ny < 0) { nh += ny; ny = 0; }
    if (nx + nw > W) nw = W - nx;
    if (ny + nh > H) nh = H - ny;
    if (aspectRatio > 0) {
      // bounds 잘린 후 비율 다시 맞추기
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

// ============ ratio·rotate buttons ============

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
  cropBtn.textContent = '처리 중...';
  try {
    const blob = await new Promise((resolve, reject) => {
      out.toBlob((b) => b ? resolve(b) : reject(new Error('canvas.toBlob 실패')), mime, quality);
    });
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    const stem = (originalFile.name || 'image').replace(/\.[^/.]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(stem + '-cropped.' + ext) : stem + '-cropped.' + ext);
    resultPreview.src = resultUrl;
    newSize.textContent = out.width + ' × ' + out.height + ' px';
    newBytes.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('자르기 실패: ' + (e && e.message ? e.message : '알 수 없는 오류'));
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
  dropTitle.textContent = '사진 1장을 드래그하거나 클릭해서 선택';
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
