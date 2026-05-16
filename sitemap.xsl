<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xhtml="http://www.w3.org/1999/xhtml">
<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="noindex, nofollow"/>
<title>TAYSTUDIO Sitemap — XML</title>
<style>
  :root { --bg:#fafafa; --card:#fff; --text:#111; --muted:#52525b; --border:#e5e7eb; --primary:#2563eb; --ok:#10b981; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0f1115; --card:#1a1d23; --text:#e5e7eb; --muted:#9ca3af; --border:#2a2e36; } }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif; background:var(--bg); color:var(--text); padding:24px 16px; max-width:1200px; margin:0 auto; line-height:1.5; }
  h1 { font-size:22px; margin-bottom:6px; }
  .meta { color:var(--muted); font-size:13px; margin-bottom:18px; }
  .meta strong { color:var(--text); }
  .summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:8px; margin:14px 0 20px; }
  .stat { background:var(--card); border:1px solid var(--border); border-radius:6px; padding:10px 14px; }
  .stat-label { font-size:11.5px; color:var(--muted); text-transform:uppercase; letter-spacing:0.04em; }
  .stat-value { font-size:18px; font-weight:700; margin-top:2px; }
  .stat-value.ok { color:var(--ok); }
  table { width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--border); border-radius:6px; overflow:hidden; }
  th, td { padding:8px 12px; text-align:left; border-bottom:1px solid var(--border); font-size:13px; }
  th { background:rgba(37,99,235,0.08); font-weight:600; font-size:11.5px; text-transform:uppercase; letter-spacing:0.04em; color:var(--muted); }
  tr:last-child td { border-bottom:none; }
  tr:hover { background:rgba(37,99,235,0.04); }
  a { color:var(--primary); text-decoration:none; }
  a:hover { text-decoration:underline; }
  .lang { display:inline-block; padding:1px 6px; border-radius:3px; font-size:10.5px; font-weight:600; background:rgba(37,99,235,0.12); color:var(--primary); margin-left:4px; }
  .hreflang-cell { font-size:11px; color:var(--muted); }
  .hreflang-cell .h { display:inline-block; margin-right:6px; }
  .footer-note { margin-top:24px; color:var(--muted); font-size:12px; text-align:center; }
</style>
</head>
<body>
<h1>TAYSTUDIO Sitemap</h1>
<div class="meta">
  XML sitemap for <strong>taystudios.com</strong> — auto-rendered from <code>/sitemap.xml</code>.
  검색엔진(Google·Naver·Bing)이 이 페이지를 직접 파싱합니다. 시각 표시는 운영자 편의용.
</div>

<div class="summary">
  <div class="stat">
    <div class="stat-label">Total URLs</div>
    <div class="stat-value ok"><xsl:value-of select="count(s:urlset/s:url)"/></div>
  </div>
  <div class="stat">
    <div class="stat-label">hreflang alternates</div>
    <div class="stat-value"><xsl:value-of select="count(//xhtml:link)"/></div>
  </div>
  <div class="stat">
    <div class="stat-label">Multilingual pairs</div>
    <div class="stat-value"><xsl:value-of select="count(//xhtml:link[@hreflang='x-default']) div 2"/></div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:56px">#</th>
      <th>URL</th>
      <th style="width:96px">lastmod</th>
      <th style="width:82px">changefreq</th>
      <th style="width:54px">priority</th>
      <th style="width:180px">hreflang</th>
    </tr>
  </thead>
  <tbody>
    <xsl:for-each select="s:urlset/s:url">
      <tr>
        <td><xsl:value-of select="position()"/></td>
        <td>
          <a href="{s:loc}" target="_blank" rel="noopener">
            <xsl:value-of select="s:loc"/>
          </a>
          <xsl:if test="contains(s:loc, '/en/')"><span class="lang">EN</span></xsl:if>
        </td>
        <td><xsl:value-of select="s:lastmod"/></td>
        <td><xsl:value-of select="s:changefreq"/></td>
        <td><xsl:value-of select="s:priority"/></td>
        <td class="hreflang-cell">
          <xsl:for-each select="xhtml:link">
            <span class="h"><xsl:value-of select="@hreflang"/></span>
          </xsl:for-each>
          <xsl:if test="not(xhtml:link)"><span style="color:var(--muted)">—</span></xsl:if>
        </td>
      </tr>
    </xsl:for-each>
  </tbody>
</table>

<div class="footer-note">
  TAYSTUDIO · sitemap.xml auto-render via XSL · 검색엔진은 raw XML만 파싱
</div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
