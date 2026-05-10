/**
 * Ideal Weight Calculator (English) — BMI 22 + Devine / Robinson / Miller / Hamwi
 * Last verified: 2026-05-10
 *
 * References
 * - WHO BMI: Global Database on Body Mass Index
 * - Devine 1974: Drug Intell Clin Pharm 1974;8:650-655
 * - Robinson 1983: Am J Hosp Pharm 1983;40(6):1016-9
 * - Miller 1983: Am J Hosp Pharm 1983;40(11):1815-6
 * - Hamwi 1964: ADA Diabetes Mellitus 1964
 *
 * All four medical formulas start from 5 ft (60 inches = 152.4 cm) baseline + per-inch addition.
 * Below 152 cm the formulas can return negative or unrealistic values, so only BMI 22 is shown.
 */

const MIN_INCH = 60;

function bmi22(heightCm) {
  const m = heightCm / 100;
  return 22 * m * m;
}

function bmiRange(heightCm) {
  const m = heightCm / 100;
  return {
    low: 18.5 * m * m,
    high: 24.9 * m * m,
  };
}

function devine(sex, heightCm) {
  const inch = heightCm / 2.54;
  if (inch < MIN_INCH) return null;
  const base = sex === "m" ? 50 : 45.5;
  return base + 2.3 * (inch - MIN_INCH);
}

function robinson(sex, heightCm) {
  const inch = heightCm / 2.54;
  if (inch < MIN_INCH) return null;
  return sex === "m"
    ? 52 + 1.9 * (inch - MIN_INCH)
    : 49 + 1.7 * (inch - MIN_INCH);
}

function miller(sex, heightCm) {
  const inch = heightCm / 2.54;
  if (inch < MIN_INCH) return null;
  return sex === "m"
    ? 56.2 + 1.41 * (inch - MIN_INCH)
    : 53.1 + 1.36 * (inch - MIN_INCH);
}

function hamwi(sex, heightCm) {
  const inch = heightCm / 2.54;
  if (inch < MIN_INCH) return null;
  return sex === "m"
    ? 48 + 2.7 * (inch - MIN_INCH)
    : 45.5 + 2.2 * (inch - MIN_INCH);
}

function fmtKg(v) {
  return v == null ? "—" : v.toFixed(1) + " kg";
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const sex = document.querySelector('input[name="sex"]:checked').value;
  const height = parseFloat(document.getElementById("height").value);
  const weightInput = document.getElementById("weight").value;
  const weight = weightInput ? parseFloat(weightInput) : null;

  if (!height) { alert("Please enter your height."); return; }

  const std = bmi22(height);
  const range = bmiRange(height);
  const d = devine(sex, height);
  const r = robinson(sex, height);
  const mi = miller(sex, height);
  const ha = hamwi(sex, height);

  document.getElementById("result").style.display = "block";
  document.getElementById("bmi22").textContent = fmtKg(std);

  const subEl = document.getElementById("diffWeight");
  if (weight) {
    const diff = weight - std;
    if (Math.abs(diff) < 0.5) {
      subEl.textContent = "Current weight matches ideal (within ±0.5 kg)";
      subEl.style.color = "#10b981";
    } else if (diff > 0) {
      subEl.textContent = `Current weight ${weight.toFixed(1)} kg — +${diff.toFixed(1)} kg over ideal`;
      subEl.style.color = diff > 5 ? "#dc2626" : "#f59e0b";
    } else {
      subEl.textContent = `Current weight ${weight.toFixed(1)} kg — ${diff.toFixed(1)} kg under ideal`;
      subEl.style.color = "#3b82f6";
    }
  } else {
    subEl.textContent = "Reference: BMI 22 (midpoint of WHO normal range 18.5–24.9)";
    subEl.style.color = "";
  }

  document.getElementById("rangeWeight").textContent =
    range.low.toFixed(1) + " – " + range.high.toFixed(1) + " kg";
  document.getElementById("devine").textContent = fmtKg(d);
  document.getElementById("robinson").textContent = fmtKg(r);
  document.getElementById("miller").textContent = fmtKg(mi);
  document.getElementById("hamwi").textContent = fmtKg(ha);

  const bmiRow = document.getElementById("bmiRow");
  if (weight) {
    const m = height / 100;
    const curBmi = weight / (m * m);
    document.getElementById("curBmi").textContent = curBmi.toFixed(1);
    bmiRow.style.display = "";
  } else {
    bmiRow.style.display = "none";
  }

  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
});
