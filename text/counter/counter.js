/**
 * 글자수 카운터
 * 최종 검토: 2026-05-04
 * (텍스트 처리 도구 — 법령 의존성 없음)
 */

const LIMITS = [
  { name: "트위터(X)", max: 280, hint: "한글·영문·이모지 1자 = 1자 (URL은 23자 고정 처리)" },
  { name: "스레드(Threads)", max: 500, hint: "기본 게시물 한도" },
  { name: "인스타그램 캡션", max: 2200, hint: "해시태그 30개까지" },
  { name: "페이스북 게시물", max: 63206, hint: "거의 무제한이지만 477자 이상은 \"더 보기\" 처리" },
  { name: "네이버 블로그 제목", max: 100, hint: "검색노출 잘 되려면 30자 내외 권장" },
  { name: "유튜브 제목", max: 100, hint: "" },
  { name: "유튜브 설명", max: 5000, hint: "처음 100~150자가 검색 미리보기에 노출" },
  { name: "자소서(짧음)", max: 500, hint: "공통 짧은 항목" },
  { name: "자소서(중간)", max: 1000, hint: "공기업·일부 대기업 항목" },
  { name: "자소서(긴 항목)", max: 1500, hint: "삼성·SK 등 일부 항목" },
  { name: "자소서(최대)", max: 2000, hint: "장문 자소서·자기기술서" },
];

function countAll(text) {
  const charsWithSpace = [...text].length; // 코드포인트 단위 (이모지 안전)
  const charsNoSpace = [...text.replace(/\s/g, "")].length;
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length;
  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  const bytesUtf8 = new TextEncoder().encode(text).length;

  // 한글/영문/숫자/기타 분리 (코드포인트 단위)
  let korean = 0, english = 0, digit = 0, other = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) continue;
    const code = ch.codePointAt(0);
    // 한글 음절(가-힣) + 자모(ㄱ-ㅎ, ㅏ-ㅣ) + 호환 자모
    if ((code >= 0xAC00 && code <= 0xD7A3) ||
        (code >= 0x1100 && code <= 0x11FF) ||
        (code >= 0x3130 && code <= 0x318F)) {
      korean++;
    } else if (/[a-zA-Z]/.test(ch)) {
      english++;
    } else if (/[0-9]/.test(ch)) {
      digit++;
    } else {
      other++;
    }
  }

  return { charsWithSpace, charsNoSpace, lines, words, bytesUtf8, korean, english, digit, other };
}

function fmt(n) {
  return n.toLocaleString("ko-KR");
}

function renderLimits(charsWithSpace) {
  const wrap = document.getElementById("limits");
  wrap.innerHTML = "";
  for (const l of LIMITS) {
    const remain = l.max - charsWithSpace;
    const over = remain < 0;
    const ratio = Math.min(charsWithSpace / l.max, 1);
    const pct = (ratio * 100).toFixed(1);
    const row = document.createElement("div");
    row.className = "limit-row" + (over ? " over" : "");
    row.innerHTML = `
      <div class="limit-head">
        <span class="limit-name">${l.name}</span>
        <span class="limit-count">${fmt(charsWithSpace)} / ${fmt(l.max)}</span>
      </div>
      <div class="limit-bar"><div class="limit-fill" style="width:${pct}%"></div></div>
      <div class="limit-meta">
        <span class="limit-status">${over ? `${fmt(-remain)}자 초과` : `${fmt(remain)}자 남음`}</span>
        ${l.hint ? `<span class="limit-hint">${l.hint}</span>` : ""}
      </div>
    `;
    wrap.appendChild(row);
  }
}

function update() {
  const text = document.getElementById("input").value;
  const r = countAll(text);

  document.getElementById("charsWithSpace").textContent = fmt(r.charsWithSpace);
  document.getElementById("charsNoSpace").textContent = fmt(r.charsNoSpace);
  document.getElementById("words").textContent = fmt(r.words);
  document.getElementById("lines").textContent = fmt(r.lines);
  document.getElementById("bytesUtf8").textContent = fmt(r.bytesUtf8);
  document.getElementById("korean").textContent = fmt(r.korean);
  document.getElementById("english").textContent = fmt(r.english);
  document.getElementById("digit").textContent = fmt(r.digit);
  document.getElementById("other").textContent = fmt(r.other);

  renderLimits(r.charsWithSpace);
}

document.getElementById("input").addEventListener("input", update);

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("input").value = "";
  update();
  document.getElementById("input").focus();
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  const text = document.getElementById("input").value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("copyBtn");
    const orig = btn.textContent;
    btn.textContent = "복사 완료 ✓";
    setTimeout(() => { btn.textContent = orig; }, 1200);
  } catch (e) {
    alert("복사 실패 — 브라우저가 클립보드 권한을 차단했어요.");
  }
});

update();
