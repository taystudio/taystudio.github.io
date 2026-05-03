/**
 * 배란일 · 가임기 · 생리주기 계산기
 * 최종 검증: 2026-04-29
 *
 * 표준 공식
 * - 배란일 = 다음 생리예정일 - 14일 (황체기 14일 고정)
 * - 가임기: 배란일 -5일 ~ +1일 (정자 생존 5일, 난자 생존 1일)
 * - 생리예정일 = LMP + 주기
 */

function fmtDate(d) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const lmpStr = document.getElementById("lmp").value;
  const cycle = parseInt(document.getElementById("cycle").value || 28, 10);
  if (!lmpStr) return;

  const lmp = new Date(lmpStr);

  document.getElementById("result").style.display = "block";

  // 다음 3주기 계산
  const list = document.getElementById("cycleList");
  list.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const periodStart = addDays(lmp, cycle * i);
    const nextPeriod = addDays(periodStart, cycle);
    const ovulation = addDays(nextPeriod, -14);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = addDays(ovulation, 1);

    const card = document.createElement("div");
    card.className = "breakdown";
    card.style.marginBottom = "16px";
    card.innerHTML = `
      <div style="font-weight:600;color:var(--primary);margin-bottom:8px">${i === 0 ? "이번 주기" : i + 1 + "번째 주기"}</div>
      <div class="breakdown-row"><span class="label">생리 시작일</span><span class="value">${fmtDate(periodStart)}</span></div>
      <div class="breakdown-row"><span class="label">배란일</span><span class="value">${fmtDate(ovulation)}</span></div>
      <div class="breakdown-row"><span class="label">가임기 (5일)</span><span class="value">${fmtDate(fertileStart)} ~ ${fmtDate(fertileEnd)}</span></div>
      <div class="breakdown-row"><span class="label">다음 생리 예정</span><span class="value">${fmtDate(nextPeriod)}</span></div>
    `;
    list.appendChild(card);
  }
});
