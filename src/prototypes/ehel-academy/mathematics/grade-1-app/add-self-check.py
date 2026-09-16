# -*- coding: utf-8 -*-
"""Cambridge's end-of-unit self-check - "What can I do?" - on the sticker shelf.

    python add-self-check.py            # report
    python add-self-check.py --write

WHY. Every one of the 18 Stage 1 Workbook units closes the same way: a page
headed **Self-check - See how much you know!**, a three-way scale, and a list of
"I can..." statements the learner marks for themselves.

    I can do this.
    I can do this, but I need to keep trying.
    I can't do this yet.

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
G = os.path.join(HERE, "g1v2")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-self-check"

# (statement, the TITLE of the step that teaches it). Cambridge's register:
# first person, one skill each, and the thing itself rather than the activity.
PLAN = {
    "counting-to-twenty.html": [
        ("I can count up to 20 things, touching each one once.", "Count to 10"),
        ("I can say how many I see without counting them.", "See how many"),
        ("I can count in twos and in tens.", "Counting in twos"),
        ("I can say whether a number is odd or even.", "Odd and even"),
        ("I can read and write numbers up to 20.", "Write the number"),
        ("I can put numbers in order and say which is more.", "Put them in order"),
    ],
    "adding-and-taking-away.html": [
        ("I can put two groups together to add them.", "Adding"),
        ("I can take away by counting back.", "Taking away"),
        ("I can find how many more one group has than another.", "How many more?"),
        ("I know the pairs of numbers that make 10.", "Making 10"),
        ("I know my doubles up to double 10.", "Doubles"),
        ("I can name the coins we use.", "Money to 20"),
    ],
    "halves-and-wholes.html": [
        ("I know that a half means two parts of the same size.", "Two equal parts"),
        ("I can colour one half of a shape.", "Colour one half"),
        ("I can find half of a group of things.", "Half of a group"),
        ("I can work out half of a number.", "Half of a number"),
        ("I know that two halves make one whole.", "Two halves make a whole"),
    ],
    "what-comes-next.html": [
        ("I can say what comes next in a pattern.", "What comes next?"),
        ("I can find the part of a pattern that repeats.", "The part that repeats"),
        ("I can fill in a missing number in a sequence.", "Missing numbers"),
        ("I can carry on a jumping pattern.", "Jump patterns"),
        ("I can find the missing number in an adding sentence.", "3 + ? = 7"),
        ("I can tell when two sides are the same.", "The same on both sides"),
    ],
    "shapes-and-sizes.html": [
        ("I can name flat shapes and say how many sides they have.", "Flat shapes"),
        ("I can name solid shapes and count their faces.", "Solid shapes"),
        ("I can tell a flat shape from a solid shape.", "Flat or solid?"),
        ("I can say which of two things is longer.", "Long, longer, longest"),
        ("I can say which of two things is heavier.", "Heavy and light"),
        ("I can say which container holds more.", "Full and empty"),
    ],
    "days-months-and-clocks.html": [
        ("I can name the 7 days of the week in order.", "Days of the week"),
        ("I can name the 12 months of the year.", "Months of the year"),
        ("I can say whether something takes a short time or a long time.", "Short times and long times"),
        ("I can read a clock at o'clock.", "Telling the time"),
        ("I can read a clock at half past.", "Find the clock"),
    ],
    "asking-and-sorting.html": [
        ("I can ask everyone a question and collect the answers.", "Ask everyone"),
        ("I can put answers into a list and a table.", "Make a table"),
        ("I can build a block graph and read it.", "Build a block graph"),
        ("I can read a pictogram.", "Make a pictogram"),
        ("I can sort things on a Venn diagram or a Carroll diagram.", "A Venn diagram"),
        ("I can say what the answers tell us.", "What can we say?"),
    ],
}

HEAD = ("Self-check", "See how much you know")
SCALE = [("yes", "I can do this"), ("trying", "I can do this, but I need to keep trying"),
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
