// Local twins of local_hubredirect/wehel_speak.php and wehel_listen.php —
// Wehel Tutor's Deepgram voice (owner decision 2026-08-20: Wehel ONLY; the
// lesson narration and pronunciation check stay on ElevenLabs, Somali stays
// on Azure). Shared by both dev servers: serve-src-preview mounts them at
// /api/wehel-speak and /api/wehel-listen, vite.config.js at the production
// paths. One module, so the request/response shapes cannot drift between the
// two — the only remaining mirror is the real PHP.

const SPEAK_MODEL_DEFAULT = "aura-2-thalia-en";
const LISTEN_MODEL_DEFAULT = "nova-3";
// Deepgram /v1/speak caps one request at 2000 characters — long replies are
// split on sentence boundaries and the MP3s concatenated, same as the PHP.
const SPEAK_CHUNK_LIMIT = 1900;

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(payload));
}

function speakChunks(text) {
  const chunks = [];
  let current = "";
  for (const sentence of text.split(/(?<=[.!?…])\s+/)) {
    if (!current) current = sentence;
    else if (`${current} ${sentence}`.length <= SPEAK_CHUNK_LIMIT) current = `${current} ${sentence}`;
    else { chunks.push(current); current = sentence; }
  }
  if (current) chunks.push(current);
  return chunks.flatMap((chunk) => {
    const pieces = [];
    for (let at = 0; at < chunk.length; at += SPEAK_CHUNK_LIMIT) pieces.push(chunk.slice(at, at + SPEAK_CHUNK_LIMIT));
    return pieces;
  });
}

function createWehelSpeakHandler({ apiKey, model = () => undefined }) {
  return async function handleWehelSpeak(req, res) {
    try {
      if (req.method !== "POST") return sendJson(res, 405, { ok: false, message: "Use POST." });
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 64 * 1024) return sendJson(res, 413, { ok: false, message: "The request is too large." });
      }
      const payload = JSON.parse(body || "{}");
      const text = String(payload.text || "").replace(/\s+/g, " ").trim();
      if (!text || text.length > 5000) return sendJson(res, 400, { ok: false, message: "Voice text must contain between 1 and 5000 characters." });
      const key = apiKey();
      if (!key) return sendJson(res, 503, { ok: false, message: "DEEPGRAM_API_KEY is not configured in the local .env file." });
      const speakModel = model() || SPEAK_MODEL_DEFAULT;
      const parts = [];
      for (const chunk of speakChunks(text)) {
        const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(speakModel)}`, {
          method: "POST",
          headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunk }),
        });
        if (!response.ok) return sendJson(res, 502, { ok: false, message: `Deepgram speak ${response.status}: ${(await response.text()).slice(0, 240)}` });
        parts.push(Buffer.from(await response.arrayBuffer()));
      }
      const audio = Buffer.concat(parts);
      res.writeHead(200, { "content-type": "audio/mpeg", "content-length": String(audio.length), "cache-control": "no-store" });
      res.end(audio);
    } catch (error) {
      sendJson(res, 503, { ok: false, message: error.message || "The Wehel voice is unavailable right now." });
    }
  };
}

function createWehelListenHandler({ apiKey, model = () => undefined }) {
  return async function handleWehelListen(req, res) {
    try {
      if (req.method !== "POST") return sendJson(res, 405, { ok: false, message: "Use POST." });
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 8 * 1024 * 1024) return sendJson(res, 413, { ok: false, message: "The recording request is too large." });
      }
      const payload = JSON.parse(body || "{}");
      const audio = Buffer.from(String(payload.audioBase64 || ""), "base64");
      if (!audio.length || audio.length > 6 * 1024 * 1024) return sendJson(res, 400, { ok: false, message: "The recording is empty or too large." });
      const key = apiKey();
      if (!key) return sendJson(res, 503, { ok: false, message: "DEEPGRAM_API_KEY is not configured in the local .env file." });
      const listenModel = model() || LISTEN_MODEL_DEFAULT;
      const mimeType = String(payload.mimeType || "audio/webm").split(";")[0].toLowerCase();
      const response = await fetch(`https://api.deepgram.com/v1/listen?model=${encodeURIComponent(listenModel)}&smart_format=true&language=en`, {
        method: "POST",
        headers: { Authorization: `Token ${key}`, "Content-Type": /^audio\//.test(mimeType) ? mimeType : "audio/webm", Accept: "application/json" },
        body: audio,
      });
      if (!response.ok) return sendJson(res, 502, { ok: false, message: `Deepgram listen ${response.status}: ${(await response.text()).slice(0, 240)}` });
      const result = await response.json();
      const text = String(result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "").replace(/\s+/g, " ").trim();
      sendJson(res, 200, { ok: true, text });
    } catch (error) {
      sendJson(res, 503, { ok: false, message: error.message || "Wehel speech recognition is unavailable right now." });
    }
  };
}

module.exports = { createWehelSpeakHandler, createWehelListenHandler };
