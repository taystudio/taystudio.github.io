// PDF 편집·주석 — pdf.js(미리보기) + pdf-lib(베이크). 모두 브라우저 안에서.
// 텍스트(한/영 글꼴)·펜·형광펜·도형·흰색 가림을 PDF 위에 얹어 굽는다.
import * as pdfjsLib from '/pdf/vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/vendor/pdf.worker.min.mjs';

const $ = (id) => document.getElementById(id);
const SCALE = 1.5;
const COLORS = ['#111111', '#e11d48', '#2563eb', '#059669', '#f59e0b'];

// 글꼴 그룹 순서/이름/기본값 (영문 페이지에서 달라짐)
const CFG = {
  groupOrder: ['한글', '영문'],
  groupLabel: { '한글': '한글 글꼴', '영문': '영문 글꼴' },
  defaultFont: 'nanumgothic',
};

// 대표 글꼴. 한글 = Google Fonts OFL TTF(한+영 커버, subset 임베드).
// 영문 = 내장 표준폰트(std, 다운로드 불필요) 또는 임베드 TTF. 영문 글꼴에 한글 입력 시 나눔고딕으로 대체.
const FB = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl';
const FONTS = {
  nanumgothic:   { group: '한글', label: '나눔고딕 (고딕)',      ttf: FB + '/nanumgothic/NanumGothic-Regular.ttf' },
  gowundodum:    { group: '한글', label: '고운돋움 (돋움)',      ttf: FB + '/gowundodum/GowunDodum-Regular.ttf' },
  nanummyeongjo: { group: '한글', label: '나눔명조 (명조/바탕)', ttf: FB + '/nanummyeongjo/NanumMyeongjo-Regular.ttf' },
  nanumpen:      { group: '한글', label: '나눔손글씨 (손글씨)',  ttf: FB + '/nanumpenscript/NanumPenScript-Regular.ttf' },
  blackhan:      { group: '한글', label: '검은고딕 (굵은 제목)', ttf: FB + '/blackhansans/BlackHanSans-Regular.ttf' },
  dohyeon:       { group: '한글', label: '도현 (둥근 고딕)',     ttf: FB + '/dohyeon/DoHyeon-Regular.ttf' },
  helvetica:  { group: '영문', label: 'Helvetica (고딕)',        latin: true, std: 'Helvetica',  css: 'Helvetica, Arial, sans-serif' },
  lato:       { group: '영문', label: 'Lato (모던 고딕)',        latin: true, ttf: FB + '/lato/Lato-Regular.ttf' },
  times:      { group: '영문', label: 'Times New Roman (명조)',  latin: true, std: 'TimesRoman', css: "'Times New Roman', Times, serif" },
  crimson:    { group: '영문', label: 'Crimson (세리프)',        latin: true, ttf: FB + '/crimsontext/CrimsonText-Regular.ttf' },
  courier:    { group: '영문', label: 'Courier (고정폭)',        latin: true, std: 'Courier',    css: "'Courier New', monospace" },
  bebas:      { group: '영문', label: 'Bebas Neue (제목 대문자)', latin: true, ttf: FB + '/bebasneue/BebasNeue-Regular.ttf' },
  greatvibes: { group: '영문', label: 'Great Vibes (서명체)',    latin: true, ttf: FB + '/greatvibes/GreatVibes-Regular.ttf' },
  pacifico:   { group: '영문', label: 'Pacifico (캐주얼)',       latin: true, ttf: FB + '/pacifico/Pacifico-Regular.ttf' },
};
const fontBytesCache = {};
const fontFamily = (key) => {
  const f = FONTS[key] || FONTS[CFG.defaultFont];
  return f.ttf ? `'pa-${key}', sans-serif` : f.css;
};

// 미리보기용 @font-face 주입 (임베드 글꼴만; 실제 다운로드는 적용될 때만 — lazy)
(function injectFontFaces() {
  const st = document.createElement('style');
  st.textContent = Object.entries(FONTS).filter(([, v]) => v.ttf)
    .map(([k, v]) => `@font-face{font-family:'pa-${k}';src:url('${v.ttf}');font-display:swap}`).join('\n');
  document.head.appendChild(st);
})();

let pdfBytes = null, pdfjsDoc = null, pdfName = '';
let curPage = 1, pageCount = 1, viewport = null;
let tool = 'select', color = COLORS[0], fontSize = 16, thick = 3, fontKey = CFG.defaultFont;
let activeText = null;
let annos = [];
let selection = [], selOutline = null;   // 선택된 주석 + 선택 영역 외곽선

const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; };
function clearSelection() { selection = []; selOutline = null; }

function setActiveText(a) {
  activeText = a;
  if (a) {
    $('fontSize').value = a.size; $('fontSizeVal').textContent = a.size;
    if ($('fontSel')) $('fontSel').value = a.font || CFG.defaultFont;
    [...$('swatches').children].forEach(x => x.classList.toggle('active', x.dataset.c === a.color));
  }
}
function liveStyleActive() {
  if (!activeText) return;
  const wrap = [...$('textLayer').children].find(x => x._anno === activeText);
  if (wrap && wrap._editor) { wrap._editor.style.fontSize = activeText.size + 'px'; wrap._editor.style.color = activeText.color; wrap._editor.style.fontFamily = fontFamily(activeText.font); }
}

/* ── 팔레트 ── */
const swWrap = $('swatches');
COLORS.forEach((c, i) => {
  const s = document.createElement('div');
  s.className = 'pa-sw' + (i === 0 ? ' active' : '');
  s.style.background = c; s.dataset.c = c;
  s.onclick = () => {
    color = c;
    [...swWrap.children].forEach(x => x.classList.toggle('active', x.dataset.c === c));
    if (activeText && (tool === 'text' || tool === 'select')) { activeText.color = c; liveStyleActive(); }
  };
  swWrap.appendChild(s);
});

/* ── 도구 ── */
document.querySelectorAll('.pa-tool').forEach(b => {
  b.onclick = () => {
    tool = b.dataset.tool;
    document.querySelectorAll('.pa-tool').forEach(x => x.classList.toggle('active', x === b));
    if (tool !== 'text' && tool !== 'select') activeText = null;
    clearSelection();
    const textMode = (tool === 'text' || tool === 'select');
    $('sizeRow').style.display = textMode ? 'flex' : 'none';
    $('fontRow').style.display = textMode ? 'flex' : 'none';
    $('thickRow').style.display = (tool === 'pen' || tool === 'hl' || tool === 'rect' || tool === 'eraser') ? 'flex' : 'none';
    $('overlay').style.cursor = (tool === 'select') ? 'default' : 'crosshair';
    $('overlay').style.pointerEvents = (tool === 'select') ? 'none' : 'auto';
    redrawOverlay(); renderTextBoxes();
  };
});
$('fontSize').oninput = (e) => { fontSize = +e.target.value; $('fontSizeVal').textContent = fontSize; if (activeText && (tool === 'text' || tool === 'select')) { activeText.size = fontSize; liveStyleActive(); } };
$('thick').oninput = (e) => { thick = +e.target.value; $('thickVal').textContent = thick; };

/* ── 글꼴 선택 (그룹 순서 = CFG) ── */
(function initFontSelect() {
  const sel = $('fontSel');
  const byGroup = {};
  Object.entries(FONTS).forEach(([k, v]) => { (byGroup[v.group] = byGroup[v.group] || []).push([k, v]); });
  CFG.groupOrder.forEach(g => {
    if (!byGroup[g]) return;
    const og = document.createElement('optgroup'); og.label = CFG.groupLabel[g] || g;
    byGroup[g].forEach(([k, v]) => { const o = document.createElement('option'); o.value = k; o.textContent = v.label; og.appendChild(o); });
    sel.appendChild(og);
  });
  sel.value = fontKey;
  sel.onchange = () => { fontKey = sel.value; if (activeText && (tool === 'text' || tool === 'select')) { activeText.font = fontKey; liveStyleActive(); } };
})();

/* ── PDF 로드 ── */
async function loadPdfBytes(buf, name) {
  pdfBytes = buf; pdfName = name;
  pdfjsDoc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
  pageCount = pdfjsDoc.numPages; curPage = 1; annos = []; activeText = null;
  $('emptyState').style.display = 'none';
  $('editor').style.display = '';
  $('pdfInfo').textContent = `${name} · ${pageCount}p`;
  $('pageCount').textContent = pageCount;
  $('downloadBtn').disabled = false;
  await renderPage();
}
$('pdfInput').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) { alert('PDF 파일을 선택하세요.'); e.target.value = ''; return; }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, 'PDF')) { e.target.value = ''; return; }
  try { await loadPdfBytes(await f.arrayBuffer(), f.name); }
  catch (err) { alert('PDF를 열 수 없습니다. 손상되었거나 암호로 보호된 파일일 수 있습니다.'); }
};

async function renderPage() {
  const page = await pdfjsDoc.getPage(curPage);
  viewport = page.getViewport({ scale: SCALE });
  const cv = $('pdfCanvas'); cv.width = viewport.width; cv.height = viewport.height;
  const ovc = $('overlay'); ovc.width = viewport.width; ovc.height = viewport.height;
  $('frame').style.width = viewport.width + 'px'; $('frame').style.height = viewport.height + 'px';
  await page.render({ canvasContext: cv.getContext('2d'), viewport }).promise;
  $('pageNum').value = curPage; $('pageNum').max = pageCount;
  $('prevPage').disabled = curPage === 1; $('nextPage').disabled = curPage === pageCount;
  redrawOverlay(); renderTextBoxes();
}
function gotoPage(n) { n = Math.max(1, Math.min(pageCount, n | 0)); if (n !== curPage) { curPage = n; renderPage(); } else { $('pageNum').value = curPage; } }
$('prevPage').onclick = () => gotoPage(curPage - 1);
$('nextPage').onclick = () => gotoPage(curPage + 1);
$('pageNum').onchange = () => gotoPage(+$('pageNum').value);

/* ── overlay (펜·형광펜·도형·가림) ── */
function redrawOverlay() {
  const c = $('overlay').getContext('2d'); const W = $('overlay').width, H = $('overlay').height;
  c.clearRect(0, 0, W, H);
  annos.filter(a => a.page === curPage).forEach(a => {
    if (a.type === 'pen' || a.type === 'hl') {
      c.save(); c.strokeStyle = a.color; c.lineWidth = a.w; c.lineCap = 'round'; c.lineJoin = 'round';
      if (a.type === 'hl') { c.globalAlpha = 0.4; c.lineWidth = a.w * 3; }
      c.beginPath(); a.pts.forEach((p, i) => { const x = p.nx * W, y = p.ny * H; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore();
    } else if (a.type === 'rect') {
      c.save(); c.strokeStyle = a.color; c.lineWidth = a.w; c.strokeRect(a.nx * W, a.ny * H, a.nw * W, a.nh * H); c.restore();
    } else if (a.type === 'white') {
      c.save(); c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1; c.fillRect(a.nx * W, a.ny * H, a.nw * W, a.nh * H); c.strokeRect(a.nx * W, a.ny * H, a.nw * W, a.nh * H); c.restore();
    }
  });
  drawSelection(c, W, H);
}
function drawSelection(c, W, H) {
  if (selOutline) {
    c.save(); c.strokeStyle = '#2563eb'; c.lineWidth = 1.5; c.setLineDash([6, 4]); c.fillStyle = 'rgba(37,99,235,.06)';
    if (selOutline.type === 'rect') { c.fillRect(selOutline.nx * W, selOutline.ny * H, selOutline.nw * W, selOutline.nh * H); c.strokeRect(selOutline.nx * W, selOutline.ny * H, selOutline.nw * W, selOutline.nh * H); }
    else { c.beginPath(); selOutline.pts.forEach((p, i) => { const x = p.nx * W, y = p.ny * H; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.fill(); c.stroke(); }
    c.setLineDash([]); c.restore();
  }
  selection.forEach(a => {
    if (a.page !== curPage || a.type === 'text') return; // 텍스트는 DOM 아웃라인으로 강조
    let bx, by, bw, bh;
    if (a.type === 'pen' || a.type === 'hl') { const xs = a.pts.map(p => p.nx), ys = a.pts.map(p => p.ny); bx = Math.min(...xs); by = Math.min(...ys); bw = Math.max(...xs) - bx; bh = Math.max(...ys) - by; }
    else { bx = a.nx; by = a.ny; bw = a.nw; bh = a.nh; }
    c.save(); c.strokeStyle = '#2563eb'; c.lineWidth = 2; c.strokeRect(bx * W - 3, by * H - 3, bw * W + 6, bh * H + 6); c.restore();
  });
}
const ov = $('overlay');
let draft = null;
const ovXY = (e) => { const r = ov.getBoundingClientRect(); return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height }; };
const isPathTool = (t) => t === 'pen' || t === 'hl' || t === 'lasso';
ov.addEventListener('pointerdown', (e) => {
  if (tool === 'select') return;
  if (tool === 'text') { e.preventDefault(); createTextAt(e); return; }
  e.preventDefault(); try { ov.setPointerCapture(e.pointerId); } catch (_) {}
  const p = ovXY(e);
  if (tool === 'eraser') { clearSelection(); draft = { type: 'eraser', pts: [p] }; eraseAtNorm(p); redrawOverlay(); renderTextBoxes(); drawEraserCursor(p); return; }
  if (tool === 'rsel' || tool === 'lasso') clearSelection();
  if (isPathTool(tool)) draft = { type: tool, page: curPage, pts: [p], color, w: thick };
  else draft = { type: tool, page: curPage, nx: p.nx, ny: p.ny, nw: 0, nh: 0, color, w: thick, _sx: p.nx, _sy: p.ny };
});
ov.addEventListener('pointermove', (e) => {
  if (!draft) return;
  const p = ovXY(e);
  if (draft.type === 'eraser') { draft.pts.push(p); eraseAtNorm(p); redrawOverlay(); renderTextBoxes(); drawEraserCursor(p); return; }
  if (isPathTool(draft.type)) draft.pts.push(p);
  else { draft.nx = Math.min(p.nx, draft._sx); draft.ny = Math.min(p.ny, draft._sy); draft.nw = Math.abs(p.nx - draft._sx); draft.nh = Math.abs(p.ny - draft._sy); }
  redrawDraft();
});
ov.addEventListener('pointerup', () => {
  if (!draft) return;
  const t = draft.type;
  if (t === 'eraser') { draft = null; return; }
  const valid = isPathTool(t) ? draft.pts.length > 1 : (draft.nw > 0.005 && draft.nh > 0.005);
  if (valid) {
    if (t === 'rsel') selectInRect(draft);
    else if (t === 'lasso') selectInPolygon(draft.pts);
    else { delete draft._sx; delete draft._sy; annos.push(draft); }
  }
  draft = null; redrawOverlay(); renderTextBoxes();
});

/* ── 히트 테스트 / 선택 ── */
function textRectNorm(a) { // 렌더된 텍스트 박스의 정규화 사각형 (앵커 점이 아닌 실제 영역)
  const wrap = [...$('textLayer').children].find(x => x._anno === a);
  if (!wrap) return null;
  const fr = ov.getBoundingClientRect(), r = wrap.getBoundingClientRect();
  return { nx: (r.left - fr.left) / fr.width, ny: (r.top - fr.top) / fr.height, nw: r.width / fr.width, nh: r.height / fr.height };
}
function pip(poly, x, y) { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i].nx, yi = poly[i].ny, xj = poly[j].nx, yj = poly[j].ny; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside; } return inside; }
function rectHit(a, m) {
  if (a.page !== curPage) return false;
  if (a.type === 'text') { const tb = textRectNorm(a) || { nx: a.nx, ny: a.ny, nw: 0, nh: 0 }; return tb.nx < m.nx + m.nw && tb.nx + tb.nw > m.nx && tb.ny < m.ny + m.nh && tb.ny + tb.nh > m.ny; }
  if (a.type === 'pen' || a.type === 'hl') return a.pts.some(p => p.nx >= m.nx && p.nx <= m.nx + m.nw && p.ny >= m.ny && p.ny <= m.ny + m.nh);
  return a.nx < m.nx + m.nw && a.nx + a.nw > m.nx && a.ny < m.ny + m.nh && a.ny + a.nh > m.ny;
}
function polyHit(a, poly) {
  if (a.page !== curPage) return false;
  if (a.type === 'text') { const tb = textRectNorm(a); if (tb) return [[tb.nx, tb.ny], [tb.nx + tb.nw, tb.ny], [tb.nx, tb.ny + tb.nh], [tb.nx + tb.nw, tb.ny + tb.nh]].some(cc => pip(poly, cc[0], cc[1])) || pip(poly, a.nx, a.ny); return pip(poly, a.nx, a.ny); }
  if (a.type === 'pen' || a.type === 'hl') return a.pts.some(p => pip(poly, p.nx, p.ny));
  return [[a.nx, a.ny], [a.nx + a.nw, a.ny], [a.nx, a.ny + a.nh], [a.nx + a.nw, a.ny + a.nh]].some(cc => pip(poly, cc[0], cc[1]));
}
function selectInRect(m) { selection = annos.filter(a => rectHit(a, m)); selOutline = { type: 'rect', nx: m.nx, ny: m.ny, nw: m.nw, nh: m.nh }; }
function selectInPolygon(pts) { selection = annos.filter(a => polyHit(a, pts)); selOutline = { type: 'lasso', pts: pts.slice() }; }

/* ── 지우개 ── 펜·형광펜은 지나간 부분만 잘라 조각으로 분리(부분 지우기), 텍스트·도형·가림은 통째로 ── */
function eraserRpx() { return Math.max(8, thick * 4); }
function eraseAtNorm(p) {
  const W = ov.width, H = ov.height, rpx = eraserRpx(), px = p.nx * W, py = p.ny * H;
  const near = (x, y) => Math.hypot(x - px, y - py) <= rpx;
  const touchObj = (a) => {
    if (a.type === 'text') { const tb = textRectNorm(a); if (tb) return px >= tb.nx * W - rpx && px <= (tb.nx + tb.nw) * W + rpx && py >= tb.ny * H - rpx && py <= (tb.ny + tb.nh) * H + rpx; return near(a.nx * W, a.ny * H); }
    return px >= a.nx * W - rpx && px <= (a.nx + a.nw) * W + rpx && py >= a.ny * H - rpx && py <= (a.ny + a.nh) * H + rpx;
  };
  const next = [];
  for (const a of annos) {
    if (a.page !== curPage) { next.push(a); continue; }
    if (a.type === 'pen' || a.type === 'hl') {
      let run = [], removed = false; const runs = [];
      for (const q of a.pts) {
        if (near(q.nx * W, q.ny * H)) { removed = true; if (run.length >= 2) runs.push(run); run = []; }
        else run.push(q);
      }
      if (run.length >= 2) runs.push(run);
      if (!removed) next.push(a);
      else runs.forEach(r2 => next.push({ type: a.type, page: a.page, color: a.color, w: a.w, pts: r2 }));
    } else {
      if (touchObj(a)) { if (activeText === a) activeText = null; } else next.push(a);
    }
  }
  annos = next;
}
function drawEraserCursor(p) {
  const c = ov.getContext('2d'), W = ov.width, H = ov.height, rpx = eraserRpx();
  c.save(); c.strokeStyle = 'rgba(220,38,38,.85)'; c.lineWidth = 1.5; c.setLineDash([3, 3]); c.beginPath(); c.arc(p.nx * W, p.ny * H, rpx, 0, 7); c.stroke(); c.setLineDash([]); c.restore();
}

/* ── Delete / Esc 키로 선택 삭제 ── */
document.addEventListener('keydown', (e) => {
  const ae = document.activeElement;
  if (ae && ae.isContentEditable) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && selection.length) {
    e.preventDefault();
    selection.forEach(a => { if (activeText === a) activeText = null; });
    annos = annos.filter(a => !selection.includes(a));
    clearSelection(); redrawOverlay(); renderTextBoxes();
  } else if (e.key === 'Escape' && (selection.length || selOutline)) {
    clearSelection(); redrawOverlay(); renderTextBoxes();
  }
});

function redrawDraft() {
  redrawOverlay(); if (!draft) return;
  const c = ov.getContext('2d'); const W = ov.width, H = ov.height; c.save();
  if (draft.type === 'pen' || draft.type === 'hl') {
    c.strokeStyle = draft.color; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = draft.type === 'hl' ? draft.w * 3 : draft.w;
    if (draft.type === 'hl') c.globalAlpha = 0.4;
    c.beginPath(); draft.pts.forEach((p, i) => { const x = p.nx * W, y = p.ny * H; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
  } else if (draft.type === 'lasso') {
    c.strokeStyle = '#2563eb'; c.lineWidth = 1.5; c.setLineDash([6, 4]); c.beginPath(); draft.pts.forEach((p, i) => { const x = p.nx * W, y = p.ny * H; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.setLineDash([]);
  } else if (draft.type === 'white') {
    c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.2)'; c.fillRect(draft.nx * W, draft.ny * H, draft.nw * W, draft.nh * H); c.strokeRect(draft.nx * W, draft.ny * H, draft.nw * W, draft.nh * H);
  } else if (draft.type === 'rsel') {
    c.fillStyle = 'rgba(37,99,235,.08)'; c.fillRect(draft.nx * W, draft.ny * H, draft.nw * W, draft.nh * H);
    c.strokeStyle = '#2563eb'; c.lineWidth = 1.5; c.setLineDash([6, 4]); c.strokeRect(draft.nx * W, draft.ny * H, draft.nw * W, draft.nh * H); c.setLineDash([]);
  } else { c.strokeStyle = draft.color; c.lineWidth = draft.w; c.strokeRect(draft.nx * W, draft.ny * H, draft.nw * W, draft.nh * H); }
  c.restore();
}

/* ── 텍스트 박스 ── */
function createTextAt(e) {
  const r = $('frame').getBoundingClientRect();
  const a = { type: 'text', page: curPage, nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height, text: '', size: fontSize, color, font: fontKey };
  annos.push(a); renderTextBoxes(); setActiveText(a);
  const wrap = [...$('textLayer').children].find(x => x._anno === a);
  if (wrap && wrap._editor) { const ed = wrap._editor; setTimeout(() => { ed.focus(); placeCaretEnd(ed); }, 0); }
}
function placeCaretEnd(el) { const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
function renderTextBoxes() {
  const layer = $('textLayer'); layer.innerHTML = '';
  if (!viewport) return;
  const W = viewport.width, H = viewport.height;
  annos.filter(a => a.page === curPage && a.type === 'text').forEach(a => {
    const wrap = document.createElement('div'); wrap.className = 'anno-text-wrap';
    wrap.style.left = (a.nx * W) + 'px'; wrap.style.top = (a.ny * H) + 'px'; wrap._anno = a;
    const editable = (tool === 'text' || tool === 'select');
    wrap.style.pointerEvents = editable ? 'auto' : 'none';
    const ed = document.createElement('div'); ed.className = 'anno-text'; ed.contentEditable = editable ? 'true' : 'false';
    ed.style.color = a.color; ed.style.fontSize = a.size + 'px'; ed.style.fontFamily = fontFamily(a.font); ed.textContent = a.text;
    if (selection.includes(a)) { ed.style.outline = '2px solid #2563eb'; ed.style.background = 'rgba(37,99,235,.14)'; }
    ed.onfocus = () => setActiveText(a);
    ed.oninput = () => { a.text = ed.innerText; };
    ed.onblur = () => { a.text = ed.innerText; if (!a.text.trim()) { if (activeText === a) activeText = null; annos = annos.filter(x => x !== a); renderTextBoxes(); } };
    wrap._editor = ed;
    const drag = document.createElement('div'); drag.className = 'pa-drag'; drag.textContent = '✛';
    let mv = null;
    drag.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); mv = { r: $('frame').getBoundingClientRect() }; drag.setPointerCapture(ev.pointerId); });
    drag.addEventListener('pointermove', (ev) => { if (!mv) return; a.nx = Math.max(0, Math.min(1, (ev.clientX - mv.r.left) / mv.r.width)); a.ny = Math.max(0, Math.min(1, (ev.clientY - mv.r.top) / mv.r.height)); wrap.style.left = (a.nx * W) + 'px'; wrap.style.top = (a.ny * H) + 'px'; });
    drag.addEventListener('pointerup', () => { mv = null; });
    const del = document.createElement('div'); del.className = 'pa-del'; del.textContent = '×';
    del.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); if (activeText === a) activeText = null; annos = annos.filter(x => x !== a); renderTextBoxes(); });
    wrap.appendChild(ed); wrap.appendChild(drag); wrap.appendChild(del); layer.appendChild(wrap);
  });
}

/* ── 실행취소 / 지우기 / 리셋 ── */
$('undoBtn').onclick = () => { const last = [...annos].reverse().find(a => a.page === curPage); if (last) { if (activeText === last) activeText = null; annos = annos.filter(a => a !== last); redrawOverlay(); renderTextBoxes(); } };
$('clearBtn').onclick = () => { if (!annos.some(a => a.page === curPage)) return; if (!confirm('이 페이지의 주석을 모두 지울까요?')) return; annos = annos.filter(a => a.page !== curPage); activeText = null; redrawOverlay(); renderTextBoxes(); };
$('resetBtn').onclick = () => {
  pdfBytes = null; pdfjsDoc = null; pdfName = ''; annos = []; activeText = null; curPage = 1; pageCount = 1; viewport = null;
  $('pdfInput').value = ''; $('editor').style.display = 'none'; $('emptyState').style.display = '';
  $('pdfInfo').textContent = 'PDF를 선택하세요'; $('downloadBtn').disabled = true; $('status').textContent = '';
};

/* ── 글꼴 TTF 로드 (key별 캐시) ── */
async function loadFontBytes(key) {
  if (!FONTS[key]) key = CFG.defaultFont;
  if (!fontBytesCache[key]) {
    $('status').textContent = `${FONTS[key].label} 글꼴 불러오는 중…`;
    fontBytesCache[key] = await fetch(FONTS[key].ttf).then(r => { if (!r.ok) throw new Error('font'); return r.arrayBuffer(); });
  }
  return fontBytesCache[key];
}

/* ── 베이크 ── */
async function bakeToBytes() {
  const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
  const needFont = annos.some(a => a.type === 'text' && a.text.trim());
  const doc = await PDFDocument.load(pdfBytes.slice(0), { ignoreEncryption: false });
  if (doc.isEncrypted) throw new Error('ENCRYPTED');
  const embedded = {};
  if (needFont) doc.registerFontkit(window.fontkit);
  const fontFor = async (key) => {
    key = FONTS[key] ? key : CFG.defaultFont;
    if (!embedded[key]) embedded[key] = FONTS[key].std ? await doc.embedFont(StandardFonts[FONTS[key].std]) : await doc.embedFont(await loadFontBytes(key), { subset: true });
    return embedded[key];
  };
  const pages = doc.getPages();
  for (const a of annos) {
    const pg = pages[a.page - 1]; if (!pg) continue;
    const { width: PW, height: PH } = pg.getSize();
    const inv = 1 / SCALE;
    const col = hex2rgb(a.color || '#111');
    if (a.type === 'white') {
      pg.drawRectangle({ x: a.nx * PW, y: PH - (a.ny + a.nh) * PH, width: a.nw * PW, height: a.nh * PH, color: rgb(1, 1, 1) });
    } else if (a.type === 'rect') {
      pg.drawRectangle({ x: a.nx * PW, y: PH - (a.ny + a.nh) * PH, width: a.nw * PW, height: a.nh * PH, borderColor: rgb(col.r, col.g, col.b), borderWidth: a.w * inv });
    } else if (a.type === 'pen' || a.type === 'hl') {
      const w = (a.type === 'hl' ? a.w * 3 : a.w) * inv;
      for (let i = 0; i < a.pts.length - 1; i++) {
        pg.drawLine({ start: { x: a.pts[i].nx * PW, y: PH - a.pts[i].ny * PH }, end: { x: a.pts[i + 1].nx * PW, y: PH - a.pts[i + 1].ny * PH }, thickness: w, color: rgb(col.r, col.g, col.b), opacity: a.type === 'hl' ? 0.4 : 1 });
      }
    } else if (a.type === 'text' && a.text.trim()) {
      let key = a.font || CFG.defaultFont;
      if (FONTS[key] && FONTS[key].latin && /[^\x00-\xff]/.test(a.text)) key = 'nanumgothic'; // 영문 글꼴+한글 → 한글 글꼴 대체
      const font = await fontFor(key);
      const sizePt = a.size * inv;
      a.text.split('\n').forEach((ln, i) => { if (!ln) return; pg.drawText(ln, { x: a.nx * PW + 2 * inv, y: PH - a.ny * PH - sizePt * (i + 0.82), size: sizePt, font, color: rgb(col.r, col.g, col.b) }); });
    }
  }
  return await doc.save();
}

$('downloadBtn').onclick = async () => {
  if (!pdfBytes) return;
  const btn = $('downloadBtn'); btn.disabled = true;
  try {
    $('status').textContent = '편집 적용 중…';
    const out = await bakeToBytes();
    const base = (pdfName || 'document').replace(/\.pdf$/i, '');
    const fname = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(base) : base) + '-edited.pdf';
    const blob = new Blob([out], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement('a'); aEl.href = url; aEl.download = fname; aEl.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('status').textContent = '완료 — 다운로드됨';
  } catch (err) {
    if (err.message === 'ENCRYPTED') alert('암호화된 PDF는 먼저 비밀번호를 제거하세요. (/pdf/pdf-unlock/)');
    else alert('편집 적용 중 오류: ' + (err.message || err));
    $('status').textContent = '';
  } finally { btn.disabled = false; }
};
