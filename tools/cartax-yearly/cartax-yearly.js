/**
 * 연간 자동차세 계산기
 * 적용 기준: 2026년 / 최종 검증: 2026-04-29
 *
 * 출처: 지방세법 제127조 (자동차세)
 *
 * 비영업용 승용차 cc당 세액
 * - 1000cc 이하: 80원
 * - 1600cc 이하: 140원
 * - 1600cc 초과: 200원
 *
 * 차령 경감 (지방세법 시행령 §125)
 * - 3년차부터 매년 5%씩 경감, 12년 이상 50% 한도
 *
 * 지방교육세: 자동차세의 30%
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function ccSeRate(cc) {
  if (cc <= 1000) return 80;
  if (cc <= 1600) return 140;
  return 200;
}

function 차령경감율(year) {
  if (year < 3) return 0;
  return Math.min(0.5, (year - 2) * 0.05);
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const cc = parseInt(document.getElementById("cc").value, 10);
  const year = parseInt(document.getElementById("year").value, 10);
  if (!cc || year === undefined) { alert("값을 입력하세요."); return; }

  const baseRate = ccSeRate(cc);
  const baseTax = cc * baseRate;
  const reduction = 차령경감율(year);
  const tax = baseTax * (1 - reduction);
  const eduTax = tax * 0.3;
  const total = tax + eduTax;

  document.getElementById("result").style.display = "block";
  document.getElementById("total").textContent = fmt(total) + "원";
  document.getElementById("rateInfo").textContent =
    `cc당 ${baseRate}원 × ${cc}cc` + (reduction > 0 ? ` (차령 ${(reduction * 100).toFixed(0)}% 경감)` : "");
  document.getElementById("baseTax").textContent = fmt(baseTax) + "원";
  document.getElementById("reduced").textContent = fmt(tax) + "원";
  document.getElementById("eduTax").textContent = fmt(eduTax) + "원";
  document.getElementById("half").textContent = fmt(total / 2) + "원 (6월·12월)";
});
