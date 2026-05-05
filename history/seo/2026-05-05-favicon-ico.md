# favicon.ico 추가 — 네이버 수집 제한 해제 (2026-05-05)

## 증상

네이버 서치어드바이저에서 `https://taystudio.github.io/favicon.ico` "수집 제한" 표시.

## 원인

repo에 `favicon.ico` 파일이 아예 없음 → 네이버봇이 자동으로 `/favicon.ico` 요청 시 404. 기존 favicon 자산은 SVG/PNG만:
- `/favicon.svg`
- `/favicon-96.png`
- `/favicon-192.png`
- `/apple-touch-icon.png`

브라우저는 모던 link 태그(`<link rel="icon" type="image/svg+xml">`)를 우선 인식하지만, 일부 크롤러(네이버봇 포함)는 legacy `/favicon.ico`를 별도로 자동 fetch. 404 받으면 "수집 제한"으로 분류.

robots.txt는 정상 — `Allow: /`. 차단 X.

## 해결

### 1. ICO 파일 생성

`npx png-to-ico`로 multi-resolution ICO 생성:

```bash
sips -z 16 16 favicon-96.png --out /tmp/favicon-16.png
sips -z 32 32 favicon-96.png --out /tmp/favicon-32.png
sips -z 48 48 favicon-96.png --out /tmp/favicon-48.png
sips -z 64 64 favicon-96.png --out /tmp/favicon-64.png
npx --yes png-to-ico /tmp/favicon-16.png /tmp/favicon-32.png /tmp/favicon-48.png /tmp/favicon-64.png favicon-96.png > favicon.ico
```

결과 = `favicon.ico` 285KB, 4 icon resolutions (16/32/48/64/96).

### 2. HTML head 일괄 추가

63개 HTML 파일 모두 동일한 favicon link 패턴이라 perl로 in-place 치환:

```bash
grep -rl 'rel="icon" type="image/svg+xml" href="/favicon.svg"' --include="*.html" | \
  xargs perl -i -pe 's|(\s*)(<link rel="icon" type="image/svg\+xml" href="/favicon.svg">)|$1<link rel="icon" href="/favicon.ico" sizes="any">\n$1$2|'
```

ico 링크를 svg 링크 위에 배치 = legacy 봇이 먼저 ICO 인식. 모던 브라우저는 type 명시(`image/svg+xml`) 보고 svg 우선.

## 트레이드오프

- **285KB는 큼** (일반 favicon.ico = 5~30KB). 원인 = png-to-ico default가 16~256 multi-res 모두 packing
- 사용자 영향 미미 — 첫 fetch 1회 + 영구 브라우저 캐시
- 후속 백로그 (plan §9.3) = ImageMagick·sharp로 16/32만 packing해서 재생성

## 사용자 후속 액션

1. commit + push → GitHub Pages 배포
2. `https://taystudio.github.io/favicon.ico` 직접 접속해 200 OK 확인
3. **네이버 서치어드바이저** → 도구 → 수집 요청 재등록
4. 카카오톡 미리보기 등 다른 봇은 영향 없음 (그쪽은 og:image 사용)

## 학습 포인트

- 모던 link 태그가 있어도 legacy `/favicon.ico` 자동 fetch는 일부 봇·일부 클라이언트(iMessage 등)에서 여전. 정적 사이트는 항상 `/favicon.ico` 파일 보유 권장
- robots.txt가 깨끗해도 파일 부재 = 404 = 검색엔진이 "수집 제한"으로 표시할 수 있음 (네이버 특유 표현)
- `png-to-ico` CLI는 size 인자 무시하고 default multi-res 만듦 → 사이즈 제어가 필요하면 sharp 같은 라이브러리 직접 호출 필요

## 관련 plan 항목

- §9.1 결정 기록
- §9.3 후속 백로그 (favicon.ico 사이즈 최적화)
- `history/seo/strategy.md` 18항목 체크리스트에 favicon.ico 항목 추가 검토
