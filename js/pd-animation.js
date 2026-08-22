/**
 * Professional Development — Learning Growth Animation
 * 
 * Multi-layer background: rising lines → growth rings → seeds/particles → waves
 * Concept: Learning → Practice → Capability → Growth
 * 
 * Lightweight, accessible animation using vanilla JS
 * Respects prefers-reduced-motion
 */

(function () {
  'use strict';

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initPdAnimation() {
    if (prefersReduced()) {
      document.querySelectorAll('.clx-pd-seed, .clx-pd-particle, .clx-pd-ring, .clx-pd-wave').forEach(function(el) {
        el.style.animation = 'none';
        el.style.opacity = '0.08';
      });
      return;
    }

    var pdBg = document.querySelector('.clx-pd-bg');
    if (!pdBg) return;

    var layers = pdBg.querySelectorAll('.clx-pd-layer');
    var seeds = pdBg.querySelectorAll('.clx-pd-seed');
    var rings = pdBg.querySelectorAll('.clx-pd-ring');
    var lastScrollY = 0;
    var ticking = false;

    // Parallax on scroll — different speed per layer
    function updateParallax() {
      var scrollY = window.scrollY;
      var windowHeight = window.innerHeight;
      var rect = pdBg.getBoundingClientRect();

      if (rect.top < windowHeight && rect.bottom > 0) {
        var scrollPercent = scrollY / windowHeight;

        // Drift (slowest 0.008×), Rings (0.02×), Seeds (0.03×), Waves (0.015×)
        var speeds = [0.008, 0.02, 0.03, 0.015];
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

    // Mouse interaction on desktop — seeds and rings drift subtly
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

        // Seeds drift with mouse
        seeds.forEach(function(seed, i) {
          var depth = (i + 1) * 0.4;
          var x = targetX * depth * 5;
          var y = targetY * depth * 3;
          seed.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        });

        // Rings drift with mouse (slower)
        rings.forEach(function(ring, i) {
          var depth = (i + 1) * 0.25;
          var x = targetX * depth * 4;
          var y = targetY * depth * 4;
          ring.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
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
            pdBg.classList.add('is-visible');
            window.addEventListener('scroll', onScroll, { passive: true });
          } else {
            pdBg.classList.remove('is-visible');
            window.removeEventListener('scroll', onScroll);
          }
        });
      }, { threshold: 0.1 });

      observer.observe(pdBg);
    } else {
      pdBg.classList.add('is-visible');
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    initMouseInteraction();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPdAnimation);
  } else {
    initPdAnimation();
  }

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function() {
    if (prefersReduced()) {
      document.querySelectorAll('.clx-pd-seed, .clx-pd-particle, .clx-pd-ring, .clx-pd-wave').forEach(function(el) {
        el.style.animation = 'none';
        el.style.opacity = '0.08';
      });
    } else {
      location.reload();
    }
  });
})();
