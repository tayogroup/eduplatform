# -*- coding: utf-8 -*-
"""Write down which Stage 2 objective each Grade 2 step teaches.

    python annotate-objectives.py            # report
    python annotate-objectives.py --write

The 2026-09-11 validation found audit-stage-coverage.py reporting Grade 2 as
declaring 34 of its 48 objectives, with 14 "not annotated anywhere" - and 22
codes from other stages. Both were the SOURCE failing to say, not the lessons
failing to teach:

  1. THE 14 ARE TAUGHT. Place value, rounding, odd and even, sharing and
     grouping, 2D and 3D shapes, symmetry, turns, movement, mass, telling the
     time to five minutes, units of time, a half and a quarter as division -
     each has a step, read and checked against its slide before its code went
     on. The step headers simply carried no code: Grade 2 was annotated a third
     at most, as the audit's own docstring warns.
  2. THE 22 ARE NOT TAUGHT. All but two are in comments that explain what was
     REMOVED for being above Stage 2 ("'the rule' is 3Nc.05") - written by
     hold-stage-2.py, this session. The other two mark Stage 1 revision (saying
     where in words; the names of days and months). An audit that counts every
     code it sees cannot tell a claim from a note that something is NOT here, so
     those notes are written the way Grade 1 writes them - in prose, "Stage 3's
     Nc.05" - which keeps the precision and stops the claim. Every one is checked
     to sit inside a comment before it is touched; one in text a learner reads
     would be refused.

An annotation is a claim, and the audit cannot check it. So each code below is
the one the slide's own title and spoken prompt describe - listed per header, so
the review surface is this file.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

# header as it stands (without its closing) -> the codes that step teaches
HEADERS = {
    "tens-and-ones": [
        ("/* ---- 1: hundred chart ----", "2Np.01 - tap a number to see its tens and ones"),
        ("/* ---- 2: build with tens and ones ----", "2Np.01, 2Np.02"),
        ("/* ---- 3: rounding ----", "2Np.05"),
        ("/* ---- 4: two-digit addition ----", "2Ni.04"),
        ("/* ---- 5: subtraction by jumping back ----", "2Ni.04"),
        ("/* ---- 6: arrays ----", "2Ni.05"),
        ("/* ---- 7: sharing and grouping ----", "2Ni.06"),
        ("/* ---- 9: odd and even ----", "2Nc.05"),
    ],
    "coins-and-change": [
        ("/* ---- 1: know your money ----", "2Nm.01"),
        ("/* ---- 2: count the purse ----", "2Nm.01"),
        ("/* ---- 3 and 4: build an amount ----", "2Nm.01, 2Nm.02 - one amount, different coins"),
        ("/* ---- 5: shopping ----", "2Ni.04"),
        ("/* ---- 9: saving and spending ----", "2Ni.04"),
    ],
    "fair-shares": [
        ("/* ---- 1: equal parts ----", "2Nf.01"),
        ("/* ---- 2: shade the fraction ----", "2Nf.02"),
        ("/* ---- 3: fraction of a group ----", "2Nf.03, 2Nf.04 - share into equal groups, then take the parts"),
        ("/* ---- 4: equivalent fractions ----", "2Nf.05"),
        ("/* ---- 5: comparing ----", "2Nf.05"),
        ("/* ---- 6: number line ----", "2Nf.05"),
        ("/* ---- 8: more than one whole ----", "2Nf.06"),
        ("/* ---- 9: real life ----", "2Nf.04"),
    ],
    "patterns-that-grow": [
        ("/* ---- 1: the part that repeats ----", "2Sp.01 - a regular pattern has a part that repeats; describing sequences of objects began in Stage 1"),
        ("/* ---- 2: what comes next ----", "2Sp.01"),
        ("/* ---- 3: mend the pattern ----", "2Sp.01"),
        ("/* ---- 4: make your own ----", "2Sp.01"),
        ("/* ---- 7: missing number ----", "2Nc.06"),
    ],
    "sides-and-corners": [
        ("/* ---- 1: count sides and corners ----", "2Gg.01"),
        ("/* ---- 2: name the shape ----", "2Gg.01"),
        ("/* ---- 3: shape riddles ----", "2Gg.01"),
        ("/* ---- 4: make it match (symmetry) ----", "2Gg.09"),
        ("/* ---- 5: does it fold in half? ----", "2Gg.09"),
        ("/* ---- 6: solid shapes ----", "2Gg.05"),
        ("/* ---- 7: position words ----", "position words revisit Stage 1; describing MOVEMENT is Stage 2's work in Which Way From Here"),
        ("/* ---- 8: turns ----", "2Gg.11"),
    ],
    "which-way-from-here": [
        ("/* ---- 8: whose left is it ----", "2Gp.01"),
        ("/* ---- 5: drive the robot ----", "2Gp.01, 2Gg.11"),
        ("/* ---- 6: say the route ----", "2Gp.01"),
    ],
    "how-much-how-long": [
        ("/* ---- 1: longer and shorter ----", "2Gg.03"),
        ("/* ---- 2: measure with cubes ----", "2Gg.03 - non-standard units"),
        ("/* ---- 3: the ruler ----", "2Gg.03, 2Gg.04"),
        ("/* ---- 4: which unit ----", "2Gg.03, 2Gg.06, 2Gg.07"),
        ("/* ---- 5: balance ----", "2Gg.06"),
        ("/* ---- 6: kitchen scale ----", "2Gg.06, 2Gg.12"),
        ("/* ---- 7: the jug ----", "2Gg.07, 2Gg.12"),
    ],
    "half-past-quarter-to": [
        ("/* ---- 1: the two hands ----", "2Gt.02"),
        ("/* ---- 2: quarters ----", "2Gt.02"),
        ("/* ---- 3: to five minutes ----", "2Gt.02"),
        ("/* ---- 5: match to digital ----", "2Gt.02"),
        ("/* ---- 7: units of time ----", "2Gt.01"),
    ],
    "count-it-chart-it": [
        ("/* ---- 1: sorting ----", "2Ss.02"),
        ("/* ---- 2: tally ----", "2Ss.02"),
        ("/* ---- 3: pictogram 1:1 ----", "2Ss.02"),
        ("/* ---- 5: build a block graph ----", "2Ss.02"),
    ],
}
CODE = re.compile(r"\b([13-9])(Gg|Gp|Gt|Nc|Nf|Ni|Nm|Np|Sp|Ss)\.(\d{2})\b")


def in_comment(s, i):
    """Is offset i inside a /* */ or <!-- --> comment, or after // on its line?"""
    if s.rfind("/*", 0, i) > s.rfind("*/", 0, i):
        return True
    if s.rfind("<!--", 0, i) > s.rfind("-->", 0, i):
        return True
    line = s[s.rfind("\n", 0, i) + 1:i]
    return "//" in line and not re.search(r"https?:$", line.split("//")[0] + "//")


total_h = total_p = refused = 0
for name, heads in HEADERS.items():
    path = os.path.join(HERE, name + ".html")
    s = io.open(path, encoding="utf-8", newline="").read()
    t = s
    nh = 0
    for old, codes in heads:
        # the header's own text, then either " ---- */" or a newline (a multi-line header)
        m = re.search(re.escape(old) + r"( \*/|\n)", t)
        if not m:
            if ("%s (0096 " % old[:-5].rstrip()) in t or (old[:-5].rstrip() + " (") in t:
                continue                                  # annotated on an earlier run
            print("  REFUSED  %s: no header %r" % (name, old)); refused += 1; continue
        if t.count(old) != 1:
            print("  REFUSED  %s: header %r appears %d times" % (name, old, t.count(old))); refused += 1; continue
        label = old[:-len(" ----")]
        note = ("(0096 %s)" % codes) if re.match(r"2[A-Z][a-z]\.\d\d", codes) else "(%s)" % codes
        t = t.replace(old, label + " " + note + " ----", 1)
        nh += 1
    # other stages' codes, in comments only, into prose
    bad = [m for m in CODE.finditer(t) if not in_comment(t, m.start())]
    if bad:
        for m in bad:
            print("  REFUSED  %s: %s is in text a learner reads: ...%s..." % (name, m.group(0), " ".join(t[m.start() - 60:m.end() + 20].split())))
        refused += 1
        continue
    t, np_ = CODE.subn(lambda m: "Stage %s's %s.%s" % m.groups(), t)
    total_h += nh; total_p += np_
    if t != s:
        if WRITE:
            io.open(path, "w", encoding="utf-8", newline="").write(t)
        print("  %s %-22s %2d header(s) annotated, %2d other-stage note(s) put in prose" % ("wrote" if WRITE else "would", name, nh, np_))
    else:
        print("  already %-21s" % name)
print("\n  %d headers, %d notes%s; %d refused" % (total_h, total_p, "" if WRITE else " (report only - pass --write)", refused))
sys.exit(1 if refused else 0)
