/**
 * HEIC → JPG conversion — heic2any (MIT, bundles libheif WASM).
 * Last verified: 2026-05-09
 *
 * Flow:
 *  1. Multi-select / drag-drop HEIC + HEIF files (cumulative)
 *  2. Choose output format (JPG / PNG) + quality (JPG only)
 *  3. heic2any converts each file via libheif WASM → JPG / PNG encoding
 *  4. Per-file thumbnails + downloads. "Download all" iterates anchor clicks at 200ms intervals.
 *
 * Globals: window.heic2any (heic2any.min.js UMD)
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const fileList = document.getElementById('fileList');
const optRow = document.getElementById('optRow');
const formatSel = document.getElementById('formatSel');
const qualityRow = document.getElementById('qualityRow');
const qualityIn = document.getElementById('qualityIn');
const qualityVal = document.getElementById('qualityVal');
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

let files = []; // { id, file, status: 'pending'|'done'|'err', errMsg }
let nextId = 1;
let resultUrls = []; // { url, filename, blob, srcName }

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateQualityVisibility() {
  qualityRow.style.display = formatSel.value === 'jpeg' ? '' : 'none';
}

function renderFileList() {
  fileList.innerHTML = '';
  files.forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML =
      '<span class="order">' + (idx + 1) + '</span>' +
      '<span class="name"></span>' +
      '<span class="size"></span>' +
      '<span class="status"></span>' +
      '<span class="row-actions"><button type="button" data-act="del" title="Remove">✕</button></span>';
    item.querySelector('.name').textContent = entry.file.name;
    item.querySelector('.size').textContent = fmtBytes(entry.file.size);
    const statusEl = item.querySelector('.status');
    if (entry.status === 'done') { statusEl.textContent = 'Done'; statusEl.classList.add('done'); }
    else if (entry.status === 'err') { statusEl.textContent = 'Failed'; statusEl.classList.add('err'); statusEl.title = entry.errMsg || ''; }
    else { statusEl.textContent = 'Pending'; }
    item.querySelector('[data-act="del"]').addEventListener('click', () => {
      files.splice(idx, 1);
      renderFileList();
      updateActionBar();
    });
    fileList.appendChild(item);
  });
}

function updateActionBar() {
  const has = files.length > 0;
  optRow.hidden = !has;
  actionBar.hidden = !has;
  convertBtn.disabled = !has;
  if (!has) result.hidden = true;
  dropTitle.textContent = has ? files.length + ' HEIC file(s) — drop more to add' : 'Drag HEIC files here, or click to choose';
}

function addFiles(list) {
  for (const f of list) {
    const lower = (f.name || '').toLowerCase();
    if (!/\.(heic|heif)$/.test(lower) && !/heic|heif/.test(f.type || '')) {
      // Some mobile browsers omit MIME type — re-check by extension and skip if it still doesn't match.
      continue;
    }
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, 'HEIC')) continue;
    files.push({ id: nextId++, file: f, status: 'pending' });
  }
  renderFileList();
  updateActionBar();
}

function revokeAll() {
  resultUrls.forEach(r => { if (r.url) URL.revokeObjectURL(r.url); });
  resultUrls = [];
}

async function convert() {
  if (files.length === 0) return;
  if (!window.heic2any) {
    alert('The HEIC library is still loading. Try again in a moment.');
    return;
  }
  if (files.length > 20) {
    if (!confirm('Batch converting ' + files.length + ' files — risk of out-of-memory or browser freeze. Continue?')) return;
  }
  const format = formatSel.value;
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const quality = format === 'jpeg'
    ? Math.max(1, Math.min(100, parseInt(qualityIn.value, 10) || 90)) / 100
    : 1;

  convertBtn.disabled = true;
  const origLabel = convertBtn.textContent;
  convertBtn.textContent = 'Converting...';
  progressWrap.hidden = false;
  progressFill.style.width = '0%';
  progressWrap.setAttribute('aria-valuenow', '0');
  progressText.textContent = '0 / ' + files.length;
  result.hidden = true;
  imgGrid.innerHTML = '';
  revokeAll();

  let totalBytes = 0;
  let okCount = 0;

  for (let i = 0; i < files.length; i++) {
    const entry = files[i];
    try {
      const out = await window.heic2any({
        blob: entry.file,
        toType: mime,
        quality,
      });
      // heic2any returns either a single Blob or Blob[] (multi-page HEIC). Take the first.
      const blob = Array.isArray(out) ? out[0] : out;
      const url = URL.createObjectURL(blob);
      const baseName = entry.file.name.replace(/\.(heic|heif)$/i, '');
      const filename = baseName + '.' + ext;
      resultUrls.push({ url, filename, blob, srcName: entry.file.name });
      addImgCard(url, filename, blob.size);
      totalBytes += blob.size;
      okCount += 1;
      entry.status = 'done';
    } catch (e) {
      entry.status = 'err';
      entry.errMsg = (e && e.message) || 'Unknown error';
    }
    renderFileList();
    const pct = Math.round((i + 1) / files.length * 100);
    progressFill.style.width = pct + '%';
    progressWrap.setAttribute('aria-valuenow', String(pct));
    progressText.textContent = (i + 1) + ' / ' + files.length;
  }

  if (okCount > 0) {
    newCount.textContent = okCount + ' file(s)' + (okCount < files.length ? ' (' + (files.length - okCount) + ' failed)' : '');
    newSize.textContent = fmtBytes(totalBytes);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    alert('All files failed to convert. Make sure they are valid HEIC files.');
  }
  convertBtn.textContent = origLabel;
  convertBtn.disabled = false;
  setTimeout(() => { progressWrap.hidden = true; }, 600);
}

function addImgCard(url, filename, size) {
  const card = document.createElement('div');
  card.className = 'img-card';

  const thumb = document.createElement('div');
  thumb.className = 'img-card-thumb';
  const img = document.createElement('img');
  img.src = url;
  img.alt = filename;
  img.loading = 'lazy';
  thumb.appendChild(img);
  card.appendChild(thumb);

  const meta = document.createElement('div');
  meta.className = 'img-card-meta';
  meta.textContent = filename + ' · ' + fmtBytes(size);
  card.appendChild(meta);

  const dl = document.createElement('a');
  dl.className = 'img-card-dl';
  dl.href = url;
  dl.download = filename;
  dl.textContent = '⬇ Download';
  card.appendChild(dl);

  imgGrid.appendChild(card);
}

function downloadAll() {
  if (resultUrls.length === 0) return;
  resultUrls.forEach((r, idx) => {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = r.url;
      a.download = r.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, idx * 200);
  });
}

function clearAll() {
  files = [];
  fileInput.value = '';
  revokeAll();
  imgGrid.innerHTML = '';
  renderFileList();
  updateActionBar();
}

fileInput.addEventListener('change', (e) => {
  if (e.target.files) addFiles(e.target.files);
  fileInput.value = '';
});
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return;
  if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
});
// Ctrl+V 이미지 붙여넣기
if (window.TayStudio && TayStudio.bindPasteImage) {
  TayStudio.bindPasteImage(files => { addFiles(files); });
}
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

formatSel.addEventListener('change', updateQualityVisibility);
qualityIn.addEventListener('input', () => { qualityVal.textContent = qualityIn.value; });
convertBtn.addEventListener('click', convert);
clearBtn.addEventListener('click', clearAll);
downloadAllBtn.addEventListener('click', downloadAll);

updateQualityVisibility();
