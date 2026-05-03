/**
 * BMI 계산기
 * 최종 검증: 2026-04-29
 *
 * 공식: BMI = 체중(kg) / (키(m))²
 * 한국 기준 (대한비만학회 2018):
 * - 18.5 미만: 저체중
 * - 18.5~22.9: 정상
 * - 23~24.9: 과체중 (위험체중)
 * - 25~29.9: 1단계 비만
 * - 30~34.9: 2단계 비만
 * - 35 이상: 3단계 (고도) 비만
 */

function 분류(bmi) {
  if (bmi < 18.5) return { label: "저체중", color: "#3b82f6" };
  if (bmi < 23) return { label: "정상", color: "#10b981" };
  if (bmi < 25) return { label: "과체중 (위험)", color: "#f59e0b" };
  if (bmi < 30) return { label: "1단계 비만", color: "#ef4444" };
  if (bmi < 35) return { label: "2단계 비만", color: "#dc2626" };
  return { label: "3단계 (고도) 비만", color: "#991b1b" };
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  if (!height || !weight) { alert("값을 입력하세요."); return; }

  const m = height / 100;
  const bmi = weight / (m * m);
  const cls = 분류(bmi);

  // 정상범위 체중 (BMI 18.5~22.9)
  const minNormal = 18.5 * m * m;
  const maxNormal = 22.9 * m * m;
  const idealWeight = 21 * m * m;

  document.getElementById("result").style.display = "block";
  document.getElementById("bmi").textContent = bmi.toFixed(1);
  document.getElementById("bmi").style.color = cls.color;
  document.getElementById("category").textContent = cls.label;
  document.getElementById("category").style.color = cls.color;
  document.getElementById("idealRange").textContent = `${minNormal.toFixed(1)}~${maxNormal.toFixed(1)}kg`;
  document.getElementById("ideal").textContent = `${idealWeight.toFixed(1)}kg (BMI 21 기준)`;
  const diff = weight - idealWeight;
  document.getElementById("diff").textContent =
    diff > 0 ? `+${diff.toFixed(1)}kg 초과` : diff < 0 ? `${diff.toFixed(1)}kg 부족` : "이상 체중과 일치";
});
