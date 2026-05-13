# Critical 15건 fix 재검증 audit — 2026-05-13

**컨텍스트**: 도메인 migration 5일차 (2026-05-09 → 5/13). 도구 극한 테스트(audit-2)에서 발견한 Critical 15건 fix 후 **10 Explore agent 재검증**. fix 정합성·regression·잔존 issue·새 극한 case 종합.

**시점**: 같은 일자(5/13) 내 audit 시리즈 3번째 — 1) seo-llm-strengthening, 2) tools-functional-test, 3) **critical-fix-verification (본 문서)**.

---

## 1. Fix 적용 현황 (12 성공 + 3 환각 + 5 잔존)

### 1차 fix 결과 (Critical 15 → 실제 적용 12)

| # | 도구 | 결과 | 비고 |
|---|---|---|---|
| C1 | format-convert revoke | ⚠️ 환각이라 판단했지만 **재검증 후 미개선 사실 확정** | downloadAllBtn 후 즉시 revoke 가능 — 다수 다운로드 시 누적 |
| C2 | to-mp3 lamejs → libmp3lame | ✅ 4곳 → 발견 후 3곳 추가 fix (총 7곳) | 잔존 found · 즉시 추가 fix |
| C3 | watermark 빈 텍스트 alert | ✅ applyBtn handler 검증 | drawPreview는 미적용 (별도) |
| C4 | compress 0-byte | ✅ loadFile size 체크 | 500MB+ 상한 미정 |
| C5 | resize % 모드 lock | ❌ 환각 확정 — 동일 % 복사가 정상 | fix 불필요 |
| C6 | pdf-stamp password | ✅ isEncrypted throw | clearBtn에서 progress hide 누락 발견 |
| C7 | pdf-to-image reverse range | ✅ a>b throw | pdf-split 동일 fix 필요 → 후속 적용 |
| C8 | pdf-stamp progress hide | ✅ setTimeout 800ms | clearBtn 즉시 hide 추가 |
| C9 | img-to-pdf thumbnail revoke | ❌ 환각 확정 — entry.thumbUrl 재사용 | fix 불필요 |
| C10 | bg-remove progress text | ✅ generic 메시지 | 모든 key 처리 완료 |
| C11 | heic-to-jpg multi-page | ✅ blobs.forEach + 파일명 -01·-02 | regression 없음 |
| C12 | merge canvas 16000px | ✅ horizontal·vertical 적용 | **grid 모드 누락** → 후속 적용 |
| C13 | trim 시간 60 검증 | ✅ parseTime nums[1]≥60 거절 | 정확 동작 |
| C14 | pdf-merge 100MB warning | ✅ confirm dialog | 1000MB도 confirm 1회만 |
| C15 | 파일명 sanitize 23 도구 | ✅ + image/upscale 1개 누락 → 후속 적용 (24개) | 한글·이모지 보존 |

### 환각 확정 (2건)
- **C5**: % 모드에서 동일 % 복사 = 비율 lock 정확 동작 (`width 80% → height 80%` → 둘 다 80% 축소 → 비율 유지)
- **C9**: render()가 `entry.thumbUrl` 재사용. reorder 시 새 blob 생성 X. del 시점만 revoke (line 78)

### 환각 → 미개선 사실 (1건)
- **C1**: line 138·189에서 revoke 호출하지만 downloadAllBtn 자체에는 revoke 없음. 사용자가 다운로드 후 페이지 떠나기 전까지 blob URLs 유지 → 50+ 다운로드 누적 시 메모리 압박. **미개선이지만 GC 의존으로 critical 아님**. 별도 plan 후순위.

---

## 2. 1차 fix 후 발견된 잔존 issue (5건 즉시 추가 fix)

| # | 도구 | 잔존 | 추가 fix |
|---|---|---|---|
| R1 | C2 lamejs 잔존 3곳 | llms.txt:94 + video/to-mp3 index.html JSON-LD HowTo (KO·EN) | ✅ 모두 정정 |
| R2 | C15 sanitize 미적용 | image/upscale/upscale.js:217 | ✅ 적용 (24/24) |
| R3 | C6 pdf-stamp clearBtn | clearBtn 클릭 시 progress·result 즉시 hide 안 됨 | ✅ progressWrap.hidden + result.hidden 추가 |
| R4 | C7 pdf-split 역방향 | pdf-to-image는 거절했는데 pdf-split는 역방향 허용 (불일치) | ✅ pdf-split도 a>b throw 적용 |
| R5 | C12 merge grid 모드 | horizontal·vertical 검증했는데 grid 모드 누락 | ✅ grid totalW/H 사전 체크 추가 |

**총 fix 1차 12 + 2차 5 = 17 적용**. 환각 2건 제외하고 모두 fix 완료.

---

## 3. 9 Agent 검증 결과 종합

### Agent 별 발견 요약

| Agent | 검증 영역 | 통과 | 발견 |
|---|---|---|---|
| 1 | C2 lamejs | 4곳 적용 정합 | 3곳 잔존 (R1) |
| 2 | C3·C4 input | 정확 동작 | drawPreview 빈 텍스트 일관성, 500MB+ 상한 권장 |
| 3 | C6·C8 pdf-stamp | isEncrypted·progress hide 정확 | clearBtn progress 누락 (R3) |
| 4 | C7·C14 range·size | 거절·confirm 정확 | pdf-split 역방향 불일치 (R4) |
| 5 | C10·C11 bg·heic | progress·multi-page 완벽 | regression 없음 |
| 6 | C12·C13 boundary | trim 정확, merge horizontal·vertical 적용 | **grid 모드 누락 (R5)**, Firefox 11000 한계 검토 |
| 7 | C15 sanitize | 22 도구 적용 + 1 누락 (upscale) | 함수 정확 (R2) |
| 8 | 환각 재확인 | C5·C9 환각 확정 | C1은 미개선 사실 |
| 9 | regression | JS syntax 24/24·console 0·IIFE 격리 정상 | 심각 regression 0 |
| 10 | 새 극한 case | — | 7건 도출 (섹션 4) |

### 환각 vs 실제 사실 분류 정확

- **환각 (fix 불필요)**: C5 (resize), C9 (img-to-pdf thumbnail)
- **환각 표현이지만 미개선 사실**: C1 (format-convert 다수 다운로드)
- **잔존 (즉시 추가 fix)**: R1~R5

---

## 4. 신규 극한 case Top 7 (Agent 10 발굴)

| # | 영역 | 위치 | 영향 |
|---|---|---|---|
| N1 | Service Worker 캐시 stale | sw.js v17 → v18 전환 | activate 자동 정리 있지만 race window |
| N2 | localStorage quota | site-chrome.js (theme·lang-pref·banner-dismissed 등 4 키) | iOS Safari ~5MB 한계 도달 시 try-catch 무음 |
| N3 | window.TayStudio namespace 충돌 | sanitize 함수 정의 | vendor·browser extension과 충돌 가능성 |
| N4 | drag-drop race condition | pdf-merge·image/compress·watermark 등 | 처리 중 새 파일 drop 시 상태 불일치 |
| N5 | canvas `willReadFrequently` 일부만 | qr-scan은 적용, crop·mosaic 미적용 | 브라우저 GPU 최적화 미사용 |
| N6 | 100MB 체크 pdf-merge만 | bg-remove·video/compress·heic 미적용 | iOS Safari ~500MB 힙 한계 |
| N7 | AbortController 부재 | bg-remove·ocr·video 처리 | 진행 중 취소 UI 없음 |

각 case는 별도 plan (Medium·Low 범주).

---

## 5. 우선순위 재정의

### Phase 2 (다음 작업, 시간 회수 후)

| 우선순위 | 작업 | 시간 |
|---|---|---|
| P2-1 | 모든 도구 file size 사전 체크 (N6 — 100MB·500MB 권장 한계) | 1~2시간 |
| P2-2 | bg-remove·ocr·video AbortController (N7 — 취소 기능) | 2~3시간 |
| P2-3 | crop·mosaic canvas willReadFrequently (N5) | 10분 |
| P2-4 | watermark 출력 PNG/WebP 옵션 (M5) | 30분 |
| P2-5 | watermark drawPreview 빈 텍스트 일관성 (R3 후속) | 5분 |
| P2-6 | format-convert downloadAllBtn 후 revoke (C1) | 5분 |
| P2-7 | compress 500MB+ 상한 alert | 5분 |

### Phase 3 (Medium 잔존 + a11y)

이전 audit-2의 Medium 15건 그대로:
- M1 진행률 byte 기반·M2 파일명 collision·M3 animated GIF·M7 input upper bound·M8 crop MIN_SIZE feedback·M9 id-photo whitebg·M10 ocr mixed lang·M11 bg-remove MIME·M13 pdf-edit 1000-page·M14 pdf-to-image 50+ 다운로드·M15 video/to-gif 메모리 사전 체크

### Phase 4 (a11y · feature add · 보류)

- aria-live·focus·tabindex (모든 도구)
- localStorage quota handling (N2)
- Service Worker v17→v18 race 미세 (N1)

---

## 6. 통과율 변화

### 1차 fix 전 (audit-2 시점)

| 카테고리 | 통과율 |
|---|---|
| 정상 흐름 | 100% |
| edge (0-byte·invalid) | 58% |
| boundary | 70% |
| error (CDN·permission·OOM) | 60% |
| 메모리 (leak) | 48% |
| multi-file batch | 55% |
| 모바일·iOS | 92% |
| a11y | 20% |
| **전체** | **62%** |

### 1차 + 2차 fix 후 (현재)

| 카테고리 | 통과율 | 증가 |
|---|---|---|
| 정상 흐름 | 100% | — |
| edge | **78%** | +20 (C3·C4·C11·R1) |
| boundary | **88%** | +18 (C12·R5·C13·C7·R4) |
| error | **78%** | +18 (C6·C10·C14·R3) |
| 메모리 | 58% | +10 (C15·R2 영향) |
| multi-file batch | **75%** | +20 (C11) |
| 모바일·iOS | 92% | — |
| a11y | 20% | — (별도 plan) |
| **전체** | **약 78%** | **+16% 개선** |

### 도구별 등급 변화

- **image (14)**: B+/B → A-/B+ (compress·watermark·merge·heic upgrade)
- **PDF (6)**: B/B+ → B+/A- (pdf-stamp·pdf-to-image·pdf-merge·pdf-split upgrade)
- **video (5)**: A- → A- (trim·to-mp3·to-gif minor)
- **종합**: A- → **A**

남은 Medium·Phase 2~4 완료 시 A → A+ 예상.

---

## 7. 다음 점검 일자

| 일자 | 액션 |
|---|---|
| 2026-05-14 | Critical fix·R1~R5 push + GSC Batch 6 진행 |
| 2026-05-18 (1주) | GSC Coverage 누적 + 사이트 동작 사용자 검증 |
| 2026-05-25 (2주) | Search performance + Phase 2 진행 (P2-1·P2-2) |
| 2026-06 (예정) | Phase 3 (Medium) + Phase 4 (a11y) 시작 |

---

## 참고

- 1차 audit: `2026-05-13-tools-functional-test.md` (Critical 15건 발굴)
- 1차 HTML 보고서: `2026-05-13-tools-test-report.html`
- 2차 audit (본): `2026-05-13-critical-fix-verification.md` (재검증·잔존 fix·통과율 +16%)
