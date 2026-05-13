---
description: TAYSTUDIO 풀 테스트 — 도구 매트릭스 + UX 일관성 + Critical 즉시 fix + audit 작성
---

`.claude/skills/full-test/SKILL.md`의 6단계 절차에 따라 풀 테스트 진행:

1. 사용자에게 범위 확인 (핵심 ~200 / 풀 ~600 / 극한 ~100 케이스)
2. `.playwright-mcp/test-files/`에 다양한 확장자·사이즈 테스트 파일 생성
3. 로컬 서버 실행 (`python3 -m http.server 8089`)
4. agent 4-6 병렬 (image · pdf+video · text+calculator · meta page) — Playwright는 main만
5. agent 결과에서 Critical 즉시 fix + Playwright spot-check
6. `history/audit/audit-NN-<slug>.{md,html}` 신규 + INDEX.md 갱신

마무리: syntax 검증 · 서버 종료 · commit + push · 통과율 보고.

이전 audit 참고: `history/audit/audit-11-final-test.html`.
