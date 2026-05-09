# AdSense 등록 진행 기록

`taystudios.com` 에 AdSense를 붙이는 진행 로그 + 의사결정 근거. 운영 매뉴얼은 `MONETIZATION.md`, 이 문서는 이번 셋업의 **체크리스트·기록·왜 이렇게 했는지**.

기존 상태: 티스토리에서 AdSense 운영 중 → 같은 계정에 이 사이트 추가하는 시나리오 (= 새 사이트 추가, 신규 가입 아님).

---

## 0. 핵심 개념

### GitHub Pages 두 종류

| 종류 | repo 이름 규칙 | 서빙 URL |
|---|---|---|
| **User Pages** | `<username>.github.io` (정확히 이 이름) | `https://<username>.github.io/` ← 루트 |
| **Project Pages** | 아무 이름 | `https://<username>.github.io/<reponame>/` |

### AdSense가 요구하는 것

- `ads.txt` 파일이 **루트** (`https://<도메인>/ads.txt`) 에 있어야 함. 서브폴더는 무시
- 즉 `https://taystudios.com/ads.txt` 가 200 OK로 응답해야 함

### 우리의 선택: 단일 repo (User Pages)

원래 plan은 `studio` repo 그대로 두고 `taystudios.com` 라는 별도 repo 새로 만들어서 ads.txt만 호스팅하는 dual-repo 구조였음. 진행 중 user가 "차라리 repo 이름을 바꾸자" 결정 → **`studio` repo를 `taystudios.com` 로 rename**, 사이트 URL이 `/studio/` 경로 없어지고 루트에서 직접 서빙되는 구조로 변경.

```
기존: taystudios.com/studio/tools/salary/   (Project Pages)
이후: taystudios.com/tools/salary/          (User Pages, 단일 repo)
```

비용:
- 사이트의 모든 절대경로 (`/studio/...`) 와 canonical URL을 `/` 기준으로 일괄 치환 필요 (37 파일, 230곳)
- `BASE = '/studio'` 상수 → `BASE = ''`
- Service Worker 캐시 버전 업 (옛 경로 캐시 무효화)

이득:
- 더 짧고 깔끔한 URL
- ads.txt가 같은 repo 루트에 들어감 → repo 한 개로 통합
- AdSense, Search Console 등 외부 도구에 등록할 도메인이 사이트 그 자체

외부 영향 시점이 좋았음: AdSense 미신청·Search Console 미등록 상태라 SEO 손실 거의 없음.

---

## 1. 광고 시스템 — 작동 메커니즘 (개념 정리)

### 1-1. AdSense 광고 두 종류

| | 자동광고 (Auto Ads) | 광고 단위 (Ad Unit) |
|---|---|---|
| 박는 방식 | `<head>` 라이브러리 한 줄 | 라이브러리 + placeholder 자리에 `<ins>` 코드 |
| 광고 위치 결정 | AdSense AI가 페이지 분석 → 자동 | 우리가 정한 자리에 강제 노출 |
| 우리 `ad-slot` div와의 관계 | **무시함**. 별개 동작 | placeholder 자리에 코드 박아야 거기 노출 |
| 통제권 | 거의 없음 (AI 위임) | 100% (위치·크기 다 우리 결정) |
| 설정 난이도 | 쉬움 — 한 줄 박으면 끝 | 위치마다 광고 단위 ID 발급·삽입 |
| 추천 시점 | 심사 + 초기 운영 | 매출 최적화 단계 |

**둘의 관계**: 병행 가능 (자동광고 + 광고 단위 동시 운영), 또는 한쪽만 운영. 둘 다 공통으로 `adsbygoogle.js` 라이브러리에 의존.

### 1-2. `adsbygoogle.js` — AdSense의 부트로더

```html
<script async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX"
  crossorigin="anonymous"></script>
```

**각 부분의 의미**:

| 부분 | 의미 |
|---|---|
| `pagead2.googlesyndication.com` | Google AdSense 광고 서빙 CDN |
| `adsbygoogle.js` | AdSense 클라이언트 라이브러리 본체 (~100KB JS) |
| `?client=ca-pub-...` | publisher 식별. "이 사이트는 누구 거다" |
| `async` | HTML 파싱 막지 않고 백그라운드 다운로드 |
| `crossorigin="anonymous"` | CORS 정책 — 다른 도메인 자원 안전 모드 |

**로딩 후 동작 흐름**:
1. 브라우저가 `adsbygoogle.js` 다운
2. 라이브러리가 페이지 DOM 전체 스캔
3. 자동광고 ON이면 → AI가 적당한 자리에 광고 자동 삽입
4. `<ins class="adsbygoogle">` 태그 있으면 → 그 안에 광고 렌더링
5. 사용자 행동 추적 (노출·클릭·스크롤) → AdSense 콘솔 보고

**핵심 사실**: 이 한 줄이 **자동광고·광고 단위 둘 다의 전제 조건**. 없으면 둘 다 동작 0.

```
    adsbygoogle.js (head 한 줄)
         ↑ 이게 없으면 아래 둘 다 0%
    ┌────┴────┐
자동광고     광고 단위
```

비유 (백엔드 시각): Google Analytics `gtag.js`와 동일 패턴. 라이브러리 한 줄 등록 = 사이트 전체에 광고/추적 활성화 스위치.

### 1-3. 페이지 커버리지 룰

**박아야 할 페이지**: 광고 노출 원하는 일반 콘텐츠 페이지 (도구·기사 등)

**박지 말아야 할 페이지**:
- 404·에러 페이지 (AdSense 정책 위반)
- 결제·로그인 트랜잭션 페이지
- 콘텐츠 부족한 진입 허브 (광고 가치 낮음 + 첫인상 손상)

**페이지당 1번만**: 두 번 박으면 "duplicate ad client" 경고. 정확히 1회.

### 1-4. 자동광고 vs `ad-slot` placeholder 관계

우리 도구 페이지엔 `<div class="ad-slot">[ AdSense 광고 자리 ]</div>` placeholder가 미리 박혀있음. 자주 헷갈리는 포인트:

- **자동광고는 이 placeholder를 인식하지 않음**. AdSense AI가 자체 분석해서 자기가 판단한 자리에 광고 삽입
- placeholder 자리에 광고를 박으려면 → `<ins class="adsbygoogle">` 광고 단위 코드로 교체 (Step 9-3)
- 자동광고만 켠 상태에서도 placeholder 텍스트(`[ AdSense 광고 자리 ]`)는 그대로 보임 → 거슬리면 CSS로 숨기거나 제거

### 1-5. 우리 사이트 결정 (2026-05-03)

- **publisher ID**: `ca-pub-3553250610781349` (단일)
- **박은 페이지 (33개)**: `tools/index.html` 허브 + 30 도구 + `tools/privacy/` + `tools/terms/`
- **박지 않은 페이지**:
  - 루트 `index.html` — 진입 허브, 본문 716자로 콘텐츠 부족, AdSense AI도 광고 거의 안 뿌릴 위치. 첫인상 깔끔 유지 우선
  - `tools/404.html` — AdSense 정책상 권장 안 함
- **박은 위치**: 각 페이지 `<head>` 내 `<link rel="preconnect" href="https://pagead2.googlesyndication.com">` 직후
- **방식**: 정적 `<script>` 태그 직접 삽입 (당초 계획됐던 `common/site-chrome.js` JS 동적 로드 방식 미사용)
- **시점**: AdSense 검토 대기 중에 미리 박음. 광고는 승인 후에야 노출됨 (지금은 라이브러리만 로드되고 광고 0)

---

## 단계

### Step 1. 사전 확인 ✅
- [x] 기존 GitHub Pages 구조 파악 (`studio` Project Pages, 루트 비어있음)
- [x] 티스토리 AdSense publisher ID → `pub-3553250610781349`

### Step 2. Repo 정리 ✅
- [x] (시도했다 폐기) 빈 `taystudios.com` repo 생성 → 삭제됨 (단일 repo 전략으로 전환)
- [x] `studio` repo → `taystudios.com` 로 rename
- [x] 로컬 git remote `origin` 갱신

### Step 3. 코드 일괄 갱신 ✅
- [x] `/studio/` → `/` (37 파일, 230곳)
- [x] `BASE = '/studio'` → `BASE = ''` (`common/site-chrome.js`)
- [x] `CACHE_VERSION` v3 → v4 (`tools/sw.js`)
- [x] 잔존 `/studio` 검사 통과 (코드 0개)
- [x] 이중 슬래시 등 부작용 검사 통과

### Step 4. ads.txt 작성

**ads.txt 가 뭔가**

IAB (Interactive Advertising Bureau) 가 정의한 광고 사기 방지 표준. 사이트 운영자가 "내 사이트에서 광고를 팔 권한을 가진 publisher는 이 사람이다" 라고 도메인 루트에 공개적으로 선언하는 텍스트 파일. 광고주·광고 거래소들은 광고 입찰 전에 이 파일을 fetch해서 "지금 이 도메인에서 들어온 광고 슬롯이 진짜 정당한 publisher 거래인가" 검증한다. 파일 없거나 잘못되면 → 광고 거래소가 입찰 거부 → 수익 0.

**왜 GitHub Pages에선 직접 만들어야 하나**

티스토리는 플랫폼이 자기 도메인의 ads.txt를 자동 관리해줘서 user가 신경 쓸 일 없음 (티스토리가 "이 도메인 안의 블로그들은 각자 publisher ID를 갖고 있다" 식으로 자동 등록). GitHub Pages는 그런 자동화 없음. **루트 도메인(`taystudios.com`)의 ads.txt는 user 본인이 호스팅** 해야 함.

**우리 ads.txt 한 줄 분해**

위치: 이 repo 루트 (`./ads.txt`) → 라이브에선 `https://taystudios.com/ads.txt`

```
google.com, pub-3553250610781349, DIRECT, f08c47fec0942fa0
```

| 필드 | 값 | 의미 |
|---|---|---|
| 1 | `google.com` | 광고 판매 권한을 가진 시스템 (AdSense는 google.com이 운영) |
| 2 | `pub-3553250610781349` | user의 publisher ID (티스토리에서 쓰던 그것 그대로) |
| 3 | `DIRECT` | 직접 거래 (= user가 Google과 직접 계약, 재판매·중개 없음) |
| 4 | `f08c47fec0942fa0` | Google AdSense의 인증 ID. **모든 AdSense 사이트가 동일하게 쓰는 고정값**. user가 만들어내는 게 아님 |

**Publisher ID 공개에 대한 우려 — 안전함**

- ads.txt 자체가 **공개 fetch를 전제로 한 표준**. IAB 명세상 누구나 GET 가능해야 정상 동작
- pub-ID는 "계정 번호"에 불과. 비밀번호·세션 토큰·결제정보가 아님
- pub-ID만으로 user의 AdSense 계정 접근 불가 (Google 로그인 필요)
- AdSense 승인 후 광고 코드 박으면 모든 페이지 `<script>` 에 pub-ID가 노출됨 → 어차피 공개. ads.txt는 그걸 명시화하는 것뿐
- 비밀로 둬야 할 것: Google 계정 비밀번호, 2FA 코드, 결제 계좌, AdSense API 키(있다면). pub-ID는 거기 안 들어감

**다중 광고 시스템을 쓸 경우** (참고)

나중에 AdSense 외에 다른 광고 네트워크 (예: 미디어매스, 크리테오 등) 추가하면 ads.txt에 줄 추가:

```
google.com, pub-3553250610781349, DIRECT, f08c47fec0942fa0
example-adnetwork.com, 12345, RESELLER, abc123def456
```

지금은 AdSense 한 줄만 있으면 됨.

- [x] `ads.txt` 파일 생성
- [ ] commit + push 후 https://taystudios.com/ads.txt 접근 시 한 줄 텍스트 보임

### Step 5. 라이브 복구 — push

**왜**: rename 직후 라이브 사이트는 옛 코드(`/studio/` 경로)를 서빙 중이라 링크 다 깨짐. 새 코드를 push해야 정상 동작.

- [ ] `git add` 모든 변경
- [ ] commit
- [ ] push to origin
- [ ] 1~2분 후 https://taystudios.com/ 정상 동작 확인
- [ ] https://taystudios.com/tools/salary/ 등 도구 페이지 정상 확인
- [ ] https://taystudios.com/ads.txt 200 OK 확인

### Step 6. GA4 데이터 스트림 URL 갱신 ✅
- [x] `https://taystudios.com/studio/` → `https://taystudios.com/` (user, 콘솔에서)
- 측정 ID는 동일 (`G-79C40NJRYT`)

### Step 7. AdSense 콘솔에서 사이트 추가

**왜 필요한가**

AdSense는 "특정 publisher 계정이 특정 도메인을 monetize 할 권한이 있다" 를 명시적으로 등록해야 광고를 송출함. 등록 없으면:
- 광고 코드 페이지에 박아도 광고 안 뜸
- 어쩌다 떠도 정책 위반으로 차단·계정 정지 위험
- 수익 0

ads.txt는 "publisher가 이 도메인 권한이 있다" 외부 선언, 사이트 추가는 "AdSense 내부 시스템에 그 매핑을 등록" 이다. 둘 다 필요.

#### Step 7-1. 검증 메커니즘 (먼저 이해)

AdSense가 사이트 소유권을 확인하는 방법 세 가지. **하나만 충족하면 통과**:

| 방법 | 위치·형태 | 장단점 |
|---|---|---|
| **A. ads.txt** | 루트 `/ads.txt` 에 한 줄: `google.com, pub-XXX, DIRECT, f08c47fec0942fa0` | 한 곳에서 끝남. 정적 사이트에 가장 간단 |
| **B. 메타 태그** | 모든 페이지 `<head>` 에 `<meta name="google-adsense-account" content="ca-pub-XXX">` | 사이트 코드 수정 필요. 페이지 추가될 때마다 신경 |
| **C. AdSense 스니펫** | 모든 페이지 `<head>` 에 `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXX" crossorigin="anonymous"></script>` | 검증 + 광고 라이브러리 로드를 한 번에. 승인 후 곧장 광고 송출 가능 |

세 방법은 **동등** (어느 거든 통과하면 검증 OK). 정적 사이트 + GitHub Pages 환경에선 일반적으로:
- A가 가장 깔끔 (한 파일, 한 줄)
- C는 "어차피 승인 후엔 깔아야 하니까 미리 넣자" 전략 — 단, 미승인 사이트에 박아두면 정책 위반 가능성 있어서 권장 안 됨
- B는 티스토리 같은 호스팅 플랫폼에서 자주 보였던 옛 방식

**우리 선택**: A (ads.txt). 이미 Step 4에서 작성·배포함.

#### Step 7-2. AdSense 콘솔 절차

1. https://adsense.google.com 접속 (티스토리 운영하던 동일 계정)
2. 좌측 메뉴 → **사이트** → 우측 상단 **사이트 추가**
3. **사이트 URL** 입력:
   ```
   taystudios.com
   ```
   `https://` 없이, 끝에 `/` 없이, 도메인만
4. AdSense가 다음 단계로 안내:
   - "ads.txt에 다음 한 줄을 추가하세요" 같은 안내 → 우리는 이미 했음. "확인" 클릭
   - 또는 메타 태그 / 스니펫 옵션을 보여줄 수 있음 → ads.txt가 이미 fetch 가능하면 그대로 통과
5. **검토 요청** 클릭

#### Step 7-3. 검토 메커니즘

신청 후 AdSense는:
1. **자동 크롤** — Google 봇이 사이트 전체 크롤링 (`taystudios.com` + 모든 도구 페이지)
2. **검증 fetch** — `/ads.txt` 요청해서 publisher ID 매칭 확인
3. **수동 검토** — 사람이 콘텐츠 품질·정책 준수 확인 (광고 부합 여부)

검토 기간: 며칠 ~ 몇 주 (사이트 규모·기존 신청량에 따라 변동). 한국에선 보통 1~3주.

#### Step 7-4. 검토 중 user가 하지 말아야 할 것

- 사이트를 죽이지 말 것 (도메인 만료, 502 에러, robots.txt로 전체 차단 등)
- 광고 코드 박지 말 것 (승인 전 광고 송출 = 정책 위반)
- 콘텐츠를 갑자기 비우거나 외설·도박·해적 콘텐츠 추가하지 말 것

#### Step 7-5. 자주 막히는 포인트와 원인

| 증상 | 원인 | 대처 |
|---|---|---|
| "ads.txt에서 publisher ID를 찾을 수 없음" | 캐시·전파 지연. 또는 ads.txt 형식 오타 | https://taystudios.com/ads.txt 직접 열어서 확인. 안 보이면 push 미반영, 보이면 1~2분 더 대기 후 재시도 |
| "이미 등록된 도메인" | 같은 도메인이 다른 계정에 한 번이라도 등록됐을 때 | 전 계정에서 사이트 제거 또는 Google 지원에 문의 |
| "사이트가 정책 위반 우려" | 콘텐츠 부족·UX 문제·개인정보처리방침 누락 | 우리 사이트엔 `/tools/privacy/`·`/tools/terms/` 있음. 도구 30개 = 콘텐츠 충분. 보통 통과 |
| "사이트가 비어있다" | 봇이 JS 렌더링 못해서 빈 HTML로 인식 | 우리 사이트는 SSG 형태(HTML 직접 작성)라 해당 없음 |
| 검토가 4주+ 무응답 | 트래픽 너무 적거나 신규 사이트 큐 적체 | Search Console 등록·인덱싱·소량 트래픽 유입 후 재신청 |

#### Step 7-6. 실제 진행 흐름 (2026-05-03 기록)

User가 콘솔에서 거친 단계, 화면 표시 그대로:

1. AdSense → 사이트 → 사이트 추가 → URL `taystudios.com` 입력
2. AdSense가 화면에 안내 표시:
   ```
   다음 한 줄을 ads.txt에 추가하세요:
   google.com, pub-3553250610781349, DIRECT, f08c47fec0942fa0
   ```
   → 우리는 Step 4에서 이미 했음 (push까지 완료 상태)
3. 화면 하단 **"ads.txt 파일을 게시함"** 버튼 클릭
   - 이 버튼의 의미: "내가 ads.txt 등록 끝냈으니 지금 검증해줘" 신호
   - 클릭 시 AdSense가 즉시 `https://taystudios.com/ads.txt` fetch → publisher ID 매칭 확인
4. 결과: **"사이트 확인됨"** 표시 → 검토 큐 진입

이 시점부터:
- AdSense가 백그라운드에서 사이트 자동 크롤링 시작
- 수동 검토 큐 대기
- user가 할 일 = 사이트 정상 유지

#### Step 7-7. 자주 막히는 포인트와 원인

| 증상 | 원인 | 대처 |
|---|---|---|
| "ads.txt에서 publisher ID를 찾을 수 없음" | 캐시·전파 지연. 또는 ads.txt 형식 오타 | https://taystudios.com/ads.txt 직접 열어서 확인. 안 보이면 push 미반영, 보이면 1~2분 더 대기 후 재시도 |
| "이미 등록된 도메인" | 같은 도메인이 다른 계정에 한 번이라도 등록됐을 때 | 전 계정에서 사이트 제거 또는 Google 지원에 문의 |
| "사이트가 정책 위반 우려" | 콘텐츠 부족·UX 문제·개인정보처리방침 누락 | 우리 사이트엔 `/tools/privacy/`·`/tools/terms/` 있음. 도구 30개 = 콘텐츠 충분. 보통 통과 |
| "사이트가 비어있다" | 봇이 JS 렌더링 못해서 빈 HTML로 인식 | 우리 사이트는 SSG 형태(HTML 직접 작성)라 해당 없음 |
| 검토가 4주+ 무응답 | 트래픽 너무 적거나 신규 사이트 큐 적체 | Search Console 등록·인덱싱·소량 트래픽 유입 후 재신청 |

- [x] AdSense에 사이트 추가
- [x] 검증 통과 (사이트 확인됨)
- [ ] 수동 검토 통과 대기 중

#### Step 7-8. CMP (사용자 동의 메시지) 설정

사이트 추가 마법사가 검증 통과 직후 보여주는 필수 셋업. 화면에 "사이트에 사용할 동의 메시지 만들기" 항목으로 노출됨.

**왜 필요한가 — 법적 배경**

- **EU GDPR** (2018), **EU Digital Services Act / DMA** (2023~), **IAB TCF v2.2** (2023): 광고 추적·맞춤형 광고를 EEA·영국·스위스 사용자에게 보여주려면 **명시적 동의** 필수
- 동의 안 받고 광고 띄우면 → 광고주 입찰 거부 + 법적 과징금 위험 + AdSense 자체 정책 위반
- AdSense는 publisher가 적절한 CMP (Consent Management Platform) 를 셋업했는지 확인하기 전에는 EEA 트래픽에 광고 안 띄움 (= 그 지역 트래픽 수익 0)
- 한국이 주 시장이어도 EEA에서 들어오는 일부 사용자가 있으면 그 부분 수익이 묶임 → 한 번 셋업해두면 영원히 신경 안 써도 됨

**CMP가 하는 일 (메커니즘)**

1. EEA·영국·스위스 IP의 사용자가 사이트 첫 방문 시 **동의 배너** 자동 표시
2. 사용자가 "동의" / "거부" / "관리" 중 선택
3. 선택 결과를 IAB TCF 표준 string 형태로 쿠키에 저장
4. AdSense 라이브러리가 매 요청마다 그 string 읽어서 광고 거래소에 전달
5. 광고 거래소는 string 값에 따라 맞춤 광고 / 비맞춤 광고 / 광고 없음 분기

이 모든 게 AdSense 라이브러리(`adsbygoogle.js`)에 내장됨 — **user 사이트 코드에 별도 작업 없음**. 콘솔에서 메시지 만들기만 하면 자동으로 EEA 트래픽에 노출됨.

**옵션 세 가지 비교**

| 옵션 | 표시 버튼 | 특징 | 평가 |
|---|---|---|---|
| **A. Google CMP — 2가지 선택** | 동의 / 광고 관리 | 거부 버튼 없음. "광고 관리"에서 거부 가능하지만 한 단계 들어가야 함 | TCF v2.2 / DSA 권장사항 미달. 규정 위반 가능성. **비추** |
| **B. Google CMP — 3가지 선택** ← **선택함** | 동의 / 동의하지 않음 / 옵션 관리 | "거부"가 "동의"와 같은 화면 같은 위계에 노출. 규정 100% 충족 | TCF v2.2 표준. 무료. AdSense 라이브러리 자동 통합. **추천** |
| **C. Google 인증 제3자 CMP** | (외부 솔루션) | OneTrust, Didomi 등 외부 CMP 가입 후 연동. 추가 기능·다양한 동의 흐름 | 별도 계약·결제·연동 코드 작업 필요. 대형 사이트 / 복합 추적 환경에서만 가치. **비추** (지금 단계) |

**왜 B를 선택했나**

1. **법적 안전마진**: TCF v2.2의 핵심은 "거부 버튼을 동의 버튼만큼 prominent하게" — A는 이걸 못 맞춤
2. **무료 + 통합**: Google CMP는 AdSense 라이브러리에 빌트인. 별도 스크립트 안 깔아도 됨
3. **유지보수 0**: 규정 바뀌면 Google이 알아서 업데이트
4. **확장성**: 나중에 사이트 더 추가해도 같은 CMP가 모든 사이트에 적용 가능 ("내 사이트 및 향후 사이트" 옵션)
5. **C가 의미 있는 케이스**: GA4 외 다른 추적 도구 다수 운영, 동의 카테고리 세분화 필요, 다국어 메시지 커스텀 강하게 필요. 우리 사이트에는 과함

**제출 후 절차**

1. **가운데 옵션 (3가지)** 선택 → **제출** 클릭
2. 다음 화면: 메시지 외관 커스터마이즈
   - **언어**: 기본 자동감지 (브라우저 언어 기준). 그대로 둬도 됨
   - **테마/색상**: 사이트 톤(파란색 `#2563eb`)과 맞추면 깔끔. 기본값도 무방
   - **로고**: TAYSTUDIO 로고 추가하면 신뢰감 ↑. 선택사항
   - **텍스트**: Google 기본 문구로 충분. 직접 쓸 수도 있음 (한국어/영어 자동 노출)
3. **활성화 범위 선택**:
   - 보통 "EEA, 영국, 스위스 사용자에게만" 이 자동 권장됨 → 그대로 두기
   - "전 세계" 로 하면 한국 사용자한테도 배너 떠서 UX 손상. 비추
4. **게시** 클릭 → 즉시 활성화. EEA 트래픽 들어오면 그때부터 자동 노출
5. AdSense 콘솔의 마법사 화면에서 ⚠️ 가 ✅ 로 바뀜

**검증 방법** (게시 후 즉시 확인 가능):
- VPN으로 EEA 국가(독일, 프랑스 등) IP로 접속 → 첫 방문 시 동의 배너 떠야 정상
- 또는 Chrome DevTools → Network conditions → User-Agent를 EU 브라우저로 설정 후 incognito 접속

**자주 막히는 포인트**

| 증상 | 원인 | 대처 |
|---|---|---|
| 한국 IP로 접속해도 배너가 뜸 | "전 세계" 활성화로 설정함 | 콘솔 → 프라이버시 및 메시지 → 메시지 편집 → 적용 위치 변경 |
| EEA IP로 접속해도 배너 안 뜸 | 게시 안 했거나 활성화 안 함 | 콘솔에서 메시지 상태 "게시됨" 확인 |
| 한국어 메시지 깨짐 | 폰트·인코딩 문제 거의 없음 | 직접 한국어 텍스트 작성 또는 자동감지 유지 |

- [ ] 가운데 옵션(3가지) 선택 후 제출
- [ ] 메시지 외관·언어 커스텀 (또는 기본값 유지)
- [ ] 적용 위치 = EEA·영국·스위스만
- [ ] 게시
- [ ] AdSense 콘솔 마법사에서 "동의 메시지 만들기" 항목 ✅ 로 변경 확인

**참고 링크 (공식)**:
- AdSense ads.txt 정책: https://support.google.com/adsense/answer/7532444
- AdSense 사이트 등록·관리: https://support.google.com/adsense/answer/9276288
- AdSense 정책 가이드 (콘텐츠 기준): https://support.google.com/adsense/answer/48182
- IAB ads.txt 표준 명세 (기술적 배경): https://iabtechlab.com/ads-txt/
- Google 사용자 동의 정책 (EU): https://www.google.com/about/company/user-consent-policy/
- IAB TCF v2.2 명세: https://iabeurope.eu/transparency-consent-framework/
- AdSense CMP 도움말: https://support.google.com/adsense/answer/13554116

### Step 8. 검토 대기 중 — 광고 코드 슬롯 준비

**왜**: 승인 받자마자 바로 광고 송출하려면 자리·구조가 미리 준비돼 있어야 함. 승인 후엔 광고 단위 ID 끼우는 일만 남도록 설계.

#### Step 8-1. 광고 송출 메커니즘 (먼저 이해)

AdSense 광고가 페이지에 뜨려면 **세 요소**가 모두 있어야 함:

1. **AdSense 라이브러리** (페이지당 한 번 로드)
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3553250610781349" crossorigin="anonymous"></script>
   ```
   이 한 줄을 모든 페이지 `<head>`에 깔아야 함. 33페이지 직접 박는 대신 `common/site-chrome.js` 에서 동적으로 inject (GA와 동일 전략).

2. **광고 슬롯** (광고 띄울 자리)
   ```html
   <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-3553250610781349"
        data-ad-slot="<광고-단위-ID>"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
   ```
   `data-ad-slot` 값은 AdSense 콘솔에서 광고 단위 만들 때 발급받음.

3. **푸시 호출** (라이브러리에 슬롯을 등록)
   ```html
   <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
   ```
   슬롯마다 한 번씩 push.

이 세 개가 다 갖춰져야 광고가 실제 송출됨.

#### Step 8-2. 미승인 상태에서 무엇을 미리 작성할 수 있나

- ✅ 광고 슬롯이 들어갈 **placeholder 위치 확정** (현재 `<div class="ad-slot">` 들이 어디 있는지 매핑)
- ✅ AdSense 라이브러리 로드 코드를 `common/site-chrome.js` 에 미리 작성 — **단, 승인 전엔 활성화하지 않음** (주석 처리 또는 ENABLED 플래그로 토글)
- ❌ 실제 `<ins class="adsbygoogle">` 슬롯을 placeholder 자리에 넣는 것 → 정책 위반 위험. 승인 후에만 교체.

#### Step 8-3. 작업 목록

- [ ] `tools/` 아래 모든 페이지에서 기존 `.ad-slot` placeholder 위치 grep으로 매핑 (몇 개, 어디에)
- [ ] `common/site-chrome.js` 에 AdSense 라이브러리 로드 코드 추가 (비활성화 상태로)
- [ ] 광고 단위 종류 결정: 디스플레이 / 인피드 / 인아티클 / 자동 광고 — 각 도구 페이지 특성에 맞게
- [ ] (승인 후) placeholder를 실제 `<ins>` 코드로 교체

### Step 9. 승인 후 — 광고 게재

**전제**: AdSense에서 "사이트 승인됨" 알림 받은 후 진행. 그 전에 실제 광고 태그 박지 말 것.

#### Step 9-1. AdSense 라이브러리 활성화

> **2026-05-03 갱신**: 이 단계는 검토 대기 중에 이미 처리됨 (진행 기록 (6) 참고). 정적 `<script>` 태그 방식으로 33 페이지에 일괄 삽입 완료. 아래 JS 동적 로드 안 사용. 검토 통과되면 별도 활성화 작업 없이 바로 광고 송출 시작.

(참고용 — 원래 계획됐던 JS 동적 로드 방식)

`common/site-chrome.js` 의 비활성 상태였던 AdSense 라이브러리 로드 코드를 활성화 (또는 `ENABLED = true` 플래그 토글).

```javascript
const ADSENSE_CLIENT = 'ca-pub-3553250610781349';
const ADSENSE_ENABLED = true;  // 승인 후 켜기
if (ADSENSE_ENABLED) {
  const ad = document.createElement('script');
  ad.async = true;
  ad.crossOrigin = 'anonymous';
  ad.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
  document.head.appendChild(ad);
}
```

이게 모든 페이지 `<head>`에 라이브러리 깔리는 부분.

#### Step 9-2. 광고 단위 생성

AdSense 콘솔 → 광고 → 광고 단위 → 새 광고 단위:
- **디스플레이 광고**: 가장 일반적. 사각형, 띠, 자동 크기
- **인피드**: 콘텐츠 사이 자연스럽게 (도구 목록에 끼우기 좋음)
- **인아티클**: 본문 안 (계산 결과 페이지 같은 곳)
- **자동 광고**: AdSense가 자동으로 위치 결정. 가장 쉬움. 단 통제권 적음

각 광고 단위 생성 시 발급되는 **slot ID** 를 받아서 placeholder에 끼움.

#### Step 9-3. Placeholder를 실제 슬롯으로 교체

기존 코드 (placeholder):
```html
<div class="ad-slot">[ AdSense 광고 자리 ]</div>
```

교체 후:
```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-3553250610781349"
     data-ad-slot="<발급받은-slot-ID>"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

위치별로 다른 광고 단위 (= 다른 slot ID) 만들면 광고 성과를 위치별로 분석 가능.

#### Step 9-4. 검수

- 라이브 사이트에서 광고 영역에 실제 광고 표시되는지 확인
  - 처음엔 빈칸 보일 수 있음 (광고 매칭 알고리즘 학습 중). 보통 24-48시간 내 채워짐
- 자기 클릭 절대 금지 (정책 위반 → 계정 정지)
- 모바일·데스크탑 양쪽에서 레이아웃 깨짐 없나 확인
- Core Web Vitals (LCP, CLS) 측정 — 광고 때문에 사이트 느려지면 SEO·UX 손해
- 첫 수익은 보통 광고 게재 시작 후 며칠~몇 주 내 누적

#### Step 9-5. 작업 체크리스트

- [ ] AdSense 라이브러리 로드 활성화 (`common/site-chrome.js`)
- [ ] AdSense 콘솔에서 광고 단위 생성 (위치·형태별로)
- [ ] 각 도구 페이지 placeholder를 실제 `<ins>` 태그로 교체
- [ ] 라이브 검증 (광고 노출, 레이아웃, 페이지 속도)
- [ ] AdSense 콘솔에서 노출·클릭·수익 모니터링 시작

---

## 진행 기록

- 2026-05-03 (1): 문서 생성. Step 1 완료.
- 2026-05-03 (2): dual-repo 전략으로 빈 `taystudios.com` repo 생성·README 추가까지 진행.
- 2026-05-03 (3): User 결정으로 단일-repo 전략 전환 — 빈 repo 삭제, `studio` → `taystudios.com` rename. 로컬 코드 일괄 치환 완료. GA4 스트림 URL 갱신 완료. 다음: ads.txt 작성 + push.
- 2026-05-03 (4): `ads.txt` 작성·commit·push 완료. https://taystudios.com/ads.txt 한 줄 응답 확인.
- 2026-05-03 (5): AdSense 콘솔에서 사이트 추가 (`taystudios.com`) → "ads.txt 파일을 게시함" 클릭 → **사이트 확인됨** 통과. 현재 수동 검토 큐 대기 중.
- 2026-05-03 (6): 자동광고 라이브러리(`adsbygoogle.js`) 33개 페이지 `<head>`에 정적 `<script>` 태그로 일괄 삽입 (Python 스크립트로 처리). 위치: `preconnect` 라인 직후. 루트 `index.html`은 진입 허브 + 콘텐츠 부족(본문 716자)으로 제외 결정. publisher ID 일관성 검증 통과 (`ca-pub-3553250610781349` 단일). 검토 대기 중에 미리 박은 것 — 승인 후에야 광고 노출. 자세한 개념·결정 근거는 §1.
- 2026-05-03 (6): 사이트 추가 마법사가 마지막 단계로 CMP(동의 메시지) 설정 요구 → 가운데 옵션(3가지 선택, TCF v2.2 표준) 채택 진행 중.
