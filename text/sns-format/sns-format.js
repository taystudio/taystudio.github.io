/**
 * SNS 글 정리 (인스타·트위터·블로그용)
 * 최종 검토: 2026-05-04
 *
 * 핵심 기능
 * - 인스타 줄바꿈 보존 (빈 줄에 한글 filler U+3164 삽입)
 * - 해시태그 추출·중복 제거·끝으로 모으기
 * - Unicode fancy 글씨 7종 (Bold·Italic·Script·Fraktur 등) — 영문·숫자만
 */

// Unicode Mathematical Alphanumeric Symbols (U+1D400 block) 기반
// "Aa": 대문자 시작 코드포인트, "aa": 소문자 시작, "0": 숫자 시작
// "except": 해당 블록의 결손 문자에 대한 대체 매핑
const STYLES = {
  bold:       { Aa: 0x1D400, aa: 0x1D41A, "0": 0x1D7CE },
  italic:     { Aa: 0x1D434, aa: 0x1D44E, except: { h: 0x210E } },
  boldItalic: { Aa: 0x1D468, aa: 0x1D482 },
  script:     {
    Aa: 0x1D49C, aa: 0x1D4B6,
    except: {
      B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B,
      e: 0x212F, g: 0x210A, o: 0x2134,
    },
  },
  fraktur:    {
    Aa: 0x1D504, aa: 0x1D51E,
    except: { C: 0x212D, H: 0x210C, I: 0x2111, R: 0x211C, Z: 0x2128 },
  },
  double:     {
    Aa: 0x1D538, aa: 0x1D552, "0": 0x1D7D8,
    except: { C: 0x2102, H: 0x210D, N: 0x2115, P: 0x2119, Q: 0x211A, R: 0x211D, Z: 0x2124 },
  },
  monospace:  { Aa: 0x1D670, aa: 0x1D68A, "0": 0x1D7F6 },
};

function applyStyle(text, styleKey) {
  if (!styleKey || styleKey === "none") return text;
  const s = STYLES[styleKey];
  if (!s) return text;
  let out = "";
  for (const ch of text) {
    if (s.except && s.except[ch]) {
      out += String.fromCodePoint(s.except[ch]);
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code >= 0x41 && code <= 0x5A && s.Aa) {
      out += String.fromCodePoint(s.Aa + code - 0x41);
    } else if (code >= 0x61 && code <= 0x7A && s.aa) {
      out += String.fromCodePoint(s.aa + code - 0x61);
    } else if (code >= 0x30 && code <= 0x39 && s["0"]) {
      out += String.fromCodePoint(s["0"] + code - 0x30);
    } else {
      out += ch;
    }
  }
  return out;
}

function extractTags(text) {
  return [...new Set(text.match(/#[\w가-힣ㄱ-ㅎㅏ-ㅣ]+/g) || [])];
}

function moveTagsToEnd(text) {
  const tags = extractTags(text);
  if (tags.length === 0) return text;
  const stripped = text.replace(/#[\w가-힣ㄱ-ㅎㅏ-ㅣ]+/g, "").replace(/[ \t]+/g, " ").replace(/[ \t]+\n/g, "\n").trim();
  return stripped + "\n\n" + tags.join(" ");
}

function preserveLineBreaks(text) {
  // 인스타·트위터에서 빈 줄이 압축되지 않게 한글 filler U+3164 삽입
  return text.split("\n").map(line => line.length === 0 ? "ㅤ" : line).join("\n");
}

function format() {
  const text = document.getElementById("input").value;
  const styleKey = document.getElementById("style").value;
  const tagsToEnd = document.getElementById("optTags").checked;
  const lineBreaks = document.getElementById("optLineBreaks").checked;

  let result = text;
  if (tagsToEnd) result = moveTagsToEnd(result);
  if (styleKey !== "none") result = applyStyle(result, styleKey);
  if (lineBreaks) result = preserveLineBreaks(result);

  document.getElementById("output").value = result;

  // 미리보기 글씨 스타일 갱신
  const preview = document.getElementById("stylePreview");
  preview.textContent = applyStyle("Sample 한글 ABC abc 123", styleKey);

  // 해시태그 카운트
  const tags = extractTags(text);
  document.getElementById("tagCount").textContent = `해시태그 ${tags.length}개`;
}

document.getElementById("input").addEventListener("input", format);
document.getElementById("style").addEventListener("change", format);
document.getElementById("optTags").addEventListener("change", format);
document.getElementById("optLineBreaks").addEventListener("change", format);

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("input").value = "";
  format();
  document.getElementById("input").focus();
});

document.getElementById("copyBtn").addEventListener("click", async (e) => {
  const text = document.getElementById("output").value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const btn = e.target;
    const orig = btn.textContent;
    btn.textContent = "복사 완료 ✓";
    setTimeout(() => { btn.textContent = orig; }, 1200);
  } catch (e) {
    alert("복사 실패");
  }
});

// 예시 채우기
document.querySelectorAll("[data-example]").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("input").value = el.dataset.example;
    format();
    document.getElementById("input").focus();
  });
});

format();
