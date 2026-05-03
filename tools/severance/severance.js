/**
 * 퇴직금 계산기 (근로기준법 평균임금 기준)
 * 적용 기준: 2026년 1월 / 최종 검토: 2026-04-29
 *
 * 수치 출처
 * - 퇴직금 산정 (1일 평균임금 × 30 × (재직일수/365)): 근로자퇴직급여 보장법 제8조
 * - 평균임금 정의: 근로기준법 제2조 제1항 제6호 — "산정 사유 발생 직전 3개월 임금총액 / 그 기간의 총일수(90일 가정)"
 *   ※ 본 계산기는 90일 고정 사용 (실제는 89~92일 가변)
 * - 연간 상여금 환산: 근로기준법 시행령 제2조 제1항 — 12개월 분의 3개월(1/4) 합산
 * - 퇴직소득세 (근속연수공제·환산급여공제·누진세율): 소득세법 제48조·제55조·제143조의4
 * - 1년 미만 근속 시 퇴직금 없음: 근로자퇴직급여 보장법 제4조 단서
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function diffDays(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const entryStr = document.getElementById("entry").value;
  const exitStr = document.getElementById("exit").value;
  const month1 = parseFloat(document.getElementById("month1").value) || 0;
  const month2 = parseFloat(document.getElementById("month2").value) || 0;
  const month3 = parseFloat(document.getElementById("month3").value) || 0;
  const annualBonus = parseFloat(document.getElementById("annualBonus").value || 0);

  if (!entryStr || !exitStr || !month1 || !month2 || !month3) { alert("필수 값을 입력하세요."); return; }

  const entry = new Date(entryStr);
  const exit = new Date(exitStr);

  const totalDays = diffDays(entry, exit);
  if (totalDays < 365) { alert("재직 1년 미만은 퇴직금 지급 의무 대상이 아닙니다."); return; }

  const 평균임금일급 = (month1 + month2 + month3 + annualBonus * 0.25) / 90;
  const 퇴직금 = 평균임금일급 * 30 * (totalDays / 365);

  // 퇴직소득세 (단순 추정 - 근속연수공제 고려한 매우 간략한 버전)
  const 근속년 = totalDays / 365;
  const 근속공제 = 근속년 <= 5 ? 1000000 * 근속년 :
                  근속년 <= 10 ? 5000000 + 2000000 * (근속년 - 5) :
                  근속년 <= 20 ? 15000000 + 2500000 * (근속년 - 10) :
                  40000000 + 3000000 * (근속년 - 20);
  const 환산소득 = Math.max(0, (퇴직금 - 근속공제) * 12 / 근속년);
  const 환산세액 = 환산소득 < 14000000 ? 환산소득 * 0.06 :
                  환산소득 < 50000000 ? 환산소득 * 0.15 - 1260000 :
                  환산소득 < 88000000 ? 환산소득 * 0.24 - 5760000 :
                  환산소득 * 0.35 - 15440000;
  const 추정세액 = Math.max(0, 환산세액 * 근속년 / 12);
  const 실수령 = 퇴직금 - 추정세액;

  document.getElementById("result").style.display = "block";
  document.getElementById("severanceTotal").textContent = fmt(퇴직금) + "원";
  document.getElementById("workYears").textContent =
    "재직 " + Math.floor(근속년) + "년 " + Math.floor((근속년 % 1) * 12) + "개월";
  document.getElementById("avgDaily").textContent = fmt(평균임금일급) + "원";
  document.getElementById("totalDaysVal").textContent = totalDays.toLocaleString("ko-KR") + "일";
  document.getElementById("estTax").textContent = fmt(추정세액) + "원";
  document.getElementById("netSeverance").textContent = fmt(실수령) + "원";
});
