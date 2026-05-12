# GSC Indexing Status — sitemap 114 URL

**Last update**: 2026-05-12
**누적 manual 요청**: 35/114 (30.7%)
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

## Batch 4 — KO functional 마무리 (2026-05-12)

**선정**: PDF vertical 완성 (split·to-image·img-to-pdf·edit) + image functional 마무리 (ocr·id-photo·qr-gen·qr-scan) + KO video 추가 (trim·to-mp3). functional 100%.

| URL | 키워드 | 결과 |
|---|---|---|
| `/pdf/pdf-split/` | PDF 분할, 직장인 evergreen | 🔄 |
| `/pdf/pdf-to-image/` | PDF → JPG/PNG, 보고서·인쇄 | 🔄 |
| `/pdf/img-to-pdf/` | 이미지 → PDF, 스캔·증빙 | 🔄 |
| `/pdf/pdf-edit/` | PDF 편집 | 🔄 |
| `/image/ocr/` | 이미지 텍스트 추출, high intent | 🔄 |
| `/image/id-photo/` | 증명사진, 한국 특유 high intent | 🔄 |
| `/image/qr-gen/` | QR 생성, 자영업자 evergreen | 🔄 |
| `/image/qr-scan/` | QR 스캔, 모바일 evergreen | 🔄 |
| `/video/trim/` | 영상 자르기, TikTok·릴스 컨텐츠 | 🔄 |
| `/video/to-mp3/` | 영상 음원 추출, YouTube·SNS | 🔄 |

---

## Batch 5 — KO 계산기 top 트래픽 (2026-05-12)

**선정**: 한국 직장인 검색량 최대 evergreen. quota 초과로 3개만 처리.

| URL | 키워드 | 결과 |
|---|---|---|
| `/tools/salary/` | 연봉 실수령액, 한국 직장인 #1 (월 ~450k) | 🔄 |
| `/tools/year-end/` | 13월의 월급, 1월 정점 (월 ~180k) | 🔄 |
| `/tools/severance/` | 퇴직금, 법정 산식 evergreen | 🔄 |

---

## Batch 6 — 후보 (2026-05-13 예정, quota 회복 후)

**컨텍스트**: Batch 5 미처리 7개 + α. KO 계산기 top 추가 + text·video functional 마무리.

| URL | 키워드 | 우선순위 |
|---|---|---|
| `/tools/comprehensive/` | 종합소득세, 5월 정점, 자영업자 | 1 |
| `/tools/hourly/` | 시급 계산, 학생·알바 evergreen | 2 |
| `/tools/bmi/` | BMI, 한국 비만학회 기준 + 글로벌 | 3 |
| `/text/kbd-convert/` | 한영키 잘못 친 것, 한국 특유 | 4 |
| `/text/sns-format/` | SNS 줄바꿈·해시태그 정리 | 5 |
| `/video/rotate/` | 동영상 회전, 모바일 needs | 6 |
| `/video/to-gif/` | 영상 → GIF, 짤·움짤 evergreen | 7 |
| `/tools/cartax/` | 자동차세, 한국 자동차 소유자 evergreen | 8 |
| `/tools/insurance/` | 보험료, evergreen | 9 |
| `/tools/parental-leave/` | 육아휴직 급여, 한국 직장인 needs | 10 |

---

## 다음 점검

| 일자 | 액션 |
|---|---|
| 2026-05-13 (내일) | quota 회복 — Batch 6 진행 (위 후보 10개) |
| 2026-05-18 (1주) | GSC Coverage에서 batch 1~6 indexed 비율 확인 — 80%↑ 정상 / 50%↓ 도메인 권위 문제 의심 |
| 2026-05-25 (2주) | Search performance impressions·CTR·position 회수 + Batch 7 선정 (EN 미러 + 남은 계산기) |

## 의도적 제외 (manual indexing 우선순위 매우 낮음)

| 도구 | 사유 |
|---|---|
| `tools/salary`·`year-end`·`comprehensive` 등 계산기 | 네이버 모의계산 + 매년 요율 변동 (5필터 F1 fail) |
| `image/bg-remove`·`upscale` | stub (noindex) |
| `image/id-photo` | 인생 의사결정 인접 |
| EN `image/merge`·`watermark`·`mosaic`·`pdf-stamp`·`text/counter` | 글로벌 SERP 경쟁 큼·검색 의도 분산 |
| EN 계산기 (`bmi` 등) | 글로벌 정부·헬스 사이트 정복 불가 |

→ 이들은 sitemap 자동 발견 흐름에 맡김. 트래픽 데이터 확인 후 batch 4~ 에서 선별.
