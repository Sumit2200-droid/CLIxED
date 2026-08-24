(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  var toTop = document.getElementById('toTop');

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setHeader() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);
    if (toTop) {
      toTop.classList.toggle('is-visible', window.scrollY > 640);
      toTop.classList.toggle('show', window.scrollY > 640);
    }
  }

  /* ---- Mobile menu ---- */
  var navBackdrop = document.getElementById('clxNavBackdrop');
  if (!navBackdrop) {
    navBackdrop = document.createElement('div');
    navBackdrop.id = 'clxNavBackdrop';
    navBackdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(navBackdrop);
  }

  function closeMenu() {
    mainNav.classList.add('closing');
    navBackdrop.classList.remove('is-visible');
    setTimeout(function () {
      mainNav.classList.remove('is-open', 'open', 'closing');
    }, 350);
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    setTimeout(function () { document.body.classList.remove('menu-open'); }, 350);
  }

  function openMenu() {
    mainNav.classList.remove('closing');
    mainNav.classList.add('is-open', 'open');
    navBackdrop.classList.add('is-visible');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      if (mainNav.classList.contains('open') || mainNav.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
    navBackdrop.addEventListener('click', function () { closeMenu(); });
    mainNav.addEventListener('click', function (e) {
      if (e.target.closest('a:not(.nav-trigger)')) closeMenu();
    });
  }

  /* ---- Dropdown triggers (mobile accordion) ---- */
  document.querySelectorAll('.nav-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.nav-item');
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.nav-item.open').forEach(function (i) {
        i.classList.remove('open');
        var t = i.querySelector('.nav-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- Close dropdowns on outside click / Escape ---- */
  function closeDropdowns() {
    document.querySelectorAll('.nav-item.open').forEach(function (i) {
      i.classList.remove('open');
      var t = i.querySelector('.nav-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', function (e) {
    if (mainNav && !mainNav.classList.contains('open') && !mainNav.classList.contains('is-open') &&
        !e.target.closest('#mainNav') && !e.target.closest('#navToggle')) closeDropdowns();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (mainNav && (mainNav.classList.contains('open') || mainNav.classList.contains('is-open'))) { closeMenu(); return; }
    closeDropdowns();
  });

  /* ---- Scrollspy (single-page anchors only) ---- */
  var spySections = document.querySelectorAll('main section[id]');
  var spyLinks = Array.prototype.filter.call(document.querySelectorAll('.nav-link'), function (l) {
    return l.getAttribute('href') && l.getAttribute('href').charAt(0) === '#';
  });

  function updateSpy() {
    var pos = window.scrollY + 150;
    var currentId = null;
    spySections.forEach(function (s) {
      if (s.offsetTop <= pos) currentId = s.id;
    });
    spyLinks.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('href').slice(1) === currentId);
    });
  }
  if (spyLinks.length) updateSpy();

  function initReveals() {
    /* ---- Reveal on scroll (legacy .reveal + v2 .clx-reveal / .clx-mask-reveal) ---- */
    var revealTargets = document.querySelectorAll('.reveal, .clx-reveal, .clx-mask-reveal');

    function revealNow(el) {
      var delay = parseInt(el.dataset.delay || '0', 10);
      if (delay && !prefersReduced()) {
        el.style.transitionDelay = (delay * 90) + 'ms';
      }
      el.classList.add('is-in', 'is-visible');
    }

    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          revealNow(entry.target);
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      revealTargets.forEach(function (el) { revealObserver.observe(el); });
    } else {
      revealTargets.forEach(revealNow);
    }
  }

  /* ---- Initialize reveals ---- */
  initReveals();

  /* ---- Scroll progress bar + parallax (home) ---- */
  var scrollProgressFill = document.querySelector('.clx-scroll-progress-fill');
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var parallaxOk = parallaxEls.length > 0 && !prefersReduced();
  var parallaxTicking = false;

  function updateScrollProgress() {
    if (!scrollProgressFill) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    scrollProgressFill.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
  }

  function updateParallax() {
    parallaxTicking = false;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var speed = parseFloat(el.dataset.parallax) || 0.08;
      var offset = (r.top + r.height / 2 - vh / 2) * speed;
      var y = Math.max(-48, Math.min(48, -offset));
      el.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
    });
  }

  function onScrollTick() {
    updateScrollProgress();
    if (!parallaxOk || parallaxTicking) return;
    parallaxTicking = true;
    requestAnimationFrame(updateParallax);
  }

  if (scrollProgressFill || parallaxEls.length) {
    window.addEventListener('scroll', onScrollTick, { passive: true });
    window.addEventListener('resize', onScrollTick, { passive: true });
    onScrollTick();
  }

  /* ---- Counters ---- */
  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10);
    if (prefersReduced()) { el.textContent = target.toLocaleString('en-US'); return; }
    var start = null;
    var duration = 1500;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(function (el) { countObserver.observe(el); });

  /* ---- Homepage: journey step progress (IO-driven, no scroll listeners) ---- */
  var journeyTrack = document.querySelector('body.homepage-editorial .journey-track');
  if (journeyTrack && window.IntersectionObserver) {
    var jsteps = Array.prototype.slice.call(journeyTrack.querySelectorAll('.j-step'));
    var journeyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = jsteps.indexOf(entry.target);
        if (idx < 0) return;
        journeyTrack.classList.add('is-progress');
        jsteps.forEach(function (s, i) { s.classList.toggle('is-active', i <= idx); });
        journeyTrack.style.setProperty('--jp', String((idx + 1) / jsteps.length));
      });
    }, { threshold: 0.45, rootMargin: '-15% 0px -15% 0px' });
    jsteps.forEach(function (s) { journeyObs.observe(s); });
  }

  /* ---- Tilt on cards ---- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-py * 6) + 'deg) rotateY(' + (px * 8) + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---- Accordion details: close others ---- */
  document.querySelectorAll('.accordion').forEach(function (acc) {
    acc.addEventListener('toggle', function (e) {
      if (!e.target.open) return;
      acc.querySelectorAll('details[open]').forEach(function (d) {
        if (d !== e.target) d.open = false;
      });
    }, true);
  });

  /* ---- Tabs ---- */
  document.querySelectorAll('[data-tabs]').forEach(function (wrap) {
    var btns = wrap.querySelectorAll('[data-tab-btn]');
    var panels = wrap.querySelectorAll('[data-tab-panel]');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        panels.forEach(function (p) {
          p.classList.toggle('is-active', p.dataset.tabPanel === btn.dataset.tabBtn);
        });
      });
    });
  });

  /* ---- Forms: validation, spam protection, routing ---- */
  function fieldError(field, message) {
    var wrap = field.closest ? field.closest('.form-field') : null;
    if (!wrap) return;
    wrap.classList.add('has-error');
    var err = wrap.querySelector('.field-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error';
      err.setAttribute('role', 'alert');
      wrap.appendChild(err);
    }
    err.textContent = message;
    field.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(field) {
    var wrap = field.closest ? field.closest('.form-field') : null;
    if (!wrap) return;
    wrap.classList.remove('has-error');
    field.removeAttribute('aria-invalid');
    var err = wrap.querySelector('.field-error');
    if (err) err.textContent = '';
  }

  function validateField(field) {
    clearFieldError(field);
    var value = (field.value || '').trim();
    var type = field.type;
    var label = (field.labels && field.labels[0]) ? field.labels[0].textContent.replace(/\s*\*?\s*$/, '').trim() : 'This field';
    if (!field.required && !value) return true;
    if (field.required && !value) { fieldError(field, label + ' is required.'); return false; }
    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { fieldError(field, 'Enter a valid email address.'); return false; }
    if (type === 'tel' && !/^\+?[0-9][0-9\s().-]{6,17}$/.test(value.replace(/\s+/g, ' '))) { fieldError(field, 'Enter a valid phone number.'); return false; }
    if (field.tagName === 'TEXTAREA' && value.length < 10) { fieldError(field, 'Please add a few more details (at least 10 characters).'); return false; }
    if (value.length > 2000) { fieldError(field, 'Please keep your message under 2000 characters.'); return false; }
    return true;
  }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var btn = form.querySelector('button[type="submit"]');
    var original = btn ? btn.innerHTML : '';
    var successMsg = document.getElementById(form.dataset.form);
    var errorMsg = form.querySelector('[data-error]');
    var lastSubmitAt = 0;

    form.querySelectorAll('input, select, textarea').forEach(function (f) {
      f.addEventListener('input', function () { clearFieldError(f); });
      f.addEventListener('change', function () { if (!f.value) validateField(f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var ok = true;
      var firstBad = null;
      form.querySelectorAll('input, select, textarea').forEach(function (f) {
        if (!validateField(f)) { ok = false; if (!firstBad) firstBad = f; }
      });
      if (!ok) {
        var ew = firstBad.closest ? firstBad.closest('.form-field') : null;
        var target = ew || firstBad;
        target.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
        if (firstBad.focus) firstBad.focus();
        return;
      }

      var honeypot = form.querySelector('input[name="website"]');
      if (honeypot && (honeypot.value || '').length > 0) return;

      var now = Date.now();
      var cfg = window.LEAD_CONFIG || { endpoint: '', minWaitMs: 8000 };
      if (now - lastSubmitAt < (cfg.minWaitMs || 8000)) return;
      lastSubmitAt = now;

      var payload = {};
      form.querySelectorAll('input, select, textarea').forEach(function (f) {
        if (f.name && f.name !== 'website') payload[f.name] = (f.value || '').trim();
      });

      var show = function (el) {
        el.classList.add('show');
        el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'nearest' });
        window.setTimeout(function () { el.classList.remove('show'); }, 9000);
      };

      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var finish = function (ok) {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
        if (ok) {
          form.reset();
          if (successMsg) show(successMsg);
        } else {
          if (errorMsg) show(errorMsg);
        }
      };

      if (!cfg.endpoint) {
        window.setTimeout(function () { finish(false); }, 600);
        return;
      }

      fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        finish(true);
      }).catch(function () {
        finish(false);
      });
    });
  });

  /* ---- Directory filters ---- */
  document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
    var cards = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-card]'));
    var controls = panel.querySelectorAll('[data-filter], [data-search]');
    var countEl = panel.querySelector('[data-results]');

    function apply() {
      var term = '';
      var search = panel.querySelector('[data-search]');
      if (search) term = search.value.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var show = true;
        controls.forEach(function (c) {
          if (!c.value) return;
          var key = c.dataset.filter;
          var val = c.value;
          if (key === 'category' && !card.dataset.category.includes(val)) show = false;
          if (key === 'country' && !card.dataset.country.split(',').map(function (s) { return s.trim(); }).includes(val)) show = false;
          if (key === 'level' && card.dataset.level !== val) show = false;
          if (key === 'university' && card.dataset.university !== val) show = false;
        });
        if (show && term) {
          show = (card.dataset.search || '').toLowerCase().indexOf(term) !== -1;
        }
        card.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });
      if (countEl) countEl.textContent = visible;
    }

    controls.forEach(function (c) {
      c.addEventListener('input', apply);
      c.addEventListener('change', apply);
    });
    apply();
  });

  /* ---- Insights library: filters, search, counts (insights.html) ---- */
  var libFilters = Array.prototype.slice.call(document.querySelectorAll('.clx-lib-filter[data-lib-filter]'));
  if (libFilters.length) {
    var libSearch = document.querySelector('[data-lib-search]');
    var libReadout = document.querySelector('[data-lib-readout]');
    var libEmpty = document.querySelector('[data-lib-empty]');
    var libCards = Array.prototype.slice.call(document.querySelectorAll('[data-lib-card]'));
    var libActive = 'all';
    var libAliases = {
      'research': 'research', 'reports': 'research',
      'cases': 'cases', 'case-studies': 'cases',
      'policy': 'policy', 'policy-briefs': 'policy',
      'articles': 'articles', 'substack': 'articles',
      'media': 'media', 'podcast': 'media', 'youtube': 'media'
    };

    function libTerm() {
      return libSearch ? (libSearch.value || '').trim().toLowerCase() : '';
    }

    function libMatches(card) {
      var cats = (card.dataset.libCategory || 'all').trim().split(/\s+/);
      if (libActive !== 'all' && cats.indexOf(libActive) === -1) return false;
      var term = libTerm();
      if (!term) return true;
      var hay = ((card.dataset.libSearch || '') + ' ' + card.textContent).toLowerCase();
      return hay.indexOf(term) !== -1;
    }

    function libSetFilter(filterActivate) {
      var ok = libFilters.filter(function (b) { return b.dataset.libFilter === filterActivate; });
      if (!ok.length) filterActivate = 'all';
      libActive = filterActivate;
      libFilters.forEach(function (b) {
        var on = b.dataset.libFilter === libActive;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    function libApply() {
      var visible = 0;
      libCards.forEach(function (card) {
        var show = libMatches(card);
        card.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });
      if (libReadout) libReadout.textContent = visible;
      if (libEmpty) {
        libEmpty.hidden = visible !== 0 || !libTerm();
        var termEl = libEmpty.querySelector('[data-lib-term]');
        if (termEl) termEl.textContent = libTerm();
      }
    }

    libFilters.forEach(function (btn) {
      var span = btn.querySelector('[data-lib-count]');
      if (span) {
        var f = btn.dataset.libFilter;
        var n = libCards.filter(function (c) {
          if (f === 'all') return true;
          return (c.dataset.libCategory || '').trim().split(/\s+/).indexOf(f) !== -1;
        }).length;
        span.textContent = ' ' + n;
      }
      btn.addEventListener('click', function () { libSetFilter(btn.dataset.libFilter); libApply(); });
    });

    if (libSearch) libSearch.addEventListener('input', libApply);

    var libHash = location.hash ? libAliases[location.hash.slice(1).toLowerCase()] : null;
    if (libHash) libSetFilter(libHash);
    libApply();
  }

  /* ---- Substack: load posts from static JSON ---- */
  var substackEl = document.getElementById('clxSubstack');
  if (substackEl) initSubstack(substackEl);

  function substackDate(iso) {
    if (!iso) return '';
    var t = new Date(iso);
    if (isNaN(t.getTime())) return '';
    return t.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  var SUBSTACK_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" fill="none"><rect width="600" height="400" fill="%23E8E4DF"/><rect x="200" y="140" width="200" height="120" rx="8" fill="%23D4CFC8"/><path d="M260 200h80M260 220h60" stroke="%23B8AFA5" stroke-width="3" stroke-linecap="round"/></svg>');

  function postCard(item) {
    var hasImage = item.thumbnail && /^https:/.test(item.thumbnail);
    var card = document.createElement('article');
    card.className = 'clx-substack-post';

    var imgWrap = document.createElement('div');
    imgWrap.className = 'clx-substack-post-img-wrap';
    var img = document.createElement('img');
    img.className = 'clx-substack-post-img';
    img.src = hasImage ? item.thumbnail : SUBSTACK_PLACEHOLDER;
    img.alt = 'Thumbnail for ' + (item.title || 'Substack post');
    img.loading = 'lazy';
    imgWrap.appendChild(img);
    card.appendChild(imgWrap);

    var body = document.createElement('div');
    body.className = 'clx-substack-post-body';

    var cat = document.createElement('span');
    cat.className = 'clx-substack-post-category';
    cat.textContent = 'PERSPECTIVES';
    body.appendChild(cat);

    var h = document.createElement('h3');
    h.className = 'clx-substack-post-title';
    h.textContent = item.title || 'Untitled post';
    body.appendChild(h);

    if (item.description) {
      var d = document.createElement('p');
      d.className = 'clx-substack-post-excerpt';
      d.textContent = item.description;
      body.appendChild(d);
    }

    var meta = document.createElement('div');
    meta.className = 'clx-substack-post-meta';
    var dateSpan = document.createElement('span');
    dateSpan.className = 'clx-substack-post-date';
    dateSpan.textContent = substackDate(item.pubDate);
    meta.appendChild(dateSpan);
    var sep = document.createElement('span');
    sep.className = 'clx-substack-post-sep';
    sep.textContent = '\u00B7';
    meta.appendChild(sep);
    var authorSpan = document.createElement('span');
    authorSpan.className = 'clx-substack-post-author';
    authorSpan.textContent = 'CLI\x47ed Editorial';
    meta.appendChild(authorSpan);
    body.appendChild(meta);

    var link = document.createElement('a');
    link.className = 'clx-substack-post-link';
    link.href = item.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Read More ';
    var arrow = document.createElement('span');
    arrow.className = 'clx-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '\u2192';
    link.appendChild(arrow);
    body.appendChild(link);

    card.appendChild(body);
    return card;
  }

  function initSubstack(el) {
    var cfg = window.SUBSTACK_CONFIG;
    if (!cfg || typeof cfg.publication !== 'string') return;
    var pub = cfg.publication.replace(/\/+$/, '');
    var visit = document.getElementById('clxSubstackVisit');
    if (visit) { visit.href = pub; visit.hidden = false; }

    function replaceWith(node) { el.textContent = ''; el.appendChild(node); }

    function renderError() {
      var box = document.createElement('div');
      box.className = 'clx-substack-fallback';
      var tag = document.createElement('span');
      tag.className = 'clx-lib-tag';
      tag.textContent = 'Substack';
      box.appendChild(tag);
      var t = document.createElement('h3');
      t.className = 'clx-substack-empty-title';
      t.textContent = 'We couldn\u2019t load the latest Substack posts right now.';
      box.appendChild(t);
      var n = document.createElement('p');
      n.className = 'clx-substack-empty-note';
      n.textContent = 'The feed is temporarily unavailable. Visit the publication directly to read the latest.';
      box.appendChild(n);
      var a = document.createElement('a');
      a.className = 'clx-btn clx-btn--primary';
      a.href = pub;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Visit Substack ';
      var s = document.createElement('span');
      s.className = 'clx-arrow';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = '\u2192';
      a.appendChild(s);
      box.appendChild(a);
      replaceWith(box);
    }

    function renderEmpty() {
      var box = document.createElement('div');
      box.className = 'clx-substack-fallback';
      var tag = document.createElement('span');
      tag.className = 'clx-lib-tag';
      tag.textContent = 'Substack';
      box.appendChild(tag);
      var t = document.createElement('h3');
      t.className = 'clx-substack-empty-title';
      t.textContent = 'No Substack posts available yet.';
      box.appendChild(t);
      var n = document.createElement('p');
      n.className = 'clx-substack-empty-note';
      n.textContent = 'New posts will appear here automatically when published on Substack.';
      box.appendChild(n);
      var a = document.createElement('a');
      a.className = 'clx-btn clx-btn--primary';
      a.href = pub;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Visit Substack ';
      var s = document.createElement('span');
      s.className = 'clx-arrow';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = '\u2192';
      a.appendChild(s);
      box.appendChild(a);
      replaceWith(box);
    }

    fetch('./data/posts.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (posts) {
        if (!Array.isArray(posts) || !posts.length) { renderEmpty(); return; }
        var grid = document.createElement('div');
        grid.className = 'clx-substack-posts';
        posts.forEach(function (item) { grid.appendChild(postCard(item)); });
        replaceWith(grid);
      })
      .catch(function () { renderError(); })
      .finally(function () { el.setAttribute('aria-busy', 'false'); });
  }

  /* ---- Destination list → globe event (home only) ---- */
  var destItems = document.querySelectorAll('.dest-item');
  destItems.forEach(function (item) {
    var setActive = function () {
      destItems.forEach(function (d) { d.classList.toggle('is-active', d === item); });
      window.dispatchEvent(new CustomEvent('destchange', { detail: parseInt(item.dataset.dest, 10) }));
    };
    var clearActive = function () {
      destItems.forEach(function (d) { d.classList.remove('is-active'); });
      window.dispatchEvent(new CustomEvent('destchange', { detail: -1 }));
    };
    item.addEventListener('mouseenter', setActive);
    item.addEventListener('focus', setActive);
    item.addEventListener('mouseleave', clearActive);
  });

  /* ---- Wire up ---- */
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
    });
  }

  window.addEventListener('scroll', setHeader, { passive: true });
  window.addEventListener('scroll', updateSpy, { passive: true });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024 && mainNav && (mainNav.classList.contains('open') || mainNav.classList.contains('is-open'))) closeMenu();
  });
  setHeader();

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
