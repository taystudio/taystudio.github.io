/**
 * 전월세 전환 계산기
 * 적용 기준: 2026년 / 최종 검증: 2026-05-04
 *
 * 검증된 수치 출처
 * - 주택 전월세 전환율 상한: 주택임대차보호법 제7조의2 + 시행령 제9조
 *   · min(기준금리 + 2.0%, 연 10% 고정)  (시행령 제9조 = 연 1할 고정)
 *   국가법령정보센터: law.go.kr/법령/주택임대차보호법
 * - 상가 전월세 전환율 상한: 상가건물임대차보호법 제12조 + 시행령 제5조
 *   · min(12%, 기준금리 × 4.5배)
 * - 한국은행 기준금리 2.50% (2026-04-10 통화정책방향 회의 동결)
 *   bok.or.kr/portal/singl/baseRate/list.do
 *
 * 계산식
 * - 전세→월세: 월세 = (감액 보증금 × 전환율) / 12
 * - 월세→전세: 추가 보증금 = (월세 × 12) / 전환율
 *
 * 주의: 법정 상한은 계약갱신·전환 요구 시 거부 가능 기준이지, 신규 자유계약 강제 사항 아님.
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

const dirRadios = document.querySelectorAll('input[name="dir"]');
const newDepositField = document.getElementById("newDepositField");
const rentField = document.getElementById("rentField");

dirRadios.forEach(r => r.addEventListener("change", () => {
  const dir = document.querySelector('input[name="dir"]:checked').value;
  if (dir === "d2m") {
    newDepositField.style.display = "";
    rentField.style.display = "none";
  } else {
    newDepositField.style.display = "none";
    rentField.style.display = "";
  }
}));

function 전환율(기준금리, kind) {
  if (kind === "shop") {
    // 상가: min(12%, 기준금리 × 4.5)
    return Math.min(0.12, 기준금리 * 4.5);
  }
  // 주택: min(기준금리 + 2%, 연 10% 고정)
  return Math.min(기준금리 + 0.02, 0.10);
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const dir = document.querySelector('input[name="dir"]:checked').value;
  const kind = document.querySelector('input[name="kind"]:checked').value;
  const baseRate = parseFloat(document.getElementById("rate").value || 0) / 100;
  const orig = parseFloat(document.getElementById("origDeposit").value || 0) * 10000;

  if (!(baseRate > 0)) { alert("기준금리를 입력하세요."); return; }

  const formula1 = baseRate + 0.02;
  const formula2 = (kind === "shop") ? baseRate * 4.5 : 0.10;
  const applied = 전환율(baseRate, kind);

  document.getElementById("formula1").textContent = (formula1 * 100).toFixed(2) + "%";
  document.getElementById("formula2").textContent = (formula2 * 100).toFixed(2) + "%";
  document.getElementById("formula2Label").textContent = (kind === "shop") ? "기준금리 × 4.5" : "연 10% 고정 상한";
  document.getElementById("appliedRate").textContent = (applied * 100).toFixed(2) + "%";

  if (dir === "d2m") {
    // 전세 → 월세: 보증금 일부 감액분을 월세로 환산
    const newDep = parseFloat(document.getElementById("newDeposit").value || 0) * 10000;
    if (!orig || newDep === undefined || newDep < 0) { alert("보증금 값을 입력하세요."); return; }
    if (newDep >= orig) { alert("전환 후 보증금이 현재 보증금보다 작아야 합니다."); return; }
    const diff = orig - newDep;
    const 월세 = (diff * applied) / 12;
    document.getElementById("result").style.display = "block";
    document.getElementById("resultLabel").textContent = "환산 월세 (법정 상한)";
    document.getElementById("totalValue").textContent = fmt(월세) + "원 / 월";
    document.getElementById("rateLabel").textContent =
      `보증금 ${fmt(diff)}원을 월세로 전환 시`;
    document.getElementById("diffDeposit").textContent = fmt(diff) + "원 (감액분)";
    document.getElementById("resultBottomLabel").textContent = "월세 환산액";
    document.getElementById("resultMain").textContent = fmt(월세) + "원";
  } else {
    // 월세 → 전세: 월세를 보증금으로 환산
    const rent = parseFloat(document.getElementById("rent").value || 0) * 10000;
    if (!rent || rent <= 0) { alert("월세를 입력하세요."); return; }
    const 추가보증금 = (rent * 12) / applied;
    const 환산보증금합 = orig + 추가보증금;
    document.getElementById("result").style.display = "block";
    document.getElementById("resultLabel").textContent = "환산 전세 보증금";
    document.getElementById("totalValue").textContent = fmt(환산보증금합) + "원";
    document.getElementById("rateLabel").textContent =
      `월세 ${fmt(rent)}원을 보증금으로 환산 시`;
    document.getElementById("diffDeposit").textContent = fmt(추가보증금) + "원 (월세 환산분)";
    document.getElementById("resultBottomLabel").textContent = "총 환산 보증금";
    document.getElementById("resultMain").textContent = fmt(환산보증금합) + "원";
  }
});
