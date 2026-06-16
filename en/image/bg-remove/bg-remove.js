/**
 * Background Remover — 2 modes:
 *   1. Photo / People: @imgly/background-removal v1.7 ISNet ML model (AGPL/Commercial).
 *      - Model quality choice: quint8 (44MB) / fp16 (88MB) / fp32 (176MB)
 *   2. Logo / Graphic: canvas chroma key — pixel-level background color removal.
 *      - tolerance slider + auto-detect / manual background color
 *      - Accurate on white background + gray/black text/logos. Preserves anti-aliasing soft alpha.
 *
 * Last verified: 2026-06-01 (chroma key mode added)
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

// Mode / model UI
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
let bgColorAutoDetected = null;  // cache of the auto-detected background color

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function getMode() {
  return document.querySelector('input[name="mode"]:checked')?.value || 'auto';
}

/**
 * Auto-mode analysis — samples the 4 corners + center pixels of the uploaded image
 * to branch: white background + solid distribution → logo mode / otherwise → photo mode.
 *
 * Heuristic:
 *  - 4-corner average RGB > (235, 235, 235): white-background candidate
 *  - color variance between corners (max diff) < 25: solid / simple background
 *  - center pixel differs enough from corners (a subject is present)
 *  → all satisfied → 'logo' branch
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

      // 4-corner average color (background estimate)
      const cornerAvg = {
        r: (samples.tl.r + samples.tr.r + samples.bl.r + samples.br.r) / 4,
        g: (samples.tl.g + samples.tr.g + samples.bl.g + samples.br.g) / 4,
        b: (samples.tl.b + samples.tr.b + samples.bl.b + samples.br.b) / 4,
      };

      // color variance between corners
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

      // center vs corners — is a subject present
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
          ? `White + simple background detected (corner avg ${Math.round(cornerAvg.r)},${Math.round(cornerAvg.g)},${Math.round(cornerAvg.b)} · variance ${Math.round(maxDiff)})`
          : `Natural background (corner avg ${Math.round(cornerAvg.r)},${Math.round(cornerAvg.g)},${Math.round(cornerAvg.b)} · variance ${Math.round(maxDiff)})`
      });
    };
    img.onerror = () => resolve({ mode: 'photo', bgColor: { r: 255, g: 255, b: 255 }, reason: 'Analysis failed — falling back to photo mode' });
    img.src = url;
  });
}
function getQuality() {
  return document.querySelector('input[name="quality"]:checked')?.value || 'isnet_quint8';
}

// Mode / quality radio visual active toggle
modeRadios.forEach(r => r.addEventListener('change', () => {
  const mode = getMode();
  modeRadioLabels.forEach(l => l.classList.toggle('active', l.dataset.mode === mode));
  // Auto mode decides everything automatically → hide both quality and tolerance
  // Photo mode → show quality choice
  // Logo mode → show tolerance / background color
  photoOptions.classList.toggle('hidden', mode !== 'photo');
  logoOptions.classList.toggle('hidden', mode !== 'logo');
  // Auto-detect result is only shown in auto mode
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
  if (!currentFile) { alert('Please upload an image first.'); return; }
  autoDetectBackgroundColor(true);
});

// Average of the image's 4 corner regions → estimate background color (for chroma key)
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
  // average of 4 corner 8×8 pixel blocks
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
    // brief visual feedback
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
    if (key.startsWith('fetch:')) label = 'Downloading AI model';
    else if (key.startsWith('compute:')) label = 'Analyzing background';
    else if (key === 'starting') label = 'Preparing';
    else if (key === 'chroma') label = 'Color-based removal';
    else if (key === 'combine') label = 'Restoring gray text';
    else if (key === 'cleanup') label = 'Cleaning up white residue';
  }
  progressText.textContent = label + ' — ' + (Number.isFinite(pct) ? pct + '%' : '...');
}

function loadFile(file) {
  const imgExtRe = /\.(png|jpe?g|webp|bmp|gif|avif|tiff?)$/i;
  if (!file || !file.type.startsWith('image/') || !imgExtRe.test(file.name || '')) {
    alert('Please choose an image file (PNG, JPG, WebP, BMP, GIF, AVIF, TIFF).');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 30, 'Image')) return;
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

  // In auto mode — analyze right after upload → show recommended mode
  if (getMode() === 'auto') {
    autoDetectMode(file).then(({ mode, bgColor, reason }) => {
      const autoResult = document.getElementById('autoDetectResult');
      if (autoResult) {
        const modeLabel = mode === 'logo' ? '🎨 Logo mode' : '📷 Photo mode';
        autoResult.innerHTML = `<b>Auto-detected:</b> ${modeLabel} recommended · <span style="font-size:11.5px">${reason}</span>`;
        autoResult.style.display = 'block';
      }
      // In auto mode, prefill the background color if logo is used
      if (mode === 'logo' && bgColorPicker) {
        const hex = '#' + [bgColor.r, bgColor.g, bgColor.b].map(v => v.toString(16).padStart(2, '0')).join('');
        bgColorPicker.value = hex;
        bgColorAutoDetected = bgColor;
      }
    });
  }
}

/**
 * Chroma Key background removal — logo / graphic mode.
 *
 * Each pixel's RGB distance from the reference point (background color) sets a graded alpha:
 *   - distance ≤ 0          → alpha 0 (fully transparent)
 *   - distance ≥ tolerance  → alpha 255 (fully opaque)
 *   - in between            → linear interpolation
 *
 * distance = max(|R-bgR|, |G-bgG|, |B-bgB|)  (Chebyshev distance — natural for color perception)
 *
 * So on a white background (255,255,255), gray text (140,140,140) has distance=115 → alpha 255 preserved,
 * while an anti-aliased edge (220,220,220) has distance=35 → partial alpha.
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
        // very close to background color → fully transparent
        data[i + 3] = 0;
      } else if (dist < tol) {
        // edge (anti-aliasing) → linear alpha
        const ratio = (dist - tol * 0.4) / (tol - tol * 0.4);
        data[i + 3] = Math.round(ratio * 255);
      }
      // dist >= tol → keep alpha 255 (unchanged)
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
 * Hybrid post-processing of the ML result — force alpha 0 on white-background residue in the ISNet mask.
 *
 * Motivation:
 *  When the ISNet ML matting model judges part of a white background as "soft gray background" and
 *  outputs a graded (semi-transparent) alpha there, the user sees a white halo / bleed.
 *  Trust the ML mask, but force-remove pixels whose RGB is clearly near-white.
 *
 * Algorithm (3 stages):
 *  1. Fully white pixels (R,G,B ≥ threshold) → alpha 0
 *      · solid white (variance < 10) — almost certainly background
 *      · or graded-alpha (alpha < 255) white pixels — residue of the ML soft mask
 *  2. Near-white pixels (R,G,B ≥ threshold-25) with graded alpha → proportional attenuation
 *      · anti-aliased white edges (e.g. RGB 220 alpha 100) → attenuated to alpha 30
 *      · black / gray foreground anti-aliasing is unaffected (R < 215)
 *  3. Clear foreground (alpha 255, RGB < threshold) → preserved
 *
 * Result:
 *  - black text (R<50) preserved
 *  - gray text (R 100-180) preserved
 *  - people / clothing / detail (alpha 255) preserved
 *  - white-background residue (semi-transparent) all removed
 */
/**
 * ML + Chroma Key OR composite — restore gray/black text in white-background cases.
 *
 * Motivation:
 *  When the ISNet ML model misclassifies gray text (e.g. "AI-Readable Data") as "soft background"
 *  and zeroes its alpha, hybridWhiteCleanup cannot bring it back.
 *  Compositing with a chroma key of the original image keeps all gray/black foreground alive.
 *
 * Algorithm:
 *  1. Chroma key the original image (remove white background → keep all gray/black pixels)
 *  2. OR-composite the alpha of the ML result and the chroma key result:
 *      · final_alpha = max(ml_alpha, chroma_alpha)
 *      · final_RGB = original RGB (keep the original colors from chroma key)
 *  3. White background → both masks alpha 0 → clean transparent
 *     gray text → ML 0, chroma 255 → alpha 255 (restored!)
 *     ML-captured detail → ML 255, chroma 0/partial → alpha 255 preserved
 *
 * Safety:
 *  - white-clothing portrait → ML mask captures the person area at alpha 255 → white clothing preserved
 *  - photo with a non-white background → chroma key doesn't catch the background → ML result kept as-is
 *  - gray subtitle + white-background logo → both survive
 */
async function combineMlAndChromaKey(file, mlBlob, bgRGB, tolerance = 25) {
  // 1. Chroma key the original
  const chromaBlob = await chromaKey(file, bgRGB, tolerance);

  // 2. Composite the two results onto the same canvas
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
      // draw the ML result
      ctx.drawImage(mlImg, 0, 0);
      const mlData = ctx.getImageData(0, 0, w, h);
      // chroma key result on a separate canvas
      const crCanvas = document.createElement('canvas');
      crCanvas.width = w;
      crCanvas.height = h;
      const crCtx = crCanvas.getContext('2d', { willReadFrequently: true });
      crCtx.drawImage(crImg, 0, 0);
      const crData = crCtx.getImageData(0, 0, w, h);
      // OR composite
      const ml = mlData.data, cr = crData.data;
      const len = ml.length;
      for (let i = 0; i < len; i += 4) {
        const finalAlpha = Math.max(ml[i + 3], cr[i + 3]);
        // RGB is the original color (chroma key preserves the original)
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
      const nearWhite = threshold - 25;  // near-white threshold (245-25 = 220)
      let removed = 0, attenuated = 0;
      for (let i = 0; i < len; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a === 0) continue;
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

        // Stage 1: fully white pixels (including semi-transparent) — force alpha 0
        if (r >= threshold && g >= threshold && b >= threshold && maxDiff < 12) {
          data[i + 3] = 0;
          removed++;
          continue;
        }

        // Stage 2: near-white pixels + graded alpha — proportional attenuation (anti-aliased white edges)
        // black / gray foreground anti-aliasing is unaffected since R < 215
        if (a < 255 && r >= nearWhite && g >= nearWhite && b >= nearWhite && maxDiff < 15) {
          // how close RGB is to white as a ratio (220 → 0%, 245 → 100%)
          const minRGB = Math.min(r, g, b);
          const whiteness = Math.max(0, (minRGB - nearWhite) / (threshold - nearWhite));
          // the whiter it is, the more it is attenuated
          data[i + 3] = Math.round(a * (1 - whiteness));
          attenuated++;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blobOut) => {
        // return metadata alongside
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
  removeBtn.textContent = 'Processing...';
  setProgress('starting', 0, 1);
  const t0 = performance.now();

  const tempImg = new Image();
  tempImg.src = origUrl;
  await new Promise((r) => { tempImg.onload = r; tempImg.onerror = r; });
  const origDim = tempImg.naturalWidth + '×' + tempImg.naturalHeight;
  let mode = getMode();
  let effectiveMode = mode;

  // Auto mode — analyze, then decide the mode to actually apply
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
      // Photo mode — explicit photo uses the user's chosen quality; auto mode defaults to balanced (fp16)
      const quality = (mode === 'auto') ? 'isnet_fp16' : getQuality();
      blob = await removeBackground(currentFile, {
        model: quality,
        output: { format: 'image/png', quality: 0.9 },
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        progress: setProgress
      });

      // White-background case — restore gray text via ML + chroma key OR composite
      // applied when the auto-detected background color is whitish (chroma has negligible effect on other-color backgrounds)
      const bg = bgColorAutoDetected || hexToRgb(bgColorPicker.value);
      const isWhitishBg = bg.r > 220 && bg.g > 220 && bg.b > 220;
      if (isWhitishBg) {
        setProgress('combine', 0, 100);
        blob = await combineMlAndChromaKey(currentFile, blob, bg, 25);
        setProgress('combine', 100, 100);
      }

      // Extra cleanup — clear any white-pixel residue remaining after the composite
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
    const modeName = effectiveMode === 'logo' ? 'Logo mode' : 'AI model';
    const autoLabel = (mode === 'auto') ? 'Auto → ' : '';
    progressText.textContent = 'Done ✓ (' + (ms / 1000).toFixed(1) + 's, ' + autoLabel + modeName + ')';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    if (myRun !== activeRun) return;
    progressText.textContent = 'Failed: ' + (e && e.message ? e.message : 'unknown error');
    progressFill.style.width = '0%';
    if (progressFill.parentElement) progressFill.parentElement.setAttribute('aria-valuenow', 0);
    const msg = (e && e.message) ? e.message : '';
    alert('Background removal failed: ' + msg + '\n\nTry:\n• Refresh and retry\n• Use a smaller image (under 1500px wide)\n• Use a recent browser (Chrome / Edge / Firefox)\n• Check your network (the first photo-mode run downloads the model)');
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
  progressText.textContent = 'Cancelled — background processing runs to completion but the result is ignored. Reload the page if memory builds up.';
  removeBtn.disabled = !currentFile;
  alert('Cancelled — the background task keeps running to completion. Reloading the page is recommended for large files.');
}

function clearAll() {
  currentFile = null;
  if (origUrl) { URL.revokeObjectURL(origUrl); origUrl = null; }
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  fileInput.value = '';
  dropTitle.textContent = 'Drag an image here, or click to choose';
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
