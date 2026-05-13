// 모자이크/블러 — 박스 그리기 + 픽셀화/블러/검정 처리.

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
    boxes: [],   // { x, y, w, h, mode, strength }  in image coords
    drawing: null,
    zoom: 1.0,   // fit-scale 위 배율 (0.3~3.0)
  };

  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); fileInput.value = ''; });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  async function loadFile(file) {
    if (!file.type.startsWith('image/')) return;
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'Image')) return;
    try {
      state.bitmap = await createImageBitmap(file);
    } catch (e) {
      alert('Failed to load image. The file may be corrupted or in an unsupported format.');
      return;
    }
    state.fileName = file.name;
    state.boxes = [];
    toggleUI(true);
    fitCanvas();
    redraw();
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
    strengthField.style.opacity = modeSel.value === 'black' ? 0.4 : 1;
    redraw();
  });
  strengthIn.addEventListener('input', () => { strengthVal.textContent = strengthIn.value; redraw(); });

  // Pointer Events로 마우스·터치·펜 통합. setPointerCapture로 캔버스 밖 추적까지 안전.
  // rect.width = 실제 렌더된 CSS width, cv.width = native pixel. 둘 비율로 정확한 native 좌표 환산.
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
    redraw(true);
  }
  function endDraw(e) {
    if (!state.drawing) return;
    e.preventDefault();
    const d = state.drawing;
    // normalize negative w/h. mode만 박스에 고정(mosaic·blur·black 혼용 가능),
    // strength는 전역 슬라이더 값을 redraw 시 매번 읽음 → 사후 조정 가능.
    const box = {
      x: Math.min(d.x, d.x + d.w),
      y: Math.min(d.y, d.y + d.h),
      w: Math.abs(d.w),
      h: Math.abs(d.h),
      mode: modeSel.value,
    };
    if (box.w > 5 && box.h > 5) {
      state.boxes.push(box);
    }
    state.drawing = null;
    redraw();
  }

  cv.addEventListener('pointerdown', startDraw);
  cv.addEventListener('pointermove', moveDraw);
  cv.addEventListener('pointerup', endDraw);
  cv.addEventListener('pointercancel', endDraw);

  function redraw(showDrawing) {
    if (!state.bitmap) return;
    const ctx = cv.getContext('2d');
    ctx.drawImage(state.bitmap, 0, 0);
    state.boxes.forEach(b => applyBox(ctx, b));
    if (showDrawing && state.drawing) {
      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(state.drawing.x, state.drawing.y, state.drawing.w, state.drawing.h);
      ctx.restore();
    }
  }

  function applyBox(ctx, box) {
    if (box.mode === 'black') {
      ctx.fillStyle = '#000';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      return;
    }
    // strength 매번 슬라이더에서 읽음 → 사후 조정 가능
    const strength = parseInt(strengthIn.value, 10);
    if (box.mode === 'mosaic') {
      // 픽셀화: 영역 → 작은 캔버스 → 다시 큰 캔버스 (smoothing off)
      const px = Math.max(2, Math.round(strength));
      const sw = Math.max(1, Math.floor(box.w / px));
      const sh = Math.max(1, Math.floor(box.h / px));
      const tmp = document.createElement('canvas');
      tmp.width = sw; tmp.height = sh;
      const tctx = tmp.getContext('2d');
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(cv, box.x, box.y, box.w, box.h, 0, 0, sw, sh);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, sw, sh, box.x, box.y, box.w, box.h);
      ctx.restore();
      return;
    }
    if (box.mode === 'blur') {
      // 가우시안: filter blur(N) 적용 + 영역만 클리핑
      const tmp = document.createElement('canvas');
      tmp.width = box.w; tmp.height = box.h;
      const tctx = tmp.getContext('2d');
      tctx.filter = `blur(${strength}px)`;
      tctx.drawImage(cv, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      ctx.drawImage(tmp, box.x, box.y);
    }
  }

  undoBtn.addEventListener('click', () => { state.boxes.pop(); redraw(); });
  resetBtn.addEventListener('click', () => { state.boxes = []; redraw(); });
  downloadBtn.addEventListener('click', () => {
    cv.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = state.fileName.replace(/\.[^.]+$/, '');
      a.download = `${base}_mosaic.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/jpeg', 0.95);
  });
  clearBtn.addEventListener('click', () => {
    state.bitmap && state.bitmap.close && state.bitmap.close();
    state.bitmap = null;
    state.boxes = [];
    state.fileName = '';
    toggleUI(false);
  });
})();
