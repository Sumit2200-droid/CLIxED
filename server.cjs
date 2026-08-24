'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const substack = require('./api/substack.js');
const lead = require('./api/lead.js');

const root = __dirname;
const port = Number(process.env.PORT) || 5500;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

function wrapRes(res) {
  var wrapped = Object.create(res);
  wrapped.status = function (code) {
    res.statusCode = code;
    return wrapped;
  };
  return wrapped;
}

function parseBody(req, callback) {
  if (req.method !== 'POST') { callback(null); return; }
  var chunks = [];
  req.on('data', function (c) { chunks.push(c); });
  req.on('end', function () {
    var raw = Buffer.concat(chunks).toString('utf8');
    try {
      req.body = JSON.parse(raw);
    } catch (e) {
      req.body = raw;
    }
    callback(null);
  });
  req.on('error', function (err) { callback(err); });
}

function serveStatic(req, res, requestUrl) {
  var requested = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
  var filePath = path.resolve(root, '.' + requested);
  if (!filePath.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, function (statError, stats) {
    if (statError || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

var server = http.createServer(function (req, res) {
  var requestUrl = new URL(req.url, 'http://' + req.headers.host);

  if (requestUrl.pathname === '/api/substack') {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    req.query = Object.fromEntries(requestUrl.searchParams);
    substack(req, wrapRes(res));
    return;
  }

  if (requestUrl.pathname === '/api/lead') {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    req.query = Object.fromEntries(requestUrl.searchParams);
    parseBody(req, function (err) {
      if (err) { res.writeHead(400); res.end('Bad request'); return; }
      lead(req, wrapRes(res));
    });
    return;
  }

  serveStatic(req, res, requestUrl);
});

server.listen(port, '127.0.0.1', function () {
  console.log('CLIxED development server: http://127.0.0.1:' + port);
});
