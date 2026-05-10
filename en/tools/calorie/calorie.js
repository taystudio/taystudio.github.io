/**
 * Calorie / BMR / TDEE Calculator (English)
 * Last verified: 2026-05-10
 *
 * Formulas
 * - Mifflin–St Jeor (1990, primary)
 *   Male:   10×W + 6.25×H − 5×A + 5
 *   Female: 10×W + 6.25×H − 5×A − 161
 * - Harris-Benedict 1984 revised (reference comparison)
 *   Male:   88.362 + 13.397×W + 4.799×H − 5.677×A
 *   Female: 447.593 + 9.247×W + 3.098×H − 4.330×A
 *
 * TDEE = BMR × activity factor (1.2 / 1.375 / 1.55 / 1.725 / 1.9)
 * Cut goal = TDEE − 500 (≈ 0.45 kg/week, WHO / ADA recommended)
 * Lean bulk = TDEE + 300
 * Protein = 1.6 g/kg (Morton 2018, BJSM)
 * Water = 33 ml/kg
 */

const ACTIVITY = {
  sedentary:  { v: 1.2,   label: "Sedentary (little to no exercise)" },
  light:      { v: 1.375, label: "Lightly active (1–3 days/week)" },
  moderate:   { v: 1.55,  label: "Moderately active (3–5 days/week)" },
  active:     { v: 1.725, label: "Very active (6–7 days/week)" },
  veryActive: { v: 1.9,   label: "Extra active (physical labor)" },
};

function mifflin(gender, w, h, a) {
  const base = 10 * w + 6.25 * h - 5 * a;
  return gender === "male" ? base + 5 : base - 161;
}

function harrisBenedict(gender, w, h, a) {
  return gender === "male"
    ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
    : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;
}

function fmtKcal(v) {
  return Math.round(v).toLocaleString("en-US") + " kcal";
}

function fmtWater(ml) {
  const L = ml / 1000;
  return L.toFixed(1) + " L (about " + Math.round(ml).toLocaleString("en-US") + " ml)";
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const age = parseInt(document.getElementById("age").value, 10);
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const activity = document.getElementById("activity").value;
  if (!age || !height || !weight) { alert("Please enter your age, height, and weight."); return; }

  const af = ACTIVITY[activity];
  const bmr = mifflin(gender, weight, height, age);
  const tdee = bmr * af.v;
  const cut = tdee - 500;
  const bulk = tdee + 300;
  const proteinG = 1.6 * weight;
  const waterMl = 33 * weight;
  const hb = harrisBenedict(gender, weight, height, age);

  document.getElementById("result").style.display = "block";
  document.getElementById("tdee").textContent = fmtKcal(tdee);
  document.getElementById("activityLabel").textContent = af.label + " × " + af.v;
  document.getElementById("bmr").textContent = fmtKcal(bmr);
  document.getElementById("loseCal").textContent = fmtKcal(cut);
  document.getElementById("gainCal").textContent = fmtKcal(bulk);
  document.getElementById("protein").textContent = Math.round(proteinG) + " g";
  document.getElementById("water").textContent = fmtWater(waterMl);
  document.getElementById("hb").textContent = fmtKcal(hb) + " (reference)";

  document.getElementById("t12").textContent = fmtKcal(bmr * 1.2);
  document.getElementById("t1375").textContent = fmtKcal(bmr * 1.375);
  document.getElementById("t155").textContent = fmtKcal(bmr * 1.55);
  document.getElementById("t1725").textContent = fmtKcal(bmr * 1.725);
  document.getElementById("t19").textContent = fmtKcal(bmr * 1.9);

  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
});
