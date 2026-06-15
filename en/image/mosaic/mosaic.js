// Mosaic / blur — draw boxes + pixelate / blur / black-out.

(function () {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const optRow = document.getElementById('optRow');
  const modeSel = document.getElementById('modeSel');
  const strengthIn = document.getElementById('strengthIn');
  const strengthVal = document.getElementById('strengthVal');
  const strengthField = document.getElementById('strengthField');
  const helpTip = document.getElementById('helpTip');
  const editorWrap = document.getElementById('editorWrap');
  const cv = document.getElementById('editorCanvas');
  const actionBar = document.getElementById('actionBar');
  const undoBtn = document.getElementById('undoBtn');
  const resetBtn = document.getElementById('resetBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const zoomRow = document.getElementById('zoomRow');
  const zoomIn = document.getElementById('zoomIn');
  const zoomVal = document.getElementById('zoomVal');
  const zoomMinus = document.getElementById('zoomMinus');
  const zoomPlus = document.getElementById('zoomPlus');
  const zoomFit = document.getElementById('zoomFit');
  const dimVal = document.getElementById('dimVal');

  const state = {
    bitmap: null,
    fileName: '',
    boxes: [],   // { x, y, w, h, mode }  in image coords
    drawing: null,
    zoom: 1.0,   // multiplier on top of fit-scale (0.3~3.0)
  };

  // Drag frame-drop avoidance:
  //  - committed boxes composited into an offscreen cache (`bakedCanvas`)
  //  - while dragging, putImage the cache as-is and only stroke the drawing rect
  //  - invalidateBaked + rebuildBaked only on add/remove/undo/reset/strength/mode change
  //  - avoids reprocessing N boxes on every pointermove
  let bakedCanvas = null;
  let bakedDirty = true;
  let rafPending = false;
  let pendingShowDrawing = false;

  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); fileInput.value = ''; });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return; dropZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  // Ctrl+V paste image
  if (window.TayStudio && TayStudio.bindPasteImage) {
    TayStudio.bindPasteImage(files => { loadFile(files[0]); });
  }
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  async function loadFile(file) {
    if (!file.type.startsWith('image/')) return;
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'Image')) return;
    // Explicitly release previous bitmap — prevent memory leak on re-upload
    if (state.bitmap && state.bitmap.close) state.bitmap.close();
    try {
      state.bitmap = await createImageBitmap(file);
    } catch (e) {
      alert('Failed to load image. The file may be corrupted or in an unsupported format.');
      return;
    }
    state.fileName = file.name;
    state.boxes = [];
    bakedDirty = true;
    toggleUI(true);
    fitCanvas();
    redraw();
  }

  function invalidateBaked() { bakedDirty = true; }

  function rebuildBaked() {
    if (!state.bitmap) return;
    if (!bakedCanvas) bakedCanvas = document.createElement('canvas');
    if (bakedCanvas.width !== cv.width || bakedCanvas.height !== cv.height) {
      bakedCanvas.width = cv.width;
      bakedCanvas.height = cv.height;
    }
    const bctx = bakedCanvas.getContext('2d');
    bctx.clearRect(0, 0, bakedCanvas.width, bakedCanvas.height);
    bctx.drawImage(state.bitmap, 0, 0);
    state.boxes.forEach(b => applyBoxTo(bctx, bakedCanvas, b));
    bakedDirty = false;
  }

  function fitCanvas() {
    const w = state.bitmap.width;
    const h = state.bitmap.height;
    cv.width = w;
    cv.height = h;
    applyZoom();
    if (dimVal) dimVal.textContent = `${w} × ${h} px`;
  }

  function applyZoom() {
    if (!state.bitmap) return;
    const wrap = document.getElementById('editorWrap');
    const maxW = Math.max(200, wrap.clientWidth - 16);
    const maxH = Math.max(280, window.innerHeight * 0.6);
    const fitScale = Math.min(1, maxW / cv.width, maxH / cv.height);
    const finalScale = fitScale * state.zoom;
    cv.style.width = Math.round(cv.width * finalScale) + 'px';
    cv.style.height = Math.round(cv.height * finalScale) + 'px';
  }

  function setZoom(z, fromSlider) {
    state.zoom = Math.max(0.3, Math.min(3, z));
    if (!fromSlider) zoomIn.value = state.zoom;
    zoomVal.textContent = Math.round(state.zoom * 100) + '%';
    applyZoom();
  }
  zoomIn.addEventListener('input', () => setZoom(parseFloat(zoomIn.value), true));
  zoomMinus.addEventListener('click', () => setZoom(state.zoom - 0.1));
  zoomPlus.addEventListener('click', () => setZoom(state.zoom + 0.1));
  zoomFit.addEventListener('click', () => setZoom(1.0));
  window.addEventListener('resize', () => { if (state.bitmap) applyZoom(); });

  function toggleUI(has) {
    optRow.hidden = !has;
    helpTip.hidden = !has;
    zoomRow.hidden = !has;
    editorWrap.hidden = !has;
    actionBar.hidden = !has;
  }

  modeSel.addEventListener('change', () => {
    const isBlack = modeSel.value === 'black';
    strengthField.style.opacity = isBlack ? 0.4 : 1;
    strengthIn.disabled = isBlack;  // black mode ignores strength → block keyboard/SR
    // mode change only affects new boxes → existing box results unchanged. No cache invalidate needed.
  });
  strengthIn.addEventListener('input', () => {
    strengthVal.textContent = strengthIn.value;
    // strength applies retroactively to boxes → invalidate cache and recomposite
    invalidateBaked();
    redraw();
  });

  // Pointer Events unify mouse/touch/pen. setPointerCapture keeps tracking outside the canvas.
  // rect.width = rendered CSS width, cv.width = native pixels. Ratio gives exact native coords.
  function evtPos(e) {
    const rect = cv.getBoundingClientRect();
    const sx = cv.width / rect.width;
    const sy = cv.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    return { x: Math.max(0, Math.min(cv.width, x)), y: Math.max(0, Math.min(cv.height, y)) };
  }

  function startDraw(e) {
    if (!state.bitmap) return;
    e.preventDefault();
    if (e.pointerId !== undefined && cv.setPointerCapture) cv.setPointerCapture(e.pointerId);
    const p = evtPos(e);
    state.drawing = { x: p.x, y: p.y, w: 0, h: 0 };
  }
  function moveDraw(e) {
    if (!state.drawing) return;
    e.preventDefault();
    const p = evtPos(e);
    state.drawing.w = p.x - state.drawing.x;
    state.drawing.h = p.y - state.drawing.y;
    scheduleRedraw(true);
  }
  function endDraw(e) {
    if (!state.drawing) return;
    e.preventDefault();
    const d = state.drawing;
    // normalize negative w/h. Only mode is fixed per box (mosaic/blur/black can be mixed);
    // strength reads the global slider on each redraw → can be adjusted afterwards.
    const box = {
      x: Math.min(d.x, d.x + d.w),
      y: Math.min(d.y, d.y + d.h),
      w: Math.abs(d.w),
      h: Math.abs(d.h),
      mode: modeSel.value,
    };
    // 5px MIN is in native pixels. At fitScale 0.25 a 20px box the user drew shouldn't be
    // silently dropped, so convert by screen ratio before comparing. Plus a 1px floor fallback.
    const rect = cv.getBoundingClientRect();
    const minNative = Math.max(1, 5 * (cv.width / Math.max(1, rect.width)));
    if (box.w >= minNative && box.h >= minNative) {
      state.boxes.push(box);
      invalidateBaked();
    }
    state.drawing = null;
    redraw();
  }

  // pointermove fires at ~60Hz → throttle with rAF so redraw runs once per frame
  function scheduleRedraw(showDrawing) {
    if (showDrawing) pendingShowDrawing = true;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      const sd = pendingShowDrawing;
      pendingShowDrawing = false;
      redraw(sd);
    });
  }

  cv.addEventListener('pointerdown', startDraw);
  cv.addEventListener('pointermove', moveDraw);
  cv.addEventListener('pointerup', endDraw);
  cv.addEventListener('pointercancel', endDraw);

  function redraw(showDrawing) {
    if (!state.bitmap) return;
    if (bakedDirty) rebuildBaked();
    const ctx = cv.getContext('2d');
    // baked = original + all boxes composited. While drawing, putImage as-is and only stroke the drawing rect.
    ctx.drawImage(bakedCanvas, 0, 0);
    if (showDrawing && state.drawing) {
      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(state.drawing.x, state.drawing.y, state.drawing.w, state.drawing.h);
      ctx.restore();
    }
  }

  // applyBoxTo transforms only the region on the source canvas (baked with original drawn) and redraws it in place.
  function applyBoxTo(ctx, srcCanvas, box) {
    if (box.mode === 'black') {
      ctx.fillStyle = '#000';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      return;
    }
    const strength = parseInt(strengthIn.value, 10);
    if (box.mode === 'mosaic') {
      const px = Math.max(2, Math.round(strength));
      const sw = Math.max(1, Math.floor(box.w / px));
      const sh = Math.max(1, Math.floor(box.h / px));
      const tmp = document.createElement('canvas');
      tmp.width = sw; tmp.height = sh;
      const tctx = tmp.getContext('2d');
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(srcCanvas, box.x, box.y, box.w, box.h, 0, 0, sw, sh);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, sw, sh, box.x, box.y, box.w, box.h);
      ctx.restore();
      return;
    }
    if (box.mode === 'blur') {
      const tmp = document.createElement('canvas');
      tmp.width = box.w; tmp.height = box.h;
      const tctx = tmp.getContext('2d');
      tctx.filter = `blur(${strength}px)`;
      tctx.drawImage(srcCanvas, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      ctx.drawImage(tmp, box.x, box.y);
    }
  }

  undoBtn.addEventListener('click', () => { state.boxes.pop(); invalidateBaked(); redraw(); });
  resetBtn.addEventListener('click', () => { state.boxes = []; invalidateBaked(); redraw(); });
  downloadBtn.addEventListener('click', () => {
    const fmtSel = document.getElementById('mosaicFormat');
    const outMime = (fmtSel && fmtSel.value) || 'image/jpeg';
    const outExt = outMime === 'image/png' ? 'png' : outMime === 'image/webp' ? 'webp' : 'jpg';
    const outQuality = outMime === 'image/png' ? undefined : 0.95;
    // encode baked as-is so the drawing rect isn't included
    if (bakedDirty) rebuildBaked();
    const exportSrc = bakedCanvas || cv;
    // JPG output has no alpha → fill white background
    let encodeSrc = exportSrc;
    if (outMime === 'image/jpeg') {
      const tmp = document.createElement('canvas');
      tmp.width = exportSrc.width; tmp.height = exportSrc.height;
      const tctx = tmp.getContext('2d');
      tctx.fillStyle = '#ffffff';
      tctx.fillRect(0, 0, tmp.width, tmp.height);
      tctx.drawImage(exportSrc, 0, 0);
      encodeSrc = tmp;
    }
    encodeSrc.toBlob(blob => {
      if (!blob) {
        alert('Failed to create download — your browser may not support this format, or it may be out of memory. Try a different format.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = state.fileName.replace(/\.[^.]+$/, '');
      const name = `${base}_mosaic.${outExt}`;
      a.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(name) : name);
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, outMime, outQuality);
  });
  clearBtn.addEventListener('click', () => {
    state.bitmap && state.bitmap.close && state.bitmap.close();
    state.bitmap = null;
    state.boxes = [];
    state.fileName = '';
    bakedDirty = true;
    toggleUI(false);
  });
})();
