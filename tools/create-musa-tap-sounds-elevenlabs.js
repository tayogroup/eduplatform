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
