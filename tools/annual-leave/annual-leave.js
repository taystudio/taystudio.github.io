/**
 * 연차수당 계산기
 * 적용 기준: 2025년 / 최종 검증: 2026-04-29
 *
 * 출처: 근로기준법 제60조 (연차유급휴가)
 * - 1년 미만: 1개월 만근 시 1일 (월차) — 최대 11일
 * - 1년 이상: 15일
 * - 3년 이상부터 2년에 1일씩 추가 (최대 25일)
 * - 미사용 연차 = 1일 통상임금
 * - 1일 통상임금 = (월 통상임금 ÷ 209) × 8
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function 연차산정(years) {
  if (years < 1) {
    const months = Math.floor(years * 12);
    return Math.min(11, months);
  }
  if (years < 3) return 15;
  const 추가 = Math.min(10, Math.floor((years - 1) / 2));
  return 15 + 추가;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const monthly = parseFloat(document.getElementById("monthly").value) * 10000;
  const years = parseFloat(document.getElementById("years").value);
  const unused = parseFloat(document.getElementById("unused").value);
  if (!monthly || years === undefined || unused === undefined) { alert("값을 입력하세요."); return; }

  const 시급 = monthly / 209;
  const 일급 = 시급 * 8;
  const 발생 = 연차산정(years);
  const 수당 = 일급 * unused;

  document.getElementById("result").style.display = "block";
  document.getElementById("total").textContent = fmt(수당) + "원";
  document.getElementById("entitled").textContent = 발생 + "일 (법정)";
  document.getElementById("hourlyW").textContent = fmt(시급) + "원";
  document.getElementById("dailyW").textContent = fmt(일급) + "원";
  document.getElementById("unusedDays").textContent = unused + "일";
});
