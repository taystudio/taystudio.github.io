# privacy·terms root 이전 — SEO 위치 정합성 (2026-05-06)

> 사용자가 footer의 정책 페이지 위치를 SEO 관점에서 검토 요청. `/tools/privacy/`·`/tools/terms/`가 의미상 부조화라는 분석 + AdSense·표준 관행 + 카테고리 권한 분산 이유로 root 직속 이전 결정 후 실행. 도구 수·카테고리 변동 0, sitemap URL 수 그대로 66.

## 동기 — 왜 root로 옮겼나

| 관점 | 기존 `/tools/privacy/`·`/tools/terms/` 문제 | 신규 `/privacy/`·`/terms/` 개선 |
|---|---|---|
| URL 의미 | `/tools/`는 "계산기" 카테고리, 정책은 사이트 전체용 → 부조화 | 정책은 root 직속이 자연스러움 |
| AdSense·표준 관행 | 주요 사이트 100% root 직속(`/privacy`·`/terms`) | 표준 패턴 일치 |
| 카테고리 권한 분산 | `/tools/` 카테고리 backlink·권한이 정책 페이지로 새는 미세 손실 | 정책은 별도 root branch — 카테고리 권한 보존 |
| breadcrumb·동선 | "도구 → 개인정보처리방침" 어색, footer→정책 흐름에 `/tools/` 노출 직관 어긋남 | "TAYSTUDIO → 개인정보처리방침" 자연스러움 |

**단 SEO 직접 영향은 작음** — 정책 페이지는 검색 트래픽 거의 0(검색 의도 없음, footer link만 도달), 사이트 신뢰 시그널은 존재 자체가 핵심. 그래도 "지금부터 깔끔하게" 정리할 가치 있다는 판단으로 진행.

**불선택 옵션** = ① 그대로 유지(작업 0, SEO 0 — 단 의미 부조화 누적) ② `/legal/privacy/`·`/legal/terms/` sub-path(작업량 비슷한데 root 직속이 더 표준 → 굳이 sub-path 만들 이유 없음).

## 변경 파일

| 파일 | 변경 |
|---|---|
| `privacy/index.html` | 신규 (이전 본문 그대로 복사) |
| `terms/index.html` | 신규 (이전 본문 그대로 복사) |
| `tools/privacy/index.html` | 본문 → redirect stub로 덮어쓰기 |
| `tools/terms/index.html` | 본문 → redirect stub로 덮어쓰기 |
| `common/site-chrome.js` | footer 2 link + banner "자세히" link + isToolsPage 주석 |
| `scripts/build-sitemap.sh` | `ROOT_PAGES` 배열 + walk 블록 |
| `sitemap.xml` | 재생성 (자동) |
| `sw.js` | `CACHE_VERSION` v4 → v5 (이전 isToolsPage 수정 시점에 이미 bump) |
| `plan.md` | 헤더 + 9.1 결정됨 섹션 갱신 |

## 신규 위치 메타 — 4 정합성

| 항목 | `/privacy/index.html` | `/terms/index.html` |
|---|---|---|
| `<meta property="og:url">` | `https://taystudio.github.io/privacy/` | `https://taystudio.github.io/terms/` |
| `<link rel="canonical">` | `https://taystudio.github.io/privacy/` | `https://taystudio.github.io/terms/` |
| `<div class="breadcrumb">` | `<a href="/">TAYSTUDIO</a> · 개인정보처리방침` | `<a href="/">TAYSTUDIO</a> · 이용약관` |
| related-nav 첫 link (`../index.html` → ?) | `/tools/` 절대경로 | `/tools/` 절대경로 |

**왜 breadcrumb를 "도구"가 아니라 "TAYSTUDIO"로 바꿨나** = 정책은 도구 하위 아니라 사이트 전체 정책. 이전 위치에선 `<a href="../index.html">도구</a>`라 자연스러웠으나, root로 옮긴 이상 부모는 사이트 자체.

**왜 related-nav를 절대경로로 바꿨나** = root에서 `../index.html`은 상위 디렉토리가 없어 깨진 경로. `/tools/` 절대경로로 명시.

## 옛 위치 stub — soft refresh 4계층 안전망

GitHub Pages는 301 redirect 헤더 불가 → 4계층 안전망으로 우회. 이전 PDF 카테고리 분리·image→pdf 이전 작업과 동일 패턴 재사용.

```html
<link rel="canonical" href="https://taystudio.github.io/privacy/">
<meta http-equiv="refresh" content="0; url=/privacy/">
<meta name="robots" content="noindex">
<script>location.replace('/privacy/');</script>
```

| 계층 | 역할 |
|---|---|
| `<link rel="canonical">` | Google에 신규 URL이 정본임을 시그널 → equity 일부 이전 |
| `<meta http-equiv="refresh">` | JS 비활성 환경에서 0초 후 redirect |
| `<meta name="robots" content="noindex">` | sitemap·검색 결과에서 점진 제거 (수개월 뒤 자연 deindex) |
| `<script>location.replace>` | JS 활성 환경에서 즉시 redirect (history에 안 남음) |

본문 = 안내 문구 1단락("이 페이지는 새 위치 ... 로 자동 이동합니다. 북마크·링크는 새 주소로 갱신해주세요.").

## site-chrome.js 일괄 갱신

| 위치 | 변경 |
|---|---|
| `<site-footer>` 개인정보처리방침 link | `${BASE}/tools/privacy/` → `${BASE}/privacy/` |
| `<site-footer>` 이용약관 link | `${BASE}/tools/terms/` → `${BASE}/terms/` |
| `<site-header>` banner "자세히" link | `${BASE}/tools/terms/` → `${BASE}/terms/` |
| `isToolsPage()` 주석 | "이전된 stub" 명시로 갱신 |
| `isToolsPage()` 정규식 `/\/tools\/(privacy|terms|404)\b/` | **유지** — stub은 즉시 redirect되지만 JS-blocked 환경 안전망 |

footer는 60+ 도구 페이지 모두 `<site-footer>` Web Component로 렌더링되므로 site-chrome.js 한 곳만 고치면 사이트 전체 일괄 반영.

## build-sitemap.sh — root walk 추가

기존 walk는 카테고리(`tools/text/image/pdf/video`) 하위만 순회 → root 직속 단일 페이지(`/privacy/`·`/terms/`)는 자동 픽업 X. 명시 등록 필요.

```bash
# 루트 직속 단일 페이지 — privacy·terms 같이 카테고리 아닌 정책 페이지. AdSense·표준 관행상 root 위치.
ROOT_PAGES=("privacy" "terms")
```

walk 블록 = Root index 처리 직후 + 카테고리 walk 전:

```bash
for slug in "${ROOT_PAGES[@]}"; do
  file="${slug}/index.html"
  [ -f "$file" ] || continue
  is_noindex "$file" && continue
  URL=$(canonical_of "$file" "${DOMAIN}/${slug}/")
  emit_url "$URL" "$(last_mod "$file")"
done
```

`classify()`의 `*"/privacy/"*`·`*"/terms/"*` 분기는 path-agnostic이라 root든 tools든 자동 매칭 — 손댈 필요 없음.

## sitemap 재생성 — 66 URL

```
✓ sitemap.xml generated at /Users/thlee/Desktop/gitRepo/studio/sitemap.xml
  URL count: 66
```

| 검증 | 결과 |
|---|---|
| `/privacy/`·`/terms/` 등재 | ✓ 2건 |
| `/tools/privacy/`·`/tools/terms/` 잔존 | **0건** (stub의 noindex 메타로 `is_noindex()` 자동 제외) |
| 총 URL 수 | 66 (이전 라운드와 동일 — net change 0) |

새 entries는 lastmod 비어있음 (git log에 아직 없음). commit 후 다음 sitemap rebuild 시 자동 채워짐.

## 검증

| 항목 | 결과 |
|---|---|
| `/privacy/`·`/terms/` og:url == canonical | ✓ |
| `/tools/{privacy,terms}/` stub 4계층 (refresh + canonical + noindex + JS replace) | ✓ |
| 사이트 전체 `/tools/privacy/`·`/tools/privacy` 잔존 (sitemap·history 제외) | site-chrome.js 주석 1건뿐 — 정상 |
| `isToolsPage()` 동작 (Node 시뮬레이션) | **11/11 ✓** |
| sitemap에 stub URL | **0건** |
| sitemap에 신규 URL | **2건** |

`isToolsPage()` 검증 케이스:

```
✓ /                  → false
✓ /tools/            → true
✓ /tools/salary/     → true
✓ /tools/privacy/    → false (stub)
✓ /tools/terms/      → false (stub)
✓ /tools/404.html    → false
✓ /privacy/          → false (신규 root)
✓ /terms/            → false (신규 root)
✓ /text/             → false
✓ /image/            → false
✓ /pdf/              → false
```

banner 노출 의도대로 — 36 계산기 도구만 true, 정책·404·다른 카테고리는 모두 false.

## 후속 작업 (사용자)

1. **Search Console** = 신규 URL `https://taystudio.github.io/privacy/`·`https://taystudio.github.io/terms/` 색인 요청. 옛 `/tools/{privacy,terms}/`는 noindex 메타로 자연 deindex(수개월 소요).
2. **카카오/페이스북 OG 캐시** = 신규 URL OG 카드 첫 호출 시 자동 fetch. 필요 시 캐시 flush 도구로 수동 업데이트.
3. **sitemap 재제출** = `https://taystudio.github.io/sitemap.xml` Search Console에서 재제출 (URL은 동일하지만 내용 갱신 시그널).
4. **commit/push** = 사용자 명시 요청 시에만 실행. lastmod 자동 채움은 commit 후 다음 sitemap rebuild에서 처리.

## 패턴 재사용 노트

이번 이전은 PDF 카테고리 분리(2026-05-06 앞선 작업)에서 정립한 **soft refresh stub 4계층 패턴**을 그대로 재사용. GitHub Pages 정적 호스팅의 301 부재 한계를 우회하는 표준 패턴으로 확립.

| 라운드 | 대상 |
|---|---|
| 2026-05-06 PDF 카테고리 분리 | `image/{pdf-merge,pdf-split,img-to-pdf}/` → `pdf/...` (3 stub) |
| 2026-05-06 privacy·terms root 이전 (이번) | `tools/{privacy,terms}/` → `/{privacy,terms}/` (2 stub) |

다음 카테고리·페이지 이전 시 동일 패턴 적용. build-sitemap.sh의 `is_noindex()` 자동 제외 + `ROOT_PAGES` 배열은 향후 사이트 전체 단일 페이지(404·about 등) 추가 시 그대로 확장 가능.
