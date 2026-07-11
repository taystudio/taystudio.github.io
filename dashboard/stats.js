/* taystudios 통계 대시보드 — 실데이터(/_stats/query) 또는 목데이터(demo) */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return (n || 0).toLocaleString('ko-KR'); };
  var TKEY = 'tay_stats_token';
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];

  var state = { days: 30, metric: 'views', cmetric: 'views', gran: 'day', path: null, token: null, demo: false, cal: null, who: 'human' };
  var CHAN_COL = { '검색': '#2563eb', 'SNS': '#f59e0b', '직접': '#94a3b8', '기타': '#64748b' };
  var DEV_COL = { 'mobile': '#2563eb', 'desktop': '#10b981', 'tablet': '#f59e0b', 'unknown': '#94a3b8' };
  var SRC_LABEL = {
    'google.com': 'Google', 'www.google.com': 'Google',
    'naver.com': '네이버', 'search.naver.com': '네이버 검색', 'm.search.naver.com': '네이버 검색(모바일)', 'm.naver.com': '네이버(모바일)',
    'daum.net': '다음', 'search.daum.net': '다음 검색', 'bing.com': 'Bing', 'duckduckgo.com': 'DuckDuckGo',
    'instagram.com': '인스타그램', 'l.instagram.com': '인스타그램', 'facebook.com': '페이스북', 'l.facebook.com': '페이스북',
    'youtube.com': '유튜브', 'm.youtube.com': '유튜브', 't.co': 'X(트위터)', 'x.com': 'X(트위터)',
    'kakao.com': '카카오', 'tistory.com': '티스토리', 'velog.io': 'velog', 'blog.naver.com': '네이버 블로그'
  };
  function srcLabel(h) { return SRC_LABEL[h] || h; }

  var CTY_NAME = {
    KR: '대한민국', US: '미국', JP: '일본', CN: '중국', TW: '대만', HK: '홍콩', VN: '베트남', TH: '태국',
    ID: '인도네시아', PH: '필리핀', IN: '인도', SG: '싱가포르', MY: '말레이시아', DE: '독일', GB: '영국',
    FR: '프랑스', CA: '캐나다', AU: '호주', RU: '러시아', BR: '브라질', NL: '네덜란드', CH: '스위스',
    SE: '스웨덴', ES: '스페인', IT: '이탈리아', AE: '아랍에미리트', NZ: '뉴질랜드'
  };
  function ctyName(c) { if (!c || c === 'XX') return '알 수 없음'; return CTY_NAME[c] || c; }
  function ctyFlag(c) {
    if (!c || c.length !== 2 || c === 'XX') return '🏳️';
    return String.fromCodePoint(0x1F1E6 + (c.charCodeAt(0) - 65), 0x1F1E6 + (c.charCodeAt(1) - 65));
  }

  /* ── init ── (※ 시작 트리거는 IIFE 맨 끝 — var 초기화가 먼저 실행되도록) */
  var qs = new URLSearchParams(location.search);
  if (qs.get('demo') === '1') state.demo = true;
  state.token = qs.get('token') || localStorage.getItem(TKEY) || null;

  $('tokenGo').onclick = function () {
    var t = $('tokenInput').value.trim(); if (!t) return;
    localStorage.setItem(TKEY, t); state.token = t; start();
  };
  $('tokenInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('tokenGo').click(); });
  $('demoLink').onclick = function () { state.demo = true; start(); };

  function start() {
    $('gate').style.display = 'none';
    $('app').style.display = 'block';
    document.body.classList.toggle('demo', state.demo);
    bindControls(); initSelfExclude(); load(); startRealtime();
  }

  /* ── 내 방문 제외 (GoatCounter skipgc 등가 — 쿠키 기반, worker가 읽어 로깅 스킵) ── */
  function initSelfExclude() {
    var chk = $('noLogChk'); if (!chk) return;
    function has() { return document.cookie.indexOf('tay_nolog=1') > -1; }
    function setCookie(on) { document.cookie = 'tay_nolog=1; path=/; SameSite=Lax; max-age=' + (on ? 31536000 : 0); }
    // 기본값 = 제외 ON (대시보드 여는 사람 = 운영자). 단 명시적으로 끈 적 있으면 존중.
    var optedIn = false;
    try { optedIn = localStorage.getItem('tay_nolog_off') === '1'; } catch (e) {}
    if (!has() && !optedIn) setCookie(true);
    function paint() { chk.checked = has(); $('noLogState').textContent = has() ? '· 제외 중 ✓ (기본)' : '· 집계에 포함됨'; }
    chk.onchange = function () {
      setCookie(chk.checked);
      try { if (chk.checked) localStorage.removeItem('tay_nolog_off'); else localStorage.setItem('tay_nolog_off', '1'); } catch (e) {}
      paint();
    };
    paint();
  }

  /* ── 실시간 (지금 보는 중) — 20초마다 갱신 ── */
  var rtTimer = null;
  function startRealtime() {
    pollRealtime();
    if (rtTimer) clearInterval(rtTimer);
    rtTimer = setInterval(pollRealtime, 20000);
  }
  function pollRealtime() {
    if (state.demo) { setRt(2 + Math.floor(Math.abs(Math.sin(Date.now() / 6e4)) * 6), [{ path: '/tools/salary/' }, { path: '/image/compress/' }]); return; }
    fetch('/_stats/realtime?token=' + encodeURIComponent(state.token), { cache: 'no-store' })
      .then(function (r) { return (r.ok && (r.headers.get('content-type') || '').indexOf('json') > -1) ? r.json() : null; })
      .then(function (d) { if (d && !d.error) setRt(d.online, d.recent); })
      .catch(function () {});
  }
  function setRt(n, recent) {
    var el = $('rt'); if (!el) return;
    $('rtN').textContent = fmt(n || 0);
    el.classList.add('show');
    el.title = (recent && recent.length) ? '최근 5분: ' + recent.map(function (r) { return r.path; }).slice(0, 8).join(', ') : '최근 5분 활동';
  }
  function bindControls() {
    $('rangeSeg').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { state.days = b.dataset.days === 'all' ? 'all' : +b.dataset.days; seg('rangeSeg', b); load(); };
    });
    $('whoSeg').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { state.who = b.dataset.who; seg('whoSeg', b); load(); };
    });
    $('metricSeg').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { state.metric = b.dataset.metric; seg('metricSeg', b); draw(); };
    });
    $('granSeg').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { state.gran = b.dataset.gran; seg('granSeg', b); draw(); };
    });
    bindChartHover();
    $('ctyMetricSeg').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { state.cmetric = b.dataset.cm; seg('ctyMetricSeg', b); reRenderCountries(); };
    });
    $('backBtn').onclick = function () { state.path = null; document.body.classList.remove('drilled'); load(); };
    $('calPrev').onclick = function () { shiftMonth(-1); };
    $('calNext').onclick = function () { shiftMonth(1); };
  }
  function seg(id, on) { $(id).querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === on); }); }
  function reRenderCountries() { if (cur) renderCountries(cur.countries); }   // 국가 조회수/방문자 토글 재렌더

  /* ── load ── */
  var cur = null, byDay = {};
  function load() {
    if (state.demo) { cur = mock(state); afterLoad(); return; }
    var u = '/_stats/query?token=' + encodeURIComponent(state.token) + '&days=' + state.days + '&who=' + state.who + (state.path ? '&path=' + encodeURIComponent(state.path) : '');
    fetch(u, { cache: 'no-store' })
      .then(function (r) {
        if (r.status === 401) throw new Error('토큰이 틀렸습니다');
        var ct = r.headers.get('content-type') || '';
        if (ct.indexOf('application/json') === -1) {
          // JSON 이 아님 = Worker 가 이 요청을 못 받음 (로컬 서버·미배포 등)
          throw new Error('__NOTJSON__');
        }
        return r.json();
      })
      .then(function (d) { if (d.error) throw new Error(d.error); cur = d; afterLoad(); })
      .catch(function (e) {
        var isLocal = /^localhost$|^127\.|^0\.0\.0\.0$/.test(location.hostname);
        var msg = e.message === '__NOTJSON__'
          ? (isLocal
              ? '로컬(localhost)에는 Worker 가 없어요. 실데이터는 <b>taystudios.com/dashboard/</b> 에서만 나옵니다. 로컬에선 아래 미리보기로 확인하세요.'
              : 'Worker 응답이 JSON 이 아닙니다. wrangler deploy 가 됐는지, /dashboard 가 Worker route(taystudios.com/*) 안에 있는지 확인하세요.')
          : (e.message || e);
        $('app').innerHTML = '<div class="card"><b>불러오기 실패</b><p class="muted">' + msg +
          '</p><p class="muted"><a class="demolink" href="?demo=1">목데이터로 미리보기 →</a></p>' +
          '<p><a class="demolink" href="#" onclick="localStorage.removeItem(\'' + TKEY + '\');location.search=\'\';return false">토큰 다시 입력</a></p></div>';
      });
  }
  function afterLoad() {
    byDay = {};
    (cur.daily || []).forEach(function (r) { byDay[r.day] = { v: r.v, u: r.u }; });
    var t = ((cur.range && cur.range.today) || '').split('-');
    state.cal = t.length === 3 ? { y: +t[0], m: +t[1] } : { y: 2026, m: 1 };
    render();
  }

  /* ── render ── */
  function render() {
    var d = cur, r = d.range || {};
    var rangeTxt = state.days === 'all' ? '전체 기간' : '최근 ' + state.days + '일';
    var h = (state.demo ? '<b>목데이터</b><span class="dot"></span>' : '');
    h += '오늘 <b>' + fmtDate(r.today) + '</b>';
    if (r.firstDay) h += '<span class="dot"></span>집계 시작 <b>' + fmtDate(r.firstDay) + '</b><span class="dot"></span><b>' + daysSince(r.firstDay, r.today) + '일째</b>';
    h += '<span class="dot"></span>' + rangeTxt;
    var whoTxt = state.who === 'bot' ? '<b style="color:var(--accent)">봇만</b>' : state.who === 'all' ? '<b>사람+봇 전체</b>' : '<b style="color:var(--success)">사람만</b>';
    h += '<span class="dot"></span>' + whoTxt;
    if (state.who === 'human' && d.botViews > 0) h += '<span class="dot"></span>봇 ' + fmt(d.botViews) + '회 제외됨';
    $('asof').innerHTML = h;

    if (state.path) { document.body.classList.add('drilled'); $('curPath').textContent = state.path; }
    else document.body.classList.remove('drilled');

    // KPI + delta
    var k = d.kpi;
    var cells = [
      { l: '오늘 조회수', n: k.todayViews, u: '회', dl: k.todayViews - k.ydayViews },
      { l: '어제 조회수', n: k.ydayViews, u: '회' },
      { l: '누적 조회수', n: k.totalViews, u: '회' },
      { l: '오늘 방문자', n: k.todayVisitors, u: '명', dl: k.todayVisitors - k.ydayVisitors },
      { l: '어제 방문자', n: k.ydayVisitors, u: '명' },
      { l: '누적 방문자', n: k.totalVisitors, u: '명' }
    ];
    $('kpi').innerHTML = cells.map(function (c) {
      return '<div class="cell"><div class="lab">' + c.l + '</div><div class="num">' + fmt(c.n) +
        '<span class="unit">' + c.u + '</span>' + delta(c.dl) + '</div></div>';
    }).join('');

    renderWow(d.wow);
    renderConfirmed(d.confirmed, k);
    draw();
    calendar();

    var base = (d.channels || []).reduce(function (s, x) { return s + x.v; }, 0) || 1;  // 전체 조회 = %기준
    bars('channels', d.channels, 'channel', CHAN_COL, base);
    bars('devices', d.devices, 'device', DEV_COL, base);
    renderSources('sources', d.sources, base);
    renderCountries(d.countries);
    renderBotKinds(d.botKinds, base);

    var pc = $('pagesCard'); pc.style.display = state.path ? 'none' : '';
    $('missCard').style.display = state.path ? 'none' : '';
    if (!state.path) {
      $('pages').innerHTML = (d.topPages || []).map(function (p, i) {
        return '<tr data-path="' + esc(p.path) + '"><td class="rank">' + (i + 1) + '</td>' +
          '<td class="path">' + esc(p.path) + '</td><td class="n">' + fmt(p.v) + '</td><td class="n">' + fmt(p.u) + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="muted">데이터 없음</td></tr>';
      $('pages').querySelectorAll('tr[data-path]').forEach(function (tr) {
        tr.onclick = function () { state.path = tr.dataset.path; load(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      });
      renderMisses(d.misses);
    }
  }

  function renderWow(w) {
    if (!w) { $('wow').innerHTML = '<p class="muted">데이터 없음</p>'; return; }
    var rows = [['조회수', w.cur.views, w.prev.views], ['방문자', w.cur.visitors, w.prev.visitors]];
    $('wow').innerHTML = rows.map(function (r) {
      var cur = r[1], prev = r[2], pct = prev > 0 ? Math.round((cur - prev) / prev * 100) : (cur > 0 ? 100 : 0);
      var cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
      var arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '–';
      var dtxt = prev === 0 && cur === 0 ? '–' : (arrow + ' ' + Math.abs(pct) + '%');
      return '<div class="wow-row"><span class="wlab">' + r[0] + '</span>' +
        '<span><span class="wv">' + fmt(cur) + '</span><span class="wp">지난주 ' + fmt(prev) + '</span></span>' +
        '<span class="wd ' + cls + '">' + dtxt + '</span></div>';
    }).join('');
  }

  function uaLabel(ua) {
    if (!ua) return '알수없음';
    var pats = [
      [/googlebot|google-inspectiontool|storebot/i, 'Googlebot'], [/google-extended/i, 'Google-Extended'],
      [/bingbot|bingpreview/i, 'Bingbot'], [/yeti/i, '네이버 Yeti'], [/daum/i, '다음'],
      [/gptbot/i, 'GPTBot'], [/claudebot|anthropic/i, 'ClaudeBot'], [/perplexity/i, 'Perplexity'],
      [/ahrefs/i, 'AhrefsBot'], [/semrush/i, 'SemrushBot'], [/mj12/i, 'MJ12bot'], [/dotbot/i, 'DotBot'],
      [/dataforseo/i, 'DataForSeo'], [/bytespider/i, 'Bytespider'], [/petalbot/i, 'PetalBot'],
      [/censys|shodan|zgrab|masscan/i, '스캐너'], [/facebookexternal|meta-external/i, 'Meta'],
      [/slackbot|telegram|whatsapp|discord|embedly/i, '링크 미리보기'], [/curl|wget|python-|axios|go-http|okhttp|scrapy|node-fetch|httpclient|java\//i, '스크립트/HTTP'],
      [/headless|lighthouse/i, 'Headless'], [/bot|crawl|spider|slurp/i, '기타 봇'],
      [/edg\//i, 'Edge'], [/samsungbrowser/i, '삼성브라우저'], [/whale/i, '웨일'],
      [/chrome/i, 'Chrome'], [/firefox/i, 'Firefox'], [/safari/i, 'Safari']
    ];
    for (var i = 0; i < pats.length; i++) if (pats[i][0].test(ua)) return pats[i][1];
    return ua.slice(0, 24);
  }
  function renderMisses(items) {
    items = items || [];
    if (!items.length) { $('misses').innerHTML = '<p class="muted">404 유입 없음 — 깨진 링크가 없다는 뜻이라 좋은 신호예요 👍</p>'; return; }
    $('misses').innerHTML = '<table><thead><tr><th>없는 경로</th><th>누가</th><th class="n">횟수</th></tr></thead><tbody>' +
      items.map(function (m) {
        var who = uaLabel(m.ua);
        var net = m.asorg ? '<span class="miss-ref"> · ' + esc(m.asorg) + '</span>' : '';
        var ref = m.ref_host ? ' · ' + esc(srcLabel(m.ref_host)) : '';
        var tip = esc((m.ua || '(UA 없음)') + (m.asorg ? '  ·  ' + m.asorg : '') + (m.ref_host ? '  ·  ref:' + m.ref_host : ''));
        return '<tr style="cursor:default" title="' + tip + '"><td class="path" style="color:var(--danger)">' + esc(m.path) + '</td>' +
          '<td><b>' + esc(who) + '</b>' + net + '<span class="miss-ref">' + ref + '</span></td>' +
          '<td class="n">' + fmt(m.v) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function renderConfirmed(c, k) {
    var el = $('confbar'); if (!el) return;
    if (!c) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    // 사람(휴리스틱) 대비 얼마나 걸러졌나 — 오늘 방문자 기준
    var human = (k && k.todayVisitors) || 0, conf = c.todayVisitors || 0;
    var note = human > conf ? '휴리스틱 사람 ' + fmt(human) + '명 중 봇 의심 ' + fmt(Math.max(0, human - conf)) + '명 빠짐' : 'JS 렌더한 실브라우저';
    el.innerHTML =
      '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      '<span class="lab">확인된 사람</span>' +
      '<span class="seg-vals">' +
        '<span>오늘 <b>' + fmt(c.todayVisitors) + '</b><span class="u">명</span></span>' +
        '<span>어제 <b>' + fmt(c.ydayVisitors) + '</b><span class="u">명</span></span>' +
        '<span>기간 <b>' + fmt(c.rangeVisitors) + '</b><span class="u">명 · ' + fmt(c.rangeViews) + '뷰</span></span>' +
      '</span>' +
      '<span class="note">JS 실행한 실브라우저만 · ' + esc(note) + '</span>';
  }

  function delta(x) {
    if (x === undefined || x === null) return '';
    if (x > 0) return '<span class="delta up">▲' + fmt(x) + '</span>';
    if (x < 0) return '<span class="delta down">▼' + fmt(-x) + '</span>';
    return '<span class="delta flat">–</span>';
  }

  function bars(id, items, key, colmap, base) {
    items = items || [];
    $(id).innerHTML = items.map(function (x) {
      var pct = Math.round(x.v / base * 100);
      var col = (colmap && colmap[x[key]]) || '#2563eb';
      var name = x[key] === 'mobile' ? '모바일' : x[key] === 'desktop' ? 'PC' : x[key] === 'tablet' ? '태블릿' : x[key];
      return '<div class="bar-row"><span class="name">' + esc(name) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + Math.max(2, pct) + '%;background:' + col + '"></span></span>' +
        '<span class="val"><b>' + fmt(x.v) + '</b>회 · ' + pct + '%</span></div>';
    }).join('') || '<p class="muted">데이터 없음</p>';
  }
  function renderSources(id, items, base) {
    items = items || [];
    $(id).innerHTML = items.map(function (x) {
      var pct = Math.round(x.v / base * 100);
      var col = CHAN_COL[x.channel] || '#2563eb';
      return '<div class="bar-row wide"><span class="name" title="' + esc(x.ref_host) + '">' + esc(srcLabel(x.ref_host)) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + Math.max(2, pct) + '%;background:' + col + '"></span></span>' +
        '<span class="val"><b>' + fmt(x.v) + '</b>회 · ' + pct + '%</span></div>';
    }).join('') || '<p class="muted">외부 유입 없음 (직접 방문만)</p>';
  }
  function renderBotKinds(items, base) {
    var card = $('botKindsCard');
    if (state.who !== 'bot') { card.style.display = 'none'; return; }
    card.style.display = '';
    items = items || [];
    $('botKinds').innerHTML = items.map(function (x) {
      var pct = Math.round(x.v / base * 100);
      var name = x.name || '기타 봇';
      var col = /google/i.test(name) ? '#4285f4' : /gpt|openai/i.test(name) ? '#10a37f'
        : /claude|anthropic/i.test(name) ? '#d97757' : /bing/i.test(name) ? '#0a8484'
        : /데이터센터/.test(name) ? '#94a3b8' : /스캐너/.test(name) ? '#ef4444' : '#f59e0b';
      return '<div class="bar-row wide"><span class="name" title="' + esc(name) + '">' + esc(name) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + Math.max(2, pct) + '%;background:' + col + '"></span></span>' +
        '<span class="val"><b>' + fmt(x.v) + '</b>회 · ' + pct + '%</span></div>';
    }).join('') || '<p class="muted">봇 데이터 없음</p>';
  }
  function renderCountries(items) {
    items = items || [];
    var vis = state.cmetric === 'visitors';
    var key = vis ? 'u' : 'v', unit = vis ? '명' : '회';
    var base = items.reduce(function (s, x) { return s + (x[key] || 0); }, 0) || 1;
    var note = $('ctyNote'); if (note) note.textContent = '방문자 IP 기반 (Cloudflare) · % 는 전체 ' + (vis ? '방문자' : '조회') + ' 대비';
    // 방문자 기준이면 방문자수로 재정렬
    var rows = vis ? items.slice().sort(function (a, b) { return (b.u || 0) - (a.u || 0); }) : items;
    $('countries').innerHTML = rows.map(function (x) {
      var val = x[key] || 0, pct = Math.round(val / base * 100);
      var col = x.country === 'KR' ? '#2563eb' : '#64748b';
      return '<div class="bar-row wide cty-row" data-cc="' + esc(x.country) + '" title="클릭 → 이 국가가 본 페이지"><span class="name">' + ctyFlag(x.country) + ' ' + esc(ctyName(x.country)) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + Math.max(2, pct) + '%;background:' + col + '"></span></span>' +
        '<span class="val"><b>' + fmt(val) + '</b>' + unit + ' · ' + pct + '%</span></div>';
    }).join('') || '<p class="muted">데이터 없음</p>';
    $('countries').querySelectorAll('.cty-row').forEach(function (row) {
      row.onclick = function () { toggleCountryPages(row, row.dataset.cc); };
    });
  }
  function toggleCountryPages(row, cc) {
    var nx = row.nextElementSibling;
    if (nx && nx.className === 'cty-detail') { nx.parentNode.removeChild(nx); row.classList.remove('open'); return; }
    var box = $('countries');
    box.querySelectorAll('.cty-detail').forEach(function (e) { e.parentNode.removeChild(e); });
    box.querySelectorAll('.cty-row.open').forEach(function (e) { e.classList.remove('open'); });
    row.classList.add('open');
    var det = document.createElement('div');
    det.className = 'cty-detail';
    det.innerHTML = '<span class="muted">불러오는 중…</span>';
    row.parentNode.insertBefore(det, row.nextSibling);
    loadCountryPages(cc).then(function (pages) {
      if (!pages || !pages.length) { det.innerHTML = '<span class="muted">이 국가의 페이지 데이터 없음</span>'; return; }
      var vis = state.cmetric === 'visitors', ky = vis ? 'u' : 'v', unit = vis ? '명' : '회';
      var tot = pages.reduce(function (s, p) { return s + (p[ky] || 0); }, 0) || 1;
      det.innerHTML = '<div class="cty-detail-h">' + ctyFlag(cc) + ' ' + esc(ctyName(cc)) + ' 가 본 페이지 (' + (vis ? '방문자' : '조회수') + ')</div>' +
        pages.slice(0, 12).map(function (p) {
          var v = p[ky] || 0, pc = Math.round(v / tot * 100);
          return '<div class="cty-pg"><span class="pg-path">' + esc(p.path) + '</span>' +
            '<span class="pg-bar"><span style="width:' + Math.max(3, pc) + '%"></span></span>' +
            '<span class="pg-n"><b>' + fmt(v) + '</b>' + unit + '</span></div>';
        }).join('');
    });
  }
  function loadCountryPages(cc) {
    if (state.demo) return Promise.resolve(mockCountryPages(cc));
    var u = '/_stats/country?token=' + encodeURIComponent(state.token) + '&days=' + state.days + '&who=' + state.who + '&country=' + encodeURIComponent(cc);
    return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { pages: [] }; })
      .then(function (d) { return d.pages || []; }).catch(function () { return []; });
  }
  function mockCountryPages(cc) {
    var m = cc === 'KR'
      ? [['/tools/salary/', 24], ['/tools/', 13], ['/image/compress/', 9], ['/pdf/merge/', 7], ['/blog/ko/yonsei-grad-mech-interview/', 5], ['/tools/bmi/', 3]]
      : cc === 'US'
        ? [['/en/', 4], ['/image/compress/', 3], ['/en/tools/', 2], ['/pdf/merge/', 1]]
        : [['/', 1], ['/image/compress/', 1]];
    return m.map(function (p) { return { path: p[0], v: p[1], u: Math.max(1, Math.round(p[1] * 0.7)) }; });
  }

  /* ── 캘린더 (드릴다운 시 그 페이지의 날짜별 조회) ── */
  function shiftMonth(dir) {
    if (!state.cal) return;
    var m = state.cal.m + dir, y = state.cal.y;
    if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
    state.cal = { y: y, m: m }; calendar();
  }
  function calendar() {
    if (!state.cal) return;
    var y = state.cal.y, m = state.cal.m;
    $('calMon').textContent = y + '. ' + m;
    var today = (cur.range && cur.range.today) || '';
    var days = new Date(y, m, 0).getDate();
    var lead = new Date(y, m - 1, 1).getDay();
    var maxV = 1;
    for (var dd = 1; dd <= days; dd++) { var s = key(y, m, dd); if (byDay[s] && byDay[s].v > maxV) maxV = byDay[s].v; }
    var html = DOW.map(function (w) { return '<div class="cal-dow">' + w + '</div>'; }).join('');
    for (var i = 0; i < lead; i++) html += '<div class="cal-cell empty"></div>';
    for (var day = 1; day <= days; day++) {
      var ds = key(y, m, day), data = byDay[ds];
      var cls = 'cal-cell', style = '', inner = '';
      if (ds === today) cls += ' today';
      if (ds > today) cls += ' future';
      if (data && data.v > 0) {
        var a = 0.15 + 0.75 * (data.v / maxV);
        cls += ' has'; style = 'background:rgba(37,99,235,' + a.toFixed(2) + ');';
        inner = '<span class="nums"><span class="cv">' + fmt(data.v) + '<i>회</i></span><span class="cu">' + fmt(data.u) + '<i>명</i></span></span>';
      }
      var tip = ds + (data ? ' · 조회 ' + fmt(data.v) + ' · 방문자 ' + fmt(data.u) : ' · 데이터 없음');
      html += '<div class="' + cls + '" style="' + style + '" title="' + tip + '"><span class="dnum">' + day + '</span>' + inner + '</div>';
    }
    $('cal').innerHTML = html;
  }
  function key(y, m, d) { return y + '-' + p2(m) + '-' + p2(d); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }

  /* ── 막대차트 (일간/주간/월간, 오늘 강조, hover 툴팁) ── */
  var chartBars = [];   // hover 히트테스트용 (CSS px)
  function bucketKey(day, gran) {
    if (gran === 'month') return day.slice(0, 7);                 // YYYY-MM
    if (gran === 'week') {                                        // 그 주 월요일 날짜
      var p = day.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
      dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
      return dt.getFullYear() + '-' + p2(dt.getMonth() + 1) + '-' + p2(dt.getDate());
    }
    return day;
  }
  function aggSeries() {
    var daily = cur.daily || [];
    if (state.gran === 'day') return daily.map(function (d) { return { day: d.day, v: d.v, u: d.u }; });
    var m = {}, order = [];
    daily.forEach(function (d) {
      var k = bucketKey(d.day, state.gran);
      if (!m[k]) { m[k] = { day: k, v: 0, u: 0 }; order.push(k); }
      m[k].v += d.v; m[k].u += d.u;
    });
    return order.map(function (k) { return m[k]; });
  }
  function axisLabel(day, gran) { var p = day.split('-'); return gran === 'month' ? (+p[1]) + '월' : (+p[1]) + '/' + (+p[2]); }
  function tipLabel(day, gran) {
    var p = day.split('-');
    if (gran === 'month') return p[0] + '년 ' + (+p[1]) + '월';
    var dt = new Date(+p[0], +p[1] - 1, +p[2]);
    if (gran === 'week') return (+p[1]) + '월 ' + (+p[2]) + '일 주간';
    return (+p[1]) + '월 ' + (+p[2]) + '일 (' + DOW[dt.getDay()] + ')';
  }
  function granName() { return state.gran === 'week' ? '주간' : state.gran === 'month' ? '월간' : '일간'; }

  function draw() {
    chartBars = [];
    var series = aggSeries();
    var cv = $('chart'), dpr = window.devicePixelRatio || 1;
    var cssW = cv.clientWidth || 900, cssH = 230;
    cv.width = cssW * dpr; cv.height = cssH * dpr;
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, cssW, cssH);
    var cs = getComputedStyle(document.body);
    var muted = cs.getPropertyValue('--faint') || '#999';
    var textc = (cs.getPropertyValue('--muted') || '#888').trim();
    var col = (state.metric === 'visitors' ? (cs.getPropertyValue('--visitors') || '#c9ced6') : (cs.getPropertyValue('--views') || '#f28b82')).trim();
    var padL = 32, padR = 12, padT = 12, padB = 30;
    if (!series.length) { c.fillStyle = muted; c.font = '13px sans-serif'; c.fillText('데이터 없음', padL, cssH / 2); return; }
    var mk = state.metric === 'visitors' ? 'u' : 'v';
    var maxV = niceMax(Math.max(1, Math.max.apply(null, series.map(function (x) { return x[mk]; }))));
    var n = series.length, plotW = cssW - padL - padR, plotH = cssH - padT - padB;
    var slot = plotW / n, barW = Math.max(3, Math.min(24, slot * 0.55));
    var Y = function (v) { return cssH - padB - (v / maxV) * plotH; };
    // gridlines + y라벨
    c.strokeStyle = 'rgba(128,128,128,.13)'; c.fillStyle = muted; c.font = '10.5px sans-serif'; c.lineWidth = 1; c.textAlign = 'left';
    for (var g = 0; g <= 4; g++) { var gv = maxV * g / 4, gy = Y(gv); c.beginPath(); c.moveTo(padL, gy); c.lineTo(cssW - padR, gy); c.stroke(); c.fillText(fmt(Math.round(gv)), 2, gy - 2); }
    var today = (cur.range && cur.range.today) || '';
    var step = Math.max(1, Math.ceil(n / 8)), prev = 0, r = Math.min(3, barW / 2);
    for (var i = 0; i < n; i++) {
      var d = series[i], val = d[mk], cx = padL + slot * i + slot / 2;
      var h = Math.max(val > 0 ? 2 : 0, (val / maxV) * plotH), y = cssH - padB - h;
      var isToday = state.gran === 'day' && d.day === today;
      c.fillStyle = isToday ? '#ef4444' : col;
      roundRectTop(c, cx - barW / 2, y, barW, h, r);
      chartBars.push({ x0: padL + slot * i, x1: padL + slot * (i + 1), cx: cx, top: y, val: val, tip: tipLabel(d.day, state.gran), delta: val - prev });
      prev = val;
    }
    // x축 날짜 라벨 (크게, 가운데 정렬)
    c.fillStyle = textc; c.font = '12.5px sans-serif'; c.textAlign = 'center';
    for (var j = 0; j < n; j++) { if (j % step === 0) c.fillText(axisLabel(series[j].day, state.gran), padL + slot * j + slot / 2, cssH - 9); }
    c.textAlign = 'left';
  }
  function roundRectTop(c, x, y, w, h, r) {
    if (h <= 0) return; r = Math.min(r, h);
    c.beginPath();
    c.moveTo(x, y + h); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h);
    c.closePath(); c.fill();
  }
  function bindChartHover() {
    var cv = $('chart'), tip = $('chartTip');
    if (!cv || cv.__hoverBound) return; cv.__hoverBound = true;
    cv.addEventListener('mousemove', function (e) {
      var rect = cv.getBoundingClientRect(), mx = e.clientX - rect.left, bar = null;
      for (var i = 0; i < chartBars.length; i++) { if (mx >= chartBars[i].x0 && mx < chartBars[i].x1) { bar = chartBars[i]; break; } }
      if (!bar) { tip.hidden = true; return; }
      var unit = state.metric === 'visitors' ? '명' : '회', mn = state.metric === 'visitors' ? '방문자' : '조회수';
      var dl = bar.delta, dc = dl > 0 ? 'up' : dl < 0 ? 'down' : 'flat', ar = dl > 0 ? '▲' : dl < 0 ? '▼' : '';
      tip.innerHTML = '<div class="tl">' + bar.tip + ' · ' + granName() + ' ' + mn + '</div>' +
        '<div><span class="tv">' + fmt(bar.val) + '</span>' + unit + ' <span class="td ' + dc + '">' + (dl === 0 ? '–' : ar + fmt(Math.abs(dl))) + '</span></div>';
      tip.hidden = false;
      var tw = tip.offsetWidth;
      tip.style.left = Math.max(2, Math.min(cv.clientWidth - tw - 2, bar.cx - tw / 2)) + 'px';
      tip.style.top = Math.max(0, bar.top - tip.offsetHeight - 6) + 'px';
    });
    cv.addEventListener('mouseleave', function () { tip.hidden = true; });
  }
  function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p) * p; }
  function hexA(h, a) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join(''); var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function fmtDate(s) { if (!s) return '-'; var p = s.split('-'); var dt = new Date(+p[0], +p[1] - 1, +p[2]); return (+p[1]) + '월 ' + (+p[2]) + '일 (' + DOW[dt.getDay()] + ')'; }
  function daysSince(a, b) { if (!a || !b) return 1; return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000) + 1; }
  window.addEventListener('resize', function () { if (cur) draw(); });
  window.__redrawChart = function () { if (cur) { draw(); calendar(); } };  // 테마 전환 시 재렌더

  /* ── 목데이터 ── */
  function mock(st) {
    var days = st.days === 'all' ? 62 : st.days, arr = [], base = new Date();
    var scale = (st.path ? 0.15 : 1) * (st.who === 'bot' ? 0.9 : st.who === 'all' ? 1.9 : 1);
    var isBot = st.who === 'bot';
    for (var i = days - 1; i >= 0; i--) {
      var dt = new Date(base.getTime() - i * 86400000), dow = dt.getDay();
      var wk = (dow === 0 || dow === 6) ? 0.6 : 1;
      var v = Math.round((28 + Math.sin(i / 3) * 12 + Math.random() * 18) * wk * scale) + 2;
      arr.push({ day: kst(dt), v: v, u: Math.max(1, Math.round(v * 0.72)) });
    }
    var rangeV = arr.reduce(function (s, x) { return s + x.v; }, 0);
    var t = arr[arr.length - 1], y = arr[arr.length - 2] || t;
    var mul = st.path ? 40 : 300;
    var w1 = arr.slice(-7).reduce(function (s, x) { return s + x.v; }, 0);
    var w2 = arr.slice(-14, -7).reduce(function (s, x) { return s + x.v; }, 0) || Math.round(w1 * 0.85);
    return {
      range: { days: st.days === 'all' ? 'all' : days, today: kst(base), firstDay: arr[0].day },
      who: st.who, botViews: st.who === 'human' ? Math.round(rangeV * 0.9) : 0,
      botKinds: isBot ? [['데이터센터: Amazon AWS', .34], ['GPTBot (OpenAI)', .16], ['Googlebot', .13], ['ClaudeBot (Anthropic)', .09], ['Bingbot', .07], ['데이터센터: OVH SAS', .06], ['AhrefsBot', .05], ['스캐너', .04], ['PerplexityBot', .03], ['기타 봇', .03]]
        .map(function (b) { return { name: b[0], v: Math.max(1, Math.round(rangeV * b[1])), u: Math.max(1, Math.round(rangeV * b[1] * 0.6)) }; }) : [],
      path: st.path,
      wow: { cur: { views: w1, visitors: Math.round(w1 * 0.72) }, prev: { views: w2, visitors: Math.round(w2 * 0.72) } },
      confirmed: { todayViews: Math.round(t.v * 0.45), todayVisitors: Math.round(t.u * 0.4), ydayViews: Math.round(y.v * 0.45), ydayVisitors: Math.round(y.u * 0.4), rangeViews: Math.round(rangeV * 0.45), rangeVisitors: Math.round(rangeV * 0.3) },
      misses: st.path ? [] : [
        { path: '/blog/ko/POST/ko/tags/', ref_host: '', v: 4, ts: '', ua: 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)', asorg: 'Hetzner Online GmbH' },
        { path: '/tools/salaray/', ref_host: 'search.naver.com', v: 3, ts: '', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Mobile Safari', asorg: 'SK Broadband' },
        { path: '/image/comress/', ref_host: '', v: 2, ts: '', ua: 'curl/8.4.0', asorg: 'Amazon.com' }
      ],
      kpi: { todayViews: t.v, todayVisitors: t.u, ydayViews: y.v, ydayVisitors: y.u, totalViews: rangeV + mul * 12, totalVisitors: Math.round((rangeV + mul * 12) * 0.7) },
      daily: arr,
      channels: split(rangeV, [['검색', .68], ['기타', .2], ['직접', .08], ['SNS', .04]], 'channel'),
      devices: split(rangeV, [['mobile', .56], ['desktop', .41], ['tablet', .03]], 'device'),
      countries: (isBot
        ? [['US', .42], ['DE', .12], ['FR', .1], ['BR', .08], ['SG', .07], ['NL', .06], ['CN', .05], ['XX', .1]]
        : [['KR', .94], ['US', .03], ['JP', .012], ['CN', .008], ['XX', .01]])
        .map(function (c) { var vv = Math.max(1, Math.round(rangeV * c[1])); return { country: c[0], v: vv, u: Math.max(1, Math.round(vv * 0.68)) }; }),
      sources: [['google.com', '검색', .34], ['m.search.naver.com', '검색', .24], ['search.naver.com', '검색', .11],
        ['daum.net', '검색', .05], ['bing.com', '검색', .02], ['instagram.com', 'SNS', .04], ['youtube.com', 'SNS', .02], ['t.co', 'SNS', .01], ['tistory.com', '기타', .02]]
        .map(function (s) { return { ref_host: s[0], channel: s[1], v: Math.max(1, Math.round(rangeV * s[2])) }; }),
      topPages: st.path ? [] : [['/tools/salary/', .22], ['/tools/', .14], ['/blog/ko/yonsei-grad-mech-interview/', .11],
        ['/image/compress/', .1], ['/pdf/merge/', .08], ['/tools/year-end/', .07], ['/', .06], ['/tools/bmi/', .05], ['/text/symbols/', .05], ['/baby/', .04]]
        .map(function (p) { var vv = Math.round(rangeV * p[1]); return { path: p[0], v: vv, u: Math.round(vv * 0.72) }; })
    };
  }
  function split(total, parts, k) { return parts.map(function (p) { var o = { v: Math.round(total * p[1]) }; o[k] = p[0]; return o; }); }
  function kst(d) { return new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10); }

  /* ── 시작 트리거 (모든 var 초기화 이후 실행 — cur 리셋 버그 방지) ── */
  if (state.demo || state.token) start(); else $('gate').style.display = 'block';
})();
