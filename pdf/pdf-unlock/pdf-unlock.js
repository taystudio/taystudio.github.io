/**
 * PDF 비밀번호 해제 — PDF.js (Mozilla, Apache 2.0) + pdf-lib (Hopding, MIT).
 * 최종 검증: 2026-05-17
 *
 * 동작:
 *  1. 암호화된 PDF 1개 등록
 *  2. 사용자가 알고 있는 비밀번호 입력
 *  3. PDF.js getDocument({ password }) 로 비밀번호 검증
 *     - PasswordException(코드 1: 필요, 코드 2: 불일치) → alert
 *  4. 검증 통과 시 pdf-lib PDFDocument.load({ ignoreEncryption: true })
 *     + PDFDocument.create() 에 페이지 복사 → save()
 *     - 두 방식 모두 결과는 암호 없는 PDF. copyPages 방식이 더 깨끗.
 *  5. Blob → 다운로드 링크. 파일명: {original}-unlocked.pdf
 *
 * 글로벌: window.PDFLib (pdf-lib UMD)
 * 모듈 import: pdfjsLib (ESM)
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
    // PDF 업로드 직후 비번 input 자동 focus
    setTimeout(() => passwordInput.focus(), 50);
  }
}

function setFile(f) {
  if (!f) return;
  if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) {
    alert('PDF 파일만 업로드할 수 있습니다.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, 'PDF')) return;
  currentFile = f;
  fileName.textContent = f.name;
  fileSize.textContent = fmtBytes(f.size);
  selectedFile.hidden = false;
  dropTitle.textContent = '다른 PDF로 교체하려면 드래그하거나 클릭';
  result.hidden = true;
  updateButtonState();
}

function removeFile() {
  currentFile = null;
  fileInput.value = '';
  selectedFile.hidden = true;
  dropTitle.textContent = '암호화된 PDF 파일을 드래그하거나 클릭해서 선택';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  result.hidden = true;
  updateButtonState();
}

function clearAll() {
  removeFile();
  passwordInput.value = '';
  passwordInput.type = 'password';
  togglePw.textContent = '표시';
  togglePw.setAttribute('aria-pressed', 'false');
}

async function unlock() {
  if (!currentFile) return;
  const password = passwordInput.value;
  if (!password) {
    alert('비밀번호를 입력하세요.');
    passwordInput.focus();
    return;
  }
  if (!window.PDFLib) {
    alert('PDF 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.');
    return;
  }

  unlockBtn.disabled = true;
  const orig = unlockBtn.textContent;
  unlockBtn.textContent = '처리 중...';
  progressWrap.hidden = false;
  progressFill.style.width = '10%';
  progressWrap.setAttribute('aria-valuenow', '10');
  progressText.textContent = '비밀번호 검증 중…';

  try {
    const arrayBuffer = await currentFile.arrayBuffer();

    // 1) PDF.js로 비밀번호 검증 (PasswordException으로 불일치 감지)
    let pdfJsDoc;
    try {
      pdfJsDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        password: password
      }).promise;
    } catch (err) {
      // PasswordException 코드: 1=PASSWORD_REQUIRED, 2=PASSWORD_INCORRECT
      const name = err && err.name;
      const code = err && err.code;
      if (name === 'PasswordException' || code === 1 || code === 2) {
        progressWrap.hidden = true;
        progressFill.style.width = '0%';
        alert('비밀번호가 일치하지 않습니다.');
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
    progressText.textContent = '암호 제거 중…';

    // 2) pdf-lib로 암호 없는 새 PDF 생성
    //    PDF.js가 비밀번호 검증을 통과했으므로 ignoreEncryption 으로 안전하게 로드 가능.
    //    copyPages로 새 문서 구성 → 암호화 사전·메타데이터 자동 제거.
    const { PDFDocument } = window.PDFLib;
    const src = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      password: password // 최신 pdf-lib는 무시. 폴백용.
    });
    const out = await PDFDocument.create();
    const indices = src.getPageIndices();
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));

    // 원본 메타데이터 일부 보존 (제목 등) — 단 권한·암호 비트는 자연히 사라짐
    try {
      const title = src.getTitle();
      const author = src.getAuthor();
      const subject = src.getSubject();
      if (title) out.setTitle(title);
      if (author) out.setAuthor(author);
      if (subject) out.setSubject(subject);
    } catch (_) { /* 메타데이터 없을 수 있음 */ }

    progressFill.style.width = '85%';
    progressWrap.setAttribute('aria-valuenow', '85');
    progressText.textContent = '저장 중…';

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

    resultPages.textContent = pageCount + '쪽';
    resultSize.textContent = fmtBytes(blob.size);

    progressFill.style.width = '100%';
    progressWrap.setAttribute('aria-valuenow', '100');
    progressText.textContent = '완료';

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    const msg = e && e.message ? e.message : '알 수 없는 오류';
    alert('암호 제거 실패: ' + msg + '\n파일이 손상되었거나 지원하지 않는 암호화 방식일 수 있습니다.');
  } finally {
    unlockBtn.textContent = orig;
    setTimeout(() => { progressWrap.hidden = true; progressFill.style.width = '0%'; }, 800);
    updateButtonState();
  }
}

// 파일 입력
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

// 비밀번호 표시 토글
togglePw.addEventListener('click', () => {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    togglePw.textContent = '숨김';
    togglePw.setAttribute('aria-pressed', 'true');
  } else {
    passwordInput.type = 'password';
    togglePw.textContent = '표시';
    togglePw.setAttribute('aria-pressed', 'false');
  }
});

// Enter 키로 해제 트리거
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !unlockBtn.disabled) { e.preventDefault(); unlock(); }
});

removeBtn.addEventListener('click', removeFile);
unlockBtn.addEventListener('click', unlock);
clearBtn.addEventListener('click', clearAll);
