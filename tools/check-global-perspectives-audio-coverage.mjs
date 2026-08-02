// Keep tools/lib/ehel-global-perspectives-narration.js — the one definition the
// generator, uploader and pruner share — in step with the Listen buttons in
// global-perspectives/shared/course-ui.js.
//
// Narration is looked up by cyrb53 of the button's text, so the narration lib
// has to reproduce each button's string exactly. One extra full stop and the
// app asks for a file nobody wrote, falls back to the paid runtime endpoint,
// and the pre-generated clip is money spent on a file that is never served —
// with no error anywhere to notice. This compares the two sides structurally:
//
//   1. every voiceButton call in the UI is accounted for, either by a narration
//      category or by an explicit "not pre-generatable" entry
//   2. the text templates agree once variable names are normalised away
//   3. both files hash identically
//
// A category whose text this cannot read out of the narration source is a
// FAILURE, not a skip. Computing learned that one the hard way: a multi-line
// `case` silently skipped the wording comparison, which is exactly how a drift
// slips past the check meant to catch it.
//
// Usage: node tools/check-global-perspectives-audio-coverage.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The runtime carries a dated filename, because the pull zone ignores query
// strings and serves it max-age=2592000 — a new name is the only reliable
// cache-bust. Resolve whichever one is present rather than hard-coding a date,
// so minting the next one does not silently skip this whole check.
const SHARED = path.join(ROOT, "src", "prototypes", "ehel-academy", "global-perspectives", "shared");
const uiCandidates = fs.readdirSync(SHARED).filter((f) => /^course-ui(?:-\d{8}[a-z])?\.js$/.test(f)).sort();
if (uiCandidates.length !== 1) {
  console.error(`expected exactly one course-ui*.js in ${SHARED}, found: ${uiCandidates.join(", ") || "none"}`);
  process.exit(1);
}
const UI = path.join(SHARED, uiCandidates[uiCandidates.length - 1]);
const GEN = path.join(ROOT, "tools", "lib", "ehel-global-perspectives-narration.js");
const HASH_LIB = path.join(ROOT, "tools", "lib", "ehel-narration-hash.js");

const failures = [];
const fail = (message) => failures.push(message);

// Reduce a template to its literal skeleton: every ${...} becomes {}, so
// `${w.term}. ${w.meaning}` and `${word.term}. ${word.meaning}` compare equal.
// What is checked is the punctuation and wording between the slots, which is
// what the hash actually depends on.
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

// What the UI narrates. Each entry is a button's first argument as it appears
// in course-ui.js, mapped to the narration category that reproduces it, or to
// null where the text cannot exist ahead of time.
const EXPECTED = new Map([
  ["unit.unitOverview", "overview"],
  ["explainer.body", "explainers"],
  // box() builds one string for every callout the page renders — Big Ideas,
  // Worked Examples, Ask Your AI Tutor, the teacher session, the speaking
  // prompts and the boxes nested inside an activity all go through it.
  ["spoken", "boxes"],
  ["word.meaning", "words"],
  // The declaration of voiceButton itself, not a call site.
  ["text", null],
]);

const found = new Set(callArguments(ui, "voiceButton"));
for (const argument of found) {
  if (!EXPECTED.has(argument)) {
    fail(`course-ui.js narrates a text the narration lib does not know about: ${argument}\n`
      + "    Add it to tools/lib/ehel-global-perspectives-narration.js and to EXPECTED here.");
  }
}
for (const argument of EXPECTED.keys()) {
  if (!found.has(argument)) {
    fail(`EXPECTED lists a Listen button that no longer exists in course-ui.js: ${argument}`);
  }
}

// The text each category builds, read out of the narration lib's own source.
// Cases span several lines here, so a case runs to the next `case`/`default`
// rather than to the end of the line.
function categoryBodies(source) {
  const bodies = new Map();
  const starts = [...source.matchAll(/case "(\w+)":/g)];
  for (let i = 0; i < starts.length; i += 1) {
    const from = starts[i].index + starts[i][0].length;
    const to = i + 1 < starts.length ? starts[i + 1].index : (source.indexOf("default:", from) + 1 || source.length);
    bodies.set(starts[i][1], source.slice(from, to));
  }
  return bodies;
}
const bodies = categoryBodies(gen);

const declaredCategories = (gen.match(/const CATEGORIES = \[([^\]]*)\]/)?.[1] || "")
  .split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);

for (const category of declaredCategories) {
  if (!bodies.has(category)) {
    fail(`narration lib declares category "${category}" but textsForUnit has no case for it — `
      + "the generator would buy nothing for it and the check would pass vacuously.");
  }
}
for (const [, category] of EXPECTED) {
  if (category && !declaredCategories.includes(category)) {
    fail(`course-ui.js has a Listen button mapped to category "${category}", which the narration lib does not declare.`);
  }
}

// Where a UI button is a template literal, the category that reproduces it must
// contain the same template. A category body with no template at all where one
// is expected is a failure, not a skip.
for (const [argument, category] of EXPECTED) {
  if (!category || !argument.startsWith("`")) continue;
  const body = bodies.get(category);
  if (body === undefined) continue; // already reported above
  const templates = [...body.matchAll(/`([^`]*)`/g)].map((m) => m[1]);
  if (!templates.length) {
    fail(`${category}: course-ui.js narrates the template ${argument} but the narration lib's `
      + `case builds no template literal — the wording comparison cannot run, so drift would be invisible.`);
    continue;
  }
  const theirs = skeleton(argument.slice(1, -1));
  if (!templates.some((template) => skeleton(template) === theirs)) {
    fail(`${category}: narration lib builds "${templates.map(skeleton).join('" / "')}" `
      + `but course-ui.js narrates "${theirs}"`);
  }
}

// Both files carry their own copy of cyrb53; they must agree exactly.
const hashOf = (source, label) => {
  const body = source.match(/function cyrb53\([\s\S]*?\n\}/);
  if (!body) { fail(`${label}: no cyrb53 found`); return null; }
  return body[0].replace(/\s+/g, " ");
};
const uiHash = hashOf(ui, "course-ui.js");
const libHash = hashOf(fs.readFileSync(HASH_LIB, "utf8"), "lib/ehel-narration-hash.js");
if (uiHash && libHash && uiHash !== libHash) {
  fail("cyrb53 differs between global-perspectives/course-ui.js and lib/ehel-narration-hash.js — "
    + "every pre-generated clip would be looked up under the wrong name.");
}

// The UI normalises a button's text before hashing; the lib must match.
const uiClean = ui.match(/const staticVoiceKey = [^\n]*/);
if (uiClean && !uiClean[0].includes('replace(/\\s+/g, " ").trim()')) {
  fail(`staticVoiceKey no longer normalises with /\\s+/ → " " + trim: ${uiClean[0]}`);
}

if (failures.length) {
  console.error(`✗ ${failures.length} global perspectives audio coverage failure(s):`);
  for (const message of failures) console.error(`   ${message}`);
  process.exit(1);
}
console.log(
  `✓ global perspectives audio coverage: ${found.size} Listen buttons, `
  + `${declaredCategories.length} narration categories, all mapped or explicitly excluded`
);
