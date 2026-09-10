# -*- coding: utf-8 -*-
"""Write the Cambridge codes each step teaches into the step's own comment.

THE PROBLEM THIS FIXES IS A RECORD, NOT THE TEACHING. `validate-against-
framework.py` resolves all 36 Stage 1 objectives clause by clause against the
live pages and names the step carrying each one -- 36 of 36, mutation-tested.
But it holds that mapping in ITSELF, and the pages say almost nothing: only
Halves and Wholes carries codes in its section comments, so the SHARED
`audit-stage-coverage.py`, which reads annotations, reports

    declares 5 of 36 (14%)
    not annotated anywhere (the source does not say; it may still be taught):
      1Gg.01 ... 1Ss.03          <- 31 objectives

Two tools, two answers, both correct about what they measure. The cost is that
the shared auditor -- the one every other grade and subject is checked by -- is
red on a build that is complete, and a future session reading 14% has to
rediscover the Grade-1-only validator before it can tell a record gap from a
coverage gap. That is the failure this repo keeps recording from other
directions: a check that is confidently wrong about a build nobody has broken.

So the codes move INTO the pages, from the validator's own table rather than
retyped, and after this the two tools agree.

THE COMMENT'S DESCRIPTION IS THE STEP'S OWN <h2>, not a fresh gloss. A
hand-written description beside a code is a third copy of what the step is
about, and it goes stale the first time a step is retitled.

An existing gloss is kept only where the lesson wrote them as a SET -- Asking
and Sorting has "collect", "list", "table" on all thirteen, authored by whoever
built it, and they say things the titles do not. A LONE gloss is not trusted,
because every lesson here carries a comment on section 1 and most carry one
nowhere else, and those are stale clones from whichever file was copied:
Adding and Taking Away's step 1 says "count to 10" and Days, Months and Clocks'
says "flat shapes". The first version of this tool kept them, which would have
written a wrong description beside a right code -- worse than no description,
and the reason the rule is about evidence of authorship rather than presence.

Halves and Wholes is left exactly as it is -- it is the model this follows.

Idempotent: a second run reports and changes nothing.

  python annotate-objectives.py            # what it would write
  python annotate-objectives.py --write
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "g1v2")
VALIDATOR = os.path.join(HERE, "validate-against-framework.py")
WRITE = "--write" in sys.argv
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unknown argument %r -- this script edits lesson pages in place" % a)


def objective_map():
    """{(file, step_number): [codes]} from validate-against-framework.py.

    Read from its TABLE, not from its printed output: the print truncates the
    step list at 34 characters (`tag[:34]`), which silently drops steps for the
    two objectives with the longest lists -- 1Np.03 and 1Ss.02, the second of
    which spans eight steps.
    """
    src = io.open(VALIDATOR, encoding="utf-8").read()
    alias = dict(re.findall(r'\b([A-Z]) = "([a-z0-9-]+)"', src))
    if len(alias) < 7:
        sys.exit("  REFUSED: found %d lesson aliases in %s, expected 7.\n"
                 "  The table's shape has changed and this parser would map steps\n"
                 "  onto the wrong lessons." % (len(alias), os.path.basename(VALIDATOR)))
    out = {}
    codes = set()
    for m in re.finditer(r'"(1[A-Z][a-z]\.\d\d)":\s*\(\[((?:\s*\([A-Z],\s*\d+\),?)+)\]', src):
        code = m.group(1)
        codes.add(code)
        for letter, step in re.findall(r"\(([A-Z]),\s*(\d+)\)", m.group(2)):
            out.setdefault((alias[letter] + ".html", int(step)), []).append(code)
    if len(codes) != 36:
        sys.exit("  REFUSED: parsed %d objectives from the validator's table, expected\n"
                 "  36 for Stage 1. Refusing rather than annotating a partial map."
                 % len(codes))
    return out, codes


def sections(s):
    """(replace_from, section_start, title, existing_comment, indent) per section.

    The indent before <section> is captured and put back. The first version
    consumed it as part of the comment's trailing whitespace, so every step that
    already had a comment came out dedented -- no change a browser can see, and
    it still rewrote non-comment bytes in six of seven lessons, which makes the
    next person's diff of this build noisier than the change deserves.
    """
    out = []
    for m in re.finditer(
            r'([ \t]*<!--[^>]*?-->[ \t]*\r?\n)?([ \t]*)(<section class="slide")', s):
        start = m.start(3)
        h = re.search(r"<h2>(.*?)</h2>", s[start:start + 3000])
        out.append((m.start(1) if m.group(1) else m.start(2),
                    start,
                    re.sub(r"<[^>]*>", "", h.group(1)) if h else "?",
                    m.group(1),
                    m.group(2)))
    return out


def gloss_of(comment):
    """Whatever the existing comment says after the step number, minus codes."""
    if not comment:
        return ""
    body = re.search(r"<!--\s*(.*?)\s*-->", comment)
    if not body:
        return ""
    t = body.group(1)
    t = re.sub(r"^\d+\s+", "", t)
    t = re.sub(r"\b1[A-Z][a-z]\.\d\d\b,?\s*", "", t)
    return " ".join(t.split())


def main():
    omap, all_codes = objective_map()
    cfg = json.load(io.open(os.path.join(BUILD, "app.config.json"), encoding="utf-8"))
    total_written = 0
    annotated_codes = set()

    for l in cfg["lessons"]:
        name = l["file"]
        s = io.open(os.path.join(BUILD, name), encoding="utf-8").read()
        secs = sections(s)
        teaching = secs[:-2]                      # the check and the stickers are not steps

        # An existing gloss is only worth keeping when it was written as a SET.
        # Every lesson here carries a comment on section 1 and most carry it
        # nowhere else, and those lone ones are stale clones from whichever
        # lesson the file was copied from: Adding and Taking Away step 1 says
        # "count to 10", and Days, Months and Clocks step 1 says "flat shapes".
        # Carrying those forward would have written a wrong description next to
        # a right code, which is worse than no description -- so a gloss is
        # trusted only where the lesson annotates several steps (Asking and
        # Sorting does all thirteen), and otherwise the step's own <h2> wins.
        glossed = sum(1 for _c, _s, _t, cm, _i in teaching if gloss_of(cm))
        trust_gloss = glossed > 1
        edits = []
        for k, (cstart, sstart, title, comment, indent) in enumerate(teaching, 1):
            codes = sorted(set(omap.get((name, k), [])))
            annotated_codes |= set(codes)
            if not codes:
                continue                          # a step the validator maps to no objective
            have = set(re.findall(r"\b1[A-Z][a-z]\.\d\d\b", comment or ""))
            if have >= set(codes):
                continue                          # already recorded
            gloss = (gloss_of(comment) if trust_gloss else "") or title
            new = '%s<!-- %d  %s  %s -->\n%s' % (
                indent, k, ", ".join(codes), gloss, indent)
            edits.append((cstart, sstart, new, k, codes, gloss))

        if not edits:
            print("  --   %-28s already records its objectives" % name)
            continue
        print("  ok   %-28s %d step(s)" % (name, len(edits)))
        for _c, _s, _n, k, codes, gloss in edits[:4]:
            print("          %2d  %-18s %s" % (k, ", ".join(codes), gloss[:40]))
        if len(edits) > 4:
            print("          ... and %d more" % (len(edits) - 4))
        total_written += len(edits)

        # apply back-to-front so the offsets ahead of each edit stay valid
        for cstart, sstart, new, _k, _c, _g in reversed(edits):
            s = s[:cstart] + new + s[sstart:]
        if WRITE:
            io.open(os.path.join(BUILD, name), "w", encoding="utf-8", newline="").write(s)

    missing = sorted(all_codes - annotated_codes)
    print("\n  %d objective(s) of 36 now recorded in the pages" % len(annotated_codes))
    if missing:
        print("  NOT recorded (the validator maps them to no step): %s" % ", ".join(missing))
    print("  %d step comment(s) %s\n" % (total_written, "written" if WRITE else
                                         "to write -- pass --write"))
    return 0


sys.exit(main())
