# OG 메타 보강 + 카피 일반화 — 2026-05-05 (Tier 1.1 후속)

전날 출시한 OG 이미지 rollout(`2026-05-05-og-image-rollout.md`) 후속 정리. 두 작업을 한 묶음으로 처리:

1. **OG 이미지 카피 일반화** — 도구 수 표기 제거 + 톤 일반화
2. **51 파일 메타 보강** — audit 누락 항목 일괄 추가

---

## 1. OG 이미지 카피 변경

### 변경 내역

| 요소 | 이전 | 이후 |
|---|---|---|
| 서브타이틀 | 한국에서 자주 쓰는 무료 도구 모음 | **자주 쓰는 무료 도구 모음** |
| 칩 1 | 🧮 계산기 33 | 🧮 계산기 |
| 칩 2 | 📝 텍스트 3 | 📝 텍스트 |
| 칩 3 | 📸 이미지 9 | 📸 이미지 |
| 칩 폭 | 160·140·140 (불균일) | 140 균일 (한글 3자 통일) |

### 의도

- 도구 수 늘 때마다 OG 자산 재생성 부담 제거
- 톤 일반화 — `한국에서` 제외로 한국 외 검색 유입에도 무난, 운영자 결정에 따름

### 자산

- `og-image.svg` 3580B (수정)
- `og-image.png` 519875B = 519KB (Chrome headless 재렌더, 1200×630 RGBA)
- 사이즈 한계 전부 통과: 카톡 5MB / 페이스북 8MB / X 5MB / LinkedIn 5MB

### 재렌더 명령

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --window-size=1200,630 \
  --screenshot=og-image.png \
  --default-background-color=00000000 \
  file://$(pwd)/og-image.svg
```

---

## 2. 51 파일 메타 보강

### 적용 메타

| 메타 | 이전 | 이후 | 효과 |
|---|---|---|---|
| `og:image:type` | 0/51 | 51/51 = `image/png` | iMessage·일부 슬랙 봇 미리보기 안정성 |
| `og:image:secure_url` | 0/51 | 51/51 = `https://taystudio.github.io/og-image.png` | iMessage 일부 버전·Outlook 등 까다로운 클라이언트 호환 |
| `twitter:image:alt` | 0/51 | 51/51 = 기존 `og:image:alt` 재사용 | 트위터 접근성·SEO 시그널 |

### 적용 스크립트

`/tmp/apply_og_meta.py` (idempotent):

- `og:image` 라인 다음에 `secure_url` + `type` 삽입
- `twitter:image` 라인 다음에 `twitter:image:alt` 삽입
- 이미 있는 메타는 skip (재실행 안전)
- `EXCLUDE = {"history/index.html", "tools/404.html"}`

### 결과

```
== changed: 51 files
== excluded: 2 files
```

### 샘플 head (`tools/salary/index.html`)

```html
<meta property="og:image" content="https://taystudio.github.io/og-image.png">
<meta property="og:image:secure_url" content="https://taystudio.github.io/og-image.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="TAYSTUDIO — 한국 실생활 도구 모음">
<meta name="twitter:image" content="https://taystudio.github.io/og-image.png">
<meta name="twitter:image:alt" content="TAYSTUDIO — 한국 실생활 도구 모음">
```

---

## 3. 의도적 제외 (결정 기록)

| 파일 | 사유 |
|---|---|
| `history/index.html` | **운영자 전용 페이지로 결정.** `noindex, follow`이라 SERP 영향 X, SNS 공유도 의도하지 않음. 향후 OG audit 대상에서도 제외 |
| `tools/404.html` | SNS 공유 의미 없음. 기존 결정 유지 |

이 두 파일은 향후 신규 OG 메타 추가 시에도 EXCLUDE 유지.

---

## 4. 잔존 작업 마무리 (Tier 1.1 마지막 정리)

### 4.1 ✅ `og:image:alt` + `twitter:image:alt` 텍스트 톤 일치 — 완료 (2026-05-05)

- 이전: `TAYSTUDIO — 한국 실생활 도구 모음`
- 이후: `TAYSTUDIO — 자주 쓰는 무료 도구 모음`
- 51 파일 일괄 갱신 (`og:image:alt` + `twitter:image:alt` 둘 다)
- OG 이미지 카피("자주 쓰는 무료 도구 모음")와 일관
- 단순 Python `str.replace` — head 메타 외 사이트 다른 곳에 동일 텍스트 없음을 grep으로 사전 검증
- 본 md 파일 §2 샘플 + §4.1 본문에 남은 OLD 텍스트 인용은 변경 이력 보존 목적으로 의도적 유지

### 4.2 🟡 카톡 미리보기 캐시 flush — 사용자 수동 액션

- 자동 처리 불가 — 사용자가 직접: https://developers.kakao.com/tool/clear/og
- 카톡은 한 번 캐시한 OG 이미지를 강하게 유지함
- 본 작업 묶음(Tier 1.1 + 후속) **유일하게 남은 잔존 사용자 액션**

---

## 5. 검증

```bash
$ for tag in og:image:type og:image:secure_url twitter:image:alt; do
    grep -l "\"$tag\"" --include="*.html" -r . | wc -l
  done
  51
  51
  51

$ file og-image.png
og-image.png: PNG image data, 1200 x 630, 8-bit/color RGBA, non-interlaced

$ stat -f "%z bytes" og-image.png
519875 bytes
```

| 항목 | 결과 |
|---|---|
| `og:image:type` count | 51/51 ✓ |
| `og:image:secure_url` count | 51/51 ✓ |
| `twitter:image:alt` count | 51/51 ✓ |
| og-image.png 사양 | 1200×630 RGBA, 519KB ✓ |
| 의도적 제외 확인 | `history/index.html` · `tools/404.html` ✓ |

---

## 6. 관련 파일

- `og-image.svg` · `og-image.png` — 카피 갱신 + 폭 균일화
- `history/seo/2026-05-05-og-image-rollout.md` — 전 작업(Tier 1.1 본 rollout)
- `history/seo/strategy.md` — SEO 전략·체크리스트
- `plan.md` §9.1 (결정 기록) · §9.4-1 (잔존 작업 추적)
- `history/index.html` — timeline article

---

## 7. 다음 단계 우선순위

1. 잔존 4.1 alt 톤 일치 결정·일괄 갱신 (~5min)
2. Search Console 등록 + sitemap 재제출 (선점·본질)
3. plan §9.4-2 SEO Tier 1.2 (hub 콘텐츠 깊이) — 클론 방어 + SERP 강화
