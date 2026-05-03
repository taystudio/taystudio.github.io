# 광고 수익화 설명서 — AdSense + 쿠팡 파트너스

티스토리는 클릭 몇 번이면 자동으로 광고가 들어갔지만, 정적 사이트는 직접 코드를 박아야 합니다. 이 문서는 **TAYLEE Tools 사이트에 광고를 붙이는 전 과정**을 정리한 운영 매뉴얼입니다.

---

## 0. 큰 그림

```
[현재 코드]                     [승인·통합 후]
  <div class="ad-slot">       →    <ins class="adsbygoogle">...</ins>
    [ AdSense 광고 자리 ]            <script>(adsbygoogle...).push({})</script>
  </div>
  ↑ placeholder 30개 자리           ↑ 실제 광고 송출
```

광고 자리는 이미 모든 도구 페이지에 깔려 있습니다. 그 placeholder를 **승인받은 코드로 교체**하면 끝입니다.

### 진행 순서 (위에서 아래로)

1. ✅ 사이트 라이브 배포 (`git push`)
2. ✅ Google Search Console + 네이버 Search Advisor 등록 (인덱싱 가속)
3. ✅ **쿠팡 파트너스** 가입 → 코드 적용 (즉시 가능, 트래픽 적어도 일단 설치)
4. ✅ **AdSense** 신청 (3주~3개월 심사 대기)
5. ✅ 승인 후 publisher ID로 코드 활성화
6. ✅ `ads.txt` 파일 추가

---

## 1. AdSense 통합

### Phase 1 — 신청 (라이브 사이트 후 가능)

#### 준비물

- Gmail 계정
- 라이브 사이트 (`https://taehyuklee.github.io/Archive/tools/`)
- 본인 명의 은행 계좌 (수익금 입금용)
- 주소·연락처

#### 신청 절차

1. https://adsense.google.com 접속
2. Gmail 로그인
3. **"Let's go"** → 사이트 URL 입력
4. 국가·통화·이용약관 동의
5. 받은 한 줄 `<script>` 태그를 **모든 페이지 `<head>`에 삽입** (아래 Phase 2 참고)
6. AdSense 콘솔에서 **"검토 요청"** 클릭
7. **3주~3개월 대기** (Google 수동 심사)

#### 승인 통과율을 높이는 조건 (이미 다 갖춰둠)

- ✅ Privacy Policy 페이지 (`/tools/privacy/`)
- ✅ Terms of Service 페이지 (`/tools/terms/`)
- ✅ 충분한 콘텐츠 (도구 30개 + 출처·법령 명시)
- ✅ 메타 태그·canonical URL
- ✅ JSON-LD 구조화 데이터
- ⚠️ **추가로 필요할 수 있는 것**: 와이프의 블로그(`blog/`) 콘텐츠가 일정 분량 이상 채워지면 사이트 전체 평가에 도움

#### 거부되면

거부 사유는 이메일로 옴. 흔한 사유:
- "콘텐츠 부족" → 블로그 글 추가 후 재신청
- "탐색 어려움" → 사이트 navigation 개선
- "정책 위반" → 의료·법률 자문성 콘텐츠가 면책 없이 단언적이면 거부됨 → disclaimer 강화

재신청은 거부 후 즉시 가능. 무제한.

---

### Phase 2 — 승인 직후 (head 코드 활성화)

승인 메일이 오면 publisher ID(`ca-pub-XXXXXXXXXXXXXXXX`)를 받습니다.

각 페이지 `<head>`에 이미 **주석 처리된 자리**가 있습니다.

#### 현재 (주석 상태)

```html
<!-- AdSense (승인 후 publisher ID로 교체)
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
-->
```

#### 수정 후

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456" crossorigin="anonymous"></script>
```

#### 30개 페이지에 일괄 적용 (Python 스크립트)

```bash
# tools/ 디렉토리에서
PUB_ID="ca-pub-1234567890123456"
find . -name "index.html" -exec sed -i '' "s|<!-- AdSense.*승인 후.*-->|<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=$PUB_ID\" crossorigin=\"anonymous\"></script>|g" {} \;
```

(macOS는 `sed -i ''`, Linux는 `sed -i` — `-i` 뒤 빈 따옴표 차이)

---

### Phase 3 — 광고 단위 만들기

AdSense 콘솔에서 광고 단위를 미리 만들어두고, 그 코드를 사이트에 박는 구조입니다.

#### 광고 단위 만들기

1. AdSense 대시보드 → 좌측 메뉴 **"광고"** → **"광고 단위별"**
2. **"디스플레이 광고"** 클릭
3. 이름 입력 (예: `tools-result-top`)
4. **반응형(자동)** 선택 (대부분 이게 효율 좋음)
5. **"만들기"** 클릭
6. 발급된 코드 복사 — 이런 모양:

```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-1234567890123456"
     data-ad-slot="0123456789"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

`data-ad-slot` 값이 광고 단위마다 다른 고유 ID.

#### 추천 구성: 3~5개 광고 단위 만들기

여러 페이지에서 재사용:

| 단위 이름 | 위치 | 비고 |
|---|---|---|
| `tools-form-bottom` | 폼 아래 (계산 버튼 다음) | 가장 많이 보이는 자리 |
| `tools-result-top` | 결과 위 | 클릭률 가장 높음 (계산 결과 확인하려고 스크롤) |
| `tools-content-bottom` | 본문 마지막 | 부가 노출 |
| `tools-hub-middle` | 허브 중간 | 도구 카드 사이 |
| `tools-hub-bottom` | 허브 하단 | |

광고 너무 많이(>3개/페이지) 깔면 AdSense가 "low quality" 판정합니다. **결과 위 + 본문 하단 2개** 정도가 안전선.

#### placeholder 교체 패턴

**Before** (현재 코드)
```html
<div class="ad-slot">[ AdSense 광고 자리 ]</div>
```

**After** (광고 코드로 교체)
```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-1234567890123456"
     data-ad-slot="0123456789"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

#### 일괄 교체 스크립트

publisher ID와 slot ID 정해지면 Python 스크립트로 30개 페이지 한방에 교체 가능. README.md §11 참고 또는 별도 요청.

---

### Phase 4 — `ads.txt` (필수)

레포 루트 `/Archive/ads.txt` 파일 생성:

```
google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

- `pub-` 뒤 숫자만 본인 ID로
- `f08c47fec0942fa0`는 Google AdSense의 **고정값** (모든 사이트 공통, 절대 바꾸지 마세요)

이 파일이 없으면 광고가 일부 안 뜨거나 수익이 ~10% 손실됩니다.

---

## 2. 쿠팡 파트너스 통합

### Phase 1 — 가입

1. https://partners.coupang.com 접속
2. 쿠팡 계정으로 로그인 (없으면 가입)
3. 약관 동의
4. **거의 즉시 승인** (블로그 운영 중이면 무조건 통과)
5. 발급된 **트래킹 코드** 메모 (`AF1234567` 형식)

### Phase 2 — 광고 코드 받기

쿠팡 파트너스는 두 방식이 있습니다.

#### A. 다이나믹 배너 (자동 추천 상품)

가장 쉬움. 사용자에게 자동으로 맞는 상품 추천.

1. 파트너스 콘솔 → **"광고만들기"** → **"다이나믹 배너"**
2. 사이즈 선택 (carousel, square, mobile 등)
3. 코드 복사:

```html
<script src="https://ads-partners.coupang.com/g.js"></script>
<script>
  new PartnersCoupang.G({
    "id": 123456,                  // 위젯 ID (콘솔에서 발급)
    "trackingCode": "AF1234567",   // 트래킹 코드
    "subId": null,
    "template": "carousel",
    "width": "680",
    "height": "140"
  });
</script>
```

#### B. 상품 직링크 (수동 추천 — 전환률 더 높음)

특정 상품을 콘텐츠에 자연스럽게 삽입.

1. 쿠팡 상품 페이지 접속
2. 파트너스 콘솔 → **"딥링크 만들기"** → 상품 URL 붙여넣기
3. 단축 URL 발급 (`https://link.coupang.com/...`)
4. 콘텐츠에 자연스럽게 삽입:
   ```markdown
   이 책 추천합니다 → [구매하기](https://link.coupang.com/a/AAA)
   ```

### Phase 3 — 사이트에 적용

기존 placeholder 교체. 이미 5개 도구에 자리가 깔려 있습니다:

- `cartax/` — 자동차 용품
- `cartax-yearly/` — 자동차 용품
- `pregnancy/` — 임산부 영양제
- `ovulation/` — 배란테스트기·임신테스트기
- `baby-formula/` — 분유·젖병
- `baby-clothes/` — 아기옷

**Before** (현재 코드)
```html
<div class="coupang-banner">
  <div class="label">파트너스 활동을 통해 일정액의 수수료를 제공받을 수 있습니다</div>
  <a href="#" rel="nofollow sponsored noopener" target="_blank">[ 쿠팡 자동차 용품 추천 자리 ]</a>
</div>
```

**After**
```html
<div class="coupang-banner">
  <div class="label">파트너스 활동을 통해 일정액의 수수료를 제공받을 수 있습니다</div>
  <script src="https://ads-partners.coupang.com/g.js"></script>
  <script>
    new PartnersCoupang.G({
      "id": 123456,
      "trackingCode": "AF1234567",
      "template": "carousel",
      "width": "680",
      "height": "140"
    });
  </script>
</div>
```

### Phase 4 — 카테고리별 매칭 추천

| 도구 | 추천 상품 카테고리 | 평균 단가 |
|---|---|---|
| `pregnancy/`, `ovulation/` | 배란테스트기, 임신테스트기, 산모영양제 | 중~고 |
| `baby-formula/` | 분유, 젖병, 소독기, 보온병 | 고 (반복구매) |
| `baby-clothes/` | 신생아·유아 의류 | 중 |
| `growth/` | 성장 보충제, 어린이 영양제 | 중 |
| `cartax/`, `cartax-yearly/` | 카시트, 블랙박스, 차량용품 | 중~고 |
| `bmi/`, `calorie/` | 다이어트 보조제, 운동 용품, 헬스장갑 | 중 |
| `loan/`, `salary/` | 가계부, 재테크 책 | 저 |
| `severance/`, `unemployment/` | 자기계발 책, 인터뷰 책 | 저 |

### 중요 — 공정위 가이드라인

광고 근처에 반드시 명시:
> 파트너스 활동을 통해 일정액의 수수료를 제공받을 수 있습니다.

이미 모든 쿠팡 배너 자리에 깔려 있습니다. 절대 지우지 마세요. 위반 시 공정거래위원회 제재.

---

## 3. 흔한 실수 (티스토리에서 안 겪던 것)

| 실수 | 결과 |
|---|---|
| **본인이 광고 클릭** | AdSense 계정 정지 (자동 감지) |
| **가족·친구한테 광고 클릭 부탁** | 정지 (IP·디바이스 패턴 감지) |
| **본인 명의 쿠팡 계정으로 본인 어필리에이트 구매** | 쿠팡 파트너스 정지 + 수수료 환수 |
| **한 페이지에 광고 4개 이상** | "low quality" 평가, RPM 감소 |
| **본문보다 광고가 많음** | AdSense 정책 위반 (Better Ads Standards) |
| **`ads.txt` 안 만듦** | 수익 ~10% 손실 |
| **모바일 화면을 광고가 가림** | "Intrusive Interstitial" 페널티 |

### 안전한 운영 원칙

- 광고는 보수적으로 (페이지당 2~3개)
- 본문이 광고보다 길게
- 모바일 first — 핸드폰 화면에서 광고가 본문 가리는지 직접 체크
- 친구한테 절대 클릭 부탁 안 함
- 본인 사이트 자주 안 들어가기 (browse하다 실수로 클릭 위험)

---

## 4. 적용 순서 체크리스트

### 지금 (배포 직후)

- [ ] `git push` 로 사이트 라이브
- [ ] 라이브 URL 확인 (`https://taehyuklee.github.io/Archive/tools/`)
- [ ] Google Search Console 등록 + sitemap.xml 제출
- [ ] 네이버 Search Advisor 등록

### 즉시 (며칠 안)

- [ ] 쿠팡 파트너스 가입
- [ ] 트래킹 코드 + 위젯 ID 받기
- [ ] 6개 도구의 쿠팡 placeholder 교체
- [ ] AdSense 신청 시작 (대기 시작)

### AdSense 승인 후

- [ ] publisher ID 받기 (`ca-pub-XXXXXXXXXXXXXXXX`)
- [ ] 모든 페이지 `<head>`의 주석 풀어서 ID 적용
- [ ] AdSense 콘솔에서 광고 단위 3~5개 만들기
- [ ] 30개 페이지의 AdSense placeholder를 광고 코드로 교체
- [ ] 레포 루트에 `ads.txt` 파일 생성
- [ ] 1~2주 후 RPM·수익 확인 (AdSense 대시보드)

### 1개월 후 (최적화)

- [ ] 트래픽 잘 나오는 도구 파악 (Google Analytics)
- [ ] 그 도구의 광고 위치 미세조정 (A/B 테스트)
- [ ] 쿠팡 클릭 많은 카테고리 발견 → 그쪽으로 추천 상품 보강
- [ ] 카카오 애드핏 추가 (AdSense 미게재 영역 채움) — 선택

---

## 5. 일괄 적용 도우미 스크립트 (참고)

승인 받은 후 30개 페이지에 한 번에 광고 코드를 박는 Python 스크립트 예시:

```python
#!/usr/bin/env python3
"""AdSense 광고 코드 일괄 삽입"""
import re, glob

PUBLISHER_ID = "ca-pub-1234567890123456"
SLOT_RESULT_TOP = "0123456789"
SLOT_BOTTOM = "9876543210"

AD_RESULT = f'''<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="{PUBLISHER_ID}"
     data-ad-slot="{SLOT_RESULT_TOP}"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({{}});</script>'''

for path in glob.glob("tools/*/index.html"):
    with open(path, encoding="utf-8") as f:
        html = f.read()
    # placeholder를 첫 번째 등장 위치만 교체 (결과 위)
    html = html.replace(
        '<div class="ad-slot">[ AdSense 광고 자리 ]</div>',
        f'<div class="ad-slot">{AD_RESULT}</div>',
        1,
    )
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✓ {path}")
```

publisher ID와 slot ID 받으면 이 스크립트 변형으로 일괄 처리 가능.

---

## 6. 추가 광고 채널 (선택)

AdSense + 쿠팡 충분히 안정화된 다음 단계 (월 50만원+ 시점):

| 채널 | 특징 | 단가 |
|---|---|---|
| **카카오 애드핏** | AdSense 빈자리 채움, 한국 최적화 | RPM 1,000~3,000원 |
| **데이블** | 추천형 콘텐츠 광고 (모바일 하단) | RPM 500~2,000원 |
| **네이버 애드포스트** | 네이버 트래픽 있을 때 | 낮음 |
| **알리/아마존 어필리에이트** | 글로벌 트래픽 | 매우 낮음 |
| **호스팅사 어필리에이트** (가비아·카페24) | 개발 블로그에 어울림 | 단건 1~3만원 |

다 합치면 단일 AdSense 대비 +30~50% 짜낼 수 있음. 단, 광고 너무 많아지면 UX 망가지니 균형 필수.

---

## 7. 자주 묻는 질문

**Q. AdSense 신청은 언제 해야 빠를까요?**
A. 사이트 라이브 후 **즉시** 신청 권장. 콘텐츠가 더 쌓일 때까지 미루는 건 비추 — Google 심사가 오래 걸리므로 일찍 시작해야 빨리 통과합니다. 거부되면 사유 보고 보강 후 재신청 (무제한 가능).

**Q. 광고 코드 박은 후 광고가 안 보여요.**
A. 흔한 원인:
- 승인 직후 1~2일은 광고가 비어 있을 수 있음 (광고 인벤토리 매칭 시간)
- AdBlock 켜져 있는지 확인 (본인 브라우저)
- 시크릿 모드로 열어서 확인
- F12 → Console에 에러 있는지 확인

**Q. 수익은 언제부터 들어와요?**
A. AdSense 최소 지급 기준 **$100 (약 13만원)** 도달 시 익월 21일에 입금. 트래픽 적으면 몇 달 걸림. PIN 인증(우편 받음, $10 도달 시) + 세금 정보 등록 필수.

**Q. 광고 단위 코드 한 페이지에 여러 개 박아도 돼요?**
A. 가능. 단 같은 광고 단위 ID를 같은 페이지에 2번 이상 쓰면 `(adsbygoogle...).push({})`도 그만큼 호출해야 합니다. 보통은 다른 광고 단위 ID로 만들어서 사용.

**Q. 쿠팡 파트너스 수익 입금은?**
A. 매월 정산. 익월 25일 입금. 최소 정산 기준 없음 (1원이라도 입금).

**Q. 본인 광고 클릭으로 정지 당했어요.**
A. AdSense는 한번 정지되면 복구 어려움. 항소는 가능하지만 거의 안 풀림. 새 Gmail로 재시작해야 하는데 도메인·IP 추적 때문에 또 막힐 수 있음. **절대 클릭하지 마세요.**

---

## 8. 사용자 정보 받으면 자동화 가능

다음 정보가 모이면 30개 페이지에 일괄 적용 가능합니다:

```
[ AdSense ]
publisher ID:    ca-pub-???
ad slot 1 (결과 위):    ???
ad slot 2 (본문 하단):  ???
ad slot 3 (허브 중간):  ???

[ 쿠팡 파트너스 ]
trackingCode:    AF???
widget ID 1 (자동차):    ???
widget ID 2 (육아):      ???
widget ID 3 (다이어트):  ???
```

이 정보 정리해서 알려주시면 제가 일괄 교체 스크립트로 5분 안에 적용해드립니다.

---

**최종 작성**: 2026-04-30
**관련 문서**: [README.md](./README.md) — 전체 운영 매뉴얼
