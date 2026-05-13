/**
 * QR 코드 인식 — jsQR (Cosmo Wolfe, Apache-2.0).
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. 이미지 업로드: <img>로 디코딩 → canvas에 그림 → getImageData → jsQR
 *  2. 카메라: getUserMedia → <video> → requestVideoFrameCallback or rAF 루프 → canvas → jsQR
 *  3. 결과 텍스트의 패턴(http/tel/mailto/WIFI/geo)에 따라 유형 분류
 *
 * 글로벌: window.jsQR
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
  if (/^tel:/i.test(text))        return { label: '전화번호', openable: true, href: text };
  if (/^sms:/i.test(text))        return { label: 'SMS', openable: true, href: text };
  if (/^mailto:/i.test(text))     return { label: '이메일', openable: true, href: text };
  if (/^WIFI:/i.test(text))       return { label: 'Wi-Fi', openable: false };
  if (/^geo:/i.test(text))        return { label: '지도', openable: true, href: text };
  return { label: '텍스트', openable: false };
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
  scanType.textContent = '실패';
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
    alert('이미지 파일만 선택해주세요.');
    return;
  }
  if (window.TayStudio && window.TayStudio.checkFileSize && !window.TayStudio.checkFileSize(file, 20, '이미지')) return;
  dropTitle.textContent = file.name;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const text = decodeFromImage(img);
    URL.revokeObjectURL(url);
    if (text) showResult(text);
    else showError('QR 코드를 인식하지 못했습니다. 더 선명한 이미지로 다시 시도하세요.');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    showError('이미지를 디코딩할 수 없습니다.');
  };
  img.src = url;
}

// 이미지 모드 이벤트
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

// 카메라 모드
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('이 브라우저는 카메라 접근을 지원하지 않습니다.');
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
    alert('카메라 접근 실패: ' + (e.message || '권한 거부 또는 기기 미지원'));
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
    // 일부 브라우저에서 video 첫 프레임이 비어 SecurityError 가능 — 다음 프레임 재시도
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

// 탭 전환
function setMode(mode) {
  currentMode = mode;
  tabs.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  imagePanel.hidden = (mode !== 'image');
  cameraPanel.hidden = (mode !== 'camera');
  if (mode !== 'camera') stopCamera();
}
tabs.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

// 페이지 떠날 때 스트림 정리
window.addEventListener('pagehide', stopCamera);
window.addEventListener('beforeunload', stopCamera);

// 결과 액션
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(scanContent.textContent);
    const orig = copyBtn.textContent;
    copyBtn.textContent = '✓ 복사됨';
    setTimeout(() => { copyBtn.textContent = orig; }, 1500);
  } catch {
    alert('복사 실패. 길게 눌러서 직접 복사하세요.');
  }
});
