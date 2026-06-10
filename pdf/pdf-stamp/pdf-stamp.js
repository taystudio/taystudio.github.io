// PDF 워터마크 / 페이지번호 / 메타데이터 — pdf-lib WASM + PDF.js 미리보기 + 드래그 위치 조정.

import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';

(function () {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';

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

  // 워터마크 미리보기 요소
  const wmPreviewWrap = document.getElementById('wmPreviewWrap');
  const wmCanvasFrame = document.getElementById('wmCanvasFrame');
  const wmCanvas = document.getElementById('wmCanvas');
  const wmTextOverlay = document.getElementById('wmTextOverlay');
  const wmLoading = document.getElementById('wmLoading');
  const wmCoordText = document.getElementById('wmCoordText');
  const wmReset = document.getElementById('wmReset');

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
    wmPos: { x: 0.5, y: 0.5 },  // normalized 0-1 (가로·세로, 0=좌상)
    previewPdfId: null,         // 어떤 PDF 가 현재 미리보기 중인지
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
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return; dropZone.classList.remove('dragover'); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
  dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });

  function addFiles(files) {
    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
        state.files.push({ id: uid(), file });
      }
    });
    refreshFileList();
    toggleUI();
    renderPreviewIfNeeded();
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
        <div class="row-actions"><button type="button" data-rm="${f.id}" title="삭제">✕</button></div>
      `;
      fileList.appendChild(div);
    });
    fileList.querySelectorAll('button[data-rm]').forEach(btn => btn.addEventListener('click', () => {
      const removedFirst = state.files[0]?.id === btn.dataset.rm;
      state.files = state.files.filter(f => f.id !== btn.dataset.rm);
      refreshFileList(); toggleUI();
      if (removedFirst) renderPreviewIfNeeded();
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
    if (!has) {
      progressWrap.hidden = true;
      result.hidden = true;
      wmPreviewWrap.hidden = true;
      state.previewPdfId = null;
    }
  }

  // 슬라이더 + 텍스트 라이브 미리보기
  function syncPreviewOverlay() {
    if (!wmTextOverlay) return;
    const txt = wmText.value.trim() || 'WATERMARK';
    wmTextOverlay.textContent = txt;
    const fontPt = parseInt(wmFontSize.value, 10) || 60;
    const opacity = (parseInt(wmOpacity.value, 10) || 25) / 100;
    const rotate = parseInt(wmRotate.value, 10) || 0;
    // canvas 가 렌더된 후에만 의미 — canvas pixel-per-pdf-pt scale 계산
    const scale = wmCanvas._ptScale || 1;
    wmTextOverlay.style.fontSize = (fontPt * scale) + 'px';
    wmTextOverlay.style.opacity = opacity;
    wmTextOverlay.style.color = colorToCss(wmColor.value);
    // pdf-lib 의 rotate 는 PDF Y-up 좌표계의 counter-clockwise positive,
    // CSS rotate 는 Y-down 좌표계의 clockwise positive — 둘이 부호 반대로 보임.
    // 미리보기와 출력 회전 방향을 일치시키기 위해 CSS 쪽 부호 반전.
    wmTextOverlay.style.transform = `translate(-50%, -50%) rotate(${-rotate}deg)`;
    positionOverlay();
  }
  function colorToCss(name) {
    switch (name) {
      case 'red': return 'rgb(230,25,25)';
      case 'blue': return 'rgb(25,75,230)';
      case 'black': return 'rgb(0,0,0)';
      case 'gray': default: return 'rgb(150,150,150)';
    }
  }
  // CSS overlay box center 와 그 안 text 의 visual center 차이를 실측 (환경 dependent).
  // probe span 박고 Range.getBoundingClientRect (text 영역) vs box rect 비교.
  const _visualOffsetCache = new Map();
  function measureCssTextVisualOffset(fontPx) {
    const key = Math.round(fontPx * 100);  // 0.01 px 정밀도
    if (_visualOffsetCache.has(key)) return _visualOffsetCache.get(key);
    const probe = document.createElement('span');
    probe.style.cssText = `position:fixed; left:-9999px; top:-9999px; visibility:hidden; font-family:Helvetica, Arial, sans-serif; font-weight:700; font-size:${fontPx}px; line-height:1; padding:0; margin:0; display:inline-flex; align-items:center; justify-content:center;`;
    probe.textContent = 'CONFIDENTIAL';
    document.body.appendChild(probe);
    const range = document.createRange();
    range.selectNodeContents(probe);
    const textRect = range.getBoundingClientRect();
    const boxRect = probe.getBoundingClientRect();
    const offsetY = (textRect.top + textRect.height / 2) - (boxRect.top + boxRect.height / 2);
    document.body.removeChild(probe);
    _visualOffsetCache.set(key, offsetY);
    return offsetY;  // Y-down (CSS), positive = text 가 box 중심보다 아래
  }

  function positionOverlay() {
    if (!wmCanvas._ready) return;
    const cw = wmCanvas.offsetWidth, ch = wmCanvas.offsetHeight;
    // canvas 가 frame (flex center) 안에서 offset 떨어진 곳에 위치 → overlay 좌표도 그만큼 보정
    const cLeft = wmCanvas.offsetLeft, cTop = wmCanvas.offsetTop;
    // CSS 환경의 실측 visual offset (font·OS·browser dependent).
    // overlay 를 그만큼 위로 옮겨 text 의 visual center 가 (left, top) 좌표에 일치.
    const fontPx = parseFloat(wmTextOverlay.style.fontSize) || 60;
    const visualOffsetY = measureCssTextVisualOffset(fontPx);
    wmTextOverlay.style.left = (cLeft + state.wmPos.x * cw) + 'px';
    wmTextOverlay.style.top = (cTop + state.wmPos.y * ch - visualOffsetY) + 'px';
    const px = Math.round(state.wmPos.x * 100);
    const py = Math.round(state.wmPos.y * 100);
    if (wmCoordText) wmCoordText.textContent = `${px}% · ${py}%`;
  }

  wmFontSize.addEventListener('input', () => { wmFontSizeVal.textContent = wmFontSize.value; syncPreviewOverlay(); });
  wmOpacity.addEventListener('input', () => { wmOpacityVal.textContent = wmOpacity.value; syncPreviewOverlay(); });
  wmRotate.addEventListener('input', () => { wmRotateVal.textContent = wmRotate.value; syncPreviewOverlay(); });
  wmText.addEventListener('input', syncPreviewOverlay);
  wmColor.addEventListener('change', syncPreviewOverlay);
  pnSize.addEventListener('input', () => pnSizeVal.textContent = pnSize.value);

  clearBtn.addEventListener('click', () => {
    state.files = [];
    state.results.forEach(r => URL.revokeObjectURL(r.url));
    state.results = [];
    imgGrid.innerHTML = '';
    progressWrap.hidden = true;
    result.hidden = true;
    refreshFileList(); toggleUI();
  });

  // ─── PDF.js 미리보기 + 드래그 위치 조정 ───
  async function renderPreviewIfNeeded() {
    if (!state.files.length) {
      wmPreviewWrap.hidden = true;
      state.previewPdfId = null;
      return;
    }
    const first = state.files[0];
    if (state.previewPdfId === first.id) return;
    state.previewPdfId = first.id;
    wmPreviewWrap.hidden = false;
    wmLoading.hidden = false;
    wmLoading.textContent = 'PDF 미리보기 준비 중…';
    wmCanvas.hidden = true;
    wmTextOverlay.hidden = true;
    wmCanvas._ready = false;
    try {
      const buf = await first.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const page = await pdf.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      // 컨테이너 너비 기준 scale 계산 (max 560px)
      const frameW = Math.min(wmCanvasFrame.clientWidth || 560, 560);
      const scale = Math.min(2, frameW / baseViewport.width);
      const viewport = page.getViewport({ scale });
      wmCanvas.width = Math.floor(viewport.width);
      wmCanvas.height = Math.floor(viewport.height);
      wmCanvas.style.width = Math.floor(viewport.width) + 'px';
      wmCanvas.style.height = Math.floor(viewport.height) + 'px';
      const ctx = wmCanvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      wmCanvas._ptScale = scale;  // 1pt PDF = scale px preview
      wmCanvas._pageW = baseViewport.width;  // PDF pt
      wmCanvas._pageH = baseViewport.height;
      wmCanvas._ready = true;
      wmLoading.hidden = true;
      wmCanvas.hidden = false;
      wmTextOverlay.hidden = false;
      syncPreviewOverlay();
    } catch (e) {
      console.error('PDF.js 렌더 실패', e);
      wmLoading.textContent = '⚠️ 미리보기 실패 — 적용은 계속 가능. ' + (e.message || '');
    }
  }

  // 드래그 — pointer events (마우스·터치 통합)
  let dragging = false, dragOffsetX = 0, dragOffsetY = 0;
  wmTextOverlay.addEventListener('pointerdown', (e) => {
    if (!wmCanvas._ready) return;
    dragging = true;
    wmTextOverlay.classList.add('dragging');
    wmTextOverlay.setPointerCapture(e.pointerId);
    // 시작 시 클릭 offset 계산 (overlay 중심 기준이라 0)
    dragOffsetX = 0; dragOffsetY = 0;
    e.preventDefault();
  });
  wmTextOverlay.addEventListener('pointermove', (e) => {
    if (!dragging || !wmCanvas._ready) return;
    const rect = wmCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    state.wmPos.x = Math.max(0, Math.min(1, x));
    state.wmPos.y = Math.max(0, Math.min(1, y));
    positionOverlay();
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    wmTextOverlay.classList.remove('dragging');
    try { wmTextOverlay.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  wmTextOverlay.addEventListener('pointerup', endDrag);
  wmTextOverlay.addEventListener('pointercancel', endDrag);

  // 키보드 미세 조정 (방향키)
  wmTextOverlay.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft':  state.wmPos.x = Math.max(0, state.wmPos.x - step); break;
      case 'ArrowRight': state.wmPos.x = Math.min(1, state.wmPos.x + step); break;
      case 'ArrowUp':    state.wmPos.y = Math.max(0, state.wmPos.y - step); break;
      case 'ArrowDown':  state.wmPos.y = Math.min(1, state.wmPos.y + step); break;
      case 'Home':       state.wmPos = { x: 0.5, y: 0.5 }; break;
      default: handled = false;
    }
    if (handled) { e.preventDefault(); positionOverlay(); }
  });

  if (wmReset) wmReset.addEventListener('click', () => {
    state.wmPos = { x: 0.5, y: 0.5 };
    positionOverlay();
    updatePresetActive();
  });

  // 9 preset 위치 (가로·세로 normalized 0-1)
  const PRESETS = {
    tl: [0.1, 0.1], tc: [0.5, 0.1], tr: [0.9, 0.1],
    ml: [0.1, 0.5], mc: [0.5, 0.5], mr: [0.9, 0.5],
    bl: [0.1, 0.9], bc: [0.5, 0.9], br: [0.9, 0.9],
  };
  function updatePresetActive() {
    const presetGrid = document.getElementById('wmPresetGrid');
    if (!presetGrid) return;
    // 현재 wmPos 와 가장 가까운 preset 찾기 (drag 후엔 어디에도 안 맞으면 모두 비활성)
    let activeKey = null;
    for (const [k, [px, py]] of Object.entries(PRESETS)) {
      if (Math.abs(state.wmPos.x - px) < 0.001 && Math.abs(state.wmPos.y - py) < 0.001) {
        activeKey = k; break;
      }
    }
    presetGrid.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.pos === activeKey);
    });
  }
  const presetGrid = document.getElementById('wmPresetGrid');
  if (presetGrid) {
    presetGrid.querySelectorAll('button[data-pos]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [x, y] = PRESETS[btn.dataset.pos];
        state.wmPos = { x, y };
        positionOverlay();
        updatePresetActive();
      });
    });
  }
  // 드래그가 끝나면 preset 활성 상태 갱신 (어느 preset 에도 안 맞으면 다 비활성)
  wmTextOverlay.addEventListener('pointerup', () => setTimeout(updatePresetActive, 0));
  wmTextOverlay.addEventListener('keyup', updatePresetActive);

  // 창 크기 변경 시 overlay 재배치
  window.addEventListener('resize', positionOverlay);

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
    let pdf = await lib.PDFDocument.load(buf, { ignoreEncryption: true });
    if (pdf.isEncrypted) {
      throw new Error(`암호로 보호된 PDF (${file.name})는 처리할 수 없습니다. Adobe Acrobat 등으로 암호 해제 후 다시 시도하세요.`);
    }
    const font = await pdf.embedFont(lib.StandardFonts.Helvetica);

    if (state.mode === 'watermark') {
      const text = wmText.value.trim();
      if (!text) throw new Error('워터마크 텍스트 없음');
      // Helvetica는 WinAnsi(ASCII Latin-1)만 지원 — 한글·이모지·CJK 차단
      if (/[^\x20-\x7E -ÿ]/.test(text)) {
        throw new Error('워터마크 텍스트에 한글·이모지·특수문자가 있어 처리할 수 없습니다 (Helvetica 한계). 영문·숫자·기본 특수문자(!@#$%^&*()+=,.<>?/[]{}|~`-_)만 사용하거나 영문 약어로 바꿔 사용하세요. 예: "CONFIDENTIAL", "DRAFT", "SAMPLE".');
      }
      const fontSize = parseInt(wmFontSize.value, 10);
      const opacity = parseInt(wmOpacity.value, 10) / 100;
      const rotateDeg = parseInt(wmRotate.value, 10);
      const color = rgbColor(wmColor.value);
      // 모드 선택: vector (텍스트 PDF) 또는 image (canvas raster)
      const wmModeRadio = document.querySelector('input[name="wmMode"]:checked');
      const wmMode = wmModeRadio ? wmModeRadio.value : 'vector';
      // 두 모드 공통: 새 PDFDocument + 원본 form XObject 임베드 (본문 cm 영향 차단)
      const newPdf = await lib.PDFDocument.create();
      const origPageIndices = pdf.getPageIndices();
      const embeddedOrigPages = await newPdf.embedPdf(buf, origPageIndices);

      // 벡터 모드용 font
      let newFont = null;
      if (wmMode === 'vector') {
        newFont = await newPdf.embedFont(lib.StandardFonts.HelveticaBold);
      }

      // 이미지 모드용 — canvas 로 워터마크 render → PNG.
      const SCALE_FACTOR = 3;
      function colorToRgba(name, op) {
        const map = {
          red: [230, 25, 25], blue: [25, 75, 230], black: [0, 0, 0], gray: [150, 150, 150],
        };
        const [r, g, b] = map[name] || map.gray;
        return `rgba(${r}, ${g}, ${b}, ${op})`;
      }
      function generateWatermarkImageDataUrl(width, height) {
        const c = document.createElement('canvas');
        c.width = Math.round(width * SCALE_FACTOR);
        c.height = Math.round(height * SCALE_FACTOR);
        const ctx = c.getContext('2d');
        const cx = state.wmPos.x * width * SCALE_FACTOR;
        const cy = state.wmPos.y * height * SCALE_FACTOR;
        ctx.translate(cx, cy);
        // canvas (Y-down) clockwise positive. CSS overlay 는 rotate(${-rotate}deg) → 동일 방향.
        ctx.rotate(-rotateDeg * Math.PI / 180);
        ctx.font = `bold ${fontSize * SCALE_FACTOR}px Helvetica, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorToRgba(wmColor.value, opacity);
        ctx.fillText(text, 0, 0);
        return c.toDataURL('image/png');
      }

      const wmImgCache = new Map();
      for (let i = 0; i < embeddedOrigPages.length; i++) {
        const embOrig = embeddedOrigPages[i];
        const { width, height } = pdf.getPage(i).getSize();
        const newPage = newPdf.addPage([width, height]);
        newPage.drawPage(embOrig, { x: 0, y: 0, width, height });
        if (wmMode === 'vector') {
          // 벡터 모드 — drawText
          const tw = newFont.widthOfTextAtSize(text, fontSize);
          const cx = state.wmPos.x * width;
          const cy = (1 - state.wmPos.y) * height;
          const hx = tw / 2;
          const hy = fontSize * 0.255;
          const rad = rotateDeg * Math.PI / 180;
          const cosA = Math.cos(rad);
          const sinA = Math.sin(rad);
          newPage.drawText(text, {
            x: cx - (hx * cosA - hy * sinA),
            y: cy - (hx * sinA + hy * cosA),
            size: fontSize,
            font: newFont,
            color,
            opacity,
            rotate: lib.degrees(rotateDeg),
          });
        } else {
          // 이미지 모드 — canvas PNG 임베드
          const key = `${width}x${height}`;
          let pngImage = wmImgCache.get(key);
          if (!pngImage) {
            const dataUrl = generateWatermarkImageDataUrl(width, height);
            pngImage = await newPdf.embedPng(dataUrl);
            wmImgCache.set(key, pngImage);
          }
          newPage.drawImage(pngImage, { x: 0, y: 0, width, height });
        }
      }
      try {
        const t = pdf.getTitle(); if (t) newPdf.setTitle(t);
        const a = pdf.getAuthor(); if (a) newPdf.setAuthor(a);
        const s = pdf.getSubject(); if (s) newPdf.setSubject(s);
        const k = pdf.getKeywords(); if (k) newPdf.setKeywords([k]);
      } catch (e) { }
      pdf = newPdf;
    }

    if (state.mode === 'pagenum') {
      const fmt = pnFormat.value;
      const pos = pnPosition.value;
      const size = parseInt(pnSize.value, 10);
      const startRaw = parseInt(pnStart.value, 10);
      const start = (Number.isFinite(startRaw) && startRaw >= 1) ? startRaw : 1;
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
    }
    pdf.setProducer('TAYSTUDIO PDF Stamp');
    pdf.setModificationDate(new Date());

    const out = await pdf.save();
    return new Blob([out], { type: 'application/pdf' });
  }

  applyBtn.addEventListener('click', async () => {
    if (!state.files.length) return;
    if (!window.PDFLib) { alert('pdf-lib 로딩 중. 잠시 후 다시 시도하세요.'); return; }
    const totalSize = state.files.reduce((s, f) => s + f.file.size, 0);
    const MAX_TOTAL = 100 * 1024 * 1024;
    if (totalSize > MAX_TOTAL) {
      const mb = Math.round(totalSize / 1024 / 1024);
      if (!confirm(`총 ${mb}MB — 권장 한도 100MB 초과. 메모리 부족·실패 가능. 계속하시겠습니까?`)) return;
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
        console.error('PDF 처리 실패:', f.file.name, e);
        alert(e.message || ('PDF 처리 실패: ' + f.file.name));
      }
      done++;
      const pct = Math.round(done / state.files.length * 100);
      progressFill.style.width = pct + '%';
      progressWrap.setAttribute('aria-valuenow', String(pct));
      progressText.textContent = `${done} / ${state.files.length}`;
    }

    applyBtn.disabled = false;
    clearBtn.disabled = false;
    setTimeout(() => { progressWrap.hidden = true; }, 800);
    if (ok > 0) {
      newCount.textContent = `${ok}개`;
      result.hidden = false;
      renderGrid();
    } else {
      // 알림은 위에서 이미 한 번 띄움
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
      a.href = r.url; a.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(r.name) : r.name);
      document.body.appendChild(a); a.click(); a.remove();
      await new Promise(res => setTimeout(res, 150));
    }
  });
})();
