/* ==========================================================================
   CLIxED — What We Do section background animations
   Modes (all unique to the What We Do page — none repeat home/about/team sets):
     topo       — morphing topography contour lines           (Introduction)
     pentanet   — 5 rotating pentagon rings with spokes       (Five Areas)
     processflow — flowing particles with branching nodes     (Way of Working)
     citygrid   — city-block grid with glowing intersections  (Who We Serve)
     auroradawn — gentle aurora gradients on dark             (Final CTA)
   Requires js/bg-engine.js
   ========================================================================== */
(function () {
  'use strict';

  if (!window.CLXBg) return;
  var M = window.CLXBg.modes;
  var TAU = window.CLXBg.TAU;
  function rand(min, max) { return window.CLXBg.rand(min, max); }
  var TEAL = window.CLXBg.TEAL;
  var SAGE = window.CLXBg.SAGE;
  var GOLD = window.CLXBg.GOLD;

  /* --- morphing topography contour lines ------------------------------------ */
  M.topo = function () {
    var LAYERS = 14;
    var offsets = [];
    for (var i = 0; i < LAYERS; i++) {
      offsets.push({
        base: i / LAYERS,
        amp: rand(12, 30),
        k1: rand(0.003, 0.007),
        k2: rand(0.001, 0.003),
        sp1: rand(0.00015, 0.00035),
        sp2: rand(0.00008, 0.0002),
        ph: rand(0, TAU),
        g: i % 4 === 0
      });
    }
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 0.8;
        for (var i = 0; i < offsets.length; i++) {
          var o = offsets[i];
          var a = 0.04 + 0.025 * Math.sin(t * 0.0003 + i * 0.5);
          ctx.strokeStyle = 'rgba(' + (o.g ? GOLD : TEAL) + ',' + a.toFixed(3) + ')';
          ctx.beginPath();
          for (var x = -20; x <= w + 20; x += 10) {
            var y = h * o.base
              + Math.sin(x * o.k1 + t * o.sp1 + o.ph) * o.amp
              + Math.sin(x * o.k2 + t * o.sp2 + o.ph * 0.7) * o.amp * 0.5;
            if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    };
  };

  /* --- 5 rotating pentagon rings with spokes --------------------------------- */
  M.pentanet = function () {
    var rings = [
      { r: 0.18, sp: 0.00018, dots: 5, col: GOLD },
      { r: 0.30, sp: -0.00012, dots: 8, col: TEAL },
      { r: 0.42, sp: 0.00009, dots: 12, col: SAGE },
      { r: 0.54, sp: -0.00007, dots: 16, col: TEAL }
    ];
    var spokes = [];
    for (var i = 0; i < 5; i++) {
      spokes.push({
        angle: (i / 5) * TAU,
        sp: rand(0.00012, 0.00025),
        len: rand(0.38, 0.56),
        pulse: 0, pulseSp: rand(0.0003, 0.0006)
      });
    }
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        var cx = w * 0.5, cy = h * 0.50;
        var base = Math.min(w, h) * 0.55;

        /* concentric rings */
        ctx.lineWidth = 0.6;
        for (var r = 0; r < rings.length; r++) {
          var rd = rings[r];
          var radius = base * rd.r;
          ctx.strokeStyle = 'rgba(' + rd.col + ',0.10)';
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, TAU);
          ctx.stroke();
          /* dots on ring */
          for (var d = 0; d < rd.dots; d++) {
            var ang = (d / rd.dots) * TAU + t * rd.sp;
            var dx = cx + Math.cos(ang) * radius;
            var dy = cy + Math.sin(ang) * radius;
            var da = 0.12 + 0.10 * Math.sin(t * 0.0006 + d * 0.8);
            ctx.fillStyle = 'rgba(' + rd.col + ',' + da.toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(dx, dy, r === 0 ? 2 : 1.2, 0, TAU);
            ctx.fill();
          }
        }

        /* spokes from centre */
        ctx.lineWidth = 0.8;
        for (var s = 0; s < spokes.length; s++) {
          var sp = spokes[s];
          var ang = sp.angle + t * sp.sp;
          var ex = cx + Math.cos(ang) * base * sp.len;
          var ey = cy + Math.sin(ang) * base * sp.len;
          var sa = 0.06 + 0.04 * Math.sin(t * 0.0005 + s * 1.2);
          ctx.strokeStyle = 'rgba(' + GOLD + ',' + sa.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          /* travelling pulse on spoke */
          sp.pulse += sp.pulseSp;
          if (sp.pulse > 1) sp.pulse = 0;
          var pp = sp.pulse;
          var px = cx + (ex - cx) * pp;
          var py = cy + (ey - cy) * pp;
          var fade = Math.sin(pp * Math.PI);
          ctx.fillStyle = 'rgba(' + GOLD + ',' + (0.5 * fade).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(px, py, 1.6, 0, TAU);
          ctx.fill();
        }

        /* centre dot */
        ctx.fillStyle = 'rgba(' + GOLD + ',0.65)';
        ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, TAU); ctx.fill();
      }
    };
  };

  /* --- flowing particles with branching nodes -------------------------------- */
  M.processflow = function () {
    var STAGE_COUNT = 6;
    var stages = [];
    for (var i = 0; i < STAGE_COUNT; i++) {
      stages.push({
        x: (i + 0.8) / (STAGE_COUNT + 0.6),
        label: i
      });
    }
    var particles = [];
    var acc = 0;
    var last = 0;

    function spawnParticle() {
      var startStage = 0;
      particles.push({
        stage: startStage,
        progress: 0,
        speed: rand(0.12, 0.28),
        branch: Math.random() < 0.3 ? Math.floor(rand(1, STAGE_COUNT)) : -1,
        branchAt: rand(0.2, 0.8),
        g: Math.random() < 0.25
      });
    }

    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        var cy = h * 0.50;
        var x0 = w * 0.06, x1 = w * 0.94;
        var segW = (x1 - x0) / STAGE_COUNT;

        /* baseline */
        ctx.strokeStyle = 'rgba(' + TEAL + ',0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, cy + 0.5);
        ctx.lineTo(x1, cy + 0.5);
        ctx.stroke();

        /* stage nodes */
        for (var s = 0; s < stages.length; s++) {
          var sx = stages[s].x * w;
          var na = 0.06 + 0.04 * Math.sin(t * 0.0005 + s * 0.9);
          ctx.fillStyle = 'rgba(' + TEAL + ',' + na.toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(sx, cy, 6, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(' + GOLD + ',' + (na * 1.5).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(sx, cy, 2.5, 0, TAU);
          ctx.fill();
        }

        /* spawn + move particles */
        acc += (t - last); last = t;
        if (acc > 650) {
          acc = 0;
          spawnParticle();
          if (particles.length > 18) particles.shift();
        }
        for (var p = particles.length - 1; p >= 0; p--) {
          var pl = particles[p];
          pl.progress += pl.speed * dt;
          if (pl.progress >= 1) {
            pl.stage++;
            pl.progress = 0;
            if (pl.stage >= STAGE_COUNT) {
              particles.splice(p, 1);
              continue;
            }
          }
          var baseX = x0 + (pl.stage + pl.progress) * segW;
          var baseY = cy;
          var col = pl.g ? GOLD : TEAL;
          var fade = Math.sin(pl.progress * Math.PI);
          ctx.fillStyle = 'rgba(' + col + ',' + (0.5 * fade).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(baseX, baseY, 1.8, 0, TAU);
          ctx.fill();
          /* trail */
          var trailX = x0 + (pl.stage + Math.max(pl.progress - 0.15, 0)) * segW;
          ctx.strokeStyle = 'rgba(' + col + ',' + (0.18 * fade).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(trailX, baseY);
          ctx.lineTo(baseX, baseY);
          ctx.stroke();

          /* branch indicator */
          if (pl.branch === pl.stage && pl.progress > pl.branchAt) {
            var bx = baseX;
            var by = baseY - 30 - 10 * Math.sin(t * 0.001 + p);
            ctx.strokeStyle = 'rgba(' + GOLD + ',0.15)';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY - 6);
            ctx.lineTo(bx, by);
            ctx.stroke();
            ctx.fillStyle = 'rgba(' + GOLD + ',0.35)';
            ctx.beginPath();
            ctx.arc(bx, by, 1.5, 0, TAU);
            ctx.fill();
          }
        }
      }
    };
  };

  /* --- city-block grid with glowing intersections ---------------------------- */
  M.citygrid = function () {
    var GAP = 52;
    var lights = [];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);

        /* grid lines */
        ctx.strokeStyle = 'rgba(' + TEAL + ',0.04)';
        ctx.lineWidth = 0.6;
        var x, y;
        for (x = GAP; x < w; x += GAP) {
          ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke();
        }
        for (y = GAP; y < h; y += GAP) {
          ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke();
        }

        /* intersection glow nodes */
        var cols = Math.max(Math.floor(w / GAP), 1);
        var rows = Math.max(Math.floor(h / GAP), 1);
        var ci, ri;
        for (ri = 0; ri < rows; ri++) {
          for (ci = 0; ci < cols; ci++) {
            var ix = (ci + 1) * GAP;
            var iy = (ri + 1) * GAP;
            var hash = (ci * 7 + ri * 13) % 17;
            var isGold = hash < 3;
            var isSage = hash >= 3 && hash < 6;
            var pulse = 0.04 + 0.035 * Math.sin(t * 0.0005 + ci * 0.8 + ri * 1.1);
            var col = isGold ? GOLD : (isSage ? SAGE : TEAL);
            ctx.fillStyle = 'rgba(' + col + ',' + pulse.toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(ix, iy, isGold ? 3 : 1.8, 0, TAU);
            ctx.fill();
          }
        }

        /* travelling light along horizontal streets */
        if (lights.length < 5 && Math.random() < 0.03) {
          lights.push({
            row: Math.floor(Math.random() * rows),
            pos: 0,
            speed: rand(0.04, 0.12) * (Math.random() < 0.5 ? 1 : -1),
            g: Math.random() < 0.3
          });
        }
        ctx.lineWidth = 0.8;
        for (var l = lights.length - 1; l >= 0; l--) {
          var lt = lights[l];
          lt.pos += lt.speed * 0.016;
          if (lt.pos > 1.1 || lt.pos < -0.1) { lights.splice(l, 1); continue; }
          var lx = lt.pos * w;
          var ly = (lt.row + 1) * GAP;
          var lcol = lt.g ? GOLD : TEAL;
          ctx.strokeStyle = 'rgba(' + lcol + ',0.18)';
          ctx.beginPath();
          ctx.moveTo(lx - Math.sign(lt.speed) * 30, ly + 0.5);
          ctx.lineTo(lx, ly + 0.5);
          ctx.stroke();
          ctx.fillStyle = 'rgba(' + lcol + ',0.50)';
          ctx.beginPath();
          ctx.arc(lx, ly, 2, 0, TAU);
          ctx.fill();
        }
      }
    };
  };

  /* --- gentle aurora gradients on dark --------------------------------------- */
  M.auroradawn = function () {
    var blobs = [
      { c: '23,79,74', a: 0.18, r: 0.50, sx: 0.00009, sy: 0.00006, px: 0.22, py: 0.28 },
      { c: '184,138,69', a: 0.14, r: 0.42, sx: 0.00011, sy: 0.00008, px: 0.74, py: 0.64 },
      { c: '94,148,138', a: 0.16, r: 0.46, sx: 0.00007, sy: 0.00010, px: 0.50, py: 0.12 },
      { c: '184,138,69', a: 0.09, r: 0.32, sx: 0.00014, sy: 0.00007, px: 0.14, py: 0.80 },
      { c: '23,79,74', a: 0.11, r: 0.38, sx: 0.00006, sy: 0.00012, px: 0.86, py: 0.36 }
    ];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < blobs.length; i++) {
          var b = blobs[i];
          var cx = w * (b.px + 0.15 * Math.sin(t * b.sx + i * 1.7));
          var cy = h * (b.py + 0.16 * Math.cos(t * b.sy + i * 1.1));
          var rad = Math.min(w, h) * b.r;
          var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
          g.addColorStop(0, 'rgba(' + b.c + ',' + b.a + ')');
          g.addColorStop(1, 'rgba(' + b.c + ',0)');
          ctx.fillStyle = g;
          ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
        }
      }
    };
  };

  window.CLXBg.init();
})();
