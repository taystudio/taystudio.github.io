(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const isEn = location.pathname.indexOf('/en/') === 0;
  const T = isEn ? {
    copied: 'Copied',
    invalidHex: 'Invalid Hex (use #RRGGBB)',
    invalidFile: 'Image file required',
    pass: '',
  } : {
    copied: '복사됨',
    invalidHex: '올바른 Hex 형식 아님 (#RRGGBB)',
    invalidFile: '이미지 파일만 가능합니다',
    pass: '',
  };

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }
  function rgbToCmyk(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const k = 1 - Math.max(r, g, b);
    if (k === 1) return [0, 0, 0, 100];
    return [
      Math.round((1 - r - k) / (1 - k) * 100),
      Math.round((1 - g - k) / (1 - k) * 100),
      Math.round((1 - b - k) / (1 - k) * 100),
      Math.round(k * 100),
    ];
  }
  function luminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function contrast(rgb1, rgb2) {
    const l1 = luminance(...rgb1), l2 = luminance(...rgb2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function gradeOf(c) {
    if (c >= 7) return { label: 'AAA', cls: 'pass' };
    if (c >= 4.5) return { label: 'AA', cls: 'pass' };
    if (c >= 3) return { label: 'AA Large', cls: 'pass' };
    return { label: 'Fail', cls: 'fail' };
  }

  function showToast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 1200);
  }
  function copy(s) {
    if (!navigator.clipboard) {
      const ta = document.createElement('textarea');
      ta.value = s; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    } else {
      navigator.clipboard.writeText(s);
    }
    showToast(T.copied + ': ' + s);
  }

  function render() {
    const hex = $('picker').value;
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    const [r, g, b] = rgb;
    const hsl = rgbToHsl(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);
    const codes = [
      ['HEX', hex.toUpperCase()],
      ['RGB', `rgb(${r}, ${g}, ${b})`],
      ['HSL', `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`],
      ['CMYK', `${cmyk[0]}, ${cmyk[1]}, ${cmyk[2]}, ${cmyk[3]}`],
    ];
    $('codes').innerHTML = codes.map(([l, v]) =>
      `<div class="cp-code" data-val="${v.replace(/"/g, '&quot;')}" role="button" tabindex="0" aria-label="${l} ${v} 복사">
        <div class="cp-code-label">${l}</div>
        <div class="cp-code-val">${v}</div>
      </div>`
    ).join('');
    document.querySelectorAll('.cp-code').forEach(el => {
      const v = el.dataset.val;
      el.addEventListener('click', () => copy(v));
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(v); } });
    });

    const hexEl = $('hexInput');
    if (hexEl && hexEl.value.toUpperCase() !== hex.toUpperCase()) hexEl.value = hex.toUpperCase();

    const cw = contrast(rgb, [255, 255, 255]);
    const cb = contrast(rgb, [0, 0, 0]);
    const gw = gradeOf(cw), gb = gradeOf(cb);
    $('cWhiteVal').innerHTML = `${cw.toFixed(2)}<span class="cp-grade ${gw.cls}">${gw.label}</span>`;
    $('cBlackVal').innerHTML = `${cb.toFixed(2)}<span class="cp-grade ${gb.cls}">${gb.label}</span>`;
  }

  $('picker').addEventListener('input', render);
  $('hexInput').addEventListener('input', e => {
    let v = e.target.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    const rgb = hexToRgb(v);
    if (rgb) {
      $('picker').value = rgbToHex(...rgb).toLowerCase();
      render();
    }
  });
  $('hexInput').addEventListener('blur', e => {
    const rgb = hexToRgb(e.target.value);
    if (!rgb) {
      showToast(T.invalidHex);
      e.target.value = $('picker').value.toUpperCase();
    } else {
      e.target.value = rgbToHex(...rgb);
    }
  });

  // 이미지 팔레트 추출 — 2단계 슬롯 방식.
  // 단순 빈도·채도 가중치로는 작은 vivid 영역 (예: 로고) 이 큰 회색 영역에 압도되어 손실.
  // 해결: ① vivid 색 (채도 > 0.4) 강제 4 슬롯 ② 나머지 4 슬롯은 일반 점수 + 다양성 필터.
  function extractPalette(img) {
    const c = document.createElement('canvas');
    const size = 150;
    c.width = size; c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, size, size);
    let data;
    try {
      data = ctx.getImageData(0, 0, size, size).data;
    } catch (e) {
      console.error('canvas tainted', e);
      return [];
    }
    const bins = {};
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      // 64단계 양자화 (6비트) — vivid 색이 회색 bin 에 흡수되지 않게 더 fine
      const r = data[i] >> 2, g = data[i + 1] >> 2, b = data[i + 2] >> 2;
      const key = `${r},${g},${b}`;
      if (!bins[key]) bins[key] = { n: 0, r: 0, g: 0, b: 0 };
      bins[key].n++;
      bins[key].r += data[i]; bins[key].g += data[i + 1]; bins[key].b += data[i + 2];
    }
    // 각 bin → 평균 색 + 채도
    const items = Object.values(bins).map(b => {
      const ar = Math.round(b.r / b.n);
      const ag = Math.round(b.g / b.n);
      const ab = Math.round(b.b / b.n);
      const mx = Math.max(ar, ag, ab);
      const mn = Math.min(ar, ag, ab);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;  // 0~1
      return { rgb: [ar, ag, ab], n: b.n, sat };
    });

    // 다양성 필터 — 추출된 색과 RGB 유클리드 거리 < MIN_DIST 인 색 skip
    const MIN_DIST = 42;
    function tooClose(rgb, list) {
      return list.some(r => {
        const dr = r[0] - rgb[0], dg = r[1] - rgb[1], db = r[2] - rgb[2];
        return (dr * dr + dg * dg + db * db) < MIN_DIST * MIN_DIST;
      });
    }

    const result = [];

    // 1단계: vivid 색 (채도 > 0.4) 빈도 순 → 최대 4개 강제 슬롯
    // 작은 영역의 vivid 색 (로고·강조) 이 무조건 살아남게 보장
    const VIVID_THRESHOLD = 0.4;
    const VIVID_SLOTS = 4;
    const MIN_PIXELS = 3;  // 노이즈 1-2 픽셀짜리 색 차단
    const vivid = items
      .filter(it => it.sat > VIVID_THRESHOLD && it.n >= MIN_PIXELS)
      .sort((a, b) => b.n - a.n);
    for (const it of vivid) {
      if (result.length >= VIVID_SLOTS) break;
      if (!tooClose(it.rgb, result)) result.push(it.rgb);
    }

    // 2단계: 나머지 슬롯 — 모든 bin 의 일반 점수 (빈도 + 채도) + 다양성 필터
    const scored = items
      .map(it => ({ ...it, score: it.n * (1 + it.sat * 1.5) }))
      .sort((a, b) => b.score - a.score);
    for (const it of scored) {
      if (result.length >= 8) break;
      if (!tooClose(it.rgb, result)) result.push(it.rgb);
    }

    // fallback: 8개 못 채우면 점수 순으로 다양성 무시 채움
    if (result.length < 8) {
      for (const it of scored) {
        if (result.length >= 8) break;
        if (!result.some(r => r[0] === it.rgb[0] && r[1] === it.rgb[1] && r[2] === it.rgb[2])) {
          result.push(it.rgb);
        }
      }
    }
    return result;
  }
  function renderPalette(colors) {
    const pal = $('palette');
    pal.innerHTML = colors.map(([r, g, b]) => {
      const hex = rgbToHex(r, g, b);
      return `<div class="cp-swatch" style="background:${hex};" data-hex="${hex.toLowerCase()}" role="button" tabindex="0" aria-label="색상 ${hex} 적용">
        <div class="cp-swatch-label">${hex}</div>
      </div>`;
    }).join('');
    pal.querySelectorAll('.cp-swatch').forEach(sw => {
      const apply = () => { $('picker').value = sw.dataset.hex; render(); };
      sw.addEventListener('click', apply);
      sw.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(); } });
    });
  }
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast(T.invalidFile); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const pv = $('preview');
        pv.src = img.src;
        pv.style.display = 'block';
        renderPalette(extractPalette(img));
      };
      img.onerror = () => showToast(T.invalidFile);
      img.src = e.target.result;
    };
    reader.onerror = () => showToast(T.invalidFile);
    reader.readAsDataURL(file);
  }
  const drop = $('drop'), fileEl = $('file');
  // NOTE: <label> 이라 클릭 → input 자동 trigger 됨. JS click handler 추가하면 double trigger 로 다이얼로그가 다시 열림.
  // → click handler 는 제거하고 keydown 만 수동 처리 (label 은 Enter/Space 기본 동작 X).
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileEl.click(); } });
  fileEl.addEventListener('change', e => handleFile(e.target.files[0]));
  ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });

  render();
})();
