/**
 * Encrypt PDF / Password Protect PDF — pdf-lib-plus-encrypt (MIT).
 * Last verified: 2026-05-17
 *
 * Flow:
 *  1. Upload one PDF file (drag / click)
 *  2. Enter password twice with match validation
 *  3. (Optional) restrict printing / copying / editing / annotating
 *  4. PDFDocument.load → encrypt({ userPassword, ownerPassword, permissions }) → save()
 *  5. Blob → download as {originalName}-encrypted.pdf
 *
 * Global: window.PDFLib (pdf-lib-plus-encrypt UMD)
 */
(function () {
  const dropZone = document.getElementById('dropZone');
  const dropTitle = document.getElementById('dropTitle');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const passwordPanel = document.getElementById('passwordPanel');
  const pwShowWrap = document.getElementById('pwShowWrap');
  const permsBox = document.getElementById('permsBox');
  const actionBar = document.getElementById('actionBar');
  const pw1 = document.getElementById('pw1');
  const pw2 = document.getElementById('pw2');
  const pwShow = document.getElementById('pwShow');
  const pwMatch = document.getElementById('pwMatch');
  const permPrint = document.getElementById('permPrint');
  const permCopy = document.getElementById('permCopy');
  const permModify = document.getElementById('permModify');
  const permAnnotate = document.getElementById('permAnnotate');
  const encryptBtn = document.getElementById('encryptBtn');
  const clearBtn = document.getElementById('clearBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const result = document.getElementById('result');
  const resultName = document.getElementById('resultName');
  const resultSize = document.getElementById('resultSize');
  const downloadBtn = document.getElementById('downloadBtn');

  const state = { file: null, resultUrl: null };

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function renderFileList() {
    fileList.innerHTML = '';
    if (!state.file) return;
    const f = state.file;
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML =
      '<div class="order">📄</div>' +
      '<div class="name"></div>' +
      '<div class="size"></div>' +
      '<div class="row-actions"><button type="button" data-rm="1" title="Remove">✕</button></div>';
    div.querySelector('.name').textContent = f.name;
    div.querySelector('.size').textContent = fmtBytes(f.size);
    fileList.appendChild(div);
    div.querySelector('button[data-rm]').addEventListener('click', () => {
      state.file = null;
      fileInput.value = '';
      renderFileList();
      togglePanels();
    });
  }

  function togglePanels() {
    const has = !!state.file;
    passwordPanel.hidden = !has;
    pwShowWrap.hidden = !has;
    permsBox.hidden = !has;
    actionBar.hidden = !has;
    if (has) {
      dropTitle.textContent = 'One file only — remove with ✕ to replace';
      result.hidden = true;
    } else {
      dropTitle.textContent = 'Drag a PDF here, or click to select';
      result.hidden = true;
      pw1.value = '';
      pw2.value = '';
      pwMatch.textContent = '';
      pwMatch.className = 'pw-match';
    }
    refreshBtnState();
  }

  function refreshBtnState() {
    const v1 = pw1.value;
    const v2 = pw2.value;
    let ok = false;
    if (!v1 || !v2) {
      pwMatch.textContent = '';
      pwMatch.className = 'pw-match';
      pw2.classList.remove('mismatch');
    } else if (v1 !== v2) {
      pwMatch.textContent = 'Passwords do not match';
      pwMatch.className = 'pw-match bad';
      pw1.classList.remove('mismatch');
      pw2.classList.add('mismatch');
    } else if (v1.length < 4) {
      pwMatch.textContent = 'At least 4 characters';
      pwMatch.className = 'pw-match bad';
      pw1.classList.add('mismatch');
      pw2.classList.add('mismatch');
    } else {
      pwMatch.textContent = '✓ Match (' + v1.length + ' chars)';
      pwMatch.className = 'pw-match ok';
      pw2.classList.remove('mismatch');
      ok = true;
    }
    encryptBtn.disabled = !(state.file && ok);
  }

  function setFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      alert('Please select a PDF file.');
      return;
    }
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
    state.file = file;
    renderFileList();
    togglePanels();
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
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

  pw1.addEventListener('input', refreshBtnState);
  pw2.addEventListener('input', refreshBtnState);
  pwShow.addEventListener('change', () => {
    const t = pwShow.checked ? 'text' : 'password';
    pw1.type = t;
    pw2.type = t;
  });

  async function encryptPdf() {
    if (!state.file) return;
    if (!window.PDFLib || !window.PDFLib.PDFDocument) {
      alert('PDF library is still loading. Please try again in a moment.');
      return;
    }
    const password = pw1.value;
    if (!password || password !== pw2.value) {
      alert('Please confirm the password.');
      return;
    }

    encryptBtn.disabled = true;
    const orig = encryptBtn.textContent;
    encryptBtn.textContent = 'Working...';
    progressWrap.hidden = false;
    progressFill.style.width = '20%';
    progressWrap.setAttribute('aria-valuenow', '20');
    progressText.textContent = 'Reading file...';

    try {
      const { PDFDocument } = window.PDFLib;
      const bytes = await state.file.arrayBuffer();
      progressFill.style.width = '40%';
      progressWrap.setAttribute('aria-valuenow', '40');
      progressText.textContent = 'Parsing PDF...';

      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      if (pdfDoc.isEncrypted) {
        throw new Error('This PDF already has a password. Remove the existing password first.');
      }

      // pdf-lib-plus-encrypt permissions: boolean value = "allowed".
      // User-facing checkbox is "forbid", so we invert.
      const permissions = {
        printing: permPrint.checked ? false : 'highResolution',
        modifying: !permModify.checked,
        copying: !permCopy.checked,
        annotating: !permAnnotate.checked,
        fillingForms: !permModify.checked,
        contentAccessibility: true, // always allow screen readers
        documentAssembly: !permModify.checked,
      };

      progressFill.style.width = '60%';
      progressWrap.setAttribute('aria-valuenow', '60');
      progressText.textContent = 'Encrypting...';

      await pdfDoc.encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: permissions,
      });

      progressFill.style.width = '80%';
      progressWrap.setAttribute('aria-valuenow', '80');
      progressText.textContent = 'Saving file...';

      const out = await pdfDoc.save();
      const blob = new Blob([out], { type: 'application/pdf' });

      if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
      state.resultUrl = URL.createObjectURL(blob);

      const baseName = state.file.name.replace(/\.pdf$/i, '');
      const outName = baseName + '-encrypted.pdf';
      const safeName = (window.TayStudio && window.TayStudio.sanitizeFilename)
        ? window.TayStudio.sanitizeFilename(outName)
        : outName;

      downloadBtn.href = state.resultUrl;
      downloadBtn.download = safeName;
      resultName.textContent = safeName;
      resultSize.textContent = fmtBytes(blob.size);

      progressFill.style.width = '100%';
      progressWrap.setAttribute('aria-valuenow', '100');
      progressText.textContent = 'Done';
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      const raw = (e && e.message) ? e.message : 'Unknown error';
      let msg = raw;
      if (/encrypt/i.test(raw)) msg = 'This PDF is already password-protected. Remove the existing password first via /en/pdf/pdf-unlock/, then try again.';
      else if (/invalid|malformed|parse/i.test(raw)) msg = 'The PDF file is corrupted or in an invalid format.';
      alert('Encryption failed: ' + msg);
    } finally {
      encryptBtn.textContent = orig;
      setTimeout(() => { progressWrap.hidden = true; progressFill.style.width = '0%'; }, 800);
      refreshBtnState();
    }
  }

  function clearAll() {
    state.file = null;
    fileInput.value = '';
    pw1.value = '';
    pw2.value = '';
    pwShow.checked = false;
    pw1.type = 'password';
    pw2.type = 'password';
    permPrint.checked = false;
    permCopy.checked = false;
    permModify.checked = false;
    permAnnotate.checked = false;
    if (state.resultUrl) { URL.revokeObjectURL(state.resultUrl); state.resultUrl = null; }
    renderFileList();
    togglePanels();
  }

  encryptBtn.addEventListener('click', encryptPdf);
  clearBtn.addEventListener('click', clearAll);
})();
