/**
 * QR Code Generator — qrcode-generator (kazuhikoarase, MIT) + canvas API.
 * Last verified: 2026-05-09
 *
 * Flow:
 *  1. Encode user input (text or Wi-Fi credentials) to a QR-friendly string
 *  2. qrcode(0, level) → addData → make → module matrix
 *  3. Render to canvas + build SVG markup
 *  4. PNG via toDataURL, SVG via Blob URL → download links
 *
 * Globals: window.qrcode (UMD)
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
  // QR Wi-Fi format: \ ; , : " must be escaped with backslash
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
    alert(activeType === 'wifi' ? 'Please enter the Wi-Fi name (SSID).' : 'Please enter text or a URL.');
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
    alert('Encoding failed: ' + (e && e.message ? e.message : 'input is too long or invalid.'));
    return;
  }

  drawCanvas(qr, cellSize, margin);

  qrVersion.textContent = 'v' + (Math.round((qr.getModuleCount() - 21) / 4) + 1);
  qrModules.textContent = qr.getModuleCount() + '×' + qr.getModuleCount();
  qrLen.textContent = payload.length + ' chars';

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

// Enter key triggers generate
[textIn, wifiSsid, wifiPwd].forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); generate(); }
  });
});
