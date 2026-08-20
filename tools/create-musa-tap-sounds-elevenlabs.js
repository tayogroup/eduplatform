#!/usr/bin/env node

// Generates the short tap-to-play sound effects for the Musa eBooks using
// the ElevenLabs sound-generation API. Each tap target in the illustrations
// (characters by mood, puddle, tree, sun) gets one child-friendly sound.
// Skips files that already exist; pass --force to regenerate everything.
// Requires ELEVENLABS_API_KEY in .env or the environment.
// Output: src/prototypes/ehel-academy/english/ebooks/tap-sounds/<key>.mp3

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
// Generated effects come out quiet; boost them ~30% with a clip limiter.
const VOLUME_FILTER = "volume=1.3,alimiter=limit=0.95";
const outDir = path.join(root, "src", "prototypes", "ehel-academy", "english", "ebooks", "tap-sounds");
const apiUrl = "https://api.elevenlabs.io/v1/sound-generation";

const SOUNDS = [
  { key: "zebra-happy", seconds: 1.6, prompt: "One short cheerful cartoon zebra whinny, bright and playful, child friendly, no background noise" },
  { key: "zebra-sad", seconds: 1.7, prompt: "One short soft sad pony whimper, gentle cartoon animal sound for a children's storybook, no background noise" },
  { key: "zebra-surprised", seconds: 1.4, prompt: "One short startled horse snort followed by a tiny surprised neigh, cartoon style, child friendly" },
  { key: "elephant-happy", seconds: 1.6, prompt: "One short happy baby elephant trumpet, bright and playful, child friendly, no background noise" },
  { key: "elephant-sad", seconds: 1.8, prompt: "One soft sad baby elephant low gentle rumble whimper, tender storybook sound, no background noise" },
  { key: "elephant-surprised", seconds: 1.4, prompt: "One short startled baby elephant trumpet toot, cartoon style, child friendly" },
  { key: "giraffe", seconds: 1.5, prompt: "One short warm friendly giraffe hum, gentle low cartoon animal sound for a children's storybook" },
  { key: "ostrich", seconds: 1.4, prompt: "One short quirky ostrich chirp and cluck, playful big bird sound, child friendly" },
  { key: "monkey", seconds: 1.6, prompt: "One short cheerful small monkey chatter, playful vervet monkey giggle sound, child friendly" },
  { key: "puddle", seconds: 1.2, prompt: "One single playful water splash in a small puddle, cartoon style, bright, no background noise" },
  { key: "tree", seconds: 1.5, prompt: "One short gentle rustle of acacia tree leaves in a soft breeze, calm and natural" },
  { key: "sun", seconds: 1.3, prompt: "One short warm magical sparkle chime, gentle ascending glitter tones, happy children's storybook sound" },
  { key: "kiki-happy", seconds: 1.4, prompt: "One short cheerful little monkey giggle squeak, small young monkey, bright and playful, child friendly, no background noise" },
  { key: "kiki-sad", seconds: 1.6, prompt: "One short soft sad little monkey whimper squeak, small young monkey, gentle storybook sound, no background noise" },
  { key: "kiki-surprised", seconds: 1.3, prompt: "One short surprised little monkey squeak gasp, small young monkey, cartoon style, child friendly" },
  { key: "bell", seconds: 1.6, prompt: "One bright cheerful school hand bell ringing twice, ding ding, clear and happy, no background noise" },
  { key: "ball", seconds: 1.2, prompt: "One playful rubber ball bounce, boing boing, cartoon style, child friendly, no background noise" },
  { key: "wind", seconds: 1.7, prompt: "One short gentle gust of wind whoosh lifting a kite, soft and airy, child friendly" },
  { key: "lullaby", seconds: 2.2, prompt: "A very short gentle humming lullaby phrase, warm motherly hum, soft and soothing, no words, no background noise" },
  { key: "crickets", seconds: 2, prompt: "Gentle quiet night crickets chirping softly under the stars, calm and peaceful, no other sounds" },
  { key: "duku-happy", seconds: 1.6, prompt: "One short cheerful little donkey hee-haw bray, young and playful, cartoon style, child friendly, no background noise" },
  { key: "duku-sad", seconds: 1.7, prompt: "One short soft sad little donkey whimper snort, gentle storybook sound, child friendly, no background noise" },
  { key: "duku-surprised", seconds: 1.4, prompt: "One short startled little donkey snort and half bray, cartoon style, child friendly" },
  { key: "hen", seconds: 1.5, prompt: "One short friendly hen clucking, buk buk buk, warm farm sound, child friendly, no background noise" },
  { key: "goat", seconds: 1.4, prompt: "One short cheerful goat bleat, meeeh, playful farm sound, child friendly, no background noise" },
  { key: "chick", seconds: 1.3, prompt: "Two tiny baby chick peeps, peep peep, very small and cute, child friendly, no background noise" },
  { key: "bird", seconds: 1.5, prompt: "Short sweet little songbird tweeting melody, bright and cheerful, no background noise" },
  { key: "crunch", seconds: 1.2, prompt: "One crisp playful carrot crunch bite, cartoon munch, child friendly, no background noise" },
  { key: "lulu-happy", seconds: 1.4, prompt: "One short cheerful little swallow chirp trill, bright happy songbird, child friendly, no background noise" },
  { key: "lulu-sad", seconds: 1.6, prompt: "One short soft tired sad little bird peep, gentle drooping chirp, storybook sound, no background noise" },
  { key: "lulu-surprised", seconds: 1.3, prompt: "One short surprised little bird chirp squeak, quick and bright, cartoon style, child friendly" },
  { key: "river", seconds: 2, prompt: "A gentle small river flowing and babbling over stones, soft and fresh, no other sounds" },
  { key: "rain", seconds: 2, prompt: "Gentle soft rain pattering on leaves, calm and cozy, child friendly, no thunder" },
  { key: "market", seconds: 1.8, prompt: "A short cheerful busy market ambience, soft friendly chatter and bustle, warm and happy, child friendly" },
  // Zuri, the Grade 2 lead. A meerkat's own call is a high sharp peep, close to
  // a small bird's — which is why she borrowed the chick's chirp until these
  // existed. She is in TAP_SOUND_MOOD_TYPES in english.js, so all three moods
  // must be present: that set asks for zuri-<mood>.mp3 by name, and a missing
  // one taps silently rather than falling back.
  { key: "zuri-happy", seconds: 1.4, prompt: "One short bright cheerful meerkat peep chirp, small perky desert animal, quick and happy, cartoon style, child friendly, no background noise" },
  { key: "zuri-sad", seconds: 1.6, prompt: "One short soft sad little meerkat peep whine, small drooping chirp, gentle storybook sound, child friendly, no background noise" },
  { key: "zuri-surprised", seconds: 1.3, prompt: "One short startled meerkat alarm peep squeak, quick sharp and bright, cartoon style, child friendly, no background noise" },
  // Grades 3 and 4 are people, not animals, and they share a voice by TYPE
  // rather than one clip each. Fourteen separate child giggles would be
  // indistinguishable from one another and cost fourteen times as much; three
  // groups keep every character's mood working with nine clips. Resolution is
  // TAP_VOICE_GROUPS in english.js.
  //
  // Every prompt says "no words": a sound-generation model asked for a human
  // voice will otherwise produce speech, and a clip that says something in
  // English is a clip that contradicts whatever the page says.
  { key: "child-happy", seconds: 1.3, prompt: "One short cheerful laugh from a young child, bright and warm, no words, no speech, no background noise" },
  { key: "child-sad", seconds: 1.5, prompt: "One short soft disappointed sigh from a young child, gentle and quiet, no words, no speech, no background noise" },
  { key: "child-surprised", seconds: 1.2, prompt: "One short surprised gasp from a young child, quick and bright, no words, no speech, no background noise" },
  { key: "woman-happy", seconds: 1.4, prompt: "One short warm friendly laugh from an adult woman, kind and gentle, no words, no speech, no background noise" },
  { key: "woman-sad", seconds: 1.6, prompt: "One short soft sympathetic sigh from an adult woman, gentle and warm, no words, no speech, no background noise" },
  { key: "woman-surprised", seconds: 1.2, prompt: "One short soft surprised gasp from an adult woman, quick and gentle, no words, no speech, no background noise" },
  { key: "man-happy", seconds: 1.4, prompt: "One short warm friendly chuckle from an adult man, low and kind, no words, no speech, no background noise" },
  { key: "man-sad", seconds: 1.6, prompt: "One short soft thoughtful sigh from an adult man, low and gentle, no words, no speech, no background noise" },
  { key: "man-surprised", seconds: 1.2, prompt: "One short surprised gasp from an adult man, quick and low, no words, no speech, no background noise" },
  // Goat, hen and the adult monkey are DRAWN with three moods each but had a
  // single clip, so a sad goat played a cheerful bleat. These are the mood sets
  // that fix it. The plain goat.mp3 / hen.mp3 / monkey.mp3 stay: thirty page
  // story cues name them directly, and playStorySound takes the raw key without
  // going near the mood resolution a tap uses.
  //
  // "monkey" is the ADULT vervet, not Kiki — she already has her own kiki-*
  // clips as a small young monkey, so these are pitched lower and fuller or the
  // two are indistinguishable on the page they share.
  { key: "goat-happy", seconds: 1.4, prompt: "One short cheerful goat bleat, meeeh, bright and playful farm sound, child friendly, no background noise" },
  { key: "goat-sad", seconds: 1.6, prompt: "One short soft sad goat bleat, low and gentle, drooping at the end, storybook farm sound, no background noise" },
  { key: "goat-surprised", seconds: 1.3, prompt: "One short startled goat bleat, quick and sharp, cartoon style, child friendly, no background noise" },
  { key: "hen-happy", seconds: 1.5, prompt: "One short friendly hen clucking, buk buk buk, warm and content farm sound, child friendly, no background noise" },
  { key: "hen-sad", seconds: 1.6, prompt: "One short soft worried hen clucking, low and slow, gentle storybook farm sound, no background noise" },
  { key: "hen-surprised", seconds: 1.3, prompt: "One short startled hen squawk and quick cluck, cartoon style, child friendly, no background noise" },
  { key: "monkey-happy", seconds: 1.6, prompt: "One short cheerful adult vervet monkey chatter, warm and full, deeper than a baby monkey, child friendly, no background noise" },
  { key: "monkey-sad", seconds: 1.7, prompt: "One short soft sad adult monkey murmur whimper, low and gentle, deeper than a baby monkey, no background noise" },
  { key: "monkey-surprised", seconds: 1.3, prompt: "One short startled adult monkey chatter screech, quick and full, deeper than a baby monkey, child friendly, no background noise" },
];

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

async function generate(sound, key) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: sound.prompt, duration_seconds: sound.seconds, prompt_influence: 0.4 }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ElevenLabs sound generation failed for ${sound.key} (${response.status}): ${detail.slice(0, 300)}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error(`Empty audio returned for ${sound.key}.`);
  return buffer;
}

function boostVolume(filePath) {
  const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
  const boosted = `${filePath}.boost.mp3`;
  const result = spawnSync(ffmpeg, ["-y", "-loglevel", "error", "-i", filePath, "-af", VOLUME_FILTER, "-c:a", "libmp3lame", "-q:a", "3", boosted], { stdio: "inherit" });
  if (result.status === 0 && fs.existsSync(boosted) && fs.statSync(boosted).size > 0) {
    fs.renameSync(boosted, filePath);
  } else {
    if (fs.existsSync(boosted)) fs.unlinkSync(boosted);
    console.warn(`(volume boost skipped for ${path.basename(filePath)} - ffmpeg unavailable or failed)`);
  }
}

async function main() {
  if (typeof fetch !== "function") {
    console.error("This script needs Node.js with built-in fetch support.");
    process.exit(1);
  }
  loadDotEnv(path.join(root, ".env"));
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    console.error("ELEVENLABS_API_KEY is not set.");
    process.exit(1);
  }
  const force = process.argv.includes("--force");
  fs.mkdirSync(outDir, { recursive: true });

  let generated = 0;
  let skipped = 0;
  for (const sound of SOUNDS) {
    const outPath = path.join(outDir, `${sound.key}.mp3`);
    if (!force && fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
      skipped += 1;
      continue;
    }
    process.stdout.write(`Generating ${sound.key}... `);
    const buffer = await generate(sound, key);
    fs.writeFileSync(outPath, buffer);
    boostVolume(outPath);
    console.log(`${(fs.statSync(outPath).size / 1024).toFixed(0)} KB`);
    generated += 1;
  }
  console.log(`Done: ${generated} generated, ${skipped} already present, in ${path.relative(root, outDir)}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
