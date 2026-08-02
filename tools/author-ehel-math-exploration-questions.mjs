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
  {
    grade: 7, unit: "unit-1", id: "explore-3", teaches: "Multiplying and Dividing Integers",
    replaces: "Write the opposite of each: a) 9 b) -14 c) 0.",
    prompt: "Work out a) (−6) × 4 b) (−7) × (−3) c) 20 ÷ (−5) d) (−36) ÷ (−9).",
    answer: "a) −24, b) 21, c) −4, d) 4.",
    hint: "Two signs the same give a positive answer; two signs different give a negative one. Work out the digits first, then decide the sign.",
  },
  {
    grade: 7, unit: "unit-1", id: "explore-4", teaches: "Multiples and the Lowest Common Multiple (LCM)",
    replaces: "Calculate: a) (-6) + (-5) b) (-9) + 4 c) 7 + (-12).",
    prompt: "a) List the first six multiples of 4 and of 6. b) What is the LCM of 4 and 6? c) Two buses leave together, one every 4 minutes and one every 6 — when do they next leave together?",
    answer: "a) 4, 8, 12, 16, 20, 24 and 6, 12, 18, 24, 30, 36. b) 12. c) After 12 minutes.",
    hint: "The lowest common multiple is the first number to appear in both lists. Timetable questions like (c) are LCM questions in disguise.",
  },
  // unit-2's cards each hold the next one's question, so three of these are
  // relocations: expanding moves back to the expanding card, substitution to
  // the substitution card, and only the equations card needs a new question.
  {
    grade: 7, unit: "unit-2", id: "explore-3", teaches: "Expanding Brackets",
    replaces: "Name the coefficient of x in: 5x + 3y − 7.",
    prompt: "Expand: a) 2(x + 3) b) 5(a + 4) c) 3(2y + 1).",
    answer: "a) 2x + 6, b) 5a + 20, c) 6y + 3.",
    hint: "Multiply the term outside the bracket by every term inside it in turn. Nothing inside is left untouched.",
  },
  {
    grade: 7, unit: "unit-2", id: "explore-4", teaches: "Substituting into Formulae",
    replaces: "Expand: a) 2(x + 3) b) 5(a + 4) c) 3(2y + 1).",
    prompt: "If y = 5, find the value of a) 2y b) y + 8 c) 3y − 1.",
    answer: "a) 10, b) 13, c) 14.",
    hint: "Replace the letter with its value, then do the arithmetic. Remember 2y means 2 × y, so put the multiplication back in.",
  },
  {
    grade: 7, unit: "unit-2", id: "explore-5", teaches: "Constructing and Solving Equations",
    replaces: "If y = 5, find the value of: a) 2y b) y + 8 c) 3y − 1.",
    prompt: "A number is doubled and then 7 is added, giving 23. a) Write this as an equation. b) Solve it. c) Check your answer against the original wording.",
    answer: "a) 2n + 7 = 23. b) 2n = 16, so n = 8. c) Double 8 is 16, and 16 + 7 = 23, so it works.",
    hint: "Turn each phrase into symbols in the order it is written, then undo the operations in reverse until the letter stands alone.",
  },
  {
    grade: 7, unit: "unit-6", id: "explore-3", teaches: "Collecting Data – Samples and Bias",
    replaces: "Find the mean of: 6, 9, 12, 8, 5.",
    prompt: "To find the favourite sport of a whole school, Amina asks only the football team. a) Why is this sample biased? b) Suggest a fairer way to choose it.",
    answer: "a) The football team is far more likely to say football, so the sample does not represent the school. b) Pick at random across every year group, so each student has an equal chance of being asked.",
    hint: "A sample is biased when some groups are likelier to be chosen than others. Ask whether every member of the population had a fair chance.",
  },
  {
    grade: 7, unit: "unit-9", id: "explore-5", teaches: "Finding the nth Term of an Arithmetic Sequence",
    replaces: "Is 5, 10, 20, 40, … arithmetic? Explain in one sentence.",
    prompt: "For the sequence 5, 8, 11, 14, … a) find the nth term rule b) use it to find the 20th term.",
    answer: "a) The common difference is 3 and the first term is 5, so the nth term is 3n + 2. b) 3 × 20 + 2 = 62.",
    hint: "Multiply n by the common difference, then adjust by whatever is needed to make the first term come out right.",
  },
  {
    grade: 7, unit: "unit-11", id: "explore-2", teaches: "Functions and Relationships",
    replaces: "State the quadrant of each point: a) (2, 5) b) (−3, 1) c) (−4, −2) d) (6, −1).",
    prompt: "A function is 'multiply by 3, then subtract 2'. a) Give the outputs for inputs 1, 2 and 5. b) Write the function using x. c) Which input gives an output of 13?",
    answer: "a) 1, 4 and 13. b) y = 3x − 2. c) x = 5, since 3 × 5 − 2 = 13.",
    hint: "A function sends each input to exactly one output. Work forwards for outputs, and undo the steps in reverse to find an input.",
  },
  {
    grade: 7, unit: "unit-11", id: "explore-6", teaches: "Real-Life Graphs",
    replaces: "Find the gradient of the line through each pair: a) (1, 2) and (4, 11) b) (0, 5) and (2, 1).",
    prompt: "A taxi fare graph starts at 200 shillings and rises by 100 shillings for every kilometre. a) What does the starting value mean? b) What does the steepness mean? c) What is the fare for 6 km?",
    answer: "a) A fixed charge of 200 shillings before any distance is travelled. b) The cost per kilometre, 100 shillings each. c) 200 + 6 × 100 = 800 shillings.",
    hint: "On a real-life graph the starting value is what you pay before anything happens, and the steepness is the rate of change.",
  },
  {
    grade: 7, unit: "unit-12", id: "explore-5", teaches: "Direct Proportion and the Unitary Method",
    replaces: "Are the ratios 2:3 and 6:9 equivalent? Show how you know.",
    prompt: "Five identical books cost 1,250 shillings. Using the unitary method, find a) the cost of one book b) the cost of 8 books.",
    answer: "a) 1,250 ÷ 5 = 250 shillings. b) 250 × 8 = 2,000 shillings.",
    hint: "The unitary method always finds the value of one first, then scales up to however many are needed.",
  },
  {
    grade: 7, unit: "unit-12", id: "explore-6", teaches: "Scale, Maps and Scale Factors",
    replaces: "Write the ratio of 1 hour to 20 minutes in its simplest form.",
    prompt: "A map has a scale of 1:50,000. a) What real distance does 3 cm on the map represent, in kilometres? b) How long on the map is a road that is 10 km long?",
    answer: "a) 3 × 50,000 = 150,000 cm, which is 1.5 km. b) 10 km is 1,000,000 cm, and 1,000,000 ÷ 50,000 = 20 cm.",
    hint: "A scale of 1:50,000 means 1 cm on the map is 50,000 cm in real life. Convert to kilometres at the end, remembering 100,000 cm make 1 km.",
  },
  // unit-14's plotting and reflection cards hold each other's questions.
  {
    grade: 7, unit: "unit-14", id: "explore-2", teaches: "Plotting and Reading Points Accurately",
    replaces: "Reflect the point (4, 5) in the x-axis.",
    prompt: "A point sits 3 units left and 4 units up from the origin. a) Write its coordinates. b) Which coordinate is written first, and why does the order matter?",
    answer: "a) (−3, 4). b) The x-coordinate comes first. (−3, 4) and (4, −3) are different points, so the order cannot be swapped.",
    hint: "Always read across before you read up. Left of the origin makes x negative, and below it makes y negative.",
  },
  {
    grade: 7, unit: "unit-14", id: "explore-3", teaches: "Translation – Sliding a Shape",
    replaces: "Name the quadrant of each point: a) (2, 7) b) (-5, 1) c) (-3, -8) d) (6, -2).",
    prompt: "A triangle has corners (1, 1), (4, 1) and (1, 3), and is translated 3 right and 2 down. a) Give the new corners. b) Does it change size or turn?",
    answer: "a) (4, −1), (7, −1) and (4, 1). b) No — a translation slides every point the same way, so size, shape and facing are all unchanged.",
    hint: "Apply the slide to every corner: 3 right adds 3 to each x, and 2 down takes 2 from each y.",
  },
  {
    grade: 7, unit: "unit-14", id: "explore-4", teaches: "Reflection – Flipping in a Mirror Line",
    replaces: "A point is 3 units left and 4 units up from the origin. Write its coordinates.",
    prompt: "a) Reflect the point (4, 5) in the x-axis. b) Now reflect (4, 5) in the y-axis instead. c) Which coordinate changes sign in each case?",
    answer: "a) (4, −5). b) (−4, 5). c) Reflecting in the x-axis changes the sign of y; reflecting in the y-axis changes the sign of x.",
    hint: "The mirror line stays still, so the coordinate measured across it flips sign while the other one is untouched.",
  },
  {
    grade: 7, unit: "unit-16", id: "explore-4", teaches: "Quartiles and the Interquartile Range",
    replaces: "Find the range of 14, 6, 22, 9, 30.",
    prompt: "For 3, 5, 7, 8, 12, 15, 21, 22: a) find the lower and upper quartiles b) find the interquartile range c) why is the IQR fairer than the range?",
    answer: "a) Lower quartile (5 + 7) ÷ 2 = 6; upper quartile (15 + 21) ÷ 2 = 18. b) IQR = 18 − 6 = 12. c) The IQR uses only the middle half, so a single extreme value cannot stretch it the way it stretches the range.",
    hint: "Split the ordered data into two halves, then find the middle of each half. The IQR is the gap between those two middles.",
  },
  {
    grade: 7, unit: "unit-16", id: "explore-5", teaches: "Trends, Patterns and Outliers",
    replaces: "For the data 4, 7, 7, 8, 9, 10, 11, find the mean, median, mode and range.",
    prompt: "Monthly rainfall in mm: 20, 22, 25, 24, 120, 26, 23. a) Describe the trend. b) Which value is an outlier? c) Should it be removed, and what must you check first?",
    answer: "a) Rainfall is steady at roughly 20–26 mm. b) 120 mm. c) Not automatically — first check whether it is a recording error or a real storm. Only a genuine error should be removed; a real value is part of the data.",
    hint: "A trend is the overall direction once the bumps are ignored. An outlier sits far from the rest, and the first question is always whether it is real.",
  },
  // unit-2 again holds a shift: the terms card had a simplify question, the
  // simplify card had an expansion, and the factorising card had a terms
  // question. Two move home; factorising and substitution need writing.
  {
    grade: 8, unit: "unit-2", id: "explore-1", teaches: "Variables, Terms and Expressions",
    replaces: "Simplify: a) 5x + 3x b) 7a − 4a + 2a c) 9m + m − 3m.",
    prompt: "For the expression 6x − 9: a) state the coefficient b) state the constant c) how many terms does it have?",
    answer: "a) 6, b) −9, c) two terms, 6x and −9.",
    hint: "A term is a part separated by + or −. The coefficient is the number multiplying the letter, and a constant has no letter at all.",
  },
  {
    grade: 8, unit: "unit-2", id: "explore-3", teaches: "Simplifying by Collecting Like Terms",
    replaces: "Expand: a) 4(x + 5) b) 3(2y − 1).",
    prompt: "Simplify: a) 6x + 4y − 2x + 3y b) 3a² + 5a − 2a² + 4a − 1.",
    answer: "a) 4x + 7y. b) a² + 9a − 1.",
    hint: "Only terms with exactly the same letter and the same power can be combined. Carry the sign in front of each term along with it.",
  },
  {
    grade: 8, unit: "unit-2", id: "explore-5", teaches: "Factorising Expressions",
    replaces: "State the coefficient and constant in 6x − 9.",
    prompt: "Factorise: a) 4x + 20 b) 6y − 9 c) 10a + 15b. Then check (a) by expanding it again.",
    answer: "a) 4(x + 5), b) 3(2y − 3), c) 5(2a + 3b). Checking (a): 4(x + 5) = 4x + 20.",
    hint: "Find the largest number that divides every term, write it outside the bracket and what is left inside. Expanding again should return exactly what you started with.",
  },
  {
    grade: 8, unit: "unit-2", id: "explore-6", teaches: "Formulae and Substitution",
    replaces: "Simplify: a) 6x + 4y − 2x + 3y b) 3a² + 5a − 2a² + 4a − 1.",
    prompt: "The area of a triangle is A = ½bh. a) Find A when b = 10 and h = 6. b) Find A when b = 7 and h = 4. c) Rearrange the formula to make h the subject.",
    answer: "a) ½ × 10 × 6 = 30. b) ½ × 7 × 4 = 14. c) h = 2A ÷ b.",
    hint: "Put the numbers in place of the letters, then work out the arithmetic. To rearrange, undo each operation applied to the letter you want on its own.",
  },
  {
    grade: 8, unit: "unit-3", id: "explore-5", teaches: "Rounding to Significant Figures",
    replaces: "How many significant figures? a) 0.00456 b) 5,607 c) 0.5670.",
    prompt: "Round to the number of significant figures given: a) 4,782 to 2 s.f. b) 0.003914 to 2 s.f. c) 25.96 to 3 s.f.",
    answer: "a) 4,800, b) 0.0039, c) 26.0.",
    hint: "Count significant figures from the first non-zero digit, then look at the next digit to decide whether to round up. Keep the place value with zeros.",
  },
  {
    grade: 8, unit: "unit-9", id: "explore-6", teaches: "Tables of Values and Linear Graphs",
    replaces: "For f(x) = 3x + 5, find a) f(2) b) f(0) c) f(−1).",
    prompt: "For y = 2x + 1: a) complete a table of values for x = −1, 0, 1, 2, 3 b) what shape does the graph take? c) where does it cross the y-axis?",
    answer: "a) y = −1, 1, 3, 5, 7. b) A straight line. c) At (0, 1), which is the value of y when x = 0.",
    hint: "Work out y for each x in turn and set them side by side. Any rule of the form y = mx + c plots as a straight line.",
  },
  {
    grade: 8, unit: "unit-10", id: "explore-5", teaches: "Simple Interest",
    replaces: "Convert to a decimal: a) 45% b) 6% c) 125% d) 0.5%.",
    prompt: "5,000 shillings is saved at 4% simple interest a year. a) Find one year's interest. b) Find the total interest after 3 years. c) What is the balance then?",
    answer: "a) 4% of 5,000 = 200 shillings. b) 200 × 3 = 600 shillings. c) 5,000 + 600 = 5,600 shillings.",
    hint: "Simple interest is paid on the original amount every year, so one year's interest just multiplies by the number of years.",
  },
  {
    grade: 8, unit: "unit-10", id: "explore-6", teaches: "Profit and Loss",
    replaces: "Increase 240 by 10% and decrease 240 by 10%. Are the answers the same distance from 240?",
    prompt: "A trader buys a goat for 4,000 shillings and sells it for 4,600. a) Find the profit. b) Give the profit as a percentage of the cost price. c) What would selling at 3,600 give instead?",
    answer: "a) 600 shillings. b) 600 ÷ 4,000 × 100 = 15%. c) A loss of 400 shillings, which is 10% of the cost price.",
    hint: "Profit and loss are always measured against the cost price, never the selling price. Find the difference first, then compare it with what was paid.",
  },
  {
    grade: 8, unit: "unit-12", id: "explore-1", teaches: "Understanding and Writing Ratios",
    replaces: "Share 150 g in the ratio 2:3:5.",
    prompt: "Express each as a ratio in its simplest form: a) ³⁄₅ b) 40% c) 500 g to 2 kg.",
    answer: "a) 3:5. b) 40:100 = 2:5. c) 500:2,000 = 1:4.",
    hint: "Put both quantities into the same unit first, then divide each side by their highest common factor.",
  },
  {
    grade: 8, unit: "unit-12", id: "explore-6", teaches: "Scale and Maps",
    replaces: "Express as ratios in simplest form: a) 3/5 b) 40% c) 500 g to 2 kg.",
    prompt: "A map has a scale of 1:25,000. a) A road measures 8 cm on the map — how long is it really, in kilometres? b) A river is 5 km long — how long is it on the map?",
    answer: "a) 8 × 25,000 = 200,000 cm, which is 2 km. b) 5 km is 500,000 cm, and 500,000 ÷ 25,000 = 20 cm.",
    hint: "Multiply by the scale factor to go from map to real life and divide to come back. Convert to kilometres last, remembering 100,000 cm make 1 km.",
  },
  {
    grade: 8, unit: "unit-14", id: "explore-2", teaches: "Distance and Midpoint",
    replaces: "Find the distance between A(1, 2) and B(4, 6).",
    prompt: "For A(1, 2) and B(4, 6): a) find the distance AB b) find the midpoint of AB.",
    answer: "a) 5 units — the horizontal gap is 3 and the vertical gap is 4, so √(3² + 4²) = √25 = 5. b) The midpoint is ((1 + 4) ÷ 2, (2 + 6) ÷ 2) = (2.5, 4).",
    hint: "For the distance, make a right-angled triangle from the horizontal and vertical gaps. For the midpoint, average the two x-values and average the two y-values.",
  },
  {
    grade: 8, unit: "unit-16", id: "explore-1", teaches: "Averages – Choosing the Right One",
    replaces: "Find the mean, median, mode and range of: 6, 9, 6, 12, 15, 6, 10.",
    prompt: "House prices on a street, in millions, are 2, 2, 3, 3, 40. a) Find the mean and the median. b) Which better describes a typical house here, and why?",
    answer: "a) Mean = 50 ÷ 5 = 10 million; median = 3 million. b) The median, because the single 40-million house drags the mean far above every other price on the street.",
    hint: "Work out both, then ask which one a buyer would recognise. One extreme value shifts the mean a long way but barely moves the median.",
  },
  {
    grade: 8, unit: "unit-16", id: "explore-2", teaches: "Spread – Range and the Interquartile Range",
    replaces: "Find the range of: 55, 48, 61, 39, 72, 50.",
    prompt: "For 4, 6, 7, 9, 11, 13, 15, 40: a) find the range b) find the interquartile range c) which describes the spread more fairly, and why?",
    answer: "a) 40 − 4 = 36. b) Lower quartile (6 + 7) ÷ 2 = 6.5, upper quartile (13 + 15) ÷ 2 = 14, so the IQR is 7.5. c) The IQR, because the single value 40 inflates the range while the middle half stays tightly grouped.",
    hint: "The range uses only the two extremes, so one unusual value controls it. The interquartile range looks at the middle half and ignores the tails.",
  },
  {
    grade: 8, unit: "unit-16", id: "explore-6", teaches: "Misleading Statistics and Unfair Samples",
    replaces: "If the mean of 5 numbers is 20, what is their total?",
    prompt: "An advert claims '9 out of 10 people prefer our soap', based on asking 10 people outside the company's own factory. a) Give two reasons this is misleading. b) What would make the claim trustworthy?",
    answer: "a) The sample is tiny, and people outside the factory are likely to be staff or their families, so they are biased towards the product. b) A large sample chosen at random from ordinary shoppers, with the size and method stated in the advert.",
    hint: "Ask two things of any statistic: how many people were asked, and who was asked. A claim can be perfectly true of its sample and still tell you nothing.",
  },
  // A second pass over cards kept during the first: not wrong, but each asked
  // something narrower than the concept it sits under, so the card never tested
  // its own point.
  {
    grade: 3, unit: "unit-5", id: "explore-4", teaches: "Times Tables – The 2s, 5s and 10s",
    replaces: "Find each quotient: a) 12 ÷ 2 b) 20 ÷ 5 c) 60 ÷ 10.",
    prompt: "Answer from memory: a) 6 × 2 b) 7 × 5 c) 9 × 10. Then use the 2s to work out 12 ÷ 2.",
    answer: "a) 12, b) 35, c) 90. And 12 ÷ 2 = 6, because 6 × 2 = 12.",
    hint: "The 2s, 5s and 10s are the tables worth knowing by heart. Once a fact is in memory the matching division comes free, because both belong to the same family.",
  },
  {
    grade: 4, unit: "unit-13", id: "explore-4", teaches: "Choosing an Efficient Method",
    replaces: "Estimate by rounding to the nearest hundred: a) 347 + 258 b) 725 − 368.",
    prompt: "Say which method is most efficient for each — mental, estimate, or written column — and why: a) 300 + 400 b) 4,782 + 2,619 c) checking whether 347 + 258 is about right.",
    answer: "a) Mental — both are round hundreds. b) Written column — four digits with carrying is too much to hold in your head. c) An estimate — 300 + 300 = 600 is enough to judge whether an answer is sensible.",
    hint: "Ask what the question actually needs. An exact four-digit total needs columns; a quick sanity check needs only an estimate.",
  },
  {
    grade: 6, unit: "unit-16", id: "explore-6", teaches: "Using the Laws Together to Simplify",
    replaces: "Evaluate: a) 15 − 6 ÷ 2 b) 3 + 4 × 5 − 2 c) 24 ÷ 6 × 2.",
    prompt: "Use the laws to make each easier before you calculate, and name the law you used: a) 4 × 17 × 25 b) 8 × 99 c) 37 + 48 + 63.",
    answer: "a) 1,700 — commutative and associative: (4 × 25) × 17 = 100 × 17. b) 792 — distributive: 8 × (100 − 1) = 800 − 8. c) 148 — commutative: (37 + 63) + 48 = 100 + 48.",
    hint: "Look for pairs that make a round number, and for a number just short of a hundred. Reordering and regrouping are allowed for addition and multiplication.",
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
