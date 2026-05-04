/**
 * 부동산 취득세 계산기
 * 적용 기준: 2026년 / 최종 검증: 2026-05-04
 *
 * 검증된 수치 출처
 * - 주택 유상취득 1~3% 누진(6억·9억): 지방세법 제11조 제1항 제8호
 *   국가법령정보센터: law.go.kr/법령/지방세법/제11조
 *   · 6억 이하: 1/100
 *   · 6억 초과 9억 이하: (취득가액 × 2/3억 − 3) × 1/100  (선형 1.01% ~ 2.99%)
 *   · 9억 초과: 3/100
 * - 다주택 중과세율 8%/12%: 지방세법 제13조의2 (현행 기준)
 *   · 조정대상지역 2주택 / 비조정 3주택 / 법인 신규: 8%
 *   · 조정대상지역 3주택+ / 비조정 4주택+ / 법인: 12%
 *   ※ 행정안전부 한시 인하안(6%/8%) 발표 이력 있으나 본 계산기는 현행법 유지
 * - 주택 외 부동산 매매 4%, 증여 3.5%, 상속 2.8%: 지방세법 제11조 각 호
 * - 농어촌특별세: 농어촌특별세법 제5조 (전용 85㎡ 이하 주택 비과세)
 * - 지방교육세: 지방세법 제150조·제151조 (표준세율 − 2%) × 1/5
 *
 * 미반영(별도 신청·증빙 필요)
 * - 생애최초 주택구입 200만원 감면 (지방세특례제한법 제36조의3)
 * - 일시적 2주택 1~3% 적용 특례 (지방세법 시행령 제28조의5)
 * - 지방 저가주택 주택수 제외 (공시가격 1억 이하 등)
 * - 임대등록·신혼부부·생애최초 등 기타 감면
 */

const NUMS = { 만: 10000, 억: 100000000 };

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

// 1주택 매매 표준세율 (지방세법 제11조 제1항 제8호)
function 주택1매매세율(가액) {
  if (가액 <= 6 * NUMS.억) return 0.01;
  if (가액 <= 9 * NUMS.억) {
    // (취득가액 × 2/3억 - 3) × 1/100
    const r = (가액 * 2 / (3 * NUMS.억) - 3) / 100;
    return Math.max(0.01, Math.min(0.03, r));
  }
  return 0.03;
}

// 지방교육세율 (지방세법 제151조)
// - 주택 유상거래: 본세 × 1/10 (단서 — 표준세율 50% 적용 후 1/5)
// - 다주택 중과(제13조의2): 0.4% 고정
// - 그 외: (표준세율 − 2%) × 1/5
function 교육세율(kind, 본세) {
  if (kind === "house1") return 본세 / 10;           // 1%→0.1%, 3%→0.3%
  if (kind === "multi8" || kind === "multi12") return 0.004; // 0.4% 고정
  return Math.max(0, 본세 - 0.02) / 5;              // 4%→0.4%, 3.5%→0.3%, 2.8%→0.16%
}

// 농어촌특별세 (농특세법 제5조)
// - 1주택 매매: 전용 85㎡ 이하 비과세 / 초과 시 본세 × 10%
// - 다주택 중과 8%: 0.6% (중과기준세율 차이 × 10%)
// - 다주택 중과 12%: 1.0%
// - 주택 외 매매·증여: 본세 × 10%
// - 상속: 비과세 (자경농지 등 특례 별도)
function 농특세율(kind, 본세, isLarge) {
  if (kind === "house1") return isLarge ? 본세 / 10 : 0;
  if (kind === "multi8") return 0.006;
  if (kind === "multi12") return 0.01;
  if (kind === "other" || kind === "gift") return 본세 / 10;
  return 0;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const price = parseFloat(document.getElementById("price").value || 0) * NUMS.만;
  const kind = document.querySelector('input[name="kind"]:checked').value;
  const size = document.querySelector('input[name="size"]:checked')?.value || "small";
  if (!price || price <= 0) { alert("취득가액을 입력하세요."); return; }

  let rate, label;
  switch (kind) {
    case "house1":
      rate = 주택1매매세율(price);
      label = `1주택 매매 ${(rate * 100).toFixed(2)}% (지방세법 제11조 제1항 제8호)`;
      break;
    case "multi8":
      rate = 0.08; label = "다주택 중과 8% (지방세법 제13조의2)"; break;
    case "multi12":
      rate = 0.12; label = "다주택 중과 12% (지방세법 제13조의2)"; break;
    case "other":
      rate = 0.04; label = "주택 외 부동산 매매 4%"; break;
    case "gift":
      rate = 0.035; label = "증여 취득 3.5%"; break;
    case "inherit":
      rate = 0.028; label = "상속 취득 2.8%"; break;
  }

  const 본세 = price * rate;
  const 농특 = price * 농특세율(kind, rate, size === "large");
  const 교육 = price * 교육세율(kind, rate);
  const 합계 = 본세 + 농특 + 교육;

  document.getElementById("result").style.display = "block";
  document.getElementById("totalTax").textContent = fmt(합계) + "원";
  document.getElementById("rateLabel").textContent = label;
  document.getElementById("priceShow").textContent = fmt(price) + "원";
  document.getElementById("mainTax").textContent = fmt(본세) + "원 (" + (rate * 100).toFixed(2) + "%)";
  document.getElementById("ruralTax").textContent = fmt(농특) + "원";
  document.getElementById("eduTax").textContent = fmt(교육) + "원";
  document.getElementById("totalShow").textContent = fmt(합계) + "원";
});
