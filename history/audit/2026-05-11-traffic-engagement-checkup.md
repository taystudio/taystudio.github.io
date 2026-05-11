# 트래픽·체류시간 중간 점검 — 2026-05-11

**데이터 소스**: GA4 보고서 개요 (2026-04-13 ~ 2026-05-10, 28일) + Cloudflare Web Analytics (2026-05-10 20:16 ~ 2026-05-11 20:16, 24h)
**시점 컨텍스트**: 도메인 migration 2026-05-09 완료 직후. 신규 functional 5개 도구 2026-05-10 일괄 release 직후.

---

## 데이터 요약

| 지표 | 값 | 평가 |
|---|---|---|
| 28일 활성 사용자 | **46명** | 봇 추정 11명 제외 시 실제 ≈35명 |
| 28일 새 사용자 | 47명 | new ≈ active = 재방문 매우 적음 (신규 도메인 자연) |
| 평균 참여시간 | **4분 33초** | 정적 도구 사이트치곤 **압도적** |
| 이벤트 수 | 4.9천 | dwell 길어서 이벤트 풍부 |
| LCP P50 / P75 / P90 / P99 | 280ms / 340ms / 468ms / 1,380ms | Good 99% — 기술 성능 만질 게 없음 |
| INP | 100% Good | 완벽 |
| CLS | 100% Good | 완벽 |

### 인기 페이지 TOP 7 (28일)

| 페이지 | 조회수 | 활성 사용자 | 이벤트 | 이탈률 |
|---|---|---|---|---|
| 홈 KO (TAYSTUDIO 자주 쓰는…) | 342 | 32 | 705 | 31.7% |
| 홈 EN (Free privacy-first…) | 155 | 6 | 269 | 13.0% |
| 실생활 계산기 33선 | 153 | 5 | 243 | 4.5% |
| 동영상 도구 hub | 145 | 7 | 264 | 9.5% |
| 텍스트 도구 hub | 138 | 11 | 224 | 7.5% |
| (홈/이미지 hub 추정) | 131 | 6 | 210 | 12.5% |
| (PDF 등 hub) | 127 | 8 | 265 | 20.0% |

→ **TOP 7 전부 hub. 개별 도구 페이지 0개**.

### 세션 소스/매체

| 소스/매체 | 세션 수 | 비중 |
|---|---|---|
| direct / none | 124 | 80% |
| naver / organic | 12 | 8% |
| github.com / referral | 11 | 7% |
| google / organic | 6 | 4% |
| m.search.naver.com / referral | 6 | 4% |
| chatgpt.com / (not set) | 1 | <1% |

### 도시 (활성 사용자)

| 도시 | 사용자 | 비고 |
|---|---|---|
| Seoul | 20 | 진짜 한국 사용자 메인 |
| Boardman | 8 | **봇 추정** (미국 오레곤, AWS region) |
| Bucheon-si | 4 | 한국 |
| Council Bluffs | 3 | **봇 추정** (Google data center) |
| Gimpo-si / Seongnam-si | 각 2 | 한국 |
| Aspen | 1 | |

→ 봇 추정 11명. 실제 인간 사용자 ≈ 35명.

### Cloudflare URL별 카운트 (24h)

| URL | LCP 카운트 |
|---|---|
| / (홈 KO) | 34 |
| /en/ | 20 |
| /en/pdf/ | ~10 |
| /video/ | ~9 |
| /en/tools/ | ~7 |

---

## 핵심 진단

### 1. Google이 아직 못 봄 (가장 큰 병목)
- google organic 6 vs naver organic 12 = 한국 시장에서 정상이 아님. 보통 google이 더 잡음
- 원인: 도메인 migration 2026-05-09 직후. indexing이 아직 완료 안 됨
- 신규 도메인 권위 0 + 백링크 없음 → crawl budget 낮음

### 2. Naver 트래픽이 진짜 살아 있음 (가장 좋은 신호)
- naver organic 12 + m.search.naver referral 6 = **세션의 12%**
- 한국어 long-tail 키워드는 이미 통하고 있음 (작지만 작동)
- 28일에 18 세션 = 일평균 0.6 세션. 도구 30개 사이트치곤 작지만 momentum 형성 중

### 3. hub만 잡히고 도구 페이지가 안 잡힘
- TOP 7 모두 hub. 사용자는 hub로 들어와 도구로 click-through 하는 **단일 funnel**
- SERP에서 도구 페이지 직접 잡히기 시작하면 트래픽 2~3배 점프 여지 있음
- 도구별 title·description은 이미 long-tail이지만 도메인 권위가 0이라 SERP 우선순위 못 받는 중

### 4. direct 80%의 정체 (CF Top referrers로 검증 필요)
- referrer 없는 트래픽이 124/154 = 80%. GA4 기본의 함정
- 가능성:
  - ChatGPT/Claude/Perplexity 인용 (LLM은 보통 referrer X)
  - Naver 앱 내장 브라우저 (referrer 안 보냄)
  - 카톡 공유 / DM 링크
  - GA4 referrer policy 미스
- **Cloudflare Top referrers + Top sources 스크린샷 1장 더 필요** — 정확한 진실 회수

### 5. ChatGPT referral 1 세션 발견
- 작지만 의미 큼. LLM channel이 살아 시작
- 도메인 권위 build되면 1~2% 비중까지 자연스레 갈 가능성

---

## 잘하고 있는 점 (지킬 것)

- **dwell 4:33** = 콘텐츠·UX 이미 정답. 이걸 깨는 변경은 절대 X
- **Core Web Vitals 완벽** — LCP P75 340ms, INP 100% Good, CLS 100% Good
- **5/3 이후 상승 추세** — momentum 형성 중
- **KO + EN 양방향 유효** — 영어 홈이 TOP 2. /en/ 트래픽이 KO의 60% 수준이라 잠재력 큼

---

## 즉시 액션 (이번 주 가능)

| # | 액션 | 비용 | 효과 |
|---|---|---|---|
| 1 | **GSC URL inspection → 핵심 도구 10개 manual index request** (image/format-convert·watermark·merge·mosaic·compress, pdf/pdf-stamp·pdf-merge, 동영상 hub, /en/ 5개) | 30분 | google organic 2~3주 내 5~10배 |
| 2 | **GitHub README에 taystudios.com 링크 1개** + 본인 티스토리에서 신규 도메인 1회 언급 | 10분 | 백링크 권위 build, LLM crawler 인용 가능성 ↑ |
| 3 | **도구별 페이지 title에 한국어 long-tail 1개씩 보강** (예: "WebP·AVIF 변환 — 카톡 webp 안 열림 해결") | 1~2시간 | Naver·Google 도구 직접 잡히기 시작 |

---

## 중기 액션 (2~4주)

- **CF custom event로 hub 도구 카드 click-through 측정** — hub → 도구 conversion 데이터 회수
- **/en/ 영문 long-tail 강화** — "webp to jpg converter" 같은 evergreen 키워드
- **2주 뒤 트래픽 재확인** (2026-05-25 전후) — 5/10 일괄 build 효과 + indexing 진행도 측정

---

## 명시 보류 (메모리 룰 정합)

| 항목 | 보류 사유 |
|---|---|
| AdSense 승인 전 use-case 가이드 페이지 양산 | thin content 위험. dwell은 이미 4:33이라 트래픽만 늘면 수익 따라옴 |
| 통상임금·MP3 자르기 등 신규 도구 추가 | 현재 60개 도구 indexing 정상화 후 |
| About 페이지 + 푸터 연락처 | 신뢰 작업 2순위. 우선순위는 트래픽 회복이 먼저 |

---

## 추가 데이터 필요

- **Cloudflare Top referrers (24h or 7d)** — direct 80% 정체 규명
- **Cloudflare Top countries** — 봇 비율 정확도
- **GA4 Engagement → Pages and screens (7d, 도구 페이지 단위)** — hub 외 도구 페이지 트래픽 분포

---

## 다음 재점검 트리거

- 2026-05-25 전후 (2주 후) — 5/10 release 효과 회수 + google indexing 진행도
- AdSense 승인 결과 도착 시
- google organic 세션 ≥ naver organic 되는 시점 (indexing 정상화 신호)
- 일평균 활성 사용자 5명 돌파 시 (현재 1~2명)
