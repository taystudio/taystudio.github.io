# 2026-05-09 — 도메인 migration 라이브 검증 체크리스트

> **Context** = §9.5 도메인 migration commit/push 완료 후, Search Console·IndexNow·Naver Search Advisor·AdSense 4채널 등록 진입 직전. 등록 전 라이브 사이트(`https://taystudios.com/`) 직접 응답을 확인해 신규 도메인 시그널이 SEO 봇·검색 콘솔이 보는 그대로 정확히 박혀 있는지 검증.

> **수행** = 2026-05-09 / **방법** = curl 직접 호출 (WebFetch는 head 메타 stripping). 7개 핵심 path × 14 항목.

---

## 결과 요약

- ✅ **검색엔진 4채널 등록 ready** — 신규 도메인 시그널 13/14 정상
- ⚠️ **HTTP→HTTPS 강제 누락 1건** — 등록 전 fix 권장 (GitHub Pages "Enforce HTTPS" 또는 Cloudflare "Always Use HTTPS")

---

## 통과 항목 (13/14)

| # | 항목 | 응답 | 비고 |
|---|---|---|---|
| 1 | `https://taystudios.com/` HTTP 200 | ✓ | `server: GitHub.com` |
| 2 | Root canonical · og:url · og:image · twitter:image | ✓ | 전부 신규 도메인 |
| 3 | 사이트 검증 meta 3종 (Google · Naver · Bing msvalidate.01) | ✓ | head에 모두 존재 |
| 4 | `sitemap.xml` 67 URL, 옛 도메인 잔존 | ✓ | 0건 |
| 5 | `robots.txt` Sitemap 줄 | ✓ | `https://taystudios.com/sitemap.xml` |
| 6 | IndexNow key 파일 (`/b762f70e61da4ac199b51566e31748b3.txt`) | ✓ | HTTP 200 + body 일치 |
| 7 | 5 카테고리 hub canonical (`/tools/`·`/text/`·`/image/`·`/pdf/`·`/video/`) | ✓ | 5/5 200 + 신규 도메인 |
| 8 | `/privacy/`·`/terms/` canonical | ✓ | 2/2 200 + 신규 |
| 9 | `og-image.png` · `og-image.svg` + SVG 내부 도메인 텍스트 | ✓ | 200 + `taystudios.com` |
| 10 | `manifest.webmanifest` · `favicon.ico` · `sw.js` | ✓ | 200 |
| 11 | JSON-LD `Organization.url` · `WebSite.hasPart.url` · `BreadcrumbList.item` | ✓ | 모두 신규 도메인 |
| 12 | 7개 핵심 페이지 옛 도메인 잔존 (`/`·`/tools/salary/`·`/image/compress/`·`/pdf/pdf-merge/`·`/video/compress/`·`/privacy/`·`/terms/`) | ✓ | 0건 |
| 13 | 옛 도메인 redirect (`https://taystudio.github.io/` → `taystudios.com`) | ✓ | 301 (GitHub Pages 자동) |
| 14 | `www.taystudios.com` → apex | ✓ | 301 → `https://taystudios.com/` |

## 미통과 항목 (1/14)

### ⚠️ HTTP 강제 HTTPS redirect 누락

**관측**:

```
$ curl -sSI http://taystudios.com/ | head -2
HTTP/1.1 200 OK
Server: GitHub.com
```

`http://` 직접 호출이 HTTPS로 redirect 안 되고 그대로 HTTP 200 응답.

**근본 원인** = GitHub Pages "Enforce HTTPS" 옵션이 OFF (또는 Cloudflare 강제 HTTPS 미설정). HSTS 헤더(`Strict-Transport-Security`)도 없음 — HSTS preload list 미등록.

**SEO 영향**:
- 검색 봇이 `http://` URL을 발견해 인덱싱하면 HTTPS 버전과 duplicate 처리될 수 있음
- HTTPS canonical은 head에 박혀 있으므로 Google·Naver·Bing은 보통 HTTPS 우선 자동 처리 — 단 보장 X
- AdSense 정책상 HTTPS-only 권장, 보안 시그널 약화 미세

**해결 옵션 (둘 중 하나)**:

1. **GitHub Pages 설정 (가장 간단)** — Settings → Pages → **"Enforce HTTPS" 체크박스 ON**. custom domain SSL 인증서 이미 발급된 상태(HTTPS 200 정상 동작)이므로 즉시 활성화 가능
2. **Cloudflare proxy ON** (orange cloud) + SSL/TLS = "Full (strict)" + "Always Use HTTPS" 활성화. HSTS 자동 부여·CDN 캐시·DDoS 보호 보너스

---

## 검증 명령 (재현용)

```bash
# 1. 핵심 path HTTP/canonical/og
curl -sSI https://taystudios.com/ | head -10
curl -sS https://taystudios.com/ | grep -E '(canonical|og:url|og:image|twitter:image|msvalidate|naver-site|google-site)'

# 2. sitemap·robots·IndexNow key
curl -sS https://taystudios.com/sitemap.xml | grep -c '<loc>'                  # 기대 67
curl -sS https://taystudios.com/sitemap.xml | grep -c 'taystudio.github.io'    # 기대 0
curl -sS https://taystudios.com/robots.txt
curl -sSI https://taystudios.com/b762f70e61da4ac199b51566e31748b3.txt
curl -sS  https://taystudios.com/b762f70e61da4ac199b51566e31748b3.txt          # 기대 = key 본문

# 3. 5 카테고리 hub + privacy/terms
for cat in tools text image pdf video privacy terms; do
  url="https://taystudios.com/${cat}/"
  http=$(curl -sSI -o /dev/null -w '%{http_code}' "$url")
  canon=$(curl -sS "$url" | grep -oE '<link rel="canonical"[^>]*' | head -1)
  echo "${cat}/ HTTP ${http} | ${canon}"
done

# 4. 옛 도메인 잔존 핵심 page
for path in / /tools/salary/ /image/compress/ /pdf/pdf-merge/ /video/compress/ /privacy/ /terms/; do
  count=$(curl -sS "https://taystudios.com${path}" | grep -c 'taystudio.github.io')
  echo "${path}: ${count}건"
done

# 5. 옛 도메인·www redirect
curl -sSI https://taystudio.github.io/        # 기대 301 → taystudios.com
curl -sSI https://www.taystudios.com/         # 기대 301 → https://taystudios.com/

# 6. HTTP → HTTPS 강제 (현재 fail)
curl -sSI http://taystudios.com/ | head -2    # 기대 301 → https / 실측 200 OK
curl -sSI https://taystudios.com/ | grep -i 'strict-transport'   # 기대 HSTS / 실측 없음
```

---

## 다음 단계

1. **HTTP→HTTPS 강제 fix** (사용자 액션) — GitHub Pages "Enforce HTTPS" 체크 또는 Cloudflare proxy ON
2. **재검증** — `curl -sSI http://taystudios.com/ | head -2` 가 `301` 또는 `308` 응답하는지 확인
3. **검색엔진 4채널 등록** — §9.5.5 표 참고 (Google SC · Naver SA · Bing WMT · 카카오 OG flush)
4. **IndexNow ping** — `bash scripts/build-sitemap.sh` (push 이미 완료, 즉시 가능)
5. **AdSense** — 신규 도메인 사이트 추가/수정 + `ads.txt` 응답 확인

---

## 관련 문서

- `plan.md` §9.5 — 도메인 migration 진행 상태
- `plan.md` §9.5.5 — 검색엔진 4채널 등록 표
- `plan.md` §9.5.7 — 도메인 단일 관리 인프라 (config.sh + migrate-domain.sh + verify-domain.sh)
- `history/seo/2026-05-09-domain-migration.md` — 시점 분기 entry
- `history/migration/index.html` — migration 진행 dashboard
