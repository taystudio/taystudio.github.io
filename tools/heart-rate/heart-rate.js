/**
 * 운동 심박존 계산기 (Tanaka HRmax + Karvonen 5 zone)
 * 최종 검증: 2026-05-05
 *
 * 출처
 * - Tanaka 2001: J Am Coll Cardiol 2001;37(1):153-6 — HRmax = 208 − 0.7 × age
 * - Fox-Haskell 1971: Ann Clin Res 1971;3(6):404-32 — HRmax = 220 − age (전통, ±10~12 BPM)
 * - Karvonen 1957: Ann Med Exp Biol Fenn 1957;35(3):307-15 — HRR 공식
 * - Gulati 2010: Circulation 2010;122(2):130-7 — 여성 HRmax = 206 − 0.88 × age
 * - 5 zone: ACSM's Guidelines for Exercise Testing and Prescription, 11th ed. 2021
 *
 * Karvonen: 목표 HR = (HRmax − HRrest) × %강도 + HRrest
 * 단순 %HRmax: 목표 HR = HRmax × %강도 (HRrest 미입력 시)
 */

const ZONES = [
  { name: 1, lo: 0.50, hi: 0.60 },
  { name: 2, lo: 0.60, hi: 0.70 },
  { name: 3, lo: 0.70, hi: 0.80 },
  { name: 4, lo: 0.80, hi: 0.90 },
  { name: 5, lo: 0.90, hi: 1.00 },
];

function tanakaHRmax(age) { return 208 - 0.7 * age; }
function foxHaskellHRmax(age) { return 220 - age; }
function gulatiHRmax(age) { return 206 - 0.88 * age; }

function zoneRange(hrmax, hrrest, lo, hi) {
  if (hrrest != null && hrrest > 0) {
    const hrr = hrmax - hrrest;
    return [Math.round(hrr * lo + hrrest), Math.round(hrr * hi + hrrest)];
  }
  return [Math.round(hrmax * lo), Math.round(hrmax * hi)];
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const sex = document.querySelector('input[name="sex"]:checked').value;
  const age = parseFloat(document.getElementById("age").value);
  const hrrestInput = document.getElementById("hrrest").value;
  const hrrest = hrrestInput ? parseFloat(hrrestInput) : null;

  if (!age) { alert("나이를 입력하세요."); return; }
  if (hrrest != null && (hrrest < 30 || hrrest > 120)) {
    alert("안정시심박수는 30~120 BPM 사이로 입력하세요."); return;
  }

  const hrmax = tanakaHRmax(age);
  const hrmaxFox = foxHaskellHRmax(age);
  const hrmaxGulati = sex === "f" ? gulatiHRmax(age) : null;

  if (hrrest != null && hrrest >= hrmax) {
    alert("안정시심박수가 최대심박수보다 큽니다. 입력값을 확인하세요."); return;
  }

  document.getElementById("result").style.display = "block";
  document.getElementById("hrmax").textContent = Math.round(hrmax) + " BPM";
  document.getElementById("hrmaxFox").textContent = Math.round(hrmaxFox) + " BPM";

  const gulatiRow = document.getElementById("gulatiRow");
  if (hrmaxGulati != null) {
    document.getElementById("hrmaxGulati").textContent = Math.round(hrmaxGulati) + " BPM";
    gulatiRow.style.display = "";
  } else {
    gulatiRow.style.display = "none";
  }

  const modeLabel = document.getElementById("modeLabel");
  const zoneNote = document.getElementById("zoneNote");
  if (hrrest != null) {
    modeLabel.textContent = `Karvonen 방식 적용 (HRrest ${hrrest} BPM 반영)`;
    zoneNote.textContent = "— Karvonen 공식: (HRmax − HRrest) × %강도 + HRrest. 본인 컨디션 반영.";
  } else {
    modeLabel.textContent = "단순 %HRmax 방식 (HRrest 미입력)";
    zoneNote.textContent = "— 안정시심박수 입력 시 Karvonen 정확도 ↑. 같은 강도가 본인 컨디션에 맞게 조정됨.";
  }

  ZONES.forEach((z) => {
    const [lo, hi] = zoneRange(hrmax, hrrest, z.lo, z.hi);
    const cell = document.getElementById("z" + z.name);
    if (cell) cell.textContent = lo + " ~ " + hi + " BPM";
  });

  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
});
