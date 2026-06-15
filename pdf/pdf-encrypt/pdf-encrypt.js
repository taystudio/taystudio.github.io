/**
 * PDF 비밀번호 설정 · 암호화 — pdf-lib-plus-encrypt (MIT).
 * 최종 검증: 2026-05-17
 *
 * 동작:
 *  1. PDF 한 파일 업로드 (드래그·클릭)
 *  2. 비밀번호 2회 입력 + 일치 검증
 *  3. (선택) 인쇄·복사·편집·주석 권한 제한
 *  4. PDFDocument.load → encrypt({ userPassword, ownerPassword, permissions }) → save()
 *  5. Blob → 다운로드 ({originalName}-encrypted.pdf)
 *
 * 글로벌: window.PDFLib (pdf-lib-plus-encrypt UMD)
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

  const esc = (window.TayStudio && window.TayStudio.escapeHtml)
    ? window.TayStudio.escapeHtml
    : (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

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
      '<div class="row-actions"><button type="button" data-rm="1" title="삭제">✕</button></div>';
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
      dropTitle.textContent = '한 파일만 가능 — 교체하려면 ✕ 후 다시 선택';
      result.hidden = true;
    } else {
      dropTitle.textContent = 'PDF 파일을 드래그하거나 클릭해서 선택';
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
      pwMatch.textContent = '비밀번호 불일치';
      pwMatch.className = 'pw-match bad';
      pw1.classList.remove('mismatch');
      pw2.classList.add('mismatch');
    } else if (v1.length < 4) {
      pwMatch.textContent = '4자 이상 입력하세요';
      pwMatch.className = 'pw-match bad';
      pw1.classList.add('mismatch');
      pw2.classList.add('mismatch');
    } else {
      pwMatch.textContent = '✓ 일치 (' + v1.length + '자)';
      pwMatch.className = 'pw-match ok';
      pw2.classList.remove('mismatch');
      ok = true;
    }
    encryptBtn.disabled = !(state.file && ok);
  }

  function setFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      alert('PDF 파일만 선택할 수 있습니다.');
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
  // Enter 키로 암호화 트리거 (활성화 상태일 때만)
  [pw1, pw2].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !encryptBtn.disabled) { e.preventDefault(); encryptPdf(); }
    });
  });
  pwShow.addEventListener('change', () => {
    const t = pwShow.checked ? 'text' : 'password';
    pw1.type = t;
    pw2.type = t;
  });

  async function encryptPdf() {
    if (!state.file) return;
    if (!window.PDFLib || !window.PDFLib.PDFDocument) {
      alert('PDF 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.');
      return;
    }
    const password = pw1.value;
    if (!password || password !== pw2.value) {
      alert('비밀번호를 확인하세요.');
      return;
    }

    encryptBtn.disabled = true;
    const orig = encryptBtn.textContent;
    encryptBtn.textContent = '처리 중...';
    progressWrap.hidden = false;
    progressFill.style.width = '20%';
    progressWrap.setAttribute('aria-valuenow', '20');
    progressText.textContent = '파일 읽는 중...';

    try {
      const { PDFDocument } = window.PDFLib;
      const bytes = await state.file.arrayBuffer();
      progressFill.style.width = '40%';
      progressWrap.setAttribute('aria-valuenow', '40');
      progressText.textContent = 'PDF 분석 중...';

      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      if (pdfDoc.isEncrypted) {
        throw new Error('이미 비밀번호가 걸린 PDF입니다. 기존 비밀번호를 먼저 해제하세요.');
      }

      // 권한: pdf-lib-plus-encrypt는 "체크된 권한 = 허용"이 아니라
      // permissions 객체에 명시된 boolean을 그대로 적용 (true=허용, false=금지).
      // 따라서 사용자 "금지" 체크 ↔ 라이브러리 권한 false.
      const permissions = {
        printing: permPrint.checked ? false : 'highResolution',
        modifying: !permModify.checked,
        copying: !permCopy.checked,
        annotating: !permAnnotate.checked,
        fillingForms: !permModify.checked,
        contentAccessibility: true, // 접근성은 항상 허용 (스크린 리더)
        documentAssembly: !permModify.checked,
      };

      progressFill.style.width = '60%';
      progressWrap.setAttribute('aria-valuenow', '60');
      progressText.textContent = '암호화 중...';

      await pdfDoc.encrypt({
        userPassword: password,
        ownerPassword: password, // 동일 비밀번호 (단순화)
        permissions: permissions,
      });

      progressFill.style.width = '80%';
      progressWrap.setAttribute('aria-valuenow', '80');
      progressText.textContent = '파일 저장 중...';

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
      progressText.textContent = '완료';
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      const raw = (e && e.message) ? e.message : '알 수 없는 오류';
      let msg = raw;
      if (/encrypt/i.test(raw)) msg = '이미 비밀번호가 걸린 PDF입니다. 먼저 잠금을 해제(/pdf/pdf-unlock/)한 뒤 다시 시도하세요.';
      else if (/invalid|malformed|parse/i.test(raw)) msg = 'PDF 파일이 손상됐거나 형식이 잘못됐습니다.';
      alert('암호화 실패: ' + msg);
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
