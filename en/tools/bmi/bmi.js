/**
 * BMI Calculator (English)
 * Last verified: 2026-05-10
 *
 * Formula: BMI = weight (kg) / height (m)²
 *
 * NOTE: This English version uses the WHO 4-tier classification.
 * The Korean (ko) version uses the Korean Society for the Study of Obesity 6-tier
 * classification (stricter — overweight from BMI 23, obese from BMI 25).
 *
 * WHO standard:
 * - <18.5      Underweight
 * - 18.5–24.9  Normal
 * - 25–29.9    Overweight
 * - 30–34.9    Obese (Class I)
 * - 35–39.9    Obese (Class II)
 * - 40+        Obese (Class III, severe)
 */

function classify(bmi) {
  if (bmi < 18.5) return { label: "Underweight", color: "#3b82f6" };
  if (bmi < 25)   return { label: "Normal", color: "#10b981" };
  if (bmi < 30)   return { label: "Overweight", color: "#f59e0b" };
  if (bmi < 35)   return { label: "Obese (Class I)", color: "#ef4444" };
  if (bmi < 40)   return { label: "Obese (Class II)", color: "#dc2626" };
  return { label: "Obese (Class III, severe)", color: "#991b1b" };
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  if (!height || !weight) { alert("Please enter your height and weight."); return; }
  if (height <= 0 || weight <= 0) { alert("Height and weight must be greater than 0."); return; }
  if (height < 50 || height > 250) { alert("Please enter a height between 50 and 250 cm."); return; }
  if (weight < 10 || weight > 500) { alert("Please enter a weight between 10 and 500 kg."); return; }

  const m = height / 100;
  const bmi = weight / (m * m);
  const cls = classify(bmi);

  // Healthy weight range (BMI 18.5–24.9, WHO standard)
  const minNormal = 18.5 * m * m;
  const maxNormal = 24.9 * m * m;
  const idealWeight = 22 * m * m;

  document.getElementById("result").style.display = "block";
  document.getElementById("bmi").textContent = bmi.toFixed(1);
  document.getElementById("bmi").style.color = cls.color;
  document.getElementById("category").textContent = cls.label;
  document.getElementById("category").style.color = cls.color;
  document.getElementById("idealRange").textContent = `${minNormal.toFixed(1)}–${maxNormal.toFixed(1)} kg`;
  document.getElementById("ideal").textContent = `${idealWeight.toFixed(1)} kg (BMI 22)`;
  const diff = weight - idealWeight;
  document.getElementById("diff").textContent =
    diff > 0 ? `+${diff.toFixed(1)} kg over` : diff < 0 ? `${diff.toFixed(1)} kg under` : "matches ideal weight";
});
