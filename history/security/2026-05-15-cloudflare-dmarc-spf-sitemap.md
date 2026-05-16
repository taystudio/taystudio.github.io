# 2026-05-15 보안 작업 — Sitemap·DMARC·SPF·Cloudflare Proxy

## 컨텍스트

GSC(Google Search Console)에서 sitemap.xml "허용되지 않는 XML 네임스페이스 접두어" 오류 발견 → 추적하다 Cloudflare 보안 인사이트 7건(Moderate 2 + Low 5)까지 확장 점검. 도메인 평판·검색 색인·인프라 보안 3개 layer를 한 사이클로 정리.

---

## 1. Sitemap.xml — XML 네임스페이스 + hreflang 양방향성

### 1.1 namespace prefix 선언 누락 (commit `05494ab`)

**증상**: GSC Sitemaps → `/sitemap.xml` "사이트맵을 읽을 수 있지만 오류가 있습니다 / 허용되지 않는 XML 네임스페이스 접두어" + **발견된 페이지 0** 처리.

**원인**: 본문에 `<xhtml:link rel="alternate" hreflang="...">` 5개 사용하는데 `<urlset>`에 `xmlns:xhtml` 선언 없음. 파서가 prefix 인식 못 함 → sitemap 통째 무효 처리.

**수정**:
```diff
- <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
+ <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
+         xmlns:xhtml="http://www.w3.org/1999/xhtml">
```

### 1.2 hreflang 양방향성 위배 (commit `4de646b`)

**증상**: 두 에이전트 검증 중 발견. `/sitemap/` 블록엔 ko·en·x-default 3개, `/en/sitemap/` 블록엔 ko·en 2개 → Google hreflang reciprocal 원칙 위배.

**수정**: `/en/sitemap/` 블록에 x-default 1줄 추가.

### 1.3 보류된 큰 작업

홈(`/` ↔ `/en/`)·도구 허브(`/tools/` ↔ `/en/tools/`)·`/text/`·`/image/`·`/pdf/`·`/video/` 등 60+ 다국어 페이지 쌍에 sitemap hreflang annotation 전무. GSC "크롤링됨 - 색인 생성 안 됨"의 후보 원인 중 하나. 즉시 적용보다는 ko/en 페어 매핑 정리 후 별도 진행 권장.

### 1.4 검증

- 로컬 `xmllint --noout sitemap.xml` 통과
- 서버 `curl https://taystudios.com/sitemap.xml` HTTP 200, xmlns:xhtml 정상, x-default 카운트 2 (양방향)
- 다음: GSC → Sitemaps → 삭제 후 재제출

---

## 2. Cloudflare 보안 인사이트 7건 결정

### Severity 별

| # | 항목 | severity | 결정 | 사유 |
|---|---|---|---|---|
| 1 | DMARC Record Error (3건) | Low (실제 임팩트 ↑) | ⚡ **즉시 처리** | 도메인 평판 보호. 메일 안 보내도 사칭당하면 Gmail spam 학습 |
| 2 | Block AI bots not enabled | Moderate | **OFF 유지** | AI 답변(ChatGPT·Perplexity·Claude) 노출 의도 |
| 3 | Security.txt not configured | Low | ✅ **이미 OK** | 직전 commit `da75955` 에서 추가됨. HTTP 200 응답 확인. Cloudflare 스캔 지연 |
| 4 | Bot Fight Mode not enabled | Moderate | **OFF 유지** | "접근 허용" 방향과 일관. false positive 회피. WAF·DDoS·BIC로 대체 |
| 5 | AI Labyrinth not enabled | Low | **OFF 유지** | #2와 묶음 |

### 핵심 결정 원칙

> "최대한 보안에만 문제없으면 접근은 가능하게 하자" — 사용자 명시

→ AI scraper·일반 봇은 차단하지 않고 검색·답변 노출 통로 유지. 보안은 WAF·DDoS·DMARC·SSL strict로 챙김.

---

## 3. DMARC + SPF DNS 셋업

### 3.1 추가된 레코드

**DMARC** (`_dmarc.taystudios.com` TXT):
```
v=DMARC1; p=reject; rua=mailto:taero991@gmail.com;
```
- `p=reject`: SPF/DKIM 실패한 메일 즉시 거부
- `rua`: aggregate report 수신처 (24~48h 후 매일 1회 XML 첨부 메일)

### 3.2 SPF 중복 정리

**발견**: Cloudflare 알림 "Remove all but one SPF record". root TXT에 SPF 2개 존재.
- `v=spf1 -all` ← 본인이 신규 추가
- `v=spf1 include:_spf.mx.cloudflare.net ~all` ← Cloudflare Email Routing이 자동 추가 (도메인 메일 `feedback@taystudios.com` 운영 중)

**원리**: RFC 7208상 SPF는 도메인당 1개만 허용. 둘 이상이면 invalid 처리 → 인증 효과 0.

**결정**: 본인 추가분 `v=spf1 -all` 삭제, Cloudflare 자동분 유지.
- 단점이라 할 만한 게 `~all`(soft fail) vs `-all`(hard fail) 차이 — 하지만 DMARC `p=reject;` 정책과 결합하면 결과적으로 hard fail과 동일하게 처리됨. 보안 충분.

### 3.3 작업 중 부작용

SPF 정리 중 `_dmarc` TXT도 같이 삭제됨 (의도치 않음). 권위 NS(1.1.1.1) 직접 쿼리로 발견 → DMARC 다시 추가.

### 3.4 최종 검증

```bash
dig @1.1.1.1 taystudios.com TXT +short
# "v=spf1 include:_spf.mx.cloudflare.net ~all"   (1개)

dig @1.1.1.1 _dmarc.taystudios.com TXT +short
# "v=DMARC1; p=reject; rua=mailto:taero991@gmail.com;"
```

---

## 4. Cloudflare Proxy 활성화

### 4.1 변경

**이전**: A 레코드들 `DNS only` (회색 구름) — Cloudflare는 DNS만 담당, 트래픽은 직접 GitHub Pages로.

**이후**: `Proxied` (주황 구름) — 모든 트래픽이 Cloudflare edge 거침.

### 4.2 SSL 모드 요구사항

GitHub Pages는 자체 Let's Encrypt 인증서로 HTTPS만 받음 → Cloudflare SSL/TLS 모드가 **Full (strict)** 여야 함.

| Cloudflare SSL 모드 | GitHub Pages 동작 |
|---|---|
| Flexible | ❌ Redirect loop (CF↔GH 구간 HTTP인데 GH가 HTTPS 강제) |
| Full | ✅ 양쪽 HTTPS. 인증서 검증 X |
| **Full (strict)** | ✅ 양쪽 HTTPS + 인증서 검증. 가장 안전. **선택** |

### 4.3 검증

```bash
curl -sI https://taystudios.com/ | grep -iE "server|cf-ray"
# server: cloudflare
# cf-ray: 9fc16c046e54502d-LAX        (LA edge 서빙)

dig +short taystudios.com A
# 104.21.80.251, 172.67.136.87        (Cloudflare IP, GH Pages IP 은닉됨)

curl -sI http://taystudios.com/
# HTTP/1.1 301 Moved Permanently → https://...   (HTTPS 강제)
```

### 4.4 효과

- WAF (OWASP 룰 자동 적용 — SQL injection·XSS 차단)
- DDoS 보호 자동
- CDN 캐싱 → 한국 사용자 latency 감소 가능
- origin IP 은닉 (185.199.x.x GitHub Pages IP 외부 노출 X)
- Cloudflare Analytics
- 보안 인사이트 정확도 향상

---

## 5. full-test skill 갱신

`.claude/skills/full-test/SKILL.md` 세 군데 추가 — 다음 풀 테스트 회차에 sitemap.xml 자동 점검 포함.

- **§B Meta page 매트릭스**: `Sitemap.xml` 행 신규
- **§C-16 신규 카테고리**: Sitemap.xml 검증 (xmlns·hreflang·lastmod·changefreq·priority·중복·xmllint·live curl·GSC 점검 절차)
- **§F-1 Critical 패턴**: 2건 추가
  - xmlns prefix 선언 누락
  - hreflang 양방향성 위배

---

## 6. 후속 모니터링

### 즉시
- GSC → Sitemaps → `/sitemap.xml` 삭제 → 재제출 → 수 분 후 "발견된 페이지" 카운트 0이 아닌 ~70개로 바뀌는지
- Cloudflare 인사이트 5건 dismiss (DMARC 자동 해소, 나머지는 본인 결정대로)

### 24~48h 후
- `taero991@gmail.com` 받은편지함 — DMARC aggregate report 메일 도착 (XML/XML.gz 첨부)
- 핵심 확인: `source_ip` + `spf: fail` + 높은 `count` → 사칭 시도

### 별 작업으로 분리
- 큰 hreflang 작업 (60+ 다국어 페이지 ko/en/x-default annotation)
- AI bot 차단 정책 재검토 (트래픽 패턴 6개월 후)

---

## 변경 파일

- `sitemap.xml` (commit `05494ab` + `4de646b`)
- `.claude/skills/full-test/SKILL.md` (§B, §C-16, §F-1)
- Cloudflare DNS (repo 미반영, 대시보드에만 존재):
  - `_dmarc` TXT 신규
  - root `taystudios.com` TXT (SPF) 1개로 정리
  - A 레코드들 Proxied 전환
  - SSL/TLS → Full (strict)
