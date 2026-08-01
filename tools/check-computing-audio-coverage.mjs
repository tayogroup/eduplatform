// Keep tools/generate-ehel-computing-audio.js in step with the Listen buttons in
// computing/shared/course-ui.js.
//
// Narration is looked up by cyrb53 of the button's text, so the generator has to
// reproduce each button's string exactly. One extra full stop and the app asks
// for a file nobody wrote, falls back to the paid runtime endpoint, and the
// pre-generated clip is money spent on a file that is never served — with no
// error anywhere to notice. This compares the two sides structurally:
//
//   1. every voiceButton/speakText call in the UI is accounted for, either by a
//      generator category or by an explicit "not pre-generatable" entry
//   2. the text templates agree once variable names are normalised away
//   3. both files hash identically
//
// Usage: node tools/check-computing-audio-coverage.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UI = path.join(ROOT, "src", "prototypes", "ehel-academy", "computing", "shared", "course-ui.js");
const GEN = path.join(ROOT, "tools", "generate-ehel-computing-audio.js");

const failures = [];
const fail = (message) => failures.push(message);

// Reduce a template to its literal skeleton: every ${...} becomes {}, so
// `${c.title}. ${c.explanation}` and `${concept.title}. ${spokenText(concept.explanation)}`
// compare equal. What is being checked is the punctuation and wording between
// the slots, which is what the hash actually depends on.
const skeleton = (template) => template
  .replace(/\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, "{}")
  .replace(/\s+/g, " ")
  .trim();

/** First argument of every call to `name(`, as source text.
 *
 * Scans with a small bracket/quote stack so a template literal holding commas,
 * parentheses or a nested `${…}` is taken whole rather than cut at its first
 * comma. Stops at the comma or closing paren that ends the first argument.
 */
function callArguments(source, name) {
  const out = [];
  const needle = `${name}(`;
  let at = source.indexOf(needle);
  while (at !== -1) {
    const start = at + needle.length;
    const stack = [];
    let index = start;
    for (; index < source.length; index += 1) {
      const ch = source[index];
      const top = stack[stack.length - 1];
      if (top === '"' || top === "'") {
        if (ch === top && source[index - 1] !== "\\") stack.pop();
        continue;
      }
      if (top === "`") {
        if (ch === "`" && source[index - 1] !== "\\") stack.pop();
        else if (ch === "$" && source[index + 1] === "{") { stack.push("${"); index += 1; }
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") { stack.push(ch); continue; }
      if (ch === "(" || ch === "[" || ch === "{") { stack.push(ch); continue; }
      if (ch === ")" || ch === "]" || ch === "}") {
        if (!stack.length && ch === ")") break;
        stack.pop();
        continue;
      }
      if (ch === "," && !stack.length) break;
    }
    out.push(source.slice(start, index).trim());
    at = source.indexOf(needle, index);
  }
  return out;
}

const ui = fs.readFileSync(UI, "utf8");
const gen = fs.readFileSync(GEN, "utf8");

// What the UI is expected to narrate. Each entry is a button's argument as it
// appears in course-ui.js, mapped to the generator category that reproduces it,
// or to null where the text cannot exist ahead of time.
const EXPECTED = new Map([
  ["`${concept.title}. ${spokenText(concept.explanation)}. Example: ${concept.example}`", "concepts"],
  ["`${tool.name}. ${tool.steps.join(\" \")} ${tool.note || \"\"}`", "toolkit"],
  ["`${item.title}. ${item.context}. ${item.explanation}`", "explorations"],
  ["`${model.title}. ${model.purpose}`", "visualModels"],
  ["`${method.title}. Example: ${method.example}. ${method.steps.join(\" \")}`", "methods"],
  ["`Step ${index+1}. ${text}`", "methodSteps"],
  ["`${item.title}. ${item.prompt}. Solution: ${spokenText(item.solution)}`", "workedExamples"],
  ["`${bug.symptom}. Cause: ${bug.cause}. Fix: ${bug.fix}`", "debugging"],
  ["`${item.title}. ${item.text}`", "esafety"],
  ["`${project.title}. ${project.brief} ${project.steps.join(\" \")}`", "project"],
  ["`${round.prompt}. ${round.clue}`", "games"],
  ["`${current.term}. ${current.meaning}`", "words"],
  ["current.example", "words"],
  ["`${project.drivingQuestion} ${project.finalProduct}`", "capstone"],
  ["stage.prompt", "capstone"],
  // Bare identifiers: several buttons share a shape, so these are checked by
  // category coverage rather than by template.
  ["item.prompt", "explorationQuestions/practice/realProblems/reasoning"],
  ["item.question", "assessment"],
  ["item.modelAnswer", "reasoning"],
  // Not pre-generatable: written by the learner or by the tutor at runtime.
  ["item.text", null],
  ["`Which part of ${course.unit.unitTitle} would you like a hint about?`", null],
  ["text", null],
  ["button.hasAttribute(\"data-page-voice\") ? collectPageNarration() : button.dataset.speak", null],
]);

const found = new Set([...callArguments(ui, "voiceButton"), ...callArguments(ui, "speakText")]);
for (const argument of found) {
  if (!EXPECTED.has(argument)) {
    fail(`course-ui.js narrates a text the generator does not know about: ${argument}\n`
       + "    Add it to tools/generate-ehel-computing-audio.js and to EXPECTED here.");
  }
}
for (const argument of EXPECTED.keys()) {
  if (!found.has(argument)) {
    fail(`EXPECTED lists a Listen button that no longer exists in course-ui.js: ${argument}`);
  }
}

// The templates the generator builds, by category, taken from its own source.
const genTemplates = new Map();
for (const [, category, template] of gen.matchAll(/case "(\w+)": return [^\n]*?`([^`]*)`/g)) {
  if (!genTemplates.has(category)) genTemplates.set(category, template);
}
// The capstone is built outside the switch, in its own function guarded by
// `if (category !== "capstone") return []`. Reading only `case` arms left its
// wording unchecked, which is the one place a template could drift unnoticed.
for (const [, category, body] of gen.matchAll(/if \(category !== "(\w+)"\) return \[\];([\s\S]*?)\n\}/g)) {
  const first = body.match(/`([^`]*)`/);
  if (first && !genTemplates.has(category)) genTemplates.set(category, first[1]);
}
for (const [argument, category] of EXPECTED) {
  if (!category || !argument.startsWith("`")) continue;
  if (!genTemplates.has(category)) {
    // Without this the template comparison below is silently skipped, which is
    // how a drifted category would slip through the very check meant to catch
    // it. A category whose case is not a single-line `return …` with a template
    // literal cannot be read out of the generator's source.
    fail(`${category}: no single-line template found in the generator, so its wording `
       + `cannot be compared with course-ui.js. Write the case as one "return \`…\`" line.`);
    continue;
  }
  const mine = skeleton(genTemplates.get(category));
  const theirs = skeleton(argument.slice(1, -1));
  if (mine !== theirs) {
    fail(`${category}: generator builds "${mine}" but course-ui.js narrates "${theirs}"`);
  }
}

// Both files carry their own copy of cyrb53; they must agree exactly.
const hashOf = (source, label) => {
  const body = source.match(/function cyrb53\([\s\S]*?\n\}/);
  if (!body) { fail(`${label}: no cyrb53 found`); return null; }
  return body[0].replace(/\s+/g, " ");
};
const uiHash = hashOf(ui, "course-ui.js");
const genHash = hashOf(gen, "generate-ehel-computing-audio.js");
if (uiHash && genHash && uiHash !== genHash) {
  fail("cyrb53 differs between course-ui.js and generate-ehel-computing-audio.js — "
     + "every pre-generated clip would be looked up under the wrong name.");
}

// The UI normalises a button's text before hashing; the generator must match.
const uiClean = ui.match(/const staticVoiceKey = [^\n]*/);
if (uiClean && !uiClean[0].includes('replace(/\\s+/g, " ").trim()')) {
  fail(`staticVoiceKey no longer normalises with /\\s+/ → " " + trim: ${uiClean[0]}`);
}

if (failures.length) {
  console.error(`✗ ${failures.length} computing audio coverage failure(s):`);
  for (const message of failures) console.error(`   ${message}`);
  process.exit(1);
}
console.log(`✓ computing audio coverage: ${found.size} Listen buttons, all mapped to a generator category or explicitly excluded`);
