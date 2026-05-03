/**
 * 종합부동산세 계산기
 * 적용 기준: 2026년 / 최종 검증: 2026-04-29
 *
 * 출처: 종합부동산세법 제8조·제9조
 * - 1세대 1주택 단독명의 공제 12억: 종부세법 제8조 제1항
 * - 일반(다주택·법인 제외) 공제 9억
 * - 공정시장가액비율 60%: 종부세법 시행령 (2023년부터 동일)
 * - 1주택 세율 0.5~2.7% / 2주택+ 세율 0.5~5.0%
 */

const 일반세율 = [
  { limit: 300000000,    rate: 0.005, deduct: 0 },
  { limit: 600000000,    rate: 0.007, deduct: 600000 },
  { limit: 1200000000,   rate: 0.010, deduct: 2400000 },
  { limit: 2500000000,   rate: 0.013, deduct: 6000000 },
  { limit: 5000000000,   rate: 0.015, deduct: 11000000 },
  { limit: 9400000000,   rate: 0.020, deduct: 36000000 },
  { limit: Infinity,     rate: 0.027, deduct: 101800000 },
];

const 다주택세율 = [
  { limit: 300000000,    rate: 0.005, deduct: 0 },
  { limit: 600000000,    rate: 0.007, deduct: 600000 },
  { limit: 1200000000,   rate: 0.010, deduct: 2400000 },
  { limit: 2500000000,   rate: 0.020, deduct: 14400000 },
  { limit: 5000000000,   rate: 0.030, deduct: 39400000 },
  { limit: 9400000000,   rate: 0.040, deduct: 89400000 },
  { limit: Infinity,     rate: 0.050, deduct: 183400000 },
];

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function 산출(과표, 다주택) {
  const table = 다주택 ? 다주택세율 : 일반세율;
  for (const t of table) {
    if (과표 <= t.limit) return Math.max(0, 과표 * t.rate - t.deduct);
  }
  return 0;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const 공시가합 = parseFloat(document.getElementById("totalPrice").value) * 100000000;
  const ownership = document.querySelector('input[name="own"]:checked').value;
  if (!공시가합 || 공시가합 <= 0) { alert("공시가 합계를 입력하세요."); return; }

  const 단독1주택 = ownership === "single";
  const 다주택 = ownership === "multi";
  const 공제 = 단독1주택 ? 1200000000 : 900000000;
  const 공제후 = Math.max(0, 공시가합 - 공제);
  const 과세표준 = 공제후 * 0.6;
  const 산출세액 = 산출(과세표준, 다주택);
  const 농특세 = 산출세액 * 0.2;
  const 총세액 = 산출세액 + 농특세;

  document.getElementById("result").style.display = "block";
  document.getElementById("total").textContent = fmt(총세액) + "원";
  document.getElementById("rateLabel").textContent =
    단독1주택 ? "1세대 1주택 단독명의 (12억 공제)" :
    다주택 ? "다주택 중과 적용 (9억 공제)" : "일반 (9억 공제)";
  document.getElementById("dedAmt").textContent = fmt(공제) + "원";
  document.getElementById("base").textContent = fmt(과세표준) + "원";
  document.getElementById("calc").textContent = fmt(산출세액) + "원";
  document.getElementById("rural").textContent = fmt(농특세) + "원";
});
