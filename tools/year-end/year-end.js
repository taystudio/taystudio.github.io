/**
 * 연말정산 환급액 계산기 (단순 추정)
 * 적용 기준: 2025년 귀속분 (2026년 신고) / 최종 검증: 2026-04-29
 *
 * 출처
 * - 근로소득공제: 소득세법 제47조
 * - 인적공제: 소득세법 제50조
 * - 신용카드 등 사용금액 소득공제: 조세특례제한법 제126조의2
 * - 누진세율: 소득세법 제55조
 * - 표준세액공제 13만원: 소득세법 제59조의4
 *
 * 본 계산기는 주요 항목만 반영한 단순 추정 — 실제 신고는 홈택스 권장
 */

function 근로소득공제(연봉) {
  if (연봉 <= 5000000) return 연봉 * 0.7;
  if (연봉 <= 15000000) return 3500000 + (연봉 - 5000000) * 0.4;
  if (연봉 <= 45000000) return 7500000 + (연봉 - 15000000) * 0.15;
  if (연봉 <= 100000000) return 12000000 + (연봉 - 45000000) * 0.05;
  return 14750000 + (연봉 - 100000000) * 0.02;
}

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

function 산출세액(과표) {
  for (const t of 누진세표) {
    if (과표 <= t.limit) return Math.max(0, 과표 * t.rate - t.deduct);
  }
  return 0;
}

function 카드공제(연봉, 카드, 체크, 현금) {
  const 최저사용 = 연봉 * 0.25;
  const 합계 = 카드 + 체크 + 현금;
  if (합계 <= 최저사용) return 0;
  const 신용공제 = Math.max(0, 카드 - 최저사용 * (카드 / 합계)) * 0.15;
  const 체크공제 = Math.max(0, 체크) * 0.30;
  const 현금공제 = Math.max(0, 현금) * 0.30;
  const 총공제 = 신용공제 + 체크공제 + 현금공제;
  const 한도 = 연봉 <= 70000000 ? 3000000 : 2500000;
  return Math.min(총공제, 한도);
}

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const 연봉 = parseFloat(document.getElementById("salary").value) * 10000;
  const 부양 = parseInt(document.getElementById("family").value || 0, 10);
  const 카드 = parseFloat(document.getElementById("credit").value || 0) * 10000;
  const 체크 = parseFloat(document.getElementById("check").value || 0) * 10000;
  const 현금 = parseFloat(document.getElementById("cash").value || 0) * 10000;
  const 기납부 = parseFloat(document.getElementById("paid").value || 0) * 10000;

  if (!연봉 || 연봉 <= 0) { alert("연봉을 입력하세요."); return; }

  const 근로공제 = 근로소득공제(연봉);
  const 인적 = 1500000 * (1 + 부양);
  const 카드공 = 카드공제(연봉, 카드, 체크, 현금);
  const 과표 = Math.max(0, 연봉 - 근로공제 - 인적 - 카드공);
  const 산출 = 산출세액(과표);

  // 근로소득세액공제
  const 세액공제 = 산출 <= 1300000 ? 산출 * 0.55 : 715000 + (산출 - 1300000) * 0.3;
  const 세액공제한도 = 연봉 <= 33000000 ? 740000 : 연봉 <= 70000000 ? 660000 : 500000;
  const 적용세액공제 = Math.min(세액공제, 세액공제한도);

  const 결정세액 = Math.max(0, 산출 - 적용세액공제);
  const 지방세 = 결정세액 * 0.1;
  const 총세액 = 결정세액 + 지방세;
  const 환급 = 기납부 - 총세액;

  document.getElementById("result").style.display = "block";
  document.getElementById("refund").textContent = fmt(Math.abs(환급)) + "원";
  document.getElementById("refundLabel").textContent =
    환급 > 0 ? "환급 (돌려받음)" : 환급 < 0 ? "추가 납부" : "정확히 일치";
  document.getElementById("base").textContent = fmt(과표) + "원";
  document.getElementById("calcTax").textContent = fmt(산출) + "원";
  document.getElementById("credit_d").textContent = fmt(적용세액공제) + "원";
  document.getElementById("decided").textContent = fmt(총세액) + "원";
});
