# -*- coding: utf-8 -*-
"""The Stage 3 Workbook's own "I can" statements, on the sticker shelf.

    python add-self-check.py            # report
    python add-self-check.py --write

CAMBRIDGE WROTE THESE, not this tool. All 94 are lifted from the 18 self-check
pages of the Stage 3 Workbook and each carries the page it came from. A learner
ticking one is answering Cambridge's own question about the lesson they have
just done.

THIS IS THE SECOND EXTRACTION. The first produced 93 statements and shipped
none of them, which is the only reason none of the following reached a child.
Every fault below was found by LISTING the 93 and reading them, not by any
check - and the reading took minutes:

  the filing      every statement was filed by the PAGE it sat on. A self-check
                  page covers a whole UNIT and a unit spans several of these
                  eight lessons, so Equal Parts opened with "a straight line is
                  equivalent to 2 right angles" and Ask, Count, Chart carried
                  the times tables. About fourteen were in the wrong lesson.
  the debris      14 statements ended in the page's tick column - "...work out
                  the change. 4 N", "...on a grid. p", "...of the shapes. -".
  the glue        pairs run together: "...to multiply. 3 Icanrecallthe 1, 2..."
  a truncation    "compare 3-digit numbers using the symbols < and", missing >
  mojibake        "capacity using litres (\xa32)" - byte a3 where the book prints
                  the litre symbol
  the repeats     Cambridge revisits a statement in a later unit, so one lesson
                  was offered "I can identify complements of 100" three times.
  THE SCALE       reported as two points, and asserted in this docstring as a
                  Stage 3 fact. The Workbook offers THREE, on all 18 pages. The
                  third is "I can't do this yet." - its curly apostrophe put it
                  outside the pattern that found the other two, and a wrong
                  measurement then got written up as a finding about Cambridge.

HOW THE FILING WORKS NOW. Each page names its unit, and the 18 unit titles were
recovered from the Workbook, the Learner's Book and the Teacher's Guide together
(every one corroborated 12 or more times). Five titles map to exactly one
lesson. Three legitimately span two - Time and measurement, Shapes and angles,
and Patterns place value and rounding - and there, and only there, the
statement's own words decide: angle words to Measure It, direction words to Time
and Direction, pattern words to Rows and Rules.

FOUR STATEMENTS ARE DROPPED rather than repaired, because their mathematics did
not survive the PDF. The Workbook sets fractions as stacked glyphs and the
extractor loses them, so "I can understand that 3/4 is 3 parts of 4 equal parts"
arrives as "that 2 is 3 parts of 4 equal parts" - wrong, and on a child's
screen. Guessing the missing 3/4, the missing operator in "9 3 = 6" or the
missing > would put a sentence in Cambridge's mouth. One repair IS made and it
touches no mathematics: a parenthetical containing a damaged byte is DELETED,
never reconstructed, which turns "litres (\xa32) and millilitres (ml)" into
"litres and millilitres (ml)" with the unit still spelled out beside it.

Marks are per learner and per lesson in localStorage, and they are NEVER a
score: nothing is marked, nothing is reported, and no pass depends on them.

The Workbook's fourth line, "I need more help with:", is free text and is not
built. No standalone lesson build can take free text (measured: zero textareas
across every grade-N app in every subject), and faking it with a button would
put words in a child's mouth. See docs/lesson-app-open-response-spec.md.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g3-self-check"

# Cambridge's own wording and Cambridge's own three points, from the Stage 3
# Workbook self-check pages. Do not reduce this to two - see the docstring.
SCALE = [("yes", "I can do this"),
         ("trying", "I can do this, but I need to keep trying"),
         ("notyet", "I can't do this yet")]

# lesson -> [(statement, source page in the Workbook)]
WORK = {
 # from Units 2, 7, 14
 "adding-and-money": [
  ("I can show that when numbers are added, their order can be changed but the total does not change", "p15"),
  ("I can identify complements of 100 from sets of numbers", "p15"),
  ("I can add pairs of multiples of 100", "p15"),
  ("I can estimate to check the answers to addition and subtraction calculations", "p15"),
  ("I can add pairs of 2-digit numbers", "p15"),
  ("I can take away a 2-digit number from a 2-digit number", "p15"),
  ("I can work out the value of an unknown quantity in an addition calculation and in a subtraction calculation", "p43"),
  ("I can add pairs of multiples of 10", "p43"),
  ("I can add pairs of 2-digit and 3-digit numbers", "p43"),
  ("I can take away a 2-digit number from a 3-digit number", "p43"),
  ("I can use money notation with a decimal point, knowing that, for example, $2.50 means 2 dollars and 50 cents", "p43"),
  ("I can use notes and coins to pay for items and work out the change", "p43"),
  ("I can add pairs of multiples of 10 and 100", "p80"),
  ("I can estimate to check the answers to addition calculations and subtraction calculations", "p80"),
  ("I can add pairs of 3-digit numbers", "p80"),
  ("I can take away a 3-digit number from a 3-digit number", "p80"),
 ],
 # from Units 4, 18
 "ask-count-chart": [
  ("I can organise information into a list, a table and a chart", "p25"),
  ("I can record data using a tally chart", "p25"),
  ("I can answer questions about a pictogram and a bar chart", "p25"),
  ("I can sort objects and shapes on a Carroll diagram", "p25"),
  ("I can answer questions about Venn diagrams and Carroll diagrams", "p25"),
  ("I can interpret and explain the data presented in tables, bar charts and pictograms", "p25"),
  ("I can sort objects and shapes in a Carroll diagram", "p98"),
  ("I can describe the chance of an event happening", "p98"),
  ("I can describe the results of a chance experiment", "p98"),
 ],
 # from Units 12, 17
 "equal-parts": [
  ("I can understand and explain the relationship between the whole and the parts of fractions of shapes and objects", "p68"),
  ("I can understand and explain what each part of a fraction represents", "p68"),
  ("I can understand and explain a fraction as being the numerator divided by the denominator", "p94"),
  ("I can use a diagram to show equivalent fractions", "p94"),
  ("I can add and subtract fractions with the same denominator and model them with a diagram", "p94"),
  ("I can estimate the answer when adding and subtracting fractions with the same denominator", "p94"),
  ("I can put a set of unit fractions in order", "p94"),
  ("I can compare and order fractions with the same denominator and different numerators", "p94"),
  ("I can use the symbols < or > to compare and order values", "p94"),
 ],
 # from Units 6, 10, 11, 15
 "measure-it": [
  ("I can estimate lengths in centimetres (cm), metres (m) and kilometres (km) before measuring", "p35"),
  ("I can convert between mm, cm, m and km", "p35"),
  ("I can choose suitable units to estimate and measure length", "p35"),
  ("I can say what one division on a scale is worth", "p35"),
  ("I can use scales to measure the mass of objects in kilograms (kg) and grams (g)", "p58"),
  ("I can estimate and measure mass accurately using grams (g) and kilograms (kg)", "p58"),
  ("I can estimate and measure capacity using litres and millilitres (ml)", "p58"),
  ("I can read a scale to the nearest division or half-division", "p58"),
  ("I can select and use measuring instruments for length, mass and capacity", "p58"),
  ("I can test whether an angle is equal to, bigger than or smaller than a right angle", "p64"),
  ("I can measure the perimeter of 2D shapes", "p84"),
  ("I can measure the area of a grid in square units", "p84"),
  ("I can draw rectangles and measure the length of each side to find the perimeter", "p84"),
 ],
 # from Units 5, 8, 9, 13, 16
 "rows-and-rules": [
  ("I can understand the inverse relationship between multiplication and division", "p31"),
  ("I can show that when numbers are multiplied their order can be changed without the answer changing", "p31"),
  ("I can model decomposing and regrouping with numbers to 20 to multiply", "p31"),
  ("I can use known multiplication tables facts for the 2, 3, 4, 5 and 10 times tables to help me to recall other times tables facts", "p31"),
  ("I can find multiples of 2, 5 and 10 from a set of numbers past the tenth multiple", "p31"),
  ("I can identify the rule for sequences of numbers", "p48"),
  ("I can continue a pattern of cubes that increases by 3 each time and explain the rule", "p48"),
  ("I can simplify a calculation to multiply by changing the order of the numbers I am multiplying", "p54"),
  ("I can model decomposition to multiply", "p54"),
  ("I can recall the 1, 2, 3, 4, 5, 6, 8, 9 and 10 times tables, using known facts to recall others", "p54"),
  ("I can recall division facts that are related to known multiplication facts", "p54"),
  ("I can estimate to check the answers to multiplication and division calculations", "p54"),
  ("I can multiply any 2-digit number by 2, 3, 4 and 5", "p54"),
  ("I can divide 2-digit numbers by 2, 3, 4 and 5 with no remainders", "p54"),
  ("I can extend number sequences and explain the rule", "p73"),
  ("I can continue a pattern and explain the rule", "p73"),
  ("I know the 1, 2, 3, 4, 5, 6, 8, 9 and 10 times tables", "p90"),
  ("I know division facts that are related to known multiplication facts", "p90"),
  ("I can estimate to check the answers to multiplication calculations and division calculations", "p90"),
  ("I can divide 2-digit numbers by 2, 3, 4 and 5", "p90"),
 ],
 # from Units 3, 11
 "shapes-and-symmetry": [
  ("I can classify 2D shapes and talk about their properties", "p21"),
  ("I can sort 3D shapes and talk about their properties", "p21"),
  ("I can identify regular and irregular polygons", "p21"),
  ("I know the names of 2D and 3D shapes", "p21"),
  ("I can compare shapes and say what is the same and what is different about them", "p21"),
  ("I can create 3D shapes from drawings of the shapes", "p21"),
  ("I can see if a shape has more than 1 line of symmetry", "p64"),
  ("I can find shapes with horizontal and vertical lines of symmetry", "p64"),
  ("I can sketch the reflection of a shape in a horizontal or vertical mirror line, including where the mirror line is the edge of the shape", "p64"),
 ],
 # from Units 6, 10, 11, 15
 "time-and-direction": [
  ("I can identify which units of time to use for different activities", "p35"),
  ("I can say the time accurately as minutes past the hour and write it in digital notation", "p35"),
  ("I can read and use the information shown on a timetable", "p58"),
  ("I can understand that a straight line is equivalent to 2 right angles or a half turn", "p64"),
  ("I can follow and give instructions to make turns and movements on a grid", "p64"),
  ("I can work out the interval (amount of time) between 2 given times", "p84"),
 ],
 # from Units 1, 8, 13
 "up-to-a-thousand": [
  ("I can count on and back in 1s, 10s and 100s from any number up to 1000", "p9"),
  ("I can explain why a number is an odd or an even number", "p9"),
  ("I can read and write 3-digit numbers and show what each digit stands for", "p9"),
  ("I can explain the use of zero (0) as a placeholder in a 3-digit number", "p9"),
  ("I can make a good estimate of the number of objects in a group", "p9"),
  ("I can explain the result of multiplying a number by 10 and demonstrate using a place value chart", "p48"),
  ("I know what each digit means in 3-digit numbers", "p48"),
  ("I can order a set of 3-digit numbers on a number line", "p48"),
  ("I can round 3-digit numbers to the nearest 10 or 100", "p48"),
  ("I can compose and decompose 3-digit numbers to identify each place value position of the numbers", "p73"),
  ("I can decompose 3-digit numbers in different ways", "p73"),
  ("I can compare and order a set of 3-digit numbers", "p73"),
 ],
}

# ---- audits ------------------------------------------------------------------
# One rule per fault the first extraction shipped into this table. None of them
# is clever; all of them would have fired, and none of them existed.
DEBRIS = re.compile(r"\.\s*\S{1,3}$")            # "...the change. 4 N"
GLUED = re.compile(r"[a-z]{2}(?:can|know)(?:the|[a-z]{4,})", re.I)   # "Icanrecallthe"
DECIMAL_OK = re.compile(r"(?<=\d)\.(?=\d)")
TIGHT_LIST = re.compile(r"\d,\d")                # "3,4,5"
# a statement the PDF cut off ends on a word or symbol that cannot end a sentence
# "for" and "from" are NOT in this list, and that is measured rather than
# guessed: "show what each digit stands for" is a whole statement, and the
# first version of this rule refused it. Checked against the final word of all
# 94 - none of the words below ends a real one.
DANGLING = re.compile(r"(?:\b(?:and|or|the|a|an|of|with|to|in|by|than|"
                      r"between|into|using|that|is|are)|[<>+=-])$", re.I)

if len(SCALE) != 3:
    sys.exit("  REFUSED: the Stage 3 Workbook offers THREE points, not %d. This was "
             "measured wrong once and written up as a fact about Cambridge - read "
             "this file's docstring before changing it." % len(SCALE))

_seen = {}
for _les, _items in WORK.items():
    for _t, _p in _items:
        _where = "%s %s" % (_les, _p)
        if not re.match(r"^I (can|know)\b", _t):
            sys.exit("  REFUSED %s: does not open 'I can' or 'I know': %r" % (_where, _t))
        if re.search(r"[^\x20-\x7e]", _t):
            sys.exit("  REFUSED %s: a byte did not survive the PDF: %r"
                     % (_where, re.findall(r"[^\x20-\x7e]", _t)))
        if DEBRIS.search(_t):
            sys.exit("  REFUSED %s: the page's tick column is still attached: %r"
                     % (_where, _t[-24:]))
        if DECIMAL_OK.sub("", _t).count(".") or _t.endswith("."):
            sys.exit("  REFUSED %s: a full stop outside a decimal - two statements "
                     "are probably glued: %r" % (_where, _t))
        if GLUED.search(_t) or TIGHT_LIST.search(_t):
            sys.exit("  REFUSED %s: a run lost its spaces: %r" % (_where, _t))
        if len(_t) < 25 or DANGLING.search(_t):
            # Length is the wrong instrument here and was tried first: the real
            # truncation - "compare 3-digit numbers using the symbols < and" -
            # is 52 characters and survived it. What a cut-off statement always
            # does is end mid-clause, on a word or symbol that cannot finish a
            # sentence.
            sys.exit("  REFUSED %s: this stops mid-clause, so the PDF cut it: %r"
                     % (_where, _t))
        _k = (_les, re.sub(r"[^a-z0-9 ]", "", _t.lower()))
        if _k in _seen:
            sys.exit("  REFUSED %s: Cambridge revisits this in a later unit and it is "
                     "already on %s - one lesson must not offer it twice: %r"
                     % (_where, _seen[_k], _t))
        _seen[_k] = _p


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
