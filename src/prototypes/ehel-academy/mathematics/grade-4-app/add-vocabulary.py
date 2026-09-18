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

WORDS ACTUALLY USED IN THIS LESSON, not a generic Stage 4 list lifted from
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

MARK = "ehel-g4-vocabulary"
HEAD = ("Math Words", "Words from this lesson, explained in one line each.")

# lesson -> [(term, definition)]
WORK = {
 "big-numbers-below-zero": [
  ("digit", "One of the ten symbols 0-9 used to write a number. 3,472 has four digits."),
  ("place value", "What a digit is worth because of the column it sits in, not just the symbol itself."),
  ("regroup", "Rewrite the same number using a different mix of thousands, hundreds, tens and ones - the value never changes."),
  ("negative number", "A number below zero, written with a minus sign, such as -5."),
  ("round", "Replace a number with a nearby one that is easier to work with, such as the nearest hundred."),
 ],
 "patterns-and-squares": [
  ("odd number", "A whole number that leaves 1 left over when split into pairs - 1, 3, 5, 7..."),
  ("even number", "A whole number that splits into pairs exactly, with none left over - 2, 4, 6, 8..."),
  ("square number", "The result of multiplying a whole number by itself - 4 x 4 = 16, so 16 is a square number."),
  ("sequence", "A list of numbers or shapes that follow a rule, one after another."),
  ("rule", "The instruction that says how to get from one term in a sequence to the next."),
 ],
 "ways-to-calculate": [
  ("estimate", "A sensible guess at an answer, worked out quickly, before or instead of calculating exactly."),
  ("sum", "The answer when numbers are added together."),
  ("difference", "The answer when one number is subtracted from another."),
  ("product", "The answer when numbers are multiplied together."),
  ("factor pair", "Two numbers that multiply together to make a given number - 4 and 6 are a factor pair of 24."),
 ],
 "parts-of-a-whole": [
  ("fraction", "A part of a whole, written as one number over another, such as 3/8."),
  ("numerator", "The top number in a fraction - how many parts you have."),
  ("denominator", "The bottom number in a fraction - how many equal parts the whole was split into."),
  ("percentage", "A number out of 100, written with a % sign."),
  ("equivalent", "Equal in value, even when written differently - 1/2 and 2/4 are equivalent fractions."),
 ],
 "telling-the-time": [
  ("24-hour time", "A way of writing time from 00:00 to 23:59 with no a.m. or p.m. needed."),
  ("12-hour time", "A way of writing time from 1 to 12 with a.m. or p.m. added to say which half of the day."),
  ("a.m.", "Before midday - from midnight up to, but not including, 12 noon."),
  ("p.m.", "After midday - from 12 noon up to, but not including, midnight."),
  ("duration", "How long something lasts, found by working out the time between a start and an end."),
 ],
 "shape-and-measures": [
  ("face", "A flat surface on a 3D shape. A cube has 6 faces."),
  ("edge", "A line where two faces of a 3D shape meet."),
  ("vertex", "A corner, where edges meet. The plural is vertices."),
  ("area", "How much flat space a shape covers, measured in square units."),
  ("acute angle", "An angle smaller than a right angle (less than 90 degrees)."),
  ("obtuse angle", "An angle bigger than a right angle but smaller than a straight line (between 90 and 180 degrees)."),
 ],
 "where-things-are": [
  ("coordinates", "A pair of numbers, such as (3, 2), that says exactly where a point is on a grid."),
  ("compass point", "One of the directions on a compass, such as north, south-east or west."),
  ("clockwise", "Turning the same way the hands of a clock move."),
  ("anticlockwise", "Turning the opposite way to the hands of a clock."),
 ],
 "asking-sorting-chance": [
  ("Venn diagram", "Overlapping circles that sort things by which properties they share."),
  ("Carroll diagram", "A grid that sorts things into boxes by two properties at once, such as odd/even and more/less than 10."),
  ("certain", "Sure to happen - there is no other possibility."),
  ("likely", "More probable to happen than not, but not certain."),
  ("impossible", "Cannot happen at all."),
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
