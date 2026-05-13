/**
 * 한↔영 키보드 변환
 * 최종 검토: 2026-05-04
 * (두벌식 표준 매핑 — Microsoft IME / macOS 한글 자판 동일)
 *
 * 알고리즘
 * - eng→kor: 자모 시퀀스를 한글 음절로 합성 (cho+jung+jong 상태 머신)
 * - kor→eng: 한글 음절을 자모로 분해 후 영문 매핑 (복합 자모 → 2키)
 */

// 두벌식 키보드 매핑 (한글 자모 → QWERTY)
const JAMO_TO_ENG = {
  // 자음 (초성으로 사용)
  "ㄱ":"r","ㄲ":"R","ㄴ":"s","ㄷ":"e","ㄸ":"E","ㄹ":"f","ㅁ":"a",
  "ㅂ":"q","ㅃ":"Q","ㅅ":"t","ㅆ":"T","ㅇ":"d","ㅈ":"w","ㅉ":"W",
  "ㅊ":"c","ㅋ":"z","ㅌ":"x","ㅍ":"v","ㅎ":"g",
  // 모음
  "ㅏ":"k","ㅐ":"o","ㅑ":"i","ㅒ":"O","ㅓ":"j","ㅔ":"p","ㅕ":"u","ㅖ":"P",
  "ㅗ":"h","ㅛ":"y","ㅜ":"n","ㅠ":"b","ㅡ":"m","ㅣ":"l",
};
// 영문 → 자모 (역매핑)
const ENG_TO_JAMO = Object.fromEntries(Object.entries(JAMO_TO_ENG).map(([k,v]) => [v,k]));

// 복합 모음 (입력 시 두 키)
const COMPOUND_JUNG = {
  "ㅗㅏ":"ㅘ","ㅗㅐ":"ㅙ","ㅗㅣ":"ㅚ",
  "ㅜㅓ":"ㅝ","ㅜㅔ":"ㅞ","ㅜㅣ":"ㅟ",
  "ㅡㅣ":"ㅢ",
};
const SPLIT_JUNG = {
  "ㅘ":["ㅗ","ㅏ"],"ㅙ":["ㅗ","ㅐ"],"ㅚ":["ㅗ","ㅣ"],
  "ㅝ":["ㅜ","ㅓ"],"ㅞ":["ㅜ","ㅔ"],"ㅟ":["ㅜ","ㅣ"],
  "ㅢ":["ㅡ","ㅣ"],
};

// 복합 종성 (입력 시 두 키)
const COMPOUND_JONG = {
  "ㄱㅅ":"ㄳ","ㄴㅈ":"ㄵ","ㄴㅎ":"ㄶ",
  "ㄹㄱ":"ㄺ","ㄹㅁ":"ㄻ","ㄹㅂ":"ㄼ","ㄹㅅ":"ㄽ",
  "ㄹㅌ":"ㄾ","ㄹㅍ":"ㄿ","ㄹㅎ":"ㅀ","ㅂㅅ":"ㅄ",
};
const SPLIT_JONG = {
  "ㄳ":["ㄱ","ㅅ"],"ㄵ":["ㄴ","ㅈ"],"ㄶ":["ㄴ","ㅎ"],
  "ㄺ":["ㄹ","ㄱ"],"ㄻ":["ㄹ","ㅁ"],"ㄼ":["ㄹ","ㅂ"],"ㄽ":["ㄹ","ㅅ"],
  "ㄾ":["ㄹ","ㅌ"],"ㄿ":["ㄹ","ㅍ"],"ㅀ":["ㄹ","ㅎ"],"ㅄ":["ㅂ","ㅅ"],
};

// 한글 음절 분해/합성 인덱스
const CHO_LIST = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG_LIST = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG_LIST = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

const CHO_SET = new Set(CHO_LIST);
const JUNG_SET = new Set(JUNG_LIST);
const JONG_SET = new Set(JONG_LIST.slice(1));

function compose(cho, jung, jong) {
  const ci = CHO_LIST.indexOf(cho);
  const ji = JUNG_LIST.indexOf(jung);
  const gi = jong ? JONG_LIST.indexOf(jong) : 0;
  if (ci < 0 || ji < 0 || gi < 0) return null;
  return String.fromCharCode(0xAC00 + ci * 588 + ji * 28 + gi);
}

function decompose(c) {
  const code = c.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return null;
  const idx = code - 0xAC00;
  const ci = Math.floor(idx / 588);
  const ji = Math.floor((idx % 588) / 28);
  const gi = idx % 28;
  return { cho: CHO_LIST[ci], jung: JUNG_LIST[ji], jong: gi > 0 ? JONG_LIST[gi] : null };
}

// 영문 → 한글
function engToKor(text) {
  let out = "";
  let cho = null, jung = null, jong = null;

  function flush() {
    if (cho !== null && jung !== null) {
      const s = compose(cho, jung, jong);
      out += (s !== null) ? s : (cho + jung + (jong || ""));
    } else if (cho !== null) {
      out += cho;
    } else if (jung !== null) {
      out += jung;
    }
    cho = null; jung = null; jong = null;
  }

  for (const ch of text) {
    const jamo = ENG_TO_JAMO[ch];
    if (!jamo) {
      flush();
      out += ch;
      continue;
    }

    if (CHO_SET.has(jamo)) { // 자음
      if (cho === null) {
        // 직전이 모음 단독이면 emit
        if (jung !== null) { flush(); }
        cho = jamo;
      } else if (jung === null) {
        // cho만 있고 자음 또 옴 → 이전 cho emit, 새 cho
        out += cho;
        cho = jamo;
      } else if (jong === null) {
        if (JONG_SET.has(jamo)) {
          jong = jamo;
        } else {
          flush();
          cho = jamo;
        }
      } else {
        // 종성 있음, 복합 종성 시도
        const comp = COMPOUND_JONG[jong + jamo];
        if (comp) {
          jong = comp;
        } else {
          flush();
          cho = jamo;
        }
      }
    } else { // 모음
      if (cho === null) {
        if (jung === null) {
          jung = jamo;
        } else {
          // 모음 누적 — 복합 시도
          const comp = COMPOUND_JUNG[jung + jamo];
          if (comp) jung = comp;
          else { flush(); jung = jamo; }
        }
      } else if (jung === null) {
        jung = jamo;
      } else if (jong === null) {
        // 복합 모음 시도
        const comp = COMPOUND_JUNG[jung + jamo];
        if (comp) {
          jung = comp;
        } else {
          flush();
          jung = jamo;
        }
      } else {
        // 종성 있음 → 종성을 다음 음절 초성으로 이동
        const split = SPLIT_JONG[jong];
        if (split) {
          // 복합 종성: 앞부분 남고 뒷부분이 다음 cho
          jong = split[0];
          const newCho = split[1];
          flush();
          cho = newCho;
          jung = jamo;
        } else {
          const newCho = jong;
          jong = null;
          flush();
          cho = newCho;
          jung = jamo;
        }
      }
    }
  }
  flush();
  return out;
}

// 한글 → 영문
function korToEng(text) {
  let out = "";
  for (const ch of text) {
    const dec = decompose(ch);
    if (dec) {
      out += JAMO_TO_ENG[dec.cho] || dec.cho;
      if (dec.jung) {
        if (JAMO_TO_ENG[dec.jung]) {
          out += JAMO_TO_ENG[dec.jung];
        } else if (SPLIT_JUNG[dec.jung]) {
          const [a, b] = SPLIT_JUNG[dec.jung];
          out += JAMO_TO_ENG[a] + JAMO_TO_ENG[b];
        } else {
          out += dec.jung;
        }
      }
      if (dec.jong) {
        if (JAMO_TO_ENG[dec.jong]) {
          out += JAMO_TO_ENG[dec.jong];
        } else if (SPLIT_JONG[dec.jong]) {
          const [a, b] = SPLIT_JONG[dec.jong];
          out += JAMO_TO_ENG[a] + JAMO_TO_ENG[b];
        } else {
          out += dec.jong;
        }
      }
    } else if (JAMO_TO_ENG[ch]) {
      out += JAMO_TO_ENG[ch];
    } else if (SPLIT_JUNG[ch]) {
      const [a, b] = SPLIT_JUNG[ch];
      out += JAMO_TO_ENG[a] + JAMO_TO_ENG[b];
    } else if (SPLIT_JONG[ch]) {
      const [a, b] = SPLIT_JONG[ch];
      out += JAMO_TO_ENG[a] + JAMO_TO_ENG[b];
    } else {
      out += ch;
    }
  }
  return out;
}

function update() {
  const input = document.getElementById("input").value;
  document.getElementById("toKor").value = engToKor(input);
  document.getElementById("toEng").value = korToEng(input);
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

async function copyFrom(id, btn) {
  const text = document.getElementById(id).value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = "복사 완료 ✓";
    setTimeout(() => { btn.textContent = orig; }, 1200);
  } catch (e) {
    alert("복사 실패");
  }
}

document.getElementById("copyKor").addEventListener("click", (e) => copyFrom("toKor", e.target));
document.getElementById("copyEng").addEventListener("click", (e) => copyFrom("toEng", e.target));

// 예시 채우기
document.querySelectorAll("[data-example]").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("input").value = el.dataset.example;
    update();
    document.getElementById("input").focus();
  });
});

update();
