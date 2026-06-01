/**
 * 재산세 계산기 (주택 기준)
 * 적용 기준: 2026년 / 최종 검증: 2026-06-01
 *
 * 출처: 지방세법 제111조·제111조의2 + 시행령 제109조 (공정시장가액비율)
 * - 공정시장가액비율 (일반 주택): 60% (2023년부터 동일)
 * - 1세대 1주택 특례 (시가표준 차등 한시 적용, 2026년도):
 *     3억 이하 → 43% · 3억 초과 ~ 6억 이하 → 44% · 6억 초과 → 45%
 *     근거: 지방세법 시행령 제109조 (2026.5.29 개정, 2026.6.1 시행)
 *     출처: 행정안전부 「1주택자 재산세 부담 올해도 지속 완화」 정책 발표
 * - 1세대 1주택 특례세율 (공시가 9억 이하): 0.05%p 인하 적용 (제111조의2)
 * - 도시지역분(과세표준의 0.14%), 지방교육세(재산세의 20%) 별도 가산
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

// 공정시장가액비율 (지방세법 시행령 제109조)
//   - 일반 주택: 60% 고정
//   - 1세대 1주택 특례 (2026년도): 시가표준 3억/6억 경계 차등 (43/44/45%)
function 공정시장가액비율(공시가_, 특례_) {
  if (!특례_) return 0.60;
  if (공시가_ <= 300000000) return 0.43;
  if (공시가_ <= 600000000) return 0.44;
  return 0.45;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const 공시가 = parseFloat(document.getElementById("price").value) * 100000000;
  const 단독1주택 = document.getElementById("single").checked;
  if (!공시가 || 공시가 <= 0) { alert("공시가격을 입력하세요."); return; }

  const 특례적용 = 단독1주택 && 공시가 <= 900000000;
  const fmvRate = 공정시장가액비율(공시가, 특례적용);
  const 과세표준 = 공시가 * fmvRate;

  const 재산세 = 산출(과세표준, 특례적용);
  const 도시지역분 = 과세표준 * 0.0014;
  const 지방교육세 = 재산세 * 0.2;
  const 총합 = 재산세 + 도시지역분 + 지방교육세;

  document.getElementById("result").style.display = "block";
  document.getElementById("total").textContent = fmt(총합) + "원";
  document.getElementById("rateLabel").textContent =
    특례적용 ? `1세대 1주택 특례 적용 (공시 ${(공시가/100000000).toFixed(1)}억 → 공정시장가액 ${(fmvRate*100).toFixed(0)}%)`
              : "일반세율 적용 (공정시장가액 60%)";
  document.getElementById("base").textContent = fmt(과세표준) + "원";
  document.getElementById("propTax").textContent = fmt(재산세) + "원";
  document.getElementById("urban").textContent = fmt(도시지역분) + "원";
  document.getElementById("eduTax").textContent = fmt(지방교육세) + "원";
});
