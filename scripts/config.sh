#!/bin/bash
# config.sh
# 도메인·IndexNow 키 단일 source. 다른 스크립트가 source로 가져와 사용.
#
# Usage (다른 스크립트 안에서):
#   source "$(cd "$(dirname "$0")" && pwd)/config.sh"
#
# 도메인 변경 시 = DOMAIN_HOST 한 줄 수정 후 `bash scripts/migrate-domain.sh OLD NEW` 실행.
# IndexNow 키 변경 시 = INDEXNOW_KEY 수정 + 루트의 `{key}.txt` 파일도 같이 갱신.

DOMAIN_SCHEME="https"
DOMAIN_HOST="taystudios.com"
INDEXNOW_KEY="b762f70e61da4ac199b51566e31748b3"

# 합성 변수 — 위 3개에서 파생. 직접 수정 X.
DOMAIN="${DOMAIN_SCHEME}://${DOMAIN_HOST}"
HOST="${DOMAIN_HOST}"
KEY="${INDEXNOW_KEY}"
KEY_LOCATION="${DOMAIN}/${INDEXNOW_KEY}.txt"

export DOMAIN_SCHEME DOMAIN_HOST INDEXNOW_KEY DOMAIN HOST KEY KEY_LOCATION
