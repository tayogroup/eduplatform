# -*- coding: utf-8 -*-
"""Three new steps at the FRONT of every lesson, the Grade 4 build's own
"What this lesson is about" / "Unit lecture" / "Math words" pattern,
ported to Grade 3's own idiom - same deck, same finish(i, msg), same
STICKERS shelf, same "no esc() global" rule. UNLIKE Grades 1, 2 and 4,
this build is GENERATED (see add-second-steps.py's own docstring and
CLAUDE.md's Mathematics section): the shipped .html files are built from
these fragments by build-all.sh, so this tool patches the FRAGMENTS -
l{N}-slides.html and l{N}-content.js - never the built pages.

    python add-lesson-opener.py            # report
    python add-lesson-opener.py --write    # then ./build-all.sh

TWO FILES PER LESSON, NOT ONE. l{N}-slides.html carries the markup and
the <span class="n"> display numbers; l{N}-content.js carries STICKERS,
finish(N) and show(0, false). Both are patched together or neither is -
see the refusal checks below.

SLOT-BASED finish() calls are UNTOUCHED, on purpose. add-second-steps.py
added steps whose finish() reads a dynamically-computed SLOT (found by
document.querySelectorAll('.slide').indexOf(...) at runtime, not a
hardcoded literal), for exactly this reason: those calls need no
renumbering because they were never numbered in the source. The regex
below matches only finish(<digits> and leaves finish(SLOT, alone.

NO VOCABULARY PANEL TO REMOVE HERE, unlike Grades 1, 2 and 4. This
build's add-vocabulary.py patches the BUILT .html files directly, not
these fragments (confirmed: "ehel-g3-vocabulary" appears nowhere under
src/) - it was already in the exact silently-discarded-by-rebuild trap
CLAUDE.md's Mathematics section describes. Once this tool's own Math
words step is added to the fragments and build-all.sh is re-run, the
regenerated pages simply will not carry the old panel, because the
fragments never had it. Nothing here needs to strip it.

MATH WORDS SUPERSEDES THE OLD VOCABULARY LIST all the same:
add-vocabulary.py's (term, definition) list is reused as source text -
a pic and a "use it" sentence are added per word.

CSS GOES INTO g3-css.css, ONCE, NOT INTO EACH LESSON'S OWN <style>
BLOCK. The first attempt appended a fresh <style>...</style> to the end
of every l{N}-content.js, the same position Grade 4's tool uses - and
build-all.sh's own wire-accessibility.py REFUSED every lesson: its skip-
link anchor is the first "<header" in the built page, checked to fall
before the LAST "</style>" in the whole document (a comment in its own
source explains why - an earlier version anchored on a CSS comment and
silently inserted the skip link inside the stylesheet). A trailing
<style> block placed after the real <header> makes that last </style>
the WRONG one, so the check saw the header as "inside" a stylesheet that
in fact closes long before it. g3-css.css is the file build.sh already
injects into the ONE <style> block in <head>, before it closes - so this
tool's CSS rules go there instead, appended once and guarded by the same
marker, not duplicated eight times over.

Guarded by a marker; every anchor must match exactly once in BOTH
fragments or the pair is refused rather than half-patched.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
APP_ROOT = os.path.dirname(HERE)
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g3-lesson-opener"

# lesson file (built) -> fragment prefix, in build-all.sh's own order
FRAG = {
 "up-to-a-thousand": "l1",
 "adding-and-money": "l2",
 "rows-and-rules": "l3",
 "equal-parts": "l4",
 "shapes-and-symmetry": "l5",
 "measure-it": "l6",
 "time-and-direction": "l7",
 "ask-count-chart": "l8",
}

# lesson -> {
#   about: [str, ...]                         "What this lesson is about"
#   parts: [(title, say), ...]                "Unit lecture" - narrated walkthrough
#   words: [(word, pic, meaning, [use, ...])]  "Math words" - reused from add-vocabulary.py
# }
WORK = {
 "up-to-a-thousand": {
  "about": [
   "Say what a digit is worth by which column it sits in, up to a thousand.",
   "Break a 3-digit number apart into hundreds, tens and ones.",
   "Regroup a number into a different mix of hundreds and tens.",
   "Multiply a number by 10 and see every digit move one place.",
   "Round a number to the nearest 10 or 100.",
   "Make a good estimate of how many things are in a group.",
  ],
  "parts": [
   ("Place value to a thousand", "A digit is worth a different amount depending on which column it sits in - the 3 in 348 is worth three hundred, not just three."),
   ("Regrouping", "The same number can be written as a different mix of hundreds and tens - trading one hundred for ten tens never changes what the number is worth."),
   ("Rounding and estimating", "Rounding replaces a number with a nearby one that is easier to work with. Estimating is a sensible guess made before you count everything exactly."),
  ],
  "words": [
   ("digit", "🔢", "One of the ten symbols 0-9 used to write a number - 348 has three digits.", ["Point to the digit in the hundreds column of 348."]),
   ("place value", "🏷️", "What a digit is worth because of the column it stands in, not just the symbol itself.", ["The place value of the 3 in 348 is three hundred."]),
   ("decompose", "✂️", "Break a number apart into its hundreds, tens and ones, such as 348 into 300, 40 and 8.", ["Decompose 348 into hundreds, tens and ones."]),
   ("regroup", "🔄", "Rewrite the same number using a different mix of hundreds and tens, such as trading one hundred for ten tens - the value never changes.", ["Regroup 348 to show 2 hundreds and 14 tens."]),
   ("round", "🎯", "Replace a number with a nearby one that is easier to work with, such as the nearest 10 or 100.", ["Round 348 to the nearest hundred."]),
   ("estimate", "🎲", "A sensible guess at an amount, made by picturing part of it rather than counting every single one.", ["Estimate how many beans are in the jar."]),
  ],
 },
 "adding-and-money": {
  "about": [
   "Find the complement of a number to 100.",
   "Add pairs of numbers in any order without changing the total.",
   "Add and take away with regrouping.",
   "Use money notation with a decimal point.",
   "Estimate an answer before adding or taking away exactly.",
   "Work out change from a shopping total.",
  ],
  "parts": [
   ("Complements and adding in any order", "A complement to 100 is the amount still needed to reach it - 62 and 38 are complements. Numbers can be added in any order without changing the total."),
   ("Regrouping to add and take away", "When a column adds up to more than 9, a ten moves into the next column - that is regrouping, or carrying."),
   ("Money and change", "Money is written with a decimal point - the two figures after it are always cents. Giving change means working out the gap between the price and what was paid."),
  ],
  "words": [
   ("complement", "💯", "The amount still needed to reach a round number, such as a multiple of 10 or 100 - 62 and its complement to 100 is 38.", ["Find the complement of 62 to 100."]),
   ("regroup", "🔄", "Move a group of ten from one column into the next, such as moving 100 out of the hundreds to make 10 more tens.", ["Regroup to take away 48 from 300."]),
   ("carry", "➡️", "A ten (or a hundred) that moves from one column into the next when adding, because that column added up to more than 9.", ["Carry the ten into the tens column."]),
   ("exchange", "🔁", "Trade one from the column to the left for ten in the column you are working on, so you have enough to take away.", ["Exchange a hundred for ten tens."]),
   ("estimate", "🎲", "A sensible rough answer worked out before the exact calculation, by rounding the numbers first.", ["Estimate the total before adding exactly."]),
  ],
 },
 "rows-and-rules": {
  "about": [
   "Use an array of rows and columns to show a multiplication fact.",
   "Know that turning an array round gives the same total a different way.",
   "Split a multiplication into easier parts.",
   "Share an amount into equal groups and say what is left over.",
   "Find multiples of a number by counting up in equal steps.",
   "Find the rule in a growing pattern and use it to predict the next term.",
  ],
  "parts": [
   ("Arrays", "An array arranges things in equal rows and columns, so a multiplication can be seen and counted rather than just recited - 3 rows of 4 is the same total as 4 rows of 3."),
   ("Sharing and multiples", "Sharing an amount into equal groups can leave a remainder if it does not divide exactly. A multiple is a number you land on when counting up in equal steps from zero."),
   ("Patterns and rules", "A growing pattern follows a rule from one term to the next - find the rule, and you can predict any term without drawing it out."),
  ],
  "words": [
   ("array", "🔲", "Objects or numbers arranged in equal rows and columns, so you can count them by multiplying instead of one at a time.", ["Draw an array to show 3 rows of 4."]),
   ("multiple", "🔟", "A number you land on when counting up in equal steps from zero, such as 5, 10, 15, 20 when counting in fives.", ["List the first four multiples of 5."]),
   ("remainder", "🍪", "What is left over when an amount cannot be shared into equal groups exactly.", ["Share 13 biscuits into groups of 4 and find the remainder."]),
   ("sequence", "➡️", "A list of numbers or shapes that follow a pattern, one after another.", ["3, 6, 9, 12 is a sequence."]),
   ("rule", "📏", "The instruction that says how to get from one number in a sequence to the next.", ["The rule for this sequence is add 3 each time."]),
  ],
 },
 "equal-parts": {
  "about": [
   "Know that a fraction's parts must be exactly equal, not just close.",
   "Find a fraction of a group of objects.",
   "Say what the line in a fraction means.",
   "Name fractions that are worth the same, even though they look different.",
   "Compare two fractions and say which is bigger.",
  ],
  "parts": [
   ("Equal parts and fractions", "A fraction is one or more equal parts of a whole - the parts must be exactly the same size, not just close, or it is not a fraction at all."),
   ("Dividing to find a fraction", "The line in a fraction means divide - finding a fraction of a group means sharing it into that many equal parts."),
   ("Comparing fractions", "Fractions can be worth the same amount even though they look different, and two fractions can be compared by looking at whether their top or bottom numbers match."),
  ],
  "words": [
   ("fraction", "🍕", "One or more equal parts of a whole, written as one number over another, such as 3/4.", ["Shade 3/4 of the circle to show the fraction."]),
   ("equal parts", "⚖️", "Pieces of a whole that are all exactly the same size - not just close, but the same.", ["Cut the paper into four equal parts."]),
   ("whole", "🍎", "All of the equal parts put back together - one complete thing, before any of it was shared out.", ["Put the pieces back together to make one whole."]),
   ("divide", "➗", "Share an amount into equal parts - the line in a fraction means exactly this.", ["Divide 12 sweets into 4 equal groups."]),
   ("compare", "📏", "Work out which of two fractions is bigger, by looking at whether their top numbers or bottom numbers match.", ["Compare 3/4 and 1/2 and say which is bigger."]),
  ],
 },
 "shapes-and-symmetry": {
  "about": [
   "Name flat shapes, including quadrilaterals.",
   "Say whether a shape is regular or irregular.",
   "Find a line of symmetry on a shape.",
   "Reflect a shape over a mirror line.",
   "Measure the perimeter of a shape.",
   "Work out the area of a shape.",
  ],
  "parts": [
   ("Regular and irregular shapes", "A quadrilateral is any flat shape with exactly four straight sides. A shape is regular when every side and every corner is the same - otherwise it is irregular."),
   ("Symmetry and reflection", "A shape has a line of symmetry if folding it along that line makes both halves land exactly on top of each other. A reflection flips a shape over a mirror line the same way."),
   ("Perimeter and area", "Perimeter is the whole distance all the way round the outside edge of a shape. Area is how much flat space is covered inside it."),
  ],
  "words": [
   ("quadrilateral", "🔷", "Any flat shape with exactly four straight sides, such as a square, rectangle or trapezium.", ["Name a quadrilateral you can see in the room."]),
   ("regular", "⬡", "A shape where every side is the same length and every corner is the same - an irregular shape is not.", ["Say whether this hexagon is regular."]),
   ("symmetry", "🦋", "A shape has a line of symmetry when it can be folded along that line so the two halves land exactly on top of each other.", ["Fold the shape to check for symmetry."]),
   ("reflection", "↔️", "A flip of a shape over a mirror line, so every point ends up the same distance from the line, on the other side.", ["Draw the reflection of the triangle."]),
   ("perimeter", "🚧", "The whole distance all the way round the outside edge of a shape.", ["Measure the perimeter of the book."]),
   ("area", "🔲", "How much flat space is covered inside a shape's edge, measured in square units.", ["Work out the area of the rectangle."]),
  ],
 },
 "measure-it": {
  "about": [
   "Measure length, mass and capacity using real instruments.",
   "Read a scale marked in twos, fives or tens.",
   "Recognise a right angle as a quarter turn.",
   "Measure a length that does not start at zero on the ruler.",
   "Know that two right angles make a straight line.",
  ],
  "parts": [
   ("Length, mass and capacity", "Length is measured with a ruler, mass on a scale, and capacity by how much a container holds - each uses its own instrument and its own units."),
   ("Reading a scale", "A scale is the marked line on an instrument, and reading it carefully - not just the nearest big number - is what gives an accurate measurement."),
   ("Right angles and turns", "A right angle is a quarter turn - a square corner. Two right angles side by side make a straight line, which is a half turn."),
  ],
  "words": [
   ("capacity", "🥤", "How much a container can hold, measured in millilitres and litres.", ["Which jug has the bigger capacity?"]),
   ("mass", "⚖️", "How heavy something is, measured in grams and kilograms.", ["Estimate the mass of the book before weighing it."]),
   ("scale", "🌡️", "The marked line on an instrument, such as a ruler or kitchen scales, used to read off a measurement.", ["Read the scale to find the mass."]),
   ("right angle", "📐", "A square corner - a quarter turn, exactly a quarter of the way round.", ["Find a right angle in the room."]),
   ("half turn", "🔄", "A turn that makes a straight line - the same amount of turning as two right angles put together.", ["Turn the shape a half turn."]),
  ],
 },
 "time-and-direction": {
  "about": [
   "Tell the time and work out how long something took.",
   "Read a timetable to plan a journey.",
   "Use north, south, east and west to give directions.",
   "Choose the right unit of time for an activity.",
   "Follow and give directions using cardinal points.",
  ],
  "parts": [
   ("Time intervals", "A time interval is how long something lasts, found by counting on from the start time to the end time."),
   ("Timetables", "A timetable sets out times in rows and columns, such as which bus reaches which stop and when - reading it means finding the right row and the right column together."),
   ("Cardinal points and direction", "North, south, east and west never change, whichever way you are facing. Clockwise turns the way a clock's hands move; anticlockwise turns the other way."),
  ],
  "words": [
   ("time interval", "⏳", "How long something lasts, found by counting on from the start time to the end time.", ["Work out the time interval between 3:15 and 4:00."]),
   ("timetable", "🚌", "A list of times set out in rows and columns, such as which bus arrives at which stop and when.", ["Read the timetable to find when the bus arrives."]),
   ("cardinal point", "🗺️", "One of the four main compass directions - north, south, east and west - which never change, whichever way you are facing.", ["Point to north, then name the cardinal point behind you."]),
   ("clockwise", "↻", "Turning the same way the hands of a clock move - from 12 towards 3, then 6, then 9.", ["Turn the shape clockwise."]),
   ("anticlockwise", "↺", "Turning the opposite way to the hands of a clock.", ["Turn the shape anticlockwise."]),
  ],
 },
 "ask-count-chart": {
  "about": [
   "Ask a real question and record the answers with tally marks.",
   "Read a pictogram using its key.",
   "Read a bar chart and say what it shows.",
   "Sort things using a Venn diagram or a Carroll diagram.",
   "Say whether something will, might or will not happen.",
  ],
  "parts": [
   ("Tallying and charting", "A tally chart counts things as they happen, with a mark laid across every fifth one. A bar chart shows the same kind of information as bars - the taller the bar, the bigger the amount."),
   ("Pictograms and their key", "A pictogram uses pictures instead of bars, and its key says how much one picture is worth - without the key, a pictogram cannot be read."),
   ("Venn and Carroll diagrams", "A Venn diagram sorts things using two overlapping circles, and a Carroll diagram sorts the same kind of thing into a grid using two yes/no questions."),
  ],
  "words": [
   ("tally chart", "✏️", "A way of counting things as they happen, using one mark for each one and a mark laid across every fifth one.", ["Keep a tally chart of how many heads you toss."]),
   ("pictogram", "🍎", "A chart that uses pictures to show amounts, where a key says how much each picture is worth.", ["Read the pictogram using its key."]),
   ("bar chart", "📊", "A chart that shows amounts as bars - the taller the bar, the bigger the amount.", ["Build a bar chart of favourite fruits."]),
   ("Venn diagram", "⭕", "Two overlapping circles that sort things by which of two properties they have - the middle holds things with both.", ["Sort the numbers using a Venn diagram."]),
   ("Carroll diagram", "🔲", "A grid that sorts things into boxes using two yes/no questions, one across the top and one down the side.", ["Sort the shapes using a Carroll diagram."]),
   ("key", "🔑", "The part of a pictogram that says how much one picture stands for.", ["Check the key before reading the pictogram."]),
  ],
 },
}


def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def jlit(t):
    return '"' + str(t).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


CSS = """/* %s - see add-lesson-opener.py. Lives in g3-css.css, not a
   per-lesson <style> block - see this tool's own docstring for why. */
  .ovw { width: 100%%; max-width: 34em; margin: 0 auto; text-align: center; }
  .ovw-h { font-size: 19px; margin: 0 0 12px; }
  .ovw-list { margin: 0; padding-left: 26px; display: flex; flex-direction: column; gap: 11px;
    font-size: 19px; text-align: left; }
  .ovw-list li::marker { color: var(--teal); font-weight: 800; }
  .lec, .mw { width: 100%%; max-width: 36em; margin: 0 auto; display: flex; flex-direction: column;
    align-items: center; gap: 10px; text-align: center; }
  .phase { color: var(--teal); font-weight: 800; font-size: 12.5px; letter-spacing: .1em;
    text-transform: uppercase; }
  .lec-h { font-weight: 800; font-size: clamp(21px, 4vw, 26px); margin: 0; }
  .lec-p { margin: 0; font-size: 19px; line-height: 1.55; max-width: 34em; }
  .lec-note { margin: 4px 0 0; color: var(--muted); font-size: 13.5px; }
  .cardsgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 12px;
    width: 100%%; max-width: 640px; }
  .tapcard { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 8px 12px;
    border-radius: 18px; border: 3px solid var(--line); background: var(--card); color: var(--ink);
    font-weight: 800; font-size: 17px; line-height: 1.2; transition: transform 120ms ease, border-color 120ms ease; }
  .tapcard .cpic { font-size: clamp(40px, 8vw, 56px); line-height: 1.1; }
  .tapcard:active { transform: scale(0.96); }
  .tapcard.heard { border-color: var(--teal); background: var(--teal-soft); }
  .tapcard.heard::after { content: "\\2713"; color: var(--good); font-size: 15px; }
  .wordpanel { width: 100%%; max-width: 560px; padding: 16px 18px; border-radius: 20px;
    border: 3px solid var(--teal); background: var(--card); text-align: left; }
  .wp-head { display: flex; align-items: center; gap: 16px; }
  .wp-pic { font-size: 40px; }
  .wp-word { margin: 0; font-weight: 800; font-size: 28px; }
  .wp-meaning { margin: 4px 0 0; font-size: 17.5px; line-height: 1.45; }
  .wp-uses-h { margin: 12px 0 4px; color: var(--teal); font-weight: 800; font-size: 12.5px;
    letter-spacing: .1em; text-transform: uppercase; }
  .wp-uses { margin: 0 0 10px; padding-left: 20px; display: flex; flex-direction: column; gap: 5px;
    font-size: 16.5px; font-style: italic; }
  .wordbtns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .wordbtn { min-width: 118px; padding: 12px 18px; border-radius: 18px; border: 3px solid var(--line);
    background: var(--card); color: var(--ink); font-weight: 800; cursor: pointer; }
  .wordbtn .wbpic { display: block; font-size: 40px; line-height: 1.15; }
  .wordbtn:active { transform: scale(0.96); }
  .wordbtn.right { background: var(--good-soft); border-color: var(--good); }
  .wordbtn.wrong { background: var(--bad-soft); border-color: var(--bad); }
  .wordbtn:disabled { cursor: default; }
""" % MARK


def js_functions():
    return """
  /* ==== %s: three shared step functions, ported from Grade 4's own
     add-lesson-opener.py in the same idiom - data-say for arrival
     narration (show() already speaks it), plain finish(i, msg), no
     ONSHOW/ONLEAVE/reportAttempt. esc() IS OWN, not shared, matching
     every add-*.py tool in this build - see Grade 4's own docstring for
     the ReferenceError this avoids. ==== */
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  function lessonAbout(o) {
    document.getElementById(o.stage).innerHTML =
      '<div class="ovw"><h3 class="ovw-h">By the end of this lesson you will be able to&hellip;</h3>' +
      '<ol class="ovw-list">' + o.about.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ol>' +
      '<div class="bigbtns"><button type="button" class="big small" id="' + o.stage + 'go">Got it, let\\'s begin &#10003;</button></div></div>';
    document.getElementById(o.stage + 'go').addEventListener('click', () => {
      document.getElementById(o.stage + 'go').disabled = true;
      finish(o.finish, o.done);
    });
  }

  function lessonLecture(o) {
    const parts = o.parts || [];
    let k = 0;
    const id = o.stage + 'l';
    function paint() {
      const p = parts[k];
      document.getElementById(o.stage).innerHTML =
        '<div class="lec"><p class="phase">Part ' + (k + 1) + ' of ' + parts.length + '</p>' +
        '<h3 class="lec-h">' + esc(p.title) + '</h3><p class="lec-p">' + esc(p.say) + '</p>' +
        '<div class="bigbtns">' +
        '<button type="button" class="big small teal" id="' + id + 'hear">&#128266; Listen</button>' +
        (k > 0 ? '<button type="button" class="big small ghost" id="' + id + 'back">&#9664; Last part</button>' : '') +
        '<button type="button" class="big small" id="' + id + 'next">' + (k + 1 < parts.length ? 'Next part &#9654;' : 'I heard it all &#10003;') + '</button>' +
        '</div><p class="lec-note">Read aloud by the lesson\\'s voice. There is no video for this lesson yet.</p></div>';
      document.getElementById(id + 'hear').addEventListener('click', () => say(p.title + '. ' + p.say));
      if (k > 0) document.getElementById(id + 'back').addEventListener('click', () => { k--; paint(); say(parts[k].title + '. ' + parts[k].say); });
      document.getElementById(id + 'next').addEventListener('click', () => {
        if (k + 1 < parts.length) { k++; paint(); say(parts[k].title + '. ' + parts[k].say); }
        else { finish(o.finish, o.done); }
      });
    }
    if (!parts.length) return;
    paint();
  }

  function lessonWords(o) {
    const items = o.words || [];
    const heard = new Set();
    let open = -1;
    const id = o.stage + 'w';
    function paintGrid() {
      document.getElementById(o.stage).innerHTML =
        '<div class="cardsgrid" id="' + id + 'g">' + items.map((w, k) =>
          '<button type="button" class="tapcard' + (heard.has(k) ? ' heard' : '') + '" data-k="' + k + '">' +
          '<span class="cpic" aria-hidden="true">' + w.pic + '</span>' + esc(w.w) + '</button>').join('') + '</div>' +
        '<div class="wordpanel" id="' + id + 'p"' + (open < 0 ? ' hidden' : '') + '></div>' +
        '<div class="bigbtns" id="' + id + 'go" style="' + (heard.size === items.length ? '' : 'display:none') + '">' +
        '<button type="button" class="big small" id="' + id + 'quiz">Show I know them &#9654;</button></div>';
      if (open >= 0) paintPanel();
      document.getElementById(id + 'g').addEventListener('click', (e) => {
        const b = e.target.closest('.tapcard'); if (!b) return;
        open = Number(b.dataset.k); heard.add(open);
        paintGrid();
        const w = items[open];
        say(w.w + '. ' + w.meaning + ' ' + (w.uses[0] || ''));
      });
      if (heard.size === items.length) {
        const goBtn = document.getElementById(id + 'quiz');
        if (goBtn) goBtn.addEventListener('click', () => check());
      }
    }
    function paintPanel() {
      const w = items[open];
      const p = document.getElementById(id + 'p');
      p.hidden = false;
      p.innerHTML = '<div class="wp-head"><span class="wp-pic" aria-hidden="true">' + w.pic + '</span>' +
        '<div><p class="wp-word">' + esc(w.w) + '</p><p class="wp-meaning">' + esc(w.meaning) + '</p></div></div>' +
        '<p class="wp-uses-h">Use it</p><ul class="wp-uses">' + (w.uses || []).map((u) => '<li>' + esc(u) + '</li>').join('') + '</ul>' +
        '<div class="bigbtns"><button type="button" class="big small teal" id="' + id + 'h">&#128266; Hear it again</button></div>';
      document.getElementById(id + 'h').addEventListener('click', () => say(w.w + '. ' + w.meaning + ' ' + (w.uses || []).join(' ')));
    }
    function check() {
      const order = shuffle(items.map((_, k) => k));
      let i = 0, right = 0, lock = false;
      function draw() {
        lock = false;
        const k = order[i], w = items[k];
        const others = shuffle(items.map((_, j) => j).filter((j) => j !== k)).slice(0, Math.min(2, items.length - 1));
        const opts = shuffle([k].concat(others));
        document.getElementById(o.stage).innerHTML =
          '<div class="mw"><p class="lec-p">Which word means: <b>' + esc(w.meaning) + '</b></p>' +
          '<div class="wordbtns" id="' + id + 'ch">' + opts.map((j) =>
            '<button type="button" class="wordbtn" data-ok="' + (j === k ? 1 : 0) + '">' +
            '<span class="wbpic" aria-hidden="true">' + items[j].pic + '</span>' + esc(items[j].w) + '</button>').join('') + '</div>' +
          '<p class="lec-note" id="' + id + 'fb"></p></div>';
        say('Which word means: ' + w.meaning);
        document.getElementById(id + 'ch').addEventListener('click', (e) => {
          const b = e.target.closest('.wordbtn'); if (!b || lock) return;
          lock = true;
          const ok = b.dataset.ok === '1';
          document.getElementById(id + 'ch').querySelectorAll('.wordbtn').forEach((c) => { c.disabled = true; if (c.dataset.ok === '1') c.classList.add('right'); });
          if (!ok) b.classList.add('wrong'); else right++;
          const msg = ok ? cheer() + ' ' + w.w + '.' : 'That word is ' + w.w + '. ' + w.meaning;
          document.getElementById(id + 'fb').textContent = msg; say(msg);
          i++;
          setTimeout(() => {
            if (i >= items.length) {
              document.getElementById(o.stage).innerHTML = '<div class="mw"><p class="lec-p">You know ' + right + ' of ' + items.length + ' math words.</p></div>';
              finish(o.finish, o.done);
            } else draw();
          }, 2200);
        });
      }
      draw();
    }
    paintGrid();
  }
""" % MARK


todo, done, refused = [], 0, 0

CFG_PATH = os.path.join(APP_ROOT, "app.config.json")
cfg = json.load(io.open(CFG_PATH, encoding="utf-8"))
explore = list(cfg.get("explorationSteps", []))
new_explore_suffixes = [1, 2, 3]

for slug in sorted(WORK):
    frag = FRAG[slug]
    sp = os.path.join(HERE, frag + "-slides.html")
    cp = os.path.join(HERE, frag + "-content.js")
    s = io.open(sp, encoding="utf-8", newline="").read()
    c = io.open(cp, encoding="utf-8", newline="").read()
    if MARK in s or MARK in c:
        print("  already  %-26s" % slug)
        done += 1
        continue

    m = re.search(r'(<div class="deck" id="deck">\s*)', s)
    anchor_show = "  show(0, false);"
    stk = re.search(r"const STICKERS = \[", c)
    problems = []
    if not m:
        problems.append("no deck container anchor in slides")
    if c.count(anchor_show) != 1:
        problems.append("show(0,false) x%d in content" % c.count(anchor_show))
    if not stk:
        problems.append("no STICKERS shelf in content")
    if problems:
        print("  REFUSED  %-26s %s" % (slug, "; ".join(problems)))
        refused += 1
        continue

    data = WORK[slug]

    # ---- 1. renumber every existing LITERAL finish(N) call by +3 in the
    # content fragment. SLOT-based finish(SLOT, ...) calls (added later, by
    # add-second-steps.py) are untouched on purpose - \d+ never matches
    # "SLOT", and those calls are computed at runtime from the DOM, so they
    # need no renumbering at all.
    def bump(mm):
        return "finish(%d" % (int(mm.group(1)) + 3)
    new_c = re.sub(r"finish\((\d+)", bump, c)

    # ---- 1b. the DISPLAYED step number on every existing slide-head in the
    # slides fragment, shifted the same +3 - check-judging.py's own
    # explorationSteps keys read this exact span ('file.html#N'), and a
    # stale one silently exempts whichever slide now sits at that DISPLAY
    # position rather than the one it was written for (see Grade 4's own
    # add-lesson-opener.py commit history for the incident this caught).
    def bump_n(mm):
        return '<span class="n">%d</span>' % (int(mm.group(1)) + 3)
    new_s = re.sub(r'<span class="n">(\d+)</span>', bump_n, s)

    # ---- 2. the three new slides, inserted right after the deck opens
    about_li = data["about"]
    about_say = "By the end of this lesson you will be able to: " + "; ".join(
        t.rstrip(".").lower() if i > 0 else t.rstrip(".") for i, t in enumerate(about_li)) + "."
    parts_js = ", ".join("{ title: %s, say: %s }" % (jlit(t), jlit(sy)) for t, sy in data["parts"])
    words_js = ", ".join(
        "{ w: %s, pic: %s, meaning: %s, uses: [%s] }"
        % (jlit(w), jlit(pic), jlit(meaning), ", ".join(jlit(u) for u in uses))
        for w, pic, meaning, uses in data["words"]
    )

    new_slides = (
        '<!-- %s: what this lesson is about -->\n'
        '    <section class="slide" data-say=%s>\n'
        '      <div class="slide-head"><span class="n">1</span><h2>What this lesson is about</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="askOvw">%s</span></div>\n'
        '      <div class="stage" id="stageOvw"></div>\n'
        '    </section>\n'
        '    <!-- %s: unit lecture -->\n'
        '    <section class="slide" data-say="Watch the lesson told in parts, by the voice.">\n'
        '      <div class="slide-head"><span class="n">2</span><h2>Unit lecture</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="askLec">Watch the lesson told in parts, by the voice.</span></div>\n'
        '      <div class="stage" id="stageLec"></div>\n'
        '    </section>\n'
        '    <!-- %s: math words -->\n'
        '    <section class="slide" data-say="Tap each word to hear what it means and how to use it. Then show you know them.">\n'
        '      <div class="slide-head"><span class="n">3</span><h2>Math words</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="askMw">Tap each word to hear what it means and how to use it. Then show you know them.</span></div>\n'
        '      <div class="stage" id="stageMw"></div>\n'
        '    </section>\n'
        '    ' % (MARK, jlit(about_say), esc(about_say), MARK, MARK)
    )
    m2 = re.search(r'(<div class="deck" id="deck">\s*)', new_s)
    new_s = new_s[:m2.end()] + new_slides + new_s[m2.end():]

    # ---- 3. the three new STICKERS entries, prepended
    stk2 = re.search(r"const STICKERS = \[", new_c)
    open_i = new_c.index("[", stk2.start())
    new_c = (new_c[:open_i + 1]
             + '["\U0001F50E", "What this lesson is about"], ["\U0001F3A5", "Unit lecture"], ["\U0001F5E3️", "Math words"], '
             + new_c[open_i + 1:])

    # ---- 4. the JS calls that mount the three steps, plus the shared
    # functions, inserted right before show(0, false)
    calls = (
        "\n  lessonAbout({ stage: 'stageOvw', about: [" + ", ".join(jlit(t) for t in about_li)
        + "], finish: 0, done: %s });\n" % jlit("Let's begin.")
        + "  lessonLecture({ stage: 'stageLec', parts: [" + parts_js + "], finish: 1, done: %s });\n"
          % jlit("You have heard the whole lesson. Now do it yourself.")
        + "  lessonWords({ stage: 'stageMw', words: [" + words_js + "], finish: 2, done: %s });\n"
          % jlit("You know the math words of this lesson.")
    )
    new_c = new_c.replace(anchor_show, js_functions() + calls + anchor_show, 1)

    if new_s.count(MARK) < 3 or new_c.count(MARK) < 1:
        print("  REFUSED  %-26s marker count slides=%d content=%d"
              % (slug, new_s.count(MARK), new_c.count(MARK)))
        refused += 1
        continue

    todo.append((sp, new_s, cp, new_c, slug))

    # shift this lesson's own existing exploration-step entries by +3
    # (matching the <span class="n"> shift above), then add the 3 new ones.
    prefix = slug + ".html#"
    for i, entry in enumerate(explore):
        if entry.startswith(prefix):
            suffix = entry[len(prefix):]
            if suffix.isdigit():
                explore[i] = "%s%d" % (prefix, int(suffix) + 3)
    for n in new_explore_suffixes:
        entry = "%s%d" % (prefix, n)
        if entry not in explore:
            explore.append(entry)

    print("  would    %-26s %d about, %d parts, %d words"
          % (slug, len(about_li), len(data["parts"]), len(data["words"])))

CSS_PATH = os.path.join(HERE, "g3-css.css")

if WRITE:
    for sp, new_s, cp, new_c, slug in todo:
        io.open(sp, "w", encoding="utf-8", newline="").write(new_s)
        io.open(cp, "w", encoding="utf-8", newline="").write(new_c)
    if todo:
        css_src = io.open(CSS_PATH, encoding="utf-8").read()
        if MARK not in css_src:
            io.open(CSS_PATH, "w", encoding="utf-8", newline="").write(
                css_src.rstrip() + "\n\n" + CSS)
            print("  g3-css.css :: appended lesson-opener rules")
        cfg_src = io.open(CFG_PATH, encoding="utf-8").read()
        block = ('"explorationSteps": [\n    '
                 + ",\n    ".join('"%s"' % e for e in explore)
                 + "\n  ]")
        cfg_src2 = re.sub(r'"explorationSteps":\s*\[[^\]]*\]', block, cfg_src, count=1)
        assert cfg_src2 != cfg_src, "explorationSteps block not found to replace"
        io.open(CFG_PATH, "w", encoding="utf-8", newline="").write(cfg_src2)
        print("  app.config.json :: explorationSteps -> %d entries" % len(explore))
        print("\n  now run: bash build-all.sh   (from src/, to regenerate the built pages)")
print("\n  %d lesson(s) %s, %d already done, %d refused%s"
      % (len(todo), "written" if WRITE else "to write", done, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
