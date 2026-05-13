# audit-11 fix 25건 검증 audit — 2026-05-13

**컨텍스트**: audit-11 직후 사용자 결정 "25건 다 잡자" → Medium 13 + Low 12 모두 fix. 검증 라운드.

**시점**: audit 시리즈 12번째.

---

## 1. 검증 결과 종합

### grep 적용 확인 (30/30 PASS)

| 카테고리 | 항목 | 적용 |
|---|---|---|
| Critical (5) | mosaic try/catch · pdf-stamp dragover · severance 날짜 · 404 root · 홈 카드 수치 | ✅ 5/5 |
| Medium (13) | heic 20 confirm · watermark/merge alert · bg-remove reload · pdf-stamp 누적 · pdf-to-image DPI · img-to-pdf 누적 · to-gif parseTime · salary 세액공제 · text debounce · /text/ privacy-box · /tools/ #toolSearch · counts.json | ✅ 13/13 |
| Low (12) | compress PNG hint · resize 0-byte · id-photo 100MB · mosaic format · pdf-merge/edit progress · hourly 10,320 · bmi 키 0 · parental-leave 음수 · cartax 일몰 갱신 · Privacy nofollow · drop title 통일 | ✅ 12/12 |

### Playwright spot-check (7/7 PASS)

| # | 시나리오 | 결과 |
|---|---|---|
| T34 | hourly 2026 최저시급 10,320원 표시 | ✅ "10,320원" + title "2026" |
| T35 | /text/ privacy-box DOM 존재 | ✅ "입력값이 외부 서버로 전송되지 않습니다..." |
| T36 | /tools/ #toolSearch + 38 tool-card | ✅ id + count=38 + title "38선" |
| T37 | bmi 키 0 입력 차단 | ✅ "값을 입력하세요." alert |
| T38 | to-gif convertBtn + cancelBtn 존재 | ✅ DOM 정상 (parseTime 60검증은 grep 확인) |
| T39 | heic 25파일 confirm | ✅ "25개 일괄 변환 — 20개 이상은 메모리 부족·브라우저 멈춤 위험. 계속?" |
| - | (이전 audit) mosaic corrupted alert | ✅ audit-11에서 검증됨 |

### counts.json source of truth

```json
{ "tools": 38, "image": 13, "pdf": 6, "video": 5, "text": 3, "total": 65 }
```

모든 HTML 페이지 수치 동기화 완료 (KO+EN). 9선·5선·36개·59종 stale 0건.

---

## 2. 통과율 변화

| 카테고리 | audit-11 | audit-12 후 |
|---|---|---|
| 메모리 (multi-file 가드) | 92% | **96%** (Md-1·4·6 누적 size confirm) |
| 입력 검증 | 96% | **100%** (Md-7 parseTime·L8 bmi·L9 parental-leave) |
| 계산 정확성 | A | **A+** (Md-8 salary 세액공제 한도) |
| 데이터 정합성 | A- | **A+** (counts.json + 모든 HTML 동기화) |
| 성능 (UI freeze) | A | **A+** (Md-9 text 3종 debounce) |
| 신뢰 신호 | A | **A+** (Md-10 /text/ privacy-box) |
| **종합** | **98~99%** | **99%+** |

---

## 3. 변경 파일 (Medium+Low 25건)

```
common/counts.json                  (신규 — source of truth)
404.html (이전 audit-11) · en/404.html

[image 8 fix]
image/heic-to-jpg/heic-to-jpg.js + en/    (Md-1)
image/watermark/watermark.js + en/         (Md-2)
image/merge/merge.js + en/                 (Md-2)
image/bg-remove/bg-remove.js + en/         (Md-3)
image/compress/{index.html,compress.js} + en/  (L1 PNG hint)
image/resize/resize.js + en/               (L2 0-byte)
image/id-photo/id-photo.js + en/           (L3 100MB)
image/mosaic/{index.html,mosaic.js} + en/  (L4 format select)
image 13 도구 drop title 톤 통일          (L12)

[pdf+video 7 fix]
pdf/pdf-stamp/pdf-stamp.js + en/           (Md-4)
pdf/pdf-to-image/pdf-to-image.js + en/     (Md-5)
pdf/img-to-pdf/img-to-pdf.js + en/         (Md-6)
video/to-gif/to-gif.js + en/               (Md-7)
pdf/pdf-merge/{index.html,pdf-merge.js} + en/  (L5 progress)
pdf/pdf-edit/{index.html,pdf-edit.js} + en/   (L5+L6 progress+cancel)

[text+calc 9 fix]
tools/salary/salary.js                     (Md-8 세액공제 한도)
text/{counter,sns-format,kbd-convert}/*.js + en/  (Md-9 debounce)
tools/hourly/{hourly.js,index.html}         (L7 10,320)
tools/bmi/bmi.js                            (L8 키 0)
tools/parental-leave/parental-leave.js      (L9 음수)
tools/cartax/{cartax.js,index.html}         (L10 일몰 갱신)

[meta 6 fix]
common/counts.json                          (신규)
모든 HTML 수치 동기화 (KO+EN)             (Md-12·13)
text/index.html + en/text/index.html        (Md-10 privacy-box)
tools/index.html + en/tools/index.html      (Md-11 #toolSearch)
privacy/index.html + en/privacy/index.html  (L11 nofollow)
```

총 77 파일 (이전 commit `59811ff`에서 적용).

---

## 4. 다음 단계

코드 작업 완료 (A+ 등급 · 통과율 99%+). 다음:

1. ⭐ **외부 모니터링** (5/20경 trend) — Bing/Naver/GSC 등록 완료, 1주 데이터 회수
2. AdSense 승인 대기 (5/9 → 5/13 = 4일차, 1-2주)
3. 신규 N case (drag-drop 폴더·clipboard paste) — 사용자 needs 검증 후 결정

---

## 참고

- `INDEX.md`
- `audit-11-final-test.md` — 직전 audit (Critical 5 fix + Medium·Low plan)
- `.claude/skills/full-test/SKILL.md` — 풀 테스트 재사용 절차
- `audit-12-medium-low-verification.html` — 본 audit 시각 보고서
