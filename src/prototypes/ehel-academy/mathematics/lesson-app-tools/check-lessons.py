# -*- coding: utf-8 -*-
"""The gate on a standalone lesson build: is it a course, or a folder of pages?

Every assertion here is one that has actually been wrong in one of these
builds, or is the direct precondition of one that was:

  - a hub card pointing at a page that does not exist beside it (the Grade 2
    hub shipped pointing at claude.ai artifact URLs)
  - a lesson that drops the launch parameters, which makes the class controls
    and Wehel mount NOTHING, silently, on the next page (Grade 1, reported as
    "not displaying consistently")
  - a page importing a module the deploy does not carry, which is a 404 on a
    module specifier and takes the whole script with it
  - a lesson with no way back to the hub
  - stickers and finish() out of step, which is what drives the dot rail

It exits non-zero on a finding and 2 when it could not run at all - a gate
that cannot read its target and passes is green about nothing.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

MODULES = ["learner-controls.js", "wehel.js", "course-shell.js"]


# TEST THE PROPERTY, NOT THE TOOL THAT PUT IT THERE.
#
# The first version of this gate matched the marker comments its own tools
# write, and reported 22 findings against the LIVE Grade 1 build - which has
# every one of these properties, put there by grade-1-app's own five tools
# under different marker names. A gate that only recognises its own output is
# a gate on authorship.
#
# Both toolchains emit the same behaviour, so the behaviour is what is
# matched: the carrier's two load-bearing lines, and the back link's href.
def carries_params(s):
    # Two implementations, one behaviour: read location.search, drop `from`,
    # write the rest back onto in-app hrefs. grade-2's carrier does every
    # same-directory link; grade-1's hub does `a.lesson` and hardcodes
    # ?from=g1. Matching the exact line of one of them failed the LIVE build,
    # which carries the parameters perfectly well by other means.
    return 'q.delete("from")' in s and 'setAttribute("href"' in s


def has_back(s):
    return 'back.href = "index.html"' in s


def main():
    app = load()
    print("\n  Checking %s %s - %d lessons + %s\n" % (
        app.subject_label, app.grade_label, len(app.lessons), app.hub))

    bad = []

    def fail(where, msg):
        bad.append("%s: %s" % (where, msg))
        print("  FAIL %-26s %s" % (where, msg))

    hub = app.read(app.hub)
    for _, f, title in app.lessons:
        if ('href="%s?from=%s"' % (f, app.from_param)) not in hub:
            fail(app.hub, "no card links to %s with ?from=%s" % (f, app.from_param))
    if "claude.ai/code/artifact" in hub:
        fail(app.hub, "still links to a claude.ai artifact - that is a review "
                      "surface, not a page this build serves")
    if not carries_params(hub):
        fail(app.hub, "does not carry the launch parameters onto the cards")

    for unit, f, title in app.lessons:
        s = app.read(f)
        if "claude.ai/code/artifact" in s:
            fail(f, "links to a claude.ai artifact")
        if not carries_params(s):
            fail(f, "does not carry the launch parameters - the controls on the "
                    "NEXT page will mount nothing")
        if not has_back(s):
            fail(f, "no way back to the hub")
        if "mountLearnerControls" not in s:
            fail(f, "no class controls")
        if "mountWehelChat" not in s:
            fail(f, "no Wehel")
        if not re.search('class="[^"]*top-actions', s):
            fail(f, "no .top-actions - placeLearnerControls has nowhere to put "
                    "the buttons and they will not appear")
        for m in MODULES:
            # `from "./x.js"`, not just the string: the preload link contains
            # "./x.js" too, so a bare substring test is satisfied by the <link>
            # while the import is gone. Mutation-testing this gate is what
            # found that - deleting the escapeHtml import left it green.
            if ('from "./%s"' % m) not in s:
                fail(f, "does not import %s" % m)
            if ('href="./%s"' % m) not in s:
                fail(f, "does not preload %s" % m)
        if "createProgressClient" not in s:
            fail(f, "does not report progress - the group board will show "
                    "this learner as having done nothing")
        # A client nothing CALLS reports nothing, and mutation-testing this
        # gate is what found that: deleting the finish() hook left every
        # other progress assertion satisfied. Assert the call sites, not the
        # presence of the machinery - "a perfect function nothing invokes
        # protects nobody".
        if "window.__ehelStep(i, done)" not in s:
            fail(f, "finish() does not report the step - completions are "
                    "never sent")
        if "window.__ehelAt(cur)" not in s:
            fail(f, "show() does not report position - the board's pointer "
                    "will sit on the last COMPLETED step, not where the "
                    "learner is")
        # The record was read back for its attempted/knownWords baseline for
        # weeks while the dot rail and the step ignored it: a reopened lesson
        # started at step 1 every time. Assert the restore hook AND its call,
        # for the same reason the two above are asserted as call sites.
        if "window.__ehelRestore = function" not in s or "window.__ehelRestore(doneIdx, resumeIdx)" not in s:
            fail(f, "does not resume on reopen - a child who closes the tab "
                    "starts the lesson from step 1 while the record says otherwise")
        if ('UNIT = "%s%02d"' % (app.cfg.get("progressUnitPrefix", "u"), unit)) not in s:
            fail(f, "reports progress under the wrong unit id")
        if ("unitNo: %d," % unit) not in s:
            fail(f, "Wehel is told a unit number that is not %d" % unit)
        if "function finish" not in s and "finish(" not in s:
            fail(f, "no finish() - nothing marks a step done")
        if "STICKERS" not in s:
            fail(f, "no STICKERS")
        # every in-app anchor must name a file that is actually here
        for href in set(re.findall(r'href="([^"#:?]+\.html)[^"]*"', s)):
            if href == "index.html":
                continue  # the hub, renamed at deploy time
            if not os.path.isfile(app.path(href)):
                fail(f, "links to %s, which is not in this build" % href)
        if not bad or bad[-1].split(":")[0] != f:
            print("  ok   %-26s unit %d" % (f, unit))

    print()
    if bad:
        print("  %d finding(s)\n" % len(bad))
        sys.exit(1)
    print("  a course: every card resolves, every lesson carries the launch\n"
          "  parameters, has a way back, and mounts the platform controls\n")
    sys.exit(0)


main()
