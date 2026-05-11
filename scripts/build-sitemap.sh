#!/bin/bash
# build-sitemap.sh
# Walk all index.html under repo root + tools/, extract canonicals,
# pull lastmod from git log (last commit touching the file), generate sitemap.xml at root.
#
# Usage: bash scripts/build-sitemap.sh
# Run after adding a new tool or significantly editing an existing page.

set -euo pipefail

# 도메인 단일 source — DOMAIN 변수는 config.sh에서 가져옴.
source "$(cd "$(dirname "$0")" && pwd)/config.sh"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${REPO_ROOT}/sitemap.xml"

cd "$REPO_ROOT"

# Returns last commit date of file in YYYY-MM-DD form. Empty if untracked.
last_mod() {
  git log -1 --format=%cs -- "$1" 2>/dev/null || echo ""
}

# Returns canonical URL extracted from <link rel="canonical" href="..."> in HTML.
# Falls back to constructed URL if missing.
canonical_of() {
  local file="$1"
  local fallback="$2"
  local href
  href=$(grep -oE '<link rel="canonical"[^>]*href="[^"]*"' "$file" 2>/dev/null \
         | sed -E 's/.*href="([^"]*)".*/\1/' | head -1)
  if [ -n "$href" ]; then
    echo "$href"
  else
    echo "$fallback"
  fi
}

# 카테고리 목록 — 새 카테고리(test/ 등) 추가 시 여기 갱신
CATEGORIES=("tools" "text" "image" "pdf" "video")

# 루트 직속 단일 페이지 — privacy·terms 같이 카테고리 아닌 정책 페이지. AdSense·표준 관행상 root 위치.
ROOT_PAGES=("privacy" "terms")

# 언어별 prefix — 빈 문자열은 root(한국어), "en/"는 영문 미러. 새 언어 추가 시 여기 추가.
LANG_PREFIXES=("" "en/")

# noindex 메타가 있는 파일은 sitemap에 포함하지 않음 (이전 stub 등).
is_noindex() {
  grep -qE '<meta[[:space:]]+name="robots"[[:space:]]+content="[^"]*noindex' "$1" 2>/dev/null
}

# Default priority and changefreq based on URL path conventions.
classify() {
  local url="$1"
  case "$url" in
    # 홈 (한국어·영문)
    "${DOMAIN}/"|"${DOMAIN}/en/")     echo "1.0 weekly" ;;
    *"/privacy/"*)                    echo "0.3 yearly" ;;
    *"/terms/"*)                      echo "0.3 yearly" ;;
    # 카테고리 허브 (/tools/, /text/, /image/, /pdf/, /video/) — 한국어·영문
    "${DOMAIN}/tools/"|"${DOMAIN}/en/tools/")     echo "1.0 weekly" ;;
    "${DOMAIN}/text/"|"${DOMAIN}/en/text/")       echo "1.0 weekly" ;;
    "${DOMAIN}/image/"|"${DOMAIN}/en/image/")     echo "1.0 weekly" ;;
    "${DOMAIN}/pdf/"|"${DOMAIN}/en/pdf/")         echo "1.0 weekly" ;;
    "${DOMAIN}/video/"|"${DOMAIN}/en/video/")     echo "1.0 weekly" ;;
    # 개별 도구 상세 페이지 — 깊이 5+
    *"/tools/"*|*"/text/"*|*"/image/"*|*"/pdf/"*|*"/video/"*) echo "0.95 monthly" ;;
    *)                         echo "0.5 monthly" ;;
  esac
}

emit_url() {
  local url="$1"
  local lastmod="$2"
  local pri_freq
  pri_freq=$(classify "$url")
  local priority="${pri_freq% *}"
  local changefreq="${pri_freq#* }"

  printf "  <url>\n"
  printf "    <loc>%s</loc>\n" "$url"
  if [ -n "$lastmod" ]; then
    printf "    <lastmod>%s</lastmod>\n" "$lastmod"
  fi
  printf "    <changefreq>%s</changefreq>\n" "$changefreq"
  printf "    <priority>%s</priority>\n" "$priority"
  printf "  </url>\n"
}

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

  # 언어별 prefix 순회 — root("") = 한국어, "en/" = 영문 미러.
  # 각 언어마다 동일 로직: 홈 → root pages(privacy/terms) → 카테고리 허브 + 도구.
  for prefix in "${LANG_PREFIXES[@]}"; do
    # 홈 (한국어 = index.html, 영문 = en/index.html)
    root_file="${prefix}index.html"
    if [ -f "$root_file" ] && ! is_noindex "$root_file"; then
      URL=$(canonical_of "$root_file" "${DOMAIN}/${prefix}")
      emit_url "$URL" "$(last_mod "$root_file")"
    fi

    # 루트 직속 단일 페이지 (privacy/terms)
    for slug in "${ROOT_PAGES[@]}"; do
      file="${prefix}${slug}/index.html"
      [ -f "$file" ] || continue
      is_noindex "$file" && continue
      URL=$(canonical_of "$file" "${DOMAIN}/${prefix}${slug}/")
      emit_url "$URL" "$(last_mod "$file")"
    done

    # 각 카테고리 — 허브(<prefix><cat>/index.html) + 도구별 상세
    for cat in "${CATEGORIES[@]}"; do
      hub="${prefix}${cat}/index.html"
      if [ -f "$hub" ] && ! is_noindex "$hub"; then
        URL=$(canonical_of "$hub" "${DOMAIN}/${prefix}${cat}/")
        emit_url "$URL" "$(last_mod "$hub")"
      fi

      for dir in "${prefix}${cat}"/*/; do
        file="${dir}index.html"
        [ -f "$file" ] || continue
        is_noindex "$file" && continue
        name=$(basename "$dir")
        fallback="${DOMAIN}/${prefix}${cat}/${name}/"
        URL=$(canonical_of "$file" "$fallback")
        emit_url "$URL" "$(last_mod "$file")"
      done
    done
  done

  echo '</urlset>'
} > "$OUT"

# Count for stdout summary.
COUNT=$(grep -c "<url>" "$OUT")
echo "✓ sitemap.xml generated at $OUT"
echo "  URL count: $COUNT"

# IndexNow ping — Bing·Yandex·Naver·Seznam 즉시 인덱스 알림.
# INDEXNOW_PING=0 으로 비활성화 (commit/push 전 로컬 빌드 등).
if [ "${INDEXNOW_PING:-1}" = "1" ] && [ -f "${REPO_ROOT}/scripts/indexnow-ping.sh" ]; then
  echo ""
  bash "${REPO_ROOT}/scripts/indexnow-ping.sh" || {
    echo "⚠ IndexNow ping 실패 — sitemap은 정상 생성됨. 수동 재시도: bash scripts/indexnow-ping.sh"
  }
fi
