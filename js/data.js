(function () {
  'use strict';

  /* ============================================================
     CLIxED — lead capture config (single source of truth)
     The endpoint is served by api/lead.js (serverless function).
     ============================================================ */
  window.LEAD_CONFIG = {
    endpoint: '/api/lead',
    minWaitMs: 8000,
    maxHoneypotChars: 100
  };

  /* ============================================================
     CLIxED — Substack integration config (single source of truth)
     TEST CONFIGURATION: the publication below is a real, live
     Substack used to verify the integration pipeline end-to-end.
     Replace `publication` with the real CLIxED Substack URL when
     it becomes available — nothing else on this page needs to change.
     Content is fetched through api/substack.js (same-origin
     serverless passthrough, same pattern as api/lead.js) because
     Substack's feed/API does not send CORS headers to browsers.
     ============================================================ */
  window.SUBSTACK_CONFIG = {
    publication: 'https://oneusefulthing.substack.com',
    endpoint: '/api/substack?limit=4',
    label: 'CLIxED on Substack'
  };
})();