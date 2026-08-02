// Keeps tools/lib/ehel-intensive-narration.js — the definition the generator and
// uploader share — in step with the Listen buttons in the Intensive English app.
//
// A clip is looked up by cyrb53 of its button's text, so the generator has to
// reproduce each button's string exactly. One character apart and the app asks
// for a file nobody wrote, silently falls back to the paid runtime endpoint, and
// the clip that was bought serves nobody — with no error anywhere to notice.
//
// This course does not follow the older per-subject layout, so it needs its own
// check rather than an entry in check-ehel-audio-coverage.mjs: its UI lives in
// the unified shell/subjects/intensive-english.js, and cyrb53 lives in
// shell/course-app.js rather than a subject course-ui.js.
//
// It compares three things:
//   1. every voiceButton() call in the app is accounted for — either mapped to a
//      narration category or explicitly declared as not pre-generated
//   2. no mapped call site has disappeared or had its text expression edited
//   3. the two copies of cyrb53 (app and shared lib) still agree
//
// Usage: node tools/check-intensive-audio-coverage.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const UI = path.join(ROOT, "src", "prototypes", "ehel-academy", "shell", "subjects", "intensive-english.js");
const APP = path.join(ROOT, "src", "prototypes", "ehel-academy", "shell", "course-app.js");
const HASH_LIB = path.join(ROOT, "tools", "lib", "ehel-narration-hash.js");
const NARRATION = path.join(ROOT, "tools", "lib", "ehel-intensive-narration.js");

// Every voiceButton() text expression the app is known to use, and the narration
// category that reproduces it. `null` means deliberately not pre-generated: that
// button falls back to the runtime voice, which is a decision, not an oversight.
const EXPECTED = new Map([
  ["script", "lecture"],
  ["reading.passageScript", "readings"],
  ["`${lesson.title}. ${lesson.explanation}`", "grammar"],
  ["item.displayWord", "words"],
  ["sentences[activeSentence]", "wordSentences"],
  // Speaking was excluded from this course's audio budget. Adding "speaking" to
  // the narration lib's CATEGORIES is all that is needed to buy it.
  ["task.instructionsAndModelLines", null],
]);

const problems = [];

// --- 1 & 2: the app's buttons against the map -------------------------------
// Extracts the first argument of each voiceButton(...) call, tracking nesting so
// a template literal containing a comma is not cut in half.
function firstArguments(source) {
  const out = [];
  const token = "voiceButton(";
  let at = source.indexOf(token);
  while (at !== -1) {
    let i = at + token.length;
    let depth = 0;
    let quote = null;
    let start = i;
    for (; i < source.length; i += 1) {
      const ch = source[i];
      if (quote) {
        if (ch === "\\") { i += 1; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
      if (ch === "(" || ch === "[" || ch === "{") { depth += 1; continue; }
      if (ch === ")" || ch === "]" || ch === "}") {
        if (depth === 0 && ch === ")") break; // single-argument call
        depth -= 1;
        continue;
      }
      if (ch === "," && depth === 0) break;
    }
    out.push(source.slice(start, i).trim());
    at = source.indexOf(token, i);
  }
  return out;
}

const ui = fs.readFileSync(UI, "utf8");
const found = firstArguments(ui);
if (!found.length) problems.push(`no voiceButton() calls found in ${path.relative(ROOT, UI)} — has the app moved?`);

const seen = new Set();
for (const expr of found) {
  seen.add(expr);
  if (!EXPECTED.has(expr)) {
    problems.push(`unaccounted Listen button: voiceButton(${expr})\n`
      + `      Map it to a narration category in this file, or to null if it is\n`
      + `      deliberately left to the runtime voice.`);
  }
}
for (const expr of EXPECTED.keys()) {
  if (!seen.has(expr)) {
    problems.push(`mapped button no longer in the app: voiceButton(${expr})\n`
      + `      Its clips are now orphaned. Update this map and prune the audio.`);
  }
}

// Every category referenced here must exist in the narration definition.
const narration = require(NARRATION);
for (const [expr, category] of EXPECTED) {
  if (category && !narration.CATEGORIES.includes(category)) {
    problems.push(`voiceButton(${expr}) maps to category "${category}", which is not in ehel-intensive-narration.js`);
  }
}

// --- 3: the two cyrb53 copies ------------------------------------------------
const body = (source) => {
  const at = source.indexOf("function cyrb53");
  if (at === -1) return null;
  // To the closing brace of the function, found by depth from the first "{".
  let i = source.indexOf("{", at);
  let depth = 0;
  for (; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") { depth -= 1; if (depth === 0) { i += 1; break; } }
  }
  return source.slice(at, i).replace(/\s+/g, " ").trim();
};

const appHash = body(fs.readFileSync(APP, "utf8"));
const libHash = body(fs.readFileSync(HASH_LIB, "utf8"));
if (!appHash) problems.push(`cyrb53 not found in ${path.relative(ROOT, APP)}`);
else if (!libHash) problems.push(`cyrb53 not found in ${path.relative(ROOT, HASH_LIB)}`);
else if (appHash !== libHash) {
  problems.push("the two cyrb53 implementations have diverged — every clip filename would change:\n"
    + `      app: ${path.relative(ROOT, APP)}\n`
    + `      lib: ${path.relative(ROOT, HASH_LIB)}`);
}

// --- report ------------------------------------------------------------------
if (problems.length) {
  console.error(`intensive-english audio coverage: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
const generated = [...EXPECTED.values()].filter(Boolean).length;
console.log(`intensive-english audio coverage: ${found.length} Listen button(s), `
  + `${generated} pre-generated, ${EXPECTED.size - generated} on the runtime voice; cyrb53 in step.`);
