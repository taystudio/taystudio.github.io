/**
 * 칼로리·BMR·TDEE 계산기 (종합 분석)
 * 최종 검증: 2026-05-05
 *
 * 공식
 * - Mifflin-St Jeor (1990, 메인 결과)
 *   남성: 10×W + 6.25×H − 5×A + 5
 *   여성: 10×W + 6.25×H − 5×A − 161
 * - Harris-Benedict 1984 revised (참고 비교값)
 *   남성: 88.362 + 13.397×W + 4.799×H − 5.677×A
 *   여성: 447.593 + 9.247×W + 3.098×H − 4.330×A
 *
 * TDEE = BMR × 활동지수 (1.2 / 1.375 / 1.55 / 1.725 / 1.9)
 * 감량 권장 = TDEE − 500 (주당 약 0.45kg, 경험칙)
 * 린 벌크업 = TDEE + 300 (근육 위주 증량)
 * 단백질 = 1.6 g/kg (Morton 2018, BJSM 메타분석 기준)
 * 수분 = 33 ml/kg (일반 경험칙(약 33ml/kg))
 */

const 활동지수 = {
  sedentary:  { v: 1.2,   label: "좌식 (운동 거의 안 함)" },
  light:      { v: 1.375, label: "가벼운 운동 (주 1~3회)" },
  moderate:   { v: 1.55,  label: "보통 운동 (주 3~5회)" },
  active:     { v: 1.725, label: "활동적 (주 6~7회)" },
  veryActive: { v: 1.9,   label: "매우 활동적 (육체노동급)" },
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
  return Math.round(v).toLocaleString("ko-KR") + " kcal";
}

function fmtWater(ml) {
  const L = ml / 1000;
  return L.toFixed(1) + " L (약 " + Math.round(ml).toLocaleString("ko-KR") + " ml)";
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const age = parseInt(document.getElementById("age").value, 10);
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const activity = document.getElementById("activity").value;
  if (!age || !height || !weight) { alert("값을 입력하세요."); return; }

  const af = 활동지수[activity];
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
  document.getElementById("hb").textContent = fmtKcal(hb) + " (참고)";

  document.getElementById("t12").textContent = fmtKcal(bmr * 1.2);
  document.getElementById("t1375").textContent = fmtKcal(bmr * 1.375);
  document.getElementById("t155").textContent = fmtKcal(bmr * 1.55);
  document.getElementById("t1725").textContent = fmtKcal(bmr * 1.725);
  document.getElementById("t19").textContent = fmtKcal(bmr * 1.9);

  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
});
