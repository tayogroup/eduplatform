# -*- coding: utf-8 -*-
"""Build a grade's Art & Design STARTING CHECK - starting-check.html.

The readiness check every other subject opens with (validation area 11,
2026-09-11), for a subject that has no shell course to hang one on. Its
questions live in ../data/placement/grade-N.json, in the shape
shell/placement.js reads for Science, Mathematics and the rest, so a teacher
reviewing placement exams reads one format everywhere. Two optional fields are
this subject's own and are documented in that file: `pic` and `optionPics`,
because a reader of five answers a picture far better than a word.

    python ../lesson-kit/build-check.py --app .     # after build-lessons.py

The page is drawn by lib/art.js :: readinessCheck with the same voice, sounds
and recorded narration as the lessons, and it is NOT a lesson:
  - it is not in app.config.json's lesson list, so it earns no unit, reports
    nothing to the school's gradebook, and the shared lesson pipeline does not
    touch it (it carries its own way back to the hub);
  - app.config.json names it in `extraPages`, which is how deploy.mjs knows to
    upload it, and in `startingCheck`, which is how the hub knows to link it.

Refuses, rather than building a page that is wrong: a key that is not one of
its options, a picture list the wrong length, a picture kind the page cannot
draw, section or question counts that disagree with the questions, and a
remediation link to a lesson this grade does not have (or has under another
title).
"""
import io
import json
import os
import re
import sys

KIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, KIT)
from _kit import explain, narration_index  # noqa: E402

LIB = os.path.join(KIT, "lib")
APP = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
if not os.path.isfile(os.path.join(APP, "app.config.json")):
    sys.exit("REFUSED: no app.config.json in %s. Run from a grade directory or pass --app <dir>." % APP)
CFG = json.load(io.open(os.path.join(APP, "app.config.json"), encoding="utf-8"))
SC = CFG.get("startingCheck")
if not SC:
    sys.exit("REFUSED: app.config.json has no startingCheck - nothing to build")
DATA = os.path.normpath(os.path.join(APP, SC["data"]))
OUT = os.path.join(APP, SC["file"])
if SC["file"] not in (CFG.get("extraPages") or []):
    sys.exit("REFUSED: %s is not in app.config.json's extraPages, so deploy.mjs would never upload it" % SC["file"])


def read(name):
    return io.open(os.path.join(LIB, name), encoding="utf-8").read()


def text(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def attr(s):
    return text(s).replace("'", "&#39;").replace('"', "&quot;")


def split(s):
    return [x.strip() for x in str(s or "").split("|") if x.strip()]


def js_keys(src, name):
    i = src.index("const %s = {" % name)
    body = src[i:src.index("\n  };", i)]
    return set(re.findall(r"\n\s+([a-z]+): ", body))


def check(exam, art):
    marks = js_keys(art, "CHECKS")
    lessons = {n: l for n, l in enumerate(CFG["lessons"], 1)}
    secs = {s["sectionId"]: s for s in exam["sections"]}
    qs = exam["questions"]
    fail = []
    if exam.get("kind") != "readiness":
        fail.append("kind is %r, not 'readiness'" % exam.get("kind"))
    if exam["questionCount"] != len(qs):
        fail.append("questionCount %d, but %d questions" % (exam["questionCount"], len(qs)))
    if exam["totalMarks"] != sum(q.get("marks", 1) for q in qs):
        fail.append("totalMarks %d disagrees with the questions' marks" % exam["totalMarks"])
    if sorted(q["sequence"] for q in qs) != list(range(1, len(qs) + 1)):
        fail.append("question sequence is not 1..%d" % len(qs))
    if len({q["questionId"] for q in qs}) != len(qs):
        fail.append("a questionId is repeated")
    for s in exam["sections"]:
        n = sum(1 for q in qs if q["sectionId"] == s["sectionId"])
        if n != s["questionCount"]:
            fail.append("%s says %d questions and has %d" % (s["sectionId"], s["questionCount"], n))
        for m in s.get("remediation") or []:
            les = lessons.get(m["unit"])
            if m.get("grade") != CFG["grade"] or not les:
                fail.append("%s sends the child to Grade %s Lesson %s, which this build does not have" % (s["sectionId"], m.get("grade"), m["unit"]))
            elif les["title"] != m["title"]:
                fail.append("%s calls Lesson %d %r; the lesson is %r" % (s["sectionId"], m["unit"], m["title"], les["title"]))
    b = exam["banding"]
    for k in ("ready", "readyWithReview", "notReady"):
        if not (b.get(k) or {}).get("label") or not b[k].get("message"):
            fail.append("banding.%s needs a label and a message" % k)
    if not (b["ready"]["minOverallPercent"] > b["readyWithReview"]["minOverallPercent"]):
        fail.append("ready must ask for more than readyWithReview")
    if b.get("criticalSection") and b["criticalSection"]["sectionId"] not in secs:
        fail.append("criticalSection names a section that does not exist")
    for q in qs:
        where = q["questionId"]
        if q["sectionId"] not in secs:
            fail.append("%s is in no section" % where)
        opts = split(q["options"])
        if len(opts) < 3 or len(set(opts)) != len(opts):
            fail.append("%s needs three different options" % where)
        if q["correctAnswer"] not in opts:
            fail.append("%s keys %r, which is not one of its options" % (where, q["correctAnswer"]))
        if not q.get("explanation") or not q.get("question"):
            fail.append("%s needs a question and an explanation" % where)
        if q.get("optionPics"):
            pics = split(q["optionPics"])
            if len(pics) != len(opts):
                fail.append("%s has %d pictures for %d options" % (where, len(pics), len(opts)))
            for p in pics:
                if p.startswith("mark:") and p[5:] not in marks:
                    fail.append("%s draws mark %r, which lib/art.js cannot draw" % (where, p[5:]))
                if p.startswith("swatch:") and not re.fullmatch(r"#[0-9A-Fa-f]{6}", p[7:]):
                    fail.append("%s has a swatch that is not a #RRGGBB colour: %r" % (where, p))
    if fail:
        sys.exit("REFUSED: %s\n  " % os.path.relpath(DATA, APP) + "\n  ".join(fail))


SLIDE = """    <section class="slide" data-objectives="" data-explain='%(explain)s' data-say="%(say)s">
      <div class="slide-head"><span class="n">1</span><h2>%(title)s</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="ask1">%(ask)s</span></div>
      <div class="stage">
        <div id="stage1"></div>
        <div class="choices" id="ch1"></div>
        <p class="fb" id="fb1" role="status" aria-live="polite" aria-atomic="true"></p>
        <p class="score" id="score1"></p>
      </div>
    </section>
"""

PAGE = """<!doctype html>
<html lang="en-GB">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">
<style>
%(css)s
%(backcss)s</style>

<a class="skip" href="#deck">Skip to the check</a>
<div class="wrap">
  <a class="lesson-back" id="rcBack" href="index.html"><span aria-hidden="true">&larr;</span> %(backLabel)s</a>
  <header class="hero">
    <div>
      <p class="eyebrow">Ehel Academy &middot; %(gradeLabel)s Art &amp; Design</p>
      <h1>Starting <em>check</em></h1>
    </div>
    <nav class="dots" id="dots" aria-label="Steps"></nav>
  </header>

  <main class="deck" id="deck" tabindex="-1">
%(slide)s    <!-- THE DECK PAINTS ITS STICKER SHELF ON THE LAST SLIDE. With the check
         as the only slide it was the last, so on load the shelf wrote "Every
         sticker! You finished the whole lesson." and the voice read it out to a
         child who had not started (heard live, 2026-09-11). This hidden slide
         is the last one instead, and nothing ever shows it. -->
    <section class="slide" hidden aria-hidden="true"><div class="stickers" id="stickers"></div><p class="fb" id="fbstick"></p></section>
  </main>

  <div class="foot">
    <button type="button" class="big small ghost" id="back">&#9664; Back</button>
    <span class="mid" id="where"></span>
    <button type="button" class="big small" id="next">Next &#9654;</button>
  </div>
</div>

<script>
(function () {
  window.__ehelPainting = true;
  document.body.classList.add("single");

  /* ==================================================================
     %(title)s - %(gradeLabel)s Art & Design, before Lesson 1.

     GENERATED by art-and-design/lesson-kit/build-check.py from
     %(dataRel)s. Do not hand-edit: the questions are in that file, the
     drawing is lib/art.js :: readinessCheck.
     ================================================================== */

  const LESSON = %(data)s;

%(voice)s

%(deck)s

%(art)s

  const STICKERS = [];

  readinessCheck(Object.assign({ el: { ask: "ask1", say: "ask1", stage: "stage1", ch: "ch1", fb: "fb1", score: "score1" }, finish: 0, done: "" }, LESSON.steps[0].data));

  /* the way back to the hub keeps the launch's own parameters, the tokens
     included, and drops only the one that says where the learner came from */
  (function () {
    var p = new URLSearchParams(location.search); p.delete("from");
    var s = p.toString();
    document.getElementById("rcBack").setAttribute("href", "index.html" + (s ? "?" + s : ""));
  })();

  window.__ehelPainting = false;
  show(0, false);
})();
</script>
"""

BACK_CSS = """
  .lesson-back { display: inline-flex; align-items: center; gap: 8px; margin: 0 0 14px; padding: 9px 17px 9px 13px;
    border-radius: 999px; background: var(--card); border: 1px solid var(--line); color: var(--ink);
    font-family: "Inter", "Segoe UI", sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; }
  .lesson-back:hover, .lesson-back:focus-visible { border-color: var(--teal); }
  /* the lesson eyebrow is nowrap; this page has no header bar to take it
     over, so at 390px it ran past the screen edge (measured 2026-09-11) */
  .hero .eyebrow { white-space: normal; }
"""


def main():
    art = narration_index(APP, read("art.js"))
    exam = json.load(io.open(DATA, encoding="utf-8"))
    check(exam, art)
    lessons = {n: {"file": l["file"], "title": l["title"]} for n, l in enumerate(CFG["lessons"], 1)}
    ask = "Before Lesson 1: a short <b>starting check</b>. Tap the answer you think is right. It is never a fail."
    data = {"lessonNo": 0, "title": exam["title"], "objectives": [],
            "steps": [{"kind": "readiness", "title": exam["shortTitle"], "objectives": [],
                       "data": {"exam": exam, "lessons": lessons, "course": CFG["courseKey"], "from": CFG["fromParam"]}}]}
    ex = explain(["This is a starting check.", "It is not a test, and it is never a fail."],
                 ["Listen to each question, look at the pictures, and tap the one you think is right.",
                  "At the end, you will see where to start, and which lessons to do with a grown-up close by."],
                 ["Take your time.", "If you do not know, have a guess."],
                 ["Press Start."])
    page = PAGE % {
        "title": text(exam["title"]), "gradeLabel": text(CFG["gradeLabel"]), "backLabel": text(CFG.get("backLabel") or CFG["gradeLabel"]),
        "css": read("lesson.css") + "\n" + read("art.css"), "backcss": BACK_CSS,
        "slide": SLIDE % {"explain": ex.replace("'", "&#39;"), "say": attr(re.sub(r"<[^>]*>", "", ask)), "title": "Before Lesson 1", "ask": ask},
        "dataRel": os.path.relpath(DATA, os.path.dirname(APP)).replace("\\", "/"),
        "data": json.dumps(data, ensure_ascii=False, indent=2).replace("\n", "\n  "),
        "voice": read("voice.js"), "deck": read("deck.js"), "art": art,
    }
    io.open(OUT, "w", encoding="utf-8", newline="").write(page)
    print("  ok   %-32s %d questions in %d sections, %d bytes" % (SC["file"], len(exam["questions"]), len(exam["sections"]), len(page)))


main()
