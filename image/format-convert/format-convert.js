// WebP·AVIF ↔ JPG·PNG 변환 — 브라우저 Canvas API + native decoder.
// 외부 라이브러리 없음. AVIF encoding은 Chrome 85+, WebP는 모든 모던 브라우저 지원.

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
    files: [],     // { id, file, status, errMsg }
    results: [],   // { id, name, blob, url, size }
  };

  // 브라우저별 encoder 지원 체크
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
      const statusText = f.status === 'done' ? '완료' : f.status === 'err' ? (f.errMsg || '오류') : f.status === 'processing' ? '처리 중' : '대기';
      div.innerHTML = `
        <div class="order">${i + 1}</div>
        <div class="name">${esc(f.file.name)}</div>
        <div class="size">${fmtSize(f.file.size)}</div>
        <div class="status ${statusCls}">${esc(statusText)}</div>
        <div class="row-actions"><button type="button" data-rm="${f.id}" title="삭제">✕</button></div>
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
      msg = '⚠️ 현재 브라우저가 AVIF 인코딩을 지원하지 않습니다. Chrome 85+, Firefox 113+ 권장. JPG로 fallback됩니다.';
    } else if (fmt === 'image/webp' && !supports.webp) {
      msg = '⚠️ 현재 브라우저가 WebP 인코딩을 지원하지 않습니다. PNG로 fallback됩니다.';
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
      if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, '이미지')) return;
      if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) sawGif = true;
      state.files.push({ id: uid(), file, status: 'pending' });
    });
    if (sawGif && !gifWarned) {
      gifWarned = true;
      alert('GIF는 첫 프레임만 변환됩니다. 애니메이션 전체를 유지하려면 동영상 도구 사용을 권장합니다.');
    }
    refreshFileList();
    toggleUI();
  }

  // 파일 입력
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length) {
      addFiles(fileInput.files);
      fileInput.value = '';
    }
  });
  // Drag & drop
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // 옵션 동기화
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

  // 변환 핵심
  async function convertOne(file, mimeOut, quality) {
    // 1. 파일 → ImageBitmap (브라우저 native decoder가 webp·avif·jpg·png·gif 모두 처리)
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch (e) {
      throw new Error('디코딩 실패: ' + (e.message || '알 수 없음'));
    }
    // 2. Canvas에 그리기
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    // JPG는 투명 배경 X → 흰 배경 깔기
    if (mimeOut === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close && bitmap.close();
    // 3. 인코딩
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('인코딩 실패')), mimeOut, quality);
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
    if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
    const totalBytes = state.files.reduce((s, f) => s + (f.file.size || 0), 0);
    progressText.textContent = `0 / ${state.files.length} — 0 B / ${fmtSize(totalBytes)}`;

    const mimeOut = formatSel.value;
    const quality = mimeOut === 'image/png' ? undefined : (parseInt(qualityIn.value, 10) / 100);
    const ext = extOfMime(mimeOut);
    let done = 0, ok = 0, totalSize = 0, processedBytes = 0;
    const nameMap = Object.create(null);

    for (const f of state.files) {
      f.status = 'processing';
      refreshFileList();
      try {
        const blob = await convertOne(f.file, mimeOut, quality);
        // 실제 인코딩된 mime이 요청과 다를 수 있음 (fallback). blob.type 확인
        const actualMime = blob.type || mimeOut;
        const actualExt = extOfMime(actualMime);
        const url = URL.createObjectURL(blob);
        let name = newName(f.file.name, actualExt);
        // 파일명 collision: 같은 이름 N번째 → base-N.ext
        if (nameMap[name]) {
          const dot = name.lastIndexOf('.');
          const base = dot > 0 ? name.slice(0, dot) : name;
          const tail = dot > 0 ? name.slice(dot) : '';
          name = `${base}-${nameMap[name]}${tail}`;
        }
        nameMap[newName(f.file.name, actualExt)] = (nameMap[newName(f.file.name, actualExt)] || 0) + 1;
        state.results.push({ id: f.id, name, blob, url, size: blob.size });
        totalSize += blob.size;
        f.status = 'done';
        ok++;
      } catch (e) {
        f.status = 'err';
        f.errMsg = (e && e.message) ? e.message.slice(0, 30) : '오류';
      }
      done++;
      processedBytes += (f.file.size || 0);
      const pct = totalBytes > 0 ? Math.round(processedBytes / totalBytes * 100) : Math.round(done / state.files.length * 100);
      progressFill.style.width = pct + '%';
      if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', pct);
      progressText.textContent = `${done} / ${state.files.length} — ${fmtSize(processedBytes)} / ${fmtSize(totalBytes)}`;
      refreshFileList();
    }

    convertBtn.disabled = false;
    clearBtn.disabled = false;

    if (ok > 0) {
      newCount.textContent = `${ok}장`;
      newSize.textContent = fmtSize(totalSize);
      result.hidden = false;
      renderGrid();
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
        <a class="img-card-dl" href="${r.url}" download="${esc(r.name)}">다운로드</a>
      `;
      imgGrid.appendChild(card);
    });
  }

  downloadAllBtn.addEventListener('click', async () => {
    // ZIP 없이 순차 다운로드 (브라우저 multiple download)
    for (const r of state.results) {
      const a = document.createElement('a');
      a.href = r.url;
      a.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(r.name) : r.name);
      document.body.appendChild(a);
      a.click();
      a.remove();
      await new Promise(res => setTimeout(res, 120));  // 브라우저 download 큐 간격
    }
  });

  // 초기 상태
  updateFormatWarning();
})();
