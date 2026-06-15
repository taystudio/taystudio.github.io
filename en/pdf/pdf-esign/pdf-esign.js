// PDF 전자서명 — pdf.js (미리보기) + pdf-lib (서명 삽입). 모두 브라우저 안에서.
import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';

const $ = (id) => document.getElementById(id);

let state = {
  pdfBytes: null,
  pdfDoc: null,
  currentPage: 1,
  pageCount: 1,
  pageCanvas: null,
  sigDataUrl: null,
  sigPos: { x: 0.5, y: 0.7 },  // 0-1 normalized
  sigScale: 40,                // 10-100
};

// ─── 서명 Pad (그리기) ───
const sigCanvas = $('sigCanvas');
const sigCtx = sigCanvas.getContext('2d');
sigCtx.strokeStyle = '#1a1a1a';
sigCtx.lineWidth = 4;
sigCtx.lineCap = 'round';
sigCtx.lineJoin = 'round';
let drawing = false;
function getXY(e) {
  const r = sigCanvas.getBoundingClientRect();
  const x = ((e.clientX ?? e.touches?.[0]?.clientX) - r.left) * (sigCanvas.width / r.width);
  const y = ((e.clientY ?? e.touches?.[0]?.clientY) - r.top) * (sigCanvas.height / r.height);
  return [x, y];
}
function dStart(e) { e.preventDefault(); drawing = true; const [x, y] = getXY(e); sigCtx.beginPath(); sigCtx.moveTo(x, y); $('sigWrap').classList.add('has-drawing'); }
function dMove(e) { if (!drawing) return; e.preventDefault(); const [x, y] = getXY(e); sigCtx.lineTo(x, y); sigCtx.stroke(); }
function dEnd() { drawing = false; }
sigCanvas.addEventListener('pointerdown', dStart);
sigCanvas.addEventListener('pointermove', dMove);
sigCanvas.addEventListener('pointerup', dEnd);
sigCanvas.addEventListener('pointerleave', dEnd);

$('sigClearBtn').onclick = () => {
  sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  $('sigWrap').classList.remove('has-drawing');
};
$('sigUseBtn').onclick = () => {
  const data = sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height);
  let hasInk = false;
  for (let i = 3; i < data.data.length; i += 4) if (data.data[i] > 0) { hasInk = true; break; }
  if (!hasInk) { alert('서명을 먼저 그려주세요.'); return; }
  state.sigDataUrl = sigCanvas.toDataURL('image/png');
  showSigOverlay();
};

// ─── 서명 (텍스트) ───
$('sigTypeUseBtn').onclick = () => {
  const text = $('sigTextInput').value.trim();
  if (!text) { alert('이름을 입력해주세요.'); return; }
  const font = $('sigFont').value;
  const size = +$('sigTextSize').value;
  const c = document.createElement('canvas');
  let ctx = c.getContext('2d');
  ctx.font = `${size}px ${font}`;
  const w = Math.ceil(ctx.measureText(text).width) + 40;
  const h = Math.ceil(size * 1.6);
  c.width = w; c.height = h;
  ctx = c.getContext('2d');
  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = '#1a1a1a';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 20, h / 2);
  state.sigDataUrl = c.toDataURL('image/png');
  showSigOverlay();
};

// ─── 서명 (이미지) ───
$('sigImageInput').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  if (!f.type.startsWith('image/') && !/\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name)) { alert('이미지 파일을 선택해주세요.'); e.target.value = ''; return; }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 20, '이미지')) { e.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = ev => { state.sigDataUrl = ev.target.result; showSigOverlay(); };
  reader.readAsDataURL(f);
};

// ─── 탭 전환 ───
document.querySelectorAll('.es-tabs button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.es-tabs button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    ['Draw', 'Type', 'Image'].forEach(t => $('tab' + t).style.display = (t.toLowerCase() === b.dataset.tab ? '' : 'none'));
  };
});

// ─── PDF 미리보기 ───
$('pdfInput').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) { alert('PDF 파일을 선택해주세요.'); e.target.value = ''; return; }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, 'PDF')) { e.target.value = ''; return; }
  try {
    state.pdfBytes = await f.arrayBuffer();
    state.pdfDoc = await pdfjsLib.getDocument({ data: state.pdfBytes.slice(0) }).promise;
    state.pageCount = state.pdfDoc.numPages;
    state.currentPage = 1;
    $('emptyState').style.display = 'none';
    $('pdfRender').style.display = '';
    $('pdfInfo').textContent = `${f.name} · ${state.pageCount} 페이지`;
    $('pageCount').textContent = state.pageCount;
    await renderPage();
  } catch (err) {
    alert('PDF를 열 수 없습니다. 손상되었거나 암호로 보호된 파일일 수 있습니다.');
  }
};

async function renderPage() {
  const page = await state.pdfDoc.getPage(state.currentPage);
  const vp = page.getViewport({ scale: 1.5 });
  const canvas = $('pdfCanvas');
  canvas.width = vp.width; canvas.height = vp.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  $('pageNum').value = state.currentPage;
  $('pageNum').max = state.pageCount;
  $('prevPage').disabled = (state.currentPage === 1);
  $('nextPage').disabled = (state.currentPage === state.pageCount);
  state.pageCanvas = canvas;
  positionOverlay();
}

$('prevPage').onclick = () => { if (state.currentPage > 1) { state.currentPage--; renderPage(); } };
$('nextPage').onclick = () => { if (state.currentPage < state.pageCount) { state.currentPage++; renderPage(); } };
// 페이지 번호 직접 입력 → 바로 점프
function jumpToPage() {
  let n = parseInt($('pageNum').value, 10);
  if (isNaN(n)) { $('pageNum').value = state.currentPage; return; }
  n = Math.max(1, Math.min(state.pageCount, n));
  if (n !== state.currentPage) { state.currentPage = n; renderPage(); }
  else { $('pageNum').value = state.currentPage; }
}
$('pageNum').addEventListener('change', jumpToPage);
$('pageNum').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); jumpToPage(); $('pageNum').blur(); } });

// ─── 서명 overlay ───
function showSigOverlay() {
  if (!state.sigDataUrl) return;
  $('sigOverlayImg').src = state.sigDataUrl;
  $('sigOverlay').style.display = '';
  positionOverlay();
  updateDownloadState();
}

function positionOverlay() {
  if (!state.sigDataUrl || !state.pageCanvas) return;
  const overlay = $('sigOverlay');
  const canvas = state.pageCanvas;
  const scale = state.sigScale / 100;
  overlay.style.width = (canvas.clientWidth * scale * 0.4) + 'px';
  overlay.style.opacity = (+$('sigOpacity').value / 100);
  overlay.style.left = (state.sigPos.x * canvas.clientWidth) + 'px';
  overlay.style.top = (state.sigPos.y * canvas.clientHeight) + 'px';
}

// ─── drag (위치) ───
let drag = null;
const overlay = $('sigOverlay');
overlay.addEventListener('pointerdown', e => {
  if (e.target.id === 'sigHandleBR') return;
  e.preventDefault();
  const r = state.pageCanvas.getBoundingClientRect();
  drag = { sx: e.clientX, sy: e.clientY, bx: state.sigPos.x, by: state.sigPos.y, w: r.width, h: r.height };
  overlay.classList.add('dragging');
  overlay.setPointerCapture(e.pointerId);
});
overlay.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = (e.clientX - drag.sx) / drag.w;
  const dy = (e.clientY - drag.sy) / drag.h;
  state.sigPos.x = Math.max(0, Math.min(1, drag.bx + dx));
  state.sigPos.y = Math.max(0, Math.min(1, drag.by + dy));
  positionOverlay();
});
overlay.addEventListener('pointerup', () => { drag = null; overlay.classList.remove('dragging'); });

// ─── resize (크기) — corner handle ───
let resize = null;
const handle = $('sigHandleBR');
handle.addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation();
  if (!state.pageCanvas) return;
  resize = { sx: e.clientX, base: state.sigScale, cw: state.pageCanvas.clientWidth };
  handle.setPointerCapture(e.pointerId);
});
handle.addEventListener('pointermove', e => {
  if (!resize) return;
  const dx = e.clientX - resize.sx;
  const pxPerScale = resize.cw * 0.4 * 0.01;
  const ns = Math.max(10, Math.min(100, Math.round(resize.base + dx / pxPerScale)));
  state.sigScale = ns;
  $('sigScale').value = ns;
  positionOverlay();
});
handle.addEventListener('pointerup', () => { resize = null; });
handle.addEventListener('pointercancel', () => { resize = null; });

$('sigScale').oninput = (e) => { state.sigScale = +e.target.value; positionOverlay(); };
$('sigOpacity').oninput = positionOverlay;

function updateDownloadState() {
  const ready = state.pdfBytes && state.sigDataUrl;
  $('downloadBtn').disabled = !ready;
  $('downloadStatus').textContent = ready ? '클릭하면 서명된 PDF 다운로드' : 'PDF + 서명 둘 다 준비되면 활성화';
}

// ─── 다운로드 (pdf-lib) ───
$('downloadBtn').onclick = async () => {
  if (!state.pdfBytes || !state.sigDataUrl) return;
  try {
    const { PDFDocument } = window.PDFLib;
    const pdf = await PDFDocument.load(state.pdfBytes.slice(0), { ignoreEncryption: false });
    if (pdf.isEncrypted) {
      alert('암호화된 PDF는 먼저 비밀번호를 제거하세요. (/pdf/pdf-unlock/)');
      return;
    }
    const pngBytes = await fetch(state.sigDataUrl).then(r => r.arrayBuffer());
    const sigImg = await pdf.embedPng(pngBytes);
    const page = pdf.getPage(state.currentPage - 1);
    const { width: pw, height: ph } = page.getSize();
    const scale = state.sigScale / 100;
    const sigW = pw * scale * 0.4;
    const sigH = sigW * (sigImg.height / sigImg.width);
    const cx = state.sigPos.x * pw;
    const cy = (1 - state.sigPos.y) * ph;
    page.drawImage(sigImg, {
      x: cx - sigW / 2,
      y: cy - sigH / 2,
      width: sigW,
      height: sigH,
      opacity: +$('sigOpacity').value / 100,
    });
    const out = await pdf.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signed.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    alert('서명 삽입 중 오류가 발생했습니다: ' + (err.message || err));
  }
};
