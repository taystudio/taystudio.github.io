# AdSense 등록 진행 기록

`taystudio.github.io` 에 AdSense를 붙이는 진행 로그 + 의사결정 근거. 운영 매뉴얼은 `MONETIZATION.md`, 이 문서는 이번 셋업의 **체크리스트·기록·왜 이렇게 했는지**.

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
- 즉 `https://taystudio.github.io/ads.txt` 가 200 OK로 응답해야 함

### 우리의 선택: 단일 repo (User Pages)

원래 plan은 `studio` repo 그대로 두고 `taystudio.github.io` 라는 별도 repo 새로 만들어서 ads.txt만 호스팅하는 dual-repo 구조였음. 진행 중 user가 "차라리 repo 이름을 바꾸자" 결정 → **`studio` repo를 `taystudio.github.io` 로 rename**, 사이트 URL이 `/studio/` 경로 없어지고 루트에서 직접 서빙되는 구조로 변경.

```
기존: taystudio.github.io/studio/tools/salary/   (Project Pages)
이후: taystudio.github.io/tools/salary/          (User Pages, 단일 repo)
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

## 단계

### Step 1. 사전 확인 ✅
- [x] 기존 GitHub Pages 구조 파악 (`studio` Project Pages, 루트 비어있음)
- [x] 티스토리 AdSense publisher ID → `pub-3553250610781349`

### Step 2. Repo 정리 ✅
- [x] (시도했다 폐기) 빈 `taystudio.github.io` repo 생성 → 삭제됨 (단일 repo 전략으로 전환)
- [x] `studio` repo → `taystudio.github.io` 로 rename
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

티스토리는 플랫폼이 자기 도메인의 ads.txt를 자동 관리해줘서 user가 신경 쓸 일 없음 (티스토리가 "이 도메인 안의 블로그들은 각자 publisher ID를 갖고 있다" 식으로 자동 등록). GitHub Pages는 그런 자동화 없음. **루트 도메인(`taystudio.github.io`)의 ads.txt는 user 본인이 호스팅** 해야 함.

**우리 ads.txt 한 줄 분해**

위치: 이 repo 루트 (`./ads.txt`) → 라이브에선 `https://taystudio.github.io/ads.txt`

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
- [ ] commit + push 후 https://taystudio.github.io/ads.txt 접근 시 한 줄 텍스트 보임

### Step 5. 라이브 복구 — push

**왜**: rename 직후 라이브 사이트는 옛 코드(`/studio/` 경로)를 서빙 중이라 링크 다 깨짐. 새 코드를 push해야 정상 동작.

- [ ] `git add` 모든 변경
- [ ] commit
- [ ] push to origin
- [ ] 1~2분 후 https://taystudio.github.io/ 정상 동작 확인
- [ ] https://taystudio.github.io/tools/salary/ 등 도구 페이지 정상 확인
- [ ] https://taystudio.github.io/ads.txt 200 OK 확인

### Step 6. GA4 데이터 스트림 URL 갱신 ✅
- [x] `https://taystudio.github.io/studio/` → `https://taystudio.github.io/` (user, 콘솔에서)
- 측정 ID는 동일 (`G-79C40NJRYT`)

### Step 7. AdSense 콘솔에서 사이트 추가

**왜**: AdSense 측에 "이 도메인의 트래픽을 광고로 monetize 하겠다" 등록.

**방법**:
1. https://adsense.google.com → 사이트 → 사이트 추가
2. URL: `taystudio.github.io` (https:// 없이 도메인만)
3. 검토 신청

검토 기간: 며칠 ~ 몇 주 (Google 수동 심사). 그동안 user가 할 일 없음.

- [ ] AdSense에 사이트 추가
- [ ] 검토 신청 완료

### Step 8. 검토 대기 중 — 광고 코드 슬롯 준비

**왜**: 승인 받자마자 바로 광고 송출하려면 미리 코드 자리를 만들어둬야 함.

작업:
- AdSense 메인 스크립트 (`adsbygoogle.js`) 부트스트랩을 `common/site-chrome.js` 에 추가 (GA처럼 한 파일로 33페이지 커버)
- 도구 페이지의 기존 placeholder (`<div class="ad-slot">`) 위치 확인
- 단, **승인 전엔 placeholder를 실제 광고 태그로 교체하지 않음** — 미승인 사이트가 광고 코드 박으면 정책 위반 위험

- [ ] `adsbygoogle.js` 부트스트랩 코드 작성
- [ ] placeholder 위치 매핑 표 작성

### Step 9. 승인 후 — 광고 게재
- [ ] AdSense에서 광고 단위 생성
- [ ] placeholder를 실제 광고 코드로 교체
- [ ] 라이브 확인

---

## 진행 기록

- 2026-05-03 (1): 문서 생성. Step 1 완료.
- 2026-05-03 (2): dual-repo 전략으로 빈 `taystudio.github.io` repo 생성·README 추가까지 진행.
- 2026-05-03 (3): User 결정으로 단일-repo 전략 전환 — 빈 repo 삭제, `studio` → `taystudio.github.io` rename. 로컬 코드 일괄 치환 완료. GA4 스트림 URL 갱신 완료. 다음: ads.txt 작성 + push.
