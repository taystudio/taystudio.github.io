/**
 * 표준체중 계산기 (BMI 22 한국 표준 + Devine/Robinson/Miller/Hamwi 4 의료 공식)
 * 최종 검증: 2026-05-05
 *
 * 출처
 * - BMI 22 한국 표준: 대한비만학회 비만 진료지침 2022 / KDRI 2020
 * - Devine 1974: Drug Intell Clin Pharm 1974;8:650-655
 * - Robinson 1983: Am J Hosp Pharm 1983;40(6):1016-9
 * - Miller 1983: Am J Hosp Pharm 1983;40(11):1815-6
 * - Hamwi 1964: ADA Diabetes Mellitus 1964
 *
 * 4 의료 공식은 모두 5피트(60인치 = 152.4cm) 기준점 + 1인치당 가산.
 * 152cm 미만에서는 음수·비현실 값이 나올 수 있어 본 도구는 BMI 22만 표시.
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
    high: 22.9 * m * m,
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

  if (!height) { alert("키를 입력하세요."); return; }

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
      subEl.textContent = "현재 체중과 표준 일치 (±0.5kg 이내)";
      subEl.style.color = "#10b981";
    } else if (diff > 0) {
      subEl.textContent = `현재 체중 ${weight.toFixed(1)}kg — 표준보다 +${diff.toFixed(1)}kg 초과`;
      subEl.style.color = diff > 5 ? "#dc2626" : "#f59e0b";
    } else {
      subEl.textContent = `현재 체중 ${weight.toFixed(1)}kg — 표준보다 ${diff.toFixed(1)}kg 부족`;
      subEl.style.color = "#3b82f6";
    }
  } else {
    subEl.textContent = "한국 적정 BMI = 22 기준 (대한비만학회·KDRI 2020)";
    subEl.style.color = "";
  }

  document.getElementById("rangeWeight").textContent =
    range.low.toFixed(1) + " ~ " + range.high.toFixed(1) + " kg";
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
