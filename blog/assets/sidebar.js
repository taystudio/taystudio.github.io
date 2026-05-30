// sidebar.js — blog/data/site.json fetch + 사이드바·메뉴·위젯 동적 렌더
// 정적 HTML 위에 덮어쓰기 (fetch 실패 시 기본 HTML 그대로)
// 우선순위: LocalStorage 임시 미리보기 > fetch site.json

(function() {
  var SETTINGS_KEY = 'tayblog_settings';
  // 언어 — /blog/{ko,en}/ 둘 다 detect (ko/en 모두 명시적 prefix). SEG 는 항상 {lang}/.
  // 서버 사이드바와 동일 규칙(seg·name_en·collapse 키).
  var _LM = location.pathname.match(/^\/blog\/(ko|en)(?:\/|$)/);
  var LANG = _LM ? _LM[1] : 'ko';
  var IS_EN = LANG === 'en';
  var SEG = LANG + '/';
  var COLLAPSE_KEY = IS_EN ? 'tayblog_cat_collapsed_en' : 'tayblog_cat_collapsed';
  function catName(c) { return (IS_EN && c.name_en) ? c.name_en : (c.name || c.slug); }

  function loadAndApply() {
    var local = null;
    try { local = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'); } catch (e) {}

    // categories 는 항상 site.json 기준 (LocalStorage preview 의 미저장 카테고리 차단 → 404 방지)
    return fetch('data/site.json', { cache: 'no-cache' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(filedata) {
        if (local) {
          if (filedata && filedata.categories) local.categories = filedata.categories;
          applySettings(local, '(LocalStorage preview + site.json categories)');
        } else if (filedata) {
          applySettings(filedata, '(site.json)');
        }
      })
      .catch(function() {
        if (local) applySettings(local, '(LocalStorage preview only)');
      });
  }

  loadAndApply();

  function applySettings(settings, src) {
    // Theme
    if (settings.themeAccent) {
      document.documentElement.style.setProperty('--accent', settings.themeAccent);
    }
    if (settings.themeMode && settings.themeMode !== 'auto') {
      if (settings.themeMode === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    if (settings.customCss) {
      var styleEl = document.getElementById('tb-custom-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'tb-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = settings.customCss;
    }
    // 표 스타일 — 발행글 .tb-prose 에 data-table-style (LocalStorage preview 반영; 빌드도 동일하게 박음)
    if (settings.tableStyle) {
      Array.prototype.forEach.call(document.querySelectorAll('.tb-prose'), function(el) {
        el.setAttribute('data-table-style', settings.tableStyle);
      });
    }

    // Header menu — signature 비교, 동일하면 DOM 안 건드림 (깜빡 방지)
    // 정적 HTML 의 href 는 상대 경로 (base href 기준), site.json menu.href 는 절대 (/blog/foo/).
    // signature 비교 전에 normalize — '/blog/' prefix 제거.
    function normHref(h) {
      if (!h) return '';
      if (h.indexOf('/blog/') === 0) {
        var rel = h.slice(6);  // /blog/foo/ → foo/
        if (rel.indexOf('admin') === 0) return rel;  // admin 은 ko 전용 → seg 안 붙임
        return SEG + rel;  // en 페이지면 en/foo/ 로 같은 언어 트리
      }
      return h;
    }
    if (settings.menu && settings.menu.length) {
      var nav = document.querySelector('.tb-header .tb-nav');
      if (nav) {
        // 언어 토글(.tb-lang-toggle)·Studios 드롭다운(.tb-studios 내부 a)은 메뉴가 아니므로 signature·재구성에서 제외
        var currentLinks = Array.from(nav.querySelectorAll('a:not(.tb-lang-toggle)')).filter(function(a) { return !a.closest('.tb-studios'); });
        var currentSig = currentLinks.map(function(a) {
          return normHref(a.getAttribute('href') || '') + '|' + (a.textContent || '').trim();
        }).join('::');
        var newSig = settings.menu.map(function(m) {
          return normHref(m.href || '') + '|' + (m.label || '').trim();
        }).join('::');
        if (currentSig !== newSig) {
          var anchor = nav.querySelector('.tb-studios') || nav.querySelector('.tb-lang-toggle') || nav.querySelector('.tb-theme-toggle');
          currentLinks.forEach(function(a) { a.remove(); });
          var lastIdx = settings.menu.length - 1;
          settings.menu.forEach(function(m, i) {
            var a = document.createElement('a');
            a.href = normHref(m.href || '#');
            a.textContent = m.label || '';
            a.className = (i === lastIdx && settings.menu.length > 4) ? 'tb-nav-hide-md' : 'tb-nav-hide-sm';
            if (anchor) nav.insertBefore(a, anchor);
            else nav.appendChild(a);
          });
        }
      }
    }

    // Sidebar
    var sidebarSticky = document.querySelector('.tb-sidebar-sticky');
    if (!sidebarSticky) return;

    var widgets = settings.widgets || [];
    var enabledIds = widgets.filter(function(w) { return w.enabled; }).map(function(w) { return w.id; });
    var orderedIds = widgets.map(function(w) { return w.id; });

    var sections = {};
    Array.from(sidebarSticky.querySelectorAll('.tb-side-card')).forEach(function(sec) {
      var title = (sec.querySelector('.tb-side-title') || {}).textContent || '';
      var t = title.toLowerCase().trim();
      if (t.indexOf('categor') === 0) sections.categories = sec;
      else if (t.indexOf('recent') === 0) sections.recent = sec;
      else if (t.indexOf('tag') === 0) sections.tagCloud = sec;
      else if (t.indexOf('stat') === 0) sections.stats = sec;
      else if (t.indexOf('popular') === 0) sections.popular = sec;
      else if (t.indexOf('visit') === 0) sections.visitor = sec;
    });

    if (sections.categories && settings.categories && settings.categories.length) {
      // signature 비교 — 정적 HTML이 이미 같은 카테고리면 dom 안 갱신 (깜빡임 방지)
      var newSig = settings.categories.map(function(c) {
        var ch = (c.children || []).map(function(x) { return x.slug || ''; }).join('|');
        return (c.slug || '') + '::' + ch;
      }).join(',');
      var oldUl = sections.categories.querySelector('.tb-side-list');
      var oldSig = oldUl ? oldUl.getAttribute('data-cat-signature') : null;
      if (oldUl && oldSig === newSig) {
        // 정적 HTML과 동일 → toggle handler만 binding (dom 안 건드림)
        bindToggles(oldUl);
      } else {
      // 접힘 상태 LocalStorage 로드
      var collapsed = new Set();
      try {
        var raw = localStorage.getItem(COLLAPSE_KEY);
        if (raw) collapsed = new Set(JSON.parse(raw));
      } catch (e) {}
      function saveCollapsed() {
        try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(Array.from(collapsed))); } catch (e) {}
      }

      var ul = document.createElement('ul');
      ul.className = 'tb-side-list';
      ul.setAttribute('data-cat-signature', newSig);
      settings.categories.forEach(function(c) {
        var li = document.createElement('li');
        var row = document.createElement('div');
        row.className = 'tb-side-row';

        var hasChildren = c.children && c.children.length;
        if (hasChildren) {
          var toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'tb-side-toggle';
          toggle.setAttribute('aria-label', '하위 카테고리 접기/펼치기');
          toggle.innerHTML = '<span class="tb-side-toggle-icon">▶</span>';
          row.appendChild(toggle);
        } else {
          var spacer = document.createElement('span');
          spacer.className = 'tb-side-toggle-spacer';
          row.appendChild(spacer);
        }

        var a = document.createElement('a');
        a.href = SEG + 'category/' + c.slug + '/';
        a.innerHTML = '<span>' + esc(catName(c)) + '</span>';
        row.appendChild(a);
        li.appendChild(row);

        if (hasChildren) {
          var sub = document.createElement('ul');
          sub.className = 'tb-side-sub';
          c.children.forEach(function(ch) {
            var sli = document.createElement('li');
            sli.className = 'tb-side-row';
            var spacer2 = document.createElement('span');
            spacer2.className = 'tb-side-toggle-spacer';
            sli.appendChild(spacer2);
            var sa = document.createElement('a');
            sa.href = SEG + 'category/' + c.slug + '/' + ch.slug + '/';
            sa.innerHTML = '<span>' + esc(catName(ch)) + '</span>';
            sli.appendChild(sa);
            sub.appendChild(sli);
          });
          li.appendChild(sub);

          // 초기 접힘 상태
          var startCollapsed = collapsed.has(c.slug);
          if (startCollapsed) {
            toggle.classList.add('collapsed');
            sub.classList.add('collapsed');
            sub.style.maxHeight = '0';
          } else {
            sub.style.maxHeight = (sub.scrollHeight + 80) + 'px';
          }

          // 토글 함수 (▶·라벨 클릭 공용)
          var doToggle = function(e) {
            // Cmd/Ctrl/Shift+click 또는 가운데 클릭은 페이지 이동 (브라우저 default 유지)
            if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return;
            if (e) { e.preventDefault(); e.stopPropagation(); }
            var isCollapsed = toggle.classList.toggle('collapsed');
            sub.classList.toggle('collapsed', isCollapsed);
            if (isCollapsed) {
              sub.style.maxHeight = '0';
              collapsed.add(c.slug);
            } else {
              sub.style.maxHeight = (sub.scrollHeight + 80) + 'px';
              collapsed.delete(c.slug);
            }
            saveCollapsed();
          };

          // ▶ 화살표·라벨(a 태그) 둘 다 토글 트리거
          toggle.addEventListener('click', doToggle);
          a.addEventListener('click', doToggle);
          // 우클릭·새탭은 그대로 작동 (href 유지)
        }

        ul.appendChild(li);
      });
      if (oldUl) oldUl.replaceWith(ul);
      else sections.categories.appendChild(ul);

      // 초기 펼침 상태 — height 재계산 (next frame)
      requestAnimationFrame(function() {
        ul.querySelectorAll('.tb-side-sub:not(.collapsed)').forEach(function(s) {
          s.style.maxHeight = (s.scrollHeight + 80) + 'px';
        });
      });
      } // end else (signature 다름)
    }

    // 정적 HTML 그대로 사용 시 toggle handler binding
    function bindToggles(rootUl) {
      var collapsed = new Set();
      try {
        var raw = localStorage.getItem(COLLAPSE_KEY);
        if (raw) collapsed = new Set(JSON.parse(raw));
      } catch (e) {}
      function saveCollapsed() {
        try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(Array.from(collapsed))); } catch (e) {}
      }

      Array.from(rootUl.querySelectorAll(':scope > li')).forEach(function(li) {
        var toggle = li.querySelector(':scope > .tb-side-row > .tb-side-toggle');
        var sub = li.querySelector(':scope > .tb-side-sub');
        var a = li.querySelector(':scope > .tb-side-row > a');
        if (!sub) return;

        // URL slug 추출 — 절대(/blog/category/foo/) + 상대(category/foo/) 둘 다 지원
        var href = a ? a.getAttribute('href') : '';
        var m = href.match(/(?:^|\/)category\/([^\/]+)\//);
        var slug = m ? m[1] : '';

        // 초기 접힘 상태 — no-anim 클래스로 첫 적용 시 transition 차단 (깜빡 방지)
        var startCollapsed = slug && collapsed.has(slug);
        if (startCollapsed) {
          sub.classList.add('no-anim');
          toggle.classList.add('collapsed');
          sub.classList.add('collapsed');
          sub.style.maxHeight = '0';
          requestAnimationFrame(function() { sub.classList.remove('no-anim'); });
        } else {
          sub.classList.add('no-anim');
          sub.style.maxHeight = (sub.scrollHeight + 80) + 'px';
          requestAnimationFrame(function() { sub.classList.remove('no-anim'); });
        }

        var doToggle = function(e) {
          if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return;
          if (e) { e.preventDefault(); e.stopPropagation(); }
          var isCollapsed = toggle.classList.toggle('collapsed');
          sub.classList.toggle('collapsed', isCollapsed);
          if (isCollapsed) {
            sub.style.maxHeight = '0';
            if (slug) collapsed.add(slug);
          } else {
            sub.style.maxHeight = (sub.scrollHeight + 80) + 'px';
            if (slug) collapsed.delete(slug);
          }
          saveCollapsed();
        };
        toggle.addEventListener('click', doToggle);
        if (a) a.addEventListener('click', doToggle);
      });
    }

    ['categories', 'recent', 'tagCloud', 'stats', 'popular', 'visitor'].forEach(function(id) {
      var sec = sections[id];
      if (!sec) return;
      var want = enabledIds.indexOf(id) >= 0 ? '' : 'none';
      if (sec.style.display !== want) sec.style.display = want;
    });

    // 순서 동일하면 appendChild 호출 X (paint 트리거 방지)
    var existingOrder = Array.from(sidebarSticky.querySelectorAll(':scope > .tb-side-card')).map(function(sec) {
      for (var id in sections) { if (sections[id] === sec) return id; }
      return null;
    }).filter(Boolean);
    var wantedOrder = orderedIds.filter(function(id) { return sections[id]; });
    if (existingOrder.join(',') !== wantedOrder.join(',')) {
      wantedOrder.forEach(function(id) {
        var sec = sections[id];
        if (sec && sec.parentNode === sidebarSticky) sidebarSticky.appendChild(sec);
      });
    }

    if (typeof console !== 'undefined') {
      console.info('[tayblog] settings applied ' + src + ' — categories: ' +
        (settings.categories || []).length + ', widgets: ' + enabledIds.length);
    }
  }

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();

// 사이드바 접기 토글 — 접으면 본문 풀폭(.tb-container grid 단일컬럼), 상태 localStorage 유지.
(function() {
  var container = document.querySelector('.tb-container');
  var sidebar = document.querySelector('.tb-sidebar');
  if (!container || !sidebar) return;
  var KEY = 'tayblog_sidebar_collapsed';
  var collapsed = false;
  try { collapsed = localStorage.getItem(KEY) === '1'; } catch (e) {}
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tb-sidebar-toggle';
  function apply() {
    container.classList.toggle('sidebar-collapsed', collapsed);
    btn.textContent = collapsed ? '‹' : '›';  // ‹ 펼치기 / › 접기
    var label = collapsed ? '사이드바 펼치기' : '사이드바 접기';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }
  // 초기 상태 복원은 애니메이션 없이 (로드 시 슬라이드 튐 방지)
  container.classList.add('no-sidebar-anim');
  apply();
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { container.classList.remove('no-sidebar-anim'); });
  });
  btn.addEventListener('click', function() {
    collapsed = !collapsed;
    apply();
    try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch (e) {}
  });
  document.body.appendChild(btn);
})();
