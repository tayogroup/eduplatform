#!/usr/bin/env bash
# Rebuild all five Grade 3 lessons from the fragments into the directory above.
#
# The built .html files are committed AND generated. That is deliberate: they
# are what deploys, and a deploy must never depend on a shell being able to run
# bash. Change a fragment, run this, commit both - the same rule the runtime
# bundle keeps elsewhere in this repo.
set -e
cd "$(dirname "$0")"
build() { ./build.sh "$1" "$2" "../$3.html"; }
build l1 "Up to a Thousand"          up-to-a-thousand
build l2 "Rows and Rules"            rows-and-rules
build l3 "Equal Parts"               equal-parts
build l4 "Sides, Sizes and Seconds"  sides-sizes-seconds
build l5 "Ask, Count and Chart"      ask-count-chart
