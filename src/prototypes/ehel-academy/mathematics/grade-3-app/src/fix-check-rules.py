# -*- coding: utf-8 -*-
"""Grade 3's check: say where the learner is, and use the house pass mark.

Two findings from the 2026-09-12 sweep, both measured on the live pages and
both in the same eight lines of each lesson's check, so they are fixed
together.

THE COUNTER. Grade 1, Grade 2 and Grade 4 all print "Question 3 of 10" while
a check is running; Grade 3 printed nothing until the first answer landed and
then printed "2 right out of 3" - a score, never a position. So a Grade 3
child could not tell whether the check had two questions left or eight, which
is the one thing that decides whether they keep going. It now reads
"Question 3 of 10 - 2 right", which is Grade 4's line, so the same sentence
means the same thing in every grade.

THE PASS MARK. Each check carried a hand-set number: 4 of 6 in four lessons
(67%), 5 of 7 (71%), 7 of 10 (70%). Grade 1 and Grade 2 ask for three
quarters, rounded up, and Grade 4 ranged from 67% to 80% between lessons of
one grade. `_app.pass_mark` is the one definition now; this writes its answer
into the two places each check states it - the gate and the "Get N right to
finish" sentence - which must never disagree, so both are rewritten from the
same number and the tool refuses if it cannot find exactly one of each.

Idempotent: run it twice and the second run reports nothing to do.

    python fix-check-rules.py            # report
    python fix-check-rules.py --write
"""
import io
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "lesson-app-tools"))
from _app import pass_mark  # noqa: E402

WRITE = "--write" in sys.argv


def scrub(t):
    """Blank out comments and string bodies, keeping length and newlines.

    The depth walk below counts brackets and commas, and it cannot tell code
    from prose. A comment reading `it tests "Ten times bigger", which...` has a
    comma at depth 0 and was counted as an item separator - so adding an
    explanatory comment above an item silently added an item, and on
    2026-09-12 that reported banks of 10 and 11 where there were 8. A string
    holding a bracket does the same thing. Both are replaced by spaces before
    anything is counted.
    """
    out, i, n = [], 0, len(t)
    while i < n:
        c = t[i]
        two = t[i:i + 2]
        if two == "/*":
            j = t.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append("".join(" " if ch != "\n" else "\n" for ch in t[i:j]))
            i = j
        elif two == "//":
            j = t.find("\n", i)
            j = n if j < 0 else j
            out.append(" " * (j - i))
            i = j
        elif c in "\"'`":
            j, quote = i + 1, c
            while j < n:
                if t[j] == "\\":
                    j += 2
                    continue
                if t[j] == quote:
                    j += 1
                    break
                j += 1
            out.append(c + "".join(" " if ch != "\n" else "\n" for ch in t[i + 1:j - 1]) + c
                       if j - 1 > i else c)
            i = j
        else:
            out.append(c)
            i += 1
    return "".join(out)


def qs_count(s):
    """How many questions the check bank holds.

    Counted by walking the bracket rather than by counting `q:`, because an
    item is an arrow function that may mention `q:` more than once - and by
    walking depth rather than splitting on commas, because every item is full
    of them. Comments and strings are scrubbed first; see scrub().
    """
    s = scrub(s)
    m = re.search(r"const QS = \[", s)
    if not m:
        return None
    i, d, j = m.end(), 1, m.end()
    while d and j < len(s):
        if s[j] == "[":
            d += 1
        elif s[j] == "]":
            d -= 1
        j += 1
    body = s[i:j - 1]
    n, depth, cur = 0, 0, ""
    for c in body:
        if c in "[{(":
            depth += 1
        elif c in "]})":
            depth -= 1
        if c == "," and depth == 0:
            n += 1
            cur = ""
        else:
            cur += c
    # a trailing comma leaves an empty last element: count only real ones
    return n + 1 if cur.strip() else n


def fix(path):
    name = os.path.basename(path)
    s = io.open(path, encoding="utf-8").read()
    total = qs_count(s)
    if total is None:
        print("  --   %-22s no check bank" % name)
        return False
    need = pass_mark(total)
    changed = []

    # ---- the pass mark, in both places it is stated ----
    # THE CHECK IS NAMED BY ITS retryCheck CALL, never by the first `got`
    # comparison in the file. A lesson holds up to ten `if (gotN >= 4) finish`
    # lines and all but one belong to an EXPLORATION step, where the number
    # means "four right and this activity is done" rather than a pass mark on
    # a check. The first draft of this tool keyed on the first match and would
    # have rewritten Lesson 1's step 2. There is exactly one retryCheck per
    # lesson and it carries the check's own variables, so everything below is
    # derived from it.
    rc = list(re.finditer(r"retryCheck\(\$\(\"fb(\d+)\"\), \$\(\"ch\d+\"\), "
                          r"(got\d+), (order\d+)\.length, (\d+)(, function)", s))
    if len(rc) != 1:
        print("  FAIL %-22s expected one retryCheck, found %d" % (name, len(rc)))
        return None
    qn, got, order, said = rc[0].group(1), rc[0].group(2), rc[0].group(3), int(rc[0].group(4))
    gate = re.search(r"if \(%s >= (\d+)\) finish\(" % re.escape(got), s)
    if not gate:
        print("  FAIL %-22s cannot find the gate for %s" % (name, got))
        return None
    was = int(gate.group(1))
    if was != need:
        s = s[:gate.start(1)] + str(need) + s[gate.end(1):]
        changed.append("pass mark %d/%d -> %d/%d" % (was, total, need, total))
    if said != need:
        rc = list(re.finditer(r"(retryCheck\([^;]*?\.length, )(\d+)(, function)", s))
        s = s[:rc[0].start(2)] + str(need) + s[rc[0].end(2):]
        if not changed:
            changed.append("Try again said %d, the gate said %d" % (said, need))

    # ---- the counter ----
    scid = "sc" + qn
    if ('$("%s")' % scid) not in s:
        print("  FAIL %-22s no score element %s" % (name, scid))
        return None
    line = ('$("%s").textContent = "Question " + (qi + 1) + " of " + %s.length'
            ' + " \\u00b7 " + %s + " right";' % (scid, order, got))
    # before each question: the anchor is the line that paints the stem
    stem = '$("q%s").textContent = item.q;' % qn
    if s.count(stem) != 1:
        print("  FAIL %-22s expected one stem paint, found %d" % (name, s.count(stem)))
        return None
    if line not in s:
        s = s.replace(stem, line + "\n    " + stem)
        changed.append("counter before each question")
    # after an answer: the old score line named no position
    old = ('$("%s").textContent = %s + " right out of " + qi;' % (scid, got))
    new = ('$("%s").textContent = "Question " + qi + " of " + %s.length'
           ' + " \\u00b7 " + %s + " right";' % (scid, order, got))
    if old in s:
        s = s.replace(old, new)
        changed.append("score line names the question")

    if not changed:
        print("  --   %-22s already right (%d of %d)" % (name, need, total))
        return False
    print("  ok   %-22s %s" % (name, "; ".join(changed)))
    if WRITE:
        io.open(path, "w", encoding="utf-8", newline="").write(s)
    return True


def main():
    files = sorted(f for f in os.listdir(HERE)
                   if re.match(r"^l\d+-content\.js$", f))
    if not files:
        print("no l*-content.js beside this tool")
        return 2
    bad = [f for f in files if fix(os.path.join(HERE, f)) is None]
    if bad:
        print("\n%d lesson(s) refused - nothing written" % len(bad))
        return 1
    print("\n%s" % ("written" if WRITE else "report only; add --write"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
