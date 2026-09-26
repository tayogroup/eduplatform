// Build Mathematics Grade 9, Unit 7: Shapes and Measurements.
//
// Eighth Grade 9 unit. Authored from the Stage 9 Learner's Book pages 140-161
// and Workbook pages 81-97.
//
// THREE SECTIONS, THREE OBJECTIVES:
//
//   7.1 Circumference and area of a circle -> 9Gg.01
//   7.2 Areas of compound shapes           -> 9Gg.03
//   7.3 Large and small units              -> 9Gg.02
//
// THE BOOK PUTS ONE SENTENCE IN BOLD AND IT IS THE WHOLE OF 7.1: "Notice that
// the formula for the circumference uses the DIAMETER while the formula for the
// area uses the RADIUS." Every circle mistake at this stage is that swap, so the
// unit leads with it, and the method for area begins by converting a given
// diameter to a radius before anything else happens.
//
// 9Gg.03 SAYS "ESTIMATE AND CALCULATE", so estimation is taught as a step rather
// than mentioned. A compound area is a sum of several pieces, and the commonest
// failure is not the arithmetic of one piece but losing or double-counting a
// piece - which an estimate catches and a recalculation does not.
//
// 7.3 IS WHERE STANDARD FORM COMES BACK. The book writes each prefix three ways
// - as a decimal, as a power of ten, and in words - because a learner who can say
// "1 nanometre = 1 x 10^-9 m" without being able to say "one billionth of a
// metre" has not understood it. Unit 1 taught the notation; this is where it
// means something physical, and the unit says so.
//
// A NOTE ON pi. The book uses three different values in three exercises - the
// calculator's pi, 3.14, and 3.142 - and requires answers to 3 significant
// figures, 1 decimal place and 2 decimal places respectively. That is
// deliberate: which value you are told to use is part of the question. The unit
// keeps all three and states the value in every item, because an answer is only
// checkable against the pi it was computed with.
//
//   node tools/build-ehel-math-g9-unit7.mjs [--write]

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-7.json");
const WRITE = process.argv.includes("--write");

const FW = path.resolve(HERE, "..", "src", "curriculum", "cambridge-mathematics-0862.json");
const fw = {};
(function walk(o) {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) return o.forEach(walk);
  if (typeof o.code === "string" && /^9Gg\.\d{2}$/.test(o.code)) fw[o.code] = o.text;
  Object.values(o).forEach(walk);
})(JSON.parse(fs.readFileSync(FW, "utf8")));

const OBJ = ["9Gg.01", "9Gg.03", "9Gg.02"];
for (const c of OBJ) if (!fw[c]) throw new Error("0862 has no " + c);

const outcomes = [
  "Use C = pi x d to find the circumference of a circle from its diameter.",
  "Use A = pi x r squared to find the area of a circle, converting a diameter to a radius first.",
  "Find the area and perimeter of a semicircle, remembering that the perimeter includes the straight edge.",
  "Work backwards from a circumference or an area to find a radius or diameter.",
  "Estimate the area of a compound shape before calculating it.",
  "Calculate the area of a compound shape by splitting it into rectangles, triangles and parts of circles.",
  "Find a missing length in a compound shape from the lengths that are given.",
  "Name and use very large and very small units, writing each as a power of ten and in words.",
];

const concepts = [
  {
    id: "concept-1-diameter-or-radius",
    title: "Circumference Uses the Diameter, Area Uses the Radius",
    explanation:
      "The book puts one sentence in bold and it is the whole of this section: the formula for the " +
      "circumference uses the DIAMETER while the formula for the area uses the RADIUS. " +
      "Two formulas, and the one thing to get right is which length each one wants. The circumference is " +
      "C = pi x d, using the DIAMETER. The area is A = pi x r squared, using the RADIUS. Almost every " +
      "wrong circle answer at this stage comes from putting one into the other's formula, and the fix is " +
      "mechanical: before you calculate an area, write down the radius, even when the question gave you " +
      "the diameter. Remember that the diameter is twice the radius, so the radius is the diameter " +
      "halved.",
    example:
      "A circle of radius 4 cm has area pi x 4 squared = pi x 16 = 50.3 cm squared to 3 significant " +
      "figures. A circle of diameter 7 m has radius 7 / 2 = 3.5 m, so its area is pi x 3.5 squared = " +
      "pi x 12.25 = 38.5 m squared. Using 7 instead of 3.5 would have given 154 - four times too big, " +
      "because squaring doubles the error.",
  },
  {
    id: "concept-2-which-pi",
    title: "Which Value of Pi, and How Far to Round",
    explanation:
      "Pi is irrational - Unit 1's word - so a circle's area can never be written exactly as a decimal. " +
      "Every answer is therefore rounded, and the question tells you two things you must obey: which " +
      "value of pi to use and how far to round. Using the calculator's pi, or 3.14, or 3.142, gives " +
      "slightly different answers, and all three are correct for their own instruction. An answer given " +
      "without saying which pi produced it cannot be checked by anyone.",
    example:
      "For a circle of radius 9 cm: with pi = 3.14 the area is 3.14 x 81 = 254.34, so 254.3 cm squared " +
      "to 1 decimal place. With the calculator's pi it is 254.469, so 254 cm squared to 3 significant " +
      "figures. Neither is wrong; they answer different instructions. Notice too that the units are " +
      "squared for an area and not for a circumference.",
  },
  {
    id: "concept-3-semicircles",
    title: "A Semicircle's Perimeter Is Not Half a Circle's",
    explanation:
      "Half a circle has half the area, and the arithmetic is simply to halve. Its PERIMETER is not half " +
      "the circumference, because cutting a circle in half creates a new straight edge - the diameter - " +
      "which is part of the boundary and was not there before. So the perimeter of a semicircle is half " +
      "the circumference PLUS the diameter. Area halves cleanly; perimeter does not, and that asymmetry " +
      "is the point of the section.",
    example:
      "A semicircle of radius 5 cm: the area is half of pi x 25, which is 39.3 cm squared to 3 " +
      "significant figures. The perimeter is half of pi x 10, which is 15.7, plus the diameter of 10, " +
      "giving 25.7 cm. Halving the circumference alone would have given 15.7 cm and left the flat side " +
      "out of a measurement of the boundary.",
  },
  {
    id: "concept-4-working-backwards",
    title: "Working Backwards to a Radius",
    explanation:
      "If you are told a circumference or an area, you can recover the circle. From a circumference, " +
      "divide by pi to get the diameter. From an area, divide by pi to get the radius squared and then " +
      "take the square root - and the square root is what people forget. Each step is the inverse of the " +
      "step that built the formula, done in reverse order, exactly as changing the subject of a formula " +
      "worked in Unit 2.",
    example:
      "A circle has circumference 31.4 cm. Then d = 31.4 / pi = 9.99 cm to 3 s.f., so the radius is about " +
      "5 cm - not exactly 5, because 31.4 is itself a rounded value. A circle has area 78.5 cm squared. " +
      "Then r squared = 78.5 / pi = 24.99, so r is the square root of that, about 5 cm. Stopping at 25 " +
      "would have given the radius as 25 cm instead of 5.",
  },
  {
    id: "concept-5-compound-shapes",
    title: "Split It, Estimate It, Then Add It",
    explanation:
      "A compound shape is made of simpler ones, so its area is a sum. The arithmetic of each piece is " +
      "easy; what goes wrong is the bookkeeping - a piece counted twice, or one left out, or a missing " +
      "length guessed instead of worked out. Two habits prevent all three. Estimate the whole thing " +
      "first, by treating it roughly as one rectangle, so you know the size of the answer before you " +
      "start. And label every piece, so you can count that you have used them all.",
    example:
      "A shape splits into a 5 by 4 rectangle and an 11 by 2 rectangle: 20 + 22 = 42 cm squared. Estimate " +
      "first - it fits inside about 11 by 6, so under 66, and it is clearly more than half of that, so " +
      "somewhere near 40. That estimate would immediately expose a forgotten piece or a doubled one. " +
      "Another shape splits into a triangle of base 12 and height 6, area half of 12 x 6 = 36, plus a " +
      "rectangle.",
  },
  {
    id: "concept-6-large-and-small-units",
    title: "Prefixes Are Powers of Ten With Names",
    explanation:
      "Every unit prefix is a power of ten wearing a name, and knowing all three ways of saying it is " +
      "what understanding it means: the decimal, the power of ten, and the words. Milli is a thousandth, " +
      "10^-3. Micro is a millionth, 10^-6. Nano is a billionth, 10^-9. Going up, kilo is a thousand, " +
      "10^3, mega a million, 10^6, and giga a billion, 10^9. This is Unit 1's standard form doing a job: " +
      "the same notation, now attached to real lengths, masses and capacities.",
    example:
      "1 microlitre = 0.000001 litres = 1 x 10^-6 L, and you can say it as 'a millionth of a litre' or " +
      "as 'there are a million microlitres in a litre'. 1 nanometre = 1 x 10^-9 m, a billionth of a " +
      "metre. Upwards: 1 kilolitre = 1 x 10^3 L, and 1 gigametre = 1 x 10^9 m. A tonne has its own name " +
      "rather than a prefix: 1 tonne = 1000 kg.",
  },
];

const methods = [
  { id: "method-1", outcomeId: "lo02", difficulty: "Core", title: "How to find the area of a circle",
    example: "Find the area of a circle of diameter 7 m, to 3 significant figures.",
    steps: ["Check whether you were given the radius or the diameter.",
      "If it was the diameter, halve it FIRST and write the radius down: r = 7 / 2 = 3.5 m.",
      "Write the formula: A = pi x r squared.",
      "Substitute and square before multiplying: pi x 3.5 squared = pi x 12.25.",
      "Round as instructed and write the squared unit: 38.5 m squared."] },
  { id: "method-2", outcomeId: "lo03", difficulty: "Core", title: "How to find a semicircle's perimeter",
    example: "Find the perimeter of a semicircle of radius 5 cm, to 3 s.f.",
    steps: ["Find the whole circle's circumference: pi x d = pi x 10 = 31.4 cm.",
      "Halve it for the curved part: 15.7 cm.",
      "Now add the straight edge, which is the diameter: 10 cm.",
      "Total perimeter = 15.7 + 10 = 25.7 cm.",
      "Check you have not simply halved the circumference - a boundary includes the flat side."] },
  { id: "method-3", outcomeId: "lo04", difficulty: "Core", title: "How to work backwards to a radius",
    example: "A circle has area 78.5 cm squared. Find its radius.",
    steps: ["Write the formula: A = pi x r squared.",
      "Divide the area by pi to isolate r squared: 78.5 / pi = 24.99.",
      "Take the square root - this is the step people miss: r = 5.0 cm.",
      "Check forwards: pi x 5 squared = 78.5. It agrees.",
      "Note the units are not squared for a length."] },
  { id: "method-4", outcomeId: "lo05", difficulty: "Core", title: "How to estimate a compound area",
    example: "Estimate the area of a shape that fits inside an 11 by 6 rectangle.",
    steps: ["Find the smallest rectangle the whole shape fits inside: 11 x 6 = 66.",
      "That is an upper bound - the answer must be less.",
      "Judge roughly what fraction of it the shape fills; here about two thirds.",
      "So estimate about 40 to 45 square units.",
      "Keep the estimate written down, and compare it with your calculated total."] },
  { id: "method-5", outcomeId: "lo06", difficulty: "Core", title: "How to calculate a compound area",
    example: "A shape splits into a 5 by 4 rectangle and an 11 by 2 rectangle.",
    steps: ["Split the shape and LABEL each piece A, B, C.",
      "Work out each piece separately: A = 5 x 4 = 20, B = 11 x 2 = 22.",
      "Count that you have used every piece and no piece twice.",
      "Add: 20 + 22 = 42 square centimetres.",
      "Compare with your estimate; a large disagreement means a piece is wrong, not the arithmetic."] },
  { id: "method-6", outcomeId: "lo08", difficulty: "Core", title: "How to describe a unit three ways",
    example: "Describe a nanometre.",
    steps: ["Say what it measures and whether it is large or small: a very small measure of length.",
      "Give its symbol: nm.",
      "Write it as a decimal: 1 nm = 0.000000001 m.",
      "Write it as a power of ten: 1 nm = 1 x 10^-9 m.",
      "Say it in words two ways: a billionth of a metre, and there are a billion nanometres in a metre."] },
];

const workedExamples = [
  { id: "we01", outcomeId: "lo02", difficulty: "Basic", twm: "characterising", title: "Area from a radius",
    prompt: "Find the area of a circle of radius 4 cm, using the calculator's pi, to 3 significant figures.",
    solution: "A = pi x r squared = pi x 4 squared = pi x 16 = 50.265..., which is 50.3 cm squared to 3 s.f. Square the radius first, then multiply by pi - and the unit is squared because an area is." },
  { id: "we02", outcomeId: "lo02", difficulty: "Core", twm: "critiquing", title: "Area from a diameter, and the usual error",
    prompt: "Find the area of a circle of diameter 7 m to 3 s.f. What answer would you get by using 7 as the radius, and why is the error so large?",
    solution: "The radius is 7 / 2 = 3.5 m, so A = pi x 3.5 squared = pi x 12.25 = 38.5 m squared. Using 7 as the radius gives pi x 49 = 154 m squared - four times too big, not twice, because the radius is squared and doubling a number quadruples its square. That is why halving the diameter must be the first line of working, not something done in your head." },
  { id: "we03", outcomeId: "lo01", difficulty: "Basic", twm: "characterising", title: "Circumference uses the diameter",
    prompt: "Find the circumference of a circle of radius 5 cm, to 3 s.f.",
    solution: "The formula needs the diameter, so d = 2 x 5 = 10 cm. C = pi x d = pi x 10 = 31.4 cm to 3 s.f. Note the unit is not squared - a circumference is a length." },
  { id: "we04", outcomeId: "lo02", difficulty: "Core", twm: "specialising", title: "Three values of pi, three answers",
    prompt: "Find the area of a circle of radius 9 cm using pi = 3.14 to 1 d.p., and again with the calculator's pi to 3 s.f. Are both correct?",
    solution: "With pi = 3.14: 3.14 x 81 = 254.34, so 254.3 cm squared to 1 d.p. With the calculator's pi: 254.469, so 254 cm squared to 3 s.f. Both are correct, because each obeys its own instruction. Pi is irrational, so no version is exact - which is why the question must state the value to use and an answer given without it cannot be checked." },
  { id: "we05", outcomeId: "lo02", difficulty: "Core", twm: "specialising", title: "Working to two decimal places",
    prompt: "Find the area of a circle of diameter 16 cm using pi = 3.142, to 2 d.p.",
    solution: "The radius is 16 / 2 = 8 cm. A = 3.142 x 8 squared = 3.142 x 64 = 201.088, which is 201.09 cm squared to 2 d.p." },
  { id: "we06", outcomeId: "lo03", difficulty: "Core", twm: "critiquing", title: "The semicircle's extra edge",
    prompt: "A semicircle has radius 5 cm. Find its area and its perimeter to 3 s.f.",
    solution: "The area is half the circle's: half of pi x 25 = 39.3 cm squared. The perimeter is NOT half the circumference. Half of pi x 10 is 15.7 cm of curve, but cutting the circle created a straight edge - the diameter, 10 cm - which is part of the boundary. So the perimeter is 15.7 + 10 = 25.7 cm. Area halves cleanly; perimeter does not." },
  { id: "we07", outcomeId: "lo04", difficulty: "Core", twm: "characterising", title: "Backwards from a circumference",
    prompt: "A circle has circumference 31.4 cm. Find its radius.",
    solution: "C = pi x d, so d = C / pi = 31.4 / pi = 9.9949 cm, which is 9.99 cm to 3 s.f. The radius is half of that, 5.00 cm to 3 s.f. Notice the diameter is 9.99 rather than exactly 10: the circumference 31.4 is itself a rounded version of pi x 10, so working backwards from it cannot return the 10 exactly. Each step undoes one step of the formula, in reverse order - the same idea as changing the subject in Unit 2." },
  { id: "we08", outcomeId: "lo04", difficulty: "Extension", twm: "critiquing", title: "Backwards from an area, and the forgotten root",
    prompt: "A circle has area 78.5 cm squared. Find its radius. Someone answers 25 cm - what did they do?",
    solution: "A = pi x r squared, so r squared = 78.5 / pi = 24.99, and r is the SQUARE ROOT of that, 5.0 cm. The person who answered 25 divided by pi and stopped, giving r squared rather than r. A quick sanity check exposes it: a circle of radius 25 cm would have an area of about 1963 cm squared, nowhere near 78.5." },
  { id: "we09", outcomeId: "lo05", difficulty: "Core", twm: "specialising", title: "Estimating before calculating",
    prompt: "A compound shape fits inside an 11 cm by 6 cm rectangle and fills roughly two thirds of it. Estimate its area, then calculate it exactly given that it splits into a 5 by 4 rectangle and an 11 by 2 rectangle.",
    solution: "The bounding rectangle is 11 x 6 = 66 cm squared, and two thirds of that is about 44 - so the answer should be near 40 to 45. Calculating: 5 x 4 = 20 and 11 x 2 = 22, so 20 + 22 = 42 cm squared. The estimate and the answer agree, which is the point of making the estimate first." },
  { id: "we10", outcomeId: "lo06", difficulty: "Core", twm: "characterising", title: "A rectangle and a triangle",
    prompt: "A compound shape splits into a triangle of base 12 cm and height 6 cm, and a rectangle 8 cm by 5 cm. Find the total area.",
    solution: "The triangle is half of base times height: half of 12 x 6 = 36 cm squared. The rectangle is 8 x 5 = 40 cm squared. Total 36 + 40 = 76 cm squared. Labelling the two pieces A and B and ticking each off is what stops one being counted twice or left out." },
  { id: "we11", outcomeId: "lo06", difficulty: "Extension", twm: "specialising", title: "A rectangle with a semicircle on top",
    prompt: "A shape is a rectangle 10 cm by 6 cm with a semicircle of diameter 10 cm on its top edge. Find the total area to 3 s.f.",
    solution: "The rectangle is 10 x 6 = 60 cm squared. The semicircle has radius 5, so its area is half of pi x 25 = 39.27 cm squared. Total 60 + 39.27 = 99.3 cm squared to 3 s.f. Note that the semicircle's diameter is the rectangle's width, which is how you know the radius is 5 rather than something you have to be told." },
  { id: "we12", outcomeId: "lo07", difficulty: "Extension", twm: "characterising", title: "Finding a missing length",
    prompt: "An L-shaped figure has an overall width of 11 cm and an overall height of 7 cm. A rectangular piece 6 cm wide has been removed from the bottom right, leaving a step 4 cm high. Find the two missing lengths.",
    solution: "The missing horizontal length is the overall width less the removed width: 11 - 6 = 5 cm. The missing vertical length is the overall height less the step: 7 - 4 = 3 cm. Neither was given and neither was guessed - each is a subtraction of lengths that were, and writing that subtraction down is what makes the working checkable." },
  { id: "we13", outcomeId: "lo08", difficulty: "Core", twm: "characterising", title: "Describing a microlitre three ways",
    prompt: "Describe a microlitre completely.",
    solution: "It is a very small measure of capacity, written uL. As a decimal, 1 uL = 0.000001 litres. As a power of ten, 1 uL = 1 x 10^-6 L. In words, it is a millionth of a litre - or equivalently, there are one million microlitres in a litre. All four statements say the same thing, and being able to move between them is what knowing the unit means." },
  { id: "we14", outcomeId: "lo08", difficulty: "Extension", twm: "generalising", title: "The pattern behind the prefixes",
    prompt: "Write milli, micro, nano, kilo, mega and giga as powers of ten, and say what the pattern is.",
    solution: "Milli is 10^-3, micro 10^-6, nano 10^-9; kilo is 10^3, mega 10^6, giga 10^9. The pattern is that each named step moves the index by three, in both directions, so the prefixes come in matching pairs about 1: milli with kilo, micro with mega, nano with giga. That is why standard form is the natural way to write them, and it is exactly Unit 1's notation being used for something physical." },
];

const practice = [
  { id: "p01", level: "Warm-up", prompt: "Find the area of a circle of radius 2 cm using pi = 3.14, to 1 d.p.", answer: "12.6 cm squared", hint: "3.14 x 4." },
  { id: "p02", level: "Warm-up", prompt: "Find the circumference of a circle of diameter 10 cm, to 3 s.f.", answer: "31.4 cm", hint: "pi x d." },
  { id: "p03", level: "Warm-up", prompt: "Write 1 milligram as a power of ten of a gram.", answer: "1 x 10^-3 g", hint: "Milli is a thousandth." },
  { id: "p04", level: "Core", prompt: "Find the area of a circle of radius 9 cm using pi = 3.14, to 1 d.p.", answer: "254.3 cm squared", hint: "Square 9 first." },
  { id: "p05", level: "Core", prompt: "Find the area of a circle of diameter 9 cm using pi = 3.142, to 2 d.p.", answer: "63.63 cm squared", hint: "The radius is 4.5." },
  { id: "p06", level: "Core", prompt: "Find the area and perimeter of a semicircle of radius 5 cm, to 3 s.f.", answer: "Area 39.3 cm squared; perimeter 25.7 cm", hint: "The perimeter includes the diameter." },
  { id: "p07", level: "Core", prompt: "A compound shape splits into a 5 by 4 rectangle and an 11 by 2 rectangle. Find its area.", answer: "42 cm squared", hint: "20 + 22." },
  { id: "p08", level: "Core", prompt: "A shape is a triangle of base 12 and height 6, plus a rectangle 8 by 5. Find its area.", answer: "76 cm squared", hint: "36 + 40." },
  { id: "p09", level: "Core", prompt: "Write 1 nanometre in words two different ways.", answer: "A billionth of a metre; and there are a billion nanometres in a metre.", hint: "Nano is 10^-9." },
  { id: "p10", level: "Challenge", prompt: "A circle has area 78.5 cm squared. Find its radius, and explain why 25 cm is wrong.", answer: "r squared = 78.5 / pi = 25, so r = 5 cm. 25 is r squared, not r - the square root step was missed. A radius of 25 cm would give an area near 1963 cm squared.", hint: "Divide by pi, then take the root." },
  { id: "p11", level: "Challenge", prompt: "A rectangle 10 cm by 6 cm has a semicircle of diameter 10 cm on top. Estimate the area, then calculate it to 3 s.f.", answer: "Estimate: 60 plus a bit under half of 10 x 10, so about 100. Exactly 60 + 39.27 = 99.3 cm squared.", hint: "The semicircle's radius is 5." },
  { id: "p12", level: "Challenge", prompt: "A memory card holds 32 GB. Write this in bytes as a power of ten, and say how many megabytes it is.", answer: "1 GB = 1 x 10^9 bytes, so 32 GB = 3.2 x 10^10 bytes. Since 1 GB = 1000 MB, it is 32 000 MB, or 3.2 x 10^4 MB.", hint: "Giga is 10^9 and mega is 10^6." },
];

const fluency = [
  { id: "fl01", outcomeId: "lo02", difficulty: "Round 1", prompt: "Area of a circle, radius 4 cm, to 3 s.f.", answer: "50.3 cm squared", hint: "pi x 16.", errorFeedback: "Square the radius first: pi x 16 = 50.265." },
  { id: "fl02", outcomeId: "lo01", difficulty: "Round 1", prompt: "Circumference of a circle, diameter 10 cm, to 3 s.f.", answer: "31.4 cm", hint: "pi x d.", errorFeedback: "pi x 10 = 31.4." },
  { id: "fl03", outcomeId: "lo02", difficulty: "Round 1", prompt: "Area of a circle, radius 2 cm, using pi = 3.14, to 1 d.p.", answer: "12.6 cm squared", hint: "3.14 x 4.", errorFeedback: "3.14 x 4 = 12.56." },
  { id: "fl04", outcomeId: "lo08", difficulty: "Round 1", prompt: "Write 1 milligram as a power of ten of a gram.", answer: "1 x 10^-3 g", hint: "A thousandth.", errorFeedback: "Milli means 10^-3." },
  { id: "fl05", outcomeId: "lo02", difficulty: "Round 2", prompt: "Area of a circle, diameter 7 m, to 3 s.f.", answer: "38.5 m squared", hint: "Halve the diameter first.", errorFeedback: "r = 3.5, so pi x 12.25 = 38.48." },
  { id: "fl06", outcomeId: "lo02", difficulty: "Round 2", prompt: "Area of a circle, radius 9 cm, using pi = 3.14, to 1 d.p.", answer: "254.3 cm squared", hint: "3.14 x 81.", errorFeedback: "3.14 x 81 = 254.34." },
  { id: "fl07", outcomeId: "lo06", difficulty: "Round 2", prompt: "Area of a 5 by 4 rectangle plus an 11 by 2 rectangle.", answer: "42 cm squared", hint: "Add the two.", errorFeedback: "20 + 22 = 42." },
  { id: "fl08", outcomeId: "lo08", difficulty: "Round 2", prompt: "Write 1 microlitre as a power of ten of a litre.", answer: "1 x 10^-6 L", hint: "A millionth.", errorFeedback: "Micro means 10^-6." },
  { id: "fl09", outcomeId: "lo03", difficulty: "Round 3", prompt: "Perimeter of a semicircle of radius 5 cm, to 3 s.f.", answer: "25.7 cm", hint: "Add the diameter.", errorFeedback: "15.7 of curve plus 10 of straight edge." },
  { id: "fl10", outcomeId: "lo04", difficulty: "Round 3", prompt: "A circle has area 78.5 cm squared. Find its radius.", answer: "5 cm", hint: "Divide by pi, then take the root.", errorFeedback: "78.5 / pi = 25, and the root of 25 is 5." },
  { id: "fl11", outcomeId: "lo06", difficulty: "Round 3", prompt: "Area of a triangle base 12, height 6, plus a rectangle 8 by 5.", answer: "76 cm squared", hint: "Half of 72, plus 40.", errorFeedback: "36 + 40 = 76." },
  { id: "fl12", outcomeId: "lo08", difficulty: "Round 3", prompt: "Write 1 gigametre as a power of ten of a metre.", answer: "1 x 10^9 m", hint: "Giga is a billion.", errorFeedback: "Giga means 10^9." },
];

const explorations = concepts.map((c, i) => ({
  id: "explore-" + (i + 1),
  outcomeId: "lo0" + [2, 2, 3, 4, 5, 8][i],
  difficulty: ["Discover", "Core", "Core", "Core", "Core", "Extension"][i],
  title: c.title,
  context: c.explanation,
  prompt: [
    "Find the area of a circle of diameter 7 m correctly, then again using 7 as the radius. How many times too big is the second answer, and why is it not two?",
    "Find the area of a circle of radius 9 cm three times: with pi = 3.14, pi = 3.142, and the calculator's pi. Which is correct?",
    "Find half of a circle's circumference, and then the actual perimeter of the semicircle. What is the difference, and where did it come from?",
    "A circle has area 78.5 cm squared. Divide by pi and stop. What have you found, and what is still needed?",
    "Estimate the area of a compound shape from its bounding rectangle, then calculate it. How close were you?",
    "Write milli, micro, nano, kilo, mega and giga as powers of ten. What is the pattern?",
  ][i],
  answer: [
    "Four times, because the radius is squared - doubling a number quadruples its square.",
    "All three, each for its own instruction. Pi is irrational so none is exact, which is why the question must state the value.",
    "The difference is the diameter, 10 cm - a new straight edge created by cutting the circle in half.",
    "You have found r squared, which is 25. The square root is still needed, giving r = 5.",
    "The bounding rectangle 11 by 6 gives 66 as an upper bound, two thirds is about 44, and the true answer is 42.",
    "Each named step moves the index by three, so they pair up: milli with kilo, micro with mega, nano with giga.",
  ][i],
  modelType: "concept-model-" + (i + 1),
  hint: [
    "What happens to a square when the side doubles?",
    "Read the instruction in the question.",
    "Draw the semicircle and trace its boundary with your finger.",
    "Compare 25 with a radius.",
    "Find the smallest rectangle it fits inside.",
    "Look at the indices in order.",
  ][i],
  explanation: c.example,
}));

const visualModels = concepts.map((c, i) => ({
  id: "model-" + (i + 1),
  outcomeId: "lo0" + [2, 2, 3, 4, 5, 8][i],
  title: c.title,
  modelType: "concept-model-" + (i + 1),
  purpose: c.explanation,
  defaultNumber: [4, 9, 5, 78.5, 42, 6][i],
}));

const activities = [
  { title: "Diameter or radius?", materials: "circular objects, string, ruler.",
    steps: ["Find six circular objects and measure the diameter of each.",
      "Work out each circumference and each area, writing the radius down as a separate line every time.",
      "Check one circumference by wrapping string round the object and measuring it.",
      "Say which measurement was harder to take accurately, and how much that affected the area."] },
  { title: "Three values of pi", materials: "calculator, paper.",
    steps: ["Pick five radii and work out each area three times: with 3.14, with 3.142, and with the calculator's pi.",
      "Tabulate the three answers side by side.",
      "Work out the percentage difference between 3.14 and the calculator's pi for each.",
      "Say at what radius the difference would start to matter for a real job, such as cutting a metal disc."] },
  { title: "The extra edge", materials: "paper circles, scissors.",
    steps: ["Cut several paper circles in half.",
      "Trace the boundary of a semicircle with a finger and count the parts of it.",
      "Measure the curved part with string and the straight part with a ruler.",
      "Compare their total with half the original circumference, and explain the difference.",
      "Repeat for a quarter circle, and work out what its perimeter includes."] },
  { title: "Split it your way", materials: "squared paper.",
    steps: ["Draw one compound shape and give copies to three people.",
      "Each person splits it differently and calculates the area.",
      "Compare the answers - they must agree even though the pieces differ.",
      "Where two disagreed, find whether a piece was missed or counted twice.",
      "Decide which split was easiest and say why."] },
  { title: "Estimate first, always", materials: "squared paper.",
    steps: ["Draw six compound shapes on squared paper.",
      "For each, write an estimate from the bounding rectangle BEFORE calculating.",
      "Calculate each area exactly.",
      "Record the estimate and the answer side by side.",
      "Deliberately leave a piece out of one calculation and check that your estimate would have caught it."] },
  { title: "Prefix wall", materials: "card, pens.",
    steps: ["Make a card for each prefix from nano up to giga.",
      "On each card write the name, the symbol, the decimal, the power of ten and the words.",
      "Arrange them in order on a wall with 1 in the middle.",
      "Find a real quantity measured in each one - a virus in nanometres, a drug dose in micrograms, a file in megabytes.",
      "Say which prefixes you had never met before and where they are used."] },
];

const realProblems = [
  { id: "rp01", outcomeId: "lo02", difficulty: "Core", context: "Home",
    prompt: "A circular tablecloth has diameter 140 cm. What area of fabric does it need, to 3 s.f.?",
    answer: "The radius is 70 cm, so the area is pi x 70 squared = pi x 4900 = 15 400 cm squared to 3 s.f., which is about 1.54 square metres.",
    hint: "Halve the diameter first.", errorFeedback: "Using 140 as the radius would give four times too much fabric." },
  { id: "rp02", outcomeId: "lo03", difficulty: "Core", context: "Work",
    prompt: "A semicircular window of radius 60 cm needs a metal strip round its whole edge. How long a strip, to 3 s.f.?",
    answer: "Half the circumference is half of pi x 120 = 188.5 cm, and the straight base adds the diameter, 120 cm. So the strip must be 188.5 + 120 = 308.5 cm, which is 308 cm to 3 s.f.",
    hint: "The boundary includes the flat bottom.", errorFeedback: "Halving the circumference alone leaves the window's base unframed." },
  { id: "rp03", outcomeId: "lo06", difficulty: "Core", context: "Home",
    prompt: "A room is an L-shape made of a 5 m by 4 m rectangle and an 11 m by 2 m rectangle. How much carpet is needed, and roughly what should you expect before calculating?",
    answer: "Estimate from a bounding rectangle of about 11 by 6, which is 66 square metres, so expect somewhat over half of that. Calculating: 5 x 4 = 20 and 11 x 2 = 22, so 42 square metres. The estimate confirms no piece has been lost.",
    hint: "Split it, label the pieces, and add.", errorFeedback: "20 + 22 = 42." },
  { id: "rp04", outcomeId: "lo04", difficulty: "Extension", context: "Work",
    prompt: "A circular pond is to have an area of 50 square metres. What radius should it be marked out to, to 2 s.f.?",
    answer: "r squared = 50 / pi = 15.92, so r is the square root of that, 3.99 m, which is 4.0 m to 2 s.f. Checking forwards, pi x 4 squared = 50.3 square metres, close to the target.",
    hint: "Divide by pi, then take the square root.", errorFeedback: "Stopping at 15.92 gives r squared, not r." },
  { id: "rp05", outcomeId: "lo08", difficulty: "Core", context: "Science",
    prompt: "A virus is about 100 nanometres across. Write this in metres in standard form, and say how many would fit across a 1 millimetre gap.",
    answer: "1 nm = 1 x 10^-9 m, so 100 nm = 1 x 10^-7 m. A millimetre is 1 x 10^-3 m, so the number that fit is 10^-3 divided by 10^-7 = 10^4, ten thousand of them.",
    hint: "Subtract the indices to divide.", errorFeedback: "-3 minus -7 is 4, so 10^4." },
  { id: "rp06", outcomeId: "lo08", difficulty: "Extension", context: "Work",
    prompt: "A memory card holds 32 GB. A photograph is 4 MB. How many photographs fit, and write the card's capacity in bytes in standard form?",
    answer: "1 GB = 1000 MB, so 32 GB = 32 000 MB, and 32 000 / 4 = 8000 photographs. In bytes, 1 GB = 1 x 10^9, so the card holds 32 x 10^9 = 3.2 x 10^10 bytes.",
    hint: "Work in megabytes for the count.", errorFeedback: "32 000 MB divided by 4 MB each." },
];

const reasoningPrompts = [
  { id: "reason01", outcomeId: "lo02", difficulty: "Core", responseMode: "text",
    prompt: "Why is using the diameter instead of the radius in the area formula an error of four times rather than two?",
    keyIdeas: ["The radius is squared", "Doubling a number quadruples its square", "The error is multiplied, not added"],
    modelAnswer: "The diameter is twice the radius, and the formula squares whatever you put in. Squaring a doubled number multiplies the result by 2 squared, which is 4 - so pi x 7 squared is four times pi x 3.5 squared, not twice. This is why the mistake is worth guarding against mechanically by writing the radius as a separate first line: an error that gets magnified by the formula is not one you can hope to spot in the final number." },
  { id: "reason02", outcomeId: "lo03", difficulty: "Core", responseMode: "text",
    prompt: "A semicircle's area is half a circle's, but its perimeter is not half the circumference. Why the difference?",
    keyIdeas: ["Cutting creates a new edge", "Area is enclosed space, unchanged by the cut", "The diameter joins the boundary"],
    modelAnswer: "Halving the circle halves the space inside it, so the area simply halves - the cut removes region but creates none. The boundary is different: the cut destroys half the curve but creates something that was not there before, a straight edge along the diameter, and that edge is part of what encloses the semicircle. So the perimeter is half the curve PLUS the diameter. The asymmetry is that a cut can add to a boundary while it can only subtract from an area." },
  { id: "reason03", outcomeId: "lo04", difficulty: "Core", responseMode: "text",
    prompt: "Why is an estimate a better check on a compound area than recalculating it?",
    keyIdeas: ["The failure is usually bookkeeping, not arithmetic", "Recalculating repeats the same split", "An estimate is independent of the split"],
    modelAnswer: "What usually goes wrong with a compound area is not the multiplication of one piece but the bookkeeping - a piece left out, counted twice, or a missing length guessed. Recalculating uses the same split and so repeats the same omission, often confidently. An estimate from the bounding rectangle does not depend on the split at all, so it can catch a missing piece: an answer of 20 against an estimate of 42 announces the problem, while re-multiplying 5 by 4 does not." },
  { id: "reason04", outcomeId: "lo02", difficulty: "Extension", responseMode: "text",
    prompt: "Three answers for the same circle's area, using 3.14, 3.142 and the calculator's pi, all differ. How can all three be correct?",
    keyIdeas: ["Pi is irrational", "Each obeys its own instruction", "An answer must state which pi was used"],
    modelAnswer: "Pi is irrational, so there is no exact decimal for it and no exact decimal for a circle's area. Every answer is therefore an approximation, and its accuracy is set by which value of pi was used and how far it was rounded - both of which the question specifies. An answer is correct when it obeys its own instruction, so 254.3 with pi = 3.14 and 254 with the calculator's pi are both right. What is NOT acceptable is giving an answer without saying which pi produced it, because then nobody can check it." },
  { id: "reason05", outcomeId: "lo08", difficulty: "Extension", responseMode: "text",
    prompt: "Why are the unit prefixes spaced three powers of ten apart, and why is standard form the natural way to write them?",
    keyIdeas: ["Each step is a factor of a thousand", "They pair up about 1", "Standard form makes the index visible"],
    modelAnswer: "Each named prefix is a thousand times the one below it, so the index moves by three each step: 10^-9, 10^-6, 10^-3, then 10^3, 10^6, 10^9. That makes them pair symmetrically about 1 - nano with giga, micro with mega, milli with kilo - so knowing one half gives you the other. Standard form is the natural notation because the index IS the prefix: reading 10^-6 tells you 'micro' directly, whereas 0.000001 has to be counted, and counting zeros is where errors come from." },
  { id: "reason06", outcomeId: "lo07", difficulty: "Core", responseMode: "text",
    prompt: "Why should a missing length in a compound shape be written as a subtraction rather than measured off the diagram?",
    keyIdeas: ["Diagrams are often not to scale", "A subtraction is checkable", "Measuring introduces an error that propagates"],
    modelAnswer: "Diagrams in a book are frequently not drawn to scale, and even when they are, measuring a printed length introduces an error that then multiplies into an area. The missing length is determined exactly by the lengths that are given - 11 minus 6, or 7 minus 4 - so it can be found with certainty rather than approximately. Writing the subtraction down also makes the step checkable by someone else, which a number read off a ruler is not." },
];

const reference = {
  rules: [
    { title: "Circumference Uses d, Area Uses r", text: "C = pi x d and A = pi x r squared. Convert a given diameter to a radius on its own line before finding an area." },
    { title: "Obey the Stated Pi", text: "The question says which value of pi to use and how far to round. An answer without that information cannot be checked." },
    { title: "A Semicircle's Perimeter Includes the Diameter", text: "Half the circumference plus the straight edge. The area simply halves; the perimeter does not." },
    { title: "Backwards Needs the Root", text: "From an area, divide by pi to get r squared and then take the square root." },
    { title: "Estimate, Split, Label, Add", text: "Estimate from the bounding rectangle first, then split, label every piece and add. The estimate catches a lost piece." },
    { title: "Prefixes Step by Three", text: "nano 10^-9, micro 10^-6, milli 10^-3, kilo 10^3, mega 10^6, giga 10^9." },
  ],
  terms: [
    ["Circumference", "The distance all the way round a circle"],
    ["Diameter", "A straight line through the centre, twice the radius"],
    ["Radius", "The distance from the centre to the edge"],
    ["Semicircle", "Half a circle, bounded by an arc and a diameter"],
    ["Compound shape", "A shape made from simpler shapes joined together"],
    ["Significant figures", "A way of rounding counted from the first non-zero digit"],
    ["Tonne", "A unit of mass equal to 1000 kilograms"],
    ["Prefix", "A name for a power of ten attached to a unit, such as milli or giga"],
  ],
  commonMistakes: [
    ["Using the diameter as the radius", "The answer comes out four times too big, because the radius is squared"],
    ["Halving the circumference for a semicircle's perimeter", "Add the diameter - the cut created a straight edge"],
    ["Forgetting the square root when working backwards", "Dividing an area by pi gives r squared, not r"],
    ["Forgetting to square the unit for an area", "An area is in cm squared; a circumference is in cm"],
    ["Measuring a missing length off the diagram", "Work it out by subtraction; diagrams are often not to scale"],
  ],
};

const assessment = {
  passPercent: 80,
  questions: [
    { id: "q01", type: "Application", outcomeId: "lo02", difficulty: "Basic", question: "The area of a circle of radius 4 cm, to 3 s.f., is:", options: ["50.3 cm squared", "25.1 cm squared", "12.6 cm squared", "201 cm squared"], answer: "50.3 cm squared", hint: "pi x 16.", explanation: "pi x 4 squared = 50.265, so 50.3 to 3 s.f." },
    { id: "q02", type: "Application", outcomeId: "lo01", difficulty: "Basic", question: "The circumference of a circle of diameter 10 cm, to 3 s.f., is:", options: ["31.4 cm", "78.5 cm", "15.7 cm", "62.8 cm"], answer: "31.4 cm", hint: "pi x d.", explanation: "pi x 10 = 31.4 cm." },
    { id: "q03", type: "Application", outcomeId: "lo02", difficulty: "Core", question: "The area of a circle of diameter 7 m, to 3 s.f., is:", options: ["38.5 m squared", "154 m squared", "22.0 m squared", "77.0 m squared"], answer: "38.5 m squared", hint: "Halve the diameter first.", explanation: "r = 3.5, so pi x 12.25 = 38.48." },
    { id: "q04", type: "Application", outcomeId: "lo03", difficulty: "Core", question: "The perimeter of a semicircle of radius 5 cm, to 3 s.f., is:", options: ["25.7 cm", "15.7 cm", "31.4 cm", "39.3 cm"], answer: "25.7 cm", hint: "Include the straight edge.", explanation: "15.7 of curve plus the 10 cm diameter." },
    { id: "q05", type: "Application", outcomeId: "lo06", difficulty: "Core", question: "A shape splits into a 5 by 4 rectangle and an 11 by 2 rectangle. Its area is:", options: ["42 cm squared", "40 cm squared", "66 cm squared", "22 cm squared"], answer: "42 cm squared", hint: "Add the pieces.", explanation: "20 + 22 = 42." },
    { id: "q06", type: "Application", outcomeId: "lo04", difficulty: "Core", question: "A circle has area 78.5 cm squared. Its radius is:", options: ["5 cm", "25 cm", "10 cm", "12.5 cm"], answer: "5 cm", hint: "Do not forget the root.", explanation: "78.5 / pi = 25, and the square root of 25 is 5." },
    { id: "q07", type: "Application", outcomeId: "lo08", difficulty: "Core", question: "1 nanometre in metres is:", options: ["1 x 10^-9 m", "1 x 10^-6 m", "1 x 10^-3 m", "1 x 10^9 m"], answer: "1 x 10^-9 m", hint: "Nano is a billionth.", explanation: "Nano means 10^-9." },
    { id: "q08", type: "Reasoning", outcomeId: "lo02", difficulty: "Extension", question: "Using the diameter as the radius makes an area:", options: ["Twice too big", "Four times too big", "Half as big", "Correct but in the wrong units"], answer: "Four times too big", hint: "The radius is squared.", explanation: "Doubling a number quadruples its square, so the error is a factor of 4." },
  ],
};

const games = {
  masteryScore: 3,
  games: [
    { id: "u7-game-1", icon: "?", skill: "Circles", title: "Quick Match: Circles", description: "Four short challenges on circumference and area.", type: "choice",
      rounds: [
        { prompt: "Area, radius 4 cm, 3 s.f.", choices: ["50.3", "25.1", "12.6", "201"], answer: "50.3", clue: "pi x 16." },
        { prompt: "Circumference, diameter 10 cm, 3 s.f.", choices: ["31.4", "78.5", "15.7", "62.8"], answer: "31.4", clue: "pi x d." },
        { prompt: "Area, diameter 7 m, 3 s.f.", choices: ["38.5", "154", "22.0", "77.0"], answer: "38.5", clue: "Halve it first." },
        { prompt: "Perimeter of a semicircle, radius 5 cm", choices: ["25.7", "15.7", "31.4", "39.3"], answer: "25.7", clue: "Add the diameter." },
      ] },
    { id: "u7-game-2", icon: "?", skill: "Areas and units", title: "Quick Match: Areas and Units", description: "Four short challenges on compound shapes and prefixes.", type: "choice",
      rounds: [
        { prompt: "5 by 4 plus 11 by 2", choices: ["42", "40", "66", "22"], answer: "42", clue: "20 + 22." },
        { prompt: "Triangle base 12 height 6, plus 8 by 5", choices: ["76", "112", "40", "36"], answer: "76", clue: "36 + 40." },
        { prompt: "1 microlitre in litres", choices: ["1 x 10^-6", "1 x 10^-3", "1 x 10^-9", "1 x 10^6"], answer: "1 x 10^-6", clue: "A millionth." },
        { prompt: "1 gigametre in metres", choices: ["1 x 10^9", "1 x 10^6", "1 x 10^3", "1 x 10^-9"], answer: "1 x 10^9", clue: "A billion." },
      ] },
  ],
};

const unit = {
  schemaVersion: "Ehel Mathematics Runtime v1.1",
  generatedAt: new Date().toISOString(),
  stage: { id: 9, label: "Stage 9" },
  subject: "Mathematics",
  term: { id: 2, label: "Term 2" },
  unit: {
    unitId: "math-g09-u07",
    unitNo: 7,
    unitTitle: "Shapes and Measurements",
    unitOverview:
      "Welcome to Unit 7. Two formulas run through the first part of this unit and the whole difficulty is " +
      "keeping them apart: the circumference uses the diameter, the area uses the radius. You will also " +
      "meet the fact that a semicircle's area is half a circle's while its perimeter is not, because " +
      "cutting a circle in half creates a straight edge that was not there before. Then you build up the " +
      "areas of shapes made from several simpler ones, estimating first so that a lost piece announces " +
      "itself. Finally you meet the very large and very small units - nano, micro, milli, kilo, mega, " +
      "giga - which is Unit 1's standard form arriving attached to real lengths, masses and capacities.",
    learningPath: "7.1 Circumference and area of a circle, 7.2 Areas of compound shapes, 7.3 Large and small units",
    reviewStatus: "Authored 2026-09-26 from the Stage 9 Learner's Book pages 140-161 and Workbook pages 81-97. Not yet curriculum-reviewed.",
  },
  cambridge: {
    level: "Cambridge Lower Secondary Mathematics",
    code: "0862",
    stage: 9,
    objectives: OBJ.map((c) => ({ code: c, text: fw[c] })),
    objectiveMapping: {
      status: "authored",
      reviewed: false,
      method:
        "Section by section: 7.1 -> 9Gg.01, 7.2 -> 9Gg.03, 7.3 -> 9Gg.02. 9Gg.03 says ESTIMATE and " +
        "calculate, so estimating from a bounding rectangle is taught as a step of the method rather " +
        "than mentioned - it is the only check that catches a lost or doubled piece, which is the real " +
        "failure mode. The other 9Gg objectives sit in unit 5 (.07 to .11, angles and Pythagoras) and " +
        "unit 14 (.04, .05, .06, volume, surface area and 3D symmetry). Objective texts are quoted " +
        "verbatim from cambridge-mathematics-0862.json.",
    },
  },
  provenance: {
    contentPackage: null,
    framework: "Cambridge Lower Secondary Mathematics 0862 - Stage 9",
    sourceArchive: null,
    sourceDocuments: ["Cambridge Lower Secondary Maths Learner's Book 9 (2ed, CUP), pages 140-161",
                      "Cambridge Lower Secondary Mathematics Workbook 9, pages 81-97"],
    sourceBlockCount: null,
    transformation:
      "Authored by hand from the Learner's Book and Workbook. Grade 9 has no content package: " +
      "outputs/math-content/math-content-model.json holds grades 1-8 only.",
    reviewStatus: "Not curriculum-reviewed",
  },
  media: { lectureStatus: "Video pending", lectureVideo: null, poster: null },
  outcomes,
  concepts,
  explorations,
  visualModels,
  methods,
  workedExamples,
  practice,
  activities,
  reference,
  fluency,
  realProblems,
  reasoningPrompts,
  assessment,
  games,
  selfAssessment: outcomes.map((o) => "I can " + o.charAt(0).toLowerCase() + o.slice(1)),
};

const json = JSON.stringify(unit, null, 2) + "\n";
if (WRITE) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, json, "utf8");
}
console.log("  Grade 9 Unit 7: " + outcomes.length + " outcomes, " + concepts.length + " concepts, " +
  workedExamples.length + " worked examples, " + practice.length + " practice, " + fluency.length +
  " fluency, " + realProblems.length + " real problems, " + reasoningPrompts.length + " reasoning, " +
  assessment.questions.length + " assessment, " + activities.length + " activities");
console.log("  objectives: " + OBJ.join(", "));
console.log("  " + json.length + " bytes " + (WRITE ? "written to " + path.relative(process.cwd(), OUT) : "(--write to save)"));
