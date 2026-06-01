/**
 * 실업급여 (구직급여) 계산기
 * 적용 기준: 2026년 / 최종 검증: 2026-06-01
 *
 * 출처: 고용보험법 제45조·제46조·제50조 + 별표1 (지급일수)
 * - 1일 급여액 = 평균임금 × 60% (구직급여일액)
 * - 상한액: 66,000원 (2019년부터 동결)
 * - 하한액: 최저시급 80% × 1일 소정근로 8시간
 *   2024년: 60,720원 (9,620 × 0.8 × 8)
 *   2025년: 64,192원 (10,030 × 0.8 × 8)
 *   2026년: 66,048원 (10,320 × 0.8 × 8) — 상한 66,000원 초과
 *   → 2026년부터 사실상 모든 수급자가 상한 66,000원 적용 (역전 현상)
 * - 지급일수: 가입기간·연령별 (고용보험법 별표1)
 */

const 상한 = 66000;
const 하한 = 66048;  // 2026년 최저시급 10,320원 기준 (10,320 × 0.8 × 8). 상한 66,000원 초과 — 실질 적용은 상한.

const 지급일수표 = {
  // [50세 미만 / 50세 이상]
  "1": [120, 120],   // 1년 미만
  "3": [150, 180],   // 1~3년
  "5": [180, 210],   // 3~5년
  "10": [210, 240],  // 5~10년
  "10+": [240, 270], // 10년 이상
};

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function 일수(기간, 연령) {
  let key;
  if (기간 < 1) key = "1";
  else if (기간 < 3) key = "3";
  else if (기간 < 5) key = "5";
  else if (기간 < 10) key = "10";
  else key = "10+";
  return 지급일수표[key][연령 < 50 ? 0 : 1];
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const monthlyAvg = parseFloat(document.getElementById("avg").value) * 10000;
  const period = parseFloat(document.getElementById("period").value);
  const age = parseInt(document.getElementById("age").value, 10);
  if (!monthlyAvg || !period || !age) { alert("값을 입력하세요."); return; }

  const 일평균 = monthlyAvg / 30;
  let 일급 = 일평균 * 0.6;
  let capped = false;
  if (일급 > 상한) { 일급 = 상한; capped = true; }
  else if (일급 < 하한) { 일급 = 하한; capped = true; }

  const days = 일수(period, age);
  const 총수령 = 일급 * days;

  document.getElementById("result").style.display = "block";
  document.getElementById("total").textContent = fmt(총수령) + "원";
  document.getElementById("daily").textContent = fmt(일급) + "원/일" + (capped ? " (상·하한 적용)" : "");
  document.getElementById("days").textContent = days + "일 지급";
  document.getElementById("monthly").textContent = fmt(일급 * 30) + "원 (월 환산)";
});
