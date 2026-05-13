// PDF 워터마크/페이지번호/메타데이터 — pdf-lib WASM.

(function () {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const modeTabs = document.getElementById('modeTabs');
  const panels = {
    watermark: document.getElementById('panelWatermark'),
    pagenum: document.getElementById('panelPagenum'),
    meta: document.getElementById('panelMeta'),
  };
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
  const wmFontSize = document.getElementById('wmFontSize');
  const wmFontSizeVal = document.getElementById('wmFontSizeVal');
  const wmOpacity = document.getElementById('wmOpacity');
  const wmOpacityVal = document.getElementById('wmOpacityVal');
  const wmRotate = document.getElementById('wmRotate');
  const wmRotateVal = document.getElementById('wmRotateVal');
  const wmColor = document.getElementById('wmColor');

  const pnFormat = document.getElementById('pnFormat');
  const pnPosition = document.getElementById('pnPosition');
  const pnSize = document.getElementById('pnSize');
  const pnSizeVal = document.getElementById('pnSizeVal');
  const pnStart = document.getElementById('pnStart');

  const metaTitle = document.getElementById('metaTitle');
  const metaAuthor = document.getElementById('metaAuthor');
  const metaSubject = document.getElementById('metaSubject');
  const metaKeywords = document.getElementById('metaKeywords');

  const state = {
    files: [],     // { id, file }
    results: [],   // { name, blob, url }
    mode: 'watermark',
  };

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function fmtSize(n) { return n < 1024 ? n + 'B' : n < 1024*1024 ? (n/1024).toFixed(1)+'KB' : (n/1024/1024).toFixed(2)+'MB'; }
  const esc = (window.TayStudio && window.TayStudio.escapeHtml) ? window.TayStudio.escapeHtml : (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // 탭
  modeTabs.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      modeTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      Object.entries(panels).forEach(([k, p]) => {
        p.classList.toggle('active', k === state.mode);
        p.hidden = k !== state.mode;
      });
    });
  });

  // 파일
  fileInput.addEventListener('change', () => { if (fileInput.files.length) { addFiles(fileInput.files); fileInput.value = ''; } });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  function addFiles(files) {
    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
        state.files.push({ id: uid(), file });
      }
    });
    refreshFileList();
    toggleUI();
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
    fileList.querySelectorAll('button[data-rm]').forEach(btn => btn.addEventListener('click', () => {
      state.files = state.files.filter(f => f.id !== btn.dataset.rm);
      refreshFileList(); toggleUI();
    }));
  }

  function toggleUI() {
    const has = state.files.length > 0;
    modeTabs.hidden = !has;
    Object.values(panels).forEach((p, i) => {
      const k = ['watermark','pagenum','meta'][i];
      p.hidden = !has || state.mode !== k;
    });
    actionBar.hidden = !has;
    if (!has) { progressWrap.hidden = true; result.hidden = true; }
  }

  // 슬라이더 라이브
  wmFontSize.addEventListener('input', () => wmFontSizeVal.textContent = wmFontSize.value);
  wmOpacity.addEventListener('input', () => wmOpacityVal.textContent = wmOpacity.value);
  wmRotate.addEventListener('input', () => wmRotateVal.textContent = wmRotate.value);
  pnSize.addEventListener('input', () => pnSizeVal.textContent = pnSize.value);

  clearBtn.addEventListener('click', () => {
    state.files = [];
    state.results.forEach(r => URL.revokeObjectURL(r.url));
    state.results = [];
    imgGrid.innerHTML = '';
    refreshFileList(); toggleUI();
  });

  function rgbColor(name) {
    const lib = window.PDFLib;
    const c = lib.rgb;
    switch (name) {
      case 'red': return c(0.9, 0.1, 0.1);
      case 'blue': return c(0.1, 0.3, 0.9);
      case 'black': return c(0, 0, 0);
      case 'gray': default: return c(0.6, 0.6, 0.6);
    }
  }

  function pageCoords(pos, w, h, padding) {
    const map = {
      tl: { x: padding, y: h - padding },
      tc: { x: w / 2, y: h - padding },
      tr: { x: w - padding, y: h - padding },
      bl: { x: padding, y: padding },
      bc: { x: w / 2, y: padding },
      br: { x: w - padding, y: padding },
    };
    return map[pos] || map.bc;
  }

  async function processPdf(file) {
    const lib = window.PDFLib;
    const buf = await file.arrayBuffer();
    const pdf = await lib.PDFDocument.load(buf, { ignoreEncryption: true });
    const font = await pdf.embedFont(lib.StandardFonts.Helvetica);

    if (state.mode === 'watermark') {
      const text = wmText.value.trim();
      if (!text) throw new Error('Watermark text is empty');
      const fontSize = parseInt(wmFontSize.value, 10);
      const opacity = parseInt(wmOpacity.value, 10) / 100;
      const rotateDeg = parseInt(wmRotate.value, 10);
      const color = rgbColor(wmColor.value);
      const pages = pdf.getPages();
      pages.forEach(p => {
        const { width, height } = p.getSize();
        const tw = font.widthOfTextAtSize(text, fontSize);
        // 중앙 회전
        p.drawText(text, {
          x: width / 2 - (tw / 2) * Math.cos(rotateDeg * Math.PI / 180),
          y: height / 2 - (fontSize / 2),
          size: fontSize,
          font,
          color,
          opacity,
          rotate: lib.degrees(rotateDeg),
        });
      });
    }

    if (state.mode === 'pagenum') {
      const fmt = pnFormat.value;
      const pos = pnPosition.value;
      const size = parseInt(pnSize.value, 10);
      const start = parseInt(pnStart.value, 10) || 1;
      const pages = pdf.getPages();
      const total = pages.length;
      pages.forEach((p, idx) => {
        const num = start + idx;
        let label;
        switch (fmt) {
          case 'frac': label = `${num} / ${total}`; break;
          case 'page': label = `Page ${num} of ${total}`; break;
          case 'dash': label = `- ${num} -`; break;
          default: label = String(num);
        }
        const { width, height } = p.getSize();
        const padding = 30;
        const coords = pageCoords(pos, width, height, padding);
        const tw = font.widthOfTextAtSize(label, size);
        let x = coords.x;
        if (pos === 'tc' || pos === 'bc') x = coords.x - tw / 2;
        else if (pos === 'tr' || pos === 'br') x = coords.x - tw;
        p.drawText(label, {
          x, y: coords.y - size / 2,
          size, font,
          color: lib.rgb(0.2, 0.2, 0.2),
        });
      });
    }

    if (state.mode === 'meta') {
      if (metaTitle.value.trim()) pdf.setTitle(metaTitle.value.trim());
      if (metaAuthor.value.trim()) pdf.setAuthor(metaAuthor.value.trim());
      if (metaSubject.value.trim()) pdf.setSubject(metaSubject.value.trim());
      if (metaKeywords.value.trim()) {
        const kws = metaKeywords.value.split(',').map(s => s.trim()).filter(Boolean);
        pdf.setKeywords(kws);
      }
      pdf.setProducer('TAYSTUDIO PDF Stamp');
      pdf.setModificationDate(new Date());
    }

    const out = await pdf.save();
    return new Blob([out], { type: 'application/pdf' });
  }

  applyBtn.addEventListener('click', async () => {
    if (!state.files.length) return;
    if (!window.PDFLib) { alert('pdf-lib is loading. Please try again in a moment.'); return; }
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

    let done = 0, ok = 0;
    for (const f of state.files) {
      try {
        const blob = await processPdf(f.file);
        const url = URL.createObjectURL(blob);
        const base = f.file.name.replace(/\.pdf$/i, '');
        const suffix = state.mode === 'watermark' ? '_watermark' : state.mode === 'pagenum' ? '_pages' : '_meta';
        state.results.push({ name: `${base}${suffix}.pdf`, blob, url });
        ok++;
      } catch (e) {
        console.error('PDF processing failed:', f.file.name, e);
      }
      done++;
      const pct = Math.round(done / state.files.length * 100);
      progressFill.style.width = pct + '%';
      progressWrap.setAttribute('aria-valuenow', String(pct));
      progressText.textContent = `${done} / ${state.files.length}`;
    }

    applyBtn.disabled = false;
    clearBtn.disabled = false;
    if (ok > 0) {
      newCount.textContent = `${ok} files`;
      result.hidden = false;
      renderGrid();
    } else {
      alert('No PDFs processed. Check file format or whether the PDF is password-protected.');
    }
  });

  function renderGrid() {
    imgGrid.innerHTML = '';
    state.results.forEach(r => {
      const card = document.createElement('div');
      card.className = 'img-card';
      card.innerHTML = `
        <div class="img-card-meta">📄 ${esc(r.name)}<br><span style="color:var(--muted);font-size:11px">${fmtSize(r.blob.size)}</span></div>
        <a class="img-card-dl" href="${r.url}" download="${esc(r.name)}">다운로드</a>
      `;
      imgGrid.appendChild(card);
    });
  }

  downloadAllBtn.addEventListener('click', async () => {
    for (const r of state.results) {
      const a = document.createElement('a');
      a.href = r.url; a.download = r.name;
      document.body.appendChild(a); a.click(); a.remove();
      await new Promise(res => setTimeout(res, 150));
    }
  });
})();
