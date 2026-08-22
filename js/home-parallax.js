/**
 * home-parallax.js — Strong multi-layer parallax for Home page testing
 * Intentionally dramatic values for visual evaluation.
 * Uses requestAnimationFrame for smooth, GPU-friendly transforms.
 */
(function () {
  'use strict';

  // Only run on Home page
  if (!document.body.classList.contains('clx-body--home')) return;

  // Respect reduced motion
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Elements
  var hero = document.querySelector('.clx-hero');
  if (!hero) return;

  var deepBgLayer = document.querySelector('.clx-parallax-layer--deep-bg');
  var bgLayer = document.querySelector('.clx-parallax-layer--bg');
  var midLayer = document.querySelector('.clx-parallax-layer--mid');
  var fgLayer = document.querySelector('.clx-parallax-layer--fg');
  var heroContent = document.querySelector('.clx-hero > .clx-container');

  // Check if mobile
  var isMobile = window.innerWidth <= 768;

  // Scroll parallax speeds (max pixels of movement) — STRONG for testing
  var scrollSpeeds = isMobile
    ? { deepBg: 20, bg: 30, mid: 50, fg: 80, content: 5 }
    : { deepBg: 100, bg: 150, mid: 200, fg: 300, content: 10 };

  // Mouse parallax speeds (pixels of movement on desktop only) — STRONG for testing
  var mouseSpeeds = isMobile
    ? { deepBg: 0, bg: 0, mid: 0, fg: 0, content: 0 }
    : { deepBg: 10, bg: 18, mid: 30, fg: 50, content: 5 };

  // Current values
  var mouseX = 0;
  var mouseY = 0;
  var currentDeepBgX = 0, currentDeepBgY = 0;
  var currentBgX = 0, currentBgY = 0;
  var currentMidX = 0, currentMidY = 0;
  var currentFgX = 0, currentFgY = 0;
  var currentContentX = 0, currentContentY = 0;
  var targetDeepBgX = 0, targetDeepBgY = 0;
  var targetBgX = 0, targetBgY = 0;
  var targetMidX = 0, targetMidY = 0;
  var targetFgX = 0, targetFgY = 0;
  var targetContentX = 0, targetContentY = 0;

  // Easing factor
  var ease = 0.1;

  function onScroll() {
    // Scroll is handled in animate() via getBoundingClientRect
  }

  function onMouseMove(e) {
    // Normalize mouse position to -1 to 1
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function animate() {
    // Get hero's current position relative to viewport
    var heroRect = hero.getBoundingClientRect();
    var heroTop = heroRect.top;
    var heroHeight = heroRect.height;

    // Calculate scroll progress (0 = hero top at viewport top, 1 = hero bottom at viewport top)
    var scrollProgress = -heroTop / heroHeight;
    scrollProgress = Math.max(0, Math.min(1.5, scrollProgress)); // Allow some overshoot

    // Scroll-based targets — each layer moves at different speed
    targetDeepBgX = 0;
    targetDeepBgY = scrollProgress * scrollSpeeds.deepBg;

    targetBgX = 0;
    targetBgY = scrollProgress * scrollSpeeds.bg;

    targetMidX = 0;
    targetMidY = scrollProgress * scrollSpeeds.mid;

    targetFgX = 0;
    targetFgY = scrollProgress * scrollSpeeds.fg;

    targetContentX = 0;
    targetContentY = scrollProgress * scrollSpeeds.content;

    // Add mouse influence (desktop only)
    if (mouseSpeeds.deepBg > 0) {
      targetDeepBgX += mouseX * mouseSpeeds.deepBg;
      targetDeepBgY += mouseY * mouseSpeeds.deepBg;

      targetBgX += mouseX * mouseSpeeds.bg;
      targetBgY += mouseY * mouseSpeeds.bg;

      targetMidX += mouseX * mouseSpeeds.mid;
      targetMidY += mouseY * mouseSpeeds.mid;

      targetFgX += mouseX * mouseSpeeds.fg;
      targetFgY += mouseY * mouseSpeeds.fg;

      targetContentX += mouseX * mouseSpeeds.content;
      targetContentY += mouseY * mouseSpeeds.content;
    }

    // Smooth interpolation (lerp)
    currentDeepBgX += (targetDeepBgX - currentDeepBgX) * ease;
    currentDeepBgY += (targetDeepBgY - currentDeepBgY) * ease;

    currentBgX += (targetBgX - currentBgX) * ease;
    currentBgY += (targetBgY - currentBgY) * ease;

    currentMidX += (targetMidX - currentMidX) * ease;
    currentMidY += (targetMidY - currentMidY) * ease;

    currentFgX += (targetFgX - currentFgX) * ease;
    currentFgY += (targetFgY - currentFgY) * ease;

    currentContentX += (targetContentX - currentContentX) * ease;
    currentContentY += (targetContentY - currentContentY) * ease;

    // Apply transforms using translate3d for GPU acceleration
    if (deepBgLayer) {
      deepBgLayer.style.transform = 'translate3d(' + currentDeepBgX.toFixed(1) + 'px, ' + currentDeepBgY.toFixed(1) + 'px, 0)';
    }

    if (bgLayer) {
      bgLayer.style.transform = 'translate3d(' + currentBgX.toFixed(1) + 'px, ' + currentBgY.toFixed(1) + 'px, 0)';
    }

    if (midLayer) {
      midLayer.style.transform = 'translate3d(' + currentMidX.toFixed(1) + 'px, ' + currentMidY.toFixed(1) + 'px, 0)';
    }

    if (fgLayer) {
      fgLayer.style.transform = 'translate3d(' + currentFgX.toFixed(1) + 'px, ' + currentFgY.toFixed(1) + 'px, 0)';
    }

    if (heroContent) {
      heroContent.style.transform = 'translate3d(' + currentContentX.toFixed(1) + 'px, ' + currentContentY.toFixed(1) + 'px, 0)';
    }

    requestAnimationFrame(animate);
  }

  // Use passive listeners for better scroll performance
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    isMobile = window.innerWidth <= 768;
    scrollSpeeds = isMobile
      ? { deepBg: 20, bg: 30, mid: 50, fg: 80, content: 5 }
      : { deepBg: 100, bg: 150, mid: 200, fg: 300, content: 10 };
    mouseSpeeds = isMobile
      ? { deepBg: 0, bg: 0, mid: 0, fg: 0, content: 0 }
      : { deepBg: 10, bg: 18, mid: 30, fg: 50, content: 5 };
  }, { passive: true });

  // Mouse interaction (desktop only with hover capability)
  if (window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
  }

  // Start animation loop
  requestAnimationFrame(animate);

  // Cleanup on page unload
  window.addEventListener('beforeunload', function () {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('mousemove', onMouseMove);
  });
})();
