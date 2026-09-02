#!/usr/bin/env node
// The gate on how a fill-in-the-blank frame and a slash reach the voice.
//
// Owner's rule (2026-09-03): "This is a / an ___" is narrated as
//   Fill in the blank: This is a ... Fill in the blank: This is an ...
// and no narrated English text ever carries a "/" or a run of underscores.
//
// Three things are checked, and each catches something the others cannot:
//
//   1. Worked examples. Every shape found in the content on the day the rule
//      was written, with the exact narration it must produce. A regex edit that
//      keeps the frames right but starts reading "am / is / are" as "am or is
//      or are" fails here and nowhere else.
//   2. The Python port agrees. tools/lib/ehel_speakable_frames.py is a hand-kept
//      mirror for the lecture pipeline, and "keep in step by hand" is only a
//      rule if something checks. The same cases go through both.
//   3. The real scripts. The generator's own --emit-scripts is run for every
//      category and grade — the exact text it would send — and no script may
//      still contain a slash between words or a blank. This is the end-to-end
//      half: a transform that is correct and no longer wired into narration()
//      passes 1 and 2 and fails here.
//
// Exit 1 is a finding; exit 2 means the gate could not run (Python missing,
// generator failed, or fewer scripts emitted than the course is known to hold)
// — a tick over a comparison that never ran is the failure this repo keeps
// documenting.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { speakableFrames } = require(path.join(ROOT, "tools", "lib", "ehel-tts.js"));

const args = process.argv.slice(2);
const QUICK = args.includes("--quick");
for (const a of args) if (a !== "--quick") { console.error(`Unknown argument: ${a}`); process.exit(2); }

// [input, exact narration]
const CASES = [
  ["Hold up one classroom object and name it. Say 'a' before most words, but 'an' before a vowel sound: a pen, an apple. This is a / an ___.",
    "Hold up one classroom object and name it. Say 'a' before most words, but 'an' before a vowel sound: a pen, an apple. Fill in the blank: This is a ... Fill in the blank: This is an ..."],
  ["3. Say one sentence that uses this pattern: This is a / an ___. 4. Write the word “hat” from memory, then check it.",
    "3. Say one sentence that uses this pattern: Fill in the blank: This is a ... Fill in the blank: This is an ... 4. Write the word “hat” from memory, then check it."],
  ["Name it: “This is a / an ___.” Say what people do there: “People go there to ___.” Give your opinion: “I like the ___ because ___.”",
    "Name it: “Fill in the blank: This is a ... Fill in the blank: This is an ...” Say what people do there: “People go there to ...” Give your opinion: “I like the ... because ...”"],
  ["Then say: “This is a / an ___. Its height is about ___.” “Its weight is about ___.”",
    "Then say: “Fill in the blank: This is a ... Fill in the blank: This is an ... Its height is about ...” “Its weight is about ...”"],
  ["There is / There are ___.", "Fill in the blank: There is ... Fill in the blank: There are ..."],
  ["Write about one animal, following the pattern “A / An ___ is a home for a / an ___.”",
    "Write about one animal, following the pattern “Fill in the blank: A ... is a home for a ... Fill in the blank: An ... is a home for an ...”"],
  ["Choose the correct word for each gap. 1. I have ___ (two / too) hands. 2. She ___ (eight / ate) all her rice.",
    "Choose the correct word for each gap. 1. I have ..., two or too, hands. 2. She ..., eight or ate, all her rice."],
  ["I ___ (can / can't) count to one hundred. It is easy! | She ___ (can / can't) reach the top shelf.",
    "Fill in the blank: I ..., can or can't, count to one hundred. It is easy! | She ..., can or can't, reach the top shelf."],
  ["Choose the best describing word for each sentence. 1. The rock was hard and ___ to break. (tough / calm) 2. She always tells the truth, so she is very ___. (honest / rough)",
    "Choose the best describing word for each sentence. 1. Fill in the blank: The rock was hard and ... to break. tough or calm. 2. She always tells the truth, so she is very ..., honest or rough."],
  ["Complete each instruction with the base verb in brackets. Add Don't where it says (not). | ___ (listen) to your teacher. | ___ (not / disturb) others while they are working.",
    "Complete each instruction with the base verb in brackets. Add Don't where it says (not). | ... (listen) to your teacher. | ..., not, disturb, others while they are working."],
  ["Write the correct form: use am / is / are and add -ing to the verb in brackets. | The children ___ (play) outside.",
    "Write the correct form: use am, is, are and add -ing to the verb in brackets. | Fill in the blank: The children ... (play) outside."],
  ["Put the words in the right order and write each sentence. 1. is / Karim / cleaning / the window 2. are / the firefighters / using / water",
    "Put the words in the right order and write each sentence. 1. is, Karim, cleaning, the window 2. are, the firefighters, using, water"],
  ["Red means stop and green means go. Stop. / Go.", "Red means stop and green means go. Stop. Go."],
  ["In my ___ the days are slow, / Past the ___ the ___ all go. / The ___ is busy, the ___ is grand, / So many places across our land!",
    "Fill in the blank: In my ... the days are slow, Past the ... the ... all go. The ... is busy, the ... is grand, So many places across our land!"],
  ["Yes/No questions begin with the helper. For he / she / it in the simple present add s. Use don't for I / you / we / they. Countable nouns take a / an, a number, or many.",
    "Yes or No questions begin with the helper. For he, she, it in the simple present add s. Use don't for I, you, we, they. Countable nouns take a or an, a number, or many."],
  ["Then say it out loud to yourself: 'My name is ___. I am ___ years old. This is my school.'",
    "Then say it out loud to yourself: 'Fill in the blank: My name is ... I am ... years old. This is my school.'"],
  ["Say 'This is my ___' every time.", "Say 'Fill in the blank: This is my ...' every time."],
  ["Say each sentence. Write the missing word. Choose from: elephant, fish. 1. An ___ is very big and grey. 2. A little ___ swims in the pond.",
    "Say each sentence. Write the missing word. Choose from: elephant, fish. 1. An ... is very big and grey. 2. A little ... swims in the pond."],
  ["Put an adjective in front of each noun, and choose a or an to match the sound. 1. a / an ___ staircase 2. a / an ___ dog 3. a / an ___ race",
    "Put an adjective in front of each noun, and choose a or an to match the sound. 1. Fill in the blank: a ... staircase. Fill in the blank: an ... staircase 2. Fill in the blank: a ... dog. Fill in the blank: an ... dog 3. Fill in the blank: a ... race. Fill in the blank: an ... race"],
  ["“I count the shells.” / “She counts the shells.” Imperatives drop the subject.",
    "“I count the shells.” “She counts the shells.” Imperatives drop the subject."],
  ["It is a / an ___ ___.", "Fill in the blank: It is a ... Fill in the blank: It is an ..."],
  ["Answers: 1. that / which 2. who 3. that / which", "Answers: 1. that or which 2. who 3. that or which"],
  ["discrimination — base word: ___ / other forms: ___", "discrimination — base word: Fill in the blank: ... other forms: ..."],
  ["Can you measure this shell for me? (Yes/No, about ability) | ___ many shells",
    "Can you measure this shell for me? (Yes or No, about ability) | Fill in the blank: ... many shells"],
  ["I don't, but she does. Finish each sentence about yourself. Today’s month is ___. My favourite month is ___, because ___.",
    "I don't, but she does. Finish each sentence about yourself. Today’s month is ... My favourite month is ..., because ..."],
  ["Ask and answer “Can you ___?” with “Yes, I can.” / “No, I can't.”",
    "Ask and answer “Fill in the blank: Can you ...?” with “Yes, I can.” “No, I can't.”"],
  ["Adjective + noun phrases with a / an chosen by sound.", "Adjective + noun phrases with a or an chosen by sound."],
  // Text with neither a blank nor a slash passes through untouched.
  ["Sami has a red apple. He likes it.", "Sami has a red apple. He likes it."],
];

// A "/" the voice would have to read: between two words, spaced or tight.
// Phoneme notation (/m/ as in moon) is stripped first — it is a different
// thing from a slash between words, it lives only in the withdrawn Grade 1
// Unit 0 teacher plans (already a recorded finding of check-english-content),
// and this rule is about frames and choices.
const PHONEME_RE = /\/[^\s/]{1,3}\//g;
const SPOKEN_SLASH_RE = /(?:^|[\s\w)”"’'])\/(?:[\s\w(“"‘']|$)/;
const BLANK_RE = /_{2,}/;
const spokenSlash = (text) => SPOKEN_SLASH_RE.test(String(text).replace(PHONEME_RE, " "));

let findings = 0;
const fail = (msg) => { findings += 1; console.log(`✗ ${msg}`); };

// 1. Worked examples.
for (const [input, expected] of CASES) {
  const got = speakableFrames(input);
  if (got !== expected) fail(`case differs\n   in : ${input}\n   want: ${expected}\n   got : ${got}`);
  if (spokenSlash(got) || BLANK_RE.test(got)) fail(`case still carries a slash or blank: ${got}`);
}
console.log(`${findings ? "" : "✓ "}${CASES.length} worked examples`);

// 2. The Python port agrees, case for case.
const casesFile = path.join(os.tmpdir(), `ehel-speakable-cases-${process.pid}.json`);
fs.writeFileSync(casesFile, JSON.stringify(CASES.map(([i]) => [i, speakableFrames(i)])));
const py = spawnSync("python", ["-c", [
  "import json,sys",
  `sys.path.insert(0, ${JSON.stringify(path.join(ROOT, "tools", "lib"))})`,
  "from ehel_speakable_frames import speakable_frames",
  `cases = json.load(open(sys.argv[1], encoding='utf-8'))`,
  "bad = [(i, js, speakable_frames(i)) for i, js in cases if speakable_frames(i) != js]",
  "sys.stdout.reconfigure(encoding='utf-8')",
  "print(json.dumps(bad))",
].join("\n"), casesFile], { encoding: "utf8" });
fs.rmSync(casesFile, { force: true });
if (py.status !== 0) {
  console.error(`✗ could not run the Python port (exit ${py.status}):\n${py.stderr}`);
  process.exitCode = 2;
} else {
  const bad = JSON.parse(py.stdout.trim() || "[]");
  for (const [input, js, python] of bad) fail(`Python port disagrees\n   in : ${input}\n   js : ${js}\n   py : ${python}`);
  if (!bad.length) console.log(`✓ Python port agrees on all ${CASES.length} cases`);
}

// 3. The real scripts, as the generator would send them.
const CATEGORIES = QUICK
  ? ["grammar", "grammar-practice", "speaking", "activities", "writing", "readings"]
  : ["readings", "grammar-practice", "grammar", "speaking", "vocabulary", "dictionary", "glossary", "writing", "activities", "final-quiz", "overview"];
// Measured 2026-09-03: the quick set alone emits 3,032 scripts, the full set 92,067.
const FLOOR = QUICK ? 2500 : 80000;
let emitted = 0;
let slashes = 0, blanks = 0;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ehel-speakable-scripts-"));
try {
  for (const category of CATEGORIES) {
    const out = path.join(dir, `${category}.json`);
    const run = spawnSync(process.execPath, [path.join(ROOT, "tools", "generate-ehel-english-audio.js"), category, "1", "2", "3", "4", "5", "6", "7", "8", "--emit-scripts", out], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (run.status !== 0 || !fs.existsSync(out)) {
      console.error(`✗ generator failed to emit ${category} (exit ${run.status}):\n${(run.stderr || run.stdout).slice(-2000)}`);
      process.exitCode = 2;
      continue;
    }
    const scripts = JSON.parse(fs.readFileSync(out, "utf8"));
    for (const [id, text] of Object.entries(scripts)) {
      emitted += 1;
      if (spokenSlash(text)) { slashes += 1; if (slashes <= 10) fail(`${category} ${id} would narrate a slash: ${text.slice(0, 160)}`); }
      if (BLANK_RE.test(text)) { blanks += 1; if (blanks <= 10) fail(`${category} ${id} would narrate a blank: ${text.slice(0, 160)}`); }
    }
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
if (process.exitCode !== 2 && emitted < FLOOR) {
  console.error(`✗ only ${emitted} scripts emitted (floor ${FLOOR}) — the generator narrates less than it did, or the emit failed silently`);
  process.exitCode = 2;
}
if (slashes || blanks) fail(`${slashes} script(s) still carry a slash and ${blanks} a blank (first ten of each listed above)`);
else if (process.exitCode !== 2) console.log(`✓ ${emitted} narrated scripts across ${CATEGORIES.length} categories, none with a slash or a blank`);

if (process.exitCode === 2) console.log("\nspeakable frames: NOT CHECKED (exit 2)");
else if (findings) { console.log(`\nspeakable frames: ${findings} finding(s)`); process.exitCode = 1; }
else console.log("\nspeakable frames: ok");
