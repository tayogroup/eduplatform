# -*- coding: utf-8 -*-
"""Computing's own header-bar sizing, appended after the shared pipeline's.

    python ../lesson-kit/own-header-css.py --app .

WHY THIS EXISTS. The bar at the top of every lesson page is drawn by the SHARED
`mathematics/lesson-app-tools/add-header-bars.py`, and its `.eh-b1right` is
`flex: 0 0 auto`. That was right when it was written - a brand, a progress track
and two small controls always fitted. Then `add-lesson-search.py` began
injecting a 141px search field INTO that container, and a no-shrink flex item
sizes to max-content whatever the viewport does. Measured at 375x812: 44px off
the right of every lesson page, carrying the voice toggle off the screen.

The fix lived in the shared tool for a while and was reverted out of it on
2026-09-17, because that file belongs to every subject and this session's remit
is Computing. So Computing keeps its own copy, and keeps it HERE rather than in
a peer's file. Nothing outside `computing/` is touched.

WHAT IT DOES, and why it is an append rather than an edit. It adds three rules
at the end of the page's single stylesheet, so they win on order at equal
specificity:

    .eh-b1right   shrinkable, and `min-width: 0` beside it - a flex item's floor
                  is its min-content width, so the flex alone shrinks nothing
    .eh-icon      pinned at 40px. Measured: with the container shrinkable and
                  the icon left at the flex default, the voice toggle collapses
                  to 22px, under the tap target
    .eh-picker    hidden below 480px. At 375px five things do not fit and one
                  has to go; the picker is the one whose jobs are already on
                  screen - bar 2 prints the lesson title and its Menu reaches
                  the hub, which lists every lesson. The progress track is NOT
                  droppable: nothing else on a narrow page reports progress
                  (`.eh-steps` is `display: none` there) and the pill beside it
                  reads a real percentage.

It appends instead of rewriting the shared rule so that it does not depend on
that rule's exact text, which belongs to somebody else and will change.

IT REFUSES RATHER THAN NO-OPS. If a page has no `.eh-b1right` at all, the shared
bar has changed shape and this override may no longer be doing anything - which
is the failure mode that matters, because CSS is invisible to every gate in this
kit. `check-lessons.py` does not measure layout, so a silent no-op would put the
44px back with a green build.
"""
import io
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

HERE = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
MARK = "Computing's own header-bar sizing"

BLOCK = """
  /* ---- %s - own-header-css.py ----
     The shared add-header-bars.py draws this bar with `.eh-b1right` at
     `flex: 0 0 auto`, which was right before add-lesson-search.py began
     injecting a 141px search field into it. A no-shrink flex item sizes to
     max-content whatever the viewport does: 44px off the right at 375px, with
     the voice toggle carried off the screen. Appended here, last in the sheet,
     so it wins on order without editing a file that belongs to every subject. */
  .eh-b1right { flex: 0 1 auto; min-width: 0; }
  .eh-icon { flex: 0 0 auto; }
  @media (max-width: 480px) { .eh-picker { display: none; } }
""" % MARK


def main():
    cfg = os.path.join(HERE, "app.config.json")
    if not os.path.isfile(cfg):
        print("  cannot run: no app.config.json in %s" % HERE)
        sys.exit(2)
    import json
    conf = json.load(io.open(cfg, encoding="utf-8"))
    pages = [conf["hub"]] + [l["file"] for l in conf["lessons"]]

    done = skipped = 0
    for name in pages:
        p = os.path.join(HERE, name)
        if not os.path.isfile(p):
            print("  REFUSED %-34s not built" % name)
            sys.exit(1)
        s = io.open(p, encoding="utf-8", newline="").read()
        if MARK in s:
            skipped += 1
            continue
        if ".eh-b1right" not in s:
            print("  REFUSED %-34s no .eh-b1right - the shared bar has changed shape,\n"
                  "          and this override would silently do nothing" % name)
            sys.exit(1)
        i = s.rfind("</style>")
        if i < 0:
            print("  REFUSED %-34s no </style> to append to" % name)
            sys.exit(1)
        io.open(p, "w", encoding="utf-8", newline="").write(s[:i] + BLOCK + s[i:])
        done += 1
        print("  ok   %-34s header sizing appended" % name)

    if skipped:
        print("  %d page(s) already carried it" % skipped)
    print("\n  %d page(s) given Computing's own header sizing\n" % (done + skipped))


main()
