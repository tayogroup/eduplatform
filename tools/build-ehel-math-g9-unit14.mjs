// Build Mathematics Grade 9, Unit 14: Volume, Surface Area and Symmetry.
//
// Fourteenth Grade 9 unit. Authored from the Stage 9 Learner's Book pages 302-319
// and Workbook pages 174-183.
//
// THREE SECTIONS, THREE OBJECTIVES - and they complete the 9Gg strand:
//
//   14.1 Calculating the volume of prisms                  -> 9Gg.04
//   14.2 Surface area of prisms, pyramids and cylinders     -> 9Gg.05
//   14.3 Symmetry in three-dimensional shapes               -> 9Gg.06
//
// With these, 9Gg is placed across three units: .01 to .03 in unit 7, .07 to .11
// in unit 5, and .04 to .06 here.
//
// 9Gg.04 SAYS "DERIVE THE FORMULA", so the unit derives it. A prism has the same
// cross-section all along its length, so it is a stack of identical layers: one
// layer of thickness 1 holds as many unit cubes as the cross-section has unit
// squares, and there are as many layers as the length. That is why
// volume = area of cross-section x length, and it covers the cylinder for free -
// a cylinder is a prism whose cross-section happens to be a circle. Stating the
// formula and drilling it would satisfy "use" and fail "derive", the same gap
// unit 5 had to close for the interior angle sum.
//
// THE CURVED SURFACE OF A CYLINDER IS A RECTANGLE, and that is the whole of the
// hard part of 14.2. Unroll it and its height is the cylinder's height while its
// LENGTH is the circumference of the circle - so the area is pi x d x h. Learners
// who cannot see that reach for a formula they half-remember; learners who sketch
// the net do not need one.
//
// THE CUBE IS A REAL EXCEPTION IN 14.3 AND THE UNIT SAYS SO. A prism on a regular
// n-sided polygon has n + 1 planes of symmetry - n through the cross-section plus
// one horizontal. That gives 5 for a square prism. But a CUBE has 9, because its
// length equals its cross-section's sides and the extra equality creates planes
// through opposite edges that a taller square prism does not have. A rule with a
// known exception, stated together, is worth more than a rule that quietly fails.
//
//   node tools/build-ehel-math-g9-unit14.mjs [--write]

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-14.json");
const WRITE = process.argv.includes("--write");

const FW = path.resolve(HERE, "..", "src", "curriculum", "cambridge-mathematics-0862.json");
const fw = {};
(function walk(o) {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) return o.forEach(walk);
  if (typeof o.code === "string" && /^9Gg\.\d{2}$/.test(o.code)) fw[o.code] = o.text;
  Object.values(o).forEach(walk);
})(JSON.parse(fs.readFileSync(FW, "utf8")));

const OBJ = ["9Gg.04", "9Gg.05", "9Gg.06"];
for (const c of OBJ) if (!fw[c]) throw new Error("0862 has no " + c);

const outcomes = [
  "Explain why the volume of a prism is the area of its cross-section times its length.",
  "Calculate the volume of a prism whose cross-section is a rectangle, triangle or trapezium.",
  "Calculate the volume of a cylinder, treating it as a prism with a circular cross-section.",
  "Work backwards from a volume to find a missing length or a cross-sectional area.",
  "Find the surface area of a cuboid and a triangular prism by adding the areas of all the faces.",
  "Find the surface area of a cylinder, using the fact that its curved surface unrolls into a rectangle.",
  "Identify the planes of symmetry of a three-dimensional shape and count them.",
  "State how many planes of symmetry a prism on a regular polygon has, and explain why a cube is an exception.",
];

const concepts = [
  {
    id: "concept-1-deriving-the-prism-formula",
    title: "Why a Prism's Volume Is Cross-Section Times Length",
    explanation:
      "A prism is a solid with the same cross-section all the way along its length. That single property " +
      "is enough to give you its volume without being told a formula. Imagine slicing the prism into " +
      "layers one unit thick. Every layer is identical, and each holds exactly as many unit cubes as the " +
      "cross-section holds unit squares - so each layer's volume equals the cross-sectional AREA. There " +
      "are as many layers as the length, so the total is the area of the cross-section multiplied by the " +
      "length. The formula is a record of that stacking, not something to memorise.",
    example:
      "A prism whose cross-section has area 15 cm squared and whose length is 9 cm has volume " +
      "15 x 9 = 135 cm cubed. The same argument works whatever shape the cross-section is - a rectangle, " +
      "a triangle, a trapezium - because the derivation never used its shape, only that every layer is " +
      "the same.",
  },
  {
    id: "concept-2-cylinders-are-prisms",
    title: "A Cylinder Is a Prism With a Circular Cross-Section",
    explanation:
      "Because the stacking argument never mentioned the shape of the cross-section, it applies to a " +
      "cylinder too: the cross-section is a circle of area pi x r squared, so the volume is " +
      "pi x r squared x h. There is no separate cylinder formula to learn - it is the prism formula with " +
      "a circle put in. Recognising a cylinder as a prism is worth more than remembering one more " +
      "expression, because it means one idea covers every case.",
    example:
      "A cylinder of radius 3 cm and height 8 cm has cross-sectional area pi x 9 = 28.27 cm squared, so " +
      "its volume is 28.27 x 8 = 226.2 cm cubed to 1 decimal place. A cylinder of radius 5 cm and height " +
      "12 cm has volume pi x 25 x 12 = 942.5 cm cubed.",
  },
  {
    id: "concept-3-working-backwards",
    title: "Working Backwards From a Volume",
    explanation:
      "Because volume = area x length is a multiplication of two things, knowing the volume and either " +
      "one gives you the other by division. This is the same inverse-operation move as changing the " +
      "subject of a formula in Unit 2, and it is the kind of question a manufacturer actually asks: the " +
      "container must hold a certain amount, so how long does it need to be?",
    example:
      "A prism has volume 135 cm cubed and a cross-section of 15 cm squared, so its length is " +
      "135 / 15 = 9 cm. A prism with volume 256 cm cubed and a cross-section of 32 cm squared is " +
      "256 / 32 = 8 cm long. For a cylinder of volume 226.2 cm cubed and radius 3 cm, divide by the " +
      "cross-sectional area: 226.2 / 28.27 = 8 cm.",
  },
  {
    id: "concept-4-surface-area-by-counting-faces",
    title: "Surface Area Is the Sum of the Faces",
    explanation:
      "Surface area is how much material it would take to cover a solid, so it is simply the total area " +
      "of every face. There is no shortcut worth learning: sketch the net, list the faces, work out each " +
      "area and add. The commonest mistake is not arithmetic but bookkeeping - forgetting a face, or " +
      "counting one face when there are two identical ones. Listing them and ticking each off is what " +
      "prevents it, exactly as it did for compound areas in Unit 7.",
    example:
      "A cuboid 3 cm by 4 cm by 5 cm has three PAIRS of identical faces: two of 3 x 4 = 12, two of " +
      "3 x 5 = 15 and two of 4 x 5 = 20. So the surface area is 2 x 12 + 2 x 15 + 2 x 20 = " +
      "24 + 30 + 40 = 94 cm squared. A triangular prism has two triangular ends plus one rectangle for " +
      "each side of the triangle - five faces in all for a triangular cross-section.",
  },
  {
    id: "concept-5-the-cylinders-curved-surface",
    title: "The Curved Surface Unrolls Into a Rectangle",
    explanation:
      "A cylinder looks as though it needs a special formula, and it does not. Cut the curved surface and " +
      "unroll it: what you get is a RECTANGLE. Its height is the cylinder's height, and its length is the " +
      "distance all the way round the circle - the circumference. So the curved area is pi x d x h, and " +
      "the whole surface is that plus two circles. Sketching the net makes this visible and removes any " +
      "need to remember which formula goes where.",
    example:
      "A cylinder of radius 3 cm and height 8 cm. Each end is pi x 3 squared = 28.27 cm squared. The " +
      "diameter is 6 cm, so the circumference is pi x 6 = 18.85 cm, and the unrolled rectangle is " +
      "18.85 by 8, giving 150.80 cm squared. The total is 2 x 28.27 + 150.80 = 207.3 cm squared to 1 " +
      "decimal place. Note that the ends use the RADIUS and the curved surface uses the DIAMETER, which " +
      "is the same trap as Unit 7.",
  },
  {
    id: "concept-6-planes-of-symmetry",
    title: "Planes of Symmetry, and the Cube's Extra Ones",
    explanation:
      "A plane of symmetry cuts a solid into two parts that are congruent mirror images of each other - " +
      "it is the three-dimensional version of a line of symmetry. A cuboid with three different edge " +
      "lengths has exactly three: one parallel to each pair of faces. A prism built on a regular " +
      "n-sided polygon has n + 1: the n planes the polygon itself has, standing upright, plus one " +
      "horizontal plane half way up. But a CUBE has 9, not the 5 that rule predicts for a square prism, " +
      "because its height equals its base edges and that extra equality creates six more planes through " +
      "pairs of opposite edges. A cylinder has infinitely many, since any vertical cut through the axis " +
      "works.",
    example:
      "An equilateral triangular prism has 3 + 1 = 4 planes. A regular pentagonal prism has 5 + 1 = 6, " +
      "and a regular hexagonal prism 6 + 1 = 7. A square prism that is taller than it is wide has " +
      "4 + 1 = 5. A cube has 9: three parallel to the faces, and six through opposite edges. The rule " +
      "n + 1 describes a prism whose length differs from its cross-section, and the cube is the case " +
      "where that condition fails.",
  },
];

const methods = [
  { id: "method-1", outcomeId: "lo02", difficulty: "Core", title: "How to find the volume of a prism",
    example: "A prism has a cross-section of area 15 cm squared and a length of 9 cm.",
    steps: ["Identify the cross-section - the face that is the same all along the length.",
      "Work out its area, using whichever area formula that shape needs.",
      "Identify the length, which is measured at right angles to the cross-section.",
      "Multiply: 15 x 9 = 135.",
      "Write the unit as a cube: cm cubed, because three lengths have been multiplied."] },
  { id: "method-2", outcomeId: "lo03", difficulty: "Core", title: "How to find the volume of a cylinder",
    example: "A cylinder has radius 3 cm and height 8 cm.",
    steps: ["Recognise it as a prism whose cross-section is a circle - no new formula is needed.",
      "Work out the circle's area with the RADIUS: pi x 3 squared = 28.27 cm squared.",
      "The height is the prism's length.",
      "Multiply: 28.27 x 8 = 226.2 cm cubed to 1 dp.",
      "Check the size is sensible against a box of the same height."] },
  { id: "method-3", outcomeId: "lo04", difficulty: "Core", title: "How to work backwards from a volume",
    example: "A prism has volume 256 cm cubed and a cross-section of 32 cm squared. Find its length.",
    steps: ["Write the relationship: volume = area of cross-section x length.",
      "You know the volume and the area, so divide to find the length.",
      "256 / 32 = 8 cm.",
      "Check forwards: 32 x 8 = 256. It agrees.",
      "Note the unit is a plain length, not a square or a cube."] },
  { id: "method-4", outcomeId: "lo05", difficulty: "Core", title: "How to find the surface area of a cuboid",
    example: "A cuboid is 3 cm by 4 cm by 5 cm.",
    steps: ["Sketch the net so every face is visible and countable.",
      "Notice the faces come in identical PAIRS: 3 x 4, 3 x 5 and 4 x 5.",
      "Work out one of each: 12, 15 and 20 cm squared.",
      "Double each and add: 24 + 30 + 40 = 94 cm squared.",
      "Count that you have used six faces, and write the unit as a square."] },
  { id: "method-5", outcomeId: "lo06", difficulty: "Core", title: "How to find the surface area of a cylinder",
    example: "A cylinder has radius 5 cm and height 12 cm.",
    steps: ["Sketch the net: two circles and one rectangle.",
      "Find one circle's area with the radius: pi x 25 = 78.54 cm squared.",
      "Find the circumference with the DIAMETER: pi x 10 = 31.42 cm. That is the rectangle's length.",
      "The rectangle is 31.42 by 12, so its area is 376.99 cm squared.",
      "Total: 2 x 78.54 + 376.99 = 534 cm squared to 3 significant figures."] },
  { id: "method-6", outcomeId: "lo07", difficulty: "Core", title: "How to count planes of symmetry",
    example: "How many planes of symmetry has a cuboid with three different edge lengths?",
    steps: ["Look for a cut that leaves two halves which are mirror images of each other.",
      "Try a plane parallel to each pair of opposite faces, half way between them.",
      "For a cuboid, all three of those work, giving two vertical and one horizontal.",
      "Check whether any diagonal cut also works - for a cuboid with unequal edges, none does.",
      "So the answer is 3. Draw each plane on a sketch rather than trying to hold them in your head."] },
];

const workedExamples = [
  { id: "we01", outcomeId: "lo01", difficulty: "Core", twm: "convincing", title: "Deriving the prism formula",
    prompt: "Explain why the volume of a prism is the area of its cross-section multiplied by its length.",
    solution: "A prism has the same cross-section all along its length, so slice it into layers one unit thick. Every layer is identical, and a layer one unit thick holds exactly as many unit cubes as its cross-section holds unit squares - so each layer's volume is numerically the cross-sectional AREA. There are as many layers as there are units of length, so the total volume is area x length. Notice the argument never used the shape of the cross-section, which is why one formula covers rectangles, triangles, trapeziums and circles alike." },
  { id: "we02", outcomeId: "lo02", difficulty: "Basic", twm: "characterising", title: "A prism from its cross-section",
    prompt: "A prism's cross-section has area 15 cm squared and its length is 9 cm. Find its volume.",
    solution: "Volume = area of cross-section x length = 15 x 9 = 135 cm cubed. The unit is cubed because three lengths have been multiplied together - two inside the area, and one more for the length." },
  { id: "we03", outcomeId: "lo02", difficulty: "Core", twm: "specialising", title: "A triangular prism",
    prompt: "A prism has a right-angled triangular cross-section with legs 6 cm and 5 cm, and a length of 10 cm. Find its volume.",
    solution: "The cross-section is a triangle, so its area is half of base times height: half of 6 x 5 = 15 cm squared. Then the volume is 15 x 10 = 150 cm cubed. The only thing that changed from the previous example is which area formula the cross-section needed." },
  { id: "we04", outcomeId: "lo02", difficulty: "Core", twm: "specialising", title: "A trapezium-shaped cross-section",
    prompt: "A prism's cross-section is a trapezium with parallel sides 4 cm and 8 cm, 5 cm apart, and the prism is 7 cm long. Find its volume.",
    solution: "The trapezium's area is the average of the parallel sides times the distance between them: (4 + 8) / 2 x 5 = 6 x 5 = 30 cm squared. So the volume is 30 x 7 = 210 cm cubed. Again the method is unchanged - only the area calculation differs." },
  { id: "we05", outcomeId: "lo03", difficulty: "Core", twm: "generalising", title: "A cylinder is a prism",
    prompt: "A cylinder has radius 3 cm and height 8 cm. Find its volume, and explain why no new formula is needed.",
    solution: "The cross-section is a circle of area pi x 3 squared = 28.27 cm squared, and the height is the prism's length, so the volume is 28.27 x 8 = 226.2 cm cubed to 1 dp. No new formula is needed because the stacking argument never mentioned the cross-section's shape - a cylinder is simply a prism whose cross-section is a circle, so pi r squared h IS area x length." },
  { id: "we06", outcomeId: "lo04", difficulty: "Core", twm: "characterising", title: "Working backwards to a length",
    prompt: "A prism has volume 256 cm cubed and a cross-section of area 32 cm squared. How long is it?",
    solution: "Since volume = area x length, dividing gives length = 256 / 32 = 8 cm. Checking forwards, 32 x 8 = 256. This is the inverse-operation move from Unit 2 - knowing a product and one factor gives the other." },
  { id: "we07", outcomeId: "lo04", difficulty: "Extension", twm: "specialising", title: "Working backwards on a cylinder",
    prompt: "A cylinder of radius 5 cm has volume 942.5 cm cubed. Find its height.",
    solution: "The cross-sectional area is pi x 25 = 78.54 cm squared, so the height is 942.5 / 78.54 = 12.0 cm. Find the cross-sectional area first and then divide - trying to rearrange pi r squared h in one step is the same operation with more chances to slip." },
  { id: "we08", outcomeId: "lo05", difficulty: "Core", twm: "characterising", title: "A cuboid's surface area",
    prompt: "Find the surface area of a cuboid 3 cm by 4 cm by 5 cm.",
    solution: "The six faces form three identical pairs: two of 3 x 4 = 12, two of 3 x 5 = 15 and two of 4 x 5 = 20. So the total is 2 x 12 + 2 x 15 + 2 x 20 = 24 + 30 + 40 = 94 cm squared. Counting that six faces have been used is the check - the commonest error here is a missing face, not a wrong multiplication." },
  { id: "we09", outcomeId: "lo05", difficulty: "Core", twm: "specialising", title: "A triangular prism's surface area",
    prompt: "A prism has a right-angled triangular cross-section with legs 3 cm and 4 cm and hypotenuse 5 cm, and a length of 10 cm. Find its surface area.",
    solution: "There are five faces: two triangles and three rectangles. Each triangle is half of 3 x 4 = 6 cm squared, so 12 for both. The three rectangles are 3 by 10, 4 by 10 and 5 by 10, giving 30 + 40 + 50 = 120 cm squared. The total is 12 + 120 = 132 cm squared. Note that the hypotenuse, found by Pythagoras in Unit 5, is needed for the third rectangle - you cannot get the surface area without it." },
  { id: "we10", outcomeId: "lo06", difficulty: "Core", twm: "convincing", title: "Unrolling the curved surface",
    prompt: "A cylinder has radius 3 cm and height 8 cm. Find its surface area, explaining where the rectangle comes from.",
    solution: "Cut the curved surface down its side and unroll it: it flattens into a RECTANGLE whose height is the cylinder's height, 8 cm, and whose length is the distance round the circle - the circumference. The diameter is 6 cm, so the circumference is pi x 6 = 18.85 cm, and the rectangle's area is 18.85 x 8 = 150.80 cm squared. Each circular end is pi x 3 squared = 28.27 cm squared. The total is 2 x 28.27 + 150.80 = 207.3 cm squared to 1 dp." },
  { id: "we11", outcomeId: "lo06", difficulty: "Core", twm: "critiquing", title: "Radius for the ends, diameter for the curve",
    prompt: "A cylinder has radius 5 cm and height 12 cm. Find its surface area to 3 significant figures, and name the trap.",
    solution: "Each end is pi x 5 squared = 78.54 cm squared, using the RADIUS. The circumference is pi x 10 = 31.42 cm, using the DIAMETER, so the unrolled rectangle is 31.42 x 12 = 376.99 cm squared. The total is 2 x 78.54 + 376.99 = 534 cm squared to 3 s.f. The trap is the same one as Unit 7: area needs the radius and circumference needs the diameter, so a cylinder's surface area uses both in the same calculation and you must keep them apart." },
  { id: "we12", outcomeId: "lo07", difficulty: "Core", twm: "characterising", title: "A cuboid's planes of symmetry",
    prompt: "How many planes of symmetry has a cuboid whose three edge lengths are all different?",
    solution: "Three. Each one runs parallel to a pair of opposite faces, half way between them, and cuts the cuboid into two congruent mirror-image halves - two of these planes are vertical and one is horizontal. No diagonal cut works, because the two halves it makes are not mirror images unless two of the edges are equal." },
  { id: "we13", outcomeId: "lo08", difficulty: "Extension", twm: "generalising", title: "The n plus 1 rule for regular prisms",
    prompt: "Count the planes of symmetry of an equilateral triangular prism, a regular pentagonal prism and a regular hexagonal prism. What is the pattern?",
    solution: "The triangular prism has 3 upright planes - one through each vertex and the midpoint of the opposite edge - plus 1 horizontal plane half way up its length, giving 4. The pentagonal prism has 5 upright and 1 horizontal, so 6. The hexagonal has 6 and 1, so 7. The pattern is n + 1: a prism inherits its cross-section's n lines of symmetry as upright planes, and gains one horizontal plane from its own length." },
  { id: "we14", outcomeId: "lo08", difficulty: "Extension", twm: "critiquing", title: "Why a cube breaks the rule",
    prompt: "The n plus 1 rule predicts 5 planes for a square prism. A cube is a square prism. But a cube has 9. Explain.",
    solution: "The rule assumes the prism's length differs from its cross-section's dimensions, so that the upright and horizontal directions are genuinely different. In a cube all three dimensions are equal, and that extra equality creates six more planes, each passing through a pair of opposite edges - cuts that fail on a taller square prism because the two halves come out different sizes. So a cube has 3 parallel to its faces plus 6 through opposite edges, which is 9. The rule is not wrong; it has a condition, and a cube is exactly the case where the condition fails." },
];

const practice = [
  { id: "p01", level: "Warm-up", prompt: "A prism has a cross-section of 15 cm squared and length 9 cm. Find its volume.", answer: "135 cm cubed", hint: "Multiply." },
  { id: "p02", level: "Warm-up", prompt: "Find the volume of a cylinder of radius 3 cm and height 8 cm, to 1 dp.", answer: "226.2 cm cubed", hint: "pi x 9 x 8." },
  { id: "p03", level: "Warm-up", prompt: "How many planes of symmetry has a cuboid with three different edge lengths?", answer: "3", hint: "One parallel to each pair of faces." },
  { id: "p04", level: "Core", prompt: "A prism's cross-section is a right-angled triangle with legs 6 cm and 5 cm, and it is 10 cm long. Find its volume.", answer: "150 cm cubed", hint: "The triangle is 15 cm squared." },
  { id: "p05", level: "Core", prompt: "A prism has volume 256 cm cubed and a cross-section of 32 cm squared. Find its length.", answer: "8 cm", hint: "Divide." },
  { id: "p06", level: "Core", prompt: "Find the surface area of a cuboid 3 cm by 4 cm by 5 cm.", answer: "94 cm squared", hint: "Three pairs of faces." },
  { id: "p07", level: "Core", prompt: "Find the surface area of a cylinder of radius 5 cm and height 12 cm, to 3 s.f.", answer: "534 cm squared", hint: "Two circles plus a rectangle." },
  { id: "p08", level: "Core", prompt: "How many planes of symmetry has a regular hexagonal prism?", answer: "7", hint: "n + 1." },
  { id: "p09", level: "Core", prompt: "A trapezium with parallel sides 4 cm and 8 cm, 5 cm apart, is the cross-section of a prism 7 cm long. Find the volume.", answer: "210 cm cubed", hint: "The trapezium is 30 cm squared." },
  { id: "p10", level: "Challenge", prompt: "A cylinder of radius 5 cm has volume 942.5 cm cubed. Find its height.", answer: "12 cm. The cross-section is pi x 25 = 78.54 cm squared, and 942.5 / 78.54 = 12.0 cm.", hint: "Find the cross-sectional area first." },
  { id: "p11", level: "Challenge", prompt: "Find the surface area of a triangular prism whose cross-section is a 3, 4, 5 right-angled triangle and whose length is 10 cm.", answer: "132 cm squared. Two triangles of 6 give 12, and three rectangles of 3x10, 4x10 and 5x10 give 120.", hint: "Five faces, and you need the hypotenuse." },
  { id: "p12", level: "Challenge", prompt: "The n plus 1 rule gives 5 planes of symmetry for a square prism, but a cube has 9. Explain the difference.", answer: "The rule assumes the length differs from the cross-section's dimensions. In a cube all three are equal, which creates six extra planes through pairs of opposite edges - cuts that fail on a taller square prism because the halves would be different sizes. So 3 parallel to the faces plus 6 through opposite edges gives 9.", hint: "What is special about a cube's dimensions?" },
];

const fluency = [
  { id: "fl01", outcomeId: "lo02", difficulty: "Round 1", prompt: "Cross-section 15 cm squared, length 9 cm. Volume?", answer: "135 cm cubed", hint: "Multiply.", errorFeedback: "15 x 9 = 135." },
  { id: "fl02", outcomeId: "lo02", difficulty: "Round 1", prompt: "Triangle legs 6 and 5, length 10. Volume?", answer: "150 cm cubed", hint: "Half of 6 x 5 first.", errorFeedback: "The cross-section is 15 cm squared." },
  { id: "fl03", outcomeId: "lo07", difficulty: "Round 1", prompt: "Planes of symmetry of a cuboid with unequal edges?", answer: "3", hint: "One per pair of faces.", errorFeedback: "Two vertical and one horizontal." },
  { id: "fl04", outcomeId: "lo04", difficulty: "Round 1", prompt: "Volume 256, cross-section 32. Length?", answer: "8 cm", hint: "Divide.", errorFeedback: "256 / 32 = 8." },
  { id: "fl05", outcomeId: "lo03", difficulty: "Round 2", prompt: "Cylinder radius 3, height 8. Volume to 1 dp?", answer: "226.2 cm cubed", hint: "pi x 9 x 8.", errorFeedback: "28.27 x 8 = 226.19." },
  { id: "fl06", outcomeId: "lo05", difficulty: "Round 2", prompt: "Surface area of a 3 by 4 by 5 cuboid?", answer: "94 cm squared", hint: "Three pairs.", errorFeedback: "24 + 30 + 40 = 94." },
  { id: "fl07", outcomeId: "lo06", difficulty: "Round 2", prompt: "Cylinder radius 3, height 8. Curved surface area to 2 dp?", answer: "150.80 cm squared", hint: "Circumference times height.", errorFeedback: "pi x 6 x 8 = 150.80." },
  { id: "fl08", outcomeId: "lo08", difficulty: "Round 2", prompt: "Planes of symmetry of an equilateral triangular prism?", answer: "4", hint: "n + 1.", errorFeedback: "3 upright plus 1 horizontal." },
  { id: "fl09", outcomeId: "lo06", difficulty: "Round 3", prompt: "Cylinder radius 5, height 12. Surface area to 3 s.f.?", answer: "534 cm squared", hint: "Two circles plus a rectangle.", errorFeedback: "157.08 + 376.99 = 534.07." },
  { id: "fl10", outcomeId: "lo04", difficulty: "Round 3", prompt: "Cylinder radius 5, volume 942.5. Height?", answer: "12 cm", hint: "Divide by the cross-section.", errorFeedback: "942.5 / 78.54 = 12." },
  { id: "fl11", outcomeId: "lo08", difficulty: "Round 3", prompt: "Planes of symmetry of a cube?", answer: "9", hint: "Not 5.", errorFeedback: "3 parallel to the faces plus 6 through opposite edges." },
  { id: "fl12", outcomeId: "lo05", difficulty: "Round 3", prompt: "Surface area of a 3-4-5 triangular prism, length 10?", answer: "132 cm squared", hint: "Five faces.", errorFeedback: "12 + 30 + 40 + 50 = 132." },
];

const explorations = concepts.map((c, i) => ({
  id: "explore-" + (i + 1),
  outcomeId: "lo0" + [1, 3, 4, 5, 6, 8][i],
  difficulty: ["Discover", "Core", "Core", "Core", "Core", "Extension"][i],
  title: c.title,
  context: c.explanation,
  prompt: [
    "Build a prism from identical layers of centimetre cubes. How many cubes in one layer, and how does that explain the formula?",
    "Work out the volume of a cylinder of radius 3 and height 8 using the prism formula. Did you need a new formula?",
    "A prism has volume 256 cm cubed. Find its length if the cross-section is 32 cm squared, then if it is 16 cm squared.",
    "Sketch the net of a 3 by 4 by 5 cuboid and count the faces. How many are identical to another?",
    "Cut a paper cylinder's curved surface and unroll it. What shape is it, and what are its two dimensions?",
    "Count the planes of symmetry of a square prism and of a cube. Why do they differ?",
  ][i],
  answer: [
    "One layer holds as many cubes as the cross-section has unit squares, so each layer's volume equals the area; multiply by the number of layers.",
    "28.27 x 8 = 226.2 cm cubed. No - a cylinder is a prism whose cross-section is a circle.",
    "8 cm, then 16 cm. Halving the cross-section doubles the length for the same volume.",
    "Six faces in three identical pairs - 3x4, 3x5 and 4x5 - giving 94 cm squared in total.",
    "A rectangle. Its height is the cylinder's height and its length is the circumference of the circle.",
    "5 and 9. A cube's three dimensions are equal, which adds six planes through pairs of opposite edges.",
  ][i],
  modelType: "concept-model-" + (i + 1),
  hint: [
    "Count the cubes in a single layer.",
    "What is the area of the cross-section?",
    "Volume divided by area.",
    "Look for pairs.",
    "Roll a strip of paper into a tube.",
    "What is special about a cube?",
  ][i],
  explanation: c.example,
}));

const visualModels = concepts.map((c, i) => ({
  id: "model-" + (i + 1),
  outcomeId: "lo0" + [1, 3, 4, 5, 6, 8][i],
  title: c.title,
  modelType: "concept-model-" + (i + 1),
  purpose: c.explanation,
  defaultNumber: [15, 3, 256, 94, 5, 9][i],
}));

const activities = [
  { title: "Build the prism", materials: "centimetre cubes or sugar cubes.",
    steps: ["Build one layer of cubes in the shape of a chosen cross-section and count them.",
      "Stack identical layers until the prism is five layers long.",
      "Count the total cubes, then check it against area x length.",
      "Rebuild with a different cross-section of the same area and confirm the volume is unchanged."] },
  { title: "Prisms with the same volume", materials: "paper, ruler.",
    steps: ["Find five different prisms whose volume is exactly 256 cm cubed.",
      "Vary the cross-sectional area and the length, recording both each time.",
      "Plot area against length for your five prisms.",
      "Describe the shape of the graph and say which kind of proportion it shows.",
      "Link it back to Unit 11 - which quantity is constant here?"] },
  { title: "Nets and surface areas", materials: "card, scissors, ruler.",
    steps: ["Draw and cut out the net of a 3 by 4 by 5 cuboid.",
      "Label every face with its dimensions and its area before folding.",
      "Add them and compare with 2(12 + 15 + 20).",
      "Now do the same for a triangular prism, and notice which face needs Pythagoras first.",
      "Fold both up and check no face is missing or duplicated."] },
  { title: "Unroll a cylinder", materials: "paper, a tin or tube, string, ruler.",
    steps: ["Wrap a strip of paper round a tin so it meets exactly, then unroll it and measure its length.",
      "Compare that length with pi x d calculated from the tin's diameter.",
      "Measure the height and work out the curved surface area.",
      "Draw round the tin twice for the ends and work out their areas.",
      "Add all three and compare with the formula."] },
  { title: "Find the planes", materials: "modelling clay or potatoes, a knife or wire.",
    steps: ["Make a cuboid with three different edge lengths and cut it along a plane of symmetry.",
      "Check the two halves are mirror images, then rebuild and find the other planes.",
      "Do the same for a square prism and count.",
      "Now make a cube and find every plane, including the diagonal ones.",
      "Record the counts in a table and explain why the cube has more."] },
  { title: "The n plus 1 rule and its limit", materials: "isometric paper, clay.",
    steps: ["Build prisms on an equilateral triangle, a square, a regular pentagon and a regular hexagon.",
      "Count the planes of symmetry of each and tabulate against n.",
      "Write the rule your table shows.",
      "Now build a cube and count. Does the rule hold?",
      "Write one sentence stating the rule AND the condition it needs."] },
];

const realProblems = [
  { id: "rp01", outcomeId: "lo06", difficulty: "Core", context: "Work",
    prompt: "A manufacturer makes cylindrical tins of radius 5 cm and height 12 cm. How much metal does each tin need, to 3 significant figures?",
    answer: "Two circular ends at pi x 25 = 78.54 cm squared each, and a curved surface that unrolls into a rectangle pi x 10 = 31.42 cm long by 12 cm high, giving 376.99 cm squared. The total is 2 x 78.54 + 376.99 = 534 cm squared.",
    hint: "Sketch the net: two circles and a rectangle.", errorFeedback: "The rectangle's length is the circumference, using the diameter." },
  { id: "rp02", outcomeId: "lo03", difficulty: "Core", context: "Home",
    prompt: "A cylindrical water tank has radius 3 m and height 8 m. How much water does it hold in cubic metres, to 1 dp?",
    answer: "The cross-section is pi x 3 squared = 28.27 square metres, and the height is 8 m, so the volume is 28.27 x 8 = 226.2 cubic metres. A cylinder is a prism, so this is just area of cross-section times length.",
    hint: "Treat it as a prism.", errorFeedback: "pi x 9 x 8 = 226.19." },
  { id: "rp03", outcomeId: "lo04", difficulty: "Core", context: "Work",
    prompt: "A chocolate bar is a triangular prism that must hold 256 cm cubed. Its triangular cross-section has area 32 cm squared. How long must the bar be?",
    answer: "Length = volume / cross-sectional area = 256 / 32 = 8 cm. Checking forwards, 32 x 8 = 256 cm cubed.",
    hint: "Divide the volume by the area.", errorFeedback: "256 / 32 = 8." },
  { id: "rp04", outcomeId: "lo05", difficulty: "Extension", context: "Work",
    prompt: "A tent is a triangular prism 10 m long whose cross-section is a right-angled triangle with legs 3 m and 4 m. How much material is needed for the two ends and the three rectangular sides?",
    answer: "The hypotenuse is 5 m by Pythagoras. The two triangular ends are half of 3 x 4 = 6 square metres each, so 12. The three rectangles are 3 x 10, 4 x 10 and 5 x 10, giving 30 + 40 + 50 = 120 square metres. The total is 132 square metres - and note the hypotenuse had to be found before the surface area could be.",
    hint: "You need the third side of the triangle first.", errorFeedback: "Pythagoras gives the hypotenuse as 5 m." },
  { id: "rp05", outcomeId: "lo04", difficulty: "Extension", context: "Market",
    prompt: "A cylindrical container of radius 5 cm must hold 942.5 cm cubed of juice. How tall should it be?",
    answer: "The cross-sectional area is pi x 25 = 78.54 cm squared, so the height is 942.5 / 78.54 = 12.0 cm. Working out the cross-section first and then dividing is safer than rearranging pi r squared h in one step.",
    hint: "Find the cross-sectional area, then divide.", errorFeedback: "942.5 / 78.54 = 12." },
  { id: "rp06", outcomeId: "lo08", difficulty: "Extension", context: "Home",
    prompt: "A designer wants a box with as many planes of symmetry as possible. Compare a 3 by 4 by 5 cuboid, a square prism 4 by 4 by 10, and a cube. Which wins, and by how much?",
    answer: "The 3 by 4 by 5 cuboid has 3 planes, one parallel to each pair of faces. The 4 by 4 by 10 square prism has 5 - four upright from the square's own lines of symmetry plus one horizontal. The cube has 9, because its three equal dimensions add six planes through pairs of opposite edges. The cube wins, with six more than the cuboid.",
    hint: "Use n + 1 for the square prism, but check the cube separately.", errorFeedback: "A cube has 9, not the 5 the n + 1 rule predicts." },
];

const reasoningPrompts = [
  { id: "reason01", outcomeId: "lo01", difficulty: "Core", responseMode: "text",
    prompt: "Why does one formula cover the volume of prisms with rectangular, triangular, trapezium and circular cross-sections?",
    keyIdeas: ["The layer argument never uses the shape", "Every layer is identical", "Only the area of the cross-section matters"],
    modelAnswer: "The derivation slices the prism into identical layers one unit thick and observes that each layer contains as many unit cubes as the cross-section contains unit squares. Nothing in that argument refers to the SHAPE of the cross-section - only to the fact that it is the same all along, and to its area. So the conclusion applies to any cross-section whatsoever, which is why a cylinder needs no separate formula: it is a prism whose cross-section happens to be a circle." },
  { id: "reason02", outcomeId: "lo06", difficulty: "Core", responseMode: "text",
    prompt: "Why is the curved surface of a cylinder a rectangle when it is unrolled?",
    keyIdeas: ["A cut and unroll preserves lengths", "The height stays the height", "The length becomes the circumference"],
    modelAnswer: "Cutting the curved surface along a straight line from top to bottom and unrolling it does not stretch anything, so every length is preserved. The two cut edges were both the cylinder's height, and they become the rectangle's two short sides. The top and bottom edges were each the full way round the circle, so they become the rectangle's long sides of length equal to the circumference. Two pairs of equal, perpendicular sides is exactly a rectangle - so the curved area is circumference times height, with nothing to memorise." },
  { id: "reason03", outcomeId: "lo06", difficulty: "Core", responseMode: "text",
    prompt: "A cylinder's surface area uses both the radius and the diameter. Why, and why is that a trap?",
    keyIdeas: ["Circle area needs the radius", "Circumference needs the diameter", "Both appear in one calculation"],
    modelAnswer: "The two circular ends are areas, so they need pi r squared and the RADIUS. The unrolled rectangle's length is a circumference, so it needs pi d and the DIAMETER. Both therefore appear in the same calculation, which is what makes it a trap - Unit 7's mistake of swapping them can happen here within a single question, and using the radius for the circumference would halve the curved surface while using the diameter for the ends would quadruple them. Writing both the radius and the diameter down before starting is the defence." },
  { id: "reason04", outcomeId: "lo05", difficulty: "Core", responseMode: "text",
    prompt: "Why is a missing face, rather than wrong arithmetic, the usual error in a surface area question?",
    keyIdeas: ["The arithmetic is easy", "The bookkeeping is not", "Faces come in pairs that are easy to count once"],
    modelAnswer: "Each individual face area is a simple multiplication that most learners get right. What is hard is keeping track of how many faces there are and which are identical - a cuboid's six faces form three pairs, and counting a pair once gives an answer that is wrong by a whole face but looks entirely plausible. Sketching the net makes every face visible and countable, which converts a memory task into a counting task. It is the same failure mode as compound areas in Unit 7: the pieces are easy and the bookkeeping is not." },
  { id: "reason05", outcomeId: "lo08", difficulty: "Extension", responseMode: "text",
    prompt: "Why does a cube have more planes of symmetry than the n plus 1 rule predicts for a square prism?",
    keyIdeas: ["The rule assumes length differs from the cross-section", "A cube's three dimensions are equal", "Six planes through opposite edges become possible"],
    modelAnswer: "The n plus 1 rule counts the n upright planes inherited from the cross-section's lines of symmetry plus one horizontal plane across the length, and it silently assumes the length is different from the cross-section's dimensions - otherwise upright and horizontal are not genuinely distinct directions. A cube's three dimensions are all equal, so cuts through pairs of opposite edges also produce congruent mirror-image halves, and there are six such cuts. Adding those to the three parallel to the faces gives 9. The rule is not wrong; it has a condition, and the cube is precisely where the condition fails." },
  { id: "reason06", outcomeId: "lo04", difficulty: "Core", responseMode: "text",
    prompt: "For a fixed volume, how are a prism's cross-sectional area and length related?",
    keyIdeas: ["Their product is constant", "That is inverse proportion", "Halving one doubles the other"],
    modelAnswer: "Volume equals area times length, so if the volume is fixed then the product of those two is fixed - which is exactly the definition of inverse proportion from Unit 11. Halving the cross-sectional area doubles the length, and vice versa. For a volume of 256 cm cubed, a cross-section of 32 cm squared needs a length of 8 cm while a cross-section of 16 cm squared needs 16 cm. Recognising it as inverse proportion means the whole family of possible prisms is available at once rather than one calculation at a time." },
];

const reference = {
  rules: [
    { title: "A Prism's Volume Is Area Times Length", text: "Volume = area of cross-section x length, derived by stacking identical layers. The cross-section's shape is irrelevant." },
    { title: "A Cylinder Is a Prism", text: "Its cross-section is a circle, so its volume is pi r squared times the height. No separate formula." },
    { title: "Divide to Work Backwards", text: "Volume divided by cross-sectional area gives the length; volume divided by length gives the area." },
    { title: "Surface Area Is the Sum of the Faces", text: "Sketch the net, list every face, work out each area and add. Count that you have used them all." },
    { title: "The Curved Surface Unrolls Into a Rectangle", text: "Its height is the cylinder's height and its length is the circumference, so its area is pi x d x h." },
    { title: "Radius for Ends, Diameter for the Curve", text: "A cylinder's surface area needs both in one calculation. Write both down before starting." },
    { title: "A Plane of Symmetry Makes Two Mirror Halves", text: "A cuboid with unequal edges has 3. A prism on a regular n-gon has n + 1. A cube has 9, because its dimensions are equal." },
  ],
  terms: [
    ["Prism", "A solid with the same cross-section along its whole length"],
    ["Cross-section", "The shape you see when you cut straight across a prism"],
    ["Cylinder", "A prism whose cross-section is a circle"],
    ["Net", "A flat arrangement of all a solid's faces, which folds up into it"],
    ["Surface area", "The total area of all the faces of a solid"],
    ["Curved surface", "The part of a cylinder's surface that is not an end"],
    ["Plane of symmetry", "A flat cut dividing a solid into two congruent mirror-image halves"],
    ["Congruent", "Identical in shape and size"],
  ],
  commonMistakes: [
    ["Using the wrong face as the cross-section", "The cross-section is the face that repeats along the length"],
    ["Writing a volume in square units", "Three lengths multiply, so the unit is cubed"],
    ["Learning a separate cylinder formula", "It is the prism formula with a circular cross-section"],
    ["Missing a face in a surface area", "Sketch the net and count - a cuboid has six faces in three pairs"],
    ["Using the radius for the circumference", "The circumference needs the diameter; the ends need the radius"],
    ["Applying n + 1 to a cube", "A cube has 9 planes, not 5 - its equal dimensions add six more"],
  ],
};

const assessment = {
  passPercent: 80,
  questions: [
    { id: "q01", type: "Application", outcomeId: "lo02", difficulty: "Basic", question: "A prism has a cross-section of 15 cm squared and a length of 9 cm. Its volume is:", options: ["135 cm cubed", "24 cm cubed", "135 cm squared", "1215 cm cubed"], answer: "135 cm cubed", hint: "Multiply, and check the unit.", explanation: "15 x 9 = 135, and three lengths multiply so the unit is cubed." },
    { id: "q02", type: "Application", outcomeId: "lo03", difficulty: "Core", question: "The volume of a cylinder of radius 3 cm and height 8 cm, to 1 dp, is:", options: ["226.2 cm cubed", "75.4 cm cubed", "150.8 cm cubed", "678.6 cm cubed"], answer: "226.2 cm cubed", hint: "Area of the circle times the height.", explanation: "pi x 9 x 8 = 226.19." },
    { id: "q03", type: "Application", outcomeId: "lo04", difficulty: "Core", question: "A prism has volume 256 cm cubed and a cross-section of 32 cm squared. Its length is:", options: ["8 cm", "8192 cm", "224 cm", "16 cm"], answer: "8 cm", hint: "Divide.", explanation: "256 / 32 = 8 cm." },
    { id: "q04", type: "Application", outcomeId: "lo05", difficulty: "Core", question: "The surface area of a cuboid 3 cm by 4 cm by 5 cm is:", options: ["94 cm squared", "47 cm squared", "60 cm squared", "120 cm squared"], answer: "94 cm squared", hint: "Three pairs of faces.", explanation: "2(12 + 15 + 20) = 94." },
    { id: "q05", type: "Application", outcomeId: "lo06", difficulty: "Core", question: "The curved surface area of a cylinder of radius 3 cm and height 8 cm, to 2 dp, is:", options: ["150.80 cm squared", "75.40 cm squared", "226.19 cm squared", "28.27 cm squared"], answer: "150.80 cm squared", hint: "Circumference times height.", explanation: "pi x 6 x 8 = 150.80." },
    { id: "q06", type: "Application", outcomeId: "lo07", difficulty: "Core", question: "A cuboid with three different edge lengths has how many planes of symmetry?", options: ["3", "6", "9", "1"], answer: "3", hint: "One per pair of faces.", explanation: "Two vertical and one horizontal; no diagonal cut works." },
    { id: "q07", type: "Application", outcomeId: "lo08", difficulty: "Extension", question: "A cube has how many planes of symmetry?", options: ["9", "5", "3", "6"], answer: "9", hint: "More than the n + 1 rule predicts.", explanation: "Three parallel to the faces plus six through pairs of opposite edges." },
    { id: "q08", type: "Reasoning", outcomeId: "lo01", difficulty: "Extension", question: "Why does the prism formula work for a cylinder?", options: ["Because circles are special", "Because the derivation never used the cross-section's shape", "Because pi is irrational", "It does not - cylinders need their own formula"], answer: "Because the derivation never used the cross-section's shape", hint: "What did the layer argument depend on?", explanation: "The stacking argument needs only that every layer is identical and has a known area." },
  ],
};

const games = {
  masteryScore: 3,
  games: [
    { id: "u14-game-1", icon: "?", skill: "Volume", title: "Quick Match: Volume", description: "Four short challenges on prisms and cylinders.", type: "choice",
      rounds: [
        { prompt: "Cross-section 15 cm squared, length 9 cm", choices: ["135 cm cubed", "24 cm cubed", "1215 cm cubed", "135 cm squared"], answer: "135 cm cubed", clue: "Multiply." },
        { prompt: "Triangle legs 6 and 5, length 10", choices: ["150 cm cubed", "300 cm cubed", "60 cm cubed", "30 cm cubed"], answer: "150 cm cubed", clue: "Half of 6 x 5 first." },
        { prompt: "Cylinder radius 3, height 8, to 1 dp", choices: ["226.2 cm cubed", "75.4 cm cubed", "150.8 cm cubed", "678.6 cm cubed"], answer: "226.2 cm cubed", clue: "pi x 9 x 8." },
        { prompt: "Volume 256, cross-section 32. Length?", choices: ["8 cm", "16 cm", "224 cm", "8192 cm"], answer: "8 cm", clue: "Divide." },
      ] },
    { id: "u14-game-2", icon: "?", skill: "Surface area and symmetry", title: "Quick Match: Surface and Symmetry", description: "Four short challenges on surface area and planes of symmetry.", type: "choice",
      rounds: [
        { prompt: "Surface area of a 3 by 4 by 5 cuboid", choices: ["94 cm squared", "47 cm squared", "60 cm squared", "120 cm squared"], answer: "94 cm squared", clue: "Three pairs." },
        { prompt: "Cylinder radius 5, height 12, to 3 s.f.", choices: ["534 cm squared", "377 cm squared", "79 cm squared", "942 cm squared"], answer: "534 cm squared", clue: "Two circles plus a rectangle." },
        { prompt: "Planes of symmetry of a regular hexagonal prism", choices: ["7", "6", "12", "13"], answer: "7", clue: "n + 1." },
        { prompt: "Planes of symmetry of a cube", choices: ["9", "5", "3", "6"], answer: "9", clue: "The rule has an exception." },
      ] },
  ],
};

const unit = {
  schemaVersion: "Ehel Mathematics Runtime v1.1",
  generatedAt: new Date().toISOString(),
  stage: { id: 9, label: "Stage 9" },
  subject: "Mathematics",
  term: { id: 3, label: "Term 3" },
  unit: {
    unitId: "math-g09-u14",
    unitNo: 14,
    unitTitle: "Volume, Surface Area and Symmetry",
    unitOverview:
      "Welcome to Unit 14. This unit is about solids, and it starts by deriving a formula rather than " +
      "giving you one. A prism has the same cross-section all along its length, so it is a stack of " +
      "identical layers - and that one observation tells you its volume is the area of the cross-section " +
      "times the length, whatever shape the cross-section is. A cylinder is then free: it is just a prism " +
      "whose cross-section is a circle. For surface area you sketch the net and add up the faces, and you " +
      "discover that a cylinder's curved surface unrolls into a rectangle whose length is the " +
      "circumference. Finally you look for planes of symmetry in three dimensions, find a neat rule for " +
      "prisms built on regular polygons - and find that a cube breaks it, for a reason worth " +
      "understanding.",
    learningPath: "14.1 Calculating the volume of prisms, 14.2 Calculating the surface area of triangular prisms, pyramids and cylinders, 14.3 Symmetry in three-dimensional shapes",
    reviewStatus: "Authored 2026-09-26 from the Stage 9 Learner's Book pages 302-319 and Workbook pages 174-183. Not yet curriculum-reviewed.",
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
        "Section by section: 14.1 -> 9Gg.04, 14.2 -> 9Gg.05, 14.3 -> 9Gg.06. With these the whole 9Gg " +
        "strand is placed: .01 to .03 in unit 7, .04 to .06 here, .07 to .11 in unit 5. 9Gg.04 says " +
        "DERIVE the formula and then use it, so the unit derives volume = cross-section x length from " +
        "stacking identical unit-thick layers - an argument that never mentions the cross-section's " +
        "shape, which is exactly why it covers cylinders too and why no separate cylinder formula is " +
        "taught. Stating the formula and drilling it would satisfy 'use' and fail 'derive', the same gap " +
        "unit 5 closes for the interior angle sum. 9Gg.06 asks for reflective symmetry in 3D, so the " +
        "unit teaches the n + 1 rule for prisms on regular polygons AND the cube's exception to it, " +
        "because a rule whose condition is unstated fails silently. Objective texts are quoted verbatim " +
        "from cambridge-mathematics-0862.json.",
    },
  },
  provenance: {
    contentPackage: null,
    framework: "Cambridge Lower Secondary Mathematics 0862 - Stage 9",
    sourceArchive: null,
    sourceDocuments: ["Cambridge Lower Secondary Maths Learner's Book 9 (2ed, CUP), pages 302-319",
                      "Cambridge Lower Secondary Mathematics Workbook 9, pages 174-183"],
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
console.log("  Grade 9 Unit 14: " + outcomes.length + " outcomes, " + concepts.length + " concepts, " +
  workedExamples.length + " worked examples, " + practice.length + " practice, " + fluency.length +
  " fluency, " + realProblems.length + " real problems, " + reasoningPrompts.length + " reasoning, " +
  assessment.questions.length + " assessment, " + activities.length + " activities");
console.log("  objectives: " + OBJ.join(", ") + "   (the 9Gg strand is now complete across units 5, 7 and 14)");
console.log("  " + json.length + " bytes " + (WRITE ? "written to " + path.relative(process.cwd(), OUT) : "(--write to save)"));
