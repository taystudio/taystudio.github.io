// TAYSTUDIO common chrome — header & footer web components.
// Uses absolute paths under /studio/ so depth-agnostic across all pages.

const BASE = '/studio';

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="site-header">
        <a href="${BASE}/" class="logo">TAYSTUDIO</a>
        <nav><a href="${BASE}/tools/">Tools</a></nav>
      </header>
    `;
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer style="margin-top:48px;padding:24px 20px;border-top:1px solid var(--border);text-align:center;font-size:13px;color:var(--muted)">
        <div style="margin-bottom:12px">
          <a href="${BASE}/tools/privacy/" style="color:var(--muted);text-decoration:none;margin:0 8px">개인정보처리방침</a>
          ·
          <a href="${BASE}/tools/terms/" style="color:var(--muted);text-decoration:none;margin:0 8px">이용약관</a>
        </div>
        <div>© 2026 TAYSTUDIO · 입력값은 브라우저 안에서만 처리됩니다</div>
        <div class="sig" style="margin-top:8px;font-family:var(--mono,ui-monospace,monospace);font-size:11px;letter-spacing:.18em;opacity:.55">MADE IN SEOUL</div>
      </footer>
    `;
  }
}

customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);
