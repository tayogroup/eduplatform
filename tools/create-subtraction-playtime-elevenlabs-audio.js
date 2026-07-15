#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const root = process.cwd();
const apiBase = "https://api.elevenlabs.io/v1";
const bundledFfmpeg = String.raw`C:\Users\inawa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe`;

function arg(name, fallback = "") {
  const args = process.argv.slice(2);
  const prefix = `--${name}=`;
  const found = args.find((item) => item.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith("--")) return args[index + 1];
  return fallback;
}

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

function ffmpegPath() {
  return process.env.FFMPEG_PATH || (fs.existsSync(bundledFfmpeg) ? bundledFfmpeg : "ffmpeg");
}

function normalizeMp3(rawPath, outPath) {
  const normalized = spawnSync(ffmpegPath(), [
    "-y",
    "-i", rawPath,
    "-ar", "44100",
    "-ac", "1",
    "-codec:a", "libmp3lame",
    "-b:a", "128k",
    outPath,
  ], { encoding: "utf8" });

  if (normalized.status !== 0 || !fs.existsSync(outPath)) {
    fs.renameSync(rawPath, outPath);
    console.warn(`Could not normalize ${path.basename(outPath)} with ffmpeg; wrote raw MP3 instead.`);
    return;
  }
  fs.unlinkSync(rawPath);
}

async function elevenFetch(url, options = {}) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) fail("ELEVENLABS_API_KEY is not set.");
  const res = await fetch(url, {
    ...options,
    headers: {
      "xi-api-key": key,
      ...(options.headers || {}),
    },
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
  const normalized = String(voiceName || "").trim().toLowerCase();
  const voice = voices.find((item) => String(item.name || "").trim().toLowerCase() === normalized) ||
    voices.find((item) => String(item.name || "").trim().toLowerCase().includes(normalized));
  if (!voice || !voice.voice_id) {
    const names = voices.map((item) => item.name).filter(Boolean).slice(0, 40).join(", ");
    fail(`Voice not found: ${voiceName}. Available voices include: ${names}`);
  }
  return voice.voice_id;
}

function extractPages(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const match = html.match(/const pages = (\[[\s\S]*?\]);\s*const page =/);
  if (!match) fail(`Could not find pages array in ${htmlPath}`);
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`pages = ${match[1]};`, sandbox, { filename: htmlPath });
  if (!Array.isArray(sandbox.pages) || !sandbox.pages.length) fail("No pages were extracted.");
  return sandbox.pages;
}

function pageNarration(data) {
  const lines = [data.title];
  if (Array.isArray(data.text)) lines.push(...data.text);
  else if (data.text) lines.push(data.text);
  if (data.line) lines.push(data.line);
  if (data.prompt) lines.push(data.prompt);
  if (Array.isArray(data.choices)) lines.push("Choices are " + data.choices.map(String).join(", ") + ".");
  if (data.kind === "activity") {
    lines.push(`Start with ${data.start}. Take away ${data.targetTake}. Count what is left.`);
  }
  if (Array.isArray(data.cards)) lines.push(...data.cards);
  return lines.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

async function createPageAudio({ text, outPath, voiceId, modelId, outputFormat }) {
  const payload = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: 0.58,
      similarity_boost: 0.78,
      style: 0.25,
      use_speaker_boost: true,
    },
  };
  const url = `${apiBase}/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`;
  const res = await elevenFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const rawPath = `${outPath}.raw.mp3`;
  fs.writeFileSync(rawPath, Buffer.from(await res.arrayBuffer()));
  normalizeMp3(rawPath, outPath);
}

async function main() {
  if (typeof fetch !== "function") fail("This script needs Node.js with built-in fetch support.");
  loadDotEnv(path.join(root, ".env"));
  loadDotEnv(path.join(root, ".env.local"));

  const htmlPath = path.resolve(root, arg("html", "dist/pre_quraan/units/openmaic-classroom/subtraction-playtime-standalone.html"));
  const outDir = path.resolve(root, arg("out-dir", "dist/pre_quraan/units/openmaic-classroom/assets/subtraction-playtime/audio"));
  const voiceName = arg("voice", "Salma");
  const voiceIdArg = arg("voice-id", process.env.ELEVENLABS_VOICE_ID || process.env.PREQURAN_QUIZ_TTS_VOICE_ID || "");
  const modelId = arg("model", "eleven_v3");
  const outputFormat = arg("format", "mp3_44100_128");
  const onlyPage = Number(arg("only-page", ""));
  const force = hasFlag("force");

  if (!fs.existsSync(htmlPath)) fail(`HTML not found: ${htmlPath}`);
  const pages = extractPages(htmlPath);
  const voiceId = voiceIdArg || await findVoiceId(voiceName);

  for (let index = 0; index < pages.length; index += 1) {
    if (Number.isInteger(onlyPage) && onlyPage > 0 && index !== onlyPage - 1) continue;
    const outPath = path.join(outDir, `page-${String(index + 1).padStart(2, "0")}.mp3`);
    if (!force && fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
      console.log(`Skipping ${path.relative(root, outPath)}; already exists.`);
      continue;
    }
    const text = pageNarration(pages[index]);
    if (!text) fail(`Page ${index + 1} narration is empty.`);
    console.log(`Generating page ${index + 1}/${pages.length}: ${pages[index].title || pages[index].kind}`);
    await createPageAudio({ text, outPath, voiceId, modelId, outputFormat });
    console.log(`Wrote ${path.relative(root, outPath)} (${fs.statSync(outPath).size} bytes)`);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
