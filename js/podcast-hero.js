/* ==========================================================================
   CLIxED — Podcast hero background animation
   Animated soundwave-network field rendered on <canvas class="clx-hero-canvas">.
   Podcast page only. Palette matches the design system (teal / sage / gold).
   - Nodes drift in loose horizontal wave patterns (audio frequency feel)
   - Connection lines between nearby nodes pulse like waveforms
   - Cursor interaction creates flowing gold lines to nearby nodes
   - Subtle wave-form overlay behind the node network
   - Pauses when hero scrolls out of view or the tab is hidden
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
    teal: [23, 79, 74],
    sage: [113, 135, 126],
    gold: [184, 138, 69]
  };

  var LINK_DIST = 125;
  var MOUSE_RADIUS = 165;
  var WAVE_ROWS = 5;

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
    var row = Math.floor(Math.random() * WAVE_ROWS);
    return {
      x: Math.random() * w,
      y: (row + 0.5) / WAVE_ROWS * h + rand(-30, 30),
      baseY: (row + 0.5) / WAVE_ROWS * h,
      vx: rand(-0.14, 0.14),
      vy: rand(-0.06, 0.06),
      r: rand(1, 2.4),
      color: color,
      row: row,
      phase: rand(0, Math.PI * 2),
      pulse: rand(0.0004, 0.001),
      waveK: rand(0.006, 0.012),
      waveAmp: rand(8, 20),
      waveSp: rand(0.0002, 0.0005)
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

    var target = Math.min(Math.floor((w * h) / 16000), 85);
    target = Math.max(target, 24);
    while (nodes.length > target) nodes.pop();
    while (nodes.length < target) nodes.push(makeNode());
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, w, h);

    var i, j, a, b, dx, dy, dist, alpha;

    /* subtle waveform lines behind everything */
    ctx.lineWidth = 0.6;
    for (var r = 0; r < WAVE_ROWS; r++) {
      var rowY = (r + 0.5) / WAVE_ROWS * h;
      var waveA = 0.035 + 0.02 * Math.sin(t * 0.0003 + r * 0.8);
      ctx.strokeStyle = 'rgba(' + COLORS.teal.join(',') + ',' + waveA.toFixed(3) + ')';
      ctx.beginPath();
      for (var x = 0; x <= w; x += 12) {
        var y = rowY + Math.sin(x * 0.008 + t * 0.00025 + r * 1.2) * 14
                     + Math.sin(x * 0.003 + t * 0.00015) * 6;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    /* inter-node links */
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x;
        dy = a.y - b.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          alpha = (1 - dist / LINK_DIST) * 0.13;
          ctx.strokeStyle = 'rgba(' + COLORS.teal.join(',') + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    /* cursor links */
    if (mouse.x > -999) {
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - mouse.x;
        dy = a.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          alpha = (1 - dist / MOUSE_RADIUS) * 0.24;
          ctx.strokeStyle = 'rgba(' + COLORS.gold.join(',') + ',' + alpha.toFixed(3) + ')';
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
      ctx.fillStyle = 'rgba(' + a.color.join(',') + ',' + (0.28 + 0.44 * glow).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r + glow * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step(t) {
    var i, n;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];

      n.x += n.vx;
      n.y = n.baseY + Math.sin(n.x * n.waveK + t * n.waveSp + n.phase) * n.waveAmp;

      /* gentle drift away from cursor */
      var dx = n.x - mouse.x;
      var dy = n.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0.01) {
        var push = (1 - dist / MOUSE_RADIUS) * 0.25;
        n.x += (dx / dist) * push;
        n.y += (dy / dist) * push;
      }

      /* wrap horizontally */
      if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10;
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
    drawFrame(0);
  } else {
    start();

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
