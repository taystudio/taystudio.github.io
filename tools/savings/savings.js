/**
 * 적금 만기 계산기
 * 최종 검증: 2026-04-29
 *
 * 공식
 * - 단리: 만기금 = 월적립 × n + 월적립 × 연이율 × Σ(잔여개월/12)
 *   = 월적립 × n + 월적립 × 연이율 × (n(n+1)/2) / 12
 * - 복리: 매월 복리, FV = PMT × [((1+r)^n - 1) / r]
 *
 * 이자소득세 15.4% (소득세 14% + 지방세 1.4%) 적용
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const monthly = parseFloat(document.getElementById("monthly").value) * 10000;
  const rate = parseFloat(document.getElementById("rate").value);
  const months = parseInt(document.getElementById("months").value, 10);
  const type = document.querySelector('input[name="type"]:checked').value;
  if (!monthly || rate === undefined || !months) { alert("값을 모두 입력하세요."); return; }

  const principal = monthly * months;
  let totalInterest;

  if (type === "simple") {
    const annualR = rate / 100;
    totalInterest = monthly * annualR * (months * (months + 1) / 2) / 12;
  } else {
    const r = rate / 100 / 12;
    const fv = r === 0 ? monthly * months : monthly * (Math.pow(1 + r, months) - 1) / r;
    totalInterest = fv - principal;
  }

  const tax = totalInterest * 0.154;
  const netInterest = totalInterest - tax;
  const totalReceive = principal + netInterest;

  document.getElementById("result").style.display = "block";
  document.getElementById("total").textContent = fmt(totalReceive) + "원";
  document.getElementById("typeLabel").textContent = type === "simple" ? "단리 적용" : "월복리 적용";
  document.getElementById("principal").textContent = fmt(principal) + "원";
  document.getElementById("interest").textContent = fmt(totalInterest) + "원";
  document.getElementById("tax").textContent = fmt(tax) + "원 (15.4%)";
  document.getElementById("netInt").textContent = fmt(netInterest) + "원";
});
