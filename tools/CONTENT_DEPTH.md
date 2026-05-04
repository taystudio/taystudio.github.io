# 콘텐츠 깊이 보강 + 사이트 면책 정리 (2026-05-04)

> **기록 정리 시점**: 2026-05-04 18:01 KST (이 문서를 마지막으로 정리한 시각 — 개별 작업 시각은 미기록)
>
> 작업 의도: 외부 평가에서 지적된 "33개를 한 번에 만든 느낌 / 검증된 도구처럼 보이려면 깊이 필요"를 해소하고, 사이트 단위 면책 인프라를 정비.
>
> 결과: **33개 계산기 100% 콘텐츠 보강 + footer 단순화 + header 면책 banner + 이용약관 갱신 + 개인정보 정리.**

---

## 1. 외부 평가 (요지)

> 모든 페이지에 다음 6항목이 있어야 검색 결과 만족도가 올라간다:
>
> 1. 최종 업데이트 날짜
> 2. 기준 법령·공식·출처
> 3. 계산식 설명
> 4. 예시 2~3개 (시뮬레이션 표)
> 5. FAQ 5개 이상
> 6. 관련 계산기 내부링크
>
> 핵심 페이지는 추가로 — 요율 요약, 시뮬레이션 표, 비과세·부양가족 등 케이스별 차이, 자주 틀리는 케이스.

---

## 1.5 왜 이 작업이 효과적인가 (3개 영역 동시 충족)

GPT 평가는 표면상 "검색 만족도"를 말했지만, 같은 6항목이 **3개 영역의 모범 사례 묶음**과 일치 — 하나 잘하면 셋 다 좋아짐.

| 영역 | 요구 (느슨한 형태) | 6항목과 매핑 |
|---|---|---|
| **AdSense 정책** | "유익한 고품질 콘텐츠" — thin content(빈약 페이지) 거부 | 예시 표·FAQ로 페이지가 빈약해 보이지 않게 |
| **Google SEO (E-E-A-T)** | Experience·Expertise·Authority·Trust 신호 | 출처·계산식·업데이트 날짜 = Trust / 예시·FAQ = Expertise / 관련링크 = Authority |
| **사용자 만족도** | 검색해서 들어왔을 때 답이 다 있어야 | 모든 항목 |

인과 흐름:

```
6항목 적용
  ↓
페이지 콘텐츠 풍부 + 신뢰 신호 강화
  ↓ ↓ ↓
①Google SEO 랭킹 ↑      ②사용자 체류·만족도 ↑       ③AdSense 심사 친화
  ↓                       ↓                          ↓
검색 노출 ↑              CTR·재방문 ↑               승인 가능성 ↑ + 광고 수익 ↑
```

**주의**: AdSense·Google이 "예시 N개, FAQ N개"를 명시 규정으로 두진 않음. 6항목은 **정책의 정신(고품질·신뢰성)을 만족시키는 구체적 패턴**이고, 동시에 SEO 모범사례. 즉 정책 문구 매칭이 아니라 **결과적으로 같은 방향**.

---

## 2. 적용 패턴 (모든 도구 페이지 공통)

```
[기존: form / result / breakdown / disclaimer]

<section class="tool-article">          ← 펼침 1: 핵심 요약 표 (요율·법정·공식)
<section class="tool-article">          ← 펼침 2: 검색 의도 핵심 표 (시뮬레이션)

<section class="disclosure-group">      ← 접힘: 4~6 details (깊이 있는 보조)
  <details><summary>...</summary></details>
  ...

<section class="tool-article">          ← 관련 계산기 6개 카드 (네비)
<section class="faq">                   ← FAQ 6개+ (이미 details, 그대로 접힘)
<section class="sources">               ← 출처 (그대로)
```

JSON-LD `@graph`에 `FAQPage` 동기화 (DOM `<details>` 수와 일치).

CSS 신규 클래스 6종 (`tools/css/style.css`):

| 클래스 | 역할 |
|---|---|
| `.tool-article` | 펼친 섹션 컨테이너 (h2 + 표/단락) |
| `.ref-table` | 가로 스크롤 가능한 시뮬레이션 표 (모바일 대응) |
| `.formula-list` | 산식 단계 ol (배경 + code 강조) |
| `.case-grid` | 케이스 박스 그리드 (자동 1~3열) |
| `.related-calc` | 관련 계산기 6개 카드 (hover 강조) |
| `.disclosure-group` | 접힘 details 묶음 (FAQ 스타일 셀렉터 공유) |

수치 정확성: 각 페이지 JS 로직을 `node`로 시뮬레이션해 표 수치 산출 → 코드와 100% 일치 보장.

---

## 3. 33/33 완료 (100%) ✅

### 깊이 보강 (24개) — 표 + disclosure 그룹 + FAQ 6~7 + 관련 계산기

| # | 페이지 | 카테고리 | FAQ | lines |
|---|---|---|---|---|
| 1 | salary | 세금 | 7 | 437 |
| 2 | severance | 근로 | 6 | 401 |
| 3 | year-end | 세금 | 6 | 396 |
| 4 | capgain | 세금 | 6 | 416 |
| 5 | inheritance | 세금 | 6 | 405 |
| 6 | gifttax | 세금 | 6 | 422 |
| 7 | acqtax | 부동산 | 6 | 410 |
| 8 | brokerage | 부동산 | 6 | 399 |
| 9 | property-tax | 부동산 | 6 | 380 |
| 10 | comp-property | 부동산 | 6 | 409 |
| 11 | rent-convert | 부동산 | 6 | 421 |
| 12 | loan | 금융 | 6 | 406 |
| 13 | compound | 금융 | 6 | 411 |
| 14 | savings | 금융 | 6 | 394 |
| 15 | hourly | 근로 | 6 | 402 |
| 16 | weekly-pay | 근로 | 6 | 375 |
| 17 | annual-leave | 근로 | 6 | 391 |
| 18 | parental-leave | 근로 | 6 | 395 |
| 19 | unemployment | 근로 | 6 | 395 |
| 20 | comprehensive | 세금 | 6 | 412 |
| 21 | vat | 세금 | 6 | 395 |
| 22 | cartax | 자동차 | 6 | 405 |
| 23 | cartax-yearly | 자동차 | 6 | 400 |
| 24 | insurance | 금융 | 6 | 408 |

### 라이트 보강 (9개) — 핵심 표 + FAQ 5 + 관련 계산기

도메인 깊이가 적은 페이지(건강·임신·육아·생활)는 시뮬레이션 표가 큰 의미 없어 핵심 표 1개 + FAQ 5 + 관련 계산기로 단순 보강.

| # | 페이지 | 카테고리 | FAQ | lines |
|---|---|---|---|---|
| 25 | bmi | 건강 | 5 | 279 |
| 26 | calorie | 건강 | 5 | 293 |
| 27 | age | 생활 | 5 | 253 |
| 28 | dday | 생활 | 5 | 245 |
| 29 | growth | 임신·육아 | 5 | 278 |
| 30 | pregnancy | 임신·육아 | 5 | 269 |
| 31 | ovulation | 임신·육아 | 5 | 255 |
| 32 | baby-clothes | 임신·육아 | 5 | 267 |
| 33 | baby-formula | 임신·육아 | 5 | 266 |

---

## 4. 사이트 단위 면책 인프라 (header banner)

콘텐츠 보강과 같이 처리한 사이트 차원의 면책 정리.

### 4.1 면책 banner (`common/site-chrome.js`)

위치: `<site-header>` 바로 아래 (A안)

```
[로고 TAYSTUDIO]                                          [Tools]
══════════════════════════════════════════════════════════════════
⚠️ 본 사이트의 모든 계산은 참고용 추정치입니다.
   정확한 결과는 공식 기관·전문가 상담을 권장합니다 · 자세히 →   [×]
══════════════════════════════════════════════════════════════════
```

표시 조건:
- `window.location.pathname.includes('/tools/')` 인 경우만 표시 — file:// 환경 포함
- 루트(`/`), `/history/` 비표시

X 버튼 동작 (의도된 비영구):
- 클릭 → 그 화면에서만 `display:none`
- 새로고침·페이지 이동 시 다시 표시
- localStorage 저장 X (한 번 읽고 잊는 게 아니라 매번 인지하는 게 안전)
- 처음에는 localStorage 영구 dismiss로 구현했으나 사용자 요청으로 비영구로 변경

### 4.2 footer 단순화 — 5/4 fallback 결정 번복

5/4에 AdSense 봇 대응으로 38개 페이지에 인라인 fallback `<footer>`를 박았으나, 같은 날 사용자 요청으로 다시 제거 — `<site-footer></site-footer>` 한 줄로 단순화.

- 변경량: 38 files, 38(+) / 380(−)
- AdSense 위험 보완: header 면책 banner의 `/tools/terms/` 링크가 동일 역할 부분 수행

### 4.3 이용약관·개인정보 정리

- `tools/terms/` "30가지 실용 계산기" → "33가지" 갱신
- `tools/terms/` "9. 연락처" → "9. 운영 안내" (이메일 제거, "본 사이트는 개인이 운영하는 무료 서비스" 일반 문구)
- `tools/privacy/` "8. 연락처" → "8. 운영 안내" (동일 처리)
- `tools/HANDOFF.md`, `adsense/APPROVAL.md`의 이메일 라인 제거
- repo 전체 grep — `@gmail` · `thlee991` 잔재 0건 확인

### 4.4 SW 캐시 버전

`tools/sw.js` `CACHE_VERSION = 'tayleetools-v5'` → `'tayleetools-v6'`. 배포 후 기존 방문자에게 갱신된 site-chrome.js 자동 전파.

---

## 5. 검증

- 33개 도구 페이지 HTML 태그 밸런스 OK (mismatch 없음)
- JSON-LD `FAQPage.mainEntity`가 DOM `<details>` 수와 일치 (모든 페이지)
- 수치는 JS 로직 시뮬레이션 결과와 100% 일치 (node로 사전 산출)
- 모바일 가로 스크롤 대응 (`.ref-table { overflow-x: auto }`)
- 다크모드 자동 (CSS 변수 활용)
- `common/site-chrome.js` 문법 OK (Function 생성자 파스 검증)

---

## 6. 후속 작업 (필요 시)

1. **AdSense 봇 추가 대응**: footer fallback 제거 후 privacy/terms 링크 노출이 site-chrome.js JS 의존. AdSense 거절 시 `<site-header>` 안에 noscript fallback 추가 검토.
2. **면책 banner 톤 조정**: 노란색 배경이 거슬리면 옅은 회색·blue 등으로 변경. `common/site-chrome.js` 한 줄.
3. **GitHub Issues 채널**: 운영자 이메일 제거 후 사용자 피드백 채널 부재. 필요 시 GitHub Issues 링크 추가.
