// Finish the Stage 1 Mathematics explainers that stop short of teaching.
//
// When the grown-up's script was split out of the learner's text
// (split-ehel-math-grownup-guide.mjs), 49 of 91 Stage 1 concepts fell below the
// 300-character floor check-math-content.mjs holds every other stage to. They
// had only ever cleared it because the adult's "How to teach it:" section was
// joined onto the end and counted toward the total — the gate was measuring the
// grown-up's words as the learner's lesson.
//
// The missing teaching is not missing from the repo. It is in the same
// concept's `grownUpGuide`, written to the adult: "To add 3 + 2, place 3
// counters on the frame, then add 2 more. The top row fills to 5…". So each
// addition below is that material said to the learner, one or two sentences,
// and the whole job is 3,467 characters across 49 concepts — an average of 71
// each.
//
// WRITTEN OUT ONE BY ONE, not generated. Every attempt in this repo to move
// maths prose between voices by pattern has produced broken text ("Give you an
// egg carton", "the counting you already knows"), and two tools were deleted
// over it. Forty-nine sentences are few enough to read.
//
// Keyed by unit file and concept title, so a rule cannot drift onto something
// else. Appended to the existing explanation, never replacing it.
//
//   node tools/complete-ehel-math-stage1-explainers.mjs [--write]
//
// A dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const UNITS = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics", "grade-1", "data", "units");
const write = process.argv.includes("--write");
const FLOOR = 300;

// unit file | concept title  ->  the sentences to add
const ADDITIONS = new Map([
  ["unit-5.json|The Ten-Frame for Adding",
   "To add 3 and 2, put 3 counters on the frame, then add 2 more. The top row fills to 5, so you can see at a glance that 3 add 2 makes 5. For a sum like 6 + 4, filling the whole frame shows the answer is a full ten."],
  ["unit-14.json|Comparing Groups — More, Fewer, Most, Least",
   "Put two groups side by side and pair them one to one: whichever group has some left over has more, and counting the leftovers tells you how many more. With three or more groups, line them up as rows — the longest row is the most and the shortest is the least."],
  ["unit-8.json|The Days of the Week",
   "Lay out seven cards, one for each day, in a line from Monday to Sunday, then muddle them up and put them back in order. Singing the days to a tune you know fixes the order in your memory far better than saying them over and over."],
  ["unit-2.json|Line Symmetry and Simple Shape Patterns",
   "Fold a paper circle, square, rectangle and triangle in half and ask whether the two sides land exactly on top of each other. A circle folded through its middle always matches, and so does a square folded corner to corner or side to side. Butterflies and leaves are symmetrical too."],
  ["unit-2.json|Rolling and Stacking",
   "Test it. A sphere rolls everywhere, because it is curved all over. A cube stacks and will not roll, because every face is flat. A cylinder does both — it rolls on its curved side and stacks when it stands on a flat end, which is why a cube is the best shape for the bottom of a tower."],
  ["unit-6.json|Near, Far and Moving Directions",
   "Stand two toys at different spots and ask which one is near you and which is far away. Then try the direction words by acting them out: two steps forward, one step backward, reach your hand up, and now put it down."],
  ["unit-5.json|Doubling and Near Doubles",
   "Build both equal groups with real objects first: 3 stones in one hand and 3 in the other, pushed together and counted — double 3 is 6. Once the doubles up to double 5 feel secure, use them for near doubles, where the two numbers are almost the same: 5 + 6 is double 5 and one more."],
  ["unit-5.json|Adding Three Small Numbers by Spotting a Pair to 10",
   "With 6, 4 and 3, look for the two groups that make 10 — 6 and 4 — and put those together first. Then add the last group: 10 and 3 more is 13. The total is the same whichever order you add in, but spotting the pair to 10 makes it much quicker."],
  ["unit-2.json|Counting Sides and Corners; Straight or Curved",
   "A circle has one curved side and no corners. A triangle has 3 straight sides and 3 corners, and a square and a rectangle each have 4 straight sides and 4 corners. Sorting by the kind of side separates the circle, with its curved one, from the shapes that have only straight sides."],
  ["unit-4.json|Comparing Length — Long and Short",
   "Fair lining-up matters most here. To compare two sticks, line them up so one end starts at the same place — both against the edge of the mat — and then look at the other end. If one stick is pushed ahead of the other the comparison is not fair, and a short stick slid forward can look longer than it really is."],
  ["unit-12.json|Length and Height — Longer, Shorter, Taller",
   "The golden rule is to line objects up at one end. Put two pencils side by side with their bottoms level, then see which one sticks out further at the top — that one is longer. Without lining them up, a shorter pencil can look longer just because it is held higher."],
  ["unit-1.json|Ten-Frames",
   "Place 3 beans on the frame, then 6, then 10, and each time ask how many empty cups are left. Filling it the same way every time builds a picture of each number you can call to mind later, and noticing the empty cups is the first step towards the number bonds to ten."],
  ["unit-6.json|Following and Giving Position Instructions",
   "Play a treasure game: hide a small toy and give one clue at a time — look under the mat, now look behind the basket. Then swap over, so you are the one giving the clue and someone else follows it exactly. Giving the instruction is what shows you really know the word."],
  ["unit-4.json|Comparing Width — Wide and Thin",
   "Width is the trickiest of the three, because you look across a thing rather than up it or along it. Start with pairs where the difference is obvious — a wide ribbon and a thin one, a fat marker and a thin pencil — and sweep your finger from one side to the other as you say the word."],
  ["unit-8.json|Parts of the Day — Morning, Afternoon, Evening",
   "Walk through your own day in order: wake for Fajr and eat breakfast in the morning, lunch and play in the afternoon, Maghrib and dinner in the evening. The sun helps too — it comes up in the morning, sits high in the afternoon and goes down in the evening."],
  ["unit-7.json|Counting and Comparing Sets (more / fewer)",
   "After sorting, count each set aloud, touching each object once, and say the total: this set has 5, this set has 3. Then compare — 5 is more than 3. For the surest comparison, line the two sets up and match them into pairs; the set with objects left over is the one with more."],
  ["unit-12.json|Choosing the Right Tool",
   "Match the question to the tool. How heavy is the bag of flour goes to the balance scale, how much water is in the bottle to the measuring cup, how long is the snake to the ruler, and how hot is the soup to the thermometer. Asking why each time is what stops it being a guess."],
  ["unit-2.json|Faces, Edges and Curved Surfaces",
   "Turn a cube and count its flat faces — there are 6, and every one is a square. Run a finger along an edge, where two faces meet. A sphere has no flat faces and no edges at all, just one curved surface, which is why it rolls."],
  ["unit-1.json|Counting Real Objects (one-to-one)",
   "Place 5 dates in a row and touch each one as you say ‘one, two, three, four, five’. Then answer the question ‘how many altogether?’ — the last number you said is the total. Recounting instead of answering is the sign that this last step has not clicked yet."],
  ["unit-4.json|Ordering by Size",
   "Lay out three sticks of clearly different length. Find the shortest and put it first, then the shorter of the two that are left, and keep going until they are in a line. Read the line back — short, longer, longest — and then try it the other way round."],
  ["unit-12.json|Money — Coins and Paying the Exact Amount",
   "Hold each coin and say its value aloud, then set up a tiny pretend shop with a price on every item. Paying for a toy priced at 10 shillings means finding coins that make exactly 10, which is counting with a real reason behind it."],
  ["unit-12.json|Capacity — Full, Empty, Holds More",
   "Fill a small cup right to the top — that is full — and tip it out, and it is empty. To compare two containers, pour one into the other: if the jug is still not full after a cupful, the jug holds more than the cup."],
  ["unit-2.json|Sorting Shapes and Finding Them in Everyday Objects",
   "Make two spaces and sort by one rule at a time, saying the rule out loud: this pile is for shapes that can roll, this pile is for shapes that can stack. One rule at a time is what keeps a sort honest."],
  ["unit-5.json|Addition as Combining",
   "Put 3 dates in one group and 2 in another. Count each group, then push them together and count them all: 5. Say it out loud — 3 add 2 equals 5 — because saying the number sentence is what turns the actions into arithmetic."],
  ["unit-5.json|Adding 1 More",
   "Put 5 counters on the ten-frame, add 1 more and count: 6. Say it — 5 add 1 equals 6, the next counting number. Try it again from 6, 7, 8 and 9. It is like climbing stairs, where each ‘add 1’ is one step up."],
  ["unit-13.json|Bridging Through 10",
   "Show 8 counters on a ten-frame and 2 spaces are left, so 2 of the 5 fill it: 8 + 2 = 10. That leaves 3 of the 5 still to add, and 10 + 3 = 13. So 8 + 5 = 13, reached by bridging through the friendly ten."],
  ["unit-13.json|Combining and Taking Away in Stories",
   "Act the story out with real objects. There were 3 anjero on the plate and 10 more were added — are the groups being put together, or is some being taken away? Deciding that first is what chooses the number sentence."],
  ["unit-6.json|Above, Below, and Between",
   "Hold a toy bird high over a toy tree: the bird is above the tree. Put your hand under the table: your hand is below the table. For between, line up two cups and put a single date in the middle of them."],
  ["unit-6.json|On, Under, and the First Position Words",
   "Put a cup on the mat and say it: the cup is on the mat. Then move it under the low table — now the cup is under the table. Saying the position word a little louder than the rest of the sentence shows which word is doing the work."],
  ["unit-14.json|Finding All the Combinations",
   "With three coloured beads on a string, fix one bead first — say red at the front — and try both orders of the other two. Then fix a different bead first and do the same again. Working in that order is what proves you have found them all."],
  ["unit-4.json|Comparing Height — Tall and Short",
   "Put the two cups side by side so their bottoms rest on the same surface, and run your finger up the side of each one. The big cup is taller than the small cup, and the small cup is shorter than the big cup."],
  ["unit-12.json|Temperature — Hot, Warm, Cold",
   "At washing time, set out water that is safely cold, gently warm and cool, and feel each one. Then sort familiar things: the sun and hot soup are hot, bath water and camel milk are warm, and shade and cold water are cold."],
  ["unit-8.json|Reading O'clock Times",
   "Set the clock to 3 o'clock: the long hand is on 12 and the short hand is on 3. Move the short hand round and read each new time. Tying them to your own routine helps — school starts at 9 o'clock, lunch is at 12 o'clock."],
  ["unit-15.json|The Days of the Week",
   "Chant them to a tune you know, clapping once for each day, and lay out seven stones in a line so you can touch one as you say its name."],
  ["unit-5.json|Subtraction as Take Away",
   "Put 7 stones on the mat, take away 2, and count what is left: 5. Say it, then write it — 7 − 2 = 5 — pointing at each part of the sentence as you read it."],
  ["unit-4.json|Measuring with Blocks and Paper Clips",
   "Stand a toy next to a tower of blocks and count how many blocks reach its top: the doll is 6 blocks tall. Lay paper clips end to end beside a pencil and count them: the pencil is 7 paper clips long."],
  ["unit-9.json|Comparing and Ordering Numbers to 20",
   "Count two groups — 15 stones and 13 — then find both numbers on the number line to check. Say it out loud both ways: fifteen is greater than thirteen, and thirteen is less than fifteen."],
  ["unit-2.json|Meeting 2D Shapes (circle, square, rectangle, triangle)",
   "The circle is round like a plate, with one curved side and no corners. The square has 4 straight sides all the same length and 4 corners, and the rectangle has 4 straight sides too, but two of them are longer."],
  ["unit-3.json|Making Halves by Folding and Drawing",
   "Fold a paper circle so the two sides match exactly, then open it out and trace the fold line — that line splits the circle into two halves. Try it with a square and a rectangle before moving on to drawing the line yourself."],
  ["unit-13.json|Subtracting by Counting Back",
   "You had 16 dates and ate 4 — put a finger on 16 and hop back four times: 15, 14, 13, 12. Then say the whole sentence: 16 take away 4 is 12."],
  ["unit-12.json|Mass — Heavier and Lighter",
   "Hold a stone in one hand and a leaf in the other, and feel which one pulls down more. Then say it both ways: the stone is heavier than the leaf, and the leaf is lighter than the stone."],
  ["unit-13.json|Using the Number Line",
   "Draw a line from 0 to 20 with every number marked, or chalk a giant one on the ground so you can walk the jumps yourself — five steps forward, then two back."],
  ["unit-2.json|Meeting 3D Shapes (cube, sphere, cylinder)",
   "A sphere is round all over. A cube is a box shape with flat sides. A cylinder is like a tin — flat circles at each end and a curved side between them."],
  ["unit-14.json|Reading a Pictogram",
   "A pictogram needs a title, so you know what it is showing. Point to each row and count along it: mangoes — one, two, three, four, five."],
  ["unit-13.json|Adding by Counting On",
   "With 12 dates in one pile and 5 in another, hold 12 in your head and touch the 5 one at a time: 13, 14, 15, 16, 17."],
  ["unit-12.json|Balancing and Non-Standard Units",
   "Drop the stones in one by one, counting as you go, until the two sides sit level: four stones balance the mug, so the mug has the same mass as 4 stones."],
  ["unit-15.json|Reading Half Past Times",
   "Move the long hand from the 12 down to the 6 and watch the short hand slide between two numbers. At half past 2 it sits between the 2 and the 3."],
  ["unit-8.json|Meeting the Clock — the Two Hands",
   "Colour helps: make the short hour hand red and the long minute hand blue, and use the same two colours every time so the hands never get muddled."],
  ["unit-11.json|Half of a Set (share a group equally between two)",
   "Put out 6 dates and two plates, and deal them one at a time — one for this plate, one for that — until they are gone. Count one plate: 3 dates, which is half of 6."],
]);

// Sentences that are wrong rather than short: a pronoun left in the third
// person by an earlier voice conversion. Found while reading the 49, not by a
// pattern — "the rest of their life" names nobody the learner can see.
const FIXES = new Map([
  ["you will use for the rest of their life", "you will use for the rest of your life"],
  // "and to mark" is not a sentence, and "they" is the learner in the third
  // person — both left by an earlier conversion.
  ["Touch and count each side, and to mark a starting point so they do not go around twice.",
   "Touch and count each side, and mark a starting point so you do not go around twice."],
  ["You compare two objects and says which is longer", "You compare two objects and say which is longer"],
  // Written to the adult about the learner, in the middle of the learner's own
  // explainer: "you" is the grown-up and "children" is the child reading it.
  ["Children already live this rhythm — you are simply giving it names.",
   "You already live this rhythm every day; these are simply its names."],
  ["Someone who can count is ready for this: they simply count one group, count the other, push them together, and count them all.",
   "If you can count, you are ready for this: count one group, count the other, push them together, and count them all."],
  ["you first finds how many more are needed to reach the next ten, then adds what is left over",
   "you first find how many more are needed to reach the next ten, then add what is left over"],
  // "helping you hear" is the adult being told how to help; the skill is the
  // learner's.
  ["The skill here is helping you hear a story, decide whether to add or take away, and then write a simple number sentence to solve it.",
   "The skill here is hearing a story, deciding whether to add or take away, and then writing a simple number sentence to solve it."],
  ["You sort everyday things into these groups and learns that temperature helps us choose what to wear, eat, and drink.",
   "You sort everyday things into these groups and learn that temperature helps us choose what to wear, eat and drink."],
  // The learner is reading this; describing what "children love" puts them
  // outside their own explainer.
  ["which children love to notice", "which is an easy thing to notice"],
  ["which children love, and both can sit still", "which is easy to spot, and both can sit still"],
  ["you start at the bigger number and counts backward by the amount being taken away",
   "you start at the bigger number and count backward by the amount being taken away"],
  ["You compare two objects and says which is heavier", "You compare two objects and say which is heavier"],
  ["A 3D shape is one you can hold in their hand", "A 3D shape is one you can hold in your hand"],
  ["before asking you to make one", "before you make one yourself"],
  ["you start at the bigger number and counts forward by the smaller number",
   "you start at the bigger number and count forward by the smaller number"],
  // "to teach" addresses whoever is teaching; the habit is the learner's.
  ["The key habit to teach is:", "The key habit is:"],
]);

const stats = { added: 0, fixed: 0, alreadyFine: 0, stillShort: 0 };
const unhandled = [];
const pending = [];

for (const file of fs.readdirSync(UNITS).filter((f) => f.endsWith(".json")).sort()) {
  const full = path.join(UNITS, file);
  const unit = JSON.parse(fs.readFileSync(full, "utf8"));
  let touched = false;

  // The fixes run over every learner-facing string, not just concept
  // explanations. Stage 1 mirrors the same prose into more than one field — a
  // concept's explanation reappears as an exploration context and as a
  // reasoning modelAnswer — so repairing only the concept left the identical
  // broken sentence in two other places a learner reads.
  const fixStrings = (value, key) => {
    if (typeof value === "string") {
      if (key === "grownUpGuide") return value;
      let next = value;
      for (const [from, to] of FIXES) {
        if (!next.includes(from)) continue;
        next = next.split(from).join(to);
        stats.fixed += 1;
        touched = true;
      }
      return next;
    }
    if (Array.isArray(value)) return value.map((item) => fixStrings(item, key));
    if (value && typeof value === "object") {
      for (const [k, item] of Object.entries(value)) value[k] = fixStrings(item, k);
    }
    return value;
  };
  fixStrings(unit, null);

  for (const concept of unit.concepts || []) {
    let explanation = String(concept.explanation || "");

    if (explanation.length < FLOOR) {
      const addition = ADDITIONS.get(`${file}|${concept.title}`);
      if (!addition) {
        unhandled.push(`  ${file} · ${concept.title} — ${explanation.length} chars, needs +${FLOOR - explanation.length}, no sentences written for it`);
      } else if (explanation.includes(addition)) {
        stats.alreadyFine += 1;
      } else {
        explanation = `${explanation} ${addition}`.replace(/\s{2,}/g, " ").trim();
        stats.added += 1;
        touched = true;
        if (explanation.length < FLOOR) {
          stats.stillShort += 1;
          unhandled.push(`  ${file} · ${concept.title} — still ${explanation.length} chars after the addition`);
        }
      }
    } else {
      stats.alreadyFine += 1;
    }

    concept.explanation = explanation;
  }

  if (touched) pending.push([full, unit]);
}

console.log(`sentences appended: ${stats.added}`);
console.log(`pronoun fixes applied: ${stats.fixed}`);
console.log(`already at or above ${FLOOR}: ${stats.alreadyFine}`);

if (unhandled.length) {
  console.error(`\n✗ ${unhandled.length} concept(s) this file has no answer for:`);
  for (const line of unhandled) console.error(line);
  console.error("\nWrite the sentences into ADDITIONS. Nothing was written.");
  process.exit(1);
}

if (write) {
  for (const [file, unit] of pending) fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
  console.log(`\nWRITTEN: ${pending.length} unit file(s).`);
} else {
  console.log(`\nDry run — ${pending.length} unit file(s) would change. Re-run with --write to apply.`);
}
