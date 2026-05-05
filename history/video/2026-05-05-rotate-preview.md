# video/rotate — source 미리보기 + "원래대로" 옵션 추가 (2026-05-05)

> **상태**: 적용 완료. ffmpeg 로드 무관하게 동작 (CSS transform만 사용).

## 의도

회전 도구는 ffmpeg.wasm으로 디코드 → 회전 → 재인코딩 과정이 필요 = 단일 스레드 0.3~1× 영상 길이 처리 시간. 사용자가 잘못된 옵션(예: cw90인 줄 알았는데 실제로는 ccw90 필요)을 선택해 처리하면 결과 보고 다시 처리 = 시간 2배 낭비. CSS `transform`으로 0KB·즉시 미리보기 = 처리 전 시각 검증 가능.

## 변경

### `video/rotate/index.html`

**HTML** — drop-zone 아래에 source 미리보기 박스 + 안내 문구:

```html
<div class="video-preview" id="sourcePreviewWrap" hidden>
  <video id="sourceVideo" controls playsinline preload="metadata" muted></video>
</div>
<div class="preview-hint" id="previewHint" hidden>
  ↑ 회전 옵션을 바꾸면 미리보기가 즉시 반영됩니다
  (시각 시뮬레이션 — 실제 처리는 아래 "회전하기" 버튼)
</div>
```

라디오 그리드 마지막에 6번째 옵션:

```html
<label class="rotate-opt">
  <input type="radio" name="rot" value="none">
  <span class="rotate-icon-wrap">
    <div class="rotate-icon">□</div>
    <div class="rotate-label">원래대로</div>
  </span>
</label>
```

**CSS** — 5종 transform + 90도 회전 시 max-height 제한:

```css
.video-preview video {
  display:block; max-width:100%; max-height:60vh;
  transition: transform .3s ease;
  transform-origin: center center;
}
.video-preview.rot-cw90 video  { transform: rotate(90deg); }
.video-preview.rot-ccw90 video { transform: rotate(-90deg); }
.video-preview.rot-rot180 video { transform: rotate(180deg); }
.video-preview.rot-hflip video { transform: scaleX(-1); }
.video-preview.rot-vflip video { transform: scaleY(-1); }
.video-preview.rot-cw90 video,
.video-preview.rot-ccw90 video {
  max-height: 50vh;  /* 90도 회전 시 가로 영상이 컨테이너 fit하도록 */
}
```

### `video/rotate/rotate.js`

새 DOM 참조 + `ROT_CLASSES` 상수 + `sourceUrl` state:

```js
const sourcePreviewWrap = document.getElementById('sourcePreviewWrap');
const sourceVideo = document.getElementById('sourceVideo');
const previewHint = document.getElementById('previewHint');
const ROT_CLASSES = ['rot-cw90', 'rot-ccw90', 'rot-rot180', 'rot-hflip', 'rot-vflip'];
let sourceUrl = null;
```

`applyRotPreview()` — 클래스 토글 + 버튼 활성/비활성:

```js
function applyRotPreview() {
  const op = getRot();
  ROT_CLASSES.forEach((c) => sourcePreviewWrap.classList.remove(c));
  if (op !== 'none') sourcePreviewWrap.classList.add('rot-' + op);
  rotateBtn.disabled = !currentFile || op === 'none';
}
```

`loadFile()`·`clearAll()`에 source URL 라이프사이클 + `applyRotPreview()` 호출 추가. 라디오 `change` listener:

```js
document.querySelectorAll('input[name="rot"]').forEach((r) => {
  r.addEventListener('change', applyRotPreview);
});
```

## "원래대로" 옵션 정책

- 미리보기 transform 모두 제거 → 원본 영상 그대로 표시
- `rotateBtn.disabled = true` (변환할 게 없으므로 처리 의미 X)
- **초기화 버튼과 분리**:
  - 초기화 = 영상 자체 제거 (`sourceVideo.removeAttribute('src')`, fileInput reset)
  - 원래대로 = 영상 유지·transform 리셋 (다른 회전 옵션과 비교 가능)

## CSS transform 트레이드오프

- **장점**: 0KB·즉시·GPU 가속·어떤 영상 크기에도 동작
- **한계**:
  - 90도 회전 시 video는 같은 width × height로 회전. 가로 영상(16:9)은 컨테이너에 fit, 세로 영상(9:16)은 회전 후 가로로 길어져 좌우 잘림 가능
  - `max-height: 50vh` 제한으로 완화하지만 정확한 결과는 처리 후 `resultVideo`에서 확인
  - hint 문구 "시각 시뮬레이션 — 실제 처리는 아래 버튼"으로 사용자 기대치 조정

## 다른 video 도구에 적용 검토

| 도구 | source preview 가치 | 미리보기 시뮬 가능 여부 |
|---|---|---|
| **compress** | 중간 (메타 표시) | 해상도·CRF 미리보기는 canvas decode 비용 큼 → 현실적 X |
| **trim** | ✅ 이미 적용 | 시작/끝 입력 + `<video preload=metadata>` |
| **rotate** | ✅ 본 작업으로 추가 | CSS transform 5종 |
| **to-gif** | 큼 | fps·width 시뮬 어렵지만 source preview + 시작/끝 시각은 trim 패턴 재사용 |
| **to-mp3** | X | 오디오 추출 도구 — `<audio>` 미리보기 의미 약함 |

우선순위: **to-gif > compress > to-mp3**.

## 관련 plan 항목

- §9.1 결정 기록 누적
- §9.4 다음 세션 후보 — 다른 video 도구에 source preview 패턴 적용 검토 (to-gif 1순위)
- §0.2 정적 한계까지 — ffmpeg 처리 전 시각 검증을 0KB로 해결한 케이스
