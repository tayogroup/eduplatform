#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const apiBase = 'https://api.elevenlabs.io/v1';
const maxChunkChars = 4500;
const bundledFfmpeg = String.raw`C:\Users\inawa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe`;

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
}

function arg(name, fallback = '') {
  const args = process.argv.slice(2);
  const prefix = `--${name}=`;
  const found = args.find((item) => item.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  return fallback;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function cleanLectureScript(raw) {
  const text = String(raw || '');
  const start = text.indexOf('Assalamu alaykum');
  return (start >= 0 ? text.slice(start) : text)
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitText(text) {
  const paragraphs = String(text || '').split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkChars) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
      for (const sentence of sentences) {
        if ((current + '\n\n' + sentence).trim().length > maxChunkChars && current) {
          chunks.push(current.trim());
          current = '';
        }
        current = (current ? `${current}\n\n${sentence}` : sentence).trim();
      }
      continue;
    }

    const next = (current ? `${current}\n\n${paragraph}` : paragraph).trim();
    if (next.length > maxChunkChars && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}

function splitLectureSlides(text) {
  const source = String(text || '').trim();
  const markers = [
    'Step 1 is Lecture.',
    'Step 2 is Rules.',
    'Step 3 is Listen.',
    'Step 4 is Watch.',
    'Step 5 is Phonetics.',
    'Step 6 is Repeat.',
    'Step 7 is LetterClue.',
    'Step 8 is Speak.',
    'Step 9 is Match.',
    'Step 10 is SoundClue.',
    'Step 11 is Animate.',
    'Step 12 is Write.',
    'Step 13 is Submit.',
    'Remember these helpers.',
    'Great job.',
  ];

  const positions = markers.map((marker) => {
    const offset = source.indexOf(marker);
    if (offset < 0) fail(`Could not find lecture slide marker: ${marker}`);
    return { marker, offset };
  });

  const chunks = [];
  chunks.push(source.slice(0, positions[0].offset).trim());
  for (let index = 0; index < positions.length; index += 1) {
    const start = positions[index].offset;
    const end = index + 1 < positions.length ? positions[index + 1].offset : source.length;
    chunks.push(source.slice(start, end).trim());
  }

  if (chunks.length !== 16 || chunks.some((chunk) => !chunk)) {
    fail(`Expected 16 non-empty slide narration chunks, found ${chunks.length}.`);
  }
  return chunks;
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
  const exact = voices.find((voice) => String(voice.name || '').trim().toLowerCase() === normalized);
  const partial = voices.find((voice) => String(voice.name || '').trim().toLowerCase().includes(normalized));
  const voice = exact || partial;
  if (!voice || !voice.voice_id) {
    const names = voices.map((item) => item.name).filter(Boolean).slice(0, 40).join(', ');
    fail(`Voice not found: ${voiceName}. Available voices include: ${names}`);
  }
  return voice.voice_id;
}

async function createAudioChunk({ text, voiceId, modelId, outputFormat }) {
  const url = `${apiBase}/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`;
  const payload = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: 0.55,
      similarity_boost: 0.75,
      style: 0.18,
      use_speaker_boost: true,
    },
  };

  const res = await elevenFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return Buffer.from(await res.arrayBuffer());
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
  } else {
    fs.unlinkSync(rawPath);
  }
}

function decodeToWav(audioPath, wavPath) {
  const decoded = spawnSync(ffmpegPath(), [
    '-y',
    '-i', audioPath,
    '-ar', '44100',
    '-ac', '1',
    '-c:a', 'pcm_s16le',
    wavPath,
  ], { encoding: 'utf8' });

  if (decoded.status !== 0 || !fs.existsSync(wavPath)) {
    fail(`Could not create WAV timing clip ${path.basename(wavPath)}: ${(decoded.stderr || decoded.stdout || '').slice(0, 800)}`);
  }
}

function concatToMp3(clips, outPath) {
  const listPath = `${outPath}.concat.txt`;
  const lines = clips.map((clip) => `file '${clip.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`);
  fs.writeFileSync(listPath, `${lines.join('\n')}\n`, 'utf8');
  const joinedRaw = `${outPath}.joined.mp3`;
  const concat = spawnSync(ffmpegPath(), [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-ar', '44100',
    '-ac', '1',
    '-codec:a', 'libmp3lame',
    '-b:a', '128k',
    joinedRaw,
  ], { encoding: 'utf8' });
  fs.unlinkSync(listPath);
  if (concat.status !== 0 || !fs.existsSync(joinedRaw)) {
    fail(`Could not concatenate audio clips: ${(concat.stderr || concat.stdout || '').slice(0, 800)}`);
  }
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  fs.renameSync(joinedRaw, outPath);
}

async function createAudio({ text, voiceId, modelId, outputFormat, outPath }) {
  const chunks = splitText(text);
  if (!chunks.length) fail('No text chunks to generate.');

  const parts = [];
  for (let index = 0; index < chunks.length; index += 1) {
    console.log(`Generating ElevenLabs chunk ${index + 1}/${chunks.length} (${chunks[index].length} chars)`);
    parts.push(await createAudioChunk({ text: chunks[index], voiceId, modelId, outputFormat }));
  }

  const bytes = Buffer.concat(parts);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const rawPath = `${outPath}.raw.mp3`;
  fs.writeFileSync(rawPath, bytes);
  normalizeMp3(rawPath, outPath);

  const finalSize = fs.statSync(outPath).size;
  console.log(`Wrote ${path.relative(root, outPath)} (${finalSize} bytes)`);
}

async function createSlideAudio({ text, voiceId, modelId, outputFormat, outPath, slideDir }) {
  const chunks = splitLectureSlides(text);
  fs.mkdirSync(slideDir, { recursive: true });
  const wavDir = `${slideDir}-wav`;
  fs.mkdirSync(wavDir, { recursive: true });
  const wavClips = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const clipPath = path.join(slideDir, `slide_${String(index).padStart(2, '0')}.mp3`);
    const wavPath = path.join(wavDir, `slide_${String(index).padStart(2, '0')}.wav`);
    const rawPath = `${clipPath}.raw.mp3`;
    console.log(`Generating slide ${index + 1}/${chunks.length} (${chunks[index].length} chars)`);
    fs.writeFileSync(rawPath, await createAudioChunk({ text: chunks[index], voiceId, modelId, outputFormat }));
    normalizeMp3(rawPath, clipPath);
    decodeToWav(clipPath, wavPath);
    wavClips.push(wavPath);
  }

  concatToMp3(wavClips, outPath);
  console.log(`Wrote ${path.relative(root, outPath)} (${fs.statSync(outPath).size} bytes)`);
  console.log(`Wrote slide timing WAVs in ${path.relative(root, wavDir)}`);
}

function slideIndexFromArg(value) {
  if (!value) return null;
  const aliases = new Map([
    ['intro', 0],
    ['lecture', 1],
    ['rules', 2],
    ['listen', 3],
    ['watch', 4],
    ['phonetics', 5],
    ['repeat', 6],
    ['letterclue', 7],
    ['speak', 8],
    ['match', 9],
    ['soundclue', 10],
    ['animate', 11],
    ['write', 12],
    ['submit', 13],
    ['helpers', 14],
    ['closing', 15],
  ]);
  const normalized = String(value).trim().toLowerCase();
  if (aliases.has(normalized)) return aliases.get(normalized);
  const numeric = Number(normalized);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 16) return numeric - 1;
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 15) return numeric;
  fail(`Unknown slide for --only-slide: ${value}`);
  return null;
}

async function createOneSlideAudio({ text, voiceId, modelId, outputFormat, outPath, slideDir, slideIndex }) {
  const chunks = splitLectureSlides(text);
  if (!Number.isInteger(slideIndex) || slideIndex < 0 || slideIndex >= chunks.length) {
    fail(`Slide index out of range: ${slideIndex}`);
  }

  fs.mkdirSync(slideDir, { recursive: true });
  const wavDir = `${slideDir}-wav`;
  fs.mkdirSync(wavDir, { recursive: true });

  const clipPath = path.join(slideDir, `slide_${String(slideIndex).padStart(2, '0')}.mp3`);
  const wavPath = path.join(wavDir, `slide_${String(slideIndex).padStart(2, '0')}.wav`);
  const rawPath = `${clipPath}.raw.mp3`;
  console.log(`Generating slide ${slideIndex + 1}/${chunks.length} (${chunks[slideIndex].length} chars)`);
  fs.writeFileSync(rawPath, await createAudioChunk({ text: chunks[slideIndex], voiceId, modelId, outputFormat }));
  normalizeMp3(rawPath, clipPath);
  decodeToWav(clipPath, wavPath);

  const wavClips = chunks.map((_chunk, index) => path.join(wavDir, `slide_${String(index).padStart(2, '0')}.wav`));
  const missing = wavClips.filter((clip) => !fs.existsSync(clip));
  if (missing.length) {
    console.warn(`Updated one slide. Skipping full MP3 concat because ${missing.length} WAV timing clips are missing.`);
    return;
  }

  concatToMp3(wavClips, outPath);
  console.log(`Wrote ${path.relative(root, outPath)} (${fs.statSync(outPath).size} bytes)`);
  console.log(`Updated slide timing WAV in ${path.relative(root, wavDir)}`);
}

async function main() {
  if (typeof fetch !== 'function') fail('This script needs Node.js with built-in fetch support.');
  loadDotEnv(path.join(root, '.env'));

  const scriptPath = path.resolve(root, arg('script', 'docs/lecture-scripts/alphabet_lecture_script.txt'));
  const outPath = path.resolve(root, arg('out', 'src/media/messages/lectures/alphabet_lecture_elevenlabs.mp3'));
  const slideDirArg = arg('slide-dir', '');
  const slideDir = slideDirArg ? path.resolve(root, slideDirArg) : '';
  const onlySlide = slideIndexFromArg(arg('only-slide', ''));
  const voiceName = arg('voice', 'Salma');
  const voiceIdArg = arg('voice-id', '');
  const modelId = arg('model', 'eleven_v3');
  const outputFormat = arg('format', 'mp3_44100_128');

  if (!fs.existsSync(scriptPath)) fail(`Script not found: ${scriptPath}`);
  const text = cleanLectureScript(fs.readFileSync(scriptPath, 'utf8'));
  if (!text) fail('Lecture script is empty after cleanup.');

  const voiceId = voiceIdArg || await findVoiceId(voiceName);
  if (slideDir && onlySlide !== null) {
    await createOneSlideAudio({ text, voiceId, modelId, outputFormat, outPath, slideDir, slideIndex: onlySlide });
  } else if (slideDir) {
    await createSlideAudio({ text, voiceId, modelId, outputFormat, outPath, slideDir });
  } else {
    await createAudio({ text, voiceId, modelId, outputFormat, outPath });
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
