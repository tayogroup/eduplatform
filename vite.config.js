import { defineConfig, loadEnv } from "vite";
import { createWehelChatHandler, createWehelHomeworkHandler } from "./tools/lib/wehel-dev-chat.js";
import { createSomaliTtsHandler } from "./tools/lib/azure-somali-tts.js";

const EHEL_ENGLISH_VOICE_ID = "XfNU2rGpBa01ckF309OY";

function prepareVoiceText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .map((line) => /[.!?;:…][\"'”’)]*$/.test(line) ? line : `${line}.`)
    .join("\n\n");
}

function readJson(request, maxBytes = 8192) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBytes) reject(new Error("Request body is too large."));
    });
    request.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(new Error("Invalid JSON.")); }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

function ehelEnglishVoicePlugin(env) {
  return {
    name: "ehel-english-elevenlabs-voice",
    configureServer(server) {
      server.middlewares.use("/local/hubredirect/quiz_tts.php", async (request, response) => {
        if (request.method !== "POST") return sendJson(response, 405, { ok: false, message: "Use POST." });
        try {
          const payload = await readJson(request);
          const text = prepareVoiceText(payload.text).slice(0, 650);
          if (!text) return sendJson(response, 400, { ok: false, message: "Missing text." });
          if (!env.ELEVENLABS_API_KEY) return sendJson(response, 503, { ok: false, message: "ElevenLabs voice is not configured." });
          const voiceId = payload.purpose === "ehel_english" ? EHEL_ENGLISH_VOICE_ID : (env.PREQURAN_QUIZ_TTS_VOICE_ID || EHEL_ENGLISH_VOICE_ID);
          const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
            method: "POST",
            headers: { Accept: "audio/mpeg", "Content-Type": "application/json", "xi-api-key": env.ELEVENLABS_API_KEY },
            body: JSON.stringify({
              text,
              model_id: env.PREQURAN_QUIZ_TTS_MODEL_ID || "eleven_multilingual_v2",
              voice_settings: { stability: 0.48, similarity_boost: 0.82, style: 0.32, use_speaker_boost: true },
            }),
          });
          if (!upstream.ok) return sendJson(response, 502, { ok: false, message: "ElevenLabs voice request failed." });
          response.writeHead(200, { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" });
          response.end(Buffer.from(await upstream.arrayBuffer()));
        } catch (error) {
          sendJson(response, 500, { ok: false, message: error.message || "Voice service is unavailable." });
        }
      });
      // Source modules here use hand-written cache-busting queries (?v=t2,
      // ?v=wehel-1, ...) — a convention that collides with vite's OWN reserved
      // ?v= marker, which vite serves as immutable, max-age one year. The
      // browser then keeps the first version it ever saw of course-app.js and
      // friends until the tag changes — edits "don't take effect" on 5173 no
      // matter how often the page reloads. Downgrade those responses to
      // no-cache (etag revalidation still gives cheap 304s).
      server.middlewares.use((request, response, next) => {
        if (request.url?.includes("/src/") && request.url.includes("?v=")) {
          const setHeader = response.setHeader.bind(response);
          response.setHeader = (name, value) =>
            String(name).toLowerCase() === "cache-control" ? setHeader(name, "no-cache") : setHeader(name, value);
        }
        next();
      });
      // Wehel Tutor chat — same shared handler serve-src-preview mounts at
      // /api/wehel-chat, here at the production path (the client uses prod
      // paths on 5173, matching how quiz_tts/quiz_stt are emulated below).
      server.middlewares.use(
        "/local/hubredirect/wehel_chat.php",
        createWehelChatHandler({ apiKey: () => env.ANTHROPIC_API_KEY, model: () => env.WEHEL_MODEL }),
      );
      // Wehel homework twin — sample assignments only when WEHEL_DEV_HOMEWORK
      // is set in .env, the empty list otherwise (see wehel-dev-chat.js).
      server.middlewares.use(
        "/local/hubredirect/wehel_homework.php",
        createWehelHomeworkHandler({ enabled: () => env.WEHEL_DEV_HOMEWORK }),
      );
      // Somali vocabulary audio for Wehel — Azure's "Ubax" (Ubah) voice, same
      // shared handler serve-src-preview mounts at /api/somali-tts.
      server.middlewares.use(
        "/local/hubredirect/somali_tts.php",
        createSomaliTtsHandler({ apiKey: () => env.AZURE_SPEECH_KEY, region: () => env.AZURE_SPEECH_REGION }),
      );
      server.middlewares.use("/local/hubredirect/quiz_stt.php", async (request, response) => {
        if (request.method !== "POST") return sendJson(response, 405, { ok: false, message: "Use POST." });
        try {
          const payload = await readJson(request, 8 * 1024 * 1024);
          const audio = Buffer.from(String(payload.audioBase64 || ""), "base64");
          const mimeType = String(payload.mimeType || "audio/webm").split(";")[0];
          if (!audio.length || audio.length > 6 * 1024 * 1024) return sendJson(response, 400, { ok: false, message: "The recording is empty or too large." });
          if (!env.ELEVENLABS_API_KEY) return sendJson(response, 503, { ok: false, message: "ElevenLabs speech recognition is not configured." });
          const extension = mimeType.includes("mp4") ? "mp4" : mimeType.includes("mpeg") ? "mp3" : "webm";
          const form = new FormData();
          form.append("file", new Blob([audio], { type: mimeType }), `speaking.${extension}`);
          form.append("model_id", env.ELEVENLABS_STT_MODEL_ID || "scribe_v1");
          const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
            method: "POST",
            headers: { Accept: "application/json", "xi-api-key": env.ELEVENLABS_API_KEY },
            body: form,
          });
          if (!upstream.ok) return sendJson(response, 502, { ok: false, message: "ElevenLabs speech recognition failed." });
          const result = await upstream.json();
          const text = String(result.text || result.transcript || "").replace(/\s+/g, " ").trim();
          sendJson(response, 200, { ok: true, text });
        } catch (error) {
          sendJson(response, 500, { ok: false, message: error.message || "Speech recognition is unavailable." });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return { plugins: [ehelEnglishVoicePlugin(env)] };
});
