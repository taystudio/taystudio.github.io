/**
 * 임신 출산예정일 계산기
 * 최종 검증: 2026-04-29
 *
 * Naegele's rule (산부인과 표준 공식)
 * - 출산예정일 = 마지막 생리 시작일(LMP) + 280일 (40주)
 * - 또는 LMP - 3개월 + 7일
 * - 28일 주기 가정 (26~32일이면 큰 오차 없음)
 */

function fmt(n) { return Math.round(n).toString(); }

function fmtDate(d) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const lmpStr = document.getElementById("lmp").value;
  const cycle = parseInt(document.getElementById("cycle").value || 28, 10);
  if (!lmpStr) return;

  const lmp = new Date(lmpStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 28일 주기 표준에서 ±조정
  const adjust = (cycle - 28);
  const dueDate = new Date(lmp);
  dueDate.setDate(dueDate.getDate() + 280 + adjust);

  const elapsedDays = Math.floor((today - lmp) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(elapsedDays / 7);
  const days = elapsedDays % 7;

  let trimester;
  if (weeks < 13) trimester = "초기 (1삼분기)";
  else if (weeks < 27) trimester = "중기 (2삼분기)";
  else trimester = "후기 (3삼분기)";

  const remainingDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  document.getElementById("result").style.display = "block";
  document.getElementById("dueDate").textContent = fmtDate(dueDate);
  document.getElementById("dDay").textContent =
    remainingDays > 0 ? "D-" + remainingDays : remainingDays === 0 ? "D-DAY" : "D+" + Math.abs(remainingDays);
  document.getElementById("currentWeek").textContent = `임신 ${weeks}주 ${days}일`;
  document.getElementById("trimester").textContent = trimester;

  // 주요 milestone
  const m12 = new Date(lmp); m12.setDate(m12.getDate() + 12 * 7);
  const m20 = new Date(lmp); m20.setDate(m20.getDate() + 20 * 7);
  const m28 = new Date(lmp); m28.setDate(m28.getDate() + 28 * 7);
  document.getElementById("m12").textContent = fmtDate(m12);
  document.getElementById("m20").textContent = fmtDate(m20);
  document.getElementById("m28").textContent = fmtDate(m28);
});
