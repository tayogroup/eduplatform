# -*- coding: utf-8 -*-
"""The gate on the lesson-content search. Every assertion has been wrong once.

Each of these failed during the build on 2026-09-12, in the browser, on this
very build - none is hypothetical:

  the index was STALE               a content change without a rebuild leaves
                                    the field answering about the old lessons
  the field was OUTSIDE bar 1       it has to sit beside the picker, which is
                                    the whole placement the owner asked for
  the JS was OUTSIDE the lesson     `show` lives in the lesson's own IIFE; a
  IIFE                              block outside it cannot move the deck and
                                    the deep link silently does nothing
  a result dropped the launch       ?pwsToken gone = the learner's work stops
  parameters                        reaching the school, with nothing on screen
  the index was not DEPLOYED        extraPages is what ships it; without the
                                    entry the field ships and answers nothing
  a term matched half the slides    ranks every slide the same for that word,
                                    which is the same as having no index

IT ASKS THE REAL BUILDER whether the index is current, rather than re-deriving
with a second copy of the slide parser. One definition: the parser that wrote
the index is the parser that checks it. That also covers every step index
being inside its deck, because the derivation is the only thing that emits
them and it stops one slide short of the sticker page.

IT KEYS ON CODE, NOT ON ITS OWN COMMENTS. `check-lessons.py` was once green
on every build it made and red on the live one because it matched the marker
strings its own tools write - a gate on authorship. So the assertions below
look for getElementById("ehFind") and the two navigation call sites, which is
what any implementation of this feature has to contain.

EXIT CODES. 0 pass, 1 findings, 2 cannot run (no config, builder missing),
3 the feature is not wired in this build - which is NOT a pass, the same
distinction check-ehel-deploy-sync.mjs draws with --after-deploy.

MUTATION-TESTED TWELVE WAYS, all caught, green again on restore - and TWO of
those twelve prove less than they appear to. Planting a ghost lesson in the
index, and pasting a term onto every step, both fail on the STALENESS check
first, because editing the index by hand is exactly what the byte-compare
catches. So those two assertions are defence in depth against a hand-edited
index and are NOT established by this suite; the live evidence for the
half-the-slides rule is the BUILDER refusing "counting" at 53 of 95 on its
first run. Same shape as the capstone floor in ehel-academy/CLAUDE.md, where only breaking
the extractor AND rebuilding reaches the floor. Two of the twelve were also
gate bugs rather than build bugs - see the listener and the message below.

    python ../lesson-app-tools/check-lesson-search.py
"""
import io
import json
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = "lesson-search.json"
BUILDER = os.path.join(HERE, "build-lesson-search.py")

# the lesson's own state array - the anchor add-header-bars.py uses, and for
# its reason: `slides` alone also matches wire-progress.py's module
DONE_DECL = "const done = new Array(slides.length).fill(false)"
SCRIPTS = re.compile(r"<script[^>]*>(.*?)</script>", re.S)

bad = []


def fail(where, what):
    bad.append((where, what))


def main():
    app = load()
    if not os.path.isfile(BUILDER):
        print("  cannot run: %s is missing" % BUILDER)
        raise SystemExit(2)

    pages = [app.hub] + [f for _, f, _ in app.lessons]
    wired = ['id="ehFind"' in app.read(p) for p in pages]
    if not any(wired):
        print("\n  %s %s has no lesson search wired.\n"
              "  Run build-lesson-search.py then add-lesson-search.py.\n"
              "  NOT a pass - nothing was checked.\n"
              % (app.subject_label, app.grade_label))
        raise SystemExit(3)

    print("\n  Lesson search: %s %s\n" % (app.subject_label, app.grade_label))

    # ---- 1 the index is present, and current with the pages on disk -------
    if not os.path.isfile(app.path(INDEX)):
        fail(INDEX, "missing - the field cannot answer anything")
    else:
        r = subprocess.run([sys.executable, BUILDER, "--check", "--app", app.root],
                           capture_output=True, text=True, encoding="utf-8")
        if r.returncode != 0:
            fail(INDEX, "STALE: re-derives differently from the lessons on "
                        "disk. Run build-lesson-search.py and commit it.")

    # ---- 2 it is deployed ------------------------------------------------
    if INDEX not in (app.cfg.get("extraPages") or []):
        fail("app.config.json", 'extraPages does not list %s, so deploy.mjs '
                               "will not upload it and the field ships answering nothing" % INDEX)

    # ---- 3 the index describes this build --------------------------------
    doc = None
    try:
        doc = json.load(io.open(app.path(INDEX), encoding="utf-8"))
    except Exception as e:                                   # noqa: BLE001
        fail(INDEX, "is not readable JSON: %s" % e)
    if doc:
        named = set(f for _, f, _ in app.lessons)
        steps = 0
        for l in doc.get("lessons", []):
            if l.get("file") not in named:
                fail(INDEX, "names %r, which app.config.json does not"
                     % l.get("file"))
            steps += len(l.get("steps") or [])
            for s in l.get("steps") or []:
                if not isinstance(s.get("i"), int) or s["i"] < 0:
                    fail(INDEX, "%s has a step with no slide index" % l.get("file"))
        if not steps:
            fail(INDEX, "indexes no steps at all")
        # a term on more than half the slides ranks everything equally for it
        if steps:
            hits = {}
            for l in doc.get("lessons", []):
                for s in l.get("steps") or []:
                    for t in (s.get("g") or "").split():
                        hits[t] = hits.get(t, 0) + 1
            for t, n in sorted(hits.items()):
                if n > steps / 2:
                    fail(INDEX, "term %r is on %d of %d steps - it cannot rank"
                         % (t, n, steps))
        if doc.get("fromParam") != app.from_param:
            fail(INDEX, "fromParam %r does not match app.config.json %r"
                 % (doc.get("fromParam"), app.from_param))

    # ---- 4 every page carries a working control --------------------------
    for p, ok in zip(pages, wired):
        s = app.read(p)
        if not ok:
            fail(p, "has no search field while other pages do")
            continue
        if 'id="ehFound"' not in s:
            fail(p, "has the field but no results panel")
        if 'getElementById("ehFind")' not in s:
            fail(p, "has the field but nothing reads it - a control that "
                    "does nothing is worse than none")

        # the field sits in bar 1's right-hand group, beside the picker
        right = s.find('class="eh-b1right"')
        find_at = s.find('id="ehFind"')
        pick_at = s.find('id="ehPicker"')
        if right < 0:
            fail(p, "has no .eh-b1right - bar 1 is missing")
        elif not (right < find_at):
            fail(p, "the field is outside bar 1's right-hand group")
        elif pick_at > 0 and not (find_at < pick_at):
            fail(p, "the field is not before the lesson picker")

        # results must carry the launch parameters, on BOTH paths
        if 'location.href = row.file + query()' not in s:
            fail(p, "a cross-lesson result does not carry the launch "
                    "parameters through query()")
        if 'history.replaceState' not in s:
            fail(p, "a same-lesson result does not put the step in the URL")
        if '"?from=' + app.from_param not in s:
            fail(p, "results do not re-add ?from=%s" % app.from_param)

        # the deep link, and the hash it reads.
        # `addEventListener("hashchange"`, not the bare word: the injected
        # code CARRIES a comment containing "hashchange", so testing for the
        # word passed a build whose listener had been deleted. Mutation-tested
        # - it is the README's own "./course-shell.js" bug, where the gate was
        # satisfied by a modulepreload tag rather than by an import.
        if 'addEventListener("hashchange"' not in s or "#step-" not in s:
            fail(p, "does not act on a #step-N deep link")

        # THE SCOPE ASSERTION. On a lesson page the search JS must sit inside
        # the script that declares the lesson's own state, or `show` is not in
        # scope: same-lesson results would navigate instead of moving the deck
        # and the deep link would do nothing at all. The hub has no such
        # script and is exempt by construction.
        if p != app.hub:
            own = [b.group(1) for b in SCRIPTS.finditer(s) if DONE_DECL in b.group(1)]
            if len(own) != 1:
                fail(p, "found %d scripts declaring the lesson's state, want 1"
                     % len(own))
            elif 'getElementById("ehFind")' not in own[0]:
                fail(p, "the search JS is OUTSIDE the lesson's own script, so "
                        "show() is not in scope: the deep link cannot work")

        # the honest zero. The LITERAL with its quotes, for the same reason as
        # the listener above: the block's own comment quotes the message while
        # explaining a measurement, so a bare substring test was satisfied by
        # the prose and passed a build that had lost the message.
        if '"No step in "' not in s:
            fail(p, "never tells a learner when nothing matched")

    for where, what in bad:
        print("  FAIL %-30s %s" % (where[:30], what))
    if not bad:
        for p in pages:
            print("  ok   %-30s field, panel, scope, launch parameters" % p[:30])
        n = sum(len(l.get("steps") or []) for l in (doc or {}).get("lessons", []))
        print("\n  the hub and all %d lessons can search %d indexed steps\n"
              % (len(app.lessons), n))
    else:
        print("\n  %d finding(s)\n" % len(bad))
    raise SystemExit(1 if bad else 0)


main()
