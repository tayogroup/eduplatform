// The one definition of what Computing narrates and what each clip is called.
//
// Mirrors tools/lib/ehel-science-narration.js. Computing carries modules the
// other courses do not — a toolkit, debugging clinics, e-safety cards and a
// unit project — alongside the shared ones.
//
// Consumers: tools/generate-ehel-computing-audio.js,
// tools/prune-ehel-course-audio.mjs.

const fs = require("fs");
const path = require("path");

// Naming scheme shared with every other subject.
const { cyrb53, clean, MIN_CHARS } = require("./ehel-narration-hash");

// spokenText() in the UI collapses paragraph breaks before the text reaches the
// button. Mirrored here so the two sides agree even though clean() would
// flatten the same whitespace anyway.
const spokenText = (value = "") => String(value).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).join(" ");

const CATEGORIES = ["concepts", "toolkit", "explorations", "explorationQuestions", "visualModels",
  "methods", "methodSteps", "workedExamples", "practice", "debugging", "debuggingRule", "esafety",
  "esafetyHelp", "project", "realProblems", "reasoning", "assessment", "games", "words",
  "activities", "codeExamples", "capstone"];

// The debugging rule and the online-safety help are the UI's own words, not any
// unit's — identical on every unit of every stage. Every other text here is
// derived from the unit JSON, so these two are the only ones held as a literal
// in two files at once, and the only ones that can drift apart silently. The
// copies in shell/subjects/computing.js are the originals;
// check-computing-audio-coverage.mjs compares the two character for character.
//
// They are returned per unit rather than once per grade so that every consumer
// which walks units — the generator, the pruner — picks them up with no special
// case. All three de-duplicate by hash, so the repetition costs nothing.
const DEBUG_RULE = [
  "Read the error or watch exactly what the program does.",
  "Say what you expected it to do instead.",
  "Find the first line where those two part company.",
  "Change one thing. Only one.",
  "Run it again and see whether that one change helped.",
];
const SAFETY_HELP = "If anything online upsets you, frightens you, or asks you for personal information, you have not done anything wrong. Stop, close the page, and tell an adult you trust straight away. Telling someone is always the right move.";

// The exact strings each Listen button narrates — must match the UI. A
// difference of one character means a different cyrb53 hash. Categories with no
// Listen button (fluency, the AI tutor's typed replies) are absent on purpose.
// Line references are into computing/shared/course-ui.js.
function textsForUnit(unit, category) {
  switch (category) {
    // renderLesson: `${title}. ${spokenText(explanation)}. Example: ${example}`
    case "concepts": return (unit.concepts || []).map((c) => `${c.title}. ${spokenText(c.explanation)}. Example: ${c.example}`);
    // renderToolkit: `${name}. ${steps.join(" ")} ${note || ""}`
    case "toolkit": return (unit.toolkit || []).map((t) => `${t.name}. ${(t.steps || []).join(" ")} ${t.note || ""}`);
    // renderExploreConcept: the discovery panel and its question are two buttons.
    case "explorations": return (unit.explorations || []).map((e) => `${e.title}. ${e.context}. ${e.explanation}`);
    case "explorationQuestions": return (unit.explorations || []).map((e) => e.prompt);
    case "visualModels": return (unit.visualModels || []).map((m) => `${m.title}. ${m.purpose}`);
    // renderLearnMethod: the whole method, plus one button per step.
    case "methods": return (unit.methods || []).map((m) => `${m.title}. Example: ${m.example}. ${(m.steps || []).join(" ")}`);
    case "methodSteps": return (unit.methods || []).flatMap((m) => (m.steps || []).map((s, i) => `Step ${i + 1}. ${s}`));
    case "workedExamples": return (unit.workedExamples || []).map((w) => `${w.title}. ${w.prompt}. Solution: ${spokenText(w.solution)}`);
    case "practice": return (unit.practice || []).map((p) => p.prompt);
    // renderDebugging: `${symptom}. Cause: ${cause}. Fix: ${fix}`
    case "debugging": return (unit.debugging || []).map((d) => `${d.symptom}. Cause: ${d.cause}. Fix: ${d.fix}`);
    // renderSafety: `${title}. ${text}`
    case "esafety": return (unit.esafety || []).map((s) => `${s.title}. ${s.text}`);
    // The deck's two closing slides. Each opens with its own heading, the way an
    // e-safety card's clip opens with its title.
    case "debuggingRule": return [`The rule that always works. ${DEBUG_RULE.join(" ")}`];
    case "esafetyHelp": return [`If something goes wrong. ${SAFETY_HELP}`];
    // renderActivitiesDeck / renderCodeExamplesDeck: the two sections the grid
    // designs never narrated. A code listing reads its title, its introduction
    // and its explanation — never the lines themselves, which are for typing in,
    // not for hearing.
    case "activities": return (unit.activities || []).map((a) => `${a.title}. You need: ${a.materials}. ${(a.steps || []).join(" ")}`);
    case "codeExamples": return (unit.codeExamples || []).map((c) => `${c.title}. ${c.intro || ""} ${c.explanation}`);
    // renderProject: `${title}. ${brief} ${steps.join(" ")}`
    // Kept to one line so check-computing-audio-coverage.mjs can read the
    // template out of this source and compare it with the UI's.
    case "project": return !unit.project || !unit.project.title ? [] : [`${unit.project.title}. ${unit.project.brief} ${(unit.project.steps || []).join(" ")}`];
    // renderRealProblems speaks the prompt alone — the context is already on
    // screen as the eyebrow above it, and is not read out.
    case "realProblems": return (unit.realProblems || []).map((p) => p.prompt);
    case "reasoning": return (unit.reasoningPrompts || []).flatMap((r) => [r.prompt, r.modelAnswer]);
    // Unit assessment questions. The capstone quiz is sampled from these, so
    // its buttons resolve to the same hashes and need no separate pass.
    case "assessment": return ((unit.assessment || {}).questions || []).map((q) => q.question);
    case "games": return (((unit.games || {}).games) || []).flatMap((g) => (g.rounds || []).map((r) => `${r.prompt}. ${r.clue}`));
    // The Computing Words cards: the term with its meaning, and its example.
    case "words": return (((unit.reference || {}).vocabulary) || []).flatMap((v) => [`${v.term}. ${v.meaning}`, v.example]);
    default: return [];
  }
}

// The stage capstone lives beside the units, not inside one.
function textsForCapstone(capstone, category) {
  if (category !== "capstone") return [];
  const project = capstone.project || {};
  return [`${project.drivingQuestion} ${project.finalProduct}`,
    ...(project.stages || []).map((s) => s.prompt)];
}

/** Every clip one grade needs, as a Set of hashes. */
function hashesForGrade(subjectRoot, grade, categories = CATEGORIES) {
  const keys = new Set();
  const add = (raw) => {
    const text = clean(raw);
    if (text.length >= MIN_CHARS) keys.add(cyrb53(text));
  };
  // Wehel's stock phrases are spoken on every grade's tutor panel, so every
  // grade claims them (tools/lib/ehel-wehel-phrases.js is the definition).
  require("./ehel-wehel-phrases").phrasesForSubject("computing").forEach(add);
  const unitDir = path.join(subjectRoot, `grade-${grade}`, "data", "units");
  if (fs.existsSync(unitDir)) {
    for (const file of fs.readdirSync(unitDir).filter((f) => f.endsWith(".json"))) {
      const unit = JSON.parse(fs.readFileSync(path.join(unitDir, file), "utf8"));
      for (const category of categories) textsForUnit(unit, category).forEach(add);
    }
  }
  const capstoneFile = path.join(subjectRoot, `grade-${grade}`, "data", "grade-capstone.json");
  if (fs.existsSync(capstoneFile)) {
    const capstone = JSON.parse(fs.readFileSync(capstoneFile, "utf8"));
    for (const category of categories) textsForCapstone(capstone, category).forEach(add);
  }
  return keys;
}

/** Which grades each hash belongs to. A text shared by two grades ships to both. */
function hashGradeMap(subjectRoot, categories = CATEGORIES) {
  const map = new Map();
  for (const entry of fs.readdirSync(subjectRoot)) {
    const match = entry.match(/^grade-(\d+)$/);
    if (!match) continue;
    const grade = Number(match[1]);
    for (const key of hashesForGrade(subjectRoot, grade, categories)) {
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(grade);
    }
  }
  return map;
}

module.exports = { cyrb53, clean, MIN_CHARS, CATEGORIES, spokenText, textsForUnit, textsForCapstone, hashesForGrade, hashGradeMap };
