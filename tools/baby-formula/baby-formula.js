/**
 * 아기 분유량 계산기
 * 최종 검증: 2026-04-29
 *
 * 권장 기준 (대한소아청소년과학회·미국소아과학회 일반 가이드)
 * - 신생아: 체중 1kg당 1일 150~180ml (24시간 분량)
 * - 분유 종류와 아기 식욕에 따라 ±10~20% 조정 가능
 *
 * 개월별 일반 가이드 (체중 기반보다 보조용)
 */

const 개월별가이드 = [
  { months: 0.5, perFeed: [60, 80], times: 8, note: "신생아 (0~2주)" },
  { months: 1, perFeed: [80, 110], times: 7, note: "1개월" },
  { months: 2, perFeed: [120, 150], times: 6, note: "2~3개월" },
  { months: 4, perFeed: [150, 180], times: 5, note: "3~4개월" },
  { months: 6, perFeed: [180, 220], times: 5, note: "4~6개월 (이유식 시작)" },
  { months: 9, perFeed: [200, 240], times: 4, note: "6~9개월" },
  { months: 12, perFeed: [200, 240], times: 3, note: "9~12개월 (이유식 위주)" },
];

function fmt(n) { return Math.round(n).toString(); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const weight = parseFloat(document.getElementById("weight").value);
  const months = parseFloat(document.getElementById("months").value);
  if (!weight || months === undefined) { alert("값을 입력하세요."); return; }

  const dailyMin = Math.min(weight * 150, 960);
  const dailyMax = Math.min(weight * 180, 960);

  const guide = 개월별가이드.find(g => months <= g.months) || 개월별가이드[개월별가이드.length - 1];
  const perFeed = (guide.perFeed[0] + guide.perFeed[1]) / 2;
  const times = guide.times;

  document.getElementById("result").style.display = "block";
  document.getElementById("dailyTotal").textContent = `${fmt(dailyMin)}~${fmt(dailyMax)}ml/일`;
  document.getElementById("guideNote").textContent = guide.note;
  document.getElementById("perFeed").textContent = `${guide.perFeed[0]}~${guide.perFeed[1]}ml`;
  document.getElementById("times").textContent = `${times}회/일`;
  document.getElementById("perFeedAvg").textContent = `${fmt(perFeed)}ml × ${times}회 = ${fmt(perFeed * times)}ml`;
});
