/* taystudios 통계 대시보드 — 실데이터(/_stats/query) 또는 목데이터(demo) */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return (n || 0).toLocaleString('ko-KR'); };
  var TKEY = 'tay_stats_token';

  var state = { days: 30, metric: 'views', path: null, token: null, demo: false };
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

  /* ── init ── */
  var qs = new URLSearchParams(location.search);
  if (qs.get('demo') === '1') state.demo = true;
  state.token = qs.get('token') || localStorage.getItem(TKEY) || null;

  if (state.demo) { start(); }
  else if (state.token) { start(); }
  else { $('gate').style.display = 'block'; }

  $('tokenGo').onclick = function () {
    var t = $('tokenInput').value.trim();
    if (!t) return;
    localStorage.setItem(TKEY, t); state.token = t; start();
  };
  $('tokenInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('tokenGo').click(); });
  $('demoLink').onclick = function () { state.demo = true; start(); };

  function start() {
    $('gate').style.display = 'none';
    $('app').style.display = 'block';
    document.body.classList.toggle('demo', state.demo);
    bindControls();
    load();
  }

  function bindControls() {
    $('rangeSeg').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        state.days = b.dataset.days === 'all' ? 'all' : +b.dataset.days;
        seg('rangeSeg', b); load();
      };
    });
    $('metricSeg').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { state.metric = b.dataset.metric; seg('metricSeg', b); draw(); };
    });
    $('backBtn').onclick = function () { state.path = null; document.body.classList.remove('drilled'); load(); };
  }
  function seg(id, on) { $(id).querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === on); }); }

  /* ── load ── */
  var cur = null;
  function load() {
    if (state.demo) { cur = mock(state); render(); return; }
    var u = '/_stats/query?token=' + encodeURIComponent(state.token) + '&days=' + state.days + (state.path ? '&path=' + encodeURIComponent(state.path) : '');
    fetch(u, { cache: 'no-store' })
      .then(function (r) { if (r.status === 401) throw new Error('토큰이 틀렸습니다'); return r.json(); })
      .then(function (d) { if (d.error) throw new Error(d.error); cur = d; render(); })
      .catch(function (e) {
        $('app').innerHTML = '<div class="card"><b>불러오기 실패</b><p class="muted">' + (e.message || e) +
          '</p><p class="muted">Worker가 아직 배포 안 됐으면 <a class="demolink" href="?demo=1">목데이터로 미리보기</a>.</p>' +
          '<p><a class="demolink" href="#" onclick="localStorage.removeItem(\'' + TKEY + '\');location.search=\'\';return false">토큰 다시 입력</a></p></div>';
      });
  }

  /* ── render ── */
  function render() {
    var d = cur;
    var rangeTxt = state.days === 'all' ? '전체 기간' : '최근 ' + state.days + '일';
    $('asof').textContent = (state.demo ? '목데이터 · ' : '') + rangeTxt + ' · 기준 ' + (d.range && d.range.today || '');
    if (state.path) { document.body.classList.add('drilled'); $('curPath').textContent = state.path; }
    // KPI
    var k = d.kpi, cells = [
      ['오늘 조회수', k.todayViews], ['어제 조회수', k.ydayViews], ['누적 조회수', k.totalViews],
      ['오늘 방문자', k.todayVisitors], ['어제 방문자', k.ydayVisitors], ['누적 방문자', k.totalVisitors]
    ];
    $('kpi').innerHTML = cells.map(function (c) {
      return '<div class="cell"><div class="lab">' + c[0] + '</div><div class="num">' + fmt(c[1]) + '</div></div>';
    }).join('');
    draw();
    bars('channels', d.channels, 'channel', CHAN_COL);
    bars('devices', d.devices, 'device', DEV_COL);
    renderSources('sources', d.sources);
    // pages
    var pc = $('pagesCard'); pc.style.display = state.path ? 'none' : '';
    if (!state.path) {
      $('pages').innerHTML = (d.topPages || []).map(function (p, i) {
        return '<tr data-path="' + esc(p.path) + '"><td class="rank">' + (i + 1) + '</td>' +
          '<td class="path">' + esc(p.path) + '</td><td class="n">' + fmt(p.v) + '</td><td class="n">' + fmt(p.u) + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="muted">데이터 없음</td></tr>';
      $('pages').querySelectorAll('tr[data-path]').forEach(function (tr) {
        tr.onclick = function () { state.path = tr.dataset.path; load(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      });
    }
  }

  function bars(id, items, key, colmap) {
    items = items || [];
    var total = items.reduce(function (s, x) { return s + x.v; }, 0) || 1;
    $(id).innerHTML = items.map(function (x) {
      var pct = Math.round(x.v / total * 100);
      var col = (colmap && colmap[x[key]]) || '#2563eb';
      var name = x[key] === 'mobile' ? '모바일' : x[key] === 'desktop' ? 'PC' : x[key] === 'tablet' ? '태블릿' : x[key];
      return '<div class="bar-row"><span class="name">' + esc(name) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%;background:' + col + '"></span></span>' +
        '<span class="val">' + fmt(x.v) + ' · ' + pct + '%</span></div>';
    }).join('') || '<p class="muted">데이터 없음</p>';
  }

  function renderSources(id, items) {
    items = items || [];
    var total = items.reduce(function (s, x) { return s + x.v; }, 0) || 1;
    $(id).innerHTML = items.map(function (x) {
      var pct = Math.round(x.v / total * 100);
      var col = CHAN_COL[x.channel] || '#2563eb';
      return '<div class="bar-row wide"><span class="name" title="' + esc(x.ref_host) + '">' + esc(srcLabel(x.ref_host)) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%;background:' + col + '"></span></span>' +
        '<span class="val">' + fmt(x.v) + ' · ' + pct + '%</span></div>';
    }).join('') || '<p class="muted">직접 유입만 있어요 (외부 출처 없음)</p>';
  }

  /* ── 라인차트 (canvas, growth.js drawChart 패턴) ── */
  function draw() {
    var d = cur, daily = d.daily || [];
    var cv = $('chart'), dpr = window.devicePixelRatio || 1;
    var cssW = cv.clientWidth || 900, cssH = 300;
    cv.width = cssW * dpr; cv.height = cssH * dpr;
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, cssW, cssH);
    var cs = getComputedStyle(document.body);
    var muted = cs.getPropertyValue('--faint') || '#999';
    var colV = cs.getPropertyValue('--views') || '#f28b82';
    var colU = cs.getPropertyValue('--visitors') || '#c9ced6';
    var padL = 34, padR = 12, padT = 12, padB = 22;
    if (!daily.length) { c.fillStyle = muted; c.font = '13px sans-serif'; c.fillText('데이터 없음', padL, cssH / 2); return; }
    var maxV = Math.max(1, Math.max.apply(null, daily.map(function (x) { return Math.max(x.v, x.u); })));
    maxV = niceMax(maxV);
    var n = daily.length;
    var X = function (i) { return padL + (n === 1 ? 0.5 : i / (n - 1)) * (cssW - padL - padR); };
    var Y = function (v) { return cssH - padB - (v / maxV) * (cssH - padT - padB); };
    // gridlines + y labels
    c.strokeStyle = 'rgba(128,128,128,.14)'; c.fillStyle = muted; c.font = '10px sans-serif'; c.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var v = maxV * g / 4, y = Y(v);
      c.beginPath(); c.moveTo(padL, y); c.lineTo(cssW - padR, y); c.stroke();
      c.fillText(fmt(Math.round(v)), 2, y - 2);
    }
    // x labels (sparse)
    var step = Math.ceil(n / 7);
    for (var i = 0; i < n; i += step) {
      c.fillText(daily[i].day.slice(5), X(i) - 10, cssH - 6);
    }
    var prim = state.metric === 'visitors' ? 'u' : 'v';
    var primCol = state.metric === 'visitors' ? colU : colV;
    var secKey = prim === 'v' ? 'u' : 'v';
    var secCol = prim === 'v' ? colU : colV;
    // filled area (primary)
    c.beginPath();
    daily.forEach(function (x, i) { var px = X(i), py = Y(x[prim]); i ? c.lineTo(px, py) : c.moveTo(px, py); });
    c.lineTo(X(n - 1), Y(0)); c.lineTo(X(0), Y(0)); c.closePath();
    c.fillStyle = hexA(primCol.trim(), .16); c.fill();
    // primary line
    line(c, daily, X, Y, prim, primCol.trim(), 2.2);
    // secondary line
    line(c, daily, X, Y, secKey, secCol.trim(), 1.4);
    // last dot
    var li = n - 1;
    c.beginPath(); c.arc(X(li), Y(daily[li][prim]), 3.5, 0, 7); c.fillStyle = primCol.trim(); c.fill();
  }
  function line(c, data, X, Y, key, col, w) {
    c.beginPath(); c.lineWidth = w; c.strokeStyle = col;
    data.forEach(function (x, i) { var px = X(i), py = Y(x[key]); i ? c.lineTo(px, py) : c.moveTo(px, py); });
    c.stroke();
  }
  function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p) * p; }
  function hexA(h, a) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join(''); var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  window.addEventListener('resize', function () { if (cur) draw(); });

  /* ── 목데이터 ── */
  function mock(st) {
    var days = st.days === 'all' ? 62 : st.days, arr = [], base = new Date();  // demo: 전체 ≈ 도메인 개설 후
    var scale = st.path ? 0.15 : 1;   // 페이지 상세면 작게
    for (var i = days - 1; i >= 0; i--) {
      var dt = new Date(base.getTime() - i * 86400000);
      var dow = dt.getDay();
      var wk = (dow === 0 || dow === 6) ? 0.6 : 1;                 // 주말 dip
      var v = Math.round((28 + Math.sin(i / 3) * 12 + Math.random() * 18) * wk * scale) + 2;
      arr.push({ day: kst(dt), v: v, u: Math.max(1, Math.round(v * 0.72)) });
    }
    var rangeV = arr.reduce(function (s, x) { return s + x.v; }, 0);
    var t = arr[arr.length - 1], y = arr[arr.length - 2] || t;
    var totalMul = st.path ? 40 : 300;
    return {
      range: { days: st.days === 'all' ? 'all' : days, today: kst(base) },
      path: st.path,
      kpi: {
        todayViews: t.v, todayVisitors: t.u, ydayViews: y.v, ydayVisitors: y.u,
        totalViews: rangeV + totalMul * 12, totalVisitors: Math.round((rangeV + totalMul * 12) * 0.7)
      },
      daily: arr,
      channels: split(rangeV, [['검색', .68], ['기타', .2], ['직접', .08], ['SNS', .04]]),
      devices: split(rangeV, [['mobile', .56], ['desktop', .41], ['tablet', .03]]),
      sources: [
        ['google.com', '검색', .34], ['m.search.naver.com', '검색', .24], ['search.naver.com', '검색', .11],
        ['daum.net', '검색', .05], ['bing.com', '검색', .02],
        ['instagram.com', 'SNS', .04], ['youtube.com', 'SNS', .02], ['t.co', 'SNS', .01], ['tistory.com', '기타', .02]
      ].map(function (s) { return { ref_host: s[0], channel: s[1], v: Math.max(1, Math.round(rangeV * s[2])) }; }),
      topPages: st.path ? [] : [
        ['/tools/salary/', .22], ['/tools/', .14], ['/blog/ko/yonsei-grad-mech-interview/', .11],
        ['/image/compress/', .1], ['/pdf/merge/', .08], ['/tools/year-end/', .07],
        ['/', .06], ['/tools/bmi/', .05], ['/text/symbols/', .05], ['/baby/', .04]
      ].map(function (p) { var vv = Math.round(rangeV * p[1]); return { path: p[0], v: vv, u: Math.round(vv * 0.72) }; })
    };
  }
  function split(total, parts) { return parts.map(function (p) { return { channel: p[0], device: p[0], v: Math.round(total * p[1]) }; }); }
  function kst(d) { return new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10); }
})();
