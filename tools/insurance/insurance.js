/**
 * 4대보험료 계산기
 * 적용 기준: 2026년 1월 / 최종 검증: 2026-04-29
 *
 * 검증된 수치 출처 (2026-04-29 확인)
 * - 국민연금 9.5% (각 4.75%): 2026년부터 매년 0.5%p씩 8년간 인상 → 2033년 13%
 *   월상한 637만원 (2025.7~2026.6, 보건복지부 고시)
 * - 건강보험 7.19% (각 3.595%, 2026년 시행): NHIS 2026년도 보험료 기준 안내
 * - 장기요양 0.9448% (보수월액 직접 비율, 2026년 시행)
 *   산정식: 보수월액 × 0.9448% = 건강보험료 × 13.14%
 * - 고용보험 근로자 0.9%, 사업주 0.9%+고용안정·직업능력개발사업 0.25~0.85%
 *   (150인 미만 사업장 0.25% 기준, 합계 1.25% 적용)
 * - 산재보험 업종별 차이 (0.7~18.6%): 산업재해보상보험법 제14조
 *   2025년 전 업종 평균 약 1.47% / 본 계산기는 단순 평균 1.2% 사용
 */

const RATES = {
  국민연금_근로: 0.0475,           // 2026년 9.5% / 2
  국민연금_사업주: 0.0475,
  국민연금_월상한: 6370000,        // 2025.7~2026.6 (637만원) (2026.7.1부터 6,590,000원으로 인상 예정 — 시행 시 갱신)
  건강보험_근로: 0.03595,          // 2026년 시행
  건강보험_사업주: 0.03595,
  장기요양료율: 0.009448,          // 보수월액 직접 비율 (2026년)
  고용보험_근로: 0.009,
  고용보험_사업주: 0.0125,         // 0.9% + 0.35% (안정/능력개발 평균)
  산재보험_사업주_평균: 0.012,     // 업종별 큰 차이 있음 — 평균 추정
};

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const monthly = parseFloat(document.getElementById("monthly").value);
  if (!monthly || monthly <= 0) { alert("월 급여를 입력하세요."); return; }

  const npBase = Math.min(monthly, RATES.국민연금_월상한);
  const np_w = npBase * RATES.국민연금_근로;
  const np_e = npBase * RATES.국민연금_사업주;

  const hi_w = monthly * RATES.건강보험_근로;
  const hi_e = monthly * RATES.건강보험_사업주;
  const ltc_w = monthly * RATES.장기요양료율 / 2;  // 근로자/사업주 절반씩
  const ltc_e = monthly * RATES.장기요양료율 / 2;

  const ei_w = monthly * RATES.고용보험_근로;
  const ei_e = monthly * RATES.고용보험_사업주;

  const wc_e = monthly * RATES.산재보험_사업주_평균;

  const totalWorker = np_w + hi_w + ltc_w + ei_w;
  const totalEmployer = np_e + hi_e + ltc_e + ei_e + wc_e;

  document.getElementById("result").style.display = "block";
  document.getElementById("workerTotal").textContent = fmt(totalWorker) + "원";
  document.getElementById("workerSub").textContent = "월 급여의 " + ((totalWorker / monthly) * 100).toFixed(2) + "%";

  document.getElementById("np_w").textContent = fmt(np_w) + "원";
  document.getElementById("hi_w").textContent = fmt(hi_w) + "원";
  document.getElementById("ltc_w").textContent = fmt(ltc_w) + "원";
  document.getElementById("ei_w").textContent = fmt(ei_w) + "원";

  document.getElementById("np_e").textContent = fmt(np_e) + "원";
  document.getElementById("hi_e").textContent = fmt(hi_e) + "원";
  document.getElementById("ltc_e").textContent = fmt(ltc_e) + "원";
  document.getElementById("ei_e").textContent = fmt(ei_e) + "원";
  document.getElementById("wc_e").textContent = fmt(wc_e) + "원";
  document.getElementById("employerTotal").textContent = fmt(totalEmployer) + "원";
});
