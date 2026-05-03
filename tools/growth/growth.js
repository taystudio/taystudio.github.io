/**
 * 영유아 성장 백분위 계산기 (단순 추정)
 * 최종 검증: 2026-04-29
 *
 * 출처: 2017 한국 소아청소년 성장도표 (대한소아청소년과학회)
 * - 50백분위(중앙값) 기준 ± 표준편차 추정
 * - 정확한 LMS 기반 백분위 계산은 의료용으로, 본 계산기는 평균±SD 기반 단순 추정
 */

// 0~36개월 남아 50백분위 (cm, kg) [개월: [키, 몸무게]]
const 남아 = {
  0: [49.9, 3.3], 1: [54.7, 4.5], 2: [58.4, 5.6], 3: [61.4, 6.4],
  4: [63.9, 7.0], 6: [67.6, 7.9], 9: [72.0, 8.9], 12: [75.7, 9.6],
  18: [82.3, 10.9], 24: [87.8, 12.2], 30: [92.5, 13.3], 36: [96.5, 14.3],
};

const 여아 = {
  0: [49.1, 3.2], 1: [53.7, 4.2], 2: [57.1, 5.1], 3: [59.8, 5.8],
  4: [62.1, 6.4], 6: [65.7, 7.3], 9: [70.1, 8.2], 12: [74.0, 8.9],
  18: [80.7, 10.2], 24: [86.4, 11.5], 30: [91.1, 12.7], 36: [95.1, 13.7],
};

function 보간(table, m) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (m <= keys[0]) return table[keys[0]];
  if (m >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    if (m >= keys[i] && m <= keys[i + 1]) {
      const ratio = (m - keys[i]) / (keys[i + 1] - keys[i]);
      const a = table[keys[i]];
      const b = table[keys[i + 1]];
      return [a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio];
    }
  }
}

function 백분위(value, mean, sd) {
  const z = (value - mean) / sd;
  // 표준정규분포 근사 (Abramowitz)
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return Math.round(p * 100);
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const months = parseFloat(document.getElementById("months").value);
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  if (!months || !height || !weight) { alert("값을 모두 입력하세요."); return; }

  const table = gender === "boy" ? 남아 : 여아;
  const [meanH, meanW] = 보간(table, months);
  // 표준편차 근사: 키 ~3% / 몸무게 ~12%
  const sdH = meanH * 0.03;
  const sdW = meanW * 0.12;

  const heightP = 백분위(height, meanH, sdH);
  const weightP = 백분위(weight, meanW, sdW);

  document.getElementById("result").style.display = "block";
  document.getElementById("heightP").textContent = heightP + "백분위";
  document.getElementById("weightP").textContent = weightP + "백분위";
  document.getElementById("avgH").textContent = meanH.toFixed(1) + "cm (50백분위)";
  document.getElementById("avgW").textContent = meanW.toFixed(1) + "kg (50백분위)";

  const status = (p) => p < 3 ? "매우 작음" : p < 10 ? "작음" : p < 90 ? "정상 범위" : p < 97 ? "큼" : "매우 큼";
  document.getElementById("heightStatus").textContent = status(heightP);
  document.getElementById("weightStatus").textContent = status(weightP);
});
