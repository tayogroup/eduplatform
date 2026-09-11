# -*- coding: utf-8 -*-
"""Make a standalone lesson build ANSWER a learner who cannot see it.

Three faults, all of them build-wide, all found by auditing the RENDERED
accessibility state rather than the source. Each is generic to every standalone
build here (Maths, Science, Computing, Global Perspectives), which is why this
tool lives beside wire-progress.py instead of in one grade's directory.

1. THE FEEDBACK WAS NEVER ANNOUNCED. Every step marks the right option green
   and the tapped one red and then writes a sentence into a .fb panel saying
   why. None of those panels carried aria-live, role="status" or role="alert",
   so a child using a screen reader tapped an answer and was told NOTHING. The
   whole teach-try-correct loop is silent for them, on every step of every
   lesson. This is the one finding here a learner cannot work around.

   WHICH PANELS, AND WHY IT IS NOT "EVERY .fb". The .fb class is a visual panel
   style and the pages reuse it for three different jobs. Grade 1 Maths:

     85  ids containing "fb"   the feedback sentence          -> announce
     18  ids starting "score"  "Question 3 of 5", a counter   -> leave alone
      7  q10, q12, rule5, labe the QUESTION or a rule         -> leave alone

   Announcing the counter narrates "Question 2 of 5, Question 3 of 5" over the
   child's own reading, and announcing q10/q12 re-reads the question every time
   it changes. Worse, a learner would hear the question twice: once from the
   heading and once from the live region. So the rule is the id, not the class,
   and this tool prints the ids it SKIPPED as well as the ones it changed --
   a skipped id that should have been announced is invisible otherwise.

2. NO SKIP LINK, AND NO MAIN LANDMARK. Each page opens with two header bars,
   a hero and a nav before the first step, so reaching the lesson by keyboard
   means tabbing past all of it on every slide. The deck is already one element
   with an id, so this is a link to it plus role="main" on it.

3. THE STEP DOTS SHRINK TO 4 PIXELS. The stated defect was a 16 x 16 px target
   -- already far under a 44 px one, for five- and six-year-olds -- and the
   measured one is worse: `.dots` is a flex row with `max-width: 45%`, so with
   18 dots the buttons are compressed to **4 px wide** and 16 tall. Measured in
   the browser, not read off the stylesheet, which says 16 and means it.

   Two changes, and they are deliberately different in kind. `flex: 0 0 16px`
   stops the shrink, so the dot is the size the stylesheet always claimed. A
   transparent ::after then expands the TARGET to 32 x 32 without changing the
   dot the child sees -- the visual design is the owner's and is not what was
   broken. Back and Next are unaffected; the dots are a shortcut, which is why
   this was never a blocker and is still wrong.

WHAT THIS TOOL DOES NOT DO. It does not name figures. Naming is per-figure
judgement and the audit found the honest count is small and mostly the other
way: in Grade 1 Maths most unnamed SVGs sit beside their own caption (an
ordering card reading "longest", an instrument beside four named choices), so
they want aria-hidden, and the one lesson that genuinely depends on its
pictures -- Halves and Wholes -- already passes a `label:` through shapeSvg and
renders role="img" with a real name on every figure. A tool that labelled every
SVG would have added noise to the first group and duplicated the second. That
work belongs next to the content that needs it.

Idempotent: a second run reports and changes nothing.

  python wire-accessibility.py --app ../grade-1-app/g1v2
  python wire-accessibility.py --app ../grade-1-app/g1v2 --write
"""
import re
import sys

from _app import load

WRITE = "--write" in sys.argv

SKIP_LINK = '\n  <a class="eh-skip" href="#%s">Skip to the lesson</a>'

# Visually hidden until focused. It must not be display:none -- a display:none
# link is not focusable, so the skip link would exist and be unreachable, which
# is the shape of bug this whole tool is about.
CSS = """
/* ==== wire-accessibility.py ==== */
/* The skip link is off-screen until focused rather than display:none, because
   a display:none link cannot be focused and a skip link nobody can reach is
   worse than none. */
.eh-skip {
  position: absolute; left: -9999px; top: 0; z-index: 200;
  background: var(--card); color: var(--ink); border: 3px solid var(--teal);
  border-radius: 0 0 12px 0; padding: 10px 16px; font-weight: 800;
  font-family: "Inter", "Segoe UI", sans-serif; text-decoration: none;
}
.eh-skip:focus { left: 0; }
/* The dots are a flex row with a max-width, so 18 of them were squeezed to 4px
   wide. `flex: 0 0 16px` holds the size the rule above already declares; the
   ::after widens the TARGET to 32px without changing the dot a child sees. */
.dots button { flex: 0 0 16px; position: relative; }
.dots button::after {
  content: ""; position: absolute; left: -8px; top: -8px; right: -8px; bottom: -8px;
}
/* ...and 8px apart, not 6. With a 6px gap the dots sit 22px apart, so each
   32px target overlaps its neighbours' and the part a tap can only mean THIS
   dot is 22px wide: under the 24px minimum on exactly the screen - a phone -
   where the dots wrap into rows and a child's finger is widest. At 8px every
   dot owns a 24 x 24 cell, across and down. (2026-09-11 validation.) */
.dots { gap: 8px; }
"""
CSS_END = ".dots { gap: 8px; }\n"

MARKER = "wire-accessibility.py"


def announce(s, report):
    """role="status" aria-live="polite" on the feedback panels only."""
    done = skipped = already = 0
    out = []
    pos = 0
    for m in re.finditer(r'class="fb"\s+id="([A-Za-z0-9]+)"', s):
        ident = m.group(1)
        out.append(s[pos:m.end()])
        pos = m.end()
        if "fb" not in ident:
            skipped += 1
            report.setdefault("skipped", set()).add(ident)
            continue
        tail = s[m.end():m.end() + 120]
        if "aria-live" in tail.split(">")[0] or 'role="status"' in tail.split(">")[0]:
            already += 1
            continue
        out.append(' role="status" aria-live="polite"')
        done += 1
        report.setdefault("announced", set()).add(ident)
    out.append(s[pos:])
    return "".join(out), done, skipped, already


def wire(app, unit, name, title):
    s = app.read(name)
    report = {}
    changed = []

    s, done, skipped, already = announce(s, report)
    if done:
        changed.append("%d feedback panel%s announced" % (done, "" if done == 1 else "s"))

    # ---- the main landmark FIRST, because it decides what the link points at.
    # A lesson has the deck; the hub is a card grid and has no <body> tag at all
    # (it relies on HTML's implied ones, which is valid and is why a tool that
    # anchors on "<body>" refuses on it).
    # Each case has to recognise the ALREADY-WIRED form as well as the original.
    # The first version of this tool matched only the original, so a second run
    # found no deck and refused -- a refusal firing on the state the tool itself
    # had just produced, which is worse than no check at all.
    target = None
    if 'id="deck"' in s:
        target = "deck"
        if 'id="deck" role="main"' in s:
            pass                                    # already wired
        elif s.count('<div class="deck" id="deck">') == 1:
            s = s.replace('<div class="deck" id="deck">',
                          '<div class="deck" id="deck" role="main">', 1)
            changed.append("role=main")
        else:
            sys.exit("  REFUSED: %s has an id=\"deck\" this tool does not recognise" % name)
    elif 'class="grid"' in s:
        target = "lessons"
        if 'id="lessons"' in s:
            pass                                    # already wired
        elif s.count('<div class="grid">') == 1:
            s = s.replace('<div class="grid">',
                          '<div class="grid" id="lessons" role="main">', 1)
            changed.append("role=main")
        else:
            sys.exit("  REFUSED: %s has a card grid this tool does not recognise" % name)
    else:
        sys.exit("  REFUSED: %s has neither a deck nor a card grid, so this tool\n"
                 "  cannot say what a skip link should skip TO." % name)

    # ---- the skip link, before the first thing a learner can see
    #
    # NOT anchored on "<body>". None of these pages HAS a body tag -- they rely
    # on HTML's implied ones -- and the string "<body>" does appear in every
    # lesson, inside a CSS comment explaining why some custom properties live at
    # :root instead of on a class. The first version of this tool anchored there,
    # matched the comment, and inserted the skip link INSIDE the stylesheet on
    # all seven lessons. It reported success, the diff looked plausible, and the
    # link did not exist in the rendered page. So the anchor is the first
    # <header, and it is checked to fall outside the stylesheet.
    if "eh-skip" not in s:
        if "<header" not in s:
            sys.exit("  REFUSED: %s has no <header> to put the skip link before" % name)
        i = s.index("<header")
        if "</style>" in s and i < s.rindex("</style>"):
            sys.exit("  REFUSED: the first <header> in %s is inside a <style> block,\n"
                     "  so it is text in a comment rather than the page's own header." % name)
        s = s[:i] + (SKIP_LINK % target).strip() + "\n  " + s[i:]
        changed.append("skip link")

    # ---- the stylesheet block
    if MARKER not in s:
        if s.count("</style>") < 1:
            sys.exit("  REFUSED: %s has no </style> to append to" % name)
        i = s.rindex("</style>")
        s = s[:i] + CSS + s[i:]
        changed.append("dot targets + skip-link css")
    else:
        # A page wired by an earlier version of this block gets the current one,
        # so a change here reaches pages already built - the trap every
        # skip-if-marked tool in this directory has fallen into once. The old
        # block ends at the ::after rule; the current one at CSS_END.
        head = CSS.lstrip("\n")
        i = s.index(head.splitlines()[0])
        old_end = ".dots button::after {\n  content: \"\"; position: absolute; left: -8px; top: -8px; right: -8px; bottom: -8px;\n}\n"
        j = s.find(CSS_END, i)
        j = j + len(CSS_END) if j != -1 else s.index(old_end, i) + len(old_end)
        if s[i:j] != head:
            s = s[:i] + head + s[j:]
            changed.append("dot spacing css refreshed")

    if not changed:
        print("  --   %-28s already wired (%d announced)" % (name, already))
        return False
    print("  ok   %-28s %s" % (name, "; ".join(changed)))
    if report.get("skipped"):
        print("       left alone (not feedback): %s"
              % ", ".join(sorted(report["skipped"])))
    if WRITE:
        app.write(name, s)
    return True


def main():
    app = load()
    print("\n  Accessibility for %s %s\n" % (app.subject_label, app.grade_label))
    pages = list(app.lessons) + [(0, app.hub, "hub")]
    n = sum(1 for u, f, t in pages if wire(app, u, f, t))
    print("\n  %d page(s) changed%s\n" % (n, "" if WRITE else "  --  dry run, pass --write"))
    sys.exit(0)


main()
