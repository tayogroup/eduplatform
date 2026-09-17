# -*- coding: utf-8 -*-
"""Name the thinking move on the step that asks for it, Grade 4.

    python add-twm-stamps.py            # report
    python add-twm-stamps.py --write

The hub's "Thinking and Working Mathematically" line is DERIVED from these
stamps by lesson-app-tools/build-grownup-section.py - it is not a hand-kept
list - so a stamp is a claim, and a wrong one is a false claim about what the
build teaches.

SOURCED, NOT GUESSED. The Stage 4 Teacher's Guide names "the TWM skill of X"
137 times on specific activities, and unlike Stage 3 it names all eight:

    specialising 28, critiquing 25, generalising 24, convincing 20,
    improving 13, conjecturing 12, classifying 12, characterising 3

Each stamp below matches a step to the kind of activity Cambridge attaches that
skill to, using Cambridge's own definitions:

    characterising  identifying and describing the properties of an object
    classifying     organising objects into groups by their properties
    generalising    recognising an underlying pattern across many examples
    specialising    choosing an example and checking it against criteria
    convincing      presenting evidence to justify or challenge
    critiquing/improving   comparing approaches and refining them

CONJECTURING IS STILL NOT CLAIMED, and at Stage 4 that is a harder call than at
Stage 3, because Stage 4 names it twelve times where Stage 3's usable count was
lower. It is not claimed anyway, for the reason Grade 3 records: conjecturing is
"forming mathematical questions or ideas", and Cambridge does extend it to a
PREDICTION - but a prediction chosen from three buttons is a choice among given
answers, not one the child formed. The candidates here are real and were each
checked: "What would answer it?" asks which of several given questions needs
data, which is identifying a property of a question; "What comes next?" and "Say
the rule" are predictions offered as options; "Spin it, and spin it again" asks
what a chance experiment will show, again from a list.

So Grade 4 reaches 7 of 8, the same as Grades 2 and 3, and the hub will say so.
If a step is ever built where the child commits a prediction of their own -
Grade 2's problem builder is the shape that could - Stage 4's own wording
supports the claim on that day and not before.

Steps that already carry a stamp are left alone: add-spot-the-mistake.py writes
`critiquing improving` on its own step, and re-stamping would either duplicate
the attribute or overwrite a correct claim.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g4-twm"

# lesson -> {exact <h2> heading: the characteristic(s) that step exercises}
WORK = {
 "asking-sorting-chance": {
   "How do you know?": "convincing",
   "What would answer it?": "characterising",
   "One set, three pictures": "critiquing improving",
   "Sorting two ways at once": "classifying",
   "Which chart would you choose?": "critiquing improving",
   "Impossible to certain": "classifying",
   "Maybe, likely or certain?": "classifying",
   "Spin it, and spin it again": "specialising",
 },
 "big-numbers-below-zero": {
   "How do you know?": "convincing",
   "What each digit is worth": "characterising",
   "The same number, regrouped": "specialising",
   "Ten times, a hundred times": "generalising",
   "Below zero, in order": "characterising",
   "Smallest to largest": "characterising",
   "Which one is it nearer?": "specialising",
   "One number, five answers": "critiquing improving",
 },
 "parts-of-a-whole": {
   "How do you know?": "convincing",
   "More parts, smaller parts": "generalising",
   "A fraction is a division": "characterising",
   "Same value, different name": "specialising",
   "Which is bigger?": "characterising",
   "Fractions in order": "characterising",
 },
 "patterns-and-squares": {
   "How do you know?": "convincing",
   "Odd, even, and what happens": "generalising",
   "Taking away, odd and even": "generalising",
   "What comes next?": "generalising",
   "Same step, or changing step?": "classifying",
   "Say the rule": "generalising",
   "Numbers that make squares": "characterising",
 },
 "shape-and-measures": {
   "How do you know?": "convincing",
   "The faces of a solid": "characterising",
   "Fold it up: nets": "specialising",
   "Every line of symmetry": "characterising",
   "Acute, right or obtuse?": "classifying",
   "Area without counting": "generalising",
   "Two rectangles, one area": "specialising",
   "Reading between the marks": "specialising",
 },
 "telling-the-time": {
   "How do you know?": "convincing",
   "Swapping units, both ways": "generalising",
   "Three ways to say one time": "characterising",
   "Writing it in 24-hour": "characterising",
   "Which one do you catch?": "specialising",
   "How long between?": "specialising",
 },
 "ways-to-calculate": {
   "How do you know?": "convincing",
   "Estimate before you work": "specialising",
   "Tables, and a shortcut": "generalising",
   "Double one, halve the other": "generalising",
   "Sharing out, and what is left": "characterising",
   "6s, 7s, 9s and factor pairs": "generalising",
   "Multiples and factors, both ways": "generalising",
   "Does it divide exactly?": "classifying",
 },
 "where-things-are": {
   "How do you know?": "convincing",
   "The eight points": "characterising",
   "Which way from here?": "specialising",
   "Coordinates": "characterising",
   "Along first, then up": "characterising",
   "Reflect it in the mirror": "specialising",
   "When the mirror is the edge": "specialising",
 },
}

VALID = {"specialising", "generalising", "conjecturing", "convincing",
         "characterising", "classifying", "critiquing", "improving"}
for lesson, m in WORK.items():
    for head, twm in m.items():
        for w in twm.split():
            if w not in VALID:
                sys.exit("  REFUSED: %r is not a TWM characteristic (%s / %s)"
                         % (w, lesson, head))
        if "conjecturing" in twm:
            sys.exit("  REFUSED: conjecturing is deliberately unclaimed at Grade 4 "
                     "- read this file's docstring before adding it")

pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack|audit|^_|-body\.html$", f))
todo, done, refused, stamped, already = [], 0, 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already    %-26s" % slug)
        done += 1
        continue

    out, n, skipped_here, missing = s, 0, 0, []
    for head, twm in WORK[slug].items():
        pat = re.compile(r'(<section class="slide")([^>]*?)(>)(?=(?:(?!</section>)[\s\S])*?'
                         r'<h2>' + re.escape(head) + r'</h2>)')
        hits = list(pat.finditer(out))
        if len(hits) != 1:
            missing.append("%s (%d)" % (head, len(hits)))
            continue
        attrs = hits[0].group(2)
        if "data-twm=" in attrs:
            skipped_here += 1
            continue
        new = hits[0].group(1) + ' data-twm="' + twm + '"' + attrs + hits[0].group(3)
        out = out[:hits[0].start()] + new + out[hits[0].end():]
        n += 1
    if missing:
        print("  REFUSED    %-26s heading not found exactly once: %s"
              % (slug, "; ".join(missing)))
        refused += 1
        continue
    out = out.rstrip() + "\n<!-- " + MARK + ": see add-twm-stamps.py -->\n"
    if out.count(MARK) != 1:
        print("  REFUSED    %-26s marker count %d" % (slug, out.count(MARK)))
        refused += 1
        continue
    todo.append((p, out))
    stamped += n
    already += skipped_here
    print("  would      %-26s %d stamp(s)%s" % (slug, n,
          "  (%d already stamped)" % skipped_here if skipped_here else ""))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)

claimed = set()
for m in WORK.values():
    for twm in m.values():
        claimed.update(twm.split())
print("")
print("  %d stamp(s) across %d lesson(s) %s, %d left as already stamped, %d already "
      "done, %d refused%s"
      % (stamped, len(todo), "written" if WRITE else "to write", already, done, refused,
         "" if WRITE else "   (--write to apply)"))
print("  the hub will derive %d of 8: %s" % (len(claimed), ", ".join(sorted(claimed))))
print("  NOT claimed: %s" % ", ".join(sorted(VALID - claimed)))
