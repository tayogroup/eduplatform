#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const root = process.cwd();
const apiBase = 'https://api.elevenlabs.io/v1';
const bundledFfmpeg = String.raw`C:\Users\inawa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe`;

function arg(name, fallback = '') {
  const args = process.argv.slice(2);
  const prefix = `--${name}=`;
  const found = args.find((item) => item.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  return fallback;
}

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
}

function ffmpegPath() {
  return process.env.FFMPEG_PATH || (fs.existsSync(bundledFfmpeg) ? bundledFfmpeg : 'ffmpeg');
}

function normalizeMp3(rawPath, outPath) {
  const normalized = spawnSync(ffmpegPath(), [
    '-y',
    '-i', rawPath,
    '-ar', '44100',
    '-ac', '1',
    '-codec:a', 'libmp3lame',
    '-b:a', '128k',
    outPath,
  ], { encoding: 'utf8' });

  if (normalized.status !== 0 || !fs.existsSync(outPath)) {
    fs.renameSync(rawPath, outPath);
    console.warn(`Could not normalize ${path.basename(outPath)} with ffmpeg; wrote raw MP3 instead.`);
    return;
  }
  fs.unlinkSync(rawPath);
}

async function elevenFetch(url, options = {}) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) fail('ELEVENLABS_API_KEY is not set.');

  const res = await fetch(url, {
    ...options,
    headers: {
      'xi-api-key': key,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    fail(`ElevenLabs request failed (${res.status}): ${body.slice(0, 800)}`);
  }
  return res;
}

async function findVoiceId(voiceName) {
  const res = await elevenFetch(`${apiBase}/voices`);
  const data = await res.json();
  const voices = Array.isArray(data.voices) ? data.voices : [];
  const normalized = String(voiceName || '').trim().toLowerCase();
  const voice = voices.find((item) => String(item.name || '').trim().toLowerCase() === normalized) ||
    voices.find((item) => String(item.name || '').trim().toLowerCase().includes(normalized));

  if (!voice || !voice.voice_id) {
    const names = voices.map((item) => item.name).filter(Boolean).slice(0, 40).join(', ');
    fail(`Voice not found: ${voiceName}. Available voices include: ${names}`);
  }
  return voice.voice_id;
}

function loadUnitConfig(configPath) {
  const source = fs.readFileSync(configPath, 'utf8');
  const sandbox = {
    console,
    globalThis: {},
    window: {
      PQUnitConfigNormalizer: {
        normalize(config) {
          return config;
        },
      },
    },
  };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: configPath });
  return sandbox.window.UNIT_CFG || sandbox.window.PQ_alphabet_listen || null;
}

function audioNameForKey(key) {
  const match = String(key || '').match(/^alph_(\d+)$/);
  if (!match) return `${key}.mp3`;
  return `alph_${String(Number(match[1])).padStart(2, '0')}.mp3`;
}

async function createCaptionAudio({ text, outPath, voiceId, modelId, outputFormat }) {
  const payload = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: 0.6,
      similarity_boost: 0.78,
      style: 0.22,
      use_speaker_boost: true,
    },
  };

  const url = `${apiBase}/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`;
  const res = await elevenFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const rawPath = `${outPath}.raw.mp3`;
  fs.writeFileSync(rawPath, Buffer.from(await res.arrayBuffer()));
  normalizeMp3(rawPath, outPath);
}

async function main() {
  if (typeof fetch !== 'function') fail('This script needs Node.js with built-in fetch support.');
  loadDotEnv(path.join(root, '.env'));

  const configPath = path.resolve(root, arg('config', 'src/units/alphabet/unit.config.js'));
  const outDir = path.resolve(root, arg('out-dir', 'src/media/lessons/alphabet/media/captions/audio'));
  const voiceName = arg('voice', 'Salma');
  const voiceIdArg =
    arg('voice-id', '') ||
    process.env.PREQURAN_QUIZ_TTS_VOICE_ID ||
    process.env.ELEVENLABS_VOICE_ID ||
    'B5xxC4eQoOFJnY4R5XkI';
  const modelId = arg('model', 'eleven_v3');
  const outputFormat = arg('format', 'mp3_44100_128');
  const onlyKey = arg('key', '');
  const force = hasFlag('force');

  if (!fs.existsSync(configPath)) fail(`Config not found: ${configPath}`);
  const cfg = loadUnitConfig(configPath);
  const items = cfg && cfg.content && Array.isArray(cfg.content.items) ? cfg.content.items : [];
  const captions = items
    .map((item) => ({
      key: String(item.key || ''),
      text: String(item.watchArticulationCaption || item.articulationCaption || '').trim(),
    }))
    .filter((item) => item.key && item.text && (!onlyKey || item.key === onlyKey));

  if (!captions.length) fail(`No articulation captions found${onlyKey ? ` for ${onlyKey}` : ''}.`);

  const voiceId = voiceIdArg || await findVoiceId(voiceName);
  for (let index = 0; index < captions.length; index += 1) {
    const item = captions[index];
    const outPath = path.join(outDir, audioNameForKey(item.key));
    if (!force && fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
      console.log(`Skipping ${path.relative(root, outPath)}; already exists.`);
      continue;
    }
    console.log(`Generating ${index + 1}/${captions.length} ${item.key}: ${item.text}`);
    await createCaptionAudio({ text: item.text, outPath, voiceId, modelId, outputFormat });
    console.log(`Wrote ${path.relative(root, outPath)} (${fs.statSync(outPath).size} bytes)`);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
