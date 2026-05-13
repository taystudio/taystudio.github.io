/**
 * PDF 자르기 — pdf-lib (Hopding, MIT).
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. PDF 1개 업로드 → PDFDocument.load → 총 페이지 수 표시
 *  2. 사용자 범위 입력(예: "1-3,5,7-10")을 1-based 인덱스 배열로 파싱
 *  3. PDFDocument.create() + copyPages → save → Blob → 다운로드
 *
 * 글로벌: window.PDFLib
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const pdfMeta = document.getElementById('pdfMeta');
const origPages = document.getElementById('origPages');
const origSize = document.getElementById('origSize');
const rangeField = document.getElementById('rangeField');
const rangeIn = document.getElementById('rangeIn');
const splitBtn = document.getElementById('splitBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const newPages = document.getElementById('newPages');
const newSize = document.getElementById('newSize');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let currentDoc = null;       // 로드된 PDFDocument (페이지 수 미리 표시용)
let currentBytes = null;     // ArrayBuffer 보존 (재 load 용)
let currentTotal = 0;
let resultUrl = null;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function parseRange(text, total) {
  // "1-3,5,7-10" → [0,1,2,4,6,7,8,9] (0-based)
  const out = [];
  const parts = String(text).replace(/\s+/g, '').split(',').filter(Boolean);
  if (parts.length === 0) throw new Error('범위가 비어있습니다.');
  for (const part of parts) {
    if (part.includes('-')) {
      const [aStr, bStr] = part.split('-');
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < 1 || b < 1 || a > total || b > total) {
        throw new Error(`'${part}'는 유효하지 않은 범위입니다(1~${total} 허용).`);
      }
      if (a > b) {
        throw new Error(`'${part}'는 역방향 범위입니다. 작은 페이지부터 입력하세요 (예: ${b}-${a}).`);
      }
      for (let i = a; i <= b; i++) {
        out.push(i - 1);
      }
    } else {
      const n = parseInt(part, 10);
      if (!Number.isFinite(n) || n < 1 || n > total) {
        throw new Error(`'${part}'는 유효하지 않은 페이지 번호입니다(1~${total} 허용).`);
      }
      out.push(n - 1);
    }
  }
  return out;
}

async function loadFile(file) {
  if (!file || (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name))) {
    alert('PDF 파일만 선택해주세요.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
  if (!window.PDFLib) {
    alert('PDF 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.');
    return;
  }
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  result.hidden = true;
  splitBtn.disabled = true;
  try {
    const { PDFDocument } = window.PDFLib;
    currentBytes = await file.arrayBuffer();
    currentDoc = await PDFDocument.load(currentBytes, { ignoreEncryption: true });
    currentFile = file;
    currentTotal = currentDoc.getPageCount();
    origPages.textContent = currentTotal + '쪽';
    origSize.textContent = fmtBytes(file.size);
    pdfMeta.hidden = false;
    rangeField.hidden = false;
    rangeIn.placeholder = `예: 1-${Math.min(3, currentTotal)},${Math.min(5, currentTotal)}`;
    rangeIn.value = '1-' + currentTotal;
    splitBtn.disabled = false;
  } catch (e) {
    alert('PDF 로드 실패: ' + (e && e.message ? e.message : '암호 걸린 PDF는 잠금 해제 후 다시 시도하세요.'));
    clearAll();
  }
}

async function split() {
  if (!currentFile || !currentDoc) return;
  let indices;
  try {
    indices = parseRange(rangeIn.value, currentTotal);
  } catch (e) {
    alert(e.message);
    return;
  }
  if (indices.length === 0) {
    alert('추출할 페이지가 없습니다.');
    return;
  }
  splitBtn.disabled = true;
  const orig = splitBtn.textContent;
  splitBtn.textContent = '처리 중...';
  try {
    const { PDFDocument } = window.PDFLib;
    // copyPages는 source가 변형되지 않지만 새 인스턴스로 load해 안전하게
    const src = await PDFDocument.load(currentBytes, { ignoreEncryption: true });
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);

    const baseName = (currentFile.name || 'document').replace(/\.pdf$/i, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '-pages.pdf') : baseName + '-pages.pdf');

    newPages.textContent = indices.length + '쪽';
    newSize.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('추출 실패: ' + (e && e.message ? e.message : '알 수 없는 오류'));
  } finally {
    splitBtn.textContent = orig;
    splitBtn.disabled = false;
  }
}

function clearAll() {
  currentFile = null;
  currentDoc = null;
  currentBytes = null;
  currentTotal = 0;
  fileInput.value = '';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  dropTitle.textContent = 'PDF 파일을 드래그하거나 클릭해서 선택';
  pdfMeta.hidden = true;
  rangeField.hidden = true;
  rangeIn.value = '';
  splitBtn.disabled = true;
  result.hidden = true;
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
  if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return;
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadFile(f);
});
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

splitBtn.addEventListener('click', split);
clearBtn.addEventListener('click', clearAll);
rangeIn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); split(); }
});
