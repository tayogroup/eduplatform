# -*- coding: utf-8 -*-
"""Build a grade's Art & Design standalone lesson pages.

WHAT THIS IS. The Art & Design standalone lesson generator, one kit for every
grade: a course in the design of the Grade 1 Mathematics, English, Science,
Computing and Global Perspectives standalone builds, one self-contained HTML
page per lesson, carrying its own CSS, its own activity JS and its own copy of
the voice engine, bypassing shell/course-app.js entirely. It is the Global
Perspectives kit's build-lessons.py with the subject's vocabulary swapped:
the same page skeleton (the shared pipeline anchors on it), a different set
of step kinds, a different set of checks.

ONE KIT, ONE DIRECTORY PER GRADE. art-and-design/grade-N-app holds
app.config.json (grade, stage, floors, hub text) and content/lesson-N.py;
everything that draws a page lives here.

WHAT THE CONTENT IS. Cambridge Primary Art & Design 0067, the stage named in
the app's config - every learning objective of it, authored against the
framework file src/curriculum/cambridge-art-and-design-0067.json (extracted
from the published PDF by tools/extract-cambridge-art-and-design-framework.py;
Cambridge prints the ten codes with no stage digit, so the digit is the
extractor's - see codeScheme in the file). There is no other Art & Design
course in this repo: this is the subject's first.

Every step names the objectives it exercises, and the builder refuses a code
the framework does not publish for the stage. check-coverage.py then asks the
BUILT pages whether every objective is reached, so a lesson that loses a step
fails the gate rather than the syllabus.

WHAT IS COMPUTED. The relationships in _rules.py - what two paints make, the
order of swatches by lightness, what continues a pattern, which material has
the property a purpose needs, which change fixes a piece, what rice does to
paint - are checked here before a page is written and re-checked by the gate
on the shipped bytes. lib/art.js carries the same colour and texture tables
for the page, and this tool reads them out of the JS by regex and refuses to
build if they disagree with _rules.py's.

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

from _shell import META_KINDS, journal_codes, expand, finder_words

KIT = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(KIT, "..", ".."))
REPO = os.path.abspath(os.path.join(ACADEMY, "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-art-and-design-0067.json")
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

# kind -> the renderer in lib/art.js that draws it
KINDS = {
    "explore": "tapCards", "context": "tapCards",
    "sort": "sortBins",
    "order": "order", "tone": "order",
    "demo": "demo",
    "source": "pictureSource",
    # experiencing and making
    "mix": "colourMixer", "marks": "markMaker", "pattern": "patternMaker",
    "choose": "chooseFor", "experiment": "paintExperiment",
    # reflecting and thinking and working artistically
    "compare": "sameDifferent", "comment": "kindComment", "refine": "refineIt", "journal": "myJournal",
    "questions": "sequence", "quiz": "sequence",
    # the unit shell, drawn around every lesson by _shell.py
    "overview": "unitOverview", "lecture": "lecture", "words": "bigWords",
    "games": "gameZone", "home": "homeProjects", "world": "ourWorld", "resources": "resources",
}

from _rules import (HEX, MIX, TINT, SHADE, TEXTURE, mix, tone_order, pattern_period,  # noqa: E402
                    fits, compare, comment_fits, refinements, paint_texture, journal_fallback)


def read(name):
    return io.open(os.path.join(LIB, name), encoding="utf-8").read()


def load_json(path):
    return json.load(io.open(path, encoding="utf-8"))


def stage_codes():
    if not os.path.isfile(FRAMEWORK):
        sys.exit("REFUSED: %s is missing. Extract it first:\n"
                 "  python tools/extract-cambridge-art-and-design-framework.py" % FRAMEWORK)
    fw = load_json(FRAMEWORK)
    stage = fw["objectivesByStage"].get(str(STAGE))
    if not stage:
        sys.exit("REFUSED: the framework publishes no Stage %d" % STAGE)
    return {o["code"]: o["text"] for o in stage}


def js_keys(src, name, indent="  "):
    """The keys of `const NAME = { key: ..., ... };` in lib/art.js.

    Read out of the real bytes rather than kept as a list here, so a scene,
    a sound, a tool or a mark check renamed in the JS fails the lesson that
    names it at build time.
    """
    m = re.search(r"\n%sconst %s = \{\n(.*?)\n%s\};" % (indent, name, indent), src, re.S)
    if not m:
        sys.exit("REFUSED: cannot find `const %s = {` in lib/art.js" % name)
    return set(re.findall(r"^%s  ([A-Za-z]+): " % indent, m.group(1), re.M))


def js_table(src, name):
    """A `const NAME = { "k": "v", ... }` table in lib/art.js, as a dict -
    single-line or multi-line - so the page's colour and texture tables
    can be held equal to _rules.py's."""
    m = re.search(r"\n  const %s = \{(.*?)\};" % name, src, re.S)
    if not m:
        sys.exit("REFUSED: cannot find `const %s = {` in lib/art.js" % name)
    return dict(re.findall(r'"([^"]+)":\s*"([^"]+)"', m.group(1)))


def tables_agree(src):
    for name, mine in (("HEX", HEX), ("MIX", MIX), ("TINT", TINT), ("SHADE", SHADE), ("TEXTURE", TEXTURE)):
        theirs = js_table(src, name)
        if theirs != mine:
            diff = sorted(set(theirs.items()) ^ set(mine.items()))
            sys.exit("REFUSED: lib/art.js %s disagrees with _rules.py %s: %r" % (name, name, diff[:6]))


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
def swatch_pic(hex_):
    return ('<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="%s" '
            'stroke="rgba(0,0,0,0.25)" stroke-width="2"/></svg>' % hex_)


LECTURES = {}
_lec = os.path.join(APP, "media", "lecture", "index.json")
if os.path.isfile(_lec):
    LECTURES = load_json(_lec)


def fill_derived(n, lesson, steps, everything):
    """Fill the fields a step leaves to the builder, from the lesson's own
    data or from every lesson's, so a claim about the course is never typed
    twice: a tone ladder's order from its swatches' lightness, a journal's
    fallback from the lesson's own making steps, a course-wide journal from
    every lesson's."""
    slug = lesson["slug"]
    for k, s in enumerate(steps):
        d = s["data"]
        if s["kind"] == "lecture" and slug in LECTURES:
            # the recorded lesson (build-lectures.mjs): the step becomes the
            # video, and the parts stay underneath as its transcript
            v = LECTURES[slug]
            d.update({"video": v["video"], "captions": v["captions"], "poster": v["poster"], "seconds": v["seconds"]})
            s["title"] = "Lesson video"
            s["ask"] = "Watch the lesson video, then press <b>I watched it</b>. You can read it part by part underneath instead."
            s["say"] = "Watch the lesson video, then press I watched it. You can read it part by part underneath instead."
        if s["kind"] == "tone":
            ids = tone_order(d["swatches"])
            if ids is None:
                sys.exit("REFUSED: lesson %d step %d (%s): two swatches have the same lightness, so the ladder has no single order" % (n, k + 1, s["title"]))
            by = {sw["id"]: sw for sw in d["swatches"]}
            d["items"] = [{"id": i, "label": by[i]["label"], "pic": swatch_pic(by[i]["hex"]),
                           "say": by[i].get("say") or (by[i]["label"] + "." )} for i in ids]
            d.setdefault("lead", "From light to dark")
            d.setdefault("first", "Tap the lightest one")
            d.setdefault("hint", "Not yet. Something is lighter than %s.")
            d.setdefault("jot", {"kind": "tone", "text": "put %d colours in order from light to dark" % len(ids), "pic": "\U0001F311"})
        if s["kind"] == "journal":
            if d.get("scope") == "course":
                fb = []
                for m, _, les in everything:
                    for en in journal_fallback(les["steps"]):
                        fb.append(dict(en, lesson=m))
                d["fallback"] = fb
            elif not d.get("fallback"):
                d["fallback"] = journal_fallback(steps[:k])


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


def one_of(names, want, where):
    """A list of plain-string options must hold `want` exactly once and no repeats."""
    if len(names) < 2 or len(set(names)) != len(names):
        sys.exit("REFUSED: %s options must be 2+ and distinct: %r" % (where, names))
    if names.count(want) != 1:
        sys.exit("REFUSED: %s is keyed %r by the rules, and the options %r do not hold it exactly once" % (where, want, names))


def check_step(n, k, s, codes, js, steps):
    where = "lesson %d step %d (%s)" % (n, k + 1, s["title"])
    if s["kind"] not in KINDS:
        sys.exit("REFUSED: %s has unknown kind %r" % (where, s["kind"]))
    if not s["objectives"] and s["kind"] not in META_KINDS:
        sys.exit("REFUSED: %s names no objective" % where)
    for c in s["objectives"]:
        if c not in codes:
            sys.exit("REFUSED: %s names %s, which 0067 does not publish for Stage %d" % (where, c, STAGE))
    d = s["data"]
    kind = s["kind"]
    scenes, sounds, checks, tools = js["scenes"], js["sounds"], js["checks"], js["tools"]

    def scene_ok(name):
        if name not in scenes:
            sys.exit("REFUSED: %s names scene %r; lib/art.js draws %s" % (where, name, sorted(scenes)))

    def work_ok(w, what):
        if w.get("scene"):
            scene_ok(w["scene"])
        elif not w.get("pic"):
            sys.exit("REFUSED: %s %s %r has neither a scene nor a pic" % (where, what, w.get("id")))
        if not w.get("features"):
            sys.exit("REFUSED: %s %s %r has no features to find" % (where, what, w.get("id")))

    if kind in ("explore", "context"):
        if not d.get("items"):
            sys.exit("REFUSED: %s has no items" % where)
        for it in d["items"]:
            if it.get("sound") and it["sound"] not in sounds:
                sys.exit("REFUSED: %s names sound %r, which SOUND does not synthesise" % (where, it["sound"]))
            if it.get("scene"):
                scene_ok(it["scene"])
            elif not it.get("pic"):
                sys.exit("REFUSED: %s card %r has neither a scene nor a pic" % (where, it.get("label")))
        if d.get("then"):
            one_ok(d["then"]["opts"], where + " question")
            if not d["then"].get("why"):
                sys.exit("REFUSED: %s question has no why" % where)
    elif kind == "sort":
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
    elif kind == "order":
        if len(d["items"]) < 3:
            sys.exit("REFUSED: %s orders fewer than 3 things" % where)
    elif kind == "tone":
        if len(d["swatches"]) < 3:
            sys.exit("REFUSED: %s has fewer than 3 swatches" % where)
        for sw in d["swatches"]:
            if not re.fullmatch(r"#[0-9A-Fa-f]{6}", sw.get("hex", "")):
                sys.exit("REFUSED: %s swatch %r has no six-digit hex" % (where, sw.get("id")))
        if [it["id"] for it in d["items"]] != tone_order(d["swatches"]):
            sys.exit("REFUSED: %s items are not in the order the swatches' lightness gives" % where)
    elif kind == "demo":
        if len(d["frames"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 frames" % where)
        for f in d["frames"]:
            if f.get("scene"):
                scene_ok(f["scene"]["id"])
            if f.get("sound") and f["sound"] not in sounds:
                sys.exit("REFUSED: %s names sound %r" % (where, f["sound"]))
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
        if not d.get("then"):
            sys.exit("REFUSED: %s has no closing question" % where)
        t = d["then"]
        keyed = [o for o in t["opts"] if o.get("spot")]
        if len(keyed) != 1 or keyed[0]["spot"] not in ids:
            sys.exit("REFUSED: %s question: exactly one option must name a spot in the picture (has %d)" % (where, len(keyed)))
        if len(t["opts"]) < 2 or not t.get("why"):
            sys.exit("REFUSED: %s question needs 2+ options and a why" % where)
    elif kind == "mix":
        pids = [p["id"] for p in d["pots"]]
        if len(pids) < 3 or len(set(pids)) != len(pids):
            sys.exit("REFUSED: %s needs 3+ distinct pots" % where)
        for p in pids:
            if p not in HEX:
                sys.exit("REFUSED: %s pot %r is not a colour the kit can draw (%s)" % (where, p, ", ".join(sorted(HEX))))
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 mixes" % where)
        for rd in d["rounds"]:
            if rd["a"] not in pids or rd["b"] not in pids:
                sys.exit("REFUSED: %s mixes %r and %r, and one is not a pot here" % (where, rd["a"], rd["b"]))
            made = mix(rd["a"], rd["b"])
            if made is None:
                sys.exit("REFUSED: %s mixes %r and %r, and the kit has no answer for that pair" % (where, rd["a"], rd["b"]))
            one_of(rd["opts"], made, where + " mix %s+%s" % (rd["a"], rd["b"]))
            for o in rd["opts"]:
                if o not in HEX:
                    sys.exit("REFUSED: %s offers %r, which the kit cannot draw" % (where, o))
    elif kind == "marks":
        if len(d["tools"]) < 2 or not set(d["tools"]) <= tools:
            sys.exit("REFUSED: %s tools must be 2+ of %s" % (where, sorted(tools)))
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 marks to make" % where)
        for rd in d["rounds"]:
            if rd["tool"] not in d["tools"]:
                sys.exit("REFUSED: %s round %r uses tool %r, not offered here" % (where, rd.get("ask"), rd["tool"]))
            if rd["want"] not in checks:
                sys.exit("REFUSED: %s round %r wants %r; lib/art.js can judge %s" % (where, rd.get("ask"), rd["want"], sorted(checks)))
            if not (rd.get("ask") and rd.get("made")):
                sys.exit("REFUSED: %s round needs an ask and what it makes (`made`)" % where)
    elif kind == "pattern":
        tids = [t["id"] for t in d["tiles"]]
        if len(tids) < 2 or len(set(tids)) != len(tids):
            sys.exit("REFUSED: %s needs 2+ distinct tiles" % where)
        for t in d["tiles"]:
            if not (t.get("label") and (t.get("hex") or t.get("pic"))):
                sys.exit("REFUSED: %s tile %r needs a label and a hex or a pic" % (where, t.get("id")))
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 patterns to continue" % where)
        for rd in d["rounds"]:
            if not set(rd["seq"]) <= set(tids):
                sys.exit("REFUSED: %s round %r uses a tile that is not here" % (where, rd.get("ask")))
            p = pattern_period(rd["seq"])
            if p is None or p < 2:
                sys.exit("REFUSED: %s round %r is not a pattern of 2+ tiles that repeats in full" % (where, rd.get("ask")))
            if rd["show"] < p or rd["show"] + rd["ask_n"] > len(rd["seq"]) or rd["ask_n"] < 1:
                sys.exit("REFUSED: %s round %r must show at least one repeat and ask for tiles the sequence holds" % (where, rd.get("ask")))
            if not rd.get("ask"):
                sys.exit("REFUSED: %s round has no ask" % where)
    elif kind == "choose":
        mids = [m["id"] for m in d["materials"]]
        if len(mids) < 3 or len(set(mids)) != len(mids):
            sys.exit("REFUSED: %s needs 3+ distinct materials" % where)
        for m in d["materials"]:
            if not (m.get("props") and m.get("say")):
                sys.exit("REFUSED: %s material %r needs props and something to say" % (where, m["id"]))
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 purposes" % where)
        for rd in d["rounds"]:
            ok = fits(d["materials"], rd["needs"])
            if not ok or len(ok) == len(mids):
                sys.exit("REFUSED: %s purpose %r: some materials must fit %r and some must not (fit: %r)" % (where, rd["purpose"], rd["needs"], ok))
            if not (rd.get("purpose") and rd.get("pic")):
                sys.exit("REFUSED: %s purpose needs a purpose and a pic" % where)
    elif kind == "experiment":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 things to add" % where)
        for rd in d["rounds"]:
            tx = paint_texture(rd["additive"])
            if tx is None:
                sys.exit("REFUSED: %s adds %r, which the kit has no answer for (%s)" % (where, rd["additive"], ", ".join(sorted(TEXTURE))))
            one_of(rd["opts"], tx, where + " add %s" % rd["additive"])
            if not rd.get("pic"):
                sys.exit("REFUSED: %s round %r has no pic" % (where, rd["additive"]))
    elif kind == "compare":
        work_ok(d["a"], "work"); work_ok(d["b"], "work")
        if d["a"]["id"] == d["b"]["id"]:
            sys.exit("REFUSED: %s compares a work with itself" % where)
        if len(d["cards"]) < 3:
            sys.exit("REFUSED: %s has fewer than 3 cards" % where)
        bins = []
        for c in d["cards"]:
            b = compare(d["a"]["features"], d["b"]["features"], c["about"])
            if b is None:
                sys.exit("REFUSED: %s card %r is about %r, which is in neither picture" % (where, c["t"], c["about"]))
            bins.append(b)
        if "both" not in bins or "one" not in bins:
            sys.exit("REFUSED: %s needs at least one card in both pictures and one in only one" % where)
    elif kind == "comment":
        wids = {w["id"] for w in d["works"]}
        for w in d["works"]:
            work_ok(w, "work")
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 pictures to praise" % where)
        for rd in d["rounds"]:
            if rd["work"] not in wids:
                sys.exit("REFUSED: %s round praises %r, not a work here" % (where, rd["work"]))
            w = next(x for x in d["works"] if x["id"] == rd["work"])
            if len(rd["opts"]) < 2:
                sys.exit("REFUSED: %s round for %r offers fewer than 2 comments" % (where, rd["work"]))
            hits = [o for o in rd["opts"] if comment_fits(o["about"], w["features"])]
            if len(hits) != 1:
                sys.exit("REFUSED: %s round for %r: exactly one comment must be about something in the work (found %d)" % (where, rd["work"], len(hits)))
    elif kind == "refine":
        if len(d["rounds"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 pieces to refine" % where)
        for rd in d["rounds"]:
            p = rd["piece"]
            if not (p.get("title") and p.get("problem")):
                sys.exit("REFUSED: %s piece needs a title and a problem" % where)
            if p.get("scene"):
                scene_ok(p["scene"])
            elif not p.get("pic"):
                sys.exit("REFUSED: %s piece %r has neither a scene nor a pic" % (where, p["title"]))
            ids = [c["id"] for c in rd["changes"]]
            if len(ids) < 3 or len(set(ids)) != len(ids):
                sys.exit("REFUSED: %s piece %r needs 3+ changes with distinct ids" % (where, p["title"]))
            good = refinements(rd["changes"], rd["needs"])
            if not good or len(good) == len(ids):
                sys.exit("REFUSED: %s piece %r: some changes must fix it and some must not (fix: %r)" % (where, p["title"], good))
            for c in rd["changes"]:
                if not c.get("say"):
                    sys.exit("REFUSED: %s change %r says nothing about what happened" % (where, c["t"]))
    elif kind == "journal":
        if len(d.get("fallback") or []) < 2:
            sys.exit("REFUSED: %s has fewer than 2 things made to look back on - the lesson needs 2+ making steps before it" % where)
        if len(d.get("changes") or []) < 3:
            sys.exit("REFUSED: %s offers fewer than 3 things to change" % where)
        if set(s["objectives"]) != set(journal_codes(STAGE)):
            sys.exit("REFUSED: %s must carry exactly the two codes %r" % (where, journal_codes(STAGE)))
    elif kind == "overview":
        if len(d["about"]) < 3:
            sys.exit("REFUSED: %s says fewer than 3 things the lesson is about" % where)
    elif kind == "lecture":
        if len(d["parts"]) < 3:
            sys.exit("REFUSED: %s has fewer than 3 parts" % where)
        for key in ("video", "captions", "poster"):
            if d.get(key) and not os.path.isfile(os.path.join(APP, d[key])):
                sys.exit("REFUSED: %s names %s %s, which is not on disk" % (where, key, d[key]))
        for p in d["parts"]:
            if not ((p.get("pic") or p.get("scene")) and p.get("title") and p.get("say")):
                sys.exit("REFUSED: %s has a part without a pic, a title and something to say" % where)
            if p.get("scene"):
                scene_ok(p["scene"])
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
      <p class="eyebrow">Ehel Academy &middot; %(gradeLabel)s Art &amp; Design &middot; Lesson %(unit)d</p>
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
     %(title)s - %(gradeLabel)s Art & Design, Lesson %(unit)d.

     GENERATED by art-and-design/lesson-kit/build-lessons.py from
     %(appName)s/content/lesson-%(unit)d.py. Do not hand-edit: the
     next build overwrites it, and the fix for anything wrong on this page
     is in the content module or in lesson-kit/lib/art.js.

     Objectives (Cambridge Primary Art & Design 0067, Stage %(stage)d): %(codes)s
     ================================================================== */

  const LESSON = %(data)s;

%(voice)s

%(deck)s

%(art)s

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


def build(n, fname, lesson, codes, js, css, voice, deck, art, finder, everything):
    steps = expand(n, lesson, codes, finder, CFG)
    fill_derived(n, lesson, steps, everything)
    for k, s in enumerate(steps):
        check_step(n, k, s, codes, js, steps)
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
        "voice": voice, "deck": deck, "art": art,
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
    art = read("art.js")
    js = {"scenes": js_keys(art, "SCENES"), "sounds": js_keys(art, "BANK", indent="    "),
          "checks": js_keys(art, "CHECKS"), "tools": js_keys(art, "TOOLS")}
    if not all(js.values()):
        sys.exit("REFUSED: lib/art.js read as having no scenes, sounds, checks or tools - the parser is broken")
    tables_agree(art)
    css = read("lesson.css") + "\n" + read("art.css")
    voice = read("voice.js")
    deck = read("deck.js")

    print("\n  Building %s Art & Design lessons  (0067 Stage %d: %d objectives; %d scenes, %d sounds, %d mark checks, %d tools)\n"
          % (GRADE_LABEL, STAGE, len(codes), len(js["scenes"]), len(js["sounds"]), len(js["checks"]), len(js["tools"])))
    covered = set()
    everything = load_lessons([])
    finder = finder_words(everything)
    for n, fname, lesson in everything:
        if wanted and n not in wanted:
            continue
        covered |= set(build(n, fname, lesson, codes, js, css, voice, deck, art, finder, everything))
    if not wanted:
        missing = sorted(set(codes) - covered)
        print("\n  %d of %d Stage %d objectives reached by at least one step%s\n"
              % (len(covered), len(codes), STAGE, ("; NOT reached: " + ", ".join(missing)) if missing else ""))
        if missing:
            sys.exit(1)
    print("  Now run the shared pipeline - see the docstring.\n")


main()
