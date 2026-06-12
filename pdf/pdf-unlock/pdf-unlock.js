/**
 * PDF 비밀번호 해제 — qpdf (WebAssembly, Apache 2.0) + pdf-lib (페이지 수 표시용).
 * 최종 검증: 2026-06-12
 *
 * 동작:
 *  1. 암호화된 PDF 1개 등록
 *  2. 사용자가 알고 있는 비밀번호 입력
 *  3. qpdf-wasm: callMain(['/in.pdf', '--password=…', '--decrypt', '--', '/out.pdf'])
 *     - return code 2 또는 stderr "invalid password" → 비밀번호 불일치 alert
 *     - return code 0 → 무손실 복호화 완료 (텍스트·이미지·링크 전부 보존)
 *  4. 복호화된 bytes → Blob → 다운로드. 파일명: {original}-unlocked.pdf
 *
 * 왜 qpdf인가:
 *   pdf-lib·PDF.js 는 암호화 PDF 의 콘텐츠를 복호화하지 못한다(렌더링만 가능).
 *   qpdf 는 실제 복호화 엔진이라 원본 구조를 그대로 보존한 채 암호만 제거한다.
 *
 * 모듈 import: createQpdf (ESM) · 글로벌: window.PDFLib (페이지 수 카운트용, 선택)
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

// qpdf 모듈 인스턴스는 callMain 1회 실행 후 재사용이 보장되지 않으므로 변환마다 새로 만든다.
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
    // emscripten 은 비정상 종료 시 ExitStatus 를 throw 할 수 있다 → status 코드 회수
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
    alert('비밀번호를 입력하세요.');
    passwordInput.focus();
    return;
  }

  unlockBtn.disabled = true;
  const orig = unlockBtn.textContent;
  unlockBtn.textContent = '처리 중...';
  progressWrap.hidden = false;
  progressFill.style.width = '15%';
  progressWrap.setAttribute('aria-valuenow', '15');
  progressText.textContent = '엔진 로드 중…';

  try {
    const arrayBuffer = await currentFile.arrayBuffer();
    const inputBytes = new Uint8Array(arrayBuffer);

    progressFill.style.width = '45%';
    progressWrap.setAttribute('aria-valuenow', '45');
    progressText.textContent = '비밀번호 검증 및 암호 제거 중…';

    const { badPw, out, err } = await runQpdfDecrypt(inputBytes, password);

    if (badPw) {
      progressWrap.hidden = true;
      progressFill.style.width = '0%';
      alert('비밀번호가 일치하지 않습니다.');
      passwordInput.focus();
      passwordInput.select();
      return;
    }
    if (!out || out.length === 0) {
      throw new Error(err || '복호화 결과가 비어 있습니다.');
    }

    progressFill.style.width = '85%';
    progressWrap.setAttribute('aria-valuenow', '85');
    progressText.textContent = '저장 중…';

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([out], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);
    downloadBtn.href = resultUrl;

    const baseName = currentFile.name.replace(/\.pdf$/i, '');
    const outName = baseName + '-unlocked.pdf';
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename)
      ? window.TayStudio.sanitizeFilename(outName)
      : outName;

    // 페이지 수 표시 (이미 로드된 pdf-lib 로 카운트, 실패해도 무시)
    let pageLabel = '';
    try {
      if (window.PDFLib) {
        const doc = await window.PDFLib.PDFDocument.load(out);
        pageLabel = doc.getPageCount() + '쪽';
      }
    } catch (_) { /* 페이지 수 못 세도 다운로드는 정상 */ }
    resultPages.textContent = pageLabel || '—';
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
