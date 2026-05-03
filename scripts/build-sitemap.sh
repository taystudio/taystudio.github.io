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

# Default priority and changefreq based on URL path conventions.
classify() {
  local url="$1"
  case "$url" in
    "${DOMAIN}/")          echo "1.0 weekly" ;;
    "${DOMAIN}/tools/")    echo "1.0 weekly" ;;
    *"/tools/privacy/"*)   echo "0.3 yearly" ;;
    *"/tools/terms/"*)     echo "0.3 yearly" ;;
    *"/tools/")            echo "0.95 monthly" ;;  # individual tool pages
    *)                     echo "0.5 monthly" ;;
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

  # tools/index.html (hub)
  if [ -f "tools/index.html" ]; then
    URL=$(canonical_of "tools/index.html" "${DOMAIN}/tools/")
    emit_url "$URL" "$(last_mod tools/index.html)"
  fi

  # Each tool subdirectory
  for dir in tools/*/; do
    file="${dir}index.html"
    [ -f "$file" ] || continue
    name=$(basename "$dir")
    fallback="${DOMAIN}/tools/${name}/"
    URL=$(canonical_of "$file" "$fallback")
    emit_url "$URL" "$(last_mod "$file")"
  done

  echo '</urlset>'
} > "$OUT"

# Count for stdout summary.
COUNT=$(grep -c "<url>" "$OUT")
echo "✓ sitemap.xml generated at $OUT"
echo "  URL count: $COUNT"
