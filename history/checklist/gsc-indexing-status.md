# GSC Indexing Status — sitemap 114 URL

**Last update**: 2026-05-11
**누적 manual 요청**: 22/114 (19.3%)
**확인된 ✅ indexed**: 1개

> 새 batch 처리 후 이 파일 한 곳만 갱신. 매번 새 파일 만들지 않음.

## 범례

- 🔄 = "색인 생성 요청" 클릭 완료, 색인 큐 등록 (며칠~2주 후 indexed 예상)
- ✅ = inspection 시점에 이미 indexed 확인
- ❌ = 차단 (robots/noindex/404 등 — 현재 없음)

---

## Batch 1 — KO functional + 검증된 evergreen (2026-05-11)

**선정**: 한국 시장 검증 + 한국 특유 use case 포함. image 6 / pdf 2 / text 1 / video 1.

| URL | 키워드 | 결과 |
|---|---|---|
| `/image/format-convert/` | webp 안 열림, 카톡 webp | 🔄 |
| `/pdf/pdf-stamp/` | PDF 워터마크·번호·메타 | ✅ |
| `/image/merge/` | 카톡 캡처 합본·9분할 | 🔄 |
| `/image/compress/` | 이미지 압축, 카톡 5MB | 🔄 |
| `/image/heic-to-jpg/` | 아이폰 HEIC | 🔄 |
| `/image/watermark/` | 이미지 워터마크 | 🔄 |
| `/pdf/pdf-merge/` | PDF 합치기 | 🔄 |
| `/image/mosaic/` | 블러·픽셀화 | 🔄 |
| `/text/counter/` | 글자수 세기 | 🔄 |
| `/video/compress/` | 영상 압축 | 🔄 |

---

## Batch 2 — EN 글로벌 evergreen (2026-05-11)

**선정**: functional 100% (image 5 / pdf 2 / video 3). 한국 특유·계산기·텍스트 제외.

| URL | 글로벌 키워드 | 결과 |
|---|---|---|
| `/en/image/format-convert/` | webp to jpg | 🔄 |
| `/en/image/heic-to-jpg/` | HEIC to JPG | 🔄 |
| `/en/image/compress/` | image compressor | 🔄 |
| `/en/image/resize/` | image resizer | 🔄 |
| `/en/image/crop/` | image crop | 🔄 |
| `/en/pdf/pdf-merge/` | merge pdf | 🔄 |
| `/en/pdf/pdf-split/` | split pdf | 🔄 |
| `/en/video/compress/` | video compressor | 🔄 |
| `/en/video/to-mp3/` | video to mp3 | 🔄 |
| `/en/video/trim/` | video trimmer | 🔄 |

---

## Batch 3 — KO image evergreen 추가 (2026-05-11)

**선정**: batch 1에서 누락된 image evergreen 우선. 일일 quota 초과로 2개만 처리 후 중단.

| URL | 키워드 | 결과 |
|---|---|---|
| `/image/resize/` | 이미지 리사이즈, 카톡 프로필·인스타·블로그 해상도 | 🔄 |
| `/image/crop/` | 이미지 자르기, SNS 업로드 전 필수 | 🔄 |

---

## Batch 4 — 후보 (2026-05-12 예정, quota 회복 후)

**컨텍스트**: Batch 3에서 quota 초과로 잘린 8개 + α. pdf 카테고리 보강 + 한국 high intent 도구.

| URL | 키워드 | 우선순위 |
|---|---|---|
| `/pdf/pdf-split/` | PDF 분할, 직장인 evergreen·고 CPC | 1 |
| `/pdf/pdf-to-image/` | PDF → JPG/PNG, 보고서·인쇄 | 2 |
| `/pdf/img-to-pdf/` | 이미지 → PDF, 스캔·증빙 묶기 | 3 |
| `/pdf/pdf-edit/` | PDF 편집 | 4 |
| `/image/ocr/` | 이미지 텍스트 추출, high intent | 5 |
| `/image/id-photo/` | 증명사진, 한국 특유 high intent | 6 |
| `/image/qr-gen/` | QR 생성, 자영업자 evergreen | 7 |
| `/image/qr-scan/` | QR 스캔, 모바일 evergreen | 8 |
| (여유 시 EN 미러) `/en/image/resize/` | image resizer | 9 |
| (여유 시 EN 미러) `/en/image/crop/` | image crop | 10 |

---

## 다음 점검

| 일자 | 액션 |
|---|---|
| 2026-05-12 (내일) | quota 회복 — Batch 4 진행 (위 후보 10개) |
| 2026-05-18 (1주) | GSC Coverage에서 batch 1~4 indexed 비율 확인 — 80%↑ 정상 / 50%↓ 도메인 권위 문제 의심 |
| 2026-05-25 (2주) | Search performance impressions·CTR·position 회수 + Batch 5 선정 |

## 의도적 제외 (manual indexing 우선순위 매우 낮음)

| 도구 | 사유 |
|---|---|
| `tools/salary`·`year-end`·`comprehensive` 등 계산기 | 네이버 모의계산 + 매년 요율 변동 (5필터 F1 fail) |
| `image/bg-remove`·`upscale` | stub (noindex) |
| `image/id-photo` | 인생 의사결정 인접 |
| EN `image/merge`·`watermark`·`mosaic`·`pdf-stamp`·`text/counter` | 글로벌 SERP 경쟁 큼·검색 의도 분산 |
| EN 계산기 (`bmi` 등) | 글로벌 정부·헬스 사이트 정복 불가 |

→ 이들은 sitemap 자동 발견 흐름에 맡김. 트래픽 데이터 확인 후 batch 4~ 에서 선별.
