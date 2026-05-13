/**
 * Character Counter
 * Last reviewed: 2026-05-10
 * (Pure text-processing tool — no jurisdiction-specific data)
 */

const LIMITS = [
  { name: "Twitter / X", max: 280, hint: "Letters, emojis count as 1 (URLs fixed at 23)" },
  { name: "Threads", max: 500, hint: "Default post limit" },
  { name: "Instagram caption", max: 2200, hint: "Up to 30 hashtags" },
  { name: "Facebook post", max: 63206, hint: "Effectively unlimited; truncated to \"See more\" after ~477 chars" },
  { name: "LinkedIn post", max: 3000, hint: "Truncated to \"…see more\" after ~140 chars" },
  { name: "YouTube title", max: 100, hint: "" },
  { name: "YouTube description", max: 5000, hint: "First 100–150 chars appear in search preview" },
  { name: "Cover letter (short)", max: 500, hint: "Common short prompt" },
  { name: "Cover letter (medium)", max: 1000, hint: "Standard application length" },
  { name: "Cover letter (long)", max: 1500, hint: "Detailed prompts" },
  { name: "Cover letter (max)", max: 2000, hint: "Long-form personal statement" },
];

function countAll(text) {
  const charsWithSpace = [...text].length; // codepoint-based (emoji safe)
  const charsNoSpace = [...text.replace(/\s/g, "")].length;
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length;
  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  const sentences = text.trim().length === 0 ? 0 : (text.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g) || []).length;
  const bytesUtf8 = new TextEncoder().encode(text).length;

  // Categorize codepoints: letters (Latin) / digits / CJK / other
  let letters = 0, digits = 0, cjk = 0, other = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) continue;
    const code = ch.codePointAt(0);
    // CJK Unified Ideographs + Hangul + Hiragana/Katakana
    if ((code >= 0xAC00 && code <= 0xD7A3) ||  // Hangul syllables
        (code >= 0x1100 && code <= 0x11FF) ||  // Hangul jamo
        (code >= 0x3130 && code <= 0x318F) ||  // Hangul compat jamo
        (code >= 0x4E00 && code <= 0x9FFF) ||  // CJK Unified
        (code >= 0x3040 && code <= 0x30FF)) {  // Hiragana + Katakana
      cjk++;
    } else if (/[a-zA-Z]/.test(ch)) {
      letters++;
    } else if (/[0-9]/.test(ch)) {
      digits++;
    } else {
      other++;
    }
  }

  return { charsWithSpace, charsNoSpace, lines, words, sentences, bytesUtf8, letters, digits, cjk, other };
}

function fmt(n) {
  return n.toLocaleString("en-US");
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
        <span class="limit-status">${over ? `${fmt(-remain)} over limit` : `${fmt(remain)} remaining`}</span>
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
  document.getElementById("sentences").textContent = fmt(r.sentences);
  document.getElementById("lines").textContent = fmt(r.lines);
  document.getElementById("bytesUtf8").textContent = fmt(r.bytesUtf8);
  document.getElementById("letters").textContent = fmt(r.letters);
  document.getElementById("digits").textContent = fmt(r.digits);
  document.getElementById("cjk").textContent = fmt(r.cjk);
  document.getElementById("other").textContent = fmt(r.other);

  renderLimits(r.charsWithSpace);
}

let _debounceTimer;
function debounced(fn, ms = 150) {
  return function () {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => fn.apply(this, arguments), ms);
  };
}

document.getElementById("input").addEventListener("input", debounced(update));

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
    btn.textContent = "Copied ✓";
    setTimeout(() => { btn.textContent = orig; }, 1200);
  } catch (e) {
    alert("Copy failed — clipboard permission was blocked by your browser.");
  }
});

update();
