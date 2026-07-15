#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const apiBase = 'https://api.elevenlabs.io/v1';
const defaultVoiceId = 'XfNU2rGpBa01ckF309OY';
const defaultModelId = 'eleven_multilingual_v2';
const ffmpegExecutable = String.raw`C:\ffmpeg\bin\ffmpeg.exe`;

const prototype = path.join(root, 'src', 'prototypes', 'ehel-academy', 'vocabulary');
const lessonAudioDirectory = path.join(prototype, 'audio');
const lectureAudioDirectory = path.join(root, 'tmp', 'ehel-vocabulary-lecture', 'audio');

const vocabulary = [
  {
    word: 'neighbour',
    sentences: [
      'Our neighbour waves to us every morning.',
      'I helped my neighbour carry her shopping.',
      'My new neighbour has two children.',
      'We invited our neighbour to share lunch.',
      'A good neighbour cares about the community.',
    ],
  },
  {
    word: 'friendly',
    sentences: [
      'The friendly shopkeeper smiles at everyone.',
      'A friendly child welcomed the new student.',
      'Our teacher has a friendly voice.',
      'The neighbours had a friendly chat outside.',
      "A friendly greeting can brighten someone's day.",
    ],
  },
  {
    word: 'help',
    sentences: [
      'I help my neighbour carry the shopping.',
      'Please help me pick up these books.',
      'The children help to keep the park clean.',
      'We help new families feel welcome.',
      'Can you help your friend solve the puzzle?',
    ],
  },
  {
    word: 'kindly',
    sentences: [
      'Muna kindly opened the door for her neighbour.',
      'The teacher kindly explained the question again.',
      'He kindly shared his umbrella in the rain.',
      'The nurse kindly spoke to the worried child.',
      'Amina kindly offered her friend a pencil.',
    ],
  },
  {
    word: 'share',
    sentences: [
      'We share our coloured pencils at the table.',
      'The neighbours share fruit from their gardens.',
      'I share my storybook with my little brother.',
      'Good friends share ideas and listen to each other.',
      'Let us share the work so we finish together.',
    ],
  },
  {
    word: 'community',
    sentences: [
      'Our community keeps the park clean.',
      'The school is an important part of our community.',
      'People in the community helped the new family.',
      'Our community planted flowers beside the road.',
      'A strong community works together.',
    ],
  },
  {
    word: 'helpful',
    sentences: [
      'The helpful child picked up the fallen books.',
      'This map is helpful when we visit a new place.',
      'Our helpful neighbour fixed the garden gate.',
      'The teacher gave me a helpful clue.',
      'Being helpful makes our classroom stronger.',
    ],
  },
  {
    word: 'carefully',
    sentences: [
      'Ali carefully carried the full cup of water.',
      'She carefully crossed the busy road with an adult.',
      'We carefully read every question before answering.',
      'The children carefully planted the tiny seeds.',
      'Please carefully place the books on the shelf.',
    ],
  },
];

const lectureNarrations = [
  'Hello, young word explorer. I am Teacher Nuur. Today we are learning eight useful words about good neighbours. Watch, listen, and say the words with me.',
  'Our goal is to understand each word, pronounce it clearly, notice its word type, and use it in a sentence. Words can have different jobs in a sentence.',
  'A noun names a person, place, thing, or idea. Neighbour is a noun because it names a person who lives near you. Community is also a noun.',
  'A verb shows an action. Help and share are verbs. Say them with me. Help. Share. These words tell us what someone does.',
  'An adjective describes a noun. Friendly and helpful are adjectives. A friendly neighbour. A helpful child. They add describing details.',
  'An adverb tells how an action happens. Kindly and carefully are adverbs. Speak kindly. Carry the cup carefully. They explain how the action is done.',
  'Now meet our first four words. Neighbour means a person who lives near you. Friendly means kind and pleasant. Help means to make something easier. Kindly means in a caring way.',
  'Here are four more words. Share means to let another person use some of yours. Community means people who share a place. Helpful means ready to help. Carefully means in a way that avoids mistakes or danger.',
  'Let us say all eight words together. Neighbour. Friendly. Help. Kindly. Share. Community. Helpful. Carefully. Excellent speaking.',
  'You are ready to begin. Explore each word, flip through five sentence cards, listen to the examples, practise spelling, talk with the tutor, and finish with the word challenge.',
];

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
  console.error(message);
  process.exit(1);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function createSpeech(text, voiceId, modelId) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) fail('ELEVENLABS_API_KEY is not set.');

  const url = `${apiBase}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
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

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': key,
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) return Buffer.from(await response.arrayBuffer());

    const detail = (await response.text()).slice(0, 800);
    if (attempt === 3 || (response.status !== 429 && response.status < 500)) {
      fail(`ElevenLabs request failed (${response.status}): ${detail}`);
    }
    await sleep(attempt * 1200);
  }
  return Buffer.alloc(0);
}

function convertMp3ToWav(mp3Bytes, outputPath) {
  if (!fs.existsSync(ffmpegExecutable)) fail(`ffmpeg not found: ${ffmpegExecutable}`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.elevenlabs.mp3`;
  fs.writeFileSync(temporaryPath, mp3Bytes);
  const result = spawnSync(ffmpegExecutable, [
    '-y', '-i', temporaryPath, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', outputPath,
  ], { encoding: 'utf8' });
  fs.unlinkSync(temporaryPath);
  if (result.status !== 0 || !fs.existsSync(outputPath)) {
    fail(`Could not convert ${path.basename(outputPath)} to WAV: ${(result.stderr || '').slice(0, 800)}`);
  }
}

async function generateClip({ label, text, outputPath, voiceId, modelId }) {
  console.log(`Generating ${label}`);
  convertMp3ToWav(await createSpeech(text, voiceId, modelId), outputPath);
  console.log(`Wrote ${path.relative(root, outputPath)} (${fs.statSync(outputPath).size} bytes)`);
}

async function generateLessonAudio(options) {
  for (const item of vocabulary) {
    await generateClip({
      ...options,
      label: `word: ${item.word}`,
      text: item.word,
      outputPath: path.join(lessonAudioDirectory, `word-${item.word}.wav`),
    });
    for (let index = 0; index < item.sentences.length; index += 1) {
      await generateClip({
        ...options,
        label: `${item.word}, sentence ${index + 1}`,
        text: item.sentences[index],
        outputPath: path.join(lessonAudioDirectory, `sentence-${item.word}-${index + 1}.wav`),
      });
    }
  }
}

async function generateLectureAudio(options) {
  for (let index = 0; index < lectureNarrations.length; index += 1) {
    await generateClip({
      ...options,
      label: `lecture slide ${index + 1}/${lectureNarrations.length}`,
      text: lectureNarrations[index],
      outputPath: path.join(lectureAudioDirectory, `slide_${String(index).padStart(2, '0')}.wav`),
    });
  }
}

async function main() {
  if (typeof fetch !== 'function') fail('This script needs Node.js with built-in fetch support.');
  loadDotEnv(path.join(root, '.env'));

  const voiceId = arg('voice-id', defaultVoiceId);
  const modelId = arg('model', defaultModelId);
  const scope = arg('scope', 'all').toLowerCase();
  if (!['all', 'lesson', 'lecture'].includes(scope)) fail(`Unknown scope: ${scope}`);

  console.log(`ElevenLabs voice: ${voiceId}`);
  console.log(`ElevenLabs model: ${modelId}`);
  if (scope === 'all' || scope === 'lesson') await generateLessonAudio({ voiceId, modelId });
  if (scope === 'all' || scope === 'lecture') await generateLectureAudio({ voiceId, modelId });

  const manifest = {
    provider: 'ElevenLabs',
    voiceId,
    modelId,
    lessonClips: scope === 'lecture' ? 0 : vocabulary.length * 6,
    lectureClips: scope === 'lesson' ? 0 : lectureNarrations.length,
  };
  fs.writeFileSync(path.join(prototype, 'elevenlabs-voice.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${path.relative(root, path.join(prototype, 'elevenlabs-voice.json'))}`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
