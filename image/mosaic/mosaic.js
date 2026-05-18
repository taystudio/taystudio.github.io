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
    boxes: [],   // { x, y, w, h, mode }  in image coords
    drawing: null,
    zoom: 1.0,   // fit-scale 위 배율 (0.3~3.0)
  };

  // 드래그 frame drop 방지:
  //  - committed 박스 합성 결과는 offscreen 캐시(`bakedCanvas`)에 보관
  //  - 드래그 중에는 캐시를 그대로 putImage하고 drawing rect만 stroke
  //  - 박스 추가·삭제·undo·reset·strength·mode 변경 시에만 invalidateBaked + rebuildBaked
  //  - 매 pointermove마다 N개 박스 재처리하지 않게 됨
  let bakedCanvas = null;
  let bakedDirty = true;
  let rafPending = false;
  let pendingShowDrawing = false;

  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); fileInput.value = ''; });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return; dropZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  // Ctrl+V 이미지 붙여넣기
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
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, '이미지')) return;
    // 이전 bitmap 명시 해제 — 새 파일 업로드 시 메모리 누수 차단
    if (state.bitmap && state.bitmap.close) state.bitmap.close();
    try {
      state.bitmap = await createImageBitmap(file);
    } catch (e) {
      alert('이미지를 불러오지 못했습니다. 손상된 파일이거나 지원하지 않는 형식입니다.');
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
    strengthIn.disabled = isBlack;  // black mode는 강도 무효 → 키보드/SR 차단
    // mode 변경은 새 박스에만 영향 → 기존 박스 결과 무관. 캐시 invalidate 불필요.
  });
  strengthIn.addEventListener('input', () => {
    strengthVal.textContent = strengthIn.value;
    // strength는 박스에 retroactive 적용 → 캐시 invalidate 후 재합성
    invalidateBaked();
    redraw();
  });

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
    scheduleRedraw(true);
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
    // 5px MIN은 native pixel 기준. fitScale 0.25 화면에서 사용자가 그린 20px 박스가 silent drop되지 않도록
    // 화면 비율로 환산 후 비교. 추가적으로 fallback 1px floor도 적용.
    const rect = cv.getBoundingClientRect();
    const minNative = Math.max(1, 5 * (cv.width / Math.max(1, rect.width)));
    if (box.w >= minNative && box.h >= minNative) {
      state.boxes.push(box);
      invalidateBaked();
    }
    state.drawing = null;
    redraw();
  }

  // pointermove는 60Hz로 발생 → rAF로 throttle해 frame당 1회만 redraw
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
    // baked = 원본 + 모든 박스 합성 결과. drawing 중에는 그대로 putImage하고 drawing rect만 stroke.
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

  // applyBoxTo는 source canvas(=원본 그려진 baked) 위에서 영역만 변환해 같은 위치에 다시 그린다.
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
    // baked 위 drawing rect는 빠지도록 baked 그대로 인코딩
    if (bakedDirty) rebuildBaked();
    const exportSrc = bakedCanvas || cv;
    // JPG 출력은 알파 미지원 → 흰 배경 fill
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
        alert('다운로드 생성 실패 — 브라우저가 해당 포맷을 지원하지 않거나 메모리 부족 가능성. 포맷을 변경해 다시 시도하세요.');
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
