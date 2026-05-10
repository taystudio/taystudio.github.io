# EN /text/ 번역 검수 review (2026-05-10)

> 사용자 검수용 doc — AI 초안 영어 텍스트의 어색한 표현·도메인 용어·번역 누락 점검. 각 도구별 SEO meta(title/desc/OG/Twitter) + H1 + subtitle + privacy box + FAQ + HowTo step 추출. 수정 결정 후 패치.

카테고리: Text (1 도구 + 1 hub)

---

## Hub
`en/text/index.html`

| field | value |
|---|---|
| `<title>` (64c) | Text Tools | Character Counter & Social Media Limits — TAYSTUDIO |
| `meta description` (212c) | Free privacy-first text utilities. Real-time character counter with social media limit tracking (Twitter/X, Instagram, LinkedIn, Facebook, Threads, YouTube). No signup, no install — runs entirely in y… |
| `og:title` | Text Tools | Character Counter & Social Media Limits — TAYSTUDIO |
| `og:description` | Free privacy-first text utilities. Real-time character counter with social media limit tracking (Twitter/X, Instagram, LinkedIn, Facebook, Threads). No signup, no install. |
| `twitter:title` | Text Tools | TAYSTUDIO |
| `twitter:description` | Free text utilities. Real-time character counter with social media limit tracking. |
| `<h1>` | Text Tools |
| `subtitle` | Common text utilities — no signup, no install, runs entirely in your browser. |

**FAQ (4)**
- **Q:** Why is the character count different on Twitter/X?
  **A:** Twitter/X auto-shortens URLs to 23 characters regardless of original length. Compound emoji (joined with ZWJ) are also collapsed to 1 character on X but count as multiple Unicode codepoints in raw text. The Character Counter shows raw codepoints; for X-specific counting, mentally subtract the URL-le…
- **Q:** Why are byte counts different from character counts?
  **A:** UTF-8 encoding uses 1 byte for ASCII, 2 bytes for accented Latin, 3 bytes for most CJK (Chinese, Japanese, Korean) characters, and 4 bytes for emoji. Database VARCHAR columns and SMS message segments often limit bytes, not characters.
- **Q:** Is my text sent anywhere?
  **A:** No. All processing happens in your browser via JavaScript. Your text never leaves your device. Cover letters, drafts, and confidential content are safe to paste.
- **Q:** Are there more text tools coming?
  **A:** TAYSTUDIO has additional text tools in Korean (Korean keyboard converter, SNS line-break formatting), but those are language-specific and aren't translated to English. Universal text utilities will be added as they're built.

---

## counter
`en/text/counter/index.html`

| field | value |
|---|---|
| `<title>` (61c) | Character Counter | Words, Lines, Bytes & Social Media Limits |
| `meta description` (208c) | Real-time character counter — with/without spaces, words, lines, sentences, UTF-8 bytes. Auto-compares your text against Twitter/X, Instagram, LinkedIn, Facebook, Threads, and YouTube limits. Free, no… |
| `og:title` | Character Counter | Words, Lines, Bytes & Social Media Limits |
| `og:description` | Real-time character, word, line, sentence, and UTF-8 byte counter. Compare against Twitter/X, Instagram, LinkedIn, Facebook, Threads, and YouTube limits. Free, no signup, runs entirely in your browser… |
| `twitter:title` | Character Counter | Words, Lines, Bytes & Social Media Limits |
| `twitter:description` | Real-time character, word, line, sentence, and UTF-8 byte counter with social media limit comparison. |
| `<h1>` | Character Counter |
| `subtitle` | With/without spaces, words, lines, sentences, bytes — plus social media limits, in real time. |

**FAQ (6)**
- **Q:** What's the difference between counting with and without spaces?
  **A:** \
- **Q:** Why is the byte count larger than the character count?
  **A:** In UTF-8 encoding, ASCII letters and digits use 1 byte each, accented Latin characters use 2 bytes, most CJK (Chinese, Japanese, Korean) characters use 3 bytes, and emoji often use 4 bytes. So 'Hi' is 2 chars / 2 bytes, but '안녕' or '你好' is 2 chars / 6 bytes. Database VARCHAR columns and SMS limits o…
- **Q:** How are emoji and CJK characters counted?
  **A:** This counter uses Unicode codepoint counting. Compound emoji like '👨‍👩‍👧' (joined with ZWJ) count as multiple codepoints (typically 5), which can differ from how Twitter/X displays them as 1 'character'. CJK letters (Chinese, Japanese, Korean) each count as 1 character — same as Latin letters.
- **Q:** Are line breaks included in the count?
  **A:** Yes, in the 'with spaces' count (newline character \\n is 1 character). They're excluded from 'without spaces'. This may differ slightly from Microsoft Word's word/character statistics, which typically excludes line breaks from its 'characters' count.
- **Q:** Is my text uploaded anywhere?
  **A:** No. All counting happens in your browser via JavaScript. Your text never leaves your device. Cover letters, drafts, and confidential content are safe to paste.
- **Q:** How do I know if my Twitter/X post will fit?
  **A:** Twitter/X allows 280 characters. URLs are auto-shortened to 23 characters regardless of original length, but this counter shows the raw character count — so subtract the URL difference manually if needed. Premium accounts have a 25,000 character limit.

---
