/**
 * D-Day Calculator (English)
 * Last verified: 2026-05-10
 * Pure date arithmetic — no jurisdiction-specific logic.
 */

function diffDays(a, b) {
  const ms = b - a;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const startStr = document.getElementById("start").value;
  const endStr = document.getElementById("end").value;
  if (!startStr || !endStr) return;

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
  if (fromToday === 0) { badge = "D-DAY"; label = "Target is today!"; }
  else if (fromToday > 0) { badge = "D-" + fromToday; label = fromToday + " days to go"; }
  else { badge = "D+" + Math.abs(fromToday); label = Math.abs(fromToday) + " days since target"; }

  document.getElementById("dday").textContent = badge;
  document.getElementById("ddayLabel").textContent = label;
  document.getElementById("totalDays").textContent = abs.toLocaleString("en-US") + " days";
  document.getElementById("totalWeeks").textContent =
    Math.floor(abs / 7) + " weeks " + (abs % 7) + " days";
  document.getElementById("totalMonths").textContent = (abs / 30.4375).toFixed(1) + " months";
  document.getElementById("totalYears").textContent = (abs / 365.25).toFixed(2) + " years";
});

(function setDefaults() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("start").value = today;
})();
