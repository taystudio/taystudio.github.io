/**
 * Image OCR — Tesseract.js (Apache-2.0).
 * Last verified: 2026-05-09
 *
 * Flow:
 *  1. Upload image → preview
 *  2. Pick language and click extract → Tesseract.recognize(image, lang, { logger })
 *  3. Progress events update the bar
 *  4. Show extracted text + confidence → copy / TXT download
 *
 * Globals: window.Tesseract
 * Training data and worker JS are auto-downloaded from jsdelivr on first use, cached in IndexedDB.
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const previewBox = document.getElementById('previewBox');
const previewImg = document.getElementById('previewImg');
const langSel = document.getElementById('lang');
const ocrBtn = document.getElementById('ocrBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const confValue = document.getElementById('confValue');
const charCount = document.getElementById('charCount');
const ocrText = document.getElementById('ocrText');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let currentObjectURL = null;
let txtBlobUrl = null;
let currentWorker = null;

const STATUS_LABEL = {
  'loading tesseract core': 'Loading OCR engine',
  'initializing tesseract': 'Initializing OCR engine',
  'loading language traineddata': 'Downloading language data',
  'initializing api': 'Initializing API',
  'recognizing text': 'Recognizing text'
};

function setProgress(status, ratio) {
  progressWrap.hidden = false;
  const pct = Math.round((ratio || 0) * 100);
  progressFill.style.width = pct + '%';
  progressWrap.setAttribute('aria-valuenow', String(pct));
  const label = STATUS_LABEL[status] || status || 'Processing';
  progressText.textContent = label + ' — ' + pct + '%';
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 50, 'Image')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
  if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
  currentObjectURL = URL.createObjectURL(file);
  previewImg.src = currentObjectURL;
  previewBox.hidden = false;
  ocrBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
}

async function runOcr() {
  if (!currentFile) return;
  if (!window.Tesseract) {
    alert('OCR engine is still loading. Please refresh the page.');
    return;
  }
  ocrBtn.disabled = true;
  const orig = ocrBtn.textContent;
  ocrBtn.textContent = 'Processing...';
  cancelBtn.hidden = false;
  setProgress('starting', 0);

  const lang = langSel.value;
  let worker = null;
  try {
    worker = await window.Tesseract.createWorker(lang, 1, {
      logger: (m) => {
        if (m && typeof m.progress === 'number') setProgress(m.status, m.progress);
      }
    });
    currentWorker = worker;
    const { data } = await worker.recognize(currentFile);

    if (currentWorker !== worker) return;

    progressFill.style.width = '100%';
    progressWrap.setAttribute('aria-valuenow', '100');
    progressText.textContent = 'Done ✓';

    const text = (data && data.text) || '';
    const conf = (data && typeof data.confidence === 'number') ? data.confidence.toFixed(1) : '—';

    confValue.textContent = conf + '%';
    charCount.textContent = text.length + ' chars';
    ocrText.value = text.trim();

    if (txtBlobUrl) URL.revokeObjectURL(txtBlobUrl);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    txtBlobUrl = URL.createObjectURL(blob);
    const baseName = (currentFile.name || 'image').replace(/\.[^./]+$/, '');
    downloadBtn.href = txtBlobUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '-ocr.txt') : baseName + '-ocr.txt');

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    const msg = e && e.message ? e.message : '';
    if (/terminat|abort/i.test(msg) || currentWorker !== worker) {
      progressText.textContent = 'Cancelled';
    } else {
      progressText.textContent = 'Failed: ' + (msg || 'unknown error');
      progressFill.style.width = '0%';
      progressWrap.setAttribute('aria-valuenow', '0');
      alert('OCR failed: ' + (msg || 'network or browser issue') + '\nRefresh the page and try again, or test with a different image.');
    }
  } finally {
    if (worker && currentWorker === worker) {
      try { await worker.terminate(); } catch {}
      currentWorker = null;
    }
    cancelBtn.hidden = true;
    ocrBtn.textContent = orig;
    ocrBtn.disabled = false;
  }
}

async function cancelOcr() {
  if (!currentWorker) return;
  const w = currentWorker;
  currentWorker = null;
  try { await w.terminate(); } catch {}
  progressText.textContent = 'Cancelled';
  cancelBtn.hidden = true;
}

function clearAll() {
  currentFile = null;
  if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
  if (txtBlobUrl) { URL.revokeObjectURL(txtBlobUrl); txtBlobUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = 'Drag an image here, or click to choose';
  previewImg.removeAttribute('src');
  previewBox.hidden = true;
  ocrBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  progressWrap.setAttribute('aria-valuenow', '0');
  ocrText.value = '';
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

ocrBtn.addEventListener('click', runOcr);
cancelBtn.addEventListener('click', cancelOcr);
clearBtn.addEventListener('click', clearAll);

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(ocrText.value);
    const orig = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied';
    setTimeout(() => { copyBtn.textContent = orig; }, 1500);
  } catch {
    ocrText.select();
    document.execCommand('copy');
  }
});
