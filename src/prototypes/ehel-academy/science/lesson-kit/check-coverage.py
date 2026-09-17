# -*- coding: utf-8 -*-
"""The curriculum gate on a grade's BUILT Science pages.

build-lessons.py refuses an objective code the framework does not publish and
reports what its run reached. This asks the pages that actually ship the same
question, plus what only the shipped bytes can answer:

  - every Cambridge Primary Science 0097 objective of the app's stage is
    named by at least one step of at least one lesson (data-objectives)
  - no page names a code the framework does not publish for that stage
  - the objective counts per lesson may not fall below the recorded floor -
    a builder that quietly drops a step keeps every other check green
  - every quiz key in the shipped LESSON data has exactly one correct option,
    no repeated option, and an explanation
  - every experiment's prediction and what-happened have exactly one key
  - every misconception Cambridge names for the stage is answered by at least
    one step, no step cites an id the fixture does not hold or one the fixture
    assigns to another lesson, and the number answered may not fall below the
    recorded floor (../data/cambridge-stage<N>-misconceptions.json)
  - no two questions in one lesson share a stem, and no `extension` item
    restates a core question. _shell.py already refuses a warm-up or a game
    round that reuses a quiz stem; nothing checked the other directions, and
    the 2026-09-16 read of all 239 Grade 1 keys found ten pairs it would have
    caught - including two experiments in one lesson asking the identical
    "So what did we find out?", which reading the content did NOT catch.
    `support` is exempt by design: Cambridge's Focus tier re-asks the same
    idea more simply, so a support item SHOULD resemble the core item.

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
SUBJECT = os.path.abspath(os.path.join(KIT, ".."))
REPO = os.path.abspath(os.path.join(KIT, "..", "..", "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-science-0097.json")
HERE = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
LESSON_RE = re.compile(r"\n  const LESSON = (\{.*?\n  \});\n", re.S)


def main():
    if not os.path.isfile(FRAMEWORK):
        print("  cannot run: %s is missing" % FRAMEWORK); sys.exit(2)
    if not os.path.isfile(os.path.join(HERE, "app.config.json")):
        print("  cannot run: no app.config.json in %s" % HERE); sys.exit(2)
    cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
    stage = int(cfg["stage"])
    # The Cambridge misconceptions for this stage, if anyone has extracted them.
    # A stage with no fixture is checked exactly as it always was, so adding
    # Stage 2-4 fixtures later needs no change here. But a page that CITES an id
    # while the fixture is missing is a finding, not a pass - see the per-step
    # arm below; that is the difference between "not checked" and "agreed".
    MIS_PATH = os.path.join(SUBJECT, "data", "cambridge-stage%d-misconceptions.json" % stage)
    MIS_DOC = json.load(io.open(MIS_PATH, encoding="utf-8")) if os.path.isfile(MIS_PATH) else {}
    MIS = {m["id"]: m for m in MIS_DOC.get("misconceptions", [])} if MIS_DOC else None
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
    # Per-lesson warm-up counts, for the spiral - see the check further down.
    RETRIEVAL = {int(k): int(v) for k, v in (cfg.get("retrievalFloors") or {}).items()}
    if len(RETRIEVAL) != len(cfg["lessons"]):
        print("  cannot run: retrievalFloors in app.config.json must name every lesson (%d of %d)"
              % (len(RETRIEVAL), len(cfg["lessons"]))); sys.exit(2)
    bad = []

    def fail(where, msg):
        bad.append(where + ": " + msg)
        print("  FAIL %-32s %s" % (where, msg))

    reached = {c: [] for c in codes}
    claimed = {m: [] for m in (MIS or {})}
    asked = {}
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
        # THE SPIRAL, counted. The overview step's warm-up is where a topic
        # returns: every lesson's first warm-up question retrieves the lesson
        # before it, and from lesson 4 there are further ones at lags of three
        # and six, so an early topic comes back three times. All of it is
        # ordinary authored content with nothing in the data marking it as
        # retrieval, so the only thing a gate can hold is the COUNT - which is
        # enough to catch the failure that matters, an edit or a rebuild quietly
        # dropping them. Recorded at the measured value, may rise, may not fall.
        warm = 0
        for st in data["steps"]:
            if st["kind"] == "overview":
                warm = len((st.get("data") or {}).get("warmup") or [])
        rfloor = RETRIEVAL.get(n)
        if rfloor is None:
            fail(entry["file"], "retrievalFloors in app.config.json names no lesson %d" % n)
        elif warm < rfloor:
            fail(entry["file"], "carries %d warm-up question(s), below its floor of %d - the "
                                "spiral's retrieval has been lost" % (warm, rfloor))
        for k, st in enumerate(data["steps"], 1):
            d0 = st.get("data") or {}

            def note(item, where):
                """remember (where, stem, key) for the repeated-question check"""
                if item and item.get("opts"):
                    asked.setdefault(n, []).append(
                        (where, item.get("ask", ""),
                         " ".join(o["t"] for o in item["opts"] if o.get("ok"))))
            if st["kind"] in ("questions", "quiz"):
                for it in d0.get("items") or ():
                    note(it, st["kind"])
            for tier in ("support", "extension"):
                for it in d0.get(tier) or ():
                    note(it, tier)
            if st["kind"] == "experiment":
                for ph in ("predict", "plan", "happened", "conclude"):
                    note(d0.get(ph), "exp." + ph)
            if st["kind"] in ("record", "graph"):
                for it in d0.get("read") or ():
                    note(it, "read-off")
            if st["kind"] == "measure":
                note(d0.get("compare"), "measure")
            if st["kind"] in ("explore", "context"):
                note(d0.get("then"), st["kind"])
            if st["kind"] == "ask":
                note(d0.get("findOut"), "ask")
            for mid in st.get("mis") or ():
                if MIS is None:
                    fail(entry["file"], "step %d cites misconception %r and there is no fixture" % (k, mid))
                elif mid not in MIS:
                    fail(entry["file"], "step %d cites misconception %r, which the fixture does not hold" % (k, mid))
                else:
                    if int(MIS[mid]["lesson"]) != n:
                        fail(entry["file"], "step %d cites %r, which the fixture assigns to lesson %d"
                                            % (k, mid, int(MIS[mid]["lesson"])))
                    claimed[mid].append("L%d.%d" % (n, k))
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
                # plan and conclude are optional phases; when present they are
                # choices like any other and need a single key
                for part in ("predict", "plan", "happened", "conclude"):
                    if not d.get(part):
                        continue
                    if sum(1 for o in d[part]["opts"] if o.get("ok")) != 1:
                        fail(entry["file"], "step %d experiment %s has no single key" % (k, part))
                    if part != "predict" and not d[part].get("why"):
                        fail(entry["file"], "step %d experiment %s has no explanation" % (k, part))
            if st["kind"] == "sort":
                bins = {b["id"] for b in d["bins"]}
                for it in d["items"]:
                    if it["bin"] not in bins:
                        fail(entry["file"], "step %d sorts %r into a bin that is not there" % (k, it["label"]))
        if not bad or not bad[-1].startswith(entry["file"] + ":"):
            print("  ok   %-32s %2d objectives" % (entry["file"], len(mine)))

    # ---- repeated questions inside one lesson ---------------------------
    # Strict only where similarity IS the defect: an identical stem, or an
    # extension item that restates a core question instead of widening it.
    # Anything else is left alone - a shared one-word key ("roots", "ears") is
    # normal, and only a person can say whether two stems are the same
    # question.
    STOP = set(("a an the is are was were do does did you your it its this that those of to in on"
                " with and or but if then what which who how why when where not no yes for from at"
                " as be will would can could should than there their they them he she his her i my"
                " me we us").split())

    def bag(t):
        t = re.sub(r"<[^>]+>", " ", str(t)).lower()
        t = re.sub(r"[^a-z0-9 ]", " ", t)
        return {w for w in t.split() if w not in STOP and len(w) > 2}

    def jac(a, b):
        return (len(a & b) / float(len(a | b))) if (a and b) else 0.0

    for n, qs in sorted(asked.items()):
        for a in range(len(qs)):
            for b in range(a + 1, len(qs)):
                x, y = qs[a], qs[b]
                if "support" in (x[0], y[0]):
                    continue
                if bag(x[1]) and bag(x[1]) == bag(y[1]) and x[1].strip().lower() == y[1].strip().lower():
                    fail("lesson %d" % n, "two questions share a stem (%s, %s): %r"
                                          % (x[0], y[0], x[1][:56]))
                elif "extension" in (x[0], y[0]) and max(jac(bag(x[1]), bag(y[1])),
                                                         jac(bag(x[2]), bag(y[2]))) >= 0.6:
                    fail("lesson %d" % n, "the extension item restates a core question (%s vs %s): %r"
                                          % (x[0], y[0], x[1][:52]))

    if pages < len(cfg["lessons"]):
        print("  cannot run: %d of %d pages" % (pages, len(cfg["lessons"]))); sys.exit(2)

    print("\n  Cambridge Primary Science 0097 - Stage %d\n" % stage)
    for c, o in codes.items():
        where = reached[c]
        print("  %-5s %-9s %2d  %s" % ("ok" if where else "MISS", c, len(where), o["text"][:70]))
        if not where:
            fail("stage 1", "%s (%s) is reached by no step" % (c, o["text"][:60]))

    covered = 0
    if MIS is not None:
        print("\n  Cambridge Stage %d misconceptions - %s\n" % (stage, os.path.basename(MIS_PATH)))
        for mid in sorted(MIS, key=lambda i: (MIS[i]["topic"], i)):
            where = claimed[mid]
            covered += 1 if where else 0
            print("  %-5s %-8s %-4s %2d  %s"
                  % ("ok" if where else "MISS", mid, "L%s" % MIS[mid]["lesson"], len(where),
                     MIS[mid]["misconception"][:62]))
            if not where:
                fail("misconceptions", "%s (%s) is answered by no step"
                                       % (mid, MIS[mid]["misconception"][:52]))
        # A floor, for the same reason objectiveFloors has one: a parser that
        # stops recognising one lesson's citations takes a whole lesson out of
        # the comparison while every other check still prints a tick. Coverage
        # is a number that only goes up.
        floor = int(MIS_DOC.get("minimumCovered") or 0)
        print("\n  %d of %d answered (recorded floor %d)" % (covered, len(MIS), floor))
        if covered < floor:
            fail("misconceptions", "%d answered, below the recorded floor of %d - raise it only by fixing content"
                                   % (covered, floor))

    print()
    if bad:
        print("  %d finding(s)\n" % len(bad)); sys.exit(1)
    print("  all %d Stage %d objectives are reached, every key is single, every sort bin exists%s\n"
          % (len(codes), stage,
             ", all %d Cambridge misconceptions answered" % len(MIS) if MIS is not None else ""))
    sys.exit(0)


main()
