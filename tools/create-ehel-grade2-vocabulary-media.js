#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const apiBase = 'https://api.elevenlabs.io/v1';
const defaultVoiceId = 'XfNU2rGpBa01ckF309OY';
const defaultModelId = 'eleven_multilingual_v2';
const prototype = path.join(root, 'src', 'prototypes', 'ehel-academy', 'vocabulary');
const curriculumPath = path.join(prototype, 'grade2-vocabulary.json');
const bundleDirectory = path.join(prototype, 'audio', 'grade2-bundles');
const cuesPath = path.join(prototype, 'audio', 'grade2-audio-cues.json');
const lectureDirectory = path.join(root, 'tmp', 'ehel-grade2-vocabulary-media', 'lecture-audio');
const lectureNarrationsPath = path.join(root, 'tmp', 'ehel-grade2-vocabulary-media', 'lecture-narrations.json');

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

function arg(name, fallback = '') {
  const args = process.argv.slice(2);
  const inline = args.find((item) => item.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : fallback;
}

function fail(message) {
  throw new Error(message);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function elevenRequest(text, voiceId, modelId, withTimestamps = false) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) fail('ELEVENLABS_API_KEY is not set.');
  const suffix = withTimestamps ? '/with-timestamps' : '';
  const url = `${apiBase}/text-to-speech/${encodeURIComponent(voiceId)}${suffix}?output_format=mp3_44100_128`;
  const payload = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: 0.62,
      similarity_boost: 0.82,
      style: 0.18,
      use_speaker_boost: true,
    },
  };

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
      body: JSON.stringify(payload),
    });
    if (response.ok) return withTimestamps ? response.json() : Buffer.from(await response.arrayBuffer());
    const detail = (await response.text()).slice(0, 800);
    if (attempt === 4 || (response.status !== 429 && response.status < 500)) {
      fail(`ElevenLabs request failed (${response.status}): ${detail}`);
    }
    await sleep(attempt * 1500);
  }
  return null;
}

function narrationForUnit(unit) {
  const groupSections = unit.groups.map((group, index) => {
    const samples = group.words.slice(0, 6).map((item) => item.word).join(', ');
    return `Group ${index + 1} is ${group.title}. Listen for words such as ${samples}.`;
  }).join(' ');
  return `Hello, young word explorer. Welcome to Unit ${unit.number}, ${unit.title}. This unit has ${unit.wordCount} vocabulary cards in ${unit.groups.length} learning groups. ${groupSections} For each word, listen and repeat, read five sentences, notice the word type, practise spelling, write your own sentence, and ask the tutor for help. You are ready to begin Unit ${unit.number}.`;
}

function joinSegments(segments) {
  const ranges = [];
  let text = '';
  for (const segment of segments) {
    if (text) text += '\n\n';
    const start = text.length;
    text += segment;
    ranges.push({ start, end: text.length });
  }
  return { text, ranges };
}

function cueForRange(alignment, range) {
  const starts = alignment.character_start_times_seconds || [];
  const ends = alignment.character_end_times_seconds || [];
  const startIndex = Math.min(range.start, starts.length - 1);
  const endIndex = Math.min(Math.max(range.end - 1, startIndex), ends.length - 1);
  if (startIndex < 0 || endIndex < 0 || !Number.isFinite(starts[startIndex]) || !Number.isFinite(ends[endIndex])) {
    fail(`Missing alignment data for character range ${range.start}-${range.end}.`);
  }
  return {
    start: Math.max(0, Number((starts[startIndex] - 0.04).toFixed(3))),
    end: Number((ends[endIndex] + 0.08).toFixed(3)),
  };
}

function readCues() {
  if (!fs.existsSync(cuesPath)) return {};
  return JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
}

function writeCues(cues) {
  fs.mkdirSync(path.dirname(cuesPath), { recursive: true });
  fs.writeFileSync(cuesPath, `${JSON.stringify(cues, null, 2)}\n`, 'utf8');
}

async function generateLectures(curriculum, voiceId, modelId) {
  fs.mkdirSync(lectureDirectory, { recursive: true });
  const narrations = {};
  for (const unit of curriculum.units) {
    const narration = narrationForUnit(unit);
    narrations[unit.id] = narration;
    const output = path.join(lectureDirectory, `unit-${unit.number}.mp3`);
    if (fs.existsSync(output) && fs.statSync(output).size > 0) {
      console.log(`Skipping existing Unit ${unit.number} lecture audio.`);
      continue;
    }
    console.log(`Generating Unit ${unit.number} lecture audio (${narration.length} characters)`);
    fs.writeFileSync(output, await elevenRequest(narration, voiceId, modelId, false));
    console.log(`Wrote ${path.relative(root, output)} (${fs.statSync(output).size} bytes)`);
  }
  fs.mkdirSync(path.dirname(lectureNarrationsPath), { recursive: true });
  fs.writeFileSync(lectureNarrationsPath, `${JSON.stringify(narrations, null, 2)}\n`, 'utf8');
}

async function generateWordBundle(word, cues, voiceId, modelId) {
  const output = path.join(bundleDirectory, `${word.id}.mp3`);
  if (cues[word.id] && fs.existsSync(output) && fs.statSync(output).size > 0) {
    return { skipped: true };
  }
  const segments = [word.word, ...word.sentences];
  const joined = joinSegments(segments);
  const response = await elevenRequest(joined.text, voiceId, modelId, true);
  const alignment = response.alignment || response.normalized_alignment;
  if (!response.audio_base64 || !alignment) fail(`No timestamped audio returned for ${word.id}.`);
  fs.writeFileSync(output, Buffer.from(response.audio_base64, 'base64'));
  const ranges = joined.ranges.map((range) => cueForRange(alignment, range));
  cues[word.id] = { word: ranges[0], sentences: ranges.slice(1) };
  writeCues(cues);
  return { skipped: false, bytes: fs.statSync(output).size };
}

async function generateWords(curriculum, voiceId, modelId, concurrency) {
  fs.mkdirSync(bundleDirectory, { recursive: true });
  const cues = readCues();
  const words = curriculum.units.flatMap((unit) => unit.groups.flatMap((group) => group.words));
  let cursor = 0;
  let completed = 0;
  let generated = 0;

  async function worker(workerNumber) {
    while (cursor < words.length) {
      const index = cursor;
      cursor += 1;
      const word = words[index];
      console.log(`[${index + 1}/${words.length}] Worker ${workerNumber}: ${word.word}`);
      const result = await generateWordBundle(word, cues, voiceId, modelId);
      completed += 1;
      if (!result.skipped) generated += 1;
      if (!result.skipped) console.log(`Wrote ${word.id}.mp3 (${result.bytes} bytes); ${completed}/${words.length} complete`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index + 1)));
  writeCues(cues);
  console.log(`Word bundles complete: ${words.length}; generated ${generated}; reused ${words.length - generated}.`);
}

async function main() {
  if (typeof fetch !== 'function') fail('This script needs Node.js with built-in fetch support.');
  loadDotEnv(path.join(root, '.env'));
  if (!fs.existsSync(curriculumPath)) fail(`Curriculum not found: ${curriculumPath}`);
  const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
  const voiceId = arg('voice-id', defaultVoiceId);
  const modelId = arg('model', defaultModelId);
  const scope = arg('scope', 'all').toLowerCase();
  const concurrency = Math.max(1, Math.min(4, Number(arg('concurrency', '2')) || 2));
  if (!['all', 'lectures', 'words'].includes(scope)) fail(`Unknown scope: ${scope}`);
  console.log(`ElevenLabs voice: ${voiceId}`);
  console.log(`ElevenLabs model: ${modelId}`);
  if (scope === 'all' || scope === 'lectures') await generateLectures(curriculum, voiceId, modelId);
  if (scope === 'all' || scope === 'words') await generateWords(curriculum, voiceId, modelId, concurrency);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
