# -*- coding: utf-8 -*-
"""Three new steps at the FRONT of every lesson, the Grade 4 build's own
"What this lesson is about" / "Unit lecture" / "Math words" pattern -
REBUILT, not ported, because Grade 5 is a different build by design (see
add-self-check.py's own docstring, and the root CLAUDE.md rule that
Grades 5-8 keep their page design). This build has no deck, no
`finish(i, msg)`, no `show(i, speak)`, no `say()` at all - confirmed by
direct search, there is no narration anywhere in Grade 5. What exists
instead: `<section class="step" id="sN">` blocks read top to bottom, a
`<nav class="steps-nav">` table of contents, and an IntersectionObserver
(wire-platform.py) that marks a section "seen" the instant any part of
it scrolls into view - no click, no answer, no finish() required.

    python add-lesson-opener.py            # report
    python add-lesson-opener.py --write

STEP NUMBERING IS GLOBAL ACROSS ALL FIVE LESSONS (s1-s7 in lesson one,
s8-s13 in lesson two, and so on - confirmed by direct inspection - a
holdover from squares-and-steps.html, the single scrolling page these
five were split from, whose own prose still cross-references steps by
number: "Step 17 already explained why"). Renumbering that sequence to
make room for 3 new steps per lesson would mean touching every id, every
nav entry and every "Step N" label in all FIVE files, and every prose
reference to a step number - a much bigger blast radius than Grades 1-4's
per-lesson +3 shift, for a numbering scheme this tool has no way to know
is exhaustively found. OWNER DECISION, 2026-09-18: these three steps get
their OWN local ids instead (opener-about / opener-lecture / opener-words)
and a NON-NUMERIC nav marker, exactly the pattern the self-check step
already uses ("Check", not a number) - sidestepping the global sequence
entirely rather than renumbering it.

WHAT THE THREE STEPS ACTUALLY ARE HERE, rebuilt for a page with no voice
and no finish() rather than ported line-for-line from Grade 4:

  - "What this lesson is about" is now purely static markup - a heading
    and a list - because there is no finish() for a button to call and
    nothing else on this page gates on a click either (every other step
    is read or explored, never "completed" by a button press).
  - "Unit lecture" has no video and no voice to narrate with, so instead
    of Grade 4's click-through carousel (which exists there to pace a
    narration that has nowhere to go here) it is a short, static, labelled
    walkthrough in three parts - closer to this build's own "scan the
    page" design (root CLAUDE.md's words for Grades 5-8) than a forced
    click-through would be.
  - "Math words" is the one step built the same as Grade 4's, because the
    owner asked for the FULL interactive word-card feature specifically:
    tap a card, hear nothing (there is no voice) but SEE the meaning and
    a "use it" sentence, then a closing matching quiz once every word has
    been opened. No finish() call at the end - nothing to mark; the
    section being scrolled into view already marks it seen.

NO VOCABULARY TO SUPERSEDE HERE. Confirmed: no add-vocabulary.py exists
in this directory and no "vocab" string appears in any Grade 5 lesson -
this app's own comparison found nothing built on this dimension at any
of the four grades before Grade 4 closed the gap; Grade 5 never got one
at all. Math words is pure addition here, not a replacement.

ONLY FIVE OF SIX "lessons" IN app.config.json ARE TARGETED - the sixth,
check-what-you-know.html, is the quiz page, not a lesson, matching
add-self-check.py's own exclusion of it for the identical reason: no
learner is walking into a quiz to be told what it is about first.

Its own <script>/<style> pair, appended once per lesson, not threaded
into any existing IIFE - the same reason add-self-check.py gives: those
closures own every picker already on the page, and an unrelated widget
threaded through one becomes the thing most likely broken by the next
edit to it.

Guarded by a marker; every anchor must match exactly once or the file is
refused rather than half-patched.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g5-lesson-opener"

# lesson -> {
#   about: [str, ...]                         "What this lesson is about"
#   parts: [(title, text), ...]               "Unit lecture" - a static walkthrough
#   words: [(word, pic, meaning, [use, ...])]  "Math words" - full interactive tap-card + quiz
# }
WORK = {
 "where-things-are": {
  "about": [
   "Compare the relative position of coordinates, with or without the aid of a grid.",
   "Use knowledge of 2D shapes and coordinates to plot points to form lines and shapes in the first quadrant.",
   "Translate 2D shapes, identifying the corresponding points between the original and the translated shape.",
   "Reflect 2D shapes in both horizontal and vertical mirror lines to create patterns on square grids.",
  ],
  "parts": [
   ("Along first, then up", "A coordinate pair names one place only because the order is fixed - the first number is how far along and the second is how far up. Swap them and both numbers are still right while the point is somewhere else entirely."),
   ("A slide keeps the shape facing the same way", "Translating a shape moves every vertex by the same amount in the same direction. Nothing turns and nothing changes size, so if one corner goes three right and two up, all of them do."),
   ("A reflection turns it to face the mirror", "Reflecting flips the shape across a line. Each point lands the same distance on the other side, so a vertex close to the mirror stays close and a far one stays far."),
  ],
  "words": [
   ("coordinates", "\U0001F4CD", "A pair of numbers that fixes one point on a grid: how far along, then how far up.", ["Give the coordinates of each vertex of this rectangle."]),
   ("vertex", "\U0001F53C", "A corner of a shape, where two sides meet. More than one are called vertices.", ["Plot the four vertices, then join them."]),
   ("translate", "\u27A1\uFE0F", "To slide a shape, moving every point the same distance in the same direction, without turning it.", ["Translate the triangle four right and three up."]),
   ("translation", "\U0001F503", "The slide itself, described by how far the shape moved along and how far up.", ["Describe the translation that took the shape from here to there."]),
   ("reflect", "\U0001FA9E", "To flip a shape across a mirror line, so each point lands the same distance on the other side.", ["Reflect the shape in the vertical mirror line."]),
   ("mirror line", "\u2194\uFE0F", "The line a shape is reflected in; it can run across the grid or up it.", ["Draw the mirror line, then reflect the pattern in it."]),
   ("grid", "\U0001F4C8", "A set of squares with numbered axes along the bottom and up the side, used to fix positions.", ["Find the point on the grid without using the gridlines."]),
  ],
 },
 "shapes-and-angles": {
  "about": [
   "Identify, describe, classify and sketch isosceles, equilateral or scalene triangles.",
   "Estimate and measure perimeter and area of 2D shapes, understanding that shapes with the same perimeter can have different areas.",
   "Draw compound shapes that can be divided into rectangles and squares, and estimate, measure and calculate their perimeter and area.",
   "Identify, describe and sketch 3D shapes in different orientations.",
   "Identify and sketch different nets for a cube.",
   "Use knowledge of reflective symmetry to identify and complete symmetrical patterns.",
   "Estimate, compare and classify angles, using geometric vocabulary including acute, right and obtuse.",
   "Know that the sum of the angles on a straight line is 180 degrees, and use this to calculate missing angles.",
  ],
  "parts": [
   ("Sorting by the sides", "Triangles are named by how many sides are the same length - all three, exactly two, or none. The angles always agree with the sides, so an equilateral triangle has three equal angles and a scalene triangle has none."),
   ("Naming an angle by eye", "A right angle is 90 degrees, the corner of a page. Smaller than that is acute and larger is obtuse, so you can classify an angle by holding a corner against it without measuring anything."),
   ("Round the edge, or inside", "Perimeter is the distance all the way round and area is how many squares fit inside. They answer different questions, which is why two rectangles can use the same length of fence and hold different amounts of room."),
  ],
  "words": [
   ("equilateral", "\U0001F53A", "A triangle with all three sides the same length, so all three angles are 60 degrees.", ["Sketch an equilateral triangle and mark its equal sides."]),
   ("isosceles", "\U0001F4D0", "A triangle with two sides the same length, so the two angles opposite them are equal.", ["Name the equal angles in this isosceles triangle."]),
   ("scalene", "\U0001F4CF", "A triangle with no two sides the same length, and so no two angles the same.", ["Explain why a scalene triangle has no line of symmetry."]),
   ("acute", "\U0001F4C9", "An angle smaller than a right angle - less than 90 degrees.", ["Classify this angle as acute, right or obtuse."]),
   ("obtuse", "\U0001F4C8", "An angle larger than a right angle but smaller than a straight line - between 90 and 180 degrees.", ["Find the obtuse angle in this shape."]),
   ("perimeter", "\U0001F6B6", "The distance all the way round the outside edge of a shape.", ["Measure the perimeter of this rectangle in centimetres."]),
   ("area", "\U0001F7E6", "How much surface a shape covers, counted in squares.", ["Work out the area of this compound shape."]),
   ("net", "\U0001F4E6", "A solid opened out flat, showing every face, which folds back up into the solid.", ["Sketch a net that folds into a cube."]),
   ("symmetrical", "\U0001F98B", "Having a mirror line, so that every part has a matching part the same distance away on the other side.", ["Complete the pattern so that it is symmetrical."]),
  ],
 },
 "squares-cubes-and-roots": {
  "about": [
   "Find a square number as the result of multiplying a number by itself.",
   "Show that square numbers can be built as square arrays.",
   "Explain the link between consecutive odd numbers and square numbers.",
   "Explain why a number is not a square number.",
   "Build a triangular number, and the next one from the one before.",
  ],
  "parts": [
   ("Squares and roots", "A square number comes from multiplying a whole number by itself - 4 x 4 = 16, so 16 is a square number, and its square root is 4."),
   ("Cubes and cube roots", "A cube number comes from multiplying a whole number by itself three times - stack a square, three layers high, and you have a cube."),
   ("Triangular numbers", "A triangular number is built from rows that grow by one each time - 1, then 1+2, then 1+2+3 - and can be drawn as a triangle of dots."),
  ],
  "words": [
   ("square number", "🔷", "The result of multiplying a whole number by itself - 4 x 4 = 16, so 16 is a square number.", ["4 squared is 16, a square number."]),
   ("square root", "🌱", "The number that, multiplied by itself, gives the square number - the square root of 16 is 4.", ["Find the square root of 25."]),
   ("cube number", "📦", "The result of multiplying a whole number by itself three times - 3 x 3 x 3 = 27.", ["27 is a cube number, because 3 cubed is 27."]),
   ("cube root", "🎲", "The number that, multiplied by itself three times, gives the cube number - the cube root of 27 is 3.", ["Find the cube root of 64."]),
   ("triangular number", "🔺", "A number built from rows that grow by one each time - 1, 1+2, 1+2+3, so 1, 3, 6, 10 are triangular numbers.", ["Draw the next triangular number as a triangle of dots."]),
  ],
 },
 "rules-and-patterns": {
  "about": [
   "Identify missing numbers in linear sequences.",
   "Explain why a sequence is linear.",
   "Find the difference between terms in a sequence.",
   "Use a term-to-term rule to extend a sequence.",
   "Work out a recursion rule from terms that are not consecutive.",
  ],
  "parts": [
   ("Sequences and rules", "A sequence follows a rule from one term to the next - a term-to-term rule tells you exactly how to get from any term to the one after it."),
   ("Linear sequences", "A linear sequence changes by the same amount every time - find that difference once, and you can extend the sequence as far as you like."),
   ("Patterns in shapes", "A growing pattern of shapes hides a number sequence - count the pieces in each shape, and the rule for the shapes is the rule for the numbers too."),
  ],
  "words": [
   ("sequence", "➡️", "A list of numbers that follow one after another, in order, according to a rule.", ["3, 7, 11, 15 is a sequence."]),
   ("term", "🔢", "One number in a sequence - the 1st term, the 2nd term, and so on.", ["Find the 10th term of the sequence."]),
   ("rule", "📏", "The instruction that says how to get from one term in a sequence to the next.", ["The rule for this sequence is add 4 each time."]),
   ("linear", "↔️", "Changing by the same amount every time, so the sequence would plot as a straight line.", ["Check whether this sequence is linear."]),
   ("difference", "➖", "The gap between one term and the next in a sequence.", ["Find the difference between the 2nd and 3rd terms."]),
  ],
 },
 "how-whole-numbers-are-built": {
  "about": [
   "Use the order of operations correctly, where there are no brackets.",
   "Use related facts and inverse operations for missing number problems.",
   "Use a test of divisibility to recognise multiples of 4.",
   "Explain what a prime number is.",
   "Use the sieve of Eratosthenes to find prime numbers to 100.",
  ],
  "parts": [
   ("Odd, even and the order of operations", "Whole numbers are either odd or even, and a calculation with more than one operation must be done in the correct order, or the answer changes."),
   ("Factors and multiples", "A factor divides exactly into a number; a multiple is what you get by multiplying it. Every number shares factors with some numbers and not others."),
   ("Divisibility and primes", "A divisibility rule lets you check whether a number divides exactly without doing the whole division. A prime number has exactly two factors: 1 and itself."),
  ],
  "words": [
   ("factor", "🔗", "A number that divides exactly into another number, with nothing left over.", ["3 is a factor of 12."]),
   ("multiple", "🔟", "A number you land on when counting up in equal steps from zero.", ["12 is a multiple of 3."]),
   ("prime number", "🔑", "A number with exactly two factors: 1 and itself.", ["7 is a prime number, because only 1 and 7 divide into it."]),
   ("divisible", "➗", "Able to be divided exactly, with nothing left over.", ["12 is divisible by 4."]),
   ("order of operations", "📋", "The fixed order calculations must be worked out in when a sum has more than one operation.", ["Follow the order of operations to work out 3 + 4 x 2."]),
  ],
 },
 "past-the-whole-numbers": {
  "about": [
   "Explain the values of repeated digits in a number, including decimals.",
   "Decompose numbers into their place value parts, including decimals.",
   "Multiply and divide whole numbers by 10, 100 and 1000.",
   "Position positive and negative numbers around zero.",
   "Round numbers with one decimal place to the nearest whole number.",
  ],
  "parts": [
   ("Place value with decimals", "Place value carries on past the decimal point - the first digit after it is tenths, the next is hundredths, each worth ten times less than the one before."),
   ("Negative numbers and rounding", "Negative numbers sit to the left of zero on a number line. Rounding a decimal means finding which whole number, or which tenth, it is nearer to."),
   ("Fractions, percentages and ratio", "A fraction, a percentage and a ratio can all describe the same relationship between two amounts, just written in different ways."),
  ],
  "words": [
   ("decimal", "🔢", "A number written with a decimal point, such as 3.7, where the digits after the point are tenths, hundredths and so on.", ["3.7 is a decimal."]),
   ("negative number", "❄️", "A number below zero, written with a minus sign, such as -5.", ["The temperature dropped to a negative number."]),
   ("percentage", "💯", "A number out of 100, written with a % sign.", ["25% means 25 out of every 100."]),
   ("fraction", "🍕", "A part of a whole, written as one number over another.", ["3/4 is a fraction."]),
   ("ratio", "⚖️", "A way of comparing two amounts, showing how many times one contains the other.", ["The ratio of red to blue counters is 3 to 2."]),
  ],
 },
 "real-life": {
  "about": [
   "Apply skills of rounding and calculating to problems.",
   "Decide whether to work mentally, with jottings or using a formal method.",
   "Estimate and multiply whole numbers by 1-digit or 2-digit numbers.",
   "Estimate and divide whole numbers by 1-digit numbers.",
  ],
  "parts": [
   ("Choosing a method", "Some calculations are quick enough to do in your head, some need jottings, and some need a full written method - part of solving a problem is choosing which."),
   ("Estimating first", "Before working out an exact answer, a quick estimate tells you roughly what to expect, so you can tell if your exact answer is reasonable."),
   ("Reading the story", "A real-life problem hides its numbers inside a story - read it carefully, find what is being asked, then choose your method."),
  ],
  "words": [
   ("estimate", "🎲", "A sensible rough answer worked out before the exact calculation, by rounding the numbers first.", ["Estimate the answer before calculating it exactly."]),
   ("mental calculation", "🧠", "Working out an answer in your head, without writing anything down.", ["Try a mental calculation before reaching for a written method."]),
   ("jottings", "✏️", "Quick notes or partial working written down to help with a calculation, without setting out a full formal method.", ["Use jottings to keep track of your working."]),
   ("formal method", "✍️", "A full written method, such as long multiplication or long division, that is set out step by step.", ["Use a formal method for the harder calculation."]),
  ],
 },
}


def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def jlit(t):
    return '"' + str(t).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


NAV = (
    '<a href="#opener-about"><b>\U0001F50E</b> What this lesson is about</a>\n'
    '    <a href="#opener-lecture"><b>\U0001F3A5</b> Unit lecture</a>\n'
    '    <a href="#opener-words"><b>\U0001F5E3\uFE0F</b> Math words</a>\n'
    '    '
)


def about_section(about_li):
    head = (
        '\n  <!-- %s: what this lesson is about - static, no finish() exists to\n'
        '       gate a button on, so nothing here needs to be clicked. -->\n'
        '  <section class="step" id="opener-about">\n'
        '    <div class="step-head"><span class="step-num">About</span><h2>What this lesson is about</h2></div>\n'
        '    <p class="intro">By the end of this lesson you will be able to&hellip;</p>\n'
        '    <ul class="opener-list">\n'
    ) % MARK
    items = "".join('      <li>%s</li>\n' % esc(t) for t in about_li)
    return head + items + '    </ul>\n  </section>\n'


def lecture_section(parts, video=None):
    """The Unit lecture: the film if this lesson has one, then the three parts.

    THE FILM DOES NOT REPLACE THE PARTS, unlike Grades 1-4 where it stands in
    for a narrated click-through. Grade 5 is a page a learner SCANS - that is
    why this build has no deck - so the three named parts stay readable under
    the video. A learner who does not watch still has the whole lesson.

    No finish() is invented for the film ending: this build reports progress
    as "section reached", by an IntersectionObserver over each
    <section class="step">, so being here is what counts.
    """
    film = ""
    if video:
        film = (
            '    <div class="lec-film">\n'
            '      <video controls playsinline preload="none" poster="%s" src="%s">\n'
            '        <track kind="captions" srclang="en" label="English" src="%s">\n'
            '      </video>\n'
            '      <p class="lec-note">%s</p>\n'
            '    </div>\n'
        ) % (esc(video["poster"]), esc(video["src"]), esc(video["vtt"]), esc(video["note"]))
    body = film + "".join(
        '      <div class="opener-part"><p class="opener-phase">Part %d of %d</p>'
        '<h3>%s</h3><p>%s</p></div>\n' % (i + 1, len(parts), esc(title), esc(text))
        for i, (title, text) in enumerate(parts)
    )
    # ONE % OPERATOR OVER THE WHOLE TEMPLATE, not two spliced with +.
    # This used to read `'…%s</p>\n' % (intro) + '%s…' % (MARK, body)`, which
    # does not do what it looks like: adjacent string literals concatenate
    # BEFORE the % binds, so the first operator saw the whole block above it -
    # two %s - and was handed one argument. TypeError, every run, for everyone.
    # It was introduced with the film branch and nothing ran the tool after.
    intro = ("The whole lesson as a film, then the same three parts to read."
             if video else "The whole lesson, in three parts.")
    return (
        '\n  <!-- %s: unit lecture - a short static walkthrough in named parts\n'
        '       rather than Grade 4\'s narrated click-through; a film is shown\n'
        '       above it when this lesson has one. -->\n'
        '  <section class="step" id="opener-lecture">\n'
        '    <div class="step-head"><span class="step-num">Lecture</span><h2>Unit lecture</h2></div>\n'
        '    <p class="intro">%s</p>\n'
        '%s'
        '  </section>\n' % (MARK, intro, body)
    )


def words_section():
    return (
        '\n  <!-- %s: math words - the one opener step built fully interactive,\n'
        '       matching Grade 4\'s tap-card-then-quiz shape, minus say()/finish()\n'
        '       which do not exist on this build. -->\n'
        '  <section class="step" id="opener-words">\n'
        '    <div class="step-head"><span class="step-num">Words</span><h2>Math words</h2></div>\n'
        '    <p class="intro">Tap each word to see what it means and how to use it. Then show you know them.</p>\n'
        '    <div id="openerWords"></div>\n'
        '  </section>\n' % MARK
    )


CSS = """<style>/* %s - see add-lesson-opener.py */
  .opener-list { margin: 10px 0 0; padding-left: 22px; display: flex; flex-direction: column; gap: 9px;
    font-size: 15.5px; line-height: 1.5; color: var(--ink); }
  /* the unit lecture film, when the lesson has one. It sits ABOVE the three
     parts, which stay - Grade 5 is a page a learner scans. */
  .lec-film { max-width: 760px; margin: 0 0 16px; }
  .lec-film video { width: 100%%; display: block; border-radius: 16px; background: #000;
    aspect-ratio: 16 / 9; }
  .lec-note { margin: 7px 0 0; font-size: 14px; line-height: 1.45; color: var(--muted, #667); }
  .opener-part { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); }
  .opener-part:first-of-type { margin-top: 10px; padding-top: 0; border-top: none; }
  .opener-phase { margin: 0 0 3px; color: var(--teal); font-weight: 700; font-size: 12px;
    letter-spacing: .08em; text-transform: uppercase; }
  .opener-part h3 { margin: 0 0 5px; font-size: 17px; }
  .opener-part p:last-child { margin: 0; font-size: 15.5px; line-height: 1.5; color: var(--ink); }
  .ow-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;
    margin-top: 10px; }
  .ow-card { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 12px 8px 10px;
    border-radius: 14px; border: 2px solid var(--line); background: var(--card); color: var(--ink);
    font-weight: 700; font-size: 15px; line-height: 1.2; font: inherit; cursor: pointer; }
  .ow-card .ow-pic { font-size: clamp(34px, 7vw, 46px); line-height: 1.1; }
  .ow-card.heard { border-color: var(--teal); background: var(--teal-soft); }
  .ow-panel { margin-top: 12px; padding: 14px 16px; border-radius: 16px; border: 2px solid var(--teal);
    background: var(--card); text-align: left; }
  .ow-panel-head { display: flex; align-items: center; gap: 14px; }
  .ow-panel-pic { font-size: 34px; }
  .ow-panel-word { margin: 0; font-weight: 700; font-size: 22px; color: var(--ink); }
  .ow-panel-meaning { margin: 4px 0 0; font-size: 15.5px; line-height: 1.45; color: var(--ink); }
  .ow-uses-h { margin: 10px 0 3px; color: var(--teal); font-weight: 700; font-size: 11.5px;
    letter-spacing: .08em; text-transform: uppercase; }
  .ow-uses { margin: 0; padding-left: 18px; font-size: 14.5px; font-style: italic; color: var(--ink); }
  .ow-go { margin-top: 12px; }
  .ow-btn { font: inherit; font-size: 14px; font-weight: 700; padding: 9px 16px; border-radius: 12px;
    border: 1px solid var(--line); background: var(--card); color: var(--ink); cursor: pointer; }
  .ow-quiz-opts { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
  .ow-quiz-btn { min-width: 100px; padding: 10px 14px; border-radius: 14px; border: 2px solid var(--line);
    background: var(--card); color: var(--ink); font-weight: 700; font: inherit; cursor: pointer; }
  .ow-quiz-btn .ow-quiz-pic { display: block; font-size: 32px; line-height: 1.1; }
  .ow-quiz-btn.right { background: var(--good-soft); border-color: var(--good); }
  .ow-quiz-btn.wrong { background: var(--bad-soft); border-color: var(--bad); }
  .ow-quiz-btn:disabled { cursor: default; }
  .ow-fb { margin: 10px 0 0; font-size: 14.5px; color: var(--muted); }
  .ow-fb.good { color: var(--good); font-weight: 700; }
</style>
""" % MARK


def words_js(slug, words):
    words_js_arr = ", ".join(
        "{ w: %s, pic: %s, meaning: %s, uses: [%s] }"
        % (jlit(w), jlit(pic), jlit(meaning), ", ".join(jlit(u) for u in uses))
        for w, pic, meaning, uses in words
    )
    return ("""
<script>
/* %s: Math words for %s - a tap-card grid, a reveal panel, then a closing
   matching quiz once every word has been opened. Own local esc() AND own
   local shuffle(): every existing <script> on this page is its own IIFE
   (checked directly - this file alone has four, none sharing scope with
   any other), so shuffle(), though it exists elsewhere on the page, is
   not reachable from here any more than esc() is - confirmed the hard
   way, by a live ReferenceError the first time this ran in a browser.
   No say(), no finish(): this build has neither, and the section being
   scrolled into view is what marks it seen. */
(function () {
  const WORDS = [%s];
  const host = document.getElementById("openerWords");
  if (!host) return;
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const heard = new Set();
  let open = -1;
  function paintGrid() {
    host.innerHTML = '<div class="ow-grid" id="owGrid">' + WORDS.map((w, k) =>
      '<button type="button" class="ow-card' + (heard.has(k) ? ' heard' : '') + '" data-k="' + k + '">' +
      '<span class="ow-pic" aria-hidden="true">' + w.pic + '</span>' + esc(w.w) + '</button>').join('') + '</div>' +
      '<div class="ow-panel" id="owPanel"' + (open < 0 ? ' hidden' : '') + '></div>' +
      '<div class="ow-go" id="owGo" style="' + (heard.size === WORDS.length ? '' : 'display:none') + '">' +
      '<button type="button" class="ow-btn" id="owQuizGo">Show I know them &#9654;</button></div>';
    if (open >= 0) paintPanel();
    document.getElementById("owGrid").addEventListener("click", (e) => {
      const b = e.target.closest(".ow-card"); if (!b) return;
      open = Number(b.dataset.k); heard.add(open);
      paintGrid();
    });
    if (heard.size === WORDS.length) {
      const goBtn = document.getElementById("owQuizGo");
      if (goBtn) goBtn.addEventListener("click", () => quiz());
    }
  }
  function paintPanel() {
    const w = WORDS[open];
    const p = document.getElementById("owPanel");
    p.hidden = false;
    p.innerHTML = '<div class="ow-panel-head"><span class="ow-panel-pic" aria-hidden="true">' + w.pic + '</span>' +
      '<div><p class="ow-panel-word">' + esc(w.w) + '</p><p class="ow-panel-meaning">' + esc(w.meaning) + '</p></div></div>' +
      '<p class="ow-uses-h">Use it</p><ul class="ow-uses">' + w.uses.map((u) => '<li>' + esc(u) + '</li>').join('') + '</ul>';
  }
  function quiz() {
    const order = shuffle(WORDS.map((_, k) => k));
    let i = 0, right = 0, lock = false;
    function draw() {
      lock = false;
      const k = order[i], w = WORDS[k];
      const others = shuffle(WORDS.map((_, j) => j).filter((j) => j !== k)).slice(0, Math.min(2, WORDS.length - 1));
      const opts = shuffle([k].concat(others));
      host.innerHTML = '<p class="intro">Which word means: <b>' + esc(w.meaning) + '</b></p>' +
        '<div class="ow-quiz-opts" id="owChoices">' + opts.map((j) =>
          '<button type="button" class="ow-quiz-btn" data-ok="' + (j === k ? 1 : 0) + '">' +
          '<span class="ow-quiz-pic" aria-hidden="true">' + WORDS[j].pic + '</span>' + esc(WORDS[j].w) + '</button>').join('') + '</div>' +
        '<p class="ow-fb" id="owFb"></p>';
      document.getElementById("owChoices").addEventListener("click", (e) => {
        const b = e.target.closest(".ow-quiz-btn"); if (!b || lock) return;
        lock = true;
        const ok = b.dataset.ok === "1";
        document.getElementById("owChoices").querySelectorAll(".ow-quiz-btn").forEach((c) => {
          c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right");
        });
        if (!ok) b.classList.add("wrong"); else right++;
        const fb = document.getElementById("owFb");
        fb.className = "ow-fb" + (ok ? " good" : "");
        fb.textContent = ok ? "That's it! " + w.w + "." : "That word is " + w.w + ". " + w.meaning;
        i++;
        setTimeout(() => {
          if (i >= WORDS.length) {
            host.innerHTML = '<p class="intro">You know ' + right + ' of ' + WORDS.length + ' math words.</p>';
          } else draw();
        }, 2200);
      });
    }
    draw();
  }
  paintGrid();
})();
</script>
""" % (MARK, slug, words_js_arr))


todo, done, refused = [], 0, 0
for f in sorted(os.listdir(HERE)):
    if not f.endswith(".html"):
        continue
    slug = f[:-5]
    if slug not in WORK:
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %-28s" % slug)
        done += 1
        continue

    nav_m = re.search(r'(<nav class="steps-nav"[^>]*>\s*)', s)
    problems = []
    if not nav_m:
        problems.append("no <nav class=\"steps-nav\"> anchor")
    if s.count("</nav>") != 1:
        problems.append("</nav> x%d" % s.count("</nav>"))
    if s.count('<section class="step"') < 1:
        problems.append("no section.step to sit before")
    if not re.search(r'<section class="step" id="s\d', s):
        problems.append("no numbered <section class=\"step\" id=\"sN\"> to insert before")
    if problems:
        print("  REFUSED  %-28s %s" % (slug, "; ".join(problems)))
        refused += 1
        continue

    data = WORK[slug]
    steps_before = s.count('<section class="step"')

    # ---- 1. three nav entries, prepended inside the <nav>, right after it
    # opens - before the first numbered <a href="#sN">.
    out = s[:nav_m.end()] + NAV + s[nav_m.end():]

    # ---- 2. three new sections, inserted right after </nav> - before
    # whatever follows (a "<!-- STEP N -->" comment, then the first
    # <section class="step" id="sN">). Local ids, no renumbering of the
    # global s1..s27 sequence - see this tool's own docstring for why.
    nav_close = out.index("</nav>") + len("</nav>")
    new_sections = about_section(data["about"]) + lecture_section(data["parts"], data.get("video")) + words_section()
    out = out[:nav_close] + new_sections + out[nav_close:]

    # ---- 3. CSS and JS, each their own block, appended at the end - not
    # threaded into any existing IIFE, matching add-self-check.py's own
    # reasoning for the same choice.
    out = out.rstrip() + "\n" + words_js(slug, data["words"]) + "\n" + CSS

    steps_after = out.count('<section class="step"')
    nav_after = len(re.findall(r'<a href="#opener-', out))
    if out.count(MARK) < 4 or steps_after != steps_before + 3 or nav_after != 3:
        print("  REFUSED  %-28s marker=%d steps %d->%d nav=%d"
              % (slug, out.count(MARK), steps_before, steps_after, nav_after))
        refused += 1
        continue

    todo.append((p, out, slug))
    print("  would    %-28s %d about, %d parts, %d words"
          % (slug, len(data["about"]), len(data["parts"]), len(data["words"])))

if WRITE:
    for p, out, slug in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("\n  %d lesson(s) %s, %d already done, %d refused%s"
      % (len(todo), "written" if WRITE else "to write", done, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
