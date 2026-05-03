/**
 * 칼로리(BMR/TDEE) 계산기
 * 최종 검증: 2026-04-29
 *
 * 공식: Mifflin-St Jeor (1990) — 가장 정확하다고 평가받는 BMR 공식
 * - 남: BMR = (10 × kg) + (6.25 × cm) - (5 × age) + 5
 * - 여: BMR = (10 × kg) + (6.25 × cm) - (5 × age) - 161
 *
 * TDEE = BMR × 활동지수
 * - 좌식: 1.2
 * - 가벼운 운동 (주 1~3회): 1.375
 * - 보통 운동 (주 3~5회): 1.55
 * - 활동적 (주 6~7회): 1.725
 * - 매우 활동적 (육체노동·격렬): 1.9
 */

const 활동지수 = {
  sedentary: { v: 1.2, label: "좌식 (운동 거의 안 함)" },
  light:     { v: 1.375, label: "가벼운 운동 (주 1~3회)" },
  moderate:  { v: 1.55, label: "보통 운동 (주 3~5회)" },
  active:    { v: 1.725, label: "활동적 (주 6~7회)" },
  veryActive:{ v: 1.9, label: "매우 활동적 (육체노동급)" },
};

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const age = parseInt(document.getElementById("age").value, 10);
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const activity = document.getElementById("activity").value;
  if (!age || !height || !weight) { alert("값을 입력하세요."); return; }

  const bmr = gender === "male"
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;

  const af = 활동지수[activity];
  const tdee = bmr * af.v;

  const lose500 = tdee - 500;
  const gain500 = tdee + 500;

  document.getElementById("result").style.display = "block";
  document.getElementById("tdee").textContent = fmt(tdee) + " kcal/일";
  document.getElementById("activityLabel").textContent = af.label;
  document.getElementById("bmr").textContent = fmt(bmr) + " kcal";
  document.getElementById("loseCal").textContent = fmt(lose500) + " kcal/일 (-500)";
  document.getElementById("gainCal").textContent = fmt(gain500) + " kcal/일 (+500)";
});
