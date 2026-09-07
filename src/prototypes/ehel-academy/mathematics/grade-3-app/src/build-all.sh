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
# is - the same four that wire Grade 2. All four are idempotent (verified: a
# second run of the set changes no byte), so this is safe to run repeatedly.
#
# The built .html files are committed as well as generated, because they are
# what deploys and a deploy must not depend on a shell that can run bash.
set -e
cd "$(dirname "$0")"
build() { ./build.sh "$1" "$2" "../$3.html"; }
build l1 "Up to a Thousand"          up-to-a-thousand
build l2 "Rows and Rules"            rows-and-rules
build l3 "Equal Parts"               equal-parts
build l4 "Sides, Sizes and Seconds"  sides-sizes-seconds
build l5 "Ask, Count and Chart"      ask-count-chart

echo
echo "wiring to the platform:"
cd ..
for t in wire-navigation wire-platform-controls wire-progress preload-platform; do
  python "../lesson-app-tools/$t.py" > /dev/null || { echo "  FAILED: $t"; exit 1; }
  echo "  ok  $t"
done
python ../lesson-app-tools/check-lessons.py | tail -3
