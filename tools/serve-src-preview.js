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
  // Wehel replies use the low-latency Flash model — they are conversational,
  // per-learner and never reused, so studio quality buys nothing. Mirrors the
  // wehel_reply purpose in local_hubredirect/quiz_tts.php.
  const modelId = String(payload.purpose || '') === 'wehel_reply' ? 'eleven_flash_v2_5' : 'eleven_multilingual_v2';
  const requestedSpeed = Number(payload.speed);
  const speed = Number.isFinite(requestedSpeed) ? Math.max(0.70, Math.min(1, requestedSpeed)) : 0.90;
  if (!text || text.length > 5000) throw new Error('Voice text must contain between 1 and 5000 characters.');
  if (!process.env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not configured in the local .env file.');

  fs.mkdirSync(elevenLabsCache, { recursive: true });
  // The model joins the key only when it is not the long-standing default, so
  // every clip already in the cache keeps its name (each render costs money).
  const modelTag = modelId === 'eleven_multilingual_v2' ? '' : `${modelId}\n`;
  const cacheKey = crypto.createHash('sha256').update(`math-voice-v3-speed-${speed.toFixed(2)}\n${voiceId}\n${modelTag}${text}`).digest('hex');
  const cacheFile = path.join(elevenLabsCache, `${cacheKey}.mp3`);
  if (!fs.existsSync(cacheFile) || fs.statSync(cacheFile).size < 1000) {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      body: JSON.stringify({
        text,
        model_id: modelId,
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

// --- Wehel (AI subject expert) — local twin of local_hubredirect/wehel_chat.php.
// The prompt is the shared single source in src/moodle/local_hubredirect/
// wehel_prompt.json; change wording there, never here.
// Wehel chat: the shared dev handler (also mounted by vite.config.js at the
// production path). Assembly logic lives once, in tools/lib/wehel-dev-chat.js.
const { createWehelChatHandler, createWehelHomeworkHandler } = require(path.join(__dirname, 'lib', 'wehel-dev-chat.js'));
const handleWehelChat = createWehelChatHandler({
  apiKey: () => process.env.ANTHROPIC_API_KEY,
  model: () => process.env.WEHEL_MODEL
});
// Homework twin: sample assignments only when WEHEL_DEV_HOMEWORK is set, the
// empty list otherwise — see the handler's own comment.
const handleWehelHomework = createWehelHomeworkHandler({ enabled: () => process.env.WEHEL_DEV_HOMEWORK });

// Wehel's Deepgram voice (Aura-2 Thalia replies, nova-3 mic transcription) —
// Wehel ONLY; the lesson voice and pronunciation check stay on ElevenLabs.
const { createWehelSpeakHandler, createWehelListenHandler } = require(path.join(__dirname, 'lib', 'wehel-deepgram.js'));
const handleWehelSpeak = createWehelSpeakHandler({ apiKey: () => process.env.DEEPGRAM_API_KEY, model: () => process.env.WEHEL_SPEAK_MODEL });
const handleWehelListen = createWehelListenHandler({ apiKey: () => process.env.DEEPGRAM_API_KEY, model: () => process.env.WEHEL_LISTEN_MODEL });

// Somali vocabulary audio (Azure "Ubax"/Ubah voice) — the same shared handler
// vite.config.js mounts at the production path /local/hubredirect/somali_tts.php.
const { createSomaliTtsHandler } = require(path.join(__dirname, 'lib', 'azure-somali-tts.js'));
const handleSomaliTts = createSomaliTtsHandler({
  apiKey: () => process.env.AZURE_SPEECH_KEY,
  region: () => process.env.AZURE_SPEECH_REGION
});

// Local twin of local_hubredirect/quiz_stt.php so Wehel's mic works in dev.
async function handleElevenLabsStt(req, res) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 8 * 1024 * 1024) throw new Error('The recording request is too large.');
  }
  const payload = JSON.parse(body || '{}');
  const audio = Buffer.from(String(payload.audioBase64 || ''), 'base64');
  if (!audio.length || audio.length > 6 * 1024 * 1024) throw new Error('The recording is empty or too large.');
  if (!process.env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not configured in the local .env file.');
  const mimeType = String(payload.mimeType || 'audio/webm').split(';')[0].toLowerCase();
  const extension = { 'audio/webm': 'webm', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg' }[mimeType] || 'webm';
  const form = new FormData();
  form.append('file', new Blob([audio], { type: mimeType }), `speaking.${extension}`);
  form.append('model_id', process.env.ELEVENLABS_STT_MODEL_ID || 'scribe_v1');
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { Accept: 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    body: form
  });
  if (!response.ok) throw new Error(`ElevenLabs STT ${response.status}: ${(await response.text()).slice(0, 240)}`);
  const result = await response.json();
  const text = String(result.text || result.transcript || '').replace(/\s+/g, ' ').trim();
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify({ ok: true, text }));
}

const apiRoutes = {
  '/api/elevenlabs-tts': handleElevenLabs,
  '/api/elevenlabs-stt': handleElevenLabsStt,
  '/api/wehel-chat': handleWehelChat,
  '/api/wehel-homework': handleWehelHomework,
  '/api/wehel-speak': handleWehelSpeak,
  '/api/wehel-listen': handleWehelListen,
  '/api/somali-tts': handleSomaliTts
};

const server = http.createServer(async (req, res) => {
  const apiRoute = apiRoutes[new URL(req.url || '/', `http://${host}:${port}`).pathname];
  if (req.method === 'POST' && apiRoute) {
    try {
      await apiRoute(req, res);
    } catch (error) {
      res.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: error.message, message: error.message }));
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
