// Write exploration questions for concepts whose unit contains none that fits.
//
// repair-ehel-math-exploration-pairing.mjs moved every question to the best
// explainer available in its unit. What is left are concepts the unit simply
// never had a question for, so the fix is to write one rather than move one.
//
// Candidates come from a topic-overlap scan, but that scan is only a shortlist:
// roughly half its hits are cards where the question is numeric or symbolic and
// shares no vocabulary with its explainer while matching it perfectly ("Adding
// Ones to Two-Digit Numbers" asking "41 + 6"). Every entry below was read and
// judged by hand; the scan decided what to look at, not what to change.
//
// Each entry is guarded by the question it expects to replace. If that has
// moved, the tool stops rather than overwriting something else.
//
//   node tools/author-ehel-math-exploration-questions.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");

const QUESTIONS = [
  {
    grade: 2, unit: "unit-1", id: "explore-6", teaches: "Comparing and Ordering Numbers",
    replaces: "Circle the even numbers: 12, 17, 24, 35, 40, 61.",
    prompt: "Compare using < or >: a) 47 ___ 74 b) 85 ___ 58. Then put these in order, smallest first: 62, 26, 46.",
    answer: "a) 47 < 74, b) 85 > 58. In order: 26, 46, 62.",
    hint: "Look at the tens digit first — the number with more tens is greater. Only when the tens are equal do you compare the ones.",
  },
  {
    grade: 2, unit: "unit-2", id: "explore-4", teaches: "2D Shapes and Polygons",
    replaces: "Name each 3D shape: a) a ball b) a dice c) a tin of soup.",
    prompt: "Name the 2D shape with: a) 3 straight sides b) 4 equal straight sides c) 6 straight sides.",
    answer: "a) triangle, b) square, c) hexagon.",
    hint: "Count the straight sides. A polygon is named by how many sides it has, so counting the sides names the shape.",
  },
  {
    grade: 2, unit: "unit-5", id: "explore-5", teaches: "Subtracting Ones from Two-Digit Numbers",
    replaces: "Count in fives: 5, 10, 15, ___, ___, ___.",
    prompt: "Take away the ones: a) 48 − 5 b) 36 − 4 c) 72 − 6 d) 55 − 9.",
    answer: "a) 43, b) 32, c) 66, d) 46.",
    hint: "Keep the tens and take the ones away. In 55 − 9 you cross a ten, so count back to 50 first, then take away 4 more.",
  },
  {
    grade: 2, unit: "unit-8", id: "explore-6", teaches: "Equivalent Fractions – ½ and ²⁄₄",
    replaces: "Round each to the nearest 10: a) 32 b) 65 c) 17 d) 94.",
    prompt: "True or false: a) ½ is the same amount as ²⁄₄ b) ½ is the same amount as ¾ c) ²⁄₄ of 8 dates is 4 dates.",
    answer: "a) True, b) False, c) True.",
    hint: "Fold a paper strip in half, then fold it in half again. Two of the four parts cover exactly the same amount as one of the two halves.",
  },
  {
    grade: 2, unit: "unit-10", id: "explore-3", teaches: "Rounding and Adjusting (Compensation)",
    replaces: "Halve these: a) 8 b) 12 c) 16.",
    prompt: "Add the round number, then adjust: a) 34 + 9 b) 57 + 9 c) 26 + 19.",
    answer: "a) 34 + 10 − 1 = 43, b) 57 + 10 − 1 = 66, c) 26 + 20 − 1 = 45.",
    hint: "Adding 9 is adding 10 and then giving 1 back. Adding 19 is adding 20 and giving 1 back.",
  },
  {
    grade: 2, unit: "unit-11", id: "explore-6", teaches: "The Circle and Its Centre",
    replaces: "True or false: a straight angle looks like a straight line.",
    prompt: "True or false: a) a circle has no corners b) a circle has 4 straight sides c) every point on the rim of a circle is the same distance from its centre.",
    answer: "a) True, b) False, c) True.",
    hint: "Trace the rim of a cooking pot with your finger. There is no corner to stop at, and the rim stays the same distance from the middle the whole way round.",
  },
  {
    grade: 3, unit: "unit-3", id: "explore-4", teaches: "Subtracting Across Zeros",
    replaces: "How many shillings and cents? a) Sh 4.35 b) Sh 7.05 c) Sh 0.75.",
    prompt: "Subtract across the zeros: a) 400 − 256 b) 700 − 24 c) 600 − 145.",
    answer: "a) 144, b) 676, c) 455.",
    hint: "There is nothing to borrow from a zero, so keep going left until you reach a digit you can borrow from. In 400 − 256, take 1 hundred from the 4 to make 3 hundreds and 10 tens, then take 1 of those tens for the ones.",
  },
  {
    grade: 3, unit: "unit-9", id: "explore-2", teaches: "Adding with the Expanded Form and Number Line Methods",
    replaces: "Subtract with the column method: a) 632 − 347 b) 523 − 168 c) 861 − 374.",
    prompt: "Work out 346 + 275 twice: first with the expanded form, then by counting on along a number line. Do both methods agree?",
    answer: "Expanded form: 300 + 200 = 500, 40 + 70 = 110, 6 + 5 = 11, and 500 + 110 + 11 = 621. Number line: start at 346, jump 200 to 546, jump 70 to 616, jump 5 to 621. Both give 621.",
    hint: "For the expanded form, split both numbers into hundreds, tens and ones and add each place on its own. For the number line, start at the first number and jump the hundreds, then the tens, then the ones.",
  },
  {
    grade: 3, unit: "unit-11", id: "explore-5", teaches: "Interpreting Remainders in Real Life",
    replaces: "Write the full fact family for 9 × 6 = 54.",
    prompt: "26 children are going out in boats and each boat holds 4 children. a) Work out 26 ÷ 4. b) How many boats are needed, and why is that not the same as your division answer?",
    answer: "a) 26 ÷ 4 = 6 remainder 2. b) 7 boats, because the 2 children left over still need a boat of their own, so the answer is rounded up.",
    hint: "Do the division first, then go back to the story and ask what happens to the leftover. Sometimes it is ignored, and sometimes — as here — it needs a whole extra group.",
  },
  {
    grade: 3, unit: "unit-17", id: "explore-3", teaches: "Growing Patterns and Their Rules",
    replaces: "Continue the repeating pattern for three terms: red, blue, red, blue, ___, ___, ___.",
    prompt: "Continue each growing pattern for two more terms and name its rule: a) 3, 6, 9, 12, ___, ___ b) 2, 4, 8, 16, ___, ___.",
    answer: "a) 15, 18 — the rule is add 3 each time. b) 32, 64 — the rule is double each time.",
    hint: "Look at the jump from each term to the next. If the jump is always the same size you are adding; if each term is a multiple of the one before, you are multiplying.",
  },
  {
    grade: 4, unit: "unit-3", id: "explore-2", teaches: "Inverse Operations – the Key to Missing Numbers",
    replaces: "Round each number to the nearest 100: a) 438 b) 762 c) 1256.",
    prompt: "Use the inverse to find each missing number: a) 37 + ___ = 82 b) ___ − 46 = 125 c) 8 × ___ = 96.",
    answer: "a) 45, because 82 − 37 = 45. b) 171, because 125 + 46 = 171. c) 12, because 96 ÷ 8 = 12.",
    hint: "Undo the operation you can see. A missing part of an addition is found by subtracting, a missing start of a subtraction by adding, and a missing factor by dividing.",
  },
  {
    grade: 4, unit: "unit-15", id: "explore-5", teaches: "Tests of Divisibility",
    replaces: "Compare with < or >: a) −4 __ −7 b) 3 __ −2 c) −6 __ 2.",
    prompt: "Use the divisibility tests: a) Is 246 divisible by 3? b) Is 1,530 divisible by both 5 and 10? c) Is 784 divisible by both 2 and 4?",
    answer: "a) Yes — the digits add to 2 + 4 + 6 = 12, and 12 divides by 3. b) Yes to both — it ends in 0. c) Yes to both — it is even, and its last two digits, 84, divide by 4.",
    hint: "Test for 3 with the digit sum, for 5 and 10 with the last digit, for 2 with whether the number is even, and for 4 with the last two digits.",
  },
  {
    grade: 4, unit: "unit-15", id: "explore-6", teaches: "Sorting Numbers with Venn Diagrams",
    replaces: "List the first eight multiples of 3.",
    prompt: "A Venn diagram has one ring for 'multiples of 3' and another for 'even numbers'. Where does each of these go: 9, 12, 14, 25?",
    answer: "9 goes in the multiples of 3 ring only. 12 goes in the overlap, being both a multiple of 3 and even. 14 goes in the even ring only. 25 goes outside both rings.",
    hint: "Test each number against both properties in turn. One that passes both belongs in the overlap; one that passes neither sits outside the rings altogether.",
  },
  {
    grade: 4, unit: "unit-17", id: "explore-3", teaches: "An Efficient Method for Division",
    replaces: "Multiply using the column method: a) 34 × 7 b) 63 × 5 c) 28 × 4.",
    prompt: "Divide using an efficient written method: a) 96 ÷ 4 b) 175 ÷ 5 c) 138 ÷ 6.",
    answer: "a) 24, b) 35, c) 23.",
    hint: "Split the number into parts that divide easily. For 96 ÷ 4, take 80 ÷ 4 = 20 and 16 ÷ 4 = 4, then add them to get 24.",
  },
  {
    grade: 4, unit: "unit-18", id: "explore-1", teaches: "The Eight Compass Directions",
    replaces: "Write the four main compass directions in clockwise order, starting from North.",
    prompt: "Write all eight compass directions in clockwise order, starting from North.",
    answer: "North, North-East, East, South-East, South, South-West, West, North-West.",
    hint: "Write the four main directions first, then name the one that sits between each pair. An in-between direction takes both names, such as North-East between North and East.",
  },
  {
    grade: 4, unit: "unit-18", id: "explore-5", teaches: "Understanding Reflections",
    replaces: "True or false: moving East increases the x-coordinate.",
    prompt: "A triangle sits to the left of a vertical mirror line. After it is reflected: a) which way does it face? b) does its size change? c) a corner was 3 squares from the line — how far is it now?",
    answer: "a) It faces the opposite way, as though flipped over. b) No — a reflection never changes size or shape. c) Still 3 squares, but on the other side of the line.",
    hint: "Fold the paper along the mirror line. The reflected shape lands exactly on top of the original, which is why every distance from the line stays the same.",
  },
  // unit-4's two cards held each other's questions: the intro card asked which
  // average to choose, and the card about choosing asked for a median.
  {
    grade: 5, unit: "unit-4", id: "explore-1", teaches: "What Is an Average?",
    replaces: "Which average would you use to find the most popular ice-cream flavour – mode, median or mean?",
    prompt: "Four friends are 132, 138, 141 and 145 cm tall. Find the mean height by adding the four heights and sharing the total equally.",
    answer: "132 + 138 + 141 + 145 = 556, and 556 ÷ 4 = 139 cm.",
    hint: "An average is one number that stands in for a whole set. For the mean, total everything first, then share that total equally between however many values there are.",
  },
  {
    grade: 5, unit: "unit-4", id: "explore-6", teaches: "Choosing and Interpreting the Right Average",
    replaces: "Find the median of an even set: 12, 5, 9, 7.",
    prompt: "Which average fits best, and why: a) the most popular ice-cream flavour b) wages where one person earns far more than everyone else c) the middle of 5, 6, 7, 8, 100?",
    answer: "a) Mode — flavours are categories, and only the mode finds the most common. b) Median — one very large wage drags the mean upwards, so the median better shows a typical wage. c) Median = 7; the mean is 25.2, which nobody is near.",
    hint: "Ask what the number has to represent. Use the mode for categories, and prefer the median when one extreme value would pull the mean away from what is typical.",
  },
  {
    grade: 5, unit: "unit-5", id: "explore-5", teaches: "Positive and Negative Numbers",
    replaces: "Add: a) 15.6 + 7.8 b) 23.45 + 16.78 c) 9.07 + 4.95",
    prompt: "The temperature is −3 °C at dawn and rises 8 degrees by noon. a) What is the noon temperature? b) Order these coldest first: 2, −7, 0, −1, 5.",
    answer: "a) −3 + 8 = 5 °C. b) −7, −1, 0, 2, 5.",
    hint: "Picture a number line with zero in the middle. Rising moves you right, and the further left a number sits, the colder it is.",
  },
  {
    grade: 5, unit: "unit-6", id: "explore-6", teaches: "Drawing Solids and Seeing Different Views",
    replaces: "Is each shape 2D or 3D: a) circle b) sphere c) triangle d) cuboid?",
    prompt: "A cylinder stands upright on a table. What shape do you see a) from directly above b) from the front? c) Why is a drawing of it on paper only an illusion of a solid?",
    answer: "a) A circle. b) A rectangle. c) The paper is flat, so the drawing uses slanted lines and hidden edges to suggest a depth that is not really there.",
    hint: "Imagine looking straight down on a tin, then straight at its side. Each direction shows a different flat outline of the same solid.",
  },
  {
    grade: 5, unit: "unit-7", id: "explore-4", teaches: "Decimals and Percentages",
    replaces: "Find: a) 1/4 of 20 b) 3/5 of 15 c) 2/3 of 18.",
    prompt: "Write each as a decimal and as a percentage: a) ½ b) ¼ c) ³⁄₁₀.",
    answer: "a) 0.5 and 50%. b) 0.25 and 25%. c) 0.3 and 30%.",
    hint: "Turn the fraction into tenths or hundredths first. Hundredths read straight off as a percentage, because per cent means out of a hundred.",
  },
  {
    grade: 5, unit: "unit-11", id: "explore-1", teaches: "Estimate First, Every Time",
    replaces: "Calculate: a) 34 × 7 b) 47 × 6 c) 58 × 4.",
    prompt: "Estimate by rounding, then say whether the exact answer will be larger or smaller than your estimate: a) 34 × 7 b) 296 ÷ 4.",
    answer: "a) About 30 × 7 = 210; the exact 238 is larger, because 34 was rounded down. b) About 300 ÷ 4 = 75; the exact 74 is slightly smaller, because 296 was rounded up.",
    hint: "Round to numbers you can handle in your head, then ask which way you rounded — rounding down leaves the estimate too small, rounding up leaves it too big.",
  },
  {
    grade: 5, unit: "unit-11", id: "explore-2", teaches: "Short Multiplication (by a one-digit number)",
    replaces: "Divide: a) 144 ÷ 12 b) 156 ÷ 13 c) 96 ÷ 8.",
    prompt: "Use short multiplication: a) 243 × 6 b) 187 × 4 c) 425 × 3.",
    answer: "a) 1,458, b) 748, c) 1,275.",
    hint: "Multiply the ones first and carry into the tens, then the tens into the hundreds. Write the carried digit small under the line so it is not lost.",
  },
  {
    grade: 5, unit: "unit-11", id: "explore-5", teaches: "Remainders – Three Ways to Write Them",
    replaces: "Estimate first, then say if the answer is sensible: is 47 × 8 closer to 300 or 400?",
    prompt: "Work out 47 ÷ 5 and write the answer three ways: with a remainder, as a mixed fraction, and as a decimal.",
    answer: "9 remainder 2; 9 ²⁄₅; and 9.4.",
    hint: "The remainder becomes the numerator over the divisor, so 2 left over out of 5 is ²⁄₅ — and ²⁄₅ is 0.4.",
  },
  {
    grade: 5, unit: "unit-12", id: "explore-5", teaches: "Frequency Diagrams for Continuous Data",
    replaces: "Find the range of: 12, 5, 20, 8, 15.",
    prompt: "Heights in cm are grouped 120–129, 130–139 and 140–149, with frequencies 4, 9 and 7. a) How many children were measured? b) Which group is most common? c) Why are the bars drawn touching?",
    answer: "a) 4 + 9 + 7 = 20 children. b) 130–139, with 9. c) Height is continuous, so the groups run straight into each other with no gaps between them.",
    hint: "Continuous data is measured rather than counted, so every value in between is possible — which is why the bars touch instead of standing apart.",
  },
  {
    grade: 5, unit: "unit-15", id: "explore-5", teaches: "A Problem-Solving Plan",
    replaces: "Calculate: a) 1/2 ÷ 2 b) 1/3 ÷ 3 c) 1/5 ÷ 5.",
    prompt: "A shop has 6 crates of mangoes with 24 in each, and sells 38 before noon. Work through the plan — read, decide, calculate, check — to find how many are left.",
    answer: "Read: crates of mangoes, some sold. Decide: multiply, then subtract. Calculate: 6 × 24 = 144, then 144 − 38 = 106. Check: 106 + 38 = 144, so it fits.",
    hint: "Follow the plan in order, and decide what to calculate before calculating anything. Finish by working backwards to check the answer.",
  },
  {
    grade: 5, unit: "unit-15", id: "explore-6", teaches: "Estimating and Checking",
    replaces: "Calculate: a) 0.2 × 3 b) 0.4 × 2 c) 0.5 × 4.",
    prompt: "Estimate 0.48 × 6, then work it out exactly. Was the estimate close, and did the exact answer come out above or below it?",
    answer: "Estimate about 0.5 × 6 = 3. Exact: 0.48 × 6 = 2.88, a little below the estimate, because 0.48 was rounded up to 0.5.",
    hint: "Round to a friendly decimal first. Then ask which way you rounded — rounding up leaves the estimate a little too large.",
  },
  {
    grade: 5, unit: "unit-18", id: "explore-4", teaches: "Distance Between Points",
    replaces: "Plot and label: A (1, 6), B (6, 1), C (0, 4), D (3, 0), E (−2, 3).",
    prompt: "Find the distance between: a) A (2, 3) and B (7, 3) b) C (4, 1) and D (4, 9).",
    answer: "a) 5 units — the y-coordinates match, so count along: 7 − 2 = 5. b) 8 units — the x-coordinates match, so count up: 9 − 1 = 8.",
    hint: "Two points sharing a y-coordinate lie on a horizontal line, so subtract the x-values. Two sharing an x-coordinate lie on a vertical line, so subtract the y-values.",
  },
  {
    grade: 5, unit: "unit-18", id: "explore-5", teaches: "Shapes on the Grid – Finding a Missing Vertex",
    replaces: "Which quadrant is each point in? a) (3, 4) b) (−2, 1) c) (−5, −3) d) (4, −2)",
    prompt: "Three corners of a rectangle are A (1, 2), B (6, 2) and C (6, 5). a) Give the coordinates of the fourth corner D. b) How did you work it out?",
    answer: "a) D is (1, 5). b) D shares its x-coordinate with A and its y-coordinate with C, because opposite sides of a rectangle are parallel and equal.",
    hint: "Sketch the three points first. The fourth corner lines up vertically with one of them and horizontally with another.",
  },
  {
    grade: 6, unit: "unit-3", id: "explore-5", teaches: "The Range – Measuring the Spread",
    replaces: "Find the median of the even set 4, 7, 9, 12, 15, 18 by averaging the two middle values.",
    prompt: "Class A scores 6, 7, 7, 8, 9 and Class B scores 2, 5, 7, 9, 14. a) Find the range of each. b) Which class is more spread out?",
    answer: "a) Class A: 9 − 6 = 3. Class B: 14 − 2 = 12. b) Class B, because its range is four times larger even though the middle scores are similar.",
    hint: "The range is the largest value minus the smallest. It says nothing about the typical score — only how far apart the extremes lie.",
  },
  {
    grade: 6, unit: "unit-3", id: "explore-6", teaches: "Comparing Data and Choosing the Right Average",
    replaces: "Find the range of 78, 85, 92, 68, 88, 75, 90.",
    prompt: "Shop A sells 20, 22, 21, 23, 24 and Shop B sells 1, 2, 21, 40, 46. Both have a mean of 22. a) Which average describes Shop B better, and why? b) What does comparing the ranges add?",
    answer: "a) The median, 21 — Shop B's values swing so widely that a mean of 22 hides it. b) Shop A's range is 4 and Shop B's is 45, so Shop A is steady and Shop B unpredictable, though their averages look identical.",
    hint: "When two sets share an average, look at the spread. The average tells you the middle; the range tells you how far the values roam from it.",
  },
  // This question was sitting on unit-4's equations card. It is exactly what
  // "Written Methods and Checking Your Work" teaches, so it moves here rather
  // than being rewritten, and the equations card gets one of its own below.
  {
    grade: 6, unit: "unit-4", id: "explore-2", teaches: "Written Methods and Checking Your Work",
    replaces: "Work out: a) −8 + 5 b) 6 + (−9) c) −4 + (−6).",
    prompt: "Calculate exactly with a written column method, then check each against an estimate: a) 56,789 + 23,456 b) 123,456 − 78,234.",
    answer: "a) 80,245, and the estimate 57,000 + 23,000 = 80,000 agrees. b) 45,222, and the estimate 123,000 − 78,000 = 45,000 agrees.",
    hint: "Line the digits up by place value and work from the right. Then round both numbers and redo it roughly — if the two answers sit far apart, something slipped.",
  },
  {
    grade: 6, unit: "unit-4", id: "explore-5", teaches: "Using Letters to Represent Numbers",
    replaces: "Fill the comparisons with < or >: a) −4 ___ −7 b) −2 ___ 1 c) 0 ___ −5.",
    prompt: "A bag holds n mangoes. Write an expression for a) 5 more than n b) three times n c) n shared equally between 4. d) What is each worth when n = 12?",
    answer: "a) n + 5, b) 3n, c) n ÷ 4. d) With n = 12 they are 17, 36 and 3.",
    hint: "A letter simply stands for a number you do not know yet. Write what you would do to the number, putting the letter where the number would go.",
  },
  {
    grade: 6, unit: "unit-4", id: "explore-6", teaches: "Simple Equations and Perimeter Expressions",
    replaces: "Calculate exactly and check with an estimate: a) 56,789 + 23,456 b) 123,456 − 78,234.",
    prompt: "A rectangle has width w and length w + 3. a) Write an expression for its perimeter. b) Solve 2w + 7 = 19 to find w.",
    answer: "a) Perimeter = 2w + 2(w + 3) = 4w + 6. b) 2w = 19 − 7 = 12, so w = 6.",
    hint: "Perimeter adds every side, so account for two widths and two lengths. To solve an equation, undo each operation in turn until the letter stands alone.",
  },
  {
    grade: 6, unit: "unit-7", id: "explore-4", teaches: "Composite Shapes",
    replaces: "How many minutes are in 2.5 hours?",
    prompt: "An L-shape is a 6 cm by 4 cm rectangle with a 2 cm by 2 cm square cut from one corner. Find its area and explain the method you chose.",
    answer: "6 × 4 = 24 cm², less 2 × 2 = 4 cm², giving 20 cm². The method is to take the whole rectangle and subtract the missing piece.",
    hint: "Either split the shape into simple ones and add, or take a simple shape and subtract what is missing. Both work — pick whichever needs fewer steps.",
  },
  {
    grade: 6, unit: "unit-9", id: "explore-3", teaches: "Calculating Probability",
    replaces: "Convert to a percentage: a) 1/4 b) 3/5 c) 0.35",
    prompt: "A bag holds 4 red, 3 blue and 5 green counters. Find a) P(red) b) P(not green) c) the total of all three colour probabilities.",
    answer: "There are 12 counters. a) 4/12 = 1/3. b) 7/12. c) 4/12 + 3/12 + 5/12 = 1.",
    hint: "Probability is favourable outcomes over total outcomes. All the possible outcomes together must come to 1, which is a quick way to check your working.",
  },
  {
    grade: 6, unit: "unit-14", id: "explore-4", teaches: "Dividing by a Fraction – Using the Reciprocal",
    replaces: "Calculate 0.5 × 0.8.",
    prompt: "Work out a) 3 ÷ ½ b) ¾ ÷ ⅔. c) Why is the answer to (a) bigger than 3?",
    answer: "a) 3 × ²⁄₁ = 6. b) ¾ × ³⁄₂ = ⁹⁄₈, or 1⅛. c) You are asking how many halves fit into 3, and halves are small, so a lot of them fit.",
    hint: "Dividing by a fraction is the same as multiplying by its reciprocal — turn the second fraction upside down, then multiply.",
  },
  {
    grade: 6, unit: "unit-15", id: "explore-1", teaches: "Types of Data",
    replaces: "Find the range of: 30, 12, 45, 19, 28.",
    prompt: "Say whether each is discrete or continuous, and why: a) the number of goats in a pen b) the mass of a sack of rice c) the shoe sizes a shop sells.",
    answer: "a) Discrete — goats are counted in whole numbers. b) Continuous — mass is measured and can take any value in a range. c) Discrete — sizes come in fixed steps, not every value between.",
    hint: "Ask whether the data is counted or measured. Counted data lands on separate values; measured data can fall anywhere in between.",
  },
  {
    grade: 6, unit: "unit-17", id: "explore-5", teaches: "Rotations (Turning)",
    replaces: "Name the quadrant for each point: a) (3, 5) b) (-1, 2) c) (4, -4) d) (-3, -1).",
    prompt: "A point at (3, 1) is rotated 90° clockwise about the origin. a) Where does it land? b) Does a rotation change the shape's size? c) What stays fixed during any rotation?",
    answer: "a) At (1, −3). b) No — a rotation never changes size or shape. c) The centre of rotation; every other point sweeps along a circle around it.",
    hint: "Turn the paper itself and watch one corner travel. A 90° clockwise turn about the origin sends the point (x, y) to (y, −x).",
  },
];

const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const cache = new Map();
const applied = [];
let alreadyDone = 0;
const problems = [];

for (const q of QUESTIONS) {
  const file = path.join(mathRoot, `grade-${q.grade}`, "data", "units", `${q.unit}.json`);
  if (!fs.existsSync(file)) { problems.push(`grade-${q.grade}/${q.unit}: file missing`); continue; }
  if (!cache.has(file)) cache.set(file, JSON.parse(fs.readFileSync(file, "utf8")));
  const unit = cache.get(file);
  const card = (unit.explorations || []).find((e) => e.id === q.id);
  if (!card) { problems.push(`grade-${q.grade}/${q.unit} ${q.id}: card not found`); continue; }
  if (norm(card.title) !== norm(q.teaches)) { problems.push(`grade-${q.grade}/${q.unit} ${q.id}: teaches "${norm(card.title)}", expected "${q.teaches}"`); continue; }
  // Already written on an earlier run: idempotent, not an error. Only a card
  // holding neither the old question nor the new one means something moved.
  if (norm(card.prompt) === norm(q.prompt)) { alreadyDone += 1; continue; }
  if (norm(card.prompt) !== norm(q.replaces)) { problems.push(`grade-${q.grade}/${q.unit} ${q.id}: question has moved — found "${norm(card.prompt).slice(0, 60)}"`); continue; }
  applied.push({ where: `grade-${q.grade}/${q.unit} ${q.id}`, teaches: q.teaches, from: q.replaces, to: q.prompt });
  card.prompt = q.prompt;
  card.answer = q.answer;
  card.hint = q.hint;
}

if (problems.length) {
  console.error(`ERROR: ${problems.length} entr(ies) did not match; nothing written:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
if (write) for (const [file, unit] of cache) fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`, "utf8");

console.log(`${write ? "APPLIED" : "DRY RUN"} — ${applied.length} question(s) written\n`);
for (const a of applied) {
  console.log(`  ${a.where} — ${a.teaches}`);
  console.log(`    -  ${a.from}`);
  console.log(`    +  ${a.to}\n`);
}
if (!write) console.log("Re-run with --write to apply.");
