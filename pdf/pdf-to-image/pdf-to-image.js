/**
 * PDF → 이미지 변환 — pdf.js (Mozilla, Apache-2.0).
 * 최종 검증: 2026-05-06
 *
 * 동작:
 *  1. PDF 1개 업로드 → pdf.js로 페이지 수·메타 표시
 *  2. 사용자 옵션 — 페이지 범위(parseRange, pdf-split.js 패턴) + 포맷(PNG/JPG) + DPI + JPG 품질
 *  3. 변환 — 각 페이지를 canvas에 render(scale=DPI/72) → toBlob(format, quality) → BlobURL
 *  4. 결과 그리드에 페이지별 썸네일 + 다운로드 링크. "전체 다운로드"는 순차 anchor click
 *
 * 모듈: pdf.js ESM. 외부 라이브러리 1종(pdf-lib 불필요).
 */

import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const pdfMeta = document.getElementById('pdfMeta');
const metaName = document.getElementById('metaName');
const metaPages = document.getElementById('metaPages');
const metaSize = document.getElementById('metaSize');
const optRow = document.getElementById('optRow');
const rangeIn = document.getElementById('rangeIn');
const formatSel = document.getElementById('formatSel');
const dpiSel = document.getElementById('dpiSel');
const qualityRow = document.getElementById('qualityRow');
const qualityIn = document.getElementById('qualityIn');
const actionBar = document.getElementById('actionBar');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const newCount = document.getElementById('newCount');
const newSize = document.getElementById('newSize');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const imgGrid = document.getElementById('imgGrid');

// JSZip CDN — dynamic-load only on first ZIP click. jsdelivr 외 다른 source 사용 금지.
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

let currentFile = null;
let currentBytes = null;
let currentPdf = null; // pdf.js PDFDocumentProxy
let currentTotal = 0;
let resultUrls = []; // [{ url, filename, blob }]

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function parseRange(text, total) {
  const t = String(text || '').replace(/\s+/g, '');
  if (!t) {
    const all = [];
    for (let i = 0; i < total; i++) all.push(i);
    return all;
  }
  const out = [];
  const parts = t.split(',').filter(Boolean);
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

function updateQualityVisibility() {
  qualityRow.style.display = formatSel.value === 'jpeg' ? '' : 'none';
}

async function loadFile(file) {
  if (!file || (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name))) {
    alert('PDF 파일만 선택해주세요.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 100, 'PDF')) return;
  result.hidden = true;
  imgGrid.innerHTML = '';
  revokeAll();
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';

  try {
    currentBytes = await file.arrayBuffer();
    currentPdf = await pdfjsLib.getDocument({ data: currentBytes.slice(0) }).promise;
    currentFile = file;
    currentTotal = currentPdf.numPages;

    metaName.textContent = file.name;
    metaPages.textContent = currentTotal + '쪽';
    metaSize.textContent = fmtBytes(file.size);
    pdfMeta.hidden = false;
    optRow.hidden = false;
    actionBar.hidden = false;
    rangeIn.placeholder = `예: 1-${Math.min(3, currentTotal)},${Math.min(5, currentTotal)} (비우면 전체 ${currentTotal}쪽)`;
    rangeIn.value = '';
    convertBtn.disabled = false;
  } catch (e) {
    alert('PDF 로드 실패: ' + (e && e.message ? e.message : '암호 걸린 PDF는 잠금 해제 후 다시 시도하세요.'));
    clearAll();
  }
}

function revokeAll() {
  resultUrls.forEach(r => { if (r.url) URL.revokeObjectURL(r.url); });
  resultUrls = [];
}

async function convert() {
  if (!currentPdf) return;
  let indices;
  try {
    indices = parseRange(rangeIn.value, currentTotal);
  } catch (e) {
    alert(e.message);
    return;
  }
  if (indices.length === 0) {
    alert('변환할 페이지가 없습니다.');
    return;
  }

  const format = formatSel.value;
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const dpi = parseInt(dpiSel.value, 10);
  const scale = dpi / 72;
  const quality = format === 'jpeg' ? Math.max(1, Math.min(100, parseInt(qualityIn.value, 10) || 90)) / 100 : undefined;

  // 메모리 사전 가드 — DPI×페이지 누적 시 RGBA 캔버스 OOM. 단순 fallback:
  // DPI 300 초과 + 페이지 30장 초과 시 사용자 confirm
  if (dpi > 300 && indices.length > 30) {
    const msg = `DPI ${dpi} × ${indices.length}쪽 — 메모리 부족으로 변환 실패 가능성이 높습니다.\n` +
      `DPI를 낮추거나(150·300 권장) 페이지 범위를 줄여주세요.\n\n계속하시겠습니까?`;
    if (!confirm(msg)) return;
  }

  convertBtn.disabled = true;
  const origLabel = convertBtn.textContent;
  convertBtn.textContent = '변환 중...';
  progressWrap.hidden = false;
  progressFill.style.width = '0%';
  progressWrap.setAttribute('aria-valuenow', '0');
  progressText.textContent = '0 / ' + indices.length;
  result.hidden = true;
  imgGrid.innerHTML = '';
  revokeAll();

  const baseName = (currentFile.name || 'document').replace(/\.pdf$/i, '');

  try {
    let totalBytes = 0;
    for (let i = 0; i < indices.length; i++) {
      const pageNum = indices[i] + 1;
      const page = await currentPdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('canvas.toBlob 실패')), mime, quality);
      });
      const url = URL.createObjectURL(blob);
      const filename = `${baseName}-p${String(pageNum).padStart(3, '0')}.${ext}`;
      resultUrls.push({ url, filename, blob, pageNum });
      totalBytes += blob.size;

      addImgCard(url, filename, pageNum, blob.size, canvas);

      const pct = Math.round((i + 1) / indices.length * 100);
      progressFill.style.width = pct + '%';
      progressWrap.setAttribute('aria-valuenow', String(pct));
      progressText.textContent = (i + 1) + ' / ' + indices.length;
    }

    newCount.textContent = indices.length + '장';
    newSize.textContent = fmtBytes(totalBytes);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('변환 실패: ' + (e && e.message ? e.message : '알 수 없는 오류') + '\nDPI를 낮추거나 페이지 범위를 줄여보세요.');
  } finally {
    convertBtn.textContent = origLabel;
    convertBtn.disabled = false;
    setTimeout(() => { progressWrap.hidden = true; }, 600);
  }
}

function addImgCard(url, filename, pageNum, size, sourceCanvas) {
  const card = document.createElement('div');
  card.className = 'img-card';

  const thumb = document.createElement('div');
  thumb.className = 'img-card-thumb';
  const img = document.createElement('img');
  // 결과 이미지 자체를 thumbnail로 (브라우저가 알아서 축소)
  img.src = url;
  img.alt = '페이지 ' + pageNum;
  img.loading = 'lazy';
  thumb.appendChild(img);
  card.appendChild(thumb);

  const meta = document.createElement('div');
  meta.className = 'img-card-meta';
  meta.textContent = pageNum + '쪽 · ' + fmtBytes(size);
  card.appendChild(meta);

  const dl = document.createElement('a');
  dl.className = 'img-card-dl';
  dl.href = url;
  dl.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(filename) : filename);
  dl.textContent = '⬇ 다운로드';
  card.appendChild(dl);

  imgGrid.appendChild(card);
}

async function ensureJSZip() {
  if (window.JSZip) return window.JSZip;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSZIP_CDN;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = resolve;
    s.onerror = () => reject(new Error('JSZip 로드 실패 — 네트워크 연결을 확인하세요.'));
    document.head.appendChild(s);
  });
  if (!window.JSZip) throw new Error('JSZip 로드는 됐으나 전역에 노출되지 않았습니다.');
  return window.JSZip;
}

async function downloadZip() {
  if (resultUrls.length === 0) return;
  const origLabel = downloadZipBtn.textContent;
  downloadZipBtn.disabled = true;
  downloadZipBtn.textContent = 'ZIP 생성 중...';
  try {
    const JSZip = await ensureJSZip();
    const zip = new JSZip();
    for (const r of resultUrls) {
      const safeName = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(r.filename) : r.filename);
      zip.file(safeName, r.blob);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const baseName = (currentFile && currentFile.name ? currentFile.name : 'document').replace(/\.pdf$/i, '');
    let zipName = baseName + '-pages.zip';
    if (window.TayStudio && window.TayStudio.sanitizeFilename) zipName = window.TayStudio.sanitizeFilename(zipName);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    alert('ZIP 생성 실패: ' + (e && e.message ? e.message : '알 수 없는 오류'));
  } finally {
    downloadZipBtn.textContent = origLabel;
    downloadZipBtn.disabled = false;
  }
}

function downloadAll() {
  if (resultUrls.length === 0) return;
  // 30개 이상 시 사전 확인 — 다운로드 차단·지연 안내
  const n = resultUrls.length;
  if (n >= 30) {
    const est = Math.ceil(n * 0.2);
    const msg = `${n}개 파일을 순차 다운로드합니다 (약 ${est}초 소요).\n` +
      `브라우저가 "여러 파일 다운로드 허용?"을 묻거나 일부를 차단할 수 있습니다.\n` +
      `대량 다운로드는 개별 ⬇ 버튼이나 더 좁은 페이지 범위 사용을 권장합니다.\n\n계속하시겠습니까?`;
    if (!confirm(msg)) return;
  }
  // 순차 anchor click — 일부 브라우저는 5+ 동시 다운로드 차단, 권한 허용 필요
  resultUrls.forEach((r, idx) => {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = r.url;
      a.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(r.filename) : r.filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, idx * 200);
  });
}

function clearAll() {
  currentFile = null;
  currentBytes = null;
  currentPdf = null;
  currentTotal = 0;
  fileInput.value = '';
  revokeAll();
  imgGrid.innerHTML = '';
  dropTitle.textContent = 'PDF 파일 1개를 드래그하거나 클릭해서 선택';
  pdfMeta.hidden = true;
  optRow.hidden = true;
  actionBar.hidden = true;
  progressWrap.hidden = true;
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

formatSel.addEventListener('change', updateQualityVisibility);
convertBtn.addEventListener('click', convert);
clearBtn.addEventListener('click', clearAll);
downloadAllBtn.addEventListener('click', downloadAll);
if (downloadZipBtn) downloadZipBtn.addEventListener('click', downloadZip);
rangeIn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); convert(); }
});

updateQualityVisibility();
