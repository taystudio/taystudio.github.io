# 색인 복구 체크리스트

갱신: 2026-10-07. 아래 상태는 2026-10-06에 저장한 자료의 2026-09-21 집계이며, 실시간 상태가 아닙니다.

## 현재 상태

- 사이트맵 대상 255개: 색인 32개, 크롤링됨·미색인 214개, 발견됨·미색인 9개.
- 로컬 수정과 정적 검증 완료. 배포 완료·실시간 검사·색인 요청은 아직 확인하지 못했습니다.
- 요청 접수는 색인 완료와 다릅니다. 완료 표시는 실제 URL 검사 결과를 근거로 합니다.

## 진행 순서

1. 수정본을 기존 호스팅에 배포하고 배포 시각을 기록합니다.
2. 아래 대표 URL에서 실제 수정 내용과 정상 응답을 확인합니다. 홈페이지·블로그 사이트맵도 확인합니다.
3. Search Console URL 검사에서 기존 색인 상태, 마지막 크롤링 시각, Google 선택 canonical을 기록합니다.
4. 실시간 URL 테스트로 접근·색인 허용 여부를 확인합니다. 실시간 테스트 통과만으로 색인을 확정하지 않습니다.
5. 수정된 대표 URL에 색인 생성 요청을 한 번 접수하고 접수 시각을 기록합니다. 화면에서 할당량 초과가 나오면 중단합니다.
6. 마지막 크롤링 시각이 배포 이후로 바뀌었는지 확인합니다. 바뀌었는데도 미색인이면 Google 선택 canonical, 티스토리 원문과의 중복, 본문 고유성과 정확성을 다시 점검합니다.

## 우선 확인 URL

| URL | 기존 상태 | 선정 이유 | 배포 확인 / 요청 / 후속 결과 |
| --- | --- | --- | --- |
| https://taystudios.com/blog/ko/nginx-install-ubuntu-centos/ | 색인 생성됨 | 새 내부 링크의 출발점. 기존 색인 페이지의 링크 재수집 확인 | 미확인 / 미요청 / 미확인 |
| https://taystudios.com/blog/ko/snowflake-id-generator/ | 크롤링됨 - 현재 색인이 생성되지 않음 | 색인 허용 페이지에서 들어오는 링크 보강 | 미확인 / 미요청 / 미확인 |
| https://taystudios.com/blog/ko/mssql-login-user-schema/ | 크롤링됨 - 현재 색인이 생성되지 않음 | 관련 본문 링크 보강 | 미확인 / 미요청 / 미확인 |
| https://taystudios.com/blog/ko/python-oracledb-arm-dpi-1047/ | 크롤링됨 - 현재 색인이 생성되지 않음 | 관련 본문 링크 보강 | 미확인 / 미요청 / 미확인 |
| https://taystudios.com/blog/ko/cloudflare-worker-d1-analytics/ | 발견됨 - 현재 색인이 생성되지 않음 | 발견됨 상태의 신규 글: 수집 여부 비교 | 미확인 / 미요청 / 미확인 |
| https://taystudios.com/tools/salary/ | 크롤링됨 - 현재 색인이 생성되지 않음 | 계산 로직 수정 후 재수집 확인 | 미확인 / 미요청 / 미확인 |

## 사이트맵

- https://taystudios.com/sitemap.xml
- https://taystudios.com/blog/sitemap.xml
- 기존 제출 상태와 마지막 읽은 시각을 확인합니다. 미제출 또는 읽기 오류일 때 제출·오류 해결을 진행합니다.

## 후속 확인 기록

| URL | 배포 시각 | 요청 시각 | 마지막 크롤링 | Google 선택 canonical | 색인 결과 |
| --- | --- | --- | --- | --- | --- |
| 미기록 | | | | | |

## 판단 기준과 공식 안내

- 반복 요청은 수집 속도를 높이지 않으며, 요청 자체가 색인을 보장하지 않습니다. 고정된 일일 안전 한도나 회복 날짜를 가정하지 않습니다.
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- 이전 요청 이력 원본은 history/audit/indexing-checklist-before-2026-10-07.txt에 보존했습니다. 당시 체크 표시는 현재 색인 상태로 간주하지 않습니다.
