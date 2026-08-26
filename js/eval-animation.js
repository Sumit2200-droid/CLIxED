/**
 * Programme Evaluation — Evidence Flow Animation
 * Question → Evidence → Analysis → Insight → Improvement
 * 
 * Lightweight, accessible animation using vanilla JS
 * Respects prefers-reduced-motion
 */

(function () {
  'use strict';

  // Check for reduced motion preference
  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Initialize evaluation animation
  function initEvalAnimation() {
    // Skip if user prefers reduced motion
    if (prefersReduced()) {
      document.querySelectorAll('.clx-eval-ring, .clx-eval-bar, .clx-eval-dot').forEach(function(el) {
        el.style.animation = 'none';
        el.style.opacity = '0.08';
      });
      return;
    }

    // Add scroll-based parallax effect
    var evalBg = document.querySelector('.clx-eval-bg');
    if (!evalBg) return;

    var layers = evalBg.querySelectorAll('.clx-eval-layer');
    var rings = evalBg.querySelectorAll('.clx-eval-ring');
    var lastScrollY = 0;
    var ticking = false;

    // Parallax on scroll
    function updateParallax() {
      var scrollY = window.scrollY;
      var windowHeight = window.innerHeight;
      
      // Only animate if in viewport
      if (evalBg.getBoundingClientRect().top < windowHeight && 
          evalBg.getBoundingClientRect().bottom > 0) {
        
        var scrollPercent = scrollY / windowHeight;
        
        // Different speeds for each layer
        layers.forEach(function(layer, index) {
          var speed = (index + 1) * 0.02;
          var yOffset = scrollPercent * speed * 100;
          layer.style.transform = 'translateY(' + yOffset + 'px)';
        });
      }
      
      ticking = false;
    }

    // Throttled scroll handler
    function onScroll() {
      lastScrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    // Add subtle mouse interaction on desktop
    function initMouseInteraction() {
      if (window.matchMedia('(hover: hover)').matches) {
        var mouseX = 0;
        var mouseY = 0;
        var targetX = 0;
        var targetY = 0;

        document.addEventListener('mousemove', function(e) {
          mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        function animateMouse() {
          // Smooth follow
          targetX += (mouseX - targetX) * 0.02;
          targetY += (mouseY - targetY) * 0.02;

          // Apply subtle movement to rings
          rings.forEach(function(ring, index) {
            var depth = (index + 1) * 0.5;
            var x = targetX * depth * 3;
            var y = targetY * depth * 3;
            ring.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
          });

          requestAnimationFrame(animateMouse);
        }

        animateMouse();
      }
    }

    // Intersection Observer for performance
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            evalBg.classList.add('is-visible');
            window.addEventListener('scroll', onScroll, { passive: true });
          } else {
            evalBg.classList.remove('is-visible');
            window.removeEventListener('scroll', onScroll);
          }
        });
      }, { threshold: 0.1 });

      observer.observe(evalBg);
    } else {
      // Fallback: always animate
      evalBg.classList.add('is-visible');
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Initialize mouse interaction
    initMouseInteraction();


  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvalAnimation);
  } else {
    initEvalAnimation();
  }

  // Listen for reduced motion changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function() {
    if (prefersReduced()) {
      document.querySelectorAll('.clx-eval-ring, .clx-eval-bar, .clx-eval-dot').forEach(function(el) {
        el.style.animation = 'none';
        el.style.opacity = '0.08';
      });
    } else {
      // Re-enable animations
      location.reload();
    }
  });
})();
