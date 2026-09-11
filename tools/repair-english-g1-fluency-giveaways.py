"""Grade 1 English Fluency Practice: turn the word questions that name their
own answer into gap questions, and touch nothing else.

WHY. A core-word question is "Which word means: <childMeaning>", and 45 of
Grade 1's 90 word questions carried a meaning that says the word itself -
"Which word means: Fun means enjoying yourself." -> fun. The answer is on the
screen. tools/author-ehel-english-g1-fluency.py learned the fix on
2026-09-11 (blank the word, ask for the gap) and Grades 2-4 were authored
with it; Grade 1's bank was authored before it.

WHY NOT RE-RUN THE AUTHORING TOOL. Measured the same day: a dry regeneration
of Grade 1 differs from the live bank in 146 fields besides these questions -
explanations and options edited since, grammar sentences that changed under
it. Re-running would quietly revert all of that to fix 45 stems. This rewrites
the stem alone, with the authoring tool's own rule, so the two cannot drift:

    own = r"\b<word>(?:s|es|d|ed|ing)?\b"   (case-insensitive)
    "Which word means: X"  ->  "Which word fills the gap: X"   (the word in X as ___)

The explanation keeps the meaning whole, as the tool does. Idempotent: a
question already in the gap form is left alone.

usage: python tools/repair-english-g1-fluency-giveaways.py [--dry]
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UNITS = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-1", "data", "units")
MEANS = "Which word means: "
GAP = "Which word fills the gap: "


def main():
    dry = "--dry" in sys.argv[1:]
    unknown = [a for a in sys.argv[1:] if a != "--dry"]
    if unknown:
        sys.exit("unknown argument(s): %s" % " ".join(unknown))
    total = 0
    for n in range(0, 11):
        path = os.path.join(UNITS, "unit-%d.json" % n)
        if not os.path.exists(path):
            continue
        raw = io.open(path, encoding="utf-8", newline="").read()
        unit = json.loads(raw)
        changed = 0
        for f in unit.get("fluency") or []:
            if f.get("reviewOf") != "core-word" or not str(f.get("question", "")).startswith(MEANS):
                continue
            word = f.get("correctAnswer") or ""
            meaning = f["question"][len(MEANS):]
            own = re.compile(r"\b%s(?:s|es|d|ed|ing)?\b" % re.escape(word), re.I)
            if not word or not own.search(meaning):
                continue
            f["question"] = GAP + own.sub("___", meaning)
            changed += 1
            if dry:
                print("  unit %-2d %-10s %s" % (n, word, f["question"]))
        if changed and not dry:
            # the unit files are written with ensure_ascii=False and a trailing
            # newline; keep the file's own line ending
            nl = "\r\n" if "\r\n" in raw else "\n"
            out = json.dumps(unit, ensure_ascii=False, indent=2) + "\n"
            io.open(path, "w", encoding="utf-8", newline="").write(out.replace("\n", nl))
        if changed:
            print("  unit-%d.json  %d question(s)%s" % (n, changed, " (dry)" if dry else ""))
        total += changed
    print("\n  %d word question(s) turned into gap questions%s\n" % (total, " - dry run, nothing written" if dry else ""))


if __name__ == "__main__":
    main()
