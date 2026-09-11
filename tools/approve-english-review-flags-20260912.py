# -*- coding: utf-8 -*-
"""Clear the "needs curriculum review" flags across English Grades 1-5.

WHAT THIS IS. 1,844 items in Grades 1-5 carried a status asking for a teacher
of the stage to read them - "Needs curriculum review", "Needs re-review (...)",
"Rebuild - pending curriculum reviewer sign-off" and the like. The owner
approved them on 2026-09-12, having been shown the worklist
(docs/english-curriculum-review-worklist-20260912.md), and asked for the flags
to be cleared.

WHAT IT DOES NOT TOUCH, and the distinction matters:

  - "Auto-generated v1.0" and the other ORIGIN labels. Those say how an item was
    made, not that a review is owed, and there are about 8,200 of them. Clearing
    them would erase the only record of what was generated rather than authored.
  - Grades 6-8, and every other subject. The approval was for Grades 1-5.

WHAT IT WRITES. The flagged status becomes APPROVED below. The record of what
each item used to say survives in two places that were committed BEFORE this
ran: the worklist doc (counts per grade, unit, section and reason) and git.

    python tools/approve-english-review-flags-20260912.py          # dry run
    python tools/approve-english-review-flags-20260912.py --write

Idempotent: a second run finds nothing left to clear.
"""
import collections
import glob
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english")
GRADES = (1, 2, 3, 4, 5)
APPROVED = "Approved by the owner 2026-09-12"
# the openings that mean "a reviewer still has to read this"
OPEN_PREFIXES = ("needs", "rebuild", "pilot")


def is_open(status):
    s = str(status).lower()
    return s.startswith(OPEN_PREFIXES) or "pending" in s


def clear(node, counter, reasons):
    if isinstance(node, dict):
        if is_open(node.get("reviewStatus", "")):
            reasons[str(node["reviewStatus"])[:64]] += 1
            node["reviewStatus"] = APPROVED
            counter[0] += 1
        for v in node.values():
            clear(v, counter, reasons)
    elif isinstance(node, list):
        for v in node:
            clear(v, counter, reasons)


def main():
    write = "--write" in sys.argv
    for a in sys.argv[1:]:
        if a != "--write":
            sys.exit("REFUSED: unrecognised argument %r" % a)
    total, outputs, reasons = 0, {}, collections.Counter()
    print("\n  English review flags -> approved (%s)" % ("WRITING" if write else "dry run - add --write"))
    for g in GRADES:
        per_grade = 0
        for p in sorted(glob.glob(os.path.join(E, "grade-%d" % g, "data", "units", "unit-*.json"))):
            raw = io.open(p, encoding="utf-8", newline="").read()
            d = json.loads(raw)
            if json.dumps(d, ensure_ascii=False, indent=2) + "\n" != raw.replace("\r\n", "\n"):
                sys.exit("REFUSED: %s does not round-trip" % p)
            counter = [0]
            clear(d, counter, reasons)
            if counter[0]:
                nl = "\r\n" if "\r\n" in raw else "\n"
                outputs[p] = (json.dumps(d, ensure_ascii=False, indent=2) + "\n").replace("\n", nl)
                per_grade += counter[0]
        print("    grade %d  %5d item(s)" % (g, per_grade))
        total += per_grade
    print("    -------  %5d across Grades 1-5, in %d file(s)" % (total, len(outputs)))
    for k, v in reasons.most_common(8):
        print("      %5d  %s" % (v, k))
    if write:
        for p, text in outputs.items():
            io.open(p, "w", encoding="utf-8", newline="").write(text)
    print("")


if __name__ == "__main__":
    main()
