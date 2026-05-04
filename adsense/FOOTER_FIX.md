# Footer 정적 Fallback Fix — privacy/terms 링크 JS 의존 위험 해결

**작성일**: 2026-05-04
**적용 범위**: 38 페이지 (tools/ 36개 + tools/index.html + index.html)
**목적**: AdSense 심사 봇이 JS 실행 안 해도 privacy/terms 링크 접근 가능하도록 정적 HTML로 박기

---

## 1. 문제 진단

### 1.1 발견 경위

AdSense 신청 직후 라이브 사이트 검증 중 `tools/gifttax/` 페이지의 정적 HTML 응답 확인:

```html
<site-footer></site-footer>
<script src="/common/site-chrome.js" defer></script>
```

`<site-footer>`는 빈 web component 태그. 푸터 콘텐츠 (privacy·terms 링크 포함)는 `site-chrome.js`가 페이지 로드 후 JS로 hydrate.

### 1.2 왜 critical 위험인가

**Googlebot 메인 인덱싱 봇** — JS 렌더링 지원. 사용자가 검색에서 보는 SERP 결과는 영향 없음.

**AdSense 심사 봇** — 별도 파이프라인, JS 실행 보장 안 됨. 정적 HTML만 fetch하는 경우가 많음.

AdSense 정책 명시 사항:
> "Sites must provide a clear and easily accessible link to a privacy policy from any page where ads appear."

봇이 JS 안 돌리면 privacy 링크가 정적 HTML에 없는 상태 → "privacy policy 미게시 사이트"로 판정.

**거절 사유 1순위**: "No privacy policy found" / "Privacy policy not accessible"

### 1.3 site-chrome.js 동작 검증

옵션 결정 전에 hydrate 방식 확인 필요:

```js
// /common/site-chrome.js — SiteFooter 클래스
connectedCallback() {
  this.innerHTML = `
    <footer class="site-footer">
      ...
      <a href="${BASE}/tools/privacy/">개인정보처리방침</a>
      <a href="${BASE}/tools/terms/">이용약관</a>
      ...
    </footer>
  `;
}
```

**핵심 발견**: `this.innerHTML = ...` 완전 교체 패턴.

→ JS 실행 전엔 light DOM 콘텐츠가 살아있음 (봇이 보는 상태)
→ JS 실행되면 innerHTML이 새 HTML로 통째로 교체 (사용자가 보는 상태)
→ **light DOM에 정적 fallback 박아도 JS 실행되면 자연스럽게 enhance됨** (이중 footer 문제 없음)

옵션 A 안전성 확인됨.

---

## 2. 해결 옵션 비교

| 옵션 | 방식 | 장점 | 단점 |
|---|---|---|---|
| **A. 정적 fallback** | `<site-footer>` 안에 정적 `<footer>` 박기 | 봇·사용자 모두 항상 노출. JS 실행 시 enhance | 페이지 일괄 수정 필요 |
| **B. `<noscript>`** | `<site-footer>` 옆에 `<noscript>` 추가 | 간단 | JS 비활성 환경에서만 보임 (AdSense 봇이 noscript 인식할지 불확실) |
| **C. 그대로 대기** | 변경 없음 | 작업 0 | 거절 위험 ↑ |

**결정**: **옵션 A** 채택. 가장 안전하고 사용자에게도 일관된 경험 제공.

---

## 3. 적용 내용

### 3.1 변경 전

```html
<site-footer></site-footer>
<script src="/common/site-chrome.js" defer></script>
```

### 3.2 변경 후

```html
<site-footer>
  <footer style="margin-top:48px;padding:24px 20px;border-top:1px solid var(--border);text-align:center;font-size:13px;color:var(--muted)">
    <div style="margin-bottom:12px">
      <a href="/tools/privacy/" style="color:var(--muted);text-decoration:none;margin:0 8px">개인정보처리방침</a>
      ·
      <a href="/tools/terms/" style="color:var(--muted);text-decoration:none;margin:0 8px">이용약관</a>
    </div>
    <div>© 2026 TAYSTUDIO · 입력값은 브라우저 안에서만 처리됩니다</div>
  </footer>
</site-footer>
<script src="/common/site-chrome.js" defer></script>
```

**inline style 사용 이유**: tools/css/style.css 미로드 환경에서도 봇이 footer를 정상 읽을 수 있도록. AdSense 심사 봇이 CSS 처리 보장 안 됨.

### 3.3 적용 범위 (38 페이지)

| 카테고리 | 페이지 수 | 비고 |
|---|---|---|
| 도구 페이지 (tools/*/index.html) | 33 | 모든 계산기 |
| tools/index.html | 1 | 도구 허브 |
| tools/404.html | 1 | 404 페이지 |
| tools/privacy/index.html | 1 | privacy 자체 페이지도 footer 통일 |
| tools/terms/index.html | 1 | terms 자체 페이지도 footer 통일 |
| index.html (root) | 1 | 메인 랜딩 |
| **합계** | **38** | |

`history/index.html`은 `<site-footer>` 사용 안 하는 별도 구조 + `noindex` 적용이라 제외.

### 3.4 적용 방법

```bash
# 일괄 perl 치환
perl -i -pe 's|<site-footer></site-footer>|<site-footer>\n    <footer style="...">...</footer>\n  </site-footer>|' \
  tools/*/index.html tools/index.html tools/404.html index.html
```

---

## 4. 검증

```bash
$ grep -rl "<site-footer>" tools/ index.html | wc -l
38

$ for f in $(grep -rl "<site-footer>" tools/ index.html); do
    grep -q "개인정보처리방침</a>" "$f" || echo "MISSING: $f"
  done
# (출력 없음 — 모두 적용됨)
```

✅ 38 페이지 전체에 정적 fallback 적용 확인.

---

## 5. 사용자 영향

- **JS 실행되는 일반 사용자**: 페이지 로드 직후 잠시 정적 footer 보임 → JS 실행되면 site-chrome.js가 더 풍부한 footer로 교체. FOUC (Flash of Unstyled Content) 약간 발생 가능하나 실용상 문제 없음.
- **JS 차단/실행 안 되는 봇·사용자**: privacy·terms 링크 정상 접근 가능.
- **AdSense 심사 봇**: privacy policy 링크 정적 HTML에서 발견 → 정책 위반 판정 위험 제거.

---

## 6. 후속 작업 권장

이번 fix로 봇 측 문제는 해결됐으나, 장기적으로 다음 개선 가능:

1. **site-chrome.js의 hydrate 패턴 재검토** — innerHTML 완전 교체 대신 정적 footer를 그대로 두고 enhance하는 패턴으로 변경하면 FOUC 제거 가능. 우선순위 낮음.
2. **og:image 추가** — SNS 미리보기 보강 (별도 작업).
3. **server-side rendering 고려** — GitHub Pages는 정적이라 SSR 불가. Cloudflare Workers 등 도입 시 검토.

---

## 7. 관련 파일

- 수정된 파일: 38개 HTML (commit log 참조)
- web component 정의: `common/site-chrome.js`
- 통합 기록: [`APPROVAL.md`](APPROVAL.md) §1, §8, §9
