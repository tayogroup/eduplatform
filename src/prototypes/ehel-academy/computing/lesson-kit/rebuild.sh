#!/bin/sh
# Rebuild one Computing grade from its content modules, in the one order that
# works.
#
#   sh ../lesson-kit/rebuild.sh          # from a grade-N-app directory
#
# build-lessons.py writes every page from scratch, so it must run first and the
# whole chain must run after it - rebuilding one lesson leaves that page
# unwired, and running the builder again over a wired page throws the wiring
# away. build-lesson-search.py derives the index FROM the finished pages, so it
# runs after the content is final and before add-lesson-search.py mounts the
# box that reads it.
#
# Stops at the first failure. The three gates at the end are the ones that
# decide whether this build ships: check-lessons.py (the shared pipeline's own),
# check-coverage.py (the curriculum gate, including the Cambridge Learner's Book
# arm) and check-question-shape.py (the defect classes a human read looks for
# that a machine can decide - a duplicated option, an explanation naming the
# wrong one, a key three times the length of every distractor).
#
# That last one is here because the read it partly replaces was done ONCE, by
# hand, over all 914 questions, and a read cannot be re-done on every build. It
# went in at zero findings across all four grades, so anything it reports is a
# question authored after it - which is the only kind of finding a gate wired in
# after the fact can honestly claim.
#
# T is the SHARED pipeline directory and it is overridable ON PURPOSE. Several
# sessions edit this tree at once, and on 2026-09-16 two of those shared tools
# (build-lesson-search.py, wire-platform-controls.py) held another session's
# UNCOMMITTED work. A plain rebuild bakes whatever is in the working copy into
# the pages, so a content commit made that way carries a peer's unreviewed
# change inside it. To build against the committed tools instead:
#
#   git archive HEAD src/prototypes/ehel-academy/mathematics/lesson-app-tools \
#     | tar -x -C /tmp/tools-HEAD --strip-components=5
#   T=/tmp/tools-HEAD sh ../lesson-kit/rebuild.sh
#
# Unlike the Science kit's copy, the search index here is built with $T too.
# Science defaults its index to the WORKING tree because HEAD's copy would
# strip synonym bridges its committed index already carried; Computing's
# committed indexes carry none, so there is nothing to lose and the rule
# ("never ship a peer's uncommitted work") applies unmodified. Measured
# 2026-09-16.
set -e

T=${T:-../../mathematics/lesson-app-tools}
K=../lesson-kit

python $K/build-lessons.py           --app .
python $K/build-hub.py               --app .
python $T/wire-navigation.py         --app .
python $T/wire-platform-controls.py  --app .
python $T/preload-platform.py        --app .
python $T/wire-progress.py           --app .
python $T/add-header-bars.py         --app .
python ${S:-$T}/build-lesson-search.py --app .
python $T/add-lesson-search.py       --app .
python $T/check-lessons.py           --app .
python $K/check-coverage.py          --app .
python $K/check-question-shape.py    --app .
python $K/build-review-pack.py       --app .
