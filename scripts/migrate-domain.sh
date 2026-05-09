#!/bin/bash
# migrate-domain.sh
# OLD_HOST → NEW_HOST 일괄 sed. 도메인 변경 시 1명령으로 모든 정적 자산 갱신.
#
# Usage:
#   bash scripts/migrate-domain.sh OLD_HOST NEW_HOST           # 실제 적용
#   bash scripts/migrate-domain.sh --dry-run OLD_HOST NEW_HOST # 변경 예정 파일만 출력
#
# 예: bash scripts/migrate-domain.sh taystudio.github.io taystudios.com
#
# 사후 = scripts/config.sh의 DOMAIN_HOST 수동 갱신 + verify-domain.sh로 잔존 확인.
#
# 의도적 미적용 (수동 검토 영역, §9.5.2 정합):
#   - history/        : 시점 기록 보존
#   - dash-tay9k3m/   : 운영자 페이지
#   - common/site-chrome.js : ALLOWED 두 곳·mirrorWarn 메시지 (정책 결정 영역)
#   - scripts/        : config.sh가 단일 source — 자기 자신 sed 금지
#   - .git/, node_modules/ : 자명

set -euo pipefail

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
  shift
fi

if [ "$#" -ne 2 ]; then
  echo "Usage: bash scripts/migrate-domain.sh [--dry-run] OLD_HOST NEW_HOST" >&2
  exit 1
fi

OLD_HOST="$1"
NEW_HOST="$2"

# 호스트 형식 검증 — 점 포함, 스킴·슬래시 없음
validate_host() {
  local h="$1"
  if [[ "$h" == *"/"* ]] || [[ "$h" == *":"* ]]; then
    echo "✗ 호스트는 스킴·슬래시 없이: '$h'" >&2
    return 1
  fi
  if [[ "$h" != *"."* ]]; then
    echo "✗ 호스트에 점 필요: '$h'" >&2
    return 1
  fi
}
validate_host "$OLD_HOST"
validate_host "$NEW_HOST"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# 대상 = 추적 파일 중 HTML/SVG/XML/robots.txt/*.txt 패턴.
# git ls-files = .git/·node_modules/·gitignore 자동 제외.
# exclude 경로는 case 분기로 추가 필터.
is_excluded() {
  local path="$1"
  case "$path" in
    history/*) return 0 ;;
    dash-tay9k3m/*) return 0 ;;
    common/site-chrome.js) return 0 ;;
    scripts/*) return 0 ;;
  esac
  return 1
}

is_target() {
  local path="$1"
  case "$path" in
    *.html|*.svg|*.xml|robots.txt|*.txt) return 0 ;;
  esac
  return 1
}

TARGETS=()
EXCLUDED_HITS=()

while IFS= read -r path; do
  [ -f "$path" ] || continue
  is_target "$path" || continue

  if grep -q -- "$OLD_HOST" "$path" 2>/dev/null; then
    if is_excluded "$path"; then
      EXCLUDED_HITS+=("$path")
    else
      TARGETS+=("$path")
    fi
  fi
done < <(git ls-files)

echo "▶ migrate-domain.sh"
echo "  OLD_HOST: ${OLD_HOST}"
echo "  NEW_HOST: ${NEW_HOST}"
echo "  mode:     $([ $DRY_RUN -eq 1 ] && echo 'DRY-RUN' || echo 'APPLY')"
echo ""

if [ "${#TARGETS[@]}" -eq 0 ]; then
  echo "✗ OLD_HOST '${OLD_HOST}' 매칭 파일 0건 (추적 + 대상 확장자 + 비제외)" >&2
  if [ "${#EXCLUDED_HITS[@]}" -gt 0 ]; then
    echo "  (제외 경로 매칭: ${#EXCLUDED_HITS[@]}건)"
  fi
  exit 1
fi

echo "── 변경 대상 (${#TARGETS[@]}개) ──"
for p in "${TARGETS[@]}"; do
  count=$(grep -c -- "$OLD_HOST" "$p" 2>/dev/null || echo 0)
  printf "  %-60s (%d건)\n" "$p" "$count"
done
echo ""

if [ "${#EXCLUDED_HITS[@]}" -gt 0 ]; then
  echo "── 제외 (수동 검토 영역, ${#EXCLUDED_HITS[@]}개) ──"
  for p in "${EXCLUDED_HITS[@]}"; do
    echo "  $p"
  done
  echo ""
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo "ℹ DRY-RUN: 실제 변경 X. 적용은 --dry-run 빼고 재실행."
  exit 0
fi

# 실제 sed — 호스트 단독 치환 1회로 https://·http://·standalone 모두 cover.
# macOS sed와 GNU sed 호환 위해 임시 파일 패턴 사용 (-i '' 차이 회피).
echo "── sed 적용 ──"
for p in "${TARGETS[@]}"; do
  tmp="${p}.migrate.tmp"
  sed "s|${OLD_HOST}|${NEW_HOST}|g" "$p" > "$tmp"
  mv "$tmp" "$p"
  echo "  ✓ $p"
done
echo ""

# 후속 안내
echo "── 다음 단계 ──"
echo "  1. scripts/config.sh의 DOMAIN_HOST 갱신 (수동):"
echo "       DOMAIN_HOST=\"${NEW_HOST}\""
echo "  2. common/site-chrome.js의 ALLOWED·mirrorWarn 검토 (정책 결정 영역)"
echo "  3. 잔존 검증:"
echo "       bash scripts/verify-domain.sh ${OLD_HOST}"
echo "  4. sitemap·IndexNow ping 갱신:"
echo "       bash scripts/build-sitemap.sh"
