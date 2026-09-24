# -*- coding: utf-8 -*-
"""Three new steps at the FRONT of every lesson, the Grade 4 build's own
"What this lesson is about" / "Unit lecture" / "Math words" pattern, ported
to Grade 1's own idiom - same deck, same finish(i, msg), same STICKERS
shelf, same "no esc() global" rule (see grade-4-app/add-lesson-opener.py's
own docstring for why this file defines its own local esc() rather than
relying on a page-global one).

    python add-lesson-opener.py            # report
    python add-lesson-opener.py --write

WHAT DIFFERS FROM GRADE 4. No lesson here is excluded - Grade 1 has no
lecture-film integration to collide with, so all 7 lessons are in WORK.
The sticker for "What this lesson is about" is a magnifying glass (see
below), not Grade 4's clipboard - asking-and-sorting.html already uses a
clipboard for "I can fill a table", checked against all 7 files' own
STICKERS arrays before picking a replacement.

MATH WORDS SUPERSEDES THE STICKER-SHELF GLOSSARY, same as Grade 4:
add-vocabulary.py's static (term, definition) list is reused as source
text for the words here - a pic and a "use it" sentence are added per
word, pitched at the same six-year-old register add-vocabulary.py's own
docstring describes - and the old panel is removed by this tool.

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

MARK = "ehel-g1-lesson-opener"

# lesson -> {
#   about: [str, ...]                         "What this lesson is about"
#   parts: [(title, say), ...]                "Unit lecture" - narrated walkthrough
#   words: [(word, pic, meaning, [use, ...])]  "Math words" - reused from add-vocabulary.py
# }
WORK = {
 "counting-to-twenty": {
  "video": {
   "src": "lecture-video/counting-to-twenty.0b26623a.mp4",
   "poster": "lecture-video/counting-to-twenty.d158b857.jpg",
   "vtt": "lecture-video/counting-to-twenty.491a7d44.vtt",
   "note": "The whole lesson in about 2 and a half minutes. When the film ends, this step is done.",
  },
  "about": [
   "Count up to 20 things, touching each one once.",
   "Say how many you see without counting them.",
   "Count in twos and in tens.",
   "Say whether a number is odd or even.",
   "Read and write numbers up to 20.",
   "Put numbers in order and say which is more.",
  ],
  "parts": [
   ("Counting carefully", "Touch each thing once as you count it, so you never count the same one twice or miss one out."),
   ("Seeing without counting", "Some small groups you can just see, without counting one by one - three dots in a triangle is still three, at a glance."),
   ("Odd and even", "Pair the things up. If every one has a partner, the number is even. If one is left over, it is odd."),
  ],
  "words": [
   ("odd number", "🔵", "A number that always has one left over when you pair it up.", ["7 is an odd number - pair them up and one is left over."]),
   ("even number", "🔴", "A number that pairs up exactly, with nobody left out.", ["8 is an even number - four pairs, nobody left out."]),
   ("zero", "0️⃣", "The number for none at all.", ["Zero beans means there are none at all."]),
   ("ordinal number", "🥇", "A number that says where something is in a line, like first or second.", ["The winner is first, an ordinal number."]),
   ("estimate", "🎲", "A sensible guess you make before you count.", ["Estimate how many beans are in the jar before you count them."]),
   ("number line", "📏", "A line of numbers in order, so you can see which one is bigger.", ["Find 12 and 15 on the number line and say which is bigger."]),
  ],
 },
 "adding-and-taking-away": {
  "video": {
   "src": "lecture-video/adding-and-taking-away.04bbb06a.mp4",
   "poster": "lecture-video/adding-and-taking-away.bdfe222a.jpg",
   "vtt": "lecture-video/adding-and-taking-away.a17a3941.vtt",
   "note": "The whole lesson in about 2 and a half minutes. When the film ends, this step is done.",
  },
  "about": [
   "Put two groups together to add them.",
   "Take away by counting back.",
   "Find how many more one group has than another.",
   "Know the pairs of numbers that make 10.",
   "Know your doubles up to double 10.",
   "Name the coins we use.",
  ],
  "parts": [
   ("Adding", "Putting two groups together and counting them all makes an addition - if you have 4 and 3 more, count on from 4: 5, 6, 7."),
   ("Taking away and counting back", "Start at the bigger number and count backwards to take some away - start at 8, count back 3, land on 5."),
   ("Bonds to 10 and doubles", "Two numbers that add together to make 10 are a number bond - 6 and 4 make 10. A double is the same amount again, like 3 and 3 more."),
  ],
  "words": [
   ("add", "➕", "Put two groups together to find out how many there are altogether.", ["Add 4 counters and 3 counters together."]),
   ("take away", "➖", "Start with a group and remove some of it.", ["Take away 3 counters from a group of 8."]),
   ("double", "2️⃣", "The same amount again, like 3 and 3 more.", ["Double 5 is 10."]),
   ("number bond", "🔗", "Two numbers that add together to make ten.", ["6 and 4 are a number bond to ten."]),
   ("count back", "⏪", "Start at a number and count backwards to take some away.", ["Count back 3 from 8 to take some away."]),
   ("shilling", "💰", "The money we count in. We write it as sh for short.", ["Two shillings and three more make five shillings."]),
  ],
 },
 "halves-and-wholes": {
  "video": {
   "src": "lecture-video/halves-and-wholes.bf84e13c.mp4",
   "poster": "lecture-video/halves-and-wholes.411081d0.jpg",
   "vtt": "lecture-video/halves-and-wholes.cbccd10b.vtt",
   "note": "The whole lesson in about 2 minutes. When the film ends, this step is done.",
  },
  "about": [
   "Know that a half means two parts of the same size.",
   "Colour one half of a shape.",
   "Find half of a group of things.",
   "Work out half of a number.",
   "Know that two halves make one whole.",
  ],
  "parts": [
   ("Equal parts", "A half is one of two parts that are exactly the same size - not just nearly the same. Cutting fairly is what makes a half a half."),
   ("Half of a group", "To find half of a group, share it into two equal groups and count how many are in one group."),
   ("Two halves make a whole", "Put the two halves back together and you have the whole again, with nothing missing and nothing extra."),
  ],
  "words": [
   ("equal", "⚖️", "Exactly the same size, not just nearly the same.", ["Cut the sandwich into two equal parts."]),
   ("half", "🌓", "One of two equal parts.", ["Colour one half of the circle."]),
   ("whole", "🍎", "All of a shape, with no parts missing or taken away.", ["Two halves put together make one whole apple."]),
   ("share", "🤝", "Give things out so that everyone gets the same amount.", ["Share 6 beans fairly between two people."]),
   ("fair", "👫", "The same for everyone, like two parts the same size.", ["A fair share means both people get the same amount."]),
   ("halve", "✂️", "Find half of a number or a shape.", ["Halve 10 beans between two friends."]),
  ],
 },
 "what-comes-next": {
  "video": {
   "src": "lecture-video/what-comes-next.191e90a8.mp4",
   "poster": "lecture-video/what-comes-next.5d8edf96.jpg",
   "vtt": "lecture-video/what-comes-next.bbfa8b47.vtt",
   "note": "The whole lesson in about 2 minutes. When the film ends, this step is done.",
  },
  "about": [
   "Say what comes next in a pattern.",
   "Find the part of a pattern that repeats.",
   "Fill in a missing number in a sequence.",
   "Carry on a jumping pattern.",
   "Find the missing number in an adding sentence.",
   "Tell when two sides are the same.",
  ],
  "parts": [
   ("Patterns that repeat", "A pattern is something that happens again and again in the same order - spot the part that repeats, and you can say what comes next."),
   ("Jump patterns", "A jump pattern is a pattern in numbers where you go up by the same amount each time, like 2, 4, 6, 8."),
   ("The equals sign", "The equals sign means both sides have the same amount - it is not just \"here comes the answer\"."),
  ],
  "words": [
   ("pattern", "📿", "Something that happens again and again in the same order.", ["Spot the pattern: red, blue, red, blue."]),
   ("repeat", "🔁", "Do the same small part over and over again.", ["The part that repeats is spoon, cup."]),
   ("jump pattern", "🐸", "A pattern where the numbers go up by the same amount each time.", ["2, 4, 6, 8 is a jump pattern going up by 2."]),
   ("equals sign", "⚖️", "Means both sides have the same amount, not \"here comes the answer\".", ["3 + 4 equals 7 - both sides are the same amount."]),
   ("number machine", "🤖", "Something that does the same thing to every number that goes in.", ["The number machine adds 2 to every number that goes in."]),
   ("growing pattern", "🌱", "A pattern where each part gets bigger by the same amount every time.", ["1, 2, 3, 4 counters in a row is a growing pattern."]),
  ],
 },
 "shapes-and-sizes": {
  "video": {
   "src": "lecture-video/shapes-and-sizes.a6e63fad.mp4",
   "poster": "lecture-video/shapes-and-sizes.b0822f4a.jpg",
   "vtt": "lecture-video/shapes-and-sizes.69e76f3f.vtt",
   "note": "The whole lesson in about 2 and a half minutes. When the film ends, this step is done.",
  },
  "about": [
   "Name flat shapes and say how many sides they have.",
   "Name solid shapes and count their faces.",
   "Tell a flat shape from a solid shape.",
   "Say which of two things is longer.",
   "Say which of two things is heavier.",
   "Say which container holds more.",
  ],
  "parts": [
   ("Flat and solid shapes", "A flat shape lies on the page, like a circle or a square. A solid shape you can pick up and turn over, like a ball or a box."),
   ("Sides, corners and faces", "A side is an edge of a flat shape, and a corner is where two sides meet. A solid shape has faces instead - flat surfaces you can count."),
   ("Comparing size", "Line two things up to see which is longer. Hold two things to feel which is heavier. Pour water from one cup to another to see which holds more."),
  ],
  "words": [
   ("side", "📐", "A straight or curved edge of a flat shape.", ["Count the sides of the triangle."]),
   ("corner", "📍", "The point where two sides of a shape meet.", ["A square has four corners."]),
   ("face", "🎲", "A flat surface on a solid shape.", ["A dice has six faces."]),
   ("edge", "📏", "The line where two faces of a solid shape meet.", ["Run your finger along the edge of the box."]),
   ("capacity", "🥤", "How much a container can hold.", ["Which cup has the bigger capacity?"]),
   ("balance", "⚖️", "A tool that shows which of two things is heavier.", ["Use the balance to see which is heavier."]),
  ],
 },
 "days-months-and-clocks": {
  "video": {
   "src": "lecture-video/days-months-and-clocks.990f0aab.mp4",
   "poster": "lecture-video/days-months-and-clocks.300cf325.jpg",
   "vtt": "lecture-video/days-months-and-clocks.691dfcab.vtt",
   "note": "The whole lesson in about 2 minutes. When the film ends, this step is done.",
  },
  "about": [
   "Name the 7 days of the week in order.",
   "Name the 12 months of the year.",
   "Say whether something takes a short time or a long time.",
   "Read a clock at o'clock.",
   "Read a clock at half past.",
  ],
  "parts": [
   ("Days and months", "There are 7 days in a week, from Monday round to Sunday, and 12 months in a year, from January to December."),
   ("Short times and long times", "Some things take a short time, like a blink. Some things take a long time, like a whole day at school."),
   ("O'clock and half past", "At o'clock, the long hand points straight up to twelve. At half past, the long hand points straight down to six."),
  ],
  "words": [
   ("hour hand", "🕐", "The short hand on a clock. It tells you the hour.", ["The hour hand points to the 3."]),
   ("minute hand", "🕜", "The long hand on a clock. It tells you how far through the hour you are.", ["The minute hand points straight up at o'clock."]),
   ("o'clock", "🕛", "When the long hand points straight up to twelve.", ["It is three o'clock."]),
   ("half past", "🕡", "When the long hand points straight down to six.", ["It is half past three."]),
   ("week", "📅", "Seven days, from Monday round to Sunday.", ["There are seven days in a week."]),
   ("year", "🗓️", "Twelve months, from January to December.", ["There are twelve months in a year."]),
  ],
 },
 "asking-and-sorting": {
  "video": {
   "src": "lecture-video/asking-and-sorting.977d284c.mp4",
   "poster": "lecture-video/asking-and-sorting.505401f2.jpg",
   "vtt": "lecture-video/asking-and-sorting.29f9a35d.vtt",
   "note": "The whole lesson in about 2 and a half minutes. When the film ends, this step is done.",
  },
  "about": [
   "Ask everyone a question and collect the answers.",
   "Put answers into a list and a table.",
   "Build a block graph and read it.",
   "Read a pictogram.",
   "Sort things on a Venn diagram or a Carroll diagram.",
   "Say what the answers tell us.",
  ],
  "parts": [
   ("Asking and collecting", "Ask everyone the same question, and write each answer down as you go so none are lost or counted twice."),
   ("Tables, graphs and pictograms", "A table writes the answers down with a number next to each one. A block graph shows the same answers as towers of blocks. A pictogram uses a little picture instead of a block."),
   ("Sorting with diagrams", "A Venn diagram uses two hoops that cross over, for sorting things by two rules at once. A Carroll diagram uses four boxes instead, with yes and no."),
  ],
  "words": [
   ("table", "📋", "A short way to write answers down, with a number next to each one.", ["Write the answers in a table."]),
   ("block graph", "📶", "Towers of blocks. Each block stands for one answer.", ["Build a block graph of favourite fruits."]),
   ("pictogram", "🖼️", "Like a block graph, but with a little picture instead of a block.", ["Read the pictogram to see how many chose apples."]),
   ("Venn diagram", "🔗", "Two hoops that cross over, for sorting things by two rules at once.", ["Sort the shapes using a Venn diagram."]),
   ("Carroll diagram", "🗂️", "Four boxes for sorting things by two rules, using yes and no.", ["Sort the numbers using a Carroll diagram."]),
   ("hoop", "⭕", "A ring that holds everything which follows one rule.", ["Put all the red shapes inside the hoop."]),
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

    # ---- 3. the three new STICKERS entries, prepended. A magnifying glass
    # for "about", not Grade 4's clipboard - asking-and-sorting.html's own
    # sticker shelf already uses a clipboard for "I can fill a table";
    # checked against every one of these 7 files' STICKERS before picking
    # the replacement.
    stk2 = re.search(r"const STICKERS = \[", out)
    open_i = out.index("[", stk2.start())
    out = (out[:open_i + 1]
           + '["\U0001F50E", "What this lesson is about"], ["\U0001F3A5", "Unit lecture"], ["\U0001F5E3️", "Math words"], '
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
    voc_mark = "ehel-g1-vocabulary" if "ehel-g1-vocabulary" in out else None
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
