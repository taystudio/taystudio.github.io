/**
 * Merge PDF — pdf-lib (Hopding, MIT).
 * Last reviewed: 2026-05-05
 *
 * Flow:
 *  1. Accumulate multiple PDF files (drag and click, additive)
 *  2. Reorder/delete via up/down/X buttons in the list
 *  3. PDFDocument.create() + copyPages from each source → addPage to new doc
 *  4. save() → Blob → download link
 *
 * Globals: window.PDFLib (pdf-lib UMD)
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const fileList = document.getElementById('fileList');
const mergeBtn = document.getElementById('mergeBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const mergedCount = document.getElementById('mergedCount');
const mergedPages = document.getElementById('mergedPages');
const mergedSize = document.getElementById('mergedSize');
const downloadBtn = document.getElementById('downloadBtn');

let files = []; // { id, file }
let nextId = 1;
let resultUrl = null;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function render() {
  fileList.innerHTML = '';
  files.forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML =
      '<span class="order">' + (idx + 1) + '</span>' +
      '<span class="name"></span>' +
      '<span class="size"></span>' +
      '<span class="row-actions">' +
        '<button type="button" data-act="up" title="Move up">↑</button>' +
        '<button type="button" data-act="down" title="Move down">↓</button>' +
        '<button type="button" data-act="del" title="Remove">✕</button>' +
      '</span>';
    item.querySelector('.name').textContent = entry.file.name;
    item.querySelector('.size').textContent = fmtBytes(entry.file.size);
    const actions = item.querySelector('.row-actions');
    actions.querySelector('[data-act="up"]').disabled = (idx === 0);
    actions.querySelector('[data-act="down"]').disabled = (idx === files.length - 1);
    actions.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'up' && idx > 0) {
        [files[idx - 1], files[idx]] = [files[idx], files[idx - 1]];
      } else if (act === 'down' && idx < files.length - 1) {
        [files[idx + 1], files[idx]] = [files[idx], files[idx + 1]];
      } else if (act === 'del') {
        files.splice(idx, 1);
      }
      render();
      updateButtonState();
    });
    fileList.appendChild(item);
  });
  if (files.length > 0) {
    dropTitle.textContent = files.length + ' PDF(s) — drop more to add';
  } else {
    dropTitle.textContent = 'Drag multiple PDF files here, or click to select';
  }
}

function updateButtonState() {
  mergeBtn.disabled = files.length < 1;
  if (files.length === 0) result.hidden = true;
}

function addFiles(list) {
  for (const f of list) {
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) continue;
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, 'PDF')) continue;
    files.push({ id: nextId++, file: f });
  }
  render();
  updateButtonState();
}

async function merge() {
  if (files.length === 0) return;
  if (!window.PDFLib) {
    alert('PDF library is still loading. Please try again in a moment.');
    return;
  }
  mergeBtn.disabled = true;
  const orig = mergeBtn.textContent;
  mergeBtn.textContent = 'Processing...';
  try {
    const { PDFDocument } = window.PDFLib;
    const out = await PDFDocument.create();
    let pageTotal = 0;
    for (const entry of files) {
      const bytes = await entry.file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const indices = src.getPageIndices();
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      pageTotal += indices.length;
    }
    const merged = await out.save();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([merged], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);
    downloadBtn.href = resultUrl;
    downloadBtn.download = 'merged-' + new Date().toISOString().slice(0, 10) + '.pdf';

    mergedCount.textContent = files.length + ' file(s)';
    mergedPages.textContent = pageTotal + ' page(s)';
    mergedSize.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('Merge failed: ' + (e && e.message ? e.message : 'Unknown error') + '\nIf any PDF is password-protected, unlock it first.');
  } finally {
    mergeBtn.textContent = orig;
    updateButtonState();
  }
}

function clearAll() {
  files = [];
  fileInput.value = '';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  render();
  updateButtonState();
  result.hidden = true;
}

fileInput.addEventListener('change', (e) => {
  if (e.target.files) addFiles(e.target.files);
  fileInput.value = ''; // allow re-selecting the same file
});
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
});
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

mergeBtn.addEventListener('click', merge);
clearBtn.addEventListener('click', clearAll);
