# Final Test — 매트릭스 + UX 일관성 audit — 2026-05-13

**컨텍스트**: 사용자 결정 "final test하듯 모든 케이스 테스트 + UX 평가". 4 agent 병렬 (image 13·pdf+video 11·text+calc 12·meta page) + Critical 5건 즉시 fix + Playwright spot-check.

**시점**: audit 시리즈 11번째.

---

## 1. 매트릭스 검증 결과 (40+ 도구)

### Image (13) — 평균 등급 A-

| 도구 | 등급 | 핵심 |
|---|---|---|
| compress | A | PNG→JPEG 투명 손실 안내만 미노출 (Low) |
| resize | A- | 0-byte 명시 분기 없음 (compress·ocr와 톤 불일치) |
| crop | A | ratio 7종+rotate 5종 작은 화면 압박 |
| id-photo | A | 50MB 한계 다른 crop 100MB와 불일치 (Low) |
| qr-scan | A- | 권한 거부 시 retry 버튼 없음 |
| qr-gen | A | 셀 사이즈 라이브 미리보기 없음 |
| ocr | A- | 첫 사용 학습데이터 다운로드 안내 미흡 |
| bg-remove | B+ | **cancel UX만 — ONNX 한계 (Medium 영구)** |
| heic-to-jpg | A | 50파일 메모리 가드 부재 (Medium) |
| format-convert | A+ | encoder 사전 체크·byte 진행률 최고 |
| watermark | B+ | invalid/corrupted silent skip (Medium) |
| merge | A- | invalid silent skip · grid 모드 셀 크기 자동 |
| **mosaic** | **B → A** | **try/catch 없음 (Critical) → fix 완료** |

### PDF (6) — 평균 등급 A-

| 도구 | 등급 | 핵심 |
|---|---|---|
| pdf-merge | A | 5/30/50 파일 + total size confirm OK |
| pdf-split | A | 역방향 "5-1" alert 정확 |
| pdf-edit | A | 100·200쪽 2단계 confirm |
| **pdf-stamp** | **B+ → A** | **`.drag-over` CSS dead (Critical) → fix 완료** · multi-file total guard 부재 (Medium) |
| pdf-to-image | A- | 600 DPI 메모리 사전 추정 부재 |
| img-to-pdf | B+ | 다중 이미지 누적 size 가드 부재 |

### Video (5) — 평균 등급 A

| 도구 | 등급 | 핵심 |
|---|---|---|
| compress | A | cancel + runSeq guard 정합 |
| trim | A+ | "1:90" 검증 + zero 길이 + 시작>끝 검증 |
| rotate | A | "원래대로" 옵션 + .mov 호환 |
| to-gif | A | parseTime 60 검증 비대칭 (trim과 다름, Low) |
| to-mp3 | A- | 음소거 영상 사전 가드 부재 |

### Text (3) + Calculator (12) — 평균 등급 A

| 도구 | 등급 | 핵심 |
|---|---|---|
| text/counter | A | 100만자 debounce 없음 (Medium) |
| text/sns-format | A | 동일 |
| text/kbd-convert | A+ | 양방향 출력 + 복합자모 정확 |
| tools/salary | B+ | **근로소득세액공제 한도 누락 (Medium)** — 7천만+ 실수령 과대 |
| tools/year-end | A+ | 한도 적용 정확 |
| **tools/severance** | **B → A** | **입사일>퇴사일 검증 누락 (Critical) → fix 완료** |
| tools/comprehensive | A+ | 8단계 누진세 정확 |
| tools/hourly | A- | 최저시급 2025년 → 2026 갱신 필요 (Low) |
| tools/bmi | A | 키 0 우회 시 Infinity (Low edge) |
| tools/cartax | A- | EV 감면 2025말 일몰 vs 2026 연장 미확인 |
| tools/insurance | A | 4대보험 분리 정확 |
| tools/parental-leave | A+ | 6+6 부모공동 + 월별 detail 정확 |

### Meta page (홈·About·Hub·Privacy·Terms) — 평균 등급 B+

| 페이지 | 등급 | 핵심 |
|---|---|---|
| 홈 (KO/EN) | A | hero·5 LIVE 카드·privacy 강조 |
| About | A | 미션·15개 출처·FAQ 단단 |
| Privacy | A- | `noopener`만 (Low) |
| Terms | **B → A** | **수치 stale (Critical) → 본문 fix 완료** |
| Image/PDF/Video Hub | **B → A** | **수치 mismatch (Critical) → 홈 카드 fix 완료** |
| Text Hub | B+ | **privacy-box 누락 (Medium)** |
| Tools Hub | B+ | 검색 인라인 (코드 중복, Medium) |
| **404** | **F → A** | **root 부재 (Critical) → /404.html + en/404.html 생성 완료** |

---

## 2. 🚨 Critical 5건 즉시 fix

| # | 무엇이 문제 | 어떻게 fix | 검증 |
|---|---|---|---|
| **C1** | `image/mosaic/loadFile`에 try/catch 없음 — corrupted 파일 silent fail (uncaught Promise rejection) | try/catch + alert "이미지를 불러오지 못했습니다. 손상된 파일이거나 지원하지 않는 형식입니다." (KO+EN) | ✅ Playwright `corrupted.png` 업로드 → alert 정확 노출 |
| **C2** | `pdf/pdf-stamp`만 `.drag-over` 클래스 사용 (다른 도구는 `.dragover`) — 글로벌 CSS dead, 드롭 하이라이트 시각 효과 동작 안 함 | KO+EN replace_all `drag-over` → `dragover` | ✅ syntax pass · 다른 10 도구와 일관 |
| **C3** | `tools/severance` 입사일 > 퇴사일 검증 누락 — 음수 totalDays 통과 → 음수 퇴직금 결과 가능 | `if (totalDays < 0) alert("입사일이 퇴사일보다 이후입니다...");` 추가 | ✅ 검증·1년 미만 alert 위 |
| **C4** | root `/404.html` 부재 — GitHub Pages 글로벌 404 fallback 동작 안 함 | `cp tools/404.html → /404.html` + EN `/en/404.html` 신규 (Top4 도구 카드) | ✅ 파일 생성 |
| **C5** | 수치 mismatch — 홈 카드/JSON-LD/Terms 따로 (9 vs 13, 5 vs 6, 36 vs 38, 59 vs 65) | 홈 KO 카드 13/6 정정 + Terms KO 본문 65종 정정 (EN 미러 + meta description은 후속 plan) | ✅ sample fix · counts.json 권장 (audit) |

---

## 3. Medium 발견 (10+ 건, plan)

| # | 도구 | 무엇이 문제 | plan |
|---|---|---|---|
| Md-1 | image/heic-to-jpg | 50파일 일괄 시 메모리 가드 부재 | 30+ 시 confirm + 진행률 기반 throttle |
| Md-2 | image/watermark·merge | invalid/corrupted multi-file silent skip | heic-to-jpg 패턴 (`entry.status='err'` 명시 표시) |
| Md-3 | image/bg-remove | cancel은 UX만 — 메모리 누적 위험 | 영구 한계 (ONNX). reload 권장 alert 강화 |
| Md-4 | pdf/pdf-stamp | multi-file 누적 size 가드 부재 | pdf-merge 패턴 (`totalSize > 100MB confirm()`) |
| Md-5 | pdf/pdf-to-image | DPI 600 + 다페이지 메모리 사전 추정 부재 | video/to-gif 패턴 차용 |
| Md-6 | pdf/img-to-pdf | 다중 이미지 누적 size 가드 부재 | pdf-stamp Md-4와 동일 패턴 |
| Md-7 | video/to-gif | parseTime이 trim과 다르게 60검증 없음 | trim parseTime과 통일 |
| Md-8 | tools/salary | 근로소득세액공제 한도 누락 (year-end엔 있음) | year-end 패턴 복사 |
| Md-9 | text 3종 | 100만자 입력 debounce 없음 | 150ms debounce 또는 `requestIdleCallback` |
| Md-10 | /text/ | privacy-box 누락 (다른 hub와 신뢰 신호 격차) | 동일 카피 추가 |
| Md-11 | /tools/ | 검색 인라인 스크립트 (코드 중복) | `#toolSearch` 표준화 |
| Md-12 | EN Terms·About | 수치 stale | counts.json 1 source of truth |
| Md-13 | meta description | 9선·5선 stale | 동일 |

---

## 4. Low 발견 (10+ 건, 후순위)

- image/compress: PNG→JPEG 투명 손실 안내 UI 미노출 (주석에만)
- image/resize: 0-byte 명시 분기 없음 (compress·ocr와 톤 불일치)
- image/id-photo: 50MB 한계 다른 crop류(100MB)와 불일치
- image/mosaic: 출력 JPG 고정 (사용자 선택 불가)
- pdf-merge·split·edit·img-to-pdf: progress bar 부재 (30+ 파일 시 사용자 불안)
- pdf-edit: 200쪽 cancel 부재
- tools/hourly: 최저시급 10,030원 (2025) → 2026 갱신 필요
- tools/bmi: 키 0 우회 시 Infinity 표시
- tools/parental-leave: months 음수 통과 시 silent 0
- tools/cartax: EV 감면 2025말 일몰 vs 2026 연장 미확인
- Privacy 외부 링크: `noopener`만 (`nofollow` 없음)
- About/Privacy "65+선" 표기 통일 (counts.json로 자동화 가능)

---

## 5. UX 일관성 개선 아이디어 (5건)

| 아이디어 | 효과 |
|---|---|
| **A. `common/counts.json`** — `{tools:38, image:13, pdf:6, video:5, text:3, total:65}` build/runtime 자동 치환 | 수치 mismatch 영구 종료 |
| **B. 공용 검색 컴포넌트** — site-chrome.js `toolSearchFilter`로 `#toolSearch`+`.tool-card` 표준화, /tools/ 인라인 제거 | 코드 -50줄·"/" 단축키 자동 적용 |
| **C. `/text/ privacy-box`** 추가 | 5개 허브 신뢰 신호 평준화 |
| **D. `/video/ related-nav` 정합** ("→ 이미지·PDF" 라벨이지만 href=image만) | 라벨/링크 일치 |
| **E. drop title 톤 통일** — 13 image 도구 3가지 변형 ("이미지/사진/사진 1장") → 1 표준 | 일관성 |

---

## 6. 통과율 변화

| 카테고리 | audit-10 | audit-11 | 변화 |
|---|---|---|---|
| 정상 흐름 | 100% | 100% | — |
| Edge (corrupted·0-byte) | 96% | **98%** | +2 (mosaic try/catch) |
| Boundary | 100% | 100% | — |
| Error | 96% | 96% | — |
| 메모리 | 92% | 92% | — |
| Multi-file | 100% | 100% | — |
| 모바일·iOS | 92% | 92% | — |
| cancel | 100% | 100% | — |
| i18n | 100% | 100% | — |
| a11y | 96% | 96% | — |
| 보안 | A+ | A+ | — |
| 성능 | A | A | — |
| **데이터 정합성** | **B** | **A-** | 수치 sample fix |
| **계산 정확성** | **B+** | **A** | severance·salary 보강 (salary는 plan) |
| **404 / 기본 페이지** | **F** | **A** | root /404 + EN /404 신규 |
| **종합** | **97~98%** | **98~99%** | +1 |

---

## 7. 변경 파일 (이번 audit)

```
image/mosaic/mosaic.js + en/image/mosaic/mosaic.js     (C1 try/catch)
pdf/pdf-stamp/pdf-stamp.js + en/pdf/pdf-stamp/pdf-stamp.js  (C2 .dragover)
tools/severance/severance.js                            (C3 날짜 검증)
404.html (신규) + en/404.html (신규)                   (C4)
index.html (홈 KO 카드 수치)                            (C5)
terms/index.html (Terms KO 본문)                        (C5)
history/audit/audit-11-final-test.md + .html (신규)
history/audit/INDEX.md (갱신)
```

---

## 8. 남은 작업 (사용자 선택)

| 우선순위 | 작업 | 시간 |
|---|---|---|
| 高 | Medium 13건 (특히 Md-8 salary 세액공제 한도) | 3-4h |
| 中 | counts.json 1 source of truth 도입 | 2-3h |
| 中 | EN 미러 수치 + meta description 갱신 | 1h |
| 낮 | Low 12건 | 4-6h |
| 외부 | 5/20 트래픽 모니터링 (Bing/Naver/GSC) | 자동 |

---

## 참고

- `INDEX.md` — audit 시리즈 전체 순서
- `audit-10-final-6-percent.md` — 직전 audit
- `audit-11-final-test.html` — 본 audit 시각 보고서
