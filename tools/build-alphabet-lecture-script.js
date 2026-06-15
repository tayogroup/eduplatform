#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();

const requiredMarkers = [
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

function arg(name, fallback) {
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

function normalizeParagraph(paragraph) {
  return String(paragraph || '').replace(/\s+/g, ' ').trim();
}

function buildScript(data) {
  const segments = Array.isArray(data.segments) ? data.segments : [];
  if (segments.length !== 16) {
    fail(`Expected 16 lecture segments, found ${segments.length}.`);
  }

  const body = segments.map((segment, index) => {
    const paragraphs = Array.isArray(segment.paragraphs) ? segment.paragraphs.map(normalizeParagraph).filter(Boolean) : [];
    if (!paragraphs.length) fail(`Segment ${index + 1} (${segment.id || 'unknown'}) has no paragraphs.`);
    if (segment.marker && paragraphs[0] !== segment.marker) {
      fail(`Segment ${segment.id || index + 1} must begin with marker: ${segment.marker}`);
    }
    return paragraphs.join('\n\n');
  }).join('\n\n');

  for (const marker of requiredMarkers) {
    if (!body.includes(marker)) fail(`Missing required narration marker: ${marker}`);
  }

  const header = [
    data.title || 'Alphabet Unit Lecture Script',
    '',
    'Purpose:',
    data.purpose || 'This script explains how a student should use the Alphabet Unit from start to finish.',
    data.usage || 'Use it for the narrated lecture video and for any future voice recording.',
    '',
    'Suggested voice:',
    data.voice || 'Warm, friendly, clear, patient, child-friendly English.',
    '',
    'Script:',
    '',
  ].join('\n');

  return `${header}${body.trim()}\n`;
}

const stepsPath = path.resolve(root, arg('steps', 'docs/lecture-scripts/alphabet_lecture_steps.json'));
const outPath = path.resolve(root, arg('out', 'docs/lecture-scripts/alphabet_lecture_script.txt'));

if (!fs.existsSync(stepsPath)) fail(`Steps file not found: ${stepsPath}`);

const data = JSON.parse(fs.readFileSync(stepsPath, 'utf8'));
const script = buildScript(data);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, script, 'utf8');

console.log(`Wrote ${path.relative(root, outPath)} from ${path.relative(root, stepsPath)}`);
