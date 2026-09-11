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

And the five fixes of the 2026-09-11 validation, each held here so a later
edit cannot quietly undo one:
  - the keyboard route: check-marks.mjs draws every mark a round can ask for
    through the SHIPPED page's own judge, and no rival shape may pass it
  - a good place to stop: exactly one journal per page carries the stop card
  - the make-at-home sheet: every home step knows its lesson's title and number
  - where the art comes from: every tradition note belongs to a scene the
    pages draw, and every lesson that draws one has its note in the built hub
  - the starting check: the page carries the placement file as it is on
    disk, every key is one of its options, every remediation lesson exists
    under its own title, the band rule gives the right band at the edges,
    and the hub links the page and deploy.mjs will upload it

Exit 0 clean, 1 on a finding, 2 when it could not run (no framework, fewer
pages than app.config.json names) - a gate that cannot read its target and
passes is green about nothing.

    python ../lesson-kit/check-coverage.py --app .
"""
import ast
import io
import json
import os
import re
import subprocess
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
    drawn = {}
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
        pauses = 0
        drawn[n] = set()
        for k, st in enumerate(data["steps"], 1):
            d = st["data"]
            kind = st["kind"]
            drawn[n] |= scenes_in(d)
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
                pauses += 1 if d.get("pause") else 0
                computed += 1
            elif kind == "home":
                if d.get("lesson") != data["title"] or d.get("lessonNo") != n:
                    fail(entry["file"], "step %d's make-at-home sheet does not know its lesson (%r, %r)" % (k, d.get("lesson"), d.get("lessonNo")))
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
        if pauses != 1:
            fail(entry["file"], "%d journals carry the stop card; a lesson needs exactly one" % pauses)
        if not bad or not bad[-1].startswith(entry["file"] + ":"):
            print("  ok   %-32s %2d objectives" % (entry["file"], len(mine)))

    if pages < len(cfg["lessons"]):
        print("  cannot run: %d of %d pages" % (pages, len(cfg["lessons"]))); sys.exit(2)

    # ---- the keyboard route, on the shipped bytes ----
    print()
    r = subprocess.run(["node", os.path.join(KIT, "check-marks.mjs")] + [os.path.join(HERE, e["file"]) for e in cfg["lessons"]],
                       capture_output=True, text=True)
    print(r.stdout.rstrip())
    if r.returncode == 2 or not r.stdout.strip():
        print("  cannot run: check-marks.mjs could not read the pages\n" + r.stderr); sys.exit(2)
    if r.returncode:
        fail("keyboard route", "a mark the keyboard route draws is judged wrong, or a rival passes - see above")

    # ---- where the art comes from ----
    trad = traditions()
    hub_path = os.path.join(HERE, cfg["hub"])
    hub = io.open(hub_path, encoding="utf-8").read() if os.path.isfile(hub_path) else ""
    sample = js_keys(io.open(os.path.join(HERE, cfg["lessons"][0]["file"]), encoding="utf-8").read(), "SCENES")
    for sc in trad:
        if sc not in sample:
            fail("traditions", "build-hub.py has a note for scene %r, which the pages do not draw" % sc)
    blocks = re.findall(r'<details class="gu"><summary>Lesson (\d+):(.*?)</details>', hub, re.S)
    by_lesson = {int(a): b for a, b in blocks}
    noted = 0
    for n, sc_set in drawn.items():
        for sc in sorted(sc_set & set(trad)):
            if trad[sc][:60] not in by_lesson.get(n, "").replace("&#x27;", "'").replace("&#39;", "'"):
                fail(cfg["hub"], "Lesson %d draws %r but its grown-up notes do not say where that art comes from (rebuild the hub?)" % (n, sc))
            else:
                noted += 1
    print("  ok   traditions: %d notes, %d placed in the hub where a lesson draws that art" % (len(trad), noted))

    # ---- the starting check ----
    sc = cfg.get("startingCheck")
    if sc:
        check_starting(cfg, sc, hub, fail)

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


def scenes_in(o, out=None):
    out = set() if out is None else out
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "scene" and isinstance(v, str):
                out.add(v)
            else:
                scenes_in(v, out)
    elif isinstance(o, list):
        for v in o:
            scenes_in(v, out)
    return out


def traditions():
    """build-hub.py's TRADITIONS, read as a literal - importing the builder would run it."""
    tree = ast.parse(io.open(os.path.join(KIT, "build-hub.py"), encoding="utf-8").read())
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", "") == "TRADITIONS" for t in node.targets):
            return ast.literal_eval(node.value)
    print("  cannot run: no TRADITIONS in build-hub.py"); sys.exit(2)


def band(exam, percent, sections):
    """shell/placement.js :: band, line for line (the page carries the same)."""
    b = exam.get("banding") or {}
    ready, review, crit = b.get("ready") or {}, b.get("readyWithReview") or {}, b.get("criticalSection")
    c = next((x for x in sections if crit and x["id"] == crit["sectionId"]), None)
    if percent < review.get("minOverallPercent", 50) or (c and c["percent"] <= crit.get("maxFailPercent", 40)):
        return "notReady"
    if percent >= ready.get("minOverallPercent", 80) and all(x["percent"] >= ready.get("minSectionPercent", 60) for x in sections):
        return "ready"
    return "readyWithReview"


def check_starting(cfg, sc, hub, fail):
    where = sc["file"]
    page_path = os.path.join(HERE, sc["file"])
    data_path = os.path.normpath(os.path.join(HERE, sc["data"]))
    if not os.path.isfile(page_path) or not os.path.isfile(data_path):
        fail(where, "the starting check's page or its placement file is missing"); return
    exam = json.load(io.open(data_path, encoding="utf-8"))
    m = LESSON_RE.search(io.open(page_path, encoding="utf-8").read())
    if not m:
        fail(where, "no LESSON data block"); return
    shipped = json.loads(m.group(1))["steps"][0]["data"]
    if shipped["exam"] != exam:
        fail(where, "the page's questions are not the placement file's - rebuild it with build-check.py")
    if sc["file"] not in (cfg.get("extraPages") or []):
        fail(where, "not in extraPages, so deploy.mjs would never upload it")
    if 'href="%s?from=%s"' % (sc["file"], cfg["fromParam"]) not in hub:
        fail(cfg["hub"], "does not link the starting check")
    split = lambda t: [x.strip() for x in str(t or "").split("|") if x.strip()]   # noqa: E731
    def titles_of(grade):
        if int(grade) == int(cfg["grade"]):
            return {i: l["title"] for i, l in enumerate(cfg["lessons"], 1)}
        oc = os.path.join(os.path.dirname(HERE), "grade-%d-app" % int(grade), "app.config.json")
        return {i: l["title"] for i, l in enumerate(json.load(io.open(oc, encoding="utf-8"))["lessons"], 1)} if os.path.isfile(oc) else {}
    for q in exam["questions"]:
        opts = split(q["options"])
        if q["correctAnswer"] not in opts or len(set(opts)) != len(opts):
            fail(where, "%s: the key is not exactly one of its options" % q["questionId"])
        if q.get("optionPics") and len(split(q["optionPics"])) != len(opts):
            fail(where, "%s: a picture for every option, or none" % q["questionId"])
    for s_ in exam["sections"]:
        for r in s_.get("remediation") or []:
            if titles_of(r.get("grade", cfg["grade"])).get(r["unit"]) != r["title"]:
                fail(where, "%s sends the child to Lesson %s %r, which this grade does not have" % (s_["sectionId"], r["unit"], r["title"]))
    # the band rule at its edges, computed from the questions rather than trusted
    secs = [x["sectionId"] for x in exam["sections"]]

    def outcome(right_ids):
        per = []
        got = tot = 0
        for sid in secs:
            mine = [q for q in exam["questions"] if q["sectionId"] == sid]
            g = sum(q.get("marks", 1) for q in mine if q["questionId"] in right_ids)
            t = sum(q.get("marks", 1) for q in mine)
            per.append({"id": sid, "percent": round(g / t * 100) if t else 0}); got += g; tot += t
        return band(exam, round(got / tot * 100) if tot else 0, per)
    everything = {q["questionId"] for q in exam["questions"]}
    crit = (exam["banding"].get("criticalSection") or {}).get("sectionId")
    cases = [("all right", everything, "ready"), ("none right", set(), "notReady")]
    if crit:
        cases.append(("all right but the critical section", {q["questionId"] for q in exam["questions"] if q["sectionId"] != crit}, "notReady"))
    for name, ids, want in cases:
        got = outcome(ids)
        if got != want:
            fail(where, "%s gives %s, not %s" % (name, got, want))
    print("  ok   %-32s %d questions, keys single, %d remediation links, bands right at the edges" % (
        where, len(exam["questions"]), sum(len(s_.get("remediation") or []) for s_ in exam["sections"])))


main()
