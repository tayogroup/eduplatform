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

// What proves who is calling, once the call is cross-origin.
//
// `credentials: "include"` is not enough and never was: MoodleSessionep1 is
// issued with no SameSite attribute, which every current browser treats as
// SameSite=Lax, and Lax cookies are not sent on a cross-site POST. Measured on
// the live platform — an unauthenticated cross-origin POST to quiz_tts.php
// answers 303 to /login/index.php with an HTML body, where the caller is
// waiting for audio.
//
// So the same credential the progress gateway takes is sent here: the HS256
// launch token from ?pwsToken, server-signed, carrying the user in `sub` and
// expiring in 12 hours. The app cannot forge or read it meaningfully — it holds
// no secret — it only presents it, and the server verifies
// (accesslib.php :: pqh_launch_token_userid).
//
// credentials stays "include" alongside it: a same-origin or Moodle-hosted page
// still has its cookie, and that path is unchanged.
const LAUNCH_TOKEN = (new URLSearchParams(location.search).get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");
export function platformHeaders(extra = {}) {
  return LAUNCH_TOKEN ? { ...extra, Authorization: `Bearer ${LAUNCH_TOKEN}` } : { ...extra };
}

export const WEHEL_CHAT_ENDPOINT = DEV_API ? "/api/wehel-chat" : platformUrl("/local/hubredirect/wehel_chat.php");
export const WEHEL_HOMEWORK_ENDPOINT = DEV_API ? "/api/wehel-homework" : platformUrl("/local/hubredirect/wehel_homework.php");
// Wehel's voice is Deepgram, and ONLY Wehel's (owner decision 2026-08-20):
// spoken replies through wehel_speak.php (Aura-2, voice aura-2-thalia-en) and
// mic input through wehel_listen.php. The lesson narration and pronunciation
// check stay on ElevenLabs (quiz_tts/quiz_stt). Wehel is English-only: the
// Somali vocabulary lines, the Teaching-language switch and the Azure Ubah
// narration were removed on the owner's instruction (2026-08-23).
export const WEHEL_STT_ENDPOINT = DEV_API ? "/api/wehel-listen" : platformUrl("/local/hubredirect/wehel_listen.php");
export const WEHEL_TTS_ENDPOINT = DEV_API ? "/api/wehel-speak" : platformUrl("/local/hubredirect/wehel_speak.php");

const HISTORY_LIMIT = 12;

// Blocked third-party storage throws SecurityError on the localStorage property
// itself (the courses run in a cross-origin iframe). Most accesses in this file
// already carry their own try/catch; these two exist for the read-aloud toggle,
// which had none — the read sits in mountWehelChat, so a throw there cost the
// learner the whole tutor, and the write sat in a click handler that threw
// uncaught on every toggle.
const storageGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* the choice just won't persist */ } };

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
// `scope` is the word for where the material lives — "this unit" for a school
// learner walking their course, "this lesson" for the tutoring category, who
// arrived at this page by searching a topic and has no unit position for the
// word to mean anything against. Callers pass it from unitWord() below.
export function focusPrompts(label, scope = "this unit") {
  return [
    { label: "Teach me", mode: "teach", message: `Teach me "${label}" from ${scope}, step by step, starting from the beginning.` },
    { label: "Quiz me", mode: "practice", message: `Quiz me on "${label}" from ${scope}, one question at a time.` },
    { label: "Explain", mode: "help", message: `Explain "${label}" from ${scope} a different way from the way the lesson explains it.` },
  ];
}

// --- persona: Tutor | Virtual teacher ------------------------------------------
// Tutor (the default) waits for questions. Virtual teacher LEADS: it frames the
// activity on screen the way a classroom teacher would, then walks the learner
// through it one step at a time, saying what is expected at each step, until it
// is complete — and then tells them to press the page's own Check/Done/Record,
// because the record of their work comes from doing it on the page, never
// from the tutor (owner decision 2026-08-20: guide to completion, never mark
// complete). The role is a prompt block (modeHints.virtual-teacher) plus this
// chip set; the transcript rules and the cached core prompt are untouched.
//
// Stored per subject AND per unit like Focus: a role chosen for this activity
// does not silently carry into another unit's page.
const personaStorageKey = (meta) => `ehel-wehel-persona-${meta.subject}-u${meta.unitNo}`;
export function wehelPersona(meta) {
  return storageGet(personaStorageKey(meta)) === "teacher" ? "teacher" : "tutor";
}
export function setWehelPersona(meta, persona) {
  storageSet(personaStorageKey(meta), persona === "teacher" ? "teacher" : "tutor");
}

// The combined opening chip — "Start this activity" and "What's expected of
// me?" in one (owner decision 2026-08-20). The same message the Grade 1
// generator sends when it pre-generates this reply (tools/
// generate-ehel-teacher-scripts.mjs, TEACH_ME_MESSAGE — the gate holds the
// two equal), so a stored script and a live one answer the same ask.
export const TEACH_ME_MESSAGE = "Be my teacher for this activity: explain what it is and why we are doing it, tell me what you expect from me, then take me through it step by step — one step at a time.";

// The flow itself, as chips: every one carries the virtual-teacher mode so the
// playbook is in force whichever the learner presses, and the wording says the
// move in the learner's own voice. `teach` marks the opening chip, which for
// Grade 1 is answered from the stored script when one exists (see submit).
export function teacherPrompts() {
  return [
    { label: "Teach me the activity", mode: "virtual-teacher", teach: true, message: TEACH_ME_MESSAGE },
    { label: "Done — next step", mode: "virtual-teacher", message: "I have done that step. Please check it and give me the next step." },
    { label: "I'm stuck", mode: "virtual-teacher", message: "I am stuck on this step. Help me with a hint, not the answer." },
    { label: "Explain that again", mode: "virtual-teacher", message: "Please explain that step again, a different way and more simply." },
  ];
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
// Exported for tools/check-wehel-contract.mjs, which holds this to the three
// transcript rules below by behaviour rather than by reading the source.
export function apiMessages(stored) {
  // A canned offline hint is not Wehel's answer — the bubble says so in
  // words. Sending it as an assistant turn made the model ADOPT it: it would
  // resume the hint's off-topic mini-lesson ("day" for "birthday") instead
  // of the learner's next question, so one hiccup poisoned every later turn.
  //
  // The QUESTION the hint answered goes with it. Leaving it in strands an
  // answerless user turn that merges into the learner's next question, and
  // the model then answers a backlog in written order — "Three good
  // questions!" to a learner who asked one, with the real question served
  // last. On screen that exchange already completed (the hint said "ask
  // again in a moment"); if the learner still cares, they will re-ask.
  const recent = stored.slice(-HISTORY_LIMIT);
  const skip = new Set();
  recent.forEach((item, index) => {
    if (!item.offline) return;
    skip.add(index);
    if (index > 0 && recent[index - 1].role === "user") skip.add(index - 1);
  });
  const kept = [];
  recent.forEach((item, index) => {
    if (skip.has(index)) return;
    const role = item.role === "assistant" ? "assistant" : "user";
    const content = String(item.text || "").trim();
    if (!content) return;
    kept.push({ role, content });
  });
  // A question with no reply after it is an ABANDONED ask — the input locks
  // while a reply is pending, so the only way two user turns sit adjacent is
  // that the tab was closed mid-request and the answer never landed. The
  // transcript survives in localStorage, so those strays resurfaced in every
  // later payload and the model answered a phantom backlog ("Two more you
  // asked about…") instead of the question in front of it. Keep only the
  // newest question of such a run.
  const merged = [];
  kept.forEach((item, index) => {
    if (item.role === "user" && index < kept.length - 1 && kept[index + 1].role === "user") return;
    if (merged.length && merged[merged.length - 1].role === item.role) merged[merged.length - 1].content += `\n${item.content}`;
    else merged.push({ role: item.role, content: item.content });
  });
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

// The unit JSON is written for the APP, and most of its weight is media
// plumbing the tutor can do nothing with: every narrated line carries an audio
// descriptor (file path, duration, voice id, provider, hash). In English that
// is 63% of the file — Grade 2 Unit 1 is 400KB, of which 250KB is audio
// bookkeeping for vocabulary sentences.
//
// That mattered because the server caps unit content at a fixed size: past the
// cap the rest is simply invisible, and in English the cut landed just after
// the word lists, so the tutor could not see the readings, grammar, quizzes or
// answer keys of ANY of its 81 units — it taught vocabulary because vocabulary
// was all it had. Stripping the descriptors takes the worst unit in the whole
// academy to 150KB and leaves every word of teaching content intact.
//
// Only keys named `audio` or ending in `Audio` are dropped, so the whole
// descriptor object goes with them and nothing is trimmed field by field —
// a teaching field can never be caught by accident.
export function withoutMediaPlumbing(value) {
  if (Array.isArray(value)) return value.map(withoutMediaPlumbing);
  if (value && typeof value === "object") {
    const kept = {};
    for (const [key, item] of Object.entries(value)) {
      if (/^audio$|Audio$/.test(key)) continue;
      kept[key] = withoutMediaPlumbing(item);
    }
    return kept;
  }
  return value;
}

// English's `dictionaryLinks` is one entry per vocabulary word, and since the
// 2026-08-21 vocabulary expansion the Grade 2-8 units carry 160 to 420 of
// them. Each entry is mostly what the app's dictionary feature needs and the
// tutor cannot use — nine identifier fields, the audio descriptors (already
// stripped above), the learner-facing "try this with the tutor" prompt, the
// spelling split, the practice sentences the page prints — and the rest is the
// ONLY copy of the word's meaning in the unit: vocabularyGroups holds ids
// alone. Sent as-is, the biggest unit is 577KB against the 200KB cap, which
// cut the tutor off from everything after the word list — the exact defect the
// cap was raised to end. Dropping the field whole would blind it to every
// meaning instead. So the tutor gets the teaching text alone, grouped the way
// the unit groups it: vocabularyDictionary: { "<group>": ["word : meaning :
// example", …] }. Biggest unit after this: 193KB. The contract gate proves the
// projection keeps every word, meaning and example, touches nothing outside
// dictionaryLinks, and that every unit in the academy fits.
export function compactDictionaryLinks(unit) {
  if (!unit || typeof unit !== "object" || !Array.isArray(unit.dictionaryLinks)) return unit;
  const groups = {};
  for (const entry of unit.dictionaryLinks) {
    if (!entry || typeof entry !== "object") continue;
    const group = String(entry.groupTitle || "Words");
    const line = [entry.masterWord, entry.childMeaning, entry.exampleSentence].filter(Boolean).join(" : ");
    if (line) (groups[group] ||= []).push(line);
  }
  const { dictionaryLinks, ...rest } = unit;
  return { ...rest, vocabularyDictionary: groups };
}

// What the tutor is actually sent: the unit minus media plumbing, with the
// dictionary compacted. Both call sites (the open unit and get_unit) use this
// one function, so the gate's "every unit fits" check measures the real payload.
export function unitForTutor(unit) {
  return compactDictionaryLinks(withoutMediaPlumbing(unit));
}

// One cap, matching wehel_chat.php's. Raised from 120000 with the strip above:
// every one of the academy's 410 units now fits whole, with room to spare.
export const UNIT_JSON_LIMIT = 200000;

// --- homework ------------------------------------------------------------------
// The learner's REAL assigned homework, so "help me with my homework" has a
// referent the tutor can see. Two sources, both server-side in
// wehel_homework.php: the workspace homework system (local_prequran_homework,
// the teacher-assigned tasks with due dates and points) and the BBB live-class
// notes (local_prequran_live_note.homework, what the teacher set after a live
// session). Learners without either — including every learner whose account
// the platform cannot resolve — simply get an empty list, and everything below
// renders exactly as it did before homework existed.
//
// The caps live in three files and the contract gate holds them equal, the same
// way UNIT_JSON_LIMIT is held: the smallest would win silently.
export const HOMEWORK_CONTEXT_LIMIT = 6000;
export const WEHEL_ATTACH_DAILY_LIMIT = 5;
export const WEHEL_ATTACH_PER_MESSAGE = 2;

// Fetched once per page load and shared by every panel and every askWehel call
// — the list moves when a teacher grades or assigns, which is never mid-chat.
// A failed fetch resolves [] and clears the memo so a later call may retry.
let homeworkPromise = null;
export function fetchWehelHomework() {
  // Off the platform (a direct CDN link, QA, the 4173 preview) there is no
  // origin that could answer — do not aim a POST at a page that 404s.
  if (!DEV_API && !PLATFORM_ORIGIN) return Promise.resolve([]);
  if (!homeworkPromise) {
    const wstoken = new URLSearchParams(location.search).get("wstoken") || undefined;
    homeworkPromise = fetch(WEHEL_HOMEWORK_ENDPOINT, {
      method: "POST",
      credentials: DEV_API ? "same-origin" : "include",
      headers: platformHeaders({ Accept: "application/json", "Content-Type": "application/json" }),
      body: JSON.stringify({ wstoken }),
    }).then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok || !Array.isArray(result.homework)) throw new Error("no homework data");
      return result.homework;
    }).catch(() => {
      homeworkPromise = null;
      return [];
    });
  }
  return homeworkPromise;
}

// One line per assignment, in the words the teacher wrote. This text is what
// {{HOMEWORK_LIST}} becomes in the prompt's homeworkBlock, so it carries only
// what a tutor needs: which task, for which course/class, due when, and the
// instructions themselves.
export function homeworkContextText(items) {
  const lines = (Array.isArray(items) ? items : []).slice(0, 10).map((item, index) => {
    const where = item.course || item.classTitle || "";
    const parts = [
      `${index + 1}. [${item.source === "live-class" ? "Live class homework" : "Homework"}] ${String(item.title || "Untitled task").trim()}${where ? ` — ${where}` : ""}`,
    ];
    if (item.dueLabel) parts.push(`due ${item.dueLabel}`);
    if (item.status) parts.push(`status: ${item.status}`);
    if (item.priority && item.priority !== "normal") parts.push(`priority: ${item.priority}`);
    if (item.points) parts.push(`worth ${item.points} points`);
    const head = parts.join("; ");
    const text = String(item.text || "").trim();
    return text ? `${head}\n   Task: ${text}` : head;
  });
  return lines.join("\n").slice(0, HOMEWORK_CONTEXT_LIMIT);
}

// Attach the learner's files to the turn they were sent with — and only that
// turn. The stored transcript stays plain text (a base64 photo would blow the
// localStorage quota and resurface in every later payload), so the message the
// learner typed keeps a "(Attached: …)" marker and the blocks ride the live
// request alone. The server counts attachments per learner per day (5) and
// dedupes them by content hash, so the client's one automatic retry cannot
// double-bill the allowance.
export function withAttachmentBlocks(conversation, attachments) {
  const files = (Array.isArray(attachments) ? attachments : [])
    .filter((file) => file && file.data && file.mediaType)
    .slice(0, WEHEL_ATTACH_PER_MESSAGE);
  if (!files.length) return conversation;
  const last = conversation[conversation.length - 1];
  if (!last || last.role !== "user" || typeof last.content !== "string") return conversation;
  const blocks = files.map((file) => (file.mediaType === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.data } }
    : { type: "image", source: { type: "base64", media_type: file.mediaType, data: file.data } }));
  return [...conversation.slice(0, -1), { role: "user", content: [...blocks, { type: "text", text: last.content }] }];
}

async function handleGetUnit(meta, fetchUnit, input) {
  const ref = resolveCourseRef(meta, input);
  if (ref.error) return ref.error;
  const unitNo = Number(input?.unitNo);
  const label = `Unit ${input?.unitNo} of ${ref.subject} grade ${ref.grade}`;
  if (ref.subject === meta.subject && ref.grade === Number(meta.grade) && fetchUnit) {
    const unit = await fetchUnit(unitNo);
    return unit ? JSON.stringify(unitForTutor(unit)).slice(0, UNIT_JSON_LIMIT) : `${label} does not exist — only the units in the year outline.`;
  }
  const response = await fetch(new URL(`units/unit-${unitNo}.json`, courseDataRoot(ref.subject, ref.grade)));
  if (!response.ok) return `${label} is not available.`;
  return JSON.stringify(unitForTutor(await response.json())).slice(0, UNIT_JSON_LIMIT);
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
// The browser's own voice is now the FALLBACK for spoken replies: since
// 2026-08-14 the tutor speaks with the Ehel narration voice via ElevenLabs
// Flash v2.5 (speakEhelVoice, below) — an explicit cost decision, bounded by
// quiz_tts.php's per-learner rate limit and a per-session clip cache. The
// engine below needs no key and no network, so it still reads replies when the
// voice endpoint cannot be reached — which includes the built-in offline
// hints, whose whole premise is that the network already failed.

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
  // One stop for all tutor speech: the reply clip and the browser voice never
  // talk over each other.
  stopReplyAudio();
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

// --- Wehel reply audio (Deepgram Aura-2, voice aura-2-thalia-en) -------------
// A chat reply does not exist until the model writes it, so no pre-rendered
// clip can cover one — each spoken reply is a live render through Wehel's own
// voice endpoint (wehel_speak.php / the dev twin), which proxies Deepgram's
// /v1/speak with the Thalia voice. Wehel ONLY: the runtime lesson voice keeps
// quiz_tts.php untouched. Aura has no speed control, so the per-grade rate
// applies only to the browser fallback; it stays in the cache key so a rate
// change still misses cleanly. Clips are cached per text for the session so
// replaying a bubble is free.

let replyAudio = null;
const replyClipCache = new Map(); // "<rate>\n<text>" -> object URL

function stopReplyAudio() {
  if (!replyAudio) return;
  const audio = replyAudio;
  replyAudio = null;
  audio.pause();
  // pause() never fires onended, so release the caller awaiting this clip.
  if (audio.onended) audio.onended();
}

/** Play a pre-rendered clip by URL (a stored Grade 1 teacher script's audio).
 * Resolves when it finishes; rejects when it cannot load or play so the
 * caller can fall back to the live voice. Shares replyAudio so Stop, a new
 * question and a route change all silence it like any other reply. */
export async function playClipUrl(url) {
  stopBrowserSpeech();
  await new Promise((resolve, reject) => {
    const audio = new Audio(url);
    let settled = false;
    const finish = (failed) => () => {
      if (settled) return;
      settled = true;
      if (replyAudio === audio) replyAudio = null;
      if (failed) reject(new Error("The stored clip could not be played."));
      else resolve();
    };
    audio.onended = finish(false);
    audio.onerror = finish(true);
    replyAudio = audio;
    audio.play().catch(finish(true));
  });
  return true;
}

/** Speak text in the Ehel voice. Resolves when the clip finishes; rejects when
 * the voice endpoint cannot be reached so the caller can fall back. */
export async function speakEhelVoice(text, { rate = 1 } = {}) {
  const clean = speakableText(text);
  if (!clean) return false;
  stopBrowserSpeech();
  const cacheKey = `${rate}\n${clean}`;
  let url = replyClipCache.get(cacheKey);
  if (!url) {
    const wstoken = new URLSearchParams(location.search).get("wstoken") || undefined;
    const response = await fetch(WEHEL_TTS_ENDPOINT, {
      method: "POST",
      credentials: DEV_API ? "same-origin" : "include",
      headers: platformHeaders({ Accept: "audio/mpeg", "Content-Type": "application/json" }),
      body: JSON.stringify({ text: clean, wstoken }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || `The tutor voice is unavailable (${response.status}).`);
    }
    url = URL.createObjectURL(await response.blob());
    replyClipCache.set(cacheKey, url);
  }
  await new Promise((resolve, reject) => {
    const audio = new Audio(url);
    let settled = false;
    const finish = (failed) => () => {
      if (settled) return;
      settled = true;
      if (replyAudio === audio) replyAudio = null;
      if (failed) reject(new Error("The tutor clip could not be played."));
      else resolve();
    };
    audio.onended = finish(false);
    audio.onerror = finish(true);
    replyAudio = audio;
    audio.play().catch(finish(true));
  });
  return true;
}

// --- browser speech recognition ---------------------------------------------
// NO LONGER USED BY THE WEHEL PANEL: since 2026-08-20 Wehel's voice input is
// Deepgram only (owner decision) — the mic records with MediaRecorder and
// transcribes through wehel_listen.php, every time, in every browser. That
// also retires the Brave workaround this file briefly carried: Brave ships
// this API's surface with no engine behind it, and skipping the engine
// everywhere removes the failure class outright. The helpers stay exported
// for any non-Wehel caller. Looked up at call time, not import time, so a
// test can stub it and so a browser that gains support mid-session wins.
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

export async function askWehel({ meta, messages, channel = "text", mode = "", sectionHint = "", activityHint = "", focus = null, fetchUnit = null, attachments = null }) {
  const wstoken = new URLSearchParams(location.search).get("wstoken") || undefined;
  // The learner's real homework rides with every question (memoised fetch, so
  // this await is instant after the first call) — the tutor can then answer
  // "what's my homework?" from any surface, English's own tutor page included.
  const homework = homeworkContextText(await fetchWehelHomework());
  const post = async (conversation) => {
    const response = await fetch(WEHEL_CHAT_ENDPOINT, {
      method: "POST",
      credentials: DEV_API ? "same-origin" : "include",
      headers: platformHeaders({ Accept: "application/json", "Content-Type": "application/json" }),
      body: JSON.stringify({
        subject: meta.subject,
        subjectLabel: meta.subjectLabel,
        grade: meta.grade,
        cambridgeCode: meta.cambridgeCode || "",
        unitNo: meta.unitNo,
        unitTitle: meta.unitTitle,
        learnerName: meta.learnerName || "",
        // "tutoring" for the tutoring-support category — a child at another
        // school who arrived by searching a topic. The endpoint turns it into
        // a framing correction in the system prompt (categoryNotes in
        // wehel_prompt.json): say "this lesson", never "this unit", and assume
        // no position in our course. Absent for school learners.
        learnerCategory: meta.learnerCategory || undefined,
        courseOutline: meta.courseOutline || "",
        unit: unitForTutor(meta.unit),
        channel,
        mode: mode || undefined,
        sectionHint: sectionHint || undefined,
        // The exact item on screen (a deck's current slide) — what "this
        // activity" means to the virtual teacher. Empty on grid pages.
        activityHint: activityHint || undefined,
        // Label only — the endpoints name the module in the prompt, and the
        // unit's own content is already there for the model to find it in.
        focus: focus?.label ? { label: focus.label } : undefined,
        homework: homework || undefined,
        wstoken,
        tools: fetchUnit ? ["get_unit", "get_course_outline"] : [],
        messages: conversation,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      const failure = new Error(result.message || `Wehel is unavailable (${response.status}).`);
      // A structured code (e.g. "attach-limit") lets the panel answer with the
      // real reason instead of the generic offline hint.
      if (result.code) failure.code = result.code;
      throw failure;
    }
    return result;
  };

  // Tool loop: when the model asks for another unit, fetch it HERE — the
  // browser already has same-origin access to the course data tree, so the
  // endpoint stays stateless and never has to reach into the CDN. The tool
  // exchange lives only in this call; the stored transcript keeps plain text.
  const conversation = withAttachmentBlocks(apiMessages(messages), attachments);
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
    headers: platformHeaders({ Accept: "application/json", "Content-Type": "application/json" }),
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
  paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
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

/* pending attachments — small removable chips above the compose row */
.wehel-panel .w-attach-row{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}
.wehel-panel .w-attach-chip{display:inline-flex;align-items:center;gap:6px;max-width:min(70vw,260px);
  padding:5px 10px;border:1px solid rgba(15,118,110,.3);border-radius:999px;
  background:var(--w-teal-soft);color:var(--w-teal);font-size:12.5px;font-weight:700}
.wehel-panel .w-attach-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wehel-panel .w-attach-chip button{border:0;background:none;color:inherit;font:inherit;
  font-weight:900;cursor:pointer;padding:0 2px;line-height:1}

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
.wehel-panel #wehel-attach{width:42px;padding:0;display:grid;place-items:center}
.wehel-panel #wehel-attach.has-files{background:var(--w-teal-soft);border-color:var(--w-teal);color:var(--w-teal)}
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

// --- stored Grade 1 teacher scripts --------------------------------------------
// For Grade/Stage 1 the Virtual teacher's opening reply is generated once,
// narrated once, saved, and reused (owner decision 2026-08-20): a learner who
// taps "Teach me the activity" gets the stored text and its clip instantly —
// no model call, no TTS call, no wait, the same quality every time. The
// scripts live on the content tier beside the units
// (<data root>/teacher-scripts.json, written by
// tools/generate-ehel-teacher-scripts.mjs) and their clips beside them
// (teacher-audio/<hash>.mp3, tools/generate-ehel-teacher-audio.js). Only the
// opening is stored — the steps after it depend on what the learner does and
// stay live. A missing file, section or clip falls back to the live path, so
// nothing can dead-end. Fetched once per course per page load.
const teacherScriptsPromises = new Map();
export function fetchTeacherScripts(meta) {
  const key = `${meta.subject}/${meta.grade}`;
  if (!teacherScriptsPromises.has(key)) {
    teacherScriptsPromises.set(key, fetch(new URL("teacher-scripts.json", courseDataRoot(meta.subject, meta.grade)))
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null));
  }
  return teacherScriptsPromises.get(key);
}
export function storedTeacherScript(scripts, unitNo, sectionId) {
  const entry = scripts?.units?.[String(unitNo)]?.[String(sectionId)];
  return entry && entry.text && entry.hash ? entry : null;
}
export function teacherClipUrl(meta, entry) {
  return new URL(`teacher-audio/${entry.hash}.mp3`, courseDataRoot(meta.subject, meta.grade)).href;
}

// --- attachment preparation ----------------------------------------------------
// A phone photo of a worksheet is 3-8MB; the homework on it is perfectly
// readable at 1400px, and the server caps each block anyway. So photos are
// downscaled and re-encoded as JPEG in the browser before they travel. PDFs
// pass through untouched but size-capped — there is nothing lossless to shrink
// client-side.
const ATTACH_MAX_EDGE = 1400;
const ATTACH_MAX_BASE64 = 2800000; // ≈2MB of file — matches the server's per-block cap
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result).split(",")[1] || ""));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}
async function prepareAttachment(file) {
  const name = String(file.name || "attachment");
  if (file.type === "application/pdf") {
    const data = await fileToBase64(file);
    if (!data) throw new Error(`${name} could not be read.`);
    if (data.length > ATTACH_MAX_BASE64) throw new Error(`${name} is too big — PDFs up to about 2MB work here.`);
    return { name, mediaType: "application/pdf", data };
  }
  if (!/^image\//.test(String(file.type))) throw new Error("Photos (JPG or PNG) and PDF files work here.");
  // createImageBitmap fails on formats the browser cannot decode (HEIC on
  // non-Safari, mostly) — a clear message beats a silent empty canvas.
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${name} could not be read — try a JPG or PNG photo.`);
  const scale = Math.min(1, ATTACH_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (bitmap.close) bitmap.close();
  const data = canvas.toDataURL("image/jpeg", 0.82).split(",")[1] || "";
  if (!data) throw new Error(`${name} could not be read.`);
  if (data.length > ATTACH_MAX_BASE64) throw new Error(`${name} is too big even after shrinking.`);
  return { name, mediaType: "image/jpeg", data };
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
//   sectionHint    — string or () => string: the page the learner is on
//   activityHint   — string or () => string: the exact item on screen (a
//                    deck's current slide), read at send time; what "this
//                    activity" means to the Virtual teacher persona
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
  // The tutoring-support category: a child at another school who arrived by
  // SEARCHING a topic, not by walking a course — so "Unit N" is a coordinate
  // in somebody else's map and every string here that would print it says
  // "this lesson" instead. School learners keep the unit framing, which for
  // them is their actual position. Read from meta (where the shell's dock and
  // English's own config set it, and where askWehel reads it for the server)
  // with a top-level override for any caller that has no meta of its own.
  const isTutoring = (options.learnerCategory || meta.learnerCategory) === "tutoring";
  const unitWord = isTutoring ? "this lesson" : "this unit";
  const baseGreeting = options.greeting || (isTutoring
    ? `Hi! I am ${tutorLabel}, your ${meta.subjectLabel} companion. Tell me what you are stuck on — a topic, a homework question, anything.`
    : `Hi! I am ${tutorLabel}, your ${meta.subjectLabel} companion. What would you like to do with Unit ${meta.unitNo}: ${meta.unitTitle}?`);
  // A focused learner is greeted by where they are, and offered the same three
  // things the focused quick prompts do — the greeting is the first place the
  // setting has to be visible, or Focus looks like it did nothing.
  const greetingFor = (focus) => (focus
    ? `Hi! I am ${tutorLabel}. We are on "${focus.label}"${isTutoring ? "" : ` in Unit ${meta.unitNo}: ${meta.unitTitle}`}. Shall I teach it, quiz you on it, or explain it a different way?`
    : baseGreeting);
  const modules = (Array.isArray(meta.modules) ? meta.modules : []).filter((module) => module && module.id && module.label);
  if (!Array.isArray(store[key])) store[key] = [];
  const messages = store[key];
  // Wehel voice input is Deepgram only, so the mic needs exactly what the
  // recorder path needs — the browser's own recognition engine is irrelevant.
  const micSupported = Boolean(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder === "function");
  let busy = false;
  let recorder = null;
  let recordedChunks = [];
  let panel = null; // this panel's registry entry, assigned after first render

  // The learner's real assigned homework arrives async; when it does, the
  // panel re-renders with the two homework quick prompts (coach and worked
  // solutions) and a greeting that mentions it. options.homework === false
  // opts a surface out of the chips — the context still rides with askWehel.
  let homeworkItems = [];
  if (options.homework !== false) {
    fetchWehelHomework().then((items) => {
      homeworkItems = Array.isArray(items) ? items : [];
      if (homeworkItems.length && container.isConnected) render();
    });
  }
  // Files picked but not yet sent. They ride the next message, then clear;
  // they are never persisted (see withAttachmentBlocks for why).
  let pendingAttachments = [];
  // Warm the stored Grade 1 teacher scripts so the first "Teach me the
  // activity" tap is instant; a miss just leaves the live path.
  if (Number(meta.grade) === 1) fetchTeacherScripts(meta);

  // Replies are spoken with the Ehel narration voice (ElevenLabs Flash v2.5,
  // rendered per reply through the quiz TTS endpoint); the browser engine is
  // the no-network fallback, so a reply is never silent just because the paid
  // voice cannot be reached.
  const speechKey = `wehel-speech-${meta.subject}`;
  const speechRate = speechRateForGrade(meta.grade);
  let speakReplies = browserSpeechSupported && storageGet(speechKey) !== "off";
  let speakingIndex = null;

  const bubble = (item, index) => {
    // An offline bubble used to differ from a real answer by the two words
    // "(offline hint)" in the small grey name line, and by a toast that is gone
    // a few seconds later. Everything else about it — same avatar, same bubble,
    // same confident sentence — read as the tutor's considered reply. A learner
    // asking three questions and getting the same built-in sentence three times
    // concludes the tutor is useless, when in fact it was never reached.
    //
    // So the bubble says so in words, in its own body, where it cannot be
    // missed or time out. The styling is inline rather than a class in
    // english/shared/course-ui.css: that file is the base every subject imports,
    // and this has to be legible even if no subject stylesheet is redeployed.
    const label = item.role === "user" ? "You" : (item.offline ? `${tutorLabel} — could not be reached` : tutorLabel);
    const playing = speakingIndex === index;
    const speak = item.role === "assistant" && browserSpeechSupported
      ? `<button class="button secondary voice-button${playing ? " is-playing" : ""}" data-wehel-speak="${index}" type="button" aria-label="${playing ? "Stop" : `Listen to ${escapeHtml(tutorLabel)}`}">${playing ? `${wehelIcon("stop")} Stop` : `${wehelIcon("volume")} Listen`}</button>`
      : "";
    // Structure only: the article keeps its .ai-message/.user/.assistant classes
    // and the button keeps its exact classes, data attributes and wording —
    // the handlers and the audio-coverage checks read those.
    const avatar = item.role === "user" ? "You" : tutorLabel;
    const tools = speak ? `<div class="w-tools">${speak}</div>` : "";
    // Said in the bubble, not only in the name line: this is not Wehel's answer.
    const offlineNote = item.offline
      ? `<p class="w-offline-note" style="margin:0 0 6px;padding:7px 10px;border-radius:8px;`
        + `background:#fff4e5;border:1px solid #e0b070;color:#7a4a00;font-size:13px;">`
        + `Wehel could not be reached, so this is a hint from ${isTutoring ? "the lesson" : "the unit"} — not Wehel's answer. `
        + `Ask again in a moment.</p>`
      : "";
    return `<article class="ai-message ${item.role}${item.offline ? " offline" : ""}">`
      + `<span class="w-avatar" role="img" aria-label="${escapeHtml(avatar)}">${wehelIcon(item.role === "user" ? "user" : "sparkle")}</span>`
      + `<div class="w-body"><strong class="w-who">${escapeHtml(label)}</strong>`
      + `${offlineNote}<p class="w-text">${escapeHtml(item.text)}</p>${tools}</div></article>`;
  };

  // Speak one stored reply aloud; index -1 marks the greeting bubble. Wehel's
  // Deepgram voice (Thalia) reads the whole reply; the browser engine steps in
  // only when the voice endpoint cannot be reached, so an offline hint is
  // still read aloud.
  async function speakReply(index, text) {
    // A stored Grade 1 teacher script: play its pre-rendered clip (Thalia,
    // rendered once by generate-ehel-teacher-audio.js). If the clip cannot be
    // fetched or played, fall through to the live voice below — the text is
    // the same either way.
    if (index >= 0 && messages[index]?.clip) {
      speakingIndex = index;
      render();
      try {
        await playClipUrl(messages[index].clip);
        if (speakingIndex === index) { speakingIndex = null; render(); }
        return;
      } catch {
        // Fall through to the live path with the same text; its own finally
        // clears the highlight.
      }
    }
    const clean = speakableText(text);
    speakingIndex = index;
    render();
    try {
      if (clean) await speakEhelVoice(clean, { rate: speechRate });
    } catch {
      await speakBrowser(clean, { rate: speechRate });
    } finally {
      // Another bubble may have taken over while this one played — only the
      // still-current speaker clears the highlight.
      if (speakingIndex === index) { speakingIndex = null; render(); }
    }
  }

  function render() {
    // Read at render time, not at mount: the drawer and the Tutor page can both
    // be live over one store, and syncPanels repaints the sibling — so changing
    // Focus in either is immediately true in both.
    const focus = focusModule(meta, modules);
    // Read at render time like Focus and the language: the drawer and a
    // subject's own tutor page can both be live, and syncPanels repaints the
    // sibling, so a role switched in either is immediately true in both.
    const persona = wehelPersona(meta);
    let greeting = persona === "teacher"
      ? `Hello! I am ${tutorLabel}, and today I am your teacher for this activity. Press "Start this activity" and I will explain what we are doing, then take you through it step by step.`
      : greetingFor(focus);
    if (homeworkItems.length && persona !== "teacher") greeting += " I can also see homework your teacher set — want to work on it together?";
    // Virtual teacher: the chips ARE the flow, and they take precedence over
    // Focus's three and the subject's own. Tutor: focused, the subject's own
    // quick prompts step aside for the three the learner asked for; unfocused,
    // nothing about this changes.
    const prompts = persona === "teacher"
      ? teacherPrompts()
      : (focus ? focusPrompts(focus.label, unitWord) : [...(options.quickPrompts || [])]);
    // Homework chips — both sanctioned ways in, shown only when the platform
    // actually has homework on record for this learner. The modes reach the
    // matching modeHints in wehel_prompt.json (coaching, and the worked-
    // solutions exception written into Academic honesty).
    if (homeworkItems.length && persona !== "teacher") {
      prompts.push(
        { label: "Coach me through my homework", mode: "homework-coach", message: "Help me with my homework. Coach me through it step by step — I want to do it myself." },
        { label: "Show my homework step by step", mode: "homework-solutions", message: "Help me with my homework. Show me how to do it with a full worked solution, step by step, and explain each step." },
      );
    }
    container.innerHTML = `
      <div class="ai-voice-row">
        ${browserSpeechSupported ? `<button class="button secondary" id="wehel-voice-toggle" type="button" aria-pressed="${speakReplies}" title="${speakReplies ? `${escapeHtml(tutorLabel)} reads replies aloud` : "Replies are silent"}">${speakReplies ? `${wehelIcon("volume")} Voice on` : `${wehelIcon("volumeOff")} Voice off`}</button>` : ""}
        <label for="wehel-persona">Wehel is
          <select id="wehel-persona">
            <option value="tutor"${persona === "tutor" ? " selected" : ""}>Tutor</option>
            <option value="teacher"${persona === "teacher" ? " selected" : ""}>Virtual teacher</option>
          </select>
        </label>
        ${modules.length ? `<label for="wehel-focus">Focus
          <select id="wehel-focus">
            <option value="">${isTutoring ? "The whole lesson" : "Whole unit"}</option>
            ${modules.map((module) => `<option value="${escapeHtml(module.id)}"${focus && focus.id === module.id ? " selected" : ""}>${escapeHtml(module.label)}</option>`).join("")}
          </select>
        </label>` : ""}
      </div>
      <div class="ai-conversation" id="wehel-conversation" aria-live="polite">
        ${messages.length ? messages.map(bubble).join("") : bubble({ role: "assistant", text: greeting }, -1)}
        ${busy ? `<article class="ai-message assistant is-thinking"><span class="w-avatar" role="img" aria-label="${escapeHtml(tutorLabel)}">${wehelIcon("sparkle")}</span><div class="w-body"><strong class="w-who">${escapeHtml(tutorLabel)}</strong><p class="w-text"><span class="w-dot"></span><span class="w-dot"></span><span class="w-dot"></span><span class="sr-only">is thinking…</span></p></div></article>` : ""}
      </div>
      <div class="ai-prompts">${prompts.map((prompt) => `<button data-wehel-prompt="${escapeHtml(prompt.message)}" data-wehel-mode="${escapeHtml(prompt.mode || "")}"${prompt.teach ? ' data-wehel-teach="1"' : ""} type="button" ${busy ? "disabled" : ""}>${escapeHtml(prompt.label)}</button>`).join("")}</div>
      ${pendingAttachments.length ? `<div class="w-attach-row">${pendingAttachments.map((file, index) => `<span class="w-attach-chip"><span>${escapeHtml(file.name)}</span><button type="button" data-wehel-detach="${index}" aria-label="Remove ${escapeHtml(file.name)}">×</button></span>`).join("")}</div>` : ""}
      <form class="ai-compose" id="wehel-form">
        <label class="sr-only" for="wehel-input">Ask ${escapeHtml(tutorLabel)}</label>
        <input id="wehel-input" maxlength="500" placeholder="${escapeHtml(persona === "teacher" ? "Tell your teacher what you did, or ask…" : (focus ? `Ask about ${focus.label}…` : (options.placeholder || (isTutoring ? "Ask about anything you are stuck on…" : `Ask about ${meta.unitTitle}…`))))}" ${busy ? "disabled" : ""} autocomplete="off">
        <button class="button secondary${pendingAttachments.length ? " has-files" : ""}" id="wehel-attach" type="button" aria-label="Attach a homework photo or PDF" title="Attach a homework photo or PDF (up to ${WEHEL_ATTACH_PER_MESSAGE} per message, ${WEHEL_ATTACH_DAILY_LIMIT} a day)" ${busy ? "disabled" : ""}>${wehelIcon("paperclip")}</button>
        <input id="wehel-attach-input" type="file" accept="image/*,application/pdf" multiple hidden>
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
      speakReply(index, index === -1 ? greeting : messages[index]?.text || "");
    }));
    const personaSelect = container.querySelector("#wehel-persona");
    if (personaSelect) personaSelect.addEventListener("change", () => {
      setWehelPersona(meta, personaSelect.value);
      stopBrowserSpeech();
      speakingIndex = null;
      render();
      syncPanels(panel);
      if (ui.toast) ui.toast(personaSelect.value === "teacher"
        ? `${tutorLabel} is now your virtual teacher — press "Start this activity".`
        : `${tutorLabel} is back to tutor mode — ask anything.`);
    });
    const focusSelect = container.querySelector("#wehel-focus");
    if (focusSelect) focusSelect.addEventListener("change", () => {
      // No render()/syncPanels here: setFocusModule notifies every surface,
      // this panel included, so repainting again would be a double render.
      setFocusModule(meta, focusSelect.value);
      const chosen = modules.find((module) => module.id === focusSelect.value);
      if (ui.toast) ui.toast(chosen
        ? `${tutorLabel} is staying on ${chosen.label} — still happy to answer anything else.`
        : `${tutorLabel} is back to ${isTutoring ? "the whole lesson" : "the whole unit"}.`);
    });
    container.querySelectorAll("[data-wehel-prompt]").forEach((button) => button.addEventListener("click", () => submit(button.dataset.wehelPrompt, "text", button.dataset.wehelMode || "", { teach: button.dataset.wehelTeach === "1" })));
    container.querySelector("#wehel-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = container.querySelector("#wehel-input");
      if (input.value.trim()) submit(input.value.trim(), "text");
    });
    const attachButton = container.querySelector("#wehel-attach");
    const attachInput = container.querySelector("#wehel-attach-input");
    if (attachButton && attachInput) {
      attachButton.addEventListener("click", () => attachInput.click());
      attachInput.addEventListener("change", async () => {
        for (const file of [...(attachInput.files || [])]) {
          if (pendingAttachments.length >= WEHEL_ATTACH_PER_MESSAGE) {
            if (ui.toast) ui.toast(`Up to ${WEHEL_ATTACH_PER_MESSAGE} files can go with one message.`);
            break;
          }
          try {
            pendingAttachments.push(await prepareAttachment(file));
          } catch (error) {
            if (ui.toast) ui.toast(error.message || "That file could not be attached.");
          }
        }
        render();
      });
    }
    container.querySelectorAll("[data-wehel-detach]").forEach((button) => button.addEventListener("click", () => {
      pendingAttachments.splice(Number(button.dataset.wehelDetach), 1);
      render();
    }));
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
  // teach: the "Teach me the activity" chip — on Grade 1, answered from the
  // stored script for this unit and section when one exists (text + clip,
  // no network); otherwise the live path below.
  async function submit(text, channel, modeHint = "", { teach = false } = {}) {
    if (busy) return;
    stopBrowserSpeech();
    speakingIndex = null;
    if (teach && Number(meta.grade) === 1) {
      const sectionId = typeof options.sectionId === "function" ? options.sectionId() : options.sectionId;
      const entry = storedTeacherScript(await fetchTeacherScripts(meta), meta.unitNo, sectionId);
      if (entry) {
        // A real assistant turn, not an offline hint: the model sees it as its
        // own opening when the live steps continue from here.
        append({ role: "user", text });
        append({ role: "assistant", text: entry.text, stored: true, clip: teacherClipUrl(meta, entry) });
        render();
        const exchanges = messages.filter((item) => item.role === "assistant" && !item.offline).length;
        if (options.onExchange) options.onExchange(exchanges);
        if (browserSpeechSupported && speakReplies) speakReply(messages.length - 1, entry.text);
        return;
      }
    }
    // Attachments ride this one message. The marker keeps them visible in the
    // transcript (and tells the model on later turns that a file accompanied
    // this question) without a megabyte of base64 entering localStorage.
    const attachments = pendingAttachments.splice(0, pendingAttachments.length);
    append({ role: "user", text: attachments.length ? `${text}\n(Attached: ${attachments.map((file) => file.name).join(", ")})` : text });
    busy = true;
    render();
    let reply;
    let offline = false;
    // Virtual teacher is a standing role: a typed message carries its mode
    // too, not only the chips — otherwise "I did it" between chips would drop
    // the teacher back into answering-questions tutor posture.
    const ask = () => askWehel({ meta, messages, channel,
      mode: modeHint || (wehelPersona(meta) === "teacher" ? "virtual-teacher" : options.mode),
      sectionHint: typeof options.sectionHint === "function" ? options.sectionHint() : options.sectionHint,
      activityHint: typeof options.activityHint === "function" ? options.activityHint() : (options.activityHint || ""),
      focus: focusModule(meta, modules),
      fetchUnit: options.fetchUnit || null,
      attachments });
    try {
      // One transient blip must not become a lesson about a different word:
      // most failures here (an overloaded model API, a dropped connection) are
      // gone seconds later, and the canned hint below is a far worse answer
      // than a two-second wait. So ask once more before giving up — the
      // thinking dots are already on screen, so the learner just sees a
      // slightly longer think.
      try {
        reply = await ask();
      } catch (firstError) {
        // A spent daily allowance is deterministic — retrying cannot help.
        if (firstError.code === "attach-limit") throw firstError;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        reply = await ask();
      }
    } catch (error) {
      if (error.code === "attach-limit") {
        // Not an outage: the tutor is fine, today's upload allowance is spent.
        // Said as a normal reply, because the "could not be reached" banner
        // would be a lie the learner acts on (retrying with the same photo).
        reply = error.message || `You have used all ${WEHEL_ATTACH_DAILY_LIMIT} homework uploads for today. Type the question instead — I can still help!`;
      } else {
        offline = true;
        // Give the files back: the ask never landed, so the learner should not
        // have to re-pick them to try again.
        pendingAttachments = attachments.concat(pendingAttachments);
        reply = options.fallbackReply
          ? options.fallbackReply(text)
          : "I cannot reach my thinking engine right now. Please try again in a moment.";
        if (ui.toast) ui.toast("Wehel is offline right now — showing a built-in hint instead.");
      }
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
    // Wehel voice input is Deepgram only: record locally, transcribe through
    // wehel_listen.php — every time, in every browser. The browser's own
    // SpeechRecognition is deliberately not tried first any more; its engine
    // is absent in Brave (API surface, no service) and its use here would
    // put a second, different recogniser in front of the one the owner chose.
    if (recorder && recorder.state === "recording") { recorder.stop(); return; }
    stopBrowserSpeech(); // never transcribe the tutor's own voice
    speakingIndex = null;
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
