// Separate the grown-up's script from what a Stage 1 learner reads.
//
// Stage 1 Mathematics is sourced from a teacher/parent guide, and each concept
// arrives as two things joined end to end: the teaching, written to the learner
// ("A ten-frame is a simple 2×5 grid. Filling it with counters helps you 'see' a
// number as a shape…"), followed by a script written to the adult ("How to teach
// it: Give the child an egg carton cut to ten cups. Ask them to place 3 beans…").
// The slide deck put the whole thing on the learner's slide, so a six-year-old
// scrolled through instructions about themselves, in the third person.
//
// THE ADULT TEXT IS NOT REWRITTEN INTO LEARNER VOICE. That was tried — see
// tools/repair-ehel-math-adult-voice.mjs, whose second-person transform turns
// "Give the child one position clue at a time and watch them act it out" into
// "Give you one position clue at a time and watch them act it out". The same
// thing was tried and abandoned in Global Perspectives, for the same reason: a
// letter to the parent is not lesson text with an adult frame around it, and
// pronoun-swapping it produces broken prose. So it is moved whole, in its own
// voice, into `grownUpGuide` — where the app shows it to the grown-up who, at
// five and six, is in the room by design.
//
//   node tools/split-ehel-math-grownup-guide.mjs [--write] [--stage N]
//
// A dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MATH = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");
const stageAt = process.argv.indexOf("--stage");
const stages = stageAt >= 0 ? [Number(process.argv[stageAt + 1])] : [1];
// --stage 3 reaches the one Stage 3 fluency line found by the Stages 2-8 sweep;
// the tool is otherwise a Stage 1 one, and says so.

// Where the adult's script begins. Verified across all 15 Stage 1 units: the
// dialogue never precedes "How to teach it", so the FIRST match of either marker
// is the boundary and everything after it belongs to the grown-up.
const BOUNDARY = /(?:How to teach it:|🗣\s*Suggested dialogue)/;
// A field that is the adult's script start to finish rather than a tail on the
// learner's — every one of the 28 dialogue examples begins at character 0.
const WHOLLY_ADULT = /^\s*🗣\s*Suggested dialogue/;

// The fields a learner reads, and which of them carry a guide tail. Anything not
// listed is left alone: a word problem about children ("84 sweets shared among 6
// children") is about children, not addressed to an adult, and rewriting it
// would corrupt the question.
const FIELDS = [
  ["concepts", "explanation"],
  ["concepts", "example"],
  ["reasoningPrompts", "modelAnswer"],
  ["explorations", "context"],
  ["explorations", "explanation"],
  ["visualModels", "purpose"],
  ["methods", "steps"],
  ["methods", "example"],
  ["fluency", "errorFeedback"],
];

// Text that says "the child" and is RIGHT to. A word problem about children is
// about children — rewriting "the child with 8 collected 8/30" into second
// person would corrupt the question, and a probability question about a teacher
// picking a name is a question about a teacher. Listed exactly, so the gate
// below keeps its teeth on everything else.
const WORD_PROBLEMS = new Set([
  "Aisha shares sweets among 5 friends who collects: 6, 4, 7, 5, 8. How many sweets in total, and what fraction did the child with 8 collect?",
  "Total = 6 + 4 + 7 + 5 + 8 = 30 sweets; the child with 8 collected 8/30.",
]);
const isWordProblem = (text) => [...WORD_PROBLEMS].some((known) => String(text).includes(known.slice(0, 60)));

// Nine sentences address the adult from inside the learner's own paragraphs,
// with no "How to teach it" ahead of them, so the section split cannot reach
// them. They are listed one by one, exactly, rather than matched by pattern —
// nine is few enough to read, and a pattern is what produced "Give you one
// position clue at a time" in the tool this one replaces.
//
// Rewritten where the sentence is about the learner and only the person is
// wrong. The mathematics is untouched; the voice moves.
const REWRITE = new Map([
  ["This is where halves connect to counting, which the child already knows well.",
   "This is where halves connect to counting, which you already know well."],
  ["This links adding straight back to the counting the child already knows well, so it is a confidence-builder.",
   "This links adding straight back to the counting you already know well, so it is a confidence-builder."],
  ["The child begins to see that a sorting rule is a choice, not a fixed property of the objects.",
   "You begin to see that a sorting rule is a choice, not a fixed property of the objects."],
  ["Help the child understand that the size of the objects does not decide which set has more – only the number of objects does.",
   "The size of the objects does not decide which set has more – only the number of objects does."],
  ["The child already counts to 10.", "You already count to 10."],
  // A method step is the procedure the learner carries out, so it is always
  // rewritten and never moved — lifting a step into the guide would leave a gap
  // in the middle of the method.
  ["Give the child a die and ask them to press one finger on a flat face and say 'one face'.",
   "Press one finger on a flat face of a die and say 'one face'."],
  ["Hand the child a ball and ask them to run a finger all the way around it without stopping.",
   "Run a finger all the way around a ball without stopping."],
  ["Ask 'what comes next?' starting from a month the child already knows, such as the current month.",
   "Ask yourself 'what comes next?' starting from a month you already know, such as this one."],
  ["Hand the child a cube (a box or die) and ask them to find a flat part they can lay on the table — that is a face.",
   "Take a cube — a box or a die — and find a flat part you can lay on the table. That is a face."],
  ["Give the child a paper shape, such as a circle or square, cut from scrap paper.",
   "Take a paper shape, such as a circle or a square, cut from scrap paper."],
  ["Swap roles so the child hides the button and gives you a position clue to follow, checking that their instruction makes sense.",
   "Swap over: you hide the button and give the position clue, and check that your instruction makes sense."],
  ["Help the child turn their answer into one short sentence, such as 'They are all round.'",
   "Turn your answer into one short sentence, such as 'They are all round.'"],
  ["For one or two numbers, help the child copy the number word underneath (for example 13 → thirteen), tracing the letters together.",
   "For one or two numbers, copy the number word underneath (for example 13 → thirteen), tracing the letters."],
  ["Give the child 16 dried beans and two ten-frames.", "Take 16 dried beans and two ten-frames."],
  // Exploration prose where only the person is wrong: the sentence explains the
  // mathematics and happens to name the learner in the third person.
  ["Once both plates hold the same number, that number is 'half of' the whole set, which connects this new idea straight back to counting, something the child already does well.",
   "Once both plates hold the same number, that number is 'half of' the whole set, which connects this new idea straight back to counting, something you already do well."],
  ["Talking about why we choose warm clothes in the cold or shade in the heat links this new vocabulary to decisions the child already makes every day.",
   "Talking about why we choose warm clothes in the cold or shade in the heat links these new words to decisions you already make every day."],
  ["Counting on works because the child already knows the bigger group without recounting it — jumping forward just the smaller amount is quicker and less error-prone than counting every object from one.",
   "Counting on works because you already know the bigger group without recounting it — jumping forward just the smaller amount is quicker and easier to get right than counting every object from one."],
  ["Tying each o'clock time to something the child already does — school, lunch, bedtime — makes the number mean something rather than being just a fact to recall.",
   "Tying each o'clock time to something you already do — school, lunch, bedtime — makes the number mean something rather than being just a fact to recall."],
  ["Walk through your own day in the order it actually happens, naming each part as you go, so the words attach to routines the child already knows rather than to an abstract idea.",
   "Walk through your own day in the order it actually happens, naming each part as you go, so the words attach to what you already do rather than to an abstract idea."],
  // Found by sweeping Stages 2-8. Only three things turned up in seven stages,
  // and two of them are here.
  //
  // Stage 3's is the one that mattered: errorFeedback is shown to the learner
  // when they get a fluency item wrong, and it was telling somebody else what to
  // remind them of.
  ["If the child rounded 285 down to 200 instead of up to 300, remind them: 285 is closer to 300 than to 200, so it rounds up.",
   "If you rounded 285 down to 200 instead of up to 300, remember: 285 is closer to 300 than to 200, so it rounds up."],
  // A perspective example, where naming a parent as the second person makes no
  // sense to a learner working through it alone.
  ["A toy goat facing you, then facing the parent from across the table",
   "A toy goat facing you, then facing someone sitting across the table"],
]);
// Moved to the guide where the sentence is genuinely TO the adult — an
// instruction to them, or a report on the learner's progress. Rewriting these
// is what breaks: "shows you how securely they grasp the idea" has no
// learner-voice form, because the learner is the "they".
const MOVE = [
  "What was added?’ Working backward from a picture to a number sentence stretches the child's understanding and shows you how securely they grasp the idea.",
  "Give the child the four comparing words and use them constantly: more, fewer (or less), most, least (or fewest).",
  "Keep using the same clear sentence shape: ‘The ___ is ___ the ___.’ This steady pattern helps a pre-reader hear exactly which word changes.",
  "Before clocks, help the child feel the shape of a day.",
  // Pedagogy rather than mathematics: how to run the activity, what order to
  // introduce words in, why a technique works on a five-year-old. None of it is
  // something the learner needs, and none of it survives a change of person.
  "Give the child one position clue at a time, such as 'look under the mat,' and watch them act it out before offering the next clue — following a real instruction makes the words stick far better than naming positions in a picture.",
  "Then swap roles so the child gives you an instruction to follow, which shows them they truly understand a word by being able to use it themselves.",
  "Pointing up for 'above' and down for 'below' as you say each word helps a pre-reader feel the difference in their body, not just hear it.",
  "Singing the order to a familiar tune also helps a pre-reader hold seven items in the right order long before they can read the words.",
  "Get the child comfortable naming ‘short hand’ and ‘long hand’ correctly before introducing the words ‘hour’ and ‘minute’ at all.",
  "Hopping along a physical track links each number to a step and a sound, which is a much stronger memory hook for a pre-reader than hearing the numbers alone.",
  "Start by asking only 'what comes next?' from a month the child already knows well, such as the current one, rather than expecting the full list right away.",
  "The point is not the sorting itself but the naming: once the two piles are made, ask ‘why do these belong together?’ and help the child turn the answer into one short sentence, such as ‘they are all red.’ Praise the sentence as much as the sorting, because explaining the rule out loud is what turns a physical task into a mathematical one.",
];

// Three fields, all on Stage 1 Unit 15's "The Months of the Year", are the
// guide start to finish — there is no learner sentence in them to keep, so the
// split would leave the learner with an empty explanation, which is a worse
// defect than the one being fixed. The learner text is written here instead,
// from the same material: the twelve names, their fixed order, the wrap back to
// January, and the circle that shows it. The guide keeps its own copy.
//
// Keyed by unit file, collection.field and the item's title, so a rule cannot
// silently apply to something else after the data moves.
const AUTHORED = new Map([
  ["unit-15.json|concepts.explanation|The Months of the Year",
   "There are twelve months in a year, and they always come in the same order: January, February, March, April, May, June, July, August, September, October, November, December. After December the year starts again at January. Saying them in order — clapping the beat as you go — helps you remember them, and laying twelve stones out in a circle shows you how the year comes back round to where it started."],
  ["unit-15.json|explorations.context|The Months of the Year",
   "A year has twelve months, always in the same order: January, February, March, April, May, June, July, August, September, October, November, December. After December comes January again."],
  ["unit-15.json|visualModels.purpose|The Months of the Year",
   "Twelve months laid out in a circle, in order from January to December, so you can see that the year has no end — after December it comes back round to January."],
  // Unit 6's explanation is two sentences of pedagogy and nothing else, so both
  // move to the guide and the field is left empty. The learner text below says
  // the same thing to the learner, and follows this exploration's own context
  // ("you can both follow a position instruction and give one") and its prompt
  // (hiding a toy and giving the clue "look under the mat").
  ["unit-6.json|explorations.explanation|Following and Giving Position Instructions",
   "Position words work in both directions. You can follow a clue — someone says 'look under the mat' and you know exactly where to go — and you can give one, choosing the word that says where you have hidden something. Taking a turn at each is what shows you really know a word: it is easy to point at 'under' in a picture, and harder to be the one who chooses it."],
  // Unit 7's explanation is entirely about how to run the activity. The learner
  // text keeps its one mathematical point — that naming the rule is what makes
  // sorting mathematics — from this exploration's own context and answer.
  ["unit-7.json|explorations.explanation|What Is a Set? (sorting by one rule)",
   "Making the piles is only half of it. The part that makes it mathematics is saying why: once the two piles are made, ask yourself ‘why do these belong together?’ and answer in one short sentence, such as ‘they are all red.’ That sentence is the rule, and naming it out loud is what turns moving objects around into sorting."],
]);

// reference.rules is not a slide, but the Wehel tutor answers out of it
// (buildTutorReply reads reference.rules[0].text), so a learner can be told any
// of it. Eight Stage 1 rules are the grown-up's activity script rather than a
// rule — handled here one by one, because a rule is a short thing where a
// wrong cut shows immediately.
//
// `keep` is the learner-facing rule, drawn from the same material. The original
// is preserved on the rule's own grownUpGuide, so nothing is lost.
const RULES = new Map([
  ["unit-12.json|How to Teach It: The Golden Rule for Comparing Length", {
    title: "The Golden Rule for Comparing Length",
    text: "The golden rule is to line objects up at one end. Put two pencils side by side with their bottoms level, then see which one sticks out further at the top — that one is longer. If you do not line them up fairly, a shorter pencil can look longer just because it is placed higher.",
  }],
  ["unit-15.json|The Months of the Year", {
    title: "The Months of the Year",
    text: "The twelve months always come in the same order: January, February, March, April, May, June, July, August, September, October, November, December. Chanting them in order, clapping the beat, is the quickest way to learn them.",
  }],
  ["unit-14.json|How to teach it: tip and sort", {
    title: "Tip and sort",
    text: "Tip out a basket of stones, dates and buttons. Choose one rule — colour, say — and make a small pile for each colour. When the piles are done, count each one aloud: three brown, five white, two black.",
  }],
  ["unit-2.json|How to Teach It: Sorting and a Shape Hunt", {
    title: "Sorting and a Shape Hunt",
    text: "Make two spaces, then sort by one rule at a time and say the rule out loud: this pile is for shapes that can roll, this pile is for shapes that can stack. One rule at a time is what keeps a sort honest.",
  }],
  ["unit-7.json|How to Teach It: Sorting a Pile by One Rule", {
    title: "Sorting a Pile by One Rule",
    text: "Tip a small pile of buttons onto a mat and put all the red ones in one place and all the not-red ones in another. When you have finished, answer the key question: why do these belong together? Saying the rule out loud is the part that makes it mathematics.",
  }],
  ["unit-7.json|How to Teach It: Two Overlapping Circles and 'Both'", {
    title: "Two Overlapping Circles and 'Both'",
    text: "Start with objects that clearly fit only one circle — a blue car is a toy but not red, an apple is red but not a toy. Then try a red teddy: it is a toy AND it is red. The overlapping middle is where something that belongs to both goes.",
  }],
  // Already half-converted, and broken by it: "Be the teacher" addresses the
  // learner, "telling you their rule" addresses the adult about the learner, and
  // the title names them in the third person. All in eleven words. This is what
  // a pattern-based voice transform leaves behind, and the reason this file
  // lists its sentences instead of matching them.
  ["unit-2.json|Child as Teacher: Sorting in Reverse", {
    title: "Be the Teacher: Sorting in Reverse",
    text: "Be the teacher: sort a pile of objects yourself, then tell someone else what your rule was and see if they can follow it.",
  }],
]);

// What must not survive in text a learner reads. Checked after every transform;
// anything still matching is reported and the run fails, so a sentence this file
// has no rule for cannot pass through silently.
const ADULT_VOICE = [
  [/How to teach it/i, "\"How to teach it\""],
  [/🗣/, "dialogue glyph"],
  [/\bthe child\b|\bthe learner\b|\bthe child's\b/i, "names the learner in the third person"],
  [/\b(?:Give|Ask|Let|Help|Hand|Show|Watch|Remind|Encourage) the (?:child|learner)\b/i, "instruction to the adult"],
  [/\bpre-?readers?\b|\bYear \d+ learners\b/i, "briefing the adult"],
];

/** Apply the sentence table to one learner string. Returns [text, movedOut[]]. */
function applySentenceRules(text) {
  let out = text;
  const moved = [];
  for (const sentence of MOVE) {
    if (!out.includes(sentence)) continue;
    out = out.replace(sentence, "").replace(/\s{2,}/g, " ").trim();
    moved.push(sentence);
  }
  for (const [from, to] of REWRITE) {
    if (out.includes(from)) out = out.replace(from, to);
  }
  return [out, moved];
}

const stats = { scanned: 0, split: 0, sentences: 0, moved: 0, authored: 0, duplicates: 0, rules: 0, unchanged: 0, guides: 0 };
const samples = [];
// Adult-voice the sentence table has no rule for. Any entry fails the run.
const unhandled = [];
// Units to write, held until the whole stage has been checked.
const pending = [];

for (const stage of stages) {
  const dir = path.join(MATH, `grade-${stage}`, "data", "units");
  if (!fs.existsSync(dir)) { console.error(`no units for stage ${stage}`); process.exit(1); }
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const full = path.join(dir, file);
    const unit = JSON.parse(fs.readFileSync(full, "utf8"));
    let touched = false;

    for (const [collection, field] of FIELDS) {
      for (const item of unit[collection] || []) {
        const value = item[field];

        // A step list is the procedure the learner carries out. Steps are
        // rewritten in place and NEVER moved to the guide — lifting one out
        // would leave a hole in the middle of a method — so an adult-voiced step
        // with no rewrite rule is an error rather than something to relocate.
        if (Array.isArray(value)) {
          value.forEach((step, at2) => {
            if (typeof step !== "string" || !step) return;
            stats.scanned += 1;
            let next = step;
            for (const [from, to] of REWRITE) if (next.includes(from)) next = next.replace(from, to);
            if (next !== step) { value[at2] = next; stats.sentences += 1; touched = true; collect(file, collection, `${field}[${at2}]`, next, "(rewritten in place)"); }
            else stats.unchanged += 1;
            for (const [pattern, label] of ADULT_VOICE) {
              if (!pattern.test(value[at2]) || isWordProblem(value[at2])) continue;
              unhandled.push(`  ${file} ${collection}.${field}[${at2}] — ${label} (a step must be rewritten, not moved)\n     …${value[at2].slice(0, 130)}…`);
            }
          });
          continue;
        }

        if (typeof value !== "string" || !value) continue;
        stats.scanned += 1;

        // The whole field is the grown-up's: move it out and leave nothing
        // behind rather than a stub the learner would still be shown.
        if (WHOLLY_ADULT.test(value)) {
          addGuide(item, value.trim());
          item[field] = "";
          stats.moved += 1;
          touched = true;
          collect(file, collection, field, "", value.trim());
          continue;
        }
        const at = value.search(BOUNDARY);
        let learner = at < 0 ? value.trim() : value.slice(0, at).trim();
        const tail = at < 0 ? "" : value.slice(at).trim();
        const [cleaned, movedSentences] = applySentenceRules(learner);
        learner = cleaned;
        const guide = [tail, ...movedSentences].filter(Boolean).join("\n\n");
        if (!guide && learner === value.trim()) { stats.unchanged += 1; continue; }
        // Refuse to leave a learner with nothing. If the split would empty the
        // field the item is reported and left alone for a human — an empty
        // explanation is a worse defect than the one being fixed.
        if (learner.length < 40) {
          const authored = AUTHORED.get(`${file}|${collection}.${field}|${item.title || ""}`);
          if (!authored) {
            unhandled.push(`  ${file} ${collection}.${field} (${item.title || item.id}) — the whole field is the guide, and there is no authored learner text for it`
              + `\n     …${value.slice(0, 110)}…`);
            stats.unchanged += 1;
            continue;
          }
          learner = authored;
          stats.authored += 1;
        }
        item[field] = learner;
        if (guide) addGuide(item, guide);
        if (tail) stats.split += 1; else stats.sentences += 1;
        touched = true;
        collect(file, collection, field, learner, guide);
        // Nothing addressed to the adult may reach a learner. A sentence this
        // file has no rule for stops the run rather than shipping.
        for (const [pattern, label] of ADULT_VOICE) {
          if (!pattern.test(learner) || isWordProblem(learner)) continue;
          const at2 = learner.search(pattern);
          unhandled.push(`  ${file} ${collection}.${field} — ${label}\n     …${learner.slice(Math.max(0, at2 - 60), at2 + 110)}…`);
        }
      }
    }

    // reference.rules: the two that only name the learner in the third person
    // are caught by the sentence table; the six that are activity scripts are
    // replaced from RULES, with the original kept on the rule itself.
    for (const rule of unit.reference?.rules || []) {
      const replacement = RULES.get(`${file}|${rule.title}`);
      // Two replacements keep the original title, so the key still matches on a
      // re-run. Without this the rule would be replaced with itself and its
      // original appended to the guide again on every pass.
      if (replacement && rule.text === replacement.text) continue;
      if (replacement) {
        addGuide(rule, [rule.title, rule.text].filter(Boolean).join("\n\n"));
        rule.title = replacement.title;
        rule.text = replacement.text;
        stats.rules += 1;
        touched = true;
        collect(file, "reference.rules", "text", replacement.text, "(original kept on the rule)");
        continue;
      }
      for (const field of ["title", "text"]) {
        const value = String(rule[field] || "");
        if (!value) continue;
        const [cleaned, movedSentences] = applySentenceRules(value);
        if (cleaned === value) continue;
        rule[field] = cleaned;
        if (movedSentences.length) addGuide(rule, movedSentences.join("\n\n"));
        stats.rules += 1;
        touched = true;
      }
      for (const [pattern, label] of ADULT_VOICE) {
        for (const field of ["title", "text"]) {
          if (!pattern.test(String(rule[field] || ""))) continue;
          unhandled.push(`  ${file} reference.rules.${field} — ${label}\n     …${String(rule[field]).slice(0, 120)}…`);
        }
      }
    }

    // Two concepts carried an `example` that was a verbatim copy of their own
    // `explanation` with a different guide section joined onto it. The two tails
    // made them look different, so the duplication survived every check; cutting
    // the tails off reveals it. A paragraph the learner has just read is not an
    // example of anything, so the copy goes and the concept keeps its
    // explanation alone.
    for (const concept of unit.concepts || []) {
      const explanation = String(concept.explanation || "").trim();
      if (!explanation || explanation !== String(concept.example || "").trim()) continue;
      concept.example = "";
      stats.duplicates += 1;
      touched = true;
      collect(file, "concepts", "example", "(emptied — it was a copy of the explanation)", "");
    }

    if (touched) {
      stats.guides += (unit.concepts || []).filter((c) => c.grownUpGuide).length;
      // Held back, not written here: an unhandled sentence anywhere in the stage
      // must stop ALL of it. Writing unit by unit would leave the data half
      // converted at the moment the run fails.
      pending.push([full, unit]);
    }
  }
}

// One guide per item, in source order, so a concept whose explanation and
// example both carried adult text keeps both halves of the grown-up's script.
function addGuide(item, text) {
  item.grownUpGuide = item.grownUpGuide ? `${item.grownUpGuide}\n\n${text}` : text;
}

function collect(file, collection, field, learner, guide) {
  if (samples.length >= 40) return;
  samples.push(`  ${file} ${collection}.${field}`
    + `\n     learner keeps: ${learner ? `${learner.slice(0, 90)}…` : "(nothing — whole field was the guide)"}`
    + `\n     guide takes  : ${guide.slice(0, 90)}…`);
}

console.log(`fields scanned: ${stats.scanned}`);
console.log(`split at "How to teach it" (learner text kept, guide moved out): ${stats.split}`);
console.log(`sentence rules only (no guide section to split): ${stats.sentences}`);
console.log(`moved whole (field was entirely the guide): ${stats.moved}`);
console.log(`learner text authored (field was entirely the guide, nothing to keep): ${stats.authored}`);
console.log(`reference rules made learner-facing: ${stats.rules}`);
console.log(`example emptied (it was a copy of the explanation): ${stats.duplicates}`);
console.log(`already clean: ${stats.unchanged}`);
console.log("");
for (const line of samples) console.log(line);

// Nothing written if a single sentence would reach a learner unhandled. The
// point of the sentence table is that it is exhaustive and readable; an entry
// here means it is neither, and the answer is to add the rule, not to ship.
if (unhandled.length) {
  console.error(`\n✗ ${unhandled.length} adult-voice passage(s) with no rule in this file:`);
  for (const line of unhandled) console.error(line);
  console.error("\nAdd each to REWRITE (the person is wrong) or MOVE (it is written to the adult). Nothing was written.");
  process.exit(1);
}

console.log("");
if (write) {
  for (const [file, unit] of pending) fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
  console.log(`WRITTEN: ${pending.length} unit file(s).`);
} else {
  console.log(`Dry run — ${pending.length} unit file(s) would change. Re-run with --write to apply.`);
}
