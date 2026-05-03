/**
 * 재산세 계산기 (주택 기준)
 * 적용 기준: 2026년 / 최종 검증: 2026-04-29
 *
 * 출처: 지방세법 제111조·제111조의2 (주택 재산세 세율)
 * - 공정시장가액비율 (주택): 60% (2023년부터 동일)
 * - 1세대 1주택 특례세율 (공시가 9억 이하): 0.05% 인하 적용
 * - 도시지역분(0.14%), 지방교육세(20%) 별도 가산
 */

const 일반세율 = [
  { limit: 60000000,  rate: 0.001,  deduct: 0 },
  { limit: 150000000, rate: 0.0015, deduct: 30000 },
  { limit: 300000000, rate: 0.0025, deduct: 180000 },
  { limit: Infinity,  rate: 0.004,  deduct: 630000 },
];

const 특례세율 = [
  { limit: 60000000,  rate: 0.0005, deduct: 0 },
  { limit: 150000000, rate: 0.001,  deduct: 30000 },
  { limit: 300000000, rate: 0.002,  deduct: 180000 },
  { limit: 540000000, rate: 0.0035, deduct: 630000 },
  { limit: Infinity,  rate: 0.0035, deduct: 630000 },
];

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function 산출(과세표준, 특례) {
  const table = 특례 ? 특례세율 : 일반세율;
  for (const t of table) {
    if (과세표준 <= t.limit) {
      return Math.max(0, 과세표준 * t.rate - t.deduct);
    }
  }
  return 0;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const 공시가 = parseFloat(document.getElementById("price").value) * 100000000;
  const 단독1주택 = document.getElementById("single").checked;
  if (!공시가 || 공시가 <= 0) { alert("공시가격을 입력하세요."); return; }

  const 특례적용 = 단독1주택 && 공시가 <= 900000000;
  const 과세표준 = 공시가 * 0.6;

  const 재산세 = 산출(과세표준, 특례적용);
  const 도시지역분 = 과세표준 * 0.0014;
  const 지방교육세 = 재산세 * 0.2;
  const 총합 = 재산세 + 도시지역분 + 지방교육세;

  document.getElementById("result").style.display = "block";
  document.getElementById("total").textContent = fmt(총합) + "원";
  document.getElementById("rateLabel").textContent =
    특례적용 ? "1세대 1주택 특례세율 적용" : "일반세율 적용";
  document.getElementById("base").textContent = fmt(과세표준) + "원";
  document.getElementById("propTax").textContent = fmt(재산세) + "원";
  document.getElementById("urban").textContent = fmt(도시지역분) + "원";
  document.getElementById("eduTax").textContent = fmt(지방교육세) + "원";
});
