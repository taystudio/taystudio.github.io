/**
 * 만 나이 계산기
 * 적용 기준: 2023.6.28~ (만 나이 통일법) / 최종 검토: 2026-04-29
 *
 * 근거
 * - 만 나이 통일: 행정기본법 제7조의2 (2023.6.28 시행) — 모든 법령·계약·공문서에서 만 나이 사용
 * - 만 나이 정의: 출생일 기준, 생일 도래 여부에 따라 (현재연도 - 출생연도) 또는 -1
 * - 연 나이: 청소년보호법·병역법 등 일부 특별법에서 사용 (현재연도 - 출생연도)
 * - 한국식 나이(세는 나이): 일상 표현 (출생 시 1세, 매년 1월 1일 +1) — 2023년부터 공식 효력 없음
 */

function fmt(n) { return n.toString(); }

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const birthStr = document.getElementById("birth").value;
  if (!birthStr) { alert('생년월일을 입력하세요.'); return; }

  const birth = new Date(birthStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birth > today) { alert("미래 날짜는 입력할 수 없어요."); return; }

  let manAge = today.getFullYear() - birth.getFullYear();
  const beforeBirthday = today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (beforeBirthday) manAge--;

  const yearAge = today.getFullYear() - birth.getFullYear();
  const koreanAge = yearAge + 1;

  const diffMs = today - birth;
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday <= today) nextBirthday.setFullYear(today.getFullYear() + 1);
  const daysToBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

  document.getElementById("result").style.display = "block";
  document.getElementById("manAge").textContent = manAge + "세";
  document.getElementById("yearAge").textContent = yearAge + "세";
  document.getElementById("koreanAge").textContent = koreanAge + "세";
  document.getElementById("totalDays").textContent = totalDays.toLocaleString("ko-KR") + "일";
  document.getElementById("daysToBirthday").textContent =
    daysToBirthday === 365 ? "오늘이 생일!" : "D-" + daysToBirthday;
});
