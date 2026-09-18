# -*- coding: utf-8 -*-
"""Math Words, on the sticker shelf - the one dimension the comparison found
nothing built on either side of the Stage 3 transition, now built on this one.

    python add-vocabulary.py            # report
    python add-vocabulary.py --write

WHY HERE, AND WHY THIS SHAPE. Cambridge's own vocabulary is thin at Stage
1-2 (a one-or-two-word "Maths words" box per page) and becomes a real A-Z
glossary from Stage 3 - full worked definitions, not just a word list. This
build had neither: no glossary, no word card, no dictionary link, at any of
the four grades, confirmed by direct search. Following add-self-check.py's
own precedent exactly - the same insertion point (the sticker-shelf slide,
via an empty host div populated by its own small script, no renumbering, no
sticker-shelf math, no new finish() call) - because that is the lowest-risk
place in this deck to add reference content a child revisits rather than
answers once.

WORDS ACTUALLY USED IN THIS LESSON, not a generic Stage 2 list lifted from
the syllabus. Each term below is one this lesson's own steps use un-defined
- check the lesson's own text before trusting this comment if the lesson is
ever rewritten.

NEVER A SCORE, matching self-check: nothing here is asked, nothing is
marked, and opening or not opening it changes no progress.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-vocabulary"
HEAD = ("Math Words", "Words from this lesson, explained in one line each.")

# lesson -> [(term, definition)]
WORK = {
 "tens-and-ones": [
  ("digit", "One of the ten symbols 0-9 used to write a number - the 4 and the 7 in 47 are both digits."),
  ("array", "Rows and columns of the same size, used to show a multiplication fact."),
  ("odd number", "A whole number that leaves one left over when put into pairs, like 3, 5 and 7."),
  ("even number", "A whole number that splits into pairs exactly, with nothing left over, like 2, 4 and 6."),
  ("round", "Change a number to the nearest ten, to make it easier to work with."),
 ],
 "coins-and-change": [
  ("coin", "A round piece of money, like a 5 or 10 shilling coin."),
  ("note", "A flat piece of paper money, worth more than most coins."),
  ("value", "How much something is worth in money."),
  ("total", "The whole amount when you add prices or coins together."),
  ("shilling", "The unit of money used in this lesson, written KSh or sh."),
  ("saving", "Keeping money instead of spending it, so the amount goes up."),
 ],
 "fair-shares": [
  ("fraction", "A part of a whole, like one half or one quarter."),
  ("numerator", "The top number in a fraction - how many equal parts you have."),
  ("denominator", "The bottom number in a fraction - how many equal parts the whole is split into."),
  ("equal parts", "Pieces that are exactly the same size."),
  ("equivalent", "Worth the same amount, even though the fraction looks different, like one half and two quarters."),
  ("whole", "One whole thing, before it is cut into parts."),
 ],
 "patterns-that-grow": [
  ("pattern", "Shapes or numbers arranged in a way that follows a rule."),
  ("repeat", "The part of a pattern that happens again and again."),
  ("sequence", "A list of numbers that follow one after another, in order."),
  ("rule", "The idea that tells you how a pattern changes each time."),
  ("step", "How much a sequence of numbers goes up or down by each time."),
 ],
 "sides-and-corners": [
  ("side", "One of the straight or curved edges of a flat shape."),
  ("corner", "The point where two sides of a shape meet."),
  ("face", "One flat surface of a solid shape, like one side of a cube."),
  ("edge", "The line where two faces of a solid shape meet."),
  ("symmetry", "When one half of a shape is an exact mirror match of the other half."),
  ("clockwise", "Turning the same way the hands of a clock move."),
 ],
 "which-way-from-here": [
  ("position", "Where something is, such as above, below or between other things."),
  ("direction", "The way something is facing or moving, like left, right or forward."),
  ("forward", "Moving the way you are facing, straight ahead."),
  ("reflection", "A mirror image of a shape, flipped over a line."),
  ("mirror line", "The line a reflection is flipped across - both sides are the same distance from it."),
 ],
 "how-much-how-long": [
  ("length", "How long something is, measured from one end to the other."),
  ("centimetre", "A small unit for measuring length, marked on a ruler."),
  ("unit", "The thing you use to measure with, like a cube, a centimetre or a cup."),
  ("balance", "A tool with two sides that tips down on the heavier side, used to compare mass."),
  ("mass", "How heavy something is."),
  ("capacity", "How much a container can hold."),
 ],
 "half-past-quarter-to": [
  ("hour", "A unit of time - there are 24 in a day, shown by the short hand on a clock."),
  ("minute", "A unit of time - there are 60 in an hour, shown by the long hand on a clock."),
  ("quarter past", "Fifteen minutes after the hour."),
  ("quarter to", "Fifteen minutes before the next hour."),
  ("digital time", "Time written in numbers, like 3:15, instead of shown on a clock face."),
  ("calendar", "A chart that shows the days of a month, arranged in rows of seven."),
 ],
 "count-it-chart-it": [
  ("tally", "A quick way to keep count using marks, with every fifth mark crossing the other four."),
  ("pictogram", "A chart that uses pictures to show how many of something there are."),
  ("Carroll diagram", "A grid that sorts things by two labels at once, such as red and round."),
  ("block graph", "A chart that uses one block for each thing, so you can count the blocks to answer."),
  ("regular", "A pattern that repeats in the same way over and over."),
  ("random", "Something with no pattern, so you cannot know what comes next."),
 ],
}


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


def js(lesson, items):
    rows = ", ".join("{ w: %s, d: %s }" % (lit(w), lit(d)) for w, d in items)
    return ('\n  /* ==== ' + MARK + ': Math Words for this lesson ====\n'
            '     Same insertion pattern as add-self-check.py: an empty host div on\n'
            '     the sticker-shelf slide, populated by this script, never scored. */\n'
            '  (function () {\n'
            '    const VOCAB = [' + rows + '];\n'
            '    const host = document.getElementById("vocab");\n'
            '    if (!host) return;\n'
            '    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")\n'
            '      .replace(/"/g, "&quot;");\n'
            '    host.innerHTML = \'<p class="vc-head">' + HEAD[0] + '</p>\'\n'
            '      + \'<p class="vc-sub">' + HEAD[1] + '</p>\'\n'
            '      + \'<dl class="vc-list">\'\n'
            '      + VOCAB.map((it) => \'<div class="vc-row"><dt>\' + esc(it.w) + \'</dt><dd>\'\n'
            '        + esc(it.d) + "</dd></div>").join("")\n'
            '      + "</dl>";\n'
            '  })();\n\n')


STYLE = """<style>/* %s - see add-vocabulary.py */
  #vocab { margin: 18px auto 0; max-width: 46ch; text-align: left; }
  .vc-head { font-size: 17px; font-weight: 700; margin: 0 0 4px; }
  .vc-sub { font-size: 13.5px; color: var(--muted, #666); margin: 0 0 12px; line-height: 1.5; }
  .vc-list { margin: 0; }
  .vc-row { padding: 9px 0; border-top: 1px solid var(--line, #ddd); }
  .vc-row dt { margin: 0 0 3px; font-size: 15px; font-weight: 700; }
  .vc-row dd { margin: 0; font-size: 14px; line-height: 1.45; color: var(--ink, #222); }
</style>
""" % MARK

pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack|audit|^_|-body\.html$", f))
todo, done, refused, total = [], 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already    %-26s" % slug)
        done += 1
        continue

    m = re.search(r'(<div[^>]*id="selfcheck"[^>]*>\s*</div>)', s)
    if not m:
        print("  REFUSED    %-26s no self-check host to sit after (add-self-check.py runs first)" % slug)
        refused += 1
        continue
    anchor = "  show(0, false);"
    if s.count(anchor) != 1:
        print("  REFUSED    %-26s show(0,false) x%d" % (slug, s.count(anchor)))
        refused += 1
        continue

    items = WORK[slug]
    out = s[:m.end()] + '\n      <div id="vocab"></div>' + s[m.end():]
    out = out.replace(anchor, js(slug, items) + anchor, 1)
    out = out.rstrip() + "\n" + STYLE
    if out.count(MARK) != 2 or out.count('id="vocab"') != 1:
        print("  REFUSED    %-26s marker %d, host %d"
              % (slug, out.count(MARK), out.count('id="vocab"')))
        refused += 1
        continue

    todo.append((p, out))
    total += len(items)
    print("  would      %-26s %2d word(s)" % (slug, len(items)))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d word(s) across %d lesson(s) %s, %d already done, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, refused,
         "" if WRITE else "   (--write to apply)"))
