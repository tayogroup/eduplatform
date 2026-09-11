# -*- coding: utf-8 -*-
"""Build a grade's Computing standalone lesson pages.

WHAT THIS IS. The Computing standalone lesson generator, one kit for every
grade: a course in the design of the Grade 1 Mathematics, English and Science
standalone builds (mathematics/grade-1-app/g1v2, english/grade-1-app,
science/grade-1-app), one self-contained HTML page per lesson, carrying its
own CSS, its own activity JS and its own copy of the voice engine, bypassing
shell/course-app.js entirely. It is the Science kit's build-lessons.py with
the subject's vocabulary swapped: the same page skeleton (the shared pipeline
anchors on it), a different set of step kinds, a different set of checks.

ONE KIT, ONE DIRECTORY PER GRADE. computing/grade-N-app holds app.config.json
(grade, stage, floors, hub text) and content/lesson-N.py; everything that
draws a page lives here.

WHAT THE CONTENT IS. Cambridge Primary Computing 0059, the stage named in the
app's config - every learning objective of it, authored against the framework
file src/curriculum/cambridge-computing-0059.json (extracted from the
published PDF by tools/extract-cambridge-computing-framework.py). It is NOT
the course under computing/grade-N/data: that course is built from the
school's Word packs and declares a different framework code. Nothing under
computing/grade-N/ is read or written here.

Every step names the objectives it exercises, and the builder refuses a code
the framework does not publish for the stage. check-coverage.py then asks the
BUILT pages whether every objective is reached, so a lesson that loses a step
fails the gate rather than the syllabus.

    python ../lesson-kit/build-lessons.py --app .       # from a grade directory
    python ../lesson-kit/build-lessons.py --app . 3     # just lesson 3

Then the shared pipeline, in this order (each step assumes the last):

    T=../../mathematics/lesson-app-tools
    python $T/wire-navigation.py        --app .
    python $T/wire-platform-controls.py --app .
    python $T/preload-platform.py       --app .
    python $T/wire-progress.py          --app .
    python $T/add-header-bars.py        --app .
    python $T/check-lessons.py          --app .
    python ../lesson-kit/check-coverage.py --app .

This tool writes the page from scratch every time, so it must run BEFORE any
of them; running it again over a wired page throws the wiring away.
"""
import importlib.util
import io
import json
import os
import re
import sys

from _shell import META_KINDS, expand, finder_words

KIT = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(KIT, "..", ".."))
REPO = os.path.abspath(os.path.join(ACADEMY, "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-computing-0059.json")
LIB = os.path.join(KIT, "lib")


def app_dir(argv):
    """--app <dir>, else the cwd; refuses a directory with no app.config.json."""
    d = argv[argv.index("--app") + 1] if "--app" in argv else os.getcwd()
    d = os.path.abspath(d)
    if not os.path.isfile(os.path.join(d, "app.config.json")):
        sys.exit("REFUSED: no app.config.json in %s. Run from a grade directory or pass --app <dir>." % d)
    return d


APP = app_dir(sys.argv[1:])
CONTENT = os.path.join(APP, "content")
CFG = json.load(io.open(os.path.join(APP, "app.config.json"), encoding="utf-8"))
STAGE = int(CFG["stage"])
GRADE_LABEL = CFG["gradeLabel"]

# kind -> the renderer in lib/computing.js that draws it
KINDS = {
    "explore": "tapCards", "context": "tapCards",
    "sort": "sortBins",
    "order": "order",
    "demo": "demo",
    # computational thinking
    "follow": "followSteps", "bugs": "bugHunt", "remix": "remix", "robot": "robotGrid",
    # programming
    "program": "blockProgram", "debug": "debugProgram",
    # managing data
    "form": "dataForm", "table": "dataTable", "sorter": "sortMachine", "ask": "askDevice",
    # networks and computer systems
    "network": "networkBuild", "offline": "offlineTest", "io": "inputOutput", "apps": "appScreen",
    # Stage 2
    "precise": "preciseDraw", "chart": "blockGraph", "survey": "surveyDesign", "label": "labelParts", "race": "race",
    # Stage 3
    "trim": "trimSteps", "loopspot": "loopSpot", "whatif": "whatIf", "inout": "inOut", "tidy": "tidyProgram",
    "parallel": "parallelProgram", "tweak": "tweakProgram", "device": "deviceProgram",
    "views": "dataViews", "sheet": "spreadsheet", "filter": "dataFilter", "cipher": "cipher",
    # Stage 4
    "loopalgo": "loopAlgo", "compare": "compareAlgos", "subroutine": "subRoutine", "branch": "branchAlgo", "loopbuild": "loopBuild",
    "comment": "commentBlocks", "inputprog": "inputProgram", "plan": "planObjects", "parttest": "partTest",
    "datasort": "dataSort", "tableparts": "tableParts",
    "questions": "sequence", "quiz": "sequence",
    # the unit shell, drawn around every lesson by _shell.py
    "overview": "unitOverview", "lecture": "lecture", "words": "computingWords",
    "games": "gameZone", "home": "homeProjects", "world": "computingWorld", "resources": "resources",
}

# Robo's rules, the table arithmetic, the repeat block and the race sums live
# in _rules.py, shared with the gate, so the builder and check-coverage.py
# cannot disagree about any of them.
from _rules import (DIRS, REPEATS, best_algo, branch_run, caesar_shift, code_word, decode_code, expand_loop,  # noqa: E402
                    expand_program, filter_rows, flatten_algo, pigpen_index, repeat_run, rule_output, run_robot,
                    same_effect, sheet_cells, sort_rows, sub_expand, sum_answer, table_answer, walk_end)

FORMATS = ("text", "number", "date", "currency")   # mirrored in FORMATS in lib/computing.js


def read(name):
    return io.open(os.path.join(LIB, name), encoding="utf-8").read()


def load_json(path):
    return json.load(io.open(path, encoding="utf-8"))


def stage_codes():
    if not os.path.isfile(FRAMEWORK):
        sys.exit("REFUSED: %s is missing. Extract it first:\n"
                 "  python tools/extract-cambridge-computing-framework.py --pdf <0059.pdf> "
                 "--output src/curriculum/cambridge-computing-0059.json" % FRAMEWORK)
    fw = load_json(FRAMEWORK)
    stage = fw["objectivesByStage"].get(str(STAGE))
    if not stage:
        sys.exit("REFUSED: the framework publishes no Stage %d" % STAGE)
    return {o["code"]: o["text"] for o in stage}


def js_keys(src, name, indent="  "):
    """The keys of `const NAME = { key: ..., ... };` in lib/computing.js.

    Read out of the real bytes rather than kept as a list here, so a scene,
    a block or an app renamed in the JS fails the lesson that names it at
    build time.
    """
    m = re.search(r"\n%sconst %s = \{\n(.*?)\n%s\};" % (indent, name, indent), src, re.S)
    if not m:
        sys.exit("REFUSED: cannot find `const %s = {` in lib/computing.js" % name)
    return set(re.findall(r"^%s  ([A-Za-z0-9]+): " % indent, m.group(1), re.M))


def js_block(src, name, indent="  "):
    """The text of `const NAME = { ... };`, for looking inside its entries."""
    m = re.search(r"\n%sconst %s = \{\n(.*?)\n%s\};" % (indent, name, indent), src, re.S)
    return m.group(1) if m else ""


def js_entry(block, key):
    """The text of one entry of a js_block, up to the next top-level key."""
    m = re.search(r"^    %s: (.*?)(?=^    [A-Za-z0-9]+: |\Z)" % re.escape(key), block, re.M | re.S)
    return m.group(1) if m else ""


def load_lessons(wanted):
    cfg = CFG
    out = []
    for n, entry in enumerate(cfg["lessons"], 1):
        if wanted and n not in wanted:
            continue
        path = os.path.join(CONTENT, "lesson-%d.py" % n)
        if not os.path.isfile(path):
            sys.exit("REFUSED: app.config.json names lesson %d (%s) but content/lesson-%d.py does not exist"
                     % (n, entry["title"], n))
        spec = importlib.util.spec_from_file_location("lesson_%d" % n, path)
        mod = importlib.util.module_from_spec(spec)
        if KIT not in sys.path:
            sys.path.insert(0, KIT)   # `from _kit import ...`
        spec.loader.exec_module(mod)
        lesson = mod.LESSON
        if lesson["title"] != entry["title"]:
            sys.exit("REFUSED: lesson %d is titled %r in app.config.json and %r in content/lesson-%d.py"
                     % (n, entry["title"], lesson["title"], n))
        out.append((n, entry["file"], lesson))
    return out


# ----------------------------------------------------------------------
# checks on the content, before a page is written
# ----------------------------------------------------------------------
def one_ok(opts, where):
    ts = [o["t"] for o in opts]
    if len(opts) < 2:
        sys.exit("REFUSED: %s has fewer than 2 options" % where)
    if len(set(ts)) != len(ts):
        sys.exit("REFUSED: %s repeats an option: %r" % (where, ts))
    if sum(1 for o in opts if o.get("ok")) != 1:
        sys.exit("REFUSED: %s must have exactly one correct option (has %d)"
                 % (where, sum(1 for o in opts if o.get("ok"))))


def check_step(n, k, s, codes, libs):
    scenes, blocks, apps, sounds = libs["scenes"], libs["blocks"], libs["apps"], libs["sounds"]
    where = "lesson %d step %d (%s)" % (n, k + 1, s["title"])
    if s["kind"] not in KINDS:
        sys.exit("REFUSED: %s has unknown kind %r" % (where, s["kind"]))
    if not s["objectives"] and s["kind"] not in META_KINDS:
        sys.exit("REFUSED: %s names no objective" % where)
    for c in s["objectives"]:
        if c not in codes:
            sys.exit("REFUSED: %s names %s, which 0059 does not publish for Stage %d" % (where, c, STAGE))
    d = s["data"]
    kind = s["kind"]

    def scene_ok(name):
        if name not in scenes:
            sys.exit("REFUSED: %s names scene %r; lib/computing.js draws %s" % (where, name, sorted(scenes)))

    def blocks_ok(ids, what):
        for b in ids:
            if b not in blocks:
                sys.exit("REFUSED: %s %s uses block %r; lib/computing.js has %s" % (where, what, b, sorted(blocks)))

    if kind in ("explore", "context"):
        if not d.get("items"):
            sys.exit("REFUSED: %s has no items" % where)
        for it in d["items"]:
            if it.get("sound") and it["sound"] not in sounds:
                sys.exit("REFUSED: %s names sound %r, which SOUND does not synthesise" % (where, it["sound"]))
        if d.get("then"):
            one_ok(d["then"]["opts"], where + " question")
            if not d["then"].get("why"):
                sys.exit("REFUSED: %s question has no why" % where)
    elif kind == "sort":
        ids = {b["id"] for b in d["bins"]}
        if len(ids) < 2:
            sys.exit("REFUSED: %s has fewer than 2 bins" % where)
        for it in d["items"]:
            if it["bin"] not in ids:
                sys.exit("REFUSED: %s item %r goes to bin %r, which does not exist" % (where, it["label"], it["bin"]))
            if not it.get("why"):
                sys.exit("REFUSED: %s item %r has no why" % (where, it["label"]))
    elif kind == "order":
        if len(d["items"]) < 3:
            sys.exit("REFUSED: %s orders fewer than 3 things" % where)
        if d.get("scene"):
            scene_ok(d["scene"])
            if any("id" not in it for it in d["items"]):
                sys.exit("REFUSED: %s draws a scene, so every item needs an id" % where)
        labels = [it["label"] for it in d["items"]] + [x["label"] for x in d.get("extras") or []]
        if len(set(labels)) != len(labels):
            sys.exit("REFUSED: %s repeats a step label between the needed steps and the extras" % where)
        for x in d.get("extras") or []:
            if not x.get("why"):
                sys.exit("REFUSED: %s extra %r needs a why (it is not needed because...)" % (where, x["label"]))
    elif kind == "demo":
        if len(d["frames"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 frames" % where)
        for f in d["frames"]:
            if f.get("scene"):
                scene_ok(f["scene"]["id"])
            if f.get("sound") and f["sound"] not in sounds:
                sys.exit("REFUSED: %s names sound %r" % (where, f["sound"]))
    elif kind == "follow":
        scene_ok(d["scene"])
        if len(d["steps"]) < 3:
            sys.exit("REFUSED: %s follows fewer than 3 steps" % where)
        ids = [st["id"] for st in d["steps"]]
        if len(set(ids)) != len(ids):
            sys.exit("REFUSED: %s repeats a step id" % where)
    elif kind == "bugs":
        scene_ok(d["scene"])
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 algorithms to debug" % where)
        for rd in d["rounds"]:
            if not 0 <= rd["wrong"] < len(rd["steps"]):
                sys.exit("REFUSED: %s round %r marks step %d wrong, of %d" % (where, rd["goal"], rd["wrong"], len(rd["steps"])))
            if not rd.get("why"):
                sys.exit("REFUSED: %s round %r needs a why for the bug" % (where, rd["goal"]))
            if rd.get("swap"):
                # a step one place too early: the page moves it down one, so
                # there must be a step after it and no fix to choose
                if rd.get("fix") or rd["wrong"] + 1 >= len(rd["steps"]):
                    sys.exit("REFUSED: %s round %r is a swap: no fix options, and the step must have one after it" % (where, rd["goal"]))
            else:
                one_ok(rd["fix"]["opts"], where + " fix for %r" % rd["goal"])
                if not rd["fix"].get("why"):
                    sys.exit("REFUSED: %s round %r needs a why for the fix" % (where, rd["goal"]))
                if any("id" not in o for o in rd["fix"]["opts"]):
                    sys.exit("REFUSED: %s round %r fix options need ids (use choice())" % (where, rd["goal"]))
    elif kind == "remix":
        scene_ok(d["scene"])
        ids = {st["id"] for st in d["steps"]}
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s changes the algorithm fewer than 2 times" % where)
        for rd in d["rounds"]:
            if rd.get("kind", "change") == "change":
                if rd["change"] not in ids:
                    sys.exit("REFUSED: %s round %r changes step %r, which the algorithm does not have" % (where, rd["target"], rd["change"]))
                ok = next(o for o in rd["opts"] if o.get("ok"))
                ids = (ids - {rd["change"]}) | {ok["id"]}
            else:
                ok = next(o for o in rd["opts"] if o.get("ok"))
                ids = ids | {ok["id"]}
            one_ok(rd["opts"], where + " %r" % rd["target"])
            if not rd.get("why") or not rd.get("result"):
                sys.exit("REFUSED: %s round %r needs a why and a result" % (where, rd["target"]))
    elif kind == "robot":
        rows, cols = int(d["rows"]), int(d["cols"])
        if len(d["levels"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 levels" % where)
        for lv in d["levels"]:
            for c, r in [lv["start"], lv["target"]] + list(lv.get("walls", [])):
                if not (0 <= c < cols and 0 <= r < rows):
                    sys.exit("REFUSED: %s level %r puts something at %r, off a %dx%d grid" % (where, lv["title"], [c, r], cols, rows))
            if lv["facing"] not in DIRS:
                sys.exit("REFUSED: %s level %r faces %r" % (where, lv["title"], lv["facing"]))
            if lv.get("loop") and not lv.get("predict"):
                sys.exit("REFUSED: %s level %r: a loop is only for a predict level" % (where, lv["title"]))
            if lv.get("predict"):
                prog = expand_loop(lv.get("before"), lv["loop"]["body"], lv["loop"]["times"], lv.get("after")) if lv.get("loop") else lv["program"]
                if lv.get("loop") and (not lv["loop"]["body"] or not 2 <= int(lv["loop"]["times"]) <= 5):
                    sys.exit("REFUSED: %s level %r: a loop needs a body and 2-5 times" % (where, lv["title"]))
                end = run_robot(lv, prog, rows, cols)
                if end is None:
                    sys.exit("REFUSED: %s level %r: the program to predict bumps into something" % (where, lv["title"]))
                if end != list(lv["answer"]):
                    sys.exit("REFUSED: %s level %r: the program stops at %r, not the authored answer %r" % (where, lv["title"], end, lv["answer"]))
            else:
                end = run_robot(lv, lv["solution"], rows, cols)
                if end != list(lv["target"]):
                    sys.exit("REFUSED: %s level %r: the authored solution stops at %r, not on the target %r" % (where, lv["title"], end, lv["target"]))
    elif kind == "program":
        blocks_ok(d.get("blocks") or [], "palette")
        nsprites = len(d.get("sprites") or [d.get("sprite") or "cat"])
        if d.get("sprites") and len(d.get("spriteNames") or []) != nsprites:
            sys.exit("REFUSED: %s names %d sprites but %d spriteNames" % (where, nsprites, len(d.get("spriteNames") or [])))
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 programs" % where)
        for rd in d["rounds"]:
            if not 0 <= int(rd.get("object", 0)) < nsprites:
                sys.exit("REFUSED: %s round is for object %r, of %d" % (where, rd.get("object"), nsprites))
            if rd.get("given"):
                blocks_ok(rd["given"], "given program")
                one_ok(rd["predict"]["opts"], where + " prediction")
                if not rd["predict"].get("why"):
                    sys.exit("REFUSED: %s prediction has no why" % where)
                if not expand_program(rd["given"]):
                    sys.exit("REFUSED: %s: the given program does nothing when run" % where)
            else:
                blocks_ok(rd["expect"], "expected program")
                if not expand_program(rd["expect"]):
                    sys.exit("REFUSED: %s round %r: the expected program does nothing when run" % (where, rd["algorithm"]))
                if rd.get("mustRepeat") and not any(b in REPEATS for b in rd["expect"]):
                    sys.exit("REFUSED: %s round %r asks for a repeat block but its expected program has none" % (where, rd["algorithm"]))
                if not any(b in REPEATS for b in rd["expect"]) and len(rd["algorithm"]) != len(rd["expect"]):
                    sys.exit("REFUSED: %s round %r: %d words but %d blocks" % (where, rd["algorithm"], len(rd["algorithm"]), len(rd["expect"])))
                for b in rd["expect"]:
                    if b not in (d.get("blocks") or blocks):
                        sys.exit("REFUSED: %s expects block %r, which is not in the palette" % (where, b))
    elif kind == "debug":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 programs to debug" % where)
        for rd in d["rounds"]:
            blocks_ok(rd["program"], "buggy program"); blocks_ok(rd["expect"], "expected program")
            if len(rd["program"]) != len(rd["expect"]):
                sys.exit("REFUSED: %s round %r: the fix must keep the program the same length" % (where, rd["goal"]))
            bugs = sorted(rd.get("bugs") or [rd["bug"]])
            diffs = [k2 for k2 in range(len(rd["program"])) if rd["program"][k2] != rd["expect"][k2]]
            if diffs != bugs:
                sys.exit("REFUSED: %s round %r: the program differs from the expected one at %r, but the bugs are marked at %r" % (where, rd["goal"], diffs, bugs))
            for bug in bugs:
                fix = (rd.get("fixes") or {}).get(str(bug)) or (rd.get("fixes") or {}).get(bug) or rd.get("fix")
                if not fix:
                    sys.exit("REFUSED: %s round %r has no fix for the bug at %d" % (where, rd["goal"], bug))
                one_ok(fix["opts"], where + " fix for %r at %d" % (rd["goal"], bug))
                ok = next(o for o in fix["opts"] if o["ok"])
                if ok["id"] != rd["expect"][bug]:
                    sys.exit("REFUSED: %s round %r: the fix %r at %d does not make the expected program" % (where, rd["goal"], ok["id"], bug))
                blocks_ok([o["id"] for o in fix["opts"]], "fix options")
                if not fix.get("why"):
                    sys.exit("REFUSED: %s round %r: the fix at %d needs a why" % (where, rd["goal"], bug))
                if not ((rd.get("whys") or {}).get(str(bug)) or rd.get("why")):
                    sys.exit("REFUSED: %s round %r needs a why for the bug at %d" % (where, rd["goal"], bug))
            if rd.get("partner") and not (rd["partner"].get("name") and rd["partner"].get("pic") and rd["partner"].get("hint")):
                sys.exit("REFUSED: %s round %r: a partner needs a name, a pic and a hint" % (where, rd["goal"]))
    elif kind == "precise":
        if d["drawing"] not in libs["drawings"]:
            sys.exit("REFUSED: %s draws %r; lib/computing.js has %s" % (where, d["drawing"], sorted(libs["drawings"])))
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s gives fewer than 2 instructions" % where)
        drawn = libs["drawing_ids"].get(d["drawing"], set())
        for rd in d["rounds"]:
            one_ok(rd["opts"], where + " %r" % plain(rd["ask"]))
            if not rd.get("why"):
                sys.exit("REFUSED: %s %r has no why" % (where, plain(rd["ask"])))
            for o in rd["opts"]:
                if o.get("id") not in drawn:
                    sys.exit("REFUSED: %s option %r has id %r, which DRAWINGS.%s does not draw (it would draw nothing)" % (where, o["t"], o.get("id"), d["drawing"]))
    elif kind == "chart":
        if len(d["columns"]) < 2:
            sys.exit("REFUSED: %s graphs fewer than 2 columns" % where)
        for c in d["columns"]:
            if not isinstance(c["value"], int) or not 1 <= c["value"] <= 10:
                sys.exit("REFUSED: %s column %r has value %r; keep it a whole number 1-10" % (where, c["label"], c["value"]))
        one_ok(d["pattern"]["opts"], where + " pattern")
        if not d["pattern"].get("why"):
            sys.exit("REFUSED: %s pattern has no why" % where)
        if d["pattern"].get("check"):
            want = table_answer(d["columns"], d["pattern"]["check"])
            keyed = next(o["t"] for o in d["pattern"]["opts"] if o["ok"])
            if want is None or keyed != want:
                sys.exit("REFUSED: %s pattern is keyed %r but the columns say %r" % (where, keyed, want))
    elif kind == "survey":
        ids = {x["id"] for x in d["options"]}
        if len(d["ways"]) < 3 or len(d["people"]) < 4 or len(ids) < 2:
            sys.exit("REFUSED: %s needs 3+ ways, 4+ people and 2+ options" % where)
        for w in d["ways"]:
            if not isinstance(w.get("works"), bool) or not w.get("outcome") or not w.get("why"):
                sys.exit("REFUSED: %s way %r needs a boolean `works`, an outcome and a why" % (where, w.get("label")))
        if not any(w["works"] for w in d["ways"]) or all(w["works"] for w in d["ways"]):
            sys.exit("REFUSED: %s: the ways must include some that work and some that do not" % where)
        for p in d["people"]:
            if p["answer"] not in ids:
                sys.exit("REFUSED: %s: %s answers %r, not an option" % (where, p["name"], p["answer"]))
        one_ok(d["then"]["opts"], where + " question")
        if not d["then"].get("why") or not d.get("purpose") or not d.get("question"):
            sys.exit("REFUSED: %s needs a purpose, a question and a why for the final question" % where)
    elif kind == "label":
        if d["figure"] not in libs["figures"]:
            sys.exit("REFUSED: %s names figure %r; lib/computing.js draws %s" % (where, d["figure"], sorted(libs["figures"])))
        if not d["parts"] or "%s" not in d["ask"]:
            sys.exit("REFUSED: %s needs parts and an ask with %%s" % where)
        drawn = libs["figure_parts"].get(d["figure"], set())
        for p in d["parts"]:
            if p["id"] not in drawn:
                sys.exit("REFUSED: %s part %r is not a data-part of FIGURES.%s (%s)" % (where, p["id"], d["figure"], sorted(drawn)))
            if not p.get("label") or not p.get("say"):
                sys.exit("REFUSED: %s part %r needs a label and a say" % (where, p["id"]))
    elif kind == "race":
        if len(d["rounds"]) < 3:
            sys.exit("REFUSED: %s races fewer than 3 sums" % where)
        for rd in d["rounds"]:
            want = sum_answer(rd["ask"])
            if want is None:
                sys.exit("REFUSED: %s %r is not a sum this kit can compute (a + b or a - b)" % (where, rd["ask"]))
            if str(rd["answer"]) != want:
                sys.exit("REFUSED: %s %r is keyed %r but the sum is %s" % (where, rd["ask"], rd["answer"], want))
            opts = [str(t) for t in rd["opts"]]
            if want not in opts or len(set(opts)) != len(opts) or len(opts) < 2:
                sys.exit("REFUSED: %s %r: the options must include the answer once and repeat nothing" % (where, rd["ask"]))
        one_ok(d["then"]["opts"], where + " question")
        if not d["then"].get("why"):
            sys.exit("REFUSED: %s question has no why" % where)
    elif kind == "form":
        ids = {x["id"] for x in d["options"]}
        if len(d["people"]) < 3 or len(ids) < 2:
            sys.exit("REFUSED: %s needs 3+ people and 2+ options" % where)
        for p in d["people"]:
            if p["answer"] not in ids:
                sys.exit("REFUSED: %s: %s answers %r, not an option" % (where, p["name"], p["answer"]))
    elif kind == "table":
        if len(d["rows"]) < 2 or len(d["items"]) < 2:
            sys.exit("REFUSED: %s needs 2+ rows and 2+ questions" % where)
        for it in d["items"]:
            one_ok(it["opts"], where + " %r" % it["ask"])
            if not it.get("why"):
                sys.exit("REFUSED: %s %r has no why" % (where, it["ask"]))
            want = table_answer(d["rows"], it["check"])
            keyed = next(o["t"] for o in it["opts"] if o["ok"])
            if want is None:
                sys.exit("REFUSED: %s %r: the table cannot answer it (check %r)" % (where, it["ask"], it["check"]))
            if keyed != want:
                sys.exit("REFUSED: %s %r is keyed %r but the table says %r" % (where, it["ask"], keyed, want))
    elif kind == "sorter":
        if len(d["ways"]) < 2 or len(d["items"]) < 6:
            sys.exit("REFUSED: %s needs 2+ ways and 6+ things" % where)
        for w in d["ways"]:
            for it in d["items"]:
                if it.get(w["id"]) not in w["groups"]:
                    sys.exit("REFUSED: %s: %r sorted %s is %r, not one of %s" % (where, it["label"], w["label"], it.get(w["id"]), w["groups"]))
        if d.get("then"):
            one_ok(d["then"]["opts"], where + " question")
    elif kind == "ask":
        ids = {w["id"] for w in d["ways"]}
        if len(d["questions"]) < 3 or len(ids) < 3:
            sys.exit("REFUSED: %s needs 3+ questions and 3+ ways" % where)
        for qn in d["questions"]:
            if qn["answer"] not in ids:
                sys.exit("REFUSED: %s %r is answered by %r, not a way" % (where, qn["ask"], qn["answer"]))
            if not qn.get("why") or not qn.get("result"):
                sys.exit("REFUSED: %s %r needs a why and a result" % (where, qn["ask"]))
    elif kind == "network":
        ids = {x["id"] for x in d["devices"]}
        if d["hub"] not in ids:
            sys.exit("REFUSED: %s: hub %r is not a device" % (where, d["hub"]))
        if len(ids) < 4:
            sys.exit("REFUSED: %s has fewer than 4 devices" % where)
        for x in d["devices"]:
            if x["id"] != d["hub"] and "wired" not in x:
                sys.exit("REFUSED: %s: %r does not say whether it is wired" % (where, x["label"]))
        for t in d["send"]:
            if t["from"] not in ids or t["to"] not in ids or t["from"] == t["to"]:
                sys.exit("REFUSED: %s sends between %r and %r" % (where, t["from"], t["to"]))
    elif kind == "offline":
        if len(d["apps"]) < 4:
            sys.exit("REFUSED: %s tries fewer than 4 apps" % where)
        for a in d["apps"]:
            if not isinstance(a.get("needs"), bool) or not a.get("why"):
                sys.exit("REFUSED: %s: %r needs a boolean `needs` and a why" % (where, a["label"]))
        if not any(a["needs"] for a in d["apps"]) or all(a["needs"] for a in d["apps"]):
            sys.exit("REFUSED: %s: the apps must include some that need the internet and some that do not" % where)
    elif kind == "io":
        if len(d["devices"]) < 4:
            sys.exit("REFUSED: %s has fewer than 4 devices" % where)
        kinds = {x["kind"] for x in d["devices"]}
        if kinds != {"input", "output"}:
            sys.exit("REFUSED: %s needs both inputs and outputs (has %s)" % (where, sorted(kinds)))
        for x in d["devices"]:
            if not x.get("does") or not x.get("shows"):
                sys.exit("REFUSED: %s: %r needs `does` and `shows`" % (where, x["label"]))
    elif kind == "apps":
        if len(d["apps"]) < 3:
            sys.exit("REFUSED: %s has fewer than 3 programs" % where)
        for a in d["apps"]:
            if a["screen"] not in apps:
                sys.exit("REFUSED: %s: %r opens screen %r; lib/computing.js has %s" % (where, a["label"], a["screen"], sorted(apps)))
        if d.get("then"):
            one_ok(d["then"]["opts"], where + " question")
    elif kind == "trim":
        scene_ok(d["scene"])
        if not d.get("task"):
            sys.exit("REFUSED: %s names no task" % where)
        waste = [st for st in d["steps"] if st.get("waste")]
        kept = [st for st in d["steps"] if not st.get("waste")]
        if len(waste) < 1 or len(kept) < 2:
            sys.exit("REFUSED: %s needs at least one wasteful step and two needed ones" % where)
        if [st["id"] for st in kept] != list(d["expect"]):
            sys.exit("REFUSED: %s: the steps left after trimming are %r, but expect is %r" % (where, [st["id"] for st in kept], d["expect"]))
    elif kind == "loopspot":
        ids = [st["id"] for st in d["steps"]]
        run = d["run"]
        if not d.get("task"):
            sys.exit("REFUSED: %s names no task" % where)
        if not repeat_run(ids, run["start"], run["length"], run["times"]):
            sys.exit("REFUSED: %s: steps %d-%d do not repeat %d times back to back" % (where, run["start"] + 1, run["start"] + run["length"], run["times"]))
        one_ok(d["then"]["opts"], where + " question")
        keyed = next(o["t"] for o in d["then"]["opts"] if o["ok"])
        if keyed != str(run["times"]) or not d["then"].get("why"):
            sys.exit("REFUSED: %s: the question must be keyed %r (how many times), with a why" % (where, str(run["times"])))
    elif kind == "whatif":
        scene_ok(d["scene"])
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s proposes fewer than 2 changes" % where)
        n_steps = len(d["steps"])
        for rd in d["rounds"]:
            ch = rd["change"]
            if ch["kind"] not in ("swap", "remove", "insert", "replace"):
                sys.exit("REFUSED: %s change kind %r" % (where, ch["kind"]))
            if ch["kind"] == "swap" and not (0 <= ch["a"] < n_steps and 0 <= ch["b"] < n_steps and ch["a"] != ch["b"]):
                sys.exit("REFUSED: %s swaps %r and %r of %d steps" % (where, ch.get("a"), ch.get("b"), n_steps))
            if ch["kind"] in ("remove", "replace") and not 0 <= ch["at"] < n_steps:
                sys.exit("REFUSED: %s changes step %r of %d" % (where, ch.get("at"), n_steps))
            if ch["kind"] == "insert" and not 0 <= ch["at"] <= n_steps:
                sys.exit("REFUSED: %s inserts at %r of %d" % (where, ch.get("at"), n_steps))
            if ch["kind"] in ("insert", "replace") and not (ch.get("step") and ch["step"].get("id") and ch["step"].get("label")):
                sys.exit("REFUSED: %s: an insert or replace needs a step (use s())" % where)
            one_ok(rd["opts"], where + " %r" % rd["ask"])
            if not rd.get("why"):
                sys.exit("REFUSED: %s %r has no why" % (where, rd["ask"]))
    elif kind == "inout":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 machines" % where)
        for rd in d["rounds"]:
            if not rd.get("name") or len(rd.get("steps") or []) < 3 or len(rd.get("inputs") or []) < 2:
                sys.exit("REFUSED: %s machine %r needs a name, 3+ steps and 2+ inputs" % (where, rd.get("name")))
            for x in rd["inputs"]:
                if rule_output(rd["rule"], x) is None:
                    sys.exit("REFUSED: %s machine %r: rule %r cannot take input %r" % (where, rd["name"], rd["rule"], x))
            one_ok(rd["then"]["opts"], where + " %r question" % rd["name"])
            want = rule_output(rd["rule"], rd["then"]["input"])
            keyed = next(o["t"] for o in rd["then"]["opts"] if o["ok"])
            if want is None or keyed != want or not rd["then"].get("why"):
                sys.exit("REFUSED: %s machine %r: input %r gives %r, but the question is keyed %r" % (where, rd["name"], rd["then"]["input"], want, keyed))
    elif kind == "tidy":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s tidies fewer than 2 programs" % where)
        for rd in d["rounds"]:
            blocks_ok(rd["program"], "program"); blocks_ok(rd["expect"], "tidy program")
            if not rd.get("goal"):
                sys.exit("REFUSED: %s round needs a goal" % where)
            if not same_effect(rd["program"], rd["expect"]):
                sys.exit("REFUSED: %s round %r: the tidy program does not do what the long one does" % (where, rd["goal"]))
            if len(rd["expect"]) >= len(rd["program"]) or "wait" in rd["expect"]:
                sys.exit("REFUSED: %s round %r: the tidy program must be shorter and carry no wait block" % (where, rd["goal"]))
    elif kind == "parallel":
        n = len(d["sprites"])
        if n < 2 or len(d.get("spriteNames") or []) != n:
            sys.exit("REFUSED: %s needs 2+ sprites with names" % where)
        statics = set(d.get("static") or [])
        if any(not 0 <= k < n for k in statics):
            sys.exit("REFUSED: %s: a static index is off the sprite list" % where)
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 rounds" % where)
        for rd in d["rounds"]:
            if len(rd["scripts"]) != n:
                sys.exit("REFUSED: %s round has %d scripts for %d objects" % (where, len(rd["scripts"]), n))
            for k, sc in enumerate(rd["scripts"]):
                blocks_ok(sc["expect"], "script %d" % k)
                if not sc.get("algorithm") or not expand_program(sc["expect"]):
                    sys.exit("REFUSED: %s round: object %d needs an algorithm and a program that does something" % (where, k))
                if k in statics and any(libs["block_cats"].get(b) == "move" for b in sc["expect"]):
                    sys.exit("REFUSED: %s round: object %d is static but its program moves" % (where, k))
    elif kind == "tweak":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 programs" % where)
        for rd in d["rounds"]:
            for lst in (rd["program"], rd["expect"]):
                for b in lst:
                    if b["id"] not in ("right", "left", "jump") or not 1 <= int(b["n"]) <= 4:
                        sys.exit("REFUSED: %s round %r: block %r must be right/left/jump with n 1-4" % (where, rd.get("goal"), b))
            if [b["id"] for b in rd["program"]] != [b["id"] for b in rd["expect"]]:
                sys.exit("REFUSED: %s round %r: only the numbers may change between program and expect" % (where, rd.get("goal")))
            if not -3 <= int(rd["target"]) <= 3 or not rd.get("goal"):
                sys.exit("REFUSED: %s round needs a goal and a target within -3..3" % where)
            if walk_end(rd["expect"]) != rd["target"]:
                sys.exit("REFUSED: %s round %r: the expected numbers end at %d, not the target %d" % (where, rd["goal"], walk_end(rd["expect"]), rd["target"]))
            if walk_end(rd["program"]) == rd["target"]:
                sys.exit("REFUSED: %s round %r: the given numbers already hit the target" % (where, rd["goal"]))
    elif kind == "device":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 programs" % where)
        pal = d.get("blocks") or sorted(libs["device_blocks"])
        for b in pal:
            if b not in libs["device_blocks"]:
                sys.exit("REFUSED: %s palette block %r is not in DEVICE_BLOCKS (%s)" % (where, b, sorted(libs["device_blocks"])))
        for rd in d["rounds"]:
            ex = rd["expect"]
            if not ex or ex[0] not in libs["device_hats"]:
                sys.exit("REFUSED: %s round %r must start with a when block" % (where, rd.get("algorithm")))
            if any(b in libs["device_hats"] for b in ex[1:]) or len(ex) < 2:
                sys.exit("REFUSED: %s round %r: one when block first, then outputs" % (where, rd.get("algorithm")))
            loops = libs["device_loops"]
            if ex.count("forever") > 1 or (ex[-1] in loops):
                sys.exit("REFUSED: %s round %r: one forever at most, and a loop block needs something after it" % (where, rd.get("algorithm")))
            for i2, b in enumerate(ex[1:-1], 1):
                if b in loops and b != "forever" and ex[i2 + 1] in loops:
                    sys.exit("REFUSED: %s round %r: a repeat block must be followed by an output, not another loop" % (where, rd.get("algorithm")))
            for b in ex:
                if b not in pal:
                    sys.exit("REFUSED: %s round expects %r, which is not in the palette" % (where, b))
            if len(rd["algorithm"]) != len(ex):
                sys.exit("REFUSED: %s round %r: %d words but %d blocks" % (where, rd["algorithm"], len(rd["algorithm"]), len(ex)))
    elif kind == "views":
        if len(d["columns"]) < 2 or not d.get("title"):
            sys.exit("REFUSED: %s needs a title and 2+ columns" % where)
        for c in d["columns"]:
            if not isinstance(c["value"], int) or not 1 <= c["value"] <= 10:
                sys.exit("REFUSED: %s column %r has value %r; keep it a whole number 1-10" % (where, c["label"], c["value"]))
        if len(d["questions"]) < 2:
            sys.exit("REFUSED: %s asks fewer than 2 questions" % where)
        for qn in d["questions"]:
            one_ok(qn["opts"], where + " %r" % qn["ask"])
            want = table_answer(d["columns"], qn["check"])
            keyed = next(o["t"] for o in qn["opts"] if o["ok"])
            if want is None or keyed != want or not qn.get("why"):
                sys.exit("REFUSED: %s %r is keyed %r but the data says %r" % (where, qn["ask"], keyed, want))
    elif kind == "sheet":
        cols, nrows = list(d["cols"]), int(d["rows"])
        if len(cols) < 2 or nrows < 2 or any(not (len(c) == 1 and c.isalpha() and c.isupper()) for c in cols):
            sys.exit("REFUSED: %s needs 2+ single-letter columns and 2+ rows" % where)
        names = {c + str(r) for c in cols for r in range(1, nrows + 1)}
        for name in d.get("cells") or {}:
            if name not in names:
                sys.exit("REFUSED: %s: cell %r is off the grid" % (where, name))
        if len(d["tasks"]) < 3 or {t["kind"] for t in d["tasks"]} != {"find", "enter", "format"}:
            sys.exit("REFUSED: %s needs 3+ tasks and all three kinds: find, enter, format" % where)
        for i, t in enumerate(d["tasks"]):
            state = sheet_cells(cols, nrows, d.get("cells") or {}, d["tasks"][:i])
            if not t.get("ask"):
                sys.exit("REFUSED: %s task %d has no ask" % (where, i + 1))
            if t["kind"] == "find":
                hits = [n for n, v in state.items() if str(v) == str(t["value"])]
                if len(hits) != 1:
                    sys.exit("REFUSED: %s task %d: %r is in %d cells, not exactly one" % (where, i + 1, t["value"], len(hits)))
            elif t["kind"] == "enter":
                if t["cell"] not in names or len(t.get("values") or []) < 2 or str(t["value"]) not in [str(v) for v in t["values"]]:
                    sys.exit("REFUSED: %s task %d: needs a grid cell and 2+ values including the one to enter" % (where, i + 1))
            elif t["kind"] == "format":
                if t["target"] not in names and t["target"] not in cols:
                    sys.exit("REFUSED: %s task %d: format target %r is neither a column nor a cell" % (where, i + 1, t["target"]))
                if t["format"] not in FORMATS:
                    sys.exit("REFUSED: %s task %d: format %r is not one of %s" % (where, i + 1, t["format"], FORMATS))
            else:
                sys.exit("REFUSED: %s task %d has kind %r" % (where, i + 1, t["kind"]))
    elif kind == "filter":
        if len(d["rows"]) < 4 or len(d["fields"]) < 2 or len(d["tasks"]) < 2:
            sys.exit("REFUSED: %s needs 4+ rows, 2+ fields and 2+ tasks" % where)
        fields = {f["id"]: f for f in d["fields"]}
        for rw in d["rows"]:
            if not rw.get("name") or not rw.get("pic"):
                sys.exit("REFUSED: %s: every row needs a name and a pic" % where)
            for fid, f in fields.items():
                if rw.get(fid) not in f["values"]:
                    sys.exit("REFUSED: %s: %s has %s %r, not one of %s" % (where, rw["name"], fid, rw.get(fid), f["values"]))
        for t in d["tasks"]:
            sp = t["spec"]
            if sp["field"] not in fields or sp["value"] not in fields[sp["field"]]["values"]:
                sys.exit("REFUSED: %s task %r filters %r for %r" % (where, t["ask"], sp.get("field"), sp.get("value")))
            if sp.get("op", "eq") not in ("eq", "ne", "gt", "lt") or (sp.get("op") in ("gt", "lt") and not fields[sp["field"]].get("numeric")):
                sys.exit("REFUSED: %s task %r: op %r is not allowed on %r" % (where, t["ask"], sp.get("op"), sp["field"]))
            one_ok(t["then"]["opts"], where + " %r question" % t["ask"])
            want = str(len(filter_rows(d["rows"], sp)))
            keyed = next(o["t"] for o in t["then"]["opts"] if o["ok"])
            if keyed != want or not t["then"].get("why"):
                sys.exit("REFUSED: %s task %r is keyed %r but the filter finds %s rows" % (where, t["ask"], keyed, want))
    elif kind == "cipher":
        if len(d["rounds"]) < 3 or {rd["kind"] for rd in d["rounds"]} != {"decode", "encode"}:
            sys.exit("REFUSED: %s needs 3+ messages, some to decode and some to encode" % where)
        for rd in d["rounds"]:
            mode = rd.get("mode", "number")
            if mode == "caesar":
                if not isinstance(rd.get("shift"), int) or not 1 <= rd["shift"] <= 25:
                    sys.exit("REFUSED: %s: a Caesar round needs a shift of 1-25" % where)
                if rd["kind"] == "decode":
                    if caesar_shift(rd["answer"], rd["shift"]) != rd["code"] or not rd["answer"].isalpha():
                        sys.exit("REFUSED: %s: %r with shift %d is not %r" % (where, rd["answer"], rd["shift"], rd["code"]))
                elif caesar_shift(rd["word"], rd["shift"]) != rd["answer"] or not rd["word"].isalpha():
                    sys.exit("REFUSED: %s: %r with shift %d is %r, not %r" % (where, rd["word"], rd["shift"], caesar_shift(rd["word"], rd["shift"]), rd["answer"]))
            elif mode == "pigpen":
                text_ = rd["code"] if rd["kind"] == "decode" else rd["word"]
                if not text_.isalpha() or any(pigpen_index(c) is None for c in text_.lower()) or rd["answer"] != text_:
                    sys.exit("REFUSED: %s: a Pigpen round's answer must be its own letters (%r)" % (where, text_))
            elif rd["kind"] == "decode":
                if not rd["code"] or any(not 1 <= int(n) <= 26 for n in rd["code"]) or decode_code(rd["code"]) != rd["answer"]:
                    sys.exit("REFUSED: %s: %r decodes to %r, not %r" % (where, rd["code"], decode_code(rd["code"]), rd["answer"]))
            else:
                if not rd["word"].isalpha() or code_word(rd["word"]) != list(rd["answer"]):
                    sys.exit("REFUSED: %s: %r encodes to %r, not %r" % (where, rd["word"], code_word(rd["word"]), rd["answer"]))
    elif kind == "loopalgo":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 rounds" % where)
        for rd in d["rounds"]:
            if rd.get("scene"):
                scene_ok(rd["scene"])
            if not rd.get("task") or rd.get("mode") not in ("follow", "fix"):
                sys.exit("REFUSED: %s round needs a task and a mode of follow or fix" % where)
            for bl in rd["blocks"]:
                if bl.get("kind") in ("repeat", "forever"):
                    if not bl.get("body"):
                        sys.exit("REFUSED: %s: a %s block with no body" % (where, bl["kind"]))
                    if bl["kind"] == "repeat" and not 2 <= int(bl["times"]) <= 5:
                        sys.exit("REFUSED: %s: a repeat block needs 2-5 times" % where)
            flat = flatten_algo(rd["blocks"])
            if len(flat) < 4 or not any(bl.get("kind") in ("repeat", "forever") for bl in rd["blocks"]):
                sys.exit("REFUSED: %s round %r needs a loop and at least 4 steps when followed" % (where, rd["task"]))
            if rd["mode"] == "fix":
                bi, j = rd["wrong"]
                if not 0 <= bi < len(rd["blocks"]) or (j >= 0 and (rd["blocks"][bi].get("kind") not in ("repeat", "forever") or not 0 <= j < len(rd["blocks"][bi]["body"]))) or (j < 0 and rd["blocks"][bi].get("kind") in ("repeat", "forever")):
                    sys.exit("REFUSED: %s round %r: wrong %r does not name a step" % (where, rd["task"], rd["wrong"]))
                one_ok(rd["fix"]["opts"], where + " fix");
                if not rd["fix"].get("why") or not rd.get("why"):
                    sys.exit("REFUSED: %s round %r: the fix needs a why, and so does the bug" % (where, rd["task"]))
    elif kind == "compare":
        if len(d["algos"]) < 2 or len(d["rounds"]) < 2 or not d.get("task"):
            sys.exit("REFUSED: %s needs a task, 2+ algorithms and 2+ purposes" % where)
        ids = {a["id"] for a in d["algos"]}
        for a in d["algos"]:
            if not a.get("name") or len(a.get("steps") or []) < 2 or "minutes" not in (a.get("facts") or {}):
                sys.exit("REFUSED: %s algorithm %r needs a name, 2+ steps and facts.minutes" % (where, a.get("id")))
        for rd in d["rounds"]:
            if rd["answer"] not in ids or not rd.get("why") or not rd.get("purpose"):
                sys.exit("REFUSED: %s purpose %r needs an answer that is an algorithm and a why" % (where, rd.get("purpose")))
            if rd.get("check"):
                want = best_algo(d["algos"], rd["check"])
                if want != rd["answer"]:
                    sys.exit("REFUSED: %s purpose %r is keyed %r but the facts say %r" % (where, rd["purpose"], rd["answer"], want))
    elif kind == "subroutine":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 rounds" % where)
        for rd in d["rounds"]:
            if rd.get("scene"):
                scene_ok(rd["scene"])
            if not rd.get("task") or not rd.get("subs") or not any(bl.get("kind") == "call" for bl in rd["main"]):
                sys.exit("REFUSED: %s round needs a task, sub-routines, and a call in the main algorithm" % where)
            for bl in rd["main"]:
                if bl.get("kind") == "call" and bl["sub"] not in rd["subs"]:
                    sys.exit("REFUSED: %s round %r calls %r, which is not a sub-routine" % (where, rd["task"], bl["sub"]))
            for name, steps in rd["subs"].items():
                if len(steps) < 2:
                    sys.exit("REFUSED: %s sub-routine %r has fewer than 2 steps" % (where, name))
            if len(sub_expand(rd["main"], rd["subs"])) < 4:
                sys.exit("REFUSED: %s round %r is too short when expanded" % (where, rd["task"]))
    elif kind == "branch":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 rounds" % where)
        for rd in d["rounds"]:
            if len(rd.get("inputs") or []) != 2 or not rd.get("question") or not rd.get("task"):
                sys.exit("REFUSED: %s round needs a task, a question and exactly 2 inputs" % where)
            if not rd.get("yes") or not rd.get("no"):
                sys.exit("REFUSED: %s round %r needs both branches" % (where, rd["task"]))
            for inp in rd["inputs"]:
                if not branch_run(rd, inp["id"]):
                    sys.exit("REFUSED: %s round %r runs nothing for input %r" % (where, rd["task"], inp["id"]))
            if [st["id"] for st in rd["yes"]] == [st["id"] for st in rd["no"]]:
                sys.exit("REFUSED: %s round %r: both branches do the same thing" % (where, rd["task"]))
    elif kind == "loopbuild":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 rounds" % where)
        for rd in d["rounds"]:
            pool = {st["id"] for st in rd["pool"]}
            ex = rd["expect"]
            if not rd.get("task") or not 2 <= int(ex["times"]) <= 5 or not ex["body"] or any(b not in pool for b in ex["body"]):
                sys.exit("REFUSED: %s round %r: expect needs 2-5 times and a body drawn from the pool" % (where, rd.get("task")))
            if len(pool) <= len(ex["body"]):
                sys.exit("REFUSED: %s round %r: the pool needs a step the loop does not use" % (where, rd["task"]))
    elif kind == "comment":
        blocks_ok(d["program"], "program")
        if len(d["comments"]) != len(d["program"]) or len(d["program"]) < 3:
            sys.exit("REFUSED: %s needs one comment per block, 3+ blocks" % where)
        if sorted(c["block"] for c in d["comments"]) != list(range(len(d["program"]))):
            sys.exit("REFUSED: %s: the comments must cover every block exactly once" % where)
        one_ok(d["then"]["opts"], where + " question")
        if not d["then"].get("why"):
            sys.exit("REFUSED: %s question has no why" % where)
    elif kind == "inputprog":
        blocks_ok(d.get("blocks") or [], "palette")
        ids = [x["id"] for x in d["inputs"]]
        if len(ids) < 2 or len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s needs 2+ inputs and 2+ rounds" % where)
        for rd in d["rounds"]:
            if set(rd["scripts"]) != set(ids):
                sys.exit("REFUSED: %s round gives scripts for %r, not the inputs %r" % (where, sorted(rd["scripts"]), ids))
            for k2, sc in rd["scripts"].items():
                blocks_ok(sc["expect"], "script for " + k2)
                if not sc.get("algorithm") or not expand_program(sc["expect"]):
                    sys.exit("REFUSED: %s round: the script for %r needs an algorithm and a program that does something" % (where, k2))
            exps = [tuple(expand_program(sc["expect"])) for sc in rd["scripts"].values()]
            if len(set(exps)) != len(exps):
                sys.exit("REFUSED: %s round: two inputs produce the same output" % where)
    elif kind == "plan":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s plans fewer than 2 objects" % where)
        for rd in d["rounds"]:
            if not (rd.get("object") and rd.get("pic") and rd.get("goal")):
                sys.exit("REFUSED: %s round needs an object, a pic and a goal" % where)
            for part_ in ("input", "output"):
                one_ok(rd[part_]["opts"], where + " %s %s" % (rd["object"], part_))
                if not rd[part_].get("why") or not rd[part_].get("ask"):
                    sys.exit("REFUSED: %s %s %s needs an ask and a why" % (where, rd["object"], part_))
    elif kind == "parttest":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 programs" % where)
        for rd in d["rounds"]:
            if len(rd["parts"]) < 2 or not rd.get("goal"):
                sys.exit("REFUSED: %s round needs a goal and 2+ parts" % where)
            bugs = 0
            for p in rd["parts"]:
                blocks_ok(p["program"], "part"); blocks_ok(p["expect"], "part expect")
                if not p.get("name") or not p.get("wants") or len(p["program"]) != len(p["expect"]):
                    sys.exit("REFUSED: %s part %r needs a name, a wants, and program and expect of one length" % (where, p.get("name")))
                diffs = [i2 for i2 in range(len(p["program"])) if p["program"][i2] != p["expect"][i2]]
                if diffs:
                    bugs += 1
                    if diffs != [p.get("bug")]:
                        sys.exit("REFUSED: %s part %r differs from its expect at %r but the bug is %r" % (where, p["name"], diffs, p.get("bug")))
                    one_ok(p["fix"]["opts"], where + " fix for " + p["name"])
                    ok = next(o for o in p["fix"]["opts"] if o["ok"])
                    if ok["id"] != p["expect"][p["bug"]] or not p["fix"].get("why") or not p.get("why"):
                        sys.exit("REFUSED: %s part %r: the fix must make the expected program, with a why for the bug and the fix" % (where, p["name"]))
                    blocks_ok([o["id"] for o in p["fix"]["opts"]], "fix options")
                elif p.get("bug") is not None:
                    sys.exit("REFUSED: %s part %r marks a bug but program and expect agree" % (where, p["name"]))
            if bugs < 1:
                sys.exit("REFUSED: %s round %r has no part with a bug" % (where, rd["goal"]))
    elif kind == "datasort":
        if len(d["rows"]) < 4 or len(d["fields"]) < 2 or len(d["tasks"]) < 2:
            sys.exit("REFUSED: %s needs 4+ rows, 2+ fields and 2+ tasks" % where)
        fids = {f["id"]: f for f in d["fields"]}
        for rw in d["rows"]:
            if not rw.get("name") or not rw.get("pic") or any(fid not in rw for fid in fids):
                sys.exit("REFUSED: %s: every row needs a name, a pic and every field" % where)
        for t in d["tasks"]:
            if t["field"] not in fids or t["dir"] not in ("asc", "desc") or t.get("check") not in ("first", "last"):
                sys.exit("REFUSED: %s task %r needs a field, a dir of asc/desc and a check of first/last" % (where, t.get("ask")))
            ordered = sort_rows(d["rows"], t["field"], t["dir"])
            want = ordered[0] if t["check"] == "first" else ordered[-1]
            vals = [rw[t["field"]] for rw in d["rows"]]
            if vals.count(next(rw[t["field"]] for rw in d["rows"] if rw["name"] == want)) != 1:
                sys.exit("REFUSED: %s task %r: a tie at the %s makes the answer unfair" % (where, t["ask"], t["check"]))
            one_ok(t["then"]["opts"], where + " %r question" % t["ask"])
            keyed = next(o["t"] for o in t["then"]["opts"] if o["ok"])
            if keyed != want or not t["then"].get("why"):
                sys.exit("REFUSED: %s task %r is keyed %r but sorting says %r" % (where, t["ask"], keyed, want))
    elif kind == "tableparts":
        names = {rw["name"] for rw in d["rows"]}
        fids = {f["id"] for f in d["fields"]}
        if len(names) < 3 or len(fids) < 2 or len(d["tasks"]) < 3 or {t["kind"] for t in d["tasks"]} != {"record", "field", "data"}:
            sys.exit("REFUSED: %s needs 3+ rows, 2+ fields and tasks of all three kinds" % where)
        for t in d["tasks"]:
            if not t.get("ask"):
                sys.exit("REFUSED: %s task has no ask" % where)
            if t["kind"] == "record" and t["target"] not in names:
                sys.exit("REFUSED: %s task names record %r" % (where, t["target"]))
            if t["kind"] == "field" and t["target"] not in fids:
                sys.exit("REFUSED: %s task names field %r" % (where, t["target"]))
            if t["kind"] == "data" and (len(t["target"]) != 2 or t["target"][0] not in names or t["target"][1] not in fids):
                sys.exit("REFUSED: %s task names data %r" % (where, t["target"]))
    elif kind == "overview":
        if len(d["about"]) < 3:
            sys.exit("REFUSED: %s says fewer than 3 things the lesson is about" % where)
        if "recap" in d and (not isinstance(d["recap"], str) or not 3 <= len(d["recap"].split()) <= 40):
            sys.exit("REFUSED: %s: a recap is one line of 3 to 40 words" % where)
        warm = d.get("warmup") or []
        if "warmup" in d and not 1 <= len(warm) <= 3:
            sys.exit("REFUSED: %s: a warm-up is 1 to 3 questions" % where)
        for it in warm:
            one_ok(it["opts"], where + " warm-up %r" % it["ask"])
            if not it.get("why"):
                sys.exit("REFUSED: %s warm-up %r has no reason" % (where, it["ask"]))
    elif kind == "lecture":
        if len(d["parts"]) < 3:
            sys.exit("REFUSED: %s has fewer than 3 parts" % where)
        for p in d["parts"]:
            if not (p.get("pic") and p.get("title") and p.get("say")):
                sys.exit("REFUSED: %s has a part without a pic, a title and something to say" % where)
    elif kind == "words":
        if len(d["items"]) < 4:
            sys.exit("REFUSED: %s has fewer than 4 words" % where)
        for w in d["items"]:
            if not (w.get("w") and w.get("pic") and w.get("meaning") and len(w.get("uses") or []) >= 1):
                sys.exit("REFUSED: %s word %r needs a pic, a meaning and a sample use" % (where, w.get("w")))
        ws = [w["w"].lower() for w in d["items"]]
        if len(set(ws)) != len(ws):
            sys.exit("REFUSED: %s repeats a word" % where)
    elif kind == "games":
        if len(d["games"]) < 2:
            sys.exit("REFUSED: %s derived fewer than 2 games - the lesson needs words and questions" % where)
        for g in d["games"]:
            if len(g["rounds"]) < 1:
                sys.exit("REFUSED: %s game %r has no rounds" % (where, g["id"]))
    elif kind == "home":
        if len(d["items"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 home projects" % where)
        for h in d["items"]:
            if not (h.get("title") and h.get("materials") and len(h.get("steps") or []) >= 2 and h.get("look")):
                sys.exit("REFUSED: %s project %r needs materials, 2+ steps and something to look for" % (where, h.get("title")))
    elif kind == "resources":
        if not d["finder"]:
            sys.exit("REFUSED: %s has an empty word finder" % where)
    elif kind in ("questions", "quiz"):
        if len(d["items"]) < (6 if kind == "quiz" else 3):
            sys.exit("REFUSED: %s has only %d questions" % (where, len(d["items"])))
        for it in d["items"]:
            one_ok(it["opts"], where + " %r" % it["ask"])
            if not it.get("why"):
                sys.exit("REFUSED: %s %r has no why" % (where, it["ask"]))


# ----------------------------------------------------------------------
# the page
# ----------------------------------------------------------------------
def attr(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&#39;"))


def ssml_attr(s):
    return str(s).replace("'", "&#39;")


def text(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def plain(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(html))).strip()


SLIDE = """    <section class="slide" data-objectives="%(objectives)s" data-explain='%(explain)s' data-say="%(say)s">
      <div class="slide-head"><span class="n">%(n)d</span><h2>%(title)s</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="ask%(n)d">%(ask)s</span></div>
      <div class="stage">
        <div id="stage%(n)d"></div>
        <div class="choices" id="ch%(n)d"></div>
        <p class="fb" id="fb%(n)d" role="status" aria-live="polite" aria-atomic="true"></p>
        <p class="score" id="score%(n)d"></p>
%(note)s      </div>
    </section>
"""

STICKER_SLIDE = """    <section class="slide" data-explain='%(explain)s' data-say="Look at all the stickers you earned!">
      <div class="slide-head"><span class="n">&#9733;</span><h2>My stickers</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span>Every step you finished earned a sticker.</span></div>
      <div class="stage">
        <div class="stickers" id="stickers"></div>
        <p class="fb" id="fbstick" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="bigbtns"><button type="button" class="big ghost small" id="restart">Play again</button></div>
      </div>
    </section>
"""

# The skeleton is the English build's, kept line for line where the shared
# pipeline anchors on it: the skip link stays first in the body, `<div
# class="wrap">` is add-header-bars.py's only anchor, the deck is <main> with
# tabindex="-1" so the skip link can move focus into it, and `<nav class="dots">`
# is what wire-platform-controls.py hangs the hero column on.
PAGE = """<!doctype html>
<html lang="en-GB">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">
<style>
%(css)s</style>

<a class="skip" href="#deck">Skip to the lesson</a>
<div class="wrap">
  <header class="hero">
    <div>
      <p class="eyebrow">Ehel Academy &middot; %(gradeLabel)s Computing &middot; Lesson %(unit)d</p>
      <h1>%(h1)s</h1>
    </div>
    <nav class="dots" id="dots" aria-label="Steps"></nav>
  </header>

  <main class="deck" id="deck" tabindex="-1">
%(slides)s  </main>

  <div class="foot">
    <button type="button" class="big small ghost" id="back">&#9664; Back</button>
    <span class="mid" id="where"></span>
    <button type="button" class="big small" id="next">Next &#9654;</button>
  </div>
</div>

<script>
(function () {

  /* SILENT WHILE THE DECK PAINTS. Every renderer draws once at load,
     because the deck puts all its slides in the DOM at once - so a step
     that speaks as it draws would speak on page load, several at a time.
     say() returns early while this is set; it is cleared immediately
     before show(0, false), the last statement here, so only the draw
     pass is silenced. */
  window.__ehelPainting = true;

  /* ==================================================================
     %(title)s - %(gradeLabel)s Computing, Lesson %(unit)d.

     GENERATED by computing/lesson-kit/build-lessons.py from
     %(appName)s/content/lesson-%(unit)d.py. Do not hand-edit: the
     next build overwrites it, and the fix for anything wrong on this page
     is in the content module or in lesson-kit/lib/computing.js.

     Objectives (Cambridge Primary Computing 0059, Stage %(stage)d): %(codes)s
     ================================================================== */

  const LESSON = %(data)s;

%(voice)s

%(deck)s

%(computing)s

  const STICKERS = %(stickers)s;

%(bootstrap)s
  window.__ehelPainting = false;   /* the draw pass is over: sound is allowed */
  show(0, false);

})();
</script>
"""


def bootstrap(steps):
    out = []
    for i, s in enumerate(steps):
        n = i + 1
        el = ('{ ask: "ask%d", say: "ask%d", stage: "stage%d", ch: "ch%d", fb: "fb%d", score: "score%d" }'
              % (n, n, n, n, n, n))
        fn = KINDS[s["kind"]]
        out.append('  %s(Object.assign({ el: %s, finish: %d, done: %s }, LESSON.steps[%d].data));'
                   % (fn, el, i, json.dumps(s["done"], ensure_ascii=False), i))
    return "\n".join(out) + "\n"


def prepare_quiz_pics(step):
    """sequence() takes `pic` as HTML; the content writes an emoji."""
    if step["kind"] in ("questions", "quiz"):
        for it in step["data"]["items"]:
            p = it.get("pic") or ""
            if p and not p.strip().startswith("<"):
                it["pic"] = '<div class="askpic" aria-hidden="true">' + text(p) + "</div>"
    return step


def build(n, fname, lesson, codes, libs, css, voice, deck, computing, finder):
    steps = expand(n, lesson, codes, finder, CFG)
    for k, s in enumerate(steps):
        check_step(n, k, s, codes, libs)
        prepare_quiz_pics(s)

    title = lesson["title"]
    h1 = lesson.get("h1") or (
        (" ".join(title.split(" ")[:-1]) + " <em>" + title.split(" ")[-1] + "</em>")
        if " " in title else "<em>" + title + "</em>")

    body = ""
    for i, s in enumerate(steps):
        say = s.get("say") or plain(s["ask"])
        body += SLIDE % {
            "n": i + 1, "title": text(s["title"]), "ask": s["ask"],
            "note": ('        <p class="reviewnote">' + text(s["note"]) + "</p>\n") if s.get("note") else "",
            "explain": ssml_attr(s["explain"]), "say": attr(say).replace('"', "&quot;"),
            "objectives": " ".join(s["objectives"]),
        }
    body += STICKER_SLIDE % {"explain": ssml_attr(
        '<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%"><s>Nothing to work out here.</s>'
        '<s>This is your shelf.</s><s>One sticker for every step you finished.</s></prosody></mstts:express-as>'
        '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45"><s>Have a look at what you earned.</s></mstts:express-as>')}

    data = {
        "lessonNo": n, "title": title,
        "objectives": sorted({c for s in steps for c in s["objectives"]}),
        "steps": [{"kind": s["kind"], "title": s["title"], "objectives": s["objectives"], "data": s["data"]} for s in steps],
    }
    stickers = [[s["icon"], s["sticker"]] for s in steps]
    all_codes = sorted({c for s in steps for c in s["objectives"]})

    page = PAGE % {
        "title": title, "unit": n, "h1": h1, "css": css, "slides": body,
        "gradeLabel": text(GRADE_LABEL), "stage": STAGE, "appName": os.path.basename(APP),
        "codes": ", ".join(all_codes),
        "data": json.dumps(data, ensure_ascii=False, indent=2).replace("\n", "\n  "),
        "voice": voice, "deck": deck, "computing": computing,
        "stickers": json.dumps(stickers, ensure_ascii=False),
        "bootstrap": bootstrap(steps),
    }
    io.open(os.path.join(APP, fname), "w", encoding="utf-8", newline="").write(page)
    print("  ok   %-32s lesson %d  %2d steps + stickers  %3d objectives  %6d bytes"
          % (fname, n, len(steps), len(all_codes), len(page)))
    return all_codes


def main():
    wanted = [int(a) for a in sys.argv[1:] if a.isdigit()]
    codes = stage_codes()
    computing = read("computing.js")
    libs = {
        "scenes": js_keys(computing, "SCENES"),
        "blocks": js_keys(computing, "BLOCKS"),
        "apps": js_keys(computing, "APPS"),
        "sounds": js_keys(computing, "BANK", indent="    "),
        "drawings": js_keys(computing, "DRAWINGS"),
        "figures": js_keys(computing, "FIGURES"),
        "device_blocks": js_keys(computing, "DEVICE_BLOCKS"),
    }
    if not all(libs.values()):
        sys.exit("REFUSED: lib/computing.js read as having no scenes, blocks, apps, sounds, drawings or figures - the parser is broken")
    # what each drawing can draw and each figure can name, read out of the
    # JS itself: an option id or a part id the JS does not know would draw
    # nothing, silently, on a child's page
    drawings_src, figures_src = js_block(computing, "DRAWINGS"), js_block(computing, "FIGURES")
    libs["drawing_ids"] = {name: set(re.findall(r'has\("([a-z0-9-]+)"\)', js_entry(drawings_src, name))) for name in libs["drawings"]}
    libs["figure_parts"] = {name: set(re.findall(r'data-part="([a-z0-9-]+)"', js_entry(figures_src, name))) for name in libs["figures"]}
    # Stage 3: which device blocks are "when" hats, and each sprite block's
    # category (a static object may not carry a move block)
    libs["device_hats"] = set(re.findall(r'^    (\w+): \{ label: "[^"]*", icon: "[^"]*", cat: "hat"', js_block(computing, "DEVICE_BLOCKS"), re.M))
    libs["block_cats"] = dict(re.findall(r'^    (\w+): \{ label: "[^"]*", icon: "[^"]*", cat: "(\w+)"', js_block(computing, "BLOCKS"), re.M))
    libs["device_loops"] = set(re.findall(r'^    (\w+): \{ label: "[^"]*", icon: "[^"]*", cat: "loop"', js_block(computing, "DEVICE_BLOCKS"), re.M))
    if not libs["device_hats"] or not libs["block_cats"]:
        sys.exit("REFUSED: lib/computing.js read as having no device hats or no block categories - the parser is broken")
    js_formats = tuple(re.findall(r'^  const FORMATS = \{ (.*?) \};', computing, re.M)[0].replace(":", " ").split())[::2] if re.search(r'^  const FORMATS = \{', computing, re.M) else ()
    if tuple(f for f in js_formats) != FORMATS:
        sys.exit("REFUSED: the cell formats in lib/computing.js are %r but the builder knows %r" % (js_formats, FORMATS))
    # the repeat counts in the JS BLOCKS table must be the ones _rules.py
    # unrolls with, or the page and the gate would disagree about what a
    # program does
    js_repeats = {k: int(v) for k, v in re.findall(r"^    (repeat\d): \{.*?repeat: (\d)", js_block(computing, "BLOCKS"), re.M)}
    if js_repeats != REPEATS:
        sys.exit("REFUSED: the repeat blocks in lib/computing.js are %r but _rules.py unrolls %r" % (js_repeats, REPEATS))
    css = read("lesson.css") + "\n" + read("computing.css")
    voice = read("voice.js")
    deck = read("deck.js")

    print("\n  Building %s Computing lessons  (0059 Stage %d: %d objectives; %d scenes, %d blocks, %d device blocks, %d apps, %d sounds, %d drawings, %d figures)\n"
          % (GRADE_LABEL, STAGE, len(codes), len(libs["scenes"]), len(libs["blocks"]), len(libs["device_blocks"]), len(libs["apps"]), len(libs["sounds"]), len(libs["drawings"]), len(libs["figures"])))
    covered = set()
    everything = load_lessons([])
    finder = finder_words(everything)
    for n, fname, lesson in everything:
        if wanted and n not in wanted:
            continue
        covered |= set(build(n, fname, lesson, codes, libs, css, voice, deck, computing, finder))
    if not wanted:
        missing = sorted(set(codes) - covered)
        print("\n  %d of %d Stage %d objectives reached by at least one step%s\n"
              % (len(covered), len(codes), STAGE, ("; NOT reached: " + ", ".join(missing)) if missing else ""))
        if missing:
            sys.exit(1)
    print("  Now run the shared pipeline - see the docstring.\n")


main()
