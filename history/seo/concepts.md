# SEO 개념정리

사이트 운영하면서 plan·history·세션 대화에 자주 등장하는 SEO 용어 누적 정리. 새 개념 등장 시 여기에 추가.

---

## SERP (Search Engine Results Page)

### 한 줄 정의

검색엔진(Google·Naver 등)에 검색어를 치면 나오는 그 **결과 페이지**.

### 화면 구조 (Google 기준)

```
┌──────────────────────────────────────────────┐
│ 검색창: "글자수 세기"                          │
├──────────────────────────────────────────────┤
│ [광고] sponsored ──────────────── 가장 위     │
├──────────────────────────────────────────────┤
│ ⭐ Featured snippet (강조 박스)               │ ← 질문 답을 직접 노출
│   "글자수 세는 방법은 ..."                    │
├──────────────────────────────────────────────┤
│ 1. 글자수 카운터 - taystudio.github.io        │ ← 유기적 결과 (organic)
│    공백 포함·제외, SNS·자소서 한도 ...        │    우리가 노출되는 곳
│                                               │
│ 2. naver.com/...                              │
│ 3. 다른 사이트 ...                            │
├──────────────────────────────────────────────┤
│ "사람들이 함께 찾아본 질문" (PAA)             │
│ ▸ 글자수에 공백이 포함되나요?                 │
├──────────────────────────────────────────────┤
│ 관련 검색어 / 페이지네이션                    │
└──────────────────────────────────────────────┘
```

### 사이트가 신경 쓰는 SERP 영역

| 영역 | 어떻게 노출되나 |
|---|---|
| **유기적 결과 (organic)** ⭐ | `<title>` + `meta description` + canonical + 콘텐츠 깊이 |
| **Featured snippet** | FAQ JSON-LD + 명확한 질문 답 (콘텐츠 구조화) |
| **Rich results (리치 스니펫)** | JSON-LD WebApplication·HowTo·FAQPage 박으면 별점·이미지·번호카드 노출 |
| **PAA (People Also Ask)** | FAQ가 PAA 후보로 채택되기도 함 |
| **Knowledge Panel** | Organization JSON-LD — 브랜드 검색 시 우측 패널 (이미 적용) |

### 사이트가 적용한 SERP 전략

- **각 페이지 `<title>`** — 키워드 정확히 포함 (예: "연봉 실수령액 계산기 | TAYSTUDIO")
- **meta description** — SERP에 그대로 표시되는 1-2 줄. 클릭 유도 카피
- **JSON-LD WebApplication·BreadcrumbList·FAQPage** — 51 페이지 적용 (rich result 후보)
- **canonical** — 미러 사이트가 있어도 원본 인지
- **og:image** — SNS는 OG 사용. SERP는 별개. 다만 Knowledge Panel 후보 자료로 쓰임

### "SERP 약함"이라는 표현의 의미

plan에 자주 등장:

> "카테고리 hub가 카드 그리드만 있어 thin content. 카테고리 키워드 SERP 약함"

= **"이미지 도구 모음" 같은 카테고리 키워드 검색 시 우리 카테고리 hub가 SERP 상위에 안 올라옴.** 콘텐츠 깊이가 약해서. plan §9.4-2 SEO Tier 1.2 작업이 이를 해결 (hub-intro + FAQ + 출처).

### 측정 — Search Console

SC "성능" 탭에서:

| 키워드 | 노출수 | 클릭수 | CTR | 평균 순위 |
|---|---|---|---|---|
| 글자수 세기 | 1234 | 87 | 7.0% | 4.2 |
| 연봉 실수령액 | 5678 | 234 | 4.1% | 6.8 |

이게 = **우리 페이지가 어떤 SERP에서 몇 번째에 노출되는지**의 측정 데이터. SEO 작업 효과 검증의 객관 지표.

### 정리

SERP = "검색 결과 페이지". SEO 작업의 본질 = **"이 SERP에서 우리가 위로 올라가게"** 만드는 것. plan에 자주 나오는 단어.

---

## 도메인 · DNS · CNAME

### 한 줄 정의

도메인(`taystudios.com`) = 사람용 이름. IP(`185.199.108.153`) = 컴퓨터용 주소. **DNS가 그 사이를 변환**.

### 도메인 구조 — apex와 서브도메인

```
taystudios.com              ← apex (zone root, "@" 와 동일)
├── www.taystudios.com      ← 서브도메인
├── blog.taystudios.com     ← 서브도메인
├── mail.taystudios.com     ← 서브도메인
└── api.taystudios.com      ← 서브도메인
```

### 핵심 용어

| 용어 | 의미 | 예 |
|---|---|---|
| **apex** / root / naked / bare | zone 자체. 서브도메인 없는 형태 | `taystudios.com` |
| **subdomain** | apex 앞에 라벨 추가 | `www.taystudios.com` |
| **FQDN** (Fully Qualified Domain Name) | 끝에 `.`까지 붙인 절대 형태 | `taystudios.com.` |
| **TLD** (Top-Level Domain) | 가장 오른쪽 라벨 | `.com`, `.io`, `.kr` |
| **zone** | 한 nameserver가 권위 갖는 도메인 영역 | `taystudios.com` 전체 |
| **@ (at sign)** | DNS zone 파일에서 apex 자기 자신을 가리키는 약자. UI에서 `@` 입력 = 도메인 풀로 입력 | `@` = `taystudios.com` |

### DNS resolution — 브라우저가 IP를 알아내는 5단계

`https://taystudios.com` 주소창에 친 순간:

```
1. 브라우저  →  2. Resolver  →  3. Root NS  →  4. .com TLD NS  →  5. Cloudflare NS
   "IP 알려줘"     ISP/8.8.8.8     "전체 시작점"   "Cloudflare가      "185.199.108.153
                                                   알아"             등 4개"
```

실제로는 **Resolver가 캐시**를 가지고 있어 매번 root까지 안 감. 처음 한 번만 5단계 + 이후 TTL 동안 즉시 응답. 도메인 처음 사면 전 세계 resolver 캐시가 비어있어 5단계 다 도는 사람이 많음 → 이게 **"DNS 전파(propagation)"**.

### Record types — 자주 쓰는 7가지

| Type | 의미 | 예 |
|---|---|---|
| **A** | 도메인 → IPv4 직접 매핑 | `taystudios.com → 185.199.108.153` |
| **AAAA** | 도메인 → IPv6 매핑 | (GitHub Pages는 IPv6 미공식) |
| **CNAME** | 도메인 → 다른 도메인 (alias) | `www → taystudio.github.io` |
| **MX** | 메일 서버 지정 | `MX 10 mail.cloudflare.com` |
| **TXT** | 임의 텍스트 (도메인 검증·SPF·DKIM 등) | `google-site-verification=...` |
| **NS** | "이 zone의 nameserver는 여기" | `ns1.cloudflare.com` |
| **SOA** | zone의 권위 정보 (시리얼·refresh 등) | (자동 생성) |

### A vs CNAME — 핵심 차이

- **A** = 즉시 IP 반환. 한 도메인에 A 여러 개 = round-robin / anycast 부하 분산
- **CNAME** = "그 다른 도메인의 A를 다시 찾아라" = 한 단계 더 거침. 앞 도메인 IP가 바뀌어도 alias가 자동 따라감

### apex에 CNAME 못 씀 — RFC 1912

**apex**(`taystudios.com` 자체)에는 CNAME 사용 X. 다른 record들(SOA·NS·MX 등)과 충돌하기 때문. 그래서 GitHub Pages 권장 = **apex에 A 4개** + **www에 CNAME**.

(Cloudflare는 "CNAME flattening"으로 apex CNAME 흉내 가능. 단 GitHub Pages는 A 4개 공식 권장.)

### Host header — 같은 IP가 어떻게 수백만 사이트를 구별하나

GitHub Pages IP `185.199.108.153`는 **모든** GitHub Pages 사이트가 공유. 어떻게 어느 repo 응답할지 알까? → HTTP 요청에 붙는 `Host` 헤더로 분기.

```
GET / HTTP/2
Host: taystudios.com         ← GitHub이 이걸 보고 분기
```

GitHub 내부 매핑 = "Host == `taystudios.com` 이면 → CNAME 파일에 `taystudios.com` 적힌 repo 찾기 → 그 repo의 정적 파일 응답". 그래서 **repo 루트의 `CNAME` 파일이 결정적** — 단순 텍스트 1줄이 도메인 ↔ repo 연결의 유일한 선언.

### TTL · DNS 전파

- **TTL (Time To Live)** = DNS 응답에 붙는 "이 답을 N초 동안 캐시해도 됨" 메타. Cloudflare 기본 = Auto (보통 300초)
- **DNS 전파** = 새 record 등록·변경 후 전 세계 resolver 캐시가 비워질 때까지의 시간. **최악 24h, 평균 30분~수시간**
- 전파 진행 확인: `dig @1.1.1.1 taystudios.com` 또는 `@8.8.8.8`로 글로벌 resolver 직접 쿼리. 본인 ISP 캐시는 가장 늦게 갱신

### 헷갈리는 4 역할 분리

| 역할 | 하는 일 | 우리 경우 |
|---|---|---|
| **Registrar** | 도메인 소유권 등록·갱신 (ICANN 인증 업체) | Cloudflare Registrar |
| **Nameserver (NS)** | "이 도메인의 DNS 답은 어디서 받아라" 지정 | Cloudflare ns (자동) |
| **DNS host** | 실제 A·CNAME·MX 등 record 보관·응답 | Cloudflare DNS (자동) |
| **웹서버** | HTTP 요청 받아 컨텐츠 응답 | GitHub Pages |

Cloudflare Registrar에서 사면 위 3개가 자동 통합. 외부에서 사서 옮긴다면 Registrar에서 NS만 Cloudflare로 변경하면 DNS host도 Cloudflare가 됨. 4번째(웹서버)만 GitHub Pages에 위임.

### Cloudflare에서 record 추가 — 입력 필드 가이드

**A record 입력**:

| 필드 | 입력값 | 비고 |
|---|---|---|
| Type | `A` | |
| Name | `@` 또는 `taystudios.com` | apex 가리킬 때 — `@` 입력 시 자동 풀이 |
| IPv4 address | `185.199.108.153` 등 | GitHub IP 4개를 각각 4번 반복 등록 |
| Proxy status | DNS only (회색) | |
| TTL | Auto | |

**CNAME record 입력**:

| 필드 | 입력값 | 비고 |
|---|---|---|
| Type | `CNAME` | |
| Name | `www` | 서브도메인 부분만. zone(`taystudios.com`)은 자동으로 붙음 |
| Target | `taystudio.github.io` | 가리킬 도메인. 프로토콜·경로 X |
| Proxy status | DNS only (회색) | |
| TTL | Auto | |

**Name 필드 동작**:
- `www` 입력 → 자동으로 `www.taystudios.com`으로 풀어 인식
- `www.taystudios.com` 풀로 쳐도 동일 결과
- `@` = apex (단 CNAME 타입에는 X — RFC 1912)

**Target 필드 동작**:
- 도메인만 입력 — `taystudio.github.io`
- ❌ `https://taystudio.github.io` (프로토콜 포함 X)
- ❌ `taystudio.github.io/` (슬래시·경로 X)
- 끝에 점(`.`) 붙여도 안 붙여도 OK — Cloudflare 자동 정규화

**흔한 실수**:

| 잘못 | 왜 X |
|---|---|
| Name = `www.www` | zone이 또 붙어 `www.www.taystudios.com` 됨 |
| Name = `@` + Type CNAME | apex CNAME 금지 (RFC 1912) |
| Target = `https://...` | 프로토콜 포함 X |
| Target = `185.199.108.153` | IP 주소는 CNAME 아닌 A record |

### Cloudflare Proxy 모드 — 회색(DNS only) vs 주황(Proxied)

각 record의 "Proxy status" 컬럼 토글로 선택:

```
☁️ 회색 (DNS only) — Cloudflare는 IP 알려주고 빠짐
🧡 주황 (Proxied)  — 모든 트래픽이 Cloudflare 경유
```

**트래픽 흐름 차이**:

```
[ DNS only — 회색 ]
사용자 ─────────────────────────────→ GitHub Pages (185.199.x.x)
       ↑ Cloudflare DNS는 첫 응답만 해주고 빠짐


[ Proxied — 주황 ]
사용자 → Cloudflare CDN/WAF → GitHub Pages (185.199.x.x)
        모든 요청 중계 + 캐싱·DDoS·WAF·bot 차단
```

**두 모드 비교**:

| 항목 | DNS only (회색) | Proxied (주황) |
|---|---|---|
| Cloudflare 역할 | 이름→IP 번역만 | 모든 트래픽 중계 |
| 사용자가 보는 IP | GitHub의 IP | Cloudflare의 IP |
| CDN 캐싱 | ❌ | ✅ |
| DDoS 방어 | ❌ (GitHub 자체만) | ✅ |
| WAF·bot 차단 | ❌ | ✅ |
| SSL cert | GitHub Let's Encrypt | Cloudflare 자체 cert |
| 설정 복잡도 | 단순 | SSL 모드 · 캐시 룰 신경 필요 |
| GitHub Pages 호환 | 충돌 없음 | SSL 모드 = **Full** 필수 (Flexible 절대 X) |

**회색(DNS only)으로 시작한 이유** — 4가지:

1. **SSL cert 충돌 회피** — GitHub Pages가 자체 Let's Encrypt 발급·갱신. Proxied면 Cloudflare cert와 병존, 디버깅 복잡
2. **Redirect loop 함정 회피** — Proxied + SSL 모드 `Flexible`이면 즉시 `ERR_TOO_MANY_REDIRECTS`. `Full` 강제 필요
3. **현 시점 이득 미미** — 월 트래픽 작고 DDoS 위협 X. CDN 캐싱·WAF 체감 0
4. **Migration 변수 최소화** — DNS 전파 + cert 발급 검증 단계에 proxy 변수까지 끼면 문제 원인 분리 어려움

**주황(Proxied) 전환 시점**:
- 월 방문 5,000+ 도달
- DDoS 공격 감지
- 클론·악성 봇 트래픽 증가
- 글로벌 사용자 비중 커서 CDN 캐싱 이득 큼

전환 시 체크: SSL/TLS 모드 = **Full** (Flexible 절대 X), Always Use HTTPS ON, GitHub Pages "Enforce HTTPS" 정상 작동 재확인.

### SEO와의 관계

- **도메인 자체가 권위 시그널** — `.github.io`는 Public Suffix List 등재로 서브도메인 취급, 도메인 권위 0부터 시작. 자체 도메인은 누적 가능
- **canonical**·**og:url**·**JSON-LD url** 모두 도메인 변경 시 일괄 갱신 필요 — `concept-domain-migration.html` 참조
- **이메일 발신 신뢰** — SPF·DKIM·DMARC TXT record가 도메인 평판에 직결 (향후 contact 채널 확장 시)

### 사이트 적용 (2026-05-09 진행 중)

- 도메인 = `taystudios.com` (Cloudflare Registrar 등록)
- DNS = Cloudflare DNS (회색 구름, DNS only)
- apex A record × 4 = GitHub Pages anycast IP (185.199.108.153 / .109 / .110 / .111)
- www CNAME = `taystudio.github.io`
- 절차 상세 = `history/seo/concept-domain-migration.html`

---

## (앞으로 추가 — 빈 슬롯)

다음 개념이 등장하면 여기에 누적 추가:

- **canonical** — 미러·중복 페이지가 있을 때 "원본은 이 URL"이라고 알려주는 메타. 도용 자동 방어 핵심
- **JSON-LD** — 구조화 데이터. WebApplication·FAQPage·BreadcrumbList·Organization·HowTo 등
- **OG (Open Graph)** — SNS 미리보기 메타. 카톡·페이스북·X·디스코드. `2026-05-05-og-image-rollout.md` 참조
- **E-E-A-T** — Experience·Expertise·Authoritativeness·Trustworthiness, Google 콘텐츠 품질 평가 기준
- **Rich results / Featured snippet / PAA / Knowledge Panel** — SERP 특수 노출 영역들
- **robots.txt / sitemap.xml** — 크롤러에게 알려주는 메타 파일
- **Naver vs Google SERP 차이** — 한국 검색 채널 분리. 네이버 서치어드바이저 별도 등록 필요
- **TWA (Trusted Web Activity)** — PWA를 안드로이드 앱으로 포장 (PWA 작업 시 등장)
- **PWA (Progressive Web App)** — 웹사이트를 앱처럼 설치·실행 (manifest + Service Worker)

---

## 관련 문서

- `history/seo/strategy.md` — SEO 전략·체크리스트·우선순위
- `history/seo/2026-05-05-og-image-rollout.md` — OG 이미지 일괄 적용 기록
- `history/seo/2026-05-05-og-meta-followup.md` — OG 메타 보강 후속 정리
- `history/seo/concept-indexnow.html` — IndexNow 프로토콜 개념 (push 모델·key 검증·hub & spoke)
- `history/seo/concept-domain-migration.html` — 도메인 migration 절차 (`taystudio.github.io` → `taystudios.com`)
- `plan.md` §7.3 (SEO 정책) · §9.4 (SEO Tier 작업)
