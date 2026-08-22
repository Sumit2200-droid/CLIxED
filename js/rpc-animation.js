/**
 * Research, Policy & Communication — Knowledge Flow Animation
 * 
 * Multi-layer background: editorial grid → information paths → knowledge rings → document forms
 * Concept: Research → Evidence → Policy → Communication → Knowledge
 * 
 * Lightweight, accessible animation using vanilla JS
 * Respects prefers-reduced-motion
 */

(function () {
  'use strict';

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initRpcAnimation() {
    if (prefersReduced()) {
      document.querySelectorAll('.clx-rpc-node, .clx-rpc-ring, .clx-rpc-doc').forEach(function(el) {
        el.style.animation = 'none';
        el.style.opacity = '0.08';
      });
      return;
    }

    var rpcBg = document.querySelector('.clx-rpc-bg');
    if (!rpcBg) return;

    var layers = rpcBg.querySelectorAll('.clx-rpc-layer');
    var rings = rpcBg.querySelectorAll('.clx-rpc-ring');
    var docs = rpcBg.querySelectorAll('.clx-rpc-doc');
    var lastScrollY = 0;
    var ticking = false;

    // Parallax on scroll — different speed per layer
    function updateParallax() {
      var scrollY = window.scrollY;
      var windowHeight = window.innerHeight;
      var rect = rpcBg.getBoundingClientRect();

      if (rect.top < windowHeight && rect.bottom > 0) {
        var scrollPercent = scrollY / windowHeight;

        // Grid (slowest 0.006×), Paths (0.018×), Rings (0.025×), Docs (0.012×)
        var speeds = [0.006, 0.018, 0.025, 0.012];
        layers.forEach(function(layer, i) {
          var speed = speeds[i] || 0;
          var yOffset = scrollPercent * speed * 100;
          layer.style.transform = 'translateY(' + yOffset + 'px)';
        });
      }

      ticking = false;
    }

    function onScroll() {
      lastScrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    // Mouse interaction on desktop — rings and docs drift subtly
    function initMouseInteraction() {
      if (!window.matchMedia('(hover: hover)').matches) return;

      var mouseX = 0;
      var mouseY = 0;
      var targetX = 0;
      var targetY = 0;

      document.addEventListener('mousemove', function(e) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      function animateMouse() {
        targetX += (mouseX - targetX) * 0.012;
        targetY += (mouseY - targetY) * 0.012;

        // Rings drift with mouse
        rings.forEach(function(ring, i) {
          var depth = (i + 1) * 0.3;
          var x = targetX * depth * 4;
          var y = targetY * depth * 4;
          ring.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        });

        // Docs drift with mouse (slower)
        docs.forEach(function(doc, i) {
          var depth = (i + 1) * 0.2;
          var x = targetX * depth * 3;
          var y = targetY * depth * 3;
          doc.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        });

        requestAnimationFrame(animateMouse);
      }

      animateMouse();
    }

    // Intersection Observer — pause off-screen
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            rpcBg.classList.add('is-visible');
            window.addEventListener('scroll', onScroll, { passive: true });
          } else {
            rpcBg.classList.remove('is-visible');
            window.removeEventListener('scroll', onScroll);
          }
        });
      }, { threshold: 0.1 });

      observer.observe(rpcBg);
    } else {
      rpcBg.classList.add('is-visible');
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    initMouseInteraction();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRpcAnimation);
  } else {
    initRpcAnimation();
  }

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function() {
    if (prefersReduced()) {
      document.querySelectorAll('.clx-rpc-node, .clx-rpc-ring, .clx-rpc-doc').forEach(function(el) {
        el.style.animation = 'none';
        el.style.opacity = '0.08';
      });
    } else {
      location.reload();
    }
  });
})();
