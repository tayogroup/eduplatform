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
const { apiMessages, withoutMediaPlumbing, unitForTutor, UNIT_JSON_LIMIT, withAttachmentBlocks, homeworkContextText, HOMEWORK_CONTEXT_LIMIT, WEHEL_ATTACH_DAILY_LIMIT, teacherPrompts, storedTeacherScript } = wehel;
for (const [name, value] of Object.entries({ apiMessages, withoutMediaPlumbing, unitForTutor, UNIT_JSON_LIMIT, withAttachmentBlocks, homeworkContextText, HOMEWORK_CONTEXT_LIMIT, WEHEL_ATTACH_DAILY_LIMIT, teacherPrompts, storedTeacherScript })) {
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
  // Wehel is English-only (owner, 2026-08-23): the Somali vocabulary block,
  // the Erayada af-Soomaali translate hint and the Teaching-language switch
  // were removed. They must not quietly return.
  if ((prompt.languageSupport && prompt.languageSupport.somali) || hints["somali-translate"]) {
    fail("Somali support is back in the prompt", "owner removed Somali translation and audio from every Wehel reply on 2026-08-23 — remove languageSupport.somali and modeHints.somali-translate");
  }
  if (typeof wehel.preferredTeachingLanguage === "function" || typeof wehel.speakSomali === "function" || typeof wehel.voiceSegments === "function") {
    fail("Somali client paths are back in shell/wehel.js", "the Teaching-language switch, the Ubah voice and the Soomaali segmenter were removed on 2026-08-23");
  }
  const chips = teacherPrompts();
  if (!Array.isArray(chips) || chips.length < 3 || chips.some((chip) => chip.mode !== "virtual-teacher")) {
    fail("A virtual-teacher chip does not carry the virtual-teacher mode", JSON.stringify(chips.map((chip) => [chip.label, chip.mode])));
  }
  // The opening chip is ONE chip ("Teach me the activity" — Start + What's
  // expected, merged on the owner's instruction), marked `teach` so Grade 1
  // can answer it from the stored script; the two it replaced must not return.
  const labels = chips.map((chip) => chip.label);
  const teachChip = chips.find((chip) => chip.teach);
  if (!teachChip || teachChip.label !== "Teach me the activity") fail("The combined 'Teach me the activity' chip is missing or not marked teach", JSON.stringify(labels));
  if (labels.some((label) => /Start this activity|expected of me/i.test(label))) fail("The merged chips came back", JSON.stringify(labels));
  // The live ask and the stored-script generator must ask the same thing.
  const libMessage = (fs.readFileSync(path.join(ROOT, "tools", "lib", "ehel-teacher-scripts.js"), "utf8").match(/TEACH_ME_MESSAGE = "([^"]+)"/) || [])[1];
  if (!teachChip || libMessage !== teachChip.message) fail("TEACH_ME_MESSAGE differs between shell/wehel.js and tools/lib/ehel-teacher-scripts.js", `a stored Grade 1 script would answer a different ask than the live chip sends`);
  // Stored-script lookup is by unit number and section id, and tolerates every
  // missing layer — a miss is the live path, never a throw.
  if (storedTeacherScript(null, 1, "words") !== null || storedTeacherScript({}, 1, "words") !== null) fail("storedTeacherScript does not tolerate a missing scripts file", "a Grade 1 unit with no scripts yet must fall back to the live path");
  const found = storedTeacherScript({ units: { 3: { words: { text: "Hello class.", hash: "abc" } } } }, 3, "words");
  if (!found || found.text !== "Hello class.") fail("storedTeacherScript does not find a stored entry by unit and section", JSON.stringify(found));
  // The activity-hint cap lives in both servers; keep them equal.
  const phpActivity = capIn(PHP, /\$clean\(\$payload\['activityHint'\][^,]*,\s*(\d+)\)/);
  const devActivity = capIn(DEV, /clean\(payload\.activityHint,\s*(\d+)\)/);
  if (phpActivity === null || phpActivity !== devActivity) {
    fail("The two activity-hint caps disagree or are missing", `wehel_chat.php ${phpActivity}, wehel-dev-chat.js ${devActivity}`);
  }
  // The tutoring-category framing correction (2026-08-25): a tutoring-support
  // learner reached the lesson by SEARCHING a topic and holds no position in
  // the course, so the prompt must reframe "unit" as "lesson" for them. Four
  // links in the chain, each of which can silently drop out on its own:
  // the note in the prompt source, the injection in each server, and the
  // client actually sending the field.
  const tutoringNote = Array.isArray(prompt.categoryNotes?.tutoring) ? prompt.categoryNotes.tutoring.join("\n") : "";
  if (!tutoringNote) {
    fail("The tutoring framing correction is gone from the prompt", "categoryNotes.tutoring is what stops Wehel talking to a tutoring-support learner about units they have no position in");
  } else {
    if (!/this lesson/i.test(tutoringNote) || !/never say "unit"/i.test(tutoringNote)) {
      fail("The tutoring note no longer reframes unit as lesson", "it must forbid the word \"unit\" and offer \"this lesson\" — that reframing is its whole job");
    }
    // Appended AFTER template substitution in both servers, so a placeholder
    // in it would print literally to the model.
    if (/\{\{[A-Z_]+\}\}/.test(tutoringNote)) {
      fail("The tutoring note carries a {{placeholder}}", "categoryNotes are appended after substitution — a placeholder reaches the model as literal braces");
    }
  }
  const phpCategory = capIn(PHP, /\$clean\(\$payload\['learnerCategory'\][^,]*,\s*(\d+)\)/);
  const devCategory = capIn(DEV, /clean\(payload\.learnerCategory,\s*(\d+)\)/);
  if (phpCategory === null || phpCategory !== devCategory) {
    fail("The two learner-category reads disagree or are missing", `wehel_chat.php ${phpCategory}, wehel-dev-chat.js ${devCategory} — without the read, the note above exists but nothing injects it`);
  }
  const phpSource = fs.readFileSync(PHP, "utf8");
  const devSource = fs.readFileSync(DEV, "utf8");
  if (!/categorynote/i.test(phpSource) || !/\$system\s*\.=/.test(phpSource)) {
    fail("wehel_chat.php no longer appends the category note to the cached block", "reading learnerCategory without appending categoryNotes is the field arriving and doing nothing");
  }
  if (!/categoryNote/.test(devSource) || !/system\s*\+=/.test(devSource)) {
    fail("wehel-dev-chat.js no longer appends the category note", "the dev twin must mirror wehel_chat.php or local testing proves nothing about production");
  }
  // The volatile section-hint wrapper must drop "of this unit" for tutoring in
  // BOTH servers — a search-page hint framed as a unit page contradicts the
  // correction the same prompt just made.
  if (!/'tutoring'\s*\?\s*'page'\s*:\s*'page of this unit'/.test(phpSource)) {
    fail("wehel_chat.php's section-hint wrapper is not category-aware", "for tutoring it must say \"page\", not \"page of this unit\"");
  }
  if (!/"tutoring"\s*\?\s*"page"\s*:\s*"page of this unit"/.test(devSource)) {
    fail("wehel-dev-chat.js's section-hint wrapper is not category-aware", "must mirror wehel_chat.php");
  }
  // And the client must actually send the field, or every check above guards
  // a path nothing reaches.
  const shellSource = fs.readFileSync(path.join(ROOT, "src", "prototypes", "ehel-academy", "shell", "wehel.js"), "utf8");
  if (!/learnerCategory:\s*meta\.learnerCategory/.test(shellSource)) {
    fail("shell/wehel.js no longer sends learnerCategory", "askWehel must carry meta.learnerCategory or the servers' category handling is unreachable");
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
