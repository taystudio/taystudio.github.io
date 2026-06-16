/**
 * 모니터 PPI·시야거리 계산기 + 사용 목적별 추천
 * 최종 검증: 2026-05-09
 *
 * 계산 근거
 * - PPI = √(w² + h²) / 대각선(인치)
 * - 권장 시야거리 = 화면 높이 × 1.5(영상·게임) ~ 2.0(작업·생산성)
 *   (ITU-R BT.500·BT.2022 권고: 4K는 화면 높이 1.5 내 거리에서 변별 가능)
 * - 4K 가시 임계 = ~27인치 (24인치 미만은 OS scaling 100% 사용 시 글자 너무 작음)
 * - 픽셀 피치 = 25.4 / PPI (mm)
 *
 * 출처
 * - ITU-R BT.500-15 / BT.2022 (시야거리 권고)
 * - Apple "Retina" PPI 정의 (2010~)
 * - DisplayMate / RTINGS PPI tier 분류 가이드
 */

// 해상도 프리셋 (가로 × 세로 픽셀)
const RESOLUTIONS = {
  "fhd":     { label: "FHD 1920×1080 (16:9)",         w: 1920, h: 1080 },
  "qhd":     { label: "QHD 2560×1440 (16:9)",         w: 2560, h: 1440 },
  "uhd":     { label: "4K UHD 3840×2160 (16:9)",      w: 3840, h: 2160 },
  "uwfhd":   { label: "UWFHD 2560×1080 (21:9)",       w: 2560, h: 1080 },
  "uwqhd":   { label: "UWQHD 3440×1440 (21:9)",       w: 3440, h: 1440 },
  "uw4k":    { label: "UW4K 5120×2160 (21:9)",        w: 5120, h: 2160 },
  "5k":      { label: "5K 5120×2880 (16:9)",          w: 5120, h: 2880 },
  "8k":      { label: "8K UHD 7680×4320 (16:9)",      w: 7680, h: 4320 },
  "wuxga":   { label: "WUXGA 1920×1200 (16:10)",      w: 1920, h: 1200 },
  "wqxga":   { label: "WQXGA 2560×1600 (16:10)",      w: 2560, h: 1600 },
  "custom":  { label: "직접 입력", w: 0, h: 0 },
};

// PPI tier 분류 (눈에 보이는 거침 정도, 60cm 시청 거리 기준)
function ppiTier(ppi) {
  if (ppi < 90)  return { name: "거침",      hint: "픽셀이 또렷이 보임. 글자 가장자리 계단 현상. 일반 사무용 한계 수준" };
  if (ppi < 110) return { name: "일반",      hint: "FHD 27인치·32인치 영역. 무난하지만 텍스트 정밀 작업엔 살짝 거침" };
  if (ppi < 140) return { name: "좋음",      hint: "QHD 24~27인치 영역. 텍스트·디자인·일반 작업 모두 적합한 표준 영역" };
  if (ppi < 180) return { name: "고밀도",    hint: "4K 27~32인치 영역. 글자 매끄럽고 영상 디테일 또렷함. 영상 편집·디자인 권장" };
  if (ppi < 220) return { name: "초고밀도",  hint: "5K 27인치·4K 24인치 영역. macOS Retina급 픽셀 인식 한계. 색·디자인 작업 최상" };
  return { name: "레티나+",  hint: "8K·고밀도 노트북 패널 영역. 일반 사용엔 OS scaling 필수. 미디어 제작 최상위" };
}

// 권장 시야거리 (cm) — 화면 높이 기반
// 화면 높이(cm) = 대각선 × 2.54 × sin(arctan(h/w))
// 16:9에선 대략 인치 × 1.245, 21:9 ≈ 인치 × 1.00
function recommendedDistance(inches, w, h) {
  const aspectFactor = h / Math.sqrt(w*w + h*h);          // h/diagonal
  const screenHeightCm = inches * 2.54 * aspectFactor;
  return {
    work:  Math.round(screenHeightCm * 2.0),              // 작업·생산성
    media: Math.round(screenHeightCm * 1.5),              // 영상·게임 (4K 변별 거리)
    minComfort: Math.round(screenHeightCm * 1.2),         // 너무 가까우면 눈 피로
    screenHeightCm: Math.round(screenHeightCm * 10) / 10,
  };
}

// 4K 변별 가능성 (인치별)
function fourKVerdict(inches, w, h, ppi) {
  if (h >= 2160) {
    // 이미 4K 이상
    if (inches < 24) return { perceptible: "X", note: "24인치 미만 4K는 OS scaling(125~150%) 필수. 그렇지 않으면 글자 너무 작음" };
    if (inches < 27) return { perceptible: "△", note: "24~27인치 4K = QHD와 차이 미세. scaling 필요. 텍스트 작업 권장 X" };
    if (inches < 32) return { perceptible: "○", note: "27~32인치 4K = 최적 영역. scaling 100~125%로 변별 명확" };
    if (inches < 40) return { perceptible: "○", note: "32~40인치 4K = 영상·디자인 최상. scaling 100% 표준 사용" };
    return { perceptible: "○", note: "40인치+ 4K = 거실용 또는 멀티 작업 영역. 시야거리 60cm+ 권장" };
  }
  if (h >= 1440) {
    if (inches < 27) return { perceptible: "—", note: "QHD 27인치 미만은 표준 영역. 4K 업그레이드 효과는 27인치+에서 명확" };
    return { perceptible: "—", note: "QHD 27인치+ = 4K 업그레이드 시 디자인·영상 작업 체감 큼" };
  }
  // FHD
  if (inches >= 27) return { perceptible: "—", note: "FHD 27인치+ = 픽셀 거침 인지 시작. QHD 또는 4K 업그레이드 권장" };
  if (inches >= 24) return { perceptible: "—", note: "FHD 24~27인치 = 표준 가성비. 일반 사무·웹 사용엔 충분" };
  return { perceptible: "—", note: "FHD 24인치 미만 = 휴대·세컨드용. 픽셀 밀도는 충분" };
}

// 사용 목적별 적합도 (4 카드 — 추천 카드 영역)
// inches·ppi·resolution(w×h)·refreshRate가 들어왔다고 가정 — 단순화하여 인치만 사용
function purposeFit(inches, h) {
  return {
    gaming: {
      ideal: inches >= 24 && inches <= 27 && h >= 1080,
      note: inches < 24 ? "조금 작음 — FPS 게임은 24인치+ 권장" :
            inches > 32 ? "너무 큼 — 시야 분산. 27인치 이하 권장" :
            "추천 범위. 240Hz·1ms·G-Sync/FreeSync 사양 우선",
    },
    office: {
      ideal: inches >= 27 && inches <= 32 && h >= 1440,
      note: inches < 24 ? "작음 — 멀티태스킹·문서 작업엔 27인치+ 추천" :
            inches > 34 ? "크지만 OK — 책상 깊이 80cm+ 필요" :
            "추천 범위. QHD·아이케어·HDMI/DP 풀세트 우선",
    },
    creative: {
      ideal: inches >= 27 && inches <= 32 && h >= 2160,
      note: h < 1440 ? "해상도 부족 — 4K 27인치+ 권장" :
            inches < 24 ? "작음 — 27인치+ 권장" :
            "추천 범위. sRGB 99%·DCI-P3·HDR400+ 우선",
    },
    secondary: {
      ideal: inches >= 22 && inches <= 24,
      note: inches < 22 ? "휴대 모니터급. 일반 세컨드용엔 22~24인치 추천" :
            inches > 24 ? "메인급 사이즈. 세컨드용엔 22~24인치가 가성비" :
            "추천 범위. FHD 60Hz IPS 가성비 모델 우선",
    },
  };
}

// ========== UI 바인딩 ==========

const form = document.getElementById('form');
const resolutionSelect = document.getElementById('resolution');
const inchInput = document.getElementById('inch');
const customW = document.getElementById('customW');
const customH = document.getElementById('customH');
const customFields = document.getElementById('custom-fields');
const result = document.getElementById('result');

// 해상도 옵션 채우기
Object.entries(RESOLUTIONS).forEach(([key, r]) => {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = r.label;
  resolutionSelect.appendChild(opt);
});
resolutionSelect.value = "qhd"; // 기본 QHD 27인치 가정

resolutionSelect.addEventListener('change', () => {
  customFields.style.display = resolutionSelect.value === "custom" ? "" : "none";
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const inches = parseFloat(inchInput.value);
  if (!inches || inches <= 0) return;

  let w, h;
  if (resolutionSelect.value === "custom") {
    w = parseInt(customW.value, 10);
    h = parseInt(customH.value, 10);
    if (!w || !h || w < 100 || h < 100) return;
  } else {
    const r = RESOLUTIONS[resolutionSelect.value];
    w = r.w; h = r.h;
  }

  const ppi = Math.sqrt(w*w + h*h) / inches;
  const tier = ppiTier(ppi);
  const dist = recommendedDistance(inches, w, h);
  const fourK = fourKVerdict(inches, w, h, ppi);
  const fit = purposeFit(inches, h);
  const pixelPitch = 25.4 / ppi;
  const aspectRatio = simplifyRatio(w, h);

  // 출력 채우기
  document.getElementById('ppiValue').textContent = ppi.toFixed(1);
  document.getElementById('ppiTier').textContent = tier.name;
  document.getElementById('ppiNote').textContent = tier.hint;
  document.getElementById('pixelPitch').textContent = pixelPitch.toFixed(3) + " mm";
  document.getElementById('aspectRatio').textContent = aspectRatio;
  document.getElementById('screenHeight').textContent = dist.screenHeightCm + " cm";

  document.getElementById('distWork').textContent = dist.work + " cm";
  document.getElementById('distMedia').textContent = dist.media + " cm";
  document.getElementById('distMin').textContent = dist.minComfort + " cm";

  document.getElementById('fourKVerdict').textContent = fourK.perceptible;
  document.getElementById('fourKNote').textContent = fourK.note;

  // 4 카드 추천 fit 마킹
  ['gaming','office','creative','secondary'].forEach(key => {
    const card = document.querySelector(`.purpose-card[data-purpose="${key}"]`);
    if (!card) return;
    if (fit[key].ideal) {
      card.classList.add('match');
    } else {
      card.classList.remove('match');
    }
    const noteEl = card.querySelector('.purpose-fit');
    if (noteEl) noteEl.textContent = fit[key].note;
  });

  result.style.display = "";
  result.scrollIntoView({ behavior: "smooth", block: "start" });
});

function simplifyRatio(w, h) {
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const g = gcd(w, h);
  return `${w/g} : ${h/g}`;
}

// 첫 진입 시 자동 계산 (QHD 27인치 가정)
inchInput.value = inchInput.value || 27;
form.dispatchEvent(new Event('submit'));
