# -*- coding: utf-8 -*-
"""The curriculum gate on the BUILT Grade 1 Science pages.

build-lessons.py refuses an objective code the framework does not publish and
reports what its run reached. This asks the pages that actually ship the same
question, plus what only the shipped bytes can answer:

  - every one of the 35 Cambridge Primary Science 0097 Stage 1 objectives is
    named by at least one step of at least one lesson (data-objectives)
  - no page names a code the framework does not publish for Stage 1
  - the objective counts per lesson may not fall below the recorded floor -
    a builder that quietly drops a step keeps every other check green
  - every quiz key in the shipped LESSON data has exactly one correct option,
    no repeated option, and an explanation
  - every experiment's prediction and what-happened have exactly one key

Exit 0 clean, 1 on a finding, 2 when it could not run (no framework, fewer
pages than app.config.json names) - a gate that cannot read its target and
passes is green about nothing.

    python check-coverage.py
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-science-0097.json")

# per-lesson objective counts at the time of writing; may rise, may not fall
FLOORS = {1: 10, 2: 10, 3: 8, 4: 12, 5: 11, 6: 12, 7: 9, 8: 12}
LESSON_RE = re.compile(r"\n  const LESSON = (\{.*?\n  \});\n", re.S)


def main():
    if not os.path.isfile(FRAMEWORK):
        print("  cannot run: %s is missing" % FRAMEWORK); sys.exit(2)
    fw = json.load(io.open(FRAMEWORK, encoding="utf-8"))
    codes = {o["code"]: o for o in fw["objectivesByStage"]["1"]}
    cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
    bad = []

    def fail(where, msg):
        bad.append(where + ": " + msg)
        print("  FAIL %-32s %s" % (where, msg))

    reached = {c: [] for c in codes}
    pages = 0
    for n, entry in enumerate(cfg["lessons"], 1):
        path = os.path.join(HERE, entry["file"])
        if not os.path.isfile(path):
            print("  cannot run: %s is not built" % entry["file"]); sys.exit(2)
        s = io.open(path, encoding="utf-8").read()
        pages += 1
        slides = re.findall(r'<section class="slide" data-objectives="([^"]*)"', s)
        if not slides:
            fail(entry["file"], "no slide carries data-objectives"); continue
        mine = set()
        for k, attr_ in enumerate(slides, 1):
            for c in attr_.split():
                if c not in codes:
                    fail(entry["file"], "step %d names %s, not a Stage 1 code" % (k, c))
                else:
                    reached[c].append("L%d.%d" % (n, k)); mine.add(c)
        floor = FLOORS.get(n, 0)
        if len(mine) < floor:
            fail(entry["file"], "reaches %d objectives, below its floor of %d" % (len(mine), floor))
        m = LESSON_RE.search(s)
        if not m:
            fail(entry["file"], "no LESSON data block"); continue
        try:
            data = json.loads(m.group(1))
        except ValueError as e:
            fail(entry["file"], "LESSON block is not JSON: %s" % e); continue
        for k, st in enumerate(data["steps"], 1):
            d = st["data"]
            if st["kind"] in ("quiz", "questions"):
                for it in d["items"]:
                    ts = [o["t"] for o in it["opts"]]
                    if sum(1 for o in it["opts"] if o.get("ok")) != 1:
                        fail(entry["file"], "step %d %r has %d correct options" % (k, it["ask"], sum(1 for o in it["opts"] if o.get("ok"))))
                    if len(set(ts)) != len(ts):
                        fail(entry["file"], "step %d %r repeats an option" % (k, it["ask"]))
                    if not it.get("why"):
                        fail(entry["file"], "step %d %r has no explanation" % (k, it["ask"]))
            if st["kind"] == "experiment":
                for part in ("predict", "happened"):
                    if sum(1 for o in d[part]["opts"] if o.get("ok")) != 1:
                        fail(entry["file"], "step %d experiment %s has no single key" % (k, part))
            if st["kind"] == "sort":
                bins = {b["id"] for b in d["bins"]}
                for it in d["items"]:
                    if it["bin"] not in bins:
                        fail(entry["file"], "step %d sorts %r into a bin that is not there" % (k, it["label"]))
        if not bad or not bad[-1].startswith(entry["file"] + ":"):
            print("  ok   %-32s %2d objectives" % (entry["file"], len(mine)))

    if pages < len(cfg["lessons"]):
        print("  cannot run: %d of %d pages" % (pages, len(cfg["lessons"]))); sys.exit(2)

    print("\n  Cambridge Primary Science 0097 - Stage 1\n")
    for c, o in codes.items():
        where = reached[c]
        print("  %-5s %-9s %2d  %s" % ("ok" if where else "MISS", c, len(where), o["text"][:70]))
        if not where:
            fail("stage 1", "%s (%s) is reached by no step" % (c, o["text"][:60]))

    print()
    if bad:
        print("  %d finding(s)\n" % len(bad)); sys.exit(1)
    print("  all %d Stage 1 objectives are reached, every key is single, every sort bin exists\n" % len(codes))
    sys.exit(0)


main()
