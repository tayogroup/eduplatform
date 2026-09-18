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


# --- Letters & Sounds -------------------------------------------------------------
# A literacy lesson is Start, four groups and the summary. Its middle steps are
# LIT_STEPS unless the lesson file lists its own `steps` (the hand-written
# lessons 1, 6 and 12); each step names a renderer and the block it reads.
LIT_GROUPS = ["Start", "Hear it", "See & write it", "Read it", "Check"]
LIT_STEPS = [
    ["Hear it", "Listen to the sounds", "P.hearSounds", "hear.sounds"],
    ["Hear it", "Find the sound", "P.findSound", "hear.find"],
    ["See & write it", "See and write the letters", "P.seeLetters", "seeWrite.letters"],
    ["See & write it", "Copy the words", "P.copyWords", "seeWrite.copy"],
    ["Read it", "Blend the sounds", "P.blend", "read.blend"],
    ["Read it", "Read the words", "P.readWords", "read.words"],
    ["Read it", "Tricky words", "P.tricky", "read.tricky"],
    ["Read it", "Read a short text", "P.reader", "read.reader"],
    ["Check", "Read aloud", "P.readAloud", "check.readAloud"],
    ["Check", "Write what you hear", "P.dictation", "check.dictation"],
]
LIT_CALLS = {"P.note", "P.hearSounds", "P.findSound", "P.countSounds", "P.seeLetters", "P.copyWords",
             "P.blend", "P.readWords", "P.tricky", "P.reader", "P.readAloud", "P.dictation"}
LIT_DAY_PLAN = [
    "Session 1: What this lesson is about, the Unit lecture, then Hear it.",
    "Session 2: See & write it. Write each letter on paper as well as on the screen.",
    "Session 3: Read it, then Check. Read the short text out loud to someone.",
]
LIT_TIME = "This lesson is one day of study, about 2 hours. Take it in three short sessions, with a break between them."
# The Phonics level's recordings, reached from app/letters/ in a local build.
# Deploying the strand re-points this at the CDN's per-level folder.
TTS = os.path.join(ACADEMY, "intensive-english", "media", "audio", "tts")
MEDIA_DEV = "../../../media/audio/tts"


def cyrb53(text, seed=0):
    """The course's clip name: lib/program.js :: cyrb53, over UTF-16 code units
    exactly as String.charCodeAt reads them."""
    m = 0xFFFFFFFF
    h1, h2 = (0xDEADBEEF ^ seed) & m, (0x41C6CE57 ^ seed) & m
    raw = text.encode("utf-16-le")
    for k in range(0, len(raw), 2):
        ch = raw[k] | (raw[k + 1] << 8)
        h1 = ((h1 ^ ch) * 2654435761) & m
        h2 = ((h2 ^ ch) * 1597334677) & m
    h1 = (((h1 ^ (h1 >> 16)) * 2246822507) & m) ^ (((h2 ^ (h2 >> 13)) * 3266489909) & m)
    h2 = (((h2 ^ (h2 >> 16)) * 2246822507) & m) ^ (((h1 ^ (h1 >> 13)) * 3266489909) & m)
    return format(4294967296 * (2097151 & h2) + h1, "x")


def clip_key(text):
    return cyrb53(re.sub(r"\s+", " ", text).strip())


def recorded_clips(d):
    """Keys of every string in the lesson that has a recording on disk. The page
    requests these and nothing else (see program.js :: clipFor)."""
    found = set()

    def walk(v):
        if isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)
        elif isinstance(v, str) and v.strip():
            k = clip_key(v)
            if os.path.isfile(os.path.join(TTS, k + ".mp3")):
                found.add(k)
    walk(d)
    return sorted(found)


# --- narration -----------------------------------------------------------------
# The builder decides what is recorded: it writes one manifest per level
# (kit/narration/<level>.json). The narrator reads it to know what to record and
# in which voice, and tools/lib/ehel-intensive-narration.js reads it so the media
# uploader serves each clip from its level's folder AND the prune tools do not
# delete clips no live level claims. A clip is named by cyrb53 of its displayed
# text, as everywhere in this course; a conversation line is named by its text
# AND its voice (" #alice"), because the same words can be said by either speaker
# and a clip keeps one voice.
PH_SOURCE = re.compile(r"^Ph (\d+)$")


def narration_items(level, les, d):
    items = []

    def add(category, text, delivery="standard", key=None, **extra):
        text = re.sub(r"\s+", " ", str(text or "")).strip()
        if not text:
            return None
        k = key or clip_key(text)
        items.append(dict(key=k, text=text, delivery=delivery, category=category, **{a: b for a, b in extra.items() if b is not None}))
        return k

    def dialogue(rows):
        who, keys = [], []
        for name, text in rows:
            if name not in who:
                who.append(name)
            voice = "standard" if who.index(name) % 2 == 0 else "alice"
            keys.append(add("dialogue", text, voice, key=clip_key(re.sub(r"\s+", " ", text).strip() + " #" + voice)))
        return keys

    if level.get("kind") == "literacy":
        # the LAST Phonics unit: a lesson that spans units 14 and 18 is voiced
        # the way unit 18 is, one way throughout, not sounds then spelled letters
        phs = [int(m.group(1)) for m in (PH_SOURCE.match(s) for s in d.get("sources") or []) if m]
        first_ph = max(phs) if phs else None
        # a lesson's own spoken form needs no sound table: it names no lone sound
        sp = d["about"].get("speech")
        add("about", d["about"]["text"], phonicsUnit=None if sp else first_ph, speech=sp)
        for c in d["unitLecture"]["chapters"]:
            m = PH_SOURCE.match(c.get("source") or "")
            add("lecture", " ".join(lines_of(c["text"])), phonicsUnit=int(m.group(1)) if m else None, speech=c.get("speech"))
        for g, t, call, path in lit_steps(d):
            for it in block_items(at_path(d, path)):
                if call in ("P.reader", "P.note"):
                    add("reading", it.get("text"), phonicsUnit=first_ph)
                elif isinstance(it, str) and len(it) >= MIN_CHARS and call in ("P.readWords", "P.tricky", "P.copyWords", "P.readAloud", "P.dictation"):
                    add("word", it, phonicsUnit=first_ph)
        return items, {}

    add("about", d["about"]["text"])
    for c in d["unitLecture"]["chapters"]:
        add("lecture", " ".join(lines_of(c["text"])))
    li = d["listen"]
    add("warmup", li["warmup"]["prompt"])
    for p in li["phrases"]:
        add("phrase", p["text"])
    for sec in ("listen", "readWrite"):
        for w in d[sec]["words"]["items"]:
            if len(w["w"]) >= MIN_CHARS:
                add("word", w["w"], "alice")
            add("wordSentence", w["example"], "alice")
    for t in li["sound"]["groups"] + li["sound"]["lines"]:
        add("sound", t)
    for t in li["sayIt"]["lines"]:
        add("sayIt", t)
    for r in d["grammar"]["rules"]:
        # the card's lines have no full stops of their own; said as one run they
        # merge ("... they are I'm a nurse"), so the spoken form ends each line
        said = " ".join(l.strip() if re.search(r"[.!?:]$", l.strip()) else l.strip() + "." for l in r["rule"])
        add("rule", r["title"] + ". " + " ".join(r["rule"]), speech=r["title"] + ". " + said)
    for t in d["task"]["prepare"]["phrases"]:
        add("phrase", t)
    keys = {"conversation": dialogue(li["conversation"]["lines"]), "model": dialogue(d["task"]["model"]["lines"])}
    return items, keys


def lines_of(text):
    return [l for l in str(text or "").split("\n") if l.strip()]


def write_manifest(level, per_lesson):
    """kit/narration/<level>.json: every clip the level's pages can play, once."""
    seen, items = set(), []
    for label, its in per_lesson:
        for it in its:
            if it["key"] in seen:
                continue
            seen.add(it["key"])
            items.append(dict(it, lesson=label))
    doc = {
        "_about": "Written by build_program.py: every recorded clip the %s pages can play. Read by the narrator "
                  "(tools/generate-ehel-intensive-programme-audio.js) and by tools/lib/ehel-intensive-narration.js "
                  "(media folder g%02d; keeps the prune tools off these clips). Do not hand-edit." % (level["name"], COURSE_NUMBER[level["id"]]),
        "level": level["id"], "courseKey": course_key(level["id"]), "mediaGrade": COURSE_NUMBER[level["id"]],
        "items": items,
    }
    os.makedirs(NARRATION, exist_ok=True)
    with io.open(os.path.join(NARRATION, level["id"] + ".json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    return len(items)


def on_disk(keys):
    return sorted(k for k in set(keys) if os.path.isfile(os.path.join(TTS, k + ".mp3")))


def at_path(d, path):
    v = d
    for k in path.split("."):
        v = v.get(k) if isinstance(v, dict) else None
    return v


def block_items(v):
    if v is None:
        return []
    if isinstance(v, list):
        return v
    return v.get("items") or ([v] if v.get("text") else [])


def lit_steps(d):
    """The lesson's middle steps. A default step whose block is empty is left
    out (a lesson with no tricky words has no Tricky words step); a step the
    lesson lists itself must have something to show, and the check says so."""
    own = d.get("steps")
    rows = own if own else LIT_STEPS
    out = []
    for g, t, call, path in rows:
        items = block_items(at_path(d, path))
        if not items and not own:
            continue
        if call == "P.reader" and (at_path(d, path) or {}).get("title"):
            t = "Read: " + at_path(d, path)["title"]
        out.append([g, t, call, path])
    return out


def check_literacy(level, les, d):
    e = []
    need = lambda cond, msg: None if cond else e.append(msg)
    need(d.get("schema") == "ehel-intensive-literacy/1", "schema must be ehel-intensive-literacy/1")
    need(d.get("level") == level["id"] and d.get("lesson") == les["number"], "level/lesson do not match the file's place in the plan")
    need(d.get("title") == les["title"], "title %r differs from the plan's %r" % (d.get("title"), les["title"]))
    a = d.get("about") or {}
    need(a.get("text") and 2 <= len(a.get("goals") or []) <= 6, "about: text and 2-6 goals")
    ch = (d.get("unitLecture") or {}).get("chapters") or []
    need(ch and all(c.get("title") and c.get("text") for c in ch), "unitLecture: at least one chapter, each with a title and text")
    need(3 <= len(d.get("canDo") or []) <= 6, "canDo: 3-6")
    steps = lit_steps(d)
    for g in LIT_GROUPS[1:]:
        need(any(s[0] == g for s in steps), "no step in %s" % g)
    for g, t, call, path in steps:
        where = "step %r (%s)" % (t, path)
        need(g in LIT_GROUPS[1:], "%s: unknown group %r" % (where, g))
        need(call in LIT_CALLS, "%s: unknown renderer %r" % (where, call))
        items = block_items(at_path(d, path))
        need(items, "%s: nothing to show" % where)
        for it in items:
            if call == "P.hearSounds":
                need(isinstance(it, dict) and it.get("g") and it.get("spoken"), "%s: a sound needs g and spoken" % where)
            elif call == "P.findSound":
                ok = isinstance(it, dict) and it.get("spoken") and it.get("a") and len(it.get("wrong") or []) >= 2 and it.get("a") not in it.get("wrong")
                need(ok, "%s: a question needs spoken, a, and 2 wrong options that differ from a" % where)
            elif call == "P.countSounds":
                need(isinstance(it, dict) and it.get("word") and it.get("n") in (1, 2, 3, 4, 5) and it.get("spoken"), "%s: an item needs word, n (1-5) and spoken" % where)
            elif call == "P.blend":
                need(isinstance(it, dict) and it.get("parts") and it.get("word") and it.get("spoken"), "%s: a blend needs parts, word and spoken" % where)
            elif call in ("P.reader", "P.note"):
                need(isinstance(it, dict) and it.get("text"), "%s: needs text" % where)
            elif call == "P.seeLetters":
                need(isinstance(it, str) or (isinstance(it, dict) and it.get("g")), "%s: a letter is a string or {g, spoken}" % where)
            else:
                need(isinstance(it, str) or (isinstance(it, dict) and it.get("w")), "%s: a word is a string or {w, spoken}" % where)
    return e


# --- the platform ---------------------------------------------------------------
# Each level is its own Moodle course. Moodle launches only keys shaped
# ehel-<slug>-lNN (progress_gatewaylib.php), so the programme takes an unused
# block of two-digit numbers rather than a new key shape, which would need the
# PHP changed and deployed first. The same number names the level's media
# folder, media/intensive-english/gNN, which the uploader already understands.
# The live course keeps l00-l03 (and lph); nothing here touches them.
COURSE_NUMBER = {"letters": 10, "starter": 11, "level-1": 12, "level-2": 13, "level-3": 14, "level-4": 15}  # level-5: 16, when built
BRIDGE_UNIT = {"A": 13, "B": 14}      # after Letters & Sounds' twelve lessons
REMOTE = "Ehel Primary/app/intensive-english/programme/%s"
MEDIA_PROD = "../../../../media/intensive-english/g%02d/audio/tts"   # from app/intensive-english/programme/<level>/
MIN_CHARS = 8         # tools/lib/ehel-narration-hash.js: a shorter word is spoken by the runtime voice
NARRATION = os.path.join(HERE, "narration")


def course_key(level_id):
    return "ehel-intensive-eng-l%02d" % COURSE_NUMBER[level_id]


def unit_number(les):
    return BRIDGE_UNIT[les["number"]] if isinstance(les["number"], str) else les["number"]


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
    if isinstance(les["number"], str):            # a Bridge lesson: A, B
        return "%s.html" % slug(les["title"])       # the title starts "Bridge A"
    return "lesson-%02d-%s.html" % (les["number"], slug(les["title"]))


def lesson_label(les):
    return "Lesson %d" % les["number"] if isinstance(les["number"], int) else les["title"].split(" · ")[0]


def authored_path(level_id, n):
    if isinstance(n, str):
        return os.path.join(LESSONS, level_id, "bridge-%s.json" % n.lower())
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
    try:
        earlier_lessons(level, les, d)
    except ValueError as x:
        e.append(str(x))
    for item in (g.get("practice") or []) + q:
        need(item.get("a") in (item.get("options") or []), "item %r: the answer must be one of its options" % item.get("q"))
    for item in (conv.get("questions") or []) + (rw.get("gist") or []) + (rw.get("detail") or []):
        need(item.get("a") and len(item.get("wrong") or []) >= 2, "question %r: an answer and 2 wrong options" % item.get("q"))
    return e


def earlier_lessons(level, les, d):
    """review.earlierLessons holds bare numbers. In a level's Lesson 1 they are the
    PREVIOUS level's lessons (the brief: "revise the previous level's last
    lessons"); anywhere else they are earlier lessons of this level. Resolved here,
    once, so nothing downstream has to guess which level a number meant."""
    nums = (d.get("review") or {}).get("earlierLessons") or []
    k = ORDER.index(level["id"])
    if les["number"] == 1:
        prev = LEVELS[ORDER[k - 1]] if k > 0 and LEVELS[ORDER[k - 1]].get("kind") == "unit" else None
        if nums and not prev:
            raise ValueError("review.earlierLessons: the first lesson of the first level has no earlier lessons")
        where, allowed = prev, {x["number"] for _, _, x in plan_lessons(prev)} if prev else set()
    else:
        where, allowed = level, set(range(1, les["number"]))
    bad = [n for n in nums if n not in allowed]
    if bad:
        raise ValueError("review.earlierLessons %s: not earlier lessons of %s" % (bad, where["name"] if where else "any level"))
    titles = {x["number"]: x["title"] for _, _, x in plan_lessons(where)} if where else {}
    return [{"level": where["id"], "levelName": where["name"], "lesson": n, "title": titles[n]} for n in nums]


# --- pictures -------------------------------------------------------------------
PICTURE_FIX = load(os.path.join(HERE, "pictures.json")) if os.path.isfile(os.path.join(HERE, "pictures.json")) else {}


def picture_overrides(level_id):
    """This program's own corrections to the shared picture map (pictures.json)."""
    return PICTURE_FIX.get(level_id, {})


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
      <div class="top-actions"></div>
      <button type="button" class="pg-btn" id="menu-toggle" aria-controls="menu" aria-expanded="false">&#9776; Menu</button>
      <button type="button" class="pg-btn" id="toolbox-toggle" aria-haspopup="dialog">Toolbox</button>
    </div>
  </div>
  <header class="pg-head">
    <p class="eyebrow">Ehel Academy &middot; %(levelName)s &middot; %(label)s &middot; %(cefr)s</p>
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
      <div class="wrap pg-notices"></div>
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
     %(title)s - %(levelName)s, %(label)s.

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
  /* ?step=N (the level page's Continue link) or #step-N. A launched page's
     links carry ?pwsToken&pwsEndpoint, and the carry script appends them after
     everything in an href, so a #fragment there would swallow them. */
  const want = new URLSearchParams(location.search).get("step") || (/^#step-(\\d+)$/.exec(location.hash) || [])[1];
  show(want ? Math.min(Math.max(Number(want) - 1, 0), slides.length - 1) : 0, false);
})();
</script>
"""


def build_lesson(level, pi, part, les, d, nxt):
    key = level["pictureKey"]
    items = d["listen"]["words"]["items"] + d["readWrite"]["words"]["items"]
    pics = pictures([w["w"] for w in items], key)
    fix = picture_overrides(level["id"])
    for w in items:
        w["pic"] = fix[w["w"]] if w["w"] in fix else pics.get(w["w"], "")
    G, S = steps_for(d, level)
    names = {s["key"]: s["name"] for s in PLAN["sections"]}
    days = level["schedule"]["daysPerLesson"]
    data = dict(d)
    data.update({
        "file": lesson_file(les), "label": lesson_label(les), "hub": "index.html", "levelShort": level["tab"].split(" · ")[0],
        "levelName": level["name"], "days": str(days), "dayPlan": DAY_PLANS[days],
        "sectionNames": names, "next": nxt,
        "readerSpec": level["reader"][0].upper() + level["reader"][1:] + ", linked to “" + d["title"] + "”",
        "teacher": (d.get("teacher") or {}).get("liveClass"),
        "earlier": earlier_lessons(level, les, d),
    })
    narr, keys = narration_items(level, les, d)
    data["listen"] = dict(d["listen"], conversation=dict(d["listen"]["conversation"], clipKeys=keys["conversation"]))
    data["task"] = dict(d["task"], model=dict(d["task"]["model"], clipKeys=keys["model"]))
    data.update(platform_fields(level, les, [it["key"] for it in narr]))
    page = write_page(level, les, d, G, S, data)
    page["narration"] = narr
    return page


def build_literacy(level, pi, part, les, d, nxt, chart):
    G = [{"key": "g%d" % k, "name": name} for k, name in enumerate(LIT_GROUPS)]
    S = [{"g": 0, "t": "What this lesson is about", "call": "P.about"}, {"g": 0, "t": "Unit lecture", "call": "P.lecture"}]
    for g, t, call, path in lit_steps(d):
        S.append({"g": LIT_GROUPS.index(g), "t": t, "call": call + ":" + path})
    S.append({"g": len(LIT_GROUPS) - 1, "t": "What I can do now", "call": None})   # the deck's last slide: paintStickers()
    data = dict(d)
    data.update({
        "kind": "literacy", "file": lesson_file(les), "label": lesson_label(les), "hub": "index.html", "levelShort": level["tab"],
        "levelName": level["name"], "days": "1", "timeNote": LIT_TIME, "dayPlan": LIT_DAY_PLAN, "next": nxt,
        # a bridge is for readers of another language: it shows the whole chart
        "chart": [c for c in chart if not isinstance(les["number"], int) or c["lesson"] <= les["number"]],
    })
    narr, _ = narration_items(level, les, d)
    # + any string the Phonics level already recorded (its short readers)
    data.update(platform_fields(level, les, [it["key"] for it in narr] + recorded_clips(d)))
    page = write_page(level, les, d, G, S, data)
    page["narration"] = narr
    return page


def platform_fields(level, les, keys):
    return {
        "courseKey": course_key(level["id"]), "unit": unit_number(les),
        "mediaDev": MEDIA_DEV, "mediaProd": MEDIA_PROD % COURSE_NUMBER[level["id"]],
        # only clips that EXIST are ever requested (see program.js :: clipFor)
        "clips": on_disk(keys),
    }


def write_page(level, les, d, G, S, data):
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
        "title": d["title"], "levelShort": data["levelShort"], "levelName": level["name"], "label": lesson_label(les), "cefr": d.get("cefr") or level["cefr"],
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
    return {"n": les["number"], "file": lesson_file(les), "groups": groups_idx, "label": lesson_label(les),
            "unit": unit_number(les), "title": d["title"]}


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
  /* Launched from Moodle, each level is its own course: the launch token names
     THIS course, so a page of another level would report into the wrong one
     (the gateway refuses it). The level tabs and the course home are for
     browsing the build, and only then. style.display, not the hidden
     attribute: .hub-tabs sets display, and a display rule beats [hidden]. */
  if (new URLSearchParams(location.search).get("pwsToken")) {
    document.querySelectorAll(".hub-tabs, .pg-top .back").forEach((e) => { e.style.display = "none"; });
  }
  const get = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { return null; } };
  const last = HUB.level ? get("iep:" + HUB.level + ":last") : null;
  const c = document.getElementById("continue");
  if (c && last && last.file) {
    c.hidden = false;
    // ?step, not #step: the carry script appends the launch parameters after
    // everything in an href, and a fragment would swallow them
    c.href = last.file + "?step=" + (Number(last.step) + 1);
    c.innerHTML = "<small>Continue</small><b>" + String(last.label || "Lesson " + last.lesson).replace(/</g, "&lt;") + " · " + String(last.title).replace(/</g, "&lt;") + "</b><br>" + String(last.stepTitle || "").replace(/</g, "&lt;");
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


# The shared lesson-app pipeline (../../../mathematics/lesson-app-tools, README
# order), the steps that apply to these pages. A build rewrites every page from
# scratch, so it rewires every time: a page built and not wired would lose its
# launch parameters, progress, class controls and Wehel, silently. Not run:
# add-header-bars and add-lesson-search (they need the lesson kit's .wrap
# layout; these pages have their own header and menu), the four Maths content
# tools, wire-accessibility and wire-quiet-notice (they refuse on the live
# Intensive pages too), self-host-fonts (skipped there too), and add-page-
# doctype-lang (the page already has both).
PIPELINE = os.path.join(ACADEMY, "mathematics", "lesson-app-tools")
WIRING = ["wire-navigation", "wire-platform-controls", "preload-platform", "wire-progress"]


def wire(level_id):
    folder = os.path.join(OUT, level_id)
    for tool in WIRING:
        r = subprocess.run([sys.executable, os.path.join(PIPELINE, tool + ".py"), "--app", folder],
                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=dict(os.environ, PYTHONIOENCODING="utf-8"))
        out = r.stdout.decode("utf-8", "replace")
        if r.returncode != 0:
            sys.exit("  %s: %s FAILED\n%s" % (level_id, tool, out))
    return len(WIRING)


def write_app_config(level, built):
    """The level folder described for the shared lesson-app pipeline
    (../../mathematics/lesson-app-tools): wiring, progress and deploy read it."""
    cfg = {
        "_comment": "Written by program/kit/build_program.py; do not hand-edit. The %s of the restructured Intensive English "
                    "programme, as Moodle course %s. Units are the lesson numbers (the Letters & Sounds bridges are u13 and "
                    "u14). grade is the programme's level number, which Wehel reads as the learner's level." % (level["name"], course_key(level["id"])),
        "level": level["number"], "grade": level["number"], "gradeLabel": level["tab"].split(" · ")[0],
        "subject": "intensive-english", "subjectLabel": "Intensive English", "brandLine": "Intensive English",
        "courseKey": course_key(level["id"]), "progressUnitPrefix": "u",
        "fromParam": "iep-" + level["id"], "backLabel": level["name"], "hub": "index.html",
        "headerBars": False, "stickers": False,
        "remote": REMOTE % level["id"],
        "lessons": [{"unit": b["unit"], "file": b["file"], "title": b["title"]} for b in sorted(built, key=lambda b: b["unit"])],
    }
    with io.open(os.path.join(OUT, level["id"], "app.config.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(cfg, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def build_hub(level, built):
    sched = level["schedule"]
    weeks = sched["weeks"]
    facts = ["%s" % level["cefr"], "%d lessons" % sum(len(p["lessons"]) for p in level["parts"])]
    if isinstance(weeks, list):
        facts.append("weeks %d–%d of the programme" % tuple(weeks))
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
    if level.get("bridge"):
        body.append('<section class="part"><h2>Bridge lessons</h2><p class="hub-note" style="margin-top:0">For learners who already read another language in these letters. They can take these two instead of the twelve lessons.</p><div class="lessons">')
        for k, br in zip("AB", level["bridge"]):
            b = by_n.get(k)
            inner = '<span class="n">%s</span><span><b>%s</b><span class="cd">%s</span>%s</span>' % (
                k, esc(br["title"].split(" · ", 1)[-1]), esc(br["text"]),
                ('<span class="pips" data-pips="%s"></span>' % k) if b else '<span class="soon">In preparation</span>')
            body.append(('<a class="lcard built" href="%s">%s</a>' % (b["file"], inner)) if b else '<div class="lcard">%s</div>' % inner)
        body.append("</div></section>")
    body.append('<section class="hub-tools"><h2 class="eyebrow">Level tools</h2><ul>%s</ul></section>' % "".join("<li>%s</li>" % esc(t) for t in level["tools"]))
    if level.get("note"):
        body.append('<p class="hub-note">%s</p>' % esc(level["note"]))
    body.append('<p class="hub-note">%s</p>' % esc(level["ends"]))
    css = read(os.path.join(OLDLIB, "lesson.css")) + "\n" + read(os.path.join(OLDLIB, "intensive.css")) + "\n" + read(os.path.join(LIB, "program.css"))
    html = HUB % {"title": esc(level["name"]), "css": css, "top": '<div class="pg-top"><a class="back" href="../index.html">&#9664; Intensive English</a></div>', "tabs": tabs_html(level["id"], "../"),
                  "body": "\n".join(body), "hub": json.dumps({"level": level["id"], "lessons": [{k: b[k] for k in ("n", "file", "groups")} for b in built]})}
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


def sound_chart(work):
    """Every Letters & Sounds lesson's sound tiles, in order: each page shows
    the ones up to and including its own."""
    chart = []
    for level, pi, part, les, d, nxt in work:
        if level.get("kind") != "literacy" or not isinstance(les["number"], int):
            continue
        tiles = [t for t in block_items(at_path(d, "hear.sounds")) if isinstance(t, dict) and t.get("g") and t.get("spoken")]
        if tiles and not d.get("chartSkip"):
            chart.append({"lesson": les["number"], "title": les["title"], "sounds": [{"g": t["g"], "spoken": t["spoken"]} for t in tiles]})
    return chart


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
            errs = (check_literacy if level.get("kind") == "literacy" else check_lesson)(level, les, d)
            problems += ["%s lesson %d: %s" % (lid, les["number"], x) for x in errs]
            if k + 1 < len(flat):
                n2 = flat[k + 1][2]
                nxt = ("the %s, then " % part["check"] if flat[k + 1][0] != pi else "") + "Lesson %d · %s" % (n2["number"], n2["title"])
            else:
                nxt = "the %s" % part["check"]
            work.append((level, pi, part, les, d, nxt))
        # the Bridge lessons (Letters & Sounds): outside the numbered path
        for k, br in zip("AB", level.get("bridge") or []):
            path = authored_path(lid, k)
            if not os.path.isfile(path):
                continue
            d = load(path)
            les = {"number": k, "title": br["title"], "cando": d.get("cando") or ""}
            problems += ["%s bridge %s: %s" % (lid, k, x) for x in check_literacy(level, les, d)]
            work.append((level, None, None, les, d, "back to the level page"))
    print("checked %d authored lesson(s)" % len(work))
    if problems:
        print("\n".join("  FAIL " + p for p in problems))
        sys.exit(1)
    if CHECK_ONLY:
        print("  all checks passed")
        return
    built = {}
    chart = sound_chart(work)
    for level, pi, part, les, d, nxt in work:
        if level.get("kind") == "literacy":
            page = build_literacy(level, pi, part, les, d, nxt, chart)
        else:
            page = build_lesson(level, pi, part, les, d, nxt)
        built.setdefault(level["id"], []).append(page)
        print("  built %s · %s · %s" % (level["id"], lesson_label(les), lesson_file(les)))
    for lid in ORDER:
        build_hub(LEVELS[lid], built.get(lid, []))
        if built.get(lid):
            n = write_manifest(LEVELS[lid], [(b["label"], b["narration"]) for b in built[lid]])
            write_app_config(LEVELS[lid], built[lid])
            wired = 0 if "--no-wire" in sys.argv[1:] else wire(lid)
            print("  %s: narration manifest %d clips, app.config.json -> %s, %s" % (
                lid, n, course_key(lid), "wired (%d tools)" % wired if wired else "NOT wired (--no-wire)"))
    # numbered lessons only: the Letters & Sounds bridges are extra, not "of 12"
    build_home({k: sum(1 for b in v if isinstance(b["n"], int)) for k, v in built.items()})
    print("wrote %s" % os.path.relpath(OUT, ACADEMY))


if __name__ == "__main__":
    main()
