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

// Where Moodle is, for a page Moodle does not serve.
//
// A learner never opens these files from Moodle: course_launch.php redirects
// them to the CDN (progress_gatewaylib.php :: pqpg_ehel_launch_url →
// ehelacademy.b-cdn.net/…/app/<subject>/index.html). A root-relative
// "/local/hubredirect/…" therefore resolves against the CDN, which has no PHP
// and answers 404 — so the runtime voice, the pronunciation check and the tutor
// were unreachable in production while the PHP side had already been given a
// CORS allowlist for exactly this cross-origin call (quiz_tts.php ::
// pqh_quiz_tts_origin_allowed allows `bunny_app_base_url`'s origin).
//
// The origin comes from `pwsEndpoint`, the launch's own absolute URL to the
// progress gateway ($CFG->wwwroot . '/local/prequran/progress_gateway.php').
// Reusing it means there is ONE answer to "where is the platform" and no second
// launch parameter that could drift out of step with it — and it is already the
// parameter that decides where this learner's progress and drafts are posted,
// so it widens no trust boundary.
//
// Anything that is not an http(s) origin is ignored rather than trusted, and no
// pwsEndpoint at all (local dev, a direct link, QA, a Moodle-hosted page) keeps
// the paths root-relative — byte-identical to what shipped before.
function platformOrigin() {
  const endpoint = new URLSearchParams(location.search).get("pwsEndpoint") || "";
  if (!endpoint) return "";
  try {
    const url = new URL(endpoint, location.href);
    if (!/^https?:$/.test(url.protocol) || url.origin === location.origin) return "";
    return url.origin;
  } catch {
    return ""; // an unparseable launch param is not an origin
  }
}
// Resolved once: location.search does not change under the app's hash routing,
// and a per-call parse would only invite the two halves to disagree.
export const PLATFORM_ORIGIN = platformOrigin();
// The dev twins are served by the page's own origin, so they are never rebased.
export const platformUrl = (path) => (DEV_API ? path : `${PLATFORM_ORIGIN}${path}`);

export const WEHEL_CHAT_ENDPOINT = DEV_API ? "/api/wehel-chat" : platformUrl("/local/hubredirect/wehel_chat.php");
export const WEHEL_STT_ENDPOINT = DEV_API ? "/api/elevenlabs-stt" : platformUrl("/local/hubredirect/quiz_stt.php");
export const WEHEL_SOMALI_TTS_ENDPOINT = DEV_API ? "/api/somali-tts" : platformUrl("/local/hubredirect/somali_tts.php");

const HISTORY_LIMIT = 12;

// Blocked third-party storage throws SecurityError on the localStorage property
// itself (the courses run in a cross-origin iframe). Most accesses in this file
// already carry their own try/catch; these two exist for the read-aloud toggle,
// which had none — the read sits in mountWehelChat, so a throw there cost the
// learner the whole tutor, and the write sat in a click handler that threw
// uncaught on every toggle.
const storageGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* the choice just won't persist */ } };

// --- preferred teaching language ---------------------------------------------
// "somali" makes Wehel add Somali FOR VOCABULARY ONLY — the prompt's
// languageSupport block has it translate key words on "Soomaali:" lines while
// every other part of the tutoring stays in English, because English is the
// language of the course. Stored per browser like the voice toggle; Moodle's
// intake field preferred_teaching_language can prefill it later.
const TEACHING_LANGUAGE_KEY = "ehel-teaching-language";
export function preferredTeachingLanguage() {
  try { return localStorage.getItem(TEACHING_LANGUAGE_KEY) === "somali" ? "somali" : "english"; }
  catch { return "english"; }
}
export function setPreferredTeachingLanguage(value) {
  try { localStorage.setItem(TEACHING_LANGUAGE_KEY, value === "somali" ? "somali" : "english"); }
  catch { /* private mode — the choice just won't persist */ }
}

// --- focus -------------------------------------------------------------------
// Focus narrows Wehel's ATTENTION, never its knowledge. The full unit still
// travels as UNIT CONTENT, the year outline still travels, and the get_unit /
// get_course_outline tools still reach every course at every stage — a focused
// learner who asks "is this like Unit 2?" gets the same real answer as before.
// All Focus does is name the module they are working through, so "explain this"
// has a referent and a quiz stays on the page they are actually on.
//
// Stored per subject AND per unit: a module label from Unit 2 means nothing in
// Unit 3. Read back through the unit's own module list rather than trusted, so
// a section that has been renamed, or that this unit's data does not carry,
// falls back to the whole unit instead of pointing Wehel at a page that is not
// there.
const focusStorageKey = (meta) => `ehel-wehel-focus-${meta.subject}-u${meta.unitNo}`;

export function focusModule(meta, modules) {
  const list = Array.isArray(modules) ? modules : [];
  if (!list.length) return null;
  try { return list.find((module) => module.id === localStorage.getItem(focusStorageKey(meta))) || null; }
  catch { return null; }
}
// Focus is read from storage at render time, so every surface showing it has to
// be told when it moves. syncPanels only reaches panels this module mounted —
// English draws its own tutor page — and a picker still showing the old module
// while storage holds the new one is a UI that lies about what the tutor is
// doing. So setFocusModule is the one notification point: whoever changes it,
// everyone hears.
const focusListeners = new Set();

/** Watch for Focus changes. Returns an unsubscribe function. */
export function onFocusChange(listener) {
  focusListeners.add(listener);
  return () => focusListeners.delete(listener);
}

export function setFocusModule(meta, id) {
  try {
    if (id) localStorage.setItem(focusStorageKey(meta), id);
    else localStorage.removeItem(focusStorageKey(meta));
  } catch { /* private mode — the choice just won't persist */ }
  // A listener that throws must not stop the others hearing about it.
  for (const listener of [...focusListeners]) {
    try { listener(); } catch { /* a dead surface is not this one's problem */ }
  }
}

// Turn a subject's section list — [id, icon, label] rows, the same shape the
// nav is built from — into the modules the Focus control offers.
//
// What is dropped is everything that is not part of THIS unit's teaching: the
// tutor panel itself, the progress report, the live-class link, the placement
// exam, and the two capstone pages, which belong to the stage rather than to
// the unit and whose content is not in the unit JSON Wehel holds. Focusing any
// of them would point the tutor at a page it cannot read.
const NON_MODULE_SECTIONS = ["ai", "tutor", "progress", "live", "placement", "capstone", "capstonequiz"];

export function modulesFromSections(sections) {
  const modules = (Array.isArray(sections) ? sections : [])
    .filter((section) => Array.isArray(section) && section[0] && section[2] && !NON_MODULE_SECTIONS.includes(section[0]))
    .map(([id, , label]) => ({ id, label }));
  // One module is not a choice. A prerequisite unit reduces to its overview
  // alone, and a control offering "Whole unit" or the only thing in it is
  // clutter — so the caller gets nothing and the control does not render.
  return modules.length > 1 ? modules : [];
}

// The three things a learner wants once they have narrowed to one module. Each
// carries a mode as well as a message, so the button reaches the teaching the
// system prompt already defines (its EXPLAIN and QUIZ ME playbooks, and the
// teach/practice/help modeHints) instead of depending on the learner happening
// to type the right words.
export function focusPrompts(label) {
  return [
    { label: "Teach me", mode: "teach", message: `Teach me "${label}" from this unit, step by step, starting from the beginning.` },
    { label: "Quiz me", mode: "practice", message: `Quiz me on "${label}" from this unit, one question at a time.` },
    { label: "Explain", mode: "help", message: `Explain "${label}" from this unit a different way from the way the lesson explains it.` },
  ];
}

// "Soomaali:" lines are the prompt's contract for Somali vocabulary: the only
// part of a reply the Somali voice reads, and the part the English browser
// voice must skip. Tolerates the bullets/bold the model sometimes adds even
// though the prompt asks for the bare form.
const SOMALI_LINE = /^\s*(?:[-*•]\s*)*\**\s*Soomaali\s*\**\s*:\s*\**\s*(.+?)\s*$/;
export function somaliLines(text) {
  return String(text || "").split("\n")
    .map((line) => SOMALI_LINE.exec(line)?.[1])
    .filter(Boolean)
    .map((somali) => somali.replace(/\*+$/, "").trim())
    .filter(Boolean);
}
function withoutSomaliLines(text) {
  return String(text || "").split("\n").filter((line) => !SOMALI_LINE.test(line)).join("\n");
}

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
  // One stop for all tutor speech: the Somali clip and the browser voice never
  // talk over each other.
  stopSomaliAudio();
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

// --- Somali vocabulary audio (Azure "Ubax"/Ubah voice) -----------------------
// The browser ships no Somali speechSynthesis voice, so the "Soomaali:" lines
// go to the Azure Speech proxy instead — short vocabulary lines only, fetched
// on an explicit Listen tap, never whole replies and never auto-spoken. Clips
// are cached per text for the session so replaying a bubble is free.

let somaliAudio = null;
const somaliClipCache = new Map(); // text -> object URL

function stopSomaliAudio() {
  if (!somaliAudio) return;
  const audio = somaliAudio;
  somaliAudio = null;
  audio.pause();
  // pause() never fires onended, so release the caller awaiting this clip.
  if (audio.onended) audio.onended();
}

/** Speak Somali text through the Ubah voice. Resolves when the clip finishes. */
export async function speakSomali(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return false;
  stopBrowserSpeech();
  let url = somaliClipCache.get(clean);
  if (!url) {
    const wstoken = new URLSearchParams(location.search).get("wstoken") || undefined;
    const response = await fetch(WEHEL_SOMALI_TTS_ENDPOINT, {
      method: "POST",
      credentials: DEV_API ? "same-origin" : "include",
      headers: { Accept: "audio/mpeg", "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, wstoken }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || `The Somali voice is unavailable (${response.status}).`);
    }
    url = URL.createObjectURL(await response.blob());
    somaliClipCache.set(clean, url);
  }
  await new Promise((resolve, reject) => {
    const audio = new Audio(url);
    let settled = false;
    const finish = (failed) => () => {
      if (settled) return;
      settled = true;
      if (somaliAudio === audio) somaliAudio = null;
      if (failed) reject(new Error("The Somali clip could not be played."));
      else resolve();
    };
    audio.onended = finish(false);
    audio.onerror = finish(true);
    somaliAudio = audio;
    audio.play().catch(finish(true));
  });
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

// Live panels sharing one transcript. The dock drawer and the nav section can
// both be mounted at once over the same store, so an append in either has to
// repaint the other — otherwise the learner opens the drawer and finds the
// conversation they just had is missing. Panels whose container has left the
// DOM are dropped on the next notify rather than tracked.
const livePanels = new Set();
function syncPanels(source) {
  for (const panel of [...livePanels]) {
    if (!panel.container.isConnected) { livePanels.delete(panel); continue; }
    if (panel !== source) panel.render();
  }
}

export async function askWehel({ meta, messages, channel = "text", mode = "", sectionHint = "", focus = null, fetchUnit = null }) {
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
        teachingLanguage: preferredTeachingLanguage(),
        channel,
        mode: mode || undefined,
        sectionHint: sectionHint || undefined,
        // Label only — the endpoints name the module in the prompt, and the
        // unit's own content is already there for the model to find it in.
        focus: focus?.label ? { label: focus.label } : undefined,
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
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  volumeOff: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  stop: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
};
export function wehelIcon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="16" height="16" style="vertical-align:-3px">${ICON_PATHS[name] || ""}</svg>`;
}

// --- panel skin ---------------------------------------------------------------
// The chat panel's own stylesheet, injected once by this module rather than
// added to any subject's course-ui.css. Two reasons that matter:
//
//   * english/shared/course-ui.css is @imported by Global Perspectives, so a
//     rule added there lands in a second subject on that file's cache schedule.
//     Shipping the skin with the component keeps it where the markup is.
//   * every rule is prefixed .wehel-panel, which only ever exists on a container
//     this module rendered into. No selector here can reach a lesson page — the
//     same containment the deck CSS uses, for the same reason.
//
// The look is warm and rounded for a young learner, but deliberately stops short
// of babyish: intensive-english mounts this identical panel for ADULT beginners,
// and a Grade 8 student is not a small child either. Friendly, not cartoonish.
const PANEL_STYLE_ID = "wehel-panel-style";
const PANEL_STYLE = `
.wehel-panel{--w-ink:#17324d;--w-teal:#0f766e;--w-teal-soft:#e8f5f2;--w-warm:#f8b34a;
  --w-line:rgba(15,23,42,.12);--w-radius:20px;color:var(--w-ink)}
.wehel-panel *{box-sizing:border-box}
/* .sr-only is only defined in english/shared/course-ui.css, which four of the
   six subjects never load — so the panel carries its own copy rather than
   letting the compose label and the thinking text render visibly there. */
.wehel-panel .sr-only{position:absolute!important;width:1px!important;height:1px!important;
  padding:0!important;margin:-1px!important;overflow:hidden!important;
  clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}

/* toolbar — voice, focus and language, compact so it never outweighs the talk */
.wehel-panel .ai-voice-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  padding:8px;margin-bottom:12px;border:1px solid var(--w-line);border-radius:14px;
  background:linear-gradient(180deg,rgba(232,245,242,.75),rgba(232,245,242,.35))}
.wehel-panel .ai-voice-row label{display:inline-flex;align-items:center;gap:6px;
  font-size:12.5px;font-weight:650;letter-spacing:.01em;opacity:.8}
.wehel-panel .ai-voice-row select{font:inherit;font-size:13px;padding:6px 10px;
  border:1px solid var(--w-line);border-radius:999px;background:#fff;color:inherit;
  cursor:pointer;max-width:min(46vw,190px)}
.wehel-panel .ai-voice-row select:hover{border-color:var(--w-teal)}
.wehel-panel #wehel-voice-toggle{border-radius:999px;padding:6px 14px;font-size:13px;font-weight:700}

/* conversation */
.wehel-panel .ai-conversation{display:flex;flex-direction:column;gap:14px;
  padding:4px 2px 8px;max-height:min(56vh,520px);overflow-y:auto;scroll-behavior:smooth}
.wehel-panel .ai-message{display:grid;grid-template-columns:auto 1fr;gap:10px;
  align-items:start;border:0;padding:0;margin:0;background:none;animation:wehel-rise .22s ease both}
.wehel-panel .ai-message.user{grid-template-columns:1fr auto;justify-items:end}
.wehel-panel .w-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;
  flex:none;color:#fff;background:linear-gradient(140deg,var(--w-teal),#12a594);
  box-shadow:0 2px 8px rgba(15,118,110,.28)}
.wehel-panel .ai-message.user .w-avatar{background:linear-gradient(140deg,#5b7cfa,#7f6ef0);
  box-shadow:0 2px 8px rgba(91,124,250,.28);order:2}
.wehel-panel .w-body{min-width:0;max-width:min(88%,52ch)}
.wehel-panel .ai-message.user .w-body{order:1;text-align:left}
.wehel-panel .w-who{display:block;margin:0 0 4px;font-size:11.5px;font-weight:800;
  letter-spacing:.05em;text-transform:uppercase;opacity:.55}
.wehel-panel .w-text{margin:0;padding:12px 15px;border-radius:var(--w-radius);
  font-size:15.5px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;
  background:#fff;border:1px solid var(--w-line);border-top-left-radius:6px;
  box-shadow:0 1px 2px rgba(15,23,42,.05)}
.wehel-panel .ai-message.user .w-text{background:linear-gradient(160deg,#eef2ff,#e7ecff);
  border-color:rgba(91,124,250,.28);border-top-left-radius:var(--w-radius);border-top-right-radius:6px}
.wehel-panel .ai-message.assistant .w-text{background:linear-gradient(170deg,#fff,var(--w-teal-soft))}
.wehel-panel .w-tools{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
.wehel-panel .w-tools .button{border-radius:999px;padding:5px 12px;font-size:12.5px;font-weight:700}
.wehel-panel .voice-button.is-playing{background:var(--w-warm);border-color:var(--w-warm);color:#4a3208}

/* thinking — three dots instead of a sentence that reads like a reply */
.wehel-panel .is-thinking .w-text{display:inline-flex;gap:5px;align-items:center;padding:14px 16px}
.wehel-panel .w-dot{width:7px;height:7px;border-radius:50%;background:var(--w-teal);opacity:.45;
  animation:wehel-bounce 1.1s infinite ease-in-out}
.wehel-panel .w-dot:nth-child(2){animation-delay:.15s}
.wehel-panel .w-dot:nth-child(3){animation-delay:.3s}

/* quick prompts — tappable chips, big enough for a small finger */
.wehel-panel .ai-prompts{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 12px}
.wehel-panel .ai-prompts button{min-height:38px;padding:8px 15px;border-radius:999px;
  border:1.5px solid rgba(15,118,110,.28);background:#fff;color:var(--w-teal);
  font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;
  transition:transform .12s ease,background .12s ease,box-shadow .12s ease}
.wehel-panel .ai-prompts button:hover:not(:disabled){background:var(--w-teal-soft);
  transform:translateY(-1px);box-shadow:0 3px 10px rgba(15,118,110,.15)}
.wehel-panel .ai-prompts button:disabled{opacity:.5;cursor:default}

/* compose */
.wehel-panel .ai-compose{display:flex;align-items:center;gap:8px;padding:7px 7px 7px 8px;
  border:1.5px solid var(--w-line);border-radius:999px;background:#fff;
  transition:border-color .15s ease,box-shadow .15s ease}
.wehel-panel .ai-compose:focus-within{border-color:var(--w-teal);
  box-shadow:0 0 0 4px rgba(15,118,110,.13)}
.wehel-panel .ai-compose input{flex:1;min-width:0;border:0;outline:none;background:none;
  font:inherit;font-size:15.5px;padding:8px 8px 8px 10px;color:inherit}
.wehel-panel .ai-compose input::placeholder{color:rgba(23,50,77,.45)}
/* width:auto is load-bearing. Subject stylesheets give .ai-compose .button a
   full-width basis (it was a stacked form there), so flex:none alone pinned the
   Send button at 285px and starved the input to 18px at phone width. */
.wehel-panel .ai-compose .button{flex:0 0 auto;width:auto;min-height:42px;
  border-radius:999px;font-weight:750;white-space:nowrap}
.wehel-panel #wehel-mic{width:42px;padding:0;display:grid;place-items:center}
.wehel-panel #wehel-mic.is-recording{background:#e4572e;border-color:#e4572e;color:#fff;
  animation:wehel-pulse 1.3s infinite}
.wehel-panel .ai-compose button[type=submit]{padding:0 18px;display:inline-flex;align-items:center;gap:7px;
  background:linear-gradient(140deg,var(--w-teal),#12a594);border-color:transparent;color:#fff}

@keyframes wehel-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes wehel-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
@keyframes wehel-pulse{0%,100%{box-shadow:0 0 0 0 rgba(228,87,46,.45)}50%{box-shadow:0 0 0 7px rgba(228,87,46,0)}}
@media (prefers-reduced-motion:reduce){
  .wehel-panel .ai-message,.wehel-panel .w-dot,.wehel-panel #wehel-mic.is-recording{animation:none}
  .wehel-panel .ai-conversation{scroll-behavior:auto}
  .wehel-panel .ai-prompts button:hover:not(:disabled){transform:none}
}
@media (max-width:640px){
  .wehel-panel .w-body{max-width:100%}
  .wehel-panel .w-text{font-size:15px}
  .wehel-panel .ai-voice-row label{font-size:12px}
}`;

function ensurePanelStyle() {
  if (typeof document === "undefined" || document.getElementById(PANEL_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PANEL_STYLE_ID;
  style.textContent = PANEL_STYLE;
  document.head.appendChild(style);
}

// mountWehelChat renders the conversation into `container` and owns the whole
// exchange loop. The caller provides the surrounding page (header, asides) and
// re-mounts on route changes; state lives in the caller's progress store so a
// conversation survives reloads exactly like the old canned panel did.
//
// options:
//   container      — element to render into
//   meta           — { subject, subjectLabel, grade, cambridgeCode, unitNo,
//                      unitTitle, unit, learnerName?, modules? }
//                    modules is [{ id, label }] for this unit's content pages
//                    and is what the Focus control offers; omit it and the
//                    control does not render at all.
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
  // Skin: one class on the container is what every rule in PANEL_STYLE hangs
  // off, so the stylesheet cannot reach anything this module did not render.
  ensurePanelStyle();
  container.classList.add("wehel-panel");
  const key = options.key || "aiMessages";
  const escapeHtml = ui.escapeHtml;
  const tutorLabel = options.tutorLabel || "Wehel Tutor";
  const baseGreeting = options.greeting || `Hi! I am ${tutorLabel}, your ${meta.subjectLabel} companion. What would you like to do with Unit ${meta.unitNo}: ${meta.unitTitle}?`;
  // A focused learner is greeted by where they are, and offered the same three
  // things the focused quick prompts do — the greeting is the first place the
  // setting has to be visible, or Focus looks like it did nothing.
  const greetingFor = (focus) => (focus
    ? `Hi! I am ${tutorLabel}. We are on "${focus.label}" in Unit ${meta.unitNo}: ${meta.unitTitle}. Shall I teach it, quiz you on it, or explain it a different way?`
    : baseGreeting);
  const modules = (Array.isArray(meta.modules) ? meta.modules : []).filter((module) => module && module.id && module.label);
  if (!Array.isArray(store[key])) store[key] = [];
  const messages = store[key];
  const micSupported = Boolean(speechRecognitionCtor())
    || Boolean(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder === "function");
  let busy = false;
  let listening = false;
  let recorder = null;
  let recordedChunks = [];
  let panel = null; // this panel's registry entry, assigned after first render

  // Speech is the browser's, not ElevenLabs': a reply is written at request
  // time, so no recorded clip can exist for it. One engine for the whole
  // conversation also means the learner hears one voice rather than two.
  const speechKey = `wehel-speech-${meta.subject}`;
  const speechRate = speechRateForGrade(meta.grade);
  let speakReplies = browserSpeechSupported && storageGet(speechKey) !== "off";
  let speakingIndex = null;
  let somaliSpeakingIndex = null;

  const bubble = (item, index) => {
    const label = item.role === "user" ? "You" : (item.offline ? `${tutorLabel} (offline hint)` : tutorLabel);
    const playing = speakingIndex === index;
    const speak = item.role === "assistant" && browserSpeechSupported
      ? `<button class="button secondary voice-button${playing ? " is-playing" : ""}" data-wehel-speak="${index}" type="button" aria-label="${playing ? "Stop" : `Listen to ${escapeHtml(tutorLabel)}`}">${playing ? `${wehelIcon("stop")} Stop` : `${wehelIcon("volume")} Listen`}</button>`
      : "";
    // Somali vocabulary lines get their own Listen button (the Azure Ubah
    // voice) — the browser's English voice never reads them.
    const somaliPlaying = somaliSpeakingIndex === index;
    const somali = item.role === "assistant" && preferredTeachingLanguage() === "somali" && somaliLines(item.text).length
      ? `<button class="button secondary voice-button${somaliPlaying ? " is-playing" : ""}" data-wehel-somali="${index}" type="button" aria-label="${somaliPlaying ? "Stop the Somali voice" : "Listen in Somali (Ubah)"}">${somaliPlaying ? `${wehelIcon("stop")} Jooji` : `${wehelIcon("volume")} Soomaali`}</button>`
      : "";
    // Structure only: the article keeps its .ai-message/.user/.assistant classes
    // and both buttons keep their exact classes, data attributes and wording —
    // the handlers and the audio-coverage checks read those.
    const avatar = item.role === "user" ? "You" : tutorLabel;
    const tools = speak || somali
      ? `<div class="w-tools">${speak}${somali}</div>`
      : "";
    return `<article class="ai-message ${item.role}">`
      + `<span class="w-avatar" role="img" aria-label="${escapeHtml(avatar)}">${wehelIcon(item.role === "user" ? "user" : "sparkle")}</span>`
      + `<div class="w-body"><strong class="w-who">${escapeHtml(label)}</strong>`
      + `<p class="w-text">${escapeHtml(item.text)}</p>${tools}</div></article>`;
  };

  // Speak one stored reply aloud; index -1 marks the greeting bubble. The
  // "Soomaali:" lines are dropped first — the English engine mangles Somali,
  // and the bubble's own Soomaali button owns those lines.
  function speakReply(index, text) {
    speakBrowser(withoutSomaliLines(text), {
      rate: speechRate,
      onStart: () => { speakingIndex = index; render(); },
      onEnd: () => { speakingIndex = null; render(); },
    });
  }

  function render() {
    const teachingLanguage = preferredTeachingLanguage();
    // Read at render time, not at mount: the drawer and the Tutor page can both
    // be live over one store, and syncPanels repaints the sibling — so changing
    // Focus in either is immediately true in both.
    const focus = focusModule(meta, modules);
    const greeting = greetingFor(focus);
    // Focused, the subject's own quick prompts step aside for the three the
    // learner asked for. Unfocused, nothing about this changes.
    const prompts = focus ? focusPrompts(focus.label) : [...(options.quickPrompts || [])];
    // The Somali option is vocabulary-only, so the extra quick prompt asks for
    // exactly that — key words with their Somali translations, from the focused
    // module when there is one.
    if (teachingLanguage === "somali") {
      prompts.push({ label: "Erayada af-Soomaali", message: focus
        ? `Teach me the key words in "${focus.label}" and give the Somali translation for each one.`
        : "Teach me this unit's key words and give the Somali translation for each one." });
    }
    container.innerHTML = `
      <div class="ai-voice-row">
        ${browserSpeechSupported ? `<button class="button secondary" id="wehel-voice-toggle" type="button" aria-pressed="${speakReplies}" title="${speakReplies ? `${escapeHtml(tutorLabel)} reads replies aloud` : "Replies are silent"}">${speakReplies ? `${wehelIcon("volume")} Voice on` : `${wehelIcon("volumeOff")} Voice off`}</button>` : ""}
        ${modules.length ? `<label for="wehel-focus">Focus
          <select id="wehel-focus">
            <option value="">Whole unit</option>
            ${modules.map((module) => `<option value="${escapeHtml(module.id)}"${focus && focus.id === module.id ? " selected" : ""}>${escapeHtml(module.label)}</option>`).join("")}
          </select>
        </label>` : ""}
        <label for="wehel-language" style="margin-left:auto">Teaching language
          <select id="wehel-language">
            <option value="english"${teachingLanguage === "english" ? " selected" : ""}>English</option>
            <option value="somali"${teachingLanguage === "somali" ? " selected" : ""}>Soomaali (erayada)</option>
          </select>
        </label>
      </div>
      <div class="ai-conversation" id="wehel-conversation" aria-live="polite">
        ${messages.length ? messages.map(bubble).join("") : bubble({ role: "assistant", text: greeting }, -1)}
        ${busy ? `<article class="ai-message assistant is-thinking"><span class="w-avatar" role="img" aria-label="${escapeHtml(tutorLabel)}">${wehelIcon("sparkle")}</span><div class="w-body"><strong class="w-who">${escapeHtml(tutorLabel)}</strong><p class="w-text"><span class="w-dot"></span><span class="w-dot"></span><span class="w-dot"></span><span class="sr-only">is thinking…</span></p></div></article>` : ""}
      </div>
      <div class="ai-prompts">${prompts.map((prompt) => `<button data-wehel-prompt="${escapeHtml(prompt.message)}" data-wehel-mode="${escapeHtml(prompt.mode || "")}" type="button" ${busy ? "disabled" : ""}>${escapeHtml(prompt.label)}</button>`).join("")}</div>
      <form class="ai-compose" id="wehel-form">
        <label class="sr-only" for="wehel-input">Ask ${escapeHtml(tutorLabel)}</label>
        <input id="wehel-input" maxlength="500" placeholder="${escapeHtml(focus ? `Ask about ${focus.label}…` : (options.placeholder || `Ask about ${meta.unitTitle}…`))}" ${busy ? "disabled" : ""} autocomplete="off">
        ${micSupported ? `<button class="button secondary" id="wehel-mic" type="button" aria-label="Ask by voice" title="Ask by voice" ${busy ? "disabled" : ""}>${wehelIcon("mic")}</button>` : ""}
        <button class="button primary" type="submit" ${busy ? "disabled" : ""}>${wehelIcon("send")} Send</button>
      </form>`;
    if (ui.bindVoiceControls) ui.bindVoiceControls();
    const voiceToggle = container.querySelector("#wehel-voice-toggle");
    if (voiceToggle) voiceToggle.addEventListener("click", () => {
      speakReplies = !speakReplies;
      storageSet(speechKey, speakReplies ? "on" : "off");
      if (!speakReplies) { stopBrowserSpeech(); speakingIndex = null; }
      render();
      if (ui.toast) ui.toast(speakReplies ? `${tutorLabel} will read replies aloud.` : `${tutorLabel} is quiet now.`);
    });
    container.querySelectorAll("[data-wehel-speak]").forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.wehelSpeak);
      if (speakingIndex === index) { stopBrowserSpeech(); speakingIndex = null; render(); return; }
      somaliSpeakingIndex = null;
      speakReply(index, index === -1 ? greeting : messages[index]?.text || "");
    }));
    container.querySelectorAll("[data-wehel-somali]").forEach((button) => button.addEventListener("click", async () => {
      const index = Number(button.dataset.wehelSomali);
      if (somaliSpeakingIndex === index) { stopBrowserSpeech(); somaliSpeakingIndex = null; render(); return; }
      const text = somaliLines(index === -1 ? greeting : messages[index]?.text || "").join(". ");
      speakingIndex = null;
      somaliSpeakingIndex = index;
      render();
      try {
        await speakSomali(text);
      } catch (error) {
        if (ui.toast) ui.toast(error.message || "The Somali voice is unavailable right now.");
      } finally {
        if (somaliSpeakingIndex === index) { somaliSpeakingIndex = null; render(); }
      }
    }));
    const languageSelect = container.querySelector("#wehel-language");
    if (languageSelect) languageSelect.addEventListener("change", () => {
      setPreferredTeachingLanguage(languageSelect.value);
      stopBrowserSpeech();
      speakingIndex = null;
      somaliSpeakingIndex = null;
      render();
      syncPanels(panel);
      if (ui.toast) ui.toast(languageSelect.value === "somali"
        ? "Wehel will add Somali for key words — erayada oo af-Soomaali ah."
        : "Wehel will use English only.");
    });
    const focusSelect = container.querySelector("#wehel-focus");
    if (focusSelect) focusSelect.addEventListener("change", () => {
      // No render()/syncPanels here: setFocusModule notifies every surface,
      // this panel included, so repainting again would be a double render.
      setFocusModule(meta, focusSelect.value);
      const chosen = modules.find((module) => module.id === focusSelect.value);
      if (ui.toast) ui.toast(chosen
        ? `${tutorLabel} is staying on ${chosen.label} — still happy to answer anything else.`
        : `${tutorLabel} is back to the whole unit.`);
    });
    container.querySelectorAll("[data-wehel-prompt]").forEach((button) => button.addEventListener("click", () => submit(button.dataset.wehelPrompt, "text", button.dataset.wehelMode || "")));
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
    syncPanels(panel);
  }

  // modeHint: a focused quick prompt names its own mode ("teach", "practice",
  // "help"); a typed message falls back to the panel's mode as before.
  async function submit(text, channel, modeHint = "") {
    if (busy) return;
    stopBrowserSpeech();
    speakingIndex = null;
    somaliSpeakingIndex = null;
    append({ role: "user", text });
    busy = true;
    render();
    let reply;
    let offline = false;
    try {
      reply = await askWehel({ meta, messages, channel, mode: modeHint || options.mode,
        sectionHint: typeof options.sectionHint === "function" ? options.sectionHint() : options.sectionHint,
        focus: focusModule(meta, modules),
        fetchUnit: options.fetchUnit || null });
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
      somaliSpeakingIndex = null;
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
  panel = { container, render, submit };
  livePanels.add(panel);
  // Repaint when Focus moves anywhere — the sibling panel, or a subject's own
  // tutor page. Self-unsubscribing, the way syncPanels drops panels whose
  // container has left the DOM, so a closed drawer stops listening.
  const stopFocusWatch = onFocusChange(() => {
    if (!container.isConnected) { stopFocusWatch(); return; }
    render();
  });
  return panel;
}
