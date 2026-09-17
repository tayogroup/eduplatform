# -*- coding: utf-8 -*-
"""The Stage 3 Workbook's own "I can" statements, on the sticker shelf.

    python add-self-check.py            # report
    python add-self-check.py --write

CAMBRIDGE WROTE THESE, not this tool. All 93 are lifted verbatim from the 19
self-check pages of the Stage 3 Workbook and each carries the page it came
from. A learner ticking one is answering Cambridge's own question about the
lesson they have just done.

FOUR FIGURES WERE REPORTED FOR THIS BEFORE THE RIGHT ONE, and the reasons are
worth keeping because each is a different way of miscounting a book:

    84   every numbered "I can" occurrence, duplicates included
    31   a boundary regex that truncated most statements mid-phrase
    75   missed the ones OCR had glued to their neighbours
    95   correct; 93 usable

The OCR one is the trap to remember: the Workbook's capital I is read as a
digit 1 in places, so "4 I can add pairs of multiples of 100" arrives as
"4 1 can add pairs of multiples of 100" and every pattern anchored on "I can"
walks straight past it. Normalising `\b1 can\b` recovered 20 statements.

A further 36 of the original count were the SCALE a child ticks - "I can do
this" eighteen times, "I can do this, but I need to keep trying" eighteen
times - which is metalanguage, not content.

TWO POINTS, NOT THREE, and that is Stage 3 rather than a simplification. The
Stage 2 Workbook offers a three-way scale; Stage 3 offers two tickable options
and then a free-text line, "I need more help with:". The free-text half is not
built: no standalone lesson build can take free text (measured: zero textareas
across every grade-N app in every subject), and faking it with a third button
would put words in a child's mouth. See docs/lesson-app-open-response-spec.md.

TWO STATEMENTS WERE DROPPED rather than repaired. OCR destroyed the symbols in
"I can explain and demonstrate that 9 3 = 6, whereas 3-9 = 6" and in a fraction
statement that lost its numerator. Guessing the missing operators would put a
sentence in Cambridge's mouth that Cambridge may not have written.

Marks are per learner and per lesson in localStorage, and they are NEVER a
score: nothing is marked, nothing is reported, and no pass depends on them.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g3-self-check"

# Cambridge's own wording, from the Stage 3 Workbook self-check pages
SCALE = [("yes", "I can do this"),
         ("trying", "I can do this, but I need to keep trying")]

# lesson -> [(statement, source page in the Workbook)]
WORK = {
 "adding-and-money": [
  ("I can identify complements of 100 from sets of numbers", "p15"),
  ("I can estimate to check the answers to addition and subtraction calculations", "p15"),
  ("I can add pairs of 2-digit numbers", "p15"),
  ("I can take away a 2-digit number from a 2-digit number. 4", "p15"),
  ("I can work out the value of an unknown quantity in an addition calculation and in a subtraction calculation", "p43"),
  ("I can use money notation with a decimal point, knowing that, for example, $2.50 means 2 dollars and 50 cents", "p43"),
  ("I can use notes and coins to pay for items and work out the change. 4 N", "p43"),
  ("I can estimate to check the answers to addition calculations and subtraction calculations", "p80"),
  ("I can use notes and coins to pay for items and work out the change. -", "p80"),
 ],
 "ask-count-chart": [
  ("I can organise information into a list, a table and a chart", "p25"),
  ("I can record data using a tally chart", "p25"),
  ("I can answer questions about a pictogram and a bar chart", "p25"),
  ("I can sort objects and shapes on a Carroll diagram", "p25"),
  ("I can answer questions about Venn diagrams and Carroll diagrams", "p25"),
  ("I can interpret and explain the data presented in tables, bar charts and pictograms. d N", "p25"),
  ("I can use known multiplication tables facts for the 2, 3, 4,5 and 10 times tables to help me to recall other times tables facts", "p31"),
  ("I can choose suitable units to estimate and measure length", "p35"),
  ("I can explain the result of multiplying a number by 10 and demonstrate using a place value chart", "p48"),
  ("I can model decomposition to multiply. 3 Icanrecallthe 1, 2, 3,4,5, 6, 8,9 and 10 times tables, using known facts to recall others", "p54"),
  ("I can read and use the information shown on a timetable", "p58"),
  ("I can sort objects and shapes in a Carroll diagram", "p98"),
  ("I can interpret and explain the data presented in tables, bar charts and pictograms", "p98"),
  ("I can describe the chance of an event happening", "p98"),
  ("I can describe the results of a chance experiment. p", "p98"),
 ],
 "equal-parts": [
  ("I can understand that a straight line is equivalent to 2 right angles or a half turn", "p64"),
  ("I can understand and explain the relationship between the whole and the parts of fractions of shapes and objects", "p68"),
  ("I can understand and explain what each part of a fraction represents", "p68"),
  ("I can understand that 2 is 3 parts of 4 equal parts", "p68"),
  ("I can understand and explain a fraction as being the numerator divided by the denominator", "p94"),
  ("I can use a diagram to show equivalent fractions", "p94"),
  ("I can add and subtract fractions with the same denominator and model them with a diagram", "p94"),
  ("I can estimate the answer when adding and subtracting fractions with the same denominator", "p94"),
  ("I can put a set of unit fractions in order", "p94"),
  ("I can compare and order fractions with the same denominator and different numerators", "p94"),
 ],
 "measure-it": [
  ("I can estimate lengths in centimetres (cm), metres (m) and kilometres (km) before measuring", "p35"),
  ("I can convert between mm, cm, m and km", "p35"),
  ("I can say what one division on a scale is worth. -", "p35"),
  ("I can use scales to measure the mass of objects in kilograms (kg) and grams (g)", "p58"),
  ("I can estimate and measure mass accurately using grams (g) and kilograms (kg)", "p58"),
  ("I can estimate and measure capacity using litres (£2) and millilitres (ml)", "p58"),
  ("I can read a scale to the nearest division or half-division", "p58"),
  ("I can select and use measuring instruments for length, mass and capacity. -", "p58"),
  ("I can measure the perimeter of 2D shapes", "p84"),
  ("I can measure the area of a grid in square units", "p84"),
  ("I can draw rectangles and measure the length of each side to find the perimeter. a", "p84"),
 ],
 "rows-and-rules": [
  ("I can add pairs of multiples of 100", "p15"),
  ("I can understand the inverse relationship between multiplication and division", "p31"),
  ("I can show that when numbers are multiplied their order can be changed without the answer changing", "p31"),
  ("I can model decomposing and regrouping with numbers to 20 to multiply", "p31"),
  ("I can find multiples of 2, 5 and 10 from a set of numbers past the tenth multiple", "p31"),
  ("I can add pairs of multiples of 10", "p43"),
  ("I can identify the rule for sequences of numbers", "p48"),
  ("I can simplify a calculation to multiply by changing the order of the numbers I am multiplying", "p54"),
  ("I can recall division facts that are related to known multiplication facts", "p54"),
  ("I can estimate to check the answers to multiplication and division calculations", "p54"),
  ("I can multiply any 2-digit number by 2, 3, 4 and 5", "p54"),
  ("I can divide 2-digit numbers by 2, 3, 4 and 5 with no remainders", "p54"),
  ("I can extend number sequences and explain the rule", "p73"),
  ("I can continue a pattern and explain the rule. N", "p73"),
  ("I can add pairs of multiples of 10 and 100", "p80"),
  ("I can estimate to check the answers to multiplication calculations and division calculations", "p90"),
  ("I can divide 2-digit numbers by 2, 3, 4 and 5. -", "p90"),
 ],
 "shapes-and-symmetry": [
  ("I can classify 2D shapes and talk about their properties", "p21"),
  ("I can sort 3D shapes and talk about their properties", "p21"),
  ("I can identify regular and irregular polygons", "p21"),
  ("I can compare shapes and say what is the same and what is different about them", "p21"),
  ("I can create 3D shapes from drawings of the shapes. -", "p21"),
  ("I can see if a shape has more than 1 line of symmetry", "p64"),
  ("I can find shapes with horizontal and vertical lines of symmetry", "p64"),
  ("I can sketch the reflection of a shape in a horizontal or vertical mirror line, including where the mirror line is the edge of the shape", "p64"),
  ("I can test whether an angle is equal to, bigger than or smaller than a right angle", "p64"),
 ],
 "time-and-direction": [
  ("I can identify which units of time to use for different activities", "p35"),
  ("I can say the time accurately as minutes past the hour and write it in digital notation", "p35"),
  ("I can continue a pattern of cubes that increases by 3 each time and explain the rule. -", "p48"),
  ("I can follow and give instructions to make turns and movements on a grid. p", "p64"),
  ("I can work out the interval (amount of time) between 2 given times", "p84"),
 ],
 "up-to-a-thousand": [
  ("I can count on and back in 1s, 10s and 100s from any number up to 1000", "p9"),
  ("I can explain why a number is an odd or an even number", "p9"),
  ("I can read and write 3-digit numbers and show what each digit stands for", "p9"),
  ("I can explain the use of zero (0) as a placeholder in a 3-digit number", "p9"),
  ("I can make a good estimate of the number of objects in a group", "p9"),
  ("I can show that when numbers are added, their order can be changed but the total does not change", "p15"),
  ("I can add pairs of 2-digit and 3-digit numbers", "p43"),
  ("I can take away a 2-digit number from a 3-digit number", "p43"),
  ("I can compare 3-digit numbers using the symbols < and", "p48"),
  ("I can order a set of 3-digit numbers on a number line", "p48"),
  ("I can round 3-digit numbers to the nearest 10 or 100", "p48"),
  ("I can compose and decompose 3-digit numbers to identify each place value position of the numbers", "p73"),
  ("I can decompose 3-digit numbers in different ways", "p73"),
  ("I can compare and order a set of 3-digit numbers", "p73"),
  ("I can add pairs of 3-digit numbers", "p80"),
  ("I can take away a 3-digit number from a 3-digit number", "p80"),
  ("I can use the symbols < or > to compare and order values. p", "p94"),
 ],
}


HEAD = ("What I can do",
        "Cambridge asks these about this lesson. Tick the ones that are true for "
        "you. Nothing here is marked and nobody is told - it is for you.")


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


def js(lesson, items):
    rows = ", ".join("{ t: %s, p: %s }" % (lit(t), lit(p)) for t, p in items)
    scale = ", ".join('["%s", "%s"]' % (k, v) for k, v in SCALE)
    return ('\n  /* ==== ' + MARK + ': the Workbook\'s own "I can" statements ====\n'
            '     Verbatim from the Stage 3 Workbook, each with the page it came from.\n'
            '     Two options because Stage 3 offers two; the third line in the book is\n'
            '     free text, which nothing in this build can take. NEVER a score: no\n'
            '     mark, no report, no pass depends on it. */\n'
            '  const SC_KEY = "ehel-g3-sc-' + lesson + '";\n'
            '  const SELFCHECK = [' + rows + '];\n'
            '  const SC_SCALE = [' + scale + '];\n'
            '  function scLoad() {\n'
            '    try { return JSON.parse(localStorage.getItem(SC_KEY) || "{}") || {}; }\n'
            '    catch (e) { return {}; }\n'
            '  }\n'
            '  function scSave(m) {\n'
            '    try { localStorage.setItem(SC_KEY, JSON.stringify(m)); } catch (e) {}\n'
            '  }\n'
            '  function scPaint() {\n'
            '    const host = document.getElementById("selfcheck");\n'
            '    if (!host) return;\n'
            '    const marks = scLoad();\n'
            '    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")\n'
            '      .replace(/"/g, "&quot;");\n'
            '    host.innerHTML = \'<p class="sc-head">' + HEAD[0] + '</p>\'\n'
            '      + \'<p class="sc-sub">' + HEAD[1] + '</p>\'\n'
            '      + SELFCHECK.map((it, i) =>\n'
            '        \'<div class="sc-row"><p class="sc-say">\' + esc(it.t) + \'</p>\'\n'
            '        + SC_SCALE.map(([v, label]) =>\n'
            '            \'<button type="button" class="sc-opt\' + (marks[i] === v ? " on" : "")\n'
            '            + \'" data-i="\' + i + \'" data-v="\' + v + \'" aria-pressed="\'\n'
            '            + (marks[i] === v) + \'">\' + esc(label) + "</button>").join("")\n'
            '        + "</div>").join("");\n'
            '  }\n'
            '  document.addEventListener("click", (e) => {\n'
            '    const b = e.target.closest(".sc-opt");\n'
            '    if (!b) return;\n'
            '    const marks = scLoad();\n'
            '    const i = Number(b.dataset.i);\n'
            '    /* tapping the same one again clears it: a child who changes their mind\n'
            '       must be able to say nothing, not only swap to the other answer */\n'
            '    marks[i] = marks[i] === b.dataset.v ? "" : b.dataset.v;\n'
            '    scSave(marks);\n'
            '    scPaint();\n'
            '  });\n'
            '  scPaint();\n\n')


STYLE = """<style>/* %s - see add-self-check.py */
  #selfcheck { margin: 18px auto 0; max-width: 46ch; text-align: left; }
  .sc-head { font-size: 17px; font-weight: 700; margin: 0 0 4px; }
  .sc-sub { font-size: 13.5px; color: var(--muted, #666); margin: 0 0 12px; line-height: 1.5; }
  .sc-row { padding: 9px 0; border-top: 1px solid var(--line, #ddd); }
  .sc-say { margin: 0 0 6px; font-size: 15px; line-height: 1.45; }
  .sc-opt { font: inherit; font-size: 13px; padding: 5px 11px; margin: 0 6px 0 0;
    border-radius: 999px; border: 1px solid var(--line, #ddd);
    background: var(--card, #fff); color: var(--muted, #555); cursor: pointer; }
  .sc-opt.on { background: var(--good-soft, #e6f1ea); border-color: var(--good, #2f6f4a);
    color: var(--good, #2f6f4a); font-weight: 600; }
</style>
""" % MARK

pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack", f))
todo, done, refused, total = [], 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        print("  REFUSED    %-24s no statements mapped to this lesson" % slug)
        refused += 1
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already    %-24s" % slug)
        done += 1
        continue

    # the sticker shelf is where a lesson ends, so the self-check sits under it
    m = re.search(r'(<div class="stickers"[^>]*id="stickers"[^>]*>\s*</div>)', s)
    if not m:
        m = re.search(r'(<div[^>]*id="stickers"[^>]*>[\s\S]{0,80}?</div>)', s)
    if not m:
        print("  REFUSED    %-24s no sticker shelf to sit under" % slug)
        refused += 1
        continue
    anchor = "  show(0, false);"
    if s.count(anchor) != 1:
        print("  REFUSED    %-24s show(0,false) x%d" % (slug, s.count(anchor)))
        refused += 1
        continue

    items = WORK[slug]
    out = s[:m.end()] + '\n      <div id="selfcheck"></div>' + s[m.end():]
    out = out.replace(anchor, js(slug, items) + anchor, 1)
    out = out.rstrip() + "\n" + STYLE
    if out.count(MARK) != 2 or out.count('id="selfcheck"') != 1:
        print("  REFUSED    %-24s marker %d, host %d"
              % (slug, out.count(MARK), out.count('id="selfcheck"')))
        refused += 1
        continue

    todo.append((p, out))
    total += len(items)
    print("  would      %-24s %2d statement(s)" % (slug, len(items)))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d statement(s) across %d lesson(s) %s, %d already done, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, refused,
         "" if WRITE else "   (--write to apply)"))
