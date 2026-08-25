(function () {
  'use strict';

  /* ============================================================
     CLIxED — lead capture config (single source of truth)
     The endpoint is served by api/lead.js (serverless function).
     ============================================================ */
  window.LEAD_CONFIG = {
    endpoint: 'https://api.web3forms.com/submit',
    minWaitMs: 8000,
    maxHoneypotChars: 100
  };

  /* ============================================================
     CLIxED — Substack integration config (single source of truth)
     ============================================================

     HOW TO UPDATE YOUR SUBSTACK URL:
     If you change your Substack publication, update ONLY the
     "publication" value below. The GitHub Actions workflow
     automatically fetches RSS and writes data/posts.json.

     The client-side code only reads data/posts.json — no
     proxy calls or CORS workarounds needed.
     ============================================================ */
  window.SUBSTACK_CONFIG = {
    /* Your Substack publication URL — change this if you move publications */
    publication: 'https://test7334.substack.com',

    label: 'CLIxED on Substack'
  };
})();
