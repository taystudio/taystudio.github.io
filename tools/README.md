# TAYLEE Tools — 실생활 계산기 모음 설명서

한국에서 자주 쓰는 36가지 계산기를 정적 사이트로 묶은 모음 (2026-05-05 건강 5선 확장). AdSense + 쿠팡파트너스 수익화 목적, 출처·법령 근거 명시 정책.

---

## 1. 한눈에 보기

- **36개 계산기** 전부 클라이언트사이드 JavaScript (백엔드 없음)
- **GitHub Pages** 배포 가정 (`https://taystudios.com/tools/`)
- 각 도구는 디렉토리 1개 = `index.html` + `<name>.js` 구조
- **공통 CSS**: `tools/css/style.css` (다크모드·반응형 자동 지원)
- **사이트맵**: `sitemap.xml` (repo root)
- 입력값은 브라우저 안에서만 처리, 서버로 전송 없음

## 2. 디렉토리 구조

```
tools/
├── README.md             ← 이 파일
├── index.html            ← 36개 도구 허브 (카테고리별)
├── css/
│   └── style.css         ← 공통 스타일
│
├── 부동산/
│   ├── brokerage/        ← 중개수수료 계산기
│   ├── acqtax/           ← 부동산 취득세
│   ├── property-tax/     ← 재산세
│   ├── comp-property/    ← 종합부동산세
│   ├── capgain/          ← 양도소득세
│   └── rent-convert/     ← 전월세 전환
│
├── 금융·세금/
│   ├── salary/           ← 연봉 실수령액
│   ├── year-end/         ← 연말정산 환급
│   ├── comprehensive/    ← 종합소득세
│   ├── vat/              ← 부가가치세
│   ├── inheritance/      ← 상속세
│   ├── gifttax/          ← 증여세
│   ├── insurance/        ← 4대보험료
│   ├── loan/             ← 대출 이자
│   ├── savings/          ← 적금 이자
│   └── compound/         ← 복리
│
├── 근로·고용/
│   ├── hourly/           ← 시급↔월급
│   ├── weekly-pay/       ← 주휴수당
│   ├── annual-leave/     ← 연차수당
│   ├── severance/        ← 퇴직금
│   ├── unemployment/     ← 실업급여
│   └── parental-leave/   ← 육아휴직 급여
│
├── 임신·육아/
│   ├── pregnancy/        ← 출산예정일
│   ├── ovulation/        ← 배란일·가임기
│   ├── baby-formula/     ← 분유량
│   ├── baby-clothes/     ← 아기 옷 사이즈
│   └── growth/           ← 성장 백분위
│
├── 자동차/
│   ├── cartax/           ← 자동차 취득세 (구매 시)
│   └── cartax-yearly/    ← 연간 자동차세 (보유 시)
│
├── 건강/
│   ├── bmi/              ← BMI
│   └── calorie/          ← 칼로리·BMR·TDEE
│
└── 생활/
    ├── age/              ← 만 나이
    └── dday/             ← D-day
```

## 3. 도구별 핵심 정보

### 부동산 (CPM 최상위)

| 도구 | 출처 / 갱신 주기 |
|---|---|
| 중개수수료 | 공인중개사법 시행규칙 제20조 별표 (2024.10 개정) |
| 부동산 취득세 | 지방세법 제11조·제13조의2, 농특세법, 제150조·제151조 / 정책 변경 잦음 |
| 재산세 | 지방세법 제111조·제111조의2 / 매년 7·9월 분납 |
| 종합부동산세 | 종부세법 제8조·제9조 / 매년 12월 정기고지 |
| 양도소득세 | 소득세법 제89조·제95조·제103조·제104조 / 정책 변경 잦음 |
| 전월세 전환 | 주택임대차보호법 제7조의2 + 시행령 제9조 / 한국은행 기준금리 변동 시 갱신 |

### 금융·세금

| 도구 | 출처 / 갱신 주기 |
|---|---|
| 연봉 실수령액 | 4대보험법 + 소득세법 제47조·제55조·제59조 / 매년 갱신 |
| 연말정산 | 소득세법 제47조~제59조, 조특법 제126조의2 / 매년 1~2월 |
| 종합소득세 | 소득세법 제55조 / 매년 5월 신고 |
| 부가가치세 | 부가세법 제30조 (10% 고정) |
| 상속세 | 상증법 제18조·제19조·제26조·제69조 / 개정 모니터링 |
| 증여세 | 상증법 제53조·제53조의2·제56조·제57조·제69조 / 개정 모니터링 |
| 4대보험료 | 4대보험법 (각각) / 매년 변경 |
| 대출 이자 | 수학 공식 (PMT) / 변경 없음 |
| 적금 이자 | 소득세법 제129조 (이자세 15.4%) |
| 복리 | 수학 공식 / 변경 없음 |

### 근로·고용

| 도구 | 출처 / 갱신 주기 |
|---|---|
| 시급↔월급 | 209시간 기준 / 최저임금 매년 8월 결정 |
| 주휴수당 | 근로기준법 제55조 |
| 연차수당 | 근로기준법 제60조 |
| 퇴직금 | 근로기준법 제2조, 퇴직급여보장법 제8조 |
| 실업급여 | 고용보험법 제45조·제46조 / 매년 상·하한 변경 |
| 육아휴직 급여 | 고용보험법 제70조 / 2025년 개정 (연 1회 변경 가능) |

### 임신·육아

| 도구 | 출처 / 갱신 주기 |
|---|---|
| 출산예정일 | Naegele's rule (의학 표준 공식) |
| 배란일·가임기 | 의학 표준 공식 (28일 주기) |
| 분유량 | 대한소아청소년과학회 가이드 |
| 옷 사이즈 | 한국 표준 사이즈표 |
| 성장 백분위 | 2017 한국 소아청소년 성장도표 |

### 기타

| 도구 | 출처 / 갱신 주기 |
|---|---|
| 자동차 취득세 | 지방세법 제12조, 조특법 제66조의4 (감면 일몰) |
| 연간 자동차세 | 지방세법 제127조 / 매년 6·12월 분납 |
| BMI | 대한비만학회 2018 기준 |
| 칼로리(BMR/TDEE) | Mifflin-St Jeor 공식 (1990) |
| 만 나이 | 행정기본법 제7조의2 (2023.6.28 시행) |
| D-day | 단순 날짜 계산 |

## 4. 매년 업데이트 체크리스트

세율·요율은 매년 변경됩니다. **수정해야 할 위치는 각 JS 파일 상단 주석에 명시**되어 있어요.

### 매년 1월 (대규모 갱신)

- [ ] `salary/salary.js` — 국민연금율, 건강보험율, 장기요양율
- [ ] `insurance/insurance.js` — 위와 동일
- [ ] `unemployment/unemployment.js` — 실업급여 상·하한 (최저시급 기반)
- [ ] `hourly/hourly.js` — `최저시급` 상수
- [ ] `parental-leave/parental-leave.js` — 육아휴직 급여 상한 (개정 잦음)

### 매년 7월

- [ ] `salary/salary.js` `insurance/insurance.js` — 국민연금 기준소득월액 상한 (매년 7월 1일 변경)

### 매년 11월~12월

- [ ] 다음 연도 건강보험료율 고시 확인 (보건복지부)
- [ ] 다음 연도 최저시급 고시 확인 (8월 결정, 1월 시행)
- [ ] 종부세 정책 변경 모니터링

### 정책 변경 시 (수시)

- [ ] `inheritance/inheritance.js` — 정부 개정안 통과 여부 확인 (자녀공제 5억 등)
- [ ] `capgain/capgain.js` — 조정대상지역, 다주택 중과 유예 등
- [ ] `cartax/cartax.js` — 친환경차 감면 일몰 연장 여부

### 수치 변경 시 검증해야 할 출처

각 JS 파일 헤더에 **공식 출처 URL**이 명시되어 있어요. 변경 시 반드시 직접 확인:

- [국세청 공식](https://www.nts.go.kr/) — 상속세·종소세·양도세
- [국가법령정보센터](https://www.law.go.kr/) — 모든 법조문
- [국민건강보험공단](https://www.nhis.or.kr/) — 건강보험·장기요양
- [국민연금공단](https://www.nps.or.kr/) — 국민연금
- [고용보험](https://www.ei.go.kr/) — 실업급여·육아휴직
- [위택스](https://www.wetax.go.kr/) — 지방세 (재산세·자동차세 등)
- [고용노동부](https://www.moel.go.kr/) — 퇴직금·연차

## 5. 새 도구 추가 방법

기존 도구 1개를 복사해서 변형하는 게 가장 빠릅니다.

### 단계

1. **디렉토리 생성**
   ```bash
   mkdir tools/new-calc
   ```

2. **`index.html` 작성 — 기존 도구를 템플릿으로**
   - `<title>`, `<meta description/keywords>` 변경
   - `<canonical>` URL 수정
   - 폼 입력 필드 변경
   - 결과 표시 영역 변경
   - `<section class="sources">` 출처 작성

3. **`<name>.js` 작성**
   - 파일 상단에 적용 기준일·출처 주석
   - 폼 submit 이벤트 핸들러 + DOM 업데이트

4. **`tools/index.html` 허브에 카드 추가**
   ```html
   <a class="tool-card" href="./new-calc/">
     <div class="icon">🆕</div>
     <div class="name">새 계산기</div>
     <div class="desc">설명</div>
   </a>
   ```

5. **`tools/sitemap.xml` 추가**
   ```xml
   <url><loc>https://taehyuklee.github.io/Archive/tools/new-calc/</loc>...</url>
   ```

6. **README.md 도구 목록에 추가** (선택)

### 새 도구의 표준 구조

```
new-calc/
├── index.html    ← 폼 + 결과 + 출처 섹션
└── new-calc.js   ← 계산 로직
```

`index.html` 표준 섹션 순서:
1. 헤더 + 브레드크럼
2. h1 + subtitle (배지 옆)
3. `<form class="card">` 입력 폼
4. `[ AdSense 광고 자리 ]` placeholder
5. `<div id="result" class="result">` 결과
6. `<div class="disclaimer">` 주의사항
7. (선택) `<section class="faq">` 자주 묻는 질문
8. `<section class="sources">` 적용 법령·고시·출처
9. (선택) `<div class="coupang-banner">` 쿠팡 자리

## 6. 배포 방법

### GitHub Pages (현재)

레포 root에서:

```bash
git add tools/
git commit -m "add: utility tools"
git push
```

1~2분 후 자동 배포:
- `https://taehyuklee.github.io/Archive/tools/`
- `https://taehyuklee.github.io/Archive/tools/<도구명>/`

### Cloudflare Pages (이전 시)

private 레포 + 광고 수익화 가능 + 대역폭 무제한. 자세한 건 별도 문서.

## 7. AdSense 통합

### 1단계: 승인 신청

1. https://adsense.google.com 가입 (Gmail)
2. 사이트 URL 입력 (배포된 사이트 라이브 상태)
3. 받은 한 줄 `<script>`를 모든 페이지 `<head>`에 삽입
4. 승인까지 3주~3개월 (콘텐츠·privacy·terms 페이지 필요)

### 2단계: 광고 코드 삽입

**`<head>`에 한 번 (publisher ID 발급 후)**:
```html
<script async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossorigin="anonymous"></script>
```

**광고 자리 placeholder를 실제 코드로 교체** (각 페이지 `[ AdSense 광고 자리 ]`):
```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="0123456789"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

### CPM 카테고리 우선순위

가장 단가 높은 도구부터 광고 단위 신경 쓰기:
1. 부동산 4종 (양도세·종부세·재산세·중개수수료) — RPM $5~20
2. 금융·세금 (상속세·연봉·연말정산) — RPM $3~10
3. 근로·고용 — RPM $1~3
4. 라이프스타일 (BMI·칼로리) — RPM $0.5~1

## 8. 쿠팡 파트너스 통합

### 1단계: 가입

1. https://partners.coupang.com 가입 (쿠팡 계정)
2. 트래킹 ID 발급 (즉시)

### 2단계: 광고 만들기

**다이나믹 배너 (자동 추천)**:
```html
<script src="https://ads-partners.coupang.com/g.js"></script>
<script>
  new PartnersCoupang.G({
    "id": 위젯ID,
    "trackingCode": "발급받은코드",
    "template": "carousel",
    "width": "680",
    "height": "140"
  });
</script>
```

### 카테고리별 매칭 추천

| 도구 | 추천 상품 카테고리 |
|---|---|
| `pregnancy/` `ovulation/` | 배란테스트기, 임신테스트기, 산모영양제 |
| `baby-formula/` | 분유, 젖병, 소독기 |
| `baby-clothes/` | 베이비 의류 |
| `growth/` | 성장 보충제, 어린이 영양제 |
| `cartax/` `cartax-yearly/` | 카시트, 블랙박스, 차량용품 |
| `bmi/` `calorie/` | 다이어트 보조제, 운동 용품 |

### 공정위 공시

광고 근처에 반드시 명시:
> 파트너스 활동을 통해 일정액의 수수료를 제공받을 수 있습니다.

(이미 모든 쿠팡 배너에 깔려 있음)

## 9. SEO 가속 체크리스트

- [ ] **Google Search Console** 등록 + sitemap.xml 제출
- [ ] **네이버 Search Advisor** 등록 (네이버 트래픽 30~50%)
- [ ] **루트 `index.html` 메뉴**에 Tools 추가
- [ ] **블로그 글 → 도구 cross-link** (블로그 SEO 자산 → 도구 트래픽)
- [ ] **JSON-LD 구조화 데이터** 추가 (rich snippet 노출)
- [ ] **privacy/terms 페이지** 작성 (AdSense 승인 필수)

## 10. 출처·법령 근거 정책 (중요)

수익화 사이트에서 세율·요율을 다루므로 신뢰성 = 사이트의 생명줄. 다음 정책을 유지:

1. **각 도구 페이지 하단에 `<section class="sources">` 필수** — 적용 법령·조문·공식 출처 링크
2. **각 JS 파일 상단 주석에 출처 명시** — 미래 갱신 시 검증 경로 보전
3. **수치 변경 시 공식 페이지(국세청·공단 등) 직접 확인** — 블로그·언론 보도만 보고 수정 금지
4. **`updated` 일자 기록** — 마지막 검증일 명시 (HTML `<div class="updated">`)
5. **불확실한 변경(개정안 발의 등)은 `note`에 별도 표기** — 본 데이터는 보수적으로 현행법 유지

## 11. 면책 정책

모든 도구는 **추정 보조 도구**이며 법적·재무적 결정의 근거로 삼지 말 것을 disclaimer에 명시. 큰 거래(부동산·상속·세무신고)는 반드시 전문가 상담 권장.

---

**최종 작성**: 2026-04-30
