# AdSense 등록 진행 기록

`taystudio.github.io/studio/` 에 AdSense를 붙이는 실제 진행 로그 + 의사결정 근거. 운영 매뉴얼은 `MONETIZATION.md`, 이 문서는 이번 셋업의 **체크리스트·기록·왜 이렇게 했는지**.

기존 상태: 티스토리에서 AdSense 운영 중 → 같은 계정에 이 사이트 추가하는 시나리오 (= 새 사이트 추가, 신규 가입 아님).

---

## 0. 핵심 개념 (먼저 이해해야 헷갈리지 않음)

### GitHub Pages는 두 종류

| 종류 | repo 이름 규칙 | 서빙 URL |
|---|---|---|
| **User Pages** | `<username>.github.io` (정확히 이 이름) | `https://<username>.github.io/` ← 루트 |
| **Project Pages** | 아무 이름 | `https://<username>.github.io/<reponame>/` |

User 현재:
- `studio` repo (Project Pages) → `taystudio.github.io/studio/` 에 사이트 서빙 중. **건드리지 않음.**
- `taystudio.github.io` repo (User Pages) → 존재하지 않음. 루트는 404.

### AdSense가 요구하는 것

- `ads.txt` 파일이 **루트** (`https://<도메인>/ads.txt`) 에 있어야 함. 서브폴더는 무시
- 즉 `taystudio.github.io/ads.txt` 가 200 OK로 응답해야 함
- 지금은 루트가 404라서 ads.txt 둘 곳 자체가 없음

### 그래서 해결책

**`taystudio.github.io` 라는 이름의 새 repo를 만든다.** 이 repo는 `ads.txt` 한 파일만 호스팅하는 빈 껍데기. `studio` repo와 별개로 공존. 기존 사이트(`/studio/`)에 영향 0.

```
taystudio (GitHub 계정)
├── studio                  ← 기존. 그대로 둠. 계산기 30개 사이트.
└── taystudio.github.io     ← 새로 만듦. ads.txt만 들어있음.
```

---

## 단계

### Step 1. 사전 확인 ✅
- [x] `taystudio.github.io` repo 존재 여부 → **없음** (루트 접속 시 404)
- [x] 티스토리 AdSense publisher ID → `pub-3553250610781349`

### Step 2. 루트 repo 생성 (현재)

**왜**: AdSense가 읽을 `ads.txt`를 둘 곳을 만들기 위함. (위 "0. 핵심 개념" 참조)

**방법** (GitHub 웹, 30초):
1. https://github.com/new 접속
2. Owner: `taystudio`
3. Repository name: `taystudio.github.io` ← 정확히 이 이름이어야 User Pages로 인식됨
4. Public 선택 (무료 계정에서 Pages는 public 필요)
5. "Add a README file" 체크 (빈 repo는 Pages가 안 켜짐 — 파일 하나 있어야 함)
6. Create repository

생성 후 → repo Settings → Pages → Source: `Deploy from a branch` / Branch: `main` / Folder: `/` (root) → Save.

1~2분 후 https://taystudio.github.io/ 접속해서 README 내용 보이면 Pages 활성화 완료.

- [ ] repo 생성
- [ ] Pages 활성화
- [ ] 루트 URL 접근 시 README 보임

### Step 3. ads.txt 작성·배포

**왜**: AdSense가 `https://taystudio.github.io/ads.txt`를 fetch해서 "이 사이트 광고 게재 권한이 정말 publisher `pub-3553250610781349`에게 있나"를 확인. 이 파일이 없으면 광고 게재 불가 또는 수익 차단.

**ads.txt 한 줄의 의미**:
```
google.com, pub-3553250610781349, DIRECT, f08c47fec0942fa0
```
- `google.com`: 광고 판매 권한을 가진 광고 시스템
- `pub-3553250610781349`: user의 publisher ID
- `DIRECT`: 직접 거래 (Google과 user 사이에 중개 없음)
- `f08c47fec0942fa0`: Google AdSense의 인증 ID (모든 사이트 동일, 고정값)

**방법** (GitHub 웹):
1. 새로 만든 `taystudio.github.io` repo 메인 → Add file → Create new file
2. 파일명: `ads.txt`
3. 내용: 위 한 줄 복붙
4. Commit changes
5. 1~2분 후 https://taystudio.github.io/ads.txt 접속 → 그 한 줄 그대로 보여야 함

- [ ] `ads.txt` 커밋
- [ ] 브라우저로 https://taystudio.github.io/ads.txt 접근 시 한 줄 텍스트 보임

### Step 4. AdSense 콘솔에서 사이트 추가

**왜**: AdSense 측에 "내 계정에서 이 도메인의 트래픽을 광고로 monetize 하겠다"고 등록하는 절차. 등록 후 Google이 사이트를 검토함.

**방법**:
1. https://adsense.google.com 접속
2. 좌측 메뉴 → 사이트 → "사이트 추가"
3. URL: `taystudio.github.io` (https:// 없이 도메인만)
4. 검토 신청

검토 기간: 며칠 ~ 몇 주 (Google 수동 심사). 그동안 user가 할 일 없음.

- [ ] AdSense에 사이트 추가
- [ ] 검토 신청 완료

### Step 5. 검토 대기 중 — 광고 코드 슬롯 준비

**왜**: 승인 받자마자 바로 광고 송출하려면 미리 코드 자리를 만들어둬야 함. 승인 후엔 광고 단위 ID만 끼우면 끝나도록.

작업 목록:
- AdSense 메인 스크립트 (`adsbygoogle.js`) 부트스트랩을 `common/site-chrome.js` 에 추가 (GA처럼 한 파일로 33페이지 커버)
- 도구 페이지의 기존 placeholder (`<div class="ad-slot">`) 위치 확인. 어디에 어떤 광고가 들어갈지 매핑
- 단, **승인 전엔 placeholder를 실제 `<ins class="adsbygoogle">` 로 바꾸지 않음** — 미승인 사이트가 광고 코드 박으면 정책 위반 위험

- [ ] `adsbygoogle.js` 부트스트랩 코드 작성
- [ ] placeholder 위치 매핑 표 작성

### Step 6. 승인 후 — 광고 게재

- [ ] AdSense에서 광고 단위 생성 (자동·디스플레이 등 결정)
- [ ] placeholder를 실제 광고 코드로 교체
- [ ] 라이브 확인, 클릭 시뮬레이션 (자기 클릭은 정책 위반이라 시각만 확인)

---

## 진행 기록

- 2026-05-03: 문서 생성. Step 1 완료 (`taystudio.github.io` repo 없음 확인, publisher ID `pub-3553250610781349`). Step 2 진행 시작 — repo 생성 + Pages 활성화 안내.
