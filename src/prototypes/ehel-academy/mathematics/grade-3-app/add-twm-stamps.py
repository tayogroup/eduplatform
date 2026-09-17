# -*- coding: utf-8 -*-
"""Name the thinking move on the step that asks for it, Grade 3.

    python add-twm-stamps.py            # report
    python add-twm-stamps.py --write

The hub's "Thinking and Working Mathematically" line is DERIVED from these
stamps by lesson-app-tools/build-grownup-section.py - it is not a hand-kept
list - so a stamp is a claim, and a wrong one is a false claim about what the
build teaches.

SOURCED, NOT GUESSED. The Stage 3 Teacher's Guide names "the TWM skill of X"
175 times on specific activities, all eight characteristics among them
(specialising 52, convincing 28, generalising 27, improving 26, classifying 25,
critiquing 24, characterising 19, conjecturing 18). Each stamp below matches a
step to the kind of activity Cambridge attaches that skill to, using Cambridge's
own definitions:

    characterising  identifying and describing the properties of an object
    classifying     organising objects into groups by their properties
    generalising    recognising an underlying pattern across many examples
    specialising    choosing an example and checking it against criteria
    convincing      presenting evidence to justify or challenge
    critiquing/improving   comparing approaches and refining them

CONJECTURING IS NOT CLAIMED, and this was checked rather than assumed. It is
"forming mathematical questions or ideas", and the one candidate - Ask, Count,
Chart step 1, "A question worth asking" - turns out to ask which of several
given questions needs data. That is identifying a property of a question, not
forming one. Nothing in this build lets a child form a question, exactly as at
Grade 2, so Grade 3 reaches 7 of 8 and the hub will say so.

Note this is the one place a Stage 2 rule nearly did transfer wrongly in the
OTHER direction: the Stage 3 Guide does call a PREDICTION conjecturing
("conjecturing about the number of squares in the next two shapes"). A
multiple-choice prediction is still a choice among given answers, so it does not
earn the stamp here - but if a step is ever built where the child commits a
prediction of their own, Stage 3's own wording supports the claim.

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

MARK = "ehel-g3-twm"

# lesson -> {exact <h2> heading: the characteristic(s) that step exercises}
WORK = {
 "adding-and-money": {
   "How do you know?": "convincing",
   "Estimate first": "specialising",
 },
 "ask-count-chart": {
   "How do you know?": "convincing",
   "A question worth asking": "characterising",
   "A Venn diagram": "classifying",
   "A Carroll diagram": "classifying",
   "Which one should you use?": "critiquing improving",
 },
 "equal-parts": {
   "How do you know?": "convincing",
   "Same fraction, different shape": "specialising",
   "Which is bigger?": "characterising",
 },
 "measure-it": {
   "How do you know?": "convincing",
   "Bigger or smaller than a right angle": "characterising",
   "Reading a scale": "specialising",
 },
 "rows-and-rules": {
   "How do you know?": "convincing",
   "What is the rule?": "generalising",
   "Patterns that grow": "generalising",
   "Multiples of 2, 5 and 10": "specialising",
   "One array, four facts": "generalising",
 },
 "shapes-and-symmetry": {
   "How do you know?": "convincing",
   "Naming flat shapes": "characterising",
   "Regular or irregular": "characterising classifying",
   "Solid shapes": "characterising classifying",
 },
 "time-and-direction": {
   "How do you know?": "convincing",
   "Which unit of time?": "characterising",
   "Which bus do you catch?": "specialising",
 },
 "up-to-a-thousand": {
   "How do you know?": "convincing",
   "Odd or even": "classifying",
   "Ten times bigger": "generalising",
   "Put them in order": "characterising",
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
            sys.exit("  REFUSED: conjecturing is deliberately unclaimed at Grade 3 "
                     "- see this file's docstring before adding it")

pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack|^_", f))
todo, done, refused, stamped, already = [], 0, 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already    %-24s" % slug)
        done += 1
        continue

    out, n, skipped_here, missing = s, 0, 0, []
    for head, twm in WORK[slug].items():
        # the <section class="slide"> whose <h2> is exactly this heading
        pat = re.compile(r'(<section class="slide")([^>]*?)(>)(?=(?:(?!</section>)[\s\S])*?'
                         r'<h2>' + re.escape(head) + r'</h2>)')
        hits = list(pat.finditer(out))
        if len(hits) != 1:
            missing.append("%s (%d)" % (head, len(hits)))
            continue
        attrs = hits[0].group(2)
        if "data-twm=" in attrs:
            skipped_here += 1          # already stamped, e.g. by spot-the-mistake
            continue
        new = hits[0].group(1) + ' data-twm="' + twm + '"' + attrs + hits[0].group(3)
        out = out[:hits[0].start()] + new + out[hits[0].end():]
        n += 1
    if missing:
        print("  REFUSED    %-24s heading not found exactly once: %s"
              % (slug, "; ".join(missing)))
        refused += 1
        continue
    out = out.rstrip() + "\n<!-- " + MARK + ": see add-twm-stamps.py -->\n"
    if out.count(MARK) != 1:
        print("  REFUSED    %-24s marker count %d" % (slug, out.count(MARK)))
        refused += 1
        continue
    todo.append((p, out))
    stamped += n
    already += skipped_here
    print("  would      %-24s %d stamp(s)%s" % (slug, n,
          "  (%d already stamped)" % skipped_here if skipped_here else ""))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)

# what the hub will derive from this
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
