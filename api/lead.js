'use strict';

/*
 * CLIxED lead-capture endpoint (contact + consultation forms).
 * Deployment: any Node 18+ serverless runtime that exposes `module.exports`
 * for GET/POST (Vercel: /api/lead.js -> /api/lead; Netlify: api/lead.js).
 *
 * REQUIRED ENVIRONMENT VARIABLES (set in your host's UI — never commit values):
 *   CONTACT_EMAIL  - destination inbox for enquiries
 *   FROM_EMAIL     - verified sender address of the email provider
 *   EMAIL_API_KEY  - provider API key (Resend-style REST: POST /v1/emails, Bearer auth)
 *   ALLOWED_ORIGIN - production site origin, e.g. https://www.clixed.com
 *                    (only this origin is granted CORS access; empty = same-origin only)
 *
 * If EMAIL_API_KEY / CONTACT_EMAIL / FROM_EMAIL are not set, the endpoint
 * validates and rate-limits but returns 503 — it never fabricates delivery.
 */

const RATE_MAX = 5;            // submissions
const RATE_WINDOW_MS = 10 * 60 * 1000; // per IP
const MAX_HONEYPOT = 100;      // honeypot must be empty
const MAX = { name: 100, email: 254, phone: 30, message: 5000, other: 200 };

const hits = new Map(); // per-instance basic rate limit (IP -> [timestamps])

function clean(v, cap) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, cap);
}

function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
function validPhone(v) { return /^\+?[0-9][0-9\s().-]{6,17}$/.test(v); }

function json(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function cors(res, req) {
  const allowed = process.env.ALLOWED_ORIGIN || '';
  const origin = req.headers.origin;
  if (allowed && origin === allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = (req, res) => {
  cors(res, req);
  if (req.method === 'OPTIONS') { res.status(204); res.end(); return; }
  if (req.method !== 'POST') { json(res, 405, { ok: false, error: 'Method not allowed' }); return; }

  let body = req.body || '';
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      json(res, 400, { ok: false, error: 'Malformed JSON' });
      return;
    }
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    json(res, 400, { ok: false, error: 'Body must be a JSON object' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || 'local').split(',')[0].trim();
  const now = Date.now();
  const past = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (past.length >= RATE_MAX) { json(res, 429, { ok: false, error: 'Too many attempts. Please try later.' }); return; }
  past.push(now);
  hits.set(ip, past);

  const website = clean(body.website || '', MAX_HONEYPOT);
  if (website) { res.status(204); res.end(); return; } // honeypot filled -> silently drop

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  const phone = clean(body.phone, MAX.phone);
  const message = clean(body.message, MAX.message);
  const lookingFor = clean(body.lookingFor || body.role || '', MAX.other);

  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!email || !validEmail(email)) errors.email = 'A valid email address is required';
  if (!phone || !validPhone(phone)) errors.phone = 'A valid phone number is required';
  if (!message || message.length < 10) errors.message = 'Message must be at least 10 characters';
  if (Object.keys(errors).length) { json(res, 400, { ok: false, errors }); return; }

  const optional = {};
  ['course', 'destination', 'qualification', 'score', 'intake', 'budget', 'date', 'time']
    .forEach((k) => { const v = clean(body[k], MAX.other); if (v) optional[k] = v; });

  const providerReady = process.env.EMAIL_API_KEY && process.env.CONTACT_EMAIL && process.env.FROM_EMAIL;
  if (!providerReady) {
    json(res, 503, { ok: false, error: 'Email provider not configured on the server.' });
    return;
  }

  const request = {
    from: process.env.FROM_EMAIL,
    to: process.env.CONTACT_EMAIL,
    reply_to: email,
    subject: 'CLIxED website enquiry: ' + (lookingFor || 'Contact form'),
    text: [
      'Name: ' + name,
      'Email: ' + email,
      'Phone: ' + phone,
      'Looking for: ' + (lookingFor || '-'),
      Object.keys(optional).length ? 'Extra: ' + JSON.stringify(optional) : null,
      '',
      'Message:',
      message
    ].filter(Boolean).join('\n'),
    headers: { 'X-CLIxED-Source': 'website' }
  };

  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.EMAIL_API_KEY
    },
    body: JSON.stringify(request)
  }).then((r) => {
    if (!r.ok) throw new Error('provider http ' + r.status);
    json(res, 200, { ok: true });
  }).catch(() => {
    json(res, 500, { ok: false, error: 'Failed to deliver message' });
  });
};