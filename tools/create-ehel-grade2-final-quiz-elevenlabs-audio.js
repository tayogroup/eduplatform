#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GRADE_DIR = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-2");
const QUIZ_FILE = path.join(GRADE_DIR, "data", "course-final-quiz.json");
const OUTPUT_DIR = path.join(GRADE_DIR, "media", "final-quiz");
const MANIFEST_FILE = path.join(OUTPUT_DIR, "elevenlabs-manifest.json");
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

async function createSpeech(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set.");
  const response = await fetch(`${API_BASE}/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": key },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.64, similarity_boost: 0.82, style: 0.16, use_speaker_boost: true },
    }),
  });
  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return Buffer.from(await response.arrayBuffer());
}

async function generate(question, force) {
  const output = path.join(OUTPUT_DIR, `${question.questionId}.mp3`);
  if (!force && fs.existsSync(output) && fs.statSync(output).size > 1000) {
    console.log(`Reuse ${path.relative(ROOT, output)}`);
    return { questionId: question.questionId, file: path.relative(GRADE_DIR, output).replace(/\\/g, "/"), bytes: fs.statSync(output).size, status: "reused" };
  }
  const choices = question.options.split(" | ").map((option, index) => `Choice ${String.fromCharCode(65 + index)}: ${option}.`).join(" ");
  const narration = `Question ${question.sequence}. ${question.question} ${choices}`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      console.log(`Generate ${question.questionId}: ${question.question}`);
      const bytes = await createSpeech(narration);
      fs.writeFileSync(output, bytes);
      return { questionId: question.questionId, file: path.relative(GRADE_DIR, output).replace(/\\/g, "/"), bytes: bytes.length, status: "generated" };
    } catch (error) {
      if (attempt === 3) throw error;
      await sleep(attempt * 1500);
    }
  }
}

async function main() {
  loadDotEnv(path.join(ROOT, ".env"));
  const force = process.argv.includes("--force");
  const quiz = JSON.parse(fs.readFileSync(QUIZ_FILE, "utf8"));
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const clips = [];
  for (const question of quiz.questions) clips.push(await generate(question, force));
  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify({
    schemaVersion: "Ehel Grade 2 Final Quiz Audio Manifest v1.1",
    provider: "ElevenLabs",
    voiceId: VOICE_ID,
    modelId: MODEL_ID,
    generatedAt: new Date().toISOString(),
    clips,
  }, null, 2)}\n`);
  console.log(`Ready: ${clips.length} final quiz clips using ElevenLabs voice ${VOICE_ID}.`);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
