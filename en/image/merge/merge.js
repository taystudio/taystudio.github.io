// 이미지 합치기 — 가로/세로/격자 배열, Canvas drawImage.

(function () {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const optRow = document.getElementById('optRow');
  const modeSel = document.getElementById('modeSel');
  const gridColsField = document.getElementById('gridColsField');
  const gridCols = document.getElementById('gridCols');
  const gapIn = document.getElementById('gapIn');
  const gapVal = document.getElementById('gapVal');
  const bgColor = document.getElementById('bgColor');
  const formatSel = document.getElementById('formatSel');
  const previewWrap = document.getElementById('previewWrap');
  const previewCanvas = document.getElementById('previewCanvas');
  const actionBar = document.getElementById('actionBar');
  const applyBtn = document.getElementById('applyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const zoomRow = document.getElementById('zoomRow');
  const zoomIn = document.getElementById('zoomIn');
  const zoomVal = document.getElementById('zoomVal');
  const zoomMinus = document.getElementById('zoomMinus');
  const zoomPlus = document.getElementById('zoomPlus');
  const zoomFit = document.getElementById('zoomFit');
  const dimVal = document.getElementById('dimVal');

  const state = { files: [], zoom: 1.0 };  // zoom = fit-scale 위 배율 (0.3~3.0)
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function fmtSize(n) { return n < 1024 ? n + 'B' : n < 1024*1024 ? (n/1024).toFixed(1)+'KB' : (n/1024/1024).toFixed(2)+'MB'; }

  fileInput.addEventListener('change', () => { if (fileInput.files.length) { addFiles(fileInput.files); fileInput.value = ''; } });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); });

  async function addFiles(files) {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const bitmap = await createImageBitmap(file);
        state.files.push({ id: uid(), file, bitmap });
      } catch (e) {}
    }
    refreshFileList();
    toggleUI();
    drawPreview();
  }

  function refreshFileList() {
    fileList.innerHTML = '';
    state.files.forEach((f, i) => {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.innerHTML = `
        <div class="order">${i + 1}</div>
        <div class="name">${f.file.name}</div>
        <div class="size">${fmtSize(f.file.size)}</div>
        <div class="row-actions">
          <button type="button" data-up="${f.id}" title="Move up">↑</button>
          <button type="button" data-dn="${f.id}" title="Move down">↓</button>
          <button type="button" data-rm="${f.id}" title="Remove">✕</button>
        </div>
      `;
      fileList.appendChild(div);
    });
    fileList.querySelectorAll('button[data-rm]').forEach(btn => btn.addEventListener('click', () => {
      state.files = state.files.filter(f => f.id !== btn.dataset.rm);
      refreshFileList(); toggleUI(); drawPreview();
    }));
    fileList.querySelectorAll('button[data-up]').forEach(btn => btn.addEventListener('click', () => {
      const i = state.files.findIndex(f => f.id === btn.dataset.up);
      if (i > 0) { [state.files[i-1], state.files[i]] = [state.files[i], state.files[i-1]]; refreshFileList(); drawPreview(); }
    }));
    fileList.querySelectorAll('button[data-dn]').forEach(btn => btn.addEventListener('click', () => {
      const i = state.files.findIndex(f => f.id === btn.dataset.dn);
      if (i >= 0 && i < state.files.length - 1) { [state.files[i+1], state.files[i]] = [state.files[i], state.files[i+1]]; refreshFileList(); drawPreview(); }
    }));
  }

  function toggleUI() {
    const has = state.files.length > 0;
    optRow.hidden = !has;
    zoomRow.hidden = !has;
    previewWrap.hidden = !has;
    actionBar.hidden = !has;
  }

  function setZoom(z, fromSlider) {
    state.zoom = Math.max(0.3, Math.min(3, z));
    if (!fromSlider) zoomIn.value = state.zoom;
    zoomVal.textContent = Math.round(state.zoom * 100) + '%';
    drawPreview();
  }
  zoomIn.addEventListener('input', () => setZoom(parseFloat(zoomIn.value), true));
  zoomMinus.addEventListener('click', () => setZoom(state.zoom - 0.1));
  zoomPlus.addEventListener('click', () => setZoom(state.zoom + 0.1));
  zoomFit.addEventListener('click', () => setZoom(1.0));

  modeSel.addEventListener('change', () => {
    gridColsField.toggleAttribute('data-show', modeSel.value === 'grid');
    drawPreview();
  });
  [gridCols, bgColor, formatSel].forEach(el => el.addEventListener('input', drawPreview));
  gapIn.addEventListener('input', () => { gapVal.textContent = gapIn.value; drawPreview(); });

  function drawPreview() {
    if (!state.files.length) return;
    const cv = compose();
    if (!cv) return;
    previewCanvas.width = cv.width;
    previewCanvas.height = cv.height;
    previewCanvas.getContext('2d').drawImage(cv, 0, 0);
    // CSS 사이즈 비례 유지 — fit-scale × zoom 배율.
    // Fit(=100%) 모드는 viewport 안에 들어오게, Zoom 100%↑면 overflow 스크롤로 큰 미리보기.
    const wrap = document.getElementById('previewWrap');
    const maxW = Math.max(200, wrap.clientWidth - 16);
    const maxH = window.innerHeight * 0.6;
    const fitScale = Math.min(1, maxW / cv.width, maxH / cv.height);
    const finalScale = fitScale * state.zoom;
    previewCanvas.style.width = Math.round(cv.width * finalScale) + 'px';
    previewCanvas.style.height = Math.round(cv.height * finalScale) + 'px';
    if (dimVal) dimVal.textContent = `${cv.width} × ${cv.height} px`;
  }
  window.addEventListener('resize', drawPreview);

  function compose() {
    const mode = modeSel.value;
    const gap = parseInt(gapIn.value, 10);
    const bg = bgColor.value;
    const bitmaps = state.files.map(f => f.bitmap);
    if (!bitmaps.length) return null;

    if (mode === 'horizontal') {
      const targetH = bitmaps[0].height;
      const widths = bitmaps.map(b => Math.round(b.width * (targetH / b.height)));
      const totalW = widths.reduce((a, b) => a + b, 0) + gap * (bitmaps.length - 1);
      const cv = document.createElement('canvas');
      cv.width = totalW; cv.height = targetH;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
      let x = 0;
      bitmaps.forEach((b, i) => {
        ctx.drawImage(b, x, 0, widths[i], targetH);
        x += widths[i] + gap;
      });
      return cv;
    }
    if (mode === 'vertical') {
      const targetW = bitmaps[0].width;
      const heights = bitmaps.map(b => Math.round(b.height * (targetW / b.width)));
      const totalH = heights.reduce((a, b) => a + b, 0) + gap * (bitmaps.length - 1);
      const cv = document.createElement('canvas');
      cv.width = targetW; cv.height = totalH;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
      let y = 0;
      bitmaps.forEach((b, i) => {
        ctx.drawImage(b, 0, y, targetW, heights[i]);
        y += heights[i] + gap;
      });
      return cv;
    }
    if (mode === 'grid') {
      const cols = Math.max(1, parseInt(gridCols.value, 10) || 2);
      const rows = Math.ceil(bitmaps.length / cols);
      // 셀 = 첫 사진 사이즈 기준
      const cellW = bitmaps[0].width;
      const cellH = bitmaps[0].height;
      const totalW = cellW * cols + gap * (cols - 1);
      const totalH = cellH * rows + gap * (rows - 1);
      const cv = document.createElement('canvas');
      cv.width = totalW; cv.height = totalH;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
      bitmaps.forEach((b, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const cx = c * (cellW + gap), cy = r * (cellH + gap);
        // contain fit
        const scale = Math.min(cellW / b.width, cellH / b.height);
        const w = b.width * scale, h = b.height * scale;
        const dx = cx + (cellW - w) / 2, dy = cy + (cellH - h) / 2;
        ctx.drawImage(b, dx, dy, w, h);
      });
      return cv;
    }
    return null;
  }

  applyBtn.addEventListener('click', async () => {
    const cv = compose();
    if (!cv) return;
    const fmt = formatSel.value;
    const ext = fmt === 'image/png' ? 'png' : 'jpg';
    const blob = await new Promise(res => cv.toBlob(res, fmt, 0.92));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `merged_${Date.now()}.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  clearBtn.addEventListener('click', () => {
    state.files.forEach(f => f.bitmap.close && f.bitmap.close());
    state.files = [];
    refreshFileList(); toggleUI();
  });
})();
