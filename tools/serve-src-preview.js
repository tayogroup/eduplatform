#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const root = path.join(projectRoot, 'src');
const port = Number(process.env.PORT || process.env.PQ_PREVIEW_PORT || 4287);
const host = process.env.HOST || '127.0.0.1';
const elevenLabsCache = path.join(os.tmpdir(), 'ehel-math-elevenlabs-cache');
const defaultElevenLabsVoice = 'XfNU2rGpBa01ckF309OY';

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

loadDotEnv(path.join(projectRoot, '.env'));

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, `http://${host}:${port}`);
  let pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (pathname.startsWith('pre_quraan/')) pathname = pathname.slice('pre_quraan/'.length);
  if (pathname.startsWith('lessons/')) pathname = `media/${pathname}`;
  if (pathname.startsWith('messages/')) pathname = `media/${pathname}`;
  if (!pathname) pathname = 'testing-links.html';

  const hasExtension = path.extname(pathname) !== '';
  if (!hasExtension) pathname = path.join(pathname, 'index.html');
  const filePath = path.resolve(root, pathname);
  if (!filePath.startsWith(root + path.sep) && filePath !== root) return null;
  return { filePath, pathname };
}

function sendRange(req, res, filePath, stat, contentType) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
  if (!match) {
    res.writeHead(416, { 'content-range': `bytes */${stat.size}` });
    res.end();
    return;
  }

  let start = match[1] ? Number.parseInt(match[1], 10) : 0;
  let end = match[2] ? Number.parseInt(match[2], 10) : stat.size - 1;
  if (!Number.isFinite(start) || start < 0) start = 0;
  if (!Number.isFinite(end) || end >= stat.size) end = stat.size - 1;

  if (start > end) {
    res.writeHead(416, { 'content-range': `bytes */${stat.size}` });
    res.end();
    return;
  }

  res.writeHead(206, {
    'accept-ranges': 'bytes',
    'cache-control': 'no-store',
    'content-length': String(end - start + 1),
    'content-range': `bytes ${start}-${end}/${stat.size}`,
    'content-type': contentType
  });
  fs.createReadStream(filePath, { start, end }).pipe(res);
}

async function handleElevenLabs(req, res) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 24000) throw new Error('Voice request is too large.');
  }
  const payload = JSON.parse(body || '{}');
  const text = String(payload.text || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .map((line) => /[.!?;:…]["'”’)]*$/.test(line) ? line : `${line}.`)
    .join('\n\n');
  const voiceId = String(payload.voiceId || defaultElevenLabsVoice).replace(/[^A-Za-z0-9_-]/g, '');
  const requestedSpeed = Number(payload.speed);
  const speed = Number.isFinite(requestedSpeed) ? Math.max(0.70, Math.min(1, requestedSpeed)) : 0.90;
  if (!text || text.length > 5000) throw new Error('Voice text must contain between 1 and 5000 characters.');
  if (!process.env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not configured in the local .env file.');

  fs.mkdirSync(elevenLabsCache, { recursive: true });
  const cacheKey = crypto.createHash('sha256').update(`math-voice-v3-speed-${speed.toFixed(2)}\n${voiceId}\n${text}`).digest('hex');
  const cacheFile = path.join(elevenLabsCache, `${cacheKey}.mp3`);
  if (!fs.existsSync(cacheFile) || fs.statSync(cacheFile).size < 1000) {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.48, similarity_boost: 0.82, style: 0.32, speed, use_speaker_boost: true }
      })
    });
    if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${(await response.text()).slice(0, 240)}`);
    fs.writeFileSync(cacheFile, Buffer.from(await response.arrayBuffer()));
  }
  const stat = fs.statSync(cacheFile);
  res.writeHead(200, { 'content-type': 'audio/mpeg', 'content-length': String(stat.size), 'cache-control': 'private, max-age=86400' });
  fs.createReadStream(cacheFile).pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && new URL(req.url || '/', `http://${host}:${port}`).pathname === '/api/elevenlabs-tts') {
    try {
      await handleElevenLabs(req, res);
    } catch (error) {
      res.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  const resolved = resolveRequestPath(req.url || '/');
  if (!resolved) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(resolved.filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`Not found: ${resolved.pathname}`);
      return;
    }

    const ext = path.extname(resolved.filePath).toLowerCase();
    const contentType = mime[ext] || 'application/octet-stream';
    const isMedia = ext === '.mp4' || ext === '.mp3';

    if (isMedia && req.headers.range) {
      sendRange(req, res, resolved.filePath, stat, contentType);
      return;
    }

    res.writeHead(200, {
      'accept-ranges': isMedia ? 'bytes' : 'none',
      'cache-control': 'no-store',
      'content-length': String(stat.size),
      'content-type': contentType
    });
    fs.createReadStream(resolved.filePath).pipe(res);
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://localhost:${port}/`);
});
