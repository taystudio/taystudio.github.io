# video 카테고리 — 개념 정리 용어집

> 누적형 문서. WebCodecs·lamejs 등 새 개념 등장 시 같은 파일에 섹션 추가. (SEO `history/seo/concepts.md` 패턴 동일)
>
> **최종 갱신**: 2026-05-05 (to-gif·to-mp3 출시로 5선 완료. §13 palette 단일패스 패턴 + §14 GIF가 동영상보다 큰 이유 추가, §10 GIF/MP3 args 채움)

---

## 1. WASM (WebAssembly)

### 1.1 한 줄 정의

**브라우저에서 돌아가는 바이너리 포맷.** C/C++/Rust 같은 네이티브 언어를 컴파일하면 `.wasm` 파일이 나오고, 브라우저가 이를 거의 네이티브 속도로 실행.

### 1.2 백엔드 비유 (Go 기준)

| 영역 | 비유 |
|---|---|
| WASM 바이트코드 | JVM bytecode와 비슷 — 사전 컴파일된 명령 스트림 |
| 브라우저 V8/JSC/SpiderMonkey | JVM 같은 런타임 |
| JS | 인터프리터/JIT 언어 (Python 가깝게) |
| WASM | **사전 컴파일된 바이너리** (Go 정적 바이너리 가깝게) |

JS로 무거운 연산(인코딩·압축·암호화) 짜면 10~100배 느림. WASM은 거의 네이티브 → 브라우저 안에서 무거운 작업 처리 가능해진 게 본질.

### 1.3 왜 video에 WASM이 필요한가

JS로 H.264 인코더 처음부터 짜면 비현실적. 이미 검증된 C 라이브러리(ffmpeg, libx264)를 그대로 컴파일해서 가져오는 게 현실적인 길 = WASM의 본질.

대안:
- **WebCodecs API** — 브라우저 네이티브 동영상 인코딩/디코딩. Safari 16+·Chrome 94+. 빠름·메모리 효율 좋음. 단 코덱 종류·옵션 제한 (CRF·preset 같은 ffmpeg 세부 옵션 X)
- **ffmpeg.wasm** — 호환성·옵션 자유도 ★. 단 WASM 바이너리 ~32MB 다운로드 + single-thread 속도 제약

현 결정 = **ffmpeg.wasm**. WebCodecs는 향후 도구별로 fallback fast-path 검토.

---

## 2. 영상 파일 = 컨테이너 + 코덱 (가장 헷갈리는 부분)

### 2.1 한 줄 정의

영상 파일 1개 = **컨테이너** (포장지) + **비디오 코덱** (그림 압축 방식) + **오디오 코덱** (소리 압축 방식). 셋 다 분리 개념.

확장자(`.mp4`·`.webm`·`.mov`)는 컨테이너만 가리킴 — 안에 어떤 코덱이 들어 있는지는 별개.

### 2.2 컨테이너 — 확장자가 가리키는 "포장지"

| 컨테이너 | 확장자 | 출처·용도 |
|---|---|---|
| **MP4** | `.mp4` | 사실상 표준. 거의 모든 디바이스 |
| **MOV** | `.mov` | 애플 QuickTime — 아이폰 기본 녹화 포맷 |
| **WebM** | `.webm` | 구글 푸시 (유튜브 내부, 화상회의, 광고) |
| **MKV** | `.mkv` | 영화 파일·다중 트랙·자막 임베드 |
| **AVI** | `.avi` | 옛 윈도우 표준 (지금은 거의 안 씀) |

컨테이너 = **메타데이터 박스**. 안에 비디오 트랙·오디오 트랙·자막·duration·해상도·fps 등을 묶어 놓음. 실제 압축은 안에 들어 있는 코덱이 함.

비유: ZIP 파일과 그 안의 .txt/.png — ZIP은 포장, 진짜 알맹이는 따로.

### 2.3 코덱 — 진짜 압축 알고리즘

**비디오 코덱**:
- **H.264 (AVC)** — 가장 호환성 좋음. 우리 출력 = 이거. 카톡·아이폰·삼성·스마트TV 다 됨
- **H.265 (HEVC)** — H.264 후속, 같은 화질에 50% 작음. 단 모바일 디코딩 호환성 아직 빈틈, 라이선스 비쌈
- **VP9** — 구글 무료 대안 (WebM 안에 주로 들어감). 호환성 H.264보단 약함
- **AV1** — 차세대 무료. 인코딩 매우 느림, 디코딩 호환성 진행 중

**오디오 코덱**:
- **AAC** — MP4 표준. 우리 출력 = 이거
- **MP3** — 가장 넓은 호환성, 효율은 떨어짐
- **Opus** — WebM에 들어감, 압축 효율 ★

### 2.4 컨테이너 ↔ 코덱 조합 (중요)

같은 컨테이너에 다른 코덱이 들어갈 수 있음:

- `.mp4` 안에 H.264+AAC (표준) / H.265+AAC / AV1+Opus 가능
- `.webm` 안에 VP9+Opus (표준) / VP8+Vorbis / AV1+Opus 가능
- `.mov` 안에 H.264+AAC (아이폰) / ProRes+PCM (영상편집용) 가능

그래서 "MP4 파일이라고 다 호환되는 건 아님" — 안에 어떤 코덱이 들어 있냐가 진짜 호환성 결정.

### 2.5 그래서 우리 정책 — 입력 자유, 출력 고정

**입력** = ffmpeg가 디코딩 가능한 거의 모든 컨테이너+코덱 조합 (MP4·MOV·WebM·MKV·AVI ...)

**출력** = **MP4 컨테이너 + H.264 비디오 + AAC 오디오** 고정

이유:
- "압축한 영상이 카톡에서 안 열려요" 컴플레인을 0에 가깝게
- H.264 + AAC = 2026년 현재 가장 넓은 호환성 (아이폰 4부터 지원)
- 출력 옵션 늘려도 사용자는 거의 안 만짐 — `plan §0.4` 좁은 도구 정신

**그래서 입력은 다양한데 출력은 MP4 하나**. WebM·MOV로 받아도 자동으로 MP4로 변환 출력.

---

## 3. repo에 정확히 깐 것 — 인프라의 전부

### 3.1 직접 작성 (repo에 들어 있는 코드)

```
video/vendor/ffmpeg-loader.mjs   ← 우리가 짠 ESM wrapper, 137줄
```

**이게 끝.** ffmpeg 본체(~32MB)는 repo에 없음 — GitHub repo에 32MB 바이너리 넣으면 clone·CI 시간 부담.

### 3.2 런타임 fetch — CDN에서 사용자 브라우저로 직접

사용자가 video 도구 페이지를 처음 열면, 그때 브라우저가:

```
jsdelivr CDN (https://cdn.jsdelivr.net/npm/...)
  ├─ @ffmpeg/ffmpeg@0.12.10/+esm           (~50KB JS API)
  ├─ @ffmpeg/core@0.12.6 ffmpeg-core.js    (~수백 KB Emscripten glue)
  └─ @ffmpeg/core@0.12.6 ffmpeg-core.wasm  (~32MB 본체)
```

세 개 모두 **사용자 브라우저로 직접** 다운로드 — 우리 서버 거치지 않음. 애초에 GitHub Pages는 "정적 호스팅"이라 서버 사이드 처리가 없음.

### 3.3 사용자 브라우저 안에 캐시 — IndexedDB

위 3개 중 큰 둘 (`ffmpeg-core.js` + `ffmpeg-core.wasm`)은 **사용자 브라우저의 IndexedDB**에 Blob으로 저장 → 두 번째 방문부터 ~32MB 다시 안 받음.

DB 이름·캐시 키 전략·동시성 처리 = §5 wrapper 동작 상세 참고.

### 3.4 그림으로

```
┌──────────────────────────────────────────────────────────┐
│  GitHub repo (taystudio.github.io)                       │
│  └─ video/vendor/ffmpeg-loader.mjs   ← 우리가 짠 137줄    │
└──────────────────────────────────────────────────────────┘
                        │ 사용자가 video 도구 페이지 열면
                        ▼
┌──────────────────────────────────────────────────────────┐
│  사용자 브라우저                                         │
│                                                          │
│  1. ffmpeg-loader.mjs 실행                               │
│  2. IndexedDB 확인 → 없으면 jsdelivr CDN에서 fetch (~32MB)│
│  3. IndexedDB에 Blob 저장 (다음 방문부터 즉시)           │
│  4. WASM 인스턴스 메모리에 로드                          │
│  5. 사용자 영상 → ffmpeg.wasm 처리 → 결과 Blob           │
└──────────────────────────────────────────────────────────┘

  → 우리 서버: 없음 (GitHub Pages는 정적 호스팅)
  → 사용자 영상: 외부로 절대 안 나감
```

### 3.5 한 줄 요약

**인프라 = 우리 repo 137줄 + jsdelivr CDN + 사용자 브라우저 IndexedDB.**

백엔드 0, 서버 처리 0, 사용자 영상 업로드 0. `plan §0.2` "정적 한계까지" 정신의 시각적 증거.

---

## 4. ffmpeg.wasm 패키지 구조

### 4.1 두 패키지로 분리되어 있음

```
@ffmpeg/ffmpeg@0.12.10  ← JS API 래퍼 (~50KB, 얇음)
@ffmpeg/core@0.12.6     ← 진짜 ffmpeg 바이너리
  ├─ ffmpeg-core.js     (Emscripten glue JS, ~수백 KB)
  └─ ffmpeg-core.wasm   (~32MB, 본체)
```

**Go 비유**:
- `@ffmpeg/ffmpeg` = client SDK (메서드 시그니처·이벤트 emitter)
- `@ffmpeg/core` = 백엔드 바이너리 (실제 인코딩 처리)

분리 이유 = wrapper는 자주 갱신해도 core는 거의 안 바뀜. 캐시 전략 분리하기 좋음.

### 4.2 single-thread vs multi-thread

`@ffmpeg/core`는 두 종류:
- `@ffmpeg/core` — **single-thread** (현 사용)
- `@ffmpeg/core-mt` — multi-thread (사용 불가, §6 참고)

---

## 5. 우리 인프라 — `video/vendor/ffmpeg-loader.mjs`

자체 작성한 ESM wrapper 1개. 137줄. 새 video 도구는 모두 이 wrapper 한 줄로 시작:

```js
import { loadFFmpeg, toUint8Array } from '/video/vendor/ffmpeg-loader.mjs';
const ffmpeg = await loadFFmpeg(onProgress);
```

### 5.1 역할 4가지

**(1) 동적 import + CDN fetch** (`video/vendor/ffmpeg-loader.mjs:19-21`)

`@ffmpeg/ffmpeg`은 jsdelivr `+esm` 으로 동적 ESM import (`video/vendor/ffmpeg-loader.mjs:104`). core.js·core.wasm은 직접 `fetch()`. 라이브러리 자체를 repo에 담지 않는 이유 = 32MB는 GitHub repo 부담.

**(2) IndexedDB 캐시** (`video/vendor/ffmpeg-loader.mjs:23-63`)

- DB: `taystudio-video` / store: `wasm-cache`
- 키: `core-js-0.12.6` / `core-wasm-0.12.6` (버전 pin → 업그레이드 시 키 바뀌어 자동 재 fetch)
- 첫 방문: fetch → Blob → IndexedDB put
- 두번째: dbGet → Blob hit → `URL.createObjectURL(Blob)`로 메모리 매핑 → 즉시 시작

**Go 비유**: Docker layer 캐시. 한 번 pull한 layer는 다음부턴 로컬에서.

**(3) Singleton + 진행률 콜백** (`video/vendor/ffmpeg-loader.mjs:89-128`)

```js
let ffmpegInstance = null;     // 인스턴스 캐시
let loadingPromise = null;     // 동시 호출 중복 방지
```

같은 페이지에서 두 번 호출해도 한 번만 다운로드. 진행률은 `onProgress({ key, current, total })` 콜백으로 단계별 전달:

| key prefix | 의미 |
|---|---|
| `init` | 시작점 |
| `cache:<file>` | IndexedDB hit (즉시) |
| `fetch:<file>` | CDN 다운로드 중 (received / total bytes) |
| `compute:transcode` | ffmpeg 인코딩 진행률 (0~1) |

도구 페이지는 prefix로 진행 바 단계 구분.

**(4) Fallback — 캐시 실패 시 동작 보장** (`video/vendor/ffmpeg-loader.mjs:60-62`)

`dbPut`은 try/catch로 감싸 silent skip. Safari Private mode·iOS 할당량 초과·디스크 풀 → 캐시 실패해도 fetch는 성공 → 인코딩 동작. 다음 방문 시 다시 fetch 시도.

### 5.2 export 2개

```js
loadFFmpeg(onProgress)         // FFmpeg 인스턴스 (singleton)
toUint8Array(blob)             // File/Blob → Uint8Array (ffmpeg.writeFile 입력용)
```

이게 전부. 도구 코드는 `ffmpeg.writeFile(name, bytes)` → `ffmpeg.exec([...args])` → `ffmpeg.readFile(out)` 3단계로 끝남.

---

## 6. Single-thread 제약 — 가장 큰 트레이드오프

### 6.1 왜 multi-thread 못 쓰나

WASM multi-thread = `SharedArrayBuffer` 필요. SharedArrayBuffer는 Spectre/Meltdown 사이드채널 공격 방지로 **응답 헤더 2개를 강제**:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

이 헤더가 없으면 브라우저가 SharedArrayBuffer 비활성화. **GitHub Pages는 응답 헤더 커스터마이징 불가** → 헤더 못 박음 → SharedArrayBuffer X → `@ffmpeg/core-mt` 불가.

### 6.2 트레이드오프

- 인코딩 속도 = 원본 길이의 **0.3~1×** (5분 1080p ≈ 1~3분, 데스크톱 기준)
- multi-thread면 4~8× 빨라질 수 있음

회피 못함. 우회책:
- 사용자에게 "데스크톱 + 720p 이하 + 5~10분 이내" 안내 (`.first-time-notice` 박스 + FAQ)
- 정적 호스팅 유지(Vercel·Netlify는 헤더 가능하지만 §0.2 정신상 GitHub Pages 우선)
- 백엔드 도입은 video 처리 비용 부담 커서 ROI 약함

### 6.3 iOS Safari 메모리 한계

별개 제약. 단일 탭 메모리 ~500MB → 1080p·30분 이상 영상은 강제 종료 가능. 이건 multi-thread 여부와 무관 — WASM heap 자체가 모바일에서 빡빡.

---

## 7. 새 video 도구 추가 시 재사용 패턴

`video/compress/` 패턴 그대로 복제 + ffmpeg args만 바꾸면 됨. 도구당 작업량 작음.

### 7.1 도구 페이지 표준 구조

```
video/<slug>/
  ├─ index.html       (form / progress / result)
  └─ <slug>.js        (ffmpeg args + UI 핸들러)
```

### 7.2 JS 골격

```js
import { loadFFmpeg, toUint8Array } from '/video/vendor/ffmpeg-loader.mjs';

async function process(file, opts, onProgress) {
  const ffmpeg = await loadFFmpeg(onProgress);
  await ffmpeg.writeFile('in.mp4', await toUint8Array(file));
  await ffmpeg.exec([
    '-i', 'in.mp4',
    // ... 도구별 args
    'out.mp4',
  ]);
  const data = await ffmpeg.readFile('out.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}
```

### 7.3 도구별 ffmpeg args 메모

| 도구 | 핵심 args |
|---|---|
| **compress** ✅ | `-c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p -vf scale=-2:720 -c:a aac -b:a 128k -movflags +faststart` |
| **trim** | `-ss <start> -to <end> -c copy` (재인코딩 X = 빠름) |
| **to-gif** | `-vf "fps=15,scale=480:-2:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"` |
| **to-mp3** | `-vn -c:a libmp3lame -b:a 192k` (저작권 disclaimer 박스 추가) |
| **rotate** | `-vf transpose=1` (90° CW) / `transpose=2` (CCW) / `vflip` / `hflip` |

### 7.4 페이지 내 필수 요소

- `.first-time-notice` 박스 — 첫 사용 ~32MB 다운로드 / Wi-Fi 권장 / 모바일 메모리 제약
- progress bar — `onProgress` key prefix별 단계 표시
- 결과 영역 — `<video controls>` + 원본/처리 후 용량·해상도·소요 시간
- FAQ 5+ (JSON-LD FAQPage 동기) — single-thread 속도·iOS 메모리·privacy·지원 포맷 등
- sources note — ffmpeg/H.264/CRF 1차 출처 (memory feedback `수치 출처 정확성`)

---

## 8. privacy — 사이트 시그니처 메시지

ffmpeg.wasm 인프라의 차별화 = **사용자 영상이 외부 서버로 전송 X**. 다운로드되는 건 ffmpeg 바이너리 자체뿐.

각 video 도구 페이지 `.privacy-box` 메시지:
> "영상은 브라우저 안에서만 처리됩니다. 어떤 서버로도 업로드되지 않습니다."

이게 클라우드 클론(클립챔프·온라인 컨버터·기타) 대비 가장 강한 차별점이며 광고 친화도도 높임 (체류 시간↑·신뢰↑). image/ 카테고리에서 검증된 패턴 동일 적용.

---

## 9. 향후 누적 슬롯 (개념 등장 시 추가)

- **WebCodecs API** — Safari 16+ 네이티브 인코딩. trim·rotate 등 옵션 단순한 도구의 fast-path 후보
- **MediaRecorder API** — 브라우저 화면/카메라 직접 녹화 (audio/voice-recorder에서 등장 예정)
- **lamejs** — MP3 인코딩 (audio/audio-trim·voice-recorder에서 등장 예정)
- **WebAudio API** — audio/ 카테고리 진입 시
- **OffscreenCanvas + Worker** — 메인 스레드 차단 회피 패턴
- **palettegen / paletteuse** — to-gif 출시 시 §10에 추가 (GIF 256색 양자화 2-pass 패턴)

---

## 10. ffmpeg args 용어 사전

trim·rotate·compress 출시까지 등장한 옵션들. 새 도구 작업 시 여기 보고 골라 쓰면 됨.

### 10.1 입력·출력 (필수)

| 옵션 | 의미 |
|---|---|
| `-i <name>` | 입력 파일. ffmpeg.wasm MEMFS에 미리 `writeFile`로 올린 이름 |
| `<output_name>` | 출력 파일명 (args 마지막). 보통 `out.mp4` |

### 10.2 비디오 코덱·화질

| 옵션 | 의미 |
|---|---|
| `-c:v libx264` | 비디오 코덱 = H.264 (가장 호환성 좋음) |
| `-c:v copy` | 비디오 재인코딩 X — 스트림 그대로 복사 (빠름) |
| `-preset ultrafast` | 인코딩 속도 vs 압축률 트레이드오프. single-thread WASM 환경 = `ultrafast` 거의 강제. (slow일수록 작은 파일 + 느림) |
| `-crf 18~35` | Constant Rate Factor. 낮을수록 고화질·큰 파일. 18=거의 무손실 / 23=일반 권장 / 28=웹·메신저 / 35=강한 압축 |
| `-pix_fmt yuv420p` | 픽셀 포맷. Safari·QuickTime 호환을 위해 사실상 필수 — 빠지면 결과 영상 일부 플레이어에서 재생 X |

### 10.3 오디오 코덱

| 옵션 | 의미 |
|---|---|
| `-c:a aac -b:a 128k` | AAC 코덱 + 비트레이트 128kbps. MP4 표준 |
| `-c:a copy` | 오디오 재인코딩 X — 무손실 복사. 단 일부 입력 코덱(AC-3·DTS) MP4 호환 X → fallback 필요 (§12) |
| `-an` | 오디오 트랙 제거 (음소거 영상 출력) |
| `-vn` | 비디오 트랙 제거 (오디오만 추출, to-mp3에서 사용 예정) |
| `-c:a libmp3lame -b:a 192k` | MP3 인코딩 (to-mp3 출시 시) |

### 10.4 필터 (`-vf`)

`-vf "<filter>[,<filter>...]"` 형태로 체이닝. 분기/병합은 `[label]` + `;` 사용 (filter graph 문법).

| 필터 | 의미 |
|---|---|
| `scale=W:H` | 해상도 변경. `-2`는 "다른 축에 맞춰 자동, 짝수 보장" (예: `scale=-2:720` = 높이 720, 너비 자동 짝수). `flags=lanczos` 추가 시 고품질 보간 |
| `transpose=N` | 회전. 1=CW90 / 2=CCW90 / 0=CCW90+vflip / 3=CW90+vflip. 두 번 연속 = 180° |
| `hflip` | 좌우 반전 (거울) |
| `vflip` | 상하 반전 |
| `fps=N` | 초당 프레임 수 변경 (to-gif에서 15 권장) |
| `split[s0][s1]` | 같은 스트림을 두 갈래로 분기 (filter graph 분기점) |
| `palettegen=stats_mode=diff` | 영상 분석 → 256색 색상표 생성. `diff` = 움직임 가중 (움짤 적합) / `single` = 전체 평균 / `full` = 프레임별 |
| `paletteuse=dither=bayer:bayer_scale=5` | 색상표 적용 + dithering. `bayer` = 구조적 패턴(그라데이션 부드러움) / `none` = 빠름·거침 / `floyd_steinberg` = 느림·노이즈 |

### 10.5 seek·자르기

| 옵션 | 의미 |
|---|---|
| `-ss <시각>` | 시작 시각 (초 또는 HH:MM:SS). 위치에 따라 동작 다름 — §11 |
| `-to <시각>` | 끝 시각 (절대 시각 — `-ss`로부터의 길이가 아님) |
| `-t <duration>` | 길이(`-to`의 대안. 길이로 지정) |
| `-avoid_negative_ts make_zero` | 빠른 모드(`-c copy`)에서 잘린 첫 프레임의 timestamp가 음수가 되지 않게 — 첫 프레임을 t=0으로 보정 |

### 10.6 컨테이너·메타

| 옵션 | 의미 |
|---|---|
| `-movflags +faststart` | MP4 메타데이터(`moov` atom)를 파일 앞쪽으로 이동 → 웹 재생 시 전체 다운로드 전에 시작 가능. **출력 MP4면 거의 항상 추가** |
| `-f <format>` | 출력 포맷 강제 지정 (보통 확장자로 자동 추론, 명시 필요한 경우만) |
| `-loop N` | GIF 반복. 0 = 무한, 1+ = N번 반복 후 정지 |

### 10.7 표준 args 조합 — 도구별

```
compress :  -i in.mp4 -c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p
            -vf scale=-2:720 -c:a aac -b:a 128k -movflags +faststart out.mp4

trim 빠른 : -ss 30 -to 90 -i in.mp4 -c copy -avoid_negative_ts make_zero
            -movflags +faststart out.mp4

trim 정확 : -i in.mp4 -ss 30 -to 90 -c:v libx264 -preset ultrafast -crf 23
            -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart out.mp4

rotate    : -i in.mp4 -vf transpose=1 -c:v libx264 -preset ultrafast -crf 23
            -pix_fmt yuv420p -c:a copy -movflags +faststart out.mp4

to-gif    : -ss 30 -to 35 -i in.mp4
            -vf "fps=15,scale=480:-2:flags=lanczos,split[s0][s1];
                 [s0]palettegen=stats_mode=diff[p];
                 [s1][p]paletteuse=dither=bayer:bayer_scale=5"
            -loop 0 out.gif

to-mp3    : -i in.mp4 -vn -c:a libmp3lame -b:a 192k out.mp3
```

---

## 11. `-ss` 위치의 의미 — `-i` 앞 vs 뒤 (trim 핵심 결정)

같은 옵션이 위치에 따라 동작이 완전히 달라지는, ffmpeg에서 가장 헷갈리는 지점.

### 11.1 `-ss`를 `-i` **앞**에 두면 (input seek)

```
-ss 30 -to 90 -i in.mp4 -c copy out.mp4
```

ffmpeg가 **input을 처음부터 디코드하지 않고** 컨테이너 인덱스로 바로 키프레임으로 점프 → 매우 빠름 (1GB 영상도 수 초).

**대가** = 키프레임(I-frame, 보통 1~5초 간격) 단위로만 정확. 지정한 시각이 키프레임 사이면 가까운 앞쪽 키프레임으로 끌려감. `-c copy`와 짝꿍.

### 11.2 `-ss`를 `-i` **뒤**에 두면 (output seek)

```
-i in.mp4 -ss 30 -to 90 -c:v libx264 ... out.mp4
```

ffmpeg가 input을 처음부터 **디코드하면서** seek → 정확한 프레임에서 잘림. 단 디코드 시간 소비 + 재인코딩 짝꿍이 자연스러움.

### 11.3 trim 도구의 결정

- 빠른 모드 = `-i 앞` + `-c copy` (대부분 사용자 케이스에 충분)
- 정확 모드 = `-i 뒤` + 재인코딩 (강의·인터뷰·정확 컷)

향후 다른 도구에서도 "input scan을 건너뛰고 싶은가? → `-ss`를 앞에" 가 황금 룰.

---

## 12. 오디오 fallback 패턴 — `-c:a copy` 실패 시 자동 AAC 재인코딩

rotate 도구에서 검증된 패턴. 오디오 무손실 복사가 항상 가능한 건 아니라서 1차/2차 시도로 분리.

### 12.1 왜 1차 `-c:a copy`가 실패하나

MP4 컨테이너는 모든 오디오 코덱을 담을 수 없음. 입력 영상이 AC-3(돌비)·DTS·LPCM·Vorbis 등 MP4와 호환 안 되는 오디오를 가지고 있으면 `-c:a copy`로 그대로 복사할 때 ffmpeg가 거부 (`Could not write header`).

WebM에서 받은 영상(Opus 오디오)도 MP4로 출력할 때 같은 이슈.

### 12.2 패턴

```js
async function tryExec(ffmpeg, inputName, outputName, op) {
  // 1차: 오디오 무손실 복사
  try {
    await ffmpeg.exec(buildArgs(inputName, outputName, op, 'copy'));
    return 'copy';
  } catch (_) {
    // 2차: 1차 실패 → outputName 잔여 정리 후 AAC 재인코딩
    try { await ffmpeg.deleteFile(outputName); } catch (_) {}
    await ffmpeg.exec(buildArgs(inputName, outputName, op, 'aac'));
    return 'aac';
  }
}
```

`buildArgs`는 `audioMode` 인자를 받아 `-c:a copy` 또는 `-c:a aac -b:a 128k`를 분기.

### 12.3 적용 기준

- **무손실이 가치 있는 도구**: rotate (영상만 변형, 오디오는 손대지 말아야) → fallback 패턴 사용
- **오디오를 어차피 재인코딩하는 도구**: compress (사용자가 "AAC 재인코딩 / 무손실 복사 / 제거" 직접 선택) → 사용자 옵션으로 노출
- **빠른 모드만 있는 도구**: trim 빠른 모드는 `-c copy`로 통째로 복사하므로 별도 fallback 없음. 정확 모드는 재인코딩 디폴트라 무관

### 12.4 향후 적용 예정

- to-mp3 = 어차피 MP3로 재인코딩이라 fallback 불필요 (✅ 적용 안 함, 2026-05-05 출시)
- to-gif = 오디오 자체 없음 (`-an`도 안 씀, GIF에 오디오 트랙 X) (✅ 적용 안 함, 2026-05-05 출시)

---

## 13. palette 단일패스 split 패턴 — to-gif 핵심 결정

GIF는 한 프레임 256색 한계. 색상표(palette)를 영상 분석으로 만들고 그 색상표로 dithering하는 게 핵심. 전통적으로 2-pass 호출이 권장되지만 ffmpeg.wasm에서는 single-pass split이 더 깔끔.

### 13.1 전통 2-pass (참고용 — 미사용)

```js
// Pass 1: palette 생성
await ffmpeg.exec(['-i', 'in.mp4', '-vf', 'fps=15,scale=480:-2:flags=lanczos,palettegen', 'palette.png']);
// Pass 2: palette 적용
await ffmpeg.exec(['-i', 'in.mp4', '-i', 'palette.png',
                   '-filter_complex', 'fps=15,scale=480:-2:flags=lanczos[x];[x][1:v]paletteuse',
                   'out.gif']);
```

**단점**:
- exec 두 번 호출
- 중간 파일 `palette.png`을 MEMFS에 작성 → 정리 필요
- 진행률 콜백이 두 단계로 끊김 (사용자 표시 복잡)

### 13.2 single-pass split (현 사용)

```js
const filter =
  'fps=15,scale=480:-2:flags=lanczos,' +
  'split[s0][s1];' +
  '[s0]palettegen=stats_mode=diff[p];' +
  '[s1][p]paletteuse=dither=bayer:bayer_scale=5';

await ffmpeg.exec(['-ss', '30', '-to', '35', '-i', 'in.mp4', '-vf', filter, '-loop', '0', 'out.gif']);
```

**필터 그래프 흐름**:
```
input → fps → scale → split ┬→ [s0] → palettegen → [p]
                            └→ [s1] ──────────────┐
                                                  ▼
                                            paletteuse → out.gif
                                                  ▲
                                                [p]
```

`split`이 같은 스트림을 두 갈래로 복제 → 한쪽은 색상표 생성, 다른쪽은 그 색상표로 변환. exec 한 번에 끝.

### 13.3 옵션 선택 근거

- `palettegen=stats_mode=diff` — 움직이는 부분 색상에 가중치. 정적 평균(`single`)보다 짤·움짤에 적합
- `paletteuse=dither=bayer:bayer_scale=5` — 구조적 dither 패턴. 그라데이션·노을 색이 부드러움. `none`은 거친 색대비, `floyd_steinberg`는 노이즈 패턴

### 13.4 ffmpeg.wasm 특이 사항

`-filter_complex` 대신 `-vf`로도 split 사용 가능 (단일 입력 단일 출력 필터 그래프라). `-filter_complex`는 다중 입력(`-i a -i b ...`)에서 필요.

---

## 14. GIF가 왜 동영상보다 큰가 — 사용자에게 자주 받는 질문

수치 직관: 5초 480p 영상 = MP4로 1~3MB / 같은 영상 GIF = 5~20MB.

### 14.1 GIF 압축의 한계

- **256색 한계** (8-bit indexed color, 1989 GIF89a 표준) — H.264는 16~32-bit 색공간
- **프레임 간 압축 약함** — H.264는 motion compensation으로 "이전 프레임 + 차이"만 저장. GIF는 LZW + 약한 frame difference. 빠른 움직임에서 효율 격차 심함
- **무손실 LZW** — JPEG/H.264 같은 perceptual loss 활용 X
- **알파 채널 1-bit** — 부드러운 투명도 X (불투명/투명 둘 중 하나)

### 14.2 적정 사용 영역

GIF는 **짧은 짤·움짤**(≤ 10초, 480px 이하)에서만 합리적. 그 이상이면 MP4를 그대로 쓰는 게 합리적 — 카톡/SNS도 짧은 MP4를 자동 재생함.

사이트 권장 = fps 15 + 너비 480px + 길이 ≤ 10초 (4~10MB). FAQ + 페이지 내 표로 노출.

### 14.3 사용자 안내 패턴

- ≤ 30초: 자유
- > 30초: confirm 대화상자 ("GIF가 50MB+ 될 수 있어요, 계속할까요?")
- 너비 "원본"(예: 1080p) 옵션은 표에서 "비권장 — MP4 그대로 쓰는 게 나음" 명시

