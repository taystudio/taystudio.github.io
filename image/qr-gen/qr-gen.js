/**
 * QR 코드 생성 — qrcode-generator (kazuhikoarase, MIT) + canvas API.
 * 최종 검증: 2026-05-05
 *
 * 동작:
 *  1. 텍스트·Wi-Fi 입력 → 적절한 텍스트로 인코딩
 *  2. qrcode(0, level) → addData → make → 모듈 행렬
 *  3. canvas에 모듈 그림 + SVG 문자열 생성
 *  4. PNG는 toDataURL, SVG는 Blob URL → 다운로드
 *
 * 글로벌: window.qrcode (UMD)
 */

const tabs = document.querySelectorAll('.qr-type-tabs button');
const textPanel = document.getElementById('textPanel');
const wifiPanel = document.getElementById('wifiPanel');
const textIn = document.getElementById('textIn');
const wifiSsid = document.getElementById('wifiSsid');
const wifiPwd = document.getElementById('wifiPwd');
const wifiAuth = document.getElementById('wifiAuth');
const wifiHidden = document.getElementById('wifiHidden');
const ecLevel = document.getElementById('ecLevel');
const cellSizeIn = document.getElementById('cellSize');
const cellSizeValue = document.getElementById('cellSizeValue');
const genBtn = document.getElementById('genBtn');
const clearBtn = document.getElementById('clearBtn');
const result = document.getElementById('result');
const qrCanvas = document.getElementById('qrCanvas');
const qrVersion = document.getElementById('qrVersion');
const qrModules = document.getElementById('qrModules');
const qrLen = document.getElementById('qrLen');
const downloadPng = document.getElementById('downloadPng');
const downloadSvg = document.getElementById('downloadSvg');

let activeType = 'text';
let svgUrl = null;

function escapeWifi(s) {
  // QR Wi-Fi 형식에서 \ ; , : " 는 \ 로 escape
  return String(s).replace(/([\\;,:"])/g, '\\$1');
}

function buildPayload() {
  if (activeType === 'wifi') {
    const ssid = (wifiSsid.value || '').trim();
    if (!ssid) return null;
    const auth = wifiAuth.value;
    const pwd = (wifiPwd.value || '').trim();
    const hidden = wifiHidden.checked ? 'H:true;' : '';
    if (auth === 'nopass') {
      return 'WIFI:T:nopass;S:' + escapeWifi(ssid) + ';' + hidden + ';';
    }
    return 'WIFI:T:' + auth + ';S:' + escapeWifi(ssid) + ';P:' + escapeWifi(pwd) + ';' + hidden + ';';
  }
  return (textIn.value || '').trim();
}

function drawCanvas(qr, cellSize, margin) {
  const count = qr.getModuleCount();
  const total = count + margin * 2;
  qrCanvas.width = total * cellSize;
  qrCanvas.height = total * cellSize;
  const ctx = qrCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize, cellSize);
      }
    }
  }
}

function makeSvg(qr, cellSize, margin) {
  const count = qr.getModuleCount();
  const total = count + margin * 2;
  const sz = total * cellSize;
  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        rects += '<rect x="' + ((c + margin) * cellSize) + '" y="' + ((r + margin) * cellSize) + '" width="' + cellSize + '" height="' + cellSize + '"/>';
      }
    }
  }
  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + sz + '" height="' + sz + '" viewBox="0 0 ' + sz + ' ' + sz + '" shape-rendering="crispEdges">' +
    '<rect width="' + sz + '" height="' + sz + '" fill="#ffffff"/>' +
    '<g fill="#000000">' + rects + '</g>' +
    '</svg>';
}

function generate() {
  const payload = buildPayload();
  if (!payload) {
    alert(activeType === 'wifi' ? 'Wi-Fi 이름(SSID)을 입력하세요.' : '텍스트나 URL을 입력하세요.');
    return;
  }
  const cellSize = parseInt(cellSizeIn.value, 10);
  const margin = 4;
  const level = ecLevel.value;

  let qr;
  try {
    qr = window.qrcode(0, level);
    qr.addData(payload);
    qr.make();
  } catch (e) {
    alert('인코딩 실패: ' + (e && e.message ? e.message : '입력이 너무 길거나 부적합합니다.'));
    return;
  }

  drawCanvas(qr, cellSize, margin);

  qrVersion.textContent = 'v' + (Math.round((qr.getModuleCount() - 21) / 4) + 1);
  qrModules.textContent = qr.getModuleCount() + '×' + qr.getModuleCount();
  qrLen.textContent = payload.length + '자';

  // PNG
  const pngUrl = qrCanvas.toDataURL('image/png');
  downloadPng.href = pngUrl;
  const baseName = activeType === 'wifi' ? 'wifi-qr' : 'qrcode';
  downloadPng.download = baseName + '.png';

  // SVG
  const svgText = makeSvg(qr, cellSize, margin);
  if (svgUrl) URL.revokeObjectURL(svgUrl);
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  svgUrl = URL.createObjectURL(blob);
  downloadSvg.href = svgUrl;
  downloadSvg.download = baseName + '.svg';

  result.hidden = false;
}

function clearAll() {
  textIn.value = '';
  wifiSsid.value = '';
  wifiPwd.value = '';
  wifiHidden.checked = false;
  if (svgUrl) { URL.revokeObjectURL(svgUrl); svgUrl = null; }
  result.hidden = true;
}

function setType(type) {
  activeType = type;
  tabs.forEach((b) => b.classList.toggle('active', b.dataset.type === type));
  textPanel.hidden = (type !== 'text');
  wifiPanel.hidden = (type !== 'wifi');
}

tabs.forEach((b) => b.addEventListener('click', () => setType(b.dataset.type)));
cellSizeIn.addEventListener('input', () => {
  cellSizeValue.textContent = cellSizeIn.value;
});
genBtn.addEventListener('click', generate);
clearBtn.addEventListener('click', clearAll);

// Enter 키로 생성
[textIn, wifiSsid, wifiPwd].forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); generate(); }
  });
});
