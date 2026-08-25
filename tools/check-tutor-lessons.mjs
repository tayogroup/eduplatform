#!/usr/bin/env node
// The gate on tutoring topic lessons (grade-N/data/tutor-lessons/unit-N.json)
// — the authored "second teaching" the help session's Understand step and its
// check/practice pools read (shell/get-help.js). Usage:
//
//   node tools/check-tutor-lessons.mjs mathematics
//
// What it holds, and why each check exists:
//
//  1. A REGISTRY floor: the lessons each subject has shipped, which may only
//     GROW. The lesson files live inside generated data/ trees (the topic
//     index precedent), so a content rebuild that sweeps the directory would
//     silently delete authored work — this floor makes that loud.
//  2. Schema + depth: an "in-depth" lesson that is three thin lines is the
//     feature not existing while reporting that it does.
//  3. Answer keys: every MCQ answer among its options, options unique,
//     explanations present. These keys feed the before/after score a PARENT
//     reads — and wrong keys with green gates is this repo's oldest defect
//     (three Computing keys, 2026-08).
//  4. Arithmetic recomputation where the prompt is computable — stronger than
//     authorship, it cannot be fooled by a confident typo. Coverage is
//     RECORDED AND MAY NOT FALL, because a checker that quietly stops parsing
//     one pattern passes every other check (check-math-answer-keys lesson).
//  5. narrated:true requires every section's clip on disk under the cyrb53 of
//     its composed text, and the composition template in shell/get-help.js
//     must be byte-what this gate composes — otherwise the app requests a
//     hash that was never generated and silently falls back to the PAID
//     runtime voice.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const subject = process.argv[2];

// Lessons shipped, per subject. ADD entries here in the same commit that adds
// the lesson file; never remove one to get green — a missing file is the
// finding.
const REQUIRED = {
  mathematics: [[4, 11], [5, 7], [6, 6]],
  science: [],
};
// Computable answers verified across the subject's lessons. Only goes up.
const COMPUTED_FLOOR = { mathematics: 50, science: 0 };

if (!REQUIRED[subject]) {
  console.error(`usage: check-tutor-lessons.mjs <${Object.keys(REQUIRED).join("|")}>`);
  process.exit(2);
}

const failures = [];
const fail = (m, d) => failures.push(d ? `${m}\n      ${d}` : m);
const norm = (v) => String(v ?? "").trim().toLowerCase();

// --- arithmetic recomputation ------------------------------------------------
// Returns { value, kind } or null when the prompt is not one of the computable
// shapes. Kinds: percent (answer like "40%"), number, string (exact match).
function recompute(prompt) {
  const p = String(prompt).replace(/\s+/g, " ").trim();
  let m;
  if ((m = p.match(/^What is (\d+(?:\.\d+)?)% of (\d+(?:\.\d+)?)\?$/))) {
    return { value: (Number(m[1]) / 100) * Number(m[2]), kind: "number" };
  }
  if ((m = p.match(/^What is (\d+)\/(\d+) of (\d+(?:\.\d+)?)\?$/))) {
    return { value: (Number(m[1]) / Number(m[2])) * Number(m[3]), kind: "number" };
  }
  if ((m = p.match(/^(?:Write|Which percentage is the same as) (\d+)\/(\d+)(?: as a percentage\.?|\?)$/))) {
    return { value: (Number(m[1]) / Number(m[2])) * 100, kind: "percent" };
  }
  if ((m = p.match(/^(?:Write|Which percentage is the same as) (0\.\d+)(?: as a percentage\.?|\?)$/))) {
    return { value: Number(m[1]) * 100, kind: "percent" };
  }
  if ((m = p.match(/^(?:Write|Which decimal is the same as) (\d+(?:\.\d+)?)%(?: as a decimal\.?|\?)$/))) {
    return { value: Number(m[1]) / 100, kind: "number" };
  }
  if ((m = p.match(/^(?:Write|Which decimal is the same as) (\d+)\/(\d+)(?: as a decimal\.?|\?)$/))) {
    return { value: Number(m[1]) / Number(m[2]), kind: "number" };
  }
  if ((m = p.match(/^Write (0\.\d+) as a fraction out of 100\.$/))) {
    return { value: `${Math.round(Number(m[1]) * 100)}/100`, kind: "string" };
  }
  if ((m = p.match(/^Increase (\d+(?:\.\d+)?) by (\d+(?:\.\d+)?)%\. What is the new amount\?$/))) {
    return { value: Number(m[1]) * (1 + Number(m[2]) / 100), kind: "number" };
  }
  if ((m = p.match(/^Decrease (\d+(?:\.\d+)?) by (\d+(?:\.\d+)?)%\. What is the new amount\?$/))) {
    return { value: Number(m[1]) * (1 - Number(m[2]) / 100), kind: "number" };
  }
  if ((m = p.match(/scores (\d+) out of (\d+)\. What percentage is that\?$/))) {
    return { value: (Number(m[1]) / Number(m[2])) * 100, kind: "percent" };
  }
  return null;
}
function answerMatches(answer, expected) {
  const a = String(answer).trim();
  if (expected.kind === "string") return a === expected.value;
  if (expected.kind === "percent") {
    if (!a.endsWith("%")) return false;
    return Math.abs(parseFloat(a) - expected.value) < 1e-9;
  }
  return Math.abs(parseFloat(a.replace(/%$/, "")) - expected.value) < 1e-9 && !a.endsWith("%");
}

// --- the narration composition contract --------------------------------------
// THREE places compose a section's spoken text, and a clip only plays if all
// three agree: the UI's data-speak (shell/get-help.js), the generator's
// template (tools/lib/ehel-<subject>-narration.js :: textsForTutorLessons,
// which is what the clip is BOUGHT under), and this gate's own copy (which the
// clips-on-disk check below hashes). This section is the coverage gate for the
// Understand step's Listen button — it is raw data-speak markup, so the
// generic check-ehel-audio-coverage voiceButton scan never sees it.
const COMPOSE_TEMPLATE = "`${s.heading}. ${s.body}${";
const HELPER_BODY = "(s.example ? ` For example: ${s.example}` : \"\")";
const shellSource = fs.readFileSync(path.join(EHEL, "shell", "get-help.js"), "utf8");
if (!shellSource.includes("`${s.heading}. ${s.body}${exampleTail(s)}`") || !shellSource.includes(`const exampleTail = (s) => ${HELPER_BODY};`)) {
  fail("shell/get-help.js no longer composes section narration the way this gate hashes it",
    "the Understand step's data-speak text and the generated clip's hash must come from the same composition, or every Listen press falls back to the paid runtime voice");
}
const NARRATION_LIBS = { mathematics: "ehel-math-narration.js", science: "ehel-science-narration.js" };
const libPath = path.join(ROOT, "tools", "lib", NARRATION_LIBS[subject]);
const libSource = fs.existsSync(libPath) ? fs.readFileSync(libPath, "utf8") : "";
// The lib only owes the template once the subject narrates lessons — science's
// lib gains it with science's first narrated lesson, not before.
const libHasTemplate = libSource.includes("`${s.heading}. ${s.body}${tutorLessonExampleTail(s)}`")
  && libSource.includes(`const tutorLessonExampleTail = (s) => ${HELPER_BODY};`);
const composeNarration = (s) => `${s.heading}. ${s.body}${s.example ? ` For example: ${s.example}` : ""}`;
// The clip pipeline's real naming: clean() then cyrb53, same as the UI's
// staticVoiceKey and the generator's enqueue — hashing the raw text here
// would demand clips under names nothing ever writes.
const { cyrb53, clean, MIN_CHARS } = await import(url.pathToFileURL(path.join(ROOT, "tools", "lib", "ehel-narration-hash.js")).href)
  .catch(() => ({ cyrb53: null, clean: null, MIN_CHARS: 8 }));

// --- walk the lessons --------------------------------------------------------
let lessons = 0;
let computed = 0;
const seen = new Set();
const grades = fs.readdirSync(path.join(EHEL, subject)).filter((d) => /^grade-\d+$/.test(d));
for (const gradeDir of grades) {
  const dir = path.join(EHEL, subject, gradeDir, "data", "tutor-lessons");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => /^unit-\d+\.json$/.test(f))) {
    const stage = Number(gradeDir.slice(6));
    const unit = Number(file.match(/unit-(\d+)/)[1]);
    seen.add(`${stage}:${unit}`);
    lessons += 1;
    const where = `${subject} ${gradeDir}/${file}`;
    let lesson;
    try { lesson = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")); }
    catch (e) { fail(`${where} does not parse`, e.message); continue; }

    if (lesson.stage !== stage || lesson.unit !== unit) fail(`${where}: stage/unit fields disagree with the path`, `file says ${lesson.stage}/${lesson.unit}`);
    if (lesson.subject !== subject) fail(`${where}: subject field is "${lesson.subject}"`);
    // The manifest title is what the learner sees everywhere else — a lesson
    // claiming a different title is bound to the wrong unit or a stale one.
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(EHEL, subject, gradeDir, "data", "course-manifest.json"), "utf8"));
      const entry = (manifest.units || []).find((u) => Number(u.number) === unit);
      if (!entry) fail(`${where}: unit ${unit} is not in the course manifest`);
      else if (entry.title !== lesson.unitTitle) fail(`${where}: unitTitle drifted from the manifest`, `lesson "${lesson.unitTitle}" vs manifest "${entry.title}"`);
    } catch { fail(`${where}: could not read the course manifest to cross-check the title`); }

    if (!lesson.title || !lesson.promise) fail(`${where}: missing title or promise`);
    const sections = Array.isArray(lesson.sections) ? lesson.sections : [];
    if (sections.length < 4) fail(`${where}: only ${sections.length} sections — an in-depth lesson needs at least 4`);
    for (const [at, s] of sections.entries()) {
      if (!s.heading || !s.body) fail(`${where}: section ${at + 1} missing heading or body`);
      else if (String(s.body).length < 200) fail(`${where}: section ${at + 1} body is ${String(s.body).length} chars — thin for a from-zero teaching (min 200)`);
    }
    if (!Array.isArray(lesson.mistakes) || lesson.mistakes.length < 2) fail(`${where}: fewer than 2 common-mistake entries`);

    const check = Array.isArray(lesson.check) ? lesson.check : [];
    if (check.length < 8) fail(`${where}: only ${check.length} check MCQs — the session's evens/odds split wants at least 8`);
    for (const q of check) {
      const options = Array.isArray(q.options) ? q.options : [];
      if (options.length < 3) { fail(`${where} ${q.id}: fewer than 3 options`); continue; }
      if (new Set(options.map(norm)).size !== options.length) fail(`${where} ${q.id}: duplicate options`);
      if (!options.some((o) => norm(o) === norm(q.answer))) fail(`${where} ${q.id}: answer "${q.answer}" is not among the options`);
      if (!q.explanation) fail(`${where} ${q.id}: no explanation — the marked check shows one on every wrong answer`);
      const expected = recompute(q.question);
      if (expected) { computed += 1; if (!answerMatches(q.answer, expected)) fail(`${where} ${q.id}: arithmetic disagrees`, `"${q.question}" computes to ${expected.value}, key says "${q.answer}"`); }
    }
    const practice = Array.isArray(lesson.practice) ? lesson.practice : [];
    if (practice.length < 10) fail(`${where}: only ${practice.length} practice items — the practice step wants at least 10`);
    for (const p of practice) {
      if (!p.prompt || !p.answer || !p.hint) fail(`${where} ${p.id}: practice item missing prompt, answer or hint`);
      const expected = recompute(p.prompt);
      if (expected) { computed += 1; if (!answerMatches(p.answer, expected)) fail(`${where} ${p.id}: arithmetic disagrees`, `"${p.prompt}" computes to ${expected.value}, key says "${p.answer}"`); }
    }

    if (lesson.narrated === true) {
      if (!cyrb53 || !clean) fail(`${where}: narrated:true but the narration hash library could not be loaded`);
      else if (!libHasTemplate) fail(`${where}: narrated:true but ${NARRATION_LIBS[subject]} carries no textsForTutorLessons template`, "the generator would never have bought these clips — add the category to the subject's narration lib first");
      else {
        for (const [at, s] of sections.entries()) {
          const text = clean(composeNarration(s));
          if (text.length < MIN_CHARS) continue;
          const clip = path.join(EHEL, subject, "media", "audio", "tts", `${cyrb53(text)}.mp3`);
          if (!fs.existsSync(clip)) fail(`${where}: narrated:true but section ${at + 1} has no clip on disk`, `expected ${path.relative(ROOT, clip)} — every Listen press there is a silent paid fallback`);
        }
      }
    }
  }
}

for (const [stage, unit] of REQUIRED[subject]) {
  if (!seen.has(`${stage}:${unit}`)) fail(`required lesson missing: ${subject} grade-${stage} unit-${unit}`, "the registry only grows — if a rebuild swept the tutor-lessons directory, restore it from git");
}
if (computed < COMPUTED_FLOOR[subject]) {
  fail(`arithmetic coverage fell: ${computed} verified, floor is ${COMPUTED_FLOOR[subject]}`, "a recompute pattern stopped matching — items it covered are now unchecked behind a green tick");
}

if (failures.length) {
  console.error(`\n✗ tutor lessons (${subject}): ${failures.length} problem(s)\n`);
  for (const f of failures) console.error(`  • ${f}\n`);
  process.exit(1);
}
console.log(`✓ tutor lessons (${subject}): ${lessons} lesson(s), ${computed} answers re-computed, registry of ${REQUIRED[subject].length} intact`);
