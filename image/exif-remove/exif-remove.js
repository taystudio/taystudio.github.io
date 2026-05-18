// 사진 GPS·EXIF 제거 — Canvas 재인코딩으로 모든 메타데이터 제거.
// 최종 검증: 2026-05-17
//
// 동작:
//  1. FileReader → piexifjs로 EXIF 읽어서 사용자에게 표시 (GPS·날짜·기종)
//  2. Image 객체로 디코딩 → canvas에 원본 크기로 그림
//  3. canvas.toBlob(mime, quality) 으로 출력 → EXIF·ICC·XMP 모두 제거
//  4. 다중 파일 시 JSZip으로 묶어 ZIP 다운로드

(function () {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const optsBox = document.getElementById('optsBox');
  const jpgQuality = document.getElementById('jpgQuality');
  const jpgQualityVal = document.getElementById('jpgQualityVal');
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

  const state = {
    files: [],    // { id, file, exif }
    results: [],  // { name, blob, url }
  };

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function fmtSize(n) { return n < 1024 ? n + 'B' : n < 1024 * 1024 ? (n / 1024).toFixed(1) + 'KB' : (n / 1024 / 1024).toFixed(2) + 'MB'; }
  const esc = (window.TayStudio && window.TayStudio.escapeHtml)
    ? window.TayStudio.escapeHtml
    : (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  jpgQuality.addEventListener('input', () => {
    jpgQualityVal.textContent = parseFloat(jpgQuality.value).toFixed(2);
  });

  // GPS rational → 십진수 (도·분·초 → 도)
  function dmsToDecimal(dms, ref) {
    if (!Array.isArray(dms) || dms.length < 3) return null;
    const toNum = (v) => Array.isArray(v) ? (v[0] / (v[1] || 1)) : Number(v);
    const d = toNum(dms[0]);
    const m = toNum(dms[1]);
    const s = toNum(dms[2]);
    if (!isFinite(d) || !isFinite(m) || !isFinite(s)) return null;
    let dec = d + m / 60 + s / 3600;
    if (ref === 'S' || ref === 'W') dec = -dec;
    return dec;
  }

  // piexifjs로 EXIF 읽기 — JPG만 EXIF 지원 (PNG·WebP는 별도 chunk)
  async function readExif(file) {
    if (!window.piexif) return null;
    if (file.type !== 'image/jpeg') return null;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('read fail'));
        r.readAsDataURL(file);
      });
      const obj = window.piexif.load(dataUrl);
      const out = {};
      // GPS
      const gps = obj.GPS || {};
      if (gps[2] && gps[4]) {
        const lat = dmsToDecimal(gps[2], gps[1] || 'N');
        const lon = dmsToDecimal(gps[4], gps[3] || 'E');
        if (lat != null && lon != null) {
          out.gps = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        }
      }
      // 촬영 일시 — Exif.DateTimeOriginal (36867)
      const exif = obj.Exif || {};
      if (exif[36867]) out.dateTime = String(exif[36867]);
      else if (obj['0th'] && obj['0th'][306]) out.dateTime = String(obj['0th'][306]);
      // 기종 — 0th.Make(271) + 0th.Model(272)
      const zeroth = obj['0th'] || {};
      const parts = [];
      if (zeroth[271]) parts.push(String(zeroth[271]).trim());
      if (zeroth[272]) parts.push(String(zeroth[272]).trim());
      if (parts.length) out.camera = parts.join(' ');
      // 소프트웨어
      if (zeroth[305]) out.software = String(zeroth[305]).trim();
      // 렌즈
      if (exif[42036]) out.lens = String(exif[42036]).trim();
      return out;
    } catch (e) {
      return null;
    }
  }

  // 메인 EXIF 제거 — Canvas 재인코딩 (canvas 재사용)
  const MAX_DIM = 16000;
  const reusableCanvas = document.createElement('canvas');
  async function stripExif(file, quality) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error('load failed'));
        im.src = url;
      });
      if (img.naturalWidth > MAX_DIM || img.naturalHeight > MAX_DIM) {
        throw new Error('이미지 너무 큽니다 (가로/세로 16000px 초과). 먼저 리사이즈 후 사용하세요.');
      }
      const canvas = reusableCanvas;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      const isJpg = file.type === 'image/jpeg';
      const mime = file.type === 'image/png' ? 'image/png'
                 : file.type === 'image/webp' ? 'image/webp'
                 : 'image/jpeg';
      // JPG 출력은 투명 미지원 → 흰 배경 채움 (PNG/WebP는 그대로)
      if (isJpg) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (!b) reject(new Error('encode failed'));
          else resolve(b);
        }, mime, mime === 'image/png' ? undefined : quality);
      });
      return { blob, mime };
    } finally {
      URL.revokeObjectURL(url);
    }
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
    e.preventDefault();
    if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return;
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });
  if (window.TayStudio && TayStudio.bindPasteImage) {
    TayStudio.bindPasteImage(files => { addFiles(files); }, { multi: true });
  }
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  async function addFiles(files) {
    let skipped = 0;
    let heicWarn = false;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { skipped++; continue; }
      const isHeic = /heic|heif/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name);
      if (isHeic) { heicWarn = true; continue; }
      const ok = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!ok) { skipped++; continue; }
      if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, '이미지')) continue;
      const exif = await readExif(file);
      state.files.push({ id: uid(), file, exif });
    }
    if (heicWarn) alert('HEIC 파일은 브라우저가 디코드하지 못합니다. 먼저 "HEIC → JPG 변환" 도구로 변환 후 사용하세요.');
    if (skipped > 0) alert('일부 파일은 지원 포맷이 아니어서 제외됐습니다 (JPG·PNG·WebP만 가능).');
    refreshFileList();
    toggleUI();
  }

  function exifSummaryHtml(exif) {
    if (!exif) return '';
    const tags = [];
    if (exif.gps) tags.push(`<span class="tag">📍 <b>GPS: ${esc(exif.gps)}</b></span>`);
    if (exif.dateTime) tags.push(`<span class="tag">📅 ${esc(exif.dateTime)}</span>`);
    if (exif.camera) tags.push(`<span class="tag">📷 ${esc(exif.camera)}</span>`);
    if (exif.lens) tags.push(`<span class="tag">🔭 ${esc(exif.lens)}</span>`);
    if (exif.software) tags.push(`<span class="tag">💻 ${esc(exif.software)}</span>`);
    if (!tags.length) {
      return `<div class="exif-info empty">✓ 감지된 EXIF 없음 (이미 제거됐거나 PNG·WebP)</div>`;
    }
    return `<div class="exif-info"><b style="color:#dc2626">⚠ 감지된 메타데이터 (제거 예정):</b><br>${tags.join(' ')}</div>`;
  }

  function refreshFileList() {
    fileList.innerHTML = '';
    state.files.forEach((f, i) => {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.innerHTML = `
        <div class="row">
          <div class="order">${i + 1}</div>
          <div class="name">${esc(f.file.name)}</div>
          <div class="size">${fmtSize(f.file.size)}</div>
          <div class="row-actions"><button type="button" data-rm="${f.id}" title="삭제">✕</button></div>
        </div>
        ${exifSummaryHtml(f.exif)}
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
    optsBox.hidden = !has;
    actionBar.hidden = !has;
    if (!has) {
      progressWrap.hidden = true;
      result.hidden = true;
    }
    downloadAllBtn.textContent = state.results.length > 1 ? '⬇ 전체 다운로드 (ZIP)' : '⬇ 다운로드';
  }

  clearBtn.addEventListener('click', () => {
    state.files = [];
    state.results.forEach(r => URL.revokeObjectURL(r.url));
    state.results = [];
    imgGrid.innerHTML = '';
    refreshFileList();
    toggleUI();
  });

  applyBtn.addEventListener('click', async () => {
    if (!state.files.length) return;
    applyBtn.disabled = true;
    clearBtn.disabled = true;
    state.results.forEach(r => URL.revokeObjectURL(r.url));
    state.results = [];
    imgGrid.innerHTML = '';
    result.hidden = true;
    progressWrap.hidden = false;
    progressFill.style.width = '0%';
    if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
    progressText.textContent = `0 / ${state.files.length}`;

    const quality = parseFloat(jpgQuality.value);

    let done = 0;
    for (const f of state.files) {
      try {
        const { blob, mime } = await stripExif(f.file, quality);
        const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
        const base = f.file.name.replace(/\.[^.]+$/, '');
        const name = `${base}-clean.${ext}`;
        const url = URL.createObjectURL(blob);
        state.results.push({ name, blob, url });
      } catch (e) {
        alert(`"${f.file.name}" 처리 실패: ${e.message}`);
      }
      done++;
      const pct = Math.round(done / state.files.length * 100);
      progressFill.style.width = pct + '%';
      if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', pct);
      progressText.textContent = `${done} / ${state.files.length}`;
    }

    applyBtn.disabled = false;
    clearBtn.disabled = false;
    newCount.textContent = `${state.results.length}장`;
    result.hidden = state.results.length === 0;
    downloadAllBtn.textContent = state.results.length > 1 ? '⬇ 전체 다운로드 (ZIP)' : '⬇ 다운로드';
    renderGrid();
  });

  function renderGrid() {
    imgGrid.innerHTML = '';
    state.results.forEach(r => {
      const card = document.createElement('div');
      card.className = 'img-card';
      card.innerHTML = `
        <div class="img-card-thumb"><img src="${r.url}" alt="${esc(r.name)}" loading="lazy" decoding="async"></div>
        <div class="img-card-meta">${esc(r.name)} · ${fmtSize(r.blob.size)}</div>
        <a class="img-card-dl" href="${r.url}" download="${esc(r.name)}">다운로드</a>
      `;
      imgGrid.appendChild(card);
    });
  }

  downloadAllBtn.addEventListener('click', async () => {
    if (!state.results.length) return;
    // 단일이면 그냥 받기
    if (state.results.length === 1) {
      const r = state.results[0];
      const a = document.createElement('a');
      a.href = r.url;
      a.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(r.name) : r.name);
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    // 다중 → ZIP
    if (!window.JSZip) {
      // CDN load 대기 폴백 — 1초 기다린 뒤 재시도
      await new Promise(res => setTimeout(res, 1000));
    }
    if (!window.JSZip) {
      alert('ZIP 라이브러리 로드 실패. 새로고침 후 다시 시도하세요. (대신 각 카드의 개별 다운로드 사용 가능)');
      return;
    }
    downloadAllBtn.disabled = true;
    const orig = downloadAllBtn.textContent;
    downloadAllBtn.textContent = 'ZIP 만드는 중…';
    try {
      const zip = new window.JSZip();
      for (const r of state.results) {
        zip.file(r.name, r.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      const zipName = (window.TayStudio && window.TayStudio.sanitizeFilename
        ? window.TayStudio.sanitizeFilename('exif-removed.zip')
        : 'exif-removed.zip');
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
    } catch (e) {
      alert('ZIP 생성 실패: ' + e.message);
    } finally {
      downloadAllBtn.disabled = false;
      downloadAllBtn.textContent = orig;
    }
  });
})();
