# 2026-05-05 — video 카테고리 trim·rotate 2선 추가 (3선/5선 도달)

> 도구 수 49 → **51선**. sitemap 56 → **58 URL**. 카테고리 = `tools / text / image / video` 4개 유지.

## 결정 배경

같은 날 출시한 `video/compress`로 ffmpeg.wasm 인프라(`video/vendor/ffmpeg-loader.mjs` wrapper + jsdelivr CDN + IndexedDB Blob 캐시)가 동작하는 것을 확인. `plan.md §5.5.2` 5선 중 다음 ROI = trim(검색 볼륨 ★★★) + rotate(모바일 사용자 세로 영상 보정 니즈). wrapper 재사용 패턴이 실제로 도구당 작업량을 줄이는지 1차 검증.

**결과** = wrapper 한 줄 import (`import { loadFFmpeg, toUint8Array } from '/video/vendor/ffmpeg-loader.mjs';`) + 도구별 `buildArgs()` 함수만 작성하면 끝. `compress.js`(228줄) 패턴 그대로 복제 → trim.js·rotate.js 각각 ~250줄. UI/SEO/JSON-LD/FAQ는 도구 특성에 맞춰 새로 작성.

## video/trim — 빠른 모드 + 정확 모드 듀얼

**핵심 차별화** = 두 모드 제공:

| 모드 | ffmpeg args | 속도 | 정확도 |
|---|---|---|---|
| **빠른 모드 (`copy`, 기본)** | `-ss <s> -to <e> -i input -c copy -avoid_negative_ts make_zero -movflags +faststart` | 1GB도 수 초~십몇 초 | 키프레임(보통 1~5초 간격) 단위로 끌려감 |
| **정확 모드 (`reencode`)** | `-i input -ss <s> -to <e> -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart` | 자르는 구간 길이의 0.3~1× | 프레임 단위 정확 |

**핵심 배치**: 빠른 모드는 `-ss/-to`를 `-i` **앞**에 둠 → ffmpeg가 input을 처음부터 디코드하지 않고 바로 키프레임으로 seek (입력 scan 생략). 정확 모드는 `-i` **뒤**에 둠 → 디코드 후 정확한 프레임에서 잘림.

**시각 입력 파서** = `parseTime(str)` — `HH:MM:SS / MM:SS / 초(.frac)` 3가지 형식 자동 인식. 잘못된 입력은 NaN → alert로 가드.

**UX**: 영상 업로드 시 `<video preload="metadata">`로 미리보기 + duration 자동 표시 + 시작/끝 입력란 0/끝으로 자동 채움. "현재 재생 위치로" 버튼이 `sourceVideo.currentTime` → 입력란으로 복사 — 큰 영상에서 정확한 시각 찾기 편함.

**제약 안내** (FAQ + disclosure):
- 빠른 모드 키프레임 정렬 = 1~5초 오차 가능 → 정확이 필요하면 정확 모드 안내
- 빠른 모드는 코덱 디코딩 자체가 없어 single-thread 제약 영향 작음 (정확 모드만 영향)

## video/rotate — transpose 5종 + 오디오 무손실 fallback

**5가지 옵션** (라디오 grid):

| 옵션 | ffmpeg `-vf` | 용도 |
|---|---|---|
| 90° 시계방향 (cw90) | `transpose=1` | 아이폰 세로 영상 → 가로 (방향에 따라) |
| 90° 반시계방향 (ccw90) | `transpose=2` | 위와 반대 방향 |
| 180° (rot180) | `transpose=2,transpose=2` | 거꾸로 든 영상 / 천장 영상 |
| 좌우 반전 (hflip) | `hflip` | 거울 효과 / 셀카 미러링 보정 |
| 상하 반전 (vflip) | `vflip` | 드론·고프로 거꾸로 장착 보정 |

**오디오 처리** = 1차 `-c:a copy` 무손실 시도 → 실패 시 2차 `-c:a aac -b:a 128k` fallback. `tryExec()` 함수가 첫 시도 실패 잡아서 outputName 정리 후 재시도. 이유 = 일부 입력 코덱(AC-3·DTS 등)은 MP4 컨테이너에 그대로 못 담음 → 자동 변환.

**비디오 인코딩** = H.264 + CRF 23 고정 (시각 손실 거의 없음). 압축은 별도 도구로 위임 — rotate에서 화질 슬라이더 추가하면 도구 책임 모호해짐 (§0.4 좁은 도구 정신).

**메타데이터 회전 vs 픽셀 회전** = 메타데이터 rotation tag 방식은 일부 플레이어만 인식 + 카톡·SNS 업로드 시 무시되는 경우 많음 → 픽셀을 실제로 회전시키는 방식 선택. FAQ에 명시.

## SEO 설정

**trim**:
- canonical `/video/trim/`
- title "동영상 자르기 | 영상 트리밍 — 원하는 구간만 잘라 저장"
- keywords = "동영상 자르기·영상 트리밍·영상 구간 자르기·MP4 자르기·동영상 컷·영상 일부만 저장·무료 동영상 자르기"
- JSON-LD = WebApplication + BreadcrumbList + FAQPage(5)

**rotate**:
- canonical `/video/rotate/`
- title "동영상 회전 | 영상 90·180도 회전·좌우/상하 반전 (무료)"
- keywords = "동영상 회전·영상 회전·동영상 뒤집기·세로 영상 가로로·MP4 회전·영상 좌우 반전·영상 상하 반전·거꾸로 영상"
- JSON-LD = WebApplication + BreadcrumbList + FAQPage(4)

**검색 키워드 차별화** — 모바일 사용자(아이폰 세로 녹화) 주 타겟. "세로 영상 가로로" 등 user-intent 직접 표현 포함.

## 통합 작업

| 항목 | 변경 |
|---|---|
| `video/trim/{index.html, trim.js}` | 신규 |
| `video/rotate/{index.html, rotate.js}` | 신규 |
| `video/index.html` | hub count 1 → 3 + tool-card 2개 + ItemList 3 + keywords 갱신 |
| `video/compress/index.html` | related-tools에 trim·rotate 라이브 링크 추가, "(준비 중)" 문구 → 라이브 링크 갱신 |
| `index.html` (루트) | hub-card "LIVE · 1선" → "3선" + 카테고리 description + og·twitter·title·description·keywords + WebSite hasPart description + alternateName description "49선 → 51선" + quick-list "동영상" row 확장 |
| `sitemap.xml` | `/video/trim/`, `/video/rotate/` 2 URL 추가 (56 → 58) |
| `common/site-chrome.js` | 변경 없음 (nav는 카테고리 4개로 유지) |
| `tools/sw.js` | v14 유지 (image/ 패턴 동일, STATIC_ASSETS 미포함) |
| `plan.md` | 헤더 51선/58 URL 갱신, §5.5.2 trim·rotate ✅ 표시, §9.1 출시 기록, §9.4 to-gif·to-mp3 잔여 큐 |

## ffmpeg args 학습

이번 라운드에서 검증된 기법 — 향후 to-gif·to-mp3 출시 시 재사용:

- **`-ss / -to` 위치**: `-i` **앞** = 빠른 seek + 키프레임 정렬 / `-i` **뒤** = 정확하지만 디코딩 비용
- **`-c copy`**: 재인코딩 X (스트림 복사). 컨테이너 변환 + 잘라내기에서 매우 빠름
- **`-avoid_negative_ts make_zero`**: 빠른 모드에서 PTS 음수 방지 (잘린 첫 프레임이 t=0이 되도록)
- **`transpose=N`**: 1=CW / 2=CCW / 0=CCW+vflip / 3=CW+vflip. 두 번 연속 = 180°
- **`tryExec` fallback 패턴**: 1차 무손실 → 실패 시 outputName 정리 후 재인코딩 — `-c:a copy`/MP4 컨테이너 호환 문제 해결 표준 패턴

## 후속 작업

1. **나머지 2선** (`§5.5.2`): to-gif (palette 2-pass 필터) + to-mp3 (저작권 inline disclaimer 박스 필수)
2. **로컬 실기기 검증**: 빠른 모드/정확 모드 시간 차이 / 큰 영상에서 빠른 모드 메모리 부담 / iOS Safari rotate 시 transpose 동작
3. **history/index.html 타임라인 카드** (compress 카드와 함께 묶음 추가)
4. **PWA 통합 (A안)** = `tools/sw.js` STATIC_ASSETS에 카테고리·vendor 일괄 추가 (§9.2 보류 → 진입 후보 시점 도달)
