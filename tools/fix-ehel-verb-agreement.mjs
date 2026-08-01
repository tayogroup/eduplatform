// Fix subject-verb agreement left behind by the third-person rewrites.
//
// Converting "the child hops forward" to second person gives "you hops
// forward" unless the verb is corrected too. The rewrite tools carry a list of
// the verbs they expect, but the source used more of them than the list knew
// about, leaving sentences like "Once you rejects the unequal split".
//
// This sweeps both subjects for "you <verb>s" and drops the -s, using an
// explicit verb list so that plural nouns ("you always", "you halves", "you
// pass") and words that only look like verbs are never touched.
//
//   node tools/fix-ehel-verb-agreement.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "src", "prototypes", "ehel-academy");
const write = process.argv.includes("--write");

// Third-person singular verb forms seen after "you" in the corpus. Anything not
// listed here is left alone: "you always", "you pass", "you halves", "you
// press", "you sideways" are all correct as they stand.
const VERBS = new Map(Object.entries({
  accepts: "accept", assumes: "assume", calls: "call", cares: "care", chooses: "choose",
  confuses: "confuse", draws: "draw", gives: "give", grabs: "grab", hears: "hear",
  hesitates: "hesitate", hides: "hide", ignores: "ignore", lands: "land", learns: "learn",
  links: "link", loses: "lose", marks: "mark", meets: "meet", pauses: "pause",
  practises: "practise", recognises: "recognise", recounts: "recount", rejects: "reject",
  shares: "share", starts: "start", stops: "stop", swaps: "swap", sweeps: "sweep",
  touches: "touch", tries: "try", understands: "understand", uses: "use", watches: "watch",
  answers: "answer", owns: "own", halves: "halve", tears: "tear", reasons: "reason",
  // "needs" is deliberately absent: "Every part of you needs this delivery to
  // stay alive" is correct, and the subject there is "every part", not "you".
}));

const pattern = new RegExp(`\\byou (${[...VERBS.keys()].join("|")})\\b`, "gi");

// Year 1 Mathematics only. Once its prose was moved into second person, a few
// object pronouns were left pointing at a learner who is now "you" — "the paper
// does the measuring for them". Later grades keep "them" for real plurals, so
// this pass is not applied to them.
const GRADE1_PRONOUNS = [
  [/\bfor them\b/gi, "for you"],
  // Case-preserving: a case-insensitive replacement here left a lower-case
  // "the surprising part" starting a sentence.
  [/\bThe key surprise for you\b/g, "The surprising part"],
  [/\bthe key surprise for you\b/g, "the surprising part"],
];

// Restore the capital on any sentence that a replacement above started with a
// lower-case word.
const recapitalise = (text) => text.replace(/([.!?]\s+)([a-z])/g, (m, lead, ch) => lead + ch.toUpperCase());

const fixes = [];
let filesChanged = 0;

for (const subject of ["mathematics", "science"]) {
  const subjectRoot = path.join(root, subject);
  if (!fs.existsSync(subjectRoot)) continue;
  for (const gradeDir of fs.readdirSync(subjectRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
    const unitsDir = path.join(subjectRoot, gradeDir, "data", "units");
    if (!fs.existsSync(unitsDir)) continue;
    for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
      const filePath = path.join(unitsDir, file);
      const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
      let changed = 0;

      const grade1Math = subject === "mathematics" && gradeDir === "grade-1";
      const convert = (text) => {
        let out = text.replace(pattern, (match, verb) => {
          const base = VERBS.get(verb.toLowerCase());
          if (!base) return match;
          const subjectWord = match.slice(0, match.length - verb.length);
          return `${subjectWord}${base}`;
        });
        if (grade1Math) {
          for (const [rx, to] of GRADE1_PRONOUNS) out = out.replace(rx, to);
          out = recapitalise(out);
        }
        return out;
      };

      const visit = (node) => {
        if (Array.isArray(node)) {
          node.forEach((item, i) => {
            if (typeof item === "string") {
              const next = convert(item);
              if (next !== item) { fixes.push([`${subject}/${gradeDir}/${file}`, item, next]); node[i] = next; changed += 1; }
            } else visit(item);
          });
          return;
        }
        if (!node || typeof node !== "object") return;
        for (const [key, value] of Object.entries(node)) {
          if (typeof value === "string") {
            const next = convert(value);
            if (next !== value) { fixes.push([`${subject}/${gradeDir}/${file} ${key}`, value, next]); node[key] = next; changed += 1; }
          } else visit(value);
        }
      };
      visit(unit);

      if (changed) {
        filesChanged += 1;
        if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
      }
    }
  }
}

console.log(`${write ? "FIXED" : "DRY RUN"} — ${fixes.length} field(s) across ${filesChanged} file(s)`);
const step = Math.max(1, Math.floor(fixes.length / 10));
for (let i = 0; i < fixes.length && i / step < 10; i += step) {
  const [where, before, after] = fixes[i];
  const at = [...before].findIndex((ch, idx) => ch !== after[idx]);
  console.log(`   ${where}\n     - …${before.slice(Math.max(0, at - 45), at + 30)}…\n     + …${after.slice(Math.max(0, at - 45), at + 30)}…`);
}
if (!write) console.log("\nRe-run with --write to apply.");
