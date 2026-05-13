/**
 * PDF 편집 — pdf-lib (Hopding, MIT) + pdf.js (Mozilla, Apache-2.0).
 * 최종 검증: 2026-05-06
 *
 * 동작:
 *  1. PDF 1개 업로드 → pdf.js로 페이지별 썸네일 canvas 렌더 → JPEG dataURL 캐시
 *  2. 사용자 조작 (state in pages[]):
 *     - 회전 (rotation 0/90/180/270, ↻ 시계방향 +90 누적)
 *     - 삭제 토글 (deleted 플래그, ↺로 복원)
 *     - 순서 변경 (배열 splice — ↑↓ 버튼 + HTML5 drag&drop)
 *  3. 저장: pdf-lib로 원본 reload → copyPages(indices in 사용자 순서) →
 *     setRotation(degrees(rotation)) → save → Blob 다운로드
 *
 * 모듈: pdf.js는 ESM (import). pdf-lib는 vendor UMD (window.PDFLib 글로벌).
 */

import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const pdfMeta = document.getElementById('pdfMeta');
const metaName = document.getElementById('metaName');
const metaPages = document.getElementById('metaPages');
const metaActive = document.getElementById('metaActive');
const loading = document.getElementById('loading');
const thumbsGrid = document.getElementById('thumbsGrid');
const actionBar = document.getElementById('actionBar');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const newPages = document.getElementById('newPages');
const newSize = document.getElementById('newSize');
const downloadBtn = document.getElementById('downloadBtn');

let originalFile = null;
let originalBytes = null; // ArrayBuffer (저장 시 재사용)
let pages = []; // { origIndex, rotation, deleted, thumb }
let resultUrl = null;
let dragSrcIdx = null;

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateMeta() {
  if (!originalFile) {
    pdfMeta.hidden = true;
    return;
  }
  pdfMeta.hidden = false;
  metaName.textContent = originalFile.name;
  metaPages.textContent = pages.length + '쪽';
  const active = pages.filter(p => !p.deleted).length;
  metaActive.textContent = active + '쪽';
  saveBtn.disabled = (active === 0);
}

function render() {
  thumbsGrid.innerHTML = '';
  pages.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'thumb-card' + (p.deleted ? ' deleted' : '');
    card.dataset.idx = idx;
    card.draggable = !p.deleted;

    const wrap = document.createElement('div');
    wrap.className = 'thumb-img-wrap';
    const img = document.createElement('img');
    img.src = p.thumb;
    img.alt = '페이지 ' + (p.origIndex + 1) + ' 썸네일';
    img.style.transform = 'rotate(' + p.rotation + 'deg)';
    wrap.appendChild(img);
    card.appendChild(wrap);

    const pgnum = document.createElement('div');
    pgnum.className = 'thumb-pgnum';
    pgnum.textContent = (idx + 1) + '쪽 (원본 ' + (p.origIndex + 1) + ')'
      + (p.rotation ? ' · ' + p.rotation + '°' : '');
    card.appendChild(pgnum);

    const actions = document.createElement('div');
    actions.className = 'thumb-actions';
    const upBtn = btn('↑', 'up', '위로', idx === 0 || p.deleted);
    const downBtn = btn('↓', 'down', '아래로', idx === pages.length - 1 || p.deleted);
    const rotBtn = btn('↻', 'rot', '회전', p.deleted);
    const delBtn = p.deleted
      ? btn('↺', 'restore', '복원', false)
      : btn('✕', 'del', '삭제', false);
    actions.append(upBtn, downBtn, rotBtn, delBtn);
    card.appendChild(actions);

    actions.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      const act = target.dataset.act;
      const i = idx;
      if (act === 'up' && i > 0) {
        [pages[i - 1], pages[i]] = [pages[i], pages[i - 1]];
      } else if (act === 'down' && i < pages.length - 1) {
        [pages[i + 1], pages[i]] = [pages[i], pages[i + 1]];
      } else if (act === 'rot') {
        pages[i].rotation = (pages[i].rotation + 90) % 360;
      } else if (act === 'del') {
        pages[i].deleted = true;
      } else if (act === 'restore') {
        pages[i].deleted = false;
      }
      render();
      updateMeta();
    });

    card.addEventListener('dragstart', (e) => {
      if (p.deleted) { e.preventDefault(); return; }
      dragSrcIdx = idx;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(idx)); } catch (_) {}
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.thumb-card.drag-over').forEach(el => el.classList.remove('drag-over'));
      dragSrcIdx = null;
    });
    card.addEventListener('dragover', (e) => {
      if (dragSrcIdx === null || dragSrcIdx === idx) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (dragSrcIdx === null || dragSrcIdx === idx) return;
      const moved = pages.splice(dragSrcIdx, 1)[0];
      pages.splice(idx, 0, moved);
      dragSrcIdx = null;
      render();
      updateMeta();
    });

    thumbsGrid.appendChild(card);
  });
}

function btn(label, act, title, disabled) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.dataset.act = act;
  b.title = title;
  if (disabled) b.disabled = true;
  return b;
}

async function loadPdf(file) {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    alert('PDF 파일만 업로드 가능합니다.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
  originalFile = file;
  originalBytes = await file.arrayBuffer();
  loading.hidden = false;
  thumbsGrid.hidden = true;
  actionBar.hidden = true;
  result.hidden = true;
  pages = [];

  try {
    const pdf = await pdfjsLib.getDocument({ data: originalBytes.slice(0) }).promise;
    // 페이지 수 사전 경고: 100쪽 초과 시 confirm, 200쪽 초과 시 경고 강화 (OOM 방어)
    const np = pdf.numPages;
    if (np > 200) {
      const msg = `이 PDF는 ${np}쪽입니다. 썸네일 렌더 시 메모리 부족·브라우저 멈춤 위험이 큽니다.\n` +
        `예상 처리 시간: ${Math.ceil(np * 0.5)}초 이상.\n\n` +
        `대안: 먼저 분할 도구로 100쪽 이하로 자른 뒤 편집하세요.\n계속하시겠습니까?`;
      if (!confirm(msg)) { clearAll(); loading.hidden = true; return; }
    } else if (np > 100) {
      const msg = `이 PDF는 ${np}쪽입니다. 썸네일 렌더에 ${Math.ceil(np * 0.5)}초 이상 소요될 수 있습니다.\n계속하시겠습니까?`;
      if (!confirm(msg)) { clearAll(); loading.hidden = true; return; }
    }
    for (let i = 0; i < np; i++) {
      const page = await pdf.getPage(i + 1);
      const baseViewport = page.getViewport({ scale: 1 });
      const targetW = 150;
      const scale = targetW / baseViewport.width;
      const viewport = page.getViewport({ scale: Math.max(0.2, Math.min(0.6, scale)) });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      pages.push({
        origIndex: i,
        rotation: 0,
        deleted: false,
        thumb: canvas.toDataURL('image/jpeg', 0.7),
      });
    }
  } catch (e) {
    alert('PDF 로딩 실패: ' + (e && e.message ? e.message : '알 수 없는 오류') + '\n암호 걸린 PDF는 잠금을 먼저 해제하세요.');
    clearAll();
    return;
  } finally {
    loading.hidden = true;
  }

  thumbsGrid.hidden = false;
  actionBar.hidden = false;
  dropTitle.textContent = '다른 PDF로 교체하려면 다시 선택';
  render();
  updateMeta();
}

async function save() {
  const active = pages.filter(p => !p.deleted);
  if (active.length === 0) {
    alert('남은 페이지가 없습니다. 최소 1쪽은 유지해야 합니다.');
    return;
  }
  if (!window.PDFLib) {
    alert('PDF 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.');
    return;
  }
  saveBtn.disabled = true;
  const orig = saveBtn.textContent;
  saveBtn.textContent = '저장 중...';
  try {
    const { PDFDocument, degrees } = window.PDFLib;
    const src = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
    const out = await PDFDocument.create();
    const indices = active.map(p => p.origIndex);
    const copied = await out.copyPages(src, indices);
    active.forEach((p, i) => {
      const cur = src.getPage(p.origIndex).getRotation().angle || 0;
      copied[i].setRotation(degrees((cur + p.rotation) % 360));
      out.addPage(copied[i]);
    });
    const bytes = await out.save();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);
    downloadBtn.href = resultUrl;
    const stem = (originalFile.name || 'edited').replace(/\.pdf$/i, '');
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(stem + '-edited.pdf') : stem + '-edited.pdf');

    newPages.textContent = active.length + '쪽';
    newSize.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('저장 실패: ' + (e && e.message ? e.message : '알 수 없는 오류'));
  } finally {
    saveBtn.textContent = orig;
    updateMeta();
  }
}

function resetEdits() {
  pages.forEach(p => { p.rotation = 0; p.deleted = false; });
  pages.sort((a, b) => a.origIndex - b.origIndex);
  render();
  updateMeta();
  result.hidden = true;
}

function clearAll() {
  originalFile = null;
  originalBytes = null;
  pages = [];
  fileInput.value = '';
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  thumbsGrid.innerHTML = '';
  thumbsGrid.hidden = true;
  actionBar.hidden = true;
  pdfMeta.hidden = true;
  result.hidden = true;
  dropTitle.textContent = 'PDF 파일 1개를 드래그하거나 클릭해서 선택';
}

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) loadPdf(e.target.files[0]);
  fileInput.value = '';
});
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) loadPdf(e.dataTransfer.files[0]);
});
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

saveBtn.addEventListener('click', save);
resetBtn.addEventListener('click', resetEdits);
clearBtn.addEventListener('click', clearAll);
