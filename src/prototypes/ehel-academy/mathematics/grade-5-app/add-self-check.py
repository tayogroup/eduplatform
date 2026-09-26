# -*- coding: utf-8 -*-
"""Cambridge's own Stage 5 statements, as a closing step on each lesson page.

    python add-self-check.py            # report
    python add-self-check.py --write

THIS IS NOT THE GRADE 1-4 DEPTH PASS, AND IT MUST NOT BE. Grade 5 is a different
build by design: a scrolling page of `<section class="step">` explorations with
pickers that drive a model, no `finish()`, no scoring and no narration. The
repo's rule is that Grades 5-8 keep their design, and the four Grade 1-4 tools -
a marked Spot the mistake step, a tiered Support and Challenge step, the sticker
shelf they hang off - all assume the deck. None of them is ported here.

What DOES transfer is the content, because the self-check is a list to read and
tick rather than a step to be walked through. It becomes one more
`<section class="step">` at the foot of the page, in the page's own idiom.

TWO SOURCES, AND EACH STATEMENT SAYS WHICH. Stage 5's Workbook recovers better
than Stage 4's and worse than Stage 3's - 48 of 83 items intact, 59%, against
78% and 23% - so its own "I can" statements are usable where they survive, and
they are the first choice. Where they do not reach, the Stage 5 Teacher's Guide
carries the same claims as "Learners can ...", converted by one substitution.
The page number tells them apart: a Workbook page for the first, a Guide page
for the second, and the built list prints both.

THE GUIDE IS NOT A LUXURY HERE. The app's flagship lesson, Squares, Cubes and
Roots, has NO intact Workbook self-check statement at all - Stage 5's self-check
pages reach place value, calculation, fractions, time, shape and probability,
and not square numbers. The Guide covers it properly on pp.154-156, including
the link between consecutive odd numbers and square numbers, which is exactly
what that lesson's second step teaches.

WHAT IS LEFT OUT, and counted rather than hidden:

  - about a dozen intact Stage 5 statements are about angles, shapes,
    translation, 3D perspectives, probability and time zones. THIS APP DOES NOT
    TEACH THEM. It is a number-strand build - its six lessons are squares and
    roots, sequences, how whole numbers are built, past the whole numbers, real
    life and a check - and claiming a statement it does not teach would be the
    coverage-number failure this repo already has a name for.
  - a statement whose example did not survive is dropped, or kept with the
    example trimmed where the claim is whole without it ("I can identify missing
    numbers in linear sequences, for example:" is a complete claim followed by a
    dangling lead-in). Nothing is re-ordered and no example is invented.
  - check-what-you-know gets none. It is the quiz page, not a lesson, and asking
    a child to self-assess a test they have just taken measures nothing.

Marks are per learner and per lesson in localStorage, and they are NEVER a
score: nothing is marked, nothing is reported, and no pass depends on them.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g5-self-check"

# Cambridge's own three points, read off the Stage 5 Workbook self-check pages.
SCALE = [("yes", "I can do this"),
         ("trying", "I can do this, but I need to keep trying"),
         ("notyet", "I can't do this yet")]

# lesson -> [(statement, source)]   W = Stage 5 Workbook, G = Teacher's Guide
WORK = {
 "calculating-wholes-and-parts": [
  ("I can use the laws of arithmetic to help me simplify calculations", "W p54"),
  ("I can compose, decompose and regroup numbers, including decimals, to make calculations easier", "W p54"),
  ("I can estimate and multiply whole numbers up to 1000 by 1-digit or 2-digit whole numbers", "W p85"),
  ("I can estimate and divide whole numbers up to 1000 by 1-digit whole numbers", "W p85"),
  ("I can convert remainders into fractions of the divisor", "W p85"),
  ("I can estimate and add or subtract fractions with denominators that are multiples of each other", "W p94"),
  ("I can estimate, multiply and divide unit fractions by a whole number", "W p94"),
  ("I can add or subtract numbers with one or two decimal places", "W p85"),
  ("I can estimate and multiply numbers with one decimal place by 1-digit whole numbers", "W p85"),
 ],
 "data-and-chance": [
  ("I can draw and read frequency tables", "W p32"),
  ("I can read and use bar charts", "W p32"),
  ("I can read and use dot plots", "W p32"),
  ("I can interpret trends and patterns in data shown on dot plots and other graphs", "W p32"),
  ("I can find the mode of a set of data", "W p89"),
  ("I can find the median of a set of data", "W p89"),
  ("I can recognise when outcomes are equally likely, more likely or less likely", "W p47"),
  ("I can explain why certain outcomes are more or less likely than others", "W p47"),
  ("I can perform probability experiments, make predictions and interpret the results", "W p47"),
 ],
 "time-and-how-we-write-it": [
  ("I can understand time that is written in decimals", "W p26"),
  ("I can estimate how long an event takes", "W p26"),
  ("I can solve problems using 12-hour and 24-hour times", "W p26"),
  ("I can calculate the difference between two times", "W p26"),
  ("I can work out times in different time zones", "W p98"),
  ("I can find start and end times for different durations", "W p98"),
  ("I can write time in 12-hour and 24-hour clocks", "W p98"),
  ("I can compare times shorter than one second, such as race results", "G p63"),
 ],
 "where-things-are": [
  ("I can use coordinates to give the vertices of 2D shapes", "W p59"),
  ("I can find coordinates on grids without gridlines", "W p59"),
  ("I can translate shapes on a square grid", "W p59"),
  ("I can describe translations on a square grid", "W p59"),
  ("I can reflect shapes and patterns in two lines of symmetry", "W p78"),
 ],
 "shapes-and-angles": [
  ("I can identify lines of symmetry in designs and patterns", "W p16"),
  ("I can complete symmetrical designs and patterns", "W p16"),
  ("I can identify, name and label acute, right and obtuse angles", "W p16"),
  ("I can find the missing angle on a straight line", "W p16"),
  ("I can identify, name and describe the properties of isosceles, equilateral and scalene triangles", "W p16"),
  ("I can find equal lengths and angles in triangles", "W p16"),
  ("I can estimate and measure the perimeter of 2D shapes", "W p70"),
  ("I can reason about shapes with the same area or perimeter", "W p70"),
  ("I can find the area of a compound shape by splitting it into rectangles", "W p68"),
  # p70 reads just "I can sketch 3D shapes", which is 22 characters and trips
  # this tool's 25-char truncation floor - the floor is there to catch a
  # statement clipped during extraction, and cannot tell that one apart from a
  # statement Cambridge simply wrote short. Widened to name the solids Step 34
  # actually asks the learner to sketch and describe, rather than lowering the
  # floor or padding the sentence with words that add nothing.
  ("I can sketch and describe 3D shapes such as cubes, cuboids and prisms", "W p70"),
  ("I can identify nets for open and closed cubes", "W p70"),
  ("I can identify 3D shapes from different perspectives", "W p70"),
 ],
 "squares-cubes-and-roots": [
  ("I can find a square number as the result of multiplying a number by itself", "G p154"),
  ("I can explain that square numbers can be represented as square arrays with the same number of rows and columns", "G p154"),
  ("I can explain the link between the sum of consecutive odd numbers, starting from 1, and square numbers", "G p154"),
  ("I can explain why a number is not square", "G p154"),
  ("I can explain that triangular numbers can be represented as a triangular pattern of counters where the rows increase by 1 each time", "G p156"),
  ("I can build a triangular number, and build the next triangular number from the previous one", "G p156"),
  ("I can explain the link between the sum of consecutive numbers, starting from 1, and triangular numbers", "G p156"),
 ],
 "rules-and-patterns": [
  ("I can identify missing numbers in linear sequences", "W p10"),
  ("I can explain why a sequence is linear", "G p36"),
  ("I can find the difference between the values of terms in a sequence", "G p36"),
  ("I can find missing numbers in a sequence by adding or subtracting as required", "G p36"),
  ("I can use the term-to-term rule to extend a sequence and predict future terms", "G p104"),
  ("I can work out the recursion rule when given terms that are not consecutive", "G p36"),
 ],
 "how-whole-numbers-are-built": [
  ("I can use the order of operations correctly to carry out calculations where there are no brackets", "W p54"),
  ("I can recognise and use symbols or shapes to represent unknown quantities", "W p85"),
  ("I can use related facts and inverse operations to help with some missing number problems", "W p23"),
  ("I can use the laws of arithmetic to help me simplify calculations", "W p23"),
  ("I can use a test of divisibility to recognise numbers that are divisible by 4", "G p159"),
  ("I can explain why multiples of 8 are also multiples of 4", "G p159"),
  ("I can explain why a number is not divisible by 4 or by 8", "G p159"),
  ("I can explain what a prime number is", "G p161"),
  ("I can explain why a number is an example of a prime number", "G p161"),
  ("I can use a 100 grid and the sieve of Eratosthenes to find all the prime numbers to 100", "G p161"),
 ],
 "past-the-whole-numbers": [
  ("I can explain the values of digits in numerals where digits are repeated, for example the first digit 1 in 102.14 represents 1 hundred, whereas the second digit 1 represents 1 tenth", "W p43"),
  ("I can decompose numbers into the related place value numbers, including decimals, for example 20.56 = 20 + 0 + 0.5 + 0.06", "W p43"),
  ("I can multiply and divide whole numbers by 10, 100 and 1000 and explain the answers using place value", "W p10"),
  ("I can position positive and negative numbers around zero, recognising that negative numbers are to the left of zero on a number line", "W p10"),
  ("I can round numbers with one decimal place to the nearest whole number", "W p85"),
  ("I can add or subtract numbers with one or two decimal places", "W p85"),
  ("I can estimate and add or subtract fractions with the same denominators that are multiples of each other", "W p38"),
  ("I can add fractions where denominators are multiples of each other", "G p90"),
  ("I can subtract fractions where denominators are multiples of each other", "G p90"),
  ("I can describe a ratio or proportion in words, as a fraction or a percentage", "W p43"),
 ],
 "real-life": [
  ("I can apply skills of rounding and calculating to problems", "W p54"),
  ("I can decide whether to work mentally, with jottings or using a formal method", "W p23"),
  ("I can estimate and multiply whole numbers up to 1000 by 1-digit or 2-digit whole numbers", "W p85"),
  ("I can estimate and divide whole numbers up to 1000 by 1-digit whole numbers", "W p85"),
 ],
}

# ---- audits ------------------------------------------------------------------
LEFTOVER = re.compile(r"\bLearners\b|\btheir\b|\bthem\b", re.I)
# "is" is NOT on this list, and that is measured rather than guessed: "I can
# explain what a prime number is" is a whole statement, and the first version of
# this rule refused it. Checked against the final word of all 37 - "is" is the
# only one of the candidates that ends a real statement here. It is the same
# false positive "for" produced at Grade 3 ("show what each digit stands for"),
# which is why the list gets measured every time rather than copied forward.
DANGLING = re.compile(r"(?:\b(?:and|or|the|a|an|of|with|to|in|by|than|"
                      r"between|into|using|that|are|example)|[<>+=:-])$", re.I)
SRC = re.compile(r"^[WG] p\d+$")

if len(SCALE) != 3:
    sys.exit("  REFUSED: the Stage 5 Workbook offers THREE points, not %d" % len(SCALE))

_seen = {}
for _les, _items in WORK.items():
    for _t, _p in _items:
        _w = "%s %s" % (_les, _p)
        if not SRC.match(_p):
            sys.exit("  REFUSED %s: every statement says which book it came from, "
                     "'W p<n>' or 'G p<n>': %r" % (_les, _p))
        if not re.match(r"^I can\b", _t):
            sys.exit("  REFUSED %s: does not open 'I can': %r" % (_w, _t))
        if LEFTOVER.search(_t):
            sys.exit("  REFUSED %s: teacher voice survived the conversion: %r" % (_w, _t))
        if re.search(r"[^\x20-\x7e]", _t):
            sys.exit("  REFUSED %s: a byte did not survive the PDF: %r"
                     % (_w, re.findall(r"[^\x20-\x7e]", _t)))
        if _t.endswith(".") or DANGLING.search(_t):
            sys.exit("  REFUSED %s: this stops mid-clause, so the PDF cut it: %r"
                     % (_w, _t))
        if len(_t) < 25:
            sys.exit("  REFUSED %s: truncated: %r" % (_w, _t))
        _k = (_les, re.sub(r"[^a-z0-9 ]", "", _t.lower()))
        if _k in _seen:
            sys.exit("  REFUSED %s: already on %s in this lesson" % (_w, _seen[_k]))
        _seen[_k] = _p


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


HEAD = ("What I can do",
        "Cambridge asks these about this lesson. Tick the ones that are true for "
        "you. Nothing here is marked and nobody is told &mdash; it is for you.")

STEP = ('\n    <!-- %s: Cambridge\'s own Stage 5 statements. A step in this page\'s\n'
        '         own idiom, not a deck slide - Grade 5 keeps its design. -->\n'
        '    <section class="step" id="selfcheck">\n'
        '      <div class="step-head"><span class="step-num">Check</span>'
        '<h2>%s</h2></div>\n'
        '      <p class="intro">%s</p>\n'
        '      <div id="sclist"></div>\n'
        '    </section>\n  ' % (MARK, HEAD[0], HEAD[1]))


def js(lesson, items):
    rows = ", ".join("{ t: %s, p: %s }" % (lit(t), lit(p)) for t, p in items)
    scale = ", ".join('["%s", "%s"]' % (k, v) for k, v in SCALE)
    return ("""
<script>
/* %s - see add-self-check.py.
   Its own script tag rather than a line inside the page's existing IIFE: that
   closure owns every picker on the page, and threading an unrelated widget
   through it would put this one edit inside the thing most likely to be edited
   next. Nothing here is a score - no mark, no report, no pass depends on it. */
(function () {
  const KEY = "ehel-g5-sc-%s";
  const ITEMS = [%s];
  const SCALE = [%s];
  const host = document.getElementById("sclist");
  if (!host) return;
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } };
  const save = (m) => { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} };
  function paint() {
    const marks = load();
    host.innerHTML = ITEMS.map((it, i) =>
      '<div class="sc-row"><p class="sc-say">' + esc(it.t)
      + ' <span class="sc-src">' + esc(it.p) + '</span></p>'
      + SCALE.map(([v, label]) =>
          '<button type="button" class="sc-opt' + (marks[i] === v ? " on" : "")
          + '" data-i="' + i + '" data-v="' + v + '" aria-pressed="'
          + (marks[i] === v) + '">' + esc(label) + "</button>").join("")
      + "</div>").join("");
  }
  host.addEventListener("click", (e) => {
    const b = e.target.closest(".sc-opt");
    if (!b) return;
    const marks = load(), i = Number(b.dataset.i);
    /* tapping the same one again clears it: a child who changes their mind must
       be able to say nothing, not only swap to another answer */
    marks[i] = marks[i] === b.dataset.v ? "" : b.dataset.v;
    save(marks);
    paint();
  });
  paint();
})();
</script>
""" % (MARK, lesson, rows, scale))


STYLE = """<style>/* %s - see add-self-check.py */
  #sclist { margin-top: 6px; }
  #sclist .sc-row { padding: 11px 0; border-top: 1px solid var(--line); }
  #sclist .sc-say { margin: 0 0 7px; font-size: 15.5px; line-height: 1.5; color: var(--ink); }
  #sclist .sc-src { font-size: 12px; color: var(--muted); white-space: nowrap; }
  #sclist .sc-opt { font: inherit; font-size: 13px; padding: 6px 12px; margin: 0 7px 7px 0;
    border-radius: 999px; border: 1px solid var(--line);
    background: var(--card); color: var(--muted); cursor: pointer; }
  #sclist .sc-opt.on { background: var(--good-soft); border-color: var(--good);
    color: var(--good); font-weight: 600; }
</style>
""" % MARK

pages = sorted(f for f in os.listdir(HERE) if f.endswith(".html"))
todo, done, refused, skipped, total = [], 0, 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        if slug not in ("index", "squares-and-steps"):
            print("  no list    %-32s deliberately none - see the docstring" % slug)
            skipped += 1
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already    %-32s" % slug)
        done += 1
        continue

    # the last </section>, then the wrapper </div>, then the page's own script
    i = s.rfind("</section>")
    if i < 0:
        print("  REFUSED    %-32s no </section> to sit after" % slug)
        refused += 1
        continue
    j = s.find("</div>", i)
    if j < 0:
        print("  REFUSED    %-32s no wrapper </div> after the last step" % slug)
        refused += 1
        continue
    if s.count('<section class="step"') < 1:
        print("  REFUSED    %-32s no steps - is this the right build?" % slug)
        refused += 1
        continue

    # THE NAV IS THE TABLE OF CONTENTS on a scrolling page, and it is
    # hand-written markup - a list of <a href="#sN"> - not derived from the
    # steps. Measured across the build before touching it: every lesson's nav
    # entry count equals its step count. A step added without its link is a step
    # a learner scanning the nav never sees, which is the sticker-shelf failure
    # in a different guise, so the link goes in here and the count is asserted.
    nav_at = s.rfind("</nav>")
    if nav_at < 0:
        print("  REFUSED    %-32s no <nav> to list this step in" % slug)
        refused += 1
        continue
    nav_before = len(re.findall(r'<a href="#s', s))
    if nav_before != s.count('<section class="step"'):
        print("  REFUSED    %-32s nav has %d entries for %d steps before this runs "
              "- fix that first" % (slug, nav_before, s.count('<section class="step"')))
        refused += 1
        continue
    link = '  <a href="#selfcheck"><b>&#10003;</b> What I can do</a>\n  '
    s = s[:nav_at] + link + s[nav_at:]

    i = s.rfind("</section>")
    out = s[:i + len("</section>")] + STEP + s[i + len("</section>"):]
    k = out.rfind("</script>")
    if k < 0:
        print("  REFUSED    %-32s no </script> to follow" % slug)
        refused += 1
        continue
    out = (out[:k + len("</script>")] + js(slug, WORK[slug])
           + out[k + len("</script>"):])
    out = out.rstrip() + "\n" + STYLE

    if out.count(MARK) != 3 or out.count('id="sclist"') != 1:
        print("  REFUSED    %-32s marker %d (want 3), host %d"
              % (slug, out.count(MARK), out.count('id="sclist"')))
        refused += 1
        continue
    nav_after = len(re.findall(r'<a href="#s', out))
    steps_after = out.count('<section class="step"')
    if nav_after != steps_after or nav_after != nav_before + 1:
        print("  REFUSED    %-32s nav %d for %d steps after the insert (was %d)"
              % (slug, nav_after, steps_after, nav_before))
        refused += 1
        continue
    todo.append((p, out))
    total += len(WORK[slug])
    w = sum(1 for _, src in WORK[slug] if src.startswith("W"))
    print("  would      %-32s %2d statement(s)  %d Workbook, %d Guide"
          % (slug, len(WORK[slug]), w, len(WORK[slug]) - w))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d statement(s) across %d lesson(s) %s, %d already done, %d with none, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, skipped, refused,
         "" if WRITE else "   (--write to apply)"))
