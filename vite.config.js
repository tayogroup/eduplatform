import { defineConfig, loadEnv } from "vite";

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
