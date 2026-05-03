/**
 * 복리 계산기
 * 최종 검증: 2026-04-29
 *
 * 공식 (수학적 — 법령 무관)
 * - 일시 투자: A = P(1 + r/n)^(n*t)
 * - 매월 적립 미래가치: FV = PMT × [((1+r)^n - 1) / r]
 * - r = 월이율 (연이율 / 12), n = 개월수
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const principal = parseFloat(document.getElementById("principal").value || 0) * 10000;
  const monthly = parseFloat(document.getElementById("monthly").value || 0) * 10000;
  const rate = parseFloat(document.getElementById("rate").value);
  const years = parseFloat(document.getElementById("years").value);
  if (rate === undefined || !years) { alert("이율과 기간을 입력하세요."); return; }

  const r = rate / 100 / 12;
  const n = years * 12;

  const principalFV = principal * Math.pow(1 + r, n);
  const monthlyFV = r === 0 ? monthly * n : monthly * (Math.pow(1 + r, n) - 1) / r;
  const totalFV = principalFV + monthlyFV;

  const totalInvested = principal + monthly * n;
  const profit = totalFV - totalInvested;

  document.getElementById("result").style.display = "block";
  document.getElementById("totalFV").textContent = fmt(totalFV) + "원";
  document.getElementById("invested").textContent = fmt(totalInvested) + "원";
  document.getElementById("profit").textContent = fmt(profit) + "원";
  document.getElementById("multiple").textContent = "× " + (totalFV / Math.max(1, totalInvested)).toFixed(2);
  document.getElementById("principalPart").textContent = fmt(principalFV) + "원";
  document.getElementById("monthlyPart").textContent = fmt(monthlyFV) + "원";
});
