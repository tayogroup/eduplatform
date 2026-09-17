# -*- coding: utf-8 -*-
"""Cambridge's own Stage 4 success criteria, on the sticker shelf.

    python add-self-check.py            # report
    python add-self-check.py --write

THESE COME FROM THE GUIDE, NOT THE WORKBOOK, AND THAT IS FORCED BY THE PDF.

Grade 3's self-check is the Workbook's own "I can" statements, lifted verbatim.
The same source at Stage 4 does not survive extraction. Stage 3's Workbook wraps
a statement across lines but keeps word order, so joining the lines recovers the
sentence; Stage 4's interleaves fragments:

    1 I
    and
    to describe time before and
    can use a.m.
    p.m.
    after midday.

That is "I can use a.m. and p.m. to describe time before and after midday" with
its pieces shuffled. Re-ordering it is guessing at Cambridge's words. Measured
with one decidable test - is the item number followed immediately by "I can", or
is the "I" separated from its verb by fragments of the rest of the sentence:

    Stage 3 Workbook   110 items,  86 intact  (78%)
    Stage 4 Workbook   109 items,  25 intact  (23%)

and several of Stage 4's 25 are damaged INSIDE the clause anyway ("in steps of
one-digit numbers, hundreds and thousands. ten"). So a Workbook-sourced
self-check at Stage 4 would put mangled sentences on a child's screen.

THE SAME CLAIMS APPEAR TWICE IN THE BOOKS. Every unit of the Stage 4 Teacher's
Guide closes with "Success criteria", written as "Learners can ...", and those
survive far better: 127 of them, of which the 92 below read as whole sentences.
The conversion to learner voice is one substitution - "Learners can" to "I can"
- plus the pronouns that must follow it (their to my, them to me). That changes
no word order and invents no content, which is the whole difference between this
and repairing the Workbook.

WHAT IS NOT DONE, because each would be a guess:

  - a criterion whose clause is broken is DROPPED, not repaired. 35 of the 127:
    "Learners can shapes with parallel edges" (no verb), "Learners can any
    patterns see in counts", "Learners can estimates answer or Learners hundred
    10 tens ten 10 both, required".
  - a criterion that lost a fraction or a symbol is dropped with them, exactly as
    at Grade 3: "Learners can recognise that is equivalent to so must be
    equivalent to 25%" is missing both fractions.

TWO MECHANICAL REPAIRS ARE MADE and neither reorders anything. The extractor
sometimes doubles the prefix ("Learners can Learners can match a net to a 3D
shape") or runs two criteria together ("Learners can use to a in mirror Learners
can correct a shape that has been reflected incorrectly"); in both cases the
text after the LAST "Learners can" is a whole clause and is what is kept.

FILED BY UNIT, like Grade 3, and the mapping is read from the books rather than
guessed: each Guide page carrying Success criteria sits under a "Unit N" header,
and the 18 unit titles were recovered across all three Stage 4 books. Four
titles map to one lesson each; Number and Calculation recur in several units and
split by page, which is why the table below is keyed by PAGE.

Marks are per learner and per lesson in localStorage, and they are NEVER a
score: nothing is marked, nothing is reported, and no pass depends on them.

The Workbook's fourth line, "I need more help with:", is free text and is not
built - no standalone lesson build can take free text. See
docs/lesson-app-open-response-spec.md.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g4-self-check"

# Cambridge's own three points, from the Stage 4 Workbook self-check pages -
# read off the page, not carried over from Stage 3. Do not reduce this to two.
SCALE = [("yes", "I can do this"),
         ("trying", "I can do this, but I need to keep trying"),
         ("notyet", "I can't do this yet")]

# lesson -> [(statement, Teacher's Guide page)]
WORK = {
 # Units 1 and 9: Number - place value, negative numbers
 "big-numbers-below-zero": [
  ("I can explain the position of positive and negative numbers in relation to zero on a number line", "p27"),
  ("I can use my understanding of negative numbers when counts extend beyond zero", "p30"),
  ("I can say whether a number will appear in a given count", "p30"),
  ("I can explain the value of each digit in a number", "p35"),
  ("I can order a set of numbers, explaining which is the largest and which is the smallest", "p35"),
  ("I can say the value of the digits in a number", "p109"),
  ("I can read numbers in words and in numerals", "p109"),
  ("I can regroup numbers and explain why my regrouping is correct", "p109"),
 ],
 # Units 9 and 13: sequences, odd and even, factors and multiples
 "patterns-and-squares": [
  ("I can use my understanding of negative numbers to help work with sequences that extend back beyond zero", "p112"),
  ("I can identify the rule giving rise to a sequence", "p112"),
  ("I can begin to explain whether a sequence will include a given number", "p112"),
  ("I can explain what makes a number even or odd", "p115"),
  ("I can explain the result of adding pairs of even or odd numbers, and use this to reason about adding more than two numbers", "p115"),
  ("I can predict whether an answer will be even or odd without the need to calculate", "p115"),
  ("I can find missing numbers in a factor pair", "p118"),
  ("I can explain or show the relationship between factors and multiples", "p118"),
  ("I can extend a sequence using the term-to-term rule", "p149"),
  ("I can identify a one-step rule for a sequence", "p149"),
  ("I can use calculating skills and number facts to help me find terms", "p149"),
  ("I can use a test of divisibility to recognise numbers that are divisible by 2", "p157"),
  ("I can explain why multiples of 10 are also multiples of 2 and of 5", "p157"),
 ],
 # Units 3, 7 and 15: Calculation
 "ways-to-calculate": [
  ("I can regroup numbers in different ways and explain why my regrouping is correct", "p50"),
  ("I can use mental methods to add or subtract near multiples of 10", "p53"),
  ("I can compare and use different calculation methods and say what is the same", "p56"),
  ("I can regroup ones, tens or both, as required", "p56"),
  ("I can use subtraction facts to subtract a number of ones, tens or hundreds", "p59"),
  ("I can explain and use the relationship between the multiplication tables of 3, 6 and 9, for example that 5 x 9 is triple 5 x 3", "p61"),
  ("I can give related multiplication and division facts", "p61"),
  ("I can use addition and subtraction facts, including complements of 100, to help me identify missing numbers", "p89"),
  ("I can decide when to use a mental or written method and explain my choice", "p91"),
  ("I can use rounding to help me make estimates", "p91"),
  ("I can use estimates to check answers", "p91"),
  ("I can fluently recall the facts for the tables of 2 and 5", "p93"),
  ("I can complete the multiplication table of 7 up to 7 x 10", "p93"),
  ("I can interpret an array and say what multiplication it represents", "p95"),
  ("I can make estimates and explain whether an answer will be greater or smaller", "p95"),
  ("I can decompose three-digit numbers into hundreds, tens and ones", "p98"),
  ("I can multiply three-digit numbers by a one-digit number using mental and written methods", "p98"),
  ("I can explain that any symbol can be used to represent a missing number", "p166"),
  ("I can multiply a whole number by 10 and explain the effect", "p172"),
  ("I can divide a whole number by 10 and explain the effect", "p172"),
  ("I can explain why dividing by 10 is the inverse of multiplying by 10", "p172"),
  ("I can make estimates and explain whether the product will be more or less", "p177"),
 ],
 # Units 6, 11 and 17: Fractions, and percentages
 "parts-of-a-whole": [
  ("I can explain how many equal pieces the whole has been divided into and name each of the fractions", "p77"),
  ("I can count in fraction steps up to one", "p77"),
  ("I can explain how to find equivalent fractions", "p85"),
  ("I can explain or show why a pair of fractions are not equivalent", "p85"),
  ("I can draw diagrams to show fractions that are equivalent", "p135"),
  ("I can position equivalent fractions on a number line", "p135"),
  ("I can count on and back in fraction steps", "p138"),
  ("I can identify pairs of fractions that total 1", "p138"),
  ("I can use diagrams to represent adding and subtracting fractions", "p138"),
  ("I can compare fractions with different denominators, where one denominator is a multiple of the other", "p190"),
  ("I can find equivalent fractions and explain why they are equivalent", "p190"),
  ("I can add fractions with the same denominator, giving totals that are within or beyond 1", "p193"),
  ("I can use a square divided into 100 equal parts to explain relationships between percentages and fractions with denominator 100", "p196"),
 ],
 # Units 4 and 16: Time
 "telling-the-time": [
  ("I can record the time using the 12-hour clock", "p65"),
  ("I can convert between 12-hour and 24-hour times", "p65"),
  ("I can read calendars accurately, and know the number of days in each month", "p67"),
  ("I can explain the use of the 24-hour clock for timetables", "p67"),
  ("I can recall and apply the number of days in a week, and months in a year", "p186"),
  ("I can calculate the duration of events in days, hours and minutes", "p186"),
 ],
 # Units 2 and 10: shape, area and perimeter, 3D shapes and angles
 "shape-and-measures": [
  ("I can explain the difference between a tessellation and a compound shape", "p42"),
  ("I can describe the properties of a given compound shape, using the language of polygons", "p42"),
  ("I can calculate the area of compound and irregular shapes", "p44"),
  ("I can calculate the area of squares and rectangles", "p46"),
  ("I can explain the difference between area and perimeter", "p46"),
  ("I can choose appropriate units to measure perimeter", "p46"),
  ("I can describe the properties of 3D shapes", "p124"),
  ("I can match a net to a 3D shape", "p124"),
  ("I can make and recognise quarter, half and whole turns", "p126"),
  ("I can recognise and define acute, right and obtuse angles", "p126"),
 ],
 # Units 12 and 18: Angles, position and direction
 "where-things-are": [
  ("I can use compass directions to give the directions through a maze or map", "p143"),
  ("I can understand coordinates when one of the numbers is zero, such as (0, 3) or (6, 0)", "p145"),
  ("I can plot coordinates accurately", "p200"),
  ("I can reason about shapes with vertices plotted on a coordinate grid", "p200"),
  ("I can correct a shape that has been reflected incorrectly", "p202"),
 ],
 # Units 5, 8 and 14: Statistical methods, and Probability
 "asking-sorting-chance": [
  ("I can use sorting diagrams to aid research and investigations", "p71"),
  ("I can read and interpret different charts", "p74"),
  ("I can decide how to present data", "p74"),
  ("I can understand and use the language of probability", "p101"),
  ("I can understand and explain the need for accuracy through large numbers of tests", "p104"),
  ("I can explain why some outcomes are equally likely and some are more or less likely, depending on the experiment", "p104"),
  ("I can read and interpret bar charts accurately", "p161"),
  ("I can understand the need for different vertical scales", "p161"),
  ("I can decide how to collect information relevant to a given topic", "p163"),
 ],
}

# ---- audits ------------------------------------------------------------------
# One rule per fault the Grade 3 table shipped before it was read by hand.
DEBRIS = re.compile(r"\.\s*\S{1,3}$")
LEFTOVER = re.compile(r"\bLearners\b|\btheir\b|\bthem\b", re.I)
DANGLING = re.compile(r"(?:\b(?:and|or|the|a|an|of|with|to|in|by|than|"
                      r"between|into|using|that|is|are)|[<>+=-])$", re.I)
TIGHT_LIST = re.compile(r"\d,\d")

if len(SCALE) != 3:
    sys.exit("  REFUSED: the Stage 4 Workbook offers THREE points, not %d" % len(SCALE))

_seen = {}
for _les, _items in WORK.items():
    for _t, _p in _items:
        _w = "%s %s" % (_les, _p)
        if not re.match(r"^I can\b", _t):
            sys.exit("  REFUSED %s: does not open 'I can': %r" % (_w, _t))
        if LEFTOVER.search(_t):
            sys.exit("  REFUSED %s: teacher voice survived the conversion - this is "
                     "written for the child to read about themselves: %r" % (_w, _t))
        if re.search(r"[^\x20-\x7e]", _t):
            sys.exit("  REFUSED %s: a byte did not survive the PDF: %r"
                     % (_w, re.findall(r"[^\x20-\x7e]", _t)))
        if DEBRIS.search(_t) or _t.endswith("."):
            sys.exit("  REFUSED %s: trailing debris or a full stop: %r" % (_w, _t))
        if DANGLING.search(_t) or len(_t) < 25:
            sys.exit("  REFUSED %s: this stops mid-clause, so the PDF cut it: %r"
                     % (_w, _t))
        if TIGHT_LIST.search(_t):
            sys.exit("  REFUSED %s: a run lost its spaces: %r" % (_w, _t))
        _k = (_les, re.sub(r"[^a-z0-9 ]", "", _t.lower()))
        if _k in _seen:
            sys.exit("  REFUSED %s: already on %s in this lesson: %r"
                     % (_w, _seen[_k], _t))
        _seen[_k] = _p

HEAD = ("What I can do",
        "Cambridge asks these about this lesson. Tick the ones that are true for "
        "you. Nothing here is marked and nobody is told - it is for you.")


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


def js(lesson, items):
    rows = ", ".join("{ t: %s, p: %s }" % (lit(t), lit(p)) for t, p in items)
    scale = ", ".join('["%s", "%s"]' % (k, v) for k, v in SCALE)
    return ('\n  /* ==== ' + MARK + ': Stage 4\'s own success criteria ====\n'
            '     From the Teacher\'s Guide rather than the Workbook, because the\n'
            '     Workbook\'s "I can" statements are 23% recoverable from the PDF\n'
            '     against Stage 3\'s 78%. One substitution, "Learners can" to "I\n'
            '     can", and the pronouns that follow it. NEVER a score: no mark, no\n'
            '     report, no pass depends on it. */\n'
            '  const SC_KEY = "ehel-g4-sc-' + lesson + '";\n'
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
            '       must be able to say nothing, not only swap to another answer */\n'
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
  .sc-opt { font: inherit; font-size: 13px; padding: 5px 11px; margin: 0 6px 6px 0;
    border-radius: 999px; border: 1px solid var(--line, #ddd);
    background: var(--card, #fff); color: var(--muted, #555); cursor: pointer; }
  .sc-opt.on { background: var(--good-soft, #e6f1ea); border-color: var(--good, #2f6f4a);
    color: var(--good, #2f6f4a); font-weight: 600; }
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

    m = re.search(r'(<div class="stickers"[^>]*id="stickers"[^>]*>\s*</div>)', s)
    if not m:
        m = re.search(r'(<div[^>]*id="stickers"[^>]*>[\s\S]{0,80}?</div>)', s)
    if not m:
        print("  REFUSED    %-26s no sticker shelf to sit under" % slug)
        refused += 1
        continue
    anchor = "  show(0, false);"
    if s.count(anchor) != 1:
        print("  REFUSED    %-26s show(0,false) x%d" % (slug, s.count(anchor)))
        refused += 1
        continue

    items = WORK[slug]
    out = s[:m.end()] + '\n      <div id="selfcheck"></div>' + s[m.end():]
    out = out.replace(anchor, js(slug, items) + anchor, 1)
    out = out.rstrip() + "\n" + STYLE
    if out.count(MARK) != 2 or out.count('id="selfcheck"') != 1:
        print("  REFUSED    %-26s marker %d, host %d"
              % (slug, out.count(MARK), out.count('id="selfcheck"')))
        refused += 1
        continue

    todo.append((p, out))
    total += len(items)
    print("  would      %-26s %2d statement(s)" % (slug, len(items)))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d statement(s) across %d lesson(s) %s, %d already done, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, refused,
         "" if WRITE else "   (--write to apply)"))
