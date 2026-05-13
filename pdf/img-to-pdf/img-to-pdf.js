/**
 * 이미지 → PDF — pdf-lib (Hopding, MIT).
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. 다중 이미지 누적 등록 (드래그·클릭, 누적)
 *  2. 목록 ↑·↓·✕로 순서·삭제 조정
 *  3. 각 이미지를 JPG는 embedJpg, PNG는 embedPng, 그 외(WebP/GIF/BMP)는 canvas로 PNG 변환 후 embedPng
 *  4. 페이지 크기(A4·Letter·원본) + 방향(자동·세로·가로) + 여백 적용
 *  5. PDFDocument.save() → Blob → 다운로드 링크
 *
 * 글로벌: window.PDFLib
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const fileList = document.getElementById('fileList');
const pageSizeSel = document.getElementById('pageSize');
const orientSel = document.getElementById('orient');
const marginIn = document.getElementById('margin');
const marginValue = document.getElementById('marginValue');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const convCount = document.getElementById('convCount');
const convPages = document.getElementById('convPages');
const convSize = document.getElementById('convSize');
const downloadBtn = document.getElementById('downloadBtn');

let files = []; // { id, file, thumbUrl }
let nextId = 1;
let resultUrl = null;

// 단위 변환: 1pt = 1/72 inch, 1mm ≈ 2.83465 pt
const MM_TO_PT = 72 / 25.4;
const PAGE_SIZES = {
  a4:     { w: 210 * MM_TO_PT, h: 297 * MM_TO_PT }, // 595.28 × 841.89 pt
  letter: { w: 8.5 * 72,        h: 11 * 72 }        // 612 × 792 pt
};

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
      '<img class="thumb" alt="">' +
      '<span class="name"></span>' +
      '<span class="size"></span>' +
      '<span class="row-actions">' +
        '<button type="button" data-act="up" title="위로">↑</button>' +
        '<button type="button" data-act="down" title="아래로">↓</button>' +
        '<button type="button" data-act="del" title="삭제">✕</button>' +
      '</span>';
    item.querySelector('.thumb').src = entry.thumbUrl;
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
        URL.revokeObjectURL(files[idx].thumbUrl);
        files.splice(idx, 1);
      }
      render();
      updateButtonState();
    });
    fileList.appendChild(item);
  });
  if (files.length > 0) {
    dropTitle.textContent = files.length + '개 이미지 — 더 끌어오면 추가됩니다';
  } else {
    dropTitle.textContent = '이미지 여러 장을 드래그하거나 클릭해서 선택';
  }
}

function updateButtonState() {
  convertBtn.disabled = files.length < 1;
  if (files.length === 0) result.hidden = true;
}

function addFiles(list) {
  for (const f of list) {
    if (!f.type.startsWith('image/')) continue;
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 50, '이미지')) continue;
    files.push({
      id: nextId++,
      file: f,
      thumbUrl: URL.createObjectURL(f)
    });
  }
  render();
  updateButtonState();
}

// 이미지를 PNG ArrayBuffer로 (canvas 경유) — WebP/GIF/BMP/JPEG 등에 사용
function fileToPngBytes(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('canvas → PNG 변환 실패'));
        blob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 디코드 실패')); };
    img.src = url;
  });
}

async function convert() {
  if (files.length === 0) return;
  if (!window.PDFLib) {
    alert('PDF 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.');
    return;
  }
  convertBtn.disabled = true;
  const orig = convertBtn.textContent;
  convertBtn.textContent = '처리 중...';

  try {
    const { PDFDocument } = window.PDFLib;
    const doc = await PDFDocument.create();
    const sizeKey = pageSizeSel.value; // 'a4' | 'letter' | 'fit'
    const orient = orientSel.value;    // 'auto' | 'portrait' | 'landscape'
    const marginPt = parseFloat(marginIn.value) * MM_TO_PT;

    for (const entry of files) {
      const file = entry.file;
      let img;
      const lower = file.name.toLowerCase();

      try {
        if (file.type === 'image/jpeg' || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
          const buf = await file.arrayBuffer();
          img = await doc.embedJpg(buf);
        } else if (file.type === 'image/png' || lower.endsWith('.png')) {
          const buf = await file.arrayBuffer();
          img = await doc.embedPng(buf);
        } else {
          // WebP/GIF/BMP/etc → canvas → PNG로 변환 후 embed
          const pngBuf = await fileToPngBytes(file);
          img = await doc.embedPng(pngBuf);
        }
      } catch (e) {
        // 일부 JPEG는 embedJpg가 거부 → PNG로 우회
        const pngBuf = await fileToPngBytes(file);
        img = await doc.embedPng(pngBuf);
      }

      // 페이지 크기 결정
      let pageW, pageH;
      if (sizeKey === 'fit') {
        // 원본 픽셀 = pt 매핑 (1px = 1pt)
        pageW = img.width;
        pageH = img.height;
      } else {
        const base = PAGE_SIZES[sizeKey];
        let w = base.w, h = base.h;
        const isLandscape = orient === 'landscape' || (orient === 'auto' && img.width > img.height);
        if (isLandscape) { [w, h] = [h, w]; }
        pageW = w;
        pageH = h;
      }

      const page = doc.addPage([pageW, pageH]);

      if (sizeKey === 'fit') {
        page.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH });
      } else {
        // 여백 + 비율 유지 + 중앙 배치
        const innerW = Math.max(1, pageW - marginPt * 2);
        const innerH = Math.max(1, pageH - marginPt * 2);
        const scale = Math.min(innerW / img.width, innerH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;
        page.drawImage(img, { x: x, y: y, width: drawW, height: drawH });
      }
    }

    const bytes = await doc.save();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);

    downloadBtn.href = resultUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename('images-' + new Date().toISOString().slice(0, 10) + '.pdf') : 'images-' + new Date().toISOString().slice(0, 10) + '.pdf');

    convCount.textContent = files.length + '장';
    convPages.textContent = doc.getPageCount() + '쪽';
    convSize.textContent = fmtBytes(blob.size);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('PDF 변환 실패: ' + (e && e.message ? e.message : '알 수 없는 오류'));
  } finally {
    convertBtn.textContent = orig;
    updateButtonState();
  }
}

function clearAll() {
  files.forEach((f) => URL.revokeObjectURL(f.thumbUrl));
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
  if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
});
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

marginIn.addEventListener('input', () => { marginValue.textContent = marginIn.value; });
convertBtn.addEventListener('click', convert);
clearBtn.addEventListener('click', clearAll);
