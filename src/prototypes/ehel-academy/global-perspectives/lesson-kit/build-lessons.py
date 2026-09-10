# -*- coding: utf-8 -*-
"""Build a grade's Global Perspectives standalone lesson pages.

WHAT THIS IS. The Global Perspectives standalone lesson generator, one kit for
every grade: a course in the design of the Grade 1 Mathematics, English,
Science and Computing standalone builds (mathematics/grade-1-app/g1v2,
english/grade-1-app, science/grade-1-app, computing/grade-1-app), one
self-contained HTML page per lesson, carrying its own CSS, its own activity JS
and its own copy of the voice engine, bypassing shell/course-app.js entirely.
It is the Computing kit's build-lessons.py with the subject's vocabulary
swapped: the same page skeleton (the shared pipeline anchors on it), a
different set of step kinds, a different set of checks.

ONE KIT, ONE DIRECTORY PER GRADE. global-perspectives/grade-N-app holds
app.config.json (grade, stage, floors, hub text) and content/lesson-N.py;
everything that draws a page lives here.

WHAT THE CONTENT IS. Cambridge Primary Global Perspectives 0838, the stage
named in the app's config - every learning objective of it, authored against
the framework file src/curriculum/cambridge-global-perspectives-0838.json
(extracted from the published PDF by
tools/extract-cambridge-global-perspectives-framework.py; Cambridge prints no
codes for this subject, so the codes are the extractor's, stable because they
derive from the sub-strand - see codeScheme in the file). It is NOT the course
under global-perspectives/grade-N/data: that course is built from the school's
Word packs (a Teacher & Parent Guide, an Activity Sheet and a Mini-Project at
Stage 1). Nothing under global-perspectives/grade-N/ is read or written here.

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

from _shell import META_KINDS, lookback_codes, expand, finder_words

KIT = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(KIT, "..", ".."))
REPO = os.path.abspath(os.path.join(ACADEMY, "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-global-perspectives-0838.json")
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

# kind -> the renderer in lib/gp.js that draws it
KINDS = {
    "explore": "tapCards", "context": "tapCards",
    "sort": "sortBins",
    "order": "order",
    "demo": "demo",
    # research
    "askq": "questionBuilder", "source": "pictureSource", "text": "textSource", "survey": "survey",
    "pictogram": "pictogramRead", "organiser": "organiser", "observe": "observeCount",
    # analysis
    "know": "knowBoard", "consequence": "consequences", "solve": "solveIt",
    # evaluation
    "sources": "pickSource", "opinion": "opinion",
    # collaboration and reflection
    "team": "teamBuild", "contrib": "contributions", "strengths": "strengthsLimits", "lookback": "lookBack",
    # communication
    "answer": "relevantAnswer", "listen": "listenAsk",
    "questions": "sequence", "quiz": "sequence",
    # the unit shell, drawn around every lesson by _shell.py
    "overview": "unitOverview", "lecture": "lecture", "words": "bigWords",
    "games": "gameZone", "home": "homeProjects", "world": "ourWorld", "resources": "resources",
}

# The relationships the subject is about live in _rules.py, shared with the
# gate, so the builder and check-coverage.py cannot disagree about any of them.
from _rules import (survey_counts, observe_counts, pictogram_answer, relevant, relevant_sources,  # noqa: E402
                    solutions, share_outcome, question_fits, allocations)


def read(name):
    return io.open(os.path.join(LIB, name), encoding="utf-8").read()


def load_json(path):
    return json.load(io.open(path, encoding="utf-8"))


def stage_codes():
    if not os.path.isfile(FRAMEWORK):
        sys.exit("REFUSED: %s is missing. Extract it first:\n"
                 "  python tools/extract-cambridge-global-perspectives-framework.py" % FRAMEWORK)
    fw = load_json(FRAMEWORK)
    stage = fw["objectivesByStage"].get(str(STAGE))
    if not stage:
        sys.exit("REFUSED: the framework publishes no Stage %d" % STAGE)
    return {o["code"]: o["text"] for o in stage}


def js_keys(src, name, indent="  "):
    """The keys of `const NAME = { key: ..., ... };` in lib/gp.js.

    Read out of the real bytes rather than kept as a list here, so a scene
    or a sound renamed in the JS fails the lesson that names it at build
    time.
    """
    m = re.search(r"\n%sconst %s = \{\n(.*?)\n%s\};" % (indent, name, indent), src, re.S)
    if not m:
        sys.exit("REFUSED: cannot find `const %s = {` in lib/gp.js" % name)
    return set(re.findall(r"^%s  ([A-Za-z]+): " % indent, m.group(1), re.M))


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
# what the content cannot say for itself: derived data
# ----------------------------------------------------------------------
def fill_derived(n, lesson, steps, everything):
    """Fill the fields a step leaves to the builder, from the lesson's own
    data or from every lesson's, so a claim about the course is never typed
    twice: a pictogram from its survey, a contribution log from its team
    step, a course-wide look-back from every lesson's about lines."""
    for k, s in enumerate(steps):
        d = s["data"]
        if s["kind"] == "pictogram" and d.get("fromObserve"):
            prev = [x for x in steps[:k] if x["kind"] == "observe"]
            if not prev:
                sys.exit("REFUSED: lesson %d step %d (%s) reads its rows from an observation, and no observe step comes before it" % (n, k + 1, s["title"]))
            ob = prev[-1]["data"]
            d["rows"] = observe_counts(ob["scene"], ob["rounds"])
            d.setdefault("title", ob["title"])
            d.setdefault("columns", ob.get("columns") or ["What we saw", "How many"])
        if s["kind"] == "strengths":
            prev = [x for x in steps[:k] if x["kind"] == "team"]
            if not prev:
                sys.exit("REFUSED: lesson %d step %d (%s) looks at strengths, and no team step comes before it" % (n, k + 1, s["title"]))
            d["fallback"] = [dict(x, missed=False) for x in team_log(prev[-1]["data"]) if x["who"] == "you"]
            d["teamStep"] = steps.index(prev[-1])
        if s["kind"] == "pictogram" and d.get("fromSurvey"):
            prev = [x for x in steps[:k] if x["kind"] == "survey"]
            if not prev:
                sys.exit("REFUSED: lesson %d step %d (%s) reads its pictogram from a survey, and no survey step comes before it" % (n, k + 1, s["title"]))
            sv = prev[-1]["data"]
            d["rows"] = survey_counts(sv["people"], sv["options"])
            d.setdefault("title", sv["question"])
            d.setdefault("columns", sv.get("columns") or ["Answer", "How many"])
        if s["kind"] == "contrib" and not d.get("fallback"):
            prev = [x for x in steps[:k] if x["kind"] == "team"]
            if not prev:
                sys.exit("REFUSED: lesson %d step %d (%s) asks who did what, and no team step comes before it" % (n, k + 1, s["title"]))
            d["fallback"] = team_log(prev[-1]["data"])
            d.setdefault("friends", prev[-1]["data"]["friends"])
            d["teamStep"] = steps.index(prev[-1])   # the same index the page passes as `finish`
        if s["kind"] == "lookback" and d.get("scope") == "course":
            d["learned"] = [{"t": a, "lesson": m} for m, _, les in everything for a in (les.get("about") or [])]
            d["liked"] = [{"title": les["title"], "icon": (les["steps"][0]["icon"] if les["steps"] else "\U0001F4D8"), "lesson": m}
                          for m, _, les in everything]
            d.setdefault("pick", 3)


def team_log(d):
    """The record a team step leaves when every round is played well: what
    YOU did (the keyed option's log line) and what each friend did."""
    names = {f["id"]: f["name"] for f in d["friends"]}
    out = []
    for rd in d["rounds"]:
        if rd["kind"] == "share":
            good = next(o for o in rd["opts"] if share_outcome(rd["you"], o["give"], rd["need"]) == "both")
            out.append({"who": "you", "text": rd.get("log") or good["t"], "pic": rd["resource"]["pic"]})
        elif rd["kind"] == "work":
            good = next(o for o in rd["opts"] if o.get("good"))
            out.append({"who": "you", "text": rd.get("log") or good["t"], "pic": rd.get("pic", "\U0001F91D")})
        elif rd["kind"] == "idea":
            good = next(o for o in rd["opts"] if o.get("good"))
            out.append({"who": "you", "text": rd.get("log") or good["t"], "pic": rd.get("pic", "\U0001F4A1")})
        elif rd["kind"] == "task":
            out.append({"who": "you", "text": rd.get("log") or ("You " + lower_first(rd["job"])), "pic": rd.get("pic", "\U0001F6E0\ufe0f")})
        elif rd["kind"] == "allocate":
            out.append({"who": "you", "text": rd.get("log") or "You gave every job to the right person.", "pic": rd.get("pic", "\U0001F4CB")})
        else:
            out.append({"who": rd["who"], "text": rd.get("log") or (names[rd["who"]] + " " + rd["did"]), "pic": rd.get("pic", "\U0001F64C")})
    return out


def lower_first(s):
    return s[:1].lower() + s[1:] if s else s


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


def check_step(n, k, s, codes, scenes, sounds, steps):
    where = "lesson %d step %d (%s)" % (n, k + 1, s["title"])
    if s["kind"] not in KINDS:
        sys.exit("REFUSED: %s has unknown kind %r" % (where, s["kind"]))
    if not s["objectives"] and s["kind"] not in META_KINDS:
        sys.exit("REFUSED: %s names no objective" % where)
    for c in s["objectives"]:
        if c not in codes:
            sys.exit("REFUSED: %s names %s, which 0838 does not publish for Stage %d" % (where, c, STAGE))
    d = s["data"]
    kind = s["kind"]

    def scene_ok(name):
        if name not in scenes:
            sys.exit("REFUSED: %s names scene %r; lib/gp.js draws %s" % (where, name, sorted(scenes)))

    def tags_ok(opts, what):
        for o in opts:
            if not o.get("about"):
                sys.exit("REFUSED: %s %s option %r carries no topic tag (use tagged())" % (where, what, o.get("t")))
        ts = [o["t"] for o in opts]
        if len(set(ts)) != len(ts):
            sys.exit("REFUSED: %s %s repeats an option" % (where, what))

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
    elif kind in ("sort", "organiser"):
        ids = {b["id"] for b in d["bins"]}
        if len(ids) < 2:
            sys.exit("REFUSED: %s has fewer than 2 bins" % where)
        if len(d["items"]) < 3:
            sys.exit("REFUSED: %s sorts fewer than 3 things" % where)
        for it in d["items"]:
            if it["bin"] not in ids:
                sys.exit("REFUSED: %s item %r goes to bin %r, which does not exist" % (where, it["label"], it["bin"]))
            if not it.get("why"):
                sys.exit("REFUSED: %s item %r has no why" % (where, it["label"]))
        if kind == "organiser" and not d.get("title"):
            sys.exit("REFUSED: %s organiser has no title" % where)
    elif kind == "order":
        if len(d["items"]) < 3:
            sys.exit("REFUSED: %s orders fewer than 3 things" % where)
    elif kind == "demo":
        if len(d["frames"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 frames" % where)
        for f in d["frames"]:
            if f.get("scene"):
                scene_ok(f["scene"]["id"])
            if f.get("sound") and f["sound"] not in sounds:
                sys.exit("REFUSED: %s names sound %r" % (where, f["sound"]))
    elif kind == "askq":
        if len(d["words"]) < 3 or len(d["ends"]) < 3 or len(d["rounds"]) < 3:
            sys.exit("REFUSED: %s needs 3+ question words, 3+ endings and 3+ rounds" % where)
        end_ids = [e["id"] for e in d["ends"]]
        if len(set(end_ids)) != len(end_ids):
            sys.exit("REFUSED: %s repeats an ending id" % where)
        for e in d["ends"]:
            for w in e.get("words") or []:
                if w not in d["words"]:
                    sys.exit("REFUSED: %s ending %r allows %r, which is not a question word here" % (where, e["id"], w))
            if not e.get("words"):
                sys.exit("REFUSED: %s ending %r allows no question word" % (where, e["id"]))
        for rd in d["rounds"]:
            if rd["word"] not in d["words"]:
                sys.exit("REFUSED: %s round %r wants %r, not a question word here" % (where, rd["want"], rd["word"]))
            if not question_fits(d["ends"], rd["end"], rd["word"]):
                sys.exit("REFUSED: %s round %r: %r + ending %r is not a question the ending allows" % (where, rd["want"], rd["word"], rd["end"]))
            if not rd.get("why"):
                sys.exit("REFUSED: %s round %r has no why" % (where, rd["want"]))
    elif kind == "source":
        scene_ok(d["scene"])
        if len(d["spots"]) < 3:
            sys.exit("REFUSED: %s has fewer than 3 things to find in the picture" % where)
        ids = [sp["id"] for sp in d["spots"]]
        if len(set(ids)) != len(ids):
            sys.exit("REFUSED: %s repeats a spot id" % where)
        for sp in d["spots"]:
            if not (sp.get("label") and sp.get("fact")):
                sys.exit("REFUSED: %s spot %r needs a label and a fact" % (where, sp["id"]))
        if d.get("need", len(ids)) > len(ids):
            sys.exit("REFUSED: %s asks for more spots than it has" % where)
        if not d.get("then") and not d.get("rounds"):
            sys.exit("REFUSED: %s has neither a closing question nor locate rounds" % where)
        for rd in d.get("rounds") or []:
            if rd.get("spot") not in ids or not rd.get("ask") or not rd.get("why"):
                sys.exit("REFUSED: %s locate round %r needs a spot in the picture, an ask and a why" % (where, rd.get("ask")))
        if d.get("then"):
            t = d["then"]
            keyed = [o for o in t["opts"] if o.get("spot")]
            if len(keyed) != 1 or keyed[0]["spot"] not in ids:
                sys.exit("REFUSED: %s question: exactly one option must name a spot in the picture (has %d)" % (where, len(keyed)))
            if len(t["opts"]) < 2 or not t.get("why"):
                sys.exit("REFUSED: %s question needs 2+ options and a why" % where)
    elif kind == "observe":
        kinds = [r["kind"] for r in d["rounds"]]
        if len(d["scene"]) < 6 or len(kinds) < 2 or len(set(kinds)) != len(kinds):
            sys.exit("REFUSED: %s needs 6+ things in the scene and 2+ distinct kinds to count" % where)
        for r in d["rounds"]:
            if not any(it["kind"] == r["kind"] for it in d["scene"]):
                sys.exit("REFUSED: %s counts %r, and the scene has none" % (where, r["kind"]))
            if not (r.get("label") and r.get("pic")):
                sys.exit("REFUSED: %s round %r needs a label and a pic" % (where, r["kind"]))
        if not d.get("title"):
            sys.exit("REFUSED: %s has no title" % where)
    elif kind == "strengths":
        if len(d.get("limits") or []) < 2:
            sys.exit("REFUSED: %s needs 2+ things the child could do better next time" % where)
        if d.get("then"):
            one_ok(d["then"]["opts"], where + " question")
            if not d["then"].get("why"):
                sys.exit("REFUSED: %s question has no why" % where)
        if not d.get("fallback"):
            sys.exit("REFUSED: %s has nothing the child did in its team step" % where)
    elif kind == "text":
        if len(d["lines"]) < 3 or len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s needs 3+ lines and 2+ questions" % where)
        if d.get("then"):
            one_ok(d["then"]["opts"], where + " closing question")
            if not d["then"].get("why"):
                sys.exit("REFUSED: %s closing question has no why" % where)
        for rd in d["rounds"]:
            if not isinstance(rd.get("line"), int) or not 0 <= rd["line"] < len(d["lines"]):
                sys.exit("REFUSED: %s round %r points at line %r, of %d" % (where, rd.get("ask"), rd.get("line"), len(d["lines"])))
            if not rd.get("ask") or not rd.get("why"):
                sys.exit("REFUSED: %s round needs an ask and a why" % where)
    elif kind == "survey":
        ids = {x["id"] for x in d["options"]}
        if len(d["people"]) < 3 or len(ids) < 2:
            sys.exit("REFUSED: %s needs 3+ people and 2+ options" % where)
        for p in d["people"]:
            if p["answer"] not in ids:
                sys.exit("REFUSED: %s: %s answers %r, not an option" % (where, p["name"], p["answer"]))
            if not p.get("say"):
                sys.exit("REFUSED: %s: %s says nothing" % (where, p["name"]))
        if not d.get("question"):
            sys.exit("REFUSED: %s asks no question" % where)
    elif kind == "pictogram":
        if len(d.get("rows") or []) < 2 or len(d["items"]) < 2:
            sys.exit("REFUSED: %s needs 2+ rows and 2+ questions" % where)
        for it in d["items"]:
            one_ok(it["opts"], where + " %r" % it["ask"])
            if not it.get("why"):
                sys.exit("REFUSED: %s %r has no why" % (where, it["ask"]))
            want = pictogram_answer(d["rows"], it["check"])
            keyed = next(o["t"] for o in it["opts"] if o["ok"])
            if want is None:
                sys.exit("REFUSED: %s %r: the pictogram cannot answer it (check %r)" % (where, it["ask"], it["check"]))
            if keyed != want:
                sys.exit("REFUSED: %s %r is keyed %r but the pictogram says %r" % (where, it["ask"], keyed, want))
    elif kind == "know":
        tags_ok(d["cards"], "cards")
        on = relevant(d["cards"], d["tag"])
        if len(d["cards"]) < 4 or len(on) < 2 or len(on) == len(d["cards"]):
            sys.exit("REFUSED: %s needs 4+ cards, 2+ about %r and at least one about something else" % (where, d["tag"]))
        if d.get("need", 2) > len(on):
            sys.exit("REFUSED: %s asks for %d things known and only %d cards are about the topic" % (where, d["need"], len(on)))
        if d.get("mode") not in (None, "talk", "structured"):
            sys.exit("REFUSED: %s has an unknown mode %r" % (where, d["mode"]))
        if d.get("mode") == "structured":
            slots = d.get("slots") or []
            if len(slots) < 2:
                sys.exit("REFUSED: %s structured talk needs 2+ slots" % where)
            for sl in slots:
                if not any(c.get("about") == d["tag"] and c.get("part") == sl["id"] for c in d["cards"]):
                    sys.exit("REFUSED: %s structured talk has no card about %r for the %r slot" % (where, d["tag"], sl["id"]))
            for c in d["cards"]:
                if c.get("about") == d["tag"] and c.get("part") not in {sl["id"] for sl in slots}:
                    sys.exit("REFUSED: %s card %r is about the topic but names no slot" % (where, c["t"]))
            d["need"] = len(slots)
        for c in d["cards"]:
            if not c.get("say"):
                sys.exit("REFUSED: %s card %r says nothing" % (where, c["t"]))
    elif kind == "answer":
        if len(d["rounds"]) < 3:
            sys.exit("REFUSED: %s has fewer than 3 questions to answer" % where)
        for rd in d["rounds"]:
            tags_ok(rd["opts"], "answers")
            if len(relevant(rd["opts"], rd["about"])) != 1:
                sys.exit("REFUSED: %s %r: exactly one answer must be about %r" % (where, rd["ask"], rd["about"]))
            if not rd.get("why"):
                sys.exit("REFUSED: %s %r has no why" % (where, rd["ask"]))
    elif kind == "listen":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 talks to listen to" % where)
        for rd in d["rounds"]:
            if len(rd["talk"]) < 2 or not rd.get("topics"):
                sys.exit("REFUSED: %s talk by %s needs 2+ lines and its topics" % (where, rd["speaker"]["name"]))
            tags_ok(rd["opts"], "questions")
            if len(relevant(rd["opts"], rd["topics"])) != 1:
                sys.exit("REFUSED: %s talk by %s: exactly one question must be about what was said" % (where, rd["speaker"]["name"]))
            if not rd.get("why"):
                sys.exit("REFUSED: %s talk by %s has no why" % (where, rd["speaker"]["name"]))
    elif kind == "consequence":
        if len(d["rounds"]) < 3:
            sys.exit("REFUSED: %s has fewer than 3 situations" % where)
        for rd in d["rounds"]:
            one_ok(rd["predict"]["opts"], where + " %r" % rd["situation"])
            if rd.get("cause"):
                one_ok(rd["cause"]["opts"], where + " cause of %r" % rd["situation"])
            if not (rd.get("result") and rd["result"].get("say") and rd.get("why")):
                sys.exit("REFUSED: %s %r needs a result with something to say, and a why" % (where, rd["situation"]))
    elif kind == "solve":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 issues to solve" % where)
        for rd in d["rounds"]:
            ids = [a["id"] for a in rd["actions"]]
            if len(ids) < 3 or len(set(ids)) != len(ids):
                sys.exit("REFUSED: %s issue %r needs 3+ actions with distinct ids" % (where, rd["issue"]["title"]))
            fixes = solutions(rd["actions"], rd["needs"])
            if not fixes or len(fixes) == len(ids):
                sys.exit("REFUSED: %s issue %r: some actions must fix it and some must not (fixes: %r)" % (where, rd["issue"]["title"], fixes))
            for a in rd["actions"]:
                if not a.get("say"):
                    sys.exit("REFUSED: %s action %r says nothing about what happened" % (where, a["t"]))
            if not rd.get("why"):
                sys.exit("REFUSED: %s issue %r has no why" % (where, rd["issue"]["title"]))
    elif kind == "sources":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 topics" % where)
        for rd in d["rounds"]:
            if len(rd["sources"]) < 3:
                sys.exit("REFUSED: %s topic %r offers fewer than 3 sources" % (where, rd["topic"]))
            rel = relevant_sources(rd["sources"], rd["tag"])
            if rd.get("multi"):
                if len(rel) < 2 or len(rel) == len(rd["sources"]):
                    sys.exit("REFUSED: %s topic %r: a multi round needs 2+ sources about %r and at least one that is not (found %r)" % (where, rd["topic"], rd["tag"], rel))
            elif len(rel) != 1:
                sys.exit("REFUSED: %s topic %r: exactly one source must be about %r (found %r)" % (where, rd["topic"], rd["tag"], rel))
            one_ok(rd["reasons"], where + " reasons for %r" % rd["topic"])
            if not rd.get("why"):
                sys.exit("REFUSED: %s topic %r has no why" % (where, rd["topic"]))
    elif kind == "opinion":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 topics" % where)
        for rd in d["rounds"]:
            if len(rd["stances"]) < 2:
                sys.exit("REFUSED: %s topic %r offers fewer than 2 opinions" % (where, rd["topic"]))
            tags_ok(rd["reasons"], "reasons")
            rel = relevant(rd["reasons"], rd["tag"])
            need_r = max(2, int(d.get("reasonsNeeded") or 1))
            if len(rel) < need_r or len(rel) == len(rd["reasons"]):
                sys.exit("REFUSED: %s topic %r needs %d+ reasons about %r and at least one about something else" % (where, rd["topic"], need_r, rd["tag"]))
    elif kind == "team":
        scene_ok(d["scene"])
        fids = {f["id"] for f in d["friends"]}
        if len(fids) < 2 or len(d["rounds"]) < 3:
            sys.exit("REFUSED: %s needs 2+ friends and 3+ rounds" % where)
        kinds = {rd["kind"] for rd in d["rounds"]}
        if "friend" not in kinds or not (kinds & {"share", "work", "idea", "task", "allocate"}):
            sys.exit("REFUSED: %s needs a friend round and at least one share, work, idea, task or allocate round (has %s)" % (where, sorted(kinds)))
        if not kinds <= {"share", "work", "idea", "task", "allocate", "friend"}:
            sys.exit("REFUSED: %s has an unknown round kind (%s)" % (where, sorted(kinds - {"share", "work", "idea", "task", "allocate", "friend"})))
        for rd in d["rounds"]:
            if rd["who"] not in fids:
                sys.exit("REFUSED: %s round is about %r, not a friend" % (where, rd["who"]))
            if rd["kind"] == "share":
                outs = [share_outcome(rd["you"], o["give"], rd["need"]) for o in rd["opts"]]
                if None in outs:
                    sys.exit("REFUSED: %s share round: an option gives more than you have" % where)
                if outs.count("both") != 1:
                    sys.exit("REFUSED: %s share round %r: exactly one option must let BOTH of you finish (outcomes %r)" % (where, rd["ask"], outs))
                if not rd.get("why"):
                    sys.exit("REFUSED: %s share round has no why" % where)
            elif rd["kind"] in ("work", "idea"):
                goods = [o for o in rd["opts"] if o.get("good")]
                if len(goods) != 1 or len(rd["opts"]) < 2:
                    sys.exit("REFUSED: %s %s round %r must have exactly one good option" % (where, rd["kind"], rd["situation"]))
                if not rd.get("why"):
                    sys.exit("REFUSED: %s %s round has no why" % (where, rd["kind"]))
            elif rd["kind"] == "task":
                ids = [st["id"] for st in rd.get("steps") or []]
                if len(ids) < 2 or len(set(ids)) != len(ids) or not rd.get("job"):
                    sys.exit("REFUSED: %s task round needs a job and 2+ steps with distinct ids" % where)
            elif rd["kind"] == "allocate":
                members = rd.get("members") or []
                if len(rd.get("tasks") or []) < 2 or len(members) < 2:
                    sys.exit("REFUSED: %s allocate round needs 2+ tasks and 2+ members" % where)
                for tid, who in allocations(rd["tasks"], members).items():
                    if len(who) != 1:
                        sys.exit("REFUSED: %s allocate round: task %r fits %d members, must fit exactly one" % (where, tid, len(who)))
            else:
                if not rd.get("did"):
                    sys.exit("REFUSED: %s friend round says nothing the friend did" % where)
    elif kind == "contrib":
        fb = d["fallback"]
        if len(fb) < 3 or not any(x["who"] == "you" for x in fb) or not any(x["who"] != "you" for x in fb):
            sys.exit("REFUSED: %s needs 3+ recorded actions, yours and a friend's" % where)
        fids = {f["id"] for f in d["friends"]}
        for x in fb:
            if x["who"] != "you" and x["who"] not in fids:
                sys.exit("REFUSED: %s records an action by %r, not a friend" % (where, x["who"]))
    elif kind == "lookback":
        learned = d["learned"]
        if d.get("mode") == "changed" and len(d.get("changed") or []) < 2:
            sys.exit("REFUSED: %s needs 2+ before/after pairs" % where)
        texts = {(x["t"] if isinstance(x, dict) else x) for x in learned}
        if not learned or len(d["not"]) < 2 or len(d["liked"]) < 2 or len(d["becauses"]) < 3:
            sys.exit("REFUSED: %s needs things learned, 2+ things not learned, 2+ things to like and 3+ reasons" % where)
        for x in d["not"]:
            if x in texts:
                sys.exit("REFUSED: %s lists %r as not learned, and it is one of the things learned" % (where, x))
        if d.get("pick", 1) > len(learned):
            sys.exit("REFUSED: %s asks for %d things learned and lists %d" % (where, d["pick"], len(learned)))
        if set(s["objectives"]) != set(lookback_codes(STAGE)):
            sys.exit("REFUSED: %s must carry exactly the two Reflection codes %r" % (where, lookback_codes(STAGE)))
    elif kind == "overview":
        if len(d["about"]) < 3:
            sys.exit("REFUSED: %s says fewer than 3 things the lesson is about" % where)
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
      <p class="eyebrow">Ehel Academy &middot; %(gradeLabel)s Global Perspectives &middot; Lesson %(unit)d</p>
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
     %(title)s - %(gradeLabel)s Global Perspectives, Lesson %(unit)d.

     GENERATED by global-perspectives/lesson-kit/build-lessons.py from
     %(appName)s/content/lesson-%(unit)d.py. Do not hand-edit: the
     next build overwrites it, and the fix for anything wrong on this page
     is in the content module or in lesson-kit/lib/gp.js.

     Objectives (Cambridge Primary Global Perspectives 0838, Stage %(stage)d): %(codes)s
     ================================================================== */

  const LESSON = %(data)s;

%(voice)s

%(deck)s

%(gp)s

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


def build(n, fname, lesson, codes, scenes, sounds, css, voice, deck, gp, finder, everything):
    steps = expand(n, lesson, codes, finder, CFG)
    fill_derived(n, lesson, steps, everything)
    for k, s in enumerate(steps):
        check_step(n, k, s, codes, scenes, sounds, steps)
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
        "voice": voice, "deck": deck, "gp": gp,
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
    gp = read("gp.js")
    scenes = js_keys(gp, "SCENES")
    sounds = js_keys(gp, "BANK", indent="    ")
    if not (scenes and sounds):
        sys.exit("REFUSED: lib/gp.js read as having no scenes or sounds - the parser is broken")
    css = read("lesson.css") + "\n" + read("gp.css")
    voice = read("voice.js")
    deck = read("deck.js")

    print("\n  Building %s Global Perspectives lessons  (0838 Stage %d: %d objectives; %d scenes, %d sounds)\n"
          % (GRADE_LABEL, STAGE, len(codes), len(scenes), len(sounds)))
    covered = set()
    everything = load_lessons([])
    finder = finder_words(everything)
    for n, fname, lesson in everything:
        if wanted and n not in wanted:
            continue
        covered |= set(build(n, fname, lesson, codes, scenes, sounds, css, voice, deck, gp, finder, everything))
    if not wanted:
        missing = sorted(set(codes) - covered)
        print("\n  %d of %d Stage %d objectives reached by at least one step%s\n"
              % (len(covered), len(codes), STAGE, ("; NOT reached: " + ", ".join(missing)) if missing else ""))
        if missing:
            sys.exit(1)
    print("  Now run the shared pipeline - see the docstring.\n")


main()
