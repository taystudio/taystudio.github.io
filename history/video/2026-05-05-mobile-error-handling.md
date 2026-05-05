# 휴대폰 video 도구 에러 진단 + UX 보강 (2026-05-05)

> 사용자 보고: "휴대폰에서 동영상 처리 시 'requested file could not be read' 에러 다발. 노트북은 정상". PWA 적용 전후 모두 발생 = **PWA·SW와 무관**, 모바일 OS·브라우저 자체 제약.

## 원인 분석 (4 카테고리 + in-app 특수)

| 원인 | 환경 | 비중 | 메커니즘 |
|---|---|---|---|
| **iCloud / Google Photos 클라우드 영상** | iOS Optimize Storage / Android 백업 후 폰 삭제 | ★★★ 가장 흔함 | file input은 placeholder 받음 → arrayBuffer 호출 시 클라우드 다운로드 fail |
| **file 권한 만료** (handle invalidation) | iOS Safari·Chrome 모바일 | ★★ 흔함 | 영상 선택 후 시간 경과·다른 앱 갔다 옴 → handle invalidated → NotReadableError |
| iOS Safari 메모리 ~500MB 한계 | iOS 1GB+ 영상 | ★ 큰 영상만 | RangeError, OutOfMemory |
| iOS HEVC 자동 트랜스코딩 | iOS HEVC(.mov) → H.264 변환 | ★ 가끔 | 변환 중 권한·메모리 fail |
| **카톡·라인·페북·인스타 in-app** 자체 제약 | 인앱 webview | ★★★ in-app 진입 시 거의 항상 | 메모리 ~수백MB + file 권한 ~수 초 + WASM 제약 |

데스크톱은 file system 직접 access·메모리 충분·권한 영구 = 모든 케이스에서 안정.

## 3-단 fix

### fix 1 — `formatVideoError(error, {toolName, toolHint})` helper

`video/vendor/ffmpeg-loader.mjs`에 export. 5개 도구 공통 에러 포맷터.

```js
export function formatVideoError(error, { toolName = '동영상 처리', toolHint = '' } = {}) {
  const msg = (error && error.message) ? error.message : String(error);
  const isReadError = error && (
    error.name === 'NotReadableError' ||
    /could not be read|requested file could not|not allowed|file could not be opened/i.test(msg)
  );
  if (isReadError) {
    return {
      title: '영상 파일을 읽을 수 없습니다',
      body: '가장 흔한 원인:\n' +
        '• iCloud·Google Photos에 있는 영상 (폰에 실제 파일 없음, 클라우드에만)\n' +
        '• 영상 선택 후 시간이 지나 file 권한 만료\n\n' +
        '해결:\n' +
        '• 폰 사진 앱에서 영상을 미리 다운로드\n' +
        '• 영상 선택 직후 바로 처리 버튼 누르기\n' +
        '• 데스크톱 브라우저(Chrome·Edge·Firefox)에서 시도'
    };
  }
  return { title: toolName + ' 실패: ' + msg, body: '...해결 시도...' };
}
```

5개 도구(compress·trim·rotate·to-gif·to-mp3) 모두 catch 블록 갱신:

```js
catch (e) {
  const { title, body } = formatVideoError(e, { toolName: '...', toolHint: '...' });
  progressText.textContent = '실패: ' + title;
  alert(title + '\n\n' + body);
}
```

도구별 `toolHint`:
- trim: 시각 입력값·빠른/정확 모드 전환
- to-gif: 구간 짧게·너비 제한
- to-mp3: 음소거 영상 확인·자르기 후 추출
- compress·rotate: 공통 해결 시도

### fix 2 — `readVideoFile(file)` helper (적용은 별도)

```js
export async function readVideoFile(file) {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}
```

의도 = file 선택 직후 즉시 메모리에 read → 권한 만료 회피.

5개 도구 `loadFile`을 async 변경 + 즉시 호출 + `currentBuffer` state cache → run()에서 cached buffer 사용. **helper export만 적용, 5개 도구 변경은 별도** (사용자 in-app 외부 브라우저 진입 후 fail 사례 추가 보고 시 우선 진행).

트레이드오프 = 큰 영상 즉시 메모리 부담 (단 어차피 처리 시 read 필요).

### fix 3 — `/video/*` in-app 진입 자동 안내 배너

`common/site-chrome.js` IIFE — `/video/*` path + `isInAppBrowser()` true → 페이지 상단에 노란 sticky 배너 자동 삽입:

```js
(function autoVideoInAppWarning() {
  if (!isInAppBrowser()) return;
  if (!location.pathname.startsWith('/video/')) return;
  // 노란 배너 + "외부 브라우저로 열기" 버튼
})();
```

배너 내용:

> ⚠ in-app 브라우저는 동영상 처리에 부적합합니다
> 메모리·file 권한 한계로 자주 실패. **Chrome / Safari**에서 열면 안정적으로 동작합니다.
> [외부 브라우저로 열기]

버튼 클릭 = 기존 `showInAppRedirectModal` 재사용 (Android Chrome intent / iOS 메뉴 안내).

## 환경별 동영상 처리 가능성

| 환경 | 처리 | 안내 |
|---|---|---|
| 데스크톱 Chrome·Edge·Firefox | ✅ 안정적 | 권장 1순위 |
| Android Chrome 일반 | ✅ 동작 | 즉시 처리 권장 (지체 X) |
| 삼성 인터넷 | ✅ 동작 | 동일 |
| iOS Safari 일반 | ⚠️ 큰 영상 fail | 720p 이하·5분 이내 권장 |
| **카톡·라인 in-app** | ❌ 거의 fail | **자동 배너로 외부 브라우저 강제 안내** |
| Firefox 모바일 | △ 일부 동작 | 데스크톱 권장 |

## 학습 포인트

1. **모바일 file input의 권한은 영구 X** — 보안 정책상 짧은 유효기간. 큰 처리는 file 선택 직후 즉시 read해야
2. **iCloud·Google Photos 클라우드 영상** = file input은 placeholder 받음. 사용자 측에서 다운로드 후 시도해야
3. **in-app 브라우저는 "동영상 처리" 같은 무거운 도구에 부적합** — 메모리·권한·WASM 모두 제약. 사용자에게 외부 브라우저 강제 안내가 best UX
4. **에러 메시지는 사용자 행동 가능한 안내** — "requested file could not be read"는 generic. "iCloud 영상은 미리 다운로드"처럼 구체 행동 명시

## 사용자 검증 단계

1. 카톡에서 사이트 링크 → in-app 진입 → 노란 배너 + "외부 브라우저로 열기" 동작 확인
2. 외부 Chrome·Safari 진입 후 동영상 도구 시도
3. 에러 발생 시 새 안내 메시지(iCloud·권한 만료 등) 명확히 노출
4. 5개 도구 적용 결정 (`readVideoFile` integration) — 외부 브라우저에서도 fail 사례 보고 시 진행

## 9. rotate·to-gif 모바일 메모리 fix — 다운스케일 (2026-05-05 same-day 후속)

사용자 정정 보고: "**카톡 in-app 외 일반 모바일 Chrome·삼성 인터넷에서도 rotate·to-gif fail, trim 빠른모드만 성공**". → file 권한·in-app 제약 X = **재인코딩(libx264) 자체가 모바일 single-thread WASM 메모리 한계 초과**.

### 도구별 ffmpeg 부하 매트릭스

| 도구 | ffmpeg 동작 | 모바일 부하 |
|---|---|---|
| trim 빠른 | `-c copy` stream copy | 매우 적음 |
| trim 정확 | H.264 재인코딩 | 무거움 |
| **rotate** | 항상 H.264 재인코딩 + transpose | **무거움** |
| **to-gif** | decode + palettegen + paletteuse + GIF | **무거움** |
| compress | H.264 재인코딩 | 무거움 |
| to-mp3 | LAME MP3 (영상 디코드 X) | 중간 |

trim 빠른 모드만 stream copy라 디코드·인코딩 X = 메모리 매우 적음 → 모바일에서도 동작.

### fix 1 — rotate 출력 해상도 select

`video/rotate/index.html`:
```html
<select id="scale">
  <option value="orig">원본 유지 (데스크톱 권장)</option>
  <option value="1080">1080p (FHD)</option>
  <option value="720" selected>720p (HD · 모바일 권장)</option>
  <option value="480">480p (SD · 가장 가벼움)</option>
</select>
```

**default 720p** = 모바일 안전 + 데스크톱도 합리적. 사용자가 "원본 유지" 선택은 가능 (데스크톱 권장 명시).

`video/rotate/rotate.js`:
```js
function buildVfChain(op, scale) {
  const rot = OP_FILTER[op] || OP_FILTER.cw90;
  // 회전 전에 다운스케일 = 회전 시 메모리 절감 (회전 후 적용보다 효율)
  // -2 = 짝수 자동 정렬 (yuv420p 호환)
  if (scale && scale !== 'orig') {
    return `scale=-2:${scale},${rot}`;
  }
  return rot;
}

function buildArgs(inputName, outputName, op, audioMode, scale) {
  return [
    '-i', inputName,
    '-vf', buildVfChain(op, scale),
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
    '-pix_fmt', 'yuv420p',
    ...audioArgs,
    '-movflags', '+faststart',
    outputName,
  ];
}
```

scale filter 위치 = 회전 **앞**. 디코드된 프레임을 먼저 작게 만든 후 회전·인코딩 = 메모리 가장 적음.

### fix 2 — to-gif 모바일 default 320

`video/to-gif/to-gif.js`:
```js
(function applyMobileDefaults() {
  if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
  if (widthSel && widthSel.value === '480') {
    widthSel.value = '320';
  }
})();
```

이미 width select에 240·320·**480 default**·640·원본 옵션 있음. 모바일은 자동 320으로. 사용자 의식 X.

### 메모리 절감 효과 추정

| 입력 영상 | 원본 메모리/프레임 | 720p 메모리/프레임 | 절감 |
|---|---|---|---|
| 1080p (1920×1080) | ~2.0M 픽셀 | 1280×720 = ~0.9M | 1/2 |
| 1440p (2560×1440) | ~3.7M 픽셀 | 720p = ~0.9M | 1/4 |
| 4K (3840×2160) | ~8.3M 픽셀 | 720p = ~0.9M | **1/9** |

iOS Safari ~500MB / Android Chrome ~1GB 한계 안에 들어오게 됨.

### 학습 포인트 (추가)

5. **모바일 single-thread WASM에서 H.264 재인코딩은 본질적으로 무거움** — 720p 이하 권장이 합리적. 원본 해상도는 데스크톱 우선
6. **scale filter는 다른 filter 앞에 배치** — 디코드된 큰 프레임을 회전·기타 처리 전에 작게 만들면 메모리 절약 ↑
7. **모바일 default 자동 변경** = 사용자 행동 부담 X. UA 감지로 부드럽게 처리 가능

## 관련 plan 항목

- §9.1 결정 기록 (휴대폰 video 에러 진단 + UX 보강 + rotate·to-gif 다운스케일 fix)
- §9.4 다음 세션 — `readVideoFile` 5개 도구 적용 (사용자 OK 후) + rotate·to-gif fix 검증
- §0.2 GitHub Pages 정적 한계 — 모바일 single-thread + 메모리는 코드 최적화로 일부 회피 가능 (다운스케일·옵션 분기)
