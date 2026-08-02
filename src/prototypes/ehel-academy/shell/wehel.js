// Wehel — the Ehel Academy AI subject expert, shared by every subject module.
// One chat panel + one transport, so the six subjects differ only in the meta
// they pass (subject key, quick prompts, canned fallback). The prompt itself is
// server-side (local_hubredirect/wehel_prompt.json via wehel_chat.php, or the
// dev twin /api/wehel-chat on port 4287); the client only ships the unit JSON
// the browser has already loaded for the lesson, so no secret crosses here.

const IS_LOCAL_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);
// serve-src-preview.js hosts the /api/* twins and defaults to port 4287, but
// autoPort can move it — so treat every localhost port as dev EXCEPT the two
// servers that have no API routes (vite on 5173, the bunny dist preview on
// 4173) and bare 80/443, which would be a local Moodle.
const DEV_API = IS_LOCAL_DEV && !["", "80", "443", "5173", "4173"].includes(location.port);
export const WEHEL_CHAT_ENDPOINT = DEV_API ? "/api/wehel-chat" : "/local/hubredirect/wehel_chat.php";
export const WEHEL_STT_ENDPOINT = DEV_API ? "/api/elevenlabs-stt" : "/local/hubredirect/quiz_stt.php";

const HISTORY_LIMIT = 12;

// One line per unit of the loaded course manifest, so Wehel knows where the
// open unit sits in the year and can point ahead or back. Titles only — the
// full content still travels for the current unit alone.
export function outlineFromManifest(manifest) {
  const units = Array.isArray(manifest?.units) ? manifest.units : [];
  return units
    .map((unit) => `Unit ${unit.number}: ${unit.title}${unit.skill ? ` (skill: ${unit.skill})` : ""}`)
    .join("\n");
}

// Merge consecutive same-role turns: the Anthropic API requires strict
// user/assistant alternation, and a failed exchange can leave two learner
// messages in a row in the stored transcript.
function apiMessages(stored) {
  const merged = [];
  for (const item of stored.slice(-HISTORY_LIMIT)) {
    const role = item.role === "assistant" ? "assistant" : "user";
    const content = String(item.text || "").trim();
    if (!content) continue;
    if (merged.length && merged[merged.length - 1].role === role) merged[merged.length - 1].content += `\n${content}`;
    else merged.push({ role, content });
  }
  while (merged.length && merged[0].role !== "user") merged.shift();
  return merged;
}

// Fetches a sibling unit's JSON from the same tree the lesson loads its own
// data from, gated on the manifest so Wehel can only ask for units that exist.
export function unitFetcher(manifest, dataRootUrl) {
  return async (unitNo) => {
    const units = Array.isArray(manifest?.units) ? manifest.units : [];
    if (!units.some((unit) => Number(unit.number) === Number(unitNo))) return null;
    const response = await fetch(new URL(`units/unit-${Number(unitNo)}.json`, dataRootUrl));
    if (!response.ok) throw new Error(`Unit ${unitNo} could not be loaded (${response.status}).`);
    return response.json();
  };
}

// --- cross-academy lookups ---------------------------------------------------
// Every course's data sits on the same origin as the page: in dev the subjects
// are siblings under /ehel-academy/, and on the CDN every course reads
// ../../content/<subject>/gNN/ relative to its own base — the same convention
// course-app.js uses for the current course. So the browser can resolve any
// (subject, grade) to a data root without server help.
const ACADEMY_SUBJECTS = ["science", "mathematics", "computing", "english", "global-perspectives", "intensive-english"];
const pad2 = (n) => String(n).padStart(2, "0");

function courseDataRoot(subjectKey, grade) {
  const marker = "/ehel-academy/";
  const at = location.pathname.indexOf(marker);
  if (IS_LOCAL_DEV && at !== -1) {
    const stageDir = subjectKey === "intensive-english" ? `level-${grade}` : `grade-${grade}`;
    return new URL(`${location.pathname.slice(0, at + marker.length)}${subjectKey}/${stageDir}/data/`, location.origin);
  }
  return new URL(`../../content/${subjectKey}/g${pad2(grade)}/`, document.baseURI);
}

// Both handlers answer with plain prose on any miss — a 404 for a course that
// was never built is a normal answer for the model, not an error.
function resolveCourseRef(meta, input) {
  const subject = input?.subject ? String(input.subject) : meta.subject;
  const grade = input?.grade !== undefined && input?.grade !== null ? Number(input.grade) : Number(meta.grade);
  if (!ACADEMY_SUBJECTS.includes(subject)) return { error: `Unknown subject "${subject}". Available: ${ACADEMY_SUBJECTS.join(", ")}.` };
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) return { error: `Grade ${input?.grade} is not a valid grade (1-8).` };
  return { subject, grade };
}

async function handleGetUnit(meta, fetchUnit, input) {
  const ref = resolveCourseRef(meta, input);
  if (ref.error) return ref.error;
  const unitNo = Number(input?.unitNo);
  const label = `Unit ${input?.unitNo} of ${ref.subject} grade ${ref.grade}`;
  if (ref.subject === meta.subject && ref.grade === Number(meta.grade) && fetchUnit) {
    const unit = await fetchUnit(unitNo);
    return unit ? JSON.stringify(unit).slice(0, 120000) : `${label} does not exist — only the units in the year outline.`;
  }
  const response = await fetch(new URL(`units/unit-${unitNo}.json`, courseDataRoot(ref.subject, ref.grade)));
  if (!response.ok) return `${label} is not available.`;
  return JSON.stringify(await response.json()).slice(0, 120000);
}

async function handleGetCourseOutline(meta, input) {
  const ref = resolveCourseRef(meta, input);
  if (ref.error) return ref.error;
  const response = await fetch(new URL("course-manifest.json", courseDataRoot(ref.subject, ref.grade)));
  if (!response.ok) return `The ${ref.subject} grade ${ref.grade} course is not available.`;
  const manifest = await response.json();
  return `${ref.subject} grade ${ref.grade} units:\n${outlineFromManifest(manifest)}`.slice(0, 6000);
}

// --- browser speech synthesis ------------------------------------------------
// Wehel speaks its replies with the browser's own voice. A chat reply does not
// exist until the model writes it, so a pre-generated clip can never cover one
// — every spoken sentence would otherwise be a paid ElevenLabs request, per
// learner, per message. speechSynthesis is free, needs no key and no network,
// and starts instantly. Lesson narration keeps the recorded Ehel voice; this is
// only for the conversation.

export const browserSpeechSupported = typeof window !== "undefined"
  && "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";

// Chrome fills the voice list asynchronously — getVoices() is empty on the
// first call after load and only populates when voiceschanged fires. Some
// browsers never fire it at all, so the wait is also capped.
let voicesPromise = null;
function loadVoices() {
  if (!browserSpeechSupported) return Promise.resolve([]);
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const ready = speechSynthesis.getVoices();
    if (ready.length) return resolve(ready);
    let settled = false;
    const finish = () => { if (!settled) { settled = true; resolve(speechSynthesis.getVoices()); } };
    speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
    setTimeout(finish, 1500);
  });
  return voicesPromise;
}

// Prefer a natural-sounding English voice. Names differ per platform, so this
// is a preference order rather than a lookup: known-good voices first, then any
// en-GB/en-US, then any English at all, then whatever the browser defaults to.
const PREFERRED_VOICES = [
  "Google UK English Female", "Microsoft Libby Online (Natural) - English (United Kingdom)",
  "Microsoft Sonia Online (Natural) - English (United Kingdom)", "Google US English",
  "Microsoft Aria Online (Natural) - English (United States)", "Samantha", "Karen", "Daniel",
];
function pickVoice(voices) {
  for (const name of PREFERRED_VOICES) {
    const match = voices.find((voice) => voice.name === name);
    if (match) return match;
  }
  return voices.find((v) => /^en[-_](GB|US)/i.test(v.lang))
    || voices.find((v) => /^en\b/i.test(v.lang))
    || null;
}

// Younger learners need it slower. Matches the prompt's own age bands.
export function speechRateForGrade(grade) {
  const n = Number(grade);
  if (n <= 2) return 0.85;
  if (n <= 5) return 0.92;
  return 1;
}

// Emoji and stray symbols are read aloud literally by several engines ("smiling
// face with smiling eyes"), so strip them before speaking. The visible bubble
// keeps them.
function speakableText(text) {
  return String(text || "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}]/gu, " ")
    .replace(/[*_`#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Chrome silently truncates a single utterance after roughly fifteen seconds,
// so speak sentence by sentence and let the queue carry the reply. Splitting
// also gives the pauses a listener expects between sentences.
function speechChunks(text, maximum = 180) {
  const sentences = text.split(/(?<=[.!?…])\s+/);
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if (!current) current = sentence;
    else if (`${current} ${sentence}`.length <= maximum) current = `${current} ${sentence}`;
    else { chunks.push(current); current = sentence; }
  }
  if (current) chunks.push(current);
  // A sentence longer than the cap on its own still has to be broken up.
  return chunks.flatMap((chunk) => {
    if (chunk.length <= maximum * 2) return [chunk];
    const pieces = [];
    for (let at = 0; at < chunk.length; at += maximum) pieces.push(chunk.slice(at, at + maximum));
    return pieces;
  });
}

let speechToken = 0;
export function stopBrowserSpeech() {
  speechToken += 1;
  if (browserSpeechSupported) speechSynthesis.cancel();
}
// Route changes are hash-based in the shell — leaving the tutor page must not
// leave the voice talking over the next section.
if (browserSpeechSupported) window.addEventListener("hashchange", stopBrowserSpeech);

/** Speak text with the browser voice. Resolves when the whole reply finishes. */
export async function speakBrowser(text, { rate = 0.95, onStart, onEnd } = {}) {
  if (!browserSpeechSupported) return false;
  const clean = speakableText(text);
  if (!clean) return false;
  stopBrowserSpeech();
  const token = speechToken;
  const voices = await loadVoices();
  if (token !== speechToken) return false;
  const voice = pickVoice(voices);
  if (onStart) onStart();
  try {
    for (const chunk of speechChunks(clean)) {
      if (token !== speechToken) return false;
      await new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || "en-GB";
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.onend = resolve;
        // Never hang the queue on an engine error — move to the next chunk.
        utterance.onerror = resolve;
        speechSynthesis.speak(utterance);
      });
    }
  } finally {
    if (token === speechToken && onEnd) onEnd();
  }
  return true;
}

// --- browser speech recognition ---------------------------------------------
// Voice input mirrors voice output: the browser's own engine first. It is
// free, starts instantly, and streams interim text while the learner is still
// talking. The MediaRecorder → ElevenLabs STT path stays as the fallback for
// browsers without SpeechRecognition. Looked up at call time, not import time,
// so a test can stub it and so a browser that gains support mid-session wins.
export function speechRecognitionCtor() {
  return (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;
}

/** Listen once and resolve the transcript ("" when nothing was heard).
 * Rejects only when recognition cannot run at all (blocked mic, no engine). */
export function recognizeSpeech({ lang = "en-GB", onInterim } = {}) {
  const Recognition = speechRecognitionCtor();
  if (!Recognition) return Promise.reject(new Error("unsupported"));
  return new Promise((resolve, reject) => {
    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let finalText = "";
    let failure = null;
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const piece = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += piece;
        else interim += piece;
      }
      if (onInterim) onInterim((finalText + interim).trim());
    };
    recognition.onerror = (event) => { failure = event.error || "error"; };
    // Recognition ends itself after a pause in speech; silence and an aborted
    // session both resolve to "" so the caller shows a gentle retry message.
    recognition.onend = () => {
      if (finalText.trim()) resolve(finalText.trim());
      else if (failure && failure !== "no-speech" && failure !== "aborted") reject(new Error(failure));
      else resolve("");
    };
    try { recognition.start(); } catch (error) { reject(error); }
  });
}

export async function askWehel({ meta, messages, channel = "text", mode = "", fetchUnit = null }) {
  const wstoken = new URLSearchParams(location.search).get("wstoken") || undefined;
  const post = async (conversation) => {
    const response = await fetch(WEHEL_CHAT_ENDPOINT, {
      method: "POST",
      credentials: DEV_API ? "same-origin" : "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: meta.subject,
        subjectLabel: meta.subjectLabel,
        grade: meta.grade,
        cambridgeCode: meta.cambridgeCode || "",
        unitNo: meta.unitNo,
        unitTitle: meta.unitTitle,
        learnerName: meta.learnerName || "",
        courseOutline: meta.courseOutline || "",
        unit: meta.unit,
        channel,
        mode: mode || undefined,
        wstoken,
        tools: fetchUnit ? ["get_unit", "get_course_outline"] : [],
        messages: conversation,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || `Wehel is unavailable (${response.status}).`);
    return result;
  };

  // Tool loop: when the model asks for another unit, fetch it HERE — the
  // browser already has same-origin access to the course data tree, so the
  // endpoint stays stateless and never has to reach into the CDN. The tool
  // exchange lives only in this call; the stored transcript keeps plain text.
  const conversation = apiMessages(messages);
  for (let round = 0; round < 4; round += 1) {
    const result = await post(conversation);
    if (result.reply) return String(result.reply);
    if (!result.toolUse || !fetchUnit) break;
    const { id, name, input } = result.toolUse;
    let content;
    try {
      if (name === "get_unit") content = await handleGetUnit(meta, fetchUnit, input);
      else if (name === "get_course_outline") content = await handleGetCourseOutline(meta, input);
      else content = `Unknown tool ${name}.`;
    } catch (error) {
      content = "That could not be looked up right now.";
    }
    conversation.push({ role: "assistant", content: result.assistantContent });
    conversation.push({ role: "user", content: [{ type: "tool_result", tool_use_id: id, content }] });
  }
  throw new Error("Wehel could not answer just now.");
}

export async function transcribeForWehel(blob) {
  const audioBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result).split(",")[1] || ""));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
  const wstoken = new URLSearchParams(location.search).get("wstoken") || undefined;
  const response = await fetch(WEHEL_STT_ENDPOINT, {
    method: "POST",
    credentials: DEV_API ? "same-origin" : "include",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType: blob.type || "audio/webm", purpose: "wehel", wstoken }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.message || "Speech recognition is unavailable.");
  return String(result.text || "").trim();
}

// Inline SVG icons (lucide shapes). The four shell-voice subjects never load
// the lucide runtime, so a data-lucide placeholder renders as an empty element
// there — inline SVG draws everywhere, emoji-font quirks included.
const ICON_PATHS = {
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  volumeOff: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  stop: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
};
export function wehelIcon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="16" height="16" style="vertical-align:-3px">${ICON_PATHS[name] || ""}</svg>`;
}

// mountWehelChat renders the conversation into `container` and owns the whole
// exchange loop. The caller provides the surrounding page (header, asides) and
// re-mounts on route changes; state lives in the caller's progress store so a
// conversation survives reloads exactly like the old canned panel did.
//
// options:
//   container      — element to render into
//   meta           — { subject, subjectLabel, grade, cambridgeCode, unitNo,
//                      unitTitle, unit, learnerName? }
//   store          — object whose `key` array holds {role, text, offline?}
//   key            — property name on store (default "aiMessages")
//   ui             — { $, escapeHtml, toast, voiceButton?, bindVoiceControls? }
//   tutorLabel     — bubble label (default "Wehel")
//   greeting       — first bubble when the transcript is empty
//   placeholder    — input placeholder
//   quickPrompts   — [{ label, message }]
//   mode           — optional mode hint forwarded to the server
//   fetchUnit      — optional (unitNo) => unit JSON, enables the get_unit tool
//   fallbackReply  — (message) => canned text when Wehel is unreachable
//   onExchange     — (exchangeCount) => void, for section completion
//   onSaved        — persist the store (called after every append)
export function mountWehelChat(options) {
  const { container, meta, store, ui } = options;
  const key = options.key || "aiMessages";
  const escapeHtml = ui.escapeHtml;
  const tutorLabel = options.tutorLabel || "Wehel Tutor";
  const greeting = options.greeting || `Hi! I am ${tutorLabel}, your ${meta.subjectLabel} companion. What would you like to do with Unit ${meta.unitNo}: ${meta.unitTitle}?`;
  if (!Array.isArray(store[key])) store[key] = [];
  const messages = store[key];
  const micSupported = Boolean(speechRecognitionCtor())
    || Boolean(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder === "function");
  let busy = false;
  let listening = false;
  let recorder = null;
  let recordedChunks = [];

  // Speech is the browser's, not ElevenLabs': a reply is written at request
  // time, so no recorded clip can exist for it. One engine for the whole
  // conversation also means the learner hears one voice rather than two.
  const speechKey = `wehel-speech-${meta.subject}`;
  const speechRate = speechRateForGrade(meta.grade);
  let speakReplies = browserSpeechSupported && localStorage.getItem(speechKey) !== "off";
  let speakingIndex = null;

  const bubble = (item, index) => {
    const label = item.role === "user" ? "You" : (item.offline ? `${tutorLabel} (offline hint)` : tutorLabel);
    const playing = speakingIndex === index;
    const speak = item.role === "assistant" && browserSpeechSupported
      ? `<button class="button secondary voice-button${playing ? " is-playing" : ""}" data-wehel-speak="${index}" type="button" aria-label="${playing ? "Stop" : `Listen to ${escapeHtml(tutorLabel)}`}">${playing ? `${wehelIcon("stop")} Stop` : `${wehelIcon("volume")} Listen`}</button>`
      : "";
    return `<article class="ai-message ${item.role}"><strong>${escapeHtml(label)}</strong>${escapeHtml(item.text)}${speak}</article>`;
  };

  // Speak one stored reply aloud; index -1 marks the greeting bubble.
  function speakReply(index, text) {
    speakBrowser(text, {
      rate: speechRate,
      onStart: () => { speakingIndex = index; render(); },
      onEnd: () => { speakingIndex = null; render(); },
    });
  }

  function render() {
    container.innerHTML = `
      ${browserSpeechSupported ? `<div class="ai-voice-row"><button class="button secondary" id="wehel-voice-toggle" type="button" aria-pressed="${speakReplies}" title="${speakReplies ? `${escapeHtml(tutorLabel)} reads replies aloud` : "Replies are silent"}">${speakReplies ? `${wehelIcon("volume")} Voice on` : `${wehelIcon("volumeOff")} Voice off`}</button></div>` : ""}
      <div class="ai-conversation" id="wehel-conversation" aria-live="polite">
        ${messages.length ? messages.map(bubble).join("") : bubble({ role: "assistant", text: greeting }, -1)}
        ${busy ? `<article class="ai-message assistant is-thinking"><strong>${escapeHtml(tutorLabel)}</strong><em>is thinking…</em></article>` : ""}
      </div>
      <div class="ai-prompts">${(options.quickPrompts || []).map((prompt) => `<button data-wehel-prompt="${escapeHtml(prompt.message)}" type="button" ${busy ? "disabled" : ""}>${escapeHtml(prompt.label)}</button>`).join("")}</div>
      <form class="ai-compose" id="wehel-form">
        <label class="sr-only" for="wehel-input">Ask ${escapeHtml(tutorLabel)}</label>
        <input id="wehel-input" maxlength="500" placeholder="${escapeHtml(options.placeholder || `Ask about ${meta.unitTitle}…`)}" ${busy ? "disabled" : ""} autocomplete="off">
        ${micSupported ? `<button class="button secondary" id="wehel-mic" type="button" aria-label="Ask by voice" title="Ask by voice" ${busy ? "disabled" : ""}>${wehelIcon("mic")}</button>` : ""}
        <button class="button primary" type="submit" ${busy ? "disabled" : ""}>Send</button>
      </form>`;
    if (ui.bindVoiceControls) ui.bindVoiceControls();
    const voiceToggle = container.querySelector("#wehel-voice-toggle");
    if (voiceToggle) voiceToggle.addEventListener("click", () => {
      speakReplies = !speakReplies;
      localStorage.setItem(speechKey, speakReplies ? "on" : "off");
      if (!speakReplies) { stopBrowserSpeech(); speakingIndex = null; }
      render();
      if (ui.toast) ui.toast(speakReplies ? `${tutorLabel} will read replies aloud.` : `${tutorLabel} is quiet now.`);
    });
    container.querySelectorAll("[data-wehel-speak]").forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.wehelSpeak);
      if (speakingIndex === index) { stopBrowserSpeech(); speakingIndex = null; render(); return; }
      speakReply(index, index === -1 ? greeting : messages[index]?.text || "");
    }));
    container.querySelectorAll("[data-wehel-prompt]").forEach((button) => button.addEventListener("click", () => submit(button.dataset.wehelPrompt, "text")));
    container.querySelector("#wehel-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = container.querySelector("#wehel-input");
      if (input.value.trim()) submit(input.value.trim(), "text");
    });
    const mic = container.querySelector("#wehel-mic");
    if (mic) mic.addEventListener("click", () => toggleMic(mic));
    const conversation = container.querySelector("#wehel-conversation");
    conversation.scrollTop = conversation.scrollHeight;
  }

  function append(item) {
    messages.push(item);
    if (messages.length > 40) messages.splice(0, messages.length - 40);
    if (options.onSaved) options.onSaved();
  }

  async function submit(text, channel) {
    if (busy) return;
    stopBrowserSpeech();
    speakingIndex = null;
    append({ role: "user", text });
    busy = true;
    render();
    let reply;
    let offline = false;
    try {
      reply = await askWehel({ meta, messages, channel, mode: options.mode, fetchUnit: options.fetchUnit || null });
    } catch (error) {
      offline = true;
      reply = options.fallbackReply
        ? options.fallbackReply(text)
        : "I cannot reach my thinking engine right now. Please try again in a moment.";
      if (ui.toast) ui.toast("Wehel is offline right now — showing a built-in hint instead.");
    }
    append({ role: "assistant", text: reply, offline });
    busy = false;
    render();
    const exchanges = messages.filter((item) => item.role === "assistant" && !item.offline).length;
    if (!offline && options.onExchange) options.onExchange(exchanges);
    // Speak the reply with the browser voice — always after a spoken question,
    // and after typed ones too while the voice toggle is on.
    if (browserSpeechSupported && (channel === "voice" || speakReplies)) {
      speakReply(messages.length - 1, reply);
    }
  }

  async function toggleMic(button) {
    // Browser speech recognition first: free, instant, and the learner sees
    // their words appear in the input box while they are still talking.
    if (speechRecognitionCtor()) {
      if (listening) return; // recognition stops itself after a pause
      stopBrowserSpeech();   // never transcribe the tutor's own voice
      speakingIndex = null;
      listening = true;
      const input = container.querySelector("#wehel-input");
      button.classList.add("is-recording");
      button.innerHTML = wehelIcon("mic");
      if (ui.toast) ui.toast("Listening — speak now.");
      try {
        const text = await recognizeSpeech({ onInterim: (interim) => { if (input) input.value = interim; } });
        if (text) { if (input) input.value = ""; submit(text, "voice"); }
        else if (ui.toast) ui.toast("I didn't hear anything — try again.");
      } catch (error) {
        if (ui.toast) ui.toast(error.message === "not-allowed"
          ? "The microphone is blocked for this page."
          : "Voice input is unavailable right now — you can type instead.");
      } finally {
        listening = false;
        button.classList.remove("is-recording");
        button.innerHTML = wehelIcon("mic");
      }
      return;
    }
    // Fallback: record locally, transcribe server-side (ElevenLabs STT).
    if (recorder && recorder.state === "recording") { recorder.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      recorder = new MediaRecorder(stream);
      recorder.addEventListener("dataavailable", (event) => { if (event.data.size) recordedChunks.push(event.data); });
      recorder.addEventListener("stop", async () => {
        stream.getTracks().forEach((track) => track.stop());
        button.classList.remove("is-recording");
        button.innerHTML = wehelIcon("mic");
        const blob = new Blob(recordedChunks, { type: recorder.mimeType || "audio/webm" });
        recorder = null;
        if (!blob.size) return;
        if (ui.toast) ui.toast("Listening back…");
        try {
          const text = await transcribeForWehel(blob);
          if (!text) { if (ui.toast) ui.toast("I could not hear any words. Please try again."); return; }
          submit(text, "voice");
        } catch (error) {
          if (ui.toast) ui.toast(error.message || "Speech recognition is unavailable.");
        }
      });
      recorder.start();
      button.classList.add("is-recording");
      button.innerHTML = wehelIcon("stop");
      if (ui.toast) ui.toast("Recording — press again to stop.");
    } catch (error) {
      if (ui.toast) ui.toast("The microphone is not available.");
    }
  }

  render();
  return { render, submit };
}
