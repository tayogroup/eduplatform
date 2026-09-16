# -*- coding: utf-8 -*-
"""Rename overview-outcomes clips so a re-recording actually reaches a child.

Grade 1 by default; `--grade 4` for the Stage 4 pass. The filename keeps the
`g1` in it because renaming a shipped tool is a bigger change than teaching it a
second grade, and every caller in the history doc names it this way.

WHY
===
`author-english-g1-nonfiction.py` added a seventh learning outcome to every
Grade 1 unit. The unit overview's `outcomes` panel is narrated as ONE clip that
enumerates the outcomes, so all ten recordings now say six of seven -- incomplete
rather than wrong, and invisible to everything except
`check-english-audio-staleness.py`, which went from 0 stale to exactly these 10.

The owner asked for them to be recorded (2026-09-16), reversing the
author-text-only decision for these clips alone.

**The same thing happened at Grade 4 on 2026-09-17**, for the same reason and
found the same way: `author-english-g4-stage4-thin-claims.py` added an outcome to
units 5, 6, 8 and 10, and the staleness checker named exactly those four. The
fix is identical, which is why this tool grew a grade rather than a sibling.

WHY A RENAME AND NOT JUST A RE-RECORD
=====================================
English names its clips for their content slot, not for a hash of what they say,
so re-recording onto the same filename keeps the same URL -- and Bunny serves
media `max-age=31536000` with no ETag. Every learner who has already played the
overview would keep the old wording for a YEAR, and the edge itself may keep it
too: measured 2026-09-03, 8 of 745 re-recorded clips were still stale at the
edge afterwards, all Grade 1, all cached by a learner's play before the new bytes
landed. The `?a=` AUDIO_RELEASE stamp busts browsers but is invisible to the
edge.

`audioRevision` is the course's own answer and CLAUDE.md's stated preference: it
changes the clip's FILENAME, so the URL moves, and browsers and edge nodes both
fetch the new bytes because they have never seen that path. A rename is the
cheaper fix wherever the filename is not load-bearing, and here it is derived.

    id = f"{unitId}-overview-{panel}{audioRevision}"     # generate-…-audio.js

WHY "e"
=======
Existing revisions across Grades 1-8 are single lowercase letters -- `b` (15,223),
`c` (2,065), `d` (6) -- plus `rv` (155). Unit 6's outcomes clip already carries
`rv` from the 2026-09-11 re-record, so it needs a value that is not `rv`; the
other nine carry none. `e` is the next unused letter and is applied to all ten,
so one value covers the set and every clip's URL moves.

    python tools/repair-english-g1-overview-revision.py --dry
    python tools/repair-english-g1-overview-revision.py
    python tools/repair-english-g1-overview-revision.py --ids   # the --only list
"""

import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PANEL = "outcomes"
NEW = "e"

# WHICH UNITS, AND WHAT EACH MUST CURRENTLY HOLD, PER GRADE. Asserting the BEFORE
# state is what stops this running twice with different letters, or running
# against units some other repair has already moved. A grade with no entry is
# REFUSED rather than defaulted: guessing what revision a grade's clips already
# carry is exactly how two repairs end up fighting over one filename.
#
# Grade 4 was added 2026-09-17: it gained four outcomes (units 5, 6, 8 and 10)
# and its spoken overviews went stale for the same reason Grade 1's did - the
# outcomes panel enumerates them. None of the four carried a revision.
GRADES = {
    1: {"units": list(range(1, 11)), "expected": {6: "rv"}},
    4: {"units": [5, 6, 8, 10], "expected": {}},
}


def units_dir(grade):
    return os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english",
                        "grade-%d" % grade, "data", "units")


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save(path, obj):
    with io.open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def main(argv):
    dry = "--dry" in argv
    ids_only = "--ids" in argv
    grade = 1
    args = argv[1:]
    if "--grade" in args:
        i = args.index("--grade")
        grade = int(args[i + 1])
        del args[i:i + 2]
    for a in args:
        if a not in ("--dry", "--ids"):
            sys.stderr.write("REFUSED: unknown argument %r\n" % a)
            return 2
    if grade not in GRADES:
        sys.stderr.write("REFUSED: no recorded before-state for grade %d. Add one to GRADES "
                         "rather than guessing what its clips already carry.\n" % grade)
        return 2
    expected = GRADES[grade]["expected"]

    rows = []
    done = 0
    for n in GRADES[grade]["units"]:
        path = os.path.join(units_dir(grade), "unit-%d.json" % n)
        unit = load(path)
        uid = unit["unit"]["unitId"]
        panel = (unit.get("overviewAudio") or {}).get(PANEL)
        if not panel:
            sys.stderr.write("REFUSED: unit %d has no overviewAudio.%s\n" % (n, PANEL))
            return 1

        have = panel.get("audioRevision")
        if have == NEW:
            done += 1
            rows.append((n, "%s-overview-%s%s" % (uid, PANEL, NEW), "already"))
            continue
        if have != expected.get(n):
            sys.stderr.write(
                "REFUSED: unit %d overviewAudio.%s carries audioRevision %r, expected %r. "
                "Something else moved it; resolve by hand.\n"
                % (n, PANEL, have, expected.get(n)))
            return 1

        new_id = "%s-overview-%s%s" % (uid, PANEL, NEW)
        rows.append((n, new_id, "rename from %r" % (have or "")))
        if not dry:
            panel["audioRevision"] = NEW
            # The generator's apply() rewrites source/normal/slow to the new path
            # once the clip exists. Leaving them pointing at the OLD file until
            # then is deliberate: the old recording is still the one on disk and
            # on the CDN, and a descriptor that names a file nobody has made yet
            # is exactly the "available:true with no file" state the content gate
            # fails on.
            save(path, unit)

    if ids_only:
        print(",".join(r[1] for r in rows))
        return 0

    for n, new_id, what in rows:
        print("unit %-2d %-44s %s" % (n, new_id, what))
    print("\n%d renamed, %d already at %r.%s"
          % (len(rows) - done, done, NEW, " (--dry: nothing written)" if dry else ""))
    if not dry and len(rows) - done:
        print("\nNow record them, and ONLY them:")
        print("  node tools/generate-ehel-english-audio.js overview %d --only \\\n    %s"
              % (grade, ",".join(r[1] for r in rows)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
