# 저장공간 계산기 출시 — `tools/storage/` + 디지털·기기 카테고리 신설 (2026-05-06)

> 쿠팡 파트너스 친화 도구 톱 1순위(`history/candidate/coupang-affiliate-tools.md`) 후보를 출시. 영상·사진 용량 추정 + 외장 SSD/HDD/NAS 권장 카테고리 자동 추천. 사이트 첫 "쿠팡 추천 친화" 도구 = 향후 어필리에이트 카드 자리 확보. 도구 수 58 → **59선**, 계산기 36 → **37선**, sitemap 66 → **67 URL**. tools/ 카테고리 7 → **8** (디지털·기기 신설).

## 결정 배경 — 톱 2 중 1순위 채택

`history/candidate/coupang-affiliate-tools.md`의 매트릭스 (쿠팡 단가·SERP·정적·작업량 4축) 평가 결과:

| 후보 | 쿠팡 단가 | SERP | 정적 | 작업량 |
|---|---|---|---|---|
| 💾 **저장공간 계산기** ⭐ | ★★★ (외장하드 5~30만·SSD 10~50만) | ★★ "4K 영상 용량"·"외장하드 추천" | ✓ 0KB | **작음 (1~2h)** |
| 🖥️ 모니터 해상도·인치 변환 | ★★★ (모니터 30~150만) | ★★★ | ✓ | 중간 (2~3h) |

**1순위 채택 이유**:
1. **작업 가장 작음** (1~2h) — 사용자 머지 검토 단위 작게
2. video/ 도구 사용자와 자연 연결 (영상 압축 후 저장 → 외장하드)
3. SERP 빅키워드 = "4K 영상 용량"·"외장하드 추천"·"SSD 1TB 가격"
4. 쿠팡 승인 전이라도 도구 자체 출시 ROI 있음(정보성 권장 카테고리 표시)

## 구현 결정 — 추천 카드는 텍스트 권장만

**옵션 비교**:
- A: HTML에 쿠팡 카드 placeholder 박아두고 CSS hide (AdSense 패턴) → 승인 후 채우기
- B: 정보성 카드 (브랜드 예시 + 쿠팡 일반 검색 링크)
- **C: 결과 영역에 "권장: 1TB 외장 SSD" 텍스트만 — 카드 영역 미존재** ⭐

**C 채택 이유**: ① 출시 단순화 — 사용자 머지 검토 부담 ↓ ② 어필리에이트 카드 추가는 쿠팡 승인 후 별도 작업으로 명확 분리 ③ 텍스트 권장만으로도 사용자 가치 (가격대·용도 안내) 충분 ④ 도구 본질(계산)에 집중

## 카테고리 신설 — 🖥️ 디지털·기기

**왜 별도 카테고리**: 저장공간(이번)·모니터(2순위 후보)·기타 IT 가이드는 기존 7 카테고리(부동산·금융·근로·임신·자동차·건강·생활) 어디에도 핏하지 않음. "생활"에 넣으면 만 나이·D-day(시간/날짜)와 결이 다름. **§0.4 "수익 약함 카테고리 채우기" 패턴은 ★★★ 단가라 미해당** = 명확한 의도(디지털 기기 가이드) + 모니터 2순위로 묶임 예정 = 카테고리 신설 정당.

**위치**: hub pill·section 모두 건강 다음, 생활 직전. 카테고리 7 → 8개.

## 도구 페이지 — `tools/storage/`

| 섹션 | 내용 |
|---|---|
| meta·OG·JSON-LD | WebApplication(UtilitiesApplication) + BreadcrumbList(3 depth) + FAQPage(6Q) |
| form | 모드 select(영상/사진/직접) + 모드별 동적 필드 |
| 영상 모드 | 시간(h) + 영상 종류(12종 비트레이트 프리셋) |
| 사진 모드 | 장수 + 종류(8종 사진 종류) |
| 직접 모드 | GB 직접 입력 |
| result | 원본 GB + 권장 GB(×1.5) + 권장 저장장치 카테고리 + 가격대·용도 메모 |
| tool-article 1 | 영상 1시간당 용량 표 (4K H.264~ProRes 422 9행) |
| tool-article 2 | 사진 1장당 평균 사이즈 표 (DSLR RAW~iPhone ProRAW 8행) |
| tool-article 3 | 권장 저장장치 카테고리 표 (~64GB ~ NAS 4-bay+) |
| FAQ | 6 Q + JSON-LD 동기 |
| sources | YouTube 권장 비트레이트·Apple ProRes·DJI/GoPro 매뉴얼·Adobe Lightroom·Apple ProRAW |
| related-calc | 복리·이미지 압축·동영상 압축·HEIC→JPG·PDF 합치기·D-day (cross-cat 4) |

## 비트레이트·사진 사이즈 표 (12 + 8)

**영상 1시간당** (Mbps × 3600s ÷ 8 ÷ 1024 ≈ GB):
- 4K: H.264 22GB / H.265 11GB / AV1 6.6GB / 폰 4K HDR 27GB / 액션캠 100Mbps 44GB / ProRes 422 264GB
- QHD: H.264 7.0GB / H.265 3.5GB
- FHD: H.264 3.5GB / H.265 1.8GB / 폰 FHD 7.5GB
- HD: H.264 1.8GB

**사진 1장당**:
- DSLR RAW (24MP) 25~30MB / (45~50MP) 60~70MB
- 미러리스 RAW (24MP) 20~25MB
- JPG 고화질 6~10MB / 일반 2~4MB
- 폰 HEIC (12MP) 1.5~2MB / (48MP) 3~5MB
- iPhone ProRAW (48MP) 50~75MB

## 권장 저장장치 카테고리 (8단계)

| 필요 용량 | 권장 | 가격대 (2026 기준) |
|---|---|---|
| ~64 GB | SD카드·USB 메모리 | 1~3만 |
| 64~256 GB | 256GB 휴대용 SSD | 5~7만 |
| 256~512 GB | 512GB 휴대용 SSD | 8~12만 |
| 0.5~1 TB | 1TB 외장 SSD 또는 외장 HDD | SSD 12~18만 / HDD 7~9만 |
| 1~2 TB | 2TB 외장 HDD | 9~13만 |
| 2~4 TB | 4TB 외장 HDD | 13~18만 |
| 4~8 TB | 8TB 외장 HDD 또는 NAS 2-bay | 25~50만 |
| 8 TB+ | NAS 4-bay (12~16TB+) | 100만+ |

## 인프라 일괄 갱신

| 파일 | 변경 |
|---|---|
| `tools/storage/index.html` + `storage.js` | 신규 |
| `tools/index.html` | ItemList 36 → 37, pill·section "🖥️ 디지털·기기" 신설, hub-intro·count·title·og·twitter·description 모두 "37선" |
| `index.html` (root) | og·twitter·title·description·keywords 모두 "계산기 37선·59 도구", JSON-LD WebSite 37선 + Organization 59선, hub-card "LIVE · 37선" + desc 갱신, quick-list 계산기 row "저장공간" 추가 |
| `manifest.webmanifest` | "58가지 → 59가지(저장공간 계산기 신규)" |
| `privacy/index.html` | 시행일 갱신 |
| `terms/index.html` | 시행일 + 1조 도구 수 "37종(건강 5·디지털 1)·59종" |
| `sw.js` | `CACHE_VERSION` v10 → **v11** |
| `sitemap.xml` | rebuild 66 → **67 URL** |

## 검증

| 항목 | 결과 |
|---|---|
| JS syntax (`node --check storage.js`) | ✓ |
| JSON-LD parse | ✓ (WebApplication + BreadcrumbList + FAQPage 1 graph) |
| FAQ DOM count == JSON-LD mainEntity | 6/6 ✓ |
| HTML 태그 밸런스 | ✓ |
| sitemap URL count | 67 ✓ |
| /tools/storage/ 등재 | 1건 ✓ |

## 사용자 후속 액션

1. **첫 사용자 검증**: 영상 모드 (4K 1시간) / 사진 모드 (RAW 5000장) / 직접 입력 각 1회 — 결과·권장 카테고리·표 확인
2. **Search Console**: 신규 URL `https://taystudio.github.io/tools/storage/` 색인 요청 + sitemap 재제출
3. **카카오 OG 캐시 flush**: 신규 URL 첫 호출 시 자동 fetch
4. **PWA 캐시**: SW v10 → v11 자동 갱신
5. **머지 판단**: 도구 결과·UX·카테고리 신설 적합도 검토 후 머지/롤백/조정

## 후속 백로그 (§9.4 이동 대상)

- **모니터 해상도·인치 변환 (2순위 후보)** — 디지털·기기 카테고리 2번째 도구. DPI 계산 + 시야 거리 + 사용 시나리오별 추천. 카테고리 1선뿐인 현 상태 보강
- **쿠팡 파트너스 승인 후 추천 카드 영역 추가** — 결과 영역 직후 4~6개 카드 (브랜드·용량·가격·쿠팡 deep link). 광고 표기 의무 페이지 하단 명시
- **세분화 모드** — 영상 + 사진 + 직접 동시 합산 (현재는 단일 모드만)
- **클라우드 비교** — iCloud·Google One·Dropbox 월정액 vs 외장 5년 TCO 자동 비교
- **편집·프록시 모드 토글** — 영상 편집 워크플로우는 ×2~3 자동 적용

## 학습 포인트

1. **카테고리 신설 정당화 패턴** — §0.4 "수익 약함 채우기" 회피 조건 = ★★★ 수익 후보 + 향후 동일 카테고리 도구 1+ 예정. 둘 다 충족
2. **쿠팡 추천 카드는 점진적 도입** — 도구 출시(텍스트 권장) → 쿠팡 승인 → 카드 추가 → CTR 데이터. AdSense 패턴(승인 전 hide)과 동일 정신
3. **비트레이트 표는 도구 본질의 일부** — 단순 입력→출력 계산 도구가 아니라 "참고 표 + 계산"이 합쳐진 정보성 도구. SERP "4K 영상 용량" 같은 정보 검색에도 hit
4. **카테고리 색·아이콘은 사용자 검토 후 조정** — "🖥️ 디지털·기기" 명칭은 1차 선택. 사용자 합의 시 "💻 IT" 또는 "📦 기기·저장" 등 변경 가능
