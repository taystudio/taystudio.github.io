/**
 * 이미지 압축 — canvas API 기반, 브라우저 안에서만 처리.
 * 여러 장 일괄 압축 지원 (2026-06): 1장 = 미리보기, 2장+ = 목록 + ZIP 다운로드.
 *
 * 동작:
 *  1. 파일 입력(multiple) → Image 객체로 디코딩
 *  2. canvas 에 원본 크기로 그림 → canvas.toBlob(type, quality)
 *  3. 1장: preview + meta + 단일 다운로드 / 2장+: 결과 목록 + JSZip ZIP
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const formatSel = document.getElementById('format');
const qualityField = document.getElementById('qualityField');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const compressBtn = document.getElementById('compressBtn');
const clearBtn = document.getElementById('clearBtn');
// 단일 결과
const result = document.getElementById('result');
const previewImg = document.getElementById('previewImg');
const origSize = document.getElementById('origSize');
const compSize = document.getElementById('compSize');
const reduceRate = document.getElementById('reduceRate');
const dimText = document.getElementById('dimText');
const downloadBtn = document.getElementById('downloadBtn');
// 다중 결과
const resultMulti = document.getElementById('resultMulti');
const multiSummary = document.getElementById('multiSummary');
const multiList = document.getElementById('multiList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const qualityHint = document.getElementById('qualityHint');
const QUALITY_HINT_DEFAULT = qualityHint ? qualityHint.textContent : '';
const QUALITY_HINT_PNG = 'PNG는 무손실 포맷이라 품질 슬라이더가 적용되지 않습니다. 용량을 줄이려면 JPEG·WebP로 바꾸세요.';

let items = [];          // [{ file, image, url }]
let singleUrl = null;    // 단일 결과 blob URL
let zipUrl = null;       // ZIP blob URL
let multiUrls = [];      // 개별 이미지 결과 blob URL들

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function updateQualityUI() {
  qualityValue.textContent = parseFloat(qualityInput.value).toFixed(2);
  const isPng = formatSel.value === 'image/png';
  qualityField.style.opacity = isPng ? '0.4' : '1';
  qualityInput.disabled = isPng;
  if (qualityHint) {
    qualityHint.textContent = isPng ? QUALITY_HINT_PNG : QUALITY_HINT_DEFAULT;
    qualityHint.style.opacity = '1';
  }
}

function revokeAll() {
  if (singleUrl) { URL.revokeObjectURL(singleUrl); singleUrl = null; }
  if (zipUrl) { URL.revokeObjectURL(zipUrl); zipUrl = null; }
  multiUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); multiUrls = [];
  items.forEach(it => { if (it.url) { try { URL.revokeObjectURL(it.url); } catch (e) {} } });
}

function clearAll() {
  revokeAll();
  items = [];
  fileInput.value = '';
  dropTitle.textContent = '이미지를 드래그하거나 클릭해서 선택';
  compressBtn.disabled = true;
  result.hidden = true;
  if (resultMulti) resultMulti.hidden = true;
  previewImg.removeAttribute('src');
}

function decodeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}

async function loadFiles(fileList) {
  const arr = [...(fileList || [])].filter(Boolean);
  const imgFiles = arr.filter(f => f.type && f.type.startsWith('image/'));
  if (!imgFiles.length) { alert('이미지 파일만 선택해주세요.'); return; }

  const valid = [];
  for (const f of imgFiles) {
    if (f.size === 0) continue;  // 빈 파일 skip
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, '이미지')) continue;
    valid.push(f);
  }
  if (!valid.length) return;

  revokeAll();
  items = [];
  let failed = 0;
  for (const f of valid) {
    try { const { img, url } = await decodeImage(f); items.push({ file: f, image: img, url }); }
    catch (e) { failed++; }
  }
  if (!items.length) { alert('이미지를 디코딩할 수 없습니다. 다른 파일로 시도해주세요.'); clearAll(); return; }

  dropTitle.textContent = items.length === 1
    ? (items[0].file.name + ' (' + fmtBytes(items[0].file.size) + ')')
    : (items.length + '장 선택됨' + (failed ? ' · ' + failed + '장 디코딩 실패(제외)' : ''));
  compressBtn.disabled = false;
  result.hidden = true;
  if (resultMulti) resultMulti.hidden = true;
}

function compressOne(item, type, quality) {
  return new Promise((resolve, reject) => {
    const img = item.image;
    const canvas = document.createElement('canvas');
    try {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (type === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);
    } catch (e) { reject(e); return; }
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('toBlob null')); return; }
      resolve({ blob, w: canvas.width, h: canvas.height });
    }, type, quality);
  });
}

function extOf(type) { return type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png'; }

async function run() {
  if (!items.length) return;
  const type = formatSel.value;
  const quality = parseFloat(qualityInput.value);
  const ext = extOf(type);
  compressBtn.disabled = true;
  try {
    if (items.length === 1) {
      // ── 단일: 기존 미리보기 UX ──
      const it = items[0];
      let out;
      try { out = await compressOne(it, type, quality); }
      catch (e) { alert('압축 실패. 이미지가 너무 크거나 브라우저 메모리가 부족할 수 있습니다.'); return; }
      if (singleUrl) URL.revokeObjectURL(singleUrl);
      singleUrl = URL.createObjectURL(out.blob);
      previewImg.src = singleUrl;
      origSize.textContent = fmtBytes(it.file.size);
      compSize.textContent = fmtBytes(out.blob.size);
      const reduce = (1 - out.blob.size / it.file.size) * 100;
      reduceRate.textContent = (reduce >= 0 ? '−' : '+') + Math.abs(reduce).toFixed(1) + '%';
      reduceRate.style.color = out.blob.size > it.file.size ? '#dc2626' : '';
      dimText.textContent = out.w + '×' + out.h;
      const base = (it.file.name || 'image').replace(/\.[^./]+$/, '');
      const dn = base + '-compressed.' + ext;
      downloadBtn.href = singleUrl;
      downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename) ? window.TayStudio.sanitizeFilename(dn) : dn;
      if (resultMulti) resultMulti.hidden = true;
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // ── 다중: 결과 목록 + ZIP ──
      if (typeof JSZip === 'undefined') { alert('압축 라이브러리(JSZip) 로딩 실패. 새로고침 후 다시 시도해주세요.'); return; }
      multiUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); multiUrls = [];
      const zip = new JSZip();
      const used = new Set();
      let totalIn = 0, totalOut = 0;
      const rows = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        let out;
        try { out = await compressOne(it, type, quality); }
        catch (e) { rows.push({ name: it.file.name || ('image' + (i + 1)), err: true }); continue; }
        totalIn += it.file.size; totalOut += out.blob.size;
        let base = (it.file.name || ('image' + (i + 1))).replace(/\.[^./]+$/, '');
        let nm = base + '-compressed.' + ext, k = 1;
        while (used.has(nm)) { nm = base + '-compressed-' + (k++) + '.' + ext; }
        used.add(nm);
        zip.file(nm, out.blob);
        const u = URL.createObjectURL(out.blob); multiUrls.push(u);
        rows.push({ name: it.file.name || nm, dlName: nm, url: u, before: it.file.size, after: out.blob.size, reduce: (1 - out.blob.size / it.file.size) * 100 });
        await new Promise(r => setTimeout(r, 0)); // UI 양보
      }
      const okRows = rows.filter(r => !r.err);
      if (!okRows.length) { alert('압축에 실패했습니다. 파일을 확인해주세요.'); return; }
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      if (zipUrl) URL.revokeObjectURL(zipUrl);
      zipUrl = URL.createObjectURL(zipBlob);

      const saved = totalIn ? (1 - totalOut / totalIn) * 100 : 0;
      multiSummary.innerHTML = '총 <b>' + okRows.length + '장</b> · ' + esc(fmtBytes(totalIn)) + ' → <b>' + esc(fmtBytes(totalOut)) + '</b> ('
        + (saved >= 0 ? '−' : '+') + Math.abs(saved).toFixed(1) + '%)' + (rows.length - okRows.length ? ' · ' + (rows.length - okRows.length) + '장 실패' : '');
      multiList.innerHTML = rows.map(r => r.err
        ? '<div class="mc-row mc-err">' + esc(r.name) + ' — 실패</div>'
        : '<div class="mc-row"><span class="mc-nm">' + esc(r.name) + '</span><span class="mc-sz">' + esc(fmtBytes(r.before)) + ' → ' + esc(fmtBytes(r.after)) + ' <b>(' + (r.reduce >= 0 ? '−' : '+') + Math.abs(r.reduce).toFixed(0) + '%)</b></span><a class="mc-dl" href="' + r.url + '" download="' + esc(r.dlName) + '" title="이 이미지 다운로드">⬇</a></div>'
      ).join('');
      const zipName = 'compressed-images.zip';
      downloadAllBtn.href = zipUrl;
      downloadAllBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename) ? window.TayStudio.sanitizeFilename(zipName) : zipName;
      result.hidden = true;
      resultMulti.hidden = false;
      resultMulti.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } finally {
    compressBtn.disabled = false;
  }
}

// 파일 선택 (multiple)
fileInput.addEventListener('change', (e) => { if (e.target.files && e.target.files.length) loadFiles(e.target.files); });

// 드래그·드롭
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  if (window.TayStudio && TayStudio.rejectFolderDrop && TayStudio.rejectFolderDrop(e)) return;
  const fs = e.dataTransfer && e.dataTransfer.files;
  if (fs && fs.length) loadFiles(fs);
});
// Ctrl+V 이미지 붙여넣기 (여러 장 가능)
if (window.TayStudio && TayStudio.bindPasteImage) {
  TayStudio.bindPasteImage(files => { if (files && files.length) loadFiles(files); });
}
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

// 옵션 변경
qualityInput.addEventListener('input', updateQualityUI);
formatSel.addEventListener('change', updateQualityUI);

// 액션
compressBtn.addEventListener('click', run);
clearBtn.addEventListener('click', clearAll);

updateQualityUI();
