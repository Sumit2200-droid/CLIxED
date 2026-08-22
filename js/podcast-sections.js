/* ==========================================================================
   CLIxED — Podcast section background animations
   Modes (all unique to the Podcast page — none repeat home/about/team/wwd sets):
     eqband     — vertical equalizer bands with pulsing levels    (Featured Episode)
     sonicrings — concentric sonar rings with travelling dots     (Episode Library)
     fieldgrain — subtle drifting particle field                  (From the Field)
     radiowave  — horizontal radio-wave sine lines                (About the Podcast)
     podaurora  — warm aurora gradients on dark                   (CTA / Substack)
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

  /* --- vertical equalizer bands with pulsing levels -------------------------- */
  M.eqband = function () {
    var BANDS = 22;
    var bands = [];
    for (var i = 0; i < BANDS; i++) {
      bands.push({
        x: (i + 0.5) / BANDS,
        ph: rand(0, TAU),
        sp: rand(0.0005, 0.0012),
        baseH: rand(0.08, 0.25),
        amp: rand(0.04, 0.12),
        g: i % 5 === 0
      });
    }
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        var gap = w / BANDS;
        var bw = gap * 0.45;
        for (var i = 0; i < bands.length; i++) {
          var b = bands[i];
          var bh = (b.baseH + b.amp * Math.sin(t * b.sp + b.ph)) * h;
          var bx = b.x * w - bw / 2;
          var by = h * 0.5 - bh / 2;
          var a = 0.04 + 0.03 * Math.sin(t * 0.0004 + i * 0.5);
          var col = b.g ? GOLD : TEAL;
          ctx.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
          ctx.fillRect(bx, by, bw, bh);
        }
      }
    };
  };

  /* --- concentric sonar rings with travelling dots --------------------------- */
  M.sonicrings = function () {
    var rings = [];
    var acc = 0;
    var centres = [
      { x: 0.50, y: 0.45 }
    ];
    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        acc += dt * 1000;
        if (acc > 2200) {
          acc = 0;
          var ci = centres[0];
          rings.push({ age: 0, cx: ci.x, cy: ci.y });
          if (rings.length > 7) rings.shift();
        }
        for (var i = rings.length - 1; i >= 0; i--) {
          var rg = rings[i];
          rg.age += dt * 1000;
          if (rg.age > 6000) { rings.splice(i, 1); continue; }
          var progress = rg.age / 6000;
          var radius = progress * Math.max(w, h) * 0.55;
          var alpha = 0.08 * (1 - progress);
          ctx.strokeStyle = 'rgba(' + TEAL + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(rg.cx * w, rg.cy * h, radius, 0, TAU);
          ctx.stroke();
          /* travelling dot on ring */
          var dotAng = t * 0.0008 + i * 1.5;
          var dx = rg.cx * w + Math.cos(dotAng) * radius;
          var dy = rg.cy * h + Math.sin(dotAng) * radius;
          var da = 0.25 * (1 - progress);
          ctx.fillStyle = 'rgba(' + GOLD + ',' + da.toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(dx, dy, 1.6, 0, TAU);
          ctx.fill();
        }
        /* centre emitter */
        var pulse = 2.2 + Math.sin(t * 0.004) * 0.8;
        ctx.fillStyle = 'rgba(' + GOLD + ',0.55)';
        ctx.beginPath();
        ctx.arc(centres[0].x * w, centres[0].y * h, pulse, 0, TAU);
        ctx.fill();
      }
    };
  };

  /* --- subtle drifting particle field ---------------------------------------- */
  M.fieldgrain = function () {
    var dots = [];
    for (var i = 0; i < 50; i++) {
      dots.push({
        x: Math.random(), y: Math.random(),
        vx: rand(-0.008, 0.008),
        vy: rand(-0.012, 0.012),
        r: rand(0.6, 1.6),
        ph: rand(0, TAU),
        sp: rand(0.0004, 0.001),
        g: Math.random() < 0.2
      });
    }
    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < dots.length; i++) {
          var d = dots[i];
          d.x += d.vx * dt * 60;
          d.y += d.vy * dt * 60;
          if (d.x < -0.05) d.x = 1.05; else if (d.x > 1.05) d.x = -0.05;
          if (d.y < -0.05) d.y = 1.05; else if (d.y > 1.05) d.y = -0.05;
          var a = 0.08 + 0.08 * Math.sin(t * d.sp + d.ph);
          var col = d.g ? GOLD : SAGE;
          ctx.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(d.x * w, d.y * h, d.r, 0, TAU);
          ctx.fill();
        }
      }
    };
  };

  /* --- horizontal radio-wave sine lines -------------------------------------- */
  M.radiowave = function () {
    var rows = [
      { y: 0.22, amp: 16, k: 0.007, sp: 0.00032, col: TEAL, a: 0.07 },
      { y: 0.40, amp: 22, k: 0.005, sp: -0.00022, col: SAGE, a: 0.08 },
      { y: 0.58, amp: 12, k: 0.009, sp: 0.00044, col: GOLD, a: 0.06 },
      { y: 0.76, amp: 18, k: 0.006, sp: -0.00028, col: TEAL, a: 0.07 }
    ];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 0.7;
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          ctx.strokeStyle = 'rgba(' + r.col + ',' + r.a + ')';
          ctx.beginPath();
          for (var x = 0; x <= w; x += 10) {
            var y = h * r.y + Math.sin(x * r.k + t * r.sp) * r.amp
                          + Math.sin(x * r.k * 0.4 + t * r.sp * 0.5) * r.amp * 0.35;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    };
  };

  /* --- warm aurora gradients on dark ----------------------------------------- */
  M.podaurora = function () {
    var blobs = [
      { c: '23,79,74', a: 0.16, r: 0.48, sx: 0.00008, sy: 0.00006, px: 0.20, py: 0.30 },
      { c: '184,138,69', a: 0.13, r: 0.40, sx: 0.00010, sy: 0.00007, px: 0.72, py: 0.62 },
      { c: '94,148,138', a: 0.15, r: 0.44, sx: 0.00006, sy: 0.00009, px: 0.48, py: 0.14 },
      { c: '184,138,69', a: 0.08, r: 0.30, sx: 0.00012, sy: 0.00006, px: 0.12, py: 0.78 }
    ];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < blobs.length; i++) {
          var b = blobs[i];
          var cx = w * (b.px + 0.14 * Math.sin(t * b.sx + i * 1.6));
          var cy = h * (b.py + 0.15 * Math.cos(t * b.sy + i * 1.0));
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
