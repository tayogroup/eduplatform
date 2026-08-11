// Repair quiz questions whose fields were written one slot out of step.
//
// In a hand-authored unit the assessment fields ended up shifted:
//
//   answer      <- the hint text          ("Find each rectangle's area, then add them.")
//   hint        <- the explanation        ("15 + 8 = 23 m².")
//   explanation <- missing entirely
//
// The effect is a question that cannot be answered: `answer` is not one of the
// options, so every choice is marked wrong. This shifts the fields back and
// recovers the real answer from the explanation, which states the result.
//
//   node tools/repair-ehel-math-quiz-fields.mjs [--write]
//
// Runs as a dry run unless --write is passed.
//
// It repairs the GAMES too, and that is not an extra: it is the defect this
// tool previously left behind. Games are not authored — build-ehel-math-runtime.js
// copies each round out of an assessment question (`gameData`, one round per
// question). An earlier run of this script walked `assessment.questions` alone,
// so it un-shifted the questions and left the copies holding the pre-repair
// rotation. 24 rounds in grade-4/unit-14 stayed unanswerable, with the clue
// giving the answer away ("Count the whole squares and the more-than-half
// squares together: 8 + 4 = 12 square units"), and check-math-content.mjs never
// looked at games so nothing reported it.
//
// A round is repaired from its own fields, except the lost answer, which is
// taken from the assessment question sharing its prompt — that question has
// already been repaired here, so its answer is the reviewed one rather than a
// second guess from the explanation.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");

// Where in the explanation the answer sits depends on the kind of question:
//
//   numeric  — the explanation works towards the result, so the answer is the
//              LAST option mentioned. Taking the first would pick up a working
//              step ("15 + 8 = 23" would resolve to 15).
//   textual  — the explanation names the answer up front and then says why the
//              other options are wrong, so the answer is the FIRST mentioned.
//              Taking the last would pick up a rejected option ("square metres
//              is sensible… millimetres would be far too small" -> mm²).
//
// Anything ambiguous is reported rather than guessed.
function answerFromExplanation(options, explanation) {
  const haystack = String(explanation).replace(/,/g, "");
  const numeric = options.every((option) => /^[\d.]+$/.test(String(option).replace(/,/g, "")));
  const positions = [];
  for (const option of options) {
    const needle = String(option).replace(/,/g, "");
    if (!needle) continue;
    const pattern = new RegExp(`(?<![\\w.])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w])`, "g");
    let match;
    while ((match = pattern.exec(haystack)) !== null) positions.push({ option, at: match.index });
  }
  if (!positions.length) return null;
  positions.sort((a, b) => a.at - b.at);
  return numeric ? positions[positions.length - 1].option : positions[0].option;
}

const repaired = [];
const unresolved = [];
let filesChanged = 0;

for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let changed = 0;

    for (const question of unit.assessment?.questions || []) {
      const options = question.options || [];
      if (!options.length || options.includes(question.answer)) continue;
      // Only treat it as a shift when the explanation slot is empty — otherwise
      // this is some other problem and guessing would make it worse.
      if (question.explanation) {
        unresolved.push(`${gradeDir}/${file} ${question.id}: answer not in options but explanation is present`);
        continue;
      }
      const explanation = question.hint;
      const answer = answerFromExplanation(options, explanation);
      if (!answer) {
        unresolved.push(`${gradeDir}/${file} ${question.id}: could not recover an answer from "${String(explanation).slice(0, 60)}"`);
        continue;
      }
      repaired.push(`${gradeDir}/${file} ${question.id}: answer -> "${answer}"  (${String(question.question).slice(0, 60)})`);
      question.explanation = explanation;
      question.hint = question.answer;
      question.answer = answer;
      changed += 1;
    }

    // The game rounds copied from those questions carry the same shift.
    const answerFor = new Map();
    for (const question of unit.assessment?.questions || []) {
      if ((question.options || []).includes(question.answer)) answerFor.set(String(question.question), question.answer);
    }
    for (const game of unit.games?.games || []) {
      for (const [index, round] of (game.rounds || []).entries()) {
        const choices = round.choices || [];
        if (!choices.length || choices.includes(round.answer)) continue;
        if (round.explanation) {
          unresolved.push(`${gradeDir}/${file} ${game.id}[${index}]: answer not in choices but explanation is present`);
          continue;
        }
        const answer = answerFor.get(String(round.prompt));
        if (!answer) {
          unresolved.push(`${gradeDir}/${file} ${game.id}[${index}]: no repaired assessment question matches "${String(round.prompt).slice(0, 50)}"`);
          continue;
        }
        repaired.push(`${gradeDir}/${file} ${game.id}[${index}]: answer -> "${answer}"  (${String(round.prompt).slice(0, 50)})`);
        round.explanation = round.clue;
        round.clue = round.answer;
        round.answer = answer;
        changed += 1;
      }
    }

    if (changed) {
      filesChanged += 1;
      if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
    }
  }
}

console.log(`${write ? "REPAIRED" : "DRY RUN"} — ${repaired.length} question(s) in ${filesChanged} file(s)`);
for (const line of repaired) console.log(`   ${line}`);
if (unresolved.length) {
  console.log(`\n${unresolved.length} left for a human:`);
  for (const line of unresolved) console.log(`   ${line}`);
}
if (!write) console.log("\nRe-run with --write to apply.");
