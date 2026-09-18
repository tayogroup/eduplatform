# -*- coding: utf-8 -*-
"""Name the thinking move a step already exercises - closing the one row every
Math grade above Grade 4 measured at zero.

    python add-twm-stamps.py            # report
    python add-twm-stamps.py --write

WHY GRADE 5 HAD NONE, AND WHAT THIS DOES NOT CLAIM TO FIX. The "Maths Upper
Stages Side by Side" comparison found no `twm` field, no `data-twm` stamp
anywhere in this build, and none in Grades 6-8's shell either - the deck-based
depth passes at Grades 1-4 each stamped their own steps
(add-twm-stamps.py in those directories) and nothing carried the pattern
forward. This closes it for Grade 5 alone, the same way materials and
differentiation were closed here: a tool built for THIS build's own step
shape, not a port of a deck tool that assumes finish() and a sticker shelf.

SOURCED AGAINST CAMBRIDGE'S OWN DEFINITIONS, not against page citations from
the Stage 5-6 books the way Grade 3 and 4's stamps were - the comparison's own
book research read TWM callout COUNTS (212 and 261 mentions) but not which
specific activity each one names, so there is no per-step citation to check
this against the way "Teacher's Guide p154" can be checked for Grades 1-4.
Each stamp below is instead matched directly to what the step's own existing
content already does, against Cambridge's published characteristic
definitions:

    characterising  identifying and describing the properties of an object
    classifying     organising objects into groups by their properties
    generalising    recognising an underlying pattern across many examples
    specialising    choosing an example and checking it against criteria
    convincing      presenting evidence to justify or challenge
    critiquing/improving   comparing approaches and refining them

CONJECTURING IS NOT CLAIMED, for the identical reason Grades 2, 3 and 4 do not
claim it: conjecturing is "forming mathematical questions or ideas", and every
question in this build is multiple-choice - a child recognises or tests a
given idea, never forms one from nothing. So Grade 5 reaches 7 of 8, the same
as every other grade in this subject.

THE MISCONCEPTION STEPS ARE THE CRITIQUING/IMPROVING HOME. The eight steps
that already carry a sourced misconception item (s2, s7 in squares-cubes,
s16/s19/s20 in how-whole-numbers, s21/s23/s24 in past-the-whole-numbers) ask
the child to weigh a claim and say what is wrong with it - "comparing
approaches and refining them" exactly, and the same content type Grade 4's own
add-spot-the-mistake.py stamps this way.

WHY THIS PATCHES THE OPENING TAG, not a new element: `data-twm` is metadata,
read by nothing that renders it to a learner (this build has no hub "grown-up"
summary the way Grades 1-4 do; the comparison audits it directly with a grep,
the same way its own first pass found zero). Adding a display surface is a
separate, larger piece of work, flagged rather than done here.

Guarded by a marker attribute; a step already stamped is left alone.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

# file -> {step id: twm value}
WORK = {
    "squares-cubes-and-roots.html": {
        "s1": "characterising",
        "s2": "critiquing improving",
        "s3": "specialising",
        "s7": "critiquing improving",
    },
    "rules-and-patterns.html": {
        "s9": "generalising",
        "s11": "classifying",
    },
    "how-whole-numbers-are-built.html": {
        "s16": "critiquing improving",
        "s19": "critiquing improving",
        "s20": "critiquing improving",
    },
    "past-the-whole-numbers.html": {
        "s21": "critiquing improving",
        "s23": "critiquing improving",
        "s24": "critiquing improving",
    },
    "real-life.html": {
        "s28": "convincing",
    },
}

CLAIMED = sorted({v for d in WORK.values() for vs in d.values() for v in vs.split()})
print("  claiming: %s (%d of 8; conjecturing withheld, see docstring)\n"
      % (", ".join(CLAIMED), len(CLAIMED)))

done = skipped = refused = 0
for name, steps in WORK.items():
    p = os.path.join(HERE, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    for step_id, twm in steps.items():
        anchor = '<section class="step" id="%s">' % step_id
        already = '<section class="step" id="%s" data-twm=' % step_id
        if already in s:
            print("  already  %-30s %-10s %s" % (name, step_id, twm))
            skipped += 1
            continue
        if s.count(anchor) != 1:
            print("  REFUSED  %-30s %-10s anchor found %d times" % (name, step_id, s.count(anchor)))
            refused += 1
            continue
        replacement = '<section class="step" id="%s" data-twm="%s">' % (step_id, twm)
        s = s.replace(anchor, replacement, 1)
        print("  %s %-30s %-10s %s" % ("wrote  " if WRITE else "would  ", name, step_id, twm))
        done += 1
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)

print("\n  %d stamp(s) %s, %d already done, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
