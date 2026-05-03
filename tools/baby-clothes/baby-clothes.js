/**
 * 신생아·아기 옷 사이즈 계산기 (한국 사이즈 기준)
 * 최종 검증: 2026-04-29
 */

const 사이즈표 = [
  { size: 50,  months: [0, 1],   height: [50, 58], weight: [3, 5] },
  { size: 60,  months: [1, 4],   height: [58, 67], weight: [4, 7] },
  { size: 70,  months: [4, 9],   height: [67, 76], weight: [6, 10] },
  { size: 80,  months: [9, 18],  height: [76, 85], weight: [9, 12] },
  { size: 90,  months: [18, 30], height: [85, 95], weight: [11, 14] },
  { size: 100, months: [30, 48], height: [95, 105], weight: [13, 17] },
  { size: 110, months: [48, 66], height: [105, 115], weight: [16, 22] },
  { size: 120, months: [66, 84], height: [115, 125], weight: [20, 26] },
];

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const months = parseFloat(document.getElementById("months").value);
  const height = parseFloat(document.getElementById("height").value || 0);
  const weight = parseFloat(document.getElementById("weight").value || 0);
  if (months === undefined || months === null) { alert("개월수를 입력하세요."); return; }

  const candidates = 사이즈표.filter(s => months >= s.months[0] && months < s.months[1]);
  let primary = candidates[0] || 사이즈표[사이즈표.length - 1];

  // 키·몸무게로 보정
  if (height > 0) {
    const byHeight = 사이즈표.find(s => height >= s.height[0] && height < s.height[1]);
    if (byHeight && Math.abs(byHeight.size - primary.size) <= 10) primary = byHeight;
  }

  document.getElementById("result").style.display = "block";
  document.getElementById("size").textContent = primary.size + " 사이즈";
  document.getElementById("range").textContent =
    `${primary.months[0]}~${primary.months[1]}개월 / ${primary.height[0]}~${primary.height[1]}cm / ${primary.weight[0]}~${primary.weight[1]}kg`;

  const list = document.getElementById("table");
  list.innerHTML = "";
  사이즈표.forEach(s => {
    const row = document.createElement("div");
    row.className = "breakdown-row";
    if (s.size === primary.size) row.style.color = "var(--primary)";
    row.innerHTML = `<span class="label">${s.size} (${s.months[0]}~${s.months[1]}개월)</span><span class="value">${s.height[0]}~${s.height[1]}cm / ${s.weight[0]}~${s.weight[1]}kg</span>`;
    list.appendChild(row);
  });
});
