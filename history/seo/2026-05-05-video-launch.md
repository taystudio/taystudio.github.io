# 2026-05-05 — video 카테고리 신설 + video/compress 1선 출시

> 카테고리 = `tools / text / image / video` **4개**. 도구 수 48 → **49선**. sitemap 54 → **56 URL**.

## 결정 배경

`plan.md §5.5.2 (video — Tier 1 후보 5선)`에서 ROI 1순위로 평가된 video 카테고리 진입. compress 1선부터 출시하여 ffmpeg.wasm 인프라(vendor + IndexedDB 캐시) 검증 + 트래픽·체류 데이터 누적 후 나머지 4선(trim·to-gif·to-mp3·rotate) 확장.

## 핵심 인프라 — ffmpeg.wasm CDN + IndexedDB

**`video/vendor/ffmpeg-loader.mjs`** = 자체 작성 ESM wrapper.

- 라이브러리: `@ffmpeg/ffmpeg@0.12.10` (jsdelivr `+esm` 동적 import) + `@ffmpeg/core@0.12.6` (`.js` + `.wasm`)
- 캐시: IndexedDB `taystudio-video` DB / `wasm-cache` store / Blob 저장 / version-pinned key
- 흐름: 첫 호출 시 코어 ~32MB 다운로드 + 캐시 → 이후 호출은 캐시 hit + `URL.createObjectURL(Blob)` 으로 즉시 사용
- 진행률: `onProgress({ key, current, total })` 콜백 — `cache:`·`fetch:`·`compute:transcode` prefix로 단계 구분
- Singleton: 모듈 레벨 인스턴스 + 중복 호출 방지 (`loadingPromise`)
- Fallback: 캐시 put 실패(사파리 프라이빗·할당량 초과) → silent skip, 다음 방문 시 재 fetch

## Single-thread 결정 (중요)

GitHub Pages는 응답 헤더 설정 불가 → `Cross-Origin-Opener-Policy: same-origin` / `Cross-Origin-Embedder-Policy: require-corp` 미부여 → **SharedArrayBuffer 비활성** → multi-thread `@ffmpeg/core-mt` 사용 불가.

**결정** = `@ffmpeg/core` (single-thread)만 사용. 트레이드오프:

- 단점: 처리 속도 = 원본 길이의 0.3~1× (5분 1080p ≈ 1~3분 데스크톱)
- 장점: 어떤 호스팅 환경에서도 동작 / iOS Safari 호환
- 회피책: 사용자에게 "데스크톱 + 720p 이하 다운스케일" 안내 (`.first-time-notice` 박스 + FAQ)

향후 백엔드 도입 시에도 video 처리는 무거워서 정적 + 클라이언트 처리가 합리적 — single-thread 한계를 감수하고 가는 게 §0.2 정신에 부합.

## video/compress 도구 사양

**입력**: MP4 / MOV / WebM / MKV / AVI (ffmpeg가 디코딩하는 거의 모든 포맷)

**옵션**:
- 해상도: 원본 · 1080p · 720p · 480p · 360p
- CRF (Constant Rate Factor): 18~35, 기본 28
- 오디오: AAC 128kbps 재인코딩 (기본) / 무손실 복사 / 제거

**ffmpeg args** = `-c:v libx264 -preset ultrafast -crf N -pix_fmt yuv420p [-vf scale=-2:N] -c:a aac -b:a 128k -movflags +faststart out.mp4`

**출력**: MP4 (H.264 + AAC) — 카톡·이메일·SNS·QuickTime 호환 보장.

**UI**:
- file-drop-zone (드래그·클릭)
- 옵션 3개 (해상도 select / CRF range / 오디오 select)
- progress-bar + 텍스트 (다운로드 → 인코딩 → 완료)
- result: `<video controls>` 미리보기 + 원본/압축 용량 + 감소율 + 해상도 + 처리 시간 + 다운로드 링크

**제약 안내** (`.first-time-notice` 인라인 박스):
- 첫 사용 ~32MB 다운로드 → Wi-Fi 권장
- 모바일 ~500MB 메모리 한계
- single-thread 처리 시간

## 통합 작업

| 항목 | 변경 |
|---|---|
| `common/site-chrome.js` | nav 3 → 4 (`계산기·텍스트·이미지·동영상`) |
| `index.html` (루트) | hub-card 4번째 추가 (LIVE · 1선) / og·twitter·title·description·keywords / hasPart 4 / quick-list "동영상" row |
| `sitemap.xml` | `/video/`, `/video/compress/` 2 URL 추가 (54 → 56) |
| `video/index.html` | 카테고리 hub (도구 1개부터, image/ 패턴 복제) |
| `video/compress/{index.html, compress.js}` | 도구 페이지 + 로직 |
| `video/vendor/ffmpeg-loader.mjs` | CDN+IndexedDB 캐시 wrapper |
| `tools/sw.js` | **변경 없음** (v14 유지). 카테고리 페이지는 image/ 패턴과 동일하게 STATIC_ASSETS 미포함, 방문 시 자동 캐시. PWA 통합(§9.2)에서 일괄 처리 |
| `plan.md` | 헤더 갱신 (`48선 → 49선`, `54 → 56 URL`, 카테고리 4개) / §5.5.2 compress ✅ 표시 + Single-thread 결정 명시 / §9.1 출시 기록 / §9.4 후속 작업 큐 |

## SEO 설정

- **canonical**: `https://taystudio.github.io/video/{compress/}`
- **JSON-LD**: WebSite + BreadcrumbList + ItemList(hub) / WebApplication + BreadcrumbList + FAQPage(compress)
- **og·twitter·title·description**: 카테고리·도구 별도 작성. og:image는 사이트 공통 자산
- **keywords**: 동영상 압축·영상 용량 줄이기·카톡 동영상·MP4 압축·영상 압축 사이트 (luck 키워드 X — §0.4 정책)

## 출처 정책 준수

- ffmpeg.wasm 공식 사이트 (BSD/LGPL 라이선스)
- H.264 표준 (ISO/IEC 14496-10)
- CRF 가이드 (FFmpeg Wiki)

수치는 1차 출처만 인용 — memory feedback `수치 출처 정확성` 정책.

## 후속 작업

1. **나머지 4선** (`§5.5.2`): trim → to-gif → to-mp3 → rotate. 인프라 깔려 있어서 도구당 작업량 작음 — ffmpeg args + UI 옵션 위주
2. **history/index.html 타임라인 카드** 추가 (별도 세션)
3. **로컬 실기기 검증**: ~32MB 첫 다운로드 / 캐시 hit / iOS Safari / 큰 영상 메모리
4. **PWA 통합 (A안)** = `tools/sw.js` STATIC_ASSETS에 카테고리·vendor 일괄 추가 (§9.2 보류 → 진입 후보 시점 도달)
5. **저작권 disclaimer 강화**: video-to-mp3 출시 시 inline 박스 추가 (현재는 sources note만)
