# Plan Integration — 한·영 양방향 관리 그라운드 룰

> **본 문서 = 매 세션 시작 시 plan.md·plan_en.md와 함께 무조건 읽는 그라운드 룰**.
> taystudios.com은 한 코드베이스의 두 시장 (`/` = 한국, `/en/` = 영어).
> 신규 도구·기능 추가, 기존 수정, UI 변경 — 모든 작업은 본 룰을 통과해야 한다.

**작성**: 2026-05-10 (영어판 28선 일괄 launch 직후, 양방향 운영 진입)
**최종 갱신**: 2026-05-10 (초안)
**관련**: [`plan.md`](./plan.md) (한국판 본체) / [`plan_en.md`](./plan_en.md) (영어판 운영)

---

## 0. 핵심 원칙 (Three Laws)

### 0.1 양쪽 다 본다 (default = bilateral)
어떤 작업이든 **시작 단계에서 한·영 양쪽을 동시에 본다**. "일단 한국부터 하고 영어는 나중에"는 mismatch·누락의 출발점.

### 0.2 분류부터 결정한다
모든 신규 도구·기능은 작업 착수 **전에** 다음 셋 중 하나로 분류:
- **공통 (universal)** — 양쪽 다 반영
- **한국 전용** — 한국만, 영어 hub·footer에서 미노출
- **영어 전용** — 영어만 (현재 사례 없음, 미래 후보)

분류를 보류하면 작업이 한쪽으로 흘러간다. 먼저 결정한다.

### 0.3 합의(consensus)는 양쪽에서 같다
같은 도구라면 한·영 둘 다:
- 같은 공식·같은 결과
- 같은 source link·같은 disclaimer
- 같은 UX 흐름·같은 카드 구조
- 같은 SEO meta 골격 (canonical·hreflang·OG)

언어·문화 적응(GDPR·COPPA 명시 등)은 허용되지만, **본질이 달라지면 더 이상 같은 도구가 아니다**.

---

## 1. 분류 결정 트리

```
[새 도구 후보]
   │
   ├─ Q1. 한국 법령·세율·문화·언어에 본질 종속?
   │       (예: 한국 세법, 만 나이, 한국 부동산, 근로기준법)
   │       Yes → 한국 전용 (영어판 미노출)
   │       No  → ↓
   │
   ├─ Q2. 영어권에서 동일 공식·동일 결과?
   │       (예: BMI, 복리, 이미지 압축, PDF 병합)
   │       Yes → 공통 (양쪽 다 반영)
   │       No  → ↓
   │
   └─ Q3. 영어권 전용 법령·문화·언어 종속?
           (예: 미국 federal tax, GBP currency 전용)
           Yes → 영어 전용
           No  → 재검토 (Q1·Q2로 돌아간다)
```

**판정 기준의 sanity check**: "이 도구를 영어로 1:1 번역하면 결과가 정확한가?"
- 정확 = 공통
- 부정확·오해 유발 = 한국 전용

---

## 2. 카테고리 현황 (2026-05-10 기준)

### 2.1 공통 (universal) — 양쪽 다 운영
| 카테고리 | 한국 | 영어 | 비고 |
|---|---|---|---|
| 이미지 | 9선 | 9선 | compress·resize·HEIC→JPG·crop·증명사진·QR gen/scan·OCR·배경제거 |
| PDF | 5선 | 5선 | merge·split·edit·image↔PDF |
| 동영상 | 5선 | 5선 | compress·trim·rotate·GIF·MP3 |
| 텍스트 | 1선 | 1선 | character counter (한국 source 3선 중 1선만) |
| 계산기 universal | 8선 | 8선 | 복리·BMI·칼로리/TDEE·체지방·표준체중·예금·대출·D-Day |
| **합계** | **28선** | **28선** | |

### 2.2 한국 전용 — 한국만 운영
- 세금: 종합소득세·연말정산·부가세·취득세·양도세·상속·증여 등 (한국 세법 종속)
- 부동산: 아파트·전월세·중개수수료 등 (한국 부동산법 종속)
- 노동: 최저시급·퇴직금·실업급여 등 (한국 근로기준법 종속)
- 임신·육아: 만 나이·임신 주수 등 (한국식 나이 셈)
- 자동차: 자동차세 등 (한국 자동차세법 종속)
- 텍스트: 키보드 한영 변환 등 (한국어 IME 종속)

→ 한국 hub·footer에만 노출, 영어판 hub에서 link 미노출. 영어 사용자 진입 시 root 한국 hub에서 "한국 전용 — Korean only" 표시.

### 2.3 영어 전용 — 현재 사례 없음
미래 후보: GDPR·CCPA 관련 도구, 영어권 통화 변환 등. 진입 시 본 §2.3 갱신.

---

## 3. 신규 도구 추가 시 — 체크리스트

### 3.1 분류 = 공통 (universal)

**코드**
- [ ] 한국: `/<category>/<tool>/index.html` (한국어, 한국 source link)
- [ ] 영어: `/en/<category>/<tool>/index.html` (영어, 영어권 source link)
- [ ] vendor 라이브러리는 한 번만 (`/<category>/vendor/`) — 공유

**SEO**
- [ ] canonical 양쪽 (각 페이지별 절대 URL)
- [ ] hreflang 양방향 (en ↔ ko, x-default = ko)
- [ ] og-image: 한국 = `/og-image.png`, 영어 = `/og-image-en.png`
- [ ] sitemap.xml에 양쪽 URL 추가
- [ ] common/site-chrome.js `TRANSLATED_PATHS` 화이트리스트 추가

**hub 반영**
- [ ] 한국 카테고리 hub (`/tools/`·`/text/`·`/image/`·`/pdf/`·`/video/`)에 카드
- [ ] 영어 카테고리 hub (`/en/tools/`·`/en/text/` 등)에 카드
- [ ] 한국 home (`/`) 카운트·요약·quick-list 갱신
- [ ] 영어 home (`/en/`) 카운트·요약·quick-list 갱신

**plan 기록**
- [ ] plan.md에 추가 (해당 phase)
- [ ] plan_en.md에 추가 (영어 phase)

### 3.2 분류 = 한국 전용

**코드**
- [ ] 한국: `/<category>/<tool>/index.html`
- [ ] 영어판 동일 path 만들지 않음

**SEO**
- [ ] canonical 한국만
- [ ] hreflang 명시 안 함 (또는 ko·x-default만)
- [ ] sitemap.xml에 한국 URL만
- [ ] common/site-chrome.js `TRANSLATED_PATHS`에 추가하지 않음 — 영어판에서 lang-toggle 클릭 시 root home(`/`)으로 fallback

**hub 반영**
- [ ] 한국 hub·home만 갱신
- [ ] 영어 hub에 link 추가하지 않음 (이게 누락이 아니라 design)

**plan 기록**
- [ ] plan.md에 추가
- [ ] plan_en.md에는 "한국 전용 신규 — 영어판 미반영" 형태로 한 줄만 (양방향 추적 위함)

### 3.3 분류 = 영어 전용
대칭. 한국 hub에 link 추가하지 않음. plan.md에는 "영어 전용 신규" 한 줄만.

---

## 4. 기존 도구·기능 수정 시

### 4.1 공통 코드 (`common/css/style.css`·`common/site-chrome.js`)
한 번 수정 = 양쪽 자동 반영. 추가 작업 없음.
**단**, i18n 라벨 추가·변경 시 한·영 두 라벨 다 갱신 (`site-chrome.js`의 한국·영어 i18n 객체 둘 다).

### 4.2 도구별 페이지 — universal 도구
**한·영 둘 다 수정 필수**. 한쪽만 commit하면 lang switch 시 사용자 혼란.
- 공식 변경 → 둘 다
- UI 변경 → 둘 다
- 문구 변경 → 둘 다 (번역 포함)
- source link 변경 → 둘 다
- disclaimer 변경 → 둘 다 (영어판은 GDPR·CCPA·COPPA 적응 허용)

### 4.3 도구별 페이지 — 한국 전용
한국만 수정. 영어판에 해당 도구 없으니 동기화 작업 없음.

### 4.4 정책 페이지 (privacy·terms)
- 한국 = `/privacy/`·`/terms/`
- 영어 = `/en/privacy/`·`/en/terms/`
- 본질 (수집 X·browser 처리·affiliate) 동일하되 영어판은 GDPR·CCPA·COPPA·governing law 등 영어권 컴플라이언스 추가 가능
- 시행일 한·영 독립 (한국 시행일 ≠ 영어 launch 시행일)

### 4.5 SEO 자산 (sitemap·manifest·og-image)
- sitemap.xml 한 파일에 한·영 URL 모두 등록
- manifest는 분리 (`/manifest.webmanifest` = 한국, `/en/manifest.webmanifest` = 영어, scope 격리)
- og-image 분리 (`/og-image.png` 한국, `/og-image-en.png` 영어)

---

## 5. 양방향 일관성 검수 명령

세션 끝 또는 큰 작업 후 점검:

```bash
# 한·영 universal 도구 카운트 일치 확인
ls -d tools/*/  text/*/  image/*/  pdf/*/  video/*/ 2>/dev/null | wc -l
ls -d en/tools/*/ en/text/*/ en/image/*/ en/pdf/*/ en/video/*/ 2>/dev/null | wc -l
# universal 분류만 따로 세서 양수 일치 검증

# hreflang 양방향 — 한국 source에서 영어 alternate 명시 / 영어 source에서 한국 alternate 명시
grep -l 'hreflang="en"' tools/*/index.html text/*/index.html image/*/index.html pdf/*/index.html video/*/index.html | wc -l
grep -l 'hreflang="ko"' en/tools/*/index.html en/text/*/index.html en/image/*/index.html en/pdf/*/index.html en/video/*/index.html | wc -l
# 두 숫자 일치해야 함

# sitemap 한·영 URL 모두 등록 확인
grep -c "<loc>https://taystudios.com/[^e]" sitemap.xml   # 한국 (en/ 제외)
grep -c "<loc>https://taystudios.com/en/" sitemap.xml     # 영어

# privacy·terms 양쪽 존재 확인
ls privacy/index.html terms/index.html en/privacy/index.html en/terms/index.html

# manifest 양쪽 존재
ls manifest.webmanifest en/manifest.webmanifest
```

---

## 6. 금기 / Anti-pattern

❌ **한쪽만 commit·push** — production에서 link 깨짐 또는 lang mismatch
❌ **universal 도구를 한국에만 추가하고 잊기** — Phase B 같은 일괄 launch가 다시 필요해짐
❌ **한국 전용 도구를 영어판에 자동 번역으로 launch** — 잘못된 세율·법령으로 신뢰 손상, AdSense·SEO 페널티 위험
❌ **AI 번역 그대로 production** — 수치·법령 부분 직접 검수 필수 ([feedback_source_accuracy.md](../../memory/feedback_source_accuracy.md) 참고)
❌ **"나중에 영어판도 추가하자" 선언만** — plan_en.md에 명시적 backlog 등록 없으면 누락 확정
❌ **plan.md만 갱신하고 plan_en.md 안 건드리기** — 영어 작업이 한국 plan에 묻혀서 추적 불가
❌ **카운트·요약 불일치** — "한국 60선" 인데 home에 "59선" 같은 stale 표기 (plan.md·home·hub·footer 모두 sync)

---

## 7. Q&A — 빠른 결정

| 상황 | 답 |
|---|---|
| "이 도구 한국에만 만들면 돼?" | §1 결정 트리 통과. 본질이 한국 종속이면 한국 전용 OK |
| "영어판은 어떻게 할까?" | universal 분류면 무조건 양쪽. 한국 전용이면 안 만든다 |
| "공통 코드 수정인데 양쪽 다 봐야 해?" | `common/*` 수정은 한 번에 양쪽 반영. 도구별 코드는 양쪽 다 수정 |
| "한쪽만 launch하고 영어는 나중에?" | 가능. 단 plan_en.md에 명시적 backlog 등록 필수 |
| "영어판 도구 번역 검수 안 했는데 launch?" | 금지. AI 초안 → 사용자 검수 → launch 순서 ([feedback_source_accuracy.md](../../memory/feedback_source_accuracy.md)) |
| "한국 시행일·영어 시행일 같이 가야 해?" | 아니요. 정책 페이지는 각 시장 launch 일자 기준으로 독립 |
| "manifest·og-image도 양쪽 만들어?" | manifest = 분리(scope 격리), og-image = 분리(`/og-image.png` 한국·`/og-image-en.png` 영어) |
| "sitemap도 두 개?" | 한 파일에 한·영 URL 모두 |

---

## 8. 세션 시작 시 — 본 문서 활용 절차

1. plan.md 헤더 (1~10줄) 읽고 한국 현재 상황 파악
2. plan_en.md 헤더 읽고 영어 현재 상황 파악
3. **본 문서 §0 핵심 원칙 + §1 결정 트리 회상 + §9 monetization 룰 회상**
4. 사용자 요청 받으면 **착수 전에 분류 (§1·§9.1) → 체크리스트 (§3 또는 §4) 매핑 → 작업**
5. 작업 끝나고 §5 검수 명령 (선택적)
6. plan.md·plan_en.md 둘 다 갱신 (해당될 때)

---

## 9. Monetization 양방향 룰 (광고·affiliate)

도구·기능 외에도 **광고와 affiliate**도 분류·동기화 대상이다. 잘못된 지역의 affiliate가 잘못된 사용자에게 노출되면 = 무의미한 widget(영어 사용자에게 한국 retail link) + AdSense 정책 위반 위험 + 신뢰 손상.

### 9.1 Monetization 분류

도구 분류와 평행한 3분법:

- **공통 (universal)** — 한·영 양쪽 적용 (예: AdSense 같은 publisher ID, GA4)
- **한국 전용 (KO-only)** — 한국 page에만 (예: 쿠팡 파트너스, 네이버 검색광고)
- **영어 전용 (EN-only)** — 영어 page에만 (예: Amazon Associates·미국 retail affiliate, 미래 후보)

**판정 기준**: 광고·affiliate 자체가 지역 종속인가?
- 동일 ID·동일 script로 양쪽 시장에 의미 있음 → 공통
- 한국 retail·한국 검색엔진 종속 → 한국 전용
- 영어권 retail·영어권 검색엔진 종속 → 영어 전용

### 9.2 AdSense — 공통 (universal)

- **publisher ID** = `ca-pub-3553250610781349` (한 ID로 한·영 양쪽)
- **script 위치** = 한국·영어 모든 HTML `<head>`에 박힘 (`pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`)
- **meta 태그** = `<meta name="google-adsense-account" content="ca-pub-3553250610781349">` 양쪽 head
- **승인 상태 (2026-05-10)** = 한국 신청 검토 대기 중 (2026-05-09 신청). 승인 후 영어 자동 적용 (같은 publisher ID·같은 도메인 root)
- **양방향 룰**: 새 페이지 추가 시 `<head>`에 AdSense script + meta 양쪽 다 박혀 있는지 체크. 한 publisher ID 단일 source of truth — 변경 시 전체 sed
- **광고 단가 차이 인지**: 한국 RPM ~$1~2, 영어 RPM ~$3~8 (3배). 영어 트래픽 ROI 우위 — 영어판 광고 차단·삭제는 큰 손실

### 9.3 쿠팡 파트너스 — 한국 전용 (KO-only)

- **회원 ID** = `AF4086854`
- **운영 형태** = 한국 main page (`/`) hero 4 카드 + 카테고리별 추천 위젯 (현재 AdSense 승인 대기로 CSS hide 중, 승인 후 unhide)
- **노출 범위** = **한국 page에만**. `/en/*` 페이지에 절대 박지 말 것
- **이유**: 쿠팡 = 한국 retail 한정. 영어 사용자가 쿠팡 link 클릭해도 한국 배송 + 한국어 결제 → 컨버전 0 + 사용자 혼란
- **양방향 룰**:
  - ✅ 쿠팡 위젯·추천링크는 한국 source HTML에만 (`/index.html`·`/tools/*/index.html` 등)
  - ❌ `/en/*` 어떤 page에도 쿠팡 markup 박지 말 것
  - ✅ 신규 한국 도구 추가 시 affiliate 친화 카테고리(가전·디지털·생활)면 쿠팡 추천 카드 후보. 영어판에는 동일 위치에 빈 자리 또는 다른 콘텐츠
- **AdSense 승인 후 unhide 트리거**: `common/css/style.css`의 affiliate-hide block 한 곳 삭제 = 한국 page 전체 unhide. 영어판 영향 없음 (애초에 markup 없으니까)

### 9.4 영어 affiliate — 미래 후보 (EN-only)

현재 사례 없음. Phase B 후 진입 후보:

- **Amazon Associates** — 가장 일반·가장 큰 영어권 affiliate. 도구 카테고리에 따라 (모니터·이미지 편집 도구·동영상 도구 등) 컨텍스트 매칭 가능
- **B&H·Best Buy·기타 영어권 retail** — 도구별 fit 따라
- **GDPR·CCPA 컴플라이언스** — 영어판 affiliate 도입 시 cookie banner·동의 UI 추가 필요 (한국·쿠팡과 다른 컴플라이언스 영역)

**진입 트리거**:
- 영어 트래픽 100+ /일 안정
- 영어 AdSense RPM 데이터 1~2개월 누적
- Amazon Associates 가입·승인

**진입 시 양방향 룰**:
- ✅ Amazon affiliate widget·link은 `/en/*` page에만
- ❌ 한국 page에 박지 말 것 (영어권 retail이라 한국 사용자에게 무의미)
- 변경 = `plan_en.md` §7.5 갱신 + `plan_integration.md` §9.4 갱신 (사례 → 운영)

### 9.5 GA4·Search Console 등 측정 도구 — 공통 (universal)

- **GA4** — 한 measurement ID로 한·영 양쪽 (도메인 단위 추적, lang param으로 분리 분석)
- **Google Search Console** — `taystudios.com` URL prefix property 1개로 한·영 양쪽 커버 (international targeting 설정만 영어판 출시 후 별도)
- **Naver Search Advisor** — 한국 SEO 한정. 영어판 sitemap 등록 무의미
- **Bing Webmaster Tools** — 양쪽 (Bing은 영어 검색 점유율 큼)
- **IndexNow ping** — 양쪽 URL 모두 push (현재 67 URL → 본 작업 후 71 URL: 한국 +0, 영어 +2 = `/en/privacy/`·`/en/terms/`)

### 9.6 신규 monetization 채널 추가 시 — 결정 절차

```
[새 광고·affiliate 채널 후보]
   │
   ├─ Q1. 지역·언어 종속?
   │       종속 X (Google·Microsoft 등 글로벌) → 공통, 양쪽 적용
   │       한국 종속 (쿠팡·네이버·카카오 등) → 한국 전용
   │       영어권 종속 (Amazon·Microsoft Bing Ads 등) → 영어 전용
   │
   ├─ Q2. 동일 사이트에 두 채널 충돌?
   │       (예: AdSense + 다른 광고 네트워크 동시 = AdSense 정책 위반 위험)
   │       Yes → 한쪽 포기 또는 분리 운영
   │
   └─ Q3. 컴플라이언스 (GDPR·CCPA·KISA 등)?
           해당 시장 컴플라이언스 위반 X 인지 사전 검토
```

### 9.7 monetization 금기 / Anti-pattern

❌ **쿠팡 위젯을 영어 page에 박기** — 영어 사용자 무의미 + 신뢰 손상
❌ **Amazon Associates를 한국 page에 박기** (미래 후보 진입 시 주의) — 한국 사용자 무의미
❌ **AdSense publisher ID를 한·영 다른 ID로 분리** — 운영 복잡 + 권위 분산. 같은 도메인이니 단일 ID
❌ **GDPR·CCPA 동의 UI 없이 영어판 cookie 추적 affiliate 도입** — 법적 위험
❌ **AdSense 승인 전에 한국 affiliate 노출** — AdSense 리뷰어가 affiliate 비중 오인할 위험. 승인 전까지 CSS hide 유지 (현재 운영 룰)
❌ **monetization 변경을 plan에 안 적기** — 광고·affiliate는 수익 직결, 변경 추적 필수. plan.md(§7.5 통상)·plan_en.md(§7.5 통상)·본 §9 셋 다 sync

---

**핵심 메시지 (한 줄): 한·영 사이트는 한 코드베이스의 두 시장 — 시작 단계에서 분류, 작업 단계에서 양쪽 동시, 끝 단계에서 양쪽 plan 반영. 도구·UI뿐 아니라 광고·affiliate도 같은 분류 룰 (공통 / KO-only / EN-only).**
