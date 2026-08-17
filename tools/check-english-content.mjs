// Acceptance gate for the Ehel Academy English course (Grades 1-8).
//
// English is the only Ehel subject with no content gate, because it is the only
// one that is hand-authored rather than built from a source pack — there was no
// builder to hang a check on. So the defects that gates catch elsewhere were
// reaching the learner here: six teacher lesson plans were sitting in a Grade 1
// learner's "Reading & story" section, narrated, and nothing in the repo said so.
//
// WHAT THIS DOES **NOT** CHECK
// ============================
// `npm run validate:curriculum-units` already owns per-unit structure: required
// sections, id uniqueness, cross-references, comprehension anchoring and the
// Cambridge objective mapping. Repeating any of that here would mean two files
// to keep in step and two places to fix a rule. This gate covers what nothing
// reads today, which is mostly CROSS-FILE agreement and WHO THE TEXT IS FOR.
//
// THE EXEMPTION THAT MATTERS
// ==========================
// Adult-addressed prose is legitimate in exactly one place: text explicitly
// marked `audience: "adult"`, which the app draws behind a grown-up panel
// instead of the learner's e-book (english.js :: renderReadingGrownUp), plus a
// unit's `grownUpGuide` block. It is a FAILURE anywhere else.
//
// Note the exemption is the AUDIENCE FIELD, never the `type` string.
// validate-unit.mjs already looks for a leaked teacher-guide header and then
// exempts any reading whose type matches /phonics/i — and Grade 1 Unit 0's six
// teacher plans are typed "Teacher-led phonics text", so that exemption
// swallowed every one of them. A check whose escape hatch is a free-text label
// is a check the content can talk its way out of.
//
// THE BASELINE
// ============
// This gate was written after the content, so it opened on 16 real failures.
// A gate that cannot be run is a gate nobody wires in, so the known 16 live in
// a committed baseline (english/data/content-gate-baseline.json) and the build
// stays green — but the list can only ever SHRINK:
//   - a failure not in the baseline fails the build, which is the point;
//   - a baseline entry that no longer fires ALSO fails, asking to be deleted,
//     so the file cannot quietly rot into a permanent amnesty.
// Its diff is the review surface. Regenerate deliberately, never to get green:
//   node tools/check-english-content.mjs --write-baseline
//
// Usage:
//   node tools/check-english-content.mjs
// Exit 0 = pass, 1 = at least one failure.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "src", "prototypes", "ehel-academy", "english");

const failures = [];
const notes = [];
const fail = (label, message) => failures.push(`${label}: ${message}`);
const note = (message) => notes.push(message);
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

// ── who the text is written for ─────────────────────────────────────────────
// Deliberately narrow, and narrower than it first looks. Global Perspectives
// learned this the expensive way: matching bare "children" or "the class"
// stripped ~65k characters of correct teaching prose, because those are ordinary
// story words — an English reader legitimately says "the children ran to the
// gate". What is diagnostic is the learner as SOMEBODY ELSE'S CHARGE, or the
// page addressing the adult directly.
const ADULT_ADDRESSED = /\byour child\b|\bthe child (?:draws|writes|circles|points|says|will|can|needs|should)\b|\blet (?:the|your) (?:child|learner)\b|\bhelp your child\b|\bnote for the teacher\b|\bteacher (?:lesson plan|guide|notes)\b|\bweekly objectives\b|\bchildren will (?:be able to|begin to)\b|\bby the end of week \d|(?:^|[.!?]\s+)(?:Model|Remind|Encourage|Prompt|Praise|Coach)\s+(?:the|them|your)\b|\bthe child's own\b/i;
// The last two alternatives above were added after a browser pass found a
// Grade 1 grammar card telling the five-year-old reading it to "Model the short
// /a/ first, then let them copy" — teacher guidance rendered plainly at
// display:block on the learner's own card, which every check here had missed.
//
// They are narrow on purpose, and three broader drafts were measured and thrown
// away first. Anything keyed on "them" is undiagnosable: "ask them to guess your
// shape" tells the LEARNER to ask a partner, and story dialogue is full of "we
// let them usurp the truth" — 54 hits, almost all wrong. Keying on the learner
// as a bare third-person noun is no better: "the children sang the alphabet
// song" is a story, and Grade 1's comprehension questions use "the learner" as a
// CHARACTER ("Which page does the learner like best?") — 322 hits.
//
// What survives is the learner as somebody else's charge ("the child's own
// life", in a marker's note printed to the learner) and a teacher imperative
// that opens a sentence ("Model the…", "Remind them…"). Requiring the
// sentence-initial capital is what keeps "the model the story's country was
// leaving" out. Measured: 10 hits across all 81 units, every one real.

// Teacher notation for a sound. Correct in an adult's plan, wrong on a
// five-year-old's screen — and ElevenLabs reads it as the LETTER NAME, so
// "M says /m/" was narrated "M says em", the exact opposite of the lesson.
//
// The bracketing is the whole check, not decoration. A bare /[a-z]{1,3}/ also
// matches the slash ALTERNATIONS grammar teaching is full of — "am/is/are",
// "he/she/it", "in/on/at", "told me/him/her" — and it reported 18 of those as
// narrated phoneme defects across Grades 4-8, nearly half of everything this
// file found on its first run. So the opening slash may not follow a word
// character (that is what makes it an alternation) and the closing one may not
// precede another, which rules out the middle of any a/b/c chain. Measured
// against the course, not reasoned about: 19 real hits kept, 18 false ones
// dropped, and every survivor read by hand.
const PHONEME_NOTATION = /(?:^|[^\w/-])\/[a-zɒʌæɜɪʊθðʃʒŋ]{1,3}\/(?![\w/])/;

const MOJIBAKE = /�|Ã[-¿]|â€[™œ""]/;
const PLACEHOLDER = /\b(TBD|TODO|FIXME|Lorem ipsum)\b/i;

// Instructions to whoever is MARKING, in a field the learner reads.
//
// Kept separate from ADULT_ADDRESSED because it reads as perfectly ordinary
// prose — there is no "your child" to spot. Found by clicking "Check guidance"
// in the browser and reading what came back: "Accept any kind, practical idea,
// such as saying hello, asking the child's name…". Comprehension shows
// `correctAnswer` to the learner as "Reviewed guidance" once they have written
// something, so mark-scheme wording lands in front of the child.
//
// Anchored to the start of a sentence and to a small closed set of openers.
// Bare "accept" is an ordinary word in a story ("they would not accept the
// offer"); it is the sentence-initial imperative that makes it an instruction
// to a marker. Measured: 15 hits, all in comprehension guidance, 14 of them
// Grade 2. A further 11 matches live in activities.answerSummary, which is
// NEVER rendered — english.js does not read that field — so they are correctly
// out of scope here rather than inflating the count.
const MARKER_INSTRUCTION = /(?:^|[.!?]\s+)(?:Accept|Award|Allow|Credit|Mark)\s+(?:any|both|either|one|two|full|marks?|the)\b/;

// The fields comprehension actually shows the learner as "Reviewed guidance".
// Narrower than LEARNER_FIELDS on purpose: a mark scheme is legitimate in an
// answerKey or a teacherNote, and neither is drawn on a learner's page.
const GUIDANCE_FIELDS = { comprehension: ["correctAnswer", "explanation"] };

// The id field each section uses, in the order they are looked for. One list,
// because every failure message needs to name the item it is about.
//
// ORDER MATTERS, and getting it wrong is silent. `readingId` first labelled
// every comprehension question by the READING it points at — a cross-reference,
// not an identity — so a unit's questions all shared one label and collapsed
// back into a single baseline entry, which is the exact bug the item id was
// added to fix. An item's OWN id comes first; readingId is last because only a
// reading has nothing better.
const ID_KEYS = ["questionId", "grammarId", "speakingId", "writingId",
  "activityId", "assignmentId", "selfAssessmentId", "vocabularyId", "readingId"];

// Every field the learner reads on screen, per section. If the renderer prints
// it, it belongs here; if it does not, it does not.
const LEARNER_FIELDS = {
  readings: ["title", "passageScript"],
  comprehension: ["question", "correctAnswer", "explanation"],
  grammar: ["title", "explanation", "ruleAndExamples", "commonMistake", "memoryTip", "practice"],
  speaking: ["title", "instructionsAndModelLines"],
  writing: ["title", "promptAndInstructions", "modelText", "sentenceStarter", "successCriteria", "support", "extension"],
  activities: ["title", "instructionsAndItems"],
  quizzes: ["question", "explanation"],
  assignments: ["title", "instructions"],
  selfAssessment: ["statement"],
  dictionaryLinks: ["childMeaning", "exampleSentence", "spellingPractice", "sentenceStarter"],
};

// The subset that is spoken aloud. Phoneme notation here is a hard failure: it
// is money spent on a recording that teaches the wrong thing. Elsewhere on
// screen it is a note — wrong for the age group, but silent.
// Kept in step with tools/generate-ehel-english-audio.js, which is the file
// that decides what actually gets sent to ElevenLabs.
const NARRATED_FIELDS = {
  readings: ["passageScript"],
  grammar: ["explanation", "ruleAndExamples", "practice"],
  speaking: ["instructionsAndModelLines"],
  writing: ["promptAndInstructions"],
  activities: ["instructionsAndItems"],
};

// A unit is walked one section at a time, so a per-item `audience` can exempt
// that item and nothing else.
const isAdult = (item) => item?.audience === "adult";

// Options are stored BOTH ways: unit quizzes and the two course assessments use
// a pipe-separated string ("see | smell | taste | touch"), and some carry a real
// array. Parsed in one place because the first draft of this file accepted only
// arrays in the assessment block and duly reported all 36 Grade 8 placement
// questions as having "fewer than two options" — a gate whose own reader is
// wrong is worse than no gate, because the noise is indistinguishable from a
// real find until someone opens the data.
function optionsOf(question) {
  const raw = question.options;
  if (Array.isArray(raw)) return raw.map((option) => String(option).trim()).filter(Boolean);
  return String(raw || "").split("|").map((option) => option.trim()).filter(Boolean);
}

// One key check, used by unit quizzes and by both course assessments.
function checkKey(label, id, question) {
  const options = optionsOf(question);
  if (options.length < 2) { fail(label, `${id} has fewer than two options`); return; }
  if (new Set(options).size !== options.length) fail(label, `${id} repeats an option`);
  if (!options.includes(String(question.correctAnswer).trim())) {
    fail(label, `${id} correctAnswer ${JSON.stringify(question.correctAnswer)} is not one of its options`);
  }
}

// ── media resolution, as the app does it ────────────────────────────────────
// Two bases, and getting them wrong reports hundreds of phantom failures.
// A shared-tree clip (media/audio/grade-N/…) resolves from the english/ root;
// anything else relative resolves from that grade's own folder. This mirrors
// english.js :: resolveGradeAssets + SHARED_AUDIO.
const SHARED_AUDIO = /(^|\/)media\/audio\/grade-\d+\//;
function resolveAsset(source, gradeDir) {
  const clean = String(source).replace(/\\/g, "/");
  if (SHARED_AUDIO.test(clean)) return path.join(root, clean.replace(/^\.\//, ""));
  if (/^\.\.?\//.test(clean)) return path.join(root, gradeDir, clean);
  return null; // absolute or remote — not ours to check
}

// ── who last touched this subject ───────────────────────────────────────────
// Printed first, before any check runs, because the thing it answers is not a
// content question: it is "did somebody else change English while I was working
// on it".
//
// Every session in this repo commits as the same git identity, so `git log`
// cannot say WHICH session made a change — only that one was made, and when.
// That turned out to matter. Four commits have touched this file; three are
// from the session that wrote it and the fourth is from neither of the two
// sessions that later discussed it, and nobody noticed until a hand-written
// note crossed between sessions days later. In the same window something
// renamed English's lecture nav, rewrote nine Grade 2 units, and edited two
// other subjects' modules. All of it was fine; none of it was visible.
//
// One `git log -1` (~140 ms) turns "found out from a note, afterwards" into
// "found out from the gate, immediately". It cannot PREVENT a collision —
// nothing can, with one shared identity and no locking — so it deliberately
// holds no state, compares against nothing and never fails the build. It just
// says who was here last, and lets the reader notice it was not them.
//
// Scoped to English's own paths. Shared modules (wehel.js, course-app.js,
// deck.js) are left out on purpose: they change for every subject's reasons,
// so including them would make this line fire constantly and mean nothing.
function printLastTouch() {
  const paths = [
    "src/prototypes/ehel-academy/english",
    "src/prototypes/ehel-academy/shell/subjects/english.js",
    "tools/check-english-content.mjs",
  ];
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%h  %ci  %s", "--", ...paths],
      { cwd: path.join(here, ".."), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (out) console.log(`last commit touching english: ${out}\n`);
  } catch {
    // No git, a shallow clone, or an exported tree. This is context, not a
    // check — a gate that fails because it could not gossip would be absurd.
  }
}
printLastTouch();

const grades = fs.readdirSync(root)
  .filter((name) => /^grade-[1-8]$/.test(name))
  .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));

if (!grades.length) {
  console.log("✗ no english grade folders found");
  process.exit(1);
}

let unitCount = 0;
let questionCount = 0;
let learnerChars = 0;
let missingSection = 0;
let displayPhonemes = 0;
const unsigned = new Map();      // reviewStatus -> count
const bannerImages = new Map();  // image path -> [unit labels]

for (const gradeDir of grades) {
  const gradeNo = Number(gradeDir.slice(6));
  const dataDir = path.join(root, gradeDir, "data");
  const manifestPath = path.join(dataDir, "course-manifest.json");
  if (!fs.existsSync(manifestPath)) { fail(gradeDir, "no course-manifest.json"); continue; }
  const manifest = readJson(manifestPath);

  for (const entry of manifest.units || []) {
    const label = `${gradeDir}/unit-${entry.number}`;
    const unitPath = path.join(dataDir, "units", `unit-${entry.number}.json`);
    if (!fs.existsSync(unitPath)) { fail(label, "manifest lists a unit with no unit-N.json"); continue; }
    const unit = readJson(unitPath);
    unitCount += 1;

    // ── the manifest and the unit must agree ────────────────────────────────
    // They are read by different screens: the picker draws the manifest, the
    // page draws the unit. When they disagree the learner sees one unit under
    // two names and neither is wrong enough to look like a bug. Grade 3's
    // capstone shipped as "My Year of Words" in the picker and "My English
    // Voice" on the page.
    const u = unit.unit || {};
    if (u.unitId !== entry.id) fail(label, `unitId ${u.unitId} != manifest id ${entry.id}`);
    if (u.unitNo !== entry.number) fail(label, `unitNo ${u.unitNo} != manifest number ${entry.number}`);
    if (u.termId !== entry.termId) fail(label, `termId ${u.termId} != manifest termId ${entry.termId}`);
    if (u.unitTitle !== entry.title) fail(label, `title ${JSON.stringify(u.unitTitle)} != manifest ${JSON.stringify(entry.title)}`);
    if (unit.grade?.id !== manifest.grade?.id) fail(label, `grade ${unit.grade?.id} != manifest ${manifest.grade?.id}`);
    if (unit.cambridge?.stage !== gradeNo) fail(label, `cambridge.stage ${unit.cambridge?.stage} != grade ${gradeNo}`);

    // The picker prints this number before the learner opens the unit.
    const links = unit.dictionaryLinks?.length || 0;
    if (entry.vocabularyCount !== undefined && entry.vocabularyCount !== links) {
      fail(label, `manifest vocabularyCount ${entry.vocabularyCount} != ${links} dictionaryLinks`);
    }

    // ── every countable section must be finishable ──────────────────────────
    // The unit gate holds the next unit shut until every countable section of
    // this one is done, so a section that ships empty locks the learner out
    // permanently — not a blank page, a dead course. This is the cheapest
    // possible guard on the most expensive possible failure.
    for (const section of ["readings", "comprehension", "grammar", "speaking", "writing", "activities", "quizzes", "selfAssessment", "dictionaryLinks"]) {
      if (!(unit[section]?.length > 0)) fail(label, `${section} is empty — its section can never be completed, so the gate would gate the whole grade shut`);
    }
    const gamePack = path.join(dataDir, "games", `unit-${entry.number}.json`);
    if (!fs.existsSync(gamePack)) fail(label, "no games/unit-N.json — Games is countable when a pack exists and this unit would offer none");

    // ── who is being spoken to, and in what notation ────────────────────────
    for (const [section, fields] of Object.entries(LEARNER_FIELDS)) {
      for (const item of unit[section] || []) {
        // Every message names the ITEM, not just the unit and field. Without it
        // three identical "grade-2/unit-1: comprehension.correctAnswer …"
        // failures collapse into one entry in the baseline Set, and fixing two
        // of the three leaves the gate seeing the survivor and reporting
        // nothing — a baseline that cannot count what it is holding.
        const itemId = ID_KEYS.map((key) => item[key]).find(Boolean) || "?";
        const adult = isAdult(item);
        for (const field of fields) {
          const raw = item[field];
          const values = Array.isArray(raw) ? raw : [raw];
          for (const value of values) {
            if (typeof value !== "string" || !value) continue;
            learnerChars += value.length;
            if (MOJIBAKE.test(value)) fail(label, `${itemId} ${section}.${field} has mojibake`);
            if (PLACEHOLDER.test(value)) fail(label, `${itemId} ${section}.${field} still has placeholder text`);
            // An adult-audience item is allowed both of the checks below: it is
            // a teacher's document, drawn behind the grown-up panel, and /m/ is
            // that reader's own notation.
            if (adult) continue;
            const adultHit = value.match(ADULT_ADDRESSED);
            if (adultHit) {
              fail(label, `${itemId} ${section}.${field} is written to an adult (${JSON.stringify(adultHit[0])}) but is not marked audience:"adult"`);
            }
            if (GUIDANCE_FIELDS[section]?.includes(field)) {
              const markerHit = value.match(MARKER_INSTRUCTION);
              if (markerHit) {
                fail(label, `${itemId} ${section}.${field} instructs a marker (${JSON.stringify(markerHit[0].trim())}) and is shown to the learner as "Reviewed guidance"`);
              }
            }
            if (PHONEME_NOTATION.test(value)) {
              if (NARRATED_FIELDS[section]?.includes(field)) {
                fail(label, `${itemId} ${section}.${field} prints phoneme notation and is NARRATED — the voice reads /m/ as the letter name "em"`);
              } else {
                displayPhonemes += 1;
              }
            }
          }
        }
      }
    }

    // A unit-level guide is the adult's page by definition; only its presence
    // is checked, never its voice.
    if (unit.grownUpGuide && !unit.grownUpGuide.label) fail(label, "grownUpGuide has no label");

    // unit.howToUse is the opposite: the unit's own instructions to the LEARNER,
    // drawn at the top of the overview's "How this unit works" panel. Optional,
    // but where present it is an array of non-empty strings in learner voice —
    // there is no adult exemption, since it has no grown-up panel to hide in.
    if (unit.unit?.howToUse !== undefined) {
      const lines = unit.unit.howToUse;
      if (!Array.isArray(lines) || !lines.length || lines.some((line) => typeof line !== "string" || !line.trim())) {
        fail(label, "unit.howToUse must be a non-empty array of non-empty strings");
      } else {
        lines.forEach((line, i) => {
          learnerChars += line.length;
          if (MOJIBAKE.test(line)) fail(label, `unit.howToUse[${i}] has mojibake`);
          if (PLACEHOLDER.test(line)) fail(label, `unit.howToUse[${i}] still has placeholder text`);
          const adultHit = line.match(ADULT_ADDRESSED);
          if (adultHit) fail(label, `unit.howToUse[${i}] is written to an adult (${JSON.stringify(adultHit[0])}) but the learner reads it`);
        });
      }
    }

    // ── the renderer's own field expectations ───────────────────────────────
    // `section` groups the comprehension subtabs. Missing, the group renders as
    // one empty-labelled tab. A note rather than a failure: the values are a
    // curriculum vocabulary ("Evidence and inference"), not something a tool
    // can derive — Grade 6 Unit 2 carries `skillFocus` instead, at a finer
    // grain that maps onto no band cleanly.
    for (const item of unit.comprehension || []) {
      if (!item.section) missingSection += 1;
    }

    // ── quizzes mark themselves, so the key must be markable ────────────────
    for (const question of unit.quizzes || []) {
      questionCount += 1;
      checkKey(label, `quiz ${question.questionId}`, question);
    }

    // ── live audio must exist on disk ───────────────────────────────────────
    // available:true is a promise that the app will find a file. A descriptor
    // that resolves proves nothing on its own — the point is the mp3.
    walkAudio(unit, (descriptor, where) => {
      if (descriptor.available !== true) return;
      const source = descriptor.source || descriptor.normal;
      if (!source) { fail(label, `${where} is available:true with no source`); return; }
      const resolved = resolveAsset(source, gradeDir);
      if (resolved && !fs.existsSync(resolved)) fail(label, `${where} is available:true but ${source} is not on disk`);
    });

    // Census, reported not enforced.
    walkReviewStatus(unit, (status) => {
      if (/pending|needs re-review|auto-generated|ai-generated|rebuild/i.test(status)) {
        unsigned.set(status, (unsigned.get(status) || 0) + 1);
      }
    });
    const image = unit.visual?.image;
    if (image) {
      if (!bannerImages.has(image)) bannerImages.set(image, []);
      bannerImages.get(image).push(label);
    }
  }

  // ── the two course-level assessments ────────────────────────────────────
  for (const name of ["course-final-quiz.json", "placement-exam.json"]) {
    const file = path.join(dataDir, name);
    if (!fs.existsSync(file)) { fail(gradeDir, `no ${name}`); continue; }
    const paper = readJson(file);
    const questions = paper.questions || [];
    const seen = new Set();
    if (paper.questionCount !== undefined && paper.questionCount !== questions.length) {
      fail(`${gradeDir}/${name}`, `questionCount ${paper.questionCount} != ${questions.length} questions`);
    }
    const marks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    if (paper.totalMarks !== undefined && paper.totalMarks !== marks) {
      fail(`${gradeDir}/${name}`, `totalMarks ${paper.totalMarks} != ${marks} summed from the questions`);
    }
    for (const question of questions) {
      const id = question.questionId || question.id;
      if (seen.has(id)) fail(`${gradeDir}/${name}`, `duplicate question id ${id}`);
      seen.add(id);
      checkKey(`${gradeDir}/${name}`, id, question);
    }
  }
}

function walkAudio(value, visit, where = "") {
  if (Array.isArray(value)) { value.forEach((item, index) => walkAudio(item, visit, `${where}[${index}]`)); return; }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (item && typeof item === "object" && !Array.isArray(item) && ("available" in item) && ("source" in item || "normal" in item)) {
      visit(item, `${where}.${key}`);
    } else {
      walkAudio(item, visit, `${where}.${key}`);
    }
  }
}

function walkReviewStatus(value, visit) {
  if (Array.isArray(value)) { value.forEach((item) => walkReviewStatus(item, visit)); return; }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (key === "reviewStatus" && typeof item === "string") visit(item);
    else walkReviewStatus(item, visit);
  }
}

console.log(
  `english content: ${unitCount} units across ${grades.length} grades, `
  + `${questionCount} unit quiz questions, ${learnerChars.toLocaleString()} chars of learner-facing text`
);

if (missingSection) {
  note(`${missingSection} comprehension question(s) carry no \`section\`, so the subtab that groups them renders unlabelled `
    + "— the values are a curriculum vocabulary, so they need a human rather than a default");
}
if (displayPhonemes) {
  note(`${displayPhonemes} learner-facing string(s) print phoneme notation (/a/, /m/) on screen without narrating it `
    + "— silent, so not a build failure, but it is teacher notation in front of a child");
}
const reused = [...bannerImages.entries()].filter(([, units]) => units.length > 1);
if (reused.length) {
  const worst = reused.sort((a, b) => b[1].length - a[1].length)[0];
  note(`${bannerImages.size} distinct unit banner images cover ${unitCount} units; the most reused (${worst[0]}) `
    + `appears in ${worst[1].length} units including ${worst[1].slice(0, 2).join(", ")}`);
}
if (unsigned.size) {
  const total = [...unsigned.values()].reduce((a, b) => a + b, 0);
  note(`${total} item(s) are not signed off by a curriculum reviewer, by status: `
    + [...unsigned.entries()].sort((a, b) => b[1] - a[1]).map(([status, n]) => `${n} ${JSON.stringify(status)}`).join(", "));
}

if (notes.length) {
  console.log("\nNotes (need a human eye, not a build failure):");
  for (const message of notes) console.log(`   note  ${message}`);
}

// ── the baseline ────────────────────────────────────────────────────────────
// The ceiling the "may only shrink" rule needs to actually be a rule. Without
// it the promise was documentation: a fresh failure fails the build, and a
// stale entry fails too, but --write-baseline regenerates the file wholesale
// with no limit, so absorbing a new defect was one command away. The list went
// 16 -> 25 -> 40 across three commits that way; some of that was the gate being
// widened, and nine of it was new instances of a check that already existed.
//
// Raising this is legitimate exactly once per reason: when the gate itself gets
// a NEW check and the pre-existing failures it finds have to be recorded before
// the build can go green. Raise it in the same commit that widens the gate, and
// say which check did it. Lowering it needs no ceremony — that is the direction
// this number is supposed to travel.
const MAXIMUM_KNOWN_FAILURES = 40;
const baselinePath = path.join(root, "data", "content-gate-baseline.json");
if (process.argv.includes("--write-baseline")) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify({
    note: "Failures known when check-english-content.mjs was written. This list may only shrink: "
      + "a new failure fails the build, and an entry that no longer fires fails too, asking to be removed. "
      + "Regenerate with: node tools/check-english-content.mjs --write-baseline",
    recordedOn: "2026-08-11",
    knownFailures: [...failures].sort(),
  }, null, 2)}\n`, "utf8");
  console.log(`\nwrote baseline: ${failures.length} known failure(s)`);
  process.exit(0);
}

const baseline = fs.existsSync(baselinePath) ? new Set(readJson(baselinePath).knownFailures || []) : new Set();
const fresh = failures.filter((message) => !baseline.has(message));
const fixed = [...baseline].filter((message) => !failures.includes(message));

if (baseline.size) {
  console.log(`\nKnown failures held in the baseline: ${baseline.size - fixed.length} still firing, ${fixed.length} now fixed.`);
}

if (fixed.length) {
  console.log(`\n✗ ${fixed.length} baseline entr(y/ies) no longer fire — delete them so the list keeps shrinking:`);
  for (const message of fixed) console.log(`   GONE  ${message}`);
}
if (fresh.length) {
  console.log(`\n✗ ${fresh.length} new english content failure(s):`);
  for (const message of fresh) console.log(`   FAIL  ${message}`);
}
// Checked against the committed file, not against `failures`, so it catches a
// baseline that was regenerated to swallow something as well as one edited by
// hand. Running --write-baseline does not silence this: the next run reads the
// bigger file and fails.
let overCeiling = false;
if (baseline.size > MAXIMUM_KNOWN_FAILURES) {
  overCeiling = true;
  console.log(`\n✗ the baseline holds ${baseline.size} known failures, above the ceiling of ${MAXIMUM_KNOWN_FAILURES}.`);
  console.log("   This list may only shrink. If you widened the gate and the new check found");
  console.log("   pre-existing defects, raise MAXIMUM_KNOWN_FAILURES in the same commit and name");
  console.log("   the check. Otherwise fix the failure rather than recording it.");
}
if (fresh.length || fixed.length || overCeiling) process.exit(1);

console.log(`\n✓ all english content checks pass${baseline.size ? ` (${baseline.size} known failure(s) still held in the baseline)` : ""}`);
