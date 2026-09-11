# -*- coding: utf-8 -*-
"""Break one answer key at a time and require check-answer-keys.py to say so.

WHY THIS IS COMMITTED. check-answer-keys.py reports 430 of 509 keys verified
and 0 wrong across five builds, and that number is worth exactly as much as the
evidence that the rules behind it can fail. Watching a gate pass proves nothing
until you have watched it fail: over the session that built those rules, SIX of
them turned out to have never once matched anything - a pattern that missed the
question, a comparison that could not succeed, a selector that matched two
options and disqualified itself - and in every case the only symptom was a
number that did not move. This is what tells a rule that does nothing from a
question that genuinely cannot be answered.

Each case re-binds one key to a DIFFERENT REAL OPTION on the same item and
requires the tool to report it WRONG. Run it after touching any rule.

    python lesson-app-tools/mutate-answer-keys.py              # all 184
    python lesson-app-tools/mutate-answer-keys.py --app grade-2-app
    python lesson-app-tools/mutate-answer-keys.py --list

FIVE THINGS THIS HARNESS LEARNED THE HARD WAY, each of which made it lie once:

  - SNAPSHOT ONCE, up front. Reading each file at the top of its own iteration
    is correct only while every restore lands; one that does not silently
    becomes the next iteration's baseline.
  - RESTORE IN A `finally`, WITH RETRIES. A Windows file lock threw mid-run and
    left a mutated answer key ON DISK. A harness that cannot prove it put the
    tree back is not evidence about anything it printed.
  - A RUN THAT PRODUCED NO SUMMARY IS "NO-RUN", NOT "SURVIVED". They are
    different findings and merging them cost a wrong diagnosis.
  - SWAP THE KEY, never just remove it. An item with no correct option is
    dropped by the harvester, so the mutation "survives" without the rule ever
    running.
  - THE FRAGMENT MUST BELONG TO A CHECK ITEM. "Rolling a 7" appears twice in
    asking-sorting-chance - once as an activity, once as the question - so a
    mutation landed on the activity, changed nothing, and reported as a gap in
    the TOOL. See in_check_item() for the test, and for the two narrower ones
    that were wrong.

  - A SKIP IS NOT A PASS. It means the fragment or the key no longer matches
    the lesson, so the rule that case was written for is untested. The run
    fails on one.

A mutation that survives is a claim about the mutation FIRST and about the gate
second; the mutation is the cheaper thing to be wrong about, so check it first.
"""
import io, os, re, subprocess, sys, time

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                      # .../mathematics
TOOL = os.path.join(HERE, "check-answer-keys.py")

argv = sys.argv[1:]
ONLY = argv[argv.index("--app") + 1] if "--app" in argv else None
for a in argv:
    if a not in ("--list",) and not a.startswith("--app") and a != ONLY:
        print("unrecognised argument: %s" % a)
        raise SystemExit(2)

# (app, file, question fragment, the key as written, the key re-bound)
CASES = [
    # ---- from mutate-answer-keys.py ----
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'said <b>banana</b>',
     '{ t: "4", ok: true }, { t: "5", ok: false }',
     '{ t: "4", ok: false }, { t: "5", ok: true }'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'asked <b>altogether</b>?", pic: g10',
     '{ t: "16", ok: true }, { t: "12", ok: false }',
     '{ t: "16", ok: false }, { t: "12", ok: true }'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     '<b>fewer</b> children have a bird',
     '{ t: "4", ok: true }, { t: "2", ok: false }',
     '{ t: "4", ok: false }, { t: "2", ok: true }'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'Which pet do the <b>most</b>',
     '{ t: "🐕 dog", ok: true }, { t: "🐈 cat", ok: false }',
     '{ t: "🐕 dog", ok: false }, { t: "🐈 cat", ok: true }'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'Which fruit did the <b>fewest</b>',
     'a: "🍎 apple"',
     'a: "🍊 orange"'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'Did <b>more</b> children choose orange',
     '{ t: "🍊 orange", ok: true }, { t: "🍎 apple", ok: false }',
     '{ t: "🍊 orange", ok: false }, { t: "🍎 apple", ok: true }'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'Which one is <b>lighter</b>',
     'pic: balance(1, "🪨", "🪶")',
     'pic: balance(-1, "🪨", "🪶")'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'The bag of rice goes',
     '{ t: "heavier", ok: true }, { t: "lighter", ok: false }',
     '{ t: "heavier", ok: false }, { t: "lighter", ok: true }'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'This balance is <b>level</b>',
     '{ t: "They weigh the same", ok: true }, { t: "One is heavier", ok: false }',
     '{ t: "They weigh the same", ok: false }, { t: "One is heavier", ok: true }'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'Which two pets have the <b>same</b>',
     '{ t: "🐈 cat and 🐟 fish", ok: true }, { t: "🐕 dog and 🐈 cat", ok: false }',
     '{ t: "🐈 cat and 🐟 fish", ok: false }, { t: "🐕 dog and 🐈 cat", ok: true }'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'sides does a <b>hexagon</b>',
     'opts: ["6", "5", "8"], a: "6"',
     'opts: ["6", "5", "8"], a: "5"'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'no edges at all',
     'a: "sphere"',
     'a: "cube"'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'How much <b>milk</b> is in the pan',
     '{ t: "Jug", ok: true }, { t: "Ruler", ok: false }',
     '{ t: "Jug", ok: false }, { t: "Ruler", ok: true }'),
    ('grade-1-app/g1v2', 'days-months-and-clocks.html',
     'Which day comes <b>after</b> Sunday',
     'a: "Monday"',
     'a: "Saturday"'),
    ('grade-1-app/g1v2', 'days-months-and-clocks.html',
     'short hand is just past <b>4</b>',
     'a: "half past 4"',
     'a: "4 o\'clock"'),
    ('grade-1-app/g1v2', 'what-comes-next.html',
     'Which shape is missing in the middle?',
     'a: "teal square"',
     'a: "orange circle"'),
    ('grade-1-app/g1v2', 'what-comes-next.html',
     'How many beads repeat?',
     'opts: [3, 2, 4], a: 3',
     'opts: [3, 2, 4], a: 2'),
    ('grade-1-app/g1v2', 'what-comes-next.html',
     '3, 8, 3, 8, 3, ?',
     'opts: [8, 3, 13], a: 8',
     'opts: [8, 3, 13], a: 3'),
    ('grade-1-app/g1v2', 'what-comes-next.html',
     '?, 8, 10, 12, 14',
     'opts: [6, 7, 4], a: 6',
     'opts: [6, 7, 4], a: 7'),
    ('grade-1-app/g1v2', 'what-comes-next.html',
     'The machine does +2',
     'opts: [8, 4, 7], a: 8',
     'opts: [8, 4, 7], a: 4'),
    ('grade-1-app/g1v2', 'what-comes-next.html',
     'How many in pattern 4?',
     'opts: [8, 7, 10], a: 8',
     'opts: [8, 7, 10], a: 10'),
    ('grade-1-app/g1v2', 'halves-and-wholes.html',
     'How many halves make <b>3 wholes</b>',
     '{ t: 6, ok: true }, { t: 3 }',
     '{ t: 6 }, { t: 3, ok: true }'),
    ('grade-1-app/g1v2', 'halves-and-wholes.html',
     'shapeSvg("rect", "v", 0.26',
     '{ t: "Yes" }, { t: "No", ok: true }',
     '{ t: "Yes", ok: true }, { t: "No" }'),
    ('grade-1-app/g1v2', 'halves-and-wholes.html',
     'shapeSvg("square", "d", 0.5, [0, 1]',
     '{ t: "one half" }, { t: "the whole", ok: true }',
     '{ t: "one half", ok: true }, { t: "the whole" }'),
    ('grade-1-app/g1v2', 'counting-to-twenty.html',
     'A dice shows',
     'opts: [5, 4, 6], a: 5',
     'opts: [5, 4, 6], a: 4'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'There are 4 bananas',
     'opts: ["4", "1", "8"], a: "4"',
     'opts: ["4", "1", "8"], a: "8"'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'Is the ball on the <b>left</b>',
     '{ t: "on the right", ok: true }, { t: "on the left", ok: false }',
     '{ t: "on the right", ok: false }, { t: "on the left", ok: true }'),
    ('grade-1-app/g1v2', 'counting-to-twenty.html',
     'All 5 fly away',
     'a: "0"',
     'a: "1"'),
    ('grade-1-app/g1v2', 'days-months-and-clocks.html',
     'Which is <b>longer</b>: a week or a day?',
     'a: "a week"',
     'a: "a day"'),
    ('grade-1-app/g1v2', 'counting-to-twenty.html',
     'smallest</b> of these numbers',
     'a: "0"',
     'a: "1"'),
    # ---- from mutate-grade2.py ----
    ('grade-2-app', 'tens-and-ones.html',
     'Round 63 to the nearest 10.',
     'opts: [60, 70, 65], a: 60',
     'opts: [60, 70, 65], a: 70'),
    ('grade-2-app', 'tens-and-ones.html',
     '4 × 5 = ?',
     'opts: [20, 25, 9], a: 20',
     'opts: [20, 25, 9], a: 25'),
    ('grade-2-app', 'tens-and-ones.html',
     '12 shared between 3 is ? each',
     'opts: [4, 3, 6], a: 4',
     'opts: [4, 3, 6], a: 3'),
    # 'A quarter of 12 is ?' was here. fb8c16f5c (2026-09-10) took the fractions
    # and money steps out of Tens and Ones - Grade 2 has a fractions lesson and a
    # money lesson of its own - and the question went with them, so this case
    # could no longer be placed and turned every run red with a SKIP. Deleted,
    # not re-pointed: the quarter-of rule it exercised is still mutation-tested
    # by Grade 4's 'What is a quarter of 24?' below.
    ('grade-2-app', 'tens-and-ones.html',
     'One more than 59 is ?',
     'opts: [60, 58, 69], a: 60',
     'opts: [60, 58, 69], a: 58'),
    ('grade-2-app', 'tens-and-ones.html',
     'How many tens in 47?',
     'opts: [4, 7, 47], a: 4',
     'opts: [4, 7, 47], a: 7'),
    ('grade-2-app', 'patterns-that-grow.html',
     '5, 10, 15, 20',
     'a: 25',
     'a: 30'),
    ('grade-2-app', 'patterns-that-grow.html',
     '30, 27, 24, 21',
     'a: 18',
     'a: 20'),
    ('grade-2-app', 'coins-and-change.html',
     'How many cents make one shilling?',
     'a: "100 c"',
     'a: "10 c"'),
    ('grade-2-app', 'coins-and-change.html',
     'A 50 and a 20 and a 10.',
     'a: "80 sh"',
     'a: "70 sh"'),
    ('grade-2-app', 'coins-and-change.html',
     'fewest pieces for 70 sh',
     'a: "50 + 20"',
     'a: "20 + 20 + 20 + 10"'),
    ('grade-2-app', 'coins-and-change.html',
     'A juice is 45 sh and a bun is 30 sh',
     'a: "75 sh"',
     'a: "65 sh"'),
    ('grade-2-app', 'coins-and-change.html',
     'It costs 80 sh. You pay 100 sh',
     'a: "20 sh"',
     'a: "30 sh"'),
    ('grade-2-app', 'coins-and-change.html',
     '250 cents written in shillings',
     'a: "2 sh 50 c"',
     'a: "2 sh 05 c"'),
    ('grade-2-app', 'coins-and-change.html',
     '3 mangoes for 60 sh',
     'a: "20 sh"',
     'a: "30 sh"'),
    ('grade-2-app', 'coins-and-change.html',
     'Which is worth more',
     'a: "the 50 sh note"',
     'a: "the three coins"'),
    ('grade-2-app', 'coins-and-change.html',
     'You save 25 sh a week',
     'a: "100 sh"',
     'a: "75 sh"'),
    ('grade-2-app', 'coins-and-change.html',
     'You have 200 sh and spend 145 sh',
     'a: "55 sh"',
     'a: "65 sh"'),
    ('grade-2-app', 'fair-shares.html',
     'different sizes. Is one piece a quarter?',
     'a: "no"',
     'a: "yes"'),
    ('grade-2-app', 'fair-shares.html',
     'Which is the same as 1/2?',
     'a: "2/4"',
     'a: "1/4"'),
    ('grade-2-app', 'fair-shares.html',
     'Which is bigger: 1/2 or 1/4?',
     'a: "1/2"',
     'a: "1/4"'),
    ('grade-2-app', 'fair-shares.html',
     'Which is bigger: 3/4 or 2/4?',
     'a: "3/4"',
     'a: "2/4"'),
    ('grade-2-app', 'fair-shares.html',
     '1/4 + 2/4 = ?',
     'a: "3/4"',
     'a: "2/4"'),
    ('grade-2-app', 'fair-shares.html',
     '3/4 − 1/4 = ?',
     'a: "2/4"',
     'a: "4/4"'),
    ('grade-2-app', 'fair-shares.html',
     'How many quarters make one whole?',
     'a: 4',
     'a: 2'),
    ('grade-2-app', 'fair-shares.html',
     '5 quarters is the same as',
     'a: "1 whole and 1/4"',
     'a: "1 whole and 1/2"'),
    ('grade-2-app', 'fair-shares.html',
     'Amina has 20 shillings and spends a quarter',
     'a: "5 sh"',
     'a: "4 sh"'),
    ('grade-2-app', 'fair-shares.html',
     'A class has 24 learners. Three quarters walk',
     'a: "18"',
     'a: "6"'),
    ('grade-2-app', 'fair-shares.html',
     'Kiki reads 1/4 of a 20 page book',
     'a: "5"',
     'a: "4"'),
    ('grade-2-app', 'fair-shares.html',
     'A bottle holds 1 litre. Hodan drinks half',
     'a: "500 ml"',
     'a: "250 ml"'),
    ('grade-2-app', 'fair-shares.html',
     'Three quarters of an hour is how many minutes',
     'a: "45 min"',
     'a: "30 min"'),
    ('grade-2-app', 'fair-shares.html',
     'A pizza is cut into 4 equal slices. Musa eats 3',
     'a: "3/4"',
     'a: "4/3"'),
    ('grade-2-app', 'fair-shares.html',
     'A cake is cut into 4 equal pieces. One is eaten',
     'a: "3/4"',
     'a: "1/4"'),
    ('grade-2-app', 'half-past-quarter-to.html',
     'How many minutes in quarter of an hour',
     'a: "15"',
     'a: "30"'),
    ('grade-2-app', 'half-past-quarter-to.html',
     'Which is longer: 100 minutes, or 1 hour',
     'a: "100 minutes"',
     'a: "1 hour"'),
    ('grade-2-app', 'half-past-quarter-to.html',
     'Shortest first, which order is right',
     'a: "minute, hour, day"',
     'a: "hour, minute, day"'),
    ('grade-2-app', 'sides-and-corners.html',
     'The edge of a circle is 4 cm from the centre',
     'a: "4 cm"',
     'a: "8 cm"'),
    ('grade-2-app', 'sides-and-corners.html',
     'What do we call the middle point of a circle',
     'a: "the centre"',
     'a: "the corner"'),
    ('grade-2-app', 'how-much-how-long.html',
     'How many grams are in 1 kilogram?',
     'a: 1000',
     'a: 100'),
    ('grade-2-app', 'how-much-how-long.html',
     'How many millilitres are in 1 litre?',
     'a: 1000',
     'a: 500'),
    ('grade-2-app', 'how-much-how-long.html',
     'Half a litre is',
     'a: "500 ml"',
     'a: "50 ml"'),
    ('grade-2-app', 'how-much-how-long.html',
     'How many minutes in half an hour?',
     'a: 30',
     'a: 60'),
    ('grade-2-app', 'how-much-how-long.html',
     'Which is heavier: 1 kg or 900 g?',
     'a: "1 kg"',
     'a: "900 g"'),
    ('grade-2-app', 'how-much-how-long.html',
     'Which is longer: 1 m or 90 cm?',
     'a: "1 m"',
     'a: "90 cm"'),
    ('grade-2-app', 'how-much-how-long.html',
     'from 2 cm to 9 cm on a ruler',
     'a: "7 cm"',
     'a: "9 cm"'),
    ('grade-2-app', 'how-much-how-long.html',
     'A film starts at 3:00 and ends at 5:00',
     'a: "2 hours"',
     'a: "3 hours"'),
    ('grade-2-app', 'half-past-quarter-to.html',
     'Which hand shows the hour?',
     'a: "the short one"',
     'a: "the long one"'),
    ('grade-2-app', 'half-past-quarter-to.html',
     'The long hand points to 6.',
     'a: "half past"',
     'a: "quarter past"'),
    ('grade-2-app', 'half-past-quarter-to.html',
     'Quarter to 5 is the same as',
     'a: "4:45"',
     'a: "5:15"'),
    ('grade-2-app', 'half-past-quarter-to.html',
     'What is 3:20 in words?',
     'a: "twenty past three"',
     'a: "twenty to three"'),
    ('grade-2-app', 'half-past-quarter-to.html',
     'The 1st of March is a Monday',
     'a: "Monday"',
     'a: "Sunday"'),
    ('grade-2-app', 'half-past-quarter-to.html',
     'Which one is the longest?',
     'a: "an hour"',
     'a: "a minute"'),
    ('grade-2-app', 'sides-and-corners.html',
     'Two quarter turns the same way make',
     'a: "a half turn"',
     'a: "a whole turn"'),
    ('grade-2-app', 'sides-and-corners.html',
     'Facing up, you make a half turn',
     'a: "down"',
     'a: "left"'),
    ('grade-2-app', 'which-way-from-here.html',
     'faces the top of the page and turns',
     'a: "the right of the page"',
     'a: "the left of the page"'),
    ('grade-2-app', 'sides-and-corners.html',
     '4 equal sides and 4 square corners',
     'a: "square"',
     'a: "rectangle"'),
    ('grade-2-app', 'sides-and-corners.html',
     'Which solid is like a ball?',
     'a: "sphere"',
     'a: "cylinder"'),
    ('grade-2-app', 'which-way-from-here.html',
     'sitting on top of the box',
     'a: "above the box"',
     'a: "below the box"'),
    ('grade-2-app', 'which-way-from-here.html',
     'in the middle of the two blue ones',
     'a: "between them"',
     'a: "beside them"'),
    ('grade-2-app', 'which-way-from-here.html',
     'When a shape is reflected, the reflection is',
     'a: "the same size"',
     'a: "always bigger"'),
    ('grade-2-app', 'which-way-from-here.html',
     'A reflection in a mirror line is',
     'a: "the same distance the other side"',
     'a: "always further away"'),
    ('grade-2-app', 'patterns-that-grow.html',
     'ABB ABB ABB',
     'a: 3',
     'a: 2'),
    ('grade-2-app', 'patterns-that-grow.html',
     'Circle, square, circle, square, circle',
     'a: "square"',
     'a: "circle"'),
    ('grade-2-app', 'patterns-that-grow.html',
     '4, 7, 10, 13',
     'a: "add 3"',
     'a: "add 4"'),
    ('grade-2-app', 'patterns-that-grow.html',
     'Pattern 1 has 3 blocks and each adds 2',
     'a: 11',
     'a: 13'),
    ('grade-2-app', 'patterns-that-grow.html',
     'A growing pattern goes 1, 4, 7, 10',
     'a: "no"',
     'a: "yes"'),
    ('grade-2-app', 'patterns-that-grow.html',
     'Which is a repeating pattern?',
     'a: "AB AB AB"',
     'a: "1, 2, 4, 8"'),
    ('grade-2-app', 'patterns-that-grow.html',
     'From pattern 1 to pattern 10',
     'a: 9',
     'a: 10'),
    ('grade-2-app', 'count-it-chart-it.html',
     'crossed through stand for',
     'a: 5',
     'a: 4'),
    ('grade-2-app', 'count-it-chart-it.html',
     'one 🍪 = 2',
     'a: 8',
     'a: 4'),
    ('grade-2-app', 'count-it-chart-it.html',
     'each step is 2',
     'a: 6',
     'a: 3'),
    ('grade-2-app', 'count-it-chart-it.html',
     'means it will definitely happen',
     'a: "certain"',
     'a: "likely"'),
    ('grade-2-app', 'count-it-chart-it.html',
     '8 red and 1 blue',
     'a: "red"',
     'a: "blue"'),
    ('grade-2-app', 'count-it-chart-it.html',
     'Flipping a fair coin',
     'a: "an even chance"',
     'a: "certain"'),
    ('grade-2-app', 'count-it-chart-it.html',
     'spinner is half red, half blue',
     'a: "fair"',
     'a: "not fair"'),
    ('grade-2-app', 'count-it-chart-it.html',
     'bar chart shows 6, 4, 8 and 2',
     'a: 20',
     'a: 18'),
    # ---- from mutate-stage34.py ----
    ('grade-3-app', 'time-and-direction.html',
     'opposite of north',
     'a: "south"',
     'a: "east"'),
    ('grade-3-app', 'time-and-direction.html',
     'facing west and you turn to your right',
     'a: "north"',
     'a: "south"'),
    ('grade-3-app', 'shapes-and-symmetry.html',
     'lines of symmetry does a square',
     'a: 4',
     'a: 2'),
    ('grade-3-app', 'measure-it.html',
     'right angles make a straight line',
     'a: 2',
     'a: 1'),
    ('grade-3-app', 'equal-parts.html',
     'Which is bigger, 1/4 or 1/10?',
     'a: "1/4"',
     'a: "1/10"'),
    ('grade-3-app', 'equal-parts.html',
     '1/2 is the same as which fraction?',
     'a: "5/10"',
     'a: "2/10"'),
    ('grade-3-app', 'ask-count-chart.html',
     'How likely is a 7?',
     'a: "it will not happen"',
     'a: "it might happen"'),
    ('grade-3-app', 'ask-count-chart.html',
     'half a picture',
     'a: 5',
     'a: 1'),
    ('grade-3-app', 'ask-count-chart.html',
     'BOTH even AND more than 20',
     'a: "in the middle, where the hoops overlap"',
     'a: "outside both hoops"'),
    ('grade-4-app', 'ways-to-calculate.html',
     'What is 347 + 185?',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'ways-to-calculate.html',
     'What is 87',
     'a: 0',
     'a: 2'),
    ('grade-4-app', 'big-numbers-below-zero.html',
     'worth in 63,451',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'big-numbers-below-zero.html',
     'Which is bigger,',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'big-numbers-below-zero.html',
     'degrees colder',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'patterns-and-squares.html',
     'square number',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'patterns-and-squares.html',
     'odd number added to an odd',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'patterns-and-squares.html',
     '= 62',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'telling-the-time.html',
     'minutes are there in 3 hours',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'telling-the-time.html',
     '24-hour time, what is 2:30 pm',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'telling-the-time.html',
     'date 9 days later',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'telling-the-time.html',
     'months from March 2024',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'shape-and-measures.html',
     'wide and 4 tall',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'shape-and-measures.html',
     'square-based pyramid',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'shape-and-measures.html',
     'An angle of 120',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'where-things-are.html',
     'quarter turn clockwise',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'where-things-are.html',
     '3 east then 2 north',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'asking-sorting-chance.html',
     'Rolling a 7',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'asking-sorting-chance.html',
     '9 red counters',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'parts-of-a-whole.html',
     'hundred square are shaded',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'shape-and-measures.html',
     'two circular faces',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'shape-and-measures.html',
     'cross fold up',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'shape-and-measures.html',
     'three small marks between',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'telling-the-time.html',
     'leaves at 13:20',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'where-things-are.html',
     'coordinates (3, 5)',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'where-things-are.html',
     'lies between south and west',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'parts-of-a-whole.html',
     'a fifth or an eighth',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'parts-of-a-whole.html',
     'equivalent to three quarters',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'parts-of-a-whole.html',
     'three fifths add one fifth',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'parts-of-a-whole.html',
     'NOT another name',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'asking-sorting-chance.html',
     'pictures show 9 children',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'big-numbers-below-zero.html',
     'same number as 4,208',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'big-numbers-below-zero.html',
     'in order, smallest first',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'big-numbers-below-zero.html',
     'hundreds are there in 4,072',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'telling-the-time.html',
     'Buses reach the library',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'where-things-are.html',
     'corners at (1, 1) and (4, 3)',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'asking-sorting-chance.html',
     'most common in Class 4B',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'asking-sorting-chance.html',
     'Two classes both have 22 children',
     'a: 0',
     'a: 1'),
    # ---- from mutate-grade34.py ----
    ('grade-3-app', 'measure-it.html',
     'How many millilitres in one litre?',
     'a: 1000',
     'a: 100'),
    ('grade-4-app', 'big-numbers-below-zero.html',
     'Round 4,650 to the nearest 100.',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'big-numbers-below-zero.html',
     'Round 47,318 to the nearest 1000.',
     'a: 0',
     'a: 2'),
    ('grade-4-app', 'parts-of-a-whole.html',
     'What is a quarter of 24?',
     'a: 0',
     'a: 1'),

    # ---- the Stage 4 METHOD questions, added with the rules that read them ----
    # Every one of these reads as opinion - "easiest", "the same as", "true
    # about", "roughly" - and every one is decided by arithmetic. That is
    # exactly the case where a rule can cheat: recognising the right option by
    # its wording passes the real key and would pass a wrong one too, and
    # nothing in the checker's own output can tell the two apart. These are the
    # cases that make the difference visible.
    ('grade-4-app', 'patterns-and-squares.html',
     'what is the term-to-term rule?',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'ways-to-calculate.html',
     'write 4,207 in words?',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'ways-to-calculate.html',
     'Roughly, what is 412',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'ways-to-calculate.html',
     'easiest if you first work out:',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'ways-to-calculate.html',
     '25 is the same as:',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'ways-to-calculate.html',
     'true about 6 and 24?',
     'a: 0',
     'a: 1'),
    ('grade-4-app', 'shape-and-measures.html',
     '9 whole squares and 6 part squares',
     'a: 0',
     'a: 1'),

    # WHICH DIGIT WAS ASKED ABOUT DECIDES THIS, so binding the key to the
    # numerator's meaning has to fail. The two options are the two halves of
    # what a fraction says - "how many equal parts" and "how many you take" -
    # and both are true statements ABOUT 3/4; only one answers the question
    # asked. A rule matching the option that mentions "parts" would pass this
    # mutation happily.
    ('grade-2-app', 'fair-shares.html',
     'what does the 4 tell you?',
     'a: "how many equal parts"',
     'a: "how many you take"'),

    # ---- the Grade 1 data-handling questions, added with the rules for them ----
    # These are the ones that look least checkable and are not: a card's place
    # is decided by testing it against the criteria, a claim about a graph is
    # decided by the graph's own numbers, and "most" does not license "every".
    # Each mutation binds the key to an option that is FALSE for the stated
    # reason, so a rule that matched on wording would let it through.
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'sorted into hoops labelled',
     'a: "in the middle"',
     'a: "in the red hoop only"'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'Carroll diagram with rows',
     'a: "not red, not a circle"',
     'a: "not red, circle"'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'most chose mango',
     'opts: ["no", "yes"], a: "no"',
     'opts: ["no", "yes"], a: "yes"'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'Does the graph tell us about the <b>whole school</b>?',
     'a: "no, only the class we asked"',
     'a: "yes, all classes are the same"'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'true</b> about the pet graph?',
     '{ t: "More children have a dog than a bird", ok: true },\n          { t: "Every child has a dog", ok: false }',
     '{ t: "More children have a dog than a bird", ok: false },\n          { t: "Every child has a dog", ok: true }'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'Look back at the fruit graph',
     '{ t: "Mango was chosen most often", ok: true },\n          { t: "Everybody likes mango", ok: false }',
     '{ t: "Mango was chosen most often", ok: false },\n          { t: "Everybody likes mango", ok: true }'),
    # The question a content fix made unreadable. Rewording the duplicated stem
    # to "And how many counters now?" pushed it past a ^how many anchor, and the
    # checker lost it without a word; this case fails if the rule stops reading
    # it again. The key literal is taken with its closing bracket so it cannot
    # match the `pic: 14` two fields earlier.
    ('grade-1-app/g1v2', 'counting-to-twenty.html',
     'And how many counters now?',
     '15], a: 14',
     '15], a: 13'),
    ('grade-1-app/g1v2', 'asking-and-sorting.html',
     'Can it tell us what the whole school likes best?',
     '{ t: "No, we only asked our class", ok: true }, { t: "Yes, it is the same everywhere", ok: false }',
     '{ t: "No, we only asked our class", ok: false }, { t: "Yes, it is the same everywhere", ok: true }'),
    # ---- Grade 1's second steps (grade-1-app/add-second-steps.py, 2026-09-11) ----
    # Every one of their questions the tool can verify, re-bound. The first four
    # are also the proof of the four rules those questions CORRECTED: each of
    # them used to report its key wrong (an ordinal read as a number twice, a
    # curved solid's "flat faces" read as all its faces, a tie between two jugs
    # broken on the label), so a re-binding that lands on the old wrong answer -
    # 3 flat faces, jug A - is the case the old rule would have passed.
    ('grade-1-app/g1v2', 'counting-to-twenty.html',
     'Which place comes just after <b>7th</b>',
     '{ t: "8th", ok: true }, { t: "6th", ok: false }, { t: "9th", ok: false }',
     '{ t: "8th", ok: false }, { t: "6th", ok: false }, { t: "9th", ok: true }'),
    ('grade-1-app/g1v2', 'counting-to-twenty.html',
     'Which word says <b>10th</b>',
     '{ t: "tenth", ok: true }, { t: "ten", ok: false }',
     '{ t: "tenth", ok: false }, { t: "ten", ok: true }'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'How many <b>flat</b> faces does a cylinder have',
     '{ t: "2", ok: true }, { t: "1", ok: false }, { t: "3", ok: false }',
     '{ t: "2", ok: false }, { t: "1", ok: false }, { t: "3", ok: true }'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'pic: jugRow([[0.5, "A"], [0.5, "B"]])',
     '{ t: "They hold the same", ok: true }, { t: "A", ok: false }',
     '{ t: "They hold the same", ok: false }, { t: "A", ok: true }'),
    ('grade-1-app/g1v2', 'adding-and-taking-away.html',
     '6 and ? make 10',
     '{ t: "4", ok: true }, { t: "3", ok: false }',
     '{ t: "4", ok: false }, { t: "3", ok: true }'),
    ('grade-1-app/g1v2', 'adding-and-taking-away.html',
     'The frame is full. 10 and ? make 10',
     '{ t: "0", ok: true }, { t: "1", ok: false }',
     '{ t: "0", ok: false }, { t: "1", ok: true }'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'How many <b>faces</b> does a cube have',
     '{ t: "6", ok: true }, { t: "3", ok: false }',
     '{ t: "6", ok: false }, { t: "3", ok: true }'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'How many <b>edges</b> does a cone have',
     '{ t: "1", ok: true }, { t: "0", ok: false }',
     '{ t: "1", ok: false }, { t: "0", ok: true }'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'How many <b>faces</b> does a pyramid have',
     '{ t: "5", ok: true }, { t: "4", ok: false }, { t: "8", ok: false }',
     '{ t: "5", ok: false }, { t: "4", ok: false }, { t: "8", ok: true }'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'The balloon is bigger',
     'pic: balance(-1, "🎈", "🪨")',
     'pic: balance(1, "🎈", "🪨")'),
    ('grade-1-app/g1v2', 'shapes-and-sizes.html',
     'pic: balance(1, "🍍", "🍋")',
     'pic: balance(1, "🍍", "🍋")',
     'pic: balance(-1, "🍍", "🍋")'),
    ('grade-1-app/g1v2', 'days-months-and-clocks.html',
     'Which is <b>longer</b>: a month or a week',
     '{ t: "a month", ok: true }, { t: "a week", ok: false }',
     '{ t: "a month", ok: false }, { t: "a week", ok: true }'),
]


def in_check_item(s, i, frag):
    """does the fragment at `i` belong to an object that HAS a question?

    Look back to the nearest `{` and ask whether a `q:` or `ask:` appears
    between it and the fragment. That is enough to separate a check item from
    an activity sharing its wording - "Rolling a 7" is `{ e: "Rolling a 7 ...",
    a: 0 }` in one place and `{ q: "Rolling a 7 ... is:", o: [...], a: 0 }` in
    the other - and it does not care what order the fields come in, nor whether
    the fragment is in the question TEXT or in the `pic:` that distinguishes
    two items whose text is identical.

    Two stricter rules were tried and both were wrong. Requiring an options
    array between fragment and key is false on `{q, a, opts}` items, where the
    key comes first: 30 silent SKIPs. Building brace-balanced spans for the
    whole file is worse - these are HTML, so a `<style>` block's braces put the
    scanner into nonsense and nearly every case skipped.
    """
    start = s.rfind("{", max(0, i - 2000), i)
    if start < 0:
        return False
    return bool(re.search(r"\b(?:q|ask)\s*:\s*[\"']", s[start:i + len(frag)]))


def write_retry(p, text, tries=6):
    """write, retrying a Windows file lock.

    OSError 22 turns up sporadically here - an indexer or antivirus holding
    the file for a moment - and it hit the per-case writes, which had no retry
    while restore_all did. The run aborted mid-suite. The `finally` still put
    the tree back, so nothing was damaged, but an intermittent abort makes the
    harness unreliable for whoever runs it next.
    """
    for _ in range(tries):
        try:
            io.open(p, "w", encoding="utf-8", newline="").write(text)
            if io.open(p, encoding="utf-8", newline="").read() == text:
                return True
        except OSError:
            pass
        time.sleep(0.3)
    return False


def run(app):
    r = subprocess.run([sys.executable, TOOL, "--app", os.path.normpath(os.path.join(ROOT, app))],
                       capture_output=True, text=True, encoding="utf-8")
    m = re.search(r"(\d+) questions, (\d+) verified, (\d+) WRONG", r.stdout or "")
    return (int(m.group(3)), r.stdout) if m else (None, (r.stdout or "") + (r.stderr or ""))


cases = [c for c in CASES if not ONLY or c[0] == ONLY]
if not cases:
    print("no cases for --app %s" % ONLY)
    raise SystemExit(2)
if "--list" in argv:
    for app, f, frag, _, _ in cases:
        print("  %-18s %-30s %s" % (app, f[:30], frag[:60]))
    print("\n  %d case(s)" % len(cases))
    raise SystemExit(0)

apps = sorted({c[0] for c in cases})
snap = {}
for app, f, *_ in cases:
    p = os.path.normpath(os.path.join(ROOT, app, f))
    snap[p] = io.open(p, encoding="utf-8", newline="").read()


def restore_all():
    bad = [p for p, s in snap.items() if not write_retry(p, s)]
    if bad:
        print("\n  RESTORE FAILED - run:  git checkout -- " + " ".join(bad))
    return not bad


for app in apps:
    w, out = run(app)
    if w is None:
        print("REFUSING TO START: %s produced no summary" % app)
        print(out[-800:])
        raise SystemExit(2)
    if w != 0:
        print("REFUSING TO START: %s is already red (%s wrong)" % (app, w))
        raise SystemExit(2)
print("baseline: %s all 0 wrong, %d mutation(s) to apply\n" % (", ".join(apps), len(cases)))

fails, skipped = [], []
try:
    for app, f, frag, old, new in cases:
        p = os.path.normpath(os.path.join(ROOT, app, f))
        s = snap[p]
        i, j = -1, -1
        while True:
            i = s.find(frag, i + 1)
            if i < 0:
                break
            if not in_check_item(s, i, frag):
                continue
            start = s.rfind("{", max(0, i - 2000), i)
            cand = s.find(old, start)
            if 0 <= cand - start <= 1200:
                j = cand
                break
        if j < 0:
            skipped.append("%s %s :: %s" % (app, f, frag))
            print("  %-8s %-16s %s" % ("SKIP", app[:16], frag[:52]))
            continue
        if not write_retry(p, s[:j] + new + s[j + len(old):]):
            print("  ABORT  could not write %s" % p)
            break
        w, o = run(app)
        verdict = "caught" if w else ("NO-RUN" if w is None else "SURVIVED")
        print("  %-8s %-16s %-52s -> %s wrong" % (verdict, app[:16], frag[:52], w))
        if verdict != "caught":
            fails.append("%s %s (%s)" % (app, frag, verdict))
            if w is None:
                print("      " + "\n      ".join(o.strip().splitlines()[-3:]))
        write_retry(p, snap[p])
finally:
    restored = restore_all()

ok = restored
for app in apps:
    w, _ = run(app)
    print("restored: %-18s -> %s wrong" % (app, w))
    ok = ok and w == 0

if skipped:
    # A SKIP IS NOT A PASS. It means the fragment or the key literal no longer
    # matches the lesson - the content moved, or the case was mistyped - and
    # the rule it was written for is now untested.
    print("\n  COULD NOT PLACE %d mutation(s):" % len(skipped))
    for x in skipped:
        print("     " + x)
if fails or skipped or not ok:
    print("\nFAILED: %s" % (fails or skipped or "a build is red after restore"))
    raise SystemExit(1)
print("\nall %d mutations caught, every build green on restore" % len(cases))
