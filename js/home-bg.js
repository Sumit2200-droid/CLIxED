/* ==========================================================================
   CLIxED — Home hero background animation
   Animated node-network field rendered on <canvas class="clx-hero-canvas">.
   Homepage only. Palette matches the design system (teal / sage / gold).
   - Pauses when the hero scrolls out of view or the tab is hidden
   - Falls back to a single static frame under prefers-reduced-motion
   ========================================================================== */
(function () {
  'use strict';

  var canvas = document.querySelector('.clx-hero-canvas');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var hero = canvas.closest('.clx-hero') || canvas.parentElement;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var COLORS = {
    teal: [23, 79, 74],    /* --color-primary */
    sage: [113, 135, 126], /* --color-secondary */
    gold: [184, 138, 69]   /* --color-accent */
  };

  var LINK_DIST = 140;
  var MOUSE_RADIUS = 160;

  var dpr = 1;
  var w = 0;
  var h = 0;
  var nodes = [];
  var raf = null;
  var running = false;
  var mouse = { x: -9999, y: -9999 };

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeNode() {
    var roll = Math.random();
    var color = roll < 0.14 ? COLORS.gold : (roll < 0.5 ? COLORS.sage : COLORS.teal);
    return {
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.22, 0.22),
      vy: rand(-0.18, 0.18),
      r: rand(1, 2.4),
      color: color,
      phase: rand(0, Math.PI * 2),
      pulse: rand(0.0003, 0.001)
    };
  }

  function sizeCanvas() {
    var rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(rect.width, 1);
    h = Math.max(rect.height, 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.min(Math.floor((w * h) / 16000), 90);
    target = Math.max(target, 24);
    while (nodes.length > target) nodes.pop();
    while (nodes.length < target) nodes.push(makeNode());
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, w, h);

    var i, j, a, b, dx, dy, dist, alpha;

    /* links */
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x;
        dy = a.y - b.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          alpha = (1 - dist / LINK_DIST) * 0.16;
          ctx.strokeStyle = 'rgba(' + COLORS.teal.join(',') + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    /* link to cursor */
    if (mouse.x > -999) {
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - mouse.x;
        dy = a.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          alpha = (1 - dist / MOUSE_RADIUS) * 0.3;
          ctx.strokeStyle = 'rgba(' + COLORS.gold.join(',') + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    /* dots */
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      var glow = 0.55 + 0.45 * Math.sin(t * a.pulse + a.phase);
      ctx.fillStyle = 'rgba(' + a.color.join(',') + ',' + (0.35 + 0.4 * glow).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r + glow * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step(t) {
    var i, n;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];

      n.x += n.vx;
      n.y += n.vy;

      /* gentle drift away from cursor */
      var dx = n.x - mouse.x;
      var dy = n.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0.01) {
        var push = (1 - dist / MOUSE_RADIUS) * 0.35;
        n.x += (dx / dist) * push;
        n.y += (dy / dist) * push;
      }

      /* wrap edges */
      if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10;
      if (n.y < -10) n.y = h + 10; else if (n.y > h + 10) n.y = -10;
    }
    drawFrame(t);
  }

  function loop(t) {
    step(t || 0);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  sizeCanvas();

  if (reduced) {
    drawFrame(0); /* one calm static frame */
  } else {
    start();

    /* pause when hero not on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0 }).observe(hero);
    }

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    window.addEventListener('resize', function () {
      sizeCanvas();
      if (!running) drawFrame(0);
    }, { passive: true });

    hero.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });

    hero.addEventListener('mouseleave', function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });
  }
})();
