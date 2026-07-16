/**
 * PDF 합치기 — pdf-lib (Hopding, MIT) + pdf.js (Mozilla, Apache-2.0).
 * 최종 검증: 2026-07-16
 *
 * 두 가지 모드(탭):
 *  1. 전체 합치기        — 각 파일 전체 페이지를 올린 순서대로 병합
 *  2. 페이지 선택 합치기  — 파일마다 「미리보기」로 페이지 썸네일을 펼쳐 클릭으로 고른 뒤,
 *                          선택한 페이지만 순서대로 병합. 미리보기를 안 열면 그 파일은 전체.
 *
 * 썸네일 렌더 = pdf.js(ESM). 병합 = pdf-lib(window.PDFLib UMD). 파일은 브라우저 밖으로 안 나감.
 * 썸네일은 「미리보기」를 열 때만(파일별 지연) 렌더 → 대용량·다파일에서도 부하 최소.
 */

import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';

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
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const modeTabs = document.querySelectorAll('.merge-tabs .mtab');
const modeHint = document.getElementById('modeHint');

// entry: { id, file, rendered, rendering, expanded, pages:[{thumb,selected}]|null, pageCount:number|null }
let files = [];
let nextId = 1;
let resultUrl = null;
let mode = 'all'; // 'all' | 'pages'

const HINTS = {
  all: '파일 전체를 올린 순서대로 하나로 합칩니다.',
  pages: '파일마다 「미리보기」를 열어 넣을 페이지만 클릭하세요. 안 열면 그 파일은 전체 페이지가 들어갑니다.'
};

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function selectedCount(entry) {
  return entry.rendered ? entry.pages.filter(p => p.selected).length : null;
}

/** 「미리보기」 클릭 시 그 파일 페이지 썸네일을 pdf.js로 렌더 (파일별 1회, 캐시) */
async function renderThumbs(entry) {
  if (entry.rendered || entry.rendering) return;
  entry.rendering = true;
  render();
  try {
    const bytes = await entry.file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const np = pdf.numPages;
    if (np > 150) {
      const ok = confirm(`이 PDF는 ${np}쪽입니다. 미리보기 썸네일 생성에 시간이 걸리고 메모리를 많이 씁니다.\n계속하시겠습니까?`);
      if (!ok) { entry.rendering = false; entry.expanded = false; render(); return; }
    }
    entry.pageCount = np;
    entry.pages = [];
    for (let i = 0; i < np; i++) {
      const page = await pdf.getPage(i + 1);
      const bvp = page.getViewport({ scale: 1 });
      const scale = Math.max(0.15, Math.min(0.5, 108 / bvp.width));
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      entry.pages.push({ thumb: canvas.toDataURL('image/jpeg', 0.7), selected: true });
    }
    entry.rendered = true;
  } catch (e) {
    alert('미리보기 생성 실패: ' + (e && e.message ? e.message : '알 수 없는 오류') + '\n암호 걸린 PDF는 잠금을 먼저 해제하세요.');
    entry.expanded = false;
  } finally {
    entry.rendering = false;
    render();
  }
}

function buildActions(entry, idx) {
  const actions = document.createElement('span');
  actions.className = 'row-actions';
  actions.innerHTML =
    '<button type="button" data-act="up" title="위로">↑</button>' +
    '<button type="button" data-act="down" title="아래로">↓</button>' +
    '<button type="button" data-act="del" title="삭제">✕</button>';
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
  return actions;
}

function render() {
  fileList.innerHTML = '';
  files.forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'file-item' + (mode === 'pages' ? ' pagesmode' : '');

    if (mode !== 'pages') {
      // ── 전체 합치기: 기존 한 줄(순서·이름·용량·조작) ──
      const order = document.createElement('span'); order.className = 'order'; order.textContent = (idx + 1);
      const name = document.createElement('span'); name.className = 'name'; name.textContent = entry.file.name;
      const size = document.createElement('span'); size.className = 'size'; size.textContent = fmtBytes(entry.file.size);
      item.append(order, name, size, buildActions(entry, idx));
      fileList.appendChild(item);
      return;
    }

    // ── 페이지 선택 합치기: 상단 행 + (펼치면) 썸네일 스트립 ──
    const row = document.createElement('div');
    row.className = 'fi-row';
    const order = document.createElement('span'); order.className = 'order'; order.textContent = (idx + 1);
    const name = document.createElement('span'); name.className = 'name'; name.textContent = entry.file.name;

    const summary = document.createElement('span');
    summary.className = 'sel-summary';
    if (entry.rendering) summary.textContent = '미리보기 생성 중…';
    else if (entry.rendered) summary.textContent = `${selectedCount(entry)} / ${entry.pageCount}쪽 선택`;
    else summary.textContent = '전체';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'prev-toggle';
    toggle.textContent = entry.expanded ? '미리보기 ▲' : '미리보기 ▾';
    toggle.disabled = entry.rendering;
    toggle.addEventListener('click', () => {
      entry.expanded = !entry.expanded;
      if (entry.expanded && !entry.rendered) {
        renderThumbs(entry); // async, 내부에서 render() 호출
      } else {
        render();
      }
    });

    row.append(order, name, summary, toggle, buildActions(entry, idx));
    item.appendChild(row);

    if (entry.expanded && entry.rendered) {
      const strip = document.createElement('div');
      strip.className = 'thumb-strip';

      const tools = document.createElement('div');
      tools.className = 'strip-tools';
      const bAll = document.createElement('button'); bAll.type = 'button'; bAll.textContent = '전체 선택';
      const bNone = document.createElement('button'); bNone.type = 'button'; bNone.textContent = '전체 해제';
      bAll.addEventListener('click', () => { entry.pages.forEach(p => p.selected = true); render(); });
      bNone.addEventListener('click', () => { entry.pages.forEach(p => p.selected = false); render(); });
      tools.append(bAll, bNone);

      const thumbs = document.createElement('div');
      thumbs.className = 'thumbs';
      entry.pages.forEach((p, pi) => {
        const t = document.createElement('button');
        t.type = 'button';
        t.className = 'pthumb' + (p.selected ? ' selected' : '');
        t.setAttribute('aria-pressed', p.selected ? 'true' : 'false');
        const img = document.createElement('img');
        img.src = p.thumb; img.alt = (pi + 1) + '쪽'; img.loading = 'lazy';
        const pn = document.createElement('span'); pn.className = 'pn'; pn.textContent = (pi + 1);
        t.append(img, pn);
        t.addEventListener('click', () => {
          p.selected = !p.selected;
          t.classList.toggle('selected', p.selected);
          t.setAttribute('aria-pressed', p.selected ? 'true' : 'false');
          summary.textContent = `${selectedCount(entry)} / ${entry.pageCount}쪽 선택`;
        });
        thumbs.appendChild(t);
      });

      strip.append(tools, thumbs);
      item.appendChild(strip);
    }

    fileList.appendChild(item);
  });

  dropTitle.textContent = files.length > 0
    ? files.length + '개 PDF — 더 끌어오면 추가됩니다'
    : 'PDF 파일 여러 개를 드래그하거나 클릭해서 선택';
}

function updateButtonState() {
  mergeBtn.disabled = files.length < 1;
  if (files.length === 0) result.hidden = true;
}

function addFiles(list) {
  for (const f of list) {
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) continue;
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, 'PDF')) continue;
    files.push({ id: nextId++, file: f, rendered: false, rendering: false, expanded: false, pages: null, pageCount: null });
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
  const totalSize = files.reduce((sum, entry) => sum + entry.file.size, 0);
  const MAX_TOTAL = 100 * 1024 * 1024;
  if (totalSize > MAX_TOTAL) {
    const mb = Math.round(totalSize / 1024 / 1024);
    if (!confirm(`총 ${mb}MB — 권장 한도 100MB 초과. 메모리 부족·실패 가능. 계속하시겠습니까?`)) return;
  }
  mergeBtn.disabled = true;
  const orig = mergeBtn.textContent;
  mergeBtn.textContent = '처리 중...';
  progressWrap.hidden = false;
  progressFill.style.width = '0%';
  progressWrap.setAttribute('aria-valuenow', '0');
  progressText.textContent = `0 / ${files.length}`;
  try {
    const { PDFDocument } = window.PDFLib;
    const out = await PDFDocument.create();
    let pageTotal = 0;
    let usedFiles = 0;
    let done = 0;
    for (const entry of files) {
      const bytes = await entry.file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      let indices;
      if (mode === 'pages' && entry.rendered) {
        // 미리보기에서 고른 페이지만 (오름차순)
        indices = entry.pages.map((p, i) => (p.selected ? i : -1)).filter(i => i >= 0);
      } else {
        // 전체 모드 이거나, 페이지 모드지만 미리보기 안 연 파일 → 전체
        indices = src.getPageIndices();
      }
      if (indices.length > 0) {
        const pages = await out.copyPages(src, indices);
        pages.forEach((p) => out.addPage(p));
        pageTotal += indices.length;
        usedFiles++;
      }
      done++;
      const pct = Math.round(done / files.length * 100);
      progressFill.style.width = pct + '%';
      progressWrap.setAttribute('aria-valuenow', String(pct));
      progressText.textContent = `${done} / ${files.length}`;
    }
    if (pageTotal === 0) {
      alert('합칠 페이지가 없습니다. 미리보기에서 최소 한 페이지 이상 선택하세요.');
      return;
    }
    const merged = await out.save();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([merged], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);
    downloadBtn.href = resultUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename('merged-' + new Date().toISOString().slice(0, 10) + '.pdf') : 'merged-' + new Date().toISOString().slice(0, 10) + '.pdf');

    mergedCount.textContent = usedFiles + '개';
    mergedPages.textContent = pageTotal + '쪽';
    mergedSize.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('합치기 실패: ' + (e && e.message ? e.message : '알 수 없는 오류') + '\n암호 걸린 PDF가 포함된 경우 잠금을 먼저 해제하세요.');
  } finally {
    mergeBtn.textContent = orig;
    setTimeout(() => { progressWrap.hidden = true; }, 600);
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
  fileInput.value = '';
});
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  if (window.TayStudio && TayStudio.rejectFolderDrop(e)) return;
  if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
});
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

modeTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    mode = tab.dataset.mode === 'pages' ? 'pages' : 'all';
    modeTabs.forEach((t) => {
      const on = (t === tab);
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (modeHint) modeHint.textContent = HINTS[mode] || '';
    render();
    result.hidden = true;
  });
});

mergeBtn.addEventListener('click', merge);
clearBtn.addEventListener('click', clearAll);
