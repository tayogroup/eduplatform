#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UNIT_DIR = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-2", "unit-1");
const COURSE_FILE = path.join(UNIT_DIR, "data", "grade2-unit1.json");
const OUTPUT_ROOT = path.join(UNIT_DIR, "media", "audio");
const MANIFEST_FILE = path.join(OUTPUT_ROOT, "elevenlabs-manifest.json");
const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function cleanNarration(value) {
  return String(value || "")
    .replace(/\([^)]*Ask your AI tutor[^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function createSpeech(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set.");
  const response = await fetch(`${API_BASE}/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": key },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.62, similarity_boost: 0.82, style: 0.18, use_speaker_boost: true },
    }),
  });
  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return Buffer.from(await response.arrayBuffer());
}

async function generate(item, force) {
  fs.mkdirSync(path.dirname(item.output), { recursive: true });
  if (!force && fs.existsSync(item.output) && fs.statSync(item.output).size > 1000) {
    console.log(`Reuse ${path.relative(ROOT, item.output)}`);
    return { ...item, status: "reused", bytes: fs.statSync(item.output).size };
  }
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      console.log(`Generate ${item.kind}: ${item.title}`);
      const bytes = await createSpeech(item.text);
      fs.writeFileSync(item.output, bytes);
      return { ...item, status: "generated", bytes: bytes.length };
    } catch (error) {
      if (attempt === 3) throw error;
      await sleep(attempt * 1500);
    }
  }
}

async function main() {
  loadDotEnv(path.join(ROOT, ".env"));
  const force = process.argv.includes("--force");
  const course = JSON.parse(fs.readFileSync(COURSE_FILE, "utf8"));
  const items = [
    ...course.readings.map((reading) => ({
      id: reading.readingId,
      kind: "reading",
      title: reading.title,
      text: cleanNarration(`${reading.title}. ${reading.passageScript}`),
      output: path.join(OUTPUT_ROOT, "readings", `${reading.readingId}.mp3`),
    })),
    ...course.grammar.map((grammar) => ({
      id: grammar.grammarId,
      kind: "grammar",
      title: grammar.title,
      text: cleanNarration(`${grammar.title}. ${grammar.explanation} Examples. ${grammar.ruleAndExamples} Now practise. ${grammar.practice}`),
      output: path.join(OUTPUT_ROOT, "grammar", `${grammar.grammarId}.mp3`),
    })),
    ...course.speaking.map((speaking) => ({
      id: speaking.speakingId,
      kind: "speaking",
      title: speaking.title,
      text: cleanNarration(`${speaking.title}. ${speaking.instructionsAndModelLines}`),
      output: path.join(OUTPUT_ROOT, "speaking", `${speaking.speakingId}.mp3`),
    })),
  ];

  const results = [];
  for (const item of items) results.push(await generate(item, force));
  const manifest = {
    schemaVersion: "Ehel Unit Audio Manifest v1.1",
    provider: "ElevenLabs",
    voiceId: VOICE_ID,
    modelId: MODEL_ID,
    generatedAt: new Date().toISOString(),
    clips: results.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      file: path.relative(UNIT_DIR, item.output).replace(/\\/g, "/"),
      bytes: item.bytes,
      status: item.status,
    })),
  };
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Ready: ${results.length} ElevenLabs clips using ${VOICE_ID}.`);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
