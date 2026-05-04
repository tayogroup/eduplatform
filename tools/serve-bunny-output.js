#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');

const root = process.cwd();
const distDir = path.join(root, 'dist');
const port = Number(process.env.PORT || process.argv[2] || 4173);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
  });
  res.end(body);
}

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const relativePath = normalized === path.sep || normalized === '/'
    ? path.join('pre_quraan', 'units', 'alphabet', 'index.html')
    : normalized.replace(/^[/\\]+/, '');

  const filePath = path.join(distDir, relativePath);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(path.resolve(distDir))) {
    return null;
  }

  return resolved;
}

if (!fs.existsSync(distDir)) {
  console.error(`Missing dist folder: ${distDir}`);
  console.error('Run: npm.cmd run build:bunny');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const filePath = resolveRequestPath(req.url || '/');

  if (!filePath) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      send(res, 404, `Not found: ${req.url}`);
      return;
    }

    const contentType = contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentType,
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving Bunny output from ${distDir}`);
  console.log(`Open http://127.0.0.1:${port}/pre_quraan/units/alphabet/index.html`);
});
