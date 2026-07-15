#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || process.argv[2] || 4181);
const host = '127.0.0.1';
const distDir = path.join(root, 'dist', 'pre_quraan');
const sourceUrl = 'https://quraanacademy.b-cdn.net/pre_quraan_integration/units/openmaic-classroom/fractions-with-pizza-standalone.html';
const lessonPath = path.join(distDir, 'units', 'openmaic-classroom', 'fractions-with-pizza-standalone.html');
const generatorPath = path.join(root, 'tools', 'create-codex-fractions-lesson.js');
const jobs = new Map();

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function json(res, statusCode, value) {
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(value, null, 2));
}

function text(res, statusCode, value, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
  });
  res.end(value);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function publicLessonUrl() {
  return `http://${host}:${port}/pre_quraan_integration/units/openmaic-classroom/fractions-with-pizza-standalone.html`;
}

function latestLessonInfo() {
  const exists = fs.existsSync(lessonPath);
  const stat = exists ? fs.statSync(lessonPath) : null;
  return {
    sourceUrl,
    servedUrl: publicLessonUrl(),
    outputFile: lessonPath,
    exists,
    bytes: stat ? stat.size : 0,
    updatedAt: stat ? stat.mtime.toISOString() : null,
  };
}

function createJob(options = {}) {
  const id = `fraction-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const job = {
    id,
    status: 'queued',
    mode: options.mode || 'codex-polished',
    sourceUrl: options.sourceUrl || sourceUrl,
    startedAt: null,
    finishedAt: null,
    exitCode: null,
    stdout: '',
    stderr: '',
    result: null,
    error: null,
  };
  jobs.set(id, job);

  setImmediate(() => runJob(job));
  return job;
}

function runJob(job) {
  job.status = 'running';
  job.startedAt = new Date().toISOString();

  const child = spawn(process.execPath, [generatorPath], {
    cwd: root,
    windowsHide: true,
  });

  child.stdout.on('data', (chunk) => {
    job.stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    job.stderr += chunk.toString();
  });
  child.on('error', (error) => {
    job.status = 'failed';
    job.error = error.message;
    job.finishedAt = new Date().toISOString();
  });
  child.on('close', (code) => {
    job.exitCode = code;
    job.finishedAt = new Date().toISOString();
    if (code === 0) {
      job.status = 'complete';
      job.result = latestLessonInfo();
    } else {
      job.status = 'failed';
      job.error = `Generator exited with code ${code}`;
    }
  });
}

function resolveStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  let normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  normalized = normalized.replace(/^[/\\]+/, '');

  const supportedBases = ['pre_quraan_integration', 'pre_quraan', 'pre_quraan_staging'];
  const parts = normalized.split(/[\\/]+/);
  if (supportedBases.includes(parts[0])) parts.shift();

  const requested = parts.join(path.sep) || path.join('units', 'alphabet', 'index.html');
  const filePath = path.join(distDir, requested);
  const resolved = path.resolve(filePath);
  if (resolved !== path.resolve(distDir) && !resolved.startsWith(path.resolve(distDir) + path.sep)) return null;
  return resolved;
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/openmaic/fractions/latest') {
    json(res, 200, latestLessonInfo());
    return;
  }

  if (req.method === 'POST' && pathname === '/api/openmaic/fractions/recreate') {
    let options = {};
    const body = await readBody(req);
    if (body.trim()) {
      try {
        options = JSON.parse(body);
      } catch (_error) {
        json(res, 400, { error: 'Request body must be valid JSON.' });
        return;
      }
    }
    const job = createJob(options);
    json(res, 202, {
      jobId: job.id,
      status: job.status,
      statusUrl: `http://${host}:${port}/api/jobs/${job.id}`,
      latestUrl: `http://${host}:${port}/api/openmaic/fractions/latest`,
    });
    return;
  }

  const jobMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (req.method === 'GET' && jobMatch) {
    const job = jobs.get(jobMatch[1]);
    if (!job) {
      json(res, 404, { error: 'Job not found.' });
      return;
    }
    json(res, 200, job);
    return;
  }

  json(res, 404, {
    error: 'Unknown API route.',
    routes: [
      'POST /api/openmaic/fractions/recreate',
      'GET /api/jobs/{jobId}',
      'GET /api/openmaic/fractions/latest',
    ],
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);

  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url.pathname).catch((error) => {
      json(res, 500, { error: error.message });
    });
    return;
  }

  const filePath = resolveStaticPath(url.pathname);
  if (!filePath) {
    text(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      text(res, 404, `Not found: ${url.pathname}`);
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

server.listen(port, host, () => {
  console.log(`OpenMAIC lesson API running at http://${host}:${port}`);
  console.log(`POST http://${host}:${port}/api/openmaic/fractions/recreate`);
  console.log(`Preview ${publicLessonUrl()}`);
});
