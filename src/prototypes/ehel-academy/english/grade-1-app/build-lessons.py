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


_GLOSSARY_PICS = None


def glossary_pictures():
    """word -> emoji for the words the Word finder lists.

    The glossary itself is fetched at runtime because it is several hundred KB;
    this map is 6.1 KB for all 995 words, so it rides in the page - and it has
    to, because wordPicture() lives in the shell and there is no shell here at
    runtime.

    Through node, like word_pictures() above and for the same reason: a regex
    over word-pictures.js mis-read an entry once and cannot see the per-grade
    overrides at all. Memoised because it is the same 995 words for all ten
    pages and each call is a node process.

    453 of the 995 have a picture. The rest are abstract words English's map
    deliberately leaves blank, and the row shows nothing there rather than a
    placeholder.
    """
    global _GLOSSARY_PICS
    if _GLOSSARY_PICS is None:
        path = os.path.join(DATA, "sentence-glossary.json")
        _GLOSSARY_PICS = (word_pictures(list(load_json(path).get("entries", {}).keys()))
                          if os.path.exists(path) else {})
    return _GLOSSARY_PICS


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
# "Show what you know" is TWO checks of ten, one mid-unit and one at the end.
# Owner, 2026-09-08: thirty in a single sitting was about twenty minutes for a
# five-year-old and far the longest step in the unit.
#
# The halves are the content's own division rather than a cut down a list.
# Measured across every unit: the authored ten are five "Supported recall"
# then five "Supported application" in units 1-9, and ten "Cumulative" in unit
# 10, which is the capstone and falls back to five and five by position.
QUIZ_PER_CHECK = 10

# Which games feed which check, by the skill each one declares. The mid-unit
# check asks what the first half of the unit teaches - words and their
# meanings; the end check asks the learner to apply a pattern, which is what
# the second half is about.
QUIZ_SKILLS_MID = ("vocabulary", "meaning in context")

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
    # What the unit is FOR, before the plan of when to do it.
    "overview",
    # The plan is read BEFORE the unit is walked, so it opens it - the same
    # position the shell gives it (Overview, then Unit Study Plan, then the
    # teaching). It is a reference page rather than a step, which is why it
    # completes on being read and gates nothing.
    "plan",
    "lecture",        # the unit's video lesson (units 1-9; Unit 10 has none)
    "sounds",
    "newwords",
    "match",
    "sight",
    "books",          # "Reading books" — the shelf, moved up from last
    "bookquestions",  # the shelf's own questions, already authored
    "sayit",
    # The first check sits HERE because everything it asks about has happened:
    # the lecture, the sounds, the new words, word-and-picture, the sight
    # words, the books and their questions. Nothing after it is tested by it.
    "checkmid",
    "rules",
    "write",
    "talk",           # "Let us talk" — say it out loud, and Azure checks it
    "games",          # the whole game pack, one step
    # "story" IS DELIBERATELY ABSENT. Owner, 2026-09-08. The unit's own story
    # is ALREADY on the shelf at step 6 as an illustrated, narrated,
    # twelve-page picture book, under the same title, in all ten units —
    # Amal's First Day, Breakfast at Grandma's House, Amal's English Year.
    # The step that used to sit here showed the identical story as four
    # blocks of plain text. It was the same content twice and the worse of
    # the two for a six-year-old, so it is gone rather than moved again.
    #
    # Its comprehension questions STAY, renamed: they are reviewed
    # curriculum tied to the unit's outcomes, they are not what step 7 asks
    # (those are authored for the picture books), and every one of them is
    # still answerable — checked question by question — from the book on
    # the shelf.
    #
    # "story" is THE UNIT'S OWN READINGS, and it is deliberately NOT the
    # picture books. Those are a separate shelf with a separate purpose
    # (step 6); this is the curriculum text the comprehension questions below
    # are written against.
    #
    # The two are not the same text, which is the mistake this step exists to
    # correct: matched by title they look identical, and measured they are
    # not — Unit 1's reading is 219 words over four pages, the book of the
    # same name is a 150-word retelling over twelve. At least one
    # comprehension answer ("Happy") lives in the reading and in no page of
    # the book.
    "story",
    "questions",
    # Immediately before Fluency, which is where the shell course puts it
    # (writing, activities, fluency, quiz). These are the unit's hands-on jobs
    # - colour it, draw it, act it, make it - so they sit after the reading and
    # the writing that give them something to be about.
    "activities",
    "fluency",
    "check",
    # After the quiz, because it asks the learner to look back at the unit -
    # and it is the child's own answer, not a mark.
    "reflect",
    # Last, and deliberately AFTER the quiz: none of it is a step to finish.
    # It is the drawer a learner opens when they want the word list, the
    # plan, or a pencil and paper - the same role Student resources plays in
    # the shell course.
    "resources",
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


def unit_schedule(manifest):
    """{unitNo: {term, from, to, fromDate, toDate, weeks, termDates}}.

    THE CALENDAR IS NOT RE-DERIVED HERE. shell/study-plan.js holds
    SCHOOL_CALENDAR and the unit-to-weeks allocation, its own comment names it
    "the one place to change" when the school publishes next year's dates, and
    all six shell subjects already read it. A second copy in Python would be a
    second school year, wrong in a way nobody notices until September.

    So the builder IMPORTS the real module through node and calls the real
    functions - it has no imports of its own and touches no DOM at module
    scope, so node can load it. groupIntoTerms and weekRows were exported in
    the same change for this caller; everything else was already public.

    What is NOT shared is the day-by-day spread below. renderUnitStudyPlan
    spreads the SHELL's sections and this spreads the STANDALONE BUILD's steps,
    which are different lists by design - so the two pages plan the same weeks
    from the same calendar and fill them with each build's own walk.
    """
    src = os.path.join(SHELL, "..", "study-plan.js")
    src = os.path.abspath(src).replace("\\", "/")
    script = (
        'const m = await import("file:///%s");\n'
        'const units = %s;\n'
        'const out = {};\n'
        'for (const term of m.groupIntoTerms(units)) {\n'
        '  const cal = m.calendarTerm(term.termNo);\n'
        '  const total = m.termWeekTotal(term.termNo);\n'
        '  for (const row of m.weekRows(term.units, total)) {\n'
        '    const last = new Date(cal.weeks[row.to - 1].getTime() + 4 * 24 * 3600 * 1000);\n'
        '    out[row.unit.number] = {\n'
        '      term: term.termNo, from: row.from, to: row.to,\n'
        '      fromDate: m.formatDay(cal.weeks[row.from - 1], { long: true }),\n'
        '      toDate: m.formatDay(last, { long: true }),\n'
        '      weeks: row.to - row.from + 1,\n'
        '      termDates: m.termDatesLabel(term.termNo),\n'
        '      year: m.SCHOOL_CALENDAR.yearLabel,\n'
        '    };\n'
        '  }\n'
        '}\n'
        'process.stdout.write(JSON.stringify(out));\n'
        % (src, json.dumps(manifest["units"]))
    )
    r = subprocess.run(["node", "--input-type=module", "-e", script], capture_output=True)
    if r.returncode != 0:
        sys.exit("REFUSED: could not read the school calendar from shell/study-plan.js.\n" +
                 r.stderr.decode("utf-8", "replace"))
    return json.loads(r.stdout.decode("utf-8"))


def plan_days(step_titles, weeks):
    """One line per school day: the unit's own steps spread over its weeks.

    Five days a week, and the LAST day is always the look-back - a plan that
    ends on new work has no room to be behind. Two shapes, chosen by which side
    is scarcer, which is the rule renderUnitStudyPlan settled on for the shell:
    more steps than days and a day carries several; more days than steps and a
    step gets a run of days. The first cut of the shell's version gave every
    part one day and padded the rest with "go back over", which read as empty
    weeks - so this does not do that either.
    """
    total = max(1, weeks * 5)
    body = total - 1                       # the last day is the look-back
    parts = list(step_titles)
    lines = []
    if not parts:
        return ["Work through the unit."] * body + ["Look back over the whole unit."]
    if len(parts) >= body:
        base, extra = divmod(len(parts), body)
        at = 0
        for day in range(body):
            size = base + (1 if day < extra else 0)
            lines.append(" · ".join(parts[at:at + size]))
            at += size
    else:
        base, extra = divmod(body, len(parts))
        for i, part in enumerate(parts):
            span = base + (1 if i < extra else 0)
            for d in range(span):
                lines.append(part if span == 1
                             else ("Start " + part if d == 0
                                   else ("Finish " + part if d == span - 1 else "Carry on with " + part)))
    lines.append("Look back over the whole unit before you move on.")
    return lines


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
            # What the child then says out loud, and what Azure scores against.
            # It is the round's own correct answer, so choosing and saying are
            # the same sentence rather than two exercises side by side.
            "reference": answer,
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


# A speaking game round is only offered to the pronunciation check if it is a
# SENTENCE A CHILD SAYS. 59 of the 60 rounds in this grade's Speaking Quest
# carry no quoted model line, and most of their `target` fields are addressed
# to the grown-up ("Point to school things as an adult names them") or are
# imperatives ("Play teacher and pupil with a partner", "Ask a friend about the
# food they eat"). Scoring a child's pronunciation against an instruction they
# were never meant to read aloud fails everyone who did the activity correctly.
#
# THE TEST IS A WHITELIST OF SENTENCE OPENERS, and it is a whitelist on purpose.
# Two looser rules were measured first and both mislabelled: "quoted lines only"
# found 1 of 60, and "short and mentions no adult" passed 43 - including "Ask
# and answer about the girls in your family" and "Drop things into a bowl of
# water and report what happens", which are instructions wearing a short
# sentence's clothes. Requiring a declarative opener finds 15, and the 15 are
# all genuinely sayable. Anything unrecognised falls back to an adult-led
# activity with no check, which is the honest default for this content and the
# direction a wrong guess should fail in.
SPEAKABLE_OPENER = re.compile(
    r"^(I|You|We|They|He|She|It|The|A|An|My|Your|Our|Their|His|Her|This|That|These|"
    r"Those|There|Here|Today|Yesterday|Amal|Kiki|Musa|Duku|Lulu|Zuri|Omar|Nora|Adam|"
    r"Sami|Maya|Yasmin|Grandma|Grandpa|Mum|Dad)\b")
ADULT_LED = re.compile(r"\badults?\b|\bgrown-?up\b|\baudio\b", re.I)


def speakable_target(target):
    """The sentence a child says, or "" when the round is an activity."""
    t = (target or "").strip()
    if not t or len(t) > 70 or ADULT_LED.search(t) or not SPEAKABLE_OPENER.match(t):
        return ""
    return t


# Splitting an activity's instruction into steps, by the SHELL'S OWN RULE
# (english.js :: ACTIVITY_INLINE_MARK) rather than a second invention.
#
# Grade 1 numbers its items INLINE - "Make a name card. 1. Fold the card.
# 2. Write your name big." - so a newline split, which is what the other grades
# need, finds nothing here at all. The shell records measuring exactly that and
# adding this second pass for it.
#
# THE GUARD IS THAT THE NUMBERS MUST BE A RUN, starting at 1 and climbing by
# one. Without it any sentence containing a numeral becomes a checklist, and a
# checklist is a thing a child has to tick off before the activity will
# complete - prose served as a list of jobs. The lookbehind stops a decimal or
# a digit inside a larger number from opening a run.
#
# Measured on this grade: 64 of the 120 activities split, 56 are genuinely one
# instruction a sentence or two long and keep a single block. Both shapes are
# drawn; neither is a failure.
ACTIVITY_INLINE_MARK = re.compile(r"(?<![\d.])(\d+)\.\s+")


def activity_steps(text):
    """(lead, [items]) - items is empty where the instruction is one block."""
    text = (text or "").strip()
    marks = list(ACTIVITY_INLINE_MARK.finditer(text))
    if len(marks) < 2:
        return text, []
    for i, m in enumerate(marks):
        if int(m.group(1)) != i + 1:
            return text, []
    lead = text[:marks[0].start()].strip()
    items = []
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        items.append(text[m.end():end].strip())
    return lead, [x for x in items if x]


def cursive_module():
    """shell/subjects/cursive-strokes.js, inlined with its exports stripped.

    THE REAL FILE, not a copy. It is 232 lines of stroke data and path maths
    and it touches no DOM at all, so the only thing standing between it and
    this build's IIFE is the `export` keyword. Stripping that at build time
    keeps one source: a retouched letter reaches the standalone pages on the
    next build, and there is no second alphabet to drift.
    """
    path = os.path.join(SHELL, "cursive-strokes.js")
    src = io.open(path, encoding="utf-8").read()
    src = re.sub(r"^export\s+", "", src, flags=re.M)
    return "  " + src.replace("\n", "\n  ").rstrip() + "\n"


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


def sentence_pages(script, per_page=4, words_per_page=65):
    """The reading, cut into pages at its own paragraph breaks.

    Never mid-paragraph where there ARE paragraphs: the recording reads the
    whole text straight through, so a break inside a paragraph would put a
    page turn where the voice does not take one.

    HALF THIS GRADE'S STORIES HAVE NO PARAGRAPH BREAKS AT ALL, which the
    original `or [[script]]` fallback turned into one enormous page without
    saying so. Measured: units 1, 2, 3, 7 and 8 carry 13-odd blank-line breaks
    and page properly; units 4, 5, 6, 9 and 10 carry ZERO, so Unit 9's
    315-word story arrived as a single wall of text for a five-year-old while
    Unit 1's 219 words came as four pages. Same course, same step, opposite
    experience, and nothing anywhere reported it.

    So where the paragraph split finds nothing, sentences are the unit
    instead, grouped to about `words_per_page`. That lands units 4 and 9 on
    five pages, which is what the paragraphed units already give. The voice is
    unaffected either way - Listen plays the whole recording, as it always did.
    """
    paras = [p.strip() for p in re.split(r"\n{2,}", script) if p.strip()]
    if len(paras) > 1:
        return [paras[i:i + per_page] for i in range(0, len(paras), per_page)]

    whole = (paras[0] if paras else script).strip()
    if not whole:
        return []
    # Split after end punctuation, keeping any closing quote with the sentence
    # it ends - the stories are full of "…she said." and a naive split on
    # [.!?] leaves an orphan quote mark opening the next page.
    parts = [x.strip() for x in re.split(r'(?<=[.!?][\"\u201d])\s+|(?<=[.!?])\s+', whole) if x.strip()]
    pages, page, count = [], [], 0
    for part in parts:
        page.append(part)
        count += len(part.split())
        if count >= words_per_page:
            pages.append([" ".join(page)])
            page, count = [], 0
    if page:
        if pages and count < words_per_page // 3:
            pages[-1][0] += " " + " ".join(page)   # never strand a one-line page
        else:
            pages.append([" ".join(page)])
    return pages or [[whole]]


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
def build_slides(unit, cw_unit, pics, dic, games, games_meta, shelf, lecture, book_questions,
                 talk_rounds, plan):
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

    # ---- The unit's study plan -------------------------------------------
    #         WHEN this unit happens, and what to do on each school day of it.
    #         The term, the weeks and the dates all come from
    #         shell/study-plan.js through unit_schedule() above - the school's
    #         real 2026-27 calendar, half terms removed, the same one the shell
    #         course plans against.
    #
    #         A REFERENCE PAGE, NOT A STEP. It completes the moment it is read,
    #         because there is nothing here to get right and a plan that has to
    #         be "finished" before the unit opens is a lock on the front door.
    if plan:
        data["plan"] = plan
        i = add("plan", "The plan for this unit", "\U0001F4C5", "I read the plan",
                "When this unit happens, and what to do each day.",
                explain(
                    ["This is when this unit happens and what to do each day."],
                    ["Look at the weeks at the top.",
                     "Then read down the days.",
                     "One line is one school day."],
                    ["Nobody is behind.",
                     "If a day takes two days, take two days."],
                    ["Have a look, then start the unit."]),
                ["plan"])

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

    # The unit story is no longer a step of its own - see STEP_ORDER above.
    # `story` is still READ here, because renderReading's own text is what the
    # comprehension questions below are about and the picture book on the
    # shelf is the same story; nothing downstream needs the pages, so they are
    # not emitted into the page's LESSON at all.

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
        i = add("questions", "What happened in the story?", "\U0001F914", "I answered the story questions",
                "Tap the answer.",
                explain(
                    ["These questions are about this unit's own story."],
                    ["Read the question.", "Think back to the story.",
                     "Then tap the answer you remember."],
                    ["If you cannot remember, go back one step.",
                     "The story is right above this one.",
                     "That is not cheating, that is reading."],
                    ["Take your time, then tap."]),
                ())

    # ---- 7  say it out loud ------------------------------------------
    # THE MODEL SENTENCES, NOT THE INSTRUCTION PARAGRAPH. A speaking item's
    # instructionsAndModelLines reads "Point to school things as an adult
    # names them ... Say: 'This is a pencil.' 'This is a book.'" - the first
    # half is addressed to the grown-up and the quoted half is what the child
    # actually says. This step used to show the whole paragraph and ask the
    # child to tick "I said it", which is unaskable as a pronunciation
    # reference and was pure honour system besides.
    #
    # 33 of the 60 speaking items across this grade carry
    # recordingRequired: true and NOTHING in this build recorded them. Each
    # quoted model line is now its own short, checkable sentence.
    # THE RECORDING ITEMS COME FIRST, and that ordering is the whole feature.
    # Measured across all ten units: items 4, 5 and 6 carry
    # recordingRequired: true and items 1-3 do not (unit 10 marks all six).
    # Every item quotes three model lines, so taking them in authored order
    # and stopping at six picked ONLY from items 1-2 - that is, only the
    # lines that cannot be checked. The step rendered six sentences and not
    # one of them offered the microphone. Caught by opening the page, not by
    # any gate: nothing here knows what the step is for.
    lines = []
    for item in sorted(unit["speaking"], key=lambda x: 0 if x.get("recordingRequired") else 1):
        quoted = [q.strip() for q in re.findall(r"[\u201c\"']([^\u201d\"']{3,})[\u201d\"']",
                                                item.get("instructionsAndModelLines") or "")]
        for sentence in quoted:
            if len(lines) >= 6:
                break
            lines.append({
                "text": sentence,
                # The clip narrates the whole item rather than this one line,
                # so it is the model for the ACTIVITY. speech.js falls back to
                # the runtime voice for the sentence itself.
                "audio": source_of(item),
                "check": bool(item.get("recordingRequired")),
            })
    if not lines:
        for item in unit["speaking"][:3]:
            t = (item.get("instructionsAndModelLines") or "").strip()
            if t:
                lines.append({"text": t, "audio": source_of(item), "check": False})
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

    # ---- 10  the two checks ------------------------------------------
    #         Ten questions each: five authored, five drawn from the unit's own
    #         game pack on the skill line above. Nothing is invented here.
    reviewed = []
    for q in unit["quizzes"]:
        opts = [o.strip() for o in str(q.get("options") or "").split("|") if o.strip()]
        ok = (q.get("correctAnswer") or "").strip()
        if not opts or ok not in opts:
            continue
        reviewed.append({
            "ask": q["question"],
            "opts": [{"t": o, "ok": 1 if o == ok else 0} for o in opts],
            "why": q.get("explanation") or "",
            "recall": str(q.get("difficulty") or "").lower().startswith("supported recall"),
        })
    # Units 1-9 label the first five recall and the last five application; unit
    # 10 labels all ten cumulative, so `recall` is uniformly false there and the
    # halves fall out by position instead. Both give five and five.
    mid_r = [q for q in reviewed if q["recall"]] or reviewed[:len(reviewed) // 2]
    end_r = [q for q in reviewed if not q["recall"]] or reviewed[len(reviewed) // 2:]
    if not [q for q in reviewed if q["recall"]]:
        mid_r, end_r = reviewed[:len(reviewed) // 2], reviewed[len(reviewed) // 2:]

    seen_q = {str(q["ask"]).strip().lower() for q in reviewed}
    mid_x, end_x = [], []
    for g in sorted((games or {}).values(), key=lambda x: x["id"]):
        if g.get("type") != "choice":
            continue
        bucket = mid_x if str(g.get("skill") or "").strip().lower() in QUIZ_SKILLS_MID else end_x
        for r in g.get("rounds") or []:
            ask = str(r.get("prompt") or "").strip()
            ok = str(r.get("answer") or "").strip()
            opts = [str(c).strip() for c in (r.get("choices") or []) if str(c).strip()]
            if not ask or not ok or ok not in opts or ask.lower() in seen_q:
                continue
            seen_q.add(ask.lower())
            bucket.append({"ask": ask,
                           "opts": [{"t": o, "ok": 1 if o == ok else 0} for o in opts],
                           "why": r.get("explanation") or ""})

    def bank(core, extra):
        out = list(core)
        for x in extra:
            if len(out) >= QUIZ_PER_CHECK:
                break
            out.append(x)
        return [{k: v for k, v in q.items() if k != "recall"} for q in out]

    quiz_mid = bank(mid_r, mid_x)
    quiz = bank(end_r, end_x)
    if quiz_mid:
        data["quizmid"] = quiz_mid
        i = add("checkmid", "Show what you know", "\u2705", "I showed what I know so far",
                "Ten questions about the words so far.",
                explain(
                    ["A check on the words and the reading you have done so far."],
                    ["Read the question.", "Tap the answer you think is right.",
                     "There are ten."],
                    ["This is halfway, not the end.",
                     "Whatever you get, the rest of the unit is still ahead."],
                    ["Take your time, then tap."]),
                ())

    if quiz:
        data["quiz"] = quiz
        i = add("check", "Show what you know again", "✅", "I showed what I know",
                "Tap the answer.",
                explain(
                    ["Nothing new here.", "Every question is something this unit already taught you."],
                    ["Read the question right to the end.",
                     "Then read every answer before you pick one."],
                    ["The answer that catches your eye first is often the one put there to catch it."],
                    ["Take your time. Then tap."]),
                ())

    # ---- The unit's hands-on activities ----------------------------------
    #         Twelve per unit, 120 across the grade, every one already
    #         authored and reviewed - and NONE of them reachable in this build
    #         until now. They are the one thing the shell course offered a
    #         Grade 1 learner that this one did not.
    #
    #         THEY ARE OFF-SCREEN WORK. Colour the classroom picture, draw
    #         yourself in your uniform, fold a name card, act out the rhyme.
    #         Nothing here can be marked by the page, and nothing pretends to
    #         be: no scoring, no right answer, no recorder.
    #
    #         `answerSummary` IS DRAWN, behind "How did I do?". It exists on
    #         all 120 and the shell's own note records that nothing had ever
    #         shown it - a child could do the work and had no way to find out
    #         whether they had done it right. It is written to the grown-up
    #         ("Scribbly, over-the-line colouring is completely fine"), which
    #         is exactly who is standing there for work like this, so it is
    #         labelled as being for them rather than dressed up as feedback.
    acts = []
    for a in unit.get("activities") or []:
        lead, items = activity_steps(a.get("instructionsAndItems"))
        if not lead and not items:
            continue
        acts.append({
            "n": a.get("sequence") or (len(acts) + 1),
            "kind": a.get("activityType") or "",
            "lead": lead,
            "steps": items,
            "audio": source_of(a),
            "check": (a.get("answerSummary") or "").strip(),
        })
    if acts:
        data["activities"] = acts
        i = add("activities", "Things to do", "\u270B", "I did the activities",
                "Jobs to do away from the screen.",
                explain(
                    ["These are the jobs you do with your hands, not on the screen."],
                    ["Read one, or press Listen.",
                     "Go and do it - colour it, draw it, act it out, make it.",
                     "Then come back and tick it."],
                    ["Nothing here is marked.",
                     "Press How did I do to see what finished looks like."],
                    ["Pick one and go and do it."]),
                ["acts"])

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
        # `speaking` used to be dropped here for want of a recorder. It has
        # one now (lib/speech.js), so the twelfth game is playable and the
        # pack is whole.
        if g.get("type") == "speaking":
            rounds = [dict(r, reference=speakable_target(r.get("target"))) for r in rounds]
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
    # NO storyBook LINK. The unit's reading and the shelf's book of the same
    # name are different texts (see the readings step above), so associating
    # them was the mistake this change undoes - not a feature to keep wired up
    # for later.

    # ---- The unit's own readings -----------------------------------------
    #         Story, Shared reading and Rhyme - all three, on the owner's
    #         instruction (2026-09-08). Every one is already narrated and none
    #         of them was reachable anywhere in this build: 30 readings and
    #         4,334 words across the grade, surfaced nowhere.
    #
    #         NOT THE PICTURE BOOKS. The shelf at step 6 is a different thing
    #         with a different purpose, and its books are ADAPTATIONS - the
    #         Unit 1 book is a 150-word retelling of a 219-word reading. The
    #         comprehension step below is written against THIS text, so
    #         pointing it at the book left at least one answer unfindable.
    reads = []
    for r in unit["readings"]:
        pages = sentence_pages(r.get("passageScript") or "")
        if not pages:
            continue
        reads.append({
            "title": r.get("title") or r.get("type") or "Reading",
            "kind": r.get("type") or "",
            "pages": pages,
            "audio": source_of(r),
        })
    if reads:
        data["reads"] = reads
        i = add("story", "The unit story", "\U0001F4D6", "I read the unit story",
                "Choose something to read.",
                explain(
                    ["This is the reading this unit is built around."],
                    ["Pick one and press Read.",
                     "Press Listen and follow the words with your finger.",
                     "Press Next page when you are ready."],
                    ["The next step asks about the story.",
                     "You can come back and read it again any time."],
                    ["Pick one and press Listen."]),
                ["pick"])

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

    # ---- What this unit is for -------------------------------------------
    #         The unit's own outcomes, in the learner's words. `evidenceOfLearning`
    #         is deliberately NOT drawn here: it is prose written for an adult
    #         ("Observed through pointing, speaking, drawing...") and it belongs
    #         with the grown-up guide rather than on a five-year-old's page.
    outs = [(o.get("learningOutcome") or "").strip() for o in (unit.get("outcomes") or [])]
    outs = [x for x in outs if x]
    if outs:
        data["overview"] = {
            "title": unit["unit"].get("unitTitle") or "",
            "outcomes": outs,
            "counts": {
                "words": sum(len(g["words"]) for g in cw_unit["groups"]),
                "books": len(data.get("books") or []),
                "games": len((data.get("games") or {}).get("games") or []),
            },
        }
        i = add("overview", "What this unit is about", "\U0001F9ED", "I know what this unit is for",
                "What you will be able to do by the end.",
                explain(
                    ["This is what this unit is for."],
                    ["Read the list, or press Listen.",
                     "Every one of them is something you will be able to DO."],
                    ["You do not have to be able to do them yet.",
                     "That is what the unit is for."],
                    ["Have a read, then start."]),
                ())

    # ---- Looking back -----------------------------------------------------
    #         The unit's own selfAssessment statements, on their own authored
    #         scale. THE CHILD'S ANSWER AND NOTHING ELSE: no tick is inferred
    #         from the steps they finished, because the only per-outcome signal
    #         a learner has actually given is this one, and a page that guesses
    #         makes a confident claim about something nobody measured.
    #
    #         Not reported as a checkpoint either - a self-rating is a claim,
    #         not a mark, and sending "By myself" to a gradebook would turn a
    #         child's confidence into a grade.
    selfs = []
    for a in unit.get("selfAssessment") or []:
        statement = (a.get("statement") or "").strip()
        scale = [x.strip() for x in str(a.get("scale") or "").split("|") if x.strip()]
        if statement and scale:
            selfs.append({"id": a.get("selfAssessmentId") or statement[:40], "say": statement, "scale": scale})
    if selfs:
        data["reflect"] = selfs
        i = add("reflect", "How did I do?", "\U0001F31F", "I thought about my learning",
                "Say how you feel about each one.",
                explain(
                    ["This is you telling us how it went."],
                    ["Read each one.",
                     "Tap Not yet, With help, or By myself.",
                     "There is no right answer - it is what YOU think."],
                    ["Nobody is marking this.",
                     "Not yet is a fine answer, and it is the honest one at the start."],
                    ["Read the first one and tap."]),
                ["self"])

    # ---- Student resources -----------------------------------------------
    #         The drawer, not a step. Five things, all of which the shell
    #         course already offers from its own Student resources page
    #         (english.js :: studentResourceCards) - checked before building
    #         any of it, on the owner's instruction.
    #
    #         The core-words list is built here because the page already holds
    #         the unit's words and their meanings; the glossary is FETCHED at
    #         open time, because 995 entries with definitions and audio paths
    #         would be several hundred kilobytes in every one of ten pages.
    words_list = []
    for group in cw_unit["groups"]:
        entries = []
        for w in group["words"]:
            # word_obj() above already resolves this correctly, and my own
            # lookup did not: the dictionary entry carries `canonicalMeaning`
            # and an audio OBJECT, not `childMeaning` and a string, so every
            # word came out with a blank meaning and no clip. The unit's own
            # dictionaryLinks carry the kid-facing wording, which is what
            # word_obj prefers.
            o = word_obj(w)
            entries.append({"w": o["w"], "meaning": o["meaning"], "audio": o["audio"], "pic": o.get("pic", "")})
        if entries:
            words_list.append({"title": group.get("title") or "Words", "words": entries})

    if words_list:
        data["resources"] = {
            "words": words_list,
            # Only the words this alphabet can actually join. cursiveCanWrite
            # asks about the word AS SPELLED, so a capital or a digit drops out
            # rather than being animated as something it is not.
            # build_slides has the unit JSON rather than the number.
            "unit": unit["unit"]["unitNo"],
            "grade": 1,
            # The Word finder's pictures. The glossary is fetched at runtime
            # (hundreds of KB); this is 6.1 KB and cannot be fetched, because
            # wordPicture() is a shell function and there is no shell here.
            "pictures": glossary_pictures(),
            # Reference, not activities - a timetable and a letter to an adult.
            # Unit 10 authors no guide, so that card simply is not offered
            # there, the way the shell drops it from a unit that lacks one.
            "live": [{
                "no": x.get("sessionNo"), "week": x.get("week"),
                "title": (x.get("title") or "").strip(),
                "mins": x.get("durationMin"),
                "before": (x.get("beforeSession") or "").strip(),
                "agenda": (x.get("agenda") or "").strip(),
                "after": (x.get("afterSession") or "").strip(),
            } for x in (unit.get("liveSessions") or [])],
            "guide": ((unit.get("grownUpGuide") or {}).get("sections") and {
                "label": (unit["grownUpGuide"].get("label") or "Teacher & Parent Guide"),
                "intro": (unit["grownUpGuide"].get("intro") or "").strip(),
                "sections": [{"title": (sx.get("title") or "").strip(),
                              "body": (sx.get("body") or "").strip()}
                             for sx in unit["grownUpGuide"]["sections"]],
            }) or None,
        }
        i = add("resources", "Student resources", "\U0001F392", "I used my resources",
                "Your word lists, your plans, and a pencil and paper.",
                explain(
                    ["This is your drawer. Nothing in here is a step to finish."],
                    ["Open the word list to look a word up.",
                     "Open the plan to see what comes next.",
                     "Print a sheet if you want to write with a pencil."],
                    ["Come here whenever you like.",
                     "Nothing here can be got wrong."],
                    ["Have a look at what is in here."]),
                ["res"])

    emit_in_order()
    # The day-by-day lines are written LAST, because they list the unit's own
    # steps and those are only settled once emit_in_order has placed them. The
    # plan step itself is dropped from the list it appears in - a day that says
    # "read the plan" is a day spent reading the plan.
    if data.get("plan"):
        titles = [x["title"] for x in slides if x["kind"] != "plan"]
        data["plan"] = dict(data["plan"], days=plan_days(titles, data["plan"].get("weeks") or 2))
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

  /* SILENT WHILE THE DECK PAINTS. Every renderer draws once at load,
     because the deck puts all its slides in the DOM at once -- so a quiz
     that speaks its first question as it draws speaks it on page load,
     and with several quizzes on a page a child met a burst of overlapping
     questions before touching anything. Measured on Unit 1: 23 sound
     attempts in the first 165ms, eight of them paid TTS fetches.

     say() and playClip() return early while this is set. It is cleared
     immediately before show(0, false), which is the last statement here,
     so ONLY the draw pass is silenced -- every arrival clip, every
     instruction and every answer still plays exactly as before.

     playHere() already guarded this for the steps that used it; this is
     the same rule for the call sites that speak while drawing. */
  window.__ehelPainting = true;

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

%(speech)s

%(cursive)s

%(resources)s

  const STICKERS = %(stickers)s;

%(bootstrap)s
  window.__ehelPainting = false;   /* the draw pass is over: sound is allowed */
  show(0, false);

})();
</script>

<script type="module">
  /* THE PRONUNCIATION BRIDGE. The renderers above run in a classic IIFE and
     cannot import; the endpoint is declared once in shell/learner-controls.js
     so that check-platform-cors.mjs discovers and probes it. This hands the
     one function across. In local dev these modules 404 - they are deployed
     beside the pages, not beside the source - and speech.js falls back to the
     dev twin on 127.0.0.1, so a missing bridge here is expected there. */
  import { checkPronunciation } from "./learner-controls.js";
  window.__ehelCheckPronunciation = checkPronunciation;
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
            out.append('  unitReadings({ el: %s, items: LESSON.reads, finish: %d,\n'
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
        elif k == "reflect":
            out.append('  selfCheck({ el: %s, items: LESSON.reflect, unit: LESSON.unitNo,\n'
                       '    finish: %d, done: "Thank you for telling us." });' % (el, i))
        elif k == "resources":
            out.append('  studentResources({ el: %s, res: LESSON.resources, plan: LESSON.plan,\n'
                       '    finish: %d, done: "That is your drawer." });' % (el, i))
        elif k == "checkmid":
            out.append('  sequence({ el: %s, items: LESSON.quizmid, finish: %d,\n'
                       '    label: "Question", done: "That is the first half checked." });' % (el, i))
        elif k == "check":
            out.append('  sequence({ el: %s, items: LESSON.quiz, finish: %d,\n'
                       '    label: "Question", done: "That is the whole unit finished." });' % (el, i))
        elif k == "fluency":
            out.append('  sequence({ el: %s, items: LESSON.fluency, finish: %d,\n'
                       '    label: "Question", done: "That is this unit\'s words and patterns practised." });' % (el, i))
        elif k == "overview":
            out.append('  unitOverview({ el: %s, data: LESSON.overview, finish: %d,\n'
                       '    done: "Now you know what this unit is for." });' % (el, i))
        elif k == "plan":
            out.append('  unitPlan({ el: %s, plan: LESSON.plan, finish: %d,\n'
                       '    done: "You know what this unit looks like now." });' % (el, i))
        elif k == "lecture":
            out.append('  lectureStep({ el: %s, lecture: LESSON.lecture, finish: %d,\n'
                       '    done: "You watched the whole lesson." });' % (el, i))
        elif k == "games":
            out.append('  gameZone({ el: %s, pack: LESSON.games, finish: %d,\n'
                       '    done: "That is the Game Zone played." });' % (el, i))
        elif k == "bookquestions":
            out.append('  bookQuestions({ el: %s, items: LESSON.bookquestions, books: LESSON.books,\n'
                       '    finish: %d, done: "You answered the book questions." });' % (el, i))
        elif k == "activities":
            out.append('  activityList({ el: %s, items: LESSON.activities, finish: %d,\n'
                       '    done: "That is this unit\'s jobs done." });' % (el, i))
        elif k == "talk":
            out.append('  letUsTalk({ el: %s, items: LESSON.talk, finish: %d,\n'
                       '    label: "Round", done: "That is talking practised." });' % (el, i))
        elif k == "books":
            out.append('  bookShelf({ el: %s, items: LESSON.books, finish: %d,\n'
                       '    ask: "Choose a book to read.",\n'
                       '    done: "You finished a book from this unit\'s shelf." });' % (el, i))
    return "\n".join(out) + "\n"


def build(unit_no, manifest, cw, dic, css, voice, deck, english, books_js, games_js,
          speech_js, resources_js, ebooks, book_sets, lectures, schedule, release):
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

    # The schedule for THIS unit, plus the day lines, which need the step
    # titles - so it is finished after build_slides() below has named them.
    sched = (schedule or {}).get(str(unit_no)) or (schedule or {}).get(unit_no) or {}

    slides, stickers, data = build_slides(unit, cw_unit, pics, dic, games, games_meta,
                                          shelf, lecture, book_questions, talk_rounds, sched)
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
        "games": games_js, "speech": speech_js,
        "cursive": cursive_module(), "resources": resources_js,
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
    speech_js = io.open(os.path.join(LIB, "speech.js"), encoding="utf-8").read()
    resources_js = io.open(os.path.join(LIB, "resources.js"), encoding="utf-8").read()
    ebooks = ebook_catalog()
    book_sets = book_comprehension_sets()
    lectures = lecture_media()

    units = wanted or [u["number"] for u in manifest["units"]]
    print("\n  Building Grade 1 English lessons  (audio stamp %s)\n" % release)
    schedule = unit_schedule(manifest)
    built = [build(n, manifest, cw, dic, css, voice, deck, english, books_js, games_js, speech_js,
                   resources_js, ebooks,
                   book_sets, lectures, schedule, release) for n in units]
    print("\n  %d page(s). Now run the shared pipeline - see the docstring.\n" % len(built))


main()
