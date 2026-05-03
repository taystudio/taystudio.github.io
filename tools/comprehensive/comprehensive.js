/**
 * 종합소득세 계산기
 * 적용 기준: 2026년 1월 / 최종 검토: 2026-04-29
 *
 * 수치 출처
 * - 종합소득세 누진세표 (6~45%): 소득세법 제55조 (2023년 개정 이후 동일)
 *   1400만 / 5000만 / 8800만 / 1.5억 / 3억 / 5억 / 10억 / 그 이상
 * - 인적공제 (본인·배우자·부양가족 1인당 150만원): 소득세법 제50조
 * - 지방소득세 10%: 지방세법 제85조
 */

const 누진세표 = [
  { limit: 14000000, rate: 0.06, deduct: 0 },
  { limit: 50000000, rate: 0.15, deduct: 1260000 },
  { limit: 88000000, rate: 0.24, deduct: 5760000 },
  { limit: 150000000, rate: 0.35, deduct: 15440000 },
  { limit: 300000000, rate: 0.38, deduct: 19940000 },
  { limit: 500000000, rate: 0.40, deduct: 25940000 },
  { limit: 1000000000, rate: 0.42, deduct: 35940000 },
  { limit: Infinity, rate: 0.45, deduct: 65940000 },
];

function 산출세액(과세표준) {
  for (const tier of 누진세표) {
    if (과세표준 <= tier.limit) {
      return Math.max(0, 과세표준 * tier.rate - tier.deduct);
    }
  }
  return 0;
}

function 적용세율(과세표준) {
  for (const tier of 누진세표) {
    if (과세표준 <= tier.limit) return (tier.rate * 100).toFixed(0) + "%";
  }
  return "-";
}

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const income = parseFloat(document.getElementById("income").value) * 10000;
  const expense = parseFloat(document.getElementById("expense").value || 0) * 10000;
  const personal = parseInt(document.getElementById("personal").value || 0, 10);
  if (!income || income <= 0) { alert("소득 금액을 입력하세요."); return; }

  const 소득금액 = Math.max(0, income - expense);
  const 인적공제 = 1500000 * (1 + personal);
  const 과세표준 = Math.max(0, 소득금액 - 인적공제);
  const 산출 = 산출세액(과세표준);
  const 지방세 = 산출 * 0.1;
  const 총세액 = 산출 + 지방세;

  document.getElementById("result").style.display = "block";
  document.getElementById("totalTax").textContent = fmt(총세액) + "원";
  document.getElementById("rateLabel").textContent = "적용 최고세율 " + 적용세율(과세표준);
  document.getElementById("incomeAfter").textContent = fmt(소득금액) + "원";
  document.getElementById("personalDed").textContent = fmt(인적공제) + "원";
  document.getElementById("taxBase").textContent = fmt(과세표준) + "원";
  document.getElementById("calcTax").textContent = fmt(산출) + "원";
  document.getElementById("localTax").textContent = fmt(지방세) + "원";
});
