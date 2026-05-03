/**
 * 연봉 실수령액 계산기
 * 적용 기준: 2026년 1월 / 최종 검증: 2026-04-29
 *
 * 검증된 수치 출처 (2026-04-29 확인)
 * - 국민연금 9.5% (근로자 4.75%): 2025.12.29 정부 발표, 2026년부터 매년 0.5%p씩 8년간 인상
 *   → 2033년 13% 도달 / 출처: 보건복지부, 2026 새해달라지는것
 * - 국민연금 기준소득월액 상한 637만원: 2025.7.1~2026.6.30 적용 (국민연금공단)
 * - 건강보험료 3.595% (직장가입자, 2026년 시행): 합계 7.19%, 전년대비 1.48% 인상
 *   출처: 국민건강보험공단 2026년도 보험료 기준 안내
 * - 장기요양보험료 0.9448% (보수월액 대비, 2026년): 전년대비 2.90% 인상
 *   산정식: 건강보험료 × (장기요양료율 / 건강보험료율) = 보수월액 × 0.9448%
 * - 고용보험 근로자 0.9%: 고용보험법 시행령 제12조
 * - 종합소득세 누진세표: 소득세법 제55조 (2023년 개정 후 동일)
 * - 근로소득공제: 소득세법 제47조
 * - 근로소득세액공제: 소득세법 제59조
 */

const RATES = {
  국민연금: 0.0475,           // 2026년 9.5% / 2 (법정 인상)
  국민연금_월상한: 6370000,    // 2025.7~2026.6 적용 (637만원)
  건강보험: 0.03595,          // 2026년 시행 (직장가입자 기준)
  장기요양료율: 0.009448,      // 2026년 보수월액 직접 비율 (NHIS 산정 공식)
  고용보험: 0.009,            // 고용보험법 §12
};

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

function 근로소득공제(연봉) {
  if (연봉 <= 5000000) return 연봉 * 0.7;
  if (연봉 <= 15000000) return 3500000 + (연봉 - 5000000) * 0.4;
  if (연봉 <= 45000000) return 7500000 + (연봉 - 15000000) * 0.15;
  if (연봉 <= 100000000) return 12000000 + (연봉 - 45000000) * 0.05;
  return 14750000 + (연봉 - 100000000) * 0.02;
}

function 산출세액(과세표준) {
  for (const tier of 누진세표) {
    if (과세표준 <= tier.limit) {
      return Math.max(0, 과세표준 * tier.rate - tier.deduct);
    }
  }
  return 0;
}

function 근로소득세액공제(산출세액_) {
  if (산출세액_ <= 1300000) return 산출세액_ * 0.55;
  return 715000 + (산출세액_ - 1300000) * 0.3;
}

function 계산(연봉, 부양가족수) {
  const 월급 = 연봉 / 12;

  const 국민연금월 = Math.min(월급, RATES.국민연금_월상한) * RATES.국민연금;
  const 건강보험월 = 월급 * RATES.건강보험;
  const 장기요양월 = 월급 * RATES.장기요양료율;  // 2026년부터 보수월액 직접 비율 방식
  const 고용보험월 = 월급 * RATES.고용보험;

  const 사대보험월 = 국민연금월 + 건강보험월 + 장기요양월 + 고용보험월;

  const 공제 = 근로소득공제(연봉);
  const 인적공제 = 1500000 * (1 + 부양가족수);
  const 과세표준 = Math.max(0, 연봉 - 공제 - 인적공제 - 사대보험월 * 12);

  const 산출 = 산출세액(과세표준);
  const 세액공제 = Math.min(산출, 근로소득세액공제(산출));
  const 결정세액 = Math.max(0, 산출 - 세액공제);

  const 소득세월 = 결정세액 / 12;
  const 지방세월 = 소득세월 * 0.1;

  const 총공제월 = 사대보험월 + 소득세월 + 지방세월;
  const 실수령월 = 월급 - 총공제월;

  return {
    월급,
    국민연금: 국민연금월,
    건강보험: 건강보험월,
    장기요양: 장기요양월,
    고용보험: 고용보험월,
    소득세: 소득세월,
    지방세: 지방세월,
    총공제: 총공제월,
    실수령월,
    실수령연: 실수령월 * 12,
  };
}

function fmt(n) {
  return Math.round(n).toLocaleString("ko-KR");
}

function render(result) {
  document.getElementById("result").style.display = "block";
  document.getElementById("실수령월").textContent = fmt(result.실수령월) + "원";
  document.getElementById("실수령연").textContent =
    "연 " + fmt(result.실수령연) + "원";

  document.getElementById("월급").textContent = fmt(result.월급) + "원";
  document.getElementById("국민연금").textContent = fmt(result.국민연금) + "원";
  document.getElementById("건강보험").textContent = fmt(result.건강보험) + "원";
  document.getElementById("장기요양").textContent = fmt(result.장기요양) + "원";
  document.getElementById("고용보험").textContent = fmt(result.고용보험) + "원";
  document.getElementById("소득세").textContent = fmt(result.소득세) + "원";
  document.getElementById("지방세").textContent = fmt(result.지방세) + "원";
  document.getElementById("총공제").textContent = fmt(result.총공제) + "원";
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const 연봉만원 = parseFloat(document.getElementById("연봉").value);
  const 부양가족 = parseInt(document.getElementById("부양가족").value, 10) || 0;

  if (!연봉만원 || 연봉만원 <= 0) {
    alert("연봉을 올바르게 입력해주세요.");
    return;
  }

  const result = 계산(연봉만원 * 10000, 부양가족);
  render(result);
  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
});
