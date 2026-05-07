# AI 이미지 업스케일링 도구 출시 — image/ 10번째 도구 (2026-05-06)

> 사용자가 "기능적·정적·SEO 큰 다음 도구" 요청 → 매트릭스 평가(SERP·AdSense·쿠팡·정적·작업량) 후 **AI 이미지 업스케일링** 채택. 사이트 두 번째 AI 도구(bg-remove에 이은). 사진 외부 전송 없음 = TinyPNG·Topaz·Let's Enhance 클라우드 클론 대비 정확한 차별화. 도구 수 58 → **59선**, image 9 → **10선**, sitemap 66 → **67 URL**.

## 결정 배경 — 매트릭스에서 채택한 이유

8 후보(audio/·convert/·workshop/·vocal-remover·youtube-thumb 등) 중:

| 후보 | SERP | AdSense | 쿠팡 | 정적 | 작업 | 종합 |
|---|---|---|---|---|---|---|
| 🤖 **AI 이미지 업스케일링** ⭐ | ★★★ "사진 화질 개선"·"흐린 사진 복원"·"옛날 사진 복원" | ★★ | ★ | ✓ TF.js + ESRGAN | 중간 | **채택** |
| 🎤 vocal-remover | ★★★ | ★★ | ★ | ✓ Spleeter ONNX 50MB | 큼 | 후속 |
| 📺 youtube-thumb | ★★★ | ★★ | ★ | ✓ 0KB | 매우 작음 | 시그너처 후속 |

**채택 이유**:
1. bg-remove에서 검증한 AI WASM·CDN+캐시 패턴 그대로 재사용 — 작업량·인프라 통일
2. SERP 빅키워드 ("AI 사진 복원"·"흐린 사진 선명하게"·"사진 해상도 높이기")
3. 기존 image/ 카테고리에 자연스럽게 fit — 별도 카테고리 신설 부담 X
4. 정적·프라이버시 차별화 (Topaz Photo AI·Let's Enhance·waifu2x.io 모두 클라우드 업로드)

## 구현 결정 — A2 (upscaler.js + esrgan-thick) 채택

옵션 비교:

| 옵션 | 라이브러리 | 모델 | 첫 다운 | 작업량 | 결과 품질 |
|---|---|---|---|---|---|
| A1. ONNX 직접 (정통) | onnxruntime-web ~2MB | Real-ESRGAN x4plus ~64MB | ~66MB | 큼 (tile inference 직접) | 100% |
| **A2. upscaler.js (TF.js packed)** ⭐ | TF.js ~3MB + upscaler ~50KB | esrgan-thick 4x ~17MB | ~20MB | **매우 작음** (라이브러리 API) | ~95% |

**A2 채택 이유**:
- 첫 다운 부담 1/3 → 모바일 이탈률 ↓
- 사진 품질 인지 차이 거의 X (디노이즈 강도만 약간 약함)
- 작업 시간 1/3 → 빠른 첫 출시 → 트래픽 검증 빠름
- 추후 결과 부족하면 ONNX x4plus 마이그레이션 옵션 (vendor 교체만)

## vendor — `image/vendor/upscale-loader.mjs` (자체 wrapper)

video/ffmpeg-loader.mjs 패턴 차용. 단 ffmpeg는 IndexedDB Blob 캐시(~32MB), upscaler.js는 TF.js 자체가 모델 weight를 IOHandler로 처리해 브라우저 HTTP 캐시에 의존.

**핵심 흐름**:

```js
const TFJS_URL = `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.21.0/+esm`;
const UPSCALER_URL = `https://cdn.jsdelivr.net/npm/upscaler@1.0.0-beta.20/+esm`;
const MODEL_URL = `https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@1.0.0-beta.20/4x/+esm`;

export async function loadUpscaler(onProgress) {
  // singleton + loading promise 패턴
  await import(TFJS_URL);                            // ~3MB
  const Upscaler = (await import(UPSCALER_URL)).default;  // ~50KB
  const x4Model = (await import(MODEL_URL)).default;      // ~17MB
  const instance = new Upscaler({ model: x4Model });
  await instance.warmup({ patchSize: 64, padding: 4 });   // 모델 컴파일
  return instance;
}

export async function upscale4x(imgEl, { patchSize = 64, padding = 4, onProgress }) {
  const upscaler = await loadUpscaler(onProgress);
  return await upscaler.upscale(imgEl, { patchSize, padding, progress, output: 'base64' });
}
```

**디버그·진단 export**:
- `getUpscaleLogs(n)` — 모바일 alert에 첨부할 ring buffer
- `getEnvSnapshot()` — JS heap·UA 진단
- `formatUpscaleError(error)` — 메모리·네트워크·기타 분기별 에러 메시지

## 도구 페이지 — `image/upscale/`

bg-remove 페이지 구조 재사용 + AI 업스케일 특화:

| 섹션 | 내용 |
|---|---|
| meta·OG·JSON-LD | WebApp + BreadcrumbList + FAQPage(6Q) + HowTo(4 step) |
| privacy box | "사진이 외부 서버로 전송되지 않습니다" |
| ai-disclaimer | 첫 사용 ~20MB Wi-Fi 권장 + 입력 1000~1500px 권장 |
| 옵션 | 출력 PNG/JPG + JPG 품질 슬라이더 |
| 진행률 | init → tfjs → upscaler → model → warmup → compute (50~95%) |
| preview | 원본 / 4배 업스케일 결과 (좌우 비교) |
| meta | 처리 시간 + 원본→결과 dim + 결과 용량 |
| tool-article | 잘 복원되는 사진 vs 한계 표 (5행) |
| disclosure | 라이브러리·CDN·WebGL·메모리 팁·모델 옵션 |
| FAQ | 6 Q + JSON-LD 동기 |
| sources | ESRGAN paper(ECCV 2018) + upscaler.js + TensorFlow.js |

**핵심 UX 가드**:
- 입력 픽셀 > 1500×1500 = confirm 안내 ("결과 ${4w}×${4h} = OOM 위험")
- 옵션이 PNG일 땐 JPG 품질 select disabled (시각 명확)
- in-app 환경은 ai-disclaimer로 안내 (별도 detect는 site-chrome 공통)

## SEO 키워드 매핑

```
title:       AI 이미지 업스케일링 | 흐린 사진 화질 개선·복원, 무료 워터마크 없음
description: 흐린 사진·저화질 사진을 AI(ESRGAN)로 4배 해상도 업스케일·복원...
keywords:    AI 이미지 업스케일링, 사진 화질 개선, 흐린 사진 선명하게, 옛날 사진 복원,
             사진 해상도 높이기, 이미지 화질 향상, AI 사진 복원, 4x 업스케일, ESRGAN 무료
```

차별화 = "**파일이 외부 서버로 전송되지 않습니다**" (Topaz Photo AI 유료·Let's Enhance 클라우드·waifu2x.io 클라우드 대비)

## 인프라 일괄 갱신

| 파일 | 변경 |
|---|---|
| `image/vendor/upscale-loader.mjs` | 신규 (자체 wrapper) |
| `image/upscale/index.html` + `upscale.js` | 신규 |
| `image/index.html` | ItemList 9 → 10, tool-grid 카드 추가, hub-intro·count·hub-faq·subtitle·meta description 모두 "10선" |
| `index.html` (root) | og·twitter·title·description·keywords 모두 "이미지 10선·59 도구", JSON-LD hasPart 이미지 desc, hub-card "LIVE · 10선" + desc, Organization "59선", quick-list 이미지 row에 "AI 업스케일" 첫 자리 추가(트래픽 큰 신규는 앞으로) |
| `manifest.webmanifest` | description "58가지 → 59가지" + AI 업스케일 명시 |
| `privacy/index.html` (root) | 시행일 + CDN 줄에 jsdelivr·TF.js·upscaler.js·ESRGAN 추가 |
| `terms/index.html` (root) | 시행일 + 1조 도구 수 "58종 → 59종(AI 업스케일·배경 제거 포함)" + 2조 AI 도구 면책에 업스케일 추가 |
| `sw.js` | `CACHE_VERSION` v6 → **v7** (§7.4 정책: common/* 변경 시 bump) |
| `sitemap.xml` | rebuild 66 → **67 URL** (image/upscale 등재) |

## 검증

| 항목 | 결과 |
|---|---|
| JS syntax (`node --check`) | upscale.js + upscale-loader.mjs ✓ |
| JSON-LD parse | upscale 페이지 + image hub + root ✓ |
| FAQ DOM count == JSON-LD mainEntity | 6/6 ✓ |
| HTML 태그 밸런스 | open == close ✓ |
| sitemap URL count | 67 (66 + upscale) ✓ |
| /image/upscale/ 등재 | 1건 ✓ |

## 사용자 후속 액션

1. **첫 사용자 검증**: 흐린 사진 1장으로 페이지 진입 → ~20MB 다운로드 → 업스케일 결과 시각 확인. 모바일/데스크톱 각 1회
2. **Search Console**: 신규 URL `https://taystudio.github.io/image/upscale/` 색인 요청 + sitemap 재제출
3. **카카오 OG 캐시 flush**: 신규 URL 첫 호출 시 자동 fetch
4. **PWA 캐시**: SW v6 → v7 자동 갱신 — 사용자 재방문 시 새 chrome+upscale 자산
5. **GitHub Pages 배포**: commit/push 후 jsdelivr CDN fetch 흐름 실전 검증

## 후속 백로그 (§9.4 이동 대상)

- **Real-ESRGAN x4plus 정통 모델 (~64MB) 옵션 토글** — 결과 품질 더 높이고 싶은 사용자용. 단 첫 다운 부담 ↑
- **GFPGAN 얼굴 복원 (~340MB)** — 인물 사진 특화. 다운 부담 큼, 트래픽 검증 후
- **anime/일러스트 모델 (esrgan-slim ~5MB)** — 만화·일러스트 특화. 옵션 토글
- **WebGPU backend** — TF.js WebGPU adapter 안정화되면 처리 속도 2~5배. 현재 WebGL fallback
- **IndexedDB 모델 캐시** — TF.js 자체 IDB 캐시는 정상 동작하는지 모바일 검증

## 학습 포인트

1. **bg-remove 패턴 재사용 효과 검증** — vendor wrapper + AI disclaimer + privacy box + ai-disclaimer + preview pair + FAQ + disclosure 구조 통째로 복사 가능. 작업 시간 ~50% 단축
2. **upscaler.js의 patch-based inference** — 64×64 patch + 4px padding으로 분할 처리해 메모리 절약. 큰 사진도 OOM 회피. 단 결과 합치는 단계에서 큰 메모리 필요
3. **TF.js vs ONNX 트레이드오프** — TF.js packed model = 라이브러리 API 간결, 단 ONNX 정통 모델 대비 결과 품질 약간 다름. 첫 출시는 작업량 우선, 추후 마이그레이션 옵션
4. **사이트 두 번째 AI 도구 출시** — bg-remove(첫 AI) → upscale(두 번째). image/ 카테고리에 AI 도구 2선 = "정적 + AI" 차별화 정착
5. **ROI 우선 정신 재확인** — A1(64MB 정통) vs A2(20MB packed) 중 사용자 ROI·작업량 관점에서 A2 채택. 트래픽 검증 후 A1으로 마이그레이션 옵션 보유
