# -*- coding: utf-8 -*-
"""What the end-to-end read of the answer keys found, fixed.

    python fix-read-findings.py            # report
    python fix-read-findings.py --write

THE READ. check-answer-keys.py recomputes every key it can derive and reports
the rest as unverified rather than counting them as passes. On 2026-09-16 the
remaining ones were read end to end - 255 items as the review pack lists them,
267 as the checker counts stems - question by question, against the objective
each belongs to, and for the picture-backed ones against the DRAWING DATA rather
than the prose beside it: FLAT's index map, balance()'s tilt sign, ssClock's
half flag, the jug levels, the dial and thermometer values, and the two graph
data sets, which are derived from the class list rather than typed.

That last part is the half a reader cannot do by looking. A key and its
explanation are written by the same hand at the same moment, so they agree with
each other whether or not they agree with the picture; the only independent
witness is the code that draws it. Checked that way, every picture-backed key
holds, including the two that would have been wrong if a helper's convention
were what it looked like: the pyramid really is square-based (5 faces, 8 edges -
its hidden path draws a four-sided base) and ssClock's second argument really
does mean half past.

ONE DEFECT, and it is a wording one rather than a wrong key: the explanation
for "About how long does it take to brush your teeth?" said "about two minutes"
while the key is "a minute". The key is right - the question asks for the UNIT,
and the alternatives are a second and a day - but a child who answers "a minute"
and is then told "about two minutes" has been corrected for being right. It now
explains the unit instead of quarrelling with it.

A mechanical pass over all 426 items backed the read up rather than replacing
it: every numeric key whose number is absent from its own explanation, and every
explanation that quantifies in a unit its key did not. Eight hits, seven of them
correct teaching ("a week is 7 days", "sixty minutes make one hour"). The eighth
is the one fixed here.

WHAT THIS IS NOT. It is not the independent read the comparison still owes. The
same hand wrote most of these questions, and the failure a self-review cannot
see is an idea that is wrong in the key and wrong in the explanation in the same
way. A teacher reading them cold is a different instrument, and it is still owed.

Guarded by exact-match anchors; refuses if a target is not there exactly once.
"""
import io, json, os, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "g1v2")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

# (file, what it says now, what it should say, why)
FIXES = [
    ("days-months-and-clocks.html",
     'why: "Brushing your teeth takes about two minutes."',
     'why: "Minutes are the right unit here. A second is far too short for it, '
     'and a day is far too long."',
     'the key is "a minute" and the explanation said "about two minutes", '
     "so a child who answered correctly was told a different number"),
    # The next two are from the 42 "How do you know?" items, which were in no
    # pack and no gate until this read went looking for them.
    ("adding-and-taking-away.html",
     '"5p and 5p makes 10p."',
     '"A 5 sh coin and a 5 sh coin make 10 sh."',
     "the money step teaches shillings throughout - 10 sh, 6 sh - and this one "
     "reasoning claim was in pence, a currency the child meets nowhere else"),
    ("adding-and-taking-away.html",
     '"Both coins are the same size.",\n                  "A 10p coin is bigger."',
     '"Both coins are the same size.",\n                  "A 10 sh coin is bigger."',
     "the same claim's distractor, in the same currency"),
    ("counting-to-twenty.html",
     '"Counting in tens goes 10, 20, 30."',
     '"Counting in tens goes 0, 10, 20."',
     "Stage 1 counts in tens from 0 to 20 (1Nc.04), and this lesson teaches "
     "counting back in tens as 20, 10, 0 - so 30 was a number the lesson "
     "itself never reaches"),
]

done = skipped = refused = 0
for name, old, new, why in FIXES:
    p = os.path.join(G, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if new in s:
        print("  already  %-30s %s" % (name, why[:52]))
        skipped += 1
        continue
    if s.count(old) != 1:
        print("  REFUSED  %-30s the text to replace is there %d times, not once"
              % (name, s.count(old)))
        refused += 1
        continue
    s = s.replace(old, new, 1)
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s %s" % ("wrote  " if WRITE else "would  ", name, why))
    done += 1

print("\n  %d fix(es) %s, %d already applied, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
