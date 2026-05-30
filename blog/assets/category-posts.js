// category-posts.js — 카테고리 페이지에서 해당 카테고리 글 목록 렌더
// source of truth = data/posts.json (빌드 시 생성, production 배포에 포함).
// dev-server 유무와 무관하게 동작 → 배포된 블로그에서도 카테고리 밑에 글이 뜬다.

(function() {
  var list = document.getElementById('categoryPosts');
  if (!list) return;
  var catPath = list.dataset.category;
  if (!catPath) return;

  // 언어 판별 — /blog/{ko,en}/ 둘 다 detect. seg = {lang}/ (ko/en 모두 명시).
  var _lm = location.pathname.match(/^\/blog\/(ko|en)(?:\/|$)/);
  var lang = _lm ? _lm[1] : 'ko';
  var isEn = lang === 'en';
  var seg = lang + '/';
  var postsFile = isEn ? 'data/posts.en.json' : 'data/posts.json';

  // base href 가 blog root 라서 'data/posts(.en).json' 은 /blog/data/... 로 해석됨
  fetch(postsFile, { cache: 'no-store' })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) {
      if (!d) return;  // posts.json 없으면 empty state 유지
      var posts = (d.posts || d || []).filter(function(p) { return inCategory(p.category || p.categories); });
      if (posts.length) renderPosts(posts);
    })
    .catch(function() {});

  // 현재 카테고리(catPath)에 글이 속하는지 — 글의 category 배열 중 하나라도
  // 현재 경로의 leaf/전체/세그먼트와 일치하면 포함. (부모·자식 동시 태깅 모두 매칭)
  function inCategory(cats) {
    if (!cats) return false;
    if (typeof cats === 'string') cats = cats.split(',').map(function(s) { return s.trim(); });
    // 이 카테고리 페이지의 leaf 슬러그(또는 전체 경로)와만 매칭.
    // (예전엔 catPath 세그먼트 매칭이라 'cloud' 태그가 cloud 하위 전부 — AWS·Database·Server Setup — 에 새던 버그)
    var leaf = catPath.split('/').pop();
    return cats.some(function(c) {
      return c === leaf || c === catPath;
    });
  }

  function renderPosts(posts) {
    list.innerHTML = '';
    posts.sort(function(a, b) {
      var ad = a.date || '', bd = b.date || '';
      return bd > ad ? 1 : -1;  // 최신순
    });
    posts.forEach(function(p) {
      var title = p.title || p.slug;
      var excerpt = p.excerpt || p.description || '';
      var date = p.date || '';
      var tags = p.tags || [];
      if (typeof tags === 'string') tags = tags.split(',').map(function(s) { return s.trim(); });
      var tagsStr = tags.map(function(t) { return '#' + t; }).join(' ');

      var thumb = p.image
        ? '<div class="tb-post-thumb has-img"><img src="' + esc(p.image) + '" alt="" loading="lazy"></div>'
        : '<div class="tb-post-thumb">📄</div>';
      var li = document.createElement('li');
      li.innerHTML =
        '<a class="tb-post-card" href="' + seg + esc(p.slug) + '/">' +
          thumb +
          '<div class="tb-post-body">' +
            '<h3 class="tb-post-title">' + esc(title) + '</h3>' +
            (excerpt ? '<p class="tb-post-excerpt">' + esc(excerpt) + '</p>' : '') +
            '<div class="tb-post-meta">' +
              (date ? '<time>' + esc(String(date).slice(0, 10)) + '</time>' : '') +
              (tagsStr ? '<span>·</span><span class="tb-post-tags">' + esc(tagsStr) + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</a>';
      list.appendChild(li);
    });
    var cnt = document.querySelector('[data-category-count]');
    if (cnt) cnt.textContent = isEn ? (posts.length + (posts.length === 1 ? ' post' : ' posts')) : (posts.length + '개의 글');
  }

  function esc(s) {
    return (s || '').toString().replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
