#!/bin/bash
# verify-domain.sh
# 옛 도메인이 repo에 잔존하는지 검증. git 추적 파일만 대상.
#
# Usage:
#   bash scripts/verify-domain.sh OLD_HOST
#
# 예: bash scripts/verify-domain.sh taystudio.github.io
#
# Exit:
#   0 = 의도 외 잔존 없음 (의도적 보존만 남음)
#   1 = 의도 외 잔존 발견 또는 인자 오류

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: bash scripts/verify-domain.sh OLD_HOST" >&2
  exit 1
fi

OLD_HOST="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# 의도적 잔존 경로 — §9.5.2 "옛 도메인 라인 갱신 X" 정합.
# - history/  : 시점 기록 보존 (markdown·html 시점별 entry)
# - dash-tay9k3m/ : 운영자 전용 페이지 (GA·repo URL은 도메인 무관)
# - common/site-chrome.js : ALLOWED 두 곳 (전환기 false positive 방지)
# - plan.md, INDEXING_CHECKLIST.md, README.md : 마이그레이션 문서화·인계 기록 보존
is_intentional() {
  local path="$1"
  case "$path" in
    history/*) return 0 ;;
    dash-tay9k3m/*) return 0 ;;
    common/site-chrome.js) return 0 ;;
    plan.md|INDEXING_CHECKLIST.md|README.md) return 0 ;;
  esac
  return 1
}

# git ls-files = 추적 파일만, .git/·node_modules/·gitignore 자동 제외.
INTENTIONAL=()
UNINTENDED=()

while IFS= read -r path; do
  [ -f "$path" ] || continue
  if grep -q -- "$OLD_HOST" "$path" 2>/dev/null; then
    if is_intentional "$path"; then
      INTENTIONAL+=("$path")
    else
      UNINTENDED+=("$path")
    fi
  fi
done < <(git ls-files)

echo "▶ verify-domain.sh — OLD_HOST='${OLD_HOST}'"
echo ""

if [ "${#INTENTIONAL[@]}" -gt 0 ]; then
  echo "── 의도적 잔존 (보존 정책) ──"
  for p in "${INTENTIONAL[@]}"; do
    echo "  $p"
  done
  echo ""
fi

if [ "${#UNINTENDED[@]}" -gt 0 ]; then
  echo "── 의도 외 잔존 (수동 검토 필요) ──"
  for p in "${UNINTENDED[@]}"; do
    echo ""
    echo "  $p"
    grep -n -- "$OLD_HOST" "$p" | sed 's/^/    /'
  done
  echo ""
  echo "✗ 의도 외 잔존 ${#UNINTENDED[@]}개 파일 발견"
  exit 1
fi

echo "✓ 의도 외 잔존 0건 (의도적 잔존 ${#INTENTIONAL[@]}개)"
exit 0
