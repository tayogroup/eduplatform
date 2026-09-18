# -*- coding: utf-8 -*-
"""Build the new Intensive English program: lesson pages, level homes, course home.

    python build_program.py            # check every authored lesson, then build everything
    python build_program.py --check    # check only; write nothing

The program was decided by the owner on 2026-09-18 (see the Course Map artifact
and inputs/ehel-english-intensive-source/program/program-plan.json):

    Level -> Part -> Lesson -> Section -> Step
    every lesson: What this lesson is about, the Unit lecture, five sections,
    then Review & check.

Sources, all read-only here:
    inputs/ehel-english-intensive-source/program/program-plan.json   the plan
    inputs/ehel-english-intensive-source/program/lessons/<level>/lesson-NN.json
                                                                     authored lessons
    ../lesson-kit/lib/{lesson.css,intensive.css,voice.js,deck.js}    reused unchanged
    shell/subjects/word-pictures.js                                  the picture map

Output: ../app/ (course home, one folder per level, one page per built lesson).
A lesson with no authored file is listed on its level home as "in preparation".
Nothing under the live course (level-N/, level-N-app/) is read or written.
"""
from __future__ import unicode_literals

import io
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
REPO = os.path.abspath(os.path.join(ACADEMY, "..", "..", ".."))
SRC = os.path.join(REPO, "inputs", "ehel-english-intensive-source", "program")
PLAN_PATH = os.path.join(SRC, "program-plan.json")
LESSONS = os.path.join(SRC, "lessons")
OLDLIB = os.path.join(HERE, "..", "..", "lesson-kit", "lib")
LIB = os.path.join(HERE, "lib")
OUT = os.path.join(HERE, "..", "app")
CHECK_ONLY = "--check" in sys.argv[1:]

SECTION_KEYS = ["listen", "grammar", "readWrite", "task", "reading"]
DAY_PLANS = {
    4: [
        "Day 1: What this lesson is about, the Unit lecture and Section 1. Live class: practise the conversation and the new phrases.",
        "Day 2: Sections 2 and 3. Live class: use the new grammar to talk about yourself.",
        "Day 3: Section 4 up to Prepare, then Section 5. Live class: do the real-life task with the teacher.",
        "Day 4: Review & check, then practice: word review, a library book, a Wehel conversation, redrafting your writing. Live class: talk about the book.",
    ],
    3: [
        "Day 1: What this lesson is about, the Unit lecture, then Sections 1 and 2. Live class: practise the conversation and the new phrases.",
        "Day 2: Section 3, then Section 4 up to Prepare. Live class: do the real-life task with the teacher.",
        "Day 3: Section 5, then Review & check. Live class: talk about the book; questions.",
    ],
}


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        return json.load(fh)


def read(path):
    with io.open(path, encoding="utf-8") as fh:
        return fh.read()


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "lesson"


PLAN = load(PLAN_PATH)
LEVELS = {l["id"]: l for l in PLAN["levels"]}
ORDER = [l["id"] for l in PLAN["levels"]]


def plan_lessons(level):
    out = []
    for pi, part in enumerate(level["parts"]):
        for les in part["lessons"]:
            out.append((pi, part, les))
    return out


def lesson_file(les):
    return "lesson-%02d-%s.html" % (les["number"], slug(les["title"]))


def authored_path(level_id, n):
    return os.path.join(LESSONS, level_id, "lesson-%02d.json" % n)


# --- the check ----------------------------------------------------------------
def check_lesson(level, les, d):
    """Every rule here is about SHAPE and LIMITS, never about Cambridge codes:
    the owner took the objective contract out of lesson design on 2026-09-18."""
    e = []
    need = lambda cond, msg: None if cond else e.append(msg)
    need(d.get("schema") == "ehel-intensive-lesson/1", "schema must be ehel-intensive-lesson/1")
    need(d.get("level") == level["id"] and d.get("lesson") == les["number"], "level/lesson do not match the file's place in the plan")
    need(d.get("title") == les["title"], "title %r differs from the plan's %r" % (d.get("title"), les["title"]))
    a = d.get("about") or {}
    need(a.get("text") and 2 <= len(a.get("goals") or []) <= 6, "about: text and 2-6 goals")
    ch = (d.get("unitLecture") or {}).get("chapters") or []
    need(sorted(c.get("for") for c in ch) == sorted(SECTION_KEYS), "unitLecture: one chapter for each of the five sections")
    li = d.get("listen") or {}
    conv = li.get("conversation") or {}
    need(len(conv.get("lines") or []) >= 6, "listen.conversation: at least 6 lines")
    need(len(conv.get("questions") or []) >= 2, "listen.conversation: at least 2 questions")
    need(4 <= len(li.get("phrases") or []) <= 10, "listen.phrases: 4-10")
    w1 = ((li.get("words") or {}).get("items")) or []
    w2 = (((d.get("readWrite") or {}).get("words") or {}).get("items")) or []
    need(6 <= len(w1) <= 16 and 4 <= len(w2) <= 12, "words: 6-16 in Section 1 and 4-12 in Section 3")
    for w in w1 + w2:
        need(all(w.get(k) for k in ("w", "pos", "meaning", "example")), "word %r needs w, pos, meaning, example" % w.get("w"))
    need(len((li.get("sayIt") or {}).get("lines") or []) >= 3, "listen.sayIt: at least 3 lines")
    g = d.get("grammar") or {}
    rules = g.get("rules") or []
    need(1 <= len(rules) <= 2, "grammar.rules: 1 or 2 points (owner's plan: no more than two per lesson)")
    for r in rules:
        need(len(r.get("rule") or []) <= 5, "grammar rule %r: 5 lines or fewer" % r.get("title"))
    need(len(g.get("practice") or []) >= 6, "grammar.practice: at least 6 items")
    rw = d.get("readWrite") or {}
    need(rw.get("text", {}).get("body") and rw.get("gist") and len(rw.get("detail") or []) >= 2, "readWrite: a text, gist and at least 2 detail questions")
    need(len(((rw.get("write") or {}).get("checklist")) or []) >= 2, "readWrite.write: a checklist")
    t = d.get("task") or {}
    need(t.get("card") and len((t.get("prepare") or {}).get("phrases") or []) >= 3, "task: a card and at least 3 phrases")
    need(len(((t.get("model") or {}).get("lines")) or []) >= 4, "task.model: at least 4 lines")
    need(3 <= len(t.get("canDo") or []) <= 6, "task.canDo: 3-6")
    rd = d.get("reading") or {}
    need(rd.get("placeholder") or (rd.get("text") and rd.get("questions")), "reading: a placeholder until the book arrives, or a text with questions")
    q = (d.get("review") or {}).get("quiz") or []
    need(len(q) >= 8, "review.quiz: at least 8 items")
    for item in (g.get("practice") or []) + q:
        need(item.get("a") in (item.get("options") or []), "item %r: the answer must be one of its options" % item.get("q"))
    for item in (conv.get("questions") or []) + (rw.get("gist") or []) + (rw.get("detail") or []):
        need(item.get("a") and len(item.get("wrong") or []) >= 2, "question %r: an answer and 2 wrong options" % item.get("q"))
    return e


# --- pictures -------------------------------------------------------------------
def pictures(words, key):
    src = os.path.join(ACADEMY, "shell", "subjects", "word-pictures.js").replace("\\", "/")
    script = ("import('file:///%s').then(m => { const out = {}; for (const w of %s) out[w] = m.wordPicture(w, '%s') || ''; "
              "process.stdout.write(JSON.stringify(out)); });" % (src, json.dumps(sorted(set(words))), key))
    tmp = os.path.join(HERE, "_pictures.tmp.mjs")
    try:
        with io.open(tmp, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(script)
        raw = subprocess.check_output(["node", tmp], stderr=subprocess.DEVNULL)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    return json.loads(raw.decode("utf-8"))


# --- steps ----------------------------------------------------------------------
def steps_for(d, level):
    names = {s["key"]: s["name"] for s in PLAN["sections"]}
    G = [{"key": "start", "name": "Start"}] + [{"key": k, "name": names[k]} for k in SECTION_KEYS] + [{"key": "review", "name": "Review & check"}]
    S = []
    add = lambda g, t, call: S.append({"g": g, "t": t, "call": call})
    add(0, "What this lesson is about", "P.about")
    add(0, "Unit lecture", "P.lecture")
    add(1, "Warm-up", "P.warmup")
    add(1, "Listen: " + d["listen"]["conversation"]["title"], "P.conversation")
    add(1, "Key phrases", "P.phrases")
    add(1, "Words: " + d["listen"]["words"]["title"], "P.words:listen")
    add(1, "Sound: " + d["listen"]["sound"]["title"], "P.sound")
    add(1, "Say it", "P.sayIt")
    add(2, "Spot the pattern", "P.spot")
    add(2, "The rule", "P.rules")
    add(2, "Practice", "P.practice")
    add(2, "Your turn", "P.yourTurn")
    add(3, "Read: " + d["readWrite"]["text"]["title"], "P.readGist")
    add(3, "Read for detail", "P.readDetail")
    add(3, "Words: " + d["readWrite"]["words"]["title"], "P.words:readWrite")
    add(3, "Model: " + d["readWrite"]["model"]["title"], "P.model")
    add(3, "Write", "P.write")
    add(4, "Task card: " + d["task"]["card"]["title"], "P.taskCard")
    add(4, "Prepare", "P.prepare")
    add(4, "Do it", "P.doIt")
    add(4, "Compare with the model", "P.compare")
    add(4, "Can-do check", "P.canDo")
    add(5, "Before you read", "P.before")
    add(5, "Read the book", "P.book")
    add(5, "Comprehension questions", "P.bookQuestions")
    add(5, "Talk or write about it", "P.talk")
    add(6, "Word review", "P.wordReview")
    add(6, "Quiz", "P.quiz")
    add(6, "What I can do now", None)          # the deck's last slide: paintStickers()
    return G, S


PAGE = """<!doctype html>
<html lang="en-GB">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s · %(levelShort)s · Ehel Intensive English</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">
<style>
%(css)s</style>

<a class="skip" href="#deck">Skip to the lesson</a>
<div class="pg">
  <div class="pg-top">
    <a class="back" href="index.html">&#9664; %(levelName)s</a>
    <div class="tools">
      <button type="button" class="pg-btn" id="menu-toggle" aria-controls="menu" aria-expanded="false">&#9776; Menu</button>
      <button type="button" class="pg-btn" id="toolbox-toggle" aria-haspopup="dialog">Toolbox</button>
    </div>
  </div>
  <header class="pg-head">
    <p class="eyebrow">Ehel Academy &middot; %(levelName)s &middot; Lesson %(n)d &middot; %(cefr)s</p>
    <h1>%(title)s</h1>
    <p class="cando">You will be able to %(cando)s.</p>
  </header>
  <div class="pg-body">
    <nav class="pg-menu" id="menu" aria-label="This lesson">
      <h2>Path</h2>
      <div id="menu-path"></div>
      <div class="pg-toolbox"><h2>Toolbox</h2><div id="menu-tools"></div></div>
    </nav>
    <div class="pg-deck">
      <nav class="dots" id="dots" aria-hidden="true"></nav>
      <main class="deck" id="deck" tabindex="-1">
%(slides)s      </main>
      <div class="foot">
        <button type="button" class="big small ghost" id="back">&#9664; Back</button>
        <span class="mid" id="where"></span>
        <button type="button" class="big small" id="next">Next &#9654;</button>
      </div>
    </div>
  </div>
</div>

<div class="tb-overlay" id="toolbox" hidden>
  <div class="tb-dialog" role="dialog" aria-modal="true" aria-labelledby="toolbox-title">
    <div class="tb-bar"><h2 id="toolbox-title">Toolbox</h2><button type="button" class="pg-btn" id="toolbox-close">Close</button></div>
    <div class="tb-tabs" id="toolbox-tabs" role="tablist" aria-label="Toolbox"></div>
    <div class="tb-body" id="toolbox-body"></div>
  </div>
</div>

<script>
(function () {
  window.__ehelPainting = true;

  /* ==================================================================
     %(title)s - %(levelName)s, Lesson %(n)d.

     GENERATED by intensive-english/program/kit/build_program.py from
     inputs/ehel-english-intensive-source/program. Do not hand-edit: fix
     the lesson file or the kit, then rebuild.
     ================================================================== */

  const LESSON = %(data)s;
  const GROUPS = %(groups)s;
  const STEPS = %(steps)s;

%(voice)s

%(deck)s

%(program)s

%(bootstrap)s
  window.__ehelPainting = false;
  const start = /^#step-(\\d+)$/.exec(location.hash);
  show(start ? Math.min(Number(start[1]) - 1, slides.length - 1) : 0, false);
})();
</script>
"""


def build_lesson(level, pi, part, les, d, nxt):
    key = level["pictureKey"]
    items = d["listen"]["words"]["items"] + d["readWrite"]["words"]["items"]
    pics = pictures([w["w"] for w in items], key)
    for w in items:
        w["pic"] = pics.get(w["w"], "")
    G, S = steps_for(d, level)
    names = {s["key"]: s["name"] for s in PLAN["sections"]}
    days = level["schedule"]["daysPerLesson"]
    data = dict(d)
    data.update({
        "file": lesson_file(les), "hub": "index.html", "levelShort": level["tab"].split(" · ")[0],
        "levelName": level["name"], "days": str(days), "dayPlan": DAY_PLANS[days],
        "sectionNames": names, "next": nxt,
        "readerSpec": level["reader"][0].upper() + level["reader"][1:] + ", linked to “" + d["title"] + "”",
        "teacher": (d.get("teacher") or {}).get("liveClass"),
    })
    slides, calls = [], []
    for i, s in enumerate(S):
        if s["call"] is None:
            slides.append('        <section class="slide" data-say="%s"><div id="summary"></div></section>\n' % s["t"])
            continue
        sid = "s%d" % i
        slides.append('        <section class="slide" data-say="%s"><div id="%s"></div></section>\n' % (s["t"].replace('"', "&quot;"), sid))
        fn, _, arg = s["call"].partition(":")
        calls.append("  %s(%d, %s%s);" % (fn, i, json.dumps(sid), (", " + json.dumps(arg)) if arg else ""))
    css = read(os.path.join(OLDLIB, "lesson.css")) + "\n" + read(os.path.join(OLDLIB, "intensive.css")) + "\n" + read(os.path.join(LIB, "program.css"))
    page = PAGE % {
        "title": d["title"], "levelShort": data["levelShort"], "levelName": level["name"], "n": les["number"], "cefr": d.get("cefr") or level["cefr"],
        "cando": les["cando"], "css": css, "slides": "".join(slides),
        "data": json.dumps(data, ensure_ascii=False, indent=1),
        "groups": json.dumps(G, ensure_ascii=False), "steps": json.dumps([{"g": s["g"], "t": s["t"]} for s in S], ensure_ascii=False),
        "voice": read(os.path.join(OLDLIB, "voice.js")), "deck": read(os.path.join(OLDLIB, "deck.js")),
        "program": read(os.path.join(LIB, "program.js")), "bootstrap": "\n".join(calls),
    }
    folder = os.path.join(OUT, level["id"])
    os.makedirs(folder, exist_ok=True)
    with io.open(os.path.join(folder, lesson_file(les)), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(page)
    groups_idx = [[k for k, s in enumerate(S) if s["g"] == gi] for gi in range(1, len(G))]
    return {"n": les["number"], "file": lesson_file(les), "groups": groups_idx}


HUB = """<!doctype html>
<html lang="en-GB">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s · Ehel Intensive English</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">
<style>
%(css)s</style>
<div class="pg">
  %(top)s
  <nav class="hub-tabs" aria-label="Levels">%(tabs)s</nav>
%(body)s
</div>
<script>
(function () {
  const HUB = %(hub)s;
  const get = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { return null; } };
  const last = HUB.level ? get("iep:" + HUB.level + ":last") : null;
  const c = document.getElementById("continue");
  if (c && last && last.file) {
    c.hidden = false;
    c.href = last.file + "#step-" + (Number(last.step) + 1);
    c.innerHTML = "<small>Continue</small><b>Lesson " + last.lesson + " · " + String(last.title).replace(/</g, "&lt;") + "</b><br>" + String(last.stepTitle || "").replace(/</g, "&lt;");
  }
  (HUB.lessons || []).forEach((l) => {
    const done = new Set(get("iep:" + HUB.level + ":" + l.n + ":done") || []);
    const pips = document.querySelector('[data-pips="' + l.n + '"]');
    if (pips) pips.innerHTML = l.groups.map((g) => "<i" + (g.every((k) => done.has(k)) ? ' class="f"' : "") + "></i>").join("");
  });
})();
</script>
"""


def tabs_html(current, prefix):
    out = []
    for lid in ORDER:
        l = LEVELS[lid]
        label = l["tab"]
        cur = ' aria-current="page"' if lid == current else ""
        out.append('<a href="%s%s/index.html"%s>%s</a>' % (prefix, lid, cur, label))
    return "".join(out)


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def build_hub(level, built):
    sched = level["schedule"]
    weeks = sched["weeks"]
    facts = ["%s" % level["cefr"], "%d lessons" % sum(len(p["lessons"]) for p in level["parts"])]
    if isinstance(weeks, list):
        facts.append("weeks %d–%d of the program" % tuple(weeks))
    else:
        facts.append(weeks)
    if sched.get("daysPerLesson"):
        facts.append("%d days per lesson" % sched["daysPerLesson"])
    facts.append("about %d hours" % sched["hours"])
    body = ['<header class="hub-head"><p class="eyebrow">Ehel Academy &middot; Intensive English</p><h1>%s</h1><p class="exit"><b>By the end:</b> %s</p></header>' % (esc(level["name"]), esc(level["exit"]))]
    body.append('<div class="hub-facts">%s</div>' % "".join("<span>%s</span>" % esc(f) for f in facts))
    body.append('<a class="continue" id="continue" hidden href="#"></a>')
    by_n = {b["n"]: b for b in built}
    for part in level["parts"]:
        body.append('<section class="part"><h2>%s</h2><div class="lessons">' % esc(part["title"]))
        for les in part["lessons"]:
            b = by_n.get(les["number"])
            inner = '<span class="n">%d</span><span><b>%s</b><span class="cd">You will be able to %s.</span>%s</span>' % (
                les["number"], esc(les["title"]), esc(les["cando"]),
                ('<span class="pips" data-pips="%d"></span>' % les["number"]) if b else '<span class="soon">In preparation</span>')
            if b:
                body.append('<a class="lcard built" href="%s">%s</a>' % (b["file"], inner))
            else:
                body.append('<div class="lcard">%s</div>' % inner)
        body.append('</div><div class="checkcard">Then: %s</div></section>' % esc(part["check"]))
    body.append('<section class="hub-tools"><h2 class="eyebrow">Level tools</h2><ul>%s</ul></section>' % "".join("<li>%s</li>" % esc(t) for t in level["tools"]))
    if level.get("note"):
        body.append('<p class="hub-note">%s</p>' % esc(level["note"]))
    body.append('<p class="hub-note">%s</p>' % esc(level["ends"]))
    css = read(os.path.join(OLDLIB, "lesson.css")) + "\n" + read(os.path.join(OLDLIB, "intensive.css")) + "\n" + read(os.path.join(LIB, "program.css"))
    html = HUB % {"title": esc(level["name"]), "css": css, "top": '<div class="pg-top"><a class="back" href="../index.html">&#9664; Intensive English</a></div>', "tabs": tabs_html(level["id"], "../"),
                  "body": "\n".join(body), "hub": json.dumps({"level": level["id"], "lessons": built})}
    folder = os.path.join(OUT, level["id"])
    os.makedirs(folder, exist_ok=True)
    with io.open(os.path.join(folder, "index.html"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(html)


def build_home(counts):
    s = PLAN["schedule"]
    body = ['<header class="hub-head"><p class="eyebrow">Ehel Academy</p><h1>Intensive English</h1><p class="exit">Starter to Level 3 in %d months, then Level 4 in %d more. Two hours a day, five days a week, with a live class of about %d minutes.</p></header>'
            % (s["starterToLevel3Months"], s["level4Months"], s["liveClassMinutes"])]
    body.append('<div class="checkcard">Find my level: the placement test comes here.</div>')
    body.append('<div class="levels">')
    for lid in ORDER:
        l = LEVELS[lid]
        w = l["schedule"]["weeks"]
        when = ("weeks %d–%d" % tuple(w)) if isinstance(w, list) else w
        body.append('<a href="%s/index.html"><span class="cefr">%s</span><b>%s</b><small>%s &middot; %s built of %d</small></a>'
                    % (lid, esc(l["cefr"]), esc(l["name"]), esc(when), counts.get(lid, 0), sum(len(p["lessons"]) for p in l["parts"])))
    body.append("</div>")
    css = read(os.path.join(OLDLIB, "lesson.css")) + "\n" + read(os.path.join(OLDLIB, "intensive.css")) + "\n" + read(os.path.join(LIB, "program.css"))
    html = HUB % {"title": "Intensive English", "css": css, "top": "", "tabs": tabs_html(None, ""),
                  "body": "\n".join(body), "hub": json.dumps({"level": None, "lessons": []})}
    with io.open(os.path.join(OUT, "index.html"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(html)


def main():
    problems, work = [], []
    for lid in ORDER:
        level = LEVELS[lid]
        flat = plan_lessons(level)
        for k, (pi, part, les) in enumerate(flat):
            path = authored_path(lid, les["number"])
            if not os.path.isfile(path):
                continue
            d = load(path)
            errs = check_lesson(level, les, d)
            problems += ["%s lesson %d: %s" % (lid, les["number"], x) for x in errs]
            if k + 1 < len(flat):
                n2 = flat[k + 1][2]
                nxt = ("the %s, then " % part["check"] if flat[k + 1][0] != pi else "") + "Lesson %d · %s" % (n2["number"], n2["title"])
            else:
                nxt = "the %s" % part["check"]
            work.append((level, pi, part, les, d, nxt))
    print("checked %d authored lesson(s)" % len(work))
    if problems:
        print("\n".join("  FAIL " + p for p in problems))
        sys.exit(1)
    if CHECK_ONLY:
        print("  all checks passed")
        return
    built = {}
    for level, pi, part, les, d, nxt in work:
        built.setdefault(level["id"], []).append(build_lesson(level, pi, part, les, d, nxt))
        print("  built %s · lesson %d · %s" % (level["id"], les["number"], lesson_file(les)))
    for lid in ORDER:
        build_hub(LEVELS[lid], built.get(lid, []))
    build_home({k: len(v) for k, v in built.items()})
    print("wrote %s" % os.path.relpath(OUT, ACADEMY))


if __name__ == "__main__":
    main()
