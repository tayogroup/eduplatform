// Replace shared boilerplate in the Mathematics unit modules, in place.
//
// A handful of constant strings were emitted by the old builder into every unit
// of every grade, so the same module read identically from Stage 1 to Stage 8:
//
//   practice/fluency hint   "Represent the information, name the rule…"     82%
//   realProblems hint       "Identify the key mathematical idea…"           88%
//   explorations hint       (same string again)                             89%
//   quiz hint / game clue   "Work it out step by step, then check each…"    52%
//   explorations            `explanation` was a verbatim copy of `answer`   705x
//   workedExamples          `title` was a verbatim copy of `prompt`          35x
//
// The builder is fixed, but Mathematics cannot be rebuilt without discarding
// hand-authored work, so this rewrites those fields in the generated files.
// It only ever replaces a value that is *exactly* one of the known boilerplate
// strings — anything an author has touched is left alone by construction.
//
//   node tools/refresh-ehel-math-modules.mjs [--write] [grade ...]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");

const args = process.argv.slice(2);
const write = args.includes("--write");
const onlyGrades = args.filter((a) => /^\d+$/.test(a)).map(Number);

const METHOD_BOILERPLATE = "Represent the information, name the rule, then solve one step at a time.";
const APPLY_BOILERPLATE = "Identify the key mathematical idea before calculating or explaining.";
const QUIZ_BOILERPLATE = "Work it out step by step, then check each option.";
const TEACHER_ANSWER = "Work through the task and explain each step to your teacher or tutor.";
const SOLO_ANSWER = "Work through the task one step at a time, then check each step against the worked examples and the key rules for this unit. Explain it aloud to a teacher or tutor if one is nearby.";

const sentence = (value = "", max = 300) => {
  const text = String(value).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
};

const stats = { files: 0, changed: 0, hints: 0, explanations: 0, titles: 0, answers: 0, quizHints: 0, clues: 0 };

const gradeDirs = fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort();
for (const gradeDir of gradeDirs) {
  const grade = Number(gradeDir.split("-")[1]);
  if (onlyGrades.length && !onlyGrades.includes(grade)) continue;
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;

  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    stats.files += 1;
    let changes = 0;

    const words = (unit.reference?.terms || []).map((pair) => (Array.isArray(pair) ? pair[0] : pair?.term)).filter(Boolean);
    const concepts = unit.concepts || [];
    const overview = unit.unit?.unitOverview || "";

    const methodHint = words.length >= 2
      ? `Show the information first — a bar model, a number line or a jotting. Then name which idea you are using: ${words.slice(0, 2).join(" or ")}.`
      : "Show the information first — a bar model, a number line or a jotting — then name the rule you are using before you calculate.";
    const applyHint = words.length >= 2
      ? `Decide which idea the question is really about (${words.slice(0, 3).join(", ")}), then work one step at a time and check the answer is sensible.`
      : "Decide which mathematical idea the question is really about, then work one step at a time and check the answer is sensible.";

    const mathsBehind = (index) => {
      const concept = concepts[index % Math.max(1, concepts.length)];
      const opening = String(concept?.explanation || overview).split(/\n{2,}/)[0];
      return concept?.title ? `${concept.title}: ${sentence(opening, 300)}` : sentence(opening, 320);
    };
    const quizHint = (n) => {
      const word = words[n % Math.max(1, words.length)];
      const shapes = [
        word ? `Ask yourself what "${word}" means here before you choose.` : "Name the idea being tested before you choose.",
        "Work it out yourself first, then look for your answer among the options.",
        "Rule out the options you know are wrong, then check the one that is left.",
        "Estimate roughly what the answer should be, then pick the option closest to it.",
      ];
      return shapes[n % shapes.length];
    };

    for (const key of ["practice", "fluency", "realProblems", "explorations"]) {
      (unit[key] || []).forEach((item) => {
        if (item.hint === METHOD_BOILERPLATE) { item.hint = methodHint; stats.hints += 1; changes += 1; }
        else if (item.hint === APPLY_BOILERPLATE) { item.hint = applyHint; stats.hints += 1; changes += 1; }
        if (item.answer === TEACHER_ANSWER) { item.answer = SOLO_ANSWER; stats.answers += 1; changes += 1; }
      });
    }

    (unit.explorations || []).forEach((item, index) => {
      // Only when it is still a verbatim copy — a reworded reveal stays.
      if (item.explanation && item.answer && item.explanation === item.answer) {
        item.explanation = mathsBehind(index);
        stats.explanations += 1;
        changes += 1;
      }
    });

    (unit.workedExamples || []).forEach((item, index) => {
      if (!item.title || !item.prompt || item.title !== item.prompt) return;
      // Trimming the prompt only helps when it is prose. Grade 1's prompts are
      // the exercise itself ("★ 🐟 🐟 🐟 → ____ fish"), so those need a real
      // descriptive heading instead.
      const trimmed = sentence(item.prompt, 60).replace(/[.?!]+$/, "");
      const isProse = trimmed !== item.prompt && /[a-z]{3}/i.test(trimmed);
      const concept = concepts[index % Math.max(1, concepts.length)];
      item.title = isProse
        ? trimmed
        : `${concept?.title || unit.unit?.unitTitle || "Worked example"} — example ${index + 1}`;
      stats.titles += 1;
      changes += 1;
    });

    (unit.assessment?.questions || []).forEach((question, index) => {
      if (question.hint === QUIZ_BOILERPLATE) { question.hint = quizHint(index); stats.quizHints += 1; changes += 1; }
    });
    for (const game of unit.games?.games || []) {
      (game.rounds || []).forEach((round, index) => {
        if (round.clue === QUIZ_BOILERPLATE) { round.clue = quizHint(index); stats.clues += 1; changes += 1; }
      });
    }

    if (changes) {
      stats.changed += 1;
      if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
    }
  }
}

console.log(`${write ? "REFRESHED" : "DRY RUN"} — ${stats.files} unit files`);
console.log(`  boilerplate hints replaced      : ${stats.hints}`);
console.log(`  quiz hints replaced             : ${stats.quizHints}`);
console.log(`  game clues replaced             : ${stats.clues}`);
console.log(`  Explore reveals differentiated  : ${stats.explanations}`);
console.log(`  worked-example titles fixed     : ${stats.titles}`);
console.log(`  teacher-only answers made solo  : ${stats.answers}`);
console.log(`  files ${write ? "written" : "that would change"}          : ${stats.changed}`);
if (!write) console.log("\nRe-run with --write to apply.");
