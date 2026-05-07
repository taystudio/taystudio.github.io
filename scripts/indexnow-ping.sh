#!/bin/bash
# indexnow-ping.sh
# sitemap.xml의 모든 URL을 IndexNow API로 push. Bing·Yandex·Naver·Seznam 동시 전파.
# Google은 IndexNow 미지원 — 별도 sitemap·SC로 cover.
#
# Usage:
#   bash scripts/indexnow-ping.sh           # 실제 전송
#   bash scripts/indexnow-ping.sh --dry-run # payload만 출력, 전송 X
#
# 사전 조건:
#   1. {key}.txt 파일이 GitHub Pages에 deploy되어 있어야 함 (commit+push 필수)
#   2. https://taystudio.github.io/{key}.txt 가 200 응답해야 함 (배포 후 ~1분)

set -euo pipefail

DOMAIN="https://taystudio.github.io"
HOST="taystudio.github.io"
KEY="b762f70e61da4ac199b51566e31748b3"
KEY_LOCATION="${DOMAIN}/${KEY}.txt"
ENDPOINT="https://api.indexnow.org/indexnow"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITEMAP="${REPO_ROOT}/sitemap.xml"

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
fi

if [ ! -f "$SITEMAP" ]; then
  echo "✗ sitemap.xml 없음. 먼저 'bash scripts/build-sitemap.sh' 실행" >&2
  exit 1
fi

# sitemap.xml에서 <loc>...</loc> URL 추출
URLS=$(grep -oE '<loc>[^<]+</loc>' "$SITEMAP" | sed -E 's|</?loc>||g')
URL_COUNT=$(echo "$URLS" | wc -l | tr -d ' ')

if [ -z "$URLS" ] || [ "$URL_COUNT" -eq 0 ]; then
  echo "✗ sitemap에서 URL 추출 실패" >&2
  exit 1
fi

# JSON urlList 빌드 (각 URL을 따옴표로 감싸고 콤마 join)
URL_JSON=$(echo "$URLS" | awk 'BEGIN{ORS=""} {if(NR>1)printf ","; printf "\"%s\"", $0}')

PAYLOAD=$(cat <<EOF
{
  "host": "${HOST}",
  "key": "${KEY}",
  "keyLocation": "${KEY_LOCATION}",
  "urlList": [${URL_JSON}]
}
EOF
)

echo "▶ IndexNow ping"
echo "  endpoint:    ${ENDPOINT}"
echo "  host:        ${HOST}"
echo "  keyLocation: ${KEY_LOCATION}"
echo "  URL count:   ${URL_COUNT}"

if [ "$DRY_RUN" -eq 1 ]; then
  echo ""
  echo "── payload (dry-run, 전송 X) ──"
  echo "$PAYLOAD"
  exit 0
fi

# 실제 전송
HTTP_CODE=$(curl -sS -o /tmp/indexnow-response.txt -w "%{http_code}" \
  -X POST "$ENDPOINT" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary "$PAYLOAD")

echo ""
echo "── response ──"
echo "HTTP ${HTTP_CODE}"
if [ -s /tmp/indexnow-response.txt ]; then
  cat /tmp/indexnow-response.txt
  echo ""
fi

case "$HTTP_CODE" in
  200|202)
    echo "✓ ping 성공 (${URL_COUNT} URLs queued)"
    ;;
  400)
    echo "✗ 400 Bad Request — payload 형식 오류"
    exit 1
    ;;
  403)
    echo "✗ 403 Forbidden — ${KEY_LOCATION} 검증 실패"
    echo "  대응: 1) {key}.txt 파일이 commit+push되어 GitHub Pages에 배포됐는지 확인"
    echo "        2) curl ${KEY_LOCATION} 직접 호출해서 200 응답·key 내용 일치 확인"
    exit 1
    ;;
  422)
    echo "✗ 422 Unprocessable — urlList의 URL이 host와 불일치"
    exit 1
    ;;
  429)
    echo "✗ 429 Too Many Requests — rate limit. 잠시 후 재시도"
    exit 1
    ;;
  *)
    echo "✗ 예상 외 응답: ${HTTP_CODE}"
    exit 1
    ;;
esac
