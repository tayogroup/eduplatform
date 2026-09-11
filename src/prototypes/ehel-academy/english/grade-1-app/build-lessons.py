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
    python build-lessons.py --app ../grade-2-app     # another grade's app

ONE BUILDER, EVERY GRADE. The builder lives here and reads the GRADE it is
building out of the target app's app.config.json: which course directory
(english/grade-N/data), which dictionary, which media prefix, which labels,
which course key - and which of that grade's Core-words strands feeds which
step (`strandRoles`, below). The pages are written into the target app's own
directory; lib/ is shared, so a fix to the deck or the voice reaches every
grade on its next build. It is NOT forked per grade: the Maths builds copied
a stylesheet per grade and the copies drifted within a week.

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
SHELL = os.path.join(ACADEMY, "shell", "subjects")
LIB = os.path.join(HERE, "lib")


def app_root(argv):
    """The app being built: --app <dir>, else this directory (Grade 1)."""
    if "--app" in argv:
        i = argv.index("--app")
        if i + 1 >= len(argv):
            sys.exit("REFUSED: --app needs a directory")
        return os.path.abspath(argv[i + 1])
    return HERE


OUT = app_root(sys.argv[1:])
_cfg_path = os.path.join(OUT, "app.config.json")
if not os.path.isfile(_cfg_path):
    sys.exit("REFUSED: no app.config.json in %s" % OUT)
CFG = json.load(io.open(_cfg_path, encoding="utf-8"))
if CFG.get("subject") != "english" or not isinstance(CFG.get("grade"), int):
    sys.exit("REFUSED: %s is not an English grade app (subject/grade)" % _cfg_path)
GRADE = CFG["grade"]
GRADE_LABEL = CFG.get("gradeLabel") or ("Grade %d" % GRADE)
COURSE_DIR = "grade-%d" % GRADE                     # english/grade-N, beside the apps
DATA = os.path.join(ACADEMY, "english", COURSE_DIR, "data")
if not os.path.isdir(DATA):
    sys.exit("REFUSED: no course data at %s" % DATA)

# WHICH CORE-WORDS STRAND FEEDS WHICH STEP. The steps are named for what a
# child does (hear the sounds, meet the new words, know the everyday words);
# the strands are named for how each grade's word list was authored, and the
# names differ by grade: Grade 1 has phonics / topic / sight, Grade 2 has
# spelling / joining and TWO topic groups per unit. A strand mapped to a role
# another strand already holds is MERGED into it - the words appended, the
# titles joined - rather than overwriting it, which is what a dict keyed on
# strand did silently. Unmapped strands keep their own name, so a grade that
# adds a strand no step reads simply does not draw it, the way Grade 1 units
# without a "sight" group draw no everyday-words step.
# "taskSteps": the unit's writing and speaking tasks as two steps of their own.
# Off unless an app turns it on. Grades 1-4 all do (Grade 4 first, Grades 1-3
# the same day, 2026-09-11); a grade built later decides for itself. See the
# build, below "write it".
TASK_STEPS = bool(CFG.get("taskSteps"))
STRAND_ROLES = CFG.get("strandRoles") or {"phonics": "phonics", "topic": "topic", "sight": "sight"}


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
        'for (const w of ws) { const p = wordPicture(w, %d); if (p) out[w] = p; }\n'
        'process.stdout.write(JSON.stringify(out));\n' % (src, GRADE)
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
    d = load_json(os.path.join(DATA, "master-dictionary.grade%d.json" % GRADE))
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

# The most words one "Meet the words" step walks. Grade 1's largest topic
# group is 14 (Unit 2), the size the owner walked through and accepted; a
# group longer than this is split into equal parts, each its own step. Grade
# 2 authors up to 27 words in one group (Unit 9) and two topic groups per
# unit - merged into one step that was 32 words on a single slide in Unit 8.
WORDS_PER_STEP = 14
# The fewest words a "Meet the words" step walks on its own. A smaller group
# joins its neighbour: Grade 3 authors five one-word topic groups (Unit 1's
# "Words: how we feel and how we treat people" is one word) and Grade 2 two
# more, each of which drew a step a child finishes in one tap.
WORDS_MIN_STEP = 4

# The longest answer a story question offers as a tappable option. 70 was set
# for Grade 1, whose answers are a few words ("Six years old"). Grades 3 and 4
# answer in full sentences - median 65 and 71 characters, three-quarters under
# 90 - so at 70 Grade 4's Unit 4 and Unit 10 built no story-question step at
# all and Grade 3's Units 4, 9 and 10 had three questions each. 110 admits
# eleven or twelve of every unit's twelve at Grades 3-4 while still refusing
# the two-clause answers a child cannot read as one option. Grades 1-2 keep 70.
STORY_ANSWER_MAX = 70 if GRADE <= 2 else 110

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
    # The unit's writing tasks IN FULL - see the build, below "write it". Only
    # an app whose app.config.json sets "taskSteps" has these two steps.
    "writetasks",
    "talk",           # "Let us talk" — say it out loud, and Azure checks it
    "speaktasks",
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
    return "../%s/" % COURSE_DIR + str(rel).replace("./", "", 1) if rel else ""


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
        # The framing sentence takes the title as an INSTRUCTION ("Your friend
        # wants you to introduce yourself by name"). Grade 1 titles are
        # written that way; Grade 2's are labels - "Asking Questions: Build
        # the Question", "Past Simple (verbs ending in -ed)" - and read into
        # the frame they are nonsense. A colon or a bracket is the label's
        # own signature, so such a title is refused rather than spoken.
        # Grade 1 has one, Unit 9's "Road words: Stop and Go", whose round
        # read "Your friend wants you to road words: Stop and Go" - refused
        # too, so that grade builds 60 rounds rather than the 61 the example
        # filter alone leaves.
        if ":" in title or "(" in title:
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
    "<instruction>: <ex1>. <ex2>. <ex3>." across all 10 Grade 1 units.

    ONLY SENTENCES A CHILD COULD SAY. That shape is Grade 1's: its practice
    lines are "Name three things: This is a pen. This is an apple." Grade 2's
    are worksheets - "Write he or she in each gap.\n1. This is my brother.
    ____ likes running. ... Check yourself: 1. He 2. She" - and the split
    after the first colon handed the answer KEY back as spoken examples ("He
    2.", "like 4."), which the talk step then asked a child to say to Azure.
    So a candidate has to look like speech: begins with a capital (or an
    opening quote), ends in . ! or ?, two to twelve words, and carries no
    blank, no numbered-item marker and no arrow.

    Measured on Grade 1: 64 rounds before, 61 after, and the three it drops
    were defects the old parse let through - two lists ("a window, a book, a
    friend.") and a frame with a blank in it ("Once upon a time there was a /
    an ___.") that the round asked a child to say aloud to the pronunciation
    check. On Grade 2 it passes only what really is a sentence (Unit 1's
    "How do you spell your name?"), and talk_items() then refuses the title
    those hang under - so the Grade 1 route yields nothing there and
    talk_items_from_rules() builds the step from the rule examples instead,
    rather than a "Let us talk" made of worksheet fragments.
    """
    text = grammar_item.get("practice") or ""
    if ":" not in text:
        return []
    # A WORKSHEET, not a line of spoken examples. Grade 3 writes practice as
    # pipe-separated items with an answer key ("... | Answer key: plays,
    # studies, rises, go, helps."), and one title ("Simple Present Tense")
    # got past the label test below, so Unit 4's "Let us talk" offered the
    # answer key as a sentence to say. None of Grade 1's sixty practice lines
    # has any of these marks (measured), so its rounds are unchanged.
    if "|" in text or re.search(r"answer key|check yourself|open-ended", text, re.I):
        return []
    tail = text.split(":", 1)[1].strip()
    out = []
    for p in [x.strip() for x in re.split(r"(?<=[.!?])\s+", tail) if x.strip()]:
        if not re.search(r"[A-Za-z]", p):
            continue
        p = p if p.endswith((".", "!", "?")) else p + "."
        if not speakable_example(p):
            continue
        out.append(p)
    return out


def speakable_example(p):
    if not re.match(r'^["\u201c\u2018\']?[A-Z]', p):
        return False
    if "___" in p or "\u2192" in p or re.search(r"(?<![\w.])\d+\.", p):
        return False
    return 2 <= len(p.split()) <= 12


_FLUENCY_TOOL = None


def fluency_tool():
    """tools/author-ehel-english-g1-fluency.py, the ONE definition of which
    sentences a Grade 2 grammar rule holds up (rule_sentences) and how its
    paired items pool into concepts (concept_pools). The fluency section and
    Let us talk are built from the same reading of the same field; a second
    copy here would drift from it the first time either was tuned."""
    global _FLUENCY_TOOL
    if _FLUENCY_TOOL is None:
        import importlib.util
        path = os.path.join(ACADEMY, "..", "..", "..", "tools", "author-ehel-english-g1-fluency.py")
        spec = importlib.util.spec_from_file_location("ehel_english_fluency", os.path.abspath(path))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        _FLUENCY_TOOL = mod
    return _FLUENCY_TOOL


def talk_items_from_rules(unit):
    """"Let us talk" where the grammar practice is a worksheet (Grade 2).

    talk_items() above needs a practice line of spoken examples under a
    title written as an instruction, and Grade 2 has neither. What it does
    have is `ruleAndExamples`, whose examples are real sentences of the
    pattern - "This is Leo. He likes football." - and a title that NAMES the
    pattern ("He and She: Choose the Pronoun"). So the round asks for the
    pattern by name and offers one sentence that shows it against sentences
    that show the unit's OTHER patterns; the child taps it and then says it,
    the same shape as the Grade 1 round.

    ONE ROUND PER CONCEPT, not per grammar item. Grade 2 authors its grammar
    in pairs ("He and She: Choose the Pronoun", "He and She: Introduce a
    Person") that teach one pattern twice under one conceptId; a round per
    item would offer the pair's other example as a distractor - a second
    correct answer. The pooling and the sentence parse are the fluency
    tool's (fluency_tool().concept_pools), so this step and the Fluency
    section read the rule the same way.
    """
    pools = fluency_tool().concept_pools(unit)
    pool = {n: s for n, s, _ in pools}
    why = {n: e for n, _, e in pools}
    bases = [n for n, _, _ in pools]
    rounds = []
    tool = fluency_tool()
    for i, b in enumerate(bases):
        answer = tool.pick_answer(b, pool[b])
        others = [x for x in bases if x != b]
        cands = []
        for step in range(6):
            for o in others:
                ex = pool[o]
                if step < len(ex):
                    pick = ex[(i + step) % len(ex)]
                    if pick not in cands and pick != answer and tool.fair_distractor(pick, b):
                        cands.append(pick)
        if len(cands) < 2:
            continue
        opts = cands[:2]
        opts.insert(i % 3, answer)
        rounds.append({
            "ask": "Your friend asks how to use \u201c%s\u201d. Which sentence shows it?" % b,
            "opts": [{"t": o, "ok": 1 if o == answer else 0} for o in opts],
            "why": why[b] or ("You would say: %s" % answer),
            "reference": answer,
        })
    return rounds


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
    """word (lowercase) -> its dictionaryLinks entry, taught groups only.

    A unit's dictionaryLinks carries the TAUGHT groups (Grade 1: one, titled
    "Core words"; Grade 2: four, one per strand) and one glossary group,
    "Words from our stories" - background vocabulary the unit reads but does
    not teach. The split is the shell's own (STORY_GLOSSARY_GROUP in
    english.js: every group but the glossary is taught), matched by TITLE
    rather than by id because the ids are per-unit ("g1-u1-core",
    "g2-u1-core-spelling", ...). Restricting to the taught groups is what the
    shell's own linkedWords()/wordsFor() do.
    """
    core_group_ids = {g["id"] for g in unit.get("vocabularyGroups", [])
                       if g.get("title") != "Words from our stories"}
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
    # A descriptor marked unavailable is a clip that must not be played - it
    # was deleted, or its words were rewritten and the recording still says
    # the old ones. Handing its path across would play it anyway, from the
    # CDN, over text that no longer matches; leaving it out makes playClip()
    # speak the field itself, which is the new wording by construction.
    if a.get("available") is False:
        return ""
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


def authored_distractors(item, n):
    """The item's own wrong options, where somebody wrote them.

    PREFERRED OVER THE POOL BELOW, and the reason is what the pool does to a
    story's questions. distractors() borrows the OTHER questions' answers
    about the same reading, so a reading's six questions rotate one small set
    between them: on the deployed Unit 4, three consecutive questions offered
    the same three options, each correct in turn, and a child who had answered
    two knew the third by elimination. Worse, the categories give it away -
    "Who is in this story?" beside a place and a food is not a question about
    the story at all.

    An authored list is same-category and drawn from the story's own world, so
    a wrong tap is a plausible reading of the story rather than a category
    error. Where a question has none, the pool below still applies.
    """
    got = [str(x).strip() for x in (item.get("distractors") or []) if str(x).strip()]
    return got[:n]


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
def join_titles(a, b):
    """"Words: time and family" + "Words: how we feel" ->
    "Words: time and family \u00b7 how we feel"."""
    if a.startswith("Words: ") and b.startswith("Words: "):
        b = b[len("Words: "):]
    return a + " \u00b7 " + b


def build_slides(unit, cw_unit, pics, dic, games, games_meta, shelf, lecture, book_questions,
                 talk_rounds, plan):
    """Return (slides, stickers, data) for one unit.

    A slide is only built where its content exists. Units 4, 7, 9 and 10 have
    no `sight` group and unit 7 and 9 no `topic` group, and an empty step is
    worse than an absent one: it can never be completed, and everything that
    counts steps would be counting one nobody can finish.
    """
    slides, stickers, data = [], [], {}

    # Every group this unit authors, by the ROLE its strand plays here. A
    # role can hold several groups (Grade 2's two topic groups); the sounds
    # and everyday-words steps take the role's groups merged into one, and
    # "Meet the words" draws one step per group - see it below.
    by_role = {}
    for g in cw_unit["groups"]:
        by_role.setdefault(STRAND_ROLES.get(g["strand"], g["strand"]), []).append(g)

    def merged(role):
        gs = by_role.get(role) or []
        if not gs:
            return None
        words = []
        for g in gs:
            words += [w for w in g["words"] if w not in words]
        return {"strand": role, "title": gs[0]["title"], "words": words}

    groups = {role: merged(role) for role in by_role}
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
        # "newwords-2" follows "newwords": a kind repeated with a numeric
        # suffix sits where STEP_ORDER places its base, in suffix order
        ordered = []
        for base in STEP_ORDER:
            ordered.append(base)
            ordered += sorted((k for k in pending if re.match(re.escape(base) + r"-\d+$", k)),
                              key=lambda k: int(k.rsplit("-", 1)[1]))
        for kind in ordered:
            spec = pending.get(kind)
            if not spec:
                continue
            # THE NUMBER IS THE LIST'S OWN LENGTH, not a counter. This used to
            # be a counter called `n`, and the story-questions round-robin
            # further down reused that name in this same function scope and
            # left it at the number of rounds it took to pick six questions -
            # six in most units, two to four in the rest. Every slide after it
            # was numbered from there: the child saw "7" on Unit 1's first
            # step, finish(i) ticked the dot six steps ahead, the last six
            # steps ticked nothing, ONSHOW and playHere never matched their
            # own slide, and the progress report named the wrong step. Nothing
            # could drift like that again only if there is no counter to
            # clobber; bootstrap() refuses a list numbered anything but 1..N.
            slides.append({
                "n": len(slides) + 1, "kind": spec["kind"], "title": spec["title"], "icon": spec["icon"],
                "ask": spec["ask"], "explain": spec["explain"], "extra": spec["extra"],
                "say": spec["say"], "note": spec["note"],
            })
            stickers.append([spec["icon"], spec["sticker"]])
        missing = [k for k in pending if re.sub(r"-\d+$", "", k) not in STEP_ORDER]
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
    # THREE is the floor, not four: an item is the word heard plus two
    # wrong words from the same group, so three words is the smallest group
    # that makes one. Four left Grade 2's Unit 10 (three spelling words) and
    # Grade 1's Unit 10 (three everyday words) without the step.
    if groups.get("phonics") and len(groups["phonics"]["words"]) >= 3:
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
    #         ONE STEP PER TOPIC GROUP, and a group longer than WORDS_PER_STEP
    #         is split into equal parts, each a step of its own ("Words: food,
    #         drink and nature (1 of 2)"). The content's own division comes
    #         first - each group keeps its own title - then the size cap.
    #         Grade 1 has one topic group per unit of at most 14 words, so it
    #         draws exactly the one step it always drew.
    topic_groups = list(by_role.get("topic") or [])
    if not topic_groups and groups.get("phonics"):
        # A unit missing a "topic" strand (Grade 1's 7 and 9) falls back to
        # the SAME words the Sounds step already drew from "phonics" -
        # reusing that group's own title too gave the deck two steps in a
        # row both headed "Phonics: th and ng", reading as one step
        # duplicated rather than two different things to do with the same
        # words.
        topic_groups = [dict(groups["phonics"], title="Meet the words")]
    # A group smaller than WORDS_MIN_STEP joins the next group (the previous
    # one, if it is last); the titles are joined without repeating "Words: ".
    folded = []
    pending_small = None
    for g in topic_groups:
        g = {"title": g["title"], "words": list(g["words"])}
        if pending_small:
            g = {"title": join_titles(pending_small["title"], g["title"]),
                 "words": pending_small["words"] + [w for w in g["words"] if w not in pending_small["words"]]}
            pending_small = None
        if len(g["words"]) < WORDS_MIN_STEP and len(topic_groups) > 1:
            pending_small = g
            continue
        folded.append(g)
    if pending_small:
        if folded:
            last = folded.pop()
            folded.append({"title": join_titles(last["title"], pending_small["title"]),
                           "words": last["words"] + [w for w in pending_small["words"] if w not in last["words"]]})
        else:
            folded.append(pending_small)
    topic_groups = folded
    parts = []
    for g in topic_groups:
        ws = list(g["words"])
        n_parts = max(1, -(-len(ws) // WORDS_PER_STEP))
        size = -(-len(ws) // n_parts)
        for p in range(n_parts):
            chunk = ws[p * size:(p + 1) * size]
            if chunk:
                parts.append((g["title"] + (" (%d of %d)" % (p + 1, n_parts) if n_parts > 1 else ""), chunk))
    for idx, (title, chunk) in enumerate(parts):
        # a second and later step of the same kind is "newwords-2", "-3"...:
        # emit_in_order() places them straight after the first, bootstrap()
        # reads LESSON[kind], and the sticker is the same one each time
        kind = "newwords" if idx == 0 else "newwords-%d" % (idx + 1)
        data[kind] = [word_obj(w) for w in chunk]
        i = add(kind, title, "\U0001F4D6", "I met the new words",
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
    if groups.get("sight") and len(groups["sight"]["words"]) >= 3:
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
        return len(ans) <= STORY_ANSWER_MAX

    factual = [c for c in unit["comprehension"] if is_factual(c)]

    # The neighbouring units' factual answers, nearest first - drawn on only
    # where this unit's own pool is too small to keep neighbours apart (below).
    neighbour_answers = []
    here = unit["unit"]["unitNo"]
    for other in (here + 1, here - 1, here + 2, here - 2):
        path = os.path.join(DATA, "units", "unit-%d.json" % other)
        if other >= 1 and os.path.isfile(path):
            neighbour_answers += [c for c in load_json(path).get("comprehension") or [] if is_factual(c)]

    # SORTED BY THE STORY THEY ARE ABOUT, in the unit's own reading order
    # (owner, 2026-09-10), so the first story's questions come first. The
    # authored comprehension already happens to be grouped that way, so today
    # this changes nothing - it is here so the grouping is guaranteed rather
    # than inherited, and it is what makes the order right if the selection
    # below is ever widened.
    #
    # Each item now carries the story's TITLE, which the deck draws above the
    # question. Resolved from the unit's readings rather than typed, so a
    # corrected title reaches the slide with no edit here.
    reading_order = {r["readingId"]: n for n, r in enumerate(unit.get("readings") or [])}
    reading_title = {r["readingId"]: (r.get("title") or "") for r in unit.get("readings") or []}
    factual.sort(key=lambda c: reading_order.get(c.get("readingId"), len(reading_order)))

    # SHARED EVENLY BETWEEN THE READINGS, as far as the content allows (owner,
    # 2026-09-10, asking for "three from each reading"). Taking the first six
    # gave every question to the FIRST reading in nine units of ten, because
    # the authored comprehension is grouped by reading and the first group is
    # six long.
    #
    # A LITERAL THREE-AND-THREE IS NOT POSSIBLE AND MUST NOT BE FORCED. The
    # second reading of each unit is the "Talk about ..." shared reading, and
    # its items are questionType "Point, act or say" - speaking tasks whose
    # answers are open templates ("My name is ___.", "This is a chair. (any
    # object named correctly)"). is_factual above excludes them on purpose,
    # and its own note says why: as a quiz option that asks a child to tap a
    # literal blank. Measured across Grade 1, the second readings hold 58
    # items and 11 of them are answerable as multiple choice - SIX units have
    # none at all. Forcing an even split there would either invent questions
    # or reintroduce exactly the defect the filter was written to stop.
    #
    # So: take one from each reading in turn until six are found. A reading
    # with three usable questions contributes three; one with two contributes
    # two; one with none is simply skipped and the others fill the space. Then
    # sort back into reading order, because the questions are still meant to
    # be GROUPED by story - round-robin decides WHICH, not what order.
    by_reading = {}
    for c in factual:
        by_reading.setdefault(c.get("readingId"), []).append(c)
    queues = [by_reading[r] for r in sorted(by_reading, key=lambda r: reading_order.get(r, len(reading_order)))]
    #
    # A PARTIAL LAST ROUND goes to the readings with the most usable
    # questions, not to the first readings in the unit. Grade 4 Unit 9 has
    # five readings, so the second round had one slot and it went to reading
    # one - and the Mombasa story, which carries five questions (two of them
    # written to teach viewpoint and setting, Stage 4 objectives nothing else
    # in the unit teaches), never got its second. The reading with the most
    # questions is the unit's main text; ties keep reading order.
    chosen, n = [], 0
    while len(chosen) < 6 and any(len(q) > n for q in queues):
        live = [q for q in queues if n < len(q)]
        room = 6 - len(chosen)
        if len(live) > room:
            live = sorted(live, key=lambda q: -len(q))[:room]   # stable: ties stay in reading order
        chosen.extend(q[n] for q in live)
        n += 1
    chosen.sort(key=lambda c: reading_order.get(c.get("readingId"), len(reading_order)))

    if len(factual) >= 3:
        items = []
        for k, c in enumerate(chosen):
            # authored wrong options first; the sibling-answer pool only fills
            # what an author has not written - see authored_distractors()
            wrong_text = authored_distractors(c, 2)
            if len(wrong_text) < 2:
                # NO AUTHORED OPTIONS (every Grade 2 and 3 question): the pool
                # is the unit's other answers, and taken in list order it is
                # the defect authored_distractors() describes - neighbouring
                # questions offering one small set, each right in turn, so a
                # child who answered two knows the third by elimination (Grade
                # 2's Unit 1 opened with two questions on the SAME three
                # options). So: answers to questions NOT shown in this step
                # first, never the answer of the question just before or just
                # after, and the pool rotated by position so no two
                # neighbours draw the same pair.
                near = {chosen[j]["correctAnswer"] for j in (k - 1, k + 1) if 0 <= j < len(chosen)}
                unseen = [x for x in factual if x not in chosen]
                seen = [x for x in chosen if x is not c]
                pool = [x for x in unseen + seen if x["correctAnswer"] not in near]
                if pool:
                    r = k % len(pool)
                    pool = pool[r:] + pool[:r]
                # A unit with too few answers of its own (Grade 3's Units 4, 9
                # and 10 have three, for three questions) cannot avoid sharing
                # however it rotates, so it borrows the neighbouring units'
                # answers ahead of its own near ones. A borrowed answer is from
                # another story - a plainer wrong option - which is the price of
                # a question that cannot be answered by elimination.
                if len(pool) < 4:
                    pool += neighbour_answers
                pool += [x for x in seen if x["correctAnswer"] in near]
                wrong_text += [x["correctAnswer"] for x in
                               distractors([x for x in pool if x is not c], c,
                                           2 - len(wrong_text), key=lambda x: x["correctAnswer"])]
            items.append({
                "ask": c["question"],
                "opts": [{"t": c["correctAnswer"], "ok": 1}] +
                        [{"t": t, "ok": 0} for t in wrong_text],
                "why": c.get("explanation") or "",
                "srcTitle": reading_title.get(c.get("readingId"), ""),
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

    # ---- 9b  the unit's writing and speaking tasks, in full ------------
    #         THE STEPS ABOVE REACH A SLICE OF THEM. "Write a sentence" turns
    #         the FIRST writing task that has a model into one tile sentence,
    #         and "Say it out loud" quotes model lines from the speaking
    #         tasks, six at most. Measured 2026-09-11: every unit in Grades
    #         1-4 carries six writing tasks and six speaking tasks (Grade 4
    #         seven in places), and those two steps reached 10 of 64 writing
    #         tasks and 20 of 61 speaking tasks across Grade 4, and 10 of 60
    #         and about 22 of 60 in each of Grades 1-3 - the rest were in
    #         the unit file and on no page of this build. That
    #         includes every task authored to close a Stage 4 objective
    #         (tools/author-english-g4-stage4-gaps.py): the playscript, the
    #         different ending, the attic description, Noah's diary and the
    #         drama task. A claim in the unit file is not teaching until a
    #         learner can open it.
    #
    #         THEY ARE PAPER WORK, like "Things to do": a paragraph, a
    #         playscript, a talk. Nothing here is marked and nothing
    #         pretends to be. The model text and the unit's own success
    #         criteria sit behind buttons, so a learner writes before they
    #         look.
    #
    #         A task not yet through curriculum review says so on its card,
    #         in the words the Fluency step uses for the same state.
    def task_title(t):
        return re.sub(r"^\s*(writing|speaking)\s+\d+\s*[:\-\u2013\u2014]\s*", "", t or "", flags=re.I).strip()

    def task_lines(t):
        return [x.strip() for x in str(t or "").split("\n") if x.strip()]

    def unreviewed(item):
        return str(item.get("reviewStatus") or "").lower().startswith("needs")

    if TASK_STEPS:
        wtasks = []
        for w in unit.get("writing") or []:
            prompt = task_lines(w.get("promptAndInstructions"))
            if not prompt:
                continue
            wtasks.append({
                "n": w.get("sequence") or (len(wtasks) + 1),
                "title": task_title(w.get("title")),
                "lines": prompt,
                "length": (w.get("expectedLength") or "").strip(),
                "model": (w.get("modelText") or "").strip(),
                "criteria": [c.strip() for c in re.split(r"\s*;\s*", w.get("successCriteria") or "") if c.strip()],
                "support": (w.get("support") or "").strip(),
                "extension": (w.get("extension") or "").strip(),
                "audio": source_of(w),
                "review": unreviewed(w),
            })
        if wtasks:
            data["writetasks"] = wtasks
            add("writetasks", "Write it yourself", "\U0001F4DD", "I did my writing",
                "Writing to do on paper.",
                explain(
                    ["These are this unit's writing tasks, for paper and a pencil."],
                    ["Choose one. Read it, or press Listen.",
                     "Write it on paper first.",
                     "Then press See an example, and Check my work."],
                    ["Nobody marks this page.",
                     "The checklist is how you mark your own work."],
                    ["Pick a task and write."]),
                ["tasks"])
        stasks = []
        for sp in unit.get("speaking") or []:
            lines = task_lines(sp.get("instructionsAndModelLines"))
            if not lines:
                continue
            stasks.append({
                "n": sp.get("sequence") or (len(stasks) + 1),
                "title": task_title(sp.get("title")),
                "lines": lines,
                "record": bool(sp.get("recordingRequired")),
                "audio": source_of(sp),
                "review": unreviewed(sp),
            })
        if stasks:
            data["speaktasks"] = stasks
            add("speaktasks", "Talk it through", "\U0001F3A4", "I did my speaking",
                "Speaking to do out loud.",
                explain(
                    ["These are this unit's speaking tasks."],
                    ["Choose one. Read it, or press Listen.",
                     "Do it out loud - with a partner, a grown-up, or on your own."],
                    ["Nobody is listening to you on this page.",
                     "Tick a task when you have done it."],
                    ["Pick a task and talk."]),
                ["tasks"])

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
            "grade": GRADE,
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
                # A guide section is a body, a list, or both - "What Your
                # Child Will Be Able to Do" and "Words We Will Learn" are
                # lists in every unit. The list used to be dropped here, so
                # those two sections drew as bare headings in the app while
                # the shell course drew their items.
                "sections": [{"title": (sx.get("title") or "").strip(),
                              "body": (sx.get("body") or "").strip(),
                              "items": [str(x).strip() for x in (sx.get("items") or []) if str(x).strip()]}
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
# THE FEEDBACK PARAGRAPH IS A LIVE REGION. `.fb` is where every renderer
# writes the answer to what the child just did - right or wrong, and why. It is
# painted in place, so a screen reader is never moved to it and would otherwise
# announce nothing at all: the question is read aloud on demand by the speaker
# button beside it, and the correction that follows was silent.
#
# role="status" carries polite+atomic on its own; both are stated anyway
# because the pair is what every renderer here depends on and a role that
# quietly changes its implicit values would take the announcement with it.
# atomic matters more than usual - the text is replaced wholesale each time
# ("Not quite." then a whole sentence of reason), and a non-atomic region
# announces only the diff.
#
# The attributes survive the renderers. Every one of them assigns
# `className = "fb good"` rather than touching classList, and className writes
# the class attribute alone - role and aria-live are untouched by it. Checked
# across english.js, books.js, deck.js and games.js before relying on it.
#
# One live region per slide is safe because the inactive slides are
# `display: none`, which takes them out of the accessibility tree entirely, so
# only the slide on screen can announce.
SLIDE = """    <section class="slide" data-explain='%(explain)s' data-say="%(say)s">
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

# THE DOCTYPE IS NOT DECORATION. Without it the browser renders in QUIRKS mode
# (document.compatMode "BackCompat"), a legacy box model these pages were never
# written for -- they were simply never given one. Measured before adding it:
# every element's box, font size, line height and padding is identical either
# way on this build, so the mode flip moves nothing.
#
# lang="en-GB" is what a screen reader reads the page WITH. Without it the
# reader guesses, and may pronounce English with another language's rules --
# on a course whose subject is English. British English, matching the course's
# own standing spelling rule.
#
# THE SKIP LINK IS FIRST IN THE BODY, AND IT HAS TO STAY THERE. A keyboard or
# screen-reader user meets the two sticky app bars and then the step-dot rail
# before any lesson content, on every one of the 23 steps - the dots alone are
# 23 tab stops in front of the thing they came to do. The link is written here,
# immediately before .wrap, because add-header-bars.py inserts the bars AT the
# index of `<div class="wrap">`: anything above that line stays above them.
# Moving this below .wrap, or letting a later pipeline step insert ahead of it,
# silently makes it the second thing focused and it stops being a skip link.
#
# The deck is <main>, not the .wrap around it. .wrap has to keep its exact
# `<div class="wrap">` spelling - that literal string is add-header-bars.py's
# only anchor, and that tool is shared with the two Mathematics lesson builds,
# so renaming it here to gain a landmark would reach two other apps. The deck
# is also the better destination: it skips the dot rail as well as the bars,
# which .wrap would not.
#
# tabindex="-1" is what makes the link move FOCUS and not just the scroll
# position. Without it the browser scrolls to the deck and leaves focus on the
# link, so the next Tab goes back into the chrome the user just asked to skip.
# -1 is focusable-but-not-tabbable, so it adds no tab stop of its own.
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
      <p class="eyebrow">Ehel Academy &middot; %(gradeLabel)s English &middot; Unit %(unit)d</p>
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
     %(title)s - %(gradeLabel)s English, Unit %(unit)d.

     GENERATED by english/grade-1-app/build-lessons.py from
     english/%(courseDir)s/data. Do not hand-edit: the next build overwrites it,
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
    for idx, s in enumerate(slides):
        n = s["n"]
        i = n - 1
        if i != idx:
            # A slide numbered anything but its own position sends finish(),
            # the dots, the stickers and the progress report to a different
            # step - see emit_in_order() for the day that happened.
            sys.exit("REFUSED: slide %d (%s) is numbered %d, so finish(%d) would mark "
                     "another step's dot." % (idx, s["title"], n, i))
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
        elif k == "newwords" or k.startswith("newwords-"):
            out.append('  wordWalk({ el: %s, items: LESSON[%s], finish: %d,\n'
                       '    ask: "Say this word out loud.", label: "Word",\n'
                       '    done: "Now you have met them, you will see them all through the unit." });'
                       % (el, json.dumps(k), i))
        elif k == "match":
            out.append('  pictureMatch({ el: %s, items: LESSON.match, finish: %d,\n'
                       '    ask: "Which word is this?", label: "Picture",\n'
                       '    done: "You can read those words on their own now." });' % (el, i))
        elif k == "story":
            out.append('  unitReadings({ el: %s, items: LESSON.reads, finish: %d,\n'
                       '    done: "You read the whole story." });' % (el, i))
        elif k == "questions":
            # attemptOnly: the story questions are authored ORAL and their
            # wrong options are borrowed from the other questions about the
            # same story, so the tally measures elimination rather than
            # comprehension. Reported as participation, never as a mark -
            # see the note at the report in the deck's sequence().
            out.append('  sequence({ el: %s, items: LESSON.questions, finish: %d, attemptOnly: true,\n'
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
        elif k in ("writetasks", "speaktasks"):
            out.append('  taskList({ el: %s, items: LESSON.%s, finish: %d, write: %s,\n'
                       '    done: %s });' % (el, k, i, "true" if k == "writetasks" else "false",
                                            json.dumps("That is your writing done." if k == "writetasks"
                                                       else "That is your speaking done.")))
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
    shelf = [b for b in ebooks if GRADE in b.get("grades", [])
             and (not b.get("units") or unit_no in b["units"])]
    shelf_ids = {b["id"] for b in shelf}

    # bookComprehensionQuestions(): the shell's own lookup, grade + unit.
    # Filtered to books this unit's shelf actually carries, because a
    # question about a book the child was never given is unanswerable - and
    # a `picture` question needs every one of its three candidate pages to
    # be a book on the shelf, not just the right one.
    qset = next((s for s in book_sets if s.get("grade") == GRADE and s.get("unit") == unit_no), None)
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

    # the Grade 1 shape first (spoken examples under an instruction title),
    # then the rule examples where that yields nothing - see both functions
    talk_rounds = talk_items(unit) or talk_items_from_rules(unit)

    # The schedule for THIS unit, plus the day lines, which need the step
    # titles - so it is finished after build_slides() below has named them.
    sched = (schedule or {}).get(str(unit_no)) or (schedule or {}).get(unit_no) or {}

    slides, stickers, data = build_slides(unit, cw_unit, pics, dic, games, games_meta,
                                          shelf, lecture, book_questions, talk_rounds, sched)
    data = {k: v for k, v in data.items() if not k.endswith("_slide")}
    data["audioRelease"] = release
    data["grade"] = GRADE
    data["gradeLabel"] = GRADE_LABEL
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
        "gradeLabel": GRADE_LABEL, "courseDir": COURSE_DIR,
        "slides": body,
        "data": json.dumps(data, ensure_ascii=False, indent=2).replace("\n", "\n  "),
        "voice": voice, "deck": deck, "english": english, "books": books_js,
        "games": games_js, "speech": speech_js,
        "cursive": cursive_module(), "resources": resources_js,
        "stickers": json.dumps(stickers, ensure_ascii=False),
        "bootstrap": bootstrap(slides, data),
    }
    name = slugify(title) + ".html"
    io.open(os.path.join(OUT, name), "w", encoding="utf-8", newline="").write(page)
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
    if TASK_STEPS:
        # Appended, not always inlined: an app without "taskSteps" (Grades
        # 1-3) must build exactly the bytes it built before, and a function
        # and stylesheet nothing calls would still change every page.
        english += "\n" + io.open(os.path.join(LIB, "tasks.js"), encoding="utf-8").read()
        css += io.open(os.path.join(LIB, "tasks.css"), encoding="utf-8").read()
    ebooks = ebook_catalog()
    book_sets = book_comprehension_sets()
    lectures = lecture_media()

    units = wanted or [u["number"] for u in manifest["units"]]
    print("\n  Building %s English lessons -> %s  (audio stamp %s)\n" % (GRADE_LABEL, OUT, release))
    schedule = unit_schedule(manifest)
    built = [build(n, manifest, cw, dic, css, voice, deck, english, books_js, games_js, speech_js,
                   resources_js, ebooks,
                   book_sets, lectures, schedule, release) for n in units]
    print("\n  %d page(s). Now run the shared pipeline - see the docstring.\n" % len(built))


if __name__ == "__main__":
    main()
