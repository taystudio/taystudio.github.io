/**
 * 증여세 계산기 (단순 추정)
 * 적용 기준: 2026년 / 최종 검증: 2026-05-04 (국세청 공식 페이지 직접 확인)
 *
 * 검증된 수치 출처
 * - 증여세율 10~50% / 1억·5억·10억·30억 구간: 상증법 제56조
 *   (상속세율 제26조와 동일 누진세율)
 *   국세청: nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6532&cntntsId=7960
 *   · 1억 이하 10% (누진공제 0)
 *   · 1억~5억 20% (1천만원)
 *   · 5억~10억 30% (6천만원)
 *   · 10억~30억 40% (1억6천만원)
 *   · 30억 초과 50% (4억6천만원)
 * - 증여재산공제 (10년 합산): 상증법 제53조
 *   · 배우자 6억 / 직계존속 5천(미성년 2천) / 직계비속 5천 / 기타친족 1천 / 그 외 0
 * - 혼인·출산 증여재산공제 1억: 상증법 제53조의2 (2024.1.1 시행)
 *   · 직계존속에게서, 혼인일 전후 2년 또는 출생·입양 후 2년 이내
 *   · 혼인+출산 합산 1억 한도
 * - 세대생략 할증 30%/40%: 상증법 제57조
 *   · 미성년자 + 증여재산 20억 초과 시 40%
 * - 신고세액공제 3%: 상증법 제69조 (자진신고 시)
 *
 * ※ 정부 개정안(자녀공제 확대·최고세율 인하 등)은 2026-05-04 국세청 공식
 *   페이지 기준 미반영 → 보수적으로 현행법 적용
 */

const 누진세표 = [
  { limit: 100000000, rate: 0.10, deduct: 0 },
  { limit: 500000000, rate: 0.20, deduct: 10000000 },
  { limit: 1000000000, rate: 0.30, deduct: 60000000 },
  { limit: 3000000000, rate: 0.40, deduct: 160000000 },
  { limit: Infinity, rate: 0.50, deduct: 460000000 },
];

const 공제표 = {
  spouse: 600000000,
  lineal: 50000000,
  minor: 20000000,
  descend: 50000000,
  other: 10000000,
  none: 0,
};

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function 산출(과세표준) {
  for (const t of 누진세표) {
    if (과세표준 <= t.limit) return Math.max(0, 과세표준 * t.rate - t.deduct);
  }
  return 0;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("amount").value || 0) * 10000;
  const prior = parseFloat(document.getElementById("prior").value || 0) * 10000;
  const rel = document.querySelector('input[name="rel"]:checked').value;
  const marriage = document.getElementById("marriage").checked;
  const generation = document.getElementById("generation").checked;
  if (!amount || amount <= 0) { alert("증여재산을 입력하세요."); return; }

  const 합산증여 = amount + prior;
  let 공제 = 공제표[rel] || 0;

  // 혼인·출산 공제는 직계존속 → 자녀(성년·미성년)일 때만 적용
  if (marriage && (rel === "lineal" || rel === "minor")) {
    공제 += 100000000;
  }

  // 합산증여 기준 공제 계산 후, 사전증여분에서 공제분을 먼저 소진했다고 가정
  // (보수적: 이번 증여분 과세표준 = max(0, 합산 - 공제) - max(0, prior - 공제))
  const 합산과세표준 = Math.max(0, 합산증여 - 공제);
  const 사전과세표준 = Math.max(0, prior - 공제);
  const 이번과세표준 = Math.max(0, 합산과세표준 - 사전과세표준);

  let 산출세액 = 산출(이번과세표준);

  // 세대생략 할증
  let 할증액 = 0;
  if (generation) {
    // 미성년 + 증여재산 20억 초과 → 40%, 그 외 30%
    const 할증률 = (rel === "minor" && amount > 2000000000) ? 0.40 : 0.30;
    할증액 = 산출세액 * 할증률;
  }
  const 산출합계 = 산출세액 + 할증액;

  // 신고세액공제 3% (자진신고)
  const 신고공제 = 산출합계 * 0.03;
  const 결정세액 = Math.max(0, 산출합계 - 신고공제);

  // 적용 세율 라벨
  const 적용구간 = 누진세표.find(t => 이번과세표준 <= t.limit);
  const 라벨 =
    이번과세표준 === 0 ? "공제 한도 내 (세액 없음)" :
    `과표 ${(이번과세표준/100000000).toFixed(2)}억 → ${(적용구간.rate*100)}% 누진`;

  document.getElementById("result").style.display = "block";
  document.getElementById("totalTax").textContent = fmt(결정세액) + "원";
  document.getElementById("rateLabel").textContent = 라벨;
  document.getElementById("totalAmt").textContent = fmt(합산증여) + "원";
  document.getElementById("dedAmt").textContent = fmt(공제) + "원";
  document.getElementById("taxBase").textContent = fmt(이번과세표준) + "원";
  document.getElementById("calcTax").textContent = fmt(산출세액) + "원";
  document.getElementById("genTax").textContent = fmt(할증액) + "원";
  document.getElementById("filingDed").textContent = "−" + fmt(신고공제) + "원";
  document.getElementById("finalTax").textContent = fmt(결정세액) + "원";
});
