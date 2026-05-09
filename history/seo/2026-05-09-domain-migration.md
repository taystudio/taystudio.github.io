# 도메인 Migration — taystudio.github.io → taystudios.com (2026-05-09)

> Cloudflare Registrar에서 `taystudios.com` 등록 + GitHub Pages custom domain 연결 + 사이트 전반의 canonical·OG·JSON-LD·sitemap·IndexNow·Service Worker를 새 도메인으로 일괄 전환. **이 시점부터 history는 새 도메인(`taystudios.com`) 기준으로 작성한다.** 이전 history entry의 `taystudio.github.io` 표기는 **시점 기록의 정합성 보존을 위해 그대로 둔다** — 갱신 시 당시 사실관계가 흐려진다.

## 결정 배경

- `.github.io` 서브도메인은 brand 권위 한계 — 영문 시장 진입(§9.4-10)·AdSense 단가·SNS 공유 인상에서 모두 1급 도메인 대비 약함
- `.com` apex 확보로 한·영 양쪽 진입 시 동일 권위 기반 사용 가능
- Cloudflare Registrar = 도매가(연 $9.77 USD) + 무료 nameserver + DDoS·WAF 무료. 등록자 마진 0 정책이라 갱신가도 동일
- GitHub Pages는 custom domain 설정 시 옛 `.github.io` URL을 새 도메인으로 **자동 301 redirect** — 백링크·검색결과·북마크가 자연 이전됨

## 구현 결정

| 항목 | 채택 | 이유 |
|---|---|---|
| **registrar** | Cloudflare Registrar | 도매가 갱신, 익명·privacy 기본, nameserver 동일 vendor로 DNS 통합 |
| **DNS** | Cloudflare DNS A record × 4 (185.199.108-111.153) + AAAA × 4 + CNAME `www` | apex는 GitHub Pages 공식 IP 4개, www은 `<user>.github.io` CNAME |
| **CNAME 파일** | repo root `CNAME` 한 줄 (`taystudios.com`) | GitHub Pages가 인식하는 형식 |
| **canonical** | `https://taystudios.com/...` 단일 형태 | hreflang·OG·JSON-LD 모두 동일 호스트로 일치 |
| **옛 도메인 정책** | 의도적 deindex X — GitHub Pages 자동 301로 자연 이전 | 1~3개월 자연 deindex가 SEO 권위 손실 최소 |
| **`common/site-chrome.js` ALLOWED** | 옛 도메인 라인 유지 (`taystudio.github.io`) | 전환기 6개월~1년 옛 URL GET 시 false positive 미러 경고 방지 |
| **{key}.txt** | 위치 그대로 (repo root) | GitHub Pages가 새 도메인에서도 자동 노출 → IndexNow 검증 자동 통과 |
| **commit 단위** | Tier A(60+ HTML) + Tier B(robots·scripts·운영 문서) + 신규 문서 = 단일 commit | 부분 적용 시 검색엔진·canonical 불일치 위험 |
| **history/ 보존** | 옛 도메인 표기 그대로 + 본 entry로 시점 분기 명시 | 시점 기록의 정합성 vs 일괄 갱신의 트레이드오프에서 정합성 우선 |
| **SW v12 → v13** | 캐시 강제 무효화 | 기존 사용자가 옛 도메인 응답을 캐시한 상태에서 redirect 루프·혼합 응답 방지 |

## 작업 결과물

| 파일군 | 종류 | 처리 | 역할 |
|---|---|---|---|
| 60+ HTML files (`tools/`·`text/`·`image/`·`pdf/`·`video/`·`privacy/`·`terms/`·root) | 일괄 | sed `s\|taystudio.github.io\|taystudios.com\|g` | canonical · OG · JSON-LD 호스트 갱신 |
| `robots.txt` | 갱신 | sed | Sitemap + IndexNow key location |
| `sitemap.xml` | rebuild | `bash scripts/build-sitemap.sh` | 67 URL 새 호스트로 재생성 + IndexNow ping 자동 |
| `scripts/build-sitemap.sh` | 갱신 | sed | DOMAIN 변수 |
| `scripts/indexnow-ping.sh` | 갱신 | sed | DOMAIN · HOST 변수 |
| `common/site-chrome.js` | 수동 | Edit | mirrorWarn(ko/en) URL+텍스트 갱신, ALLOWED는 옛 도메인 보존 |
| `sw.js` | 수동 | Edit | `taystudio-v12` → `taystudio-v13` 캐시 bust |
| `INDEXING_CHECKLIST.md`, `README.md`, `tools/HANDOFF.md`, `tools/README.md`, `tools/SEO_SETUP.md`, `tools/ADSENSE_SETUP.md`, `adsense/APPROVAL.md`, `plan.md` | 갱신 | sed | 운영 가이드 호스트 표기 |
| `history/migration/index.html` | 신규 | Write | 진행 상태 dashboard (noindex, 운영자 전용) |
| `history/seo/concept-domain-migration.html` | 신규 | Write | 도메인·DNS·CNAME·redirect 개념 정리 (이미 영어 분기 stash 안에 보존, Step 10에서 새 도메인 기준으로 갱신) |
| `history/seo/2026-05-09-domain-migration.md` | 신규 | Write | 본 entry — 시점 분기 명시 |

## 시점 분기 — history 작성 룰

- **2026-05-08 이전 entry**: `taystudio.github.io` 표기 그대로. **갱신 X**.
- **2026-05-09 이후 entry**: `taystudios.com` 기준으로 작성. 옛 도메인 언급은 "이전 호스팅(2026-05-09 migration 이전)" 맥락에서만.
- **SEO 개념 문서(`concepts.md`·`strategy.md`)**: 일반 개념은 호스트 무관이라 갱신 X. URL 예시가 들어간 부분은 다음 갱신 시 새 도메인으로.

## 검증

| 단계 | 결과 |
|---|---|
| `grep -rln 'taystudio\.github\.io'` (Tier A·B 범위) | 0건 |
| `grep -c '<loc>https://taystudios\.com' sitemap.xml` | 67 |
| `curl -I` 새 도메인 핵심 path 9곳 | 모두 200 |
| `curl https://taystudios.com/{key}.txt` | key 본문 일치 |
| `curl -I https://taystudio.github.io/` | 301 → 새 도메인 |
| Service Worker | v12 캐시 폐기, v13 활성 |

## 후속 작업 (검색엔진 4채널 재등록)

1. **Google Search Console** — Domain property `taystudios.com` 추가 → DNS TXT 검증 → Change of Address(옛 → 새) → sitemap 제출 → URL Inspection 핵심 5건 Request Indexing
2. **Naver Search Advisor** — 사이트 추가 → meta 태그 발급·삽입·검증 → sitemap 제출 → 웹페이지 수집 5~10건
3. **Bing Webmaster Tools** — 사이트 추가 → msvalidate.01 신규 발급·삽입·검증 → Site Moves(옛 → 새) → sitemap 제출
4. **카카오 OG 캐시 flush** — `developers.kakao.com/tool/clear/og` 에서 루트·5 카테고리 hub·인기 도구 5건 flush

옛 도메인 property·sitemap은 **유지** (자연 deindex 1~3개월).

## 트레이드오프 / 위험

- **권위 이전 손실**: 301 redirect로 PageRank 99% 이상 전달되지만 일시적 SERP 등락은 정상. 1~3개월 단위로 회복.
- **이중 도메인 운영 비용**: ALLOWED 옛 도메인 유지 + GitHub Pages 자동 redirect로 사용자 영향 0. 단 `common/site-chrome.js` 다음 정리 시점에 옛 도메인 라인 제거 결정 필요(목표 = 2026-11~2027-05).
- **백링크 추적 어려움**: 옛 도메인 백링크는 redirect 통계로만 가시화. Cloudflare Analytics + Search Console "이전 → 새" property 비교로 대체.
