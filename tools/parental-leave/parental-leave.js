/**
 * 육아휴직 급여 계산기
 * 적용 기준: 2025년 1월 시행 / 최종 검증: 2026-04-29
 *
 * 출처: 고용보험법 제70조 / 시행령 제95조
 * 2025년 개정 (전반적 인상):
 * - 1~3개월: 통상임금 100% (상한 250만원, 하한 70만원)
 * - 4~6개월: 통상임금 100% (상한 200만원)
 * - 7~12개월: 통상임금 80% (상한 160만원)
 * - 6+6 부모공동: 동일자녀 양쪽 부모 모두 사용 시 첫 6개월 가산
 *   (1개월 250 / 2개월 250 / 3개월 300 / 4개월 350 / 5개월 400 / 6개월 450)
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

const 일반 = [
  { m: 3, rate: 1.00, cap: 2500000, min: 700000 },
  { m: 6, rate: 1.00, cap: 2000000, min: 700000 },
  { m: 12, rate: 0.80, cap: 1600000, min: 700000 },
];

const 부모공동 = [2500000, 2500000, 3000000, 3500000, 4000000, 4500000];

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const monthly = parseFloat(document.getElementById("monthly").value) * 10000;
  const months = parseInt(document.getElementById("months").value, 10);
  const dual = document.getElementById("dual").checked;
  if (!monthly || !months) { alert("값을 입력하세요."); return; }
  if (monthly <= 0 || months <= 0) { alert("통상임금과 개월수는 0보다 커야 합니다."); return; }
  if (months > 12) { alert("육아휴직 급여 산정 기간은 최대 12개월입니다."); return; }

  let detail = [];
  let total = 0;

  for (let m = 1; m <= Math.min(months, 12); m++) {
    let amount;
    if (dual && m <= 6) {
      amount = Math.min(monthly, 부모공동[m - 1]);
    } else {
      const tier = 일반.find(t => m <= t.m);
      const calc = monthly * tier.rate;
      amount = Math.max(tier.min, Math.min(calc, tier.cap));
    }
    detail.push({ month: m, amount });
    total += amount;
  }

  document.getElementById("result").style.display = "block";
  document.getElementById("total").textContent = fmt(total) + "원";
  document.getElementById("avgMonthly").textContent = fmt(total / Math.min(months, 12)) + "원/월 평균";

  const list = document.getElementById("detailList");
  list.innerHTML = "";
  detail.forEach((d) => {
    const row = document.createElement("div");
    row.className = "breakdown-row";
    row.innerHTML = `<span class="label">${d.month}개월차</span><span class="value">${fmt(d.amount)}원</span>`;
    list.appendChild(row);
  });
});
