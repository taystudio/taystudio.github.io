// new-badge.js — mark genuinely-new posts (published within the last week) with a "NEW" badge.
// Client-side: compares each post's date to the visitor's current clock, so the badge auto-expires
// ~1 week after publish with no rebuild. Works fine on static hosting.
(function () {
  var DAYS = 7;
  var MS = 86400000;
  function isNew(raw, now) {
    raw = (raw || '').trim().replace(/\./g, '-').replace(/-+$/, '');   // "2026.07.19" · trailing dot
    var d = new Date(raw);
    if (isNaN(d.getTime())) return false;
    var age = now - d.getTime();
    return age < DAYS * MS && age > -3 * MS;                           // within last 7 days (+3d future buffer)
  }
  function badge(cls, text) {
    var b = document.createElement('span');
    b.className = cls;
    b.textContent = text || 'NEW';
    return b;
  }
  function init() {
    var now = Date.now();
    // ① list cards — corner pill on the thumbnail
    var cards = document.querySelectorAll('.tb-post-card');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.querySelector('.tb-new')) continue;
      var t = card.querySelector('time');
      if (t && isNew(t.getAttribute('datetime') || t.textContent, now)) {
        var thumb = card.querySelector('.tb-post-thumb');
        (thumb || card.querySelector('.tb-post-body') || card).appendChild(badge('tb-new'));
      }
    }
  }
  // ── sidebar categories: small NEW next to a leaf category with a post in the last 7 days ──
  function initCategoryBadges() {
    var isEn = /^\/blog\/en(\/|$)/.test(location.pathname);
    fetch(isEn ? 'data/posts.en.json' : 'data/posts.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (posts) {
        if (!posts || !posts.length) return;
        var now = Date.now();
        var newestLeaf = {};                                  // leaf category slug → newest date
        posts.forEach(function (p) {
          var cats = p.category || p.categories || [];
          if (!cats.length || !p.date) return;
          var leaf = cats[cats.length - 1];                   // most specific category
          if (!newestLeaf[leaf] || p.date > newestLeaf[leaf]) newestLeaf[leaf] = p.date;
        });
        function tag() {
          var links = document.querySelectorAll('.tb-side-list a[href*="/category/"]');
          for (var i = 0; i < links.length; i++) {
            var a = links[i];
            if (a.querySelector('.tb-new-cat')) continue;
            var m = (a.getAttribute('href') || '').match(/category\/(?:[^\/?#]+\/)*([^\/?#]+)\/?(?:$|[?#])/);
            var leaf = m && m[1];                             // last slug segment = leaf category
            if (leaf && newestLeaf[leaf] && isNew(newestLeaf[leaf], now)) {
              (a.querySelector('span') || a).appendChild(badge('tb-new-cat', 'N'));  // small "N" dot by the name
            }
          }
        }
        tag();                                                // static/already-rendered
        var obs = new MutationObserver(tag);                  // sidebar.js renders async
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(function () { obs.disconnect(); }, 5000);
      })
      .catch(function () {});
  }

  function boot() { init(); initCategoryBadges(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
