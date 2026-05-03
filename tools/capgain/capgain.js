/**
 * 양도소득세 계산기 (1세대 1주택 / 다주택)
 * 적용 기준: 2026년 1월 / 최종 검토: 2026-04-29
 *
 * 수치 출처
 * - 1세대 1주택 12억 비과세: 소득세법 제89조 제1항 제3호
 *   (2021.12.8 개정으로 9억 → 12억 상향)
 * - 양도세 누진세율: 소득세법 제104조 (종합소득세 누진세표와 동일)
 * - 단기보유 중과세율 (1년 미만 70%, 1~2년 60%): 소득세법 제104조 제1항
 * - 장기보유특별공제: 소득세법 제95조
 *   1세대 1주택: 보유 4%/년 + 거주 4%/년, 최대 80%(보유10년+거주10년)
 *   기타 부동산: 2~30% (3년부터, 15년 이상 30% 한도)
 * - 다주택 중과세율 (+20%/+30%): 소득세법 제104조 제7항
 *   현재 조정대상지역 한정 (2024년 기준 서울 강남3구·용산구만)
 * - 양도소득 기본공제 250만원: 소득세법 제103조
 */

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

function 산출세액(과세표준, 추가세율) {
  for (const tier of 누진세표) {
    if (과세표준 <= tier.limit) {
      const base = 과세표준 * tier.rate - tier.deduct;
      return Math.max(0, base + 과세표준 * 추가세율);
    }
  }
  return 0;
}

function 장기보유공제율(보유년, 거주년, 단독주택) {
  if (단독주택) {
    const 보유 = Math.min(10, Math.max(0, 보유년 - 2)) * 0.04;
    const 거주 = Math.min(10, Math.max(0, 거주년 - 2)) * 0.04;
    return Math.min(0.8, 보유 + 거주);
  }
  if (보유년 < 3) return 0;
  const 년 = Math.min(15, 보유년);
  return (년 - 2) * 0.02;
}

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const sale = parseFloat(document.getElementById("sale").value) * 10000;
  const cost = parseFloat(document.getElementById("cost").value) * 10000;
  const fee = parseFloat(document.getElementById("fee").value || 0) * 10000;
  const hold = parseFloat(document.getElementById("hold").value);
  const live = parseFloat(document.getElementById("live").value || 0);
  const ownership = document.querySelector('input[name="ownership"]:checked').value;
  if (!sale || !cost) { alert("값을 입력하세요."); return; }

  const 양도차익 = sale - cost - fee;
  let 비과세 = false, 추가세율 = 0, 단독1주택 = false;

  if (ownership === "single1") {
    단독1주택 = true;
    if (sale <= 1200000000) 비과세 = true;
  } else if (ownership === "multi2") {
    추가세율 = 0.20;
  } else if (ownership === "multi3") {
    추가세율 = 0.30;
  }

  if (양도차익 <= 0) {
    alert("양도차익이 없거나 손실입니다 (세금 0원).");
    return;
  }

  let 과세대상양도차익 = 양도차익;
  if (단독1주택 && sale > 1200000000) {
    과세대상양도차익 = 양도차익 * (sale - 1200000000) / sale;
  } else if (비과세) {
    과세대상양도차익 = 0;
  }

  const 공제율 = 장기보유공제율(hold, live, 단독1주택);
  const 장특공 = 과세대상양도차익 * 공제율;
  const 양도소득금액 = 과세대상양도차익 - 장특공;
  const 기본공제 = Math.min(2500000, 양도소득금액);
  const 과세표준 = Math.max(0, 양도소득금액 - 기본공제);

  let 산출;
  if (hold < 1) 산출 = 과세표준 * 0.7;
  else if (hold < 2) 산출 = 과세표준 * 0.6;
  else 산출 = 산출세액(과세표준, 추가세율);

  const 지방세 = 산출 * 0.1;
  const 총세액 = 산출 + 지방세;

  document.getElementById("result").style.display = "block";
  document.getElementById("totalTax").textContent = fmt(총세액) + "원";
  document.getElementById("rateLabel").textContent =
    비과세 ? "1세대 1주택 12억 비과세" :
    추가세율 > 0 ? "다주택자 +" + (추가세율 * 100) + "% 중과" :
    hold < 2 ? "단기보유 중과" : "기본세율";
  document.getElementById("gain").textContent = fmt(양도차익) + "원";
  document.getElementById("taxableGain").textContent = fmt(과세대상양도차익) + "원";
  document.getElementById("longHold").textContent = fmt(장특공) + "원 (" + (공제율 * 100).toFixed(0) + "%)";
  document.getElementById("taxBase").textContent = fmt(과세표준) + "원";
  document.getElementById("calcTax").textContent = fmt(산출) + "원";
  document.getElementById("localTax").textContent = fmt(지방세) + "원";
});
