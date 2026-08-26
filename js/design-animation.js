/**
 * Design, Development & Design Evaluation — Design in Motion Animation
 * 
 * Multi-layer background: blueprint grid → design shapes → connection paths → stage labels
 * 
 * Lightweight, accessible animation using vanilla JS
 * Respects prefers-reduced-motion
 */

(function () {
  'use strict';

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initDesignAnimation() {
    if (prefersReduced()) {
      document.querySelectorAll('.clx-design-shape, .clx-design-stage, .clx-design-node').forEach(function(el) {
        el.style.animation = 'none';
        el.style.opacity = '0.08';
      });
      return;
    }

    var designBg = document.querySelector('.clx-design-bg');
    if (!designBg) return;

    var layers = designBg.querySelectorAll('.clx-design-layer');
    var shapes = designBg.querySelectorAll('.clx-design-shape');
    var lastScrollY = 0;
    var ticking = false;

    // Parallax on scroll — different speed per layer
    function updateParallax() {
      var scrollY = window.scrollY;
      var windowHeight = window.innerHeight;
      var rect = designBg.getBoundingClientRect();

      if (rect.top < windowHeight && rect.bottom > 0) {
        var scrollPercent = scrollY / windowHeight;

        // Shapes: slowest (0.01×), Connections: medium (0.015×), Stages: fastest (0×)
        var speeds = [0.025, 0.015, 0];
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

    // Mouse interaction on desktop — shapes drift subtly
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
        targetX += (mouseX - targetX) * 0.015;
        targetY += (mouseY - targetY) * 0.015;

        shapes.forEach(function(shape, i) {
          var depth = (i + 1) * 0.3;
          var x = targetX * depth * 4;
          var y = targetY * depth * 4;
          shape.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
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
            designBg.classList.add('is-visible');
            window.addEventListener('scroll', onScroll, { passive: true });
          } else {
            designBg.classList.remove('is-visible');
            window.removeEventListener('scroll', onScroll);
          }
        });
      }, { threshold: 0.1 });

      observer.observe(designBg);
    } else {
      designBg.classList.add('is-visible');
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    initMouseInteraction();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDesignAnimation);
  } else {
    initDesignAnimation();
  }

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function() {
    if (prefersReduced()) {
      document.querySelectorAll('.clx-design-shape, .clx-design-stage, .clx-design-node').forEach(function(el) {
        el.style.animation = 'none';
        el.style.opacity = '0.08';
      });
    } else {
      location.reload();
    }
  });
})();
