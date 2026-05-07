# AI 이미지 업스케일링 봉인 — image/upscale/ 일시 비공개 (2026-05-06)

> 같은 일자 출시한 AI 이미지 업스케일링 도구를 사용자 검증 직후 **봉인**. 맥북에서도 브라우저 freeze 심함. TF.js + ESRGAN WebGL 추론이 정적 사이트 차원에서 메인 스레드 점령 → UI 응답 불능. 다양한 fix(patchSize·model variant·setTimeout yield) 시도했지만 근본 해결 X. 도구 수 59 → **58선 복귀**, image 10 → **9선 복귀**, sitemap 67 → **66 URL 복귀**.

## 시도한 fix들 — 모두 부족

| 시도 | 변경 | 결과 |
|---|---|---|
| 1. 모델 variant 토글 | esrgan-thick(~17MB) → esrgan-slim(~3MB) | 다운로드 부담만 ↓, 추론 freeze 동일 |
| 2. 배율 토글 | 4x → 2x 기본 | 처리 시간 ↓, 단 freeze 패턴 동일 |
| 3. patchSize 256 → 64 | upscaler.js 권장값으로 | 한 patch freeze 시간 ↓, 단 patch 수 ↑로 총 freeze는 비슷 |
| 4. setTimeout(0) yield | progress callback 사이 microtask | UI 약간 부드러워짐, 단 본질 해결 X |
| 5. 모바일 patchSize 자동 축소 | UA 감지 → 128 | 모바일 OOM 방지만, freeze 그대로 |

## 근본 원인

**TF.js WebGL backend의 메인 스레드 점령 패턴**:
- 각 patch 추론 = GPU dispatch → CPU↔GPU sync → 결과 픽셀 추출
- sync는 메인 스레드에서 수행 → 그 시간 동안 UI freeze
- patch 사이에 setTimeout으로 yield해도 sync 자체는 동기적이라 회피 X
- ESRGAN architecture는 patch 기반 반복 추론 = sync 횟수 많음

**bg-remove와의 차이**:
- bg-remove(@imgly/background-removal) = ONNX Runtime + single inference (한 번 통째로)
- 한 번 무거운 처리 → 끝. 그 동안만 freeze
- 사용자 인내 가능 (loading spinner UX 패턴)

- ESRGAN(upscaler.js + TF.js) = patch 단위 반복 (10~20+ patches)
- 매 patch마다 freeze + 진행 + freeze + 진행 = 사용자 체감 "버벅거림"
- 차라리 한 번 통째로 처리가 UX 더 좋을 수 있음 (단 큰 사진은 OOM)

## 봉인 처리

| 위치 | 처리 |
|---|---|
| `image/upscale/index.html` | `<meta robots="noindex">` + 본문을 점검 안내(seal-card)로 교체. 다른 image 도구 link 포함 |
| `image/upscale/upscale.js` | **보존** (재활성 시 즉시 사용) |
| `image/vendor/upscale-loader.mjs` | **보존** |
| `image/index.html` | ItemList 10 → 9, tool-grid 카드 제거, hub-intro·count·hub-faq 9선 |
| `index.html` (root) | og·twitter·title·description·keywords·JSON-LD hasPart·hub-card·Organization 모두 "9선·58 도구" 복귀, quick-list "AI 업스케일" 제거 |
| `manifest.webmanifest` | "59가지 → 58가지" |
| `privacy/index.html` | 시행일 + AI 업스케일 CDN 줄 제거 |
| `terms/index.html` | 1조 "58종" + 2조 AI 도구 면책에서 업스케일 제거 |
| `sw.js` | v9 → **v10** |
| `sitemap.xml` | rebuild 67 → **66 URL** (noindex 자동 제외) |

## 재공개 조건 (모두 충족 시)

1. **WebGPU backend 안정화**
   - TF.js `@tensorflow/tfjs-backend-webgpu` 정식 지원 + 모바일 호환성 확인
   - WebGL 대비 GPU sync 비용 1/5 → freeze 시간 1/5
   - 현재(2026-05-06) Chrome WebGPU 활성화 비율 낮음

2. **또는 Web Worker + OffscreenCanvas로 추론 분리**
   - 메인 스레드 freeze 완전 해소
   - 단 TF.js WebGL은 worker에서 직접 안 돼 OffscreenCanvas 필요
   - 작업량 큼 (vendor wrapper 재구성·통신 프로토콜·진행률 postMessage 등)

3. **또는 더 작은 모델·다른 라이브러리 검증**
   - ONNX Runtime Web + tile-based inference (직접 추론 코드)
   - transformers.js 기반 작은 SR 모델
   - 또는 traditional super-resolution(BICUBIC + sharpen filter) — 비AI지만 빠름

## 학습 포인트

1. **AI WASM·WebGL 추론 ≠ 정적 사이트의 강점** — bg-remove(single inference)는 동작하지만, ESRGAN(patch 반복 추론)은 메인 스레드 점령. AI 도구도 작업 패턴(single vs iterative)에 따라 적합도 크게 다름

2. **모델 사이즈가 곧 처리 부하 X** — slim 모델(~3MB)도 ESRGAN architecture는 동일하게 patch당 GPU sync 비용. 다운로드 시간만 줄어들고 처리 freeze는 그대로

3. **patchSize·padding·yield는 미세 조정** — patch 작게 하면 한 번 freeze 짧아지지만 총 시간 늘어남. yield는 sync 자체를 비동기로 만들지 못함. **근본 해결은 OffscreenCanvas + Worker 또는 WebGPU**

4. **사용자 검증의 중요성** — 자동 검증(JS syntax·HTML balance·sitemap·HTTP 200) 모두 통과해도 실제 UX는 별개. **"대기 중" 표시 = 출시 부적합 신호**. 출시 전 실 사용자 검증 1회 필수

5. **봉인 패턴 정착** — 페이지 noindex + 본문 점검 안내 + vendor·JS 보존 = 깔끔한 봉인. 향후 다른 도구도 검증 실패 시 동일 패턴 적용. 완전 삭제보다 보존+숨김이 ROI 좋음 (재활성 시 즉시 부활)

6. **재공개 시점은 WebGPU 또는 Worker 인프라가 정착된 후** — 현 단계(2026-05-06)에서 무리하게 재시도하면 같은 결과. 트래픽 데이터·기술 환경 변화 봐서 재진입

## 후속 백로그 (§9.4)

- **WebGPU backend 시도** — Chrome WebGPU 사용률 데이터 보고 진입
- **Web Worker + OffscreenCanvas 추론 분리** — TF.js worker context 검증 + postMessage progress 패턴
- **traditional super-resolution 대안** — BICUBIC + USM(Unsharp Mask) + Lanczos. 비AI지만 캐주얼 사용에 충분할 수 있음. 작업량 작음
- **다른 vocal-remover·youtube-thumb 도구로 ROI 검증 우선** — AI 업스케일 재진입은 인프라 준비 후
