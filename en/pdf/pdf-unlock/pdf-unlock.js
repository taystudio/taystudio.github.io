/**
 * PDF Password Remover — qpdf (WebAssembly, Apache 2.0) + pdf-lib (page count display).
 * Last verified: 2026-06-12
 *
 * Flow:
 *  1. Register one encrypted PDF
 *  2. User enters the password they know
 *  3. qpdf-wasm: callMain(['/in.pdf', '--password=…', '--decrypt', '--', '/out.pdf'])
 *     - return code 2 or stderr "invalid password" → wrong-password alert
 *     - return code 0 → lossless decryption (text, images, links all preserved)
 *  4. Decrypted bytes → Blob → download. Filename: {original}-unlocked.pdf
 *
 * Why qpdf:
 *   pdf-lib / PDF.js cannot decrypt encrypted PDF content (rendering only).
 *   qpdf is a real decryption engine — it removes the password while keeping the
 *   original structure intact.
 *
 * Module import: createQpdf (ESM) · Global: window.PDFLib (for page count, optional)
 */

import createQpdf from '/pdf/vendor/qpdf.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const selectedFile = document.getElementById('selectedFile');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeBtn = document.getElementById('removeBtn');
const passwordInput = document.getElementById('passwordInput');
const togglePw = document.getElementById('togglePw');
const unlockBtn = document.getElementById('unlockBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const resultPages = document.getElementById('resultPages');
const resultSize = document.getElementById('resultSize');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let resultUrl = null;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateButtonState() {
  const passwordRow = document.getElementById('passwordRow');
  const actionRow = document.getElementById('actionRow');
  const has = !!currentFile;
  if (passwordRow) passwordRow.hidden = !has;
  if (actionRow) actionRow.hidden = !has;
  unlockBtn.disabled = !has;
  if (has) {
    // Auto-focus password input right after a PDF is uploaded
    setTimeout(() => passwordInput.focus(), 50);
  }
}

function setFile(f) {
  if (!f) return;
  if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) {
    alert('Only PDF files are supported.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, 'PDF')) return;
  currentFile = f;
  fileName.textContent = f.name;
  fileSize.textContent = fmtBytes(f.size);
  selectedFile.hidden = false;
  dropTitle.textContent = 'Drag or click to replace with another PDF';
  result.hidden = true;
  updateButtonState();
}

function removeFile() {
  currentFile = null;
  fileInput.value = '';
  selectedFile.hidden = true;
  dropTitle.textContent = 'Drag the encrypted PDF here, or click to select';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  result.hidden = true;
  updateButtonState();
}

function clearAll() {
  removeFile();
  passwordInput.value = '';
  passwordInput.type = 'password';
  togglePw.textContent = 'Show';
  togglePw.setAttribute('aria-pressed', 'false');
}

// A qpdf module instance is not guaranteed to be reusable after one callMain, so create a fresh one per conversion.
async function runQpdfDecrypt(inputBytes, password) {
  const stderr = [];
  const qpdf = await createQpdf({
    locateFile: () => '/pdf/vendor/qpdf.wasm',
    print: () => {},
    printErr: (s) => { stderr.push(String(s)); },
    noExitRuntime: true
  });
  qpdf.FS.writeFile('/in.pdf', inputBytes);
  let rc;
  try {
    rc = qpdf.callMain(['/in.pdf', '--password=' + password, '--decrypt', '--', '/out.pdf']);
  } catch (e) {
    // emscripten may throw ExitStatus on abnormal exit → recover status code
    rc = (e && typeof e.status === 'number') ? e.status : 1;
  }
  const err = stderr.join('\n');
  const badPw = rc === 2 || /invalid password/i.test(err);
  let out = null;
  if (!badPw) {
    try { out = qpdf.FS.readFile('/out.pdf'); } catch (_) { out = null; }
  }
  return { rc, err, badPw, out };
}

async function unlock() {
  if (!currentFile) return;
  const password = passwordInput.value;
  if (!password) {
    alert('Please enter the PDF password.');
    passwordInput.focus();
    return;
  }

  unlockBtn.disabled = true;
  const orig = unlockBtn.textContent;
  unlockBtn.textContent = 'Processing...';
  progressWrap.hidden = false;
  progressFill.style.width = '15%';
  progressWrap.setAttribute('aria-valuenow', '15');
  progressText.textContent = 'Loading engine…';

  try {
    const arrayBuffer = await currentFile.arrayBuffer();
    const inputBytes = new Uint8Array(arrayBuffer);

    progressFill.style.width = '45%';
    progressWrap.setAttribute('aria-valuenow', '45');
    progressText.textContent = 'Verifying password & stripping encryption…';

    const { badPw, out, err } = await runQpdfDecrypt(inputBytes, password);

    if (badPw) {
      progressWrap.hidden = true;
      progressFill.style.width = '0%';
      alert('Password does not match.');
      passwordInput.focus();
      passwordInput.select();
      return;
    }
    if (!out || out.length === 0) {
      throw new Error(err || 'Decryption produced no output.');
    }

    progressFill.style.width = '85%';
    progressWrap.setAttribute('aria-valuenow', '85');
    progressText.textContent = 'Saving…';

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([out], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);
    downloadBtn.href = resultUrl;

    const baseName = currentFile.name.replace(/\.pdf$/i, '');
    const outName = baseName + '-unlocked.pdf';
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename)
      ? window.TayStudio.sanitizeFilename(outName)
      : outName;

    // Page count display (count with already-loaded pdf-lib, ignore on failure)
    let pageLabel = '';
    try {
      if (window.PDFLib) {
        const doc = await window.PDFLib.PDFDocument.load(out);
        const n = doc.getPageCount();
        pageLabel = n + (n === 1 ? ' page' : ' pages');
      }
    } catch (_) { /* download still works without page count */ }
    resultPages.textContent = pageLabel || '—';
    resultSize.textContent = fmtBytes(blob.size);

    progressFill.style.width = '100%';
    progressWrap.setAttribute('aria-valuenow', '100');
    progressText.textContent = 'Done';

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    const msg = e && e.message ? e.message : 'Unknown error';
    alert('Failed to remove password: ' + msg + '\nThe file may be corrupted or use an unsupported encryption method.');
  } finally {
    unlockBtn.textContent = orig;
    setTimeout(() => { progressWrap.hidden = true; progressFill.style.width = '0%'; }, 800);
    updateButtonState();
  }
}

// File input
fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  if (window.TayStudio && window.TayStudio.rejectFolderDrop && window.TayStudio.rejectFolderDrop(e)) return;
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
});
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

// Password visibility toggle
togglePw.addEventListener('click', () => {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    togglePw.textContent = 'Hide';
    togglePw.setAttribute('aria-pressed', 'true');
  } else {
    passwordInput.type = 'password';
    togglePw.textContent = 'Show';
    togglePw.setAttribute('aria-pressed', 'false');
  }
});

// Enter key triggers unlock
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !unlockBtn.disabled) { e.preventDefault(); unlock(); }
});

removeBtn.addEventListener('click', removeFile);
unlockBtn.addEventListener('click', unlock);
clearBtn.addEventListener('click', clearAll);
