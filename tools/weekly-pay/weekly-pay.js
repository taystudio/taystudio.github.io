/**
 * 주휴수당 계산기
 * 적용 기준: 2026년 (최저시급 10,320원) / 최종 검증: 2026-06-01
 *
 * 출처: 근로기준법 제55조 (주휴일), 시행령 제30조
 * - 1주 소정근로시간 15시간 이상 + 주 약속한 일수 만근 시
 * - 주휴수당 = 시급 × 1일 소정근로시간
 * - 1일 소정근로시간 = 1주 소정근로시간 ÷ 5일 (단, 8시간 한도)
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const hourly = parseFloat(document.getElementById("hourly").value);
  const weekly = parseFloat(document.getElementById("weekly").value);
  if (!hourly || !weekly) { alert("값을 입력하세요."); return; }

  document.getElementById("result").style.display = "block";

  if (weekly < 15) {
    document.getElementById("total").textContent = "0원";
    document.getElementById("eligibility").textContent = "❌ 1주 15시간 미만 — 주휴수당 대상 아님";
    document.getElementById("dailyHours").textContent = "-";
    document.getElementById("weeklyTotal").textContent = "-";
    document.getElementById("monthlyTotal").textContent = "-";
    return;
  }

  const 일소정 = Math.min(8, weekly / 5);
  const 주휴 = hourly * 일소정;
  const 주임금 = hourly * weekly + 주휴;
  const 월주휴 = 주휴 * 4.345;

  document.getElementById("total").textContent = fmt(주휴) + "원/주";
  document.getElementById("eligibility").textContent = "✅ 주 15시간 이상 — 주휴수당 지급 대상";
  document.getElementById("dailyHours").textContent = 일소정.toFixed(1) + "시간";
  document.getElementById("weeklyTotal").textContent = fmt(주임금) + "원 (주휴 포함)";
  document.getElementById("monthlyTotal").textContent = fmt(월주휴) + "원 (월 환산)";
});
