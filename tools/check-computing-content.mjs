// Acceptance gate for the Ehel Academy Computing runtime packages.
//
// These courses are used without a teacher, so the checks below are the ones
// that decide whether a learner alone can actually follow a unit:
//   - explainers are complete (never clipped mid-sentence) and long enough to teach
//   - nothing on screen is addressed to a supervising adult instead of the learner
//   - no unit module is a copy of another unit's module
//   - quizzes are answerable (distinct options, answer among them)
//   - every unit carries the sections the app renders unconditionally
//
// Stages 1-4 are built from Teacher & Parent Guides, so the adult-voice checks
// carry most of the weight there: that conversion is the one place this subject
// can silently ship prose written for somebody who is not in the room.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const computingRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "computing");

const MIN_EXPLANATION = 240;   // shorter than this cannot teach a concept unaided
const MAX_PARAGRAPHS = 40;     // longer means a concept absorbed a neighbouring section

// Text written to whoever is sitting with the learner, not to the learner.
const ADULT_ADDRESSED = /\byour child\b|\bthe child (?:draws|writes|circles|points|taps|is|will|looks|gets)\b|\blet (?:the|your) child\b|\bthe children (?:learn|will|are|have)\b|for the grown-?up|a grown-?up reads|you, the grown-?up|in this guide you will|\bteacher (?:guide|tip|answer key)\b|\bprint one per child\b|\bread (?:each|every) (?:task|question|instruction) aloud\b/i;
// Classroom staging a learner working at home cannot act on.
const CLASSROOM_ONLY = /\bon the board\b|\bthe big sheet\b|\bphotocopy\b|\bhand out\b|\bcircle time\b|\bgo round the (?:class|room)\b|\bpicture cards\b/i;
// A teacher-only instruction with no path forward for a learner working alone.
const TEACHER_REQUIRED = /\bhand (?:it )?in to your teacher\b|\bask your teacher to mark\b|\bwait for your teacher\b|\byour teacher will tell you\b|\bshow it to your teacher\b(?!.*\bor\b)/i;
// Third-person prose about the learner that the guide conversion should have
// rewritten ("First, they learn to put the steps in order").
//
// Only meaningful on the Teacher & Parent Guide stages, because that is the
// only place the conversion runs. The student books are written to the learner
// already, and there "they" routinely means somebody else — "a surgeon
// practises on a simulator so no lives are at risk while they learn" is correct
// prose, not a conversion artefact. Applied to those, this reports good writing
// as a defect.
const THIRD_PERSON_LEARNER = /\bthey (?:learn|only need|will learn|already know|are experts)\b/i;

// Modules whose text must differ per unit. A single string repeated across
// every grade means the module reads identically from Stage 1 to Stage 7.
const VARIED_FIELDS = [
  ["explorations", "hint"], ["explorations", "context"], ["explorations", "explanation"],
  ["practice", "hint"], ["fluency", "hint"], ["realProblems", "hint"],
  ["concepts", "explanation"], ["debugging", "fix"],
];
const REPEAT_LIMIT = 0.4;   // no single value may cover more than 40% of items
const repeats = new Map();  // "module.field" -> Map(value -> count)

// Field pairs that must not hold identical text inside one item, or the reveal
// shows the learner something they have already read.
const DISTINCT_PAIRS = [
  ["concepts", "explanation", "example"],
  ["explorations", "context", "explanation"],
  ["explorations", "answer", "explanation"],
  ["methods", "title", "example"],
  ["workedExamples", "title", "prompt"],
  ["realProblems", "answer", "errorFeedback"],
  ["debugging", "cause", "fix"],
];

// Titles that must be unique inside a unit: two cards under one heading read as
// a duplicated module even when their bodies differ.
const UNIQUE_TITLES = ["concepts", "methods", "activities", "codeExamples"];

const failures = [];
const warnings = [];
const fail = (unit, message) => failures.push(`${unit}: ${message}`);
const warn = (unit, message) => warnings.push(`${unit}: ${message}`);

// Metadata is not rendered to the learner: `provenance` records the source
// filenames ("… Teacher Guide.docx") and `transformation` describes what the
// builder did, so scanning them for teacher-voice reports the build's own
// bookkeeping as a content defect.
const METADATA_KEYS = new Set(["provenance", "schemaVersion", "generatedAt", "media", "cambridge"]);

const walk = (value, visit, path = "") => {
  if (typeof value === "string") visit(value, path);
  else if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, `${path}[${index}]`));
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (!path && METADATA_KEYS.has(key)) continue;
      walk(item, visit, path ? `${path}.${key}` : key);
    }
  }
};

const norm = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();

// Cross-unit duplication: the same explainer appearing under two units means a
// unit shipped somebody else's content, which is invisible in a single-unit
// review and obvious to a learner working through the course in order.
const conceptOrigin = new Map();   // normalised explanation -> "grade-N/unit-M · title"

const gradeDirs = fs.readdirSync(computingRoot).filter((name) => /^grade-\d+$/.test(name)).sort();
let unitCount = 0, conceptCount = 0, questionCount = 0, codeLineCount = 0, teachingChars = 0;

for (const gradeDir of gradeDirs) {
  const unitsDir = path.join(computingRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) { fail(gradeDir, "no units directory"); continue; }

  const manifestPath = path.join(computingRoot, gradeDir, "data", "course-manifest.json");
  if (!fs.existsSync(manifestPath)) fail(gradeDir, "no course-manifest.json");

  for (const file of fs.readdirSync(unitsDir).filter((name) => name.endsWith(".json")).sort()) {
    const label = `${gradeDir}/${file}`;
    const unit = JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8"));
    unitCount += 1;

    const overview = String(unit.unit?.unitOverview || "");
    if (overview.length < 140) fail(label, `unit overview is ${overview.length} chars — too thin to orient a learner`);
    if (/…$/.test(overview.trim())) fail(label, "unit overview is clipped mid-sentence");

    const concepts = unit.concepts || [];
    if (concepts.length < 3) fail(label, `only ${concepts.length} concepts`);
    for (const concept of concepts) {
      conceptCount += 1;
      const explanation = String(concept.explanation || "");
      teachingChars += explanation.length + String(concept.example || "").length;
      if (explanation.length < MIN_EXPLANATION) fail(label, `concept "${concept.title}" explanation is ${explanation.length} chars — too thin to teach unaided`);
      if (/…$/.test(explanation.trim())) fail(label, `concept "${concept.title}" explanation is clipped mid-sentence`);
      if (/…$/.test(String(concept.example || "").trim())) fail(label, `concept "${concept.title}" example is clipped mid-sentence`);
      const paragraphs = explanation.split(/\n{2,}/).length;
      if (paragraphs > MAX_PARAGRAPHS) fail(label, `concept "${concept.title}" has ${paragraphs} paragraphs — it likely absorbed the next section`);
      if (!String(concept.title || "").trim()) fail(label, "a concept has no title");

      const key = norm(explanation);
      if (key.length > 120) {
        const seenAt = conceptOrigin.get(key);
        if (seenAt) fail(label, `concept "${concept.title}" repeats the explainer already used by ${seenAt}`);
        else conceptOrigin.set(key, `${label} · ${concept.title}`);
      }
    }

    // Sections the app renders unconditionally; an empty one is a blank screen.
    for (const section of ["outcomes", "practice", "activities", "fluency", "realProblems", "reasoningPrompts",
      "workedExamples", "visualModels", "explorations", "methods", "selfAssessment", "debugging", "esafety"]) {
      if (!Array.isArray(unit[section]) || unit[section].length === 0) fail(label, `section "${section}" is empty — the app renders a blank page`);
    }
    for (const key of ["rules", "terms", "vocabulary", "commonMistakes"]) {
      if (!Array.isArray(unit.reference?.[key]) || unit.reference[key].length === 0) fail(label, `reference.${key} is empty`);
    }

    // The Unit Project is the only section that gates on the learner's own
    // judgement, so it must always state what "finished" means.
    const project = unit.project || {};
    if (!String(project.title || "").trim()) fail(label, "project has no title");
    if (!Array.isArray(project.steps) || project.steps.length < 3) fail(label, `project has ${project.steps?.length || 0} steps — too few to follow alone`);
    if (!Array.isArray(project.successCriteria) || project.successCriteria.length < 3) fail(label, `project has ${project.successCriteria?.length || 0} success criteria`);

    // A debugging card built from a table's own heading row ("Error message /
    // symptom | Cause | Fix") renders as a card that describes nothing.
    for (const bug of unit.debugging || []) {
      const words = String(bug.symptom || "").split(/[\s/|,–—-]+/).filter(Boolean);
      const allHeaderWords = words.length > 0 && words.length <= 5
        && words.every((word) => /^(error|errors|message|symptom|problem|issue|bug|bugs|what|you|see|went|wrong|the|cause|reason|fix|it|how|to|likely|meaning|means|solution|and|or)$/i.test(word));
      if (allHeaderWords) fail(label, `debugging: "${bug.symptom}" is a table heading, not a bug`);
    }

    // Code listings: line breaks must survive, and no listing may be empty.
    for (const example of unit.codeExamples || []) {
      if (!Array.isArray(example.lines) || example.lines.length < 2) fail(label, `code example "${example.title}" has fewer than two lines`);
      codeLineCount += (example.lines || []).length;
      if (!String(example.language || "").trim()) fail(label, `code example "${example.title}" declares no language`);
    }

    for (const section of UNIQUE_TITLES) {
      const titles = (unit[section] || []).map((item) => norm(item?.title)).filter(Boolean);
      const seen = new Set();
      for (const title of titles) {
        if (seen.has(title)) fail(label, `${section}: two items share the title "${title}" — reads as a duplicated module`);
        seen.add(title);
      }
    }

    // A matching worksheet shuffles its right-hand column on purpose, so a
    // row-wise "left → right" step asserts a pairing the source never made.
    for (const activity of unit.activities || []) {
      for (const step of activity.steps || []) {
        if (/^Match: .+ → /.test(String(step))) {
          fail(label, `activity "${activity.title}" asserts a matching pair the worksheet deliberately shuffled: "${String(step).slice(0, 60)}"`);
        }
      }
    }

    // A Discovery card grades a typed response against explorations[].answer.
    // If that field is the activity's own instruction list, the learner is
    // graded against what they were told to do — and every distractor on the
    // worksheet counts as correct.
    for (const exploration of unit.explorations || []) {
      const activity = (unit.activities || []).find((entry) => entry.title === exploration.title);
      if (!activity) continue;
      const instructions = (activity.steps || []).slice(1).join(" ").trim();
      if (instructions && String(exploration.answer || "").trim() === instructions) {
        fail(label, `exploration ${exploration.id} is graded against its own instruction steps, so any item named in them scores as correct`);
      }
    }

    // Two practice items sharing an answer while asking different things means
    // one key line was consumed twice — the numbering-collision signature.
    const answerOwner = new Map();
    for (const item of unit.practice || []) {
      const answer = String(item.answer || "").trim();
      if (answer.length < 12 || /^(Work through the task|Say your answer)/.test(answer)) continue;
      const prior = answerOwner.get(answer);
      if (prior && prior.prompt.trim().toLowerCase() !== String(item.prompt).trim().toLowerCase()) {
        fail(label, `practice ${prior.id} and ${item.id} ask different questions but share one answer — a key line bound twice`);
      }
      if (!prior) answerOwner.set(answer, { id: item.id, prompt: String(item.prompt) });
    }

    const questions = unit.assessment?.questions || [];
    if (questions.length < 8) fail(label, `assessment has only ${questions.length} questions`);
    for (const question of questions) {
      questionCount += 1;
      const options = question.options || [];
      if (new Set(options).size !== options.length) fail(label, `question ${question.id} has duplicate options`);
      if (options.length < 3) warn(label, `question ${question.id} offers only ${options.length} options`);
      if (question.answer !== undefined && options.length && !options.includes(question.answer)) {
        fail(label, `question ${question.id} answer is not among its options`);
      }
      // A vocabulary explanation names the word it defines. If that word is
      // nowhere in the question, the answer or the options, the explanation
      // belongs to a different question — the signature of a reviewed row that
      // slid onto the wrong slot, or of a key run read off by one. The learner
      // gets the right answer with the wrong reason.
      const defines = /^([A-Za-z][A-Za-z0-9 .'’-]{1,30}?) means /.exec(String(question.explanation || "").trim());
      if (defines) {
        const about = `${question.question} ${question.answer} ${options.join(" ")}`.toLowerCase();
        if (!about.includes(defines[1].toLowerCase())) {
          fail(label, `question ${question.id} is explained by a definition of "${defines[1]}", which it does not ask about`);
        }
      }
    }

    for (const [mod, field] of VARIED_FIELDS) {
      for (const item of unit[mod] || []) {
        const value = item?.[field];
        if (typeof value !== "string" || value.trim().length < 4) continue;
        const key = `${mod}.${field}`;
        if (!repeats.has(key)) repeats.set(key, new Map());
        const seen = repeats.get(key);
        seen.set(value.trim(), (seen.get(value.trim()) || 0) + 1);
      }
    }
    for (const [mod, a, b] of DISTINCT_PAIRS) {
      for (const item of unit[mod] || []) {
        const left = item?.[a];
        const right = item?.[b];
        if (typeof left === "string" && typeof right === "string" && left.trim() && left.trim() === right.trim()) {
          fail(label, `${mod}: "${a}" and "${b}" hold identical text — the reveal repeats what the learner already read`);
        }
      }
    }

    // Stages 1-4 ship as Teacher & Parent Guides and are rewritten; 5-8 ship
    // as student books and are carried across as written.
    const fromGuide = unit.provenance?.sourceAudience === "teacher-guide";
    walk(unit, (text, where) => {
      if (ADULT_ADDRESSED.test(text)) fail(label, `${where} addresses a supervising adult: "${text.slice(0, 90)}"`);
      if (CLASSROOM_ONLY.test(text)) fail(label, `${where} needs classroom staging a solo learner cannot do: "${text.slice(0, 90)}"`);
      if (TEACHER_REQUIRED.test(text)) fail(label, `${where} requires a teacher with no solo path: "${text.slice(0, 90)}"`);
      if (fromGuide && THIRD_PERSON_LEARNER.test(text)) fail(label, `${where} talks about the learner instead of to them: "${text.slice(0, 90)}"`);
    });

    const stage = Number(unit.cambridge?.stage);
    const expected = stage <= 6 ? "0672" : "0868";
    if (unit.cambridge?.code && String(unit.cambridge.code) !== expected) {
      fail(label, `stage ${stage} declares framework ${unit.cambridge.code}, expected ${expected} (0672 Primary, 0868 Lower Secondary)`);
    }
  }
}

// The capstone was never opened by this gate — it globs grade-N/data/units
// only. That is how a stage's final assessment shipped with an answer absent
// from its own options: every choice marked wrong, none ever revealed as
// right, and a learner with no teacher left at a dead end on the last thing
// they meet in the stage.
let capstoneQuestionCount = 0;
for (const gradeDir of gradeDirs) {
  const file = path.join(computingRoot, gradeDir, "data", "grade-capstone.json");
  if (!fs.existsSync(file)) continue;
  const label = `${gradeDir}/grade-capstone.json`;
  const capstone = JSON.parse(fs.readFileSync(file, "utf8"));
  const questions = capstone.quiz?.questions || [];
  if (!questions.length) fail(label, "capstone has no quiz questions");
  for (const question of questions) {
    capstoneQuestionCount += 1;
    const options = question.options || [];
    if (new Set(options).size !== options.length) fail(label, `question ${question.id} has duplicate options`);
    if (question.answer !== undefined && options.length && !options.includes(question.answer)) {
      fail(label, `question ${question.id} answer is not among its options`);
    }
    const defines = /^([A-Za-z][A-Za-z0-9 .'’-]{1,30}?) means /.exec(String(question.explanation || "").trim());
    if (defines) {
      const about = `${question.question} ${question.answer} ${options.join(" ")}`.toLowerCase();
      if (!about.includes(defines[1].toLowerCase())) {
        fail(label, `question ${question.id} is explained by a definition of "${defines[1]}", which it does not ask about`);
      }
    }
  }
}

for (const [key, seen] of repeats) {
  const total = [...seen.values()].reduce((a, b) => a + b, 0);
  const [value, n] = [...seen.entries()].sort((x, y) => y[1] - x[1])[0];
  if (total >= 20 && n / total > REPEAT_LIMIT) {
    failures.push(`${key}: one value fills ${Math.round(100 * n / total)}% of ${total} items across all stages — "${value.slice(0, 70)}"`);
  }
}

console.log(`computing content: ${unitCount} units, ${conceptCount} concepts, ${questionCount} quiz questions (+${capstoneQuestionCount} capstone), ${codeLineCount} code lines, ${teachingChars.toLocaleString()} chars of teaching text`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const message of warnings.slice(0, 15)) console.log(`   ${message}`);
}
if (failures.length) {
  console.error(`\n✗ ${failures.length} failure(s):`);
  for (const message of failures.slice(0, 40)) console.error(`   ${message}`);
  process.exit(1);
}
console.log("\n✓ all computing content checks pass");
