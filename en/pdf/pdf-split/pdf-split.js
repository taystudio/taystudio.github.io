/**
 * Split PDF — pdf-lib (Hopding, MIT).
 * Last reviewed: 2026-05-05
 *
 * Flow:
 *  1. Upload one PDF → PDFDocument.load → show page count
 *  2. Parse user range input (e.g. "1-3,5,7-10") into 1-based index array
 *  3. PDFDocument.create() + copyPages → save → Blob → download
 *
 * Globals: window.PDFLib
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const pdfMeta = document.getElementById('pdfMeta');
const origPages = document.getElementById('origPages');
const origSize = document.getElementById('origSize');
const rangeField = document.getElementById('rangeField');
const rangeIn = document.getElementById('rangeIn');
const splitBtn = document.getElementById('splitBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const newPages = document.getElementById('newPages');
const newSize = document.getElementById('newSize');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let currentDoc = null;       // loaded PDFDocument (for displaying page count)
let currentBytes = null;     // ArrayBuffer kept around for re-loading
let currentTotal = 0;
let resultUrl = null;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function parseRange(text, total) {
  // "1-3,5,7-10" → [0,1,2,4,6,7,8,9] (0-based)
  const out = [];
  const parts = String(text).replace(/\s+/g, '').split(',').filter(Boolean);
  if (parts.length === 0) throw new Error('Range is empty.');
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

async function loadFile(file) {
  if (!file || (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name))) {
    alert('Please select a PDF file.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
  if (!window.PDFLib) {
    alert('PDF library is still loading. Please try again in a moment.');
    return;
  }
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  result.hidden = true;
  splitBtn.disabled = true;
  try {
    const { PDFDocument } = window.PDFLib;
    currentBytes = await file.arrayBuffer();
    currentDoc = await PDFDocument.load(currentBytes, { ignoreEncryption: true });
    currentFile = file;
    currentTotal = currentDoc.getPageCount();
    origPages.textContent = currentTotal + ' page(s)';
    origSize.textContent = fmtBytes(file.size);
    pdfMeta.hidden = false;
    rangeField.hidden = false;
    rangeIn.placeholder = `e.g. 1-${Math.min(3, currentTotal)},${Math.min(5, currentTotal)}`;
    rangeIn.value = '1-' + currentTotal;
    splitBtn.disabled = false;
  } catch (e) {
    alert('Failed to load PDF: ' + (e && e.message ? e.message : 'If the PDF is password-protected, unlock it first.'));
    clearAll();
  }
}

async function split() {
  if (!currentFile || !currentDoc) return;
  let indices;
  try {
    indices = parseRange(rangeIn.value, currentTotal);
  } catch (e) {
    alert(e.message);
    return;
  }
  if (indices.length === 0) {
    alert('No pages to extract.');
    return;
  }
  splitBtn.disabled = true;
  const orig = splitBtn.textContent;
  splitBtn.textContent = 'Processing...';
  try {
    const { PDFDocument } = window.PDFLib;
    // copyPages does not mutate source, but reload for safety with a fresh instance
    const src = await PDFDocument.load(currentBytes, { ignoreEncryption: true });
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);

    const baseName = (currentFile.name || 'document').replace(/\.pdf$/i, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = baseName + '-pages.pdf';

    newPages.textContent = indices.length + ' page(s)';
    newSize.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('Extraction failed: ' + (e && e.message ? e.message : 'Unknown error'));
  } finally {
    splitBtn.textContent = orig;
    splitBtn.disabled = false;
  }
}

function clearAll() {
  currentFile = null;
  currentDoc = null;
  currentBytes = null;
  currentTotal = 0;
  fileInput.value = '';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  dropTitle.textContent = 'Drag a PDF file here, or click to select';
  pdfMeta.hidden = true;
  rangeField.hidden = true;
  rangeIn.value = '';
  splitBtn.disabled = true;
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

splitBtn.addEventListener('click', split);
clearBtn.addEventListener('click', clearAll);
rangeIn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); split(); }
});
