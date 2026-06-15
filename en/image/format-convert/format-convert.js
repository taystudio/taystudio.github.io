// WebP / AVIF ↔ JPG / PNG converter — browser Canvas API + native decoders.
// No external libraries. AVIF encoding requires Chrome 85+; WebP works in all modern browsers.

(function () {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const optRow = document.getElementById('optRow');
  const formatSel = document.getElementById('formatSel');
  const qualityIn = document.getElementById('qualityIn');
  const qualityVal = document.getElementById('qualityVal');
  const qualityRow = document.getElementById('qualityRow');
  const formatWarning = document.getElementById('formatWarning');
  const actionBar = document.getElementById('actionBar');
  const convertBtn = document.getElementById('convertBtn');
  const clearBtn = document.getElementById('clearBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const result = document.getElementById('result');
  const newCount = document.getElementById('newCount');
  const newSize = document.getElementById('newSize');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const imgGrid = document.getElementById('imgGrid');

  const state = {
    files: [],
    results: [],
  };

  const supports = {
    webp: checkEncoder('image/webp'),
    avif: checkEncoder('image/avif'),
  };

  function checkEncoder(mime) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    return c.toDataURL(mime).indexOf(`data:${mime}`) === 0;
  }

  function fmtSize(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

  function uid() { return Math.random().toString(36).slice(2, 9); }

  const esc = (window.TayStudio && window.TayStudio.escapeHtml) ? window.TayStudio.escapeHtml : (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function refreshFileList() {
    fileList.innerHTML = '';
    state.files.forEach((f, i) => {
      const div = document.createElement('div');
      div.className = 'file-item';
      const statusCls = f.status === 'done' ? 'done' : f.status === 'err' ? 'err' : '';
      const statusText = f.status === 'done' ? 'Done' : f.status === 'err' ? (f.errMsg || 'Error') : f.status === 'processing' ? 'Processing' : 'Queued';
      div.innerHTML = `
        <div class="order">${i + 1}</div>
        <div class="name">${esc(f.file.name)}</div>
        <div class="size">${fmtSize(f.file.size)}</div>
        <div class="status ${statusCls}">${esc(statusText)}</div>
        <div class="row-actions"><button type="button" data-rm="${f.id}" title="Remove">✕</button></div>
      `;
      fileList.appendChild(div);
    });
    fileList.querySelectorAll('button[data-rm]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.files = state.files.filter(f => f.id !== btn.dataset.rm);
        refreshFileList();
        toggleUI();
      });
    });
  }

  function toggleUI() {
    const has = state.files.length > 0;
    optRow.hidden = !has;
    actionBar.hidden = !has;
    if (!has) {
      progressWrap.hidden = true;
      result.hidden = true;
    }
    updateFormatWarning();
  }

  function updateFormatWarning() {
    const fmt = formatSel.value;
    const noQuality = (fmt === 'image/png');
    qualityRow.toggleAttribute('data-disabled', noQuality);

    let msg = '';
    if (fmt === 'image/avif' && !supports.avif) {
      msg = '⚠️ Your browser does not support AVIF encoding. Chrome 85+ or Firefox 113+ recommended. Will fall back to JPG.';
    } else if (fmt === 'image/webp' && !supports.webp) {
      msg = '⚠️ Your browser does not support WebP encoding. Will fall back to PNG.';
    }
    if (msg) {
      formatWarning.textContent = msg;
      formatWarning.setAttribute('data-show', '');
    } else {
      formatWarning.removeAttribute('data-show');
    }
  }

  let gifWarned = false;
  function addFiles(fileList) {
    const arr = Array.from(fileList);
    let sawGif = false;
    arr.forEach(file => {
      if (!file.type.startsWith('image/') && !/\.(webp|avif|jpe?g|png|gif)$/i.test(file.name)) return;
      if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'Image')) return;
      if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) sawGif = true;
      state.files.push({ id: uid(), file, status: 'pending' });
    });
    if (sawGif && !gifWarned) {
      gifWarned = true;
      alert('Only the first frame of a GIF is converted. Use a video tool if you need to keep the full animation.');
    }
    refreshFileList();
    toggleUI();
  }

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length) {
      addFiles(fileInput.files);
      fileInput.value = '';
    }
  });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return;
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });
  // Ctrl+V 이미지 붙여넣기
  if (window.TayStudio && TayStudio.bindPasteImage) {
    TayStudio.bindPasteImage(files => { addFiles(files); }, { multi: true });
  }
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  qualityIn.addEventListener('input', () => qualityVal.textContent = qualityIn.value);
  formatSel.addEventListener('change', updateFormatWarning);

  clearBtn.addEventListener('click', () => {
    state.files = [];
    state.results.forEach(r => URL.revokeObjectURL(r.url));
    state.results = [];
    imgGrid.innerHTML = '';
    refreshFileList();
    toggleUI();
  });

  async function convertOne(file, mimeOut, quality) {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch (e) {
      throw new Error('Decode failed: ' + (e.message || 'unknown'));
    }
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (mimeOut === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close && bitmap.close();
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Encode failed')), mimeOut, quality);
    });
    return blob;
  }

  function extOfMime(mime) {
    return mime === 'image/jpeg' ? 'jpg' :
           mime === 'image/png' ? 'png' :
           mime === 'image/webp' ? 'webp' :
           mime === 'image/avif' ? 'avif' : 'bin';
  }

  function newName(origName, ext) {
    const base = origName.replace(/\.[^.]+$/, '');
    return `${base}.${ext}`;
  }

  convertBtn.addEventListener('click', async () => {
    if (!state.files.length) return;
    convertBtn.disabled = true;
    clearBtn.disabled = true;
    state.results.forEach(r => URL.revokeObjectURL(r.url));
    state.results = [];
    imgGrid.innerHTML = '';
    result.hidden = true;
    progressWrap.hidden = false;
    progressFill.style.width = '0%';
    progressWrap.setAttribute('aria-valuenow', '0');
    const totalBytes = state.files.reduce((s, f) => s + (f.file.size || 0), 0);
    progressText.textContent = `0 / ${state.files.length} — 0 B / ${fmtSize(totalBytes)}`;

    const mimeOut = formatSel.value;
    const quality = mimeOut === 'image/png' ? undefined : (parseInt(qualityIn.value, 10) / 100);
    let done = 0, ok = 0, totalSize = 0, processedBytes = 0;
    // Filename collision: track used names in a Set, suffix increments until unique.
    // Counter approach has a false negative when input is `a.jpg, a.jpg, a-1.jpg`: 2nd and 3rd both become `a-1.jpg`.
    const usedNames = new Set();

    for (const f of state.files) {
      f.status = 'processing';
      refreshFileList();
      try {
        const blob = await convertOne(f.file, mimeOut, quality);
        const actualMime = blob.type || mimeOut;
        const actualExt = extOfMime(actualMime);
        const url = URL.createObjectURL(blob);
        let name = newName(f.file.name, actualExt);
        if (usedNames.has(name)) {
          const dot = name.lastIndexOf('.');
          const base = dot > 0 ? name.slice(0, dot) : name;
          const tail = dot > 0 ? name.slice(dot) : '';
          let n = 1;
          let candidate;
          do { candidate = `${base}-${n}${tail}`; n++; } while (usedNames.has(candidate));
          name = candidate;
        }
        usedNames.add(name);
        state.results.push({ id: f.id, name, blob, url, size: blob.size });
        totalSize += blob.size;
        f.status = 'done';
        ok++;
      } catch (e) {
        f.status = 'err';
        f.errMsg = (e && e.message) ? e.message.slice(0, 30) : 'Error';
      }
      done++;
      processedBytes += (f.file.size || 0);
      const pct = totalBytes > 0 ? Math.round(processedBytes / totalBytes * 100) : Math.round(done / state.files.length * 100);
      progressFill.style.width = pct + '%';
      progressWrap.setAttribute('aria-valuenow', String(pct));
      progressText.textContent = `${done} / ${state.files.length} — ${fmtSize(processedBytes)} / ${fmtSize(totalBytes)}`;
      refreshFileList();
    }

    convertBtn.disabled = false;
    clearBtn.disabled = false;

    if (ok > 0) {
      newCount.textContent = `${ok} files`;
      newSize.textContent = fmtSize(totalSize);
      result.hidden = false;
      renderGrid();
    } else {
      alert('All conversions failed. The files may be corrupted, or your browser may not support this output format. Try different files or a different format.');
    }
  });

  function renderGrid() {
    imgGrid.innerHTML = '';
    state.results.forEach(r => {
      const card = document.createElement('div');
      card.className = 'img-card';
      card.innerHTML = `
        <div class="img-card-thumb"><img src="${r.url}" alt="${esc(r.name)}"></div>
        <div class="img-card-meta">${esc(r.name)}<br>${fmtSize(r.size)}</div>
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

  updateFormatWarning();
})();
