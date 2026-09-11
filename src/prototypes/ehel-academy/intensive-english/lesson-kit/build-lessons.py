# -*- coding: utf-8 -*-
"""Write one self-contained HTML page per Intensive English unit.

The design is the Grade 1 Mathematics and English standalone builds: one step
per screen, a deck of slides, a voice bar, everything the page needs inside the
page. It bypasses shell/course-app.js entirely.

    python build-lessons.py --app ../level-1-app          # every unit in the config
    python build-lessons.py --app ../level-1-app 3        # just unit 3

Source is the BUILT course data (intensive-english/level-N/data/units/unit-K.json),
read at build time and inlined. Nothing under level-N/ is written and nothing in
shell/subjects/intensive-english.js is touched: this build only ever reads.

Two things differ from the English kit, both because of what this course is:

  * The unit numbers start at ZERO. Unit 0 is Letters and Sounds, and the
    course's own ids are u00..u19, so `lessons` in app.config.json carries each
    unit's NUMBER and the progress prefix maps 1:1 onto the course unit. The
    English builder can assume position == unit; here it cannot.
  * There is no reward furniture. The last slide is the unit's can-do list and
    its assignment, because the learners are adults.

Audio is not resolved here. The page computes cyrb53 of the text it is about to
speak, exactly as the course shell does, and asks for
media/intensive-english/gNN/audio/tts/<hash>.mp3 — so a clip can never be named
after text the page does not show. Anything shorter than the generator's floor
falls through to the runtime voice, which is the same behaviour the shell has.
"""

from __future__ import unicode_literals

import io
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(HERE, "..", ".."))
LIB = os.path.join(HERE, "lib")


def app_root(argv):
    if "--app" in argv:
        i = argv.index("--app")
        if i + 1 >= len(argv):
            sys.exit("REFUSED: --app needs a directory")
        return os.path.abspath(os.path.join(os.getcwd(), argv[i + 1]))
    return os.path.abspath(os.path.join(HERE, "..", "level-1-app"))


ARGV = sys.argv[1:]
OUT = app_root(ARGV)
CFG_PATH = os.path.join(OUT, "app.config.json")
if not os.path.isfile(CFG_PATH):
    sys.exit("REFUSED: no app.config.json in %s" % OUT)
CFG = json.load(io.open(CFG_PATH, encoding="utf-8"))

LEVEL = int(CFG["level"])
DATA = os.path.join(ACADEMY, "intensive-english", "level-%d" % LEVEL, "data")
if not os.path.isdir(DATA):
    sys.exit("REFUSED: no course data at %s" % DATA)

ONLY = [int(a) for a in ARGV if a.isdigit()]


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        return json.load(fh)


def read_lib(name):
    with io.open(os.path.join(LIB, name), encoding="utf-8") as fh:
        return fh.read()


# --- pictures ---------------------------------------------------------------
# shell/subjects/word-pictures.js is an ES module with no top-level DOM use, so
# it can be evaluated straight through node. The key is "ienN", never the level
# number: English's grade senses must never reach a CEFR level (see the note in
# that file).
def word_pictures(words):
    src = os.path.join(ACADEMY, "shell", "subjects", "word-pictures.js").replace("\\", "/")
    script = (
        "import('file:///%s').then(m => {"
        "  const out = {};"
        "  for (const w of %s) out[w] = m.wordPicture(w, 'ien%d') || '';"
        "  process.stdout.write(JSON.stringify(out));"
        "});" % (src, json.dumps(sorted(set(words))), LEVEL)
    )
    # Written to a .mjs file rather than passed with --input-type=module: the
    # flag makes node warn about reparsing on every call, onto stderr, which
    # buries the builder's own output.
    tmp = os.path.join(HERE, "_pictures.tmp.mjs")
    try:
        with io.open(tmp, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(script)
        # stderr is dropped: word-pictures.js is a .js file with export
        # syntax, so node prints a reparse notice for it on every call.
        raw = subprocess.check_output(["node", tmp], stderr=subprocess.DEVNULL)
    except Exception as exc:                                   # noqa: BLE001
        sys.exit("REFUSED: could not read word-pictures.js through node (%s)" % exc)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    return json.loads(raw.decode("utf-8"))


# --- the unit, as the page needs it -----------------------------------------
def clean(text):
    return re.sub(r"\s+", " ", (text or "")).strip()


def comprehension_items(unit):
    """Multiple choice built from the unit's OWN answers.

    The course stores a question and one answer, so the wrong options have to
    come from somewhere: they are other answers from the same unit, which means
    a wrong tap lands on something the learner is also learning rather than on
    nonsense. An answer too long to sit on a button, or one that is a template
    for the learner's own words, cannot be an option - those questions are kept
    whole in the drawer underneath instead, with their answer revealed.
    """
    fits = [q for q in unit["comprehension"]
            if len(clean(q["correctAnswer"])) <= 90 and "___" not in q["correctAnswer"]]
    pool = []
    for q in fits:
        a = clean(q["correctAnswer"])
        if a not in pool:
            pool.append(a)
    items, rest = [], []
    for q in unit["comprehension"]:
        a = clean(q["correctAnswer"])
        others = [x for x in pool if x != a]
        if q in fits and len(others) >= 3:
            # rotate rather than sample, so a rebuild is deterministic and two
            # questions in a row never show the same three wrong answers
            start = (len(items) * 3) % len(others)
            wrong = [others[(start + k) % len(others)] for k in range(3)]
            items.append({"q": clean(q["question"]), "a": a, "wrong": wrong, "why": clean(q["explanation"])})
        else:
            rest.append({"q": clean(q["question"]), "a": a, "why": clean(q["explanation"])})
    return items, rest


def lesson_payload(unit, pictures):
    groups = []
    by_id = {d["vocabularyId"]: d for d in unit["dictionaryLinks"]}
    for g in unit["vocabularyGroups"]:
        words = []
        for vid in g["vocabularyIds"]:
            d = by_id[vid]
            words.append({
                "w": d["displayWord"],
                "pos": d["partOfSpeech"],
                "meaning": d["childMeaning"],
                "example": d["exampleSentence"],
                "sentences": ([d["exampleSentence"]] + list(d["practiceSentences"]))[:4],
                "starter": d.get("sentenceStarter", ""),
                "pic": pictures.get(d["masterWord"], "") or pictures.get(d["displayWord"], ""),
            })
        groups.append({"title": g["title"], "words": words})

    mc, rest = comprehension_items(unit)
    return {
        "level": LEVEL,
        "levelLabel": CFG["levelLabel"],
        "unit": unit["unit"]["unitNo"],
        "title": unit["unit"]["unitTitle"],
        "band": unit["unit"]["cefr"]["band"],
        "overview": unit["unit"]["unitOverview"],
        "path": [p for p in (unit["unit"].get("learningPath") or "").split("\n") if p.strip()],
        "outcomes": [{"can": o["cefr"]["descriptor"], "detail": o["learningOutcome"]} for o in unit["outcomes"]],
        "lecture": unit["visual"]["lectureScript"],
        "groups": groups,
        "patterns": [{
            "title": g["title"], "explanation": g["explanation"], "rule": g["ruleAndExamples"],
            "worked": g["workedExample"], "mistake": g.get("commonMistake", ""), "tip": g.get("memoryTip", ""),
            "practice": g.get("practice", ""), "answers": g.get("answerKey", ""),
        } for g in unit["grammar"]],
        "readings": [{
            "type": r["type"], "title": r["title"], "doc": r.get("documentType", ""),
            "passage": r["passageScript"], "speech": r.get("passageScriptSpeech", ""),
        } for r in unit["readings"]],
        "questions": mc,
        "moreQuestions": rest,
        "speaking": [{
            "title": s["title"], "instructions": s["instructionsAndModelLines"],
            "speech": s.get("instructionsAndModelLinesSpeech", ""),
        } for s in unit["speaking"]],
        "writing": [{
            "title": w["title"], "prompt": w["promptAndInstructions"], "model": w.get("modelText", ""),
            "starter": w.get("sentenceStarter", ""), "criteria": w.get("successCriteria", ""),
            "support": w.get("support", ""), "extension": w.get("extension", ""),
        } for w in unit["writing"]],
        "practice": [{
            "title": a["title"], "type": a.get("activityType", ""), "instructions": a["instructionsAndItems"],
            "answers": a.get("answerSummary", ""), "solo": a.get("soloPath", ""),
        } for a in unit["activities"]],
        "quiz": [{
            "q": q["question"], "options": [o.strip() for o in q["options"].split("|")],
            "a": q["correctAnswer"], "why": q["explanation"],
        } for q in unit["quizzes"]],
        "self": [s["statement"] for s in unit["selfAssessment"]],
        "assignment": ({
            "title": unit["assignments"][0]["title"],
            "instructions": unit["assignments"][0]["instructions"],
            "submissionType": unit["assignments"][0]["submissionType"],
            "marks": unit["assignments"][0]["marks"],
            "criteria": [c.strip() for c in unit["assignments"][0].get("criterionIds", "").split(",") if c.strip()],
        } if unit.get("assignments") else None),
    }


# --- the steps --------------------------------------------------------------
# (kind, title said on arrival, renderer call). One idea per screen, in the
# order a learner meets them: what the unit is for, the lesson, the words, the
# patterns, the texts, then producing language, then the check.
def steps_for(data):
    steps = []
    steps.append(("Overview", "What this unit is for.", "unitOverview(%d, '%s')"))
    steps.append(("The lesson", "The lesson. Listen, then read.", "lecture(%d, '%s')"))
    for n, g in enumerate(data["groups"]):
        steps.append((g["title"], g["title"] + ".", "wordWalk(%d, '%s', LESSON.groups[" + str(n) + "])"))
    if sum(len(g["words"]) for g in data["groups"]) >= 4:
        steps.append(("Which word?", "Which word means this?", "wordCheck(%d, '%s', LESSON.groups.flatMap(g => g.words))"))
    for n, p in enumerate(data["patterns"]):
        steps.append((p["title"], p["title"] + ".", "pattern(%d, '%s', LESSON.patterns[" + str(n) + "])"))
    for n, r in enumerate(data["readings"]):
        steps.append((r["title"], r["title"] + ".", "reading(%d, '%s', LESSON.readings[" + str(n) + "])"))
    if data["questions"]:
        steps.append(("Questions", "Questions about the texts.", "questions(%d, '%s', LESSON.questions)"))
    if data["speaking"]:
        steps.append(("Say it out loud", "Say it out loud.", "speaking(%d, '%s', LESSON.speaking)"))
    if data["writing"]:
        steps.append(("Write it", "Write it yourself.", "writing(%d, '%s', LESSON.writing)"))
    if data["practice"]:
        steps.append(("Practice", "Practice, then check yourself.", "practice(%d, '%s', LESSON.practice)"))
    if data["quiz"]:
        steps.append(("Check what you know", "Check what you know.", "quiz(%d, '%s', LESSON.quiz)"))
    return steps


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
      <p class="eyebrow">Ehel Academy &middot; %(levelLabel)s &middot; Unit %(unit)d &middot; CEFR %(band)s</p>
      <h1>%(title)s</h1>
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

  /* SILENT WHILE THE DECK PAINTS. Every renderer draws once, at load, because
     the deck puts all its slides in the DOM at once - so a step that speaks as
     it draws speaks on page load, over every other step doing the same. say()
     and playClip() return early while this is set; it is cleared immediately
     before show(0, false), so only the draw pass is silent. */
  window.__ehelPainting = true;

  /* ==================================================================
     %(title)s - %(levelLabel)s, Unit %(unit)d.

     GENERATED by intensive-english/lesson-kit/build-lessons.py from
     intensive-english/level-%(level)d/data. Do not hand-edit: the next build
     overwrites it, and the fix for anything wrong on this page is either in
     the course content (inputs/ehel-english-intensive-source/authored) or in
     the builder.
     ================================================================== */

  const LESSON = %(data)s;

%(voice)s

%(deck)s

%(intensive)s

%(bootstrap)s
  window.__ehelPainting = false;   /* the draw pass is over: sound is allowed */
  show(0, false);

})();
</script>
"""


def slug(text):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "unit"


def build(unit_no):
    unit = load(os.path.join(DATA, "units", "unit-%d.json" % unit_no))
    words = [d["masterWord"] for d in unit["dictionaryLinks"]] + [d["displayWord"] for d in unit["dictionaryLinks"]]
    data = lesson_payload(unit, word_pictures(words))
    steps = steps_for(data)

    slides, calls = [], []
    for i, (title, say, call) in enumerate(steps):
        sid = "s%d" % i
        slides.append(
            '    <section class="slide" data-say="%s">\n      <div id="%s"></div>\n    </section>\n'
            % (say.replace('"', "&quot;"), sid))
        calls.append("  " + (call % (i, sid)) + ";")
    # The last slide is the summary the lifted deck paints on arrival.
    slides.append('    <section class="slide" data-say="What you can do now.">\n      <div id="summary"></div>\n    </section>\n')

    css = read_lib("lesson.css") + "\n" + read_lib("intensive.css")
    page = PAGE % {
        "title": data["title"],
        "levelLabel": data["levelLabel"],
        "level": LEVEL,
        "unit": data["unit"],
        "band": data["band"],
        "css": css,
        "slides": "".join(slides),
        "data": json.dumps(data, ensure_ascii=False, indent=1),
        "voice": read_lib("voice.js"),
        "deck": read_lib("deck.js"),
        "intensive": read_lib("intensive.js"),
        "bootstrap": "\n".join(calls),
    }
    name = "unit-%02d-%s.html" % (data["unit"], slug(data["title"]))
    with io.open(os.path.join(OUT, name), "w", encoding="utf-8", newline="") as fh:
        fh.write(page)
    return name, len(steps) + 1, data


def main():
    wanted = [u for u in CFG["lessons"] if not ONLY or u["unit"] in ONLY]
    if not wanted:
        sys.exit("REFUSED: no unit %s in %s" % (ONLY, os.path.basename(OUT)))
    written = []
    for entry in wanted:
        name, steps, data = build(entry["unit"])
        if entry.get("file") and entry["file"] != name:
            sys.exit("REFUSED: unit %d builds %s but app.config.json says %s" % (entry["unit"], name, entry["file"]))
        written.append((entry["unit"], name, steps, len(data["groups"]), len(data["patterns"]), len(data["quiz"])))
    for unit, name, steps, groups, patterns, quiz in written:
        print("  unit %-2d %-46s %2d steps · %d word groups · %d patterns · %d quiz items"
              % (unit, name, steps, groups, patterns, quiz))
    print("%d page(s) written to %s" % (len(written), os.path.relpath(OUT, ACADEMY)))


if __name__ == "__main__":
    main()
