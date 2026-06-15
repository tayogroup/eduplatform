#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = process.cwd();
const apiUrl = 'https://api.elevenlabs.io/v1/forced-alignment';

const defaultJobs = [
  ['alphabet', 'alphabet_rules.mp3'],
  ['connection-forms', 'joint_rules.mp3'],
  ['harakat', 'harakat_rules.mp3'],
  ['madd', 'madd_rules.mp3'],
  ['maddoleen', 'maddoleen.mp3'],
  ['muqattiat', 'muqattiat_rules.mp3'],
  ['sukoon-jazm', 'sakuun_jazm.mp3'],
  ['tanween-movement', 'tanween_movement_rules.mp3'],
  ['tanween-movement', 'tanween_rules.mp3'],
  ['tashdeed', 'tashdeed_rules.mp3'],
  ['tashdeed-tashdeed', 'tashdeed_with_tashdeed_rules.mp3'],
  ['tashdeed-with-haroof', 'tashdeed_with_haroof_maddah_rules.mp3'],
].map(([unit, audio]) => ({
  unit,
  audioPath: path.join(root, 'src', 'media', 'messages', 'unit_steps', unit, audio),
  transcriptPath: path.join(root, 'src', 'media', 'messages', 'unit_steps', unit, audio.replace(/\.[^.]+$/, '.transcript.txt')),
  outPath: path.join(root, 'src', 'media', 'messages', 'unit_steps', unit, audio.replace(/\.[^.]+$/, '.cues.json')),
}));

function usage() {
  console.log([
    'Usage:',
    '  node tools/generate-rules-cues-elevenlabs.js --unit tanween-movement --audio tanween_rules.mp3',
    '  node tools/generate-rules-cues-elevenlabs.js --audio src/media/messages/unit_steps/tanween-movement/tanween_rules.mp3 --text transcript.txt',
    '  node tools/generate-rules-cues-elevenlabs.js --estimate --audio src/media/messages/unit_steps/tanween-movement/tanween_rules.mp3',
    '  node tools/generate-rules-cues-elevenlabs.js --all',
    '',
    'Required env:',
    '  ELEVENLABS_API_KEY',
    '',
    'Transcript convention:',
    '  Put a sibling transcript beside the audio, e.g. tanween_rules.transcript.txt.',
    '  Optional section markers are allowed and are stripped before alignment:',
    '    [[section:hero]]',
    '    [[section:rule-1]]',
    '    [[section:practice]]',
  ].join('\n'));
}

function arg(name) {
  const args = process.argv.slice(2);
  const prefix = `--${name}=`;
  const found = args.find((item) => item.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  return '';
}

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} not found: ${filePath}`);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.ogg') return 'audio/ogg';
  return 'audio/mpeg';
}

function parseTranscript(raw) {
  const markers = [];
  const estimateEvents = [];
  const utterances = [];
  let clean = '';
  let currentUtterance = null;

  function flushUtterance() {
    if (!currentUtterance || !currentUtterance.parts.length) {
      currentUtterance = null;
      return;
    }
    const text = currentUtterance.parts.join(' ').replace(/\s+/g, ' ').trim();
    if (text) {
      utterances.push({
        type: 'utterance',
        text,
        offset: currentUtterance.offset,
        weight: Math.max(2, text.replace(/[^\p{L}\p{N}\u0600-\u06ff]/gu, '').length),
      });
    }
    currentUtterance = null;
  }

  for (const rawLine of String(raw || '').split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (/^-{3,}$/.test(trimmed)) {
      flushUtterance();
      clean += '\n';
      continue;
    }

    const marker = trimmed.match(/^\[\[section:([a-z0-9_-]+)\]\]$/i);
    if (marker) {
      flushUtterance();
      markers.push({ section: marker[1].toLowerCase(), offset: clean.length });
      continue;
    }

    const pauseCount = (rawLine.match(/\[pause\]/gi) || []).length;
    for (let index = 0; index < pauseCount; index += 1) {
      flushUtterance();
      estimateEvents.push({ type: 'pause', weight: 4.2, offset: clean.length });
    }

    // Strip narration/emotion tags like [pause], [excited], etc.
    const line = rawLine.replace(/\[[^\]]+\]/g, '').trim();
    if (!line) {
      if (/\[[^\]]+\]/.test(rawLine)) flushUtterance();
      clean += '\n';
      continue;
    }

    const pattern = /\S+/g;
    let match = null;
    while ((match = pattern.exec(line))) {
      const token = match[0];
      estimateEvents.push({
        type: 'word',
        text: token,
        offset: clean.length + match.index,
        weight: Math.max(1.5, token.replace(/[^\p{L}\p{N}\u0600-\u06ff]/gu, '').length),
      });
    }
    if (!currentUtterance) {
      currentUtterance = { offset: clean.length, parts: [] };
    }
    currentUtterance.parts.push(line);
    clean += `${line}\n`;
  }
  flushUtterance();

  clean = clean.replace(/\n{3,}/g, '\n\n');
  const leadingWhitespace = (clean.match(/^\s*/) || [''])[0].length;
  return {
    text: clean.trim(),
    markers: markers.map((marker) => ({
      section: marker.section,
      offset: Math.max(0, marker.offset - leadingWhitespace),
    })),
    estimateEvents: estimateEvents.map((event) => ({
      ...event,
      offset: Math.max(0, event.offset - leadingWhitespace),
    })),
    utterances: utterances.map((utterance) => ({
      ...utterance,
      offset: Math.max(0, utterance.offset - leadingWhitespace),
    })),
  };
}

function normalizeWords(alignment) {
  if (!alignment || typeof alignment !== 'object') return [];

  if (Array.isArray(alignment.words)) {
    return alignment.words.map((word) => ({
      text: String(word.text || word.word || '').trim(),
      start: Number(word.start ?? word.start_time ?? word.start_time_seconds),
      end: Number(word.end ?? word.end_time ?? word.end_time_seconds),
      type: word.type || 'word',
    })).filter((word) => word.text && Number.isFinite(word.start) && Number.isFinite(word.end));
  }

  const chars = alignment.characters || alignment.character || [];
  const starts = alignment.character_start_times_seconds || alignment.character_start_times || [];
  const ends = alignment.character_end_times_seconds || alignment.character_end_times || [];
  if (!Array.isArray(chars) || !Array.isArray(starts) || !Array.isArray(ends)) return [];

  const words = [];
  let buffer = '';
  let start = null;
  let end = null;

  chars.forEach((ch, index) => {
    const value = String(ch || '');
    const s = Number(starts[index]);
    const e = Number(ends[index]);
    if (!value || /\s/.test(value)) {
      if (buffer && Number.isFinite(start) && Number.isFinite(end)) {
        words.push({ text: buffer, start, end, type: 'word' });
      }
      buffer = '';
      start = null;
      end = null;
      return;
    }
    if (start == null && Number.isFinite(s)) start = s;
    buffer += value;
    if (Number.isFinite(e)) end = e;
  });

  if (buffer && Number.isFinite(start) && Number.isFinite(end)) {
    words.push({ text: buffer, start, end, type: 'word' });
  }

  return words;
}

function sectionForOffset(offset, markers) {
  if (!markers.length || !Number.isFinite(offset)) return '';
  let section = '';
  for (const marker of markers) {
    if (marker.offset <= offset) section = marker.section;
  }
  return section;
}

function buildCues(words, markers, text) {
  let cursor = 0;
  return words.map((word) => {
    const token = String(word.text || '').trim();
    let offset = Number.isFinite(word.offset) ? word.offset : (token ? text.indexOf(token, cursor) : -1);
    if (offset < 0) offset = cursor;
    cursor = Math.max(cursor, offset + token.length);

    const cue = {
      start: Number(word.start.toFixed(3)),
      end: Number(word.end.toFixed(3)),
      text: token,
    };
    const section = sectionForOffset(offset, markers);
    if (section) cue.section = section;
    return cue;
  });
}

function buildSectionCues(cues) {
  const order = ['hero', 'rule-1', 'rule-2', 'rule-3', 'rule-4', 'rule-5', 'rule-6', 'rule-7', 'rule-8', 'rule-9', 'practice', 'remember'];
  return order.map((section) => {
    const group = cues.filter((cue) => cue.section === section);
    if (!group.length) return null;
    return {
      start: Number(group[0].start.toFixed(3)),
      end: Number(group[group.length - 1].end.toFixed(3)),
      text: section,
      section,
      type: 'section',
    };
  }).filter(Boolean);
}

function extendLastCueToDuration(cues, durationSeconds) {
  if (!Array.isArray(cues) || !cues.length) return cues;
  const duration = Number(durationSeconds);
  if (!Number.isFinite(duration) || duration <= 0) return cues;
  const last = cues[cues.length - 1];
  if (!last || !Number.isFinite(Number(last.end)) || duration <= Number(last.end)) return cues;
  last.end = Number(duration.toFixed(3));
  return cues;
}

function buildUtteranceCues(utterances, speechRegions, markers) {
  if (!Array.isArray(utterances) || !utterances.length || !Array.isArray(speechRegions) || !speechRegions.length) return [];
  return utterances.map((utterance, index) => {
    const region = speechRegions[Math.min(index, speechRegions.length - 1)];
    if (!region) return null;
    const cue = {
      start: Number(region.start.toFixed(3)),
      end: Number(region.end.toFixed(3)),
      text: String(utterance.text || '').trim(),
      type: 'utterance',
      offset: utterance.offset,
    };
    const section = sectionForOffset(utterance.offset, markers);
    if (section) cue.section = section;
    return cue.text ? cue : null;
  }).filter(Boolean);
}

function applyUnitCueTweaks(job, utteranceCues) {
  if (!Array.isArray(utteranceCues) || !utteranceCues.length) return utteranceCues;
  const audioName = path.basename(job && job.audioPath ? job.audioPath : '').toLowerCase();
  if (audioName !== 'tanween_rules.mp3') return utteranceCues;

  const rule2 = utteranceCues.filter((cue) => cue.section === 'rule-2');
  const rule3 = utteranceCues.filter((cue) => cue.section === 'rule-3');
  if (rule2.length >= 11) {
    const damm = rule2[8];
    const example = rule2[9];
    const kitabun = rule2[10];
    Object.assign(damm, { start: 78.8, end: 82.018 });
    Object.assign(example, { start: 83.45, end: 86.129 });
    Object.assign(kitabun, { start: 87.354, end: 88.405 });
  }

  if (rule3.length >= 10) {
    [
      [89.978, 91.176],
      [92.2, 94.617],
      [95.657, 97.381],
      [98.504, 98.974],
      [100.108, 100.75],
      [101.926, 102.597],
      [103.944, 104.594],
      [105.762, 106.408],
      [107.824, 108.479],
      [109.551, 113.457],
    ].forEach((range, index) => {
      rule3[index].start = range[0];
      rule3[index].end = range[1];
    });
  }

  const rule4 = utteranceCues.filter((cue) => cue.section === 'rule-4');
  if (rule4.length >= 9) {
    [
      [115.067, 116.318],
      [117.493, 120.672],
      [121.845, 124.633],
      [125.79, 126.792],
      [128.102, 129.226],
      [130.398, 131.578],
      [133.073, 134.139],
      [135.311, 136.393],
      [137.169, 138.272],
    ].forEach((range, index) => {
      rule4[index].start = range[0];
      rule4[index].end = range[1];
    });
  }

  const rule5 = utteranceCues.filter((cue) => cue.section === 'rule-5');
  if (rule5.length && Number(rule5[0].start) < 139.7) {
    const delta = 140.256 - Number(rule5[0].start);
    utteranceCues.forEach((cue) => {
      const section = String(cue.section || '');
      if (/^(rule-[5-9]|practice|remember)$/.test(section)) {
        cue.start = Number((Number(cue.start) + delta).toFixed(3));
        cue.end = Number((Number(cue.end) + delta).toFixed(3));
      }
    });
  }

  const rule6 = utteranceCues.filter((cue) => cue.section === 'rule-6');
  if (rule6.length >= 7) {
    [
      [161.986, 163.087],
      [164.588, 167.309],
      [168.75, 169.45],
      [170.39, 171.151],
      [174.976, 175.716],
      [177.217, 178.038],
      [179.178, 181.019],
    ].forEach((range, index) => {
      rule6[index].start = range[0];
      rule6[index].end = range[1];
    });
  }

  const rule7 = utteranceCues.filter((cue) => cue.section === 'rule-7');
  if (rule7.length >= 6) {
    [
      [182.821, 184.001],
      [185.022, 186.783],
      [188.103, 190.105],
      [191.485, 193.687],
      [195.047, 199.15],
      [200.29, 202.912],
    ].forEach((range, index) => {
      rule7[index].start = range[0];
      rule7[index].end = range[1];
    });
  }

  const rule8 = utteranceCues.filter((cue) => cue.section === 'rule-8');
  if (rule8.length >= 11) {
    [
      [204.7, 205.781],
      [206.761, 210.583],
      [211.744, 214.405],
      [215.826, 218.788],
      [220.269, 222.63],
      [224.151, 225.071],
      [226.532, 229.314],
      [230.675, 232.936],
      [234.484, 235.601],
      [236.757, 239.727],
      [240.839, 243.742],
    ].forEach((range, index) => {
      rule8[index].start = range[0];
      rule8[index].end = range[1];
    });
  }

  const rule9 = utteranceCues.filter((cue) => cue.section === 'rule-9');
  if (rule9.length && Number(rule9[0].start) < 245) {
    const delta = 245.643 - Number(rule9[0].start);
    utteranceCues.forEach((cue) => {
      const section = String(cue.section || '');
      if (/^(rule-9|practice|remember)$/.test(section)) {
        cue.start = Number((Number(cue.start) + delta).toFixed(3));
        cue.end = Number((Number(cue.end) + delta).toFixed(3));
      }
    });
  }

  const practice = utteranceCues.filter((cue) => cue.section === 'practice');
  if (practice.length >= 13) {
    [
      [260.833, 261.674],
      [262.994, 264.175],
      [265.456, 265.956],
      [266.016, 266.296],
      [266.316, 268.338],
      [268.398, 268.758],
      [270.179, 271.099],
      [271.119, 271.2],
      [272.6, 273.141],
      [273.161, 273.521],
      [273.541, 273.621],
      [275.002, 275.803],
      [275.823, 276.023],
      [277.35, 278.15],
      [279.15, 280.05],
      [281.05, 281.95],
    ].forEach((range, index) => {
      practice[index].start = range[0];
      practice[index].end = range[1];
    });
  }

  const visibleTextBySection = {
    hero: [
      'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.',
      'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.',
      'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.',
      'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.',
      'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.',
      'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.',
      'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.',
      'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.',
    ],
    'rule-1': [
      'Rule Number One!',
      'Tanween makes the "n" sound. Listen carefully:',
      'Tanween makes the "n" sound. Listen carefully:',
      'كِتَابٌ — Kitābun.',
      'كِتَابٌ — Kitābun.',
      'كِتَابٍ — Kitābin.',
      'كِتَابٍ — Kitābin.',
      'كِتَابًا — Kitāban.',
      'كِتَابًا — Kitāban.',
      'Notice the light "n" sound at the end of each word.',
    ],
    'rule-2': [
      'Rule Number Two!',
      'There are three types of Tanween. Tanween Fatḥ makes the sound "an," as in:',
      'There are three types of Tanween. Tanween Fatḥ makes the sound "an," as in:',
      'كِتَابًا — Kitāban.',
      'كِتَابًا — Kitāban.',
      'Tanween Kasr makes the sound "in," as in:',
      'كِتَابٍ — Kitābin.',
      'كِتَابٍ — Kitābin.',
      'Tanween Ḍamm makes the sound "un," as in:',
      'كِتَابٌ — Kitābun.',
      'كِتَابٌ — Kitābun.',
    ],
    'rule-3': [
      'Rule Number Three!',
      'Read the two Harakah marks together because they make one sound. Listen:',
      'Read the two Harakah marks together because they make one sound. Listen:',
      'Read the two Harakah marks together because they make one sound. Listen:',
      'بٌ — Bun.',
      'بٌ — Bun.',
      'بٍ — Bin.',
      'بٍ — Bin.',
      'بً — Ban.',
      'بً — Ban.',
      'Do not read the two marks separately.',
    ],
    'rule-4': [
      'Rule Number Four!',
      'Tanween is always read at the end of a word. For example:',
      'Tanween is always read at the end of a word. For example:',
      'مُسْلِمٌ — Muslimun.',
      'مُسْلِمٌ — Muslimun.',
      'رَحِيمٍ — Raḥīmin.',
      'رَحِيمٍ — Raḥīmin.',
      'عَلِيمًا — ʿAlīman.',
      'عَلِيمًا — ʿAlīman.',
      'Read the Tanween after the last letter.',
    ],
    'rule-5': [
      'Rule Number Five!',
      'Tanween Fatḥ often has an extra Alif. For example:',
      'كِتَابًا — Kitāban.',
      'كِتَابًا — Kitāban.',
      'The Alif helps show the Tanween, but do not read the Alif separately.',
      'The Alif helps show the Tanween, but do not read the Alif separately.',
    ],
    'rule-6': [
      'Rule Number Six!',
      'Some words do not have the extra Alif. For example:',
      'رَحْمَةً — Raḥmatan.',
      'رَحْمَةً — Raḥmatan.',
      'شَيْئًا — Shay\'an.',
      'شَيْئًا — Shay\'an.',
      'Read the Tanween normally.',
    ],
    'rule-7': [
      'Rule Number Seven!',
      'Read Tanween clearly. Listen:',
      'بٌ — Bun.',
      'بٌ — Bun.',
      'بٍ — Bin.',
      'بٍ — Bin.',
      'بً — Ban.',
      'بً — Ban.',
      'Make the "n" sound easy to hear.',
    ],
    'rule-8': [
      'Rule Number Eight!',
      'When stopping, the Tanween sound usually disappears.',
      'For example, كِتَابٌ is read as Kitābun when continuing, but Kitāb when stopping.',
      'For example, كِتَابٌ is read as Kitābun when continuing, but Kitāb when stopping.',
      'For example, كِتَابٌ is read as Kitābun when continuing, but Kitāb when stopping.',
      'For example, كِتَابٌ is read as Kitābun when continuing, but Kitāb when stopping.',
      'كِتَابٍ is read as Kitābin when continuing, but Kitāb when stopping.',
      'كِتَابٍ is read as Kitābin when continuing, but Kitāb when stopping.',
      'كِتَابٍ is read as Kitābin when continuing, but Kitāb when stopping.',
      'كِتَابًا is read as Kitāban when continuing, but Kitābā when stopping.',
      'كِتَابًا is read as Kitāban when continuing, but Kitābā when stopping.',
    ],
    'rule-9': [
      'Rule Number Nine!',
      'Read Tanween smoothly and gently. Do not rush. Give every Tanween its proper sound and pronounce the "n" clearly.',
      'Read Tanween smoothly and gently. Do not rush. Give every Tanween its proper sound and pronounce the "n" clearly.',
      'Read Tanween smoothly and gently. Do not rush. Give every Tanween its proper sound and pronounce the "n" clearly.',
      'Read Tanween smoothly and gently. Do not rush. Give every Tanween its proper sound and pronounce the "n" clearly.',
    ],
  };

  Object.entries(visibleTextBySection).forEach(([section, texts]) => {
    utteranceCues.filter((cue) => cue.section === section).forEach((cue, index) => {
      if (texts[index]) cue.text = texts[index];
    });
  });

  const remember = utteranceCues.filter((cue) => cue.section === 'remember');
  if (remember.length >= 9) {
    [
      [300.167, 300.947],
      [301.788, 304.63],
      [305.791, 309.894],
      [311.115, 313.517],
      [314.617, 317.84],
      [318.992, 322.963],
      [324.226, 327.154],
      [328.537, 329.4],
      [330.061, 331.305],
    ].forEach((range, index) => {
      remember[index].start = range[0];
      remember[index].end = range[1];
    });
  }

  return utteranceCues;
}

function mergeSpeechRegionsForUtterances(speechRegions, utteranceCount) {
  const target = Number(utteranceCount);
  const regions = Array.isArray(speechRegions)
    ? speechRegions.map((region) => ({
      start: Number(region.start),
      end: Number(region.end),
    })).filter((region) => Number.isFinite(region.start) && Number.isFinite(region.end) && region.end > region.start)
    : [];
  if (!Number.isFinite(target) || target <= 0 || regions.length <= target) return regions;

  while (regions.length > target) {
    let mergeAt = 0;
    let smallestGap = Infinity;
    for (let index = 0; index < regions.length - 1; index += 1) {
      const gap = regions[index + 1].start - regions[index].end;
      if (gap < smallestGap) {
        smallestGap = gap;
        mergeAt = index;
      }
    }

    regions[mergeAt] = {
      start: regions[mergeAt].start,
      end: regions[mergeAt + 1].end,
    };
    regions.splice(mergeAt + 1, 1);
  }

  return regions;
}

function getAudioDurationSeconds(audioPath) {
  const explicit = Number(arg('duration'));
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';
  const probe = spawnSync(ffprobe, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    audioPath,
  ], { encoding: 'utf8' });

  const duration = Number(String(probe.stdout || '').trim());
  if (Number.isFinite(duration) && duration > 0) return duration;
  fail('Could not determine audio duration. Set FFPROBE_PATH or pass --duration=<seconds>.');
}

function getSpeechRegions(audioPath, durationSeconds) {
  const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
  const detected = spawnSync(ffmpeg, [
    '-hide_banner',
    '-i', audioPath,
    '-af', 'silencedetect=noise=-35dB:d=0.25',
    '-f', 'null',
    '-',
  ], { encoding: 'utf8' });
  const output = `${detected.stdout || ''}\n${detected.stderr || ''}`;
  const events = [];
  for (const line of output.split(/\r?\n/)) {
    const start = line.match(/silence_start:\s*([0-9.]+)/);
    if (start) {
      events.push({ type: 'start', time: Number(start[1]) });
      continue;
    }
    const end = line.match(/silence_end:\s*([0-9.]+)/);
    if (end) events.push({ type: 'end', time: Number(end[1]) });
  }
  if (!events.length) return [];

  const regions = [];
  let cursor = 0;
  for (const event of events) {
    if (!Number.isFinite(event.time)) continue;
    if (event.type === 'start') {
      if (event.time - cursor >= 0.12) regions.push({ start: cursor, end: event.time });
    } else {
      cursor = event.time;
    }
  }
  if (Number(durationSeconds) - cursor >= 0.12) regions.push({ start: cursor, end: Number(durationSeconds) });
  return regions.filter((region) => region.end > region.start);
}

function splitUtteranceWords(utterance, region) {
  const tokens = [];
  const pattern = /\S+/g;
  let match = null;
  while ((match = pattern.exec(utterance.text))) {
    const token = match[0];
    tokens.push({
      text: token,
      offset: utterance.offset + match.index,
      weight: Math.max(1.5, token.replace(/[^\p{L}\p{N}\u0600-\u06ff]/gu, '').length),
    });
  }
  if (!tokens.length) return [];

  const words = [];
  const duration = Math.max(0.12, region.end - region.start);
  const totalWeight = tokens.reduce((sum, token) => sum + token.weight, 0);
  let time = region.start;
  tokens.forEach((token, index) => {
    const last = index === tokens.length - 1;
    const span = last ? Math.max(0.08, region.end - time) : Math.max(0.08, (token.weight / totalWeight) * duration);
    const end = last ? region.end : Math.min(region.end, time + span);
    words.push({
      text: token.text,
      start: time,
      end,
      type: 'estimated-silence-word',
      offset: token.offset,
    });
    time = end;
  });
  return words;
}

function estimateWordsFromSpeechRegions(utterances, speechRegions) {
  if (!Array.isArray(utterances) || !utterances.length || !Array.isArray(speechRegions) || !speechRegions.length) return [];
  const words = [];
  utterances.forEach((utterance, index) => {
    const region = speechRegions[Math.min(index, speechRegions.length - 1)];
    if (region) words.push(...splitUtteranceWords(utterance, region));
  });
  return words;
}

function estimateWords(text, durationSeconds, estimateEvents, utterances, speechRegions) {
  const speechWords = estimateWordsFromSpeechRegions(utterances, speechRegions);
  if (speechWords.length) return speechWords;

  const tokens = (Array.isArray(estimateEvents) ? estimateEvents : []).filter((event) => event && event.type);
  if (!tokens.length) return [];

  const totalWeight = tokens.reduce((sum, token) => sum + token.weight, 0);
  const usableDuration = Math.max(1, Number(durationSeconds) - 0.6);
  let time = 0.25;

  const words = [];
  tokens.forEach((token) => {
    const span = Math.max(0.18, (token.weight / totalWeight) * usableDuration);
    if (token.type === 'pause') {
      time = Math.min(durationSeconds, time + span);
      return;
    }
    const word = {
      text: token.text,
      start: time,
      end: Math.min(durationSeconds, time + span),
      type: 'estimated-word',
      offset: token.offset,
    };
    words.push(word);
    time = word.end;
  });
  return words;
}

async function callElevenLabs(audioPath, text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) fail('ELEVENLABS_API_KEY is not set.');
  if (typeof fetch !== 'function' || typeof FormData !== 'function' || typeof Blob !== 'function') {
    fail('This script needs Node.js with built-in fetch/FormData/Blob support.');
  }

  const bytes = fs.readFileSync(audioPath);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mimeFor(audioPath) }), path.basename(audioPath));
  form.append('text', text);

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'xi-api-key': key },
    body: form,
  });

  const body = await res.text();
  if (!res.ok) {
    fail(`ElevenLabs forced alignment failed (${res.status}): ${body.slice(0, 500)}`);
  }
  return JSON.parse(body);
}

async function runJob(job) {
  ensureFile(job.audioPath, 'Audio');
  ensureFile(job.transcriptPath, 'Transcript');

  const parsed = parseTranscript(fs.readFileSync(job.transcriptPath, 'utf8'));
  if (!parsed.text) fail(`Transcript is empty after tag stripping: ${job.transcriptPath}`);

  const estimate = hasFlag('estimate');
  console.log(`${estimate ? 'Estimating' : 'Aligning'} ${path.relative(root, job.audioPath)}`);
  const alignment = estimate ? null : await callElevenLabs(job.audioPath, parsed.text);
  const durationSeconds = estimate ? getAudioDurationSeconds(job.audioPath) : 0;
  const speechRegions = estimate ? getSpeechRegions(job.audioPath, durationSeconds) : [];
  const utteranceRegions = estimate
    ? mergeSpeechRegionsForUtterances(speechRegions, parsed.utterances.length)
    : [];
  let utteranceCues = estimate
    ? buildUtteranceCues(parsed.utterances, utteranceRegions, parsed.markers)
    : undefined;
  if (estimate) utteranceCues = applyUnitCueTweaks(job, utteranceCues);
  const words = estimate
    ? estimateWords(parsed.text, durationSeconds, parsed.estimateEvents, parsed.utterances, speechRegions)
    : normalizeWords(alignment);
  const cues = buildCues(words, parsed.markers, parsed.text);

  const output = {
    version: 1,
    provider: estimate ? 'local-silence-word-alignment' : 'elevenlabs-forced-alignment',
    generatedAt: new Date().toISOString(),
    audio: path.basename(job.audioPath),
    transcript: path.basename(job.transcriptPath),
    transcriptSha256: sha256(parsed.text),
    loss: alignment ? (alignment.loss ?? null) : null,
    wordCueReliable: !estimate,
    speechRegions: estimate ? speechRegions : undefined,
    utteranceRegions: estimate ? utteranceRegions : undefined,
    sectionCues: estimate ? extendLastCueToDuration(buildSectionCues(utteranceCues), durationSeconds) : undefined,
    utteranceCues: estimate ? extendLastCueToDuration(utteranceCues, durationSeconds) : undefined,
    cues,
    words,
  };

  fs.writeFileSync(job.outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${path.relative(root, job.outPath)} (${cues.length} cues)`);
}

async function main() {
  if (hasFlag('help') || process.argv.length <= 2) {
    usage();
    return;
  }

  let jobs = [];
  if (hasFlag('all')) {
    jobs = defaultJobs;
  } else if (arg('audio')) {
    const audioPath = path.resolve(root, arg('audio'));
    jobs = [{
      unit: arg('unit') || path.basename(path.dirname(audioPath)),
      audioPath,
      transcriptPath: path.resolve(root, arg('text') || audioPath.replace(/\.[^.]+$/, '.transcript.txt')),
      outPath: path.resolve(root, arg('out') || audioPath.replace(/\.[^.]+$/, '.cues.json')),
    }];
  } else if (arg('unit')) {
    const unit = arg('unit');
    jobs = defaultJobs.filter((job) => job.unit === unit);
    if (arg('file')) {
      jobs = jobs.filter((job) => path.basename(job.audioPath) === arg('file'));
    }
  }

  if (!jobs.length) fail('No cue-generation jobs matched the provided arguments.');
  for (const job of jobs) {
    await runJob(job);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
