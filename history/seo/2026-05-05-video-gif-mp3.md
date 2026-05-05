# 2026-05-05 — video 카테고리 to-gif·to-mp3 2선 추가 (5선 / 5선 완료)

> 도구 수 51 → **53선**. sitemap 58 → **60 URL**. §5.5.2 video Tier 1 5선 전부 라이브.

## 결정 배경

같은 날 출시한 compress + trim·rotate로 ffmpeg.wasm 인프라(`video/vendor/ffmpeg-loader.mjs` wrapper)가 5도구를 안정적으로 구동하는지 최종 검증. 잔여 2선 = to-gif(검색 ★★, 짤·움짤 사용자 니즈) + to-mp3(검색 ★★, 단 저작권 리스크 큼).

**결과** = wrapper 변경 없이 args만 다른 도구 2개 추가. compress·trim·rotate.js 패턴 그대로 복제 + ffmpeg args + UI 위젯 일부 다른 식으로 재구성.

## video/to-gif — palette 단일패스 split 필터

**핵심 args**:
```
-ss <start> -to <end> -i input
-vf "fps=N,scale=W:-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5"
-loop 0 out.gif
```

**필터 그래프 동작**:
1. `fps=N` → 프레임 레이트 변환 (10/15/24/30 중 선택)
2. `scale=W:-2:flags=lanczos` → 너비 W로 리스케일 (Lanczos 보간 = 고품질, 짝수 높이 자동)
3. `split[s0][s1]` → 같은 스트림을 두 갈래로 분기
4. `[s0]palettegen=stats_mode=diff[p]` → 분기 1 분석 → 256색 색상표 생성. `stats_mode=diff` = 움직이는 영역 색상 가중 (정적 single보다 움짤에 적합)
5. `[s1][p]paletteuse=dither=bayer:bayer_scale=5` → 분기 2 + 색상표 → dithering 적용 GIF 출력. `bayer dither` = 그라데이션 거칠기 완화

**왜 단일 패스인가** = 전통적 ffmpeg 가이드는 2-pass(palette.png 중간 파일 작성 후 두 번째 호출에서 읽기). single-pass split은 같은 결과를 한 번의 `exec` 호출로 끝냄 → ffmpeg.wasm MEMFS에 중간 파일 쓰지 않음, 코드 단순.

**옵션 4단계 + 5단계**:
- fps: 10(작음·끊김), 15(권장), 24(부드러움), 30(가장 부드러움·큰 용량)
- 너비: 240(이모티콘), 320(소형), 480(권장 SNS), 640(블로그), 0(원본 — 비권장)

**UX**:
- 영상 업로드 시 미리보기 + duration + 시작/끝 자동 채움(0~5초). 첫 5초만 자동으로 — GIF는 짧을수록 좋음
- "현재 재생 위치로" 버튼 (trim과 동일 패턴)
- 30초 초과 시 confirm 대화상자 ("GIF가 50MB+ 될 수 있어요, 계속할까요?")
- 빠른 seek(`-ss/-to` -i 앞) 적용 — 1시간 영상에서 5초 구간만 잘라 GIF 만드는 케이스에서 디코드 양 최소화

**제약 안내**:
- "왜 GIF가 동영상보다 큰가?" FAQ로 256색 양자화 + 비효율 압축 설명
- "왜 색상이 깨져 보이나?" FAQ로 8-bit indexed color 설명
- 너비×fps×길이 표 — 480p·15fps·5초 = 4~10MB가 권장 baseline

## video/to-mp3 — 강한 저작권 disclaimer + LAME MP3

**핵심 args**:
```
-i input -vn -c:a libmp3lame -b:a Nk out.mp3
```

`-vn` = 비디오 트랙 제거(오디오만). `libmp3lame` = LAME MP3 인코더 (LGPL, ffmpeg core 빌드에 포함).

**비트레이트 5단계** = 96/128/192/256/320 kbps (권장 192). 표로 음성·일반·음악·고품질·최고 매핑 + "원본 비트레이트보다 높여도 음질 X" 안내.

**결과 미리보기** = `<audio controls preload="metadata">` (다른 video 도구는 `<video controls>`). 다운로드 전에 사용자가 들어볼 수 있게.

**저작권 disclaimer 강화** — 다른 도구와 가장 큰 차별점:

`.copyright-warning` 박스 (red border, font-size:14px, ⚠️ 제목):
- 위법 사례 3가지 bullet:
  - 유튜브·TV·영화·뮤직비디오 등 타인 저작물에서 음원 추출
  - OST·강연·음악 영상의 오디오 트랙 추출 후 재배포·SNS 업로드
  - 본인 사용(개인 감상) 목적이라도 저작권자 허락 없는 추출은 형사 처벌 대상
- footer = "사이트는 입력 영상을 외부로 전송하지 않으며, 모든 사용 책임은 사용자에게 있습니다"

JSON-LD `FAQPage` 첫 질문도 "어떤 경우에 합법적으로 사용할 수 있나요?"로 시작 — Google SERP에 노출되는 첫 메시지가 "본인 영상 한정"이 되도록.

**왜 다른 도구는 약한 disclaimer인가**:
- compress·trim·rotate·to-gif = 영상 자체를 변형(압축·자르기·회전·GIF). 저작권 침해는 사용자가 의도해야 발생 — 도구 자체는 중립적
- to-mp3 = 음원만 떼어내는 행위 자체가 일반적으로 음악/강의 등 저작물 추출과 직결. 도구 사용 시점이 곧 위법 시점이 될 수 있어 즉각적·강한 안내 필요

**검색 키워드 정책**:
- 키워드 = "동영상 mp3 추출·영상 음원 추출·영상에서 음악 추출·MP4 mp3 변환"
- title = "동영상 MP3 추출 | 영상 음원 추출 (본인 영상 한정·무료)" — `(본인 영상 한정)` 명시로 SERP 클릭 전 의도 필터링

**입력 안내 문구** = "본인 영상 파일을 드래그하거나 클릭해서 선택" — 일반 도구의 "영상 파일을" 대신.

## SEO 설정

**to-gif**:
- canonical `/video/to-gif/`
- title "동영상 GIF 변환 | 영상→GIF, 짤·움짤 만들기 (무료)"
- keywords = "동영상 GIF 변환·영상 GIF·짤 만들기·움짤 만들기·MP4 GIF·영상 GIF로 변환·카톡 움짤·영상 캡처 GIF"
- JSON-LD = WebApplication + BreadcrumbList + FAQPage(5)

**to-mp3**:
- canonical `/video/to-mp3/`
- title "동영상 MP3 추출 | 영상 음원 추출 (본인 영상 한정·무료)"
- keywords = "동영상 mp3 추출·영상 음원 추출·영상에서 음악 추출·MP4 mp3 변환·동영상 오디오 추출·영상 소리만 저장"
- JSON-LD = WebApplication + BreadcrumbList + FAQPage(5)

## 통합 작업

| 항목 | 변경 |
|---|---|
| `video/to-gif/{index.html, to-gif.js}` | 신규 |
| `video/to-mp3/{index.html, to-mp3.js}` | 신규 |
| `video/index.html` | hub count 3 → 5 + tool-card 2개 + ItemList 5 + keywords 갱신 |
| `video/compress/`·`trim/`·`rotate/` index.html | related-tools 섹션에 to-gif·to-mp3 라이브 링크 추가 |
| `index.html` (루트) | hub-card "LIVE · 3선" → "5선" + 카테고리 description + og·twitter·title·description·keywords + WebSite hasPart description + alternateName description "51선 → 53선" + quick-list "동영상" row 확장(GIF·MP3 추가) |
| `sitemap.xml` | `/video/to-gif/`, `/video/to-mp3/` 2 URL 추가 (58 → 60) |
| `tools/sw.js` | v14 유지 (image/ 패턴 동일) |
| `plan.md` | 헤더 53선/60 URL, §5.5.2 5선 모두 ✅ + to-gif·to-mp3 row args 추가, §9.1 출시 기록, §9.4 잔여 큐 정리(audio 카테고리 진입 후보 신규 추가) |
| `history/video/concepts.md` | §10 ffmpeg args 사전 + §11 -ss 위치 + §12 audio fallback 패턴 신규(이번 세션 추가) |

## ffmpeg args 추가 학습

이번 라운드에서 검증된 기법 — `concepts.md §10`에 사전화:

- **palettegen 옵션**: `stats_mode=diff` (움직임 가중) > `single` (전체 평균) — 움짤·짧은 영상에 적합
- **paletteuse 옵션**: `dither=bayer:bayer_scale=5` (구조적 패턴, 그라데이션 부드러움) > `none` (속도 우선, 거친 색대비) > `floyd_steinberg` (느림, 노이즈 패턴)
- **`-loop 0`**: GIF 무한 반복 (1+ = N번 반복 후 정지)
- **`-vn`**: 비디오 트랙 완전 제거. `-an`(오디오 제거)과 대칭
- **`libmp3lame -b:a Nk`**: LAME MP3 인코더 + 비트레이트 지정. ABR(Average) 모드 — VBR이 더 효율 좋지만 호환성 우선해 ABR

## 후속 작업

1. **로컬 실기기 검증** (전체 5도구): 첫 사용 ~32MB 다운로드 / IndexedDB 캐시 hit / iOS Safari 동작 / 큰 영상 메모리 한계 / single-thread 처리 시간 비교 / palette 필터 색상 품질 / MP3 비트레이트 음질 차이
2. **history/index.html 타임라인 카드** — 5도구 묶음 카드 (compress·trim·rotate·to-gif·to-mp3) 한 번에 추가
3. **PWA 통합 (A안)** = `tools/sw.js` STATIC_ASSETS에 모든 카테고리 + `video/vendor/*` 일괄 추가 — image/ 9선 + video/ 5선으로 진입 시점 도달
4. **audio 카테고리 진입 검토** (§5.5.3) — white-noise 1선부터 시작. WebAudio 0KB 인프라, 작업량 작음. video와 별개 도메인 (파일 처리 X 미디어 캡처)
5. **트래픽·체류 데이터 본 후 ROI 결정** — Search Console 첫 indexing 1~2주 후 video 카테고리별 검색 유입·체류 시간 비교 → 다음 카테고리 진입 우선순위
