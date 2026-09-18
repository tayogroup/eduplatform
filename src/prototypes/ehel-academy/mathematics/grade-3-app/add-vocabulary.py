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

WORDS ACTUALLY USED IN THIS LESSON, not a generic Stage 3 list lifted from
the syllabus. Each term below is one this lesson's own steps use un-defined
- check the lesson's own text before trusting this comment if the lesson is
ever rewritten. Some formal Cambridge words (numerator, denominator,
equivalent, commutative, distributive, fact family, linear sequence) are
deliberately absent even though they would fit the topic, because this
lesson's own audio and on-screen text never say them - it says "top number",
"bottom number", "the same, in different pieces" and so on instead, and a
glossary must not teach a word the lesson itself avoided.

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

MARK = "ehel-g3-vocabulary"
HEAD = ("Math Words", "Words from this lesson, explained in one line each.")

# lesson -> [(term, definition)]
WORK = {
 "adding-and-money": [
  ("complement", "The amount still needed to reach a round number, such as a multiple of 10 or 100 - 62 and its complement to 100 is 38."),
  ("regroup", "Move a group of ten from one column into the next, such as moving 100 out of the hundreds to make 10 more tens."),
  ("carry", "A ten (or a hundred) that moves from one column into the next when adding, because that column added up to more than 9."),
  ("exchange", "Trade one from the column to the left for ten in the column you are working on, so you have enough to take away."),
  ("estimate", "A sensible rough answer worked out before the exact calculation, by rounding the numbers first."),
 ],
 "ask-count-chart": [
  ("tally chart", "A way of counting things as they happen, using one mark for each one and a mark laid across every fifth one."),
  ("pictogram", "A chart that uses pictures to show amounts, where a key says how much each picture is worth."),
  ("bar chart", "A chart that shows amounts as bars - the taller the bar, the bigger the amount."),
  ("Venn diagram", "Two overlapping circles that sort things by which of two properties they have - the middle holds things with both."),
  ("Carroll diagram", "A grid that sorts things into boxes using two yes/no questions, one across the top and one down the side."),
  ("key", "The part of a pictogram that says how much one picture stands for."),
 ],
 "equal-parts": [
  ("fraction", "One or more equal parts of a whole, written as one number over another, such as 3/4."),
  ("equal parts", "Pieces of a whole that are all exactly the same size - not just close, but the same."),
  ("whole", "All of the equal parts put back together - one complete thing, before any of it was shared out."),
  ("divide", "Share an amount into equal parts - the line in a fraction means exactly this."),
  ("compare", "Work out which of two fractions is bigger, by looking at whether their top numbers or bottom numbers match."),
 ],
 "measure-it": [
  ("capacity", "How much a container can hold, measured in millilitres and litres."),
  ("mass", "How heavy something is, measured in grams and kilograms."),
  ("scale", "The marked line on an instrument, such as a ruler or kitchen scales, used to read off a measurement."),
  ("right angle", "A square corner - a quarter turn, exactly a quarter of the way round."),
  ("half turn", "A turn that makes a straight line - the same amount of turning as two right angles put together."),
 ],
 "rows-and-rules": [
  ("array", "Objects or numbers arranged in equal rows and columns, so you can count them by multiplying instead of one at a time."),
  ("multiple", "A number you land on when counting up in equal steps from zero, such as 5, 10, 15, 20 when counting in fives."),
  ("remainder", "What is left over when an amount cannot be shared into equal groups exactly."),
  ("sequence", "A list of numbers or shapes that follow a pattern, one after another."),
  ("rule", "The instruction that says how to get from one number in a sequence to the next."),
 ],
 "shapes-and-symmetry": [
  ("quadrilateral", "Any flat shape with exactly four straight sides, such as a square, rectangle or trapezium."),
  ("regular", "A shape where every side is the same length and every corner is the same - an irregular shape is not."),
  ("symmetry", "A shape has a line of symmetry when it can be folded along that line so the two halves land exactly on top of each other."),
  ("reflection", "A flip of a shape over a mirror line, so every point ends up the same distance from the line, on the other side."),
  ("perimeter", "The whole distance all the way round the outside edge of a shape."),
  ("area", "How much flat space is covered inside a shape's edge, measured in square units."),
 ],
 "time-and-direction": [
  ("time interval", "How long something lasts, found by counting on from the start time to the end time."),
  ("timetable", "A list of times set out in rows and columns, such as which bus arrives at which stop and when."),
  ("cardinal point", "One of the four main compass directions - north, south, east and west - which never change, whichever way you are facing."),
  ("clockwise", "Turning the same way the hands of a clock move - from 12 towards 3, then 6, then 9."),
  ("anticlockwise", "Turning the opposite way to the hands of a clock."),
 ],
 "up-to-a-thousand": [
  ("digit", "One of the ten symbols 0-9 used to write a number - 348 has three digits."),
  ("place value", "What a digit is worth because of the column it stands in, not just the symbol itself."),
  ("decompose", "Break a number apart into its hundreds, tens and ones, such as 348 into 300, 40 and 8."),
  ("regroup", "Rewrite the same number using a different mix of hundreds and tens, such as trading one hundred for ten tens - the value never changes."),
  ("round", "Replace a number with a nearby one that is easier to work with, such as the nearest 10 or 100."),
  ("estimate", "A sensible guess at an amount, made by picturing part of it rather than counting every single one."),
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
               if f.endswith(".html") and not re.search(r"index|review-pack", f))
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
