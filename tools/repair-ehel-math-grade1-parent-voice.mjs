// Repair the sentences that tools/repair-ehel-math-adult-voice.mjs broke in
// Year 1 Mathematics, restoring the parent-addressed voice.
//
// That tool applies a blanket "the child" -> "you" to Year 1 (it is a parent
// guide cover to cover). The specific rules ahead of the blanket one cover
// ask/let/help/remind/encourage/watch/show/tell/guide, but not give/hand/pass/
// offer/bring — so every sentence where the adult acts *on* the learner came
// out with the learner in the wrong slot:
//
//   "Give the child an egg carton"  ->  "Give you an egg carton"
//   "Take the child's finger in yours"  ->  "Take your finger in yours"
//   "the counting the child already knows"  ->  "the counting you already knows"
//
// Year 1 keeps its "How to teach it:" sections and "🗣 Suggested dialogue
// You: / Child:" blocks, so the surrounding prose already addresses the adult.
// These repairs put the broken sentences back in that same voice. Grades 2-8
// are untouched — the scan finds no breakages there, because only Year 1 gets
// the blanket rule.
//
// Every rule is an exact string, not a pattern, because the obvious pattern
// over-matches: "Everyday routines … give you a natural place to practise 1st,
// 2nd, and 3rd" is correct as written and must survive. A rule that matches
// nothing is an error, not a no-op — it means the text moved under us.
//
//   node tools/repair-ehel-math-grade1-parent-voice.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const unitsDir = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics", "grade-1", "data", "units");
const write = process.argv.includes("--write");

// The learner was moved into a slot that belongs to the child: the adult is
// handing something over, or acting on them.
const OBJECT_SLOT = [
  ["Take your finger in yours", "Take the child's finger in yours"],
  ["You should learn that rearranging objects", "The child should learn that rearranging objects"],
  ["Give you an egg carton", "Give the child an egg carton"],
  ["Give you a dice (cube) and a date box (cuboid)", "Give the child a dice (cube) and a date box (cuboid)"],
  ["Do not push you to count all 12 edges", "Do not push the child to count all 12 edges"],
  ["Hand you an orange and a tin", "Hand the child an orange and a tin"],
  ["Give you the basket of shapes", "Give the child the basket of shapes"],
  ["(say them aloud for you)", "(say them aloud for the child)"],
  ["Give you a dice and ask them to press", "Give the child a dice and ask them to press"],
  ["Hand you a ball and ask them to run", "Hand the child a ball and ask them to run"],
  ["’ tell you they are not, because they are not equal.", "’ The child will tell you they are not, because they are not equal."],
  ["Give you a paper square", "Give the child a paper square"],
  ["Give you two plates", "Give the child two plates"],
  ["Give you a stone in one hand", "Give the child a stone in one hand"],
  ["Give you 12 dates in one pile", "Give the child 12 dates in one pile"],
  ["stretches your understanding and shows you how securely", "stretches the child's understanding and shows you how securely"],
  ["Hand you objects one at a time", "Hand the child objects one at a time"],
  ["‘Does this belong inside or outside?’ place each one.", "‘Does this belong inside or outside?’ Let them place each one."],
  ["Give you toy animals or picture cards", "Give the child toy animals or picture cards"],
  ["Give you the four comparing words", "Give the child the four comparing words"],
  ["Give you three differently coloured beads", "Give the child three differently coloured beads"],
  ["Hand you the ball and say its name", "Hand the child the ball and say its name"],
  ["and pass you ‘the sphere’", "and ask the child to pass you ‘the sphere’"],
  ["Give you a cube and count the flat faces", "Give the child a cube and count the flat faces"],
  ["Then give you the sphere:", "Then give the child the sphere:"],
  ["Give you a handful of objects and shape cards", "Give the child a handful of objects and shape cards"],
  ["Hand you a cube (a box or die)", "Hand the child a cube (a box or die)"],
  ["Tear your own paper shape and tell you how many parts they made.", "Let the child tear their own paper shape and tell you how many parts they made."],
  ["Offer you the small piece", "Offer the child the small piece"],
  ["Do we both have the same?’ you will quickly say no.", "Do we both have the same?’ The child will quickly say no."],
  ["Give you a paper circle", "Give the child a paper circle"],
  ["Give you a paper shape, such as a circle or square", "Give the child a paper shape, such as a circle or square"],
  ["Tell you stories too", "Let the child tell you stories too"],
  ["Give you three small groups of objects", "Give the child three small groups of objects"],
  ["hide the toy and tell you where to look", "hide the toy and let the child tell you where to look"],
  ["When you give you an instruction", "When the child gives you an instruction"],
  ["swap roles so you give you an instruction to follow", "swap roles so the child gives you an instruction to follow"],
  ["Give you one position clue at a time", "Give the child one position clue at a time"],
  ["Swap roles so you hide the button and gives you a position clue", "Swap roles so the child hides the button and gives you a position clue"],
  ["Helps you understand that the size of the objects", "Help the child understand that the size of the objects"],
  ["Give you a mix of toy animals", "Give the child a mix of toy animals"],
  ["and helps you turn the answer into one short sentence", "and help the child turn the answer into one short sentence"],
  ["Helps you turn their answer into one short sentence", "Help the child turn their answer into one short sentence"],
  ["Before clocks, helps you feel the shape of a day.", "Before clocks, help the child feel the shape of a day."],
  ["Get you comfortable naming", "Get the child comfortable naming"],
  ["give you three or four number cards between 10 and 20", "give the child three or four number cards between 10 and 20"],
  ["For one or two numbers, helps you copy the number word", "For one or two numbers, help the child copy the number word"],
  ["Give you 16 dried beans and two ten-frames", "Give the child 16 dried beans and two ten-frames"],
];

// The substitution left "you" in front of a third-person singular verb.
// Restoring the subject fixes the agreement and the voice in one move.
const SUBJECT_SLOT = [
  ["you already understands", "the child already understands"],
  ["you already knows", "the child already knows"],
  ["You already counts", "The child already counts"],
  ["you already does", "the child already does"],
  ["you already makes", "the child already makes"],
  ["you pairs a half-shape", "the child pairs a half-shape"],
  ["so you pictures each number", "so the child pictures each number"],
  ["You begins to see", "The child begins to see"],
  ["so you both reads and makes times", "so the child both reads and makes times"],
];

const RULES = [...OBJECT_SLOT, ...SUBJECT_SLOT];
const counts = new Map(RULES.map(([from]) => [from, 0]));

function applyRules(text) {
  let out = text;
  for (const [from, to] of RULES) {
    if (!out.includes(from)) continue;
    counts.set(from, counts.get(from) + out.split(from).length - 1);
    out = out.split(from).join(to);
  }
  return out;
}

let fieldsChanged = 0;
let filesChanged = 0;
const samples = [];

for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
  const filePath = path.join(unitsDir, file);
  const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let changed = 0;

  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        if (typeof item === "string") {
          const next = applyRules(item);
          if (next !== item) { if (samples.length < 8) samples.push([file, item, next]); node[i] = next; changed += 1; }
        } else visit(item);
      });
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string") {
        const next = applyRules(value);
        if (next !== value) { if (samples.length < 8) samples.push([`${file} ${key}`, value, next]); node[key] = next; changed += 1; }
      } else visit(value);
    }
  };
  visit(unit);

  if (changed) {
    fieldsChanged += changed;
    filesChanged += 1;
    if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
  }
}

const dead = RULES.filter(([from]) => counts.get(from) === 0);
const applied = [...counts.values()].reduce((a, b) => a + b, 0);

console.log(`${write ? "REWRITTEN" : "DRY RUN"} — ${applied} replacement(s) across ${fieldsChanged} field(s) in ${filesChanged} file(s)\n`);
for (const [where, before, after] of samples) {
  const at = [...before].findIndex((ch, i) => ch !== after[i]);
  console.log(`  [${where}]`);
  console.log(`    -  …${before.slice(Math.max(0, at - 50), at + 90)}…`);
  console.log(`    +  …${after.slice(Math.max(0, at - 50), at + 90)}…\n`);
}
if (dead.length) {
  console.error(`ERROR: ${dead.length} rule(s) matched nothing — the source text has moved:`);
  for (const [from] of dead) console.error(`  ${JSON.stringify(from)}`);
  process.exit(1);
}
console.log(`all ${RULES.length} rules matched at least once`);
if (!write) console.log("\nRe-run with --write to apply.");
