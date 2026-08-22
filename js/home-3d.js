/**
 * home-3d.js — 3D effects for the Home page
 * Adds mouse-based tilt to 3D elements and enhanced card interactions.
 * Uses requestAnimationFrame for smooth, GPU-friendly transforms.
 */
(function () {
  'use strict';

  // Only run on Home page
  if (!document.body.classList.contains('clx-body--home')) return;

  // Respect reduced motion
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Check if mobile
  var isMobile = window.innerWidth <= 768;

  // Elements
  var hero = document.querySelector('.clx-hero');
  var layer3d = document.querySelector('.clx-3d-layer');
  var elements3d = document.querySelectorAll('.clx-3d-el');
  var serviceCards = document.querySelectorAll('.clx-service-card');
  var diffCards = document.querySelectorAll('.clx-diff-card');

  if (!hero || !layer3d) return;

  // Mouse tracking
  var mouseX = 0;
  var mouseY = 0;
  var targetMouseX = 0;
  var targetMouseY = 0;

  // Easing
  var ease = 0.08;

  // 3D tilt intensity per depth level
  var tiltIntensity = isMobile
    ? { bg: 1, mid: 2, fg: 3 }
    : { bg: 3, mid: 5, fg: 8 };

  function onMouseMove(e) {
    if (isMobile) return;
    // Normalize to -1 to 1
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function animate() {
    // Smooth mouse interpolation
    mouseX += (targetMouseX - mouseX) * ease;
    mouseY += (targetMouseY - mouseY) * ease;

    // Apply tilt to 3D elements based on their depth
    elements3d.forEach(function(el) {
      var depth = parseFloat(el.getAttribute('data-3d-depth')) || 0.5;
      var tiltX = mouseY * tiltIntensity.fg * depth;
      var tiltY = mouseX * tiltIntensity.fg * depth;

      // Get current transform from CSS animation and add tilt
      var currentTransform = window.getComputedStyle(el).transform;
      el.style.setProperty('--mouse-tilt-x', tiltX.toFixed(2) + 'deg');
      el.style.setProperty('--mouse-tilt-y', tiltY.toFixed(2) + 'deg');
    });

    requestAnimationFrame(animate);
  }

  // Card 3D hover effect
  function setupCardHover(cards) {
    cards.forEach(function(card) {
      card.addEventListener('mouseenter', function() {
        if (isMobile) return;
        card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
      });

      card.addEventListener('mousemove', function(e) {
        if (isMobile) return;

        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;

        // Calculate rotation (max ±4 degrees)
        var rotateY = ((x - centerX) / centerX) * 4;
        var rotateX = ((centerY - y) / centerY) * 4;

        card.style.transform = 'perspective(800px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translateZ(10px)';
      });

      card.addEventListener('mouseleave', function() {
        if (isMobile) return;
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      });
    });
  }

  // Initialize
  setupCardHover(serviceCards);
  setupCardHover(diffCards);

  // Mouse interaction (desktop only)
  if (!isMobile && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
  }

  // Start animation loop
  requestAnimationFrame(animate);

  // Handle resize
  window.addEventListener('resize', function() {
    isMobile = window.innerWidth <= 768;
    tiltIntensity = isMobile
      ? { bg: 1, mid: 2, fg: 3 }
      : { bg: 3, mid: 5, fg: 8 };
  }, { passive: true });

  // Cleanup
  window.addEventListener('beforeunload', function() {
    window.removeEventListener('mousemove', onMouseMove);
  });
})();
