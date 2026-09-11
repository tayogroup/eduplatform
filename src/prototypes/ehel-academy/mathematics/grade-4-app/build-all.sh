#!/usr/bin/env bash
# Rebuild the eight Grade 4 lessons and the hub, THEN wire them to the platform.
#
# THE WIRING IS PART OF THE BUILD, and that is the whole point. Every tool in
# ../lesson-app-tools patches a BUILT lesson in place, and these lessons are
# generated - so wiring applied by hand after a build is discarded by the next
# one, silently. This build's own README says so in capitals, and measured it:
# a single rebuild took progress-client from 1 to 0 and learner-controls from 3
# to 0 across the set.
#
# Until 2026-09-09 that risked nothing, because no learner could reach these
# pages. Grade 4 is routed now, so the same rebuild would put pages in front of
# children with no Class chat, no Raise hand, no Wehel and nothing reported to
# the live group board - and the symptom is ABSENCE, so nobody would see it.
# Grade 3 has had this script for exactly this reason; Grade 4 did not.
#
# All five wiring tools are idempotent, so this is safe to run repeatedly.
#
# COMPOSING IS THE FIRST STEP NOW (2026-09-11). This used to leave out
# compose-lessons.py on the grounds that it OVERWRITES the c-*-body.html and
# c-*-slides.js files this reads, and a rebuild must not destroy hand edits to
# them. But those files were never committed, so a fresh clone could not run
# this script at all - build-lessons.py stopped on the first missing c-* - and
# a hand edit to an untracked file had no second copy anyway. Measured before
# changing it: composing from the tracked sources reproduces all sixteen c-*
# files exactly (CRLF apart - compose wrote CRLF on Windows until the same day).
# So they are intermediates, they are gitignored, and the tracked sources
# (num-, frac-, time-, shape-, stats-slides.js, the new-* files, g4-lesson.js)
# are where every change is made.
#
# build-hub.py READS ../grade-2-app/g2-index.html - the hub is built on Grade
# 2's design - so this needs grade-2-app beside it and is not runnable from a
# copy of grade-4-app alone. Found by testing this script in an isolated copy,
# where it stopped at the hub; `set -e` is what turned that into a stop rather
# than an unwired build carrying on to the wiring step with no hub.
set -e
cd "$(dirname "$0")"

echo "building:"
python compose-lessons.py > /dev/null
echo "  ok  compose-lessons"
python build-lessons.py
python build-hub.py

echo
echo "wiring to the platform:"
for t in wire-navigation wire-platform-controls wire-progress preload-platform add-header-bars; do
  python "../lesson-app-tools/$t.py" > /dev/null || { echo "  FAILED: $t"; exit 1; }
  echo "  ok  $t"
done

# The page tools the 2026-09-11 validation found this build had never had -
# Grades 1 and 2 had them applied by hand, and a generated build has to run them
# itself. ORDER MATTERS: wire-quiet-notice anchors on the role="main" that
# wire-accessibility puts on the deck. Then the three the same report's
# teaching areas asked for: the "How do you know?" step (reasoning_banks.py),
# an authored explanation on every slide (explanations.txt) and a warm-up at
# the head of each lesson (warmUp in app.config.json). ORDER MATTERS here too:
# the reasoning step adds a slide, and add-explanations fails the build if any
# slide has no explanation, so the step must exist before it is counted. Then
# the hub's teachers-and-parents section - AFTER build-hub.py, which rebuilds
# the hub from Grade 2's and would wipe it, and after the reasoning step, whose
# slide it counts into each lesson's time. All idempotent.
python ../lesson-app-tools/add-page-doctype-lang.py $(python -c "import json; c=json.load(open('app.config.json')); print(' '.join([l['file'] for l in c['lessons']] + [c['hub']]))") > /dev/null || { echo "  FAILED: add-page-doctype-lang"; exit 1; }
echo "  ok  add-page-doctype-lang"
for t in wire-accessibility self-host-fonts wire-quiet-notice add-reasoning-step add-explanations add-warmup build-grownup-section; do
  python "../lesson-app-tools/$t.py" --app . --write > /dev/null || { echo "  FAILED: $t"; exit 1; }
  echo "  ok  $t"
done

echo
echo "gates:"
python ../lesson-app-tools/check-lessons.py | tail -3
python ../lesson-app-tools/check-judging.py | tail -2
