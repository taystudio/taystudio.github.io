/**
 * Savings Calculator (English)
 * Last verified: 2026-05-10
 *
 * Pre-tax only. Taxes vary by jurisdiction and account type — not applied here.
 *
 * Formulas
 * - Simple (recurring deposit):
 *   Interest = monthly × annualRate × (n(n+1)/2) ÷ 12
 *   (each monthly deposit earns simple interest until maturity)
 * - Monthly compound (annuity FV):
 *   FV = PMT × [((1+r)^n - 1) / r], r = annualRate / 12
 */

function fmt(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const monthly = parseFloat(document.getElementById("monthly").value);
  const rate = parseFloat(document.getElementById("rate").value);
  const months = parseInt(document.getElementById("months").value, 10);
  const type = document.querySelector('input[name="type"]:checked').value;
  if (!monthly || rate === undefined || isNaN(rate) || !months) { alert("Please fill in every field."); return; }

  const principal = monthly * months;
  let totalInterest;

  if (type === "simple") {
    const annualR = rate / 100;
    totalInterest = monthly * annualR * (months * (months + 1) / 2) / 12;
  } else {
    const r = rate / 100 / 12;
    const fv = r === 0 ? monthly * months : monthly * (Math.pow(1 + r, months) - 1) / r;
    totalInterest = fv - principal;
  }

  const totalReceive = principal + totalInterest;

  document.getElementById("result").style.display = "block";
  document.getElementById("total").textContent = fmt(totalReceive);
  document.getElementById("typeLabel").textContent = type === "simple" ? "Simple interest" : "Monthly compound";
  document.getElementById("principal").textContent = fmt(principal);
  document.getElementById("interest").textContent = fmt(totalInterest);
});
