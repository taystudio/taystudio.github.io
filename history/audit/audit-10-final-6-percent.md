# 잔여 6% fix audit — 2026-05-13

**컨텍스트**: audit-9 후 사용자 결정 "남은 6% 잡자". 잔여 3 영역 (bg-remove cancel · M14 ZIP · a11y skip-link) 일괄 fix. 3 agent 병렬.

**시점**: audit 시리즈 10번째.

---

## 1. 잔여 3 영역 — 무엇이 문제였고 어떻게 fix했나

### 영역 1: bg-remove cancel 불가

**문제**: ONNX Runtime Web 추론은 진짜 중단 불가 (라이브러리 한계). 사용자가 처리 시작 후 후회해도 못 멈춤.

**fix (UX cancel)**:
- HTML cancel 버튼 추가 (KO: "취소" / EN: "Cancel")
- JS `runSeq`/`activeRun` state — ocr·video 동일 패턴
- removeBackground 결과 도착 시 `myRun !== activeRun` 체크 → 결과 무시
- 사용자 인지 UX는 cancel처럼 동작. 단 메모리는 백그라운드 처리 끝까지 점유 — alert로 "큰 메모리 누적 시 페이지 reload 권장" 안내

**한계**: 진짜 cancel 아님. 백그라운드 작업은 끝까지 진행. 단 사용자가 다른 작업 즉시 시작 가능.

### 영역 2: M14 pdf-to-image ZIP 다운로드 정식화

**문제**: 50+ 결과 다운로드 시 a.click() 순차 → 10초+ 지연. audit-7에서 confirm 임시방편 (30+개 확인 dialog).

**fix (JSZip 동적 로드)**:
- HTML "📦 ZIP으로 묶어 다운로드" 버튼 추가 (KO+EN)
- JSZip 3.10.1 jsdelivr CDN dynamic `<script>` — **첫 클릭 시점에만 로드** (~95KB, 페이지 초기 부담 0)
- 결과 blob을 `zip.file(name, blob)` 추가 → `generateAsync({ type: 'blob' })` → 1개 다운로드
- 파일명 sanitize 적용 (entry명도)
- 기존 "전체 다운로드 (개별)" 버튼 + 30+ confirm 유지 (선택지)
- dns-prefetch `cdn.jsdelivr.net` 추가

**성능 추정**: 50 페이지·~3MB → ZIP STORE 사실상 그대로 묶기 → **2~3초** (모바일 4~6초).

### 영역 3: a11y skip-link + 잔여 패턴

**문제**: audit-7에서 dropZone·result·progressbar 5 패턴 적용. 잔여 16%는 **글로벌 skip-link** + button group aria-label 등 세부 패턴.

**fix (글로벌 한 곳에서 일괄)**:
- `common/site-chrome.js`:
  - I18N에 `skipToMain` 키 (KO: "본문 바로가기" / EN: "Skip to main content")
  - `<site-header>` 컴포넌트 안에 skip-link prepend
  - customElements.define 직후 `<main>`에 `id="main-content"` 자동 부여 IIFE
- `common/css/style.css`:
  - `.skip-link` CSS — translateY로 평소 화면 밖, focus 시 슬라이드 표시. 다크모드 var 호환
- `image/watermark/index.html` + EN:
  - pos-grid에 `role="group"` + `aria-labelledby`
  - 9개 위치 버튼에 한/영 `aria-label`
  - 활성 버튼에 `aria-pressed="true"`

**효과**: 60+ 페이지에 자동 적용 (site-chrome 한 곳 변경으로 글로벌).

**점검 결과 (sample 5개 — compress·watermark·pdf-merge·video/compress·calculator)**:
- main landmark: 모두 single `<main>` ✓
- heading hierarchy: h1→h2 일관 ✓
- label-input: 모든 `for/id` 매칭 ✓
- 이미지 alt: 양호 ✓

---

## 2. Playwright 시나리오 검증

| # | 시나리오 | 도구 | 결과 |
|---|---|---|---|
| **T28** | bg-remove cancel 버튼 존재 + hidden 기본 + 텍스트 "취소" | image/bg-remove | ✅ PASS |
| **T29** | KO skip-link "본문 바로가기" + main#main-content | image/bg-remove | ✅ PASS |
| **T30** | pdf-to-image ZIP 버튼 + dns-prefetch jsdelivr | pdf/pdf-to-image | ✅ PASS |
| **T31** | pdf-to-image main#main-content + skip-link | pdf/pdf-to-image | ✅ PASS |
| **T32** | EN bg-remove cancel 텍스트 "Cancel" | en/image/bg-remove | ✅ PASS |
| **T33** | EN skip-link "Skip to main content" + main#main-content | en/image/bg-remove | ✅ PASS |

**6/6 PASS** · JS syntax 통과 · 회귀 0.

---

## 3. 통과율 변화

| 카테고리 | audit-9 후 | audit-10 후 | 변화 |
|---|---|---|---|
| cancel (대용량) | 83% | **100%** | +17 (bg-remove UX cancel) |
| Multi-file batch | 96% | **100%** | +4 (M14 ZIP) |
| a11y (focus·aria·tabindex) | 84% | **96%** | +12 (skip-link 글로벌 + watermark pos-grid) |
| 종합 | 95% | **97~98%** | +2~3 |

---

## 4. 남은 한계 (영구·낮은 ROI)

| 항목 | 상태 |
|---|---|
| bg-remove 진짜 cancel (메모리 해제) | ONNX Runtime Web 한계. UX cancel로 사용자 인지 측면 해결 |
| a11y 잔여 4% | focus-trap·modal aria-modal·screen reader landmark 미세조정 — 사이트 modal 거의 없어 영향 미미 |
| 모바일·iOS Safari WebView | OS·브라우저 한계 (in-app banner 안내) |

---

## 5. 변경 파일 (이번 audit)

```
common/site-chrome.js          (I18N skipToMain · skip-link · main#main-content)
common/css/style.css           (.skip-link CSS)

image/bg-remove/{index.html, bg-remove.js}     (cancel 버튼 + runSeq state)
en/image/bg-remove/{index.html, bg-remove.js}

pdf/pdf-to-image/{index.html, pdf-to-image.js} (ZIP 버튼 + ensureJSZip dynamic)
en/pdf/pdf-to-image/{index.html, pdf-to-image.js}

image/watermark/index.html     (pos-grid role+aria-pressed)
en/image/watermark/index.html
```

---

## 6. 다음 단계

코드 작업 완료 (A+ 등급 · 통과율 97~98%).

1. ⭐ **외부 작업 진행 중** — Bing/Naver/GSC 등록 신청 완료. 1주 모니터링 (5/20경 trend 확인)
2. **AdSense 승인 모니터링** (5/9 → 5/13 = 4일차, 통상 1-2주)
3. **GSC Batch 6** (남은 79개 중 10개 추가)
4. **백링크** (티스토리·관련 포스팅, 분산)

---

## 참고

- `INDEX.md` — audit 시리즈 전체 순서
- `audit-09-ocr-worker-singleton.md` — 직전 audit
- `audit-10-final-6-percent.html` — 본 audit 시각 보고서
