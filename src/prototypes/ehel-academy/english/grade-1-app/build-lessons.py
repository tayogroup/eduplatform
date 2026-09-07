# -*- coding: utf-8 -*-
"""Build the Grade 1 English standalone lesson pages from the course's own data.

WHAT THIS IS. A second presentation of English Grade 1 in the design of the
Grade 1 Mathematics standalone build (mathematics/grade-1-app/g1v2): one
self-contained HTML page per unit, carrying its own CSS, its own activity JS
and its own copy of the voice engine, bypassing shell/course-app.js entirely.

WHAT IT IS NOT. It is not a fork of the content. Every word, every recording,
every answer key on these pages is read out of
english/grade-1/data/ at BUILD time and inlined. Nothing under
english/grade-1/ is written, and nothing in shell/subjects/english.js is
touched - the course a learner uses today is unchanged and unaware of this.

WHY THE CONTENT IS INLINED rather than fetched. The pages ship to
app/english/grade-1-v2/ and the course content ships to content/english/g01/;
a runtime fetch would tie a page in one tier to a file in another, which is
exactly the coupling every other standalone lesson avoids. Rebuild after a
content change; check-lessons.py cannot see staleness and does not claim to.

    python build-lessons.py            # every unit named in app.config.json
    python build-lessons.py 1          # just unit 1

Run the shared pipeline afterwards, in this order (see
mathematics/lesson-app-tools/README.md - each step assumes the last):

    python ../../mathematics/lesson-app-tools/wire-navigation.py --app .
    python ../../mathematics/lesson-app-tools/wire-platform-controls.py --app .
    python ../../mathematics/lesson-app-tools/preload-platform.py --app .
    python ../../mathematics/lesson-app-tools/wire-progress.py --app .
    python ../../mathematics/lesson-app-tools/add-header-bars.py --app .
    python ../../mathematics/lesson-app-tools/check-lessons.py --app .

This tool writes the page from scratch every time, so it must run BEFORE any
of them; running it again over a wired page throws the wiring away and the
pipeline has to be re-run. That is deliberate - a generator that tried to
preserve another tool's edits would be a patcher, and this repo has a record
of what patchers derived from other patchers cost.
"""
import io
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(ACADEMY, "english", "grade-1", "data")
SHELL = os.path.join(ACADEMY, "shell", "subjects")
LIB = os.path.join(HERE, "lib")


# ----------------------------------------------------------------------
# reading the course
# ----------------------------------------------------------------------
def load_json(path):
    return json.load(io.open(path, encoding="utf-8"))


def audio_release():
    """The ?a= stamp, read out of the shell rather than written down here.

    English names its clips for their CONTENT, so a re-recorded clip keeps its
    filename and its URL, and Bunny serves media max-age=31536000 with no
    ETag. The stamp is the only thing that reaches a child who already heard
    the broken one. A second copy of it here would go stale the first time
    english.js bumped, and nothing would say so.
    """
    s = io.open(os.path.join(SHELL, "english.js"), encoding="utf-8").read()
    m = re.search(r'^const AUDIO_RELEASE = "([^"]+)";', s, re.M)
    if not m:
        sys.exit("REFUSED: could not read AUDIO_RELEASE out of shell/subjects/english.js.\n"
                 "  It has moved or been renamed. Do not hardcode a value here - find it.")
    return m.group(1)


def word_pictures(words):
    """word -> emoji, from the shell's own map, via the shell's own function.

    Parsed by NODE rather than by a regex over the source. A regex was tried
    and quietly mis-read one entry, which is the whole failure mode this repo
    keeps recording: a true fact about the wrong property. wordPicture() also
    applies the per-grade overrides, which a regex over WORD_PICTURES cannot
    see at all.
    """
    src = os.path.join(SHELL, "word-pictures.js").replace("\\", "/")
    script = (
        'import { wordPicture } from "file:///%s";\n'
        'const ws = JSON.parse(process.argv[1]);\n'
        'const out = {};\n'
        'for (const w of ws) { const p = wordPicture(w, 1); if (p) out[w] = p; }\n'
        'process.stdout.write(JSON.stringify(out));\n' % src
    )
    r = subprocess.run(
        ["node", "--input-type=module", "-e", script, "--", json.dumps(sorted(set(words)))],
        capture_output=True)
    if r.returncode != 0:
        sys.exit("REFUSED: could not read the word pictures through node.\n" +
                 r.stderr.decode("utf-8", "replace"))
    return json.loads(r.stdout.decode("utf-8"))


def dictionary_index():
    d = load_json(os.path.join(DATA, "master-dictionary.grade1.json"))
    by_word = {}
    for e in d["entries"]:
        key = str(e.get("displayWord") or e.get("lemma") or "").strip().lower()
        if key and key not in by_word:
            by_word[key] = e
    return by_word


# How many example sentences a word card offers. Mirrors shell/subjects/
# english.js's own SENTENCES_SHOWN=3 for a course learner (5 for tutoring,
# which this build does not serve) - see the comment at english.js line
# ~536. THE FIRST N, never a sample: sentenceAudio pairs with
# practiceSentences BY INDEX, so slicing from the front keeps clip i under
# sentence i. Taking any other subset would play the wrong recording.
SENTENCES_SHOWN = 3

# The order a learner walks a unit. Owner, 2026-09-08, matching the shell
# course's own Grades 1-4 arrangement: the picture books LEAD the reading,
# their questions come straight after them, and the unit's own text sits near
# the end — english.js's BOOKS_LEAD_THE_READING, decided 2026-08-31.
#
# Two names carry the weight of that swap and are deliberately not "Reading"
# both: step 6 is "Reading books" (the shelf) and step 13 is "The unit story"
# (the unit's own text). Calling them both Reading, nine steps apart, is a
# navigation trap for a six-year-old.
#
# A step named here that a unit cannot build is skipped; a step BUILT that is
# not named here aborts the build rather than vanishing quietly.
STEP_ORDER = [
    "lecture",        # the unit's video lesson (units 1-9; Unit 10 has none)
    "sounds",
    "newwords",
    "match",
    "sight",
    "books",          # "Reading books" — the shelf, moved up from last
    "bookquestions",  # the shelf's own questions, already authored
    "sayit",
    "rules",
    "write",
    "talk",           # "Let us talk" — situational dialogue choice
    "games",          # the whole game pack, one step
    "story",          # "The unit story" — moved down from second
    "questions",
    "fluency",
    "check",
]


# Fluency Practice and Let us talk are built from items this course did NOT
# put through curriculum review - the fluency array is stamped
# reviewStatus "Needs curriculum review" in the unit JSON, and the talk
# rounds are assembled here from the unit's own grammar titles. Nine other
# steps on this page ARE reviewed content. A page that shows all sixteen
# the same way claims a review of two that has not happened, so those two
# say so on their face, the way the shell course's section badge does.
REVIEW_NOTE = ("Practice, not marked work - a teacher has not checked these "
               "questions yet.")


def ebook_catalog():
    """The picture-book catalogue, read out of the shell rather than a copy.

    `const ebookCatalog = [...]` in shell/subjects/english.js is a plain
    module-scoped array of object/array/string literals - no function calls,
    no DOM, no imports - but it is not exported and the file around it is
    full of top-level `location`/`document` references, so it cannot be
    ES-module-imported the way word_pictures() imports word-pictures.js.
    Extracted by finding the declaration and BALANCING BRACKETS to its
    matching close, then evaluating that slice alone through node - the
    same "parse the real bytes, not a regex over them" rule word_pictures()
    already follows, applied to a shape a straight import cannot reach.
    """
    src_path = os.path.join(SHELL, "english.js").replace("\\", "/")
    script = (
        'const fs = require("fs");\n'
        'const src = fs.readFileSync("%s", "utf8");\n'
        'const marker = "const ebookCatalog = [";\n'
        'const start = src.indexOf(marker);\n'
        'if (start < 0) throw new Error("ebookCatalog not found");\n'
        'let i = start + marker.length - 1, depth = 0, end = -1;\n'
        'for (; i < src.length; i++) {\n'
        '  const c = src[i];\n'
        '  if (c === "[") depth++;\n'
        '  else if (c === "]") { depth--; if (depth === 0) { end = i; break; } }\n'
        '}\n'
        'if (end < 0) throw new Error("no matching bracket for ebookCatalog");\n'
        'const arr = new Function("return " + src.slice(start + marker.length - 1, end + 1))();\n'
        'process.stdout.write(JSON.stringify(arr));\n' % src_path
    )
    r = subprocess.run(["node", "-e", script], capture_output=True)
    if r.returncode != 0:
        sys.exit("REFUSED: could not extract ebookCatalog from shell/subjects/english.js.\n" +
                 r.stderr.decode("utf-8", "replace"))
    return json.loads(r.stdout.decode("utf-8"))


def book_comprehension_sets():
    """BOOK_COMPREHENSION_SETS out of the shell, by the same bracket-balance
    read ebook_catalog() uses and for the same reason - it is a non-exported
    const in a file too DOM-dependent to import.

    18 questions per unit for Grade 1, in three kinds: `choice` (text
    options), `picture` (tap the right book PAGE out of three) and `order`
    (put events in sequence). All three are already authored; none of it is
    written here.
    """
    src_path = os.path.join(SHELL, "english.js").replace("\\", "/")
    script = (
        'const fs = require("fs");\n'
        'const src = fs.readFileSync("%s", "utf8");\n'
        'const marker = "const BOOK_COMPREHENSION_SETS = [";\n'
        'const start = src.indexOf(marker);\n'
        'if (start < 0) throw new Error("BOOK_COMPREHENSION_SETS not found");\n'
        'let i = start + marker.length - 1, depth = 0, end = -1;\n'
        'for (; i < src.length; i++) {\n'
        '  const c = src[i];\n'
        '  if (c === "[") depth++;\n'
        '  else if (c === "]") { depth--; if (depth === 0) { end = i; break; } }\n'
        '}\n'
        'if (end < 0) throw new Error("no matching bracket");\n'
        'const arr = new Function("return " + src.slice(start + marker.length - 1, end + 1))();\n'
        'process.stdout.write(JSON.stringify(arr));\n' % src_path
    )
    r = subprocess.run(["node", "-e", script], capture_output=True)
    if r.returncode != 0:
        sys.exit("REFUSED: could not extract BOOK_COMPREHENSION_SETS.\n" +
                 r.stderr.decode("utf-8", "replace"))
    return json.loads(r.stdout.decode("utf-8"))


def lecture_media():
    """Per-unit video lesson, from the course's own lecture-media.json.

    Keys are the literal unit-N folder names, so "0" is the WITHDRAWN Unit 0
    and units 1-9 are keys 1-9. There is no key 10: Unit 10 has no video (its
    first step launches the capstone instead), which is why the lecture step
    below is built only where a video actually exists rather than assuming
    ten of them.

    Paths are "./media/unit-N/...", relative to the course root - which sits
    beside this build both on disk and on the CDN, so ../grade-1/media/...
    reaches it in dev and in production alike, exactly as ../ebooks/ does.
    """
    path = os.path.join(DATA, "lecture-media.json")
    if not os.path.isfile(path):
        return {}
    return load_json(path).get("units") or {}


def lecture_asset(rel):
    return "../grade-1/" + str(rel).replace("./", "", 1) if rel else ""


def load_games_meta(unit_no):
    path = os.path.join(DATA, "games", "unit-%d.json" % unit_no)
    if not os.path.isfile(path):
        return {}
    d = load_json(path)
    return {"masteryScore": d.get("masteryScore"), "title": d.get("title")}


def talk_items(unit):
    """"Let us talk" - one situational round per grammar concept.

    Distinct from Fluency on purpose, though both read the same grammar
    array. Fluency asks a FORM question: "which sentence uses the pattern
    'I can ___.'" - pattern recognition. This asks an INTENT question:
    "your friend wants you to say what you can do - what do you say?" A
    child can answer the first by matching shapes and the second only by
    knowing what the sentence is FOR.

    The situation comes from the grammar item's own `title`, which is
    already written as an instruction ("Introduce yourself by name", "Say
    how old you are"), so the unit's words carry the round and only the
    framing sentence around them is new. Distractors are other patterns'
    real example sentences from the same unit - every option is correct
    English, and only one answers what was asked.
    """
    grammar = unit.get("grammar") or []
    per_item = [practice_examples(g) for g in grammar]
    n = len(grammar)
    rounds = []
    for i, g in enumerate(grammar):
        mine = per_item[i]
        title = (g.get("title") or "").strip().rstrip(".")
        if not mine or not title:
            continue
        answer = mine[0]
        distractors = []
        for step in range(1, n):
            other = (i + step) % n
            ex = per_item[other]
            if not ex:
                continue
            pick = ex[(i + step) % len(ex)]
            if pick not in distractors and pick != answer:
                distractors.append(pick)
            if len(distractors) >= 2:
                break
        if len(distractors) < 2:
            continue
        # answer position rotates, for the reason the fluency author records:
        # a renderer that does not shuffle plus an answer always first is a
        # section a child passes by tapping the same spot.
        opts = list(distractors)
        opts.insert(i % (len(distractors) + 1), answer)
        first = title[0].lower() + title[1:]
        rounds.append({
            "ask": "Your friend wants you to %s. What do you say?" % first,
            "opts": [{"t": o, "ok": 1 if o == answer else 0} for o in opts],
            "why": g.get("explanation") or ("You would say: %s" % answer),
        })
    return rounds


def practice_examples(grammar_item):
    """The real example sentences inside a grammar item's `practice` line.

    Same parse the fluency author uses (tools/author-ehel-english-g1-fluency.py):
    "<instruction>: <ex1>. <ex2>. <ex3>." across all 10 units.
    """
    text = grammar_item.get("practice") or ""
    if ":" not in text:
        return []
    tail = text.split(":", 1)[1].strip()
    out = []
    for p in [x.strip() for x in re.split(r"(?<=[.!?])\s+", tail) if x.strip()]:
        if not re.search(r"[A-Za-z]", p):
            continue
        out.append(p if p.endswith((".", "!", "?")) else p + ".")
    return out


def load_games(unit_no):
    path = os.path.join(DATA, "games", "unit-%d.json" % unit_no)
    if not os.path.isfile(path):
        return {}
    return {g["id"]: g for g in load_json(path)["games"]}


def unit_dictionary_links(unit):
    """word (lowercase) -> its dictionaryLinks entry, Core words group only.

    A unit's dictionaryLinks carries two groups - "Core words" (the taught
    40) and "Words from our stories" (background vocabulary the unit reads
    but does not teach) - found by TITLE rather than a hardcoded id, because
    the id itself is per-unit ("g1-u1-core", "g1-u2-core", ...). Restricting
    to the taught group is what the shell's own linkedWords()/wordsFor() do.
    """
    core_group_ids = {g["id"] for g in unit.get("vocabularyGroups", [])
                       if g.get("title") == "Core words"}
    by_word = {}
    for link in unit.get("dictionaryLinks", []):
        if link.get("groupId") not in core_group_ids:
            continue
        key = str(link.get("masterWord") or link.get("displayWord") or "").strip().lower()
        if key and key not in by_word:
            by_word[key] = link
    return by_word


def word_sentences(link):
    """Up to SENTENCES_SHOWN {text, audio} pairs, skipping any not yet voiced."""
    if not link:
        return []
    texts = link.get("practiceSentences") or ([link["exampleSentence"]] if link.get("exampleSentence") else [])
    clips = link.get("sentenceAudio") or []
    out = []
    for i, t in enumerate(texts[:SENTENCES_SHOWN]):
        a = clips[i] if i < len(clips) else {}
        if a.get("available") is False:
            continue
        out.append({"text": t, "audio": a.get("normal") or a.get("source") or ""})
    return out


# ----------------------------------------------------------------------
# small helpers
# ----------------------------------------------------------------------
def slugify(title):
    s = title.lower().replace("&", "and")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def attr(s):
    """For a single-quoted HTML attribute holding SSML.

    Single quotes so the SSML keeps its own double quotes readable; the
    apostrophes English is full of are the ones that have to go.
    """
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("'", "&#39;"))


def ssml_attr(s):
    """The same, for a body that is already SSML - its own tags must survive."""
    return str(s).replace("'", "&#39;")


def text(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def sentences(parts):
    return "".join("<s>" + attr(p) + "</s>" for p in parts if p)


def explain(calm, friendly, watch, go):
    """The four moves the voice engine's own explainers use: settle, teach,
    warn about the usual slip, then send the child back to the screen. Kept
    identical in shape to the Mathematics build so the two never sound like
    different features."""
    out = ""
    if calm:
        out += ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
                + sentences(calm) + "</prosody></mstts:express-as>")
    if friendly:
        out += ('<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">'
                + sentences(friendly) + "</mstts:express-as>")
    if watch:
        out += ('<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3">'
                '<prosody rate="-6%">' + sentences(watch) + "</prosody></mstts:express-as>")
    if go:
        out += ('<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">'
                + sentences(go) + "</mstts:express-as>")
    return out


def source_of(item, *keys):
    a = item.get("audio") or {}
    for k in keys:
        if a.get(k):
            return a[k]
    return a.get("source") or a.get("normal") or ""


def sentence_pages(script, per_page=4):
    """The story, cut into pages at its own paragraph breaks.

    Never mid-paragraph: the recording reads the whole text straight through,
    so a page boundary inside a paragraph would put a break where the voice
    does not take one.
    """
    paras = [p.strip() for p in re.split(r"\n{2,}", script) if p.strip()]
    return [paras[i:i + per_page] for i in range(0, len(paras), per_page)] or [[script]]


def distractors(pool, right, n, key=lambda x: x):
    """n wrong options drawn from the unit's own material.

    A wrong tap should land on something the child is also learning. Nothing
    is invented to be wrong, and nothing that reads the same as the answer is
    offered beside it.
    """
    seen = {str(key(right)).strip().lower()}
    out = []
    for c in pool:
        k = str(key(c)).strip().lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(c)
        if len(out) >= n:
            break
    return out


# ----------------------------------------------------------------------
# the slides
# ----------------------------------------------------------------------
def build_slides(unit, cw_unit, pics, dic, games, games_meta, shelf, lecture, book_questions, talk_rounds):
    """Return (slides, stickers, data) for one unit.

    A slide is only built where its content exists. Units 4, 7, 9 and 10 have
    no `sight` group and unit 7 and 9 no `topic` group, and an empty step is
    worse than an absent one: it can never be completed, and everything that
    counts steps would be counting one nobody can finish.
    """
    slides, stickers, data = [], [], {}

    groups = {g["strand"]: g for g in cw_unit["groups"]}
    all_words = [w for g in cw_unit["groups"] for w in g["words"]]
    links = unit_dictionary_links(unit)

    def word_obj(w):
        e = dic.get(w.lower(), {})
        link = links.get(w.lower())
        a = e.get("audio") or {}
        # childMeaning is the unit's own kid-facing wording ("A soft pet
        # animal that says miaow..."); canonicalMeaning is the dictionary's
        # more general one and is the fallback for a word this unit teaches
        # but does not itself carry a link for.
        meaning = (link or {}).get("childMeaning") or e.get("canonicalMeaning") or ""
        return {
            "w": e.get("displayWord") or (link or {}).get("displayWord") or w,
            "pic": pics.get(w, ""),
            "meaning": meaning,
            "pos": e.get("partOfSpeech") or "",
            "audio": a.get("normal") or a.get("slow") or "",
            "sentences": word_sentences(link),
        }

    n = 0

    # A step is DECLARED where its content is read and ORDERED by STEP_ORDER
    # below, rather than by where its code happens to sit in this function.
    #
    # The order changed on 2026-09-08 (owner) to match the shell course's own
    # Grades 1-4 arrangement — the picture books lead the reading, their
    # questions follow immediately, and the unit's own text sits near the end
    # (english.js :: BOOKS_LEAD_THE_READING, owner 2026-08-31). Physically
    # moving nine blocks of content-reading code to express that would have
    # made a diff nobody could review, and would have to be done again the
    # next time the order moves. Only STEP_ORDER moves now.
    pending = {}

    def add(kind, title, icon, sticker, ask, explain_ssml, extra_ids=(), block=None, note=""):
        pending[kind] = {
            "kind": kind, "title": title, "icon": icon, "sticker": sticker,
            "ask": ask, "explain": explain_ssml, "extra": list(extra_ids),
            "say": block or ask, "note": note,
        }
        return kind

    def emit_in_order():
        nonlocal n
        for kind in STEP_ORDER:
            spec = pending.get(kind)
            if not spec:
                continue
            n += 1
            slides.append({
                "n": n, "kind": spec["kind"], "title": spec["title"], "icon": spec["icon"],
                "ask": spec["ask"], "explain": spec["explain"], "extra": spec["extra"],
                "say": spec["say"], "note": spec["note"],
            })
            stickers.append([spec["icon"], spec["sticker"]])
        missing = [k for k in pending if k not in STEP_ORDER]
        if missing:
            sys.exit("REFUSED: these steps were built but STEP_ORDER does not place them, "
                     "so they would silently vanish from the lesson: " + ", ".join(missing))

    # ---- The unit's video lesson -----------------------------------------
    #         Units 1-9 only. lecture-media.json is keyed by the unit-N
    #         FOLDER name, so key "0" is the withdrawn Unit 0 and there is no
    #         key 10 at all - Unit 10 opens on the capstone instead, exactly
    #         as the shell course has it. Built only where a video exists
    #         rather than assuming ten of them.
    if lecture:
        data["lecture"] = lecture
        i = add("lecture", "Unit lecture", "\U0001F3AC", "I watched the lesson",
                "Watch the lesson. It ticks itself off when it ends.",
                explain(
                    ["Your teacher recorded this for the start of the unit."],
                    ["Watch it all the way to the end.",
                     "You can turn the captions on if you want to read along.",
                     "Watch it again any time - it does not disappear."],
                    ["Watching is not the same as listening.",
                     "Put it on, and actually listen to her."],
                    ["Press play."]),
                ["video", "next"])

    # ---- 1  the sounds this unit teaches -----------------------------
    if groups.get("phonics") and len(groups["phonics"]["words"]) >= 4:
        words = [word_obj(w) for w in groups["phonics"]["words"]]
        heard = [w for w in words if w["audio"]][:6]
        items = []
        for w in heard:
            wrong = distractors([x for x in words if x is not w], w, 2, key=lambda x: x["w"])
            items.append({"w": w["w"], "audio": w["audio"],
                          "opts": [{"w": w["w"], "pic": w["pic"], "ok": 1}] +
                                  [{"w": x["w"], "pic": x["pic"], "ok": 0} for x in wrong]})
        if items:
            data["sounds"] = items
            i = add("sounds", groups["phonics"]["title"], "\U0001F442", "I heard the sounds",
                    "Listen to the word, then tap the word you heard.",
                    explain(
                        ["These words all share one sound.", "Your ears do this step, not your eyes."],
                        ["I will say a word.", "Listen right to the end of it.",
                         "Then look at the words and tap the one you heard."],
                        ["It is easy to tap the first word you can read.",
                         "Wait for the whole word before you choose."],
                        ["Press Hear it again as many times as you like.", "Now listen."]),
                    ["replay"])

    # ---- 2  the unit's new words, one at a time ----------------------
    topic = groups.get("topic") or groups.get("phonics")
    if topic:
        # A unit missing a "topic" strand (7 and 9) falls back to the SAME
        # words the Sounds step already drew from "phonics" - reusing that
        # group's own title too gave the deck two steps in a row both
        # headed "Phonics: th and ng", reading as one step duplicated
        # rather than two different things to do with the same words.
        newwords_title = topic["title"] if groups.get("topic") else "Meet the words"
        words = [word_obj(w) for w in topic["words"]]
        data["newwords"] = words
        i = add("newwords", newwords_title, "\U0001F4D6", "I met the new words",
                "Say this word out loud.",
                explain(
                    ["These are the new words for this unit."],
                    ["One word at a time.", "Look at the picture.", "Say the word out loud.",
                     "Then press Next word."],
                    ["Reading a word in your head is not the same as saying it.",
                     "Your mouth has to learn it too."],
                    ["Press Hear it to hear the word said properly.", "Then say it with me."]),
                ["replay", "next", "hearSent", "nextSent"])

    # ---- 3  the picture is the question ------------------------------
    pictured = []
    seen_pics = set()
    for w in all_words:
        o = word_obj(w)
        if o["pic"] and o["pic"] not in seen_pics:
            seen_pics.add(o["pic"])
            pictured.append(o)
    if len(pictured) >= 4:
        items = []
        for w in pictured[:6]:
            wrong = distractors([x for x in pictured if x is not w], w, 2, key=lambda x: x["w"])
            items.append({"w": w["w"], "pic": w["pic"], "audio": w["audio"],
                          "opts": [{"w": w["w"], "ok": 1}] + [{"w": x["w"], "ok": 0} for x in wrong]})
        data["match"] = items
        i = add("match", "Word and picture", "\U0001F5BC️", "I matched word to picture",
                "Which word is this?",
                explain(
                    ["A word is a picture you can say."],
                    ["Look at the picture.", "Say what it is, out loud.",
                     "Then find that word and tap it."],
                    ["Two words can start with the same letter.",
                     "Read to the end of the word before you tap."],
                    ["Say it first.", "Then tap it."]),
                ())

    # ---- 4  the words we see everywhere ------------------------------
    if groups.get("sight") and len(groups["sight"]["words"]) >= 4:
        words = [word_obj(w) for w in groups["sight"]["words"]]
        heard = [w for w in words if w["audio"]][:6]
        items = []
        for w in heard:
            wrong = distractors([x for x in words if x is not w], w, 2, key=lambda x: x["w"])
            items.append({"w": w["w"], "audio": w["audio"],
                          "opts": [{"w": w["w"], "pic": "", "ok": 1}] +
                                  [{"w": x["w"], "pic": "", "ok": 0} for x in wrong]})
        if items:
            data["sight"] = items
            i = add("sight", groups["sight"]["title"], "\U0001F440", "I know the everyday words",
                    "Listen, then tap the word you heard.",
                    explain(
                        ["These little words have no picture.",
                         "You cannot draw the word the.", "You just have to know it."],
                        ["They turn up in nearly every sentence you will ever read.",
                         "So knowing them by sight makes reading much faster."],
                        ["Do not try to sound these out letter by letter.",
                         "Look at the whole word and know it."],
                        ["Listen, and tap the one you heard."]),
                    ["replay"])

    # ---- 5  the story ------------------------------------------------
    story = next((r for r in unit["readings"] if r.get("type") == "Story"), None) or unit["readings"][0]
    data["story"] = {
        "title": story.get("title") or "The story",
        "pages": sentence_pages(story.get("passageScript") or ""),
        "audio": source_of(story),
    }
    i = add("story", "The unit story", "\U0001F4DA", "I read the story",
            "Press Listen, then follow the words with your finger.",
            explain(
                ["Now a whole story, read to you."],
                ["Press Listen and let it play.", "Follow the words with your finger as you hear them.",
                 "That is how the sound and the letters join up in your head."],
                ["Do not stop to work out every word.",
                 "Keep following.", "You can hear it again afterwards."],
                ["Press Listen, and off we go."]),
            ["replay", "next"])

    # ---- 6  the story questions --------------------------------------
    #        Only the factual ones. A question whose accepted answer is a
    #        FAMILY of answers ("(any true colour)", "Any two of: ...", a
    #        blank in the question itself) has no single right button to
    #        tap, so it goes to the speaking step instead of being turned
    #        into a multiple choice it is not.
    #
    #        Classified by the ANSWER'S SHAPE, not by questionType. Units
    #        1-9 spell the open kind "Point, act or say" and the factual
    #        kind "Oral response" - two labels, cleanly split - but unit 10
    #        files everything under a third label, "Oral, point or choose",
    #        that names both at once. Matching the string "Oral response"
    #        therefore dropped all twelve of unit 10's comprehension
    #        questions, ten of which are perfectly good facts ("What is the
    #        name of Amal's new book?" => "My First English World"). Tested
    #        against every unit: this classifier agrees with the type-string
    #        test everywhere units 1-9 use it, and recovers unit 10.
    def is_factual(c):
        ans = str(c.get("correctAnswer") or "").strip()
        q = str(c.get("question") or "")
        if not ans or not q or "___" in q or "___" in ans:
            # "___" in the ANSWER is a talk-line TEMPLATE, not a fact -
            # "Which talk line tells us your name?" => "My name is ___."
            # is a pattern to complete with your own name, and 14 of these
            # across units 1-9 have no "(any ...)" annotation to catch them
            # any other way. Found by diffing this unit's own output before
            # and after adding this line - the classifier moved "My name is
            # ___." into the quiz step, where a child would have had to tap
            # the literal blank.
            return False
        if re.search(r"\(\s*(any|or)\b", ans, re.I) or re.match(r"^\s*any\b", ans, re.I):
            return False
        return len(ans) <= 70

    factual = [c for c in unit["comprehension"] if is_factual(c)]
    if len(factual) >= 3:
        items = []
        for c in factual[:6]:
            wrong = distractors([x for x in factual if x is not c], c, 2,
                                key=lambda x: x["correctAnswer"])
            items.append({
                "ask": c["question"],
                "opts": [{"t": c["correctAnswer"], "ok": 1}] +
                        [{"t": x["correctAnswer"], "ok": 0} for x in wrong],
                "why": c.get("explanation") or "",
            })
        data["questions"] = items
        i = add("questions", "Story questions", "\U0001F914", "I answered the story questions",
                "Tap the answer.",
                explain(
                    ["Every answer here is in the story you just read."],
                    ["Read the question.", "Think back to the story.",
                     "Then tap the answer you remember."],
                    ["If you cannot remember, that is fine.",
                     "Go back a step and read it again.", "That is not cheating, that is reading."],
                    ["Take your time, then tap."]),
                ())

    # ---- 7  say it out loud ------------------------------------------
    lines = []
    for s in unit["speaking"][:3]:
        t = (s.get("instructionsAndModelLines") or "").strip()
        if t:
            lines.append({"text": t, "audio": source_of(s)})
    for c in unit["comprehension"]:
        if not is_factual(c) and len(lines) < 6:
            lines.append({"text": c["question"], "audio": ""})
    if lines:
        data["sayit"] = lines
        i = add("sayit", "Say it out loud", "\U0001F5E3️", "I said it out loud",
                "Listen, then say it out loud.",
                explain(
                    ["English is a language before it is anything on a page."],
                    ["Press the speaker to hear the line.", "Then say it yourself, out loud.",
                     "Say it to a grown-up if one is near you, or just say it to yourself."],
                    ["Nobody is marking this and nothing is listening.",
                     "Tick it when you have said it, and be honest with yourself."],
                    ["Your turn. Out loud."]),
                ())

    # ---- 8  what English does ----------------------------------------
    rules = []
    for g in unit["grammar"]:
        rules.append({
            "title": g.get("title") or "",
            "pattern": g.get("ruleAndExamples") or "",
            "explanation": g.get("explanation") or "",
            "mistake": g.get("commonMistake") or "",
            "tip": g.get("memoryTip") or "",
            "practice": g.get("practice") or "",
            "audio": source_of(g),
        })
    if rules:
        data["rules"] = rules
        i = add("rules", "How English works", "\U0001F9E9", "I learned the patterns",
                rules[0]["title"],
                explain(
                    ["English has patterns, and a pattern is a thing you can reuse."],
                    ["The gold line is the pattern.", "Learn that, and you can say a hundred sentences,",
                     "not just the one on the screen."],
                    ["Read the Watch out box.",
                     "It is there because almost every child slips on that exact thing."],
                    ["Press Hear it, then read it once more, then press Next."]),
                ["replay", "next"])

    # ---- 9  write it -------------------------------------------------
    #        The model sentence is the answer; the extra tiles are the unit's
    #        own words, so a wrong build is still English the child is
    #        learning rather than nonsense put there to trip them.
    write = next((w for w in unit["writing"] if (w.get("modelText") or "").strip()), None)
    if write:
        raw_model = write["modelText"]
        has_blank = "_" in raw_model

        def tidy(s):
            s = re.sub(r"\s+([.!?])", r"\1", re.sub(r"\s+", " ", str(s))).strip()
            if s and not s.endswith((".", "!", "?")):
                s += "."
            return s

        # The curriculum already writes the exact model answer for nine of
        # ten units - a "Sentence: This is a chair." line inside
        # completedExample. Use it, rather than guessing a word to fill the
        # blank with: a guess can be grammatical and still wrong, and one
        # WAS - unit 10's blank is "My name is ___.", and every taught word
        # is a number, a feeling or a greeting, none of them a name. The
        # picked word ("happy") produced "My name is happy.", which reads
        # fine and answers a question nobody asked. This build no longer
        # invents an answer where the content already states one.
        answer = None
        items = list((write.get("completedExample") or {}).get("items") or [])
        if not has_blank:
            # a complete sentence already - inserting a word into it was the
            # OTHER bug this replaces: unit 6's model has no blank at all
            # and a forced word turned "I can see with my eyes." into
            # "I can see with my eyes face."
            answer = tidy(raw_model)
        else:
            sentence_line = next(
                (re.match(r"^\s*sentence\s*:\s*(.+)$", it, re.I) for it in items
                 if re.match(r"^\s*sentence\s*:\s*(.+)$", it, re.I)), None)
            if sentence_line:
                answer = tidy(sentence_line.group(1))
            else:
                # No "Sentence:" line (unit 7 alone) - completedExample
                # instead carries a short LABEL ("Vehicle label: school
                # bus") beside an unrelated full sentence ("Safety
                # sentence: I use the pavement."), and only the label
                # completes THIS model's blank. Told apart by shape: a
                # label does not already end in sentence punctuation, a
                # full sentence does.
                starter = (write.get("sentenceStarter") or "").strip()
                label_val = None
                for it in items:
                    lm = re.match(r"^\s*(?!drawing\b)[\w ]+:\s*(.+)$", it, re.I)
                    if lm and not lm.group(1).strip().endswith((".", "!", "?")):
                        label_val = lm.group(1).strip()
                        break
                if label_val:
                    answer = tidy((starter.rstrip() + " " + label_val) if starter
                                 else re.sub(r"_+", label_val, raw_model))
        if not answer:
            # Last resort, reached by no unit in Grades 1: the old
            # word-from-vocabulary guess, kept rather than leaving the step
            # unbuilt if a future unit's content has neither shape above.
            model = tidy(re.sub(r"_+", "", raw_model))
            said = " ".join([write.get("promptAndInstructions") or ""] + items +
                            list((write.get("completedExample") or {}).get("otherAnswers") or [])).lower()
            pool = (topic["words"] if topic else []) + all_words

            def named(w):
                return re.search(r"\b%s\b" % re.escape(w.lower()), said) is not None

            def pictured_noun(w):
                e = dic.get(w.lower())
                return bool(e) and e.get("partOfSpeech") == "noun" and bool(pics.get(w))

            noun = (next((w for w in pool if named(w) and dic.get(w.lower())), None)
                    or next((w for w in pool if pictured_noun(w)), None)
                    or next((w for w in pool if dic.get(w.lower())), None))
            answer = model
            if noun:
                answer = (answer[:-1].strip() + " " + noun + ".") if answer.endswith(".") \
                    else answer + " " + noun + "."
        tiles = [t for t in re.findall(r"[A-Za-z']+|[.!?]", answer)]
        spare = [w for w in all_words if w not in [t.lower() for t in tiles]][:3]
        data["write"] = {
            "ask": (write.get("promptAndInstructions") or "").strip(),
            "title": write.get("title") or "Write it",
            "answer": " ".join(tiles),
            "tiles": tiles + spare,
            "audio": source_of(write),
        }
        i = add("write", "Write a sentence", "✍️", "I wrote a sentence",
                data["write"]["ask"] or "Build the sentence.",
                explain(
                    ["Writing a sentence is putting words in an order that means something."],
                    ["Tap the words one at a time to put them on the line.",
                     "Tap a word on the line to take it back off.",
                     "When it reads like a real sentence, press Check it."],
                    ["A sentence needs its full stop at the end.",
                     "Without one it never finishes."],
                    ["Read your line out loud before you check it.",
                     "Your ears will tell you if a word is in the wrong place."]),
                ["line", "tiles", "check", "clear"])

    # ---- 10  the check -----------------------------------------------
    quiz = []
    for q in unit["quizzes"]:
        opts = [o.strip() for o in str(q.get("options") or "").split("|") if o.strip()]
        ok = (q.get("correctAnswer") or "").strip()
        if not opts or ok not in opts:
            continue
        quiz.append({"ask": q["question"],
                     "opts": [{"t": o, "ok": 1 if o == ok else 0} for o in opts],
                     "why": q.get("explanation") or ""})
    if quiz:
        data["quiz"] = quiz
        i = add("check", "Show what you know", "✅", "I showed what I know",
                "Tap the answer.",
                explain(
                    ["Nothing new here.", "Every question is something this unit already taught you."],
                    ["Read the question right to the end.",
                     "Then read every answer before you pick one."],
                    ["The answer that catches your eye first is often the one put there to catch it."],
                    ["Take your time. Then tap."]),
                ())

    # ---- 11  Fluency Practice ------------------------------------------
    #         Consolidation of what this unit already taught - no new words,
    #         no new patterns. Authored by
    #         tools/author-ehel-english-g1-fluency.py into the unit JSON, so
    #         it arrives here the same way every other section does: read
    #         from the course's own content at build time. Its items carry
    #         reviewStatus "Needs curriculum review", which is why the step
    #         says so on its own face rather than passing for reviewed
    #         content the way the rest of this build legitimately does.
    fluency = []
    for f in unit.get("fluency") or []:
        opts = [o.strip() for o in str(f.get("options") or "").split("|") if o.strip()]
        ok = (f.get("correctAnswer") or "").strip()
        if not opts or ok not in opts:
            continue
        fluency.append({"ask": f["question"],
                        "opts": [{"t": o, "ok": 1 if o == ok else 0} for o in opts],
                        "why": f.get("explanation") or ""})
    if fluency:
        data["fluency"] = fluency
        i = add("fluency", "Fluency Practice", "\U0001F501", "I practised what I know",
                "Tap the answer. Nothing here is new.",
                explain(
                    ["Nothing here is new.",
                     "Every question is a word or a pattern this unit already taught you."],
                    ["Read the question.", "Think back to the lesson.", "Then tap your answer."],
                    ["If you get one wrong, read the reason underneath.",
                     "That is the part that makes it stick."],
                    ["Take your time, then tap."]),
                (),
                note=REVIEW_NOTE)

    # ---- Games -----------------------------------------------------------
    #         THE WHOLE PACK, one step. This used to be two steps carrying
    #         two hand-picked games of the unit's twelve, which left ten
    #         authored games unreachable. The pack is already written -
    #         12 games, 72 rounds per unit - so the step is a picker: cards
    #         for every game, tap one to play it, the way the shell's own
    #         Game Park works. Rendering 72 rounds as one march would be a
    #         step no six-year-old finishes.
    #
    #         Four of the six mechanics are covered (choice, spelling,
    #         sentence/sequence builders, pairs). `speaking` games need a
    #         recorder this build does not have, and are dropped with the
    #         count said out loud on the page rather than silently.
    playable, skipped = [], 0
    for g in (games or {}).values():
        rounds = g.get("rounds") or []
        if not rounds:
            continue
        if g.get("type") == "speaking":
            skipped += 1
            continue
        playable.append({
            "id": g["id"], "type": g["type"], "title": g.get("title") or g["id"],
            "skill": g.get("skill") or "", "description": g.get("description") or "",
            "rounds": rounds,
        })
    if playable:
        playable.sort(key=lambda x: x["id"])
        data["games"] = {"games": playable, "skipped": skipped,
                         "mastery": (games_meta or {}).get("masteryScore") or 4}
        i = add("games", "Games", "\U0001F3AE", "I played the games",
                "Choose a game to play.",
                explain(
                    ["This is the unit's own Game Zone."],
                    ["Tap a game card to play it.",
                     "Each game asks you a few short questions.",
                     "Play as many as you like, then come back for another."],
                    ["Getting one wrong costs nothing here.",
                     "A game is for practising, not for marking."],
                    ["Pick a game and play."]),
                ["gamelist"])

    # ---- 13  Picture books -----------------------------------------------
    #         The full shelf, not one signature book - unitEbooks() decides
    #         how many, and it is seven for this unit, not the "up to five"
    #         a first read of the catalogue suggested. The pages themselves
    #         are never copied; the reader fetches them from ../ebooks/ at
    #         read time, the same relative shape the shell's own reader
    #         uses one directory up.
    if shelf:
        data["books"] = [{
            "id": b["id"], "title": b["title"], "author": b.get("author") or "",
            "pages": [{"image": p["image"], "text": p.get("text") or "",
                      "alt": p.get("alt") or "", "sound": p.get("sound") or ""}
                     for p in b["pages"]],
        } for b in shelf]
        i = add("books", "Reading books", "\U0001F4DA", "I read a picture book",
                "Choose a book to read.",
                explain(
                    ["This unit has its own shelf of picture books."],
                    ["Tap Read on a book that looks good.",
                     "Tap the pictures - some of them make a sound.",
                     "Press Listen if you want the page read to you."],
                    ["A tap sound is a little extra.",
                     "If nothing happens when you tap, that is fine - keep reading."],
                    ["Pick a book and press Read."]),
                ["shelf"])

    # ---- Story questions for each book -----------------------------------
    #         Already authored: BOOK_COMPREHENSION_SETS in english.js, 18 per
    #         unit for Grade 1. Three kinds, and all three are kept because
    #         dropping the two harder ones would leave only the text MCQs and
    #         quietly halve the section: `choice` (text options), `picture`
    #         (tap the right book PAGE out of three) and `order` (put events
    #         in sequence). The picture kind is why this step needs the book
    #         pages the shelf above already fetches.
    if book_questions:
        data["bookquestions"] = book_questions
        i = add("bookquestions", "Story questions for each book", "\U0001F50D",
                "I answered the book questions",
                "Answer the questions about the books you read.",
                explain(
                    ["These questions are about the books on your shelf."],
                    ["Some ask you to tap the right answer.",
                     "Some show you three pictures and ask you to tap one.",
                     "Some ask you to put things in the right order."],
                    ["If you cannot remember, go back and read the book again.",
                     "That is not cheating, that is reading."],
                    ["Take your time, then tap."]),
                ["bq"])

    # ---- Let us talk ------------------------------------------------------
    #         Situational dialogue: not "which sentence follows the pattern"
    #         (that is Fluency) but "what do you SAY when someone asks you
    #         this". Built from the unit's own grammar titles, which are
    #         already written as instructions - "Introduce yourself by name",
    #         "Say how old you are" - so the prompt is the unit's words and
    #         only the framing around it is new.
    if talk_rounds:
        data["talk"] = talk_rounds
        i = add("talk", "Let us talk", "\U0001F4AC", "I practised talking",
                "What do you say?",
                explain(
                    ["Talking is why you are learning any of this."],
                    ["Read what is happening.", "Then tap the thing you would say.",
                     "Say it out loud too - that is the part that counts."],
                    ["More than one answer can be real English.",
                     "Only one of them answers what was asked."],
                    ["Read it, choose it, then say it out loud."]),
                (),
                note=REVIEW_NOTE)

    emit_in_order()
    return slides, stickers, data


# ----------------------------------------------------------------------
# the page
# ----------------------------------------------------------------------
SLIDE = """    <section class="slide" data-explain='%(explain)s' data-say="%(say)s">
      <div class="slide-head"><span class="n">%(n)d</span><h2>%(title)s</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="ask%(n)d">%(ask)s</span></div>
      <div class="stage">
        <div id="stage%(n)d"></div>
        <div class="choices" id="ch%(n)d"></div>
        <p class="fb" id="fb%(n)d"></p>
        <p class="score" id="score%(n)d"></p>
%(note)s      </div>
    </section>
"""

STICKER_SLIDE = """    <section class="slide" data-explain='%(explain)s' data-say="Look at all the stickers you earned!">
      <div class="slide-head"><span class="n">&#9733;</span><h2>My stickers</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span>Every step you finished earned a sticker.</span></div>
      <div class="stage">
        <div class="stickers" id="stickers"></div>
        <p class="fb" id="fbstick"></p>
        <div class="bigbtns"><button type="button" class="big ghost small" id="restart">Play again</button></div>
      </div>
    </section>
"""

PAGE = """<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">
<style>
%(css)s</style>

<div class="wrap">
  <header class="hero">
    <div>
      <p class="eyebrow">Ehel Academy &middot; Grade 1 English &middot; Unit %(unit)d</p>
      <h1>%(h1)s</h1>
    </div>
    <nav class="dots" id="dots" aria-label="Steps"></nav>
  </header>

  <div class="deck" id="deck">
%(slides)s  </div>

  <div class="foot">
    <button type="button" class="big small ghost" id="back">&#9664; Back</button>
    <span class="mid" id="where"></span>
    <button type="button" class="big small" id="next">Next &#9654;</button>
  </div>
</div>

<script>
(function () {

  /* ==================================================================
     %(title)s - Grade 1 English, Unit %(unit)d.

     GENERATED by english/grade-1-app/build-lessons.py from
     english/grade-1/data. Do not hand-edit: the next build overwrites it,
     and the fix for anything wrong on this page is either in the course
     content or in the builder.
     ================================================================== */

  const LESSON = %(data)s;

%(voice)s

%(deck)s

%(english)s

%(books)s

%(games)s

  const STICKERS = %(stickers)s;

%(bootstrap)s
  show(0, false);

})();
</script>
"""


def bootstrap(slides, data):
    """The per-slide calls, in the order the slides appear.

    finish(i) takes the slide's 0-BASED index, and STICKERS is in the same
    order, so the dot rail, the sticker shelf and the progress report are one
    numbering rather than three that can drift.
    """
    out = []
    for s in slides:
        n = s["n"]
        i = n - 1
        # `ask` and `say` are the same element under two names. sequence() is
        # lifted verbatim from the Mathematics build and calls it `say`; the
        # English renderers call it `ask`, because on those steps it is a
        # question rather than an instruction. Renaming either would fork a
        # function this build deliberately shares.
        el = ('{ ask: "ask%d", say: "ask%d", stage: "stage%d", ch: "ch%d", fb: "fb%d", score: "score%d"'
              % (n, n, n, n, n, n))
        for extra in s["extra"]:
            el += ', %s: "%s%d"' % (extra, extra, n)
        el += " }"
        k = s["kind"]
        if k in ("sounds", "sight"):
            out.append('  hearAndTap({ el: %s, items: LESSON.%s, finish: %d,\n'
                       '    ask: "Which word did you hear?", label: "Word",\n'
                       '    done: "You know these words by their sound now." });'
                       % (el, "sounds" if k == "sounds" else "sight", i))
        elif k == "newwords":
            out.append('  wordWalk({ el: %s, items: LESSON.newwords, finish: %d,\n'
                       '    ask: "Say this word out loud.", label: "Word",\n'
                       '    done: "Now you have met them, you will see them all through the unit." });'
                       % (el, i))
        elif k == "match":
            out.append('  pictureMatch({ el: %s, items: LESSON.match, finish: %d,\n'
                       '    ask: "Which word is this?", label: "Picture",\n'
                       '    done: "You can read those words on their own now." });' % (el, i))
        elif k == "story":
            out.append('  storyRead({ el: %s, title: LESSON.story.title, pages: LESSON.story.pages,\n'
                       '    audio: LESSON.story.audio, finish: %d,\n'
                       '    done: "You read the whole story." });' % (el, i))
        elif k == "questions":
            out.append('  sequence({ el: %s, items: LESSON.questions, finish: %d,\n'
                       '    label: "Question", done: "You remembered the story well." });' % (el, i))
        elif k == "sayit":
            out.append('  sayOutLoud({ el: %s, items: LESSON.sayit, finish: %d,\n'
                       '    ask: "Listen, then say it out loud.",\n'
                       '    done: "Well said. Speaking is how the words stick." });' % (el, i))
        elif k == "rules":
            out.append('  ruleWalk({ el: %s, items: LESSON.rules, finish: %d,\n'
                       '    done: "Those are the patterns this unit is built on." });' % (el, i))
        elif k == "write":
            out.append('  buildSentence({ el: %s, ask: LESSON.write.ask, tiles: LESSON.write.tiles,\n'
                       '    answer: LESSON.write.answer, finish: %d,\n'
                       '    done: "That is a real sentence, written by you." });' % (el, i))
        elif k == "check":
            out.append('  sequence({ el: %s, items: LESSON.quiz, finish: %d,\n'
                       '    label: "Question", done: "That is the whole unit finished." });' % (el, i))
        elif k == "fluency":
            out.append('  sequence({ el: %s, items: LESSON.fluency, finish: %d,\n'
                       '    label: "Question", done: "That is this unit\'s words and patterns practised." });' % (el, i))
        elif k == "lecture":
            out.append('  lectureStep({ el: %s, lecture: LESSON.lecture, finish: %d,\n'
                       '    done: "You watched the whole lesson." });' % (el, i))
        elif k == "games":
            out.append('  gameZone({ el: %s, pack: LESSON.games, finish: %d,\n'
                       '    done: "That is the Game Zone played." });' % (el, i))
        elif k == "bookquestions":
            out.append('  bookQuestions({ el: %s, items: LESSON.bookquestions, books: LESSON.books,\n'
                       '    finish: %d, done: "You answered the book questions." });' % (el, i))
        elif k == "talk":
            out.append('  sequence({ el: %s, items: LESSON.talk, finish: %d,\n'
                       '    label: "Round", done: "That is talking practised." });' % (el, i))
        elif k == "books":
            out.append('  bookShelf({ el: %s, items: LESSON.books, finish: %d,\n'
                       '    ask: "Choose a book to read.",\n'
                       '    done: "You finished a book from this unit\'s shelf." });' % (el, i))
    return "\n".join(out) + "\n"


def build(unit_no, manifest, cw, dic, css, voice, deck, english, books_js, games_js,
          ebooks, book_sets, lectures, release):
    entry = next(u for u in manifest["units"] if u["number"] == unit_no)
    unit = load_json(os.path.join(DATA, "units", "unit-%d.json" % unit_no))
    cw_unit = next(u for u in cw["units"] if u["unitNo"] == unit_no)

    words = [w for g in cw_unit["groups"] for w in g["words"]]
    pics = word_pictures(words)

    games = load_games(unit_no)
    games_meta = load_games_meta(unit_no)
    # unitEbooks(): shell/subjects/english.js's own filter, matched exactly -
    # grades.includes(1) and (no units list, or units includes this one).
    shelf = [b for b in ebooks if 1 in b.get("grades", [])
             and (not b.get("units") or unit_no in b["units"])]
    shelf_ids = {b["id"] for b in shelf}

    # bookComprehensionQuestions(): the shell's own lookup, grade + unit.
    # Filtered to books this unit's shelf actually carries, because a
    # question about a book the child was never given is unanswerable - and
    # a `picture` question needs every one of its three candidate pages to
    # be a book on the shelf, not just the right one.
    qset = next((s for s in book_sets if s.get("grade") == 1 and s.get("unit") == unit_no), None)
    book_questions = []
    for q in (qset or {}).get("questions") or []:
        if q.get("kind") == "picture":
            picks = q.get("pick") or []
            if not picks or any(p.get("book") not in shelf_ids for p in picks):
                continue
        elif q.get("book") and q["book"] not in shelf_ids:
            continue
        book_questions.append(q)

    lec = (lectures or {}).get(str(unit_no)) or {}
    lecture = {}
    if lec.get("lectureVideo"):
        lecture = {
            "video": lecture_asset(lec.get("lectureVideo")),
            "poster": lecture_asset(lec.get("lecturePoster")),
            "captions": lecture_asset(lec.get("lectureCaptions")),
            "slides": lec.get("lectureSlides") or [],
        }

    talk_rounds = talk_items(unit)

    slides, stickers, data = build_slides(unit, cw_unit, pics, dic, games, games_meta,
                                          shelf, lecture, book_questions, talk_rounds)
    data = {k: v for k, v in data.items() if not k.endswith("_slide")}
    data["audioRelease"] = release
    data["unitNo"] = unit_no
    data["unitTitle"] = entry["title"]

    title = entry["title"]
    parts = title.split(" ")
    h1 = (" ".join(parts[:-1]) + " <em>" + parts[-1] + "</em>") if len(parts) > 1 else "<em>" + title + "</em>"

    body = "".join(SLIDE % {
        "n": s["n"], "title": text(s["title"]), "ask": text(s["ask"]),
        "note": ('        <p class="reviewnote">' + text(s["note"]) + "</p>\n") if s["note"] else "",
        "explain": ssml_attr(s["explain"]), "say": attr(s["say"]).replace('"', "&quot;"),
    } for s in slides)
    body += STICKER_SLIDE % {"explain": ssml_attr(explain(
        [], ["Nothing to work out here.", "This is your shelf.",
             "One sticker for every step you finished."], [],
        ["Have a look at what you earned."]))}

    page = PAGE % {
        "title": title, "unit": unit_no, "h1": h1, "css": css,
        "slides": body,
        "data": json.dumps(data, ensure_ascii=False, indent=2).replace("\n", "\n  "),
        "voice": voice, "deck": deck, "english": english, "books": books_js,
        "games": games_js,
        "stickers": json.dumps(stickers, ensure_ascii=False),
        "bootstrap": bootstrap(slides, data),
    }
    name = slugify(title) + ".html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8", newline="").write(page)
    print("  ok   %-30s unit %-2d  %d steps + stickers  %6d bytes"
          % (name, unit_no, len(slides), len(page)))
    return name, title


def main():
    wanted = [int(a) for a in sys.argv[1:] if a.isdigit()]
    manifest = load_json(os.path.join(DATA, "course-manifest.json"))
    cw = load_json(os.path.join(DATA, "core-words.json"))
    dic = dictionary_index()
    release = audio_release()

    css = io.open(os.path.join(LIB, "lesson.css"), encoding="utf-8").read()
    voice = io.open(os.path.join(LIB, "voice.js"), encoding="utf-8").read()
    deck = io.open(os.path.join(LIB, "deck.js"), encoding="utf-8").read()
    english = io.open(os.path.join(LIB, "english.js"), encoding="utf-8").read()
    books_js = io.open(os.path.join(LIB, "books.js"), encoding="utf-8").read()
    games_js = io.open(os.path.join(LIB, "games.js"), encoding="utf-8").read()
    ebooks = ebook_catalog()
    book_sets = book_comprehension_sets()
    lectures = lecture_media()

    units = wanted or [u["number"] for u in manifest["units"]]
    print("\n  Building Grade 1 English lessons  (audio stamp %s)\n" % release)
    built = [build(n, manifest, cw, dic, css, voice, deck, english, books_js, games_js, ebooks,
                   book_sets, lectures, release) for n in units]
    print("\n  %d page(s). Now run the shared pipeline - see the docstring.\n" % len(built))


main()
