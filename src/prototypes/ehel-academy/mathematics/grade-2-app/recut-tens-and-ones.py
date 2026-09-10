# -*- coding: utf-8 -*-
"""Take the fractions step and the money step out of Tens and Ones.

WHY. Tens and Ones is the one Grade 2 lesson that is not about one thing. After
the 2026-09-09 recut every step in this build is Stage 2 -- that half is done --
but the lesson still ends by teaching FRACTIONS and MONEY, and this build has a
nine-step fractions lesson and a nine-step money lesson of its own:

  Tens and Ones 16  "Halves and quarters"  cut the bar into equal parts, tap to shade
  Fair Shares    1  "Equal parts first"    a fraction only works when the parts are equal
  Fair Shares    2  "Top number, bottom number"

  Tens and Ones 17  "Money"                pay for it with coins, tap until exactly right
  Coins and Change 3 "Make this exact amount"  tap coins and notes until the purse holds
                                              exactly the right amount

The same activity, taught twice, the second time in more depth. That is the
fault the Grade 4 recut was written for, arriving in Grade 2 with the survey
lesson still standing after the out-of-stage material was removed from it.

COVERAGE DOES NOT MOVE, and this was checked before a line was deleted rather
than asserted afterwards. Fair Shares teaches 2Nf.01 (equal parts), 2Nf.02 (a
quarter of a set, step 3), 2Nf.04 (fractions as operators, steps 3 and 9),
2Nf.05 (steps 4 and 5) and 2Nf.06 (steps 7 and 8) across nine steps; Coins and
Change teaches 2Nm.01 (steps 1 and 7) and 2Nm.02 (step 8). What the two removed
steps carried, the two owning lessons carry at more length.

The ANNOTATIONS do move, and that is the whole reason this script edits a second
file. 2Nf.01, 2Nf.02 and 2Nf.04 were written down in Tens and Ones step 16 and
NOWHERE ELSE in the build -- Fair Shares annotates only 2Nf.05 -- so deleting the
step would delete the only record that this grade teaches them, while leaving the
teaching in place. A coverage count is not a fact about a course if it lives on
the one step that gets cut.

DELETING A STEP BREAKS THE HELPER THAT HAPPENED TO SIT BESIDE IT. The money
block declares `choices()` and `reveal()` at top level, and SEVEN other steps
call them -- 6b, 11, 12, 13, 14, 15 and 16 by the file's own block numbering, or
Tables by heart, A quick look, Numbers in words, Which is more, First second
third, Make 20 make 100 and One undoes the other by name. They are hoisted
function declarations, so nothing in the file reads as if it depends on where
they live, and no static check would have said a word: the page parses and the
gate passes while seven steps throw on first tap. They are moved up beside
lines() before the block is removed. The README records the same failure from
2026-09-09 -- "neither static check saw either" -- twice, which is why this was
looked for rather than discovered.

Idempotent: it reports and changes nothing on a second run.

  python recut-tens-and-ones.py          # what it would do
  python recut-tens-and-ones.py --write
"""
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unknown argument %r -- this script edits lesson pages in place" % a)

LESSON = "tens-and-ones.html"
FRACTIONS = "fair-shares.html"
HUB = "g2-index.html"

# The two steps, by the heading a learner reads. Named by TITLE rather than by
# index because the index is what the recut changes and a rerun must still be
# able to say "already gone".
DROP = ["Halves and quarters", "Money"]

# Its own top-level declarations, which go with it. Everything here was checked
# for use outside the block; choices and reveal are the two that are used and
# they are moved instead.
MOVE = ["choices", "reveal"]


def sections(s):
    """(start, end, title) per <section class="slide">."""
    idx = [m.start() for m in re.finditer(r'<section class="slide"', s)]
    end = s.rindex("</section>") + len("</section>")
    out = []
    for i, p in enumerate(idx):
        stop = idx[i + 1] if i + 1 < len(idx) else end
        h = re.search(r"<h2>(.*?)</h2>", s[p:stop])
        out.append((p, stop, re.sub(r"<[^>]*>", "", h.group(1)) if h else ""))
    return out


def js_blocks(s):
    """(start, end, label) per /* ---- N: ---- */ slide block."""
    marks = [(m.start(), m.group(1)) for m in re.finditer(r"/\* -+ *(\d+\w*|check|stickers)", s)]
    out = []
    for i, (p, lab) in enumerate(marks):
        out.append((p, marks[i + 1][0] if i + 1 < len(marks) else len(s), lab))
    return out


def whole_function(s, name):
    """The text of a top-level `function name(...) {...}`, braces balanced."""
    i = s.index("\n  function %s(" % name)
    k = s.index("{", i)
    d = 0
    while True:
        if s[k] == "{":
            d += 1
        elif s[k] == "}":
            d -= 1
            if d == 0:
                break
        k += 1
    return s[i + 1:k + 1]


def hub_step_count(write):
    """The hub card's "N steps" is hand-kept in this build -- there is no
    build-hub.py here as there is at Grade 4 -- so it is derived and rewritten
    from the lesson itself. It said 17 while the lesson had 15, which is the
    same drift Grade 4's card had when Where Things Are grew."""
    hp = os.path.join(HERE, HUB)
    h = io.open(hp, encoding="utf-8").read()
    n = len(sections(io.open(os.path.join(HERE, LESSON), encoding="utf-8").read())) - 2
    m = re.search(r'(href="%s\?from=g2".*?)(\d+)( steps)' % re.escape(LESSON), h, re.S)
    if not m:
        sys.exit("  REFUSED: no step count on the %s card in %s" % (LESSON, HUB))
    if int(m.group(2)) == n:
        print("  %s: the card already says %d steps" % (HUB, n))
        return
    print("  %s: card %s steps -> %d steps" % (HUB, m.group(2), n))
    if write:
        h = h[:m.start(2)] + str(n) + h[m.end(2):]
        io.open(hp, "w", encoding="utf-8", newline="").write(h)


def main():
    s = io.open(os.path.join(HERE, LESSON), encoding="utf-8").read()
    secs = sections(s)
    titles = [t for _a, _b, t in secs]
    todo = [t for t in DROP if t in titles]
    if not todo:
        print("  %s already carries neither step -- nothing to do" % LESSON)
        hub_step_count(WRITE)
        return 0

    print("  %s: %d sections, %d teaching" % (LESSON, len(secs), len(secs) - 2))
    for t in DROP:
        print("     %-22s %s" % (t, "present" if t in titles else "already gone"))

    # ---- 1. the shared helpers move first, so the block can be deleted safely
    anchor = '"</span></div>").join(""); }\n'
    if s.count(anchor) != 1:
        sys.exit("  REFUSED: the lines() helper is not where this expects it (%d matches)"
                 % s.count(anchor))
    moved = []
    for name in MOVE:
        fn = whole_function(s, name)
        callers = len(re.findall(r"\b%s\(" % name, s)) - 1
        s = s.replace(fn + "\n", "", 1)
        s = s.replace(anchor, anchor + "\n" + fn + "\n", 1)
        moved.append("%s (%d call site%s)" % (name, callers, "" if callers == 1 else "s"))
    print("     moved up beside lines(): %s" % ", ".join(moved))

    # ---- 2. the JS block for each dropped step, found by the finish() it calls
    secs = sections(s)
    titles = [t for _a, _b, t in secs]
    for t in todo:
        i = titles.index(t)
        gone = False
        for p, e, lab in js_blocks(s):
            if re.search(r"finish\(\s*%d\s*[,)]" % i, s[p:e]):
                print("     JS block %-3s -> step %d %r" % (lab, i + 1, t))
                s = s[:p] + s[e:]
                gone = True
                break
        if not gone:
            sys.exit("  REFUSED: no JS block calls finish(%d) for %r" % (i, t))

    # ---- 3. the DOM section
    for t in todo:
        secs = sections(s)
        i = [k for k, (_a, _b, ti) in enumerate(secs) if ti == t][0]
        a, b, _ = secs[i]
        s = s[:a] + s[b:]

    # ---- 4. the stickers, one per finishable step and parallel to done[]
    st = re.search(r"(const STICKERS = \[)(.*?)(\];)", s, re.S)
    if not st:
        sys.exit("  REFUSED: no STICKERS array")
    kept, dropped = [], []
    for m in re.finditer(r'\["((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"\]', st.group(2)):
        label = m.group(2)
        # the sticker for a dropped step names it; "Money" is exact, "Halves and
        # quarters" is the label verbatim
        if label in ("Halves and quarters", "Money"):
            dropped.append(label)
        else:
            kept.append('["%s", "%s"]' % (m.group(1), m.group(2)))
    body = "\n    " + ",\n    ".join(
        ", ".join(kept[i:i + 3]) for i in range(0, len(kept), 3)) + "\n  "
    s = s[:st.start(2)] + body + s[st.end(2):]
    print("     stickers %d -> %d (dropped %s)" % (len(kept) + len(dropped), len(kept),
                                                   ", ".join(dropped)))

    # ---- 5. the check's own finish index, which moved with the sections
    secs = sections(s)
    check_i = len(secs) - 2
    old = re.search(r"finish\(\s*(\d+)\s*, \"You got \"", s)
    if not old:
        sys.exit("  REFUSED: the check block's finish() is not the shape this expects")
    if int(old.group(1)) != check_i:
        s = s[:old.start(1)] + str(check_i) + s[old.end(1):]
        print("     check finish(%s) -> finish(%d)" % (old.group(1), check_i))

    # ---- 6. the two check questions the lesson no longer teaches
    ck = re.search(r"(const CHECK = \[)(.*?)(\n  \];)", s, re.S)
    if not ck:
        sys.exit("  REFUSED: no CHECK array")
    items = re.findall(r"\n    \{ q: .*?\},?", ck.group(2))
    keep = [it for it in items if "quarter of" not in it and " sh +" not in it]
    if len(keep) != len(items):
        rebuilt = "".join(k.rstrip(",") + "," for k in keep).rstrip(",")
        s = s[:ck.start(2)] + rebuilt + s[ck.end(2):]
        print("     check questions %d -> %d (a quarter of 12, and the shillings sum)"
              % (len(items), len(keep)))

    secs = sections(s)
    print("     now %d sections, %d teaching" % (len(secs), len(secs) - 2))

    # ---- 7. the annotations follow the teaching, into Fair Shares
    fp = os.path.join(HERE, FRACTIONS)
    f = io.open(fp, encoding="utf-8").read()
    NOTES = [
        ("Equal parts first", "2Nf.01",
         "an object or shape split into equal parts, and into unequal ones"),
        ("A fraction of a group", "2Nf.02",
         "a quarter as one of four equal parts of a SET, not of one shape"),
        ("Fractions in real life", "2Nf.04",
         "the fraction acting as an operator on an amount"),
    ]
    added = []
    for title, code, why in NOTES:
        if code in f:
            continue
        m = re.search(r"(<section class=\"slide\"[^>]*>\s*<div class=\"slide-head\">"
                      r"<span class=\"n\">\d+</span><h2>%s</h2>)" % re.escape(title), f)
        if not m:
            sys.exit("  REFUSED: %s has no step titled %r to annotate" % (FRACTIONS, title))
        f = f[:m.end()] + "\n      <!-- 0096 %s: %s -->" % (code, why) + f[m.end():]
        added.append("%s on %r" % (code, title))
    if added:
        print("  %s: annotated %s" % (FRACTIONS, "; ".join(added)))
    else:
        print("  %s: already annotated" % FRACTIONS)

    if not WRITE:
        print("\n  dry run -- pass --write to apply")
        return 0
    io.open(os.path.join(HERE, LESSON), "w", encoding="utf-8", newline="").write(s)
    io.open(fp, "w", encoding="utf-8", newline="").write(f)
    hub_step_count(True)
    print("\n  written")
    return 0


if __name__ == "__main__":
    sys.exit(main())
