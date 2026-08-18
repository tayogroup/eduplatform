#!/usr/bin/env node
// Authors a Teacher & Parent Guide for Grades 2-4, where -- unlike Grade 1 --
// no such document exists in source to convert. Grades 2-4 ship as
// Lesson/Story/Vocabulary/Grammar only, already addressed to the learner, so
// this is new content, not extraction. Every fact in it is pulled from the
// unit's own data (outcomes, vocabularyGroups, grammar, readings, activities)
// -- nothing is invented -- and only the connective/pedagogical framing
// (the three front callouts, the step-by-step shape) is templated, the same
// way Grade 1's OWN source guides turned out to reuse near-identical
// boilerplate across units with light per-unit substitution (verified by
// diffing Grade 1's built guides before writing this).
//
// Deliberately NOT a "you" -> "your child" transform of unitOverview: that
// exact mechanical rewrite is what produced broken sentences ("you and you
// will explore") when Global Perspectives tried it on its own parent guides,
// and Grade 1's builder (build-ehel-grade1-shared-course.js) carries the same
// warning. The intro here is built fresh from the outcomes list instead.
//
// Idempotent, splices via raw text (see spliceGuide) so it can only ever add
// lines to a unit file, never reformat one.
// Usage: node tools/build-ehel-english-grownup-guides.js [--dry] [grade...]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");
const gradeArgs = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number);
const GRADES = gradeArgs.length ? gradeArgs : [2, 3, 4];

const AGE_BAND = { 2: "6-7", 3: "7-8", 4: "8-9" };

function unitFile(grade, unitNo) {
  return path.join(ENGLISH, `grade-${grade}`, "data", "units", `unit-${unitNo}.json`);
}

function listUnitNumbers(grade) {
  const dir = path.join(ENGLISH, `grade-${grade}`, "data", "units");
  return fs.readdirSync(dir)
    .map((f) => f.match(/^unit-(\d+)\.json$/))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

// -------------------- fact extraction (all real, from the unit itself) -----

function wordsForGroup(unit, group) {
  const byId = new Map(unit.dictionaryLinks.map((d) => [d.vocabularyId, d.masterWord]));
  return group.vocabularyIds.map((id) => byId.get(id)).filter(Boolean);
}

function vocabularyItems(unit) {
  return (unit.vocabularyGroups || []).map((group) => {
    const words = wordsForGroup(unit, group);
    return words.length ? `${group.title}: ${words.join(" · ")}` : null;
  }).filter(Boolean);
}

// ruleAndExamples mixes several shapes in one field -- checked against every
// grammar entry in Grades 2-4 Unit 1-3 before settling on this: a bare rule
// statement ("Use like with I, you, we and they."), notation ("Can + subject
// + base verb?", "I / you / we / they have got"), a "rule: example" or
// "template? becomes filled-in?" line, an Ask:/Answer:/Report: dialogue, and
// plain examples with no label. Grammar found first-line extraction wasn't
// enough: several entries bury the real example after rule prose on the SAME
// line ("No subject — we do not say "you". Not "You clean your room", just
// "Clean your room.""), where the curly-quoted segment is reliably the
// example and everything around it is the teaching note. So a quoted segment
// -- the LAST one, since a line sometimes contrasts a wrong form before the
// right one -- always wins over the raw line.
const OPEN_QUOTE = String.fromCharCode(8220), CLOSE_QUOTE = String.fromCharCode(8221);
const QUOTED_RE = new RegExp(`[${OPEN_QUOTE}"]([^${OPEN_QUOTE}${CLOSE_QUOTE}"]+)[${CLOSE_QUOTE}"]`, "g");

function extractExample(line) {
  let candidate = line.trim();
  const becomes = candidate.indexOf(" becomes ");
  if (becomes >= 0) candidate = candidate.slice(becomes + " becomes ".length).trim();
  const quoted = [...candidate.matchAll(QUOTED_RE)].map((m) => m[1].trim());
  if (quoted.length) return quoted[quoted.length - 1];
  const colon = candidate.lastIndexOf(": ");
  if (colon >= 0) candidate = candidate.slice(colon + 2).trim();
  return candidate;
}

// A colon-prefixed label ("Imperative: start with the base verb…", "Present
// Simple: Start with the subject: I, you, he…") extracts the text AFTER the
// label, which is grammar notation or a word list, not a sentence -- and
// unlike a real quoted example it starts lowercase or is a comma list rather
// than a sentence with a verb. Requiring a capital start and rejecting the
// comma-list shape (checked against Present Simple's own "I, you, he, she,
// it, we, they." opening line) catches what the word-count/punctuation
// checks alone let through.
const COMMA_LIST = /^([A-Za-z]+,\s*){2,}[a-z]+\.$/;
function isCleanSentence(value) {
  return Boolean(value)
    && value.split(/\s+/).length >= 3
    && !/^(use|ask|answer|report)\b/i.test(value)
    && !/[+/→]/.test(value)
    && !COMMA_LIST.test(value)
    && /[.?!]$/.test(value)
    && /^[A-Z]/.test(value);
}

// One clean example per grammar entry (the first line that qualifies), so an
// entry contributes at most once and the list stays a spread across this
// unit's grammar concepts rather than several lines from a single rule.
function sentencePatterns(unit) {
  const out = [];
  for (const g of unit.grammar || []) {
    const lines = (g.ruleAndExamples || "").split("\n").map((l) => l.trim()).filter(Boolean);
    const found = lines.map(extractExample).find((c) => isCleanSentence(c) && !out.includes(c));
    if (found) out.push(found);
  }
  return out.slice(0, 8);
}

function storyReading(unit) {
  return (unit.readings || []).find((r) => /story/i.test(r.type)) || (unit.readings || [])[0];
}

function listeningReadings(unit) {
  return (unit.readings || []).filter((r) => /song|poem|listening/i.test(r.type) && r !== storyReading(unit));
}

// -------------------- templated (pedagogical framing, not fact) ------------

function frontCallouts(unit, grade) {
  const words = (unit.vocabularyGroups || []).flatMap((g) => wordsForGroup(unit, g));
  const sampleWord = words[0] || "the first new word";
  const age = AGE_BAND[grade] || "6-9";
  return [
    {
      title: "🧭 About this unit (please read first)",
      body: [
        `Your child is about ${age} years old and is building on English they already know. So YOU lead this unit alongside them — a teacher in class or a parent at home.`,
        "Work in short, regular sessions rather than one long one. Reading together, saying words out loud, and playing with the grammar patterns matter more than getting every answer right first time.",
        "This guide tells you what the unit covers and how to go through it together. The learner's own pages (Reading & story, Grammar, Activities) are what your child works through on screen.",
      ].join("\n\n"),
    },
    {
      title: "💬 Using the AI Tutor with your child",
      body: [
        "The AI Tutor is there for extra practice and conversation — a grown-up should still be nearby, especially the first few times.",
        `Ask the tutor to say a word slowly so your child can copy it: "Please say the word '${sampleWord}' slowly."`,
        "Ask it to make up a short question using this unit's words, or to listen to your child's sentence and say if it sounds right.",
        "Ask it for one more practice question if your child wants to keep going after the unit is finished.",
      ].join("\n\n"),
    },
    {
      title: "🌟 Tips for teaching this unit",
      body: [
        "Keep sessions short and positive. Stop while it is still enjoyable, not after it has become a chore.",
        "Say new words and example sentences out loud yourselves — hearing English spoken, not just reading it, is what builds confidence.",
        "Let your child make mistakes without worrying. Gently model the correct version rather than correcting every slip.",
        "Praise effort and progress, not just correct answers — confidence carries a learner further than perfect grammar at this stage.",
      ].join("\n\n"),
    },
  ];
}

function howToTeachSection(unit) {
  const groupTitles = (unit.vocabularyGroups || []).map((g) => g.title);
  const groupList = groupTitles.length ? groupTitles.join(", ") : "this unit's new words";
  const firstGrammar = (unit.grammar || [])[0];
  const story = storyReading(unit);
  const listening = listeningReadings(unit)[0];
  const firstActivity = (unit.activities || [])[0];

  const steps = [
    ["1. Warm-up (2-3 min)", "Say hello in English together and ask what your child remembers from the last unit."],
    ["2. Learn the words (5-10 min)", `Go through ${groupList}, a few words at a time. Say each word, then have your child repeat it and use it in a short sentence.`],
    firstGrammar ? ["3. Grammar and practice (5-10 min)", `Look at "${firstGrammar.title}" together and try a few lines of its practice out loud.`] : null,
    story ? ["4. Story and listening time (5 min)", `Read or listen to "${story.title}" together${listening ? `, and enjoy "${listening.title}" too` : ""}.`] : null,
    firstActivity ? ["5. Activity time (5-10 min)", `Sit with your child and do "${firstActivity.title}" together, reading each instruction aloud for them if needed.`] : null,
    ["6. Wrap-up (2 min)", "Ask what they learned today and celebrate with a “Well done!”"],
  ].filter(Boolean);

  const body = ["Repeat this simple shape over one or two short sessions:", ...steps.map(([h, b]) => `${h}\n${b}`)].join("\n\n");
  return { title: "How to Teach This Unit, Step by Step", body };
}

function readingsSection(unit) {
  const story = storyReading(unit);
  const others = (unit.readings || []).filter((r) => r !== story);
  const items = [
    story ? `The Story — "${story.title}"` : null,
    ...others.map((r) => `${r.type} — "${r.title}"`),
  ].filter(Boolean);
  return { title: "This Unit's Story and Listening", items };
}

function buildGuide(unit, grade) {
  const outcomes = (unit.outcomes || []).map((o) => o.learningOutcome).filter(Boolean);
  // Outcomes are written as instructions TO the learner ("Say and spell
  // YOUR name…"), so folding them into a sentence addressed to the parent
  // ("your child will learn to say and spell your name") makes "your"
  // ambiguous between the child's name and the reader's own -- the same
  // you/your-child clash Global Perspectives hit converting its own parent
  // guides. The list below keeps the outcomes verbatim, which a bulleted
  // "here is what the lesson instructs" reads fine; this intro stays
  // generic instead of trying to merge them into prose.
  const intro = `In this unit, your child works through "${unit.unit.unitTitle}" — new words, a grammar focus, and a story. See exactly what they will practise below.`;

  // Deduped: a unit whose evidenceOfLearning repeats the same generic line
  // across every outcome would otherwise show that line several times over.
  const checkItems = [...new Set((unit.outcomes || []).map((o) => o.evidenceOfLearning).filter(Boolean))];

  const sections = [
    ...frontCallouts(unit, grade),
    { title: "What Your Child Will Be Able to Do", items: outcomes },
    { title: "Words We Will Learn", items: vocabularyItems(unit) },
    readingsSection(unit),
    howToTeachSection(unit),
    { title: "Sentence Patterns to Say Out Loud", items: sentencePatterns(unit) },
    { title: "Simple Check — What to Look For", body: "You do not need a test. Just watch for these as you go through the unit together:", items: checkItems },
  ].filter(Boolean).filter((s) => (s.items?.length ?? 1) > 0 || s.body);

  return normalizeWhitespace({ label: "Teacher & Parent Guide", intro, sections });
}

// validate-unit.mjs's mechanics check hard-fails on any run of 2+ mid-line
// spaces, and outcome/reading text pulled from the unit isn't guaranteed
// free of that (own authoring quirks, not this generator's). Collapsing
// everything the guide touches, not just the templated strings, means a
// source string with its own stray double space can't reopen this the way
// the emoji-title double-space did in Grade 1's builder.
function normalizeWhitespace(value) {
  if (typeof value === "string") return value.replace(/[ \t]{2,}/g, " ");
  if (Array.isArray(value)) return value.map(normalizeWhitespace);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizeWhitespace(v);
    return out;
  }
  return value;
}

// -------------------- splice (same safe technique as Grade 1's builder) ----

function spliceGuide(raw, guide) {
  const eol = raw.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const indentMatch = raw.match(/\r?\n( +)"/);
  const indentUnit = indentMatch ? indentMatch[1].length : 2;
  const pad = " ".repeat(indentUnit);

  const trailingWs = raw.match(/\s*$/)[0];
  const body = raw.slice(0, raw.length - trailingWs.length);
  if (!body.endsWith("}")) throw new Error("file does not end with a closing brace");
  const beforeFinalBrace = body.slice(0, -1).replace(/[ \t\r\n]+$/, "");

  let base = beforeFinalBrace;
  if (/\n {2}"grownUpGuide":/.test(raw)) {
    const keyStart = raw.indexOf(`${eol}${pad}"grownUpGuide":`);
    let depth = 0;
    let i = raw.indexOf("{", keyStart);
    for (; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      else if (raw[i] === "}") { depth--; if (depth === 0) { i++; break; } }
    }
    const rebuiltBody = raw.slice(0, keyStart).replace(/,\s*$/, "") + raw.slice(i);
    const rebuiltTrailing = rebuiltBody.match(/\s*$/)[0];
    base = rebuiltBody.slice(0, rebuiltBody.length - rebuiltTrailing.length).slice(0, -1).replace(/[ \t\r\n]+$/, "");
  }

  const guideBlock = JSON.stringify(guide, null, indentUnit)
    .split("\n")
    .map((line, idx) => (idx === 0 ? line : pad + line))
    .join(eol);
  return `${base},${eol}${pad}"grownUpGuide": ${guideBlock}${eol}}${trailingWs}`;
}

// -------------------------------- main --------------------------------------

let changed = 0;
const failures = [];
for (const grade of GRADES) {
  for (const unitNo of listUnitNumbers(grade)) {
    const file = unitFile(grade, unitNo);
    const raw = fs.readFileSync(file, "utf8");
    const unit = JSON.parse(raw);
    let guide;
    try {
      guide = buildGuide(unit, grade);
      if (!guide.sections.length) throw new Error("no sections produced");
    } catch (error) {
      failures.push(`grade-${grade}/unit-${unitNo}: ${error.message}`);
      continue;
    }
    if (JSON.stringify(unit.grownUpGuide || null) === JSON.stringify(guide)) {
      console.log(`grade-${grade}/unit-${unitNo}: unchanged`);
      continue;
    }
    changed += 1;
    console.log(`grade-${grade}/unit-${unitNo}: grownUpGuide written (${guide.sections.length} sections)`);
    if (!DRY) {
      const next = spliceGuide(raw, guide);
      const reparsed = JSON.parse(next);
      if (JSON.stringify(reparsed.grownUpGuide) !== JSON.stringify(guide)) {
        throw new Error(`grade-${grade}/unit-${unitNo}: spliced output failed round-trip verification`);
      }
      fs.writeFileSync(file, next, "utf8");
    }
  }
}
console.log(JSON.stringify({ dry: DRY, grades: GRADES, unitsChanged: changed, failures: failures.length }));
for (const f of failures) console.error("FAIL " + f);
if (failures.length) process.exit(1);
