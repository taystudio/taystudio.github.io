/**
 * 부동산 중개수수료 계산기
 * 적용 기준: 2024.10.19~ 개정 / 최종 검증: 2026-04-29
 *
 * 출처: 공인중개사법 시행규칙 제20조 [별표 1·2]
 * - 2014년 이후 동일 구조, 2024.10 일부 개정
 */

const 매매요율 = [
  { limit: 50000000,    rate: 0.006, cap: 250000 },
  { limit: 200000000,   rate: 0.005, cap: 800000 },
  { limit: 900000000,   rate: 0.004, cap: null },
  { limit: 1200000000,  rate: 0.005, cap: null },
  { limit: 1500000000,  rate: 0.006, cap: null },
  { limit: Infinity,    rate: 0.007, cap: null, negotiable: true },
];

const 임대요율 = [
  { limit: 50000000,    rate: 0.005, cap: 200000 },
  { limit: 100000000,   rate: 0.004, cap: 300000 },
  { limit: 600000000,   rate: 0.003, cap: null },
  { limit: 1200000000,  rate: 0.004, cap: null },
  { limit: 1500000000,  rate: 0.005, cap: null },
  { limit: Infinity,    rate: 0.006, cap: null, negotiable: true },
];

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function 계산(가액, type) {
  const table = type === "sale" ? 매매요율 : 임대요율;
  for (const tier of table) {
    if (가액 <= tier.limit) {
      const fee = 가액 * tier.rate;
      const cap = tier.cap ? Math.min(fee, tier.cap) : fee;
      return { fee: cap, rate: tier.rate, cap: tier.cap, negotiable: tier.negotiable };
    }
  }
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const price = parseFloat(document.getElementById("price").value) * 10000;
  const deposit = parseFloat(document.getElementById("deposit").value || 0) * 10000;
  const rent = parseFloat(document.getElementById("rent").value || 0) * 10000;
  const type = document.querySelector('input[name="type"]:checked').value;

  let 가액;
  if (type === "sale") {
    if (!price || price <= 0) { alert("매매가를 입력하세요."); return; }
    가액 = price;
  } else {
    가액 = deposit + rent * 100;
    if (가액 < 50000000) 가액 = Math.max(가액, deposit + rent * 70);
  }

  if (!가액 || 가액 <= 0) { alert("거래 금액을 입력하세요."); return; }

  const r = 계산(가액, type);
  const vat = r.fee * 0.1;

  document.getElementById("result").style.display = "block";
  document.getElementById("totalFee").textContent = fmt(r.fee) + "원";
  document.getElementById("rate").textContent =
    "거래가액 " + fmt(가액) + "원 × " + (r.rate * 100).toFixed(1) + "%" +
    (r.cap ? ` (한도 ${fmt(r.cap)}원)` : "") +
    (r.negotiable ? " (협의)" : "");
  document.getElementById("baseFee").textContent = fmt(r.fee) + "원";
  document.getElementById("vatFee").textContent = fmt(vat) + "원";
  document.getElementById("totalWithVat").textContent = fmt(r.fee + vat) + "원";
});
