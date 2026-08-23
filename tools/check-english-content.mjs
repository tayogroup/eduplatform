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

// ── the taught vocabulary, and the glossary that is not it ──────────────────
// english.js completes the Vocabulary section on the words a unit TEACHES, and
// identifies them by excluding one group title (english.js ::
// STORY_GLOSSARY_GROUP). Vocabulary sits in front of Reading in SECTION_CHAIN,
// so this one string decides how many words a learner must mark before the app
// lets them read the story — 31 at Grade 8 Unit 1 with the rule holding, 423
// without it.
//
// A title match is a wording check, and this file's own rule is that a check
// keyed on wording can only find what has already gone wrong once. So it is
// paired with a STRUCTURAL half that needs no vocabulary of its own: a unit's
// last group must not be a large majority of its list. That is what a glossary
// looks like whatever it is called, and it is the shape that turns the gate
// back into a 400-word wall — which is exactly what a rename would do, in
// silence, because the title rule would simply stop matching and every check
// here would still pass.
const STORY_GLOSSARY_GROUP = "Words from our stories";
// Above this the taught set is no longer a week's work and the unit Study Plan,
// which schedules all of it on Day 1 of Week 1, is describing something nobody
// can do. Today's worst unit is Grade 2 Unit 1 at 70. A ceiling that may not
// rise, in the spirit of the coverage floors elsewhere in this repo.
const TAUGHT_WORDS_CEILING = 80;
// The structural half. Both conditions must hold to fail: the majority share on
// its own flags Grade 6 Unit 10, a legitimate 30-word single-group review unit
// whose one group is 100% of the list and is entirely taught. The absolute size
// is what separates "small unit with one group" from "glossary under a new
// name" — a glossary is never small, because it is a gloss of whole passages.
const GLOSSARY_SHAPE_SHARE = 0.5;
const GLOSSARY_SHAPE_WORDS = 80;

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
let taughtVocabulary = 0;
let glossaryVocabulary = 0;
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

    // ── the words Vocabulary actually asks for ──────────────────────────────
    const groups = unit.vocabularyGroups || [];
    const sizeOf = (group) => group.vocabularyIds?.length || 0;
    const unitWords = groups.reduce((sum, group) => sum + sizeOf(group), 0);
    const taught = groups.filter((group) => group.title !== STORY_GLOSSARY_GROUP);
    const taughtWords = taught.reduce((sum, group) => sum + sizeOf(group), 0);
    taughtVocabulary += taughtWords;
    glossaryVocabulary += unitWords - taughtWords;
    if (!groups.length) {
      fail(label, "no vocabularyGroups — Vocabulary has nothing to complete on and it gates Reading");
    } else if (!taught.length) {
      // english.js falls back to the whole list here, so the unit still gates
      // rather than opening on sight — but it gates on the glossary, which is
      // the wall this rule exists to remove.
      fail(label, `every vocabularyGroup is "${STORY_GLOSSARY_GROUP}" — the taught set is empty and Vocabulary falls back to gating on all ${unitWords} words`);
    } else if (taughtWords > TAUGHT_WORDS_CEILING) {
      fail(label, `${taughtWords} taught words (ceiling ${TAUGHT_WORDS_CEILING}) — Vocabulary gates Reading on all of them and the unit Study Plan schedules them in one week`);
    }
    // The structural half, which knows no titles: a big trailing group that is
    // most of the unit IS a story glossary, whatever it has been renamed to.
    const last = groups[groups.length - 1];
    if (last && last.title !== STORY_GLOSSARY_GROUP
      && sizeOf(last) >= GLOSSARY_SHAPE_WORDS && sizeOf(last) >= GLOSSARY_SHAPE_SHARE * unitWords) {
      fail(label, `last vocabularyGroup ${JSON.stringify(last.title)} holds ${sizeOf(last)} of ${unitWords} words — that is a story glossary under another name, and Vocabulary is counting it as taught`);
    }

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

  // ── the vocabulary practice-sentence word glossary ──────────────────────
  const glossaryFile = path.join(dataDir, "sentence-glossary.json");
  if (fs.existsSync(glossaryFile)) {
    const glossary = readJson(glossaryFile);
    walkAudio(glossary.entries || {}, (descriptor, where) => {
      if (descriptor.available !== true) return;
      const source = descriptor.source || descriptor.normal;
      if (!source) { fail(`${gradeDir}/sentence-glossary.json`, `${where} is available:true with no source`); return; }
      const resolved = resolveAsset(source, gradeDir);
      if (resolved && !fs.existsSync(resolved)) fail(`${gradeDir}/sentence-glossary.json`, `${where} is available:true but ${source} is not on disk`);
    });
  }
}

// ── the printable worksheet's answer-key filter ─────────────────────────────
// The cursive worksheet prints a unit's grammar exercises with lines to write on,
// and 149 of the 1,047 practice pieces carry the ANSWER KEY. Printed under the
// questions those are the answers, on the learner's own page. english.js cuts each
// piece at the key marker; this is the check that it still does.
//
// It exists because the FIRST version of that filter was anchored with ^, which
// matched the 45 pieces that START with a key and missed the 104 that append one to
// the last question — "5. ______ is your teacher? Check yourself: 1. Who 2. What…".
// Those printed. Nothing said so: the sheet rendered, the page count was exact,
// every other check passed. A filter that silently stops matching is
// indistinguishable from a filter with nothing to do, which is the failure this
// whole file exists for.
//
// THE PATTERN IS READ OUT OF english.js, never copied. A copy is a second thing to
// keep in step, and the copy is always the one that goes stale — the same reason
// check-ehel-audio-coverage.mjs reads its templates out of the generator source.
// If it cannot be found, that is a failure and not a skip: a gate that quietly
// checks nothing is worse than no gate.
function checkWorksheetAnswerKeys() {
  const label = "worksheet grammar";
  const source = path.join(here, "..", "src", "prototypes", "ehel-academy", "shell", "subjects", "english.js");
  if (!fs.existsSync(source)) { fail(label, "shell/subjects/english.js not found — cannot check the answer-key filter"); return; }
  const text = fs.readFileSync(source, "utf8");
  const declared = text.match(/const GRAMMAR_ANSWER_KEY = \/(.+)\/([a-z]*);/);
  if (!declared) { fail(label, "GRAMMAR_ANSWER_KEY is not declared in english.js — the filter it checks has moved or gone"); return; }
  let marker;
  try { marker = new RegExp(declared[1], declared[2]); }
  catch (error) { fail(label, `GRAMMAR_ANSWER_KEY does not compile: ${error.message}`); return; }

  const split = (practice) => String(practice || "").split(/\n|\|/).map((part) => part.trim()).filter(Boolean);
  const strip = (piece) => { const hit = piece.match(marker); return hit ? piece.slice(0, hit.index).trim() : piece; };

  // An INDEPENDENT detector, deliberately not keyed on the wording: a dense run of
  // numbered short answers is an answer key whatever it calls itself. This is the
  // half that can catch a NEW wording — the floor below cannot, because the
  // existing matches keep matching and the count never drops.
  //
  // It earned its place immediately. It found "Answer key, Part A: 1. visited, 2.
  // gave…" and "Answers, Part B: 1. Wash 2. Put away", where a comma and a part
  // label sit between the words and the answers, so the pattern's colon never
  // matched and three of them were printing at Grade 4.
  // Keyed on the numbering, not the words. Keying it on the wording instead was
  // tried and is useless: "then check yourself against the answers" and "Check your
  // answers before you finish" are ordinary instructions, and four of the five
  // things it flagged were those rather than leaks.
  //
  // It is only meaningful for the grades the worksheet PRINTS. Above Grade 4 the
  // same shape is the numbered exercise list itself, so it is not evaluated there —
  // an honest nothing rather than a number that looks like 183 leaks and is not.
  const looksLikeAnswerRun = (text) => (text.match(/\b\(?\d+[.)]\s*[A-Za-z'’“-]/g) || []).length >= 3;

  let pieces = 0;
  let carried = 0;
  let survived = 0;
  let runsInPrinted = 0;
  for (const gradeDir of grades) {
    const unitsDir = path.join(root, gradeDir, "data", "units");
    if (!fs.existsSync(unitsDir)) continue;
    for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json"))) {
      const unit = readJson(path.join(unitsDir, file));
      for (const item of unit.grammar || []) {
        for (const piece of split(item.practice)) {
          pieces += 1;
          if (marker.test(piece)) carried += 1;
          const kept = strip(piece);
          // The one thing that must never be true: a piece that reaches the sheet
          // still carrying the answers.
          if (kept && marker.test(kept)) {
            survived += 1;
            if (survived <= 5) fail(label, `${gradeDir}/${file} prints an answer key: ${JSON.stringify(kept.slice(0, 90))}`);
          }
          // The worksheet prints Grades 1-4 only (BOTH_DESIGNS). A surviving answer
          // run there reaches a learner and is a failure; above it, nothing prints
          // yet, so it is reported as the work waiting if the sheet is extended.
          if (kept && Number(gradeDir.slice(6)) <= 4 && looksLikeAnswerRun(kept)) {
            runsInPrinted += 1;
            if (runsInPrinted <= 5) fail(label, `${gradeDir}/${file} prints what reads as an answer run the filter did not catch: ${JSON.stringify(kept.slice(0, 90))}`);
          }
        }
      }
    }
  }
  if (survived > 5) fail(label, `${survived - 5} further answer key(s) reach the printed sheet`);
  // A count that cannot fall quietly. If a new wording is authored and the pattern
  // stops matching it, `carried` drops and this fires — otherwise a filter with
  // nothing to do and a filter that has stopped working look identical.
  //
  // Counted across ALL EIGHT grades even though the worksheet only prints Grades
  // 1-4 (149 of the 1,047 pieces there). The extra cost is nothing and it means the
  // day someone extends the sheet upward, the filter has already been under watch
  // rather than meeting 1,300 unchecked pieces for the first time.
  const FLOOR = 403;
  if (carried < FLOOR) {
    fail(label, `only ${carried} practice pieces match GRAMMAR_ANSWER_KEY, was ${FLOOR} — either keys were removed from the content, or a new wording is not being matched and is printing. Check which before lowering this floor.`);
  }
  if (runsInPrinted > 5) fail(label, `${runsInPrinted - 5} further answer run(s) reach the printed sheet`);
  // "Cut from the questions", not "not printed". The sheet has an optional Answer
  // key section that prints these deliberately, on its own pages at the back, for
  // whoever marks the work. What this gate guarantees is narrower and is the thing
  // that matters: no key reaches a QUESTION. Saying "never printed" would be a
  // comforting sentence that stopped being true the day that option was added.
  note(`worksheet grammar: ${carried} of ${pieces} practice pieces carry an answer key across all eight grades; every one cut away from its question (the optional Answer key section prints them separately at the back)`);
  note("worksheet grammar: answer runs are only checked at Grades 1-4, the grades the sheet prints — above that the same shape is the exercise list itself, so extending the sheet upward needs this detector recalibrated first");
}

// The comprehension half of the same page, and it fails DIFFERENTLY from the
// grammar half above, which is why it is a second function rather than a wider
// version of the first.
//
// A comprehension answer is its own field — correctAnswer, beside the question,
// never inside it — so there is no string to parse and no wording that can drift.
// Nothing here can leak by mis-parsing. The only way a mark scheme reaches a
// learner is if the CODE puts it there, so that is what is checked: the builder
// that draws the questions must not so much as mention the answer.
//
// It also holds the line the sheet draws at Grade 1, on the same evidence the
// grammar filter does. All 132 of Grade 1's comprehension questions are oral —
// "Point to the picture and say the word" — and a narrowed filter would print
// those above ruled lines, telling a child to write down something the course
// asks them to say. That defect is invisible to every other check here.
function checkWorksheetComprehension() {
  const label = "worksheet comprehension";
  const source = path.join(here, "..", "src", "prototypes", "ehel-academy", "shell", "subjects", "english.js");
  if (!fs.existsSync(source)) { fail(label, "shell/subjects/english.js not found — cannot check the comprehension section"); return; }
  const text = fs.readFileSync(source, "utf8");

  const declared = text.match(/const COMPREHENSION_ORAL_TYPES = \/(.+)\/([a-z]*);/);
  if (!declared) { fail(label, "COMPREHENSION_ORAL_TYPES is not declared in english.js — the filter that keeps oral work off the sheet has moved or gone"); return; }
  let oral;
  try { oral = new RegExp(declared[1], declared[2]); }
  catch (error) { fail(label, `COMPREHENSION_ORAL_TYPES does not compile: ${error.message}`); return; }

  // The learner-facing builder, read as source. Asserting on the FUNCTION BODY
  // rather than on the file: english.js legitimately mentions correctAnswer in
  // several places (the on-screen comprehension page reveals it on request), so a
  // whole-file search would be permanently red and would have to be ignored.
  const builder = text.match(/function worksheetComprehensionHtml\([^)]*\) \{[\s\S]*?\n\}/);
  if (!builder) { fail(label, "worksheetComprehensionHtml is not declared in english.js — the printed comprehension section has moved or gone"); return; }
  if (/\bcorrectAnswer\b|\.answer\b|\banswer:/.test(builder[0])) {
    fail(label, "worksheetComprehensionHtml references the answer — a mark scheme belongs in worksheetAnswerKeyHtml, at the back, not beside the question a learner is about to write on");
  }

  // The questions and the answer key are drawn by two different functions and
  // print the same numbers. They agree only because both READ the number that
  // worksheetComprehension assigned; the moment either derives one from its own
  // loop position, they agree by coincidence — and they did, at first, when both
  // used `order + 1` over their own arrays. That was correct for exactly as long
  // as both iterated identically, which is not a property anything enforces.
  //
  // A drift here is quiet and expensive: the sheet still prints, every number
  // still looks plausible, and the key simply points at the wrong question.
  const keyBuilder = text.match(/function worksheetAnswerKeyHtml\([^)]*\) \{[\s\S]*?\n\}/);
  if (!keyBuilder) { fail(label, "worksheetAnswerKeyHtml is not declared in english.js — the answer key has moved or gone"); return; }
  for (const [name, body] of [["worksheetComprehensionHtml", builder[0]], ["worksheetAnswerKeyHtml", keyBuilder[0]]]) {
    if (!/question\.number/.test(body)) {
      fail(label, `${name} does not print question.number — the questions and the answer key must both read the number assigned once in worksheetComprehension, not each count its own way`);
    }
    // The second parameter of a .map over the questions IS the positional index,
    // and reintroducing it is the whole failure mode above.
    const positional = body.match(/\.questions\.map\(\((?:[^)]*),\s*[A-Za-z_$][\w$]*\)/);
    if (positional) {
      fail(label, `${name} takes a positional index over reading.questions (${JSON.stringify(positional[0])}) — number the questions from question.number so the two halves cannot disagree`);
    }
  }

  let total = 0;
  let written = 0;
  let writtenAtGradeOne = 0;
  let missingAnswer = 0;
  for (const gradeDir of grades) {
    const grade = Number(gradeDir.slice(6));
    if (grade > 4) continue;
    const unitsDir = path.join(root, gradeDir, "data", "units");
    if (!fs.existsSync(unitsDir)) continue;
    for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json"))) {
      const unit = readJson(path.join(unitsDir, file));
      const readings = new Set((unit.readings || []).map((reading) => reading.readingId));
      for (const question of unit.comprehension || []) {
        total += 1;
        if (oral.test(question.questionType || "")) continue;
        written += 1;
        if (grade === 1) {
          writtenAtGradeOne += 1;
          if (writtenAtGradeOne <= 5) fail(label, `${gradeDir}/${file} would print an oral question on the sheet: ${JSON.stringify(String(question.question || "").slice(0, 80))} (${question.questionType})`);
        }
        // A question whose reading is not in its own unit would print with no text
        // above it — an unanswerable page rather than a hard one.
        if (!readings.has(question.readingId)) {
          fail(label, `${gradeDir}/${file} has a comprehension question whose readingId ${JSON.stringify(question.readingId)} is not a reading in this unit, so the sheet would print it with no passage`);
        }
        if (!String(question.correctAnswer || "").trim()) missingAnswer += 1;
      }
    }
  }
  if (writtenAtGradeOne > 5) fail(label, `${writtenAtGradeOne - 5} further oral question(s) would print at Grade 1`);

  // A floor, for the same reason the grammar filter has one: a filter that has
  // stopped matching and a filter with nothing to match look identical from
  // outside. If this drops, either the content lost questions or the oral pattern
  // widened and is silently emptying the section.
  const FLOOR = 426;
  if (written < FLOOR) {
    fail(label, `only ${written} of ${total} comprehension questions survive COMPREHENSION_ORAL_TYPES at Grades 1-4, was ${FLOOR} — either questions were removed, or the oral filter widened and is cutting written work off the sheet. Check which before lowering this floor.`);
  }
  note(`worksheet comprehension: ${written} of ${total} questions at Grades 1-4 are written work and reach the sheet; the other ${total - written} are oral and are all at Grade 1, which prints no comprehension section${missingAnswer ? `. ${missingAnswer} carry no correctAnswer, so the answer key skips them` : ""}`);
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
// Printed, not merely checked. This is the number Vocabulary gates on and the
// number the unit Study Plan schedules, and a drift in the split is the first
// sign the title rule has stopped matching somewhere.
console.log(
  `vocabulary: ${taughtVocabulary.toLocaleString()} taught, `
  + `${glossaryVocabulary.toLocaleString()} story glossary `
  + `(${Math.round((100 * glossaryVocabulary) / Math.max(1, taughtVocabulary + glossaryVocabulary))}% reference, not gated)`
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

// Before the summary, not after it: a check that runs later still records its
// failures but its note is added once the notes have already been printed, so it
// reports nothing and looks like it never ran. That is how this one was first
// wired, and the silence was indistinguishable from a clean pass.
checkWorksheetAnswerKeys();
checkWorksheetComprehension();

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
