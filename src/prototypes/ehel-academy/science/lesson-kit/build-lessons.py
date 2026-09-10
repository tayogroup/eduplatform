# -*- coding: utf-8 -*-
"""Build the Grade 1 Science standalone lesson pages.

WHAT THIS IS. The Science standalone lesson generator, one kit for every
grade: a course in the design of the Grade 1 Mathematics and English
standalone builds (mathematics/grade-1-app/g1v2, english/grade-1-app), one
self-contained HTML page per lesson, carrying its own CSS, its own activity JS
and its own copy of the voice engine, bypassing shell/course-app.js entirely.

ONE KIT, ONE DIRECTORY PER GRADE. science/grade-N-app holds app.config.json
(grade, stage, floors, hub text) and content/lesson-N.py; everything that
draws a page lives here. The Grade 1 originals were correct and grade-agnostic
in every respect except the stage number and a handful of labels, which is
the same reason mathematics/lesson-app-tools exists.

WHAT THE CONTENT IS. Cambridge Primary Science 0097, the stage named in the
app's config - every learning objective of it, authored against the framework
file src/curriculum/cambridge-science-0097.json (extracted from the published
PDF by tools/extract-cambridge-science-framework.py --code 0097). It is NOT
the 0846 course under science/grade-N/data: that course is 0846-aligned and
its explorations are "follow the plan in your experiments book". These lessons
carry the experiment on the page.

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
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-science-0097.json")
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

# kind -> the renderer in lib/science.js that draws it
KINDS = {
    "explore": "tapCards", "context": "tapCards",
    "sort": "sortBins",
    "experiment": "experiment",
    "predictEach": "predictEach",
    "record": "recordTable",
    "measure": "measure",
    "label": "labelParts",
    "demo": "demo",
    "tester": "tester",
    "ask": "askQuestion",
    "questions": "sequence", "quiz": "sequence",
    # Stage 2
    "order": "order", "graph": "blockGraph", "lookup": "lookup", "build": "build",
    # Stage 3
    "diagram": "makeDiagram",
    # Stage 4
    "key": "useKey",
    # the unit shell, drawn around every lesson by _shell.py
    "overview": "unitOverview", "lecture": "lecture", "words": "scienceWords",
    "games": "gameZone", "home": "homeProjects", "world": "scienceWorld", "resources": "resources",
}


def read(name):
    return io.open(os.path.join(LIB, name), encoding="utf-8").read()


def load_json(path):
    return json.load(io.open(path, encoding="utf-8"))


def stage_codes():
    if not os.path.isfile(FRAMEWORK):
        sys.exit("REFUSED: %s is missing. Extract it first:\n"
                 "  python tools/extract-cambridge-science-framework.py --pdf <0097.pdf> --code 0097 "
                 "--output src/curriculum/cambridge-science-0097.json" % FRAMEWORK)
    fw = load_json(FRAMEWORK)
    stage = fw["objectivesByStage"].get(str(STAGE))
    if not stage:
        sys.exit("REFUSED: the framework publishes no Stage %d" % STAGE)
    return {o["code"]: o["text"] for o in stage}


def js_keys(src, name):
    """The keys of `const NAME = { key: {...}, ... };` in lib/science.js.

    Read out of the real bytes rather than kept as a list here, so a sim or a
    figure renamed in the JS fails the lesson that names it at build time.
    """
    m = re.search(r"\n  const %s = \{\n(.*?)\n  \};" % name, src, re.S)
    if not m:
        sys.exit("REFUSED: cannot find `const %s = {` in lib/science.js" % name)
    keys = set(re.findall(r"^    ([A-Za-z]+): (?:\(|\{)", m.group(1), re.M))
    # Stage 2 adds to the same objects by assignment (SIMS.circuit = {...}),
    # so a sim written that way is a real sim the builder must accept.
    keys |= set(re.findall(r"^  %s\.([A-Za-z]+) = " % name, src, re.M))
    return keys


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


def check_step(n, k, s, codes, sims, figures, scenes, sounds):
    where = "lesson %d step %d (%s)" % (n, k + 1, s["title"])
    if s["kind"] not in KINDS:
        sys.exit("REFUSED: %s has unknown kind %r" % (where, s["kind"]))
    if not s["objectives"] and s["kind"] not in META_KINDS:
        sys.exit("REFUSED: %s names no objective" % where)
    for c in s["objectives"]:
        if c not in codes:
            sys.exit("REFUSED: %s names %s, which 0097 does not publish for Stage %d" % (where, c, STAGE))
    d = s["data"]
    kind = s["kind"]
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
    elif kind == "experiment":
        if d["sim"] not in sims:
            sys.exit("REFUSED: %s names sim %r; lib/science.js has %s" % (where, d["sim"], sorted(sims)))
        one_ok(d["predict"]["opts"], where + " prediction")
        one_ok(d["happened"]["opts"], where + " what-happened")
        if not d["happened"].get("why"):
            sys.exit("REFUSED: %s what-happened has no why" % where)
        if d.get("conclude"):
            one_ok(d["conclude"]["opts"], where + " conclusion")
            if not d["conclude"].get("why"):
                sys.exit("REFUSED: %s conclusion has no why" % where)
    elif kind == "predictEach":
        if d["sim"] not in sims:
            sys.exit("REFUSED: %s names sim %r" % (where, d["sim"]))
        cids = {c["id"] for c in d["choices"]}
        for it in d["items"]:
            if it["answer"] not in cids:
                sys.exit("REFUSED: %s item %r answers %r, not one of %s" % (where, it["label"], it["answer"], sorted(cids)))
            if not it.get("why"):
                sys.exit("REFUSED: %s item %r has no why" % (where, it["label"]))
        if "%s" not in d["ask"]:
            sys.exit("REFUSED: %s ask must contain %%s for the item name" % where)
    elif kind == "record":
        cids = {c["id"] for c in d["choices"]}
        for r in d["rows"]:
            if r["answer"] not in cids:
                sys.exit("REFUSED: %s row %r answers %r" % (where, r["label"], r["answer"]))
        if len(d["columns"]) != 2 or "%s" not in d["ask"]:
            sys.exit("REFUSED: %s needs two columns and an ask with %%s" % where)
    elif kind == "measure":
        for ob in d["objects"]:
            if not 1 <= ob["units"] <= 12:
                sys.exit("REFUSED: %s object %r is %d units; keep it 1-12" % (where, ob["label"], ob["units"]))
        one_ok(d["compare"]["opts"], where + " compare")
    elif kind == "label":
        if d["figure"] not in figures:
            sys.exit("REFUSED: %s names figure %r; lib/science.js draws %s" % (where, d["figure"], sorted(figures)))
        if not d["parts"] or "%s" not in d["ask"]:
            sys.exit("REFUSED: %s needs parts and an ask with %%s" % where)
    elif kind == "key":
        ids = {n["id"] for n in d["nodes"]}
        if len(d["nodes"]) < 2 or len(d["items"]) < 3:
            sys.exit("REFUSED: %s needs at least 2 key questions and 3 things to identify" % where)
        for n in d["nodes"]:
            for br in ("yes", "no"):
                t = n[br]
                if not (t.startswith("=") or t in ids):
                    sys.exit("REFUSED: %s key node %r points %s at %r, which is neither a node nor a =name" % (where, n["id"], br, t))
        leaves = {n[br][1:] for n in d["nodes"] for br in ("yes", "no") if n[br].startswith("=")}
        for it in d["items"]:
            if it["answer"] not in leaves:
                sys.exit("REFUSED: %s item %r answers %r, which no leaf of the key names" % (where, it["label"], it["answer"]))
            # walk the key with the item's facts and check it lands on its answer
            node = d["nodes"][0]["id"]
            for _ in range(len(d["nodes"]) + 1):
                nd = next(x for x in d["nodes"] if x["id"] == node)
                if node not in it["facts"]:
                    sys.exit("REFUSED: %s item %r has no fact for key question %r" % (where, it["label"], node))
                t = nd["yes"] if it["facts"][node] else nd["no"]
                if t.startswith("="):
                    if t[1:] != it["answer"]:
                        sys.exit("REFUSED: %s item %r follows its facts to %r, not %r" % (where, it["label"], t[1:], it["answer"]))
                    break
                node = t
    elif kind == "diagram":
        if d["figure"] not in figures:
            sys.exit("REFUSED: %s names figure %r; lib/science.js draws %s" % (where, d["figure"], sorted(figures)))
        if len(d["parts"]) < 3:
            sys.exit("REFUSED: %s places fewer than 3 labels" % where)
    elif kind == "demo":
        if len(d["frames"]) < 2:
            sys.exit("REFUSED: %s has fewer than 2 frames" % where)
        for f in d["frames"]:
            if f.get("scene") and f["scene"]["id"] not in scenes:
                sys.exit("REFUSED: %s names scene %r" % (where, f["scene"]["id"]))
            if f.get("sound") and f["sound"] not in sounds:
                sys.exit("REFUSED: %s names sound %r" % (where, f["sound"]))
    elif kind == "tester":
        tids = [t["id"] for t in d["tests"]]
        for m in d["materials"]:
            for t in tids:
                if t not in m["props"]:
                    sys.exit("REFUSED: %s material %r has no result for test %r" % (where, m["label"], t))
    elif kind == "ask":
        one_ok(d["findOut"]["opts"], where + " find-out")
        if len(d["questions"]) < 2:
            sys.exit("REFUSED: %s offers fewer than 2 questions" % where)
    elif kind == "order":
        if len(d["items"]) < 3:
            sys.exit("REFUSED: %s orders fewer than 3 things" % where)
    elif kind == "graph":
        if len(d["columns"]) < 2:
            sys.exit("REFUSED: %s graphs fewer than 2 columns" % where)
        for c in d["columns"]:
            # a dot plot may show a value nobody measured: an empty column is the point
            if not isinstance(c["value"], int) or not (0 if d.get("dot") else 1) <= c["value"] <= 10:
                sys.exit("REFUSED: %s column %r has value %r; keep it a whole number 1-10" % (where, c["label"], c["value"]))
        one_ok(d["pattern"]["opts"], where + " pattern")
        if not d["pattern"].get("why"):
            sys.exit("REFUSED: %s pattern has no why" % where)
    elif kind == "lookup":
        if not d["source"].get("lines") or len(d["items"]) < 2:
            sys.exit("REFUSED: %s needs a source with lines and at least 2 questions" % where)
        for it in d["items"]:
            one_ok(it["opts"], where + " %r" % it["ask"])
            if not it.get("why"):
                sys.exit("REFUSED: %s %r has no why" % (where, it["ask"]))
    elif kind == "build":
        if d["sim"] not in sims:
            sys.exit("REFUSED: %s names sim %r" % (where, d["sim"]))
        if len(d["parts"]) < 2:
            sys.exit("REFUSED: %s builds from fewer than 2 parts" % where)
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
      <p class="eyebrow">Ehel Academy &middot; %(gradeLabel)s Science &middot; Lesson %(unit)d</p>
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
     %(title)s - %(gradeLabel)s Science, Lesson %(unit)d.

     GENERATED by science/lesson-kit/build-lessons.py from
     %(appName)s/content/lesson-%(unit)d.py. Do not hand-edit: the
     next build overwrites it, and the fix for anything wrong on this page
     is in the content module or in lesson-kit/lib/science.js.

     Objectives (Cambridge Primary Science 0097, Stage %(stage)d): %(codes)s
     ================================================================== */

  const LESSON = %(data)s;

%(voice)s

%(deck)s

%(science)s

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


def build(n, fname, lesson, codes, sims, figures, scenes, sounds, css, voice, deck, science, finder):
    steps = expand(n, lesson, codes, finder, CFG)
    for k, s in enumerate(steps):
        check_step(n, k, s, codes, sims, figures, scenes, sounds)
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
        "voice": voice, "deck": deck, "science": science,
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
    science = read("science.js")
    sims = js_keys(science, "SIMS")
    figures = js_keys(science, "FIGURES")
    scenes = js_keys(science, "SCENES")
    m = re.search(r"const BANK = \{\n(.*?)\n    \};", science, re.S)
    if not m:
        sys.exit("REFUSED: cannot find the sound BANK in lib/science.js")
    sounds = set(re.findall(r"^      ([a-z]+): ", m.group(1), re.M))
    css = read("lesson.css") + "\n" + read("science.css")
    voice = read("voice.js")
    deck = read("deck.js")

    print("\n  Building %s Science lessons  (0097 Stage %d: %d objectives; %d sims, %d figures, %d scenes, %d sounds)\n"
          % (GRADE_LABEL, STAGE, len(codes), len(sims), len(figures), len(scenes), len(sounds)))
    covered = set()
    everything = load_lessons([])
    finder = finder_words(everything)
    for n, fname, lesson in everything:
        if wanted and n not in wanted:
            continue
        covered |= set(build(n, fname, lesson, codes, sims, figures, scenes, sounds, css, voice, deck, science, finder))
    if not wanted:
        missing = sorted(set(codes) - covered)
        print("\n  %d of %d Stage %d objectives reached by at least one step%s\n"
              % (len(covered), len(codes), STAGE, ("; NOT reached: " + ", ".join(missing)) if missing else ""))
        if missing:
            sys.exit(1)
    print("  Now run the shared pipeline - see the docstring.\n")


main()
