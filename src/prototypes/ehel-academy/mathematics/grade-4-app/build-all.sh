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
# NOT INCLUDED, DELIBERATELY: compose-lessons.py, which regenerates the
# c-*-body.html and c-*-slides.js sources this reads. Composing is a separate,
# deliberate act - it OVERWRITES those sources, so folding it in here would
# make "rebuild the pages" quietly destroy hand edits to the composed files.
# Run it yourself when you mean to.
#
# build-hub.py READS ../grade-2-app/g2-index.html - the hub is built on Grade
# 2's design - so this needs grade-2-app beside it and is not runnable from a
# copy of grade-4-app alone. Found by testing this script in an isolated copy,
# where it stopped at the hub; `set -e` is what turned that into a stop rather
# than an unwired build carrying on to the wiring step with no hub.
set -e
cd "$(dirname "$0")"

echo "building:"
python build-lessons.py
python build-hub.py

echo
echo "wiring to the platform:"
for t in wire-navigation wire-platform-controls wire-progress preload-platform add-header-bars; do
  python "../lesson-app-tools/$t.py" > /dev/null || { echo "  FAILED: $t"; exit 1; }
  echo "  ok  $t"
done

echo
echo "gates:"
python ../lesson-app-tools/check-lessons.py | tail -3
python ../lesson-app-tools/check-judging.py | tail -2
