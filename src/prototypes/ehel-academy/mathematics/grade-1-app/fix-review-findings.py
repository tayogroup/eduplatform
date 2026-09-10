# -*- coding: utf-8 -*-
"""Three findings from the Grade 1 Maths validation that are each one edit.

1. A STEP YOU HAVE FINISHED LOOKS UNFINISHED WHILE YOU ARE STANDING ON IT.
   `paintDots` is

       (i === cur ? "now" : done[i] ? "done" : "")

   so the current dot is "now" and never "done", whatever the learner has
   achieved on it. Finish a step and the dot stays teal; move on and it turns
   green behind you. Two costs: a child re-does a step they have already
   completed, and the sticker board and the dots disagree about the same step.
   It also cost this review a wrong measurement -- the browser reported
   `dotsDone: 1` where the progress record said two sections were done, and the
   record was right.

   The fix keeps both facts: "done" when it is done, plus "now" when it is the
   one you are on, and CSS that shows a finished current step as green and
   ringed rather than picking one. The aria-label says which, because the colour
   is the whole signal and a screen reader gets none of it.

2. ONE QUIZ STEM ASKS TWO DIFFERENT QUESTIONS. Counting to Twenty's check has
   "How many counters?" twice -- once over 7 counters and once over 14. Both
   keys are right and the pictures differ, so nothing is wrong with the
   mathematics; it reads as a repeat, and a child who has just answered 7 sees
   the same words again. The second becomes "And how many counters now?", which
   is what a teacher would say.

3. THE SORT CARDS HAD NO NAMES. Asking and Sorting's hoop, Venn and Carroll
   steps are the one place in this build where the FIGURE carries the
   information -- a card's colour and shape are the data being sorted, and they
   appear nowhere in the text. The lesson already has `cardName(c)` (it says
   "red circle", "blue square"), so this is that name, on the drawing.

   Everything else unnamed in this build is decorative and is left alone
   deliberately: the ordering cards in Shapes and Sizes carry a visible caption
   ("short", "longer", "longest"), the four measuring instruments sit beside
   four named choices, and Halves and Wholes already passes a real label
   through shapeSvg. Labelling those would have read the caption twice.

Idempotent: a second run reports and changes nothing.

  python fix-review-findings.py
  python fix-review-findings.py --write
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "g1v2")
WRITE = "--write" in sys.argv
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unknown argument %r -- this script edits lesson pages in place" % a)

OLD_DOTS = ('\'<button type="button" class="\' + (i === cur ? "now" : done[i] ? "done" : "") '
            '+ \'" data-i="\' + i + \'" aria-label="Step \' + (i + 1) + \'"></button>\'')
NEW_DOTS = ('\'<button type="button" class="\' + (done[i] ? "done" : "") + (i === cur ? " now" : "") '
            '+ \'" data-i="\' + i + \'" aria-label="Step \' + (i + 1) + (done[i] ? ", done" : "") '
            '+ \'"></button>\'')

DOT_CSS_MARK = "fix-review-findings.py"
DOT_CSS = """
/* ==== fix-review-findings.py ==== */
/* A finished step you are standing on is BOTH done and current, and the dot
   used to show only "current" -- so a child re-did steps they had completed and
   the dots disagreed with the sticker board. Green says done; the ring and the
   scale say you are here. Declared after the .now and .done rules so it wins on
   order rather than on specificity. */
.dots button.done.now {
  background: var(--good); border-color: var(--good);
  box-shadow: 0 0 0 3px var(--card), 0 0 0 6px var(--good);
}
"""


def fix_dots(name, s, changed):
    if NEW_DOTS in s:
        return s
    if s.count(OLD_DOTS) != 1:
        sys.exit("  REFUSED: %s has %d copies of the paintDots markup this expects"
                 % (name, s.count(OLD_DOTS)))
    s = s.replace(OLD_DOTS, NEW_DOTS, 1)
    changed.append("dot classes")
    return s


def fix_dot_css(name, s, changed):
    if DOT_CSS_MARK in s:
        return s
    i = s.rindex("</style>")
    s = s[:i] + DOT_CSS + s[i:]
    changed.append("dot css")
    return s


def fix_stem(name, s, changed):
    if name != "counting-to-twenty.html":
        return s
    old = ('{ q: "How many counters?", pic: 14, opts: [14, 13, 15], a: 14, '
           'say: "How many counters?" }')
    new = ('{ q: "And how many counters now?", pic: 14, opts: [14, 13, 15], a: 14, '
           'say: "And how many counters now?" }')
    if new in s:
        return s
    if s.count(old) != 1:
        sys.exit("  REFUSED: the 14-counter check item is not the shape this expects")
    s = s.replace(old, new, 1)
    changed.append("duplicate stem")
    return s


def fix_cards(name, s, changed):
    """Name the sort cards.

    THE QUOTING HERE IS THE WHOLE DIFFICULTY. Each card is built inside a
    SINGLE-quoted JavaScript string, so the label has to close that string,
    concatenate cardName(c), and reopen it -- the attribute's own quotes must be
    double. The first version emitted aria-label='" + cardName(c) + "', whose
    single quotes terminated the JS string early: the page stopped parsing,
    every step after it was dead, and `check-lessons.py` passed because it reads
    structure and does not parse JavaScript. Only `node --check` on the
    extracted block found it.
    """
    if name != "asking-and-sorting.html":
        return s
    label = '<svg viewBox="0 0 60 60" role="img" aria-label="\' + cardName(c) + \'">'
    if label in s:
        return s
    out = s
    for shape in ("circle", "rect", "polygon"):
        pat = '<svg viewBox="0 0 60 60"><%s' % shape
        if out.count(pat) != 1:
            sys.exit("  REFUSED: expected exactly one 60x60 %s card svg in %s, found %d"
                     % (shape, name, out.count(pat)))
        out = out.replace(pat, label + "<%s" % shape, 1)
    changed.append("3 sort cards named")
    return out


def main():
    cfg = json.load(io.open(os.path.join(BUILD, "app.config.json"), encoding="utf-8"))
    any_change = False
    for l in cfg["lessons"]:
        name = l["file"]
        s = io.open(os.path.join(BUILD, name), encoding="utf-8").read()
        changed = []
        s = fix_dots(name, s, changed)
        s = fix_dot_css(name, s, changed)
        s = fix_stem(name, s, changed)
        s = fix_cards(name, s, changed)
        if not changed:
            print("  --   %-28s already fixed" % name)
            continue
        any_change = True
        print("  ok   %-28s %s" % (name, "; ".join(changed)))
        if WRITE:
            io.open(os.path.join(BUILD, name), "w", encoding="utf-8", newline="").write(s)
    print("\n  %s\n" % ("written" if WRITE and any_change else
                        "dry run -- pass --write" if any_change else "nothing to do"))
    return 0


sys.exit(main())
