# -*- coding: utf-8 -*-
"""The curriculum gate on a grade's BUILT Computing pages.

build-lessons.py refuses an objective code the framework does not publish and
reports what its run reached. This asks the pages that actually ship the same
question, plus what only the shipped bytes can answer:

  - every Cambridge Primary Computing 0059 objective of the app's stage is
    named by at least one step of at least one lesson (data-objectives)
  - no page names a code the framework does not publish for that stage
  - the objective counts per lesson may not fall below the recorded floor -
    a builder that quietly drops a step keeps every other check green
  - every quiz key in the shipped LESSON data has exactly one correct option,
    no repeated option, and an explanation
  - every sort bin exists; every bug and every fix is single
  - and two things are RE-COMPUTED rather than trusted, from _rules.py, the
    same module the builder used: every one of Robo's authored solutions
    still reaches its target on the shipped grid, and every data-table key
    still agrees with the shipped rows. A page whose table was edited after
    its questions were keyed fails here, not in a child's hands.

Exit 0 clean, 1 on a finding, 2 when it could not run (no framework, fewer
pages than app.config.json names) - a gate that cannot read its target and
passes is green about nothing.

    python ../lesson-kit/check-coverage.py --app .
"""
import io
import json
import os
import re
import sys

KIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, KIT)
from _rules import run_robot, table_answer  # noqa: E402

REPO = os.path.abspath(os.path.join(KIT, "..", "..", "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-computing-0059.json")
HERE = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
LESSON_RE = re.compile(r"\n  const LESSON = (\{.*?\n  \});\n", re.S)


def main():
    if not os.path.isfile(FRAMEWORK):
        print("  cannot run: %s is missing" % FRAMEWORK); sys.exit(2)
    if not os.path.isfile(os.path.join(HERE, "app.config.json")):
        print("  cannot run: no app.config.json in %s" % HERE); sys.exit(2)
    cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
    stage = int(cfg["stage"])
    fw = json.load(io.open(FRAMEWORK, encoding="utf-8"))
    codes = {o["code"]: o for o in fw["objectivesByStage"].get(str(stage), [])}
    if not codes:
        print("  cannot run: the framework publishes no Stage %d" % stage); sys.exit(2)
    # per-lesson objective counts recorded in the config; may rise, may not fall.
    # A floor set at what you had before the last thing you added is a formality,
    # so record it AT the measured value and move it up when a lesson grows.
    FLOORS = {int(k): int(v) for k, v in (cfg.get("objectiveFloors") or {}).items()}
    if len(FLOORS) != len(cfg["lessons"]):
        print("  cannot run: objectiveFloors in app.config.json must name every lesson (%d of %d)" % (len(FLOORS), len(cfg["lessons"]))); sys.exit(2)
    bad = []
    computed = 0

    def fail(where, msg):
        bad.append(where + ": " + msg)
        print("  FAIL %-32s %s" % (where, msg))

    def one_key(opts):
        return sum(1 for o in opts if o.get("ok")) == 1 and len({o["t"] for o in opts}) == len(opts)

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
                    fail(entry["file"], "step %d names %s, not a Stage %d code" % (k, c, stage))
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
            kind = st["kind"]
            if kind in ("quiz", "questions"):
                for it in d["items"]:
                    if not one_key(it["opts"]):
                        fail(entry["file"], "step %d %r does not have exactly one key (or repeats an option)" % (k, it["ask"]))
                    if not it.get("why"):
                        fail(entry["file"], "step %d %r has no explanation" % (k, it["ask"]))
            elif kind == "sort":
                bins = {b["id"] for b in d["bins"]}
                for it in d["items"]:
                    if it["bin"] not in bins:
                        fail(entry["file"], "step %d sorts %r into a bin that is not there" % (k, it["label"]))
            elif kind == "bugs":
                for rd in d["rounds"]:
                    swap_ok = rd.get("swap") and rd["wrong"] + 1 < len(rd["steps"]) and not rd.get("fix")
                    fix_ok = (not rd.get("swap")) and rd.get("fix") and one_key(rd["fix"]["opts"])
                    if not 0 <= rd["wrong"] < len(rd["steps"]) or not (swap_ok or fix_ok):
                        fail(entry["file"], "step %d bug round %r has no single bug and fix" % (k, rd["goal"]))
            elif kind == "debug":
                for rd in d["rounds"]:
                    ok = [o for o in rd["fix"]["opts"] if o.get("ok")]
                    fixed = list(rd["program"])
                    if len(ok) == 1 and 0 <= rd["bug"] < len(fixed):
                        fixed[rd["bug"]] = ok[0]["id"]
                    if len(ok) != 1 or fixed != rd["expect"]:
                        fail(entry["file"], "step %d debug round %r: the fix does not make the expected program" % (k, rd["goal"]))
                    computed += 1
            elif kind == "robot":
                for lv in d["levels"]:
                    if lv.get("predict"):
                        end = run_robot(lv, lv["program"], d["rows"], d["cols"])
                        if end != list(lv["answer"]):
                            fail(entry["file"], "step %d level %r: the program stops at %r, not %r" % (k, lv["title"], end, lv["answer"]))
                    else:
                        end = run_robot(lv, lv["solution"], d["rows"], d["cols"])
                        if end != list(lv["target"]):
                            fail(entry["file"], "step %d level %r: the solution stops at %r, not on the target %r" % (k, lv["title"], end, lv["target"]))
                    computed += 1
            elif kind == "table":
                for it in d["items"]:
                    want = table_answer(d["rows"], it["check"])
                    keyed = next((o["t"] for o in it["opts"] if o.get("ok")), None)
                    if want is None or keyed != want or not one_key(it["opts"]):
                        fail(entry["file"], "step %d %r is keyed %r but the table says %r" % (k, it["ask"], keyed, want))
                    computed += 1
            elif kind == "form":
                ids = {x["id"] for x in d["options"]}
                for p in d["people"]:
                    if p["answer"] not in ids:
                        fail(entry["file"], "step %d: %s answers %r, not an option" % (k, p["name"], p["answer"]))
            elif kind == "ask":
                ids = {w["id"] for w in d["ways"]}
                for qn in d["questions"]:
                    if qn["answer"] not in ids:
                        fail(entry["file"], "step %d %r is answered by %r, not a way" % (k, qn["ask"], qn["answer"]))
            for spec in (d.get("then"),) if kind in ("explore", "context", "sorter", "apps") else ():
                if spec and not one_key(spec["opts"]):
                    fail(entry["file"], "step %d's question does not have exactly one key" % k)
        if not bad or not bad[-1].startswith(entry["file"] + ":"):
            print("  ok   %-32s %2d objectives" % (entry["file"], len(mine)))

    if pages < len(cfg["lessons"]):
        print("  cannot run: %d of %d pages" % (pages, len(cfg["lessons"]))); sys.exit(2)

    print("\n  Cambridge Primary Computing 0059 - Stage %d\n" % stage)
    for c, o in codes.items():
        where = reached[c]
        print("  %-5s %-8s %2d  %s" % ("ok" if where else "MISS", c, len(where), o["text"][:70]))
        if not where:
            fail("stage %d" % stage, "%s (%s) is reached by no step" % (c, o["text"][:60]))

    print()
    if bad:
        print("  %d finding(s)\n" % len(bad)); sys.exit(1)
    print("  all %d Stage %d objectives are reached, every key is single, every sort bin exists,\n"
          "  and %d keys were re-computed from the shipped data (Robo's routes, table answers, fixes)\n" % (len(codes), stage, computed))
    sys.exit(0)


main()
