# -*- coding: utf-8 -*-
"""The curriculum gate on a grade's BUILT Global Perspectives pages.

build-lessons.py refuses an objective code the framework does not publish and
reports what its run reached. This asks the pages that actually ship the same
question, plus what only the shipped bytes can answer:

  - every Cambridge Primary Global Perspectives 0838 objective of the app's
    stage is named by at least one step of at least one lesson
    (data-objectives)
  - no page names a code the framework does not publish for that stage
  - the objective counts per lesson may not fall below the recorded floor -
    a builder that quietly drops a step keeps every other check green
  - every quiz key in the shipped LESSON data has exactly one correct option,
    no repeated option, and an explanation; every sort and organiser bin
    exists
  - and the subject's own relationships are RE-COMPUTED rather than trusted,
    from _rules.py, the same module the builder used: every pictogram key
    agrees with the shipped rows, and a pictogram drawn from a survey agrees
    with the answers the classmates give; every relevant answer, follow-up
    question and thing-known is the ONE option whose tag matches the topic;
    every source round has exactly one source about its topic; every issue
    has an action that fixes it and one that does not; every share round has
    exactly one option that lets both children finish; every question round
    is a question its ending allows; every look-back's "not learned" lines
    are not among the lesson's own about lines. A page whose survey was
    edited after its pictogram questions were keyed fails here, not in a
    child's hands.

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
from _rules import supporting  # noqa: E402
from _rules import (survey_counts, observe_counts, pictogram_answer, relevant, relevant_sources,  # noqa: E402
                    solutions, share_outcome, question_fits, allocations)

REPO = os.path.abspath(os.path.join(KIT, "..", "..", "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-global-perspectives-0838.json")
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
    LOOKBACK_CODES = {"%dFv.01" % stage, "%dFl.01" % stage}
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
        last_survey = None
        last_observe = None
        for k, st in enumerate(data["steps"], 1):
            d = st["data"]
            kind = st["kind"]
            if kind in ("quiz", "questions"):
                for it in d["items"]:
                    if not one_key(it["opts"]):
                        fail(entry["file"], "step %d %r does not have exactly one key (or repeats an option)" % (k, it["ask"]))
                    if not it.get("why"):
                        fail(entry["file"], "step %d %r has no explanation" % (k, it["ask"]))
            elif kind in ("sort", "organiser"):
                bins = {b["id"] for b in d["bins"]}
                for it in d["items"]:
                    if it["bin"] not in bins:
                        fail(entry["file"], "step %d sorts %r into a bin that is not there" % (k, it["label"]))
            elif kind == "survey":
                last_survey = d
                ids = {x["id"] for x in d["options"]}
                for p in d["people"]:
                    if p["answer"] not in ids:
                        fail(entry["file"], "step %d: %s answers %r, not an option" % (k, p["name"], p["answer"]))
            elif kind == "observe":
                last_observe = d
                if not all(any(it["kind"] == r["kind"] for it in d["scene"]) for r in d["rounds"]):
                    fail(entry["file"], "step %d counts a kind the scene does not hold" % k)
                if not all((r.get("one") or "").strip() for r in d["rounds"]):
                    fail(entry["file"], "step %d has a round with no singular ('one'), so its correction cannot be spoken properly" % k)
                computed += 1
            elif kind == "strengths":
                if not d.get("fallback") or len(d.get("limits") or []) < 2:
                    fail(entry["file"], "step %d has no record of the child's own actions, or too few limits" % k)
                if d.get("then") and not one_key(d["then"]["opts"]):
                    fail(entry["file"], "step %d's question does not have exactly one key" % k)
            elif kind == "pictogram":
                rows = d.get("rows") or []
                if d.get("fromObserve"):
                    if last_observe is None:
                        fail(entry["file"], "step %d reads an observation that is not there" % k)
                    elif rows != observe_counts(last_observe["scene"], last_observe["rounds"]):
                        fail(entry["file"], "step %d: the chart does not match what was observed" % k)
                    computed += 1
                if d.get("fromSurvey"):
                    if last_survey is None:
                        fail(entry["file"], "step %d reads a survey that is not there" % k)
                    elif rows != survey_counts(last_survey["people"], last_survey["options"]):
                        fail(entry["file"], "step %d: the pictogram does not match the survey's answers" % k)
                    computed += 1
                for it in d["items"]:
                    want = pictogram_answer(rows, it["check"])
                    keyed = next((o["t"] for o in it["opts"] if o.get("ok")), None)
                    if want is None or keyed != want or not one_key(it["opts"]):
                        fail(entry["file"], "step %d %r is keyed %r but the pictogram says %r" % (k, it["ask"], keyed, want))
                    computed += 1
            elif kind == "askq":
                for rd in d["rounds"]:
                    if not question_fits(d["ends"], rd["end"], rd["word"]):
                        fail(entry["file"], "step %d round %r is not a question its ending allows" % (k, rd["want"]))
                    computed += 1
            elif kind == "source":
                ids = {sp["id"] for sp in d["spots"]}
                if d.get("then"):
                    keyed = [o for o in d["then"]["opts"] if o.get("spot")]
                    if len(keyed) != 1 or keyed[0]["spot"] not in ids:
                        fail(entry["file"], "step %d's question does not name exactly one spot in the picture" % k)
                for rd in d.get("rounds") or []:
                    if rd.get("spot") not in ids:
                        fail(entry["file"], "step %d locate round %r points at a spot that is not in the picture" % (k, rd.get("ask")))
                if not d.get("then") and not d.get("rounds"):
                    fail(entry["file"], "step %d asks nothing of its picture" % k)
                computed += 1
            elif kind == "text":
                for rd in d["rounds"]:
                    if not isinstance(rd.get("line"), int) or not 0 <= rd["line"] < len(d["lines"]):
                        fail(entry["file"], "step %d %r points at a line that is not in the text" % (k, rd.get("ask")))
                if d.get("then") and not one_key(d["then"]["opts"]):
                    fail(entry["file"], "step %d's closing question does not have exactly one key" % k)
                computed += 1
            elif kind == "know":
                on = relevant(d["cards"], d["tag"])
                if len(on) < 2 or len(on) == len(d["cards"]) or d.get("need", 2) > len(on):
                    fail(entry["file"], "step %d: the cards about %r do not make a fair round" % (k, d["tag"]))
                if d.get("mode") == "structured":
                    for sl in d.get("slots") or []:
                        if not any(c.get("about") == d["tag"] and c.get("part") == sl["id"] for c in d["cards"]):
                            fail(entry["file"], "step %d: no card for the %r slot of the talk" % (k, sl["id"]))
                    for pid in {sl["id"] for sl in d.get("slots") or []}:
                        n_slots = sum(1 for sl in d["slots"] if sl["id"] == pid)
                        n_cards = sum(1 for c in d["cards"] if c.get("about") == d["tag"] and c.get("part") == pid)
                        if n_cards != n_slots:
                            fail(entry["file"], "step %d: %d %r slot(s) but %d card(s) for them" % (k, n_slots, pid, n_cards))
                computed += 1
            elif kind == "answer":
                for rd in d["rounds"]:
                    if len(relevant(rd["opts"], rd["about"])) != 1:
                        fail(entry["file"], "step %d %r: not exactly one answer is about %r" % (k, rd["ask"], rd["about"]))
                    computed += 1
            elif kind == "listen":
                for rd in d["rounds"]:
                    if len(relevant(rd["opts"], rd["topics"])) != 1:
                        fail(entry["file"], "step %d talk by %s: not exactly one question is about what was said" % (k, rd["speaker"]["name"]))
                    computed += 1
            elif kind == "consequence":
                for rd in d["rounds"]:
                    if not one_key(rd["predict"]["opts"]) or (rd.get("cause") and not one_key(rd["cause"]["opts"])):
                        fail(entry["file"], "step %d %r has no single prediction (or cause) key" % (k, rd["situation"]))
            elif kind == "solve":
                for rd in d["rounds"]:
                    fixes = solutions(rd["actions"], rd["needs"])
                    if not fixes or len(fixes) == len(rd["actions"]):
                        fail(entry["file"], "step %d issue %r: fixes %r are not a fair round" % (k, rd["issue"]["title"], fixes))
                    computed += 1
            elif kind == "sources":
                for rd in d["rounds"]:
                    rel = relevant_sources(rd["sources"], rd["tag"])
                    fair = (2 <= len(rel) < len(rd["sources"])) if rd.get("multi") else (len(rel) == 1)
                    if not fair or not one_key(rd["reasons"]):
                        fail(entry["file"], "step %d topic %r: the relevant sources do not make a fair round, or the reason key is not single" % (k, rd["topic"]))
                    computed += 1
            elif kind == "opinion":
                for rd in d["rounds"]:
                    rel = relevant(rd["reasons"], rd["tag"])
                    if len(rel) < max(2, int(d.get("reasonsNeeded") or 1)) or len(rel) == len(rd["reasons"]):
                        fail(entry["file"], "step %d topic %r: the reasons do not make a fair round" % (k, rd["topic"]))
                    per = max(1, int(d.get("reasonsNeeded") or 1))
                    short = [s["t"] for s in rd["stances"] if len(supporting(rd["reasons"], rd["tag"], s["id"])) < per]
                    unsaid = [rd["reasons"][i]["t"] for i in rel if not rd["reasons"][i].get("supports")]
                    if unsaid:
                        fail(entry["file"], "step %d topic %r: a reason about the topic does not say which opinions it supports: %r" % (k, rd["topic"], unsaid[0]))
                    elif short:
                        fail(entry["file"], "step %d topic %r: %r has fewer than %d reasons that support it" % (k, rd["topic"], short[0], per))
                    computed += 1
            elif kind == "team":
                fids = {f["id"] for f in d["friends"]}
                for rd in d["rounds"]:
                    if rd["who"] not in fids:
                        fail(entry["file"], "step %d has a round about %r, not a friend" % (k, rd["who"]))
                    if rd["kind"] == "share":
                        outs = [share_outcome(rd["you"], o["give"], rd["need"]) for o in rd["opts"]]
                        if outs.count("both") != 1:
                            fail(entry["file"], "step %d share round: not exactly one option lets both finish (%r)" % (k, outs))
                        computed += 1
                    elif rd["kind"] in ("work", "idea"):
                        if sum(1 for o in rd["opts"] if o.get("good")) != 1:
                            fail(entry["file"], "step %d %s round %r has no single good option" % (k, rd["kind"], rd["situation"]))
                    elif rd["kind"] == "task":
                        ids = [st["id"] for st in rd.get("steps") or []]
                        if len(ids) < 2 or len(set(ids)) != len(ids):
                            fail(entry["file"], "step %d task round has no job of 2+ distinct steps" % k)
                    elif rd["kind"] == "allocate":
                        if any(len(w) != 1 for w in allocations(rd["tasks"], rd["members"]).values()):
                            fail(entry["file"], "step %d allocate round: a task does not fit exactly one member" % k)
                        computed += 1
            elif kind == "contrib":
                fb = d["fallback"]
                fids = {f["id"] for f in d["friends"]}
                if not any(x["who"] == "you" for x in fb) or not any(x["who"] != "you" for x in fb) or any(x["who"] != "you" and x["who"] not in fids for x in fb):
                    fail(entry["file"], "step %d's recorded actions are not yours and a friend's" % k)
            elif kind == "lookback":
                texts = {(x["t"] if isinstance(x, dict) else x) for x in d["learned"]}
                if any(x in texts for x in d["not"]) or not d["learned"] or set(st["objectives"]) != LOOKBACK_CODES:
                    fail(entry["file"], "step %d's look-back mixes learned and not-learned, or carries the wrong codes" % k)
                if d.get("mode") == "changed" and len(d.get("changed") or []) < 2:
                    fail(entry["file"], "step %d's look-back asks how ideas changed and offers fewer than 2 pairs" % k)
                computed += 1
            for spec in (d.get("then"),) if kind in ("explore", "context") else ():
                if spec and not one_key(spec["opts"]):
                    fail(entry["file"], "step %d's question does not have exactly one key" % k)
        if not bad or not bad[-1].startswith(entry["file"] + ":"):
            print("  ok   %-32s %2d objectives" % (entry["file"], len(mine)))

    if pages < len(cfg["lessons"]):
        print("  cannot run: %d of %d pages" % (pages, len(cfg["lessons"]))); sys.exit(2)

    print("\n  Cambridge Primary Global Perspectives 0838 - Stage %d\n" % stage)
    for c, o in codes.items():
        where = reached[c]
        print("  %-5s %-8s %2d  %s" % ("ok" if where else "MISS", c, len(where), o["text"][:70]))
        if not where:
            fail("stage %d" % stage, "%s (%s) is reached by no step" % (c, o["text"][:60]))

    print()
    if bad:
        print("  %d finding(s)\n" % len(bad)); sys.exit(1)
    print("  all %d Stage %d objectives are reached, every key is single, every bin exists,\n"
          "  and %d relationships were re-computed from the shipped data (pictograms, relevance,\n"
          "  sources, solutions, sharing, questions, look-backs)\n" % (len(codes), stage, computed))
    sys.exit(0)


main()
