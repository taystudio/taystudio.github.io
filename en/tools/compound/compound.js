/**
 * Compound Interest Calculator (English)
 * Last verified: 2026-05-08
 *
 * Formulas (mathematical — jurisdiction-agnostic)
 * - Lump sum: A = P(1 + r/n)^(n*t)
 * - Monthly contribution future value: FV = PMT × [((1+r)^n - 1) / r]
 * - r = monthly rate (annual / 12), n = months
 */

function fmt(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const principal = parseFloat(document.getElementById("principal").value || 0);
  const monthly = parseFloat(document.getElementById("monthly").value || 0);
  const rate = parseFloat(document.getElementById("rate").value);
  const years = parseFloat(document.getElementById("years").value);
  if (rate === undefined || isNaN(rate) || !years) { alert("Please enter the annual return and number of years."); return; }

  const r = rate / 100 / 12;
  const n = years * 12;

  const principalFV = principal * Math.pow(1 + r, n);
  const monthlyFV = r === 0 ? monthly * n : monthly * (Math.pow(1 + r, n) - 1) / r;
  const totalFV = principalFV + monthlyFV;

  const totalInvested = principal + monthly * n;
  const profit = totalFV - totalInvested;

  document.getElementById("result").style.display = "block";
  document.getElementById("totalFV").textContent = fmt(totalFV);
  document.getElementById("invested").textContent = fmt(totalInvested);
  document.getElementById("profit").textContent = fmt(profit);
  document.getElementById("multiple").textContent = "× " + (totalFV / Math.max(1, totalInvested)).toFixed(2);
  document.getElementById("principalPart").textContent = fmt(principalFV);
  document.getElementById("monthlyPart").textContent = fmt(monthlyFV);
});
