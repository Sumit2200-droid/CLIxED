/* ==========================================================================
   CLIxED — Section background animation engine
   Scans .clx-bg[data-anim] canvases and drives them from a single rAF loop.

   Animation modes register themselves on window.CLXBg.modes (see
   home-sections.js / about-sections.js). Each mode is a factory that
   returns { draw(ctx, w, h, t, dt) }.

   Behaviour:
   - Offscreen canvases are skipped via IntersectionObserver
   - Loop pauses when the tab is hidden
   - prefers-reduced-motion: one static frame per canvas
   ========================================================================== */
(function () {
  'use strict';

  var CLXBg = window.CLXBg = window.CLXBg || {};
  CLXBg.modes = CLXBg.modes || {};

  CLXBg.TAU = Math.PI * 2;
  CLXBg.rand = function (min, max) { return min + Math.random() * (max - min); };

  /* Shared palette (rgb triplets) */
  CLXBg.TEAL = '23,79,74';    /* --color-primary */
  CLXBg.SAGE = '113,135,126'; /* --color-secondary */
  CLXBg.GOLD = '184,138,69';  /* --color-accent */

  CLXBg.init = function () {
    var canvases = document.querySelectorAll('.clx-bg[data-anim]');
    if (!canvases.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = [];

    function setup(canvas) {
      var mode = canvas.getAttribute('data-anim');
      var maker = CLXBg.modes[mode];
      if (!maker) return;

      var item = {
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        state: maker(),
        w: 0, h: 0,
        active: true
      };

      item.resize = function () {
        var rect = canvas.parentElement.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        item.w = Math.max(rect.width, 1);
        item.h = Math.max(rect.height, 1);
        canvas.width = Math.round(item.w * dpr);
        canvas.height = Math.round(item.h * dpr);
        item.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      item.resize();
      items.push(item);

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          item.active = entries[0].isIntersecting;
        }, { threshold: 0 }).observe(canvas);
      }
    }

    for (var i = 0; i < canvases.length; i++) setup(canvases[i]);

    var last = 0;

    function frame(t) {
      var dt = Math.min((t - last) / 1000, 0.05) || 0.016;
      last = t;
      for (var i = 0; i < items.length; i++) {
        if (!items[i].active) continue;
        items[i].state.draw(items[i].ctx, items[i].w, items[i].h, t, dt);
      }
      requestAnimationFrame(frame);
    }

    if (reduced) {
      for (var j = 0; j < items.length; j++) {
        items[j].state.draw(items[j].ctx, items[j].w, items[j].h, 0, 0);
      }
    } else {
      requestAnimationFrame(frame);

      document.addEventListener('visibilitychange', function () {
        last = performance.now();
      });

      var resizeTimer = null;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          for (var k = 0; k < items.length; k++) items[k].resize();
        }, 150);
      }, { passive: true });
    }
  };
})();
