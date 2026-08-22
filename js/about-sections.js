/* ==========================================================================
   CLIxED — About section background animations
   Modes (all unique to the About page — none repeat the homepage set):
     flowfield  — particles drifting on a flow field with comet trails (Hero)
     weave      — vertical threads gently swaying                      (Who We Are)
     lineage    — heritage line with milestones and travelling pulses  (Our Background)
     scan       — slow vertical scan band with ruler ticks             (Our Strengths)
     survey     — twinkling cartography "+" marks                      (Fieldwork band)
     fireflies  — glowing wanderers on dark                            (What Drives Us)
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

  /* --- flow field with comet trails (hero) ------------------------------ */
  M.flowfield = function () {
    var P = [];
    var COUNT = 64;
    var TRAIL = 9;
    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        if (!P.length) {
          for (var n = 0; n < COUNT; n++) {
            P.push({ x: rand(0, w), y: rand(0, h), trail: [], g: Math.random() < 0.16 });
          }
        }
        ctx.lineWidth = 1;
        for (var i = 0; i < P.length; i++) {
          var p = P[i];
          var a = Math.sin(p.x * 0.0016 + t * 0.00012) * 1.8
                + Math.cos(p.y * 0.0013 - t * 0.00009) * 1.8;
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > TRAIL) p.trail.shift();
          p.x += Math.cos(a) * 26 * dt;
          p.y += Math.sin(a) * 26 * dt;
          if (p.x < -14 || p.x > w + 14 || p.y < -14 || p.y > h + 14) {
            p.x = rand(0, w); p.y = rand(0, h); p.trail.length = 0;
          }
          if (p.trail.length < 2) continue;
          ctx.strokeStyle = 'rgba(' + (p.g ? GOLD : SAGE) + ',' + (p.g ? 0.18 : 0.11) + ')';
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (var j = 1; j < p.trail.length; j++) {
            ctx.lineTo(p.trail[j].x, p.trail[j].y);
          }
          ctx.stroke();
        }
      }
    };
  };

  /* --- vertical swaying threads ------------------------------------------ */
  M.weave = function () {
    var COLS = 26;
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;
        for (var i = 0; i < COLS; i++) {
          var bx = ((i + 0.5) / COLS) * w;
          var amp = 6 + 5 * Math.sin(i * 1.3);
          var gold = i % 7 === 0;
          ctx.strokeStyle = 'rgba(' + (gold ? GOLD : TEAL) + ',' + (gold ? 0.10 : 0.06) + ')';
          ctx.beginPath();
          for (var y = 0; y <= h; y += 14) {
            var x = bx + Math.sin(y * 0.008 + t * 0.0004 + i * 0.7) * amp;
            if (y === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    };
  };

  /* --- heritage line with travelling pulses -------------------------------- */
  M.lineage = function () {
    var NODES = [0.08, 0.36, 0.64, 0.92];
    var pulses = [{ p: 0 }, { p: 0.34 }, { p: 0.67 }];
    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        var y = h * 0.5;
        var x0 = w * 0.03, x1 = w * 0.97;

        /* ruler ticks along the baseline */
        ctx.strokeStyle = 'rgba(' + TEAL + ',0.08)';
        ctx.lineWidth = 1;
        for (var tx = x0; tx <= x1; tx += 34) {
          ctx.beginPath();
          ctx.moveTo(tx + 0.5, y - 4);
          ctx.lineTo(tx + 0.5, y + 4);
          ctx.stroke();
        }

        /* baseline */
        ctx.strokeStyle = 'rgba(' + TEAL + ',0.15)';
        ctx.beginPath();
        ctx.moveTo(x0, y + 0.5);
        ctx.lineTo(x1, y + 0.5);
        ctx.stroke();

        /* milestone nodes */
        for (var i = 0; i < NODES.length; i++) {
          var nx = NODES[i] * w;
          ctx.fillStyle = 'rgba(' + GOLD + ',0.16)';
          ctx.beginPath(); ctx.arc(nx, y, 8, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(' + GOLD + ',0.85)';
          ctx.beginPath(); ctx.arc(nx, y, 3, 0, TAU); ctx.fill();
        }

        /* travelling pulses */
        for (var j = 0; j < pulses.length; j++) {
          var pl = pulses[j];
          pl.p += dt * 0.05;
          if (pl.p > 1) pl.p -= 1;
          var px = x0 + pl.p * (x1 - x0);
          ctx.strokeStyle = 'rgba(' + GOLD + ',0.28)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(px - 44, y + 0.5);
          ctx.lineTo(px, y + 0.5);
          ctx.stroke();
          ctx.fillStyle = 'rgba(' + GOLD + ',0.9)';
          ctx.beginPath(); ctx.arc(px, y, 2.4, 0, TAU); ctx.fill();
        }
      }
    };
  };

  /* --- slow vertical scan band ----------------------------------------------- */
  M.scan = function () {
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);

        /* side ruler ticks */
        ctx.strokeStyle = 'rgba(' + TEAL + ',0.09)';
        ctx.lineWidth = 1;
        for (var yy = 24; yy < h; yy += 48) {
          ctx.beginPath(); ctx.moveTo(0, yy + 0.5); ctx.lineTo(9, yy + 0.5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(w - 9, yy + 0.5); ctx.lineTo(w, yy + 0.5); ctx.stroke();
        }

        /* sweeping band */
        var period = 9000;
        var p = (t % period) / period;
        var cy = -160 + p * (h + 320);
        var g = ctx.createLinearGradient(0, cy - 160, 0, cy + 160);
        g.addColorStop(0, 'rgba(' + TEAL + ',0)');
        g.addColorStop(0.5, 'rgba(' + TEAL + ',0.055)');
        g.addColorStop(1, 'rgba(' + TEAL + ',0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, cy - 160, w, 320);

        /* leading hairline */
        ctx.strokeStyle = 'rgba(' + GOLD + ',0.12)';
        ctx.beginPath();
        ctx.moveTo(0, cy + 0.5);
        ctx.lineTo(w, cy + 0.5);
        ctx.stroke();
      }
    };
  };

  /* --- twinkling survey crosses ------------------------------------------------ */
  M.survey = function () {
    var pts = [];
    var built = false;
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        if (!built) {
          built = true;
          var COLS = 10, ROWS = 6;
          for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
              pts.push({
                x: ((c + 0.5) / COLS) * w + rand(-14, 14),
                y: ((r + 0.5) / ROWS) * h + rand(-10, 10),
                ph: rand(0, TAU), sp: rand(0.0006, 0.0013),
                s: rand(3, 5), g: Math.random() < 0.2
              });
            }
          }
        }
        ctx.lineWidth = 1;
        for (var i = 0; i < pts.length; i++) {
          var pt = pts[i];
          var tw = 0.5 + 0.5 * Math.sin(t * pt.sp + pt.ph);
          var a = 0.04 + tw * 0.13;
          ctx.strokeStyle = 'rgba(' + (pt.g ? GOLD : SAGE) + ',' + a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(pt.x - pt.s, pt.y + 0.5); ctx.lineTo(pt.x + pt.s, pt.y + 0.5);
          ctx.moveTo(pt.x + 0.5, pt.y - pt.s); ctx.lineTo(pt.x + 0.5, pt.y + pt.s);
          ctx.stroke();
        }
      }
    };
  };

  /* --- glowing wanderers on dark -------------------------------------------------- */
  M.fireflies = function () {
    var F = [];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        if (!F.length) {
          for (var n = 0; n < 16; n++) {
            F.push({
              sx: rand(0.0002, 0.0005), sy: rand(0.0002, 0.0005),
              ph: rand(0, TAU), ph2: rand(0, TAU),
              r: rand(1.2, 2.4), teal: Math.random() < 0.25
            });
          }
        }
        for (var i = 0; i < F.length; i++) {
          var f = F[i];
          var x = w * (0.5 + 0.42 * Math.sin(t * f.sx + f.ph));
          var y = h * (0.5 + 0.40 * Math.sin(t * f.sy + f.ph2));
          var glow = 0.45 + 0.55 * Math.sin(t * 0.0011 + f.ph);
          var col = f.teal ? '94,148,138' : '184,138,69';
          var rad = f.r * 6;
          var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
          g.addColorStop(0, 'rgba(' + col + ',' + (0.22 * glow).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(' + col + ',0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
          ctx.fillStyle = 'rgba(245,230,200,' + (0.85 * glow).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(x, y, f.r, 0, TAU); ctx.fill();
        }
      }
    };
  };

  window.CLXBg.init();
})();
