// Propose Cambridge objective mappings for the Stage 7-8 Mathematics units.
//
// Mathematics shipped 133 units declaring a Cambridge framework and mapping no
// objectives, so "Aligned to Cambridge Lower Secondary Mathematics" was a claim
// with nothing behind it. This closes the part of that gap the repo can
// actually evidence, and is deliberate about the part it cannot.
//
// WHAT THIS IS NOT. The packs print no objective codes — searched, 0 occurrences
// across all 133 — so unlike Global Perspectives, whose Year 5/7/8 packs carry a
// "Code | What Cambridge says" table the build proves itself against, there is
// no authority here to extract. Every mapping this writes is inferred from what
// the unit teaches, and it is recorded as `reviewed: false` for exactly that
// reason. It is a starting point for a curriculum reviewer, not alignment.
//
// Nothing in the app reads these fields, so an unreviewed mapping cannot reach a
// learner or a teacher as though it were signed off. It exists to be checked by
// check-math-cambridge.mjs and corrected by a person.
//
// STAGES 1-6 ARE NOT TOUCHED. They declare Cambridge Primary Mathematics 0096
// and that framework is not in src/curriculum/ — there is nothing to map them
// against, and inventing codes against an absent document would assert an
// alignment nobody could check. Extract 0096 with
// tools/extract-cambridge-mathematics-framework.py first; this tool will then
// cover them without further change.
//
//   node tools/map-ehel-math-cambridge-objectives.mjs [--write] [grade ...]
//
// Runs as a dry run unless --write is passed. Re-running is idempotent.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const mathRoot = path.join(root, "src", "prototypes", "ehel-academy", "mathematics");
const args = process.argv.slice(2);
const write = args.includes("--write");
const onlyGrades = args.filter((a) => /^\d+$/.test(a)).map(Number);

// Keep an objective when it scores within this fraction of the unit's best
// match. Tuned by reading the output for all 32 units: 0.40 keeps the second
// and third genuine objective of a broad unit ("Graphs" needs 7As.05 and
// 7As.07 beside 7As.06) without admitting the long tail. It is a proposal
// threshold, not a truth threshold — a reviewer still prunes.
const KEEP_RATIO = 0.40;
const MAX_OBJECTIVES = 6;

const STOP = new Set(("the a an of and or to in is are for with that this you your on at as be by it its from " +
  "use using understand find given each when where which will can more than into out about them their they " +
  "these those such other any all some one two both same different way ways make makes made work working " +
  "including include includes e.g eg etc problem problems answer answers question questions maths mathematics").split(/\s+/));

const words = (text) => (String(text).toLowerCase().match(/[a-z]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w));

// Inverse document frequency across the stage's own objectives, so shared
// mathematical vocabulary ("number", "value") cannot carry a match on its own.
function inverseFrequency(objectives) {
  const seen = new Map();
  for (const objective of objectives) for (const word of new Set(words(objective.text))) seen.set(word, (seen.get(word) || 0) + 1);
  return (word) => Math.log((objectives.length + 1) / ((seen.get(word) || 0) + 1)) + 1;
}

// What the unit says it teaches. Titles and outcomes state the intent; the
// explanations are weighted low because their prose ranges well beyond the
// objective being taught.
function unitSignature(unit) {
  const bag = new Map();
  const add = (text, weight) => { for (const word of words(text)) bag.set(word, (bag.get(word) || 0) + weight); };
  add(unit.unit?.unitTitle, 6);
  for (const concept of unit.concepts || []) { add(concept.title, 4); add(String(concept.explanation).slice(0, 400), 0.5); }
  // outcomes[0] is the same self-paced-learning preamble in every unit.
  for (const outcome of (unit.outcomes || []).slice(1)) add(outcome, 3);
  for (const method of unit.methods || []) add(method.title, 2);
  for (const term of unit.reference?.terms || []) add(Array.isArray(term) ? term[0] : term, 2);
  return bag;
}

const frameworks = new Map();
for (const file of fs.readdirSync(path.join(root, "src", "curriculum")).filter((n) => /^cambridge-mathematics-\d+\.json$/.test(n))) {
  const parsed = JSON.parse(fs.readFileSync(path.join(root, "src", "curriculum", file), "utf8"));
  frameworks.set(String(parsed.curriculumCode), parsed);
}

const mapped = [], skipped = [];
let filesChanged = 0, objectivesWritten = 0;

for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const grade = Number(gradeDir.replace(/\D/g, ""));
  if (onlyGrades.length && !onlyGrades.includes(grade)) continue;
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;

  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const label = `${gradeDir}/${file}`;
    const code = String(unit.cambridge?.code || "");
    const stage = Number(unit.cambridge?.stage);

    const framework = frameworks.get(code);
    if (!framework) { skipped.push(`${label}: Cambridge ${code} is not published in src/curriculum/ — nothing to map against`); continue; }
    const objectives = (framework.objectivesByStage || {})[String(stage)] || [];
    if (!objectives.length) { skipped.push(`${label}: Cambridge ${code} publishes no objectives for stage ${stage}`); continue; }

    const idf = inverseFrequency(objectives);
    const signature = unitSignature(unit);
    const scored = objectives.map((objective) => {
      const unique = [...new Set(words(objective.text))];
      let hit = 0, mass = 0;
      for (const word of unique) {
        const weight = idf(word);
        mass += weight;
        // Cap the per-word contribution so one repeated term cannot carry a match.
        if (signature.has(word)) hit += weight * Math.min(3, signature.get(word));
      }
      return { objective, score: mass ? hit / mass : 0 };
    }).sort((a, b) => b.score - a.score);

    if (!scored[0]?.score) { skipped.push(`${label}: no objective shared any distinctive vocabulary with the unit`); continue; }

    // A unit sits in a sub-strand, and its neighbours there are far likelier to
    // be what it teaches than a same-word match from across the framework. This
    // is a nudge, not a filter: "Angles and Constructions" tops out on 8Gp.01
    // (bearings) while most of its real objectives are 8Gg, so hard-excluding
    // other sub-strands would throw those away. Weighting instead let the noise
    // fall under the cutoff on its own — 8Gg.01, "the hierarchy of
    // quadrilaterals", was otherwise being claimed by Integers, Graphs and
    // Collecting Data alike on the strength of "identify" and "describe".
    const leadSubStrand = scored[0].objective.subStrandCode;
    const weighted = scored
      .map((entry) => ({ ...entry, score: entry.score * (entry.objective.subStrandCode === leadSubStrand ? 1.25 : 1) }))
      .sort((a, b) => b.score - a.score);
    const best = weighted[0].score;
    const chosen = weighted.filter((entry) => entry.score >= best * KEEP_RATIO).slice(0, MAX_OBJECTIVES);

    // The framework's own wording is stored beside each code, so
    // check-math-cambridge.mjs fails if either drifts from the other later.
    unit.cambridge.objectives = chosen.map((entry) => ({ code: entry.objective.code, text: entry.objective.text }));
    unit.cambridge.objectiveMapping = {
      status: "proposed",
      reviewed: false,
      method: "Inferred from the unit's title, outcomes, concept titles, methods and glossary against the published objective texts. Cambridge prints no objective codes in these packs, so nothing here is extracted from an authority.",
      tool: "tools/map-ehel-math-cambridge-objectives.mjs",
      requires: "Curriculum sign-off before this is presented as alignment to a school, a parent or a regulator.",
    };
    objectivesWritten += chosen.length;
    filesChanged += 1;
    mapped.push(`${label} [${unit.unit?.unitTitle}] -> ${chosen.map((entry) => entry.objective.code).join(", ")}`);
    if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
  }
}

console.log(`${write ? "MAPPED" : "DRY RUN"} — ${objectivesWritten} objective(s) proposed across ${filesChanged} unit(s), all marked reviewed: false`);
for (const line of mapped) console.log(`   ${line}`);
if (skipped.length) {
  console.log(`\n${skipped.length} unit(s) not mapped:`);
  const reasons = new Map();
  for (const line of skipped) {
    const reason = line.slice(line.indexOf(": ") + 2);
    reasons.set(reason, (reasons.get(reason) || 0) + 1);
  }
  for (const [reason, count] of reasons) console.log(`   ${count} × ${reason}`);
}
if (!write) console.log("\nRe-run with --write to apply.");
