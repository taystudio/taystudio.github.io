/**
 * PDF 합치기 — pdf-lib (Hopding, MIT).
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. 여러 PDF 파일 누적 등록 (드래그·클릭, 누적)
 *  2. 목록 ↑·↓·✕로 순서·삭제 조정
 *  3. PDFDocument.create() + 각 파일 copyPages → 새 문서에 addPage
 *  4. save() → Blob → 다운로드 링크
 *
 * 글로벌: window.PDFLib (pdf-lib UMD)
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
        '<button type="button" data-act="up" title="위로">↑</button>' +
        '<button type="button" data-act="down" title="아래로">↓</button>' +
        '<button type="button" data-act="del" title="삭제">✕</button>' +
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
    dropTitle.textContent = files.length + '개 PDF — 더 끌어오면 추가됩니다';
  } else {
    dropTitle.textContent = 'PDF 파일 여러 개를 드래그하거나 클릭해서 선택';
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
    alert('PDF 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.');
    return;
  }
  // 100MB 총 size 체크 (브라우저 메모리 한계 안전 마진)
  const totalSize = files.reduce((sum, entry) => sum + entry.file.size, 0);
  const MAX_TOTAL = 100 * 1024 * 1024;
  if (totalSize > MAX_TOTAL) {
    const mb = Math.round(totalSize / 1024 / 1024);
    if (!confirm(`총 ${mb}MB — 권장 한도 100MB 초과. 메모리 부족·실패 가능. 계속하시겠습니까?`)) return;
  }
  mergeBtn.disabled = true;
  const orig = mergeBtn.textContent;
  mergeBtn.textContent = '처리 중...';
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
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename('merged-' + new Date().toISOString().slice(0, 10) + '.pdf') : 'merged-' + new Date().toISOString().slice(0, 10) + '.pdf');

    mergedCount.textContent = files.length + '개';
    mergedPages.textContent = pageTotal + '쪽';
    mergedSize.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('합치기 실패: ' + (e && e.message ? e.message : '알 수 없는 오류') + '\n암호 걸린 PDF가 포함된 경우 잠금을 먼저 해제하세요.');
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
  fileInput.value = ''; // 같은 파일 다시 선택 가능하도록
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

mergeBtn.addEventListener('click', merge);
clearBtn.addEventListener('click', clearAll);
