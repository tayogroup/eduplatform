#!/usr/bin/env bash
# Rebuild all five Grade 3 lessons from the fragments into the directory above,
# then wire them to the platform.
#
# THE WIRING IS PART OF THE BUILD, and that is the whole point. Every tool in
# ../../lesson-app-tools patches a BUILT lesson in place, and these lessons are
# generated - so wiring applied by hand after a build is discarded by the next
# one, silently. That is the trap CLAUDE.md records for Mathematics, where ~20
# repair tools edit built units in place and a rebuild overwrote 125 of them.
#
# Running the tools here instead means a rebuild RE-APPLIES the wiring rather
# than losing it, and the tools stay the one shared definition of what wiring
# is - the same FIVE that wire Grade 2 (plus the page tools further down). It said four, and listed four, while
# Grade 2's own chain had five; the missing one was add-header-bars and the
# stale count is what made the omission read as deliberate. All five are
# idempotent, so this is safe to run repeatedly.
#
# The built .html files are committed as well as generated, because they are
# what deploys and a deploy must not depend on a shell that can run bash.
set -e
cd "$(dirname "$0")"
build() { ./build.sh "$1" "$2" "../$3.html"; }
build l1 "Up to a Thousand"              up-to-a-thousand
build l2 "Adding, Taking Away and Money" adding-and-money
build l3 "Rows and Rules"                rows-and-rules
build l4 "Equal Parts"                   equal-parts
build l5 "Shapes and Symmetry"           shapes-and-symmetry
build l6 "Measure It"                    measure-it
build l7 "Time and Direction"            time-and-direction
build l8 "Ask, Count and Chart"          ask-count-chart

echo
echo "wiring to the platform:"
cd ..
# add-header-bars LAST: it moves .top-actions onto bar 2, and the class
# controls mount themselves into that container, so it has to run after
# wire-platform-controls has put the container on the page. It was missing from
# this list while Grades 1, 2 and 4 all had the bars, which is why a Grade 3
# learner had no brand, no lesson picker, no voice toggle, no Menu and no Full
# screen - and the class controls floated in the hero instead of sitting beside
# it. The tool's own docstring describes that exact symptom, from when Grade 2
# shipped without it.
for t in wire-navigation wire-platform-controls wire-progress preload-platform add-header-bars; do
  python "../lesson-app-tools/$t.py" > /dev/null || { echo "  FAILED: $t"; exit 1; }
  echo "  ok  $t"
done

# The page tools the 2026-09-11 validation found this build had never had -
# a doctype and a language, feedback a screen reader announces, a skip link,
# fonts from our own CDN, and the "Can't hear it?" notice. Grades 1 and 2 had
# them applied by hand; a generated build has to run them itself, for the reason
# at the top of this file. ORDER MATTERS: wire-quiet-notice anchors on the
# role="main" that wire-accessibility puts on the deck, and refuses without it.
# Then the warm-up at the head of every lesson (2026-09-11 report, area 9: "a
# warm-up question per lesson"; its words are each lesson's warmUp in
# app.config.json), and last the hub's teachers-and-parents section, which
# reads the built lessons. All idempotent. The second steps for the thin
# lessons are NOT here - they live in the fragments (src/add-second-steps.py
# wrote them there once), because a step is teaching, not wiring.
python ../lesson-app-tools/add-page-doctype-lang.py *.html > /dev/null || { echo "  FAILED: add-page-doctype-lang"; exit 1; }
echo "  ok  add-page-doctype-lang"
for t in wire-accessibility self-host-fonts wire-quiet-notice add-warmup build-grownup-section; do
  python "../lesson-app-tools/$t.py" --app . --write > /dev/null || { echo "  FAILED: $t"; exit 1; }
  echo "  ok  $t"
done
python ../lesson-app-tools/check-lessons.py | tail -3
