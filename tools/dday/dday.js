/**
 * D-day 계산기
 * 최종 검토: 2026-04-29
 * (단순 날짜 계산기 — 법령 의존성 없음)
 */

function diffDays(a, b) {
  const ms = b - a;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const startStr = document.getElementById("start").value;
  const endStr = document.getElementById("end").value;
  if (!startStr || !endStr) { alert('시작일과 종료일을 모두 입력하세요.'); return; }

  const start = new Date(startStr);
  const end = new Date(endStr);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const days = diffDays(start, end);
  const abs = Math.abs(days);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromToday = diffDays(today, end);

  document.getElementById("result").style.display = "block";

  let label, badge;
  if (fromToday === 0) { badge = "D-DAY"; label = "오늘이 그 날!"; }
  else if (fromToday > 0) { badge = "D-" + fromToday; label = fromToday + "일 후"; }
  else { badge = "D+" + Math.abs(fromToday); label = Math.abs(fromToday) + "일 지남"; }

  document.getElementById("dday").textContent = badge;
  document.getElementById("ddayLabel").textContent = label;
  document.getElementById("totalDays").textContent = abs.toLocaleString("ko-KR") + "일";
  document.getElementById("totalWeeks").textContent =
    Math.floor(abs / 7) + "주 " + (abs % 7) + "일";
  document.getElementById("totalMonths").textContent = (abs / 30.4375).toFixed(1) + "개월";
  document.getElementById("totalYears").textContent = (abs / 365.25).toFixed(2) + "년";
});

(function setDefaults() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("start").value = today;
})();
