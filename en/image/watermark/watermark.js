// Image watermark — text / logo overlay, Canvas API.

(function () {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const wmTabs = document.getElementById('wmTabs');
  const panelText = document.getElementById('panelText');
  const panelImage = document.getElementById('panelImage');
  const commonOpts = document.getElementById('commonOpts');
  const previewWrap = document.getElementById('previewWrap');
  const previewCanvas = document.getElementById('previewCanvas');
  const actionBar = document.getElementById('actionBar');
  const applyBtn = document.getElementById('applyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const result = document.getElementById('result');
  const newCount = document.getElementById('newCount');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const imgGrid = document.getElementById('imgGrid');

  const wmText = document.getElementById('wmText');
  const wmFont = document.getElementById('wmFont');
  const wmFontSize = document.getElementById('wmFontSize');
  const wmFontSizeVal = document.getElementById('wmFontSizeVal');
  const wmColor = document.getElementById('wmColor');
  const wmBold = document.getElementById('wmBold');
  const wmImg = document.getElementById('wmImg');
  const wmImgSize = document.getElementById('wmImgSize');
  const wmImgSizeVal = document.getElementById('wmImgSizeVal');
  const wmOpacity = document.getElementById('wmOpacity');
  const wmOpacityVal = document.getElementById('wmOpacityVal');
  const wmRotate = document.getElementById('wmRotate');
  const wmRotateVal = document.getElementById('wmRotateVal');
  const wmRepeat = document.getElementById('wmRepeat');
  const wmFormat = document.getElementById('wmFormat');
  const posGrid = document.getElementById('posGrid');

  const state = {
    files: [],
    results: [],
    mode: 'text',
    logoBitmap: null,
    pos: 'center',
  };

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function fmtSize(n) { return n < 1024 ? n + 'B' : n < 1024*1024 ? (n/1024).toFixed(1)+'KB' : (n/1024/1024).toFixed(2)+'MB'; }
  const esc = (window.TayStudio && window.TayStudio.escapeHtml) ? window.TayStudio.escapeHtml : (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  wmTabs.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      wmTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.tab;
      panelText.classList.toggle('active', state.mode === 'text');
      panelText.hidden = state.mode !== 'text';
      panelImage.classList.toggle('active', state.mode === 'image');
      panelImage.hidden = state.mode !== 'image';
      drawPreview();
    });
  });

  posGrid.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      posGrid.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.pos = btn.dataset.pos;
      drawPreview();
    });
  });

  wmFontSize.addEventListener('input', () => { wmFontSizeVal.textContent = wmFontSize.value; drawPreview(); });
  wmImgSize.addEventListener('input', () => { wmImgSizeVal.textContent = wmImgSize.value; drawPreview(); });
  wmOpacity.addEventListener('input', () => { wmOpacityVal.textContent = wmOpacity.value; drawPreview(); });
  wmRotate.addEventListener('input', () => { wmRotateVal.textContent = wmRotate.value; drawPreview(); });
  [wmText, wmFont, wmColor, wmBold, wmRepeat].forEach(el => el.addEventListener('input', drawPreview));
  [wmText, wmFont, wmColor, wmBold, wmRepeat].forEach(el => el.addEventListener('change', drawPreview));

  wmImg.addEventListener('change', async () => {
    if (!wmImg.files || !wmImg.files[0]) return;
    try {
      state.logoBitmap = await createImageBitmap(wmImg.files[0]);
      drawPreview();
    } catch (e) { alert('Failed to load logo image'); }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length) {
      addFiles(fileInput.files);
      fileInput.value = '';
    }
  });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return; dropZone.classList.remove('drag-over'); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); });
  // Ctrl+V 이미지 붙여넣기
  if (window.TayStudio && TayStudio.bindPasteImage) {
    TayStudio.bindPasteImage(files => { addFiles(files); });
  }
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  async function addFiles(files) {
    let skipped = 0;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { skipped++; continue; }
      if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'Image')) continue;
      try {
        const bitmap = await createImageBitmap(file);
        state.files.push({ id: uid(), file, bitmap });
      } catch (e) { skipped++; }
    }
    if (skipped > 0) alert('Some files were skipped because they are not images or are corrupted.');
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
        <div class="name">${esc(f.file.name)}</div>
        <div class="size">${fmtSize(f.file.size)}</div>
        <div class="row-actions"><button type="button" data-rm="${f.id}" title="Remove">✕</button></div>
      `;
      fileList.appendChild(div);
    });
    fileList.querySelectorAll('button[data-rm]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.files = state.files.filter(f => f.id !== btn.dataset.rm);
        refreshFileList();
        toggleUI();
        drawPreview();
      });
    });
  }

  function toggleUI() {
    const has = state.files.length > 0;
    wmTabs.hidden = !has;
    panelText.hidden = !has || state.mode !== 'text';
    panelImage.hidden = !has || state.mode !== 'image';
    commonOpts.hidden = !has;
    previewWrap.hidden = !has;
    actionBar.hidden = !has;
    if (!has) {
      progressWrap.hidden = true;
      result.hidden = true;
    }
  }

  function drawPreview() {
    if (!state.files.length) return;
    const bitmap = state.files[0].bitmap;
    const cv = previewCanvas;
    cv.width = bitmap.width;
    cv.height = bitmap.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    drawWatermark(ctx, cv.width, cv.height);
  }

  function drawWatermark(ctx, w, h) {
    const opacity = parseInt(wmOpacity.value, 10) / 100;
    const rotate = parseInt(wmRotate.value, 10) * Math.PI / 180;
    const repeat = wmRepeat.value === 'tile';

    ctx.save();
    ctx.globalAlpha = opacity;

    if (state.mode === 'text') {
      const text = wmText.value || '';
      if (!text) { ctx.restore(); return; }
      const fontSize = parseInt(wmFontSize.value, 10);
      const fontFamily = wmFont.value;
      const color = wmColor.value;
      const bold = wmBold.value === 'bold' ? 'bold ' : '';
      ctx.font = `${bold}${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      const metrics = ctx.measureText(text);
      const tw = metrics.width;
      const th = fontSize;

      if (repeat) {
        const stepX = tw + 80;
        const stepY = th + 80;
        for (let y = stepY/2; y < h + stepY; y += stepY) {
          for (let x = stepX/2; x < w + stepX; x += stepX) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotate);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      } else {
        const [px, py] = posCoords(w, h, tw, th);
        ctx.translate(px, py);
        ctx.rotate(rotate);
        ctx.fillText(text, 0, 0);
      }
    } else {
      if (!state.logoBitmap) { ctx.restore(); return; }
      const sizePct = parseInt(wmImgSize.value, 10) / 100;
      const lw = w * sizePct;
      const lh = lw * (state.logoBitmap.height / state.logoBitmap.width);

      if (repeat) {
        const stepX = lw + 80;
        const stepY = lh + 80;
        for (let y = stepY/2; y < h + stepY; y += stepY) {
          for (let x = stepX/2; x < w + stepX; x += stepX) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotate);
            ctx.drawImage(state.logoBitmap, -lw/2, -lh/2, lw, lh);
            ctx.restore();
          }
        }
      } else {
        const [px, py] = posCoords(w, h, lw, lh);
        ctx.translate(px, py);
        ctx.rotate(rotate);
        ctx.drawImage(state.logoBitmap, -lw/2, -lh/2, lw, lh);
      }
    }
    ctx.restore();
  }

  function posCoords(w, h, ow, oh) {
    const padX = ow / 2 + 20;
    const padY = oh / 2 + 20;
    const map = {
      tl: [padX, padY],
      tc: [w / 2, padY],
      tr: [w - padX, padY],
      ml: [padX, h / 2],
      center: [w / 2, h / 2],
      mr: [w - padX, h / 2],
      bl: [padX, h - padY],
      bc: [w / 2, h - padY],
      br: [w - padX, h - padY],
    };
    return map[state.pos] || map.center;
  }

  clearBtn.addEventListener('click', () => {
    state.files.forEach(f => f.bitmap.close && f.bitmap.close());
    state.files = [];
    state.results.forEach(r => URL.revokeObjectURL(r.url));
    state.results = [];
    imgGrid.innerHTML = '';
    refreshFileList();
    toggleUI();
  });

  applyBtn.addEventListener('click', async () => {
    if (!state.files.length) return;
    if (state.mode === 'image' && !state.logoBitmap) {
      alert('Select a logo image first.');
      return;
    }
    applyBtn.disabled = true;
    clearBtn.disabled = true;
    state.results.forEach(r => URL.revokeObjectURL(r.url));
    state.results = [];
    imgGrid.innerHTML = '';
    result.hidden = true;
    progressWrap.hidden = false;
    progressFill.style.width = '0%';
    progressWrap.setAttribute('aria-valuenow', '0');
    progressText.textContent = `0 / ${state.files.length}`;

    const outMime = (wmFormat && wmFormat.value) || 'image/jpeg';
    const outExt = outMime === 'image/png' ? 'png' : outMime === 'image/webp' ? 'webp' : 'jpg';
    const outQuality = outMime === 'image/png' ? undefined : 0.95;

    let done = 0;
    for (const f of state.files) {
      const cv = document.createElement('canvas');
      cv.width = f.bitmap.width;
      cv.height = f.bitmap.height;
      const ctx = cv.getContext('2d');
      // JPG has no transparency → fill white background (avoid black bg)
      if (outMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cv.width, cv.height);
      }
      ctx.drawImage(f.bitmap, 0, 0);
      drawWatermark(ctx, cv.width, cv.height);
      const blob = await new Promise(res => cv.toBlob(res, outMime, outQuality));
      if (!blob) {
        alert('Encoding failed (browser unsupported). Try JPG.');
        applyBtn.disabled = false;
        clearBtn.disabled = false;
        return;
      }
      const url = URL.createObjectURL(blob);
      const name = f.file.name.replace(/\.[^.]+$/, '') + '_watermark.' + outExt;
      state.results.push({ name, blob, url });

      done++;
      const pct = Math.round(done / state.files.length * 100);
      progressFill.style.width = pct + '%';
      progressWrap.setAttribute('aria-valuenow', String(pct));
      progressText.textContent = `${done} / ${state.files.length}`;
    }

    applyBtn.disabled = false;
    clearBtn.disabled = false;
    newCount.textContent = `${state.results.length} photos`;
    result.hidden = false;
    renderGrid();
  });

  function renderGrid() {
    imgGrid.innerHTML = '';
    state.results.forEach(r => {
      const card = document.createElement('div');
      card.className = 'img-card';
      card.innerHTML = `
        <div class="img-card-thumb"><img src="${r.url}" alt="${esc(r.name)}"></div>
        <div class="img-card-meta">${esc(r.name)}</div>
        <a class="img-card-dl" href="${r.url}" download="${esc(r.name)}">Download</a>
      `;
      imgGrid.appendChild(card);
    });
  }

  downloadAllBtn.addEventListener('click', async () => {
    for (const r of state.results) {
      const a = document.createElement('a');
      a.href = r.url;
      a.download = r.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      await new Promise(res => setTimeout(res, 120));
    }
  });
})();
