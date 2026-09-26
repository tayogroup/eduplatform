// Build Mathematics Grade 9, Unit 9: Sequences and Functions.
//
// Tenth Grade 9 unit. Authored from the Stage 9 Learner's Book pages 192-215 and
// Workbook pages 114-126.
//
// THREE SECTIONS, THREE OBJECTIVES:
//
//   9.1 Generating sequences    -> 9As.01
//   9.2 Using the nth term      -> 9As.02
//   9.3 Representing functions  -> 9As.03
//
// THE SECOND DIFFERENCE IS THE IDEA THE UNIT TURNS ON. A linear sequence has
// constant FIRST differences; a quadratic sequence has constant SECOND
// differences. That single test tells a learner which kind of sequence is in
// front of them before they try to find a rule for it, and without it they are
// guessing. The Learner's Book introduces it through Serge's working on
// 2, 5, 10, 17, 26, 37 - first differences 3, 5, 7, 9, 11, second differences all
// 2 - and this unit keeps that example because the arithmetic is clean enough to
// see the pattern in.
//
// 9As.02 NAMES THE FORM "an +/- b, where a and b are positive or negative
// integers", so the unit is careful to include negative a and negative b rather
// than only the easy ascending cases. A learner who has only met 3n + 2 has not
// met the objective.
//
// 9As.03 IS A DEFINITION BEFORE IT IS A SKILL: "a function is a relationship
// where each input has a single output". That is what separates a function from
// any other rule, and it is checkable - so the unit asks a learner to decide
// whether something IS a function, not only to evaluate one. A function machine,
// a table, a mapping diagram and an equation are four representations of the same
// object, and moving between them is the section's work.
//
//   node tools/build-ehel-math-g9-unit9.mjs [--write]

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-9.json");
const WRITE = process.argv.includes("--write");

const FW = path.resolve(HERE, "..", "src", "curriculum", "cambridge-mathematics-0862.json");
const fw = {};
(function walk(o) {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) return o.forEach(walk);
  if (typeof o.code === "string" && /^9As\.\d{2}$/.test(o.code)) fw[o.code] = o.text;
  Object.values(o).forEach(walk);
})(JSON.parse(fs.readFileSync(FW, "utf8")));

const OBJ = ["9As.01", "9As.02", "9As.03"];
for (const c of OBJ) if (!fw[c]) throw new Error("0862 has no " + c);

const outcomes = [
  "Generate a sequence from its first term and a term-to-term rule, including a rule that changes each step.",
  "Decide whether a sequence is linear, quadratic or neither, using first and second differences.",
  "Find the nth term rule of a linear sequence in the form an + b, with a or b negative.",
  "Find the nth term rule of a quadratic sequence based on n squared.",
  "Use an nth term rule to find any term, and to decide which of two distant terms is larger.",
  "Explain what makes a relationship a function, and decide whether a given rule is one.",
  "Move between the four representations of a function: machine, table, mapping diagram and equation.",
  "Find the equation of a function from a table of inputs and outputs.",
];

const concepts = [
  {
    id: "concept-1-generating",
    title: "A First Term and a Rule Generate Everything",
    explanation:
      "Give a sequence its first term and a term-to-term rule and every term follows. In a LINEAR " +
      "sequence the rule adds or subtracts the same amount each time, so the terms climb or fall " +
      "steadily. In a NON-LINEAR sequence the step itself changes - 'add 3, add 5, add 7' - and the " +
      "sequence curves. The term-to-term rule is easy to use and has one weakness: to find the hundredth " +
      "term you have to walk through the first ninety-nine.",
    example:
      "First term 1, rule 'add 2 and a half': 1, 3.5, 6, 8.5, 11 - linear, because the step never " +
      "changes. First term 1, rule 'add 3, add 5, add 7, add 9': 1, 4, 9, 16, 25 - non-linear, and those " +
      "are the square numbers. First term 7, rule 'add 1, add 3, add 5, add 7, add 9': 7, 8, 11, 16, 23, " +
      "32.",
  },
  {
    id: "concept-2-second-differences",
    title: "The Second Difference Tells You What Kind of Sequence It Is",
    explanation:
      "Before hunting for a rule, find out what kind of sequence you have. Write the differences between " +
      "consecutive terms - the FIRST differences. If they are all the same, the sequence is linear. If " +
      "they are not, take the differences of those differences - the SECOND differences. If THOSE are all " +
      "the same, the sequence is quadratic, which means its rule involves n squared. If neither is " +
      "constant, it is something else again, such as a doubling sequence. This test costs two lines and " +
      "saves you from guessing.",
    example:
      "For 2, 5, 10, 17, 26, 37 the first differences are 3, 5, 7, 9, 11 - not constant, so not linear. " +
      "The second differences are 2, 2, 2, 2 - all the same, so the sequence is quadratic. For " +
      "20, 18, 16, 14 the first differences are all -2, so it is linear. For 2, 4, 8, 16, 32 neither the " +
      "first nor the second differences are constant: it doubles, and is neither linear nor quadratic.",
  },
  {
    id: "concept-3-nth-term-linear",
    title: "The nth Term of a Linear Sequence",
    explanation:
      "An nth term rule gives any term directly from its position, with no walking. For a linear " +
      "sequence the rule has the form an + b: a is the constant first difference, and b is whatever you " +
      "must add to a x 1 to reach the first term. Both a and b may be negative, and a learner who has " +
      "only met rules like 3n + 2 has met half the topic - a descending sequence has a negative a, and " +
      "plenty of sequences need a negative b.",
    example:
      "For 5, 8, 11, 14 the difference is 3, so the rule starts 3n. At n = 1 that gives 3, and the first " +
      "term is 5, so b = 2 and the rule is 3n + 2. For 20, 18, 16, 14 the difference is -2, so -2n; at " +
      "n = 1 that gives -2 and the term is 20, so the rule is -2n + 22. For 1, 5, 9, 13 the rule is " +
      "4n - 3, with b negative.",
  },
  {
    id: "concept-4-nth-term-quadratic",
    title: "The nth Term of a Quadratic Sequence",
    explanation:
      "If the second differences are all the same, the rule contains n squared. The coefficient of n " +
      "squared is HALF the second difference - so a second difference of 2 means the rule starts with n " +
      "squared exactly. Subtract n squared from each term and you are left with a simpler sequence, " +
      "usually linear, whose rule you already know how to find. Add the two parts together and you have " +
      "the whole rule.",
    example:
      "For 2, 5, 10, 17, 26, 37 the second difference is 2, so the rule starts with n squared. " +
      "Subtracting 1, 4, 9, 16, 25, 36 from the terms leaves 1, 1, 1, 1, 1, 1 - so the rule is " +
      "n squared + 1. Check at n = 4: 16 + 1 = 17. For 7, 8, 11, 16, 23, 32 the second difference is " +
      "again 2; subtracting n squared leaves 6, 4, 2, 0, -2, -4, which is linear with difference -2, " +
      "giving -2n + 8. So the rule is n squared - 2n + 8.",
  },
  {
    id: "concept-5-what-a-function-is",
    title: "A Function Gives Each Input Exactly One Output",
    explanation:
      "A function is a relationship in which every input has a single output. That is the whole " +
      "definition, and it is a test you can apply: if one input could give two different answers, the " +
      "relationship is not a function. 'Multiply by 5 and subtract 1' is a function - feed it 3 and you " +
      "get 14, every time. 'A number's square root' is not, if both roots are allowed, because 9 would " +
      "give both 3 and -3. Being able to decide is part of the objective, not only being able to " +
      "evaluate.",
    example:
      "y = 5x - 1 is a function: each x gives one y. A table pairing 1 with 4 and also 1 with 7 cannot " +
      "come from a function, because the input 1 has two outputs. Note that the reverse is allowed - two " +
      "different inputs MAY share an output, as in y = x squared where both 3 and -3 give 9, and that is " +
      "still a function.",
  },
  {
    id: "concept-6-four-representations",
    title: "Four Ways to Write the Same Function",
    explanation:
      "A function can be shown as a MACHINE with operations in boxes, as a TABLE of inputs and outputs, " +
      "as a MAPPING DIAGRAM with arrows between two number lines, or as an EQUATION. These are four " +
      "descriptions of one object, and fluency means moving between them in any direction. The equation " +
      "is the most useful because you can substitute into it, and reading one off a table is the skill " +
      "worth practising: find what happens to the inputs, and check it on every row rather than the " +
      "first.",
    example:
      "A machine that multiplies by 5 then subtracts 1 gives the table 1 to 4, 2 to 9, 3 to 14. The " +
      "equation is y = 5x - 1. Going backwards from a table of 1 to 3, 2 to 5, 3 to 7: the outputs go up " +
      "by 2 as the inputs go up by 1, so the rule contains 2x, and 2 x 1 = 2 while the output is 3, so " +
      "y = 2x + 1. Check on the LAST row too: 2 x 3 + 1 = 7. Correct.",
  },
];

const methods = [
  { id: "method-1", outcomeId: "lo01", difficulty: "Core", title: "How to generate a sequence from a rule",
    example: "First term 7; rule 'add 1, add 3, add 5, add 7, add 9'.",
    steps: ["Write the first term: 7.",
      "Apply the first instruction: 7 + 1 = 8.",
      "Apply the next: 8 + 3 = 11, then 11 + 5 = 16.",
      "Continue: 16 + 7 = 23, then 23 + 9 = 32.",
      "The sequence is 7, 8, 11, 16, 23, 32 - and the changing step tells you it is not linear."] },
  { id: "method-2", outcomeId: "lo02", difficulty: "Core", title: "How to classify a sequence",
    example: "Is 2, 5, 10, 17, 26, 37 linear, quadratic or neither?",
    steps: ["Write the first differences underneath: 3, 5, 7, 9, 11.",
      "Are they all the same? No - so it is not linear.",
      "Write the second differences: 2, 2, 2, 2.",
      "Are those all the same? Yes - so it is quadratic and the rule involves n squared.",
      "If neither had been constant, it would be neither; check for doubling or another pattern."] },
  { id: "method-3", outcomeId: "lo03", difficulty: "Core", title: "How to find a linear nth term rule",
    example: "Find the nth term of 5, 8, 11, 14.",
    steps: ["Find the constant first difference: 3. That is the coefficient of n, so start with 3n.",
      "Work out 3n at n = 1: that gives 3.",
      "Compare with the actual first term, 5. You need 2 more.",
      "So the rule is 3n + 2.",
      "Check it on a LATER term: at n = 4, 3 x 4 + 2 = 14. Correct."] },
  { id: "method-4", outcomeId: "lo04", difficulty: "Extension", title: "How to find a quadratic nth term rule",
    example: "Find the nth term of 2, 5, 10, 17, 26, 37.",
    steps: ["Confirm the second differences are constant: they are all 2.",
      "Halve the second difference to get the coefficient of n squared: 2 / 2 = 1, so start with n squared.",
      "Write out n squared for each position: 1, 4, 9, 16, 25, 36.",
      "Subtract those from the terms: 1, 1, 1, 1, 1, 1.",
      "That remainder is the rest of the rule, so the nth term is n squared + 1. Check at n = 5: 25 + 1 = 26."] },
  { id: "method-5", outcomeId: "lo06", difficulty: "Core", title: "How to decide whether something is a function",
    example: "Is a table pairing 1 with 4, 2 with 9 and 1 with 7 a function?",
    steps: ["List the inputs and look for any that appears more than once.",
      "The input 1 appears twice.",
      "Check whether its outputs agree. They do not - 4 and 7.",
      "One input with two outputs, so this is NOT a function.",
      "Remember the reverse is allowed: two inputs may share one output and it is still a function."] },
  { id: "method-6", outcomeId: "lo08", difficulty: "Core", title: "How to find an equation from a table",
    example: "Inputs 1, 2, 3 give outputs 3, 5, 7.",
    steps: ["Find how much the output changes when the input goes up by 1: here 2.",
      "That is the coefficient of x, so the rule contains 2x.",
      "Test 2x on the first row: 2 x 1 = 2, but the output is 3, so add 1.",
      "The equation is y = 2x + 1.",
      "Check it on every remaining row, not just the first: 2 x 3 + 1 = 7. Correct."] },
];

const workedExamples = [
  { id: "we01", outcomeId: "lo01", difficulty: "Basic", twm: "characterising", title: "Linear and non-linear from the rule",
    prompt: "Generate five terms from: first term 1, add 2.5 each time; and first term 1, rule 'add 3, add 5, add 7, add 9'.",
    solution: "The first gives 1, 3.5, 6, 8.5, 11 - the step never changes, so it is linear. The second gives 1, 4, 9, 16, 25 - the step grows each time, so it is non-linear, and those terms are the square numbers. The kind of sequence is visible in the rule before any terms are written." },
  { id: "we02", outcomeId: "lo01", difficulty: "Core", twm: "specialising", title: "A changing step",
    prompt: "First term 7, rule 'add 1, add 3, add 5, add 7, add 9'. Write six terms.",
    solution: "7, then 7 + 1 = 8, then 8 + 3 = 11, then 11 + 5 = 16, then 16 + 7 = 23, then 23 + 9 = 32. So 7, 8, 11, 16, 23, 32. Because the step increases by 2 each time, the second differences will all be 2 - which is the signature of a quadratic sequence." },
  { id: "we03", outcomeId: "lo02", difficulty: "Core", twm: "classifying", title: "First and second differences",
    prompt: "Classify 2, 5, 10, 17, 26, 37 and 20, 18, 16, 14, 12 and 2, 4, 8, 16, 32.",
    solution: "For the first, the first differences are 3, 5, 7, 9, 11 - not constant. The second differences are 2, 2, 2, 2 - constant, so it is QUADRATIC. For the second, the first differences are all -2, so it is LINEAR. For the third, the first differences are 2, 4, 8, 16 and the second differences are 2, 4, 8 - neither is constant, so it is NEITHER; it doubles each time." },
  { id: "we04", outcomeId: "lo02", difficulty: "Core", twm: "classifying", title: "Sorting a set of sequences",
    prompt: "Classify 1, 4, 9, 16, 25 and 60, 30, 15, 7.5 and 25, 24, 22, 19, 15.",
    solution: "1, 4, 9, 16, 25: first differences 3, 5, 7, 9; second differences all 2 - quadratic. 60, 30, 15, 7.5: each term is half the last, so first differences -30, -15, -7.5 and second differences -15, -7.5 - neither constant, so neither linear nor quadratic. 25, 24, 22, 19, 15: first differences -1, -2, -3, -4; second differences all -1 - quadratic, with a negative second difference." },
  { id: "we05", outcomeId: "lo03", difficulty: "Core", twm: "generalising", title: "A linear nth term",
    prompt: "Find the nth term of 5, 8, 11, 14, and of 1, 5, 9, 13.",
    solution: "For 5, 8, 11, 14 the difference is 3, so start with 3n; at n = 1 that is 3 and the term is 5, so the rule is 3n + 2. For 1, 5, 9, 13 the difference is 4, so 4n; at n = 1 that is 4 and the term is 1, so we need 3 fewer: 4n - 3. Note b is negative in the second, which is just as common as positive." },
  { id: "we06", outcomeId: "lo03", difficulty: "Core", twm: "specialising", title: "A descending sequence has a negative a",
    prompt: "Find the nth term of 20, 18, 16, 14, 12.",
    solution: "The first difference is -2, so the rule starts with -2n. At n = 1 that gives -2, and the first term is 20, so we need 22 more: the rule is -2n + 22. Checking at n = 5: -10 + 22 = 12. Correct. A sequence going down has a negative coefficient of n, and the objective names negative integers explicitly." },
  { id: "we07", outcomeId: "lo04", difficulty: "Extension", twm: "generalising", title: "A quadratic nth term, step by step",
    prompt: "Find the nth term of 2, 5, 10, 17, 26, 37.",
    solution: "The second differences are all 2, so halving gives 1 as the coefficient of n squared: the rule starts with n squared. Write out n squared for n = 1 to 6: 1, 4, 9, 16, 25, 36. Subtract these from the terms: 1, 1, 1, 1, 1, 1. That constant is the rest of the rule, so the nth term is n squared + 1. Check at n = 6: 36 + 1 = 37." },
  { id: "we08", outcomeId: "lo04", difficulty: "Extension", twm: "generalising", title: "A quadratic with a linear part as well",
    prompt: "Find the nth term of 7, 8, 11, 16, 23, 32.",
    solution: "First differences 1, 3, 5, 7, 9; second differences all 2, so the rule starts with n squared. Subtracting 1, 4, 9, 16, 25, 36 leaves 6, 4, 2, 0, -2, -4 - a linear sequence with difference -2, whose rule is -2n + 8. So the nth term is n squared - 2n + 8. Check at n = 5: 25 - 10 + 8 = 23. Correct." },
  { id: "we09", outcomeId: "lo05", difficulty: "Core", twm: "conjecturing", title: "Which distant term is larger?",
    prompt: "Card A is the 8th term where the nth term is n squared - 14. Card B is the 20th term where the nth term is 4n + 33. Guess which is larger, then work it out.",
    solution: "A guess might favour A, because squaring grows fast. Working it out: A is 8 squared - 14 = 64 - 14 = 50, and B is 4 x 20 + 33 = 80 + 33 = 113. So B is larger. The squaring rule does win eventually - at n = 13 it gives 155 against 85 - but at n = 8 it has not yet caught up, and a conjecture about growth says nothing about which is bigger at one particular position." },
  { id: "we10", outcomeId: "lo05", difficulty: "Core", twm: "specialising", title: "Matching sequences to rules",
    prompt: "Match 1, 4, 9, 16 and 1, 8, 27, 64 and 1, 2, 3, 4 to the rules n squared, n cubed and n.",
    solution: "1, 4, 9, 16 are the squares, so n squared. 1, 8, 27, 64 are the cubes, so n cubed. 1, 2, 3, 4 is simply n. Testing each rule on a later term rather than the first is what confirms the match: at n = 4, n squared is 16, n cubed is 64, and n is 4." },
  { id: "we11", outcomeId: "lo06", difficulty: "Core", twm: "critiquing", title: "Deciding what is a function",
    prompt: "Which of these are functions? (a) y = 5x - 1. (b) A table pairing 1 with 4, 2 with 9, and 1 with 7. (c) y = x squared.",
    solution: "(a) is a function: each x gives exactly one y. (b) is NOT: the input 1 appears twice with different outputs, 4 and 7, so an input has two outputs. (c) IS a function, even though 3 and -3 both give 9 - two inputs sharing one output is allowed, and only one input having two outputs is forbidden. The definition is one-way, and getting the direction right is the whole test." },
  { id: "we12", outcomeId: "lo07", difficulty: "Core", twm: "characterising", title: "From a machine to an equation",
    prompt: "A function machine multiplies by 5 then subtracts 1. Write its table for inputs 1, 2, 3 and its equation.",
    solution: "Input 1 gives 5 - 1 = 4; input 2 gives 10 - 1 = 9; input 3 gives 15 - 1 = 14. So the table is 1 to 4, 2 to 9, 3 to 14, and the equation is y = 5x - 1. The order of the operations in the machine is the order in the equation, which is why 'multiply then subtract' is not the same machine as 'subtract then multiply'." },
  { id: "we13", outcomeId: "lo08", difficulty: "Core", twm: "improving", title: "From a table to an equation, checked on every row",
    prompt: "Inputs 1, 2, 3, 4 give outputs 3, 5, 7, 9. Find the equation, and say why the last row matters.",
    solution: "The outputs rise by 2 as the inputs rise by 1, so the rule contains 2x. At x = 1, 2x is 2 but the output is 3, so y = 2x + 1. Now check the other rows: 2 x 2 + 1 = 5, 2 x 3 + 1 = 7, 2 x 4 + 1 = 9 - all correct. The last row matters because a rule fitted to the first row alone can be wrong everywhere else, and checking only where you fitted it proves nothing." },
  { id: "we14", outcomeId: "lo07", difficulty: "Extension", twm: "critiquing", title: "The order of the machine matters",
    prompt: "Compare 'multiply by 5 then subtract 1' with 'subtract 1 then multiply by 5' on the input 3.",
    solution: "The first gives 15 - 1 = 14; the second gives 2 x 5 = 10. Different machines, different functions, and their equations differ too: y = 5x - 1 and y = 5(x - 1). This is the order of operations from Unit 2 again, and it is why a machine's boxes are drawn in a sequence rather than as a set." },
];

const practice = [
  { id: "p01", level: "Warm-up", prompt: "First term 1, add 2.5 each time. Write five terms.", answer: "1, 3.5, 6, 8.5, 11", hint: "The step never changes." },
  { id: "p02", level: "Warm-up", prompt: "Is 20, 18, 16, 14 linear, quadratic or neither?", answer: "Linear", hint: "Look at the first differences." },
  { id: "p03", level: "Warm-up", prompt: "Find the nth term of 5, 8, 11, 14.", answer: "3n + 2", hint: "The difference is 3." },
  { id: "p04", level: "Core", prompt: "Classify 2, 5, 10, 17, 26, 37 and give the second differences.", answer: "Quadratic; second differences all 2", hint: "First differences 3, 5, 7, 9, 11." },
  { id: "p05", level: "Core", prompt: "Find the nth term of 20, 18, 16, 14, 12.", answer: "-2n + 22", hint: "A falling sequence has a negative a." },
  { id: "p06", level: "Core", prompt: "Find the nth term of 1, 5, 9, 13.", answer: "4n - 3", hint: "b is negative here." },
  { id: "p07", level: "Core", prompt: "A machine multiplies by 5 then subtracts 1. What is its equation?", answer: "y = 5x - 1", hint: "Follow the order of the boxes." },
  { id: "p08", level: "Core", prompt: "Inputs 1, 2, 3 give outputs 3, 5, 7. Find the equation.", answer: "y = 2x + 1", hint: "Outputs rise by 2." },
  { id: "p09", level: "Core", prompt: "Is a table pairing 1 with 4, 2 with 9 and 1 with 7 a function? Why?", answer: "No - the input 1 has two different outputs, 4 and 7.", hint: "Look for a repeated input." },
  { id: "p10", level: "Challenge", prompt: "Find the nth term of 2, 5, 10, 17, 26, 37.", answer: "n squared + 1", hint: "Halve the second difference." },
  { id: "p11", level: "Challenge", prompt: "Find the nth term of 7, 8, 11, 16, 23, 32.", answer: "n squared - 2n + 8", hint: "Subtract n squared and look at what is left." },
  { id: "p12", level: "Challenge", prompt: "Which is larger: the 8th term of n squared - 14, or the 20th term of 4n + 33? And at what n does the first overtake the second?", answer: "The 8th term of the first is 64 - 14 = 50 and the 20th term of the second is 80 + 33 = 113, so the second is larger. Comparing them at the SAME n, the quadratic rule first goes ahead at n = 10: at n = 9 it gives 67 against 69, still just behind, and at n = 10 it gives 86 against 73. So the answer is n = 10, and n = 9 is worth checking precisely because it is close enough to look like the answer.", hint: "Work each one out rather than guessing, and test n = 9 as well as n = 10." },
];

const fluency = [
  { id: "fl01", outcomeId: "lo02", difficulty: "Round 1", prompt: "Is 20, 18, 16, 14 linear or quadratic?", answer: "Linear", hint: "First differences.", errorFeedback: "They are all -2, so linear." },
  { id: "fl02", outcomeId: "lo03", difficulty: "Round 1", prompt: "nth term of 5, 8, 11, 14?", answer: "3n + 2", hint: "Difference 3.", errorFeedback: "3n at n=1 is 3, and the term is 5." },
  { id: "fl03", outcomeId: "lo01", difficulty: "Round 1", prompt: "First term 1, add 3, add 5, add 7. Write four terms.", answer: "1, 4, 9, 16", hint: "The step grows.", errorFeedback: "These are the square numbers." },
  { id: "fl04", outcomeId: "lo07", difficulty: "Round 1", prompt: "A machine multiplies by 5 then subtracts 1. What does 3 give?", answer: "14", hint: "Multiply first.", errorFeedback: "15 - 1 = 14." },
  { id: "fl05", outcomeId: "lo02", difficulty: "Round 2", prompt: "Second differences of 2, 5, 10, 17, 26?", answer: "All 2", hint: "Differences of the differences.", errorFeedback: "First differences 3,5,7,9; then 2,2,2." },
  { id: "fl06", outcomeId: "lo03", difficulty: "Round 2", prompt: "nth term of 20, 18, 16, 14?", answer: "-2n + 22", hint: "Negative a.", errorFeedback: "-2n at n=1 is -2, and the term is 20." },
  { id: "fl07", outcomeId: "lo03", difficulty: "Round 2", prompt: "nth term of 1, 5, 9, 13?", answer: "4n - 3", hint: "Negative b.", errorFeedback: "4n at n=1 is 4, and the term is 1." },
  { id: "fl08", outcomeId: "lo08", difficulty: "Round 2", prompt: "Inputs 1, 2, 3 give 3, 5, 7. Equation?", answer: "y = 2x + 1", hint: "Rise of 2.", errorFeedback: "2x + 1 fits every row." },
  { id: "fl09", outcomeId: "lo04", difficulty: "Round 3", prompt: "nth term of 2, 5, 10, 17, 26?", answer: "n squared + 1", hint: "Second difference 2.", errorFeedback: "Subtracting n squared leaves 1 each time." },
  { id: "fl10", outcomeId: "lo04", difficulty: "Round 3", prompt: "nth term of 7, 8, 11, 16, 23?", answer: "n squared - 2n + 8", hint: "Subtract n squared first.", errorFeedback: "What is left is -2n + 8." },
  { id: "fl11", outcomeId: "lo05", difficulty: "Round 3", prompt: "8th term of n squared - 14?", answer: "50", hint: "64 - 14.", errorFeedback: "8 squared is 64." },
  { id: "fl12", outcomeId: "lo06", difficulty: "Round 3", prompt: "Is y = x squared a function?", answer: "Yes", hint: "Does each input give one output?", errorFeedback: "Two inputs may share an output; that is allowed." },
];

const explorations = concepts.map((c, i) => ({
  id: "explore-" + (i + 1),
  outcomeId: "lo0" + [1, 2, 3, 4, 6, 8][i],
  difficulty: ["Discover", "Core", "Core", "Extension", "Core", "Core"][i],
  title: c.title,
  context: c.explanation,
  prompt: [
    "Generate five terms from 'first term 1, add 2.5' and from 'first term 1, add 3, add 5, add 7'. How do the two rules differ?",
    "Find the first and second differences of 2, 5, 10, 17, 26 and of 2, 4, 8, 16, 32. What do they tell you?",
    "Find the nth term of 5, 8, 11, 14 and of 20, 18, 16, 14. What is different about the second one?",
    "Subtract n squared from each term of 7, 8, 11, 16, 23. What kind of sequence is left, and what does that give you?",
    "Is a table pairing 1 with 4, 2 with 9 and 1 with 7 a function? Is y = x squared?",
    "Inputs 1, 2, 3, 4 give 3, 5, 7, 9. Find a rule from the first row alone, then test it on the last row.",
  ][i],
  answer: [
    "The first keeps the same step, so it is linear; the second's step grows, so it curves - and gives the square numbers.",
    "The first has constant second differences of 2, so it is quadratic. The second has neither constant, so it is neither - it doubles.",
    "3n + 2 and -2n + 22. The second has a NEGATIVE coefficient of n, because the sequence falls.",
    "6, 4, 2, 0, -2 - linear with difference -2, so -2n + 8, making the whole rule n squared - 2n + 8.",
    "The table is not: the input 1 has two outputs. y = x squared IS: two inputs may share an output, which is allowed.",
    "y = 2x + 1 fits the first row and also the last, 2 x 4 + 1 = 9. Fitting one row proves nothing on its own.",
  ][i],
  modelType: "concept-model-" + (i + 1),
  hint: [
    "Write the step under each gap.",
    "Take differences twice.",
    "Is the sequence rising or falling?",
    "Write n squared under each term.",
    "Look for a repeated input.",
    "Check every row, not the one you used.",
  ][i],
  explanation: c.example,
}));

const visualModels = concepts.map((c, i) => ({
  id: "model-" + (i + 1),
  outcomeId: "lo0" + [1, 2, 3, 4, 6, 8][i],
  title: c.title,
  modelType: "concept-model-" + (i + 1),
  purpose: c.explanation,
  defaultNumber: [7, 2, 3, 2, 1, 2][i],
}));

const activities = [
  { title: "Rule to sequence, sequence to rule", materials: "cards, paper.",
    steps: ["Write six term-to-term rules on cards, three with a fixed step and three with a changing one.",
      "Swap and generate six terms from each.",
      "Classify each sequence by its differences.",
      "Swap back and check that the classification matches the rule you wrote."] },
  { title: "The difference table", materials: "squared paper.",
    steps: ["Draw a table with room for terms, first differences and second differences.",
      "Fill it in for eight sequences, including one that doubles and one that falls.",
      "Label each as linear, quadratic or neither.",
      "For every quadratic one, halve the second difference and note what it gives.",
      "Find a sequence where the THIRD differences are constant, and say what its rule involves."] },
  { title: "Negative a and negative b", materials: "paper.",
    steps: ["Write four descending linear sequences and four with a negative constant term.",
      "Find every nth term rule.",
      "Sort them by the signs of a and b, filling all four combinations.",
      "Check each rule at n = 1 and at a later term.",
      "Say which combination you found hardest and why."] },
  { title: "Quadratic in two parts", materials: "paper.",
    steps: ["Take five quadratic sequences with second difference 2.",
      "For each, write n squared underneath and subtract.",
      "Find the linear rule of what is left.",
      "Add the two parts and test the whole rule on the last term.",
      "Then try one with second difference 4, and work out what coefficient of n squared it needs."] },
  { title: "Function or not?", materials: "cards.",
    steps: ["Make twelve cards: some equations, some tables, some mapping diagrams.",
      "Include at least three that are NOT functions.",
      "Sort them into two piles and write the reason on each non-function.",
      "Include one where two inputs share an output, and discuss why it IS a function.",
      "Write the definition in one sentence."] },
  { title: "Four representations", materials: "paper, ruler.",
    steps: ["Choose a function such as y = 3x - 2.",
      "Draw it as a machine, then a table, then a mapping diagram, then write its equation.",
      "Swap with a partner, who must produce the other three from whichever one you give them.",
      "Then do it starting from a table alone, and check the equation on every row.",
      "Try 'subtract 2 then multiply by 3' and show it is a different function."] },
];

const realProblems = [
  { id: "rp01", outcomeId: "lo03", difficulty: "Core", context: "Work",
    prompt: "A plumber charges a $20 call-out fee plus $35 an hour. Write an nth term rule for the cost of n hours, and find the cost of 6 hours.",
    answer: "The cost rises by 35 for each extra hour, so the rule is 35n + 20. For 6 hours that is 210 + 20 = $230.",
    hint: "The hourly rate is the coefficient of n.", errorFeedback: "35 x 6 = 210, then add the fee." },
  { id: "rp02", outcomeId: "lo04", difficulty: "Extension", context: "Home",
    prompt: "A pile of oranges is stacked in a square-based pyramid: 1 on top, then a 2 by 2 layer, then 3 by 3, and so on. How many oranges in the nth layer, and is the sequence of layer sizes linear or quadratic?",
    answer: "The nth layer is an n by n square, so it holds n squared oranges: 1, 4, 9, 16, 25. First differences 3, 5, 7, 9; second differences all 2 - so it is quadratic, with nth term n squared.",
    hint: "How many in each square layer?", errorFeedback: "An n by n square holds n squared." },
  { id: "rp03", outcomeId: "lo05", difficulty: "Core", context: "Money",
    prompt: "One savings plan gives n squared - 14 dollars in month n. Another gives 4n + 33. Which pays more in month 8, and which pays more in the long run?",
    answer: "In month 8 the first plan gives 64 - 14 = $50 and the second gives 4 x 8 + 33 = $65, so the second pays more. In the long run the squaring plan wins, because n squared eventually outgrows any multiple of n: it first goes ahead in month 10, at $86 against $73, and by month 20 it gives $386 against $113.",
    hint: "Substitute 8 into both.", errorFeedback: "8 squared is 64, and 4 x 8 is 32." },
  { id: "rp04", outcomeId: "lo07", difficulty: "Core", context: "Work",
    prompt: "A taxi's fare is worked out by a machine: multiply the kilometres by 5 then subtract 1 for a loyalty discount. Write the equation and find the fare for 3 km. Would 'subtract 1 then multiply by 5' cost the passenger the same?",
    answer: "The equation is y = 5x - 1, so 3 km costs 15 - 1 = $14. The other order gives y = 5(x - 1), which for 3 km is 5 x 2 = $10 - cheaper for the passenger, and a different function entirely. The order of the boxes is part of the rule.",
    hint: "Follow the machine in order.", errorFeedback: "5 x 3 = 15, then subtract 1." },
  { id: "rp05", outcomeId: "lo06", difficulty: "Extension", context: "Science",
    prompt: "A machine records a person's height for each of their names. Another records each person's name for a given height. Which is a function, and why might the other fail?",
    answer: "Name to height is a function if names are unique, since each input gives one height. Height to name is not, because two different people can share a height, so one input would have several outputs. A function must give each input exactly one output; sharing an output is allowed but sharing an input is not.",
    hint: "Which direction could give two answers?", errorFeedback: "Two people of the same height break the second one." },
  { id: "rp06", outcomeId: "lo02", difficulty: "Core", context: "Home",
    prompt: "A plant is 2 cm tall and grows 5 cm, then 7 cm, then 9 cm, then 11 cm in successive weeks. Is its height sequence linear, quadratic or neither, and how tall after four weeks?",
    answer: "Heights are 2, 7, 14, 23, 34 cm. First differences 5, 7, 9, 11; second differences all 2 - so quadratic. After four weeks it is 34 cm tall.",
    hint: "Write the heights before taking differences.", errorFeedback: "2 + 5 = 7, then 14, 23, 34." },
];

const reasoningPrompts = [
  { id: "reason01", outcomeId: "lo02", difficulty: "Core", responseMode: "text",
    prompt: "Why is it worth taking second differences before looking for a rule?",
    keyIdeas: ["It identifies the kind of sequence", "Constant second differences mean quadratic", "Otherwise you are guessing"],
    modelAnswer: "Because the kind of rule you should be hunting for depends on the answer. Constant first differences mean a linear rule of the form an + b; constant second differences mean the rule involves n squared; neither means something else again, such as doubling. Two lines of arithmetic tell you which family to look in, and without that you are trying rules at random and may fit one to the first two terms that fails at the third." },
  { id: "reason02", outcomeId: "lo04", difficulty: "Extension", responseMode: "text",
    prompt: "Why is the coefficient of n squared half the second difference?",
    keyIdeas: ["The second difference of n squared is 2", "Multiplying the rule multiplies the differences", "So the coefficient is half"],
    modelAnswer: "Work out the second differences of n squared itself: the terms are 1, 4, 9, 16, 25, the first differences are 3, 5, 7, 9, and the second differences are all 2. So a rule of exactly n squared produces a second difference of 2. Multiplying a rule by a number multiplies all its differences by that number, so a rule of 3n squared would give a second difference of 6. Working backwards, the coefficient of n squared is the second difference divided by 2." },
  { id: "reason03", outcomeId: "lo06", difficulty: "Core", responseMode: "text",
    prompt: "Why is y = x squared a function even though 3 and -3 both give 9?",
    keyIdeas: ["The rule forbids one input with two outputs", "It permits two inputs sharing one output", "The definition is one-way"],
    modelAnswer: "The definition says each INPUT must have a single output, and it says nothing about outputs being used once. Feed 3 into y = x squared and you get 9 and only 9; feed -3 and you get 9 and only 9. Neither input is ambiguous, so it is a function. The forbidden situation is the other way round - one input producing two different answers - and the whole test is remembering which direction the rule points." },
  { id: "reason04", outcomeId: "lo08", difficulty: "Core", responseMode: "text",
    prompt: "Why must you check a rule found from a table on rows other than the one you used to find it?",
    keyIdeas: ["Fitting guarantees agreement where you fitted", "Many rules fit one point", "Only other rows test it"],
    modelAnswer: "Choosing b so that the rule matches the first row guarantees it matches the first row - that is what choosing it did, so testing there proves nothing. Infinitely many rules pass through any one pair of values. The other rows are the only independent evidence you have: if y = 2x + 1 also gives 5, 7 and 9 at x = 2, 3 and 4, the rule is doing real work. This is the same reason a solution to an equation is checked in the original rather than in a line you derived." },
  { id: "reason05", outcomeId: "lo05", difficulty: "Extension", responseMode: "text",
    prompt: "A learner conjectures that a squaring rule must beat a linear one, so the 8th term of n squared - 14 must exceed the 20th term of 4n + 33. What is wrong with the reasoning?",
    keyIdeas: ["It compares different positions", "Faster growth is about the long run", "50 against 113"],
    modelAnswer: "The conjecture is about growth RATES and the question is about two particular terms at different positions, which growth rates do not settle. It is true that n squared eventually outruns any multiple of n, but 'eventually' is not 'at n = 8', and the second card is asking about n = 20 in any case. Working them out, the first gives 64 - 14 = 50 and the second 80 + 33 = 113. A conjecture about long-run behaviour is not evidence about a specific value, and the only way to know is to calculate." },
  { id: "reason06", outcomeId: "lo07", difficulty: "Core", responseMode: "text",
    prompt: "Why is 'multiply by 5 then subtract 1' a different function from 'subtract 1 then multiply by 5'?",
    keyIdeas: ["The order of operations matters", "y = 5x - 1 against y = 5(x - 1)", "They differ at every input except one"],
    modelAnswer: "The two machines apply the same two operations in opposite orders, and order changes the result: at x = 3 the first gives 14 and the second gives 10. As equations they are y = 5x - 1 and y = 5(x - 1) = 5x - 5, which differ by 4 at every input, so they agree nowhere at all. This is the order of operations from Unit 2 in a new costume, and it is why a function machine's boxes are drawn in a line rather than as an unordered collection." },
];

const reference = {
  rules: [
    { title: "Linear Means Constant First Differences", text: "If consecutive terms differ by the same amount, the sequence is linear and its rule has the form an + b." },
    { title: "Quadratic Means Constant Second Differences", text: "If the differences of the differences are constant, the rule involves n squared." },
    { title: "Halve the Second Difference", text: "The coefficient of n squared is the second difference divided by 2, because n squared itself has second difference 2." },
    { title: "Subtract and Simplify", text: "For a quadratic, subtract the n squared part from each term; what is left is usually linear and its rule completes the answer." },
    { title: "A Function Gives One Output per Input", text: "One input with two outputs is not a function. Two inputs sharing one output is allowed." },
    { title: "Check on a Row You Did Not Use", text: "A rule fitted to one row is guaranteed to fit that row. The other rows are the only test." },
  ],
  terms: [
    ["Term", "One number in a sequence"],
    ["Term-to-term rule", "A rule for getting the next term from the one before"],
    ["nth term rule", "A rule giving any term directly from its position"],
    ["Linear sequence", "A sequence whose first differences are constant"],
    ["Quadratic sequence", "A sequence whose second differences are constant"],
    ["Function", "A relationship in which each input has exactly one output"],
    ["Function machine", "A diagram of a function as a sequence of operations"],
    ["Mapping diagram", "Two number lines with arrows from inputs to outputs"],
  ],
  commonMistakes: [
    ["Assuming a sequence is linear without checking", "Take first differences; if they vary, take second differences"],
    ["Using the second difference as the coefficient of n squared", "Halve it - n squared itself has second difference 2"],
    ["Giving b as the first term", "b is what you add to a x 1 to reach the first term, not the first term itself"],
    ["Thinking y = x squared is not a function", "Two inputs may share an output; only one input with two outputs is forbidden"],
    ["Checking a rule only on the row you fitted it to", "That row was guaranteed to work; test the others"],
  ],
};

const assessment = {
  passPercent: 80,
  questions: [
    { id: "q01", type: "Application", outcomeId: "lo02", difficulty: "Basic", question: "20, 18, 16, 14 is:", options: ["Linear", "Quadratic", "Neither", "Cubic"], answer: "Linear", hint: "First differences.", explanation: "They are all -2, so the sequence is linear." },
    { id: "q02", type: "Application", outcomeId: "lo03", difficulty: "Core", question: "The nth term of 5, 8, 11, 14 is:", options: ["3n + 2", "3n", "n + 3", "2n + 3"], answer: "3n + 2", hint: "The difference is 3.", explanation: "3n at n = 1 gives 3, and the term is 5, so add 2." },
    { id: "q03", type: "Application", outcomeId: "lo03", difficulty: "Core", question: "The nth term of 20, 18, 16, 14 is:", options: ["-2n + 22", "2n + 18", "-2n + 18", "22 - n"], answer: "-2n + 22", hint: "Negative coefficient.", explanation: "-2n at n = 1 gives -2, and the term is 20, so add 22." },
    { id: "q04", type: "Application", outcomeId: "lo02", difficulty: "Core", question: "The second differences of 2, 5, 10, 17, 26 are:", options: ["All 2", "3, 5, 7, 9", "All 3", "Not constant"], answer: "All 2", hint: "Differences of the differences.", explanation: "First differences 3, 5, 7, 9; their differences are 2, 2, 2." },
    { id: "q05", type: "Application", outcomeId: "lo04", difficulty: "Extension", question: "The nth term of 2, 5, 10, 17, 26 is:", options: ["n squared + 1", "2n squared", "n squared - 1", "3n - 1"], answer: "n squared + 1", hint: "Halve the second difference.", explanation: "Subtracting 1, 4, 9, 16, 25 leaves 1 each time." },
    { id: "q06", type: "Application", outcomeId: "lo05", difficulty: "Core", question: "The 8th term where the nth term is n squared - 14 is:", options: ["50", "64", "36", "113"], answer: "50", hint: "8 squared first.", explanation: "64 - 14 = 50." },
    { id: "q07", type: "Reasoning", outcomeId: "lo06", difficulty: "Core", question: "Which is NOT a function?", options: ["y = 5x - 1", "y = x squared", "A table pairing 1 with 4 and 1 with 7", "A table pairing 3 with 9 and -3 with 9"], answer: "A table pairing 1 with 4 and 1 with 7", hint: "Look for a repeated input.", explanation: "One input, 1, has two different outputs, which the definition forbids." },
    { id: "q08", type: "Reasoning", outcomeId: "lo04", difficulty: "Extension", question: "Why is the coefficient of n squared half the second difference?", options: ["Because sequences start at 1", "Because n squared has second difference 2", "Because differences always halve", "It is not - they are equal"], answer: "Because n squared has second difference 2", hint: "Take the differences of 1, 4, 9, 16.", explanation: "n squared gives second differences of 2, so scaling the rule scales them; dividing by 2 recovers the coefficient." },
  ],
};

const games = {
  masteryScore: 3,
  games: [
    { id: "u9-game-1", icon: "?", skill: "Classifying sequences", title: "Quick Match: What Kind of Sequence", description: "Four short challenges on differences.", type: "choice",
      rounds: [
        { prompt: "20, 18, 16, 14", choices: ["Linear", "Quadratic", "Neither", "Cubic"], answer: "Linear", clue: "Differences all -2." },
        { prompt: "2, 5, 10, 17, 26", choices: ["Quadratic", "Linear", "Neither", "Cubic"], answer: "Quadratic", clue: "Second differences all 2." },
        { prompt: "2, 4, 8, 16, 32", choices: ["Neither", "Linear", "Quadratic", "Cubic"], answer: "Neither", clue: "It doubles." },
        { prompt: "1, 4, 9, 16, 25", choices: ["Quadratic", "Linear", "Neither", "Cubic"], answer: "Quadratic", clue: "The square numbers." },
      ] },
    { id: "u9-game-2", icon: "?", skill: "nth term and functions", title: "Quick Match: Rules and Functions", description: "Four short challenges on nth terms and functions.", type: "choice",
      rounds: [
        { prompt: "nth term of 5, 8, 11, 14", choices: ["3n + 2", "3n", "n + 3", "2n + 3"], answer: "3n + 2", clue: "Difference 3." },
        { prompt: "nth term of 1, 5, 9, 13", choices: ["4n - 3", "4n + 1", "3n + 1", "4n"], answer: "4n - 3", clue: "b is negative." },
        { prompt: "nth term of 2, 5, 10, 17", choices: ["n squared + 1", "2n squared", "3n - 1", "n squared - 1"], answer: "n squared + 1", clue: "Second difference 2." },
        { prompt: "A machine x5 then -1, input 3", choices: ["14", "10", "15", "4"], answer: "14", clue: "Multiply first." },
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
    unitId: "math-g09-u09",
    unitNo: 9,
    unitTitle: "Sequences and Functions",
    unitOverview:
      "Welcome to Unit 9. This unit gives you a way to look at a sequence and find out what kind of thing " +
      "it is before trying to describe it. Constant first differences mean it is linear; constant SECOND " +
      "differences mean it is quadratic and its rule involves n squared; neither means it is something " +
      "else again. Two lines of arithmetic decide it, and without them you are guessing. You then learn " +
      "to find the nth term rule of both kinds - including the descending sequences where the " +
      "coefficient is negative, which are just as common as the rising ones. Finally you meet functions " +
      "properly: a relationship where each input has exactly one output, shown as a machine, a table, a " +
      "mapping diagram or an equation, and you learn to move between all four.",
    learningPath: "9.1 Generating sequences, 9.2 Using the nth term, 9.3 Representing functions",
    reviewStatus: "Authored 2026-09-26 from the Stage 9 Learner's Book pages 192-215 and Workbook pages 114-126. Not yet curriculum-reviewed.",
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
        "Section by section: 9.1 -> 9As.01, 9.2 -> 9As.02, 9.3 -> 9As.03. 9As.02 names the form " +
        "'an +/- b, where a and b are positive or negative integers', so the unit deliberately includes " +
        "a negative coefficient of n (20, 18, 16, ...) and a negative constant (1, 5, 9, ... giving " +
        "4n - 3); a learner who has only met 3n + 2 has met half the objective. 9As.03 is a definition " +
        "before it is a skill, so the unit asks whether something IS a function as well as asking for " +
        "outputs. The remaining 9As objectives (.04 to .07, linear functions and their graphs) belong to " +
        "unit 10. Objective texts are quoted verbatim from cambridge-mathematics-0862.json.",
    },
  },
  provenance: {
    contentPackage: null,
    framework: "Cambridge Lower Secondary Mathematics 0862 - Stage 9",
    sourceArchive: null,
    sourceDocuments: ["Cambridge Lower Secondary Maths Learner's Book 9 (2ed, CUP), pages 192-215",
                      "Cambridge Lower Secondary Mathematics Workbook 9, pages 114-126"],
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
console.log("  Grade 9 Unit 9: " + outcomes.length + " outcomes, " + concepts.length + " concepts, " +
  workedExamples.length + " worked examples, " + practice.length + " practice, " + fluency.length +
  " fluency, " + realProblems.length + " real problems, " + reasoningPrompts.length + " reasoning, " +
  assessment.questions.length + " assessment, " + activities.length + " activities");
console.log("  objectives: " + OBJ.join(", ") + "   (9As.04-.07 belong to unit 10)");
console.log("  " + json.length + " bytes " + (WRITE ? "written to " + path.relative(process.cwd(), OUT) : "(--write to save)"));
