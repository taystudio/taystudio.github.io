/**
 * PDF to Image — pdf.js (Mozilla, Apache-2.0).
 * Last reviewed: 2026-05-06
 *
 * Flow:
 *  1. Upload one PDF → pdf.js shows page count and metadata
 *  2. User options — page range (parseRange, same pattern as pdf-split.js) + format (PNG/JPG) + DPI + JPG quality
 *  3. Convert — render each page on a canvas (scale = DPI/72) → toBlob(format, quality) → BlobURL
 *  4. Per-page thumbnails and download links in a grid. 'Download all' triggers sequential anchor clicks.
 *
 * Modules: pdf.js ESM. Single library — no pdf-lib needed.
 */

import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const pdfMeta = document.getElementById('pdfMeta');
const metaName = document.getElementById('metaName');
const metaPages = document.getElementById('metaPages');
const metaSize = document.getElementById('metaSize');
const optRow = document.getElementById('optRow');
const rangeIn = document.getElementById('rangeIn');
const formatSel = document.getElementById('formatSel');
const dpiSel = document.getElementById('dpiSel');
const qualityRow = document.getElementById('qualityRow');
const qualityIn = document.getElementById('qualityIn');
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
const downloadZipBtn = document.getElementById('downloadZipBtn');
const imgGrid = document.getElementById('imgGrid');

// JSZip CDN — loaded dynamically on first ZIP click. Only jsdelivr is allowed.
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

let currentFile = null;
let currentBytes = null;
let currentPdf = null; // pdf.js PDFDocumentProxy
let currentTotal = 0;
let resultUrls = []; // [{ url, filename, blob }]

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function parseRange(text, total) {
  const t = String(text || '').replace(/\s+/g, '');
  if (!t) {
    const all = [];
    for (let i = 0; i < total; i++) all.push(i);
    return all;
  }
  const out = [];
  const parts = t.split(',').filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [aStr, bStr] = part.split('-');
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < 1 || b < 1 || a > total || b > total) {
        throw new Error(`'${part}' is not a valid range (allowed: 1-${total}).`);
      }
      const step = a <= b ? 1 : -1;
      for (let i = a; step > 0 ? i <= b : i >= b; i += step) {
        out.push(i - 1);
      }
    } else {
      const n = parseInt(part, 10);
      if (!Number.isFinite(n) || n < 1 || n > total) {
        throw new Error(`'${part}' is not a valid page number (allowed: 1-${total}).`);
      }
      out.push(n - 1);
    }
  }
  return out;
}

function updateQualityVisibility() {
  qualityRow.style.display = formatSel.value === 'jpeg' ? '' : 'none';
}

async function loadFile(file) {
  if (!file || (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name))) {
    alert('Please select a PDF file.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
  result.hidden = true;
  imgGrid.innerHTML = '';
  revokeAll();
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';

  try {
    currentBytes = await file.arrayBuffer();
    currentPdf = await pdfjsLib.getDocument({ data: currentBytes.slice(0) }).promise;
    currentFile = file;
    currentTotal = currentPdf.numPages;

    metaName.textContent = file.name;
    metaPages.textContent = currentTotal + ' page(s)';
    metaSize.textContent = fmtBytes(file.size);
    pdfMeta.hidden = false;
    optRow.hidden = false;
    actionBar.hidden = false;
    rangeIn.placeholder = `e.g. 1-${Math.min(3, currentTotal)},${Math.min(5, currentTotal)} (empty = all ${currentTotal} pages)`;
    rangeIn.value = '';
    convertBtn.disabled = false;
  } catch (e) {
    alert('Failed to load PDF: ' + (e && e.message ? e.message : 'If the PDF is password-protected, unlock it first.'));
    clearAll();
  }
}

function revokeAll() {
  resultUrls.forEach(r => { if (r.url) URL.revokeObjectURL(r.url); });
  resultUrls = [];
}

async function convert() {
  if (!currentPdf) return;
  let indices;
  try {
    indices = parseRange(rangeIn.value, currentTotal);
  } catch (e) {
    alert(e.message);
    return;
  }
  if (indices.length === 0) {
    alert('No pages to convert.');
    return;
  }

  const format = formatSel.value;
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const dpi = parseInt(dpiSel.value, 10);
  const scale = dpi / 72;
  const quality = format === 'jpeg' ? Math.max(1, Math.min(100, parseInt(qualityIn.value, 10) || 90)) / 100 : undefined;

  convertBtn.disabled = true;
  const origLabel = convertBtn.textContent;
  convertBtn.textContent = 'Converting...';
  progressWrap.hidden = false;
  progressFill.style.width = '0%';
  progressWrap.setAttribute('aria-valuenow', '0');
  progressText.textContent = '0 / ' + indices.length;
  result.hidden = true;
  imgGrid.innerHTML = '';
  revokeAll();

  const baseName = (currentFile.name || 'document').replace(/\.pdf$/i, '');

  try {
    let totalBytes = 0;
    for (let i = 0; i < indices.length; i++) {
      const pageNum = indices[i] + 1;
      const page = await currentPdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('canvas.toBlob failed')), mime, quality);
      });
      const url = URL.createObjectURL(blob);
      const filename = `${baseName}-p${String(pageNum).padStart(3, '0')}.${ext}`;
      resultUrls.push({ url, filename, blob, pageNum });
      totalBytes += blob.size;

      addImgCard(url, filename, pageNum, blob.size, canvas);

      const pct = Math.round((i + 1) / indices.length * 100);
      progressFill.style.width = pct + '%';
      progressWrap.setAttribute('aria-valuenow', String(pct));
      progressText.textContent = (i + 1) + ' / ' + indices.length;
    }

    newCount.textContent = indices.length + ' image(s)';
    newSize.textContent = fmtBytes(totalBytes);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('Conversion failed: ' + (e && e.message ? e.message : 'Unknown error') + '\nTry a lower DPI or a smaller page range.');
  } finally {
    convertBtn.textContent = origLabel;
    convertBtn.disabled = false;
    setTimeout(() => { progressWrap.hidden = true; }, 600);
  }
}

function addImgCard(url, filename, pageNum, size, sourceCanvas) {
  const card = document.createElement('div');
  card.className = 'img-card';

  const thumb = document.createElement('div');
  thumb.className = 'img-card-thumb';
  const img = document.createElement('img');
  // Use the result image itself as a thumbnail (the browser scales it)
  img.src = url;
  img.alt = 'Page ' + pageNum;
  img.loading = 'lazy';
  thumb.appendChild(img);
  card.appendChild(thumb);

  const meta = document.createElement('div');
  meta.className = 'img-card-meta';
  meta.textContent = 'Page ' + pageNum + ' · ' + fmtBytes(size);
  card.appendChild(meta);

  const dl = document.createElement('a');
  dl.className = 'img-card-dl';
  dl.href = url;
  dl.download = filename;
  dl.textContent = '⬇ Download';
  card.appendChild(dl);

  imgGrid.appendChild(card);
}

async function ensureJSZip() {
  if (window.JSZip) return window.JSZip;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSZIP_CDN;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load JSZip — check your network connection.'));
    document.head.appendChild(s);
  });
  if (!window.JSZip) throw new Error('JSZip loaded but is not exposed on window.');
  return window.JSZip;
}

async function downloadZip() {
  if (resultUrls.length === 0) return;
  const origLabel = downloadZipBtn.textContent;
  downloadZipBtn.disabled = true;
  downloadZipBtn.textContent = 'Building ZIP...';
  try {
    const JSZip = await ensureJSZip();
    const zip = new JSZip();
    for (const r of resultUrls) {
      const safeName = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(r.filename) : r.filename);
      zip.file(safeName, r.blob);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const baseName = (currentFile && currentFile.name ? currentFile.name : 'document').replace(/\.pdf$/i, '');
    let zipName = baseName + '-pages.zip';
    if (window.TayStudio && window.TayStudio.sanitizeFilename) zipName = window.TayStudio.sanitizeFilename(zipName);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    alert('ZIP build failed: ' + (e && e.message ? e.message : 'Unknown error'));
  } finally {
    downloadZipBtn.textContent = origLabel;
    downloadZipBtn.disabled = false;
  }
}

function downloadAll() {
  if (resultUrls.length === 0) return;
  // Pre-confirm for 30+ files — browsers can block or delay bulk downloads
  const n = resultUrls.length;
  if (n >= 30) {
    const est = Math.ceil(n * 0.2);
    const msg = `Downloading ${n} files sequentially (about ${est}s).\n` +
      `Your browser may prompt for "Allow multiple downloads?" or block some.\n` +
      `For large batches, prefer per-file ⬇ buttons or a smaller page range.\n\nContinue?`;
    if (!confirm(msg)) return;
  }
  // Sequential anchor clicks. Some browsers block 5+ concurrent downloads — allow when prompted.
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
  currentFile = null;
  currentBytes = null;
  currentPdf = null;
  currentTotal = 0;
  fileInput.value = '';
  revokeAll();
  imgGrid.innerHTML = '';
  dropTitle.textContent = 'Drag a PDF file here, or click to select';
  pdfMeta.hidden = true;
  optRow.hidden = true;
  actionBar.hidden = true;
  progressWrap.hidden = true;
  result.hidden = true;
}

fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) loadFile(f);
});
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadFile(f);
});
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

formatSel.addEventListener('change', updateQualityVisibility);
convertBtn.addEventListener('click', convert);
clearBtn.addEventListener('click', clearAll);
downloadAllBtn.addEventListener('click', downloadAll);
if (downloadZipBtn) downloadZipBtn.addEventListener('click', downloadZip);
rangeIn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); convert(); }
});

updateQualityVisibility();
