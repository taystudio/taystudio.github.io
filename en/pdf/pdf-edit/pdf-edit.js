/**
 * PDF Edit — pdf-lib (Hopding, MIT) + pdf.js (Mozilla, Apache-2.0).
 * Last reviewed: 2026-05-06
 *
 * Flow:
 *  1. Upload one PDF → pdf.js renders a thumbnail canvas per page → cached as JPEG dataURL
 *  2. User actions (state in pages[]):
 *     - Rotate (rotation 0/90/180/270, ↻ adds +90 clockwise)
 *     - Toggle delete (deleted flag, ↺ restores)
 *     - Reorder (array splice — ↑ ↓ buttons + HTML5 drag-and-drop)
 *  3. Save: pdf-lib reloads the original → copyPages(indices in user order) →
 *     setRotation(degrees(rotation)) → save → Blob download
 *
 * Modules: pdf.js is ESM (import). pdf-lib is vendored UMD (global window.PDFLib).
 */

import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const pdfMeta = document.getElementById('pdfMeta');
const metaName = document.getElementById('metaName');
const metaPages = document.getElementById('metaPages');
const metaActive = document.getElementById('metaActive');
const loading = document.getElementById('loading');
const thumbsGrid = document.getElementById('thumbsGrid');
const actionBar = document.getElementById('actionBar');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const newPages = document.getElementById('newPages');
const newSize = document.getElementById('newSize');
const downloadBtn = document.getElementById('downloadBtn');

let originalFile = null;
let originalBytes = null; // ArrayBuffer (reused on save)
let pages = []; // { origIndex, rotation, deleted, thumb }
let resultUrl = null;
let dragSrcIdx = null;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateMeta() {
  if (!originalFile) {
    pdfMeta.hidden = true;
    return;
  }
  pdfMeta.hidden = false;
  metaName.textContent = originalFile.name;
  metaPages.textContent = pages.length + ' page(s)';
  const active = pages.filter(p => !p.deleted).length;
  metaActive.textContent = active + ' page(s)';
  saveBtn.disabled = (active === 0);
}

function render() {
  thumbsGrid.innerHTML = '';
  pages.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'thumb-card' + (p.deleted ? ' deleted' : '');
    card.dataset.idx = idx;
    card.draggable = !p.deleted;

    const wrap = document.createElement('div');
    wrap.className = 'thumb-img-wrap';
    const img = document.createElement('img');
    img.src = p.thumb;
    img.alt = 'Page ' + (p.origIndex + 1) + ' thumbnail';
    img.style.transform = 'rotate(' + p.rotation + 'deg)';
    wrap.appendChild(img);
    card.appendChild(wrap);

    const pgnum = document.createElement('div');
    pgnum.className = 'thumb-pgnum';
    pgnum.textContent = 'Page ' + (idx + 1) + ' (orig ' + (p.origIndex + 1) + ')'
      + (p.rotation ? ' · ' + p.rotation + '°' : '');
    card.appendChild(pgnum);

    const actions = document.createElement('div');
    actions.className = 'thumb-actions';
    const upBtn = btn('↑', 'up', 'Move up', idx === 0 || p.deleted);
    const downBtn = btn('↓', 'down', 'Move down', idx === pages.length - 1 || p.deleted);
    const rotBtn = btn('↻', 'rot', 'Rotate', p.deleted);
    const delBtn = p.deleted
      ? btn('↺', 'restore', 'Restore', false)
      : btn('✕', 'del', 'Delete', false);
    actions.append(upBtn, downBtn, rotBtn, delBtn);
    card.appendChild(actions);

    actions.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      const act = target.dataset.act;
      const i = idx;
      if (act === 'up' && i > 0) {
        [pages[i - 1], pages[i]] = [pages[i], pages[i - 1]];
      } else if (act === 'down' && i < pages.length - 1) {
        [pages[i + 1], pages[i]] = [pages[i], pages[i + 1]];
      } else if (act === 'rot') {
        pages[i].rotation = (pages[i].rotation + 90) % 360;
      } else if (act === 'del') {
        pages[i].deleted = true;
      } else if (act === 'restore') {
        pages[i].deleted = false;
      }
      render();
      updateMeta();
    });

    card.addEventListener('dragstart', (e) => {
      if (p.deleted) { e.preventDefault(); return; }
      dragSrcIdx = idx;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(idx)); } catch (_) {}
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.thumb-card.drag-over').forEach(el => el.classList.remove('drag-over'));
      dragSrcIdx = null;
    });
    card.addEventListener('dragover', (e) => {
      if (dragSrcIdx === null || dragSrcIdx === idx) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (dragSrcIdx === null || dragSrcIdx === idx) return;
      const moved = pages.splice(dragSrcIdx, 1)[0];
      pages.splice(idx, 0, moved);
      dragSrcIdx = null;
      render();
      updateMeta();
    });

    thumbsGrid.appendChild(card);
  });
}

function btn(label, act, title, disabled) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.dataset.act = act;
  b.title = title;
  if (disabled) b.disabled = true;
  return b;
}

async function loadPdf(file) {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    alert('Only PDF files can be uploaded.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
  originalFile = file;
  originalBytes = await file.arrayBuffer();
  loading.hidden = false;
  thumbsGrid.hidden = true;
  actionBar.hidden = true;
  result.hidden = true;
  pages = [];

  try {
    const pdf = await pdfjsLib.getDocument({ data: originalBytes.slice(0) }).promise;
    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const baseViewport = page.getViewport({ scale: 1 });
      const targetW = 150;
      const scale = targetW / baseViewport.width;
      const viewport = page.getViewport({ scale: Math.max(0.2, Math.min(0.6, scale)) });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      pages.push({
        origIndex: i,
        rotation: 0,
        deleted: false,
        thumb: canvas.toDataURL('image/jpeg', 0.7),
      });
    }
  } catch (e) {
    alert('Failed to load PDF: ' + (e && e.message ? e.message : 'Unknown error') + '\nIf the PDF is password-protected, unlock it first.');
    clearAll();
    return;
  } finally {
    loading.hidden = true;
  }

  thumbsGrid.hidden = false;
  actionBar.hidden = false;
  dropTitle.textContent = 'Select again to swap in a different PDF';
  render();
  updateMeta();
}

async function save() {
  const active = pages.filter(p => !p.deleted);
  if (active.length === 0) {
    alert('No pages remain. At least one page must be kept.');
    return;
  }
  if (!window.PDFLib) {
    alert('PDF library is still loading. Please try again in a moment.');
    return;
  }
  saveBtn.disabled = true;
  const orig = saveBtn.textContent;
  saveBtn.textContent = 'Saving...';
  try {
    const { PDFDocument, degrees } = window.PDFLib;
    const src = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
    const out = await PDFDocument.create();
    const indices = active.map(p => p.origIndex);
    const copied = await out.copyPages(src, indices);
    active.forEach((p, i) => {
      const cur = src.getPage(p.origIndex).getRotation().angle || 0;
      copied[i].setRotation(degrees((cur + p.rotation) % 360));
      out.addPage(copied[i]);
    });
    const bytes = await out.save();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);
    downloadBtn.href = resultUrl;
    const stem = (originalFile.name || 'edited').replace(/\.pdf$/i, '');
    downloadBtn.download = stem + '-edited.pdf';

    newPages.textContent = active.length + ' page(s)';
    newSize.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('Save failed: ' + (e && e.message ? e.message : 'Unknown error'));
  } finally {
    saveBtn.textContent = orig;
    updateMeta();
  }
}

function resetEdits() {
  pages.forEach(p => { p.rotation = 0; p.deleted = false; });
  pages.sort((a, b) => a.origIndex - b.origIndex);
  render();
  updateMeta();
  result.hidden = true;
}

function clearAll() {
  originalFile = null;
  originalBytes = null;
  pages = [];
  fileInput.value = '';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  thumbsGrid.innerHTML = '';
  thumbsGrid.hidden = true;
  actionBar.hidden = true;
  pdfMeta.hidden = true;
  result.hidden = true;
  dropTitle.textContent = 'Drag a PDF file here, or click to select';
}

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) loadPdf(e.target.files[0]);
  fileInput.value = '';
});
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) loadPdf(e.dataTransfer.files[0]);
});

saveBtn.addEventListener('click', save);
resetBtn.addEventListener('click', resetEdits);
clearBtn.addEventListener('click', clearAll);
