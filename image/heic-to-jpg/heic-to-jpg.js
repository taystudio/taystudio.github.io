/**
 * HEIC → JPG 변환 — heic2any (MIT, libheif WASM 자체 번들).
 * 최종 검증: 2026-05-06
 *
 * 동작:
 *  1. 다중 HEIC/HEIF 파일 드래그·드롭 또는 클릭 선택 (누적)
 *  2. 포맷(JPG/PNG) + 품질(JPG일 때만) 선택
 *  3. 변환 — heic2any가 한 장씩 libheif WASM으로 디코딩 → JPG/PNG 인코딩
 *  4. 결과 그리드에 페이지별 썸네일 + 다운로드. "전체 다운로드"는 200ms 간격 anchor click 순차
 *
 * 글로벌: window.heic2any (heic2any.min.js UMD)
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const fileList = document.getElementById('fileList');
const optRow = document.getElementById('optRow');
const formatSel = document.getElementById('formatSel');
const qualityRow = document.getElementById('qualityRow');
const qualityIn = document.getElementById('qualityIn');
const qualityVal = document.getElementById('qualityVal');
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
const imgGrid = document.getElementById('imgGrid');

let files = []; // { id, file, status: 'pending'|'done'|'err', errMsg }
let nextId = 1;
let resultUrls = []; // { url, filename, blob, srcName }

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateQualityVisibility() {
  qualityRow.style.display = formatSel.value === 'jpeg' ? '' : 'none';
}

function renderFileList() {
  fileList.innerHTML = '';
  files.forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML =
      '<span class="order">' + (idx + 1) + '</span>' +
      '<span class="name"></span>' +
      '<span class="size"></span>' +
      '<span class="status"></span>' +
      '<span class="row-actions"><button type="button" data-act="del" title="삭제">✕</button></span>';
    item.querySelector('.name').textContent = entry.file.name;
    item.querySelector('.size').textContent = fmtBytes(entry.file.size);
    const statusEl = item.querySelector('.status');
    if (entry.status === 'done') { statusEl.textContent = '완료'; statusEl.classList.add('done'); }
    else if (entry.status === 'err') { statusEl.textContent = '실패'; statusEl.classList.add('err'); statusEl.title = entry.errMsg || ''; }
    else { statusEl.textContent = '대기'; }
    item.querySelector('[data-act="del"]').addEventListener('click', () => {
      files.splice(idx, 1);
      renderFileList();
      updateActionBar();
    });
    fileList.appendChild(item);
  });
}

function updateActionBar() {
  const has = files.length > 0;
  optRow.hidden = !has;
  actionBar.hidden = !has;
  convertBtn.disabled = !has;
  if (!has) result.hidden = true;
  dropTitle.textContent = has ? files.length + '개 HEIC — 더 끌어오면 추가' : 'HEIC 파일을 드래그하거나 클릭해서 선택';
}

function addFiles(list) {
  let skipped = 0;
  for (const f of list) {
    const lower = (f.name || '').toLowerCase();
    if (!/\.(heic|heif)$/.test(lower) && !/heic|heif/.test(f.type || '')) {
      // 타입 누락(특히 일부 모바일)을 대비해 확장자 한 번 더 본 후도 안 맞으면 스킵
      skipped++;
      continue;
    }
    if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(f, 100, 'HEIC')) continue;
    files.push({ id: nextId++, file: f, status: 'pending' });
  }
  renderFileList();
  updateActionBar();
  // HEIC가 아닌 파일이 섞이면 사용자에게 알림 — silent skip 방지
  if (skipped > 0 && window.TayStudio && window.TayStudio.showToast) {
    window.TayStudio.showToast(`📁 HEIC/HEIF만 지원 — ${skipped}개 파일 무시됨`, { duration: 2500 });
  }
}

function revokeAll() {
  resultUrls.forEach(r => { if (r.url) URL.revokeObjectURL(r.url); });
  resultUrls = [];
}

async function convert() {
  if (files.length === 0) return;
  if (!window.heic2any) {
    alert('HEIC 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.');
    return;
  }
  if (files.length > 20) {
    if (!confirm(files.length + '개 일괄 변환 — 20개 이상은 메모리 부족·브라우저 멈춤 위험. 계속하시겠습니까?')) return;
  }
  const format = formatSel.value;
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const quality = format === 'jpeg'
    ? Math.max(1, Math.min(100, parseInt(qualityIn.value, 10) || 90)) / 100
    : 1;

  convertBtn.disabled = true;
  const origLabel = convertBtn.textContent;
  convertBtn.textContent = '변환 중...';
  progressWrap.hidden = false;
  progressFill.style.width = '0%';
  if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
  progressText.textContent = '0 / ' + files.length;
  result.hidden = true;
  imgGrid.innerHTML = '';
  revokeAll();

  let totalBytes = 0;
  let okCount = 0;

  for (let i = 0; i < files.length; i++) {
    const entry = files[i];
    try {
      const out = await window.heic2any({
        blob: entry.file,
        toType: mime,
        quality,
      });
      // heic2any는 단일 Blob 또는 Blob[] 반환 — 다중 페이지(burst·Live Photo) 모두 변환.
      const blobs = Array.isArray(out) ? out : [out];
      const baseName = entry.file.name.replace(/\.(heic|heif)$/i, '');
      blobs.forEach((blob, pageIdx) => {
        const url = URL.createObjectURL(blob);
        const filename = blobs.length > 1
          ? `${baseName}-${String(pageIdx + 1).padStart(2, '0')}.${ext}`
          : `${baseName}.${ext}`;
        resultUrls.push({ url, filename, blob, srcName: entry.file.name });
        addImgCard(url, filename, blob.size);
        totalBytes += blob.size;
      });
      okCount += 1;
      entry.status = 'done';
      if (blobs.length > 1) entry.errMsg = `${blobs.length}장 변환됨`;
    } catch (e) {
      entry.status = 'err';
      entry.errMsg = (e && e.message) || '알 수 없는 오류';
    }
    renderFileList();
    const pct = Math.round((i + 1) / files.length * 100);
    progressFill.style.width = pct + '%';
    if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', pct);
    progressText.textContent = (i + 1) + ' / ' + files.length;
  }

  if (okCount > 0) {
    newCount.textContent = okCount + '장' + (okCount < files.length ? ' (실패 ' + (files.length - okCount) + ')' : '');
    newSize.textContent = fmtBytes(totalBytes);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    alert('모든 파일 변환에 실패했습니다. HEIC 파일이 맞는지 확인하세요.');
  }
  convertBtn.textContent = origLabel;
  convertBtn.disabled = false;
  setTimeout(() => { progressWrap.hidden = true; }, 600);
}

function addImgCard(url, filename, size) {
  const card = document.createElement('div');
  card.className = 'img-card';

  const thumb = document.createElement('div');
  thumb.className = 'img-card-thumb';
  const img = document.createElement('img');
  img.src = url;
  img.alt = filename;
  img.loading = 'lazy';
  thumb.appendChild(img);
  card.appendChild(thumb);

  const meta = document.createElement('div');
  meta.className = 'img-card-meta';
  meta.textContent = filename + ' · ' + fmtBytes(size);
  card.appendChild(meta);

  const dl = document.createElement('a');
  dl.className = 'img-card-dl';
  dl.href = url;
  dl.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(filename) : filename);
  dl.textContent = '⬇ 다운로드';
  card.appendChild(dl);

  imgGrid.appendChild(card);
}

function downloadAll() {
  if (resultUrls.length === 0) return;
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
  files = [];
  fileInput.value = '';
  revokeAll();
  imgGrid.innerHTML = '';
  renderFileList();
  updateActionBar();
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
// Ctrl+V 이미지 붙여넣기
if (window.TayStudio && TayStudio.bindPasteImage) {
  TayStudio.bindPasteImage(files => { addFiles(files); }, { multi: true });
}
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

formatSel.addEventListener('change', updateQualityVisibility);
qualityIn.addEventListener('input', () => { qualityVal.textContent = qualityIn.value; });
convertBtn.addEventListener('click', convert);
clearBtn.addEventListener('click', clearAll);
downloadAllBtn.addEventListener('click', downloadAll);

updateQualityVisibility();
