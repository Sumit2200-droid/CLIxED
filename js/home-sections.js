/* ==========================================================================
   CLIxED — Home section background animations
   Modes (all unique to the homepage):
     orbs      — soft drifting colour washes          (Who We Are)
     rise      — rising motes                          (Team)
     gridwalk  — blueprint grid + travelling pulses    (Five Areas)
     rings     — sonar rings from an emitter           (Why CLIxED)
     diagonals — slow diagonal light streaks           (Fieldwork band)
     orbits    — elliptical orbits around a focus      (Foresight)
     waves     — flowing sine lines                    (Partners)
     sheets    — drifting paper outlines               (Insights)
     aurora    — glowing gradients on dark             (Final CTA)
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

  /* --- soft drifting colour washes ------------------------------------- */
  M.orbs = function () {
    var defs = [
      { c: TEAL, a: 0.07, r: 0.40, sx: 0.00013, sy: 0.00009, px: 0.12, py: 0.72 },
      { c: GOLD, a: 0.06, r: 0.32, sx: 0.00011, sy: 0.00015, px: 0.58, py: 0.22 },
      { c: SAGE, a: 0.08, r: 0.35, sx: 0.00008, sy: 0.00012, px: 0.86, py: 0.62 },
      { c: TEAL, a: 0.05, r: 0.26, sx: 0.00016, sy: 0.00007, px: 0.34, py: 0.30 }
    ];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < defs.length; i++) {
          var d = defs[i];
          var cx = w * (d.px + 0.13 * Math.sin(t * d.sx + i * 2.1));
          var cy = h * (d.py + 0.15 * Math.cos(t * d.sy + i * 1.4));
          var rad = Math.min(w, h) * d.r;
          var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
          g.addColorStop(0, 'rgba(' + d.c + ',' + d.a + ')');
          g.addColorStop(1, 'rgba(' + d.c + ',0)');
          ctx.fillStyle = g;
          ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
        }
      }
    };
  };

  /* --- rising motes ------------------------------------------------------ */
  M.rise = function () {
    var dots = [];
    for (var i = 0; i < 44; i++) {
      dots.push({
        x: Math.random(), y: Math.random(),
        v: rand(0.018, 0.06),
        sway: rand(6, 22), sw: rand(0.0004, 0.001),
        r: rand(0.8, 2), g: Math.random() < 0.18,
        ph: rand(0, TAU)
      });
    }
    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < dots.length; i++) {
          var d = dots[i];
          d.y -= d.v * dt;
          if (d.y < -0.05) { d.y = 1.05; d.x = Math.random(); }
          var x = d.x * w + Math.sin(t * d.sw + d.ph) * d.sway;
          var fade = Math.min(1, Math.min(d.y + 0.05, 1.05 - d.y) / 0.18);
          ctx.fillStyle = 'rgba(' + (d.g ? GOLD : TEAL) + ',' + (0.30 * fade).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(x, d.y * h, d.r, 0, TAU);
          ctx.fill();
        }
      }
    };
  };

  /* --- blueprint grid + travelling light pulses --------------------------- */
  M.gridwalk = function () {
    var GAP = 56;
    var walkers = [];
    for (var i = 0; i < 7; i++) {
      walkers.push({
        lane: Math.random(), vert: i % 2 === 0,
        pos: Math.random(),
        v: rand(0.03, 0.09) * (Math.random() < 0.5 ? -1 : 1),
        g: i % 3 === 0
      });
    }
    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(' + TEAL + ',0.055)';
        ctx.lineWidth = 1;
        var x, y;
        for (x = GAP; x < w; x += GAP) {
          ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke();
        }
        for (y = GAP; y < h; y += GAP) {
          ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke();
        }
        var lanesX = Math.max(Math.floor(w / GAP), 1);
        var lanesY = Math.max(Math.floor(h / GAP), 1);
        for (var j = 0; j < walkers.length; j++) {
          var k = walkers[j];
          k.pos += k.v * dt;
          if (k.pos > 1.02) k.pos = -0.02; else if (k.pos < -0.02) k.pos = 1.02;
          var col = k.g ? GOLD : TEAL;
          if (k.vert) {
            var wx = (Math.floor(k.lane * lanesX) + 0.5) * GAP;
            var wy = k.pos * h;
            ctx.strokeStyle = 'rgba(' + col + ',0.20)';
            ctx.beginPath();
            ctx.moveTo(wx + 0.5, wy - Math.sign(k.v) * 46);
            ctx.lineTo(wx + 0.5, wy);
            ctx.stroke();
            ctx.fillStyle = 'rgba(' + col + ',0.55)';
            ctx.beginPath(); ctx.arc(wx, wy, 2.2, 0, TAU); ctx.fill();
          } else {
            var hx = k.pos * w;
            var hy = (Math.floor(k.lane * lanesY) + 0.5) * GAP;
            ctx.strokeStyle = 'rgba(' + col + ',0.20)';
            ctx.beginPath();
            ctx.moveTo(hx - Math.sign(k.v) * 46, hy + 0.5);
            ctx.lineTo(hx, hy + 0.5);
            ctx.stroke();
            ctx.fillStyle = 'rgba(' + col + ',0.55)';
            ctx.beginPath(); ctx.arc(hx, hy, 2.2, 0, TAU); ctx.fill();
          }
        }
      }
    };
  };

  /* --- sonar rings --------------------------------------------------------- */
  M.rings = function () {
    var list = [];
    var period = 2100;
    var acc = period;
    var last = 0;
    return {
      draw: function (ctx, w, h, t, dt) {
        acc += (t - last); last = t;
        ctx.clearRect(0, 0, w, h);
        var cx = w * 0.84, cy = h * 0.30;
        var maxR = Math.sqrt(w * w + h * h) * 0.75;
        if (acc >= period && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          acc = 0;
          list.push({ r: 6 });
          if (list.length > 6) list.shift();
        }
        for (var i = list.length - 1; i >= 0; i--) {
          var rg = list[i];
          rg.r += dt * 95;
          var alpha = 0.16 * (1 - rg.r / maxR);
          if (alpha <= 0.005) { list.splice(i, 1); continue; }
          ctx.strokeStyle = 'rgba(' + TEAL + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, rg.r, 0, TAU);
          ctx.stroke();
        }
        var pulse = 2.6 + Math.sin(t * 0.004) * 0.9;
        ctx.fillStyle = 'rgba(' + GOLD + ',0.75)';
        ctx.beginPath(); ctx.arc(cx, cy, pulse, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(' + GOLD + ',0.18)';
        ctx.beginPath(); ctx.arc(cx, cy, pulse + 7, 0, TAU); ctx.fill();
      }
    };
  };

  /* --- slow diagonal streaks ------------------------------------------------ */
  M.diagonals = function () {
    var lines = [];
    var N = 18;
    for (var i = 0; i < N; i++) {
      lines.push({ off: i / N + rand(-0.01, 0.01), sp: rand(0.006, 0.016), g: i % 6 === 0 });
    }
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;
        var span = w + h;
        for (var i = 0; i < lines.length; i++) {
          var l = lines[i];
          var p = (l.off + t * l.sp * 0.001) % 1;
          if (p < 0) p += 1;
          var c = p * span - h;
          ctx.strokeStyle = 'rgba(' + (l.g ? GOLD : TEAL) + ',' + (l.g ? 0.10 : 0.055) + ')';
          ctx.beginPath();
          ctx.moveTo(c, 0);
          ctx.lineTo(c + h, h);
          ctx.stroke();
        }
      }
    };
  };

  /* --- elliptical orbits ----------------------------------------------------- */
  M.orbits = function () {
    var defs = [
      { rx: 0.30, ry: 0.17, sp: 0.00028, ph: 0.4 },
      { rx: 0.20, ry: 0.26, sp: -0.00045, ph: 2.2 },
      { rx: 0.38, ry: 0.10, sp: 0.00017, ph: 4.1 }
    ];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        var base = Math.min(w, 1150);
        var cx = w * 0.74, cy = h * 0.52;
        for (var i = 0; i < defs.length; i++) {
          var o = defs[i];
          var rx = o.rx * base, ry = o.ry * h;
          ctx.setLineDash([2, 7]);
          ctx.strokeStyle = 'rgba(' + TEAL + ',0.14)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
          ctx.stroke();
          ctx.setLineDash([]);
          var ang = t * o.sp + o.ph;
          var ex = cx + Math.cos(ang) * rx;
          var ey = cy + Math.sin(ang) * ry;
          ctx.strokeStyle = 'rgba(' + GOLD + ',0.30)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, ang - 0.55, ang);
          ctx.stroke();
          ctx.fillStyle = 'rgba(' + GOLD + ',0.85)';
          ctx.beginPath(); ctx.arc(ex, ey, 2.4, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = 'rgba(' + TEAL + ',0.55)';
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, TAU); ctx.fill();
      }
    };
  };

  /* --- flowing sine lines ------------------------------------------------------ */
  M.waves = function () {
    var rows = [
      { y: 0.24, amp: 18, k: 0.008, sp: 0.00038, col: TEAL, a: 0.09 },
      { y: 0.50, amp: 27, k: 0.006, sp: -0.00026, col: SAGE, a: 0.10 },
      { y: 0.74, amp: 14, k: 0.010, sp: 0.00052, col: GOLD, a: 0.08 }
    ];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          ctx.strokeStyle = 'rgba(' + r.col + ',' + r.a + ')';
          ctx.beginPath();
          for (var x = 0; x <= w; x += 8) {
            var y = h * r.y + Math.sin(x * r.k + t * r.sp) * r.amp
                          + Math.sin(x * r.k * 0.37 + t * r.sp * 0.6) * r.amp * 0.4;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    };
  };

  /* --- drifting paper outlines --------------------------------------------------- */
  M.sheets = function () {
    var items = [];
    for (var i = 0; i < 12; i++) {
      items.push({
        x: Math.random(), y: rand(0.10, 0.90),
        v: rand(0.008, 0.028),
        s: rand(11, 22),
        rot: rand(-0.25, 0.25), vr: rand(-0.00025, 0.00025),
        g: i % 4 === 0
      });
    }
    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;
        for (var i = 0; i < items.length; i++) {
          var s = items[i];
          s.x += s.v * dt;
          s.rot += s.vr * dt;
          if (s.x > 1.12) { s.x = -0.12; s.y = rand(0.10, 0.90); }
          ctx.save();
          ctx.translate(s.x * w, s.y * h);
          ctx.rotate(s.rot);
          ctx.strokeStyle = 'rgba(' + (s.g ? GOLD : TEAL) + ',0.13)';
          ctx.strokeRect(-s.s * 0.68, -s.s, s.s * 1.36, s.s * 2);
          ctx.beginPath();
          ctx.moveTo(-s.s * 0.68, -s.s * 0.42);
          ctx.lineTo(s.s * 0.68, -s.s * 0.42);
          ctx.stroke();
          ctx.restore();
        }
      }
    };
  };

  /* --- glowing gradients on dark (final CTA) --------------------------------------- */
  M.aurora = function () {
    var blobs = [
      { c: '46,93,168', a: 0.20, r: 0.52, sx: 0.00010, sy: 0.00007, px: 0.24, py: 0.30 },
      { c: '184,138,69', a: 0.15, r: 0.44, sx: 0.00013, sy: 0.00010, px: 0.76, py: 0.66 },
      { c: '94,148,138', a: 0.17, r: 0.48, sx: 0.00008, sy: 0.00012, px: 0.50, py: 0.14 },
      { c: '184,138,69', a: 0.10, r: 0.34, sx: 0.00016, sy: 0.00009, px: 0.12, py: 0.82 }
    ];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < blobs.length; i++) {
          var b = blobs[i];
          var cx = w * (b.px + 0.16 * Math.sin(t * b.sx + i * 1.9));
          var cy = h * (b.py + 0.18 * Math.cos(t * b.sy + i * 1.2));
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
