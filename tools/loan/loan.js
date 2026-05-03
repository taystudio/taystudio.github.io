/**
 * 대출 이자 계산기 (원리금균등 / 원금균등)
 * 적용 기준: 2026년 1월 / 최종 검토: 2026-04-29
 *
 * 계산식 (수학적 공식 — 법령 무관)
 * - 원리금균등 월상환액: P × r × (1+r)^n / ((1+r)^n - 1)
 *   P=원금, r=월이율(=연이율/12), n=총개월수
 *   영문 표기 PMT 함수와 동일 (Excel: PMT(rate, nper, pv))
 * - 원금균등: 매월 원금 = P/n, 월 이자 = 잔액 × r
 *
 * ※ DSR(총부채원리금상환비율) 규제 등 한도 제한은 별도. 금융위원회 가계부채 관리방안 참조
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

function 원리금균등(원금, 연이율, 개월) {
  const r = (연이율 / 100) / 12;
  const n = 개월;
  if (r === 0) return { 월상환: 원금 / n, 총이자: 0, 총상환: 원금 };
  const 월상환 = 원금 * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const 총상환 = 월상환 * n;
  return { 월상환, 총이자: 총상환 - 원금, 총상환 };
}

function 원금균등(원금, 연이율, 개월) {
  const r = (연이율 / 100) / 12;
  const n = 개월;
  const 월원금 = 원금 / n;
  let 총이자 = 0;
  let 첫달이자 = 원금 * r;
  let 첫달상환 = 월원금 + 첫달이자;
  let 잔액 = 원금;
  for (let i = 0; i < n; i++) {
    총이자 += 잔액 * r;
    잔액 -= 월원금;
  }
  return { 월상환: 첫달상환, 마지막상환: 월원금 + 월원금 * r, 총이자, 총상환: 원금 + 총이자, 첫달: 첫달상환 };
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const principal = parseFloat(document.getElementById("principal").value) * 10000;
  const rate = parseFloat(document.getElementById("rate").value);
  const years = parseFloat(document.getElementById("years").value);
  const method = document.querySelector('input[name="method"]:checked').value;
  if (!principal || !rate || !years) { alert("값을 모두 입력하세요."); return; }

  const months = years * 12;
  document.getElementById("result").style.display = "block";

  if (method === "equal") {
    const r = 원리금균등(principal, rate, months);
    document.getElementById("monthly").textContent = fmt(r.월상환) + "원";
    document.getElementById("monthlyLabel").textContent = "원리금균등 / 매월 동일";
    document.getElementById("totalInt").textContent = fmt(r.총이자) + "원";
    document.getElementById("totalRepay").textContent = fmt(r.총상환) + "원";
    document.getElementById("firstLast").style.display = "none";
  } else {
    const r = 원금균등(principal, rate, months);
    document.getElementById("monthly").textContent = fmt(r.첫달) + "원";
    document.getElementById("monthlyLabel").textContent = "원금균등 / 첫달 (이후 점차 감소)";
    document.getElementById("totalInt").textContent = fmt(r.총이자) + "원";
    document.getElementById("totalRepay").textContent = fmt(r.총상환) + "원";
    document.getElementById("firstLast").style.display = "flex";
    document.getElementById("lastMonth").textContent = fmt(r.마지막상환) + "원";
  }
});
