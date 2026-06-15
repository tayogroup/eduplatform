#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourceJsonPath = process.argv[2] || 'C:/Users/inawa/Downloads/tanween_rules2.json';
const transcriptPath = path.join(root, 'src/media/messages/unit_steps/tanween-movement/tanween_rules2.transcript.txt');
const outPath = path.join(root, 'src/media/messages/unit_steps/tanween-movement/tanween_rules2.cues.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function rounded(value) {
  return Number(Number(value).toFixed(3));
}

function splitRange(section, start, end, texts, cues) {
  const gap = 0.08;
  const totalGap = gap * Math.max(0, texts.length - 1);
  const width = Math.max(0.05, (end - start - totalGap) / texts.length);
  let cursor = start;
  texts.forEach((text) => {
    cues.push({
      start: rounded(cursor),
      end: rounded(cursor + width),
      text,
      type: 'utterance',
      section,
    });
    cursor += width + gap;
  });
}

function add(cues, section, text, start, end) {
  cues.push({
    start: rounded(start),
    end: rounded(end),
    text,
    type: 'utterance',
    section,
  });
}

function segment(source, index) {
  const item = source.segments[index];
  if (!item) throw new Error(`Missing JSON segment ${index}`);
  return item;
}

const source = readJson(sourceJsonPath);
const transcript = fs.readFileSync(transcriptPath, 'utf8');
const cues = [];
const s = (index) => segment(source, index);

const heroText = 'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.';

add(cues, 'hero', heroText, s(0).start, s(5).end);

add(cues, 'rule-1', 'Rule Number One!', s(6).start, s(6).end);
add(cues, 'rule-1', 'Tanween makes the "n" sound. Listen carefully:', s(7).start, s(8).end);
splitRange('rule-1', s(9).start, s(9).end, [
  'كِتَابٌ — Kitābun.',
  'كِتَابٍ — Kitābin.',
  'كِتَابًا — Kitāban.',
  'Notice the light "n" sound at the end of each word.',
], cues);

add(cues, 'rule-2', 'Rule Number Two!', s(10).start, s(10).end);
add(cues, 'rule-2', 'There are three types of Tanween. Tanween Fatḥ makes the sound "an," as in:', s(11).start, s(11).end);
splitRange('rule-2', s(12).start, s(13).end, [
  'كِتَابًا — Kitāban.',
  'Tanween Kasr makes the sound "in," as in:',
  'كِتَابٍ — Kitābin.',
  'Tanween Ḍamm makes the sound "un," as in:',
  'كِتَابٌ — Kitābun.',
], cues);

add(cues, 'rule-3', 'Rule Number Three!', s(14).start, s(14).end);
add(cues, 'rule-3', 'Read the two Harakah marks together because they make one sound. Listen:', s(15).start, s(16).end);
add(cues, 'rule-3', 'بٌ — Bun.', s(17).start, s(18).end);
add(cues, 'rule-3', 'بٍ — Bin.', s(19).start, s(20).end);
add(cues, 'rule-3', 'بً — Ban.', s(21).start, s(22).end);
add(cues, 'rule-3', 'Do not read the two marks separately.', s(23).start, s(23).end);

add(cues, 'rule-4', 'Rule Number Four!', s(24).start, s(24).end);
add(cues, 'rule-4', 'Tanween is always read at the end of a word. For example:', s(25).start, s(25).end);
splitRange('rule-4', s(26).start, s(26).end, [
  'مُسْلِمٌ — Muslimun.',
  'رَحِيمٍ — Raḥīmin.',
  'عَلِيمًا — ʿAlīman.',
  'Read the Tanween after the last letter.',
], cues);

add(cues, 'rule-5', 'Rule Number Five!', s(27).start, s(27).end);
add(cues, 'rule-5', 'Tanween Fatḥ often has an extra Alif. For example:', s(28).start, s(28).end);
add(cues, 'rule-5', 'كِتَابًا — Kitāban.', s(29).start, s(29).end);
add(cues, 'rule-5', 'The Alif helps show the Tanween, but do not read the Alif separately.', s(30).start, s(30).end);

add(cues, 'rule-6', 'Rule Number Six!', s(31).start, s(31).end);
add(cues, 'rule-6', 'Some words do not have the extra Alif. For example:', s(32).start, s(32).end);
splitRange('rule-6', s(33).start, s(33).end, [
  'رَحْمَةً — Raḥmatan.',
  'شَيْئًا — Shay\'an.',
  'Read the Tanween normally.',
], cues);

add(cues, 'rule-7', 'Rule Number Seven!', s(34).start, 191.914);
add(cues, 'rule-7', 'Read Tanween clearly.', 193.594, s(34).end);
add(cues, 'rule-7', 'Listen.', s(35).start, s(35).end);
add(cues, 'rule-7', 'بٌ — Bun.', s(36).start, s(36).end);
add(cues, 'rule-7', 'بٍ — Bin.', 206.752, 207.252);
add(cues, 'rule-7', 'بً — Ban.', 208.513, 209.113);
add(cues, 'rule-7', 'Make the "n" sound easy to hear.', 210.434, s(37).end);

add(cues, 'rule-8', 'Rule Number Eight!', s(38).start, 215.597);
add(cues, 'rule-8', 'When stopping,', 217.118, 217.898);
add(cues, 'rule-8', 'the Tanween sound usually disappears. For example,', 218.459, 223.041);
splitRange('rule-8', 224.322, s(39).end, [
  'كِتَابٌ is read as Kitābun',
  'when continuing,',
  'but Kitāb',
  'when stopping.',
], cues);
splitRange('rule-8', s(40).start, s(40).end, [
  'كِتَابٍ is read as Kitābin',
  'when continuing,',
  'but Kitāb',
  'when stopping.',
], cues);
splitRange('rule-8', s(41).start, s(41).end, [
  'كِتَابًا is read as Kitāban',
  'when continuing,',
  'but Kitābā',
  'when stopping.',
], cues);

add(cues, 'rule-9', 'Rule Number Nine!', s(42).start, s(42).end);
add(cues, 'rule-9', 'Read Tanween smoothly and gently. Do not rush. Give every Tanween its proper sound and pronounce the "n" clearly.', s(43).start, s(45).end);

add(cues, 'practice', 'Let\'s Practice!', s(46).start, s(46).end);
add(cues, 'practice', 'Tanween Fatḥ.', s(47).start, s(47).end);
add(cues, 'practice', 'كِتَابًا', s(48).start, s(48).end);
add(cues, 'practice', 'عَلِيمًا', s(49).start, s(49).end);
add(cues, 'practice', 'حَكِيمًا', s(50).start, s(50).end);
add(cues, 'practice', 'سَمِيعًا', s(51).start, s(51).end);
add(cues, 'practice', 'Tanween Kasr.', s(52).start, s(52).end);
add(cues, 'practice', 'كِتَابٍ', s(53).start, s(53).end);

add(cues, 'remember', 'Let\'s remember.', s(54).start, s(54).end);
add(cues, 'remember', 'Tanween adds a light "n" sound.', s(55).start, s(55).end);
add(cues, 'remember', 'There are three types.', s(56).start, s(56).end);
add(cues, 'remember', 'Read Tanween at the end of the word.', s(57).start, s(57).end);
add(cues, 'remember', 'Tanween Fatḥ often has an extra Alif.', s(58).start, s(58).end);
add(cues, 'remember', 'When stopping, the Tanween sound usually disappears.', s(59).start, s(59).end);
add(cues, 'remember', 'Read clearly, smoothly, and beautifully.', s(60).start, s(60).end);
add(cues, 'remember', 'Excellent work!', s(61).start, s(61).end);
add(cues, 'remember', 'See you in the next lesson.', s(62).start, s(62).end);

const order = ['hero', 'rule-1', 'rule-2', 'rule-3', 'rule-4', 'rule-5', 'rule-6', 'rule-7', 'rule-8', 'rule-9', 'practice', 'remember'];
const sectionCues = order.map((section) => {
  const group = cues.filter((cue) => cue.section === section);
  if (!group.length) return null;
  return {
    start: group[0].start,
    end: group[group.length - 1].end,
    text: section,
    section,
    type: 'section',
  };
}).filter(Boolean);

const words = [];
(source.segments || []).forEach((item) => {
  (item.words || []).forEach((word) => {
    const text = String(word.word || '').trim();
    const start = Number(word.start);
    const end = Number(word.end);
    if (!text || !Number.isFinite(start) || !Number.isFinite(end)) return;
    const sectionCue = sectionCues.find((cue) => start >= cue.start && start < cue.end);
    words.push({
      start: rounded(start),
      end: rounded(end),
      text,
      section: sectionCue ? sectionCue.section : '',
      type: 'word',
    });
  });
});

const output = {
  version: 1,
  provider: 'whisper-json-segment-alignment',
  generatedAt: new Date().toISOString(),
  audio: 'tanween_rules2.mp3',
  transcript: 'tanween_rules2.transcript.txt',
  transcriptSha256: crypto.createHash('sha256').update(transcript).digest('hex'),
  sourceJson: path.basename(sourceJsonPath),
  wordCueReliable: false,
  highlightDelaySeconds: 0,
  cues: words,
  sectionCues,
  utteranceCues: cues,
};

fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath} with ${cues.length} utterance cues and ${words.length} word cues.`);
