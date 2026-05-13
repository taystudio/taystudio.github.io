/**
 * 이미지 글자 추출 (OCR) — Tesseract.js (Apache-2.0).
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. 이미지 업로드 → preview 표시
 *  2. 언어 선택 후 추출 버튼 → Tesseract.recognize(image, lang, { logger })
 *  3. progress 이벤트로 진행률 갱신
 *  4. 결과 텍스트 + 신뢰도 표시 → 복사·TXT 다운로드
 *
 * 글로벌: window.Tesseract
 * 학습 데이터·worker는 첫 사용 시 jsdelivr CDN에서 자동 다운로드 후 IndexedDB 캐시.
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const previewBox = document.getElementById('previewBox');
const previewImg = document.getElementById('previewImg');
const langSel = document.getElementById('lang');
const ocrBtn = document.getElementById('ocrBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const confValue = document.getElementById('confValue');
const charCount = document.getElementById('charCount');
const ocrText = document.getElementById('ocrText');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let currentObjectURL = null;
let txtBlobUrl = null;

const STATUS_KO = {
  'loading tesseract core': 'OCR 엔진 로딩',
  'initializing tesseract': 'OCR 엔진 초기화',
  'loading language traineddata': '학습 데이터 다운로드',
  'initializing api': 'API 초기화',
  'recognizing text': '텍스트 인식 중'
};

function setProgress(status, ratio) {
  progressWrap.hidden = false;
  const pct = Math.round((ratio || 0) * 100);
  progressFill.style.width = pct + '%';
  const label = STATUS_KO[status] || status || '처리 중';
  progressText.textContent = label + ' — ' + pct + '%';
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('이미지 파일만 선택해주세요.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 50, '이미지')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
  if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
  currentObjectURL = URL.createObjectURL(file);
  previewImg.src = currentObjectURL;
  previewBox.hidden = false;
  ocrBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
}

async function runOcr() {
  if (!currentFile) return;
  if (!window.Tesseract) {
    alert('OCR 엔진이 아직 로드되지 않았습니다. 페이지를 새로고침하세요.');
    return;
  }
  ocrBtn.disabled = true;
  const orig = ocrBtn.textContent;
  ocrBtn.textContent = '처리 중...';
  setProgress('starting', 0);

  try {
    const lang = langSel.value;
    const { data } = await window.Tesseract.recognize(currentFile, lang, {
      logger: (m) => {
        if (m && typeof m.progress === 'number') {
          setProgress(m.status, m.progress);
        }
      }
    });

    progressFill.style.width = '100%';
    progressText.textContent = '완료 ✓';

    const text = (data && data.text) || '';
    const conf = (data && typeof data.confidence === 'number') ? data.confidence.toFixed(1) : '—';

    confValue.textContent = conf + '%';
    charCount.textContent = text.length + '자';
    ocrText.value = text.trim();

    if (txtBlobUrl) URL.revokeObjectURL(txtBlobUrl);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    txtBlobUrl = URL.createObjectURL(blob);
    const baseName = (currentFile.name || 'image').replace(/\.[^./]+$/, '');
    downloadBtn.href = txtBlobUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '-ocr.txt') : baseName + '-ocr.txt');

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    progressText.textContent = '실패: ' + (e && e.message ? e.message : '알 수 없는 오류');
    progressFill.style.width = '0%';
    alert('OCR 처리 실패: ' + (e && e.message ? e.message : '네트워크 또는 브라우저 문제') + '\n페이지를 새로고침 후 다시 시도하거나 다른 이미지로 테스트하세요.');
  } finally {
    ocrBtn.textContent = orig;
    ocrBtn.disabled = false;
  }
}

function clearAll() {
  currentFile = null;
  if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
  if (txtBlobUrl) { URL.revokeObjectURL(txtBlobUrl); txtBlobUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = '이미지 파일을 드래그하거나 클릭해서 선택';
  previewImg.removeAttribute('src');
  previewBox.hidden = true;
  ocrBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  ocrText.value = '';
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
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadFile(f);
});

ocrBtn.addEventListener('click', runOcr);
clearBtn.addEventListener('click', clearAll);

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(ocrText.value);
    const orig = copyBtn.textContent;
    copyBtn.textContent = '✓ 복사됨';
    setTimeout(() => { copyBtn.textContent = orig; }, 1500);
  } catch {
    ocrText.select();
    document.execCommand('copy');
  }
});
