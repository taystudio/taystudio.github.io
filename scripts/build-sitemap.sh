#!/bin/bash
# build-sitemap.sh
# Walk all index.html under repo root + tools/, extract canonicals,
# pull lastmod from git log (last commit touching the file), generate sitemap.xml at root.
#
# Usage: bash scripts/build-sitemap.sh
# Run after adding a new tool or significantly editing an existing page.

set -euo pipefail

DOMAIN="https://taystudio.github.io"
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

# 카테고리 목록 — 새 카테고리(image/, test/ 등) 추가 시 여기 갱신
CATEGORIES=("tools" "text")

# Default priority and changefreq based on URL path conventions.
classify() {
  local url="$1"
  case "$url" in
    "${DOMAIN}/")              echo "1.0 weekly" ;;
    *"/privacy/"*)             echo "0.3 yearly" ;;
    *"/terms/"*)               echo "0.3 yearly" ;;
    # 카테고리 허브 (/tools/, /text/, ...) — 깊이 4 = "${DOMAIN}/<cat>/"
    "${DOMAIN}/tools/")        echo "1.0 weekly" ;;
    "${DOMAIN}/text/")         echo "1.0 weekly" ;;
    # 개별 도구 상세 페이지 — 깊이 5+
    *"/tools/"*|*"/text/"*)    echo "0.95 monthly" ;;
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

  # Root index
  if [ -f "index.html" ]; then
    URL=$(canonical_of "index.html" "${DOMAIN}/")
    emit_url "$URL" "$(last_mod index.html)"
  fi

  # 각 카테고리 — 허브(<cat>/index.html) + 도구별 상세(<cat>/<slug>/index.html)
  for cat in "${CATEGORIES[@]}"; do
    hub="${cat}/index.html"
    if [ -f "$hub" ]; then
      URL=$(canonical_of "$hub" "${DOMAIN}/${cat}/")
      emit_url "$URL" "$(last_mod "$hub")"
    fi

    for dir in "${cat}"/*/; do
      file="${dir}index.html"
      [ -f "$file" ] || continue
      name=$(basename "$dir")
      fallback="${DOMAIN}/${cat}/${name}/"
      URL=$(canonical_of "$file" "$fallback")
      emit_url "$URL" "$(last_mod "$file")"
    done
  done

  echo '</urlset>'
} > "$OUT"

# Count for stdout summary.
COUNT=$(grep -c "<url>" "$OUT")
echo "✓ sitemap.xml generated at $OUT"
echo "  URL count: $COUNT"
