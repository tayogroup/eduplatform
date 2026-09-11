# -*- coding: utf-8 -*-
"""Give every Grade 1 English unit a learning-time estimate.

WHY THIS EXISTS. The content validation of 2026-09-09 searched all ten units
for `duration`, `minutes`, `estimatedTime`, `timeEstimate` and `screenTime` and
found none of them. The only time anywhere in the data was `durationMin: 30` on
the six live sessions per unit, which describes a teacher-led class, not
self-paced work. A parent planning an afternoon, a teacher planning a week and
a learner deciding whether to start had nothing to plan against.

WHAT THIS IS NOT. These are not measured times. Nobody has been timed doing
these lessons. They are an arithmetic estimate from the content that is
actually there, using the rate table below, and every unit is written with
`"status": "provisional"` so no surface can present them as observed fact.
Replace the rates with real observation when you have it: change RATES, re-run,
and every unit updates together.

THE RATES ARE THE JUDGEMENT, and they are in one place on purpose. They are
what a reviewer should argue with -- not the arithmetic, which is trivial, and
not the counts, which are measured. Each is seconds per item for a Stage 1
learner working with support, and each carries the reasoning for its number.

    python estimate-learning-time.py --dry     # report, write nothing
    python estimate-learning-time.py           # write learningTime into each unit
    python estimate-learning-time.py --grade 3 --dry   # another grade

ONE RATE MOVES WITH THE GRADE: reading speed (READING_WPM below). Everything
else is a count of what a unit contains times a per-item rate, and those rates
describe the kind of work (a spoken answer, a written sentence) more than the
reader. Reading does not: a Stage 3 reader following a narrated line moves
faster than a Stage 1 one, and the Grade 3 readings are 12,205 words against
Grade 1's 4,334, so carrying 60 words a minute up the grades would roughly
double the reading estimate at Grade 3 for no reason but the table. The
per-grade figures sit below published oral-reading norms for first-language
readers at the same age (roughly 60 / 100 / 110 words a minute at the end of
Years 1-3) because these learners are reading an additional language with
support. They are the provisional judgement the rest of this table is, and
belong to the same reviewer.
"""
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def grade_arg(argv):
    if "--grade" in argv:
        i = argv.index("--grade")
        if i + 1 >= len(argv) or not argv[i + 1].isdigit():
            sys.exit("REFUSED: --grade needs a number")
        return int(argv[i + 1])
    return 1


GRADE = grade_arg(sys.argv[1:])
UNITS = os.path.join(HERE, "..", "grade-%d" % GRADE, "data", "units")
# supported reading speed for this grade, words a minute - see the docstring
READING_WPM = {1: 60, 2: 75, 3: 90, 4: 100, 5: 110}
# Grade 5 (2026-09-11) continues the series rather than falling back to Grade
# 1's 60.
#
# WRITING FROM GRADE 5 IS PRICED FROM EACH TASK'S OWN LENGTH, not at the flat
# 90 seconds below. Grade 1's rate is for a sentence formed letter by letter;
# a Grade 5 task is "Two to three organised paragraphs", "150 to 250 words",
# "One procedural text of eight to twelve steps", and 90 seconds for that put
# the whole unit's writing at 9 minutes. Every task states its length in
# expectedLength, so the words are read from there (writing_words below) and
# written at WRITING_WPM, a supported composing speed for a ten-year-old in an
# additional language, plus WRITING_OVERHEAD to plan and check. Grades 1-4 keep
# the flat rate, so their stored estimates do not move. Same provisional status,
# same reviewer.
WRITING_FROM_LENGTH_GRADE = 5
WRITING_WPM = 8
WRITING_OVERHEAD = 240          # seconds: plan before, reread after
NUMBER_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8,
                "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "twenty": 20, "thirty": 30, "forty": 40,
                "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90, "a": 1}
# words per unit of length, where a task counts in something other than words
UNIT_WORDS = {"paragraph": 70, "sentence": 12, "line": 7, "step": 12, "page": 150, "fact": 12,
              "box": 15, "answer": 25, "response": 25, "section": 70,
              "scene": 60}
DEFAULT_TASK_WORDS = 100        # a length the parse cannot read: a planning frame, a poster

# seconds per item -- see the note above before changing one
RATES = {
    # heard, repeated, and checked against a picture; the word show gives each
    # word its own beat rather than running a list past the child
    "vocabulary_word": 20,
    # 60 words per minute is supported Stage 1 reading -- the child is following
    # a narrated line, not decoding alone -- plus 30s to settle into the passage
    "reading_wpm": 60,
    "reading_setup": 30,
    # most are oral: the child answers aloud to an adult, which is slower than
    # tapping and is the point of the section
    "comprehension_q": 45,
    "quiz_q": 40,
    # deliberate revision of something already met, so faster than first contact
    "fluency_q": 30,
    "activity": 60,
    "speaking": 60,
    # the only section where a six-year-old is forming letters
    "writing": 90,
    "grammar": 60,
}


def count_words(text):
    return len(re.findall(r"[A-Za-z']+", text or ""))


def _number(tok):
    tok = tok.lower()
    return int(tok) if tok.isdigit() else NUMBER_WORDS.get(tok)


def writing_words(length):
    """How many words a task's expectedLength asks for.

    "150 to 250 words" -> 200; "Two paragraphs of about sixty words each" ->
    120; "Eight to twelve sentences" -> 10 x 12; "One procedural text of eight
    to twelve steps" -> 10 x 12. Every counted part of the length is added, so
    "Three paragraphs plus greeting and sign-off" counts the paragraphs and
    "A revised legend plus four sentences of reflection" the sentences it can
    see; a length with nothing countable in it gets DEFAULT_TASK_WORDS."""
    text = (length or "").lower().replace("-", " ")
    num = r"(\d+|%s)" % "|".join(sorted(NUMBER_WORDS, key=len, reverse=True))
    m = re.search(r"%s\s+(?:to|-)\s+%s\s+words" % (num, num), text)
    if m:
        return (_number(m.group(1)) + _number(m.group(2))) / 2.0
    m = re.search(r"%s\s+(\w+?)s?\s+of\s+(?:about\s+|roughly\s+)?%s\s+words" % (num, num), text)
    if m:
        return _number(m.group(1)) * _number(m.group(3))
    m = re.search(r"(?:about|roughly)?\s*%s\s+words" % num, text)
    if m:
        return float(_number(m.group(1)))
    found = []
    for m in re.finditer(r"%s(?:\s+(?:to|-)\s+%s)?\s+(?:\w+\s+){0,2}?(%s)s?\b"
                         % (num, num, "|".join(UNIT_WORDS)), text):
        lo = _number(m.group(1))
        hi = _number(m.group(2)) if m.group(2) else lo
        found.append((m.start(), m.end(), (lo + hi) / 2.0, UNIT_WORDS[m.group(3)]))
    # "One paragraph of four to six sentences" is ONE measure, not two: the
    # outer count multiplies the inner one instead of adding a paragraph's worth
    total, i = 0.0, 0
    while i < len(found):
        start, end, count, per = found[i]
        nxt = found[i + 1] if i + 1 < len(found) else None
        if nxt and re.fullmatch(r"\s+of\s+(?:about\s+|roughly\s+)?", text[end:nxt[0]]):
            total += count * nxt[2] * nxt[3]
            i += 2
            continue
        total += count * per
        i += 1
    return total or float(DEFAULT_TASK_WORDS)


def writing_seconds(task):
    return WRITING_OVERHEAD + round(writing_words(task.get("expectedLength")) * 60 / WRITING_WPM)


def estimate(unit):
    """Seconds per section, from what the unit actually contains."""
    sec = {}
    # THE TAUGHT WORDS ONLY. "Words from our stories" is the story glossary -
    # looked up while reading, never walked as a step (the shell's own
    # taughtGroups() leaves it out) - and counting it put Grade 3's vocabulary
    # at 84 minutes a unit for a learner who meets about 30 Core words. Grade
    # 1's stored estimates predate this line and count it; re-running Grade 1
    # would lower its vocabulary figure.
    sec["vocabulary"] = sum(
        len(g.get("vocabularyIds") or []) for g in unit.get("vocabularyGroups") or []
        if g.get("title") != "Words from our stories"
    ) * RATES["vocabulary_word"]
    reading = 0
    for r in unit.get("readings") or []:
        w = count_words(r.get("passageScript"))
        reading += RATES["reading_setup"] + round(w * 60 / READING_WPM.get(GRADE, RATES["reading_wpm"]))
    sec["readings"] = reading
    sec["comprehension"] = len(unit.get("comprehension") or []) * RATES["comprehension_q"]
    sec["quiz"] = len(unit.get("quizzes") or []) * RATES["quiz_q"]
    sec["fluency"] = len(unit.get("fluency") or []) * RATES["fluency_q"]
    sec["activities"] = len(unit.get("activities") or []) * RATES["activity"]
    sec["speaking"] = len(unit.get("speaking") or []) * RATES["speaking"]
    if GRADE >= WRITING_FROM_LENGTH_GRADE:
        sec["writing"] = sum(writing_seconds(w) for w in unit.get("writing") or [])
    else:
        sec["writing"] = len(unit.get("writing") or []) * RATES["writing"]
    sec["grammar"] = len(unit.get("grammar") or []) * RATES["grammar"]
    return sec


def block(unit):
    sec = estimate(unit)
    total = sum(sec.values())
    live = sum(int(s.get("durationMin") or 0) for s in unit.get("liveSessions") or [])
    return {
        "status": "provisional",
        "basis": "arithmetic from the unit's own counts using the rate table in "
                 "grade-1-app/estimate-learning-time.py; not observed timings"
                 + ("" if GRADE == 1 else "; reading at %d words a minute" % READING_WPM.get(GRADE, RATES["reading_wpm"]))
                 + ("" if GRADE < WRITING_FROM_LENGTH_GRADE else
                    "; writing from each task's expectedLength at %d words a minute plus %d minutes to plan and check"
                    % (WRITING_WPM, WRITING_OVERHEAD // 60)),
        "generatedFrom": "content",
        "sectionMinutes": {k: max(1, round(v / 60)) for k, v in sorted(sec.items()) if v},
        "selfPacedMinutes": round(total / 60),
        "liveSessionMinutes": live,
        "totalMinutes": round(total / 60) + live,
    }


def main():
    argv = list(sys.argv[1:])
    if "--grade" in argv:
        i = argv.index("--grade")
        del argv[i:i + 2]
    flags = [a for a in argv if a.startswith("--")]
    for f in flags:
        if f != "--dry":
            print("unknown argument %s" % f)
            return 2
    dry = "--dry" in flags
    paths = sorted(
        (p for p in os.listdir(UNITS) if re.fullmatch(r"unit-\d+\.json", p)),
        key=lambda p: int(re.search(r"\d+", p).group()),
    )
    print("  unit   self-paced   live   total   sections")
    tot_self = tot_all = 0
    for name in paths:
        p = os.path.join(UNITS, name)
        unit = json.load(io.open(p, encoding="utf-8"))
        b = block(unit)
        tot_self += b["selfPacedMinutes"]
        tot_all += b["totalMinutes"]
        print("  %-8s %5d min %6d %7d   %s" % (
            name.replace(".json", ""), b["selfPacedMinutes"], b["liveSessionMinutes"],
            b["totalMinutes"], ", ".join("%s %d" % (k, v) for k, v in b["sectionMinutes"].items())))
        if not dry:
            if unit.get("learningTime") == b:
                continue
            unit["learningTime"] = b
            io.open(p, "w", encoding="utf-8", newline="\n").write(
                json.dumps(unit, ensure_ascii=False, indent=2) + "\n")
    print("")
    print("  grade total: %d min self-paced (%.1f h), %d min with live classes (%.1f h)"
          % (tot_self, tot_self / 60, tot_all, tot_all / 60))
    print("  across 10 units over a school year")
    if dry:
        print("\n  --dry: nothing written")
    return 0


sys.exit(main())
