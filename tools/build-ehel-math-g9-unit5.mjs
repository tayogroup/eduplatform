// Build Mathematics Grade 9, Unit 5: Angles.
//
// Sixth Grade 9 unit. Authored from the Stage 9 Learner's Book, unit 5
// (Learner's Book pages 106-127), and Workbook pages 66-76.
//
// FIVE SECTIONS, FIVE OBJECTIVES, one per section - the cleanest mapping in the
// grade so far:
//
//   5.1 Calculating angles              -> 9Gg.09
//   5.2 Interior angles of polygons     -> 9Gg.07
//   5.3 Exterior angles of polygons     -> 9Gg.08
//   5.4 Constructions                   -> 9Gg.11
//   5.5 Pythagoras' theorem             -> 9Gg.10
//
// 9Gg.07 SAYS "DERIVE AND USE", so the unit derives it rather than announcing
// it. The Learner's Book does this by splitting a polygon into triangles from
// one vertex - a pentagon gives three, a hexagon four - and the table it asks
// the learner to complete is what makes (n - 2) x 180 fall out. Handing over the
// formula and drilling it would satisfy "use" and fail "derive", which is
// exactly the gap CLAUDE.md warns about between a citation and the teaching
// behind it.
//
// TWO ERROR-FINDING EXAMPLES COME FROM THE BOOK and both are kept, because they
// are the two mistakes this unit exists to prevent:
//
//   - Ari computes a shorter side by ADDING the squares (Worked example 5.7):
//     a^2 = 6.0^2 + 3.5^2 = 48.25, a = 6.9. The hypotenuse is the 6.0, so it
//     must be a subtraction: 36 - 12.25 = 23.75 and a = 4.9.
//   - The diagonal of a 7.5 by 11.3 rectangle is sqrt(183.94) = 13.6 to 1 dp,
//     and the book stops to say that sqrt(183.94) is IRRATIONAL - a deliberate
//     link back to unit 1, which the unit keeps.
//
// 5.4 is the one section a screen cannot fully carry: it is ruler-and-compasses
// work on paper. The unit says so, gives the constructions as step sequences a
// learner follows with real instruments, and grounds each in the fact that makes
// it work (60 degrees comes from an equilateral triangle, 30 from bisecting it,
// 45 from bisecting a right angle).
//
//   node tools/build-ehel-math-g9-unit5.mjs [--write]

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-5.json");
const WRITE = process.argv.includes("--write");

const FW = path.resolve(HERE, "..", "src", "curriculum", "cambridge-mathematics-0862.json");
const fw = {};
(function walk(o) {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) return o.forEach(walk);
  if (typeof o.code === "string" && /^9Gg\.\d{2}$/.test(o.code)) fw[o.code] = o.text;
  Object.values(o).forEach(walk);
})(JSON.parse(fs.readFileSync(FW, "utf8")));

const OBJ = ["9Gg.09", "9Gg.07", "9Gg.08", "9Gg.11", "9Gg.10"];
for (const c of OBJ) if (!fw[c]) throw new Error("0862 has no " + c);

const outcomes = [
  "Choose which angle properties to use to find a missing angle, and give a reason for each step.",
  "Use the properties of triangles, quadrilaterals, parallel and intersecting lines together in one problem.",
  "Derive the formula for the sum of the interior angles of a polygon by splitting it into triangles.",
  "Find an interior angle of a regular polygon, and find the number of sides from an angle.",
  "Know that the exterior angles of any polygon sum to 360 degrees, and use it.",
  "Construct angles of 60, 45 and 30 degrees with ruler and compasses, and inscribe a regular polygon in a circle.",
  "Use Pythagoras' theorem to find the hypotenuse of a right-angled triangle.",
  "Use Pythagoras' theorem to find a shorter side, subtracting rather than adding the squares.",
];

const concepts = [
  {
    id: "concept-1-choosing-the-property",
    title: "Knowing the Facts Is Not the Skill",
    explanation:
      "By this stage you know a great many angle facts: angles on a straight line total 180 degrees, " +
      "angles in a triangle total 180, in a quadrilateral 360, angles round a point 360, alternate angles " +
      "are equal, and the base angles of an isosceles triangle are equal. The new skill is DECIDING which " +
      "of them to use, in what order, on a diagram that offers several routes. Writing the reason beside " +
      "each step is not decoration - it is what lets you and anyone else check the chain.",
    example:
      "Given an angle of 118 degrees on a straight line, x = 180 - 118 = 62. In the quadrilateral, the " +
      "fourth angle is 360 - (62 + 80 + 134) = 84. Angles DCF and ADC are alternate, so DCF is also 62. " +
      "Then y = 180 - (84 + 62) = 34. Four facts, each named, each depending on the one before.",
  },
  {
    id: "concept-2-interior-angle-sum",
    title: "Deriving the Interior Angle Sum",
    explanation:
      "You do not have to be told the sum of a polygon's angles - you can produce it. Choose one vertex " +
      "and join it to every other vertex. A pentagon splits into three triangles, a hexagon into four, an " +
      "octagon into six: always two fewer triangles than the polygon has sides. Every triangle contributes " +
      "180 degrees and all of that angle ends up inside the polygon, so the sum is (n - 2) x 180. The " +
      "formula is a record of the splitting, not a fact to memorise.",
    example:
      "A pentagon gives 3 triangles, so 3 x 180 = 540 degrees. A hexagon gives 4, so 720. An octagon " +
      "gives 6, so 1080, and a decagon 8, so 1440. In a REGULAR polygon all the angles are equal, so " +
      "divide: a regular pentagon has 540 / 5 = 108 degrees and a regular hexagon 720 / 6 = 120.",
  },
  {
    id: "concept-3-exterior-angles",
    title: "The Exterior Angles Always Total 360",
    explanation:
      "An exterior angle is the angle between one side extended and the next side. Walk all the way round " +
      "the outside of any polygon and you turn through each exterior angle in turn, ending up facing the " +
      "way you began - one complete turn, 360 degrees. That argument does not mention the number of " +
      "sides, which is why the total is 360 for a triangle, an octagon and a hundred-sided polygon alike. " +
      "In a regular polygon they are all equal, so each is 360 / n.",
    example:
      "A regular pentagon's exterior angle is 360 / 5 = 72 degrees, and 72 x 5 = 360. A regular octagon's " +
      "is 45. Working backwards, if an exterior angle is 40 degrees then n = 360 / 40 = 9 sides, and the " +
      "interior angle beside it is 180 - 40 = 140 degrees.",
  },
  {
    id: "concept-4-interior-and-exterior-together",
    title: "The Pair at Each Vertex Makes a Straight Line",
    explanation:
      "At every vertex the interior angle and the exterior angle sit on a straight line, so they add to " +
      "180 degrees. That single fact links the two sections and usually gives the shortest route: to find " +
      "a regular polygon's interior angle, find the exterior one by dividing 360 by n and subtract from " +
      "180. It also gives a second way to reach the interior sum, which is worth checking against the " +
      "first because two independent routes agreeing is real evidence.",
    example:
      "A regular octagon: exterior 360 / 8 = 45, so interior 180 - 45 = 135. Checking by the other route, " +
      "(8 - 2) x 180 = 1080 and 1080 / 8 = 135. The same number twice, from the triangles argument and " +
      "from the walking-round argument.",
  },
  {
    id: "concept-5-constructions",
    title: "Constructing With Ruler and Compasses",
    explanation:
      "A construction produces an exact angle without a protractor, and each one works because of a " +
      "shape you already know. 60 degrees comes from an equilateral triangle, whose angles must be equal " +
      "and total 180. 30 comes from bisecting that 60. 45 comes from bisecting a right angle, which you " +
      "make with a perpendicular bisector. A regular polygon is inscribed in a circle by stepping equal " +
      "arcs round the circumference. This section needs real paper, a sharp pencil and compasses - it " +
      "cannot be done by reading.",
    example:
      "To inscribe a square: draw a circle and a diameter, construct the perpendicular bisector of that " +
      "diameter, and the four points where the two diameters meet the circle are the square's vertices. " +
      "To get 60 degrees, draw a line segment, and with the compasses set to its length draw arcs from " +
      "both ends; joining an intersection to both ends makes an equilateral triangle.",
  },
  {
    id: "concept-6-pythagoras",
    title: "Pythagoras: Add for the Longest Side, Subtract for a Shorter One",
    explanation:
      "In a right-angled triangle the square on the hypotenuse equals the sum of the squares on the other " +
      "two sides. The hypotenuse is always the side opposite the right angle and is always the longest. " +
      "That is the whole theorem, and almost every mistake made with it is the same one: adding the " +
      "squares when you are looking for a SHORTER side. Identify the hypotenuse before you write anything " +
      "down, and let it decide whether you add or subtract.",
    example:
      "A rectangle 7.5 cm by 11.3 cm: the diagonal is the hypotenuse, so x^2 = 7.5^2 + 11.3^2 = 183.94 " +
      "and x = 13.6 cm to 1 dp. Note that the square root of 183.94 is irrational, exactly as in Unit 1 - " +
      "so the answer must be rounded and is never exact. Now a shorter side: if the hypotenuse is 6.0 and " +
      "one side is 3.5, then a^2 = 6.0^2 - 3.5^2 = 23.75 and a = 4.9 to 1 dp.",
  },
];

const methods = [
  { id: "method-1", outcomeId: "lo01", difficulty: "Core", title: "How to work through an angle chain",
    example: "An angle of 118 degrees sits on a straight line beside x, in a figure with a quadrilateral.",
    steps: ["Find any angle you can get in one step, and write the reason: x = 180 - 118 = 62, angles on a straight line.",
      "Look for what that unlocks. The quadrilateral now has three known angles.",
      "Use the quadrilateral sum: 360 - (62 + 80 + 134) = 84.",
      "Use a parallel-line fact where one applies: alternate angles give DCF = 62.",
      "Finish with the triangle: y = 180 - (84 + 62) = 34. Every step carries its reason."] },
  { id: "method-2", outcomeId: "lo03", difficulty: "Core", title: "How to derive the interior angle sum",
    example: "Find the sum of the interior angles of an octagon.",
    steps: ["Draw the polygon and pick one vertex.",
      "Join it to every vertex it is not already joined to.",
      "Count the triangles: an octagon gives 6, always two fewer than the number of sides.",
      "Multiply by 180: 6 x 180 = 1080 degrees.",
      "State the general result: (n - 2) x 180."] },
  { id: "method-3", outcomeId: "lo04", difficulty: "Core", title: "How to find an angle of a regular polygon",
    example: "Find the interior angle of a regular octagon, two ways.",
    steps: ["Route A: the interior sum is (8 - 2) x 180 = 1080, and all eight angles are equal, so 1080 / 8 = 135.",
      "Route B: the exterior angle is 360 / 8 = 45.",
      "The interior and exterior angles are on a straight line, so interior = 180 - 45 = 135.",
      "The two routes agree, which is the check."] },
  { id: "method-4", outcomeId: "lo05", difficulty: "Core", title: "How to find the number of sides from an angle",
    example: "The exterior angle of a regular polygon is 40 degrees. How many sides has it?",
    steps: ["Remember that all the exterior angles total 360, whatever n is.",
      "So n = 360 divided by the exterior angle: 360 / 40 = 9 sides.",
      "The interior angle is 180 - 40 = 140 degrees.",
      "Check: (9 - 2) x 180 = 1260, and 1260 / 9 = 140."] },
  { id: "method-5", outcomeId: "lo06", difficulty: "Core", title: "How to construct 60, 30 and 45 degrees",
    example: "Construct each angle with ruler and compasses only.",
    steps: ["For 60: draw a line segment, set the compasses to its length, and draw an arc from each end.",
      "Join an intersection of the arcs to both ends - the triangle is equilateral, so each angle is 60.",
      "For 30: bisect that 60 degree angle with two more arcs.",
      "For 45: construct a perpendicular to a line, giving 90, then bisect it.",
      "Leave all your construction arcs visible - they are the evidence that you constructed rather than measured."] },
  { id: "method-6", outcomeId: "lo08", difficulty: "Core", title: "How to use Pythagoras without the usual mistake",
    example: "A right-angled triangle has hypotenuse 6.0 cm and one side 3.5 cm. Find the other side.",
    steps: ["Find the right angle, and label the side OPPOSITE it as the hypotenuse. Here that is the 6.0.",
      "Ask what you are looking for. It is a shorter side, so you SUBTRACT.",
      "a^2 = 6.0^2 - 3.5^2 = 36 - 12.25 = 23.75.",
      "Take the square root: a = 4.9 cm to 1 dp.",
      "Sanity-check: a shorter side must come out smaller than 6.0, and 4.9 is."] },
];

const workedExamples = [
  { id: "we01", outcomeId: "lo01", difficulty: "Core", twm: "characterising", title: "A chain of angle facts",
    prompt: "An angle of 118 degrees lies on a straight line beside x. A quadrilateral in the same figure has angles x, 80 and 134 degrees, and angle DCF is alternate to angle ADC. Find x and y, where y completes a triangle with 84 and 62 degrees.",
    solution: "Angles on a straight line give x = 180 - 118 = 62. The quadrilateral's fourth angle is 360 - (62 + 80 + 134) = 84. Alternate angles make DCF = 62. The triangle then gives y = 180 - (84 + 62) = 34. The mathematics is easy; the work is choosing which fact to use when, and naming it." },
  { id: "we02", outcomeId: "lo02", difficulty: "Core", twm: "characterising", title: "The angles of a quadrilateral in terms of x",
    prompt: "The angles of a quadrilateral are x, (x + 10), (x + 20) and (x + 30) degrees. Find x and the largest angle.",
    solution: "They total 360, so 4x + 60 = 360, giving 4x = 300 and x = 75. The angles are 75, 85, 95 and 105 degrees, which sum to 360, and the largest is 105." },
  { id: "we03", outcomeId: "lo03", difficulty: "Core", twm: "generalising", title: "Splitting a polygon into triangles",
    prompt: "Split a pentagon, a hexagon and an octagon into triangles from one vertex. What is the pattern, and what formula follows?",
    solution: "A pentagon gives 3 triangles, a hexagon 4, an octagon 6 - always two fewer than the number of sides, because the two sides meeting at the chosen vertex do not each get a triangle of their own. Each triangle contributes 180 degrees, all of it inside the polygon, so the sum is (n - 2) x 180: 540, 720 and 1080 respectively." },
  { id: "we04", outcomeId: "lo03", difficulty: "Core", twm: "specialising", title: "A missing interior angle",
    prompt: "Four angles of a pentagon are 125 degrees each. Find the fifth.",
    solution: "A pentagon's angles total (5 - 2) x 180 = 540. Four of them come to 4 x 125 = 500, so the fifth is 540 - 500 = 40 degrees." },
  { id: "we05", outcomeId: "lo04", difficulty: "Core", twm: "characterising", title: "Angles of a regular polygon",
    prompt: "Find the interior angle of a regular pentagon, hexagon and octagon.",
    solution: "Divide each interior sum by the number of angles. Pentagon: 540 / 5 = 108. Hexagon: 720 / 6 = 120. Octagon: 1080 / 8 = 135. This division is only valid for a REGULAR polygon, where all the angles are equal." },
  { id: "we06", outcomeId: "lo05", difficulty: "Core", twm: "convincing", title: "Why the exterior angles always total 360",
    prompt: "Explain why the exterior angles of ANY polygon add to 360 degrees, whatever the number of sides.",
    solution: "Imagine walking once round the outside of the polygon. At each vertex you turn through that exterior angle, and when you arrive back at your starting point you are facing the direction you began - so your turns add to exactly one full revolution, 360 degrees. Nothing in that argument mentions n, which is why a triangle and a decagon both give 360." },
  { id: "we07", outcomeId: "lo05", difficulty: "Core", twm: "generalising", title: "Exterior angles of regular polygons",
    prompt: "Find the exterior angle of an equilateral triangle, a square, a regular pentagon, hexagon, octagon and decagon, and give a formula.",
    solution: "Divide 360 by the number of sides: 120, 90, 72, 60, 45 and 36 degrees. The formula is 360 / n. Each result also checks against the interior angle, since the two make a straight line - for the hexagon, 180 - 60 = 120, which is the interior angle found earlier." },
  { id: "we08", outcomeId: "lo05", difficulty: "Extension", twm: "specialising", title: "Working backwards to the number of sides",
    prompt: "A regular polygon has an exterior angle of 40 degrees. How many sides has it, and what is its interior angle?",
    solution: "Since all the exterior angles total 360 and they are equal, n = 360 / 40 = 9 sides. The interior angle is 180 - 40 = 140 degrees. Checking the other way: (9 - 2) x 180 = 1260 and 1260 / 9 = 140." },
  { id: "we09", outcomeId: "lo04", difficulty: "Extension", twm: "classifying", title: "Which regular polygons tile round a point",
    prompt: "Show that two squares and three equilateral triangles can meet at one point.",
    solution: "Angles round a point total 360. A square's angle is 90 and an equilateral triangle's is 60, so two squares and three triangles give 2 x 90 + 3 x 60 = 180 + 180 = 360. Exactly 360, so they fit with no gap and no overlap." },
  { id: "we10", outcomeId: "lo06", difficulty: "Core", twm: "characterising", title: "Inscribing a square in a circle",
    prompt: "Inscribe a square in a circle using ruler and compasses only.",
    solution: "Draw the circle and one diameter. Construct the perpendicular bisector of that diameter, which passes through the centre and is therefore a second diameter at right angles to the first. The four points where the two diameters cross the circle are the vertices of the square. It works because the two diameters are equal, bisect each other and are perpendicular, and that is exactly a square's diagonals." },
  { id: "we11", outcomeId: "lo06", difficulty: "Core", twm: "convincing", title: "Why the 60 degree construction works",
    prompt: "Construct an angle of 60 degrees, and then one of 30. Explain why the first is exactly 60.",
    solution: "Draw a line segment, set the compasses to its exact length, and draw an arc from each end; join an intersection to both ends. All three sides are that same compass width, so the triangle is equilateral. Its three angles are equal and total 180, so each is exactly 60 - no measurement involved. Bisecting that angle with two further arcs gives 30." },
  { id: "we12", outcomeId: "lo07", difficulty: "Core", twm: "characterising", title: "The diagonal of a rectangle",
    prompt: "A rectangle is 7.5 cm by 11.3 cm. Find the length of its diagonal.",
    solution: "The diagonal splits the rectangle into right-angled triangles in which it is the hypotenuse, so x^2 = 7.5^2 + 11.3^2 = 56.25 + 127.69 = 183.94, giving x = 13.6 cm to 1 decimal place. The square root of 183.94 is irrational, as in Unit 1, so the answer can only ever be a rounded one." },
  { id: "we13", outcomeId: "lo08", difficulty: "Core", twm: "critiquing", title: "Ari adds where he should subtract",
    prompt: "A right-angled triangle has hypotenuse 6.0 cm and one shorter side 3.5 cm. Ari writes a^2 = 6.0^2 + 3.5^2 = 48.25, so a = 6.9. Show that he is wrong and find the correct value.",
    solution: "His answer is 6.9, which is longer than the hypotenuse of 6.0 - impossible, since the hypotenuse is the longest side, and that settles it before looking at his method. His error is adding: a is a SHORTER side, so a^2 = 6.0^2 - 3.5^2 = 36 - 12.25 = 23.75 and a = 4.9 cm to 1 dp, which is properly less than 6.0." },
  { id: "we14", outcomeId: "lo08", difficulty: "Extension", twm: "improving", title: "Deciding add or subtract before calculating",
    prompt: "Describe a check you can do BEFORE any arithmetic that tells you whether to add or subtract the squares.",
    solution: "Find the right angle and name the side opposite it as the hypotenuse. If the side you want IS the hypotenuse, add the squares; if it is one of the others, subtract. Doing this first turns the commonest mistake into an impossible one, and it costs nothing. A second check afterwards: a shorter side must be less than the hypotenuse, and a hypotenuse must be more than either other side." },
];

const practice = [
  { id: "p01", level: "Warm-up", prompt: "What is the sum of the interior angles of a hexagon?", answer: "720 degrees", hint: "Four triangles." },
  { id: "p02", level: "Warm-up", prompt: "What is the exterior angle of a regular pentagon?", answer: "72 degrees", hint: "360 divided by 5." },
  { id: "p03", level: "Warm-up", prompt: "A right-angled triangle has shorter sides 6 cm and 8 cm. Find the hypotenuse.", answer: "10 cm", hint: "Add the squares." },
  { id: "p04", level: "Core", prompt: "Four angles of a pentagon are 125 degrees each. Find the fifth.", answer: "40 degrees", hint: "The sum is 540." },
  { id: "p05", level: "Core", prompt: "Find the interior angle of a regular decagon.", answer: "144 degrees", hint: "Either route works." },
  { id: "p06", level: "Core", prompt: "The angles of a quadrilateral are x, x + 10, x + 20 and x + 30. Find x.", answer: "75", hint: "They total 360." },
  { id: "p07", level: "Core", prompt: "A regular polygon has an exterior angle of 45 degrees. How many sides?", answer: "8", hint: "360 divided by 45." },
  { id: "p08", level: "Core", prompt: "A right-angled triangle has hypotenuse 13 cm and one side 5 cm. Find the other side.", answer: "12 cm", hint: "Subtract the squares." },
  { id: "p09", level: "Core", prompt: "Construct an angle of 45 degrees with ruler and compasses. Describe your steps.", answer: "Construct a perpendicular to give 90 degrees, then bisect it. Leave the arcs showing.", hint: "Start from a right angle." },
  { id: "p10", level: "Challenge", prompt: "A regular polygon has an interior angle of 156 degrees. How many sides?", answer: "15, because the exterior angle is 180 - 156 = 24 and 360 / 24 = 15.", hint: "Find the exterior angle first." },
  { id: "p11", level: "Challenge", prompt: "Show that three regular hexagons meet exactly at a point, and that three regular pentagons do not.", answer: "A hexagon's angle is 120, and 3 x 120 = 360, so they fit exactly. A pentagon's is 108, and 3 x 108 = 324, which leaves a 36 degree gap.", hint: "Angles round a point total 360." },
  { id: "p12", level: "Challenge", prompt: "A rectangle is 7.5 cm by 11.3 cm. Find its diagonal to 1 dp, and say why the answer cannot be exact.", answer: "x^2 = 183.94, so x = 13.6 cm. The square root of 183.94 is irrational, so no decimal can write it exactly.", hint: "The diagonal is a hypotenuse." },
];

const fluency = [
  { id: "fl01", outcomeId: "lo03", difficulty: "Round 1", prompt: "Sum of the interior angles of a pentagon?", answer: "540 degrees", hint: "Three triangles.", errorFeedback: "(5 - 2) x 180 = 540." },
  { id: "fl02", outcomeId: "lo03", difficulty: "Round 1", prompt: "Sum of the interior angles of an octagon?", answer: "1080 degrees", hint: "Six triangles.", errorFeedback: "(8 - 2) x 180 = 1080." },
  { id: "fl03", outcomeId: "lo05", difficulty: "Round 1", prompt: "Sum of the exterior angles of a decagon?", answer: "360 degrees", hint: "It is the same for every polygon.", errorFeedback: "One complete turn, whatever n is." },
  { id: "fl04", outcomeId: "lo07", difficulty: "Round 1", prompt: "Hypotenuse of a right-angled triangle with sides 6 and 8?", answer: "10", hint: "36 + 64.", errorFeedback: "100, so the hypotenuse is 10." },
  { id: "fl05", outcomeId: "lo04", difficulty: "Round 2", prompt: "Interior angle of a regular hexagon?", answer: "120 degrees", hint: "720 divided by 6.", errorFeedback: "720 / 6 = 120." },
  { id: "fl06", outcomeId: "lo04", difficulty: "Round 2", prompt: "Interior angle of a regular octagon?", answer: "135 degrees", hint: "Either route.", errorFeedback: "180 - 45 = 135." },
  { id: "fl07", outcomeId: "lo05", difficulty: "Round 2", prompt: "Exterior angle of a regular octagon?", answer: "45 degrees", hint: "360 divided by 8.", errorFeedback: "360 / 8 = 45." },
  { id: "fl08", outcomeId: "lo08", difficulty: "Round 2", prompt: "Hypotenuse 13, one side 5. Find the other side.", answer: "12", hint: "Subtract the squares.", errorFeedback: "169 - 25 = 144, so 12." },
  { id: "fl09", outcomeId: "lo05", difficulty: "Round 3", prompt: "Exterior angle 40 degrees. How many sides?", answer: "9", hint: "360 divided by 40.", errorFeedback: "360 / 40 = 9." },
  { id: "fl10", outcomeId: "lo04", difficulty: "Round 3", prompt: "Interior angle 156 degrees. How many sides?", answer: "15", hint: "Find the exterior angle first.", errorFeedback: "Exterior 24, and 360 / 24 = 15." },
  { id: "fl11", outcomeId: "lo02", difficulty: "Round 3", prompt: "Angles of a quadrilateral are x, x+10, x+20, x+30. Find x.", answer: "75", hint: "4x + 60 = 360.", errorFeedback: "4x = 300, so x = 75." },
  { id: "fl12", outcomeId: "lo07", difficulty: "Round 3", prompt: "Diagonal of a 7.5 by 11.3 rectangle, to 1 dp?", answer: "13.6", hint: "Add the squares, then take the root.", errorFeedback: "183.94, whose root is 13.6 to 1 dp." },
];

const explorations = concepts.map((c, i) => ({
  id: "explore-" + (i + 1),
  outcomeId: "lo0" + [1, 3, 5, 4, 6, 8][i],
  difficulty: ["Discover", "Core", "Core", "Core", "Core", "Extension"][i],
  title: c.title,
  context: c.explanation,
  prompt: [
    "In a figure with a straight line, a quadrilateral and a pair of parallel lines, find one angle you can get in a single step. What does it unlock?",
    "Split a pentagon, hexagon and octagon into triangles from one vertex. How many each time, and why two fewer than the sides?",
    "Work out the exterior angle of a regular triangle, square, pentagon, hexagon, octagon and decagon. What do they all have in common?",
    "Find a regular octagon's interior angle two different ways. Do they agree?",
    "Construct 60 degrees with compasses. Why is it exactly 60 rather than approximately?",
    "Ari says a shorter side is sqrt(6.0^2 + 3.5^2) = 6.9. What single observation shows he is wrong?",
  ][i],
  answer: [
    "The straight line gives 62 in one step, which makes the quadrilateral's fourth angle findable, and that makes the triangle findable.",
    "3, 4 and 6. Two fewer because the two sides meeting at the chosen vertex do not each get their own triangle.",
    "120, 90, 72, 60, 45, 36. Each is 360 divided by the number of sides, and each set multiplies back to 360.",
    "Yes, 135 both ways: 1080 / 8, and 180 - 45. Agreement from two independent arguments is real evidence.",
    "Because all three sides are set to one compass width, so the triangle is equilateral and its equal angles must total 180.",
    "6.9 is longer than the hypotenuse of 6.0, which is impossible - so he must have added where he should have subtracted.",
  ][i],
  modelType: "concept-model-" + (i + 1),
  hint: [
    "Which fact needs only one known angle?",
    "Count the triangles, then count the sides.",
    "Try dividing 360 by the number of sides.",
    "One route uses triangles, the other a straight line.",
    "What is the length of every side you drew?",
    "Compare his answer with the hypotenuse.",
  ][i],
  explanation: c.example,
}));

const visualModels = concepts.map((c, i) => ({
  id: "model-" + (i + 1),
  outcomeId: "lo0" + [1, 3, 5, 4, 6, 8][i],
  title: c.title,
  modelType: "concept-model-" + (i + 1),
  purpose: c.explanation,
  defaultNumber: [62, 5, 360, 8, 60, 13][i],
}));

const activities = [
  { title: "Name every reason", materials: "printed angle diagrams, paper.",
    steps: ["Take four diagrams with several missing angles each.",
      "Work through one, writing the REASON beside every step, not just the number.",
      "Swap with a partner and check that each reason really justifies its step.",
      "Find a diagram where you and your partner used different routes to the same answer, and compare them."] },
  { title: "Derive the formula yourself", materials: "paper, ruler.",
    steps: ["Draw a quadrilateral, pentagon, hexagon, octagon and decagon.",
      "Split each into triangles from one vertex and count them.",
      "Make a table of sides, triangles and angle sum.",
      "Write the formula your table shows, then test it on a polygon you have not drawn.",
      "Explain in one sentence why the triangle count is always two fewer than the sides."] },
  { title: "Walk the polygon", materials: "chalk or tape, an open floor.",
    steps: ["Mark out a large polygon on the floor - any shape, not necessarily regular.",
      "Walk once round the outside, turning at each corner.",
      "Have a partner record the turn at each vertex with a protractor or estimate.",
      "Add the turns and compare with 360.",
      "Repeat with a polygon of a different number of sides and say why the total did not change."] },
  { title: "Construction workshop", materials: "compasses, a sharp pencil, ruler, plain paper.",
    steps: ["Construct 60, 30 and 45 degrees, leaving every arc visible.",
      "Check each with a protractor and record how far off you were.",
      "Inscribe a square in a circle, then an equilateral triangle, then a regular hexagon.",
      "For the hexagon, note what compass setting you used and why it works.",
      "Write which construction was hardest to keep accurate, and what caused the error."] },
  { title: "Tiling test", materials: "card, scissors, protractor.",
    steps: ["Cut several copies each of an equilateral triangle, square, regular pentagon, hexagon and octagon.",
      "Try to fit copies of ONE shape round a single point with no gap.",
      "Record which work and calculate the angle sum in each case.",
      "Then find a MIXED set that works, such as two squares and three triangles.",
      "Explain the rule that decides whether a set fits."] },
  { title: "Add or subtract, decided first", materials: "paper.",
    steps: ["Draw eight right-angled triangles, marking the right angle on each and labelling two sides.",
      "For each, write 'ADD' or 'SUBTRACT' before doing any arithmetic.",
      "Then calculate the missing side.",
      "Check each answer against the rule that the hypotenuse is the longest side.",
      "Count how many you would have got wrong without deciding first."] },
];

const realProblems = [
  { id: "rp01", outcomeId: "lo07", difficulty: "Core", context: "Work",
    prompt: "A door frame is 7.5 cm by 11.3 cm in cross-section. A carpenter needs the diagonal of that cross-section to 1 decimal place. What is it?",
    answer: "x^2 = 7.5^2 + 11.3^2 = 183.94, so x = 13.6 cm to 1 dp. The exact value is irrational, so 13.6 is the best a measurement can be.",
    hint: "The diagonal is the hypotenuse.", errorFeedback: "56.25 + 127.69 = 183.94." },
  { id: "rp02", outcomeId: "lo08", difficulty: "Core", context: "Work",
    prompt: "A 6.0 m ladder leans against a wall with its foot 3.5 m from the base. How far up the wall does it reach, to 1 dp?",
    answer: "The ladder is the hypotenuse, so the height is a SHORTER side: h^2 = 6.0^2 - 3.5^2 = 23.75, giving h = 4.9 m. The answer must be less than 6.0, and it is.",
    hint: "Which length is the hypotenuse?", errorFeedback: "Subtract: 36 - 12.25 = 23.75." },
  { id: "rp03", outcomeId: "lo04", difficulty: "Core", context: "Home",
    prompt: "A floor is to be tiled with regular hexagons. Show that they fit round a point with no gaps, and explain why regular pentagons would not.",
    answer: "A regular hexagon's interior angle is 720 / 6 = 120, and 3 x 120 = 360, so three meet exactly at a point. A regular pentagon's is 540 / 5 = 108, and 3 x 108 = 324, leaving a 36 degree gap, while 4 x 108 = 432 overlaps.",
    hint: "Angles round a point total 360.", errorFeedback: "Divide 360 by the interior angle and see whether you get a whole number." },
  { id: "rp04", outcomeId: "lo05", difficulty: "Extension", context: "Home",
    prompt: "A paving stone is a regular polygon whose corners each measure 156 degrees. How many sides has it?",
    answer: "The exterior angle is 180 - 156 = 24 degrees, and all the exterior angles total 360, so n = 360 / 24 = 15 sides.",
    hint: "Go via the exterior angle.", errorFeedback: "180 - 156 = 24, then 360 / 24." },
  { id: "rp05", outcomeId: "lo06", difficulty: "Core", context: "Work",
    prompt: "A metalworker must mark a 30 degree angle on a plate and has no protractor, only a ruler and compasses. Describe what to do and why it is exact.",
    answer: "Construct an equilateral triangle by setting the compasses to the length of a drawn segment and striking arcs from both ends; joining an intersection to both ends gives an angle of exactly 60 degrees, because the triangle's three equal angles must total 180. Bisecting that angle with two further arcs gives exactly 30. No measurement is involved, so there is no measuring error.",
    hint: "Get 60 first.", errorFeedback: "Bisect the 60 degree angle you constructed." },
  { id: "rp06", outcomeId: "lo01", difficulty: "Extension", context: "Home",
    prompt: "A window is a quadrilateral whose angles are x, x + 10, x + 20 and x + 30 degrees. Find all four, and say what kind of quadrilateral it cannot be.",
    answer: "4x + 60 = 360, so x = 75 and the angles are 75, 85, 95 and 105 degrees. It cannot be a rectangle or a square, since those need four right angles, and it cannot be a parallelogram, since opposite angles there are equal and here all four differ.",
    hint: "The four angles total 360.", errorFeedback: "4x + 60 = 360 gives x = 75." },
];

const reasoningPrompts = [
  { id: "reason01", outcomeId: "lo03", difficulty: "Core", responseMode: "text",
    prompt: "Why is the number of triangles always two fewer than the number of sides when you split a polygon from one vertex?",
    keyIdeas: ["The chosen vertex joins to all the others", "The two adjacent sides form part of the first and last triangles", "n vertices give n - 2 triangles"],
    modelAnswer: "From the chosen vertex you can draw a line to every vertex except itself and the two next to it, which are already joined by sides. That gives n - 3 lines, and n - 3 lines across the inside cut it into n - 2 pieces. Each piece is a triangle whose angles all lie inside the polygon, so the sum is (n - 2) x 180. The two missing triangles correspond to the two sides that already meet at the chosen vertex." },
  { id: "reason02", outcomeId: "lo05", difficulty: "Core", responseMode: "text",
    prompt: "Why does the number of sides not appear in the total of the exterior angles?",
    keyIdeas: ["Walking round is one full turn", "The argument never counts sides", "More sides means smaller turns"],
    modelAnswer: "Walking once round the outside, you turn through each exterior angle and finish facing your starting direction, which is one full revolution of 360 degrees. That argument never mentions how many corners there were - only that you got back to where you started. More sides simply means more, smaller turns adding to the same total, which is why a regular polygon's exterior angle is 360 / n and shrinks as n grows." },
  { id: "reason03", outcomeId: "lo08", difficulty: "Core", responseMode: "text",
    prompt: "Ari finds a shorter side and gets 6.9 when the hypotenuse is 6.0. What single observation proves him wrong, and what did he do?",
    keyIdeas: ["The hypotenuse is the longest side", "6.9 > 6.0 is impossible", "He added instead of subtracting"],
    modelAnswer: "The hypotenuse is the longest side of a right-angled triangle, so no other side can be 6.9 when the hypotenuse is 6.0 - that alone proves him wrong, before any of his working is read. He added the squares, which is the rule for finding the hypotenuse, when he needed a shorter side and so had to subtract: 36 - 12.25 = 23.75, giving 4.9." },
  { id: "reason04", outcomeId: "lo04", difficulty: "Extension", responseMode: "text",
    prompt: "A regular octagon's interior angle can be found two ways. Why is it worth doing both?",
    keyIdeas: ["Two independent arguments", "(8-2)x180/8 and 180 - 360/8", "Agreement is evidence"],
    modelAnswer: "One route divides the interior sum by the number of angles: 1080 / 8 = 135. The other finds the exterior angle, 360 / 8 = 45, and subtracts from 180 because the pair lies on a straight line: 135. They rest on different arguments - splitting into triangles, and walking round the outside - so their agreement is real evidence rather than a repeated calculation. If they disagreed, one of the two arguments would be wrong and you would know to look." },
  { id: "reason05", outcomeId: "lo06", difficulty: "Extension", responseMode: "text",
    prompt: "Why is a constructed 60 degree angle exact while a measured one is not?",
    keyIdeas: ["The compass width forces an equilateral triangle", "Equal angles totalling 180", "No reading of a scale"],
    modelAnswer: "The construction sets all three sides to one compass width, so the triangle is equilateral by definition. Its three angles must be equal and must total 180 degrees, so each is exactly 60 - a consequence of the geometry, not of anything measured. A protractor reading depends on eyesight, the thickness of the pencil and the scale's printing, so it carries an error. The construction has no scale to misread." },
  { id: "reason06", outcomeId: "lo01", difficulty: "Core", responseMode: "text",
    prompt: "Why write a reason beside every step of an angle chain, when the numbers alone give the answer?",
    keyIdeas: ["It makes the chain checkable", "It shows which fact was used", "A wrong reason reveals a wrong step"],
    modelAnswer: "The numbers alone cannot be checked: if an answer is wrong, a reader has no way of seeing where the reasoning failed, and neither do you a day later. Naming the fact at each step makes the chain inspectable - someone can test whether alternate angles really do apply to those two angles in that figure. It also catches the commonest error in this topic, which is using a true fact on the wrong pair of angles: the arithmetic looks fine and the named reason does not." },
];

const reference = {
  rules: [
    { title: "Interior Angle Sum", text: "The interior angles of a polygon with n sides total (n - 2) x 180 degrees, because it splits into n - 2 triangles." },
    { title: "Regular Means Divide", text: "In a regular polygon all angles are equal, so each interior angle is (n - 2) x 180 / n." },
    { title: "Exterior Angles Total 360", text: "For ANY polygon the exterior angles add to 360 degrees. In a regular one each is 360 / n." },
    { title: "The Pair at a Vertex", text: "An interior angle and its exterior angle lie on a straight line, so they add to 180 degrees." },
    { title: "Pythagoras' Theorem", text: "In a right-angled triangle the square on the hypotenuse equals the sum of the squares on the other two sides." },
    { title: "Add or Subtract, Decided First", text: "Name the hypotenuse before calculating. Looking for the hypotenuse means add; looking for a shorter side means subtract." },
  ],
  terms: [
    ["Interior angle", "An angle inside a polygon at one of its vertices"],
    ["Exterior angle", "The angle between one side extended and the next side"],
    ["Regular polygon", "A polygon with all sides equal and all angles equal"],
    ["Alternate angles", "Equal angles on opposite sides of a line crossing two parallel lines"],
    ["Hypotenuse", "The side opposite the right angle, and the longest side"],
    ["Construct", "To draw exactly with ruler and compasses, without measuring"],
    ["Inscribe", "To draw a shape inside a circle with its vertices on the circumference"],
    ["Perpendicular bisector", "A line at right angles to a segment through its midpoint"],
  ],
  commonMistakes: [
    ["Using n x 180 for the interior sum", "It is (n - 2) x 180; a pentagon gives 540, not 900"],
    ["Dividing the interior sum in a polygon that is not regular", "Equal angles are only guaranteed in a REGULAR polygon"],
    ["Thinking the exterior total depends on n", "It is 360 for every polygon; only the individual angles change"],
    ["Adding the squares to find a shorter side", "Subtract: a shorter side must come out less than the hypotenuse"],
    ["Measuring instead of constructing", "A construction leaves its arcs visible and needs no protractor"],
  ],
};

const assessment = {
  passPercent: 80,
  questions: [
    { id: "q01", type: "Application", outcomeId: "lo03", difficulty: "Basic", question: "What is the sum of the interior angles of a hexagon?", options: ["720 degrees", "1080 degrees", "540 degrees", "360 degrees"], answer: "720 degrees", hint: "Count the triangles.", explanation: "(6 - 2) x 180 = 720." },
    { id: "q02", type: "Application", outcomeId: "lo04", difficulty: "Core", question: "What is the interior angle of a regular octagon?", options: ["135 degrees", "45 degrees", "1080 degrees", "120 degrees"], answer: "135 degrees", hint: "Two routes agree.", explanation: "1080 / 8 = 135, and also 180 - 45 = 135." },
    { id: "q03", type: "Application", outcomeId: "lo05", difficulty: "Core", question: "The exterior angles of a 20-sided polygon total:", options: ["360 degrees", "3240 degrees", "18 degrees", "7200 degrees"], answer: "360 degrees", hint: "It is the same for every polygon.", explanation: "One complete turn, independent of the number of sides." },
    { id: "q04", type: "Application", outcomeId: "lo05", difficulty: "Core", question: "A regular polygon has an exterior angle of 40 degrees. How many sides?", options: ["9", "40", "8", "12"], answer: "9", hint: "360 divided by the angle.", explanation: "360 / 40 = 9 sides, and the interior angle is 140." },
    { id: "q05", type: "Application", outcomeId: "lo07", difficulty: "Core", question: "A right-angled triangle has shorter sides 6 cm and 8 cm. The hypotenuse is:", options: ["10 cm", "14 cm", "2 cm", "48 cm"], answer: "10 cm", hint: "Add the squares.", explanation: "36 + 64 = 100, so the hypotenuse is 10." },
    { id: "q06", type: "Application", outcomeId: "lo08", difficulty: "Core", question: "A right-angled triangle has hypotenuse 13 cm and one side 5 cm. The other side is:", options: ["12 cm", "18 cm", "14 cm", "8 cm"], answer: "12 cm", hint: "Subtract the squares.", explanation: "169 - 25 = 144, so the side is 12." },
    { id: "q07", type: "Reasoning", outcomeId: "lo08", difficulty: "Extension", question: "Ari finds a shorter side as 6.9 when the hypotenuse is 6.0. What is wrong?", options: ["He rounded too early", "A shorter side cannot exceed the hypotenuse", "He used the wrong triangle", "6.9 is not a whole number"], answer: "A shorter side cannot exceed the hypotenuse", hint: "Which side is longest?", explanation: "The hypotenuse is the longest side, so 6.9 is impossible; he added the squares instead of subtracting." },
    { id: "q08", type: "Reasoning", outcomeId: "lo06", difficulty: "Extension", question: "Why is a constructed 60 degree angle exact?", options: ["Compasses are more accurate than rulers", "The construction forces an equilateral triangle", "It is rounded to the nearest degree", "Because 60 divides into 360"], answer: "The construction forces an equilateral triangle", hint: "How long is each side you drew?", explanation: "All three sides are one compass width, so the angles are equal and each must be 180 / 3 = 60." },
  ],
};

const games = {
  masteryScore: 3,
  games: [
    { id: "u5-game-1", icon: "?", skill: "Polygon angles", title: "Quick Match: Polygon Angles", description: "Four short challenges on interior and exterior angles.", type: "choice",
      rounds: [
        { prompt: "Interior sum of a pentagon", choices: ["540", "360", "720", "900"], answer: "540", clue: "Three triangles." },
        { prompt: "Interior angle of a regular hexagon", choices: ["120", "60", "720", "135"], answer: "120", clue: "720 divided by 6." },
        { prompt: "Exterior angle of a regular decagon", choices: ["36", "144", "360", "18"], answer: "36", clue: "360 divided by 10." },
        { prompt: "Exterior angle 45 degrees. Sides?", choices: ["8", "45", "6", "10"], answer: "8", clue: "360 divided by 45." },
      ] },
    { id: "u5-game-2", icon: "?", skill: "Pythagoras", title: "Quick Match: Pythagoras", description: "Four short challenges on right-angled triangles.", type: "choice",
      rounds: [
        { prompt: "Sides 6 and 8. Hypotenuse?", choices: ["10", "14", "48", "7"], answer: "10", clue: "36 + 64." },
        { prompt: "Sides 5 and 12. Hypotenuse?", choices: ["13", "17", "60", "7"], answer: "13", clue: "25 + 144." },
        { prompt: "Hypotenuse 13, side 5. Other side?", choices: ["12", "18", "8", "14"], answer: "12", clue: "Subtract the squares." },
        { prompt: "Hypotenuse 6.0, side 3.5. Other side to 1 dp?", choices: ["4.9", "6.9", "2.5", "5.2"], answer: "4.9", clue: "36 - 12.25." },
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
    unitId: "math-g09-u05",
    unitNo: 5,
    unitTitle: "Angles",
    unitOverview:
      "Welcome to Unit 5. You already know a long list of angle facts; this unit is about choosing among " +
      "them and about producing new ones for yourself. You work through chains of reasoning on diagrams " +
      "that offer several routes, naming the fact behind every step. You derive the formula for a " +
      "polygon's interior angles by splitting it into triangles, rather than being handed it. You meet the " +
      "surprising fact that the exterior angles of every polygon total 360 degrees, whatever its shape. " +
      "You construct exact angles with ruler and compasses and no protractor. And you use Pythagoras' " +
      "theorem, where the one thing to get right is deciding whether to add or subtract before you " +
      "calculate anything at all.",
    learningPath: "5.1 Calculating angles, 5.2 Interior angles of polygons, 5.3 Exterior angles of polygons, 5.4 Constructions, 5.5 Pythagoras' theorem",
    reviewStatus: "Authored 2026-09-26 from the Stage 9 Learner's Book pages 106-127 and Workbook pages 66-76. Not yet curriculum-reviewed.",
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
        "One objective per section: 5.1 -> 9Gg.09, 5.2 -> 9Gg.07, 5.3 -> 9Gg.08, 5.4 -> 9Gg.11, " +
        "5.5 -> 9Gg.10. 9Gg.07 says DERIVE and use, so the unit derives (n - 2) x 180 by splitting " +
        "polygons into triangles and completing a table, rather than announcing the formula and " +
        "drilling it. The remaining 9Gg objectives belong elsewhere: .01, .02 and .03 to unit 7 " +
        "(Shapes and measurements) and .04, .05 and .06 to unit 14 (Volume, surface area and " +
        "symmetry). Objective texts are quoted verbatim from cambridge-mathematics-0862.json.",
    },
  },
  provenance: {
    contentPackage: null,
    framework: "Cambridge Lower Secondary Mathematics 0862 - Stage 9",
    sourceArchive: null,
    sourceDocuments: ["Cambridge Lower Secondary Maths Learner's Book 9 (2ed, CUP), pages 106-127",
                      "Cambridge Lower Secondary Mathematics Workbook 9, pages 66-76"],
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
console.log("  Grade 9 Unit 5: " + outcomes.length + " outcomes, " + concepts.length + " concepts, " +
  workedExamples.length + " worked examples, " + practice.length + " practice, " + fluency.length +
  " fluency, " + realProblems.length + " real problems, " + reasoningPrompts.length + " reasoning, " +
  assessment.questions.length + " assessment, " + activities.length + " activities");
console.log("  objectives: " + OBJ.join(", ") + "   (one per section)");
console.log("  " + json.length + " bytes " + (WRITE ? "written to " + path.relative(process.cwd(), OUT) : "(--write to save)"));
