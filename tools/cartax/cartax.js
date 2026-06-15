/**
 * 자동차 취득세 계산기
 * 적용 기준: 2026년 1월 / 최종 검토: 2026-04-29
 *
 * 수치 출처
 * - 일반 승용차 7%: 지방세법 제12조 제1항
 * - 경차 4%: 지방세법 제12조 (배기량 1000cc 이하)
 * - 승합·화물 5%: 지방세법 제12조
 * - 전기·수소차 감면 한도 140만원: 지방세특례제한법 제66조 (2024년 개정으로 2년 연장 → 2026.12.31까지)
 * - 하이브리드차 감면: 2024.12.31 일몰 종료 (지방세특례제한법, 15년 만에 종료). 2025년부터 취득세 감면 적용 X → 일반 승용차와 동일 7%, 감면 0원
 * - 감면 정책은 매년 변동 가능 — 차량 등록 시 행정안전부·관할 시군구청 최종 확인 권장
 * - 공채 매입 의무: 도시철도채권 등 (시·도별 조례). 서울 기준 차량가액의 약 9%, 즉시할인 매입 시 5~7% 할인
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const price = parseFloat(document.getElementById("price").value) * 10000;
  const type = document.querySelector('input[name="type"]:checked').value;
  if (!price || price <= 0) { alert("차량 가격을 입력하세요."); return; }

  let rate, ecoDiscount = 0, name;
  if (type === "compact") { rate = 0.04; name = "경차"; }
  else if (type === "ev") { rate = 0.04; ecoDiscount = 1400000; name = "전기·수소차"; }
  else if (type === "hybrid") { rate = 0.07; ecoDiscount = 0; name = "하이브리드차"; }  // 2024.12.31 감면 일몰
  else if (type === "van") { rate = 0.05; name = "승합·화물차"; }
  else { rate = 0.07; name = "일반 승용차"; }

  let tax = price * rate;
  if (ecoDiscount > 0) tax = Math.max(0, tax - ecoDiscount);

  // 공채매입 추정 (서울 자동차 가액의 약 9%, 즉시할인구매시 5~7% 할인 → 실부담 약 0.5%)
  const bondFace = price * 0.09;
  const bondActual = bondFace * 0.06;

  const total = tax + bondActual;

  document.getElementById("result").style.display = "block";
  document.getElementById("totalCost").textContent = fmt(total) + "원";
  document.getElementById("typeLabel").textContent = name + " 기준";
  document.getElementById("acqTax").textContent = fmt(tax) + "원";
  document.getElementById("acqRate").textContent = "(취득세율 " + (rate * 100).toFixed(0) + "%" +
    (ecoDiscount > 0 ? `, 친환경 감면 -${fmt(ecoDiscount)}원` : "") + ")";
  document.getElementById("bondFace").textContent = fmt(bondFace) + "원";
  document.getElementById("bondActual").textContent = fmt(bondActual) + "원";
});
