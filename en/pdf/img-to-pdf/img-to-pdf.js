/**
 * Image to PDF — pdf-lib (Hopding, MIT).
 * Last reviewed: 2026-05-05
 *
 * Flow:
 *  1. Accumulate multiple images (drag and click, additive)
 *  2. Reorder/delete via up/down/X buttons in the list
 *  3. Embed each image — JPG via embedJpg, PNG via embedPng, others (WebP/GIF/BMP) via canvas → PNG → embedPng
 *  4. Apply page size (A4 / Letter / original) + orientation (auto / portrait / landscape) + margin
 *  5. PDFDocument.save() → Blob → download link
 *
 * Globals: window.PDFLib
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const fileList = document.getElementById('fileList');
const pageSizeSel = document.getElementById('pageSize');
const orientSel = document.getElementById('orient');
const marginIn = document.getElementById('margin');
const marginValue = document.getElementById('marginValue');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const convCount = document.getElementById('convCount');
const convPages = document.getElementById('convPages');
const convSize = document.getElementById('convSize');
const downloadBtn = document.getElementById('downloadBtn');

let files = []; // { id, file, thumbUrl }
let nextId = 1;
let resultUrl = null;

// Unit conversions: 1pt = 1/72 inch, 1mm ≈ 2.83465 pt
const MM_TO_PT = 72 / 25.4;
const PAGE_SIZES = {
  a4:     { w: 210 * MM_TO_PT, h: 297 * MM_TO_PT }, // 595.28 × 841.89 pt
  letter: { w: 8.5 * 72,        h: 11 * 72 }        // 612 × 792 pt
};

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
      '<img class="thumb" alt="">' +
      '<span class="name"></span>' +
      '<span class="size"></span>' +
      '<span class="row-actions">' +
        '<button type="button" data-act="up" title="Move up">↑</button>' +
        '<button type="button" data-act="down" title="Move down">↓</button>' +
        '<button type="button" data-act="del" title="Remove">✕</button>' +
      '</span>';
    item.querySelector('.thumb').src = entry.thumbUrl;
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
        URL.revokeObjectURL(files[idx].thumbUrl);
        files.splice(idx, 1);
      }
      render();
      updateButtonState();
    });
    fileList.appendChild(item);
  });
  if (files.length > 0) {
    dropTitle.textContent = files.length + ' image(s) — drop more to add';
  } else {
    dropTitle.textContent = 'Drag multiple images here, or click to select';
  }
}

function updateButtonState() {
  convertBtn.disabled = files.length < 1;
  if (files.length === 0) result.hidden = true;
}

function addFiles(list) {
  for (const f of list) {
    if (!f.type.startsWith('image/')) continue;
    files.push({
      id: nextId++,
      file: f,
      thumbUrl: URL.createObjectURL(f)
    });
  }
  render();
  updateButtonState();
}

// Convert image to PNG ArrayBuffer via canvas — used for WebP / GIF / BMP / fallback JPEG
function fileToPngBytes(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('canvas → PNG conversion failed'));
        blob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image decode failed')); };
    img.src = url;
  });
}

async function convert() {
  if (files.length === 0) return;
  if (!window.PDFLib) {
    alert('PDF library is still loading. Please try again in a moment.');
    return;
  }
  convertBtn.disabled = true;
  const orig = convertBtn.textContent;
  convertBtn.textContent = 'Processing...';

  try {
    const { PDFDocument } = window.PDFLib;
    const doc = await PDFDocument.create();
    const sizeKey = pageSizeSel.value; // 'a4' | 'letter' | 'fit'
    const orient = orientSel.value;    // 'auto' | 'portrait' | 'landscape'
    const marginPt = parseFloat(marginIn.value) * MM_TO_PT;

    for (const entry of files) {
      const file = entry.file;
      let img;
      const lower = file.name.toLowerCase();

      try {
        if (file.type === 'image/jpeg' || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
          const buf = await file.arrayBuffer();
          img = await doc.embedJpg(buf);
        } else if (file.type === 'image/png' || lower.endsWith('.png')) {
          const buf = await file.arrayBuffer();
          img = await doc.embedPng(buf);
        } else {
          // WebP / GIF / BMP / etc → canvas → PNG, then embed
          const pngBuf = await fileToPngBytes(file);
          img = await doc.embedPng(pngBuf);
        }
      } catch (e) {
        // Some JPEGs are rejected by embedJpg — fall back via PNG path
        const pngBuf = await fileToPngBytes(file);
        img = await doc.embedPng(pngBuf);
      }

      // Determine page size
      let pageW, pageH;
      if (sizeKey === 'fit') {
        // Map original pixels to pt 1:1 (1px = 1pt)
        pageW = img.width;
        pageH = img.height;
      } else {
        const base = PAGE_SIZES[sizeKey];
        let w = base.w, h = base.h;
        const isLandscape = orient === 'landscape' || (orient === 'auto' && img.width > img.height);
        if (isLandscape) { [w, h] = [h, w]; }
        pageW = w;
        pageH = h;
      }

      const page = doc.addPage([pageW, pageH]);

      if (sizeKey === 'fit') {
        page.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH });
      } else {
        // Margin + aspect-preserving + center
        const innerW = Math.max(1, pageW - marginPt * 2);
        const innerH = Math.max(1, pageH - marginPt * 2);
        const scale = Math.min(innerW / img.width, innerH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;
        page.drawImage(img, { x: x, y: y, width: drawW, height: drawH });
      }
    }

    const bytes = await doc.save();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);

    downloadBtn.href = resultUrl;
    downloadBtn.download = 'images-' + new Date().toISOString().slice(0, 10) + '.pdf';

    convCount.textContent = files.length + ' image(s)';
    convPages.textContent = doc.getPageCount() + ' page(s)';
    convSize.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('PDF conversion failed: ' + (e && e.message ? e.message : 'Unknown error'));
  } finally {
    convertBtn.textContent = orig;
    updateButtonState();
  }
}

function clearAll() {
  files.forEach((f) => URL.revokeObjectURL(f.thumbUrl));
  files = [];
  fileInput.value = '';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  render();
  updateButtonState();
  result.hidden = true;
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
  if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
});

marginIn.addEventListener('input', () => { marginValue.textContent = marginIn.value; });
convertBtn.addEventListener('click', convert);
clearBtn.addEventListener('click', clearAll);
