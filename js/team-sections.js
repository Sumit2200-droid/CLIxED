  /* ==========================================================================
     CLIxED — Team section background animations
     Modes (all unique to the Team page — none repeat home/about sets):
       meridian   — wireframe globe with orbiting marker        (Hero)
       pillars    — soft vertical light columns                 (Layer 1)
       orgtree    — org-chart connectors with travelling pulses (Layer 2)
       brackets   — drifting portrait-frame corner marks        (Layer 3)
       beams      — sweeping light beams on dark                (Contact CTA)
       constellation — connected star-dots forming a network    (Hero extra)
       lattice    — shifting diamond grid                       (Layer 2 extra)
       nebula     — soft drifting colour clouds                 (Layer 1 extra)
       trajectory — curved arcs with travelling dots            (Layer 3 extra)
       pulsefield — concentric pulse waves from fixed centres   (CTA extra)
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

  /* --- wireframe globe (hero) -------------------------------------------- */
  M.meridian = function () {
    var LATS = [-0.66, -0.33, 0, 0.33, 0.66];
    var LONGS = [0.25, 0.55, 0.85, 1];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        var cx = w * 0.80, cy = h * 0.52;
        var R = Math.min(w * 0.34, h * 0.72) * (1 + 0.008 * Math.sin(t * 0.0005));
        ctx.lineWidth = 1;

        /* longitudes */
        for (var i = 0; i < LONGS.length; i++) {
          ctx.strokeStyle = 'rgba(' + TEAL + ',' + (LONGS[i] === 1 ? 0.14 : 0.08) + ')';
          ctx.beginPath();
          ctx.ellipse(cx, cy, R * LONGS[i], R, 0, 0, TAU);
          ctx.stroke();
        }

        /* latitudes as chords */
        for (var j = 0; j < LATS.length; j++) {
          var s = LATS[j];
          var y = cy + R * s;
          var hw = R * Math.sqrt(1 - s * s);
          ctx.strokeStyle = 'rgba(' + TEAL + ',0.08)';
          ctx.beginPath();
          ctx.moveTo(cx - hw, y);
          ctx.lineTo(cx + hw, y);
          ctx.stroke();
        }

        /* orbiting marker on the rim */
        var a = t * 0.00022;
        var ex = cx + Math.cos(a) * R;
        var ey = cy + Math.sin(a) * R;
        ctx.strokeStyle = 'rgba(' + GOLD + ',0.30)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, R, a - 0.5, a);
        ctx.stroke();
        ctx.fillStyle = 'rgba(' + GOLD + ',0.85)';
        ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0, TAU); ctx.fill();

        /* pole marker */
        ctx.fillStyle = 'rgba(' + SAGE + ',0.5)';
        ctx.beginPath(); ctx.arc(cx, cy - R, 2, 0, TAU); ctx.fill();
      }
    };
  };

  /* --- soft vertical light columns ------------------------------------------ */
  M.pillars = function () {
    var cols = [];
    for (var i = 0; i < 7; i++) {
      cols.push({
        px: (i + 0.5) / 7 + rand(-0.03, 0.03),
        ph: rand(0, TAU), sp: rand(0.0004, 0.0009),
        wd: rand(46, 100), g: i % 3 === 0
      });
    }
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        var rad = h * 0.75;
        for (var i = 0; i < cols.length; i++) {
          var c = cols[i];
          var a = 0.05 + 0.05 * Math.sin(t * c.sp + c.ph);
          if (a <= 0.004) continue;
          var x = c.px * w;
          var col = c.g ? GOLD : TEAL;
          ctx.save();
          ctx.translate(x, h * 0.5);
          ctx.scale(c.wd / rad, 1);
          var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
          g.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')');
          g.addColorStop(1, 'rgba(' + col + ',0)');
          ctx.fillStyle = g;
          ctx.fillRect(-rad, -rad, rad * 2, rad * 2);
          ctx.restore();
        }
      }
    };
  };

  /* --- org-chart connectors with travelling pulses ----------------------------- */
  M.orgtree = function () {
    var L2 = [0.22, 0.50, 0.78];
    var L3 = [0.12, 0.32, 0.50, 0.68, 0.88];
    var EDGES = [
      { from: 'r', to: 0 }, { from: 'r', to: 1 }, { from: 'r', to: 2 },
      { from: 0, to: 0 }, { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 }, { from: 2, to: 4 }
    ];
    var pulses = [];
    var acc = 400;
    var last = 0;

    function nodePos(key, w, h) {
      if (key === 'r') return { x: w * 0.5, y: h * 0.10 };
      if (typeof key === 'number' && key < 3 && w) return { x: w * L2[key], y: h * 0.44 };
      return { x: w * L3[key], y: h * 0.82 };
    }

    function pointOnEdge(e, p, w, h) {
      var a = nodePos(e.from, w, h);
      var b = nodePos(typeof e.to === 'number' && e.to < 3 ? e.to : e.to, w, h);
      var midY = (a.y + b.y) / 2;
      if (p < 0.34) return { x: a.x, y: a.y + (midY - a.y) * (p / 0.34) };
      if (p < 0.67) {
        var q = (p - 0.34) / 0.33;
        return { x: a.x + (b.x - a.x) * q, y: midY };
      }
      var q2 = (p - 0.67) / 0.33;
      return { x: b.x, y: midY + (b.y - midY) * q2 };
    }

    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;

        /* elbow connectors */
        ctx.strokeStyle = 'rgba(' + TEAL + ',0.09)';
        for (var i = 0; i < EDGES.length; i++) {
          var e = EDGES[i];
          var a = nodePos(e.from, w, h);
          var b = nodePos(e.to, w, h);
          var midY = (a.y + b.y) / 2;
          ctx.beginPath();
          ctx.moveTo(a.x + 0.5, a.y);
          ctx.lineTo(a.x + 0.5, midY + 0.5);
          ctx.lineTo(b.x + 0.5, midY + 0.5);
          ctx.lineTo(b.x + 0.5, b.y);
          ctx.stroke();
        }

        /* nodes */
        var root = nodePos('r', w, h);
        ctx.fillStyle = 'rgba(' + GOLD + ',0.75)';
        ctx.beginPath(); ctx.arc(root.x, root.y, 3, 0, TAU); ctx.fill();
        for (var j = 0; j < L2.length; j++) {
          var n2 = nodePos(j, w, h);
          ctx.fillStyle = 'rgba(' + TEAL + ',0.35)';
          ctx.fillRect(n2.x - 2.5, n2.y - 2.5, 5, 5);
        }
        for (var k = 0; k < L3.length; k++) {
          var n3 = nodePos(k, w, h);
          ctx.fillStyle = 'rgba(' + SAGE + ',0.30)';
          ctx.beginPath(); ctx.arc(n3.x, n3.y, 2, 0, TAU); ctx.fill();
        }

        /* spawn + move pulses */
        acc += t - last; last = t;
        if (acc > 950) {
          acc = 0;
          pulses.push({ e: EDGES[Math.floor(Math.random() * EDGES.length)], p: 0 });
          if (pulses.length > 5) pulses.shift();
        }
        for (var m = pulses.length - 1; m >= 0; m--) {
          var pl = pulses[m];
          pl.p += dt * 0.45;
          if (pl.p >= 1) { pulses.splice(m, 1); continue; }
          var pt = pointOnEdge(pl.e, pl.p, w, h);
          var fadeA = Math.sin(pl.p * Math.PI);
          ctx.strokeStyle = 'rgba(' + GOLD + ',' + (0.35 * fadeA).toFixed(3) + ')';
          ctx.lineWidth = 1.4;
          var tail = pointOnEdge(pl.e, Math.max(pl.p - 0.12, 0), w, h);
          ctx.beginPath();
          ctx.moveTo(tail.x, tail.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
          ctx.fillStyle = 'rgba(' + GOLD + ',' + (0.8 * fadeA).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, TAU); ctx.fill();
        }
      }
    };
  };

  /* --- drifting portrait-frame corner brackets ------------------------------------ */
  M.brackets = function () {
    var marks = [];
    for (var i = 0; i < 10; i++) {
      marks.push({
        x: Math.random(), y: rand(0.12, 0.88),
        s: rand(10, 20),
        ph: rand(0, TAU), sp: rand(0.0005, 0.001),
        rot: rand(-0.18, 0.18), g: i % 4 === 0
      });
    }
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1.2;
        for (var i = 0; i < marks.length; i++) {
          var mk = marks[i];
          var a = 0.05 + 0.11 * (0.5 + 0.5 * Math.sin(t * mk.sp + mk.ph));
          var L = mk.s;
          ctx.save();
          ctx.translate(mk.x * w, mk.y * h);
          ctx.rotate(mk.rot);
          ctx.strokeStyle = 'rgba(' + (mk.g ? GOLD : TEAL) + ',' + a.toFixed(3) + ')';
          /* four corner brackets of an invisible frame */
          ctx.beginPath();
          ctx.moveTo(-L, -L + L * 0.6); ctx.lineTo(-L, -L); ctx.lineTo(-L + L * 0.6, -L);
          ctx.moveTo(L - L * 0.6, -L); ctx.lineTo(L, -L); ctx.lineTo(L, -L + L * 0.6);
          ctx.moveTo(L, L - L * 0.6); ctx.lineTo(L, L); ctx.lineTo(L - L * 0.6, L);
          ctx.moveTo(-L + L * 0.6, L); ctx.lineTo(-L, L); ctx.lineTo(-L, L - L * 0.6);
          ctx.stroke();
          ctx.restore();
        }
      }
    };
  };

  /* --- sweeping light beams on dark -------------------------------------------------- */
  M.beams = function () {
    var beams = [
      { ang: -0.55, sp: 0.00006, wd: 90, col: '46,93,168', a: 0.13 },
      { ang: 0.30, sp: -0.00004, wd: 140, col: '184,138,69', a: 0.09 },
      { ang: 0.95, sp: 0.00005, wd: 70, col: '94,148,138', a: 0.11 }
    ];
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        var ox = w * 0.5, oy = -h * 0.15;
        var len = h * 1.7;
        for (var i = 0; i < beams.length; i++) {
          var b = beams[i];
          var ang = b.ang + Math.sin(t * b.sp) * 0.22;
          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(ang);
          var g = ctx.createLinearGradient(0, 0, 0, len);
          g.addColorStop(0, 'rgba(' + b.col + ',' + b.a + ')');
          g.addColorStop(1, 'rgba(' + b.col + ',0)');
          ctx.fillStyle = g;
          ctx.fillRect(-b.wd / 2, 0, b.wd, len);
          ctx.restore();
        }
      }
    };
  };

  /* ==========================================================================
     NEW MODES — additional background layers
     ========================================================================== */

  /* --- connected star-dots forming a constellation network -------------------- */
  M.constellation = function () {
    var pts = [];
    for (var i = 0; i < 28; i++) {
      pts.push({
        x: Math.random(), y: Math.random(),
        vx: rand(-0.00008, 0.00008), vy: rand(-0.00006, 0.00006),
        r: rand(1.2, 2.8), g: i % 5 === 0
      });
    }
    var LINK_DIST = 0.22;
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < -0.05) p.x = 1.05; if (p.x > 1.05) p.x = -0.05;
          if (p.y < -0.05) p.y = 1.05; if (p.y > 1.05) p.y = -0.05;
        }
        ctx.lineWidth = 0.6;
        for (var a = 0; a < pts.length; a++) {
          for (var b = a + 1; b < pts.length; b++) {
            var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < LINK_DIST) {
              var la = 0.06 * (1 - d / LINK_DIST);
              ctx.strokeStyle = 'rgba(' + TEAL + ',' + la.toFixed(4) + ')';
              ctx.beginPath();
              ctx.moveTo(pts[a].x * w, pts[a].y * h);
              ctx.lineTo(pts[b].x * w, pts[b].y * h);
              ctx.stroke();
            }
          }
        }
        for (var k = 0; k < pts.length; k++) {
          var pt = pts[k];
          var pa = 0.12 + 0.10 * Math.sin(t * 0.0006 + k * 0.7);
          ctx.fillStyle = 'rgba(' + (pt.g ? GOLD : SAGE) + ',' + pa.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(pt.x * w, pt.y * h, pt.r, 0, TAU); ctx.fill();
        }
      }
    };
  };

  /* --- shifting diamond / lattice grid ---------------------------------------- */
  M.lattice = function () {
    var CELL = 48;
    var drift = rand(0, TAU);
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        var ox = (t * 0.008 + drift) % CELL;
        var cols = Math.ceil(w / CELL) + 2;
        var rows = Math.ceil(h / CELL) + 2;
        ctx.lineWidth = 0.5;
        for (var r = -1; r < rows; r++) {
          for (var c = -1; c < cols; c++) {
            var cx = c * CELL + ox + (r % 2 ? CELL / 2 : 0);
            var cy = r * CELL;
            var pulse = 0.04 + 0.035 * Math.sin(t * 0.0005 + (c + r) * 0.6);
            var isGold = (c + r) % 7 === 0;
            ctx.strokeStyle = 'rgba(' + (isGold ? GOLD : TEAL) + ',' + pulse.toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(cx, cy - CELL / 2);
            ctx.lineTo(cx + CELL / 2, cy);
            ctx.lineTo(cx, cy + CELL / 2);
            ctx.lineTo(cx - CELL / 2, cy);
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
    };
  };

  /* --- soft drifting colour clouds (nebula) ----------------------------------- */
  M.nebula = function () {
    var blobs = [];
    for (var i = 0; i < 5; i++) {
      blobs.push({
        x: rand(0.15, 0.85), y: rand(0.15, 0.85),
        r: rand(120, 260),
        dx: rand(-0.00003, 0.00003), dy: rand(-0.00002, 0.00002),
        col: i % 3 === 0 ? GOLD : (i % 3 === 1 ? TEAL : SAGE),
        a: rand(0.04, 0.08)
      });
    }
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < blobs.length; i++) {
          var b = blobs[i];
          b.x += b.dx; b.y += b.dy;
          if (b.x < -0.1) b.x = 1.1; if (b.x > 1.1) b.x = -0.1;
          if (b.y < -0.1) b.y = 1.1; if (b.y > 1.1) b.y = -0.1;
          var a = b.a + 0.02 * Math.sin(t * 0.0003 + i * 1.3);
          var g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r);
          g.addColorStop(0, 'rgba(' + b.col + ',' + a.toFixed(3) + ')');
          g.addColorStop(1, 'rgba(' + b.col + ',0)');
          ctx.fillStyle = g;
          ctx.fillRect(b.x * w - b.r, b.y * h - b.r, b.r * 2, b.r * 2);
        }
      }
    };
  };

  /* --- curved arcs with travelling dots (career trajectories) ------------------ */
  M.trajectory = function () {
    var arcs = [];
    for (var i = 0; i < 6; i++) {
      arcs.push({
        sx: rand(0.05, 0.35), sy: rand(0.6, 0.95),
        ex: rand(0.65, 0.95), ey: rand(0.05, 0.4),
        cp1x: rand(0.2, 0.5), cp1y: rand(0.1, 0.4),
        col: i % 2 === 0 ? GOLD : TEAL,
        dot: 0, sp: rand(0.00025, 0.0005),
        g: i % 3 === 0
      });
    }
    return {
      draw: function (ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < arcs.length; i++) {
          var ar = arcs[i];
          var sx = ar.sx * w, sy = ar.sy * h;
          var ex = ar.ex * w, ey = ar.ey * h;
          var cpx = ar.cp1x * w, cpy = ar.cp1y * h;
          ctx.strokeStyle = 'rgba(' + ar.col + ',0.07)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(cpx, cpy, ex, ey);
          ctx.stroke();
          ar.dot += ar.sp;
          if (ar.dot >= 1) ar.dot = 0;
          var p = ar.dot;
          var dx = (1 - p) * (1 - p) * sx + 2 * (1 - p) * p * cpx + p * p * ex;
          var dy = (1 - p) * (1 - p) * sy + 2 * (1 - p) * p * cpy + p * p * ey;
          var fade = Math.sin(p * Math.PI);
          ctx.fillStyle = 'rgba(' + ar.col + ',' + (0.6 * fade).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(dx, dy, ar.g ? 2.5 : 1.8, 0, TAU); ctx.fill();
          var tail = Math.max(p - 0.06, 0);
          var tx = (1 - tail) * (1 - tail) * sx + 2 * (1 - tail) * tail * cpx + tail * tail * ex;
          var ty = (1 - tail) * (1 - tail) * sy + 2 * (1 - tail) * tail * cpy + tail * tail * ey;
          ctx.strokeStyle = 'rgba(' + ar.col + ',' + (0.25 * fade).toFixed(3) + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(dx, dy); ctx.stroke();
        }
      }
    };
  };

  /* --- concentric pulse waves from fixed centres ------------------------------- */
  M.pulsefield = function () {
    var centres = [
      { x: 0.20, y: 0.30 }, { x: 0.75, y: 0.55 },
      { x: 0.50, y: 0.80 }, { x: 0.88, y: 0.20 }
    ];
    var waves = [];
    var acc = 0;
    return {
      draw: function (ctx, w, h, t, dt) {
        ctx.clearRect(0, 0, w, h);
        acc += dt * 1000;
        if (acc > 1800) {
          acc = 0;
          var ci = centres[Math.floor(Math.random() * centres.length)];
          waves.push({ cx: ci.x, cy: ci.y, age: 0 });
          if (waves.length > 10) waves.shift();
        }
        for (var i = waves.length - 1; i >= 0; i--) {
          var wv = waves[i];
          wv.age += dt * 1000;
          if (wv.age > 5000) { waves.splice(i, 1); continue; }
          var progress = wv.age / 5000;
          var radius = progress * Math.max(w, h) * 0.6;
          var alpha = 0.10 * (1 - progress);
          var isGold = i % 3 === 0;
          ctx.strokeStyle = 'rgba(' + (isGold ? GOLD : TEAL) + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(wv.cx * w, wv.cy * h, radius, 0, TAU);
          ctx.stroke();
        }
      }
    };
  };

  window.CLXBg.init();
})();
