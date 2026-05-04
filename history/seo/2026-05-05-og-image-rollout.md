# 2026-05-05 — og:image 사이트 전체 + JSON-LD 보강

## 배경

audit 결과 누락 발견: **52개 HTML 전부 og:image / twitter:image 누락**.
- 카톡·X·페이스북·LinkedIn·Slack·디스코드 공유 시 빈 미리보기
- 한국 시장 입소문 유입 1순위(카톡)에서 클릭률 직접 손실
- 디자인 자산도 1200×630 사이즈 없음 (favicon 286B, apple-touch-icon 2.9KB만 존재)

## 적용 범위 — Tier 1·2 항목

| Tier | 항목 | 결과 |
|---|---|---|
| 1.1 | og:image SVG/PNG 자체 제작 | ✅ 1200×630, og-image.svg 3.6KB / og-image.png 511KB |
| 1.1 | og:image 사이트 전체 51 파일 적용 | ✅ |
| 2.1 | image 9 도구 JSON-LD에 featureList + dateModified + softwareVersion | ✅ |
| 2.3 | Organization JSON-LD (root) | ✅ |
| 1.2 | 카테고리 hub 콘텐츠 깊이 | ⏭ 후속 (~2h 작업, 별도 세션) |
| 2.2 | HowTo JSON-LD 4 도구 | ⏭ 후속 |

## 1. og:image 자산 제작

### og-image.svg (1200×630, 3.6KB)
TAYSTUDIO 브랜드 + "쓸모 있는 것들." + 카테고리 3개 칩(계산기 33 / 텍스트 3 / 이미지 9).
다크 그라데이션 배경, 라디얼 글로우, 도트 패턴.

### og-image.png (1200×630, 511KB)
**Chrome headless로 렌더링** — qlmanage는 정사각형 thumbnail로 출력해서 부적합. 명령:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --window-size=1200,630 \
  --screenshot=og-image.png \
  "file://$(pwd)/og-image.svg"
```

PNG 채택 이유: 카톡·페이스북·LinkedIn·Naver는 SVG 미리보기 미지원. PNG 단일 자산이 보편 호환.

## 2. og:image 사이트 전체 적용 (51 파일)

`/tmp/apply_og.py` 스크립트로 일괄 처리. 규칙:

- **og:image 4종 추가** (image, image:width, image:height, image:alt) — og:url 다음, 없으면 og:description 다음
- **twitter:card "summary" → "summary_large_image"** — 큰 이미지를 받으니 변경
- **twitter:image 추가** — twitter:description 다음
- 이미 og:image 있는 파일은 idempotent skip

### 결과
- 49 파일 자동 적용 (image 10 + text 4 + tools 33 + root 1 + text/tools hub 포함)
- 2 파일 수동 적용 (tools/privacy/, tools/terms/) — og:* 메타 자체가 없었음, 11개 메타 한꺼번에 추가
- 1 파일 미적용 (tools/404.html) — 404 페이지는 SEO 영향 미미, 후순위

검증:
```
og:image 적용: 51/52
twitter:card="summary_large_image": 51 (기존 summary 0)
```

## 3. Organization JSON-LD (root)

`index.html` `@graph`에 `Organization` 추가:

```json
{
  "@type": "Organization",
  "name": "TAYSTUDIO",
  "alternateName": "테이스튜디오",
  "url": "https://taystudio.github.io/",
  "logo": "https://taystudio.github.io/favicon-192.png",
  "image": "https://taystudio.github.io/og-image.png",
  "description": "...",
  "foundingDate": "2026",
  "areaServed": "KR",
  "knowsLanguage": "ko-KR"
}
```

기존 `@graph`는 `WebSite` + `BreadcrumbList`만 있었음. Organization이 합류 → 브랜드 쿼리("타이스튜디오", "TAYSTUDIO") SERP 강화·Knowledge Panel 후보.

## 4. image 9 도구 JSON-LD WebApplication 보강

각 도구에 3개 필드 추가:

- **featureList** — 도구별 4개 기능 배열 (한국어). 리치 스니펫에 기능 노출 가능.
- **dateModified** — `"2026-05-05"` (ISO 8601 date)
- **softwareVersion** — `"2026.05"`

### 도구별 featureList 요약

| 도구 | 핵심 키워드 |
|---|---|
| compress | JPG/PNG/WebP 화질 슬라이더, EXIF 자동 제거, 카톡·이메일 한도 미리보기 |
| resize | 픽셀 직접 입력, 비율 고정, 일괄 리사이즈, 출력 포맷 선택 |
| qr-gen | URL/Wi-Fi/연락처 QR, PNG·SVG 다운로드, 오류 정정 레벨, 오프라인 |
| qr-scan | 카메라 실시간, 이미지 업로드 인식, 로컬 처리 |
| pdf-merge | 여러 PDF 결합, 드래그 정렬, 외부 업로드 X |
| pdf-split | 페이지 단위·범위 추출, 외부 업로드 X |
| ocr | Tesseract.js 추출, 한·영·숫자, PDF 페이지별 분리 |
| img-to-pdf | 여러 이미지 결합, A4·Letter·원본, JPEG 품질 |
| bg-remove | @imgly AI 배경 제거, 투명 PNG, WebGPU 가속, 외부 전송 X |

`/tmp/apply_features.py` 스크립트로 일괄 적용. JSON 유효성 9/9 통과.

## 변경 파일

```
+ og-image.svg                              (신규)
+ og-image.png                              (신규)
+ history/seo/strategy.md                   (신규)
+ history/seo/2026-05-05-og-image-rollout.md (신규)
~ index.html                                (Organization JSON-LD + og:image)
~ image/{compress,resize,qr-gen,qr-scan,pdf-merge,pdf-split,ocr,img-to-pdf,bg-remove}/index.html
                                            (featureList + og:image)
~ image/index.html                          (og:image)
~ text/{counter,kbd-convert,sns-format}/index.html (og:image)
~ text/index.html                           (og:image)
~ tools/{33 tools}/index.html               (og:image)
~ tools/{index,privacy,terms}/index.html    (og:image)
```

총 56개 파일 변경 (52 HTML 수정 + 4 신규).

## 검증

- og:image 적용 51/52 (404 제외)
- twitter:card 모두 "summary_large_image"
- 9 image 도구 JSON-LD 유효성 OK
- root @graph types: WebSite + BreadcrumbList + Organization
- 시각 확인 — og-image.png 1200×630, 텍스트 가독성 OK

## 후속 작업 (별도 세션)

### Tier 1.2 — 카테고리 hub 콘텐츠 깊이 (예상 ~2h)
- image/index.html, text/index.html, tools/index.html에:
  - `.updated` 최종 갱신일
  - 카테고리 소개 long-form (200~500자) — 검색 의도·사용 시나리오·차별화
  - 카테고리 FAQ 4~5개 (도구 선택 가이드·프라이버시·라이선스)
  - `.sources` 외부 권위 출처 (해당 시)

### Tier 2.2 — HowTo JSON-LD 4 도구 (예상 ~1h)
- pdf-merge: "여러 PDF 합치기" 1.업로드 2.정렬 3.다운로드
- bg-remove: "사진 배경 제거" 1.업로드 2.AI 처리 3.투명 PNG 다운로드
- img-to-pdf: "사진 PDF 변환" 1.이미지 선택 2.정렬 3.A4 변환
- qr-gen: "QR 코드 만들기" 1.URL 입력 2.생성 3.PNG·SVG 다운로드

### Tier 3 — 자산 의존 (후순위)
- 도구별 스크린샷 + screenshot JSON-LD 필드
- 도구별 `<section class="howto">` HTML
- 사용자용 HTML 사이트맵

## 측정 — 1주~1달 후 확인

- **Search Console**: 노출수 변화, og:image 적용 후 CTR 변화
- **카카오톡 미리보기 디버거**: og:image 정상 노출 확인
- **Twitter Card Validator**: summary_large_image 동작 확인
- **AdSense RPM**: SEO 트래픽 품질 지표
