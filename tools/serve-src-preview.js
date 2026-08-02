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

// --- Wehel (AI subject expert) — local twin of local_hubredirect/wehel_chat.php.
// The prompt is the shared single source in src/moodle/local_hubredirect/
// wehel_prompt.json; change wording there, never here.
const wehelPromptFile = path.join(projectRoot, 'src', 'moodle', 'local_hubredirect', 'wehel_prompt.json');

async function handleWehelChat(req, res) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 400 * 1024) throw new Error('The request is too large.');
  }
  const payload = JSON.parse(body || '{}');
  const promptData = JSON.parse(fs.readFileSync(wehelPromptFile, 'utf8'));

  const subject = String(payload.subject || '');
  if (!promptData.subjectNotes[subject]) throw new Error('Unknown subject.');
  const grade = Number(payload.grade);
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) throw new Error('Unknown grade.');
  const channel = payload.channel === 'voice' ? 'voice' : 'text';
  const clean = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-24) : [];
  const conversation = messages.map((message) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: String(message.content ?? message.text ?? '').trim().slice(0, 4000)
  })).filter((message) => message.content);
  if (!conversation.length || conversation[conversation.length - 1].role !== 'user') {
    throw new Error('The last message must be from the learner.');
  }

  let unitContent = '';
  if (payload.unit !== undefined) {
    unitContent = JSON.stringify(payload.unit);
    if (unitContent.length > 120000) unitContent = `${unitContent.slice(0, 120000)} …(unit content truncated)`;
  }
  if (!unitContent) {
    unitContent = '(The unit content was not provided. Teach from the unit title and general Cambridge knowledge for this grade, and say when you are unsure what the lesson on screen shows.)';
  }

  const replacements = {
    '{{LEARNER_NAME}}': clean(payload.learnerName, 40) || 'the learner',
    '{{SUBJECT}}': clean(payload.subjectLabel, 60) || subject,
    '{{GRADE}}': String(grade),
    '{{STAGE_BAND}}': promptData.stageBands[String(grade)] || 'upper-primary',
    '{{CAMBRIDGE_CODE}}': clean(payload.cambridgeCode, 60) || 'curriculum',
    '{{UNIT_NO}}': clean(payload.unitNo, 8) || '?',
    '{{UNIT_TITLE}}': clean(payload.unitTitle, 160) || 'this unit',
    '{{CHANNEL}}': channel,
    '{{SUBJECT_NOTES}}': promptData.subjectNotes[subject].join('\n'),
    '{{UNIT_CONTENT}}': unitContent
  };
  let system = promptData.template.join('\n').replace(/\{\{[A-Z_]+\}\}/g, (token) => replacements[token] ?? token);
  const modeHint = (promptData.modeHints || {})[String(payload.mode || '')];
  if (modeHint) system += `\n\n${modeHint}`;

  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured in the local .env file.');
  const model = process.env.WEHEL_MODEL || promptData.model || 'claude-sonnet-5';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: Math.max(200, Math.min(2000, Number(promptData.maxTokens) || 700)),
      system,
      messages: conversation
    })
  });
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${(await response.text()).slice(0, 240)}`);
  const result = await response.json();
  const reply = (result.content || []).filter((block) => block.type === 'text').map((block) => block.text).join('').trim();
  if (!reply) throw new Error('Wehel could not answer just now.');
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify({ ok: true, reply, model }));
}

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
  '/api/wehel-chat': handleWehelChat
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
