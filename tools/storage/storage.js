/**
 * 저장공간 계산기 — 영상·사진 용량 추정 + 외장하드/SSD 권장
 * 최종 검증: 2026-05-06
 *
 * 비트레이트 출처
 * - YouTube 권장 업로드 비트레이트 (Google Help "Recommended upload encoding settings")
 * - Apple ProRes data rate guide (Final Cut Pro X manual)
 * - DJI Action 카메라 비트레이트 사양 (DJI 공식 매뉴얼)
 * - Adobe Lightroom RAW 파일 사이즈 가이드
 *
 * 비트레이트(Mbps) 표는 카메라·인코더별로 ±20% 변동 가능.
 * 본 도구는 일반 소비자 시나리오 평균값 사용.
 */

// 영상 종류별 1시간당 용량 (GB) — bitrate(Mbps) × 3600s ÷ 8 ÷ 1024 ≈ GB/h
const VIDEO_RATES = {
  "4k-h264":   { label: "4K H.264 (50Mbps)",       gbPerHour: 22 },
  "4k-h265":   { label: "4K H.265/HEVC (25Mbps)",  gbPerHour: 11 },
  "4k-av1":    { label: "4K AV1 (15Mbps)",         gbPerHour: 6.6 },
  "qhd-h264":  { label: "QHD H.264 (16Mbps)",      gbPerHour: 7.0 },
  "qhd-h265":  { label: "QHD H.265/HEVC (8Mbps)",  gbPerHour: 3.5 },
  "fhd-h264":  { label: "FHD H.264 (8Mbps)",       gbPerHour: 3.5 },
  "fhd-h265":  { label: "FHD H.265/HEVC (4Mbps)",  gbPerHour: 1.8 },
  "hd-h264":   { label: "HD 720p H.264 (4Mbps)",   gbPerHour: 1.8 },
  "phone-4k":  { label: "스마트폰 4K HDR (60Mbps)",  gbPerHour: 27 },
  "phone-fhd": { label: "스마트폰 FHD (17Mbps)",     gbPerHour: 7.5 },
  "action-4k": { label: "액션캠 4K (100Mbps)",      gbPerHour: 44 },
  "prores":    { label: "ProRes 422 4K (590Mbps)", gbPerHour: 264 },
};

// 사진 종류별 평균 사이즈 (MB)
const PHOTO_SIZES = {
  "dslr-raw":      { label: "DSLR RAW (24MP)",       mbEach: 30 },
  "dslr-raw-50":   { label: "DSLR RAW (45~50MP)",    mbEach: 65 },
  "mirrorless":    { label: "미러리스 RAW (24MP)",     mbEach: 25 },
  "jpg-hi":        { label: "JPG 고화질 (24MP)",      mbEach: 8 },
  "jpg-normal":    { label: "JPG 일반 (12MP)",        mbEach: 3 },
  "phone-heic":    { label: "스마트폰 HEIC (12MP)",    mbEach: 2 },
  "phone-heic-48": { label: "스마트폰 HEIC (48MP)",    mbEach: 4 },
  "phone-jpg":     { label: "스마트폰 JPG (12MP)",     mbEach: 3.5 },
};

// 권장 저장장치 카테고리 — 필요 용량(GB) 기준
function recommendStorage(gb) {
  if (gb < 64)   return { tier: "256GB SD카드 또는 USB 메모리",   note: "휴대용·소용량. SD카드는 카메라·드론 직결" };
  if (gb < 220)  return { tier: "256GB 휴대용 SSD",               note: "노트북 백업·외출용. 가격 5~7만 대" };
  if (gb < 480)  return { tier: "512GB 휴대용 SSD",               note: "사진·영상 1년 분량. 가격 8~12만" };
  if (gb < 950)  return { tier: "1TB 외장 SSD 또는 외장 HDD",      note: "범용 백업. SSD 12~18만 / HDD 7~9만" };
  if (gb < 1900) return { tier: "2TB 외장 HDD (또는 1TB SSD 분리)", note: "장기 보관. HDD 9~13만 / SSD 두 개 분리도 OK" };
  if (gb < 3900) return { tier: "4TB 외장 HDD",                  note: "사진·영상 다수 보관. 13~18만" };
  if (gb < 7900) return { tier: "8TB 외장 HDD 또는 NAS 2-bay",     note: "장기 아카이브. NAS는 RAID 1로 데이터 안전" };
  return         { tier: "NAS 4-bay (12~16TB+)",                note: "전문 아카이브·백업 이중화. 가격 100만+" };
}

const modeSelect = document.getElementById("mode");
const videoFields = document.getElementById("video-fields");
const photoFields = document.getElementById("photo-fields");
const manualFields = document.getElementById("manual-fields");

function updateMode() {
  const m = modeSelect.value;
  videoFields.style.display  = m === "video"  ? "" : "none";
  photoFields.style.display  = m === "photo"  ? "" : "none";
  manualFields.style.display = m === "manual" ? "" : "none";
}
modeSelect.addEventListener("change", updateMode);
updateMode();

// 영상·사진 select option 자동 채우기
const videoTypeSel = document.getElementById("videoType");
Object.entries(VIDEO_RATES).forEach(([key, v]) => {
  const opt = document.createElement("option");
  opt.value = key;
  opt.textContent = v.label;
  videoTypeSel.appendChild(opt);
});
videoTypeSel.value = "phone-4k";

const photoTypeSel = document.getElementById("photoType");
Object.entries(PHOTO_SIZES).forEach(([key, v]) => {
  const opt = document.createElement("option");
  opt.value = key;
  opt.textContent = v.label;
  photoTypeSel.appendChild(opt);
});
photoTypeSel.value = "phone-heic";

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const mode = modeSelect.value;
  let gb = 0;
  let breakdown = "";

  if (mode === "video") {
    const hours = parseFloat(document.getElementById("videoHours").value);
    const type = videoTypeSel.value;
    if (!hours || hours <= 0) { alert("영상 시간을 입력하세요."); return; }
    const rate = VIDEO_RATES[type];
    gb = hours * rate.gbPerHour;
    breakdown = `${rate.label} × ${hours}시간 = 약 ${gb.toFixed(1)}GB`;
  } else if (mode === "photo") {
    const count = parseInt(document.getElementById("photoCount").value, 10);
    const type = photoTypeSel.value;
    if (!count || count <= 0) { alert("사진 장수를 입력하세요."); return; }
    const ps = PHOTO_SIZES[type];
    const totalMb = count * ps.mbEach;
    gb = totalMb / 1024;
    breakdown = `${ps.label} × ${count.toLocaleString()}장 = ${totalMb.toLocaleString()}MB ≈ ${gb.toFixed(1)}GB`;
  } else {
    gb = parseFloat(document.getElementById("manualGb").value);
    if (!gb || gb <= 0) { alert("용량을 입력하세요."); return; }
    breakdown = `직접 입력: ${gb}GB`;
  }

  // 백업·여유 공간 (보통 ×1.5 권장 — 편집 캐시·임시·중복 등)
  const recommendedGb = gb * 1.5;
  const rec = recommendStorage(recommendedGb);

  document.getElementById("result").style.display = "block";
  document.getElementById("primaryGb").textContent = gb >= 1024
    ? (gb / 1024).toFixed(2) + " TB"
    : gb.toFixed(1) + " GB";
  document.getElementById("recommendGb").textContent = recommendedGb >= 1024
    ? (recommendedGb / 1024).toFixed(2) + " TB"
    : recommendedGb.toFixed(0) + " GB";
  document.getElementById("breakdown").textContent = breakdown;
  document.getElementById("recTier").textContent = rec.tier;
  document.getElementById("recNote").textContent = rec.note;

  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
});
