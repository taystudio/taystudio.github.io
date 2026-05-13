# audit-13 — N10 폴더 drop 안내 + N11 clipboard paste 지원

**일자**: 2026-05-14
**컨텍스트**: 사용자 결정 "조용히 스킵되면 안 되는 기능들 있으니까 앱의 편의성도 고려해야함" — audit-5에서 발굴 후 보류됐던 마지막 N case 2건(N10·N11) 처리.

---

## 1. 배경

audit-5에서 발견한 5개 N case 중 N10·N11 두 건만 미처리 상태로 남아 있었음.

| 코드 | 케이스 | 위치 | 이전 상태 |
|---|---|---|---|
| N10 | drag-drop 폴더 → `file.type=''` → 조용히 skip → 사용자 혼동 | drop zone 27곳 | Low — 사용자 needs 확인 후 |
| N11 | Clipboard paste 이미지 (Ctrl+V) → checkFileSize 미적용 (핸들러 자체 없음) | image 카테고리 13 도구 | Low — 기능 미지원 |

두 건 모두 *결함*이라기보다 *기능 부재*에 가까워 보류돼 있었으나, macOS Finder에서 폴더 drag는 흔한 패턴이라 "고장난 도구"로 오인될 수 있다는 판단으로 진행.

---

## 2. 작업

### 2-1. site-chrome.js — utility 3종 추가

`common/site-chrome.js`에 IIFE 격리된 3개 공용 함수 추가. 기존 `checkFileSize`·`escapeHtml`·`sanitizeFilename` 패턴 따름.

| API | 역할 | 사용 패턴 |
|---|---|---|
| `TayStudio.showToast(msg, opts)` | 화면 하단 중앙 비파괴적 toast (alert 대안). `role=status`·`aria-live=polite`·safe-area 대응 | 일반 안내 |
| `TayStudio.rejectFolderDrop(event)` | dataTransfer 검사 → 폴더면 toast + true 반환 | `if (rejectFolderDrop(e)) return;` |
| `TayStudio.bindPasteImage(cb, opts)` | document `paste` 이벤트에서 image/* 추출 → cb(files) 호출. input/textarea 안에서는 무시 | image 도구 진입 함수 연결 |

KO·EN 메시지 자동 분기 (`<html lang>` + path).

### 2-2. N10 — drop handler 일괄 패치 (47곳)

drag-drop 지원 47개 위치에 폴더 감지 가드 한 줄 삽입.

| 카테고리 | 파일 수 | 패턴 |
|---|---|---|
| image | 13 + 12 (KO+EN) | drop 첫 줄에 `if (TayStudio.rejectFolderDrop(e)) return;` |
| pdf | 6 + 6 | 동일. `pdf-edit` 내부 페이지 reorder(`card.addEventListener('drop')`)는 제외 |
| video | 5 + 5 | 동일 |

자동화: python 정규식 일괄 처리 (multi-line / one-liner 두 패턴). pdf-edit의 내부 drop handler는 `count=1` 옵션으로 의도적 미적용.

### 2-3. N11 — clipboard paste 지원 (24곳)

image 카테고리 12개 도구 × KO+EN = 24 파일에 paste 핸들러 추가. 각 도구의 진입 함수에 자동 연결.

| 진입 함수 패턴 | 도구 |
|---|---|
| `loadFile(files[0])` (single) | bg-remove · compress · crop · id-photo · mosaic · ocr · resize |
| `addFiles(files)` (multi) | format-convert · heic-to-jpg · merge · watermark |
| `loadImageFile(files[0])` (custom) | qr-scan |
| **제외** | qr-gen (텍스트 입력) · upscale (stub) |

anchor: `dropZone.addEventListener('keydown'` 라인 바로 앞. IIFE indent 자동 보존.

### 2-4. SW CACHE_VERSION

`taystudio-v19` → `taystudio-v20`. site-chrome.js 변경이 캐시 invalidation 필요.

---

## 3. 검증 (Playwright spot-check)

`http://localhost:8765` dev server + browser_evaluate로 핵심 동작 검증.

### KO 페이지 — `/image/compress/`

| 항목 | 기대 | 실측 |
|---|---|---|
| 4 utility 로드 (`showToast·dropIsFolder·rejectFolderDrop·bindPasteImage`) | 모두 function | ✅ 4/4 |
| 폴더 simulated drop (`webkitGetAsEntry.isDirectory=true`) | `dropIsFolder` true | ✅ true |
| 정상 파일 simulated drop | `dropIsFolder` false | ✅ false |
| 폴더 drop 후 toast 표시 | KO 메시지·opacity=1 | ✅ "📁 폴더는 지원하지 않아요. 개별 파일을 떨어뜨려 주세요." |
| `bindPasteImage` callback chain | files 전달 + loadFile 호출 | ✅ caller까지 도달 (가짜 png blob → 디코딩 실패 alert는 의도된 동작) |

### EN 페이지 — `/en/image/merge/`

| 항목 | 기대 | 실측 |
|---|---|---|
| `rejectFolderDrop` EN 메시지 | EN 카피 표시 | ✅ "📁 Folder drop is not supported. Please drop individual files." |
| paste → addFiles (multi) 연결 | callback fired | ✅ caller 도달 (가짜 blob → "Some files were skipped" alert는 의도된 동작) |
| paste toast (EN) | "📋 Pasted 1 image" | ✅ |

콘솔 errors 3건은 localhost 외부 차단 (Google Ads + Cloudflare RUM) — 코드 무관.

### syntax 검증

`node --check`로 47 패치 파일 + site-chrome.js + sw.js 전수 통과. 오류 0건.

---

## 4. 영향

### 사용자 편의성

- **폴더 drop**: 이전엔 무반응 → "고장난 도구" 오인 가능. 이제 명확한 toast 안내 ("개별 파일을 떨어뜨려 주세요").
- **Ctrl+V paste**: 스크린샷 → 바로 압축·변환·크롭 등으로 이어지는 흐름이 한 단계 단축. 모바일은 paste 의미 작지만 데스크톱 사용자에게 큰 가치.

### 일관성

- 47곳 drop handler에 같은 가드 한 줄. 향후 신규 도구 추가 시 동일 한 줄만 넣으면 됨.
- 24곳 paste handler 동일 패턴. 새 image 도구는 `bindPasteImage` 한 블록만 추가.

### 추가 영향 — 기존 동작

- 정상 파일 drop: 기존 동작 유지 (`rejectFolderDrop` false 반환 → 진행).
- `pdf-edit` 페이지 reorder: 미변경 (내부 drag, 외부 파일 drop 아님).
- input/textarea 안 Ctrl+V: 무시 (텍스트 입력 흐름 보호).

---

## 5. 통과율

| 카테고리 | audit-12 | audit-13 | Δ |
|---|---|---|---|
| 일반 시나리오 | A+ | A+ | — |
| Edge | A+ | A+ | — |
| **사용자 편의성** | A | **A+** | +1 |
| **N case 미해결** | 2건 (N10·N11) | **0건** | -2 |
| 종합 | 99%+ | **99%+** | (정성적 개선) |

audit-12 시점에서 통과율은 사실상 천장. audit-13은 *수치 개선*보다 *마지막 미해결 N case 처리*와 *편의성 한 단계 상승*에 의미.

---

## 6. 후속

- **Optional**: 폴더 drop 시 toast만 띄우는 것이 아니라 폴더 내부 파일까지 자동 unfold 처리 — `webkitGetAsEntry → dirReader.readEntries` 비동기 순회 필요. 사용자 needs 데이터(Ctrl+V·drag 패턴 GA 이벤트) 확인 후 결정.
- **Optional**: pdf·video 카테고리도 paste 지원 검토. 단 paste용 데이터가 거의 image뿐이라 우선순위 낮음.

이제 모든 audit N case 정리 완료. 다음 단계는 INDEX.md "다음 단계" 1·2번 (외부 작업 + AdSense 모니터링).
