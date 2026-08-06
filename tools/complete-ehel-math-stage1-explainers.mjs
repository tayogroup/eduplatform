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

  // ── "Correct this by …" ────────────────────────────────────────────────────
  // Eighteen errorFeedback lines start in the learner's voice and then turn to
  // the adult: "You might say 'false', thinking any two pieces count as halves.
  // Correct this by folding a shape and showing that…". errorFeedback is what a
  // learner is shown the moment they get something wrong, so the half that
  // matters most is addressed to somebody else.
  //
  // The correction becomes something the learner does. Nothing is dropped: the
  // folding, the dealing, the side-by-side comparison are all the check that
  // proves the answer, and they are what the learner needs.
  ["Correct this by folding a shape and showing that only matching folds count as equal halves.",
   "Check by folding a shape: only matching folds make equal halves."],
  ["Correct this by placing the two rope pieces side by side to show one is clearly longer.",
   "Place the two rope pieces side by side and you will see one is clearly longer."],
  ["Correct this by folding along each line and comparing the two resulting parts.",
   "Fold along each line and compare the two parts you get."],
  ["Correct this by demonstrating that any line through the centre of a circle makes two equal halves.",
   "Any line through the centre of a circle makes two equal halves — try a few and see."],
  ["Correct this by checking the curved edges line up all the way around when the halves are joined.",
   "Check that the curved edges line up all the way around when you join the halves."],
  ["Correct this by dealing one at a time so both children end up with the same number.",
   "Deal them one at a time instead, so both plates end up with the same number."],
  ["Correct this by dealing 6 counters one at a time onto two plates and counting each plate: 3 and 3.",
   "Deal 6 counters one at a time onto two plates and count each plate: 3 and 3."],
  ["Correct this by connecting the symbol to a real half, such as half an orange, every time it appears.",
   "Connect the symbol to a real half — half an orange — every time you see it."],
  ["Correct this by reminding them that equal size is what makes parts halves, not just having two pieces.",
   "Equal size is what makes parts halves, not just having two pieces."],
  ["Correct this by reminding them the original apple was the whole, and each equal piece is now a half of it.",
   "The original apple was the whole, and each equal piece is now a half of it."],
  ["Correct this by dealing 2 counters one at a time onto two plates: 1 and 1.",
   "Deal 2 counters one at a time onto two plates: 1 and 1."],
  ["Correct this by folding to find the middle before cutting, so both halves match.",
   "Fold to find the middle before cutting, so both halves match."],
  ["A buyer, or child, might accept any two pieces as 'halves' just because there are two. Correct this by comparing the two pieces side by side to check they truly match.",
   "A buyer might accept any two pieces as 'halves' just because there are two. Compare the two pieces side by side to check they truly match."],
  ["Correct this by pouring carefully and checking the water level in each cup matches before calling them equal.",
   "Pour carefully and check the water level in each cup matches before calling them equal."],
  ["Correct this by reminding them the loaf was one whole first, so each equal piece is a half of it.",
   "The loaf was one whole first, so each equal piece is a half of it."],
  ["Correct this by showing a clock: halfway between the 4 and the 5 is 'half past four'.",
   "Look at a clock: halfway between the 4 and the 5 is 'half past four'."],
  ["Correct this by dealing one at a time, back and forth, until all 10 are shared equally.",
   "Deal one at a time, back and forth, until all 10 are shared equally."],
  ["Demonstrate physically sliding the two cut halves back together to show it recreates the same whole circle.",
   "Slide the two cut halves back together and you will see it makes the same whole circle again."],

  // ── "Praise …" ─────────────────────────────────────────────────────────────
  // Four notes tell the adult how to encourage the learner. A learner cannot
  // praise themselves, so these are not repointed but recast as what the
  // estimate is actually worth — which is the teaching the note was carrying.
  ["Praise sensible guesses, not just correct ones – the goal is a thoughtful guess, not a lucky one.",
   "A thoughtful guess is worth more than a lucky one — the goal is to be close, not exactly right."],
  ["Praise thoughtful guesses, not just correct ones.",
   "A thoughtful guess is worth more than a lucky one."],
  ["Praise a sensible guess even when it is not exact, and after counting, compare the estimate with the real total so you see estimating as a useful first step, not a test to pass or fail.",
   "A sensible guess counts even when it is not exact. After counting, compare your estimate with the real total — estimating is a useful first step, not a test to pass or fail."],
  ["Praise a thoughtful guess, not just a lucky correct one — the aim is a sensible estimate in the right neighbourhood, such as ‘about fifteen’.",
   "A thoughtful guess is worth more than a lucky correct one — the aim is a sensible estimate in the right neighbourhood, such as ‘about fifteen’."],

  // Two more of the same defect in a different phrasing — "remind them" rather
  // than "Correct this by". Both describe the learner in the third person and
  // then tell somebody else what to say to them.
  ["Children often stop at 4 because they only count the sides they can see from one angle — remind them to turn the cube and count the hidden top and bottom faces too.",
   "It is easy to stop at 4, because those are the sides you can see from one angle. Turn the cube and count the hidden top and bottom faces too."],
  ["The tricky part for children is that at half past, the short hand sits between two numbers rather than on one — remind them to say the smaller of the two, the hour that has already passed, not the one it is moving towards.",
   "The tricky part is that at half past, the short hand sits between two numbers rather than on one. Say the smaller of the two — the hour that has already passed, not the one it is moving towards."],

  // ── "Children often …" ─────────────────────────────────────────────────────
  // Thirteen more of the same defect, in the phrasing the earlier patterns
  // missed. A learner reading "Children often stop at 4" is being described to
  // somebody else, in the third person, in the feedback they get for their own
  // wrong answer. Every one becomes what it is telling them: "it is easy to",
  // "you might", and then the check they can do themselves.
  ["Children often muddle them, so use them out loud many times a day in real situations.",
   "They are easy to muddle, so say them out loud many times a day in real situations."],
  ["Children often stop at 4 because they only count the sides they can see from one angle",
   "It is easy to stop at 4, counting only the sides you can see from one angle"],
  ["Children often write only 'STACK' because they usually see pots standing upright. Remind them to also test laying the pot on its side.",
   "It is easy to write only 'STACK', because you usually see pots standing upright. Test laying the pot on its side too."],
  ["Children often forget to count all four sides of the scarf if it is folded. Remind them to unfold it fully before counting.",
   "It is easy to miss sides of the scarf while it is folded. Unfold it fully before you count."],
  ["Children often draw a half that is too big or too small compared with the first half. Have them check both halves match by folding or measuring before finishing.",
   "It is easy to draw a half that is too big or too small next to the first one. Check both halves match, by folding or by measuring, before you finish."],
  ["Children often guess a line without folding first, making one part bigger than the other. Always fold to find the true middle before drawing the line.",
   "Guessing a line without folding first usually makes one part bigger than the other. Always fold to find the true middle before you draw the line."],
  ["Children often skip an event when counting order. Say each action aloud while holding up a finger for every step so the count matches the actions.",
   "It is easy to skip an event when counting order. Say each action aloud and hold up a finger for every step, so the count matches the actions."],
  ["Children often skip an event when counting order",
   "It is easy to skip an event when counting order"],
  ["Children often keep saying 'on' out of habit even after the object has moved. Ask them to point to where the object is now before naming the position word.",
   "It is easy to keep saying 'on' out of habit after the object has moved. Point to where the object is now before you name the position word."],
  ["Children often judge front/behind only from their own position, not the building's entrance. Show the door first, then decide front and behind from there.",
   "It is easy to judge front and behind from where you are standing rather than from the building's entrance. Find the door first, then decide front and behind from there."],
  ["Children often confuse '3rd in line' with '3 people in front'. Show the line physically and count only the people before Fatima, not including her.",
   "It is easy to confuse '3rd in line' with '3 people in front'. Lay the line out and count only the people before Fatima, not Fatima herself."],
  ["since children often reverse the digits (writing 31 for 13) if the writing is not tied to the spoken order",
   "since the digits are easy to reverse (writing 31 for 13) if the writing is not tied to the spoken order"],
  ["Children often hesitate or skip a number around fifteen or sixteen. Practise slowly, pointing to each number on a number track.",
   "It is easy to hesitate or skip a number around fifteen or sixteen. Practise slowly, pointing to each number on a number track."],

  // ── "have them …" / "ask them to …" ────────────────────────────────────────
  // These errorFeedback lines open in the learner's voice — "If you say '6 and
  // 8', you likely skipped 7" — and then hand the check to somebody else. The
  // check is exactly what the learner needs, so it simply becomes theirs.
  ["If you hesitate at a gap, have them count from 1 all the way along the track rather than jumping straight to it.",
   "If you hesitate at a gap, count from 1 all the way along the track rather than jumping straight to it."],
  ["have them count aloud from 3 all the way to 7 without stopping",
   "count aloud from 3 all the way to 7 without stopping"],
  ["ask them to count each group aloud before answering",
   "count each group aloud before answering"],
  ["model writing 3 slowly, saying 'curve, curve' as you go, and have them trace it several times",
   "write 3 slowly, saying 'curve, curve' as you go, and trace it several times"],
  ["have them count the whole track from 1 to 10 out loud, pointing to each spot",
   "count the whole track from 1 to 10 out loud, pointing to each spot"],
  ["have them compare the long and short sides of the matchbox",
   "compare the long and short sides of the matchbox"],
  ["have them push it gently and watch", "push it gently and watch"],
  ["have them count the die's flat faces (6, so cube) and check the football has none (so sphere)",
   "count the die's flat faces (6, so cube) and check the football has none (so sphere)"],
  ["have them check if all the faces are equal squares", "check whether all the faces are equal squares"],
  ["have them check that every face of the die is an equal square",
   "check that every face of the die is an equal square"],
  ["Some children like to make one big jump instead of several small ones. Both are fine. Small jumps (‘+1, +1, +1’) help someone who is still building confidence; one big jump (‘+5’) is quicker once they trust the answer. Choose, and celebrate whichever method they can explain clearly.",
   "Some people like to make one big jump instead of several small ones. Both are fine. Small jumps (‘+1, +1, +1’) help while you are still building confidence; one big jump (‘+5’) is quicker once you trust the answer. Choose whichever one you can explain clearly."],

  // ── "Children sometimes X. Remind them Y." ─────────────────────────────────
  // The learner described in the third person, then a fact addressed to whoever
  // is supervising. Both halves belong to the learner: "it is easy to …", and
  // then the fact, said to them.
  ["Remind them to turn the cube and count the hidden top and bottom faces too.",
   "Turn the cube and count the hidden top and bottom faces too."],
  ["Children sometimes call the can 🥫 a circle because its end looks round. Remind them the whole object is a 3D cylinder — circle is only the flat shape of its end.",
   "It is easy to call the can 🥫 a circle, because its end looks round. The whole object is a 3D cylinder — circle is only the flat shape of its end."],
  ["Children sometimes call the can 🥫 a circle because its end looks round. Remind them the whole object is a 3D cylinder",
   "It is easy to call the can 🥫 a circle, because its end looks round. The whole object is a 3D cylinder"],
  ["Children sometimes say 'rectangle' for any four-sided shape. Remind them a square's four sides must all be the same length; if two are longer, it is a rectangle instead.",
   "It is easy to say 'rectangle' for any four-sided shape. A square's four sides must all be the same length; if two are longer, it is a rectangle instead."],
  ["Some children count a side twice as a corner. Remind them to touch one corner at a time, moving in one direction around the shape.",
   "It is easy to count a side twice as a corner. Touch one corner at a time, moving in one direction around the shape."],
  ["Children may guess 'roll' because a book can slide. Remind them rolling needs a curved surface, and a book's sides and covers are all flat.",
   "You might guess 'roll' because a book can slide. Rolling needs a curved surface, and a book's sides and covers are all flat."],
  ["Children sometimes say 'square' because one face looks square. Remind them a square is flat and 2D, while the whole solid box is a cube.",
   "It is easy to say 'square' because one face looks square. A square is flat and 2D, while the whole solid box is a cube."],
  ["Children sometimes count a corner as an extra side. Remind them to touch along each straight edge, not the corner points, as they count.",
   "It is easy to count a corner as an extra side. Touch along each straight edge, not the corner points, as you count."],
  ["Children sometimes answer '0 sides' because the side is curved, not straight. Remind them a circle does have one side — it is just curved all the way round instead of straight.",
   "It is easy to answer '0 sides' because the side is curved, not straight. A circle does have one side — it is just curved all the way round instead of straight."],
  ["Children may say 'square' instead of 'cube'. Remind them square is the flat shape of one face, but the whole solid box is a cube.",
   "You might say 'square' instead of 'cube'. Square is the flat shape of one face, but the whole solid box is a cube."],
  ["Children sometimes think a curved line does not count as a 'side'. Remind them a circle's one curved side is still a side, just not straight.",
   "It is easy to think a curved line does not count as a 'side'. A circle's one curved side is still a side, just not straight."],
  ["Children may confuse a box with a cylinder if it has a round label. Remind them to check the shape of the box itself, not the picture on it.",
   "You might confuse a box with a cylinder if it has a round label. Check the shape of the box itself, not the picture on it."],
  ["Children sometimes count a rectangle's short and long sides differently, missing one. Remind them to go all the way around, touching all four edges.",
   "It is easy to count a rectangle's short and long sides differently and miss one. Go all the way around, touching all four edges."],
  ["ask them to try balancing a block on the pointed tip", "try balancing a block on the pointed tip"],
  ["Children sometimes answer '4 sides' by confusing a circle with a square. Remind them a circle is round all the way with no straight parts or corners.",
   "It is easy to answer '4 sides' by confusing a circle with a square. A circle is round all the way, with no straight parts or corners."],
  ["Buyers sometimes assume any two pieces cut from one item must be 'halves.' Remind them that only equal-size pieces count as halves — an unequal cut is not a half, even if there are two pieces.",
   "A buyer might assume any two pieces cut from one item must be 'halves.' Only equal-size pieces count as halves — an unequal cut is not a half, even if there are two pieces."],
  ["Buyers sometimes assume any two pieces cut from one item must be 'halves.' Remind them that only equal-size pieces count as halves",
   "A buyer might assume any two pieces cut from one item must be 'halves.' Only equal-size pieces count as halves"],
  ["Children sometimes say 'equal' just because there are two pieces, ignoring the size difference. Show the two pieces side by side so the size gap is obvious before answering.",
   "It is easy to say 'equal' just because there are two pieces, ignoring the size difference. Put the two pieces side by side so the size gap is obvious before you answer."],
  ["Some children cross a shape just because the line isn't perfectly straight, even though the two parts are still the same size. Focus on whether the SIZES match, not how neat the line looks.",
   "It is easy to cross out a shape just because the line isn't perfectly straight, even though the two parts are still the same size. Focus on whether the SIZES match, not on how neat the line looks."],
  ["Children sometimes think only rectangle-shaped pieces can be 'halves' and that triangles don't count. Remind them that any two equal-size parts are halves, whatever shape they are.",
   "It is easy to think only rectangle-shaped pieces can be 'halves' and that triangles don't count. Any two equal-size parts are halves, whatever shape they are."],
  ["Some children assume a diagonal line can never make true halves because it looks different from a straight-across line. Show that the two triangles are still equal in size, so they are still halves.",
   "You might assume a diagonal line can never make true halves, because it looks different from a straight-across line. The two triangles are still equal in size, so they are still halves."],
  ["Children sometimes colour a bit of both parts instead of one whole part. Remind them to colour ALL the way to the edges of just one part, and leave the other part completely empty.",
   "It is easy to colour a bit of both parts instead of one whole part. Colour ALL the way to the edges of just one part, and leave the other part completely empty."],
  ["Children may assume 'two pieces' automatically means 'two halves,' ignoring the segment count.",
   "You might assume 'two pieces' automatically means 'two halves', ignoring the segment count."],
  ["A common mistake is thinking whoever asks first should get the whole extra item. Remind them fair sharing means splitting into equal halves when there's one item for two people.",
   "A common mistake is thinking whoever asks first should get the whole extra item. Fair sharing means splitting into equal halves when there is one item for two people."],
  ["have them line up a real crayon and pencil at one end and look at which one reaches further",
   "line up a real crayon and pencil at one end and look at which one reaches further"],
  ["Ask yourself, 'Which one is third?' and have them point to it before you confirm.",
   "Ask yourself, 'Which one is third?' and point to it before you check."],
  ["Children sometimes say 'between' when only one object is nearby.",
   "It is easy to say 'between' when only one object is nearby."],
  ["Children sometimes point to the date being 'next to' one cup only. Ask them to check both sides",
   "It is easy to point to the date being 'next to' one cup only. Check both sides"],
  ["Children sometimes circle 'above' by mistake because the fish is drawn moving upward in the picture",
   "It is easy to circle 'above' by mistake, because the fish is drawn moving upward in the picture"],
  // A merged guide passage with no "How to teach it:" marker, so the split tool
  // never saw it. Only the two adult-addressed sentences move.
  ["Do not expect you to write ½ neatly — recognising it and reading it as ‘one half’ is plenty for Year 1.",
   "You do not need to write ½ neatly — recognising it and reading it as ‘one half’ is plenty for now."],
  ["Let them see this, then explain that some numbers cannot be split into two equal groups — that is why we practise with even numbers.",
   "You will see it happen, and it is why some numbers cannot be split into two equal groups — which is why we practise with even numbers."],

  // The last of Stage 1's third-person feedback. Same two shapes throughout:
  // "Children sometimes X" becomes "it is easy to X", and the instruction that
  // follows becomes the learner's own check.
  ["Emphasise the physical action of bringing the two groups together. Some children, once the groups are combined, will start counting the first group again from one. That is fine at first, but gently encourage counting on: start with the number already known and count the rest. For 3 add 2, you hold ‘3’ in mind and counts ‘four, five’ on the second group. Counting on is faster and shows real understanding, but it comes with time – do not force it before you are ready.",
   "The physical action of bringing the two groups together is what matters. Once they are combined, it is easy to start counting the first group again from one. That is fine at first, but counting on is the next step: start with the number you already know and count the rest. For 3 add 2, hold ‘3’ in mind and count ‘four, five’ on the second group. Counting on is faster and shows real understanding, and it comes with time — there is no hurry."],
  ["Once you can place several objects correctly, ask them to explain the rule for the circle in your own words",
   "Once you can place several objects correctly, explain the rule for the circle in your own words"],
  ["Children sometimes circle 'behind' if the dog is drawn small or far away. Remind them that distance does not matter — only which side of the house the dog is on.",
   "It is easy to circle 'behind' if the dog is drawn small or far away. Distance does not matter — only which side of the house the dog is on."],
  ["Children sometimes circle 'behind' if the dog is drawn small or far away. Remind them that distance does not matter",
   "It is easy to circle 'behind' if the dog is drawn small or far away. Distance does not matter"],
  ["Children sometimes confuse 'above' with 'on' because both can mean 'higher'. Remind them: above never touches, on always touches.",
   "It is easy to confuse 'above' with 'on', because both can mean 'higher'. Above never touches; on always touches."],
  ["Children sometimes circle 'below' because the nest is drawn underneath the bird in the picture. Remind them to focus on where the bird itself is, not the nest.",
   "It is easy to circle 'below' because the nest is drawn underneath the bird in the picture. Focus on where the bird itself is, not the nest."],
  ["Children sometimes circle 'next to' because they only notice one carrot at a time. Ask them to check both sides of the rabbit before choosing.",
   "It is easy to circle 'next to' when you notice only one carrot at a time. Check both sides of the rabbit before choosing."],
  ["Children sometimes count from the back of the line instead of the front.",
   "It is easy to count from the back of the line instead of the front."],
  ["Children sometimes count the engine itself as '1st carriage'. Remind them the engine leads the train — counting of carriages starts after the engine.",
   "It is easy to count the engine itself as '1st carriage'. The engine leads the train — counting of carriages starts after it."],
  ["Children sometimes mix up 2nd and 3rd when colours are involved. Have them point and say the ordinal word aloud for each carriage before answering.",
   "It is easy to mix up 2nd and 3rd when colours are involved. Point and say the ordinal word aloud for each carriage before answering."],
  ["Children sometimes order events by which they like best rather than which happens first.",
   "It is easy to order events by which you like best rather than which happens first."],
  ["Children sometimes think 'last' means the biggest village rather than the final position in order.",
   "It is easy to think 'last' means the biggest village rather than the final position in order."],
  ["Children may mix up which object goes with which position word when two instructions are given together. Repeat one instruction at a time and have you act it out before moving to the next.",
   "It is easy to mix up which object goes with which position word when two instructions come together. Take one instruction at a time and act it out before moving on to the next."],
  ["Children sometimes think 'between' names only one neighbour. Show physically: place three objects in a row and ask which one is between the other two.",
   "It is easy to think 'between' names only one neighbour. Place three objects in a row and see which one is between the other two."],
  ["Some children compare the wrong digit and pick 11. Count each group aloud to confirm 18 has more.",
   "It is easy to compare the wrong digit and pick 11. Count each group aloud to confirm 18 has more."],
  ["Some children compare the wrong digit and pick 11", "It is easy to compare the wrong digit and pick 11"],
  ["Children sometimes say 'thirty' instead of 'thirteen' because the words sound similar. Remind them: thirteen has a 1 in the tens place; thirty means 3 tens with no ones.",
   "It is easy to say 'thirty' instead of 'thirteen', because the words sound similar. Thirteen has a 1 in the tens place; thirty means 3 tens with no ones."],
  ["Children sometimes answer '19 ones' by forgetting to take away the ten first. Show the full ten-frame (10) plus the second frame with 9 counters.",
   "It is easy to answer '19 ones' by forgetting to take away the ten first. Look at the full ten-frame (10) plus the second frame with 9 counters."],
  ["Children sometimes guess a very large number like '100'. Remind them the pile is small, so the estimate should be somewhere between 10 and 20.",
   "It is easy to guess a very large number like '100'. The pile is small, so the estimate should be somewhere between 10 and 20."],
  ["Children sometimes confuse 'sixteen' with 'sixty'. Remind them sixteen means one ten and six ones, not six tens.",
   "It is easy to confuse 'sixteen' with 'sixty'. Sixteen means one ten and six ones, not six tens."],
  ["since children usually learn the forward sequence first and need separate practice to make the reverse just as automatic",
   "since the forward sequence usually comes first and the reverse needs its own practice to become just as automatic"],
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
