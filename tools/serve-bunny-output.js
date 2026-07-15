#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');

const root = process.cwd();
const distDir = path.join(root, 'dist');
const bunnyDistDir = path.join(distDir, 'pre_quraan');
const port = Number(process.env.PORT || process.argv[2] || 4173);
const defaultElevenLabsVoiceId = 'B5xxC4eQoOFJnY4R5XkI';

function loadDotEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadDotEnv();

function readBuildMetadata() {
  const metadataPath = path.join(bunnyDistDir, '.bunny-build.json');
  if (!fs.existsSync(metadataPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

function normalizeBasePath(value) {
  const configured = value || '/pre_quraan/';
  const trimmed = configured.trim();
  if (!trimmed) return '/pre_quraan/';

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

const buildMetadata = readBuildMetadata();
const publicBasePath = normalizeBasePath(process.env.PREQURAAN_PUBLIC_BASE_PATH || buildMetadata?.publicBasePath);
const supportedBasePaths = Array.from(new Set([
  publicBasePath,
  '/pre_quraan/',
  '/pre_quraan_integration/',
  '/pre_quraan_staging/',
]));

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

function sendJson(res, statusCode, payload) {
  send(res, statusCode, JSON.stringify(payload), 'application/json; charset=utf-8');
}

function sendCors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:' + port);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function readJsonBody(req, maxBytes = 8192) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (_error) {
        reject(new Error('Invalid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

async function handleLocalTts(req, res) {
  sendCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, message: 'Use POST.' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, message: error.message || 'Invalid request.' });
    return;
  }

  const text = String(payload.text || '').replace(/\s+/g, ' ').trim().slice(0, 650);
  if (!text) {
    sendJson(res, 400, { ok: false, message: 'Missing text.' });
    return;
  }

  const apiKey = String(process.env.ELEVENLABS_API_KEY || '').trim();
  if (!apiKey) {
    sendJson(res, 503, {
      ok: false,
      message: 'ElevenLabs voice is not configured in this local server. Set ELEVENLABS_API_KEY before starting the preview server.',
    });
    return;
  }

  const voiceId = String(
    process.env.PREQURAN_QUIZ_TTS_VOICE_ID ||
    process.env.ELEVENLABS_VOICE_ID ||
    defaultElevenLabsVoiceId
  ).trim();
  const modelId = String(
    process.env.PREQURAN_QUIZ_TTS_MODEL_ID ||
    process.env.ELEVENLABS_MODEL ||
    'eleven_multilingual_v2'
  ).trim();
  const url = 'https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voiceId) + '?output_format=mp3_44100_128';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.48,
          similarity_boost: 0.82,
          style: 0.32,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      sendJson(res, 502, { ok: false, message: 'ElevenLabs voice request failed.' });
      return;
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'audio/mpeg',
    });
    res.end(audioBuffer);
  } catch (error) {
    sendJson(res, 502, { ok: false, message: 'Voice service is unavailable.' });
  }
}

async function handleLocalStt(req, res) {
  sendCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, message: 'Use POST.' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(req, 8 * 1024 * 1024);
  } catch (error) {
    sendJson(res, 400, { ok: false, message: error.message || 'Invalid request.' });
    return;
  }

  const apiKey = String(process.env.ELEVENLABS_API_KEY || '').trim();
  if (!apiKey) {
    sendJson(res, 503, {
      ok: false,
      message: 'ElevenLabs speech recognition is not configured in this local server.',
    });
    return;
  }

  const audioBase64 = String(payload.audioBase64 || '').trim();
  const mimeType = String(payload.mimeType || 'audio/webm').split(';')[0] || 'audio/webm';
  if (!audioBase64) {
    sendJson(res, 400, { ok: false, message: 'Missing audio.' });
    return;
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    if (!audioBuffer.length || audioBuffer.length > 6 * 1024 * 1024) {
      sendJson(res, 400, { ok: false, message: 'Audio chunk is too large or empty.' });
      return;
    }

    const form = new FormData();
    const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
    form.append('file', new Blob([audioBuffer], { type: mimeType }), 'speech.' + extension);
    form.append('model_id', String(process.env.ELEVENLABS_STT_MODEL_ID || 'scribe_v1'));

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'xi-api-key': apiKey,
      },
      body: form,
    });

    if (!response.ok) {
      sendJson(res, 502, { ok: false, message: 'ElevenLabs speech recognition failed.' });
      return;
    }

    const result = await response.json();
    const text = String(result.text || result.transcript || '').replace(/\s+/g, ' ').trim();
    sendJson(res, 200, { ok: true, text });
  } catch (error) {
    sendJson(res, 502, { ok: false, message: 'Speech recognition service is unavailable.' });
  }
}

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  let relativePath = normalized === path.sep || normalized === '/'
    ? path.join('units', 'alphabet', 'index.html')
    : normalized.replace(/^[/\\]+/, '');

  const normalizedUrlPath = `/${relativePath.split(path.sep).join('/')}`;
  const matchedBasePath = supportedBasePaths.find((basePath) => normalizedUrlPath.startsWith(basePath));
  if (matchedBasePath) {
    relativePath = normalizedUrlPath.slice(matchedBasePath.length);
  }

  const filePath = path.join(bunnyDistDir, relativePath);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(path.resolve(bunnyDistDir))) {
    return null;
  }

  return resolved;
}

if (!fs.existsSync(bunnyDistDir)) {
  console.error(`Missing Bunny output folder: ${bunnyDistDir}`);
  console.error('Run: npm.cmd run build:bunny');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const requestPath = (req.url || '/').split('?')[0];
  if (requestPath === '/local/hubredirect/quiz_tts.php') {
    handleLocalTts(req, res);
    return;
  }
  if (requestPath === '/local/hubredirect/quiz_stt.php') {
    handleLocalStt(req, res);
    return;
  }

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
  console.log(`Serving Bunny output from ${bunnyDistDir}`);
  console.log(`Public base path: ${publicBasePath}`);
  console.log(`Accepted base paths: ${supportedBasePaths.join(', ')}`);
  console.log(`Open http://127.0.0.1:${port}${publicBasePath}units/alphabet/index.html`);
});
