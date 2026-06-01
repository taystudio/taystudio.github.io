/**
 * 배경 제거 (누끼) — 2 모드:
 *   1. 사진·인물 (Photo): @imgly/background-removal v1.7 ISNet ML 모델 (AGPL/Commercial).
 *      - 모델 품질 선택: quint8 (44MB) / fp16 (88MB) / fp32 (176MB)
 *   2. 로고·그래픽 (Logo): canvas chroma key — 픽셀 단위 배경 색 제거.
 *      - tolerance 슬라이더 + 배경 색상 자동 감지 / 수동 선택
 *      - 흰 배경 + 회색·검은 텍스트·로고에 정확. 안티에일리어싱 점진적 알파 보존.
 *
 * 최종 검증: 2026-06-01 (chroma key 모드 추가)
 */

import { removeBackground } from '/image/vendor/imgly-bg-remove.mjs?v=2026-05-22b';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const dropThumbnail = document.getElementById('dropThumbnail');
const removeBtn = document.getElementById('removeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const origImg = document.getElementById('origImg');
const resultImg = document.getElementById('resultImg');
const elapsedTime = document.getElementById('elapsedTime');
const dimText = document.getElementById('dimText');
const resultSize = document.getElementById('resultSize');
const downloadBtn = document.getElementById('downloadBtn');

// 모드/모델 UI
const modeRadios = document.querySelectorAll('input[name="mode"]');
const modeRadioLabels = document.querySelectorAll('.mode-radio');
const qualityRadios = document.querySelectorAll('input[name="quality"]');
const qualityRadioLabels = document.querySelectorAll('#qualityRadios label');
const photoOptions = document.getElementById('photoOptions');
const logoOptions = document.getElementById('logoOptions');
const toleranceRange = document.getElementById('toleranceRange');
const toleranceValue = document.getElementById('toleranceValue');
const bgColorPicker = document.getElementById('bgColorPicker');
const autoDetectBgBtn = document.getElementById('autoDetectBg');

let currentFile = null;
let origUrl = null;
let resultUrl = null;
let runSeq = 0;
let activeRun = 0;
let bgColorAutoDetected = null;  // 자동 감지된 배경색 캐시

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function getMode() {
  return document.querySelector('input[name="mode"]:checked')?.value || 'auto';
}

/**
 * 자동 모드 분석 — 업로드 이미지의 4 모서리 + 중앙 픽셀을 샘플링하여
 * 흰 배경 + 단색 분포 → 로고 모드 / 그 외 → 사진 모드 분기.
 *
 * 휴리스틱:
 *  - 4 모서리 평균 RGB > (235, 235, 235): 흰 배경 후보
 *  - 모서리 간 색 분산 (max diff) < 25: 단색·단순 배경
 *  - 중앙 픽셀이 모서리와 충분히 다름 (피사체 존재)
 *  → 모두 만족 시 'logo' 분기
 */
async function autoDetectMode(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const w = Math.min(img.naturalWidth, 400);
      const h = Math.min(img.naturalHeight, 400);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      function avg(x, y, sz) {
        const d = ctx.getImageData(Math.max(0, x), Math.max(0, y), sz, sz).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; n++; }
        return { r: r/n, g: g/n, b: b/n };
      }

      const samples = {
        tl: avg(0, 0, 10),
        tr: avg(w - 10, 0, 10),
        bl: avg(0, h - 10, 10),
        br: avg(w - 10, h - 10, 10),
        center: avg(Math.floor(w/2) - 5, Math.floor(h/2) - 5, 10),
      };

      // 4 모서리 평균 색 (배경 추정)
      const cornerAvg = {
        r: (samples.tl.r + samples.tr.r + samples.bl.r + samples.br.r) / 4,
        g: (samples.tl.g + samples.tr.g + samples.bl.g + samples.br.g) / 4,
        b: (samples.tl.b + samples.tr.b + samples.bl.b + samples.br.b) / 4,
      };

      // 모서리 간 색 분산
      const cornerVals = [samples.tl, samples.tr, samples.bl, samples.br];
      let maxDiff = 0;
      for (let i = 0; i < cornerVals.length; i++) {
        for (let j = i + 1; j < cornerVals.length; j++) {
          const d = Math.max(
            Math.abs(cornerVals[i].r - cornerVals[j].r),
            Math.abs(cornerVals[i].g - cornerVals[j].g),
            Math.abs(cornerVals[i].b - cornerVals[j].b)
          );
          if (d > maxDiff) maxDiff = d;
        }
      }

      // 중앙 vs 모서리 — 피사체 존재 여부
      const centerVsCorner = Math.max(
        Math.abs(samples.center.r - cornerAvg.r),
        Math.abs(samples.center.g - cornerAvg.g),
        Math.abs(samples.center.b - cornerAvg.b)
      );

      const isWhitishBg = cornerAvg.r > 235 && cornerAvg.g > 235 && cornerAvg.b > 235;
      const isSimpleBg = maxDiff < 25;
      const hasSubject = centerVsCorner > 40;

      const mode = (isWhitishBg && isSimpleBg && hasSubject) ? 'logo' : 'photo';
      resolve({
        mode,
        bgColor: { r: Math.round(cornerAvg.r), g: Math.round(cornerAvg.g), b: Math.round(cornerAvg.b) },
        reason: mode === 'logo'
          ? `흰 배경 + 단순 배경 감지 (모서리 평균 ${Math.round(cornerAvg.r)},${Math.round(cornerAvg.g)},${Math.round(cornerAvg.b)} · 분산 ${Math.round(maxDiff)})`
          : `자연스러운 배경 (모서리 평균 ${Math.round(cornerAvg.r)},${Math.round(cornerAvg.g)},${Math.round(cornerAvg.b)} · 분산 ${Math.round(maxDiff)})`
      });
    };
    img.onerror = () => resolve({ mode: 'photo', bgColor: { r: 255, g: 255, b: 255 }, reason: '분석 실패 — 사진 모드 fallback' });
    img.src = url;
  });
}
function getQuality() {
  return document.querySelector('input[name="quality"]:checked')?.value || 'isnet_quint8';
}

// 모드·품질 라디오 visual active 토글
modeRadios.forEach(r => r.addEventListener('change', () => {
  const mode = getMode();
  modeRadioLabels.forEach(l => l.classList.toggle('active', l.dataset.mode === mode));
  // 자동 모드는 모든 결정을 자동으로 → 품질·tolerance 모두 숨김
  // 사진 모드 → 품질 선택 노출
  // 로고 모드 → tolerance·배경색 노출
  photoOptions.classList.toggle('hidden', mode !== 'photo');
  logoOptions.classList.toggle('hidden', mode !== 'logo');
  // 자동 감지 결과 표시는 auto 모드일 때만
  const autoResult = document.getElementById('autoDetectResult');
  if (autoResult) autoResult.style.display = (mode === 'auto' && autoResult.textContent) ? 'block' : 'none';
  if (mode === 'logo' && currentFile && !bgColorAutoDetected) {
    autoDetectBackgroundColor();
  }
}));
qualityRadios.forEach(r => r.addEventListener('change', () => {
  const q = getQuality();
  qualityRadioLabels.forEach(l => l.classList.toggle('active', l.dataset.quality === q));
}));

toleranceRange.addEventListener('input', () => {
  toleranceValue.textContent = toleranceRange.value;
});

autoDetectBgBtn.addEventListener('click', () => {
  if (!currentFile) { alert('이미지를 먼저 업로드해주세요.'); return; }
  autoDetectBackgroundColor(true);
});

// 이미지 4 모서리 영역 평균 → 배경 색 추정 (chroma key용)
async function autoDetectBackgroundColor(showAlert) {
  if (!origUrl) return;
  const img = new Image();
  img.src = origUrl;
  await new Promise((r) => { img.onload = r; img.onerror = r; });
  if (!img.naturalWidth) return;
  const canvas = document.createElement('canvas');
  const w = canvas.width = Math.min(img.naturalWidth, 200);
  const h = canvas.height = Math.min(img.naturalHeight, 200);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  // 4 모서리 8×8 픽셀 평균
  const samples = [
    [0, 0], [w - 8, 0], [0, h - 8], [w - 8, h - 8]
  ];
  let r = 0, g = 0, b = 0, n = 0;
  for (const [x, y] of samples) {
    const data = ctx.getImageData(Math.max(0, x), Math.max(0, y), 8, 8).data;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
  }
  r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  bgColorPicker.value = hex;
  bgColorAutoDetected = { r, g, b };
  if (showAlert) {
    // 잠시 시각 피드백
    bgColorPicker.style.outline = '2px solid var(--primary)';
    setTimeout(() => { bgColorPicker.style.outline = ''; }, 500);
  }
}

function setProgress(key, current, total) {
  if (activeRun === 0) return;
  progressWrap.hidden = false;
  let pct = 0;
  if (total > 0 && Number.isFinite(current)) {
    pct = Math.round((current / total) * 100);
  }
  progressFill.style.width = pct + '%';
  if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', pct);
  let label = key;
  if (typeof key === 'string') {
    if (key.startsWith('fetch:')) label = 'AI 모델 다운로드 중';
    else if (key.startsWith('compute:')) label = '배경 분석 중';
    else if (key === 'starting') label = '준비 중';
    else if (key === 'chroma') label = '색상 기반 제거 중';
    else if (key === 'cleanup') label = '흰 배경 잔여 정리 중';
  }
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function loadFile(file) {
  const imgExtRe = /\.(png|jpe?g|webp|bmp|gif|avif|tiff?)$/i;
  if (!file || !file.type.startsWith('image/') || !imgExtRe.test(file.name || '')) {
    alert('이미지 파일만 선택해주세요. (PNG·JPG·WebP·BMP·GIF·AVIF·TIFF)');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 30, '이미지')) return;
  currentFile = file;
  dropTitle.textContent = file.name + ' (' + fmtBytes(file.size) + ')';
  if (origUrl) URL.revokeObjectURL(origUrl);
  origUrl = URL.createObjectURL(file);
  origImg.src = origUrl;
  if (dropThumbnail) {
    dropThumbnail.src = origUrl;
    dropZone.classList.add('has-file');
  }
  removeBtn.disabled = false;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
  bgColorAutoDetected = null;
  autoDetectBackgroundColor(false);

  // 자동 모드일 때 — 업로드 직후 분석 → 추천 모드 표시
  if (getMode() === 'auto') {
    autoDetectMode(file).then(({ mode, bgColor, reason }) => {
      const autoResult = document.getElementById('autoDetectResult');
      if (autoResult) {
        const modeLabel = mode === 'logo' ? '🎨 로고 모드' : '📷 사진 모드';
        autoResult.innerHTML = `<b>자동 감지:</b> ${modeLabel} 추천 · <span style="font-size:11.5px">${reason}</span>`;
        autoResult.style.display = 'block';
      }
      // 자동 모드면 로고 사용 시 배경색 채움
      if (mode === 'logo' && bgColorPicker) {
        const hex = '#' + [bgColor.r, bgColor.g, bgColor.b].map(v => v.toString(16).padStart(2, '0')).join('');
        bgColorPicker.value = hex;
        bgColorAutoDetected = bgColor;
      }
    });
  }
}

/**
 * Chroma Key 배경 제거 — 로고·그래픽 모드.
 *
 * 각 픽셀의 RGB 거리를 기준점(배경색)과 비교하여 알파 점진 처리:
 *   - distance ≤ 0          → 알파 0 (완전 투명)
 *   - distance ≥ tolerance  → 알파 255 (완전 불투명)
 *   - 그 사이                 → 선형 비례
 *
 * 거리 = max(|R-bgR|, |G-bgG|, |B-bgB|)  (Chebyshev distance — 색상 인식에 자연스러움)
 *
 * 이렇게 하면 흰 배경(255,255,255)에서 회색 텍스트(140,140,140)는 distance=115 → 알파 255 보존,
 * 안티에일리어싱 가장자리(220,220,220)는 distance=35 → 부분 알파.
 */
async function chromaKey(file, bgRGB, tolerance) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const len = data.length;
    const bgR = bgRGB.r, bgG = bgRGB.g, bgB = bgRGB.b;
    const tol = Math.max(1, tolerance);

    for (let i = 0; i < len; i += 4) {
      const dR = Math.abs(data[i] - bgR);
      const dG = Math.abs(data[i + 1] - bgG);
      const dB = Math.abs(data[i + 2] - bgB);
      const dist = Math.max(dR, dG, dB);

      if (dist <= tol * 0.4) {
        // 배경 색에 매우 가까움 → 완전 투명
        data[i + 3] = 0;
      } else if (dist < tol) {
        // 가장자리 (안티에일리어싱) → 선형 알파
        const ratio = (dist - tol * 0.4) / (tol - tol * 0.4);
        data[i + 3] = Math.round(ratio * 255);
      }
      // dist >= tol → 알파 255 그대로 유지 (불변)
    }

    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return { r: 255, g: 255, b: 255 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/**
 * ML 결과 hybrid 후처리 — ISNet 마스크에 흰 배경 픽셀 강제 알파 0 보강.
 *
 * 동기:
 *  ISNet 같은 ML matting 모델이 흰 배경 일부를 "회색 부드러운 배경" 등으로
 *  판단해 알파를 0이 아닌 값으로 남기는 경우, 결과가 "번지듯" 보임.
 *  ML 마스크는 신뢰하되, RGB가 명확히 흰색에 가까운 픽셀은 강제 알파 0 처리.
 *
 * 알고리즘:
 *  - ML 결과 이미지의 각 픽셀 (R,G,B,A) 검사
 *  - A > 0 (ML 이 전경으로 판단했지만):
 *      · R,G,B 모두 ≥ threshold(default 240) AND
 *      · 색상 분산 < 10 (단색 흰색에 가까움)
 *      → 알파 0 으로 강제 (배경으로 재분류)
 *  - 회색 텍스트(R≈140 등)는 threshold 미만이라 그대로 보존
 *  - 검은 텍스트(R<50)는 명확한 전경이라 그대로 보존
 *
 * → ML 의 인물·털 디테일은 유지하면서 흰 배경 잔여만 깨끗 제거.
 */
async function hybridWhiteCleanup(blob, threshold = 240) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const len = data.length;
      for (let i = 0; i < len; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a === 0) continue;  // 이미 투명 — skip
        if (r >= threshold && g >= threshold && b >= threshold) {
          const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
          if (maxDiff < 10) {
            data[i + 3] = 0;  // 흰색에 매우 가까운 픽셀 → 강제 알파 0
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((b) => resolve(b), 'image/png');
    };
    img.onerror = () => resolve(blob);  // 실패 시 원본 그대로
    img.src = url;
  });
}

async function run() {
  if (!currentFile) return;
  const myRun = ++runSeq;
  activeRun = myRun;
  removeBtn.disabled = true;
  cancelBtn.hidden = false;
  const orig = removeBtn.textContent;
  removeBtn.textContent = '처리 중...';
  setProgress('starting', 0, 1);
  const t0 = performance.now();

  const tempImg = new Image();
  tempImg.src = origUrl;
  await new Promise((r) => { tempImg.onload = r; tempImg.onerror = r; });
  const origDim = tempImg.naturalWidth + '×' + tempImg.naturalHeight;
  let mode = getMode();
  let effectiveMode = mode;

  // 자동 모드 — 분석 후 실제 적용할 모드 결정
  if (mode === 'auto') {
    const detected = await autoDetectMode(currentFile);
    effectiveMode = detected.mode;
    if (detected.mode === 'logo' && bgColorPicker) {
      const hex = '#' + [detected.bgColor.r, detected.bgColor.g, detected.bgColor.b]
        .map(v => v.toString(16).padStart(2, '0')).join('');
      bgColorPicker.value = hex;
    }
  }

  try {
    let blob;

    if (effectiveMode === 'logo') {
      setProgress('chroma', 0, 100);
      const bg = hexToRgb(bgColorPicker.value);
      const tolerance = parseInt(toleranceRange.value, 10) || 20;
      blob = await chromaKey(currentFile, bg, tolerance);
      setProgress('chroma', 100, 100);
    } else {
      // 사진 모드 — 사용자 명시 사진은 사용자 선택 품질 그대로, 자동 모드는 균형(fp16) default
      const quality = (mode === 'auto') ? 'isnet_fp16' : getQuality();
      blob = await removeBackground(currentFile, {
        model: quality,
        output: { format: 'image/png', quality: 0.9 },
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        progress: setProgress
      });
      // ML 결과에 흰 배경 후처리 적용 (threshold 240 + 색상 분산 < 10 = 거의 순수 흰색만)
      // 인물 가장자리 등 미세 디테일은 보존되고, ML 이 미스한 흰 배경 잔여만 깨끗 제거
      setProgress('cleanup', 0, 100);
      blob = await hybridWhiteCleanup(blob, 240);
      setProgress('cleanup', 100, 100);
    }

    if (myRun !== activeRun) return;

    const ms = Math.round(performance.now() - t0);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    resultImg.src = resultUrl;
    elapsedTime.textContent = (ms / 1000).toFixed(1) + 's';
    dimText.textContent = origDim;
    resultSize.textContent = fmtBytes(blob.size);

    const baseName = (currentFile.name || 'image').replace(/\.[^./]+$/, '');
    downloadBtn.href = resultUrl;
    downloadBtn.download = (window.TayStudio && window.TayStudio.sanitizeFilename ? window.TayStudio.sanitizeFilename(baseName + '-no-bg.png') : baseName + '-no-bg.png');

    progressFill.style.width = '100%';
    if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 100);
    const modeName = effectiveMode === 'logo' ? '로고 모드' : 'AI 모델';
    const autoLabel = (mode === 'auto') ? '자동 → ' : '';
    progressText.textContent = '완료 ✓ (' + (ms / 1000).toFixed(1) + 's, ' + autoLabel + modeName + ')';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    if (myRun !== activeRun) return;
    progressText.textContent = '실패: ' + (e && e.message ? e.message : '알 수 없는 오류');
    progressFill.style.width = '0%';
    if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
    const msg = (e && e.message) ? e.message : '';
    alert('배경 제거 실패: ' + msg + '\n\n해결 시도:\n• 페이지 새로고침 후 다시 시도\n• 더 작은 이미지로 시도 (가로 1500px 이하)\n• 다른 브라우저(Chrome·Edge·Firefox 최신) 사용\n• 네트워크 점검 (사진 모드 첫 실행은 모델 다운로드 필요)');
  } finally {
    if (myRun === activeRun) activeRun = 0;
    cancelBtn.hidden = true;
    removeBtn.textContent = orig;
    removeBtn.disabled = !currentFile;
  }
}

function cancelRun() {
  if (activeRun === 0) return;
  activeRun = 0;
  cancelBtn.hidden = true;
  progressText.textContent = '취소됨 — 백그라운드 처리는 끝까지 진행되지만 결과는 무시됩니다. 메모리 누적 시 페이지 새로고침 권장.';
  removeBtn.disabled = !currentFile;
  alert('취소됨 — 백그라운드 처리는 끝까지 진행됩니다. 큰 파일이면 페이지 새로고침을 권장합니다.');
}

function clearAll() {
  currentFile = null;
  if (origUrl) { URL.revokeObjectURL(origUrl); origUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = '이미지를 드래그하거나 클릭해서 선택';
  origImg.removeAttribute('src');
  resultImg.removeAttribute('src');
  if (dropThumbnail) {
    dropThumbnail.removeAttribute('src');
    dropZone.classList.remove('has-file');
  }
  removeBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
  bgColorAutoDetected = null;
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
if (window.TayStudio && TayStudio.bindPasteImage) {
  TayStudio.bindPasteImage(files => { loadFile(files[0]); });
}
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

removeBtn.addEventListener('click', run);
cancelBtn.addEventListener('click', cancelRun);
clearBtn.addEventListener('click', clearAll);
