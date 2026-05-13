/**
 * 시급 / 월급 환산 계산기
 * 적용 기준: 2026년 / 최종 검증: 2026-05-13
 *
 * 환산 기준
 * - 209시간/월 = 주 40시간 + 주휴 8시간 = 주 48시간 × 4.345주
 * - 2026년 최저시급: 10,320원 (월 환산 2,156,880원, 2025.8.5 고시)
 *
 * 출처
 * - 근로기준법 제2조 (소정근로시간)
 * - 최저임금법 (매년 8월 결정) / minimumwage.go.kr
 */

const 월시간 = 209;
const 최저시급 = 10320;  // 2026년 (2025.8.5 고시, 전년 10,030원 → +2.9%)

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const value = parseFloat(document.getElementById("value").value);
  if (!value || value <= 0) { alert("값을 입력하세요."); return; }

  let hourly, monthly, daily, weekly, yearly;
  if (mode === "h2m") {
    hourly = value;
    monthly = hourly * 월시간;
  } else {
    monthly = value * 10000;
    hourly = monthly / 월시간;
  }
  daily = hourly * 8;
  weekly = hourly * 40 + hourly * 8;  // 주 40시간 + 주휴 8시간
  yearly = monthly * 12;

  document.getElementById("result").style.display = "block";
  document.getElementById("hourly").textContent = fmt(hourly) + "원";
  document.getElementById("daily").textContent = fmt(daily) + "원";
  document.getElementById("weekly").textContent = fmt(weekly) + "원";
  document.getElementById("monthly").textContent = fmt(monthly) + "원";
  document.getElementById("yearly").textContent = fmt(yearly) + "원";
  document.getElementById("vsMin").textContent = hourly >= 최저시급
    ? `최저시급의 ${(hourly / 최저시급 * 100).toFixed(0)}% (양호)`
    : `⚠️ 최저시급(${fmt(최저시급)}원) 미달`;
});
