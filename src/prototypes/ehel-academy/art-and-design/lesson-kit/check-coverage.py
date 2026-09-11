# -*- coding: utf-8 -*-
"""The curriculum gate on a grade's BUILT Art & Design pages.

build-lessons.py refuses an objective code the framework does not publish and
reports what its run reached. This asks the pages that actually ship the same
question, plus what only the shipped bytes can answer:

  - every Cambridge Primary Art & Design 0067 objective of the app's stage
    is named by at least one step of at least one lesson (data-objectives)
  - no page names a code the framework does not publish for that stage
  - the objective counts per lesson may not fall below the recorded floor -
    a builder that quietly drops a step keeps every other check green
  - every quiz key in the shipped LESSON data has exactly one correct option,
    no repeated option, and an explanation; every sort bin exists
  - and the subject's own relationships are RE-COMPUTED rather than trusted,
    from _rules.py, the same module the builder used: every mix round's
    options hold the colour the two pots make, exactly once; every tone
    ladder's items are in the order the swatches' own lightness gives; every
    pattern round is a pattern of two or more tiles that repeats in full;
    every purpose has a material that fits and one that does not; every
    comparison card is in at least one picture and the deck has cards of both
    kinds; every kind-comment round has exactly one comment about something
    in the work; every piece has a change that fixes it and one that does
    not; every paint experiment's options hold the texture the additive
    makes; every mark round names a check and a tool the shipped JS has; and
    every journal has two or more things made to look back on. A page whose
    pots were edited after its rounds were written fails here, not in a
    child's hands.
  - the colour and texture tables the PAGE carries equal _rules.py's, so
    the page cannot make a colour the gate did not expect.

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
from _rules import (HEX, MIX, TINT, SHADE, TEXTURE, mix, tone_order, pattern_period,  # noqa: E402
                    fits, compare, comment_fits, refinements, paint_texture)

REPO = os.path.abspath(os.path.join(KIT, "..", "..", "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-art-and-design-0067.json")
HERE = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
LESSON_RE = re.compile(r"\n  const LESSON = (\{.*?\n  \});\n", re.S)


def js_keys(src, name, indent="  "):
    m = re.search(r"\n%sconst %s = \{\n(.*?)\n%s\};" % (indent, name, indent), src, re.S)
    return set(re.findall(r"^%s  ([A-Za-z]+): " % indent, m.group(1), re.M)) if m else set()


def js_table(src, name):
    m = re.search(r"\n  const %s = \{(.*?)\};" % name, src, re.S)
    return dict(re.findall(r'"([^"]+)":\s*"([^"]+)"', m.group(1))) if m else {}


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
    JOURNAL_CODES = {"%dR.01" % stage, "%dTWA.03" % stage}
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
        # the page's own tables and vocabularies, read from the shipped bytes
        checks, tools, scenes = js_keys(s, "CHECKS"), js_keys(s, "TOOLS"), js_keys(s, "SCENES")
        if not (checks and tools and scenes):
            fail(entry["file"], "the page's CHECKS, TOOLS or SCENES could not be read"); continue
        for name, mine_t in (("HEX", HEX), ("MIX", MIX), ("TINT", TINT), ("SHADE", SHADE), ("TEXTURE", TEXTURE)):
            if js_table(s, name) != mine_t:
                fail(entry["file"], "the page's %s table disagrees with _rules.py" % name)
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
            elif kind == "tone":
                if [it["id"] for it in d["items"]] != tone_order(d["swatches"]):
                    fail(entry["file"], "step %d's ladder is not in the order the swatches' lightness gives" % k)
                computed += 1
            elif kind == "mix":
                pids = {p["id"] for p in d["pots"]}
                for rd in d["rounds"]:
                    made = mix(rd["a"], rd["b"]) if rd["a"] in pids and rd["b"] in pids else None
                    if made is None or rd["opts"].count(made) != 1 or len(set(rd["opts"])) != len(rd["opts"]):
                        fail(entry["file"], "step %d mixes %s and %s: the options do not hold what that makes (%r) exactly once" % (k, rd["a"], rd["b"], made))
                    computed += 1
            elif kind == "marks":
                for rd in d["rounds"]:
                    if rd["want"] not in checks or rd["tool"] not in tools or rd["tool"] not in d["tools"]:
                        fail(entry["file"], "step %d round %r wants a check or a tool the page cannot judge or offer" % (k, rd.get("ask")))
                    computed += 1
            elif kind == "pattern":
                tids = {t["id"] for t in d["tiles"]}
                for rd in d["rounds"]:
                    p = pattern_period(rd["seq"]) if set(rd["seq"]) <= tids else None
                    if p is None or p < 2 or rd["show"] < p or rd["show"] + rd["ask_n"] > len(rd["seq"]):
                        fail(entry["file"], "step %d round %r is not a pattern the page can continue" % (k, rd.get("ask")))
                    computed += 1
            elif kind == "choose":
                for rd in d["rounds"]:
                    ok = fits(d["materials"], rd["needs"])
                    if not ok or len(ok) == len(d["materials"]):
                        fail(entry["file"], "step %d purpose %r: the materials that fit %r do not make a fair round" % (k, rd["purpose"], rd["needs"]))
                    computed += 1
            elif kind == "experiment":
                for rd in d["rounds"]:
                    tx = paint_texture(rd["additive"])
                    if tx is None or rd["opts"].count(tx) != 1 or len(set(rd["opts"])) != len(rd["opts"]):
                        fail(entry["file"], "step %d adds %s: the options do not hold what that makes (%r) exactly once" % (k, rd["additive"], tx))
                    computed += 1
            elif kind == "compare":
                bins = [compare(d["a"]["features"], d["b"]["features"], c["about"]) for c in d["cards"]]
                if None in bins or "both" not in bins or "one" not in bins:
                    fail(entry["file"], "step %d's cards do not make a fair comparison (%r)" % (k, bins))
                for w in (d["a"], d["b"]):
                    if w.get("scene") and w["scene"] not in scenes:
                        fail(entry["file"], "step %d names scene %r, which the page does not draw" % (k, w["scene"]))
                computed += 1
            elif kind == "comment":
                works = {w["id"]: w for w in d["works"]}
                for rd in d["rounds"]:
                    w = works.get(rd["work"])
                    hits = [o for o in rd["opts"] if w and comment_fits(o["about"], w["features"])]
                    if len(hits) != 1:
                        fail(entry["file"], "step %d round for %r: not exactly one comment is about something in the work" % (k, rd["work"]))
                    computed += 1
            elif kind == "refine":
                for rd in d["rounds"]:
                    good = refinements(rd["changes"], rd["needs"])
                    if not good or len(good) == len(rd["changes"]):
                        fail(entry["file"], "step %d piece %r: the changes that fix it do not make a fair round" % (k, rd["piece"]["title"]))
                    if rd["piece"].get("scene") and rd["piece"]["scene"] not in scenes:
                        fail(entry["file"], "step %d names scene %r, which the page does not draw" % (k, rd["piece"]["scene"]))
                    computed += 1
            elif kind == "journal":
                if len(d.get("fallback") or []) < 2 or set(st["objectives"]) != JOURNAL_CODES or len(d.get("changes") or []) < 3:
                    fail(entry["file"], "step %d's journal has fewer than 2 things made, or the wrong codes, or too few changes" % k)
                computed += 1
            elif kind == "lecture":
                for key in ("video", "captions", "poster"):
                    if d.get(key) and not os.path.isfile(os.path.join(HERE, d[key])):
                        fail(entry["file"], "step %d names %s %s, which is not beside the page" % (k, key, d[key]))
            elif kind == "source":
                ids = {sp["id"] for sp in d["spots"]}
                keyed = [o for o in (d.get("then") or {}).get("opts", []) if o.get("spot")]
                if len(keyed) != 1 or keyed[0]["spot"] not in ids or d["scene"] not in scenes:
                    fail(entry["file"], "step %d's question does not name exactly one spot in a picture the page draws" % k)
                computed += 1
            for spec in (d.get("then"),) if kind in ("explore", "context") else ():
                if spec and not one_key(spec["opts"]):
                    fail(entry["file"], "step %d's question does not have exactly one key" % k)
        if not bad or not bad[-1].startswith(entry["file"] + ":"):
            print("  ok   %-32s %2d objectives" % (entry["file"], len(mine)))

    if pages < len(cfg["lessons"]):
        print("  cannot run: %d of %d pages" % (pages, len(cfg["lessons"]))); sys.exit(2)

    print("\n  Cambridge Primary Art & Design 0067 - Stage %d\n" % stage)
    for c, o in codes.items():
        where = reached[c]
        print("  %-5s %-8s %2d  %s" % ("ok" if where else "MISS", c, len(where), o["text"][:70]))
        if not where:
            fail("stage %d" % stage, "%s (%s) is reached by no step" % (c, o["text"][:60]))

    print()
    if bad:
        print("  %d finding(s)\n" % len(bad)); sys.exit(1)
    print("  all %d Stage %d objectives are reached, every key is single, every bin exists,\n"
          "  and %d relationships were re-computed from the shipped data (mixes, tone ladders,\n"
          "  patterns, materials, comparisons, comments, refinements, experiments, marks, journals)\n" % (len(codes), stage, computed))
    sys.exit(0)


main()
