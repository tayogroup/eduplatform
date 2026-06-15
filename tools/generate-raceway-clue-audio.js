#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const apiBase = 'https://api.elevenlabs.io/v1';
const outDir = path.join(root, 'src', 'media', 'games', 'arabic-letter-raceway', 'clues');
const modes = ['starter', 'alphabet', 'heavy', 'light', 'vowels', 'dots', 'mouth'];
const raceQuestionCount = 30;

function arg(name, fallback = '') {
  const args = process.argv.slice(2);
  const prefix = `--${name}=`;
  const found = args.find((item) => item.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  return fallback;
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const letters = [
  {id:'alif',name:'Alif',dots:0,place:'throat opening'},
  {id:'baa',name:'Ba',dots:1,place:'two lips'},
  {id:'taa',name:'Ta',dots:2,place:'tongue tip'},
  {id:'thaa',name:'Tha',dots:3,place:'tongue and teeth'},
  {id:'jeem',name:'Jeem',dots:1,place:'middle tongue'},
  {id:'haa',name:'Haa',dots:0,place:'middle throat'},
  {id:'khaa',name:'Kha',dots:1,place:'upper throat'},
  {id:'daal',name:'Dal',dots:0,place:'tongue tip'},
  {id:'dhaal',name:'Dhal',dots:1,place:'tongue and teeth'},
  {id:'raa',name:'Ra',dots:0,place:'tongue tip'},
  {id:'zay',name:'Zay',dots:1,place:'front tongue'},
  {id:'seen',name:'Seen',dots:0,place:'front tongue'},
  {id:'sheen',name:'Sheen',dots:3,place:'middle tongue'},
  {id:'saad',name:'Sad',dots:0,place:'tongue tip'},
  {id:'daad',name:'Dad',dots:1,place:'side tongue'},
  {id:'taa-heavy',name:'Taa',dots:0,place:'tongue tip'},
  {id:'zaa-heavy',name:'Dhaa',dots:1,place:'tongue and teeth'},
  {id:'ayn',name:'Ayn',dots:0,place:'middle throat'},
  {id:'ghayn',name:'Ghayn',dots:1,place:'upper throat'},
  {id:'faa',name:'Fa',dots:1,place:'lip and teeth'},
  {id:'qaaf',name:'Qaf',dots:2,place:'back tongue'},
  {id:'kaaf',name:'Kaf',dots:0,place:'back tongue'},
  {id:'laam',name:'Lam',dots:0,place:'tongue tip'},
  {id:'meem',name:'Meem',dots:0,place:'two lips'},
  {id:'noon',name:'Noon',dots:1,place:'tongue tip'},
  {id:'haa-soft',name:'Ha',dots:0,place:'deep throat'},
  {id:'waw',name:'Waw',dots:0,place:'rounded lips'},
  {id:'yaa',name:'Ya',dots:2,place:'middle tongue'},
];

const heavyIds = new Set(['khaa', 'saad', 'daad', 'taa-heavy', 'zaa-heavy', 'ghayn', 'qaaf']);
const vowelIds = new Set(['alif', 'waw', 'yaa']);

function isHeavyLetter(item) {
  return item && heavyIds.has(item.id);
}

function isVowelLetter(item) {
  return item && vowelIds.has(item.id);
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function modeLetters(mode) {
  if (mode === 'starter') {
    const starter = new Set(['alif','baa','taa','jeem','haa','khaa','raa','seen','sheen','faa','qaaf','meem','noon','waw','yaa']);
    return letters.filter((item) => starter.has(item.id));
  }
  if (mode === 'heavy') return letters.filter(isHeavyLetter);
  if (mode === 'light') return letters.filter((item) => !isHeavyLetter(item));
  if (mode === 'vowels') return letters.filter(isVowelLetter);
  if (mode === 'dots') return letters.filter((item) => item.dots > 0);
  if (mode === 'mouth') return letters.filter((item) => /throat|tongue|lips|teeth/.test(item.place));
  return letters;
}

function pickCycled(items, index, fallback) {
  const pool = items.length ? items : fallback;
  return pool[index % pool.length];
}

function questionKindForMode(mode, index, target) {
  if (mode === 'heavy') return index % 2 === 0 ? 'heavy' : 'sound';
  if (mode === 'light') return index % 2 === 0 ? 'light' : 'mouth';
  if (mode === 'vowels') return index % 2 === 0 ? 'vowel' : 'general';
  if (mode === 'dots') return index % 2 === 0 ? 'dots' : 'sound';
  if (mode === 'mouth') return index % 2 === 0 ? 'mouth' : 'sound';
  const cycle = ['sound', 'mouth', 'dots', 'heavy', 'light', 'vowel', 'general'];
  let kind = cycle[index % cycle.length];
  if (kind === 'heavy' && !isHeavyLetter(target)) kind = 'general';
  if (kind === 'light' && isHeavyLetter(target)) kind = 'mouth';
  if (kind === 'vowel' && !isVowelLetter(target)) kind = 'sound';
  return kind;
}

function buildQuestionDeck(mode) {
  const base = uniqueById(modeLetters(mode));
  const heavy = base.filter(isHeavyLetter);
  const light = base.filter((item) => !isHeavyLetter(item));
  const vowels = base.filter(isVowelLetter);
  const dotted = base.filter((item) => item.dots > 0);
  const buckets = {
    sound: base,
    mouth: base.filter((item) => /throat|tongue|lips|teeth/.test(item.place)),
    dots: dotted.length ? dotted : base,
    heavy: heavy.length ? heavy : letters.filter(isHeavyLetter),
    light: light.length ? light : letters.filter((item) => !isHeavyLetter(item)),
    vowel: vowels.length ? vowels : letters.filter(isVowelLetter),
    general: base,
  };
  const deck = [];
  for (let i = 0; i < raceQuestionCount; i += 1) {
    let target;
    if (mode === 'heavy') target = pickCycled(buckets.heavy, i, base);
    else if (mode === 'light') target = pickCycled(buckets.light, i, base);
    else if (mode === 'vowels') target = pickCycled(buckets.vowel, i, base);
    else {
      const kindSeed = ['sound','mouth','dots','heavy','light','vowel','general'][i % 7];
      target = pickCycled(buckets[kindSeed] || buckets.general, i, base);
    }
    deck.push({ ...target, qKind: questionKindForMode(mode, i, target), mode, number: i + 1 });
  }
  return deck;
}

function broadMouthZone(item) {
  if (/throat/.test(item.place)) return 'throat area';
  if (/lip|lips/.test(item.place)) return 'lip area';
  if (/teeth/.test(item.place)) return 'teeth area';
  if (/tongue/.test(item.place)) return 'tongue area';
  return 'mouth';
}

function mouthClueText(item) {
  const zone = broadMouthZone(item);
  if (zone === 'throat area') return 'This sound starts from the throat area. Listen for whether it is soft, strong, or rough.';
  if (zone === 'lip area') return 'This sound uses the lips. Watch for a pop, hum, blow, or rounded shape.';
  if (zone === 'teeth area') return 'This sound uses the teeth area. Listen for air or voice near the front.';
  if (zone === 'tongue area') return 'This sound uses the tongue. Listen for a tap, hiss, heavy sound, or back-tongue pop.';
  return 'Use the mouth clue and the sound clue together.';
}

function dotClueText(item) {
  if (item.dots === 0) return 'This letter has no dots. Listen carefully so you do not choose only by shape.';
  if (item.dots === 1) return 'This letter has one dot. Listen carefully before you choose.';
  if (item.dots === 2) return 'This letter has two dots. Match the sound before you race ahead.';
  return 'This letter has three dots. Use the voice clue too.';
}

function articulationVoiceText(item) {
  const parts = [`The mouth place is ${broadMouthZone(item)}.`];
  if (/throat/.test(item.place)) parts.push('This letter starts from a throat position.');
  if (/lip|lips/.test(item.place)) parts.push('This letter uses the lips.');
  if (/teeth/.test(item.place)) parts.push('This letter uses the teeth area.');
  if (/tongue/.test(item.place)) parts.push('This letter uses the tongue.');
  if (item.dots === 0) parts.push('Its written shape has no dots.');
  if (item.dots === 1) parts.push('Its written shape has one dot.');
  if (item.dots === 2) parts.push('Its written shape has two dots.');
  if (item.dots === 3) parts.push('Its written shape has three dots.');
  if (isHeavyLetter(item)) parts.push('It belongs to the heavy-letter family.');
  if (isVowelLetter(item)) parts.push('It belongs to the long-vowel or madd family.');
  return parts.join(' ');
}

function clueVoiceText(item) {
  const kind = item.qKind;
  if (kind === 'sound') return `${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (kind === 'mouth') return `${mouthClueText(item)} ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (kind === 'dots') return `${dotClueText(item)} ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (kind === 'heavy') return `This is one of the heavy letters. Listen for the deep sound, then choose the matching Arabic letter. ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (kind === 'light') return `This is a light letter. Listen for the clear, lighter sound, then choose the matching Arabic letter. ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (kind === 'vowel') return `This is from the long-vowel or madd family. Listen carefully and choose the matching Arabic letter. ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (isVowelLetter(item)) return `Alphabet lesson clue: this letter can help stretch a sound. Use the voice and letter shape together. ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (isHeavyLetter(item)) return `Alphabet lesson clue: this letter belongs to the heavy-letter family. Listen for the deep sound. ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (item.dots === 0) return `Alphabet lesson clue: this letter has no dots. Match the voice to the shape. ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (item.dots === 1) return `Alphabet lesson clue: this letter has one dot. Listen first, then check the dot. ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  if (item.dots === 2) return `Alphabet lesson clue: this letter has two dots. Use sound, mouth place, and shape. ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
  return `Alphabet lesson clue: this letter has three dots. Use sound, mouth place, and shape. ${articulationVoiceText(item)} Choose the matching Arabic letter.`;
}

async function elevenFetch(url, options = {}) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) fail('ELEVENLABS_API_KEY is not set.');
  const res = await fetch(url, {
    ...options,
    headers: { 'xi-api-key': key, ...(options.headers || {}) },
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
  const voice = voices.find((item) => String(item.name || '').trim().toLowerCase() === normalized)
    || voices.find((item) => String(item.name || '').trim().toLowerCase().includes(normalized));
  if (!voice || !voice.voice_id) {
    fail(`Voice not found: ${voiceName}. Available voices: ${voices.map((item) => item.name).filter(Boolean).slice(0, 30).join(', ')}`);
  }
  return voice.voice_id;
}

async function createAudio({ text, voiceId, modelId, outputFormat }) {
  const res = await elevenFetch(`${apiBase}/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.58,
        similarity_boost: 0.78,
        style: 0.16,
        use_speaker_boost: true,
      },
    }),
  });
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  loadDotEnv(path.join(root, '.env'));
  const dryRun = process.argv.includes('--dry-run');
  const onlyMode = arg('mode');
  const force = process.argv.includes('--force');
  const voiceName = arg('voice');
  const configuredVoiceId = arg('voice-id') || process.env.PREQURAN_QUIZ_TTS_VOICE_ID || 'B5xxC4eQoOFJnY4R5XkI';
  const voiceId = dryRun ? configuredVoiceId : (voiceName ? await findVoiceId(voiceName) : configuredVoiceId);
  const modelId = arg('model', process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2');
  const outputFormat = arg('format', 'mp3_44100_128');
  const selectedModes = onlyMode ? [onlyMode] : modes;
  fs.mkdirSync(outDir, { recursive: true });

  let created = 0;
  let skipped = 0;
  const manifest = [];
  for (const mode of selectedModes) {
    for (const item of buildQuestionDeck(mode)) {
      const file = `${mode}_q${String(item.number).padStart(2, '0')}.mp3`;
      const outPath = path.join(outDir, file);
      const text = `Question ${item.number} of ${raceQuestionCount}. ${clueVoiceText(item)}`;
      manifest.push({ mode, question: item.number, letter: item.id, kind: item.qKind, audio: file, text });
      if (!force && fs.existsSync(outPath) && fs.statSync(outPath).size > 500) {
        skipped += 1;
        continue;
      }
      console.log(`${dryRun ? 'would create' : 'creating'} ${file}: ${item.id} ${item.qKind}`);
      if (!dryRun) {
        fs.writeFileSync(outPath, await createAudio({ text, voiceId, modelId, outputFormat }));
      }
      created += 1;
    }
  }

  if (!dryRun) {
    fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), modes: selectedModes, items: manifest }, null, 2)}\n`);
  }
  console.log(`${dryRun ? 'Dry run' : 'Done'}: ${created} created, ${skipped} skipped, ${manifest.length} manifest entries.`);
}

main().catch((error) => fail(error.message));
