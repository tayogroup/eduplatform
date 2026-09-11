# -*- coding: utf-8 -*-
"""Two drawings in Shapes and Sizes that contradicted their own lesson.

    python fix-turn-and-tree.py            # report
    python fix-turn-and-tree.py --write

STEP 5, "TURN IT ROUND" (1Gg.07): THE CIRCLE CARRIED A WHITE DOT THAT TURNED
WITH IT. The dot was there so a child could SEE the turn - a plain circle
rotating shows no movement at all - but it sat inside the rotating group, so
after the quarter turn it had moved from the top right to the bottom right. The
picture had visibly changed, and the key says the circle "looks the same".
A child who watched closely and answered "different" was marked wrong for
looking. Measured, not reasoned: the dot's centre moves from (140, 70) to
(130, 140).
  The turn is now shown by a gold quarter-turn arrow OUTSIDE the shape, drawn
once the shape has turned, so the child still sees that something happened and
the shape itself carries no mark. The SVG's viewBox grows from 0 0 200 200 to
-20 -20 240 240 to give the arrow room clear of every shape's sweep: the
rectangle's corners reach 88.6 from the centre, the arrow runs at 106.

STEP 6, "LONG, LONGER, LONGEST" (1Gg.02): THE SHORT TREE HAD NO TRUNK AND SANK
UNDER THE GROUND. tree(h) draws a 40-unit crown on a trunk that runs down to
the ground at y 96, so it only works for h above 42: at the 24 the step asked
for, the trunk's height is -2 (the browser refuses it: "A negative value is not
valid") and the crown's lower half is cut off by the bottom of the picture. The
three trees are now 48, 64 and 82 - the same order, short / taller / tallest,
each with a trunk on the same ground - and tree() says where its floor is.

Applies to the live lesson (g1v2/) AND to the five-lesson build's
shapes-and-sizes.html beside this file: that one is compose-lessons.py's INPUT,
so leaving it would hand both defects back to the seven on the next re-derive.

Guarded by a marker; every anchor must match exactly once or the file is refused.
"""
import io, os, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
FILES = [os.path.join(HERE, "g1v2", "shapes-and-sizes.html"),
         os.path.join(HERE, "shapes-and-sizes.html")]
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-fix-turn-and-tree"

EDITS = [
    ("the turning picture's room for the arrow",
     '<svg id="sv5" viewBox="0 0 200 200" role="img" aria-label="A shape that turns"></svg>',
     '<svg id="sv5" viewBox="-20 -20 240 240" role="img" aria-label="A shape that turns"></svg>'),
    ("the circle without its dot, and the turn arrow",
     '    const body = T.circle ? \'<circle class="flat b" cx="100" cy="100" r="76"></circle>'
     '<circle cx="140" cy="70" r="12" fill="#fff"></circle>\' : poly(T.pts, "b");\n'
     '    $("sv5").innerHTML = \'<g id="g5" style="transform-origin:100px 100px; transition:\' + '
     '(anim ? "transform 700ms ease" : "none") + \'; transform:rotate(\' + ang5 + \'deg)">\' + body + "</g>";\n',
     '    /* ' + MARK + ': NO MARK ON THE SHAPE. The circle carried a white dot\n'
     '       that turned with it, so after the quarter turn the picture had changed\n'
     '       while the key says it "looks the same". The arrow OUTSIDE the shape\n'
     '       shows the turn without changing what turned. See fix-turn-and-tree.py */\n'
     '    const body = T.circle ? \'<circle class="flat b" cx="100" cy="100" r="76"></circle>\' : poly(T.pts, "b");\n'
     '    $("sv5").innerHTML = \'<g id="g5" style="transform-origin:100px 100px; transition:\' + '
     '(anim ? "transform 700ms ease" : "none") + \'; transform:rotate(\' + ang5 + \'deg)">\' + body + "</g>" +\n'
     '      (ang5 ? \'<g class="turn-mark"><path d="M100,-6 A106,106 0 0 1 206,100" fill="none" stroke="var(--gold)" '
     'stroke-width="7" stroke-linecap="round"></path><polygon points="194,92 218,92 206,114" fill="var(--gold)"></polygon></g>\' : "");\n'),
    ("tree() says where its floor is",
     '  function tree(h, col) {\n',
     '  /* ' + MARK + ': the crown is 40 tall and the trunk runs down to the ground\n'
     '     at y 96, so h must be above 42 - below that the trunk\'s height goes\n'
     '     negative and the crown sinks under the ground. */\n'
     '  function tree(h, col) {\n'),
    ("the three trees at heights tree() can draw",
     '          { v: 3, n: "the tallest tree", h: tree(70, "good") + \'<span class="cap">tallest</span>\' },\n'
     '          { v: 1, n: "the short tree", h: tree(24, "good") + \'<span class="cap">short</span>\' },\n'
     '          { v: 2, n: "the taller tree", h: tree(46, "good") + \'<span class="cap">taller</span>\' },\n',
     '          { v: 3, n: "the tallest tree", h: tree(82, "good") + \'<span class="cap">tallest</span>\' },\n'
     '          { v: 1, n: "the short tree", h: tree(48, "good") + \'<span class="cap">short</span>\' },\n'
     '          { v: 2, n: "the taller tree", h: tree(64, "good") + \'<span class="cap">taller</span>\' },\n'),
]

done = skipped = refused = 0
for p in FILES:
    name = os.path.relpath(p, HERE)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    bad = ["%s (found %d times)" % (label, s.count(old)) for label, old, _new in EDITS if s.count(old) != 1]
    if bad:
        print("  REFUSED  %s  not exactly once: %s" % (name, "; ".join(bad)))
        refused += 1
        continue
    for _label, old, new in EDITS:
        s = s.replace(old, new, 1)
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %s  (%d edits)" % ("wrote   " if WRITE else "would   ", name, len(EDITS)))
    done += 1

print("\n  %s: %d fixed, %d already done, %d refused" % ("write" if WRITE else "report", done, skipped, refused))
sys.exit(1 if refused else 0)
