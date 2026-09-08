# -*- coding: utf-8 -*-
"""What Cambridge objectives does a standalone lesson build DECLARE that it teaches?

These builds annotate their own slides with objective codes, in the source comments
beside each block:

    /* ---- 3: times tables ---- 3Ni.07 know 1, 2, 3, 4, 5, 6, 8, 9 and 10 times tables */

This reads those annotations and compares them with the framework for the app's stage.
It answers three questions a slide count cannot:

    declared      how much of the stage the source says it covers
    unannotated   objectives no comment claims -- see the warning below
    foreign       codes from ANOTHER stage, with the lesson and the context, which is
                  how above-stage content shows up

BE PRECISE ABOUT WHAT AN UNANNOTATED OBJECTIVE MEANS. It means the source does not
say, NOT that the objective is untaught. Grades 3 and 4 annotate nearly everything, so
for them the list is close to a coverage gap. Grades 1 and 2 annotate a third or less,
so for them it is mostly a note that nobody wrote the code down. Reporting those two
numbers as if they were the same thing would be the "true fact about the wrong
property" mistake this repo keeps recording.

WHY THIS AND NOT A KEYWORD SEARCH. This tool was first written to search the built
lessons for one hand-written regex per objective. Run against Grade 3 it reported 13
objectives with no evidence; hand-checking found that MOST were faults in my patterns
rather than gaps -- 3Ni.07's pattern was the literal string "times table", which
appears three times in the build. (It appears only inside comments, which is why the
first version missed it: the corpus stripped comments, correctly, because it was
searching what a learner reads.) A check that reports false failures is worse than an
absent one, because it gets routed around; the pattern file was deleted rather than
tuned. What survived is the observation that made it moot -- the codes are written
down already, so read them instead of guessing at them.

WHAT IT STILL CANNOT SEE. An annotation is a claim by whoever wrote the slide. It says
nothing about whether the objective is taught well, or at all. Grade 4's own audit
found 4Ni.05 and 4Ni.06 annotated on a slide that only ever asked for an ESTIMATE and
never for the calculation the objective names. Only reading the slide settles that.

  python ../lesson-app-tools/audit-stage-coverage.py           # from the app directory
  python ../lesson-app-tools/audit-stage-coverage.py --all     # every app under ..
"""
import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load, App  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
CODE = re.compile(r"\b([1-9])(Gg|Gp|Gt|Nc|Nf|Ni|Nm|Np|Sp|Ss)\.(\d{2})\b")
FRAMEWORKS = [("cambridge-mathematics-0096.json", set("123456")),
              ("cambridge-mathematics-0862.json", set("789"))]


def die(msg, code=2):
    print("\n  " + msg + "\n")
    sys.exit(code)


def objectives(stage):
    for name, stages in FRAMEWORKS:
        if str(stage) in stages:
            p = os.path.join(REPO, "src", "curriculum", name)
            if not os.path.exists(p):
                die("no framework at %s -- this audit cannot run without one" % p)
            objs = json.load(io.open(p, encoding="utf-8"))["objectivesByStage"].get(str(stage))
            if not objs:
                die("%s carries no stage %s" % (name, stage))
            return name, {o["code"]: o["text"] for o in objs}
    die("no framework covers stage %s" % stage)


def audit(app):
    stage = str(app.cfg.get("stage", app.cfg.get("grade")))
    fwname, OBJ = objectives(stage)
    own, foreign = {}, {}
    for _unit, f, title in app.lessons:
        s = app.read(f)
        for m in CODE.finditer(s):
            code = "%s%s.%s" % m.groups()
            a = max(0, m.start() - 110)
            ctx = " ".join(s[a:m.end() + 60].split())
            (own if code.startswith(stage) else foreign).setdefault(code, []).append((title, ctx))

    declared = sorted(c for c in own if c in OBJ)
    unknown = sorted(c for c in own if c not in OBJ)
    missing = sorted(c for c in OBJ if c not in own)

    print("\n  %s %s -- %s stage %s, %d objectives, %d lessons"
          % (app.subject_label, app.grade_label, fwname, stage, len(OBJ), len(app.lessons)))
    print("  declares %d of %d (%d%%)" %
          (len(declared), len(OBJ), round(100.0 * len(declared) / len(OBJ))))
    if unknown:
        print("  codes at this stage that the framework does not have: %s" % ", ".join(unknown))
    if missing:
        print("\n  not annotated anywhere (the source does not say; it may still be taught):")
        for c in missing:
            print("    %-8s %s" % (c, OBJ[c][:92]))
    if foreign:
        n = sum(len(v) for v in foreign.values())
        print("\n  ANOTHER STAGE'S objectives, %d code(s) in %d place(s):" % (len(foreign), n))
        for c in sorted(foreign):
            where = sorted(set(t for t, _ in foreign[c]))
            print("    %-8s %s" % (c, ", ".join(where)))
        seen = set()
        print("\n    context:")
        for c in sorted(foreign):
            for title, ctx in foreign[c]:
                key = ctx[-70:]
                if key in seen:
                    continue
                seen.add(key)
                print("      %s" % ctx[-150:])
    print()
    return 1 if (missing or foreign or unknown) else 0


def main():
    if "--all" in sys.argv:
        root = os.path.abspath(os.path.join(HERE, ".."))
        worst = 0
        for d in sorted(os.listdir(root)):
            for cand in (os.path.join(root, d), os.path.join(root, d, "g1v2")):
                if os.path.isfile(os.path.join(cand, "app.config.json")):
                    cfg = json.load(io.open(os.path.join(cand, "app.config.json"), encoding="utf-8"))
                    worst = max(worst, audit(App(cand, cfg)))
                    break
        sys.exit(worst)
    sys.exit(audit(load()))


main()
