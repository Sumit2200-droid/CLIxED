'use strict';

/*
 * CLIxED — Substack passthrough endpoint (insights.html "From Substack" section).
 * Deployment: any Node 18+ serverless runtime that exposes `module.exports`
 * (same pattern as api/lead.js — Vercel: /api/substack.js -> /api/substack;
 * Netlify: api/substack.js).
 *
 * Why this exists: Substack's public JSON API and RSS feed do not send
 * CORS headers, so browsers cannot fetch them directly. This endpoint
 * fetches the publication server-side and returns a small, sanitised
 * payload. No API keys or secrets are used — the posts API is public.
 *
 * TEST CONFIGURATION: PUBLICATION below is a real live Substack used to
 * verify the pipeline. Replace it with the real CLIxED Substack URL when
 * available (keep `SOURCE` = '<handle>.substack.com').
 *
 * Security: only whitelisted string fields are returned, HTML is stripped,
 * lengths are capped and URLs are restricted to http(s). Full article body
 * is NEVER copied into CLIxED — cards link out to the original post.
 */

const PUBLICATION = 'https://oneusefulthing.substack.com';
const SOURCE = 'oneusefulthing.substack.com';
const LIMIT_MAX = 6;
const CAP = { title: 200, excerpt: 300, url: 2048, image: 2048, date: 10 };

const hits = new Map(); // per-instance basic rate limit (IP -> [timestamps])

function clean(v, cap) {
  if (typeof v !== 'string') return '';
  const stripped = v
    .replace(/<[^>]*>/g, ' ')        // strip any markup
    .replace(/[\u0000-\u001F\u007F]/g, '') // strip control chars
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, cap);
}

function safeUrl(raw, cap) {
  if (typeof raw !== 'string') return '';
  const v = raw.replace(/[\u0000-\u001F\u007F\s]/g, '').trim();
  if (!/^https?:\/\//i.test(v)) return '';
  return v.slice(0, cap);
}

function pick(item) {
  const audience = typeof item.audience === 'string' ? item.audience : '';
  if (audience && audience !== 'everyone') return null;
  const postDate = typeof item.post_date === 'string' ? item.post_date : '';
  const url = safeUrl(item.canonical_url || item.full_url || '', CAP.url);
  if (!url) return null;
  return {
    title: clean(item.title, CAP.title),
    excerpt: clean(item.subtitle, CAP.excerpt),
    date: postDate.replace(/^(\d{4}-\d{2}-\d{2}).*$/, '$1').slice(0, CAP.date),
    url: url,
    image: safeUrl(item.cover_image, CAP.image)
  };
}

function json(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { res.status(204); res.end(); return; }
  if (req.method !== 'GET') { json(res, 405, { ok: false, error: 'Method not allowed' }); return; }

  const ip = (req.headers['x-forwarded-for'] || 'local').split(',')[0].trim();
  const now = Date.now();
  const past = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  if (past.length >= 30) { json(res, 429, { ok: false, error: 'Too many requests. Please try later.' }); return; }
  past.push(now);
  hits.set(ip, past);

  let limit = parseInt(req.query && req.query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 4;
  limit = Math.min(limit, LIMIT_MAX);

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;

  fetch(SOURCE + '/api/v1/posts?limit=' + limit + '&sort=new', {
    headers: { Accept: 'application/json', 'User-Agent': 'CLIxED-site/1.0' }
  }).then((r) => {
    if (!r.ok) throw new Error('substack http ' + r.status);
    return r.json();
  }).then((posts) => {
    if (!Array.isArray(posts)) throw new Error('unexpected payload');
    const items = posts.map(pick).filter(Boolean).slice(0, limit);
    json(res, 200, { ok: true, publication: PUBLICATION, items: items });
  }).catch(() => {
    json(res, 502, { ok: false, error: 'Substack feed unavailable', publication: PUBLICATION });
  }).finally(() => {
    if (timer) clearTimeout(timer);
  });
};