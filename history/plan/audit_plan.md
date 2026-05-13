# Audit Plan — 2026-05-13 이후

기존 audit (audit-01 ~ audit-12) 완료 후 진행할 작업·다음 audit 계획.

---

## 1. 즉시 (5/13 ~ 5/19) — 외부 작업

### 1-A. GSC manual indexing 일별 Batch

| Batch | 일자 | 작업 | 누적 |
|---|---|---|---|
| Batch 6 | 5/13 | 후보 10개 (comprehensive·hourly·bmi·kbd-convert·sns-format·video/rotate·to-gif·cartax·insurance·parental-leave) | 45/114 |
| Batch 7 | 5/14 | 우선순위 재선정 (master 미진행 79개 중) | 55/114 |
| Batch 8 | 5/15 | 동일 | 65/114 |
| Batch 9 | 5/16 | 동일 | 75/114 |
| Batch 10 | 5/17 | 동일 | 85/114 |
| Batch 11~12 | 5/18~19 | 10+10 | 105/114 |
| Batch 13 | 5/20 | 마지막 9개 + 1차 trend 회수 | 114/114 |

**진행 방법**: GSC `URL 검사` → `색인 생성 요청` × 10. 매일 quota 회복 후.

### 1-B. 백링크 (자연스럽게, 분산)

- 본인 티스토리 1편 (도구 사용 후기 + 자연 링크)
- GitHub 개인 프로필 README에 taystudios.com 링크
- 관련 Q&A (네이버 지식인·Stack Overflow) 답변에 도구 1개 링크 (질문 진짜 매칭 시만)
- ❌ spam 의심 패턴 회피 (다수 댓글·다중 링크)

### 1-C. AdSense 승인 모니터링

- 5/9 도메인 migration → 통상 1-2주 승인
- 5/13 = 4일차. 5/16~5/23경 결과
- 승인 시 → 다음 monetization 단계 (쿠팡 unhide → 검증 후 추가 수입원)

---

## 2. 1주 후 (5/20) — 1차 데이터 회수 + audit-13

### audit-13: 트래픽·인덱싱 1주 trend

**컨텍스트**: GSC·Bing·Naver 등록 후 1주 데이터. 코드 결함 아닌 외부 신호 분석.

**점검 항목**:
- GSC Search Console: indexed 페이지 수 (80%+ 정상) · impressions · CTR · 평균 position · top 검색어
- Bing Webmaster Tools: indexed · impressions · top keywords (ChatGPT Search가 Bing 인덱스 사용)
- Naver Search Advisor: 색인 현황 · 검색 노출 (한국 트래픽 핵심)
- Cloudflare Analytics: 5/13 vs 5/20 일일 visits·top pages·referer 비교
- GA4 (있다면): 도구별 dwell·이벤트

**판단 기준**:
- indexed 80%+ → 정상. 50% 이하 → 도메인 권위 부족 의심
- impressions 0 아니면 색인 완료
- position 30위 이하 → 백링크·콘텐츠 강화 필요

**결과 → 다음 액션 결정**:
- 트래픽 정상 + position 양호 → AdSense 승인 대기 + monetization 단계
- 트래픽 부진 → 백링크 가속 + 콘텐츠 quality 보강

---

## 3. 2주 후 (5/27) — audit-14 + 의사결정

### audit-14: 2주 trend + monetization 결정

**컨텍스트**: AdSense 승인 결과 회수 + 2주 트래픽.

**시나리오별 plan**:

#### A. AdSense 승인 + 트래픽 정상
- 쿠팡 unhide (memory `project_monetization_rollout`)
- 다음 수입원 후보 검토 (1개씩, 점진)

#### B. AdSense 거절
- 거절 사유 분석 → 사이트 정합 fix
- 재신청 (보통 2주 대기 권장)

#### C. 트래픽 부진
- 추가 백링크 가속
- 키워드 강화 콘텐츠 (block·기획)
- 도구 추가 후보 5필터 재검토

---

## 4. 잔여 코드 작업 (Optional, 사용자 needs 검증 후)

### N case (audit-3에서 발견)

| 항목 | 비고 |
|---|---|
| N10 drag-drop 폴더 안내 | iOS Safari 폴더 드래그 silent skip. 사용자 needs 데이터 회수 후 |
| N11 clipboard paste | Ctrl+V로 이미지 paste — 데스크톱 사용자 needs |
| 신규 도구 후보 5필터 | image·tools·text 추가 후보 (사용자 검색어 + GSC top keywords 기반) |

**진행 조건**: GSC 데이터로 사용자가 "이 기능 부재로 이탈" 증거 확인 시. 데이터 없이 추가 X (5필터 ④ 2년 후 유효 영역).

---

## 5. 영구 한계 (작업 대상 X)

- `image/bg-remove` 진짜 cancel: ONNX Runtime Web 추론 중단 불가 (라이브러리 한계)
- 모바일 in-app browser 한계: 카톡·인스타·페북 WebView (banner 안내로 대응)
- iOS Safari 메모리 ~500MB heap (사용자 안내로 대응)

---

## 6. 풀 테스트 재사용

큰 변경 후·release 전·검수 라운드에는 **`/full-test`** 슬래시 명령:
- `.claude/skills/full-test/SKILL.md` 6단계 절차
- 매트릭스 + UX 일관성 + Critical 즉시 fix + audit 작성

호출: 새 conversation에서 `/full-test` 입력 → 자동완성 → Enter.

---

## 참고

- `history/audit/INDEX.md` — audit-01~12 시리즈 순서
- `history/audit/audit_history.html` — 시각 history 보고서
- `history/checklist/gsc-indexing-status.md` — GSC batch master (Batch 6 후보 명시)
- `common/counts.json` — 도구 갯수 source of truth
- `.claude/skills/full-test/SKILL.md` — 풀 테스트 절차
