// Propose Cambridge objective mappings for the Computing units, Stages 1-4.
//
// Computing shipped 46 units (Grades 1-4) declaring a Cambridge framework and
// mapping no objectives at all — 0 of 46. Adapted from
// tools/map-ehel-math-cambridge-objectives.mjs, which did the same thing for
// Mathematics; the method, its limits and the reviewed:false requirement are
// identical, restated here rather than shared because the two subjects' unit
// shapes differ enough that a shared module would need as many special cases
// as it saved.
//
// WHAT THIS IS NOT. The packs print no objective codes, so every mapping here
// is inferred from what the unit teaches (title, outcomes, concepts, methods,
// reference rules) scored against the framework's own objective text — a
// TF-IDF word-overlap heuristic, not an extraction from an authority. It is
// recorded as `reviewed: false` for exactly that reason: a starting point for
// a curriculum reviewer, not alignment. Nothing in the app reads these
// fields, so an unreviewed mapping cannot reach a learner or a teacher as
// though it were signed off.
//
// THE CODE MISMATCH THIS TOOL WORKS AROUND, WITHOUT RESOLVING IT. Every
// Computing unit's own `cambridge.code` field reads "0672", and
// check-computing-content.mjs actively GATES on that value (fails a unit
// declaring anything else for Stages 1-6) — so "0672" is the shell course's
// own established convention, enforced. But the only framework file with
// real, counted objective text — the one the standalone lesson apps' 100%
// coverage figures are checked against, and their own app.config.json calls
// Cambridge Primary Computing by name — is `cambridge-computing-0059.json`
// (curriculumCode "0059"). Two subsystems disagree about the code and each
// enforces its own belief; this tool is not the place to settle which one is
// wrong. It looks the framework up by 0059 directly (that document is the
// only source of objective text to score against) but leaves the unit's own
// `cambridge.code` at "0672" untouched, so `check-computing-content.mjs`
// keeps passing. The mismatch is recorded in `objectiveMapping` instead of
// silently picked one way, because a first write of this tool did flip it to
// "0059" and broke that gate — reverted before landing.
//
//   node tools/map-ehel-computing-cambridge-objectives.mjs [--write] [grade ...]
//
// Runs as a dry run unless --write is passed. Re-running is idempotent.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const computingRoot = path.join(root, "src", "prototypes", "ehel-academy", "computing");
const args = process.argv.slice(2);
const write = args.includes("--write");
const onlyGrades = args.filter((a) => /^\d+$/.test(a)).map(Number);

const FRAMEWORK_CODE = "0059";

// See tools/map-ehel-math-cambridge-objectives.mjs for how this constant and
// MAX_OBJECTIVES were tuned — same shape of problem, same starting point.
const KEEP_RATIO = 0.40;
const MAX_OBJECTIVES = 6;

// Stages 5-6 collapse the whole stage into exactly one unit per Cambridge
// strand, and — unlike every other grade — each unit's own title IS the
// strand's published name (or two strand names joined by "and"): "Managing
// Data" is subStrand MD's own name, "Computer Systems" is CS's, "Networks and
// Digital Communication" is DC's, "Computational Thinking and Programming" is
// CT and P's names joined. That is not a word-overlap guess, it is the same
// fact the framework and the unit both state, so where a unit's title exactly
// matches one or two strand names, every objective in those strands is
// written — not the top-N by score — and the ratio/cap above are skipped for
// it. This is what closes 5/6 to full 41/41 and 40/40 stage coverage; nothing
// here does the same for Stages 1-4 (many small maker-themed units, no title
// names a strand) or 7-8 (no framework exists to score against at all).
function strandsNamedByTitle(title, strandNames) {
  const byName = (name) => Object.keys(strandNames).find((c) => strandNames[c].toLowerCase() === name);
  const whole = String(title || "").trim().toLowerCase();
  // Try the whole title first — DC's own published name is itself
  // "Networks and Digital Communication", so splitting on "and" before
  // checking for a full match would wrongly cut it into two.
  const wholeCode = byName(whole);
  if (wholeCode) return [wholeCode];
  const parts = whole.split(/\s+and\s+/i).map((p) => p.trim());
  if (parts.length < 2) return null;
  const codes = parts.map(byName);
  return codes.every(Boolean) ? codes : null;
}

const STOP = new Set(("the a an of and or to in is are for with that this you your on at as be by it its from " +
  "use using understand find given each when where which will can more than into out about them their they " +
  "these those such other any all some one two both same different way ways make makes made work working " +
  "including include includes e.g eg etc problem problems answer answers question questions computer computers " +
  "computing program programs").split(/\s+/));

const words = (text) => (String(text).toLowerCase().match(/[a-z]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w));

function inverseFrequency(objectives) {
  const seen = new Map();
  for (const objective of objectives) for (const word of new Set(words(objective.text))) seen.set(word, (seen.get(word) || 0) + 1);
  return (word) => Math.log((objectives.length + 1) / ((seen.get(word) || 0) + 1)) + 1;
}

// What the unit says it teaches. Titles, outcomes, concept titles and method
// titles state the intent; the concept explanation and reference rules are
// weighted low because their prose ranges well beyond the objective taught.
// outcomes[0] is skipped everywhere — it is the same "These come straight
// from the textbook unit..." preamble in every unit, not content.
function unitSignature(unit) {
  const bag = new Map();
  const add = (text, weight) => { for (const word of words(text)) bag.set(word, (bag.get(word) || 0) + weight); };
  add(unit.unit?.unitTitle, 6);
  for (const outcome of (unit.outcomes || []).slice(1)) add(outcome, 3);
  for (const concept of unit.concepts || []) { add(concept.title, 4); add(String(concept.explanation).slice(0, 400), 0.5); }
  for (const method of unit.methods || []) add(method.title, 2);
  for (const rule of unit.reference?.rules || []) add(rule.title, 2);
  return bag;
}

const frameworkPath = path.join(root, "src", "curriculum", `cambridge-computing-${FRAMEWORK_CODE}.json`);
const framework = JSON.parse(fs.readFileSync(frameworkPath, "utf8"));

const mapped = [], skipped = [];
let filesChanged = 0, objectivesWritten = 0;

for (const gradeDir of fs.readdirSync(computingRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const grade = Number(gradeDir.replace(/\D/g, ""));
  if (onlyGrades.length && !onlyGrades.includes(grade)) continue;
  const unitsDir = path.join(computingRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;

  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const label = `${gradeDir}/${file}`;
    const stage = Number(unit.cambridge?.stage);

    const objectives = (framework.objectivesByStage || {})[String(stage)] || [];
    if (!objectives.length) { skipped.push(`${label}: Cambridge ${FRAMEWORK_CODE} publishes no objectives for stage ${stage}`); continue; }

    const strandCodes = strandsNamedByTitle(unit.unit?.unitTitle, framework.strands || {});
    let chosen, note, status;

    if (strandCodes) {
      // The unit's own title names the strand(s) — write every objective in
      // them, not the top few by score. See strandsNamedByTitle above.
      chosen = objectives
        .filter((objective) => strandCodes.includes(objective.subStrandCode))
        .map((objective) => ({ objective }));
      if (!chosen.length) { skipped.push(`${label}: title names strand(s) ${strandCodes.join("/")} but Cambridge ${FRAMEWORK_CODE} lists none for stage ${stage}`); continue; }
      status = "strand-complete";
      note = `This unit's title is Cambridge's own published name for strand(s) ${strandCodes.map((c) => `${c} (${framework.strands[c]})`).join(", ")} — not a word-overlap guess — so every objective ${framework.subStrands?.[strandCodes[0]] ? "in" : "of"} that strand for stage ${stage} is listed here. Codes/text are sourced from cambridge-computing-${FRAMEWORK_CODE}.json, the only framework file with real objective text. This unit's own cambridge.code field says "0672" (the shell course's enforced convention, see check-computing-content.mjs); the standalone lesson apps' own config calls the same Stage's objectives "Cambridge Primary Computing 0059". The two codes have not been reconciled — flagged, not resolved, by this tool.`;
    } else {
      const idf = inverseFrequency(objectives);
      const signature = unitSignature(unit);
      const scored = objectives.map((objective) => {
        const unique = [...new Set(words(objective.text))];
        let hit = 0, mass = 0;
        for (const word of unique) {
          const weight = idf(word);
          mass += weight;
          if (signature.has(word)) hit += weight * Math.min(3, signature.get(word));
        }
        return { objective, score: mass ? hit / mass : 0 };
      }).sort((a, b) => b.score - a.score);

      if (!scored[0]?.score) { skipped.push(`${label}: no objective shared any distinctive vocabulary with the unit`); continue; }

      const leadSubStrand = scored[0].objective.subStrandCode;
      const weighted = scored
        .map((entry) => ({ ...entry, score: entry.score * (entry.objective.subStrandCode === leadSubStrand ? 1.25 : 1) }))
        .sort((a, b) => b.score - a.score);
      const best = weighted[0].score;
      chosen = weighted.filter((entry) => entry.score >= best * KEEP_RATIO).slice(0, MAX_OBJECTIVES);
      status = "proposed";
      note = `Objective codes/text are sourced from cambridge-computing-${FRAMEWORK_CODE}.json, the only framework file with real objective text. This unit's own cambridge.code field says "0672" (the shell course's enforced convention, see check-computing-content.mjs); the standalone lesson apps' own config calls the same Stage's objectives "Cambridge Primary Computing 0059". The two codes have not been reconciled — flagged, not resolved, by this tool.`;
    }

    // unit.cambridge.code is deliberately left as the shell course already
    // has it ("0672") — see THE CODE MISMATCH note above. Only the objective
    // codes/text, sourced from 0059, are written.
    unit.cambridge.objectives = chosen.map((entry) => ({ code: entry.objective.code, text: entry.objective.text }));
    unit.cambridge.objectiveMapping = {
      status,
      reviewed: false,
      method: strandCodes
        ? "The unit title is Cambridge's own strand name, so every objective in that strand for this stage is listed — a structural match, not an inference."
        : "Inferred from the unit's title, outcomes, concept titles, methods and reference rules against the published objective texts. Cambridge prints no objective codes in these packs, so nothing here is extracted from an authority.",
      tool: "tools/map-ehel-computing-cambridge-objectives.mjs",
      requires: "Curriculum sign-off before this is presented as alignment to a school, a parent or a regulator.",
      note,
    };
    objectivesWritten += chosen.length;
    filesChanged += 1;
    mapped.push(`${label} [${unit.unit?.unitTitle}] -> ${chosen.map((entry) => entry.objective.code).join(", ")}${strandCodes ? ` (${chosen.length} objectives, strand-complete)` : ""}`);
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
