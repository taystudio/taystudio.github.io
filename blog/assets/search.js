// blog/assets/search.js — instant client-side search for Tay Blog
// posts.{lang}.json fetch + substring match (title·excerpt·tags·category)
// Debounce 150ms · 최대 8 결과 · click 시 글 페이지 navigate

(function() {
  'use strict';

  function init() {
    var wrap = document.querySelector('[data-tb-search]');
    if (!wrap) return;
    var input = wrap.querySelector('.tb-search-input');
    var resultsEl = wrap.querySelector('.tb-search-results');
    var lang = wrap.getAttribute('data-lang') || 'ko';
    if (!input || !resultsEl) return;

    // posts.json URL — lang 에 따라
    // 기본 ko = blog/data/posts.json · 다른 lang = posts.{lang}.json
    var postsUrl = '/blog/data/' + (lang === 'ko' ? 'posts.json' : 'posts.' + lang + '.json');
    var posts = null;
    var fetchPromise = null;

    function loadPosts() {
      if (posts) return Promise.resolve(posts);
      if (fetchPromise) return fetchPromise;
      fetchPromise = fetch(postsUrl)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          posts = Array.isArray(data) ? data : (data.posts || []);
          // 발행 글만 (status: draft 제외)
          posts = posts.filter(function(p) { return (p.status || 'published') !== 'draft'; });
          return posts;
        })
        .catch(function() { posts = []; return posts; });
      return fetchPromise;
    }

    // lang seg — ko/en path
    var seg = lang === 'ko' ? '/blog/ko/' : '/blog/' + lang + '/';

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
      });
    }

    function normalize(s) {
      return String(s || '').toLowerCase();
    }

    function search(q) {
      var nq = normalize(q.trim());
      if (!nq) return [];
      var hits = [];
      for (var i = 0; i < posts.length; i++) {
        var p = posts[i];
        var title = normalize(p.title);
        var excerpt = normalize(p.excerpt);
        var tags = (p.tags || []).map(normalize).join(' ');
        var cats = (p.category || p.categories || []).join(' ').toLowerCase();
        var score = 0;
        if (title.indexOf(nq) >= 0) score += 10;
        if (title.indexOf(nq) === 0) score += 5;  // title 시작
        if (excerpt.indexOf(nq) >= 0) score += 3;
        if (tags.indexOf(nq) >= 0) score += 4;
        if (cats.indexOf(nq) >= 0) score += 2;
        if (score > 0) hits.push({ p: p, score: score });
      }
      hits.sort(function(a, b) { return b.score - a.score; });
      return hits.slice(0, 8).map(function(h) { return h.p; });
    }

    function render(results, q) {
      if (!results.length) {
        if (!q) { resultsEl.hidden = true; resultsEl.innerHTML = ''; return; }
        resultsEl.hidden = false;
        var noMsg = lang === 'ko' ? '검색 결과 없음' : 'No results';
        resultsEl.innerHTML = '<div class="tb-search-empty">' + escapeHtml(noMsg) + '</div>';
        return;
      }
      var html = results.map(function(p) {
        var slug = p.slug || '';
        var title = escapeHtml(p.title || slug);
        var date = escapeHtml(p.date || '');
        var excerpt = escapeHtml((p.excerpt || '').slice(0, 90));
        var url = seg + slug + '/';
        return (
          '<a class="tb-search-item" href="' + url + '" role="option">' +
            '<div class="tb-search-item-title">' + title + '</div>' +
            (excerpt ? '<div class="tb-search-item-excerpt">' + excerpt + '</div>' : '') +
            (date ? '<div class="tb-search-item-date">' + date + '</div>' : '') +
          '</a>'
        );
      }).join('');
      resultsEl.innerHTML = html;
      resultsEl.hidden = false;
    }

    var debounceTimer = null;
    function onInput() {
      var q = input.value;
      clearTimeout(debounceTimer);
      if (!q.trim()) { render([], ''); return; }
      debounceTimer = setTimeout(function() {
        loadPosts().then(function() { render(search(q), q); });
      }, 150);
    }

    input.addEventListener('input', onInput);
    input.addEventListener('focus', function() {
      // focus 시 posts 미리 load (latency 줄임)
      loadPosts();
      if (input.value.trim()) render(search(input.value), input.value);
    });

    // 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
      if (!wrap.contains(e.target)) { resultsEl.hidden = true; }
    });

    // Escape 키 — 닫기
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { input.value = ''; resultsEl.hidden = true; input.blur(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
