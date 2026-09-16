# -*- coding: utf-8 -*-
"""Cambridge's end-of-unit self-check - "What can I do?" - on the sticker shelf.

    python add-self-check.py            # report
    python add-self-check.py --write

WHY. Every one of the 18 Stage 2 Workbook units closes the same way: a page
headed **Self-check - See how much you know!**, a three-way scale, and a list of
"I can..." statements the learner marks for themselves.

    I can do this.
    I can do this, but need to keep trying.
    I can't do this yet.

THE WORDING IS CAMBRIDGE'S. The statements below are the Stage 2 Workbook's own,
trimmed to one clause a seven-year-old reads in one breath - "I can use arrays
to show multiplication", "I can round a 2-digit number to the nearest 10", "I can
read scales marked in twos, fives and tens". They are not Stage 1's reworded: at
Stage 1 the same page says "count up to 20 things", and here it says 100.

The build had nothing of the kind. It ends on a sticker shelf, which says what a
child FINISHED, and finishing a step is not the same claim as being able to do
the thing. Cambridge asks the child; so does this.

WHY IT IS NOT A STEP, AND THAT IS THE POINT. Every step added to this build
since 2026-09-11 has cost the same thing: progress is recorded by step POSITION,
so a new step reopens the check for every child who had finished the lesson.
This one goes on the sticker shelf - the last slide, which already exists - so
not one position moves, no sticker is added, and no check index changes. A child
mid-course sees it appear with nothing else disturbed.

It also keeps the judging gate honest without an exemption: the shelf carries a
star badge rather than a number, so check-judging.py does not count it as a
teaching slide at all. A self-check has no right answer and must never be scored
- nothing here is stored as a result, reported to the school, or gated on.

THE ROUTE BACK IS THE USEFUL HALF. A child who marks "not yet" is offered the
step that teaches it, by name, with a button that goes there. That is what makes
this more than a feelings survey.

STEP NUMBERS ARE RESOLVED FROM THE PAGE, never listed here. Each statement names
the TITLE of the step it points at and this tool finds its index, refusing if a
title is not on the page. A table of numbers would be a second copy of something
the page already knows, and the tools written earlier today got exactly that
wrong once already.

WHAT IT STORES, AND WHERE. The child's three-way answer per statement, in
localStorage under one key per lesson, so it survives a reload and a child can
change their mind. It is per browser and reaches nobody: the school's gradebook
is for work that was measured, and this is a six-year-old's opinion of
themselves.

Guarded by a marker; every anchor must match exactly once or the file is
refused. Written with the Write tool, never a heredoc (backslashes).
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
# Grade 2 keeps its lessons in the app root, where Grade 1 has a g1v2/ subfolder
G = HERE
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-self-check"

# (statement, the TITLE of the step that teaches it). Cambridge's register:
# first person, one skill each, and the thing itself rather than the activity.
PLAN = {
    "tens-and-ones.html": [
        ("I can count up to 100 objects.", "Numbers to 100"),
        ("I can say how many I see without counting them.", "A quick look"),
        ("I know what each digit means in a 2-digit number.", "Build it with tens and ones"),
        ("I can round a 2-digit number to the nearest 10.", "Round to the nearest 10"),
        ("I can use arrays to show multiplication.", "Arrays: 2s, 5s and 10s"),
        ("I can use sharing and grouping to work out a division.", "Sharing and grouping"),
    ],
    "coins-and-change.html": [
        ("I can sort coins and make sets of different values.", "Know your money"),
        ("I can count what is in a purse and say what it is worth.", "Count what is in the purse"),
        ("I can combine coins to make different values.", "Make this exact amount"),
        ("I can pay an amount using the fewest pieces.", "The fewest pieces"),
        ("I can work out how much more is needed.", "How much more?"),
        ("I can compare values and put coins in order of value.", "Which purse is worth more?"),
    ],
    "fair-shares.html": [
        ("I can say when parts are equal and when they are not.", "Equal parts first"),
        ("I know what the top and bottom numbers of a fraction mean.", "Top number, bottom number"),
        ("I can find a fraction of a group of objects.", "A fraction of a group"),
        ("I can name fractions that are worth the same.", "Same size, different name"),
        ("I can compare two fractions and say which is bigger.", "Which is bigger?"),
        ("I can put fractions on a number line.", "On the number line"),
    ],
    "patterns-that-grow.html": [
        ("I can find the part of a pattern that repeats.", "The part that repeats"),
        ("I can say what comes next in a pattern.", "What comes next?"),
        ("I can mend a pattern that has a mistake in it.", "Mend the pattern"),
        ("I can count on in steps of 2, 5 and 10.", "Counting on in steps"),
        ("I can say how much a pattern goes up by each time.", "How does it go up?"),
        ("I can count back in steps from any number up to 100.", "Counting back in steps"),
    ],
    "sides-and-corners.html": [
        ("I can count the sides and corners of a 2D shape.", "Sides and corners"),
        ("I can name 2D shapes and say what is the same about them.", "Name the shape"),
        ("I can draw a line of symmetry on a 2D shape.", "Does it fold in half?"),
        ("I can name solid shapes and describe their faces.", "Solid shapes"),
        ("I can describe a turn as a quarter, a half or a whole turn.", "Turning"),
        ("I can find shapes like these in real things around me.", "Shapes in real things"),
    ],
    "which-way-from-here.html": [
        ("I can say where something is, using position words.", "Saying where"),
        ("I can tell my left from my right, and someone else's.", "Whose left is it?"),
        ("I can follow directions to get somewhere.", "Drive it to the flag"),
        ("I can give directions for someone else to follow.", "Say the route"),
        ("I can complete a symmetrical picture by drawing the other half.", "Over the mirror line"),
    ],
    "how-much-how-long.html": [
        ("I can compare two lengths and say which is longer.", "Longer and shorter"),
        ("I can measure with the same unit every time.", "Measure with cubes"),
        ("I can measure a length in whole centimetres with a ruler.", "Reading a ruler"),
        ("I can choose the right unit for what I am measuring.", "Which unit?"),
        ("I can estimate the mass of an object before measuring it.", "Reading a kitchen scale"),
        ("I can read scales marked in twos, fives and tens.", "Between the marks"),
    ],
    "half-past-quarter-to.html": [
        ("I know what each hand on a clock tells me.", "The two hands"),
        ("I can read quarter past and quarter to.", "Quarter past, quarter to"),
        ("I can read and write the time to the nearest 5 minutes.", "Counting round in fives"),
        ("I can match a clock face to a digital time.", "Clock face and digital"),
        ("I can use and compare units of time.", "Seconds to years"),
        ("I can use a calendar to find days and months.", "Days, months, calendar"),
    ],
    "count-it-chart-it.html": [
        ("I can sort things into groups and say what my rule was.", "Sort them into groups"),
        ("I can record what people say using tally marks.", "Tally charts"),
        ("I can read a pictogram, using its key.", "Pictograms"),
        ("I can answer questions about Venn diagrams and Carroll diagrams.", "Sorting two ways"),
        ("I can describe what a block graph shows.", "Reading a block graph"),
        ("I can say how likely something is to happen.", "Regular or random?"),
    ],
}

HEAD = ("Self-check", "See how much you know")
SCALE = [("yes", "I can do this"), ("trying", "I can do this, but need to keep trying"),
         ("notyet", "I cannot do this yet")]

CSS = """  .sc-wrap { margin: 22px auto 0; max-width: 620px; text-align: left; }
  .sc-head { font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 22px; color: var(--ink);
    margin: 0 0 2px; }
  .sc-sub { margin: 0 0 14px; font-size: 17px; color: var(--muted); }
  .sc-item { border-top: 2px solid var(--line); padding: 12px 0 10px; }
  .sc-say { margin: 0 0 8px; font-size: 19px; line-height: 1.35; color: var(--ink); }
  .sc-opts { display: flex; flex-wrap: wrap; gap: 8px; }
  .sc-opts button { font-family: "Inter", "Segoe UI", sans-serif; font-size: 15px; font-weight: 700;
    padding: 9px 14px; min-height: 44px; border-radius: 12px; border: 2px solid var(--line);
    background: var(--card); color: var(--ink); cursor: pointer; }
  .sc-opts button[aria-pressed="true"] { background: var(--teal); border-color: var(--teal); color: #06231F; }
  .sc-back { margin: 9px 0 0; }
  .sc-back button { font-family: "Inter", "Segoe UI", sans-serif; font-size: 15px; font-weight: 700;
    padding: 8px 14px; min-height: 44px; border-radius: 12px; border: 2px dashed var(--accent);
    background: transparent; color: var(--ink); cursor: pointer; }
"""


def js(lesson, rows):
    items = ",\n".join('    { say: "%s", step: %d, title: "%s" }' % (t, i, ti)
                       for t, i, ti in rows)
    return ('  /* ==== ' + MARK + ' - see grade-1-app/add-self-check.py ====\n'
            '     The Workbook closes every Stage 1 unit with this: a three-way scale and a\n'
            '     list of "I can..." statements the child marks themselves. It sits on the\n'
            '     sticker shelf rather than in a step of its own, so no progress position\n'
            '     moves. Nothing here is scored, stored anywhere but this browser, or sent\n'
            '     to the school - it is the child\'s own claim, and the only thing it does\n'
            '     with the answer is offer the step that teaches it. */\n'
            '  const SELFCHECK = [\n%s\n  ];\n'
            '  const SC_KEY = "ehel-selfcheck-%s-v1";\n'
            '  function scLoad() {\n'
            '    try { return JSON.parse(localStorage.getItem(SC_KEY) || "{}") || {}; } catch (e) { return {}; }\n'
            '  }\n'
            '  function scSave(m) {\n'
            '    try { localStorage.setItem(SC_KEY, JSON.stringify(m)); } catch (e) {}\n'
            '  }\n'
            '  function scPaint() {\n'
            '    const host = $("selfcheck"); if (!host) return;\n'
            '    const marks = scLoad();\n'
            '    host.innerHTML = \'<p class="sc-head">%s</p><p class="sc-sub">%s</p>\' +\n'
            '      SELFCHECK.map((it, i) => {\n'
            '        const got = marks[i];\n'
            '        const opts = %s.map((o) =>\n'
            '          \'<button type="button" data-i="\' + i + \'" data-v="\' + o[0] + \'" aria-pressed="\' +\n'
            '          (got === o[0] ? "true" : "false") + \'">\' + o[1] + "</button>").join("");\n'
            '        const back = (got && got !== "yes")\n'
            '          ? \'<p class="sc-back"><button type="button" class="sc-go" data-step="\' + it.step +\n'
            '            \'">Go back to step \' + (it.step + 1) + ": " + it.title + "</button></p>"\n'
            '          : "";\n'
            '        return \'<div class="sc-item"><p class="sc-say">\' + it.say +\n'
            '          \'</p><div class="sc-opts">\' + opts + "</div>" + back + "</div>";\n'
            '      }).join("");\n'
            '  }\n'
            '  $("selfcheck").addEventListener("click", (e) => {\n'
            '    const go = e.target.closest(".sc-go");\n'
            '    if (go) { show(Number(go.dataset.step), true); return; }\n'
            '    const b = e.target.closest("button[data-v]"); if (!b) return;\n'
            '    const marks = scLoad();\n'
            '    marks[Number(b.dataset.i)] = b.dataset.v;\n'
            '    scSave(marks);\n'
            '    scPaint();\n'
            '  });\n'
            '  scPaint();\n\n') % (items, lesson,
                                   HEAD[0], HEAD[1],
                                   "[" + ", ".join('["%s", "%s"]' % o for o in SCALE) + "]")


done = skipped = refused = 0
for name in sorted(PLAN):
    p = os.path.join(G, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue

    # resolve every statement's step from the PAGE
    slides = re.findall(r'<section class="slide"[\s\S]*?</section>', s)
    titles = []
    for sl in slides:
        h = re.search(r"<h2[^>]*>(.*?)</h2>", sl, re.S)
        titles.append(re.sub(r"<[^>]*>", "", h.group(1)).strip() if h else "")
    rows, bad = [], []
    for say, title in PLAN[name]:
        hit = [i for i, t in enumerate(titles) if t == title]
        if len(hit) != 1:
            bad.append('step "%s" found %d times' % (title, len(hit)))
        else:
            rows.append((say, hit[0], title))
        if '"' in say:
            bad.append("a double quote in a statement")

    shelf = re.search(r'(<div class="stickers" id="stickers"></div>\s*\n\s*'
                      r'<p class="fb" id="[A-Za-z0-9_]+" role="status" aria-live="polite"></p>)', s)
    if not shelf:
        bad.append("the sticker shelf is not the shape this tool expects")
    if s.count('data-say="Look at all the stickers you earned!"') != 1:
        bad.append("the shelf slide does not carry the wording this tool rewrites")
    if not re.search(r"(?:[ \t]*/\*[^\n]*stickers[^\n]*\*/\n)?[ \t]*const STICKERS = \[", s):
        bad.append("no STICKERS declaration")
    if "function show(i, speak)" not in s:
        bad.append("no show() to send the child back with")
    if bad:
        print("  REFUSED  %-30s %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    # 1. the markup, under the shelf and above Play again
    s = s.replace(shelf.group(1), shelf.group(1) +
                  '\n        <div class="sc-wrap" id="selfcheck"></div>', 1)
    # 2. the code, INSIDE the lesson IIFE - show() and $ are in its closure
    stick = re.search(r"(?:[ \t]*/\*[^\n]*stickers[^\n]*\*/\n)?[ \t]*const STICKERS = \[", s)
    s = s[:stick.start()] + js(name.replace(".html", ""), rows) + s[stick.start():]
    # 3. the shelf no longer says there is nothing to do here
    s = s.replace('data-say="Look at all the stickers you earned!"',
                  'data-say="Look at all the stickers you earned. Then tell me which parts you can do."', 1)
    s = s.replace("<s>Have a look at what you earned.</s>",
                  "<s>Have a look at what you earned.</s><s>Then tell me which parts you can do.</s>", 1)
    # 4. the classes it uses
    s = s.rstrip() + "\n\n<style>/* " + MARK + " - see add-self-check.py */\n" + CSS + "</style>\n"

    assert s.count(MARK) >= 2
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s %d statements, each with the step that teaches it"
          % ("wrote  " if WRITE else "would  ", name, len(rows)))
    done += 1

print("\n  %d lesson(s) %s, %d already done, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
