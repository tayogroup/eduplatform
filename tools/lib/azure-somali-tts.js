// Azure Speech proxy for Wehel's Somali vocabulary audio, shared by BOTH dev
// servers the same way wehel-dev-chat.js is: serve-src-preview mounts it at
// /api/somali-tts, vite.config.js at the production path
// /local/hubredirect/somali_tts.php. The production twin is the real PHP in
// src/moodle/local_hubredirect/somali_tts.php — keep the two in step.
//
// The voice is Azure's Somali neural voice "Ubax" (so-SO-UbaxNeural — "Ubah").
// Somali exists here and not in the ElevenLabs stack because the browser's
// speechSynthesis ships no Somali voice at all and the ElevenLabs account is
// set up for the course's English narration; Azure is the Somali provider the
// project has access to. Only the short "Soomaali:" vocabulary lines are ever
// sent, on an explicit Listen tap — never whole replies, never auto-speak.

const SOMALI_VOICE = "so-SO-UbaxNeural";

// SSML is XML, and the text comes from a model reply — escape it or a stray
// ampersand in a translation kills the whole request.
function escapeXml(text) {
  return String(text).replace(/[<>&'"]/g, (ch) => (
    { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[ch]
  ));
}

/**
 * Build an (req, res) handler for the Somali TTS route. Works as a raw
 * node:http handler and as a connect middleware alike.
 *
 * @param {{ apiKey: () => string|undefined, region: () => string|undefined }} options
 *   Azure Speech key/region getters, so each server reads its own env
 *   (process.env for serve-src-preview, vite's loadEnv result for vite).
 */
function createSomaliTtsHandler({ apiKey, region }) {
  return async function handleSomaliTts(req, res) {
    const fail = (status, message) => {
      res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: false, message }));
    };
    try {
      if (req.method !== "POST") return fail(405, "Use POST.");
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 16 * 1024) return fail(413, "The request is too large.");
      }
      const payload = JSON.parse(body || "{}");
      const text = String(payload.text || "").replace(/\s+/g, " ").trim();
      if (!text) return fail(400, "Missing text.");
      if (text.length > 600) return fail(400, "Text is too long.");

      const key = apiKey();
      const speechRegion = String(region() || "").trim();
      if (!key || !speechRegion) {
        return fail(503, "The Somali voice is not configured (AZURE_SPEECH_KEY / AZURE_SPEECH_REGION in .env).");
      }

      const ssml = `<speak version="1.0" xml:lang="so-SO"><voice name="${SOMALI_VOICE}">${escapeXml(text)}</voice></speak>`;
      const response = await fetch(`https://${encodeURIComponent(speechRegion)}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          // Azure rejects requests without a User-Agent.
          "User-Agent": "eduplatform-wehel-dev",
        },
        body: ssml,
      });
      if (!response.ok) return fail(502, `Azure Speech ${response.status}: the Somali voice request failed.`);
      const audio = Buffer.from(await response.arrayBuffer());
      res.writeHead(200, { "content-type": "audio/mpeg", "cache-control": "private, max-age=300", "content-length": audio.length });
      res.end(audio);
    } catch (error) {
      fail(503, error.message || "The Somali voice is unavailable right now.");
    }
  };
}

module.exports = { createSomaliTtsHandler, SOMALI_VOICE };
