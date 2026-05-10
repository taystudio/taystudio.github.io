/**
 * QR Code Scanner — jsQR (Cosmo Wolfe, Apache-2.0).
 * Last verified: 2026-05-09
 *
 * Flow:
 *  1. Image upload: <img> decoded → drawn onto canvas → getImageData → jsQR
 *  2. Camera: getUserMedia → <video> → requestVideoFrameCallback or rAF loop → canvas → jsQR
 *  3. Result text classified by prefix (http / tel / mailto / WIFI / geo)
 *
 * Globals: window.jsQR
 */

const tabs = document.querySelectorAll('.scan-tabs button');
const imagePanel = document.getElementById('imagePanel');
const cameraPanel = document.getElementById('cameraPanel');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropTitle = document.getElementById('dropTitle');
const video = document.getElementById('video');
const startCam = document.getElementById('startCam');
const stopCam = document.getElementById('stopCam');
const result = document.getElementById('result');
const scanResult = document.getElementById('scanResult');
const scanType = document.getElementById('scanType');
const scanContent = document.getElementById('scanContent');
const copyBtn = document.getElementById('copyBtn');
const openBtn = document.getElementById('openBtn');

let currentMode = 'image';
let stream = null;
let scanLoopId = null;

function classify(text) {
  if (/^https?:\/\//i.test(text)) return { label: 'URL', openable: true, href: text };
  if (/^tel:/i.test(text))        return { label: 'Phone', openable: true, href: text };
  if (/^sms:/i.test(text))        return { label: 'SMS', openable: true, href: text };
  if (/^mailto:/i.test(text))     return { label: 'Email', openable: true, href: text };
  if (/^WIFI:/i.test(text))       return { label: 'Wi-Fi', openable: false };
  if (/^geo:/i.test(text))        return { label: 'Map', openable: true, href: text };
  return { label: 'Text', openable: false };
}

function showResult(text) {
  scanContent.textContent = text;
  const cls = classify(text);
  scanType.textContent = cls.label;
  scanResult.classList.remove('error');
  if (cls.openable && cls.href) {
    openBtn.href = cls.href;
    openBtn.style.display = '';
  } else {
    openBtn.removeAttribute('href');
    openBtn.style.display = 'none';
  }
  result.hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showError(msg) {
  scanType.textContent = 'Failed';
  scanContent.textContent = msg;
  scanResult.classList.add('error');
  openBtn.style.display = 'none';
  result.hidden = false;
}

function decodeImageData(imageData) {
  if (!window.jsQR) return null;
  return window.jsQR(imageData.data, imageData.width, imageData.height);
}

function decodeFromImage(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = decodeImageData(data);
  return code ? code.data : null;
}

function loadImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    return;
  }
  dropTitle.textContent = file.name;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const text = decodeFromImage(img);
    URL.revokeObjectURL(url);
    if (text) showResult(text);
    else showError('Could not detect a QR code. Try a clearer image.');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    showError('Could not decode this image.');
  };
  img.src = url;
}

// Image-mode events
fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) loadImageFile(f);
});
['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', (e) => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadImageFile(f);
});

// Camera mode
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('This browser does not support camera access.');
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    startCam.disabled = true;
    stopCam.disabled = false;
    scanLoop();
  } catch (e) {
    alert('Camera access failed: ' + (e.message || 'permission denied or device not supported'));
  }
}

function stopCamera() {
  if (scanLoopId) {
    cancelAnimationFrame(scanLoopId);
    scanLoopId = null;
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.srcObject = null;
  startCam.disabled = false;
  stopCam.disabled = true;
}

const scanCanvas = document.createElement('canvas');
const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });

function scanLoop() {
  if (!stream || video.readyState !== video.HAVE_ENOUGH_DATA) {
    scanLoopId = requestAnimationFrame(scanLoop);
    return;
  }
  scanCanvas.width = video.videoWidth;
  scanCanvas.height = video.videoHeight;
  scanCtx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);
  let data;
  try {
    data = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
  } catch (e) {
    // Some browsers throw SecurityError on the very first empty video frame — retry next frame.
    scanLoopId = requestAnimationFrame(scanLoop);
    return;
  }
  const code = decodeImageData(data);
  if (code && code.data) {
    showResult(code.data);
    stopCamera();
    return;
  }
  scanLoopId = requestAnimationFrame(scanLoop);
}

startCam.addEventListener('click', startCamera);
stopCam.addEventListener('click', stopCamera);

// Tab switch
function setMode(mode) {
  currentMode = mode;
  tabs.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  imagePanel.hidden = (mode !== 'image');
  cameraPanel.hidden = (mode !== 'camera');
  if (mode !== 'camera') stopCamera();
}
tabs.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

// Tear down stream on page leave
window.addEventListener('pagehide', stopCamera);
window.addEventListener('beforeunload', stopCamera);

// Result actions
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(scanContent.textContent);
    const orig = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied';
    setTimeout(() => { copyBtn.textContent = orig; }, 1500);
  } catch {
    alert('Copy failed. Long-press to copy manually.');
  }
});
