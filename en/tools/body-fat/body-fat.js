/**
 * Body Fat Calculator (English) — Navy tape-measure + CUN-BAE comparison
 * Last verified: 2026-05-10
 *
 * References
 * - U.S. Navy: Hodgdon & Beckett, NHRC Report 84-11/29 (1984)
 * - CUN-BAE: Gómez-Ambrosi et al., Int J Obes 2012;36(2):286-94
 * - Classification: ACE (American Council on Exercise) Body Composition Standards
 *
 * Navy formula (inches; cm ÷ 2.54)
 *   Men:   %BF = 86.010 × log10(waist − neck) − 70.041 × log10(height) + 36.76
 *   Women: %BF = 163.205 × log10(waist + hip − neck) − 97.684 × log10(height) − 78.387
 *
 * CUN-BAE formula (BMI-based; sex 0=male / 1=female)
 *   %BF = -44.988 + (0.503 × age) + (10.689 × sex) + (3.172 × BMI)
 *         − (0.026 × BMI²) + (0.181 × BMI × sex) − (0.02 × BMI × age)
 *         − (0.005 × BMI² × sex) + (0.00021 × BMI² × age)
 */

const log10 = (x) => Math.log10(x);

function navyBF(sex, heightCm, neckCm, waistCm, hipCm) {
  const h = heightCm / 2.54;
  const n = neckCm / 2.54;
  const w = waistCm / 2.54;
  if (sex === "m") {
    return 86.010 * log10(w - n) - 70.041 * log10(h) + 36.76;
  }
  const hp = hipCm / 2.54;
  return 163.205 * log10(w + hp - n) - 97.684 * log10(h) - 78.387;
}

function cunbaeBF(sex, age, bmi) {
  const s = sex === "m" ? 0 : 1;
  return -44.988
    + 0.503 * age
    + 10.689 * s
    + 3.172 * bmi
    - 0.026 * bmi * bmi
    + 0.181 * bmi * s
    - 0.02 * bmi * age
    - 0.005 * bmi * bmi * s
    + 0.00021 * bmi * bmi * age;
}

function classifyBF(sex, bf) {
  if (sex === "m") {
    if (bf < 6)  return { label: "Essential fat (very low — caution)", row: "rowEssential", color: "#3b82f6" };
    if (bf < 14) return { label: "Athletes", row: "rowAthlete", color: "#10b981" };
    if (bf < 18) return { label: "Fitness (optimal)", row: "rowFitness", color: "#10b981" };
    if (bf < 25) return { label: "Average", row: "rowAverage", color: "#f59e0b" };
    return { label: "Obese (metabolic risk)", row: "rowObese", color: "#dc2626" };
  }
  if (bf < 14) return { label: "Essential fat (very low — caution)", row: "rowEssential", color: "#3b82f6" };
  if (bf < 21) return { label: "Athletes", row: "rowAthlete", color: "#10b981" };
  if (bf < 25) return { label: "Fitness (optimal)", row: "rowFitness", color: "#10b981" };
  if (bf < 32) return { label: "Average", row: "rowAverage", color: "#f59e0b" };
  return { label: "Obese (metabolic risk)", row: "rowObese", color: "#dc2626" };
}

const sexInputs = document.querySelectorAll('input[name="sex"]');
const hipField = document.getElementById("hipField");
const hipInput = document.getElementById("hip");

function updateHipVisibility() {
  const sex = document.querySelector('input[name="sex"]:checked').value;
  if (sex === "f") {
    hipField.style.display = "";
    hipInput.required = true;
  } else {
    hipField.style.display = "none";
    hipInput.required = false;
  }
}
sexInputs.forEach((el) => el.addEventListener("change", updateHipVisibility));
updateHipVisibility();

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const sex = document.querySelector('input[name="sex"]:checked').value;
  const age = parseFloat(document.getElementById("age").value);
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const neck = parseFloat(document.getElementById("neck").value);
  const waist = parseFloat(document.getElementById("waist").value);
  const hip = sex === "f" ? parseFloat(document.getElementById("hip").value) : 0;

  if (!age || !height || !weight || !neck || !waist) { alert("Please fill in every field."); return; }
  if (sex === "f" && !hip) { alert("Please enter hip circumference for women."); return; }

  const innerLog = sex === "m" ? (waist - neck) : (waist + hip - neck);
  if (innerLog <= 0) { alert("Measurements look invalid (e.g., neck larger than waist). Please re-check your measurements."); return; }

  const bf = navyBF(sex, height, neck, waist, hip);
  const m = height / 100;
  const bmi = weight / (m * m);
  const cunbae = cunbaeBF(sex, age, bmi);
  const cls = classifyBF(sex, bf);

  const fatMass = weight * (bf / 100);
  const leanMass = weight - fatMass;

  document.getElementById("result").style.display = "block";
  const bfEl = document.getElementById("bf");
  bfEl.textContent = bf.toFixed(1) + " %";
  bfEl.style.color = cls.color;
  document.getElementById("bfClass").textContent = cls.label;
  document.getElementById("bfClass").style.color = cls.color;
  document.getElementById("fatMass").textContent = fatMass.toFixed(1) + " kg";
  document.getElementById("leanMass").textContent = leanMass.toFixed(1) + " kg";
  document.getElementById("cunbae").textContent = cunbae.toFixed(1) + " % (reference)";
  document.getElementById("bmi").textContent = bmi.toFixed(1);

  ["rowEssential","rowAthlete","rowFitness","rowAverage","rowObese"].forEach((id) => {
    const row = document.getElementById(id);
    if (row) row.classList.remove("highlight-row");
    const cells = row?.querySelectorAll("td");
    if (cells) cells.forEach((c) => { c.style.background = ""; c.style.fontWeight = ""; });
  });
  const myRow = document.getElementById(cls.row);
  if (myRow) {
    myRow.querySelectorAll("td").forEach((c) => {
      c.style.background = "rgba(37, 99, 235, 0.08)";
      c.style.fontWeight = "600";
    });
  }

  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
});
