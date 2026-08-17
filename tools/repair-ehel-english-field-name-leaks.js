#!/usr/bin/env node
// JSON field names printed to the learner: "see ruleAndExamples for the full
// list", "the commonMistake note", "this item's commonMistake explains…" —
// 17 grammar practice keys (2026-08-17 second-pass mechanical check). The
// practice field is narrated, so these are also spoken aloud as one word.
// Rewrites each to the label the learner actually sees on the card:
// ruleAndExamples → "the rule and examples above"; commonMistake → "the
// common-mistake note". Idempotent. Usage: node tools/repair-ehel-english-field-name-leaks.js [--dry]

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");

const RULES = [
  [/\(see ruleAndExamples for the full list\)/g, "(see the rule and examples above for the full list)"],
  [/\bin the commonMistake note\b/g, "in the common-mistake note"],
  [/\bagainst ruleAndExamples\b/g, "against the rule and examples above"],
  [/\bmodelled in ruleAndExamples\b/g, "modelled in the rule and examples above"],
  [/\bedit passes from ruleAndExamples\b/g, "edit passes from the rule and examples above"],
  [/\bthe way the commonMistake warns against\b/g, "the way the common-mistake note warns against"],
  [/\bthe three rules in ruleAndExamples\b/g, "the three rules in the rule and examples above"],
  [/\bin the ruleAndExamples models\b/g, "in the models above"],
  [/\bthe ruleAndExamples patterns\b/g, "the patterns above"],
  [/\bfrom the ruleAndExamples that you can check against\b/g, "from the rule and examples above that you can check against"],
  [/\bin the ruleAndExamples\b/g, "in the rule and examples above"],
  [/\bper the ruleAndExamples list above\b/g, "per the list in the rule and examples above"],
  [/\bthis item's commonMistake explains\b/g, "this item's common-mistake note explains"],
  [/\bits definition from ruleAndExamples\b/g, "its definition in the rule and examples above"],
  [/\bopeners from ruleAndExamples\b/g, "openers in the rule and examples above"],
  [/\bpatterns in ruleAndExamples above\b/g, "patterns in the rule and examples above"],
  // anything left: generic
  [/\bruleAndExamples\b/g, "the rule and examples above"],
  [/\bcommonMistake\b/g, "the common-mistake note"],
];
function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[-￿]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}
let n = 0; const stale = [];
for (const file of fs.readdirSync(ENGLISH).filter((d) => /^grade-\d$/.test(d)).flatMap((g) => fs.readdirSync(path.join(ENGLISH, g, "data", "units")).map((f) => path.join(ENGLISH, g, "data", "units", f)))) {
  const raw = fs.readFileSync(file, "utf8"); const u = JSON.parse(raw); let dirty = false;
  for (const g of u.grammar || []) {
    for (const key of ["practice", "explanation", "ruleAndExamples", "memoryTip", "commonMistake"]) {
      let v = g[key]; if (typeof v !== "string") continue;
      for (const [rx, to] of RULES) v = v.replace(rx, to);
      if (v !== g[key]) {
        g[key] = v; dirty = true; n += 1;
        const clip = key === "practice" ? (g.practiceAudio || {}).available : (g.audio || {}).available;
        if (clip) stale.push(`${path.basename(path.dirname(path.dirname(path.dirname(file))))} ${key === "practice" ? "grammar-practice " + g.grammarId + "-practice" : "grammar " + g.grammarId}`);
        console.log(`✔ ${path.relative(ENGLISH, file)} ${g.grammarId}.${key}`);
      }
    }
  }
  if (dirty && !DRY) fs.writeFileSync(file, serialise(u, raw), "utf8");
}
console.log(JSON.stringify({ dry: DRY, changed: n }));
if (stale.length) console.log("Narrated text changed — clips now stale:\n  " + stale.join("\n  "));
