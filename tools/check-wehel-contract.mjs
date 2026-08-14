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
const { apiMessages, withoutMediaPlumbing, UNIT_JSON_LIMIT } = wehel;
for (const [name, value] of Object.entries({ apiMessages, withoutMediaPlumbing, UNIT_JSON_LIMIT })) {
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

// --- 2. a whole unit reaches the tutor --------------------------------------

const capIn = (file, re) => { const m = fs.readFileSync(file, "utf8").match(re); return m ? Number(m[1]) : null; };
const phpCap = capIn(PHP, /core_text::strlen\(\$unitcontent\)\s*>\s*(\d+)/);
const devCap = capIn(DEV, /unitContent\.length\s*>\s*(\d+)/);
if (phpCap !== UNIT_JSON_LIMIT || devCap !== UNIT_JSON_LIMIT) {
  fail("The three unit-content caps disagree", `wehel.js ${UNIT_JSON_LIMIT}, wehel_chat.php ${phpCap}, wehel-dev-chat.js ${devCap} — the smallest wins silently, and content past it is invisible to the tutor`);
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
        const length = JSON.stringify(withoutMediaPlumbing(parsed)).length;
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
