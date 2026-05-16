# audit 시리즈 INDEX

audit 보고서 진행 순서. 같은 일자에 여러 audit이 발생하면 작업 시간 순으로 매김.

---

## 2026-05-11

### audit-1: traffic-engagement-checkup
- **파일**: [`audit-01-traffic-engagement-checkup.md`](audit-01-traffic-engagement-checkup.md)
- **컨텍스트**: 도메인 migration 2일 전 트래픽·dwell 점검
- **결과**: SEO·LLM 노출 후속 plan 도출

---

## 2026-05-13 (8개 — Phase 1·2·3 + 보안·성능)

### audit-2: seo-llm-strengthening
- **파일**: [`audit-02-seo-llm-strengthening.md`](audit-02-seo-llm-strengthening.md)
- **컨텍스트**: LLM 친화 SEO 강화 작업
- **작업**: robots.txt LLM 크롤러 정책, llms.txt, JSON-LD Schema (HowTo·Dataset·WebApplication), description i18n
- **결과**: Schema·SEO·LLM 친화 A+

### audit-3: tools-functional-test (250 케이스 발굴)
- **파일**: [`audit-03-tools-functional-test.md`](audit-03-tools-functional-test.md) · [`audit-03-tools-functional-test.html`](audit-03-tools-functional-test.html)
- **컨텍스트**: 12 agent 병렬 + Playwright sample로 25 도구 250 케이스 극한 테스트
- **발견**: Critical 15 · Medium 15 · Low/a11y 13
- **결과**: 종합 A- · 통과율 62%

### audit-4: critical-fix-verification (Phase 1)
- **파일**: [`audit-04-critical-fix-verification.md`](audit-04-critical-fix-verification.md) · [`audit-04-critical-fix-verification.html`](audit-04-critical-fix-verification.html)
- **컨텍스트**: Critical 15건 + 잔존 R1~R5 일괄 fix 후 10 agent 재검증
- **작업**: C1~C15 + R1~R5 = 17 fix (환각 2건 제외)
- **결과**: 통과율 62% → **78%** (+16)

### audit-5: phase2-quality-fix (Phase 2 — 1차)
- **파일**: [`audit-05-phase2-quality-fix.md`](audit-05-phase2-quality-fix.md) · [`audit-05-phase2-quality-fix.html`](audit-05-phase2-quality-fix.html)
- **컨텍스트**: 품질 코드 fix (OOM 사전 차단·메모리 효율)
- **작업**: P2-1a 13 도구 size 체크 utility · P2-3 willReadFrequently · P2-7 compress 상한
- **결과**: 통과율 78% → **82.5%** (추정)

### audit-6: phase2-completion-playwright (Phase 2 — 완료)
- **파일**: [`audit-06-phase2-completion-playwright.md`](audit-06-phase2-completion-playwright.md) · [`audit-06-phase2-completion-playwright.html`](audit-06-phase2-completion-playwright.html)
- **컨텍스트**: Phase 2 잔여 5건 일괄 + Playwright 실 테스트
- **작업**: P2-1b PDF·multi-file size 체크 · P2-4 watermark PNG/WebP · P2-2-ocr cancel · P2-2-video cancel · i18n fix · EN 22 도구 size 체크 추가
- **검증**: Playwright 14/14 PASS · KO 23 = EN 23 대칭
- **결과**: 통과율 → **87%**

### audit-7: phase3-medium-a11y (Phase 3)
- **파일**: [`audit-07-phase3-medium-a11y.md`](audit-07-phase3-medium-a11y.md) · [`audit-07-phase3-medium-a11y.html`](audit-07-phase3-medium-a11y.html)
- **컨텍스트**: 사용자 결정 "품질 우선" — Medium 잔존 + a11y 강화
- **작업**: Medium 12건 fix (M1·M2·M3·M4·M6·M7·M8·M9·M11·M13·M14·M15) · a11y 25 도구 (role·tabindex·keydown·aria-live·progressbar)
- **검증**: Playwright 10/10 PASS
- **결과**: 통과율 → **94%** · a11y 카테고리 20% → 84% (+64%p)

### audit-8: security-xss-fix
- **파일**: [`audit-08-security-xss-fix.md`](audit-08-security-xss-fix.md) · [`audit-08-security-xss-fix.html`](audit-08-security-xss-fix.html)
- **컨텍스트**: 사용자 요청 "또 오류나는 거 없음?" — 극한 케이스 재점검
- **발견**: 12 영역 중 11 PASS · **HIGH XSS 1건** (파일명 innerHTML 직접 삽입, 14 위치)
- **작업**: `escapeHtml` utility + 8 파일 (KO 4 + EN 4) 일괄 escape + SW CACHE_VERSION v19
- **검증**: Playwright XSS payload `<img onerror>` 차단 확인
- **결과**: 보안 카테고리 B → A+ · 통과율 → **95%**

### audit-9: ocr-worker-singleton (성능 fix)
- **파일**: [`audit-09-ocr-worker-singleton.md`](audit-09-ocr-worker-singleton.md) · [`audit-09-ocr-worker-singleton.html`](audit-09-ocr-worker-singleton.html)
- **컨텍스트**: 자체 점검 — Phase 2 cancel 기능 추가의 부작용 발견
- **발견**: OCR createWorker 매 호출마다 init ~2-3초 (5장 연속 시 +10~15초 누적)
- **작업**: workerCache singleton 패턴 (같은 lang 재사용, 다른 lang 또는 cancel 시에만 terminate)
- **결과**: 두 번째 호출부터 init 0초

### audit-10: final-6-percent (잔여 6% fix)
- **파일**: [`audit-10-final-6-percent.md`](audit-10-final-6-percent.md) · [`audit-10-final-6-percent.html`](audit-10-final-6-percent.html)
- **컨텍스트**: 사용자 결정 "남은 6% 잡자"
- **작업**: bg-remove UX cancel · M14 pdf-to-image ZIP 정식화 (JSZip dynamic) · a11y skip-link 글로벌 (60+ 페이지 자동) · watermark pos-grid aria-label/aria-pressed
- **검증**: Playwright 6/6 PASS
- **결과**: 통과율 → **97~98%** · cancel 100% · multi-file 100% · a11y 84%→96%

### audit-11: final-test (final 매트릭스 + UX 일관성)
- **파일**: [`audit-11-final-test.md`](audit-11-final-test.md) · [`audit-11-final-test.html`](audit-11-final-test.html)
- **컨텍스트**: 사용자 결정 "final test하듯 모든 케이스 테스트 + UX 평가"
- **방법**: 4 agent 병렬 (image 13·pdf+video 11·text+calc 12·meta page) + Playwright spot-check
- **발견**: Critical 5건 · Medium 13건 · Low 12건 + UX 개선 아이디어 5건
- **Critical fix (5)**: mosaic try/catch · pdf-stamp .dragover 통일 · severance 날짜 역전 · root /404.html + en/404 · 수치 sample fix
- **결과**: 통과율 → **98~99%** · 데이터 정합성 B→A- · 계산 정확성 B+→A · 404 F→A

### audit-12: medium-low-verification (25건 검증)
- **파일**: [`audit-12-medium-low-verification.md`](audit-12-medium-low-verification.md) · [`audit-12-medium-low-verification.html`](audit-12-medium-low-verification.html)
- **컨텍스트**: 사용자 결정 "25건 다 잡자" 후 검증 라운드
- **작업**: Medium 13 + Low 12 = 25건 모두 fix 적용 검증
- **검증**: grep 30/30 적용 확인 · Playwright spot-check 7/7 PASS (hourly 10320 · text privacy-box · tools #toolSearch · bmi 키 0 · heic 25 confirm 등)
- **counts.json**: 1 source of truth 도입 — 모든 HTML 수치 동기화 (KO+EN)
- **결과**: 통과율 → **99%+** · 데이터 정합성 A+ · 입력 검증 100%

---

## 2026-05-14

### audit-13: n10-n11-folder-paste (마지막 N case)
- **파일**: [`audit-13-n10-n11-folder-paste.md`](audit-13-n10-n11-folder-paste.md) · [`audit-13-n10-n11-folder-paste.html`](audit-13-n10-n11-folder-paste.html)
- **컨텍스트**: 사용자 결정 "조용히 스킵되면 안 되는 기능들 있으니까 앱의 편의성도 고려해야함" — audit-5에서 보류됐던 N10·N11 처리
- **작업**:
  - site-chrome.js utility 3종 추가 (`showToast`·`rejectFolderDrop`·`bindPasteImage`, KO+EN 분기)
  - N10: drop handler 47곳 (image 25 + pdf 12 + video 10) 폴더 감지 가드 일괄 적용 (pdf-edit 내부 reorder 제외)
  - N11: image 12 도구 × KO+EN = 24 파일에 Ctrl+V paste 핸들러 (single/multi/qr-scan 패턴별 자동 연결)
  - SW v19 → v20
- **검증**: Playwright KO·EN spot-check 9/9 PASS · `node --check` 47 파일 syntax 0 fail
- **결과**: 모든 N case 정리 완료 (5/5) · 편의성 카테고리 A → A+

---

## 2026-05-15 ~ 16

### audit-14: lcp-investigation (LCP 회귀 진상 + lazy 매트릭스 + 큰 파일)
- **파일**: [`audit-14-lcp-investigation.md`](audit-14-lcp-investigation.md)
- **컨텍스트**: Cloudflare Web Analytics LCP P75 596ms 표시 (audit-01 340ms 대비 +75%) + 트래픽 감소 인지. AdSense script 영향 의심
- **방법**: head diff (5/10 vs HEAD) + Playwright 실측 (desktop·mobile·calc) + sub-agent 정적 분석 + 200MB 큰 파일 시나리오
- **발견**:
  - **실측 LCP 회귀 없음** — Playwright desktop 236ms / mobile 276ms / salary 268ms 모두 audit-01 수준 유지
  - CWA P75 596ms는 cold-network 사용자 25% 분포 → 단일 system lever = **`/common/site-chrome.js` 43KB sync head** (130 페이지 영향)
  - AdSense iframe 163ms는 LCP 236ms 이후 발생 → LCP 영향 0
  - Medium 5건: site-chrome.js defer · AdSense preconnect · EN meta description 160자+ 26건 · KO description 짧음 5건 · watermark 하드코딩 `#fff`
  - Low 5건: result preview lazy 14건 · .gitignore husband-care-deploy · robots Disallow · JSON-LD 분리 · EN title 60자+
- **결과**: Critical 0건 (실측 LCP 정상) · 통과율 99%+ 유지 · system lever 1개 발굴 (audit-15 plan)

---

## 통과율 변화 흐름

```
audit-3  (250 케이스)          → 62%
audit-4  (Critical 15 fix)     → 78%    (+16)
audit-5  (Phase 2 1차)         → 82.5%  (+4.5)
audit-6  (Phase 2 완료)        → 87%    (+4.5)
audit-7  (Phase 3 Medium+a11y) → 94%    (+7)
audit-8  (보안 XSS fix)        → 95%    (+1)
audit-9  (OCR singleton)       → 95%+   (성능 카테고리)
audit-10 (잔여 6% fix)         → 97~98% (+2~3)
audit-11 (final test)          → 98~99% (+1)
audit-12 (Medium+Low 검증)     → 99%+   (Medium 13+Low 12)
audit-13 (N10·N11 처리)        → 99%+   (편의성 A → A+, N case 5/5 완료)
audit-14 (LCP 진상 + lazy + 큰 파일) → 99%+ (실측 LCP 정상, CWA P75 system lever 1개 발굴)
```

---

## 다음 단계

코드 작업 사실상 완료 (A+ 등급). audit-14 발견 기반으로:

1. **M1: site-chrome.js render-blocking 해소** (CWA P75 596ms → 400ms대 site-wide 효과). 2~3시간 작업
2. **M3·M4: KO/EN meta description SEO fix** (EN 160자+ 26건 트리밍, KO 짧음 5건 보강). 1~2시간
3. **M5: watermark `#fff` 2건 → CSS 변수** (dark mode 회귀 fix). 10분
4. **L2·L3: .gitignore + robots.txt 정리** (즉시 1~2줄)
5. **외부 작업** (변동 없음): GSC sitemap 재제출 · IndexNow ping (완료) · Naver SA · AdSense 승인 모니터링
