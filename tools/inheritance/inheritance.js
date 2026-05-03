/**
 * 상속세 계산기 (단순 추정)
 * 적용 기준: 2026년 1월 (현행법 기준) / 최종 검증: 2026-04-29
 *
 * 검증된 수치 출처 (2026-04-29 국세청 공식 페이지 직접 확인)
 * - 상속세율 10~50% / 1억·5억·10억·30억 구간: 상증법 제26조
 *   국세청 공식: nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6529&cntntsId=7957
 * - 일괄공제 5억: 상증법 제18조 제1항
 *   기초공제 2억 + 자녀공제 1인당 5천만원 등 인적공제와 택일 적용
 *   국세청 공식: nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6528&cntntsId=7956
 * - 배우자공제: 상증법 제19조 (실제 상속분 한도, 최소 5억, 최대 30억)
 * - 신고세액공제 3%: 상증법 제69조 (자진신고 시)
 * - 채무·장례비 공제: 상증법 제14조
 *
 * ※ 정부 개정안(최고세율 50%→40%, 자녀공제 5천만원→5억 등) 발의·보도됐으나
 *   2026-04-29 국세청 공식 페이지 기준 변경 미반영 → 보수적으로 현행법 적용
 */

const 상속세표 = [
  { limit: 100000000, rate: 0.10, deduct: 0 },
  { limit: 500000000, rate: 0.20, deduct: 10000000 },
  { limit: 1000000000, rate: 0.30, deduct: 60000000 },
  { limit: 3000000000, rate: 0.40, deduct: 160000000 },
  { limit: Infinity, rate: 0.50, deduct: 460000000 },
];

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function 산출(과세표준) {
  for (const t of 상속세표) {
    if (과세표준 <= t.limit) return Math.max(0, 과세표준 * t.rate - t.deduct);
  }
  return 0;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const asset = parseFloat(document.getElementById("asset").value) * 100000000;
  const debt = parseFloat(document.getElementById("debt").value || 0) * 100000000;
  const hasSpouse = document.getElementById("spouse").checked;
  const children = parseInt(document.getElementById("children").value || 0, 10);
  if (!asset || asset <= 0) { alert("상속재산을 입력하세요."); return; }

  const 순상속재산 = Math.max(0, asset - debt);

  const 일괄공제 = 500000000;
  const 배우자공제 = hasSpouse ? Math.min(3000000000, Math.max(500000000, 순상속재산 * 0.5 / Math.max(1, children + 1))) : 0;
  const 총공제 = 일괄공제 + 배우자공제;

  const 과세표준 = Math.max(0, 순상속재산 - 총공제);
  const 산출세액 = 산출(과세표준);
  // 신고세액공제 3%
  const 신고공제 = 산출세액 * 0.03;
  const 결정세액 = Math.max(0, 산출세액 - 신고공제);

  document.getElementById("result").style.display = "block";
  document.getElementById("totalTax").textContent = fmt(결정세액) + "원";
  document.getElementById("netAsset").textContent = fmt(순상속재산) + "원";
  document.getElementById("totalDed").textContent = fmt(총공제) + "원";
  document.getElementById("spouseDed").textContent = fmt(배우자공제) + "원";
  document.getElementById("taxBase").textContent = fmt(과세표준) + "원";
  document.getElementById("calcTax").textContent = fmt(산출세액) + "원";
  document.getElementById("netRecv").textContent = fmt(순상속재산 - 결정세액) + "원";
});
