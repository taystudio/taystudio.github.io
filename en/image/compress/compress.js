/**
 * Image Compress — canvas API based, all processing in the browser.
 * Multiple-image batch support (2026-06): 1 image = preview, 2+ = list + ZIP download.
 *
 * Flow:
 *  1. File input (multiple) → decoded into Image objects
 *  2. Drawn at native size onto a canvas → canvas.toBlob(type, quality)
 *  3. 1 image: preview + meta + single download / 2+: result list + JSZip ZIP
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const formatSel = document.getElementById('format');
const qualityField = document.getElementById('qualityField');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const compressBtn = document.getElementById('compressBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const previewImg = document.getElementById('previewImg');
const origSize = document.getElementById('origSize');
const compSize = document.getElementById('compSize');
const reduceRate = document.getElementById('reduceRate');
const dimText = document.getElementById('dimText');
const downloadBtn = document.getElementById('downloadBtn');
const resultMulti = document.getElementById('resultMulti');
const multiSummary = document.getElementById('multiSummary');
const multiList = document.getElementById('multiList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const qualityHint = document.getElementById('qualityHint');
const QUALITY_HINT_DEFAULT = qualityHint ? qualityHint.textContent : '';
const QUALITY_HINT_PNG = 'PNG is lossless — the quality slider has no effect. To shrink, switch the output format to JPEG or WebP.';

let items = [];
let singleUrl = null;
let zipUrl = null;
let multiUrls = [];

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function updateQualityUI() {
  qualityValue.textContent = parseFloat(qualityInput.value).toFixed(2);
  const isPng = formatSel.value === 'image/png';
  qualityField.style.opacity = isPng ? '0.4' : '1';
  qualityInput.disabled = isPng;
  if (qualityHint) {
    qualityHint.textContent = isPng ? QUALITY_HINT_PNG : QUALITY_HINT_DEFAULT;
    qualityHint.style.opacity = '1';
  }
}

function revokeAll() {
  if (singleUrl) { URL.revokeObjectURL(singleUrl); singleUrl = null; }
  if (zipUrl) { URL.revokeObjectURL(zipUrl); zipUrl = null; }
  multiUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); multiUrls = [];
  items.forEach(it => { if (it.url) { try { URL.revokeObjectURL(it.url); } catch (e) {} } });
}

function clearAll() {
  revokeAll();
  items = [];
  fileInput.value = '';
  dropTitle.textContent = 'Drag images here, or click to choose';
  compressBtn.disabled = true;
  result.hidden = true;
  if (resultMulti) resultMulti.hidden = true;
  previewImg.removeAttribute('src');
}

function decodeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}

async function loadFiles(fileList) {
  const arr = [...(fileList || [])].filter(Boolean);
  const imgFiles = arr.filter(f => f.type && f.type.startsWith('image/'));
  if (!imgFiles.length) { alert('Please choose image files.'); return; }

  const valid = [];
  for (const f of imgFiles) {
    if (f.size === 0) continue;
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, 'Image')) continue;
    valid.push(f);
  }
  if (!valid.length) return;

  revokeAll();
  items = [];
  let failed = 0;
  for (const f of valid) {
    try { const { img, url } = await decodeImage(f); items.push({ file: f, image: img, url }); }
    catch (e) { failed++; }
  }
  if (!items.length) { alert('Could not decode these images. Try different files.'); clearAll(); return; }

  dropTitle.textContent = items.length === 1
    ? (items[0].file.name + ' (' + fmtBytes(items[0].file.size) + ')')
    : (items.length + ' images selected' + (failed ? ' · ' + failed + ' failed to decode (skipped)' : ''));
  compressBtn.disabled = false;
  result.hidden = true;
  if (resultMulti) resultMulti.hidden = true;
}

function compressOne(item, type, quality) {
  return new Promise((resolve, reject) => {
    const img = item.image;
    const canvas = document.createElement('canvas');
    try {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (type === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);
    } catch (e) { reject(e); return; }
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('toBlob null')); return; }
      resolve({ blob, w: canvas.width, h: canvas.height });
    }, type, quality);
  });
}

function extOf(type) { return type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png'; }

async function run() {
  if (!items.length) return;
  const type = formatSel.value;
  const quality = parseFloat(qualityInput.value);
  const ext = extOf(type);
  compressBtn.disabled = true;
  try {
    if (items.length === 1) {
      const it = items[0];
      let out;
      try { out = await compressOne(it, type, quality); }
      catch (e) { alert('Compression failed. The image may be too large or your browser may be out of memory.'); return; }
      if (singleUrl) URL.revokeObjectURL(singleUrl);
      singleUrl = URL.createObjectURL(out.blob);
      previewImg.src = singleUrl;
      origSize.textContent = fmtBytes(it.file.size);
      compSize.textContent = fmtBytes(out.blob.size);
      const reduce = (1 - out.blob.size / it.file.size) * 100;
      reduceRate.textContent = (reduce >= 0 ? '−' : '+') + Math.abs(reduce).toFixed(1) + '%';
      reduceRate.style.color = out.blob.size > it.file.size ? '#dc2626' : '';
      dimText.textContent = out.w + '×' + out.h;
      const base = (it.file.name || 'image').replace(/\.[^./]+$/, '');
      const dn = base + '-compressed.' + ext;
      downloadBtn.href = singleUrl;
      downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename) ? window.TayStudio.sanitizeFilename(dn) : dn;
      if (resultMulti) resultMulti.hidden = true;
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      if (typeof JSZip === 'undefined') { alert('Compression library (JSZip) failed to load. Refresh and try again.'); return; }
      multiUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); multiUrls = [];
      const zip = new JSZip();
      const used = new Set();
      let totalIn = 0, totalOut = 0;
      const rows = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        let out;
        try { out = await compressOne(it, type, quality); }
        catch (e) { rows.push({ name: it.file.name || ('image' + (i + 1)), err: true }); continue; }
        totalIn += it.file.size; totalOut += out.blob.size;
        let base = (it.file.name || ('image' + (i + 1))).replace(/\.[^./]+$/, '');
        let nm = base + '-compressed.' + ext, k = 1;
        while (used.has(nm)) { nm = base + '-compressed-' + (k++) + '.' + ext; }
        used.add(nm);
        zip.file(nm, out.blob);
        const u = URL.createObjectURL(out.blob); multiUrls.push(u);
        rows.push({ name: it.file.name || nm, dlName: nm, url: u, before: it.file.size, after: out.blob.size, reduce: (1 - out.blob.size / it.file.size) * 100 });
        await new Promise(r => setTimeout(r, 0));
      }
      const okRows = rows.filter(r => !r.err);
      if (!okRows.length) { alert('Compression failed. Please check your files.'); return; }
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      if (zipUrl) URL.revokeObjectURL(zipUrl);
      zipUrl = URL.createObjectURL(zipBlob);

      const saved = totalIn ? (1 - totalOut / totalIn) * 100 : 0;
      multiSummary.innerHTML = '<b>' + okRows.length + ' images</b> · ' + esc(fmtBytes(totalIn)) + ' → <b>' + esc(fmtBytes(totalOut)) + '</b> ('
        + (saved >= 0 ? '−' : '+') + Math.abs(saved).toFixed(1) + '%)' + (rows.length - okRows.length ? ' · ' + (rows.length - okRows.length) + ' failed' : '');
      multiList.innerHTML = rows.map(r => r.err
        ? '<div class="mc-row mc-err">' + esc(r.name) + ' — failed</div>'
        : '<div class="mc-row"><span class="mc-nm">' + esc(r.name) + '</span><span class="mc-sz">' + esc(fmtBytes(r.before)) + ' → ' + esc(fmtBytes(r.after)) + ' <b>(' + (r.reduce >= 0 ? '−' : '+') + Math.abs(r.reduce).toFixed(0) + '%)</b></span><a class="mc-dl" href="' + r.url + '" download="' + esc(r.dlName) + '" title="Download this image">⬇</a></div>'
      ).join('');
      const zipName = 'compressed-images.zip';
      downloadAllBtn.href = zipUrl;
      downloadAllBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename) ? window.TayStudio.sanitizeFilename(zipName) : zipName;
      result.hidden = true;
      resultMulti.hidden = false;
      resultMulti.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } finally {
    compressBtn.disabled = false;
  }
}

fileInput.addEventListener('change', (e) => { if (e.target.files && e.target.files.length) loadFiles(e.target.files); });

['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  if (window.TayStudio && TayStudio.rejectFolderDrop && TayStudio.rejectFolderDrop(e)) return;
  const fs = e.dataTransfer && e.dataTransfer.files;
  if (fs && fs.length) loadFiles(fs);
});
if (window.TayStudio && TayStudio.bindPasteImage) {
  TayStudio.bindPasteImage(files => { if (files && files.length) loadFiles(files); });
}
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

qualityInput.addEventListener('input', updateQualityUI);
formatSel.addEventListener('change', updateQualityUI);

compressBtn.addEventListener('click', run);
clearBtn.addEventListener('click', clearAll);

updateQualityUI();
