// The one definition of what Mathematics narrates and what each clip is called.
//
// Mirrors tools/lib/ehel-science-narration.js — the two courses share a UI, so
// they share the button shapes. Mathematics has no vocabulary word-cards, so
// there is no "words" category here; everything else matches.
//
// Consumers: tools/generate-ehel-math-audio.js, tools/upload-media-to-bunny.js,
// tools/prune-ehel-course-audio.mjs. Held to mathematics/shared/course-ui.js by
// tools/check-ehel-audio-coverage.mjs.

const fs = require("fs");
const path = require("path");

// Naming scheme shared with every other subject.
const { cyrb53, clean, MIN_CHARS } = require("./ehel-narration-hash");

const CATEGORIES = ["concepts", "explorations", "explorationQuestions", "visualModels", "methods",
  "methodSteps", "workedExamples", "practice", "realProblems", "reasoning", "assessment",
  "games", "capstone", "words", "symbols", "activities"];

// Three categories exist only where the Stage 1-4 slide deck is mounted.
//
// The grid designs Stage 5 and up keep have no Listen button on the words page
// or on an activity — a learner who can read does not need one — so generating
// those clips for a stage that never asks for them is money spent on files the
// app will not request, and the pruner would then report them as orphans.
//
// This is 4 because DECK_MAX_STAGE in shell/subjects/mathematics.js is 4, and
// that one is settled: Stages 5-8 keep their grids permanently (2026-08-06).
// The number is here as well because the generator cannot import a browser
// module — if the UI gate ever does move, move this with it, and never ahead of
// it: raising this alone buys clips no button asks for.
const DECK_MAX_STAGE = 4;
const DECK_ONLY = new Set(["words", "symbols", "activities"]);
const stageOf = (unit) => Number(String((unit.stage || unit.grade || {}).id || "").replace(/\D/g, "")) || 0;

// The five signs the deck introduces in every unit, from the same list the UI
// holds. They do not vary by unit; the hash set collapses the repeats.
const SYMBOLS = [["+", "combine or add", "Use when quantities join"], ["−", "find a difference", "Use when quantities separate"], ["=", "has the same value", "Both sides balance"], ["<", "is less than", "The smaller value"], [">", "is greater than", "The larger value"]];

// The exact strings each Listen button narrates — must match course-ui.js. A
// difference of one character means a different hash, so the app looks for a
// file that was never written and silently drops to the paid runtime endpoint.
// Categories with no Listen button (fluency, the reference rule cards) are
// absent on purpose, as is the AI tutor, whose text does not exist until a
// learner types.
// The Example clause is conditional because 30 Stage 1 concepts no longer have
// one: their `example` was the grown-up's You:/Child: dialogue, which moved to
// `grownUpGuide`. Appending it unconditionally would narrate "…Example: ." and
// buy a clip under a hash the app never asks for.
//
// It is a helper rather than a ternary inside the template so that the template
// stays flat. check-ehel-audio-coverage.mjs reads these templates with a regex
// that stops at the first backtick, and a nested `${x ? `…` : ""}` cuts it in
// half — the comparison then fails against a UI string that is in fact correct.
const exampleClause = (concept) => (concept.example ? `. Example: ${concept.example}` : "");

function textsForUnit(unit, category) {
  if (DECK_ONLY.has(category) && stageOf(unit) > DECK_MAX_STAGE) return [];
  switch (category) {
    case "concepts": return (unit.concepts || []).map((c) => `${c.title}. ${c.explanation}${exampleClause(c)}`);
    case "explorations": return (unit.explorations || []).map((e) => `${e.title}. ${e.context}. ${e.explanation}`);
    case "explorationQuestions": return (unit.explorations || []).map((e) => e.prompt);
    case "visualModels": return (unit.visualModels || []).map((m) => `${m.title}. ${m.purpose}`);
    case "methods": return (unit.methods || []).map((m) => `${m.title}. Example: ${m.example}. ${(m.steps || []).join(" ")}`);
    case "methodSteps": return (unit.methods || []).flatMap((m) => (m.steps || []).map((s, i) => `Step ${i + 1}. ${s}`));
    case "workedExamples": return (unit.workedExamples || []).map((w) => `${w.title}. ${w.prompt}. Solution: ${w.solution}`);
    case "practice": return (unit.practice || []).map((p) => p.prompt);
    // The real-problems page narrates the prompt alone — the context is shown
    // in the eyebrow, not read out.
    case "realProblems": return (unit.realProblems || []).map((p) => p.prompt);
    case "reasoning": return (unit.reasoningPrompts || []).flatMap((r) => [r.prompt, r.modelAnswer]);
    case "assessment": return ((unit.assessment || {}).questions || []).map((q) => q.question);
    case "games": return (((unit.games || {}).games) || []).flatMap((g) => (g.rounds || []).map((r) => `${r.prompt}. ${r.clue}`));
    // Slide-deck only (see DECK_ONLY above).
    case "words": return (((unit.reference || {}).terms) || []).map(([term, meaning]) => `${term}. ${meaning}.`);
    case "symbols": return SYMBOLS.map(([symbol, meaning, example]) => `The sign ${symbol} means ${meaning}. ${example}.`);
    case "activities": return (unit.activities || []).map((a) => `${a.title}. You need: ${a.materials}. ${(a.steps || []).join(" ")}`);
    default: return [];
  }
}

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
  require("./ehel-wehel-phrases").phrasesForSubject("mathematics").forEach(add);
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

module.exports = { cyrb53, clean, MIN_CHARS, CATEGORIES, textsForUnit, textsForCapstone, hashesForGrade, hashGradeMap };
