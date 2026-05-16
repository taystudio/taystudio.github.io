# GSC Indexing Status — sitemap 114 URL

**Last update**: 2026-05-15
**누적 manual 요청**: 69/114 (60.5%)
**확인된 ✅ indexed**: 10개 (Batch 9 EN hub·메타 9건은 manual 요청 전 이미 indexed — auto-discovery)

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

## Batch 6 — KO 계산기 top + text·video 마무리 (2026-05-13 진행 중)

**컨텍스트**: Batch 5 미처리 7개 + α. KO 계산기 top 추가 + text·video functional 마무리.

| URL | 키워드 | 결과 |
|---|---|---|
| `/tools/comprehensive/` | 종합소득세, 5월 정점, 자영업자 | 🔄 |
| `/tools/hourly/` | 시급 계산, 학생·알바 evergreen | 🔄 |
| `/tools/bmi/` | BMI, 한국 비만학회 기준 + 글로벌 | 🔄 |
| `/text/kbd-convert/` | 한영키 잘못 친 것, 한국 특유 | 🔄 |
| `/text/sns-format/` | SNS 줄바꿈·해시태그 정리 | — |
| `/video/rotate/` | 동영상 회전, 모바일 needs | — |
| `/video/to-gif/` | 영상 → GIF, 짤·움짤 evergreen | — |
| `/tools/cartax/` | 자동차세, 한국 자동차 소유자 evergreen | — |
| `/tools/insurance/` | 보험료, evergreen | — |
| `/tools/parental-leave/` | 육아휴직 급여, 한국 직장인 needs | — |

---

## Batch 7 — evergreen 계산기 + 직장인 needs (2026-05-13 진행)

**선정**: 만 나이·D-day·대출·적금 같은 evergreen 검색 큰 도구 + 자영업자(부가세)·직장인(연차·실업급여) needs.

| URL | 키워드 | 결과 |
|---|---|---|
| `/tools/age/` | 만 나이, 누구나·evergreen | 🔄 |
| `/tools/dday/` | D-day, 결혼·기념일·시험 | 🔄 |
| `/tools/loan/` | 대출 이자, 직장인·집 | 🔄 |
| `/tools/savings/` | 적금 이자, 재테크 | 🔄 |
| `/tools/vat/` | 부가가치세, 자영업자 (5월 종소세 옆) | 🔄 |
| `/tools/annual-leave/` | 연차수당, 12월 정점 | 🔄 |
| `/tools/unemployment/` | 실업급여, 이직·실직 검색 큼 | 🔄 |
| `/tools/calorie/` | BMR·TDEE, 헬스 evergreen | 🔄 |
| `/tools/pregnancy/` | 출산 예정일, 임산부 needs | 🔄 |
| `/tools/property-tax/` | 재산세, 7·9월 납부 미리 색인 | 🔄 |

---

## Batch 8 — EN 글로벌 evergreen 보강 (2026-05-15)

**선정**: Batch 2(EN 글로벌 evergreen)에서 빠진 EN functional 도구 위주. 미국 트래픽 진입 목표. 글로벌 SERP 경쟁 강한 image/watermark·merge·mosaic·pdf-stamp·text/counter·계산기는 의도적 제외 유지.

| URL | 글로벌 키워드 | 결과 |
|---|---|---|
| `/en/image/ocr/` | extract text from image, image to text | 🔄 |
| `/en/image/qr-gen/` | QR code generator | 🔄 |
| `/en/image/qr-scan/` | QR code scanner online | 🔄 |
| `/en/pdf/pdf-to-image/` | PDF to JPG, PDF to PNG | 🔄 |
| `/en/pdf/img-to-pdf/` | image to PDF, JPG to PDF | 🔄 |
| `/en/pdf/pdf-edit/` | PDF editor online | 🔄 |
| `/en/video/rotate/` | rotate video online | 🔄 |
| `/en/video/to-gif/` | video to gif converter | 🔄 |
| `/en/` | (home, 미국 트래픽 진입점) | 🔄 |
| _(10번째 — 본인 추가)_ | _(추후 마킹)_ | 🔄 |

---

## Batch 9 — EN hub·메타 자동 indexed 확인 (2026-05-15, manual 요청 0)

**컨텍스트**: 미국 트래픽 진입점·E-E-A-T 신호 검토차 EN hub 5 + 메타 4 GSC URL 검사 → **9건 모두 이미 indexed (auto-discovery)**. 도메인 내부 링크 강해서 sitemap 자동 발견 흐름으로 색인 완료. manual 요청 skip.

| URL | 결과 |
|---|---|
| `/en/tools/` | ✅ auto |
| `/en/image/` | ✅ auto |
| `/en/pdf/` | ✅ auto |
| `/en/video/` | ✅ auto |
| `/en/text/` | ✅ auto |
| `/en/about/` | ✅ auto |
| `/en/privacy/` | ✅ auto |
| `/en/terms/` | ✅ auto |
| `/en/sitemap/` | ✅ auto |

→ EN 도메인 권위 신호 형성됨 positive.

---

## Batch 10 — EN long-tail + KO 잔여 혼합 (2026-05-15)

**선정**: EN long-tail 재평가 4건 (의도적 제외에서 풀어 시도) + KO batch 6 잔여 6건. 1~2주 impressions 0이면 EN 4건은 다시 제외로 돌림.

| URL | 키워드·근거 | 결과 |
|---|---|---|
| `/en/image/mosaic/` | "blur face online", "pixelate face" — privacy 트렌드 long-tail | 🔄 |
| `/en/image/watermark/` | "add watermark photo" long-tail | 🔄 |
| `/en/image/merge/` | "combine images into one" | 🔄 |
| `/en/pdf/pdf-stamp/` | "stamp PDF" niche | 🔄 |
| `/tools/parental-leave/` | 육아휴직 급여, 한국 직장인 needs | 🔄 |
| `/tools/cartax/` | 자동차세 evergreen | 🔄 |
| `/tools/insurance/` | 보험료 evergreen | 🔄 |
| `/video/to-gif/` | 짤·움짤 evergreen | 🔄 |
| `/video/rotate/` | 모바일 evergreen | 🔄 |
| `/text/sns-format/` | SNS 줄바꿈·해시태그 | 🔄 |

---

## 다음 점검

| 일자 | 액션 |
|---|---|
| 2026-05-20 (1주) | GSC Coverage에서 batch 1~10 indexed 비율 확인 — 80%↑ 정상 / 50%↓ 도메인 권위 문제 의심 |
| 2026-05-27 (2주) | Search performance impressions·CTR·position 회수 + Batch 11 선정. EN long-tail 4건 (mosaic·watermark·merge·pdf-stamp) impressions·position 별 데이터로 keep/drop 결정 |

## 의도적 제외 (manual indexing 우선순위 매우 낮음)

| 도구 | 사유 |
|---|---|
| `tools/salary`·`year-end`·`comprehensive` 등 계산기 | 네이버 모의계산 + 매년 요율 변동 (5필터 F1 fail) |
| `image/bg-remove`·`upscale` | stub (noindex) |
| `image/id-photo` | 인생 의사결정 인접 |
| EN `image/merge`·`watermark`·`mosaic`·`pdf-stamp`·`text/counter` | 글로벌 SERP 경쟁 큼·검색 의도 분산 |
| EN 계산기 (`bmi` 등) | 글로벌 정부·헬스 사이트 정복 불가 |

→ 이들은 sitemap 자동 발견 흐름에 맡김. 트래픽 데이터 확인 후 batch 4~ 에서 선별.
