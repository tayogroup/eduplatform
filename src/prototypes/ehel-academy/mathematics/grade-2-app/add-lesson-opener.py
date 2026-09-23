# -*- coding: utf-8 -*-
"""Three new steps at the FRONT of every lesson, the Grade 4 build's own
"What this lesson is about" / "Unit lecture" / "Math words" pattern, ported
to Grade 2's own idiom - same deck, same finish(i, msg), same STICKERS
shelf, same "no esc() global" rule (see grade-4-app/add-lesson-opener.py's
own docstring for why this file defines its own local esc() rather than
relying on a page-global one).

    python add-lesson-opener.py            # report
    python add-lesson-opener.py --write

WHAT DIFFERS FROM GRADE 4. No lesson here is excluded - all 9 lessons are
in WORK. The sticker for "Math words" is a megaphone, not Grade 4's
speaking-head - which-way-from-here.html's own sticker shelf already uses
a speaking head for "Saying a route", checked against all 9 files' own
STICKERS arrays before picking a replacement.

MATH WORDS SUPERSEDES THE STICKER-SHELF GLOSSARY, same as Grade 4:
add-vocabulary.py's static (term, definition) list is reused as source
text for the words here - a pic and a "use it" sentence are added per
word - and the old panel is removed by this tool.

"ABOUT" CONTENT IS THE LESSON'S OWN SELFCHECK, reworded. Every lesson's
SELFCHECK array already holds Cambridge-aligned "I can..." statements the
child marks on the sticker shelf; the About step turns each into a plain
"you will be able to" line rather than inventing new claims about what the
lesson teaches.

Guarded by a marker; every anchor must match exactly once or the file is
refused rather than half-patched.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g2-lesson-opener"

# lesson -> {
#   about: [str, ...]                         "What this lesson is about"
#   parts: [(title, say), ...]                "Unit lecture" - narrated walkthrough
#   words: [(word, pic, meaning, [use, ...])]  "Math words" - reused from add-vocabulary.py
# }
WORK = {
 "tens-and-ones": {
  "about": [
   "Count up to 100 objects.",
   "Say how many you see without counting them.",
   "Know what each digit means in a 2-digit number.",
   "Round a 2-digit number to the nearest 10.",
   "Use arrays to show multiplication.",
   "Use sharing and grouping to work out a division.",
  ],
  "parts": [
   ("Tens and ones", "A 2-digit number is made of tens and ones - 34 is 3 tens and 4 ones, and each ten is worth ten times as much as a one."),
   ("Rounding", "Rounding to the nearest 10 means finding the nearest multiple of ten - 34 rounds down to 30, because it is closer to 30 than to 40."),
   ("Arrays and sharing", "An array shows multiplication as rows and columns - 2 rows of 5 is the same as 5 lots of 2. Sharing the same total into equal groups is division."),
  ],
  "words": [
   ("digit", "🔢", "One of the ten symbols 0-9 used to write a number - the 4 and the 7 in 47 are both digits.", ["Point to the digit in the tens column of 47."]),
   ("array", "🔲", "Rows and columns of the same size, used to show a multiplication fact.", ["Draw an array to show 2 rows of 5."]),
   ("odd number", "🔵", "A whole number that leaves one left over when put into pairs, like 3, 5 and 7.", ["7 is an odd number."]),
   ("even number", "🔴", "A whole number that splits into pairs exactly, with nothing left over, like 2, 4 and 6.", ["4 is an even number."]),
   ("round", "🎯", "Change a number to the nearest ten, to make it easier to work with.", ["Round 34 to the nearest ten."]),
  ],
 },
 "coins-and-change": {
  "about": [
   "Sort coins and make sets of different values.",
   "Count what is in a purse and say what it is worth.",
   "Combine coins to make different values.",
   "Pay an amount using the fewest pieces.",
   "Work out how much more is needed.",
   "Compare values and put coins in order of value.",
  ],
  "parts": [
   ("Coins and notes", "Coins and notes are worth different amounts - counting money means starting with the biggest value and counting on from there."),
   ("Making an amount", "The same amount of money can be made with different coins - the fewest pieces is usually the biggest coins first, then the smaller ones to finish exactly."),
   ("How much more", "To find how much more is needed, work out the gap between what you have and what you need."),
  ],
  "words": [
   ("coin", "💰", "A round piece of money, like a 5 or 10 shilling coin.", ["Sort the coins by value."]),
   ("note", "💵", "A flat piece of paper money, worth more than most coins.", ["A note is worth more than most coins."]),
   ("value", "🏷️", "How much something is worth in money.", ["Compare the value of two coins."]),
   ("total", "🔢", "The whole amount when you add prices or coins together.", ["Add the coins to find the total."]),
   ("shilling", "👛", "The unit of money used in this lesson, written KSh or sh.", ["Count how many shillings are in the purse."]),
   ("saving", "🏦", "Keeping money instead of spending it, so the amount goes up.", ["Saving a little each week adds up."]),
  ],
 },
 "fair-shares": {
  "about": [
   "Say when parts are equal and when they are not.",
   "Know what the top and bottom numbers of a fraction mean.",
   "Find a fraction of a group of objects.",
   "Name fractions that are worth the same.",
   "Compare two fractions and say which is bigger.",
   "Put fractions on a number line.",
  ],
  "parts": [
   ("Equal parts", "A fraction only works if the parts are equal - cutting unevenly does not make halves or quarters, however many pieces you end up with."),
   ("Top number, bottom number", "The bottom number says how many equal parts the whole is split into, and the top number says how many of those parts you have."),
   ("Fractions worth the same", "Different fractions can be worth exactly the same amount - one half and two quarters cover the same amount of a whole."),
  ],
  "words": [
   ("fraction", "🍕", "A part of a whole, like one half or one quarter.", ["Shade one half of the circle to show the fraction."]),
   ("numerator", "⬆️", "The top number in a fraction - how many equal parts you have.", ["In 3/4, the numerator is 3."]),
   ("denominator", "⬇️", "The bottom number in a fraction - how many equal parts the whole is split into.", ["In 3/4, the denominator is 4."]),
   ("equal parts", "⚖️", "Pieces that are exactly the same size.", ["Cut the paper into four equal parts."]),
   ("equivalent", "🔁", "Worth the same amount, even though the fraction looks different, like one half and two quarters.", ["1/2 and 2/4 are equivalent fractions."]),
   ("whole", "🍎", "One whole thing, before it is cut into parts.", ["Put the pieces back together to make one whole."]),
  ],
 },
 "patterns-that-grow": {
  "about": [
   "Find the part of a pattern that repeats.",
   "Say what comes next in a pattern.",
   "Mend a pattern that has a mistake in it.",
   "Count on in steps of 2, 5 and 10.",
   "Say how much a pattern goes up by each time.",
   "Count back in steps from any number up to 100.",
  ],
  "parts": [
   ("Repeating patterns", "Find the smallest part of a pattern that repeats, and you can say what comes next, however long the pattern runs on."),
   ("Growing patterns", "A growing pattern goes up by the same amount every time - spot that amount, and you can predict every term without drawing it out."),
   ("Counting on and back in steps", "Counting on in steps of 2, 5 or 10 gets you to a big number fast - and counting back in the same steps gets you back again."),
  ],
  "words": [
   ("pattern", "📿", "Shapes or numbers arranged in a way that follows a rule.", ["Spot the pattern: red, blue, red, blue."]),
   ("repeat", "🔁", "The part of a pattern that happens again and again.", ["The part that repeats is red, blue."]),
   ("sequence", "➡️", "A list of numbers that follow one after another, in order.", ["5, 10, 15, 20 is a sequence."]),
   ("rule", "📏", "The idea that tells you how a pattern changes each time.", ["The rule for this sequence is add 5 each time."]),
   ("step", "👣", "How much a sequence of numbers goes up or down by each time.", ["Count on in steps of 5."]),
  ],
 },
 "sides-and-corners": {
  "about": [
   "Count the sides and corners of a 2D shape.",
   "Name 2D shapes and say what is the same about them.",
   "Draw a line of symmetry on a 2D shape.",
   "Name solid shapes and describe their faces.",
   "Describe a turn as a quarter, a half or a whole turn.",
   "Find shapes like these in real things around me.",
  ],
  "parts": [
   ("Sides and corners", "Every 2D shape can be described by counting its sides and its corners - a triangle has 3 of each, a square has 4."),
   ("Symmetry", "A shape has a line of symmetry if you can fold it so both halves match exactly - like a butterfly's wings."),
   ("Turns", "A quarter turn, a half turn and a whole turn are all fractions of one full spin - a whole turn brings you back to exactly where you started."),
  ],
  "words": [
   ("side", "📐", "One of the straight or curved edges of a flat shape.", ["Count the sides of the pentagon."]),
   ("corner", "📍", "The point where two sides of a shape meet.", ["A rectangle has four corners."]),
   ("face", "🎲", "One flat surface of a solid shape, like one side of a cube.", ["A cube has six faces."]),
   ("edge", "📏", "The line where two faces of a solid shape meet.", ["Run your finger along the edge of the cube."]),
   ("symmetry", "🦋", "When one half of a shape is an exact mirror match of the other half.", ["Fold the shape to check for symmetry."]),
   ("clockwise", "↻", "Turning the same way the hands of a clock move.", ["Turn the shape a quarter turn clockwise."]),
  ],
 },
 "which-way-from-here": {
  "about": [
   "Say where something is, using position words.",
   "Tell my left from my right, and someone else's.",
   "Follow directions to get somewhere.",
   "Give directions for someone else to follow.",
   "Complete a symmetrical picture by drawing the other half.",
  ],
  "parts": [
   ("Position words", "Position words like above, below and between say exactly where something is compared to something else."),
   ("Giving and following directions", "A direction like forward or a quarter turn only works if it is said from the mover's own point of view, not the watcher's."),
   ("Reflection", "A reflection is a mirror image, flipped across a line - every point ends up exactly as far from the mirror line as it started, just on the other side."),
  ],
  "words": [
   ("position", "📍", "Where something is, such as above, below or between other things.", ["Say the position of the cat in the picture."]),
   ("direction", "➡️", "The way something is facing or moving, like left, right or forward.", ["Give a direction to get to the flag."]),
   ("forward", "⬆️", "Moving the way you are facing, straight ahead.", ["Move three steps forward."]),
   ("reflection", "🦋", "A mirror image of a shape, flipped over a line.", ["Draw the reflection of the shape."]),
   ("mirror line", "📏", "The line a reflection is flipped across - both sides are the same distance from it.", ["Draw the mirror line down the middle."]),
  ],
 },
 "how-much-how-long": {
  "about": [
   "Compare two lengths and say which is longer.",
   "Measure with the same unit every time.",
   "Measure a length in whole centimetres with a ruler.",
   "Choose the right unit for what I am measuring.",
   "Estimate the mass of an object before measuring it.",
   "Read scales marked in twos, fives and tens.",
  ],
  "parts": [
   ("Measuring length", "Line up the end of the ruler with the start of what you are measuring, and use the same unit all the way along, or the measurement will not mean anything."),
   ("Choosing a unit", "Small things are measured in small units like centimetres, and big things need bigger units - the right unit makes the number sensible."),
   ("Mass and capacity", "Mass is how heavy something is, found on a balance or a scale. Capacity is how much a container can hold, found by filling it up."),
  ],
  "words": [
   ("length", "↔️", "How long something is, measured from one end to the other.", ["Compare the length of two pencils."]),
   ("centimetre", "📏", "A small unit for measuring length, marked on a ruler.", ["Measure the pencil in centimetres."]),
   ("unit", "1️⃣", "The thing you use to measure with, like a cube, a centimetre or a cup.", ["Choose the right unit to measure the table."]),
   ("balance", "⚖️", "A tool with two sides that tips down on the heavier side, used to compare mass.", ["Use the balance to compare two objects."]),
   ("mass", "🐘", "How heavy something is.", ["Estimate the mass of the book before weighing it."]),
   ("capacity", "🥤", "How much a container can hold.", ["Which jug has the bigger capacity?"]),
  ],
 },
 "half-past-quarter-to": {
  "about": [
   "Know what each hand on a clock tells me.",
   "Read quarter past and quarter to.",
   "Read and write the time to the nearest 5 minutes.",
   "Match a clock face to a digital time.",
   "Use and compare units of time.",
   "Use a calendar to find days and months.",
  ],
  "parts": [
   ("The two hands", "The short hand shows the hour and the long hand shows the minutes - read the short hand first, then the long hand."),
   ("Quarter past and quarter to", "Quarter past is fifteen minutes after the hour, and quarter to is fifteen minutes before the next one - the long hand points to the 3 or the 9."),
   ("Digital time and the calendar", "Digital time writes the same moment in numbers, like 3:15, instead of showing it on a clock face. A calendar shows the days of a month in rows of seven."),
  ],
  "words": [
   ("hour", "🕐", "A unit of time - there are 24 in a day, shown by the short hand on a clock.", ["It takes about an hour to read this book."]),
   ("minute", "🕜", "A unit of time - there are 60 in an hour, shown by the long hand on a clock.", ["Wait five minutes for the bus."]),
   ("quarter past", "🕒", "Fifteen minutes after the hour.", ["It is quarter past three."]),
   ("quarter to", "🕡", "Fifteen minutes before the next hour.", ["It is quarter to four."]),
   ("digital time", "⏱️", "Time written in numbers, like 3:15, instead of shown on a clock face.", ["Match the clock face to its digital time."]),
   ("calendar", "📅", "A chart that shows the days of a month, arranged in rows of seven.", ["Find today's date on the calendar."]),
  ],
 },
 "count-it-chart-it": {
  "about": [
   "Sort things into groups and say what my rule was.",
   "Record what people say using tally marks.",
   "Read a pictogram, using its key.",
   "Answer questions about Venn diagrams and Carroll diagrams.",
   "Describe what a block graph shows.",
   "Say how likely something is to happen.",
  ],
  "parts": [
   ("Sorting and tallying", "Sorting things into groups needs one clear rule, and a tally mark is a quick way to keep count as you go, with every fifth mark crossing the other four."),
   ("Charts and pictograms", "A block graph uses one block for each answer, and a pictogram uses a picture instead - both let you compare groups at a glance."),
   ("Likely or random", "Something regular follows a pattern you can predict. Something random has no pattern at all, so you cannot know what comes next."),
  ],
  "words": [
   ("tally", "📝", "A quick way to keep count using marks, with every fifth mark crossing the other four.", ["Keep a tally of how many heads you toss."]),
   ("pictogram", "🖼️", "A chart that uses pictures to show how many of something there are.", ["Read the pictogram using its key."]),
   ("Carroll diagram", "🗂️", "A grid that sorts things by two labels at once, such as red and round.", ["Sort the shapes on a Carroll diagram."]),
   ("block graph", "📶", "A chart that uses one block for each thing, so you can count the blocks to answer.", ["Build a block graph of favourite fruits."]),
   ("regular", "🔁", "A pattern that repeats in the same way over and over.", ["A regular pattern is easy to predict."]),
   ("random", "🎲", "Something with no pattern, so you cannot know what comes next.", ["A coin toss is random."]),
  ],
 },
}


def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def jlit(t):
    return '"' + str(t).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


CSS = """<style>/* %s - see add-lesson-opener.py */
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
  .lec.lec-film { max-width: 760px; }
  .lec-film video { width: 100%%; display: block; border-radius: 18px; background: #000;
    aspect-ratio: 16 / 9; box-shadow: var(--shadow); }
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
</style>
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

  /* A lesson WITH a film plays it here, as Science's lecture() does where
     LESSON["video"] names one, and the step is done when the film ends. Leaving
     the step pauses it: show() only swaps the active class, so a hidden slide
     would otherwise go on talking under the next step. */
  function lessonFilm(o) {
    const v = o.video, stage = document.getElementById(o.stage);
    stage.innerHTML = '<div class="lec lec-film">' +
      '<video controls playsinline preload="none" poster="' + esc(v.poster) + '" src="' + esc(v.src) + '">' +
      '<track kind="captions" srclang="en" label="English" src="' + esc(v.vtt) + '"></video>' +
      '<p class="lec-note">' + esc(v.note) + '</p></div>';
    const film = stage.querySelector('video'), slide = stage.closest('section.slide');
    film.addEventListener('ended', () => finish(o.finish, o.done));
    if (slide && window.MutationObserver) new MutationObserver(() => {
      if (!slide.classList.contains('active') && !film.paused) film.pause();
    }).observe(slide, { attributes: true, attributeFilter: ['class'] });
  }

  function lessonLecture(o) {
    if (o.video) return lessonFilm(o);
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


pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack|audit|^_|-body\.html$", f))
todo, done, refused, skipped = [], 0, 0, 0

CFG_PATH = os.path.join(HERE, "app.config.json")
cfg = json.load(io.open(CFG_PATH, encoding="utf-8"))
explore = list(cfg.get("explorationSteps", []))
# same honest-registration call as Grade 4: Math words DOES judge, in its
# closing quiz, but that markup does not exist until the JS runs, so the
# static check-judging.py scanner cannot see it. Registered as exploration
# anyway rather than chasing a static marker through per-lesson id
# collisions for a scanner that was never going to read runtime-generated
# markup regardless of what the id said.
new_explore_suffixes = [1, 2, 3]
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %-26s" % slug)
        done += 1
        continue

    m = re.search(r'(<div class="deck" id="deck" role="main">\s*)', s)
    if not m:
        print("  REFUSED  %-26s no deck container anchor" % slug)
        refused += 1
        continue
    anchor_show = "  show(0, false);"
    if s.count(anchor_show) != 1:
        print("  REFUSED  %-26s show(0,false) x%d" % (slug, s.count(anchor_show)))
        refused += 1
        continue
    stk = re.search(r"const STICKERS = \[", s)
    if not stk:
        print("  REFUSED  %-26s no STICKERS shelf" % slug)
        refused += 1
        continue

    data = WORK[slug]

    # ---- 1. renumber every existing finish(N) call by +3, BEFORE inserting
    # our own (which use hardcoded 0/1/2 and must not be touched by this).
    def bump(mm):
        return "finish(%d" % (int(mm.group(1)) + 3)
    out = re.sub(r"finish\((\d+)", bump, s)

    # ---- 1b. the DISPLAYED step number on every existing slide-head,
    # shifted the same +3 - check-judging.py's own explorationSteps keys
    # read this exact span ('file.html#N'), and a stale one silently
    # exempts whichever slide now sits at that DISPLAY position rather than
    # the one it was written for (see Grade 4's own add-lesson-opener.py
    # commit history for the incident this caught).
    def bump_n(mm):
        return '<span class="n">%d</span>' % (int(mm.group(1)) + 3)
    out = re.sub(r'<span class="n">(\d+)</span>', bump_n, out)

    # ---- 2. the three new slides, inserted right after the deck opens
    about_li = data["about"]
    about_say = "By the end of this lesson you will be able to: " + "; ".join(
        t.rstrip(".").lower() if i > 0 else t.rstrip(".") for i, t in enumerate(about_li)) + "."
    # A lesson with a film plays it in this step instead of the parts
    # (grade-4-app: shape-and-measures). Same shape, same keys.
    video_js = ("" if not data.get("video") else ", video: { " + ", ".join(
        "%s: %s" % (k, jlit(data["video"][k])) for k in ("src", "poster", "vtt", "note")) + " }")
    parts_js = ", ".join("{ title: %s, say: %s }" % (jlit(t), jlit(sy)) for t, sy in data["parts"])
    words_js = ", ".join(
        "{ w: %s, pic: %s, meaning: %s, uses: [%s] }"
        % (jlit(w), jlit(pic), jlit(meaning), ", ".join(jlit(u) for u in uses))
        for w, pic, meaning, uses in data["words"]
    )

    new_slides = (
        '<!-- STEP 0a: what this lesson is about -->\n'
        '    <section class="slide" data-say=%s>\n'
        '      <div class="slide-head"><span class="n">1</span><h2>What this lesson is about</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="askOvw">%s</span></div>\n'
        '      <div class="stage" id="stageOvw"></div>\n'
        '    </section>\n'
        '    <!-- STEP 0b: unit lecture -->\n'
        '    <section class="slide" data-say="Watch the lesson told in parts, by the voice.">\n'
        '      <div class="slide-head"><span class="n">2</span><h2>Unit lecture</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="askLec">Watch the lesson told in parts, by the voice.</span></div>\n'
        '      <div class="stage" id="stageLec"></div>\n'
        '    </section>\n'
        '    <!-- STEP 0c: math words -->\n'
        '    <section class="slide" data-say="Tap each word to hear what it means and how to use it. Then show you know them.">\n'
        '      <div class="slide-head"><span class="n">3</span><h2>Math words</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="askMw">Tap each word to hear what it means and how to use it. Then show you know them.</span></div>\n'
        '      <div class="stage" id="stageMw"></div>\n'
        '    </section>\n'
        '    ' % (jlit(about_say), esc(about_say))
    )
    if data.get("video"):
        # the step shows a film, so it must not say it is read in parts
        assert new_slides.count("Watch the lesson told in parts, by the voice.") == 2
        new_slides = new_slides.replace("Watch the lesson told in parts, by the voice.",
                                        "Watch the lesson film. When it ends, this step is done.")

    m2 = re.search(r'(<div class="deck" id="deck" role="main">\s*)', out)
    out = out[:m2.end()] + new_slides + out[m2.end():]

    # ---- 3. the three new STICKERS entries, prepended. A megaphone for
    # "Math words", not Grade 4's speaking-head - which-way-from-here.html's
    # own sticker shelf already uses a speaking head for "Saying a route";
    # checked against every one of these 9 files' STICKERS before picking
    # the replacement.
    stk2 = re.search(r"const STICKERS = \[", out)
    open_i = out.index("[", stk2.start())
    out = (out[:open_i + 1]
           + '["\U0001F50E", "What this lesson is about"], ["\U0001F3A5", "Unit lecture"], ["\U0001F4E3", "Math words"], '
           + out[open_i + 1:])

    # ---- 4. the JS calls that mount the three steps, plus the shared
    # functions, inserted right before show(0, false)
    calls = (
        "\n  lessonAbout({ stage: 'stageOvw', about: [" + ", ".join(jlit(t) for t in about_li)
        + "], finish: 0, done: %s });\n" % jlit("Let's begin.")
        + "  lessonLecture({ stage: 'stageLec', parts: [" + parts_js + "]" + video_js + ", finish: 1, done: %s });\n"
          % jlit("You have heard the whole lesson. Now do it yourself.")
        + "  lessonWords({ stage: 'stageMw', words: [" + words_js + "], finish: 2, done: %s });\n"
          % jlit("You know the math words of this lesson.")
    )
    out = out.replace(anchor_show, js_functions() + calls + anchor_show, 1)

    # ---- 5. remove the superseded static glossary panel (add-vocabulary.py),
    # if present - the new Math words step replaces it.
    voc_mark = "ehel-vocabulary" if "ehel-vocabulary" in out else None
    if voc_mark:
        out = re.sub(r'\n\s*<div id="vocab"></div>', "", out, count=1)
        out = re.sub(r"\n\s*/\* ==== " + voc_mark + r": Math Words.*?\n(?:.*\n)*?\s*\}\)\(\);\n", "\n", out, count=1)
        out = re.sub(r'<style>/\* ' + voc_mark + r" - see add-vocabulary\.py \*/\n(?:.*\n)*?</style>\n", "", out, count=1)

    out = out.rstrip() + "\n\n" + CSS

    if out.count(MARK) < 2:
        print("  REFUSED  %-26s marker count %d" % (slug, out.count(MARK)))
        refused += 1
        continue

    todo.append((p, out, slug))

    # shift this lesson's own existing exploration-step entries by +3
    # (matching the <span class="n"> shift above), then add the 3 new ones.
    prefix = f + "#"
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

if WRITE:
    for p, out, slug in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
    if todo:
        cfg_src = io.open(CFG_PATH, encoding="utf-8").read()
        block = ('"explorationSteps": [\n    '
                 + ",\n    ".join('"%s"' % e for e in explore)
                 + "\n  ]")
        cfg_src2 = re.sub(r'"explorationSteps":\s*\[[^\]]*\]', block, cfg_src, count=1)
        assert cfg_src2 != cfg_src, "explorationSteps block not found to replace"
        io.open(CFG_PATH, "w", encoding="utf-8", newline="").write(cfg_src2)
        print("  app.config.json :: explorationSteps -> %d entries" % len(explore))
print("\n  %d lesson(s) %s, %d already done, %d skipped, %d refused%s"
      % (len(todo), "written" if WRITE else "to write", done, skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
