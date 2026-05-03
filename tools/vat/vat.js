/**
 * 부가가치세 계산기
 * 적용 기준: 2026년 / 최종 검증: 2026-04-29
 *
 * 출처: 부가가치세법 제30조 (세율 10%)
 * - 일반과세자: 10%
 * - 간이과세자: 업종별 1.5~4% (별도 계산식)
 * - 영세율 (수출 등): 0%
 *
 * 일반과세자 기준
 * - 공급가액에서 부가세 계산: 공급가 × 10%
 * - 부가세 포함 금액에서 분리: 합계 ÷ 1.1
 */

function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("amount").value);
  const mode = document.querySelector('input[name="mode"]:checked').value;
  if (!amount || amount <= 0) { alert("금액을 입력하세요."); return; }

  let supply, vat, total;
  if (mode === "add") {
    supply = amount;
    vat = supply * 0.1;
    total = supply + vat;
  } else {
    total = amount;
    supply = total / 1.1;
    vat = total - supply;
  }

  document.getElementById("result").style.display = "block";
  document.getElementById("supply").textContent = fmt(supply) + "원";
  document.getElementById("vat").textContent = fmt(vat) + "원";
  document.getElementById("total").textContent = fmt(total) + "원";
  document.getElementById("modeLabel").textContent =
    mode === "add" ? "공급가액 → 합계" : "합계 → 공급가액 분리";
});
