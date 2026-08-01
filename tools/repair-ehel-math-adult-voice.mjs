// Turn adult-addressed prose in the Mathematics units into text written to the
// learner, in place.
//
// Year 1 Mathematics is sourced from a teacher/parent guide, so its concepts,
// investigations and models are written *about* the learner rather than *to*
// them ("The child hops forward when subtracting", "Let the child feel each and
// name it"). A learner working alone is being talked over.
//
// Two kinds of sentence, handled differently:
//   rewrite — second-person transforms, with verb agreement ("the child hops"
//             -> "you hop"). The maths is unchanged; only the voice moves.
//   drop    — sentences that exist purely to brief the adult and carry no
//             mathematics ("Year 1 learners are usually pre-readers…").
//
// Word problems are deliberately untouched: "84 sweets shared among 6 children"
// is about children, not addressed to an adult, and rewriting it would corrupt
// the question.
//
//   node tools/repair-ehel-math-adult-voice.mjs [--write] [--sample N]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");
const sampleAt = process.argv.indexOf("--sample");
const sampleSize = sampleAt >= 0 ? Number(process.argv[sampleAt + 1]) || 25 : 25;

// Year 1's unit overviews are the guide's preamble to the adult, start to
// finish ("This guide is written for the teacher or parent who will lead a
// young child…"). There is no learner-facing sentence in them to salvage, so
// they are replaced outright with an overview addressed to the learner. Each
// one follows its unit's own outcomes and concepts.
const GRADE1_OVERVIEWS = {
  1: "In this unit you will get to know the numbers 0 to 10. You will count real things by touching them one at a time, use a ten-frame to see a number as a shape, say and read and write every number from 0 to 10, make a sensible guess before you count, and compare two groups to say which has more and which has fewer.",
  2: "In this unit you will meet solid shapes. You will name the cube, the sphere and the cylinder, find their faces, edges and curved surfaces, and discover which shapes roll and which stack. Then you will meet flat shapes — the circle, square, triangle and rectangle — and count their sides and corners.",
  3: "In this unit you will learn what a half is. You will see that a whole can be split into parts, that halves must be two equal parts, and how to make halves by folding and by drawing a line. You will find that halves can look different but still be halves, and that two halves put back together make one whole.",
  4: "In this unit you will compare sizes. You will say which of two things is taller and shorter, longer and shorter, wider and thinner. You will put several things in order by size, and then measure with blocks and paper clips to find out how many it takes to match the length of something.",
  5: "In this unit you will add and subtract numbers up to 10. You will combine two groups and count the total, add 1 more, use a ten-frame to see an addition, learn the number bonds that make each number, and take away to subtract. You will also write it down using the +, − and = signs.",
  6: "In this unit you will learn the words that say where something is. You will use on, under, above, below, behind, in front of and between, and find that the answer can change depending on where you are standing. You will also learn the ordinal numbers from 1st to 10th, and both follow and give position instructions.",
  7: "In this unit you will sort and organise things. You will put objects into sets using one rule, explain the rule you chose in your own words, count and compare your sets to say which has more, and use a sorting circle — a Venn diagram — including the middle part where things belong to both groups.",
  8: "In this unit you will learn about time. You will name the seven days of the week in order, use the words today, tomorrow and yesterday, talk about morning, afternoon and evening, meet the two hands on a clock, and read both o'clock and half past times.",
  9: "In this unit you will count all the way to 20. You will count forwards and backwards between any two numbers, say and read the teen number names, see that a teen number is one ten and some ones, write the numbers to 20, compare and order them, and estimate before you count.",
  10: "In this unit you will look more closely at solid shapes. You will name the cube, cuboid, sphere, cylinder, cone and pyramid, explain that a 3D shape takes up space, count the flat faces on a cube and a cuboid, find the curved surfaces, and sort shapes by whether they roll or stack.",
  11: "In this unit you will go further with halves. You will say what a half really means — one of two equal parts — and check that the two halves are equal. You will halve shapes by folding, cutting and drawing, share a group of objects into two equal halves, halve small even numbers, and read the symbol ½.",
  12: "In this unit you will compare things in new ways. You will say which object is heavier and which is lighter, use a balance scale and non-standard units, compare containers by how much they hold, compare length and height, and describe temperature as hot, warm or cold.",
  13: "In this unit you will add and subtract up to 20. You will add by counting on and subtract by counting back, show each step as hops on a number line, work out addition and subtraction inside short stories, and use part-whole thinking to compare numbers up to 20.",
  14: "In this unit you will organise information. You will sort objects by one rule, see how the rule decides which group something belongs to, sort things into and out of a sorting circle, use a sorting box, and then read and make a pictogram and a block graph.",
  15: "In this unit you will go further with time. You will name the seven days of the week and the twelve months of the year in the correct order, use yesterday, today and tomorrow correctly, and read both o'clock and half past times on a clock face.",
};

// Sentences that only brief the supervising adult — no mathematics is lost.
const DROP = [
  /^Year \d+ learners are usually pre-readers[^.]*\.$/i,
  /^The child'?s own work happens in the companion[^.]*\.$/i,
  /^(?:Young )?[Cc]hildren learn [^.]*\bbest\b[^.]*\.$/i,
  /^This guide [^.]*\.$/i,
  /^You will need to [^.]*before the lesson[^.]*\.$/i,
];

// Ordered second-person transforms. Longest / most specific first.
const REWRITES = [
  [/\bAsk the child,\s*/gi, "Ask yourself, "],
  // "Ask the child to say its name" reads best as a plain instruction to the
  // learner — "Say its name". Turning it into "try to say" both weakens the
  // instruction and strands the pronouns that follow it.
  [/\band ask the child to\s+/gi, "and "],
  [/\bAsk the child to\s+([a-z])/g, (match, ch) => ch.toUpperCase()],
  [/\bask the child to\s+([a-z])/g, (match, ch) => ch],
  [/\bask the child\b/gi, "ask yourself"],
  [/\bLet the child\s+/g, ""],
  [/\blet the child\s+/g, ""],
  [/\bhelps? the child\s+(?:to\s+)?/gi, "helps you "],
  [/\bteaches the child that\b/gi, "shows you that"],
  [/\bteaches children that\b/gi, "shows you that"],
  [/\bteaches children\b/gi, "shows you"],
  // Every phrase where an adult acts *on* the learner has to be resolved BEFORE
  // the blanket "the child" -> "you" below, or it never matches: that rule
  // would already have produced "Remind you to…" / "Encourage you to…".
  [/\bRemind the child that\b/g, "Remember that"],
  [/\bremind the child that\b/gi, "remember that"],
  [/\bRemind the child to\s+/g, "Remember to "],
  [/\bremind the child to\s+/gi, "remember to "],
  [/\bRemind the child:\s*/g, "Remember: "],
  [/\bremind the child\b/gi, "remember"],
  [/\bEncourage the child to\s+([a-z])/g, (match, ch) => ch.toUpperCase()],
  [/\bencourage the child to\s+/gi, ""],
  [/\bHelp the child to\s+([a-z])/g, (match, ch) => ch.toUpperCase()],
  [/\bhelp the child to\s+/gi, ""],
  [/\bhelp the child\s+/gi, ""],
  [/\bWatch the child\s+/g, ""],
  [/\bwatch the child\s+/gi, ""],
  [/\bshow the child\s+/gi, "look at "],
  [/\btell the child\s+/gi, "say "],
  [/\bguide the child\s+(?:to\s+)?/gi, ""],
  [/\bthe child'?s first\b/gi, "your first"],
  [/\bthe child'?s own\b/gi, "your own"],
  [/\bthe child'?s\b/gi, "your"],
  [/\byour child\b/gi, "you"],
  [/\bthe child\b/gi, "you"],
  // Pedagogy phrasing only. Word problems use concrete verbs with numbers
  // ("A child has 4 buttons", "a child counts 3 goats") and must survive
  // untouched, so these patterns name the cognitive verbs instead of matching
  // "a child" on its own.
  [/\bA child'?s (?:own )?(?:very first )?sense\b/g, "Your sense"],
  [/\ba child'?s (?:own )?(?:very first )?sense\b/gi, "your sense"],
  [/\bhelps? a child (see|understand|remember|notice)\b/gi, "helps you $1"],
  [/\bA child assumes\b/g, "You might assume"],
  [/\ba child assumes\b/gi, "you might assume"],
  [/\bIf a child tries\b/g, "If you try"],
  [/\bif a child tries\b/gi, "if you try"],
  [/\bOnce a child is confident\b/g, "Once you are confident"],
  [/\bonce a child is confident\b/gi, "once you are confident"],
  [/\bfor a child and cements\b/gi, "and cements"],
  [/\bIf the child\b/g, "If you"],
  [/\bif the child\b/gi, "if you"],
  [/\ba child can\b/gi, "you can"],
  [/\bA child might\b/g, "You might"],
  [/\ba child might\b/gi, "you might"],
  [/\bA child may\b/g, "You might"],
  [/\ba child may\b/gi, "you might"],
  [/\bfor young children\b/gi, ""],
  [/\byoung children\b/gi, "you"],
  [/\ba child who\b/gi, "someone who"],
  [/\bA child will\b/g, "It is easy to"],
  [/\ba child will\b/g, "it is easy to"],
  [/\bBefore a child can\b/g, "Before you can"],
  [/\bbefore a child can\b/gi, "before you can"],
  [/\bMany young children\b/g, "It is easy to"],
  [/\bmany young children\b/g, "it is easy to"],
];

// After "you", a third-person singular verb has to lose its -s.
const VERB_AGREEMENT = [
  [/\byou hops\b/gi, "you hop"], [/\byou traces\b/gi, "you trace"], [/\byou picks\b/gi, "you pick"],
  [/\byou needs\b/gi, "you need"], [/\byou sees\b/gi, "you see"], [/\byou counts\b/gi, "you count"],
  [/\byou says\b/gi, "you say"], [/\byou does\b/gi, "you do"], [/\byou has\b/gi, "you have"],
  [/\byou is\b/gi, "you are"], [/\byou was\b/gi, "you were"], [/\byou knows\b/gi, "you know"],
  [/\byou reads\b/gi, "you read"], [/\byou writes\b/gi, "you write"], [/\byou makes\b/gi, "you make"],
  [/\byou puts\b/gi, "you put"], [/\byou finds\b/gi, "you find"], [/\byou looks\b/gi, "you look"],
  [/\byou moves\b/gi, "you move"], [/\byou holds\b/gi, "you hold"], [/\byou feels\b/gi, "you feel"],
  [/\byou names\b/gi, "you name"], [/\byou sorts\b/gi, "you sort"], [/\byou tests\b/gi, "you test"],
  [/\byou compares\b/gi, "you compare"], [/\byou adds\b/gi, "you add"], [/\byou takes\b/gi, "you take"],
  [/\byou gets\b/gi, "you get"], [/\byou lays\b/gi, "you lay"], [/\byou continues\b/gi, "you continue"],
  // "they" pronouns left behind by the substitution
  [/\byou\b([^.?!]{0,40}?)\bthey should\b/gi, "you$1you should"],
  [/\bOnce you can ([^,]+), they\b/gi, "Once you can $1, you"],
  // An instruction aimed at the learner cannot also report back to them.
  [/\btell you their\b/gi, "say your"],
  [/\btheir day back to you\b/gi, "your day"],
  [/\s+back to you\b/gi, ""],
  [/\btheir own\b/gi, "your own"],
  // Once the subject is the learner there is nobody left for the adult to
  // "help them" or "let them" do — the instruction is simply the learner's.
  [/,\s*help them\s+/gi, ", "],
  [/\bhelp them\s+/gi, ""],
  [/\blet them\s+/gi, ""],
  [/\bhelp the child\s+/gi, ""],
  [/\bencourage them to\s+/gi, ""],
  [/\bEncourage the child to\s+([a-z])/g, (match, ch) => ch.toUpperCase()],
  [/\bencourage the child to\s+/gi, ""],
  [/\b[Ww]atch the child\s+/g, ""],
  [/\bRemind the child that\b/g, "Remember that"],
  [/\bremind the child that\b/gi, "remember that"],
  [/\bRemind the child to\s+/g, "Remember to "],
  [/\bremind the child to\s+/gi, "remember to "],
  [/\bremind the child\b/gi, "remember"],
  [/\bremind them to\s+/gi, "remember to "],
  [/\bremind them\b/gi, "remember"],
  // Once the subject is "you", a trailing "they" refers to nobody.
  [/\b(If|When|Before|After|Once|Until) you\b([^.?!]{0,70}?),\s*they\b/gi, "$1 you$2, you"],
  [/\b(If|When|Before|After|Once|Until) you\b([^.?!]{0,70}?)\bthey (may|might|likely|probably|need|have|are|will)\b/gi, "$1 you$2you $3"],
  [/\bOnce a child can\b/gi, "Once you can"],
  [/\bIf they (say|said|pick|picked|choose|chose|count|counted|put|write|wrote)\b/g, "If you $1"],
  [/\bthey likely\b/gi, "you likely"],
  [/\bthey are ready\b/gi, "you are ready"],
  [/\bthey need the words\b/gi, "you need the words"],
  [/\bthey need to\b/gi, "you need to"],
  [/\btell them to\s+/gi, ""],
  [/\bIf you picks?\b/g, "If you pick"],
];

// Which sentences are candidates. Everything else is left exactly alone.
//
// Year 1 is sourced wholesale from a parent guide, so any mention of "the
// child" there is the guide talking about the learner. Later grades use the
// same words inside genuine word problems — Stage 3 has "the child with 8
// collected 8/30" — and rewriting those would corrupt the mathematics. So the
// blanket rule is Year 1 only; every other grade matches the narrow patterns.
// "If the child worked out only 8 + 5 = 13… remind them" is error feedback
// written to whoever is marking, and it appears outside Year 1 too — so it is
// matched in every grade, unlike the blanket "the child" rule below.
const ADULT_NARROW = /\byour child\b|\b(?:let|ask|encourage|remind|tell|watch|guide) (?:the|your) child\b|\bif the child (?:worked|picked|said|chose|wrote|answered|counted|put)\b|the child'?s own work|read alone by the child|taught with you|teaches? (?:the child|children) that|helps? the child|many young children|the child'?s first|children learn [^.]*best/i;
// Year 1 gets the narrow patterns *plus* the blanket ones — it is a parent
// guide cover to cover, so both kinds appear.
const ADULT_BROAD = new RegExp(
  `${ADULT_NARROW.source}|\\bthe child\\b|\\ba child (?:will|who|can|may|might|assumes|tries|is confident)\\b|\\ba child'?s (?:own |very first )*sense\\b|helps? a child (?:see|understand|remember|notice)\\b|for a child and cements\\b|\\byoung children\\b|teaches? children\\b|estimation teaches\\b|point out that\\b|\\bif they (?:say|said|pick|picked|choose|chose|count|counted)\\b`,
  "i",
);
let ADULT = ADULT_NARROW;

function convertSentence(sentence) {
  if (DROP.some((rx) => rx.test(sentence.trim()))) return "";
  let out = sentence;
  for (const [rx, to] of REWRITES) out = out.replace(rx, to);
  for (const [rx, to] of VERB_AGREEMENT) out = out.replace(rx, to);
  // A dropped "Let the child " leaves a lower-case imperative mid-string.
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (m, lead, ch) => lead + ch.toUpperCase());
  return out.replace(/\s{2,}/g, " ").trim();
}

function convert(text) {
  if (!ADULT.test(text)) return null;
  const parts = String(text).split(/(?<=[.!?])\s+/);
  const kept = [];
  let touched = false;
  for (const part of parts) {
    if (!ADULT.test(part)) { kept.push(part); continue; }
    const next = convertSentence(part);
    touched = true;
    if (next) kept.push(next);
  }
  if (!touched) return null;
  const joined = kept.join(" ").replace(/\s{2,}/g, " ").trim();
  return joined && joined !== text ? joined : null;
}

const changes = [];
let fieldsChanged = 0;
let filesChanged = 0;

for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  // Year 1 is a parent guide throughout; later grades only match the narrow
  // adult phrasings so their word problems are never touched.
  ADULT = gradeDir === "grade-1" ? ADULT_BROAD : ADULT_NARROW;
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let changed = 0;

    const unitNo = unit.unit?.unitNo ?? Number((file.match(/unit-(\d+)/) || [])[1]);
    if (gradeDir === "grade-1" && GRADE1_OVERVIEWS[unitNo] && unit.unit?.unitOverview) {
      const current = unit.unit.unitOverview;
      // Only swap the guide's preamble, never an overview someone has written.
      if (/this guide is written for|teacher or parent|pre-readers/i.test(current)) {
        changes.push([`${gradeDir}/${file} unitOverview`, current, GRADE1_OVERVIEWS[unitNo]]);
        unit.unit.unitOverview = GRADE1_OVERVIEWS[unitNo];
        changed += 1;
      }
    }

    const visit = (node) => {
      if (Array.isArray(node)) {
        node.forEach((item, i) => {
          if (typeof item === "string") {
            const next = convert(item);
            if (next) { changes.push([`${gradeDir}/${file}`, item, next]); node[i] = next; changed += 1; }
          } else visit(item);
        });
        return;
      }
      if (!node || typeof node !== "object") return;
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === "string") {
          const next = convert(value);
          if (next) { changes.push([`${gradeDir}/${file} ${key}`, value, next]); node[key] = next; changed += 1; }
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
}

console.log(`${write ? "REWRITTEN" : "DRY RUN"} — ${fieldsChanged} field(s) across ${filesChanged} file(s)\n`);
const step = Math.max(1, Math.floor(changes.length / sampleSize));
console.log(`sample of ${Math.min(sampleSize, changes.length)} rewrites (read these back for grammar):`);
for (let i = 0; i < changes.length && i / step < sampleSize; i += step) {
  const [where, before, after] = changes[i];
  console.log(`\n  [${where}]`);
  console.log(`    -  ${before.slice(0, 150)}`);
  console.log(`    +  ${after.slice(0, 150)}`);
}
if (!write) console.log("\nRe-run with --write to apply.");
