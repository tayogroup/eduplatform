# -*- coding: utf-8 -*-
"""Differentiation on the things-to-do step, which ran one path for every child.

WHAT THIS CLOSES
================
Measured 2026-09-17: Cambridge attaches a Support and a Challenge to every
teaching activity -- 972 across the four Teacher's Resources -- and tiers every
Workbook session three ways besides. This course tiered its 264 WRITING tasks
completely (`Stuck?` / `Want more?` in lib/tasks.js) and nothing else at all:
486 activities and 629 reading questions ran one path for every child.

This closes the activities half.

WHY ONE PAIR PER UNIT AND NOT ONE PER ACTIVITY
==============================================
486 bespoke pairs cannot be written well, and 486 written badly would pad a
count without helping a child. Cambridge's own density is about 2.7
differentiation ideas per session, and its ideas attach to a TASK rather than to
every item inside it -- so a pair at the head of the step, naming what to drop
and what to add, is the faithful shape rather than a reduced one.

THEY ARE DERIVED FROM EACH UNIT'S OWN ACTIVITIES, AND CONCRETE
==============================================================
Not "do less" and "do more". The support names how many of that unit's
activities to keep and offers the oral route; the challenge names the unit's own
grammar pattern and asks for the activity to be redone against it. Both read the
unit, so a unit with eight activities and one with fourteen get different advice.

Neither counts toward completion. The step is ticked by doing the jobs, and a
child who takes the support route has done the step.

    python tools/author-english-activity-differentiation.py --dry
    python tools/author-english-activity-differentiation.py
"""

import io
import json
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:      # pragma: no cover
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGLISH = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english")

ORIGIN = "Ehel authoring 2026-09-17 (activity differentiation)"
REVIEW = "Needs curriculum review"
KEY = "activityDifferentiation"


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save(path, obj):
    with io.open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def unit_path(grade, n):
    return os.path.join(ENGLISH, "grade-%d" % grade, "data", "units", "unit-%d.json" % n)


def pair(unit, grade):
    acts = [a for a in (unit.get("activities") or []) if (a.get("instructionsAndItems") or "").strip()]
    total = len(acts)
    keep = max(3, total // 3)
    first_kinds = [a.get("activityType") or "" for a in acts[:keep] if a.get("activityType")]
    kind = first_kinds[0] if first_kinds else "the first job"
    gram = next((g.get("title") or "" for g in (unit.get("grammar") or []) if g.get("title")), "")
    words = next((v.get("title") or "" for v in (unit.get("vocabularyGroups") or []) if v.get("title")), "")

    if grade <= 2:
        support = ("Doing all %d is not the point. Pick the first %d and do those properly, starting "
                   "with %s. Say every answer out loud before writing anything, and let a grown-up "
                   "write it down for you if the writing is the hard part."
                   % (total, keep, kind.lower() if kind else "the first one"))
    else:
        support = ("Doing all %d in one sitting is not the point. Choose %d and finish those, "
                   "starting with %s. Talk each answer through before you write it - if you can say "
                   "it, you can write it."
                   % (total, keep, kind.lower() if kind else "the first one"))

    if gram:
        challenge = ("Pick any job you have finished and do it again, this time using “%s” "
                     "in every answer. Then choose one answer and make it longer by adding a reason."
                     % gram)
    else:
        challenge = ("Pick any job you have finished and do it again using %s, then make one answer "
                     "longer by adding a reason."
                     % (("words from “%s”" % words) if words else "this unit's words"))
    return support, challenge


def main(argv):
    dry = "--dry" in argv
    for a in argv[1:]:
        if a not in ("--dry",):
            sys.stderr.write("REFUSED: unknown argument %r\n" % a)
            return 2

    # pre-flight: nothing written unless every unit can be written
    problems = []
    for g in range(1, 5):
        for n in range(1, 11):
            p = unit_path(g, n)
            if not os.path.isfile(p):
                problems.append("grade %d unit %d: no unit file" % (g, n)); continue
            u = load(p)
            acts = [a for a in (u.get("activities") or []) if (a.get("instructionsAndItems") or "").strip()]
            if len(acts) < 4:
                problems.append("grade %d unit %d has only %d usable activities - too few to tier"
                                % (g, n, len(acts)))
    if problems:
        sys.stderr.write("REFUSED before writing anything:\n")
        for p in problems:
            sys.stderr.write("  - %s\n" % p)
        return 1

    changed = skipped = 0
    sample = []
    for g in range(1, 5):
        for n in range(1, 11):
            p = unit_path(g, n)
            u = load(p)
            if ORIGIN in ((u.get(KEY) or {}).get("origin") or ""):
                skipped += 1
                continue
            s, c = pair(u, g)
            if not dry:
                u[KEY] = {"support": s, "extension": c, "origin": ORIGIN, "reviewStatus": REVIEW}
                save(p, u)
            changed += 1
            if (g, n) in ((1, 3), (4, 5)):
                sample.append((g, n, s, c))

    for g, n, s, c in sample:
        print("--- grade %d unit %d ---" % (g, n))
        print("  Stuck?    %s" % s)
        print("  Want more? %s\n" % c)
    print("%d unit(s) %s a tiered activities step, %d already done."
          % (changed, "would gain" if dry else "gained", skipped))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
