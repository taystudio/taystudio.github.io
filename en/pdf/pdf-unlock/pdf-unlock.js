/**
 * Remove PDF Password — PDF.js (Mozilla, Apache 2.0) + pdf-lib (Hopding, MIT).
 * Last reviewed: 2026-05-17
 *
 * Flow:
 *  1. Register a single encrypted PDF
 *  2. User types the password they already know
 *  3. PDF.js getDocument({ password }) verifies the password
 *     - PasswordException (code 1: required, code 2: incorrect) → alert
 *  4. On success, pdf-lib PDFDocument.load({ ignoreEncryption: true })
 *     + PDFDocument.create() copyPages → save() produces a clean PDF
 *  5. Blob → download link. Filename: {original}-unlocked.pdf
 *
 * Globals: window.PDFLib (pdf-lib UMD)
 * Module import: pdfjsLib (ESM)
 */

import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';

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

async function unlock() {
  if (!currentFile) return;
  const password = passwordInput.value;
  if (!password) {
    alert('Please enter the PDF password.');
    passwordInput.focus();
    return;
  }
  if (!window.PDFLib) {
    alert('PDF library is still loading. Please try again in a moment.');
    return;
  }

  unlockBtn.disabled = true;
  const orig = unlockBtn.textContent;
  unlockBtn.textContent = 'Processing...';
  progressWrap.hidden = false;
  progressFill.style.width = '10%';
  progressWrap.setAttribute('aria-valuenow', '10');
  progressText.textContent = 'Verifying password…';

  try {
    const arrayBuffer = await currentFile.arrayBuffer();

    // 1) Verify password with PDF.js (PasswordException signals mismatch)
    let pdfJsDoc;
    try {
      pdfJsDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        password: password
      }).promise;
    } catch (err) {
      // PasswordException codes: 1=PASSWORD_REQUIRED, 2=PASSWORD_INCORRECT
      const name = err && err.name;
      const code = err && err.code;
      if (name === 'PasswordException' || code === 1 || code === 2) {
        progressWrap.hidden = true;
        progressFill.style.width = '0%';
        alert('Password does not match.');
        passwordInput.focus();
        passwordInput.select();
        return;
      }
      throw err;
    }

    const pageCount = pdfJsDoc.numPages;
    pdfJsDoc.destroy();

    progressFill.style.width = '50%';
    progressWrap.setAttribute('aria-valuenow', '50');
    progressText.textContent = 'Stripping encryption…';

    // 2) Build a clean PDF with pdf-lib.
    //    PDF.js already verified the password, so ignoreEncryption is safe.
    //    copyPages into a fresh document drops the encryption dictionary.
    const { PDFDocument } = window.PDFLib;
    const src = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      password: password // newer pdf-lib forks may consume this; harmless otherwise
    });
    const out = await PDFDocument.create();
    const indices = src.getPageIndices();
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));

    // Preserve harmless metadata; permission bits are dropped by construction
    try {
      const title = src.getTitle();
      const author = src.getAuthor();
      const subject = src.getSubject();
      if (title) out.setTitle(title);
      if (author) out.setAuthor(author);
      if (subject) out.setSubject(subject);
    } catch (_) { /* metadata may be absent */ }

    progressFill.style.width = '85%';
    progressWrap.setAttribute('aria-valuenow', '85');
    progressText.textContent = 'Saving…';

    const bytes = await out.save();

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);
    downloadBtn.href = resultUrl;

    const baseName = currentFile.name.replace(/\.pdf$/i, '');
    const outName = baseName + '-unlocked.pdf';
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename)
      ? window.TayStudio.sanitizeFilename(outName)
      : outName;

    resultPages.textContent = pageCount + (pageCount === 1 ? ' page' : ' pages');
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

// Enter triggers unlock
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !unlockBtn.disabled) { e.preventDefault(); unlock(); }
});

removeBtn.addEventListener('click', removeFile);
unlockBtn.addEventListener('click', unlock);
clearBtn.addEventListener('click', clearAll);
