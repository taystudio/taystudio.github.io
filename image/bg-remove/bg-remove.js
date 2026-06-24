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

/* ===================== 배경 제거 AI 엔진 어댑터 =====================
 * 사진·인물 모드의 AI 누끼 엔진을 교체 가능하게 추상화.
 * 전환은 아래 ACTIVE_AI_ENGINE 한 줄만 바꾸면 됨.
 *
 *   'mediapipe' — MediaPipe Selfie Segmenter (Apache-2.0, 인물 전용). 기본.
 *   'imgly'     — @imgly/background-removal (AGPL-3.0/Commercial, 범용). 레거시.
 *
 * 두 엔진 모두 lazy 로드 — 선택된 엔진의 코드·모델만 내려받음.
 * (로고·그래픽은 별도 chroma key 경로라 이 어댑터와 무관)
 * ================================================================= */
const ACTIVE_AI_ENGINE = 'mediapipe';

// --- MediaPipe Selfie Segmenter (Apache-2.0 코드+가중치, 인물 전용) ---
let _mpSegmenter = null;
async function mpLoadSegmenter(progress) {
  if (_mpSegmenter) return _mpSegmenter;
  progress && progress('fetch:mediapipe', 10, 100);
  const VER = '0.10.18';
  const { ImageSegmenter, FilesetResolver } = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}`);
  const vision = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`);
  _mpSegmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite' },
    runningMode: 'IMAGE',
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  });
  progress && progress('fetch:mediapipe', 100, 100);
  return _mpSegmenter;
}

const AI_ENGINES = {
  mediapipe: {
    label: 'MediaPipe Selfie (Apache-2.0)',
    async remove(file, { progress } = {}) {
      const seg = await mpLoadSegmenter(progress);
      progress && progress('compute:mediapipe', 30, 100);
      const bitmap = await createImageBitmap(file);
      const w = bitmap.width, h = bitmap.height;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const res = seg.segment(canvas);
      const mask = res && res.confidenceMasks && res.confidenceMasks[0];
      if (!mask) { bitmap.close && bitmap.close(); throw new Error('MediaPipe 마스크 생성 실패'); }
      const mf = mask.getAsFloat32Array();        // 픽셀별 전경(인물) 확률 0~1
      const mw = mask.width, mh = mask.height;
      const data = imgData.data;
      for (let y = 0; y < h; y++) {
        const my = Math.min(mh - 1, (y * mh / h) | 0);
        for (let x = 0; x < w; x++) {
          const mx = Math.min(mw - 1, (x * mw / w) | 0);
          let p = mf[my * mw + mx];
          if (p < 0) p = 0; else if (p > 1) p = 1;
          data[((y * w + x) << 2) + 3] = (p * 255) | 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      mask.close && mask.close();
      res.close && res.close();
      bitmap.close && bitmap.close();
      progress && progress('compute:mediapipe', 100, 100);
      return await new Promise(r => canvas.toBlob(r, 'image/png'));
    }
  },
  imgly: {
    label: '@imgly/background-removal (AGPL)',
    async remove(file, { quality, progress } = {}) {
      const { removeBackground } = await import('/image/vendor/imgly-bg-remove.mjs?v=2026-05-22b');
      return await removeBackground(file, {
        model: quality || 'isnet_fp16',
        output: { format: 'image/png', quality: 0.9 },
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        progress
      });
    }
  }
};

async function aiRemoveBackground(file, opts) {
  const engine = AI_ENGINES[ACTIVE_AI_ENGINE] || AI_ENGINES.mediapipe;
  return engine.remove(file, opts || {});
}

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
    else if (key === 'combine') label = '회색 텍스트 복원 합성';
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
 * ML 결과 hybrid 후처리 — ISNet 마스크의 흰 배경 잔여를 강제 알파 0.
 *
 * 동기:
 *  ISNet ML matting 모델이 흰 배경 일부를 "회색 부드러운 배경" 등으로 판단해
 *  결과를 점진 알파(semi-transparent)로 출력하면 사용자에게 흰 번짐(halo) 으로 보임.
 *  ML 마스크는 신뢰하되 RGB가 명확히 흰색에 가까운 픽셀은 강제 제거.
 *
 * 알고리즘 (3 단계):
 *  1. 완전 흰 픽셀 (R,G,B ≥ threshold) 모두 → alpha 0
 *      · 단색 흰색 (분산 < 10) — 배경 거의 확실
 *      · 또는 점진 알파 (alpha < 255) 인 흰 픽셀 — ML 의 soft mask 잔여
 *  2. 거의 흰 픽셀 (R,G,B ≥ threshold-25) 중 점진 알파 → 알파 비례 감쇠
 *      · 안티에일리어싱 흰 가장자리 (예: RGB 220 alpha 100) → 알파 30 으로 감쇠
 *      · 검은·회색 전경 안티에일리어싱은 영향 없음 (R < 215)
 *  3. 명확한 전경 (alpha 255, RGB < threshold) → 보존
 *
 * 결과:
 *  - 검은 텍스트(R<50) 보존
 *  - 회색 텍스트(R 100-180) 보존
 *  - 인물·옷·디테일 (alpha 255) 보존
 *  - 흰 배경 잔여(semi-transparent) 모두 제거
 */
/**
 * ML + Chroma Key OR 합성 — 흰 배경 케이스에서 회색·검은 텍스트 복원.
 *
 * 동기:
 *  ISNet ML 모델이 회색 텍스트(예: "AI-Readable Data") 를 "부드러운 배경" 으로
 *  오분류해 알파 0 만들면 hybridWhiteCleanup 으로는 복원 불가.
 *  원본 이미지의 chroma key 결과와 합성하면 회색·검은 전경이 모두 살아남음.
 *
 * 알고리즘:
 *  1. 원본 이미지에 chroma key 처리 (흰 배경 제거 → 회색·검은 픽셀 모두 보존)
 *  2. ML 결과와 chroma key 결과의 알파 OR 합성:
 *      · final_alpha = max(ml_alpha, chroma_alpha)
 *      · final_RGB = 원본 RGB (chroma key 의 원본 색상 유지)
 *  3. 흰 배경은 두 마스크 모두 알파 0 → 깨끗 투명
 *     회색 텍스트는 ML 0, chroma 255 → 알파 255 (복원!)
 *     ML 잡은 디테일은 ML 255, chroma 0/일부 → 알파 255 유지
 *
 * 안전성:
 *  - 흰 옷 인물 사진 → ML 마스크가 사람 영역 알파 255 잡음 → 흰 옷 보존
 *  - 다른 색 배경 사진 → chroma key 가 흰 배경 안 잡음 → ML 결과 그대로
 *  - 회색 부제 + 흰 배경 로고 → 둘 다 살아남음
 */
async function combineMlAndChromaKey(file, mlBlob, bgRGB, tolerance = 25) {
  // 1. 원본에 chroma key 처리
  const chromaBlob = await chromaKey(file, bgRGB, tolerance);

  // 2. 두 결과를 동일 캔버스에 합성
  return new Promise((resolve) => {
    const mlImg = new Image();
    const crImg = new Image();
    const mlUrl = URL.createObjectURL(mlBlob);
    const crUrl = URL.createObjectURL(chromaBlob);
    let loaded = 0;
    function onload() {
      loaded++;
      if (loaded < 2) return;
      const w = mlImg.naturalWidth, h = mlImg.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      // ML 결과 그리기
      ctx.drawImage(mlImg, 0, 0);
      const mlData = ctx.getImageData(0, 0, w, h);
      // Chroma key 결과 별도 캔버스
      const crCanvas = document.createElement('canvas');
      crCanvas.width = w;
      crCanvas.height = h;
      const crCtx = crCanvas.getContext('2d', { willReadFrequently: true });
      crCtx.drawImage(crImg, 0, 0);
      const crData = crCtx.getImageData(0, 0, w, h);
      // OR 합성
      const ml = mlData.data, cr = crData.data;
      const len = ml.length;
      for (let i = 0; i < len; i += 4) {
        const finalAlpha = Math.max(ml[i + 3], cr[i + 3]);
        // RGB 는 원본 색상 (chroma key 가 원본 보존)
        ml[i] = cr[i];
        ml[i + 1] = cr[i + 1];
        ml[i + 2] = cr[i + 2];
        ml[i + 3] = finalAlpha;
      }
      ctx.putImageData(mlData, 0, 0);
      URL.revokeObjectURL(mlUrl);
      URL.revokeObjectURL(crUrl);
      canvas.toBlob((b) => resolve(b), 'image/png');
    }
    mlImg.onload = onload;
    crImg.onload = onload;
    mlImg.onerror = () => resolve(mlBlob);
    crImg.onerror = () => resolve(mlBlob);
    mlImg.src = mlUrl;
    crImg.src = crUrl;
  });
}

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
      const nearWhite = threshold - 25;  // 거의 흰색 임계 (245-25 = 220)
      let removed = 0, attenuated = 0;
      for (let i = 0; i < len; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a === 0) continue;
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

        // Stage 1: 완전 흰 픽셀 (semi-transparent 포함) — 강제 알파 0
        if (r >= threshold && g >= threshold && b >= threshold && maxDiff < 12) {
          data[i + 3] = 0;
          removed++;
          continue;
        }

        // Stage 2: 거의 흰 픽셀 + 점진 알파 — 비례 감쇠 (안티에일리어싱 흰 가장자리)
        // 검은·회색 전경 안티에일리어싱은 R < 215 라 영향 X
        if (a < 255 && r >= nearWhite && g >= nearWhite && b >= nearWhite && maxDiff < 15) {
          // RGB 가 흰색에 얼마나 가까운지 비율 (220 → 0%, 245 → 100%)
          const minRGB = Math.min(r, g, b);
          const whiteness = Math.max(0, (minRGB - nearWhite) / (threshold - nearWhite));
          // 흰색일수록 더 많이 감쇠
          data[i + 3] = Math.round(a * (1 - whiteness));
          attenuated++;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blobOut) => {
        // 메타데이터 함께 반환
        if (blobOut) blobOut._cleanup = { removed, attenuated };
        resolve(blobOut);
      }, 'image/png');
    };
    img.onerror = () => resolve(blob);
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
      blob = await aiRemoveBackground(currentFile, { quality, progress: setProgress });

      // 흰 배경 케이스 — ML + chroma key OR 합성으로 회색 텍스트 복원
      // 자동 감지된 배경색이 흰색 계열이면 적용 (다른 색 배경 사진은 chroma 영향 미미)
      const bg = bgColorAutoDetected || hexToRgb(bgColorPicker.value);
      const isWhitishBg = bg.r > 220 && bg.g > 220 && bg.b > 220;
      if (isWhitishBg) {
        setProgress('combine', 0, 100);
        blob = await combineMlAndChromaKey(currentFile, blob, bg, 25);
        setProgress('combine', 100, 100);
      }

      // 추가 cleanup — 합성 후에도 남는 흰 픽셀 잔여 정리
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
