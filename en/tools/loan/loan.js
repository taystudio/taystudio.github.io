/**
 * Loan Calculator (English) — equal monthly payment / equal principal
 * Last verified: 2026-05-10
 *
 * Formulas (mathematical — jurisdiction-agnostic)
 * - Equal monthly payment (PMT):
 *     monthly = P × r × (1+r)^n / ((1+r)^n - 1)
 *     P = principal, r = monthly rate (annual / 12), n = total months
 *     equivalent to Excel: PMT(rate, nper, pv)
 * - Equal principal:
 *     monthly principal = P / n, monthly interest = remaining balance × r
 *
 * Real-world costs (origination, points, mortgage insurance, prepayment penalty)
 * are NOT included. Use APR when comparing actual offers.
 */

function fmt(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

function equalMonthly(principal, annualRate, months) {
  const r = (annualRate / 100) / 12;
  const n = months;
  if (r === 0) return { monthly: principal / n, totalInterest: 0, totalRepay: principal };
  const monthly = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const totalRepay = monthly * n;
  return { monthly, totalInterest: totalRepay - principal, totalRepay };
}

function equalPrincipal(principal, annualRate, months) {
  const r = (annualRate / 100) / 12;
  const n = months;
  const monthlyPrincipal = principal / n;
  let totalInterest = 0;
  let firstInterest = principal * r;
  let firstPayment = monthlyPrincipal + firstInterest;
  let balance = principal;
  for (let i = 0; i < n; i++) {
    totalInterest += balance * r;
    balance -= monthlyPrincipal;
  }
  return {
    firstPayment,
    lastPayment: monthlyPrincipal + monthlyPrincipal * r,
    totalInterest,
    totalRepay: principal + totalInterest,
  };
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("rate").value);
  const years = parseFloat(document.getElementById("years").value);
  const method = document.querySelector('input[name="method"]:checked').value;
  if (!principal || rate === undefined || isNaN(rate) || !years) { alert("Please fill in every field."); return; }

  const months = years * 12;
  document.getElementById("result").style.display = "block";

  if (method === "equal") {
    const r = equalMonthly(principal, rate, months);
    document.getElementById("monthly").textContent = fmt(r.monthly);
    document.getElementById("monthlyLabel").textContent = "Equal monthly payment (PMT) — same every month";
    document.getElementById("totalInt").textContent = fmt(r.totalInterest);
    document.getElementById("totalRepay").textContent = fmt(r.totalRepay);
    document.getElementById("firstLast").style.display = "none";
  } else {
    const r = equalPrincipal(principal, rate, months);
    document.getElementById("monthly").textContent = fmt(r.firstPayment);
    document.getElementById("monthlyLabel").textContent = "Equal principal — first month (decreases over time)";
    document.getElementById("totalInt").textContent = fmt(r.totalInterest);
    document.getElementById("totalRepay").textContent = fmt(r.totalRepay);
    document.getElementById("firstLast").style.display = "flex";
    document.getElementById("lastMonth").textContent = fmt(r.lastPayment);
  }
});
