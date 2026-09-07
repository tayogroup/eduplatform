# -*- coding: utf-8 -*-
"""Grade 2 Maths against Cambridge Primary Mathematics 0096, Stage 2.

Two questions, and the second one is the reason this exists. Coverage alone
would have called this build good.

  1. COVERAGE  - does every one of the 48 Stage 2 objectives have a home?
  2. LEVEL     - is anything here taught ABOVE Stage 2, and where does the
                 framework actually put it?

Both halves are pinned to slide TITLES, the way grade-1-app's
check-stage1-coverage.py is, and the level half additionally names the
framework CODE that places the content — so every claim it makes is
falsifiable against src/curriculum/cambridge-mathematics-0096.json rather
than against my opinion.

WHY NOT AUTOMATIC SCORING. It was tried on this content on 2026-09-07 by
another session: an objective scored against the units by its own most
distinctive words. It failed its control — it PASSED two Stage 4 objectives
that were genuinely absent, because their other words appear elsewhere in the
course, and tightening it until it caught one raised seven false alarms on
known-good content. That is not a tuning problem. A lesson teaches in
child-facing words and an objective is written in curriculum words; the
overlap is not there to match. So this is hand-authored, and its diff is the
review surface.

WHAT IT DOES NOT SAY. Coverage means an objective has a home, not that the
explanation is correct, well pitched or free of error. Grade 1's README makes
the same point and it holds here with more force: nothing in this build has
had a human read the teaching, and 9 of its check questions have keys no tool
can verify.

    python ../lesson-app-tools/check-stage2-coverage.py --app ../grade-2-app
"""
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

FRAMEWORK = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..",
    "curriculum", "cambridge-mathematics-0096.json")

# objective -> the slide title(s) that carry it; any one is enough.
COVER = {
    "2Nc.01": ["Numbers to 100"],
    "2Nc.02": ["A quick look"],
    "2Nc.03": ["A quick look"],
    "2Nc.04": ["Taking away by jumping back", "Arrays: 2s, 5s and 10s"],
    "2Nc.05": ["Odd or even?"],
    "2Nc.06": ["Find the rule", "The missing number", "Growing patterns"],
    "2Nf.01": ["Equal parts first"],
    "2Nf.02": ["A fraction of a group"],
    "2Nf.03": ["A fraction of a group"],
    "2Nf.04": ["A fraction of a group"],
    "2Nf.05": ["Same size, different name", "Which is bigger?"],
    "2Nf.06": ["More than one whole"],
    "2Ni.01": ["Numbers in words"],
    "2Ni.02": ["One undoes the other"],
    "2Ni.03": ["Make 20, make 100"],
    "2Ni.04": ["Adding two-digit numbers"],
    "2Ni.05": ["Arrays: 2s, 5s and 10s"],
    "2Ni.06": ["Sharing and grouping"],
    "2Ni.07": [],          # no slide teaches the 1, 2, 5 and 10 times tables
    "2Nm.01": ["Know your money", "Shillings and cents"],
    "2Nm.02": ["The fewest pieces"],
    "2Np.01": ["Build it with tens and ones"],
    "2Np.02": ["Build it with tens and ones"],
    "2Np.03": ["Which is more?"],
    "2Np.04": ["First, second, third"],
    "2Np.05": ["Round to the nearest 10"],
    "2Gg.01": ["Name the shape", "Sides and corners"],
    "2Gg.02": ["The middle of a circle"],
    "2Gg.03": ["Longer and shorter", "Measure with cubes"],
    "2Gg.04": ["Reading a ruler", "Draw a line yourself"],
    "2Gg.05": ["Solid shapes"],
    "2Gg.06": ["Balance the scales", "Grams and kilograms"],
    "2Gg.07": ["Millilitres and litres"],
    "2Gg.08": ["Shapes in real things"],
    "2Gg.09": ["Does it fold in half?", "Make it match"],
    "2Gg.10": ["Spin it all the way round"],
    "2Gg.11": ["Turning"],
    "2Gg.12": ["Between the marks"],
    "2Gp.01": ["Whose left is it?", "Say the route"],
    "2Gp.02": ["Make it match", "Over the mirror line"],
    "2Gt.01": ["Seconds to years"],
    "2Gt.02": ["Counting round in fives", "Clock face and digital"],
    "2Gt.03": ["Days, months, calendar", "Days and months"],
    "2Nc.0x": [],          # not a real code; guarded below
    "2Sp.01": ["Regular or random?"],
    "2Sp.02": ["Is it fair?"],
    "2Ss.01": ["Sort them into groups"],
    "2Ss.02": [],          # lists/tables yes; Venn and Carroll are named and absent
    "2Ss.03": ["Reading a bar chart"],
}
COVER.pop("2Nc.0x")

# slide title -> (what it teaches, the 0096 code that places it above Stage 2).
# Every code here is checked to exist in the framework, so a typo fails loudly
# rather than quietly excusing a slide.
ABOVE = {
    "Adding two-digit numbers": ("regrouping ones into a ten", "3Ni.04"),
    "Halves, quarters, thirds": ("thirds", "3Nf.05"),
    "Adding and taking away": ("adding fractions", "3Nf.08"),
    "More than one whole": ("improper fractions and mixed numbers", "5Nf.03"),
    "Counting the change": ("giving change", "3Nm.02"),
    "Right angle or not?": ("right angles", "3Gg.10"),
    "Shapes that fit": ("tessellation", "4Gg.01"),
    "Naming a square": ("grid references", "4Gp.02"),
    "Along, then up": ("coordinates", "4Gp.02"),
    "Past zero, all four ways": ("negative coordinates, four quadrants", "6Gp.01"),
    "Which point is further?": ("comparing coordinates", "4Gp.02"),
    "Join the corners": ("plotting a shape from coordinates", "5Gp.01"),
    "Sliding a shape": ("translation", "5Gp.03"),
    "Turning about a corner": ("rotation about a point", "6Gp.05"),
    "To the very minute": ("time to the minute", "3Gt.02"),
    "am, pm and the 24-hour clock": ("the 24-hour clock", "4Gt.02"),
    "Hours as decimals": ("time as a decimal", "5Gt.04"),
    "Under a second": ("tenths and hundredths", "5Nf.04"),
    "Reading a timetable": ("timetables", "3Gt.03"),
    "Impossible to certain": ("the five-point likelihood scale", "4Sp.01"),
    "Reading a bar chart": ("a bar chart with a scale of 2", "3Ss.02"),
}
# Content with no home anywhere in 0096 Stages 1-6.
BEYOND = {
    "Which is better value?": "unit pricing",
    "Time in two places": "time zones",
}


def main():
    app = load()
    fw = json.load(open(os.path.normpath(FRAMEWORK), encoding="utf-8"))
    objectives = {o["code"]: o for st in fw["objectivesByStage"].values() for o in st}
    stage2 = [o["code"] for o in fw["objectivesByStage"]["2"]]

    titles = {}
    for _, f, _ in app.lessons:
        s = app.read(f)
        for h in re.findall(r"<h2[^>]*>(.*?)</h2>", s, re.S):
            t = re.sub(r"\s+", " ", re.sub(r"<[^>]*>", "", html.unescape(h))).strip()
            titles.setdefault(t, []).append(f.replace(".html", ""))

    bad = 0

    # the two maps must describe the framework and this build, not a memory of them
    for code in list(COVER) + [c for _, c in ABOVE.values()]:
        if code not in objectives:
            print("  BROKEN MAP  %s is not in 0096" % code)
            bad += 1
    for code in stage2:
        if code not in COVER:
            print("  BROKEN MAP  %s is in Stage 2 and this tool does not mention it" % code)
            bad += 1
    for t in list(ABOVE) + list(BEYOND):
        if t not in titles:
            print("  BROKEN MAP  no slide titled %r - the level map is stale" % t)
            bad += 1
    if bad:
        print("\n  the map is out of step with the content or the framework; fix that first\n")
        sys.exit(2)

    print("\n  %s %s vs Cambridge 0096 Stage 2  (%d objectives)\n"
          % (app.subject_label, app.grade_label, len(stage2)))

    missing = []
    for code in stage2:
        homes = [t for t in COVER[code] if t in titles]
        if homes:
            print("  ok      %-8s %-30s %s" % (code, homes[0][:30], titles[homes[0]][0]))
        else:
            missing.append(code)
            print("  MISSING %-8s %s" % (code, objectives[code]["text"][:74]))

    print("\n  covered %d/%d" % (len(stage2) - len(missing), len(stage2)))

    print("\n  Taught here, placed ABOVE Stage 2 by the framework:")
    for t, (what, code) in sorted(ABOVE.items(), key=lambda kv: kv[1][1]):
        print("    %-30s %-34s %s (Stage %d)" % (t[:30], what[:34], code, objectives[code]["stage"]))
    print("\n  Taught here, in 0096 at no stage 1-6:")
    for t, what in sorted(BEYOND.items()):
        print("    %-30s %s" % (t[:30], what))

    # The overlap is the finding neither half sees on its own: an objective
    # whose ONLY home is a slide that overshoots. Coverage prints ok, and the
    # child still meets the objective wrapped in content two stages ahead of
    # them. 2Ni.04 is the sharpest case - it says "no regrouping of ones or
    # tens" in its own text, and the slide that covers it teaches regrouping.
    overlap = [(c, COVER[c][0]) for c in stage2
               if COVER[c] and COVER[c][0] in ABOVE and all(t in ABOVE for t in COVER[c] if t in titles)]
    if overlap:
        print("\n  Covered ONLY by a slide that is above Stage 2:")
        for code, t in overlap:
            print("    %-8s %-30s %s" % (code, t[:30], objectives[code]["text"][:60]))

    print("\n  %d of %d teaching slides are above Stage 2."
          % (len(ABOVE) + len(BEYOND), sum(len(v) for v in titles.values())))
    print("\n  Coverage is not quality: it says an objective has a home, not that")
    print("  the teaching is correct or well pitched. Nobody has read this build.\n")
    sys.exit(1 if missing else 0)


main()
