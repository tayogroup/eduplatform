#!/usr/bin/env node
// What Wehel must never lose again.
//
// Every rule below was a live defect on 2026-08-14/15, each one visible to a
// learner as a confidently wrong answer, and each one invisible to every gate
// the repo had. They are checked by BEHAVIOUR — the real functions are
// imported and run — so a refactor that keeps the rules passes, and one that
// quietly drops a filter fails, which reading the source for magic strings
// could never do.
//
//   1. The transcript the model sees carries answered pairs and the live
//      question, and nothing else. Three separate mechanisms put debris in
//      there; all three answered a question the learner had not just asked.
//   2. A whole unit reaches the tutor. The cap lives in three files and they
//      must agree, and every unit in the academy must fit under it once the
//      media plumbing is stripped — otherwise the tutor teaches from the
//      fraction of the unit it can see, which is how it spent a day teaching
//      vocabulary out of English units whose readings it could not read.
//   3. The prompt still tells the tutor to answer the question it was asked.
//
// Run: node tools/check-wehel-contract.mjs   (npm run check:wehel-contract)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHELL = path.join(ROOT, "src", "prototypes", "ehel-academy", "shell", "wehel.js");
const PHP = path.join(ROOT, "src", "moodle", "local_hubredirect", "wehel_chat.php");
const DEV = path.join(ROOT, "tools", "lib", "wehel-dev-chat.js");
const PROMPT = path.join(ROOT, "src", "moodle", "local_hubredirect", "wehel_prompt.json");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const SUBJECTS = ["english", "science", "mathematics", "computing", "global-perspectives", "intensive-english"];

const failures = [];
const notes = [];
const fail = (rule, detail) => failures.push(`${rule}\n    ${detail}`);

// wehel.js is a browser module: it reads location at import time and registers
// a hashchange listener when speechSynthesis exists. Shim just enough that an
// import is side-effect free here — deliberately no `window`, so the speech
// paths stay dormant.
globalThis.location = { hostname: "localhost", port: "4287", search: "", href: "http://localhost:4287/", origin: "http://localhost:4287" };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const wehel = await import(pathToFileURL(SHELL).href);
const { apiMessages, withoutMediaPlumbing, unitForTutor, UNIT_JSON_LIMIT, withAttachmentBlocks, homeworkContextText, HOMEWORK_CONTEXT_LIMIT, WEHEL_ATTACH_DAILY_LIMIT, teacherPrompts, voiceSegments } = wehel;
for (const [name, value] of Object.entries({ apiMessages, withoutMediaPlumbing, unitForTutor, UNIT_JSON_LIMIT, withAttachmentBlocks, homeworkContextText, HOMEWORK_CONTEXT_LIMIT, WEHEL_ATTACH_DAILY_LIMIT, teacherPrompts, voiceSegments })) {
  if (value === undefined) fail("shell/wehel.js no longer exports what this gate checks", `${name} is missing — restore the export rather than deleting the check`);
}
if (failures.length) { report(); process.exit(1); }

// --- 1. the transcript the model sees ---------------------------------------

const roles = (sent) => sent.map((m) => m.role).join(",");
const text = (sent) => sent.map((m) => m.content).join(" | ");

// A canned offline hint is not Wehel's answer. Sent as an assistant turn, the
// model adopted it and resumed its off-topic mini-lesson on every later turn.
{
  const sent = apiMessages([
    { role: "user", text: "explain the word birthday" },
    { role: "assistant", text: "day is a noun. It means: One of the seven parts of a week.", offline: true },
    { role: "user", text: "explain the word tablet" },
  ]);
  if (/is a noun/.test(text(sent))) fail("A canned offline hint reaches the model", `the hint is in the payload: ${text(sent)}`);
  // …and the question it "answered" goes with it, or it strands an answerless
  // turn that merges into the next question ("Three good questions!").
  if (/birthday/.test(text(sent))) fail("The question a canned hint answered reaches the model", `it strands an answerless turn: ${text(sent)}`);
  if (!/tablet/.test(text(sent))) fail("The learner's live question is dropped", `payload was: ${text(sent)}`);
}

// A question with no reply after it is an abandoned ask — the tab was closed
// mid-request. The transcript outlives the tab in localStorage, so these piled
// up and the model answered a phantom backlog instead of the live question.
{
  const sent = apiMessages([
    { role: "user", text: "what is the meaning of birthday" },
    { role: "user", text: "what is the meaning of week" },
    { role: "user", text: "what is the meaning of month" },
    { role: "user", text: "what is the meaning of calendar" },
  ]);
  // Assert on CONTENT, not on message count: adjacent same-role turns are
  // merged into one message, so a dropped filter still yields a single user
  // message — one that quietly carries all four questions. A count check here
  // passed a deliberately broken filter during mutation testing.
  const stale = ["birthday", "week", "month"].filter((word) => new RegExp(word, "i").test(text(sent)));
  if (stale.length) {
    fail("Abandoned asks reach the model", `${stale.join(", ")} still in the payload — the model answers a phantom backlog before the live question: ${text(sent)}`);
  }
  if (!/calendar/.test(text(sent))) fail("The live question was dropped with the abandoned ones", `payload was: ${text(sent)}`);
}

// The rules must not eat a real conversation.
{
  const sent = apiMessages([
    { role: "user", text: "explain the word hello" },
    { role: "assistant", text: "Hello is what we say when we meet somebody." },
    { role: "user", text: "explain the word goodbye" },
    { role: "assistant", text: "Goodbye is what we say when we leave." },
    { role: "user", text: "explain the word calendar" },
  ]);
  if (roles(sent) !== "user,assistant,user,assistant,user") {
    fail("A healthy conversation is being filtered", `expected 5 alternating turns, got ${roles(sent)}`);
  }
  // The API rejects a transcript that does not open on the learner.
  if (sent.length && sent[0].role !== "user") fail("The payload does not open with a user turn", `starts with ${sent[0].role}`);
}

// --- 1b. attachments ride the turn they were sent with, and nothing else -----

{
  const conversation = apiMessages([
    { role: "user", text: "explain the word hello" },
    { role: "assistant", text: "Hello is what we say when we meet somebody." },
    { role: "user", text: "here is my homework\n(Attached: worksheet.jpg)" },
  ]);
  const files = [{ name: "worksheet.jpg", mediaType: "image/jpeg", data: "aGVsbG8=" }];
  const sent = withAttachmentBlocks(conversation, files);
  if (sent.length !== conversation.length) fail("Attaching a file changes the turn count", `${conversation.length} turns became ${sent.length}`);
  if (typeof sent[0].content !== "string" || typeof sent[1].content !== "string") {
    fail("Attachments leak into earlier turns", "only the live question may carry blocks — earlier turns must stay plain text");
  }
  const last = sent[sent.length - 1];
  const image = Array.isArray(last.content) && last.content.find((block) => block.type === "image");
  const text = Array.isArray(last.content) && last.content.find((block) => block.type === "text");
  if (!image || image.source?.data !== "aGVsbG8=") fail("The attached file does not reach the model", JSON.stringify(last));
  if (!text || !/here is my homework/.test(text.text)) fail("Attaching a file drops the learner's own words", JSON.stringify(last));
  // No attachments → the conversation passes through untouched, so every
  // pre-attachment behaviour above still holds verbatim.
  const untouched = withAttachmentBlocks(conversation, []);
  if (JSON.stringify(untouched) !== JSON.stringify(conversation)) fail("An empty attachment list rewrites the conversation", JSON.stringify(untouched));
  // A PDF becomes a document block, not a mislabelled image.
  const pdfSent = withAttachmentBlocks(conversation, [{ name: "hw.pdf", mediaType: "application/pdf", data: "aGVsbG8=" }]);
  const doc = pdfSent[pdfSent.length - 1].content.find((block) => block.type === "document");
  if (!doc || doc.source?.media_type !== "application/pdf") fail("A PDF attachment is not sent as a document block", JSON.stringify(pdfSent[pdfSent.length - 1]));
}

// --- 1b2. narration switches voice at the Soomaali part ----------------------
// The owner's sample, verbatim shape: English, the Somali sentence INLINE in
// the same paragraph, English carrying on after it. The English voice must
// never read the Somali; the Somali voice must get exactly the Somali; and
// a two-sentence Somali meaning must not be cut in half by its own full stop.
{
  const sample = 'Press Hear it and listen carefully. bus means a long vehicle that carries many people at once. Soomaali: bas waa gaari dheer oo dad badan qaada. I expect you to listen once, then tell me "done" when you have heard it. 🚌';
  const segments = voiceSegments(sample);
  const voices = segments.map((segment) => segment.voice).join(",");
  if (voices !== "english,somali,english") fail("Inline Soomaali is not cut into English → Somali → English", `got ${voices}: ${JSON.stringify(segments)}`);
  const somali = segments.find((segment) => segment.voice === "somali");
  if (!somali || somali.text !== "bas waa gaari dheer oo dad badan qaada.") fail("The Somali segment is not exactly the Somali sentence", JSON.stringify(somali));
  if (segments.some((segment) => segment.voice === "english" && /bas waa|dad badan/.test(segment.text))) fail("Somali leaked into an English segment", JSON.stringify(segments));
  if (!segments[2] || !/^I expect you/.test(segments[2].text)) fail("The English after the Somali part is lost or mis-split", JSON.stringify(segments));
  // Own-line form (the prompt's preferred shape) still works.
  const lined = voiceSegments("Alive means living.\nSoomaali: nool waxay ka dhigan tahay wax nool.\nNow you try one.");
  if (lined.map((segment) => segment.voice).join(",") !== "english,somali,english" || !/^nool waxay/.test(lined[1].text)) fail("Own-line Soomaali is not segmented", JSON.stringify(lined));
  // A two-sentence Somali meaning stays whole until English resumes.
  const twoSentence = voiceSegments("Bus means a vehicle. Soomaali: Bas waa gaari. Waa gaari dheer oo dad badan qaada. Now press Hear it.");
  const somaliTwo = twoSentence.find((segment) => segment.voice === "somali");
  if (!somaliTwo || !/Waa gaari dheer/.test(somaliTwo.text) || /Now press/.test(somaliTwo.text)) fail("A two-sentence Somali meaning is cut in half, or swallows the English after it", JSON.stringify(twoSentence));
  // No Soomaali at all → one English segment, untouched.
  const plain = voiceSegments("Great question! A goat is alive.");
  if (plain.length !== 1 || plain[0].voice !== "english") fail("A reply with no Somali is split anyway", JSON.stringify(plain));
}

// --- 1c. the homework context carries the teacher's words, capped ------------

{
  const text = homeworkContextText([
    { source: "workspace", title: "Fractions sheet", course: "Mathematics", text: "Do questions 1-10", dueLabel: "22 Aug 2026", status: "assigned", points: 20 },
    { source: "live-class", title: "Read pages 4-6", classTitle: "English live (18 Aug)", text: "", dueLabel: "", priority: "high" },
  ]);
  for (const expected of ["Fractions sheet", "questions 1-10", "22 Aug 2026", "Read pages 4-6", "high"]) {
    if (!text.includes(expected)) fail("The homework context drops what the teacher wrote", `"${expected}" missing from: ${text}`);
  }
  const capped = homeworkContextText([{ title: "x", text: "y".repeat(HOMEWORK_CONTEXT_LIMIT * 2) }]);
  if (capped.length > HOMEWORK_CONTEXT_LIMIT) fail("The homework context exceeds its own cap", `${capped.length} > ${HOMEWORK_CONTEXT_LIMIT}`);
  if (homeworkContextText([]) !== "" || homeworkContextText(null) !== "") fail("No homework must mean an empty context", "a non-empty string would append the homework block for a learner with no homework");
}

// --- 2. a whole unit reaches the tutor --------------------------------------

const capIn = (file, re) => { const m = fs.readFileSync(file, "utf8").match(re); return m ? Number(m[1]) : null; };
const phpCap = capIn(PHP, /core_text::strlen\(\$unitcontent\)\s*>\s*(\d+)/);
const devCap = capIn(DEV, /unitContent\.length\s*>\s*(\d+)/);
if (phpCap !== UNIT_JSON_LIMIT || devCap !== UNIT_JSON_LIMIT) {
  fail("The three unit-content caps disagree", `wehel.js ${UNIT_JSON_LIMIT}, wehel_chat.php ${phpCap}, wehel-dev-chat.js ${devCap} — the smallest wins silently, and content past it is invisible to the tutor`);
}

// Same rule for the homework context cap and the attachment daily allowance:
// each lives in three files, and the smallest (or largest) winning silently is
// how a limit stops being a limit.
{
  const phpHomework = capIn(PHP, /core_text::strlen\(\$homeworkcontext\)\s*>\s*(\d+)/);
  const devHomework = capIn(DEV, /homeworkContext\.length\s*>\s*(\d+)/);
  if (phpHomework !== HOMEWORK_CONTEXT_LIMIT || devHomework !== HOMEWORK_CONTEXT_LIMIT) {
    fail("The three homework-context caps disagree", `wehel.js ${HOMEWORK_CONTEXT_LIMIT}, wehel_chat.php ${phpHomework}, wehel-dev-chat.js ${devHomework}`);
  }
  const phpAttach = capIn(PHP, /define\('WEHEL_ATTACH_DAILY_LIMIT',\s*(\d+)\)/);
  const devAttach = capIn(DEV, /const ATTACH_DAILY_LIMIT = (\d+)/);
  if (phpAttach !== WEHEL_ATTACH_DAILY_LIMIT || devAttach !== WEHEL_ATTACH_DAILY_LIMIT) {
    fail("The three attachment daily limits disagree", `wehel.js ${WEHEL_ATTACH_DAILY_LIMIT}, wehel_chat.php ${phpAttach}, wehel-dev-chat.js ${devAttach} — the owner set 5 a day per student, and the server copy is the one that enforces it`);
  }
}

// Every unit must survive the strip whole. This fails if a unit grows, if a
// builder starts emitting a new media shape the strip does not recognise, or
// if the strip itself is broken — all three land as a tutor that cannot see
// the end of its own lesson.
{
  const over = [];
  let counted = 0;
  for (const subject of SUBJECTS) {
    const base = path.join(EHEL, subject);
    if (!fs.existsSync(base)) continue;
    for (const grade of fs.readdirSync(base)) {
      const dir = path.join(base, grade, "data", "units");
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".json")) continue;
        counted += 1;
        const parsed = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
        // Measure the REAL payload — unitForTutor is what both call sites send.
        const length = JSON.stringify(unitForTutor(parsed)).length;
        if (length > UNIT_JSON_LIMIT) over.push(`${subject}/${grade}/${file} is ${Math.round(length / 1024)}KB`);
      }
    }
  }
  if (!counted) fail("No units were checked", "the unit glob found nothing — a gate that checks nothing passes for the wrong reason");
  if (over.length) {
    fail(`${over.length} unit(s) do not fit under the cap once stripped`, `${over.slice(0, 5).join("; ")}${over.length > 5 ? ` …and ${over.length - 5} more` : ""}\n    The tutor sees only the first ${UNIT_JSON_LIMIT} characters of these — everything past the cut is invisible to it.`);
  }
  notes.push(`${counted} units checked, largest fits with ${UNIT_JSON_LIMIT} char cap`);
}

// The strip takes whole descriptor objects, never fields — a field-by-field
// version could catch teaching text that happens to share a name.
{
  const before = { readings: [{ title: "Words Around Us", text: "Amal walks to school.", audio: { url: "a.mp3", voiceId: "x" } }], overviewAudio: { url: "b.mp3" }, answerKey: { q1: "b" } };
  const after = withoutMediaPlumbing(before);
  if (after.readings[0].text !== "Amal walks to school." || after.readings[0].title !== "Words Around Us") fail("The media strip is eating teaching content", JSON.stringify(after.readings[0]));
  if (!after.answerKey) fail("The media strip is eating the answer key", JSON.stringify(after));
  if (after.readings[0].audio || after.overviewAudio) fail("The media strip is not removing audio descriptors", JSON.stringify(after));
}

// The dictionary projection: English's dictionaryLinks (160-420 per-word
// entries, 577KB in the biggest unit) is compacted to the teaching text alone,
// because the word meanings live NOWHERE else in the unit (vocabularyGroups is
// ids only) — dropping the field whole would blind the tutor to every meaning,
// and sending it whole cut the tutor off from everything after the word list.
{
  const before = {
    vocabularyGroups: [{ id: "g1", title: "Greetings", vocabularyIds: ["u1-name"] }],
    dictionaryLinks: [{
      vocabularyId: "u1-name", dictionaryEntryId: "ehel-dict-en-name-noun-01", senseId: "s-01", groupId: "g1", groupTitle: "Greetings", sequence: 1,
      masterWord: "name", childMeaning: "The word that people call you.", exampleSentence: "My name is Amal.",
      practiceSentences: ["Amal writes her name."], aiTutorPrompt: "Say your name to the tutor.", spellingPractice: "n - a - m - e",
      sentenceAudio: [{ source: "a.mp3" }], meaningAudio: { source: "b.mp3" }, reviewStatus: "approved",
    }],
    readings: [{ title: "Words Around Us", text: "Amal walks to school.", audio: { url: "a.mp3" } }],
    answerKey: { q1: "b" },
  };
  const after = unitForTutor(before);
  if (after.dictionaryLinks) fail("dictionaryLinks still travels in full", "the per-word plumbing is what pushed 45 English units past the cap");
  const lines = after.vocabularyDictionary && after.vocabularyDictionary.Greetings;
  if (!lines || !/\bname\b/.test(lines[0]) || !/people call you/.test(lines[0]) || !/My name is Amal/.test(lines[0])) {
    fail("The dictionary projection loses a word, its meaning or its example", JSON.stringify(after.vocabularyDictionary));
  }
  // Quoted key names: vocabularyGroups legitimately keeps "vocabularyIds".
  if (/"(senseId|vocabularyId|dictionaryEntryId|sentenceAudio|meaningAudio|aiTutorPrompt|reviewStatus)"/.test(JSON.stringify(after))) {
    fail("The dictionary projection keeps plumbing the tutor cannot use", JSON.stringify(after.vocabularyDictionary));
  }
  if (after.readings[0].text !== "Amal walks to school." || !after.answerKey || !after.vocabularyGroups) {
    fail("The dictionary projection touched content outside dictionaryLinks", JSON.stringify(after));
  }
  // A unit with no dictionaryLinks (every non-English subject) is untouched.
  const plain = { readings: [{ text: "x", audio: { url: "a" } }], answerKey: { q1: "a" } };
  if (JSON.stringify(unitForTutor(plain)) !== JSON.stringify(withoutMediaPlumbing(plain))) {
    fail("The dictionary projection changes units that have no dictionary", JSON.stringify(unitForTutor(plain)));
  }
}

// --- 3. the prompt still says to answer the question -------------------------

{
  const prompt = JSON.parse(fs.readFileSync(PROMPT, "utf8"));
  const template = (prompt.template || []).join("\n");
  if (!/Answer the question the learner actually asked/i.test(template)) {
    fail("The answer-first rule is gone from the prompt", "without it the tutor answers the page it is on, or an unfinished activity, instead of the question — restore it in wehel_prompt.json");
  }
  if (!Number.isInteger(prompt.maxTokens) || prompt.maxTokens < 1200) {
    fail("maxTokens is too small for a thinking model", `${prompt.maxTokens} — the cap covers thinking plus the visible reply, so a low value truncates answers mid-sentence`);
  }
  // Homework: the two sanctioned modes and the block their context lands in.
  const hints = prompt.modeHints || {};
  if (!hints["homework-coach"] || !hints["homework-solutions"]) {
    fail("A homework mode is gone from the prompt", "homework-coach and homework-solutions are the modes the panel's homework chips send — without them a chip silently becomes an unhinted question");
  }
  if (hints["homework-solutions"] && !/quiz|test|exam/i.test(hints["homework-solutions"])) {
    fail("The worked-solutions mode no longer protects quiz/test/exam answers", "the owner's permission covers homework only — the mode hint must say assessments stay off-limits");
  }
  if (!Array.isArray(prompt.homeworkBlock) || !prompt.homeworkBlock.join("\n").includes("{{HOMEWORK_LIST}}")) {
    fail("The homework block is gone from the prompt", "homeworkBlock with {{HOMEWORK_LIST}} is where the learner's real assignments land — without it the fetched homework is invisible to the tutor");
  }
  if (!/worked-solutions homework mode/i.test(template)) {
    fail("The Academic honesty exception for worked solutions is gone", "without it the system prompt forbids what the homework-solutions mode asks for, and the model splits the difference unpredictably");
  }
  // Virtual teacher: the role exists, every chip of the flow carries it, and
  // the owner's three rules are still written into it — one step at a time,
  // graded answers protected, and guide-to-completion WITHOUT marking anything
  // complete (the record of work comes from the learner doing it on the page).
  const teacher = hints["virtual-teacher"];
  const teacherText = Array.isArray(teacher) ? teacher.join("\n") : String(teacher || "");
  if (!teacherText) {
    fail("The virtual-teacher mode is gone from the prompt", "the persona's chips all send mode virtual-teacher — without the hint the teacher is an unhinted tutor");
  } else {
    if (!/one step/i.test(teacherText)) fail("The virtual teacher no longer walks one step at a time", "the owner's spec is step by step, with what is expected at each step");
    if (!/never give the answers/i.test(teacherText) || !/quiz|checkpoint|exam/i.test(teacherText)) fail("The virtual teacher no longer protects graded answers", "owner decision: on quizzes, checkpoints and placement exams the teacher explains the approach only");
    if (!/do NOT mark anything complete/.test(teacherText)) fail("The virtual teacher may claim to mark an activity complete", "owner decision: guide to completion, never mark — progress must come from the learner doing the activity on the page");
  }
  // Somali word choices the owner corrected (2026-08-20): "sentence" is weedh,
  // never jumlad — the rule must stay in the Somali language block, which is
  // the one block every Somali-producing reply receives.
  const somaliBlock = ((prompt.languageSupport || {}).somali || []).join("\n");
  if (!/weedh/.test(somaliBlock) || !/jumlad/.test(somaliBlock) || !/weedhaada/.test(somaliBlock)) {
    fail("The Somali word-choice rule is gone from the language block", "owner correction: sentence = weedh (never jumlad), your own sentence = weedhaada");
  }
  // Erayada af-Soomaali: the one sanctioned whole-reply Somali — the chip's
  // mode must exist and must say the vocabulary-only rule resumes after it.
  if (!hints["somali-translate"] || !/resumes/i.test(String(hints["somali-translate"]))) {
    fail("The somali-translate mode is gone or no longer scoped to one reply", "the Erayada af-Soomaali chip sends it; without it the model either refuses (vocabulary-only rule) or stays in Somali afterwards");
  }
  const chips = teacherPrompts();
  if (!Array.isArray(chips) || chips.length < 3 || chips.some((chip) => chip.mode !== "virtual-teacher")) {
    fail("A virtual-teacher chip does not carry the virtual-teacher mode", JSON.stringify(chips.map((chip) => [chip.label, chip.mode])));
  }
  // The activity-hint cap lives in both servers; keep them equal.
  const phpActivity = capIn(PHP, /\$clean\(\$payload\['activityHint'\][^,]*,\s*(\d+)\)/);
  const devActivity = capIn(DEV, /clean\(payload\.activityHint,\s*(\d+)\)/);
  if (phpActivity === null || phpActivity !== devActivity) {
    fail("The two activity-hint caps disagree or are missing", `wehel_chat.php ${phpActivity}, wehel-dev-chat.js ${devActivity}`);
  }
}

function report() {
  if (failures.length) {
    console.error(`\n✗ wehel contract: ${failures.length} broken\n`);
    for (const f of failures) console.error(`  • ${f}\n`);
    console.error("  Each of these was a real defect a learner saw. Fix the code, not the check.\n");
  } else {
    console.log(`✓ wehel contract: transcript filters, unit visibility (${notes.join("; ")}), prompt rules`);
  }
}

report();
process.exit(failures.length ? 1 : 0);
