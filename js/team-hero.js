/* ==========================================================================
   CLIxED — Team hero background animation
   Animated people-network field rendered on <canvas class="clx-hero-canvas">.
   Team page only. Palette matches the design system (teal / sage / gold).
   - Nodes represent team members drifting in 3 loose clusters (leadership layers)
   - Connection lines between nearby nodes pulse when active
   - Cursor interaction creates flowing gold lines to nearby nodes
   - Node sizes vary to suggest different roles (larger = senior)
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

  var LINK_DIST = 135;
  var MOUSE_RADIUS = 175;
  var CLUSTER_COUNT = 3;

  var dpr = 1;
  var w = 0;
  var h = 0;
  var nodes = [];
  var clusters = [];
  var raf = null;
  var running = false;
  var mouse = { x: -9999, y: -9999 };

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function initClusters() {
    clusters = [];
    /* 3 clusters for 3 leadership layers */
    var positions = [
      { x: 0.50, y: 0.30 },
      { x: 0.22, y: 0.62 },
      { x: 0.78, y: 0.62 }
    ];
    for (var i = 0; i < CLUSTER_COUNT; i++) {
      clusters.push({
        x: w * positions[i].x,
        y: h * positions[i].y,
        targetX: w * positions[i].x,
        targetY: h * positions[i].y,
        drift: rand(0.00003, 0.00006),
        phase: rand(0, Math.PI * 2)
      });
    }
  }

  function makeNode(clusterIdx) {
    var roll = Math.random();
    var color = roll < 0.14 ? COLORS.gold : (roll < 0.5 ? COLORS.sage : COLORS.teal);
    var c = clusters[clusterIdx];
    /* Larger nodes for cluster 0 (senior leadership) */
    var sizeBase = clusterIdx === 0 ? rand(1.8, 3.2) : rand(1, 2.4);
    return {
      x: c.x + rand(-70, 70),
      y: c.y + rand(-70, 70),
      vx: rand(-0.16, 0.16),
      vy: rand(-0.14, 0.14),
      r: sizeBase,
      color: color,
      cluster: clusterIdx,
      phase: rand(0, Math.PI * 2),
      pulse: rand(0.0003, 0.0009)
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

    initClusters();

    var target = Math.min(Math.floor((w * h) / 15000), 95);
    target = Math.max(target, 28);
    while (nodes.length > target) nodes.pop();
    while (nodes.length < target) {
      var ci = nodes.length % CLUSTER_COUNT;
      nodes.push(makeNode(ci));
    }
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, w, h);

    var i, j, a, b, dx, dy, dist, alpha;

    /* intra-cluster links */
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x;
        dy = a.y - b.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          alpha = (1 - dist / LINK_DIST) * 0.15;
          ctx.strokeStyle = 'rgba(' + COLORS.teal.join(',') + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    /* inter-cluster bridge links (gold, subtle) */
    ctx.lineWidth = 0.5;
    for (i = 0; i < clusters.length; i++) {
      for (j = i + 1; j < clusters.length; j++) {
        dx = clusters[i].x - clusters[j].x;
        dy = clusters[i].y - clusters[j].y;
        dist = Math.sqrt(dx * dx + dy * dy);
        var bridgeAlpha = 0.025 + 0.02 * Math.sin(t * 0.00035 + i + j * 1.4);
        ctx.strokeStyle = 'rgba(' + COLORS.gold.join(',') + bridgeAlpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(clusters[i].x, clusters[i].y);
        ctx.lineTo(clusters[j].x, clusters[j].y);
        ctx.stroke();
      }
    }

    /* cursor links */
    if (mouse.x > -999) {
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - mouse.x;
        dy = a.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          alpha = (1 - dist / MOUSE_RADIUS) * 0.26;
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
      ctx.fillStyle = 'rgba(' + a.color.join(',') + ',' + (0.30 + 0.44 * glow).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r + glow * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    /* cluster centre rings */
    for (i = 0; i < clusters.length; i++) {
      var c = clusters[i];
      var ringR = 6 + 2.5 * Math.sin(t * 0.0009 + c.phase);
      ctx.strokeStyle = 'rgba(' + COLORS.gold.join(',') + '0.08)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function step(t) {
    var i, n;

    /* drift cluster centres */
    for (i = 0; i < clusters.length; i++) {
      var c = clusters[i];
      c.x = c.targetX + Math.sin(t * c.drift + c.phase) * 35;
      c.y = c.targetY + Math.cos(t * c.drift * 0.8 + c.phase) * 28;
    }

    /* move nodes */
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];

      n.x += n.vx;
      n.y += n.vy;

      /* gentle pull toward cluster centre */
      var cl = clusters[n.cluster];
      var dcx = cl.x - n.x;
      var dcy = cl.y - n.y;
      n.x += dcx * 0.00035;
      n.y += dcy * 0.00035;

      /* gentle drift away from cursor */
      var dx = n.x - mouse.x;
      var dy = n.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0.01) {
        var push = (1 - dist / MOUSE_RADIUS) * 0.28;
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
