// The one definition of what Science narrates and what each clip is called.
//
// Three tools need this and all three must agree exactly, because a clip is
// named cyrb53(button text): the generator (what to buy), the uploader (where
// each file belongs in the per-grade deploy tree) and the pruner (what nothing
// can reach). They used to hold three separate copies, which drifted — the
// uploader still mapped Real Problems by an old text shape, so those clips
// would have been filed under _unmapped/ and served to nobody.
//
// Consumers: tools/generate-ehel-science-audio.js, tools/upload-media-to-bunny.js,
// tools/prune-ehel-course-audio.mjs. Held to science/shared/course-ui.js by
// tools/check-ehel-audio-coverage.mjs.

const fs = require("fs");
const path = require("path");

// Naming scheme shared with every other subject.
const { cyrb53, clean, MIN_CHARS } = require("./ehel-narration-hash");

const CATEGORIES = ["concepts", "explorations", "explorationQuestions", "visualModels", "methods",
  "methodSteps", "workedExamples", "practice", "realProblems", "reasoning", "assessment",
  "games", "words", "capstone"];

// The exact strings each Listen button narrates — must match course-ui.js. A
// difference of one character means a different hash, so the app looks for a
// file that was never written and silently drops to the paid runtime endpoint.
// Categories with no Listen button (fluency, the reference rule cards) are
// absent on purpose, as is the AI tutor, whose text does not exist until a
// learner types.
function textsForUnit(unit, category) {
  switch (category) {
    // renderConcepts: `${title}. ${spokenText(explanation)}. Example: ${example}`
    case "concepts": return (unit.concepts || []).map((c) => `${c.title}. ${c.explanation}. Example: ${c.example}`);
    // renderExplorations: the discovery panel and its question are two buttons.
    case "explorations": return (unit.explorations || []).map((e) => `${e.title}. ${e.context}. ${e.explanation}`);
    case "explorationQuestions": return (unit.explorations || []).map((e) => e.prompt);
    case "visualModels": return (unit.visualModels || []).map((m) => `${m.title}. ${m.purpose}`);
    // renderMethods: the whole method, plus one button per step.
    case "methods": return (unit.methods || []).map((m) => `${m.title}. Example: ${m.example}. ${(m.steps || []).join(" ")}`);
    case "methodSteps": return (unit.methods || []).flatMap((m) => (m.steps || []).map((s, i) => `Step ${i + 1}. ${s}`));
    case "workedExamples": return (unit.workedExamples || []).map((w) => `${w.title}. ${w.prompt}. Solution: ${w.solution}`);
    case "practice": return (unit.practice || []).map((p) => p.prompt);
    // renderRealProblems speaks the prompt alone — the context is already on
    // screen as the eyebrow above it, and is not read out.
    case "realProblems": return (unit.realProblems || []).map((p) => p.prompt);
    case "reasoning": return (unit.reasoningPrompts || []).flatMap((r) => [r.prompt, r.modelAnswer]);
    // Unit assessment questions. The capstone quiz is sampled from these, so
    // its buttons resolve to the same hashes and need no separate pass.
    case "assessment": return ((unit.assessment || {}).questions || []).map((q) => q.question);
    case "games": return (((unit.games || {}).games) || []).flatMap((g) => (g.rounds || []).map((r) => `${r.prompt}. ${r.clue}`));
    // The science-word cards: the term with its meaning, and its example.
    case "words": return (((unit.reference || {}).vocabulary) || []).flatMap((v) => [`${v.term}. ${v.meaning}`, v.example]);
    default: return [];
  }
}

// The grade capstone lives beside the units, not inside one.
function textsForCapstone(capstone, category) {
  if (category !== "capstone") return [];
  const project = capstone.project || {};
  return [`${project.drivingQuestion} ${project.finalProduct}`,
    ...(project.stages || []).map((s) => s.prompt)];
}

/** Every clip one grade needs, as a Set of hashes. */
function hashesForGrade(scienceRoot, grade, categories = CATEGORIES) {
  const keys = new Set();
  const add = (raw) => {
    const text = clean(raw);
    if (text.length >= MIN_CHARS) keys.add(cyrb53(text));
  };
  // Wehel's stock phrases are spoken on every grade's tutor panel, so every
  // grade claims them (tools/lib/ehel-wehel-phrases.js is the definition).
  require("./ehel-wehel-phrases").phrasesForSubject("science").forEach(add);
  const unitDir = path.join(scienceRoot, `grade-${grade}`, "data", "units");
  if (fs.existsSync(unitDir)) {
    for (const file of fs.readdirSync(unitDir).filter((f) => f.endsWith(".json"))) {
      const unit = JSON.parse(fs.readFileSync(path.join(unitDir, file), "utf8"));
      for (const category of categories) textsForUnit(unit, category).forEach(add);
    }
  }
  const capstoneFile = path.join(scienceRoot, `grade-${grade}`, "data", "grade-capstone.json");
  if (fs.existsSync(capstoneFile)) {
    const capstone = JSON.parse(fs.readFileSync(capstoneFile, "utf8"));
    for (const category of categories) textsForCapstone(capstone, category).forEach(add);
  }
  return keys;
}

/** Which grades each hash belongs to. A text shared by two grades ships to both. */
function hashGradeMap(scienceRoot, categories = CATEGORIES) {
  const map = new Map();
  for (const entry of fs.readdirSync(scienceRoot)) {
    const match = entry.match(/^grade-(\d+)$/);
    if (!match) continue;
    const grade = Number(match[1]);
    for (const key of hashesForGrade(scienceRoot, grade, categories)) {
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(grade);
    }
  }
  return map;
}

module.exports = { cyrb53, clean, MIN_CHARS, CATEGORIES, textsForUnit, textsForCapstone, hashesForGrade, hashGradeMap };
